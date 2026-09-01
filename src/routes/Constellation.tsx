/**
 * The constellation — the standing view's data, given a third axis.
 *
 * A full-viewport layer over the app: the scene behind, a breadcrumb pill, a
 * rail of the twelve areas plus the self (which is the keyboard and screen-
 * reader path — nothing here is reachable only by pointing at it), and a glass
 * panel that slides in with whatever was picked, in the person's own words.
 *
 * Everything it says comes from src/engine/constellation.ts and the same
 * stores the standing view reads, so the two can never disagree.
 */
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { buildConstellation, TIER_OF, type Tier } from '../engine/constellation';
import { beliefEvidence } from '../engine/evidence';
import { AREA_BY_ID, areaName, areaShort } from '../content/areas';
import { ConstellationScene, type Pick } from '../components/life/ConstellationScene';
import { S } from '../strings';
import { LIFE_AREAS, type LifeArea } from '../types';

function useReducedMotion(): boolean {
  const [rm, setRm] = useState(() => (
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ));
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setRm(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return rm;
}

const SHORT = Object.fromEntries(LIFE_AREAS.map((a) => [a, areaShort(a)])) as Record<LifeArea, string>;

export default function Constellation() {
  const state = useStore((s) => s.state);
  const lb = state.lifebook;
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();
  const [selected, setSelected] = useState<Pick | null>(null);
  const [hovered, setHovered] = useState<Pick | null>(null);

  const data = useMemo(() => buildConstellation(state), [state]);
  const tierLabels = useMemo(() => S.constellation.tiers, []);
  const evidence = useMemo(() => beliefEvidence(state.quests, state.reports), [state.quests, state.reports]);

  const beliefById = useMemo(() => new Map(lb.beliefs.map((b) => [b.id, b])), [lb.beliefs]);
  const identityForBelief = useMemo(
    () => new Map(lb.identities.filter((i) => i.text.trim()).map((i) => [i.replacesBeliefId, i])),
    [lb.identities],
  );
  const visionBy = useMemo(() => new Map(lb.visions.map((v) => [v.area, v])), [lb.visions]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (selected) setSelected(null);
      else navigate('/life');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected, navigate]);

  const node = selected && selected !== 'self' ? data.nodes.find((n) => n.area === selected) ?? null : null;
  const coupledWith = (area: LifeArea) => data.arcs
    .filter((a) => a.kind === 'coupled' && (a.a === area || a.b === area))
    .map((a) => (a.a === area ? a.b : a.a));

  const crumbHere = selected === 'self' ? S.constellation.self : selected ? areaName(selected) : null;

  return (
    <div
      data-testid="constellation"
      className="fixed inset-0 z-30 overflow-hidden bg-canvas text-bone"
      style={{ backgroundImage: 'radial-gradient(1100px 720px at 50% 32%, #10172d 0%, #0b0e14 72%)' }}
    >
      {/* On wide screens the scene starts where the rail ends, so its centre
          is the centre of the space a person can actually see it in. */}
      <div className="absolute inset-0 sm:left-48">
      <ConstellationScene
        data={data}
        labels={SHORT}
        tierLabels={tierLabels}
        selfLabel={S.constellation.self}
        selected={selected}
        hovered={hovered}
        onSelect={setSelected}
        onHover={setHovered}
        reducedMotion={reducedMotion}
      />
      </div>

      {/* ---- top: back, crumb ---------------------------------------------- */}
      <Link
        to="/life"
        className="glass absolute left-4 top-4 z-10 rounded-full px-4 py-2 text-xs text-muted hover:text-bone"
      >
        ← {S.constellation.back}
      </Link>
      <div className="glass absolute left-1/2 top-4 z-10 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-xs">
        <button type="button" className="text-muted hover:text-bone" onClick={() => setSelected(null)}>
          {S.constellation.crumb}
        </button>
        {crumbHere ? (
          <>
            <span className="text-instrument-dim">›</span>
            <span className="font-medium text-bone">{crumbHere}</span>
          </>
        ) : null}
      </div>

      {/* ---- left: the rail — the accessible path to every node ------------- */}
      <nav
        aria-label={S.constellation.rail}
        className="glass absolute bottom-4 left-4 top-16 z-10 hidden w-44 flex-col overflow-y-auto rounded-2xl p-2 sm:flex"
      >
        <RailButton
          active={selected === 'self'}
          hot={hovered === 'self'}
          onClick={() => setSelected(selected === 'self' ? null : 'self')}
          onHover={(h) => setHovered(h ? 'self' : null)}
          tone="self"
          label={S.constellation.self}
          sub={data.satellites.length ? S.constellation.selfSub(data.satellites.length) : undefined}
        />
        {(['person', 'people', 'world'] as Tier[]).map((tier) => (
          <div key={tier} className="mt-2">
            <p className="px-2 pb-1 pt-1 text-[0.62rem] uppercase tracking-[0.16em] text-muted">
              {tierLabels[tier]}
            </p>
            {data.nodes.filter((n) => n.tier === tier).map((n) => (
              <RailButton
                key={n.area}
                active={selected === n.area}
                hot={hovered === n.area}
                onClick={() => setSelected(selected === n.area ? null : n.area)}
                onHover={(h) => setHovered(h ? n.area : null)}
                tone={n.state === 'blank' ? 'blank' : n.attention ? 'attention' : 'area'}
                label={SHORT[n.area]}
                sub={n.current !== null ? `${n.current}/10` : n.state === 'written' ? S.constellation.unplacedShort : undefined}
              />
            ))}
          </div>
        ))}
      </nav>

      {/* ---- bottom: how to read it ----------------------------------------- */}
      <p className="pointer-events-none absolute bottom-4 left-4 right-4 z-10 hidden text-[0.7rem] leading-relaxed text-muted sm:left-52 sm:block sm:max-w-xl">
        <span className="text-bone/80">{S.constellation.hint}</span>{' '}
        {S.constellation.legend}
      </p>

      {/* ---- right: the panel ------------------------------------------------ */}
      <aside
        aria-label={S.constellation.panelLabel}
        className={`glass absolute right-4 top-16 z-10 w-[min(21rem,calc(100vw-2rem))] rounded-2xl p-5 transition-all duration-300 ${
          selected ? 'translate-x-0 opacity-100' : 'pointer-events-none translate-x-4 opacity-0'
        }`}
        style={{ maxHeight: 'calc(100vh - 5rem)', overflowY: 'auto' }}
      >
        <button
          type="button"
          className="absolute right-3 top-2.5 px-1.5 text-muted hover:text-bone"
          aria-label={S.explain.close}
          onClick={() => setSelected(null)}
        >
          ×
        </button>

        {selected === 'self' ? (
          <div>
            <p className="inline-block rounded-full border border-[#a78bfa]/60 px-2.5 py-0.5 text-[0.62rem] uppercase tracking-wider text-[#c4b5fd]">
              {S.constellation.kindSelf}
            </p>
            <h2 className="mt-3 font-display text-lg leading-snug">{S.constellation.selfTitle}</h2>
            <p className="mt-1.5 text-xs leading-relaxed text-muted">{S.constellation.selfLead}</p>
            {data.satellites.length === 0 ? (
              <p className="mt-4 text-sm text-muted">{S.constellation.selfEmpty}</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {data.satellites.map((sat) => {
                  const identity = lb.identities.find((i) => i.id === sat.identityId);
                  const belief = identity?.replacesBeliefId ? beliefById.get(identity.replacesBeliefId) : undefined;
                  const e = belief ? evidence.get(belief.id) : undefined;
                  return (
                    <li key={sat.identityId} className="border-l-2 border-[#a78bfa]/60 pl-3">
                      <p className="font-display text-[0.95rem] leading-snug">{sat.text}</p>
                      {belief ? (
                        <p className="mt-1 text-[0.7rem] leading-relaxed text-muted">
                          <span className="text-instrument-dim">{S.life.selfInstead} </span>
                          <span className="line-through decoration-fault/70">“{belief.text}”</span>
                        </p>
                      ) : null}
                      {e && (e.tested > 0 || e.pending > 0) ? (
                        <p className="mt-1 flex flex-wrap gap-x-2 text-[0.68rem]">
                          {e.broken > 0 ? <span className="text-facil-bright">{S.life.evidenceBroken(e.broken)}</span> : null}
                          {e.pending > 0 ? <span className="text-carry-bright">{S.life.evidencePending(e.pending)}</span> : null}
                        </p>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
            <div className="mt-5 flex flex-wrap gap-2">
              <Link to="/blueprint" className="btn-ghost py-1.5 text-xs">{S.life.selfProgramme}</Link>
              <Link to="/self-image" className="btn-quiet py-1.5 text-xs">{S.constellation.selfImage}</Link>
            </div>
          </div>
        ) : node ? (
          <div>
            <p className={`inline-block rounded-full border px-2.5 py-0.5 text-[0.62rem] uppercase tracking-wider ${
              node.attention ? 'border-carry/60 text-carry-bright' : 'border-instrument-dim text-instrument'
            }`}>
              {S.constellation.kindArea(tierLabels[TIER_OF[node.area]])}
            </p>
            <h2 className="mt-3 font-display text-lg leading-snug">{areaName(node.area)}</h2>
            <p className="mt-1 text-xs text-muted">{AREA_BY_ID.get(node.area)?.blurb}</p>

            {node.state === 'blank' ? (
              <p className="mt-4 text-sm leading-relaxed text-muted">{S.constellation.notWritten}</p>
            ) : (
              <>
                <p className="mt-4 text-sm leading-relaxed">{visionBy.get(node.area)?.statement}</p>
                <p className="numeral mt-2 text-xs text-muted">
                  {node.importance !== null ? S.life.matters(node.importance) : ''}
                  {node.current !== null ? ` · ${S.life.at(node.current)}` : ''}
                </p>
                {node.state === 'written' ? (
                  <p className="mt-1 text-xs text-carry-bright">{S.life.notPlaced}</p>
                ) : null}
                {node.attention ? (
                  <p className="mt-1 text-xs text-carry-bright">{S.life.mostDistance}</p>
                ) : null}
              </>
            )}

            <h3 className="mt-5 text-[0.62rem] uppercase tracking-[0.16em] text-muted">
              {S.constellation.beliefsHere}
            </h3>
            {node.beliefIds.length === 0 ? (
              <p className="mt-1 text-xs text-muted">{S.constellation.none}</p>
            ) : (
              <ul className="mt-1.5 space-y-2">
                {node.beliefIds.map((id) => {
                  const b = beliefById.get(id);
                  const identity = identityForBelief.get(id);
                  if (!b) return null;
                  return (
                    <li key={id} className="text-xs leading-relaxed">
                      <span className="text-muted">“{b.text}”</span>
                      {identity ? (
                        <span className="mt-0.5 block text-[#c4b5fd]">→ {identity.text}</span>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}

            {coupledWith(node.area).length > 0 ? (
              <>
                <h3 className="mt-4 text-[0.62rem] uppercase tracking-[0.16em] text-muted">
                  {S.constellation.coupledWith}
                </h3>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {coupledWith(node.area).map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setSelected(a)}
                      className="rounded-full border border-[#a78bfa]/40 px-2 py-0.5 text-[0.68rem] text-[#c4b5fd] hover:border-[#a78bfa]"
                    >
                      {areaName(a)}
                    </button>
                  ))}
                </div>
              </>
            ) : null}

            <div className="mt-5 flex flex-wrap gap-2">
              {node.state === 'blank' ? (
                <Link to="/vision" className="btn-ghost py-1.5 text-xs">{S.life.write}</Link>
              ) : node.state === 'written' ? (
                <Link to="/current" className="btn-ghost py-1.5 text-xs">{S.life.place}</Link>
              ) : (
                <Link to="/vision" className="btn-ghost py-1.5 text-xs">{S.life.revise}</Link>
              )}
              {node.beliefIds.length > 0 ? (
                <Link to="/blueprint" className="btn-quiet py-1.5 text-xs">{S.constellation.testHere}</Link>
              ) : null}
            </div>
          </div>
        ) : null}
      </aside>
    </div>
  );
}

function RailButton({ active, hot, onClick, onHover, tone, label, sub }: {
  active: boolean; hot: boolean; onClick: () => void; onHover: (h: boolean) => void;
  tone: 'self' | 'area' | 'attention' | 'blank'; label: string; sub?: string;
}) {
  const dot = tone === 'self' ? 'bg-[#a78bfa]'
    : tone === 'attention' ? 'bg-carry'
      : tone === 'blank' ? 'border border-instrument-dim bg-transparent'
        : 'bg-instrument';
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      onFocus={() => onHover(true)}
      onBlur={() => onHover(false)}
      className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors ${
        active ? 'bg-surface2 text-bone' : hot ? 'text-bone' : tone === 'blank' ? 'text-muted/70 hover:text-bone' : 'text-muted hover:text-bone'
      }`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
      <span className="flex-1 truncate">{label}</span>
      {sub ? <span className="numeral text-[0.65rem] text-instrument-dim">{sub}</span> : null}
    </button>
  );
}
