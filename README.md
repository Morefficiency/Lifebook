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

## The six stages

| # | Stage | Route | What it produces |
|---|-------|-------|------------------|
| 1 | Vision | `/vision` → `/board` | The life you want, across twelve areas, with an optional picture each — a vision board. Written first, because it is the part people want to do. |
| 2 | Current | `/current` | Where each of those areas actually is now. |
| 3 | Reflect | `/reflect` | Behaviour, history and environment probes. Never "what do you believe" — you cannot see that from inside. |
| 4 | Self-image | `/self-image` | Candidate beliefs, *offered* from stages 1–3, that you confirm, reject or rewrite. |
| 5 | Becoming | `/becoming` | The self-image of the person for whom your vision is ordinary. |
| 6 | Blueprint | `/blueprint` | The programme: thought swaps, evidence behaviours, affirmations, a practice rhythm. |

`/gap` is the standing dashboard once those are done.

### Three rules this journey is built on

**Nothing about the user is asserted.** Stage 4 offers candidates as questions,
with reject and rewrite as first-class answers, and every candidate shows exactly
which of the user's own answers put it on the list. The app proposes; the user
decides. A rejected candidate is never raised again.

**Identity statements, not trait affirmations.** "I am confident" is an empty
claim with no way to settle it, and repeating one you do not believe measurably
makes low-self-esteem readers feel worse. Every target is framed as conduct — "I
am someone who ships before it is perfect" — and every affirmation is logged
alongside a concrete instance from that day. Affirmations attach to evidence;
they never float free.

**AI slots in at one seam.** `inferBeliefs()` in `src/engine/beliefs.ts` takes the
whole profile and returns scored candidates. It is a deterministic rule engine
today. Replacing it with a model call means replacing that one function behind
the same signature — everything downstream is unchanged, and the rule engine
stays as the offline fallback.

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
npm run test                 # 138 unit tests over src/engine (Vitest)
npm run audit:prohibitions   # greps the built bundle for banned language (§13)
npm run verify               # test + build + audit
npm run e2e                  # browser acceptance suite (needs a running preview)
```

The e2e suite drives a real production build in Chromium — 79 checks in four
parts. `lifebook.mjs` walks all six stages end to end and checks the gap figure
against a hand computation. The other three cover the v1 machinery:
`acceptance.mjs` walks its onboarding and the export/delete/import round trip,
`release-and-carry.mjs` checks the release and carry flows against hand-computed
numbers, and `map-density.mjs` checks the map at its maximum size. It needs a preview server on port 4173:

```bash
npm run build
npm run preview -- --port 4173 &
npm run e2e                        # CHROMIUM_PATH=… to point at a browser binary
```

### Deploying

`npm run build` produces a fully static `dist/`. Upload it anywhere — Cloudflare
Pages, Netlify, S3, a directory on a box. Routing is hash-based (`/#/map`), so no
SPA rewrite rule is needed and the app works from a `file://` path or a
subdirectory without configuration.

---

## Operator notes

### The access gate (§12)

`src/config.ts`:

```ts
export const ACCESS_MODE: 'open' | 'code' = 'code';
export const ACCESS_CODES: string[] = ['COHERENCE-V1'];
export const PURCHASE_URL = 'https://example.com/coherence';
```

**Ship with `code` mode on for strangers.** The willingness-to-pay gate from the
product plan stands: the app asks for a deliberate act before it asks anyone to
spend twenty-five minutes being honest with themselves, and the people who pay
for it are the people who use it.

Replace `PURCHASE_URL` with your payment link (a Stripe Payment Link is enough) and
`ACCESS_CODES` with real codes before shipping. No payment is processed in the
app, and no code leaves the browser.

Codes are checked client-side. Anyone who reads the bundle can find them. That is
accepted for v1 (§14.3) — the gate is honest, not cryptographic.

### Privacy

There are no network requests at runtime. No API, no analytics, no CDN, no
fonts fetched from a third party, no error reporting. The whole state lives in
one IndexedDB row in the visitor's browser.

To check: open devtools → Network → hard reload. You should see the HTML, one
JS chunk, one CSS file and the woff2 faces, all from your own origin, and
nothing after that no matter what you click. The e2e suite asserts this too.

Consequences worth putting in your own copy: clearing site data deletes
everything, there is no recovery, and you cannot help a user restore anything
because you never had it. The Settings page says all of this.

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
