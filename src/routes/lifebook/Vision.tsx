/**
 * Stage 1 — the life he wants.
 *
 * This runs first on purpose. Someone who abandons the app after this stage
 * still leaves with a vision board; someone who abandons it after an audit of
 * their current life leaves with a list of disappointments. Order matters more
 * than completeness here, which is also why every area is skippable.
 */
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AREAS } from '../../content/areas';
import { fileToDataUrl } from '../../lib/image';
import { lifebook } from '../../store/lifebookStore';
import { S } from '../../strings';
import { useStore } from '../../store/useStore';
import { StageFooter, StageFrame, Tally } from '../../components/lifebook';
import { FieldError } from '../../components/ui';
import type { AreaVision, Importance, LifeArea } from '../../types';

const MIN_AREAS = 3;

export default function Vision() {
  const navigate = useNavigate();
  const visions = useStore((s) => s.state.lifebook.visions);
  const byArea = useMemo(() => new Map(visions.map((v) => [v.area, v])), [visions]);

  const [open, setOpen] = useState<LifeArea | null>(AREAS[0]!.id);
  const [imageError, setImageError] = useState<string | null>(null);

  const filled = visions.filter((v) => v.statement.trim().length > 0);
  const ready = filled.length >= MIN_AREAS;

  const onImage = async (area: LifeArea, file: File) => {
    setImageError(null);
    try {
      lifebook.setVision(area, { image: await fileToDataUrl(file) });
    } catch (err) {
      setImageError(err instanceof Error ? err.message : 'That image could not be read.');
    }
  };

  return (
    <StageFrame
      stage="vision"
      title={S.stages.vision.title}
      lead={S.stages.vision.lead}
    >
      <Tally done={filled.length} total={AREAS.length} noun={S.stages.vision.tally} />

      <ul className="mt-5 space-y-2">
        {AREAS.map((area) => {
          const v = byArea.get(area.id);
          const isOpen = open === area.id;
          const written = (v?.statement ?? '').trim().length > 0;

          return (
            <li
              key={area.id}
              className={`rounded-lg border transition-colors ${
                isOpen ? 'border-instrument-dim bg-surface/60'
                  : written ? 'border-facil/40' : 'border-hairline'
              }`}
            >
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? null : area.id)}
                className="flex w-full items-start gap-3 px-4 py-3.5 text-left"
              >
                <span
                  aria-hidden="true"
                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                    written ? 'bg-facil-bright' : 'bg-hairline'
                  }`}
                />
                <span className="flex-1">
                  <span className="font-display text-lg">{area.name}</span>
                  <span className="mt-0.5 block text-sm leading-relaxed text-muted">
                    {written ? v!.statement : area.blurb}
                  </span>
                </span>
                {v?.image ? (
                  <img
                    src={v.image}
                    alt=""
                    className="h-12 w-12 shrink-0 rounded object-cover"
                  />
                ) : null}
              </button>

              {isOpen ? (
                <div className="border-t border-hairline px-4 py-5">
                  <label htmlFor={`vision-${area.id}`} className="label">
                    {area.visionPrompt}
                  </label>
                  <textarea
                    id={`vision-${area.id}`}
                    className="field mt-2 min-h-[7rem] resize-y"
                    value={v?.statement ?? ''}
                    placeholder={area.visionPlaceholder}
                    onChange={(e) => lifebook.setVision(area.id, { statement: e.target.value })}
                  />

                  <Markers area={area.id} vision={v} placeholder={area.markerPlaceholder} />

                  <div className="mt-6">
                    <span className="label">{S.stages.vision.matters}</span>
<p className="hint">{S.stages.vision.mattersHint}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {([1, 2, 3, 4, 5] as Importance[]).map((n) => (
                        <button
                          key={n}
                          type="button"
                          aria-pressed={(v?.importance ?? 3) === n}
                          onClick={() => lifebook.setVision(area.id, { importance: n })}
                          className={`numeral h-10 w-10 rounded-md border text-sm ${
                            (v?.importance ?? 3) === n
                              ? 'border-instrument bg-instrument/15 text-bone'
                              : 'border-hairline text-muted hover:border-instrument-dim'
                          }`}
                        >
                          {n}
                        </button>
                      ))}
<span className="self-center pl-2 text-xs text-muted">{S.stages.vision.mattersScale}</span>
                    </div>
                  </div>

                  <div className="mt-6">
                    <span className="label">{S.stages.vision.picture}</span>
<p className="hint">{S.stages.vision.pictureHint}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <label className="btn-ghost cursor-pointer">
                        {v?.image ? S.stages.vision.pictureReplace : S.stages.vision.pictureChoose}
                        <input
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) void onImage(area.id, f);
                            e.target.value = '';
                          }}
                        />
                      </label>
                      {v?.image ? (
                        <button
                          type="button"
                          className="btn-quiet text-xs"
                          onClick={() => lifebook.setVision(area.id, { image: '' })}
                        >
                          {S.stages.vision.pictureRemove}
                        </button>
                      ) : null}
                    </div>
                    {imageError ? <FieldError>{imageError}</FieldError> : null}
                  </div>

                  {written ? (
                    <button
                      type="button"
                      className="btn-quiet mt-6 px-0 text-xs"
                      onClick={() => lifebook.clearVision(area.id)}
                    >
                      {S.stages.vision.clear}
                    </button>
                  ) : null}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>

      <StageFooter>
        <button
          type="button"
          className="btn-primary"
          disabled={!ready}
          onClick={() => {
            lifebook.completeStage('vision');
            navigate('/board');
          }}
        >
          {S.stages.vision.cta}
        </button>
        {!ready ? (
          <span className="text-sm text-muted">
{S.stages.vision.more(MIN_AREAS - filled.length)}
          </span>
        ) : (
          <Link to="/current" className="btn-quiet">{S.stages.vision.skip}</Link>
        )}
      </StageFooter>
    </StageFrame>
  );
}

function Markers({ area, vision, placeholder }: {
  area: LifeArea; vision: AreaVision | undefined; placeholder: string;
}) {
  const markers = vision?.markers ?? [];
  const [draft, setDraft] = useState('');

  const add = () => {
    const text = draft.trim();
    if (!text || markers.length >= 5) return;
    lifebook.setVision(area, { markers: [...markers, text] });
    setDraft('');
  };

  return (
    <div className="mt-6">
      <span className="label">{S.stages.vision.markers}</span>
      <p className="hint">{S.stages.vision.markersHint}</p>

      {markers.length > 0 ? (
        <ul className="mt-3 space-y-1.5">
          {markers.map((m, i) => (
            <li key={`${m}-${i}`} className="flex items-center gap-2 text-sm">
              <span aria-hidden="true" className="text-facil-bright">✓</span>
              <span className="flex-1">{m}</span>
              <button
                type="button"
                className="btn-quiet px-1 text-xs"
                onClick={() => lifebook.setVision(area, { markers: markers.filter((_, j) => j !== i) })}
              >
                {S.stages.vision.markerRemove}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {markers.length < 5 ? (
        <div className="mt-3 flex gap-2">
          <label className="sr-only" htmlFor={`marker-${area}`}>Add a marker</label>
          <input
            id={`marker-${area}`}
            className="field flex-1"
            value={draft}
            placeholder={placeholder}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          />
          <button type="button" className="btn-ghost" onClick={add} disabled={!draft.trim()}>
            {S.stages.vision.markerAdd}
          </button>
        </div>
      ) : null}
    </div>
  );
}
