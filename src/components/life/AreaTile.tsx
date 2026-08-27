/**
 * One area of a life, in the amount of space one area of a life deserves.
 *
 * Three states, each with something to do next, because a tile that shows an
 * absence and offers no way to fill it is a dead end:
 *
 *   rated    — their sentence, where it is, what it costs
 *   written  — their sentence, and no invented score
 *   blank    — the name, and an invitation
 *
 * The tile is not itself a link. Hovering it lights the matching sector on the
 * dial, and the one action it offers is a link inside it — nesting a link
 * inside a button would break both.
 */
import { Link } from 'react-router-dom';
import type { AreaRow } from '../../engine/overview';
import { rampColour } from '../../design/ramp';
import { AREA_BY_ID } from '../../content/areas';
import { S } from '../../strings';

export interface AreaTileProps {
  row: AreaRow;
  statement: string;
  beliefCount: number;
  selected: boolean;
  /** The area carrying the most importance × gap — marked the same way here as
   *  on the dial, so the two halves of the page point at the same thing. */
  attention: boolean;
  onHover: (hovering: boolean) => void;
}

function Importance({ n }: { n: number }) {
  return (
    <span className="flex items-center gap-[3px]" aria-label={S.life.matters(n)}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={`h-1.5 w-1.5 rounded-full ${i <= n ? 'bg-instrument' : 'bg-hairline'}`}
        />
      ))}
    </span>
  );
}

/** Ten steps, not a smooth bar: the person answered on a ten-point scale and
 *  the picture should not imply a precision the answer did not have. */
function Position({ score }: { score: number }) {
  return (
    <span className="flex items-center gap-[3px]" aria-hidden="true">
      {Array.from({ length: 10 }, (_, i) => (
        <span
          key={i}
          className="h-2 flex-1 rounded-[1px]"
          style={{ background: i < score ? rampColour(score / 10) : '#1B2231' }}
        />
      ))}
    </span>
  );
}

export function AreaTile({
  row, statement, beliefCount, selected, attention, onHover,
}: AreaTileProps) {
  const def = AREA_BY_ID.get(row.area);
  const name = def?.name ?? row.area;

  const base = 'group flex h-full flex-col rounded-lg border p-4 transition-colors duration-150';
  // The costliest area is marked the same way it is on the dial — one warm
  // edge, no shouting, and never in the middle of the heading where it would
  // push the area's own name onto a second line.
  const edge = attention ? 'border-l-2 border-l-carry' : '';
  const tone = row.state === 'blank'
    ? 'border-dashed border-hairline bg-transparent'
    : selected
      ? 'border-instrument-dim bg-surface2'
      : 'border-hairline bg-surface/60';

  return (
    <div
      className={`${base} ${tone} ${edge}`}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className={`text-[0.95rem] leading-snug ${row.state === 'blank' ? 'text-muted' : 'text-bone'}`}>
          {name}
        </h3>
        {row.importance !== null ? <Importance n={row.importance} /> : null}
      </div>

      {row.state === 'rated' ? (
        <div className="mt-3">
          <Position score={row.current!} />
          <div className="mt-1.5 numeral text-xs text-muted">{S.life.at(row.current!)}</div>
        </div>
      ) : null}

      {statement ? (
        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted">{statement}</p>
      ) : (
        <p className="mt-3 text-sm leading-relaxed text-muted">{S.life.notWritten}</p>
      )}

      {row.state === 'written' ? (
        <p className="mt-2 text-xs text-carry-bright">{S.life.notPlaced}</p>
      ) : null}

      <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-3">
        {attention ? (
          <span className="text-[0.7rem] uppercase tracking-wider text-carry-bright">
            {S.life.mostDistance}
          </span>
        ) : null}
        {beliefCount > 0 ? (
          <span className="text-[0.7rem] uppercase tracking-wider text-instrument-dim">
            {S.life.beliefsHere(beliefCount)}
          </span>
        ) : null}
        <Link
          to={row.state === 'blank' ? '/vision' : row.state === 'written' ? '/current' : '/vision'}
          className="ml-auto text-xs text-instrument underline decoration-instrument-dim underline-offset-4 hover:decoration-instrument"
        >
          {row.state === 'blank' ? S.life.write : row.state === 'written' ? S.life.place : S.life.revise}
        </Link>
      </div>
    </div>
  );
}
