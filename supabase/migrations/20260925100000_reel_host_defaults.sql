-- =============================================================================================
-- THE HOST'S REEL DEFAULTS AND THE DASHBOARD'S STILLS (lane `reel-defaults-migration`).
--
-- Will's pick on `reel-host` (2026-09-25): `style=both`, a host sets the reel's look and its hold for
-- everyone, from the view ("Set for everyone") and from a Highlight reel section in Settings; and on
-- `pulse`, the dashboard's event cards crossfade through their stills, one card a beat. The look has
-- its column already (events.reel_style_id, 20260924100000); the hold needs one, and a card needs a
-- few stills where event_covers answers one. Three changes, every one additive:
--   1. events.reel_hold_sec      the host's default hold in seconds (NULL = the default hold),
--                                host-written by column grant, inside an envelope CHECK.
--   2. get_event_by_qr_token     the guest event also returns reel_hold_sec, last and unredacted.
--   3. event_stills(uuid[], int) one jsonb: up to N of each event's newest previewed, approved photos.
--
-- ★ AN EXPAND: THE DEPLOYED CODE SURVIVES IT UNTOUCHED. partyreel.com and the launch-prep alias keep
-- calling today's shapes, so every change is additive from their side:
--   * The column is nullable with no default, so an insert or update that never names it lands a
--     correct row (NULL reads as the default hold), and no deployed code reads it.
--   * get_event_by_qr_token only GROWS its RETURNS TABLE, the new column last. Its reader
--     (getEventByQrToken, src/lib/db/queries/guest-events.ts) maps named fields, so the extra key is
--     ignored until the guest lane reads it. A RETURNS TABLE cannot grow under create-or-replace, so
--     it is a DROP + CREATE of its one signature inside this file's transaction.
--   * event_stills is new: nothing deployed calls it.
--
-- LOCKS: `alter table` holds ACCESS EXCLUSIVE on events until this transaction commits. The add is
-- catalog-only (nullable, no default); the CHECK is validated by one scan of events, every row NULL.
--
-- APPLY PROTOCOL (database-security.md -> Workflow):
--   (1) Drift, read-only: the live body's md5 equals its source file's (measured 2026-09-25):
--         get_event_by_qr_token (1 arg)          be4ec8731968894473dc2c78b30acc26  (20260924100000)
--       and neither events.reel_hold_sec nor event_stills exists yet:
--       select p.oid::regprocedure, md5(p.prosrc) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--        where n.nspname = 'public' and p.proname in ('get_event_by_qr_token', 'event_stills');
--   (2) Apply verbatim. The same query then reads two functions, one signature each, each body's md5
--       as this file's (measured on the live rolled-back proof, 2026-09-25, and hashed from this file):
--         get_event_by_qr_token (1 arg)          52a56b2144f5c0a302dae7027aefb0f3
--         event_stills (2 args)                  f0d4e91b56fcbfd94853f80772cce7f1
--   (3) The grants, restated in full because a drop takes them and a create inherits EXECUTE for
--       PUBLIC, anon, authenticated and service_role (Postgres's own default plus the project's
--       default privileges):
--         get_event_by_qr_token   postgres, PUBLIC, anon, authenticated, service_role (as today)
--         event_stills            postgres, authenticated, service_role (never anon, never PUBLIC)
--         events.reel_hold_sec    insert and update for authenticated, beside show_reel
--   (4) get_advisors. EXPECTED DELTA: NONE (15 rls_enabled_no_policy, 5 in 0028, 32 in 0029).
--       get_event_by_qr_token re-enters 0028 and 0029 under the same signature; event_stills is
--       SECURITY INVOKER, so it sits in neither list; no table is created.
--   (5) Regenerate src/lib/db/types.ts: the events column, the grown RETURNS TABLE, the new function.
--   (6) The rolled-back check at the foot (it rides the scale probe and ends in a deliberate raise).
-- =============================================================================================

