/**
 * §16 "Definition of done" — acceptance items 1, 2, 3, 4, 6, 7 and 8, driven
 * against a real production build in a real browser.
 *
 *   npm run build
 *   npm run preview -- --port 4173 &
 *   npm run e2e
 *
 * CHROMIUM_PATH overrides the browser binary; E2E_BASE the origin.
 */
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const BASE = process.env.E2E_BASE ?? 'http://127.0.0.1:4173';
const OUT = process.env.E2E_OUT ?? 'e2e/.out';
mkdirSync(OUT, { recursive: true });
const log = (...a) => console.log(...a);
const fails = [];
const check = (name, ok, extra='') => { log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra?' — '+extra:''}`); if(!ok) fails.push(name); };

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();

const requests = [];
page.on('request', r => requests.push(r.url()));
const consoleErrors = [];
page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
page.on('pageerror', e => consoleErrors.push('pageerror: ' + e.message));

await page.goto(BASE, { waitUntil: 'networkidle' });

// ---- A0 gate ----
await page.fill('#access-code', 'COHERENCE-V1');
await page.locator('input[type=checkbox]').nth(0).check();
await page.locator('input[type=checkbox]').nth(1).check();
await page.getByRole('button', { name: 'Begin' }).click();
await page.waitForURL('**/onboarding/values');
check('A0 gate accepts code + consent', true);

// ---- A1 values ----
for (const v of ['Honesty','Craft','Family']) await page.getByRole('button', { name: v, exact: true }).click();
await page.fill('#reflection', 'I told a client the truth about a slipped deadline instead of padding the estimate.');
await page.getByRole('button', { name: 'Continue' }).click();
await page.waitForURL('**/onboarding/strivings');
check('A1 values sort completes', true);

// ---- A2 ten strivings ----
const TEN = [
  'build my business to replace my salary',
  'be more present with my partner',
  'keep training 4×/week',
  'stop letting small admin pile up',
  'say what I actually think in meetings',
  'save enough to stop worrying about money',
  'read something difficult every week',
  'see my parents more often',
  'sleep seven hours consistently',
  'keep my weekends genuinely free',
];
for (const t of TEN) {
  await page.fill('#new-striving', t);
  await page.getByRole('button', { name: 'Add striving' }).click();
}
const listed = await page.locator('li input[id^="st-"]').count();
check('A2 accepts 10 strivings', listed === 10, `${listed} listed`);
await page.getByRole('button', { name: 'Rate the pairs' }).click();
await page.waitForURL('**/onboarding/duels');
await page.locator('[role=progressbar]').waitFor();

// ---- A3 duels: 45 pairs, with a mid-flow refresh ----
const total = 45;
const pattern = [1,2,3,4,5,3,1,4,2,5,3,2,4,1,5,4,3,5,2,1,3,4,2,5,1];
let answered = 0;
const t0 = Date.now();
for (let i = 0; i < 17; i++) { await page.keyboard.press(String(pattern[i % pattern.length])); answered++; }
const progressBefore = await page.locator('[aria-live="polite"]').first().innerText();
check('A3 shows "pair N of 45"', /Pair 18 of 45/.test(progressBefore), progressBefore);

// Give the autosave chain a beat, the way a human pausing before a refresh would.
await page.waitForTimeout(300);
const persisted = await page.evaluate(async () => {
  const req = indexedDB.open('coherence');
  const db = await new Promise(res => { req.onsuccess = () => res(req.result); });
  const tx = db.transaction('kv', 'readonly');
  const row = await new Promise(res => { const r = tx.objectStore('kv').get('state'); r.onsuccess = () => res(r.result); });
  db.close();
  return row.value.pairRatings.length;
});
check('A3 autosaves every rating', persisted === 17, `${persisted} of 17 persisted`);

await page.reload({ waitUntil: 'networkidle' });
const progressAfter = await page.locator('[aria-live="polite"]').first().innerText();
check('A3 refresh mid-duel resumes at the same pair', progressAfter === progressBefore, `${progressBefore} -> ${progressAfter}`);

while (answered < total) { await page.keyboard.press(String(pattern[answered % pattern.length])); answered++; }
await page.waitForURL('**/onboarding/heat', { timeout: 15000 });
check('A3 all 45 pairs rated', true, `${Math.round((Date.now()-t0)/1000)}s of keypresses`);

// ---- A4 heat ----
let heatCount = 0;
while (page.url().includes('/onboarding/heat')) {
  const slider = page.locator('#heat');
  await slider.fill(String([2,9,5,7,3,10,6,4,8,1][heatCount % 10]));
  await page.getByRole('button', { name: 'Continue' }).click();
  heatCount++;
  if (heatCount > 60) break;
  await page.waitForTimeout(40);
}
await page.waitForURL('**/onboarding/mirror', { timeout: 15000 });
check('A4 heat asked only for negative pairs', heatCount > 0 && heatCount < 45, `${heatCount} clashes`);

// ---- A5 mirror ----
await page.waitForTimeout(3500);
const nodes = await page.locator('svg circle').count();
const edges = await page.locator('svg line').count();
check('A5 map renders nodes and edges', nodes >= 20 && edges > 0, `${nodes} circles, ${edges} lines`);
await page.screenshot({ path: `${OUT}/shot-mirror.png`, fullPage: false });
await page.getByRole('button', { name: 'Read what this says' }).click();
await page.waitForURL('**/onboarding/report');

// ---- A6 report ----
const reportText = await page.locator('main').innerText();
check('A6 report has the verbatim honesty paragraph',
  reportText.includes('It is a mirror, not a verdict — mirrors update.'));
check('A6 report states positions carry no meaning',
  /Where a striving sits on the map means nothing/.test(reportText));
check('A6 report names the load-bearing striving',
  /inside more of your conflicts than anything else/.test(reportText));
await page.screenshot({ path: `${OUT}/shot-report.png`, fullPage: true });

await page.getByRole('button', { name: 'Choose your first fault line' }).last().click();
await page.waitForURL('**/fork**');

// ---- Fork: challenge ----
await page.getByRole('button', { name: /^Challenge it/ }).click();
await page.fill('#fork-note', 'x');
await page.getByRole('button', { name: 'Design the test' }).click();
check('Fork refuses a note under 20 chars', page.url().includes('/fork'));
await page.fill('#fork-note', 'I keep treating presence and revenue as a zero-sum trade and I have never checked it.');
await page.getByRole('button', { name: 'Design the test' }).click();
await page.waitForURL('**/forge**');
check('Fork records a challenge decision and opens the Forge', true);

// ---- Forge validation gates ----
await page.fill('#wish', 'Ask for two evenings a week that are only ours');
await page.fill('#outcome', 'We both stop bracing for the laptop to open after dinner');
await page.fill('#belief', 'If I protect two evenings, my revenue falls behind this month');
await page.fill('#cue-0', 'it is Sunday morning');
await page.fill('#act-0', 'ask for Tuesday and Thursday evenings');
await page.fill('#feared', 'This month revenue comes in below last month');
await page.locator('#forecast').fill('80');
await page.locator('#fear').fill('8');
await page.getByRole('button', { name: 'Activate quest' }).click();
check('Forge refuses submission without the Obstacle',
  page.url().includes('/forge') && (await page.locator('main').innerText()).includes('The obstacle is required'));

await page.fill('#obstacle', 'I tell myself asking makes me look uncommitted to the business');
await page.fill('#feared', 'I feel bad');
await page.getByRole('button', { name: 'Activate quest' }).click();
check('Forge refuses a non-observable feared outcome', page.url().includes('/forge'));

await page.fill('#feared', 'This month revenue comes in below last month');
await page.getByRole('button', { name: 'Activate quest' }).click();
await page.waitForURL('**/quest/**');
check('Forge accepts a complete quest', true);

// ---- Act, then file a report that breaks the prediction ----
await page.locator('input[type=checkbox]').first().check();
await page.getByRole('button', { name: 'File the field report' }).click();
await page.getByRole('button', { name: "No, it didn’t" }).click();
await page.fill('#what', 'I asked on Sunday and she said yes immediately, which I did not expect at all.');
await page.getByRole('button', { name: 'File it' }).click();
await page.waitForTimeout(600);
const brokenText = await page.locator('main').innerText();
check('Field report with forecast 80 + No fires PREDICTION BROKEN', brokenText.includes('PREDICTION BROKEN'));
check('PREDICTION BROKEN shows forecast vs reality', brokenText.includes('80%') && /did not happen/i.test(brokenText));
check('PREDICTION BROKEN pays +50 XP', brokenText.includes('+50 XP'));
await page.screenshot({ path: `${OUT}/shot-broken.png`, fullPage: true });

await page.getByRole('link', { name: 'Back to the map' }).click();
await page.waitForURL('**/map');
await page.getByRole('heading', { name: 'Your map' }).waitFor();
const mapText = await page.locator('main').innerText();
const xpMatch = mapText.match(/XP\s+(\d+)/);
check('XP totals 40 mirror + 15 fork + 10 step + 15 report + 50 broken = 130',
  xpMatch && xpMatch[1] === '130', xpMatch ? xpMatch[1] : 'not found');
await page.screenshot({ path: `${OUT}/shot-map.png`, fullPage: false });

// ---- Ledger records it ----
await page.getByRole('link', { name: 'Ledger' }).first().click();
await page.waitForURL('**/ledger');
await page.getByRole('heading', { name: 'Ledger', level: 1 }).waitFor();
const ledgerText = await page.locator('main').innerText();
check('Ledger contains a prediction_broken entry', /prediction broken/i.test(ledgerText));
await page.getByRole('button', { name: 'Everything' }).click();
await page.waitForTimeout(200);
const allLedger = await page.locator('main').innerText();
check('Ledger contains the mirror + fork + step + report entries',
  ['mirror completed','fork decision','step completed','field report'].every(k => allLedger.toLowerCase().includes(k)),
  ['mirror completed','fork decision','step completed','field report'].filter(k => !allLedger.toLowerCase().includes(k)).join(', '));

// ---- Export / delete / import round trip ----
await page.getByRole('link', { name: 'Settings' }).first().click();
await page.waitForURL('**/settings');
await page.getByRole('heading', { name: 'Settings', level: 1 }).waitFor();
const before = await page.evaluate(async () => {
  const req = indexedDB.open('coherence');
  const db = await new Promise(res => { req.onsuccess = () => res(req.result); });
  const tx = db.transaction('kv', 'readonly');
  const row = await new Promise(res => { const r = tx.objectStore('kv').get('state'); r.onsuccess = () => res(r.result); });
  db.close();
  return JSON.stringify(row.value, null, 2);
});

const dl = page.waitForEvent('download');
await page.getByRole('button', { name: 'Export JSON' }).click();
const download = await dl;
const path = `${OUT}/${download.suggestedFilename()}`;
await download.saveAs(path);
check('Export filename is coherence-export-YYYY-MM-DD.json',
  /^coherence-export-\d{4}-\d{2}-\d{2}\.json$/.test(download.suggestedFilename()), download.suggestedFilename());

await page.fill('#delete-confirm', 'DELETE');
await page.getByRole('button', { name: 'Delete everything', exact: true }).click();
await page.getByText('Nothing of yours remains', { exact: false }).waitFor({ timeout: 10000 });
check('Delete everything wipes the store', true);
const wiped = await page.evaluate(async () => {
  const r = indexedDB.open('coherence');
  const db = await new Promise(res => { r.onsuccess = () => res(r.result); });
  if (![...db.objectStoreNames].includes('kv')) { db.close(); return 'no-store'; }
  const row = await new Promise(res => { const q = db.transaction('kv','readonly').objectStore('kv').get('state'); q.onsuccess = () => res(q.result); });
  db.close();
  return row === undefined ? 'empty' : 'still-there';
});
check('IndexedDB holds nothing after delete', wiped === 'empty', wiped);

// re-enter and import
await page.reload({ waitUntil: 'networkidle' });
await page.goto(`${BASE}/#/settings`, { waitUntil: 'networkidle' });
await page.locator('input[type=file]').waitFor({ state: 'attached' });
page.once('dialog', d => d.accept());
await page.setInputFiles('input[type=file]', path);
await page.getByText('Imported.', { exact: false }).waitFor({ timeout: 10000 });
await page.waitForTimeout(400);
const after = await page.evaluate(async () => {
  const req = indexedDB.open('coherence');
  const db = await new Promise(res => { req.onsuccess = () => res(req.result); });
  const tx = db.transaction('kv', 'readonly');
  const row = await new Promise(res => { const r = tx.objectStore('kv').get('state'); r.onsuccess = () => res(r.result); });
  db.close();
  return JSON.stringify(row.value, null, 2);
});
check('Export → delete → import restores byte-identical state', before === after,
  before === after ? '' : `${before.length} vs ${after.length} chars`);

// ---- network audit ----
const external = requests.filter(u => !u.startsWith(BASE) && !u.startsWith('data:') && !u.startsWith('blob:'));
check('Zero requests to any host but the static bundle', external.length === 0, external.slice(0,5).join(', '));
check('No console errors', consoleErrors.length === 0, consoleErrors.slice(0,3).join(' | '));

// ---- responsive 360px ----
await page.setViewportSize({ width: 360, height: 780 });
await page.goto(`${BASE}/#/science`, { waitUntil: 'networkidle' });
const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
check('No horizontal overflow at 360px', overflow <= 0, `${overflow}px`);
await page.screenshot({ path: `${OUT}/shot-360.png`, fullPage: false });

log('\n' + (fails.length ? `FAILURES: ${fails.join(' | ')}` : 'ALL CHECKS PASSED'));
await browser.close();
process.exit(fails.length ? 1 : 0);
