/** §10 /stats — three numbers, each with an honest one-line definition. */
import { S } from '../strings';
import { STAGE_LABEL, STAGE_ORDER } from '../content/stages';
import { BADGES } from '../engine/xp';
import { lifeGapPercent } from '../engine/gap';
import { practiceProgress } from '../engine/programme';
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
  const lb = useStore((s) => s.state.lifebook);

  const hasLifebook = lb.visions.length > 0;
  const hasMap = useStore((s) => !!s.state.profile.mirrorCompletedTs);
  const gap = lifeGapPercent(lb.visions, lb.currents);
  const progress = practiceProgress(lb.practices, lb.practiceLogs);
  const confirmed = lb.beliefs.filter((b) => b.status === 'confirmed').length;

  const earnedIds = new Set(earned.map((b) => b.id));

  return (
    <Page title={S.stats.title}>
      {hasLifebook ? (
        <section className="mb-12">
          <h2 className="text-sm uppercase tracking-[0.14em] text-muted">The Lifebook</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Distance left"
              value={gap}
              suffix="%"
              definition="How far the life you have is from the life you wrote, weighted by how much you said each area matters. It is a description of two sets of your own answers, not a score."
              explain={
                <p>
                  For each area: (10 − where it is) ÷ 9, times how much it matters,
                  summed and divided by the total importance. Areas you have not
                  rated on both sides are left out rather than counted as zero.
                </p>
              }
            />
            <StatCard
              label="Beliefs owned"
              value={confirmed}
              definition="How many sentences about yourself you have looked at and said were yours. Nothing counts here that you did not confirm."
              explain={
                <p>
                  A count of confirmed beliefs — offered ones you said yes to, plus
                  any you wrote yourself. Rejections are not counted, in either
                  direction.
                </p>
              }
            />
            <StatCard
              label="Instances logged"
              value={progress.logged}
              definition="Times you did something from the programme and wrote down what actually happened. This is the only number here that came from outside the app."
              footnote={progress.active > 0
                ? `Across ${progress.practisedItems} of ${progress.active} active practices.`
                : undefined}
              explain={
                <p>
                  One per logged instance. An affirmation cannot be logged without
                  the concrete thing it was true of, so every one of these has a
                  real event behind it.
                </p>
              }
            />
          </div>

          <ol className="mt-6 flex flex-wrap gap-2">
            {STAGE_ORDER.map((stage) => {
              const done = !!lb.stagesCompleted[stage];
              return (
                <li
                  key={stage}
                  className={`rounded border px-2.5 py-1.5 text-xs ${
                    done ? 'border-facil/50 bg-facil/10 text-facil-bright'
                      : 'border-hairline text-muted'
                  }`}
                >
                  {done ? '✓ ' : ''}{STAGE_LABEL[stage]}
                </li>
              );
            })}
          </ol>
        </section>
      ) : null}

      {hasMap ? (
        <h2 className="mb-4 text-sm uppercase tracking-[0.14em] text-muted">
          The conflict map
        </h2>
      ) : null}

      <div className={`grid gap-4 sm:grid-cols-3 ${hasMap || !hasLifebook ? '' : 'hidden'}`}>
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
