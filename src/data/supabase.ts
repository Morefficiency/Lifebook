/**
 * The Supabase client, or null when no project is configured.
 *
 * Everything that touches it must cope with null: the app is designed to run
 * with no backend at all, which is both the local-only mode and what the test
 * suite exercises.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL, isCloudEnabled } from '../config';

let client: SupabaseClient | null = null;

export function supabase(): SupabaseClient | null {
  if (!isCloudEnabled()) return null;
  client ??= createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
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
