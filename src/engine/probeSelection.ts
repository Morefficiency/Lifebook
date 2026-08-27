/**
 * Which probes to actually ask, and in what order.
 *
 * The bank exists to cover a catalogue; a person exists to answer a reasonable
 * number of questions. Those two facts stop agreeing the moment the bank grows
 * past about fifteen items, and the stage that walks all of them turns into a
 * form.
 *
 * So the bank is ordered rather than exhausted. The rule is greedy maximum
 * coverage against the gate the scorer actually applies: a belief needs
 * MIN_DISTINCT_PROBES different probes pointing at it before it can be offered
 * at all, so the next probe worth asking is the one that moves the most
 * beliefs closer to that threshold. Once a belief is covered twice, further
 * probes about it stop earning their place in the queue and drop behind the
 * ones opening up something nobody has been asked about.
 *
 * This is the honest, boring version of adaptive item selection. It does not
 * adapt to the answers — it adapts to the shape of the bank, deterministically,
 * so two people see the same questions in the same order and the ordering can
 * be checked against hand-computed fixtures. Selecting on the answers as they
 * arrive is a real improvement and a much larger one; it needs a measurement
 * model behind it, not a heuristic, and it is not this.
 */
import type { Probe } from '../content/probes';
import { MIN_DISTINCT_PROBES } from './beliefs';

/**
 * How many probes make up the first pass.
 *
 * Sixteen is not a magic number — it is roughly the point where a stage still
 * reads as a set of questions rather than a form, and it is checked rather
 * than assumed: the test suite asserts that the first pass leaves almost every
 * belief in the catalogue answerable.
 */
export const REFLECT_CORE_PROBES = 16;

/** Beliefs a probe could contribute evidence toward. */
export function beliefsTouched(probe: Probe): string[] {
  const ids = new Set<string>();
  for (const option of probe.options) {
    for (const [id, weight] of Object.entries(option.weights)) {
      if (weight > 0) ids.add(id);
    }
  }
  return [...ids].sort();
}

/**
 * The whole bank, ordered so that the earliest probes open up the most.
 *
 * Deterministic throughout: ties break on probe id, never on array order, so
 * inserting a probe in the middle of the source file cannot silently reshuffle
 * the questions everybody sees.
 */
export function orderProbesByCoverage(probes: Probe[]): Probe[] {
  const remaining = [...probes];
  const covered = new Map<string, number>();
  const ordered: Probe[] = [];

  /** How many beliefs this probe would move closer to the offer threshold. */
  const gain = (probe: Probe) =>
    beliefsTouched(probe).filter((id) => (covered.get(id) ?? 0) < MIN_DISTINCT_PROBES).length;

  while (remaining.length > 0) {
    let bestIndex = 0;
    let bestGain = -1;
    for (let i = 0; i < remaining.length; i++) {
      const probe = remaining[i]!;
      const g = gain(probe);
      const best = remaining[bestIndex]!;
      // Most gain wins; then the probe that touches more beliefs overall, since
      // it is the more useful thing to have asked either way; then the id, so
      // the result never depends on where a probe sits in the source file.
      if (
        g > bestGain
        || (g === bestGain && beliefsTouched(probe).length > beliefsTouched(best).length)
        || (g === bestGain
          && beliefsTouched(probe).length === beliefsTouched(best).length
          && probe.id < best.id)
      ) {
        bestIndex = i;
        bestGain = g;
      }
    }
    const [chosen] = remaining.splice(bestIndex, 1);
    ordered.push(chosen!);
    for (const id of beliefsTouched(chosen!)) {
      covered.set(id, (covered.get(id) ?? 0) + 1);
    }
  }

  return ordered;
}

/** The first pass: enough to say something, short enough to finish. */
export function coreProbes(probes: Probe[], n: number = REFLECT_CORE_PROBES): Probe[] {
  return orderProbesByCoverage(probes).slice(0, n);
}

/** Everything the first pass left out, for anyone who wants a sharper read. */
export function extraProbes(probes: Probe[], n: number = REFLECT_CORE_PROBES): Probe[] {
  return orderProbesByCoverage(probes).slice(n);
}

/** How many distinct probes in this set could evidence each belief. */
export function coverageCounts(probes: Probe[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const probe of probes) {
    for (const id of beliefsTouched(probe)) counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return counts;
}
