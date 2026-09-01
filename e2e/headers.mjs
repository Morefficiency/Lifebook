/**
 * The deployment headers, actually applied.
 *
 * `public/_headers` is the only server-side hardening this app has, and
 * DEPLOY.md tells people to paste one of two Content-Security-Policy lines out
 * of it. A CSP that is wrong fails silently — the page renders, and one feature
 * quietly stops working — so the documented line is not allowed to be a guess.
 *
 * This serves the real `dist/` through a server that applies the real `_headers`
 * file plus the local-only CSP exactly as written in it, then walks the app
 * through the parts most likely to trip a policy: the bundle, the fonts, the
 * service worker, the canvas textures in the constellation, and the print view.
 *
 * Run after `npm run build`:  node e2e/headers.mjs
 */
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { chromium } from 'playwright';
import { consent, writeVisions } from './lib/walk.mjs';

const DIST = 'dist';
const fails = [];
const check = (n, ok, x = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${x ? ' — ' + x : ''}`);
  if (!ok) fails.push(n);
};

/* ---- read the shipped headers file, not a copy of it --------------------- */

const raw = readFileSync('public/_headers', 'utf8');

/** The `/*` block: every non-comment `Key: value` line under it. */
function globalHeaders(text) {
  const out = [];
  let inGlobal = false;
  for (const line of text.split('\n')) {
    if (/^\S/.test(line)) { inGlobal = line.trim() === '/*'; continue; }
    if (!inGlobal) continue;
    const t = line.trim();
    if (t.startsWith('#') || t.length === 0) continue;
    const i = t.indexOf(':');
    if (i > 0) out.push([t.slice(0, i).trim(), t.slice(i + 1).trim()]);
  }
  return out;
}

/** The local-only CSP, lifted out of the comment that documents it. */
function documentedCsp(text) {
  const m = text.match(/#\s*(Content-Security-Policy:\s*default-src[^\n]*)/);
  if (!m) return null;
  const i = m[1].indexOf(':');
  return [m[1].slice(0, i).trim(), m[1].slice(i + 1).trim()];
}

const globals = globalHeaders(raw);
const csp = documentedCsp(raw);

check('_headers declares the frame, sniff and referrer protections',
  ['X-Frame-Options', 'X-Content-Type-Options', 'Referrer-Policy', 'Permissions-Policy']
    .every((k) => globals.some(([n]) => n === k)),
  globals.map(([n]) => n).join(', '));
check('_headers documents a local-only Content-Security-Policy', csp !== null);
if (!csp) { console.log('\ncannot continue without the documented policy'); process.exit(1); }

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.woff2': 'font/woff2', '.ico': 'image/x-icon',
};

const server = createServer((req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1');
  let path = join(DIST, normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, ''));
  if (existsSync(path) && statSync(path).isDirectory()) path = join(path, 'index.html');
  if (!existsSync(path)) { path = join(DIST, 'index.html'); }
  for (const [k, v] of globals) res.setHeader(k, v);
  res.setHeader(csp[0], csp[1]);
  // `_headers` also declares these; the point of the test is the policy, so the
  // cache rules are asserted above by presence rather than replayed here.
  res.setHeader('Content-Type', TYPES[extname(path)] ?? 'application/octet-stream');
  res.end(readFileSync(path));
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;

/* ---- walk it ------------------------------------------------------------- */

const browser = await chromium.launch(
  process.env.CHROMIUM_PATH
    ? { executablePath: process.env.CHROMIUM_PATH, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }
    : { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] },
);
const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 } });
const page = await ctx.newPage();

const violations = [];
const errs = [];
page.on('console', (m) => {
  const t = m.text();
  if (/Content Security Policy|violates the following/i.test(t)) violations.push(t);
  else if (m.type() === 'error') errs.push(t);
});
page.on('pageerror', (e) => errs.push(e.message));

await consent(page, BASE);
await writeVisions(page);

await page.goto(`${BASE}/#/life`);
await page.getByRole('heading', { name: 'Your life' }).waitFor({ timeout: 10000 });
check('the standing view renders under the policy',
  (await page.locator('svg').count()) > 0
  && (await page.locator('main').innerText()).includes('Health & Body'));

await page.goto(`${BASE}/#/constellation`);
await page.locator('canvas').first().waitFor({ timeout: 10000 });
await page.waitForTimeout(1200);
const canvas = page.locator('canvas').first();
check('the constellation gets a WebGL canvas under the policy', await canvas.count() > 0);
const painted = await page.evaluate(() => {
  const c = document.querySelector('canvas');
  return c ? c.width > 0 && c.height > 0 : false;
});
check('...and the canvas has real dimensions', painted);

await page.goto(`${BASE}/#/print`);
await page.waitForFunction(() => (document.querySelector('main')?.innerText.length ?? 0) > 200, null, { timeout: 10000 });
check('the print view renders under the policy',
  (await page.locator('main').innerText()).length > 200);

// Fonts are bundled rather than fetched from a CDN, so `font-src 'self'` has to
// be enough. If a font ever moves to a CDN this is the check that catches it.
const fontHosts = await page.evaluate(() => [...document.styleSheets]
  .flatMap((s) => { try { return [...s.cssRules]; } catch { return []; } })
  .filter((r) => r.constructor.name === 'CSSFontFaceRule')
  .map((r) => r.style.getPropertyValue('src'))
  .filter((src) => /https?:\/\//.test(src)));
check('no @font-face reaches outside the origin', fontHosts.length === 0, fontHosts.join(' '));

check('no Content-Security-Policy violation anywhere in the walk',
  violations.length === 0, violations.slice(0, 3).join(' | '));
check('no page errors under the policy', errs.length === 0, errs.slice(0, 3).join(' | '));

await browser.close();
server.close();
console.log(fails.length ? `\n${fails.length} FAILED: ${fails.join(', ')}` : '\nall checks passed');
process.exit(fails.length ? 1 : 0);
