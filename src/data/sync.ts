/**
 * Background sync between this device's copy and the account's copy.
 *
 * The rules, in order of importance:
 *
 *   1. The local copy is what the app reads and writes. Sync never blocks a
 *      keystroke and never blocks a screen.
 *   2. A push that loses a race is merged, not discarded. The server hands back
 *      what it has, mergeStates() combines the two, and the result is pushed
 *      again — up to a small retry limit, after which the local copy is kept
 *      and the failure is surfaced rather than swallowed.
 *   3. Offline is a normal state, not an error. Pushes queue; nothing is lost.
 *
 * The engine takes its RemoteStore as an argument so the whole thing can be
 * exercised against an in-memory server in the tests.
 */
import { mergeStates } from '../engine/merge';
import type { RemoteStore, RemoteSnapshot } from './remote';
import type { AppState } from '../types';
import type { SyncMark } from './db';

export type SyncStatus = 'off' | 'idle' | 'syncing' | 'offline' | 'error';

export interface SyncOutcome {
  status: SyncStatus;
  /** The document the caller should now treat as current. */
  state: AppState;
  mark: SyncMark | null;
  /** True when the merge changed the local copy and it needs saving. */
  changed: boolean;
  error?: string;
}

const MAX_ATTEMPTS = 4;

/**
 * First sync after signing in.
 *
 * Both sides may have real work in them — the account from another device, and
 * this browser from before the user signed in — so this is a merge, never a
 * download that overwrites. Someone who used the app locally for a week and
 * then created an account keeps that week.
 */
export async function pullAndMerge(
  local: AppState,
  localUpdatedAt: string,
  remote: RemoteStore,
): Promise<SyncOutcome> {
  let theirs: RemoteSnapshot | null;
  try {
    theirs = await remote.load();
  } catch (err) {
    return { status: 'offline', state: local, mark: null, changed: false, error: message(err) };
  }

  if (!theirs) {
    // Nothing on the server yet: this device's copy becomes the account's.
    return push(local, null, remote, localUpdatedAt);
  }

  const merged = mergeStates(local, theirs.state, localUpdatedAt, theirs.updatedAt);
  const changed = !same(merged, theirs.state);
  if (!changed) {
    return {
      status: 'idle',
      state: merged,
      mark: { revision: theirs.revision, updatedAt: theirs.updatedAt },
      changed: !same(merged, local),
    };
  }
  const out = await push(merged, theirs.revision, remote, localUpdatedAt);
  return { ...out, changed: true };
}

/**
 * Push the local copy, merging and retrying if another device got there first.
 */
export async function push(
  local: AppState,
  expectedRevision: number | null,
  remote: RemoteStore,
  localUpdatedAt: string,
): Promise<SyncOutcome> {
  let state = local;
  let revision = expectedRevision;
  let changed = false;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    let outcome;
    try {
      outcome = await remote.save(state, revision);
    } catch (err) {
      return { status: 'offline', state, mark: null, changed, error: message(err) };
    }

    if (outcome.ok) {
      return {
        status: 'idle',
        state,
        mark: { revision: outcome.revision, updatedAt: outcome.updatedAt },
        changed,
      };
    }

    if (!outcome.conflict) {
      return { status: 'error', state, mark: null, changed, error: outcome.reason };
    }

    // Somebody else wrote. Combine and try again with their revision.
    state = mergeStates(state, outcome.theirs.state, localUpdatedAt, outcome.theirs.updatedAt);
    revision = outcome.theirs.revision;
    changed = true;
  }

  return {
    status: 'error',
    state,
    mark: null,
    changed,
    error: 'Another device kept writing while this one was trying to save. '
      + 'Your work is safe on this device and will go up on the next attempt.',
  };
}

const message = (err: unknown): string => (err instanceof Error ? err.message : String(err));

/** Cheap structural comparison — these documents are plain JSON by construction. */
function same(a: AppState, b: AppState): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
