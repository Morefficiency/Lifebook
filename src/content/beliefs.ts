/**
 * The belief catalogue.
 *
 * These are *candidates*, never conclusions. The engine scores them against
 * what the user told us and the app offers the top few as questions — "does
 * this sound like you?" — with reject and rewrite as equal answers. Nothing
 * here is ever presented as a finding about the person.
 *
 * Each entry carries its own counterpart: the identity a person who does not
 * hold this belief operates from. Note the framing — every target is stated as
 * conduct ("I am someone who ships before it is perfect"), never as a trait
 * ("I am confident"). A trait claim you do not believe is inert at best; an
 * identity claim about how you act can be settled by acting.
 */
import type { LifeArea } from '../types';

export interface PracticeTemplate {
  kind: 'thought' | 'behaviour' | 'affirmation';
  /** For a thought swap: the thought to catch. */
  cue?: string;
  text: string;
  cadence: 'daily' | 'weekly' | 'when_it_shows_up';
}

export interface BeliefCandidate {
  id: string;
  /** How the belief sounds from inside, in the user's own voice. */
  text: string;
  /** A one-line description of what it costs, shown under the candidate. */
  cost: string;
  /** Areas this typically shows up in — used to weight it against the gap. */
  areas: LifeArea[];
  /** The identity that replaces it. Conduct, not trait. */
  identity: string;
  /** Why that identity is the counterpart, shown when he asks. */
  identityWhy: string;
  practices: PracticeTemplate[];
}

