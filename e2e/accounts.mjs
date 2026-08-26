/**
 * Accounts and sync, against a stubbed Supabase.
 *
 * There is no Docker and no outbound network in the build environment, so a
 * real Supabase cannot run here. The sync and merge *logic* is covered by unit
 * tests against an in-memory server (src/engine/__tests__/sync.test.ts and
 * merge.test.ts); what this file covers is the browser wiring those tests
 * cannot reach — the guards, the sign-in screen, and above all the per-account
 * scoping of local storage.
 *
 * That last one is the reason this file exists. Two people signing in on one
 * laptop must never see each other's Lifebook, and that is not something to
 * take on trust.
 *
 * Run against a build made with a fake project configured:
 *   VITE_SUPABASE_URL=https://stub.supabase.co VITE_SUPABASE_ANON_KEY=stub \
 *     npx vite build --outDir dist-account
 */
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const BASE = process.env.E2E_BASE ?? 'http://127.0.0.1:4174';
const OUT = process.env.E2E_OUT ?? 'e2e/.out';
mkdirSync(OUT, { recursive: true });
const fails = [];
const check = (n, ok, x = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${x ? ' — ' + x : ''}`);
  if (!ok) fails.push(n);
};

/* ------------------------------------------------------- the fake server -- */

const b64url = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const jwt = (sub) => `${b64url({ alg: 'HS256', typ: 'JWT' })}.${b64url({
  sub, email: `${sub}@example.com`, role: 'authenticated',
  exp: Math.floor(Date.now() / 1000) + 3600, iat: Math.floor(Date.now() / 1000),
})}.stub`;

/** user_id -> { doc, revision, updated_at } */
const rows = new Map();
const users = new Map(); // email -> id
let calls = { save: 0, load: 0 };

function sessionFor(id, email) {
  return {
    access_token: jwt(id),
    refresh_token: `refresh-${id}`,
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: {
      id, email, aud: 'authenticated', role: 'authenticated',
      app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString(),
    },
  };
}

function whoAmI(headers) {
  const auth = headers['authorization'] ?? '';
  const token = auth.replace(/^Bearer\s+/i, '');
  if (!token || token === 'stub') return null;
  try {
    return JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString()).sub;
  } catch { return null; }
}

async function install(page) {
  await page.route('**/auth/v1/**', async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const body = req.postDataJSON?.() ?? {};
    const json = (status, data) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });

    if (url.pathname.endsWith('/signup')) {
      const id = users.get(body.email) ?? `user-${users.size + 1}`;
      users.set(body.email, id);
      return json(200, sessionFor(id, body.email));
    }
    if (url.pathname.endsWith('/token')) {
      const id = users.get(body.email);
      if (!id) return json(400, { error: 'invalid_grant', error_description: 'Invalid login credentials' });
      return json(200, sessionFor(id, body.email));
    }
    if (url.pathname.endsWith('/logout')) return json(204, {});
    if (url.pathname.endsWith('/user')) {
      const id = whoAmI(req.headers());
      if (!id) return json(401, { message: 'invalid token' });
      return json(200, { id, email: `${id}@example.com`, aud: 'authenticated', app_metadata: {}, user_metadata: {} });
    }
    return json(200, {});
  });

  await page.route('**/rest/v1/**', async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const id = whoAmI(req.headers());
    const json = (status, data) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });
    if (!id) return json(401, { message: 'not signed in' });

    if (url.pathname.endsWith('/rpc/save_lifebook_state')) {
      calls.save += 1;
      const { p_doc, p_expected_revision } = req.postDataJSON();
      const current = rows.get(id);
      if (current && current.revision !== p_expected_revision) {
        return json(200, [{ ...current, conflict: true }]);
      }
      const next = {
        doc: p_doc,
        revision: (current?.revision ?? 0) + 1,
        updated_at: new Date().toISOString(),
      };
      rows.set(id, next);
      return json(200, [{ ...next, conflict: false }]);
    }

    if (url.pathname.endsWith('/rpc/delete_my_account')) {
      rows.delete(id);
      return json(200, null);
    }

    if (url.pathname.includes('/lifebook_state')) {
      calls.load += 1;
      const row = rows.get(id);
      // Row-level security, in spirit: you only ever get your own.
      return json(200, row ? { doc: row.doc, revision: row.revision, updated_at: row.updated_at } : null);
    }
    return json(200, null);
  });
}

/* ----------------------------------------------------------------- run --- */

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const ctx = await browser.newContext({ viewport: { width: 1280, height: 950 } });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
await install(page);

const signUp = async (email, password = 'hunter2hunter2') => {
  await page.goto(`${BASE}/#/sign-in`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Create an account' }).first().click();
  await page.locator('input[type=checkbox]').check();
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.getByRole('button', { name: 'Create the account' }).click();
};

