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

    items: [
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
    { name: 'Cartographer', meaning: 'You have a map of your own goals and you have started acting on it.' },
    { name: 'Field Scientist', meaning: 'You are running experiments in the real world and filing what happened.' },
    { name: 'Experimenter', meaning: 'You have enough reports that patterns in your own predictions are visible.' },
    { name: 'Calibrated', meaning: 'Your forecasts now have a track record you can check them against.' },
    { name: 'Cartographer of the Deep', meaning: 'You have mapped, tested and revised the same territory more than once.' },
  ],

  badges: {
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
  },

  ledgerFilters: {
    all: 'Everything',
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
  a11y: {
    primaryNav: 'Primary',
    progress: 'Progress',
    pairsRated: 'Pairs rated',
    consent: 'Consent',
    strivingText: 'Striving text',
    releaseTarget: 'Which striving to release',
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
    footer: 'Everything you enter stays in this browser. No account, no server, no analytics.',
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
