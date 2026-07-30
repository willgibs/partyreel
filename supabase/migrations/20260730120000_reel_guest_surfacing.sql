-- Reel guest surfacing (R3, ADR-0022): the publish switch, the anon capability read, and the
-- reorder guard moving onto the MEMBERSHIP predicate.
--
-- PENDING-APPLY (orchestrator, in order):
--   1. Diff reorder_reel against live pg_get_functiondef FIRST (this file reproduces the
--      2026-07-30 live body verbatim except the two guard counts; live was verified drift-free
--      against 20260622120000 the same day, but re-check at apply time).
--   2. Apply verbatim via the Supabase MCP apply_migration.
--   3. get_advisors, expected delta EXACTLY:
--        - lint 0028 (anon EXECUTE by design) grows 4 -> 5: get_event_by_qr_token,
--          get_event_media_by_qr_token, get_upload_context, get_public_profile,
--          + get_event_reel_by_qr_token (NEW).
--        - lint 0029 (authenticated-only) gains set_reel_guest_visible (joins add_to_reel,
--          reorder_reel, upsert_reel_config, ...). reorder_reel itself stays put (same-signature
--          replace preserves its grants).
--        - Nothing else moves. No new tables, so no new rls_enabled_no_policy INFO.
--   4. Run the rolled-back contract check at the bottom of this file (rides EXISTING rows).
--   5. Regenerate src/lib/db/types.ts, then drop the two PRE-APPLY TYPING SEAMS the code carries
--      until the regen:
--        - the get_event_reel_by_qr_token rpc cast (src/lib/reel/guest-reel.ts),
--        - the `guest_visible` intersection on the highlight_reels row type
--          (src/lib/db/queries/reel.ts + src/lib/reel/guest-reel.ts).
--
-- DEPLOY ORDERING: this migration lands BEFORE the code that calls the new RPCs (PostgREST
-- resolves RPCs by argument NAME; the write-spine round's lesson). Additive only: nothing here
-- changes an existing signature, so already-deployed code is unaffected.

-- ---------------------------------------------------------------------------------------------
-- (a) The publish switch (ADR-0022 ruling 1): default OFF = no silent draft exposure, ever.
-- Table writes for authenticated are already fully revoked (20260622200000), and the host's RLS
-- SELECT policy covers reading it back, so the column needs no new grants: the ONLY write path is
-- the RPC below.
-- ---------------------------------------------------------------------------------------------

alter table public.highlight_reels
  add column guest_visible boolean not null default false;

-- ---------------------------------------------------------------------------------------------
-- (b) set_reel_guest_visible: the publish/unpublish act (0029 family: authenticated-only).
--
-- UPSERT rather than UPDATE because curation alone never creates the highlight_reels row (only
-- upsert_reel_config does), and the loud "Share with guests" moment must work on a reel the host
-- built purely by adding items. The insert rides the column defaults (status 'pending' etc.).
--
-- Publishing an EMPTY reel is refused ('empty'): the gate counts CURRENTLY-VISIBLE items on the
-- TIMELINE predicate (media.status = 'approved' — what a guest would actually watch; deliberately
-- NARROWER than the membership predicate reorder_reel uses below, see its comment). An mp4 is NOT
-- required to publish: guests watch the live canvas player; the artifact is a download optimization.
-- Unpublishing always succeeds — the safety valve is never gated.
-- ---------------------------------------------------------------------------------------------

create function public.set_reel_guest_visible(p_event_id uuid, p_visible boolean)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid           uuid := (select auth.uid());
  v_owns          boolean;
  v_visible_items int;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'reason', 'unauthorized');
  end if;

  -- The caller must HOST the event (and it must not be deleted). Mirrors add_to_reel/reorder_reel.
  select exists (
    select 1 from public.events e
    where e.id = p_event_id
      and e.host_id = v_uid
      and e.deleted_at is null
  ) into v_owns;
  if not v_owns then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  if p_visible then
    select count(*) into v_visible_items
    from public.reel_items r
    join public.media m on m.id = r.media_id and m.status = 'approved'
    where r.event_id = p_event_id;
    if v_visible_items = 0 then
      return jsonb_build_object('ok', false, 'reason', 'empty');
    end if;
  end if;

  insert into public.highlight_reels (event_id, guest_visible)
  values (p_event_id, p_visible)
  on conflict (event_id) do update
    set guest_visible = excluded.guest_visible,
        updated_at    = now();

  return jsonb_build_object('ok', true, 'guest_visible', p_visible);
end;
$$;

-- Lockdown identical to the other reel write RPCs: revoke the implicit grants (incl. the anon
-- EXECUTE a Supabase-MCP create would add), then grant ONLY to authenticated.
revoke all on function public.set_reel_guest_visible(uuid, boolean) from public, anon, authenticated;
grant execute on function public.set_reel_guest_visible(uuid, boolean) to authenticated;

