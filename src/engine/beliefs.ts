/**
 * Stage 4 — scoring candidate beliefs against what the user told us.
 *
 * ==========================================================================
 * THIS IS THE AI SEAM.
 *
 * `inferBeliefs` takes everything known about the user and returns scored
 * candidates with the reasons behind each one. Today it is a deterministic
 * rule engine over the catalogue in src/content/beliefs.ts. Swapping it for a
 * model call means replacing this one function behind the same signature;
 * every stage downstream — confirmation, target identities, the programme —
 * is unchanged, and this implementation stays as the offline fallback.
 * ==========================================================================
 *
 * What this function must never do: conclude anything. It produces candidates
 * to be *asked about*. The user confirms, rejects or rewrites; only what he
 * confirms is ever held as his.
 */
import type { BeliefCandidate } from '../content/beliefs';
import type { Probe } from '../content/probes';
import type { LifeArea, ProbeAnswer } from '../types';

/** Probe answers are direct evidence; the life gap is circumstantial. */
export const PROBE_WEIGHT = 0.7;
export const AREA_WEIGHT = 0.3;
/** The largest tension a single area can produce: importance 5 × gap 1. */
const MAX_AREA_TENSION = 5;

/**
 * Raw evidence at which the probe term reaches half of its ceiling.
 *
 * The probe term used to be `rawProbe / maxProbeScore(candidate)` — each
 * candidate normalised against the most the whole bank could ever say about
 * it. That inverts the thing it is trying to measure. A belief the bank barely
 * asks about has a tiny denominator, so one emphatic answer saturates it,
 * while a belief the bank asks about from ten angles can collect three times
 * the evidence and still score lower.
 *
 * It was not hypothetical. Against the real catalogue, a person who answered
 * every one of the eleven probes that mention `not_enough` in its direction —
 * 23 raw points — was shown `im_an_impostor` first, on 9 points, because nine
 * was all of the ceiling it had.
 *
 * Saturation keeps the two properties that matter and drops the one that hurt:
 * more raw evidence always ranks higher, the curve flattens so no single
 * answer runs away with it, and no candidate gets a discount for being
 * under-asked. It is deliberately NOT a probability, and the UI never shows it
 * as one.
 */
export const EVIDENCE_HALF_POINT = 8;

/**
 * How many different probes must point at a candidate before it is offered.
 *
 * One probe agreeing with itself is not corroboration — it is a single answer
 * with a weight on it. Requiring two independent questions is what stops the
 * catalogue from turning into a horoscope as it grows: a belief has to show up
 * in more than one part of somebody's account of themselves.
 */
export const MIN_DISTINCT_PROBES = 2;

export interface CandidateReason {
  probeId: string;
  optionId: string;
  weight: number;
}

export interface ScoredCandidate {
  id: string;
  candidate: BeliefCandidate;
  /** 0…1. Not a probability, and never shown as one — a rank order, nothing more. */
  score: number;
  probeScore: number;
  /** How many different probes pointed here. Corroboration, not weight. */
  distinctProbes: number;
  areaScore: number;
  becauseProbes: CandidateReason[];
  becauseAreas: { area: LifeArea; tension: number }[];
}

/**
 * The most this candidate could possibly score if every answer pointed at it.
 * Single-choice probes contribute their best option; multi-select probes
 * contribute the sum, since all of them can be picked.
 *
 * This is a COVERAGE measure, not a scoring one — how much of a case the bank
 * could make for a belief at best. It is what the catalogue invariant test
 * measures; see the note on EVIDENCE_HALF_POINT for why it is no longer part
 * of the score.
 */
export function maxProbeScore(candidateId: string, probes: Probe[]): number {
  return probes.reduce((total, probe) => {
    const weights = probe.options.map((o) => o.weights[candidateId] ?? 0);
    if (weights.length === 0) return total;
    return total + (probe.multi
      ? weights.reduce((a, w) => a + w, 0)
      : Math.max(0, ...weights));
  }, 0);
}

export interface InferInput {
  answers: ProbeAnswer[];
  probes: Probe[];
  catalogue: BeliefCandidate[];
  tensions: Map<LifeArea, number>;
  /** Candidates the user has already confirmed or rejected — never offered again. */
  excludeIds?: string[];
  limit?: number;
}

export function inferBeliefs(input: InferInput): ScoredCandidate[] {
  const { answers, probes, catalogue, tensions } = input;
  const exclude = new Set(input.excludeIds ?? []);
  const probeById = new Map(probes.map((p) => [p.id, p]));

  const scored = catalogue.flatMap<ScoredCandidate>((candidate) => {
    if (exclude.has(candidate.id)) return [];

    const becauseProbes: CandidateReason[] = [];
    let probeScore = 0;
    for (const answer of answers) {
      const probe = probeById.get(answer.probeId);
      if (!probe) continue;
      for (const optionId of answer.optionIds) {
        const weight = probe.options.find((o) => o.id === optionId)?.weights[candidate.id] ?? 0;
        if (weight <= 0) continue;
        probeScore += weight;
        becauseProbes.push({ probeId: probe.id, optionId, weight });
      }
    }

    // No behavioural evidence at all means it is not offered, however wide the
    // life gap is. A gap is not evidence of a belief; it is only a reason to
    // weight one that behaviour already points at.
    //
    // Nor is one probe enough. A single answer with a heavy weight on it is not
    // corroboration, and offering a belief on that basis is how a catalogue
    // this size starts sounding like a horoscope.
    const distinctProbes = new Set(becauseProbes.map((r) => r.probeId)).size;
    if (probeScore <= 0 || distinctProbes < MIN_DISTINCT_PROBES) return [];

    const probeTerm = probeScore / (probeScore + EVIDENCE_HALF_POINT);

    const becauseAreas = candidate.areas
      .flatMap((area) => {
        const tension = tensions.get(area);
        return tension === undefined ? [] : [{ area, tension }];
      })
      .sort((a, b) => b.tension - a.tension);

    const ratedAreas = becauseAreas.length;
    const areaRaw = becauseAreas.reduce((a, b) => a + b.tension, 0);
    const maxArea = MAX_AREA_TENSION * ratedAreas;
    const areaTerm = maxArea > 0 ? areaRaw / maxArea : 0;

    // When none of the candidate's areas were rated, the area term is dropped
    // rather than counted as zero — otherwise a candidate is punished for data
    // the user simply never entered.
    const score = ratedAreas > 0
      ? probeTerm * PROBE_WEIGHT + areaTerm * AREA_WEIGHT
      : probeTerm;

    return [{
      id: candidate.id,
      candidate,
      score,
      probeScore,
      distinctProbes,
      areaScore: areaRaw,
      becauseProbes,
      becauseAreas,
    }];
  });

  scored.sort((a, b) => b.score - a.score || (a.id < b.id ? -1 : 1));
  return input.limit ? scored.slice(0, input.limit) : scored;
}
