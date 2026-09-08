/**
 * What the record says — offered, not found.
 *
 * Sits on the standing view under the twelve areas. Every entry is a question
 * standing on the lines of evidence it came from, with one place to go. There
 * is no badge, no count in the nav, and nothing that changes colour when a new
 * one appears: a person reads this when they open the page, which is the only
 * cadence the app has.
 *
 * Empty is a real state here and is said plainly. The band never invents a
 * pattern to have something to show.
 */
import { Link } from 'react-router-dom';
import type { Offer } from '../../engine/patterns';
import { Explain } from '../ui';
import { S } from '../../strings';

export function PatternsBand({ offers }: { offers: Offer[] }) {
  return (
    <section aria-labelledby="patterns-heading">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="patterns-heading" className="text-lg">{S.patterns.title}</h2>
        <Explain>
          <div className="space-y-2">
            {S.patterns.explain.map((line) => <p key={line}>{line}</p>)}
          </div>
        </Explain>
      </div>
      <p className="mt-2 max-w-measure text-sm leading-relaxed text-muted">{S.patterns.lead}</p>

      {offers.length === 0 ? (
        <p className="mt-5 text-sm text-muted">{S.patterns.none}</p>
      ) : (
        <ul className="mt-5 grid gap-4 md:grid-cols-2">
          {offers.map((o) => (
            <li key={o.id} className="card flex flex-col">
              <p className="text-[0.62rem] uppercase tracking-wider text-instrument-dim">
                {S.patterns.kind[o.kind]}
              </p>
              <ul className="mt-2 space-y-1">
                {o.evidence.map((line) => (
                  <li key={line} className="text-sm leading-relaxed text-muted">{line}</li>
                ))}
              </ul>
              <p className="mt-3 font-display text-[1.05rem] leading-snug text-bone">{o.question}</p>
              <div className="mt-auto pt-4">
                <Link
                  to={o.to}
                  className="text-xs text-instrument underline decoration-instrument-dim underline-offset-4 hover:decoration-instrument"
                >
                  {S.patterns.act}
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
