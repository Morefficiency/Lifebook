/**
 * Two devices, one account.
 *
 * The rules, worked through by hand before the implementation:
 *
 *   1. APPEND-ONLY LOGS (ledger, reports, practiceLogs, forks) — union by id.
 *      Entries are immutable, so a union loses nothing and the tie-break never
 *      fires. This is the case that has to be exactly right: the ledger is the
 *      one thing in the app that claims to be a complete record.
 *
 *   2. COLLECTIONS THAT CARRY THEIR OWN `ts` (visions, currents, probes,
 *      beliefs, identities, pairRatings, values) — union by key, and where both
 *      sides hold the same key, the entry with the later `ts` wins. The item's
 *      own timestamp is better evidence than the document's.
 *
 *   3. COLLECTIONS WITH NO `ts` (quests, strivings, practices) — union by id,
 *      and where both sides hold the same id, take the side from whichever
 *      document was written more recently.
 *
 *   4. FACTS ABOUT WHEN SOMETHING HAPPENED (consent, mirrorCompletedTs,
 *      stagesCompleted) — the earliest non-null wins. You cannot complete a
 *      stage twice, so the first time is the true time.
 *
 *   5. DERIVED NUMBERS (xp, badges) are never merged. They are recomputed from
 *      the merged document by the caller.
 */
import { describe, expect, it } from 'vitest';
import { mergeStates } from '../merge';
import { emptyLifebook, type AppState } from '../../types';

const T = (n: number) => `2026-03-0${n}T09:00:00.000Z`;

function base(): AppState {
  return {
    version: 1,
    lifebook: emptyLifebook(),
    profile: { xp: 0, badges: [], consent: null, initialConflictLoad: null, mirrorCompletedTs: null },
    values: null,
    strivings: [], pairRatings: [], forks: [], quests: [], reports: [], ledger: [],
  };
}

const entry = (id: string, ts: string) => ({ id, ts, kind: 'step_done' as const, payload: {} });

describe('append-only logs are unioned, never chosen between', () => {
  it('keeps every ledger entry from both devices, in time order', () => {
    const local = base();
    local.ledger = [entry('a', T(1)), entry('c', T(3))];
    const remote = base();
    remote.ledger = [entry('a', T(1)), entry('b', T(2))];

    const merged = mergeStates(local, remote, T(9), T(8));
    expect(merged.ledger.map((e) => e.id)).toEqual(['a', 'b', 'c']);
  });

  it('never duplicates an entry both devices already had', () => {
    const local = base();
    local.ledger = [entry('a', T(1)), entry('b', T(2))];
    const remote = base();
    remote.ledger = [entry('b', T(2)), entry('a', T(1))];
    expect(mergeStates(local, remote, T(9), T(8)).ledger).toHaveLength(2);
  });

  it('unions practice logs — the evidence record must not lose an instance', () => {
    const local = base();
    local.lifebook.practiceLogs = [{ id: 'l1', itemId: 'p', evidence: 'here', ts: T(1) }];
    const remote = base();
    remote.lifebook.practiceLogs = [{ id: 'l2', itemId: 'p', evidence: 'there', ts: T(2) }];
    expect(mergeStates(local, remote, T(9), T(8)).lifebook.practiceLogs.map((l) => l.id))
      .toEqual(['l1', 'l2']);
  });

  it('unions field reports and fork decisions too', () => {
    const local = base();
    local.reports = [{ id: 'r1', questId: 'q', fearedOutcomeOccurred: false, whatHappened: 'x', learning: '', ts: T(1) }];
    local.forks = [{ id: 'f1', edge: { aId: 'a', bId: 'b' }, choice: 'carry', note: 'n', ts: T(1) }];
    const remote = base();
    remote.reports = [{ id: 'r2', questId: 'q2', fearedOutcomeOccurred: true, whatHappened: 'y', learning: 'z', ts: T(2) }];
    remote.forks = [{ id: 'f2', edge: { aId: 'c', bId: 'd' }, choice: 'release', note: 'n', ts: T(2) }];

    const merged = mergeStates(local, remote, T(9), T(8));
    expect(merged.reports).toHaveLength(2);
    expect(merged.forks).toHaveLength(2);
  });
});

