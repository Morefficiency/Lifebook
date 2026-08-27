/**
 * The conflict map, compressed to the one line it exists to deliver.
 *
 * The full map is a screen of its own and stays that way — this is the strip
 * that says whether there is anything to go and look at.
 */
import { Link } from 'react-router-dom';
import type { GraphMetrics } from '../../engine/graph';
import type { Striving } from '../../types';
import { conflictEdgesByWeight } from '../../engine/graph';
import { S } from '../../strings';

export interface CollisionStripProps {
  graph: GraphMetrics;
  strivings: Striving[];
  hasMap: boolean;
}

export function CollisionStrip({ graph, strivings, hasMap }: CollisionStripProps) {
  const nameOf = (id: string) =>
    strivings.find((s) => s.id === id)?.text ?? id;

  if (!hasMap || graph.nodes.length === 0) {
    return (
      <section className="rounded-lg border border-dashed border-hairline p-6">
        <h2 className="text-lg">{S.life.collisionsTitle}</h2>
        <p className="mt-2 text-sm text-muted">{S.life.collisionsNone}</p>
        <Link to="/goals" className="btn-ghost mt-4">{S.life.collisionsStart}</Link>
      </section>
    );
  }

  const worst = conflictEdgesByWeight(graph)[0];
  const bearing = graph.loadBearing;

  return (
    <section className="rounded-lg border border-hairline bg-surface/60 p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-lg">{S.life.collisionsTitle}</h2>
        <Link
          to="/map"
          className="text-xs text-instrument underline decoration-instrument-dim underline-offset-4 hover:decoration-instrument"
        >
          {S.life.collisionsOpen}
        </Link>
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-[auto,1fr] sm:items-center sm:gap-8">
        <dl className="flex gap-6">
          <div>
            <dt className="text-[0.68rem] uppercase tracking-[0.14em] text-muted">
              {S.bits.faultLines}
            </dt>
            <dd className="numeral mt-1 text-2xl text-bone">{graph.faultLineCount}</dd>
          </div>
          <div>
            <dt className="text-[0.68rem] uppercase tracking-[0.14em] text-muted">
              {S.bits.helpLinks}
            </dt>
            <dd className="numeral mt-1 text-2xl text-bone">{graph.helpLinkCount}</dd>
          </div>
          <div>
            <dt className="text-[0.68rem] uppercase tracking-[0.14em] text-muted">
              {S.bits.conflictIndex}
            </dt>
            <dd className="numeral mt-1 text-2xl text-bone">
              {graph.conflictIndexPercent === null ? '—' : `${graph.conflictIndexPercent}%`}
            </dd>
          </div>
        </dl>

        <div className="min-w-0">
          {bearing ? (
            <p className="font-display text-lg leading-snug text-bone">
              {S.stages.mirror.loadBearing(nameOf(bearing.id))}
            </p>
          ) : null}
          {worst ? (
            <p className="mt-2 truncate text-sm text-muted">
              <span className="text-fault-bright">{S.stages.mirror.hottest}: </span>
              {nameOf(worst.aId)} · {nameOf(worst.bId)}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
