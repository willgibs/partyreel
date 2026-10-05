-- =============================================================================================
-- THE ROLL, ANY SIZE FROM 1 TO 99, AND HERS TO KEEP (lane `settings-wiring`; customize r1, Will's desk 3 answer
-- `roll=both`, 2026-10-05: film's 12, 24 and 36 as boxes, and Other, which opens a stepper from 1 to 99 under them, in
-- Create and in Settings). His ask behind it: "24 seems like an arbitrary shot in the dark on our side."
--
-- WHAT CHANGES, three things on `events` (no column, no grant, no RPC body):
--   1. THE BOUNDS: `events_roll_size_range` holds a roll to 1 to 99 (it held 1 to 24, the old default as the most a
--      host could name). 99 is two digits on the camera's count. TypeScript's twins are `ROLL_MIN` and `ROLL_MAX`
--      (src/lib/disposable/roll.ts), under `roll.test.ts`'s parity test, which reads the winning CHECK.
--   2. HER ROLL OUTLIVES THE CAMERA: `events_reveal_stamp` no longer clears `roll_size` when the album takes free
--      uploads, so a style switch (Disposable to Live and back) or the camera turned off and on comes back to the size
--      she named; until now the clear and the stamp's `coalesce` wrote it back to 24 (the ROADMAP line this retires).
--      A camera still always carries a roll (24 unless she named one, the stamp's coalesce, unchanged), and the CHECK
--      that tied the roll to the camera both ways, `events_roll_size_follows_capture`, becomes the one way that is
--      still true, `events_camera_has_roll`: `capture <> 'camera' or roll_size is not null`.
--   3. The column's, the capture's and the stamp's comments say so.
--
-- ★ A FREE-UPLOAD ALBUM'S `roll_size` IS NO SIGN OF A CAMERA FROM HERE ON. Every reader already asks `capture` first:
-- `create_media`, `get_upload_context` and `get_upload_gate` count a roll only `if v_event.capture = 'camera'` (read in
-- their winning bodies, 20261005181000), and the app's one reader of the read's columns, `developFactsOf`
-- (src/lib/disposable/facts.ts), answers a roll only for the camera, so no guest surface meets a kept roll.
-- `get_event_by_qr_token` returns the column as stored (a presentation setting, unredacted like its neighbours).
--
-- What partyreel.com's older build meets meanwhile: nothing it can see. It never writes `roll_size`, a roll over 24
-- reaches it only once a host names one in this lane's build, and its camera then reads the server's own count
-- (`/api/guests/mine`'s `roll.cap`), its pre-read fallback alone holding a roll over 24 to 24 for an instant.
--
-- LOCKS AT APPLY: the ALTER takes ACCESS EXCLUSIVE on `events` for its two CHECK validations, one scan of a table of
-- a few hundred rows; `create or replace` of the trigger function takes no table lock. Nothing is backfilled: a
-- free-upload album holds no roll today (the old stamp cleared it), so every row passes both new CHECKs as it stands.
--
-- APPLY PROTOCOL (database-security.md -> Workflow):
--   (1) drift, read-only (live 2026-10-05): `events_roll_size_range` is `CHECK (((roll_size >= 1) AND (roll_size <= 24)))`,
--       `events_roll_size_follows_capture` is `CHECK (((capture = 'camera'::text) = (roll_size IS NOT NULL)))`, no
--       `events_camera_has_roll`; `events_reveal_stamp`'s prosrc md5 over whitespace collapsed to one space is
--       21128fda973998ed3f5f87e1c8381488, its ACL `{postgres=X/postgres,service_role=X/postgres}`; events carries ten
--       triggers (events_develops_rewrite, events_door_opened, events_door_to_password, events_enforce_limit,
--       events_enforce_limit_on_undelete, events_guard_privileged_transitions, events_hold_released,
--       events_reveal_stamp, events_set_purge_at, events_set_updated_at); 23 camera albums of 153, rolls 1 and 24.
--   (2) the rolled-back check at the foot (red on today's schema, green with this file), then apply verbatim.
--   (3) get_advisors, EXPECTED DELTA: none (one trigger function replaced in place, its ACL kept and restated).
--   (4) no types to regenerate (no column, no function signature).
-- =============================================================================================

-- =============================================================================================
-- 1 and 2. The bounds, and a camera's roll that free uploads keep.
-- =============================================================================================
alter table public.events
  drop constraint events_roll_size_range,
  drop constraint events_roll_size_follows_capture,
  add constraint events_roll_size_range check (roll_size between 1 and 99),
  add constraint events_camera_has_roll check (capture <> 'camera' or roll_size is not null);

-- THE EVENT'S OWN STAMPS (BEFORE INSERT OR UPDATE of the three host-written columns), as the foundation wrote them but
-- for the roll: the camera carries one (24 unless the host named another), and free uploads keep the last one she
-- named, so the camera comes back to it.
create or replace function public.events_reveal_stamp()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.capture = 'camera' then
    new.roll_size := coalesce(new.roll_size, 24); -- mirrors ROLL_SHOTS
  end if;

  if new.develops_at is not null
     and (tg_op = 'INSERT' or new.develops_at is distinct from old.develops_at)
     and new.develops_at < now() + interval '1 minute' then
    new.develops_at := now();
  end if;

  if tg_op = 'INSERT' then
    new.sealed_from := case when new.capture = 'camera' or new.develops_at > now() then now() end;
  elsif (new.develops_at > now() and (old.develops_at is null or old.develops_at <= now()))
     or (new.capture = 'camera' and old.capture is distinct from 'camera') then
    new.sealed_from := now();
  elsif new.capture <> 'camera' and new.develops_at is null then
    new.sealed_from := null;
  else
    new.sealed_from := old.sealed_from;
  end if;
  return new;
end;
$$;

-- `create or replace` keeps the function's ACL; restated so the file says who may run it (no client role).
revoke all on function public.events_reveal_stamp() from public, anon, authenticated;

-- =============================================================================================
-- 3. What the schema says about it.
-- =============================================================================================
comment on column public.events.roll_size is
  'The camera''s roll: the live shots a guest may hold in the current period, 1 to 99 (24 unless the host names another). A camera always carries one; free uploads keep the last one named, or none, so the camera comes back to her size. Read it only where capture is camera. Filled in by events_reveal_stamp.';
comment on column public.events.capture is
  'How guests add: upload (free uploads) or camera (the album''s camera: a guest holds at most roll_size live shots in the current period, and takes at most three rolls'' worth, counted by create_media). Host-written; events_reveal_stamp fills in the camera''s roll and stamps sealed_from with it.';
comment on function public.events_reveal_stamp() is
  'BEFORE INSERT OR UPDATE OF capture, roll_size, develops_at on events: a camera carries a roll (24 unless named; free uploads keep the last one named); a develops_at within a minute of now (or before it) is stored as now(), Develop now in the database''s clock; sealed_from stamps now() when a develop time comes ahead or the camera begins, and clears when neither remains.';

-- =============================================================================================
-- THE ROLLED-BACK CHECK. Proved on the live schema BEFORE applying: ONE execute_sql call of `begin;`, the FIXTURES
-- block, this file's statements above (GREEN; left out, RED), the PROOF block and
-- `select n, step, ok, detail from proof order by n; rollback;`. RED on today's schema: all six steps fail (the
-- roll is held to 24, cleared by free uploads, tied to the camera both ways). Each step traps its own failure into
-- `proof`; `now()` is one instant for the whole transaction.
--
-- -- FIXTURES
-- set constraints all immediate;
-- create temp table proof (n serial, step text, ok boolean, detail text) on commit drop;
-- do $$
-- declare
--   v_host uuid := 'b0115000-0000-4000-8000-000000000001';
-- begin
--   insert into auth.users (id, email, email_confirmed_at) values (v_host, 'roll-check-host@check.invalid', now());
--   update public.profiles set tier = 'pro', display_name = 'Roll Check' where id = v_host;
--   -- E1 a Disposable (the camera, a develop time tomorrow, a roll of 12), with one anonymous ticket; E2 free uploads.
--   insert into public.events (id, host_id, name, visibility, require_verified_email, accepting_uploads,
--                              moderation_mode, capture, roll_size, develops_at)
--   values ('b0115000-0000-4000-8000-0000000000e1', v_host, 'Roll check one', 'open', false, true, 'live', 'camera', 12,
--           now() + interval '1 day'),
--          ('b0115000-0000-4000-8000-0000000000e2', v_host, 'Roll check two', 'open', false, true, 'live', 'upload', null,
--           null);
--   insert into public.guests (id, event_id, session_token, display_name)
--   values ('b0115000-0000-4000-8000-0000000000a1', 'b0115000-0000-4000-8000-0000000000e1', repeat('b1', 32), 'Roll Guest'),
--          ('b0115000-0000-4000-8000-0000000000a2', 'b0115000-0000-4000-8000-0000000000e2', repeat('b2', 32), 'Free Guest');
-- end $$;
--
-- -- (GREEN only: this file's statements, verbatim, here.)
--
-- -- PROOF
-- do $$
-- declare
--   e1 uuid := 'b0115000-0000-4000-8000-0000000000e1';
--   e2 uuid := 'b0115000-0000-4000-8000-0000000000e2';
--   r jsonb;
--   n integer;
--   i integer;
--   v_id uuid;
-- begin
--   -- 1. A roll of 99 is named; past it, and under 1, the CHECK refuses.
--   begin
--     update public.events set roll_size = 99 where id = e1;
--     if (select roll_size from public.events where id = e1) <> 99 then raise exception 'not 99'; end if;
--     begin update public.events set roll_size = 100 where id = e1; raise exception 'stored 100';
--     exception when check_violation then
--       if sqlerrm not like '%events_roll_size_range%' then raise; end if;
--     end;
--     begin update public.events set roll_size = 0 where id = e1; raise exception 'stored 0';
--     exception when check_violation then
--       if sqlerrm not like '%events_roll_size_range%' then raise; end if;
--     end;
--     r := public.get_upload_context(repeat('b1', 32), 'photo') -> 'roll';
--     if (r ->> 'cap')::integer <> 99 or (r ->> 'ceiling')::integer <> 297 then raise exception 'the roll reads %', r; end if;
--     insert into proof (step, ok, detail) values ('1 a roll of 1 to 99, the guest''s count at 99', true, r::text);
--   exception when others then insert into proof (step, ok, detail) values ('1 a roll of 1 to 99, the guest''s count at 99', false, sqlerrm);
--   end;
--   -- 2. ★ Kept across a style switch: Disposable at 30, to Live (patchForStyle's one save of the three columns), and back.
--   begin
--     update public.events set roll_size = 30 where id = e1;
--     update public.events set capture = 'upload', moderation_mode = 'live', develops_at = null where id = e1;
--     if (select roll_size from public.events where id = e1) is distinct from 30 then
--       raise exception 'Live kept %', (select roll_size from public.events where id = e1);
--     end if;
--     if (select sealed_from from public.events where id = e1) is not null then raise exception 'Live kept a period'; end if;
--     if public.get_upload_context(repeat('b1', 32), 'photo') -> 'roll' <> 'null'::jsonb then
--       raise exception 'free uploads count a roll';
--     end if;
--     update public.events set capture = 'camera', develops_at = now() + interval '2 days' where id = e1;
--     if (select roll_size from public.events where id = e1) is distinct from 30 then
--       raise exception 'back to the camera at %', (select roll_size from public.events where id = e1);
--     end if;
--     if (select sealed_from from public.events where id = e1) is distinct from now() then raise exception 'no new period'; end if;
--     insert into proof (step, ok, detail) values ('2 her roll kept across a style switch, free uploads counting none', true, null);
--   exception when others then insert into proof (step, ok, detail) values ('2 her roll kept across a style switch, free uploads counting none', false, sqlerrm);
--   end;
--   -- 3. Free uploads keep a roll named for them, or none; the camera comes to it, or to 24.
--   begin
--     update public.events set roll_size = 50 where id = e2;
--     if (select roll_size from public.events where id = e2) is distinct from 50 then raise exception 'upload dropped 50'; end if;
--     update public.events set capture = 'camera' where id = e2;
--     if (select roll_size from public.events where id = e2) is distinct from 50 then raise exception 'camera at %', (select roll_size from public.events where id = e2); end if;
--     update public.events set capture = 'upload', roll_size = null where id = e2;
--     update public.events set capture = 'camera' where id = e2;
--     if (select roll_size from public.events where id = e2) is distinct from 24 then raise exception 'unnamed camera at %', (select roll_size from public.events where id = e2); end if;
--     update public.events set roll_size = null where id = e2;
--     if (select roll_size from public.events where id = e2) is distinct from 24 then raise exception 'a camera cleared its roll'; end if;
--     insert into proof (step, ok, detail) values ('3 free uploads keep a named roll; a camera always carries one', true, null);
--   exception when others then insert into proof (step, ok, detail) values ('3 free uploads keep a named roll; a camera always carries one', false, sqlerrm);
--   end;
--   -- 4. A roll past the old 24 counts: two shots fill a roll of 2, the third is refused in the roll's own words, and the
--   --    host's 26 lets it through (a roll raised mid-period counts against the same live shots).
--   begin
--     update public.events set roll_size = 2 where id = e1;
--     for i in 1..2 loop
--       v_id := gen_random_uuid();
--       perform public.create_media(repeat('b1', 32), v_id, 'photo',
--         'events/' || e1 || '/photo/' || v_id || '/original.jpg', 1000, null, null, 100, 100, true);
--     end loop;
--     begin
--       v_id := gen_random_uuid();
--       perform public.create_media(repeat('b1', 32), v_id, 'photo',
--         'events/' || e1 || '/photo/' || v_id || '/original.jpg', 1000, null, null, 100, 100, true);
--       raise exception 'a third shot on a roll of 2';
--     exception when check_violation then
--       if sqlerrm <> 'You''ve taken all 2 shots on your roll.' then raise; end if;
--     end;
--     update public.events set roll_size = 26 where id = e1;
--     v_id := gen_random_uuid();
--     perform public.create_media(repeat('b1', 32), v_id, 'photo',
--       'events/' || e1 || '/photo/' || v_id || '/original.jpg', 1000, null, null, 100, 100, true);
--     r := public.get_upload_context(repeat('b1', 32), 'photo') -> 'roll';
--     if (r ->> 'used')::integer <> 3 or (r ->> 'cap')::integer <> 26 or (r ->> 'ceiling')::integer <> 78 then
--       raise exception 'the roll reads %', r;
--     end if;
--     insert into proof (step, ok, detail) values ('4 a roll past 24 counts, raised mid-period', true, r::text);
--   exception when others then insert into proof (step, ok, detail) values ('4 a roll past 24 counts, raised mid-period', false, sqlerrm);
--   end;
--   -- 5. A born Disposable names its roll at birth, and one born with none carries 24.
--   begin
--     insert into public.events (id, host_id, name, visibility, require_verified_email, accepting_uploads,
--                                moderation_mode, capture, roll_size, develops_at)
--     values ('b0115000-0000-4000-8000-0000000000e3', 'b0115000-0000-4000-8000-000000000001', 'Roll check three',
--             'open', false, true, 'live', 'camera', 36, now() + interval '1 day'),
--            ('b0115000-0000-4000-8000-0000000000e4', 'b0115000-0000-4000-8000-000000000001', 'Roll check four',
--             'open', false, true, 'live', 'camera', null, now() + interval '1 day');
--     select count(*) into n from public.events
--      where (id = 'b0115000-0000-4000-8000-0000000000e3' and roll_size = 36)
--         or (id = 'b0115000-0000-4000-8000-0000000000e4' and roll_size = 24);
--     if n <> 2 then raise exception 'born: %', n; end if;
--     insert into proof (step, ok, detail) values ('5 a roll named at birth, or 24', true, null);
--   exception when others then insert into proof (step, ok, detail) values ('5 a roll named at birth, or 24', false, sqlerrm);
--   end;
--   -- 6. The CHECKs as they stand, and the stamp is still no client's to run.
--   begin
--     if exists (select 1 from pg_constraint where conrelid = 'public.events'::regclass and conname = 'events_roll_size_follows_capture') then
--       raise exception 'the roll still follows the capture both ways';
--     end if;
--     if (select pg_get_constraintdef(oid) from pg_constraint where conrelid = 'public.events'::regclass and conname = 'events_camera_has_roll')
--        is distinct from 'CHECK (((capture <> ''camera''::text) OR (roll_size IS NOT NULL)))' then
--       raise exception 'events_camera_has_roll reads %', (select pg_get_constraintdef(oid) from pg_constraint where conrelid = 'public.events'::regclass and conname = 'events_camera_has_roll');
--     end if;
--     if (select pg_get_constraintdef(oid) from pg_constraint where conrelid = 'public.events'::regclass and conname = 'events_roll_size_range')
--        is distinct from 'CHECK (((roll_size >= 1) AND (roll_size <= 99)))' then
--       raise exception 'events_roll_size_range reads %', (select pg_get_constraintdef(oid) from pg_constraint where conrelid = 'public.events'::regclass and conname = 'events_roll_size_range');
--     end if;
--     if has_function_privilege('authenticated', 'public.events_reveal_stamp()', 'execute')
--        or has_function_privilege('anon', 'public.events_reveal_stamp()', 'execute') then
--       raise exception 'a client role may run the stamp';
--     end if;
--     if not has_column_privilege('authenticated', 'public.events', 'roll_size', 'update')
--        or not has_column_privilege('authenticated', 'public.events', 'roll_size', 'insert') then
--       raise exception 'the host lost the roll''s column grant';
--     end if;
--     insert into proof (step, ok, detail) values ('6 the CHECKs as they stand; the stamp no client''s; the host''s grant', true, null);
--   exception when others then insert into proof (step, ok, detail) values ('6 the CHECKs as they stand; the stamp no client''s; the host''s grant', false, sqlerrm);
--   end;
-- end $$;
-- select n, step, ok, detail from proof order by n;
-- =============================================================================================
