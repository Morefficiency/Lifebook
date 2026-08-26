/**
 * Stage 2 — where each of those areas actually is.
 *
 * Only asked about areas he wrote a vision for. Rating the distance from a
 * vision you never described is meaningless, and asking for it anyway is how
 * you get a list of things someone feels vaguely bad about.
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AREA_BY_ID } from '../../content/areas';
import { areaGap, lifeGapPercent, rankedTensions } from '../../engine/gap';
import { lifebook } from '../../store/lifebookStore';
import { useStore } from '../../store/useStore';
import { StageFooter, StageFrame, Tally } from '../../components/lifebook';
import { Explain, Slider } from '../../components/ui';

export default function Current() {
  const navigate = useNavigate();
  const visions = useStore((s) => s.state.lifebook.visions);
  const currents = useStore((s) => s.state.lifebook.currents);

  const written = useMemo(
    () => visions.filter((v) => v.statement.trim().length > 0)
      .sort((a, b) => b.importance - a.importance),
    [visions],
  );
  const byArea = useMemo(() => new Map(currents.map((c) => [c.area, c])), [currents]);
  const rated = written.filter((v) => byArea.has(v.area));
  const gap = lifeGapPercent(visions, currents);
  const ranked = rankedTensions(visions, currents);

  const [index, setIndex] = useState(() => {
    const first = written.findIndex((v) => !byArea.has(v.area));
    return first >= 0 ? first : 0;
  });

  const vision = written[index];
  const area = vision ? AREA_BY_ID.get(vision.area) : undefined;
  const stored = vision ? byArea.get(vision.area) : undefined;

  const [score, setScore] = useState(stored?.score ?? 5);
  const [description, setDescription] = useState(stored?.description ?? '');
  const [shownFor, setShownFor] = useState(vision?.area);

  // Moving to another area loads that area's stored answer.
  if (vision && shownFor !== vision.area) {
    setShownFor(vision.area);
    setScore(byArea.get(vision.area)?.score ?? 5);
    setDescription(byArea.get(vision.area)?.description ?? '');
  }

  if (!vision || !area) {
    return (
      <StageFrame stage="current" title="The life you have">
        <p className="text-muted">Write a vision for at least one area first.</p>
      </StageFrame>
    );
  }

  const save = () => lifebook.setCurrent(vision.area, score, description);

  const next = () => {
    save();
    if (index + 1 < written.length) setIndex(index + 1);
    else {
      lifebook.completeStage('current');
      navigate('/reflect');
    }
  };

  return (
    <StageFrame
      stage="current"
      title="The life you have"
      lead="Against what you just wrote, not against anyone else, and not against where you think you ought to be."
    >
      <Tally done={rated.length} total={written.length} noun="areas rated" />

      <article className="card mt-5">
        <h2 className="font-display text-xl">{area.name}</h2>
        <p className="mt-3 leading-relaxed text-muted">
          <span className="text-xs uppercase tracking-[0.14em] text-instrument">You wrote</span>
          <br />
          {vision.statement}
        </p>
      </article>

      <div className="mt-8">
        <span className="label">{area.currentPrompt}</span>
        <div className="mt-5">
          <Slider
            id="current-score"
            value={score}
            min={1}
            max={10}
            onChange={setScore}
            lowLabel="Nowhere near it"
            highLabel="Already living it"
            ariaLabel={area.currentPrompt}
          />
        </div>
      </div>

      <div className="mt-8">
        <label htmlFor="current-desc" className="label">
          What is actually going on here, in a sentence or two?
        </label>
        <textarea
          id="current-desc"
          className="field mt-2 min-h-[6rem] resize-y"
          value={description}
          placeholder="Plainly. Not a verdict on yourself — just what is true."
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <StageFooter>
        <button
          type="button"
          className="btn-ghost"
          disabled={index === 0}
          onClick={() => { save(); setIndex(index - 1); }}
        >
          Back
        </button>
        <button type="button" className="btn-primary" onClick={next}>
          {index + 1 < written.length ? 'Next area' : 'Done — what shapes this?'}
        </button>

        {gap !== null ? (
          <div className="ml-auto text-right">
            <p className="numeral text-sm text-bone">{gap}% of the distance left</p>
            <Explain>
              <div className="space-y-2">
                <p>
                  For each area: how far it is from your vision, multiplied by how much
                  you said it matters. Added up across every area you have rated, then
                  divided by the total importance.
                </p>
                {ranked.length > 0 ? (
                  <ul className="space-y-1">
                    {ranked.map((r) => (
                      <li key={r.area} className="flex justify-between gap-4">
                        <span>{AREA_BY_ID.get(r.area)?.name}</span>
                        <span className="numeral text-muted">
                          {r.importance} × {areaGap(r.current).toFixed(2)} = {r.tension.toFixed(2)}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : null}
                <p>It is a description of your own two sets of answers, nothing more.</p>
              </div>
            </Explain>
          </div>
        ) : null}
      </StageFooter>
    </StageFrame>
  );
}
