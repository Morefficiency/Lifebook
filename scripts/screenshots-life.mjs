/**
 * The standing view in the three states people actually arrive in.
 * Asserts nothing — it exists so the screen can be reviewed without running it.
 */
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';
import { actTwo, consent, shortForm, writeVisions, DEFAULT_VISIONS } from '../e2e/lib/walk.mjs';

const BASE = process.env.E2E_BASE ?? 'http://127.0.0.1:4173';
const OUT = process.env.SHOT_OUT ?? 'e2e/.shots';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
);
const errs = [];

async function shoot(name, { width = 1440, prepare, path = '/#/life', heading = 'Your life', print = false }) {
  const ctx = await browser.newContext({ viewport: { width, height: 1000 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errs.push(`${name}: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') errs.push(`${name}: ${m.text()}`); });
  await consent(page, BASE);
  if (prepare) await prepare(page);
  await page.goto(`${BASE}${path}`);
  await page.getByRole('heading', { name: heading }).waitFor({ timeout: 15000 });
  await page.waitForTimeout(700);
  if (print) { await page.emulateMedia({ media: 'print' }); await page.waitForTimeout(400); }
  const file = `${OUT}/${name}.png`;
  await page.screenshot({ path: file, fullPage: true });
  console.log(file);
  await ctx.close();
}

await shoot('life-1-empty', {});
await shoot('life-2-described', { prepare: (p) => writeVisions(p) });
await shoot('life-3-whole', {
  prepare: async (p) => { await writeVisions(p); await shortForm(p); await actTwo(p); },
});
await shoot('life-4-phone', {
  width: 390,
  prepare: (p) => writeVisions(p, DEFAULT_VISIONS.slice(0, 4)),
});
// The paper artifact, in the media it is actually for.
await shoot('life-5-print', {
  width: 1100,
  path: '/#/print',
  heading: 'My Lifebook',
  print: true,
  prepare: async (p) => { await writeVisions(p); await shortForm(p); await actTwo(p); },
});

if (errs.length) console.log('errors:', errs);
await browser.close();
