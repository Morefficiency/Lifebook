/**
 * Patterns the person never named, worked by hand.
 *
 * Three kinds of offer, each from the record and each phrased as a question.
 * Nothing is offered below its minimum n: an offer from two data points is a
 * guess with a straight face.
 *
 * CALIBRATION, per area, ≥ 3 reports. Reports reach an area through the belief
 * their quest tests (belief.areas). A belief on two areas puts its reports on
 * both.
 *   Money: forecasts 70 60 80 → mean 0.70 ; occurred 0/3 → rate 0 ; bias +0.70
 *          |bias| ≥ 0.30 → offered
 *   Work:  forecasts 50 40 60 → mean 0.50 ; occurred 2/3 → rate 0.667 ; bias −0.167
 *          → not offered
 *   Love:  2 reports → not enough → not offered
 *
 * AVOIDANCE. An area with importance ≥ 4 and no quest joined to any belief on
 * it, once the person has run ≥ 3 quests anywhere — otherwise everybody is
 * "avoiding" everything on day one.
 *   partner importance 5, no quests on it, 6 quests elsewhere → offered
 *   health  importance 3, no quests → not important enough → not offered
 *   money   importance 4, has quests → not offered
 *
 * HELD. Every belief credence.ts calls held, one line each.
 */
import { describe, expect, it } from 'vitest';
import { emptyState } from '../../data/db';
import type { FieldReport, HeldBelief, Quest } from '../../types';
import {
  AVOIDANCE_MIN_IMPORTANCE, AVOIDANCE_MIN_QUESTS, CALIBRATION_BIAS_AT, CALIBRATION_MIN_REPORTS,
  areaCalibration, offers,
} from '../patterns';

const ts = (i: number) => `2026-04-${String(i).padStart(2, '0')}T09:00:00.000Z`;

const belief = (id: string, areas: HeldBelief['areas']): HeldBelief => ({
  id, text: `belief ${id}`, source: 'offered', status: 'confirmed', areas, ts: ts(1),
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

/** The worked profile: three beliefs, eight quests, all but two reported. */
function profile() {
  const s = emptyState();
  s.lifebook.visions = [
    { area: 'money', statement: 'm', markers: [], importance: 4, ts: ts(1) },
    { area: 'work', statement: 'w', markers: [], importance: 5, ts: ts(1) },
    { area: 'partner', statement: 'p', markers: [], importance: 5, ts: ts(1) },
    { area: 'health', statement: 'h', markers: [], importance: 3, ts: ts(1) },
  ];
  s.lifebook.beliefs = [
    belief('b-money', ['money']),
    belief('b-work', ['work']),
    belief('b-love', ['partner']),
  ];
  s.quests = [
    quest('m1', 'b-money', 70, 2), quest('m2', 'b-money', 60, 3), quest('m3', 'b-money', 80, 4),
    quest('w1', 'b-work', 50, 5), quest('w2', 'b-work', 40, 6), quest('w3', 'b-work', 60, 7),
  ];
  s.reports = [
    report('m1', false, 3), report('m2', false, 4), report('m3', false, 5),
    report('w1', true, 6), report('w2', true, 7), report('w3', false, 8),
  ];
  return s;
}

describe('calibration per area', () => {
  const s = profile();
  const rows = areaCalibration(s.lifebook.beliefs, s.quests, s.reports);
  const row = (a: string) => rows.find((r) => r.area === a);

  it('averages the forecasts and counts the occurrences', () => {
    expect(row('money')).toMatchObject({ n: 3, occurred: 0 });
    expect(row('money')!.meanForecast).toBeCloseTo(0.7, 5);
    expect(row('money')!.rate).toBeCloseTo(0, 5);
    expect(row('money')!.bias).toBeCloseTo(0.7, 5);
    expect(row('work')!.meanForecast).toBeCloseTo(0.5, 5);
    expect(row('work')!.rate).toBeCloseTo(2 / 3, 5);
    expect(row('work')!.bias).toBeCloseTo(0.5 - 2 / 3, 5);
  });

  it('says nothing about an area with fewer than three reports', () => {
    expect(CALIBRATION_MIN_REPORTS).toBe(3);
    expect(row('partner')).toBeUndefined();
  });

  it('puts a two-area belief\'s reports on both areas', () => {
    const t = profile();
    t.lifebook.beliefs = [belief('b-both', ['money', 'work'])];
    t.quests = [1, 2, 3].map((i) => quest(`q${i}`, 'b-both', 90, i));
    t.reports = [1, 2, 3].map((i) => report(`q${i}`, false, i + 1));
    const both = areaCalibration(t.lifebook.beliefs, t.quests, t.reports);
    expect(both.map((r) => r.area).sort()).toEqual(['money', 'work']);
    expect(both[0]!.questIds).toEqual(['q1', 'q2', 'q3']);
  });

  it('but offers those same three reports once, naming both areas, not twice', () => {
    const t = profile();
    t.lifebook.beliefs = [belief('b-both', ['money', 'work'])];
    t.quests = [1, 2, 3].map((i) => quest(`q${i}`, 'b-both', 90, i));
    t.reports = [1, 2, 3].map((i) => report(`q${i}`, false, i + 1));
    const cal = offers(t).filter((o) => o.kind === 'calibration');
    expect(cal).toHaveLength(1);
    expect(cal[0]!.areas).toEqual(['money', 'work']);
    expect(cal[0]!.evidence[0]).toMatch(/^In Money and Work & Craft you have forecast/);
    expect(cal[0]!.question).toMatch(/about Money and Work & Craft, or a habit/);
  });
});

describe('the offers', () => {
  const s = profile();
  const all = offers(s);
  const kinds = (k: string) => all.filter((o) => o.kind === k);

  it('offer the miscalibrated area as a question, with its evidence', () => {
    expect(CALIBRATION_BIAS_AT).toBe(0.3);
    const cal = kinds('calibration');
    expect(cal.map((o) => o.area)).toEqual(['money']);
    expect(cal[0]!.question).toMatch(/\?$/);
    expect(cal[0]!.evidence.join(' ')).toMatch(/70%/);
    expect(cal[0]!.evidence.join(' ')).toMatch(/0 of 3/);
  });

  it('offer the important untested area, and not the unimportant one', () => {
    expect(AVOIDANCE_MIN_IMPORTANCE).toBe(4);
    expect(AVOIDANCE_MIN_QUESTS).toBe(3);
    expect(kinds('avoidance').map((o) => o.area)).toEqual(['partner']);
  });

  it('offer no avoidance at all until three quests have been run anywhere', () => {
    const t = profile();
    t.quests = t.quests.slice(0, 2);
    t.reports = t.reports.slice(0, 2);
    expect(offers(t).filter((o) => o.kind === 'avoidance')).toEqual([]);
  });

  it('offer nothing from a fresh profile', () => {
    expect(offers(emptyState())).toEqual([]);
  });

  it('carry a held belief through from credence', () => {
    const t = profile();
    // Money: 3 tests, none occurred, latest forecast 80 → Beta(3,4) mean 0.4286,
    // resistance 0.80 − 0.4286 = 0.371 ≥ 0.20 → held.
    const held = offers(t).filter((o) => o.kind === 'held');
    expect(held.map((o) => o.beliefId)).toEqual(['b-money']);
    expect(held[0]!.evidence.join(' ')).toMatch(/3/);
    expect(held[0]!.evidence.join(' ')).toMatch(/80%/);
  });

  it('point each offer at the one screen where it can be acted on', () => {
    for (const o of all) expect(o.to.startsWith('/')).toBe(true);
  });
});
