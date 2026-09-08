/**
 * The results record, read back.
 *
 * `Lifebook.placements` is every placing of every area, in the order made and
 * never edited. `currents` is the latest of each, which is what the standing
 * view needs; this is what lets the standing view also say where an area has
 * *gone* — which is the first thing a person asks once they have been here a
 * while, and the thing a snapshot can never answer.
 *
 * Ordering is by timestamp rather than array position on purpose: a placing
 * synced in from another device can land out of order, and the record must
 * not care.
 */
import type { LifeArea, Placement } from '../types';

/** Every placing of one area, oldest first. */
export function areaSeries(placements: Placement[], area: LifeArea): Placement[] {
  return placements
    .filter((p) => p.area === area)
    .sort((a, b) => (a.ts < b.ts ? -1 : a.ts > b.ts ? 1 : 0));
}

export interface AreaTrend {
  first: number | null;
  latest: number | null;
  /** latest − first. Null with fewer than two points: one point is not a direction. */
  delta: number | null;
  n: number;
  firstTs: string | null;
  latestTs: string | null;
}

export function areaTrend(placements: Placement[], area: LifeArea): AreaTrend {
  const s = areaSeries(placements, area);
  const first = s[0] ?? null;
  const latest = s[s.length - 1] ?? null;
  return {
    first: first?.score ?? null,
    latest: latest?.score ?? null,
    delta: s.length >= 2 && first && latest ? latest.score - first.score : null,
    n: s.length,
    firstTs: first?.ts ?? null,
    latestTs: latest?.ts ?? null,
  };
}

export interface RecordRow extends AreaTrend {
  area: LifeArea;
  delta: number;
}

/**
 * The areas that have moved, most moved first.
 *
 * Only areas with a direction appear. Ties break on the area id so the order is
 * stable across renders.
 */
export function recordSummary(placements: Placement[]): RecordRow[] {
  const areas = [...new Set(placements.map((p) => p.area))];
  return areas
    .map((area) => ({ area, ...areaTrend(placements, area) }))
    .filter((r): r is RecordRow => r.delta !== null)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta) || (a.area < b.area ? -1 : 1));
}
