/**
 * Sign in / create an account.
 *
 * The consent copy on this screen is the honest version now that there is a
 * server: the data leaves the device, we can read it, and the person agreeing
 * should know that before they write anything about their childhood.
 */
import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ENABLE_GOOGLE_SIGN_IN, GATE_SIGN_UP, isCloudEnabled, isValidAccessCode } from '../config';
import { sendPasswordReset, signIn, signInWithGoogle, signUp } from '../store/account';
import { useStore } from '../store/useStore';
import { S } from '../strings';
import { FieldError } from '../components/ui';

type Mode = 'in' | 'up' | 'reset';

export default function SignIn() {
  const session = useStore((s) => s.session);
  const authReady = useStore((s) => s.authReady);

  const [mode, setMode] = useState<Mode>('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [ack, setAck] = useState(false);

  if (!isCloudEnabled()) return <Navigate to="/" replace />;
  if (authReady && session) return <Navigate to="/" replace />;

  const submit = async () => {
    setError(null);
    setNotice(null);

    if (mode === 'reset') {
      setBusy(true);
      const result = await sendPasswordReset(email);
      setBusy(false);
      if (!result.ok) { setError(result.error ?? 'That did not work.'); return; }
      setNotice('If there is an account with that email, a reset link is on its way.');
      return;
    }

    if (mode === 'up') {
      if (GATE_SIGN_UP && !isValidAccessCode(code)) { setError(S.gate.codeBad); return; }
      if (!ack) { setError('Please read and accept the two lines above first.'); return; }
    }

    setBusy(true);
    const result = mode === 'up'
      ? await signUp(email, password)
      : await signIn(email, password);
    setBusy(false);

    if (!result.ok) { setError(result.error ?? 'That did not work.'); return; }
    if (result.needsConfirmation) {
      setNotice('Account created. Check your email for the confirmation link, then come back and sign in.');
      setMode('in');
    }
  };

  const google = async () => {
    setError(null);
    if (mode === 'up' && GATE_SIGN_UP && !isValidAccessCode(code)) { setError(S.gate.codeBad); return; }
    const result = await signInWithGoogle();
    if (!result.ok) setError(result.error ?? 'That did not work.');
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <p className="font-mono text-xs uppercase tracking-[0.22em] text-instrument">
        {S.app.tagline}
      </p>
      <h1 className="mt-4 text-3xl">{S.app.name}</h1>

      <div className="mt-6 flex gap-1 rounded-md border border-hairline p-1">
        {(['in', 'up'] as const).map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={mode === m}
            onClick={() => { setMode(m); setError(null); setNotice(null); }}
            className={`flex-1 rounded px-3 py-2 text-sm transition-colors ${
              mode === m ? 'bg-instrument text-canvas' : 'text-muted hover:text-bone'
            }`}
          >
            {m === 'in' ? 'Sign in' : 'Create an account'}
          </button>
        ))}
      </div>

      {mode === 'up' ? (
        <section className="mt-6 rounded-md border border-carry/40 bg-carry/5 p-4">
          <h2 className="text-sm uppercase tracking-[0.14em] text-carry-bright">
            Before you write anything
          </h2>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed">
            <li>{S.account.consentStored}</li>
            <li>{S.account.consentNotTherapy}</li>
          </ul>
          <label className="mt-4 flex items-start gap-3 text-sm leading-relaxed">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 accent-[#7BA3C4]"
              checked={ack}
              onChange={(e) => { setAck(e.target.checked); setError(null); }}
            />
            <span>{S.account.consentAck}</span>
          </label>
        </section>
      ) : null}

      <form
        className="mt-6 space-y-4"
        onSubmit={(e) => { e.preventDefault(); void submit(); }}
      >
        {mode === 'up' && GATE_SIGN_UP ? (
          <div>
            <label htmlFor="code" className="label">{S.gate.codeLabel}</label>
            <input
              id="code"
              className="field mt-2"
              value={code}
              autoComplete="off"
              onChange={(e) => { setCode(e.target.value); setError(null); }}
            />
          </div>
        ) : null}

        <div>
          <label htmlFor="email" className="label">Email</label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            className="field mt-2"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(null); }}
          />
        </div>

        {mode !== 'reset' ? (
          <div>
            <label htmlFor="password" className="label">Password</label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              autoComplete={mode === 'up' ? 'new-password' : 'current-password'}
              className="field mt-2"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(null); }}
            />
            {mode === 'up' ? <p className="hint">At least six characters.</p> : null}
          </div>
        ) : null}

        {error ? <FieldError>{error}</FieldError> : null}
        {notice ? <p role="status" className="text-sm text-facil-bright">{notice}</p> : null}

        <button type="submit" className="btn-primary w-full" disabled={busy}>
          {busy ? 'One moment…'
            : mode === 'in' ? 'Sign in'
              : mode === 'up' ? 'Create the account'
                : 'Send a reset link'}
        </button>
      </form>

      {ENABLE_GOOGLE_SIGN_IN && mode !== 'reset' ? (
        <>
          <div className="my-5 flex items-center gap-3 text-xs text-muted">
            <span className="h-px flex-1 bg-hairline" />or<span className="h-px flex-1 bg-hairline" />
          </div>
          <button type="button" className="btn-ghost w-full" onClick={() => void google()}>
            Continue with Google
          </button>
        </>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-4 text-sm">
        {mode === 'in' ? (
          <button type="button" className="btn-quiet px-0" onClick={() => setMode('reset')}>
            I have forgotten my password
          </button>
        ) : (
          <button type="button" className="btn-quiet px-0" onClick={() => setMode('in')}>
            Back to signing in
          </button>
        )}
      </div>

      <p className="mt-8 max-w-measure text-xs leading-relaxed text-muted">
        {S.account.signInFooter}{' '}
        <Link to="/support" className="underline decoration-hairline underline-offset-4 hover:text-bone">
          {S.nav.support}
        </Link>
      </p>
    </div>
  );
}
