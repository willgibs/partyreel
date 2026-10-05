-- =============================================================================================
-- BILLING LOCKS (lane `billing-locks`; ROADMAP's three crumbs: "consume passes for Pro credit through an RPC that takes
-- the host's `profiles` row first", "the presign's meter refuses a lapsed pass up front as the completes do", and
-- "`/admin/accounts` makes 50 `uploads_used` calls a page view ... and a lapsed pass reads "0 B" of its allowance while
-- its uploads are refused"). The mechanism is docs/systems/billing-caps.md's, the lock rules
-- docs/systems/database-security.md's. Each part stands alone.
--
--   1. consume_passes_for_pro_credit(host): the pass-to-Pro credit's ledger write as ONE transaction that takes the
--      host's profiles row FIRST, the one lock order every capacity body keeps (create_media*, the restores,
--      enforce_event_limit, leave_deleted), then converts every unconsumed pass of hers and clears the chain fields
--      (tier_expires_at, event_slots). The webhook made it two requests, event_passes and then profiles: the reverse of
--      the completes' order (her profiles row, then the pass's row they count on), held apart only because PostgREST
--      runs each request as its own transaction. Joined in that order, as atomicity wants, the two would close a cycle
--      with an upload that Postgres breaks only by failing one side; left apart, a host sat between them with her
--      passes consumed and her chain still set, and a failure between them left her so until Stripe's retry. Same
--      answer as the write it replaces: how many passes this call consumed, 0 on a replay (a profile that is not there
--      consumes nothing, as before). Service role only (the webhook, on the admin client); SECURITY INVOKER, since the
--      service role holds every privilege it uses, so a grant that slipped to a client role reaches nothing.
--   2. meter_upload: the presign refuses a lapsed pass before a byte moves, as the completes have since 20261004100000
--      (the Advisor's Q26 F1): her profile still a pass's, no window of hers live, so the count would land on no row.
--      Until the nightly recompute moved her to Free, the meter admitted her upload, its bytes went up and the complete
--      refused them. Refused here in the allowance's words (the wire's 'monthly', which both presign routes say as
--      their allowance sentence), the completes' own predicate read early. 20261004100000's body verbatim but for that
--      one block; same signature, return type, language, volatility, security mode and empty search_path, so create or
--      replace keeps its ACL, and the grants are restated as they stand live.
--   3. uploads_windows(host ids, after, limit): every listed host's uploads window in ONE set-returning read, for
--      /admin/accounts, which asked uploads_used once a row (50 calls a page view). Each figure IS uploads_used(host,
--      her own tier), called per row, so it cannot disagree with the refusal it warns of; beside it, the tier and cap
--      it was asked with (so the page holds the figure to the allowance of the same plan, read in the same snapshot),
--      whether she is a pass holder with no live window (the completes' own predicate), since when (when her last pass
--      stopped being live), and whether that was its conversion to Pro credit, so the operator reads "lapsed, uploads
--      refused" where "0 B" of an allowance stood. Keyset on the profile id, p_limit clamped to 1,000
--      (database-security.md, "Set-returning functions and the row cap"). SECURITY INVOKER, the service role's alone:
--      it reads profiles and event_passes and calls uploads_used, each the service role's already, so it adds no reach.
--
-- ★ APPLY THIS BEFORE THE LANE'S CODE DEPLOYS: the webhook calls (1) and the accounts pages call (3) by name, and
-- PostgREST answers a call to a function it does not hold with PGRST202. Ahead of this file every accounts row says "No
-- reading", and a credited Pro checkout's delivery is a 500 that Stripe retries, AFTER the route has granted the credit's
-- balance: that grant's idempotency key holds for Stripe's window (at least 24 hours) while a delivery retries for three
-- days, so a conversion still failing a day on grants the balance again. (2) changes no signature, no answer's keys and
-- no refusal's routing, so the deployed build is indifferent to it.
--
-- THE PROTOCOL (database-security.md, "Workflow"): the drift read first: the one body this file replaces, hashed live as
-- md5(btrim(regexp_replace(prosrc, '\s+', ' ', 'g'))), must equal its newest repo definition, as it did on 2026-10-05:
--   meter_upload            00a25a0325274c2263ff6629e02b9af5  (20261004100000_ladder_a)
-- and the two new functions must be absent. Then the rolled-back proof at the foot of this file, RED without this
-- file's statements and GREEN with them; then apply verbatim; then get_advisors (the set unchanged: both new functions
-- are INVOKER and the service role's alone, so neither enters 0028 or 0029); then regenerate src/lib/db/types.ts (the
-- two new functions), which drops the lane's two typed seams (`passCreditDb` in src/lib/db/mutations/event-passes.ts,
-- `uploadsWindowsDb` in src/lib/db/queries/accounts.ts).

