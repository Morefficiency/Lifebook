/**
 * The loop closing: a belief the user confirmed, a practice written against it,
 * a prediction made in advance, and the prediction turning out to be wrong.
 *
 * This is the one path in the app where a belief is actually contradicted
 * rather than merely worked on, so it is worth an end-to-end suite of its own.
 * Logging a practice says the behaviour happened. Only this says the belief was
 * wrong about what would follow.
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
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });

await consent(page, BASE);
await writeVisions(page);
await shortForm(page);
await actTwo(page);

// --- the programme offers a test, not only a tick ------------------------
await page.goto(`${BASE}/#/blueprint`);
await page.getByRole('heading', { name: 'The work' }).waitFor({ timeout: 10000 });
await page.waitForTimeout(400);

const testLinks = page.getByRole('link', { name: 'Test it' });
const testCount = await testLinks.count();
check('The programme offers a way to test a belief, not only to log it', testCount > 0, `${testCount}`);
check('...on the behaviours, where there is something to go and do',
  testCount === await page.locator('main a:text("Test it")').count());

const beliefOnPage = await page.locator('main').innerText();
await testLinks.first().click();
await page.waitForURL('**/forge**');
await page.getByRole('heading', { name: /Forge|quest/i }).first().waitFor({ timeout: 10000 });
await page.waitForTimeout(300);

// --- the forge arrives knowing what it is testing ------------------------
const forge = await page.locator('main').innerText();
check('The forge says which belief is on trial', /testing/i.test(forge));
check('...and explains that doing the behaviour is not the mechanism',
  /it saying in advance what will go wrong/i.test(forge));

const wish = await page.locator('#wish').inputValue();
const belief = await page.locator('#belief').inputValue();
check('The behaviour is carried over rather than retyped', wish.trim().length > 0, wish.slice(0, 40));
check('So is the belief it was written against', belief.trim().length > 0, belief.slice(0, 40));
check('...and it is one of the beliefs the user actually confirmed',
  beliefOnPage.includes(belief.trim()), belief.slice(0, 40));

// --- make the belief commit to a prediction ------------------------------
await page.fill('#outcome', 'They take it as ordinary information and the conversation moves on.');
await page.fill('#obstacle', 'I will soften it into a joke before anyone can react to it.');
await page.fill('#cue-0', 'it is my turn to speak in the Thursday review');
await page.fill('#act-0', 'say the number once, plainly, and stop talking');
await page.fill('#feared', 'They will visibly think less of me and say so afterwards.');
await page.locator('#forecast').fill('80');
await page.locator('#fear').fill('7');
await page.getByRole('button', { name: 'Activate quest' }).click();
await page.waitForURL('**/quest/**');
await page.waitForTimeout(400);
check('A quest is created from the programme', page.url().includes('/quest/'), page.url());

// --- and then be wrong ---------------------------------------------------
await page.getByRole('button', { name: /File the field report|File it/ }).first().click();
await page.waitForTimeout(300);
await page.getByRole('button', { name: /^No, it/ }).click();
await page.waitForTimeout(200);
await page.fill('#what', 'I said the number without softening it and the meeting simply carried on.');
await page.getByRole('button', { name: 'File it' }).click();
await page.waitForTimeout(700);

const afterReport = await page.locator('main').innerText();
check('A confident forecast that did not happen is named as such',
  /prediction broken/i.test(afterReport), afterReport.split('\n').slice(0, 3).join(' / '));

// --- the standing view now shows what the belief has survived ------------
await page.goto(`${BASE}/#/life`);
await page.getByRole('heading', { name: 'Your life' }).waitFor({ timeout: 10000 });
await page.waitForTimeout(600);
const life = await page.locator('main').innerText();
check('The self half reports the belief having been wrong',
  /wrong once, when it was sure/i.test(life),
  (life.match(/wrong .{0,24}/) ?? [])[0] ?? 'not found');
check('...and it is attached to the identity that replaced it',
  /who you are becoming/i.test(life) && /instead of/i.test(life));

await page.screenshot({ path: `${OUT}/evidence-loop.png`, fullPage: true });
check('No console errors', errs.length === 0, errs.slice(0, 2).join(' | '));

console.log('\n' + (fails.length ? `FAILURES: ${fails.join(' | ')}` : 'ALL CHECKS PASSED'));
await browser.close();
process.exit(fails.length ? 1 : 0);
