/**
 * Today — read once, then closed.
 *
 * The one screen in Lifebook meant for a daily return, and it is built so that
 * a daily return costs nothing when it does not happen: no streak, no count,
 * no badge, nothing that changes colour. The page is short by design and ends
 * by saying so. Everything on it is the person's own words, chosen by the date.
 *
 * The date is read once per mount. A page that swaps its identity at midnight
 * while somebody is reading it would be a small betrayal.
 */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { todayReading } from '../engine/today';
import { MIN_REPORTS_FOR_RESISTANCE } from '../engine/credence';
import { areaName } from '../content/areas';
import { Page } from '../components/ui';
import { S } from '../strings';

export default function Today() {
  const state = useStore((s) => s.state);
  const [openedAt] = useState(() => new Date().toISOString());
  const r = useMemo(() => todayReading(state, openedAt), [state, openedAt]);

  const dateLabel = new Date(openedAt).toLocaleDateString(undefined, {
    weekday: 'long', day: 'numeric', month: 'long',
  });
  const c = r.credence;
  const showCredence = c && c.tested >= MIN_REPORTS_FOR_RESISTANCE && c.statedRate !== null;
  const empty = !r.identity && !r.area && r.due.length === 0 && !r.question;

  return (
    <Page title={S.today.title} lead={dateLabel}>
      {empty ? (
        <p className="mt-8 prose-quiet">
          {S.today.emptyPre}
          <Link to="/life" className="text-instrument underline underline-offset-4">{S.today.emptyLink}</Link>
          {S.today.emptyPost}
        </p>
      ) : null}

      {/* ---- hold this ------------------------------------------------- */}
      {r.identity ? (
        <section aria-labelledby="hold" className="mt-10">
          <h2 id="hold" className="text-sm uppercase tracking-[0.14em] text-muted">{S.today.hold}</h2>
          <p className="mt-4 max-w-measure font-display text-2xl leading-snug text-bone sm:text-3xl">
            {r.identity.text}
          </p>
          {r.belief ? (
            <p className="mt-3 max-w-measure text-sm leading-relaxed text-muted">
              <span className="text-instrument-dim">{S.life.selfInstead} </span>
              <span className="line-through decoration-fault/70">“{r.belief.text}”</span>
            </p>
          ) : null}
          {showCredence && c ? (
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {S.life.credence(Math.round(c.statedRate! * 100), Math.round(c.evidenceRate * 100))}
              {c.held ? <span className="ml-2 text-carry-bright">{S.life.credenceHeld}</span> : null}
            </p>
          ) : null}
        </section>
      ) : null}

      {/* ---- where most of the distance is ------------------------------- */}
      {r.area ? (
        <section aria-labelledby="distance" className="mt-10">
          <h2 id="distance" className="text-sm uppercase tracking-[0.14em] text-muted">{S.today.distance}</h2>
          <p className="mt-4 flex flex-wrap items-baseline gap-x-3">
            <span className="font-display text-xl text-bone">{areaName(r.area.area)}</span>
            {r.area.current !== null ? (
              <span className="numeral text-xs text-muted">{S.life.at(r.area.current)}</span>
            ) : null}
          </p>
          {r.area.statement ? (
            <p className="mt-2 max-w-measure leading-relaxed text-muted">“{r.area.statement}”</p>
          ) : null}
        </section>
      ) : null}

      {/* ---- due today ----------------------------------------------------- */}
      {r.due.length > 0 ? (
        <section aria-labelledby="due" className="mt-10">
          <h2 id="due" className="text-sm uppercase tracking-[0.14em] text-muted">{S.today.due}</h2>
          <ul className="mt-4 space-y-3">
            {r.due.map((p) => (
              <li key={p.id} className="flex flex-wrap items-baseline gap-x-3 text-bone">
                <span>{p.text}</span>
                <span className="text-xs text-muted">{S.stages.blueprint.cadences[p.cadence]}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-muted">
            {S.today.duePre}
            <Link to="/blueprint" className="text-instrument underline underline-offset-4">{S.today.dueLink}</Link>
            {S.today.duePost}
          </p>
        </section>
      ) : null}

      {/* ---- one question ------------------------------------------------ */}
      {r.question ? (
        <section aria-labelledby="question" className="mt-10">
          <h2 id="question" className="text-sm uppercase tracking-[0.14em] text-muted">{S.today.question}</h2>
          <ul className="mt-3 space-y-1">
            {r.question.evidence.map((line) => (
              <li key={line} className="text-sm leading-relaxed text-muted">{line}</li>
            ))}
          </ul>
          <p className="mt-3 max-w-measure font-display text-lg leading-snug text-bone">{r.question.question}</p>
        </section>
      ) : null}

      {/* ---- and that is all ------------------------------------------- */}
      {!empty ? (
        <p className="mt-14 border-t border-hairline pt-6 text-sm text-muted">{S.today.close}</p>
      ) : null}
    </Page>
  );
}
