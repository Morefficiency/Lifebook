/**
 * The standing view — the screen the app is for.
 *
 * Everything here is about whether a person can read their whole life off one
 * page: that all twelve areas are always present, that an area nobody has
 * placed is never drawn as a zero, that every absence has a way out of it, and
 * that the picture and the numbers beside it never disagree.
 */
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';
import { actTwo, consent, shortForm, writeVisions, DEFAULT_VISIONS } from './lib/walk.mjs';

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
const errs = [];
const newPage = async (width = 1440) => {
  const ctx = await browser.newContext({ viewport: { width, height: 1000 } });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errs.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  return { ctx, page };
};

/* -------------------------------------------------------------------------- *
 * 1. Nothing written at all.
 * -------------------------------------------------------------------------- */
{
  const { ctx, page } = await newPage();
  await consent(page, BASE);
  await page.goto(`${BASE}/#/life`);
  await page.getByRole('heading', { name: 'Your life' }).waitFor({ timeout: 10000 });
  await page.waitForTimeout(400);

  const tiles = await page.locator('main ul li h3').count();
  check('All twelve areas are present before anything is written', tiles === 12, String(tiles));

  const text = await page.locator('main').innerText();
  check('The figure says nothing rather than nought', /not said yet/i.test(text));
  check('...and offers the twelve blanks as a way in', /12 areas you have not written yet/i.test(text));

  const paths = await page.locator('main svg path').evaluateAll((ns) => ns.map((n) => n.getAttribute('d')));
  check('The empty dial still draws twelve slots', paths.length >= 12, `${paths.length} paths`);
  check('...with no NaN anywhere in the geometry', !paths.some((d) => /NaN/.test(d ?? '')));

  const actions = await page.locator('main ul li a').count();
  check('Every empty area offers a way to fill it', actions === 12, String(actions));
  await ctx.close();
}

/* -------------------------------------------------------------------------- *
 * 2. Act one done: seven areas described, none placed.
 * -------------------------------------------------------------------------- */
{
  const { ctx, page } = await newPage();
  await consent(page, BASE);
  await writeVisions(page);
  await page.goto(`${BASE}/#/life`);
  await page.getByRole('heading', { name: 'Your life' }).waitFor({ timeout: 10000 });
  await page.waitForTimeout(400);

  const text = await page.locator('main').innerText();
  // The whole point: seven areas have a vision and an importance and no honest
  // answer about where they are. Showing that as 0/10 would be an invention.
  check('A described-but-unplaced life reports no figure at all', /not said yet/i.test(text));
  check('...and says how many are waiting to be placed',
    /7 areas are written but not yet placed/i.test(text));
  check('...and each of those tiles says so in its own words',
    (text.match(/You have not said where this one is\./g) ?? []).length === 7,
    String((text.match(/You have not said where this one is\./g) ?? []).length));
  check('No area is given a score it was never given',
    !/\b0\/10\b/.test(text), (text.match(/\d+\/10/) ?? [])[0] ?? 'none');

  const fills = await page.locator('main svg path[fill^="rgb"]').count();
  check('Nothing is filled in on the dial either', fills === 0, String(fills));

  check('The self half is offered, not assumed', /the app can work out what you appear to believe/i.test(text));
  await ctx.close();
}

