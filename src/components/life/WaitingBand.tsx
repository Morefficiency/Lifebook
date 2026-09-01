/**
 * What the page is still holding, said once, at the top.
 *
 * This is the app's whole return mechanism, and it works by being worth reading
 * rather than by chasing anybody: there is no notification, no badge and no
 * count. Each line names one specific thing and offers somewhere to go, and
 * when there is nothing old enough to mention the band is not rendered at all
 * — which is the state a person who has just finished is in, and should be.
 *
 * The tone is load-bearing. "Wrong twice now" is a fact about the evidence.
 * "You have not tested this" would be a fact about the person, and the app does
 * not get to say those.
 */
import { Link } from 'react-router-dom';
import type { WaitingItem } from '../../engine/waiting';
import { areaName } from '../../content/areas';
import { S } from '../../strings';

export interface WaitingBandProps {
  items: WaitingItem[];
  /** The user's own words for a belief, so a line can quote it back. */
  beliefText: (id: string) => string | undefined;
}

interface Line { key: string; text: string; to: string; cta: string; warm: boolean }

function toLine(item: WaitingItem, beliefText: (id: string) => string | undefined): Line | null {
  switch (item.kind) {
    case 'belief_contradicted': {
      const text = item.beliefId ? beliefText(item.beliefId) : undefined;
      if (!text) return null;
      return {
        key: `belief-${item.beliefId}`,
        text: S.waiting.beliefContradicted(text, item.broken ?? 0),
        to: '/self-image',
        cta: S.waiting.beliefCta,
        warm: true,
      };
    }
    case 'test_out':
      return {
        key: `test-${item.questId}`,
        text: S.waiting.testOut(item.days),
        to: `/quest/${item.questId}`,
        cta: S.waiting.testCta,
        warm: false,
      };
    case 'placement_stale':
      return {
        key: `placement-${item.area}`,
        text: S.waiting.placementStale(areaName(item.area!), item.days),
        to: '/current',
        cta: S.waiting.placementCta,
        warm: false,
      };
    case 'map_stale':
      return {
        key: 'map',
        text: S.waiting.mapStale(item.days),
        to: '/pairs',
        cta: S.waiting.mapCta,
        warm: false,
      };
    default:
      return null;
  }
}

export function WaitingBand({ items, beliefText }: WaitingBandProps) {
  const lines = items.map((i) => toLine(i, beliefText)).filter((l): l is Line => l !== null);
  if (lines.length === 0) return null;

  return (
    <section
      aria-label={S.waiting.label}
      className="mt-8 divide-y divide-hairline rounded-lg border border-hairline bg-surface/60"
    >
      {lines.map((line) => (
        <div key={line.key} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5">
          <p className={`min-w-0 flex-1 text-sm leading-relaxed ${line.warm ? 'text-bone' : 'text-muted'}`}>
            {line.warm ? (
              <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-carry align-middle" />
            ) : null}
            {line.text}
          </p>
          <Link
            to={line.to}
            className="shrink-0 text-xs text-instrument underline decoration-instrument-dim underline-offset-4 hover:decoration-instrument"
          >
            {line.cta}
          </Link>
        </div>
      ))}
    </section>
  );
}
