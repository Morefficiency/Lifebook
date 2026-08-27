/**
 * Ordering the bank. Two kinds of test here: the algorithm against a tiny
 * hand-worked example, and the real bank against the property that actually
 * matters — that a person who answers only the first pass can still be offered
 * almost anything in the catalogue.
 */
import { describe, expect, it } from 'vitest';
import type { Probe } from '../../content/probes';
import { PROBES } from '../../content/probes';
import { BELIEF_CATALOGUE } from '../../content/beliefs';
import { MIN_DISTINCT_PROBES } from '../beliefs';
import {
  REFLECT_CORE_PROBES, beliefsTouched, coreProbes, coverageCounts, orderProbesByCoverage,
} from '../probeSelection';

const probe = (id: string, weights: Record<string, number>[]): Probe => ({
  id,
  kind: 'behaviour',
  question: id,
  multi: false,
  options: weights.map((w, i) => ({ id: `o${i}`, label: `o${i}`, weights: w })),
});

/**
 * A hand-worked ordering.
 *
 *   wide   touches a, b, c
 *   pair   touches a, b
 *   solo   touches c
 *   dup    touches a, b        (same as pair; loses the tie on id)
 *
 * Round 1 — nothing covered, so gain is just how many it touches:
 *   wide 3, pair 2, dup 2, solo 1              → wide.        covered a1 b1 c1
 * Round 2 — everything still under 2, so gain is again the count it touches:
 *   pair 2, dup 2, solo 1 → pair and dup tie on gain AND on breadth, so the
 *   id decides: 'dup' < 'pair'                 → dup.         covered a2 b2 c1
 * Round 3 — a and b are at the threshold and stop counting; only c is short:
 *   solo 1, pair 0                             → solo.        covered a2 b2 c2
 * Round 4 — nothing left to gain                → pair.
 *
 *   Expected order: wide, dup, solo, pair
 */
describe('greedy coverage ordering', () => {
  const wide = probe('wide', [{ a: 1, b: 1 }, { c: 1 }]);
  const pair = probe('pair', [{ a: 2 }, { b: 2 }]);
  const solo = probe('solo', [{ c: 3 }]);
  const dup = probe('dup', [{ a: 1 }, { b: 1 }]);

  it('reads which beliefs a probe can speak to', () => {
    expect(beliefsTouched(wide)).toEqual(['a', 'b', 'c']);
    expect(beliefsTouched(solo)).toEqual(['c']);
  });

  it('matches the hand-worked order', () => {
    const order = orderProbesByCoverage([pair, solo, wide, dup]).map((p) => p.id);
    expect(order).toEqual(['wide', 'dup', 'solo', 'pair']);
  });

  it('does not depend on the order the probes were written in', () => {
    const a = orderProbesByCoverage([pair, solo, wide, dup]).map((p) => p.id);
    const b = orderProbesByCoverage([dup, wide, solo, pair]).map((p) => p.id);
    const c = orderProbesByCoverage([solo, pair, dup, wide]).map((p) => p.id);
    expect(b).toEqual(a);
    expect(c).toEqual(a);
  });

  it('keeps every probe — it orders the bank, it does not filter it', () => {
    const order = orderProbesByCoverage([pair, solo, wide, dup]);
    expect(order).toHaveLength(4);
    expect(new Set(order.map((p) => p.id)).size).toBe(4);
  });

});

describe('the real bank, ordered', () => {
  const ordered = orderProbesByCoverage(PROBES);
  const core = coreProbes(PROBES);

  it('orders the whole bank without losing or repeating anything', () => {
    expect(ordered).toHaveLength(PROBES.length);
    expect(new Set(ordered.map((p) => p.id)).size).toBe(PROBES.length);
  });

  it('asks fewer questions than the bank holds', () => {
    // The point of the exercise. If these are ever equal the stage has gone
    // back to being a form.
    expect(core.length).toBeLessThan(PROBES.length);
    expect(core.length).toBe(REFLECT_CORE_PROBES);
  });

  it('leaves almost every belief answerable after the first pass alone', () => {
    // Somebody who stops after the core round should still be able to be
    // offered nearly anything — otherwise the shortened stage quietly amputates
    // part of the catalogue rather than sampling it.
    const counts = coverageCounts(core);
    const reachable = BELIEF_CATALOGUE
      .filter((c) => (counts.get(c.id) ?? 0) >= MIN_DISTINCT_PROBES).length;
    expect(reachable / BELIEF_CATALOGUE.length).toBeGreaterThanOrEqual(0.9);
  });

  it('covers more of the catalogue than the same number of probes taken as written', () => {
    // The ordering has to actually earn itself against the naive alternative.
    const counts = (set: typeof PROBES) => {
      const c = coverageCounts(set);
      return BELIEF_CATALOGUE.filter((b) => (c.get(b.id) ?? 0) >= MIN_DISTINCT_PROBES).length;
    };
    expect(counts(core)).toBeGreaterThan(counts(PROBES.slice(0, REFLECT_CORE_PROBES)));
  });
});
