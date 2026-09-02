/**
 * The shell the three policy documents share.
 *
 * They are ordinary pages rather than a PDF or a link to a generator, because
 * a person deciding whether to type their childhood into a website should be
 * able to read what happens to it without leaving the website.
 *
 * `OPERATOR_NAME` and friends are empty until somebody fills them in. Rather
 * than print "[your company]" at a customer, an unconfigured build says plainly
 * that the document is not ready — and `npm run check:launch` fails, so this
 * banner should never be seen by anyone but the person building it.
 */
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { OPERATOR_NAME, POLICY_UPDATED, SUPPORT_EMAIL, operatorConfigured } from '../../config';
import { Page } from '../../components/ui';

export function Operator() {
  return <>{OPERATOR_NAME || 'the operator of this service'}</>;
}

export function SupportEmail() {
  if (!SUPPORT_EMAIL) return <>the support address on this site</>;
  return (
    <a
      href={`mailto:${SUPPORT_EMAIL}`}
      className="text-instrument underline decoration-instrument-dim underline-offset-4 hover:decoration-instrument"
    >
      {SUPPORT_EMAIL}
    </a>
  );
}

export function LegalPage({ title, lead, children }: {
  title: string;
  lead?: string;
  children: ReactNode;
}) {
  return (
    <Page title={title} lead={lead}>
      {!operatorConfigured() ? (
        <div className="card mt-6 border-fault/40">
          <p className="text-sm leading-relaxed text-fault">
            This document is not finished. The name of the operator, the contact
            address, the governing law and the date have not been filled in, so
            it cannot be relied on. Set them in the environment before taking a
            payment — <code className="numeral">npm run check:launch</code> lists
            what is missing.
          </p>
        </div>
      ) : null}

      <div className="legal mt-8 space-y-8">{children}</div>

      <footer className="mt-14 border-t border-hairline pt-6 text-sm text-muted">
        <p>
          {POLICY_UPDATED ? <>Last updated {POLICY_UPDATED}. </> : null}
          Questions about any of this go to <SupportEmail />.
        </p>
        <nav className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
          <Link to="/privacy" className="underline decoration-hairline underline-offset-4 hover:text-bone">Privacy</Link>
          <Link to="/terms" className="underline decoration-hairline underline-offset-4 hover:text-bone">Terms</Link>
          <Link to="/refunds" className="underline decoration-hairline underline-offset-4 hover:text-bone">Refunds</Link>
          <Link to="/support" className="underline decoration-hairline underline-offset-4 hover:text-bone">Support</Link>
        </nav>
      </footer>
    </Page>
  );
}

/** A numbered section, so a customer and the operator can cite the same thing. */
export function Clause({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={`clause-${n}`}>
      <h2 id={`clause-${n}`} className="font-display text-lg text-bone">
        <span className="numeral mr-3 text-sm text-instrument">{n}</span>
        {title}
      </h2>
      <div className="mt-3 space-y-3 leading-relaxed text-muted">{children}</div>
    </section>
  );
}
