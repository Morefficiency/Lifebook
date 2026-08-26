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
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PROBES } from '../../content/probes';
import { lifebook } from '../../store/lifebookStore';
import { S } from '../../strings';
import { useStore } from '../../store/useStore';
import { StageFooter, StageFrame, Tally } from '../../components/lifebook';

const KIND_LABEL = S.stages.reflect.kinds;

export default function Reflect() {
  const navigate = useNavigate();
  const answers = useStore((s) => s.state.lifebook.probes);
  const byId = useMemo(() => new Map(answers.map((a) => [a.probeId, a])), [answers]);

  const [index, setIndex] = useState(() => {
    const first = PROBES.findIndex((p) => !byId.has(p.id));
    return first >= 0 ? first : 0;
  });

  const probe = PROBES[Math.min(index, PROBES.length - 1)]!;
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

  const advance = () => {
    if (index + 1 < PROBES.length) setIndex(index + 1);
    else {
      lifebook.completeStage('reflect');
      navigate('/self-image');
    }
  };

  return (
    <StageFrame
      stage="reflect"
      title={S.stages.reflect.title}
      lead={S.stages.reflect.lead}
    >
      <Tally done={byId.size} total={PROBES.length} noun={S.stages.reflect.tally} />

      <div className="mt-6">
        <p className="text-xs uppercase tracking-[0.14em] text-instrument">
          {KIND_LABEL[probe.kind]} · {index + 1} of {PROBES.length}
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
            {index + 1 < PROBES.length ? 'Next' : 'Done'}
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
    </StageFrame>
  );
}
