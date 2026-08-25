/**
 * Derived views over the store. Every number the UI shows comes from here or
 * from src/engine — no component does arithmetic of its own (§3).
 */
import { useMemo } from 'react';
import {
  buildInsightReport, calibration, coherencePercent, computeGraph, computeXp,
  courageCount, earnedBadges, levelFor,
} from '../engine';
import { useStore } from './useStore';
import type { AppState } from '../types';

export const useAppState = (): AppState => useStore((s) => s.state);

export function useGraph() {
  const s = useAppState();
  return useMemo(
    () => computeGraph(s.strivings, s.pairRatings, s.forks),
    [s.strivings, s.pairRatings, s.forks],
  );
}

export function useInsightReport() {
  const s = useAppState();
  return useMemo(
    () => buildInsightReport(s.strivings, s.pairRatings, s.forks),
    [s.strivings, s.pairRatings, s.forks],
  );
}

export function useXpBreakdown() {
  const s = useAppState();
  return useMemo(() => computeXp(s), [s]);
}

export function useLevel() {
  const xp = useStore((s) => s.state.profile.xp);
  return useMemo(() => levelFor(xp), [xp]);
}

export function useBadges() {
  const s = useAppState();
  return useMemo(() => earnedBadges(s), [s]);
}

export function useCalibration() {
  const s = useAppState();
  return useMemo(() => calibration(s.quests, s.reports), [s.quests, s.reports]);
}

export function useCourage() {
  const quests = useStore((s) => s.state.quests);
  return useMemo(() => courageCount(quests), [quests]);
}

export function useCoherence(): number | null {
  const graph = useGraph();
  const initial = useStore((s) => s.state.profile.initialConflictLoad);
  return useMemo(
    () => coherencePercent(graph.activeConflictLoad, initial),
    [graph.activeConflictLoad, initial],
  );
}

/** Full striving text by id, with released ones still resolvable for the ledger. */
export function useStrivingLookup(): Map<string, string> {
  const strivings = useStore((s) => s.state.strivings);
  return useMemo(() => new Map(strivings.map((st) => [st.id, st.text])), [strivings]);
}

export function useActiveQuests() {
  const quests = useStore((s) => s.state.quests);
  return useMemo(() => quests.filter((q) => q.status === 'active'), [quests]);
}
