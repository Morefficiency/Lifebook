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

`/gap` is the standing dashboard for anyone who went through act two; `/map` is
the standing home for anyone who stopped after act one.

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
  data/          Dexie persistence, ledger payload types, pair ordering
  store/         Zustand store (one mutation path), selectors, wizard progress
  components/    NetworkMap and shared primitives
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

---

## Accessibility and quality floor

Responsive to 360 px with no horizontal overflow · visible keyboard focus
everywhere, never removed · `prefers-reduced-motion` respected globally, with the
map reveal rendering instantly · semantic HTML with a skip link and labelled
controls · the map is a labelled `img` role with a parallel keyboard-navigable
fault-line list, so selection never depends on clicking a line · every duel
answerable from the keyboard (1–5).
