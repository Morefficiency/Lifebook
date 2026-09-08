/**
 * Credence and resistance, worked by hand.
 *
 * Every confirmed belief is treated as a prediction generator with a Beta
 * posterior over "its predictions come true". The prior is Beta(3, 1): the
 * person said the belief is theirs, which is a claim that it is borne out, and
 * three-to-one is a strong lean without being certainty.
 *
 * Only the first report per quest counts (same rule as engine/evidence.ts).
 * The feared outcome occurring is the belief being borne out (α += 1); not
 * occurring is the belief being contradicted (β += 1).
 *
 * CLOSED FORMS, for a pencil:
 *   mean        α / (α+β)
 *   variance    αβ / ((α+β)² (α+β+1))
 *   gain        expected reduction in variance from one more test
 *               = variance / (α+β+1)  =  αβ / ((α+β)² (α+β+1)²)
 *
 * WORKED CASES
 *   untested                 Beta(3,1)  mean 0.75      var 3/80  = 0.0375     gain 3/400  = 0.0075
 *   5 tests, 1 occurred      Beta(4,5)  mean 4/9       var 20/810 = 0.024691  gain 20/8100 = 0.0024691
 *   3 tests, 0 occurred      Beta(3,4)  mean 3/7       var 12/392 = 0.030612  gain 12/3136 = 0.0038265
 *
 * RESISTANCE = stated − evidence, where stated is the person's own most recent
 * forecastP on a test of the belief, and evidence is the posterior mean.
 *   Beta(4,5), latest forecast 70%   0.70 − 0.444444 = 0.255556   ≥ 0.20 → held
 *   Beta(3,4), latest forecast 40%   0.40 − 0.428571 = −0.028571  → not held
 *   fewer than 3 reports             resistance is null — not enough to say
 *
 * The gain ordering falls out of the closed form: an untested belief (0.0075)
 * ranks above a well-tested one (0.0025). The least-tested belief is the one a
 * test would tell you most about, which is what "which experiment next" means.
 */
import { describe, expect, it } from 'vitest';
import type { FieldReport, HeldBelief, Quest } from '../../types';
import {
  HELD_AT, MIN_REPORTS_FOR_RESISTANCE, PRIOR_ALPHA, PRIOR_BETA,
  beliefCredence, credenceFor, expectedGain, posteriorMean, posteriorVariance, rankByGain,
} from '../credence';

const close = (n: number | null, expected: number) => {
  expect(n).not.toBeNull();
  expect(n!).toBeCloseTo(expected, 5);
};

const ts = (i: number) => `2026-03-${String(i).padStart(2, '0')}T09:00:00.000Z`;

const belief = (id: string): HeldBelief => ({
  id, text: id, source: 'offered', status: 'confirmed', areas: ['money'], ts: ts(1),
});

const quest = (id: string, beliefId: string, forecastP: number, i: number): Quest => ({
  id, beliefId, forecastP, fearRating: 5,
  wish: 'w', outcome: 'o', obstacle: 'ob', beliefHypothesis: 'h',
  steps: [], fearedOutcomeText: 'f', createdTs: ts(i), status: 'reported',
});

const report = (questId: string, occurred: boolean, i: number): FieldReport => ({
  id: `r-${questId}`, questId, fearedOutcomeOccurred: occurred,
  whatHappened: 'x', learning: occurred ? 'l' : '', ts: ts(i),
});

describe('the closed forms', () => {
  it('start from a three-to-one lean for a confirmed belief', () => {
    expect(PRIOR_ALPHA).toBe(3);
    expect(PRIOR_BETA).toBe(1);
    close(posteriorMean(3, 1), 0.75);
    close(posteriorVariance(3, 1), 0.0375);
    close(expectedGain(3, 1), 0.0075);
  });

  it('match the hand-worked posteriors', () => {
    close(posteriorMean(4, 5), 4 / 9);
    close(posteriorVariance(4, 5), 20 / 810);
    close(expectedGain(4, 5), 20 / 8100);
    close(posteriorMean(3, 4), 3 / 7);
    close(posteriorVariance(3, 4), 12 / 392);
    close(expectedGain(3, 4), 12 / 3136);
  });

  it('gain equals variance over (α+β+1), which is the derivation', () => {
    for (const [a, b] of [[3, 1], [4, 5], [3, 4], [10, 10], [1, 1]] as const) {
      close(expectedGain(a, b), posteriorVariance(a, b) / (a + b + 1));
    }
  });
});

