-- Phase 3 — Moderation + lifecycle + safety (reports/review MVP).
--
-- Adds: media.removed_at (stable removal clock), profiles.is_admin (operator gate),
-- the reports table + report_status enum (public report flow), the create_report RPC
-- (6th anon capability-token RPC), and purge_media_rows (service-role-only atomic
-- hard-delete + storage_used_bytes decrement, called by the Phase 3 purge cron).
--
-- THE THREE COUNTERS STAY DELIBERATELY DIFFERENT (do NOT reconcile them):
--   - per-event caps count status<>'removed'  -> a soft "remove" frees the slot now.
--   - storage_ledger (monthly) NEVER decrements -> delete/re-upload churn defense.
--   - profiles.storage_used_bytes decrements ONLY when the cron HARD-deletes the R2
--     object (purge_media_rows) -> it tracks bytes actually stored.

-- --- media.removed_at -------------------------------------------------------
-- Stable clock for the "removed -> hard purge" grace window. We CANNOT reuse
-- updated_at: the set_updated_at trigger bumps it on every touch, so a later edit would
-- reset the grace clock. removed_at is stamped once when status flips to 'removed'.
alter table public.media add column removed_at timestamptz;

-- --- profiles.is_admin ------------------------------------------------------
-- Gates the internal operator review surface (/admin). NOT added to the
-- `grant update (display_name, email)` allowlist from the init migration, so it stays
-- service-role-write-only -- same protection class as tier / storage_*. Flip it for the
-- operator account once via the Supabase MCP; never client-writable.
alter table public.profiles add column is_admin boolean not null default false;

-- --- reports ----------------------------------------------------------------
create type public.report_status as enum ('open', 'reviewed', 'dismissed', 'actioned');

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  -- nullable: album-level reports have no specific item; set null if the item is purged.
  media_id uuid references public.media (id) on delete set null,
  reason text,
  status public.report_status not null default 'open',
  resolution_note text,
  resolved_by uuid references public.profiles (id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Bound stored text (defense-in-depth; the route's zod schema caps it first).
  constraint reports_reason_len check (reason is null or char_length(reason) <= 2000)
);

create index reports_status_created_at_idx on public.reports (status, created_at);
create index reports_event_id_idx on public.reports (event_id);

create trigger reports_set_updated_at before update on public.reports
  for each row execute function public.set_updated_at();

-- RLS ON with NO anon/authenticated policies = deny-all. Reports are OPERATOR-INTERNAL:
-- hosts must NOT see reports on their own events. All access is via the create_report
-- RPC (insert, below) and the service-role admin client (operator review). The RPC is
-- SECURITY DEFINER so its insert bypasses this deny-all by design.
alter table public.reports enable row level security;

-- --- create_report (6th anon capability-token RPC) --------------------------
-- Public "report this album/item" flow. Validated by share_token (like
-- get_public_album) -- the report button lives on the public album. INSERTS ONLY: it
-- NEVER mutates media.status. Anon reports are trivially spammable, so auto-hide would
-- be a griefing DoS on legit hosts; an operator decides via /admin instead.
--
-- SECURITY: SECURITY DEFINER + pinned search_path, executable by anon -- the opaque
-- share_token IS the authorization (ADR-0004). This is the 6th such anon RPC, so
-- get_advisors now reports 6 accepted "SECURITY DEFINER exposed to anon" WARNs.
create or replace function public.create_report(
  p_share_token text,
  p_media_id uuid default null,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event public.events;
  v_report_id uuid;
begin
  select * into v_event
  from public.events
  where share_token = p_share_token and deleted_at is null;

  if not found then
    raise exception 'Event not found.' using errcode = 'no_data_found';
  end if;

  -- A reported item must belong to this event (no cross-event references).
  if p_media_id is not null and not exists (
    select 1 from public.media m where m.id = p_media_id and m.event_id = v_event.id
  ) then
    raise exception 'Reported media does not belong to this event.' using errcode = 'check_violation';
  end if;

  insert into public.reports (event_id, media_id, reason)
  values (v_event.id, p_media_id, nullif(trim(coalesce(p_reason, '')), ''))
  returning id into v_report_id;

  return jsonb_build_object('report_id', v_report_id);
end;
$$;

grant execute on function public.create_report(text, uuid, text) to anon, authenticated;

-- --- purge_media_rows (service-role only; the cron's atomic reclaim) ---------
-- Hard-deletes media rows AND decrements each host's storage_used_bytes by the freed
-- bytes -- in ONE transaction. WHY atomic: storage_ledger never decrements, so
-- storage_used_bytes is the ONLY live "bytes stored" counter; a lost decrement is a
-- permanent over-count with no way to recompute. Idempotent: rows already gone -> no-op.
--
-- The cron deletes the R2 OBJECTS FIRST, then calls this (R2-then-rows), so a crash
-- leaves rows whose objects are gone -> a retry re-attempts the (idempotent) R2 delete
-- and this row delete. NOT exposed to anon/authenticated (revoked below) -- service-role
-- only, so it must NOT add a 7th anon advisor WARN.
--
-- All CTEs share one snapshot (Postgres rule), so `target`/`by_host` read file sizes as
-- they were BEFORE `del` removes the rows -- the decrement is computed correctly.
create or replace function public.purge_media_rows(p_media_ids uuid[])
returns table (host_id uuid, freed_bytes bigint)
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  with target as (
    select m.id, m.event_id, m.file_size_bytes
    from public.media m
    where m.id = any (p_media_ids)
  ),
  by_host as (
    select e.host_id as h, sum(t.file_size_bytes)::bigint as bytes
    from target t
    join public.events e on e.id = t.event_id
    group by e.host_id
  ),
  del as (
    delete from public.media m where m.id in (select id from target)
  ),
  upd as (
    update public.profiles p
    set storage_used_bytes = greatest(0, p.storage_used_bytes - bh.bytes)
    from by_host bh
    where p.id = bh.h
    returning p.id as pid, bh.bytes as freed
  )
  select upd.pid, upd.freed from upd;
end;
$$;

revoke execute on function public.purge_media_rows(uuid[]) from public, anon, authenticated;
