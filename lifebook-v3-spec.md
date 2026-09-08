# Lifebook v3 — the core

**Audience:** whoever builds the next increment, including Claude Code. Binding
where it says *must*. Where it is silent, the v1 Design Laws (§2 of
`coherence-v1-build-spec.md`) and the prohibitions (§13) still decide.

## 0. The bar

Lifebook is meant to be the only assistant a person needs for self-development
— the real kind, not the kind in short videos. It goes to the core: identity,
self-image, and the patterns a person cannot see from inside their own head.
Everything else in the app is scaffolding for that.

That sets a test for every feature: *does this help someone see something true
about themselves that they could not see before, or change something they have
decided to change?* If it does neither, it does not ship, however engaging it is.

## 1. What v2 already does, and where it stops

v2 lets a person write the life they want, list what they are actually doing,
see where those things collide, place each area of their life against the
vision, be offered the beliefs their own answers imply, confirm which are theirs,
choose the identity that replaces each one, and run experiments that can prove a
belief wrong.

It stops in two places:

- **Beliefs come from what a person says, never from what they did.** The probes
  are self-report. The experiments test a belief that was already named. Nothing
  looks at the record of what happened and offers a pattern the person never put
  into words.
- **There is no record over time.** Where an area stands is a snapshot,
  overwritten on re-rating. A person cannot see Money over six months against
  what they actually did about it.

## 2. What v3 adds — three things, in this order

### 2.1 A results record

`Lifebook.placements` — append-only, one entry every time an area is placed:

```ts
interface Placement { area: LifeArea; score: number; ts: string }
```

Placing an area (the Current stage, and re-placing later) *must* append here as
well as overwrite `currents`. The record is what lets the standing view gain a
time axis and what lets §2.3 say anything about results at all.

### 2.2 Credence and resistance — the formal core

Every confirmed belief is a *prior*: a prediction generator about what will
happen to its holder. Every experiment joined to it is a *test* of that
prediction, and every report is the *error*. The app already records both
(`Quest.forecastP`, `FieldReport.fearedOutcomeOccurred`); v3 does the
bookkeeping the record deserves.

Per confirmed belief, in `engine/credence.ts`:

| Quantity | Definition |
|---|---|
| **posterior** | Beta(α₀ + occurred, β₀ + not occurred) over "this belief's predictions come true", prior Beta(3, 1) — confirmed means leaning true |
| **evidence rate** | posterior mean |
| **stated rate** | the person's own most recent `forecastP` on a test of it |
| **resistance** | stated rate − evidence rate, defined only with ≥ 3 reports |
| **held** | resistance ≥ 0.20 — the person still predicts what their own record has stopped predicting |
| **expected gain** | the reduction in posterior variance one more test would buy, in closed form: Var(p) / (α + β + 1) — the least-tested beliefs rank highest |

*Resistance* is the rigorous form of "what is holding me back". In active-
inference terms it is a high-precision prior: a belief that explains away
contradicting evidence rather than updating on it. It is computed from data the
person already produced, it is explainable on tap, and the app never says what
it means — it says "tested five times, happened once, you still predict 70%" and
leaves the sentence there.

**Law 5 is kept, not bent.** No number here is inferred about the person; every
number is their own record added up. The phrase the UI uses is the one the map
already uses: *what your own answers add up to*.

### 2.3 Patterns the person never named

`engine/patterns.ts` reads the record and offers — never asserts — three kinds
of thing, each phrased as a question:

- **Calibration per area.** Mean forecast against actual occurrence, per life
  area, ≥ 3 reports. "In Money you predict the feared thing at 70%. It has
  happened 0 of 3 times. Is that a belief, or a habit of prediction?"
- **Avoidance.** An area rated important (≥ 4) that has never been the subject
  of a single experiment, once the person has run three anywhere. "You have
  tested nothing in Love. Is that a choice?"
- **Held beliefs.** Every belief from §2.2 with `held` true, with its own line.

Each offer carries its evidence, the question, and a link to the one screen
where the person can act on it. Nothing is offered below its minimum n — an
offer from two data points is a guess with a straight face, and a guess is
exactly what the app promised never to make.

## 3. What v3 does not do, deliberately

- It does not name traits, causes or disorders (Law 7). A held belief is
  described, not explained.
- It does not use the words the prohibitions ban. There is no "rewiring" here.
  There is a record, a prediction, and the gap between them.
- It does not add a streak, a score of the person, or anything to check daily
  (Law 6). The record is read when the person opens the page.
- It does not push. The offers sit on the standing view under a heading; nothing
  interrupts, nothing counts down.

## 4. Verification

Every engine function has hand-worked fixtures written before the code, in the
test file's header, per the house rule. The Beta arithmetic in §2.2 has the
closed forms written out in the test so a reader can check them with a pencil.
Browser checks cover the two surfaces: the credence lines on the standing view
and the patterns band, both against a profile built by walking the app, not by
seeding state.
