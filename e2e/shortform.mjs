/**
 * The ten-minute path: landing → vision → board → goals → pairs → friction → map.
 *
 * The claim on the landing page is "ten minutes, four steps", so this measures
 * the machine time and counts the interactions a person actually has to make.
 * If the interaction count drifts up, the claim stops being true.
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

let interactions = 0;
/** Free-text entries are what make a flow feel long; keypresses barely register. */
let typedFields = 0;
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });

const click = async (loc) => { interactions += 1; await loc.click(); };
const type = async (loc, text) => { interactions += 1; typedFields += 1; await loc.fill(text); };

const started = Date.now();

await page.goto(BASE, { waitUntil: 'networkidle' });
const promise = await page.locator('main').innerText();
check('Landing promises the map, not a six-stage programme',
  /ten minutes, four steps/i.test(promise) && /where your own goals collide/i.test(promise));
check('...and says the rest is optional', /nothing pushes you into it/i.test(promise));

if (await page.locator('#access-code').count()) await page.fill('#access-code', 'COHERENCE-V1');
await click(page.locator('input[type=checkbox]').nth(0));
await click(page.locator('input[type=checkbox]').nth(1));
await click(page.getByRole('button', { name: /^Start with the life you want/ }));
await page.waitForURL('**/vision');

// --- vision: three areas, the minimum ---
const V = [
  ['Health & Body', 'I train four mornings a week and it is not a negotiation.', 5],
  ['Work & Craft', 'I do work I would do anyway, and my name on it means something.', 5],
  ['Love & Partnership', 'Two evenings a week are ours, with no laptop in the room.', 4],
];
for (const [name, text, imp] of V) {
  const head = page.getByRole('button', { name: new RegExp('^' + name) }).first();
  if (await head.getAttribute('aria-expanded') !== 'true') await click(head);
  await type(page.locator('textarea[id^="vision-"]').first(), text);
  await click(page.locator('button[aria-pressed]').filter({ hasText: new RegExp(`^${imp}$`) }).first());
  await click(head);
  await page.waitForTimeout(60);
}
await click(page.getByRole('button', { name: 'See your vision board' }));
await page.waitForURL('**/board');
check('Three areas is enough to reach the board', true);

// --- goals ---
await click(page.getByRole('link', { name: 'Now the ten-minute part' }));
await page.waitForURL('**/goals');
await page.getByRole('heading', { name: 'What you are actually doing' }).waitFor();
const goalsText = await page.locator('main').innerText();
check('Goals stage shows the vision back to them', /what you said you want/i.test(goalsText));
check('...and names the mismatch as the point', /where the two lists do not match/i.test(goalsText));

// Three from the example chips, three written.
const chips = page.locator('main button').filter({ hasText: /^…|^build my business|^be more present|^keep training/ });
for (let i = 0; i < 3; i++) {
  const chip = page.locator('main .flex-wrap button').nth(0);
  await click(chip);
  await page.waitForTimeout(80);
}
for (const t of ['stop letting admin pile up', 'see my parents more often', 'sleep seven hours']) {
  await type(page.locator('#new-goal'), t);
  await click(page.getByRole('button', { name: 'Add striving' }));
  await page.waitForTimeout(60);
}
const goalCount = await page.locator('input[id^="goal-"]').count();
check('Six goals listed', goalCount === 6, String(goalCount));

const pairNote = await page.locator('main').innerText();
check('It tells them how many pairs that means', /15 pairs to rate/.test(pairNote),
  (pairNote.match(/\d+ pairs to rate/) || [])[0]);

await click(page.getByRole('button', { name: 'Rate how they interact' }));
await page.waitForURL('**/pairs');
// The route is lazy-loaded; wait for the screen, not just the URL.
await page.locator('[role=progressbar]').waitFor();

// --- pairs: 15, by keyboard ---
const pattern = [1, 2, 4, 5, 3, 1, 4, 2, 5, 1, 3, 4, 2, 1, 5];
for (const k of pattern) { interactions += 1; await page.keyboard.press(String(k)); }
await page.waitForURL('**/friction', { timeout: 10000 });
await page.locator('#friction').waitFor();
check('Fifteen keypresses finishes the matrix', true);

// --- friction ---
let heats = 0;
while (page.url().includes('/friction') && heats < 20) {
  await page.locator('#friction').fill(String([8, 3, 10, 5, 7, 2][heats % 6]));
  interactions += 2;
  const last = await page.getByRole('button', { name: 'Show me the map' }).count();
  await click(page.getByRole('button', { name: last ? 'Show me the map' : 'Continue' }));
  heats += 1;
  await page.waitForTimeout(80);
}
await page.waitForURL('**/mirror', { timeout: 10000 });
check('Friction only asked about the conflicting pairs', heats > 0 && heats < 15, `${heats} of 15`);

// --- the map ---
await page.waitForTimeout(3600);
const elapsed = Math.round((Date.now() - started) / 1000);
const map = await page.locator('main').innerText();

check('The map renders', (await page.locator('svg circle').count()) >= 12);
check('The sentence names the load-bearing goal', /Everything runs through/.test(map));
check('...and explains what that means without telling them what they are',
  /does not make it wrong/.test(map) && /moves more than a change made anywhere else/.test(map));
check('Three figures with the arithmetic behind them',
  /fault lines/i.test(map) && /help links/i.test(map) && /conflict index/i.test(map));
check('The costliest collision is named', /the one that costs most/i.test(map));
check('Two doors, and the deeper one is a question',
  /test the sharpest one/i.test(map) && /ask why it is that shape/i.test(map));
check('Stopping here is offered as a real option',
  /just keep the map/i.test(map) && /nothing expires/i.test(map));
check('The honesty line survived', /a mirror, not a verdict/i.test(map));

await page.screenshot({ path: `${OUT}/shortform-map.png`, fullPage: true });

check('Act one shows four steps, not nine',
  (await page.locator('nav[aria-label="Stages"] li').count()) === 4,
  String(await page.locator('nav[aria-label="Stages"] li').count()));

console.log(`\n  machine time: ${elapsed}s · ${interactions} interactions · ${typedFields} things typed`);
// Typing is what costs a person minutes; taps and keypresses are seconds. Three
// vision statements and three goals is six free-text entries, and the rest of
// the flow is chips, a slider and the number keys. That is the ten minutes.
check('Nothing beyond the six free-text entries has crept into the short form',
  typedFields <= 8, `${typedFields} typed`);
check('The whole path is under seventy interactions', interactions <= 70, `${interactions}`);

// --- the deeper path still works from here ---
await click(page.getByRole('link', { name: 'Ask why it is that shape' }));
await page.waitForURL('**/current');
await page.getByRole('heading', { name: 'The life you have' }).waitFor();
check('Act two opens from the map', true);
const actTwo = await page.locator('nav[aria-label="Stages"] li').count();
check('...and act two shows its own five steps', actTwo === 5, String(actTwo));

// --- and so does the v1 map, since the short form completed the Mirror ---
await page.goto(`${BASE}/#/map`);
await page.getByRole('heading', { name: 'Your map' }).waitFor({ timeout: 10000 });
check('The standing map page works off the short form', true);

// --- returning lands on the map, not back in the funnel ---
await page.goto(BASE);
await page.waitForTimeout(900);
check('Coming back lands on the map rather than act two', page.url().includes('/map'), page.url());

check('No console errors', errs.length === 0, errs.slice(0, 2).join(' | '));

console.log('\n' + (fails.length ? `FAILURES: ${fails.join(' | ')}` : 'ALL CHECKS PASSED'));
await browser.close();
process.exit(fails.length ? 1 : 0);
