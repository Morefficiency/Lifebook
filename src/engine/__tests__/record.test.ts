/**
 * The results record, worked by hand.
 *
 * `placements` is append-only: one entry per placing of one area. This reads
 * it back per area.
 *
 *   money  placed 3 → 4 → 6 over three months     first 3, latest 6, delta +3, n 3
 *   work   placed 7 → 5                           delta −2, n 2
 *   health placed once, 4                         delta null — one point is not a direction
 *   spirit never placed                           series empty, delta null
 *
 * Order is by timestamp, not by array position: a placing synced in from
 * another device can arrive out of order, and the record must not care.
 */
import { describe, expect, it } from 'vitest';
import type { Placement } from '../../types';
import { areaSeries, areaTrend, recordSummary } from '../record';

const p = (area: Placement['area'], score: number, month: number): Placement => ({
  area, score, ts: `2026-${String(month).padStart(2, '0')}-01T09:00:00.000Z`,
});

const placements: Placement[] = [
  p('money', 3, 1), p('work', 7, 1), p('health', 4, 2),
  p('money', 6, 3), // out of order on purpose
  p('money', 4, 2), p('work', 5, 3),
];

describe('a series per area', () => {
  it('is ordered by time regardless of array order', () => {
    expect(areaSeries(placements, 'money').map((x) => x.score)).toEqual([3, 4, 6]);
  });

  it('is empty for an area never placed', () => {
    expect(areaSeries(placements, 'spirit')).toEqual([]);
  });
});

describe('the trend', () => {
  it('is latest minus first, with the count', () => {
    expect(areaTrend(placements, 'money')).toEqual({ first: 3, latest: 6, delta: 3, n: 3,
      firstTs: '2026-01-01T09:00:00.000Z', latestTs: '2026-03-01T09:00:00.000Z' });
    expect(areaTrend(placements, 'work')).toMatchObject({ delta: -2, n: 2 });
  });

  it('has no direction from a single point, and none from nothing', () => {
    expect(areaTrend(placements, 'health')).toMatchObject({ n: 1, delta: null, first: 4, latest: 4 });
    expect(areaTrend(placements, 'spirit')).toEqual({ first: null, latest: null, delta: null, n: 0,
      firstTs: null, latestTs: null });
  });
});

describe('the summary', () => {
  it('lists only areas with a direction, most moved first, ties by name order', () => {
    const s = recordSummary(placements);
    expect(s.map((r) => [r.area, r.delta])).toEqual([['money', 3], ['work', -2]]);
  });

  it('is empty for a record of single points', () => {
    expect(recordSummary([p('money', 5, 1), p('work', 5, 1)])).toEqual([]);
  });
});
