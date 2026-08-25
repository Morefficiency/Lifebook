# COHERENCE — v1 Build Specification ("The Mirror and the Move")

**Audience of this document:** Claude Code. This is the complete, binding spec for v1. Build exactly this. Where the spec is silent, choose the simplest option consistent with the Design Laws (§2) and Prohibitions (§13). Do not add features from your own knowledge of habit/wellness apps — most of their standard mechanics are explicitly banned here for evidence-based reasons.

**One-sentence product:** A local-first web app that maps a person's real goals as a network, finds where the goals fight each other, turns the hottest conflict into a small real-world experiment, and pays experience points only for evidence.

---

## 1. Scope

### 1.1 IN v1
1. **The Mirror** — values sort → strivings elicitation → pairwise conflict ratings → discomfort ("heat") ratings → interactive network map → computed insight report.
2. **The Fork** — for any conflict edge: *Challenge* (test it), *Release* (revise/retire a goal — a victory, not a failure), or *Carry* (consciously hold the tension).
3. **The Move** — quest forge (WOOP structure, mandatory obstacle step, implementation-intention steps), pre-action forecast slider, post-action field report, "Prediction Broken" event.
4. **The Ledger** — append-only, timestamped record of forecasts, outcomes, fork decisions, and belief/goal changes. Annotatable, never editable.
5. **Stats** — Calibration, Courage, Coherence + XP/levels/badges per §9.
6. **Support & honesty surfaces** — safety page, "Why this works" page with citations, data export/import/delete.
7. **Access gate** — config-switchable open/code access (§12). No payment processing in-app.

### 1.2 OUT of v1 (do not build, do not stub)
- Accounts, backend, sync, or any server-side persistence. v1 is fully client-side.
- Any LLM/AI API calls. **All logic in v1 is deterministic.** The insight report is template-based from computed values (§7.6). This is a scientific-honesty decision, not a cost decision.
- Leaderboards, social features, sharing, or any inter-user comparison.
- Financial rewards, streaks, daily goals, reminders/notifications, or time-based pressure of any kind.
- Audio/visualization/VR exposure content. Phobia, trauma, or clinical content of any kind.
- The 12-territory map, EMA pulses, season time-lapse, estimated (statistical) networks, German localization. (All are planned later phases; keep strings in a single file to ease future i18n.)

---

## 2. Design Laws (non-negotiable)

1. **The loop is the product:** Map → Detect conflict → Design experiment → Act in real life → Log evidence → Map visibly updates. Every screen must serve this loop.
2. **The game is played offline.** The app is a character sheet and lab notebook. Nothing in the app should be more rewarding than closing it and acting.
3. **XP is paid for evidence, not effort.** The largest reward event is a disconfirmed negative prediction, never task completion.
4. **The goal is allowed to lose.** Releasing a goal is a first-class victory path with its own celebration.
5. **The user is the only source of truth about the user.** No inference of beliefs from behavior, no hidden scoring, every computed number explainable on tap.
6. **Measurement integrity beats engagement.** No mechanic may create an incentive to misreport (this is why there are no leaderboards, streaks, or cash rewards).
7. **Descriptive, never diagnostic.** The app describes the user's own ratings back to them. It never names traits, disorders, or causes.

---

## 3. Tech stack & architecture

- **Vite + React 18 + TypeScript + Tailwind CSS.** Single-page app.
- **State:** Zustand store, persisted to **IndexedDB** via Dexie (localStorage fallback only for the access-gate flag). Autosave on every mutation; every flow resumable after refresh.
- **Graph rendering:** `d3-force` for layout + custom SVG rendering (preferred for styling control). Must stay smooth at 12 nodes / 66 edges.
- **No network requests at runtime** except loading the static bundle. Fonts self-hosted. This is a privacy feature and must be verifiable in devtools.
- **Deploy target:** static hosting (Cloudflare Pages). Provide `npm run build` producing a static `dist/`.
- **Routing:** simple client router (`react-router` or hash routing). Routes: `/` (landing/gate), `/onboarding/*`, `/map`, `/quests`, `/quest/:id`, `/ledger`, `/stats`, `/support`, `/science`, `/settings`.
- Code quality: strict TS, all domain logic (formulas §8, XP §9) in pure functions under `src/engine/` with unit tests (Vitest). UI contains no formula logic.

---

## 4. Data model (authoritative)

