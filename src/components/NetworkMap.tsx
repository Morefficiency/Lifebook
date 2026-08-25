/**
 * §A5 / §15 — the map.
 *
 * WHAT ENCODES DATA
 *   edge colour     — red conflict, green facilitation, amber consciously carried
 *   edge thickness  — |effect|
 *   edge glow       — heat (only on conflict edges)
 *   node size       — conflict centrality C_i
 *
 * WHAT ENCODES NOTHING
 *   node position. The coordinates come from a force simulation seeded by node
 *   count alone. They are cosmetic. Nothing in this file, in the legend, or in
 *   the report may suggest that two strivings sitting close together means
 *   anything at all.
 *
 * The simulation is run to convergence once, synchronously, and then drawn as
 * static SVG. There is no animation frame loop and nothing moves after the
 * reveal, which is both the design intent (one orchestrated moment, then quiet)
 * and why 12 nodes / 66 edges stays smooth.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  forceCenter, forceCollide, forceLink, forceManyBody, forceSimulation, forceX, forceY,
  type SimulationLinkDatum, type SimulationNodeDatum,
} from 'd3-force';
import type { EdgeMetric, GraphMetrics } from '../engine/graph';
import { edgeKey } from '../engine/graph';

const W = 1040;
const H = 700;
const R_MIN = 13;
const R_MAX = 34;
const TICKS = 500;
const LABEL_MAX_CHARS = 28;
const LABEL_FONT = 15;
/** Rough advance width of the body face at LABEL_FONT, used for collision only. */
const LABEL_CHAR_W = 7.4;

interface SimNode extends SimulationNodeDatum { id: string; r: number; keepOut: number }
interface SimLink extends SimulationLinkDatum<SimNode> { source: string | SimNode; target: string | SimNode; strength: number }

export interface NetworkMapProps {
  graph: GraphMetrics;
  labels: Map<string, string>;
  /** Staged reveal (§A5). Off everywhere except the Mirror. */
  reveal?: boolean;
  selectedKey?: string | null;
  onSelectEdge?: (edge: EdgeMetric) => void;
  className?: string;
}

function truncate(text: string, max = LABEL_MAX_CHARS): string {
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}

