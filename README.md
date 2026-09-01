# Lifebook

A local-first web app. You describe the life you want, then the life you have;
it works out what you would have to believe about yourself to already be living
the first one, shows you the gap between that and what you appear to believe
now, and hands you a programme for closing it.

**The primary journey is the six Lifebook stages** — see `lifebook-v2-spec.md`.

The v1 machinery (`coherence-v1-build-spec.md`: a goal-conflict map, a quest
forge, a forecast-and-evidence ledger) is still in the repo and still reachable.
It is the natural execution layer for Stage 6 — testing whether a belief
survives contact with reality is exactly what it does — and it is not deleted.

## Two acts

**Act one is the product for most people.** Ten minutes, four steps, ending on a
picture of their own life they have never seen and one sentence naming the goal
every collision runs through. Someone who stops there has had a fair trade.

| # | Stage | Route | What it produces |
|---|-------|-------|------------------|
| 1 | Vision | `/vision` → `/board` | The life you want, across twelve areas, three minimum, with an optional picture each. First, because it is the part people want to do — and someone who quits here still leaves with a vision board. |
| 2 | Goals | `/goals` | Five to seven things you are *actually* trying to do, shown against what you just said you want. Where the two lists disagree is often the answer. |
| 3 | Pairs | `/pairs` → `/friction` | Every pair rated for help or harm — fifteen judgements at six goals — then how much each collision costs you. |
| 4 | Map | `/mirror` | The network, and the sentence: *everything runs through X*. Then two doors, neither of which is a funnel. |

**Act two opens for whoever looks at that map and asks why it is that shape.**

| # | Stage | Route | What it produces |
|---|-------|-------|------------------|
| 5 | Current | `/current` | Where each area of the vision actually is now. |
| 6 | Reflect | `/reflect` | Behaviour, history and environment probes. Never "what do you believe" — you cannot see that from inside. |
| 7 | Self-image | `/self-image` | Candidate beliefs, *offered* from what came before, that you confirm, reject or rewrite. |
| 8 | Becoming | `/becoming` | The self-image of the person for whom your vision is ordinary. |
| 9 | Blueprint | `/blueprint` | The programme: thought swaps, evidence behaviours, affirmations, a practice rhythm. |

Both acts return to the same place.

## The standing view

`/life` is where the app lives once anything is in it — and where returning
visitors land. It holds a whole life on one page:

| Part | What it is |
| --- | --- |
| The read | Two sentences: how much has been described, how much is being lived, where most of what is left sits, how many identities are in progress. Assembled from clauses that are true of this person, so a half-finished life gets a short true sentence rather than a padded one. |
| The dial | All twelve areas as one figure. **Angular width is how much the area matters; arc length is how close it is to what they described.** The dotted rim is the life they wrote down; the dark remainder between an arc and the rim is the distance left. |
| Who you are becoming | The other half of the same thing: each confirmed belief struck through, the identity replacing it, and the areas of the life it sits under. |
| The twelve | Every area in full, in a fixed order, whether or not it has been written — the vision statement, where it is, what matters, the beliefs sitting on it, and one thing to do next. |
| Where your goals collide | The conflict map compressed to its three figures and its one sentence, with a door to the map itself. |

Three rules govern it.

**An absence is never a zero.** An area with a vision and no honest answer about
where it is has no fill on the dial, no score in its tile, and is excluded from
the percentage entirely — not counted as nought. `livingPercent` returns `null`
rather than `0` when nothing has been placed, because an unmeasured life is not
a life with none of it lived.

**The order never changes.** The dial and the tiles both run in the fixed
`LIFE_AREAS` order rather than sorting by score, so the shape of a life is
something a person can learn and then notice changing. A ring that reshuffles
itself whenever a number moves cannot be recognised a month later.

**Every absence has a way out of it.** All twelve tiles offer an action in all
three states — write it, say where it is, revise it — so no part of the page
shows a hole without a way to fill it.

