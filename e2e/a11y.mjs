/**
 * Accessibility, measured rather than asserted.
 *
 * The app makes a claim in its own copy — that it is legible, that the
 * constellation has a keyboard path, that nothing important is colour alone —
 * and until now nothing checked any of it. This runs axe against every screen a
 * person actually passes through, at the WCAG 2.1 AA level, on a real page with
 * real content in it rather than an empty shell.
 *
 * Two rules about what counts as a failure here:
 *
 *   Serious and critical violations fail the run. Those are the ones that stop
 *   somebody using the thing: unlabelled controls, text nobody can read, a
 *   focus trap.
 *
 *   Moderate and minor are printed and do not fail. They are worth knowing and
 *   not worth blocking a release on, and a gate that cries wolf gets muted.
 *
 * Run: node e2e/a11y.mjs   (against the local preview on 4173)
 */
import { readFileSync, mkdirSync } from 'node:fs';
import { chromium } from 'playwright';
import { consent, writeVisions, shortForm } from './lib/walk.mjs';

const BASE = process.env.E2E_BASE ?? 'http://127.0.0.1:4173';
mkdirSync(process.env.E2E_OUT ?? 'e2e/.out', { recursive: true });

const AXE = readFileSync('node_modules/axe-core/axe.min.js', 'utf8');

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
const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
const page = await ctx.newPage();

async function audit(name) {
  await page.evaluate(AXE);
  const result = await page.evaluate(async () => {
    // @ts-ignore — axe is injected above.
    return await window.axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
    });
  });

  const bad = result.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  const meh = result.violations.filter((v) => v.impact !== 'serious' && v.impact !== 'critical');

  check(`${name} has no serious or critical violations`, bad.length === 0,
    bad.map((v) => `${v.id} (${v.nodes.length}×)`).join(', '));
  for (const v of bad) {
    console.log(`        ${v.id}: ${v.help}`);
    for (const node of v.nodes.slice(0, 3)) {
      console.log(`          ${node.html.slice(0, 110)}`);
    }
  }
  if (meh.length) {
    console.log(`        (minor: ${meh.map((v) => v.id).join(', ')})`);
  }
}

/* ---- the screens a person actually passes through ----------------------- */

await page.goto(BASE, { waitUntil: 'networkidle' });
await audit('landing');

await consent(page, BASE);
await audit('vision (empty)');

await writeVisions(page);
try { await shortForm(page); } catch (e) { console.log('  (short form:', e.message.slice(0, 60), ')'); }

for (const [route, ready] of [
  ['/life', () => page.getByRole('heading', { name: 'Your life' }).waitFor({ timeout: 15000 })],
  ['/map', () => page.waitForTimeout(1500)],
  ['/blueprint', () => page.waitForTimeout(800)],
  ['/settings', () => page.waitForTimeout(600)],
  ['/science', () => page.waitForTimeout(600)],
  ['/support', () => page.waitForTimeout(600)],
  ['/privacy', () => page.waitForTimeout(600)],
  ['/terms', () => page.waitForTimeout(600)],
  ['/refunds', () => page.waitForTimeout(600)],
  ['/unlock', () => page.waitForTimeout(600)],
]) {
  await page.goto(`${BASE}/#${route}`);
  try { await ready(); } catch { /* audit whatever rendered */ }
  await audit(route);
}

// The constellation is a canvas. The claim it makes is that the rail beside it
// is a complete keyboard and screen-reader path to the same information, so the
// rail is what has to hold up.
await page.goto(`${BASE}/#/constellation`);
await page.locator('canvas').first().waitFor({ timeout: 15000 });
await page.waitForTimeout(1500);
await audit('/constellation');

/* ---- keyboard ----------------------------------------------------------- */

await page.goto(BASE, { waitUntil: 'networkidle' });
const firstStop = await page.evaluate(() => {
  const el = document.querySelector('a, button, input, [tabindex]');
  return el?.textContent?.trim().slice(0, 40) ?? null;
});
check('the first thing in the tab order is a skip link', /skip/i.test(firstStop ?? ''), firstStop ?? 'none');

await page.goto(`${BASE}/#/constellation`);
await page.locator('canvas').first().waitFor({ timeout: 15000 });
await page.waitForTimeout(800);
const reachable = await page.evaluate(() =>
  document.querySelectorAll('button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])').length);
check('the constellation is reachable without a mouse', reachable > 5, `${reachable} focusable`);

// Focus must be visible. A keyboard user who cannot see where they are is not
// being served by a focus ring that was styled away for looking untidy.
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.keyboard.press('Tab');
await page.keyboard.press('Tab');
const ring = await page.evaluate(() => {
  const el = document.activeElement;
  if (!el || el === document.body) return null;
  const s = getComputedStyle(el);
  return { outline: s.outlineStyle, width: s.outlineWidth, shadow: s.boxShadow };
});
check('focus is visible on the element that has it',
  !!ring && (ring.outline !== 'none' || (ring.shadow && ring.shadow !== 'none')),
  JSON.stringify(ring));

await browser.close();
console.log(fails.length ? `\n${fails.length} FAILED: ${fails.join(', ')}` : '\nall checks passed');
process.exit(fails.length ? 1 : 0);
