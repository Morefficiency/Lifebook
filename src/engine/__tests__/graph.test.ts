import { describe, expect, it } from 'vitest';
import {
  canonicalEdge, computeGraph, coolEdgeHeat, edgeConflictLoad, edgeKey,
} from '../graph';
import { EXPECTED, RATINGS, STRIVINGS, TS } from './fixtures';
import type { ForkDecision, PairRating, Striving } from '../../types';

const noForks: ForkDecision[] = [];

describe('edge identity', () => {
  it('canonicalises to aId < bId regardless of argument order', () => {
    expect(canonicalEdge('s3', 's1')).toEqual({ aId: 's1', bId: 's3' });
    expect(canonicalEdge('s1', 's3')).toEqual({ aId: 's1', bId: 's3' });
    expect(edgeKey('s3', 's1')).toBe(edgeKey('s1', 's3'));
  });
});

describe('edge conflict load — c_ij = |effect| × (1 + heat/10)', () => {
  // Hand-computed, see fixtures.ts header.
  it('s1–s2: |−2| × (1 + 8/10) = 3.6', () => {
    expect(edgeConflictLoad({ aId: 's1', bId: 's2', effect: -2, heat: 8, ts: TS })).toBeCloseTo(3.6, 10);
  });
  it('s1–s3: |−1| × (1 + 3/10) = 1.3', () => {
    expect(edgeConflictLoad({ aId: 's1', bId: 's3', effect: -1, heat: 3, ts: TS })).toBeCloseTo(1.3, 10);
  });
  it('s3–s4: |−1| × (1 + 0/10) = 1.0 — heat 0 still carries the base |effect|', () => {
    expect(edgeConflictLoad({ aId: 's3', bId: 's4', effect: -1, heat: 0, ts: TS })).toBeCloseTo(1.0, 10);
  });
  it('missing heat is treated as 0, never as "no conflict"', () => {
    expect(edgeConflictLoad({ aId: 's1', bId: 's2', effect: -2, ts: TS })).toBeCloseTo(2.0, 10);
  });
  it('positive and zero edges carry no conflict load', () => {
    expect(edgeConflictLoad({ aId: 's1', bId: 's4', effect: 2, ts: TS })).toBe(0);
    expect(edgeConflictLoad({ aId: 's2', bId: 's3', effect: 0, ts: TS })).toBe(0);
  });
  it('maximum possible single-edge load is 2 × 2 = 4', () => {
    expect(edgeConflictLoad({ aId: 'a', bId: 'b', effect: -2, heat: 10, ts: TS })).toBeCloseTo(4, 10);
  });
});

