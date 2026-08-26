/**
 * §9 — XP economy, levels, badges.
 *
 * XP is derived from state on every read rather than accumulated in a counter.
 * That makes it impossible for the displayed number to drift from the evidence
 * behind it, and it lets every point be itemised on tap (Design Law 5).
 *
 * There is no decay, no quota, no streak, no randomness and nothing to spend it
 * on. The single largest event is a disconfirmed negative prediction (+50),
 * never task completion (Design Law 3).
 */
import { S } from '../strings';
import type { AppState } from '../types';
import { calibration, isPredictionBroken } from './scoring';

export const XP_UNITS = {
  // Lifebook. Stage completion is a one-time setup payment, deliberately small:
  // finishing a stage is progress through the app, not evidence from the world,
  // and six stages at a generous rate would have made setup outweigh everything
  // that actually happened (Design Law 3).
  lifebook_stage: 10,
  belief_owned: 15,
  identity_set: 15,
  practice_logged: 20,
  // v1 — the goal-conflict map and the evidence loop
  step_done: 10,
  field_report: 15,
  epistemic_bonus: 25,
  prediction_broken: 50,
  fork: 15,
  mirror_completed: 40,
  pair_rerating: 5,
} as const;

export type XpSource = keyof typeof XP_UNITS;

export interface XpLine {
  source: XpSource;
  label: string;
  /** Why this event pays what it pays — shown verbatim in the "how is this computed" popover. */
  explain: string;
  count: number;
  unit: number;
  xp: number;
}

export interface XpBreakdown { total: number; lines: XpLine[] }

/** A fork decision only pays once it carries the required ≥20-character note. */
export const FORK_NOTE_MIN = 20;

const LINE_META = S.xpLines;

/** Ledger kinds that are paid one unit per entry. */
const LEDGER_PAID: Partial<Record<XpSource, string>> = {
  lifebook_stage: 'lifebook_stage',
  belief_owned: 'belief_owned',
  identity_set: 'identity_set',
  practice_logged: 'practice_logged',
};

/** Number of ledger entries recording a pair re-rating prompted by evidence. */
function pairReratingCount(state: AppState): number {
  return state.ledger.filter(
    (e) => e.kind === 'reassessment'
      && typeof e.payload === 'object' && e.payload !== null
      && (e.payload as { type?: string }).type === 'pair_rerating',
  ).length;
}

export function computeXp(state: AppState): XpBreakdown {
  const questById = new Map(state.quests.map((q) => [q.id, q]));

  const ledgerCount = (kind: string) => state.ledger.filter((e) => e.kind === kind).length;

  const counts: Record<XpSource, number> = {
    lifebook_stage: ledgerCount(LEDGER_PAID.lifebook_stage!),
    belief_owned: ledgerCount(LEDGER_PAID.belief_owned!),
    identity_set: ledgerCount(LEDGER_PAID.identity_set!),
    practice_logged: ledgerCount(LEDGER_PAID.practice_logged!),
    mirror_completed: state.profile.mirrorCompletedTs ? 1 : 0,
    fork: state.forks.filter((f) => f.note.trim().length >= FORK_NOTE_MIN).length,
    step_done: state.quests.reduce((acc, q) => acc + q.steps.filter((s) => s.done).length, 0),
    field_report: state.reports.length,
    epistemic_bonus: state.reports.filter(
      (r) => r.fearedOutcomeOccurred && r.learning.trim().length > 0,
    ).length,
    prediction_broken: state.reports.filter((r) => {
      const q = questById.get(r.questId);
      return !!q && isPredictionBroken(q, r);
    }).length,
    pair_rerating: pairReratingCount(state),
  };

  const order: XpSource[] = [
    'prediction_broken', 'epistemic_bonus', 'practice_logged', 'lifebook_stage',
    'belief_owned', 'identity_set', 'field_report', 'fork',
    'mirror_completed', 'step_done', 'pair_rerating',
  ];

  const lines: XpLine[] = order.map((source) => {
    const unit = XP_UNITS[source];
    const count = counts[source];
    return { source, ...LINE_META[source], count, unit, xp: count * unit };
  });

  return { total: lines.reduce((a, l) => a + l.xp, 0), lines };
}

