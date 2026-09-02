# Launching Lifebook

The path from this repository to a first paying customer. About ninety minutes,
most of it waiting for other people's dashboards.

Do the steps in order. Each one is verifiable on its own, so when something
breaks you know which step it was — which is the whole reason this is a list
rather than a paragraph.

```
1  Supabase project        the account and the writing
2  Database migrations     the state table and the entitlements table
3  Stripe product          the thing being sold
4  Edge Functions          checkout, and the only thing that grants access
5  Stripe webhook          how a payment becomes access
6  Environment             who is selling, and from what address
7  Deploy                  the app itself
8  Buy it yourself         with a test card, end to end
9  Go live                 switch Stripe out of test mode
```

At the end of every step there is a **check** — do not carry on until it passes.

---

## 1. Supabase project

[supabase.com](https://supabase.com) → New project. Any region near your
customers; the free tier is enough to start.

From **Project Settings → API**, copy:

- the **Project URL** → `VITE_SUPABASE_URL`
- the **anon public** key → `VITE_SUPABASE_ANON_KEY`
- the **service_role** key → keep it somewhere safe and **never** put it in this
  repository, in a `VITE_` variable, or anywhere a browser could reach. It
  bypasses every access rule in the database. It is used in exactly one place,
  in step 4.

**Check:** you have three values and the third one is not in any file here.

---

## 2. Database migrations

**SQL Editor** → paste and run each file, in order:

1. `supabase/migrations/0001_init.sql`
2. `supabase/migrations/0002_entitlements.sql`

**Check:** **Table Editor** shows `lifebook_state`, `entitlements` and
`stripe_events`, each marked *RLS enabled*. Open `entitlements` → **Policies**:
there should be exactly one, a SELECT policy. If you ever find yourself adding an
INSERT or UPDATE policy there, stop — that would let any signed-in person grant
themselves the paid product with one API call. Writes arrive through the webhook
in step 5 and nowhere else.

---

## 3. Stripe product

[stripe.com](https://stripe.com) → create the account. Leave it in **test mode**
for now (the toggle is top right; everything below works identically in both).

**Product catalogue → Add product**

- Name: `Lifebook`
- Price: **one-time**, $29 (or whatever you set as `PRICE_DISPLAY` in
  `src/config.ts` — these two are not linked, so keep them in step or the page
  will advertise a price that is not what gets charged)

Copy the **price id** — it starts `price_`.

**Check:** you have a price id, and it matches what `src/config.ts` displays.

---

## 4. Edge Functions

These are the only server-side code in the product. Install the CLI once:

```bash
npm install -g supabase
supabase login
supabase link --project-ref <your-project-ref>
```

Set the secrets. These live on Supabase, never in this repository:

```bash
supabase secrets set \
  STRIPE_SECRET_KEY=sk_test_... \
  STRIPE_PRICE_ID=price_... \
  APP_URL=https://your-deployed-url \
  SUPABASE_SERVICE_ROLE_KEY=<the service_role key from step 1>
```

Deploy both:

```bash
supabase functions deploy create-checkout
supabase functions deploy stripe-webhook --no-verify-jwt
```

`--no-verify-jwt` on the webhook is **required and is not a hole**: Stripe does
not carry a Supabase login token, so Supabase's own check would reject every
delivery. The function authenticates the caller itself, by verifying Stripe's
signature over the raw body before reading a single field. Deploying it *with*
JWT verification means no payment ever completes.

**Check:** both appear under **Edge Functions** in the dashboard.

---

## 5. Stripe webhook

This is the step that makes a payment into access. Skip it and customers pay and
receive nothing.

**Stripe → Developers → Webhooks → Add endpoint**

- URL: `https://<project-ref>.supabase.co/functions/v1/stripe-webhook`
- Events to send — exactly these four:
  - `checkout.session.completed`
  - `checkout.session.async_payment_succeeded`
  - `charge.refunded`
  - `charge.dispute.created`

Copy the **signing secret** (`whsec_...`) and give it to the function:

```bash
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
supabase functions deploy stripe-webhook --no-verify-jwt   # redeploy to pick it up
```

**Check:** Stripe's **Send test webhook** for `checkout.session.completed`
returns 200. A 400 means the signing secret is wrong or was set after the last
deploy; a 503 means a secret is missing entirely.

---

## 6. Environment

Create `.env` from `.env.example` and fill it in. Four of these are facts only
you know, and the app will not let you sell without them:

```
VITE_SUPABASE_URL=https://....supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_APP_URL=https://your-deployed-url
VITE_OPERATOR_NAME=Your legal name or company
VITE_SUPPORT_EMAIL=you@example.com
VITE_GOVERNING_LAW=France
VITE_POLICY_UPDATED=2 September 2026
```

`VITE_OPERATOR_NAME`, `VITE_SUPPORT_EMAIL` and `VITE_GOVERNING_LAW` are printed
inside the privacy policy, the terms and the refund policy — the three documents
that say who a customer is contracting with and where to complain. A build
without them shows a red banner on those pages, and the launch check fails.

Everything prefixed `VITE_` is compiled into the browser bundle and is **public**.
The anon key is designed for that. Nothing Stripe-related ever is.

Then:

```bash
npm run build
npm run check:launch
```

**Check:** `Ready to take a payment.`

---

## 7. Deploy

See **[DEPLOY.md](DEPLOY.md)** — Cloudflare Workers or Pages, same build.

Set the same environment variables in the host's build settings, not only in
your local `.env`: the build that runs there is the one customers get.

Two things to do once it is up:

- **Supabase → Authentication → URL Configuration → Redirect URLs**: add your
  deployed URL, or sign-in emails and the Google round-trip both bounce.
- Confirm `APP_URL` in the Edge Function secrets matches the deployed origin
  exactly. Stripe returns the customer to it; a mismatch strands them on a page
  that is not your app.

**Check:** open the URL. Landing page, then `/#/vision`, then `/#/map`.

---

## 8. Buy it yourself

Do not skip this. It is the only way to know that all six moving parts are
connected, and it costs nothing in test mode.

1. Create an account on the deployed site.
2. Go through to the map — everything so far should be free.
3. Try to open `/#/life`. You should be sent to `/#/unlock`.
4. Click **Unlock the rest**. Stripe's checkout should open with your price.
5. Pay with `4242 4242 4242 4242`, any future expiry, any CVC.
6. You should land back on `/#/unlock`, see "Payment received. Waiting…", and
   within a few seconds it should turn into "You own this".
7. `/#/life` should now open.

If step 6 hangs: **Stripe → Developers → Webhooks** shows the delivery and its
response, and **Supabase → Edge Functions → stripe-webhook → Logs** shows why.
That pair of screens answers essentially every failure at this step.

Then test the other direction — **Stripe → Payments → refund** the payment.
Within seconds `/#/life` should close again, and Settings should still export.

**Check:** you bought it, it opened; you refunded it, it closed; your writing
survived both.

---

## 9. Go live

1. Stripe: switch out of test mode. Complete the business details it asks for.
2. Create the product and price **again** in live mode — test and live are
   separate worlds and ids do not carry over.
3. `supabase secrets set STRIPE_SECRET_KEY=sk_live_... STRIPE_PRICE_ID=price_...`
4. Create the webhook endpoint again in live mode, set the new
   `STRIPE_WEBHOOK_SECRET`, and redeploy the function.
5. `npm run build && npm run check:launch` one more time.
6. Buy it once with a real card. Refund yourself. That is the only proof.

---

## Your first customer

The app is finished; what is missing is a person. Some notes that are about this
product specifically rather than about marketing in general.

**The free tier is the pitch.** Ten minutes, no card, and it ends on something
most people have genuinely never seen — the goal that sits inside more of their
own collisions than any other. Do not shorten it to sell sooner. It is the only
demonstration you have, and it is a good one.

**Say what it costs before they start.** The landing page does, deliberately.
Somebody who finds a price after twenty minutes of writing about their childhood
feels tricked, and they are right to.

**Where these people are.** Anywhere that already argues about goal conflict and
self-concept rather than productivity: r/selfimprovement, Hacker News if you
write honestly about the goal-conflict maths, and any community around Emmons'
striving research. The app's honesty about what it deliberately leaves out — the
`/science` page — is unusual enough to be the thing worth leading with.

**Watch one person use it.** Not a survey. One person, in silence, while they go
from the landing page to the map. Whatever they hesitate over is the next thing
to fix, and it will not be what you expected.

**Answer every refund request in a day, without asking why.** At this size,
somebody who got their money back cheerfully is worth more than the $29.

---

## When something breaks

| Symptom | Almost always |
| --- | --- |
| Paid, still locked out | Webhook not delivering — check Stripe's delivery log first |
| Webhook returns 400 | Signing secret wrong, or set after the last deploy |
| Webhook returns 503 | A secret is missing — `supabase secrets list` |
| Checkout will not open | `STRIPE_PRICE_ID` or `APP_URL` unset on the function |
| Bounced to `/unlock` while owning it | The entitlements query is failing — check the browser console |
| Sign-in email link goes nowhere | Deployed URL not in Supabase's redirect list |
| Policy pages show a red banner | The four operator variables are not set in the *build* |
| Link previews as a bare URL | `VITE_APP_URL` was not set at build time |

A customer who has paid and cannot get in is the one failure worth interrupting
anything for. You can always grant access by hand while you debug:

```sql
select public.grant_entitlement('<their user id>', null, 'lifetime');
```
