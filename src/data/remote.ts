/**
 * Reading and writing the account's copy of the state document.
 *
 * Defined as an interface first so the sync engine can be tested against an
 * in-memory implementation — the logic that decides *when* to push, and what to
 * do about a conflict, is the part worth testing, and it should not need a
 * network to exercise.
 */
import { validateState, type ValidationResult } from './db';
import { supabase } from './supabase';
import type { AppState } from '../types';

export interface RemoteSnapshot {
  state: AppState;
  revision: number;
  updatedAt: string;
}

export type SaveOutcome =
  | { ok: true; revision: number; updatedAt: string }
  /** Another device wrote first. `theirs` is what is on the server now. */
  | { ok: false; conflict: true; theirs: RemoteSnapshot }
  | { ok: false; conflict: false; reason: string };

export interface RemoteStore {
  /** Null when this account has never written anything. */
  load(): Promise<RemoteSnapshot | null>;
  save(state: AppState, expectedRevision: number | null): Promise<SaveOutcome>;
  /** Removes the account's row and the account itself. */
  deleteAccount(): Promise<void>;
}

function parse(doc: unknown, revision: number, updatedAt: string): RemoteSnapshot | null {
  const result: ValidationResult = validateState(doc);
  if (!result.ok) return null;
  return { state: result.state, revision, updatedAt };
}

export const supabaseRemote: RemoteStore = {
  async load() {
    const sb = supabase();
    if (!sb) return null;
    const { data, error } = await sb
      .from('lifebook_state')
      .select('doc, revision, updated_at')
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    return parse(data.doc, Number(data.revision), String(data.updated_at));
  },

  async save(state, expectedRevision) {
    const sb = supabase();
    if (!sb) return { ok: false, conflict: false, reason: 'No account configured.' };

    const { data, error } = await sb.rpc('save_lifebook_state', {
      p_doc: state,
      p_expected_revision: expectedRevision,
    });
    if (error) return { ok: false, conflict: false, reason: error.message };

    const row = Array.isArray(data) ? data[0] : data;
    if (!row) return { ok: false, conflict: false, reason: 'The server returned nothing.' };

    if (row.conflict) {
      const theirs = parse(row.doc, Number(row.revision), String(row.updated_at));
      if (!theirs) {
        return { ok: false, conflict: false, reason: 'The server copy could not be read.' };
      }
      return { ok: false, conflict: true, theirs };
    }
    return { ok: true, revision: Number(row.revision), updatedAt: String(row.updated_at) };
  },

  async deleteAccount() {
    const sb = supabase();
    if (!sb) return;
    const { error } = await sb.rpc('delete_my_account');
    if (error) throw new Error(error.message);
  },
};
