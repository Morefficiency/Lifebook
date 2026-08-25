/**
 * §7.6 — the insight report.
 *
 * Deterministic template engine. No model, no clock, no randomness: the same
 * ratings always produce the same words. Everything it says is a restatement of
 * numbers the user themselves entered, in the second person, describing ratings
 * rather than the person who made them (Design Law 7, §13).
 */
import { S } from '../strings';
import type { ForkDecision, PairRating, Striving } from '../types';
import { computeGraph } from './graph';

/** §7.6(5) — reproduced verbatim, and never omitted from any report. */
export const HONESTY_PARAGRAPH = S.insight.honesty;

/** Build addendum: layout position is cosmetic and must never be read as data. */
export const POSITION_DISCLAIMER = S.insight.positionDisclaimer;

export type ReportSectionId =
  | 'headline' | 'load_bearing' | 'hottest' | 'cluster' | 'positions' | 'honesty';

export interface ReportSection {
  id: ReportSectionId;
  title: string;
  body: string[];
  /** Rendered as a list under the body — used where naming five things in one
   *  sentence would be unreadable. */
  items?: string[];
}

export interface InsightReport {
  headline: {
    strivings: number;
    helpLinks: number;
    faultLines: number;
    conflictIndexPercent: number | null;
  };
  sections: ReportSection[];
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Renders a striving as it appears mid-sentence: “I typically try to …” without the prefix. */
const quote = (text: string) => `“${text}”`;

function joinList(items: string[]): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0]!;
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

export function buildInsightReport(
  strivings: Striving[],
  pairRatings: PairRating[],
  forks: ForkDecision[],
): InsightReport {
  const g = computeGraph(strivings, pairRatings, forks);
  const active = strivings.filter((s) => s.status === 'active');
  const textById = new Map(active.map((s) => [s.id, s.text]));

  const headline = {
    strivings: active.length,
    helpLinks: g.helpLinkCount,
    faultLines: g.faultLineCount,
    conflictIndexPercent: g.conflictIndexPercent,
  };

  const sections: ReportSection[] = [];

  /* 1 — headline counts */
  const headlineBody: string[] = [];
  headlineBody.push(S.insight.headlineCounts(
    plural(active.length, 'striving', 'strivings'),
    plural(g.helpLinkCount, 'help link', 'help links'),
    plural(g.faultLineCount, 'fault line', 'fault lines'),
  ));
  if (g.conflictIndexPercent !== null) {
    headlineBody.push(S.insight.headlineIndex(g.conflictIndexPercent));
  }
  if (g.faultLineCount === 0) {
    headlineBody.push(S.insight.noFaultLines);
  }
  sections.push({ id: 'headline', title: S.insight.headlineTitle, body: headlineBody });

  /* 2 — load-bearing node */
  if (g.loadBearing) {
    const name = quote(textById.get(g.loadBearing.id) ?? g.loadBearing.id);
    sections.push({
      id: 'load_bearing',
      title: S.insight.loadBearingTitle,
      body: [
        S.insight.loadBearing(name),
        S.insight.loadBearingDegree(
          plural(g.loadBearing.conflictDegree, 'fault line', 'fault lines'),
          g.faultLineCount,
        ),
      ],
    });
  }

  /* 3 — hottest edge */
  if (g.hottestEdge) {
    const a = quote(textById.get(g.hottestEdge.aId) ?? g.hottestEdge.aId);
    const b = quote(textById.get(g.hottestEdge.bId) ?? g.hottestEdge.bId);
    sections.push({
      id: 'hottest',
      title: S.insight.hottestTitle,
      body: [
        S.insight.hottestPair(a, b),
        S.insight.hottestHeat(g.hottestEdge.heat),
      ],
    });
  }

  /* 4 — largest facilitation cluster */
  const cluster = g.clusters.find((c) => c.ids.length >= 2);
  if (cluster) {
    const names = cluster.ids.flatMap((id) => {
      const t = textById.get(id);
      return t ? [quote(t)] : [];
    });
    sections.push({
      id: 'cluster',
      title: S.insight.clusterTitle,
      body: [
        names.length <= 3
          ? S.insight.clusterShort(joinList(names))
          : S.insight.clusterMany(names.length),
        S.insight.clusterBody,
      ],
      ...(names.length > 3 ? { items: names } : {}),
    });
  }

  /* 5 — layout disclaimer (build addendum) */
  sections.push({
    id: 'positions',
    title: S.insight.positionsTitle,
    body: [POSITION_DISCLAIMER],
  });

  /* 6 — honesty paragraph, verbatim, always last */
  sections.push({
    id: 'honesty',
    title: S.insight.honestyTitle,
    body: [HONESTY_PARAGRAPH],
  });

  return { headline, sections };
}