```ts
type LifeArea = 'health'|'mind'|'emotions'|'character'|'spirit'|'partner'|
  'family'|'social'|'money'|'work'|'lifestyle'|'vision'; // Lifebook-derived tags, optional

interface ValuesSelection { chosen: string[]; /* exactly 3 value ids */
  reflection: string; /* 1–2 sentences on one chosen value */ ts: string; }

interface Striving {
  id: string;                 // nanoid
  text: string;               // "I typically try to …"
  area?: LifeArea;
  createdTs: string;
  status: 'active'|'released'|'achieved';
}

interface PairRating {
  aId: string; bId: string;    // aId < bId canonical order; symmetric rating (v1 simplification, see §14)
  effect: -2|-1|0|1|2;         // -2 very harmful … +2 very helpful (mutual effect)
  heat?: 0|1|2|3|4|5|6|7|8|9|10; // only for effect < 0: felt discomfort of this conflict
  ts: string;
}

type ForkChoice = 'challenge'|'release'|'carry';

interface ForkDecision {
  id: string; edge: {aId:string,bId:string};
  choice: ForkChoice;
  note: string;                // user's stated reasoning, required, min 20 chars
  ts: string;
}

interface QuestStep { id: string; ifCue: string; thenAction: string; done: boolean; doneTs?: string; }

interface Quest {
  id: string;
  edge?: {aId:string,bId:string}; // origin fault line (optional: free quests allowed)
  wish: string; outcome: string; obstacle: string;  // WOOP; obstacle REQUIRED non-empty
  beliefHypothesis: string;    // "The belief I am testing: …" required for challenge quests
  steps: QuestStep[];          // 1–7 steps, each an implementation intention
  fearRating: 0|..|10;         // pre-commit: how afraid/averse am I to doing this
  forecastP: number;           // 0–100: probability the FEARED outcome happens (user's prediction)
  fearedOutcomeText: string;   // concrete, observable statement of the feared outcome
  status: 'active'|'reported'|'abandoned';
  createdTs: string;
}

interface FieldReport {
  id: string; questId: string;
  fearedOutcomeOccurred: boolean;   // the single scoring input
  whatHappened: string;             // required, min 30 chars
  learning: string;                 // required if fearedOutcomeOccurred === true
  ts: string;
}

interface LedgerEntry {  // append-only; UI can add annotations, never edit/delete entries
  id: string; ts: string;
  kind: 'mirror_completed'|'fork'|'quest_created'|'step_done'|'field_report'|
        'prediction_broken'|'release_victory'|'carry_marked'|'reassessment'|'annotation';
  payload: unknown;                 // typed per kind
}

interface Profile {
  xp: number; badges: string[];
  consent: { notTherapyAck: boolean; dataLocalAck: boolean; ts: string };
}
```

Full app state = `{ profile, values, strivings[], pairRatings[], forks[], quests[], reports[], ledger[] }` — exportable/importable as one JSON file (§11).

---

## 5. Flow A — Onboarding: The Mirror

Linear wizard with progress indicator; each step autosaves; resumable. Target total time ≤ 25 min.

**A0 — Landing / access gate.** One screen: product sentence, what happens in the next 25 minutes (4 plain steps), what the app will never do (3 lines: "No feed. No streaks. Your data never leaves this device."), access gate per §12, and the consent checkboxes: *"I understand this is a self-reflection tool, not therapy or medical care"* + *"I understand my data is stored only on this device."* Both required.

**A1 — Values sort (self-affirmation; runs BEFORE any threatening feedback — Steele 1988).**
Deck of 16 value cards (e.g., honesty, growth, family, craft, freedom, faith, generosity, health, curiosity, loyalty, courage, beauty, justice, independence, humor, service). User picks 3 that feel most core, then writes 1–2 sentences on a moment one of them guided a real decision. Copy: "Before you look in the mirror, remember what you stand for. This isn't graded — it's ballast."

**A2 — Strivings elicitation (Emmons & King methodology).**
Prompt: *"List the things you are typically trying to do in your life right now. Not New-Year wishes — the actual ongoing efforts."* Each entry forced into the frame **"I typically try to …"** (prefix rendered, user completes). Min 8, max 12 (cap is a UX+matrix-size decision). Optional life-area tag per striving. Provide 6 grey example chips (e.g., "…build my business to replace my salary", "…be more present with my partner", "…keep training 4×/week") that insert template text — clearly marked as examples.

