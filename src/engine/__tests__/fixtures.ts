/**
 * Hand-computed worked example — written BEFORE src/engine/ existed.
 *
 * Every expected value in this file and in the sibling test files was computed
 * by hand from the formulas in §8 of coherence-v1-build-spec.md. The engine was
 * then written to satisfy these numbers. Arithmetic is shown inline so a
 * reviewer can re-derive it without running the code.
 *
 * THE MATRIX — 4 strivings, all 6 unordered pairs rated, 3 negative edges
 * (two of them carrying heat), 2 positive edges, 1 zero edge.
 *
 *   ids sort as  s1 < s2 < s3 < s4  (canonical order aId < bId)
 *
 *   s1  "…build my business to replace my salary"     (work)
 *   s2  "…be more present with my partner"            (partner)
 *   s3  "…keep training 4×/week"                      (health)
 *   s4  "…save enough to stop worrying about money"   (money)
 *
 *   pair      effect   heat   c_ij = |effect| × (1 + heat/10)
 *   ------------------------------------------------------------
 *   s1–s2       -2       8    2 × (1 + 0.8) = 2 × 1.8 = 3.6
 *   s1–s3       -1       3    1 × (1 + 0.3) = 1 × 1.3 = 1.3
 *   s1–s4       +2       –    (positive: no conflict load)
 *   s2–s3        0       –    (zero edge: not drawn, contributes nothing)
 *   s2–s4       +1       –    (positive)
 *   s3–s4       -1       0    1 × (1 + 0.0) = 1 × 1.0 = 1.0
 *
 *   Σ c_ij            = 3.6 + 1.3 + 1.0 = 5.9
 *   Σ positive effect = 2 + 1           = 3
 *
 *   G = 5.9 / (5.9 + 3) = 5.9 / 8.9 = 0.66292134831…  → 66.29213483…%  → 66%
 *
 *   Node conflict centrality  C_i = Σ c_ij over negative incident edges
 *     C_1 = 3.6 + 1.3       = 4.9   ← argmax  ⇒ LOAD-BEARING NODE is s1
 *     C_2 = 3.6             = 3.6
 *     C_3 = 1.3 + 1.0       = 2.3
 *     C_4 = 1.0             = 1.0
 *
 *   Node facilitation strength  F_i = Σ effect over positive incident edges
 *     F_1 = 2,  F_2 = 1,  F_3 = 0,  F_4 = 2 + 1 = 3
 *
 *   Hottest edge = max heat  ⇒  s1–s2 (heat 8)
 *
 *   Facilitation clusters (connected components of the positive-edge subgraph):
 *     {s1, s2, s4} via s1–s4 and s2–s4  → 3 nodes, summed effect 3   ← largest
 *     {s3}                              → 1 node,  summed effect 0
 */
import { emptyLifebook } from '../../types';
import type {
  AppState, FieldReport, PairRating, Quest, Striving,
} from '../../types';

export const TS = '2026-01-15T10:00:00.000Z';

export const s1: Striving = { id: 's1', text: 'build my business to replace my salary', area: 'work', createdTs: TS, status: 'active' };
export const s2: Striving = { id: 's2', text: 'be more present with my partner', area: 'partner', createdTs: TS, status: 'active' };
export const s3: Striving = { id: 's3', text: 'keep training 4×/week', area: 'health', createdTs: TS, status: 'active' };
export const s4: Striving = { id: 's4', text: 'save enough to stop worrying about money', area: 'money', createdTs: TS, status: 'active' };

export const STRIVINGS: Striving[] = [s1, s2, s3, s4];

export const RATINGS: PairRating[] = [
  { aId: 's1', bId: 's2', effect: -2, heat: 8, ts: TS },
  { aId: 's1', bId: 's3', effect: -1, heat: 3, ts: TS },
  { aId: 's1', bId: 's4', effect: 2, ts: TS },
  { aId: 's2', bId: 's3', effect: 0, ts: TS },
  { aId: 's2', bId: 's4', effect: 1, ts: TS },
  { aId: 's3', bId: 's4', effect: -1, heat: 0, ts: TS },
];