describe('computeGraph over the 4-striving worked example', () => {
  const g = computeGraph(STRIVINGS, RATINGS, noForks);
  const node = (id: string) => g.nodes.find((n) => n.id === id)!;

  it('sums conflict load to 3.6 + 1.3 + 1.0 = 5.9', () => {
    expect(g.totalConflictLoad).toBeCloseTo(EXPECTED.totalConflictLoad, 10);
  });

  it('sums facilitation to 2 + 1 = 3', () => {
    expect(g.totalFacilitation).toBeCloseTo(EXPECTED.totalFacilitation, 10);
  });

  it('counts 3 fault lines and 2 help links; the 0-edge is neither', () => {
    expect(g.faultLineCount).toBe(3);
    expect(g.helpLinkCount).toBe(2);
    expect(g.edges).toHaveLength(5); // the s2–s3 zero edge is not drawn
  });

  it('G = 5.9 / (5.9 + 3) = 0.662921… → 66%', () => {
    expect(g.conflictIndex).toBeCloseTo(EXPECTED.G, 10);
    expect(g.conflictIndexPercent).toBe(66);
  });

  it('node conflict centrality C_i matches the hand computation', () => {
    expect(node('s1').conflictCentrality).toBeCloseTo(EXPECTED.C.s1, 10); // 3.6 + 1.3
    expect(node('s2').conflictCentrality).toBeCloseTo(EXPECTED.C.s2, 10); // 3.6
    expect(node('s3').conflictCentrality).toBeCloseTo(EXPECTED.C.s3, 10); // 1.3 + 1.0
    expect(node('s4').conflictCentrality).toBeCloseTo(EXPECTED.C.s4, 10); // 1.0
  });

  it('node facilitation strength F_i matches the hand computation', () => {
    expect(node('s1').facilitationStrength).toBe(EXPECTED.F.s1);
    expect(node('s2').facilitationStrength).toBe(EXPECTED.F.s2);
    expect(node('s3').facilitationStrength).toBe(EXPECTED.F.s3);
    expect(node('s4').facilitationStrength).toBe(EXPECTED.F.s4);
  });

  it('load-bearing node is s1 (argmax C_i = 4.9)', () => {
    expect(g.loadBearing?.id).toBe(EXPECTED.loadBearingId);
  });

  it('hottest edge is s1–s2 at heat 8', () => {
    expect(g.hottestEdge).toMatchObject(EXPECTED.hottestEdge);
  });

  it('load-bearing edge is s1–s2 at c = 3.6, the heaviest of 3.6 / 1.3 / 1.0', () => {
    expect(g.loadBearingEdge).toMatchObject({ aId: 's1', bId: 's2' });
    expect(g.loadBearingEdge?.load).toBeCloseTo(3.6, 10);
  });

  it('largest facilitation cluster is {s1, s2, s4} — 3 nodes joined by s1–s4 and s2–s4', () => {
    expect(g.clusters[0]?.ids.slice().sort()).toEqual([...EXPECTED.largestClusterIds]);
    expect(g.clusters[0]?.weight).toBe(3);
  });
});

describe('load-bearing edge separates weight from heat', () => {
  // a–b: effect −2, heat 0  → load 2.0, heat 0   ← heaviest
  // c–d: effect −1, heat 9  → load 1.9, heat 9   ← hottest
  const st: Striving[] = ['a', 'b', 'c', 'd'].map((id) => ({ id, text: id, createdTs: TS, status: 'active' as const }));
  const rt: PairRating[] = [
    { aId: 'a', bId: 'b', effect: -2, heat: 0, ts: TS },
    { aId: 'c', bId: 'd', effect: -1, heat: 9, ts: TS },
  ];
  it('picks the heaviest edge for load, the hottest for heat', () => {
    const g = computeGraph(st, rt, noForks);
    expect(g.loadBearingEdge).toMatchObject({ aId: 'a', bId: 'b' });
    expect(g.hottestEdge).toMatchObject({ aId: 'c', bId: 'd' });
  });
});

describe('load-bearing tie-break: equal C_i resolves to the higher summed heat', () => {
  // Two nodes with identical centrality but different heat:
  //   a–b: effect −2, heat 0  → c = 2 × 1.0 = 2.0
  //   c–d: effect −1, heat 10 → c = 1 × 2.0 = 2.0
  // C_a = C_b = C_c = C_d = 2.0 exactly. Heat sums: a,b = 0; c,d = 10.
  // Tie-break by summed heat ⇒ winner must be 'c' (first of the hotter pair).
  const st: Striving[] = ['a', 'b', 'c', 'd'].map((id) => ({ id, text: id, createdTs: TS, status: 'active' as const }));
  const rt: PairRating[] = [
    { aId: 'a', bId: 'b', effect: -2, heat: 0, ts: TS },
    { aId: 'c', bId: 'd', effect: -1, heat: 10, ts: TS },
  ];
  it('picks the hotter node', () => {
    const g = computeGraph(st, rt, noForks);
    expect(g.nodes.find((n) => n.id === 'a')!.conflictCentrality).toBeCloseTo(2, 10);
    expect(g.nodes.find((n) => n.id === 'c')!.conflictCentrality).toBeCloseTo(2, 10);
    expect(g.loadBearing?.id).toBe('c');
  });
});

