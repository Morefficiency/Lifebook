/**
 * Credence and resistance — the bookkeeping a belief's record deserves.
 *
 * A confirmed belief is a prediction generator. "I am someone who can't ask for
 * money" predicts, every time asking comes up, that it will go badly. Every
 * experiment joined to it is a test of that prediction — the person writes down
 * the feared outcome and a number for how likely it is — and every report is
 * the error: did it happen, or not.
 *
 * The app already records both. This module adds up what they say.
 *
 * Per belief, a Beta posterior over "its predictions come true":
 *
 *   prior          Beta(3, 1) — the person said it was theirs, which is a claim
 *                  that it is borne out; three-to-one is a strong lean without
 *                  being certainty
 *   feared thing   happened → α += 1 ; did not → β += 1
 *   evidence rate  the posterior mean, α / (α+β)
 *   stated rate    the person's own most recent forecast on a test of it
 *   resistance     stated − evidence
 *   held           resistance ≥ HELD_AT, with at least MIN_REPORTS reports
 *   gain           how much one more test would narrow the posterior, in closed
 *                  form — the least-tested belief ranks highest
 *
 * RESISTANCE is the rigorous form of "what is holding me back". In the language
 * of active inference it is a high-precision prior: a belief that explains
 * contradicting evidence away rather than updating on it. Here it is nothing
 * more mysterious than the gap between what a person still predicts and what
 * their own record has been saying — which is exactly the kind of thing that is
 * invisible from inside and obvious once written down.
 *
 * What this module does not do, on purpose: it never says what a held belief
 * means. It reports "tested five times, happened once, you still predict 70%"
 * and stops. Every number here is the person's own record added up (Design Law
 * 5), and the phrase the UI uses is the one the map already uses — what your
 * own answers add up to.
 */
import type { FieldReport, HeldBelief, Quest } from '../types';

/** Beta(3, 1): confirmed means leaning true. */
export const PRIOR_ALPHA = 3;
export const PRIOR_BETA = 1;
/** Below this many reports, nothing is called held. Two points is a guess. */
export const MIN_REPORTS_FOR_RESISTANCE = 3;
/** Stated minus evidence at or above this is a belief held against the record. */
export const HELD_AT = 0.2;

/* -------------------------------------------------------------------------- *
 * The closed forms. Kept as separate functions so the tests can check each
 * one against a pencil.
 * -------------------------------------------------------------------------- */

export function posteriorMean(alpha: number, beta: number): number {
  return alpha / (alpha + beta);
}

export function posteriorVariance(alpha: number, beta: number): number {
  const n = alpha + beta;
  return (alpha * beta) / (n * n * (n + 1));
}

/**
 * Expected reduction in posterior variance from one more Bernoulli test.
 *
 * With p ~ Beta(α, β) and one more observation x, the expected posterior
 * variance is αβ / ((α+β)(α+β+1)²) whichever way x falls, so the reduction is
 *   αβ / ((α+β)²(α+β+1)) − αβ / ((α+β)(α+β+1)²) = αβ / ((α+β)²(α+β+1)²)
 * which is the current variance over (α+β+1). An untested belief has the most
 * to gain from a test, which is what "which experiment next" should mean.
 */
export function expectedGain(alpha: number, beta: number): number {
  return posteriorVariance(alpha, beta) / (alpha + beta + 1);
}

/* -------------------------------------------------------------------------- *
 * Per belief.
 * -------------------------------------------------------------------------- */

export interface BeliefCredence {
  beliefId: string;
  /** Reports counted — the first per quest. */
  tested: number;
  /** Of those, how often the feared outcome happened. */
  occurred: number;
  alpha: number;
  beta: number;
  /** Posterior mean: how often the belief's predictions have come true, prior included. */
  evidenceRate: number;
  /** The person's most recent forecastP on a test of this belief, 0–1. Null if never tested. */
  statedRate: number | null;
  /** stated − evidence. Null below MIN_REPORTS_FOR_RESISTANCE. */
  resistance: number | null;
  held: boolean;
  /** Expected narrowing from one more test. Higher means more to learn. */
  gain: number;
}

/**
 * The record for one belief.
 *
 * Only the first report against a quest counts — a second is a correction to
 * the record, not a second test (the same rule as engine/evidence.ts). The
 * stated rate is taken from the latest *quest* by creation time, not the latest
 * report: it is what the person believed most recently when they made a
 * forecast, which is the thing resistance is about.
 */
export function credenceFor(
  belief: HeldBelief,
  quests: Quest[],
  reports: FieldReport[],
): BeliefCredence {
  const mine = quests.filter((q) => q.beliefId === belief.id);
  const byId = new Map(mine.map((q) => [q.id, q]));

  let occurred = 0;
  let tested = 0;
  const seen = new Set<string>();
  for (const r of reports) {
    if (!byId.has(r.questId) || seen.has(r.questId)) continue;
    seen.add(r.questId);
    tested += 1;
    if (r.fearedOutcomeOccurred) occurred += 1;
  }

  const alpha = PRIOR_ALPHA + occurred;
  const beta = PRIOR_BETA + (tested - occurred);
  const evidenceRate = posteriorMean(alpha, beta);

  const latest = mine.reduce<Quest | null>(
    (best, q) => (best === null || q.createdTs > best.createdTs ? q : best),
    null,
  );
  const statedRate = latest ? latest.forecastP / 100 : null;

  const resistance =
    statedRate !== null && tested >= MIN_REPORTS_FOR_RESISTANCE
      ? statedRate - evidenceRate
      : null;

  return {
    beliefId: belief.id,
    tested, occurred, alpha, beta,
    evidenceRate,
    statedRate,
    resistance,
    held: resistance !== null && resistance >= HELD_AT,
    gain: expectedGain(alpha, beta),
  };
}

/** Every confirmed belief's record. Rejected and pending beliefs are not priors. */
export function beliefCredence(
  beliefs: HeldBelief[],
  quests: Quest[],
  reports: FieldReport[],
): BeliefCredence[] {
  return beliefs
    .filter((b) => b.status === 'confirmed')
    .map((b) => credenceFor(b, quests, reports));
}

/**
 * Which belief a test would say most about, first.
 *
 * Ties — which happen whenever two beliefs have the same record, most often
 * two untested ones — fall back to id so the order is stable across renders.
 */
export function rankByGain(rows: BeliefCredence[]): BeliefCredence[] {
  return [...rows].sort((a, b) => b.gain - a.gain || (a.beliefId < b.beliefId ? -1 : 1));
}
