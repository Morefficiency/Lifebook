/**
 * Today's reading.
 *
 * A short page assembled from the person's own words, meant to be read once in
 * the morning and closed: the identity to hold today, the belief it replaces
 * and what the record says about it, the area carrying most of the distance
 * with their own line for it, whatever is due by the cadence they chose, and
 * one question from the record if there is one.
 *
 * What it is not, on purpose, and by the app's own laws:
 *
 *   not a streak     nothing here counts days, and missing one shows nothing
 *   not a nag        there is no notification; the page exists when opened
 *   not a score      the page describes; it does not grade the day
 *   not random       the identity rotates by the date, so it is the same all
 *                    day, changes tomorrow, and two devices agree
 *
 * Law 2 — the game is played offline — is the whole design. The page ends by
 * telling the person to close it.
 */
import type { AppState, HeldBelief, LifeArea, PracticeItem, PracticeLog, TargetIdentity } from '../types';
import { areaRows, rankedRows } from './overview';
import { beliefCredence, type BeliefCredence } from './credence';
import { offers, type Offer } from './patterns';

const DAY_MS = 86_400_000;
/** A weekly practice is due again once this many days have passed since its last log. */
export const WEEKLY_AFTER_DAYS = 7;

/** Whole days since the epoch for the ISO date of `nowIso`, ignoring the time. */
export function dayIndexOf(nowIso: string): number {
  const date = nowIso.slice(0, 10);
  return Math.floor(Date.parse(`${date}T00:00:00.000Z`) / DAY_MS);
}

/**
 * The practices that are due today.
 *
 * Daily is always due. Weekly is due once a week has passed since it was last
 * logged, or if it never has been. "When it shows up" is never scheduled — it
 * is the person's to notice, not the app's to list. Inactive items are set
 * aside and stay that way.
 *
 * When an identity is being held today, its practices come first, and the
 * affirmations of the *other* identities are left off: a person holds one
 * sentence a day, and a morning page that recites three is a page nobody
 * reads. Behaviours from the other identities stay — a thing that is due is
 * due whichever sentence is being held.
 */
export function duePractices(
  items: PracticeItem[],
  logs: PracticeLog[],
  nowIso: string,
  heldIdentityId: string | null = null,
): PracticeItem[] {
  const lastLog = new Map<string, string>();
  for (const l of logs) {
    const prev = lastLog.get(l.itemId);
    if (!prev || l.ts > prev) lastLog.set(l.itemId, l.ts);
  }
  const today = dayIndexOf(nowIso);
  const due = items.filter((p) => {
    if (!p.active) return false;
    if (heldIdentityId && p.identityId !== heldIdentityId && p.kind === 'affirmation') return false;
    if (p.cadence === 'daily') return true;
    if (p.cadence === 'weekly') {
      const last = lastLog.get(p.id);
      if (!last) return true;
      return today - dayIndexOf(last) >= WEEKLY_AFTER_DAYS;
    }
    return false;
  });
  if (!heldIdentityId) return due;
  // Stable partition: the held identity's items first, original order kept.
  return [...due.filter((p) => p.identityId === heldIdentityId), ...due.filter((p) => p.identityId !== heldIdentityId)];
}

export interface TodayReading {
  /** The ISO date the reading is for. */
  date: string;
  identity: TargetIdentity | null;
  belief: HeldBelief | null;
  /** What the record says about that belief, if it has been tested enough to say. */
  credence: BeliefCredence | null;
  area: { area: LifeArea; statement: string; current: number | null; importance: number | null } | null;
  due: PracticeItem[];
  question: Offer | null;
}

export function todayReading(state: AppState, nowIso: string): TodayReading {
  const lb = state.lifebook;
  const owned = lb.identities.filter((i) => i.text.trim().length > 0);
  const identity = owned.length ? owned[dayIndexOf(nowIso) % owned.length]! : null;
  const belief = identity?.replacesBeliefId
    ? lb.beliefs.find((b) => b.id === identity.replacesBeliefId && b.status === 'confirmed') ?? null
    : null;
  const credence = belief
    ? beliefCredence([belief], state.quests, state.reports)[0] ?? null
    : null;

  const rows = areaRows(lb.visions, lb.currents);
  const top = rankedRows(rows)[0] ?? null;
  const statement = top ? lb.visions.find((v) => v.area === top.area)?.statement.trim() ?? '' : '';
  const area = top
    ? { area: top.area, statement, current: top.current, importance: top.importance }
    : null;

  return {
    date: nowIso.slice(0, 10),
    identity,
    belief,
    credence,
    area,
    due: duePractices(lb.practices, lb.practiceLogs, nowIso, identity?.id ?? null),
    question: offers(state)[0] ?? null,
  };
}
