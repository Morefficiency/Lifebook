/**
 * What a belief has actually survived.
 *
 * Stage 6 hands somebody a programme and counts what they logged. Logging is a
 * report of having done something, which is worth having and is not evidence
 * about the belief — a person can do the behaviour a hundred times while the
 * belief sits underneath entirely untouched, because nothing about it was ever
 * put at risk.
 *
 * A quest is. It makes the belief say in advance what will happen, in a form
 * that can turn out to be wrong: a concrete feared outcome and a number for how
 * likely it is. When the forecast was confident and the feared thing did not
 * happen, that is the belief being contradicted by the person's own week, which
 * is the only kind of contradiction that moves anything (Craske et al. on
 * expectancy violation — the disconfirmation has to be surprising to count).
 *
 * So this module reads the quests back and asks, per belief: how many times has
 * it been put at risk, and how often was it wrong?
 */
import type { FieldReport, HeldBelief, Quest } from '../types';
import { isPredictionBroken } from './scoring';

export interface BeliefEvidence {
  beliefId: string;
  /** Quests filed against this belief and reported on. */
  tested: number;
  /** Reports where a confident forecast of the feared outcome did not happen. */
  broken: number;
  /** Reports where the feared outcome did happen. It is data, not a failure. */
  occurred: number;
  /** Filed and still out in the world. */
  pending: number;
  /** The most recent report against this belief, if any. */
  lastTs: string | null;
}

const empty = (beliefId: string): BeliefEvidence => ({
  beliefId, tested: 0, broken: 0, occurred: 0, pending: 0, lastTs: null,
});

/**
 * Evidence per belief id, for every belief that has any.
 *
 * Only the first report against a quest counts. A quest can in principle be
 * reported on twice; the second is a correction to the record, not a second
 * test, and counting it would let somebody accumulate evidence by re-filing.
 */
export function beliefEvidence(quests: Quest[], reports: FieldReport[]): Map<string, BeliefEvidence> {
  const byQuest = new Map(quests.map((q) => [q.id, q]));
  const out = new Map<string, BeliefEvidence>();
  const reportedQuests = new Set<string>();

  const row = (beliefId: string) => {
    const existing = out.get(beliefId);
    if (existing) return existing;
    const created = empty(beliefId);
    out.set(beliefId, created);
    return created;
  };

  // Reports first, so a quest that has been answered is not also counted as
  // still pending.
  for (const report of reports) {
    const quest = byQuest.get(report.questId);
    if (!quest?.beliefId) continue;
    if (reportedQuests.has(quest.id)) continue;
    reportedQuests.add(quest.id);

    const r = row(quest.beliefId);
    r.tested += 1;
    if (report.fearedOutcomeOccurred) r.occurred += 1;
    else if (isPredictionBroken(quest, report)) r.broken += 1;
    if (r.lastTs === null || report.ts > r.lastTs) r.lastTs = report.ts;
  }

  for (const quest of quests) {
    if (!quest.beliefId) continue;
    if (quest.status !== 'active') continue;
    if (reportedQuests.has(quest.id)) continue;
    row(quest.beliefId).pending += 1;
  }

  return out;
}

/**
 * One line per belief, in the order the beliefs were confirmed, including the
 * ones with nothing against them yet — an untested belief is a fact about the
 * programme, and hiding it would make the page look busier than the work is.
 */
export function evidenceForBeliefs(
  beliefs: HeldBelief[], quests: Quest[], reports: FieldReport[],
): BeliefEvidence[] {
  const map = beliefEvidence(quests, reports);
  return beliefs
    .filter((b) => b.status === 'confirmed')
    .map((b) => map.get(b.id) ?? empty(b.id));
}

/** Across every belief: how much of the programme has actually been risked. */
export function evidenceTotals(rows: BeliefEvidence[]): {
  tested: number; broken: number; occurred: number; pending: number; beliefsTested: number;
} {
  return {
    tested: rows.reduce((a, r) => a + r.tested, 0),
    broken: rows.reduce((a, r) => a + r.broken, 0),
    occurred: rows.reduce((a, r) => a + r.occurred, 0),
    pending: rows.reduce((a, r) => a + r.pending, 0),
    beliefsTested: rows.filter((r) => r.tested > 0).length,
  };
}
