/**
 * What a person has paid for, and what that opens.
 *
 * The shape of the offer, stated once so that the landing page, the route
 * guards and the unlock screen can never drift apart:
 *
 *   FREE      the whole ten-minute promise on the landing page — write the
 *             life you want, list what you are actually doing, rate every
 *             pair, and see the map of where your own goals collide, with the
 *             report that reads it back to you.
 *   PAID      everything after the map: where each area actually is, the
 *             beliefs underneath it, the identities you would have to hold
 *             instead, the standing view of the whole life, the constellation,
 *             and the experiments that test any of it.
 *
 * Three rules this module exists to keep honest:
 *
 *   1. THE PROMISE IS FREE. Every step the landing page advertises resolves to
 *      'free' here. If someone adds a stage to that list without adding it
 *      below, the test suite fails rather than the customer.
 *
 *   2. YOUR DATA IS NEVER HELD. Settings — export, import, delete, sign out —
 *      is free forever, including after a refund. A paywall may withhold a
 *      feature; it may not withhold somebody's own writing.
 *
 *   3. NO PAYWALL WITHOUT A TILL. With no Supabase project configured there is
 *      no way to take money and no server to ask about entitlement, so the
 *      whole app is free. A local-only build is not a crippled build.
 *
 * A note on what this can and cannot enforce. Every computation in Lifebook
 * happens in the browser, and the bundle is public. A determined person can
 * read past any check in this file. That is a deliberate trade: moving the
 * work to a server would end the local-first design, which is the product. So
 * this gate is honest rather than cryptographic — it asks the server who has
 * paid (which cannot be faked by editing localStorage) and then believes the
 * answer. The paying customer is the one being served here, not defeated.
 */

/** Status as the database records it. Anything unknown is treated as 'none'. */
export type EntitlementStatus = 'none' | 'active' | 'refunded';

export interface Entitlement {
  status: EntitlementStatus;
  /** When the purchase was recorded. Null until there is one. */
  grantedAt: string | null;
}

export const NO_ENTITLEMENT: Entitlement = { status: 'none', grantedAt: null };

/** A status string from the wire, narrowed. Anything else is not access. */
export function readStatus(raw: unknown): EntitlementStatus {
  return raw === 'active' || raw === 'refunded' ? raw : 'none';
}

/** Only 'active' opens anything. A refund closes it again. */
export function hasPaid(e: Entitlement | null): boolean {
  return e?.status === 'active';
}

/* -------------------------------------------------------------------------- *
 * The line itself.
 * -------------------------------------------------------------------------- */

export type Tier = 'free' | 'paid';

/**
 * Free routes, exhaustively. Written as a list rather than as "everything not
 * in the paid list" so that a new route is free only when somebody says so,
 * and a route nobody classified fails loudly in the test suite instead of
 * silently becoming one or the other.
 */
export const FREE_ROUTES: readonly string[] = [
  // The front door and the account.
  '/', '/sign-in',
  // The ten-minute promise, in the order the landing page makes it.
  '/vision', '/board', '/goals', '/pairs', '/friction', '/map',
  '/onboarding/values', '/onboarding/strivings', '/onboarding/duels',
  '/onboarding/heat', '/onboarding/mirror', '/onboarding/report',
  // Never chargeable: your own data, and the pages that explain and support
  // the thing you are being asked to pay for.
  '/settings', '/science', '/support', '/unlock',
  '/privacy', '/terms', '/refunds',
];

/** Everything after the map. */
export const PAID_ROUTES: readonly string[] = [
  '/current', '/reflect', '/self-image', '/becoming', '/blueprint',
  '/mirror', '/life', '/constellation', '/print',
  '/quests', '/quest', '/fork', '/forge', '/rerate', '/ledger', '/stats',
];

/**
 * Which side of the line a path falls on.
 *
 * Matches on the first path segment so that '/quest/abc123' is decided by
 * '/quest', and a query string or trailing slash cannot walk somebody through
 * the gate.
 */
export function tierOf(path: string): Tier {
  const clean = path.split('?')[0]!.split('#')[0]!;
  const trimmed = clean.length > 1 ? clean.replace(/\/+$/, '') : clean;
  if (FREE_ROUTES.includes(trimmed)) return 'free';
  if (PAID_ROUTES.includes(trimmed)) return 'paid';
  // Sub-paths: '/quest/abc' → '/quest'. Two segments is as deep as this app goes.
  const head = trimmed.split('/').slice(0, 3).join('/');
  if (FREE_ROUTES.includes(head)) return 'free';
  const first = `/${trimmed.split('/')[1] ?? ''}`;
  if (PAID_ROUTES.includes(first)) return 'paid';
  if (FREE_ROUTES.includes(first)) return 'free';
  // Unknown paths are free: an unclassified route is a bug in this file, and
  // charging for something nobody meant to sell is the worse of the two
  // failures. The catalogue test makes sure the list stays complete.
  return 'free';
}

/**
 * The one question the route guard asks.
 *
 * `sellingEnabled` is false whenever there is no configured project to take
 * money through — see rule 3 above.
 */
export function canOpen(
  path: string,
  entitlement: Entitlement | null,
  sellingEnabled: boolean,
): boolean {
  if (!sellingEnabled) return true;
  if (tierOf(path) === 'free') return true;
  return hasPaid(entitlement);
}
