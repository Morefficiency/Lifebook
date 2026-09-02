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

/* ========================================================================== *
 * The offer
 *
 * Lifebook is free up to and including the map — the whole promise the landing
 * page makes. Everything after it is bought once and kept.
 *
 * The price here is display only: what is actually charged is the Stripe price
 * id configured on the create-checkout function, so a mismatch shows the wrong
 * number on the page but cannot charge the wrong amount. Keep them in step.
 * ========================================================================== */

export const PRICE_DISPLAY = '$29';
export const PRICE_CURRENCY = 'USD';
export const PRICE_NOTE = 'one payment, kept for good';

/**
 * Whether there is anywhere to take money.
 *
 * Selling requires an account to attach the purchase to and a server to ask
 * about it, so a build with no Supabase project configured is entirely free —
 * see the note in src/engine/entitlement.ts. Setting this to false in a build
 * that does have a project turns the paywall off without removing it.
 */
export const SELLING_ENABLED_DEFAULT = true;

export function isSellingEnabled(): boolean {
  return SELLING_ENABLED_DEFAULT && isCloudEnabled();
}

/* ========================================================================== *
 * Who is selling this
 *
 * These four values appear in the privacy policy, the terms and the refund
 * policy — the three documents that say who a customer is contracting with and
 * where to complain. They are the operator's facts and cannot be guessed, so
 * they start empty and `npm run check:launch` refuses to pass while they are.
 * A build that ships "[your company]" to a paying customer is worse than a
 * build that fails.
 * ========================================================================== */

/** Legal name of whoever takes the money. A person's own name is fine. */
export const OPERATOR_NAME = import.meta.env['VITE_OPERATOR_NAME'] ?? '';

/** Where support, refund requests and data questions actually arrive. */
export const SUPPORT_EMAIL = import.meta.env['VITE_SUPPORT_EMAIL'] ?? '';

/** Country or state whose law governs the terms, e.g. 'France'. */
export const GOVERNING_LAW = import.meta.env['VITE_GOVERNING_LAW'] ?? '';

/** The date the current terms and privacy policy took effect. */
export const POLICY_UPDATED = import.meta.env['VITE_POLICY_UPDATED'] ?? '';

/** Days within which a refund is given without argument. See /refunds. */
export const REFUND_DAYS = 30;

export function operatorConfigured(): boolean {
  return [OPERATOR_NAME, SUPPORT_EMAIL, GOVERNING_LAW, POLICY_UPDATED]
    .every((v) => v.trim().length > 0);
}

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
