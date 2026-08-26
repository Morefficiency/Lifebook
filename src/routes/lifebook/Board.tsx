/**
 * The vision board — the payoff for Stage 1, and the thing someone who goes no
 * further still walks away with.
 */
import { Link } from 'react-router-dom';
import { AREA_BY_ID } from '../../content/areas';
import { S } from '../../strings';
import { useStore } from '../../store/useStore';
import { Page } from '../../components/ui';

export default function Board() {
  const visions = useStore((s) => s.state.lifebook.visions);
  const written = visions
    .filter((v) => v.statement.trim().length > 0)
    .sort((a, b) => b.importance - a.importance || (a.area < b.area ? -1 : 1));

  if (written.length === 0) {
    return (
      <Page title={S.stages.board.title}>
        <p className="text-muted">{S.stages.board.empty}</p>
        <Link to="/vision" className="btn-primary mt-6">{S.stages.board.emptyCta}</Link>
      </Page>
    );
  }

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-3xl">
        <h1 className="text-2xl sm:text-3xl">{S.stages.board.title}</h1>
<p className="mt-3 max-w-measure leading-relaxed text-muted">{S.stages.board.lead}</p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {written.map((v) => {
          const area = AREA_BY_ID.get(v.area);
          return (
            <article
              key={v.area}
              className="flex flex-col overflow-hidden rounded-lg border border-hairline bg-surface/50"
            >
              <div className="relative h-40 shrink-0 overflow-hidden">
                {v.image ? (
                  <img src={v.image} alt="" className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <div
                    aria-hidden="true"
                    className="h-full w-full bg-[radial-gradient(120%_100%_at_20%_0%,#1E2A3A_0%,#10151F_70%)]"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-canvas/95 via-canvas/30 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
                  <h2 className="font-display text-xl leading-tight">{area?.name ?? v.area}</h2>
                  <span
                    className="numeral shrink-0 text-xs tracking-wider text-instrument"
                    title={S.stages.board.matters(v.importance)}
                  >
                    {'●'.repeat(v.importance)}
                    <span className="text-instrument-dim">{'●'.repeat(5 - v.importance)}</span>
                  </span>
                </div>
              </div>

              <div className="flex flex-1 flex-col p-5">
                <p className="leading-relaxed text-bone">{v.statement}</p>

                {v.markers.length > 0 ? (
                  <ul className="mt-4 space-y-1.5 border-t border-hairline pt-4">
                    {v.markers.map((m) => (
                      <li key={m} className="flex gap-2 text-sm text-muted">
                        <span aria-hidden="true" className="text-facil-bright">✓</span>
                        <span>{m}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}

                {!v.image ? (
                  <Link
                    to="/vision"
                    className="mt-4 self-start text-xs text-instrument underline decoration-instrument-dim underline-offset-4 hover:decoration-instrument"
                  >
                    {S.stages.board.addPicture}
                  </Link>
                ) : null}
              </div>
            </article>
          );
        })}

        {/* An invitation rather than an empty column. */}
        {written.length < 12 ? (
          <Link
            to="/vision"
            className="flex min-h-[14rem] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-hairline p-6 text-center text-muted transition-colors hover:border-instrument-dim hover:text-bone"
          >
            <span aria-hidden="true" className="text-2xl">+</span>
            <span className="text-sm">
{S.stages.board.toWrite(12 - written.length)}
            </span>
          </Link>
        ) : null}
      </div>

      <div className="mx-auto mt-12 flex w-full max-w-3xl flex-wrap gap-3 border-t border-hairline pt-6">
        <Link to="/current" className="btn-primary">{S.stages.board.next}</Link>
        <Link to="/vision" className="btn-quiet">{S.stages.board.keepWriting}</Link>
      </div>
    </div>
  );
}
