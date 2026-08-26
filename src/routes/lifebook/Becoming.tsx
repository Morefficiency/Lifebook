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
      title="Who you would have to be"
      lead="Not a better mood or a nicer opinion of yourself — a way of behaving. Each of these is the person for whom your vision is simply normal. Change any of them into your own words; the sentence has to be one you would actually say."
    >
      <ul className="space-y-4">
        {drafts.map((d) => {
          const current = stored.get(d.replacesBeliefId);
          const value = current?.text ?? d.text;
          return (
            <li key={d.replacesBeliefId} className="rounded-lg border border-hairline bg-surface/50 p-5">
              <p className="text-xs uppercase tracking-[0.14em] text-fault-bright">Instead of</p>
              <p className="mt-1.5 leading-relaxed text-muted line-through decoration-fault/60">
                “{d.belief.text}”
              </p>

              <p className="mt-5 text-xs uppercase tracking-[0.14em] text-facil-bright">Become</p>
              <label className="sr-only" htmlFor={`identity-${d.replacesBeliefId}`}>
                The identity that replaces it
              </label>
              <textarea
                id={`identity-${d.replacesBeliefId}`}
                className="field mt-1.5 min-h-[4.5rem] resize-y text-lg"
                value={value}
                placeholder="I am someone who…"
                onChange={(e) => lifebook.setIdentity({
                  replacesBeliefId: d.replacesBeliefId,
                  text: e.target.value,
                  areas: d.areas,
                  edited: e.target.value !== d.text,
                })}
              />

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {d.areas.map((a) => <Tag key={a}>{AREA_BY_ID.get(a)?.name ?? a}</Tag>)}
                {current?.edited ? <Tag tone="facil">your words</Tag> : null}
                {d.why ? (
                  <Explain label="Why this one?">
                    <div className="space-y-2">
                      <p>{d.why}</p>
                      <p className="text-muted">
                        Notice it describes something you do, not something you are.
                        A claim about conduct can be settled this week; a claim about
                        character cannot be settled at all.
                      </p>
                    </div>
                  </Explain>
                ) : null}
                {!d.text ? (
                  <span className="text-xs text-muted">
                    You wrote this belief yourself, so this one is yours to answer.
                  </span>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      {drafts.length === 0 ? (
        <p className="text-muted">Confirm a belief in the previous stage and it appears here.</p>
      ) : null}

      <StageFooter>
        <button
          type="button"
          className="btn-primary"
          disabled={answered.length === 0}
          onClick={() => { lifebook.completeStage('becoming'); navigate('/blueprint'); }}
        >
          Build the programme
        </button>
        {answered.length < drafts.length ? (
          <span className="text-sm text-muted">
            {drafts.length - answered.length} still blank — you can leave them and come back.
          </span>
        ) : null}
      </StageFooter>
    </StageFrame>
  );
}