/* --------------------------------- levels --------------------------------- */

export interface LevelDef { xp: number; name: string; meaning: string }

/** Thresholds are product decisions (§9); the words come from the locale file. */
const LEVEL_XP = [0, 100, 250, 500, 900, 1500] as const;

export const LEVELS: LevelDef[] = LEVEL_XP.map((xp, i) => ({
  xp,
  name: S.levels[i]!.name,
  meaning: S.levels[i]!.meaning,
}));

export interface LevelState {
  index: number;
  name: string;
  meaning: string;
  at: number;
  nextAt: number | null;
  nextName: string | null;
  xpIntoLevel: number;
  xpForLevel: number | null;
  progress: number; // 0…1
}

export function levelFor(xp: number): LevelState {
  let index = 0;
  for (let i = 0; i < LEVELS.length; i += 1) if (xp >= LEVELS[i]!.xp) index = i;
  const cur = LEVELS[index]!;
  const next = LEVELS[index + 1] ?? null;
  const xpIntoLevel = xp - cur.xp;
  const xpForLevel = next ? next.xp - cur.xp : null;
  return {
    index,
    name: cur.name,
    meaning: cur.meaning,
    at: cur.xp,
    nextAt: next?.xp ?? null,
    nextName: next?.name ?? null,
    xpIntoLevel,
    xpForLevel,
    progress: xpForLevel ? Math.min(1, xpIntoLevel / xpForLevel) : 1,
  };
}

/* --------------------------------- badges --------------------------------- */

export interface Badge { id: string; name: string; description: string }

/** Order is the order they are displayed in; the copy comes from the locale file. */
const BADGE_IDS = [
  'first_vision', 'named_it', 'first_instance', 'ten_instances',
  'first_light', 'first_contact', 'prediction_broken', 'serial_falsifier',
  'resistance_was_right', 'held_not_hidden', 'cold_reader', 'deep_breath',
] as const;

export const BADGES: Badge[] = BADGE_IDS.map((id) => ({ id, ...S.badges[id] }));

const BADGE_BY_ID = new Map(BADGES.map((b) => [b.id, b]));

export function earnedBadgeIds(state: AppState): string[] {
  const ids: string[] = [];
  const questById = new Map(state.quests.map((q) => [q.id, q]));
  const broken = state.reports.filter((r) => {
    const q = questById.get(r.questId);
    return !!q && isPredictionBroken(q, r);
  }).length;
  const cal = calibration(state.quests, state.reports);

  const lb = state.lifebook;
  const instances = lb.practiceLogs.length;
  if (lb.visions.filter((v) => v.statement.trim().length > 0).length >= 3) ids.push('first_vision');
  if (lb.beliefs.some((b) => b.status === 'confirmed')) ids.push('named_it');
  if (instances >= 1) ids.push('first_instance');
  if (instances >= 10) ids.push('ten_instances');

  if (state.profile.mirrorCompletedTs) ids.push('first_light');
  if (state.reports.length >= 1) ids.push('first_contact');
  if (broken >= 1) ids.push('prediction_broken');
  if (broken >= 10) ids.push('serial_falsifier');
  if (state.forks.some((f) => f.choice === 'release')) ids.push('resistance_was_right');
  if (state.forks.some((f) => f.choice === 'carry')) ids.push('held_not_hidden');
  if (cal.n >= 10 && (cal.score ?? 0) >= 85) ids.push('cold_reader');
  if (state.quests.some((q) => q.fearRating >= 9 && q.steps.some((s) => s.done))) ids.push('deep_breath');

  return ids;
}

export function earnedBadges(state: AppState): Badge[] {
  return earnedBadgeIds(state).flatMap((id) => {
    const b = BADGE_BY_ID.get(id);
    return b ? [b] : [];
  });
}

export function badgeById(id: string): Badge | undefined {
  return BADGE_BY_ID.get(id);
}
