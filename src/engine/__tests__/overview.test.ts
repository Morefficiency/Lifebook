import { describe, expect, it } from 'vitest';
import {
  DIAL_START_DEG, SECTOR_PAD_DEG, UNWRITTEN_WEIGHT,
  areaRows, describedCount, dialSectors, livingPercent, polarPoint, ratedCount, ringPath,
} from '../overview';
import { EXPECTED_OVERVIEW, OV_CURRENTS, OV_VISIONS } from './overview-fixtures';
import { LIFE_AREAS } from '../../types';

const rows = areaRows(OV_VISIONS, OV_CURRENTS);

describe('area rows — all twelve, always, in a fixed order', () => {
  it('returns every area whether or not it was written', () => {
    expect(rows).toHaveLength(12);
    expect(rows.map((r) => r.area)).toEqual(LIFE_AREAS);
  });

  it('classifies each one as rated, written or blank', () => {
    expect(rows.map((r) => r.state)).toEqual([...EXPECTED_OVERVIEW.states]);
  });

  it('carries the arithmetic for rated areas', () => {
    const work = rows.find((r) => r.area === 'work')!;
    expect(work.importance).toBe(5);
    expect(work.current).toBe(3);
    expect(work.gap).toBeCloseTo(7 / 9, 10);
    expect(work.tension).toBeCloseTo(5 * (7 / 9), 10);
  });

  it('leaves a written-but-unrated area null rather than zero', () => {
    // Zero would say "you are nowhere near it". Null says "you have not said".
    const mind = rows.find((r) => r.area === 'mind')!;
    expect(mind.importance).toBe(2);
    expect(mind.current).toBeNull();
    expect(mind.gap).toBeNull();
    expect(mind.tension).toBeNull();
  });

  it('gives an untouched area no importance and the unwritten weight', () => {
    const spirit = rows.find((r) => r.area === 'spirit')!;
    expect(spirit.importance).toBeNull();
    expect(spirit.weight).toBe(UNWRITTEN_WEIGHT);
  });

  it('weights sum to 26 over the worked example', () => {
    expect(rows.reduce((a, r) => a + r.weight, 0)).toBe(EXPECTED_OVERVIEW.sumWeight);
  });
});

describe('coverage', () => {
  it('counts what has actually been described', () => {
    expect(describedCount(OV_VISIONS)).toBe(EXPECTED_OVERVIEW.describedCount);
    expect(ratedCount(OV_VISIONS, OV_CURRENTS)).toBe(EXPECTED_OVERVIEW.ratedCount);
  });

  it('does not count an empty statement as described', () => {
    const blanked = OV_VISIONS.map((v) => (v.area === 'mind' ? { ...v, statement: '   ' } : v));
    expect(describedCount(blanked)).toBe(4);
  });
});

describe('living percent — the complement of the weighted gap', () => {
  it('44% over the worked example', () => {
    expect(livingPercent(OV_VISIONS, OV_CURRENTS)).toBe(EXPECTED_OVERVIEW.livingPercent);
  });

  it('is null when nothing has been rated on both sides', () => {
    // An unmeasured life is not a life that is 0% lived.
    expect(livingPercent(OV_VISIONS, [])).toBeNull();
    expect(livingPercent([], [])).toBeNull();
  });
});

describe('dial geometry', () => {
  const sectors = dialSectors(rows);

  it('produces one sector per area, in the same fixed order', () => {
    expect(sectors.map((s) => s.area)).toEqual(LIFE_AREAS);
  });

  it('matches the hand-computed start and end angles', () => {
    sectors.forEach((s, i) => {
      const expected = EXPECTED_OVERVIEW.sectors[i]!;
      expect(s.startDeg).toBeCloseTo(expected[0], 6);
      expect(s.endDeg).toBeCloseTo(expected[1], 6);
    });
  });

  it('starts at twelve o\'clock and closes the ring exactly', () => {
    expect(sectors[0]!.startDeg).toBe(DIAL_START_DEG);
    const last = sectors[sectors.length - 1]!;
    expect(last.endDeg + SECTOR_PAD_DEG).toBeCloseTo(DIAL_START_DEG + 360, 6);
  });

  it('never overlaps: each sector starts after the previous one ends', () => {
    for (let i = 1; i < sectors.length; i++) {
      expect(sectors[i]!.startDeg).toBeGreaterThan(sectors[i - 1]!.endDeg);
    }
  });

  it('widens a sector in proportion to how much the area matters', () => {
    const width = (a: string) => {
      const s = sectors.find((x) => x.area === a)!;
      return s.endDeg - s.startDeg;
    };
    // work (importance 5) against money (importance 3): 5/3 of the width.
    expect(width('work') / width('money')).toBeCloseTo(5 / 3, 8);
    // and a blank area is the narrowest thing on the dial.
    expect(width('spirit')).toBeLessThan(width('mind'));
  });

  it('fills each arc to where the person actually is', () => {
    for (const [area, fill] of Object.entries(EXPECTED_OVERVIEW.fills)) {
      expect(sectors.find((s) => s.area === area)!.fill).toBeCloseTo(fill, 10);
    }
  });

  it('gives an unrated area no fill at all rather than an empty one', () => {
    expect(sectors.find((s) => s.area === 'mind')!.fill).toBeNull();
    expect(sectors.find((s) => s.area === 'spirit')!.fill).toBeNull();
  });

  it('still draws a whole ring when nothing has been written', () => {
    // The first-run state: twelve equal slots, no fill, no NaN.
    const empty = dialSectors(areaRows([], []));
    expect(empty).toHaveLength(12);
    const widths = empty.map((s) => s.endDeg - s.startDeg);
    expect(Math.max(...widths) - Math.min(...widths)).toBeCloseTo(0, 10);
    expect(widths.every((w) => Number.isFinite(w) && w > 0)).toBe(true);
    expect(empty.every((s) => s.fill === null)).toBe(true);
  });
});

describe('svg helpers', () => {
  it('puts −90° at the top of the circle', () => {
    const p = polarPoint(100, 100, 50, -90);
    expect(p.x).toBeCloseTo(100, 10);
    expect(p.y).toBeCloseTo(50, 10);
  });

  it('runs clockwise: 0° is to the right, 90° is at the bottom', () => {
    expect(polarPoint(0, 0, 10, 0)).toEqual({ x: 10, y: 0 });
    const bottom = polarPoint(0, 0, 10, 90);
    expect(bottom.x).toBeCloseTo(0, 10);
    expect(bottom.y).toBeCloseTo(10, 10);
  });

  it('draws a closed annular wedge with no NaN in it', () => {
    const d = ringPath(120, 120, 60, 100, -90, -37.384615385);
    expect(d).not.toMatch(/NaN/);
    expect(d.startsWith('M')).toBe(true);
    expect(d.endsWith('Z')).toBe(true);
  });

  it('uses the large-arc flag only past a half turn', () => {
    expect(ringPath(0, 0, 5, 10, 0, 170)).toContain(' 0 1 ');
    expect(ringPath(0, 0, 5, 10, 0, 190)).toContain(' 1 1 ');
  });
});