**A3 — Pairwise duels.**
All unordered pairs of the N strivings (N=10 → 45 pairs; N=12 → 66). One pair per screen, large text, question: *"Overall, do these two help or hurt each other?"* Five buttons: `⚔️ Strongly conflict (−2)` `Conflict (−1)` `No effect (0)` `Help (+1)` `🤝 Strongly help (+2)`. Keyboard 1–5. Median ~4 s/pair; show "pair 17 of 45". No back-pedaling pressure; a Back button exists.

**A4 — Heat ratings.**
Only for pairs rated negative: *"When both of these are live in your life, how uncomfortable does the clash actually feel?"* 0–10 slider anchored "barely notice it" ↔ "it eats at me". (Adapted single-item version of the Elliot & Devine 1994 dissonance-discomfort index; the 3-item version is a v1.1 upgrade.)

**A5 — THE MIRROR (reveal).**
Full-screen force-directed network. Nodes = strivings (label = short auto-truncated text, tooltip = full). Node radius ∝ conflict centrality `C_i` (§8). Edges: red for negative (thickness ∝ |effect|, glow intensity ∝ heat), green for positive (thickness ∝ effect), 0-edges not drawn. Reveal is staged: nodes fade in → green web draws → red fault lines draw last, one by one, hottest last. This staging is the app's single signature moment — make it land, then leave it alone (no idle animation afterward; `prefers-reduced-motion` renders instantly).

**A6 — Insight report.** See §7.6. Ends with one button: **"Choose your first fault line."** Preselects the load-bearing edge but allows any red edge.

**A7 — The Fork** (§6) on the chosen edge → if *Challenge*, straight into the Quest Forge (§7) → then Dashboard.

---

## 6. The Fork

Shown for any selected red edge. Three doors, equal visual weight:

- **Challenge it** — "Treat the belief inside this conflict as a hypothesis and design a test." → Quest Forge with `beliefHypothesis` required. Copy nudge: "Write the belief as a falsifiable sentence about the world, not about your worth."
- **Release it** — "Maybe one of these goals isn't yours anymore — inherited, expired, or borrowed. Revising or retiring it is a win." → user selects which striving to revise/retire, writes the note, striving status → `released` (or text edited via `reassessment`), edge dissolves on the map with a calm celebratory animation, badge logic §9, ledger `release_victory`. **This screen must feel like winning.** Never phrase release as giving up.
- **Carry it** — "Some tensions are the price of a life you've chosen. Name it, and it stops draining you in the dark." → note required, edge re-renders amber (held, not hot), heat excluded from Coherence load, ledger `carry_marked`. Copy states explicitly: zero conflict is not the goal; a mature system holds chosen tension.

Every fork decision requires the ≥20-char note: the articulation is the intervention.

## 7. The Move — Quest Forge & Field Reports

**7.1 WOOP frame (Oettingen).** Four fields in fixed order: Wish (one line) → best Outcome (one line, vivid) → **Obstacle** (inner obstacle; required; the form cannot submit without it — pure positive visualization measurably backfires, the obstacle step is what makes it work) → Plan.

**7.2 Steps as implementation intentions (Gollwitzer).** 1–7 steps, each entered as two boxes rendered as one sentence: **"If/When** [cue] **, then I will** [specific action]**."** Example ghost text: "When it's 09:00 Tuesday, then I will send the first outreach message."

**7.3 Forecast (the clinical engine).** Before activation: `fearedOutcomeText` ("What exactly does the fear predict will happen? Must be observable."), `forecastP` slider 0–100 ("How likely is that, honestly?"), `fearRating` 0–10 ("How much do you dread doing this?"). Copy: "You're not committing to succeed. You're committing to find out."

**7.4 Acting.** Quest card shows steps as checkboxes. Checking a step = ledger `step_done`, +XP per §9. No timers, no deadlines, no red badges. An `abandoned` state exists without shame copy ("Shelved. The ledger keeps what you learned.").

**7.5 Field report.** One question first: **"Did the feared outcome happen?"** Yes/No → `whatHappened` (min 30 chars) → if Yes, `learning` required ("What did this cost, and what did it teach? Information is XP here."). Scoring per §8/§9. If prediction broken: full-screen **PREDICTION BROKEN** moment — the app's jackpot — showing forecast vs reality delta and the belief hypothesis with a strike-through animation, then the map updates visibly (edge cools by one heat step after each broken prediction on its quests; two consecutive broken predictions on one edge prompt a re-rating of that pair).

