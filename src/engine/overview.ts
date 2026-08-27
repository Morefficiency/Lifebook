/**
 * The standing view — one whole life on one screen.
 *
 * Everything the overview page draws is computed here, including the geometry
 * of the dial. A component that works out its own angles is a component that
 * quietly disagrees with the numbers printed beside it, so the arithmetic and
 * the picture come from the same place. (§3, Design Law 3.)
 *
 * The governing rule for this module is that an absence is not a zero. Someone
 * who has not said where an area of their life is has not said it is at rock
 * bottom, and the dial must not draw that claim on their behalf.
 */
import type { AreaCurrent, AreaVision, LifeArea } from '../types';
import { LIFE_AREAS } from '../types';
import { areaGap, areaTension, lifeGapPercent } from './gap';

/** Degrees of clear space after every sector, so twelve arcs read as twelve. */
export const SECTOR_PAD_DEG = 1.5;
/** An area with no vision still holds a place on the dial — the narrowest one. */
export const UNWRITTEN_WEIGHT = 1;
/** Twelve o'clock. SVG angles put 0° to the right, so the top is −90°. */
export const DIAL_START_DEG = -90;

export type AreaState =
  /** A vision, an importance and a current score. */
  | 'rated'
  /** A vision and an importance, but no honest answer yet about where it is. */
  | 'written'
  /** Never touched. */
  | 'blank';

export interface AreaRow {
  area: LifeArea;
  state: AreaState;
  /** 1–5, or null when the area was never written. */
  importance: number | null;
  /** 1–10, or null when it was never rated. */
  current: number | null;
  /** 0–1, or null. */
  gap: number | null;
  /** importance × gap, or null. */
  tension: number | null;
  /** The area's share of the dial. */
  weight: number;
}

const written = (v: AreaVision | undefined): v is AreaVision =>
  !!v && v.statement.trim().length > 0;

/**
 * Every area, in the fixed order of LIFE_AREAS — never sorted by score.
 *
 * The order is what makes the dial recognisable from one month to the next: a
 * person learns the shape of their own life, and a ring that reshuffles itself
 * whenever a number moves cannot be learned.
 */
export function areaRows(visions: AreaVision[], currents: AreaCurrent[]): AreaRow[] {
  const visionBy = new Map(visions.filter(written).map((v) => [v.area, v]));
  const currentBy = new Map(currents.map((c) => [c.area, c]));

  return LIFE_AREAS.map((area) => {
    const v = visionBy.get(area);
    const c = currentBy.get(area);

    if (v && c) {
      return {
        area,
        state: 'rated' as const,
        importance: v.importance,
        current: c.score,
        gap: areaGap(c.score),
        tension: areaTension(v.importance, c.score),
        weight: v.importance,
      };
    }
    if (v) {
      return {
        area,
        state: 'written' as const,
        importance: v.importance,
        current: null,
        gap: null,
        tension: null,
        weight: v.importance,
      };
    }
    return {
      area,
      state: 'blank' as const,
      importance: null,
      current: null,
      gap: null,
      tension: null,
      weight: UNWRITTEN_WEIGHT,
    };
  });
}

/** Highest tension first; unrated areas are not in the ranking at all. */
export function rankedRows(rows: AreaRow[]): AreaRow[] {
  return rows
    .filter((r) => r.tension !== null)
    .sort((a, b) => (b.tension! - a.tension!) || (b.importance! - a.importance!));
}

export function describedCount(visions: AreaVision[]): number {
  return visions.filter(written).length;
}

export function ratedCount(visions: AreaVision[], currents: AreaCurrent[]): number {
  return areaRows(visions, currents).filter((r) => r.state === 'rated').length;
}

/**
 * How much of the described life is actually being lived, weighted by how much
 * each part of it matters — the complement of the gap.
 *
 * Null for the same reason lifeGapPercent is: with nothing rated on both sides
 * there is no answer, and 0% would be a different and false one.
 */
export function livingPercent(visions: AreaVision[], currents: AreaCurrent[]): number | null {
  const gap = lifeGapPercent(visions, currents);
  return gap === null ? null : 100 - gap;
}

export interface DialSector {
  area: LifeArea;
  state: AreaState;
  startDeg: number;
  endDeg: number;
  /** 0–1 of the track, or null when there is nothing honest to fill it to. */
  fill: number | null;
}

/**
 * Twelve arcs around a circle: angular width is how much the area matters,
 * radial fill is how close it is to what the person described.
 *
 * Two encodings, both of them the person's own answers, and nothing else on
 * the dial carries meaning.
 */
export function dialSectors(rows: AreaRow[]): DialSector[] {
  const totalWeight = rows.reduce((a, r) => a + r.weight, 0);
  const available = 360 - SECTOR_PAD_DEG * rows.length;

  let cursor = DIAL_START_DEG;
  return rows.map((r) => {
    const width = totalWeight > 0 ? (r.weight / totalWeight) * available : available / rows.length;
    const startDeg = cursor;
    const endDeg = startDeg + width;
    cursor = endDeg + SECTOR_PAD_DEG;
    return {
      area: r.area,
      state: r.state,
      startDeg,
      endDeg,
      fill: r.current === null ? null : r.current / 10,
    };
  });
}

/* -------------------------------------------------------------------------- *
 * SVG geometry. Here rather than in the component so the shapes are testable.
 * -------------------------------------------------------------------------- */

export function polarPoint(cx: number, cy: number, r: number, deg: number): { x: number; y: number } {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

/** A closed annular wedge — the shape of one arc of the dial. */
export function ringPath(
  cx: number, cy: number, rInner: number, rOuter: number, startDeg: number, endDeg: number,
): string {
  const large = endDeg - startDeg > 180 ? 1 : 0;
  const o1 = polarPoint(cx, cy, rOuter, startDeg);
  const o2 = polarPoint(cx, cy, rOuter, endDeg);
  const i2 = polarPoint(cx, cy, rInner, endDeg);
  const i1 = polarPoint(cx, cy, rInner, startDeg);
  const f = (n: number) => n.toFixed(3);
  return [
    `M ${f(o1.x)} ${f(o1.y)}`,
    `A ${f(rOuter)} ${f(rOuter)} 0 ${large} 1 ${f(o2.x)} ${f(o2.y)}`,
    `L ${f(i2.x)} ${f(i2.y)}`,
    `A ${f(rInner)} ${f(rInner)} 0 ${large} 0 ${f(i1.x)} ${f(i1.y)}`,
    'Z',
  ].join(' ');
}

/** The midpoint of a sector, where its label hangs. */
export function sectorMidDeg(s: DialSector): number {
  return (s.startDeg + s.endDeg) / 2;
}
