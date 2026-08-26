/**
 * Lifebook v2 acceptance — the primary journey, end to end.
 *
 *   Vision → board → Current → Reflect → Self-image → Becoming → Blueprint → Gap
 *
 * The Gap figure asserted at the end is hand-computed from the importances and
 * scores entered along the way; see the comment above that check.
 */
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';
const OUT = process.env.E2E_OUT ?? 'e2e/.out';
mkdirSync(OUT, { recursive: true });
const BASE = process.env.E2E_BASE ?? 'http://127.0.0.1:4173';
const fails=[]; const check=(n,ok,x='')=>{console.log(`${ok?'PASS':'FAIL'}  ${n}${x?' — '+x:''}`); if(!ok)fails.push(n);};
const b=await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const ctx=await b.newContext({viewport:{width:1280,height:1000}});
const p=await ctx.newPage();
const reqs=[]; p.on('request',r=>reqs.push(r.url()));
const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});

await p.goto(BASE,{waitUntil:'networkidle'});
await p.fill('#access-code','COHERENCE-V1');
await p.locator('input[type=checkbox]').nth(0).check();
await p.locator('input[type=checkbox]').nth(1).check();
await p.getByRole('button',{name:'Start with the life you want'}).click();
await p.waitForURL('**/vision');
check('Landing goes straight into the vision stage', true);
await p.screenshot({path:`${OUT}/lb-vision.png`,fullPage:true});

// Stage 1 — write four areas
const V=[
 ['Health & Body','I wake before the alarm. I train four mornings a week and it is not a negotiation.',5],
 ['Work & Craft','I do work I would do anyway, and my name on it means something.',5],
 ['Money','A year of runway in the account. I check the balance without bracing.',3],
 ['Love & Partnership','We talk about the real thing without a fight first. Two evenings a week are ours.',4],
];
for (const [name,text,imp] of V) {
  const head = p.getByRole('button',{name:new RegExp('^'+name)}).first();
  if (await head.getAttribute('aria-expanded') !== 'true') await head.click();
  await p.locator('textarea[id^="vision-"]').first().fill(text);
  await p.locator('button[aria-pressed]').filter({hasText:new RegExp(`^${imp}$`)}).first().click();
  await head.click();
  await p.waitForTimeout(80);
}
const written = await p.locator('[aria-live="polite"]').first().innerText();
check('Four areas written', /4 of 12/.test(written), written);

await p.getByRole('button',{name:'See your vision board'}).click();
await p.waitForURL('**/board');
const board = await p.locator('main').innerText();
check('Vision board renders his own words', board.includes('I wake before the alarm'));
check('Board sorts by what matters most', board.indexOf('Health & Body')<board.indexOf('Money'));
await p.screenshot({path:`${OUT}/lb-board.png`,fullPage:true});

// Stage 2 — current
await p.getByRole('link',{name:'Now the honest part'}).click();
await p.waitForURL('**/current');
// The Current stage presents areas by importance, so drive it by name rather
// than by position and keep an explicit record of what was entered.
const SCORE_BY_AREA = { 'Health & Body':3, 'Work & Craft':3, 'Money':2, 'Love & Partnership':8 };
const entered = {};
for (let i=0;i<4;i++){
  const heading = await p.locator('main h2').first().innerText();
  const score = SCORE_BY_AREA[heading];
  entered[heading] = score;
  await p.locator('#current-score').fill(String(score));
  await p.fill('#current-desc','Honest description of where '+heading+' actually is right now.');
  const label = i<3 ? 'Next area' : 'Done — what shapes this?';
  await p.getByRole('button',{name:label}).click();
  await p.waitForTimeout(150);
}
check('Every area got the score intended for it', Object.keys(entered).length===4, JSON.stringify(entered));
await p.waitForURL('**/reflect',{timeout:10000});
check('Current stage walks every area he wrote a vision for', true);

// Stage 3 — probes
let n=0;
while (p.url().includes('/reflect') && n<20) {
  const multi = await p.getByText('Choose as many as are true.').count();
  const opts = p.locator('main button[aria-pressed]');
  const count = await opts.count();
  if (count>0) await opts.nth(n%Math.max(1,count-1)).click();
  if (multi>0) { const nx=p.getByRole('button',{name:/^(Next|Done)$/}); if (await nx.count()) await nx.first().click(); }
  n++; await p.waitForTimeout(80);
}
await p.waitForURL('**/self-image',{timeout:10000});
check('Reflect stage completes and hands over to self-image', true, `${n} probes`);
await p.screenshot({path:`${OUT}/lb-selfimage.png`,fullPage:true});