The geometry is not in the component. `src/engine/overview.ts` computes the
sectors, and `src/engine/__tests__/overview-fixtures.ts` carries the dial worked
out by hand — twelve start and end angles to nine decimal places, closing at
exactly 360° — written before the engine existed.

`/gap` was folded into this page and now redirects to it. `/map` remains the
standing home for anyone who stopped after act one and never opened act two.

### Why the short form is six goals and not twelve

Twelve goals is sixty-six pairwise judgements, which is a different product from
the one a stranger will finish. Six is fifteen, which rates in about ninety
seconds. The full matrix is still there — the v1 flow at `/onboarding/*` and
everything at `/map` runs on exactly the same state — it is simply not what
somebody meets on their first visit.

The short form completes the Mirror, so the fork, the quest forge and the
evidence ledger all work off it without any special casing.

### Three rules this journey is built on

**Nothing about the user is asserted.** Stage 4 offers candidates as questions,
with reject and rewrite as first-class answers, and every candidate shows exactly
which of the user's own answers put it on the list. The app proposes; the user
decides. A rejection takes a candidate out of the offering, and is listed
underneath with a way back — a permanent consequence for a misclick is a trap,
not a principle.

**No path dead-ends.** A belief the user writes himself asks one extra question:
which of the known patterns it resembles, if any. Saying so lets it inherit a
counterpart identity and a programme; saying none is a real answer too, and he
gets a generic scaffold rather than an empty page. Every confirmed belief ends
up with an identity, and every identity ends up with work attached to it.

**Identity statements, not trait affirmations.** "I am confident" is an empty
claim with no way to settle it, and repeating one you do not believe measurably
makes low-self-esteem readers feel worse. Every target is framed as conduct — "I
am someone who ships before it is perfect" — and every affirmation is logged
alongside a concrete instance from that day. Affirmations attach to evidence;
they never float free.

**The algorithm decides; nothing else does.** The whole inference is a
deterministic rule engine — 63 weighted options across 14 probes, scored against
a readable 14-belief catalogue. It runs offline, gives the same answer for the
same input every time, shows its working line by line on every candidate, and
cannot produce a belief that is not in the catalogue. No AI anywhere.

If a model is ever added it goes at one seam only — `inferBeliefs()` in
`src/engine/beliefs.ts` — and only to *translate into* the algorithm: matching a
free-text belief onto the nearest catalogue entries, or rephrasing a practice in
the user's own words. It would never score and never decide, and the rule engine
would stay as the offline path.

---

## Running it

```bash
npm install
npm run dev        # development server
npm run build      # static bundle in dist/
npm run preview    # serve the built bundle
```

Verification:

```bash
npm run test                 # 207 unit tests over src/engine and src/store (Vitest)
npm run audit:prohibitions   # greps the built bundle for banned language (§13)
npm run verify               # test + build + audit
npm run e2e                  # browser acceptance suite (needs a running preview)
```

The e2e suite drives a real production build in Chromium — 136 checks in six
parts, plus a separate 28-check account suite (below). `shortform.mjs` walks the
ten-minute path and counts the free-text entries in it, so the claim on the
landing page stops passing if the flow gets heavier. `lifebook.mjs` walks all six stages end to end and checks the gap figure
against a hand computation. The other three cover the v1 machinery:
`acceptance.mjs` walks its onboarding and the export/delete/import round trip,
`release-and-carry.mjs` checks the release and carry flows against hand-computed
numbers, and `map-density.mjs` checks the map at its maximum size. It needs a preview server on port 4173:

```bash
npm run build
npm run preview -- --port 4173 &
npm run e2e                        # CHROMIUM_PATH=… to point at a browser binary
```

The account suite needs a build with a project configured, and stubs Supabase's
HTTP surface rather than talking to a real one — the sync and merge *logic* is
covered by unit tests against an in-memory server, and this covers the browser
wiring those cannot reach, above all that two accounts on one browser stay
separate:

```bash
VITE_SUPABASE_URL=https://stub.supabase.co VITE_SUPABASE_ANON_KEY=stub \
  npm run build:account
npm run preview:account &
npm run e2e:accounts
```

