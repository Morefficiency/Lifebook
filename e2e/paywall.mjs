/**
 * The paywall, in a browser, against a stubbed Supabase.
 *
 * The unit tests decide which routes are paid. This decides whether the app
 * actually behaves that way: whether a signed-in stranger is bounced off /life,
 * whether they can still reach everything the landing page promised them,
 * whether the entitlement row actually opens the door, and — the one that would
 * be worst to get wrong — whether Export in Settings keeps working for somebody
 * who has not paid and for somebody who has been refunded.
 *
 * There is no Docker and no outbound network here, so the database and Stripe
 * are stubbed. What is real is every line of app code between the route table
 * and the fetch, which is where a paywall bug would actually live.
 *
 * Run against a build with a project configured:
 *   VITE_SUPABASE_URL=https://stub.supabase.co VITE_SUPABASE_ANON_KEY=stub \
 *     npm run build:account && npm run preview:account & node e2e/paywall.mjs
 */
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';
import { writeVisions, shortForm } from './lib/walk.mjs';

const BASE = process.env.E2E_BASE ?? 'http://127.0.0.1:4174';
const OUT = process.env.E2E_OUT ?? 'e2e/.out';
mkdirSync(OUT, { recursive: true });
const fails = [];
const check = (n, ok, x = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${x ? ' — ' + x : ''}`);
  if (!ok) fails.push(n);
};

const b64url = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const jwt = (sub) => `${b64url({ alg: 'HS256', typ: 'JWT' })}.${b64url({
  sub, email: `${sub}@example.com`, role: 'authenticated',
  exp: Math.floor(Date.now() / 1000) + 3600, iat: Math.floor(Date.now() / 1000),
})}.stub`;

/** What the stubbed database says about the one user in each scenario. */
let entitlementRow = null;
let checkoutCalls = 0;

async function stub(page) {
  await page.route('**/auth/v1/**', async (route) => {
    const url = new URL(route.request().url());
    const json = (s, d) => route.fulfill({ status: s, contentType: 'application/json', body: JSON.stringify(d) });
    const session = {
      access_token: jwt('u1'), refresh_token: 'r', token_type: 'bearer',
      expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: { id: 'u1', email: 'u1@example.com', aud: 'authenticated', app_metadata: {}, user_metadata: {} },
    };
    if (url.pathname.endsWith('/signup') || url.pathname.endsWith('/token')) return json(200, session);
    if (url.pathname.endsWith('/user')) return json(200, session.user);
    if (url.pathname.endsWith('/logout')) return json(204, {});
    return json(200, {});
  });

  await page.route('**/rest/v1/**', async (route) => {
    const url = new URL(route.request().url());
    const json = (s, d) => route.fulfill({ status: s, contentType: 'application/json', body: JSON.stringify(d) });
    if (url.pathname.includes('/entitlements')) return json(200, entitlementRow);
    if (url.pathname.endsWith('/rpc/save_lifebook_state')) {
      return json(200, [{ revision: 1, updated_at: new Date().toISOString(), doc: {}, conflict: false }]);
    }
    if (url.pathname.includes('/lifebook_state')) return json(200, null);
    return json(200, null);
  });

  // The checkout function. Never actually followed — the assertion is that the
  // app asks for it, with a session, at the right moment.
  await page.route('**/functions/v1/create-checkout', async (route) => {
    checkoutCalls += 1;
    await route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({ url: `${BASE}/#/unlock?paid=1` }),
    });
  });
}

const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
);

/** A fresh browser context signed in as u1, with the given entitlement row. */
async function signedIn(row) {
  entitlementRow = row;
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
  const page = await ctx.newPage();
  await stub(page);
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.locator('input[type=checkbox]').nth(0).click();
  await page.locator('input[type=checkbox]').nth(1).click();
  await page.getByRole('button', { name: /^Start with the life you want/ }).click();
  await page.waitForFunction(() => location.hash.includes('/sign-in'), null, { timeout: 15000 });
  await createAccount(page);
  return { ctx, page };
}