-- =============================================================================================
-- 1. events.reel_hold_sec: the host's default hold.
-- =============================================================================================
-- Seconds a photograph stays before the next, the event's default; each viewer can still change it
-- on their own device, and that choice never travels. The app validates a write against the hold
-- steps (their one home: src/lib/reel/defaults.ts), so a new step needs no migration, like a new
-- mood for reel_style_id. The CHECK is only an ENVELOPE around every step, because the column is
-- host-writable by grant (a direct PostgREST write skips the app) and every guest device plays what
-- it holds: under half a second a photograph turns into a flicker, past thirty the reel stalls.
-- ★ BOTH BOUNDS ARE LOAD-BEARING: numeric's NaN sorts above every number (so `NaN >= 0.5` is true)
-- and 'Infinity' is a numeric too; the upper bound is what refuses both.
alter table public.events
  add column reel_hold_sec numeric
    constraint events_reel_hold_sec_range
    check (reel_hold_sec is null or (reel_hold_sec >= 0.5 and reel_hold_sec <= 30));

comment on column public.events.reel_hold_sec is
  'The host''s default hold for the live reel, in seconds: how long each photograph stays before the next. NULL = the default hold. App-validated against the hold steps by the Server Function that writes it (src/lib/reel/defaults.ts), so a new step never needs a migration; the CHECK is only the envelope (0.5 to 30 s) that refuses a flicker, a stall, NaN and Infinity. A viewer can change the hold on their own device as the reel plays; that choice is never written here.';

