/**
 * §5 A5 — the reveal.
 *
 * One orchestrated moment: nodes fade in, the green web draws, then the fault
 * lines draw one by one with the hottest last. Nothing moves afterwards.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapFrame, NetworkMap } from '../../components/NetworkMap';
import { S } from '../../strings';
import { useStore } from '../../store/useStore';
import { useGraph, useStrivingLookup } from '../../store/selectors';
import { WizardFrame } from './Wizard';

export default function Mirror() {
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

  // The Coherence baseline is captured the moment the map first exists (§8).
  useEffect(() => { completeMirror(); }, [completeMirror]);

  return (
    <WizardFrame step="mirror" title={S.mirror.title} wide>
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

      <section className="mt-8 max-w-measure">
        <h2 className="text-sm uppercase tracking-[0.14em] text-muted">{S.mirror.legendTitle}</h2>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted">
          {S.mirror.legend.map((l) => (
            <li key={l} className="flex gap-3">
              <span aria-hidden="true" className="text-instrument-dim">·</span>
              <span>{l}</span>
            </li>
          ))}
        </ul>
      </section>

      <button
        type="button"
        className="btn-primary mt-8"
        disabled={!mirrorDone}
        onClick={() => navigate('/onboarding/report')}
      >
        {S.mirror.toReport}
      </button>
    </WizardFrame>
  );
}
