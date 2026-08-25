/**
 * §10 /science — "Why this works".
 *
 * Every mechanic in the app traces to one entry here. Nothing in the app's copy
 * claims anything that is not on this page (§10, final line).
 */
import { S } from '../strings';
import { Page } from '../components/ui';

interface Item { mechanic: string; body: string; cite: string }

const ITEMS: Item[] = [
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
];

const LEFT_OUT: { thing: string; why: string }[] = [
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
];

const CAVEATS: string[] = [
  'Pair ratings here are symmetric — one number for "how do these two affect each other". The original method rates each direction separately. This halves the number of judgements and loses some information.',
  'The discomfort question is a single item, not the validated multi-item index.',
  'Coherence % is a descriptive index of your own ratings on two occasions. It is not a validated scale, it has no norms, and it cannot be compared with anyone else.',
  'Everything in this app describes what you entered. None of it measures a trait, and none of it is a clinical assessment of any kind.',
];

export default function Science() {
  return (
    <Page title={S.science.title} lead={S.science.lead}>
      <ol className="space-y-8">
        {ITEMS.map((i) => (
          <li key={i.mechanic}>
            <h2 className="font-display text-xl">{i.mechanic}</h2>
            <p className="mt-2 max-w-measure leading-relaxed text-bone">{i.body}</p>
            <p className="mt-2 max-w-measure text-sm leading-relaxed text-muted">{i.cite}</p>
          </li>
        ))}
      </ol>

      <hr className="my-12 border-hairline" />

      <section>
        <h2 className="text-2xl">{S.science.leftOutTitle}</h2>
        <ul className="mt-6 space-y-6">
          {LEFT_OUT.map((l) => (
            <li key={l.thing}>
              <h3 className="text-base">{l.thing}</h3>
              <p className="mt-1.5 max-w-measure leading-relaxed text-muted">{l.why}</p>
            </li>
          ))}
        </ul>
      </section>

      <hr className="my-12 border-hairline" />

      <section>
        <h2 className="text-2xl">{S.science.caveatTitle}</h2>
        <ul className="mt-6 max-w-measure space-y-4 leading-relaxed text-muted">
          {CAVEATS.map((c) => (
            <li key={c} className="flex gap-3">
              <span aria-hidden="true" className="text-hairline">·</span>
              <span>{c}</span>
            </li>
          ))}
        </ul>
      </section>
    </Page>
  );
}
