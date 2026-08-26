/**
 * The sync engine, against an in-memory server.
 *
 * What has to be true, and is tested below:
 *   - signing in never overwrites either side; both are merged
 *   - a push that loses a race is merged and retried, not dropped
 *   - being offline is a normal state that loses nothing
 *   - a server error surfaces instead of being swallowed
 */
import { describe, expect, it } from 'vitest';
import { pullAndMerge, push } from '../../data/sync';
import type { RemoteSnapshot, RemoteStore, SaveOutcome } from '../../data/remote';
import { emptyLifebook, type AppState } from '../../types';

const T = (n: number) => `2026-04-0${n}T09:00:00.000Z`;

function state(ledgerIds: string[], visionStatement?: string): AppState {
  return {
    version: 1,
    lifebook: {
      ...emptyLifebook(),
      ...(visionStatement
        ? { visions: [{ area: 'work' as const, statement: visionStatement, markers: [], importance: 3 as const, ts: T(1) }] }
        : {}),
    },
    profile: { xp: 0, badges: [], consent: null, initialConflictLoad: null, mirrorCompletedTs: null },
    values: null,
    strivings: [], pairRatings: [], forks: [], quests: [], reports: [],
    ledger: ledgerIds.map((id) => ({ id, ts: T(1), kind: 'step_done' as const, payload: {} })),
  };
}

/** An in-memory stand-in for the account's row, with the same compare-and-set rule. */
function fakeServer(initial?: RemoteSnapshot) {
  let row: RemoteSnapshot | null = initial ?? null;
  let failNext: string | null = null;
  let offline = false;
  /** Simulates another device writing in between a read and a write. */
  let interleave: (() => void) | null = null;
  let saves = 0;

  const store: RemoteStore = {
    async load() {
      if (offline) throw new Error('network');
      return row;
    },
    async save(next, expected): Promise<SaveOutcome> {
      if (offline) throw new Error('network');
      if (failNext) { const r = failNext; failNext = null; return { ok: false, conflict: false, reason: r }; }
      saves += 1;
      if (interleave) { const fn = interleave; interleave = null; fn(); }

      if (row && row.revision !== expected) {
        return { ok: false, conflict: true, theirs: row };
      }
      const revision = (row?.revision ?? 0) + 1;
      row = { state: next, revision, updatedAt: T(revision) };
      return { ok: true, revision, updatedAt: row.updatedAt };
    },
    async deleteAccount() { row = null; },
  };

  return {
    store,
    get row() { return row; },
    get saves() { return saves; },
    goOffline() { offline = true; },
    comeBack() { offline = false; },
    failOnce(reason: string) { failNext = reason; },
    whenSaving(fn: () => void) { interleave = fn; },
    writeDirectly(next: AppState) {
      const revision = (row?.revision ?? 0) + 1;
      row = { state: next, revision, updatedAt: T(revision) };
    },
  };
}

describe('first sync after signing in', () => {
  it('uploads this device when the account has nothing yet', async () => {
    const server = fakeServer();
    const out = await pullAndMerge(state(['a']), T(2), server.store);

    expect(out.status).toBe('idle');
    expect(server.row?.state.ledger.map((e) => e.id)).toEqual(['a']);
    expect(out.mark?.revision).toBe(1);
  });

  it('merges local work into an account that already has some — neither is lost', async () => {
    const server = fakeServer();
    server.writeDirectly(state(['from-laptop']));

    // This browser was used before signing in, and has its own work in it.
    const out = await pullAndMerge(state(['from-this-browser']), T(5), server.store);

    expect(out.state.ledger.map((e) => e.id).sort())
      .toEqual(['from-laptop', 'from-this-browser']);
    expect(server.row?.state.ledger).toHaveLength(2);
    expect(out.changed).toBe(true);
  });

  it('does not write when the two sides already agree', async () => {
    const shared = state(['a']);
    const server = fakeServer();
    server.writeDirectly(shared);

    const before = server.saves;
    const out = await pullAndMerge(shared, T(1), server.store);

    expect(server.saves).toBe(before);
    expect(out.status).toBe('idle');
    expect(out.mark?.revision).toBe(1);
  });

  it('keeps working offline and says so, rather than failing the sign-in', async () => {
    const server = fakeServer();
    server.goOffline();
    const local = state(['a']);

    const out = await pullAndMerge(local, T(1), server.store);
    expect(out.status).toBe('offline');
    expect(out.state).toEqual(local);
    expect(out.mark).toBeNull();
  });
});