### Deploying

`npm run build` produces a fully static `dist/`. Upload it anywhere — Cloudflare
Pages, Netlify, S3, a directory on a box. Routing is hash-based (`/#/map`), so no
SPA rewrite rule is needed and the app works from a `file://` path or a
subdirectory without configuration.

Security headers ship with the build in `public/_headers`, which Cloudflare
Pages reads directly; on a host that ignores it, reproduce those headers in that
host's own configuration. **[DEPLOY.md](DEPLOY.md)** has the Cloudflare Pages
settings, the environment variables, and the one line you have to choose for
yourself (the Content-Security-Policy, which differs depending on whether you
deployed with accounts).

---

## Accounts

Sign-in and per-user storage are optional at build time. With no Supabase
project configured the app behaves exactly as it did before accounts existed:
everything in IndexedDB, no sign-in screen, nothing synced. Configure a project
and the app requires an account and syncs to it.

```bash
cp .env.example .env      # then fill in the two values
```

Both values are public by design — the anon key ships in the bundle, and every
table it can reach is behind row-level security, so it grants nothing beyond
"act as whoever is signed in". **The service_role key must never appear in this
repository.**

### Setting up the project

1. Create a Supabase project.
2. Run `supabase/migrations/0001_init.sql` in the SQL editor (or
   `supabase db push`). It creates one table, its RLS policies, and two
   functions — a compare-and-set save, and account deletion.
3. Authentication → Providers: enable Email, and Google if you want the button
   (otherwise set `VITE_ENABLE_GOOGLE=false`).
4. Authentication → URL Configuration: add your deployed origin to the redirect
   allow-list, or Google sign-in and password reset will bounce.

### How sync works

The local copy is what the app reads and writes; sync is a background job that
never sits between a keystroke and the screen.

- **Local-first.** IndexedDB is the working copy, keyed by account id so two
  people on one laptop never see each other's Lifebook.
- **Compare-and-set.** Each save sends the revision it last saw. A write from
  another device in the meantime comes back as a conflict rather than being
  silently overwritten.
- **Conflicts merge, they do not pick a winner.** `src/engine/merge.ts` combines
  the two copies per collection: append-only logs (the ledger, field reports,
  practice instances) are unioned so nothing is lost; items carrying their own
  timestamp resolve on it; items without one fall back to whichever document is
  newer; and "when did this happen" facts take the earliest. The merge is
  order-independent, so it is safe to run on whichever device notices first.
- **Offline is normal.** Pushes queue and go up when the connection returns. The
  session persists, so a returning user is still signed in with no network.
- **Signing in merges, it never overwrites.** Work done in the browser before
  creating an account is carried into it once, then cleared locally so the next
  person to sign in on that browser does not inherit it.

### What this changed about privacy

The app used to promise that data never left the device, on the landing page,
the consent checkbox, the footer and the Settings page. That is no longer true
when an account is configured, and all of that copy has been rewritten rather
than left standing. What the app now says, and what is actually the case:

- Answers are saved to the account so they follow the user between devices.
- Encrypted in transit and at rest; no other account can read the row.
- **Not** encrypted from the operator — you can read what people write.
- Nothing is sold, shared, advertised against, or used to train anything.

Read `src/strings.ts` → `account.consentStored` before deploying. You are the
custodian of people's childhood, their relationships and their beliefs about
themselves, and the sign-up screen says so in as many words.

## Operator notes

### The access gate

Since accounts arrived this is no longer the front door — it is an optional gate
on *sign-up*, so that only people with a code can create an account. Signing in
to an existing account never asks for one: someone who paid and then cleared
their browser must not be locked out by a code they no longer have.

```ts
export const ACCESS_MODE: AccessMode = 'open';   // 'code' to gate sign-up
export const ACCESS_CODES: string[] = ['COHERENCE-V1'];
export const PURCHASE_URL = 'https://example.com/coherence';
```

**Set `code` before opening sign-up to strangers** if the willingness-to-pay
gate from the product plan still stands.

