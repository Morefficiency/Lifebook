/**
 * §14.4 — every user-facing string in one file, so a future locale is a copy of
 * this file and nothing else.
 *
 * Tone rules that apply to everything below (§13, §15): calm, exact, honest
 * instrument. Never hype, never guru. No diagnosis, no trait names, no clinical
 * verbs, no shame copy for lapses, no urgency.
 */

export const VALUE_CARDS = [
  { id: 'honesty', label: 'Honesty' },
  { id: 'growth', label: 'Growth' },
  { id: 'family', label: 'Family' },
  { id: 'craft', label: 'Craft' },
  { id: 'freedom', label: 'Freedom' },
  { id: 'faith', label: 'Faith' },
  { id: 'generosity', label: 'Generosity' },
  { id: 'health', label: 'Health' },
  { id: 'curiosity', label: 'Curiosity' },
  { id: 'loyalty', label: 'Loyalty' },
  { id: 'courage', label: 'Courage' },
  { id: 'beauty', label: 'Beauty' },
  { id: 'justice', label: 'Justice' },
  { id: 'independence', label: 'Independence' },
  { id: 'humor', label: 'Humour' },
  { id: 'service', label: 'Service' },
] as const;

export const STRIVING_EXAMPLES = [
  'build my business to replace my salary',
  'be more present with my partner',
  'keep training 4×/week',
  'stop letting small admin pile up',
  'say what I actually think in meetings',
  'save enough to stop worrying about money',
] as const;