describe('a belief and its record', () => {
  const b = belief('b1');

  it('is at its prior with no tests, and cannot be called held', () => {
    const c = credenceFor(b, [], []);
    expect(c.tested).toBe(0);
    close(c.evidenceRate, 0.75);
    expect(c.statedRate).toBeNull();
    expect(c.resistance).toBeNull();
    expect(c.held).toBe(false);
    close(c.gain, 0.0075);
  });

  it('is held when the person still predicts what their record no longer does', () => {
    // Five tests, forecasts 60 70 80 65 70, the feared thing happened once.
    const quests = [60, 70, 80, 65, 70].map((p, i) => quest(`q${i}`, 'b1', p, i + 1));
    const reports = [false, false, true, false, false].map((o, i) => report(`q${i}`, o, i + 2));
    const c = credenceFor(b, quests, reports);
    expect(c.tested).toBe(5);
    expect(c.occurred).toBe(1);
    close(c.evidenceRate, 4 / 9);
    close(c.statedRate, 0.70);          // the most recent forecast, by quest time
    close(c.resistance, 0.70 - 4 / 9);  // 0.255556
    expect(c.held).toBe(true);
    close(c.gain, 20 / 8100);
  });

  it('is not held when the stated forecast has followed the record down', () => {
    const quests = [70, 55, 40].map((p, i) => quest(`q${i}`, 'b1', p, i + 1));
    const reports = [false, false, false].map((o, i) => report(`q${i}`, o, i + 2));
    const c = credenceFor(b, quests, reports);
    close(c.evidenceRate, 3 / 7);
    close(c.statedRate, 0.40);
    close(c.resistance, 0.40 - 3 / 7);  // −0.028571
    expect(c.held).toBe(false);
  });

  it('refuses to call anything held on fewer than three reports', () => {
    expect(MIN_REPORTS_FOR_RESISTANCE).toBe(3);
    const quests = [90, 90].map((p, i) => quest(`q${i}`, 'b1', p, i + 1));
    const reports = [false, false].map((o, i) => report(`q${i}`, o, i + 2));
    const c = credenceFor(b, quests, reports);
    expect(c.tested).toBe(2);
    expect(c.statedRate).not.toBeNull();
    expect(c.resistance).toBeNull();
    expect(c.held).toBe(false);
  });

  it('counts only the first report on a quest', () => {
    const quests = [70, 70, 70].map((p, i) => quest(`q${i}`, 'b1', p, i + 1));
    const reports = [
      ...[false, false, false].map((o, i) => report(`q${i}`, o, i + 2)),
      { ...report('q0', true, 9), id: 'r-q0-again' },  // a correction, not a fourth test
    ];
    const c = credenceFor(b, quests, reports);
    expect(c.tested).toBe(3);
    expect(c.occurred).toBe(0);
  });

  it('takes the stated rate from the latest quest, not the latest report', () => {
    // q1 was filed later but reported earlier; the stated rate is what the
    // person believed most recently when they made a forecast.
    const quests = [quest('q0', 'b1', 80, 1), quest('q1', 'b1', 30, 5), quest('q2', 'b1', 60, 3)];
    const reports = [report('q0', false, 2), report('q1', false, 6), report('q2', false, 4)];
    close(credenceFor(b, quests, reports).statedRate, 0.30);
  });

  it('uses only quests joined to this belief', () => {
    const quests = [quest('q0', 'b1', 70, 1), quest('q1', 'other', 70, 2)];
    const reports = [report('q0', false, 3), report('q1', true, 4)];
    const c = credenceFor(b, quests, reports);
    expect(c.tested).toBe(1);
    expect(c.occurred).toBe(0);
  });
});

describe('over a whole profile', () => {
  const beliefs = [belief('untested'), belief('tested'), { ...belief('rejected'), status: 'rejected' as const }];
  const quests = [60, 70, 80, 65, 70].map((p, i) => quest(`q${i}`, 'tested', p, i + 1));
  const reports = [false, false, true, false, false].map((o, i) => report(`q${i}`, o, i + 2));

  it('reports every confirmed belief and no rejected one', () => {
    const all = beliefCredence(beliefs, quests, reports);
    expect(all.map((c) => c.beliefId).sort()).toEqual(['tested', 'untested']);
  });

  it('ranks the untested belief first by expected gain', () => {
    const ranked = rankByGain(beliefCredence(beliefs, quests, reports));
    expect(ranked.map((c) => c.beliefId)).toEqual(['untested', 'tested']);
    expect(HELD_AT).toBe(0.2);
  });
});
