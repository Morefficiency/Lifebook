/**
 * Accounts and sync.
 *
 * Deliberately layered on top of the local store rather than replacing it: the
 * app reads and writes IndexedDB exactly as before, and this module carries the
 * result to the account in the background. Nothing here is ever on the path
 * between a keystroke and the screen.
 *
 * With no Supabase project configured every function is a no-op and the app
 * behaves as it did before accounts existed.
 */
import { isCloudEnabled } from '../config';
import {
  clearLocalOnlyState, loadLocalOnlyState, loadState, loadSyncMark, saveState,
  saveSyncMark, setStorageScope, storageScope, wipeCurrentScope,
} from '../data/db';
import { emptyState } from '../data/db';
import { supabaseRemote } from '../data/remote';
import { initSupabase, supabase } from '../data/supabase';
import { fetchEntitlement } from '../data/entitlement';
import { pullAndMerge, push, type SyncOutcome } from '../data/sync';
import { useStore, type Session } from './useStore';
import type { AppState } from '../types';

const PUSH_DEBOUNCE_MS = 1500;

let pushTimer: ReturnType<typeof setTimeout> | null = null;
let pushing = false;
let dirty = false;

/* ------------------------------------------------------------- session --- */

export async function initAccounts(): Promise<void> {
  const sb = await initSupabase();
  if (!sb) {
    // Local-only build: the app is fully usable, there is just nowhere to sync.
    useStore.getState().setAuthReady(true);
    return;
  }

  useStore.getState().setOnLocalChange(queuePush);

  const { data } = await sb.auth.getSession();
  await adoptSession(sessionFrom(data.session));
  useStore.getState().setAuthReady(true);

  sb.auth.onAuthStateChange((_event, next) => {
    const incoming = sessionFrom(next);
    const current = useStore.getState().session;
    if (incoming?.userId === current?.userId) return;
    void adoptSession(incoming);
  });
}

function sessionFrom(raw: { user?: { id: string; email?: string | null } } | null): Session | null {
  if (!raw?.user) return null;
  return { userId: raw.user.id, email: raw.user.email ?? null };
}

/**
 * Switch the app over to an account (or to signed-out), loading that scope's
 * local copy and reconciling it with the server.
 */
async function adoptSession(session: Session | null): Promise<void> {
  const store = useStore.getState();
  await flushPush();

  setStorageScope(session?.userId ?? null);
  store.setSession(session);

  let local = (await loadState()) ?? emptyState();

  if (session) {
    // Work done in this browser before signing in belongs to whoever just
    // signed in — but only once. Clearing it afterwards is what stops the next
    // person on this laptop inheriting somebody else's Lifebook.
    const strandedLocal = await loadLocalOnlyState();
    if (strandedLocal && hasContent(strandedLocal)) {
      const { mergeStates } = await import('../engine/merge');
      local = mergeStates(local, strandedLocal, nowIso(), nowIso());
      await clearLocalOnlyState();
    }
  }

  await useStore.getState().replaceState(local);

  // Who this account has paid for, asked fresh on every session change. Signing
  // out must clear it, or the next person at this browser inherits the answer.
  if (session) {
    useStore.getState().beginEntitlementCheck();
    useStore.getState().setEntitlement(await fetchEntitlement());
  } else {
    useStore.getState().setEntitlement(null);
  }

  if (session) await syncNow();
  else useStore.getState().setSync(isCloudEnabled() ? 'idle' : 'off', null);
}

function hasContent(s: AppState): boolean {
  return s.lifebook.visions.length > 0 || s.strivings.length > 0 || s.ledger.length > 0;
}

const nowIso = () => new Date().toISOString();

/* ---------------------------------------------------------------- sync --- */

export async function syncNow(): Promise<void> {
  const store = useStore.getState();
  if (!store.session || !isCloudEnabled()) return;

  store.setSync('syncing');
  const mark = await loadSyncMark();
  const outcome = mark
    ? await push(store.state, mark.revision, supabaseRemote, nowIso())
    : await pullAndMerge(store.state, nowIso(), supabaseRemote);

  await applyOutcome(outcome);
}

async function applyOutcome(outcome: SyncOutcome): Promise<void> {
  const store = useStore.getState();
  if (outcome.changed) await store.replaceState(outcome.state);
  else if (outcome.state !== store.state) await saveState(outcome.state);

  await saveSyncMark(outcome.mark);
  store.setSync(outcome.status, outcome.error ?? null);
}

