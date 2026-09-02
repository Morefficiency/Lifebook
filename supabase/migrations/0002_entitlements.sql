-- Lifebook — who has paid.
--
-- The whole security argument for this table is one sentence: there is no
-- insert, update or delete policy on it. A client holding the anon key can
-- read its own row and nothing else; every write arrives through the Stripe
-- webhook, which runs as service_role and so bypasses row-level security. A
-- user cannot grant themselves access by calling the API, because there is no
-- policy under which that call could succeed.
--
-- What this does NOT defend against is somebody reading past the check in
-- their own browser. Every computation in Lifebook happens client-side and the
-- bundle is public, so the gate is honest rather than cryptographic. See the
-- note at the top of src/engine/entitlement.ts.
--
-- Run this in the Supabase SQL editor, or with `supabase db push`.

-- -------------------------------------------------------- entitlements ----

create table if not exists public.entitlements (
  user_id            uuid primary key references auth.users (id) on delete cascade,
  -- 'none' never actually appears as a stored row; it is what the client
  -- assumes when there is no row at all. Kept in the check so a bad write is
  -- rejected by the database rather than interpreted by the app.
  status             text        not null default 'none'
                     check (status in ('none', 'active', 'refunded')),
  plan               text        not null default 'lifetime',
  stripe_customer_id text,
  granted_at         timestamptz,
  updated_at         timestamptz not null default now()
);

comment on table public.entitlements is
  'One row per paying user. Written only by the Stripe webhook running as '
  'service_role — there are deliberately no write policies for authenticated.';

alter table public.entitlements enable row level security;

-- A user may read their own entitlement. That is the entire client-facing
-- surface of this table.
drop policy if exists "read own entitlement" on public.entitlements;
create policy "read own entitlement" on public.entitlements
  for select using (auth.uid() = user_id);

-- No "write own entitlement" policy exists, and none should. If you find
-- yourself adding one, the thing you actually want is a webhook.

-- ------------------------------------------------- webhook idempotency ----

-- Stripe retries a webhook until it gets a 2xx, and can deliver the same event
-- more than once even after success. Recording every event id we have already
-- handled makes replay a no-op instead of a second grant.
create table if not exists public.stripe_events (
  id          text primary key,
  type        text        not null,
  received_at timestamptz not null default now()
);

alter table public.stripe_events enable row level security;
-- No policies at all: this table is service_role only, in both directions.

comment on table public.stripe_events is
  'Processed Stripe event ids, for webhook idempotency. Service role only.';

-- ------------------------------------------------------------- grants ----

-- Called by the webhook (service_role) once a payment is confirmed. Written as
-- a function so the grant is one statement that either happens completely or
-- not at all, and so the shape of a grant lives in one place.
create or replace function public.grant_entitlement(
  p_user_id  uuid,
  p_customer text,
  p_plan     text default 'lifetime'
)
returns void language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.entitlements (user_id, status, plan, stripe_customer_id, granted_at)
  values (p_user_id, 'active', coalesce(p_plan, 'lifetime'), p_customer, now())
  on conflict (user_id) do update
    set status             = 'active',
        plan               = coalesce(excluded.plan, public.entitlements.plan),
        stripe_customer_id = coalesce(excluded.stripe_customer_id,
                                      public.entitlements.stripe_customer_id),
        -- The first purchase is the one that is dated. A re-grant after a
        -- refund does not rewrite when they originally bought it.
        granted_at         = coalesce(public.entitlements.granted_at, now()),
        updated_at         = now();
end;
$$;

-- Called on charge.refunded / charge.dispute.created. The row is kept rather
-- than deleted: what happened to an account is worth being able to answer.
create or replace function public.revoke_entitlement(p_user_id uuid)
returns void language plpgsql security definer
set search_path = public
as $$
begin
  update public.entitlements
     set status = 'refunded', updated_at = now()
   where user_id = p_user_id;
end;
$$;

-- Neither is reachable from a browser. The webhook uses the service role, which
-- does not need a grant; taking these away from everyone else is the point.
revoke all on function public.grant_entitlement(uuid, text, text) from public, anon, authenticated;
revoke all on function public.revoke_entitlement(uuid) from public, anon, authenticated;

-- ------------------------------------------------------------ deletion ----

-- delete_my_account() in 0001 predates this table. The cascade on user_id means
-- deleting the auth user already removes the entitlement, but the function
-- deletes state explicitly, so be explicit here too rather than relying on the
-- reader to know which of the two paths runs.
create or replace function public.delete_my_account()
returns void language plpgsql security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not signed in' using errcode = '28000';
  end if;
  delete from public.lifebook_state where user_id = auth.uid();
  delete from public.entitlements   where user_id = auth.uid();
  delete from auth.users            where id = auth.uid();
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
