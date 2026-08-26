/**
 * Merging two copies of one account's state.
 *
 * Two devices, one account, both edited while offline. Neither copy can simply
 * win: the ledger claims to be a complete record, and throwing away a device's
 * half of it would make that claim false.
 *
 * So the merge works per collection, by the strongest evidence each one has:
 *
 *   append-only logs        union by id — entries are immutable, nothing to pick
 *   items with their own ts union by key, later ts wins
 *   items with no ts        union by id, newer *document* wins
 *   "when did this happen"  earliest non-null — you cannot do it for the first
 *                           time twice
 *   derived numbers         not merged; the caller recomputes them
 *
 * Pure and order-independent: merging A into B gives the same document as
 * merging B into A, which is what makes it safe to run on whichever device
 * happens to notice the conflict.
 */
import type { AppState, Lifebook } from '../types';

/** Anything the app stores that carries its own last-written timestamp. */
interface Stamped { ts: string }

const isNewer = (a: string | undefined, b: string | undefined): boolean =>
  (a ?? '') > (b ?? '');

/** Union by id; identical ids collapse. Used for immutable records only. */
function unionById<T extends { id: string }>(mine: T[], theirs: T[], sortByTs: boolean): T[] {
  const out = new Map<string, T>();
  for (const item of [...theirs, ...mine]) if (!out.has(item.id)) out.set(item.id, item);
  const list = [...out.values()];
  if (!sortByTs) return list;
  return list.sort((a, b) => {
    const at = (a as unknown as Stamped).ts ?? '';
    const bt = (b as unknown as Stamped).ts ?? '';
    return at < bt ? -1 : at > bt ? 1 : (a.id < b.id ? -1 : 1);
  });
}

/** Union by key; where both sides hold a key, the later `ts` wins. */
function unionByStamp<T extends Stamped>(
  mine: T[], theirs: T[], key: (item: T) => string,
): T[] {
  const out = new Map<string, T>();
  for (const item of theirs) out.set(key(item), item);
  for (const item of mine) {
    const k = key(item);
    const existing = out.get(k);
    if (!existing || isNewer(item.ts, existing.ts)) out.set(k, item);
  }
  return [...out.values()].sort((a, b) => (key(a) < key(b) ? -1 : 1));
}

/** Union by id; where both sides hold an id, the newer document wins. */
function unionByDocument<T extends { id: string }>(
  mine: T[], theirs: T[], mineIsNewer: boolean,
): T[] {
  const [first, second] = mineIsNewer ? [theirs, mine] : [mine, theirs];
  const out = new Map<string, T>();
  for (const item of first) out.set(item.id, item);
  for (const item of second) out.set(item.id, item);
  return [...out.values()].sort((a, b) => (a.id < b.id ? -1 : 1));
}

/** The earlier of two records of when something happened; null only if neither has one. */
function earliest<T extends Stamped>(a: T | null, b: T | null): T | null {
  if (!a) return b;
  if (!b) return a;
  return a.ts <= b.ts ? a : b;
}

function earliestTs(a: string | null, b: string | null): string | null {
  if (!a) return b;
  if (!b) return a;
  return a <= b ? a : b;
}

function mergeStages(
  mine: Lifebook['stagesCompleted'], theirs: Lifebook['stagesCompleted'],
): Lifebook['stagesCompleted'] {
  const out: Lifebook['stagesCompleted'] = { ...theirs };
  for (const [stage, ts] of Object.entries(mine)) {
    if (!ts) continue;
    const key = stage as keyof Lifebook['stagesCompleted'];
    const existing = out[key];
    if (!existing || ts < existing) out[key] = ts;
  }
  return out;
}

export interface MergeResult { state: AppState; changed: boolean }

/**
 * @param mine            this device's copy
 * @param theirs          the copy that came back from the server
 * @param mineUpdatedAt   when this device last wrote
 * @param theirsUpdatedAt when the server copy was last written
 */
export function mergeStates(
  mine: AppState,
  theirs: AppState,
  mineUpdatedAt: string,
  theirsUpdatedAt: string,
): AppState {
  const mineIsNewer = mineUpdatedAt >= theirsUpdatedAt;

  const lifebook: Lifebook = {
    // Their own timestamps are better evidence than the document's.
    visions: unionByStamp(mine.lifebook.visions, theirs.lifebook.visions, (v) => v.area),
    currents: unionByStamp(mine.lifebook.currents, theirs.lifebook.currents, (c) => c.area),
    probes: unionByStamp(mine.lifebook.probes, theirs.lifebook.probes, (p) => p.probeId),
    beliefs: unionByStamp(mine.lifebook.beliefs, theirs.lifebook.beliefs, (b) => b.id),
    identities: unionByStamp(mine.lifebook.identities, theirs.lifebook.identities, (i) => i.id),
    // Practices carry a creation ts that never changes, so they fall back to
    // the document — an edited practice is an edit, not a new record.
    practices: unionByDocument(mine.lifebook.practices, theirs.lifebook.practices, mineIsNewer),
    // Immutable evidence. Union, always.
    practiceLogs: unionById(mine.lifebook.practiceLogs, theirs.lifebook.practiceLogs, true),
    stagesCompleted: mergeStages(mine.lifebook.stagesCompleted, theirs.lifebook.stagesCompleted),
  };

  const consent = earliest(mine.profile.consent, theirs.profile.consent);
  const mirrorCompletedTs = earliestTs(
    mine.profile.mirrorCompletedTs, theirs.profile.mirrorCompletedTs,
  );
  // The baseline belongs to the mirror completion it was measured at, so it
  // travels with whichever completion won rather than being picked separately.
  const initialConflictLoad = mirrorCompletedTs === null
    ? null
    : mirrorCompletedTs === mine.profile.mirrorCompletedTs
      ? mine.profile.initialConflictLoad
      : theirs.profile.initialConflictLoad;

  const values = mine.values && theirs.values
    ? (isNewer(mine.values.ts, theirs.values.ts) ? mine.values : theirs.values)
    : (mine.values ?? theirs.values);

  return {
    version: mine.version,
    lifebook,
    profile: {
      // Placeholders: the store recomputes both from the merged evidence the
      // moment this returns. Adding two totals together would be nonsense.
      xp: Math.max(mine.profile.xp, theirs.profile.xp),
      badges: [...new Set([...mine.profile.badges, ...theirs.profile.badges])].sort(),
      consent,
      initialConflictLoad,
      mirrorCompletedTs,
    },
    values,
    strivings: unionByDocument(mine.strivings, theirs.strivings, mineIsNewer),
    pairRatings: unionByStamp(
      mine.pairRatings, theirs.pairRatings, (r) => `${r.aId}|${r.bId}`,
    ),
    forks: unionById(mine.forks, theirs.forks, true),
    quests: unionByDocument(mine.quests, theirs.quests, mineIsNewer),
    reports: unionById(mine.reports, theirs.reports, true),
    ledger: unionById(mine.ledger, theirs.ledger, true),
  };
}
