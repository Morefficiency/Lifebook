/**
 * Act one, stage three (b) — how much each collision actually costs.
 *
 * Only asked about the pairs rated as conflicting, so on a typical short form
 * this is four to eight sliders rather than fifteen. The rating is what makes
 * the map's glow mean something: strength of clash and how much it bothers you
 * are different facts, and a map that only knows the first is a diagram.
 */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { S } from '../../strings';
import { useStore } from '../../store/useStore';
import { pairsNeedingHeat, ratingMap } from '../../data/pairs';
import { edgeKey } from '../../engine/graph';
import type { Heat } from '../../types';
import { Slider, StrivingText } from '../../components/ui';
import { StageFooter, StageFrame } from '../../components/lifebook';

export default function Friction() {
  const navigate = useNavigate();
  const strivings = useStore((s) => s.state.strivings);
  const pairRatings = useStore((s) => s.state.pairRatings);
  const setHeat = useStore((s) => s.setHeat);

  const pairs = useMemo(() => pairsNeedingHeat(strivings, pairRatings), [strivings, pairRatings]);
  const rated = useMemo(() => ratingMap(pairRatings), [pairRatings]);
  const labels = useMemo(() => new Map(strivings.map((x) => [x.id, x.text])), [strivings]);

  const firstUnset = pairs.findIndex((p) => rated.get(edgeKey(p.aId, p.bId))?.heat === undefined);
  const [index, setIndex] = useState(() => (firstUnset >= 0 ? firstUnset : 0));
  const [value, setValue] = useState(5);
  const [shownFor, setShownFor] = useState<string | null>(null);

  const pair = pairs[index];
  const key = pair ? edgeKey(pair.aId, pair.bId) : null;

  if (pair && key && shownFor !== key) {
    setShownFor(key);
    setValue(rated.get(key)?.heat ?? 5);
  }

  useEffect(() => {
    // No conflicts at all is a real answer, and the map is still worth seeing.
    if (pairs.length === 0) navigate('/mirror', { replace: true });
  }, [pairs.length, navigate]);

  if (!pair) return null;

  const next = () => {
    setHeat(pair.aId, pair.bId, value as Heat);
    if (index + 1 >= pairs.length) navigate('/mirror');
    else setIndex(index + 1);
  };

  return (
    <StageFrame stage="pairs" title={S.stages.friction.title} lead={S.stages.friction.lead}>
      <p className="numeral text-sm text-muted" aria-live="polite">
        {S.heat.progress(index + 1, pairs.length)}
      </p>

      <div className="mt-8 space-y-3">
        <p className="text-lg leading-snug sm:text-xl">
          <StrivingText text={labels.get(pair.aId) ?? ''} />
        </p>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-fault-bright">
          {S.bits.against}
        </p>
        <p className="text-lg leading-snug sm:text-xl">
          <StrivingText text={labels.get(pair.bId) ?? ''} />
        </p>
      </div>

      <h2 className="mt-10 text-base font-normal text-muted">{S.heat.question}</h2>

      <div className="mt-6">
        <Slider
          id="friction"
          value={value}
          min={0}
          max={10}
          onChange={setValue}
          lowLabel={S.heat.low}
          highLabel={S.heat.high}
          ariaLabel={S.heat.question}
        />
      </div>

      <StageFooter>
        <button
          type="button"
          className="btn-ghost"
          disabled={index === 0}
          onClick={() => setIndex(index - 1)}
        >
          {S.common.back}
        </button>
        <button type="button" className="btn-primary" onClick={next}>
          {index + 1 >= pairs.length ? S.stages.friction.last : S.heat.next}
        </button>
      </StageFooter>
    </StageFrame>
  );
}
