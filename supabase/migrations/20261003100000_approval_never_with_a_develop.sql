-- =============================================================================================
-- APPROVAL NEVER STANDS WITH A DEVELOP (lane `wait-wiring`; the-wait r1's `both=never`, Will's desk on build 45,
-- 2026-10-03): "If we allow this, I'd expect a large majority of hosts to enable approval as a safety measure but
-- forget to approve everything prior to the disposables developing, leading to a bad guest experience. Setting the
-- develop date provides time to review prior to the reveal and the date can always be pushed back by the host if more
-- review time is needed ... approval can remain on live, where it serves a real benefit to moderation." And settled
-- with him the same night: when an album switches from approve-each to a develop time, its held photos JOIN THE ROLL
-- (approved and sealed, developing with everyone's, removable before it), and the switch's confirm line says so.
--
-- The foundation (20261002200000) made approve plus develop legal (a row shows once approved AND past its time) and left
-- whether it is ever offered to this board. It is not: when everyone sees is ONE answer of three (right away, as the
-- host approves each, at a develop time), and the database now holds it to that.
--
-- WHAT CHANGES, four things:
--   1. A HELD ROW APPROVED UNDER A DEVELOP TIME AHEAD IS SEALED WITH IT (`media_seal_on_approval`, BEFORE UPDATE OF
--      status, a row moving from `pending` to `approved` with no seal): it takes its event's develop time while that is
--      ahead, whoever approves it (this file's own release below, the app's `approveAllPending`, Review). No guest has
--      seen a held row, so sealing one hides nothing anyone saw (the foundation's invariant, which its guard test holds
--      for every `update ... set sealed_until`; this is the one seal written in a trigger, pinned in this lane's own
--      guard, `src/lib/disposable/approval-never-develops.test.ts`). It closes a straggler the foundation left: a held
--      row the develop's save could not lock that instant (SKIP LOCKED) stayed unsealed, and the app's
--      `approveAllPending` after the save then approved it into view hours before the develop.
--   2. THE ROWS HOLDING BOTH ARE BROUGHT TO ONE ANSWER (none live on 2026-10-03, read before this was written; the two
--      statements guard any made before this applies): the develop time stays, the held rows are approved (sealed by 1
--      while the develop is ahead: they join the roll), and the album leaves approval.
--   3. A CHECK REFUSES THE PAIR: `events_approval_never_develops`, `not (moderation_mode = 'hold_for_approval' and
--      develops_at is not null)`. A develop time reached is still a develop time (the column holds it), so an album that
--      developed takes approval only by clearing it, which Settings' "As you approve each" does in one save of both
--      columns. The host's write reads the refusal by the CHECK's name and says it in words
--      (`APPROVAL_NEVER_WITH_A_DEVELOP`, `src/lib/disposable/album-style.ts`), as it refuses a patch asking for both.
--   4. LEAVING APPROVAL RELEASES WHAT IS HELD IN THE SAME SAVE (`events_hold_released`, AFTER UPDATE OF moderation_mode,
--      from `hold_for_approval` to anything else): every held row it can take at once is approved, so into a develop time
--      they join the roll (sealed by 1) and to right away they show at once, in the transaction of the switch. The per-row
--      pings are held for the pass and the album rings once, as the develop's own pass does. The app's
--      `approveAllPending` after a live save stays (idempotent): it heals a row this pass skipped, and 1 seals it.
--
-- LOCK ORDER (the foundation's header, "nothing waits on a media row while it holds the event row"): the release runs
-- inside the host's UPDATE, which holds the event row, so it takes only the media rows it can lock at once (SKIP
-- LOCKED); a row another writer holds that instant (a removal, a hide in Review, a purge) is left held, and the app's
-- `approveAllPending` after the save, which holds no event row, takes it. Its shape is the save's own rewrite
-- (`events_develops_rewrite`, `develop_rows(new, true)`, measured by the foundation: twelve writers for 90 seconds, no
-- deadlock naming the event row): one bulk media UPDATE in one plan's order, its album stamps at COMMIT in event-id
-- order. The seal reads the event row without a lock (a plain read), so it adds no lock to any writer that approves.
-- AFTER triggers fire by name, `events_develops_rewrite` before `events_hold_released`, and either order lands the same
-- rows: the rewrite seals the held rows of a new develop time, the release approves them, and the seal covers any the
-- rewrite skipped.
--
-- AN EXPAND: two new trigger functions, two triggers and a CHECK; no body is replaced, no column added, so no types to
-- regenerate. One change the deployed build meets: a save asking for approval while a develop time is set (the review
-- room's "Turn on review" on a develop album, its only path) is refused (23514) where it was stored; the deployed build
-- says its generic "Couldn't save your changes", this lane's build the refusal's words. Settings never asks for both.
--
-- LOCKS AT APPLY: the CHECK's validation scans `events` under ACCESS EXCLUSIVE for an instant (one table of a few hundred
-- rows); the trigger creations take SHARE ROW EXCLUSIVE on `media` and `events` until COMMIT (writes wait, reads do not);
-- the two normalizing UPDATEs touch only rows holding both (none today).
--
-- APPLY PROTOCOL (database-security.md -> Workflow):
--   (1) drift, read-only: none of `media_seal_on_approval`, `events_hold_released` (functions or triggers) or
--       `events_approval_never_develops` exists, and no row holds both:
--         select count(*) from public.events where moderation_mode = 'hold_for_approval' and develops_at is not null;
--       (0 on 2026-10-03); events carries nine triggers (live 2026-10-03: events_develops_rewrite, events_door_opened,
--       events_door_to_password, events_enforce_limit, events_enforce_limit_on_undelete,
--       events_guard_privileged_transitions, events_reveal_stamp, events_set_purge_at, events_set_updated_at).
--   (2) the rolled-back check at the foot (red on today's schema, green with this file), then apply verbatim.
--   (3) get_advisors, EXPECTED DELTA: none (two SECURITY DEFINER trigger functions, EXECUTE revoked from public, anon
--       and authenticated, so neither joins 0028 or 0029).
--   (4) no types to regenerate.
-- =============================================================================================

-- =============================================================================================
-- 1. A held row approved under a develop time ahead is sealed with it.
-- =============================================================================================
create function public.media_seal_on_approval()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_at timestamptz;
begin
  -- The trigger's WHEN already asked: this row leaves `pending` for `approved`, unsealed. A plain read: no lock.
  select e.develops_at into v_at from public.events e where e.id = new.event_id;
  if v_at > now() then
    new.sealed_until := v_at;
  end if;
  return new;
end;
$$;

comment on function public.media_seal_on_approval() is
  'BEFORE UPDATE OF status on media, a row moving from pending to approved with no seal: it takes its event''s develops_at while that is ahead (a held row joins the roll, whoever approves it; no guest has seen a held row). SECURITY DEFINER (any approver, the host''s session included, reads the event''s develop time); a trigger''s alone.';

create trigger media_seal_on_approval
  before update of status on public.media
  for each row
  when (old.status = 'pending' and new.status = 'approved' and new.sealed_until is null)
  execute function public.media_seal_on_approval();

-- =============================================================================================
-- 2. The rows holding both, brought to one answer: the develop stays, the held rows join the roll, approval goes.
-- =============================================================================================
-- The per-row pings are held for the pass, and each album that moved rings once after it (the develop's own shape; a
-- ring is delivered at COMMIT, so it may ring before the album leaves approval in this same transaction).
select pg_catalog.set_config('partyreel.doorbell_hold', 'on', true);

update public.media m
   set status = 'approved'
  from public.events e
 where e.id = m.event_id
   and e.moderation_mode = 'hold_for_approval'
   and e.develops_at is not null
   and m.status = 'pending';

select pg_catalog.set_config('partyreel.doorbell_hold', '', true);
select public.album_doorbell(e.id) from public.events e
 where e.moderation_mode = 'hold_for_approval' and e.develops_at is not null;

update public.events set moderation_mode = 'live' where moderation_mode = 'hold_for_approval' and develops_at is not null;

-- =============================================================================================
-- 3. The CHECK.
-- =============================================================================================
alter table public.events add constraint events_approval_never_develops check (not (moderation_mode = 'hold_for_approval' and develops_at is not null));

comment on constraint events_approval_never_develops on public.events is
  'When everyone sees is one answer: right away, as the host approves each, or at a develop time; never approval with a develop time (the-wait r1, both=never). The host''s write reads a refusal by this name (APPROVAL_NEVER_WITH_A_DEVELOP_CHECK).';

-- =============================================================================================
-- 4. Leaving approval releases what is held, in the same save.
-- =============================================================================================
create function public.events_hold_released()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_n integer := 0;
begin
  -- Every held row this save can take at once: into a develop time ahead they are sealed as they are approved
  -- (`media_seal_on_approval`), to right away they show. A row another writer holds is left to the app's
  -- `approveAllPending` after the save, which holds no event row (the header's lock order).
  perform pg_catalog.set_config('partyreel.doorbell_hold', 'on', true);
  update public.media m
     set status = 'approved'
   where m.id in (select s.id from public.media s
                   where s.event_id = new.id and s.status = 'pending'
                   for update skip locked);
  get diagnostics v_n = row_count;
  perform pg_catalog.set_config('partyreel.doorbell_hold', '', true);
  if v_n > 0 then
    perform public.album_doorbell(new.id);
  end if;
  return null;
end;
$$;

comment on function public.events_hold_released() is
  'AFTER UPDATE OF moderation_mode on events, leaving hold_for_approval: approves every held row it can lock at once (SKIP LOCKED, inside the host''s save, which holds the event row), sealed with the develop time while one is ahead (media_seal_on_approval); per-row pings held, one ring after. SECURITY DEFINER (the host''s save releases rows her session never writes here); a trigger''s alone.';

create trigger events_hold_released
  after update of moderation_mode on public.events
  for each row
  when (old.moderation_mode = 'hold_for_approval' and new.moderation_mode is distinct from 'hold_for_approval')
  execute function public.events_hold_released();

revoke all on function public.media_seal_on_approval() from public, anon, authenticated;
revoke all on function public.events_hold_released() from public, anon, authenticated;

-- =============================================================================================
-- THE ROLLED-BACK CHECK. Proved on the live schema BEFORE applying: ONE execute_sql call of `begin;`, the FIXTURES block
-- below (uncommented), then (GREEN) this file's statements verbatim, then the PROOF block, then
-- `select n, step, ok, detail from proof order by n; rollback;`. RED: the same call WITHOUT this file's statements, on
-- today's schema, where every step fails on what it lacks. Fresh fixtures (a Pro host, four albums, a guest's ticket on
-- each, held and shown rows written as the owner, past `create_media`: the rows never leave the transaction, so no R2
-- object is needed); `set constraints all immediate` makes each statement one flush, so the album's versions are read
-- mid-transaction. Each step traps its own failure into `proof`.
--
-- -- FIXTURES
-- set constraints all immediate;
-- create temp table proof (n serial, step text, ok boolean, detail text) on commit drop;
-- do $$
-- declare
--   v_host uuid := 'a9a0d000-0000-4000-8000-000000000001';
--   e uuid;
--   i integer;
-- begin
--   insert into auth.users (id, email, email_confirmed_at) values (v_host, 'wait-check-host@check.invalid', now());
--   update public.profiles set tier = 'pro', display_name = 'Wait Check' where id = v_host;
--   -- E1 holds for approval: three held rows and one shown; E2 the same, two held; E3 develops tomorrow with one held
--   -- straggler written unsealed; E4 holds BOTH (made before the CHECK exists), two held rows unsealed.
--   foreach e in array array['a9a0d000-0000-4000-8000-0000000000e1', 'a9a0d000-0000-4000-8000-0000000000e2',
--                            'a9a0d000-0000-4000-8000-0000000000e3', 'a9a0d000-0000-4000-8000-0000000000e4']::uuid[] loop
--     insert into public.events (id, host_id, name, visibility, require_verified_email, accepting_uploads, moderation_mode)
--     values (e, v_host, 'Wait check ' || right(e::text, 2), 'open', false, true, 'hold_for_approval');
--     insert into public.guests (id, event_id, session_token, display_name)
--     values (('a9a0d000-0000-4000-8000-00000000' || right(e::text, 2) || 'a1')::uuid, e, repeat(right(e::text, 2), 32), 'Check Guest');
--   end loop;
--   update public.events set moderation_mode = 'live', develops_at = now() + interval '1 day'
--    where id = 'a9a0d000-0000-4000-8000-0000000000e3';
--   -- E4 holds both: the foundation allowed it, and this file brings it to one answer.
--   update public.events set develops_at = now() + interval '1 day' where id = 'a9a0d000-0000-4000-8000-0000000000e4';
--   for i in 1..3 loop
--     insert into public.media (event_id, guest_id, type, original_key, file_size_bytes, status)
--     values ('a9a0d000-0000-4000-8000-0000000000e1', 'a9a0d000-0000-4000-8000-00000000e1a1', 'photo', 'check/e1/' || i, 1000, 'pending');
--   end loop;
--   insert into public.media (event_id, guest_id, type, original_key, file_size_bytes, status)
--   values ('a9a0d000-0000-4000-8000-0000000000e1', 'a9a0d000-0000-4000-8000-00000000e1a1', 'photo', 'check/e1/shown', 1000, 'approved');
--   for i in 1..2 loop
--     insert into public.media (event_id, guest_id, type, original_key, file_size_bytes, status)
--     values ('a9a0d000-0000-4000-8000-0000000000e2', 'a9a0d000-0000-4000-8000-00000000e2a1', 'photo', 'check/e2/' || i, 1000, 'pending');
--     insert into public.media (event_id, guest_id, type, original_key, file_size_bytes, status)
--     values ('a9a0d000-0000-4000-8000-0000000000e4', 'a9a0d000-0000-4000-8000-00000000e4a1', 'photo', 'check/e4/' || i, 1000, 'pending');
--   end loop;
--   -- The straggler: a held row on a develop album the save never sealed (as the owner, past the rewrite).
--   insert into public.media (event_id, guest_id, type, original_key, file_size_bytes, status, sealed_until)
--   values ('a9a0d000-0000-4000-8000-0000000000e3', 'a9a0d000-0000-4000-8000-00000000e3a1', 'photo', 'check/e3/straggler', 1000, 'pending', null);
-- end $$;
--
-- -- (GREEN only: this file's statements, verbatim, here.)
--
-- -- PROOF
-- do $$
-- declare
--   v_count bigint;
--   v_rows integer;
-- begin
--   -- 1. The CHECK refuses a develop time on an album holding for approval.
--   begin
--     update public.events set develops_at = now() + interval '2 days' where id = 'a9a0d000-0000-4000-8000-0000000000e1';
--     insert into proof (step, ok, detail) values ('1 the CHECK refuses approval with a develop', false, 'stored');
--   exception when check_violation then
--     insert into proof (step, ok, detail)
--     values ('1 the CHECK refuses approval with a develop', sqlerrm like '%events_approval_never_develops%', sqlerrm);
--   end;
--   -- 2. ★ Switching E1 from approve-each to a develop time, in one save: its held rows join the roll in that save.
--   begin
--     v_count := (public.album_changes_since('a9a0d000-0000-4000-8000-0000000000e1', 'album', 0) -> 'waiting' ->> 'count')::bigint;
--     update public.events set moderation_mode = 'live', develops_at = now() + interval '1 day'
--      where id = 'a9a0d000-0000-4000-8000-0000000000e1';
--     select count(*) into v_rows from public.media m join public.events e on e.id = m.event_id
--      where m.event_id = e.id and e.id = 'a9a0d000-0000-4000-8000-0000000000e1' and m.original_key like 'check/e1/_'
--        and m.status = 'approved' and m.sealed_until = e.develops_at and m.let_in_at is not null;
--     if v_rows <> 3 then raise exception 'joined the roll: %', v_rows; end if;
--     if exists (select 1 from public.media where original_key = 'check/e1/shown' and sealed_until is not null) then
--       raise exception 'a shown row was sealed';
--     end if;
--     if (public.album_changes_since('a9a0d000-0000-4000-8000-0000000000e1', 'album', 0) -> 'waiting' ->> 'count')::bigint <> v_count then
--       raise exception 'the guests'' waiting count moved: % to %', v_count,
--         public.album_changes_since('a9a0d000-0000-4000-8000-0000000000e1', 'album', 0) -> 'waiting' ->> 'count';
--     end if;
--     insert into proof (step, ok, detail) values ('2 into a develop, the held join the roll (approved, sealed, counted as before)', true, format('%s waiting', v_count));
--   exception when others then insert into proof (step, ok, detail) values ('2 into a develop, the held join the roll (approved, sealed, counted as before)', false, sqlerrm);
--   end;
--   -- 3. Leaving E2's approval for right away shows its held rows at once, in that save.
--   begin
--     update public.events set moderation_mode = 'live' where id = 'a9a0d000-0000-4000-8000-0000000000e2';
--     select count(*) into v_rows from public.media
--      where event_id = 'a9a0d000-0000-4000-8000-0000000000e2' and status = 'approved' and sealed_until is null;
--     if v_rows <> 2 then raise exception 'shown: %', v_rows; end if;
--     if (public.album_changes_since('a9a0d000-0000-4000-8000-0000000000e2', 'album', 0) ->> 'approved')::bigint <> 2 then
--       raise exception 'the guests'' album did not count them';
--     end if;
--     insert into proof (step, ok, detail) values ('3 to right away, the held show in the save', true, null);
--   exception when others then insert into proof (step, ok, detail) values ('3 to right away, the held show in the save', false, sqlerrm);
--   end;
--   -- 4. ★ An approval under a develop time ahead seals (the app's approveAllPending on E3's straggler).
--   begin
--     update public.media set status = 'approved' where original_key = 'check/e3/straggler';
--     if not exists (select 1 from public.media m join public.events e on e.id = m.event_id
--                     where m.original_key = 'check/e3/straggler' and m.sealed_until = e.develops_at) then
--       raise exception 'the straggler shows before the develop';
--     end if;
--     insert into proof (step, ok, detail) values ('4 an approval under a develop seals', true, null);
--   exception when others then insert into proof (step, ok, detail) values ('4 an approval under a develop seals', false, sqlerrm);
--   end;
--   -- 5. E4, which held both, is one answer: the develop stands, its held rows joined the roll.
--   begin
--     if not exists (select 1 from public.events where id = 'a9a0d000-0000-4000-8000-0000000000e4'
--                     and moderation_mode = 'live' and develops_at > now()) then
--       raise exception 'still both';
--     end if;
--     select count(*) into v_rows from public.media m join public.events e on e.id = m.event_id
--      where e.id = 'a9a0d000-0000-4000-8000-0000000000e4' and m.status = 'approved' and m.sealed_until = e.develops_at;
--     if v_rows <> 2 then raise exception 'joined: %', v_rows; end if;
--     insert into proof (step, ok, detail) values ('5 a row holding both, brought to one answer', true, null);
--   exception when others then insert into proof (step, ok, detail) values ('5 a row holding both, brought to one answer', false, sqlerrm);
--   end;
--   -- 6. A hold album taking approval again, its develop time cleared in the same save, is allowed.
--   begin
--     update public.events set moderation_mode = 'hold_for_approval', develops_at = null
--      where id = 'a9a0d000-0000-4000-8000-0000000000e3';
--     insert into proof (step, ok, detail) values ('6 approval with no develop time is allowed', true, null);
--   exception when others then insert into proof (step, ok, detail) values ('6 approval with no develop time is allowed', false, sqlerrm);
--   end;
--   -- 7. Who may run what.
--   begin
--     if has_function_privilege('authenticated', 'public.events_hold_released()', 'execute')
--        or has_function_privilege('anon', 'public.events_hold_released()', 'execute')
--        or has_function_privilege('authenticated', 'public.media_seal_on_approval()', 'execute')
--        or has_function_privilege('anon', 'public.media_seal_on_approval()', 'execute') then
--       raise exception 'a client role may execute a trigger function';
--     end if;
--     insert into proof (step, ok, detail) values ('7 the trigger functions are no client''s', true, null);
--   exception when others then insert into proof (step, ok, detail) values ('7 the trigger functions are no client''s', false, sqlerrm);
--   end;
-- end $$;
-- select n, step, ok, detail from proof order by n;
-- =============================================================================================
