/** §10 /ledger — append-only, filterable, annotatable, never editable. */
import { useMemo, useState } from 'react';
import { S } from '../strings';
import { useStore } from '../store/useStore';
import { useStrivingLookup } from '../store/selectors';
import { LEDGER_FILTERS, LEDGER_KIND_LABEL, annotationsFor, type LedgerPayloads } from '../data/ledger';
import { Page, Tag } from '../components/ui';
import type { LedgerEntry } from '../types';

const fmt = (ts: string) => {
  const d = new Date(ts);
  return Number.isNaN(d.getTime()) ? ts : d.toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit',
  });
};

export default function Ledger() {
  const ledger = useStore((s) => s.state.ledger);
  const annotate = useStore((s) => s.annotate);
  const labels = useStrivingLookup();

  const [filter, setFilter] = useState('all');
  const [annotating, setAnnotating] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  const kinds = LEDGER_FILTERS.find((f) => f.id === filter)?.kinds ?? [];

  const entries = useMemo(() => {
    const visible = ledger.filter((e) => e.kind !== 'annotation');
    const filtered = kinds.length === 0
      ? (filter === 'annotation' ? ledger.filter((e) => e.kind === 'annotation') : visible)
      : ledger.filter((e) => kinds.includes(e.kind));
    return [...filtered].sort((a, b) => (a.ts < b.ts ? 1 : a.ts > b.ts ? -1 : 0));
  }, [ledger, kinds, filter]);

  const save = (targetId: string) => {
    if (draft.trim().length === 0) return;
    annotate(targetId, draft);
    setDraft('');
    setAnnotating(null);
  };

  return (
    <Page title={S.ledger.title} lead={S.ledger.lead}>
      <div className="flex flex-wrap gap-2" role="group" aria-label={S.ledger.filter}>
        {LEDGER_FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={`rounded border px-3 py-1.5 text-sm ${
              filter === f.id ? 'border-instrument bg-instrument/12 text-bone' : 'border-hairline text-muted hover:text-bone'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {entries.length === 0 ? (
        <p className="mt-10 text-muted">{S.ledger.empty}</p>
      ) : (
        <ol className="mt-8 space-y-3">
          {entries.map((e) => {
            const notes = annotationsFor(ledger, e.id);
            return (
              <li key={e.id} className="rounded-md border border-hairline bg-surface/50 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Tag tone={e.kind === 'prediction_broken' ? 'facil'
                    : e.kind === 'release_victory' ? 'facil'
                      : e.kind === 'carry_marked' ? 'carry' : 'neutral'}>
                    {LEDGER_KIND_LABEL[e.kind]}
                  </Tag>
                  <time className="numeral text-xs text-muted" dateTime={e.ts}>{fmt(e.ts)}</time>
                </div>

                <div className="mt-3 leading-relaxed">
                  <EntryBody entry={e} labels={labels} />
                </div>

                {notes.length > 0 ? (
                  <ul className="mt-4 space-y-2 border-l border-hairline pl-4">
                    {notes.map((n) => (
                      <li key={n.id}>
                        <p className="text-xs uppercase tracking-[0.14em] text-muted">
                          {S.ledger.annotationOn} · {fmt(n.ts)}
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-muted">
                          {(n.payload as LedgerPayloads['annotation']).text}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : null}

                {e.kind !== 'annotation' ? (
                  annotating === e.id ? (
                    <div className="mt-4">
                      <label className="sr-only" htmlFor={`ann-${e.id}`}>{S.ledger.annotate}</label>
                      <textarea
                        id={`ann-${e.id}`}
                        className="field min-h-[5rem] resize-y"
                        value={draft}
                        placeholder={S.ledger.annotatePlaceholder}
                        onChange={(ev) => setDraft(ev.target.value)}
                      />
                      <div className="mt-2 flex gap-2">
                        <button type="button" className="btn-ghost" onClick={() => save(e.id)}>
                          {S.ledger.annotateSave}
                        </button>
                        <button
                          type="button"
                          className="btn-quiet"
                          onClick={() => { setAnnotating(null); setDraft(''); }}
                        >
                          {S.common.cancel}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="btn-quiet mt-3 px-0 text-xs"
                      onClick={() => { setAnnotating(e.id); setDraft(''); }}
                    >
                      {S.ledger.annotate}
                    </button>
                  )
                ) : null}
              </li>
            );
          })}
        </ol>
      )}
    </Page>
  );
}

function EntryBody({ entry, labels }: { entry: LedgerEntry; labels: Map<string, string> }) {
  const p = entry.payload as Record<string, unknown>;
  const edgeText = (edge: unknown) => {
    if (!edge || typeof edge !== 'object') return null;
    const e = edge as { aId: string; bId: string };
    return `${labels.get(e.aId) ?? e.aId} / ${labels.get(e.bId) ?? e.bId}`;
  };

  switch (entry.kind) {
    case 'mirror_completed':
      return (
        <p className="numeral text-sm text-muted">
          {String(p['strivings'])} strivings · {String(p['faultLines'])} fault lines ·{' '}
          {String(p['helpLinks'])} help links
        </p>
      );
    case 'fork':
      return (
        <>
          <p className="text-sm text-muted">{edgeText(p['edge'])}</p>
          <p className="mt-1">Chose to <strong>{String(p['choice'])}</strong>.</p>
          <p className="mt-2 text-muted">{String(p['note'])}</p>
        </>
      );
    case 'carry_marked':
      return (
        <>
          <p className="text-sm text-muted">{edgeText(p['edge'])}</p>
          <p className="mt-2 text-muted">{String(p['note'])}</p>
        </>
      );
    case 'release_victory':
      return (
        <>
          <p>
            {p['mode'] === 'retire' ? 'Retired: ' : 'Rewrote: '}
            <span className="text-muted">{String(p['text'])}</span>
          </p>
          {p['newText'] ? <p className="mt-1">Now: {String(p['newText'])}</p> : null}
          <p className="mt-2 text-muted">{String(p['note'])}</p>
        </>
      );
    case 'quest_created':
      return (
        <>
          <p>{String(p['wish'])}</p>
          <p className="mt-1 numeral text-sm text-muted">
            forecast {String(p['forecastP'])}% · dread {String(p['fearRating'])}/10
          </p>
        </>
      );
    case 'step_done':
      return (
        <p className="text-muted">
          <span className="text-instrument">{S.forge.ifCue}</span> {String(p['ifCue'])},{' '}
          <span className="text-instrument">{S.forge.thenAction}</span> {String(p['thenAction'])}.
        </p>
      );
    case 'field_report':
      return (
        <p>
          Feared outcome {p['fearedOutcomeOccurred'] ? 'happened' : 'did not happen'}.{' '}
          <span className="numeral text-muted">Forecast was {String(p['forecastP'])}%.</span>
        </p>
      );
    case 'prediction_broken':
      return (
        <>
          <p className="numeral">Forecast {String(p['forecastP'])}% — it did not happen.</p>
          {p['beliefHypothesis'] ? (
            <p className="mt-2 text-muted line-through decoration-fault">
              {String(p['beliefHypothesis'])}
            </p>
          ) : null}
          {p['cooledTo'] !== undefined ? (
            <p className="mt-2 numeral text-sm text-muted">
              Fault line cooled to heat {String(p['cooledTo'])}/10.
            </p>
          ) : null}
        </>
      );
    case 'quest_abandoned':
      return <p className="text-muted">{String(p['wish'])}</p>;
    case 'reassessment':
      return (
        <p className="text-muted">
          {p['type'] === 'pair_rerating'
            ? `Pair re-rated${p['from'] !== undefined ? ` from ${String(p['from'])} to ${String(p['to'])}` : ''}.`
            : p['type'] === 'remap' ? 'Started the rating flow again.' : 'Revised a striving.'}
        </p>
      );
    case 'level_up':
      return <p>{String(p['from'])} → <strong>{String(p['to'])}</strong></p>;
    case 'badge_earned':
      return <p><strong>{String(p['name'])}</strong></p>;
    case 'annotation':
      return <p className="text-muted">{String(p['text'])}</p>;
    default:
      return null;
  }
}