describe('released strivings leave the graph', () => {
  it('releasing s2 drops the 3.6 edge: load 5.9 → 2.3', () => {
    const released = STRIVINGS.map((s) => (s.id === 's2' ? { ...s, status: 'released' as const } : s));
    const g = computeGraph(released, RATINGS, noForks);
    expect(g.totalConflictLoad).toBeCloseTo(2.3, 10); // 1.3 + 1.0
    expect(g.totalFacilitation).toBe(2); // only s1–s4 survives
    expect(g.nodes).toHaveLength(3);
  });
});

describe('carried edges stay visible but leave the Coherence load', () => {
  const carry: ForkDecision[] = [{
    id: 'f-carry', edge: { aId: 's3', bId: 's4' }, choice: 'carry',
    note: 'This one is the price of a life I actually chose, and I am done pretending otherwise.',
    ts: TS,
  }];
  const g = computeGraph(STRIVINGS, RATINGS, carry);

  it('still counts in totalConflictLoad (it is still a real conflict on the map)', () => {
    expect(g.totalConflictLoad).toBeCloseTo(5.9, 10);
  });
  it('is excluded from activeConflictLoad: 5.9 − 1.0 = 4.9', () => {
    expect(g.activeConflictLoad).toBeCloseTo(4.9, 10);
  });
  it('is flagged carried so the map can render it amber', () => {
    expect(g.edges.find((e) => e.aId === 's3' && e.bId === 's4')!.carried).toBe(true);
  });
  it('a later challenge on the same edge un-carries it (most recent fork wins)', () => {
    const later: ForkDecision[] = [...carry, {
      id: 'f-chal', edge: { aId: 's3', bId: 's4' }, choice: 'challenge',
      note: 'Actually I want to test whether the contract is what keeps me training at all.',
      ts: '2026-02-01T10:00:00.000Z',
    }];
    expect(computeGraph(STRIVINGS, RATINGS, later).activeConflictLoad).toBeCloseTo(5.9, 10);
  });
});

describe('empty and degenerate graphs', () => {
  it('no strivings: G is null rather than 0/0', () => {
    const g = computeGraph([], [], noForks);
    expect(g.conflictIndex).toBeNull();
    expect(g.conflictIndexPercent).toBeNull();
    expect(g.loadBearing).toBeNull();
    expect(g.hottestEdge).toBeNull();
    expect(g.loadBearingEdge).toBeNull();
  });
  it('all-positive graph: G = 0', () => {
    const st: Striving[] = ['a', 'b'].map((id) => ({ id, text: id, createdTs: TS, status: 'active' as const }));
    const g = computeGraph(st, [{ aId: 'a', bId: 'b', effect: 2, ts: TS }], noForks);
    expect(g.conflictIndexPercent).toBe(0);
    expect(g.loadBearing).toBeNull(); // nobody carries any conflict
  });
  it('all-negative graph: G = 100', () => {
    const st: Striving[] = ['a', 'b'].map((id) => ({ id, text: id, createdTs: TS, status: 'active' as const }));
    const g = computeGraph(st, [{ aId: 'a', bId: 'b', effect: -2, heat: 5, ts: TS }], noForks);
    expect(g.conflictIndexPercent).toBe(100);
  });
});

describe('coolEdgeHeat — one heat step per broken prediction (§7.5)', () => {
  it('8 → 7', () => {
    expect(coolEdgeHeat({ aId: 's1', bId: 's2', effect: -2, heat: 8, ts: TS }).heat).toBe(7);
  });
  it('floors at 0 and never goes negative', () => {
    expect(coolEdgeHeat({ aId: 's1', bId: 's2', effect: -2, heat: 0, ts: TS }).heat).toBe(0);
  });
  it('cooling s1–s2 from heat 8 to 7 drops its load 3.6 → 3.4', () => {
    const cooled = coolEdgeHeat({ aId: 's1', bId: 's2', effect: -2, heat: 8, ts: TS });
    expect(edgeConflictLoad(cooled)).toBeCloseTo(3.4, 10); // 2 × 1.7
  });
  it('leaves positive edges untouched', () => {
    const r: PairRating = { aId: 's1', bId: 's4', effect: 2, ts: TS };
    expect(coolEdgeHeat(r)).toEqual(r);
  });
});
