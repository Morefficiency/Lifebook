/** §10 /map — the living map, the active-quest rail, and the three chips. */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapFrame, NetworkMap } from '../components/NetworkMap';
import { Explain, StatChip, StrivingText, Tag } from '../components/ui';
import { S } from '../strings';
import { PaidCta } from '../components/PaidCta';
import { conflictEdgesByHeat, edgeKey } from '../engine/graph';
import type { EdgeMetric } from '../engine/graph';
import {
  useActiveQuests, useCoherence, useGraph, useStrivingLookup, useXpBreakdown,
} from '../store/selectors';
import { useStore } from '../store/useStore';

/** Long lists bury the thing you came for; the rest are one tap away. */
const FAULTS_SHOWN = 8;

export default function MapView() {
  const navigate = useNavigate();
  const graph = useGraph();
  const labels = useStrivingLookup();
  const coherence = useCoherence();
  const xp = useXpBreakdown();
  const quests = useActiveQuests();
  const initialLoad = useStore((s) => s.state.profile.initialConflictLoad);

  const [selected, setSelected] = useState<EdgeMetric | null>(null);
  const [showAllFaults, setShowAllFaults] = useState(false);

  const faults = conflictEdgesByHeat(graph);

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

        <div className="mt-6">
          <MapFrame>
            <NetworkMap
              graph={graph}
              labels={labels}
              onSelectEdge={setSelected}
              selectedKey={selected ? edgeKey(selected.aId, selected.bId) : null}
            />
          </MapFrame>
        </div>
        <p className="mt-3 text-xs text-muted">{S.map.tapHint}</p>
        <p className="mt-1 max-w-measure text-xs text-muted">{S.mirror.legend[4]}</p>

        {selected ? (
          <div className="card mt-5 animate-fade-up">
            <div className="flex flex-wrap items-center gap-2">
              {selected.kind === 'conflict'
                ? <Tag tone={selected.carried ? 'carry' : 'fault'}>{S.bits.heatOf(selected.heat)}</Tag>
                : <Tag tone="facil">{S.bits.helpLink}</Tag>}
            </div>
            <p className="mt-3 leading-snug"><StrivingText text={labels.get(selected.aId) ?? ''} /></p>
            <p className="my-1 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-muted">
              {selected.kind === 'conflict' ? S.bits.against : S.bits.and}
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
            {S.bits.faultLinesHottest}
          </h2>
          {faults.length === 0 ? (
            <p className="mt-3 text-sm text-muted">{S.bits.noFaultLinesNow}</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {(showAllFaults ? faults : faults.slice(0, FAULTS_SHOWN)).map((e) => (
                <li key={edgeKey(e.aId, e.bId)}>
                  <button
                    type="button"
                    onClick={() => openFork(e)}
                    className="w-full rounded-md border border-hairline px-4 py-3 text-left hover:border-fault/50"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Tag tone={e.carried ? 'carry' : 'fault'}>
                        {Math.abs(e.effect) === 2 ? S.bits.stronglyConflicting : S.bits.conflicting}
                      </Tag>
                      <Tag tone={e.carried ? 'carry' : 'fault'}>{S.bits.heatOf(e.heat)}</Tag>
                      {e.carried ? <Tag tone="carry">{S.bits.carried}</Tag> : null}
                    </div>
                    <p className="mt-2 text-sm leading-snug">
                      <StrivingText text={labels.get(e.aId) ?? ''} />
                      <span className="text-fault-bright"> {S.bits.against} </span>
                      <StrivingText text={labels.get(e.bId) ?? ''} />
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {faults.length > FAULTS_SHOWN ? (
            <button
              type="button"
              className="btn-quiet mt-3 px-0 text-sm"
              onClick={() => setShowAllFaults((v) => !v)}
            >
              {showAllFaults ? S.bits.showFewerFaults : S.bits.showAllFaults(faults.length)}
            </button>
          ) : null}
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

        {/* The report is the last free thing; forging an experiment is the
            first paid one. Saying so here, at the point where somebody reaches
            for it, is the difference between a door and an ambush. */}
        <Link to="/onboarding/report" className="btn-ghost mt-6 w-full">
          {S.report.title}
        </Link>
        <div className="mt-2">
          <PaidCta to="/forge" className="btn-quiet w-full" behind={S.paid.behindForge}>
            {S.quest.newQuest}
          </PaidCta>
        </div>
      </aside>
    </div>
  );
}

function ExplainConflictIndex({ load, facil, pct }: {
  load: number; facil: number; pct: number | null;
}) {
  return (
    <div className="space-y-2">
      <p>{S.howComputed.conflictIndexFormula}</p>
      <p className="numeral text-muted">
        conflict {load.toFixed(2)} ÷ (conflict {load.toFixed(2)} + help {facil.toFixed(2)}) ={' '}
        {pct === null ? '—' : `${pct}%`}
      </p>
      <p>{S.howComputed.conflictIndexNoCorrect}</p>
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
      <Explain label={S.howComputed.coherenceNegativeLabel}>
        <p className="text-sm">{S.howComputed.coherenceNegative}</p>
      </Explain>
    </div>
  );
}