export const S = {
  app: {
    name: 'Lifebook',
    tagline: 'Vision, mirror, becoming.',
    sentence:
      'Write the life you want. Then list what you are actually trying to do, and rate every pair against every other. Ten minutes later you get a map of where your own goals collide — and the one that sits inside more of those collisions than anything else. Most people have never seen it.',
  },

  nav: {
    life: 'Your life',
    blueprint: 'Blueprint',
    map: 'Map',
    quests: 'Quests',
    ledger: 'Ledger',
    science: 'Why this works',
    support: 'Support',
    settings: 'Settings',
    skip: 'Skip to main content',
  },

  /* The standing view — the screen the app is for. */
  life: {
    title: 'Your life',
    lead: 'Everything you have said about the life you want, where each part of it actually is, and who you would have to be for the rest of it to be ordinary. One page. Nothing here is a score of you.',

    dialTitle: 'All twelve, at once',
    dialCentreNote: 'of what you described',
    living: 'Living it',
    livingNone: 'Not said yet',
    dialLegend: 'Wider means you said it matters more. Longer means you are closer to what you described — the dotted rim is the life you wrote down.',
    dialUnknown: (n: number) =>
      n === 1 ? 'One area is written but not yet placed.' : `${n} areas are written but not yet placed.`,
    dialBlank: (n: number) =>
      n === 1 ? 'One area you have not written yet.' : `${n} areas you have not written yet.`,
    summary: (living: string, described: number) =>
      `A dial of twelve life areas. ${described} of twelve have been described. ${living}. Each area is listed in full below.`,
    attention: (name: string) => `Most of the distance is in ${name}`,

    areasTitle: 'The twelve',
    areasNote: 'In the same order every time, so the shape stays recognisable.',
    at: (score: number) => `${score}/10`,
    matters: (n: number) => `matters ${n}/5`,
    notPlaced: 'You have not said where this one is.',
    mostDistance: 'most of the distance',
    notWritten: 'Not written yet.',
    place: 'Say where it is',
    write: 'Write it',
    revise: 'Revise',
    beliefsHere: (n: number) => (n === 1 ? '1 belief sits here' : `${n} beliefs sit here`),

    selfTitle: 'Who you are becoming',
    selfLead: 'The life above is the outside of this. Each line is a belief you confirmed as yours, and the person you said you would have to be instead.',
    selfCount: (n: number) => (n === 1 ? '1 identity owned' : `${n} identities owned`),
    selfEmptyTitle: 'This half is empty',
    selfEmptyBody: 'The app can work out what you appear to believe about yourself — from the gap above, and from what you say about your own behaviour. It offers guesses; you decide which are yours.',
    selfEmptyCta: 'Start that',
    selfProgramme: 'The programme',
    selfTested: (tested: number, total: number) => `${tested} of ${total} put to the test`,
    selfEvidence: (logged: number, total: number) => `${logged} logged of ${total} practices`,
    selfInstead: 'instead of',
    evidenceBroken: (n: number) => {
      const times = n === 1 ? 'once' : n === 2 ? 'twice' : `${n} times`;
      return `wrong ${times}, when it was sure`;
    },
    evidenceOccurred: (n: number) => (n === 1 ? '1 time it was right' : `${n} times it was right`),
    evidencePending: (n: number) => (n === 1 ? '1 test out' : `${n} tests out`),

    collisionsTitle: 'Where your goals collide',
    collisionsOpen: 'Open the map',
    collisionsNone: 'You have not rated your goals against each other yet.',
    collisionsStart: 'Do that — ten minutes',

    /* The whole page, said once, in a sentence. Only ever assembled from
       clauses that are actually true of this person — a life with nothing
       placed gets the second clause and not the first. */
    readDescribed: (n: number) =>
      n === 12 ? 'You have described all 12 areas' : `You have described ${n} of 12 areas`,
    readLiving: (n: number) => `and you are living ${n}% of what you wrote`,
    readUnplaced: 'and have not yet said where any of it actually is',
    readAttention: (name: string) => `Most of what is left is in ${name}`,
    readIdentities: (n: number) =>
      n === 1 ? 'One identity is in progress' : `${n} identities are in progress`,

    resume: 'Pick up where you left off',
    print: 'Print it',
  },

  /* The return loop. No reminder ever leaves the app; this is what it says
     when somebody comes back of their own accord. See src/engine/waiting.ts
     for why that distinction is the whole design. */
  waiting: {
    label: 'What this page is still holding',
    beliefContradicted: (text: string, broken: number) =>
      broken === 2
        ? `“${text}” has been wrong twice since you last said it was yours, both times when you were sure it would not be.`
        : `“${text}” has been wrong ${broken} times since you last said it was yours, each time when you were sure it would not be.`,
    beliefCta: 'Look at it again',
    testOut: (days: number) =>
      days >= 60
        ? `A test has been out in the world for ${Math.round(days / 30)} months. It only counts once you say what happened.`
        : `A test has been out in the world for ${days} days. It only counts once you say what happened.`,
    testCta: 'Say what happened',
    placementStale: (area: string, days: number) =>
      `You said where ${area} was ${Math.round(days / 30)} months ago. The dial is still drawing that answer.`,
    placementCta: 'Place it again',
    mapStale: (days: number) =>
      `Your map is from ${Math.round(days / 30)} months ago. It was a picture of one day, and that day was a while back.`,
    mapCta: 'Rate them again',
  },

  gate: {
    next25: 'Ten minutes, four steps',
    steps: [
      'Describe the life you want, area by area. You leave this step with a vision board.',
      'List five to seven things you are actually trying to do right now.',
      'Rate every pair: do these two help each other, or fight?',
      'See the map that makes — and the goal every collision runs through.',
    ],
    neverTitle: 'What this will never do',
    never: [
      'No feed. No streaks. Nothing to check daily.',
      'It never tells you what you are — it asks, and you decide.',
      'Nothing is sold, shared or advertised against. Ever.',
    ],
    consentTherapy: 'I understand this is a self-reflection tool, not therapy or medical care.',
    consentLocal: 'I understand my answers are saved to my account so they follow me between devices, and that the people who run this service can read them.',
    codeLabel: 'Access code',
    codePlaceholder: 'Enter your access code',
    codeBad: 'That code was not recognised. Check for stray spaces and try again.',
    purchase: 'Get an access code',
    begin: 'Start with the life you want',
    afterMap: 'There is more after that, for whoever wants it. Nothing pushes you into it.',
    consentRequired: 'Both boxes are required before you can start.',
  },

  values: {
    title: 'Before the mirror',
    lead: 'Before you look in the mirror, remember what you stand for. This isn’t graded — it’s ballast.',
    pick: 'Pick the three that feel most core to you.',
    picked: (n: number) => `${n} of 3 chosen`,
    reflectionLabel: 'Write one or two sentences about a moment when one of these guided a real decision.',
    reflectionPlaceholder: 'A time it actually cost me something, or changed what I did…',
    reflectionHint: 'Nobody reads this but you. It is not scored.',
    next: 'Continue',
  },

  strivings: {
    title: 'What you are trying to do',
    lead: 'List the things you are typically trying to do in your life right now. Not New-Year wishes — the actual ongoing efforts.',
    prefix: 'I typically try to',
    placeholder: '…',
    examplesLabel: 'Examples — tap to start from one, then rewrite it in your own words',
    add: 'Add striving',
    areaLabel: 'Life area (optional)',
    areaNone: 'No tag',
    count: (n: number, min: number, max: number) => `${n} listed — ${min} minimum, ${max} maximum`,
    tooFew: (n: number, min: number) => `Add ${min - n} more before continuing.`,
    atMax: 'That is the maximum. Twelve strivings already means sixty-six pairs to rate.',
    remove: 'Remove',
    next: 'Rate the pairs',
    whyMax:
      'The cap is about the rating burden, not about ambition: every striving you add multiplies the number of pairs you have to judge.',
  },

  duels: {
    title: 'Pair by pair',
    question: 'Overall, do these two help or hurt each other?',
    progress: (i: number, n: number) => `Pair ${i} of ${n}`,
    options: [
      { effect: -2, label: 'Strongly conflict', glyph: '⚔️', key: '1' },
      { effect: -1, label: 'Conflict', glyph: '', key: '2' },
      { effect: 0, label: 'No effect', glyph: '', key: '3' },
      { effect: 1, label: 'Help', glyph: '', key: '4' },
      { effect: 2, label: 'Strongly help', glyph: '🤝', key: '5' },
    ],
    keyboardHint: 'Keys 1–5, or click. There is no clock.',
    back: 'Back',
    changed: 'Changed your mind? Go back — nothing is locked in.',
  },

  heat: {
    title: 'How much does it actually bother you?',
    question: 'When both of these are live in your life, how uncomfortable does the clash actually feel?',
    low: 'Barely notice it',
    high: 'It eats at me',
    progress: (i: number, n: number) => `Clash ${i} of ${n}`,
    note: 'Asked only about the pairs you rated as conflicting.',
    next: 'Continue',
  },

  mirror: {
    title: 'The Mirror',
    legendTitle: 'How to read it',
    legend: [
      'Red line: these two work against each other. Thicker means a stronger effect, brighter means the clash bothers you more.',
      'Green line: these two feed each other. Thicker means a stronger effect.',
      'Amber line: a conflict you have decided to carry on purpose.',
      'Bigger circle: this striving sits inside more of your conflict load.',
      'Position means nothing. Where a circle sits is chosen by a layout algorithm and would come out differently next time.',
    ],
    toReport: 'Read what this says',
    skipAnimation: 'Skip the reveal',
  },

  report: {
    title: 'What your ratings say',
    chooseFaultLine: 'Choose your first fault line',
    preselected: 'Pre-selected: the fault line your ratings weight most heavily. You can pick any other red line instead.',
    weightNote: 'Ordered by weight, which combines how strong you rated the clash with how much it bothers you — so a strong clash you barely notice can outrank a mild one that stings.',
    noFaultLines: 'There is no red line to choose. You can go back and revise your ratings, or carry on and add a quest of your own.',
    regenerate: 'Recalculated from your current ratings',
  },

  fork: {
    title: 'The Fork',
    lead: 'Three doors. None of them is the coward’s door.',
    challenge: {
      name: 'Challenge it',
      blurb: 'Treat the belief inside this conflict as a hypothesis and design a test.',
      nudge: 'Write the belief as a falsifiable sentence about the world, not about your worth.',
      cta: 'Design the test',
    },
    release: {
      name: 'Release it',
      blurb: 'Maybe one of these goals isn’t yours anymore — inherited, expired, or borrowed. Revising or retiring it is a win.',
      cta: 'Release or revise',
      pick: 'Which of the two are you letting go of, or rewriting?',
      retire: 'Retire it',
      revise: 'Rewrite it',
      reviseLabel: 'The version that is actually yours',
      celebrate: 'Released.',
      celebrateBody:
        'A goal you no longer hold cannot pull against anything. The fault line is gone from your map because you decided it, not because you outlasted it.',
      ledgerNote: 'Kept in the ledger, with your reasoning, exactly as you wrote it.',
    },
    carry: {
      name: 'Carry it',
      blurb: 'Some tensions are the price of a life you’ve chosen. Name it, and it stops draining you in the dark.',
      cta: 'Carry it consciously',
      body:
        'Zero conflict is not the goal, and a map with no tension in it usually means someone stopped wanting things. A mature system holds chosen tension. Naming which tension you are holding is what separates it from drift.',
      celebrate: 'Held, not hidden.',
    },
    noteLabel: 'Why. In your own words.',
    notePlaceholder: 'What makes this the right call right now…',
    noteHint: (min: number) => `At least ${min} characters. The writing is the point — this is the part that does the work, not the button.`,
    noteShort: (min: number) => `A little more — ${min} characters minimum.`,
  },

  forge: {
    testingBelief: 'Testing',
    testingHow:
      'A belief is not moved by doing the behaviour — it is moved by it saying in advance what will go wrong, and then being wrong. So say what you are afraid will happen, and how likely you think it is, before you do it.',
    title: 'Quest Forge',
    lead: 'One small experiment, in the real world, with a prediction attached.',
    wish: 'Wish',
    wishHint: 'One line. What do you want here?',
    outcome: 'Best outcome',
    outcomeHint: 'One line, vivid. What does it look like if this goes well?',
    obstacle: 'Obstacle',
    obstacleHint:
      'The inner obstacle — the thing in you that gets in the way. Required. Imagining only the good outcome measurably lowers follow-through; naming the obstacle is what makes this work.',
    obstacleRequired: 'The obstacle is required. This form does not submit without it.',
    belief: 'The belief I am testing',
    beliefHint: 'A falsifiable sentence about the world, not about your worth.',
    beliefRequired: 'A challenge quest needs the belief written down. Otherwise there is nothing for the evidence to land on.',
    stepsTitle: 'Plan',
    stepsHint: 'One to seven steps. Each one is a cue and an action, so it fires without a decision.',
    ifCue: 'If / When',
    thenAction: 'then I will',
    ifPlaceholder: 'it is 09:00 on Tuesday',
    thenPlaceholder: 'send the first outreach message',
    addStep: 'Add step',
    removeStep: 'Remove step',
    stepsRequired: 'At least one complete step is required.',
    forecastTitle: 'Before you go',
    forecastLead: 'You’re not committing to succeed. You’re committing to find out.',
    fearedOutcome: 'What exactly does the fear predict will happen?',
    fearedOutcomeHint: 'Must be observable — something another person could agree happened or didn’t.',
    fearedOutcomeRequired: 'Write the feared outcome as something observable, not as a feeling.',
    forecastP: 'How likely is that, honestly?',
    forecastPHint: 'Your own probability that the feared outcome happens.',
    fearRating: 'How much do you dread doing this?',
    fearLow: 'Not at all',
    fearHigh: 'A lot',
    create: 'Activate quest',
  },

  quest: {
    active: 'Active',
    reported: 'Reported',
    abandoned: 'Shelved',
    stepsDone: (a: number, b: number) => `${a} of ${b} steps`,
    forecastLine: (p: number) => `You put the feared outcome at ${p}%.`,
    fearLine: (f: number) => `Dread ${f}/10.`,
    fileReport: 'File the field report',
    abandon: 'Shelve this quest',
    abandonBody: 'Shelved. The ledger keeps what you learned.',
    abandonConfirm: 'Shelve it',
    noSteps: 'No steps yet.',
    empty: 'No active quests. Quests come from fault lines on the map.',
    fromEdge: 'From the fault line',
    freeQuest: 'Not tied to a fault line',
    newQuest: 'New quest',
  },

  reportForm: {
    title: 'Field report',
    q1: 'Did the feared outcome happen?',
    yes: 'Yes, it happened',
    no: 'No, it didn’t',
    fearedWas: 'You predicted:',
    whatHappened: 'What happened?',
    whatHappenedHint: (min: number) => `At least ${min} characters. Plain description, not a verdict on yourself.`,
    learning: 'What did this cost, and what did it teach?',
    learningHint: 'Information is XP here. A feared outcome that actually happened is the most informative result you can get.',
    learningRequired: 'Required when the feared outcome happened.',
    submit: 'File it',
    luckNote:
      'The ledger records what you did and what happened as two separate things. Luck exists, in both directions.',
  },

  broken: {
    title: 'PREDICTION BROKEN',
    lead: 'You said it was likely. It didn’t happen.',
    reality: 'It did not happen',
    beliefWas: 'The belief you were testing',
    cooled: 'That fault line just cooled by one step on your map.',
    rerate: 'Two broken predictions on this fault line. Worth re-rating that pair?',
    rerateCta: 'Re-rate the pair',
    xp: '+50 XP',
    xpWhy: 'The largest single payout in this app. Not for effort — for a belief that met the world and lost.',
    close: 'Back to the map',
  },

  map: {
    title: 'Your map',
    activeQuests: 'Active quests',
    conflictIndex: 'Conflict index',
    coherence: 'Coherence',
    xp: 'XP',
    openFork: 'Open the Fork',
    deselect: 'Clear selection',
    tapHint: 'Tap any line to select it. Tap any number to see exactly how it is computed.',
    reduced: 'Reduced motion is on, so the map is drawn instantly.',
  },

  ledger: {
    title: 'Ledger',
    lead: 'Append-only. Entries are never edited or deleted — you can add a note to any of them.',
    empty: 'The ledger fills with evidence, not intentions.',
    filter: 'Filter',
    annotate: 'Add annotation',
    annotatePlaceholder: 'A note from later…',
    annotateSave: 'Save note',
    annotationOn: 'Note added later',
  },

  stats: {
    title: 'Stats',
    calibration: 'Calibration',
    calibrationDef:
      'How close your probability forecasts have been to what actually happened, scored with a Brier score. 100 is perfect, 50 is what you get from guessing 50% every time.',
    calibrationThin: (n: number) => `Needs at least 3 reports. You have ${n}.`,
    courage: 'Courage',
    courageDef:
      'The number of quests you rated 7 or higher for dread and then took at least one step on. It counts the attempt. Whether it worked is a separate question, on purpose.',
    coherence: 'Coherence',
    coherenceDef:
      'How much of the conflict load your map started with is no longer pulling on you. Released goals and consciously carried tensions count as zero. It is a description of your own ratings, not a validated scale.',
    coherenceNoBaseline: 'Set once the Mirror is complete.',
    xp: 'XP',
    xpDef: 'Paid for evidence, never for effort or for showing up. Nothing spends it, nothing expires, and it never falls just because time passed. It is a running description of what is on your record, so correcting the record — un-ticking a step you ticked by mistake — moves it too.',
    level: 'Level',
    badges: 'Badges',
    badgesDef: 'Certificates that a specific thing happened. Nothing more.',
    breakdown: 'Where the XP came from',
    none: '—',
  },

  explain: {
    open: 'How is this computed?',
    close: 'Close',
    title: 'How this number is computed',
  },

  settings: {
    title: 'Settings',
    dataTitle: 'Your data',
    dataBody:
      'Your answers are kept in this browser and, when you are signed in, in your account so they follow you between devices. They are encrypted in transit and at rest, and the database is set up so that no other account can read your row. They are not encrypted from us: the people who run this service can read what you write. Nothing is sold, shared, advertised against, or used to train anything.',
    dataBodyLocal:
      'You are not signed in, so everything is in this browser and nowhere else. Clearing your browser data deletes it, and nobody — including us — has a copy.',
    exportTitle: 'Export',
    exportBody: 'One JSON file with everything: strivings, ratings, forks, quests, reports and the full ledger.',
    exportCta: 'Export JSON',
    importTitle: 'Import',
    importBody: 'Replaces everything currently in this browser. You will be asked to confirm.',
    importCta: 'Choose a file',
    importConfirm: 'This replaces all current data in this browser. Continue?',
    importBadSchema: 'That file is not a Coherence export, or its schema version is not supported.',
    importOk: 'Imported.',
    deleteTitle: 'Delete everything',
    deleteBody:
      'Wipes the database and the access flag. There is no undo and no backup anywhere. Export first if you want a copy.',
    deleteConfirmLabel: 'Type DELETE to confirm',
    deleteCta: 'Delete everything',
    deleted: 'Deleted. Nothing of yours remains in this browser.',
    motionTitle: 'Motion',
    motionBody: 'This app follows your system “reduce motion” setting. The map reveal is the only long animation, and it renders instantly when reduced motion is on.',
    reset: 'Start the Mirror again',
    resetBody: 'Keeps your ledger and quests, and takes you back through the rating flow so you can remap.',
  },

  support: {
    title: 'Support',
    body: [
      'Lifebook is a self-reflection tool. It is not therapy, it is not diagnosis, and it is not crisis support. It cannot see you and it does not know anything about you beyond what you typed into it.',
      'If this work stirs up more than you expected, or things feel heavy, that is a signal to talk to a human professional — not to push harder. Nothing here rewards pushing through.',
      'Every exercise in this app can be skipped, at any point, without consequence. There is no progress to lose.',
    ],
    helplineTitle: 'Talking to a person',
    helplineLink: 'findahelpline.com',
    helplineUrl: 'https://findahelpline.com',
    helplineBlurb: 'Free, confidential support worldwide.',
    emergency:
      'If you are in immediate danger, contact your local emergency services.',
    externalNote: 'That link opens an external website in a new tab. It carries nothing about you, and the site it opens is not told that you came from here.',
  },

  science: {
    title: 'Why this works',
    lead: 'Every mechanic in this app traces to a specific finding. Nothing in our copy claims anything that is not on this page.',
    leftOutTitle: 'What we deliberately left out, and why',
    caveatTitle: 'Honest limits',

    items: [
      {
        mechanic: 'Writing the life you want before auditing the life you have',
        body: 'A representation of who you might become — a "possible self" — carries motivational force that an abstract goal does not, and works best when it is specific and vivid enough to picture. Putting it first is also a practical decision: someone who stops after one stage should leave with the picture, not with the audit.',
        cite: 'Markus, H., & Nurius, P. (1986). Possible selves. American Psychologist, 41(9), 954–969.',
      },
      {
        mechanic: 'Measuring the distance between the two',
        body: 'The gap between how you see yourself now and how you want to be is not just a motivational fact — the size and kind of that gap is associated with distinct emotional consequences. Making it explicit and weighting it by what you said matters is what stops the work going into an area you were never really bothered about.',
        cite: 'Higgins, E. T. (1987). Self-discrepancy: A theory relating self and affect. Psychological Review, 94(3), 319–340.',
      },
      {
        mechanic: 'Asking what you do, not what you believe',
        body: 'A self-image is a structured set of beliefs that shapes what you notice and how you read your own behaviour — and it is largely invisible from inside, which is exactly why it is not asked about directly. The reflection stage asks about conduct, history and environment, and the joining-up is offered back as a question.',
        cite: 'Markus, H. (1977). Self-schemata and processing information about the self. Journal of Personality and Social Psychology, 35(2), 63–78.',
      },
      {
        mechanic: 'Changing behaviour to change the belief, rather than the reverse',
        body: 'People read their own attitudes off their own behaviour, particularly where the internal evidence is weak or ambiguous — which is the case for most beliefs about oneself. That is why the programme is built around actions that only the new identity would take: the action is the evidence, and the belief follows it.',
        cite: 'Bem, D. J. (1972). Self-perception theory. Advances in Experimental Social Psychology, 6, 1–62.',
      },
      {
        mechanic: 'Identity stated as conduct, not as a trait',
        body: 'What a person does is shaped by which identity is salient at that moment and whether the action feels congruent with it. An identity phrased as something you do can be acted on today; a trait claim cannot be acted on at all, only asserted.',
        cite: 'Oyserman, D., & Destin, M. (2010). Identity-based motivation: Implications for intervention. The Counseling Psychologist, 38(7), 1001–1043.',
      },
      {
        mechanic: 'Affirmations that require an instance',
        body: 'Repeating a favourable self-statement has been found to leave people who do not already believe it feeling worse, not better — the statement falls outside what they can accept and the contrast is what registers. This app never asks for a bare repetition: every affirmation is logged alongside a concrete thing that happened that day, which makes it a label for an event rather than a claim about a person.',
        cite: 'Wood, J. V., Perunovic, W. Q. E., & Lee, J. W. (2009). Positive self-statements: Power for some, peril for others. Psychological Science, 20(7), 860–866.',
      },
      {
        mechanic: 'Catching a thought and swapping it',
        body: 'Reinterpreting a situation as it arises is one of the more effective ways of changing what it does to you, and it works better before the reaction has fully run than after. The thought swaps in the programme are written as a cue and a replacement for that reason.',
        cite: 'Gross, J. J. (2015). Emotion regulation: Current status and future prospects. Psychological Inquiry, 26(1), 1–26.',
      },
      {
        mechanic: 'Listing strivings, then rating every pair',
        body: 'Personal strivings — the things a person is typically trying to do — can be laid out as a matrix in which each striving is rated against every other for whether it helps or hinders. Higher conflict in that matrix has been associated with more rumination about goals and less action on them. The matrix in this app is the same instrument, shortened.',
        cite: 'Emmons, R. A., & King, L. A. (1988). Conflict among personal strivings. Journal of Personality and Social Psychology, 54(6), 1040–1048.',
      },
      {
        mechanic: 'Choosing three values before you see the map',
        body: 'Reflecting on a value you hold before receiving information that threatens your self-image makes people less defensive about that information and more able to use it. That is why the values step runs first and is never scored — it exists to make the map easier to look at honestly.',
        cite: 'Steele, C. M. (1988). The psychology of self-affirmation. Advances in Experimental Social Psychology, 21, 261–302.',
      },
      {
        mechanic: 'Rating how much a clash bothers you',
        body: 'Holding two things that pull against each other produces measurable discomfort, and that discomfort is what tends to drive change. It can be asked about directly. This app uses a single-item version of the standard discomfort measure; the full multi-item version is more reliable and is a later addition.',
        cite: 'Festinger, L. (1957). A Theory of Cognitive Dissonance. · Elliot, A. J., & Devine, P. G. (1994). On the motivational nature of cognitive dissonance. JPSP, 67(3), 382–394.',
      },
      {
        mechanic: 'The mandatory Obstacle field',
        body: 'Imagining a wished-for outcome and then contrasting it with the concrete inner obstacle in the way produces more follow-through than imagining the outcome alone. Positive visualisation on its own does worse than doing nothing in several studies. This is why the form will not submit without the obstacle.',
        cite: 'Oettingen, G. (2014). Rethinking Positive Thinking: Inside the New Science of Motivation.',
      },
      {
        mechanic: 'Steps written as "If/When X, then I will Y"',
        body: 'Plans that specify a cue and a response are acted on substantially more often than plans that state only an intention. The gain comes from the specificity of the cue, so the step boxes force both halves.',
        cite: 'Gollwitzer, P. M. (1999). Implementation intentions: Strong effects of simple plans. American Psychologist, 54(7), 493–503.',
      },
      {
        mechanic: 'Forecasting the feared outcome, then checking it',
        body: 'What appears to change a fear-driven belief is not relaxation or repetition but the mismatch between what you expected and what happened. The larger and clearer the mismatch, the more the belief moves. Everything about the forecast slider exists to make that mismatch measurable, which is why a broken prediction is the largest single event in this app.',
        cite: 'Craske, M. G., Treanor, M., Conway, C. C., Zbozinek, T., & Vervliet, B. (2014). Maximizing exposure therapy: An inhibitory learning approach. Behaviour Research and Therapy, 58, 10–23.',
      },
      {
        mechanic: 'No streaks, no cash, no leaderboards',
        body: 'Tangible rewards offered for doing a task reliably reduce the interest people have in the task once the reward stops. Streaks, quotas and points that buy something outside the app all create a reason to report what keeps the reward coming rather than what actually happened. XP here is a record, not a currency: nothing spends it and nothing takes it away.',
        cite: 'Deci, E. L., Koestner, R., & Ryan, R. M. (1999). A meta-analytic review of experiments examining the effects of extrinsic rewards on intrinsic motivation. Psychological Bulletin, 125(6), 627–668.',
      },
      {
        mechanic: 'Scoring forecasts with a Brier score',
        body: 'A probability forecast can be scored against what happened by taking the squared difference between the two and averaging over forecasts. It rewards being right and being honest about uncertainty at the same time, which is exactly what this app wants to measure.',
        cite: 'Brier, G. W. (1950). Verification of forecasts expressed in terms of probability. Monthly Weather Review, 78(1), 1–3.',
      },
    ],

    leftOut: [
      {
        thing: 'Telling you what you believe',
        why: 'The app scores candidate beliefs against your own answers and offers the top few as questions. Nothing is held as yours until you confirm it, rejecting is an equal answer, and every candidate shows exactly which of your answers put it on the list. It is a weighted match, not a finding.',
      },
      {
        thing: 'Personality types, profiles or diagnoses',
        why: 'No type, no category, no condition, no score about the kind of person you are. Everything the app says describes answers you gave, on the day you gave them.',
      },
      {
        thing: 'An AI reading your life and writing your beliefs back to you',
        why: 'The whole inference is a deterministic rule engine. It runs offline, it produces the same result for the same answers every time, it can show its working line by line, and it cannot invent a belief that is not in a fixed, readable catalogue. A model can do none of those things.',
      },
      {
        thing: 'Trait affirmations ("I am confident", "I am enough")',
        why: 'The values step affirms something you did, not something you are. Repeating a positive self-statement you do not believe has been found to leave people with low self-esteem feeling worse, and this app never asks you to assert a trait about yourself.',
      },
      {
        thing: 'Behaviour surveillance',
        why: 'Nothing is tracked in the background, nothing is inferred from how you use the app, and no belief is ever attributed to you that you did not type. You are the only source of truth about you.',
      },
      {
        thing: 'Engagement mechanics',
        why: 'No streaks, no daily goals, no notifications, no time pressure, no randomised rewards. Each of those would give you a reason to misreport, and a measurement you cannot trust is worse than no measurement.',
      },
      {
        thing: 'Any AI or server call',
        why: 'The insight report is a fixed template filled in with your own numbers. It says the same words for the same ratings every time, it cannot invent a claim about you, and it works with the network turned off.',
      },
      {
        thing: 'Reading outcomes backwards into character',
        why: 'The ledger records what you did and what happened as two separate facts. A quest that went badly still counts as courage; a quest that went well on a forecast you never believed pays nothing. Luck exists, in both directions.',
      },
    ],

    caveats: [
      'The belief catalogue is a fixed list of common patterns, not a taxonomy of every way a person can get in their own way. If yours is not in it, write it — the app will take your sentence over its own.',
      'The candidate scoring is a weighted match on your answers. It has no validation, no norms, and no evidence behind the specific weights beyond the reasoning above. Treat the order it produces as a starting point for a conversation with yourself, not as a measurement.',
      'A self-image cannot be measured directly. Everything on these screens is a description of what you typed.',
      'Pair ratings here are symmetric — one number for "how do these two affect each other". The original method rates each direction separately. This halves the number of judgements and loses some information.',
      'The discomfort question is a single item, not the validated multi-item index.',
      'Coherence % is a descriptive index of your own ratings on two occasions. It is not a validated scale, it has no norms, and it cannot be compared with anyone else.',
      'Everything in this app describes what you entered. None of it measures a trait, and none of it is a clinical assessment of any kind.',
    ],
  },

  /* ------------------------------------------------------------------ *
   * Copy consumed by src/engine and src/data. It lives here rather than
   * next to the logic so this file really is the whole locale (§14.4).
   * ------------------------------------------------------------------ */

  levels: [
    { name: 'Surveyor', meaning: 'You are taking the measurements. Nothing has been tested yet.' },
    { name: 'Cartographer', meaning: 'You have written down what you want and what is in the way, and you have started acting on it.' },
    { name: 'Field Scientist', meaning: 'You are running experiments in the real world and filing what happened.' },
    { name: 'Experimenter', meaning: 'You have enough on the record that patterns in your own behaviour are visible.' },
    { name: 'Calibrated', meaning: 'What you predict about yourself now has a track record you can check it against.' },
    { name: 'Cartographer of the Deep', meaning: 'You have mapped, tested and revised the same territory more than once.' },
  ],

  badges: {
    first_vision: { name: 'First Vision', description: 'You wrote what you actually want in at least three areas of your life.' },
    named_it: { name: 'Named It', description: 'You looked at a belief about yourself and said out loud that it was yours.' },
    first_instance: { name: 'First Instance', description: 'You logged something you actually did, with the evidence attached.' },
    ten_instances: { name: 'Ten Instances', description: 'Ten logged instances on the record. That is a track record, not an intention.' },
    first_light: { name: 'First Light', description: 'You rated every pair and looked at the result.' },
    first_contact: { name: 'First Contact', description: 'You filed your first field report from the real world.' },
    prediction_broken: { name: 'Prediction Broken', description: 'You forecast the feared outcome at 60% or more and it did not happen.' },
    serial_falsifier: { name: 'Serial Falsifier', description: 'Ten broken predictions on the record.' },
    resistance_was_right: { name: 'The Resistance Was Right', description: 'You released a goal that was no longer yours. That is a result, not a retreat.' },
    held_not_hidden: { name: 'Held, Not Hidden', description: 'You named a tension you are choosing to carry instead of pretending it is gone.' },
    cold_reader: { name: 'Cold Reader', description: 'Calibration of 85 or better across at least ten reports.' },
    deep_breath: { name: 'Deep Breath', description: 'You attempted a quest you had rated 9 or 10 for dread.' },
  },

  xpLines: {
    lifebook_stage: {
      label: 'Lifebook stages completed',
      explain: 'Paid once per stage, for finishing a piece of the work rather than for opening it.',
    },
    belief_owned: {
      label: 'Beliefs you took ownership of',
      explain: 'Paid when you look at a sentence about yourself and say it is yours — whether it was offered to you or you wrote it. Saying no pays nothing, because a rejection is not a decision about you, it is a decision about a guess.',
    },
    identity_set: {
      label: 'Identities settled',
      explain: 'Paid once per identity, when you settle on the wording of who you would have to be instead.',
    },
    practice_logged: {
      label: 'Instances logged',
      explain: 'Paid per instance of a practice you actually did, with the concrete evidence written down. This is the main earner in the Lifebook journey, because it is the only part of it that happened in the real world.',
    },
    mirror_completed: {
      label: 'Mirror completed',
      explain: 'Paid once, for rating every pair honestly enough to produce a map.',
    },
    fork: {
      label: 'Fork decisions with a written note',
      explain: 'Paid per fault line you took a decision on and wrote at least 20 characters about. The articulation is the intervention, so an unwritten decision pays nothing.',
    },
    step_done: {
      label: 'Steps completed',
      explain: 'Paid per implementation-intention step you marked done. Small on purpose: effort is not evidence.',
    },
    field_report: {
      label: 'Field reports filed',
      explain: 'Paid per report, whichever way the outcome went. Filing the result is the behaviour being paid for.',
    },
    epistemic_bonus: {
      label: 'Feared outcome happened, and you wrote what it taught',
      explain: 'Paid when the thing you feared actually occurred and you logged the learning. Information about the world is worth more than a comfortable result.',
    },
    prediction_broken: {
      label: 'PREDICTION BROKEN',
      explain: 'Paid when you forecast the feared outcome at 60% or more and it did not happen. This is the largest single event in the app, because a disconfirmed prediction is the only thing here that reliably moves a belief.',
    },
    pair_rerating: {
      label: 'Pairs re-rated after evidence',
      explain: 'Paid when you go back and change a pair rating because something you did in the real world told you it was wrong.',
    },
  },

  ledgerKinds: {
    mirror_completed: 'Mirror completed',
    fork: 'Fork decision',
    quest_created: 'Quest created',
    step_done: 'Step completed',
    field_report: 'Field report',
    prediction_broken: 'Prediction broken',
    release_victory: 'Release',
    carry_marked: 'Carried',
    reassessment: 'Reassessment',
    annotation: 'Annotation',
    quest_abandoned: 'Quest shelved',
    level_up: 'Level',
    badge_earned: 'Badge',
    lifebook_stage: 'Stage completed',
    belief_owned: 'Belief owned',
    identity_set: 'Identity set',
    practice_logged: 'Instance logged',
    lifebook_reset: 'Lifebook reopened',
  },

  ledgerFilters: {
    all: 'Everything',
    lifebook: 'Lifebook',
    evidence: 'Evidence',
    decisions: 'Decisions',
    action: 'Action',
    milestones: 'Milestones',
    annotation: 'Annotations',
  },

  insight: {
    honesty:
      'This map is made entirely of your own answers on one day. It is a mirror, not a verdict — mirrors update. Nothing here measures your worth, your personality, or your future.',
    positionDisclaimer:
      'Where a striving sits on the map means nothing. Only edge colour, edge thickness, edge glow and node size carry information — the positions come from a layout algorithm and would land somewhere else on a second run.',
    headlineTitle: 'What you put in',
    headlineCounts: (strivings: string, help: string, faults: string) =>
      `You listed ${strivings}. Rating every pair against every other pair produced ${help} and ${faults}.`,
    headlineIndex: (pct: number) =>
      `Weighted by how strong each link is and how much the clashes bother you, ${pct}% of the total force in this map is pulling against itself. That figure is a share, not a grade: there is no correct number for it.`,
    noFaultLines:
      'You rated no fault lines at all. Nothing in this map is currently pulling against anything else, so there is no conflict to design an experiment around yet. If that reads as wrong to you, the ratings are the thing to revisit — not the map.',
    loadBearingTitle: 'The load-bearing striving',
    loadBearing: (name: string) =>
      `Your ratings put ${name} inside more of your conflicts than anything else. This doesn’t mean ${name} is wrong — it means every fault line runs through it, so any experiment here pays double.`,
    loadBearingDegree: (on: string, total: number) => `It sits on ${on} out of ${total}.`,
    hottestTitle: 'The hottest fault line',
    hottestPair: (a: string, b: string) => `${a} against ${b}.`,
    hottestHeat: (heat: number) =>
      `You rated the discomfort of that clash at ${heat} out of 10. It is the loudest one on the map, which makes it the cheapest place to learn something — not the most urgent thing to fix.`,
    clusterTitle: 'Your existing engine',
    clusterShort: (names: string) => `${names} already feed each other in your ratings.`,
    clusterMany: (n: number) => `${n} of your strivings already feed each other in your ratings.`,
    clusterBody:
      'This part of the map is doing work for you without being asked. It is worth knowing what is already running before you go looking for what to change.',
    positionsTitle: 'How to read the picture',
    honestyTitle: 'What this is not',
  },

  /** Labels that only assistive technology reads. Copy all the same (§14.4). */
  /** The six Lifebook stages. */
  stages: {
    vision: {
      title: 'The life you want',
      lead: 'Write it in the present tense, as if it is already true — that produces something concrete, where “one day I’d like to” produces a wish. Do the areas you have an opinion about and leave the rest. Three is enough to carry on with.',
      tally: 'areas written',
      matters: 'How much does this one matter to you?',
      mattersHint: 'This decides what the app treats as urgent later. A big gap in something you rated a 1 is not a problem to solve.',
      mattersScale: '1 = barely · 5 = this is the point',
      picture: 'A picture, if you have one',
      pictureHint: 'Optional. It is resized and stored in this browser — it is not uploaded anywhere.',
      pictureChoose: 'Choose an image',
      pictureReplace: 'Replace image',
      pictureRemove: 'Remove',
      markers: 'How would you know it was true?',
      markersHint: 'Up to five concrete markers. Optional, but they make it real.',
      markerAdd: 'Add',
      markerRemove: 'Remove',
      clear: 'Clear this area',
      cta: 'See your vision board',
      more: (n: number) => `${n} more area${n === 1 ? '' : 's'} to go.`,
      skip: 'Skip ahead',
    },
    board: {
      title: 'Your vision board',
      lead: 'Your own words, in your own order — the biggest ones are the ones you said matter most. Come back to it whenever you like; it is the fixed point the rest of the app measures against.',
      empty: 'Nothing written yet.',
      emptyCta: 'Start with the life you want',
      addPicture: 'Add a picture for this one',
      toWrite: (n: number) => `${n} more area${n === 1 ? '' : 's'} to write`,
      next: 'Now the ten-minute part',
      keepWriting: 'Keep writing',
      matters: (n: number) => `Matters ${n} out of 5`,
    },
    goals: {
      title: 'What you are actually doing',
      lead: 'Not what you want — you have just written that. This is the list of efforts already running in your life, the things you are genuinely spending days on. Five to seven of them.',
      youWant: 'What you said you want',
      nudge: 'Look at that, then write what you are actually trying to do. Where the two lists do not match is often the answer on its own.',
      placeholder: '…build my business to replace my salary',
      examplesLabel: 'Tap to add — then rewrite it in your own words',
      tally: 'listed',
      atMax: 'That is enough. More than seven and the next step stops being ten minutes.',
      needMore: (n: number) => `${n} more to go.`,
      pairCount: (n: number) => `${n} pairs to rate — about ninety seconds.`,
      cta: 'Rate how they interact',
    },
    pairs: {
      title: 'Where they collide',
      lead: 'One pair at a time. There is no right answer and no clock — the only thing that matters is that it is true for you.',
    },
    friction: {
      title: 'How much it costs you',
      lead: 'Only the pairs you said conflict. Strength of clash and how much it bothers you are different facts, and the map needs both.',
      last: 'Show me the map',
    },
    mirror: {
      title: 'Your map',
      headline: 'What your ratings add up to',
      loadBearing: (name: string) => `Everything runs through “${name}”.`,
      loadBearingWhy: (degree: number, total: number) =>
        `It sits on ${degree} of your ${total} collisions — more than anything else you listed. That does not make it wrong, or something to drop. It means any change you make here moves more than a change made anywhere else.`,
      noConflict: 'Nothing on your map is fighting anything else.',
      noConflictBody: 'That is a real result, and an unusual one. If it reads as wrong to you, the ratings are the thing to look at again rather than the map — go back and be harder on the pairs you rushed.',
      faultNote: 'pairs pulling against each other',
      helpNote: 'pairs feeding each other',
      indexNote: 'of the force in this map is working against itself',
      hottest: 'The one that costs most',
      whatNow: 'What now?',
      doorTest: 'Test the sharpest one',
      doorTestBody: 'Turn the collision that costs you most into one small experiment in the real world, with a prediction attached. Fifteen minutes.',
      doorWhy: 'Ask why it is that shape',
      doorWhyBody: 'The longer path: where each area actually is, what you appear to believe about yourself, and who you would have to be instead.',
      keepMap: 'Just keep the map',
      noRush: 'Nothing expires. Come back whenever.',
      honesty: 'This map is made entirely of your own answers on one day. It is a mirror, not a verdict — mirrors update. Nothing here measures your worth, your personality, or your future.',
    },
    current: {
      title: 'The life you have',
      lead: 'Against what you just wrote, not against anyone else, and not against where you think you ought to be.',
      tally: 'areas rated',
      youWrote: 'You wrote',
      low: 'Nowhere near it',
      high: 'Already living it',
      describe: 'What is actually going on here, in a sentence or two?',
      describeHint: 'Plainly. Not a verdict on yourself — just what is true.',
      next: 'Next area',
      done: 'Done — what shapes this?',
      needVision: 'Write a vision for at least one area first.',
      distanceLeft: (n: number) => `${n}% of the distance left`,
      distanceHow: 'For each area: how far it is from your vision, multiplied by how much you said it matters. Added up across every area you have rated, then divided by the total importance.',
      distanceCaveat: 'It is a description of your own two sets of answers, nothing more.',
    },
    reflect: {
      title: 'How you actually operate',
      lead: 'None of this asks what you believe — you cannot see that from inside, which is rather the point. It asks what you do, what got rewarded when you were young, and what the people around you expect. Skip anything that does not have a true answer.',
      tally: 'answered',
      multi: 'Choose as many as are true.',
      enoughTitle: 'That is enough for a first read',
    enoughBody:
      'You have answered the questions that between them touch nearly everything the app knows how to look for. More would sharpen it rather than change it — so it is your call, not a step.',
    enoughGo: 'See what it makes of that',
    enoughMore: (n: number) => (n === 1 ? 'Answer the last one first' : `Answer ${n} more first`),
    skipOne: 'Skip this one',
      enough: 'I have answered enough',
      kinds: {
        behaviour: 'How you operate',
        history: 'What shaped it',
        environment: 'What is around you now',
      },
    },
    selfImage: {
      title: 'What you appear to believe',
      lead: 'These are guesses, built from your own answers and nothing else. The app has no idea whether any of them are true — only you do. Say yes, say no, or rewrite it into the sentence that is actually yours. A no is set aside and not offered again, and you can put it back if you change your mind.',
      empty: 'Nothing to offer yet — go back and answer a few of the reflection questions, and this fills in.',
      why: 'Why is this being asked?',
      whyBecause: 'Because of what you answered here:',
      whyGap: (areas: string) => `And because the gap is widest in ${areas}.`,
      whyCaveat: 'That is the whole basis for it. It is a pattern-match on your answers, not a finding about you.',
      yes: 'Yes, that is mine',
      rewrite: 'Nearly — let me rewrite it',
      no: 'No, not me',
      rewriteLabel: 'Say it the way it actually sounds in your head',
      rewriteSave: 'That is the one',
      addOwn: 'Add one it has not thought of',
      ownLabel: 'In your own words — a sentence you catch yourself living by',
      ownHint: 'Write it in the first person, the way it sounds inside.',
      resembles: 'Is it a version of one of these?',
      resemblesHint: 'Optional. If one of them is basically the same thing in different words, saying so means you inherit its counterpart and its programme instead of starting from nothing. If none fit, leave it — you will get a blank scaffold to fill in yourself.',
      resemblesNone: 'None of these — mine is its own thing',
      whereShows: 'Where does it show up?',
      ownAdd: 'Add it',
      yoursTitle: 'What you have said is yours',
      undo: 'Undo',
      ruledOutTitle: 'Ruled out',
      ruledOutHint: 'These are not offered again. If one of them was a misclick, put it back.',
      putBack: 'Put it back',
      cta: 'Who would I have to be instead?',
      needOne: 'Confirm or write at least one first.',
    },
    becoming: {
      title: 'Who you would have to be',
      lead: 'Not a better mood or a nicer opinion of yourself — a way of behaving. Each of these is the person for whom your vision is simply normal. Change any of them into your own words; the sentence has to be one you would actually say.',
      insteadOf: 'Instead of',
      become: 'Become',
      placeholder: 'I am someone who…',
      yourWords: 'your words',
      whyThis: 'Why this one?',
      whyCaveat: 'Notice it describes something you do, not something you are. A claim about conduct can be settled this week; a claim about character cannot be settled at all.',
      ownBelief: 'You wrote this belief yourself, so this one is yours to answer.',
      empty: 'Confirm a belief in the previous stage and it appears here.',
      cta: 'Build the programme',
      blanks: (n: number) => `${n} still blank — you can leave them and come back.`,
      srLabel: 'The identity that replaces it',
    },
    blueprint: {
      title: 'The work',
      lead: 'One page per identity: what to catch and what to say instead, what to actually go and do, and the sentence — which only counts alongside something real that happened. Come back and log the instances; that is the whole mechanism.',
      identities: 'Identities',
      practices: 'Practices',
      instances: 'Instances logged',
      emptyPre: 'Nothing here yet. ',
      emptyLink: 'Write who you would have to be',
      emptyPost: ' and the programme builds itself.',
      inPlaceOf: (text: string) => `in place of “${text}”`,
      catch: 'Catch:',
      sayInstead: 'Say instead: ',
      logged: (n: number) => `${n} logged`,
      testCta: 'Test it',
    logCta: 'Log an instance',
      setAside: 'Set aside',
      bringBack: 'Bring back',
      addOwn: 'Add your own',
      evidenceAffirmation: 'What happened today that this is true of?',
      evidenceOther: 'What actually happened?',
      evidenceHintAffirmation: 'The sentence on its own does nothing. Attached to a real instance it is a name for something that happened.',
      evidenceHintOther: 'One line is enough. This is the evidence, not a diary.',
      logIt: 'Log it',
      kinds: { thought: 'Thought swap', behaviour: 'Evidence behaviour', affirmation: 'Affirmation' },
      cadences: { daily: 'daily', weekly: 'weekly', when_it_shows_up: 'when it shows up' },
      newCue: 'The thought to catch',
      newCuePlaceholder: 'It is not ready yet',
      newThought: 'What to say instead',
      newBehaviour: 'The action',
      newAffirmation: 'The sentence',
      add: 'Add',
    },
    gap: {
      title: 'The gap',
      lead: 'On the left, what you told us you believe. On the right, who you would have to be for the life you described to be ordinary. Everything in between is the work.',
      distance: 'Distance left',
      beliefs: 'Beliefs owned',
      instances: 'Instances logged',
      whereTitle: 'Where the distance actually is',
      whereRow: (score: number, importance: number) => `at ${score}/10 · matters ${importance}/5`,
      fromTo: 'From, to',
      emptyPre: 'Nothing yet. ',
      emptyLink: 'Answer the reflection questions',
      emptyPost: ' and this fills in.',
      notAnswered: 'Not answered yet',
      programme: 'The programme',
      board: 'The vision board',
      print: 'Print it',
      notWhat: 'What this number is not',
      notWhatBody: 'It is a description of two sets of your own answers on one day. It is not a score, it has no norms, and it cannot be compared with anybody else’s.',
    },
  },

  a11y: {
    primaryNav: 'Primary',
    progress: 'Progress',
    pairsRated: 'Pairs rated',
    consent: 'Consent',
    strivingText: 'Striving text',
    releaseTarget: 'Which striving to release',
  },

  account: {
    signIn: 'Sign in',
    signOut: 'Sign out',
    account: 'Account',
    signedInAs: 'Signed in as',
    notSignedIn: 'Not signed in',
    consentStored:
      'What you write here — your vision, where your life actually is, your childhood, what you believe about yourself — is saved to your account so it follows you between devices. It is encrypted in transit and at rest, and no other account can read it. It is not encrypted from us: the people who run this service can read it. Nothing is sold, shared, advertised against, or used to train anything.',
    consentNotTherapy:
      'This is a self-reflection tool. It is not therapy, not diagnosis, and not crisis support.',
    consentAck: 'I have read both of those and I want to create an account.',
    signInFooter:
      'Trouble signing in, or want to know what happens to what you write?',
    syncIdle: 'Everything is saved to your account',
    syncSyncing: 'Saving to your account…',
    syncOffline: 'Offline — saved here, and it will go up when you are back',
    syncError: 'Could not reach your account',
    syncOff: 'Saved on this device only',
    syncNow: 'Sync now',
    deleteAccountTitle: 'Delete your account',
    deleteAccountBody:
      'Removes your account and everything in it, from this device and from the server. There is no undo and no backup anywhere. Export first if you want a copy.',
    deleteAccountCta: 'Delete my account',
    deletedAccount: 'Your account and everything in it are gone.',
    localCarriedIn:
      'The work you did in this browser before signing in has been added to your account.',
  },

  /** Small shared fragments used across screens. */
  bits: {
    errorDetails: 'Details',
    against: 'against',
    and: 'and',
    conflicting: 'conflicting',
    stronglyConflicting: 'strongly conflicting',
    helpLink: 'help link',
    carried: 'carried',
    alreadyCarried: 'already carried',
    fromFaultLine: 'from a fault line',
    heatOf: (h: number) => `heat ${h}/10`,
    strivings: 'Strivings',
    helpLinks: 'Help links',
    faultLines: 'Fault lines',
    conflictIndex: 'Conflict index',
    faultLinesHottest: 'Fault lines, hottest first',
    noFaultLinesNow: 'No fault lines on the map right now.',
    showAllFaults: (n: number) => `Show all ${n} fault lines`,
    showFewerFaults: 'Show the hottest few',
    yourForecast: 'Your forecast',
    whatHappened: 'What happened',
    footer: 'Your own words, kept for you and nobody else. No feed, no ads, no analytics.',
    footerLocal: 'Everything you enter stays in this browser. Not signed in, so nothing is synced.',
    accessMode: 'Access mode',
    schemaVersion: 'Schema version',
    persistenceError:
      'This browser refused to save to its local database, so changes may not survive a refresh. Private-browsing modes and blocked site data are the usual cause.',
  },

  /** "How is this computed?" bodies. Design Law 5 — nothing is hidden. */
  howComputed: {
    conflictIndexFormula:
      'Each fault line is weighted |effect| × (1 + heat/10), so a strong clash that bothers you a lot counts for more than a mild one you barely notice.',
    conflictIndexShare:
      'The index is that conflict total as a share of the conflict total plus the help total.',
    conflictIndexNoCorrect:
      'There is no correct value. It is the share of the force in your map that pulls against itself, on the day you rated it.',
    coherenceNegativeLabel: 'Why can it be negative?',
    coherenceNegative:
      'If you re-rate pairs and the map picks up more conflict than it started with, this drops below zero. It is not clamped, because hiding that would make the number less useful.',
    brier:
      'Brier score: the average squared distance between your forecast and what happened, where the feared outcome happening counts as 1 and not happening counts as 0.',
    brierNone: 'No reports yet.',
    brierTerms: 'terms',
    courage:
      'One point per quest rated 7 or higher for dread that reached at least one completed step. Whether the quest went well is deliberately not part of it.',
    acrossReports: (n: number) => `Across ${n} reports.`,
  },

  rerate: {
    lead:
      'Two predictions on this pair have now broken. That is a reason to look at the rating again — not a reason to change it. Only you decide whether it still reads true.',
  },

  common: {
    back: 'Back',
    cancel: 'Cancel',
    save: 'Save',
    required: 'required',
    loading: 'Loading your data…',
    notFound: 'Nothing here.',
    toMap: 'Back to the map',
  },
} as const;
