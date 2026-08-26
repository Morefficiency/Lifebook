/**
 * §5 — where the Mirror wizard resumes.
 *
 * The step is derived from persisted state rather than stored, so a refresh mid
 * flow always lands on the same place: the first unanswered question.
 */
import { nextPairNeedingHeat, nextUnratedIndex } from '../data/pairs';
import type { AppState } from '../types';

export const MIN_STRIVINGS = 8;
export const MAX_STRIVINGS = 12;

export type OnboardingStep =
  | 'gate' | 'values' | 'strivings' | 'duels' | 'heat' | 'mirror' | 'done';

export const ONBOARDING_PATH: Record<OnboardingStep, string> = {
  gate: '/',
  values: '/onboarding/values',
  strivings: '/onboarding/strivings',
  duels: '/onboarding/duels',
  heat: '/onboarding/heat',
  mirror: '/onboarding/mirror',
  done: '/map',
};

/** Ordered for the progress indicator; 'gate' and 'done' are not shown as steps. */
export const WIZARD_STEPS: { step: OnboardingStep; label: string }[] = [
  { step: 'values', label: 'Values' },
  { step: 'strivings', label: 'Strivings' },
  { step: 'duels', label: 'Pairs' },
  { step: 'heat', label: 'Heat' },
  { step: 'mirror', label: 'Mirror' },
];

export function onboardingStep(state: AppState): OnboardingStep {
  if (!state.profile.consent) return 'gate';

  // The striving minimum is an elicitation rule, not a rule for the rest of the
  // app's life. Releasing a goal is a first-class win (§6) and routinely takes
  // the count below eight — that must never push someone back into onboarding.
  // Once the Mirror has been completed, only an actually unanswered question
  // (a pair added later and never rated) can send them back into the wizard.
  const preMirror = !state.profile.mirrorCompletedTs;

  if (preMirror) {
    if (!state.values || state.values.chosen.length < 3) return 'values';
    const active = state.strivings.filter((s) => s.status === 'active');
    if (active.length < MIN_STRIVINGS) return 'strivings';
  }

  if (nextUnratedIndex(state.strivings, state.pairRatings) >= 0) return 'duels';
  if (nextPairNeedingHeat(state.strivings, state.pairRatings) >= 0) return 'heat';
  if (preMirror) return 'mirror';
  return 'done';
}

export function isOnboardingComplete(state: AppState): boolean {
  return onboardingStep(state) === 'done';
}

/* ========================================================================== *
 * Lifebook v2 — where to send someone who has already started.
 * ========================================================================== */

import type { LifebookStage } from '../types';
import { MIN_GOALS } from '../content/stages';

export const LIFEBOOK_PATH: Record<LifebookStage, string> = {
  vision: '/vision',
  goals: '/goals',
  pairs: '/pairs',
  mirror: '/mirror',
  current: '/current',
  reflect: '/reflect',
  self_image: '/self-image',
  becoming: '/becoming',
  blueprint: '/blueprint',
};

/**
 * Where someone who has already started belongs.
 *
 * The first Lifebook stage with unfinished business, derived from the data
 * rather than stored — so closing the tab and coming back lands on the same
 * question. Once the blueprint exists, the standing home is the gap dashboard.
 *
 * Someone who has no Lifebook but does have a completed Mirror is sent to the
 * map instead. They arrived through the v1 flow, or restored an export from
 * before the Lifebook stages existed, and pushing them into a journey they
 * never began would look like their work had been thrown away.
 */
export function resumePath(state: AppState): string {
  const lb = state.lifebook;
  const written = lb.visions.filter((v) => v.statement.trim().length > 0);
  const goals = state.strivings.filter((s) => s.status === 'active');

  // Someone with no Lifebook but a completed Mirror came in through the v1
  // flow, or restored an export from before the Lifebook stages existed.
  if (written.length === 0 && isOnboardingComplete(state)) return '/map';
  if (written.length < 3) return LIFEBOOK_PATH.vision;

  // Act two takes priority over act one. Never send somebody backwards past
  // work they have already done: a profile that has been through the belief
  // stages but has no short-form map — which is every profile from before the
  // short form existed — must not be dropped back at the start of act one.
  const startedActTwo = lb.currents.length > 0 || lb.probes.length > 0
    || lb.beliefs.length > 0 || !!lb.stagesCompleted.current;

  if (startedActTwo) {
    if (lb.currents.length < written.length) return LIFEBOOK_PATH.current;
    if (lb.probes.length === 0 && !lb.stagesCompleted.reflect) return LIFEBOOK_PATH.reflect;
    if (lb.beliefs.filter((b) => b.status === 'confirmed').length === 0) return LIFEBOOK_PATH.self_image;
    if (lb.identities.filter((i) => i.text.trim().length > 0).length === 0) return LIFEBOOK_PATH.becoming;
    if (lb.practices.length === 0) return LIFEBOOK_PATH.blueprint;
    return '/gap';
  }

  // Act one: goals, the pairs, the friction ratings, then the map.
  if (goals.length < MIN_GOALS) return LIFEBOOK_PATH.goals;
  if (nextUnratedIndex(state.strivings, state.pairRatings) >= 0) return LIFEBOOK_PATH.pairs;
  if (nextPairNeedingHeat(state.strivings, state.pairRatings) >= 0) return '/friction';
  if (!state.profile.mirrorCompletedTs) return LIFEBOOK_PATH.mirror;

  // Finished the short form and stopped there. That is a complete outcome, not
  // an abandoned funnel, and the map is where they belong on return.
  return '/map';
}
