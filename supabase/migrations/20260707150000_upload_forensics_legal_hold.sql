-- Forensic upload capture + legal hold (ADR-0020, A3-lite / B1). When abusive media is reported we
-- currently hand law enforcement nothing; this closes the capture gap and adds the preservation
-- machinery. Three pieces:
--
-- 1) upload_forensics — one deny-all row per upload, written at the upload-complete seam by the
--    service-role admin client (src/lib/forensics/capture.ts). Captures raw IP + timestamp + full UA +
--    UA client hints + Vercel geo + the uploader linkage that already exists at that seam (host user id,
--    or guest id + the guest's user id/email denormalized at capture time) + a durable first-party
--    device UUID (localStorage, capture-only). The pre-strip EXIF capture is DEFERRED behind counsel
--    (ADR-0020 decision 1) — do NOT add EXIF columns here without that sign-off.
--    RETENTION B1: rows live exactly as long as their media — media_id is an ON DELETE CASCADE FK, so
--    the same purge paths that hard-delete a media row hard-delete its forensic row in the same
--    transaction. No separate forensics sweep exists ON PURPOSE.
--
-- 2) media.legal_hold_at / legal_hold_reason — the legal-hold flag (set on a report, service-role-only).
--    A held row is excluded from EVERY hard-delete path: the two SQL choke points below get a
--    `legal_hold_at is null` predicate, and the TS purge sweeps (cron + purgeMediaNow's R2-first
--    delete + standby eviction + event-expiry) filter held media/events before touching R2.
--    ★ media's write grant is COLUMN-scoped (20260604005917): the new columns are deliberately NOT
--    granted to authenticated, so a host can neither set nor clear a hold. Only the admin surface
--    (service-role) writes them.
--
-- 3) forensic_audit_log — every /admin preserve/export/hold action writes one row (the P8 "zero silent
--    failures" audit trail). Deny-all, service-role-only, surfaced at /admin/forensics.
--
-- Advisor delta expected after apply: +2 accepted `rls_enabled_no_policy` INFOs (upload_forensics,
-- forensic_audit_log). No new function advisors: no new RPCs are created; the three REPLACED
-- functions keep their existing grant posture (purge_media_rows service-role-only;
-- purge_media_now + restore_media authenticated/0029), re-asserted explicitly below because
-- MCP-applied SQL can inherit an anon EXECUTE default grant. NOTE on the additive-only rule: the
-- three CREATE OR REPLACEs are signature-identical amendments of the CURRENTLY-APPLIED bodies
-- (restore_media's base is 20260609150000 — its removed_by_uploader privacy guard is KEPT), and
-- every legal_hold_at is null at apply time, so the hold predicates are day-0 no-ops — a conscious
-- delta, because a TS-only exclusion would leave purge_media_now/restore_media holes at the DB
-- boundary. The ONE real day-0 behavior change is deliberate: SELECT on media becomes
-- column-scoped (see below) so the hold columns are invisible to the owning host; the matching
-- app change (MEDIA_HOST_COLUMNS instead of select("*")) ships in the same merge.
--
-- APPLY ORDER (orchestrator): apply this BEFORE the merge deploys — the purge sweeps,
-- purgeMediaNow, and the /admin/forensics reads reference legal_hold_at + the new tables, so
-- code-before-migration would error those paths (each sweep is try/caught + Sentry'd, and the
-- capture seam is best-effort, so nothing user-facing breaks — but don't leave that window open).
-- Then regenerate src/lib/db/types.ts and drop the UntypedAdmin seams at leisure.
--
-- CONTRACT CHECK (rolled back — the orchestrator runs this AFTER apply; it must print ROLLBACK_OK):
--
--   do $$
--   declare
--     v_host uuid;
--     v_event uuid := gen_random_uuid();
--     v_media uuid := gen_random_uuid();
--     v_survived int;
--     v_forensics int;
--   begin
--     select id into v_host from public.profiles limit 1;
--     if v_host is null then raise exception 'no profile to test with'; end if;
--     insert into public.events (id, host_id, name, qr_token)
--       values (v_event, v_host, 'forensics-contract-check',
--               md5(random()::text) || md5(random()::text)); -- unique token without pgcrypto
--     insert into public.media (id, event_id, type, original_key, file_size_bytes, status, legal_hold_at)
--       values (v_media, v_event, 'photo',
--               'events/' || v_event || '/photo/' || v_media || '/original.jpg', 123, 'approved', now());
--     insert into public.upload_forensics (media_id, event_id, uploader_kind, ip)
--       values (v_media, v_event, 'host', '203.0.113.7');
--     -- A held row must SURVIVE the hard-delete choke point.
--     perform * from public.purge_media_rows(array[v_media]);
--     select count(*) into v_survived from public.media where id = v_media;
--     if v_survived <> 1 then raise exception 'HELD ROW WAS PURGED'; end if;
--     -- Released, it purges — and the forensic row cascades with it (retention B1).
--     update public.media set legal_hold_at = null where id = v_media;
--     perform * from public.purge_media_rows(array[v_media]);
--     select count(*) into v_survived from public.media where id = v_media;
--     if v_survived <> 0 then raise exception 'RELEASED ROW DID NOT PURGE'; end if;
--     select count(*) into v_forensics from public.upload_forensics where media_id = v_media;
--     if v_forensics <> 0 then raise exception 'FORENSIC ROW DID NOT CASCADE'; end if;
--     -- Discretion: the hold columns must be INVISIBLE to the authenticated role (the owning
--     -- host reads their media rows via media_host_all), while the rest of the row stays readable.
--     if has_column_privilege('authenticated', 'public.media', 'legal_hold_at', 'select')
--        or has_column_privilege('authenticated', 'public.media', 'legal_hold_reason', 'select') then
--       raise exception 'HOLD COLUMNS READABLE BY authenticated';
--     end if;
--     if not has_column_privilege('authenticated', 'public.media', 'id', 'select') then
--       raise exception 'MEDIA SELECT RE-GRANT MISSING';
--     end if;
--     raise exception 'ROLLBACK_OK';
--   end $$;

-- --- media: the legal-hold flag -------------------------------------------------------------

alter table public.media
  add column legal_hold_at timestamptz,
  add column legal_hold_reason text;

-- The holds list at /admin/forensics reads "all held media"; holds are rare, so a partial index
-- keeps that read free without taxing the hot media paths.
create index media_legal_hold_idx on public.media (legal_hold_at) where legal_hold_at is not null;

-- ★ SELECT on media becomes COLUMN-scoped (writes already were, 20260604005917). Without this,
-- the default table-level SELECT grant would expose the two new columns to the OWNING HOST via
-- media_host_all + PostgREST: the host gallery reads media with select("*"), so a hold (and the
-- admin-typed reason text) would serialize straight into the investigated host's page props —
-- defeating the discretion design above (a reporter/abuser must never learn a hold exists).
-- Same landmine as the write lockdown: a column-level revoke is a SILENT NO-OP while the table
-- grant stands, so revoke the TABLE grant first, then re-grant every column EXCEPT the two hold
-- columns. Consequences, all handled in the same change:
--   * authenticated select("*") on media now errors -> the host reads enumerate columns via
--     MEDIA_HOST_COLUMNS (src/lib/db/queries/media.ts; a Vitest parity test pins that list to
--     this grant).
--   * referencing legal_hold_at in a WHERE from the authenticated role errors too ->
--     purgeMediaNow's held-filter moved to an admin-client id lookup (src/lib/db/mutations/media.ts).
--   * future `alter table media add column` is FAIL-CLOSED: a new column is invisible to hosts
--     until it is added to this grant (and to MEDIA_HOST_COLUMNS).
-- anon gets no re-grant: media has no anon RLS policy and direct anon table access is barred by
-- design (ADR-0004) — every guest read goes through SECURITY DEFINER RPCs, which are unaffected,
-- as are the admin client (service_role keeps its own grant) and the SQL functions below (owner).
revoke select on public.media from public, anon, authenticated;
grant select (
  id, event_id, guest_id, type, original_key, preview_key, file_size_bytes, duration_seconds,
  width, height, status, created_at, updated_at, removed_at, purge_at, removed_by_uploader,
  reel_eligible, highlight_score, clip_start_seconds, clip_end_seconds
) on public.media to authenticated;

-- --- upload_forensics (deny-all; capture at the upload-complete seam) ------------------------

create table public.upload_forensics (
  id uuid primary key default gen_random_uuid(),
  -- CASCADE = retention B1: the forensic row hard-deletes in the same transaction as its media row.
  media_id uuid not null references public.media(id) on delete cascade,
  created_at timestamptz not null default now(),
  event_id uuid not null, -- denormalized context (no FK: the media FK already scopes the lifetime)
  uploader_kind text not null check (uploader_kind in ('guest', 'host')),
  -- Host uploads: the getUser()-verified host id. Guest uploads: the guests row + its user_id/email
  -- DENORMALIZED at capture time (a later claim/unlink must not rewrite what was true at upload).
  host_user_id uuid,
  guest_id uuid,
  guest_user_id uuid,
  guest_email text,
  -- The durable first-party device UUID (localStorage, client-supplied, CAPTURE-ONLY — never product
  -- logic, never shown to hosts/guests). Nullable: old clients / blocked storage.
  device_uuid uuid,
  ip text, -- raw IP by ruling (ADR-0020 A3-lite); this table is deny-all + service-role-only
  user_agent text,
  client_hints jsonb, -- the sec-ch-* request headers, as sent
  geo jsonb, -- the x-vercel-ip-* coarse geo headers, as sent
  -- Preservation state (set by the /admin preserve action; see ADR-0020 decision 2):
  preserved_at timestamptz,
  preserved_by uuid, -- the acting admin's user id
  preserved_original_key text, -- the preservation-prefix copy of the original (r2/keys.ts layout)
  preserved_forensics_key text -- the JSON evidence snapshot next to it
);

-- One row per upload; the complete route's retry-idempotency upserts on this.
create unique index upload_forensics_media_idx on public.upload_forensics (media_id);
-- Cross-event device correlation is the whole point of the device UUID (abuse breadth).
create index upload_forensics_device_idx on public.upload_forensics (device_uuid)
  where device_uuid is not null;
create index upload_forensics_event_idx on public.upload_forensics (event_id);

alter table public.upload_forensics enable row level security;
-- Deny-all: NO RLS policy. Reads/writes happen ONLY via the service-role admin client
-- (the upload-complete seam writes; /admin/forensics reads). Accepted rls_enabled_no_policy INFO.

-- Least-privilege (mirrors export_log): RLS already denies; revoke the default writes too so the
-- grant surface reads "service-role-only".
revoke insert, update, delete on public.upload_forensics from authenticated, anon;

-- --- forensic_audit_log (deny-all; every preserve/export/hold action) ------------------------

create table public.forensic_audit_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  admin_user_id uuid not null, -- the acting admin (requireAdminAction ctx), never null
  action text not null, -- 'preserve' | 'export_evidence' | 'export_record' | 'hold_released'
  media_id uuid, -- no FK: an audit row must OUTLIVE the media it concerns
  event_id uuid,
  detail jsonb,
  outcome text not null default 'ok', -- 'ok' | 'error'
  error text
);

create index forensic_audit_log_created_idx on public.forensic_audit_log (created_at desc);
create index forensic_audit_log_media_idx on public.forensic_audit_log (media_id);

alter table public.forensic_audit_log enable row level security;
-- Deny-all: NO RLS policy. Service-role only. Accepted rls_enabled_no_policy INFO.

revoke insert, update, delete on public.forensic_audit_log from authenticated, anon;

-- --- purge_media_rows: the hard-delete choke point learns the hold --------------------------
-- Same signature/return/grants as 20260529102500; the ONLY change is the `legal_hold_at is null`
-- predicate in the target CTE. Every DB hard-delete path (the cron's purgeRows, purge_media_now)
-- funnels through here, so a held row can never be row-deleted even if a caller's TS filter slips.
-- (The R2 OBJECT is protected by the callers' TS filters — they delete R2 first, so they must also
-- exclude held keys; see src/app/api/cron/purge/route.ts + purgeMediaNow.)
-- Backward compatible: legal_hold_at is null everywhere at apply time, so behavior is unchanged
-- until the first hold is set.

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
      and m.legal_hold_at is null -- legal hold: never hard-delete a held row (ADR-0020)
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

-- Re-assert the service-role-only posture (MCP-applied SQL can inherit an anon EXECUTE grant).
revoke execute on function public.purge_media_rows(uuid[]) from public, anon, authenticated;

-- --- purge_media_now: the host "delete now" RPC learns the hold too -------------------------
-- Same signature/grants as 20260604031713; the validated subset now also excludes held rows, so a
-- host cannot skip-the-wait a held item into purge_media_rows (which would skip it anyway — this
-- keeps the returned `purged` count honest and mirrors the TS wrapper's R2-side filter).

create or replace function public.purge_media_now(p_media_ids uuid[])
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ids uuid[];
  v_freed bigint;
begin
  -- Validated subset: only the caller's OWN, status='removed', NOT-held media (the DB boundary).
  select coalesce(array_agg(m.id), '{}'::uuid[]) into v_ids
    from public.media m
    join public.events e on e.id = m.event_id
    where m.id = any(p_media_ids)
      and e.host_id = (select auth.uid())
      and m.status = 'removed'
      and m.legal_hold_at is null; -- legal hold: not purgeable on demand (ADR-0020)

  if array_length(v_ids, 1) is null then
    return jsonb_build_object('ok', true, 'purged', 0, 'freed_bytes', 0);
  end if;

  -- Internal call into the service-role-only purge_media_rows (owner context).
  select coalesce(sum(freed_bytes), 0)::bigint into v_freed
    from public.purge_media_rows(v_ids);

  return jsonb_build_object('ok', true, 'purged', array_length(v_ids, 1), 'freed_bytes', v_freed);
end;
$$;

revoke execute on function public.purge_media_now(uuid[]) from public, anon, authenticated;
grant execute on function public.purge_media_now(uuid[]) to authenticated;

-- --- restore_media: a held-removed item must stay OFF the live gallery ------------------------
-- The CSAM runbook's first step is remove-from-live (soft-remove) + hold. Without this guard the
-- HOST could restore_media the reported item straight back to 'approved' while the investigation
-- runs. Same body as the CURRENTLY-APPLIED version (20260609150000, which added the
-- `removed_by_uploader = false` uploader-privacy guard to the ownership SELECT — keep it, dropping
-- it would let a host restore a guest's PRIVATE self-deletion) plus the new hold refusal; the
-- reason string falls into the wrapper's DEFAULT branch ("That item is no longer available.") —
-- deliberately discreet, a reporter/abuser must not learn a hold exists from the copy.

create or replace function public.restore_media(p_media_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_media public.media;
  v_event public.events;
  v_profile public.profiles;
  v_cap bigint;
  v_active bigint;
begin
  select m.* into v_media from public.media m
    join public.events e on e.id = m.event_id
    where m.id = p_media_id and e.host_id = (select auth.uid())
      and m.removed_by_uploader = false;   -- a guest's self-deletion is private to the host
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  select * into v_event from public.events where id = v_media.event_id;
  if v_event.deleted_at is not null then
    return jsonb_build_object('ok', false, 'reason', 'event_deleted'); -- restore the event first
  end if;
  if v_media.status <> 'removed' then
    return jsonb_build_object('ok', false, 'reason', 'not_removed');
  end if;
  if v_media.legal_hold_at is not null then
    return jsonb_build_object('ok', false, 'reason', 'legal_hold'); -- ADR-0020: stays off live
  end if;

  select * into v_profile from public.profiles where id = v_event.host_id;
  v_cap := coalesce(v_profile.storage_cap_bytes,
                    (select default_storage_cap_bytes from public.tier_limits(v_profile.tier)));
  if v_cap is not null then
    v_active := public.host_active_bytes(v_event.host_id);
    if v_active + v_media.file_size_bytes > v_cap then
      return jsonb_build_object('ok', false, 'reason', 'insufficient_space',
        'needed_bytes', (v_active + v_media.file_size_bytes) - v_cap);
    end if;
  end if;

  -- Pure status flip; trigger nulls purge_at; storage_used_bytes unchanged (bytes never left).
  update public.media set status = 'approved', removed_at = null
    where id = p_media_id and status = 'removed';

  return jsonb_build_object('ok', true);
end;
$$;

revoke execute on function public.restore_media(uuid) from public, anon, authenticated;
grant execute on function public.restore_media(uuid) to authenticated;
