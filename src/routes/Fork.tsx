/**
 * §6 — The Fork.
 *
 * Three doors, equal visual weight. Release is a win with its own celebration,
 * never framed as giving up; Carry is a named, chosen tension, never a failure
 * to resolve. Every decision requires the ≥20-character note — writing it is
 * the intervention, so the note gates the button rather than decorating it.
 */
import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { S } from '../strings';
import { useStore } from '../store/useStore';
import { useGraph, useStrivingLookup } from '../store/selectors';
import { canonicalEdge, edgeKey } from '../engine/graph';
import type { ForkChoice } from '../types';
import { CharCount, FieldError, StrivingText, Tag } from '../components/ui';

const NOTE_MIN = 20;

export default function ForkRoute() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const graph = useGraph();
  const labels = useStrivingLookup();
  const recordFork = useStore((s) => s.recordFork);
  const releaseStriving = useStore((s) => s.releaseStriving);

  const edge = useMemo(() => {
    const a = params.get('a');
    const b = params.get('b');
    if (!a || !b) return null;
    return canonicalEdge(a, b);
  }, [params]);

  const metric = edge
    ? graph.edges.find((e) => edgeKey(e.aId, e.bId) === edgeKey(edge.aId, edge.bId))
    : undefined;

  const [choice, setChoice] = useState<ForkChoice | null>(null);
  const [note, setNote] = useState('');
  const [target, setTarget] = useState<string | null>(null);
  const [mode, setMode] = useState<'retire' | 'revise'>('retire');
  const [newText, setNewText] = useState('');
  const [touched, setTouched] = useState(false);
  const [celebrating, setCelebrating] = useState<'release' | 'carry' | null>(null);

  if (!edge) {
    return (
      <div className="mx-auto w-full max-w-2xl">
        <p className="text-muted">{S.common.notFound}</p>
        <Link to="/map" className="btn-ghost mt-4">{S.common.toMap}</Link>
      </div>
    );
  }

  const aText = labels.get(edge.aId) ?? '';
  const bText = labels.get(edge.bId) ?? '';
  const noteOk = note.trim().length >= NOTE_MIN;

  if (celebrating) return <Celebration kind={celebrating} />;

  const submit = () => {
    setTouched(true);
    if (!choice || !noteOk) return;

    if (choice === 'challenge') {
      recordFork(edge, 'challenge', note);
      navigate(`/forge?a=${encodeURIComponent(edge.aId)}&b=${encodeURIComponent(edge.bId)}`);
      return;
    }

    if (choice === 'release') {
      if (!target) return;
      if (mode === 'revise' && newText.trim().length === 0) return;
      releaseStriving({
        edge, strivingId: target, mode,
        ...(mode === 'revise' ? { newText } : {}),
        note,
      });
      setCelebrating('release');
      return;
    }

    recordFork(edge, 'carry', note);
    setCelebrating('carry');
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      <h1 className="text-2xl sm:text-3xl">{S.fork.title}</h1>
      <p className="mt-3 text-muted">{S.fork.lead}</p>

      <div className="card mt-8">
        <div className="flex flex-wrap items-center gap-2">
          {metric ? <Tag tone="fault">{S.bits.heatOf(metric.heat)}</Tag> : null}
          {metric?.carried ? <Tag tone="carry">{S.bits.alreadyCarried}</Tag> : null}
        </div>
        <p className="mt-3 leading-snug"><StrivingText text={aText} /></p>
        <p className="my-1.5 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-fault-bright">{S.bits.against}</p>
        <p className="leading-snug"><StrivingText text={bText} /></p>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <Door
          on={choice === 'challenge'}
          onClick={() => setChoice('challenge')}
          name={S.fork.challenge.name}
          blurb={S.fork.challenge.blurb}
          accent="border-instrument"
        />
        <Door
          on={choice === 'release'}
          onClick={() => setChoice('release')}
          name={S.fork.release.name}
          blurb={S.fork.release.blurb}
          accent="border-facil"
        />
        <Door
          on={choice === 'carry'}
          onClick={() => setChoice('carry')}
          name={S.fork.carry.name}
          blurb={S.fork.carry.blurb}
          accent="border-carry"
        />
      </div>

      {choice === 'challenge' ? (
        <p className="mt-6 max-w-measure rounded-md border border-instrument/40 bg-instrument/5 p-4 text-sm leading-relaxed">
          {S.fork.challenge.nudge}
        </p>
      ) : null}

      {choice === 'carry' ? (
        <p className="mt-6 max-w-measure rounded-md border border-carry/40 bg-carry/5 p-4 text-sm leading-relaxed">
          {S.fork.carry.body}
        </p>
      ) : null}

      {choice === 'release' ? (
        <section className="mt-6 rounded-md border border-facil/40 bg-facil/5 p-4">
          <fieldset>
            <legend className="label">{S.fork.release.pick}</legend>
            <div className="mt-3 space-y-2">
              {[{ id: edge.aId, text: aText }, { id: edge.bId, text: bText }].map((s) => (
                <label
                  key={s.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 ${
                    target === s.id ? 'border-facil bg-facil/10' : 'border-hairline'
                  }`}
                >
                  <input
                    type="radio"
                    name="release-target"
                    className="mt-1 accent-[#3E7C59]"
                    checked={target === s.id}
                    onChange={() => { setTarget(s.id); setNewText(s.text); }}
                  />
                  <span className="leading-snug"><StrivingText text={s.text} /></span>
                </label>
              ))}
            </div>
          </fieldset>

          {target ? (
            <div className="mt-5">
              <div className="flex gap-2">
                <button
                  type="button"
                  className={mode === 'retire' ? 'btn-primary' : 'btn-ghost'}
                  onClick={() => setMode('retire')}
                >
                  {S.fork.release.retire}
                </button>
                <button
                  type="button"
                  className={mode === 'revise' ? 'btn-primary' : 'btn-ghost'}
                  onClick={() => setMode('revise')}
                >
                  {S.fork.release.revise}
                </button>
              </div>

              {mode === 'revise' ? (
                <div className="mt-4">
                  <label htmlFor="revised" className="label">{S.fork.release.reviseLabel}</label>
                  <div className="mt-2 flex items-start gap-2">
                    <span className="mt-2.5 shrink-0 text-sm text-muted">{S.strivings.prefix}</span>
                    <input
                      id="revised"
                      className="field flex-1"
                      value={newText}
                      onChange={(e) => setNewText(e.target.value)}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </section>
      ) : null}

      {choice ? (
        <div className="mt-8">
          <label htmlFor="fork-note" className="label">{S.fork.noteLabel}</label>
          <textarea
            id="fork-note"
            className="field mt-2 min-h-[8rem] resize-y"
            value={note}
            placeholder={S.fork.notePlaceholder}
            onChange={(e) => setNote(e.target.value)}
            aria-describedby="fork-note-hint"
          />
          <div className="mt-1.5 flex items-start justify-between gap-4">
            <p id="fork-note-hint" className="max-w-measure text-sm leading-relaxed text-muted">
              {S.fork.noteHint(NOTE_MIN)}
            </p>
            <CharCount value={note} min={NOTE_MIN} />
          </div>
          {touched && !noteOk ? <FieldError>{S.fork.noteShort(NOTE_MIN)}</FieldError> : null}
          {touched && choice === 'release' && !target ? (
            <FieldError>{S.fork.release.pick}</FieldError>
          ) : null}

          <button type="button" className="btn-primary mt-6" onClick={submit}>
            {choice === 'challenge' ? S.fork.challenge.cta
              : choice === 'release' ? S.fork.release.cta
                : S.fork.carry.cta}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function Door({ on, onClick, name, blurb, accent }: {
  on: boolean; onClick: () => void; name: string; blurb: string; accent: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`h-full rounded-lg border p-5 text-left transition-colors ${
        on ? `${accent} bg-surface2` : 'border-hairline hover:border-instrument-dim hover:bg-surface'
      }`}
    >
      <h2 className="font-display text-lg">{name}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">{blurb}</p>
    </button>
  );
}

function Celebration({ kind }: { kind: 'release' | 'carry' }) {
  const release = kind === 'release';
  return (
    <div className="mx-auto w-full max-w-xl animate-fade-up py-12 text-center">
      <div
        aria-hidden="true"
        className={`mx-auto h-16 w-16 rounded-full border ${
          release ? 'border-facil bg-facil/15' : 'border-carry bg-carry/15'
        }`}
      />
      <h1 className="mt-8 text-3xl">
        {release ? S.fork.release.celebrate : S.fork.carry.celebrate}
      </h1>
      <p className="mx-auto mt-4 max-w-measure leading-relaxed text-bone">
        {release ? S.fork.release.celebrateBody : S.fork.carry.body}
      </p>
      <p className="mt-4 text-sm text-muted">{S.fork.release.ledgerNote}</p>
      <div className="mt-8 flex justify-center gap-3">
        <Link to="/map" className="btn-primary">{S.common.toMap}</Link>
        <Link to="/ledger" className="btn-ghost">{S.nav.ledger}</Link>
      </div>
    </div>
  );
}