describe('items that carry their own timestamp resolve on that timestamp', () => {
  const vision = (area: 'work' | 'health', statement: string, ts: string) => ({
    area, statement, markers: [], importance: 3 as const, ts,
  });

  it('the later edit of the same area wins, even from the older document', () => {
    const local = base();
    local.lifebook.visions = [vision('work', 'edited on the phone', T(5))];
    const remote = base();
    remote.lifebook.visions = [vision('work', 'edited on the laptop', T(2))];

    // The remote *document* is newer overall, but this particular vision is not.
    const merged = mergeStates(local, remote, T(6), T(9));
    expect(merged.lifebook.visions[0]!.statement).toBe('edited on the phone');
  });

  it('areas only one device has are kept', () => {
    const local = base();
    local.lifebook.visions = [vision('work', 'w', T(1))];
    const remote = base();
    remote.lifebook.visions = [vision('health', 'h', T(2))];
    expect(mergeStates(local, remote, T(9), T(8)).lifebook.visions.map((v) => v.area).sort())
      .toEqual(['health', 'work']);
  });

  it('a belief ruled on more recently wins, so a later change of mind sticks', () => {
    const local = base();
    local.lifebook.beliefs = [{ id: 'b1', candidateId: 'c', text: 'x', source: 'offered', status: 'rejected', areas: [], ts: T(1) }];
    const remote = base();
    remote.lifebook.beliefs = [{ id: 'b1', candidateId: 'c', text: 'x', source: 'offered', status: 'confirmed', areas: [], ts: T(4) }];
    expect(mergeStates(local, remote, T(9), T(1)).lifebook.beliefs[0]!.status).toBe('confirmed');
  });

  it('pair ratings resolve per edge on their own timestamp', () => {
    const local = base();
    local.pairRatings = [{ aId: 'a', bId: 'b', effect: -2, heat: 8, ts: T(1) }];
    const remote = base();
    remote.pairRatings = [{ aId: 'a', bId: 'b', effect: 1, ts: T(5) }];
    const merged = mergeStates(local, remote, T(9), T(1));
    expect(merged.pairRatings).toHaveLength(1);
    expect(merged.pairRatings[0]!.effect).toBe(1);
  });

  it('the values selection resolves on its own timestamp', () => {
    const local = base();
    local.values = { chosen: ['a'], reflection: 'old', ts: T(1) };
    const remote = base();
    remote.values = { chosen: ['b'], reflection: 'new', ts: T(4) };
    expect(mergeStates(local, remote, T(9), T(1)).values!.reflection).toBe('new');
  });
});

describe('items with no timestamp fall back to which document is newer', () => {
  const quest = (id: string, wish: string) => ({
    id, wish, outcome: '', obstacle: 'o', beliefHypothesis: '', steps: [],
    fearRating: 5, forecastP: 50, fearedOutcomeText: 'f', status: 'active' as const,
    createdTs: T(1),
  });

  it('the newer document wins for a quest both devices changed', () => {
    const local = base();
    local.quests = [quest('q1', 'from the phone')];
    const remote = base();
    remote.quests = [quest('q1', 'from the laptop')];

    expect(mergeStates(local, remote, T(9), T(2)).quests[0]!.wish).toBe('from the phone');
    expect(mergeStates(local, remote, T(2), T(9)).quests[0]!.wish).toBe('from the laptop');
  });

  it('quests only one device has are still kept, whichever is newer', () => {
    const local = base();
    local.quests = [quest('q1', 'a')];
    const remote = base();
    remote.quests = [quest('q2', 'b')];
    expect(mergeStates(local, remote, T(2), T(9)).quests.map((q) => q.id).sort()).toEqual(['q1', 'q2']);
  });
});

