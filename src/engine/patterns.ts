/**
 * Patterns the person never named.
 *
 * Everything else in Lifebook offers beliefs from what a person says about
 * themselves. This reads what they did — the record of experiments, forecasts
 * and outcomes — and offers what it adds up to. Offers, never assertions: each
 * one is a question, carries the evidence it came from, and points at the one
 * screen where the person can do something about it.
 *
 * Three kinds:
 *
 *   calibration   In one area of life, the feared thing is forecast at one rate
 *                 and happens at another. A habit of prediction, or a belief —
 *                 the person decides which.
 *   avoidance     An area they rated important, in which they have never run a
 *                 single test — once they have run enough elsewhere for that to
 *                 be a choice rather than a beginning.
 *   held          A belief that credence.ts finds held against the record: the
 *                 person still predicts what their own results stopped
 *                 predicting.
 *
 * Design Law 5 — the user is the only source of truth about the user — is kept
 * the way it is kept everywhere else here: no number is inferred *about* the
 * person, every number is their own record added up, and the sentence stops
 * before it says what the pattern means. Nothing is offered below its minimum
 * n, because an offer from two data points is a guess, and a guess is exactly
 * what this app promised never to make.
 */
import type { AppState, FieldReport, HeldBelief, LifeArea, Quest } from '../types';
import { areaName } from '../content/areas';
import { beliefCredence, type BeliefCredence } from './credence';

export const CALIBRATION_MIN_REPORTS = 3;
/** |mean forecast − occurrence rate| at or above this is worth a question. */
export const CALIBRATION_BIAS_AT = 0.3;
export const AVOIDANCE_MIN_IMPORTANCE = 4;
/** Nobody is "avoiding" anything until they have run this many tests anywhere. */
export const AVOIDANCE_MIN_QUESTS = 3;

/* -------------------------------------------------------------------------- *
 * Calibration.
 * -------------------------------------------------------------------------- */

export interface AreaCalibration {
  area: LifeArea;
  n: number;
  occurred: number;
  /** The quests counted, sorted — so two areas fed by the same reports can be told apart from two fed by different ones. */
  questIds: string[];
  /** Mean forecastP across the counted reports, 0–1. */
  meanForecast: number;
  /** occurred / n. */
  rate: number;
  /** meanForecast − rate. Positive: predicts worse than happens. */
  bias: number;
}

/**
 * Forecast against outcome, per life area, for areas with enough reports.
 *
 * A report reaches an area through the belief its quest was testing; a belief
 * on two areas puts its reports on both, because the person said it sits on
 * both. Only the first report per quest counts, as everywhere else.
 */
export function areaCalibration(
  beliefs: HeldBelief[],
  quests: Quest[],
  reports: FieldReport[],
): AreaCalibration[] {
  const beliefById = new Map(beliefs.map((b) => [b.id, b]));
  const questById = new Map(quests.map((q) => [q.id, q]));
  const seen = new Set<string>();
  const acc = new Map<LifeArea, { forecasts: number[]; occurred: number; questIds: string[] }>();

  for (const r of reports) {
    const q = questById.get(r.questId);
    if (!q?.beliefId || seen.has(q.id)) continue;
    const b = beliefById.get(q.beliefId);
    if (!b) continue;
    seen.add(q.id);
    for (const area of new Set(b.areas)) {
      const row = acc.get(area) ?? { forecasts: [], occurred: 0, questIds: [] };
      row.forecasts.push(q.forecastP / 100);
      row.questIds.push(q.id);
      if (r.fearedOutcomeOccurred) row.occurred += 1;
      acc.set(area, row);
    }
  }

  const out: AreaCalibration[] = [];
  for (const [area, row] of acc) {
    const n = row.forecasts.length;
    if (n < CALIBRATION_MIN_REPORTS) continue;
    const meanForecast = row.forecasts.reduce((s, f) => s + f, 0) / n;
    const rate = row.occurred / n;
    out.push({
      area, n, occurred: row.occurred, meanForecast, rate, bias: meanForecast - rate,
      questIds: [...row.questIds].sort(),
    });
  }
  return out.sort((a, b) => Math.abs(b.bias) - Math.abs(a.bias) || (a.area < b.area ? -1 : 1));
}

/* -------------------------------------------------------------------------- *
 * The offers.
 * -------------------------------------------------------------------------- */

export type OfferKind = 'calibration' | 'avoidance' | 'held';

