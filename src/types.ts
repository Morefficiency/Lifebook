// §4 Data model (authoritative). Types here mirror the spec exactly; the engine
// (§8) and XP economy (§9) are pure functions over these shapes.

export const SCHEMA_VERSION = 1 as const;

export type LifeArea =
  | 'health' | 'mind' | 'emotions' | 'character' | 'spirit' | 'partner'
  | 'family' | 'social' | 'money' | 'work' | 'lifestyle' | 'vision';

export const LIFE_AREAS: LifeArea[] = [
  'health', 'mind', 'emotions', 'character', 'spirit', 'partner',
  'family', 'social', 'money', 'work', 'lifestyle', 'vision',
];

export interface ValuesSelection {
  chosen: string[]; // exactly 3 value ids
  reflection: string; // 1–2 sentences on one chosen value
  ts: string;
}

export type StrivingStatus = 'active' | 'released' | 'achieved';

export interface Striving {
  id: string;
  text: string; // completes the frame "I typically try to …"
  area?: LifeArea;
  createdTs: string;
  status: StrivingStatus;
}

export type Effect = -2 | -1 | 0 | 1 | 2;
export type Heat = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface PairRating {
  aId: string;
  bId: string; // aId < bId canonical order; symmetric rating (v1 simplification, §14.1)
  effect: Effect; // -2 very harmful … +2 very helpful (mutual effect)
  heat?: Heat; // only meaningful for effect < 0
  ts: string;
}

export type ForkChoice = 'challenge' | 'release' | 'carry';

export interface EdgeRef { aId: string; bId: string }

export interface ForkDecision {
  id: string;
  edge: EdgeRef;
  choice: ForkChoice;
  note: string; // required, min 20 chars — the articulation is the intervention
  ts: string;
}

export interface QuestStep {
  id: string;
  ifCue: string;
  thenAction: string;
  done: boolean;
  doneTs?: string;
}

export type QuestStatus = 'active' | 'reported' | 'abandoned';

export interface Quest {
  id: string;
  edge?: EdgeRef; // origin fault line (optional: free quests allowed)
  wish: string;
  outcome: string;
  obstacle: string; // WOOP; REQUIRED non-empty (§7.1)
  beliefHypothesis: string; // required for challenge quests
  steps: QuestStep[]; // 1–7 implementation intentions
  fearRating: number; // 0–10
  forecastP: number; // 0–100: probability the FEARED outcome happens
  fearedOutcomeText: string; // concrete, observable
  status: QuestStatus;
  createdTs: string;
}

export interface FieldReport {
  id: string;
  questId: string;
  fearedOutcomeOccurred: boolean; // the single scoring input
  whatHappened: string; // required, min 30 chars
  learning: string; // required if fearedOutcomeOccurred === true
  ts: string;
}

export type LedgerKind =
  | 'mirror_completed' | 'fork' | 'quest_created' | 'step_done' | 'field_report'
  | 'prediction_broken' | 'release_victory' | 'carry_marked' | 'reassessment'
  | 'annotation' | 'quest_abandoned' | 'level_up' | 'badge_earned';

export interface LedgerEntry {
  id: string;
  ts: string;
  kind: LedgerKind;
  /**
   * Typed per kind — see LedgerPayload in src/data/ledger.ts.
   * Entries are never edited. An annotation is itself an append-only entry of
   * kind 'annotation' pointing at the entry it comments on.
   */
  payload: unknown;
}

export interface Profile {
  xp: number;
  badges: string[];
  consent: { notTherapyAck: boolean; dataLocalAck: boolean; ts: string } | null;
  /** Total negative conflict load at mirror completion; baseline for Coherence (§8). */
  initialConflictLoad: number | null;
  mirrorCompletedTs: string | null;
}

export interface AppState {
  version: typeof SCHEMA_VERSION;
  profile: Profile;
  values: ValuesSelection | null;
  strivings: Striving[];
  pairRatings: PairRating[];
  forks: ForkDecision[];
  quests: Quest[];
  reports: FieldReport[];
  ledger: LedgerEntry[];
}
