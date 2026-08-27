/**
 * The standing view — the screen this app is for.
 *
 * A whole life on one page: the twelve areas as a single figure, the self that
 * produces them beside it, every area in full underneath, and the collisions
 * between the goals at the bottom. Everything else in the app is a way of
 * putting something onto this page or taking something off it.
 *
 * It is designed to be legible on the first visit and on the hundredth. Nothing
 * here reshuffles: the dial keeps one order and the tiles keep one order, so
 * the shape of a life is a thing a person can learn and then notice changing.
 */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { isOnboardingComplete } from '../store/progress';
import { computeGraph } from '../engine/graph';
import {
  areaRows, describedCount, dialSectors, livingPercent, rankedRows,
} from '../engine/overview';
import { areaGap } from '../engine/gap';
import { AREA_BY_ID, areaName } from '../content/areas';
import { LifeDial } from '../components/life/LifeDial';
import { AreaTile } from '../components/life/AreaTile';
import { SelfPanel } from '../components/life/SelfPanel';
import { CollisionStrip } from '../components/life/CollisionStrip';
import { Explain } from '../components/ui';
import { S } from '../strings';
import type { LifeArea } from '../types';

export default function Life() {
  const state = useStore((s) => s.state);
  const lb = state.lifebook;
  const [selected, setSelected] = useState<LifeArea | null>(null);

  const rows = useMemo(() => areaRows(lb.visions, lb.currents), [lb.visions, lb.currents]);
  const sectors = useMemo(() => dialSectors(rows), [rows]);
  const ranked = useMemo(() => rankedRows(rows), [rows]);
  const living = useMemo(() => livingPercent(lb.visions, lb.currents), [lb.visions, lb.currents]);
  const graph = useMemo(
    () => computeGraph(state.strivings, state.pairRatings, state.forks),
    [state.strivings, state.pairRatings, state.forks],
  );

  const statementBy = useMemo(
    () => new Map(lb.visions.map((v) => [v.area, v.statement.trim()])),
    [lb.visions],
  );
  const beliefsByArea = useMemo(() => {
    const counts = new Map<LifeArea, number>();
    for (const b of lb.beliefs) {
      if (b.status !== 'confirmed') continue;
      for (const a of b.areas) counts.set(a, (counts.get(a) ?? 0) + 1);
    }
    return counts;
  }, [lb.beliefs]);

  const described = describedCount(lb.visions);
  const unplaced = rows.filter((r) => r.state === 'written').length;
  const blank = rows.filter((r) => r.state === 'blank').length;
  const attention = ranked[0]?.area ?? null;
  const shown = selected ? rows.find((r) => r.area === selected) ?? null : null;

  const livingText = living === null ? S.life.livingNone : `${S.life.living} ${living}%`;

  // The page in one sentence. Assembled from clauses rather than templated so
  // that a half-finished life gets a true sentence rather than a padded one.
  const ownedIdentities = lb.identities.filter((i) => i.text.trim().length > 0).length;
  const sentences = [
    `${S.life.readDescribed(described)}, ${
      living === null ? S.life.readUnplaced : S.life.readLiving(living)}`,
    ...(attention ? [S.life.readAttention(areaName(attention))] : []),
    ...(ownedIdentities > 0 ? [S.life.readIdentities(ownedIdentities)] : []),
  ];
  const readout = described > 0 ? sentences.map((t) => `${t}.`).join(' ') : null;

  return (
    <div className="w-full">
      <header className="mx-auto max-w-measure">
        <h1 className="text-2xl sm:text-3xl">{S.life.title}</h1>
        {readout ? (
          <p className="mt-3 max-w-measure font-display text-lg leading-snug text-bone">{readout}</p>
        ) : null}
        <p className="mt-3 prose-quiet">{S.life.lead}</p>
      </header>

      {/* ---- the figure, and the self it comes out of ---------------------- */}
      <div className="mt-10 grid gap-8 lg:grid-cols-2 lg:items-stretch">
        <section aria-labelledby="dial-heading" className="flex flex-col">
          <h2 id="dial-heading" className="sr-only">{S.life.dialTitle}</h2>

          <div className="mx-auto w-full max-w-[40rem]">
            <LifeDial
              sectors={sectors}
              rows={rows}
              selected={selected}
              onSelect={setSelected}
              attention={attention}
              centre={{
                value: living === null ? '—' : String(living),
                suffix: living === null ? undefined : '%',
                label: living === null ? S.life.livingNone : S.life.living,
              }}
              summary={S.life.summary(livingText, described)}
            />
          </div>

          {/* One readout slot. It carries the legend until a sector is picked,
              then the sector — so exploring the dial never moves the page. */}
          <div className="mx-auto mt-2 min-h-[5.5rem] w-full max-w-[40rem] text-center">
            {shown ? (
              <div className="animate-fade-up">
                <p className="font-display text-lg text-bone">{areaName(shown.area)}</p>
                <p className="numeral mt-1 text-xs text-muted">
                  {shown.current !== null ? S.life.at(shown.current) : S.life.notPlaced}
                  {shown.importance !== null ? ` · ${S.life.matters(shown.importance)}` : ''}
                </p>
                {statementBy.get(shown.area) ? (
                  <p className="mx-auto mt-2 max-w-measure text-sm leading-relaxed text-muted">
                    {statementBy.get(shown.area)}
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs leading-relaxed text-muted">{S.life.dialLegend}</p>
                <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted">
                  {attention ? (
                    <span className="text-carry-bright">{S.life.attention(areaName(attention))}</span>
                  ) : null}
                  {unplaced > 0 ? (
                    <Link to="/current" className="underline decoration-hairline underline-offset-4 hover:text-bone">
                      {S.life.dialUnknown(unplaced)}
                    </Link>
                  ) : null}
                  {blank > 0 ? (
                    <Link to="/vision" className="underline decoration-hairline underline-offset-4 hover:text-bone">
                      {S.life.dialBlank(blank)}
                    </Link>
                  ) : null}
                  {living !== null ? (
                    <Explain>
                      <div className="space-y-2">
                        <p>
                          For each area you have both described and placed: how far it is
                          from your vision, times how much you said it matters. Summed,
                          divided by the total importance, and subtracted from 100.
                        </p>
                        <ul className="space-y-1">
                          {ranked.map((r) => (
                            <li key={r.area} className="flex justify-between gap-4">
                              <span>{AREA_BY_ID.get(r.area)?.name}</span>
                              <span className="numeral text-muted">
                                {r.importance} × {areaGap(r.current!).toFixed(2)} = {r.tension!.toFixed(2)}
                              </span>
                            </li>
                          ))}
                        </ul>
                        <p className="text-muted">
                          Areas you have not placed are left out entirely rather than
                          counted as zero.
                        </p>
                      </div>
                    </Explain>
                  ) : null}
                </p>
              </div>
            )}
          </div>
        </section>

        <SelfPanel
          beliefs={lb.beliefs}
          identities={lb.identities}
          practices={lb.practices}
          logs={lb.practiceLogs}
          quests={state.quests}
          reports={state.reports}
        />
      </div>

      {/* ---- every area, in full ------------------------------------------- */}
      <section aria-labelledby="areas-heading" className="mt-14">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="areas-heading" className="text-lg">{S.life.areasTitle}</h2>
          <p className="text-xs text-muted">{S.life.areasNote}</p>
        </div>

        <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rows.map((row) => (
            <li key={row.area}>
              <AreaTile
                row={row}
                statement={statementBy.get(row.area) ?? ''}
                beliefCount={beliefsByArea.get(row.area) ?? 0}
                selected={selected === row.area}
                attention={attention === row.area}
                onHover={(hovering) => setSelected(hovering ? row.area : null)}
              />
            </li>
          ))}
        </ul>
      </section>

      {/* ---- the goals, and where they fight -------------------------------- */}
      <section className="mt-14">
        <CollisionStrip
          graph={graph}
          strivings={state.strivings}
          hasMap={isOnboardingComplete(state)}
        />
      </section>

      <div className="mt-10 flex flex-wrap items-center gap-4">
        <Link to="/board" className="btn-ghost">{S.stages.gap.board}</Link>
        <Link to="/print" className="btn-quiet">{S.life.print}</Link>
      </div>
    </div>
  );
}