function queuePush(): void {
  if (!useStore.getState().session) return;
  dirty = true;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => { void flushPush(); }, PUSH_DEBOUNCE_MS);
}

/** Sends anything queued right now — used before switching accounts or leaving. */
export async function flushPush(): Promise<void> {
  if (pushTimer) { clearTimeout(pushTimer); pushTimer = null; }
  if (!dirty || pushing) return;
  const store = useStore.getState();
  if (!store.session || !isCloudEnabled()) { dirty = false; return; }

  pushing = true;
  dirty = false;
  try {
    const mark = await loadSyncMark();
    await applyOutcome(await push(store.state, mark?.revision ?? null, supabaseRemote, nowIso()));
  } finally {
    pushing = false;
  }
}

/* ------------------------------------------------------------ auth API --- */

export interface AuthResult { ok: boolean; error?: string; needsConfirmation?: boolean }

export async function signUp(email: string, password: string): Promise<AuthResult> {
  const sb = supabase();
  if (!sb) return { ok: false, error: 'No account backend is configured.' };
  const { data, error } = await sb.auth.signUp({ email, password });
  if (error) return { ok: false, error: friendly(error.message) };
  // Supabase returns a user with no session when email confirmation is on.
  return { ok: true, needsConfirmation: !data.session };
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  const sb = supabase();
  if (!sb) return { ok: false, error: 'No account backend is configured.' };
  const { error } = await sb.auth.signInWithPassword({ email, password });
  return error ? { ok: false, error: friendly(error.message) } : { ok: true };
}

export async function signInWithGoogle(): Promise<AuthResult> {
  const sb = supabase();
  if (!sb) return { ok: false, error: 'No account backend is configured.' };
  const { error } = await sb.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin + window.location.pathname },
  });
  return error ? { ok: false, error: friendly(error.message) } : { ok: true };
}

export async function sendPasswordReset(email: string): Promise<AuthResult> {
  const sb = supabase();
  if (!sb) return { ok: false, error: 'No account backend is configured.' };
  const { error } = await sb.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + window.location.pathname,
  });
  return error ? { ok: false, error: friendly(error.message) } : { ok: true };
}

export async function signOut(): Promise<void> {
  const sb = supabase();
  await flushPush();
  await sb?.auth.signOut();
  // onAuthStateChange also fires, but doing it here means the UI does not sit
  // showing the previous account's data while waiting for the callback.
  await adoptSession(null);
}

/**
 * Removes this account's data from the server and from this browser, and
 * deletes the account itself. There is no undo and no backup anywhere.
 */
export async function deleteAccountEverywhere(): Promise<void> {
  const sb = supabase();
  if (!sb) return;
  if (pushTimer) { clearTimeout(pushTimer); pushTimer = null; }
  dirty = false;

  await supabaseRemote.deleteAccount();
  await wipeCurrentScope();
  await sb.auth.signOut();
  setStorageScope(null);
  useStore.getState().setSession(null);
  await useStore.getState().replaceState(emptyState());
}

export function currentScope(): string | null {
  return storageScope();
}

/** Supabase's messages are aimed at developers; these are aimed at people. */
function friendly(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) {
    return 'That email and password do not match an account.';
  }
  if (m.includes('user already registered') || m.includes('already been registered')) {
    return 'There is already an account with that email. Try signing in instead.';
  }
  if (m.includes('password should be at least')) {
    return 'That password is too short — use at least six characters.';
  }
  if (m.includes('email not confirmed')) {
    return 'Check your email and click the confirmation link first.';
  }
  if (m.includes('rate limit') || m.includes('too many')) {
    return 'Too many attempts just now. Wait a minute and try again.';
  }
  if (m.includes('failed to fetch') || m.includes('network')) {
    return 'Could not reach the server. Check your connection.';
  }
  return message;
}

/* --------------------------------------------------------- entitlement --- */

/**
 * Re-ask the server what this account has paid for.
 *
 * Called on returning from checkout and when the tab regains focus after being
 * away, so a purchase made on a phone shows up on the laptop without a reload.
 */
export async function refreshEntitlement(): Promise<void> {
  if (!useStore.getState().session) return;
  useStore.getState().setEntitlement(await fetchEntitlement());
}
