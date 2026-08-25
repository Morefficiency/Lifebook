/**
 * §8 — Calibration, Courage, Coherence, and the PREDICTION BROKEN rule.
 *
 * The single scoring input from the real world is `fearedOutcomeOccurred`.
 * Nothing here reads outcomes backwards into character (§13): a quest that went
 * badly still pays courage, and a lucky outcome on a forecast the user never
 * believed pays nothing.
 */
import type { EdgeRef, FieldReport, Quest } from '../types';
import { edgeKey } from './graph';

/** The threshold at which a forecast counts as a belief worth breaking. */
export const PREDICTION_BROKEN_THRESHOLD = 60;
/** Below this many reports, Calibration is shown but explicitly marked thin. */
export const CALIBRATION_MIN_N = 3;
/** Courage is behaviour: this much dread, and at least one step actually taken. */
export const COURAGE_FEAR_THRESHOLD = 7;

export function isPredictionBroken(quest: Quest, report: FieldReport): boolean {
  return quest.forecastP >= PREDICTION_BROKEN_THRESHOLD && report.fearedOutcomeOccurred === false;
}

export interface ScoredForecast { forecastP: number; occurred: boolean }

/** B = mean((forecastP/100 − o)²). Null for n = 0 — no evidence is not a perfect score. */
export function brierScore(entries: ScoredForecast[]): number | null {
  if (entries.length === 0) return null;
  const sum = entries.reduce((acc, e) => acc + (e.forecastP / 100 - (e.occurred ? 1 : 0)) ** 2, 0);
  return sum / entries.length;
}

export interface Calibration {
  n: number;
  terms: number[];
  brier: number | null;
  /** round((1 − B) × 100), or null when there is nothing to score. */
  score: number | null;
  /** False below CALIBRATION_MIN_N reports — the UI must say "needs ≥3 reports". */
  sufficient: boolean;
}

/** Pairs each field report with its quest; orphans and duplicates are ignored, not scored. */
export function scoredForecasts(quests: Quest[], reports: FieldReport[]): ScoredForecast[] {
  const byId = new Map(quests.map((q) => [q.id, q]));
  const seen = new Set<string>();
  return [...reports]
    .sort((a, b) => (a.ts < b.ts ? -1 : a.ts > b.ts ? 1 : 0))
    .flatMap((r) => {
      const q = byId.get(r.questId);
      if (!q || seen.has(r.questId)) return [];
      seen.add(r.questId);
      return [{ forecastP: q.forecastP, occurred: r.fearedOutcomeOccurred }];
    });
}

export function calibration(quests: Quest[], reports: FieldReport[]): Calibration {
  const entries = scoredForecasts(quests, reports);
  const terms = entries.map((e) => (e.forecastP / 100 - (e.occurred ? 1 : 0)) ** 2);
  const brier = brierScore(entries);
  return {
    n: entries.length,
    terms,
    brier,
    score: brier === null ? null : Math.round((1 - brier) * 100),
    sufficient: entries.length >= CALIBRATION_MIN_N,
  };
}

/** Courage +1 per quest with fearRating ≥ 7 that reached at least one completed step. */
export function courageCount(quests: Quest[]): number {
  return quests.filter(
    (q) => q.fearRating >= COURAGE_FEAR_THRESHOLD && q.steps.some((s) => s.done),
  ).length;
}

/**
 * Coherence = 1 − (current active conflict load / initial load at mirror completion).
 * Released strivings and carried edges are already 0 in the current load.
 * Deliberately unclamped below 0: if the map has picked up more conflict than it
 * started with, saying so is more useful than saying "0%".
 */
export function coherencePercent(currentLoad: number, initialLoad: number | null): number | null {
  if (initialLoad === null) return null;
  if (initialLoad === 0) return 100;
  return Math.round((1 - currentLoad / initialLoad) * 100);
}

/** §7.5 — two consecutive broken predictions on one edge earn a re-rating prompt. */
export function shouldPromptRerating(edge: EdgeRef, quests: Quest[], reports: FieldReport[]): boolean {
  const key = edgeKey(edge.aId, edge.bId);
  const byId = new Map(quests.map((q) => [q.id, q]));
  const onEdge = reports
    .flatMap((r) => {
      const q = byId.get(r.questId);
      if (!q?.edge || edgeKey(q.edge.aId, q.edge.bId) !== key) return [];
      return [{ quest: q, report: r }];
    })
    .sort((a, b) => (a.report.ts < b.report.ts ? 1 : a.report.ts > b.report.ts ? -1 : 0));

  if (onEdge.length < 2) return false;
  return onEdge.slice(0, 2).every(({ quest, report }) => isPredictionBroken(quest, report));
}

/** How many broken predictions this edge has already collected — drives edge cooling. */
export function brokenPredictionsOnEdge(edge: EdgeRef, quests: Quest[], reports: FieldReport[]): number {
  const key = edgeKey(edge.aId, edge.bId);
  const byId = new Map(quests.map((q) => [q.id, q]));
  return reports.filter((r) => {
    const q = byId.get(r.questId);
    return !!q?.edge && edgeKey(q.edge.aId, q.edge.bId) === key && isPredictionBroken(q, r);
  }).length;
}
