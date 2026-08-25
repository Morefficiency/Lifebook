/**
 * §4 / §10 — the ledger.
 *
 * Append-only. Nothing in the app ever edits or removes an entry; a later
 * thought is recorded as a separate 'annotation' entry pointing at the one it
 * comments on. Payloads are typed per kind here so the ledger view can render
 * them without guessing.
 */
import { S } from '../strings';
import type { EdgeRef, ForkChoice, LedgerEntry, LedgerKind } from '../types';

export interface LedgerPayloads {
  mirror_completed: { strivings: number; faultLines: number; helpLinks: number; conflictLoad: number };
  fork: { edge: EdgeRef; choice: ForkChoice; note: string };
  quest_created: { questId: string; wish: string; edge?: EdgeRef; forecastP: number; fearRating: number };
  step_done: { questId: string; stepId: string; ifCue: string; thenAction: string };
  field_report: { questId: string; reportId: string; fearedOutcomeOccurred: boolean; forecastP: number };
  prediction_broken: { questId: string; forecastP: number; beliefHypothesis: string; edge?: EdgeRef; cooledTo?: number };
  release_victory: { strivingId: string; text: string; mode: 'retire' | 'revise'; newText?: string; note: string };
  carry_marked: { edge: EdgeRef; note: string };
  reassessment: { type: 'pair_rerating' | 'striving_revised' | 'remap'; aId?: string; bId?: string; from?: number; to?: number; note?: string };
  annotation: { targetId: string; text: string };
  quest_abandoned: { questId: string; wish: string };
  level_up: { from: string; to: string; xp: number };
  badge_earned: { badgeId: string; name: string };
}

export type PayloadOf<K extends LedgerKind> = K extends keyof LedgerPayloads ? LedgerPayloads[K] : unknown;

export function entry<K extends LedgerKind>(
  id: string, ts: string, kind: K, payload: PayloadOf<K>,
): LedgerEntry {
  return { id, ts, kind, payload };
}

export const LEDGER_KIND_LABEL: Record<LedgerKind, string> = S.ledgerKinds;

/** Filter groups offered in the ledger UI (§10). */
export const LEDGER_FILTERS: { id: string; label: string; kinds: LedgerKind[] }[] = [
  { id: 'all', label: S.ledgerFilters.all, kinds: [] },
  { id: 'evidence', label: S.ledgerFilters.evidence, kinds: ['field_report', 'prediction_broken'] },
  { id: 'decisions', label: S.ledgerFilters.decisions, kinds: ['fork', 'release_victory', 'carry_marked', 'reassessment'] },
  { id: 'action', label: S.ledgerFilters.action, kinds: ['quest_created', 'step_done', 'quest_abandoned'] },
  { id: 'milestones', label: S.ledgerFilters.milestones, kinds: ['mirror_completed', 'level_up', 'badge_earned'] },
  { id: 'annotation', label: S.ledgerFilters.annotation, kinds: ['annotation'] },
];

export function annotationsFor(ledger: LedgerEntry[], targetId: string): LedgerEntry[] {
  return ledger.filter(
    (e) => e.kind === 'annotation'
      && (e.payload as LedgerPayloads['annotation'] | undefined)?.targetId === targetId,
  );
}
