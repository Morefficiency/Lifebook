/**
 * Invariants the real content has to satisfy — not the arithmetic, which
 * lifebook.test.ts covers against a synthetic catalogue, but the shape of the
 * catalogue and probe bank themselves.
 *
 * These exist because the failure mode of a growing belief catalogue is not a
 * crash. It is a catalogue that still runs and quietly stops meaning anything:
 * beliefs nothing can evidence, beliefs one answer can conjure, and a catch-all
 * that fits everybody. None of those show up in a unit test of the formula, so
 * they get tested here, against the content people actually see.
 */
import { describe, expect, it } from 'vitest';
import { BELIEF_CATALOGUE } from '../../content/beliefs';
import { PROBES } from '../../content/probes';
import { MIN_DISTINCT_PROBES, inferBeliefs, maxProbeScore } from '../beliefs';

/** Probes with at least one option pointing at this belief. */
function probesEvidencing(id: string) {
  return PROBES.filter((p) => p.options.some((o) => (o.weights[id] ?? 0) > 0));
}

describe('the belief catalogue', () => {
  it('has no duplicate ids', () => {
    const ids = BELIEF_CATALOGUE.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('states every target identity as conduct rather than as a trait', () => {
    // "I am confident" is inert — there is nothing to do about it. "I am
    // someone who ships before it is perfect" can be settled by acting.
    for (const c of BELIEF_CATALOGUE) {
      expect(c.identity, c.id).toMatch(/^I am someone who /);
    }
  });

  it('gives every belief something to actually do', () => {
    for (const c of BELIEF_CATALOGUE) {
      expect(c.practices.length, c.id).toBeGreaterThanOrEqual(3);
      const kinds = new Set(c.practices.map((p) => p.kind));
      expect([...kinds].sort(), c.id).toEqual(['affirmation', 'behaviour', 'thought']);
    }
  });

  it('names at least one area for every belief, so the gap can weight it', () => {
    for (const c of BELIEF_CATALOGUE) expect(c.areas.length, c.id).toBeGreaterThan(0);
  });
});

describe('every belief is reachable', () => {
  it('can be evidenced by at least MIN_DISTINCT_PROBES different probes', () => {
    // A belief evidenced by one probe can never clear the corroboration gate,
    // so it would sit in the catalogue as dead weight — offered to nobody,
    // ever, with nothing to say so.
    const thin = BELIEF_CATALOGUE
      .map((c) => ({ id: c.id, n: probesEvidencing(c.id).length }))
      .filter((r) => r.n < MIN_DISTINCT_PROBES);
    expect(thin, `unreachable: ${JSON.stringify(thin)}`).toEqual([]);
  });

  it('has a non-zero ceiling for every belief', () => {
    for (const c of BELIEF_CATALOGUE) {
      expect(maxProbeScore(c.id, PROBES), c.id).toBeGreaterThan(0);
    }
  });
});

describe('the probe bank', () => {
  it('has no duplicate probe ids, and no duplicate option ids within a probe', () => {
    const ids = PROBES.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const p of PROBES) {
      const opts = p.options.map((o) => o.id);
      expect(new Set(opts).size, p.id).toBe(opts.length);
    }
  });

  it('offers a way out of every probe that costs nothing', () => {
    // Every probe needs an answer that carries no weight at all. Without one,
    // answering honestly still pushes you somewhere, and the only way to
    // decline is to skip — which reads as refusing to engage.
    for (const p of PROBES) {
      const free = p.options.filter((o) => Object.keys(o.weights).length === 0);
      expect(free.length, p.id).toBeGreaterThanOrEqual(1);
    }
  });

  it('only ever points at beliefs that exist', () => {
    const known = new Set(BELIEF_CATALOGUE.map((c) => c.id));
    const orphans: string[] = [];
    for (const p of PROBES) {
      for (const o of p.options) {
        for (const id of Object.keys(o.weights)) {
          if (!known.has(id)) orphans.push(`${p.id}.${o.id} → ${id}`);
        }
      }
    }
    expect(orphans).toEqual([]);
  });

  it('keeps weights on a small, consistent scale', () => {
    for (const p of PROBES) {
      for (const o of p.options) {
        for (const [id, w] of Object.entries(o.weights)) {
          expect(Number.isInteger(w), `${p.id}.${o.id}.${id}`).toBe(true);
          expect(w, `${p.id}.${o.id}.${id}`).toBeGreaterThan(0);
          expect(w, `${p.id}.${o.id}.${id}`).toBeLessThanOrEqual(3);
        }
      }
    }
  });
});

describe('the bank can actually carry the corroboration rule', () => {
  /**
   * The gate in inferBeliefs is only as good as the bank behind it. Requiring
   * two independent probes is right in principle and starves people in
   * practice if the content does not give most beliefs two ways in.
   *
   * So this simulates four hundred people answering, and asserts that the
   * catalogue still has something to say to almost all of them. It is here to
   * fail loudly when the catalogue grows: a batch of new beliefs that each
   * appear in one probe would pass every other test in this file and quietly
   * push the median toward zero.
   *
   * Deterministic — the generator is seeded, so this is a fixed set of four
   * hundred synthetic answer sets, not a dice roll in CI.
   */
  const simulate = () => {
    let seed = 12345;
    const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
    const counts: number[] = [];
    for (let trial = 0; trial < 400; trial++) {
      const answers = [];
      for (const probe of PROBES) {
        if (rnd() < 0.15) continue; // probes are skippable, and people skip them
        if (probe.multi) {
          const picks = probe.options.filter(() => rnd() < 0.35).map((o) => o.id);
          if (picks.length) answers.push({ probeId: probe.id, optionIds: picks, ts: 'T' });
        } else {
          const o = probe.options[Math.floor(rnd() * probe.options.length)]!;
          answers.push({ probeId: probe.id, optionIds: [o.id], ts: 'T' });
        }
      }
      counts.push(inferBeliefs({
        answers, probes: PROBES, catalogue: BELIEF_CATALOGUE, tensions: new Map(),
      }).length);
    }
    return counts.sort((a, b) => a - b);
  };

  const counts = simulate();
  const median = counts[Math.floor(counts.length / 2)]!;

  it('offers somebody something almost every time', () => {
    const empty = counts.filter((c) => c === 0).length;
    expect(empty / counts.length).toBeLessThanOrEqual(0.02);
  });

  it('offers enough to choose between, typically', () => {
    expect(median).toBeGreaterThanOrEqual(4);
  });

  it('does not offer so many that the list stops being a judgement', () => {
    // If nearly the whole catalogue clears the gate for the median person, the
    // gate is not discriminating and the offers are noise wearing a ranking.
    expect(median).toBeLessThanOrEqual(Math.ceil(BELIEF_CATALOGUE.length * 0.6));
  });
});
