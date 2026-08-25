/** Shared chrome for the Mirror wizard: progress indicator + step frame (§5). */
import type { ReactNode } from 'react';
import { WIZARD_STEPS, type OnboardingStep } from '../../store/progress';

export function WizardFrame({ step, title, lead, children, wide = false }: {
  step: OnboardingStep; title: string; lead?: string; children: ReactNode; wide?: boolean;
}) {
  const index = WIZARD_STEPS.findIndex((s) => s.step === step);

  return (
    <div className={wide ? 'w-full' : 'mx-auto w-full max-w-2xl'}>
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-2 text-xs" aria-label="Progress">
        {WIZARD_STEPS.map((s, i) => {
          const done = i < index;
          const current = i === index;
          return (
            <li key={s.step} className="flex items-center gap-2">
              <span
                className={`rounded px-2 py-1 tracking-wide ${
                  current ? 'bg-instrument text-canvas'
                    : done ? 'text-instrument' : 'text-muted'
                }`}
                aria-current={current ? 'step' : undefined}
              >
                {s.label}
              </span>
              {i < WIZARD_STEPS.length - 1 ? (
                <span aria-hidden="true" className="text-hairline">/</span>
              ) : null}
            </li>
          );
        })}
      </ol>

      <h1 className="mt-8 text-2xl sm:text-3xl">{title}</h1>
      {lead ? <p className="mt-3 max-w-measure leading-relaxed text-muted">{lead}</p> : null}
      <div className="mt-8">{children}</div>
    </div>
  );
}
