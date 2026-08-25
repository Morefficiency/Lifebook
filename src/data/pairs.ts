/**
 * Deterministic pair ordering for the duel flow (§A3).
 *
 * The order is a pure function of the striving list, so closing the tab and
 * coming back resumes on exactly the pair you were on: "the next pair" is
 * simply the first one in this list that has no rating yet.
 */
import type { PairRating, Striving } from '../types';
import { edgeKey } from '../engine/graph';

export interface Pair { aId: string; bId: string }

/** All unordered pairs, in row-major order over the striving list. */
export function allPairs(strivings: Striving[]): Pair[] {
  const ids = strivings.filter((s) => s.status === 'active').map((s) => s.id);
  const out: Pair[] = [];
  for (let i = 0; i < ids.length; i += 1) {
    for (let j = i + 1; j < ids.length; j += 1) {
      const a = ids[i]!;
      const b = ids[j]!;
      out.push(a <= b ? { aId: a, bId: b } : { aId: b, bId: a });
    }
  }
  return out;
}

export function ratingMap(ratings: PairRating[]): Map<string, PairRating> {
  return new Map(ratings.map((r) => [edgeKey(r.aId, r.bId), r]));
}

/** Index of the first unrated pair, or -1 when the matrix is complete. */
export function nextUnratedIndex(strivings: Striving[], ratings: PairRating[]): number {
  const rated = ratingMap(ratings);
  return allPairs(strivings).findIndex((p) => !rated.has(edgeKey(p.aId, p.bId)));
}

/** Negative pairs still missing a heat rating, in the same deterministic order. */
export function pairsNeedingHeat(strivings: Striving[], ratings: PairRating[]): Pair[] {
  const rated = ratingMap(ratings);
  return allPairs(strivings).flatMap((p) => {
    const r = rated.get(edgeKey(p.aId, p.bId));
    return r && r.effect < 0 ? [p] : [];
  });
}

export function nextPairNeedingHeat(strivings: Striving[], ratings: PairRating[]): number {
  const rated = ratingMap(ratings);
  return pairsNeedingHeat(strivings, ratings)
    .findIndex((p) => rated.get(edgeKey(p.aId, p.bId))?.heat === undefined);
}
