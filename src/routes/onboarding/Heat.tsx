/** §5 A4 — discomfort ("heat") ratings, asked only about negative pairs. */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { S } from '../../strings';
import { useStore } from '../../store/useStore';
import { pairsNeedingHeat, ratingMap } from '../../data/pairs';
import { edgeKey } from '../../engine/graph';
import type { Heat } from '../../types';
import { Slider, StrivingText } from '../../components/ui';
import { WizardFrame } from './Wizard';

export default function HeatRatings() {
  const navigate = useNavigate();
  const strivings = useStore((s) => s.state.strivings);
  const pairRatings = useStore((s) => s.state.pairRatings);
  const setHeat = useStore((s) => s.setHeat);

  const pairs = useMemo(() => pairsNeedingHeat(strivings, pairRatings), [strivings, pairRatings]);
  const rated = useMemo(() => ratingMap(pairRatings), [pairRatings]);
  const labels = useMemo(() => new Map(strivings.map((s) => [s.id, s.text])), [strivings]);

  const firstUnset = pairs.findIndex((p) => rated.get(edgeKey(p.aId, p.bId))?.heat === undefined);
  const [index, setIndex] = useState(() => (firstUnset >= 0 ? firstUnset : 0));
  const [value, setValue] = useState(5);

  const pair = pairs[index];

  // Show the stored value when revisiting a pair; otherwise start mid-scale.
  useEffect(() => {
    if (!pair) return;
    const stored = rated.get(edgeKey(pair.aId, pair.bId))?.heat;
    setValue(stored ?? 5);
  }, [index, pair, rated]);

  useEffect(() => {
    if (pairs.length === 0) navigate('/onboarding/mirror', { replace: true });
  }, [pairs.length, navigate]);

  if (!pair) return null;

  const next = () => {
    setHeat(pair.aId, pair.bId, value as Heat);
    if (index + 1 >= pairs.length) navigate('/onboarding/mirror');
    else setIndex(index + 1);
  };

  return (
    <WizardFrame step="heat" title={S.heat.title} lead={S.heat.note}>
      <p className="numeral text-sm text-muted" aria-live="polite">
        {S.heat.progress(index + 1, pairs.length)}
      </p>

      <div className="mt-8 space-y-3">
        <p className="text-lg leading-snug sm:text-xl">
          <StrivingText text={labels.get(pair.aId) ?? ''} />
        </p>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-fault-bright">against</p>
        <p className="text-lg leading-snug sm:text-xl">
          <StrivingText text={labels.get(pair.bId) ?? ''} />
        </p>
      </div>

      <h2 className="mt-10 text-base font-normal text-muted">{S.heat.question}</h2>

      <div className="mt-6">
        <Slider
          id="heat"
          value={value}
          min={0}
          max={10}
          onChange={setValue}
          lowLabel={S.heat.low}
          highLabel={S.heat.high}
          ariaLabel={S.heat.question}
        />
      </div>

      <div className="mt-8 flex items-center gap-3">
        <button
          type="button"
          className="btn-ghost"
          disabled={index === 0}
          onClick={() => setIndex(index - 1)}
        >
          {S.common.back}
        </button>
        <button type="button" className="btn-primary" onClick={next}>
          {S.heat.next}
        </button>
      </div>
    </WizardFrame>
  );
}
