/**
 * "A new version is ready."
 *
 * Deliberately a prompt rather than a silent swap: reloading the bundle
 * underneath someone who is mid-sentence in the middle of writing about their
 * childhood is how you lose a paragraph. They decide when.
 */
import { useRegisterSW } from 'virtual:pwa-register/react';

export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({ immediate: true });

  if (!needRefresh) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-3 bottom-3 z-40 mx-auto max-w-md rounded-lg border border-instrument/40 bg-surface2 p-4 shadow-2xl animate-fade-up sm:inset-x-auto sm:right-4"
    >
      <p className="text-sm leading-relaxed">
        A new version of Lifebook is ready. Your work is saved — reloading will
        not lose anything.
      </p>
      <div className="mt-3 flex gap-2">
        <button type="button" className="btn-primary" onClick={() => void updateServiceWorker(true)}>
          Reload now
        </button>
        <button type="button" className="btn-quiet" onClick={() => setNeedRefresh(false)}>
          Later
        </button>
      </div>
    </div>
  );
}
