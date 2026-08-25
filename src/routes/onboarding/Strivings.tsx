/** §5 A2 — strivings elicitation (Emmons & King). */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { S, STRIVING_EXAMPLES } from '../../strings';
import { useStore } from '../../store/useStore';
import { MAX_STRIVINGS, MIN_STRIVINGS } from '../../store/progress';
import { LIFE_AREAS, type LifeArea } from '../../types';
import { WizardFrame } from './Wizard';

export default function Strivings() {
  const navigate = useNavigate();
  // Select the stable array and derive: a selector that builds a new array on
  // every call would make useSyncExternalStore re-render forever.
  const all = useStore((s) => s.state.strivings);
  const strivings = useMemo(() => all.filter((x) => x.status === 'active'), [all]);
  const addStriving = useStore((s) => s.addStriving);
  const updateStriving = useStore((s) => s.updateStriving);
  const removeStriving = useStore((s) => s.removeStriving);

  const [draft, setDraft] = useState('');
  const [area, setArea] = useState<LifeArea | ''>('');

  const atMax = strivings.length >= MAX_STRIVINGS;
  const enough = strivings.length >= MIN_STRIVINGS;

  const add = () => {
    const text = draft.trim();
    if (!text || atMax) return;
    addStriving(text, area === '' ? undefined : area);
    setDraft('');
    setArea('');
  };

  return (
    <WizardFrame step="strivings" title={S.strivings.title} lead={S.strivings.lead}>
      <ul className="space-y-2">
        {strivings.map((st) => (
          <li key={st.id} className="flex items-start gap-2 rounded-md border border-hairline bg-surface/60 p-3">
            <span className="mt-2.5 shrink-0 text-sm text-muted">{S.strivings.prefix}</span>
            <label className="sr-only" htmlFor={`st-${st.id}`}>Striving text</label>
            <input
              id={`st-${st.id}`}
              className="field flex-1 border-transparent bg-transparent px-1 py-2"
              value={st.text}
              onChange={(e) => updateStriving(st.id, { text: e.target.value })}
            />
            <button
              type="button"
              className="btn-quiet shrink-0 px-2 py-2 text-xs"
              onClick={() => removeStriving(st.id)}
            >
              {S.strivings.remove}
            </button>
          </li>
        ))}
      </ul>

      {!atMax ? (
        <div className="mt-6 rounded-md border border-hairline bg-surface/40 p-4">
          <label htmlFor="new-striving" className="label">
            {S.strivings.prefix}…
          </label>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input
              id="new-striving"
              className="field flex-1"
              value={draft}
              placeholder={S.strivings.placeholder}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
            />
            <label className="sr-only" htmlFor="new-area">{S.strivings.areaLabel}</label>
            <select
              id="new-area"
              className="field sm:w-44"
              value={area}
              onChange={(e) => setArea(e.target.value as LifeArea | '')}
            >
              <option value="">{S.strivings.areaNone}</option>
              {LIFE_AREAS.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
            <button type="button" className="btn-ghost sm:w-auto" onClick={add} disabled={!draft.trim()}>
              {S.strivings.add}
            </button>
          </div>

          <div className="mt-4">
            <p className="text-xs text-muted">{S.strivings.examplesLabel}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {STRIVING_EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => setDraft(ex)}
                  className="rounded border border-hairline px-2.5 py-1.5 text-xs text-muted hover:border-instrument-dim hover:text-bone"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <p className="mt-6 text-sm text-muted">{S.strivings.atMax}</p>
      )}

      <p className="mt-6 numeral text-sm text-muted" aria-live="polite">
        {S.strivings.count(strivings.length, MIN_STRIVINGS, MAX_STRIVINGS)}
      </p>
      {!enough ? (
        <p className="mt-1 text-sm text-muted">{S.strivings.tooFew(strivings.length, MIN_STRIVINGS)}</p>
      ) : null}
      <p className="hint max-w-measure">{S.strivings.whyMax}</p>

      <button
        type="button"
        className="btn-primary mt-8"
        disabled={!enough}
        onClick={() => navigate('/onboarding/duels')}
      >
        {S.strivings.next}
      </button>
    </WizardFrame>
  );
}
