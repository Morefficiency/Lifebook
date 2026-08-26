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
import { S } from '../../strings';
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
      <StageFrame stage="current" title={S.stages.current.title}>
        <p className="text-muted">{S.stages.current.needVision}</p>
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
      title={S.stages.current.title}
      lead={S.stages.current.lead}
    >
      <Tally done={rated.length} total={written.length} noun={S.stages.current.tally} />

      <article className="card mt-5">
        <h2 className="font-display text-xl">{area.name}</h2>
        <p className="mt-3 leading-relaxed text-muted">
          <span className="text-xs uppercase tracking-[0.14em] text-instrument">{S.stages.current.youWrote}</span>
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
            lowLabel={S.stages.current.low}
            highLabel={S.stages.current.high}
            ariaLabel={area.currentPrompt}
          />
        </div>
      </div>

      <div className="mt-8">
        <label htmlFor="current-desc" className="label">
          {S.stages.current.describe}
        </label>
        <textarea
          id="current-desc"
          className="field mt-2 min-h-[6rem] resize-y"
          value={description}
          placeholder={S.stages.current.describeHint}
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
{index + 1 < written.length ? S.stages.current.next : S.stages.current.done}
        </button>

        {gap !== null ? (
          <div className="ml-auto text-right">
            <p className="numeral text-sm text-bone">{S.stages.current.distanceLeft(gap)}</p>
            <Explain>
              <div className="space-y-2">
<p>{S.stages.current.distanceHow}</p>
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
                <p>{S.stages.current.distanceCaveat}</p>
              </div>
            </Explain>
          </div>
        ) : null}
      </StageFooter>
    </StageFrame>
  );
}
