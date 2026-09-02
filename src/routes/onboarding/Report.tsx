/** §5 A6 / §7.6 — the insight report and the choice of a first fault line. */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { S } from '../../strings';
import { PaidCta } from '../../components/PaidCta';
import { useGraph, useInsightReport, useStrivingLookup } from '../../store/selectors';
import { conflictEdgesByWeight, edgeKey } from '../../engine/graph';
import type { EdgeMetric } from '../../engine/graph';
import { Explain, StrivingText, Tag } from '../../components/ui';

export default function InsightReportRoute() {
  const navigate = useNavigate();
  const report = useInsightReport();
  const graph = useGraph();
  const labels = useStrivingLookup();

  const faults = useMemo(() => conflictEdgesByWeight(graph), [graph]);

  const preselect = graph.loadBearingEdge;
  const [selected, setSelected] = useState<string | null>(
    preselect ? edgeKey(preselect.aId, preselect.bId) : null,
  );

  useEffect(() => {
    if (!selected && preselect) setSelected(edgeKey(preselect.aId, preselect.bId));
  }, [selected, preselect]);

  const go = (e: EdgeMetric) => {
    navigate(`/fork?a=${encodeURIComponent(e.aId)}&b=${encodeURIComponent(e.bId)}`);
  };

  const chosen = faults.find((e) => edgeKey(e.aId, e.bId) === selected);

  return (
    <div className="mx-auto w-full max-w-2xl">
      <h1 className="text-2xl sm:text-3xl">{S.report.title}</h1>
      <p className="mt-2 text-xs uppercase tracking-[0.14em] text-muted">{S.report.regenerate}</p>

      <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Headline label={S.bits.strivings} value={report.headline.strivings} />
        <Headline label={S.bits.helpLinks} value={report.headline.helpLinks} />
        <Headline label={S.bits.faultLines} value={report.headline.faultLines} />
        <Headline
          label={S.bits.conflictIndex}
          value={report.headline.conflictIndexPercent}
          suffix="%"
          explain={
            <div className="space-y-2">
              <p>{S.howComputed.conflictIndexFormula} {S.howComputed.conflictIndexShare}</p>
              <p className="numeral text-muted">
                {graph.totalConflictLoad.toFixed(2)} ÷ ({graph.totalConflictLoad.toFixed(2)} +{' '}
                {graph.totalFacilitation.toFixed(2)}) ={' '}
                {report.headline.conflictIndexPercent === null
                  ? '—' : `${report.headline.conflictIndexPercent}%`}
              </p>
              <p>{S.howComputed.conflictIndexNoCorrect}</p>
            </div>
          }
        />
      </dl>

      <div className="mt-10 space-y-8">
        {report.sections.map((s) => (
          <section key={s.id}>
            <h2 className="text-sm uppercase tracking-[0.14em] text-instrument">{s.title}</h2>
            <div className="mt-3 max-w-measure space-y-3 leading-relaxed text-bone">
              {s.body.slice(0, 1).map((p) => (
                <p key={p} className={s.id === 'honesty' || s.id === 'positions' ? 'text-muted' : ''}>
                  {p}
                </p>
              ))}
              {s.items ? (
                <ul className="space-y-1.5 border-l border-hairline pl-4">
                  {s.items.map((it) => <li key={it}>{it}</li>)}
                </ul>
              ) : null}
              {s.body.slice(1).map((p) => (
                <p key={p} className={s.id === 'honesty' || s.id === 'positions' ? 'text-muted' : ''}>
                  {p}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <hr className="my-10 border-hairline" />

      <section>
        <h2 className="text-xl">{S.report.chooseFaultLine}</h2>
        {faults.length === 0 ? (
          <p className="mt-3 max-w-measure text-muted">{S.report.noFaultLines}</p>
        ) : (
          <>
            <p className="mt-2 max-w-measure text-sm text-muted">{S.report.preselected}</p>
            <p className="mt-1 max-w-measure text-sm text-muted">{S.report.weightNote}</p>
            <ul className="mt-5 space-y-2">
              {faults.map((e) => {
                const k = edgeKey(e.aId, e.bId);
                const on = k === selected;
                return (
                  <li key={k}>
                    <button
                      type="button"
                      aria-pressed={on}
                      onClick={() => setSelected(k)}
                      className={`w-full rounded-md border px-4 py-3 text-left transition-colors ${
                        on ? 'border-fault bg-fault/10' : 'border-hairline hover:border-fault/50'
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Tag tone="fault">
                          {Math.abs(e.effect) === 2 ? S.bits.stronglyConflicting : S.bits.conflicting}
                        </Tag>
                        <Tag tone="fault">{S.bits.heatOf(e.heat)}</Tag>
                        {e.carried ? <Tag tone="carry">{S.bits.carried}</Tag> : null}
                      </div>
                      <p className="mt-2 leading-snug">
                        <StrivingText text={labels.get(e.aId) ?? ''} />
                      </p>
                      <p className="my-1 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-fault-bright">
                        {S.bits.against}
                      </p>
                      <p className="leading-snug">
                        <StrivingText text={labels.get(e.bId) ?? ''} />
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>

            {/* Choosing a fault line is where the report hands over to the
                paid half. For anyone who has paid this is exactly the button
                it always was. */}
            <div className="mt-6">
              <PaidCta
                to="/fork"
                onClick={() => chosen && go(chosen)}
                disabled={!chosen}
                behind={S.paid.behindFork}
              >
                {S.report.chooseFaultLine}
              </PaidCta>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function Headline({ label, value, suffix, explain }: {
  label: string; value: number | null; suffix?: string; explain?: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-hairline bg-surface/60 px-3.5 py-3">
      <dt className="text-[0.68rem] uppercase tracking-[0.14em] text-muted">{label}</dt>
      <dd className="mt-1 numeral text-2xl">
        {value === null ? <span className="text-muted">—</span> : value}
        {value !== null && suffix ? <span className="text-base text-muted">{suffix}</span> : null}
      </dd>
      {explain ? <dd className="mt-1.5"><Explain>{explain}</Explain></dd> : null}
    </div>
  );
}