describe('facts about when something happened take the earliest', () => {
  it('consent keeps the first time it was given', () => {
    const local = base();
    local.profile.consent = { notTherapyAck: true, dataLocalAck: true, ts: T(5) };
    const remote = base();
    remote.profile.consent = { notTherapyAck: true, dataLocalAck: true, ts: T(2) };
    expect(mergeStates(local, remote, T(9), T(1)).profile.consent!.ts).toBe(T(2));
  });

  it('a stage completed on both devices keeps the earlier completion', () => {
    const local = base();
    local.lifebook.stagesCompleted = { vision: T(5), current: T(6) };
    const remote = base();
    remote.lifebook.stagesCompleted = { vision: T(2) };
    const merged = mergeStates(local, remote, T(9), T(1));
    expect(merged.lifebook.stagesCompleted.vision).toBe(T(2));
    expect(merged.lifebook.stagesCompleted.current).toBe(T(6));
  });

  it('the Coherence baseline travels with the mirror completion it belongs to', () => {
    const local = base();
    local.profile.mirrorCompletedTs = T(5);
    local.profile.initialConflictLoad = 9.9;
    const remote = base();
    remote.profile.mirrorCompletedTs = T(2);
    remote.profile.initialConflictLoad = 5.9;
    const merged = mergeStates(local, remote, T(9), T(1));
    expect(merged.profile.mirrorCompletedTs).toBe(T(2));
    expect(merged.profile.initialConflictLoad).toBe(5.9);
  });

  it('one side having nothing is not treated as an earlier answer', () => {
    const local = base();
    local.profile.mirrorCompletedTs = T(5);
    local.profile.initialConflictLoad = 3;
    const merged = mergeStates(local, base(), T(9), T(1));
    expect(merged.profile.mirrorCompletedTs).toBe(T(5));
    expect(merged.profile.initialConflictLoad).toBe(3);
  });
});

describe('the merge is safe to run in either direction', () => {
  it('produces the same document whichever device is asking', () => {
    const local = base();
    local.ledger = [entry('a', T(1))];
    local.lifebook.visions = [{ area: 'work', statement: 'w', markers: [], importance: 3, ts: T(3) }];
    local.profile.consent = { notTherapyAck: true, dataLocalAck: true, ts: T(2) };
    const remote = base();
    remote.ledger = [entry('b', T(2))];
    remote.lifebook.visions = [{ area: 'health', statement: 'h', markers: [], importance: 4, ts: T(1) }];

    const a = mergeStates(local, remote, T(9), T(8));
    const b = mergeStates(remote, local, T(8), T(9));
    expect(a).toEqual(b);
  });

  it('merging a document with itself changes nothing', () => {
    const s = base();
    s.ledger = [entry('a', T(1)), entry('b', T(2))];
    s.lifebook.visions = [{ area: 'work', statement: 'w', markers: [], importance: 3, ts: T(1) }];
    expect(mergeStates(s, s, T(9), T(9))).toEqual(s);
  });

  it('merging against an empty document returns what you had', () => {
    const s = base();
    s.ledger = [entry('a', T(1))];
    s.quests = [{
      id: 'q', wish: 'w', outcome: '', obstacle: 'o', beliefHypothesis: '', steps: [],
      fearRating: 1, forecastP: 1, fearedOutcomeText: 'f', status: 'active', createdTs: T(1),
    }];
    expect(mergeStates(s, base(), T(9), T(1))).toEqual(s);
  });
});

describe('derived numbers are left alone for the caller to recompute', () => {
  it('does not try to add two XP totals together', () => {
    const local = base();
    local.profile.xp = 200;
    local.profile.badges = ['first_vision'];
    const remote = base();
    remote.profile.xp = 130;
    remote.profile.badges = ['named_it'];

    const merged = mergeStates(local, remote, T(9), T(1));
    // Whatever it carries is a placeholder; the store recomputes from the
    // merged evidence immediately afterwards. What matters is that it is not
    // 330, which would be nonsense.
    expect(merged.profile.xp).toBeLessThanOrEqual(200);
  });
});
