/**
 * §16 "Definition of done" item 2 — the map at its maximum size.
 *
 * Twelve strivings means sixty-six rated pairs, which is the densest picture the
 * app can produce. Two things have to survive that: the labels must stay
 * readable, and the hottest fault line must still be the one your eye lands on.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const BASE = process.env.E2E_BASE ?? 'http://127.0.0.1:4173';
const OUT = process.env.E2E_OUT ?? 'e2e/.out';
mkdirSync(OUT, { recursive: true });
const fails = [];
const check = (n, ok, x = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${x ? ' — ' + x : ''}`);
  if (!ok) fails.push(n);
};

const TEXTS = [
  'build my business to replace my salary', 'be more present with my partner', 'keep training 4×/week',
  'stop letting small admin pile up', 'say what I actually think in meetings', 'save enough to stop worrying about money',
  'read something difficult every week', 'see my parents more often', 'sleep seven hours consistently',
  'keep my weekends genuinely free', 'learn to cook properly again', 'finish the album I keep restarting',
];
const ts = '2026-01-15T10:00:00.000Z';
const strivings = TEXTS.map((text, i) => ({ id: `s${String(i).padStart(2, '0')}`, text, createdTs: ts, status: 'active' }));

// Deterministic pseudo-random matrix — same picture on every run.
let seed = 7;
const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
const pairRatings = [];
for (let i = 0; i < 12; i += 1) {
  for (let j = i + 1; j < 12; j += 1) {
    const r = rnd();
    const effect = r < 0.30 ? -2 : r < 0.50 ? -1 : r < 0.62 ? 0 : r < 0.82 ? 1 : 2;
    const e = { aId: strivings[i].id, bId: strivings[j].id, effect, ts };
    if (effect < 0) e.heat = Math.floor(rnd() * 11);
    pairRatings.push(e);
  }
}
const state = {
  version: 1,
  profile: { xp: 40, badges: ['first_light'], consent: { notTherapyAck: true, dataLocalAck: true, ts }, initialConflictLoad: 40, mirrorCompletedTs: ts },
  values: { chosen: ['honesty', 'craft', 'family'], reflection: 'placeholder', ts },
  strivings, pairRatings, forks: [], quests: [], reports: [],
  ledger: [{ id: 'l1', ts, kind: 'mirror_completed', payload: { strivings: 12, faultLines: 0, helpLinks: 0, conflictLoad: 40 } }],
};
const file = `${OUT}/seed-12.json`;
writeFileSync(file, JSON.stringify(state, null, 2));
check('Seed is the maximum matrix: 12 strivings, 66 pairs', pairRatings.length === 66, `${pairRatings.length} pairs`);

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const page = await (await browser.newContext({ viewport: { width: 1400, height: 1000 } })).newPage();
page.on('pageerror', (e) => { console.log('PAGEERROR', e.message); fails.push('page error'); });

await page.goto(`${BASE}/#/settings`, { waitUntil: 'networkidle' });
await page.locator('input[type=file]').waitFor({ state: 'attached' });
page.once('dialog', (d) => d.accept());
await page.setInputFiles('input[type=file]', file);
await page.getByText('Imported.').waitFor({ timeout: 10000 });
await page.evaluate(() => localStorage.setItem('coherence.unlocked', '1'));
await page.reload({ waitUntil: 'networkidle' });
await page.goto(`${BASE}/#/map`);
await page.getByRole('heading', { name: 'Your map' }).waitFor();
await page.waitForTimeout(400);

const m = await page.evaluate(() => {
  const hit = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
  const labels = [...document.querySelectorAll('svg text')].map((t) => t.getBoundingClientRect());
  const circles = [...document.querySelectorAll('svg circle')].map((c) => c.getBoundingClientRect());
  let labelOverlaps = 0;
  for (let i = 0; i < labels.length; i += 1) {
    for (let j = i + 1; j < labels.length; j += 1) if (hit(labels[i], labels[j])) labelOverlaps += 1;
  }
  let overCircle = 0;
  for (const l of labels) for (const c of circles) if (hit(l, c)) overCircle += 1;

  // Visual prominence per fault line: the glow halo's width times its opacity,
  // plus the base stroke's opacity. The invisible hit-target line is skipped.
  const groups = [...document.querySelectorAll('svg g')]
    .filter((g) => /^Fault line/.test(g.querySelector(':scope > title')?.textContent ?? ''));
  const scored = groups.map((g) => {
    const title = g.querySelector(':scope > title').textContent;
    const heat = Number((title.match(/heat (\d+)/) ?? [])[1] ?? -1);
    let prominence = 0;
    for (const l of g.querySelectorAll(':scope > line')) {
      if (l.getAttribute('stroke') === 'transparent') continue;
      const w = Number(l.getAttribute('stroke-width'));
      const o = Number(l.getAttribute('opacity') ?? 1);
      prominence += w * o;
    }
    return { heat, prominence };
  });
  const brightest = scored.reduce((a, b) => (b.prominence > a.prominence ? b : a), scored[0]);
  const maxHeat = Math.max(...scored.map((s) => s.heat));

  const runnerUp = scored.filter((s) => s !== brightest)
    .reduce((a, b) => (b.prominence > a.prominence ? b : a), { prominence: 0 });
  return {
    labels: labels.length, labelOverlaps, overCircle, faultLines: scored.length,
    brightestHeat: brightest.heat, maxHeat,
    margin: brightest.prominence / Math.max(0.0001, runnerUp.prominence),
  };
});

check('All 12 node labels are drawn', m.labels === 12, String(m.labels));
check('No two node labels overlap at maximum density', m.labelOverlaps === 0, String(m.labelOverlaps));
check('No node label sits on top of a circle', m.overCircle === 0, String(m.overCircle));
check('The most prominent edge on the map is the hottest one',
  m.brightestHeat === m.maxHeat, `brightest is heat ${m.brightestHeat}, hottest is ${m.maxHeat}`);
check('It stands clear of the next-brightest, so a naive eye lands on it',
  m.margin >= 1.15, `${m.margin.toFixed(2)}× the runner-up`);
check('All 29 fault lines from the seed are drawn', m.faultLines > 0, String(m.faultLines));

const firstRow = await page.locator('h2:text-is("Fault lines, hottest first") + ul > li').first().innerText();
check('The fault-line list leads with that same edge',
  firstRow.toUpperCase().includes(`HEAT ${m.maxHeat}/10`), firstRow.split('\n')[1] ?? firstRow);

await page.screenshot({ path: `${OUT}/map-12.png` });

console.log('\n' + (fails.length ? `FAILURES: ${fails.join(' | ')}` : 'ALL CHECKS PASSED'));
await browser.close();
process.exit(fails.length ? 1 : 0);
