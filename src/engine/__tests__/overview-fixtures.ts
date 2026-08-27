/**
 * Hand-computed worked example for the standing-view engine.
 *
 * Written before src/engine/overview.ts existed. Everything below was worked
 * out on paper; the engine was then written to satisfy it.
 *
 * THE LIFE
 *
 *   Five areas written, four of those also rated, seven never touched.
 *
 *   area      importance   current   gap = (10 − current)/9   tension = imp × gap
 *   -------------------------------------------------------------------------
 *   work           5           3      7/9 = 0.77778           3.88889   ← highest
 *   money          3           2      8/9 = 0.88889           2.66667
 *   health         4           6      4/9 = 0.44444           1.77778
 *   partner        5           8      2/9 = 0.22222           1.11111
 *   mind           2          —       —                       —          written, not rated
 *   the other 7   —          —        —                       —          blank
 *
 *   Σ tension    = 9.44444        (rated areas only)
 *   Σ importance = 17             (rated areas only — mind is not counted as zero)
 *   gap    = 9.44444 / 17 = 0.555555…  →  56%
 *   living = 100 − 56                  →  44%
 *
 * THE DIAL
 *
 *   Every one of the twelve areas gets a sector, always, in the fixed order of
 *   LIFE_AREAS. A life with holes in it should look like a life with holes in
 *   it; dropping the untouched areas would quietly flatter the picture.
 *
 *   Sector weight is importance where there is a vision, and UNWRITTEN_WEIGHT
 *   (1) where there is not.
 *
 *     health 4 · mind 2 · partner 5 · money 3 · work 5      = 19
 *     seven blank areas × 1                                 =  7
 *     Σ weight                                              = 26
 *
 *   Twelve sectors each take a 1.5° pad, so 360 − 18 = 342° is shared out:
 *
 *     health    4/26 × 342 = 1368/26 = 52.615384615°
 *     mind      2/26 × 342 =  684/26 = 26.307692308°
 *     partner   5/26 × 342 = 1710/26 = 65.769230769°
 *     money     3/26 × 342 = 1026/26 = 39.461538462°
 *     work      5/26 × 342 = 1710/26 = 65.769230769°
 *     each blank 1/26 × 342 = 342/26 = 13.153846154°   (× 7 = 92.076923077°)
 *
 *     52.615384615 + 26.307692308 + 65.769230769 + 39.461538462
 *       + 65.769230769 + 92.076923077 = 342.000000000  ✓
 *
 *   The first sector starts at −90° (twelve o'clock) and they run clockwise,
 *   each one followed by its pad. Working down the LIFE_AREAS order:
 *
 *     health     −90.000000000 →  −37.384615385
 *     mind       −35.884615385 →   −9.576923077
 *     emotions    −8.076923077 →    5.076923077
 *     character    6.576923077 →   19.730769231
 *     spirit      21.230769231 →   34.384615385
 *     partner     35.884615385 →  101.653846154
 *     family     103.153846154 →  116.307692308
 *     social     117.807692308 →  130.961538462
 *     money      132.461538462 →  171.923076923
 *     work       173.423076923 →  239.192307692
 *     lifestyle  240.692307692 →  253.846153846
 *     vision     255.346153846 →  268.500000000
 *
 *   268.5 + the last pad = 270 = −90 + 360.  ✓ the ring closes exactly.
 *
 *   Fill is current/10, so the arc reaches where the person actually is:
 *   work 0.3 · money 0.2 · health 0.6 · partner 0.8. An area that was written
 *   but never rated has NO fill and NO zero — we do not know where it is, and
 *   drawing it at zero would be a claim rather than an absence.
 */
import type { AreaCurrent, AreaVision, LifeArea } from '../../types';

export const TS = '2026-03-01T09:00:00.000Z';

const vision = (area: LifeArea, importance: 1 | 2 | 3 | 4 | 5): AreaVision => ({
  area, statement: `vision for ${area}`, markers: [], importance, ts: TS,
});
const current = (area: LifeArea, score: number): AreaCurrent => ({
  area, score, description: `current ${area}`, ts: TS,
});

export const OV_VISIONS: AreaVision[] = [
  vision('work', 5), vision('money', 3), vision('health', 4),
  vision('partner', 5), vision('mind', 2),
];
export const OV_CURRENTS: AreaCurrent[] = [
  current('work', 3), current('money', 2), current('health', 6), current('partner', 8),
];

export const EXPECTED_OVERVIEW = {
  describedCount: 5,
  ratedCount: 4,
  gapPercent: 56,
  livingPercent: 44,
  sumWeight: 26,
  priority: ['work', 'money', 'health', 'partner'] as LifeArea[],
  /** state per area, in LIFE_AREAS order */
  states: [
    'rated',   // health
    'written', // mind
    'blank',   // emotions
    'blank',   // character
    'blank',   // spirit
    'rated',   // partner
    'blank',   // family
    'blank',   // social
    'rated',   // money
    'rated',   // work
    'blank',   // lifestyle
    'blank',   // vision
  ] as const,
  /** [startDeg, endDeg] per area, in LIFE_AREAS order */
  sectors: [
    [-90.000000000, -37.384615385], // health
    [-35.884615385, -9.576923077],  // mind
    [-8.076923077, 5.076923077],    // emotions
    [6.576923077, 19.730769231],    // character
    [21.230769231, 34.384615385],   // spirit
    [35.884615385, 101.653846154],  // partner
    [103.153846154, 116.307692308], // family
    [117.807692308, 130.961538462], // social
    [132.461538462, 171.923076923], // money
    [173.423076923, 239.192307692], // work
    [240.692307692, 253.846153846], // lifestyle
    [255.346153846, 268.500000000], // vision
  ] as const,
  fills: {
    health: 0.6, partner: 0.8, money: 0.2, work: 0.3,
  } as Record<string, number>,
} as const;
