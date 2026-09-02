/**
 * The offer, checked against the app rather than against itself.
 *
 * The valuable test here is the last one: it reads the route table out of
 * App.tsx and fails if any route has been added without somebody deciding
 * whether it is free or paid. Everything else in this file is arithmetic; that
 * one is the reason the file exists, because the failure it catches — shipping
 * a route nobody classified — is invisible until a customer hits it.
 *
 * Worked cases:
 *
 *   '/pairs'          free  — step 3 of the promise on the landing page
 *   '/map'            free  — step 4, the thing the landing page sells
 *   '/life'           paid  — the standing view, which is act two
 *   '/quest/abc123'   paid  — decided by its head, '/quest'
 *   '/settings'       free  — always, so nobody's writing is ever held
 *   '/life?x=1'       paid  — a query string does not change the answer
 *   '/life/'          paid  — nor does a trailing slash
 */
import { describe, expect, it } from 'vitest';
// Vite hands the file over as text, so this test needs no filesystem access and
// runs the same way in the browser-ish test environment as everything else.
import appSource from '../../App.tsx?raw';
import {
  FREE_ROUTES, NO_ENTITLEMENT, PAID_ROUTES, canOpen, hasPaid, readStatus, tierOf,
} from '../entitlement';

const paid = { status: 'active' as const, grantedAt: '2026-09-01T00:00:00.000Z' };
const refunded = { status: 'refunded' as const, grantedAt: '2026-09-01T00:00:00.000Z' };

describe('status', () => {
  it('treats only the two known strings as meaningful', () => {
    expect(readStatus('active')).toBe('active');
    expect(readStatus('refunded')).toBe('refunded');
    for (const junk of [null, undefined, '', 'ACTIVE', 'paid', 1, {}, 'none']) {
      expect(readStatus(junk)).toBe('none');
    }
  });

  it('opens for active and nothing else', () => {
    expect(hasPaid(paid)).toBe(true);
    expect(hasPaid(refunded)).toBe(false);
    expect(hasPaid(NO_ENTITLEMENT)).toBe(false);
    expect(hasPaid(null)).toBe(false);
  });
});

describe('the line', () => {
  it('puts every step the landing page promises on the free side', () => {
    for (const p of ['/vision', '/board', '/goals', '/pairs', '/friction', '/map']) {
      expect(tierOf(p), p).toBe('free');
    }
  });

  it('puts act two on the paid side', () => {
    for (const p of ['/current', '/reflect', '/self-image', '/becoming', '/blueprint',
      '/life', '/constellation', '/quests', '/ledger', '/stats', '/print']) {
      expect(tierOf(p), p).toBe('paid');
    }
  });

  it('never charges for somebody\'s own data or for the pages that explain the charge', () => {
    for (const p of ['/settings', '/science', '/support', '/unlock',
      '/privacy', '/terms', '/refunds', '/', '/sign-in']) {
      expect(tierOf(p), p).toBe('free');
    }
  });

  it('decides a sub-path by its head', () => {
    expect(tierOf('/quest/abc123')).toBe('paid');
    expect(tierOf('/onboarding/duels')).toBe('free');
  });

  it('is not walked through by a query string, a hash or a trailing slash', () => {
    for (const p of ['/life?upgrade=1', '/life#x', '/life/', '/life//']) {
      expect(tierOf(p), p).toBe('paid');
    }
  });

  it('classifies each route exactly once', () => {
    const both = FREE_ROUTES.filter((r) => PAID_ROUTES.includes(r));
    expect(both).toEqual([]);
  });
});

describe('the gate', () => {
  it('opens everything when there is no way to take money', () => {
    for (const p of [...FREE_ROUTES, ...PAID_ROUTES]) {
      expect(canOpen(p, null, false), p).toBe(true);
    }
  });

  it('holds the paid side shut for someone who has not bought it', () => {
    expect(canOpen('/life', NO_ENTITLEMENT, true)).toBe(false);
    expect(canOpen('/life', null, true)).toBe(false);
    expect(canOpen('/life', paid, true)).toBe(true);
  });

  it('closes again after a refund, but never on the free side', () => {
    expect(canOpen('/life', refunded, true)).toBe(false);
    expect(canOpen('/settings', refunded, true)).toBe(true);
    expect(canOpen('/map', refunded, true)).toBe(true);
  });
});

/* -------------------------------------------------------------------------- *
 * The one that matters.
 * -------------------------------------------------------------------------- */

describe('every route the app actually serves', () => {
  /**
   * Route paths as App.tsx declares them.
   *
   * Redirects are skipped: a route whose element is a <Navigate> has no content
   * of its own to charge for, and the place it sends people is classified in
   * its own right. '/gap' → '/life' is the standing example.
   */
  const declared = (() => {
    return [...appSource.matchAll(/<Route\s+path="([^"]+)"\s+element=\{([^}]*)\}/g)]
      .filter((m) => m[1] !== '*' && !m[2]!.includes('<Navigate'))
      .map((m) => m[1]!);
  })();

  it('finds a route table to check', () => {
    expect(declared.length).toBeGreaterThan(20);
  });

  it('has a decision recorded for every one of them', () => {
    const classified = new Set([...FREE_ROUTES, ...PAID_ROUTES]);
    const unclassified = declared.filter((p) => {
      // ':id' style params are decided by their head, which must be listed.
      const head = p.split('/').filter((seg) => !seg.startsWith(':')).join('/');
      return !classified.has(head === '' ? '/' : head);
    });
    expect(unclassified, `add these to FREE_ROUTES or PAID_ROUTES in engine/entitlement.ts`)
      .toEqual([]);
  });

  it('lists nothing that the app does not serve', () => {
    const heads = new Set(declared.map((p) => {
      const head = p.split('/').filter((seg) => !seg.startsWith(':')).join('/');
      return head === '' ? '/' : head;
    }));
    // The legal and unlock pages are added in this same change; everything else
    // listed must correspond to a real route.
    const stale = [...FREE_ROUTES, ...PAID_ROUTES].filter((r) => !heads.has(r));
    expect(stale, 'these are listed but no longer routed').toEqual([]);
  });
});
