/**
 * §7.4 / §7.5 — acting on a quest, then filing the field report.
 *
 * The report asks one question first, because that answer is the only scoring
 * input. If the prediction breaks, the app's largest moment fires: forecast
 * versus reality, the belief struck through, the fault line visibly cooled.
 */
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { S } from '../strings';
import { useStore } from '../store/useStore';
import { useStrivingLookup } from '../store/selectors';
import { CharCount, FieldError, StrivingText, Tag } from '../components/ui';
import type { ReportResult } from '../store/useStore';
import type { Quest } from '../types';

const WHAT_MIN = 30;

export default function QuestDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const quest = useStore((s) => s.state.quests.find((q) => q.id === id));
  const report = useStore((s) => s.state.reports.find((r) => r.questId === id));
  const toggleStep = useStore((s) => s.toggleStep);
  const abandonQuest = useStore((s) => s.abandonQuest);
  const fileReport = useStore((s) => s.fileReport);
  const labels = useStrivingLookup();

  const [filing, setFiling] = useState(false);
  const [occurred, setOccurred] = useState<boolean | null>(null);
  const [whatHappened, setWhatHappened] = useState('');
  const [learning, setLearning] = useState('');
  const [touched, setTouched] = useState(false);
  const [result, setResult] = useState<ReportResult | null>(null);
  const [confirmAbandon, setConfirmAbandon] = useState(false);

  if (!quest) {
    return (
      <div>
        <p className="text-muted">{S.common.notFound}</p>
        <Link to="/quests" className="btn-ghost mt-4">{S.nav.quests}</Link>
      </div>
    );
  }

  if (result?.broken) {
    return <PredictionBroken quest={quest} result={result} />;
  }

  const doneCount = quest.steps.filter((s) => s.done).length;
  const whatOk = whatHappened.trim().length >= WHAT_MIN;
  const learningOk = occurred !== true || learning.trim().length > 0;

  const submitReport = () => {
    setTouched(true);
    if (occurred === null || !whatOk || !learningOk) return;
    const res = fileReport(quest.id, {
      fearedOutcomeOccurred: occurred,
      whatHappened,
      learning,
    });
    if (!res) return;
    setResult(res);
    if (!res.broken) navigate('/map');
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="flex flex-wrap items-center gap-2">
        <Tag>{quest.status === 'active' ? S.quest.active
          : quest.status === 'reported' ? S.quest.reported : S.quest.abandoned}</Tag>
        {quest.edge ? <Tag tone="fault">from a fault line</Tag> : null}
      </div>

      <h1 className="mt-4 text-2xl sm:text-3xl">{quest.wish}</h1>

      <dl className="mt-8 space-y-5">
        <Row term={S.forge.outcome} desc={quest.outcome} />
        <Row term={S.forge.obstacle} desc={quest.obstacle} tone="carry" />
        {quest.beliefHypothesis ? (
          <Row term={S.forge.belief} desc={quest.beliefHypothesis} tone="instrument" />
        ) : null}
        <Row term={S.forge.fearedOutcome} desc={quest.fearedOutcomeText} />
      </dl>

      <div className="mt-6 flex flex-wrap gap-3">
        <Tag>{S.quest.forecastLine(quest.forecastP)}</Tag>
        <Tag>{S.quest.fearLine(quest.fearRating)}</Tag>
      </div>

      {quest.edge ? (
        <div className="card mt-6">
          <p className="text-xs uppercase tracking-[0.14em] text-muted">{S.quest.fromEdge}</p>
          <p className="mt-2 text-sm leading-snug">
            <StrivingText text={labels.get(quest.edge.aId) ?? ''} />
            <span className="text-fault-bright"> against </span>
            <StrivingText text={labels.get(quest.edge.bId) ?? ''} />
          </p>
        </div>
      ) : null}

      <section className="mt-10">
        <h2 className="text-sm uppercase tracking-[0.14em] text-muted">{S.forge.stepsTitle}</h2>
        {quest.steps.length === 0 ? (
          <p className="mt-3 text-sm text-muted">{S.quest.noSteps}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {quest.steps.map((s) => (
              <li key={s.id}>
                <label className="flex cursor-pointer items-start gap-3 rounded-md border border-hairline p-3.5 hover:border-instrument-dim">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 accent-[#7BA3C4]"
                    checked={s.done}
                    disabled={quest.status !== 'active'}
                    onChange={() => toggleStep(quest.id, s.id)}
                  />
                  <span className={`leading-relaxed ${s.done ? 'text-muted line-through' : ''}`}>
                    <span className="text-instrument">If/When</span> {s.ifCue},{' '}
                    <span className="text-instrument">then I will</span> {s.thenAction}.
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 numeral text-xs text-muted">
          {S.quest.stepsDone(doneCount, quest.steps.length)}
        </p>
      </section>

      {report ? (
        <section className="card mt-10">
          <h2 className="text-sm uppercase tracking-[0.14em] text-muted">{S.reportForm.title}</h2>
          <p className="mt-3">
            {report.fearedOutcomeOccurred ? S.reportForm.yes : S.reportForm.no}
          </p>
          <p className="mt-3 leading-relaxed text-muted">{report.whatHappened}</p>
          {report.learning ? (
            <p className="mt-3 leading-relaxed text-muted">{report.learning}</p>
          ) : null}
        </section>
      ) : quest.status === 'active' ? (
        <section className="mt-10">
          {!filing ? (
            <div className="flex flex-wrap gap-3">
              <button type="button" className="btn-primary" onClick={() => setFiling(true)}>
                {S.quest.fileReport}
              </button>
              {!confirmAbandon ? (
                <button type="button" className="btn-quiet" onClick={() => setConfirmAbandon(true)}>
                  {S.quest.abandon}
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted">{S.quest.abandonBody}</span>
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => { abandonQuest(quest.id); navigate('/quests'); }}
                  >
                    {S.quest.abandonConfirm}
                  </button>
                  <button type="button" className="btn-quiet" onClick={() => setConfirmAbandon(false)}>
                    {S.common.cancel}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-instrument/30 bg-instrument/[0.04] p-5">
              <h2 className="font-display text-xl">{S.reportForm.title}</h2>

              <p className="mt-4 text-sm text-muted">{S.reportForm.fearedWas}</p>
              <p className="mt-1 leading-relaxed">{quest.fearedOutcomeText}</p>

              <fieldset className="mt-6">
                <legend className="label">{S.reportForm.q1}</legend>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    aria-pressed={occurred === true}
                    onClick={() => setOccurred(true)}
                    className={`rounded-md border px-4 py-3 ${
                      occurred === true ? 'border-fault bg-fault/10' : 'border-hairline hover:border-fault/50'
                    }`}
                  >
                    {S.reportForm.yes}
                  </button>
                  <button
                    type="button"
                    aria-pressed={occurred === false}
                    onClick={() => setOccurred(false)}
                    className={`rounded-md border px-4 py-3 ${
                      occurred === false ? 'border-facil bg-facil/10' : 'border-hairline hover:border-facil/50'
                    }`}
                  >
                    {S.reportForm.no}
                  </button>
                </div>
              </fieldset>

              {occurred !== null ? (
                <>
                  <div className="mt-6">
                    <label htmlFor="what" className="label">{S.reportForm.whatHappened}</label>
                    <textarea
                      id="what"
                      className="field mt-2 min-h-[7rem] resize-y"
                      value={whatHappened}
                      onChange={(e) => setWhatHappened(e.target.value)}
                    />
                    <div className="mt-1.5 flex items-start justify-between gap-4">
                      <p className="max-w-measure text-sm text-muted">
                        {S.reportForm.whatHappenedHint(WHAT_MIN)}
                      </p>
                      <CharCount value={whatHappened} min={WHAT_MIN} />
                    </div>
                    {touched && !whatOk ? (
                      <FieldError>{S.reportForm.whatHappenedHint(WHAT_MIN)}</FieldError>
                    ) : null}
                  </div>

                  {occurred ? (
                    <div className="mt-6">
                      <label htmlFor="learning" className="label">{S.reportForm.learning}</label>
                      <p className="hint max-w-measure">{S.reportForm.learningHint}</p>
                      <textarea
                        id="learning"
                        className="field mt-2 min-h-[6rem] resize-y"
                        value={learning}
                        onChange={(e) => setLearning(e.target.value)}
                      />
                      {touched && !learningOk ? (
                        <FieldError>{S.reportForm.learningRequired}</FieldError>
                      ) : null}
                    </div>
                  ) : null}

                  <p className="mt-6 max-w-measure text-sm leading-relaxed text-muted">
                    {S.reportForm.luckNote}
                  </p>

                  <button type="button" className="btn-primary mt-4" onClick={submitReport}>
                    {S.reportForm.submit}
                  </button>
                </>
              ) : null}
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}

function Row({ term, desc, tone = 'neutral' }: {
  term: string; desc: string; tone?: 'neutral' | 'carry' | 'instrument';
}) {
  const colour = tone === 'carry' ? 'text-carry-bright'
    : tone === 'instrument' ? 'text-instrument' : 'text-muted';
  return (
    <div>
      <dt className={`text-xs uppercase tracking-[0.14em] ${colour}`}>{term}</dt>
      <dd className="mt-1.5 leading-relaxed">{desc}</dd>
    </div>
  );
}

function PredictionBroken({ quest, result }: { quest: Quest; result: ReportResult }) {
  const navigate = useNavigate();
  const labels = useStrivingLookup();
  const edgeLabel = quest.edge
    ? `${labels.get(quest.edge.aId) ?? ''} / ${labels.get(quest.edge.bId) ?? ''}`
    : null;

  return (
    <div className="mx-auto w-full max-w-2xl animate-fade-up py-8 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-instrument">{S.broken.lead}</p>
      <h1 className="mt-5 font-display text-4xl leading-tight text-bone sm:text-5xl">
        {S.broken.title}
      </h1>

      <div className="mx-auto mt-10 grid max-w-md grid-cols-2 gap-3">
        <div className="rounded-md border border-hairline p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-muted">Your forecast</p>
          <p className="mt-2 numeral text-3xl text-fault-bright">{quest.forecastP}%</p>
        </div>
        <div className="rounded-md border border-facil/50 bg-facil/10 p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-muted">What happened</p>
          <p className="mt-2 text-lg text-facil-bright">{S.broken.reality}</p>
        </div>
      </div>

      {quest.beliefHypothesis ? (
        <section className="mt-10">
          <p className="text-xs uppercase tracking-[0.14em] text-muted">{S.broken.beliefWas}</p>
          <p className="mx-auto mt-3 max-w-measure text-lg leading-relaxed text-muted line-through decoration-fault decoration-2">
            {quest.beliefHypothesis}
          </p>
        </section>
      ) : null}

      <div className="mt-10 inline-flex flex-col items-center gap-2 rounded-lg border border-instrument/40 bg-instrument/[0.06] px-6 py-5">
        <p className="numeral text-2xl text-instrument">{S.broken.xp}</p>
        <p className="max-w-measure text-sm leading-relaxed text-muted">{S.broken.xpWhy}</p>
      </div>

      {edgeLabel ? <p className="mt-8 text-sm text-muted">{S.broken.cooled}</p> : null}

      {result.promptRerating && quest.edge ? (
        <div className="mx-auto mt-6 max-w-measure rounded-md border border-carry/40 bg-carry/5 p-4">
          <p className="text-sm leading-relaxed">{S.broken.rerate}</p>
          <button
            type="button"
            className="btn-ghost mt-3"
            onClick={() => navigate(
              `/rerate?a=${encodeURIComponent(quest.edge!.aId)}&b=${encodeURIComponent(quest.edge!.bId)}`,
            )}
          >
            {S.broken.rerateCta}
          </button>
        </div>
      ) : null}

      <div className="mt-10">
        <Link to="/map" className="btn-primary">{S.broken.close}</Link>
      </div>
    </div>
  );
}
