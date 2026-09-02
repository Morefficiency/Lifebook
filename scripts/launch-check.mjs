/**
 * The things that must be true before a stranger is asked for money.
 *
 * Every check here exists because getting it wrong is invisible in development
 * and expensive in production: a policy page that says "[not yet set]", a
 * secret key compiled into the browser bundle, a support address nobody reads,
 * a paid route nobody classified. Tests catch broken code; this catches a
 * correct build that is not ready to be sold.
 *
 * Run with: npm run check:launch     (after npm run build)
 *
 * It grades in two bands. FAIL means do not take a payment. WARN means it will
 * work but somebody should look at it.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';
const fails = [];
const warns = [];
const fail = (m) => fails.push(m);
const warn = (m) => warns.push(m);

const env = existsSync('.env') ? readFileSync('.env', 'utf8') : '';
const envValue = (key) => {
  const line = env.split('\n').find((l) => l.trim().startsWith(`${key}=`));
  return line ? line.slice(line.indexOf('=') + 1).trim() : (process.env[key] ?? '').trim();
};

/* ---------------------------------------------------------- the operator --- */

// These four end up printed inside the privacy policy, the terms and the refund
// policy. A customer who cannot tell who they are contracting with has not been
// given a contract.
for (const [key, why] of [
  ['VITE_OPERATOR_NAME', 'the legal name of whoever receives the money, printed in the terms'],
  ['VITE_SUPPORT_EMAIL', 'where refund requests and data-deletion requests arrive'],
  ['VITE_GOVERNING_LAW', 'the law the terms run under'],
  ['VITE_POLICY_UPDATED', 'the date the policies took effect'],
]) {
  if (!envValue(key)) fail(`${key} is not set — ${why}.`);
}

const email = envValue('VITE_SUPPORT_EMAIL');
if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
  fail(`VITE_SUPPORT_EMAIL is not an email address: ${email}`);
}

/* ------------------------------------------------------------- accounts --- */

const appUrl = envValue('VITE_APP_URL');
if (!appUrl) {
  warn('VITE_APP_URL is not set. The Open Graph tags are dropped without it, so '
     + 'the link previews as a bare grey URL wherever it is posted — which is '
     + 'most of how a first customer arrives.');
} else if (!/^https:\/\/[^/]+$/.test(appUrl)) {
  fail(`VITE_APP_URL must be an https origin with no path or trailing slash: ${appUrl}`);
}

const url = envValue('VITE_SUPABASE_URL');
const anon = envValue('VITE_SUPABASE_ANON_KEY');
if (!url || !anon) {
  warn('No Supabase project configured. The app will run entirely locally and '
     + 'cannot take money — which is a valid way to ship it, but not a way to sell it.');
}

/* --------------------------------------------------------------- bundle --- */

if (!existsSync(DIST)) {
  fail('No dist/ — run `npm run build` first.');
} else {
  const assetsDir = join(DIST, 'assets');
  const bundle = existsSync(assetsDir)
    ? readdirSync(assetsDir)
        .filter((f) => f.endsWith('.js') || f.endsWith('.css'))
        .map((f) => readFileSync(join(assetsDir, f), 'utf8'))
        .join('\n')
    : '';

  // The one that would be catastrophic. service_role bypasses row-level
  // security: in a browser bundle it is every user's writing, readable by
  // anyone who opens devtools.
  for (const [pattern, what] of [
    [/service_role/, 'the string "service_role"'],
    [/\bsk_live_[A-Za-z0-9]/, 'a live Stripe secret key'],
    [/\bsk_test_[A-Za-z0-9]/, 'a test Stripe secret key'],
    [/\bwhsec_[A-Za-z0-9]/, 'a Stripe webhook secret'],
    [/\brk_live_[A-Za-z0-9]/, 'a Stripe restricted key'],
  ]) {
    if (pattern.test(bundle)) fail(`${what} appears in the built bundle. Nothing secret may ship to a browser.`);
  }

  // Placeholders that would be read by a customer.
  for (const marker of ['example.com', '[your company]', 'TODO', 'FIXME', 'lorem ipsum']) {
    if (bundle.toLowerCase().includes(marker.toLowerCase())) {
      warn(`The bundle contains "${marker}". Check it is not on a page anybody reads.`);
    }
  }

  if (appUrl && !existsSync(join(DIST, 'og.png'))) {
    fail('dist/og.png is missing, but the share tags point at it.');
  }

  if (!existsSync(join(DIST, '_headers'))) {
    fail('dist/_headers is missing — the deployed app would ship with no security headers.');
  }
}

/* ------------------------------------------------------------- payments --- */

// The two Edge Functions are the only things that can grant access. A build
// that sells without them takes money and delivers nothing.
for (const fn of ['create-checkout', 'stripe-webhook']) {
  if (!existsSync(join('supabase', 'functions', fn, 'index.ts'))) {
    fail(`supabase/functions/${fn} is missing — payment cannot complete without it.`);
  }
}
if (!existsSync(join('supabase', 'migrations', '0002_entitlements.sql'))) {
  fail('The entitlements migration is missing — there is nowhere to record a purchase.');
}

/* --------------------------------------------------------------- report --- */

for (const w of warns) console.log(`WARN  ${w}`);
for (const f of fails) console.log(`FAIL  ${f}`);

if (fails.length === 0) {
  console.log(`\nReady to take a payment.${warns.length ? ` ${warns.length} warning(s) above.` : ''}`);
  process.exit(0);
}
console.log(`\n${fails.length} thing(s) must be fixed before selling to anybody.`);
process.exit(1);