**7.6 Insight report (template engine, deterministic).** Computes and renders, in plain second person, citing only the user's own ratings: (1) headline counts (strivings, help links, fault lines, share-weighted conflict index `G`); (2) **load-bearing node** — the striving with max `C_i`: "Your ratings put ‹X› inside more of your conflicts than anything else. This doesn't mean ‹X› is wrong — it means every fault line runs through it, so any experiment here pays double."; (3) hottest edge with both striving texts and its heat; (4) largest facilitation cluster ("these already feed each other — your existing engine"); (5) one honesty paragraph, verbatim: *"This map is made entirely of your own answers on one day. It is a mirror, not a verdict — mirrors update. Nothing here measures your worth, your personality, or your future."* Report is regenerated (and ledger-logged as `reassessment`) whenever ratings change.

---

## 8. Formulas (implement in `src/engine/`, unit-tested)

- Edge conflict load (negative edges): `c_ij = |effect_ij| × (1 + heat_ij / 10)`
- Node conflict centrality: `C_i = Σ_j c_ij` over negative incident edges
- Node facilitation strength: `F_i = Σ_j effect_ij` over positive incident edges
- Global conflict index: `G = Σ c_ij / (Σ c_ij + Σ positive effect_ij)` shown as %
- Load-bearing node: `argmax C_i` (ties → higher summed heat)
- **Calibration** (Brier): over reported quests, `B = mean( (forecastP/100 − o)² )` where `o = 1` if feared outcome occurred else `0`. Display `Calibration = round((1 − B) × 100)`; show "needs ≥3 reports" below n=3.
- **Prediction Broken event:** `forecastP ≥ 60` AND `fearedOutcomeOccurred === false`.
- **Courage +1:** any quest with `fearRating ≥ 7` that reaches ≥1 completed step (attempt counts, outcome irrelevant — courage is behavior, not luck).
- **Coherence:** `1 − (current active conflict load / initial conflict load at Mirror completion)` as %, where released edges count 0 and carried edges count 0. Recompute on every change; initial value stored at `mirror_completed`.

## 9. XP economy, levels, badges

XP events (only these): step completed **+10** · field report filed **+15** · epistemic bonus (feared outcome occurred AND learning logged) **+25** · **PREDICTION BROKEN +50** · fork decision with note **+15** · mirror completed **+40** · pair re-rating after evidence **+5**.
Levels (instrument-themed, no personality claims): 0 Surveyor · 100 Cartographer · 250 Field Scientist · 500 Experimenter · 900 Calibrated · 1500 Cartographer of the Deep. Level-up copy explains *what the number means* ("Calibrated: your forecasts now have a track record").
Badges (informational certificates of real events only): First Light (mirror done) · First Contact (first field report) · **Prediction Broken** · Serial Falsifier (10 broken) · **The Resistance Was Right** (first release) · Held, Not Hidden (first carry) · Cold Reader (Calibration ≥ 85 with n ≥ 10) · Deep Breath (first fearRating ≥ 9 attempted).
**Banned mechanics (hard):** streaks, decay, daily quotas, notifications, time pressure, leaderboards, currency purchasable or redeemable for anything external, variable-ratio/loot randomness, social comparison. (Deci/Koestner/Ryan 1999; overjustification.)

## 10. Dashboard, Ledger, Stats, Support, Science

- **/map** (home after onboarding): the living map + "Active quests" rail + `G`, Coherence, XP chips. Tapping any number opens a plain-language "how this is computed" popover (Design Law 5).
- **/ledger:** reverse-chronological entries, filter by kind; entries immutable; "add annotation" allowed. Empty state: "The ledger fills with evidence, not intentions."
- **/stats:** Calibration (with n), Courage count, Coherence %, XP/level/badges. Each stat card has a one-line honest definition.
- **/support:** static page. Content: this app is a self-reflection tool, not therapy, diagnosis, or crisis support; if things feel heavy or this work stirs up more than expected, that is a sign to talk to a human professional, not to push harder; link **findahelpline.com** ("free, confidential support worldwide") + advice to contact local emergency services if in immediate danger; note that any exercise can be skipped at any time. Support link is present in the persistent nav on every screen.
- **/science:** "Why this works" — one short cited paragraph each: strivings & goal-conflict matrices (Emmons & King 1988, JPSP); values affirmation before threat (Steele 1988); dissonance & discomfort measurement (Festinger 1957; Elliot & Devine 1994); mental contrasting/WOOP and why pure positive visualization backfires (Oettingen 2014); implementation intentions (Gollwitzer 1999); expectancy violation as the engine of belief change (Craske et al. 2014); why no streaks/cash (Deci, Koestner & Ryan 1999); calibration scoring (Brier 1950). Plus a "What we deliberately left out and why" list (affirmations for traits, behavior surveillance, engagement mechanics). No claim appears in app marketing copy that is not on this page.

