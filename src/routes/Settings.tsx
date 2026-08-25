/** §11 — export, import, delete everything. All local, no upload path. */
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { S } from '../strings';
import { useStore } from '../store/useStore';
import { validateState } from '../data/db';
import { Page } from '../components/ui';
import { ACCESS_MODE } from '../config';

function todayStamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export default function Settings() {
  const navigate = useNavigate();
  const state = useStore((s) => s.state);
  const replaceState = useStore((s) => s.replaceState);
  const deleteEverything = useStore((s) => s.deleteEverything);
  const resetMirror = useStore((s) => s.resetMirror);
  const persistenceError = useStore((s) => s.persistenceError);

  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteText, setDeleteText] = useState('');
  const [deleted, setDeleted] = useState(false);

  const exportJson = () => {
    // The blob is built and revoked in-page. Nothing is uploaded anywhere.
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `coherence-export-${todayStamp()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setStatus(`Exported coherence-export-${todayStamp()}.json`);
    setError(null);
  };

  const onFile = async (file: File) => {
    setStatus(null);
    setError(null);
    let parsed: unknown;
    try {
      parsed = JSON.parse(await file.text());
    } catch {
      setError(S.settings.importBadSchema);
      return;
    }
    const result = validateState(parsed);
    if (!result.ok) {
      setError(`${S.settings.importBadSchema} (${result.reason})`);
      return;
    }
    if (!window.confirm(S.settings.importConfirm)) return;
    await replaceState(result.state);
    setStatus(S.settings.importOk);
  };

  const doDelete = async () => {
    await deleteEverything();
    setDeleted(true);
  };

  if (deleted) {
    return (
      <Page title={S.settings.deleteTitle}>
        <p className="text-bone">{S.settings.deleted}</p>
        <button type="button" className="btn-primary mt-6" onClick={() => navigate('/')}>
          {S.app.name}
        </button>
      </Page>
    );
  }

  return (
    <Page title={S.settings.title}>
      {persistenceError ? (
        <p role="alert" className="mb-8 rounded-md border border-fault/50 bg-fault/10 p-4 text-sm leading-relaxed">
          {S.bits.persistenceError} {S.bits.errorDetails}: {persistenceError}
        </p>
      ) : null}

      <section>
        <h2 className="font-display text-xl">{S.settings.dataTitle}</h2>
        <p className="mt-2 max-w-measure leading-relaxed text-muted">{S.settings.dataBody}</p>
      </section>

      <section className="card mt-8">
        <h2 className="font-display text-lg">{S.settings.exportTitle}</h2>
        <p className="mt-2 max-w-measure text-sm leading-relaxed text-muted">{S.settings.exportBody}</p>
        <button type="button" className="btn-ghost mt-4" onClick={exportJson}>
          {S.settings.exportCta}
        </button>
      </section>

      <section className="card mt-4">
        <h2 className="font-display text-lg">{S.settings.importTitle}</h2>
        <p className="mt-2 max-w-measure text-sm leading-relaxed text-muted">{S.settings.importBody}</p>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void onFile(f);
            e.target.value = '';
          }}
        />
        <button type="button" className="btn-ghost mt-4" onClick={() => fileRef.current?.click()}>
          {S.settings.importCta}
        </button>
      </section>

      {status ? <p role="status" className="mt-4 text-sm text-facil-bright">{status}</p> : null}
      {error ? <p role="alert" className="mt-4 text-sm text-fault-bright">{error}</p> : null}

      <section className="card mt-4">
        <h2 className="font-display text-lg">{S.settings.resetBody ? S.settings.reset : ''}</h2>
        <p className="mt-2 max-w-measure text-sm leading-relaxed text-muted">{S.settings.resetBody}</p>
        <button
          type="button"
          className="btn-ghost mt-4"
          onClick={() => { resetMirror(); navigate('/onboarding/duels'); }}
        >
          {S.settings.reset}
        </button>
      </section>

      <section className="card mt-4">
        <h2 className="font-display text-lg">{S.settings.motionTitle}</h2>
        <p className="mt-2 max-w-measure text-sm leading-relaxed text-muted">{S.settings.motionBody}</p>
      </section>

      <section className="mt-10 rounded-lg border border-fault/40 bg-fault/[0.05] p-5">
        <h2 className="font-display text-lg">{S.settings.deleteTitle}</h2>
        <p className="mt-2 max-w-measure text-sm leading-relaxed text-muted">{S.settings.deleteBody}</p>
        <label htmlFor="delete-confirm" className="label mt-4">{S.settings.deleteConfirmLabel}</label>
        <input
          id="delete-confirm"
          className="field mt-2 max-w-xs"
          value={deleteText}
          autoComplete="off"
          onChange={(e) => setDeleteText(e.target.value)}
        />
        <button
          type="button"
          className="btn mt-4 border border-fault bg-fault/15 text-fault-bright hover:bg-fault/25"
          disabled={deleteText !== 'DELETE'}
          onClick={() => void doDelete()}
        >
          {S.settings.deleteCta}
        </button>
      </section>

      <p className="mt-10 text-xs text-muted">
        {S.bits.accessMode}: <span className="numeral">{ACCESS_MODE}</span>. {S.bits.schemaVersion}:{' '}
        <span className="numeral">{state.version}</span>.
      </p>
    </Page>
  );
}
