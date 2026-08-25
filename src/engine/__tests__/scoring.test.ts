import { describe, expect, it } from 'vitest';
import {
  brierScore, calibration, coherencePercent, courageCount, isPredictionBroken,
  shouldPromptRerating,
} from '../scoring';
import { BRIER, QUESTS, REPORTS, TS, q1, q2, q3, r1, r2, r3 } from './fixtures';
import type { FieldReport, Quest } from '../../types';

describe('PREDICTION BROKEN — forecastP ≥ 60 AND fearedOutcomeOccurred === false', () => {
  it('Q1: forecast 80, feared outcome did not occur → BROKEN', () => {
    expect(isPredictionBroken(q1, r1)).toBe(true);
  });
  it('Q2: feared outcome occurred → not broken, whatever the forecast', () => {
    expect(isPredictionBroken(q2, r2)).toBe(false);
  });
  it('Q3: forecast 45 is below the 60 threshold → not broken even though the outcome was good', () => {
    expect(isPredictionBroken(q3, r3)).toBe(false);
  });
  it('exactly 60 is inside the threshold (≥, not >)', () => {
    expect(isPredictionBroken({ ...q3, forecastP: 60 }, r3)).toBe(true);
    expect(isPredictionBroken({ ...q3, forecastP: 59 }, r3)).toBe(false);
  });
});

describe('Brier score — B = mean((forecastP/100 − o)²)', () => {
  it('n = 0 → null, not 0 (no evidence is not perfect calibration)', () => {
    expect(brierScore([])).toBeNull();
    const c = calibration([], []);
    expect(c.n).toBe(0);
    expect(c.score).toBeNull();
    expect(c.sufficient).toBe(false);
  });

  it('n = 1 → computed but flagged insufficient', () => {
    // (0.80 − 0)² = 0.64 ; Calibration = round((1 − 0.64) × 100) = 36
    const c = calibration([q1], [r1]);
    expect(c.n).toBe(1);
    expect(c.brier).toBeCloseTo(0.64, 10);
    expect(c.score).toBe(36);
    expect(c.sufficient).toBe(false);
  });

  it('n = 2 → still insufficient', () => {
    // (0.64 + 0.2025) / 2 = 0.42125 ; round((1 − 0.42125) × 100) = round(57.875) = 58
    const c = calibration([q1, q3], [r1, r3]);
    expect(c.n).toBe(2);
    expect(c.brier).toBeCloseTo(0.42125, 10);
    expect(c.score).toBe(58);
    expect(c.sufficient).toBe(false);
  });

  it('n = 3 → sufficient; B = (0.64 + 0.49 + 0.2025)/3 = 0.444166…, Calibration = 56', () => {
    const c = calibration(QUESTS, REPORTS);
    expect(c.n).toBe(3);
    expect(c.terms.map((t) => Number(t.toFixed(4)))).toEqual([...BRIER.terms]);
    expect(c.brier).toBeCloseTo(BRIER.B, 10);
    expect(c.score).toBe(BRIER.calibration); // 56
    expect(c.sufficient).toBe(true);
  });

  it('a perfect forecaster scores 100, a perfectly inverted one scores 0', () => {
    const perfect: Quest[] = [{ ...q1, id: 'p1', forecastP: 0 }, { ...q2, id: 'p2', forecastP: 100 }];
    const perfectReports: FieldReport[] = [
      { ...r1, id: 'pr1', questId: 'p1', fearedOutcomeOccurred: false },
      { ...r2, id: 'pr2', questId: 'p2', fearedOutcomeOccurred: true },
    ];
    expect(calibration(perfect, perfectReports).score).toBe(100);

    const inverted: Quest[] = [{ ...q1, id: 'i1', forecastP: 100 }];
    const invertedReports: FieldReport[] = [{ ...r1, id: 'ir1', questId: 'i1', fearedOutcomeOccurred: false }];
    expect(calibration(inverted, invertedReports).score).toBe(0);
  });

  it('ignores reports whose quest is missing rather than scoring them as 0', () => {
    const orphan: FieldReport = { ...r1, id: 'orphan', questId: 'nope' };
    expect(calibration(QUESTS, [...REPORTS, orphan]).n).toBe(3);
  });

  it('scores only the first report per quest if one were ever duplicated', () => {
    expect(calibration([q1], [r1, { ...r1, id: 'dupe' }]).n).toBe(1);
  });
});

describe('Courage — fearRating ≥ 7 AND at least one completed step', () => {
  it('counts Q1 (fear 8, 2 steps done) and not Q2 (fear 4) or Q3 (fear 9, 0 steps done)', () => {
    expect(courageCount(QUESTS)).toBe(1);
  });
  it('outcome is irrelevant — an attempt that went badly still counts', () => {
    const brave: Quest = { ...q2, id: 'brave', fearRating: 7 }; // fear 7, 1 step done
    expect(courageCount([brave])).toBe(1);
  });
  it('exactly 7 counts; 6 does not', () => {
    expect(courageCount([{ ...q2, fearRating: 7 }])).toBe(1);
    expect(courageCount([{ ...q2, fearRating: 6 }])).toBe(0);
  });
  it('an abandoned quest with a completed brave step still counts — courage is behaviour', () => {
    expect(courageCount([{ ...q1, status: 'abandoned' }])).toBe(1);
  });
});

