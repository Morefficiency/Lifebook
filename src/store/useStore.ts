/**
 * §3 — application state.
 *
 * One store, one mutation path. Every action goes through `commit`, which
 * applies the change, recomputes the derived profile numbers from scratch
 * (§9 — XP is never accumulated in a counter, so it cannot drift from the
 * evidence behind it), appends any milestone entries the change earned, and
 * writes the whole document to IndexedDB.
 *
 * There are no network calls anywhere in this file or anything it imports.
 */
import { nanoid } from 'nanoid';
import { create } from 'zustand';
import {
  computeGraph, computeXp, coolEdgeHeat, earnedBadgeIds, edgeKey, levelFor,
  badgeById, isPredictionBroken, shouldPromptRerating,
} from '../engine';
import { UNLOCK_KEY } from '../config';
import { emptyState, loadState, saveState, scheduleSave, wipeEverything } from '../data/db';
import { entry } from '../data/ledger';
import type {
  AppState, EdgeRef, Effect, FieldReport, ForkChoice, Heat, LifeArea, Quest,
  QuestStep, Striving,
} from '../types';

const now = () => new Date().toISOString();

export interface QuestDraft {
  edge?: EdgeRef;
  wish: string;
  outcome: string;
  obstacle: string;
  beliefHypothesis: string;
  steps: { ifCue: string; thenAction: string }[];
  fearRating: number;
  forecastP: number;
  fearedOutcomeText: string;
}

export interface ReportDraft {
  fearedOutcomeOccurred: boolean;
  whatHappened: string;
  learning: string;
}

export interface ReportResult { reportId: string; broken: boolean; promptRerating: boolean }

interface Store {
  state: AppState;
  hydrated: boolean;
  unlocked: boolean;
  persistenceError: string | null;

  hydrate: () => Promise<void>;
  setUnlocked: (v: boolean) => void;

  acceptConsent: () => void;
  setValues: (chosen: string[], reflection: string) => void;

  addStriving: (text: string, area?: LifeArea) => void;
  updateStriving: (id: string, patch: Partial<Pick<Striving, 'text' | 'area'>>) => void;
  removeStriving: (id: string) => void;

  ratePair: (aId: string, bId: string, effect: Effect) => void;
  setHeat: (aId: string, bId: string, heat: Heat) => void;
  reratePair: (aId: string, bId: string, effect: Effect, heat?: Heat) => void;

  completeMirror: () => void;
  resetMirror: () => void;

  recordFork: (edge: EdgeRef, choice: ForkChoice, note: string) => void;
  releaseStriving: (args: {
    edge: EdgeRef; strivingId: string; mode: 'retire' | 'revise'; newText?: string; note: string;
  }) => void;

  createQuest: (draft: QuestDraft) => string;
  toggleStep: (questId: string, stepId: string) => void;
  abandonQuest: (questId: string) => void;
  fileReport: (questId: string, draft: ReportDraft) => ReportResult | null;

  annotate: (targetId: string, text: string) => void;

  replaceState: (next: AppState) => Promise<void>;
  deleteEverything: () => Promise<void>;
}

/** Applies a mutation, reconciles derived profile numbers, persists. */
function reconcile(next: AppState, prev: AppState): AppState {
  const xp = computeXp(next).total;
  const prevLevel = levelFor(prev.profile.xp);
  const nextLevel = levelFor(xp);

  const earned = earnedBadgeIds(next);
  const fresh = earned.filter((id) => !prev.profile.badges.includes(id));

  const extra = [
    ...(nextLevel.index > prevLevel.index
      ? [entry(nanoid(), now(), 'level_up', { from: prevLevel.name, to: nextLevel.name, xp })]
      : []),
    ...fresh.map((id) => entry(nanoid(), now(), 'badge_earned', {
      badgeId: id, name: badgeById(id)?.name ?? id,
    })),
  ];

  return {
    ...next,
    ledger: extra.length ? [...next.ledger, ...extra] : next.ledger,
    profile: { ...next.profile, xp, badges: earned },
  };
}