-- Host-writable by COLUMN grant, insert and update, beside show_reel and reel_style_id. SELECT on
-- events is table-level for authenticated (RLS scopes it to the host's own rows), so the host reads
-- it with no grant. ★ A bare additive grant and nothing else: a table-level revoke here would cascade
-- to every column grant on events and take the host app down (database-security.md, Gotchas).
grant insert (reel_hold_sec), update (reel_hold_sec) on public.events to authenticated;

-- =============================================================================================
-- 2. get_event_by_qr_token: the guest event also returns reel_hold_sec.
-- =============================================================================================
-- Carried from 20260924100000 with the QA #40 redaction and the `limit 1` verbatim: a non-owner of a
-- gated event gets no description, date, custom slug or host name, and no name for private. The new
-- column is appended UNREDACTED beside show_reel and reel_style_id: like qr_style and moderation_mode
-- it is a presentation setting, never the identifying metadata the redaction withholds, so an
-- unlocked viewer's reel starts at the host's hold with no second read.
drop function public.get_event_by_qr_token(text);

create function public.get_event_by_qr_token(p_qr_token text)
 returns table(
    id uuid, name text, description text, moderation_mode public.moderation_mode,
    visibility public.event_visibility, has_password boolean, accepting_uploads boolean,
    require_verified_email boolean, require_upload_to_view boolean,
    event_date date, qr_style text, qr_token text, custom_slug text, host_display_name text,
    show_reel boolean, reel_style_id text, reel_hold_sec numeric)
  language sql
  stable security definer
  set search_path to ''
as $function$
  select e.id,
         case when r.hide_name then null else e.name end,
         case when r.hide_meta then null else e.description end,
         e.moderation_mode, e.visibility,
         (e.event_password_hash is not null),
         e.accepting_uploads, e.require_verified_email, e.require_upload_to_view,
         case when r.hide_meta then null else e.event_date end,
         e.qr_style,
         e.qr_token,
         case when r.hide_meta then null else e.custom_slug end,
         case when r.hide_meta then null else p.display_name end,
         e.show_reel, e.reel_style_id, e.reel_hold_sec
  from public.events e
  left join public.profiles p on p.id = e.host_id
  cross join lateral (
    select
      (e.visibility <> 'open'
        and e.host_id is distinct from (select auth.uid())) as hide_meta,
      (e.visibility  = 'private'
        and e.host_id is distinct from (select auth.uid())) as hide_name
  ) r
  where e.deleted_at is null
    and (e.qr_token = p_qr_token
         or (e.custom_slug is not null and lower(e.custom_slug) = lower(p_qr_token)))
  order by (e.qr_token = p_qr_token) desc
  limit 1;
$function$;

-- One of the five accepted 0028 anon reads (the opaque token IS the authorization): the guest page
-- calls it on the anon/user client. Re-granted because the drop took the grant.
grant execute on function public.get_event_by_qr_token(text) to anon, authenticated;
-- And the rest of today's ACL, restated so the recreate matches it by statement rather than by the
-- project's default privileges: service_role, and the PUBLIC its earlier recreates inherited.
grant execute on function public.get_event_by_qr_token(text) to public, service_role;

-- =============================================================================================
-- 3. event_stills: the dashboard cards' crossfade, one jsonb for any number of events.
-- =============================================================================================
-- event_covers answers one photo per card; the crossfade needs a few. The shape:
-- { "<event id>": ["<preview key>", ...] }, newest first (created_at desc, id desc, the album's
-- order), up to p_per_event keys per event.
--   * PHOTOS, APPROVED, OUTSIDE THE BIN: what event_covers draws, so a still is never pending, hidden,
--     removed, or a video (a cut included).
--   * PREVIEWS ONLY: a card cycling full-resolution originals would pull tens of MB onto a phone,
--     so a photo with no preview (a pre-preview row, or one whose preview was skipped) is passed
--     over and the next one fills its place. An event with no previewed photo is ABSENT, and its
--     card keeps its cover from event_covers, which falls back to the original.
--   * p_per_event IS CLAMPED to 0..12 (twice the guest tile's six slots): one call's answer stays
--     small whatever a caller asks, and a null or non-positive N answers nothing, never everything.
--     One jsonb is not set-returning, so the 1,000-row cap cannot cut it (database-security.md,
--     "Set-returning functions and the row cap"); the ids ride the POST body as a uuid[].
-- SECURITY INVOKER: events_host_all and media_host_all scope a host to their own events, so another
-- host's event or an unknown id is simply absent, and the lateral walks media_event_created_id_idx
-- only for events the caller owns. It reads only columns authenticated holds a grant on. Granted to
-- authenticated alone: the dashboard reads it on the user's client, and anon never executes it.
create function public.event_stills(p_event_ids uuid[], p_per_event integer)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(jsonb_object_agg(e.id::text, s.preview_keys), '{}'::jsonb)
  from public.events e
  cross join lateral (
    select jsonb_agg(newest.preview_key order by newest.created_at desc, newest.id desc) as preview_keys
    from (
      select m.preview_key, m.created_at, m.id
      from public.media m
      where m.event_id = e.id
        and m.status = 'approved'
        and m.type = 'photo'
        and m.removed_at is null
        and m.preview_key is not null
      order by m.created_at desc, m.id desc
      limit least(greatest(p_per_event, 0), 12)
    ) newest
  ) s
  where e.id = any(p_event_ids)
    and s.preview_keys is not null;
$$;

-- Authenticated-only; every client role named, because a function created through the MCP inherits
-- an anon EXECUTE that a bare `revoke ... from public` leaves behind (CLAUDE.md's ★).
revoke all on function public.event_stills(uuid[], integer) from public, anon, authenticated;
grant execute on function public.event_stills(uuid[], integer) to authenticated;

comment on function public.event_stills(uuid[], integer) is
  'The dashboard cards'' stills: { event id: [preview_key, ...] }, up to p_per_event (clamped to 0..12) of each event''s newest approved, non-removed photos that carry a preview (created_at desc, id desc); an event with none is absent, and a null or non-positive p_per_event answers {}. SECURITY INVOKER: RLS scopes a host to their own events.';

-- =============================================================================================
-- THE ROLLED-BACK CHECK. Run it AFTER the apply, in one execute_sql call; it ends in a deliberate
-- raise, so nothing it touches persists (database-security.md, Workflow). It rides the scale probe
-- (event "Scale probe", qr d02631f1bfb3455188d224e41bf9510f, willg97's: 1,145 approved photos and no
-- previews), the probe host's busiest previewed album, another real host and a random stranger. The
-- error it ends on must read `ROLLED BACK: every reel_host_defaults check held {...}`.
-- The lane ran this same block (its notices aside) BEFORE the apply on the live project
-- (2026-09-25), with this file's statements executed at its head inside one DO block whose handler
-- undid them; it ended on the ROLLED BACK line above with the md5s in the protocol, and the catalog
-- read unchanged afterwards.
-- =============================================================================================
-- do $$
-- declare
--   c_qr constant text := 'd02631f1bfb3455188d224e41bf9510f';
--   -- The hold steps (src/lib/reel/defaults.ts): the envelope must admit every one.
--   c_steps constant numeric[] := array[1, 1.5, 2.2, 3, 3.6, 5, 7];
--   -- And refuse a flicker, a stall, zero, a negative and the three non-finite numerics.
--   c_refused constant numeric[] := array[0.4, 0, -1, 31, 'NaN', 'Infinity', '-Infinity']::numeric[];
--   -- The EXECUTE grantees each function must carry after the apply, sorted in the C collation.
--   c_acl constant jsonb := jsonb_build_object(
--     'event_stills', jsonb_build_array('authenticated', 'postgres', 'service_role'),
--     'get_event_by_qr_token', jsonb_build_array('PUBLIC', 'anon', 'authenticated', 'postgres', 'service_role'));
--   c_n constant integer := 3;
--   v_event uuid;
--   v_host uuid;
--   v_other uuid;
--   v_ids uuid[];
--   v_foreign uuid[];
--   v_busy uuid;
--   v_newest uuid[];
--   v_video uuid;
--   v_gone text[];
--   v_slug text := 'hold-check-' || substr(md5(random()::text), 1, 8);
--   v_step numeric;
--   v_n integer;
--   v_text text;
--   v_json jsonb;
--   v_hand jsonb;
--   v_acl jsonb;
--   v_report jsonb := '{}'::jsonb;
-- begin
--   select e.id, e.host_id into v_event, v_host from public.events e
--    where e.qr_token = c_qr and e.visibility = 'open' and e.deleted_at is null;
--   if v_event is null then raise exception 'SETUP: the scale probe (qr %) is not an open, live event', c_qr; end if;
--   select array_agg(e.id order by e.created_at) into v_ids from public.events e where e.host_id = v_host;
--   select array_agg(e.id) into v_foreign from public.events e where e.host_id <> v_host;
--   select e.host_id into v_other from public.events e where e.host_id <> v_host order by e.created_at limit 1;
--   if v_other is null then raise exception 'SETUP: no second host to read across'; end if;
--
--   -- ── 1. The shape: the column, its comment, its envelope, every row NULL ──
--   select c.data_type || ' ' || c.is_nullable || ' ' || coalesce(c.column_default, 'no default') into v_text
--     from information_schema.columns c
--    where c.table_schema = 'public' and c.table_name = 'events' and c.column_name = 'reel_hold_sec';
--   if v_text is distinct from 'numeric YES no default' then raise exception 'FAIL: reel_hold_sec reads %', v_text; end if;
--   if col_description('public.events'::regclass, (select a.attnum from pg_attribute a
--        where a.attrelid = 'public.events'::regclass and a.attname = 'reel_hold_sec')) is null then
--     raise exception 'FAIL: reel_hold_sec carries no comment';
--   end if;
--   select pg_get_constraintdef(c.oid) into v_text from pg_constraint c
--    where c.conrelid = 'public.events'::regclass and c.conname = 'events_reel_hold_sec_range' and c.contype = 'c';
--   if v_text is null then raise exception 'FAIL: the envelope CHECK is missing'; end if;
--   select count(*) into v_n from public.events where reel_hold_sec is not null;
--   if v_n <> 0 then raise exception 'FAIL: % events already hold a value', v_n; end if;
--   v_report := v_report || jsonb_build_object('envelope', v_text);
--   raise notice 'OK: the column, its comment, its envelope (%)', v_text;
--
--   -- ── 2. A fresh event reads a null hold, last in the payload ──
--   perform set_config('request.jwt.claims', '{}', true);
--   set local role anon;
--   select to_jsonb(t) into v_json from public.get_event_by_qr_token(c_qr) t;
--   reset role;
--   if v_json -> 'reel_hold_sec' is distinct from 'null'::jsonb then
--     raise exception 'FAIL: a fresh event read reel_hold_sec = %', v_json -> 'reel_hold_sec';
--   end if;
--   if pg_get_function_result('public.get_event_by_qr_token(text)'::regprocedure)
--        not like '%, show_reel boolean, reel_style_id text, reel_hold_sec numeric)' then
--     raise exception 'FAIL: the RETURNS TABLE reads %', pg_get_function_result('public.get_event_by_qr_token(text)'::regprocedure);
--   end if;
--   raise notice 'OK: a fresh event reads a null hold, the last column';
--
--   -- ── 3. The host writes every step and clears it; the envelope refuses the rest; nobody else writes ──
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   foreach v_step in array c_steps loop
--     update public.events set reel_hold_sec = v_step where id = v_event;
--     get diagnostics v_n = row_count;
--     if v_n <> 1 then raise exception 'FAIL: the host''s write of % touched % rows', v_step, v_n; end if;
--   end loop;
--   update public.events set reel_hold_sec = null where id = v_event;
--   get diagnostics v_n = row_count;
--   if v_n <> 1 then raise exception 'FAIL: the host could not clear the hold (% rows)', v_n; end if;
--   foreach v_step in array c_refused loop
--     begin
--       update public.events set reel_hold_sec = v_step where id = v_event;
--       raise exception 'FAIL: the envelope admitted %', v_step;
--     exception when check_violation then null;
--     end;
--   end loop;
--   update public.events set reel_hold_sec = 2.2 where id = v_event;
--   reset role;
--   perform set_config('request.jwt.claims', json_build_object('sub', v_other, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   update public.events set reel_hold_sec = 7 where id = v_event;
--   get diagnostics v_n = row_count;
--   reset role;
--   if v_n <> 0 then raise exception 'FAIL: another host''s write reached the probe (% rows)', v_n; end if;
--   perform set_config('request.jwt.claims', '{}', true);
--   set local role anon;
--   begin
--     update public.events set reel_hold_sec = 7 where id = v_event;
--     raise exception 'FAIL: anon wrote events.reel_hold_sec';
--   exception when insufficient_privilege then null;
--   end;
--   reset role;
--   if not has_column_privilege('authenticated', 'public.events', 'reel_hold_sec', 'insert')
--      or not has_column_privilege('authenticated', 'public.events', 'reel_hold_sec', 'update')
--      or not has_column_privilege('authenticated', 'public.events', 'reel_hold_sec', 'select')
--      or has_column_privilege('anon', 'public.events', 'reel_hold_sec', 'insert')
--      or has_column_privilege('anon', 'public.events', 'reel_hold_sec', 'update')
--      or not has_column_privilege('authenticated', 'public.events', 'show_reel', 'update')
--      or not has_column_privilege('authenticated', 'public.events', 'reel_style_id', 'update')
--      or not has_column_privilege('authenticated', 'public.events', 'show_guest_list', 'update')
--      or has_column_privilege('authenticated', 'public.events', 'custom_slug', 'update')
--      or has_column_privilege('authenticated', 'public.events', 'event_password_hash', 'update') then
--     raise exception 'FAIL: a column grant moved';
--   end if;
--   v_report := v_report || jsonb_build_object('steps_written', cardinality(c_steps), 'refused', cardinality(c_refused));
--   raise notice 'OK: the host writes every step and null; % values refused; another host and anon write nothing', cardinality(c_refused);
--
--   -- ── 4. The payload: the hold unredacted for anon and the owner; QA #40 and the slug path hold ──
--   perform set_config('request.jwt.claims', '{}', true);
--   set local role anon;
--   select to_jsonb(t) into v_json from public.get_event_by_qr_token(c_qr) t;
--   reset role;
--   if v_json -> 'reel_hold_sec' is distinct from '2.2'::jsonb then
--     raise exception 'FAIL: anon read reel_hold_sec = %', v_json -> 'reel_hold_sec';
--   end if;
--   if (select count(*) from jsonb_object_keys(v_json) as k(key)) <> 17 or not (v_json ?& array['id', 'name', 'description',
--       'moderation_mode', 'visibility', 'has_password', 'accepting_uploads', 'require_verified_email',
--       'require_upload_to_view', 'event_date', 'qr_style', 'qr_token', 'custom_slug', 'host_display_name',
--       'show_reel', 'reel_style_id', 'reel_hold_sec']) then
--     raise exception 'FAIL: the payload''s keys read %', v_json;
--   end if;
--   -- A password event, reached by its custom slug in another case: the redaction and `limit 1` hold.
--   update public.events set visibility = 'password', event_password_hash = 'hold-check-hash',
--          description = 'Hold check', event_date = current_date, custom_slug = v_slug
--    where id = v_event;
--   set local role anon;
--   select to_jsonb(t) into v_json from public.get_event_by_qr_token(upper(v_slug)) t;
--   reset role;
--   if v_json ->> 'id' is distinct from v_event::text then
--     raise exception 'FAIL: the custom slug, upper-cased, resolved %', v_json ->> 'id';
--   end if;
--   if v_json ->> 'description' is not null or v_json ->> 'event_date' is not null or v_json ->> 'custom_slug' is not null
--      or v_json ->> 'host_display_name' is not null or v_json ->> 'name' is null
--      or v_json -> 'reel_hold_sec' is distinct from '2.2'::jsonb then
--     raise exception 'FAIL: the password payload reads %', v_json;
--   end if;
--   v_report := v_report || jsonb_build_object('anon_reads_password', jsonb_build_object(
--     'description', v_json -> 'description', 'custom_slug', v_json -> 'custom_slug', 'name_present', v_json ->> 'name' is not null,
--     'reel_hold_sec', v_json -> 'reel_hold_sec'));
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   select to_jsonb(t) into v_json from public.get_event_by_qr_token(c_qr) t;
--   reset role;
--   if v_json ->> 'description' is distinct from 'Hold check' or v_json -> 'reel_hold_sec' is distinct from '2.2'::jsonb then
--     raise exception 'FAIL: the owner''s payload reads %', v_json;
--   end if;
--   update public.events set visibility = 'private' where id = v_event;
--   perform set_config('request.jwt.claims', '{}', true);
--   set local role anon;
--   select to_jsonb(t) into v_json from public.get_event_by_qr_token(c_qr) t;
--   reset role;
--   if v_json ->> 'name' is not null or v_json ->> 'description' is not null
--      or v_json -> 'reel_hold_sec' is distinct from '2.2'::jsonb then
--     raise exception 'FAIL: the private payload reads %', v_json;
--   end if;
--   raise notice 'OK: the hold reads unredacted for anon and the owner; QA #40 and the slug path hold';
--
--   -- ── 5. event_stills: up to N of the newest previewed, approved photos per event, the host's alone ──
--   select m.event_id into v_busy
--     from public.media m join public.events e on e.id = m.event_id
--    where e.host_id = v_host and m.status = 'approved' and m.type = 'photo' and m.removed_at is null
--      and m.preview_key is not null
--    group by m.event_id order by count(*) desc, m.event_id limit 1;
--   select array_agg(q.id order by q.k) into v_newest
--     from (select m.id, row_number() over (order by m.created_at desc, m.id desc) as k
--             from public.media m
--            where m.event_id = v_busy and m.status = 'approved' and m.type = 'photo' and m.removed_at is null
--              and m.preview_key is not null) q
--    where q.k <= 4;
--   select m.id into v_video from public.media m
--    where m.event_id = v_busy and m.type = 'video' and m.status = 'approved' and m.preview_key is not null
--    order by m.created_at desc, m.id desc limit 1;
--   if cardinality(v_newest) < 4 or v_video is null
--      or (select count(*) from public.media m where m.event_id = v_busy and m.status = 'approved' and m.type = 'photo'
--            and m.removed_at is null and m.preview_key is not null) < 16 then
--     raise exception 'SETUP: the busiest album needs 16 previewed photos and a previewed video';
--   end if;
--   -- Each exclusion becomes the NEWEST item in that album, so a filter that failed would put it first:
--   -- a hidden photo, a removed one, a pending one, a photo with no preview, and a video with one.
--   select array_agg(m.preview_key) into v_gone from public.media m where m.id = any(v_newest || v_video);
--   update public.media set status = 'hidden', created_at = now() + interval '5 minutes' where id = v_newest[1];
--   update public.media set status = 'removed', removed_at = now(), created_at = now() + interval '4 minutes' where id = v_newest[2];
--   update public.media set status = 'pending', created_at = now() + interval '3 minutes' where id = v_newest[3];
--   update public.media set preview_key = null, created_at = now() + interval '2 minutes' where id = v_newest[4];
--   update public.media set created_at = now() + interval '1 minute' where id = v_video;
--   -- The hand tally, by a window over every photo rather than the function's lateral limit.
--   select coalesce(jsonb_object_agg(t.event_id::text, t.keys), '{}'::jsonb) into v_hand
--     from (select r.event_id, jsonb_agg(r.preview_key order by r.k) as keys
--             from (select m.event_id, m.preview_key,
--                          row_number() over (partition by m.event_id order by m.created_at desc, m.id desc) as k
--                     from public.media m join public.events e on e.id = m.event_id
--                    where e.host_id = v_host and m.status = 'approved' and m.type = 'photo'
--                      and m.removed_at is null and m.preview_key is not null) r
--            where r.k <= c_n
--            group by r.event_id) t;
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   -- Every event of the host, every other host's event, a duplicate, a null and an unknown id.
--   v_json := public.event_stills(v_ids || v_foreign || array[v_ids[1], null::uuid, gen_random_uuid()], c_n);
--   reset role;
--   if v_json is distinct from v_hand then raise exception 'FAIL: event_stills % differs from the hand tally %', v_json, v_hand; end if;
--   if jsonb_array_length(v_json -> v_busy::text) <> c_n then
--     raise exception 'FAIL: the busiest album answered % stills for %', jsonb_array_length(v_json -> v_busy::text), c_n;
--   end if;
--   if exists (select 1 from jsonb_array_elements_text(v_json -> v_busy::text) as k(key) where k.key = any(v_gone)) then
--     raise exception 'FAIL: an excluded item reached the stills: %', v_json -> v_busy::text;
--   end if;
--   if v_json ? v_event::text then raise exception 'FAIL: the probe, with no preview, answered stills'; end if;
--   if exists (select 1 from jsonb_object_keys(v_json) as k(id) where k.id::uuid <> all(v_ids)) then
--     raise exception 'FAIL: a key outside the host''s events: %', v_json;
--   end if;
--   v_report := v_report || jsonb_build_object('stills', (select jsonb_object_agg(x.key, jsonb_array_length(x.value)) from jsonb_each(v_json) x));
--   -- The clamp and the degenerate calls.
--   set local role authenticated;
--   v_json := public.event_stills(v_ids, 1000);
--   if jsonb_array_length(v_json -> v_busy::text) <> 12
--      or exists (select 1 from jsonb_each(v_json) x where jsonb_array_length(x.value) > 12) then
--     raise exception 'FAIL: p_per_event 1000 was not clamped to 12: %', v_json;
--   end if;
--   if public.event_stills(v_ids, 0) <> '{}'::jsonb or public.event_stills(v_ids, -5) <> '{}'::jsonb
--      or public.event_stills(v_ids, null) <> '{}'::jsonb or public.event_stills(null, c_n) <> '{}'::jsonb
--      or public.event_stills('{}', c_n) <> '{}'::jsonb then
--     raise exception 'FAIL: a degenerate call answered something';
--   end if;
--   reset role;
--   -- Another host, a stranger and anon read nothing.
--   perform set_config('request.jwt.claims', json_build_object('sub', v_other, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v_json := public.event_stills(v_ids, c_n);
--   reset role;
--   if v_json <> '{}'::jsonb then raise exception 'FAIL: another host read %', v_json; end if;
--   perform set_config('request.jwt.claims', json_build_object('sub', gen_random_uuid(), 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v_json := public.event_stills(v_ids, c_n);
--   reset role;
--   if v_json <> '{}'::jsonb then raise exception 'FAIL: a stranger read %', v_json; end if;
--   perform set_config('request.jwt.claims', '{}', true);
--   set local role anon;
--   begin
--     perform public.event_stills(v_ids, c_n);
--     raise exception 'FAIL: anon executed event_stills';
--   exception when insufficient_privilege then null;
--   end;
--   reset role;
--   raise notice 'OK: event_stills equals a hand tally, excludes all five, clamps at 12; another host, a stranger and anon read nothing';
--
--   -- ── 6. The grants, the security modes, one signature each ──
--   select jsonb_object_agg(p.proname, (
--            select jsonb_agg(x.g order by x.g collate "C")
--              from (select case when a.grantee = 0 then 'PUBLIC' else a.grantee::regrole::text end as g
--                      from aclexplode(p.proacl) a
--                     where a.privilege_type = 'EXECUTE') x))
--     into v_acl
--     from pg_proc p
--    where p.pronamespace = 'public'::regnamespace and p.proname in ('event_stills', 'get_event_by_qr_token');
--   if v_acl is distinct from c_acl then raise exception 'FAIL: the grants read % (want %)', v_acl, c_acl; end if;
--   if (select count(*) from pg_proc p where p.pronamespace = 'public'::regnamespace
--        and p.proname in ('event_stills', 'get_event_by_qr_token')) <> 2 then
--     raise exception 'FAIL: expected exactly one signature each (PostgREST refuses overloads)';
--   end if;
--   if not (select p.prosecdef from pg_proc p where p.oid = 'public.get_event_by_qr_token(text)'::regprocedure)
--      or (select p.prosecdef from pg_proc p where p.oid = 'public.event_stills(uuid[], integer)'::regprocedure)
--      or exists (select 1 from pg_proc p where p.pronamespace = 'public'::regnamespace
--                  and p.proname in ('event_stills', 'get_event_by_qr_token')
--                  and p.proconfig is distinct from array['search_path=""']) then
--     raise exception 'FAIL: a security mode or a search_path moved (the read DEFINER, the stills INVOKER, both pinned empty)';
--   end if;
--   v_report := v_report || jsonb_build_object('grants', v_acl, 'md5', (
--     select jsonb_object_agg(p.proname, md5(p.prosrc)) from pg_proc p
--      where p.pronamespace = 'public'::regnamespace and p.proname in ('event_stills', 'get_event_by_qr_token')));
--   raise notice 'OK: the grants, one signature each, the security modes and the search_path';
--
--   raise exception 'ROLLED BACK: every reel_host_defaults check held %', v_report;
-- end $$;
