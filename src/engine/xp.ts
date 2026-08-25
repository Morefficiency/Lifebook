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
import type { AppState } from '../types';
import { calibration, isPredictionBroken } from './scoring';

export const XP_UNITS = {
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

const LINE_META: Record<XpSource, { label: string; explain: string }> = {
  mirror_completed: {
    label: 'Mirror completed',
    explain: 'Paid once, for rating every pair honestly enough to produce a map.',
  },
  fork: {
    label: 'Fork decisions with a written note',
    explain: `Paid per fault line you took a decision on and wrote at least ${FORK_NOTE_MIN} characters about. The articulation is the intervention, so an unwritten decision pays nothing.`,
  },
  step_done: {
    label: 'Steps completed',
    explain: 'Paid per implementation-intention step you marked done. Small on purpose: effort is not evidence.',
  },
  field_report: {
    label: 'Field reports filed',
    explain: 'Paid per report, whichever way the outcome went. Filing the result is the behaviour being paid for.',
  },
  epistemic_bonus: {
    label: 'Feared outcome happened, and you wrote what it taught',
    explain: 'Paid when the thing you feared actually occurred and you logged the learning. Information about the world is worth more than a comfortable result.',
  },
  prediction_broken: {
    label: 'PREDICTION BROKEN',
    explain: 'Paid when you forecast the feared outcome at 60% or more and it did not happen. This is the largest single event in the app, because a disconfirmed prediction is the only thing here that reliably moves a belief.',
  },
  pair_rerating: {
    label: 'Pairs re-rated after evidence',
    explain: 'Paid when you go back and change a pair rating because something you did in the real world told you it was wrong.',
  },
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

  const counts: Record<XpSource, number> = {
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
    'prediction_broken', 'epistemic_bonus', 'field_report', 'fork',
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

export const LEVELS: LevelDef[] = [
  { xp: 0, name: 'Surveyor', meaning: 'You are taking the measurements. Nothing has been tested yet.' },
  { xp: 100, name: 'Cartographer', meaning: 'You have a map of your own goals and you have started acting on it.' },
  { xp: 250, name: 'Field Scientist', meaning: 'You are running experiments in the real world and filing what happened.' },
  { xp: 500, name: 'Experimenter', meaning: 'You have enough reports that patterns in your own predictions are visible.' },
  { xp: 900, name: 'Calibrated', meaning: 'Your forecasts now have a track record you can check them against.' },
  { xp: 1500, name: 'Cartographer of the Deep', meaning: 'You have mapped, tested and revised the same territory more than once.' },
];

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

export const BADGES: Badge[] = [
  { id: 'first_light', name: 'First Light', description: 'You rated every pair and looked at the result.' },
  { id: 'first_contact', name: 'First Contact', description: 'You filed your first field report from the real world.' },
  { id: 'prediction_broken', name: 'Prediction Broken', description: 'You forecast the feared outcome at 60% or more and it did not happen.' },
  { id: 'serial_falsifier', name: 'Serial Falsifier', description: 'Ten broken predictions on the record.' },
  { id: 'resistance_was_right', name: 'The Resistance Was Right', description: 'You released a goal that was no longer yours. That is a result, not a retreat.' },
  { id: 'held_not_hidden', name: 'Held, Not Hidden', description: 'You named a tension you are choosing to carry instead of pretending it is gone.' },
  { id: 'cold_reader', name: 'Cold Reader', description: 'Calibration of 85 or better across at least ten reports.' },
  { id: 'deep_breath', name: 'Deep Breath', description: 'You attempted a quest you had rated 9 or 10 for dread.' },
];

const BADGE_BY_ID = new Map(BADGES.map((b) => [b.id, b]));

export function earnedBadgeIds(state: AppState): string[] {
  const ids: string[] = [];
  const questById = new Map(state.quests.map((q) => [q.id, q]));
  const broken = state.reports.filter((r) => {
    const q = questById.get(r.questId);
    return !!q && isPredictionBroken(q, r);
  }).length;
  const cal = calibration(state.quests, state.reports);

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
