/**
 * The record, and what it says.
 *
 * Three experiments filed against one confirmed belief, each with a confident
 * forecast, each reported as not having happened. After two the app must say
 * nothing — two points is a guess. After three, the standing view must show
 * the gap between what the person still forecasts and what their own record
 * says, name the belief as held against the record, and offer the calibration
 * and untested-area questions. Then every area is placed a second time, and
 * the tiles must show where each one went.
 *
 * Numbers to expect, worked in engine/__tests__/credence.test.ts:
 *   forecasts 80, 75, 70 ; none happened → Beta(3, 4) → record says 43%
 *   latest forecast 70% → resistance 0.27 ≥ 0.20 → held
 *   mean forecast 75%, 0 of 3 → calibration bias 0.75 ≥ 0.30 → offered
 */
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';
import { DEFAULT_VISIONS, actTwo, consent, shortForm, writeVisions } from './lib/walk.mjs';

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

const lifeText = async () => {
  await page.goto(`${BASE}/#/life`);
  await page.getByRole('heading', { name: 'Your life' }).waitFor({ timeout: 10000 });
  await page.waitForTimeout(600);
  return page.locator('main').innerText();
};

/** The text of the belief the experiments are filed against, read off the forge. */
let testedBelief = '';

/** One experiment against the first behaviour's belief, reported as not happening. */
async function fileOne(forecast) {
  await page.goto(`${BASE}/#/blueprint`);
  await page.getByRole('heading', { name: 'The work' }).waitFor({ timeout: 10000 });
  await page.waitForTimeout(300);
  await page.getByRole('link', { name: 'Test it' }).first().click();
  await page.waitForURL('**/forge**');
  await page.getByRole('heading', { name: /Forge|quest/i }).first().waitFor({ timeout: 10000 });
  if (!testedBelief) testedBelief = (await page.locator('#belief').inputValue()).trim();

  await page.fill('#outcome', 'They take it as ordinary information and the conversation moves on.');
  await page.fill('#obstacle', 'I will soften it into a joke before anyone can react to it.');
  await page.fill('#cue-0', 'it is my turn to speak in the Thursday review');
  await page.fill('#act-0', 'say the number once, plainly, and stop talking');
  await page.fill('#feared', 'They will visibly think less of me and say so afterwards.');
  await page.locator('#forecast').fill(String(forecast));
  await page.locator('#fear').fill('7');
  await page.getByRole('button', { name: 'Activate quest' }).click();
  await page.waitForURL('**/quest/**');
  await page.waitForTimeout(300);

  await page.getByRole('button', { name: /File the field report|File it/ }).first().click();
  await page.waitForTimeout(250);
  await page.getByRole('button', { name: /^No, it/ }).click();
  await page.waitForTimeout(150);
  await page.fill('#what', 'I said the number without softening it and the meeting simply carried on.');
  await page.getByRole('button', { name: 'File it' }).click();
  await page.waitForTimeout(600);
}

await consent(page, BASE);
await writeVisions(page);
await shortForm(page);
await actTwo(page);

/* ---- before there is enough to say anything ------------------------------ */
{
  const life = await lifeText();
  check('the record section is on the standing view', /what your record says/i.test(life));
  check('...and says plainly that there is nothing yet', /nothing yet/i.test(life));
  check('...and no area shows a direction from a single placing', !/since \w{3} \d{4}/.test(life));
}

await fileOne(80);
await fileOne(75);
{
  const life = await lifeText();
  check('after two reports the app still offers nothing — two points is a guess',
    /nothing yet/i.test(life) && !/held against/i.test(life));
  // The section heading is "What your record says", so the check is for the
  // credence line itself, which only appears once there are three reports.
  check('...and does not yet put a number on what the record says', !/you still forecast/i.test(life));
}

/* ---- the third report: the record has an opinion ------------------------- */
await fileOne(70);
{
  const life = await lifeText();
  check('the self half shows the stated forecast against the record',
    /you still forecast 70%\. your record says 43%/i.test(life),
    (life.match(/you still forecast[^\n]*/i) ?? ['not found'])[0]);
  check('...and names the belief as held against the person\'s own record',
    /held against your own record/i.test(life));

  check('the record offers the held belief as a question', /held against the record/i.test(life)
    && /your record has stopped predicting this\. have you\?/i.test(life));
  check('...with its evidence on the card', /tested 3 times/i.test(life) && /most recent forecast[^\n]*70%/i.test(life));
  check('the record offers forecast-against-outcome for the area', /forecast against outcome/i.test(life)
    && /forecast the feared outcome at 75%/i.test(life) && /happened 0 of 3 times/i.test(life));
  check('...as a question, not a finding', /a belief about .*, or a habit of prediction\?/i.test(life));
  check('the record offers an important area that no experiment has touched',
    /untested/i.test(life) && /none of them touched it/i.test(life) && /is that a choice\?/i.test(life));
  check('every offer is a question', (life.match(/\?\n/g) ?? []).length >= 3);
  check('nothing on the page says what any of it means',
    !/you are (avoid|afraid|anxious)|this means|diagnos/i.test(life));
}

/* ---- which test next: the marker moves off the belief just tested -------- */
{
  await page.goto(`${BASE}/#/blueprint`);
  await page.getByRole('heading', { name: 'The work' }).waitFor({ timeout: 10000 });
  await page.waitForTimeout(400);
  const marked = page.locator('main section', { hasText: 'A test here would tell you the most' });
  check('the programme marks exactly one identity as the most informative to test',
    (await marked.count()) === 1, `${await marked.count()}`);
  const markedText = (await marked.count()) ? await marked.first().innerText() : '';
  check('...and it is not the belief that has just been tested three times',
    markedText.length > 0 && !markedText.includes(testedBelief.slice(0, 30)),
    testedBelief.slice(0, 40));
  check('...and it says that belief has never been put to a test', /never been put to one/i.test(markedText));
}

/* ---- placing everything a second time: the tiles gain a direction -------- */
{
  await page.goto(`${BASE}/#/current`);
  await page.getByRole('heading', { name: 'The life you have' }).waitFor({ timeout: 10000 });
  for (let i = 0; i < DEFAULT_VISIONS.length; i++) {
    await page.locator('#current-score').fill('8');
    await page.locator('#current-desc').fill('Placed again, a while later, and honestly higher than before.');
    await page.getByRole('button', {
      name: i < DEFAULT_VISIONS.length - 1 ? 'Next area' : 'Done — what shapes this?',
    }).click();
    await page.waitForTimeout(150);
  }
  const life = await lifeText();
  // Health & Body was first placed at 3, now 8.
  check('a re-placed area shows where it went, and since when',
    /\+5 since \w{3} \d{4}/.test(life), (life.match(/\+\d since[^\n]*/) ?? ['not found'])[0]);
  check('...and an area that did not move says so rather than nothing',
    /\b0 since \w{3} \d{4}/.test(life)); // Love & Partnership: 8 → 8
}

await page.screenshot({ path: `${OUT}/record-and-patterns.png`, fullPage: true });
check('No console errors', errs.length === 0, errs.slice(0, 2).join(' | '));

console.log('\n' + (fails.length ? `FAILURES: ${fails.join(' | ')}` : 'ALL CHECKS PASSED'));
await browser.close();
process.exit(fails.length ? 1 : 0);
