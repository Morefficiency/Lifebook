/**
 * Stage 5 — who he would have to be instead.
 *
 * Every target is stated as conduct, never as a trait. "I am confident" is an
 * assertion with nothing behind it and no way to settle it; "I am someone who
 * ships before it is perfect" describes an action, and an action can be taken
 * today. Everything is editable, and a belief he wrote himself gets a blank
 * box, because the app has no counterpart for a sentence it has never seen.
 */
import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AREA_BY_ID } from '../../content/areas';
import { BELIEF_CATALOGUE } from '../../content/beliefs';
import { proposeIdentities } from '../../engine/identity';
import { lifebook } from '../../store/lifebookStore';
import { S } from '../../strings';
import { useStore } from '../../store/useStore';
import { StageFooter, StageFrame } from '../../components/lifebook';
import { Explain, Tag } from '../../components/ui';

export default function Becoming() {
  const navigate = useNavigate();
  const lb = useStore((s) => s.state.lifebook);

  const drafts = useMemo(
    () => proposeIdentities(lb.beliefs, BELIEF_CATALOGUE),
    [lb.beliefs],
  );
  const stored = useMemo(
    () => new Map(lb.identities.map((i) => [i.replacesBeliefId, i])),
    [lb.identities],
  );

  // Seed each proposal once, so there is something concrete on screen to argue
  // with. An empty box invites an empty answer.
  useEffect(() => {
    for (const d of drafts) {
      if (!stored.has(d.replacesBeliefId) && d.text) {
        lifebook.setIdentity({
          replacesBeliefId: d.replacesBeliefId, text: d.text,
          areas: d.areas, edited: false,
        });
      }
    }
  }, [drafts, stored]);

  const answered = drafts.filter(
    (d) => (stored.get(d.replacesBeliefId)?.text ?? '').trim().length > 0,
  );

  return (
    <StageFrame
      stage="becoming"
      title={S.stages.becoming.title}
      lead={S.stages.becoming.lead}
    >
      <ul className="space-y-4">
        {drafts.map((d) => {
          const current = stored.get(d.replacesBeliefId);
          const value = current?.text ?? d.text;
          return (
            <li key={d.replacesBeliefId} className="rounded-lg border border-hairline bg-surface/50 p-5">
              <p className="text-xs uppercase tracking-[0.14em] text-fault-bright">{S.stages.becoming.insteadOf}</p>
              <p className="mt-1.5 leading-relaxed text-muted line-through decoration-fault/60">
                “{d.belief.text}”
              </p>

              <p className="mt-5 text-xs uppercase tracking-[0.14em] text-facil-bright">{S.stages.becoming.become}</p>
              <label className="sr-only" htmlFor={`identity-${d.replacesBeliefId}`}>
                {S.stages.becoming.srLabel}
              </label>
              <textarea
                id={`identity-${d.replacesBeliefId}`}
                className="field mt-1.5 min-h-[4.5rem] resize-y text-lg"
                value={value}
                placeholder={S.stages.becoming.placeholder}
                onChange={(e) => lifebook.setIdentity({
                  replacesBeliefId: d.replacesBeliefId,
                  text: e.target.value,
                  areas: d.areas,
                  edited: e.target.value !== d.text,
                })}
                onBlur={() => lifebook.commitIdentity(d.replacesBeliefId)}
              />

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {d.areas.map((a) => <Tag key={a}>{AREA_BY_ID.get(a)?.name ?? a}</Tag>)}
                {current?.edited ? <Tag tone="facil">{S.stages.becoming.yourWords}</Tag> : null}
                {d.why ? (
                  <Explain label={S.stages.becoming.whyThis}>
                    <div className="space-y-2">
                      <p>{d.why}</p>
<p className="text-muted">{S.stages.becoming.whyCaveat}</p>
                    </div>
                  </Explain>
                ) : null}
                {!d.text ? (
<span className="text-xs text-muted">{S.stages.becoming.ownBelief}</span>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      {drafts.length === 0 ? (
        <p className="text-muted">{S.stages.becoming.empty}</p>
      ) : null}

      <StageFooter>
        <button
          type="button"
          className="btn-primary"
          disabled={answered.length === 0}
          onClick={() => { lifebook.completeStage('becoming'); navigate('/blueprint'); }}
        >
          {S.stages.becoming.cta}
        </button>
        {answered.length < drafts.length ? (
          <span className="text-sm text-muted">
{S.stages.becoming.blanks(drafts.length - answered.length)}
          </span>
        ) : null}
      </StageFooter>
    </StageFrame>
  );
}