/** The sign-up half of /sign-in, in the order the screen actually asks for it. */
async function createAccount(page) {
  await page.getByRole('button', { name: 'Create an account' }).first().click();
  // Sign-up carries its own consent line — the honest one, that says the
  // operator can read what you write. Nothing submits until it is ticked.
  const ack = page.locator('main input[type=checkbox]');
  if (await ack.count()) await ack.first().check();
  await page.fill('#email', 'u1@example.com');
  await page.fill('#password', 'password1234');
  await page.getByRole('button', { name: 'Create the account' }).click();
  // Hash routing: the URL changes without a navigation event, so waitForURL
  // never fires. Poll the hash instead.
  await page.waitForFunction(() => !location.hash.includes('/sign-in'), null, { timeout: 15000 });
}

const landed = (page) => page.url().split('#')[1] ?? '';

/* ------------------------------------------------- nobody has paid yet ---- */
{
  const { ctx, page } = await signedIn(null); // no row = has not bought it

  for (const route of ['/life', '/constellation', '/current', '/reflect', '/stats', '/print']) {
    await page.goto(`${BASE}/#${route}`);
    await page.waitForTimeout(500);
    check(`${route} sends an unpaid account to the offer`, landed(page).startsWith('/unlock'), landed(page));
  }

  for (const route of ['/vision', '/goals', '/settings', '/science', '/support',
    '/privacy', '/terms', '/refunds']) {
    await page.goto(`${BASE}/#${route}`);
    await page.waitForTimeout(400);
    check(`${route} stays open without paying`, landed(page).startsWith(route), landed(page));
  }

  // The promise on the landing page has to survive the paywall existing.
  await page.goto(`${BASE}/#/vision`);
  await page.waitForTimeout(400);
  check('the ten-minute path still begins', (await page.locator('textarea').count()) > 0);

  // The one that must never regress: your own writing is not the hostage.
  await page.goto(`${BASE}/#/settings`);
  await page.waitForTimeout(500);
  const settingsText = await page.locator('main').innerText();
  check('an unpaid account can still export everything it wrote', /export/i.test(settingsText));
  check('...and can still delete everything', /delete/i.test(settingsText));

  // The commercially decisive moment, walked properly rather than asserted
  // from a fixture: finish the whole free tier and arrive at the map the way a
  // real first user does, then look at what it offers next.
  await page.goto(`${BASE}/#/vision`);
  await page.waitForTimeout(400);
  await writeVisions(page);
  await shortForm(page);
  // '/mirror' IS the map — the payoff screen the landing page sells. This
  // assertion once read '/map' and the walk stopped dead at a paywall here,
  // ten minutes into somebody's own writing, at the exact moment of the payoff.
  check('the free tier runs all the way to the map without paying',
    landed(page).startsWith('/mirror'), landed(page));

  const mapText = await page.locator('main').innerText();
  check('the map is honest that both doors out of it lead into the paid half',
    /paid half/i.test(mapText), mapText.slice(-140));
  check('...and says the map itself stays theirs either way',
    /stay yours|stays yours/i.test(mapText));

  // '/map' is not asserted here. It sits behind RequireMirror, and this stub
  // answers the state query with null, which walks the fixture back to the
  // gate — an artifact of the stub, not of the app. The same marker component
  // is exercised above at '/mirror', which is the moment that actually decides
  // whether somebody buys.

  await page.goto(`${BASE}/#/unlock`);
  await page.waitForTimeout(600);
  const offer = await page.locator('main').innerText();
  check('the offer names a price', /\$\d/.test(offer), offer.slice(0, 80));
  check('the offer says what stays free', /free/i.test(offer));
  check('the offer states the refund window', /no questions/i.test(offer));
  check('the offer does not manufacture urgency',
    !/hurry|limited time|expires|only \d+ left|act now/i.test(offer));

  checkoutCalls = 0;
  await page.getByRole('button', { name: /Unlock the rest/ }).click();
  await page.waitForTimeout(800);
  check('the buy button asks the server for a checkout', checkoutCalls === 1, String(checkoutCalls));

  await ctx.close();
}