-- ---------------------------------------------------------------------------------------------
-- (c) get_event_reel_by_qr_token: the anon capability read (0028 member #5, ADR-0022 ruling 5).
--
-- The RETURNS TABLE below IS the anon surface — an explicit allow-list, mirrored by the repo's
-- contract test. NEVER returned (by construction, not by filtering): output_key, render_id,
-- rendered_hash, render_error, render_cost_usd, any timestamp, the host's tier, any uploader
-- identity. Derived fields exist precisely so their inputs stay private:
--   - length_seconds is the EFFECTIVE length: the stored value clamped to the host tier's
--     max_reel_seconds via public.tier_limits (exact clampReelSeconds parity: null/<=0 means
--     "Auto" and fills to the cap; else least(stored, cap)). Returning the raw stored value would
--     be unusable without the tier, and the tier never leaves.
--   - watermark derives from the tier (free = true) without disclosing it.
--   - mp4_ready says an artifact EXISTS (status ready + output_key present); freshness against
--     the current config hash is TS-only (render-hash.ts) and is computed server-side in the
--     download route — never here, never client-trusted.
--
-- Structural gates INSIDE the definer body (ruling 5): visibility = 'open' — password events NEVER
-- flow through anon RPCs; they ride the unlock-cookie-guarded admin arm (guest-reel.ts, the
-- getApprovedMediaForUnlock pattern) — plus deleted_at is null AND guest_visible = true. The item
-- list re-filters to the TIMELINE predicate (media.status = 'approved': what actually plays; the
-- render hash is built from exactly this set) ordered (position, added_at) like listReelItems. An
-- empty visible set returns ZERO ROWS (items.ids is null), so a returned row always describes a
-- renderable reel and an unpublished/empty/locked reel is indistinguishable from "no reel".
--
-- Disclosure posture: to a direct anon caller of an OPEN event this returns config + opaque media
-- ids — a strict subset of what get_event_media_by_qr_token already returns for the same event
-- (full key lists). The account-required teaser boundary is enforced at the page + download route
-- (access FULL), matching the QA #36/#40 precedent that kept the media RPC's grant.
--
-- ★ Future edits to the RETURNS TABLE need DROP + CREATE (CREATE OR REPLACE cannot change a return
-- type), which DROPS the grants — re-grant to EXACTLY anon + authenticated (the 20260622140000
-- lesson).
-- ---------------------------------------------------------------------------------------------

create function public.get_event_reel_by_qr_token(p_qr_token text)
returns table(
  style_id text,
  orientation text,
  seed bigint,
  length_seconds integer,
  cover_media_id uuid,
  mp4_ready boolean,
  watermark boolean,
  item_ids uuid[]
)
language sql
stable
security definer
set search_path to ''
as $$
  select
    coalesce(hr.style_id, hr.theme, 'classic'),
    case when hr.orientation = 'landscape' then 'landscape' else 'portrait' end,
    hr.seed,
    case
      when hr.length_seconds is null or hr.length_seconds <= 0 then t.max_reel_seconds
      else least(hr.length_seconds, t.max_reel_seconds)
    end,
    hr.cover_media_id,
    (hr.status = 'ready' and hr.output_key is not null),
    (pr.tier = 'free'),
    items.ids
  from public.highlight_reels hr
  join public.events e
    on e.id = hr.event_id
   and e.qr_token = p_qr_token
   and e.visibility = 'open'
   and e.deleted_at is null
  join public.profiles pr on pr.id = e.host_id
  cross join lateral public.tier_limits(pr.tier) t
  cross join lateral (
    select array_agg(r.media_id order by r.position, r.added_at) as ids
    from public.reel_items r
    join public.media m on m.id = r.media_id and m.status = 'approved'
    where r.event_id = hr.event_id
  ) items
  where hr.guest_visible = true
    and items.ids is not null;
$$;

-- Public open-album read (by design anon-accessible — the visibility='open' + guest_visible gates
-- ARE the boundary, exactly like get_event_media_by_qr_token).
revoke all on function public.get_event_reel_by_qr_token(text) from public;
grant execute on function public.get_event_reel_by_qr_token(text) to anon, authenticated;

-- ---------------------------------------------------------------------------------------------
-- (d) reorder_reel: the set-equality guard moves onto the MEMBERSHIP predicate.
--
-- reel_items rows OUTLIVE their media (a removal leaves the curation row so a restore resurrects
-- it), so the raw junction count the guard compared against includes GHOSTS the composer can never
-- see or send. One removed in-reel item therefore bricked reordering FOREVER: every list the
-- client could produce differed from the raw count, 'stale' every try, until the purge cron
-- hard-deleted the row (30 days). Live prod hit: the demo event carries 3 such ghosts today.
--
-- Both guard counts now join media on status in ('approved','hidden') — the MEMBERSHIP predicate,
-- exactly what listReelItems serves the composer (hidden items STAY members: the host sees them
-- dimmed and reorders them; only removed rows are ghosts). Approved-only here would re-brick
-- reordering for any reel containing a hidden item. This is deliberately WIDER than the TIMELINE
-- predicate above (approved-only: what plays / what publishes) — do not "unify" them.
--
-- The re-stamp UPDATE is unchanged: it touches only the given ids, so ghost rows keep their stale
-- positions. A later un-remove resurrects the item at its old slot among the visible ordering
-- ((position, added_at) stays deterministic on collisions) — the host just drags it if they care.
--
-- Same-signature CREATE OR REPLACE: the 0029 grants are PRESERVED (no re-grant needed; asserted
-- in the contract check anyway). Body otherwise reproduced verbatim from live (== 20260622120000).
-- ---------------------------------------------------------------------------------------------

create or replace function public.reorder_reel(p_event_id uuid, p_media_ids uuid[])
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid     uuid := (select auth.uid());
  v_owns    boolean;
  v_current int;
  v_given   int := coalesce(array_length(p_media_ids, 1), 0);
  v_matched int;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'reason', 'unauthorized');
  end if;

  -- The caller must HOST the event (and it must not be deleted). Mirrors add_to_reel's event check.
  select exists (
    select 1 from public.events e
    where e.id = p_event_id
      and e.host_id = v_uid
      and e.deleted_at is null
  ) into v_owns;
  if not v_owns then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  -- Set-equality guard over the MEMBERSHIP set (see header): count match + every given id present
  -- == the exact current VISIBLE membership. The PK (event_id, media_id) keeps the reel side
  -- dup-free; the count check rejects a dup in the INPUT.
  select count(*) into v_current
  from public.reel_items r
  join public.media m on m.id = r.media_id and m.status in ('approved', 'hidden')
  where r.event_id = p_event_id;

  select count(*) into v_matched
  from public.reel_items r
  join public.media m on m.id = r.media_id and m.status in ('approved', 'hidden')
  where r.event_id = p_event_id
    and r.media_id = any(p_media_ids);

  if v_given <> v_current or v_matched <> v_current then
    return jsonb_build_object('ok', false, 'reason', 'stale');
  end if;

  -- One-statement re-stamp: position := the id's index in the array (1-based via ordinality; only
  -- the RELATIVE order matters — listReelItems orders by position ascending).
  update public.reel_items r
  set position = ord.idx
  from unnest(p_media_ids) with ordinality as ord(mid, idx)
  where r.event_id = p_event_id
    and r.media_id = ord.mid;

  return jsonb_build_object('ok', true);
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- ROLLED-BACK CONTRACT CHECK (orchestrator runs via execute_sql AFTER applying; everything rolls
-- back on the final RAISE). Rides EXISTING rows — never INSERT an event (enforce_event_limit) —
-- and impersonates via txn-local request.jwt.claims WITHOUT switching role: auth.uid() sees the
-- claim while current_user stays postgres, so the probes' direct media UPDATEs pass the Q3
-- transition guards (which refuse only authenticated).
--
-- begin;
-- do $chk$
-- declare
--   v_event  uuid;
--   v_host   uuid;
--   v_qr     text;
--   v_m1     uuid;
--   v_m2     uuid;
--   v_res    jsonb;
--   v_row    record;
--   v_rows   int;
-- begin
--   -- 0. An OPEN test event with >= 2 approved media.
--   select e.id, e.host_id, e.qr_token into v_event, v_host, v_qr
--   from public.events e
--   where e.visibility = 'open' and e.deleted_at is null
--     and (select count(*) from public.media m
--          where m.event_id = e.id and m.status = 'approved') >= 2
--   order by e.created_at limit 1;
--   if v_event is null then raise exception 'SETUP: no suitable open event'; end if;
--   select m.id into v_m1 from public.media m
--     where m.event_id = v_event and m.status = 'approved' order by m.created_at limit 1;
--   select m.id into v_m2 from public.media m
--     where m.event_id = v_event and m.status = 'approved' and m.id <> v_m1
--     order by m.created_at limit 1;
--
--   -- 1. Impersonate the host (claims only; current_user stays postgres) + curate two items.
--   perform set_config('request.jwt.claims',
--     json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   perform public.add_to_reel(v_m1);
--   perform public.add_to_reel(v_m2);
--
--   -- 2. UNPUBLISHED -> zero rows (the red-team core).
--   select count(*) into v_rows from public.get_event_reel_by_qr_token(v_qr);
--   if v_rows <> 0 then raise exception 'FAIL 2: unpublished reel leaked (% rows)', v_rows; end if;
--
--   -- 3. Publish -> exactly one row, derived fields sane.
--   v_res := public.set_reel_guest_visible(v_event, true);
--   if not (v_res->>'ok')::boolean then raise exception 'FAIL 3a: publish refused %', v_res; end if;
--   select * into v_row from public.get_event_reel_by_qr_token(v_qr);
--   if v_row is null then raise exception 'FAIL 3b: published reel invisible'; end if;
--   if coalesce(array_length(v_row.item_ids, 1), 0) < 2 then
--     raise exception 'FAIL 3c: item_ids %', v_row.item_ids; end if;
--   if v_row.length_seconds is null or v_row.length_seconds <= 0 then
--     raise exception 'FAIL 3d: length %', v_row.length_seconds; end if;
--   if v_row.watermark <> ((select tier from public.profiles where id = v_host) = 'free') then
--     raise exception 'FAIL 3e: watermark mismatch'; end if;
--   if v_row.mp4_ready and not exists (select 1 from public.highlight_reels hr
--        where hr.event_id = v_event and hr.status = 'ready' and hr.output_key is not null) then
--     raise exception 'FAIL 3f: mp4_ready true without artifact row'; end if;
--
--   -- 4. Password flip -> dark even while published (structural ruling-5 guard).
--   update public.events set visibility = 'password', event_password_hash = 'chk'
--     where id = v_event;
--   select count(*) into v_rows from public.get_event_reel_by_qr_token(v_qr);
--   if v_rows <> 0 then raise exception 'FAIL 4: password event leaked via anon RPC'; end if;
--   update public.events set visibility = 'open', event_password_hash = null
--     where id = v_event;
--
--   -- 5. The predicate divergence, both directions. REMOVE one item (a ghost):
--   --    reorder over the remaining membership succeeds (pre-fix: 'stale' forever)...
--   update public.media set status = 'removed', removed_at = now() where id = v_m2;
--   v_res := public.reorder_reel(v_event, (
--     select array_agg(r.media_id order by r.position desc)  -- reversed: a REAL reorder
--     from public.reel_items r
--     join public.media m on m.id = r.media_id and m.status in ('approved','hidden')
--     where r.event_id = v_event));
--   if not (v_res->>'ok')::boolean then
--     raise exception 'FAIL 5a: ghost still bricks reorder %', v_res; end if;
--   -- ...and HIDE the other: it stays a MEMBER (reorder wants it) but leaves the TIMELINE
--   --    (the RPC's item_ids drop it -> empty set -> zero rows).
--   update public.media set status = 'hidden' where id = v_m1;
--   select count(*) into v_rows from public.get_event_reel_by_qr_token(v_qr);
--   if v_rows <> 0 then raise exception 'FAIL 5b: hidden item still plays for guests'; end if;
--   v_res := public.reorder_reel(v_event, array[v_m1]);
--   if not (v_res->>'ok')::boolean then
--     raise exception 'FAIL 5c: hidden member rejected by reorder %', v_res; end if;
--
--   -- 6. Empty-publish refusal (all items now hidden/removed -> zero APPROVED).
--   v_res := public.set_reel_guest_visible(v_event, true);
--   if (v_res->>'reason') is distinct from 'empty' then
--     raise exception 'FAIL 6: empty publish not refused %', v_res; end if;
--
--   -- 7. Wrong callers.
--   perform set_config('request.jwt.claims',
--     json_build_object('sub', gen_random_uuid(), 'role', 'authenticated')::text, true);
--   v_res := public.set_reel_guest_visible(v_event, true);
--   if (v_res->>'reason') is distinct from 'not_found' then
--     raise exception 'FAIL 7a: non-host not refused %', v_res; end if;
--   perform set_config('request.jwt.claims', null, true);
--   v_res := public.set_reel_guest_visible(v_event, false);
--   if (v_res->>'reason') is distinct from 'unauthorized' then
--     raise exception 'FAIL 7b: anonymous not refused %', v_res; end if;
--
--   -- 8. Grants.
--   if not has_function_privilege('anon', 'public.get_event_reel_by_qr_token(text)', 'execute')
--     then raise exception 'FAIL 8a'; end if;
--   if has_function_privilege('anon', 'public.set_reel_guest_visible(uuid, boolean)', 'execute')
--     then raise exception 'FAIL 8b'; end if;
--   if not has_function_privilege('authenticated', 'public.set_reel_guest_visible(uuid, boolean)', 'execute')
--     then raise exception 'FAIL 8c'; end if;
--   if not has_function_privilege('authenticated', 'public.reorder_reel(uuid, uuid[])', 'execute')
--     then raise exception 'FAIL 8d: reorder_reel grants lost in replace'; end if;
--
--   raise exception 'ROLLBACK_OK';
-- end;
-- $chk$;
-- rollback;
