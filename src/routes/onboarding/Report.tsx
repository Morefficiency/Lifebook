/** §5 A6 / §7.6 — the insight report and the choice of a first fault line. */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { S } from '../../strings';
import { useGraph, useInsightReport, useStrivingLookup } from '../../store/selectors';
import { edgeKey } from '../../engine/graph';
import type { EdgeMetric } from '../../engine/graph';
import { StrivingText, Tag } from '../../components/ui';

export default function InsightReportRoute() {
  const navigate = useNavigate();
  const report = useInsightReport();
  const graph = useGraph();
  const labels = useStrivingLookup();

  const faults = useMemo(
    () => graph.edges.filter((e) => e.kind === 'conflict')
      .slice()
      .sort((a, b) => b.load - a.load || b.heat - a.heat),
    [graph.edges],
  );

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
        <Headline label="Strivings" value={report.headline.strivings} />
        <Headline label="Help links" value={report.headline.helpLinks} />
        <Headline label="Fault lines" value={report.headline.faultLines} />
        <Headline
          label="Conflict index"
          value={report.headline.conflictIndexPercent}
          suffix="%"
        />
      </dl>

      <div className="mt-10 space-y-8">
        {report.sections.map((s) => (
          <section key={s.id}>
            <h2 className="text-sm uppercase tracking-[0.14em] text-instrument">{s.title}</h2>
            <div className="mt-3 max-w-measure space-y-3 leading-relaxed text-bone">
              {s.body.map((p) => (
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
                        <Tag tone="fault">heat {e.heat}/10</Tag>
                        {e.carried ? <Tag tone="carry">carried</Tag> : null}
                      </div>
                      <p className="mt-2 leading-snug">
                        <StrivingText text={labels.get(e.aId) ?? ''} />
                      </p>
                      <p className="my-1 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-fault-bright">
                        against
                      </p>
                      <p className="leading-snug">
                        <StrivingText text={labels.get(e.bId) ?? ''} />
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>

            <button
              type="button"
              className="btn-primary mt-6"
              disabled={!chosen}
              onClick={() => chosen && go(chosen)}
            >
              {S.report.chooseFaultLine}
            </button>
          </>
        )}
      </section>
    </div>
  );
}

function Headline({ label, value, suffix }: { label: string; value: number | null; suffix?: string }) {
  return (
    <div className="rounded-md border border-hairline bg-surface/60 px-3.5 py-3">
      <dt className="text-[0.68rem] uppercase tracking-[0.14em] text-muted">{label}</dt>
      <dd className="mt-1 numeral text-2xl">
        {value === null ? <span className="text-muted">—</span> : value}
        {value !== null && suffix ? <span className="text-base text-muted">{suffix}</span> : null}
      </dd>
    </div>
  );
}
