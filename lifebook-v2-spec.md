# LIFEBOOK — v2 Build Specification ("Vision, Mirror, Becoming")

Supersedes `coherence-v1-build-spec.md` as the description of the primary journey.
The v1 code (goal-conflict map, quest forge, evidence ledger) stays in the repo
and stays reachable; it is the natural execution layer for Stage 6 and is not
deleted.

**One-sentence product:** You describe the life you want, then the life you have;
the app works out what you'd have to believe about yourself to already be living
the first one, shows you the gap between that and what you appear to believe now,
and hands you a programme for closing it.

---

## 1. The six stages

| # | Stage | Route | What it produces |
|---|-------|-------|------------------|
| 1 | **Vision** | `/vision` | The life he wants, across twelve areas. Written first, because it is the part people want to do. Optional image per area → a vision board. |
| 2 | **Current** | `/current` | Where each of those areas actually is now. |
| 3 | **Reflect** | `/reflect` | Behaviour, history and environment probes. Not "what do you believe" — he can't see that. |
| 4 | **Self-image** | `/self-image` | Candidate beliefs, *offered* from stages 1–3, that he confirms, rejects or rewrites. Nothing is asserted. |
| 5 | **Becoming** | `/becoming` | The self-image of the person who already lives the Stage 1 vision. One target identity per confirmed belief, editable. |
| 6 | **Blueprint** | `/blueprint` | The programme: thought-pattern swaps, evidence behaviours, affirmations, and a practice rhythm. |

`/gap` is the standing dashboard once stages 1–5 are done: current belief → target
belief, and which part of the vision each one is blocking.

## 2. Design decisions

**Vision before current state.** Someone who quits after Stage 1 still leaves with
a vision board. Someone who quits after Stage 2 leaves with nothing but a list of
disappointments. Order the stages so the payoff comes first.

**Skippable areas.** Three areas minimum to proceed. Not everyone has an opinion
about all twelve, and forcing filler wrecks the input quality.

**Nothing about the user is asserted.** Stage 4 offers candidates as questions —
"does this sound like you?" — with reject and rewrite as first-class answers. The
app proposes; the user decides. A rejected candidate is never raised again.

**Identity statements, not trait affirmations.** "I am confident" is an empty
claim and repeating one you don't believe measurably makes low-self-esteem
readers feel worse. Every target identity in Stage 5 is framed as *how that
person operates* — "I am someone who ships before it's perfect" — and every
affirmation in Stage 6 is spoken alongside a concrete instance from that day.
Affirmations attach to evidence; they never float free.

**AI slots in at one seam, later.** `inferBeliefs()` in `src/engine/beliefs.ts`
takes the whole profile and returns scored candidates. It is a deterministic rule
engine today. Replacing it with a model call means replacing that one function
behind the same signature — everything downstream is unchanged. The rule engine
stays as the offline fallback.

## 3. The twelve areas

Health · Mind · Emotions · Character · Spirit · Partner · Family · Social ·
Money · Work · Lifestyle · Vision. (Already the `LifeArea` union in `src/types.ts`.)

## 4. Formulas

- Area gap: `gap_a = (10 − current_a) / 9`, in 0…1
- Area tension: `tension_a = importance_a × gap_a`, importance 1–5
- Life gap: `Σ(importance_a × gap_a) / Σ(importance_a × 1)`, shown as %
- Belief candidate score: `Σ probe weights + Σ (tension_a for the belief's areas × areaWeight)`,
  normalised against the candidate's own maximum so long lists don't win by length.

## 5. Prohibitions carried forward

No diagnosis, no naming of conditions or disorders, no clinical claims, no
inference the user has not confirmed, no network request carrying user data, no
streaks or engagement mechanics, no shame copy. The app can propose a belief; it
can never tell someone what they are.