/* --------------------------------------------------------- they paid ------ */
{
  const { ctx, page } = await signedIn({ status: 'active', granted_at: '2026-09-01T00:00:00.000Z' });

  for (const route of ['/life', '/constellation', '/stats']) {
    await page.goto(`${BASE}/#${route}`);
    await page.waitForTimeout(700);
    check(`${route} opens for a paid account`, landed(page).startsWith(route), landed(page));
  }

  await page.goto(`${BASE}/#/unlock`);
  await page.waitForTimeout(500);
  const owned = await page.locator('main').innerText();
  check('the offer becomes a receipt once it is owned', /own this/i.test(owned));
  check('...and never shows a second buy button',
    (await page.getByRole('button', { name: /Unlock the rest/ }).count()) === 0);

  await ctx.close();
}

/* ------------------------------ back from Stripe, webhook still in flight -- */
{
  // The riskiest sequence in the whole product: money has left the customer's
  // account and the grant has not landed yet. Showing them a buy button here is
  // how you earn a chargeback from someone who did nothing wrong.
  entitlementRow = null;
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
  const page = await ctx.newPage();
  await stub(page);
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.locator('input[type=checkbox]').nth(0).click();
  await page.locator('input[type=checkbox]').nth(1).click();
  await page.getByRole('button', { name: /^Start with the life you want/ }).click();
  await page.waitForFunction(() => location.hash.includes('/sign-in'), null, { timeout: 15000 });
  await createAccount(page);

  // Stripe sends them back with the marker in the hash-router's query string.
  await page.goto(`${BASE}/#/unlock?paid=1`);
  await page.waitForTimeout(600);
  const midFlight = await page.locator('main').innerText();
  check('a customer returning from checkout is told to wait, not asked to pay again',
    /waiting|received/i.test(midFlight)
    && (await page.getByRole('button', { name: /Unlock the rest/ }).count()) === 0,
    midFlight.slice(0, 90));

  // The webhook lands while they are looking at that screen.
  entitlementRow = { status: 'active', granted_at: '2026-09-02T00:00:00.000Z' };
  await page.waitForFunction(
    () => /own this/i.test(document.querySelector('main')?.textContent ?? ''),
    null, { timeout: 20000 },
  ).then(() => check('...and the screen turns into a receipt the moment it lands', true))
   .catch(() => check('...and the screen turns into a receipt the moment it lands', false,
     'still waiting after 20s'));

  await page.goto(`${BASE}/#/life`);
  await page.waitForTimeout(700);
  check('...and the paid side is open straight afterwards', landed(page).startsWith('/life'), landed(page));

  await ctx.close();
}

/* ------------------------------------------------------- after a refund --- */
{
  const { ctx, page } = await signedIn({ status: 'refunded', granted_at: '2026-09-01T00:00:00.000Z' });

  await page.goto(`${BASE}/#/life`);
  await page.waitForTimeout(600);
  check('a refunded account is closed out of the paid side', landed(page).startsWith('/unlock'), landed(page));

  await page.goto(`${BASE}/#/settings`);
  await page.waitForTimeout(500);
  check('a refunded account can still export its own writing',
    /export/i.test(await page.locator('main').innerText()));

  await page.goto(`${BASE}/#/goals`);
  await page.waitForTimeout(500);
  check('a refunded account keeps everything that was free', landed(page).startsWith('/goals'), landed(page));

  await ctx.close();
}

/* ------------------------------------- the server could not be reached ---- */
{
  // The entitlements query fails outright. A paying customer on a bad train
  // must not be told they have not bought it.
  entitlementRow = null;
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
  const page = await ctx.newPage();
  await stub(page);
  await page.route('**/rest/v1/entitlements**', (route) =>
    route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ message: 'down' }) }));

  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.locator('input[type=checkbox]').nth(0).click();
  await page.locator('input[type=checkbox]').nth(1).click();
  await page.getByRole('button', { name: /^Start with the life you want/ }).click();
  await page.waitForFunction(() => location.hash.includes('/sign-in'), null, { timeout: 15000 });
  await createAccount(page);

  await page.goto(`${BASE}/#/unlock`);
  await page.waitForTimeout(800);
  const text = await page.locator('main').innerText();
  check('an unreachable server says so rather than accusing anybody of not paying',
    /could not/i.test(text) && !/have not (bought|paid)/i.test(text), text.slice(0, 100));

  await ctx.close();
}

await browser.close();
console.log(fails.length ? `\n${fails.length} FAILED: ${fails.join(', ')}` : '\nall checks passed');
process.exit(fails.length ? 1 : 0);
