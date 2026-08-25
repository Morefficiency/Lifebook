/**
 * §7.6 — the insight report.
 *
 * Deterministic template engine. No model, no clock, no randomness: the same
 * ratings always produce the same words. Everything it says is a restatement of
 * numbers the user themselves entered, in the second person, describing ratings
 * rather than the person who made them (Design Law 7, §13).
 */
import type { ForkDecision, PairRating, Striving } from '../types';
import { computeGraph } from './graph';

/** §7.6(5) — reproduced verbatim, and never omitted from any report. */
export const HONESTY_PARAGRAPH =
  'This map is made entirely of your own answers on one day. It is a mirror, not a verdict — mirrors update. Nothing here measures your worth, your personality, or your future.';

/** Build addendum: layout position is cosmetic and must never be read as data. */
export const POSITION_DISCLAIMER =
  'Where a striving sits on the map means nothing. Only edge colour, edge thickness, edge glow and node size carry information — the positions come from a layout algorithm and would land somewhere else on a second run.';

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
  headlineBody.push(
    `You listed ${plural(active.length, 'striving', 'strivings')}. Rating every pair against every other pair produced ${plural(g.helpLinkCount, 'help link', 'help links')} and ${plural(g.faultLineCount, 'fault line', 'fault lines')}.`,
  );
  if (g.conflictIndexPercent !== null) {
    headlineBody.push(
      `Weighted by how strong each link is and how much the clashes bother you, ${g.conflictIndexPercent}% of the total force in this map is pulling against itself. That figure is a share, not a grade: there is no correct number for it.`,
    );
  }
  if (g.faultLineCount === 0) {
    headlineBody.push(
      'You rated no fault lines at all. Nothing in this map is currently pulling against anything else, so there is no conflict to design an experiment around yet. If that reads as wrong to you, the ratings are the thing to revisit — not the map.',
    );
  }
  sections.push({ id: 'headline', title: 'What you put in', body: headlineBody });

  /* 2 — load-bearing node */
  if (g.loadBearing) {
    const name = quote(textById.get(g.loadBearing.id) ?? g.loadBearing.id);
    sections.push({
      id: 'load_bearing',
      title: 'The load-bearing striving',
      body: [
        `Your ratings put ${name} inside more of your conflicts than anything else. This doesn’t mean ${name} is wrong — it means every fault line runs through it, so any experiment here pays double.`,
        `It sits on ${plural(g.loadBearing.conflictDegree, 'fault line', 'fault lines')} out of ${g.faultLineCount}.`,
      ],
    });
  }

  /* 3 — hottest edge */
  if (g.hottestEdge) {
    const a = quote(textById.get(g.hottestEdge.aId) ?? g.hottestEdge.aId);
    const b = quote(textById.get(g.hottestEdge.bId) ?? g.hottestEdge.bId);
    sections.push({
      id: 'hottest',
      title: 'The hottest fault line',
      body: [
        `${a} against ${b}.`,
        `You rated the discomfort of that clash at ${g.hottestEdge.heat} out of 10. It is the loudest one on the map, which makes it the cheapest place to learn something — not the most urgent thing to fix.`,
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
      title: 'Your existing engine',
      body: [
        names.length <= 3
          ? `${joinList(names)} already feed each other in your ratings.`
          : `${names.length} of your strivings already feed each other in your ratings.`,
        'This part of the map is doing work for you without being asked. It is worth knowing what is already running before you go looking for what to change.',
      ],
      ...(names.length > 3 ? { items: names } : {}),
    });
  }

  /* 5 — layout disclaimer (build addendum) */
  sections.push({
    id: 'positions',
    title: 'How to read the picture',
    body: [POSITION_DISCLAIMER],
  });

  /* 6 — honesty paragraph, verbatim, always last */
  sections.push({
    id: 'honesty',
    title: 'What this is not',
    body: [HONESTY_PARAGRAPH],
  });

  return { headline, sections };
}
