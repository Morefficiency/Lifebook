/**
 * Hand-computed worked example for the Lifebook engine.
 *
 * Written before src/engine/gap.ts and src/engine/beliefs.ts existed. The
 * expected numbers below were worked out on paper from the formulas in
 * lifebook-v2-spec.md §4; the engine was then written to satisfy them.
 *
 * FOUR AREAS RATED
 *
 *   area      importance   current   gap = (10 − current)/9   tension = imp × gap
 *   -------------------------------------------------------------------------
 *   work           5           3      7/9 = 0.77778           3.88889   ← highest
 *   money          3           2      8/9 = 0.88889           2.66667
 *   health         4           6      4/9 = 0.44444           1.77778
 *   partner        5           8      2/9 = 0.22222           1.11111   ← lowest
 *
 *   Σ tension = 3.88889 + 2.66667 + 1.77778 + 1.11111 = 9.44444
 *   Σ importance = 5 + 3 + 4 + 5 = 17
 *   Life gap = 9.44444 / 17 = 0.555555…  →  56%
 *
 *   Note money has the largest raw gap but work has the largest tension,
 *   because tension is what you want weighted by how far off it is. The
 *   priority order is work, money, health, partner.
 */
import type { AreaCurrent, AreaVision, LifeArea, ProbeAnswer } from '../../types';
import type { BeliefCandidate } from '../../content/beliefs';
import type { Probe } from '../../content/probes';

export const TS = '2026-03-01T09:00:00.000Z';

const vision = (area: LifeArea, importance: 1 | 2 | 3 | 4 | 5): AreaVision => ({
  area, statement: `vision for ${area}`, markers: [], importance, ts: TS,
});
const current = (area: LifeArea, score: number): AreaCurrent => ({
  area, score, description: `current ${area}`, ts: TS,
});

export const VISIONS: AreaVision[] = [
  vision('work', 5), vision('money', 3), vision('health', 4), vision('partner', 5),
];
export const CURRENTS: AreaCurrent[] = [
  current('work', 3), current('money', 2), current('health', 6), current('partner', 8),
];

export const EXPECTED_GAP = {
  work: 7 / 9,
  money: 8 / 9,
  health: 4 / 9,
  partner: 2 / 9,
  tension: { work: 5 * (7 / 9), money: 3 * (8 / 9), health: 4 * (4 / 9), partner: 5 * (2 / 9) },
  sumTension: 9.444444444444443,
  sumImportance: 17,
  lifeGapPercent: 56,
  priority: ['work', 'money', 'health', 'partner'] as LifeArea[],
} as const;

/* -------------------------------------------------------------------------- *
 * BELIEF SCORING — a small synthetic catalogue, so the arithmetic is testable
 * without depending on the wording of the real content.
 *
 *   score = probeTerm × 0.7 + (rawArea / maxArea) × 0.3
 *   probeTerm = rawProbe / (rawProbe + EVIDENCE_HALF_POINT)
 *
 * where maxArea is 5 per rated area the candidate claims — 5 being the largest
 * possible tension, importance 5 × gap 1.
 *
 * The AREA term is normalised, and that normalisation is the point: without it
 * a candidate listed against eight areas beats a candidate listed against two
 * purely by being listed more often.
 *
 * The PROBE term is deliberately NOT normalised per candidate, and this is the
 * correction of a real bug. It used to divide by the most that candidate could
 * possibly score across the whole bank — which meant a belief the bank barely
 * asks about saturated its own small denominator and outranked a belief with
 * three times the actual evidence behind it. Measured against the real
 * catalogue, a person who answered all eleven probes pointing at `not_enough`
 * (23 raw points) was told his leading belief was `im_an_impostor` (9 raw
 * points, but only three probes' worth of ceiling to fill).
 *
 * Saturation fixes the ordering without restoring the opposite failure: more
 * raw evidence always ranks higher, and the curve flattens so no single
 * emphatic answer can run away with it.
 * -------------------------------------------------------------------------- */

export const TEST_PROBES: Probe[] = [
  {
    id: 'p1', kind: 'behaviour', question: 'p1', multi: false,
    options: [
      // 'wide' mirrors alpha exactly, so the only thing that can separate them
      // in the normalisation test below is how many areas each one claims.
      { id: 'a', label: 'a', weights: { alpha: 3, beta: 1, wide: 3 } },
      { id: 'b', label: 'b', weights: { alpha: 1, wide: 1 } },
      { id: 'c', label: 'c', weights: {} },
    ],
  },
  {
    id: 'p2', kind: 'history', question: 'p2', multi: true,
    options: [
      { id: 'a', label: 'a', weights: { alpha: 2, beta: 2, wide: 2 } },
      { id: 'b', label: 'b', weights: { beta: 3 } },
      { id: 'c', label: 'c', weights: {} },
    ],
  },
];