Replace `PURCHASE_URL` with your payment link (a Stripe Payment Link is enough) and
`ACCESS_CODES` with real codes before shipping. No payment is processed in the
app, and no code leaves the browser.

Codes are checked client-side. Anyone who reads the bundle can find them. That is
accepted for v1 (§14.3) — the gate is honest, not cryptographic.

### Network traffic

With no account configured there are still zero runtime requests — no API, no
analytics, no CDN, no third-party fonts, no error reporting — and the e2e suite
asserts it.

With an account configured the only outbound traffic is to your own Supabase
project: the session check on load, a pull on sign-in, and a debounced push
after changes. Nothing else. There is no analytics or error-reporting service in
the bundle, and adding one would need a deliberate decision about content that
includes people's childhood and their beliefs about themselves.

---

## Architecture

```
src/
  engine/        pure functions — every formula in §8 and the XP economy in §9
    graph.ts       c_ij, C_i, F_i, G, load-bearing node and edge, edge cooling
    scoring.ts     Brier/Calibration, Courage, Coherence, PREDICTION BROKEN
    xp.ts          XP lines, levels, badges
    report.ts      the deterministic insight-report template
    __tests__/     fixtures with the arithmetic hand-computed in comments
    overview.ts    the standing view: area states, dial geometry, living percent
  design/        the palette decisions that are not Tailwind tokens
    ramp.ts        the one sequential ramp, and why it is not red-to-green
  data/          Dexie persistence, ledger payload types, pair ordering
  store/         Zustand store (one mutation path), selectors, wizard progress
  components/    NetworkMap, the standing view's parts, shared primitives
    life/          LifeDial, AreaTile, SelfPanel, CollisionStrip
  routes/        one file per screen
  strings.ts     every user-facing string
  types.ts       the §4 data model
```

Three rules hold throughout:

**No formula lives in a component.** `src/engine/` is pure, dependency-free and
unit-tested; the UI only renders what it is handed.

**XP is derived, never accumulated.** `computeXp(state)` recomputes the total from
the evidence on every commit. There is no counter to drift, and every point can
be itemised on tap — which is what Design Law 5 requires.

**The ledger is append-only.** Nothing edits or deletes an entry. An annotation is
itself an entry pointing at the one it annotates.

### Reading the dial

Two things carry information, and nothing else does:

| channel | meaning |
| --- | --- |
| angular width | importance, 1–5 — how much the person said that area matters |
| arc length | current, 1–10 — how close it is to what they described |

Colour repeats the arc-length reading in luminance and adds nothing of its own.
It deliberately does not run red-to-green: red and green are spoken for on the
conflict map, where they mean *these two goals fight* and *these two goals
help*, and a second unrelated red would teach the wrong thing. An area far from
its vision is not failing, it is further away, so the far end of the ramp is dim
rather than alarming. The only warm mark on the dial is the single rim segment
over the costliest area.

The figure prints. `@media print` re-inks it to a light-grey track, a mid-grey
arc and an outline for the unwritten — the reading survives because what carries
it is arc length, not colour.

### Reading the map

Four things carry information:

| channel | meaning |
| --- | --- |
| edge colour | red conflict · green facilitation · amber consciously carried |
| edge thickness | `\|effect\|` — how strong you rated the link |
| edge glow | heat — how much the clash bothers you (conflict edges only) |
| node size | `C_i`, the conflict load running through that striving |

**Node position carries no information.** Coordinates come from a force
simulation whose only input is the node and edge count; two strivings sitting
near each other means nothing, and a second run would put them elsewhere. The
insight report says so in as many words, and nothing in the code or copy implies
otherwise. The simulation runs to convergence once, synchronously, and is then
drawn as static SVG — there is no animation loop, which is both the design intent
(one orchestrated moment, then quiet) and why 12 nodes / 66 edges stays smooth.

---

## Decisions the spec left open

Where the spec was silent, the simplest option consistent with §2 and §13:

- **Hash routing.** Works on any static host with no rewrite rules. Route names
  are exactly the ones in §3, behind a `#`.
