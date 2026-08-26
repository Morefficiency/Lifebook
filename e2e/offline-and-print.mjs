/**
 * The two things the app claims but never demonstrated: that it works with the
 * network off, and that the work can leave the screen.
 */
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const BASE = process.env.E2E_BASE ?? 'http://127.0.0.1:4173';
const OUT = process.env.E2E_OUT ?? 'e2e/.out';
mkdirSync(OUT, { recursive: true });
const fails = [];
const check = (n, ok, x = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${x ? ' — ' + x : ''}`);
  if (!ok) fails.push(n);
};

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));

await page.goto(BASE, { waitUntil: 'networkidle' });
if (await page.locator('#access-code').count()) await page.fill('#access-code', 'COHERENCE-V1');
await page.locator('input[type=checkbox]').nth(0).check();
await page.locator('input[type=checkbox]').nth(1).check();
await page.getByRole('button', { name: /^Start with the life you want/ }).click();
await page.waitForURL('**/vision');

// Write enough to have something worth printing.
const areas = [
  ['Health & Body', 'I wake before the alarm and train four mornings a week.', 5],
  ['Work & Craft', 'I do work I would do anyway, and my name on it means something.', 5],
  ['Money', 'A year of runway. I check the balance without bracing.', 3],
];
for (const [name, text, imp] of areas) {
  const head = page.getByRole('button', { name: new RegExp('^' + name) }).first();
  if (await head.getAttribute('aria-expanded') !== 'true') await head.click();
  await page.locator('textarea[id^="vision-"]').first().fill(text);
  await page.locator('button[aria-pressed]').filter({ hasText: new RegExp(`^${imp}$`) }).first().click();
  await head.click();
  await page.waitForTimeout(80);
}
await page.getByRole('button', { name: 'See your vision board' }).click();
await page.waitForURL('**/board');
// The board leads into the short-form map now; go straight to the life audit,
// which is all this suite needs before it starts pulling the plug.
await page.goto(`${BASE}/#/current`);
await page.waitForURL('**/current');
await page.getByRole('heading', { name: 'The life you have' }).waitFor();
for (let i = 0; i < 3; i++) {
  await page.locator('#current-score').fill(String([3, 4, 2][i]));
  await page.fill('#current-desc', 'Where this actually is, plainly stated for the record.');
  await page.getByRole('button', { name: i < 2 ? 'Next area' : 'Done — what shapes this?' }).click();
  await page.waitForTimeout(150);
}
await page.waitForURL('**/reflect', { timeout: 10000 });

/* -------------------------------------------------------------- offline -- */

// Let the service worker install and take control.
const swReady = await page.evaluate(async () => {
  if (!('serviceWorker' in navigator)) return 'unsupported';
  const reg = await navigator.serviceWorker.ready;
  return reg.active ? 'active' : 'no-active-worker';
});
check('A service worker installs and takes control', swReady === 'active', swReady);

await page.waitForTimeout(1500);
await ctx.setOffline(true);
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1200);

const offlineText = await page.locator('main').innerText().catch(() => '');
check('The app loads with the network off', offlineText.length > 0, `${offlineText.length} chars`);

await page.goto(`${BASE}/#/board`);
await page.waitForTimeout(800);
const boardOffline = await page.locator('main').innerText();
check('Work written earlier is still there offline',
  /I wake before the alarm/.test(boardOffline));

// Writing while offline must still be saved.
await page.goto(`${BASE}/#/vision`);
await page.getByRole('heading', { name: 'The life you want' }).waitFor();
const head = page.getByRole('button', { name: /^Mind & Learning/ }).first();
if (await head.getAttribute('aria-expanded') !== 'true') await head.click();
await page.locator('textarea[id^="vision-"]').first().fill('Written while offline.');
await page.waitForTimeout(700);
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1200);
await page.goto(`${BASE}/#/board`);
await page.waitForTimeout(800);
check('Something written offline survives a reload',
  /Written while offline/.test(await page.locator('main').innerText()));

await ctx.setOffline(false);

/* ---------------------------------------------------------------- print -- */

await page.goto(`${BASE}/#/print`);
await page.getByRole('heading', { name: 'My Lifebook' }).waitFor();
const sheet = await page.locator('main').innerText();
check('The print sheet carries the vision', /I wake before the alarm/.test(sheet));
check('...with what matters and where it is today',
  /matters 5\/5/.test(sheet) && /at 3\/10 today/.test(sheet));
check('...and the distance section', /Where the distance is/.test(sheet));

const printOnly = await page.evaluate(() => {
  // Emulating print media is the only honest way to check the print styles.
  const el = document.querySelector('.no-print');
  return el ? getComputedStyle(el).display : 'missing';
});
check('The controls exist on screen', printOnly !== 'missing' && printOnly !== 'none', printOnly);

await page.emulateMedia({ media: 'print' });
await page.waitForTimeout(200);
const printed = await page.evaluate(() => {
  const controls = document.querySelector('.no-print');
  const sheetEl = document.querySelector('.print-sheet');
  return {
    controlsHidden: controls ? getComputedStyle(controls).display === 'none' : false,
    bodyBg: getComputedStyle(document.body).backgroundColor,
    sheetColor: sheetEl ? getComputedStyle(sheetEl).color : '',
  };
});
check('Print hides the on-screen controls', printed.controlsHidden);
check('Print goes to white paper, not ink-blue', /255,\s*255,\s*255/.test(printed.bodyBg), printed.bodyBg);
check('Print text is near-black, not bone', /rgb\(17,\s*17,\s*17\)/.test(printed.sheetColor), printed.sheetColor);

const pdf = await page.pdf({ format: 'A4', printBackground: false }).catch(() => null);
check('It renders to a PDF', !!pdf && pdf.length > 1000, pdf ? `${Math.round(pdf.length / 1024)} KB` : 'failed');
await page.emulateMedia({ media: 'screen' });
await page.screenshot({ path: `${OUT}/print-sheet.png`, fullPage: true });

check('No console errors', errs.length === 0, errs.slice(0, 2).join(' | '));

console.log('\n' + (fails.length ? `FAILURES: ${fails.join(' | ')}` : 'ALL CHECKS PASSED'));
await browser.close();
process.exit(fails.length ? 1 : 0);
