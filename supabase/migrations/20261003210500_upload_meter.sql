-- =============================================================================================
-- THE PRESIGN'S METER AND TWO BREAKERS (lane `upload-meter`, 2026-10-03; Will's pricing rethink, PRICING.md "What it
-- costs us", the levers' preconditions; reworked on the Advisor's Q19): the monthly meter counts what landed, once,
-- at complete (`create_media*` as 20261003110000 left them, untouched here), and the app's staging prefix makes
-- "what landed" mean what a complete copied into `events/` (src/lib/upload/server-pipeline.ts): an unsent byte never
-- counts, an abandoned one never persists past the staging rule's day, and a phantom presign costs nothing. This file
-- gives the presign its refusals and two unpublished breakers far past any party.
--
--   1. `storage_ledger` gains the hourly breaker's clock hour and its count (`hour_started_at`, `hour_uploads`), on
--      the month's own row.
--   2. `meter_upload(p_event_id, p_type, p_bytes)`, the presign's meter: refuse, before a byte moves, past an
--      account's 20,000 uploads a clock hour (the breaker), past the month's allowance (the month's bytes plus this
--      file's declared ones past `monthly_ingress_cap()`, the line `create_media*` hold at complete) or past the room
--      (`host_active_bytes()` plus the file past the cap and its 10%, as at complete), else tally the hour. It counts
--      NOTHING of the month (`cumulative_bytes`, `photo_count`, `video_count` are the complete's), so it takes no
--      profiles lock: the month and the room are advisory reads here, held for real at complete, and the hour's tally
--      is one upsert, atomic on its own row, whose WHERE refuses the 20,001st even when two presigns race past the
--      early read. SECURITY DEFINER, the service role's alone: the presign routes call it on the admin client with the
--      event their own gates resolved, and fail OPEN when it cannot answer.
--   3. `enforce_event_limit()`, replaced in place: verbatim from 20260827210000, then the daily breaker on a CREATION
--      only (`tg_op = 'INSERT'`; its undelete trigger is a restore, never a creation): an account's 100th event in any
--      24 hours is its last that day, a deleted one included (a create-and-delete loop counts), refused in words the
--      create action reads (`src/lib/db/mutations/events.ts`). After the plan's own limit, whose published sentence
--      is the truer one when both hold.
--
-- Neither breaker is published (PRICING.md, "(c) Bounds"; billing-caps.md): "no guest limit" and "unlimited events"
-- stay true. Each number is this file's constant and its WHY.
--
-- AN EXPAND, NO ORDER AGAINST ANY DEPLOYMENT: nothing deployed calls `meter_upload` or reads the two columns, and the
-- lane's code fails OPEN without them (its presign goes on, reported), so the alias and partyreel.com may run either
-- code on either side of this file. The one behaviour that arrives with it is the daily breaker, for both: an app
-- before the lane's code words it as its plan limit, and only an account past 100 creations a day can meet it.
--
-- LOCKS AT APPLY: `storage_ledger` (two ADD COLUMNs with constant defaults, metadata only, and one CHECK validated over
-- its rows, a handful); one CREATE and one CREATE OR REPLACE (catalog only). No hot table is rewritten.
--
-- ADVISORS: no delta expected (19 / 4 / 35). `meter_upload` is the service role's alone, so in neither 0028 nor 0029;
-- no table, policy or client grant is added.
--
-- APPLY PROTOCOL (database-security.md, Workflow):
--   (1) Drift, read-only: `enforce_event_limit` hashes 0bc037221ea8dbf348072024e173452a (md5 of the
--       whitespace-collapsed prosrc), the file's 20260827210000 body; `meter_upload` and the two columns do not exist;
--       `create_media` and `create_media_as_host` still hash e83666cd... and 21f0397f... (this file never touches them).
--   (2) Apply verbatim.  (3) get_advisors (security): unchanged.
--   (4) Regenerate src/lib/db/types.ts (meter_upload joins Functions; storage_ledger gains its two columns), then drop
--       the typed seam in src/lib/upload/server-pipeline-meter.ts (`untyped`).
--   (5) The rolled-back check at the foot, in one execute_sql call.
-- =============================================================================================

-- =============================================================================================
-- 1. The hourly breaker's count, on the month's row.
-- =============================================================================================
alter table public.storage_ledger
  add column hour_started_at timestamptz,
  add column hour_uploads integer not null default 0;

alter table public.storage_ledger
  add constraint storage_ledger_hour_uploads_nonneg check (hour_uploads >= 0);

comment on column public.storage_ledger.hour_started_at is
  'The clock hour (UTC) hour_uploads counts, written by meter_upload at every presign it admits. NULL until this month''s row meets its first.';
comment on column public.storage_ledger.hour_uploads is
  'Presigns admitted in hour_started_at, the hourly breaker''s tally (meter_upload refuses the next past its constant). Restarts at 1 with each new hour. Counts no bytes: the month''s columns are create_media*''s.';

-- =============================================================================================
-- 2. The presign's meter.
-- =============================================================================================
create function public.meter_upload(
  p_event_id uuid,
  p_type public.media_type,
  p_bytes bigint
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_host uuid;
  v_tier public.tier_type;
  v_storage_cap bigint;
  v_ledger public.storage_ledger;
  v_period text := to_char(now(), 'YYYY-MM'); -- the month's key, as every reader and writer of the meter writes it
  v_hour timestamptz := pg_catalog.date_trunc('hour', now(), 'UTC');
  v_cap bigint;
  v_ingress_cap bigint;
  v_tallied integer;
  c_max_upload_bytes constant bigint := 10::bigint * 1024 * 1024 * 1024; -- 10 GiB (mirrors MAX_UPLOAD_BYTES)
  -- ★ THE HOURLY BREAKER: an account's uploads (her own and every guest's, into all her events) a clock hour. Far past
  -- any party: the 2,000-guest wedding averages about 2,000 an hour and might peak near 4,000, a venue holding three at
  -- once about 12,000; a script's tiny files stop here, and a real host never meets it (unpublished).
  c_uploads_an_hour constant integer := 20000;
begin
  if p_event_id is null or p_type is null or p_bytes is null or p_bytes < 1 or p_bytes > c_max_upload_bytes then
    raise exception 'meter_upload needs an event, a type and 1 to % bytes.', c_max_upload_bytes
      using errcode = 'invalid_parameter_value';
  end if;

  -- The event as the route's gates resolved it, and its host's plan: plain reads, no lock. An upload never locks the
  -- event row (a measured deadlock cycle, 20261002200000), and with no month to spend this needs no profiles lock.
  select e.host_id into v_host from public.events e where e.id = p_event_id and e.deleted_at is null;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'event_gone');
  end if;
  select p.tier, p.storage_cap_bytes into v_tier, v_storage_cap from public.profiles p where p.id = v_host;
  select * into v_ledger from public.storage_ledger where host_id = v_host and period = v_period;

  -- The breaker's early read: a runaway past it pays this one read, never the storage sum below.
  if v_ledger.hour_started_at = v_hour and v_ledger.hour_uploads >= c_uploads_an_hour then
    return jsonb_build_object(
      'ok', false,
      'reason', 'hourly',
      'retry_after_sec', greatest(1, ceil(extract(epoch from (v_hour + interval '1 hour' - now()))))::integer
    );
  end if;

  -- The month, advisory: the line create_media* hold at complete, read before a byte moves (NULL = unmetered: a paid
  -- profile with no cap on record fails open, as there).
  v_ingress_cap := public.monthly_ingress_cap(v_tier, v_storage_cap);
  if v_ingress_cap is not null and coalesce(v_ledger.cumulative_bytes, 0) + p_bytes > v_ingress_cap then
    return jsonb_build_object('ok', false, 'reason', 'monthly');
  end if;

  -- The room, advisory: the storage cap and its 10%, as create_media* will judge this file on its HEAD. A Free
  -- profile's null cap is its plan's default (tier_limits), as every cap read takes it.
  v_cap := coalesce(v_storage_cap, (select l.default_storage_cap_bytes from public.tier_limits(v_tier) l));
  if v_cap is not null and public.host_active_bytes(v_host) + p_bytes > v_cap + (v_cap / 10) then
    return jsonb_build_object('ok', false, 'reason', 'storage');
  end if;

  -- The hour's tally, atomic on its own row: the upsert holds that row while it decides, and its WHERE refuses the
  -- 20,001st of an hour even when two presigns raced past the early read. A new hour starts the tally at one. The
  -- month's columns are never written here (a first presign of the month makes the row with their zero defaults).
  insert into public.storage_ledger as l (host_id, period, hour_started_at, hour_uploads)
  values (v_host, v_period, v_hour, 1)
  on conflict (host_id, period) do update set
    hour_uploads = case when l.hour_started_at = excluded.hour_started_at then l.hour_uploads + 1 else 1 end,
    hour_started_at = excluded.hour_started_at
  where l.hour_started_at is distinct from excluded.hour_started_at or l.hour_uploads < c_uploads_an_hour
  returning l.hour_uploads into v_tallied;

  if v_tallied is null then
    return jsonb_build_object(
      'ok', false,
      'reason', 'hourly',
      'retry_after_sec', greatest(1, ceil(extract(epoch from (v_hour + interval '1 hour' - now()))))::integer
    );
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

comment on function public.meter_upload(uuid, public.media_type, bigint) is
  'The presign''s meter (upload-meter): refuse past the hourly breaker, the month''s allowance or the storage cap and its 10%, else tally the hour. Counts NOTHING of the month (create_media* count what landed, at complete). No profiles lock: advisory reads and one atomic upsert. Service role only: the presign routes call it after their own gates and fail open without it.';

revoke execute on function public.meter_upload(uuid, public.media_type, bigint) from public, anon, authenticated;
grant execute on function public.meter_upload(uuid, public.media_type, bigint) to service_role;

-- =============================================================================================
-- 3. An account's events a day.
-- =============================================================================================
create or replace function public.enforce_event_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tier public.tier_type;
  v_slots integer;
  v_max integer;
  v_count integer;
  -- ★ THE DAILY BREAKER: an account's creations in any 24 hours. Far past any host (the busiest day on record is 34,
  -- the red-teams' own), so it stops a script and never a party; unpublished, and "unlimited events" stays true.
  c_events_a_day constant integer := 100;
begin
  -- QA #17: serialize concurrent slot decisions for this host before counting.
  perform 1 from public.profiles where id = new.host_id for update;

  select tier, event_slots into v_tier, v_slots from public.profiles where id = new.host_id;
  select coalesce(v_slots, max_events) into v_max from public.tier_limits(v_tier);

  if v_max is not null then
    select count(*) into v_count
    from public.events
    where host_id = new.host_id and deleted_at is null;

    if v_count >= v_max then
      raise exception 'Event limit reached for the % plan (max % event(s)). Delete an event or upgrade.', v_tier, v_max
        using errcode = 'check_violation';
    end if;
  end if;

  -- ★ THE DAILY BREAKER (20261003210500), on a creation only: the undelete trigger runs this body too, and a restore
  -- creates nothing. Every event the account created in the last 24 hours counts, a deleted one too (created_at is no
  -- client's to write), so a create-and-delete loop meets it as surely as a pile. Under the lock above, so two
  -- creations never both read 99. Its words are the refusal the create action shows (mutations/events.ts reads them).
  if tg_op = 'INSERT' then
    select count(*) into v_count
    from public.events
    where host_id = new.host_id and created_at > now() - interval '24 hours';

    if v_count >= c_events_a_day then
      raise exception 'You''ve created a lot of events today. Try again tomorrow.'
        using errcode = 'check_violation';
    end if;
  end if;

  return new;
end;
$$;

-- Trigger functions are client-invisible machinery (20260529003631), restated with the replace.
revoke execute on function public.enforce_event_limit() from public, anon, authenticated;

-- =============================================================================================
-- THE ROLLED-BACK PROOF (database-security.md, "An unapplied migration is proved on the live schema"): one
-- execute_sql call, `begin;` + this file's statements + the steps below + `rollback;`, riding the export wiring probe
-- (340fcc7b-6c41-48f6-a143-6ef9f6724f4b: live, open, upload capture, no develop time, its Pro host) and one of its
-- tickets. Each step traps its own failure into the temp `proof` table; the final select is the answer. The RED run is
-- the same call without this file's statements.
-- =============================================================================================
-- create temp table proof (n serial, step text, ok boolean, detail text);
--
-- create function pg_temp.ledger(p_host uuid)
-- returns table (bytes bigint, items bigint, hour_at timestamptz, hour_n integer)
-- language sql as $f$
--   select coalesce(sum(cumulative_bytes), 0)::bigint, coalesce(sum(photo_count + video_count), 0)::bigint,
--          max((to_jsonb(l) ->> 'hour_started_at')::timestamptz), max((to_jsonb(l) ->> 'hour_uploads')::integer)
--     from public.storage_ledger l where host_id = p_host and period = to_char(now(), 'YYYY-MM');
-- $f$;
--
-- create function pg_temp.meter(p_event uuid, p_type public.media_type, p_bytes bigint)
-- returns jsonb language plpgsql as $f$
-- begin
--   return public.meter_upload(p_event_id => p_event, p_type => p_type, p_bytes => p_bytes);
-- exception when others then
--   return jsonb_build_object('error', sqlstate || ' ' || sqlerrm);
-- end $f$;
--
-- create function pg_temp.host_put(p_bytes bigint)
-- returns text language plpgsql as $f$
-- declare v_event uuid := '340fcc7b-6c41-48f6-a143-6ef9f6724f4b'; v_host uuid; mid uuid := gen_random_uuid();
-- begin
--   select host_id into v_host from public.events where id = v_event;
--   perform public.create_media_as_host(
--     p_host_id => v_host, p_event_id => v_event, p_media_id => mid, p_type => 'photo',
--     p_original_key => 'events/' || v_event || '/photo/' || mid || '/original.jpg', p_file_size_bytes => p_bytes);
--   return 'recorded';
-- exception when others then
--   return sqlstate || ' ' || sqlerrm;
-- end $f$;
--
-- -- 1. the hour's two columns, and no client role reads the ledger
-- do $$
-- declare cols int; bad text := '';
-- begin
--   select count(*) into cols from information_schema.columns
--    where table_schema = 'public' and table_name = 'storage_ledger'
--      and ((column_name = 'hour_started_at' and data_type = 'timestamp with time zone' and is_nullable = 'YES')
--        or (column_name = 'hour_uploads' and data_type = 'integer' and is_nullable = 'NO' and column_default = '0'));
--   if cols <> 2 then bad := bad || ' columns=' || cols; end if;
--   if has_table_privilege('authenticated', 'public.storage_ledger', 'SELECT') then bad := bad || ' authenticated-reads'; end if;
--   if has_table_privilege('anon', 'public.storage_ledger', 'SELECT') then bad := bad || ' anon-reads'; end if;
--   if bad <> '' then raise exception '%', bad; end if;
--   insert into proof (step, ok, detail) values ('1 the hour''s two columns; no client role reads the ledger', true, 'hour_started_at timestamptz null, hour_uploads integer not null default 0');
-- exception when others then
--   insert into proof (step, ok, detail) values ('1 the hour''s two columns; no client role reads the ledger', false, sqlerrm);
-- end $$;
--
-- -- 2. meter_upload: one signature, a definer with an empty search_path, the service role's alone
-- do $$
-- declare bad text := ''; r record; n int;
-- begin
--   select count(*) into n from pg_proc p join pg_namespace s on s.oid = p.pronamespace where s.nspname = 'public' and p.proname = 'meter_upload';
--   if n <> 1 then raise exception 'overloads=%', n; end if;
--   select pg_get_function_identity_arguments(p.oid) as args, array_to_string(p.proacl, ',') as acl, p.prosecdef, p.proconfig
--     into r from pg_proc p join pg_namespace s on s.oid = p.pronamespace where s.nspname = 'public' and p.proname = 'meter_upload';
--   if r.args <> 'p_event_id uuid, p_type media_type, p_bytes bigint' then bad := bad || ' args:' || r.args; end if;
--   if r.acl is distinct from 'postgres=X/postgres,service_role=X/postgres' then bad := bad || ' acl:' || coalesce(r.acl, 'null'); end if;
--   if not r.prosecdef then bad := bad || ' not-definer'; end if;
--   if r.proconfig is distinct from array['search_path=""'] then bad := bad || ' config:' || coalesce(array_to_string(r.proconfig, ','), 'null'); end if;
--   if has_function_privilege('anon', 'public.meter_upload(uuid, public.media_type, bigint)', 'EXECUTE') then bad := bad || ' anon-executes'; end if;
--   if has_function_privilege('authenticated', 'public.meter_upload(uuid, public.media_type, bigint)', 'EXECUTE') then bad := bad || ' authenticated-executes'; end if;
--   if bad <> '' then raise exception '%', bad; end if;
--   insert into proof (step, ok, detail) values ('2 meter_upload: one signature, definer, empty search_path, service role alone', true, r.acl);
-- exception when others then
--   insert into proof (step, ok, detail) values ('2 meter_upload: one signature, definer, empty search_path, service role alone', false, sqlerrm);
-- end $$;
--
-- -- 3. a presign's meter counts nothing of the month, takes no lock on the host's row, and tallies the hour
-- do $$
-- declare v_event uuid := '340fcc7b-6c41-48f6-a143-6ef9f6724f4b'; v_host uuid; a record; b record; j jsonb; x0 text; x1 text; v_expect int;
-- begin
--   select host_id into v_host from public.events where id = v_event;
--   select * into a from pg_temp.ledger(v_host);
--   select xmax::text into x0 from public.profiles where id = v_host;
--   j := public.meter_upload(p_event_id => v_event, p_type => 'photo', p_bytes => 3000000);
--   select xmax::text into x1 from public.profiles where id = v_host;
--   select * into b from pg_temp.ledger(v_host);
--   if j <> '{"ok": true}'::jsonb then raise exception 'answer %', j; end if;
--   if b.bytes <> a.bytes or b.items <> a.items then raise exception 'the month moved: bytes +%, items +%', b.bytes - a.bytes, b.items - a.items; end if;
--   if x1 is distinct from x0 then raise exception 'the host''s row was locked (xmax % -> %)', x0, x1; end if;
--   v_expect := case when a.hour_at = b.hour_at then a.hour_n + 1 else 1 end;
--   if b.hour_at <> date_trunc('hour', now(), 'UTC') or b.hour_n <> v_expect then
--     raise exception 'the hour: % at %, from % at %', b.hour_n, b.hour_at, a.hour_n, a.hour_at;
--   end if;
--   insert into proof (step, ok, detail) values ('3 a presign''s meter counts nothing of the month, locks no host row, tallies the hour', true,
--     format('bytes +%s, items +%s; profiles xmax %s unchanged; hour %s at %s', b.bytes - a.bytes, b.items - a.items, x1, b.hour_n, b.hour_at));
-- exception when others then
--   insert into proof (step, ok, detail) values ('3 a presign''s meter counts nothing of the month, locks no host row, tallies the hour', false, sqlerrm);
-- end $$;
--
-- -- 4. the complete counts once, on its real size, host and guest; the meter before each moved nothing
-- do $$
-- declare v_event uuid := '340fcc7b-6c41-48f6-a143-6ef9f6724f4b'; v_host uuid; v_token text; gid uuid := gen_random_uuid();
--         a record; b record; c record; d record; x0 text; x1 text; j1 jsonb; j2 jsonb; got text;
-- begin
--   select host_id into v_host from public.events where id = v_event;
--   select g.session_token into v_token from public.guests g
--    where g.event_id = v_event and g.admission <> 'waiting' and not public.event_block_holds_row(g)
--    order by g.created_at limit 1;
--   if v_token is null then raise exception 'no ticket to ride'; end if;
--   select * into a from pg_temp.ledger(v_host);
--   j1 := public.meter_upload(p_event_id => v_event, p_type => 'photo', p_bytes => 3000000);
--   select * into b from pg_temp.ledger(v_host);
--   select xmax::text into x0 from public.profiles where id = v_host;
--   got := pg_temp.host_put(3000000);
--   select xmax::text into x1 from public.profiles where id = v_host;
--   select * into c from pg_temp.ledger(v_host);
--   j2 := public.meter_upload(p_event_id => v_event, p_type => 'photo', p_bytes => 2400000);
--   perform public.create_media(
--     p_session_token => v_token, p_media_id => gid, p_type => 'photo',
--     p_original_key => 'events/' || v_event || '/photo/' || gid || '/original.jpg', p_file_size_bytes => 2400000);
--   select * into d from pg_temp.ledger(v_host);
--   if j1 <> '{"ok": true}'::jsonb or j2 <> '{"ok": true}'::jsonb or got <> 'recorded' then raise exception 'answers % % %', j1, j2, got; end if;
--   if b.bytes <> a.bytes then raise exception 'the meter counted +%', b.bytes - a.bytes; end if;
--   if c.bytes - b.bytes <> 3000000 or c.items - b.items <> 1 then raise exception 'the host''s complete: +% bytes, +% items', c.bytes - b.bytes, c.items - b.items; end if;
--   if d.bytes - c.bytes <> 2400000 or d.items - c.items <> 1 then raise exception 'the guest''s complete: +% bytes, +% items', d.bytes - c.bytes, d.items - c.items; end if;
--   if x1 is not distinct from x0 then raise exception 'the control: create_media_as_host left xmax % (the lock check cannot see)', x1; end if;
--   insert into proof (step, ok, detail) values ('4 the complete counts once, on its real size (host and guest); the meter never', true,
--     format('meter +%s; host +%s bytes +%s item; guest +%s bytes +%s item; the control''s xmax %s -> %s', b.bytes - a.bytes, c.bytes - b.bytes, c.items - b.items, d.bytes - c.bytes, d.items - c.items, x0, x1));
-- exception when others then
--   insert into proof (step, ok, detail) values ('4 the complete counts once, on its real size (host and guest); the meter never', false, sqlerrm);
-- end $$;
--
-- -- 5. the month's line is the complete's: the meter refuses past it before a byte moves, and the complete holds it
-- do $$
-- declare v_event uuid := '340fcc7b-6c41-48f6-a143-6ef9f6724f4b'; v_host uuid; v_cap bigint; j1 jsonb; j2 jsonb; c1 text; c2 text; b record;
-- begin
--   select host_id into v_host from public.events where id = v_event;
--   select public.monthly_ingress_cap(p.tier, p.storage_cap_bytes) into v_cap from public.profiles p where p.id = v_host;
--   update public.storage_ledger set cumulative_bytes = v_cap - 1000 where host_id = v_host and period = to_char(now(), 'YYYY-MM');
--   j1 := pg_temp.meter(v_event, 'photo', 1000);
--   j2 := pg_temp.meter(v_event, 'photo', 1001);
--   c1 := pg_temp.host_put(1001);
--   c2 := pg_temp.host_put(1000);
--   select * into b from pg_temp.ledger(v_host);
--   if j1 <> '{"ok": true}'::jsonb then raise exception 'the meter at the line: %', j1; end if;
--   if j2 <> '{"ok": false, "reason": "monthly"}'::jsonb then raise exception 'the meter one past it: %', j2; end if;
--   if c1 <> '23514 Monthly upload limit reached for this plan.' then raise exception 'the complete one past it: %', c1; end if;
--   if c2 <> 'recorded' or b.bytes <> v_cap then raise exception 'the complete at the line: % (ledger % of %)', c2, b.bytes, v_cap; end if;
--   insert into proof (step, ok, detail) values ('5 the month''s line is the complete''s: the meter refuses past it first, the complete holds it', true,
--     format('cap %s; meter at the line %s, past it %s; complete past it "%s", at it %s (ledger %s)', v_cap, j1, j2, c1, c2, b.bytes));
-- exception when others then
--   insert into proof (step, ok, detail) values ('5 the month''s line is the complete''s: the meter refuses past it first, the complete holds it', false, sqlerrm);
-- end $$;
--
-- -- 6. a file past the room is refused at presign, and nothing counted either way
-- do $$
-- declare v_event uuid := '340fcc7b-6c41-48f6-a143-6ef9f6724f4b'; v_host uuid; v_active bigint; j1 jsonb; j2 jsonb; a record; b record;
-- begin
--   select host_id into v_host from public.events where id = v_event;
--   update public.storage_ledger set cumulative_bytes = 0 where host_id = v_host and period = to_char(now(), 'YYYY-MM');
--   v_active := public.host_active_bytes(v_host);
--   update public.profiles set storage_cap_bytes = v_active where id = v_host;
--   select * into a from pg_temp.ledger(v_host);
--   j1 := pg_temp.meter(v_event, 'video', v_active / 10 + 1);
--   j2 := pg_temp.meter(v_event, 'video', v_active / 10);
--   select * into b from pg_temp.ledger(v_host);
--   if j1 <> '{"ok": false, "reason": "storage"}'::jsonb then raise exception 'one byte past the room: %', j1; end if;
--   if j2 <> '{"ok": true}'::jsonb then raise exception 'exactly the room: %', j2; end if;
--   if b.bytes <> a.bytes or b.items <> a.items then raise exception 'the month moved +%', b.bytes - a.bytes; end if;
--   insert into proof (step, ok, detail) values ('6 a file past the room is refused at presign; nothing counted either way', true,
--     format('active %s, room %s: past it %s, at it %s; the month +%s', v_active, v_active / 10, j1, j2, b.bytes - a.bytes));
-- exception when others then
--   insert into proof (step, ok, detail) values ('6 a file past the room is refused at presign; nothing counted either way', false, sqlerrm);
-- end $$;
--
-- -- 7. the hourly breaker: the 20,001st of a clock hour waits for the next; a new hour starts the tally at one
-- do $$
-- declare v_event uuid := '340fcc7b-6c41-48f6-a143-6ef9f6724f4b'; v_host uuid; v_hour timestamptz := date_trunc('hour', now(), 'UTC');
--         j1 jsonb; j2 jsonb; j3 jsonb; b record; c record; d record; secs int;
-- begin
--   select host_id into v_host from public.events where id = v_event;
--   update public.profiles set storage_cap_bytes = 536870912000 where id = v_host;
--   update public.storage_ledger set hour_started_at = v_hour, hour_uploads = 20000 where host_id = v_host and period = to_char(now(), 'YYYY-MM');
--   j1 := pg_temp.meter(v_event, 'photo', 1);
--   select * into b from pg_temp.ledger(v_host);
--   if j1 ->> 'reason' is distinct from 'hourly' then raise exception 'at 20,000: %', j1; end if;
--   secs := (j1 ->> 'retry_after_sec')::int;
--   if secs < 1 or secs > 3600 then raise exception 'retry after %', secs; end if;
--   if b.hour_n <> 20000 then raise exception 'the refused one tallied (% this hour)', b.hour_n; end if;
--   update public.storage_ledger set hour_uploads = 19999 where host_id = v_host and period = to_char(now(), 'YYYY-MM');
--   j2 := pg_temp.meter(v_event, 'photo', 1);
--   select * into c from pg_temp.ledger(v_host);
--   if j2 <> '{"ok": true}'::jsonb or c.hour_n <> 20000 then raise exception 'at 19,999: % (% this hour)', j2, c.hour_n; end if;
--   update public.storage_ledger set hour_started_at = v_hour - interval '1 hour', hour_uploads = 20000 where host_id = v_host and period = to_char(now(), 'YYYY-MM');
--   j3 := pg_temp.meter(v_event, 'photo', 1);
--   select * into d from pg_temp.ledger(v_host);
--   if j3 <> '{"ok": true}'::jsonb or d.hour_n <> 1 or d.hour_at <> v_hour then raise exception 'a new hour: % (% at %)', j3, d.hour_n, d.hour_at; end if;
--   insert into proof (step, ok, detail) values ('7 the hourly breaker: the 20,001st waits for the next hour; a new hour starts at one', true,
--     format('at 20,000 %s; at 19,999 ok and 20,000 after; a new hour %s at %s', j1, d.hour_n, d.hour_at));
-- exception when others then
--   insert into proof (step, ok, detail) values ('7 the hourly breaker: the 20,001st waits for the next hour; a new hour starts at one', false, sqlerrm);
-- end $$;
--
-- -- 8. an event that is gone, or deleted: refused, nothing tallied
-- do $$
-- declare v_deleted uuid; j1 jsonb; j2 jsonb;
-- begin
--   select id into v_deleted from public.events where deleted_at is not null order by deleted_at desc limit 1;
--   j1 := pg_temp.meter(gen_random_uuid(), 'photo', 1000);
--   j2 := pg_temp.meter(v_deleted, 'photo', 1000);
--   if j1 <> '{"ok": false, "reason": "event_gone"}'::jsonb or j2 <> '{"ok": false, "reason": "event_gone"}'::jsonb then
--     raise exception 'unknown %, deleted %', j1, j2;
--   end if;
--   insert into proof (step, ok, detail) values ('8 an unknown or deleted event: event_gone', true, j1::text);
-- exception when others then
--   insert into proof (step, ok, detail) values ('8 an unknown or deleted event: event_gone', false, sqlerrm);
-- end $$;
--
-- -- 9. no bytes, past 10 GiB, no type or no event: a caller's mistake
-- do $$
-- declare v_event uuid := '340fcc7b-6c41-48f6-a143-6ef9f6724f4b'; bad text := ''; got text;
-- begin
--   foreach got in array array[
--     pg_temp.meter(v_event, 'photo', 0)::text,
--     pg_temp.meter(v_event, 'photo', -1)::text,
--     pg_temp.meter(v_event, 'photo', 10737418241)::text,
--     pg_temp.meter(v_event, null, 1000)::text,
--     pg_temp.meter(null, 'photo', 1000)::text] loop
--     if got not like '%22023 meter_upload needs an event, a type and 1 to 10737418240 bytes.%' then bad := bad || ' ' || got; end if;
--   end loop;
--   if bad <> '' then raise exception '%', bad; end if;
--   insert into proof (step, ok, detail) values ('9 no bytes, past 10 GiB, no type or no event: 22023', true, '5 cases');
-- exception when others then
--   insert into proof (step, ok, detail) values ('9 no bytes, past 10 GiB, no type or no event: 22023', false, sqlerrm);
-- end $$;
--
-- -- 10. the daily breaker: an account's 101st creation in 24 hours is refused in words, a restore never; Free's own
-- --     limit still speaks first
-- do $$
-- declare v_pro uuid := '6cb5fdb5-ac8a-4c82-83ce-59b5a2cfcd0b'; v_free uuid := '3fcf6405-ce4d-46ea-a11c-9ed68194b630';
--         n int; i int; got text := 'accepted'; restored uuid; free1 text := 'accepted'; free2 text := 'accepted';
-- begin
--   select count(*) into n from public.events where host_id = v_pro and created_at > now() - interval '24 hours';
--   for i in 1 .. 100 - n loop
--     insert into public.events (host_id, name) values (v_pro, 'Meter proof ' || i);
--   end loop;
--   begin
--     insert into public.events (host_id, name) values (v_pro, 'Meter proof 101');
--   exception when others then got := sqlstate || ' ' || sqlerrm;
--   end;
--   if got <> '23514 You''ve created a lot of events today. Try again tomorrow.' then raise exception 'the 101st: %', got; end if;
--   select id into restored from public.events where host_id = v_pro and deleted_at is not null order by deleted_at desc limit 1;
--   update public.events set deleted_at = null where id = restored;
--   begin
--     insert into public.events (host_id, name) values (v_free, 'Meter proof free 1');
--   exception when others then free1 := sqlstate || ' ' || sqlerrm;
--   end;
--   begin
--     insert into public.events (host_id, name) values (v_free, 'Meter proof free 2');
--   exception when others then free2 := sqlstate || ' ' || sqlerrm;
--   end;
--   if free1 <> 'accepted' or free2 not like '23514 Event limit reached for the free plan%' then raise exception 'free: %; %', free1, free2; end if;
--   insert into proof (step, ok, detail) values ('10 the 101st creation in 24 hours refused in words; a restore never; Free''s own limit first', true,
--     format('%s made before, %s now, the next: %s; restored %s; free: %s, then %s', n, 100, got, restored, free1, free2));
-- exception when others then
--   insert into proof (step, ok, detail) values ('10 the 101st creation in 24 hours refused in words; a restore never; Free''s own limit first', false, sqlerrm);
-- end $$;
--
-- -- 11. the bodies: this file's two, and create_media* as 20261003110000 left them
-- do $$
-- declare cm text; cmh text;
-- begin
--   select md5(regexp_replace(prosrc, '\s+', ' ', 'g')) into cm from pg_proc where proname = 'create_media' and pronamespace = 'public'::regnamespace;
--   select md5(regexp_replace(prosrc, '\s+', ' ', 'g')) into cmh from pg_proc where proname = 'create_media_as_host' and pronamespace = 'public'::regnamespace;
--   if cm <> 'e83666cdb565e7d631f33088ea97b276' or cmh <> '21f0397fdb4ec7e6c46137163a7fb2de' then raise exception 'create_media % / as_host %', cm, cmh; end if;
--   insert into proof (step, ok, detail) values ('11 create_media and create_media_as_host untouched', true, 'e83666cd / 21f0397f');
-- exception when others then
--   insert into proof (step, ok, detail) values ('11 create_media and create_media_as_host untouched', false, sqlerrm);
-- end $$;
-- insert into proof (step, ok, detail)
-- select '12 the bodies (md5 of the whitespace-collapsed prosrc)', true,
--   string_agg(p.proname || ' ' || md5(regexp_replace(p.prosrc, '\s+', ' ', 'g')), ', ' order by p.proname)
--   from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--  where n.nspname = 'public' and p.proname in ('meter_upload', 'enforce_event_limit');
--
-- select n, step, ok, detail from proof order by n;
--
-- RESULT, 2026-10-03, nothing persisted by either run (afterwards no `meter_upload` and no `hour_*` column exist,
-- enforce_event_limit still hashes 0bc03722, no "Meter proof" event exists, the host's cap and month read as before, and
-- the restored event is still deleted):
--   LIVE RED, without this file's statements: 10/10 of this file's steps fail on what each lacks (1 no columns; 2 no
--     function; 3 to 6, 8 and 9 `function public.meter_upload(...) does not exist` (42883); 7 `column "hour_started_at"
--     ... does not exist`; 10 "the 101st: accepted"); 11 holds in both runs, by design (create_media* untouched).
--   LIVE GREEN, with them: 12/12. 3: the meter moves the month +0 bytes +0 items, the profiles row's xmax unchanged
--     across it (no lock), the hour at 1; 4: around a meter each, the host's complete +3,000,000 bytes +1 item and the
--     guest's +2,400,000 +1, the control's xmax moving to this transaction's (create_media_as_host's lock, so the check
--     sees one); 5: at the month's line the meter admits and one byte past it refuses `monthly`, while the complete
--     refuses one past it "Monthly upload limit reached for this plan." and records at it; 6: one byte past the room
--     `storage`, at it ok, the month +0; 7: at 20,000 `hourly` (retry_after_sec 2,942), at 19,999 ok then 20,000, a new
--     hour back to 1; 8: event_gone twice; 9: five 22023s; 10: 34 made, 66 more, the 101st "You've created a lot of
--     events today. Try again tomorrow." (23514), a restore passes, Free's own limit first; 11: create_media
--     e83666cdb565e7d631f33088ea97b276 and create_media_as_host 21f0397fdb4ec7e6c46137163a7fb2de, untouched; 12:
--     enforce_event_limit 42fb725f629636855b4f19446f933a6f, meter_upload d13b9822f08880bd0375d01c7f660ef2 (md5 of each
--     body's whitespace-collapsed prosrc), the file's own.
-- =============================================================================================
