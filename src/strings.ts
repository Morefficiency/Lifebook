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
    name: 'Coherence',
    tagline: 'The mirror and the move.',
    sentence:
      'Coherence maps the things you are actually trying to do, finds where they fight each other, turns the sharpest conflict into a small real-world experiment, and pays you only for evidence.',
  },

  nav: {
    map: 'Map',
    quests: 'Quests',
    ledger: 'Ledger',
    stats: 'Stats',
    science: 'Why this works',
    support: 'Support',
    settings: 'Settings',
    skip: 'Skip to main content',
  },

  gate: {
    title: 'Coherence',
    next25: 'The next 25 minutes, in four steps',
    steps: [
      'Name three things you stand for.',
      'List the things you are actually trying to do right now.',
      'Rate every pair: do these two help or hurt each other?',
      'Look at the map that makes, and pick one fault line to test.',
    ],
    neverTitle: 'What this will never do',
    never: [
      'No feed.',
      'No streaks.',
      'Your data never leaves this device.',
    ],
    consentTherapy: 'I understand this is a self-reflection tool, not therapy or medical care.',
    consentLocal: 'I understand my data is stored only on this device.',
    codeLabel: 'Access code',
    codePlaceholder: 'Enter your access code',
    codeBad: 'That code was not recognised. Check for stray spaces and try again.',
    purchase: 'Get an access code',
    begin: 'Begin',
    resume: 'Resume where you left off',
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
    building: 'Drawing your map',
    reveal: 'Reveal the map',
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
    submit: 'Record this decision',
  },

  forge: {
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
    freeQuest: 'Quest without a fault line',
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
    youSaid: (p: number) => `You forecast ${p}%`,
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
    empty: 'Your map is empty until the Mirror is done.',
    startMirror: 'Start the Mirror',
    pickEdge: 'Select a fault line',
    edgeSelected: 'Fault line selected',
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
    all: 'Everything',
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
    xpDef: 'Paid for evidence, never for effort or for showing up. Nothing spends it and nothing takes it away.',
    level: 'Level',
    badges: 'Badges',
    badgesDef: 'Certificates that a specific thing happened. Nothing more.',
    badgesEmpty: 'None yet.',
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
      'Everything in this app is stored in this browser, on this device, in IndexedDB. There is no account and no server. Clearing your browser data deletes it, and nobody — including us — has a copy.',
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
      'Coherence is a self-reflection tool. It is not therapy, it is not diagnosis, and it is not crisis support. It cannot see you and it does not know anything about you beyond what you typed into it.',
      'If this work stirs up more than you expected, or things feel heavy, that is a signal to talk to a human professional — not to push harder. Nothing here rewards pushing through.',
      'Every exercise in this app can be skipped, at any point, without consequence. There is no progress to lose.',
    ],
    helplineTitle: 'Talking to a person',
    helplineLink: 'findahelpline.com',
    helplineUrl: 'https://findahelpline.com',
    helplineBlurb: 'Free, confidential support worldwide.',
    emergency:
      'If you are in immediate danger, contact your local emergency services.',
    externalNote: 'That link opens an external website in a new tab. It is the only outbound link in this app, and it carries nothing about you.',
  },

  science: {
    title: 'Why this works',
    lead: 'Every mechanic in this app traces to a specific finding. Nothing in our copy claims anything that is not on this page.',
    leftOutTitle: 'What we deliberately left out, and why',
    caveatTitle: 'Honest limits',
  },

  common: {
    back: 'Back',
    next: 'Next',
    cancel: 'Cancel',
    save: 'Save',
    done: 'Done',
    of: 'of',
    optional: 'optional',
    required: 'required',
    loading: 'Loading your data…',
    notFound: 'Nothing here.',
    toMap: 'Back to the map',
  },
} as const;