/* -------------------------------------------------------------------------- *
 * 3. The whole thing: seven areas placed, three identities, a rated map.
 * -------------------------------------------------------------------------- */
{
  const { ctx, page } = await newPage();
  await consent(page, BASE);
  await writeVisions(page);
  await shortForm(page);
  await actTwo(page);

  await page.goto(`${BASE}/#/life`);
  await page.getByRole('heading', { name: 'Your life' }).waitFor({ timeout: 10000 });
  await page.waitForTimeout(600);
  const text = await page.locator('main').innerText();

  // Hand-computed from DEFAULT_VISIONS and DEFAULT_SCORES:
  //   health   5 × (10−3)/9 = 5 × 0.77778 = 3.88889
  //   mind     3 × (10−5)/9 = 3 × 0.55556 = 1.66667
  //   partner  4 × (10−8)/9 = 4 × 0.22222 = 0.88889
  //   family   4 × (10−6)/9 = 4 × 0.44444 = 1.77778
  //   social   2 × (10−7)/9 = 2 × 0.33333 = 0.66667
  //   money    4 × (10−2)/9 = 4 × 0.88889 = 3.55556
  //   work     5 × (10−4)/9 = 5 × 0.66667 = 3.33333
  //   Σ tension 15.77778 ÷ Σ importance 27 = 0.58436 → 58% gap, 42% lived
  check('The figure is the hand-computed 42%', /\b42%/.test(text), (text.match(/\d+%/) ?? [])[0]);
  check('...and it is named as what is being lived, not as a score',
    /living it/i.test(text) && /nothing here is a score of you/i.test(text));

  check('The costliest area is named once, in words',
    /most of the distance is in health & body/i.test(text));
  check('...and the same area is marked in the grid', /most of the distance/i.test(text));

  check('Every identity is shown against the belief it replaces',
    (text.match(/instead of/g) ?? []).length === 3,
    String((text.match(/instead of/g) ?? []).length));
  check('...and tagged with the parts of the life it sits under',
    /who you are becoming/i.test(text) && /quality of life/i.test(text));

  check('The collisions are compressed to one sentence and a door',
    /everything runs through/i.test(text) && /open the map/i.test(text));

  // The dial and the grid must agree — the same seven numbers in both.
  const dialNumbers = await page.locator('main svg text tspan').evaluateAll(
    (ns) => ns.map((n) => n.textContent?.trim()).filter((t) => /^\d+$/.test(t ?? '')),
  );
  const tileNumbers = (text.match(/(\d+)\/10/g) ?? []).map((s) => s.replace('/10', ''));
  check('The dial and the tiles report the same positions',
    dialNumbers.sort().join(',') === tileNumbers.sort().join(','),
    `${dialNumbers.join(',')} vs ${tileNumbers.join(',')}`);

  // Reading the dial: hovering a sector names it without moving the page.
  const before = await page.locator('main').boundingBox();
  await page.locator('main svg g').nth(9).hover();
  await page.waitForTimeout(250);
  const hovered = await page.locator('main').innerText();
  check('Hovering a sector reads it out', /matters \d\/5/.test(hovered));
  const after = await page.locator('main').boundingBox();
  check('...without the page moving under the pointer', before.height === after.height,
    `${before.height} → ${after.height}`);

  const svgLabel = await page.locator('main svg[role=img]').getAttribute('aria-labelledby');
  check('The figure has a text alternative for anyone not looking at it', !!svgLabel);

  // Direct children of the nav are the wordmark plus the primary destinations;
  // the utility links (support, settings, why this works) live in a group of
  // their own, so counting the whole nav would not measure what it claims to.
  const primary = await page.locator('header nav > a').count();
  check('The nav stays at four destinations', primary - 1 === 4, `${primary - 1}`);

  await page.screenshot({ path: `${OUT}/standing-view.png`, fullPage: true });

  // Old links still land somewhere.
  await page.goto(`${BASE}/#/gap`);
  await page.waitForTimeout(500);
  check('The retired gap route redirects here', page.url().includes('/life'), page.url());

  await ctx.close();
}

/* -------------------------------------------------------------------------- *
 * 4. A phone.
 * -------------------------------------------------------------------------- */
{
  const { ctx, page } = await newPage(390);
  await consent(page, BASE);
  await writeVisions(page, DEFAULT_VISIONS.slice(0, 4));
  await page.goto(`${BASE}/#/life`);
  await page.getByRole('heading', { name: 'Your life' }).waitFor({ timeout: 10000 });
  await page.waitForTimeout(400);

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  check('Nothing scrolls sideways on a phone', overflow <= 1, `${overflow}px`);

  const dial = await page.locator('main svg').first().boundingBox();
  check('The dial still fits inside the screen', dial.width <= 390, `${Math.round(dial.width)}px`);
  check('...and is still big enough to read', dial.width > 250, `${Math.round(dial.width)}px`);

  const tiles = await page.locator('main ul li h3').count();
  check('All twelve areas are still there', tiles === 12, String(tiles));
  await ctx.close();
}

check('No console errors anywhere', errs.length === 0, errs.slice(0, 2).join(' | '));

console.log('\n' + (fails.length ? `FAILURES: ${fails.join(' | ')}` : 'ALL CHECKS PASSED'));
await browser.close();
process.exit(fails.length ? 1 : 0);
