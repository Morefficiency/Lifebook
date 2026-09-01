/**
 * The constellation — a life as a body in space, with the self at the centre.
 *
 * The standing view lays the twelve areas out flat around a figure. This is the
 * same data with a third axis, and the third axis is allowed to mean exactly
 * one thing: how close an area is to the person. Three tiers, from the inside
 * out —
 *
 *   the person   Body · Mind · Feeling · Character · Spirit
 *   the people   Love · Family · Friends
 *   the world    Money · Work · Days · Purpose
 *
 * — which is the order LIFE_AREAS already runs in, made spatial. It is the
 * intuitive reading (what is nearest to me), the scientific one (Bronfenbrenner's
 * nested systems, microsystem outward), and the older one (body, mind and
 * spirit at the core; then the people; then the world). Angle within a tier is
 * fixed by area order and carries nothing.
 *
 * Everything else that carries meaning is listed here and nowhere else:
 *
 *   node size        how much the person said the area matters (1–5)
 *   node brightness  how close it is to what they described (1–10)
 *   wireframe        never written — a place kept, not a value of zero
 *   spoke thickness  importance, again, so the tie to the self reads at a glance
 *   spoke brightness whether a confirmed belief sits on that area
 *   violet arc       two areas share a confirmed belief — coupled through the self
 *   red / green arc  two goals in different areas fight or help (only when goals
 *                    carry areas; the short form does not assign them)
 *   satellites       identities in progress, orbiting the self
 *
 * All of it is computed here so the picture and the panel beside it can never
 * disagree. The component only draws.
 */
import type { AppState, LifeArea } from '../types';
import { LIFE_AREAS } from '../types';
import { areaRows, type AreaRow, type AreaState } from './overview';
import { canonicalEdge, edgeConflictLoad } from './graph';

/* -------------------------------------------------------------------------- *
 * Geometry. Unitless — the renderer chooses the scale.
 * -------------------------------------------------------------------------- */

export type Tier = 'person' | 'people' | 'world';

export const TIER_OF: Record<LifeArea, Tier> = {
  health: 'person', mind: 'person', emotions: 'person', character: 'person', spirit: 'person',
  partner: 'people', family: 'people', social: 'people',
  money: 'world', work: 'world', lifestyle: 'world', vision: 'world',
};

export const TIER_RADIUS: Record<Tier, number> = { person: 1, people: 1.75, world: 2.5 };
/** Each tier sits at its own height so the bands read as bands, not a disc. */
export const TIER_HEIGHT: Record<Tier, number> = { person: 0.18, people: 0, world: -0.22 };
/** Successive tiers are rotated so no two areas line up radially. */
export const TIER_PHASE: Record<Tier, number> = { person: -Math.PI / 2, people: -Math.PI / 2 + 0.4, world: -Math.PI / 2 + 0.2 };
/** Alternate nodes in a tier lift and dip a little, for depth at a glance. */
export const STAGGER = 0.16;

export interface Vec3 { x: number; y: number; z: number }

export function areasInTier(tier: Tier): LifeArea[] {
  return LIFE_AREAS.filter((a) => TIER_OF[a] === tier);
}

export function positionOf(area: LifeArea): Vec3 {
  const tier = TIER_OF[area];
  const peers = areasInTier(tier);
  const index = peers.indexOf(area);
  const angle = TIER_PHASE[tier] + (index / peers.length) * Math.PI * 2;
  const r = TIER_RADIUS[tier];
  const lift = (index % 2 === 0 ? 1 : -1) * STAGGER * (r / TIER_RADIUS.world);
  return {
    x: r * Math.cos(angle),
    y: TIER_HEIGHT[tier] + lift,
    z: r * Math.sin(angle),
  };
}

/* -------------------------------------------------------------------------- *
 * Encodings.
 * -------------------------------------------------------------------------- */

/** Node radius: 1–5 importance → 0.10…0.20; an unwritten area keeps a small slot. */
export const SIZE_MIN = 0.1;
export const SIZE_MAX = 0.2;
export const SIZE_BLANK = 0.075;
export function nodeSize(importance: number | null): number {
  if (importance === null) return SIZE_BLANK;
  const t = (Math.min(5, Math.max(1, importance)) - 1) / 4;
  return SIZE_MIN + t * (SIZE_MAX - SIZE_MIN);
}

/** Brightness: 1–10 current → 0.25…1. Written-but-unplaced is a flat 0.3, not 0. */
export const GLOW_MIN = 0.25;
export const GLOW_WRITTEN = 0.3;
export function nodeGlow(state: AreaState, current: number | null): number {
  if (state === 'blank') return 0;
  if (current === null) return GLOW_WRITTEN;
  const t = (Math.min(10, Math.max(1, current)) - 1) / 9;
  return GLOW_MIN + t * (1 - GLOW_MIN);
}

