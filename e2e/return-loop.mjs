/**
 * The return loop.
 *
 * The app sends nothing — no reminder, no notification, no streak. So the whole
 * mechanism is what the standing view says to somebody who came back on their
 * own, months later, and the thing being tested is that it is honest about what
 * it is still holding without ever becoming a chore list.
 *
 * Two profiles are imported: one aged, one finished today. The second matters
 * as much as the first — a page that already has something waiting the moment
 * you finish is a to-do list with a self-image theme.
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

const daysAgo = (n) => new Date(Date.now() - n * 86_400_000).toISOString();

/** A profile whose age is the point. */
function seed({ aged }) {
  const ts = aged ? daysAgo(200) : daysAgo(0);
  const quest = (id, createdTs, status, beliefId) => ({
    id, beliefId, wish: `wish ${id}`, outcome: 'o', obstacle: 'ob',
    beliefHypothesis: 'There is never going to be enough, whatever the number says.',
    steps: [], fearRating: 6, forecastP: 80, fearedOutcomeText: 'they will think less of me',
    status, createdTs,
  });
  const report = (questId, ts2) => ({
    id: `r-${questId}`, questId, fearedOutcomeOccurred: false,
    whatHappened: 'nothing of the kind happened and the day carried on', learning: '', ts: ts2,
  });
  return {
    version: 1,
    profile: {
      xp: 0, badges: [],
      consent: { notTherapyAck: true, dataLocalAck: true, ts },
      initialConflictLoad: null, mirrorCompletedTs: ts,
    },
    values: null,
    strivings: [{ id: 's1', text: 'say the number', createdTs: ts, status: 'active' }],
    pairRatings: [{ aId: 's1', bId: 's2', effect: -1, heat: 4, ts }],
    forks: [], ledger: [],
    // Two broken predictions against a belief the person still holds, and one
    // test never reported on.
    quests: [
      quest('q1', aged ? daysAgo(190) : daysAgo(0), 'reported', 'b1'),
      quest('q2', aged ? daysAgo(180) : daysAgo(0), 'reported', 'b1'),
      quest('q3', aged ? daysAgo(40) : daysAgo(0), 'active', 'b1'),
    ],
    reports: aged
      ? [report('q1', daysAgo(188)), report('q2', daysAgo(178))]
      : [report('q1', daysAgo(0)), report('q2', daysAgo(0))],
    lifebook: {
      visions: [{ area: 'money', statement: 'Six months of runway.', markers: [], importance: 5, ts }],
      currents: [{ area: 'money', score: 3, description: 'not close', ts }],
      probes: [],
      beliefs: [{
        id: 'b1', text: 'There is never going to be enough, whatever the number says.',
        // Owned before the evidence in the aged profile, so the contradictions
        // count; owned today in the fresh one, where nothing has happened since.
        source: 'offered', status: 'confirmed', areas: ['money'],
        ts: aged ? daysAgo(200) : ts,
      }],
      identities: [{
        id: 'i1', text: 'I am someone who decides with numbers rather than with dread.',
        replacesBeliefId: 'b1', areas: ['money'], edited: false, ts,
      }],
      practices: [], practiceLogs: [],
      stagesCompleted: { vision: ts, current: ts, reflect: ts, self_image: ts, becoming: ts },
    },
  };
}

const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
);

async function load(name, state) {
  const file = `${OUT}/seed-${name}.json`;
  writeFileSync(file, JSON.stringify(state, null, 2));
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
  await page.goto(`${BASE}/#/settings`, { waitUntil: 'networkidle' });
  await page.locator('input[type=file]').waitFor({ state: 'attached' });
  page.once('dialog', (d) => d.accept());
  await page.setInputFiles('input[type=file]', file);
  await page.getByText('Imported.').waitFor({ timeout: 10000 });
  await page.evaluate(() => localStorage.setItem('coherence.unlocked', '1'));
  await page.reload({ waitUntil: 'networkidle' });
  await page.goto(`${BASE}/#/life`);
  await page.getByRole('heading', { name: 'Your life' }).waitFor({ timeout: 10000 });
  await page.waitForTimeout(600);
  return { ctx, page };
}

/* --- somebody who left it six months -------------------------------------- */
{
  const { ctx, page } = await load('aged', seed({ aged: true }));
  const band = page.locator('section[aria-label="What this page is still holding"]');
  check('The page says what it is still holding', await band.count() === 1);

  const text = await band.innerText();
  check('The belief its own evidence contradicted comes first',
    /has been wrong twice since you last said it was yours/i.test(text),
    text.split('\n')[0]);
  check('...and the count is scoped to since he last owned it, so it can go quiet',
    /since you last said it was yours/i.test(text));
  check('...quoting the belief in the user\'s own words',
    /there is never going to be enough/i.test(text));
  check('...and offering to look at it rather than retiring it for him',
    /look at it again/i.test(text));

  check('The unreported test is named as still out',
    /a test has been out in the world/i.test(text));
  check('...and says why reporting is the point',
    /only counts once you say what happened/i.test(text));

  check('It never counts what you owe',
    !/\b\d+ (items?|things?|tasks?) (need|to do|outstanding)/i.test(text), text.replace(/\n/g, ' · '));
  check('...and never says you failed at anything',
    !/(you have not|you failed|you missed|overdue|behind)/i.test(text));

  const lines = await band.locator('> div').count();
  check('At most two things, so it stays a nudge', lines <= 2, String(lines));

  const links = await band.locator('a').count();
  check('Every line offers somewhere to go', links === lines, `${links} links, ${lines} lines`);

  await page.screenshot({ path: `${OUT}/return-loop.png`, fullPage: true });
  await ctx.close();
}

/* --- and somebody who finished today -------------------------------------- */
{
  const { ctx, page } = await load('fresh', seed({ aged: false }));
  const band = page.locator('section[aria-label="What this page is still holding"]');
  check('Nothing is waiting the day you finish', await band.count() === 0);
  const text = await page.locator('main').innerText();
  check('...and the page is otherwise the same page', /who you are becoming/i.test(text));
  await ctx.close();
}

console.log('\n' + (fails.length ? `FAILURES: ${fails.join(' | ')}` : 'ALL CHECKS PASSED'));
await browser.close();
process.exit(fails.length ? 1 : 0);
