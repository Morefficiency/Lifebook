/** §5 A1 — values sort. Self-affirmation, run before any threatening feedback. */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { S, VALUE_CARDS } from '../../strings';
import { useStore } from '../../store/useStore';
import { WizardFrame } from './Wizard';

export default function Values() {
  const navigate = useNavigate();
  const existing = useStore((s) => s.state.values);
  const setValues = useStore((s) => s.setValues);

  const [chosen, setChosen] = useState<string[]>(existing?.chosen ?? []);
  const [reflection, setReflection] = useState(existing?.reflection ?? '');

  const toggle = (id: string) => {
    setChosen((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  const ready = chosen.length === 3 && reflection.trim().length > 0;

  const submit = () => {
    setValues(chosen, reflection);
    navigate('/onboarding/strivings');
  };

  return (
    <WizardFrame step="values" title={S.values.title} lead={S.values.lead}>
      <fieldset>
        <legend className="label">{S.values.pick}</legend>
        <p className="hint" aria-live="polite">{S.values.picked(chosen.length)}</p>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {VALUE_CARDS.map((v) => {
            const on = chosen.includes(v.id);
            const full = chosen.length >= 3 && !on;
            return (
              <button
                key={v.id}
                type="button"
                aria-pressed={on}
                disabled={full}
                onClick={() => toggle(v.id)}
                className={`rounded-md border px-3 py-4 text-sm transition-colors ${
                  on
                    ? 'border-instrument bg-instrument/12 text-bone'
                    : full
                      ? 'border-hairline text-muted/50'
                      : 'border-hairline text-bone hover:border-instrument-dim hover:bg-surface'
                }`}
              >
                {v.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-10">
        <label htmlFor="reflection" className="label">{S.values.reflectionLabel}</label>
        <textarea
          id="reflection"
          className="field mt-2 min-h-[8rem] resize-y"
          value={reflection}
          placeholder={S.values.reflectionPlaceholder}
          onChange={(e) => setReflection(e.target.value)}
        />
        <p className="hint">{S.values.reflectionHint}</p>
      </div>

      <button type="button" className="btn-primary mt-8" disabled={!ready} onClick={submit}>
        {S.values.next}
      </button>
    </WizardFrame>
  );
}
