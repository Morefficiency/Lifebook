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
  /* ---- Control, trust and other people ---------------------------------- */
  {
    id: 'must_control',
    text: 'If I let go of it, it will be done badly, and I will be the one who pays.',
    cost: 'You are the bottleneck in your own life, and nobody around you ever gets better at anything.',
    areas: ['work', 'family', 'character', 'emotions'],
    identity: 'I am someone who hands work over whole and lets it come back different.',
    identityWhy:
      'The belief is not really about standards — it is about what happens to you if somebody else falls short. So the counterpart is not "I trust people"; it is the repeated experience of handing something over, watching it come back not quite how you would have done it, and finding that nothing collapsed.',
    practices: [
      { kind: 'thought', cue: 'It is faster if I just do it', text: 'Faster today, and I am still the only one who can do it in a year.', cadence: 'when_it_shows_up' },
      { kind: 'behaviour', text: 'Hand one whole thing to somebody this week — the outcome, not the task list — and do not check it until they bring it back.', cadence: 'weekly' },
      { kind: 'affirmation', text: 'I hand work over whole and let it come back different.', cadence: 'daily' },
    ],
  },
  {
    id: 'must_be_needed',
    text: 'I am safe here as long as I am the one they cannot do without.',
    cost: 'You build a life you are not allowed to rest in, and quietly resent the people you built it for.',
    areas: ['work', 'partner', 'family', 'character'],
    identity: 'I am someone who lets people want him rather than need him.',
    identityWhy:
      'Indispensability feels like security and works like a hostage arrangement — it has to be maintained, and it cannot be put down. The counterpart is finding out, in small doses, that the room still wants you there when it does not require you.',
    practices: [
      { kind: 'thought', cue: 'If they can manage without me, what am I for?', text: 'Being wanted and being required are different things. I am testing which one is true.', cadence: 'when_it_shows_up' },
      { kind: 'behaviour', text: 'Be unavailable for one thing you would normally cover, and let it be handled without you.', cadence: 'weekly' },
      { kind: 'affirmation', text: 'I let people want me rather than need me.', cadence: 'daily' },
    ],
  },

  /* ---- Closeness, exposure and anger ------------------------------------ */
  {
    id: 'closeness_costs',
    text: 'If someone gets close enough, they will find the thing that makes them go.',
    cost: 'You keep a version of yourself in reserve, and then wonder why nobody knows you.',
    areas: ['partner', 'social', 'emotions', 'character'],
    identity: 'I am someone who says the unflattering true thing early rather than late.',
    identityWhy:
      'The belief protects a secret it has never actually tested. The counterpart cannot be "people will accept me" — nobody can promise that. It is the practice of putting the real thing on the table sooner, so that what happens next is information instead of a fear.',
    practices: [
      { kind: 'thought', cue: 'They would think differently if they knew', text: 'Then they can know it now, while it is small, instead of in year three.', cadence: 'when_it_shows_up' },
      { kind: 'behaviour', text: 'Tell one person one true thing about yourself you would normally hold back a while longer.', cadence: 'weekly' },
      { kind: 'affirmation', text: 'I say the unflattering true thing early rather than late.', cadence: 'daily' },
    ],
  },
  {
    id: 'being_seen_is_risk',
    text: 'Standing out is how you get taken down.',
    cost: 'You do the work and then make sure nobody notices it was you.',
    areas: ['work', 'social', 'character', 'vision'],
    identity: 'I am someone who puts his name on his own work in public.',
    identityWhy:
      'This is not the impostor worry, which is about being found out. It is older and simpler: visibility itself was once unsafe. The counterpart is claiming authorship in small, survivable amounts until being seen stops predicting a cost.',
    practices: [
      { kind: 'thought', cue: 'Better not to make a thing of it', text: 'Who is it protecting, exactly, if nobody knows I did it?', cadence: 'when_it_shows_up' },
      { kind: 'behaviour', text: 'Say "I did this" once this week, out loud, to somebody who did not already know.', cadence: 'weekly' },
      { kind: 'affirmation', text: 'I put my name on my own work in public.', cadence: 'daily' },
    ],
  },
  {
    id: 'anger_is_dangerous',
    text: 'If I let myself be properly angry, I will turn into someone I do not want to be.',
    cost: 'Nothing gets said until it has gone cold, and then it comes out sideways.',
    areas: ['emotions', 'partner', 'family', 'character'],
    identity: 'I am someone who says he is annoyed on the day it happens, in ordinary words.',
    identityWhy:
      'The fear is of the extreme version, so the counterpart has to be the ordinary version — anger expressed early and small, at the size of the actual grievance, which is the thing that stops it arriving later at the wrong size.',
    practices: [
      { kind: 'thought', cue: 'It is not worth making a scene over', text: 'Saying it today at this size is what stops it being a scene in a month.', cadence: 'when_it_shows_up' },
      { kind: 'behaviour', text: 'Name one irritation on the day it happens, plainly, without building a case first.', cadence: 'weekly' },
      { kind: 'affirmation', text: 'I say I am annoyed on the day, in ordinary words.', cadence: 'daily' },
    ],
  },
  {
    id: 'feelings_are_indulgent',
    text: 'Having feelings about it is a waste of everybody’s time, mine included.',
    cost: 'You are efficient and unreachable, and the people close to you are talking to a spokesman.',
    areas: ['emotions', 'partner', 'social', 'spirit'],
    identity: 'I am someone who says how something landed before he says what he plans to do about it.',
    identityWhy:
      'The belief treats feeling as an obstacle to handling things. The counterpart is not "I am in touch with my emotions" — that is a claim nobody can act on. It is a sequencing habit: the reaction first, in one sentence, then the plan.',
    practices: [
      { kind: 'thought', cue: 'Never mind how I feel, what do we do', text: 'One sentence on how it landed. Then the plan.', cadence: 'when_it_shows_up' },
      { kind: 'behaviour', text: 'Once this week, answer "how was that?" with how it actually was rather than with what happened next.', cadence: 'weekly' },
      { kind: 'affirmation', text: 'I say how something landed before I say what I will do about it.', cadence: 'daily' },
    ],
  },

  /* ---- Comparison, deserving and belonging ------------------------------ */
  {
    id: 'everyone_else_knows',
    text: 'Everybody else got a manual for this that I did not get.',
    cost: 'You never ask the basic question, so the gap you are worried about stays exactly where it is.',
    areas: ['mind', 'work', 'social', 'money'],
    identity: 'I am someone who asks the obvious question in the room rather than after it.',
    identityWhy:
      'The belief survives on never checking. Everyone competent asks basic questions constantly; you cannot see it because they do it in the rooms you go quiet in. The counterpart is asking in the room, which is also the only way to find out how normal it is.',
    practices: [
      { kind: 'thought', cue: 'Everyone here already knows this', text: 'Then it costs them four seconds to tell me. Ask.', cadence: 'when_it_shows_up' },
      { kind: 'behaviour', text: 'Ask one question you think is too basic, in front of people, without prefacing it with an apology.', cadence: 'weekly' },
      { kind: 'affirmation', text: 'I ask the obvious question in the room rather than after it.', cadence: 'daily' },
    ],
  },
  {
    id: 'not_for_me',
    text: 'Things like that happen, but they happen to other people.',
    cost: 'You do not apply, do not ask, and do not go — so the evidence never changes.',
    areas: ['vision', 'work', 'money', 'partner'],
    identity: 'I am someone who puts his name in for things he is not sure he will get.',
    identityWhy:
      'The belief is unfalsifiable while you never enter. It is not fixed by deciding you deserve things; it is fixed by generating outcomes, including refusals, that it has to account for.',
    practices: [
      { kind: 'thought', cue: 'They are not going to pick someone like me', text: 'Possibly not. Enter anyway and let them be the ones who decide.', cadence: 'when_it_shows_up' },
      { kind: 'behaviour', text: 'Put your name in for one thing this month you would normally assume was not for you.', cadence: 'weekly' },
      { kind: 'affirmation', text: 'I put my name in for things I am not sure I will get.', cadence: 'daily' },
    ],
  },
  {
    id: 'dont_belong',
    text: 'Wherever I am, I am there slightly as a guest.',
    cost: 'You behave like a visitor, which is how rooms learn to treat you as one.',
    areas: ['social', 'work', 'character', 'spirit'],
    identity: 'I am someone who acts like a member of the rooms he is in.',
    identityWhy:
      'Belonging is not conferred and then felt; it is behaved and then noticed. The counterpart is the set of small proprietary acts a member does and a guest does not — starting the conversation, disagreeing, taking up the space.',
    practices: [
      { kind: 'thought', cue: 'I am the odd one here', text: 'A member would say the next thing. Say it.', cadence: 'when_it_shows_up' },
      { kind: 'behaviour', text: 'In one room this week, start something rather than joining it — the conversation, the plan, the invitation.', cadence: 'weekly' },
      { kind: 'affirmation', text: 'I act like a member of the rooms I am in.', cadence: 'daily' },
    ],
  },

  /* ---- Choosing, and what effort is supposed to feel like ---------------- */
  {
    id: 'wrong_choice_is_fatal',
    text: 'If I pick wrong, that is it — I do not get to recover from it.',
    cost: 'You research instead of deciding, and the not-deciding quietly becomes the decision.',
    areas: ['vision', 'work', 'money', 'partner'],
    identity: 'I am someone who decides on a deadline and treats the choice as revisable.',
    identityWhy:
      'Almost no decision is actually one-way, but the belief makes every decision feel like one. The counterpart is a habit that assumes reversibility and tests it: choose by a date, then find out how much of it you could in fact undo.',
    practices: [
      { kind: 'thought', cue: 'I need more information before I decide', text: 'What would I do if I had to answer today? And what part of this is actually irreversible?', cadence: 'when_it_shows_up' },
      { kind: 'behaviour', text: 'Take one decision you have been circling, give it a date this week, and decide on it.', cadence: 'weekly' },
      { kind: 'affirmation', text: 'I decide on a deadline and treat the choice as revisable.', cadence: 'daily' },
    ],
  },
  {
    id: 'struggle_is_proof',
    text: 'If it is not hard, I am not taking it seriously.',
    cost: 'You pick the difficult route on purpose and call the exhaustion integrity.',
    areas: ['work', 'character', 'health', 'lifestyle'],
    identity: 'I am someone who takes the easier route when the easier route works.',
    identityWhy:
      'The belief measures seriousness by cost rather than by result, so it quietly selects for waste. The counterpart is deliberately taking the cheap path where one exists, and noticing that the outcome did not get worse.',
    practices: [
      { kind: 'thought', cue: 'That feels like cheating', text: 'Is it worse, or is it just easier? Those are different objections.', cadence: 'when_it_shows_up' },
      { kind: 'behaviour', text: 'Find one thing you do the hard way out of habit and do it the easy way once. Note what actually changed.', cadence: 'weekly' },
      { kind: 'affirmation', text: 'I take the easier route when the easier route works.', cadence: 'daily' },
    ],
  },
  /* ---- Endings, praise and being held ----------------------------------- */
  {
    id: 'cant_quit',
    text: 'Stopping something means I failed at it.',
    cost: 'You are still carrying things you chose at twenty-five, and there is no room for anything new.',
    areas: ['work', 'character', 'lifestyle', 'vision'],
    identity: 'I am someone who closes things on purpose and says why.',
    identityWhy:
      'The belief cannot tell the difference between abandoning something and finishing with it. The counterpart supplies the missing category: an ending you choose, announce, and give a reason for is not a failure, and doing it once teaches the difference better than any argument.',
    practices: [
      { kind: 'thought', cue: 'I should not give up on this', text: 'Am I giving up, or am I done? Those are not the same, and only one of them is a failure.', cadence: 'when_it_shows_up' },
      { kind: 'behaviour', text: 'End one thing you have been carrying out of duty. Say out loud that you are ending it, and why.', cadence: 'weekly' },
      { kind: 'affirmation', text: 'I close things on purpose and say why.', cadence: 'daily' },
    ],
  },
  {
    id: 'praise_is_pity',
    text: 'When people say something good about me, they are being kind.',
    cost: 'Nothing good gets in, so the account never goes up however much you put into it.',
    areas: ['emotions', 'character', 'work', 'social'],
    identity: 'I am someone who says thank you and stops talking.',
    identityWhy:
      'Deflecting is not modesty, it is a filter — and while it runs, no amount of evidence can accumulate. The counterpart is deliberately not deflecting, which is uncomfortable and is the entire mechanism: the compliment has to be left standing long enough to land.',
    practices: [
      { kind: 'thought', cue: 'They are just being nice', text: 'Maybe. Take it anyway and see what it feels like to keep one.', cadence: 'when_it_shows_up' },
      { kind: 'behaviour', text: 'Receive one compliment with "thank you" and nothing after it. No qualifier, no returning it.', cadence: 'weekly' },
      { kind: 'affirmation', text: 'I say thank you, and I stop talking.', cadence: 'daily' },
    ],
  },
  {
    id: 'commitment_traps',
    text: 'If I commit to it properly, I lose the ability to get out.',
    cost: 'You keep one foot outside everything, and never find out what any of it could have been.',
    areas: ['partner', 'work', 'vision', 'lifestyle'],
    identity: 'I am someone who commits for a stated period and reviews it on the date.',
    identityWhy:
      'The belief treats commitment and imprisonment as the same act. The counterpart separates them by putting a review date on it: a real commitment, entered fully, with a known point at which it is reconsidered — which is what makes going all in survivable.',
    practices: [
      { kind: 'thought', cue: 'What if I want out later', text: 'Then I review it on the date. Until then I am actually in.', cadence: 'when_it_shows_up' },
      { kind: 'behaviour', text: 'Take one thing you are half-in on, commit to it fully for a fixed period, and put the review in the calendar.', cadence: 'weekly' },
      { kind: 'affirmation', text: 'I commit for a stated period and review it on the date.', cadence: 'daily' },
    ],
  },

  /* ---- Money, capability and worth -------------------------------------- */
  {
    id: 'money_is_dirty',
    text: 'Caring about money says something ugly about a person.',
    cost: 'You will not name a price, so you are paid what other people decide to offer.',
    areas: ['money', 'work', 'character', 'spirit'],
    identity: 'I am someone who says his number without softening it.',
    identityWhy:
      'The belief attaches a moral cost to the asking, not to the money, so the fix is not a view about wealth — it is the act of stating a figure and leaving it there. That is where the discomfort actually lives.',
    practices: [
      { kind: 'thought', cue: 'It feels grabby to ask for that', text: 'A number is a fact about the work. Say it and stop explaining it.', cadence: 'when_it_shows_up' },
      { kind: 'behaviour', text: 'State one price or rate this month without a discount, an apology, or a reason attached.', cadence: 'weekly' },
      { kind: 'affirmation', text: 'I say my number without softening it.', cadence: 'daily' },
    ],
  },
  {
    id: 'im_slow',
    text: 'I am not quick, and the people around me can tell.',
    cost: 'You hide the working, so nobody ever sees that you get there.',
    areas: ['mind', 'work', 'social', 'character'],
    identity: 'I am someone who thinks out loud at his own pace in front of people.',
    identityWhy:
      'Quickness is visible and depth is not, so the comparison is rigged before it starts. The counterpart is making your actual process visible rather than presenting only the finished answer — which is both how the work gets better and how the comparison stops being with a performance.',
    practices: [
      { kind: 'thought', cue: 'They will think I am slow', text: 'They will think I am careful, or they will not think about it at all.', cadence: 'when_it_shows_up' },
      { kind: 'behaviour', text: 'Say "let me think about that for a second" out loud once this week instead of filling the silence.', cadence: 'weekly' },
      { kind: 'affirmation', text: 'I think out loud at my own pace in front of people.', cadence: 'daily' },
    ],
  },
  {
    id: 'appearance_is_worth',
    text: 'What I look like is the first thing about me and mostly the main thing.',
    cost: 'A bad day in the mirror decides what you are willing to do that week.',
    areas: ['health', 'emotions', 'social', 'character'],
    identity: 'I am someone who goes anyway on the days he does not like how he looks.',
    identityWhy:
      'Arguing with the belief goes nowhere; what breaks it is the day you went, and it was fine, and it turned out not to be the main thing about you after all. So the counterpart is attendance, not self-image.',
    practices: [
      { kind: 'thought', cue: 'Not today, I look wrong', text: 'Go anyway. Find out how much of the day it actually decides.', cadence: 'when_it_shows_up' },
      { kind: 'behaviour', text: 'Keep one plan this week you would normally cancel on a bad-mirror day.', cadence: 'weekly' },
      { kind: 'affirmation', text: 'I go anyway on the days I do not like how I look.', cadence: 'daily' },
    ],
  },

  /* ---- The people who depend on you, and what it is all for -------------- */
  {
    id: 'failing_them',
    text: 'The people who depend on me are getting a worse version of me than they deserve.',
    cost: 'The guilt eats the time it is supposedly about, and they get less of you, not more.',
    areas: ['family', 'partner', 'character', 'emotions'],
    identity: 'I am someone who gives a real hour rather than a guilty week.',
    identityWhy:
      'Guilt at this size does not convert into presence; it converts into avoidance and then into more guilt. The counterpart is a small, actual, undivided amount of time — which is the only thing the people involved would recognise as the difference.',
    practices: [
      { kind: 'thought', cue: 'I should be doing more for them', text: 'More is not available today. One real hour is. Take the hour.', cadence: 'when_it_shows_up' },
      { kind: 'behaviour', text: 'Give one person one undivided hour this week — phone elsewhere, nothing else running.', cadence: 'weekly' },
      { kind: 'affirmation', text: 'I give a real hour rather than a guilty week.', cadence: 'daily' },
    ],
  },
  {
    id: 'im_too_much',
    text: 'Whole, I am more than most people want to deal with.',
    cost: 'You arrive pre-shrunk, and then the relationship is with the smaller version.',
    areas: ['social', 'partner', 'emotions', 'character'],
    identity: 'I am someone who says the whole sentence and lets it sit there.',
    identityWhy:
      'The belief is enforced by pre-emptive editing, which means it is never tested — the full version has not been in the room to be responded to. The counterpart is letting it be, unedited, and finding out what actually happens.',
    practices: [
      { kind: 'thought', cue: 'That is too much, tone it down', text: 'Say the whole thing once and let the room answer for itself.', cadence: 'when_it_shows_up' },
      { kind: 'behaviour', text: 'Once this week, say the thing at full length — the enthusiasm, the objection, the ask — without trimming it first.', cadence: 'weekly' },
      { kind: 'affirmation', text: 'I say the whole sentence and let it sit there.', cadence: 'daily' },
    ],
  },
  {
    id: 'nothing_matters',
    text: 'None of it really adds up to anything, so the effort is a bit of a performance.',
    cost: 'You start nothing that takes years, which guarantees the thing you suspect.',
    areas: ['vision', 'spirit', 'work', 'emotions'],
    identity: 'I am someone who works on one thing that outlasts the week.',
    identityWhy:
      'Meaning is not concluded and then acted on; it accrues from sustained investment in something particular. The counterpart is therefore not a belief about purpose — it is having one live thing with a horizon longer than a fortnight, which is the condition under which the question can be answered at all.',
    practices: [
      { kind: 'thought', cue: 'What is the point of any of it', text: 'Unanswerable in the abstract. Go and put an hour into the long thing.', cadence: 'when_it_shows_up' },
      { kind: 'behaviour', text: 'Put one hour into the thing with the longest horizon you have, before anything urgent gets it.', cadence: 'weekly' },
      { kind: 'affirmation', text: 'I work on one thing that outlasts the week.', cadence: 'daily' },
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
