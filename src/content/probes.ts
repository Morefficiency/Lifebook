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
      { id: 'do_it_quietly', label: 'I do it, but I do not tell anyone until it works', weights: { im_an_impostor: 3 } },
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
      { id: 'guilty_rest', label: 'I rest, but with a background hum of guilt', weights: { rest_is_lazy: 2 } },
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
      { id: 'stay_quiet', label: 'I let it go and think about it afterwards', weights: { conflict_is_dangerous: 3 } },
      { id: 'soften', label: 'I say something, heavily softened', weights: { conflict_is_dangerous: 2, needs_are_a_burden: 1 } },
      { id: 'defer', label: 'I assume they are probably right and I am missing something', weights: { im_an_impostor: 3 } },
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
      { id: 'apologise', label: 'I ask, wrapped in apology', weights: { needs_are_a_burden: 2, money_is_dirty: 1 } },
      { id: 'just_ask', label: 'I ask directly', weights: {} },
    ],
  },
  {
    id: 'praise',
    kind: 'behaviour',
    question: 'Someone praises your work in front of others.',
    multi: false,
    options: [
      { id: 'deflect', label: 'I deflect, or credit the circumstances', weights: { im_an_impostor: 3 } },
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
      { id: 'all_of_it', label: 'Most of it. If I stopped, things would fall over', weights: { im_the_reliable_one: 3, needs_are_a_burden: 1, body_is_last: 1 } },
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
      { id: 'helping', label: 'Looking after everyone else', weights: { im_the_reliable_one: 3, needs_are_a_burden: 2, body_is_last: 1 } },
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
      { id: 'wanting_greedy', label: 'Wanting more was treated as greedy or above yourself', weights: { not_safe_to_want: 3, money_is_dirty: 2, money_is_scarce: 1 } },
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
      { id: 'no_expectation', label: 'Honestly, not much', weights: { not_enough: 2 } },
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
  /* ---- Behaviour: other people, and what you let them carry ------------- */
  {
    id: 'handover',
    kind: 'behaviour',
    question: 'Something you normally do yourself could be handed to somebody else.',
    multi: false,
    options: [
      { id: 'keep_it', label: 'I keep it. It is easier than explaining it', weights: { must_control: 3, im_the_reliable_one: 2, must_be_needed: 1 } },
      { id: 'hand_and_hover', label: 'I hand it over and then check on it more than I should', weights: { must_control: 3, cant_be_trusted: 1 } },
      { id: 'hand_the_small', label: 'I give away the small parts and keep the part that matters', weights: { must_control: 2, must_be_needed: 2 } },
      { id: 'reluctant', label: 'I would, but then who am I around here', weights: { must_be_needed: 3, im_the_reliable_one: 2 } },
      { id: 'hand_it', label: 'I hand it over and leave it alone', weights: {} },
    ],
  },
  {
    id: 'new_person',
    kind: 'behaviour',
    question: 'Somebody you like is starting to know you properly.',
    multi: false,
    options: [
      { id: 'wait_for_turn', label: 'Part of me is waiting for the bit where they change their mind', weights: { closeness_costs: 3 } },
      { id: 'edit', label: 'I keep a version of myself back for a while', weights: { closeness_costs: 2, im_too_much: 2 } },
      { id: 'keep_light', label: 'I keep it light — going deeper feels like signing something', weights: { commitment_traps: 3, closeness_costs: 1 } },
      { id: 'business', label: 'I am fine as long as we are doing something rather than talking', weights: { feelings_are_indulgent: 3, closeness_costs: 1 } },
      { id: 'let_them', label: 'I let them', weights: {} },
    ],
  },
  {
    id: 'credit',
    kind: 'behaviour',
    question: 'Something you did well is about to be mentioned in front of other people.',
    multi: false,
    options: [
      { id: 'deflect_team', label: 'I move it onto the team before anyone can dwell on it', weights: { being_seen_is_risk: 3, praise_is_pity: 2 } },
      { id: 'downplay', label: 'I play down how much of it was mine', weights: { praise_is_pity: 2, im_an_impostor: 2 } },
      { id: 'brace', label: 'I brace — attention is usually followed by something', weights: { being_seen_is_risk: 3, im_an_impostor: 1 } },
      { id: 'not_yet', label: 'I would rather it waited until the work is further along', weights: { must_be_perfect: 2, being_seen_is_risk: 1 } },
      { id: 'take_it', label: 'I let it be said', weights: {} },
    ],
  },
  {
    id: 'crossed',
    kind: 'behaviour',
    question: 'Somebody does something to you that is genuinely not fair.',
    multi: false,
    options: [
      { id: 'swallow', label: 'I let it go, and it stays with me for a while', weights: { anger_is_dangerous: 3, conflict_is_dangerous: 2 } },
      { id: 'cold', label: 'I say nothing and go cooler towards them', weights: { anger_is_dangerous: 2, conflict_is_dangerous: 2, feelings_are_indulgent: 1 } },
      { id: 'explain_them', label: 'I find the reading where they did not mean it', weights: { needs_are_a_burden: 2, conflict_is_dangerous: 2 } },
      { id: 'afraid_of_it', label: 'I do not trust what I would say if I really let go', weights: { anger_is_dangerous: 3 } },
      { id: 'say_it_now', label: 'I say so, at the time', weights: {} },
    ],
  },
  {
    id: 'how_was_it',
    kind: 'behaviour',
    question: 'Someone close asks how a hard week actually was.',
    multi: false,
    options: [
      { id: 'facts', label: 'I tell them what happened rather than how it was', weights: { feelings_are_indulgent: 3, im_too_much: 1 } },
      { id: 'fine_thanks', label: 'Fine. There is no use going into it', weights: { feelings_are_indulgent: 3, needs_are_a_burden: 2 } },
      { id: 'too_much', label: 'I start, then hear myself and stop', weights: { im_too_much: 3, needs_are_a_burden: 1 } },
      { id: 'flip_it', label: 'I turn it round and ask about them', weights: { needs_are_a_burden: 2, im_the_reliable_one: 2 } },
      { id: 'tell_them', label: 'I tell them how it was', weights: {} },
    ],
  },

  /* ---- Behaviour: rooms, questions and pace ----------------------------- */
  {
    id: 'dont_understand',
    kind: 'behaviour',
    question: 'You are twenty minutes into something and you have lost the thread. Everyone else seems fine.',
    multi: false,
    options: [
      { id: 'nod', label: 'I nod and work it out afterwards on my own', weights: { everyone_else_knows: 3, im_an_impostor: 2 } },
      { id: 'ask_after', label: 'I ask one person quietly, later', weights: { everyone_else_knows: 2, being_seen_is_risk: 1 } },
      { id: 'assume_me', label: 'I assume it is me being slow rather than them being unclear', weights: { im_slow: 3, everyone_else_knows: 2 } },
      { id: 'not_my_room', label: 'I take it as a sign I am out of my depth here', weights: { dont_belong: 3, im_an_impostor: 2 } },
      { id: 'ask_now', label: 'I stop them and ask', weights: {} },
    ],
  },
  {
    id: 'thinking_time',
    kind: 'behaviour',
    question: 'You are asked something in front of people and you do not have the answer ready.',
    multi: false,
    options: [
      { id: 'fill', label: 'I say something to fill the gap and refine it later', weights: { im_slow: 3, everyone_else_knows: 1 } },
      { id: 'panic_quick', label: 'I go quiet and feel the seconds', weights: { im_slow: 3, im_an_impostor: 2 } },
      { id: 'over_qualify', label: 'I hedge it so heavily that nobody can hold me to it', weights: { must_be_perfect: 2, im_an_impostor: 2 } },
      { id: 'defer_out', label: 'I hand it to somebody quicker', weights: { im_slow: 2, dont_belong: 1 } },
      { id: 'take_a_second', label: 'I say I need a second, and take it', weights: {} },
    ],
  },
  {
    id: 'new_room',
    kind: 'behaviour',
    question: 'A room of people who mostly know each other. You are new.',
    multi: false,
    options: [
      { id: 'edge', label: 'I find the edge of it and stay useful', weights: { dont_belong: 3, being_seen_is_risk: 2 } },
      { id: 'credentials', label: 'I work out early whether I am supposed to be here', weights: { dont_belong: 3, im_an_impostor: 2 } },
      { id: 'dial_down', label: 'I come in smaller than I am until I know the room', weights: { im_too_much: 3, being_seen_is_risk: 1 } },
      { id: 'how_i_look', label: 'I am mostly aware of how I am coming across physically', weights: { appearance_is_worth: 3, dont_belong: 1 } },
      { id: 'just_join', label: 'I join in', weights: {} },
    ],
  },

  /* ---- Behaviour: choosing, effort, and endings ------------------------- */
  {
    id: 'two_paths',
    kind: 'behaviour',
    question: 'Two reasonable options, and you have to pick one.',
    multi: false,
    options: [
      { id: 'more_research', label: 'I keep gathering information past the point it helps', weights: { wrong_choice_is_fatal: 3, must_be_perfect: 2 } },
      { id: 'stall_out', label: 'I put it off until circumstances decide it for me', weights: { wrong_choice_is_fatal: 3, cant_be_trusted: 2 } },
      { id: 'take_longer', label: 'I get there, but slower than the people around me', weights: { im_slow: 2, wrong_choice_is_fatal: 1 } },
      { id: 'harder_one', label: 'I lean towards the harder one — it feels more honest', weights: { struggle_is_proof: 3 } },
      { id: 'pick', label: 'I pick one and go', weights: {} },
    ],
  },
  {
    id: 'shortcut',
    kind: 'behaviour',
    question: 'Somebody shows you a much faster way to do something you do the long way.',
    multi: false,
    options: [
      { id: 'feels_wrong', label: 'I take it, but it feels a bit like cheating', weights: { struggle_is_proof: 3 } },
      { id: 'keep_mine', label: 'I stay with my way — I know what it does', weights: { struggle_is_proof: 2, must_control: 2 } },
      { id: 'suspicious', label: 'I assume something is being skipped that will cost later', weights: { must_control: 3, struggle_is_proof: 1 } },
      { id: 'no_time', label: 'I mean to learn it and never find the hour', weights: { im_behind: 2, cant_be_trusted: 1 } },
      { id: 'use_it', label: 'I use it and move on', weights: {} },
    ],
  },
  {
    id: 'long_thing',
    kind: 'behaviour',
    question: 'Something you have carried for years is no longer really working.',
    multi: true,
    help: 'A role, a project, a commitment, a way of doing things.',
    options: [
      { id: 'giving_up', label: 'Stopping would mean I failed at it', weights: { cant_quit: 3 } },
      { id: 'they_need', label: 'They would struggle without me', weights: { must_be_needed: 3, im_the_reliable_one: 2, failing_them: 1 } },
      { id: 'sunk', label: 'I have put too much in to stop now', weights: { cant_quit: 3, struggle_is_proof: 1 } },
      { id: 'nothing_adds', label: 'Honestly, none of it adds up to much either way', weights: { nothing_matters: 3 } },
      { id: 'would_trap', label: 'Replacing it would mean committing to something else', weights: { commitment_traps: 3, wrong_choice_is_fatal: 1 } },
      { id: 'end_it', label: 'I end things when they stop working', weights: {} },
    ],
  },
  {
    id: 'all_in',
    kind: 'behaviour',
    question: 'Something asks you to be properly all in — a person, a place, a piece of work.',
    multi: false,
    options: [
      { id: 'exit_open', label: 'I keep a way out, even when I do not plan to use it', weights: { commitment_traps: 3, closeness_costs: 2 } },
      { id: 'what_if_wrong', label: 'I stall on whether it is the right one to be all in on', weights: { wrong_choice_is_fatal: 3, commitment_traps: 1 } },
      { id: 'no_way_back', label: 'If I go in, I will not let myself leave, and that frightens me', weights: { cant_quit: 3, commitment_traps: 2 } },
      { id: 'not_offered', label: 'Things like that are not really offered to people like me', weights: { not_for_me: 3, dont_belong: 1 } },
      { id: 'go_in', label: 'I go in', weights: {} },
    ],
  },

  /* ---- Behaviour: worth, money and the body ----------------------------- */
  {
    id: 'compliment',
    kind: 'behaviour',
    question: 'Someone says something genuinely good about you, to your face.',
    multi: false,
    options: [
      { id: 'being_kind', label: 'I assume they are being kind', weights: { praise_is_pity: 3, not_enough: 2 } },
      { id: 'qualify', label: 'I add the qualifier that makes it smaller', weights: { praise_is_pity: 3, im_an_impostor: 1 } },
      { id: 'return_it', label: 'I return one straight back so it does not sit on me', weights: { praise_is_pity: 2, im_too_much: 1 } },
      { id: 'if_they_knew', label: 'I think about the part they have not seen', weights: { im_an_impostor: 3, closeness_costs: 2 } },
      { id: 'thank_you', label: 'I say thank you', weights: {} },
    ],
  },
  {
    id: 'your_price',
    kind: 'behaviour',
    question: 'You have to say what your work is worth, out loud, to the person paying.',
    multi: false,
    options: [
      { id: 'shade_down', label: 'I say a number slightly under what I meant to say', weights: { money_is_dirty: 3, not_enough: 2 } },
      { id: 'justify', label: 'I say it and then explain it until they agree', weights: { money_is_dirty: 2, not_enough: 2 } },
      { id: 'grabby', label: 'Asking properly feels a bit grasping', weights: { money_is_dirty: 3, not_safe_to_want: 2 } },
      { id: 'not_that_league', label: 'The numbers I hear other people say are not for me', weights: { not_for_me: 3, money_is_scarce: 1 } },
      { id: 'say_it', label: 'I say the number', weights: {} },
    ],
  },
  {
    id: 'mirror_day',
    kind: 'behaviour',
    question: 'You catch yourself in the mirror on a bad day.',
    multi: false,
    options: [
      { id: 'cancels', label: 'It changes what I am willing to do that day', weights: { appearance_is_worth: 3 } },
      { id: 'first_thing', label: 'I assume it is the first thing anyone else notices too', weights: { appearance_is_worth: 3, being_seen_is_risk: 1 } },
      { id: 'deserved', label: 'I take it as the bill for how I have been living', weights: { body_is_last: 2, appearance_is_worth: 2 } },
      { id: 'fix_later', label: 'I tell myself I will deal with it when things calm down', weights: { body_is_last: 3, im_behind: 1 } },
      { id: 'carry_on', label: 'I carry on with the day', weights: {} },
    ],
  },
  {
    id: 'the_ones_who_need_you',
    kind: 'behaviour',
    question: 'The people who depend on you — how does that sit, most days?',
    multi: false,
    options: [
      { id: 'shortchanging', label: 'They are getting less of me than they should', weights: { failing_them: 3, im_the_reliable_one: 1 } },
      { id: 'guilty_time', label: 'Even when I am with them, part of me is on what I am not doing', weights: { failing_them: 3, im_behind: 2 } },
      { id: 'only_me', label: 'It only works because I hold it, and that is fine', weights: { must_be_needed: 3, must_control: 2 } },
      { id: 'nothing_left', label: 'By the time I get to them there is not much left', weights: { failing_them: 2, body_is_last: 2, im_the_reliable_one: 1 } },
      { id: 'sits_fine', label: 'It sits fine', weights: {} },
    ],
  },

  /* ---- Environment and history ------------------------------------------ */
  {
    id: 'ten_years',
    kind: 'environment',
    question: 'Ten years out. What comes up?',
    multi: false,
    options: [
      { id: 'much_the_same', label: 'Much the same, if I am honest', weights: { nothing_matters: 3, too_late: 2 } },
      { id: 'no_picture', label: 'I cannot really picture it, so I do not', weights: { nothing_matters: 2, not_for_me: 2 } },
      { id: 'still_carrying', label: 'Still carrying most of what I am carrying now', weights: { cant_quit: 3, failing_them: 1 } },
      { id: 'others_lives', label: 'I can picture it clearly for other people', weights: { not_for_me: 3, nothing_matters: 1 } },
      { id: 'clear_enough', label: 'I have a reasonably clear picture', weights: {} },
    ],
  },
  {
    id: 'who_taught_you',
    kind: 'history',
    question: 'In the house you grew up in, what happened with feelings?',
    help: 'What was actually done with them, not what anyone said about them.',
    multi: true,
    options: [
      { id: 'not_discussed', label: 'They were not really discussed', weights: { feelings_are_indulgent: 3, closeness_costs: 1 } },
      { id: 'anger_scary', label: 'Somebody’s temper set the weather', weights: { anger_is_dangerous: 3, conflict_is_dangerous: 2 } },
      { id: 'too_much_child', label: 'I was told I was too sensitive, or too much', weights: { im_too_much: 3, feelings_are_indulgent: 2 } },
      { id: 'manage_them', label: 'I learned to read the adults and manage them', weights: { im_the_reliable_one: 2, needs_are_a_burden: 2, closeness_costs: 1 } },
      { id: 'get_on', label: 'Getting on with it was the respectable option', weights: { feelings_are_indulgent: 3, rest_is_lazy: 1 } },
      { id: 'talked_about', label: 'They were talked about, more or less normally', weights: {} },
    ],
  },
  {
    id: 'standing_out_young',
    kind: 'history',
    question: 'When you stood out as a kid — good or bad — what tended to follow?',
    multi: true,
    options: [
      { id: 'cut_down', label: 'Somebody made sure I did not get above myself', weights: { being_seen_is_risk: 3, not_safe_to_want: 2 } },
      { id: 'unwelcome', label: 'It made me the odd one rather than the good one', weights: { dont_belong: 3, im_too_much: 2 } },
      { id: 'praise_thin', label: 'Praise came, and it never quite felt like it was about me', weights: { praise_is_pity: 3 } },
      { id: 'raised_bar', label: 'It became the new minimum', weights: { not_enough: 3, must_be_perfect: 2 } },
      { id: 'safer_quiet', label: 'I worked out it was safer to be unremarkable', weights: { being_seen_is_risk: 3, dont_belong: 1 } },
      { id: 'fine_either_way', label: 'Nothing much. It was fine either way', weights: {} },
    ],
  },
];

export const PROBE_BY_ID = new Map(PROBES.map((p) => [p.id, p]));