/** Hand-computed constants, restated so tests read as assertions not derivations. */
export const EXPECTED = {
  c12: 3.6,
  c13: 1.3,
  c34: 1.0,
  totalConflictLoad: 5.9,
  totalFacilitation: 3,
  G: 5.9 / 8.9, // 0.66292134831460674…
  Gpercent: 66,
  C: { s1: 4.9, s2: 3.6, s3: 2.3, s4: 1.0 },
  F: { s1: 2, s2: 1, s3: 0, s4: 3 },
  loadBearingId: 's1',
  hottestEdge: { aId: 's1', bId: 's2', heat: 8 },
  largestClusterIds: ['s1', 's2', 's4'],
} as const;

/* ------------------------------------------------------------------------- *
 * THREE QUEST / REPORT SCENARIOS
 *
 * Q1 — PREDICTION BROKEN
 *   forecastP 80, fearRating 8, feared outcome did NOT occur (o = 0).
 *   Broken?  80 ≥ 60 AND !occurred  →  YES  → +50 XP
 *   Steps: 3 defined, 2 done        →  +20 XP
 *   Field report filed              →  +15 XP
 *   Epistemic bonus                 →  no (feared outcome did not occur)
 *   Courage                         →  YES (fearRating 8 ≥ 7 and ≥1 step done)
 *   Brier term  (0.80 − 0)² = 0.64
 *
 * Q2 — FEARED OUTCOME OCCURRED, WITH LEARNING
 *   forecastP 30, fearRating 4, feared outcome DID occur (o = 1), learning written.
 *   Broken?  occurred                →  NO
 *   Steps: 2 defined, 1 done         →  +10 XP
 *   Field report filed               →  +15 XP
 *   Epistemic bonus (occurred + learning logged) → +25 XP
 *   Courage                          →  no (fearRating 4 < 7)
 *   Brier term  (0.30 − 1)² = 0.49
 *
 * Q3 — BELOW-THRESHOLD FORECAST
 *   forecastP 45, fearRating 9, feared outcome did NOT occur (o = 0).
 *   Broken?  45 < 60                 →  NO  (the point of this scenario: a good
 *            outcome on a forecast you never really believed is not evidence
 *            against a belief, so it pays no jackpot)
 *   Steps: 2 defined, 0 done         →  +0 XP
 *   Field report filed               →  +15 XP
 *   Epistemic bonus                  →  no (feared outcome did not occur)
 *   Courage                          →  no (fearRating 9 ≥ 7 but 0 steps done —
 *            courage is behaviour, and nothing was attempted)
 *   Deep Breath badge                →  no, for the same reason
 *   Brier term  (0.45 − 0)² = 0.2025
 *
 *   Brier B = (0.64 + 0.49 + 0.2025) / 3 = 1.3325 / 3 = 0.4441666…
 *   Calibration = round((1 − 0.4441666…) × 100) = round(55.58333…) = 56
 *   n = 3 ⇒ sufficient (threshold is ≥ 3 reports)
 *
 *   TOTAL XP for this fixture state:
 *     mirror completed                  +40
 *     1 fork decision with note         +15
 *     3 steps done (2 + 1 + 0)          +30
 *     3 field reports                   +45
 *     1 epistemic bonus                 +25
 *     1 PREDICTION BROKEN               +50
 *     1 pair re-rating after evidence    +5
 *                                     ------
 *                                       210   → level "Cartographer" (100 ≤ 210 < 250)
 * ------------------------------------------------------------------------- */

const step = (id: string, done: boolean): Quest['steps'][number] => ({
  id, ifCue: 'it is 09:00 on Tuesday', thenAction: 'send the first outreach message',
  done, ...(done ? { doneTs: TS } : {}),
});

