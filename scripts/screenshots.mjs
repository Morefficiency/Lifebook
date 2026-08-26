/**
 * Walks the whole product once and photographs every screen.
 * Not a test — it asserts nothing. It exists so the app can be reviewed
 * without running it, and it drives the same paths the e2e suites drive.
 */
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const BASE = process.env.E2E_BASE ?? 'http://127.0.0.1:4173';
const OUT = process.env.SHOT_OUT ?? 'e2e/.shots';
mkdirSync(OUT, { recursive: true });

let n = 0;
const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}
);
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();
const shot = async (name, opts = {}) => {
  await p.waitForTimeout(opts.settle ?? 350);
  const file = `${OUT}/${String(++n).padStart(2, '0')}-${name}.png`;
  await p.screenshot({ path: file, fullPage: opts.full !== false });
  console.log(file);
};

// ---------- landing ----------
await p.goto(BASE, { waitUntil: 'networkidle' });
await shot('landing');

if (await p.locator('#access-code').count()) await p.fill('#access-code', 'COHERENCE-V1');
await p.locator('input[type=checkbox]').nth(0).click();
await p.locator('input[type=checkbox]').nth(1).click();
await p.getByRole('button', { name: /^Start with the life you want/ }).click();
await p.waitForURL('**/vision');

// ---------- act one ----------
const V = [
  ['Health & Body', 'I train four mornings a week and it is not a negotiation.', 5],
  ['Work & Craft', 'I do work I would do anyway, and my name on it means something.', 5],
  ['Money', 'Six months of runway in the bank and I stop checking the balance.', 4],
  ['Love & Partnership', 'Two evenings a week are ours, with no laptop in the room.', 4],
];
let shotVision = false;
for (const [name, text, imp] of V) {
  const head = p.getByRole('button', { name: new RegExp('^' + name) }).first();
  if ((await head.getAttribute('aria-expanded')) !== 'true') await head.click();
  await p.locator('textarea[id^="vision-"]').first().fill(text);
  await p.locator('button[aria-pressed]').filter({ hasText: new RegExp(`^${imp}$`) }).first().click();
  if (!shotVision) { await shot('vision-writing'); shotVision = true; }
  await head.click();
  await p.waitForTimeout(60);
}
await shot('vision-filled');

await p.getByRole('button', { name: 'See your vision board' }).click();
await p.waitForURL('**/board');
await shot('board');

await p.getByRole('link', { name: 'Now the ten-minute part' }).click();
await p.waitForURL('**/goals');
await p.getByRole('heading', { name: 'What you are actually doing' }).waitFor();
for (let i = 0; i < 3; i++) { await p.locator('main .flex-wrap button').nth(0).click(); await p.waitForTimeout(80); }
for (const t of ['stop letting admin pile up', 'see my parents more often', 'sleep seven hours']) {
  await p.locator('#new-goal').fill(t);
  await p.getByRole('button', { name: 'Add striving' }).click();
  await p.waitForTimeout(60);
}
await shot('goals');

await p.getByRole('button', { name: 'Rate how they interact' }).click();
await p.waitForURL('**/pairs');
await p.locator('[role=progressbar]').waitFor();
await shot('pairs');

const pattern = [1, 2, 4, 5, 3, 1, 4, 2, 5, 1, 3, 4, 2, 1, 5];
for (const k of pattern) await p.keyboard.press(String(k));
await p.waitForURL('**/friction', { timeout: 10000 });
await p.locator('#friction').waitFor();
await shot('friction');

let heats = 0;
while (p.url().includes('/friction') && heats < 20) {
  await p.locator('#friction').fill(String([8, 3, 10, 5, 7, 2][heats % 6]));
  const last = await p.getByRole('button', { name: 'Show me the map' }).count();
  await p.getByRole('button', { name: last ? 'Show me the map' : 'Continue' }).click();
  heats += 1;
  await p.waitForTimeout(80);
}
await p.waitForURL('**/mirror', { timeout: 10000 });
await shot('map', { settle: 3800 });

// the explain popover on one of the three figures
const explain = p.locator('main button').filter({ hasText: /how is this computed|how this is computed/i });
if (await explain.count()) { await explain.first().click(); await shot('map-how-computed', { full: false }); await p.keyboard.press('Escape'); }

// ---------- act two ----------
await p.getByRole('link', { name: 'Ask why it is that shape' }).click();
await p.waitForURL('**/current');
await p.getByRole('heading', { name: 'The life you have' }).waitFor();
const SCORE_BY_AREA = { 'Health & Body': 3, 'Work & Craft': 3, 'Money': 2, 'Love & Partnership': 8 };
for (let i = 0; i < 4; i++) {
  const heading = await p.locator('main h2').first().innerText();
  await p.locator('#current-score').fill(String(SCORE_BY_AREA[heading] ?? 4));
  await p.locator('#current-desc').fill('Honest description of where ' + heading + ' actually is right now.');
  if (i === 0) await shot('current');
  await p.getByRole('button', { name: i < 3 ? 'Next area' : 'Done — what shapes this?' }).click();
  await p.waitForTimeout(150);
}
await p.waitForURL('**/reflect', { timeout: 10000 });
await shot('reflect');

let k = 0;
while (p.url().includes('/reflect') && k < 20) {
  const multi = await p.getByText('Choose as many as are true.').count();
  const opts = p.locator('main button[aria-pressed]');
  const count = await opts.count();
  if (count > 0) await opts.nth(k % Math.max(1, count - 1)).click();
  if (multi > 0) { const nx = p.getByRole('button', { name: /^(Next|Done)$/ }); if (await nx.count()) await nx.first().click(); }
  k++; await p.waitForTimeout(80);
}
await p.waitForURL('**/self-image', { timeout: 10000 });
await shot('self-image');

await p.locator('button:text("Why is this being asked?")').first().click();
await p.waitForTimeout(250);
await shot('self-image-why', { full: false });
await p.keyboard.press('Escape');

await p.locator('button:text("Yes, that is mine")').first().click(); await p.waitForTimeout(200);
await p.locator('button:text("Yes, that is mine")').first().click(); await p.waitForTimeout(200);
await p.locator('button:text("Yes, that is mine")').first().click(); await p.waitForTimeout(200);
await shot('self-image-confirmed');

await p.getByRole('button', { name: 'Who would I have to be instead?' }).click();
await p.waitForURL('**/becoming');
await p.waitForTimeout(400);
const blanks = p.locator('textarea[id^="identity-"]');
for (let i = 0; i < (await blanks.count()); i++) {
  const v = await blanks.nth(i).inputValue();
  if (!v.trim()) { await blanks.nth(i).fill('I am someone who takes the good version for himself.'); await blanks.nth(i).blur(); }
}
await shot('becoming');

await p.getByRole('button', { name: 'Build the programme' }).click();
await p.waitForURL('**/blueprint');
await shot('blueprint', { settle: 700 });

// ---------- standing screens ----------
for (const [path, name, heading] of [
  ['/gap', 'gap-dashboard', null],
  ['/map', 'map-standing', 'Your map'],
  ['/ledger', 'ledger', null],
  ['/science', 'science', null],
  ['/settings', 'settings', null],
  ['/print', 'print', null],
]) {
  await p.goto(`${BASE}/#${path}`);
  if (heading) await p.getByRole('heading', { name: heading }).waitFor({ timeout: 10000 });
  await shot(name, { settle: 1200 });
}

await browser.close();
console.log(`\n${n} screens captured in ${OUT}`);
