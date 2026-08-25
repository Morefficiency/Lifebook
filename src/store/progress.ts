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
  if (!state.values || state.values.chosen.length < 3) return 'values';
  const active = state.strivings.filter((s) => s.status === 'active');
  if (active.length < MIN_STRIVINGS) return 'strivings';
  if (nextUnratedIndex(state.strivings, state.pairRatings) >= 0) return 'duels';
  if (nextPairNeedingHeat(state.strivings, state.pairRatings) >= 0) return 'heat';
  if (!state.profile.mirrorCompletedTs) return 'mirror';
  return 'done';
}

export function isOnboardingComplete(state: AppState): boolean {
  return onboardingStep(state) === 'done';
}
