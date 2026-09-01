/**
 * What is waiting, and how old it has got.
 *
 * The app has no reminders, no notifications and no streaks, and those are not
 * omissions to be worked around — §13 bans them, and the reasons are good. So
 * there is exactly one honest way to give somebody a reason to come back: when
 * they do come back, the page has to be straight with them about what it is
 * still holding and how old its own figures are.
 *
 * That is provenance, not nagging, and the distinction is worth stating because
 * the line is easy to cross:
 *
 *   A streak rewards consecutive days and punishes a break. Never.
 *   A reminder arrives uninvited and asks for attention. Never.
 *   "You placed this in March" is the mirror saying when it was made — the
 *   same sentence the map already carries about itself, applied to time.
 *
 * Three rules hold everything here:
 *
 *   Nothing surfaces on day one. Every item has an age threshold, because a
 *   page that has something waiting the moment you finish is a page that always
 *   has something waiting, which is a to-do list with a self-image theme.
 *
 *   Nothing is ever a count of what you owe. Each item is one specific thing,
 *   named, with somewhere to go — never "3 items need attention".
 *
 *   Nothing here says you failed. A test still out is a test still out. An old
 *   placement is old, not neglected.
 */
import type { AppState, LifeArea } from '../types';
import { isPredictionBroken } from './scoring';

/** A quest can be out in the world a while before it is worth mentioning. */
export const TEST_OUT_AFTER_DAYS = 7;
/**
 * Broken predictions against one belief before revisiting it is worth offering.
 *
 * Counted only SINCE the person last said the belief was his. Without that
 * clause the line is permanent: somebody who reads it, thinks about it and
 * decides he still holds the belief would be told the same thing on every
 * visit for the rest of the app's life, which is a nag arriving by the back
 * door. Re-ruling on a belief moves its timestamp, so the count starts again
 * and the band goes quiet until the person's own week says something new.
 */
export const CONTRADICTED_AT = 2;
/** How long before "where this area is" is presenting an old answer as current. */
export const PLACEMENT_STALE_AFTER_DAYS = 120;
/** The map is explicitly a picture of one day. This is when to say which day. */
export const MAP_STALE_AFTER_DAYS = 180;

export type WaitingKind =
  /** A quest was forged and never reported on. */
  | 'test_out'
  /** A belief the user still holds that his own evidence has contradicted. */
  | 'belief_contradicted'
  /** An area placed long enough ago that the dial may be drawing an old number. */
  | 'placement_stale'
  /** The conflict map is from a while back. */
  | 'map_stale';

export interface WaitingItem {
  kind: WaitingKind;
  /** Whole days since the thing in question happened. */
  days: number;
  questId?: string;
  beliefId?: string;
  /** For a contradicted belief: how many times it has been wrong. */
  broken?: number;
  area?: LifeArea;
}

export function daysBetween(fromIso: string, toIso: string): number {
  const from = Date.parse(fromIso);
  const to = Date.parse(toIso);
  if (!Number.isFinite(from) || !Number.isFinite(to)) return 0;
  return Math.max(0, Math.floor((to - from) / 86_400_000));
}

/**
 * Ordered by how much it earns being said, not by age.
 *
 * A belief the person's own week has contradicted twice comes first and is the
 * whole reason this module exists: it is the one thing here that is genuinely
 * news about them rather than housekeeping about the data.
 */
const RANK: Record<WaitingKind, number> = {
  belief_contradicted: 0,
  test_out: 1,
  placement_stale: 2,
  map_stale: 3,
};

export function whatIsWaiting(state: AppState, nowIso: string): WaitingItem[] {
  const items: WaitingItem[] = [];
  const lb = state.lifebook;

  // A belief that has been wrong more than once and is still held. The app does
  // not get to retire it — only the user does — so this is an invitation to
  // look again, never a correction applied on his behalf.
  //
  // Only the first report against a quest counts, for the same reason it does
  // in evidence.ts: a second is a correction to the record, not a second test.
  const questById = new Map(state.quests.map((q) => [q.id, q]));
  const counted = new Set<string>();
  const brokenSince = new Map<string, { n: number; lastTs: string }>();
  for (const report of state.reports) {
    const quest = questById.get(report.questId);
    if (!quest?.beliefId || counted.has(quest.id)) continue;
    counted.add(quest.id);
    if (!isPredictionBroken(quest, report)) continue;
    const prev = brokenSince.get(quest.beliefId);
    brokenSince.set(quest.beliefId, {
      n: (prev?.n ?? 0) + 1,
      lastTs: !prev || report.ts > prev.lastTs ? report.ts : prev.lastTs,
    });
  }

  for (const belief of lb.beliefs) {
    if (belief.status !== 'confirmed') continue;
    // Evidence from before he last ruled on it has already been considered by
    // the person it belongs to.
    const since = state.reports.filter((r) => {
      const q = questById.get(r.questId);
      return q?.beliefId === belief.id && r.ts > belief.ts && isPredictionBroken(q, r);
    });
    const questsSeen = new Set(since.map((r) => r.questId));
    if (questsSeen.size < CONTRADICTED_AT) continue;
    const lastTs = since.map((r) => r.ts).sort()[since.length - 1]!;
    items.push({
      kind: 'belief_contradicted',
      days: daysBetween(lastTs, nowIso),
      beliefId: belief.id,
      broken: questsSeen.size,
    });
  }

  // Quests forged and never answered. Reporting is the mechanism, so an
  // unreported quest is the loop left open rather than a chore left undone.
  for (const quest of state.quests) {
    if (quest.status !== 'active') continue;
    const answered = state.reports.some((r) => r.questId === quest.id);
    if (answered) continue;
    const days = daysBetween(quest.createdTs, nowIso);
    if (days < TEST_OUT_AFTER_DAYS) continue;
    items.push({ kind: 'test_out', days, questId: quest.id });
  }

  // The oldest placement only. Twelve rows of "this is old" is a chore list;
  // one is a fact about the figure at the centre of the dial.
  const oldest = lb.currents
    .map((c) => ({ area: c.area, days: daysBetween(c.ts, nowIso) }))
    .filter((c) => c.days >= PLACEMENT_STALE_AFTER_DAYS)
    .sort((a, b) => b.days - a.days)[0];
  if (oldest) items.push({ kind: 'placement_stale', days: oldest.days, area: oldest.area });

  // The map already tells people it is a picture of one day. This says which.
  const ratingTimes = state.pairRatings.map((r) => r.ts).sort();
  const lastRating = ratingTimes.length > 0 ? ratingTimes[ratingTimes.length - 1] : undefined;
  if (lastRating) {
    const days = daysBetween(lastRating, nowIso);
    if (days >= MAP_STALE_AFTER_DAYS) items.push({ kind: 'map_stale', days });
  }

  return items.sort((a, b) => RANK[a.kind] - RANK[b.kind] || b.days - a.days);
}

/**
 * At most two, because the point is to give somebody one thing worth doing —
 * a list of five is the to-do list this deliberately is not.
 */
export const WAITING_SHOWN = 2;

export function waitingToShow(state: AppState, nowIso: string): WaitingItem[] {
  return whatIsWaiting(state, nowIso).slice(0, WAITING_SHOWN);
}