export const useStore = create<Store>((set, get) => {
  const commit = (mutate: (draft: AppState) => AppState) => {
    const prev = get().state;
    const next = reconcile(mutate(prev), prev);
    set({ state: next });
    void scheduleSave(next).catch((err: unknown) => {
      set({ persistenceError: err instanceof Error ? err.message : String(err) });
    });
  };

  return {
    state: emptyState(),
    hydrated: false,
    unlocked: false,
    persistenceError: null,

    hydrate: async () => {
      let unlocked = false;
      try {
        unlocked = localStorage.getItem(UNLOCK_KEY) === '1';
      } catch { /* storage disabled; the gate simply asks again */ }
      try {
        const loaded = await loadState();
        set({ state: loaded ?? emptyState(), hydrated: true, unlocked });
      } catch (err: unknown) {
        set({
          hydrated: true,
          unlocked,
          persistenceError: err instanceof Error ? err.message : String(err),
        });
      }
    },

    setUnlocked: (v) => {
      try {
        if (v) localStorage.setItem(UNLOCK_KEY, '1');
        else localStorage.removeItem(UNLOCK_KEY);
      } catch { /* non-fatal */ }
      set({ unlocked: v });
    },

    acceptConsent: () => commit((s) => ({
      ...s,
      profile: { ...s.profile, consent: { notTherapyAck: true, dataLocalAck: true, ts: now() } },
    })),

    setValues: (chosen, reflection) => commit((s) => ({
      ...s,
      values: { chosen, reflection, ts: now() },
    })),

    addStriving: (text, area) => commit((s) => ({
      ...s,
      strivings: [...s.strivings, {
        id: nanoid(), text: text.trim(), ...(area ? { area } : {}),
        createdTs: now(), status: 'active' as const,
      }],
    })),

    updateStriving: (id, patch) => commit((s) => ({
      ...s,
      strivings: s.strivings.map((st) => (st.id === id ? { ...st, ...patch } : st)),
    })),

    /** Only used before the Mirror is complete; afterwards a goal is released, not deleted. */
    removeStriving: (id) => commit((s) => ({
      ...s,
      strivings: s.strivings.filter((st) => st.id !== id),
      pairRatings: s.pairRatings.filter((r) => r.aId !== id && r.bId !== id),
    })),

    ratePair: (aId, bId, effect) => commit((s) => {
      const key = edgeKey(aId, bId);
      const [a, b] = aId <= bId ? [aId, bId] : [bId, aId];
      const rest = s.pairRatings.filter((r) => edgeKey(r.aId, r.bId) !== key);
      const existing = s.pairRatings.find((r) => edgeKey(r.aId, r.bId) === key);
      // Flipping a pair to non-negative drops any heat it used to carry.
      const heat = effect < 0 ? existing?.heat : undefined;
      return {
        ...s,
        pairRatings: [...rest, {
          aId: a!, bId: b!, effect, ...(heat !== undefined ? { heat } : {}), ts: now(),
        }],
      };
    }),

    setHeat: (aId, bId, heat) => commit((s) => {
      const key = edgeKey(aId, bId);
      return {
        ...s,
        pairRatings: s.pairRatings.map((r) => (edgeKey(r.aId, r.bId) === key ? { ...r, heat } : r)),
      };
    }),

    /** A rating changed because something happened in the real world (§9, +5 XP). */
    reratePair: (aId, bId, effect, heat) => commit((s) => {
      const key = edgeKey(aId, bId);
      const before = s.pairRatings.find((r) => edgeKey(r.aId, r.bId) === key);
      const [a, b] = aId <= bId ? [aId, bId] : [bId, aId];
      const rest = s.pairRatings.filter((r) => edgeKey(r.aId, r.bId) !== key);
      return {
        ...s,
        pairRatings: [...rest, {
          aId: a!, bId: b!, effect,
          ...(effect < 0 && heat !== undefined ? { heat } : {}),
          ts: now(),
        }],
        ledger: [...s.ledger, entry(nanoid(), now(), 'reassessment', {
          type: 'pair_rerating', aId: a!, bId: b!,
          ...(before ? { from: before.effect } : {}), to: effect,
        })],
      };
    }),

    completeMirror: () => commit((s) => {
      if (s.profile.mirrorCompletedTs) return s;
      const g = computeGraph(s.strivings, s.pairRatings, s.forks);
      const ts = now();
      return {
        ...s,
        profile: { ...s.profile, mirrorCompletedTs: ts, initialConflictLoad: g.totalConflictLoad },
        ledger: [...s.ledger, entry(nanoid(), ts, 'mirror_completed', {
          strivings: g.nodes.length,
          faultLines: g.faultLineCount,
          helpLinks: g.helpLinkCount,
          conflictLoad: g.totalConflictLoad,
        })],
      };
    }),

    /** Re-run the rating flow without losing the ledger or any quests. */
    resetMirror: () => commit((s) => ({
      ...s,
      pairRatings: [],
      profile: { ...s.profile, mirrorCompletedTs: null, initialConflictLoad: null },
      ledger: [...s.ledger, entry(nanoid(), now(), 'reassessment', { type: 'remap' })],
    })),

    recordFork: (edge, choice, note) => commit((s) => {
      const ts = now();
      const base = {
        ...s,
        forks: [...s.forks, { id: nanoid(), edge, choice, note: note.trim(), ts }],
        ledger: [...s.ledger, entry(nanoid(), ts, 'fork', { edge, choice, note: note.trim() })],
      };
      if (choice !== 'carry') return base;
      return {
        ...base,
        ledger: [...base.ledger, entry(nanoid(), ts, 'carry_marked', { edge, note: note.trim() })],
      };
    }),

    releaseStriving: ({ edge, strivingId, mode, newText, note }) => commit((s) => {
      const ts = now();
      const target = s.strivings.find((st) => st.id === strivingId);
      const strivings = s.strivings.map((st) => {
        if (st.id !== strivingId) return st;
        return mode === 'retire'
          ? { ...st, status: 'released' as const }
          : { ...st, text: (newText ?? st.text).trim() };
      });
      return {
        ...s,
        strivings,
        forks: [...s.forks, { id: nanoid(), edge, choice: 'release' as const, note: note.trim(), ts }],
        ledger: [
          ...s.ledger,
          entry(nanoid(), ts, 'fork', { edge, choice: 'release', note: note.trim() }),
          entry(nanoid(), ts, 'release_victory', {
            strivingId, text: target?.text ?? '', mode,
            ...(mode === 'revise' && newText ? { newText: newText.trim() } : {}),
            note: note.trim(),
          }),
          ...(mode === 'revise'
            ? [entry(nanoid(), ts, 'reassessment', { type: 'striving_revised' as const, note: note.trim() })]
            : []),
        ],
      };
    }),

    createQuest: (draft) => {
      const id = nanoid();
      commit((s) => {
        const ts = now();
        const steps: QuestStep[] = draft.steps
          .filter((st) => st.ifCue.trim() && st.thenAction.trim())
          .map((st) => ({
            id: nanoid(), ifCue: st.ifCue.trim(), thenAction: st.thenAction.trim(), done: false,
          }));
        const quest: Quest = {
          id,
          ...(draft.edge ? { edge: draft.edge } : {}),
          wish: draft.wish.trim(),
          outcome: draft.outcome.trim(),
          obstacle: draft.obstacle.trim(),
          beliefHypothesis: draft.beliefHypothesis.trim(),
          steps,
          fearRating: draft.fearRating,
          forecastP: draft.forecastP,
          fearedOutcomeText: draft.fearedOutcomeText.trim(),
          status: 'active',
          createdTs: ts,
        };
        return {
          ...s,
          quests: [...s.quests, quest],
          ledger: [...s.ledger, entry(nanoid(), ts, 'quest_created', {
            questId: id, wish: quest.wish,
            ...(quest.edge ? { edge: quest.edge } : {}),
            forecastP: quest.forecastP, fearRating: quest.fearRating,
          })],
        };
      });
      return id;
    },

    toggleStep: (questId, stepId) => commit((s) => {
      const ts = now();
      let logged: ReturnType<typeof entry> | null = null;
      const quests = s.quests.map((q) => {
        if (q.id !== questId) return q;
        return {
          ...q,
          steps: q.steps.map((st) => {
            if (st.id !== stepId) return st;
            const done = !st.done;
            if (done) {
              logged = entry(nanoid(), ts, 'step_done', {
                questId, stepId, ifCue: st.ifCue, thenAction: st.thenAction,
              });
            }
            return done
              ? { ...st, done: true, doneTs: ts }
              : { id: st.id, ifCue: st.ifCue, thenAction: st.thenAction, done: false };
          }),
        };
      });
      return { ...s, quests, ledger: logged ? [...s.ledger, logged] : s.ledger };
    }),

    abandonQuest: (questId) => commit((s) => {
      const q = s.quests.find((x) => x.id === questId);
      return {
        ...s,
        quests: s.quests.map((x) => (x.id === questId ? { ...x, status: 'abandoned' as const } : x)),
        ledger: [...s.ledger, entry(nanoid(), now(), 'quest_abandoned', {
          questId, wish: q?.wish ?? '',
        })],
      };
    }),

    fileReport: (questId, draft) => {
      const quest = get().state.quests.find((q) => q.id === questId);
      if (!quest) return null;

      const reportId = nanoid();
      const report: FieldReport = {
        id: reportId,
        questId,
        fearedOutcomeOccurred: draft.fearedOutcomeOccurred,
        whatHappened: draft.whatHappened.trim(),
        learning: draft.learning.trim(),
        ts: now(),
      };
      const broken = isPredictionBroken(quest, report);

      commit((s) => {
        const ts = report.ts;
        const ledger = [...s.ledger, entry(nanoid(), ts, 'field_report', {
          questId, reportId,
          fearedOutcomeOccurred: report.fearedOutcomeOccurred,
          forecastP: quest.forecastP,
        })];

        // §7.5 — a broken prediction cools its fault line by one heat step.
        let pairRatings = s.pairRatings;
        let cooledTo: number | undefined;
        if (broken && quest.edge) {
          const key = edgeKey(quest.edge.aId, quest.edge.bId);
          pairRatings = s.pairRatings.map((r) => {
            if (edgeKey(r.aId, r.bId) !== key) return r;
            const cooled = coolEdgeHeat(r);
            cooledTo = cooled.heat;
            return cooled;
          });
        }
        if (broken) {
          ledger.push(entry(nanoid(), ts, 'prediction_broken', {
            questId,
            forecastP: quest.forecastP,
            beliefHypothesis: quest.beliefHypothesis,
            ...(quest.edge ? { edge: quest.edge } : {}),
            ...(cooledTo !== undefined ? { cooledTo } : {}),
          }));
        }

        return {
          ...s,
          pairRatings,
          reports: [...s.reports, report],
          quests: s.quests.map((q) => (q.id === questId ? { ...q, status: 'reported' as const } : q)),
          ledger,
        };
      });

      const after = get().state;
      const promptRerating = broken && !!quest.edge
        && shouldPromptRerating(quest.edge, after.quests, after.reports);

      return { reportId, broken, promptRerating };
    },

    annotate: (targetId, text) => commit((s) => ({
      ...s,
      ledger: [...s.ledger, entry(nanoid(), now(), 'annotation', { targetId, text: text.trim() })],
    })),

    replaceState: async (next) => {
      const reconciled = reconcile(next, next);
      set({ state: reconciled });
      await saveState(reconciled);
    },

    deleteEverything: async () => {
      await wipeEverything();
      try { localStorage.removeItem(UNLOCK_KEY); } catch { /* non-fatal */ }
      set({ state: emptyState(), unlocked: false, persistenceError: null });
    },
  };
});
