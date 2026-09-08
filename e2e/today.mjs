/**
 * Today's reading: short, the person's own words, and it tells you to leave.
 *
 * Walks act one and act two so there is something to read, then checks the
 * page holds exactly what engine/today says it should — an identity, the
 * belief it replaces, the area carrying most distance with the person's own
 * line for it, the daily practices — and nothing that counts, scores or
 * pushes. The identity rotation is by date and is unit-tested; here the check
 * is that the same identity is shown across two visits in one sitting.
 */
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';
import { actTwo, consent, shortForm, writeVisions } from './lib/walk.mjs';

const BASE = process.env.E2E_BASE ?? 'http://127.0.0.1:4173';
const OUT = process.env.E2E_OUT ?? 'e2e/.out';
mkdirSync(OUT, { recursive: true });
const fails = [];
const check = (n, ok, x = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${x ? ' — ' + x : ''}`);
  if (!ok) fails.push(n);
};

const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
);
const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });

const today = async () => {
  await page.goto(`${BASE}/#/today`);
  await page.getByRole('heading', { name: 'Today', exact: true }).waitFor({ timeout: 10000 });
  await page.waitForTimeout(400);
  return page.locator('main').innerText();
};

// A fresh profile has nothing to assemble a reading from, and says so.
await consent(page, BASE);
{
  const t = await today();
  check('with nothing written, the page says there is nothing to read yet', /nothing to read yet/i.test(t));
  check('...and does not pretend otherwise', !/hold this today|due today/i.test(t));
}

// Back to where the walk expects to start: the empty-state visit above left
// the page on /today.
await page.goto(`${BASE}/#/vision`);
await page.getByRole('heading', { name: 'The life you want' }).waitFor({ timeout: 10000 });
await writeVisions(page);
await shortForm(page);
await actTwo(page);

// The standing view offers the door once there is an identity to hold.
await page.goto(`${BASE}/#/life`);
await page.getByRole('heading', { name: 'Your life' }).waitFor({ timeout: 10000 });
await page.waitForTimeout(400);
check('the standing view has the daily door', (await page.getByRole('link', { name: /Today’s reading/ }).count()) === 1);
check('...and the nav still keeps to its four', (await page.locator('header nav a[href="#/today"]').count()) === 0);

const first = await today();
check('the reading names an identity to hold', /hold this today/i.test(first) && /I am someone who/i.test(first));
check('...with the belief it replaces, struck through in the person\'s words', /instead of/i.test(first));
check('...the area carrying most distance, with their own vision line for it',
  /where most of the distance is/i.test(first) && /Health & Body/.test(first) && /four mornings a week/i.test(first));
check('...and what is due today, by the cadence they chose', /due today/i.test(first) && /daily/i.test(first));
check('it ends by telling the person to close it', /close this and go/i.test(first));
check('it is short', first.split('\n').filter((l) => l.trim()).length < 40, `${first.split('\n').length} lines`);
check('nothing on it counts, scores or streaks', !/streak|score|\d+ days in a row|keep it up|missed/i.test(first));

const identityShown = (first.match(/I am someone who[^\n]*/) ?? [''])[0];
const second = await today();
check('the same identity is held across the whole day', second.includes(identityShown), identityShown.slice(0, 50));

await page.screenshot({ path: `${OUT}/today.png`, fullPage: true });
check('No console errors', errs.length === 0, errs.slice(0, 2).join(' | '));

console.log('\n' + (fails.length ? `FAILURES: ${fails.join(' | ')}` : 'ALL CHECKS PASSED'));
await browser.close();
process.exit(fails.length ? 1 : 0);
