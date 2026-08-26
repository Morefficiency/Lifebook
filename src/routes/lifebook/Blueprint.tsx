/**
 * Stage 6 — the programme.
 *
 * Three kinds of item, in ascending order of what they can actually do:
 *
 *   thought       the swap to make when the old belief speaks up
 *   behaviour     an action only the new identity would take — the evidence
 *   affirmation   the sentence, spoken alongside something concrete
 *
 * The affirmation is deliberately the smallest, and it cannot be logged bare:
 * every entry requires the instance it was said about. A sentence repeated with
 * nothing behind it does not move a self-image, and for someone who does not
 * believe it yet it tends to make things worse. Attached to a real instance from
 * that day it is a label for something that happened, which is a different act.
 */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AREA_BY_ID } from '../../content/areas';
import { BELIEF_CATALOGUE } from '../../content/beliefs';
import { buildProgramme, practiceProgress } from '../../engine/programme';
import { lifebook } from '../../store/lifebookStore';
import { S } from '../../strings';
import { useStore } from '../../store/useStore';
import { StageFrame } from '../../components/lifebook';
import { Tag } from '../../components/ui';
import type { Cadence, PracticeItem, PracticeKind } from '../../types';

const KIND_LABEL: Record<PracticeKind, string> = S.stages.blueprint.kinds;

const CADENCE_LABEL: Record<Cadence, string> = S.stages.blueprint.cadences;

const KIND_ORDER: PracticeKind[] = ['thought', 'behaviour', 'affirmation'];

