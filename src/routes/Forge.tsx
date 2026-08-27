/**
 * §7.1–7.3 — the Quest Forge.
 *
 * WOOP in fixed order, with the Obstacle as a hard gate: the form cannot submit
 * without it, because imagining only the good outcome measurably lowers
 * follow-through. Steps are implementation intentions, entered as two boxes and
 * rendered as one sentence. The forecast block is the clinical engine — an
 * observable feared outcome, a probability, and a dread rating, taken BEFORE
 * anything happens so the comparison afterwards is honest.
 */
import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { S } from '../strings';
import { useStore } from '../store/useStore';
import { useStrivingLookup } from '../store/selectors';
import { canonicalEdge } from '../engine/graph';
import { CharCount, FieldError, Slider, StrivingText } from '../components/ui';

const MAX_STEPS = 7;

interface StepDraft { ifCue: string; thenAction: string }

/**
 * A feared outcome has to be checkable by someone else. This does not judge
 * content — it only refuses an empty or one-word entry, and nudges away from
 * pure feeling-statements, which cannot be confirmed or disconfirmed.
 */
function fearedOutcomeProblem(text: string): string | null {
  const t = text.trim();
  if (t.length < 12) return S.forge.fearedOutcomeRequired;
  if (t.split(/\s+/).length < 4) return S.forge.fearedOutcomeRequired;
  if (/^(i|i'?ll|i will)?\s*(just )?(feel|felt|feels)\b/i.test(t)) return S.forge.fearedOutcomeRequired;
  return null;
}

export default function Forge() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const labels = useStrivingLookup();
  const createQuest = useStore((s) => s.createQuest);

  const edge = useMemo(() => {
    const a = params.get('a');
    const b = params.get('b');
    return a && b ? canonicalEdge(a, b) : null;
  }, [params]);

  // The other way in: a practice from the programme, testing the belief it was
  // written against. The map route arrives with an edge; this one arrives with
  // a belief, and everything after the first two fields is the same act.
  const lb = useStore((s) => s.state.lifebook);
  const fromProgramme = useMemo(() => {
    const beliefId = params.get('belief');
    if (!beliefId) return null;
    const held = lb.beliefs.find((b) => b.id === beliefId && b.status === 'confirmed');
    if (!held) return null;
    const practiceId = params.get('practice');
    const practice = practiceId ? lb.practices.find((p) => p.id === practiceId) : undefined;
    return { held, practice };
  }, [params, lb.beliefs, lb.practices]);

  const [wish, setWish] = useState(() => fromProgramme?.practice?.text ?? '');
  const [outcome, setOutcome] = useState('');
  const [obstacle, setObstacle] = useState('');
  const [belief, setBelief] = useState(() => fromProgramme?.held.text ?? '');
  const [steps, setSteps] = useState<StepDraft[]>([{ ifCue: '', thenAction: '' }]);
  const [fearedOutcomeText, setFearedOutcomeText] = useState('');
  const [forecastP, setForecastP] = useState(50);
  const [fearRating, setFearRating] = useState(5);
  const [touched, setTouched] = useState(false);

  const completeSteps = steps.filter((s) => s.ifCue.trim() && s.thenAction.trim());
  // Both entrances are challenge quests: one is testing a collision between
  // two goals, the other a belief the user has said is his. Either way the
  // hypothesis is the point and cannot be left blank.
  const beliefRequired = !!edge || !!fromProgramme;
  const fearedProblem = fearedOutcomeProblem(fearedOutcomeText);

  const problems = {
    wish: wish.trim().length === 0,
    outcome: outcome.trim().length === 0,
    obstacle: obstacle.trim().length === 0,
    belief: beliefRequired && belief.trim().length === 0,
    steps: completeSteps.length === 0,
    feared: fearedProblem !== null,
  };
  const valid = !Object.values(problems).some(Boolean);

  const submit = () => {
    setTouched(true);
    if (!valid) return;
    const id = createQuest({
      ...(edge ? { edge } : {}),
      ...(fromProgramme ? { beliefId: fromProgramme.held.id } : {}),
      ...(fromProgramme?.practice ? { practiceId: fromProgramme.practice.id } : {}),
      wish, outcome, obstacle,
      beliefHypothesis: belief,
      steps: completeSteps,
      fearRating,
      forecastP,
      fearedOutcomeText,
    });
    navigate(`/quest/${id}`);
  };

  const setStep = (i: number, patch: Partial<StepDraft>) => {
    setSteps((prev) => prev.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      <h1 className="text-2xl sm:text-3xl">{S.forge.title}</h1>
      <p className="mt-3 max-w-measure text-muted">{S.forge.lead}</p>

      {fromProgramme ? (
        <div className="mt-6 rounded-lg border border-hairline bg-surface/60 p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-muted">{S.forge.testingBelief}</p>
          <p className="mt-2 font-display text-lg leading-snug">“{fromProgramme.held.text}”</p>
          <p className="mt-2 text-sm text-muted">{S.forge.testingHow}</p>
        </div>
      ) : null}

      {edge ? (
        <div className="card mt-6">
          <p className="text-xs uppercase tracking-[0.14em] text-muted">{S.quest.fromEdge}</p>
          <p className="mt-2 leading-snug"><StrivingText text={labels.get(edge.aId) ?? ''} /></p>
          <p className="my-1 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-fault-bright">{S.bits.against}</p>
          <p className="leading-snug"><StrivingText text={labels.get(edge.bId) ?? ''} /></p>
        </div>
      ) : (
        <p className="mt-6 text-sm text-muted">{S.quest.freeQuest}</p>
      )}

      {/* WOOP, in fixed order */}
      <section className="mt-10 space-y-6">
        <Text
          id="wish" label={S.forge.wish} hint={S.forge.wishHint}
          value={wish} onChange={setWish}
          error={touched && problems.wish ? S.common.required : null}
        />
        <Text
          id="outcome" label={S.forge.outcome} hint={S.forge.outcomeHint}
          value={outcome} onChange={setOutcome}
          error={touched && problems.outcome ? S.common.required : null}
        />

        <div className="rounded-md border border-carry/40 bg-carry/5 p-4">
          <Text
            id="obstacle" label={S.forge.obstacle} hint={S.forge.obstacleHint}
            value={obstacle} onChange={setObstacle} multiline
            error={touched && problems.obstacle ? S.forge.obstacleRequired : null}
          />
        </div>

        {beliefRequired ? (
          <Text
            id="belief" label={S.forge.belief} hint={S.forge.beliefHint}
            value={belief} onChange={setBelief} multiline
            error={touched && problems.belief ? S.forge.beliefRequired : null}
          />
        ) : null}
      </section>

      {/* Plan — implementation intentions */}
      <section className="mt-10">
        <h2 className="label">{S.forge.stepsTitle}</h2>
        <p className="hint max-w-measure">{S.forge.stepsHint}</p>

        <ol className="mt-4 space-y-3">
          {steps.map((s, i) => (
            <li key={i} className="rounded-md border border-hairline bg-surface/50 p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <label htmlFor={`cue-${i}`} className="shrink-0 text-sm text-muted">{S.forge.ifCue}</label>
                <input
                  id={`cue-${i}`}
                  className="field flex-1"
                  value={s.ifCue}
                  placeholder={S.forge.ifPlaceholder}
                  onChange={(e) => setStep(i, { ifCue: e.target.value })}
                />
                <label htmlFor={`act-${i}`} className="shrink-0 text-sm text-muted">{S.forge.thenAction}</label>
                <input
                  id={`act-${i}`}
                  className="field flex-1"
                  value={s.thenAction}
                  placeholder={S.forge.thenPlaceholder}
                  onChange={(e) => setStep(i, { thenAction: e.target.value })}
                />
                {steps.length > 1 ? (
                  <button
                    type="button"
                    className="btn-quiet shrink-0 px-2 text-xs"
                    onClick={() => setSteps((prev) => prev.filter((_, j) => j !== i))}
                  >
                    {S.forge.removeStep}
                  </button>
                ) : null}
              </div>
              {s.ifCue.trim() && s.thenAction.trim() ? (
                <p className="mt-2 text-sm text-muted">
                  <span className="text-instrument">{S.forge.ifCue}</span> {s.ifCue.trim()},{' '}
                  <span className="text-instrument">{S.forge.thenAction}</span> {s.thenAction.trim()}.
                </p>
              ) : null}
            </li>
          ))}
        </ol>

        {steps.length < MAX_STEPS ? (
          <button
            type="button"
            className="btn-ghost mt-3"
            onClick={() => setSteps((prev) => [...prev, { ifCue: '', thenAction: '' }])}
          >
            {S.forge.addStep}
          </button>
        ) : null}
        {touched && problems.steps ? <FieldError>{S.forge.stepsRequired}</FieldError> : null}
      </section>

      {/* Forecast */}
      <section className="mt-12 rounded-lg border border-instrument/30 bg-instrument/[0.04] p-5">
        <h2 className="font-display text-xl">{S.forge.forecastTitle}</h2>
        <p className="mt-2 max-w-measure text-muted">{S.forge.forecastLead}</p>

        <div className="mt-6">
          <Text
            id="feared" label={S.forge.fearedOutcome} hint={S.forge.fearedOutcomeHint}
            value={fearedOutcomeText} onChange={setFearedOutcomeText} multiline
            error={touched && fearedProblem ? fearedProblem : null}
          />
        </div>

        <div className="mt-8">
          <label htmlFor="forecast" className="label">{S.forge.forecastP}</label>
          <p className="hint">{S.forge.forecastPHint}</p>
          <div className="mt-4">
            <Slider
              id="forecast" value={forecastP} min={0} max={100}
              onChange={setForecastP} lowLabel="0%" highLabel="100%"
              ariaLabel={S.forge.forecastP}
            />
          </div>
        </div>

        <div className="mt-8">
          <label htmlFor="fear" className="label">{S.forge.fearRating}</label>
          <div className="mt-4">
            <Slider
              id="fear" value={fearRating} min={0} max={10}
              onChange={setFearRating} lowLabel={S.forge.fearLow} highLabel={S.forge.fearHigh}
              ariaLabel={S.forge.fearRating}
            />
          </div>
        </div>
      </section>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <button type="button" className="btn-primary" onClick={submit}>{S.forge.create}</button>
        <Link to="/map" className="btn-quiet">{S.common.cancel}</Link>
      </div>
    </div>
  );
}

function Text({ id, label, hint, value, onChange, multiline = false, error, min }: {
  id: string; label: string; hint?: string; value: string;
  onChange: (v: string) => void; multiline?: boolean; error?: string | null; min?: number;
}) {
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      {hint ? <p className="hint max-w-measure">{hint}</p> : null}
      {multiline ? (
        <textarea
          id={id}
          className="field mt-2 min-h-[5.5rem] resize-y"
          value={value}
          aria-invalid={!!error}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          id={id}
          className="field mt-2"
          value={value}
          aria-invalid={!!error}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {min !== undefined ? (
        <div className="mt-1 text-right"><CharCount value={value} min={min} /></div>
      ) : null}
      {error ? <FieldError>{error}</FieldError> : null}
    </div>
  );
}
