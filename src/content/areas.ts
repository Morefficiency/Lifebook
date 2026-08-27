/**
 * The twelve areas, with the prompts that get a usable answer out of someone.
 *
 * Vision prompts are written in the present tense on purpose — describing the
 * life as already true produces far more concrete answers than "what would you
 * like one day", which reliably produces wishes.
 */
import type { LifeArea } from '../types';

export interface AreaDef {
  id: LifeArea;
  name: string;
  /** One word, for the dial — full names collide with each other around a circle. */
  short: string;
  blurb: string;
  visionPrompt: string;
  visionPlaceholder: string;
  currentPrompt: string;
  markerPlaceholder: string;
}

export const AREAS: AreaDef[] = [
  {
    id: 'health', short: 'Body', name: 'Health & Body',
    blurb: 'Energy, fitness, sleep, what your body can do and how it feels to be in it.',
    visionPrompt: 'Describe your body and your energy as you want them — as if it is already true.',
    visionPlaceholder: 'I wake before the alarm. I train four mornings a week and it is not a negotiation…',
    currentPrompt: 'And where is it actually, today?',
    markerPlaceholder: 'Train 4× a week',
  },
  {
    id: 'mind', short: 'Mind', name: 'Mind & Learning',
    blurb: 'What you know, what you are getting better at, how you think.',
    visionPrompt: 'Describe the mind you want to have — what you know, what you are learning.',
    visionPlaceholder: 'I read something hard every week and I can hold my own on it in conversation…',
    currentPrompt: 'And where is it actually, today?',
    markerPlaceholder: 'One difficult book a month',
  },
  {
    id: 'emotions', short: 'Feeling', name: 'Emotional Life',
    blurb: 'How you feel most days, and what you do with what you feel.',
    visionPrompt: 'Describe how you want to feel on an ordinary day, and how you want to handle a hard one.',
    visionPlaceholder: 'I am steady. When something goes wrong I feel it and I do not disappear for three days…',
    currentPrompt: 'And how is it actually, most days?',
    markerPlaceholder: 'Bad news does not cost me a week',
  },
  {
    id: 'character', short: 'Character', name: 'Character',
    blurb: 'Who you are when it costs you something. Integrity, courage, follow-through.',
    visionPrompt: 'Describe the kind of person you want to be when it is expensive to be that person.',
    visionPlaceholder: 'I say the true thing in the room, not in the car afterwards…',
    currentPrompt: 'And who are you actually, when it is expensive?',
    markerPlaceholder: 'I keep the promises I make to myself',
  },
  {
    id: 'spirit', short: 'Spirit', name: 'Spiritual Life',
    blurb: 'Meaning, faith, practice, your relationship with something larger. Or the absence of it, honestly held.',
    visionPrompt: 'Describe what you want your inner life or your sense of meaning to be.',
    visionPlaceholder: 'I have a practice I keep even when nothing is wrong…',
    currentPrompt: 'And where is it actually, today?',
    markerPlaceholder: 'Ten quiet minutes daily',
  },
  {
    id: 'partner', short: 'Love', name: 'Love & Partnership',
    blurb: 'Your relationship, or the one you want. Intimacy, honesty, how you are together.',
    visionPrompt: 'Describe the relationship you want — how you are together on a normal Tuesday.',
    visionPlaceholder: 'We talk about the real thing without a fight first. Two evenings a week are ours…',
    currentPrompt: 'And where is it actually, today?',
    markerPlaceholder: 'Two evenings a week that are only ours',
  },
  {
    id: 'family', short: 'Family', name: 'Family & Parenting',
    blurb: 'Children, parents, siblings — the people you did not choose and keep anyway.',
    visionPrompt: 'Describe how you want to be with your family — present tense.',
    visionPlaceholder: 'My kids get me, not my phone. I call my parents because I want to…',
    currentPrompt: 'And how is it actually, today?',
    markerPlaceholder: 'Phone in a drawer 18:00–20:00',
  },
  {
    id: 'social', short: 'Friends', name: 'Social Life',
    blurb: 'Friendships, community, the people who would notice if you disappeared.',
    visionPrompt: 'Describe the friendships and the circle you want around you.',
    visionPlaceholder: 'Three people I can call at midnight. I host something once a month…',
    currentPrompt: 'And where is it actually, today?',
    markerPlaceholder: 'See friends fortnightly',
  },
  {
    id: 'money', short: 'Money', name: 'Money',
    blurb: 'Income, savings, debt, and the feeling you get when you check the balance.',
    visionPrompt: 'Describe your financial life as you want it — including how it feels.',
    visionPlaceholder: 'A year of runway in the account. I check the balance without bracing…',
    currentPrompt: 'And where is it actually, today?',
    markerPlaceholder: 'Twelve months of runway',
  },
  {
    id: 'work', short: 'Work', name: 'Work & Craft',
    blurb: 'What you do all day, how good you are at it, and whether it is going somewhere.',
    visionPrompt: 'Describe the work you want to be doing and the standard you want to be working at.',
    visionPlaceholder: 'I do the work I would do anyway. My name on it means something…',
    currentPrompt: 'And where is it actually, today?',
    markerPlaceholder: 'Ship something real every month',
  },
  {
    id: 'lifestyle', short: 'Days', name: 'Quality of Life',
    blurb: 'Where you live, how you spend a free Saturday, the texture of ordinary days.',
    visionPrompt: 'Describe an ordinary week in the life you want — where you are, what it looks like.',
    visionPlaceholder: 'Light in the flat. Saturdays are not for catching up on the week…',
    currentPrompt: 'And what does an ordinary week actually look like?',
    markerPlaceholder: 'Weekends genuinely free',
  },
  {
    id: 'vision', short: 'Purpose', name: 'Life Vision',
    blurb: 'The whole thing. What all of the above is in service of.',
    visionPrompt: 'If the other eleven were true, what would your life be for?',
    visionPlaceholder: 'I built something that outlasts me and I was present for the people in it…',
    currentPrompt: 'And what is it in service of right now, honestly?',
    markerPlaceholder: 'Ten years from now, this is what it added up to',
  },
];

export const AREA_BY_ID = new Map(AREAS.map((a) => [a.id, a]));
export const areaName = (id: LifeArea): string => AREA_BY_ID.get(id)?.name ?? id;
export const areaShort = (id: LifeArea): string => AREA_BY_ID.get(id)?.short ?? id;