export default function Blueprint() {
  const lb = useStore((s) => s.state.lifebook);

  const identities = useMemo(
    () => lb.identities.filter((i) => i.text.trim().length > 0),
    [lb.identities],
  );

  // Seed the programme from the catalogue once per identity, then leave it alone
  // — everything after that is his to edit, disable or delete.
  useEffect(() => {
    const seeded = new Set(lb.practices.map((p) => p.identityId));
    const drafts = buildProgramme(identities, lb.beliefs, BELIEF_CATALOGUE)
      .filter((d) => !seeded.has(d.identityId));
    for (const d of drafts) {
      lifebook.addPractice({
        identityId: d.identityId, kind: d.kind, text: d.text,
        ...(d.cue ? { cue: d.cue } : {}), cadence: d.cadence,
      });
    }
    if (drafts.length > 0) lifebook.completeStage('blueprint');
  }, [identities, lb.beliefs, lb.practices]);

  const progress = practiceProgress(lb.practices, lb.practiceLogs);

  return (
    <StageFrame
      stage="blueprint"
      title={S.stages.blueprint.title}
      lead={S.stages.blueprint.lead}
    >
      <div className="flex flex-wrap gap-3">
        <Stat label={S.stages.blueprint.identities} value={identities.length} />
        <Stat label={S.stages.blueprint.practices} value={progress.active} />
        <Stat label={S.stages.blueprint.instances} value={progress.logged} />
      </div>

      {identities.length === 0 ? (
        <p className="mt-8 text-muted">
          {S.stages.blueprint.emptyPre}<Link to="/becoming" className="text-instrument underline underline-offset-4">{S.stages.blueprint.emptyLink}</Link>{S.stages.blueprint.emptyPost}
        </p>
      ) : null}

      <div className="mt-8 space-y-8">
        {identities.map((identity) => {
          const belief = lb.beliefs.find((b) => b.id === identity.replacesBeliefId);
          const items = lb.practices.filter((p) => p.identityId === identity.id);

          return (
            <section key={identity.id} className="rounded-lg border border-hairline bg-surface/40 p-5">
              <h2 className="font-display text-xl leading-snug">{identity.text}</h2>
              {belief ? (
                <p className="mt-1.5 text-sm text-muted">
                  {S.stages.blueprint.inPlaceOf(belief.text)}
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {identity.areas.map((a) => <Tag key={a}>{AREA_BY_ID.get(a)?.name ?? a}</Tag>)}
              </div>

              <ul className="mt-6 space-y-3">
                {KIND_ORDER.flatMap((kind) => items.filter((i) => i.kind === kind)).map((item) => (
                  <PracticeRow
                    key={item.id}
                    item={item}
                    count={progress.byItem.get(item.id) ?? 0}
                    logs={lb.practiceLogs.filter((l) => l.itemId === item.id)}
                  />
                ))}
              </ul>

              <AddPractice identityId={identity.id} />
            </section>
          );
        })}
      </div>
    </StageFrame>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-hairline bg-surface/60 px-3.5 py-2.5">
      <div className="text-[0.68rem] uppercase tracking-[0.14em] text-muted">{label}</div>
      <div className="mt-1 numeral text-xl">{value}</div>
    </div>
  );
}

function PracticeRow({ item, count, logs }: {
  item: PracticeItem; count: number; logs: { id: string; evidence: string; ts: string }[];
}) {
  const [logging, setLogging] = useState(false);
  const [evidence, setEvidence] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const tone = item.kind === 'behaviour' ? 'facil' : item.kind === 'thought' ? 'carry' : 'neutral';

  return (
    <li className={`rounded-md border p-4 ${item.active ? 'border-hairline' : 'border-hairline opacity-50'}`}>
      <div className="flex flex-wrap items-center gap-2">
        <Tag tone={tone}>{KIND_LABEL[item.kind]}</Tag>
        <span className="text-xs text-muted">{CADENCE_LABEL[item.cadence]}</span>
        {count > 0 ? (
          <button
            type="button"
            className="numeral ml-auto text-xs text-instrument underline underline-offset-4"
            onClick={() => setShowHistory((v) => !v)}
          >
            {S.stages.blueprint.logged(count)}
          </button>
        ) : null}
      </div>

      {item.cue ? (
        <p className="mt-3 text-sm text-muted">
          <span className="text-carry-bright">{S.stages.blueprint.catch}</span> “{item.cue}”
        </p>
      ) : null}
      <p className="mt-1.5 leading-relaxed">
        {item.cue ? <span className="text-facil-bright">{S.stages.blueprint.sayInstead}</span> : null}
        {item.text}
      </p>

      {showHistory && logs.length > 0 ? (
        <ul className="mt-3 space-y-1.5 border-l border-hairline pl-3">
          {logs.slice().reverse().map((l) => (
            <li key={l.id} className="text-sm text-muted">
              <time className="numeral text-xs" dateTime={l.ts}>
                {new Date(l.ts).toLocaleDateString()}
              </time>{' — '}{l.evidence}
            </li>
          ))}
        </ul>
      ) : null}

      {logging ? (
        <div className="mt-4">
          <label htmlFor={`ev-${item.id}`} className="label">
            {item.kind === 'affirmation'
? S.stages.blueprint.evidenceAffirmation
              : S.stages.blueprint.evidenceOther}
          </label>
          <p className="hint">
            {item.kind === 'affirmation'
? S.stages.blueprint.evidenceHintAffirmation
              : S.stages.blueprint.evidenceHintOther}
          </p>
          <textarea
            id={`ev-${item.id}`}
            className="field mt-2 min-h-[4rem] resize-y"
            value={evidence}
            onChange={(e) => setEvidence(e.target.value)}
          />
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              className="btn-primary"
              disabled={evidence.trim().length < 8}
              onClick={() => {
                lifebook.logPractice(item.id, evidence);
                setEvidence(''); setLogging(false);
              }}
            >
              {S.stages.blueprint.logIt}
            </button>
            <button type="button" className="btn-quiet" onClick={() => setLogging(false)}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className="btn-ghost" onClick={() => setLogging(true)}>
            {S.stages.blueprint.logCta}
          </button>
          <button
            type="button"
            className="btn-quiet text-xs"
            onClick={() => lifebook.updatePractice(item.id, { active: !item.active })}
          >
{item.active ? S.stages.blueprint.setAside : S.stages.blueprint.bringBack}
          </button>
        </div>
      )}
    </li>
  );
}

function AddPractice({ identityId }: { identityId: string }) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<PracticeKind>('behaviour');
  const [text, setText] = useState('');
  const [cue, setCue] = useState('');
  const [cadence, setCadence] = useState<Cadence>('weekly');

  if (!open) {
    return (
      <button type="button" className="btn-quiet mt-4 px-0 text-sm" onClick={() => setOpen(true)}>
        {S.stages.blueprint.addOwn}
      </button>
    );
  }

  return (
    <div className="mt-4 rounded-md border border-instrument/40 bg-instrument/[0.04] p-4">
      <div className="flex flex-wrap gap-2">
        {KIND_ORDER.map((k) => (
          <button
            key={k}
            type="button"
            aria-pressed={kind === k}
            onClick={() => setKind(k)}
            className={`rounded border px-2.5 py-1.5 text-xs ${
              kind === k ? 'border-instrument bg-instrument/15 text-bone'
                : 'border-hairline text-muted hover:text-bone'
            }`}
          >
            {KIND_LABEL[k]}
          </button>
        ))}
      </div>

      {kind === 'thought' ? (
        <div className="mt-4">
          <label htmlFor={`cue-${identityId}`} className="label">{S.stages.blueprint.newCue}</label>
          <input
            id={`cue-${identityId}`}
            className="field mt-2"
            value={cue}
            placeholder={S.stages.blueprint.newCuePlaceholder}
            onChange={(e) => setCue(e.target.value)}
          />
        </div>
      ) : null}

      <div className="mt-4">
        <label htmlFor={`text-${identityId}`} className="label">
{kind === 'thought' ? S.stages.blueprint.newThought : kind === 'behaviour' ? S.stages.blueprint.newBehaviour : S.stages.blueprint.newAffirmation}
        </label>
        <input
          id={`text-${identityId}`}
          className="field mt-2"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {(Object.keys(CADENCE_LABEL) as Cadence[]).map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={cadence === c}
            onClick={() => setCadence(c)}
            className={`rounded border px-2.5 py-1.5 text-xs ${
              cadence === c ? 'border-instrument bg-instrument/15 text-bone'
                : 'border-hairline text-muted hover:text-bone'
            }`}
          >
            {CADENCE_LABEL[c]}
          </button>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          className="btn-primary"
          disabled={text.trim().length < 5}
          onClick={() => {
            lifebook.addPractice({
              identityId, kind, text, ...(cue ? { cue } : {}), cadence,
            });
            setText(''); setCue(''); setOpen(false);
          }}
        >
          {S.stages.blueprint.add}
        </button>
        <button type="button" className="btn-quiet" onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </div>
  );
}
