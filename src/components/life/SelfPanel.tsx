/**
 * The other half of the page: who this life is coming out of.
 *
 * It sits beside the dial rather than under it because the claim the product
 * actually makes is that these two are one thing seen from two sides. Reading
 * order on a narrow screen is life first, then self — the life is what someone
 * came for, and the self is the answer to why it is that shape.
 */
import { Link } from 'react-router-dom';
import type {
  FieldReport, HeldBelief, PracticeItem, PracticeLog, Quest, TargetIdentity,
} from '../../types';
import { practiceProgress } from '../../engine/programme';
import { beliefEvidence, evidenceForBeliefs, evidenceTotals } from '../../engine/evidence';
import { areaName } from '../../content/areas';
import { S } from '../../strings';

export interface SelfPanelProps {
  beliefs: HeldBelief[];
  identities: TargetIdentity[];
  practices: PracticeItem[];
  logs: PracticeLog[];
  quests: Quest[];
  reports: FieldReport[];
}

export function SelfPanel({
  beliefs, identities, practices, logs, quests, reports,
}: SelfPanelProps) {
  const confirmed = beliefs.filter((b) => b.status === 'confirmed');
  const beliefById = new Map(confirmed.map((b) => [b.id, b]));
  const owned = identities.filter((i) => i.text.trim().length > 0);
  const progress = practiceProgress(practices, logs);
  // What each belief has actually been made to risk, as opposed to how many
  // times the behaviour beside it was ticked off.
  const evidence = beliefEvidence(quests, reports);
  const totals = evidenceTotals(evidenceForBeliefs(confirmed, quests, reports));

  if (owned.length === 0) {
    return (
      <section
        aria-labelledby="self-heading"
        className="flex h-full flex-col justify-center rounded-lg border border-dashed border-hairline p-6"
      >
        {/* Centred rather than pinned top and bottom: an empty panel that
            stretches to match the dial should read as a placeholder, not as a
            card with its contents fallen to the corners. */}
        <h2 id="self-heading" className="text-lg">{S.life.selfTitle}</h2>
        <p className="mt-3 max-w-measure text-sm leading-relaxed text-muted">{S.life.selfEmptyBody}</p>
        <div className="mt-6">
          <Link to="/current" className="btn-ghost">{S.life.selfEmptyCta}</Link>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="self-heading"
      className="flex h-full flex-col rounded-lg border border-hairline bg-surface/60 p-6"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="self-heading" className="text-lg">{S.life.selfTitle}</h2>
        <span className="numeral text-xs text-muted">{S.life.selfCount(owned.length)}</span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted">{S.life.selfLead}</p>

      <ul className="mt-5 space-y-4">
        {owned.map((identity) => {
          const replaced = identity.replacesBeliefId
            ? beliefById.get(identity.replacesBeliefId)
            : undefined;
          return (
            <li key={identity.id} className="border-l-2 border-instrument-dim pl-4">
              <p className="font-display text-[1.05rem] leading-snug text-bone">{identity.text}</p>
              {replaced ? (
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  <span className="text-instrument-dim">{S.life.selfInstead} </span>
                  <span className="line-through decoration-fault/70">“{replaced.text}”</span>
                </p>
              ) : null}
              {/* What this belief has survived, if anything has been put to it.
                  A count of logged practices says the person did the thing; a
                  broken prediction says the belief was wrong about what would
                  happen, which is the only one of the two that is evidence. */}
              {(() => {
                const e = replaced ? evidence.get(replaced.id) : undefined;
                if (!e || (e.tested === 0 && e.pending === 0)) return null;
                return (
                  <p className="mt-2 flex flex-wrap items-center gap-x-3 text-xs">
                    {e.broken > 0 ? (
                      <span className="text-facil-bright">{S.life.evidenceBroken(e.broken)}</span>
                    ) : null}
                    {e.occurred > 0 ? (
                      <span className="text-muted">{S.life.evidenceOccurred(e.occurred)}</span>
                    ) : null}
                    {e.pending > 0 ? (
                      <span className="text-carry-bright">{S.life.evidencePending(e.pending)}</span>
                    ) : null}
                  </p>
                );
              })()}
              {/* Which parts of the life above this one is sitting under. It is
                  the join between the two halves of the page. */}
              {identity.areas.length > 0 ? (
                <p className="mt-2 flex flex-wrap gap-x-2 gap-y-1">
                  {identity.areas.map((a) => (
                    <span
                      key={a}
                      className="rounded border border-hairline px-1.5 py-0.5 text-[0.62rem] uppercase tracking-wider text-muted"
                    >
                      {areaName(a)}
                    </span>
                  ))}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-6">
        {/* Practices logged says how much was done; beliefs tested says how
            much was risked. When there is any of the second it leads, because
            it is the measure that can come back negative. */}
        <span className="numeral text-xs text-muted">
          {totals.tested > 0
            ? `${S.life.selfTested(totals.beliefsTested, confirmed.length)} · ${
              S.life.selfEvidence(progress.logged, practices.length)}`
            : S.life.selfEvidence(progress.logged, practices.length)}
        </span>
        <Link to="/blueprint" className="btn-ghost py-2 text-xs">{S.life.selfProgramme}</Link>
      </div>
    </section>
  );
}