export const BELIEF_CATALOGUE: BeliefCandidate[] = [
  {
    id: 'not_enough',
    text: 'I am not enough as I am, so I have to keep earning the right to take up space.',
    cost: 'Nothing is ever finished, because finishing would mean the earning stops.',
    areas: ['character', 'emotions', 'work', 'partner'],
    identity: 'I am someone who does good work without putting his worth on the line for it.',
    identityWhy:
      'The belief ties the value of the work to the value of the person. The counterpart is not "I am valuable" — that is just an assertion. It is the practice of letting a piece of work be judged as work.',
    practices: [
      { kind: 'thought', cue: 'If this is not good, that says something about me', text: 'This is one piece of work. It can be poor without me being poor.', cadence: 'when_it_shows_up' },
      { kind: 'behaviour', text: 'Finish one thing to "good enough" and hand it over without a covering apology.', cadence: 'weekly' },
      { kind: 'affirmation', text: 'I do good work without putting myself on trial for it.', cadence: 'daily' },
    ],
  },
  {
    id: 'must_be_perfect',
    text: 'If it is not perfect, it will expose me.',
    cost: 'You ship late, or not at all, and call it standards.',
    areas: ['work', 'mind', 'character'],
    identity: 'I am someone who ships at eighty per cent and corrects in the open.',
    identityWhy:
      'Perfectionism is not about quality — it is about not being seen mid-process. The counterpart is the habit of being seen mid-process and surviving it.',
    practices: [
      { kind: 'thought', cue: 'It is not ready yet', text: 'Is it not ready, or am I not ready to be seen? Ship it and find out.', cadence: 'when_it_shows_up' },
      { kind: 'behaviour', text: 'Send one thing a week before you think it is finished, and say so out loud.', cadence: 'weekly' },
      { kind: 'affirmation', text: 'I ship at eighty per cent and correct in the open.', cadence: 'daily' },
    ],
  },
  {
    id: 'cant_be_trusted',
    text: 'I cannot trust myself to follow through, so there is no point starting properly.',
    cost: 'You pre-emptively half-commit, which then proves the belief.',
    areas: ['character', 'health', 'work'],
    identity: 'I am someone who keeps small promises to himself.',
    identityWhy:
      'Self-trust is not decided by intention, it is decided by a track record. So the counterpart has to be small enough to actually keep, and then repeated.',
    practices: [
      { kind: 'thought', cue: 'I will probably drop this like the others', text: 'Make it small enough that dropping it is not an option, then keep it today.', cadence: 'when_it_shows_up' },
      { kind: 'behaviour', text: 'Make one promise to yourself each morning that takes under ten minutes. Keep it before noon.', cadence: 'daily' },
      { kind: 'affirmation', text: 'I keep the small promises I make to myself.', cadence: 'daily' },
    ],
  },
  {
    id: 'not_safe_to_want',
    text: 'Wanting more than I have is dangerous, or greedy, or a betrayal of where I come from.',
    cost: 'You shrink the vision before anyone else gets the chance to.',
    areas: ['vision', 'money', 'work', 'family'],
    identity: 'I am someone who says what he wants out loud, in plain words.',
    identityWhy:
      'This belief operates by keeping wants unspoken, where they cannot be argued with or acted on. Saying one out loud is the whole intervention.',
    practices: [
      { kind: 'thought', cue: 'Who am I to want that', text: 'Wanting it costs no one anything. Say it plainly and see what actually happens.', cadence: 'when_it_shows_up' },
      { kind: 'behaviour', text: 'Tell one person, this week, something you actually want — without hedging it into a joke.', cadence: 'weekly' },
      { kind: 'affirmation', text: 'I say what I want in plain words.', cadence: 'daily' },
    ],
  },
  {
    id: 'love_is_earned',
    text: 'I am loved for what I provide, not for who I am.',
    cost: 'You keep providing, and never find out whether the other thing was true.',
    areas: ['partner', 'family', 'social', 'character'],
    identity: 'I am someone who lets people see him without a deliverable in his hands.',
    identityWhy:
      'The belief is untestable while you keep providing. It only becomes testable when you turn up with nothing to offer and stay in the room.',
    practices: [
      { kind: 'thought', cue: 'What can I bring / do / fix here', text: 'Turn up with nothing this time. Notice what does not collapse.', cadence: 'when_it_shows_up' },
      { kind: 'behaviour', text: 'Spend time with one person this week where you provide nothing and fix nothing.', cadence: 'weekly' },
      { kind: 'affirmation', text: 'I am wanted in the room, not for what I carry into it.', cadence: 'daily' },
    ],
  },
  {
    id: 'money_is_scarce',
    text: 'There is never going to be enough, whatever the number says.',
    cost: 'You make decisions from dread, which is expensive in both directions.',
    areas: ['money', 'emotions', 'lifestyle'],
    identity: 'I am someone who decides with numbers rather than with dread.',
    identityWhy:
      'The feeling does not respond to the balance, so arguing with the feeling does not work. Looking at the actual figure on a schedule does.',
    practices: [
      { kind: 'thought', cue: 'We cannot afford that', text: 'Can we not afford it, or does it just feel that way? Check the number.', cadence: 'when_it_shows_up' },
      { kind: 'behaviour', text: 'Look at the real balance and runway once a week, at a set time, whether or not you want to.', cadence: 'weekly' },
      { kind: 'affirmation', text: 'I decide with numbers, not with dread.', cadence: 'daily' },
    ],
  },
  {
    id: 'im_behind',
    text: 'I am behind, and everyone my age has it worked out.',
    cost: 'You measure against a field that does not exist, and it makes you hurry badly.',
    areas: ['work', 'vision', 'emotions', 'money'],
    identity: 'I am someone who runs on his own clock.',
    identityWhy:
      'The comparison is against a composite of other people\'s highlights. The counterpart is a measurement against your own last year, which is the only comparison with information in it.',
    practices: [
      { kind: 'thought', cue: 'Everyone else is further along', text: 'Further along what? Compare to where I was, not to a composite of other people.', cadence: 'when_it_shows_up' },
      { kind: 'behaviour', text: 'Write down one thing that is true now and was not true a year ago.', cadence: 'weekly' },
      { kind: 'affirmation', text: 'I run on my own clock.', cadence: 'daily' },
    ],
  },
  {
    id: 'conflict_is_dangerous',
    text: 'If I say what I actually think, I will lose people.',
    cost: 'You are agreeable and slightly absent, and nobody gets the real thing.',
    areas: ['character', 'partner', 'social', 'work'],
    identity: 'I am someone who says the true thing and stays in the room.',
    identityWhy:
      'The belief predicts that honesty ends relationships. It has almost certainly never been tested at close range, because you have been managing it instead.',
    practices: [
      { kind: 'thought', cue: 'Better not to say it', text: 'Say it, kindly and clearly, and stay to see what happens.', cadence: 'when_it_shows_up' },
      { kind: 'behaviour', text: 'Say the thing you would normally save for the car ride home, in the room, once this week.', cadence: 'weekly' },
      { kind: 'affirmation', text: 'I say the true thing and I stay in the room.', cadence: 'daily' },
    ],
  },
  {
    id: 'im_the_reliable_one',
    text: 'If I stop holding it all, it falls over.',
    cost: 'You are load-bearing and exhausted, and nobody else ever gets to develop.',
    areas: ['character', 'family', 'work', 'emotions'],
    identity: 'I am someone who lets things be carried by other people.',
    identityWhy:
      'The belief cannot be disproved while you are still holding everything. It only gets tested when you put something down.',
    practices: [
      { kind: 'thought', cue: 'It is faster if I just do it', text: 'Faster today, heavier every week after. Hand it over.', cadence: 'when_it_shows_up' },
      { kind: 'behaviour', text: 'Hand over one thing you normally do, and do not check on it.', cadence: 'weekly' },
      { kind: 'affirmation', text: 'I let other people carry their share.', cadence: 'daily' },
    ],
  },
  {
    id: 'body_is_last',
    text: 'My body is what I spend in order to get everything else.',
    cost: 'It works, right up until it does not, and the bill arrives all at once.',
    areas: ['health', 'lifestyle', 'emotions'],
    identity: 'I am someone who books sleep and training first and moves the work around them.',
    identityWhy:
      'Nothing changes while sleep and training are the flexible items in the week — and "my body is the asset" is a stance, not something a week can settle. The counterpart has to be the ordering itself: which things go into the calendar first.',
    practices: [
      { kind: 'thought', cue: 'I will sleep / train / eat properly once this is over', text: 'It is never over. Protect the hour now.', cadence: 'when_it_shows_up' },
      { kind: 'behaviour', text: 'Put sleep and training in the calendar as fixed, and move the work around them once this week.', cadence: 'weekly' },
      { kind: 'affirmation', text: 'I book sleep and training first, and move the work around them.', cadence: 'daily' },
    ],
  },
  {
    id: 'im_an_impostor',
    text: 'If they knew what I actually know, they would revise their opinion of me.',
    cost: 'You avoid the rooms where you would learn fastest.',
    areas: ['work', 'mind', 'social'],
    identity: 'I am someone who is judged on his work, not on his own estimate of himself.',
    identityWhy:
      'The belief lives on never checking. Saying "I do not know" out loud in a room that matters is the cheapest possible test of it.',
    practices: [
      { kind: 'thought', cue: 'They are going to find out', text: 'Find out what? They have the work. Let the work be the evidence.', cadence: 'when_it_shows_up' },
      { kind: 'behaviour', text: 'Say "I do not know" once this week, out loud, in a room where it feels expensive.', cadence: 'weekly' },
      { kind: 'affirmation', text: 'I am judged on my work, not on my estimate of myself.', cadence: 'daily' },
    ],
  },
  {
    id: 'rest_is_lazy',
    text: 'Slowing down means I am lazy.',
    cost: 'You are never off, so you are never fully on either.',
    areas: ['health', 'emotions', 'lifestyle', 'character'],
    identity: 'I am someone who recovers on purpose.',
    identityWhy:
      'Rest taken guiltily does not restore anything. The counterpart is rest that is scheduled and defended like work.',
    practices: [
      { kind: 'thought', cue: 'I should be doing something', text: 'This is the recovery block. Doing nothing is the task.', cadence: 'when_it_shows_up' },
      { kind: 'behaviour', text: 'Book one block of genuine rest and treat it as unmovable.', cadence: 'weekly' },
      { kind: 'affirmation', text: 'I recover on purpose.', cadence: 'daily' },
    ],
  },
  {
    id: 'too_late',
    text: 'It is too late for me to change this.',
    cost: 'It makes the next ten years a foregone conclusion in advance.',
    areas: ['vision', 'work', 'health', 'mind'],
    identity: 'I am someone who starts at the age he is.',
    identityWhy:
      'The belief is a prediction about the future stated as a fact about the present. The counterpart is starting something small enough that the prediction gets tested this month.',
    practices: [
      { kind: 'thought', cue: 'I should have started years ago', text: 'Probably. Starting now is still the earliest remaining option.', cadence: 'when_it_shows_up' },
      { kind: 'behaviour', text: 'Take the first real step on the thing you think you are too late for.', cadence: 'weekly' },
      { kind: 'affirmation', text: 'I start at the age I am.', cadence: 'daily' },
    ],
  },
  {
    id: 'needs_are_a_burden',
    text: 'My needs are an imposition on other people.',
    cost: 'You go without, then resent people for not noticing.',
    areas: ['partner', 'family', 'social', 'emotions'],
    identity: 'I am someone who asks directly and lets the answer be a real answer.',
    identityWhy:
      'Hinting protects you from a "no" and guarantees you do not get the thing. Asking plainly is the only version that can succeed.',
    practices: [
      { kind: 'thought', cue: 'I do not want to be a bother', text: 'Ask plainly. A no is information, not a verdict.', cadence: 'when_it_shows_up' },
      { kind: 'behaviour', text: 'Ask for one thing this week without softening it or trading for it first.', cadence: 'weekly' },
      { kind: 'affirmation', text: 'I ask directly, and a no is just an answer.', cadence: 'daily' },
    ],
  },
];

