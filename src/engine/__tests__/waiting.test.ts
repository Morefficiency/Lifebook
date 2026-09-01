/**
 * Hand-worked. "Now" is fixed at 2026-06-01, and every date below is chosen so
 * the threshold it is testing is unambiguous rather than borderline.
 *
 *   thresholds: test out 7 days · contradicted at 2 · placement 120 · map 180
 *
 *   q1  forged 2026-05-01, active, never reported   → 31 days out   → surfaces
 *   q2  forged 2026-05-29, active, never reported   →  3 days out   → too new
 *   q3  forged 2026-04-01, reported                 → answered      → silent
 *   b1  'enough'  — 2 broken predictions, still confirmed           → surfaces
 *   b2  'perfect' — 1 broken prediction                             → below CONTRADICTED_AT
 *   b3  'gone'    — 2 broken, but the user rejected it              → silent
 *   currents: work placed 2026-05-20 (12 days), money 2025-12-01 (182) → money only
 *   pairRatings: newest 2025-10-01 → 243 days → map is stale
 *
 *   Order is by what earns being said, not by age:
 *     belief_contradicted, test_out, placement_stale, map_stale
 */
import { describe, expect, it } from 'vitest';
import { emptyState } from '../../data/db';
import {
  CONTRADICTED_AT, TEST_OUT_AFTER_DAYS, WAITING_SHOWN,
  daysBetween, waitingToShow, whatIsWaiting,
} from '../waiting';
import type { AppState, FieldReport, HeldBelief, Quest } from '../../types';

const NOW = '2026-06-01T12:00:00.000Z';

const quest = (id: string, createdTs: string, status: Quest['status'], forecastP = 80): Quest => ({
  id, wish: id, outcome: id, obstacle: id, beliefHypothesis: id,
  steps: [], fearRating: 5, forecastP, fearedOutcomeText: `${id} feared`,
  status, createdTs,
});
const withBelief = (q: Quest, beliefId: string): Quest => ({ ...q, beliefId });
const report = (questId: string, occurred: boolean, ts: string): FieldReport => ({
  id: `r-${questId}`, questId, fearedOutcomeOccurred: occurred,
  whatHappened: 'long enough to count as a description', learning: '', ts,
});
const belief = (
  id: string, status: HeldBelief['status'] = 'confirmed', ts = '2026-01-01T00:00:00.000Z',
): HeldBelief => ({ id, text: id, source: 'offered', status, areas: ['work'], ts });

function build(): AppState {
  const s = emptyState();
  s.quests = [
    withBelief(quest('q1', '2026-05-01T12:00:00.000Z', 'active'), 'enough'),
    withBelief(quest('q2', '2026-05-29T12:00:00.000Z', 'active'), 'enough'),
    withBelief(quest('q3', '2026-04-01T12:00:00.000Z', 'reported'), 'enough'),
    withBelief(quest('q4', '2026-03-01T12:00:00.000Z', 'reported'), 'enough'),
    withBelief(quest('q5', '2026-03-02T12:00:00.000Z', 'reported'), 'perfect'),
    withBelief(quest('q6', '2026-03-03T12:00:00.000Z', 'reported'), 'gone'),
    withBelief(quest('q7', '2026-03-04T12:00:00.000Z', 'reported'), 'gone'),
  ];
  s.reports = [
    report('q3', false, '2026-04-10T12:00:00.000Z'),
    report('q4', false, '2026-04-20T12:00:00.000Z'),
    report('q5', false, '2026-04-11T12:00:00.000Z'),
    report('q6', false, '2026-04-12T12:00:00.000Z'),
    report('q7', false, '2026-04-13T12:00:00.000Z'),
  ];
  s.lifebook.beliefs = [belief('enough'), belief('perfect'), belief('gone', 'rejected')];
  s.lifebook.currents = [
    { area: 'work', score: 4, description: 'w', ts: '2026-05-20T12:00:00.000Z' },
    { area: 'money', score: 2, description: 'm', ts: '2025-12-01T12:00:00.000Z' },
  ];
  s.pairRatings = [
    { aId: 'a', bId: 'b', effect: -2, heat: 8, ts: '2025-09-01T12:00:00.000Z' },
    { aId: 'a', bId: 'c', effect: 1, ts: '2025-10-01T12:00:00.000Z' },
  ];
  return s;
}

describe('days between', () => {
  it('counts whole days and never goes negative', () => {
    expect(daysBetween('2026-05-01T12:00:00.000Z', NOW)).toBe(31);
    expect(daysBetween(NOW, '2026-05-01T12:00:00.000Z')).toBe(0);
    expect(daysBetween('nonsense', NOW)).toBe(0);
  });
});

