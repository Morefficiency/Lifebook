/**
 * §16 "Definition of done" item 5, plus the reduced-motion floor from §15.
 *
 * Seeds the app — through its own import feature, not by poking IndexedDB —
 * with the exact 4-striving matrix hand-computed in
 * src/engine/__tests__/fixtures.ts, padded to eight strivings with all-zero
 * pairs so it clears the elicitation minimum without changing any of the
 * arithmetic. The Coherence values asserted below (0% → 61% → 78%) are the
 * ones worked out by hand in that file.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';
const OUT = process.env.E2E_OUT ?? 'e2e/.out';
mkdirSync(OUT, { recursive: true });
const BASE = process.env.E2E_BASE ?? 'http://127.0.0.1:4173';
const fails=[]; const check=(n,ok,x='')=>{console.log(`${ok?'PASS':'FAIL'}  ${n}${x?' — '+x:''}`); if(!ok)fails.push(n);};

// --- the hand-computed 4-striving fixture from the engine tests, as a real save file ---
const ts='2026-01-15T10:00:00.000Z';
const strivings=[
  {id:'s1',text:'build my business to replace my salary',area:'work',createdTs:ts,status:'active'},
  {id:'s2',text:'be more present with my partner',area:'partner',createdTs:ts,status:'active'},
  {id:'s3',text:'keep training 4×/week',area:'health',createdTs:ts,status:'active'},
  {id:'s4',text:'save enough to stop worrying about money',area:'money',createdTs:ts,status:'active'},
  // Four more so the state clears the 8-striving minimum. Every pair they take
  // part in is rated 0, so they are not drawn and the hand-computed load,
  // facilitation and G for s1–s4 are untouched.
  {id:'s5',text:'read something difficult every week',createdTs:ts,status:'active'},
  {id:'s6',text:'see my parents more often',createdTs:ts,status:'active'},
  {id:'s7',text:'sleep seven hours consistently',createdTs:ts,status:'active'},
  {id:'s8',text:'keep my weekends genuinely free',createdTs:ts,status:'active'},
];
const CORE={'s1|s2':{effect:-2,heat:8},'s1|s3':{effect:-1,heat:3},'s1|s4':{effect:2},
            's2|s3':{effect:0},'s2|s4':{effect:1},'s3|s4':{effect:-1,heat:0}};
const pairRatings=[];
for(let i=0;i<strivings.length;i++)for(let j=i+1;j<strivings.length;j++){
  const aId=strivings[i].id,bId=strivings[j].id;
  pairRatings.push({aId,bId,...(CORE[`${aId}|${bId}`] ?? {effect:0}),ts});
}
// hand-computed: c12=3.6 c13=1.3 c34=1.0 → initial load 5.9
const state={version:1,profile:{xp:40,badges:['first_light'],consent:{notTherapyAck:true,dataLocalAck:true,ts},
  initialConflictLoad:5.9,mirrorCompletedTs:ts},
  values:{chosen:['honesty','craft','family'],reflection:'x',ts},strivings,pairRatings,forks:[],quests:[],reports:[],
  ledger:[{id:'l1',ts,kind:'mirror_completed',payload:{strivings:8,faultLines:3,helpLinks:2,conflictLoad:5.9}}]};
const file=`${OUT}/seed-release.json`;
writeFileSync(file, JSON.stringify(state,null,2));

const b = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const ctx = await b.newContext({ viewport: { width: 1280, height: 1000 } });
const p = await ctx.newPage();
p.on('pageerror', e => console.log('PAGEERROR', e.message));
await p.goto(`${BASE}/#/settings`, { waitUntil: 'networkidle' });
await p.locator('input[type=file]').waitFor({ state: 'attached' });
p.once('dialog', d => d.accept());
await p.setInputFiles('input[type=file]', file);
await p.getByText('Imported.').waitFor({ timeout: 10000 });
await p.evaluate(() => localStorage.setItem('coherence.unlocked','1'));
await p.goto(`${BASE}/#/map`, { waitUntil: 'networkidle' });
await p.reload({ waitUntil: 'networkidle' });
await p.getByRole('heading', { name: 'Your map' }).waitFor();

const read = async () => {
  const t = await p.locator('main').innerText();
  return {
    conflict: (t.match(/CONFLICT INDEX\s+(-?\d+)/i)||[])[1],
    coherence: (t.match(/COHERENCE\s+(-?\d+)/i)||[])[1],
    faultRows: await p.locator('h2:text-is("Fault lines, hottest first") + ul > li').count(),
  };
};
const before = await read();
check('Baseline map: G = 66% (5.9 / 8.9, hand-computed)', before.conflict === '66', before.conflict);
check('Baseline Coherence = 0% (nothing released yet)', before.coherence === '0', before.coherence);
check('Baseline shows 3 fault lines', before.faultRows === 3, String(before.faultRows));

// --- release the striving on the hottest edge ---
await p.locator('h2:text-is("Fault lines, hottest first") + ul > li button').first().click();
await p.waitForURL('**/fork**');
await p.getByRole('button', { name: /^Release it/ }).click();
await p.getByText('be more present with my partner').last().click();
const releaseScreen = await p.locator('main').innerText();
check('Release copy never frames it as giving up',
  !/giv(e|ing) up|quit|fail|weak|surrender/i.test(releaseScreen) && /is a win/.test(releaseScreen));