describe('a push that loses a race', () => {
  it('merges the other device in and retries, keeping both sides', async () => {
    const server = fakeServer();
    server.writeDirectly(state(['shared']));

    // Between our read and our write, the other device adds an entry.
    server.whenSaving(() => server.writeDirectly(state(['shared', 'from-phone'])));

    const out = await push(state(['shared', 'from-laptop']), 1, server.store, T(5));

    expect(out.status).toBe('idle');
    expect(out.changed).toBe(true);
    expect(server.row?.state.ledger.map((e) => e.id).sort())
      .toEqual(['from-laptop', 'from-phone', 'shared']);
  });

  it('gives up after repeated races but keeps the merged copy for the caller', async () => {
    const server = fakeServer();
    server.writeDirectly(state(['shared']));

    // A device that never stops writing: every attempt collides.
    const busy: RemoteStore = {
      load: server.store.load,
      async save() {
        return {
          ok: false,
          conflict: true,
          theirs: { state: state(['shared', 'theirs']), revision: 99, updatedAt: T(9) },
        };
      },
      deleteAccount: server.store.deleteAccount,
    };

    const out = await push(state(['shared', 'mine']), 1, busy, T(5));
    expect(out.status).toBe('error');
    expect(out.error).toMatch(/safe on this device/);
    // Nothing was thrown away in the process.
    expect(out.state.ledger.map((e) => e.id).sort()).toEqual(['mine', 'shared', 'theirs']);
  });
});

describe('failures are surfaced, never swallowed', () => {
  it('reports a server error and keeps the local copy intact', async () => {
    const server = fakeServer();
    server.failOnce('permission denied');
    const local = state(['a']);

    const out = await push(local, null, server.store, T(1));
    expect(out.status).toBe('error');
    expect(out.error).toBe('permission denied');
    expect(out.state).toEqual(local);
  });

  it('reports going offline mid-push without losing the document', async () => {
    const server = fakeServer();
    server.goOffline();
    const local = state(['a']);

    const out = await push(local, null, server.store, T(1));
    expect(out.status).toBe('offline');
    expect(out.state).toEqual(local);
  });

  it('a queued push lands once the connection is back', async () => {
    const server = fakeServer();
    server.goOffline();
    const local = state(['a']);
    expect((await push(local, null, server.store, T(1))).status).toBe('offline');
    expect(server.row).toBeNull();

    server.comeBack();
    const out = await push(local, null, server.store, T(1));
    expect(out.status).toBe('idle');
    expect(server.row?.state.ledger.map((e) => e.id)).toEqual(['a']);
  });
});

describe('what the account ends up holding', () => {
  it('keeps the later edit of a vision when two devices wrote different words', async () => {
    const server = fakeServer();
    server.writeDirectly({
      ...state([], 'written on the laptop'),
      lifebook: {
        ...emptyLifebook(),
        visions: [{ area: 'work', statement: 'written on the laptop', markers: [], importance: 3, ts: T(2) }],
      },
    });

    const mine = {
      ...state([]),
      lifebook: {
        ...emptyLifebook(),
        visions: [{ area: 'work' as const, statement: 'written on the phone', markers: [], importance: 3 as const, ts: T(6) }],
      },
    };

    const out = await pullAndMerge(mine, T(6), server.store);
    expect(out.state.lifebook.visions[0]!.statement).toBe('written on the phone');
    expect(server.row?.state.lifebook.visions[0]!.statement).toBe('written on the phone');
  });
});