export interface AreaNode {
  area: LifeArea;
  tier: Tier;
  position: Vec3;
  state: AreaState;
  importance: number | null;
  current: number | null;
  tension: number | null;
  size: number;
  glow: number;
  /** Confirmed beliefs the person has said sit here. */
  beliefIds: string[];
  /** The area carrying the most importance × gap. */
  attention: boolean;
}

export interface Spoke {
  area: LifeArea;
  /** 1–5, from importance; 1 for an unwritten area. */
  weight: number;
  /** True when at least one confirmed belief sits on the area. */
  loaded: boolean;
}

export type ArcKind = 'coupled' | 'conflict' | 'facilitation';

export interface Arc {
  a: LifeArea;
  b: LifeArea;
  kind: ArcKind;
  /** Coupled: shared belief count. Conflict: Σ edge load. Facilitation: Σ effect. */
  weight: number;
  /** For coupled arcs, the beliefs shared. */
  beliefIds?: string[];
}

export interface Satellite {
  identityId: string;
  text: string;
  /** Angle around the core, fixed by order. */
  angle: number;
}

export interface Constellation {
  nodes: AreaNode[];
  spokes: Spoke[];
  arcs: Arc[];
  satellites: Satellite[];
  /** Confirmed beliefs, so the core panel can list them. */
  beliefIds: string[];
}

function pairKey(a: LifeArea, b: LifeArea): string {
  return [a, b].sort().join('|');
}

export function buildConstellation(state: AppState): Constellation {
  const lb = state.lifebook;
  const rows = areaRows(lb.visions, lb.currents);
  const confirmed = lb.beliefs.filter((b) => b.status === 'confirmed');

  const beliefsByArea = new Map<LifeArea, string[]>();
  for (const b of confirmed) {
    for (const a of b.areas) beliefsByArea.set(a, [...(beliefsByArea.get(a) ?? []), b.id]);
  }

  const attention = rows
    .filter((r): r is AreaRow & { tension: number } => r.tension !== null)
    .sort((x, y) => y.tension - x.tension || (y.importance ?? 0) - (x.importance ?? 0))[0]?.area ?? null;

  const nodes: AreaNode[] = rows.map((r) => ({
    area: r.area,
    tier: TIER_OF[r.area],
    position: positionOf(r.area),
    state: r.state,
    importance: r.importance,
    current: r.current,
    tension: r.tension,
    size: nodeSize(r.importance),
    glow: nodeGlow(r.state, r.current),
    beliefIds: beliefsByArea.get(r.area) ?? [],
    attention: r.area === attention,
  }));

  const spokes: Spoke[] = rows.map((r) => ({
    area: r.area,
    weight: r.importance ?? 1,
    loaded: (beliefsByArea.get(r.area) ?? []).length > 0,
  }));

  // Two areas that share a confirmed belief are coupled through the self-image:
  // change the belief and both move.
  const coupled = new Map<string, Arc>();
  for (const b of confirmed) {
    const areas = [...new Set(b.areas)].sort();
    for (let i = 0; i < areas.length; i++) {
      for (let j = i + 1; j < areas.length; j++) {
        const key = pairKey(areas[i]!, areas[j]!);
        const prev = coupled.get(key);
        coupled.set(key, {
          a: areas[i]!, b: areas[j]!, kind: 'coupled',
          weight: (prev?.weight ?? 0) + 1,
          beliefIds: [...(prev?.beliefIds ?? []), b.id],
        });
      }
    }
  }

  // Goal collisions, lifted onto the areas the goals belong to. Most goals
  // never get an area — the short form does not ask — so this is often empty,
  // and that is honest rather than a gap to be filled with guesses.
  const areaOfStriving = new Map(
    state.strivings.filter((s) => s.status === 'active' && s.area).map((s) => [s.id, s.area!]),
  );
  const goalArcs = new Map<string, Arc>();
  for (const r of state.pairRatings) {
    const { aId, bId } = canonicalEdge(r.aId, r.bId);
    const areaA = areaOfStriving.get(aId);
    const areaB = areaOfStriving.get(bId);
    if (!areaA || !areaB || areaA === areaB || r.effect === 0) continue;
    const kind: ArcKind = r.effect < 0 ? 'conflict' : 'facilitation';
    const key = `${kind}:${pairKey(areaA, areaB)}`;
    const add = r.effect < 0 ? edgeConflictLoad(r) : r.effect;
    const prev = goalArcs.get(key);
    goalArcs.set(key, {
      a: areaA < areaB ? areaA : areaB, b: areaA < areaB ? areaB : areaA,
      kind, weight: (prev?.weight ?? 0) + add,
    });
  }

  const owned = lb.identities.filter((i) => i.text.trim().length > 0);
  const satellites: Satellite[] = owned.map((i, idx) => ({
    identityId: i.id,
    text: i.text,
    angle: (idx / owned.length) * Math.PI * 2,
  }));

  return {
    nodes,
    spokes,
    arcs: [...coupled.values(), ...goalArcs.values()],
    satellites,
    beliefIds: confirmed.map((b) => b.id),
  };
}
