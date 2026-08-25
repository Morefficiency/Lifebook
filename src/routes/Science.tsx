/**
 * §10 /science — "Why this works".
 *
 * Every mechanic in the app traces to one entry here. Nothing in the app's copy
 * claims anything that is not on this page (§10, final line). The content lives
 * in src/strings.ts with the rest of the copy (§14.4).
 */
import { S } from '../strings';
import { Page } from '../components/ui';

const { items: ITEMS, leftOut: LEFT_OUT, caveats: CAVEATS } = S.science;

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
              <span aria-hidden="true" className="text-instrument-dim">·</span>
              <span>{c}</span>
            </li>
          ))}
        </ul>
      </section>
    </Page>
  );
}
