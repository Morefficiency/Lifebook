/**
 * The offer.
 *
 * This is the only screen in Lifebook whose job is to persuade, and the app's
 * whole posture makes that a narrow job: no countdown, no false scarcity, no
 * "3 people bought this today", no dark pattern where the decline button is a
 * grey whisper. The argument is meant to be the list of what is behind the
 * wall, and it is meant to be accurate.
 *
 * Five states, and getting the order right matters more than the copy:
 *
 *   owned      they already paid — say so and get out of the way
 *   returning  ?paid=1, the webhook may not have landed yet, so poll before
 *              ever showing this person a buy button again
 *   unknown    entitlement could not be established; do not imply they have
 *              not paid, offer to check again
 *   cancelled  ?cancelled=1 — reassure, do not nag
 *   offer      the default
 */
import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { PRICE_DISPLAY, PRICE_NOTE, REFUND_DAYS, isSellingEnabled } from '../config';
import { useStore } from '../store/useStore';
import { startCheckout, waitForEntitlement } from '../data/entitlement';
import { refreshEntitlement } from '../store/account';
import { hasPaid } from '../engine/entitlement';
import { Page } from '../components/ui';
import { S } from '../strings';

type Phase = 'offer' | 'opening' | 'waiting' | 'waited' | 'checking';

export default function Unlock() {
  const navigate = useNavigate();
  const { search, state: navState } = useLocation();
  const params = new URLSearchParams(search.startsWith('?') ? search : `?${search}`);
  const returning = params.get('paid') === '1';
  const cancelled = params.get('cancelled') === '1';

  const entitlement = useStore((s) => s.entitlement);
  const ready = useStore((s) => s.entitlementReady);
  const session = useStore((s) => s.session);
  const setEntitlement = useStore((s) => s.setEntitlement);

  const [phase, setPhase] = useState<Phase>(returning ? 'waiting' : 'offer');
  const [error, setError] = useState<string | null>(null);

  const owned = hasPaid(entitlement);

  // Coming back from Stripe. The redirect usually beats the webhook, so poll
  // rather than telling a customer who has just paid that they have not.
  useEffect(() => {
    if (!returning || owned) return;
    let live = true;
    void (async () => {
      const result = await waitForEntitlement();
      if (!live) return;
      setEntitlement(result);
      setPhase(result?.status === 'active' ? 'offer' : 'waited');
    })();
    return () => { live = false; };
  }, [returning, owned, setEntitlement]);

  const check = useCallback(async () => {
    setPhase('checking');
    setError(null);
    await refreshEntitlement();
    setPhase('offer');
  }, []);

  const buy = useCallback(async () => {
    setError(null);
    setPhase('opening');
    try {
      window.location.href = await startCheckout();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start the checkout.');
      setPhase('offer');
    }
  }, []);

  /* ---- nothing to sell ------------------------------------------------- */
  if (!isSellingEnabled()) {
    return (
      <Page title={S.unlock.title}>
        <p className="prose-quiet">{S.unlock.notSelling}</p>
        <Link to="/life" className="btn-primary mt-6 inline-block">{S.unlock.ownedCta}</Link>
      </Page>
    );
  }

  /* ---- already theirs -------------------------------------------------- */
  if (owned) {
    return (
      <Page title={S.unlock.ownedTitle}>
        <p className="prose-quiet">{S.unlock.ownedBody}</p>
        <button type="button" className="btn-primary mt-6" onClick={() => navigate('/life')}>
          {S.unlock.ownedCta}
        </button>
      </Page>
    );
  }

  /* ---- just paid, webhook still in flight ------------------------------ */
  if (phase === 'waiting') {
    return (
      <Page title={S.unlock.title}>
        <p className="prose-quiet animate-pulse-soft">{S.unlock.waiting}</p>
      </Page>
    );
  }
  if (phase === 'waited') {
    return (
      <Page title={S.unlock.title}>
        <p className="prose-quiet">{S.unlock.waitingSlow}</p>
        <button type="button" className="btn-ghost mt-6" onClick={check}>{S.unlock.retry}</button>
      </Page>
    );
  }

  /* ---- could not ask --------------------------------------------------- */
  if (ready && entitlement === null && session) {
    return (
      <Page title={S.unlock.unknownTitle}>
        <p className="prose-quiet">{S.unlock.unknownBody}</p>
        <button
          type="button"
          className="btn-primary mt-6"
          onClick={check}
          disabled={phase === 'checking'}
        >
          {S.unlock.retry}
        </button>
      </Page>
    );
  }

  /* ---- the offer ------------------------------------------------------- */
  // Somebody sent here by reaching for a locked screen is answered about that
  // screen first. Arriving at a price page without being told why you are
  // looking at it is the part that feels like a trick.
  const cameFrom = typeof (navState as { from?: unknown } | null)?.from === 'string';

  return (
    <Page title={S.unlock.title} lead={S.unlock.lead}>
      {cameFrom ? (
        <p className="mt-6 text-sm text-carry-bright">{S.unlock.cameFor}</p>
      ) : null}
      {cancelled ? (
        <p className="mt-6 text-sm text-muted">{S.unlock.cancelled}</p>
      ) : null}

      <section aria-labelledby="get" className="mt-10">
        <h2 id="get" className="text-sm uppercase tracking-[0.14em] text-muted">
          {S.unlock.getTitle}
        </h2>
        <ul className="mt-5 grid gap-4 sm:grid-cols-2">
          {S.unlock.get.map(([title, body]) => (
            <li key={title} className="card">
              <h3 className="font-display text-base text-bone">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="card mt-10">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <span className="numeral font-display text-3xl text-bone">{PRICE_DISPLAY}</span>
          <span className="text-sm text-muted">{PRICE_NOTE}</span>
        </div>
        <p className="mt-3 max-w-measure text-sm leading-relaxed text-muted">
          {S.unlock.priceNote}
        </p>

        {!session ? (
          <p className="mt-5 text-sm text-carry-bright">{S.unlock.signInFirst}</p>
        ) : null}

        <button
          type="button"
          className="btn-primary mt-6 w-full sm:w-auto"
          onClick={buy}
          disabled={phase === 'opening' || !session}
        >
          {phase === 'opening' ? S.unlock.buying : S.unlock.buy}
        </button>

        {error ? <p className="mt-4 text-sm text-fault">{error}</p> : null}

        <p className="mt-5 text-sm text-muted">
          {S.unlock.refund(REFUND_DAYS)}{' '}
          <Link
            to="/refunds"
            className="text-instrument underline decoration-instrument-dim underline-offset-4 hover:decoration-instrument"
          >
            {S.unlock.refundLink}
          </Link>
        </p>
      </section>

      <section aria-labelledby="have" className="mt-12">
        <h2 id="have" className="text-sm uppercase tracking-[0.14em] text-muted">
          {S.unlock.haveTitle}
        </h2>
        <ul className="mt-4 space-y-2">
          {S.unlock.have.map((t) => (
            <li key={t} className="flex gap-3 text-sm leading-relaxed text-muted">
              <span aria-hidden="true" className="text-instrument">·</span>
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </section>
    </Page>
  );
}
