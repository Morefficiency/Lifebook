/**
 * §8 — the goal network.
 *
 * Every number here is a restatement of the user's own pair ratings. Nothing is
 * inferred, estimated, or smoothed. All functions are pure; the UI never does
 * arithmetic of its own.
 *
 * NOTE ON LAYOUT: this module computes no coordinates. Where a node ends up on
 * screen is decided by the force simulation in the map component and carries no
 * meaning whatsoever — only edge colour, edge thickness, edge glow and node size
 * encode data.
 */
import type { EdgeRef, ForkDecision, PairRating, Striving } from '../types';

const EPS = 1e-9;

export function canonicalEdge(aId: string, bId: string): EdgeRef {
  return aId <= bId ? { aId, bId } : { aId: bId, bId: aId };
}

export function edgeKey(aId: string, bId: string): string {
  const e = canonicalEdge(aId, bId);
  return `${e.aId}|${e.bId}`;
}

export function sameEdge(a: EdgeRef, b: EdgeRef): boolean {
  return edgeKey(a.aId, a.bId) === edgeKey(b.aId, b.bId);
}

/** c_ij = |effect_ij| × (1 + heat_ij / 10), and 0 for any non-negative edge. */
export function edgeConflictLoad(r: PairRating): number {
  if (r.effect >= 0) return 0;
  const heat = r.heat ?? 0;
  return Math.abs(r.effect) * (1 + heat / 10);
}

/** One heat step cooler — the map's visible response to a broken prediction (§7.5). */
export function coolEdgeHeat(r: PairRating): PairRating {
  if (r.effect >= 0) return r;
  const next = Math.max(0, (r.heat ?? 0) - 1) as NonNullable<PairRating['heat']>;
  return { ...r, heat: next };
}

export interface EdgeMetric {
  aId: string;
  bId: string;
  effect: number;
  heat: number;
  /** c_ij for conflict edges; 0 for facilitation edges. */
  load: number;
  kind: 'conflict' | 'facilitation';
  /** Consciously held (§6 Carry): still drawn, but out of the Coherence load. */
  carried: boolean;
}

export interface NodeMetric {
  id: string;
  /** C_i = Σ c_ij over negative incident edges. */
  conflictCentrality: number;
  /** F_i = Σ effect_ij over positive incident edges. */
  facilitationStrength: number;
  /** Σ heat over negative incident edges — the load-bearing tie-break. */
  heatSum: number;
  conflictDegree: number;
}

export interface FacilitationCluster { ids: string[]; weight: number }

export interface GraphMetrics {
  nodes: NodeMetric[];
  edges: EdgeMetric[];
  /** Σ c_ij over all drawn conflict edges, carried ones included. */
  totalConflictLoad: number;
  /** Σ c_ij excluding carried edges — the numerator of Coherence (§8). */
  activeConflictLoad: number;
  /** Σ effect over drawn facilitation edges. */
  totalFacilitation: number;
  /** G in 0…1, or null when there is nothing to divide. */
  conflictIndex: number | null;
  conflictIndexPercent: number | null;
  loadBearing: NodeMetric | null;
  hottestEdge: EdgeMetric | null;
  faultLineCount: number;
  helpLinkCount: number;
  /** Connected components of the facilitation sub-graph, largest first. */
  clusters: FacilitationCluster[];
}

/** The most recent fork decision per edge decides whether it is currently carried. */
function carriedEdgeKeys(forks: ForkDecision[]): Set<string> {
  const latest = new Map<string, ForkDecision>();
  for (const f of forks) {
    const k = edgeKey(f.edge.aId, f.edge.bId);
    const prev = latest.get(k);
    if (!prev || f.ts >= prev.ts) latest.set(k, f);
  }
  const carried = new Set<string>();
  for (const [k, f] of latest) if (f.choice === 'carry') carried.add(k);
  return carried;
}