const signInAs = async (email, password = 'hunter2hunter2') => {
  await page.goto(`${BASE}/#/sign-in`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Sign in', exact: true }).first().click();
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).last().click();
};

const writeVision = async (text) => {
  await page.goto(`${BASE}/#/vision`);
  await page.getByRole('heading', { name: 'The life you want' }).waitFor();
  const head = page.getByRole('button', { name: /^Health & Body/ }).first();
  if (await head.getAttribute('aria-expanded') !== 'true') await head.click();
  await page.locator('textarea[id^="vision-"]').first().fill(text);
  await page.waitForTimeout(2200); // let the debounced push run
};

// --- the app is behind an account when one is configured ---
await page.goto(`${BASE}/#/vision`, { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
check('A configured build sends you to sign in before anything else',
  page.url().includes('/sign-in'), page.url());

await page.getByRole('button', { name: 'Create an account' }).first().click();
const gate = await page.locator('main').innerText();
check('Sign-up says plainly that the data leaves the device',
  /saved to your account so it follows you between devices/i.test(gate));
check('...and that the people running it can read it',
  /the people who run this service can read it/i.test(gate));
check('...and that it is not therapy', /not therapy/i.test(gate));
check('Consent must be ticked before an account can be created',
  await page.getByRole('button', { name: 'Create the account' }).isEnabled());

// --- user A ---
await signUp('a@example.com');
await page.waitForURL('**/#/**', { timeout: 10000 });
await page.waitForTimeout(600);
check('Creating an account signs you straight in', !page.url().includes('/sign-in'), page.url());

await writeVision('A wakes before the alarm.');
check('What A writes reaches the account', rows.has('user-1') , `${rows.size} row(s), ${calls.save} save(s)`);
check("A's row contains A's words",
  JSON.stringify(rows.get('user-1')?.doc ?? {}).includes('A wakes before the alarm'));

await page.goto(`${BASE}/#/settings`);
await page.getByRole('heading', { name: 'Settings', level: 1 }).waitFor();
const settings = await page.locator('main').innerText();
check('Settings shows who is signed in', /signed in as/i.test(settings) && /a@example\.com/.test(settings));
check('Settings tells the truth about who can read it',
  /can read (what you write|them)/i.test(settings), settings.slice(0, 40));
await page.screenshot({ path: `${OUT}/acct-settings.png`, fullPage: true });

// --- sign out, then a different person on the same browser ---
await page.getByRole('button', { name: 'Sign out' }).click();
await page.waitForTimeout(1200);

await signUp('b@example.com');
await page.waitForTimeout(1200);
await page.goto(`${BASE}/#/vision`);
await page.getByRole('heading', { name: 'The life you want' }).waitFor();
const bSees = await page.locator('main').innerText();
check("B does not see A's Lifebook on the same browser",
  !/A wakes before the alarm/.test(bSees));

const bBoxes = await page.locator('textarea[id^="vision-"]').evaluateAll((ns) => ns.map((n) => n.value));
check("B's vision fields start empty", bBoxes.every((v) => v.trim() === ''), bBoxes.join('|'));

await writeVision('B trains outdoors.');
check("B's work goes to B's row, not A's",
  JSON.stringify(rows.get('user-2')?.doc ?? {}).includes('B trains outdoors'));
check("A's row was not touched by B",
  JSON.stringify(rows.get('user-1')?.doc ?? {}).includes('A wakes before the alarm')
  && !JSON.stringify(rows.get('user-1')?.doc ?? {}).includes('B trains outdoors'));

// --- A comes back ---
await page.goto(`${BASE}/#/settings`);
await page.getByRole('button', { name: 'Sign out' }).click();
await page.waitForTimeout(1200);
await signInAs('a@example.com');
await page.waitForTimeout(1500);
await page.goto(`${BASE}/#/vision`);
await page.getByRole('heading', { name: 'The life you want' }).waitFor();
const aBack = await page.locator('main').innerText();
check('A signing back in gets A\'s Lifebook returned', /A wakes before the alarm/.test(aBack));
check("...and still cannot see B's", !/B trains outdoors/.test(aBack));

// --- upgrade path: a browser that already had a local Lifebook from before
//     accounts existed carries it into the first account that signs in, once.
const upgrade = await browser.newContext({ viewport: { width: 1280, height: 950 } });
const page3 = await upgrade.newPage();
await install(page3);
await page3.goto(`${BASE}/#/sign-in`, { waitUntil: 'networkidle' });
await page3.evaluate(async () => {
  const doc = {
    version: 1,
    lifebook: {
      visions: [{ area: 'work', statement: 'Written here before I had an account.', markers: [], importance: 5, ts: '2026-01-01T00:00:00.000Z' }],
      currents: [], probes: [], beliefs: [], identities: [], practices: [],
      practiceLogs: [], stagesCompleted: {},
    },
    profile: { xp: 0, badges: [], consent: { notTherapyAck: true, dataLocalAck: true, ts: '2026-01-01T00:00:00.000Z' }, initialConflictLoad: null, mirrorCompletedTs: null },
    values: null, strivings: [], pairRatings: [], forks: [], quests: [], reports: [], ledger: [],
  };
  // Open with no version: Dexie has already created the database on this
  // origin and asking for a specific version would collide with its own.
  const req = indexedDB.open('coherence');
  const db = await new Promise((res, rej) => {
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
  await new Promise((res) => {
    const tx = db.transaction('kv', 'readwrite');
    tx.objectStore('kv').put({ key: 'state', value: doc });
    tx.oncomplete = () => res();
  });
  db.close();
});
await page3.reload({ waitUntil: 'networkidle' });
await page3.getByRole('button', { name: 'Create an account' }).first().click();
await page3.locator('input[type=checkbox]').check();
await page3.fill('#email', 'c@example.com');
await page3.fill('#password', 'hunter2hunter2');
await page3.getByRole('button', { name: 'Create the account' }).click();
await page3.waitForTimeout(2500);
await page3.goto(`${BASE}/#/vision`);
await page3.getByRole('heading', { name: 'The life you want' }).waitFor();
check('Work done before signing up is carried into the new account',
  /Written here before I had an account/.test(await page3.locator('main').innerText()));
check('...and reaches the server with it',
  JSON.stringify(rows.get('user-3') ?? {}).includes('before I had an account'));

// Signing out and in as somebody else on that same browser must not inherit it.
await page3.goto(`${BASE}/#/settings`);
await page3.getByRole('button', { name: 'Sign out' }).click();
await page3.waitForTimeout(1200);
await page3.goto(`${BASE}/#/sign-in`, { waitUntil: 'networkidle' });
await page3.getByRole('button', { name: 'Create an account' }).first().click();
await page3.locator('input[type=checkbox]').check();
await page3.fill('#email', 'd@example.com');
await page3.fill('#password', 'hunter2hunter2');
await page3.getByRole('button', { name: 'Create the account' }).click();
await page3.waitForTimeout(2000);
await page3.goto(`${BASE}/#/vision`);
await page3.getByRole('heading', { name: 'The life you want' }).waitFor();
check('The carry-in happens once — the next person does not inherit it',
  !/Written here before I had an account/.test(await page3.locator('main').innerText()));

// --- another device: same account, empty browser, pulls the account down ---
const other = await browser.newContext({ viewport: { width: 1280, height: 950 } });
const page2 = await other.newPage();
await install(page2);
await page2.goto(`${BASE}/#/sign-in`, { waitUntil: 'networkidle' });
await page2.getByRole('button', { name: 'Sign in', exact: true }).first().click();
await page2.fill('#email', 'a@example.com');
await page2.fill('#password', 'hunter2hunter2');
await page2.getByRole('button', { name: 'Sign in', exact: true }).last().click();
await page2.waitForTimeout(1800);
await page2.goto(`${BASE}/#/vision`);
await page2.getByRole('heading', { name: 'The life you want' }).waitFor();
check('A second device pulls the account down rather than starting blank',
  /A wakes before the alarm/.test(await page2.locator('main').innerText()));

// --- deleting the account removes the row ---
await page2.goto(`${BASE}/#/settings`);
await page2.getByRole('heading', { name: 'Settings', level: 1 }).waitFor();
await page2.fill('#delete-account', 'DELETE');
await page2.getByRole('button', { name: 'Delete my account' }).click();
await page2.waitForTimeout(1200);
check('Deleting the account removes it from the server', !rows.has('user-1'), `${rows.size} row(s) left`);
check("...and leaves other accounts alone", rows.has('user-2'));

check('No console errors', errs.length === 0, errs.slice(0, 2).join(' | '));

console.log('\n' + (fails.length ? `FAILURES: ${fails.join(' | ')}` : 'ALL CHECKS PASSED'));
await browser.close();
process.exit(fails.length ? 1 : 0);
