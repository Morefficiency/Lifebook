/** §5 A0 — landing, access gate, consent. */
import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ACCESS_MODE, PURCHASE_URL, isCloudEnabled, isValidAccessCode } from '../config';
import { S } from '../strings';
import { useStore } from '../store/useStore';
import { resumePath } from '../store/progress';
import { FieldError } from '../components/ui';

export default function Landing() {
  const navigate = useNavigate();
  const state = useStore((s) => s.state);
  const unlocked = useStore((s) => s.unlocked);
  const setUnlocked = useStore((s) => s.setUnlocked);
  const acceptConsent = useStore((s) => s.acceptConsent);

  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState(false);
  const [therapyAck, setTherapyAck] = useState(false);
  const [localAck, setLocalAck] = useState(false);
  const [consentError, setConsentError] = useState(false);

  const session = useStore((s) => s.session);
  const authReady = useStore((s) => s.authReady);
  const cloud = isCloudEnabled();
  // With accounts on, the account is the gate; the code (if any) guards sign-up.
  const gateOpen = cloud || ACCESS_MODE === 'open' || unlocked;

  // Someone already signed in and already started goes back to where they were.
  if (cloud && authReady && session && state.profile.consent) {
    return <Navigate to={resumePath(state)} replace />;
  }
  if (!cloud && gateOpen && state.profile.consent) {
    return <Navigate to={resumePath(state)} replace />;
  }

  const begin = () => {
    if (!gateOpen) {
      if (!isValidAccessCode(code)) { setCodeError(true); return; }
      setUnlocked(true);
    }
    if (!therapyAck || !localAck) { setConsentError(true); return; }
    acceptConsent();
    // With accounts on, there is somewhere for this to be saved to first.
    navigate(cloud && !session ? '/sign-in' : '/vision');
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      <p className="font-mono text-xs uppercase tracking-[0.22em] text-instrument">
        {S.app.tagline}
      </p>
      <h1 className="mt-4 text-3xl leading-tight sm:text-4xl">{S.app.name}</h1>
      <p className="mt-5 max-w-measure text-lg leading-relaxed text-bone">{S.app.sentence}</p>

      <section className="mt-10">
        <h2 className="text-sm uppercase tracking-[0.14em] text-muted">{S.gate.next25}</h2>
        <ol className="mt-4 space-y-3">
          {S.gate.steps.map((t, i) => (
            <li key={t} className="flex gap-3 text-bone">
              <span className="numeral mt-0.5 text-sm text-instrument">{i + 1}</span>
              <span>{t}</span>
            </li>
          ))}
        </ol>
        <p className="mt-4 max-w-measure text-sm text-muted">{S.gate.afterMap}</p>
      </section>

      <section className="mt-10">
        <h2 className="text-sm uppercase tracking-[0.14em] text-muted">{S.gate.neverTitle}</h2>
        <ul className="mt-4 space-y-2">
          {S.gate.never.map((t) => (
            <li key={t} className="flex gap-3 text-bone">
              <span aria-hidden="true" className="text-fault">—</span>
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card mt-10">
        {!gateOpen && !cloud ? (
          <div className="mb-6">
            <label htmlFor="access-code" className="label">{S.gate.codeLabel}</label>
            <input
              id="access-code"
              className="field mt-2"
              value={code}
              autoComplete="off"
              placeholder={S.gate.codePlaceholder}
              onChange={(e) => { setCode(e.target.value); setCodeError(false); }}
              aria-invalid={codeError}
            />
            {codeError ? <FieldError>{S.gate.codeBad}</FieldError> : null}
            <p className="hint">
              <a
                href={PURCHASE_URL}
                target="_blank"
                rel="noreferrer noopener"
                className="text-instrument underline decoration-instrument-dim underline-offset-4"
              >
                {S.gate.purchase}
              </a>
              {' — '}opens an external page. No payment happens inside this app.
            </p>
          </div>
        ) : null}

        <fieldset>
          <legend className="sr-only">{S.a11y.consent}</legend>
          <label className="flex items-start gap-3 text-sm leading-relaxed">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 accent-[#7BA3C4]"
              checked={therapyAck}
              onChange={(e) => { setTherapyAck(e.target.checked); setConsentError(false); }}
            />
            <span>{S.gate.consentTherapy}</span>
          </label>
          <label className="mt-4 flex items-start gap-3 text-sm leading-relaxed">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 accent-[#7BA3C4]"
              checked={localAck}
              onChange={(e) => { setLocalAck(e.target.checked); setConsentError(false); }}
            />
            <span>{S.gate.consentLocal}</span>
          </label>
        </fieldset>

        {consentError ? <FieldError>{S.gate.consentRequired}</FieldError> : null}

        <button type="button" className="btn-primary mt-6 w-full sm:w-auto" onClick={begin}>
          {S.gate.begin}
        </button>
      </section>
    </div>
  );
}
