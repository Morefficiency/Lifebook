/**
 * Stage 1 + 2 arithmetic — the distance between the life he wants and the life
 * he has, weighted by how much he cares about each part of it.
 *
 * Pure. No component does this arithmetic itself.
 */
import type { AreaCurrent, AreaVision, LifeArea } from '../types';

/** How far an area is from the vision, 0 (already there) … 1 (all of it left). */
export function areaGap(current: number): number {
  const clamped = Math.min(10, Math.max(1, current));
  return (10 - clamped) / 9;
}

/**
 * How much that distance actually matters: importance × gap, 0…5.
 *
 * This is deliberately not the raw gap. Being a long way from something you
 * rated a 1 for importance is not a problem to solve, and treating it as one
 * is how people end up working on the wrong part of their life.
 */
export function areaTension(importance: number, current: number): number {
  return importance * areaGap(current);
}

export interface AreaTension {
  area: LifeArea;
  importance: number;
  current: number;
  gap: number;
  tension: number;
}

/** Only areas with both a vision and a current rating; the rest are unknown, not zero. */
export function areaTensions(visions: AreaVision[], currents: AreaCurrent[]): AreaTension[] {
  const byArea = new Map(currents.map((c) => [c.area, c]));
  return visions.flatMap((v) => {
    const c = byArea.get(v.area);
    if (!c) return [];
    return [{
      area: v.area,
      importance: v.importance,
      current: c.score,
      gap: areaGap(c.score),
      tension: areaTension(v.importance, c.score),
    }];
  });
}

export function tensionMap(visions: AreaVision[], currents: AreaCurrent[]): Map<LifeArea, number> {
  return new Map(areaTensions(visions, currents).map((t) => [t.area, t.tension]));
}

/** Highest tension first — the order in which the work is worth doing. */
export function rankedTensions(visions: AreaVision[], currents: AreaCurrent[]): AreaTension[] {
  return areaTensions(visions, currents)
    .sort((a, b) => b.tension - a.tension || b.importance - a.importance);
}

/**
 * Σ(importance × gap) / Σ(importance), as a percentage.
 *
 * Null when nothing has been rated on both sides — an unmeasured life is not a
 * life with no gap, and showing 0% would say the opposite.
 */
export function lifeGapPercent(visions: AreaVision[], currents: AreaCurrent[]): number | null {
  const ts = areaTensions(visions, currents);
  if (ts.length === 0) return null;
  const weight = ts.reduce((a, t) => a + t.importance, 0);
  if (weight === 0) return null;
  const total = ts.reduce((a, t) => a + t.tension, 0);
  return Math.round((total / weight) * 100);
}