export const TEST_CATALOGUE: BeliefCandidate[] = [
  {
    id: 'alpha', text: 'alpha belief', cost: 'alpha cost',
    areas: ['work', 'money'], identity: 'alpha identity', identityWhy: 'because',
    practices: [{ kind: 'affirmation', text: 'alpha affirmation', cadence: 'daily' }],
  },
  {
    id: 'beta', text: 'beta belief', cost: 'beta cost',
    areas: ['partner'], identity: 'beta identity', identityWhy: 'because',
    practices: [{ kind: 'behaviour', text: 'beta behaviour', cadence: 'weekly' }],
  },
  {
    id: 'gamma', text: 'gamma belief', cost: 'gamma cost',
    areas: ['health'], identity: 'gamma identity', identityWhy: 'because',
    practices: [],
  },
];

/**
 * ANSWERS: p1 → 'a', p2 → ['a', 'b'].
 *
 *   maxProbe is no longer part of the score. It survives as a COVERAGE figure —
 *   how much of a case the bank could make for a belief if every answer went
 *   its way — which is what the catalogue invariant test measures.
 *
 *     maxProbe(alpha) = max(3,1,0) over p1  +  (2+0+0) summed over p2  = 3 + 2 = 5
 *     maxProbe(beta)  = max(1,0,0) over p1  +  (2+3+0) summed over p2  = 1 + 5 = 6
 *     maxProbe(gamma) = 0 + 0 = 0 → gamma can never be evidenced by these probes
 *
 *   rawProbe(alpha) = 3 (p1:a) + 2 (p2:a)            = 5
 *   rawProbe(beta)  = 1 (p1:a) + 2 (p2:a) + 3 (p2:b) = 6
 *   rawProbe(gamma) = 0
 *
 *   Both are evidenced by two distinct probes, so both clear
 *   MIN_DISTINCT_PROBES. With EVIDENCE_HALF_POINT = 8:
 *
 *     probeTerm(alpha) = 5 / (5 + 8) = 5/13 = 0.384615…
 *     probeTerm(beta)  = 6 / (6 + 8) = 6/14 = 0.428571…
 *
 *   Note beta now leads on the probe term, which is the whole correction: beta
 *   has more evidence behind it, and under the old denominator both saturated
 *   to exactly 1.0 and the difference vanished.
 *
 *   rawArea(alpha) = tension(work) + tension(money) = 3.88889 + 2.66667 = 6.55556
 *   maxArea(alpha) = 5 × 2 areas = 10             → 6.55556/10 = 0.655556
 *   rawArea(beta)  = tension(partner) = 1.11111
 *   maxArea(beta)  = 5 × 1 = 5                    → 1.11111/5  = 0.222222
 *   rawArea(gamma) = tension(health) = 1.77778 ; maxArea = 5 → 0.355556
 *
 *   score(alpha) = 0.384615 × 0.7 + 0.655556 × 0.3 = 0.269231 + 0.196667 = 0.465897
 *   score(beta)  = 0.428571 × 0.7 + 0.222222 × 0.3 = 0.300000 + 0.066667 = 0.366667
 *   score(gamma) = no probe evidence at all → not offered
 *
 *   Ranked: alpha (0.4659), beta (0.3667). Alpha still leads, on the strength
 *   of the life gap rather than on a saturated denominator. Gamma is dropped.
 */
export const TEST_ANSWERS: ProbeAnswer[] = [
  { probeId: 'p1', optionIds: ['a'], ts: TS },
  { probeId: 'p2', optionIds: ['a', 'b'], ts: TS },
];

export const EXPECTED_BELIEFS = {
  maxProbe: { alpha: 5, beta: 6, gamma: 0 },
  rawProbe: { alpha: 5, beta: 6, gamma: 0 },
  distinctProbes: { alpha: 2, beta: 2 },
  probeTerm: { alpha: 5 / 13, beta: 6 / 14 },
  rawArea: { alpha: 6.555555555555555, beta: 1.1111111111111112, gamma: 1.7777777777777777 },
  score: {
    alpha: (5 / 13) * 0.7 + 0.6555555555555556 * 0.3,
    beta: (6 / 14) * 0.7 + 0.2222222222222222 * 0.3,
  },
  ranked: ['alpha', 'beta'],
} as const;
