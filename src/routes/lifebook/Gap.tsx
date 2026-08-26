/**
 * The standing dashboard: what you believe now, what you would have to believe,
 * and which part of the life you want each one is sitting on top of.
 */
import { Link } from 'react-router-dom';
import { AREA_BY_ID } from '../../content/areas';
import { areaGap, lifeGapPercent, rankedTensions } from '../../engine/gap';
import { practiceProgress } from '../../engine/programme';
import { useStore } from '../../store/useStore';
import { Explain, Page, StatChip, Tag } from '../../components/ui';

export default function Gap() {
  const lb = useStore((s) => s.state.lifebook);

  const gap = lifeGapPercent(lb.visions, lb.currents);
  const ranked = rankedTensions(lb.visions, lb.currents);
  const confirmed = lb.beliefs.filter((b) => b.status === 'confirmed');
  const identityFor = new Map(lb.identities.map((i) => [i.replacesBeliefId, i]));
  const progress = practiceProgress(lb.practices, lb.practiceLogs);

  return (
    <Page
      title="The gap"
      lead="On the left, what you told us you believe. On the right, who you would have to be for the life you described to be ordinary. Everything in between is the work."
    >
      <div className="flex flex-wrap gap-3">
        <StatChip
          label="Distance left"
          value={gap}
          suffix="%"
          explain={
            <div className="space-y-2">
              <p>
                For each area: how far it is from your vision, times how much you said
                it matters. Summed, then divided by the total importance.
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
            </div>
          }
        />
        <StatChip label="Beliefs you own" value={confirmed.length} />
        <StatChip label="Instances logged" value={progress.logged} />
      </div>

      {ranked.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-sm uppercase tracking-[0.14em] text-muted">
            Where the distance actually is
          </h2>
          <ul className="mt-4 space-y-2">
            {ranked.map((r) => (
              <li key={r.area} className="rounded-md border border-hairline p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span>{AREA_BY_ID.get(r.area)?.name}</span>
                  <span className="numeral text-xs text-muted">
                    at {r.current}/10 · matters {r.importance}/5
                  </span>
                </div>
                <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded bg-hairline">
                  <div
                    className="h-full bg-instrument"
                    style={{ width: `${(1 - r.gap) * 100}%` }}
                    role="presentation"
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-12">
        <h2 className="text-sm uppercase tracking-[0.14em] text-muted">From, to</h2>
        {confirmed.length === 0 ? (
          <p className="mt-3 text-muted">
            Nothing yet.{' '}
            <Link to="/reflect" className="text-instrument underline underline-offset-4">
              Answer the reflection questions
            </Link>{' '}
            and this fills in.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {confirmed.map((b) => {
              const identity = identityFor.get(b.id);
              return (
                <li key={b.id} className="rounded-lg border border-hairline bg-surface/40 p-5">
                  <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                    <p className="leading-relaxed text-muted line-through decoration-fault/60">
                      “{b.text}”
                    </p>
                    <span aria-hidden="true" className="hidden text-instrument sm:block">→</span>
                    <p className="leading-relaxed">
                      {identity?.text
                        ? identity.text
                        : (
                          <Link to="/becoming" className="text-instrument underline underline-offset-4">
                            Not answered yet
                          </Link>
                        )}
                    </p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {b.areas.map((a) => <Tag key={a}>{AREA_BY_ID.get(a)?.name ?? a}</Tag>)}
                    {b.source === 'own' ? <Tag tone="facil">your words</Tag> : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <div className="mt-10 flex flex-wrap gap-3 border-t border-hairline pt-6">
        <Link to="/blueprint" className="btn-primary">The programme</Link>
        <Link to="/board" className="btn-ghost">The vision board</Link>
        <Explain label="What this number is not">
          <p>
            It is a description of two sets of your own answers on one day. It is not a
            score, it has no norms, and it cannot be compared with anybody else&apos;s.
          </p>
        </Explain>
      </div>
    </Page>
  );
}
