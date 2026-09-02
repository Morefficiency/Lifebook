/**
 * The refund policy.
 *
 * Generous on purpose, and for a reason that is commercial rather than kind: a
 * person deciding whether to pay for something that asks them to write down
 * what they believe about themselves is deciding under more doubt than usual.
 * A refund policy with no argument in it removes the reason to hesitate, and
 * it costs less than the chargebacks and the support threads that a grudging
 * one produces.
 */
import { REFUND_DAYS } from '../../config';
import { Clause, LegalPage, SupportEmail } from './Legal';

export default function Refunds() {
  return (
    <LegalPage
      title="Refunds"
      lead={`${REFUND_DAYS} days, no questions, no form to fill in.`}
    >
      <Clause n={1} title="The policy">
        <p>
          Email <SupportEmail /> within {REFUND_DAYS} days of paying and you get
          your money back. You do not have to say why. You will not be asked what
          you tried, offered a discount instead, or routed through anybody.
        </p>
      </Clause>

      <Clause n={2} title="How long it takes">
        <p>
          The refund is issued within two working days of your email. Your bank
          then takes its own time — usually five to ten days — to show it, which
          is out of anyone's hands here.
        </p>
      </Clause>

      <Clause n={3} title="What happens to your writing">
        <p>
          Nothing, unless you ask. A refund closes the paid parts of the app; it
          does not touch a word you wrote. The free parts keep working, your
          Lifebook stays where it is, and Export in Settings keeps working
          forever — including after a refund. If you would rather it were all
          gone, Delete everything is one button away and it is immediate.
        </p>
      </Clause>

      <Clause n={4} title="After the window">
        <p>
          Write anyway. {REFUND_DAYS} days is the promise, not the limit of what
          a person will do about a reasonable request.
        </p>
      </Clause>

      <Clause n={5} title="Please do not charge back first">
        <p>
          A chargeback costs a fee and takes months to resolve; an email takes two
          days and always works. If something has gone wrong, saying so is faster
          for both of us.
        </p>
      </Clause>
    </LegalPage>
  );
}