## 11. Settings & data

Export full state as pretty-printed JSON (`coherence-export-YYYY-MM-DD.json`) · Import (validates schema version, confirms overwrite) · **Delete everything** (typed confirmation "DELETE", wipes IndexedDB + gate flag) · schema `version: 1` field for migrations. State every screen's data is local-only.

## 12. Access gate (config)

`src/config.ts`: `ACCESS_MODE: 'open' | 'code'` and `ACCESS_CODES: string[]`. `code` mode: landing shows access-code field + external purchase link placeholder (`PURCHASE_URL` const, e.g. a Stripe Payment Link) with copy "Get an access code". Codes checked client-side (v1 accepts this weakness; it gates honestly, not cryptographically). Unlock flag in localStorage. Note to operator in README: the willingness-to-pay gate from the product plan stands — ship with `code` mode on for strangers.

## 13. Prohibitions (final gate — re-read before calling the build done)

Never: infer beliefs from behavior · psychoanalyze, diagnose, or name traits/conditions · trait affirmations ("I am confident") anywhere · read outcomes backwards into character (the ledger separates action quality from results; luck exists) · medical/clinical claims ("treat", "cure", "heal", "therapy", "rewire your brain") · neuro-marketing language · engagement metrics, DAU thinking, retention hooks · dark patterns · shame copy for lapses · any network request with user data. Tone: calm, exact, honest instrument; never hype, never guru.

## 14. Known v1 simplifications (document in README, do not "fix" silently)

1. Pair ratings are symmetric (Emmons's matrix is directional; halves burden; v1.1 may add directionality for the top-3 hottest edges only).
2. Single-item heat rating (full 3-item discomfort index later).
3. Client-side access codes.
4. English only; all copy centralized in `src/strings.ts`.
5. Coherence % is a descriptive index of the user's own ratings, not a validated scale — the /science page says so.

## 15. Visual direction

Instrument, not toy; observatory-at-night, not neon arcade. Palette (tokens, adjust for WCAG AA): `#0B0E14` ink-blue-black canvas · `#E8E3D8` bone text · `#C43E3E` fault-red · `#3E7C59` facilitation-green · `#C9A227` carry-amber · one restrained accent `#7BA3C4` instrument-blue for chrome. Type: a characterful serif or slab for display (self-hosted; e.g., Fraunces or Zilla Slab) + a precise grotesk/mono-adjacent body (e.g., IBM Plex Sans; Plex Mono for numbers/ledger). The map reveal (A5) is the one orchestrated motion moment; everything else is quiet micro-transitions. Quality floor: responsive to 360 px, visible keyboard focus, `prefers-reduced-motion` respected, semantic HTML, AA contrast.

## 16. Build order & acceptance

**Order:** engine + tests → data layer/persistence → onboarding A0–A4 → map A5 → report A6 → fork → forge → reports/PREDICTION BROKEN → ledger/stats → support/science/settings → gate → polish pass against §13.

**Definition of done (test script):**
1. Fresh profile completes A0→A7 in ≤25 min with 10 strivings; refresh mid-duel resumes at the same pair.
2. Map renders 12 nodes/66 edges smoothly; hottest edge visibly identifiable in <5 s by a naive viewer.
3. Forge refuses submission without Obstacle and without a falsifiable `fearedOutcomeText`.
4. Report with forecast 80 + feared-outcome-No fires PREDICTION BROKEN, +50 XP, edge cools, ledger entry created.
5. Release flow retires a striving, dissolves the edge, celebrates, and Coherence % rises.
6. Export → Delete everything → Import restores byte-identical state.
7. Devtools network tab: zero runtime requests. Unit tests green for every formula in §8 including Brier edge cases (n=0,1,3).
8. Grep the bundle strings for banned terms: "cure", "therapy", "rewire", "streak" → zero hits outside /science's "what we left out" section.