- **One IndexedDB row.** The whole state document is read and written whole, so
  import, export and delete are atomic. Autosave writes are serialised through a
  single chain: firing one write per mutation let a stale document land after a
  fresh one and silently lose answers when ratings arrived faster than IndexedDB
  completed.
- **Wizard position is derived, not stored.** "Where you are" is the first
  unanswered question, computed from persisted state. A refresh mid-duel
  therefore cannot land anywhere but the pair you were on.
- **The eight-striving minimum applies only before the Mirror is complete.**
  Releasing a goal routinely takes the count below eight, and being pushed back
  into onboarding for having won would contradict Design Law 4.
- **G includes carried edges; Coherence excludes them.** A carried tension is
  still a real conflict on the map, so it stays in the conflict index. §6 says its
  heat leaves the Coherence load, so it does. Both popovers show the arithmetic.
- **Coherence is not clamped at 0.** If re-rating adds more conflict than the map
  started with, it reads negative. Hiding that would make the number less useful.
- **Calibration below n = 3** is shown, dimmed, with "needs at least 3 reports"
  underneath — rather than hidden, which would read as a score of zero.
- **The load-bearing *edge*** (max `c_ij`) is what the report pre-selects, distinct
  from the load-bearing *node* (max `C_i`) that §8 defines. Fault-line lists label
  both strength and heat so the weight ordering is legible.
- **A feared outcome must look observable.** The Forge refuses an entry that is
  too short or that starts as a feeling ("I'll feel awful"). It judges form, never
  content.
- **Re-rating after two broken predictions is offered, never applied.** The app
  does not infer a new rating from outcomes — that would be inferring a belief
  from behaviour (§13).

---

## Known v1 simplifications (§14) — documented, not to be "fixed" silently

1. **Pair ratings are symmetric.** Emmons's matrix is directional; one number per
   pair halves the judgements. v1.1 may add directionality for the three hottest
   edges only.
2. **Heat is a single item**, adapted from the Elliot & Devine (1994) discomfort
   index. The full three-item version is a later upgrade.
3. **Access codes are checked client-side** and are readable in the bundle.
4. **English only.** Every user-facing string is in `src/strings.ts` — including
   the /science page's content, the badge and level copy, the ledger labels, the
   insight-report templates and the screen-reader-only labels — so a locale is a
   copy of exactly one file. `src/engine/` and `src/data/` import their words
   from it rather than holding any of their own.
5. **Coherence % is descriptive, not a validated scale.** It is an index of one
   person's own ratings on two occasions, with no norms and no comparability.
   The /science page says exactly this.

---

## What is deliberately absent

Not oversights. Each is banned by §1.2, §9 or §13 for a stated reason, and the
/science page carries the reasoning in the product itself:

no accounts · no server · no sync · no LLM or AI call anywhere · no leaderboards
· no sharing or social comparison · no streaks · no daily goals · no quotas · no
decay · no notifications or reminders · no time pressure · no variable-ratio
rewards · no currency redeemable for anything · no trait affirmations · no
behaviour inference · no diagnosis, trait naming, or clinical claims · no shame
copy for lapses · no engagement metrics.

`npm run audit:prohibitions` fails the build if "cure", "therapy", "rewire",
"streak", "diagnose", "heal" or neuro-marketing language appears anywhere in the
bundle outside a short allow-list: the consent line and support page that must be
able to say "not therapy", the /science list naming the mechanics left out, and
one journal-article title. That last one is a genuine tension in the spec — §16.8
wants zero hits outside the "what we left out" section, while §10 requires the
Craske et al. (2014) citation by name and that paper's title contains the word.
Misciting a source to satisfy a string check would be the worse trade, so the
exact title is allow-listed and flagged here.

---

## Test strategy

`src/engine/__tests__/fixtures.ts` was written **before** `src/engine/` existed. It
carries a worked example computed by hand — four strivings, all six pairs rated,
three fault lines two of which carry heat, and three quest/report scenarios (a
broken prediction, a feared outcome that occurred with a learning logged, and a
below-threshold forecast that pays nothing despite a good outcome). Every
expected value in the tests is derived in a comment first; the engine was then
written to satisfy those numbers.

