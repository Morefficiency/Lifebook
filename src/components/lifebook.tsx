/** Shared chrome for the six Lifebook stages. */
import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import type { LifebookStage } from '../types';

export const STAGES: { id: LifebookStage; label: string; path: string; verb: string }[] = [
  { id: 'vision', label: 'Vision', path: '/vision', verb: 'The life you want' },
  { id: 'current', label: 'Current', path: '/current', verb: 'The life you have' },
  { id: 'reflect', label: 'Reflect', path: '/reflect', verb: 'How you actually operate' },
  { id: 'self_image', label: 'Self-image', path: '/self-image', verb: 'What you appear to believe' },
  { id: 'becoming', label: 'Becoming', path: '/becoming', verb: 'Who you would have to be' },
  { id: 'blueprint', label: 'Blueprint', path: '/blueprint', verb: 'The work' },
];

export function StageFrame({ stage, title, lead, children, aside, wide = false }: {
  stage: LifebookStage; title: string; lead?: string;
  children: ReactNode; aside?: ReactNode; wide?: boolean;
}) {
  const index = STAGES.findIndex((s) => s.id === stage);

  return (
    <div className={wide ? 'w-full' : 'mx-auto w-full max-w-3xl'}>
      <nav aria-label="Stages">
        <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-2 text-xs">
          {STAGES.map((s, i) => (
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
              {i < STAGES.length - 1 ? (
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
