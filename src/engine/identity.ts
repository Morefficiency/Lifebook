/**
 * Stage 5 — who he would have to be instead.
 *
 * Every target is stated as conduct, never as a trait. "I am confident" is an
 * assertion with nothing behind it and no way to settle it; "I am someone who
 * ships before it is perfect" describes an action, and an action can be taken
 * today and logged. That distinction is the whole design of this stage.
 *
 * A belief the user wrote himself gets no proposal — the app has no counterpart
 * for a sentence it has never seen. He answers that one himself.
 */
import type { BeliefCandidate } from '../content/beliefs';
import type { HeldBelief, LifeArea } from '../types';

export interface IdentityDraft {
  replacesBeliefId: string;
  /** Empty when the belief was self-written and the app has nothing to propose. */
  text: string;
  why: string;
  areas: LifeArea[];
  belief: HeldBelief;
}

export function proposeIdentities(
  beliefs: HeldBelief[],
  catalogue: BeliefCandidate[],
): IdentityDraft[] {
  const byId = new Map(catalogue.map((c) => [c.id, c]));
  return beliefs
    .filter((b) => b.status === 'confirmed')
    .map((belief) => {
      const source = belief.candidateId ? byId.get(belief.candidateId) : undefined;
      return {
        replacesBeliefId: belief.id,
        text: source?.identity ?? '',
        why: source?.identityWhy ?? '',
        areas: belief.areas,
        belief,
      };
    });
}