export function computeGraph(
  strivings: Striving[],
  pairRatings: PairRating[],
  forks: ForkDecision[],
): GraphMetrics {
  const active = strivings.filter((s) => s.status === 'active');
  const live = new Set(active.map((s) => s.id));
  const carried = carriedEdgeKeys(forks);

  const edges: EdgeMetric[] = [];
  for (const r of pairRatings) {
    if (!live.has(r.aId) || !live.has(r.bId)) continue; // a released striving takes its edges with it
    if (r.effect === 0) continue; // 0-edges are not drawn
    const e = canonicalEdge(r.aId, r.bId);
    edges.push({
      aId: e.aId,
      bId: e.bId,
      effect: r.effect,
      heat: r.effect < 0 ? r.heat ?? 0 : 0,
      load: edgeConflictLoad(r),
      kind: r.effect < 0 ? 'conflict' : 'facilitation',
      carried: r.effect < 0 && carried.has(edgeKey(r.aId, r.bId)),
    });
  }

  const nodes: NodeMetric[] = active.map((s) => ({
    id: s.id, conflictCentrality: 0, facilitationStrength: 0, heatSum: 0, conflictDegree: 0,
  }));
  const byId = new Map(nodes.map((n) => [n.id, n]));

  let totalConflictLoad = 0;
  let activeConflictLoad = 0;
  let totalFacilitation = 0;

  for (const e of edges) {
    const a = byId.get(e.aId);
    const b = byId.get(e.bId);
    if (!a || !b) continue;
    if (e.kind === 'conflict') {
      totalConflictLoad += e.load;
      if (!e.carried) activeConflictLoad += e.load;
      for (const n of [a, b]) {
        n.conflictCentrality += e.load;
        n.heatSum += e.heat;
        n.conflictDegree += 1;
      }
    } else {
      totalFacilitation += e.effect;
      a.facilitationStrength += e.effect;
      b.facilitationStrength += e.effect;
    }
  }

  const denominator = totalConflictLoad + totalFacilitation;
  const conflictIndex = denominator > 0 ? totalConflictLoad / denominator : null;

  // argmax C_i, ties resolved by the higher summed heat, then by input order.
  let loadBearing: NodeMetric | null = null;
  for (const n of nodes) {
    if (n.conflictCentrality <= 0) continue;
    if (!loadBearing) { loadBearing = n; continue; }
    const d = n.conflictCentrality - loadBearing.conflictCentrality;
    if (d > EPS) loadBearing = n;
    else if (Math.abs(d) <= EPS && n.heatSum > loadBearing.heatSum) loadBearing = n;
  }

  let hottestEdge: EdgeMetric | null = null;
  for (const e of edges) {
    if (e.kind !== 'conflict') continue;
    if (!hottestEdge) { hottestEdge = e; continue; }
    if (e.heat > hottestEdge.heat) hottestEdge = e;
    else if (e.heat === hottestEdge.heat && e.load > hottestEdge.load + EPS) hottestEdge = e;
  }

  return {
    nodes,
    edges,
    totalConflictLoad,
    activeConflictLoad,
    totalFacilitation,
    conflictIndex,
    conflictIndexPercent: conflictIndex === null ? null : Math.round(conflictIndex * 100),
    loadBearing,
    hottestEdge,
    faultLineCount: edges.filter((e) => e.kind === 'conflict').length,
    helpLinkCount: edges.filter((e) => e.kind === 'facilitation').length,
    clusters: facilitationClusters(nodes, edges),
  };
}

/** Connected components over facilitation edges; singletons included, largest first. */
function facilitationClusters(nodes: NodeMetric[], edges: EdgeMetric[]): FacilitationCluster[] {
  const parent = new Map<string, string>(nodes.map((n) => [n.id, n.id]));
  const find = (x: string): string => {
    let root = x;
    while (parent.get(root) !== root) root = parent.get(root)!;
    let cur = x;
    while (parent.get(cur) !== cur) { const next = parent.get(cur)!; parent.set(cur, root); cur = next; }
    return root;
  };
  const union = (a: string, b: string) => { const ra = find(a); const rb = find(b); if (ra !== rb) parent.set(ra, rb); };

  const weights = new Map<string, number>();
  for (const e of edges) {
    if (e.kind !== 'facilitation') continue;
    union(e.aId, e.bId);
  }
  const groups = new Map<string, string[]>();
  for (const n of nodes) {
    const root = find(n.id);
    const g = groups.get(root);
    if (g) g.push(n.id); else groups.set(root, [n.id]);
  }
  for (const e of edges) {
    if (e.kind !== 'facilitation') continue;
    const root = find(e.aId);
    weights.set(root, (weights.get(root) ?? 0) + e.effect);
  }
  return [...groups.entries()]
    .map(([root, ids]) => ({ ids, weight: weights.get(root) ?? 0 }))
    .sort((a, b) => b.ids.length - a.ids.length || b.weight - a.weight || (a.ids[0]! < b.ids[0]! ? -1 : 1));
}
