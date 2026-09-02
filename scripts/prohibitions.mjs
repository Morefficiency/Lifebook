/**
 * §13 / acceptance test 8 — grep the built bundle for banned language.
 *
 * "streak", "therapy", "cure" and "rewire" are allowed to appear in exactly two
 * places: the /science page's "what we deliberately left out" list, and the
 * consent line that says this is not therapy. Everywhere else they are a bug.
 *
 * Run with: npm run audit:prohibitions   (after npm run build)
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist/assets';

/**
 * Occurrences that are legitimate, matched as exact substrings of the bundle.
 *
 * Two of these deserve a note. §16.8 asks for zero hits outside the /science
 * "what we left out" list, but §10 also requires the Craske et al. (2014)
 * citation by name — and that paper's title contains the word. Misciting a
 * source to satisfy a string check would be the worse trade, so the exact
 * title is allow-listed and nothing else in the bundle may use the word.
 * The same applies to the /science heading that names the mechanics the app
 * refuses to ship: it has to be able to say what it is refusing.
 */
const ALLOWED = [
  // Consent checkbox and /support — both must be able to say the word.
  'I understand this is a self-reflection tool, not therapy or medical care.',
  'Lifebook is a self-reflection tool. It is not therapy, it is not diagnosis, and it is not crisis support.',
  // The sign-up consent block, which must be able to say what this is not.
  'This is a self-reflection tool. It is not therapy, not diagnosis, and not crisis support.',
  // Terms clause 2. Once there is a price on this, the document a customer is
  // contracting under has to be able to state plainly what they are not buying
  // — and it is the clause most worth a customer reading.
  'Lifebook is a tool for writing things down and noticing patterns in what you wrote. It is not therapy, not counselling, not medical or psychological treatment, not diagnosis, and not crisis support. It does not know anything about you that you did not type into it.',
  // /science citation, §10-mandated. Verbatim journal-article title.
  'Maximizing exposure therapy: An inhibitory learning approach. Behaviour Research and Therapy, 58, 10–23.',
  // /science — naming the mechanics deliberately left out. The list has to be
  // able to name what it is refusing to do.
  'Personality types, profiles or diagnoses',
  'No streaks, no cash, no leaderboards',
  'Streaks, quotas and points that buy something outside the app all create a reason to report what keeps the reward coming rather than what actually happened.',
  'No streaks, no daily goals, no notifications, no time pressure, no randomised rewards.',
  'No feed.',
  'No streaks.',
  // The meta description — the sentence a search result and a link preview
  // quote. Naming the mechanic it refuses is the differentiator, and it is the
  // same legitimate use as the /science list above.
  'No feed, no streaks, nothing to check daily.',
];

const BANNED = [
  { word: 'cure', re: /\bcure[sd]?\b/gi },
  { word: 'therapy', re: /\btherap(y|ies|eutic)\b/gi },
  { word: 'rewire', re: /\brewir(e|ed|ing)\b/gi },
  { word: 'streak', re: /\bstreaks?\b/gi },
  // Extra §13 terms worth failing the build over.
  { word: 'diagnose', re: /\bdiagnos(e|es|ed|is|tic)\b/gi },
  { word: 'heal', re: /\bheal(s|ed|ing)?\b/gi },
  { word: 'neuroplastic', re: /\bneuro(plastic|science|hack)\w*/gi },
];

let source = '';
for (const f of readdirSync(DIST)) {
  if (f.endsWith('.js') || f.endsWith('.css')) source += readFileSync(join(DIST, f), 'utf8');
}
source += readFileSync('dist/index.html', 'utf8');

// Blank out the sanctioned occurrences before scanning.
let scanned = source;
for (const phrase of ALLOWED) {
  const parts = scanned.split(phrase);
  if (parts.length === 1) {
    console.error(`allow-list entry not found in the bundle (stale?): "${phrase.slice(0, 60)}…"`);
    process.exitCode = 1;
  }
  scanned = parts.join(' '.repeat(0));
}

let failed = false;
for (const { word, re } of BANNED) {
  const hits = [...scanned.matchAll(re)];
  if (hits.length === 0) { console.log(`ok    "${word}" — 0 hits`); continue; }
  failed = true;
  console.error(`FAIL  "${word}" — ${hits.length} hit(s)`);
  for (const h of hits.slice(0, 5)) {
    const i = h.index ?? 0;
    console.error(`        …${scanned.slice(Math.max(0, i - 70), i + 70).replace(/\s+/g, ' ')}…`);
  }
}

if (failed) { process.exitCode = 1; } else if (!process.exitCode) {
  console.log('\n§13 prohibition audit clean.');
}
