/**
 * Act one, stage four — the map.
 *
 * This is the whole product for most people. Ten minutes in, they get a picture
 * of their own life they have never seen, and one sentence naming the goal that
 * sits inside more of their collisions than anything else.
 *
 * The sentence matters more than the picture. The picture is what they show
 * somebody; the sentence is what they think about on the way home. So it is set
 * large, it is the only thing on screen at that size, and it says nothing the
 * app inferred — only what their own ratings add up to.
 *
 * Everything after this is optional, and framed as a question rather than a
 * next step: the people who ask why the map is that shape are the ones act two
 * is for, and the ones who do not ask have still had a fair trade.
 */
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapFrame, NetworkMap } from '../../components/NetworkMap';
import { StageFrame } from '../../components/lifebook';
import { Explain, StrivingText, Tag } from '../../components/ui';
import { conflictEdgesByHeat } from '../../engine/graph';
import { useGraph, useStrivingLookup } from '../../store/selectors';
import { useStore } from '../../store/useStore';
import { S } from '../../strings';
import { PaidNote } from '../../components/PaidCta';

export default function MirrorStage() {
  const navigate = useNavigate();
  const graph = useGraph();
  const labels = useStrivingLookup();
  const completeMirror = useStore((s) => s.completeMirror);
  const mirrorDone = useStore((s) => s.state.profile.mirrorCompletedTs);

  const [reduced] = useState(
    () => typeof window !== 'undefined'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const [skipped, setSkipped] = useState(false);

  // The Coherence baseline is captured the moment the map first exists.
  useEffect(() => { completeMirror(); }, [completeMirror]);

  const loadBearing = graph.loadBearing;
  const loadBearingText = loadBearing ? labels.get(loadBearing.id) ?? '' : '';
  const hottest = graph.hottestEdge;
  const faults = conflictEdgesByHeat(graph);

  return (
    <StageFrame stage="mirror" title={S.stages.mirror.title} wide>
      <MapFrame>
        <NetworkMap
          graph={graph}
          labels={labels}
          reveal={!skipped && !reduced}
          key={skipped ? 'instant' : 'reveal'}
        />
      </MapFrame>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {!skipped && !reduced ? (
          <button type="button" className="btn-quiet text-xs" onClick={() => setSkipped(true)}>
            {S.mirror.skipAnimation}
          </button>
        ) : null}
        {reduced ? <p className="text-xs text-muted">{S.map.reduced}</p> : null}
      </div>

      {/* The sentence. Nothing else at this size, anywhere in the app. */}
      {loadBearing ? (
        <section className="mx-auto mt-12 max-w-2xl animate-fade-up text-center">
          <p className="text-xs uppercase tracking-[0.14em] text-instrument">
            {S.stages.mirror.headline}
          </p>
          <p className="mt-4 font-display text-2xl leading-snug sm:text-3xl">
            {S.stages.mirror.loadBearing(loadBearingText)}
          </p>
          <p className="mx-auto mt-5 max-w-measure leading-relaxed text-muted">
            {S.stages.mirror.loadBearingWhy(loadBearing.conflictDegree, graph.faultLineCount)}
          </p>
        </section>
      ) : (
        <section className="mx-auto mt-12 max-w-2xl text-center">
          <p className="font-display text-2xl leading-snug">{S.stages.mirror.noConflict}</p>
          <p className="mx-auto mt-4 max-w-measure leading-relaxed text-muted">
            {S.stages.mirror.noConflictBody}
          </p>
        </section>
      )}

      <div className="mx-auto mt-12 grid max-w-3xl gap-3 sm:grid-cols-3">
        <Figure
          label={S.bits.faultLines}
          value={graph.faultLineCount}
          note={S.stages.mirror.faultNote}
        />
        <Figure
          label={S.bits.helpLinks}
          value={graph.helpLinkCount}
          note={S.stages.mirror.helpNote}
        />
        <Figure
          label={S.bits.conflictIndex}
          value={graph.conflictIndexPercent}
          suffix="%"
          note={S.stages.mirror.indexNote}
          explain={
            <div className="space-y-2">
              <p>{S.howComputed.conflictIndexFormula}</p>
              <p className="numeral text-muted">
                {graph.totalConflictLoad.toFixed(2)} ÷ ({graph.totalConflictLoad.toFixed(2)} +{' '}
                {graph.totalFacilitation.toFixed(2)}) = {graph.conflictIndexPercent}%
              </p>
              <p>{S.howComputed.conflictIndexNoCorrect}</p>
            </div>
          }
        />
      </div>

      {hottest ? (
        <section className="mx-auto mt-10 max-w-2xl rounded-lg border border-fault/40 bg-fault/[0.05] p-5">
          <div className="flex flex-wrap items-center gap-2">
            <Tag tone="fault">{S.stages.mirror.hottest}</Tag>
            <Tag tone="fault">{S.bits.heatOf(hottest.heat)}</Tag>
          </div>
          <p className="mt-3 leading-snug"><StrivingText text={labels.get(hottest.aId) ?? ''} /></p>
          <p className="my-1 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-fault-bright">
            {S.bits.against}
          </p>
          <p className="leading-snug"><StrivingText text={labels.get(hottest.bId) ?? ''} /></p>
        </section>
      ) : null}

      {/* Two doors, and neither is a funnel. */}
      <section className="mx-auto mt-14 max-w-2xl border-t border-hairline pt-8">
        <h2 className="font-display text-xl">{S.stages.mirror.whatNow}</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            disabled={!mirrorDone || faults.length === 0}
            onClick={() => {
              const e = faults[0];
              if (e) navigate(`/fork?a=${encodeURIComponent(e.aId)}&b=${encodeURIComponent(e.bId)}`);
            }}
            className="rounded-lg border border-instrument/50 bg-instrument/[0.06] p-5 text-left transition-colors hover:bg-instrument/10 disabled:opacity-40"
          >
            <h3 className="font-display text-lg">{S.stages.mirror.doorTest}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{S.stages.mirror.doorTestBody}</p>
          </button>

          <Link
            to="/current"
            className="rounded-lg border border-hairline p-5 text-left transition-colors hover:border-instrument-dim hover:bg-surface"
          >
            <h3 className="font-display text-lg">{S.stages.mirror.doorWhy}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{S.stages.mirror.doorWhyBody}</p>
          </Link>
        </div>

        {/* Both doors above lead into the paid half. Said here, once, under
            them — rather than stamped on each — so the composition survives and
            nobody clicks through to a price they were not told about. */}
        <PaidNote />

        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/map" className="btn-quiet">{S.stages.mirror.keepMap}</Link>
          <Link to="/print" className="btn-quiet">{S.stages.gap.print}</Link>
          <span className="self-center text-xs text-muted">{S.stages.mirror.noRush}</span>
        </div>
      </section>

      <p className="mx-auto mt-10 max-w-measure text-center text-xs leading-relaxed text-muted">
        {S.stages.mirror.honesty}
      </p>
    </StageFrame>
  );
}

function Figure({ label, value, suffix, note, explain }: {
  label: string; value: number | null; suffix?: string; note: string; explain?: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-hairline bg-surface/50 p-4 text-center">
      <p className="text-[0.68rem] uppercase tracking-[0.14em] text-muted">{label}</p>
      <p className="mt-1.5 numeral text-3xl">
        {value === null ? <span className="text-muted">—</span> : value}
        {value !== null && suffix ? <span className="text-lg text-muted">{suffix}</span> : null}
      </p>
      <p className="mt-2 text-xs leading-relaxed text-muted">{note}</p>
      {explain ? <div className="mt-2"><Explain>{explain}</Explain></div> : null}
    </div>
  );
}
