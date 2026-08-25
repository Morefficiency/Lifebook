/**
 * §7.5 — re-rating a pair after evidence.
 *
 * Offered (never forced) when two consecutive predictions on the same fault
 * line have broken. The user changes their own rating or leaves it alone; the
 * app has no opinion about which is correct and does not infer a new rating
 * from the outcomes (Design Law 5, §13).
 */
import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { S } from '../strings';
import { useStore } from '../store/useStore';
import { useStrivingLookup } from '../store/selectors';
import { canonicalEdge, edgeKey } from '../engine/graph';
import type { Effect, Heat } from '../types';
import { Slider, StrivingText } from '../components/ui';

export default function Rerate() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const labels = useStrivingLookup();
  const ratings = useStore((s) => s.state.pairRatings);
  const reratePair = useStore((s) => s.reratePair);

  const edge = useMemo(() => {
    const a = params.get('a');
    const b = params.get('b');
    return a && b ? canonicalEdge(a, b) : null;
  }, [params]);

  const current = edge
    ? ratings.find((r) => edgeKey(r.aId, r.bId) === edgeKey(edge.aId, edge.bId))
    : undefined;

  const [effect, setEffect] = useState<Effect>(current?.effect ?? 0);
  const [heat, setHeat] = useState<number>(current?.heat ?? 5);

  if (!edge) {
    return (
      <div>
        <p className="text-muted">{S.common.notFound}</p>
        <Link to="/map" className="btn-ghost mt-4">{S.common.toMap}</Link>
      </div>
    );
  }

  const save = () => {
    reratePair(edge.aId, edge.bId, effect, effect < 0 ? (heat as Heat) : undefined);
    navigate('/map');
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      <h1 className="text-2xl sm:text-3xl">{S.broken.rerateCta}</h1>
      <p className="mt-3 max-w-measure text-muted">{S.rerate.lead}</p>

      <div className="card mt-8">
        <p className="leading-snug"><StrivingText text={labels.get(edge.aId) ?? ''} /></p>
        <p className="my-1.5 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-muted">{S.bits.and}</p>
        <p className="leading-snug"><StrivingText text={labels.get(edge.bId) ?? ''} /></p>
      </div>

      <h2 className="mt-8 text-base font-normal text-muted">{S.duels.question}</h2>
      <div className="mt-4 grid gap-2">
        {S.duels.options.map((o) => (
          <button
            key={o.effect}
            type="button"
            aria-pressed={effect === o.effect}
            onClick={() => setEffect(o.effect as Effect)}
            className={`flex items-center gap-3 rounded-md border px-4 py-3.5 text-left ${
              effect === o.effect ? 'border-instrument bg-instrument/12' : 'border-hairline hover:border-instrument-dim'
            }`}
          >
            {o.glyph ? <span aria-hidden="true">{o.glyph}</span> : null}
            <span className="flex-1">{o.label}</span>
            <span className="numeral text-sm text-muted">{o.effect > 0 ? `+${o.effect}` : o.effect}</span>
          </button>
        ))}
      </div>

      {effect < 0 ? (
        <div className="mt-8">
          <h2 className="text-base font-normal text-muted">{S.heat.question}</h2>
          <div className="mt-4">
            <Slider
              id="rerate-heat" value={heat} min={0} max={10} onChange={setHeat}
              lowLabel={S.heat.low} highLabel={S.heat.high} ariaLabel={S.heat.question}
            />
          </div>
        </div>
      ) : null}

      <div className="mt-8 flex gap-3">
        <button type="button" className="btn-primary" onClick={save}>{S.common.save}</button>
        <Link to="/map" className="btn-quiet">{S.common.cancel}</Link>
      </div>
    </div>
  );
}
