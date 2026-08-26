/**
 * Act one, stage two — what you are actually trying to do.
 *
 * The short form. Five to seven goals, not eight to twelve, because six goals
 * is fifteen pairs and twelve is sixty-six — and sixty-six pairwise judgements
 * is a different product from the one a stranger will finish.
 *
 * Framed against the vision they wrote a minute ago, which does two things: it
 * makes the question concrete, and it quietly surfaces the gap between what
 * someone says they want and what they are actually spending their days on.
 * That gap is often the answer on its own.
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AREA_BY_ID } from '../../content/areas';
import { MAX_GOALS, MIN_GOALS } from '../../content/stages';
import { S, STRIVING_EXAMPLES } from '../../strings';
import { useStore } from '../../store/useStore';
import { StageFooter, StageFrame, Tally } from '../../components/lifebook';

export default function Goals() {
  const navigate = useNavigate();
  const all = useStore((s) => s.state.strivings);
  const visions = useStore((s) => s.state.lifebook.visions);
  const addStriving = useStore((s) => s.addStriving);
  const updateStriving = useStore((s) => s.updateStriving);
  const removeStriving = useStore((s) => s.removeStriving);

  const goals = useMemo(() => all.filter((g) => g.status === 'active'), [all]);
  const written = useMemo(
    () => visions.filter((v) => v.statement.trim().length > 0)
      .sort((a, b) => b.importance - a.importance),
    [visions],
  );

  const [draft, setDraft] = useState('');
  const atMax = goals.length >= MAX_GOALS;
  const enough = goals.length >= MIN_GOALS;

  const add = (text: string) => {
    const t = text.trim();
    if (!t || atMax) return;
    addStriving(t);
    setDraft('');
  };

  return (
    <StageFrame
      stage="goals"
      title={S.stages.goals.title}
      lead={S.stages.goals.lead}
    >
      {written.length > 0 ? (
        <section className="rounded-md border border-hairline bg-surface/40 p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-instrument">
            {S.stages.goals.youWant}
          </p>
          <ul className="mt-2.5 space-y-1.5">
            {written.slice(0, 4).map((v) => (
              <li key={v.area} className="text-sm leading-relaxed text-muted">
                <span className="text-bone">{AREA_BY_ID.get(v.area)?.name}</span>
                {' — '}{v.statement}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="mt-6 max-w-measure text-sm leading-relaxed text-muted">
        {S.stages.goals.nudge}
      </p>

      <ul className="mt-5 space-y-2">
        {goals.map((g) => (
          <li key={g.id} className="flex items-start gap-2 rounded-md border border-hairline bg-surface/60 p-3">
            <span className="mt-2.5 shrink-0 text-sm text-muted">{S.strivings.prefix}</span>
            <label className="sr-only" htmlFor={`goal-${g.id}`}>{S.a11y.strivingText}</label>
            <input
              id={`goal-${g.id}`}
              className="field flex-1 border-transparent bg-transparent px-1 py-2"
              value={g.text}
              onChange={(e) => updateStriving(g.id, { text: e.target.value })}
            />
            <button
              type="button"
              className="btn-quiet shrink-0 px-2 py-2 text-xs"
              onClick={() => removeStriving(g.id)}
            >
              {S.strivings.remove}
            </button>
          </li>
        ))}
      </ul>

      {!atMax ? (
        <div className="mt-5 rounded-md border border-hairline bg-surface/40 p-4">
          <label htmlFor="new-goal" className="label">{S.strivings.prefix}…</label>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input
              id="new-goal"
              className="field flex-1"
              value={draft}
              placeholder={S.stages.goals.placeholder}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(draft); } }}
            />
            <button type="button" className="btn-ghost" onClick={() => add(draft)} disabled={!draft.trim()}>
              {S.strivings.add}
            </button>
          </div>

          <p className="mt-4 text-xs text-muted">{S.stages.goals.examplesLabel}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {STRIVING_EXAMPLES.filter((ex) => !goals.some((g) => g.text === ex)).map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => add(ex)}
                className="rounded border border-hairline px-2.5 py-1.5 text-xs text-muted hover:border-instrument-dim hover:text-bone"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className="mt-5 max-w-measure text-sm text-muted">{S.stages.goals.atMax}</p>
      )}

      <div className="mt-6">
        <Tally done={goals.length} total={MAX_GOALS} noun={S.stages.goals.tally} />
        {!enough ? (
          <p className="mt-1 text-sm text-muted">
            {S.stages.goals.needMore(MIN_GOALS - goals.length)}
          </p>
        ) : (
          <p className="mt-1 numeral text-sm text-muted">
            {S.stages.goals.pairCount(pairsFor(goals.length))}
          </p>
        )}
      </div>

      <StageFooter>
        <button
          type="button"
          className="btn-primary"
          disabled={!enough}
          onClick={() => navigate('/pairs')}
        >
          {S.stages.goals.cta}
        </button>
      </StageFooter>
    </StageFrame>
  );
}

const pairsFor = (n: number): number => (n * (n - 1)) / 2;
