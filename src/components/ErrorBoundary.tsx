/**
 * The screen that must never lie.
 *
 * A render error in this app is not a broken page — it is someone who spent
 * forty minutes writing about their childhood seeing white, and concluding it
 * is gone. It is not gone: the state document is in IndexedDB and was written
 * before the render that failed.
 *
 * So this screen does two things. It says that plainly, and it offers a
 * download that reads IndexedDB *directly* rather than through the store —
 * because the store is exactly what may have just fallen over. Nothing here
 * imports the store, the engine, or anything that could throw the same way.
 */
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props { children: ReactNode }
interface State { error: Error | null; saved: 'idle' | 'saving' | 'done' | 'failed' }

const DB_NAME = 'coherence';

/** Reads every row out of the object store with no dependency on Dexie. */
async function rawExport(): Promise<string> {
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(DB_NAME);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  try {
    const rows = await new Promise<unknown[]>((resolve, reject) => {
      const tx = db.transaction('kv', 'readonly');
      const req = tx.objectStore('kv').getAll();
      req.onsuccess = () => resolve(req.result as unknown[]);
      req.onerror = () => reject(req.error);
    });
    return JSON.stringify(rows, null, 2);
  } finally {
    db.close();
  }
}

export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null, saved: 'idle' };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    // No error-reporting service: this app holds people's beliefs about
    // themselves, and shipping that to a third party on a crash is not a
    // trade anyone agreed to. The console is where this goes.
    // eslint-disable-next-line no-console
    console.error('Lifebook render error', error, info.componentStack);
  }

  private download = async (): Promise<void> => {
    this.setState({ saved: 'saving' });
    try {
      const json = await rawExport();
      const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `lifebook-rescue-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      this.setState({ saved: 'done' });
    } catch {
      this.setState({ saved: 'failed' });
    }
  };

  override render(): ReactNode {
    const { error, saved } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="mx-auto w-full max-w-xl px-4 py-16">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-fault-bright">
          Something broke on this screen
        </p>
        <h1 className="mt-4 font-display text-3xl">Your work is still here.</h1>

        <div className="mt-6 space-y-4 leading-relaxed text-bone">
          <p>
            This is a fault in the app, not in your data. Everything you wrote was
            saved to this browser before the screen failed, and it is still there.
          </p>
          <p className="text-muted">
            Reloading usually fixes it. If it does not, save a copy first — the
            button below reads straight from the database rather than through the
            part that just failed, so it works even when nothing else does.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <button type="button" className="btn-primary" onClick={() => window.location.reload()}>
            Reload
          </button>
          <button
            type="button"
            className="btn-ghost"
            disabled={saved === 'saving'}
            onClick={() => void this.download()}
          >
            {saved === 'saving' ? 'Saving…' : 'Save a copy of my data'}
          </button>
        </div>

        {saved === 'done' ? (
          <p role="status" className="mt-4 text-sm text-facil-bright">
            Saved. Keep that file — it can be imported from Settings.
          </p>
        ) : null}
        {saved === 'failed' ? (
          <p role="alert" className="mt-4 text-sm text-fault-bright">
            The database would not open. Do not clear your browser data — contact
            support first, because the copy in this browser may be the only one.
          </p>
        ) : null}

        <details className="mt-10">
          <summary className="cursor-pointer text-xs text-muted">
            Technical detail, if you are reporting this
          </summary>
          <pre className="mt-3 overflow-x-auto rounded border border-hairline bg-surface p-3 text-xs text-muted">
            {error.name}: {error.message}
          </pre>
        </details>
      </div>
    );
  }
}
