/**
 * The privacy policy.
 *
 * Written to be read rather than to be survived. The app asks people to write
 * down what they believe about themselves and what happened to them as
 * children; a policy about that content which hides behind "we may share your
 * information with our partners" would be a lie told in a register that makes
 * it hard to notice.
 *
 * Every claim here is one the code actually keeps. If you change what the app
 * does, this document is part of the change.
 */
import { Clause, LegalPage, Operator, SupportEmail } from './Legal';

export default function Privacy() {
  return (
    <LegalPage
      title="Privacy"
      lead="What this app stores, who can see it, and how to take it back."
    >
      <Clause n={1} title="What you write here is sensitive, and it is treated that way">
        <p>
          Lifebook asks you to describe the life you want, where each part of your
          life actually is, what you appear to believe about yourself, and — in
          the parts that ask — where those beliefs may have come from. That is
          more revealing than most of what people type into websites.
        </p>
        <p>
          The whole design follows from that. There is no advertising, no
          analytics, no error-reporting service, no tracking pixel and no third
          party receiving a copy of anything you write. Not as a policy that could
          be changed quietly — none of it is in the code. You can check: the
          source is public.
        </p>
      </Clause>

      <Clause n={2} title="Where your writing is kept">
        <p>
          It is stored in your own browser first, in IndexedDB. If you never
          create an account, that is the only place it exists and it never leaves
          your device.
        </p>
        <p>
          If you create an account, a copy is also stored in a database so it
          follows you between devices. That copy is held in one row that only your
          signed-in account can read, enforced by the database rather than by the
          app. <Operator /> can read it: this is not end-to-end encrypted, and it
          would be dishonest to imply otherwise. It is read only when you ask for
          help and it is necessary, or when the law requires it.
        </p>
      </Clause>

      <Clause n={3} title="Who else is involved">
        <p>Three services, each doing one job:</p>
        <ul className="ml-5 list-disc space-y-2">
          <li>
            <strong className="text-bone">Supabase</strong> — hosts the database
            and handles sign-in. It stores your email address and your synced
            writing.
          </li>
          <li>
            <strong className="text-bone">Stripe</strong> — takes the payment.
            Card details are entered on Stripe's own pages and never touch this
            app or its servers. Stripe tells us that an account has paid; it does
            not tell us your card number, and we could not store it if it did.
          </li>
          <li>
            <strong className="text-bone">Cloudflare</strong> — serves the files
            that make up the app.
          </li>
        </ul>
        <p>
          Nobody else. Your writing is never sold, rented, licensed, used to train
          a model, or shared with anyone for any commercial purpose.
        </p>
      </Clause>

      <Clause n={4} title="What is collected that you did not type">
        <p>
          Your email address, so you can sign in and so a receipt has somewhere to
          go. The date you bought the app, if you did.
        </p>
        <p>
          There is no analytics of any kind. Nobody is counting your sessions,
          timing your stages, or recording which questions you skipped. The
          hosting provider keeps ordinary server logs, which include IP addresses
          — that is unavoidable for anything served over the internet, and those
          logs contain no part of what you wrote.
        </p>
      </Clause>

      <Clause n={5} title="How long it is kept">
        <p>
          Until you delete it. There is no automatic expiry, because a Lifebook
          you come back to after two years is the point of the thing.
        </p>
        <p>
          When you delete your account, your writing is deleted from the database
          along with it. Records of a payment are kept as long as tax law requires
          — that is the amount, the date and the email, not anything you wrote.
        </p>
      </Clause>

      <Clause n={6} title="Getting it out, and getting rid of it">
        <p>
          Both are buttons in Settings, always available, and neither has ever
          been behind the paywall or ever will be:
        </p>
        <ul className="ml-5 list-disc space-y-2">
          <li>
            <strong className="text-bone">Export</strong> writes the whole thing
            to a JSON file on your machine.
          </li>
          <li>
            <strong className="text-bone">Delete everything</strong> removes the
            local copy, the synced copy and the account itself. It is immediate
            and it cannot be undone.
          </li>
        </ul>
        <p>
          If you are in the UK or the EU, those two buttons are your right of
          access, portability and erasure, exercised without having to ask anyone.
          For anything they do not cover — correction, restriction, objection, or
          a complaint — write to <SupportEmail /> and you will get a person.
        </p>
      </Clause>

      <Clause n={7} title="Children">
        <p>
          This is not built for children and accounts are not knowingly created
          for anyone under 16. If you believe a child has an account here, write
          to <SupportEmail /> and it will be removed.
        </p>
      </Clause>

      <Clause n={8} title="If this changes">
        <p>
          Any change that affects what happens to your writing will be announced
          in the app before it takes effect, not published quietly with a new
          date at the bottom. If you do not want to accept it, export and delete —
          both keep working regardless.
        </p>
      </Clause>
    </LegalPage>
  );
}