-- =============================================================================================
-- 1. The pass-to-Pro credit's ledger write: her profiles row first, one transaction.
-- =============================================================================================
create function public.consume_passes_for_pro_credit(p_host_id uuid)
returns integer
language plpgsql
volatile
set search_path = ''
as $$
declare
  v_consumed integer;
begin
  if p_host_id is null then
    raise exception 'consume_passes_for_pro_credit needs a host.' using errcode = 'invalid_parameter_value';
  end if;

  -- ★ HER PROFILES ROW FIRST, the lock every capacity body takes before anything else (database-security.md): an
  -- upload's complete holds it while it counts on her live pass, so the conversion waits for that upload, and the
  -- next upload waits for the conversion and then finds no live pass. Taking the passes first would close a cycle
  -- with that complete. Nothing is read or written before it.
  perform 1 from public.profiles where id = p_host_id for update;

  -- Every unconsumed pass, as the checkout computed the credit over all of them: live windows and an unopened
  -- renewal's year alike. An expired row is consumed too (its credit was 0), so nothing unconsumed is left behind.
  -- A replay finds none and consumes 0.
  update public.event_passes
     set consumed_at = now(), consumed_reason = 'pro_credit'
   where profile_id = p_host_id and consumed_at is null;
  get diagnostics v_consumed = row_count;

  -- The chain fields, in the same transaction, so no reader meets her passes consumed and her chain still set. The
  -- tier and the cap are the subscription events' (which null these two again: nothing banks behind Pro).
  update public.profiles
     set tier_expires_at = null, event_slots = null
   where id = p_host_id;

  return v_consumed;
end;
$$;

revoke all on function public.consume_passes_for_pro_credit(uuid) from public, anon, authenticated;
grant execute on function public.consume_passes_for_pro_credit(uuid) to service_role;

