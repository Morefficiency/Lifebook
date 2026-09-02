/**
 * Asking the server who has paid.
 *
 * The client never decides this and never caches it anywhere a person could
 * edit. It is read from the database on sign-in, on returning from checkout,
 * and when the app regains focus after being away — and held in memory only,
 * so closing the tab forgets it and the next answer comes from the server
 * again. localStorage would be one devtools line away from being a licence.
 */
import { supabase } from './supabase';
import { NO_ENTITLEMENT, readStatus, type Entitlement } from '../engine/entitlement';

/**
 * The current user's entitlement, or null when it could not be established.
 *
 * Null is deliberately distinct from NO_ENTITLEMENT. "We could not ask" and
 * "they have not bought it" are different situations: the first must not lock
 * a paying customer out of what they own because their train went into a
 * tunnel, and the caller decides how to treat it.
 */
export async function fetchEntitlement(): Promise<Entitlement | null> {
  const sb = supabase();
  if (!sb) return null;

  const { data, error } = await sb
    .from('entitlements')
    .select('status, granted_at')
    .maybeSingle();

  if (error) {
    // A real failure — offline, or the table is not migrated yet. Say so rather
    // than reporting "has not paid", which would be a lie with consequences.
    console.warn('could not read entitlement', error.message);
    return null;
  }
  // No row is the normal state for someone who has not bought it.
  if (!data) return NO_ENTITLEMENT;

  return {
    status: readStatus(data.status),
    grantedAt: typeof data.granted_at === 'string' ? data.granted_at : null,
  };
}

/**
 * Start checkout and hand back the URL to send the browser to.
 *
 * Throws with a message meant to be shown to a person, because every failure
 * here happens while somebody is actively trying to pay and a silent one costs
 * a sale.
 */
export async function startCheckout(): Promise<string> {
  const sb = supabase();
  if (!sb) throw new Error('Purchasing is not available in this build.');

  const { data: sessionData } = await sb.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error('Sign in first, so the purchase has somewhere to go.');

  const { data, error } = await sb.functions.invoke<{ url?: string; error?: string }>(
    'create-checkout',
    { body: {} },
  );

  if (error) {
    console.error('create-checkout failed', error);
    throw new Error('Could not reach the checkout. Try again in a moment.');
  }
  if (data?.error === 'already purchased') {
    // Not an error worth alarming anyone with — they already own it.
    throw new Error('You already own this. Reload the page to unlock it.');
  }
  if (!data?.url) throw new Error('Could not start the checkout. Try again in a moment.');
  return data.url;
}

/**
 * Poll for an entitlement that is expected imminently.
 *
 * Stripe redirects the browser back the moment payment succeeds, which is
 * usually a little before the webhook has been delivered and written the row.
 * Rather than show a paying customer a locked screen, ask again a few times
 * over roughly fifteen seconds.
 */
export const POLL_DELAYS_MS: readonly number[] = [0, 1000, 2000, 3000, 4000, 5000];

export async function waitForEntitlement(
  sleep: (ms: number) => Promise<void> = (ms) => new Promise((r) => setTimeout(r, ms)),
): Promise<Entitlement | null> {
  let last: Entitlement | null = null;
  for (const delay of POLL_DELAYS_MS) {
    if (delay > 0) await sleep(delay);
    last = await fetchEntitlement();
    if (last?.status === 'active') return last;
  }
  return last;
}