export const BELIEF_BY_ID = new Map(BELIEF_CATALOGUE.map((b) => [b.id, b]));

/**
 * The fallback programme, for a belief the user wrote himself that matches
 * nothing in the catalogue.
 *
 * Deliberately generic and deliberately not empty. The catalogue is a list of
 * common patterns, not a taxonomy of every way a person can get in their own
 * way — so someone whose belief is genuinely their own must still leave this
 * stage with something to do. The shape is identical to a catalogue programme:
 * catch the thought, take an action that only the new identity would take, and
 * say the sentence alongside something real. He fills in the specifics.
 */
export const GENERIC_PRACTICES: PracticeTemplate[] = [
  {
    kind: 'thought',
    cue: 'Write the sentence you catch yourself thinking',
    text: 'Write what you want to think instead — plainly, in words you would actually use.',
    cadence: 'when_it_shows_up',
  },
  {
    kind: 'behaviour',
    text: 'Name one small thing that only the new version of you would do, and do it this week.',
    cadence: 'weekly',
  },
  {
    kind: 'affirmation',
    text: 'Write the identity as one sentence, and say it only when you have an instance to attach.',
    cadence: 'daily',
  },
];

/** Every catalogue entry, as a picker for "which of these does yours resemble?". */
export const RESEMBLANCE_OPTIONS = BELIEF_CATALOGUE.map((b) => ({
  id: b.id, text: b.text, areas: b.areas,
}));