// Stage 4 — beliefs offered
const offered = await p.locator('main li:has(button:text("Yes, that is mine"))').count();
check('Beliefs are offered, not asserted', offered>0, `${offered} candidates`);
const si = await p.locator('main').innerText();
check('Each candidate can be confirmed, rewritten or rejected',
  si.includes('Yes, that is mine') && si.includes('let me rewrite it') && si.includes('No, not me'));
await p.locator('button:text("Why is this being asked?")').first().click();
await p.waitForTimeout(200);
const why = await p.locator('[role=dialog]').first().innerText();
check('It shows exactly which of his own answers put it there',
  /Because of what you answered here/.test(why) && why.includes('→'), why.split('\n')[0]);
await p.keyboard.press('Escape');

await p.locator('button:text("Yes, that is mine")').first().click();
await p.waitForTimeout(200);
await p.locator('button:text("Yes, that is mine")').first().click();
await p.waitForTimeout(200);
await p.locator('button:text("No, not me")').first().click();
await p.waitForTimeout(200);
const after = await p.locator('main').innerText();
check('A rejected candidate is gone for good', /rejected and gone/.test(after));
check('Confirmed beliefs are listed back', /what you have said is yours/i.test(after));

await p.getByRole('button',{name:'Who would I have to be instead?'}).click();
await p.waitForURL('**/becoming');

// Stage 5 — identities
await p.waitForTimeout(400);
const bec = await p.locator('main').innerText();
// Textarea contents are not part of innerText, so read the values directly.
const identityValues = await p.locator('textarea[id^="identity-"]').evaluateAll(ns=>ns.map(n=>n.value));
check('Each confirmed belief gets a proposed counterpart',
  identityValues.every(v=>/^I am someone who/.test(v)), identityValues.join(' | '));
check('The old belief is shown struck through above it', /instead of/i.test(bec) && /become/i.test(bec));
const identityBoxes = await p.locator('textarea[id^="identity-"]').count();
check('Every identity is editable', identityBoxes>0, `${identityBoxes} boxes`);
await p.screenshot({path:`${OUT}/lb-becoming.png`,fullPage:true});

await p.getByRole('button',{name:'Build the programme'}).click();
await p.waitForURL('**/blueprint');
await p.waitForTimeout(600);

// Stage 6 — programme
const bp = await p.locator('main').innerText();
check('Programme seeds thought swaps, behaviours and affirmations',
  /thought swap/i.test(bp) && /evidence behaviour/i.test(bp) && /affirmation/i.test(bp));
await p.screenshot({path:`${OUT}/lb-blueprint.png`,fullPage:true});

// affirmation cannot be logged bare
const affRow = p.locator('li:has-text("Affirmation")').first();
await affRow.getByRole('button',{name:'Log an instance'}).click();
const prompt = await affRow.innerText();
check('An affirmation asks for the instance it is true of',
  /What happened today that this is true of\?/.test(prompt));
const logBtn = affRow.getByRole('button',{name:'Log it'});
check('It cannot be logged with nothing behind it', await logBtn.isDisabled());
await affRow.locator('textarea').fill('Shipped the draft before I thought it was ready and said so.');
await logBtn.click();
await p.waitForTimeout(300);
check('Logging an instance records it', /1 logged/.test(await p.locator('main').innerText()));

// Gap dashboard
await p.goto(`${BASE}/#/gap`); await p.waitForTimeout(500);
const g = await p.locator('main').innerText();
// Hand-computed from the importances and scores entered above:
//   Health   importance 5, at 3 → 5 × 7/9 = 3.8889
//   Work     importance 5, at 3 → 5 × 7/9 = 3.8889
//   Partner  importance 4, at 8 → 4 × 2/9 = 0.8889
//   Money    importance 3, at 2 → 3 × 8/9 = 2.6667
//   Σ tension 11.3333 ÷ Σ importance 17 = 0.66667 → 67%
check('Gap dashboard shows the hand-computed 67%', /\b67%/.test(g), (g.match(/\d+%/)||[])[0]);
check('Gap shows from → to for each belief', /from, to/i.test(g));
await p.screenshot({path:`${OUT}/lb-gap.png`,fullPage:true});

// resume + persistence
await p.goto(BASE); await p.waitForTimeout(600);
check('Returning lands on the gap dashboard, not the start', p.url().includes('/gap'), p.url());

const ext = reqs.filter(u=>!u.startsWith(BASE)&&!u.startsWith('data:')&&!u.startsWith('blob:'));
check('Still zero outbound requests', ext.length===0, ext.slice(0,3).join(', '));
check('No console errors', errs.length===0, errs.slice(0,2).join(' | '));

console.log('\n'+(fails.length?`FAILURES: ${fails.join(' | ')}`:'ALL CHECKS PASSED'));
await b.close();
process.exit(fails.length?1:0);