export function NetworkMap({
  graph, labels, reveal = false, selectedKey = null, onSelectEdge, className = '',
}: NetworkMapProps) {
  const [revealed, setRevealed] = useState(!reveal);
  const startedRef = useRef(false);

  const layout = useMemo(() => {
    const maxC = Math.max(0, ...graph.nodes.map((n) => n.conflictCentrality));
    const nodes: SimNode[] = graph.nodes.map((n, i) => {
      // Deterministic seed ring — the simulation is stable run to run.
      const a = (i / Math.max(1, graph.nodes.length)) * Math.PI * 2;
      const r = maxC > 0 ? R_MIN + (n.conflictCentrality / maxC) * (R_MAX - R_MIN) : R_MIN;
      // Nodes must keep their labels apart, not just their circles, so the
      // collision radius covers half the rendered label as well.
      const label = truncate(labels.get(n.id) ?? n.id);
      const keepOut = Math.max(r + 30, (label.length * LABEL_CHAR_W) / 2 + 14);
      return {
        id: n.id,
        r,
        keepOut,
        x: W / 2 + Math.cos(a) * 300,
        y: H / 2 + Math.sin(a) * 240,
      };
    });

    const links: SimLink[] = graph.edges.map((e) => ({
      source: e.aId,
      target: e.bId,
      // Facilitation pulls together, conflict pushes apart — a purely visual
      // convention that keeps the picture readable. It is not a measurement.
      strength: e.kind === 'facilitation' ? 0.9 : 0.16,
    }));

    const sim = forceSimulation(nodes)
      .force('link', forceLink<SimNode, SimLink>(links).id((d) => d.id)
        .distance((l) => (l.strength > 0.5 ? 175 : 320))
        .strength((l) => l.strength))
      .force('charge', forceManyBody().strength(-1400).distanceMax(700))
      .force('collide', forceCollide<SimNode>().radius((d) => d.keepOut).strength(0.95).iterations(3))
      .force('center', forceCenter(W / 2, H / 2))
      .force('x', forceX(W / 2).strength(0.03))
      .force('y', forceY(H / 2).strength(0.05))
      .stop();

    sim.tick(TICKS);

    const padX = 108;
    const padTop = R_MAX + 16;
    const padBottom = R_MAX + 34; // room for the label under the largest node
    const pos = new Map(nodes.map((n) => [n.id, {
      x: Math.min(W - padX, Math.max(padX, n.x ?? W / 2)),
      y: Math.min(H - padBottom, Math.max(padTop, n.y ?? H / 2)),
      r: n.r,
    }]));
    return pos;
  }, [graph.nodes, graph.edges, labels]);

  /** Fault lines draw last, hottest last of all (§A5). */
  const ordered = useMemo(() => {
    const facil = graph.edges.filter((e) => e.kind === 'facilitation');
    const faults = graph.edges.filter((e) => e.kind === 'conflict')
      .slice()
      .sort((a, b) => a.heat - b.heat || a.load - b.load);
    return { facil, faults };
  }, [graph.edges]);

  useEffect(() => {
    if (!reveal || startedRef.current) return undefined;
    startedRef.current = true;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) { setRevealed(true); return undefined; }
    const t = window.setTimeout(() => setRevealed(true), 30);
    return () => window.clearTimeout(t);
  }, [reveal]);

  const nodeDelay = (i: number) => (reveal ? 40 + i * 55 : 0);
  const facilDelay = (i: number) => (reveal ? 700 + i * 45 : 0);
  const faultDelay = (i: number) => (reveal ? 1500 + i * 220 : 0);

  const summary = `Network of ${graph.nodes.length} strivings, ${graph.faultLineCount} fault lines and ${graph.helpLinkCount} help links. Positions are decorative.`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={`w-full h-auto touch-manipulation ${className}`}
      role="img"
      aria-label={summary}
      style={{ opacity: revealed ? 1 : 0 }}
    >
      <defs>
        <filter id="edge-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="5" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* facilitation web */}
      <g>
        {ordered.facil.map((e, i) => (
          <Edge
            key={`f-${edgeKey(e.aId, e.bId)}`}
            e={e} layout={layout} delay={facilDelay(i)} reveal={reveal}
            selected={selectedKey === edgeKey(e.aId, e.bId)}
            {...(onSelectEdge ? { onSelect: onSelectEdge } : {})}
          />
        ))}
      </g>

      {/* fault lines, hottest last */}
      <g>
        {ordered.faults.map((e, i) => (
          <Edge
            key={`c-${edgeKey(e.aId, e.bId)}`}
            e={e} layout={layout} delay={faultDelay(i)} reveal={reveal}
            selected={selectedKey === edgeKey(e.aId, e.bId)}
            {...(onSelectEdge ? { onSelect: onSelectEdge } : {})}
          />
        ))}
      </g>

      {/* nodes */}
      <g>
        {graph.nodes.map((n, i) => {
          const p = layout.get(n.id);
          if (!p) return null;
          const full = labels.get(n.id) ?? n.id;
          return (
            <g
              key={n.id}
              style={reveal ? { animation: `fade-up 420ms ${nodeDelay(i)}ms cubic-bezier(0.22,1,0.36,1) both` } : undefined}
            >
              <title>{`I typically try to ${full}`}</title>
              <circle cx={p.x} cy={p.y} r={p.r} fill="#151C28" stroke="#7BA3C4" strokeWidth={1.4} />
              <circle cx={p.x} cy={p.y} r={Math.max(3, p.r * 0.28)} fill="#7BA3C4" opacity={0.75} />
              <text
                x={p.x}
                y={p.y + p.r + 19}
                textAnchor="middle"
                className="font-sans"
                fontSize={LABEL_FONT}
                fill="#E8E3D8"
                paintOrder="stroke"
                stroke="#0B0E14"
                strokeWidth={4}
                strokeLinejoin="round"
              >
                {truncate(full)}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}

function Edge({ e, layout, delay, reveal, selected, onSelect }: {
  e: EdgeMetric;
  layout: Map<string, { x: number; y: number; r: number }>;
  delay: number;
  reveal: boolean;
  selected: boolean;
  onSelect?: (edge: EdgeMetric) => void;
}) {
  const a = layout.get(e.aId);
  const b = layout.get(e.bId);
  if (!a || !b) return null;

  const colour = e.kind === 'facilitation' ? '#3E7C59' : e.carried ? '#C9A227' : '#C43E3E';
  const bright = e.kind === 'facilitation' ? '#63AE83' : e.carried ? '#E0BE4A' : '#E36B6B';
  const width = Math.abs(e.effect) === 2 ? 3.6 : 1.9;

  // Glow rides on heat only. A carried edge is held, not hot, so it never glows.
  // The curve is deliberately superlinear: with a dozen fault lines on screen a
  // linear ramp makes heat 6 and heat 10 look alike, and the whole point of the
  // reveal is that the hottest one is obvious at a glance.
  const glow = e.kind === 'conflict' && !e.carried ? (e.heat / 10) ** 2 : 0;

  const len = Math.hypot(b.x - a.x, b.y - a.y);
  const drawn = reveal
    ? { strokeDasharray: len, strokeDashoffset: len, animation: `draw 520ms ${delay}ms cubic-bezier(0.22,1,0.36,1) forwards` }
    : undefined;

  const interactive = !!onSelect;

  return (
    <g
      style={drawn}
      className={interactive ? 'cursor-pointer' : undefined}
      onClick={onSelect ? () => onSelect(e) : undefined}
    >
      <title>{e.kind === 'facilitation' ? 'Help link' : `Fault line, heat ${e.heat} of 10`}</title>
      {glow > 0 ? (
        <line
          x1={a.x} y1={a.y} x2={b.x} y2={b.y}
          stroke={bright} strokeWidth={width + 4 + glow * 12} strokeLinecap="round"
          opacity={0.05 + glow * 0.55} filter="url(#edge-glow)"
        />
      ) : null}
      <line
        x1={a.x} y1={a.y} x2={b.x} y2={b.y}
        stroke={selected ? bright : colour}
        strokeWidth={selected ? width + 2 : width}
        strokeLinecap="round"
        opacity={e.kind === 'facilitation' ? 0.8 : 0.5 + (e.carried ? 0.3 : glow * 0.5)}
        strokeDasharray={e.carried ? '10 7' : undefined}
      />
      {interactive ? (
        <line
          x1={a.x} y1={a.y} x2={b.x} y2={b.y}
          stroke="transparent" strokeWidth={22} strokeLinecap="round"
        />
      ) : null}
    </g>
  );
}
