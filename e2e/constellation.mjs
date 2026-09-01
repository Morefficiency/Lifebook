/**
 * The constellation.
 *
 * A WebGL scene cannot be read by a test, so these checks are about the things
 * around it that make it honest: that every node is reachable without a
 * pointer, that what the panel says matches what the standing view says, that
 * an unwritten area is present rather than dropped, and that the legend states
 * the one thing position is allowed to mean.
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
  process.env.CHROMIUM_PATH
    ? { executablePath: process.env.CHROMIUM_PATH, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }
    : { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] },
);
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });

await consent(page, BASE);
await writeVisions(page);
await shortForm(page);
await actTwo(page);

// --- the door is on the standing view ---------------------------------------
await page.goto(`${BASE}/#/life`);
await page.getByRole('heading', { name: 'Your life' }).waitFor({ timeout: 10000 });
const doors = await page.getByRole('link', { name: 'Open the constellation' }).count();
check('The standing view offers the constellation', doors >= 1, String(doors));
await page.getByRole('link', { name: 'Open the constellation' }).first().click();
await page.waitForURL('**/constellation');
await page.locator('[data-testid="constellation"] canvas').waitFor({ timeout: 15000 });
await page.waitForTimeout(1500);
check('A scene is rendered', (await page.locator('[data-testid="constellation"] canvas').count()) === 1);
check('...and the scene is not the accessible surface', (await page.locator('canvas[aria-hidden="true"]').count()) === 1);

// --- every node is reachable without a pointer ------------------------------
const rail = page.getByRole('navigation', { name: 'Areas' });
const buttons = rail.getByRole('button');
check('The rail lists the self and all twelve areas', (await buttons.count()) === 13, String(await buttons.count()));
const railText = await rail.innerText();
check('...grouped by how near they are to the person',
  /the person/i.test(railText) && /the people/i.test(railText) && /the world/i.test(railText));
check('...with the same positions the dial reports', /3\/10/.test(railText) && /8\/10/.test(railText));

// --- picking an area says what the standing view says -----------------------
await rail.getByRole('button', { name: /^Body/ }).click();
await page.waitForTimeout(400);
const panel = page.getByRole('complementary', { name: 'Detail' });
const body = await panel.innerText();
check('Picking an area opens it in the person\'s own words',
  /I train four mornings a week/.test(body));
check('...names its tier', /Area · the person/i.test(body));
check('...carries the same numbers', /matters 5\/5/.test(body) && /3\/10/.test(body));
check('...and marks it as the costliest, as the dial does', /most of the distance/i.test(body));
check('The crumb follows the pick', /Health & Body/.test(await page.locator('.glass').nth(1).innerText()));

// --- an unwritten area is present, not dropped -------------------------------
await rail.getByRole('button', { name: /^Spirit/ }).click();
await page.waitForTimeout(300);
const spirit = await panel.innerText();
check('An unwritten area keeps its place and says so', /not written yet/i.test(spirit));
check('...and offers a way to write it', (await panel.getByRole('link', { name: 'Write it' }).count()) === 1);

// --- the self ----------------------------------------------------------------
await rail.getByRole('button', { name: /^The self/ }).click();
await page.waitForTimeout(300);
const self = await panel.innerText();
check('The self lists the identities in progress',
  (self.match(/I am someone who/g) ?? []).length >= 3, String((self.match(/I am someone who/g) ?? []).length));
check('...each against the belief it replaces', /instead of/i.test(self));

// --- the legend says what position means, and that it means nothing else ----
const legend = await page.locator('[data-testid="constellation"]').innerText();
check('The legend states the one thing position is allowed to mean',
  /the only thing position means/i.test(legend));
check('...and what size, glow and outline are', /size is how much it matters/i.test(legend) && /outline is an area not yet written/i.test(legend));

// --- escape: clear, then leave ----------------------------------------------
await page.keyboard.press('Escape');
await page.waitForTimeout(300);
check('Escape clears the pick', !(await panel.evaluate((el) => el.classList.contains('opacity-100'))));
await page.keyboard.press('Escape');
await page.waitForURL('**/life', { timeout: 5000 });
check('...and a second Escape returns to the standing view', page.url().includes('/life'));

// --- screenshot, with a pick open, for the record ----------------------------
await page.goto(`${BASE}/#/constellation`);
await page.locator('[data-testid="constellation"] canvas').waitFor({ timeout: 15000 });
await page.waitForTimeout(2500);
await page.screenshot({ path: `${OUT}/constellation.png` });
await page.getByRole('navigation', { name: 'Areas' }).getByRole('button', { name: /^Work/ }).click();
await page.waitForTimeout(1800);
await page.screenshot({ path: `${OUT}/constellation-picked.png` });

check('No console errors', errs.length === 0, errs.slice(0, 2).join(' | '));
console.log('\n' + (fails.length ? `FAILURES: ${fails.join(' | ')}` : 'ALL CHECKS PASSED'));
await browser.close();
process.exit(fails.length ? 1 : 0);
