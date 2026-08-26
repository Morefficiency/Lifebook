/**
 * A quiet indicator of whether the account has this device's latest work.
 *
 * Not a nag and not a spinner in the corner: it is the answer to "is this
 * actually saved anywhere but here", which is a fair question to be able to
 * answer at a glance when you have just written something personal.
 */
import { useState } from 'react';
import { S } from '../strings';
import { useStore } from '../store/useStore';
import { syncNow } from '../store/account';

const TONE = {
  idle: 'text-muted',
  syncing: 'text-instrument',
  offline: 'text-carry-bright',
  error: 'text-fault-bright',
  off: 'text-muted',
} as const;

const LABEL = {
  idle: S.account.syncIdle,
  syncing: S.account.syncSyncing,
  offline: S.account.syncOffline,
  error: S.account.syncError,
  off: S.account.syncOff,
} as const;

export function SyncChip() {
  const status = useStore((s) => s.syncStatus);
  const error = useStore((s) => s.syncError);
  const session = useStore((s) => s.session);
  const [busy, setBusy] = useState(false);

  if (!session) return null;

  const retry = async () => {
    setBusy(true);
    await syncNow();
    setBusy(false);
  };

  const canRetry = status === 'offline' || status === 'error';

  return (
    <span className="flex items-center gap-1.5 px-2 text-xs">
      <span
        aria-hidden="true"
        className={`h-1.5 w-1.5 rounded-full ${
          status === 'syncing' ? 'animate-pulse-soft bg-instrument'
            : status === 'offline' ? 'bg-carry'
              : status === 'error' ? 'bg-fault' : 'bg-facil'
        }`}
      />
      <span className={`hidden sm:inline ${TONE[status]}`} title={error ?? undefined}>
        {LABEL[status]}
      </span>
      {canRetry ? (
        <button
          type="button"
          className="underline decoration-hairline underline-offset-4 hover:text-bone"
          disabled={busy}
          onClick={() => void retry()}
        >
          {busy ? '…' : S.account.syncNow}
        </button>
      ) : null}
    </span>
  );
}
