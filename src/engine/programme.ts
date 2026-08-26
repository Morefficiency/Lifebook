/**
 * Stage 6 — the programme that rewrites the self-image.
 *
 * Three kinds of item, in ascending order of what they can actually do:
 *
 *   thought       the swap to make when the old belief speaks up
 *   behaviour     an action only the new identity would take — the evidence
 *   affirmation   the sentence, spoken alongside a concrete instance
 *
 * The affirmation is deliberately the smallest of the three and is never logged
 * on its own: every PracticeLog carries the evidence it was said about. A
 * sentence repeated with nothing behind it does not move a self-image, and for
 * someone who does not believe it yet it tends to make things worse. Attached
 * to a real instance from that day, it is a label for something that happened.
 */
import type { BeliefCandidate } from '../content/beliefs';
import type { HeldBelief, PracticeItem, PracticeLog, TargetIdentity } from '../types';

export interface PracticeDraft {
  identityId: string;
  kind: PracticeItem['kind'];
  text: string;
  cue?: string;
  cadence: PracticeItem['cadence'];
}

export function buildProgramme(
  identities: TargetIdentity[],
  beliefs: HeldBelief[],
  catalogue: BeliefCandidate[],
): PracticeDraft[] {
  const beliefById = new Map(beliefs.map((b) => [b.id, b]));
  const catalogueById = new Map(catalogue.map((c) => [c.id, c]));

  return identities.flatMap((identity) => {
    const belief = identity.replacesBeliefId ? beliefById.get(identity.replacesBeliefId) : undefined;
    const source = belief?.candidateId ? catalogueById.get(belief.candidateId) : undefined;
    if (!source) return [];
    return source.practices.map((p) => ({
      identityId: identity.id,
      kind: p.kind,
      text: p.text,
      ...(p.cue ? { cue: p.cue } : {}),
      cadence: p.cadence,
    }));
  });
}

export interface PracticeProgress {
  active: number;
  logged: number;
  /** How many distinct practices have at least one logged instance. */
  practisedItems: number;
  byItem: Map<string, number>;
}

export function practiceProgress(items: PracticeItem[], logs: PracticeLog[]): PracticeProgress {
  const byItem = new Map(items.map((i) => [i.id, 0]));
  for (const log of logs) {
    const prev = byItem.get(log.itemId);
    if (prev !== undefined) byItem.set(log.itemId, prev + 1);
  }
  return {
    active: items.filter((i) => i.active).length,
    logged: [...byItem.values()].reduce((a, b) => a + b, 0),
    practisedItems: [...byItem.values()].filter((n) => n > 0).length,
    byItem,
  };
}
