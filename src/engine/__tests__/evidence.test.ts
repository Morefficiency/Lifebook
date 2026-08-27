/**
 * Hand-worked evidence ledger.
 *
 * Three confirmed beliefs and five quests against them. PREDICTION_BROKEN_
 * THRESHOLD is 60, so a forecast of 60 or more that did not come true counts
 * as the belief being contradicted; below that it was never a confident claim
 * and does not earn the credit.
 *
 *   quest  belief      forecastP  reported          outcome
 *   ------------------------------------------------------------------
 *   q1     enough      80         yes               feared thing did NOT happen  → broken
 *   q2     enough      70         yes               feared thing DID happen      → occurred
 *   q3     enough      —          no (active)       —                            → pending
 *   q4     perfect     55         yes               feared thing did NOT happen  → tested, not broken
 *   q5     (no belief) 90         yes               did NOT happen               → counts for nobody
 *
 *   enough  : tested 2, broken 1, occurred 1, pending 1
 *   perfect : tested 1, broken 0, occurred 0, pending 0
 *   impostor: nothing at all — confirmed, never risked
 *
 *   totals  : tested 3, broken 1, occurred 1, pending 1, beliefsTested 2
 */
import { describe, expect, it } from 'vitest';
import { beliefEvidence, evidenceForBeliefs, evidenceTotals } from '../evidence';
import type { FieldReport, HeldBelief, Quest } from '../../types';

const TS = '2026-04-01T09:00:00.000Z';

const quest = (id: string, forecastP: number, beliefId?: string, status: Quest['status'] = 'reported'): Quest => ({
  id,
  ...(beliefId ? { beliefId } : {}),
  wish: id, outcome: id, obstacle: id, beliefHypothesis: id,
  steps: [], fearRating: 5, forecastP, fearedOutcomeText: `${id} feared`,
  status, createdTs: TS,
});

const report = (questId: string, occurred: boolean, ts = TS): FieldReport => ({
  id: `r-${questId}`, questId, fearedOutcomeOccurred: occurred,
  whatHappened: 'something happened that was long enough to count',
  learning: occurred ? 'a learning' : '', ts,
});

const belief = (id: string, status: HeldBelief['status'] = 'confirmed'): HeldBelief => ({
  id, text: id, source: 'offered', status, areas: ['work'], ts: TS,
});

const QUESTS = [
  quest('q1', 80, 'enough'),
  quest('q2', 70, 'enough'),
  quest('q3', 65, 'enough', 'active'),
  quest('q4', 55, 'perfect'),
  quest('q5', 90),
];
const REPORTS = [
  report('q1', false, '2026-04-02T09:00:00.000Z'),
  report('q2', true, '2026-04-05T09:00:00.000Z'),
  report('q4', false),
  report('q5', false),
];

describe('evidence against a belief', () => {
  const map = beliefEvidence(QUESTS, REPORTS);

  it('counts a confident forecast that did not come true as the belief being wrong', () => {
    expect(map.get('enough')!.broken).toBe(1);
  });

  it('counts the feared outcome happening without treating it as a failure to record', () => {
    expect(map.get('enough')!.occurred).toBe(1);
    expect(map.get('enough')!.tested).toBe(2);
  });

  it('does not credit a forecast that was never confident', () => {
    // 55 is below the threshold: nothing was really claimed, so nothing broke.
    expect(map.get('perfect')!.tested).toBe(1);
    expect(map.get('perfect')!.broken).toBe(0);
  });

  it('counts an unreported quest as out in the world rather than as a result', () => {
    expect(map.get('enough')!.pending).toBe(1);
  });

  it('ignores a quest that is not against any belief', () => {
    expect([...map.keys()].sort()).toEqual(['enough', 'perfect']);
  });

  it('remembers the most recent report, not the first one seen', () => {
    expect(map.get('enough')!.lastTs).toBe('2026-04-05T09:00:00.000Z');
  });

  it('cannot be inflated by filing a second report on the same quest', () => {
    const twice = beliefEvidence(QUESTS, [...REPORTS, report('q1', false, '2026-04-09T09:00:00.000Z')]);
    expect(twice.get('enough')!.tested).toBe(2);
    expect(twice.get('enough')!.broken).toBe(1);
  });

  it('does not count a reported quest as still pending', () => {
    const stillActive = QUESTS.map((q) => (q.id === 'q1' ? { ...q, status: 'active' as const } : q));
    expect(beliefEvidence(stillActive, REPORTS).get('enough')!.pending).toBe(1);
  });
});

describe('the evidence list behind the programme', () => {
  const beliefs = [belief('enough'), belief('perfect'), belief('impostor'), belief('rejected', 'rejected')];
  const rows = evidenceForBeliefs(beliefs, QUESTS, REPORTS);

  it('includes a confirmed belief nothing has been risked against', () => {
    // Hiding it would make the programme look busier than the work has been.
    const impostor = rows.find((r) => r.beliefId === 'impostor')!;
    expect(impostor.tested).toBe(0);
    expect(impostor.pending).toBe(0);
  });

  it('leaves out anything the user ruled out', () => {
    expect(rows.map((r) => r.beliefId)).toEqual(['enough', 'perfect', 'impostor']);
  });

  it('totals across the programme', () => {
    expect(evidenceTotals(rows)).toEqual({
      tested: 3, broken: 1, occurred: 1, pending: 1, beliefsTested: 2,
    });
  });

  it('reports nothing rather than zero-of-zero for a programme never tested', () => {
    const untouched = evidenceForBeliefs(beliefs, [], []);
    expect(evidenceTotals(untouched)).toEqual({
      tested: 0, broken: 0, occurred: 0, pending: 0, beliefsTested: 0,
    });
  });
});