describe('what is waiting', () => {
  const items = whatIsWaiting(build(), NOW);

  it('leads with the belief the person\'s own evidence has contradicted', () => {
    expect(items[0]!.kind).toBe('belief_contradicted');
    expect(items[0]!.beliefId).toBe('enough');
    expect(items[0]!.broken).toBe(2);
  });

  it('does not raise a belief that has only been wrong once', () => {
    expect(items.filter((i) => i.beliefId === 'perfect')).toEqual([]);
    expect(CONTRADICTED_AT).toBe(2);
  });

  it('counts nothing from before the person last said the belief was his', () => {
    // Two broken predictions in April, but he re-ruled on it in May having
    // seen them. Saying it again on every visit afterwards would be a nag
    // wearing the clothes of a fact.
    const s = build();
    s.lifebook.beliefs = [belief('enough', 'confirmed', '2026-05-01T12:00:00.000Z')];
    expect(whatIsWaiting(s, NOW).filter((i) => i.kind === 'belief_contradicted')).toEqual([]);
  });

  it('speaks again once new evidence arrives after that', () => {
    const s = build();
    s.lifebook.beliefs = [belief('enough', 'confirmed', '2026-05-01T12:00:00.000Z')];
    s.quests = [...s.quests,
      { ...quest('q8', '2026-05-05T12:00:00.000Z', 'reported'), beliefId: 'enough' },
      { ...quest('q9', '2026-05-06T12:00:00.000Z', 'reported'), beliefId: 'enough' }];
    s.reports = [...s.reports,
      report('q8', false, '2026-05-10T12:00:00.000Z'),
      report('q9', false, '2026-05-11T12:00:00.000Z')];
    const item = whatIsWaiting(s, NOW).find((i) => i.kind === 'belief_contradicted');
    expect(item?.broken).toBe(2);
  });

  it('says nothing about a belief the user already ruled out', () => {
    // Two broken predictions against it, but it is not his any more, so
    // revisiting it is not on offer.
    expect(items.filter((i) => i.beliefId === 'gone')).toEqual([]);
  });

  it('raises a test that has been out a while', () => {
    const out = items.filter((i) => i.kind === 'test_out');
    expect(out).toHaveLength(1);
    expect(out[0]!.questId).toBe('q1');
    expect(out[0]!.days).toBe(31);
  });

  it('says nothing about a test forged this week', () => {
    // Nothing may surface on day one, or the page always has something waiting.
    expect(items.some((i) => i.questId === 'q2')).toBe(false);
    expect(TEST_OUT_AFTER_DAYS).toBe(7);
  });

  it('says nothing about a test that was already answered', () => {
    expect(items.some((i) => i.questId === 'q3')).toBe(false);
  });

  it('names the oldest placement and only the oldest', () => {
    const stale = items.filter((i) => i.kind === 'placement_stale');
    expect(stale).toHaveLength(1);
    expect(stale[0]!.area).toBe('money');
    expect(stale[0]!.days).toBe(182);
  });

  it('says how old the map is once it is genuinely old', () => {
    const map = items.filter((i) => i.kind === 'map_stale');
    expect(map).toHaveLength(1);
    expect(map[0]!.days).toBe(243);
  });

  it('orders by what earns being said, not by age', () => {
    expect(items.map((i) => i.kind)).toEqual([
      'belief_contradicted', 'test_out', 'placement_stale', 'map_stale',
    ]);
  });

  it('shows at most two, so it stays a nudge and not a to-do list', () => {
    expect(waitingToShow(build(), NOW)).toHaveLength(WAITING_SHOWN);
  });
});

describe('a life with nothing waiting', () => {
  it('says nothing at all on a fresh profile', () => {
    expect(whatIsWaiting(emptyState(), NOW)).toEqual([]);
  });

  it('says nothing the day somebody finishes', () => {
    // Everything is new: a quest forged today, an area placed today, a map
    // rated today. A page that already has something waiting is a chore list.
    const s = emptyState();
    s.quests = [withBelief(quest('fresh', NOW, 'active'), 'enough')];
    s.lifebook.beliefs = [belief('enough', 'confirmed', NOW)];
    s.lifebook.currents = [{ area: 'work', score: 4, description: 'w', ts: NOW }];
    s.pairRatings = [{ aId: 'a', bId: 'b', effect: -1, heat: 3, ts: NOW }];
    expect(whatIsWaiting(s, NOW)).toEqual([]);
  });
});