await p.fill('#fork-note', 'This one was my father speaking, not me. I am not spending another year on it.');
await p.getByRole('button', { name: 'Release or revise' }).click();
await p.getByText('Released.').waitFor({ timeout: 10000 });
const celebration = await p.locator('main').innerText();
check('Release shows its own celebration screen', /Released\./.test(celebration));
check('Celebration frames it as a result, not a retreat',
  /cannot pull against anything/.test(celebration) && /because you decided it/.test(celebration));
await p.screenshot({ path: `${OUT}/shot-release.png`, fullPage: true });

await p.getByRole('link', { name: 'Back to the map' }).click();
await p.getByRole('heading', { name: 'Your map' }).waitFor();
const after = await read();
// hand-computed: releasing s2 drops c12=3.6 → load 2.3 ; 1 − 2.3/5.9 = 61%
check('Coherence rises to the hand-computed 61%', after.coherence === '61', after.coherence);
check('The dissolved edge is gone: 3 fault lines → 2', after.faultRows === 2, String(after.faultRows));
const nodeLabels = await p.locator('svg text').evaluateAll(ns => ns.map(n => n.textContent || ''));
check('The released striving is off the map',
  !nodeLabels.some(t => t.includes('be more present')), nodeLabels.join(' | '));

// --- badge + ledger ---
await p.goto(`${BASE}/#/stats`, { waitUntil: 'networkidle' });
await p.getByRole('heading', { name: 'Stats', level: 1 }).waitFor();
const stats = await p.locator('main').innerText();
check('The Resistance Was Right badge is earned', /The Resistance Was Right/.test(stats));

await p.goto(`${BASE}/#/ledger`, { waitUntil: 'networkidle' });
await p.getByRole('heading', { name: 'Ledger', level: 1 }).waitFor();
const led = (await p.locator('main').innerText()).toLowerCase();
check('Ledger records the release with the note verbatim',
  led.includes('release') && led.includes('my father speaking'));

// --- carry, on a second edge ---
await p.goto(`${BASE}/#/map`, { waitUntil: 'networkidle' });
await p.getByRole('heading', { name: 'Your map' }).waitFor();
const rows = p.locator('h2:text-is("Fault lines, hottest first") + ul > li button');
// the s3–s4 edge is heat 0, so it is last
await rows.last().click();
await p.waitForURL('**/fork**');
await p.getByRole('button', { name: /^Carry it/ }).click();
await p.fill('#fork-note', 'The gym costs money I would rather save. I am choosing both anyway, with eyes open.');
await p.getByRole('button', { name: 'Carry it consciously' }).click();
await p.getByText('Held, not hidden.').waitFor({ timeout: 10000 });
await p.getByRole('link', { name: 'Back to the map' }).click();
await p.getByRole('heading', { name: 'Your map' }).waitFor();
const carried = await read();
// hand-computed: carrying s3–s4 (load 1.0) leaves 1.3 → 1 − 1.3/5.9 = 78%
check('Carrying the second edge lifts Coherence to the hand-computed 78%', carried.coherence === '78', carried.coherence);
check('The carried edge is still drawn (held, not deleted)', carried.faultRows === 2, String(carried.faultRows));
const carriedTags = await p.locator('h2:text-is("Fault lines, hottest first") + ul').innerText();
check('The carried edge is labelled as carried', /carried/i.test(carriedTags));
await p.screenshot({ path: `${OUT}/shot-carry.png`, fullPage: false });

// --- reduced motion: map renders instantly, nothing animates ---
const rmCtx = await b.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
const rp = await rmCtx.newPage();
await rp.goto(`${BASE}/#/settings`, { waitUntil: 'networkidle' });
await rp.locator('input[type=file]').waitFor({ state: 'attached' });
rp.once('dialog', d => d.accept());
await rp.setInputFiles('input[type=file]', file);
await rp.getByText('Imported.').waitFor({ timeout: 10000 });
await rp.evaluate(() => localStorage.setItem('coherence.unlocked','1'));
// Reload first so the store picks up the unlock flag; only then move to the
// Mirror, otherwise the access guard bounces the hash-only navigation.
await rp.reload({ waitUntil: 'networkidle' });
await rp.goto(`${BASE}/#/onboarding/mirror`);
await rp.getByRole('heading', { name: 'The Mirror' }).waitFor();
await rp.waitForTimeout(250);
const instant = await rp.evaluate(() => {
  const svg = document.querySelector('svg[role=img]');
  if (!svg) return { drawn: false };
  const lines = [...svg.querySelectorAll('g > line')];
  const offsets = lines.map(l => Number(getComputedStyle(l).strokeDashoffset.replace('px','')) || 0);
  return { drawn: true, svgOpacity: getComputedStyle(svg).opacity, maxOffset: Math.max(0, ...offsets) };
});
check('Reduced motion: map is fully drawn within 250ms',
  instant.drawn && instant.svgOpacity === '1' && instant.maxOffset < 1, JSON.stringify(instant));
const noteShown = await rp.locator('main').innerText();
check('Reduced motion: the app says why there is no reveal', /Reduced motion is on/.test(noteShown),
  noteShown.slice(0, 160).replace(/\n/g, ' | '));
check('Reduced motion: the skip-the-reveal control is not offered',
  !/Skip the reveal/.test(noteShown));

console.log('\n' + (fails.length ? `FAILURES: ${fails.join(' | ')}` : 'ALL CHECKS PASSED'));
await b.close();
process.exit(fails.length ? 1 : 0);
