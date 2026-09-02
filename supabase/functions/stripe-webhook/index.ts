/**
 * The only thing in this system that grants access.
 *
 * Stripe tells us a payment happened; this writes the entitlement. Nothing the
 * browser can say produces a grant, which is why a client-side check being
 * bypassable does not turn into free accounts.
 *
 * Three properties it has to hold, in order of how expensive they are to get
 * wrong:
 *
 *   1. VERIFY THE SIGNATURE FIRST. Anyone can POST to this URL. Until
 *      constructEventAsync succeeds, the body is a stranger's JSON and is not
 *      read for anything.
 *   2. BE IDEMPOTENT, AND IN THE RIGHT ORDER. Stripe retries until it gets a
 *      2xx and can deliver the same event twice after one. The obvious design —
 *      record the event id first, then do the work — has a hole in it: if the
 *      function dies between the two (a timeout, a redeploy, the runtime being
 *      recycled), the retry sees the recorded id, calls it a duplicate, and the
 *      customer is never granted anything. Nobody finds out until they email.
 *
 *      So the work happens first and the id is recorded after. That is only
 *      safe because the work is itself idempotent — grant_entitlement is an
 *      upsert — which makes a double delivery harmless and a lost delivery
 *      impossible. Cheap duplicate work beats a silent missing grant.
 *   3. FAIL LOUD, NOT OPEN. A 5xx makes Stripe retry, which is what should
 *      happen when the database is briefly unreachable. A malformed or
 *      unsigned request gets a 400 and is never retried.
 *
 * Deploy:  supabase functions deploy stripe-webhook --no-verify-jwt
 *          (--no-verify-jwt is required: Stripe does not carry a Supabase JWT.
 *           The signature check below is what authenticates the caller.)
 * Secrets: supabase secrets set STRIPE_SECRET_KEY=sk_... STRIPE_WEBHOOK_SECRET=whsec_...
 */
import Stripe from 'https://esm.sh/stripe@17.5.0?target=denonext';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.10';

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY') ?? '';
const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
// The service role bypasses row-level security. It exists in exactly one place
// in this codebase — here — and must never reach a browser bundle.
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-12-18.acacia' });
const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/** The user this event is about, from whichever field the event type carries. */
async function userIdFor(event: Stripe.Event): Promise<string | null> {
  const object = event.data.object as Record<string, unknown>;

  const direct = (object['client_reference_id'] as string | null)
    ?? ((object['metadata'] as Record<string, string> | null)?.['user_id'] ?? null);
  if (direct) return direct;

  // Refunds and disputes arrive on a charge, which carries the payment intent's
  // metadata only sometimes. Fall back to the customer we recorded at purchase.
  const customer = object['customer'];
  if (typeof customer === 'string' && customer.length > 0) {
    const { data } = await db
      .from('entitlements')
      .select('user_id')
      .eq('stripe_customer_id', customer)
      .maybeSingle();
    if (data?.user_id) return data.user_id as string;
  }

  // Last resort: a charge knows its payment intent, and we put the user id on
  // that at checkout time.
  const intentId = object['payment_intent'];
  if (typeof intentId === 'string' && intentId.length > 0) {
    try {
      const intent = await stripe.paymentIntents.retrieve(intentId);
      const fromIntent = intent.metadata?.['user_id'];
      if (fromIntent) return fromIntent;
    } catch (e) {
      console.error('could not read payment intent', intentId, e);
    }
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('method not allowed', { status: 405 });
  if (!STRIPE_WEBHOOK_SECRET || !SERVICE_ROLE_KEY) {
    console.error('stripe-webhook is missing STRIPE_WEBHOOK_SECRET or SUPABASE_SERVICE_ROLE_KEY');
    return new Response('not configured', { status: 503 });
  }

  const signature = req.headers.get('stripe-signature');
  if (!signature) return new Response('missing signature', { status: 400 });

  // Raw body, before any parsing — the signature is over these exact bytes.
  const raw = await req.text();

  let event: Stripe.Event;
  try {
    // The async variant uses SubtleCrypto, which is what exists in this runtime.
    event = await stripe.webhooks.constructEventAsync(raw, signature, STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    // Not from Stripe, or replayed outside the tolerance window. Never retried.
    console.error('signature verification failed', e);
    return new Response('bad signature', { status: 400 });
  }

  // A cheap early exit for the common repeat. Not a lock — see note 2 above.
  const { data: seen } = await db
    .from('stripe_events')
    .select('id')
    .eq('id', event.id)
    .maybeSingle();
  if (seen) return new Response('already handled', { status: 200 });

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        // An unpaid session is a session that has not been paid for. Stripe
        // sends this event for those too when payment is asynchronous.
        if (session.payment_status !== 'paid') break;
        const userId = await userIdFor(event);
        if (!userId) { console.error('no user id on session', session.id); break; }
        const customer = typeof session.customer === 'string' ? session.customer : null;
        const { error } = await db.rpc('grant_entitlement', {
          p_user_id: userId, p_customer: customer, p_plan: 'lifetime',
        });
        if (error) throw error;
        console.log('granted', userId);
        break;
      }

      // Payment that completed later than the session did.
      case 'checkout.session.async_payment_succeeded': {
        const userId = await userIdFor(event);
        if (!userId) break;
        const session = event.data.object as Stripe.Checkout.Session;
        const customer = typeof session.customer === 'string' ? session.customer : null;
        const { error } = await db.rpc('grant_entitlement', {
          p_user_id: userId, p_customer: customer, p_plan: 'lifetime',
        });
        if (error) throw error;
        break;
      }

      case 'charge.refunded': {
        // This event also fires for a partial refund. Taking the product away
        // because somebody was refunded four dollars would be a support ticket
        // written by us, so only a full refund closes the account.
        const charge = event.data.object as Stripe.Charge;
        if (charge.amount_refunded < charge.amount) {
          console.log('partial refund, access kept', charge.id);
          break;
        }
        const userId = await userIdFor(event);
        if (!userId) { console.error('no user id on', event.type); break; }
        const { error } = await db.rpc('revoke_entitlement', { p_user_id: userId });
        if (error) throw error;
        console.log('revoked', userId);
        break;
      }

      case 'charge.dispute.created': {
        const userId = await userIdFor(event);
        if (!userId) { console.error('no user id on', event.type); break; }
        const { error } = await db.rpc('revoke_entitlement', { p_user_id: userId });
        if (error) throw error;
        console.log('revoked', userId);
        break;
      }

      default:
        // Everything else is subscribed to by accident or by a future change.
        // Recording it and moving on is correct; Stripe only needs a 2xx.
        break;
    }
  } catch (e) {
    // Nothing has been recorded yet, so Stripe's retry will do the work again
    // rather than be waved through as a duplicate.
    console.error('handler failed for', event.id, e);
    return new Response('handler failed', { status: 500 });
  }

  // Recorded only now that the work is done. A duplicate here is a race with a
  // concurrent delivery of the same event, which the upsert already made
  // harmless — so it is logged rather than treated as a failure.
  const { error: recordError } = await db
    .from('stripe_events')
    .insert({ id: event.id, type: event.type });
  if (recordError && recordError.code !== '23505') {
    console.error('handled but could not record', event.id, recordError);
  }

  return new Response('ok', { status: 200 });
});
