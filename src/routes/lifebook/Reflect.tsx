/**
 * Stage 3 — the probes.
 *
 * Nobody can answer "what do you believe about yourself" usefully — that is the
 * whole nature of a self-image. So none of these ask it. They ask what he does,
 * what he was rewarded for, and what the people around him expect. Stage 4 does
 * the joining up, and even then only as a question.
 *
 * Every probe is skippable, and a skipped probe contributes nothing rather than
 * being read as a "no".
 *
 * The stage asks a first pass rather than the whole bank. The bank is sized to
 * cover a catalogue; a person is not obliged to exhaust it, and a stage that
 * walks thirty-three questions is a form. src/engine/probeSelection.ts orders
 * the bank so the first pass touches as much of the catalogue as possible, and
 * the rest is offered afterwards as a choice — never as a remaining step.
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PROBES } from '../../content/probes';
import { REFLECT_CORE_PROBES, coreProbes, orderProbesByCoverage } from '../../engine/probeSelection';
import { lifebook } from '../../store/lifebookStore';
import { S } from '../../strings';
import { useStore } from '../../store/useStore';
import { StageFooter, StageFrame, Tally } from '../../components/lifebook';

const KIND_LABEL = S.stages.reflect.kinds;

export default function Reflect() {
  const navigate = useNavigate();
  const answers = useStore((s) => s.state.lifebook.probes);
  const byId = useMemo(() => new Map(answers.map((a) => [a.probeId, a])), [answers]);

  // Everything past the first pass is opt-in, so somebody who chose to keep
  // going stays kept-going across a reload: more answers than the core round
  // holds can only mean they asked for the rest.
  const [wantsAll, setWantsAll] = useState(() => answers.length > REFLECT_CORE_PROBES);
  const queue = useMemo(
    () => (wantsAll ? orderProbesByCoverage(PROBES) : coreProbes(PROBES)),
    [wantsAll],
  );

  const [index, setIndex] = useState(() => {
    const first = coreProbes(PROBES).findIndex((p) => !byId.has(p.id));
    return first >= 0 ? first : 0;
  });
  const [atEndOfCore, setAtEndOfCore] = useState(false);

  const probe = queue[Math.min(index, queue.length - 1)]!;
  const answer = byId.get(probe.id);
  const selected = answer?.optionIds ?? [];

  const choose = (optionId: string) => {
    if (probe.multi) {
      const next = selected.includes(optionId)
        ? selected.filter((o) => o !== optionId)
        : [...selected, optionId];
      lifebook.answerProbe(probe.id, next);
      return;
    }
    lifebook.answerProbe(probe.id, [optionId]);
    advance();
  };

  const finish = () => {
    lifebook.completeStage('reflect');
    navigate('/self-image');
  };

  const advance = () => {
    if (index + 1 < queue.length) { setIndex(index + 1); return; }
    // End of the first pass with more available: a choice, not a wall.
    if (!wantsAll && queue.length < PROBES.length) { setAtEndOfCore(true); return; }
    finish();
  };

  return (
    <StageFrame
      stage="reflect"
      title={S.stages.reflect.title}
      lead={S.stages.reflect.lead}
    >
      {atEndOfCore ? (
        <div className="mt-6 max-w-measure">
          <h2 className="text-xl leading-snug sm:text-2xl">{S.stages.reflect.enoughTitle}</h2>
          <p className="mt-3 prose-quiet">{S.stages.reflect.enoughBody}</p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button type="button" className="btn-primary" onClick={finish}>
              {S.stages.reflect.enoughGo}
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => { setWantsAll(true); setAtEndOfCore(false); setIndex(queue.length); }}
            >
              {S.stages.reflect.enoughMore(PROBES.length - queue.length)}
            </button>
          </div>
        </div>
      ) : (
      <>
      <Tally done={byId.size} total={queue.length} noun={S.stages.reflect.tally} />

      <div className="mt-6">
        <p className="text-xs uppercase tracking-[0.14em] text-instrument">
          {KIND_LABEL[probe.kind]} · {index + 1} of {queue.length}
        </p>
        <h2 className="mt-3 text-xl leading-snug sm:text-2xl">{probe.question}</h2>
        {probe.help ? <p className="mt-2 max-w-measure text-sm text-muted">{probe.help}</p> : null}
        {probe.multi ? (
          <p className="mt-2 text-xs text-muted">{S.stages.reflect.multi}</p>
        ) : null}
      </div>

      <div className="mt-6 grid gap-2">
        {probe.options.map((option) => {
          const on = selected.includes(option.id);
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={on}
              onClick={() => choose(option.id)}
              className={`rounded-md border px-4 py-3.5 text-left leading-relaxed transition-colors ${
                on ? 'border-instrument bg-instrument/12'
                  : 'border-hairline hover:border-instrument-dim hover:bg-surface'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <StageFooter>
        <button
          type="button"
          className="btn-ghost"
          disabled={index === 0}
          onClick={() => setIndex(index - 1)}
        >
          Back
        </button>
        {probe.multi ? (
          <button type="button" className="btn-primary" onClick={advance}>
            {index + 1 < queue.length ? 'Next' : 'Done'}
          </button>
        ) : null}
        <button
          type="button"
          className="btn-quiet"
          onClick={() => { lifebook.skipProbe(probe.id); advance(); }}
        >
          {S.stages.reflect.skipOne}
        </button>
        <button
          type="button"
          className="btn-quiet ml-auto"
          onClick={() => { lifebook.completeStage('reflect'); navigate('/self-image'); }}
        >
          {S.stages.reflect.enough}
        </button>
      </StageFooter>
      </>
      )}
    </StageFrame>
  );
}
