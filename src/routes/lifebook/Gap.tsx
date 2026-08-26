/**
 * The standing dashboard: what you believe now, what you would have to believe,
 * and which part of the life you want each one is sitting on top of.
 */
import { Link } from 'react-router-dom';
import { AREA_BY_ID } from '../../content/areas';
import { areaGap, lifeGapPercent, rankedTensions } from '../../engine/gap';
import { practiceProgress } from '../../engine/programme';
import { S } from '../../strings';
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
      title={S.stages.gap.title}
      lead={S.stages.gap.lead}
    >
      <div className="flex flex-wrap gap-3">
        <StatChip
          label={S.stages.gap.distance}
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
        <StatChip label={S.stages.gap.beliefs} value={confirmed.length} />
        <StatChip label={S.stages.gap.instances} value={progress.logged} />
      </div>

      {ranked.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-sm uppercase tracking-[0.14em] text-muted">
            {S.stages.gap.whereTitle}
          </h2>
          <ul className="mt-4 space-y-2">
            {ranked.map((r) => (
              <li key={r.area} className="rounded-md border border-hairline p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span>{AREA_BY_ID.get(r.area)?.name}</span>
                  <span className="numeral text-xs text-muted">
{S.stages.gap.whereRow(r.current, r.importance)}
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
        <h2 className="text-sm uppercase tracking-[0.14em] text-muted">{S.stages.gap.fromTo}</h2>
        {confirmed.length === 0 ? (
          <p className="mt-3 text-muted">
{S.stages.gap.emptyPre}
            <Link to="/reflect" className="text-instrument underline underline-offset-4">
              {S.stages.gap.emptyLink}
</Link>{S.stages.gap.emptyPost}
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
                            {S.stages.gap.notAnswered}
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
        <Link to="/blueprint" className="btn-primary">{S.stages.gap.programme}</Link>
        <Link to="/board" className="btn-ghost">{S.stages.gap.board}</Link>
        <Link to="/print" className="btn-ghost">{S.stages.gap.print}</Link>
        <Explain label={S.stages.gap.notWhat}>
<p>{S.stages.gap.notWhatBody}</p>
        </Explain>
      </div>
    </Page>
  );
}
