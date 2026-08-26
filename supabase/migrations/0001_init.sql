-- Lifebook — accounts and per-user storage.
--
-- One row per user holding the whole state document. The app keeps a local
-- copy in IndexedDB and syncs this row in the background, so isolation between
-- users has to be enforced by the database rather than by the client: every
-- policy below is written so that a stolen anon key still cannot read or write
-- anybody else's row.
--
-- Run this in the Supabase SQL editor, or with `supabase db push`.

-- ---------------------------------------------------------------- state ----

create table if not exists public.lifebook_state (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  doc         jsonb       not null,
  -- Bumped by the server on every write. The client sends the revision it
  -- believes is current; a mismatch means another device wrote first.
  revision    bigint      not null default 1,
  updated_at  timestamptz not null default now(),
  created_at  timestamptz not null default now()
);

comment on table public.lifebook_state is
  'One state document per user. Contains personal reflection: written visions, '
  'self-descriptions, beliefs and childhood history. Treat as sensitive.';

alter table public.lifebook_state enable row level security;

-- A user may only ever see, create or change their own row. There is no
-- policy granting anyone a view across rows, deliberately.
drop policy if exists "read own state" on public.lifebook_state;
create policy "read own state" on public.lifebook_state
  for select using (auth.uid() = user_id);

drop policy if exists "insert own state" on public.lifebook_state;
create policy "insert own state" on public.lifebook_state
  for insert with check (auth.uid() = user_id);

drop policy if exists "update own state" on public.lifebook_state;
create policy "update own state" on public.lifebook_state
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "delete own state" on public.lifebook_state;
create policy "delete own state" on public.lifebook_state
  for delete using (auth.uid() = user_id);

-- The client must not be able to choose its own revision number or backdate a
-- write, so both are set here rather than accepted from the request.
create or replace function public.touch_lifebook_state()
returns trigger language plpgsql as $$
begin
  new.revision   := coalesce(old.revision, 0) + 1;
  new.updated_at := now();
  new.user_id    := old.user_id;
  new.created_at := old.created_at;
  return new;
end;
$$;

drop trigger if exists lifebook_state_touch on public.lifebook_state;
create trigger lifebook_state_touch
  before update on public.lifebook_state
  for each row execute function public.touch_lifebook_state();

-- ------------------------------------------------------ compare-and-set ----

-- Saving is a compare-and-set rather than a plain update: the client passes the
-- revision it last saw, and a write from another device in the meantime is
-- reported back instead of silently overwritten. `conflict` true means the
-- caller must merge against the returned doc and try again.
create or replace function public.save_lifebook_state(
  p_doc               jsonb,
  p_expected_revision bigint
)
returns table (revision bigint, updated_at timestamptz, doc jsonb, conflict boolean)
language plpgsql security invoker
set search_path = public
as $$
declare
  v_current public.lifebook_state%rowtype;
begin
  if auth.uid() is null then
    raise exception 'not signed in' using errcode = '28000';
  end if;

  select * into v_current from public.lifebook_state s where s.user_id = auth.uid();

  -- First write for this account.
  if not found then
    insert into public.lifebook_state (user_id, doc) values (auth.uid(), p_doc)
    returning lifebook_state.revision, lifebook_state.updated_at, lifebook_state.doc, false
      into revision, updated_at, doc, conflict;
    return next;
    return;
  end if;

  -- Somebody else wrote since the caller last read. Hand back what is there.
  if p_expected_revision is distinct from v_current.revision then
    revision   := v_current.revision;
    updated_at := v_current.updated_at;
    doc        := v_current.doc;
    conflict   := true;
    return next;
    return;
  end if;

  update public.lifebook_state s
     set doc = p_doc
   where s.user_id = auth.uid()
  returning s.revision, s.updated_at, s.doc, false
    into revision, updated_at, doc, conflict;
  return next;
end;
$$;

revoke all on function public.save_lifebook_state(jsonb, bigint) from public, anon;
grant execute on function public.save_lifebook_state(jsonb, bigint) to authenticated;

-- ------------------------------------------------------------- account ----

-- Deleting the auth user cascades to the state row above, but Supabase does not
-- let a client delete its own auth user directly, so this is the hook the
-- "delete everything" button calls.
create or replace function public.delete_my_account()
returns void language plpgsql security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not signed in' using errcode = '28000';
  end if;
  delete from public.lifebook_state where user_id = auth.uid();
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
