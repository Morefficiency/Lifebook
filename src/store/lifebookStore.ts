/**
 * Lifebook actions, layered onto the same store and the same persistence.
 *
 * Everything here writes through `useStore.setState` and the shared autosave,
 * so a Lifebook change is saved exactly like any other and survives a refresh.
 */
import { nanoid } from 'nanoid';
import { useStore } from './useStore';
import type {
  AreaVision, Cadence, HeldBelief, Importance, LifeArea, Lifebook, LifebookStage,
  PracticeItem, PracticeKind, PracticeLog, ProbeAnswer, TargetIdentity,
} from '../types';

const now = () => new Date().toISOString();

function mutate(fn: (lb: Lifebook) => Lifebook) {
  useStore.getState().applyLifebook(fn);
}

export const lifebook = {
  /* ---------------------------- Stage 1: vision --------------------------- */

  setVision(area: LifeArea, patch: Partial<Omit<AreaVision, 'area' | 'ts'>>) {
    mutate((lb) => {
      const existing = lb.visions.find((v) => v.area === area);
      const next: AreaVision = {
        area,
        statement: patch.statement ?? existing?.statement ?? '',
        markers: patch.markers ?? existing?.markers ?? [],
        importance: (patch.importance ?? existing?.importance ?? 3) as Importance,
        ...(patch.image !== undefined
          ? (patch.image ? { image: patch.image } : {})
          : (existing?.image ? { image: existing.image } : {})),
        ts: now(),
      };
      return {
        ...lb,
        visions: [...lb.visions.filter((v) => v.area !== area), next],
      };
    });
  },

  clearVision(area: LifeArea) {
    mutate((lb) => ({ ...lb, visions: lb.visions.filter((v) => v.area !== area) }));
  },

  /* ---------------------------- Stage 2: current -------------------------- */

  setCurrent(area: LifeArea, score: number, description: string) {
    mutate((lb) => ({
      ...lb,
      currents: [
        ...lb.currents.filter((c) => c.area !== area),
        { area, score, description, ts: now() },
      ],
    }));
  },

  /* ---------------------------- Stage 3: reflect -------------------------- */

  answerProbe(probeId: string, optionIds: string[], note?: string) {
    mutate((lb) => ({
      ...lb,
      probes: [
        ...lb.probes.filter((p) => p.probeId !== probeId),
        { probeId, optionIds, ...(note ? { note } : {}), ts: now() } as ProbeAnswer,
      ],
    }));
  },

  skipProbe(probeId: string) {
    mutate((lb) => ({ ...lb, probes: lb.probes.filter((p) => p.probeId !== probeId) }));
  },

  /* --------------------------- Stage 4: self-image ------------------------ */

  /** Confirming, rejecting or rewriting an offered candidate. */
  ruleOnCandidate(args: {
    candidateId: string; text: string; areas: LifeArea[];
    status: HeldBelief['status']; edited?: boolean;
  }) {
    mutate((lb) => ({
      ...lb,
      beliefs: [
        ...lb.beliefs.filter((b) => b.candidateId !== args.candidateId),
        {
          id: nanoid(),
          candidateId: args.candidateId,
          text: args.text.trim(),
          source: 'offered' as const,
          status: args.status,
          areas: args.areas,
          ts: now(),
        },
      ],
    }));
  },

  /** A belief he wrote himself. Always confirmed — he would not write one he rejects. */
  addOwnBelief(text: string, areas: LifeArea[]) {
    mutate((lb) => ({
      ...lb,
      beliefs: [...lb.beliefs, {
        id: nanoid(), text: text.trim(), source: 'own' as const,
        status: 'confirmed' as const, areas, ts: now(),
      }],
    }));
  },

  removeBelief(id: string) {
    mutate((lb) => ({
      ...lb,
      beliefs: lb.beliefs.filter((b) => b.id !== id),
      identities: lb.identities.filter((i) => i.replacesBeliefId !== id),
    }));
  },

  /* --------------------------- Stage 5: becoming -------------------------- */

  setIdentity(args: { replacesBeliefId: string; text: string; areas: LifeArea[]; edited: boolean }) {
    mutate((lb) => {
      const existing = lb.identities.find((i) => i.replacesBeliefId === args.replacesBeliefId);
      const next: TargetIdentity = {
        id: existing?.id ?? nanoid(),
        text: args.text.trim(),
        replacesBeliefId: args.replacesBeliefId,
        areas: args.areas,
        edited: args.edited,
        ts: now(),
      };
      return {
        ...lb,
        identities: [
          ...lb.identities.filter((i) => i.replacesBeliefId !== args.replacesBeliefId),
          next,
        ],
      };
    });
  },

  /* --------------------------- Stage 6: blueprint ------------------------- */

  addPractice(args: {
    identityId: string; kind: PracticeKind; text: string; cue?: string; cadence: Cadence;
  }) {
    mutate((lb) => ({
      ...lb,
      practices: [...lb.practices, {
        id: nanoid(), identityId: args.identityId, kind: args.kind,
        text: args.text.trim(), ...(args.cue ? { cue: args.cue } : {}),
        cadence: args.cadence, active: true, ts: now(),
      } as PracticeItem],
    }));
  },

  updatePractice(id: string, patch: Partial<Pick<PracticeItem, 'text' | 'cue' | 'cadence' | 'active'>>) {
    mutate((lb) => ({
      ...lb,
      practices: lb.practices.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }));
  },

  removePractice(id: string) {
    mutate((lb) => ({
      ...lb,
      practices: lb.practices.filter((p) => p.id !== id),
      practiceLogs: lb.practiceLogs.filter((l) => l.itemId !== id),
    }));
  },

  /** An affirmation is never logged bare — the evidence is required by the type. */
  logPractice(itemId: string, evidence: string) {
    const log: PracticeLog = { id: nanoid(), itemId, evidence: evidence.trim(), ts: now() };
    mutate((lb) => ({ ...lb, practiceLogs: [...lb.practiceLogs, log] }));
  },

  /* ------------------------------- stages -------------------------------- */

  completeStage(stage: LifebookStage) {
    useStore.getState().completeLifebookStage(stage);
  },
};

export type LifebookActions = typeof lifebook;
