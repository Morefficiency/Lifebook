/** Shared chrome for the six Lifebook stages. */
import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import type { LifebookStage } from '../types';

interface StageDef { id: LifebookStage; label: string; path: string; act: 1 | 2 }

/**
 * Two acts, shown separately.
 *
 * Someone in act one should see a four-step path with the end in sight, not a
 * nine-step one that looks like a commitment. Act two only appears once they
 * are in it.
 */
export const STAGES: StageDef[] = [
  { id: 'vision', label: 'Vision', path: '/vision', act: 1 },
  { id: 'goals', label: 'Goals', path: '/goals', act: 1 },
  { id: 'pairs', label: 'Pairs', path: '/pairs', act: 1 },
  { id: 'mirror', label: 'Map', path: '/mirror', act: 1 },
  { id: 'current', label: 'Current', path: '/current', act: 2 },
  { id: 'reflect', label: 'Reflect', path: '/reflect', act: 2 },
  { id: 'self_image', label: 'Self-image', path: '/self-image', act: 2 },
  { id: 'becoming', label: 'Becoming', path: '/becoming', act: 2 },
  { id: 'blueprint', label: 'Blueprint', path: '/blueprint', act: 2 },
];

export function StageFrame({ stage, title, lead, children, aside, wide = false }: {
  stage: LifebookStage; title: string; lead?: string;
  children: ReactNode; aside?: ReactNode; wide?: boolean;
}) {
  const act = STAGES.find((s) => s.id === stage)?.act ?? 1;
  const shown = STAGES.filter((s) => s.act === act);
  const index = shown.findIndex((s) => s.id === stage);

  return (
    <div className={wide ? 'w-full' : 'mx-auto w-full max-w-3xl'}>
      <nav aria-label="Stages">
        <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-2 text-xs">
          {shown.map((s, i) => (
            <li key={s.id} className="flex items-center gap-1.5">
              <Link
                to={s.path}
                aria-current={i === index ? 'step' : undefined}
                className={`rounded px-2 py-1 tracking-wide transition-colors ${
                  i === index ? 'bg-instrument text-canvas'
                    : i < index ? 'text-instrument hover:bg-surface'
                      : 'text-muted hover:text-bone'
                }`}
              >
                <span className="numeral mr-1.5 opacity-60">{i + 1}</span>{s.label}
              </Link>
              {i < shown.length - 1 ? (
                <span aria-hidden="true" className="text-instrument-dim">›</span>
              ) : null}
            </li>
          ))}
        </ol>
      </nav>

      <header className="mt-8">
        <h1 className="text-2xl sm:text-3xl">{title}</h1>
        {lead ? <p className="mt-3 max-w-measure leading-relaxed text-muted">{lead}</p> : null}
      </header>

      {aside}
      <div className="mt-8">{children}</div>
    </div>
  );
}

export function StageFooter({ children }: { children: ReactNode }) {
  return (
    <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-hairline pt-6">
      {children}
    </div>
  );
}

/** A quiet count so he can see how far in he is without being nagged about it. */
export function Tally({ done, total, noun }: { done: number; total: number; noun: string }) {
  return (
    <p className="numeral text-sm text-muted" aria-live="polite">
      {done} of {total} {noun}
    </p>
  );
}
