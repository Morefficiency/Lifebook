/**
 * Small shared primitives. Nothing here knows a formula; everything numeric is
 * handed in already computed (§3).
 */
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { S } from '../strings';

export function Page({ title, lead, children, wide = false }: {
  title: string; lead?: string; children: ReactNode; wide?: boolean;
}) {
  return (
    <div className={wide ? 'w-full' : 'mx-auto w-full max-w-3xl'}>
      <h1 className="text-2xl sm:text-3xl">{title}</h1>
      {lead ? <p className="mt-3 prose-quiet">{lead}</p> : null}
      <div className="mt-8">{children}</div>
    </div>
  );
}

/** Design Law 5: every computed number can be opened up on the spot. */
export function Explain({ children, label = S.explain.open }: { children: ReactNode; label?: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open]);

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        className="text-xs text-instrument underline decoration-instrument-dim underline-offset-4 hover:decoration-instrument"
      >
        {label}
      </button>
      {open ? (
        <div
          id={id}
          role="dialog"
          aria-label={S.explain.title}
          className="absolute left-0 z-30 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-lg border border-hairline bg-surface2 p-4 text-sm leading-relaxed text-bone shadow-2xl animate-fade-up"
        >
          {children}
          <button type="button" className="btn-quiet mt-3 px-0 py-0 text-xs" onClick={() => setOpen(false)}>
            {S.explain.close}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function StatChip({ label, value, suffix, explain }: {
  label: string; value: string | number | null; suffix?: string; explain?: ReactNode;
}) {
  return (
    <div className="rounded-md border border-hairline bg-surface/60 px-3.5 py-2.5">
      <div className="text-[0.68rem] uppercase tracking-[0.14em] text-muted">{label}</div>
      <div className="mt-1 numeral text-xl text-bone">
        {value === null ? <span className="text-muted">{S.stats.none}</span> : value}
        {value !== null && suffix ? <span className="text-sm text-muted">{suffix}</span> : null}
      </div>
      {explain ? <div className="mt-1.5"><Explain>{explain}</Explain></div> : null}
    </div>
  );
}

export function Slider({ id, value, min, max, onChange, lowLabel, highLabel, ariaLabel }: {
  id: string; value: number; min: number; max: number; onChange: (v: number) => void;
  lowLabel: string; highLabel: string; ariaLabel: string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-xs text-muted">{lowLabel}</span>
        <span className="numeral text-3xl text-bone" aria-hidden="true">{value}</span>
        <span className="text-xs text-muted">{highLabel}</span>
      </div>
      <input
        id={id}
        type="range"
        className="mt-3"
        min={min}
        max={max}
        step={1}
        value={value}
        aria-label={ariaLabel}
        aria-valuetext={`${value} out of ${max}`}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

export function CharCount({ value, min }: { value: string; min: number }) {
  const n = value.trim().length;
  const ok = n >= min;
  return (
    <span className={`numeral text-xs ${ok ? 'text-facil-bright' : 'text-muted'}`}>
      {n}/{min}
    </span>
  );
}

export function FieldError({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="mt-1.5 text-sm text-fault-bright">{children}</p>
  );
}

export function Divider() {
  return <hr className="my-8 border-hairline" />;
}

export function Tag({ children, tone = 'neutral' }: {
  children: ReactNode; tone?: 'neutral' | 'fault' | 'facil' | 'carry';
}) {
  const tones = {
    neutral: 'border-hairline text-muted',
    fault: 'border-fault/50 text-fault-bright',
    facil: 'border-facil/60 text-facil-bright',
    carry: 'border-carry/50 text-carry-bright',
  } as const;
  return (
    <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[0.7rem] uppercase tracking-wider ${tones[tone]}`}>
      {children}
    </span>
  );
}

/** "I typically try to …" rendered as one sentence with the frame greyed. */
export function StrivingText({ text, className = '' }: { text: string; className?: string }) {
  return (
    <span className={className}>
      <span className="text-muted">{S.strivings.prefix} </span>
      <span>{text}</span>
    </span>
  );
}
