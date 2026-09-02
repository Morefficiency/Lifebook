/**
 * Start a Stripe Checkout session for the signed-in user.
 *
 * The only thing this endpoint decides is *who* is buying. Everything about
 * *what* they are buying — the price, the currency, whether it is one payment
 * or a subscription — comes from the Stripe price id in the environment, so
 * changing the offer never means changing this code, and a caller cannot ask
 * for a different price than the one configured.
 *
 * Two things it deliberately does not do:
 *
 *   - It does not take a return URL from the request. An attacker who could
 *     choose success_url would have a working open redirect on the checkout
 *     domain. The URL comes from APP_URL in the environment.
 *   - It does not grant anything. A completed checkout is announced by Stripe
 *     to the webhook, which is the only thing that writes an entitlement. A
 *     browser that reaches success_url has proved nothing.
 *
 * Deploy:  supabase functions deploy create-checkout
 * Secrets: supabase secrets set STRIPE_SECRET_KEY=sk_... STRIPE_PRICE_ID=price_... APP_URL=https://...
 */
import Stripe from 'https://esm.sh/stripe@17.5.0?target=denonext';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.10';

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY') ?? '';
const STRIPE_PRICE_ID = Deno.env.get('STRIPE_PRICE_ID') ?? '';
const APP_URL = (Deno.env.get('APP_URL') ?? '').replace(/\/+$/, '');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-12-18.acacia' });

/**
 * CORS. The app is served from one origin; anything else is told no rather
 * than quietly allowed, because this endpoint spends money on someone's behalf.
 */
function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = origin && APP_URL && origin === APP_URL ? origin : APP_URL;
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  };
}

const json = (body: unknown, status: number, cors: Record<string, string>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  const cors = corsHeaders(req.headers.get('origin'));
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405, cors);

  if (!STRIPE_SECRET_KEY || !STRIPE_PRICE_ID || !APP_URL) {
    // A misconfiguration is the operator's problem, not the customer's, and the
    // customer must not be shown a Stripe error that implies their card failed.
    console.error('create-checkout is missing STRIPE_SECRET_KEY, STRIPE_PRICE_ID or APP_URL');
    return json({ error: 'not configured' }, 503, cors);
  }

  // Who is asking. The JWT is verified by Supabase, not parsed here.
  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) return json({ error: 'not signed in' }, 401, cors);

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData?.user;
  if (userError || !user) return json({ error: 'not signed in' }, 401, cors);

  // Already bought it. Sending them to Stripe again would charge them twice for
  // something they own, which is worth one extra query to prevent.
  const { data: existing } = await supabase
    .from('entitlements')
    .select('status')
    .eq('user_id', user.id)
    .maybeSingle();
  if (existing?.status === 'active') return json({ error: 'already purchased' }, 409, cors);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
      // Both of these are how the webhook finds the user again. client_reference_id
      // survives on the session; metadata is copied onto the payment intent, which
      // is what a refund event carries.
      client_reference_id: user.id,
      metadata: { user_id: user.id },
      payment_intent_data: { metadata: { user_id: user.id } },
      customer_email: user.email ?? undefined,
      allow_promotion_codes: true,
      success_url: `${APP_URL}/#/unlock?paid=1`,
      cancel_url: `${APP_URL}/#/unlock?cancelled=1`,
    });
    if (!session.url) return json({ error: 'no checkout url' }, 502, cors);
    return json({ url: session.url }, 200, cors);
  } catch (e) {
    console.error('stripe checkout failed', e);
    return json({ error: 'checkout failed' }, 502, cors);
  }
});
