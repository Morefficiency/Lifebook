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
  // v1 — the goal-conflict map and the evidence loop.
  | 'mirror_completed' | 'fork' | 'quest_created' | 'step_done' | 'field_report'
  | 'prediction_broken' | 'release_victory' | 'carry_marked' | 'reassessment'
  | 'annotation' | 'quest_abandoned' | 'level_up' | 'badge_earned'
  // Lifebook — the six stages.
  | 'lifebook_stage' | 'belief_owned' | 'identity_set' | 'practice_logged'
  | 'lifebook_reset';

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
  /** Lifebook v2 — the primary journey. */
  lifebook: Lifebook;
  profile: Profile;
  values: ValuesSelection | null;
  strivings: Striving[];
  pairRatings: PairRating[];
  forks: ForkDecision[];
  quests: Quest[];
  reports: FieldReport[];
  ledger: LedgerEntry[];
}

/* ========================================================================== *
 * LIFEBOOK v2 — Vision → Current → Reflect → Self-image → Becoming → Blueprint
 * See lifebook-v2-spec.md.
 * ========================================================================== */

export type Importance = 1 | 2 | 3 | 4 | 5;

/** Stage 1 — the life he wants in one area. */
export interface AreaVision {
  area: LifeArea;
  /** Present tense, as if already true. */
  statement: string;
  /** Concrete markers of it being true. Free-form, 0–5. */
  markers: string[];
  importance: Importance;
  /** Data URL of a downscaled image the user chose. Local only, never uploaded. */
  image?: string;
  ts: string;
}

/** Stage 2 — where that area actually is now. */
export interface AreaCurrent {
  area: LifeArea;
  /** 1 (nowhere near it) … 10 (already living it). */
  score: number;
  description: string;
  ts: string;
}

/** Stage 3 — one answer to one behaviour / history / environment probe. */
export interface ProbeAnswer {
  probeId: string;
  optionIds: string[];
  note?: string;
  ts: string;
}

export type BeliefSource = 'offered' | 'own';
export type BeliefStatus = 'confirmed' | 'rejected';

/** Stage 4 — a belief the user has ruled on. Nothing is held that he did not confirm. */
export interface HeldBelief {
  id: string;
  /**
   * The catalogue entry this belief resolves to.
   *
   * Set when the belief was offered from the catalogue, and also when the user
   * wrote his own and then said which of the known patterns it most resembles.
   * That second case is what lets a self-written belief inherit a counterpart
   * identity and a programme instead of dead-ending.
   */
  candidateId?: string;
  text: string;
  source: BeliefSource;
  status: BeliefStatus;
  areas: LifeArea[];
  ts: string;
}

/** Stage 5 — who he would have to be instead. Framed as conduct, never as a trait. */
export interface TargetIdentity {
  id: string;
  text: string;
  /** The confirmed belief this replaces, when it has one. */
  replacesBeliefId?: string;
  areas: LifeArea[];
  /** True when the user edited or wrote it rather than accepting the proposal. */
  edited: boolean;
  ts: string;
}

export type PracticeKind = 'thought' | 'behaviour' | 'affirmation';
export type Cadence = 'daily' | 'weekly' | 'when_it_shows_up';

/** Stage 6 — one item in the programme. */
export interface PracticeItem {
  id: string;
  identityId: string;
  kind: PracticeKind;
  text: string;
  /** For a thought swap: the thought to catch, before the replacement. */
  cue?: string;
  cadence: Cadence;
  active: boolean;
  ts: string;
}

/** One logged instance of a practice actually done, with the evidence for it. */
export interface PracticeLog {
  id: string;
  itemId: string;
  /** The concrete thing that happened. An affirmation is never logged bare. */
  evidence: string;
  ts: string;
}

export interface Lifebook {
  visions: AreaVision[];
  currents: AreaCurrent[];
  probes: ProbeAnswer[];
  beliefs: HeldBelief[];
  identities: TargetIdentity[];
  practices: PracticeItem[];
  practiceLogs: PracticeLog[];
  /** Stage completion timestamps, for resuming and for the ledger. */
  stagesCompleted: Partial<Record<LifebookStage, string>>;
}

export type LifebookStage =
  | 'vision' | 'current' | 'reflect' | 'self_image' | 'becoming' | 'blueprint';

export function emptyLifebook(): Lifebook {
  return {
    visions: [], currents: [], probes: [], beliefs: [],
    identities: [], practices: [], practiceLogs: [], stagesCompleted: {},
  };
}
