/** §10 /support — static, linked from the persistent nav on every screen. */
import { S } from '../strings';
import { Page } from '../components/ui';

export default function Support() {
  return (
    <Page title={S.support.title}>
      <div className="prose-quiet text-bone">
        {S.support.body.map((p) => <p key={p}>{p}</p>)}
      </div>

      <section className="card mt-10">
        <h2 className="font-display text-xl">{S.support.helplineTitle}</h2>
        <p className="mt-3">
          <a
            href={S.support.helplineUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="text-instrument underline decoration-instrument-dim underline-offset-4 hover:decoration-instrument"
          >
            {S.support.helplineLink}
          </a>
          <span className="text-muted"> — {S.support.helplineBlurb}</span>
        </p>
        <p className="mt-4 leading-relaxed">{S.support.emergency}</p>
        <p className="mt-4 text-sm leading-relaxed text-muted">{S.support.externalNote}</p>
      </section>
    </Page>
  );
}
