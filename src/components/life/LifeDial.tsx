/**
 * The whole life, once, as one figure.
 *
 * Two things carry meaning and nothing else does:
 *
 *   angular width  — how much the person said that area matters (1–5)
 *   arc length     — how close it is to what they described (1–10)
 *
 * The rim is the life they wrote down. Every arc is reaching for it, and the
 * dark remainder between an arc and the rim is the distance left — which is
 * why the fill grows outward rather than in.
 *
 * The order of the sectors is fixed for the life of the app so the shape can be
 * recognised again next month. Colour repeats the arc-length reading in
 * luminance and adds nothing of its own. An area that was never rated is drawn
 * as an open track: no fill, because a fill of zero would be a claim the person
 * never made.
 *
 * All angles come from src/engine/overview.ts, which is tested against a
 * hand-computed dial. This file draws them and does no arithmetic of its own
 * beyond turning a fraction into a radius.
 */
import { useId } from 'react';
import type { LifeArea } from '../../types';
import type { AreaRow, DialSector } from '../../engine/overview';
import { polarPoint, ringPath, sectorMidDeg } from '../../engine/overview';
import { arcFraction, rampColour } from '../../design/ramp';
import { areaShort } from '../../content/areas';
import { S } from '../../strings';

/* The box is wider than it is tall because the labels hang off the sides of a
   circle and nowhere else. Sized so the longest area name still clears the
   edge at the narrowest sector angle. */
const VB_W = 520;
const VB_H = 440;
const CX = VB_W / 2;
const CY = VB_H / 2;
const R_INNER = 84;
const R_OUTER = 152;
const R_RIM = R_OUTER + 7;
const R_LABEL = R_RIM + 14;

export interface LifeDialProps {
  sectors: DialSector[];
  rows: AreaRow[];
  /** The area under the pointer or hovered in the tiles below. */
  selected: LifeArea | null;
  onSelect: (area: LifeArea | null) => void;
  /** The area carrying the most importance × gap, marked on the rim. */
  attention: LifeArea | null;
  centre: { value: string; suffix?: string; label: string };
  /** One sentence describing the whole dial, for anyone not looking at it. */
  summary: string;
}

export function LifeDial({
  sectors, rows, selected, onSelect, attention, centre, summary,
}: LifeDialProps) {
  const titleId = useId();
  const rowBy = new Map(rows.map((r) => [r.area, r]));

  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      className="h-auto w-full select-none"
      role="img"
      aria-labelledby={titleId}
      onMouseLeave={() => onSelect(null)}
    >
      <title id={titleId}>{summary}</title>

      {/* The rim: the life they described. Every arc is measured against it. */}
      <circle
        data-role="rim"
        cx={CX}
        cy={CY}
        r={R_RIM}
        fill="none"
        className="stroke-hairline"
        strokeWidth={1}
        strokeDasharray="2 6"
      />

      {sectors.map((s) => {
        const row = rowBy.get(s.area)!;
        const isSelected = selected === s.area;
        const dimmed = selected !== null && !isSelected;
        const mid = sectorMidDeg(s);
        const label = polarPoint(CX, CY, R_LABEL, mid);
        const cos = Math.cos((mid * Math.PI) / 180);
        const anchor = cos > 0.2 ? 'start' : cos < -0.2 ? 'end' : 'middle';

        // The track: the whole of the area, whether or not it has been rated.
        const track = ringPath(CX, CY, R_INNER, R_OUTER, s.startDeg, s.endDeg);

        // The fill: how far along it actually is, growing towards the rim.
        const filled = s.fill === null
          ? null
          : ringPath(
              CX, CY, R_INNER,
              R_INNER + arcFraction(s.fill) * (R_OUTER - R_INNER),
              s.startDeg, s.endDeg,
            );

        return (
          <g
            key={s.area}
            onMouseEnter={() => onSelect(s.area)}
            onClick={() => onSelect(isSelected ? null : s.area)}
            className="cursor-pointer transition-opacity duration-200"
            opacity={dimmed ? 0.45 : 1}
          >
            {/* A never-written area is a slot, not an empty measurement. It is
                drawn as an outline so it cannot be mistaken for a track with a
                value of nothing on it. */}
            {s.state === 'blank' ? (
              <path data-role="blank" d={track} className="fill-canvas stroke-dial-blank" strokeWidth={1} />
            ) : (
              <path data-role="track" d={track} className="fill-dial-track" />
            )}
            {filled ? <path data-role="fill" d={filled} fill={rampColour(s.fill!)} /> : null}

            {isSelected ? (
              <path
                data-role="selected"
                d={ringPath(CX, CY, R_INNER - 4, R_INNER - 2, s.startDeg, s.endDeg)}
                className="fill-instrument"
              />
            ) : null}

            {/* The costliest area gets one mark on the rim. It is the only warm
                thing on the dial, so there is never a question about where the
                eye is being sent. */}
            {attention === s.area ? (
              <path
                data-role="attention"
                d={ringPath(CX, CY, R_OUTER + 2, R_OUTER + 5, s.startDeg, s.endDeg)}
                className="fill-carry"
              />
            ) : null}

            {/* Only areas that have been written get a label. Twelve names
                around a circle collide; the ones with nothing in them are
                identified in the tiles below instead. */}
            {s.state !== 'blank' ? (
              <text
                x={label.x}
                y={label.y}
                textAnchor={anchor}
                dominantBaseline="middle"
                className={`font-sans text-[13px] ${isSelected ? 'fill-bone' : 'fill-muted'}`}
              >
                {areaShort(s.area)}
                {row.current !== null ? (
                  <tspan className="fill-instrument font-mono" dx="6">{row.current}</tspan>
                ) : null}
              </text>
            ) : null}
          </g>
        );
      })}

      {/* The centre reads as an instrument face, not a scoreboard: the figure,
          then what it is a figure of. */}
      <circle
        data-role="hub"
        cx={CX}
        cy={CY}
        r={R_INNER - 12}
        className="fill-surface/80 stroke-hairline"
        strokeWidth={1}
      />
      <text
        x={CX}
        y={CY - 4}
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-bone font-mono text-[40px] tabular-nums"
      >
        {centre.value}
        {centre.suffix ? (
          <tspan className="fill-muted text-[20px]">{centre.suffix}</tspan>
        ) : null}
      </text>
      <text
        x={CX}
        y={CY + 28}
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-muted font-sans text-[10.5px] uppercase tracking-[0.18em]"
      >
        {centre.label}
      </text>
      <text
        x={CX}
        y={CY + 45}
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-muted font-sans text-[9.5px]"
      >
        {S.life.dialCentreNote}
      </text>
    </svg>
  );
}
