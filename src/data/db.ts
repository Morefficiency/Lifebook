/**
 * §3 — persistence. IndexedDB via Dexie, one row holding the whole app state.
 *
 * The state document is small (a few hundred KB at the very top end) and is
 * always read and written whole, so a single key/value row is simpler and
 * safer than a table per entity — an import or a delete is then atomic.
 *
 * localStorage is used for exactly one thing, the access-gate flag (§12).
 */
import Dexie, { type Table } from 'dexie';
import { SCHEMA_VERSION, type AppState } from '../types';

interface KV { key: string; value: unknown }

class CoherenceDb extends Dexie {
  kv!: Table<KV, string>;

  constructor() {
    super('coherence');
    this.version(1).stores({ kv: 'key' });
  }
}

export const db = new CoherenceDb();

const STATE_KEY = 'state';

export function emptyState(): AppState {
  return {
    version: SCHEMA_VERSION,
    profile: {
      xp: 0,
      badges: [],
      consent: null,
      initialConflictLoad: null,
      mirrorCompletedTs: null,
    },
    values: null,
    strivings: [],
    pairRatings: [],
    forks: [],
    quests: [],
    reports: [],
    ledger: [],
  };
}

export async function loadState(): Promise<AppState | null> {
  const row = await db.kv.get(STATE_KEY);
  if (!row) return null;
  const parsed = validateState(row.value);
  return parsed.ok ? parsed.state : null;
}

export async function saveState(state: AppState): Promise<void> {
  await db.kv.put({ key: STATE_KEY, value: state });
}

/**
 * Autosave writes go through one chain, never in parallel.
 *
 * Mutations can arrive faster than IndexedDB completes a write — holding a key
 * down through the pairwise duels is the obvious case. Firing one independent
 * put per mutation lets an older document land after a newer one and silently
 * lose answers. Here at most one write is ever in flight; anything that arrives
 * meanwhile replaces the pending document, so the last write always carries the
 * newest state and the intermediate ones are simply skipped.
 */
let pendingState: AppState | null = null;
let writing = false;
let flushWaiters: (() => void)[] = [];

async function drain(): Promise<void> {
  if (writing || pendingState === null) return;
  writing = true;
  try {
    while (pendingState !== null) {
      const next = pendingState;
      pendingState = null;
      await saveState(next);
    }
  } finally {
    writing = false;
    const waiters = flushWaiters;
    flushWaiters = [];
    for (const w of waiters) w();
  }
}

export function scheduleSave(state: AppState): Promise<void> {
  pendingState = state;
  return drain();
}

/** Resolves once every scheduled write has completed. */
export function whenSaved(): Promise<void> {
  if (!writing && pendingState === null) return Promise.resolve();
  return new Promise((resolve) => { flushWaiters.push(resolve); });
}

/**
 * §11 — delete everything.
 *
 * Any pending autosave is dropped first, then the database itself is removed
 * and re-created empty. Without dropping the pending write, a save queued a
 * moment before the delete would land afterwards and resurrect the data.
 */
export async function wipeEverything(): Promise<void> {
  pendingState = null;
  await whenSaved();

  // Clear first: this always succeeds and is what actually removes the data.
  // Dropping the database afterwards is housekeeping, and it can block
  // indefinitely if another tab still holds a connection — so it is raced
  // against a short timeout rather than allowed to hang the button.
  await db.kv.clear();
  try {
    db.close();
    await Promise.race([
      db.delete(),
      new Promise((_, reject) => { setTimeout(() => reject(new Error('blocked')), 1500); }),
    ]);
  } catch {
    /* Another connection is holding the database open. The data is already gone. */
  }
  if (!db.isOpen()) await db.open();
  await db.kv.clear();
}

export type ValidationResult =
  | { ok: true; state: AppState }
  | { ok: false; reason: string };

const isArray = (v: unknown): v is unknown[] => Array.isArray(v);
const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/**
 * Structural check on anything claiming to be a Coherence state document.
 * Deliberately strict about shape and lenient about extra keys, so a file
 * written by a later version fails loudly rather than half-loading.
 */
export function validateState(input: unknown): ValidationResult {
  if (!isObj(input)) return { ok: false, reason: 'not an object' };
  if (input['version'] !== SCHEMA_VERSION) {
    return { ok: false, reason: `unsupported schema version: ${String(input['version'])}` };
  }
  for (const key of ['strivings', 'pairRatings', 'forks', 'quests', 'reports', 'ledger']) {
    if (!isArray(input[key])) return { ok: false, reason: `missing or malformed "${key}"` };
  }
  if (!isObj(input['profile'])) return { ok: false, reason: 'missing "profile"' };

  const base = emptyState();
  const profile = input['profile'] as Record<string, unknown>;

  const state: AppState = {
    version: SCHEMA_VERSION,
    profile: {
      xp: typeof profile['xp'] === 'number' ? profile['xp'] : 0,
      badges: isArray(profile['badges']) ? (profile['badges'] as string[]) : [],
      consent: isObj(profile['consent'])
        ? (profile['consent'] as unknown as AppState['profile']['consent'])
        : null,
      initialConflictLoad:
        typeof profile['initialConflictLoad'] === 'number' ? profile['initialConflictLoad'] : null,
      mirrorCompletedTs:
        typeof profile['mirrorCompletedTs'] === 'string' ? profile['mirrorCompletedTs'] : null,
    },
    values: isObj(input['values']) ? (input['values'] as unknown as AppState['values']) : null,
    strivings: input['strivings'] as AppState['strivings'],
    pairRatings: input['pairRatings'] as AppState['pairRatings'],
    forks: input['forks'] as AppState['forks'],
    quests: input['quests'] as AppState['quests'],
    reports: input['reports'] as AppState['reports'],
    ledger: input['ledger'] as AppState['ledger'],
  };

  return { ok: true, state: { ...base, ...state } };
}