export interface Offer {
  kind: OfferKind;
  /** Stable across renders, so the UI can key on it. */
  id: string;
  area?: LifeArea;
  /** For a calibration offer: every area the same reports sit on. */
  areas?: LifeArea[];
  beliefId?: string;
  /** The lines the question stands on. Shown, never hidden behind it. */
  evidence: string[];
  /** Always a question. The person answers it, or does not. */
  question: string;
  /** Where to go to do something about it. */
  to: string;
}

const pct = (x: number) => `${Math.round(x * 100)}%`;

/** "Money, Work & Craft and Life Vision" — a list a sentence can hold. */
function listNames(areas: LifeArea[]): string {
  const names = areas.map(areaName);
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

/**
 * One card per distinct body of evidence, not one per area.
 *
 * A belief the person put on four areas puts its reports on all four, and
 * without this the same three experiments would come back as four cards
 * saying the same thing. Areas fed by exactly the same quests are folded into
 * one offer that names them all; areas fed by different quests stay separate,
 * because then the numbers really are different.
 */
function calibrationOffers(rows: AreaCalibration[]): Offer[] {
  const groups = new Map<string, AreaCalibration[]>();
  for (const r of rows) {
    if (Math.abs(r.bias) < CALIBRATION_BIAS_AT) continue;
    const key = r.questIds.join('|');
    groups.set(key, [...(groups.get(key) ?? []), r]);
  }

  return [...groups.values()].map((group) => {
    const r = group[0]!;
    const areas = group.map((g) => g.area).sort();
    const where = listNames(areas);
    const overshoots = r.bias > 0;
    return {
      kind: 'calibration',
      id: `calibration:${areas.join('+')}`,
      area: areas[0]!,
      areas,
      evidence: [
        `In ${where} you have forecast the feared outcome at ${pct(r.meanForecast)} on average.`,
        `It has happened ${r.occurred} of ${r.n} times.`,
      ],
      question: overshoots
        ? `Is that a belief about ${where}, or a habit of prediction?`
        : `In ${where} the feared thing happens more often than you expect it to. What do you know that you are not saying in the forecast?`,
      to: '/quests',
    };
  });
}

function avoidanceOffers(state: AppState): Offer[] {
  const { lifebook, quests } = state;
  if (quests.length < AVOIDANCE_MIN_QUESTS) return [];

  const beliefById = new Map(lifebook.beliefs.map((b) => [b.id, b]));
  const tested = new Set<LifeArea>();
  for (const q of quests) {
    const b = q.beliefId ? beliefById.get(q.beliefId) : undefined;
    for (const a of b?.areas ?? []) tested.add(a);
  }

  return lifebook.visions
    .filter((v) => v.importance >= AVOIDANCE_MIN_IMPORTANCE && !tested.has(v.area))
    .sort((a, b) => b.importance - a.importance || (a.area < b.area ? -1 : 1))
    .map((v) => {
      const name = areaName(v.area);
      return {
        kind: 'avoidance',
        id: `avoidance:${v.area}`,
        area: v.area,
        evidence: [
          `You rated ${name} ${v.importance} out of 5.`,
          `You have run ${quests.length} experiments. None of them touched it.`,
        ],
        question: `Is that a choice?`,
        to: '/forge',
      };
    });
}

function heldOffers(rows: BeliefCredence[], beliefs: HeldBelief[]): Offer[] {
  const text = new Map(beliefs.map((b) => [b.id, b.text]));
  return rows
    .filter((c) => c.held)
    .sort((a, b) => (b.resistance ?? 0) - (a.resistance ?? 0) || (a.beliefId < b.beliefId ? -1 : 1))
    .map((c) => ({
      kind: 'held',
      id: `held:${c.beliefId}`,
      beliefId: c.beliefId,
      evidence: [
        `“${text.get(c.beliefId) ?? ''}”`,
        `Tested ${c.tested} times. The feared thing happened ${c.occurred}.`,
        `Your most recent forecast of it was ${pct(c.statedRate ?? 0)}.`,
      ],
      question: `Your record has stopped predicting this. Have you?`,
      to: '/self-image',
    }));
}

/** Every offer the record supports, most striking first within each kind. */
export function offers(state: AppState): Offer[] {
  const { lifebook, quests, reports } = state;
  const confirmed = lifebook.beliefs.filter((b) => b.status === 'confirmed');
  return [
    ...heldOffers(beliefCredence(confirmed, quests, reports), confirmed),
    ...calibrationOffers(areaCalibration(confirmed, quests, reports)),
    ...avoidanceOffers(state),
  ];
}