describe('Coherence — 1 − (current active conflict load / initial load at mirror completion)', () => {
  // Baseline from the worked example: initial load = 5.9
  it('unchanged map scores 0% — no movement yet, and the app says so plainly', () => {
    expect(coherencePercent(5.9, 5.9)).toBe(0);
  });
  it('after one broken prediction cools s1–s2 (8 → 7): load 5.7 → 3%', () => {
    // 3.4 + 1.3 + 1.0 = 5.7 ; 1 − 5.7/5.9 = 0.033898… → 3%
    expect(coherencePercent(5.7, 5.9)).toBe(3);
  });
  it('after releasing s2: load 2.3 → 61%', () => {
    // 1.3 + 1.0 = 2.3 ; 1 − 2.3/5.9 = 0.610169… → 61%
    expect(coherencePercent(2.3, 5.9)).toBe(61);
  });
  it('after also carrying s3–s4: load 1.3 → 78%', () => {
    // 1 − 1.3/5.9 = 0.779661… → 78%
    expect(coherencePercent(1.3, 5.9)).toBe(78);
  });
  it('a map with no conflict at the start is 100% and stays there', () => {
    expect(coherencePercent(0, 0)).toBe(100);
  });
  it('reports honestly when conflict has grown instead of clamping to 0', () => {
    expect(coherencePercent(7.9, 5.9)).toBe(-34); // 1 − 7.9/5.9 = −0.338983… → −34%
  });
  it('null baseline (mirror never completed) → null', () => {
    expect(coherencePercent(5.9, null)).toBeNull();
  });
});

describe('shouldPromptRerating — two consecutive broken predictions on one edge (§7.5)', () => {
  const edge = { aId: 's1', bId: 's2' };
  const broken = (id: string, ts: string): [Quest, FieldReport] => [
    { ...q1, id, edge, forecastP: 75, createdTs: ts },
    { ...r1, id: `r-${id}`, questId: id, fearedOutcomeOccurred: false, ts },
  ];
  const held = (id: string, ts: string): [Quest, FieldReport] => [
    { ...q1, id, edge, forecastP: 75, createdTs: ts },
    { ...r2, id: `r-${id}`, questId: id, fearedOutcomeOccurred: true, ts },
  ];

  it('one broken prediction is not enough', () => {
    const [qa, ra] = broken('a', '2026-01-01T00:00:00.000Z');
    expect(shouldPromptRerating(edge, [qa], [ra])).toBe(false);
  });
  it('two consecutive broken predictions prompt a re-rating', () => {
    const [qa, ra] = broken('a', '2026-01-01T00:00:00.000Z');
    const [qb, rb] = broken('b', '2026-01-02T00:00:00.000Z');
    expect(shouldPromptRerating(edge, [qa, qb], [ra, rb])).toBe(true);
  });
  it('an intervening confirmed prediction breaks the run', () => {
    const [qa, ra] = broken('a', '2026-01-01T00:00:00.000Z');
    const [qb, rb] = held('b', '2026-01-02T00:00:00.000Z');
    const [qc, rc] = broken('c', '2026-01-03T00:00:00.000Z');
    expect(shouldPromptRerating(edge, [qa, qb, qc], [ra, rb, rc])).toBe(false);
  });
  it('only looks at the given edge', () => {
    const [qa, ra] = broken('a', '2026-01-01T00:00:00.000Z');
    const [qb, rb] = broken('b', '2026-01-02T00:00:00.000Z');
    expect(shouldPromptRerating({ aId: 's3', bId: 's4' }, [qa, qb], [ra, rb])).toBe(false);
  });
  it('is order-insensitive to the argument arrays — it sorts by report timestamp', () => {
    const [qa, ra] = broken('a', '2026-01-03T00:00:00.000Z');
    const [qb, rb] = held('b', '2026-01-02T00:00:00.000Z');
    const [qc, rc] = broken('c', '2026-01-01T00:00:00.000Z');
    // newest two are: a (broken) then b (held) → run of 1
    expect(shouldPromptRerating(edge, [qc, qa, qb], [rc, ra, rb])).toBe(false);
  });
});

describe('the Brier scorer treats forecast and fear as independent (they are)', () => {
  it('fear rating never touches calibration', () => {
    const timid: Quest = { ...q1, id: 't', fearRating: 0 };
    expect(calibration([timid], [{ ...r1, questId: 't' }]).score)
      .toBe(calibration([q1], [r1]).score);
  });
});

describe('TS fixture sanity', () => {
  it('all fixture reports point at a real quest', () => {
    for (const r of REPORTS) expect(QUESTS.some((q) => q.id === r.questId)).toBe(true);
    expect(TS).toBe('2026-01-15T10:00:00.000Z');
    expect(r3.fearedOutcomeOccurred).toBe(false);
  });
});
