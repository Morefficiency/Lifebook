/** §10 /map — the living map, the active-quest rail, and the three chips. */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { NetworkMap } from '../components/NetworkMap';
import { Explain, StatChip, StrivingText, Tag } from '../components/ui';
import { S } from '../strings';
import { edgeKey } from '../engine/graph';
import type { EdgeMetric } from '../engine/graph';
import {
  useActiveQuests, useCoherence, useGraph, useStrivingLookup, useXpBreakdown,
} from '../store/selectors';
import { useStore } from '../store/useStore';

export default function MapView() {
  const navigate = useNavigate();
  const graph = useGraph();
  const labels = useStrivingLookup();
  const coherence = useCoherence();
  const xp = useXpBreakdown();
  const quests = useActiveQuests();
  const initialLoad = useStore((s) => s.state.profile.initialConflictLoad);

  const [selected, setSelected] = useState<EdgeMetric | null>(null);

  const faults = graph.edges
    .filter((e) => e.kind === 'conflict')
    .slice()
    .sort((a, b) => b.heat - a.heat || b.load - a.load);

  const openFork = (e: EdgeMetric) => {
    navigate(`/fork?a=${encodeURIComponent(e.aId)}&b=${encodeURIComponent(e.bId)}`);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="min-w-0">
        <h1 className="text-2xl sm:text-3xl">{S.map.title}</h1>

        <div className="mt-5 flex flex-wrap gap-3">
          <StatChip
            label={S.map.conflictIndex}
            value={graph.conflictIndexPercent}
            suffix="%"
            explain={
              <ExplainConflictIndex
                load={graph.totalConflictLoad}
                facil={graph.totalFacilitation}
                pct={graph.conflictIndexPercent}
              />
            }
          />
          <StatChip
            label={S.map.coherence}
            value={coherence}
            suffix="%"
            explain={
              <ExplainCoherence
                current={graph.activeConflictLoad}
                initial={initialLoad}
                pct={coherence}
              />
            }
          />
          <StatChip
            label={S.map.xp}
            value={xp.total}
            explain={
              <div className="space-y-2">
                <p>{S.stats.xpDef}</p>
                <ul className="space-y-1">
                  {xp.lines.filter((l) => l.count > 0).map((l) => (
                    <li key={l.source} className="flex justify-between gap-3">
                      <span>{l.label}</span>
                      <span className="numeral text-muted">{l.count} × {l.unit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            }
          />
        </div>

        <div className="mt-6 rounded-lg border border-hairline bg-[#0A0D13] p-2 sm:p-4">
          <NetworkMap
            graph={graph}
            labels={labels}
            onSelectEdge={setSelected}
            selectedKey={selected ? edgeKey(selected.aId, selected.bId) : null}
          />
        </div>
        <p className="mt-3 text-xs text-muted">{S.map.tapHint}</p>
        <p className="mt-1 max-w-measure text-xs text-muted">{S.mirror.legend[4]}</p>

        {selected ? (
          <div className="card mt-5 animate-fade-up">
            <div className="flex flex-wrap items-center gap-2">
              {selected.kind === 'conflict'
                ? <Tag tone={selected.carried ? 'carry' : 'fault'}>heat {selected.heat}/10</Tag>
                : <Tag tone="facil">help link</Tag>}
            </div>
            <p className="mt-3 leading-snug"><StrivingText text={labels.get(selected.aId) ?? ''} /></p>
            <p className="my-1 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-muted">
              {selected.kind === 'conflict' ? 'against' : 'and'}
            </p>
            <p className="leading-snug"><StrivingText text={labels.get(selected.bId) ?? ''} /></p>
            <div className="mt-4 flex gap-3">
              {selected.kind === 'conflict' ? (
                <button type="button" className="btn-primary" onClick={() => openFork(selected)}>
                  {S.map.openFork}
                </button>
              ) : null}
              <button type="button" className="btn-quiet" onClick={() => setSelected(null)}>
                {S.map.deselect}
              </button>
            </div>
          </div>
        ) : null}

        {/* Keyboard and screen-reader path to the same selection the map offers. */}
        <section className="mt-8">
          <h2 className="text-sm uppercase tracking-[0.14em] text-muted">
            Fault lines, hottest first
          </h2>
          {faults.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No fault lines on the map right now.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {faults.map((e) => (
                <li key={edgeKey(e.aId, e.bId)}>
                  <button
                    type="button"
                    onClick={() => openFork(e)}
                    className="w-full rounded-md border border-hairline px-4 py-3 text-left hover:border-fault/50"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Tag tone={e.carried ? 'carry' : 'fault'}>heat {e.heat}/10</Tag>
                      {e.carried ? <Tag tone="carry">carried</Tag> : null}
                    </div>
                    <p className="mt-2 text-sm leading-snug">
                      <StrivingText text={labels.get(e.aId) ?? ''} />
                      <span className="text-fault-bright"> against </span>
                      <StrivingText text={labels.get(e.bId) ?? ''} />
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <aside className="min-w-0">
        <h2 className="text-sm uppercase tracking-[0.14em] text-muted">{S.map.activeQuests}</h2>
        {quests.length === 0 ? (
          <p className="mt-3 text-sm text-muted">{S.quest.empty}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {quests.map((q) => {
              const done = q.steps.filter((s) => s.done).length;
              return (
                <li key={q.id}>
                  <Link
                    to={`/quest/${q.id}`}
                    className="block rounded-md border border-hairline p-4 hover:border-instrument-dim hover:bg-surface"
                  >
                    <p className="leading-snug">{q.wish}</p>
                    <p className="mt-2 numeral text-xs text-muted">
                      {S.quest.stepsDone(done, q.steps.length)} · {S.quest.forecastLine(q.forecastP)}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        <Link to="/onboarding/report" className="btn-ghost mt-6 w-full">
          {S.report.title}
        </Link>
        <Link to="/forge" className="btn-quiet mt-2 w-full">
          {S.quest.newQuest}
        </Link>
      </aside>
    </div>
  );
}

function ExplainConflictIndex({ load, facil, pct }: {
  load: number; facil: number; pct: number | null;
}) {
  return (
    <div className="space-y-2">
      <p>
        Each fault line is weighted <span className="numeral">|effect| × (1 + heat/10)</span>, so a
        strong clash that bothers you a lot counts for more than a mild one you barely notice.
      </p>
      <p className="numeral text-muted">
        conflict {load.toFixed(2)} ÷ (conflict {load.toFixed(2)} + help {facil.toFixed(2)}) ={' '}
        {pct === null ? '—' : `${pct}%`}
      </p>
      <p>
        There is no correct value. It is the share of the force in your map that pulls against
        itself, on the day you rated it.
      </p>
    </div>
  );
}

function ExplainCoherence({ current, initial, pct }: {
  current: number; initial: number | null; pct: number | null;
}) {
  return (
    <div className="space-y-2">
      <p>{S.stats.coherenceDef}</p>
      {initial === null ? (
        <p className="text-muted">{S.stats.coherenceNoBaseline}</p>
      ) : (
        <p className="numeral text-muted">
          1 − ({current.toFixed(2)} ÷ {initial.toFixed(2)}) = {pct === null ? '—' : `${pct}%`}
        </p>
      )}
      <Explain label="Why can it be negative?">
        <p className="text-sm">
          If you re-rate pairs and the map picks up more conflict than it started with, this drops
          below zero. It is not clamped, because hiding that would make the number less useful.
        </p>
      </Explain>
    </div>
  );
}