-- =============================================================================================
-- 2. The presign's meter: a lapsed pass refused before a byte moves.
-- =============================================================================================
-- 20261004100000's body verbatim but for the lapsed pass's block after the allowance's.
create or replace function public.meter_upload(
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
  v_make_room boolean;
  v_used bigint;
  v_deleted bigint;
  v_ledger public.storage_ledger;
  v_period text := to_char(now(), 'YYYY-MM'); -- the month's key, as every reader and writer of the meter writes it
  v_hour timestamptz := pg_catalog.date_trunc('hour', now(), 'UTC');
  v_cap bigint;
  v_allowance bigint;
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
  select p.tier, p.storage_cap_bytes, p.make_room_from_deleted into v_tier, v_storage_cap, v_make_room
    from public.profiles p where p.id = v_host;
  select * into v_ledger from public.storage_ledger where host_id = v_host and period = v_period;

  -- The breaker's early read: a runaway past it pays this one read, never the storage sum below.
  if v_ledger.hour_started_at = v_hour and v_ledger.hour_uploads >= c_uploads_an_hour then
    return jsonb_build_object(
      'ok', false,
      'reason', 'hourly',
      'retry_after_sec', greatest(1, ceil(extract(epoch from (v_hour + interval '1 hour' - now()))))::integer
    );
  end if;

  -- The allowance, advisory: the line create_media* hold at complete, over the same window, read before a byte moves
  -- (NULL = unmetered: a paid profile with no cap on record fails open, as there). The reason keeps the wire's name,
  -- 'monthly', which the routes read, whatever the window (20261004100000: a pass counts its year).
  v_allowance := public.upload_allowance(v_tier, v_storage_cap);
  if v_allowance is not null and public.uploads_used(v_host, v_tier) + p_bytes > v_allowance then
    return jsonb_build_object('ok', false, 'reason', 'monthly');
  end if;
  -- ★ A LAPSED PASS (20261005130000, the completes' Q26 F1 refusal read early): her last live pass has ended and the
  -- nightly recompute has not moved her to Free yet, so no live pass holds her allowance and create_media* refuse the
  -- upload in the allowance's words. Refused here in the same words, the same predicate over the same rows, so nothing
  -- is presigned, sent and stored in staging only to be refused at its complete. Plain read, no lock.
  if v_tier = 'event_pass' and not exists (
    select 1 from public.event_passes q
     where q.profile_id = v_host and q.consumed_at is null
       and q.start_at <= now() and q.expires_at > now()) then
    return jsonb_build_object('ok', false, 'reason', 'monthly');
  end if;

  -- The room, advisory: the line an upload meets (`host_room_used`, 20261003220000: what she keeps, Deleted left out
  -- while her setting lets an upload make room from it) against the cap and its 10%, as create_media* will judge this
  -- file on its HEAD. A refusal carries what this file needs freed, what Deleted holds and whether Deleted could make the
  -- room, for the owner's own words (a guest's route names the album, never these). A Free profile's null cap is its
  -- plan's default (tier_limits), as every cap read takes it.
  v_cap := coalesce(v_storage_cap, (select l.default_storage_cap_bytes from public.tier_limits(v_tier) l));
  if v_cap is not null then
    v_used := public.host_room_used(v_host);
    if v_used + p_bytes > v_cap + (v_cap / 10) then
      select s.standby_bytes into v_deleted from public.host_storage_summary(v_host) s;
      return jsonb_build_object(
        'ok', false,
        'reason', 'storage',
        'needed_bytes', v_used + p_bytes - (v_cap + (v_cap / 10)),
        'deleted_bytes', v_deleted,
        'makes_room', coalesce(v_make_room, true)
      );
    end if;
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

revoke execute on function public.meter_upload(uuid, public.media_type, bigint) from public, anon, authenticated;
grant execute on function public.meter_upload(uuid, public.media_type, bigint) to service_role;

-- =============================================================================================
-- 3. Every listed host's uploads window, one read.
-- =============================================================================================
-- One row a listed profile, in id order (an id that names no profile answers no row). Each column is the product's own
-- answer, read in one snapshot, never a re-derivation: `tier` and `storage_cap_bytes` are the plan the row was asked
-- with (the page holds the figure to that plan's allowance, so a plan moving between the list's read and this one never
-- pairs one plan's figure with another's allowance); `used_bytes` is uploads_used asked with her own tier, exactly as
-- create_media* and meter_upload ask it; `pass_lapsed` is the completes' lapsed-pass predicate; `pass_lapsed_at` is when
-- her last pass stopped being live (the latest end among her passes that ever were: its expiry, or its conversion to Pro
-- credit when that came first), null while she is not lapsed and when no pass of hers ever was live (a tier set by
-- hand); `pass_converted` says that end was the conversion (her Pro plan not landed yet), not an expiry.
create function public.uploads_windows(
  p_host_ids uuid[],
  p_after_id uuid default null,
  p_limit integer default null
)
returns table (
  host_id uuid,
  tier public.tier_type,
  storage_cap_bytes bigint,
  used_bytes bigint,
  pass_lapsed boolean,
  pass_lapsed_at timestamptz,
  pass_converted boolean
)
language sql
stable
set search_path = ''
as $$
  select
    p.id,
    p.tier,
    p.storage_cap_bytes,
    public.uploads_used(p.id, p.tier),
    w.lapsed,
    e.ended_at,
    coalesce(e.converted, false)
  from public.profiles p
  cross join lateral (
    select p.tier = 'event_pass' and not exists (
      select 1 from public.event_passes q
       where q.profile_id = p.id and q.consumed_at is null
         and q.start_at <= now() and q.expires_at > now()) as lapsed
  ) w
  -- The pass whose live end is the latest, read only for a lapsed row: a pass that was ever live (its window opened
  -- before it ended), its end its expiry or its conversion when that came first.
  left join lateral (
    select least(q.expires_at, coalesce(q.consumed_at, q.expires_at)) as ended_at,
           (q.consumed_at is not null and q.consumed_at < q.expires_at) as converted
      from public.event_passes q
     where w.lapsed
       and q.profile_id = p.id
       and q.start_at <= now()
       and q.start_at < least(q.expires_at, coalesce(q.consumed_at, q.expires_at))
     order by 1 desc, 2 desc
     limit 1
  ) e on true
  where p.id = any(p_host_ids)
    and (p_after_id is null or p.id > p_after_id)
  order by p.id
  limit case when p_limit is null then null else least(p_limit, 1000) end;
$$;

revoke all on function public.uploads_windows(uuid[], uuid, integer) from public, anon, authenticated;
grant execute on function public.uploads_windows(uuid[], uuid, integer) to service_role;

-- =============================================================================================
-- 4. What each new piece is, where an operator reads it.
-- =============================================================================================
comment on function public.consume_passes_for_pro_credit(uuid) is
  'The pass-to-Pro credit''s ledger write (the Stripe webhook, service role only): takes the host''s profiles row first, as every capacity body does, then marks every unconsumed pass of hers consumed (pro_credit) and clears tier_expires_at and event_slots, in one transaction. Answers how many passes this call consumed; 0 on a replay.';

comment on function public.uploads_windows(uuid[], uuid, integer) is
  'Each listed host''s uploads window, one row a profile in id order (keyset on p_after_id, p_limit clamped to 1,000): her tier and cap as read, uploads_used(host, her own tier), whether she is a pass holder with no live pass (uploads refused until her plan moves), when her last pass stopped being live and whether that was its conversion to Pro credit. Service role only: /admin/accounts.';

-- =============================================================================================
-- THE ROLLED-BACK PROOF (database-security.md, "An unapplied migration is proved on the live schema"): one execute_sql
-- call, `begin;` + this file's statements + the block below + `rollback;`. It makes its own accounts (auth users, so
-- handle_new_user makes their profiles), an album and a guest ticket needing no address, and sets each step's plan,
-- ledger and passes straight in; every upload goes through the real create_media* and every read through the real
-- meter, uploads_used and the new read. Each step traps its own failure into the temp `proof` table; the final select is
-- the answer. The RED run is the same call without this file's statements: everything this file adds is reached only
-- through dynamic SQL, so it fails on what it lacks, never on a parse.
--
-- RESULT, 2026-10-05 against the live schema (the drift read above clean first: meter_upload at 00a25a03, the two new
-- functions absent):
--   RED  0/6: 1 no consume_passes_for_pro_credit; 2 the meter admits the lapsed pass ('ok') while both writers refuse
--        it ("23514 Upload limit reached for this plan."), and the credited one too; 3-4 no uploads_windows; 5 the two
--        functions' ACLs and shapes absent (the meter's as named); 6 the meter at its 20261004100000 hash.
--   GREEN 6/6 on this file, nothing persisted after (meter_upload at 00a25a03, both new functions absent, no fixture
--        user, event or pass).
-- THE PRE-FLIGHT (database-security.md), a throwaway Postgres 17 cluster holding a stand-in of the touched tables, the
-- Supabase roles and the current bodies, the file applied verbatim (pg_get_functiondef's diff of the meter is exactly
-- its one block): its contract check RED 0/8 without the file, GREEN 8/8 with it (the clamp at 1,000 over 1,500
-- profiles; a grant slipped to authenticated still fails 42501 on event_passes, INVOKER's point). Its two-session lock
-- run: the webhook's two writes JOINED in their shipped order deadlock with a complete (40P01, "deadlock detected");
-- as shipped, two requests, they never deadlock, but a reader between them saw her passes consumed with her chain
-- still set; the conversion first, a complete waits and then finds no live pass; a complete first, the conversion
-- waits and then converts. Neither order of the new pair deadlocks.
-- =============================================================================================
-- create temp table proof (n serial, step text, ok boolean, detail text);
-- create temp table fx (k text primary key, id uuid, txt text);
--
-- create function pg_temp.fx(p_k text) returns uuid language sql as $f$ select id from fx where k = p_k $f$;
-- create function pg_temp.gb(p numeric) returns bigint language sql as $f$ select (p * 1024 * 1024 * 1024)::bigint $f$;
--
-- -- A host on a plan: no media, no ledger, no passes; the tier, the cap and the chain fields as asked.
-- create function pg_temp.reset(p_host text, p_tier text, p_cap bigint, p_expires timestamptz default null,
--                               p_slots integer default null) returns void language plpgsql as $f$
-- declare h uuid := pg_temp.fx(p_host);
-- begin
--   delete from public.media where event_id in (select id from public.events where host_id = h);
--   delete from public.storage_ledger where host_id = h;
--   delete from public.event_passes where profile_id = h;
--   update public.profiles set tier = p_tier::public.tier_type, storage_cap_bytes = p_cap, storage_used_bytes = 0,
--          tier_expires_at = p_expires, event_slots = p_slots
--    where id = h;
-- end $f$;
--
-- -- A pass row: its window by offsets from now, its count, consumed (that long ago) when asked.
-- create function pg_temp.pass(p_host text, p_from interval, p_to interval, p_uploaded bigint default 0,
--                              p_consumed_ago interval default null) returns uuid language plpgsql as $f$
-- declare pid uuid;
-- begin
--   insert into public.event_passes (profile_id, start_at, expires_at, price_cents, source, uploaded_bytes,
--                                    consumed_at, consumed_reason)
--   values (pg_temp.fx(p_host), now() + p_from, now() + p_to, 2900, 'initial', p_uploaded,
--           now() - p_consumed_ago, case when p_consumed_ago is not null then 'pro_credit' end)
--   returning id into pid;
--   return pid;
-- end $f$;
--
-- -- The presign's meter for the album (its host is 'lapsed'), and an upload through the real writers.
-- create function pg_temp.meter(p_bytes bigint) returns text language plpgsql as $f$
-- begin
--   return coalesce(public.meter_upload(p_event_id => pg_temp.fx('album'), p_type => 'photo', p_bytes => p_bytes)->>'reason', 'ok');
-- exception when others then
--   return 'error ' || sqlstate || ' ' || sqlerrm;
-- end $f$;
--
-- create function pg_temp.put(p_bytes bigint, p_as text default 'host') returns text language plpgsql as $f$
-- declare mid uuid := gen_random_uuid(); e uuid := pg_temp.fx('album');
-- begin
--   if p_as = 'host' then
--     perform public.create_media_as_host(p_host_id => pg_temp.fx('lapsed'), p_event_id => e, p_media_id => mid,
--       p_type => 'photo', p_original_key => 'events/' || e || '/photo/' || mid || '/original.jpg',
--       p_file_size_bytes => p_bytes);
--   else
--     perform public.create_media(p_session_token => (select txt from fx where k = 'ticket'), p_media_id => mid,
--       p_type => 'photo', p_original_key => 'events/' || e || '/photo/' || mid || '/original.jpg',
--       p_file_size_bytes => p_bytes);
--   end if;
--   return 'recorded';
-- exception when others then
--   return sqlstate || ' ' || sqlerrm;
-- end $f$;
--
-- -- The consume, as the webhook calls it: as the service role, whose privileges an INVOKER body runs with (dynamic: the
-- -- red run has no such function).
-- create function pg_temp.consume(p_host uuid) returns text language plpgsql as $f$
-- declare n integer;
-- begin
--   set local role service_role;
--   execute 'select public.consume_passes_for_pro_credit($1)' into n using p_host;
--   reset role;
--   return n::text;
-- exception when others then
--   reset role;
--   return 'error ' || sqlstate || ' ' || sqlerrm;
-- end $f$;
--
-- -- The read, as the accounts pages call it: as the service role, its rows one jsonb array in id order (dynamic, as above).
-- create function pg_temp.windows(p_ids uuid[], p_after uuid default null, p_limit integer default null) returns jsonb
-- language plpgsql as $f$
-- declare got jsonb;
-- begin
--   set local role service_role;
--   execute 'select coalesce(jsonb_agg(to_jsonb(w) order by w.host_id), ''[]''::jsonb) from public.uploads_windows($1, $2, $3) w'
--     into got using p_ids, p_after, p_limit;
--   reset role;
--   return got;
-- exception when others then
--   reset role;
--   raise;
-- end $f$;
--
-- -- The fixtures: five hosts (auth users, so handle_new_user makes each profile), the lapsed host's album and one guest
-- -- ticket on it that needs no address.
-- do $$
-- declare k text; h uuid; a uuid; gid uuid; t text := 'billing-locks-' || replace(gen_random_uuid()::text, '-', '');
-- begin
--   foreach k in array array['free', 'pro', 'stack', 'lapsed', 'credited'] loop
--     h := gen_random_uuid();
--     insert into auth.users (id, email, email_confirmed_at) values (h, 'billing-locks-' || h || '@example.com', now());
--     insert into public.profiles (id, email, display_name) values (h, 'billing-locks-' || h || '@example.com', 'Bill ' || k)
--       on conflict (id) do update set display_name = excluded.display_name;
--     insert into fx values (k, h, null);
--   end loop;
--   insert into public.events (host_id, name, require_verified_email)
--     values (pg_temp.fx('lapsed'), 'Billing locks: the album', false) returning id into a;
--   insert into public.guests (event_id, session_token, display_name) values (a, t, 'Gus Guest') returning id into gid;
--   insert into fx values ('album', a, null), ('guest', gid, null), ('ticket', null, t);
--   insert into proof (step, ok, detail) values ('0 fixtures', true, format('lapsed host %s, album %s', pg_temp.fx('lapsed'), a));
-- exception when others then
--   insert into proof (step, ok, detail) values ('0 fixtures', false, sqlerrm);
-- end $$;
--
-- -- 1. The consume: every unconsumed pass (two live, an unopened renewal, an expired one) marked pro_credit at this
-- -- instant, an earlier conversion left as it was, the chain fields cleared, the tier and the cap left to the
-- -- subscription events; a replay consumes 0 and changes nothing; a host with no passes consumes 0; no host is refused.
-- do $$
-- declare a1 uuid; b1 uuid; ahead uuid; ended uuid; old uuid; n1 text; n2 text; n3 text; n4 text;
--   pr record; consumed integer; old_at timestamptz; old_before timestamptz; bad text := '';
-- begin
--   perform pg_temp.reset('credited', 'event_pass', pg_temp.gb(50), now() + interval '700 days', 2);
--   a1 := pg_temp.pass('credited', -interval '10 days', interval '355 days');
--   b1 := pg_temp.pass('credited', -interval '100 days', interval '265 days');
--   ahead := pg_temp.pass('credited', interval '265 days', interval '630 days');
--   ended := pg_temp.pass('credited', -interval '400 days', -interval '35 days');
--   old := pg_temp.pass('credited', -interval '500 days', -interval '135 days', 0, interval '200 days');
--   select consumed_at into old_before from public.event_passes where id = old;
--   n1 := pg_temp.consume(pg_temp.fx('credited'));
--   select count(*) into consumed from public.event_passes
--    where profile_id = pg_temp.fx('credited') and consumed_reason = 'pro_credit' and consumed_at = now();
--   select consumed_at into old_at from public.event_passes where id = old;
--   select tier, storage_cap_bytes, tier_expires_at, event_slots into pr from public.profiles where id = pg_temp.fx('credited');
--   n2 := pg_temp.consume(pg_temp.fx('credited'));
--   n3 := pg_temp.consume(pg_temp.fx('free'));
--   n4 := pg_temp.consume(null);
--   if n1 <> '4' then bad := bad || ' first ' || n1 || ';'; end if;
--   if consumed <> 4 then bad := bad || format(' %s marked now;', consumed); end if;
--   if old_at is distinct from old_before then bad := bad || ' the earlier conversion moved;'; end if;
--   if pr.tier <> 'event_pass' or pr.storage_cap_bytes <> pg_temp.gb(50) then bad := bad || ' tier or cap written;'; end if;
--   if pr.tier_expires_at is not null or pr.event_slots is not null then bad := bad || ' chain fields kept;'; end if;
--   if n2 <> '0' then bad := bad || ' replay ' || n2 || ';'; end if;
--   if n3 <> '0' then bad := bad || ' no passes ' || n3 || ';'; end if;
--   if n4 not like 'error 22023 %' then bad := bad || ' null host ' || n4 || ';'; end if;
--   insert into proof (step, ok, detail) values ('1 consume', bad = '',
--     coalesce(nullif(bad, ''), format('consumed %s, replay %s, no passes %s, %s', n1, n2, n3, n4)));
-- exception when others then
--   insert into proof (step, ok, detail) values ('1 consume', false, sqlerrm);
-- end $$;
--
-- -- 2. The meter refuses a lapsed pass in the allowance's words, as both writers do; a live pass, a stack and Free are
-- -- admitted as before; a pass converted to Pro credit while the profile still reads event_pass is lapsed too.
-- do $$
-- declare m_live text; m_lapsed text; m_credited text; m_free text; h text; g text;
-- begin
--   perform pg_temp.reset('lapsed', 'event_pass', pg_temp.gb(25));
--   perform pg_temp.pass('lapsed', -interval '10 days', interval '355 days');
--   m_live := pg_temp.meter(1000);
--   perform pg_temp.reset('lapsed', 'event_pass', pg_temp.gb(25));
--   perform pg_temp.pass('lapsed', -interval '400 days', -interval '1 day', pg_temp.gb(1));
--   m_lapsed := pg_temp.meter(1000);
--   h := pg_temp.put(1000, 'host');
--   g := pg_temp.put(1000, 'guest');
--   perform pg_temp.reset('lapsed', 'event_pass', pg_temp.gb(25));
--   perform pg_temp.pass('lapsed', -interval '10 days', interval '355 days', 0, interval '1 minute');
--   m_credited := pg_temp.meter(1000);
--   perform pg_temp.reset('lapsed', 'free', null);
--   m_free := pg_temp.meter(1000);
--   insert into proof (step, ok, detail) values ('2 meter, lapsed pass',
--     m_live = 'ok' and m_lapsed = 'monthly' and m_credited = 'monthly' and m_free = 'ok'
--       and h = '23514 Upload limit reached for this plan.' and g = '23514 Upload limit reached for this plan.',
--     format('live %s; lapsed %s (host %s, guest %s); credited %s; free %s', m_live, m_lapsed, h, g, m_credited, m_free));
-- exception when others then
--   insert into proof (step, ok, detail) values ('2 meter, lapsed pass', false, sqlerrm);
-- end $$;
--
-- -- 3. The read's parity, as the service role reads it: for each host, used_bytes is exactly uploads_used(host, her own
-- -- tier) (a month's ledger, a stack's two years, a lapsed pass's nothing), the tier and cap are her profile's, and
-- -- lapsed, since and converted say what the completes enforce and why.
-- do $$
-- declare r record; want bigint; got_rows integer := 0; bad text := ''; ids uuid[]; lapsed_end timestamptz;
--   credited_at timestamptz;
-- begin
--   perform pg_temp.reset('free', 'free', null);
--   insert into public.storage_ledger (host_id, period, cumulative_bytes) values (pg_temp.fx('free'), to_char(now(), 'YYYY-MM'), 212000000);
--   insert into public.storage_ledger (host_id, period, cumulative_bytes) values (pg_temp.fx('free'), to_char(now() - interval '1 month', 'YYYY-MM'), 5);
--   perform pg_temp.reset('pro', 'pro', pg_temp.gb(200));
--   insert into public.storage_ledger (host_id, period, cumulative_bytes) values (pg_temp.fx('pro'), to_char(now(), 'YYYY-MM'), pg_temp.gb(40));
--   perform pg_temp.reset('stack', 'event_pass', pg_temp.gb(50));
--   perform pg_temp.pass('stack', -interval '355 days', interval '10 days', pg_temp.gb(31));
--   perform pg_temp.pass('stack', -interval '65 days', interval '300 days', pg_temp.gb(2));
--   insert into public.storage_ledger (host_id, period, cumulative_bytes) values (pg_temp.fx('stack'), to_char(now(), 'YYYY-MM'), pg_temp.gb(9));
--   perform pg_temp.reset('lapsed', 'event_pass', pg_temp.gb(25));
--   perform pg_temp.pass('lapsed', -interval '730 days', -interval '365 days', pg_temp.gb(3));
--   perform pg_temp.pass('lapsed', -interval '400 days', -interval '2 days', pg_temp.gb(1));
--   select expires_at into lapsed_end from public.event_passes where profile_id = pg_temp.fx('lapsed') order by expires_at desc limit 1;
--   perform pg_temp.reset('credited', 'event_pass', pg_temp.gb(25));
--   perform pg_temp.pass('credited', -interval '10 days', interval '355 days', 0, interval '5 minutes');
--   perform pg_temp.pass('credited', interval '355 days', interval '720 days', 0, interval '5 minutes');
--   select max(consumed_at) into credited_at from public.event_passes where profile_id = pg_temp.fx('credited');
--   ids := array[pg_temp.fx('free'), pg_temp.fx('pro'), pg_temp.fx('stack'), pg_temp.fx('lapsed'), pg_temp.fx('credited'),
--                gen_random_uuid()];
--   for r in
--     select x.*, p.tier as profile_tier, p.storage_cap_bytes as profile_cap
--       from jsonb_to_recordset(pg_temp.windows(ids)) as x(host_id uuid, tier public.tier_type, storage_cap_bytes bigint,
--              used_bytes bigint, pass_lapsed boolean, pass_lapsed_at timestamptz, pass_converted boolean)
--       join public.profiles p on p.id = x.host_id
--   loop
--     got_rows := got_rows + 1;
--     want := public.uploads_used(r.host_id, r.profile_tier);
--     if r.used_bytes is distinct from want then bad := bad || format(' %s used %s want %s;', r.host_id, r.used_bytes, want); end if;
--     if r.tier is distinct from r.profile_tier or r.storage_cap_bytes is distinct from r.profile_cap then
--       bad := bad || format(' %s plan %s/%s;', r.host_id, r.tier, r.storage_cap_bytes);
--     end if;
--     if r.host_id = pg_temp.fx('lapsed') then
--       if not r.pass_lapsed or r.pass_lapsed_at is distinct from lapsed_end or r.pass_converted then bad := bad || ' lapsed host;'; end if;
--     elsif r.host_id = pg_temp.fx('credited') then
--       if not r.pass_lapsed or r.pass_lapsed_at is distinct from credited_at or not r.pass_converted then bad := bad || ' credited host;'; end if;
--     elsif r.pass_lapsed or r.pass_lapsed_at is not null or r.pass_converted then
--       bad := bad || format(' %s read lapsed;', r.host_id);
--     end if;
--   end loop;
--   if got_rows <> 5 then bad := bad || format(' %s rows for 5 profiles and a stranger;', got_rows); end if;
--   insert into proof (step, ok, detail) values ('3 read parity', bad = '', coalesce(nullif(bad, ''), '5 hosts, each uploads_used''s own figure and plan; lapsed, credited, since when and why'));
-- exception when others then
--   insert into proof (step, ok, detail) values ('3 read parity', false, sqlerrm);
-- end $$;
--
-- -- 4. The read's pages, as the service role reads them: id order, the keyset excludes up to its cursor, p_limit takes
-- -- that many, a null p_limit all.
-- do $$
-- declare ids uuid[]; sorted uuid[]; page1 uuid[]; page2 uuid[]; whole uuid[];
-- begin
--   ids := array[pg_temp.fx('free'), pg_temp.fx('pro'), pg_temp.fx('stack'), pg_temp.fx('lapsed'), pg_temp.fx('credited')];
--   select array_agg(x order by x) into sorted from unnest(ids) x;
--   select array_agg((e->>'host_id')::uuid order by (e->>'host_id')::uuid) into page1
--     from jsonb_array_elements(pg_temp.windows(ids, null, 2)) e;
--   select array_agg((e->>'host_id')::uuid order by (e->>'host_id')::uuid) into page2
--     from jsonb_array_elements(pg_temp.windows(ids, page1[2], 1000)) e;
--   select array_agg((e->>'host_id')::uuid order by (e->>'host_id')::uuid) into whole
--     from jsonb_array_elements(pg_temp.windows(ids)) e;
--   insert into proof (step, ok, detail) values ('4 read pages',
--     page1 = sorted[1:2] and page2 = sorted[3:5] and whole = sorted,
--     format('page1 %s, page2 %s, whole %s', cardinality(page1), cardinality(page2), cardinality(whole)));
-- exception when others then
--   insert into proof (step, ok, detail) values ('4 read pages', false, sqlerrm);
-- end $$;
--
-- -- 5. Grants and shapes: the two new functions INVOKER and the service role's alone, the meter's ACL and shape as they
-- -- stood; every body's empty search_path.
-- do $$
-- declare r record; got text; shape text; bad text := '';
-- begin
--   for r in select * from (values
--       ('public.consume_passes_for_pro_credit(uuid)', 'postgres:EXECUTE service_role:EXECUTE', 'plpgsql v invoker'),
--       ('public.uploads_windows(uuid[], uuid, integer)', 'postgres:EXECUTE service_role:EXECUTE', 'sql s invoker'),
--       ('public.meter_upload(uuid, public.media_type, bigint)', 'postgres:EXECUTE service_role:EXECUTE', 'plpgsql v definer')
--     ) v(fn, acl, want_shape)
--   loop
--     select string_agg(a.grantee::regrole::text || ':' || a.privilege_type, ' '
--                       order by a.grantee::regrole::text || ':' || a.privilege_type) into got
--       from pg_proc p, aclexplode(p.proacl) a where p.oid = to_regprocedure(r.fn);
--     select l.lanname || ' ' || p.provolatile::text || ' ' || case when p.prosecdef then 'definer' else 'invoker' end
--       into shape
--       from pg_proc p join pg_language l on l.oid = p.prolang
--      where p.oid = to_regprocedure(r.fn) and p.proconfig = array['search_path=""'];
--     if got is distinct from r.acl then bad := bad || format(' %s acl %s;', r.fn, got); end if;
--     if shape is distinct from r.want_shape then bad := bad || format(' %s shape %s;', r.fn, shape); end if;
--   end loop;
--   insert into proof (step, ok, detail) values ('5 grants and shapes', bad = '', coalesce(nullif(bad, ''), '3 functions as named'));
-- exception when others then
--   insert into proof (step, ok, detail) values ('5 grants and shapes', false, sqlerrm);
-- end $$;
--
-- -- 6. The bodies are this file's: each prosrc, whitespace collapsed, hashes as the file's own text does.
-- do $$
-- declare r record; got text; bad text := '';
-- begin
--   for r in select * from (values
--       ('consume_passes_for_pro_credit', '1270f6da98f1ee9652b3e32f16725aa7'),
--       ('meter_upload', '9d193450b8d017644f89fee0963b20bd'),
--       ('uploads_windows', 'adbf915999626ce4ff70fbed0cd7108b')
--     ) v(fn, want)
--   loop
--     select md5(btrim(regexp_replace(p.prosrc, '\s+', ' ', 'g'))) into got
--       from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--      where n.nspname = 'public' and p.proname = r.fn;
--     if got is distinct from r.want then bad := bad || format(' %s=%s;', r.fn, got); end if;
--   end loop;
--   insert into proof (step, ok, detail) values ('6 bodies', bad = '', coalesce(nullif(bad, ''), '3 hashes, the file''s own'));
-- exception when others then
--   insert into proof (step, ok, detail) values ('6 bodies', false, sqlerrm);
-- end $$;
--
-- select n, step, ok, detail from proof order by n;
