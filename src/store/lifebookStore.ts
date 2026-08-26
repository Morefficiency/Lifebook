/**
 * Lifebook actions, layered onto the same store and the same persistence.
 *
 * Everything here writes through `useStore.setState` and the shared autosave,
 * so a Lifebook change is saved exactly like any other and survives a refresh.
 */
import { nanoid } from 'nanoid';
import { useStore } from './useStore';
import { STAGE_LABEL } from '../content/stages';
import type {
  AreaVision, Cadence, HeldBelief, Importance, LedgerKind, LifeArea, Lifebook,
  LifebookStage, PracticeItem, PracticeKind, PracticeLog, ProbeAnswer, TargetIdentity,
} from '../types';

const now = () => new Date().toISOString();

function mutate(fn: (lb: Lifebook) => Lifebook) {
  useStore.getState().applyLifebook(fn);
}

/** Same, but the change is recorded in the ledger in the same commit. */
function mutateLogged(fn: (lb: Lifebook) => Lifebook, kind: LedgerKind, payload: unknown) {
  useStore.getState().applyLifebookLogged(fn, kind, payload);
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
    const id = nanoid();
    const belief: HeldBelief = {
      id,
      candidateId: args.candidateId,
      text: args.text.trim(),
      source: 'offered',
      status: args.status,
      areas: args.areas,
      ts: now(),
    };
    const apply = (lb: Lifebook): Lifebook => ({
      ...lb,
      beliefs: [...lb.beliefs.filter((b) => b.candidateId !== args.candidateId), belief],
    });

    // A rejection is a private decision, not a record about the person; only
    // what he takes ownership of goes in the ledger.
    if (args.status === 'confirmed') {
      mutateLogged(apply, 'belief_owned', {
        beliefId: id, text: belief.text, source: 'offered',
      });
    } else {
      mutate(apply);
    }
  },

  /** Undo a rejection, so a misclick is not permanent. */
  unrejectCandidate(candidateId: string) {
    mutate((lb) => ({
      ...lb,
      beliefs: lb.beliefs.filter(
        (b) => !(b.candidateId === candidateId && b.status === 'rejected'),
      ),
    }));
  },

  /**
   * A belief he wrote himself. Always confirmed — he would not write one he
   * rejects.
   *
   * `resembles` is the catalogue entry he said his sentence is a version of.
   * Setting it lets everything downstream — the counterpart identity, the
   * programme — treat it exactly like an offered belief. Leaving it unset is
   * fine too: he then writes his own counterpart and gets the generic
   * scaffold rather than nothing.
   */
  addOwnBelief(text: string, areas: LifeArea[], resembles?: string) {
    const id = nanoid();
    const belief: HeldBelief = {
      id,
      ...(resembles ? { candidateId: resembles } : {}),
      text: text.trim(),
      source: 'own',
      status: 'confirmed',
      areas,
      ts: now(),
    };
    mutateLogged(
      (lb) => ({ ...lb, beliefs: [...lb.beliefs, belief] }),
      'belief_owned',
      { beliefId: id, text: belief.text, source: 'own', ...(resembles ? { resembles } : {}) },
    );
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

  /** Recorded once, when he settles on the wording rather than on every keystroke. */
  commitIdentity(replacesBeliefId: string) {
    const lb = useStore.getState().state.lifebook;
    const identity = lb.identities.find((i) => i.replacesBeliefId === replacesBeliefId);
    if (!identity || identity.text.trim().length === 0) return;
    const already = useStore.getState().state.ledger.some(
      (e) => e.kind === 'identity_set'
        && (e.payload as { identityId?: string }).identityId === identity.id,
    );
    if (already) return;
    useStore.getState().applyLifebookLogged((x) => x, 'identity_set', {
      identityId: identity.id, text: identity.text, replaces: replacesBeliefId,
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
    const item = useStore.getState().state.lifebook.practices.find((p) => p.id === itemId);
    mutateLogged(
      (lb) => ({ ...lb, practiceLogs: [...lb.practiceLogs, log] }),
      'practice_logged',
      { itemId, kind: item?.kind ?? 'behaviour', text: item?.text ?? '', evidence: log.evidence },
    );
  },

  /* ------------------------------- stages -------------------------------- */

  completeStage(stage: LifebookStage) {
    useStore.getState().completeLifebookStage(stage, STAGE_LABEL[stage]);
  },

  reopenBeliefs() { useStore.getState().reopenBeliefs(); },
  resetAll() { useStore.getState().resetLifebook(); },
};

export type LifebookActions = typeof lifebook;
