/**
 * The Supabase client, or null when no project is configured.
 *
 * Everything that touches it must cope with null: the app is designed to run
 * with no backend at all, which is both the local-only mode and what the test
 * suite exercises.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL, isCloudEnabled } from '../config';

let client: SupabaseClient | null = null;

/**
 * Loaded on demand rather than imported at the top.
 *
 * The client is the single largest thing in the bundle, and a build with no
 * project configured has no use for it at all — this keeps it out of that
 * bundle entirely, and off the critical path of the first paint in the builds
 * that do use it.
 */
export async function initSupabase(): Promise<SupabaseClient | null> {
  if (!isCloudEnabled()) return null;
  if (client) return client;

  const { createClient } = await import('@supabase/supabase-js');
  client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      // The session lives in localStorage so a returning user is still signed
      // in offline; the app is usable without reaching the network again.
      storageKey: 'lifebook.auth',
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
  });
  return client;
}

/** Null until initSupabase() has run, which initAccounts() does at start-up. */
export function supabase(): SupabaseClient | null {
  return client;
}
