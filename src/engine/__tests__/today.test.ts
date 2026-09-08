/**
 * Today's reading, worked by hand.
 *
 * WHICH IDENTITY. Owned identities in the order held, rotated by the day:
 *   day index = floor(ms(date) / 86 400 000), date = the ISO date of `now`
 *   identity  = owned[dayIndex mod owned.length]
 *   2026-05-01 → 20 574 days since epoch; 20 574 mod 3 = 0 → first identity
 *   2026-05-02 → 20 575 mod 3 = 1 → second
 *   2026-05-03 → 20 576 mod 3 = 2 → third
 *   2026-05-04 → 20 577 mod 3 = 0 → first again
 * Same all day — 09:00 and 23:59 on the 1st both give the first — and no
 * randomness anywhere, so two devices agree.
 *
 * WHICH PRACTICES ARE DUE.
 *   daily              always
 *   weekly             unless logged within the last 7 days
 *   when_it_shows_up   never scheduled — it is not the app's to schedule
 *   inactive           never
 *   weekly, last log 6 days ago → not due ; 8 days ago → due
 *
 * THE AREA is the one carrying most importance × gap, from engine/overview.
 * THE QUESTION is the first offer from engine/patterns, or nothing.
 */
import { describe, expect, it } from 'vitest';
import { emptyState } from '../../data/db';
import type { PracticeItem, PracticeLog, TargetIdentity } from '../../types';
import { dayIndexOf, duePractices, todayReading } from '../today';

const T = (d: string, t = '09:00:00') => `${d}T${t}.000Z`;

const identity = (id: string, replacesBeliefId: string): TargetIdentity => ({
  id, text: `I am someone who ${id}.`, replacesBeliefId, areas: ['work'], edited: false, ts: T('2026-04-01'),
});
const practice = (id: string, identityId: string, cadence: PracticeItem['cadence'], active = true): PracticeItem => ({
  id, identityId, kind: 'behaviour', text: `do ${id}`, cadence, active, ts: T('2026-04-01'),
});
const log = (itemId: string, d: string): PracticeLog => ({ id: `l-${itemId}-${d}`, itemId, evidence: 'x', ts: T(d) });

describe('the day', () => {
  it('counts days since the epoch from the ISO date, ignoring the time', () => {
    expect(dayIndexOf(T('2026-05-01'))).toBe(20574);
    expect(dayIndexOf(T('2026-05-01', '23:59:59'))).toBe(20574);
    expect(dayIndexOf(T('2026-05-02'))).toBe(20575);
  });
});

describe('which identity', () => {
  const s = emptyState();
  s.lifebook.identities = [identity('a', 'b-a'), identity('b', 'b-b'), identity('c', 'b-c'),
    { ...identity('blank', 'b-x'), text: '   ' }];
  s.lifebook.beliefs = ['b-a', 'b-b', 'b-c'].map((id) => ({
    id, text: `belief ${id}`, source: 'offered' as const, status: 'confirmed' as const, areas: ['work' as const], ts: T('2026-04-01'),
  }));

  it('rotates through the owned identities by the day, and skips the blank one', () => {
    expect(todayReading(s, T('2026-05-01')).identity?.id).toBe('a');
    expect(todayReading(s, T('2026-05-02')).identity?.id).toBe('b');
    expect(todayReading(s, T('2026-05-03')).identity?.id).toBe('c');
    expect(todayReading(s, T('2026-05-04')).identity?.id).toBe('a');
  });

  it('gives the same identity all day', () => {
    expect(todayReading(s, T('2026-05-01', '00:00:01')).identity?.id).toBe('a');
    expect(todayReading(s, T('2026-05-01', '23:59:59')).identity?.id).toBe('a');
  });

  it('brings the belief the identity replaces', () => {
    expect(todayReading(s, T('2026-05-02')).belief?.id).toBe('b-b');
  });

  it('has nothing to hold when nothing is owned', () => {
    const r = todayReading(emptyState(), T('2026-05-01'));
    expect(r.identity).toBeNull();
    expect(r.belief).toBeNull();
  });
});

describe('which practices are due', () => {
  const items = [
    practice('d', 'i', 'daily'),
    practice('w-fresh', 'i', 'weekly'),
    practice('w-stale', 'i', 'weekly'),
    practice('w-never', 'i', 'weekly'),
    practice('s', 'i', 'when_it_shows_up'),
    practice('off', 'i', 'daily', false),
  ];
  const logs = [log('w-fresh', '2026-05-04'), log('w-stale', '2026-05-02'), log('d', '2026-05-09')];
  const now = T('2026-05-10');

  it('lists daily always, weekly only when a week has passed, and never the rest', () => {
    expect(duePractices(items, logs, now).map((p) => p.id)).toEqual(['d', 'w-stale', 'w-never']);
  });

  it('draws the line at seven days exactly', () => {
    const six = [log('w-never', '2026-05-04')];   // 6 days before now
    const seven = [log('w-never', '2026-05-03')]; // 7 days before now
    const only = items.filter((p) => p.id === 'w-never');
    expect(duePractices(only, six, now)).toEqual([]);
    expect(duePractices(only, seven, now).map((p) => p.id)).toEqual(['w-never']);
  });
});

describe('the rest of the reading', () => {
  it('names the area carrying most distance, with the person\'s own line for it', () => {
    const s = emptyState();
    s.lifebook.visions = [
      { area: 'work', statement: 'Work I would do anyway.', markers: [], importance: 5, ts: T('2026-04-01') },
      { area: 'money', statement: 'Six months of runway.', markers: [], importance: 3, ts: T('2026-04-01') },
    ];
    s.lifebook.currents = [
      { area: 'work', score: 3, description: 'w', ts: T('2026-04-01') },
      { area: 'money', score: 2, description: 'm', ts: T('2026-04-01') },
    ];
    // work: 5 × 7/9 = 3.89 ; money: 3 × 8/9 = 2.67 → work
    const r = todayReading(s, T('2026-05-01'));
    expect(r.area).toMatchObject({ area: 'work', statement: 'Work I would do anyway.', current: 3, importance: 5 });
  });

  it('is honest about a fresh profile: nothing to hold, nowhere to go, nothing due', () => {
    const r = todayReading(emptyState(), T('2026-05-01'));
    expect(r).toMatchObject({ identity: null, belief: null, area: null, due: [], question: null });
  });
});
