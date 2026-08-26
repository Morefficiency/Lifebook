/**
 * Stage 4 — what he appears to believe about himself.
 *
 * The most important rule in the app lives on this screen: **nothing here is
 * asserted**. Each candidate is a question with three equal answers — yes, no,
 * and "not quite, here is the real version". Only what he confirms is ever held
 * as his, and every candidate shows exactly which of his own answers put it on
 * the list.
 *
 * A rejection takes the candidate out of the offering for good, but it is
 * listed underneath with a way back: a permanent consequence for a misclick is
 * a trap, not a principle.
 *
 * Writing his own belief asks one extra question — which of the known patterns
 * it resembles, if any. Saying so lets it inherit a counterpart identity and a
 * programme. Saying none is a real answer too: he then writes his own
 * counterpart and gets a generic scaffold, rather than an empty page.
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AREA_BY_ID, AREAS } from '../../content/areas';
import { BELIEF_CATALOGUE, RESEMBLANCE_OPTIONS } from '../../content/beliefs';
import { PROBES, PROBE_BY_ID } from '../../content/probes';
import { inferBeliefs } from '../../engine/beliefs';
import { tensionMap } from '../../engine/gap';
import { lifebook } from '../../store/lifebookStore';
import { useStore } from '../../store/useStore';
import { StageFooter, StageFrame } from '../../components/lifebook';
import { Explain, Tag } from '../../components/ui';
import type { LifeArea } from '../../types';

const OFFER_LIMIT = 6;

export default function SelfImage() {
  const navigate = useNavigate();
  const lb = useStore((s) => s.state.lifebook);

  const ruled = useMemo(
    () => new Set(lb.beliefs.flatMap((b) => (b.candidateId ? [b.candidateId] : []))),
    [lb.beliefs],
  );

  const offered = useMemo(() => inferBeliefs({
    answers: lb.probes,
    probes: PROBES,
    catalogue: BELIEF_CATALOGUE,
    tensions: tensionMap(lb.visions, lb.currents),
    excludeIds: [...ruled],
    limit: OFFER_LIMIT,
  }), [lb.probes, lb.visions, lb.currents, ruled]);

  const confirmed = lb.beliefs.filter((b) => b.status === 'confirmed');
  const rejected = lb.beliefs.filter((b) => b.status === 'rejected');

  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [ownText, setOwnText] = useState('');
  const [ownAreas, setOwnAreas] = useState<LifeArea[]>([]);
  const [ownResembles, setOwnResembles] = useState<string | null>(null);
  const [showOwn, setShowOwn] = useState(false);

  return (
    <StageFrame
      stage="self_image"
      title="What you appear to believe"
      lead="These are guesses, built from your own answers and nothing else. The app has no idea whether any of them are true — only you do. Say yes, say no, or rewrite it into the sentence that is actually yours. A no is set aside and not offered again, and you can put it back if you change your mind."
    >
      {offered.length === 0 && confirmed.length === 0 ? (
        <p className="text-muted">
          Nothing to offer yet — go back and answer a few of the reflection questions,
          and this fills in.
        </p>
      ) : null}

      {offered.length > 0 ? (
        <ul className="space-y-3">
          {offered.map((c) => (
            <li key={c.id} className="rounded-lg border border-hairline bg-surface/50 p-5">
              <p className="font-display text-lg leading-snug">“{c.candidate.text}”</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">{c.candidate.cost}</p>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {c.candidate.areas.map((a) => (
                  <Tag key={a}>{AREA_BY_ID.get(a)?.name ?? a}</Tag>
                ))}
              </div>

              <div className="mt-3">
                <Explain label="Why is this being asked?">
                  <div className="space-y-2">
                    <p>Because of what you answered here:</p>
                    <ul className="space-y-1.5">
                      {c.becauseProbes.map((r) => {
                        const probe = PROBE_BY_ID.get(r.probeId);
                        const option = probe?.options.find((o) => o.id === r.optionId);
                        return (
                          <li key={`${r.probeId}-${r.optionId}`}>
                            <span className="text-muted">{probe?.question}</span>
                            <br />
                            <span>→ “{option?.label}”</span>
                          </li>
                        );
                      })}
                    </ul>
                    {c.becauseAreas.length > 0 ? (
                      <p>
                        And because the gap is widest in{' '}
                        {c.becauseAreas.slice(0, 2).map((a) => AREA_BY_ID.get(a.area)?.name).join(' and ')}.
                      </p>
                    ) : null}
                    <p className="text-muted">
                      That is the whole basis for it. It is a pattern-match on your answers,
                      not a finding about you.
                    </p>
                  </div>
                </Explain>
              </div>

              {editing === c.id ? (
                <div className="mt-5">
                  <label htmlFor={`edit-${c.id}`} className="label">
                    Say it the way it actually sounds in your head
                  </label>
                  <textarea
                    id={`edit-${c.id}`}
                    className="field mt-2 min-h-[5rem] resize-y"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                  />
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      className="btn-primary"
                      disabled={draft.trim().length < 10}
                      onClick={() => {
                        lifebook.ruleOnCandidate({
                          candidateId: c.id, text: draft, areas: c.candidate.areas,
                          status: 'confirmed', edited: true,
                        });
                        setEditing(null);
                      }}
                    >
                      That is the one
                    </button>
                    <button type="button" className="btn-quiet" onClick={() => setEditing(null)}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn-ghost border-facil/50 text-facil-bright hover:bg-facil/10"
                    onClick={() => lifebook.ruleOnCandidate({
                      candidateId: c.id, text: c.candidate.text,
                      areas: c.candidate.areas, status: 'confirmed',
                    })}
                  >
                    Yes, that is mine
                  </button>
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => { setEditing(c.id); setDraft(c.candidate.text); }}
                  >
                    Nearly — let me rewrite it
                  </button>
                  <button
                    type="button"
                    className="btn-quiet"
                    onClick={() => lifebook.ruleOnCandidate({
                      candidateId: c.id, text: c.candidate.text,
                      areas: c.candidate.areas, status: 'rejected',
                    })}
                  >
                    No, not me
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : null}

      <section className="mt-8">
        {!showOwn ? (
          <button type="button" className="btn-ghost" onClick={() => setShowOwn(true)}>
            Add one it has not thought of
          </button>
        ) : (
          <div className="rounded-lg border border-instrument/40 bg-instrument/[0.04] p-5">
            <label htmlFor="own-belief" className="label">
              In your own words — a sentence you catch yourself living by
            </label>
            <p className="hint">Write it in the first person, the way it sounds inside.</p>
            <textarea
              id="own-belief"
              className="field mt-2 min-h-[5rem] resize-y"
              value={ownText}
              onChange={(e) => setOwnText(e.target.value)}
            />
            <div className="mt-6">
              <p className="label">Is it a version of one of these?</p>
              <p className="hint max-w-measure">
                Optional. If one of them is basically the same thing in different
                words, saying so means you inherit its counterpart and its
                programme instead of starting from nothing. If none fit, leave it —
                you will get a blank scaffold to fill in yourself.
              </p>
              <div className="mt-3 max-h-64 space-y-1.5 overflow-y-auto pr-1">
                {RESEMBLANCE_OPTIONS.map((o) => {
                  const on = ownResembles === o.id;
                  return (
                    <button
                      key={o.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setOwnResembles(on ? null : o.id)}
                      className={`w-full rounded border px-3 py-2 text-left text-sm leading-relaxed ${
                        on ? 'border-instrument bg-instrument/15 text-bone'
                          : 'border-hairline text-muted hover:border-instrument-dim hover:text-bone'
                      }`}
                    >
                      “{o.text}”
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                className="btn-quiet mt-2 px-0 text-xs"
                onClick={() => setOwnResembles(null)}
              >
                None of these — mine is its own thing
              </button>
            </div>

            <p className="label mt-6">Where does it show up?</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {AREAS.map((a) => {
                const on = ownAreas.includes(a.id);
                return (
                  <button
                    key={a.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setOwnAreas(on
                      ? ownAreas.filter((x) => x !== a.id)
                      : [...ownAreas, a.id])}
                    className={`rounded border px-2.5 py-1 text-xs ${
                      on ? 'border-instrument bg-instrument/15 text-bone'
                        : 'border-hairline text-muted hover:text-bone'
                    }`}
                  >
                    {a.name}
                  </button>
                );
              })}
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                className="btn-primary"
                disabled={ownText.trim().length < 10}
                onClick={() => {
                  lifebook.addOwnBelief(ownText, ownAreas, ownResembles ?? undefined);
                  setOwnText(''); setOwnAreas([]); setOwnResembles(null); setShowOwn(false);
                }}
              >
                Add it
              </button>
              <button type="button" className="btn-quiet" onClick={() => setShowOwn(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>

      {confirmed.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-sm uppercase tracking-[0.14em] text-muted">
            What you have said is yours
          </h2>
          <ul className="mt-3 space-y-2">
            {confirmed.map((b) => (
              <li key={b.id} className="flex items-start gap-3 rounded-md border border-facil/40 bg-facil/[0.06] p-4">
                <span className="flex-1 leading-relaxed">“{b.text}”</span>
                <button
                  type="button"
                  className="btn-quiet shrink-0 px-1 text-xs"
                  onClick={() => lifebook.removeBelief(b.id)}
                >
                  Undo
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {rejected.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-sm uppercase tracking-[0.14em] text-muted">
            Ruled out
          </h2>
          <p className="hint">
            These are not offered again. If one of them was a misclick, put it back.
          </p>
          <ul className="mt-3 space-y-1.5">
            {rejected.map((b) => (
              <li key={b.id} className="flex items-start gap-3 text-sm text-muted">
                <span className="flex-1 leading-relaxed line-through decoration-hairline">
                  “{b.text}”
                </span>
                <button
                  type="button"
                  className="btn-quiet shrink-0 px-1 text-xs"
                  onClick={() => b.candidateId && lifebook.unrejectCandidate(b.candidateId)}
                >
                  Put it back
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <StageFooter>
        <button
          type="button"
          className="btn-primary"
          disabled={confirmed.length === 0}
          onClick={() => { lifebook.completeStage('self_image'); navigate('/becoming'); }}
        >
          Who would I have to be instead?
        </button>
        {confirmed.length === 0 ? (
          <span className="text-sm text-muted">Confirm or write at least one first.</span>
        ) : null}
      </StageFooter>
    </StageFrame>
  );
}
