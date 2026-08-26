/**
 * Stage 3 — behaviour, history and environment probes.
 *
 * Nobody can answer "what do you believe about yourself" usefully; the whole
 * point of a self-image is that it is invisible from inside. So none of these
 * ask that. They ask what he *does*, what he was *rewarded for*, and what the
 * people around him expect — and each answer carries weight toward candidate
 * beliefs that are scored in src/engine/beliefs.ts.
 *
 * Every probe is skippable. A skipped probe contributes nothing rather than
 * being treated as a "no".
 */

export type ProbeKind = 'behaviour' | 'history' | 'environment';

export interface ProbeOption {
  id: string;
  label: string;
  /** candidateId → weight. Weights are small integers; see beliefs.ts for scale. */
  weights: Record<string, number>;
}

export interface Probe {
  id: string;
  kind: ProbeKind;
  question: string;
  help?: string;
  multi: boolean;
  options: ProbeOption[];
}

export const PROBES: Probe[] = [
  {
    id: 'big_thing',
    kind: 'behaviour',
    question: 'Something matters a lot to you and you have to actually do it. What usually happens?',
    multi: false,
    options: [
      { id: 'over_prepare', label: 'I research and prepare far past the point of usefulness', weights: { must_be_perfect: 3, im_an_impostor: 2, cant_be_trusted: 1 } },
      { id: 'start_fast_drop', label: 'I start hard, then it quietly falls off', weights: { cant_be_trusted: 3, im_behind: 1 } },
      { id: 'do_it_quietly', label: 'I do it, but I do not tell anyone until it works', weights: { im_an_impostor: 3, not_enough: 2 } },
      { id: 'wait_for_ready', label: 'I wait until conditions are right, and they rarely are', weights: { must_be_perfect: 2, too_late: 2, cant_be_trusted: 1 } },
      { id: 'just_do_it', label: 'I get on with it', weights: {} },
    ],
  },
  {
    id: 'rest',
    kind: 'behaviour',
    question: 'You have an unexpected free afternoon and nothing is on fire.',
    multi: false,
    options: [
      { id: 'find_work', label: 'I find something productive to do — I feel odd otherwise', weights: { rest_is_lazy: 3, not_enough: 2 } },
      { id: 'guilty_rest', label: 'I rest, but with a background hum of guilt', weights: { rest_is_lazy: 2, not_enough: 1 } },
      { id: 'catch_up', label: 'I use it to catch up on what I am behind on', weights: { im_behind: 3, rest_is_lazy: 1 } },
      { id: 'take_it', label: 'I take the afternoon', weights: {} },
    ],
  },
  {
    id: 'disagreement',
    kind: 'behaviour',
    question: 'Someone whose opinion you value says something you think is wrong.',
    multi: false,
    options: [
      { id: 'stay_quiet', label: 'I let it go and think about it afterwards', weights: { conflict_is_dangerous: 3, not_enough: 1 } },
      { id: 'soften', label: 'I say something, heavily softened', weights: { conflict_is_dangerous: 2, needs_are_a_burden: 1 } },
      { id: 'defer', label: 'I assume they are probably right and I am missing something', weights: { im_an_impostor: 3, not_enough: 2 } },
      { id: 'say_it', label: 'I say what I think, plainly', weights: {} },
    ],
  },
  {
    id: 'asking',
    kind: 'behaviour',
    question: 'You need something from someone — time, help, money, an evening.',
    multi: false,
    options: [
      { id: 'dont_ask', label: 'I usually work around it rather than ask', weights: { needs_are_a_burden: 3, im_the_reliable_one: 2 } },
      { id: 'trade', label: 'I ask, but I make sure I have given more than I am taking', weights: { love_is_earned: 3, needs_are_a_burden: 2 } },
      { id: 'apologise', label: 'I ask, wrapped in apology', weights: { needs_are_a_burden: 2, not_enough: 1 } },
      { id: 'just_ask', label: 'I ask directly', weights: {} },
    ],
  },
  {
    id: 'praise',
    kind: 'behaviour',
    question: 'Someone praises your work in front of others.',
    multi: false,
    options: [
      { id: 'deflect', label: 'I deflect, or credit the circumstances', weights: { im_an_impostor: 3, not_enough: 2 } },
      { id: 'brace', label: 'I enjoy it and immediately worry about the next one', weights: { must_be_perfect: 2, im_an_impostor: 2 } },
      { id: 'not_yet', label: 'I think about what they have not seen yet', weights: { im_an_impostor: 3, must_be_perfect: 1 } },
      { id: 'take_it', label: 'I take the compliment', weights: {} },
    ],
  },
  {
    id: 'money_check',
    kind: 'behaviour',
    question: 'You open your banking app.',
    multi: false,
    options: [
      { id: 'brace', label: 'There is a small brace before the number loads', weights: { money_is_scarce: 3 } },
      { id: 'avoid', label: 'I put it off, sometimes for weeks', weights: { money_is_scarce: 3, cant_be_trusted: 1 } },
      { id: 'never_enough', label: 'The number is usually fine and it still does not feel like enough', weights: { money_is_scarce: 3, not_enough: 2 } },
      { id: 'neutral', label: 'It is just information', weights: {} },
    ],
  },
  {
    id: 'load',
    kind: 'behaviour',
    question: 'How much of what holds together around you depends on you specifically?',
    multi: false,
    options: [
      { id: 'all_of_it', label: 'Most of it. If I stopped, things would fall over', weights: { im_the_reliable_one: 3, needs_are_a_burden: 1 } },
      { id: 'cant_delegate', label: 'I could hand things over but it is faster to do it myself', weights: { im_the_reliable_one: 2, cant_be_trusted: 1 } },
      { id: 'shared', label: 'It is genuinely shared', weights: {} },
    ],
  },
  {
    id: 'body_trade',
    kind: 'behaviour',
    question: 'When a week gets heavy, what goes first?',
    multi: true,
    options: [
      { id: 'sleep', label: 'Sleep', weights: { body_is_last: 3, rest_is_lazy: 1 } },
      { id: 'training', label: 'Training or exercise', weights: { body_is_last: 3 } },
      { id: 'food', label: 'Eating properly', weights: { body_is_last: 2 } },
      { id: 'friends', label: 'Seeing people', weights: { im_the_reliable_one: 1 } },
      { id: 'partner_time', label: 'Time with my partner', weights: { love_is_earned: 2 } },
      { id: 'nothing', label: 'Nothing gives — I protect all of it', weights: {} },
    ],
  },
  {
    id: 'growing_up',
    kind: 'history',
    question: 'Growing up, what reliably got you approval?',
    help: 'Not what you were told mattered — what actually landed.',
    multi: true,
    options: [
      { id: 'achieving', label: 'Achieving. Results, marks, winning', weights: { love_is_earned: 3, not_enough: 2, must_be_perfect: 2 } },
      { id: 'no_trouble', label: 'Being no trouble', weights: { needs_are_a_burden: 3, conflict_is_dangerous: 2 } },
      { id: 'helping', label: 'Looking after everyone else', weights: { im_the_reliable_one: 3, needs_are_a_burden: 2 } },
      { id: 'being_good', label: 'Being good — behaving, not embarrassing anyone', weights: { must_be_perfect: 2, conflict_is_dangerous: 2 } },
      { id: 'nothing_reliable', label: 'Nothing reliably did', weights: { not_enough: 3, love_is_earned: 2 } },
      { id: 'just_being_there', label: 'Just being there. It was not conditional', weights: {} },
    ],
  },
  {
    id: 'money_home',
    kind: 'history',
    question: 'Money, in the house you grew up in.',
    multi: false,
    options: [
      { id: 'tight', label: 'Tight, and everyone knew it', weights: { money_is_scarce: 3, not_safe_to_want: 2 } },
      { id: 'tense', label: 'Not obviously short, but a tense subject', weights: { money_is_scarce: 2, not_safe_to_want: 2 } },
      { id: 'wanting_greedy', label: 'Wanting more was treated as greedy or above yourself', weights: { not_safe_to_want: 3, money_is_scarce: 1 } },
      { id: 'fine', label: 'A normal subject. Not loaded', weights: {} },
    ],
  },
  {
    id: 'ambition_home',
    kind: 'history',
    question: 'And ambition — wanting a different life from the one you were handed?',
    multi: false,
    options: [
      { id: 'discouraged', label: 'Treated as unrealistic, or as a rejection of them', weights: { not_safe_to_want: 3, too_late: 1 } },
      { id: 'conditional', label: 'Encouraged, but only along a specific approved route', weights: { not_safe_to_want: 2, love_is_earned: 2 } },
      { id: 'pressure', label: 'Expected. Anything less was a disappointment', weights: { not_enough: 3, must_be_perfect: 3 } },
      { id: 'supported', label: 'Genuinely supported, whatever it was', weights: {} },
    ],
  },
  {
    id: 'people_now',
    kind: 'environment',
    question: 'The people around you now — what do they expect of you?',
    multi: true,
    options: [
      { id: 'be_solid', label: 'To be the solid one who does not wobble', weights: { im_the_reliable_one: 3, needs_are_a_burden: 2 } },
      { id: 'stay_same', label: 'To stay roughly who I have always been', weights: { not_safe_to_want: 3, too_late: 2 } },
      { id: 'keep_delivering', label: 'To keep delivering at the level I have set', weights: { must_be_perfect: 2, love_is_earned: 2, rest_is_lazy: 1 } },
      { id: 'no_expectation', label: 'Honestly, not much', weights: { not_enough: 1 } },
      { id: 'expect_growth', label: 'They expect me to grow and they make room for it', weights: {} },
    ],
  },
  {
    id: 'if_changed',
    kind: 'environment',
    question: 'If you actually became the person in your vision, who around you would find it hardest?',
    help: 'This is not a trick question. Change has a cost and it is usually paid by somebody.',
    multi: false,
    options: [
      { id: 'family', label: 'Family — it would read as leaving them behind', weights: { not_safe_to_want: 3, love_is_earned: 2 } },
      { id: 'partner', label: 'My partner', weights: { not_safe_to_want: 2, conflict_is_dangerous: 2 } },
      { id: 'friends', label: 'Old friends', weights: { not_safe_to_want: 2 } },
      { id: 'me', label: 'Me. I would not know who I was', weights: { not_enough: 3, cant_be_trusted: 2 } },
      { id: 'nobody', label: 'Nobody. They would be pleased', weights: {} },
    ],
  },
  {
    id: 'age_clock',
    kind: 'environment',
    question: 'When you think about your age and where you are.',
    multi: false,
    options: [
      { id: 'behind', label: 'I am behind where I should be by now', weights: { im_behind: 3, not_enough: 2 } },
      { id: 'too_late', label: 'Some doors are already shut', weights: { too_late: 3, im_behind: 2 } },
      { id: 'running_out', label: 'There is less time than there was and I feel it', weights: { im_behind: 2, too_late: 1 } },
      { id: 'fine', label: 'I am where I am. It is workable', weights: {} },
    ],
  },
];

export const PROBE_BY_ID = new Map(PROBES.map((p) => [p.id, p]));
