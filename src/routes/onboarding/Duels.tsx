/** §5 A3 — pairwise duels. One pair per screen, keyboard 1–5, resumable. */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { S } from '../../strings';
import { useStore } from '../../store/useStore';
import { allPairs, nextUnratedIndex, ratingMap } from '../../data/pairs';
import { edgeKey } from '../../engine/graph';
import type { Effect } from '../../types';
import { StrivingText } from '../../components/ui';
import { WizardFrame } from './Wizard';

export default function Duels() {
  const navigate = useNavigate();
  const strivings = useStore((s) => s.state.strivings);
  const pairRatings = useStore((s) => s.state.pairRatings);
  const ratePair = useStore((s) => s.ratePair);

  const pairs = useMemo(() => allPairs(strivings), [strivings]);
  const rated = useMemo(() => ratingMap(pairRatings), [pairRatings]);
  const labels = useMemo(() => new Map(strivings.map((s) => [s.id, s.text])), [strivings]);

  // Resume exactly where the flow stopped; -1 means the matrix is complete.
  const resumeAt = nextUnratedIndex(strivings, pairRatings);
  const [index, setIndex] = useState(() => (resumeAt >= 0 ? resumeAt : pairs.length - 1));

  const pair = pairs[Math.min(index, pairs.length - 1)];

  // Keypresses can outrun React's render, so the handler reads the position it
  // is answering from a ref rather than from a closed-over render value —
  // otherwise holding a key down rates the same pair twice and skips the next.
  const indexRef = useRef(index);
  const pairsRef = useRef(pairs);
  indexRef.current = index;
  pairsRef.current = pairs;

  const choose = useCallback((effect: Effect) => {
    const at = indexRef.current;
    const target = pairsRef.current[at];
    if (!target) return;
    ratePair(target.aId, target.bId, effect);
    const next = Math.min(at + 1, pairsRef.current.length);
    indexRef.current = next;
    setIndex(next);
  }, [ratePair]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const opt = S.duels.options.find((o) => o.key === e.key);
      if (!opt) return;
      const target = e.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      e.preventDefault();
      choose(opt.effect as Effect);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [choose]);

  // Everything rated: move on to heat.
  useEffect(() => {
    if (nextUnratedIndex(strivings, pairRatings) < 0 && index >= pairs.length) {
      navigate('/onboarding/heat', { replace: true });
    }
  }, [index, pairs.length, strivings, pairRatings, navigate]);

  if (!pair) return null;

  const current = rated.get(edgeKey(pair.aId, pair.bId));

  return (
    <WizardFrame step="duels" title={S.duels.title}>
      <p className="numeral text-sm text-muted" aria-live="polite">
        {S.duels.progress(Math.min(index + 1, pairs.length), pairs.length)}
      </p>

      <div
        className="mt-2 h-0.5 w-full overflow-hidden rounded bg-hairline"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={pairs.length}
        aria-valuenow={Math.min(index, pairs.length)}
        aria-label="Pairs rated"
      >
        <div
          className="h-full bg-instrument transition-[width] duration-200"
          style={{ width: `${(Math.min(index, pairs.length) / Math.max(1, pairs.length)) * 100}%` }}
        />
      </div>

      <div className="mt-8 space-y-4">
        <p className="text-xl leading-snug sm:text-2xl">
          <StrivingText text={labels.get(pair.aId) ?? ''} />
        </p>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-instrument">and</p>
        <p className="text-xl leading-snug sm:text-2xl">
          <StrivingText text={labels.get(pair.bId) ?? ''} />
        </p>
      </div>

      <h2 className="mt-10 text-base font-normal text-muted">{S.duels.question}</h2>

      <div className="mt-4 grid gap-2">
        {S.duels.options.map((o) => {
          const selected = current?.effect === o.effect;
          const tone = o.effect < 0
            ? 'hover:border-fault/60 hover:bg-fault/10'
            : o.effect > 0
              ? 'hover:border-facil/70 hover:bg-facil/10'
              : 'hover:border-instrument-dim hover:bg-surface';
          return (
            <button
              key={o.effect}
              type="button"
              aria-pressed={selected}
              onClick={() => choose(o.effect as Effect)}
              className={`flex items-center gap-3 rounded-md border px-4 py-3.5 text-left transition-colors ${
                selected ? 'border-instrument bg-instrument/12' : `border-hairline ${tone}`
              }`}
            >
              <kbd className="numeral rounded border border-hairline px-1.5 py-0.5 text-xs text-muted">
                {o.key}
              </kbd>
              {o.glyph ? <span aria-hidden="true">{o.glyph}</span> : null}
              <span className="flex-1">{o.label}</span>
              <span className="numeral text-sm text-muted">
                {o.effect > 0 ? `+${o.effect}` : o.effect}
              </span>
            </button>
          );
        })}
      </div>

      <p className="hint">{S.duels.keyboardHint}</p>

      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          className="btn-ghost"
          disabled={index === 0}
          onClick={() => { const back = Math.max(0, index - 1); indexRef.current = back; setIndex(back); }}
        >
          {S.duels.back}
        </button>
        <span className="text-xs text-muted">{S.duels.changed}</span>
      </div>
    </WizardFrame>
  );
}
