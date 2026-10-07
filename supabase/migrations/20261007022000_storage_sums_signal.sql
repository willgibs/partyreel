-- =============================================================================================
-- THE STORAGE SUMS' SIGNAL (lane `storage-sums-signal`; the Advisor's condition on upload_sums for milestone 39). The
-- nightly proof that the sums still equal the walk is TypeScript: the purge cron's `storage_sums` sub-sweep paging
-- `storage_sums_drift`, its card on /admin/jobs, the Rebuild there calling `rebuild_storage_sums` (both live since
-- 20261006215810; lifecycle-recovery.md, admin-observability.md). This file holds what that lane needs of the database:
--
--   1. THE ONE DEADLOCK THE SUMS' TRIGGER OPENED, CLOSED. A guest's withdrawal of an upload a standing block removed
--      (`remove_my_upload`'s already-removed arm, the sneaky block, 20260928120000) re-marks a row that sits in her
--      host's Deleted, so since 20261006180000 its statement trigger (`media_storage_sums`) takes the host's profiles
--      row AFTER that media row, while her Restore (`restore_media`) and Let back in (`let_back_in`, restoring) take
--      her profiles row FIRST and then that media row: a cycle, one side's 40P01 after a second (database-security.md,
--      the lock order; found by the Advisor's read of upload_sums, upload-sums' Handoff). Now the arm takes her
--      profiles row first, in the trigger's own mode (FOR NO KEY UPDATE, which the trigger then re-takes for free), so
--      the withdrawal queues where every capacity decision does.
--   2. ★ AND UNDER HER ROW IT TAKES THE MEDIA ROW AT ONCE OR NOT AT ALL (NOWAIT). Her row first alone would only turn
--      the cycle round: the writers that take that same media row BEFORE her profiles row (her Delete permanently,
--      `purge_media_now` and `purge_media_rows`; the night's purge; an operator's removal: each through the sums'
--      trigger or `media_release_meter`) would meet a withdrawal holding her row and waiting on theirs. So the arm
--      never waits on a media row while it holds her row (the rule `leave_deleted` keeps with SKIP LOCKED): a row
--      another writer holds this instant answers 55P03 (lock_not_available) with nothing written, which the app words
--      as a retry ("Couldn't remove that upload. Please try again.", `removeMyUpload`), and the writer holding it is
--      taking it for good or down, so her second press reads not_found or lands.
--   3. ONLY A CANDIDATE TAKES EITHER LOCK. The arm reads first whether the row is still a block's removal she has not
--      withdrawn, and locks nothing otherwise, so a repeat press, any other removed row and the host arm take no lock
--      (a guest's loop of presses cannot hold her host's row against the host's own uploads). The write under the
--      locks is the arm's own statement, verbatim, read on the row as it stands once she holds them: a Restore or Let
--      back in that went first wins, the row is back in the album, and her next press withdraws it as any live upload
--      (the main arm).
--   4. THE SUB-SWEEP'S KILL SWITCH, `storage_sums_enabled`, seeded ON (`ops_flags`, admin-observability.md).
--
-- WHAT DOES NOT CHANGE: `remove_my_upload`'s signature, return, answers, security mode and grants (create or replace,
-- its grants restated as they stand); its main arm (a live row: media then her row, as every row writer takes them,
-- and no writer holding her row waits on a live media row: the restores and Let back in lock only removed rows,
-- `leave_deleted` skips what it cannot take) and its host arm (already removed: no write). Every other function:
-- `remove_my_upload_by_session`'s already-removed arm writes nothing (20260920090000), so it shares no order.
--
-- ★ WHAT THIS DOES NOT CLOSE (the lane's Q2, a ROADMAP line): `disown_guest_rows_by_email` re-marks a row the host
-- binned (its media rows, then her row in the trigger) against `restore_media` (her row, then the media): the same
-- 40P01 and a retry, in the instant an address's owner releases a typed upload while its host restores it. Its fix is
-- the restores' own (a writer holding her profiles row never waits on a media row: `restore_media` NOWAIT,
-- `let_back_in` SKIP LOCKED), after host-moments-wiring's `let_back_in` lands.
--
-- WHAT THE DEPLOYED BUILDS MEET (milestone 38's build and the alias share this database): the same answers; in the race
-- of 1, a busy error where there was a deadlock, which their `removeMyUpload` already words as a retry. The flag row is
-- a key no deployed catalog reads. No order with this lane's build: an unseeded switch reads ON, and the sweep and the
-- Rebuild call only what is live.
--
-- PRE-FLIGHT on a throwaway Postgres 17 stand-in (2026-10-07; the touched tables' columns, constraints and lock-taking
-- triggers as live; the current bodies of restore_media, let_back_in, purge_media_now, purge_media_rows,
-- kept_media_ids, media_release_meter, set_media_purge_at, set_media_removal_provenance and the walk, each from its
-- newest repo file; upload_sums applied verbatim), three bodies of the arm against each partner: as live (BEFORE), her
-- row first without NOWAIT (ROW FIRST ALONE), and this file's (AFTER).
--   Each race forced (the partner takes its first lock and holds it 1.5 s; the withdrawal comes 0.5 s in):
--                                       BEFORE              ROW FIRST ALONE     AFTER
--     x her Restore                     40P01 (the host's)  none                none (her Restore wins; a no-op press)
--     x Let back in, restoring          40P01 (the guest's) none                none (the same)
--     x her Delete permanently          none                40P01               none (the withdrawal 55P03 at once)
--     x the night's purge of the row    none                40P01               none (the same)
--   Each pair stressed (8 clients, 30 bursts of 1 s, 50 fresh sneaky rows a burst; deadlocks counted from the log):
--     x her Restore                     81                  0                   0
--     x Let back in, restoring          73                  20 (*)              0
--     x her Delete permanently          0                   56                  0
--     x the night's purge               0                   58                  0
--     (*) two presses of one row across its restore: the arm, holding her row, waiting on the row the other press's
--     main arm holds on its way to her row. NOWAIT is what takes the arm out of every cycle.
--   storage_sums_drift empty after every race and every burst; a repeat press while her row is held answers at once.
--
-- ADVISORS (security): no delta (no new function, table, policy or grant; the arm stays inside its SECURITY DEFINER
-- body, `search_path` pinned).
--
-- APPLY PROTOCOL (database-security.md, Workflow):
--   (1) Drift, read-only: md5(btrim(regexp_replace(prosrc, '\s+', ' ', 'g'))) of `remove_my_upload` must equal its
--       newest repo definition (20260929140000): a77075737be38cc26fe61aa1e870e4db (read live 2026-10-07: equal); and
--       `ops_flags` holds no `storage_sums_enabled` row.
--   (2) The rolled-back proof at the foot, in one execute_sql call (RED without this file's statements, GREEN with).
--   (3) Apply verbatim.  (4) get_advisors (security): no delta.  (5) No type moves: nothing to regenerate.
-- =============================================================================================

-- =============================================================================================
-- 1 to 3. remove_my_upload: her profiles row first in the sneaky block's withdrawal, then its media row at once.
-- =============================================================================================
-- 20260929140000's body verbatim but for the already-removed guest arm's two locks and the read that decides them.
create or replace function public.remove_my_upload(p_media_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_is_host_upload boolean;
  v_already_removed boolean;
  v_host uuid;
begin
  -- Defense-in-depth (the grant already excludes anon); a missing session removes nothing.
  if v_uid is null then
    return jsonb_build_object('ok', false, 'reason', 'unauthorized');
  end if;

  -- Resolve ownership via the SAME two arms as get_my_uploads, capturing which arm matched. A row
  -- matches AT MOST one arm (a host upload has guest_id NULL; a guest upload has a non-null guest_id
  -- whose guests.user_id is the caller). The events join requires deleted_at IS NULL, matching
  -- get_my_uploads -- media in a Trashed event isn't reachable in the tab and isn't removable here.
  select
    (e.host_id = v_uid and m.guest_id is null),   -- TRUE => host arm; FALSE => guest arm
    (m.status = 'removed')
  into v_is_host_upload, v_already_removed
  from public.media m
  join public.events e on e.id = m.event_id and e.deleted_at is null
  left join public.guests g on g.id = m.guest_id
  where m.id = p_media_id
    and (
      (e.host_id = v_uid and m.guest_id is null)        -- host arm
      or (g.user_id = v_uid and e.host_id <> v_uid)     -- guest arm (incl. claimed-anonymous)
    );

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  -- Idempotent: a repeat remove must NOT reset removed_at (that would extend how long the bytes
  -- linger). Already-removed is success -- the end state is "removed" either way.
  if v_already_removed then
    -- ★ THE SNEAKY BLOCK (20260928120000): an approved upload a standing block removed still shows in
    -- its uploader's own feed (get_my_uploads), so her delete there takes: it is withdrawn, final for
    -- the host too, as every withdrawal is (removed_at stays the block's, so no window grows). Any
    -- other removed row stays exactly as it was: a repeat remove is idempotent.
    if not v_is_host_upload then
      -- ★ HER HOST'S PROFILES ROW FIRST, THEN THIS ROW AT ONCE OR NOT AT ALL (20261007022000). The withdrawal moves a
      -- row out of the host's Deleted, so the sums' statement trigger takes her profiles row after this row, and her
      -- Restore and Let back in take her row and then this one: the cycle this closes. Her row first, in the trigger's
      -- mode, queues the withdrawal where every capacity decision queues; and holding it, this row is taken NOWAIT,
      -- since the writers that hold a media row on their way to her row (her Delete permanently, the purge, an
      -- operator's removal) would close the same cycle the other way: one of them holding it answers 55P03, nothing
      -- written, her press hers to make again. Only a row still the block's and not yet withdrawn takes either lock,
      -- so a repeat press locks nothing; the write below re-reads it under both.
      select e.host_id into v_host
        from public.media m
        join public.events e on e.id = m.event_id
       where m.id = p_media_id
         and m.status = 'removed'
         and not m.removed_by_uploader
         and exists (select 1 from public.event_blocks b
                      where b.event_id = m.event_id
                        and m.id = any (b.removed_media_ids)
                        and m.removed_at = b.created_at);
      if found then
        perform 1 from public.profiles p where p.id = v_host for no key update;
        perform 1 from public.media x where x.id = p_media_id for no key update nowait;
        update public.media m
           set removed_by_uploader = true
         where m.id = p_media_id
           and m.status = 'removed'
           and not m.removed_by_uploader
           and exists (select 1 from public.event_blocks b
                        where b.event_id = m.event_id
                          and m.id = any (b.removed_media_ids)
                          and m.removed_at = b.created_at);
      end if;
    end if;
    return jsonb_build_object('ok', true, 'already_removed', true);
  end if;

  -- Soft-remove. The media_set_purge_at BEFORE trigger derives purge_at on this UPDATE (do NOT set it
  -- here, and purge_at is deliberately ungranted). removed_by_uploader = TRUE only for the guest arm,
  -- making that removal private to the host.
  update public.media
     set status = 'removed',
         removed_at = now(),
         removed_by_uploader = not v_is_host_upload
   where id = p_media_id and status <> 'removed';

  return jsonb_build_object('ok', true, 'is_host_upload', v_is_host_upload);
end;
$$;

revoke all on function public.remove_my_upload(uuid) from public, anon;
grant execute on function public.remove_my_upload(uuid) to authenticated;

-- =============================================================================================
-- 4. The storage sums sub-sweep's kill switch, seeded ON (`on conflict do nothing`: a re-apply never flips it).
-- =============================================================================================
insert into public.ops_flags (key, enabled) values ('storage_sums_enabled', true)
on conflict (key) do nothing;

-- =============================================================================================
-- THE ROLLED-BACK PROOF (database-security.md, "An unapplied migration is proved on the live schema"): one execute_sql
-- call. RED: `begin;` + the block below + `rollback;`. GREEN: `begin;` + this file's statements + the block below +
-- `rollback;`. It makes its own host and guest (auth users, so handle_new_user makes their profiles), an album, her
-- guest row and three uploads, puts her out with the host's own block_from_event (two of hers leave for Deleted at the
-- block's instant), then calls remove_my_upload as each of them calls it (authenticated, through dynamic SQL, so RED
-- fails on what it lacks, never on a parse), each step trapping its own failure into the temp `proof` table. One
-- session cannot race two (the pre-flight above does), so the order of the arm's locks is read off the body itself.
--
-- What each live run must show:
--   RED   0 to 4 true (the answers as today: the sneaky block's withdrawal lands, a repeat is idempotent, the host arm
--         and the refusals answer as they do, every host's sums the walk after each act); 5 false (no lock before the
--         re-mark in the body); 6 false (no `storage_sums_enabled` row); 7 true (the grants as they stand).
--   GREEN 0 to 7 all true: the same answers through the new arm, its two locks before the write and only inside the
--         candidate branch, the switch seeded ON, the grants unchanged. Nothing persists after the rollback.
--   The lane's own runs on the live schema (2026-10-07): RED exactly so (5 and 6 false, the rest true), GREEN 8 of 8;
--   after both, the live body's md5 still a77075737be38cc26fe61aa1e870e4db, no flag row, no fixture left.
-- =============================================================================================
-- create temp table proof (n serial, step text, ok boolean, detail text);
-- create temp table fx (k text primary key, id uuid);
-- create function pg_temp.fx(p_k text) returns uuid language sql as $f$ select id from fx where k = p_k $f$;
--
-- -- A call as a signed-in account would make it (null: no session), its answer as text or its error in words.
-- create function pg_temp.as_user(p_user uuid, p_sql text) returns text language plpgsql as $f$
-- declare got text;
-- begin
--   perform set_config('request.jwt.claims',
--     case when p_user is null then '' else json_build_object('sub', p_user, 'role', 'authenticated')::text end, true);
--   set local role authenticated;
--   execute p_sql into got;
--   reset role;
--   perform set_config('request.jwt.claims', '', true);
--   return coalesce(got, 'null');
-- exception when others then
--   reset role;
--   perform set_config('request.jwt.claims', '', true);
--   return 'error ' || sqlstate || ' ' || sqlerrm;
-- end $f$;
--
-- -- Every host on the database at parity (storage_sums_drift paged whole, as the night's sweep pages it): '' or why not.
-- create function pg_temp.parity() returns text language plpgsql as $f$
-- declare got jsonb; after uuid; drifted jsonb := '[]';
-- begin
--   loop
--     got := public.storage_sums_drift(after, 500);
--     drifted := drifted || (got -> 'drifted');
--     after := (got ->> 'next_after')::uuid;
--     exit when after is null;
--   end loop;
--   return case when jsonb_array_length(drifted) = 0 then '' else 'drifted ' || drifted::text end;
-- exception when others then
--   return 'error ' || sqlstate || ' ' || sqlerrm;
-- end $f$;
--
-- -- 0. A host (Pro, so her album passes the event limit) and a guest with a confirmed address; her album; the guest's
-- -- row in it and two of her uploads beside one of the host's own; then the host's block names the guest's account.
-- do $$
-- declare k text; u uuid; e uuid; g uuid; got text;
-- begin
--   foreach k in array array['host', 'guest'] loop
--     u := gen_random_uuid();
--     execute 'insert into auth.users (id, email, email_confirmed_at) values ($1, $2, now())'
--       using u, 'sums-signal-' || u || '@example.com';
--     insert into public.profiles (id, email, display_name) values (u, 'sums-signal-' || u || '@example.com', 'Signal ' || k)
--       on conflict (id) do update set display_name = excluded.display_name;
--     insert into fx values (k, u);
--   end loop;
--   update public.profiles set tier = 'pro', storage_cap_bytes = 1000000000000 where id = pg_temp.fx('host');
--   insert into public.events (host_id, name, require_verified_email)
--   values (pg_temp.fx('host'), 'Storage sums signal: proof', false) returning id into e;
--   insert into fx values ('event', e);
--   insert into public.guests (event_id, user_id, session_token, display_name, verified_at)
--   values (e, pg_temp.fx('guest'), 'sums-signal-' || gen_random_uuid(), 'Signal guest', now()) returning id into g;
--   foreach k in array array['m1', 'm2', 'own'] loop
--     u := gen_random_uuid();
--     insert into public.media (id, event_id, guest_id, type, original_key, file_size_bytes, status)
--     values (u, e, case when k = 'own' then null else g end, 'photo', 'events/' || e || '/photo/' || u || '/original.jpg',
--             case k when 'm1' then 1000 when 'm2' then 2000 else 3000 end, 'approved');
--     insert into fx values (k, u);
--   end loop;
--   got := pg_temp.as_user(pg_temp.fx('host'), format(
--     'select public.block_from_event(p_event_id => %L, p_user_id => %L)::text', e, pg_temp.fx('guest')));
--   insert into proof (step, ok, detail) values ('0 fixtures and the block',
--     got like '%"removed": 2%' and (select count(*) from public.media where event_id = e and status = 'removed') = 2,
--     left(got, 160));
-- exception when others then
--   insert into proof (step, ok, detail) values ('0 fixtures and the block', false, sqlerrm);
-- end $$;
--
-- -- 1. Her delete in her own feed withdraws an upload the standing block removed: final for the host too, removed_at
-- -- left the block's, out of the host's Deleted, and every host's sums still the walk.
-- do $$
-- declare got text; m public.media; fail text := '';
-- begin
--   got := pg_temp.as_user(pg_temp.fx('guest'), format('select public.remove_my_upload(%L)::text', pg_temp.fx('m1')));
--   select * into m from public.media where id = pg_temp.fx('m1');
--   if got not like '%"already_removed": true%' then fail := fail || ' answer ' || got || ';'; end if;
--   if not m.removed_by_uploader or m.status <> 'removed' then fail := fail || ' not withdrawn;'; end if;
--   if m.removed_at is distinct from (select b.created_at from public.event_blocks b where b.event_id = pg_temp.fx('event')) then
--     fail := fail || ' removed_at moved;';
--   end if;
--   if pg_temp.parity() <> '' then fail := fail || ' ' || pg_temp.parity() || ';'; end if;
--   insert into proof (step, ok, detail) values ('1 the sneaky block''s withdrawal lands', fail = '',
--     coalesce(nullif(btrim(fail), ''), got || '; at parity'));
-- exception when others then
--   insert into proof (step, ok, detail) values ('1 the sneaky block''s withdrawal lands', false, sqlerrm);
-- end $$;
--
-- -- 2. A repeat press is idempotent: the same answer, nothing moved.
-- do $$
-- declare got text; before timestamptz; fail text := '';
-- begin
--   select updated_at into before from public.media where id = pg_temp.fx('m1');
--   got := pg_temp.as_user(pg_temp.fx('guest'), format('select public.remove_my_upload(%L)::text', pg_temp.fx('m1')));
--   if got not like '%"already_removed": true%' then fail := fail || ' answer ' || got || ';'; end if;
--   if (select updated_at from public.media where id = pg_temp.fx('m1')) is distinct from before then
--     fail := fail || ' the row was written;';
--   end if;
--   insert into proof (step, ok, detail) values ('2 a repeat press', fail = '', coalesce(nullif(btrim(fail), ''), got));
-- exception when others then
--   insert into proof (step, ok, detail) values ('2 a repeat press', false, sqlerrm);
-- end $$;
--
-- -- 3. The other arms answer as today: the host's own upload is not the guest's (not_found); the host removes it (the
-- -- host arm), then again (already removed, no write); no session is unauthorized; the sums still the walk.
-- do $$
-- declare a text; b text; c text; d text; fail text := '';
-- begin
--   a := pg_temp.as_user(pg_temp.fx('guest'), format('select public.remove_my_upload(%L)::text', pg_temp.fx('own')));
--   b := pg_temp.as_user(pg_temp.fx('host'), format('select public.remove_my_upload(%L)::text', pg_temp.fx('own')));
--   c := pg_temp.as_user(pg_temp.fx('host'), format('select public.remove_my_upload(%L)::text', pg_temp.fx('own')));
--   d := pg_temp.as_user(null, format('select public.remove_my_upload(%L)::text', pg_temp.fx('m2')));
--   if a not like '%"not_found"%' then fail := fail || ' guest on the host''s: ' || a || ';'; end if;
--   if b not like '%"is_host_upload": true%' then fail := fail || ' host arm: ' || b || ';'; end if;
--   if c not like '%"already_removed": true%' then fail := fail || ' host repeat: ' || c || ';'; end if;
--   if d not like '%"unauthorized"%' then fail := fail || ' no session: ' || d || ';'; end if;
--   if (select removed_by_uploader from public.media where id = pg_temp.fx('own')) then
--     fail := fail || ' the host''s removal marked as a withdrawal;';
--   end if;
--   if pg_temp.parity() <> '' then fail := fail || ' ' || pg_temp.parity() || ';'; end if;
--   insert into proof (step, ok, detail) values ('3 the other arms', fail = '',
--     coalesce(nullif(btrim(fail), ''), 'not_found, the host arm, idempotent, unauthorized; at parity'));
-- exception when others then
--   insert into proof (step, ok, detail) values ('3 the other arms', false, sqlerrm);
-- end $$;
--
-- -- 4. The block's other removal withdrawn too, then the guest's main arm on a live upload of hers; every host at parity.
-- do $$
-- declare got text; live uuid := gen_random_uuid(); fail text := '';
-- begin
--   got := pg_temp.as_user(pg_temp.fx('guest'), format('select public.remove_my_upload(%L)::text', pg_temp.fx('m2')));
--   if got not like '%"already_removed": true%'
--      or not (select removed_by_uploader from public.media where id = pg_temp.fx('m2')) then
--     fail := fail || ' m2: ' || got || ';';
--   end if;
--   insert into public.media (id, event_id, guest_id, type, original_key, file_size_bytes, status)
--   select live, pg_temp.fx('event'), g.id, 'photo', 'events/' || g.event_id || '/photo/' || live || '/original.jpg', 4000,
--          'approved'
--     from public.guests g where g.event_id = pg_temp.fx('event') and g.user_id = pg_temp.fx('guest');
--   got := pg_temp.as_user(pg_temp.fx('guest'), format('select public.remove_my_upload(%L)::text', live));
--   if got not like '%"is_host_upload": false%'
--      or not (select removed_by_uploader and status = 'removed' from public.media where id = live) then
--     fail := fail || ' main arm: ' || got || ';';
--   end if;
--   if pg_temp.parity() <> '' then fail := fail || ' ' || pg_temp.parity() || ';'; end if;
--   insert into proof (step, ok, detail) values ('4 the second withdrawal and the main arm', fail = '',
--     coalesce(nullif(btrim(fail), ''), 'withdrawn, withdrawn; every host at parity'));
-- exception when others then
--   insert into proof (step, ok, detail) values ('4 the second withdrawal and the main arm', false, sqlerrm);
-- end $$;
--
-- -- 5. The arm's order, read off the body (one session cannot race two): her profiles row, then the media row NOWAIT,
-- -- then the re-mark, all inside the candidate branch and after the already-removed test.
-- do $$
-- declare body text := (select regexp_replace(p.prosrc, '\s+', ' ', 'g') from pg_proc p
--                         join pg_namespace n on n.oid = p.pronamespace
--                        where n.nspname = 'public' and p.proname = 'remove_my_upload');
--   arm int; cand int; row_lock int; media_lock int; remark int;
-- begin
--   arm := position('if v_already_removed then' in body);
--   cand := nullif(position('if found then' in substr(body, arm)), 0) + arm - 1;
--   row_lock := position('from public.profiles p where p.id = v_host for no key update;' in body);
--   media_lock := position('for no key update nowait;' in body);
--   remark := position('set removed_by_uploader = true' in body);
--   insert into proof (step, ok, detail) values ('5 her row, then the media row at once, then the write',
--     coalesce(arm > 0 and cand > arm and row_lock > cand and media_lock > row_lock and remark > media_lock, false),
--     format('already-removed %s, candidate %s, her row %s, the media row %s, the re-mark %s', arm, cand, row_lock,
--            media_lock, remark));
-- exception when others then
--   insert into proof (step, ok, detail) values ('5 her row, then the media row at once, then the write', false, sqlerrm);
-- end $$;
--
-- -- 6. The sub-sweep's switch, seeded ON.
-- do $$
-- begin
--   insert into proof (step, ok, detail) values ('6 the storage_sums switch',
--     coalesce((select f.enabled from public.ops_flags f where f.key = 'storage_sums_enabled'), false),
--     coalesce((select 'storage_sums_enabled = ' || f.enabled::text from public.ops_flags f
--                where f.key = 'storage_sums_enabled'), 'no row'));
-- exception when others then
--   insert into proof (step, ok, detail) values ('6 the storage_sums switch', false, sqlerrm);
-- end $$;
--
-- -- 7. The grants as they stand: the signed-in caller's (and the service role's, as live), never anon or PUBLIC.
-- do $$
-- declare got text;
-- begin
--   select string_agg(r.who || ':' || r.what, ' ' order by r.who || ':' || r.what) into got
--     from (select case when a.grantee = 0 then 'PUBLIC' else a.grantee::regrole::text end as who, a.privilege_type as what
--             from pg_proc p, aclexplode(p.proacl) a where p.oid = to_regprocedure('public.remove_my_upload(uuid)')) r;
--   insert into proof (step, ok, detail) values ('7 the grants',
--     coalesce(got = 'authenticated:EXECUTE postgres:EXECUTE service_role:EXECUTE', false), coalesce(got, 'no grants'));
-- exception when others then
--   insert into proof (step, ok, detail) values ('7 the grants', false, sqlerrm);
-- end $$;
--
-- select n, step, ok::text, detail from proof order by n;
