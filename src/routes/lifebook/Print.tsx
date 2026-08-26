/**
 * The Lifebook as a document.
 *
 * Someone spends forty minutes writing what they want their life to be, what
 * they believe about themselves and what they are going to do about it — and
 * until now the only way to get it out was a JSON file. This is the artifact:
 * one page, print-ready, meant to be put somewhere it will be seen.
 *
 * Printed output goes light-on-white deliberately. The dark palette is right
 * for a screen at night and wrong for a laser printer, and nobody wants to
 * spend a cartridge on an ink-blue background.
 */
import { Link } from 'react-router-dom';
import { AREA_BY_ID } from '../../content/areas';
import { lifeGapPercent, rankedTensions } from '../../engine/gap';
import { useStore } from '../../store/useStore';

const KIND_LABEL = { thought: 'Catch', behaviour: 'Do', affirmation: 'Say' } as const;

export default function Print() {
  const lb = useStore((s) => s.state.lifebook);

  const visions = lb.visions
    .filter((v) => v.statement.trim().length > 0)
    .sort((a, b) => b.importance - a.importance);
  const currentByArea = new Map(lb.currents.map((c) => [c.area, c]));
  const gap = lifeGapPercent(lb.visions, lb.currents);
  const ranked = rankedTensions(lb.visions, lb.currents);
  const confirmed = lb.beliefs.filter((b) => b.status === 'confirmed');
  const identityFor = new Map(lb.identities.map((i) => [i.replacesBeliefId, i]));

  const empty = visions.length === 0 && confirmed.length === 0;

  return (
    <div className="print-sheet mx-auto w-full max-w-3xl">
      <div className="no-print mb-8 flex flex-wrap items-center gap-3 border-b border-hairline pb-6">
        <button type="button" className="btn-primary" onClick={() => window.print()}>
          Print, or save as PDF
        </button>
        <Link to="/gap" className="btn-quiet">Back</Link>
        <p className="w-full text-sm text-muted sm:w-auto">
          Prints light-on-white. Your browser&apos;s print dialogue can save it as a
          PDF instead of sending it to a printer.
        </p>
      </div>

      {empty ? (
        <p className="text-muted">
          Nothing to print yet.{' '}
          <Link to="/vision" className="underline underline-offset-4">Start with the life you want.</Link>
        </p>
      ) : null}

      <header>
        <h1 className="font-display text-4xl leading-tight">My Lifebook</h1>
        <p className="mt-2 text-sm text-muted">
          Written {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
          {gap !== null ? ` · ${gap}% of the distance still to go` : ''}
        </p>
      </header>

      {visions.length > 0 ? (
        <section className="mt-10">
          <h2 className="font-display text-2xl">The life I want</h2>
          <div className="mt-5 space-y-6">
            {visions.map((v) => {
              const current = currentByArea.get(v.area);
              return (
                <article key={v.area} className="break-inside-avoid">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="font-display text-lg">{AREA_BY_ID.get(v.area)?.name ?? v.area}</h3>
                    <span className="numeral text-xs text-muted">
                      matters {v.importance}/5
                      {current ? ` · at ${current.score}/10 today` : ''}
                    </span>
                  </div>
                  <p className="mt-2 leading-relaxed">{v.statement}</p>
                  {v.markers.length > 0 ? (
                    <ul className="mt-2 space-y-1 text-sm text-muted">
                      {v.markers.map((m) => (
                        <li key={m}>— {m}</li>
                      ))}
                    </ul>
                  ) : null}
                  {current?.description ? (
                    <p className="mt-2 text-sm italic text-muted">Today: {current.description}</p>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      {ranked.length > 0 ? (
        <section className="mt-10 break-inside-avoid">
          <h2 className="font-display text-2xl">Where the distance is</h2>
          <ol className="mt-4 space-y-1.5">
            {ranked.map((r) => (
              <li key={r.area} className="flex justify-between gap-4 text-sm">
                <span>{AREA_BY_ID.get(r.area)?.name}</span>
                <span className="numeral text-muted">
                  at {r.current}/10 · matters {r.importance}/5
                </span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {confirmed.length > 0 ? (
        <section className="mt-10">
          <h2 className="font-display text-2xl">From, to</h2>
          <div className="mt-5 space-y-5">
            {confirmed.map((b) => {
              const identity = identityFor.get(b.id);
              return (
                <article key={b.id} className="break-inside-avoid">
                  <p className="text-sm text-muted">Instead of: “{b.text}”</p>
                  {identity?.text ? (
                    <p className="mt-1.5 font-display text-lg leading-snug">{identity.text}</p>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      {lb.identities.filter((i) => i.text.trim()).length > 0 ? (
        <section className="mt-10">
          <h2 className="font-display text-2xl">The work</h2>
          <div className="mt-5 space-y-6">
            {lb.identities.filter((i) => i.text.trim()).map((identity) => {
              const items = lb.practices.filter((p) => p.identityId === identity.id && p.active);
              if (items.length === 0) return null;
              return (
                <article key={identity.id} className="break-inside-avoid">
                  <h3 className="font-display text-lg leading-snug">{identity.text}</h3>
                  <ul className="mt-2 space-y-2">
                    {items.map((item) => (
                      <li key={item.id} className="text-sm leading-relaxed">
                        <span className="font-medium">{KIND_LABEL[item.kind]}: </span>
                        {item.cue ? <span className="text-muted">“{item.cue}” → </span> : null}
                        {item.text}
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      <footer className="mt-12 border-t border-hairline pt-4 text-xs text-muted">
        <p>
          Made of my own answers on one day. A mirror, not a verdict — mirrors update.
        </p>
      </footer>
    </div>
  );
}
