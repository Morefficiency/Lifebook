/**
 * Access codes.
 *
 * Since accounts arrived this is no longer the front door — it is an optional
 * gate on *sign-up*, for when you want only people with a code to be able to
 * create an account. Set ACCESS_MODE to 'code' to turn it on.
 *
 * Codes are still checked in the browser, so they gate honestly rather than
 * cryptographically: anyone willing to read the bundle can find the list.
 */
export type AccessMode = 'open' | 'code';
export const ACCESS_MODE: AccessMode = 'open';

/** Codes are compared case-insensitively after trimming. */
export const ACCESS_CODES: string[] = ['COHERENCE-V1'];

/** External purchase link. No payment is processed inside this app. */
export const PURCHASE_URL = 'https://example.com/coherence';

/** localStorage key for the unlock flag — the only thing this app puts there. */
export const UNLOCK_KEY = 'coherence.unlocked';

/* ========================================================================== *
 * Accounts (Supabase)
 *
 * Both values are public by design — the anon key is meant to be shipped in the
 * bundle, and every table it can reach is protected by row-level security, so
 * it grants nothing beyond "you may act as whoever is signed in". See
 * supabase/migrations/0001_init.sql.
 *
 * With neither set the app runs exactly as it did before accounts existed:
 * everything local, nothing synced, no sign-in screen.
 * ========================================================================== */

export const SUPABASE_URL = import.meta.env['VITE_SUPABASE_URL'] ?? '';
export const SUPABASE_ANON_KEY = import.meta.env['VITE_SUPABASE_ANON_KEY'] ?? '';

export function isCloudEnabled(): boolean {
  return SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;
}

/** Google sign-in is offered only when it has been configured in Supabase. */
export const ENABLE_GOOGLE_SIGN_IN =
  (import.meta.env['VITE_ENABLE_GOOGLE'] ?? 'true') !== 'false';

/**
 * When true, creating an account requires one of ACCESS_CODES. Signing in to an
 * existing account never does — a paying user who cleared their browser must
 * not be locked out by a code they no longer have.
 */
export const GATE_SIGN_UP: boolean = (ACCESS_MODE as AccessMode) === 'code';

export function isValidAccessCode(input: string): boolean {
  const needle = input.trim().toLowerCase();
  if (needle.length === 0) return false;
  return ACCESS_CODES.some((c) => c.trim().toLowerCase() === needle);
}