export const q1: Quest = {
  id: 'q1',
  edge: { aId: 's1', bId: 's2' },
  wish: 'Ask for two evenings a week that are only ours',
  outcome: 'We both stop bracing for the laptop to open after dinner',
  obstacle: 'I tell myself that asking makes me look uncommitted to the business',
  beliefHypothesis: 'If I protect two evenings, my revenue will fall behind this month',
  steps: [step('q1a', true), step('q1b', true), step('q1c', false)],
  fearRating: 8,
  forecastP: 80,
  fearedOutcomeText: 'This month’s revenue comes in below last month’s',
  status: 'reported',
  createdTs: TS,
};

export const q2: Quest = {
  id: 'q2',
  edge: { aId: 's1', bId: 's3' },
  wish: 'Train at 07:00 before the inbox opens',
  outcome: 'Four sessions land without eating into client hours',
  obstacle: 'I check email in bed and the morning is gone',
  beliefHypothesis: 'Training in the morning will cost me a client response window',
  steps: [step('q2a', true), step('q2b', false)],
  fearRating: 4,
  forecastP: 30,
  fearedOutcomeText: 'A client waits more than four hours for a reply',
  status: 'reported',
  createdTs: TS,
};

export const q3: Quest = {
  id: 'q3',
  edge: { aId: 's3', bId: 's4' },
  wish: 'Cancel the gym contract and train outdoors',
  outcome: 'Same training, forty euros a month back',
  obstacle: 'I assume I will simply stop going if there is no contract',
  beliefHypothesis: 'Without a paid contract I will not train at all',
  steps: [step('q3a', false), step('q3b', false)],
  fearRating: 9,
  forecastP: 45,
  fearedOutcomeText: 'I train fewer than three times in the next two weeks',
  status: 'reported',
  createdTs: TS,
};

export const QUESTS: Quest[] = [q1, q2, q3];

export const r1: FieldReport = {
  id: 'r1', questId: 'q1', fearedOutcomeOccurred: false,
  whatHappened: 'I asked on Sunday and she said yes immediately, which I did not expect at all.',
  learning: '', ts: TS,
};
export const r2: FieldReport = {
  id: 'r2', questId: 'q2', fearedOutcomeOccurred: true,
  whatHappened: 'One client waited five hours on Thursday and sent a second, sharper message.',
  learning: 'It cost one uncomfortable exchange. I can set an auto-reply that names the window.',
  ts: TS,
};
export const r3: FieldReport = {
  id: 'r3', questId: 'q3', fearedOutcomeOccurred: false,
  whatHappened: 'I trained five times outdoors in the two weeks after cancelling the contract.',
  learning: '', ts: TS,
};

export const REPORTS: FieldReport[] = [r1, r2, r3];

export const BRIER = {
  terms: [0.64, 0.49, 0.2025],
  B: 1.3325 / 3, // 0.44416666666666665
  calibration: 56,
} as const;

/** Full state matching the XP arithmetic in the comment block above. */
export function fixtureState(): AppState {
  return {
    version: 1,
    lifebook: emptyLifebook(),
    profile: {
      xp: 0, badges: [],
      consent: { notTherapyAck: true, dataLocalAck: true, ts: TS },
      initialConflictLoad: 5.9,
      mirrorCompletedTs: TS,
    },
    values: { chosen: ['honesty', 'craft', 'family'], reflection: 'I told a client the truth about a slipped deadline.', ts: TS },
    strivings: STRIVINGS,
    pairRatings: RATINGS,
    forks: [{
      id: 'f1', edge: { aId: 's1', bId: 's2' }, choice: 'challenge',
      note: 'I keep treating presence and revenue as a zero-sum trade and I have never actually checked that.',
      ts: TS,
    }],
    quests: QUESTS,
    reports: REPORTS,
    ledger: [
      { id: 'l1', ts: TS, kind: 'mirror_completed', payload: {} },
      { id: 'l2', ts: TS, kind: 'reassessment', payload: { type: 'pair_rerating', aId: 's1', bId: 's2' } },
    ],
  };
}
