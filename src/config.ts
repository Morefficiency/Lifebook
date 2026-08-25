/**
 * §12 — access gate.
 *
 * Codes are checked in the browser. This gates honestly, not cryptographically:
 * anyone willing to read the bundle can find the list. That is an accepted v1
 * trade-off (§14.3) — the gate exists to ask for a deliberate act of intent, not
 * to defend a secret.
 */
export const ACCESS_MODE: 'open' | 'code' = 'code';

/** Codes are compared case-insensitively after trimming. */
export const ACCESS_CODES: string[] = ['COHERENCE-V1'];

/** External purchase link. No payment is processed inside this app. */
export const PURCHASE_URL = 'https://example.com/coherence';

/** localStorage key for the unlock flag — the only thing this app puts there. */
export const UNLOCK_KEY = 'coherence.unlocked';

export function isValidAccessCode(input: string): boolean {
  const needle = input.trim().toLowerCase();
  if (needle.length === 0) return false;
  return ACCESS_CODES.some((c) => c.trim().toLowerCase() === needle);
}