The same numbers are asserted end-to-end: `e2e/release-and-carry.mjs` loads that
matrix into the running app through its own import feature and checks that the
UI reports the hand-computed 66% conflict index and the 0% → 61% → 78% Coherence
sequence as goals are released and carried.

### The constellation

`/constellation` is the standing view's data given a third axis, and the third
axis is allowed to mean exactly one thing: how near an area is to the person.
Three tiers from the inside out — **the person** (Body, Mind, Feeling,
Character, Spirit), **the people** (Love, Family, Friends), **the world**
(Money, Work, Days, Purpose) — which is the order the areas already run in,
made spatial. It is the intuitive reading, the scientific one (Bronfenbrenner's
nested systems, microsystem outward), and the older one: body, mind and spirit
at the core, then the people, then the world. The self sits at the centre with
the identities in progress orbiting it.

Everything that carries meaning is listed in `src/engine/constellation.ts` and
nowhere else: size is importance, glow is how close the area is to what was
described, a wireframe is an area never written (a place kept, not a value of
zero), a spoke from the self thickens with importance and brightens where a
confirmed belief sits, and a violet arc joins two areas that share one — coupled
through the self-image, so changing the belief moves both. Angle within a tier
is fixed by area order and carries nothing, and the legend on screen says so.

The renderer is raw three.js in one component. Every radius, opacity and curve
comes from numbers the engine computed and the tests hand-checked; the scene
does no arithmetic about the person of its own. Idle orbit, the pulse on the
one amber ring and the satellites' drift all stop under
`prefers-reduced-motion`; the person's own dragging and zooming always work. A
rail lists the self and all twelve areas, grouped by tier, so nothing on the
screen is reachable only by pointing at it — and `e2e/constellation.mjs` checks
that what the panel says matches what the standing view says for the same
area. three.js is split into its own chunk and paid for only by this screen.

### The return loop, without a single reminder

§13 bans reminders, notifications and streaks, and the reasons are good. That
leaves exactly one honest way to give somebody a reason to come back: when they
do come back, of their own accord, the page has to be straight about what it is
still holding and how old its own figures are.

That is provenance, not nagging, and the line is easy to cross, so
`src/engine/waiting.ts` states it:

> A streak rewards consecutive days and punishes a break. Never.
> A reminder arrives uninvited and asks for attention. Never.
> "You placed this in March" is the mirror saying when it was made.

Four things can be waiting, ranked by what earns being said rather than by age:

| | Threshold | Why it is worth a line |
| --- | --- | --- |
| A belief its own evidence contradicted | 2 broken predictions | The only one that is news about the person rather than housekeeping about the data |
| A test still out | 7 days | Reporting is the mechanism; an unreported quest is the loop left open |
| A stale placement | 120 days | The dial is drawing an old answer as if it were current |
| A stale map | 180 days | It always said it was a picture of one day; this says which day |

Three rules hold it in place, and each is a test. **Nothing surfaces on day
one** — a page with something waiting the moment you finish is a to-do list with
a self-image theme. **Nothing is ever a count of what you owe** — each line is
one specific thing with somewhere to go, never "3 items need attention". And at
most two lines show, because five is the list this deliberately is not.

The contradicted-belief line counts only evidence from **since the person last
said the belief was his**. Without that clause it is permanent: somebody who
reads it, thinks about it and decides he still holds the belief would be told
the same thing forever, which is a nag arriving by the back door. Re-ruling on a
belief moves its timestamp, the count starts again, and the band goes quiet
until his own week says something new.

### The two execution layers, joined

Stage 6 hands somebody a programme and counts what they logged. Logging is a
report of having done something — worth having, and not evidence about the
belief. A person can do the behaviour a hundred times while the belief sits
underneath entirely untouched, because nothing about it was ever put at risk.

