/** §10 /stats — three numbers, each with an honest one-line definition. */
import { S } from '../strings';
import { BADGES } from '../engine/xp';
import {
  useBadges, useCalibration, useCoherence, useCourage, useGraph, useLevel, useXpBreakdown,
} from '../store/selectors';
import { useStore } from '../store/useStore';
import { Explain, Page } from '../components/ui';

export default function Stats() {
  const cal = useCalibration();
  const courage = useCourage();
  const coherence = useCoherence();
  const xp = useXpBreakdown();
  const level = useLevel();
  const earned = useBadges();
  const initial = useStore((s) => s.state.profile.initialConflictLoad);
  const graph = useGraph();

  const earnedIds = new Set(earned.map((b) => b.id));

  return (
    <Page title={S.stats.title}>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label={S.stats.calibration}
          value={cal.score}
          suffix=""
          definition={S.stats.calibrationDef}
          footnote={cal.sufficient ? S.howComputed.acrossReports(cal.n) : S.stats.calibrationThin(cal.n)}
          dimmed={!cal.sufficient}
          explain={
            <div className="space-y-2">
              <p>{S.howComputed.brier}</p>
              <p className="numeral text-muted">
                {cal.brier === null
                  ? S.howComputed.brierNone
                  : `B = ${cal.brier.toFixed(4)} → round((1 − B) × 100) = ${cal.score}`}
              </p>
              {cal.terms.length > 0 ? (
                <p className="numeral text-xs text-muted">
                  {S.howComputed.brierTerms}: {cal.terms.map((t) => t.toFixed(3)).join(', ')}
                </p>
              ) : null}
            </div>
          }
        />
        <StatCard
          label={S.stats.courage}
          value={courage}
          definition={S.stats.courageDef}
          explain={
            <p>{S.howComputed.courage}</p>
          }
        />
        <StatCard
          label={S.stats.coherence}
          value={coherence}
          suffix="%"
          definition={S.stats.coherenceDef}
          footnote={initial === null ? S.stats.coherenceNoBaseline : undefined}
          explain={
            <p className="numeral">
              {initial === null
                ? S.stats.coherenceNoBaseline
                : `1 − (${graph.activeConflictLoad.toFixed(2)} ÷ ${initial.toFixed(2)}) = ${coherence}%`}
            </p>
          }
        />
      </div>

      <section className="mt-12">
        <h2 className="text-sm uppercase tracking-[0.14em] text-muted">{S.stats.level}</h2>
        <div className="card mt-3">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <p className="font-display text-2xl">{level.name}</p>
            <p className="numeral text-muted">
              {xp.total} XP
              {level.nextAt !== null ? <span> · {level.nextAt - xp.total} to {level.nextName}</span> : null}
            </p>
          </div>
          <p className="mt-2 max-w-measure text-sm leading-relaxed text-muted">{level.meaning}</p>
          <div className="mt-4 h-1 w-full overflow-hidden rounded bg-hairline">
            <div className="h-full bg-instrument" style={{ width: `${level.progress * 100}%` }} />
          </div>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-sm uppercase tracking-[0.14em] text-muted">{S.stats.breakdown}</h2>
        <p className="hint max-w-measure">{S.stats.xpDef}</p>
        <ul className="mt-4 divide-y divide-hairline rounded-md border border-hairline">
          {xp.lines.map((l) => (
            <li key={l.source} className={`p-4 ${l.count === 0 ? 'opacity-50' : ''}`}>
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <span>{l.label}</span>
                <span className="numeral text-sm text-muted">
                  {l.count} × {l.unit} = <span className="text-bone">{l.xp}</span>
                </span>
              </div>
              <p className="mt-1.5 max-w-measure text-sm leading-relaxed text-muted">{l.explain}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-sm uppercase tracking-[0.14em] text-muted">{S.stats.badges}</h2>
        <p className="hint">{S.stats.badgesDef}</p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {BADGES.map((b) => {
            const on = earnedIds.has(b.id);
            return (
              <li
                key={b.id}
                className={`rounded-md border p-4 ${
                  on ? 'border-instrument/50 bg-instrument/[0.06]' : 'border-hairline opacity-50'
                }`}
              >
                <p className={on ? 'font-display text-lg' : 'font-display text-lg text-muted'}>
                  {b.name}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{b.description}</p>
              </li>
            );
          })}
        </ul>
      </section>
    </Page>
  );
}

function StatCard({ label, value, suffix, definition, footnote, explain, dimmed = false }: {
  label: string; value: number | null; suffix?: string; definition: string;
  footnote?: string | undefined; explain: React.ReactNode; dimmed?: boolean;
}) {
  return (
    <div className="card">
      <p className="text-xs uppercase tracking-[0.14em] text-muted">{label}</p>
      <p className={`mt-2 numeral text-4xl ${dimmed ? 'text-muted' : 'text-bone'}`}>
        {value === null ? <span className="text-muted">{S.stats.none}</span> : value}
        {value !== null && suffix ? <span className="text-xl text-muted">{suffix}</span> : null}
      </p>
      {footnote ? <p className="mt-1.5 numeral text-xs text-muted">{footnote}</p> : null}
      <p className="mt-3 text-sm leading-relaxed text-muted">{definition}</p>
      <div className="mt-3"><Explain>{explain}</Explain></div>
    </div>
  );
}
