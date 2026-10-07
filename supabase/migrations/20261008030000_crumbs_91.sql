-- =============================================================================================
-- THE RESTORES TAKE THEIR ROWS WITHOUT WAITING, AND HER OWN WORD ON "AN EMAIL FIRST" ENDS A GATE'S MEMORY (lane
-- `crumbs-91`; two of ROADMAP's Immediate lines: storage-sums-signal's Q2, and red-team 57c's LOW).
--
-- ★ A WRITER THAT HOLDS HER PROFILES ROW NEVER WAITS ON A MEDIA ROW (database-security.md, the lock order). Every
-- capacity decision takes the host's profiles row first, and every media write takes it after the media rows it wrote:
-- the sums' statement trigger (`media_storage_sums`, 20261006180000), the meter (`media_release_meter`, 20260929140000)
-- and the purge's own update (`purge_media_rows`). So a body that holds her row and then waits on a media row
-- closes a cycle with any writer holding that row on its way to hers: one side's 40P01 after a second.
-- storage-sums-signal closed the guest's withdrawal's cycle that way (20261007022000: her row, then the media row
-- NOWAIT) and named the restores' as the ones that stood.
--   1. restore_media took her row, then the item in its UPDATE, against a guest's Not mine re-marking a row she binned
--      (`disown_guest_rows_by_email`), her own Delete permanently (`purge_media_now`) and an operator's takedown
--      (`removed_by_admin`, fresh or adopting a row of her Deleted), each media then her row. Now it takes the item
--      right after her row, NOWAIT, in the write's own mode (FOR NO KEY UPDATE), and only on her own events (the lock
--      joins the caller's events, so no call can hold another host's row): a row another writer holds this instant
--      answers 55P03 (lock_not_available) with nothing written, which `restoreMedia` (src/lib/db/mutations/media.ts)
--      words "Couldn't restore that item. Please try again." as it words every RPC error. Its holder is taking the row
--      out of her Deleted for good or holding it a moment, so her second press reads not_found, the true refusal, or
--      lands.
--      ★ AND EVERY CHECK READS THE ROW UNDER THAT LOCK. The old body read the item unlocked and wrote it after, so a
--      holder that committed between went unseen: an operator's hold placed on a row of her Deleted while she pressed
--      Restore was put back in her album with the hold on it (the pre-flight's race below), past ADR-0020's "stays off
--      live". The price, said plainly: a press that meets its row held answers busy whatever it would have answered once
--      the holder let go (one on a row already back in her album, met mid-write, reads busy once, then not_removed).
--   2. let_back_in, restoring (p_restore), took her row, then the block's rows FOR UPDATE, against the same partners
--      but Not mine, which never touches a row a block holds (`event_block_holds_row`). Now it takes only the rows it can
--      at once (SKIP LOCKED, as `leave_deleted` takes her Deleted): a row held this instant stays as its holder leaves
--      it (gone for good, the operator's, or still in her Deleted for her own Restore) and is left out of `restored`;
--      the block lifts all the same and the answer keeps its keys. Its callers read `restored` as what came back
--      (`letBackIn` in src/lib/db/mutations/event-blocks.ts, `letBackInAction` in the guests room's actions.ts, the
--      Blocked list's toast "2 uploads are back where they were."), so their words stay true; a skipped row shows in
--      her Deleted, never as lost.
--
-- ★ HER OWN WORD ON THE STEP ENDS A GATE'S MEMORY (red-team 57c). An address gate that turns "An email first" on from
-- off remembers she had names only (`events.email_held`, 20261007140000), and the gate's leaving gives them back. The
-- trigger heard only a write of `gate`, so her own write of the step under a standing hold (a Settings page loaded
-- before the hold, its switch still off and unlocked: she turns it on) left the memory set, and the gate's leaving
-- turned her own choice off again.
--   3. The trigger now hears the step too (BEFORE UPDATE OF gate, require_verified_email), and a client role's write
--      (her own session through PostgREST: `updateEvent`'s patch, which names the step only when her switch writes it)
--      clears the memory and changes nothing else, so her word stands whatever a gate holds. Such a write never moves a
--      gate (no client role is granted `gate`), and while an address gate stands it can only turn the step on
--      (`events_gate_needs_email` refuses it off, the clearing with it). A definer body's write is no word of hers on
--      the memory: set_event_door (the gate and the step together) and set_event_password (the gate) meet today's
--      rule, and block_from_event (the step on from off, where no hold can stand) meets it with nothing to do.
--
-- WHAT DOES NOT CHANGE: the three bodies are their newest files' verbatim but for the named lines (restore_media
-- 20261003220000's; let_back_in 20261007020000's, let_in's three arguments, never 20261003220000's two;
-- events_email_held 20261007140000's); their signatures, returns, security modes, search paths, answers and grants
-- (create or replace, the grants restated as those files leave them); the trigger's name, timing and level (one CREATE
-- OR REPLACE TRIGGER); every other function. The comments of let_back_in, events_email_held and events.email_held say
-- the new line each; restore_media carries none, as before.
--
-- ★ AN EXPAND IN BEHAVIOUR ONLY (milestone 39's build on partyreel.com and the alias share this database): no
-- signature, argument name or answer key moves, so every call they make resolves as today. What they meet meanwhile:
-- in a restore's race, a busy error at once where there was a deadlock after a second, which their `restoreMedia`
-- already words as a retry; a lift that meets a held row restores the rest at once and counts them, in words they
-- already say; and her own write of the step from either build's Settings is her word, so a gate's leaving keeps it:
-- `set_event_door` answers `email_restored` false and their page keeps the switch on, as it shows. No order with this
-- lane's build: it calls nothing new.
--
-- LOCKS AT APPLY: catalog writes for three functions and three comments; CREATE OR REPLACE TRIGGER takes SHARE ROW
-- EXCLUSIVE on events for an instant. No row is touched.
--
-- PRE-FLIGHT on a throwaway Postgres 17 stand-in (2026-10-07; the touched tables' columns, defaults, constraints, RLS
-- and client grants read off the live catalog; the lock-taking and row-shaping triggers of events, media and profiles
-- as live; the CURRENT bodies of the three replaced functions, of every partner (disown_guest_rows_by_email,
-- purge_media_now, purge_media_rows, kept_media_ids, media_storage_sums, media_release_meter, remove_my_upload,
-- set_event_door, set_event_password, block_from_event) and of their 31 helpers, each from its newest repo file and
-- each md5(prosrc) equal to live's, every ACL as live): this file applied verbatim in one transaction;
-- pg_get_functiondef of the three before and after differs by exactly the NOWAIT statement, `skip locked` and the
-- client arm (each with its comment), and the trigger by its second column. The contract held alike on both sides
-- (restore_media's every answer: ok to the status it held, not_found six ways, not_removed, legal_hold, admin_removed,
-- event_deleted, insufficient_space, anon 42501; let_back_in's lift, refusals and keys; the door's hold, every way
-- out, gate to gate, the first password, her own step on and a block's) but for red-team 57c's own case, which failed
-- BEFORE (her write left the memory set; Public turned the step off) and held AFTER.
--   Each race forced (the partner takes its first lock, a media row, and holds it 1.5 s; her side comes 0.5 s in):
--                                            BEFORE                            AFTER
--     her Restore x a guest's Not mine       40P01 (hers, after 1.0 s)         55P03 at once (4 ms); Not mine lands
--     her Restore x her Delete permanently   40P01 (hers)                      55P03 at once (6 ms); the purge lands
--     her Restore x an operator's takedown   40P01 (hers)                      55P03 at once (8 ms); the takedown lands
--     her Restore x an operator's hold       no error: after 1.0 s her         55P03 at once (5 ms); the row stays in
--                                            Restore put the held row back     her Deleted, held
--     Let back in, restoring x her Delete    40P01 (hers)                      lands at once (13 ms): restored 1, the
--       permanently of one of its two rows                                     other purged, the block lifted
--     Let back in, restoring x a takedown    40P01 (hers)                      lands at once (9 ms): restored 1, the
--       of one of its two rows                                                 other the operator's, the block lifted
--   Each pair stressed (8 clients, 4 of hers and 4 of the partner's, 30 bursts of 50 fresh items, each act its own
--   transaction; counted from the clients' own errors and, for the hold, an audit of every restore written over one):
--                                                         BEFORE                  AFTER
--     her Restore x Not mine                deadlocks     37                      0    (busy 119)
--     her Restore x Delete permanently      deadlocks     8                       0    (busy 17)
--     her Restore x a takedown              deadlocks     19                      0    (busy 267)
--     her Restore x a hold                  over a hold   30 restores             0    (busy 263)
--     Let back in x Delete permanently      deadlocks     12                      0
--     Let back in x a takedown              deadlocks     34                      0
--     her Restore and Let back in x the guest's withdrawal (20261007022000's close, kept): 0 and 0 BEFORE and AFTER
--   storage_sums_drift empty after every race and every run. Busy is a press that met its row held at that instant,
--   nothing written (the stress presses every item from all eight clients at once).
--
-- ADVISORS (security): EXPECTED DELTA: none (27 rls_enabled_no_policy, 4 in 0028, 36 in 0029, as before): restore_media
-- and let_back_in stay in 0029 as the same authenticated SECURITY DEFINER host acts, their paths pinned; the trigger's
-- function stays SECURITY INVOKER with no client EXECUTE (in neither list); no table, policy or grant moves.
--
-- APPLY PROTOCOL (database-security.md, Workflow):
--   (1) Drift, read-only: each md5(prosrc) equals its newest repo body (read live 2026-10-07): restore_media(uuid)
--       f4ad56caa8b4a4176e55c28bcd434c93, let_back_in(uuid,boolean,boolean) 7383a75e041e739347d9f61e36ad122c,
--       events_email_held() e8946631499647c941bc6a84acb04755 (collapsed, md5(btrim(regexp_replace(prosrc, '\s+', ' ',
--       'g'))): 795145cf8441deffd29adf2eac436b01, 38aeb65571fb24b72298b782e24e1028, 4c66ca5ca663871117d5cd71f03c6ea9);
--       and the trigger reads BEFORE UPDATE OF gate:
--         select p.oid::regprocedure, md5(p.prosrc), p.prosecdef, p.proacl from pg_proc p
--          where p.oid in ('public.restore_media(uuid)'::regprocedure, 'public.let_back_in(uuid,boolean,boolean)'::regprocedure,
--                          'public.events_email_held()'::regprocedure);
--         select pg_get_triggerdef(oid) from pg_trigger where tgrelid = 'public.events'::regclass and tgname = 'events_email_held';
--   (2) The rolled-back proof at the foot, in one execute_sql call: RED without this file's statements, GREEN with.
--   (3) Apply verbatim. The queries in (1) then read restore_media 2479f7e5572ff6aafeb5e71cf7a597c8, let_back_in
--       7c1609355cb07e2daf5aa8ce5d6e8d78 and events_email_held 653b60705e04bfc775875cb996fa6acb, each ACL and mode as
--       before, and the trigger BEFORE UPDATE OF gate, require_verified_email (the proof's last rows).
--   (4) get_advisors (security): the delta above.  (5) No type moves: nothing to regenerate.
-- =============================================================================================

-- =============================================================================================
-- 1. restore_media: her row first, then the item at once or not at all.
-- =============================================================================================
-- 20261003220000's body verbatim but for one statement: the item's lock, under her row and before every read that
-- decides. Its signature, return, answers, security mode and grants are today's (create or replace; grants restated).
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
  v_kept bigint;
  v_target public.media_status;
begin
  -- QA #17, and the eviction (20261003220000): the host's profiles row FIRST, as every capacity decision takes it, so a
  -- restore never meets an upload making room from Deleted (leave_deleted, under the same lock) on one row, and two
  -- restores never read one figure. Her own row: the read below proves the item is hers.
  select * into v_profile from public.profiles where id = (select auth.uid()) for update;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  -- ★ THEN THE ITEM AT ONCE OR NOT AT ALL (20261008030000). Holding her row, a restore never waits on a media row: the
  -- writers that take one before her row (a guest's Not mine re-marking a row she binned, her own Delete permanently, an
  -- operator's takedown: each through the sums' trigger, the meter or the purge's own update) would close a cycle with
  -- it, one side's 40P01 after a second. So the item is taken NOWAIT, in the write's own mode, and only a row of her own
  -- events (no caller can lock another's): a row another writer holds this instant answers 55P03 with nothing written,
  -- which the app words as a retry. Held here, the row is read below as it stands, so no check is an older snapshot's.
  perform 1 from public.media x
    join public.events e on e.id = x.event_id
   where x.id = p_media_id and e.host_id = (select auth.uid())
     for no key update of x nowait;

  select m.* into v_media from public.media m
    join public.events e on e.id = m.event_id
    where m.id = p_media_id and e.host_id = (select auth.uid())
      and m.removed_by_uploader = false   -- a guest's self-deletion is private to the host
      and m.purge_asked_at is null;       -- her own Delete permanently: gone, even while it is kept
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
  -- ★ PAST ITS 30 DAYS IT IS LEAVING (20261003220000): out of her Deleted and out of what she is counted for, so no longer
  -- hers to bring back, even before the night's purge takes it.
  if v_media.removed_at is null or v_media.removed_at < now() - interval '30 days' then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;
  if v_media.legal_hold_at is not null then
    return jsonb_build_object('ok', false, 'reason', 'legal_hold'); -- ADR-0020: stays off live
  end if;
  if v_media.removed_by_admin then
    return jsonb_build_object('ok', false, 'reason', 'admin_removed'); -- QA #8: operators only
  end if;

  -- ★ RESTORE ALWAYS FITS (20261003220000): her own removal already counts in what she stores, so bringing it back moves
  -- nothing her cap holds. The over-capacity reduce's removals alone keep a gate: what she keeps by choice (everything
  -- stored but those) plus this item, against the BASE cap, so an over-cap account cannot restore its way back over and
  -- wait out a fresh grace.
  if v_media.removed_by_system then
    v_cap := coalesce(v_profile.storage_cap_bytes,
                      (select default_storage_cap_bytes from public.tier_limits(v_profile.tier)));
    if v_cap is not null then
      select s.active_bytes + s.standby_bytes - s.system_bytes into v_kept
        from public.host_storage_summary(v_event.host_id) s;
      if v_kept + v_media.file_size_bytes > v_cap then
        return jsonb_build_object('ok', false, 'reason', 'insufficient_space',
          'needed_bytes', (v_kept + v_media.file_size_bytes) - v_cap);
      end if;
    end if;
  end if;

  -- QA #24: back to where it was, not a blanket 'approved' (a hidden item stays hidden, a pending
  -- item stays pending). Pre-Q3 rows carry no stamp -> 'approved', the historical behavior.
  v_target := coalesce(v_media.status_before_removed, 'approved'::public.media_status);
  if v_target = 'removed' then
    v_target := 'approved'::public.media_status;
  end if;

  -- Pure status flip; trigger nulls purge_at; storage_used_bytes unchanged (bytes never left). Back in her album the
  -- row is hers again, so the reduce's flag goes with the removal (20261003220000): left on, a later removal of hers
  -- would read as the system's (its restore gate, what she keeps, the deadline's order, the reduce mail).
  update public.media set status = v_target, removed_at = null, removed_by_system = false
    where id = p_media_id and status = 'removed';

  return jsonb_build_object('ok', true, 'status', v_target);
end;
$$;

revoke execute on function public.restore_media(uuid) from public, anon, authenticated;
grant execute on function public.restore_media(uuid) to authenticated;

-- =============================================================================================
-- 2. let_back_in: the block's rows it can take at once, and no other.
-- =============================================================================================
-- let_in's three-argument body (20261007020000) verbatim but for `skip locked` on the restore's rows and the comment
-- above it; never 20261003220000's two-argument body, which would drop `p_let_in`. Its signature, defaults, answer,
-- security mode and grants are today's (create or replace; grants restated), and its comment says the skip.
create or replace function public.let_back_in(
  p_block_id uuid,
  p_restore boolean default false,
  p_let_in boolean default false
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_block public.event_blocks;
  v_event public.events;
  v_profile public.profiles;
  v_media public.media;
  v_target public.media_status;
  v_restored integer := 0;
  v_admitted integer;
  v_opened integer := 0;
  v_let_in integer := 0;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'reason', 'unauthorized');
  end if;

  select b.* into v_block
    from public.event_blocks b
    join public.events e on e.id = b.event_id
   where b.id = p_block_id and e.host_id = v_uid and e.deleted_at is null;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  if coalesce(p_restore, false) and cardinality(v_block.removed_media_ids) > 0 then
    select * into v_event from public.events where id = v_block.event_id;
    -- The host's profiles row first, as every capacity decision takes it (an upload making room from Deleted holds it
    -- while it takes these rows, so the two never act on one row at once).
    select * into v_profile from public.profiles where id = v_event.host_id for update;
    -- ★ RESTORE ALWAYS FITS (20261003220000): what the block put in Deleted already counts in what she stores, so each
    -- comes back with no gate (`no_room` stays in the answer, always 0, for its callers). Never one that has left for
    -- good (asked: its CHECK would refuse the write) nor one past its 30 days (leaving: out of her count).
    -- ★ AND ONLY THE ROWS IT CAN TAKE AT ONCE (SKIP LOCKED, 20261008030000), as leave_deleted takes her Deleted: holding
    -- her row, a lift never waits on a media row, whose holder (her Delete permanently, an operator's takedown) is on
    -- its way to her row. A row held this instant stays as its holder leaves it, gone for good or still in her Deleted
    -- for her own Restore, and `restored` counts what came back; the block lifts all the same.
    for v_media in
      select m.*
        from public.media m
       where m.id = any (v_block.removed_media_ids)
         and m.event_id = v_block.event_id
         and m.status = 'removed'
         and m.removed_at = v_block.created_at
         and m.removed_at >= now() - interval '30 days'
         and not m.removed_by_uploader
         and not m.removed_by_admin
         and m.purge_asked_at is null
         and m.legal_hold_at is null
       order by m.created_at desc, m.id desc
       for update skip locked
    loop
      v_target := coalesce(v_media.status_before_removed, 'approved'::public.media_status);
      if v_target = 'removed' then
        v_target := 'approved'::public.media_status;
      end if;
      -- Back in her album, the row is hers again: no reduce's flag outlives the removal (as restore_media).
      update public.media set status = v_target, removed_at = null, removed_by_system = false
       where id = v_media.id and status = 'removed';
      v_restored := v_restored + 1;
    end loop;
  end if;

  delete from public.event_blocks where id = v_block.id;

  -- ★ BACK AT A PUBLIC DOOR (20260930130000): the door let in every ask no block held the moment it turned
  -- Public, and this one waited only on the block. With it gone the Public door lets her in, as it would have
  -- had the block never been there (anywhere else her ask stands, and the host answers it from the door).
  if exists (select 1 from public.events e where e.id = v_block.event_id and e.visibility = 'open') then
    with opened as (
      update public.guests g
         set admission = 'in'
        from public.event_door_asks(v_block.event_id) a
       where g.id = a.guest_id
      returning coalesce(g.user_id::text, g.id::text) as person
    )
    select count(distinct o.person)::integer into v_opened from opened o;
  end if;

  -- ★ BACK AT A LIST THAT NAMES THEM (20260929220000): with the block gone, a waiting newcomer the
  -- invite list names is let in by it, as she would have been the moment it named her.
  v_admitted := public.event_door_admit_listed(v_block.event_id);

  -- ★ HER ANSWER, IN THE SAME PRESS (20261007020000, host-moments r1 `let-back=straight`): with p_let_in, the ask this
  -- block held is answered yes, as let_in_at_door answers one: every waiting row of the person (she may have asked from
  -- two devices), here each one this block named that no block still holds, read through the door's asks. After the
  -- door's own two arms, so an ask Public or the list already let in is theirs and counts under `admitted`.
  if coalesce(p_let_in, false) then
    with let_in as (
      update public.guests g
         set admission = 'in'
        from public.event_door_asks(v_block.event_id) a
       where g.id = a.guest_id
         and public.event_block_names_row(v_block.user_id, v_block.email, v_block.guest_id, g)
      returning coalesce(g.user_id::text, g.id::text) as person
    )
    select count(distinct l.person)::integer into v_let_in from let_in l;
  end if;

  return jsonb_build_object('ok', true, 'event_id', v_block.event_id, 'restored', v_restored,
    'no_room', 0, 'admitted', v_admitted + v_opened, 'let_in', v_let_in);
end;
$$;

-- Authenticated only, as before (lint 0029, never 0028): the host's own act, authorized inside on auth.uid() and the
-- event's ownership. PUBLIC's EXECUTE is revoked by name before the one grant, as every grant block does.
revoke all on function public.let_back_in(uuid, boolean, boolean) from public, anon, authenticated;
grant execute on function public.let_back_in(uuid, boolean, boolean) to authenticated;

comment on function public.let_back_in(uuid, boolean, boolean) is
  'The host lifts a block (event-safety r1): the caller must host its live event (else not_found). With p_restore, the uploads the block itself removed and still in Deleted come back to their prior status (restore always fits: they already count), each one another writer is not holding at that instant (SKIP LOCKED; restored counts what came back). The door as it stands then lets in the ask the block held: at a Public door, and at the invite list while it is the door and names her (admitted counts either). With p_let_in (host-moments r1, Let in), the host answers that ask yes in the same press: every waiting row the block named that no block still holds goes in, wherever the door stands (let_in counts the people); without it her ask stands at the door.';

-- =============================================================================================
-- 3. events_email_held: her own word on the step ends the memory, and the trigger hears the step.
-- =============================================================================================
-- 20261007140000's body verbatim but for the client arm at its head; the trigger the same but for its second column.
create or replace function public.events_email_held()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- ★ HER OWN WORD ON THE STEP ENDS THE MEMORY (20261008030000, red-team 57c). A write by her own session (a client
  -- role: Settings' switch under her column grant, which names the step and never the gate, no client role holding it)
  -- is her choice of the step whatever a gate holds, so nothing is left for a gate's leaving to give back. A definer
  -- body's write (a door's move beside the gate, a block turning the step on from off) is no word of hers on the
  -- memory, and meets the rule below.
  if current_user in ('authenticated', 'anon') then
    new.email_held := false;
    return new;
  end if;
  if new.gate in ('approve', 'invite') then
    -- An address gate holds the step: a gate that turned it on from off remembers her names-only door. One that found
    -- it on (her own step, or the other address gate's hold) changes nothing, so a move from one gate to the other keeps
    -- the first hold's memory.
    if not old.require_verified_email and new.require_verified_email then
      new.email_held := true;
    end if;
  else
    -- The gate that held it has gone (Public, Only me, only people already in, a password): what it turned on comes
    -- back off, and the memory goes with it.
    if old.email_held then
      new.require_verified_email := false;
    end if;
    new.email_held := false;
  end if;
  return new;
end;
$$;

-- A trigger's function: no client role runs it, and it still fires.
revoke all on function public.events_email_held() from public, anon, authenticated;

comment on function public.events_email_held() is
  'BEFORE UPDATE OF gate, require_verified_email on events. Her own write of the step (a client role''s: her Settings) clears email_held, so a gate''s leaving never undoes her word. On every other write (set_event_door, set_event_password, block_from_event): an address gate (approve, invite) that turns An email first on from off sets email_held; any other gate (none, closed) turns the step back off where email_held was set, and clears it. SECURITY INVOKER (it writes only NEW); no client role runs it.';

comment on column public.events.email_held is
  'An email first (require_verified_email) is on only because a gate that matches an address (approve, invite) turned it on from off: she had names only before it. Written only by the events_email_held trigger, which sets it as such a gate turns the step on and gives her names only back (require_verified_email false) as the gate goes, on every path that moves a gate, and clears it when she writes the step herself. No client role writes it.';

create or replace trigger events_email_held
  before update of gate, require_verified_email on public.events
  for each row execute function public.events_email_held();

-- =============================================================================================
-- THE ROLLED-BACK PROOF. Proved on the live schema BEFORE applying (database-security.md, "An unapplied migration is
-- proved on the live schema"): ONE execute_sql call of `begin;`, this file's statements verbatim, the block below (its
-- two temp tables, its three helpers, the DO blocks and the final read) and `rollback;`. RED is the same call without
-- this file's statements, on today's schema. Each block traps its own failure into the proof table, so the rollback
-- always runs and the call answers the rows. It rides an EXISTING album (creating one trips enforce_event_limit),
-- willg97's "Door flow gate probe (disposable)", made Public with names only inside the transaction; puts three of its
-- host's own uploads in her Deleted (one hidden before, one under a hold); and makes two accounts of its own: G, a guest
-- with two uploads there, and O, another host. One session cannot race two (the pre-flight does), so the lock's place
-- is read off the live body and its reach off the rows' xmax: the held row her press refuses is locked by that press,
-- and another host's press locks nothing of hers.
--
-- Held on 2026-10-07 against the live schema (event 315dba57-bba6-4a91-b0fc-29f44f97c4b6, host
-- 6cb5fdb5-ac8a-4c82-83ce-59b5a2cfcd0b). RED, the block alone on today's bodies:
--   0 setup                                | t | event 315dba57-bba6-4a91-b0fc-29f44f97c4b6, host 6cb5fdb5-ac8a-4c82-83ce-59b5a2cfcd0b: Public with names only; her three uploads in Deleted (one held), G's two live; at parity yes
--   1 restore_media answers                | t | another host: not_found; hers: approved; one hidden before: hidden; at parity
--   2 the item under her row, at once      | f | held: {"ok": false, "reason": "legal_hold"}, xmax 62511 -> 62511; another host on G's: {"ok": false, "reason": "not_found"}, xmax 0 -> 0; her row 493, the item 0, the read 646, the write 3579
--   3 let_back_in restores                 | t | the block took 2; the two-name lift restored 2, let_in 0, keys {admitted,event_id,let_in,no_room,ok,restored}; the block gone; at parity
--   4 the lift skips a held row            | f | her row 986, the block's rows skip locked 0
--   5 her own word under a hold            | f | her write left email_held true; Public gave back {"ok": true, "door": "open", "admitted": 0, "email_held": false, "email_restored": true}; the step is off: her word undone;
--   6 the rule and the refusals            | t | names only then approve: held; her write of the step off: 23514; her name saved, another host's write (0 rows) and anon's (42501) left the memory; Public gave names only back
--   7 grants and the trigger               | f | CREATE TRIGGER events_email_held BEFORE UPDATE OF gate ON public.events FOR EACH ROW EXECUTE FUNCTION events_email_held()
--   hash restore_media(uuid)               | t | f4ad56caa8b4a4176e55c28bcd434c93  {postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}
--   hash let_back_in(uuid,boolean,boolean) | t | 7383a75e041e739347d9f61e36ad122c  {postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}
--   hash events_email_held()               | t | e8946631499647c941bc6a84acb04755  {postgres=X/postgres,service_role=X/postgres}
-- GREEN, with this file's statements (afterwards, and after RED too: every live body, ACL and comment and the trigger
-- read as before, the album its own door and step as before (Public, no gate, the step on, no memory), no c91-* account,
-- no media, guest, block or sums row in it, and its host's sums the same figures: nothing persisted):
--   0 setup                                | t | event 315dba57-bba6-4a91-b0fc-29f44f97c4b6, host 6cb5fdb5-ac8a-4c82-83ce-59b5a2cfcd0b: Public with names only; her three uploads in Deleted (one held), G's two live; at parity yes
--   1 restore_media answers                | t | another host: not_found; hers: approved; one hidden before: hidden; at parity
--   2 the item under her row, at once      | t | held: {"ok": false, "reason": "legal_hold"}, xmax 62560 -> 1741; another host on G's: {"ok": false, "reason": "not_found"}, xmax 0 -> 0; her row 493, the item 1490, the read 1521, the write 4454
--   3 let_back_in restores                 | t | the block took 2; the two-name lift restored 2, let_in 0, keys {admitted,event_id,let_in,no_room,ok,restored}; the block gone; at parity
--   4 the lift skips a held row            | t | her row 986, the block's rows skip locked 2171
--   5 her own word under a hold            | t | approve held it; her own write of the step: email_held false at once; Public: email_restored false, the step stays on
--   6 the rule and the refusals            | t | names only then approve: held; her write of the step off: 23514; her name saved, another host's write (0 rows) and anon's (42501) left the memory; Public gave names only back
--   7 grants and the trigger               | t | CREATE TRIGGER events_email_held BEFORE UPDATE OF gate, require_verified_email ON public.events FOR EACH ROW EXECUTE FUNCTION events_email_held()
--   hash restore_media(uuid)               | t | 2479f7e5572ff6aafeb5e71cf7a597c8  {postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}
--   hash let_back_in(uuid,boolean,boolean) | t | 7c1609355cb07e2daf5aa8ce5d6e8d78  {postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}
--   hash events_email_held()               | t | 653b60705e04bfc775875cb996fa6acb  {postgres=X/postgres,service_role=X/postgres}
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
-- -- 0. Ride an EXISTING album (creating one trips enforce_event_limit): willg97's "Door flow gate probe (disposable)",
-- -- made Public with names only inside the transaction. Its host's own three uploads, binned (one hidden before, one under
-- -- a hold); two accounts of the proof's own: G, a guest with two uploads in it, and O, another host.
-- do $$
-- declare k text; u uuid; e uuid := '315dba57-bba6-4a91-b0fc-29f44f97c4b6'; h uuid := '6cb5fdb5-ac8a-4c82-83ce-59b5a2cfcd0b';
--   g uuid; v_qr text;
-- begin
--   update public.events set visibility = 'open', gate = null, require_verified_email = false, event_password_hash = null
--    where id = e and host_id = h and deleted_at is null
--   returning qr_token into v_qr;
--   if v_qr is null then raise exception 'SETUP: no live event of the host''s'; end if;
--   insert into fx values ('event', e), ('host', h);
--   foreach k in array array['guest', 'other'] loop
--     u := gen_random_uuid();
--     execute 'insert into auth.users (id, email, email_confirmed_at) values ($1, $2, now())'
--       using u, 'c91-' || k || '-' || u || '@example.test';
--     insert into public.profiles (id, email, display_name) values (u, 'c91-' || k || '-' || u || '@example.test', 'C91 ' || k)
--       on conflict (id) do update set display_name = excluded.display_name;
--     insert into fx values (k, u);
--   end loop;
--   foreach k in array array['ok', 'hid', 'held'] loop
--     u := gen_random_uuid();
--     insert into public.media (id, event_id, guest_id, type, original_key, file_size_bytes, status)
--     values (u, e, null, 'photo', 'events/' || e || '/photo/' || u || '/original.jpg', 1000, 'approved');
--     if k = 'hid' then update public.media set status = 'hidden' where id = u; end if;
--     update public.media set status = 'removed', removed_at = now() where id = u;
--     if k = 'held' then update public.media set legal_hold_at = now(), legal_hold_reason = 'crumbs-91 proof' where id = u; end if;
--     insert into fx values (k, u);
--   end loop;
--   insert into public.guests (event_id, user_id, session_token, display_name, verified_at, email)
--   values (e, pg_temp.fx('guest'), 'c91-' || gen_random_uuid(), 'C91 guest', now(),
--           (select u2.email from auth.users u2 where u2.id = pg_temp.fx('guest')))
--   returning id into g;
--   foreach k in array array['g1', 'g2'] loop
--     u := gen_random_uuid();
--     insert into public.media (id, event_id, guest_id, type, original_key, file_size_bytes, status)
--     values (u, e, g, 'photo', 'events/' || e || '/photo/' || u || '/original.jpg', 2000, 'approved');
--     insert into fx values (k, u);
--   end loop;
--   insert into proof (step, ok, detail) values ('0 setup', pg_temp.parity() = '',
--     format('event %s, host %s: Public with names only; her three uploads in Deleted (one held), G''s two live; at parity %s',
--            e, h, coalesce(nullif(pg_temp.parity(), ''), 'yes')));
-- exception when others then
--   insert into proof (step, ok, detail) values ('0 setup', false, sqlerrm);
-- end $$;
--
-- -- 1. restore_media answers as the deployed builds read them: another host's item not_found; hers back to where it was.
-- do $$
-- declare a text; b text; c text; fail text := '';
-- begin
--   a := pg_temp.as_user(pg_temp.fx('other'), format('select public.restore_media(%L)::text', pg_temp.fx('ok')));
--   b := pg_temp.as_user(pg_temp.fx('host'), format('select public.restore_media(%L)::text', pg_temp.fx('ok')));
--   c := pg_temp.as_user(pg_temp.fx('host'), format('select public.restore_media(%L)::text', pg_temp.fx('hid')));
--   if a not like '%"not_found"%' then fail := fail || ' another host: ' || a || ';'; end if;
--   if b <> '{"ok": true, "status": "approved"}' then fail := fail || ' hers: ' || b || ';'; end if;
--   if c <> '{"ok": true, "status": "hidden"}' then fail := fail || ' hidden: ' || c || ';'; end if;
--   if pg_temp.parity() <> '' then fail := fail || ' ' || pg_temp.parity() || ';'; end if;
--   insert into proof (step, ok, detail) values ('1 restore_media answers', fail = '',
--     coalesce(nullif(btrim(fail), ''), 'another host: not_found; hers: approved; one hidden before: hidden; at parity'));
-- exception when others then
--   insert into proof (step, ok, detail) values ('1 restore_media answers', false, sqlerrm);
-- end $$;
--
-- -- 2. ★ Under her row, the item is taken before every read that decides, and only hers: the held row she presses is
-- -- locked by her call though it answers legal_hold (its xmax moves), another host's press locks nothing of hers (its
-- -- xmax stands), and the body's order reads so off the live catalog (one session cannot race two: the pre-flight does).
-- do $$
-- declare x0 text; x1 text; y0 text; y1 text; a text; b text; body text; her_row int; the_item int; the_read int; the_write int;
-- begin
--   select xmax::text into x0 from public.media where id = pg_temp.fx('held');
--   a := pg_temp.as_user(pg_temp.fx('host'), format('select public.restore_media(%L)::text', pg_temp.fx('held')));
--   select xmax::text into x1 from public.media where id = pg_temp.fx('held');
--   select xmax::text into y0 from public.media where id = pg_temp.fx('g1');
--   b := pg_temp.as_user(pg_temp.fx('other'), format('select public.restore_media(%L)::text', pg_temp.fx('g1')));
--   select xmax::text into y1 from public.media where id = pg_temp.fx('g1');
--   body := (select regexp_replace(p.prosrc, '\s+', ' ', 'g') from pg_proc p
--             where p.oid = 'public.restore_media(uuid)'::regprocedure);
--   her_row := position('from public.profiles where id = (select auth.uid()) for update;' in body);
--   the_item := position('for no key update of x nowait;' in body);
--   the_read := position('select m.* into v_media from public.media m' in body);
--   the_write := position('update public.media set status = v_target' in body);
--   insert into proof (step, ok, detail) values ('2 the item under her row, at once',
--     a like '%"legal_hold"%' and x1 is distinct from x0 and b like '%"not_found"%' and y1 is not distinct from y0
--       and her_row > 0 and the_item > her_row and the_read > the_item and the_write > the_read,
--     format('held: %s, xmax %s -> %s; another host on G''s: %s, xmax %s -> %s; her row %s, the item %s, the read %s, the write %s',
--            a, x0, x1, b, y0, y1, her_row, the_item, the_read, the_write));
-- exception when others then
--   insert into proof (step, ok, detail) values ('2 the item under her row, at once', false, sqlerrm);
-- end $$;
--
-- -- 3. let_back_in, restoring, by the deployed build's two names: the block's two back, counted, the block gone.
-- do $$
-- declare got text; b uuid; v jsonb; fail text := '';
-- begin
--   got := pg_temp.as_user(pg_temp.fx('host'), format(
--     'select public.block_from_event(p_event_id => %L, p_user_id => %L)::text', pg_temp.fx('event'), pg_temp.fx('guest')));
--   b := (got::jsonb ->> 'block_id')::uuid;
--   if b is null or (got::jsonb ->> 'removed')::int <> 2 then raise exception 'the block: %', got; end if;
--   got := pg_temp.as_user(pg_temp.fx('host'), format('select public.let_back_in(p_block_id => %L, p_restore => true)::text', b));
--   v := got::jsonb;
--   if (v ->> 'restored')::int <> 2 or (v ->> 'let_in')::int <> 0 or not (v ->> 'ok')::boolean then fail := fail || ' answer ' || got || ';'; end if;
--   if (select string_agg(k, ',' order by k) from jsonb_object_keys(v) k) <> 'admitted,event_id,let_in,no_room,ok,restored' then
--     fail := fail || ' keys ' || got || ';';
--   end if;
--   if exists (select 1 from public.event_blocks where id = b) then fail := fail || ' the block stands;'; end if;
--   if (select count(*) from public.media where id in (pg_temp.fx('g1'), pg_temp.fx('g2')) and status = 'approved') <> 2 then
--     fail := fail || ' not back;';
--   end if;
--   if pg_temp.parity() <> '' then fail := fail || ' ' || pg_temp.parity() || ';'; end if;
--   insert into proof (step, ok, detail) values ('3 let_back_in restores', fail = '', coalesce(nullif(btrim(fail), ''),
--     'the block took 2; the two-name lift restored 2, let_in 0, keys {admitted,event_id,let_in,no_room,ok,restored}; the block gone; at parity'));
-- exception when others then
--   insert into proof (step, ok, detail) values ('3 let_back_in restores', false, sqlerrm);
-- end $$;
--
-- -- 4. ★ ...taking only the rows it can at once, under her row: the order off the live catalog.
-- do $$
-- declare body text := (select regexp_replace(p.prosrc, '\s+', ' ', 'g') from pg_proc p
--                         where p.oid = 'public.let_back_in(uuid,boolean,boolean)'::regprocedure);
--   her_row int; the_rows int;
-- begin
--   her_row := position('from public.profiles where id = v_event.host_id for update;' in body);
--   the_rows := position('order by m.created_at desc, m.id desc for update skip locked loop' in body);
--   insert into proof (step, ok, detail) values ('4 the lift skips a held row', her_row > 0 and the_rows > her_row,
--     format('her row %s, the block''s rows skip locked %s', her_row, the_rows));
-- exception when others then
--   insert into proof (step, ok, detail) values ('4 the lift skips a held row', false, sqlerrm);
-- end $$;
--
-- -- 5. ★ Her own word on the step under a hold (red-team 57c): approve holds it from names only; her own write turns it on
-- -- (a page loaded before the hold); the gate's leaving keeps it on, and the door's answer says nothing came back.
-- do $$
-- declare v jsonb; got text; fail text := '';
-- begin
--   v := pg_temp.as_user(pg_temp.fx('host'), format('select public.set_event_door(%L, ''approve'')::text', pg_temp.fx('event')))::jsonb;
--   if not (v ->> 'email_held')::boolean or not (select email_held from public.events where id = pg_temp.fx('event')) then
--     raise exception 'the hold: %', v;
--   end if;
--   got := pg_temp.as_user(pg_temp.fx('host'), format(
--     'update public.events set require_verified_email = true where id = %L returning email_held::text', pg_temp.fx('event')));
--   v := pg_temp.as_user(pg_temp.fx('host'), format('select public.set_event_door(%L, ''open'')::text', pg_temp.fx('event')))::jsonb;
--   if got <> 'false' then fail := fail || ' her write left email_held ' || got || ';'; end if;
--   if (v ->> 'email_restored')::boolean then fail := fail || ' Public gave back ' || v::text || ';'; end if;
--   if not (select require_verified_email and not email_held from public.events where id = pg_temp.fx('event')) then
--     fail := fail || ' the step is off: her word undone;';
--   end if;
--   insert into proof (step, ok, detail) values ('5 her own word under a hold', fail = '', coalesce(nullif(btrim(fail), ''),
--     'approve held it; her own write of the step: email_held false at once; Public: email_restored false, the step stays on'));
-- exception when others then
--   insert into proof (step, ok, detail) values ('5 her own word under a hold', false, sqlerrm);
-- end $$;
--
-- -- 6. Today's rule, and every refusal, kept: names only, then approve holds; her write of the step off under it is the
-- -- CHECK's 23514; a save of her name, another host's write and anon's leave the memory; Public gives back.
-- do $$
-- declare v jsonb; a text; b text; c text; d text; fail text := ''; e uuid := pg_temp.fx('event');
-- begin
--   a := pg_temp.as_user(pg_temp.fx('host'), format(
--     'update public.events set require_verified_email = false where id = %L returning email_held::text', pg_temp.fx('event')));
--   v := pg_temp.as_user(pg_temp.fx('host'), format('select public.set_event_door(%L, ''approve'')::text', pg_temp.fx('event')))::jsonb;
--   if a <> 'false' or not (v ->> 'email_held')::boolean then fail := fail || ' the hold: ' || a || ' ' || v::text || ';'; end if;
--   a := pg_temp.as_user(pg_temp.fx('host'), format(
--     'update public.events set require_verified_email = false where id = %L returning 1', pg_temp.fx('event')));
--   b := pg_temp.as_user(pg_temp.fx('host'), format(
--     'update public.events set name = name where id = %L returning email_held::text', pg_temp.fx('event')));
--   c := pg_temp.as_user(pg_temp.fx('other'), format(
--     'with u as (update public.events set require_verified_email = true where id = %L returning 1) select count(*)::text from u',
--     pg_temp.fx('event')));
--   set local role anon;
--   begin
--     update public.events set require_verified_email = true where id = e;
--     d := 'anon wrote';
--   exception when insufficient_privilege then d := '42501';
--   end;
--   reset role;
--   if a not like 'error 23514%' then fail := fail || ' off under the hold: ' || a || ';'; end if;
--   if b <> 'true' then fail := fail || ' her name: ' || b || ';'; end if;
--   if c <> '0' then fail := fail || ' another host: ' || c || ';'; end if;
--   if d <> '42501' then fail := fail || ' anon: ' || d || ';'; end if;
--   if not (select gate = 'approve' and require_verified_email and email_held from public.events where id = pg_temp.fx('event')) then
--     fail := fail || ' the hold moved;';
--   end if;
--   v := pg_temp.as_user(pg_temp.fx('host'), format('select public.set_event_door(%L, ''open'')::text', pg_temp.fx('event')))::jsonb;
--   if not (v ->> 'email_restored')::boolean or (select require_verified_email or email_held from public.events where id = pg_temp.fx('event')) then
--     fail := fail || ' Public: ' || v::text || ';';
--   end if;
--   insert into proof (step, ok, detail) values ('6 the rule and the refusals', fail = '', coalesce(nullif(btrim(fail), ''),
--     'names only then approve: held; her write of the step off: 23514; her name saved, another host''s write (0 rows) and anon''s (42501) left the memory; Public gave names only back'));
-- exception when others then
--   insert into proof (step, ok, detail) values ('6 the rule and the refusals', false, sqlerrm);
-- end $$;
--
-- -- 7. The modes, the grants and the trigger, as the file leaves them.
-- do $$
-- declare t text := (select pg_get_triggerdef(t.oid) from pg_trigger t
--                     where t.tgrelid = 'public.events'::regclass and t.tgname = 'events_email_held');
-- begin
--   insert into proof (step, ok, detail) values ('7 grants and the trigger',
--     (select bool_and(p.proconfig = array['search_path=""'] and p.prosecdef = (p.proname <> 'events_email_held')
--                      and p.proacl::text = case p.proname
--                        when 'events_email_held' then '{postgres=X/postgres,service_role=X/postgres}'
--                        else '{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}' end)
--        from pg_proc p where p.oid in ('public.restore_media(uuid)'::regprocedure,
--                                       'public.let_back_in(uuid,boolean,boolean)'::regprocedure,
--                                       'public.events_email_held()'::regprocedure))
--     and not has_function_privilege('anon', 'public.restore_media(uuid)', 'EXECUTE')
--     and not has_function_privilege('anon', 'public.let_back_in(uuid,boolean,boolean)', 'EXECUTE')
--     and not has_function_privilege('authenticated', 'public.events_email_held()', 'EXECUTE')
--     and t = 'CREATE TRIGGER events_email_held BEFORE UPDATE OF gate, require_verified_email ON public.events FOR EACH ROW EXECUTE FUNCTION events_email_held()',
--     t);
-- exception when others then
--   insert into proof (step, ok, detail) values ('7 grants and the trigger', false, sqlerrm);
-- end $$;
--
-- insert into proof (step, ok, detail)
--   select 'hash ' || p.oid::regprocedure::text, true, md5(p.prosrc) || '  ' || p.proacl::text
--     from pg_proc p where p.oid in ('public.restore_media(uuid)'::regprocedure, 'public.let_back_in(uuid,boolean,boolean)'::regprocedure,
--                                    'public.events_email_held()'::regprocedure)
--    order by 2;
--
-- select n, step, ok::text, detail from proof order by n;
