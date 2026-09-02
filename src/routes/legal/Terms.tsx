/**
 * The terms.
 *
 * Short, because a document nobody reads protects nobody. The two clauses that
 * actually matter here are 2 (this is not therapy) and 6 (no promise about
 * outcomes) — everything else is the ordinary furniture of selling software.
 */
import { GOVERNING_LAW, PRICE_DISPLAY, REFUND_DAYS } from '../../config';
import { Clause, LegalPage, Operator, SupportEmail } from './Legal';

export default function Terms() {
  return (
    <LegalPage
      title="Terms"
      lead="What you are buying, what it is not, and what happens if it goes wrong."
    >
      <Clause n={1} title="The agreement">
        <p>
          Using Lifebook means accepting these terms. They are between you and{' '}
          <Operator />, who runs the service.
        </p>
      </Clause>

      <Clause n={2} title="What this is not">
        <p>
          Lifebook is a tool for writing things down and noticing patterns in what
          you wrote. It is not therapy, not counselling, not medical or
          psychological treatment, not diagnosis, and not crisis support. It does
          not know anything about you that you did not type into it.
        </p>
        <p>
          If you are in distress, it is the wrong tool and it says so on the{' '}
          <a
            href="#/support"
            className="text-instrument underline decoration-instrument-dim underline-offset-4"
          >
            support page
          </a>
          , which lists places that can actually help.
        </p>
      </Clause>

      <Clause n={3} title="Your account">
        <p>
          You are responsible for keeping your password to yourself. Tell us at{' '}
          <SupportEmail /> if you think somebody else has it. One account is for
          one person; what is in it is personal enough that sharing it is a
          strange thing to want to do.
        </p>
      </Clause>

      <Clause n={4} title="What you are buying">
        <p>
          Everything up to and including the map of where your goals collide is
          free and always will be. {PRICE_DISPLAY} buys everything after it — a
          single payment for a personal, non-transferable right to use the paid
          parts of the service for as long as it runs. It is not a subscription
          and there is nothing to cancel.
        </p>
        <p>
          Prices may change for new customers. Yours will not be charged again.
        </p>
      </Clause>

      <Clause n={5} title="Refunds">
        <p>
          {REFUND_DAYS} days, no questions asked. The full policy is on the{' '}
          <a
            href="#/refunds"
            className="text-instrument underline decoration-instrument-dim underline-offset-4"
          >
            refunds page
          </a>
          .
        </p>
      </Clause>

      <Clause n={6} title="What is not promised">
        <p>
          No claim is made that using this will improve your life, change your
          behaviour, or produce any particular result. It is a mirror, not a
          treatment. The material it draws on is described honestly on the{' '}
          <a
            href="#/science"
            className="text-instrument underline decoration-instrument-dim underline-offset-4"
          >
            science page
          </a>
          , including what it deliberately leaves out.
        </p>
        <p>
          The service is provided as it is. It is not guaranteed to be available
          without interruption, and while your writing is kept carefully and you
          can export it at any time, you should keep your own copy of anything you
          would be upset to lose.
        </p>
      </Clause>

      <Clause n={7} title="What you may not do">
        <p>
          Do not resell access, share an account, or attempt to break the service
          or reach another person's writing. The source code is public and you are
          welcome to read it, run it yourself, and learn from it under its own
          licence; that is separate from access to this hosted service.
        </p>
      </Clause>

      <Clause n={8} title="Ending it">
        <p>
          You can stop at any time by deleting your account in Settings, which
          removes everything. Access may be ended from this side for a serious or
          repeated breach of clause 7 — in which case, if you are inside the
          refund window, you are refunded.
        </p>
      </Clause>

      <Clause n={9} title="Liability">
        <p>
          Nothing here limits liability for death, personal injury caused by
          negligence, or fraud, and nothing here removes rights you have as a
          consumer under the law where you live. Subject to that, liability for
          anything arising out of the service is limited to what you paid for it.
        </p>
      </Clause>

      <Clause n={10} title="Law">
        <p>
          These terms are governed by the law of{' '}
          {GOVERNING_LAW || <span className="text-fault">[not yet set]</span>}. If
          you are a consumer, you keep the protection of the mandatory rules of
          the country you live in, and you may bring proceedings there.
        </p>
      </Clause>
    </LegalPage>
  );
}