A quest is the version that risks it. It makes the belief say in advance what
will happen, in a form that can turn out to be wrong: a concrete feared outcome
and a number for how likely it is. When the forecast was confident (≥60) and the
feared thing did not happen, that is **Prediction Broken** — the belief
contradicted by the person's own week, which is the only kind of contradiction
that moves anything (Craske et al. on expectancy violation: the disconfirmation
has to be surprising to count).

Those two halves used to be built, tested, and unaware of each other. Now:

| Where | What happens |
| --- | --- |
| `/blueprint` | An evidence behaviour offers **Test it** beside *Log an instance* |
| `/forge?belief=…&practice=…` | Arrives carrying the behaviour and the belief; the person supplies the prediction |
| `/quest/:id` | The report. A confident forecast that did not happen is named as broken |
| `/life` | The self half reports what each belief has survived — *wrong once, when it was sure* |

`Quest.beliefId` is the join. `src/engine/evidence.ts` reads it back and answers,
per belief: how many times has this been put at risk, and how often was it
wrong? Only the first report against a quest counts — a second is a correction
to the record, not a second test, and counting it would let somebody accumulate
evidence by re-filing.

`e2e/evidence-loop.mjs` walks the whole path in a browser, because this is the
one route in the app where a belief is actually contradicted rather than merely
worked on.

### The catalogue tests the content, not just the formula

`src/engine/__tests__/catalogue.test.ts` runs against the real beliefs and
probes, because the failure mode of a growing catalogue is not a crash — it is
a catalogue that still runs and quietly stops meaning anything. It asserts that
every belief is reachable from at least two probes (one question agreeing with
itself is not corroboration), that every probe has an answer carrying no weight,
that no option points at a belief that does not exist, that every target
identity is stated as conduct rather than as a trait, and — over four hundred
seeded synthetic answer sets — that the corroboration rule still leaves the
median person several offers and that **no single belief leads for more than a
quarter of them**. That last one is the horoscope guard: before it existed,
`not_enough` spanned 52% of the bank and came top for 42% of simulated people.

### Why the stage asks sixteen questions and not thirty-three

The bank is sized to cover a catalogue; a person is not obliged to exhaust it.
`src/engine/probeSelection.ts` orders the bank by greedy maximum coverage
against the gate the scorer actually applies — the next probe worth asking is
the one that moves the most beliefs closer to being answerable at all — and the
stage asks the first sixteen, then offers the rest as a choice rather than as a
remaining step.

It earns the ordering: after those sixteen questions **31 of the 34 beliefs are
still answerable, against 15 for the same number of probes taken in the order
they happen to be written**. This is the honest, boring version of adaptive item
selection. It adapts to the shape of the bank, deterministically, not to the
answers as they arrive — that is a real improvement and a much larger one, and
it needs a measurement model rather than a heuristic.

`src/engine/__tests__/overview-fixtures.ts` does the same job for the standing
view, and was likewise written first: five areas written, four of them placed,
seven untouched, with every sector angle worked out on paper. The suite checks
that the ring closes at exactly 360°, that no two sectors overlap, that a
five-importance area is exactly 5/3 the width of a three, and that an unrated
area gets `null` rather than a fill of zero.

`e2e/standing-view.mjs` walks the page in the three states people arrive in —
nothing written, described but unplaced, and complete — plus a phone. Its
sharpest check reads the numbers off the dial's labels and off the tiles below
and fails if they disagree, because a picture that quietly contradicts the text
beside it is the one bug this screen cannot afford.

---

## Accessibility and quality floor

Responsive to 360 px with no horizontal overflow · visible keyboard focus
everywhere, never removed · `prefers-reduced-motion` respected globally, with the
map reveal rendering instantly · semantic HTML with a skip link and labelled
controls · the map is a labelled `img` role with a parallel keyboard-navigable
fault-line list, so selection never depends on clicking a line · every duel
answerable from the keyboard (1–5) · the life dial is a labelled `img` role
carrying a one-sentence summary, and every value it draws is also written out in
the twelve tiles below it, which are ordinary focusable content — so nothing on
that page is available only by pointing at it.
