-- =============================================================================================
-- THE DEVELOP AND THE CAMERA'S ROLL, THE FOUNDATION (lane `disposable-foundation`; the decisions are
-- docs/reviews/disposable-mode.json, rounds 1 to 3; the model is the Advisor's read of the live catalog, Q8, and the
-- program's synthesis of 2026-10-02, Q9: built as written but where this header says plainly what it found better).
--
-- WHAT A HOST GETS: two answers, each independent of the other. HOW GUESTS ADD: free uploads (today's), or the
-- album's camera, a roll of 24 shots each counted by the server, a video one shot of up to 10 seconds. WHEN EVERYONE
-- SEES WHAT'S ADDED: right away, once she approves each (today's `moderation_mode`, untouched), or all at once at a
-- develop time guests can see (9 am the next day by default), with Develop now. A disposable camera is the camera plus
-- a develop time: a preset, never a column. Until a row develops nobody but the host sees it: a guest sees her own
-- (her tracker's read) and what waits only as a count and its minutes.
--
-- THE MODEL, AS BUILT:
--   1. THE EVENT: `capture` (text under a CHECK, `upload` or `camera`: a third way to add is a constraint swap, never
--      an enum value its own transaction cannot use), `roll_size` (24 with the camera unless a host names fewer, NULL
--      without), `develops_at` (NULL is no develop) and `sealed_from` (when the current period began, stamped by the
--      event's own trigger, never written by a client). The first three join BOTH the INSERT and the UPDATE column
--      grants on `events` (live: 16 columns each, `authenticated` holding no table-level write), additively, so the
--      create wizard's later wiring needs no migration. Approve plus develop is legal here: a row shows once it is
--      approved AND past its time (Settings offers three answers; whether it ever offers that fourth is a board's).
--   2. THE SEAL IS PER ROW: `media.sealed_until`, NULL meaning unsealed, set by `create_media*` to the develop time
--      while it is ahead, whatever the capture (an upload album that reveals at 9 am is real). ONE predicate decides
--      what a viewer may see, in every SQL home and (as a column filter) in the app's guest reads:
--          m.status = 'approved'
--          and (m.sealed_until is null or m.sealed_until <= now() or e.host_id = (select auth.uid()))
--      written so a NULL is visible (the brief's sealed predicate, `m.sealed_until > now() and e.host_id is distinct
--      from (select auth.uid())`, is read as written where what waits is counted, and negated where a viewer sees).
--      The host is exempt where her own session asks (her dashboard's cards); a service-role read has no
--      `auth.uid()` and reads as a guest. Not `pending`: `create_media` derives the status from `moderation_mode`
--      alone, `pending` feeds the host's Review and its counts, and a mass flip would stamp `let_in_at` on every row.
--   3. NO WAITING ID LEAVES THE SERVER. The guest album's change log (`album_changes_since`, scope `album`) never
--      stamps a row a guest may not see: its `album_version` moves only when an item enters or leaves what a guest
--      sees, so a sealed or held id is never in a delta, nor its tombstone. In the same snapshot it answers
--      `waiting: {count, minutes}`: the rows held for the host and the rows sealed for the develop, counted together
--      (the guest's experience is one), per minute. A change to those facts moves `album_max` (so the guest's
--      validator rolls and the 304 holds) and rings the doorbell.
--   4. DEVELOP IS A WRITE. The guest poll's quiet path reads one row, so a lazy predicate alone would reach nobody
--      until a reload. `develop_due(event)` brings the event's sealed rows to its answer in one guarded UPDATE, which
--      moves the album's versions through the album triggers (they learn `sealed_until`), and rings the doorbell ONCE
--      (the per-row pings held for the move). The app runs it on the first guest read that needs it:
--      `get_event_by_qr_token` answers `develop_due` (`seal_disagrees`, two index probes), so only an album due a
--      develop pays a call. A daily sweep (`develop_due_sweep`) joins the purge cron with its own job and switch
--      (`develop_rolls_enabled`), so an album nobody reads still converges.
--   5. A NEW `develops_at` REWRITES THE EVENT'S ROWS IN THE SAME SAVE (`events_develops_rewrite`, AFTER UPDATE, the
--      same pass as the develop, `develop_rows`): right away (NULL) and Develop now (now()) open every sealed row; a
--      time ahead moves them to it, opens any already due (nothing a guest may have seen is ever sealed again) and
--      seals the event's held rows with them (no guest has seen one, so a host who moves from approving each to a
--      develop time sends what she then approves to the develop, never to everyone at once).
--   6. THE PERIOD AND THE ROLL. `sealed_from` stamps now() when a develop time comes ahead (from none, or from one
--      already reached: a new develop is a new roll) and when the camera begins (an upload album turned camera starts
--      every guest on a fresh roll; the brief stamped on the develop alone, which leaves a camera without a develop
--      time no period to count from), and clears when neither remains. The roll counts a guest's LIVE shots since it
--      (held, approved or hidden; never removed: Will's overrule, 2026-10-02, "removing a dispo shot should free a
--      shot slot to take another"), her ticket's rows and her account's here, and `create_media` refuses the shot past
--      `roll_size` under the host's `profiles` row FOR UPDATE (which every `create_media` of an album takes first) and
--      the roll's own advisory lock on her identity, so two completes never both count 23. The presign refuses early
--      through `get_upload_context`'s `roll: {used, cap, taken, ceiling}` (`get_upload_gate` answers the same for the
--      page and her tracker); `create_media_as_host` is exempt. A camera video carries a byte ceiling (128 MiB)
--      beside its 10 s, since its length is the client's word.
--   7. THE CHURN A FREED FRAME OPENS, BOUNDED TWICE. A shot she withdraws from a camera's period is purged by the next
--      nightly sweep (`set_media_purge_at`: `purge_at = removed_at`, not 30 days on; a legal hold, an open report and
--      `kept_media_ids` still keep it), and she takes at most three rolls' worth in a period, removed or not
--      (`roll_size * 3`, refused in `create_media` under the same locks). That count lives in its own ledger,
--      `camera_rolls` (one row a guest a period, written by `create_media` alone): the purge deletes the rows a count
--      of media would read, so such a count would forget them by morning. ★ The host's storage cap reads ACTIVE bytes
--      (`host_active_bytes`), so a withdrawn shot leaves it at once and a delete-and-reshoot never fills it; the
--      monthly ingress meter counts every upload and never gives one back, so it bounds the bytes a churn can move,
--      the ceiling its rows, and the fast purge its storage.
--   ★ A STRAGGLER HEALS ON THE NEXT READ; NOTHING WAITS ON A MEDIA ROW WHILE IT HOLDS THE EVENT ROW. A shot whose
--      upload read the event an instant before a host's save committed lands on the old answer (sealed to an old
--      time, or sealed after Develop now). `develop_rows` is the one home of the answer (the develop, the save's
--      rewrite and that heal alike), and the read's `develop_due` asks `seal_disagrees`, so the album's next read heals
--      the straggler and the daily sweep catches an album nobody reads. No upload locks the event row. The save's
--      rewrite runs inside the host's UPDATE, which holds it, so it moves only the rows it can lock at once (SKIP
--      LOCKED) and leaves the rest to that heal: a row another writer holds is being moderated, removed or purged
--      that instant. Measured on the stand-in, twelve writers of every shape on one host's two albums for 90 seconds
--      (shots, the host's own, saves of every column here, develops and sweeps, bulk moderation, removals, purges,
--      takedowns, blocks and their undoing, deletes and restores): before this lane 176 deadlocks in 9,529
--      transactions, every one among those writers' own cycles and none naming the event row; an upload holding the
--      event row's share lock after the host's profiles lock closed 7 that named it, and a rewrite waiting on media
--      rows while holding it 3 (a restore holds the profiles row and wants the event row; a purge or an operator's
--      takedown holds a media row and wants the profiles row); as built, 137 in 8,718, none naming the event row or
--      an album row, and none in a save (998 saves of the develop time or the capture, each rewriting its rows): the
--      develop's own are bulk media writes among the bulk writes already there, and the next read retries one.
--
-- LOCK ORDER, the album rows' rule (20260926100000's header): unchanged. The note triggers still only note event ids;
-- the stamps still write at COMMIT, in event-id order. `create_media*` lock what they locked before (the host's
-- profiles row first, then the row they insert), and a camera's shot then the roll's advisory lock and its ledger
-- row, which nothing else takes. `develop_due` locks only the media rows it moves (one UPDATE, one plan's order) and,
-- at commit, the album rows: the shape every bulk moderation write already has; the save's rewrite the same, inside
-- the event row its UPDATE holds, skipping any media row it cannot take at once.

-- AN EXPAND: the deployed build never names a new column, table or function. Nothing is sealed until a host sets a
-- develop time, and no roll counts until she turns the camera on, which only this lane's build offers;
-- `get_event_by_qr_token` gains four columns LAST, so the deployed build reads every column where it reads them today.
-- One change the deployed build meets: a held upload now moves the guest album's `album_max` and rings (what waits is
-- the guest's to count), so a hold album's open pages answer one 200 with no change in it where they answered a 304.
-- ★ Prod (milestone 33) and the alias share this database: a sealed TEST album stays readable through partyreel.com's
-- older app-side reads (the manifest page, the links route and the head counts, which carry no column filter) until
-- milestone 34. Accepted for test data, and written into build 43's red-team brief.
--
-- LOCKS AT APPLY: `alter table` on events and media takes ACCESS EXCLUSIVE for an instant (no rewrite: the new
-- columns are NULL or carry a constant default); the index builds over ~1,500 media rows; the trigger swaps take
-- SHARE ROW EXCLUSIVE on media and events until COMMIT (writes wait, reads do not); the ledger is a new, empty table.
--
-- APPLY PROTOCOL (database-security.md -> Workflow):
--   (1) drift, read-only: every body this file replaces hashes as the file it replaces (whitespace collapsed,
--       2026-10-02): album_changes_since feeb34a8, album_note_media 4f8bb740, album_stamp_media 3b1da069,
--       notify_gallery_change 209cc252, event_covers 118148ce, event_stills a76dd2dc, event_card_stats 86bd829d,
--       get_event_media_by_qr_token 4c600834, create_media 70a83228, create_media_as_host e3e874a1, create_report
--       298f624b, get_event_by_qr_token 27fa8ec2, get_public_profile 5e36c1f8, get_upload_context 2d7ca4ea,
--       get_upload_gate 6d7dd0f7, like_media 6d44d981, set_media_purge_at e8e63970; and no `capture`, `roll_size`,
--       `develops_at`, `sealed_from`, `sealed_until` or `camera_rolls` exists.
--   (2) the rolled-back check at the foot (red on today's schema, green with this file), then apply verbatim.
--   (3) get_advisors, EXPECTED DELTA: `rls_enabled_no_policy` 18 -> 19 (`camera_rolls`, deny-all like `album_state`);
--       0028 and 0029 unchanged: every new function is service-role only or the owner's alone, the trigger functions
--       revoked from the client roles; `get_event_by_qr_token` keeps its four holders; no policy and no client table
--       grant beyond the additive column grants.
--   (4) regenerate src/lib/db/types.ts (events: capture, roll_size, develops_at, sealed_from; media: sealed_until; the
--       table camera_rolls; get_event_by_qr_token's four columns; develop_due, develop_due_sweep), then drop the typed
--       seams the lane names in its handoff.
-- =============================================================================================

-- =============================================================================================
-- 1. The columns, and the roll's ledger.
-- =============================================================================================
alter table public.events
  add column capture text not null default 'upload',
  add column roll_size integer,
  add column develops_at timestamptz,
  add column sealed_from timestamptz;

comment on column public.events.capture is
  'How guests add: upload (free uploads) or camera (the album''s camera: a guest holds at most roll_size live shots in the current period, and takes at most three rolls'' worth, counted by create_media). Host-written; events_reveal_stamp keeps roll_size and sealed_from with it.';
comment on column public.events.roll_size is
  'The camera''s roll: the live shots a guest may hold in the current period (24 unless a host names fewer; at most 24). NULL for free uploads. Filled in and cleared by events_reveal_stamp.';
comment on column public.events.develops_at is
  'When everyone sees what''s added, as a time: NULL is no develop (right away, or as the host approves each, by moderation_mode); a time ahead seals each new row until it (media.sealed_until); a time reached is developed. A value within a minute of now, or before it, is stored as now(): Develop now in the database''s clock. A change rewrites the event''s rows in the same save (events_develops_rewrite).';
comment on column public.events.sealed_from is
  'When the current period began: stamped now() when a develop time comes ahead (from none, or from one already reached) and when the camera begins; NULL when neither a develop time nor the camera remains. The roll counts a guest''s shots since it. Stamped by events_reveal_stamp, never written by a client.';

-- A host writes the first three straight through PostgREST, so her session passes no schema: each column carries the
-- app's envelope (the develop's own bound is DEVELOP_MAX_AHEAD_DAYS, src/lib/disposable/reveal.ts; the roll's most is
-- ROLL_SHOTS, src/lib/disposable/roll.ts, under a parity test).
alter table public.events
  add constraint events_capture_known check (capture in ('upload', 'camera')),
  add constraint events_roll_size_follows_capture check ((capture = 'camera') = (roll_size is not null)),
  add constraint events_roll_size_range check (roll_size between 1 and 24),
  add constraint events_develops_at_finite check (develops_at is null or isfinite(develops_at)),
  add constraint events_camera_has_period check (capture <> 'camera' or sealed_from is not null);

alter table public.media
  add column sealed_until timestamptz;

comment on column public.media.sealed_until is
  'The develop''s seal: until when nobody but the host sees this item. NULL is unsealed. Set only by create_media* (to the event''s develop time while it is ahead); cleared or moved only by develop_rows, to its event''s answer (the develop, a host''s save of develops_at, the heal of a straggler). Never written by a client.';

alter table public.media
  add constraint media_sealed_until_finite check (sealed_until is null or isfinite(sealed_until));

-- The sealed rows only: what the develop, the due probe, the waiting count and the sweep read.
create index media_sealed_idx on public.media (event_id, sealed_until)
  where sealed_until is not null;

-- THE ROLL'S LEDGER: how many shots a guest's ticket has taken in a camera's period, removed, purged or not. The
-- ceiling's count (three rolls' worth a period) reads it, since the fast purge of a withdrawn shot deletes the very
-- rows a count of media would read. Written by create_media alone, under the host's profiles lock and the roll's
-- advisory lock; its rows go with the ticket. Deny-all, like album_state: RLS on, no policy, the service role's SELECT.
create table public.camera_rolls (
  guest_id uuid not null references public.guests (id) on delete cascade,
  sealed_from timestamptz not null,
  taken integer not null check (taken > 0),
  primary key (guest_id, sealed_from)
);

comment on table public.camera_rolls is
  'The camera''s ledger: every shot a guest''s ticket has taken in a period (events.sealed_from), kept when the shot is removed or purged, so create_media''s ceiling (roll_size * 3 a period) outlives the fast purge of a withdrawn shot. Written by create_media alone. Service role SELECT only (RLS on, no policy).';

alter table public.camera_rolls enable row level security;
revoke all on table public.camera_rolls from public, anon, authenticated, service_role;
grant select on table public.camera_rolls to service_role;

-- Additive column grants (database-security.md, Gotchas: a table-level revoke here would take every other column's
-- grant with it). The host writes how guests add, the roll's size and the develop time; she reads her own rows' seal
-- (her dashboard's INVOKER reads name it). sealed_from and sealed_until are no client's to write.
grant insert (capture, roll_size, develops_at), update (capture, roll_size, develops_at) on public.events
  to authenticated;
grant select (sealed_until) on public.media to authenticated;

-- The develop sweep's kill switch, seeded ON like every sub-sweep's (a missing row reads as enabled too).
insert into public.ops_flags (key, enabled) values ('develop_rolls_enabled', true)
on conflict (key) do nothing;

-- =============================================================================================
-- 2. The helpers.
-- =============================================================================================

-- WHICH ALBUM SCOPES A ROW'S MOVE TOUCHES, NOW THAT A ROW CAN BE SEALED: bit 1 the host's (album_scope's own; the
-- seal never moves the host's view, she is exempt), +2 what a guest sees (into or out of approved AND unsealed: the
-- only bit that stamps an item's album_version), +4 what waits (into or out of held, or approved AND sealed: the
-- guest's waiting facts; it moves album_max and never stamps the item, so no waiting id rides the guest's log). A NULL
-- side is "no row".
create function public.album_bits(
  p_was public.media_status,
  p_was_sealed boolean,
  p_is public.media_status,
  p_is_sealed boolean
)
returns integer
language sql
immutable
set search_path = ''
as $$
  select (public.album_scope(p_was, p_is) & 1)
    + case
        when (p_was is not distinct from 'approved' and not coalesce(p_was_sealed, false))
          <> (p_is is not distinct from 'approved' and not coalesce(p_is_sealed, false))
        then 2 else 0
      end
    + case
        when (p_was is not distinct from 'pending'
              or (p_was is not distinct from 'approved' and coalesce(p_was_sealed, false)))
          <> (p_is is not distinct from 'pending'
              or (p_is is not distinct from 'approved' and coalesce(p_is_sealed, false)))
        then 4 else 0
      end;
$$;

comment on function public.album_bits(public.media_status, boolean, public.media_status, boolean) is
  'Which album scopes a media row''s move touches: 1 the host''s (album_scope''s), +2 what a guest sees (approved and unsealed; the only bit that stamps album_version), +4 what waits (held, or approved and sealed; moves album_max only). Internal to the album_* triggers and the doorbell.';

-- ONE RING FOR AN EVENT: the doorbell's ping, for a write that held its per-row pings (develop_rows' callers). The same
-- channel, the same contentless ping and the same exception guard as notify_gallery_change's own.
create function public.album_doorbell(p_event_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_qr text;
begin
  select e.qr_token into v_qr
    from public.events e
   where e.id = p_event_id and e.deleted_at is null;
  if v_qr is null then
    return;
  end if;
  begin
    perform realtime.send('{}'::jsonb, 'ping', 'gallery:' || v_qr, false);
  exception when others then
    null; -- a realtime failure must never fail the write that rang
  end;
end;
$$;

comment on function public.album_doorbell(uuid) is
  'One doorbell ping for an event (gallery:<qr_token>), for a write that held its per-row pings (develop_due, a save of develops_at). Swallows a realtime failure. The owner''s alone: only definer bodies call it.';

-- THE ROLL, AS A GUEST HOLDS IT: `live`, her shots at this album since the period began that are not removed (held,
-- approved or hidden: a host's hide keeps the frame taken; a removal of any kind gives it back, and a purge only
-- takes rows already removed), and `taken`, every shot her tickets took in the period, removed, purged or not (the
-- ledger). Hers is her ticket's rows and every row of her account here, in both counts. Read by create_media under the
-- host's profiles lock and the roll's own advisory lock (the serialization), and by the two upload reads as advice.
create function public.guest_roll(
  p_event public.events,
  p_guest_id uuid,
  p_user_id uuid,
  out live integer,
  out taken integer
)
language sql
stable
security invoker
set search_path = ''
as $$
  with hers as (
    select g.id
      from public.guests g
     where g.event_id = p_event.id
       and (g.id = p_guest_id or (p_user_id is not null and g.user_id = p_user_id))
  )
  select
    (select count(*)::integer
       from public.media m
      where m.event_id = p_event.id
        and m.created_at >= p_event.sealed_from
        and m.status <> 'removed'
        and m.guest_id in (select h.id from hers h)),
    (select coalesce(sum(c.taken), 0)::integer
       from public.camera_rolls c
      where c.sealed_from = p_event.sealed_from
        and c.guest_id in (select h.id from hers h));
$$;

comment on function public.guest_roll(public.events, uuid, uuid) is
  'A guest''s roll at an album: live (her live rows since events.sealed_from: held, approved or hidden, never removed) and taken (every shot her tickets took in the period, from camera_rolls). Hers: the ticket''s rows and her account''s here. A NULL sealed_from counts nothing. The owner''s alone: only definer bodies call it.';

-- DOES AN ALBUM'S SEAL DISAGREE WITH ITS EVENT? The one home of the question develop_due answers: with no develop time
-- ahead (none, or one reached), any sealed row disagrees; under a develop time ahead, any row sealed to another time
-- does (one already past is one of them). Two bounded range probes on media_sealed_idx, so the album's read can ask
-- it on every call (`get_event_by_qr_token`'s develop_due). A held row left unsealed under a time ahead is not asked
-- after (the save that set the time sealed every held row it could take, and asking would cost every read a scan):
-- only a straggler of that save, which the next develop pass of the album seals.
create function public.seal_disagrees(p_event public.events)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select case
    when p_event.develops_at is null or p_event.develops_at <= now() then
      exists (select 1 from public.media m
               where m.event_id = p_event.id and m.sealed_until is not null)
    else
      exists (select 1 from public.media m
               where m.event_id = p_event.id and m.sealed_until < p_event.develops_at)
      or exists (select 1 from public.media m
                  where m.event_id = p_event.id and m.sealed_until > p_event.develops_at)
  end;
$$;

comment on function public.seal_disagrees(public.events) is
  'Whether an album''s sealed rows disagree with its event''s answer (any sealed row with no develop time ahead; any row sealed to another time under one). Two bounded probes on media_sealed_idx. The owner''s alone: only definer bodies call it.';

-- =============================================================================================
-- 3. The album's versions learn the seal and what waits.
-- =============================================================================================

-- IMMEDIATE, on media: note the event (host scope; and the guest album when what a guest sees, or what waits, moved).
-- Touches no table, so it adds no lock to the statement that fired it.
create or replace function public.album_note_media()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_scope integer;
  v_event uuid;
begin
  if tg_op = 'INSERT' then
    v_scope := public.album_bits(null, null, new.status, new.sealed_until is not null);
    v_event := new.event_id;
  elsif tg_op = 'UPDATE' then
    v_scope := public.album_bits(old.status, old.sealed_until is not null, new.status, new.sealed_until is not null);
    v_event := new.event_id;
  else
    v_scope := public.album_bits(old.status, old.sealed_until is not null, null, null);
    v_event := old.event_id;
  end if;
  if v_scope & 1 = 1 then
    perform public.album_remember('h', v_event);
  end if;
  if v_scope & 6 <> 0 then
    perform public.album_remember('a', v_event);
  end if;
  return null;
end;
$$;

-- DEFERRED, on media: at commit, flush (the first stamp bumps every noted event, in order), then write this item's
-- row in the change log at its event's new versions. The album_version moves only when the item entered or left
-- what a guest sees (bit 2); a waiting item's moves leave it as it was, NULL for an item never seen. ★ A move with no
-- host bit (a develop) still writes the event's CURRENT host version on the row: never lower than the row's own
-- (versions only rise), so at worst a host client below it re-applies the item as it stands, a no-op upsert.
create or replace function public.album_stamp_media()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_scope integer;
  v_event uuid;
  v_media uuid;
begin
  if tg_op = 'INSERT' then
    v_scope := public.album_bits(null, null, new.status, new.sealed_until is not null);
    v_event := new.event_id;
    v_media := new.id;
  elsif tg_op = 'UPDATE' then
    v_scope := public.album_bits(old.status, old.sealed_until is not null, new.status, new.sealed_until is not null);
    v_event := new.event_id;
    v_media := new.id;
  else
    v_scope := public.album_bits(old.status, old.sealed_until is not null, null, null);
    v_event := old.event_id;
    v_media := old.id;
  end if;
  if v_scope = 0 then
    return null;
  end if;

  perform public.album_flush();

  -- Keyed on the event's own row, so an event deleted in this transaction writes nothing.
  insert into public.album_changes as c (event_id, media_id, host_version, album_version)
  select v_event, v_media, s.version, case when v_scope & 2 = 2 then s.album_max end
    from public.album_state s
   where s.event_id = v_event
  on conflict (event_id, media_id) do update set
    host_version = excluded.host_version,
    album_version = coalesce(excluded.album_version, c.album_version);
  return null;
end;
$$;

comment on function public.album_note_media() is
  'IMMEDIATE media trigger: notes the event of a move for this transaction''s album flush (album_bits: the host''s scope; the guest album when what a guest sees, or what waits, moved). Touches no table.';
comment on function public.album_stamp_media() is
  'DEFERRED media constraint trigger: at commit, flushes the album versions (album_flush) and writes the item''s album_changes row; album_version moves only when the item entered or left what a guest sees (approved and unsealed).';

-- The triggers watch the seal too. Names unchanged, so each note still sorts before its stamp (`*_album_note` <
-- `*_album_stamp`), which a `set constraints all immediate` path depends on.
drop trigger media_album_note on public.media;
drop trigger media_album_stamp on public.media;

create trigger media_album_note
  after insert or update of status, sealed_until or delete on public.media
  for each row execute function public.album_note_media();

create constraint trigger media_album_stamp
  after insert or update of status, sealed_until or delete on public.media
  deferrable initially deferred
  for each row execute function public.album_stamp_media();

-- THE DOORBELL rings when what a guest's album shows moved: an item into or out of what a guest sees, or a row into or
-- out of what waits (held for the host, or sealed for the develop: its count rides the album's sync), and stays silent
-- for a hidden->removed flip, a hidden row's return or a new develop time for rows already sealed. Its bits are the
-- album's own (album_bits & 6), so the doorbell and the guest album's versions can never disagree about a move. ★ A
-- write that moves many rows at once (develop_rows) holds the per-row pings (`partyreel.doorbell_hold`,
-- transaction-local) and its caller rings once (album_doorbell): two thousand shots developing would otherwise be two
-- thousand pings to every phone in the room.
create or replace function public.notify_gallery_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event_id uuid;
  v_bits integer;
  v_qr text;
begin
  if coalesce(pg_catalog.current_setting('partyreel.doorbell_hold', true), '') = 'on' then
    return null;
  end if;

  if tg_op = 'INSERT' then
    v_event_id := new.event_id;
    v_bits := public.album_bits(null, null, new.status, new.sealed_until is not null);
  elsif tg_op = 'UPDATE' then
    v_event_id := new.event_id;
    v_bits := public.album_bits(old.status, old.sealed_until is not null, new.status, new.sealed_until is not null);
  else -- DELETE
    v_event_id := old.event_id;
    v_bits := public.album_bits(old.status, old.sealed_until is not null, null, null);
  end if;

  -- Only ring when what a guest sees, or what waits, actually changed (a hidden->removed flip moves neither; don't
  -- wake their tabs).
  if v_bits & 6 = 0 then
    return null;
  end if;

  -- Deleted events have no live gallery; cascading media deletes stay silent.
  select e.qr_token into v_qr
  from public.events e
  where e.id = v_event_id and e.deleted_at is null;
  if v_qr is null then
    return null;
  end if;

  begin
    perform realtime.send('{}'::jsonb, 'ping', 'gallery:' || v_qr, false);
  exception when others then
    null; -- a realtime failure must never fail the media write
  end;
  return null;
end;
$$;

-- THE READER: 20261001150000's body, with the guest album's count leaving out what a guest may not see (the one
-- predicate; this reader is the service role's, so `auth.uid()` is NULL and it reads as a guest), and what waits in
-- the same snapshot: `waiting` {count, minutes: [[minute start in epoch ms, rows], ...]} for scope `album`, the rows
-- held for the host's approval and the approved rows still sealed, together (the guest's experience is one). The
-- changes keyset is untouched: a waiting row never carries an album_version (album_bits), so no waiting id, and no
-- waiting tombstone, can ride it.
create or replace function public.album_changes_since(
  p_event_id uuid,
  p_scope text,
  p_after bigint,
  p_limit integer default null
)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select jsonb_build_object(
    'version', coalesce(s.version, 0),
    'album_max', coalesce(s.album_max, 0),
    'attr_version', coalesce(s.attr_version, 0),
    'watermark', case p_scope
      when 'host' then coalesce(s.host_watermark, 0)
      when 'album' then coalesce(s.album_watermark, 0)
      else 0
    end,
    'approved', case
      when p_scope = 'host' then (
        select count(*) from public.media m
         where m.event_id = p_event_id and m.status = 'approved')
      when p_scope = 'album' then (
        select count(*) from public.media m
          join public.events e on e.id = m.event_id
         where m.event_id = p_event_id and m.status = 'approved'
           and (m.sealed_until is null or m.sealed_until <= now() or e.host_id = (select auth.uid())))
    end,
    'hidden', case when p_scope = 'host' then (
      select count(*) from public.media m
       where m.event_id = p_event_id and m.status = 'hidden') end,
    'pending', case when p_scope = 'host' then (
      select count(*) from public.media m
       where m.event_id = p_event_id and m.status = 'pending') end,
    'waiting', case when p_scope = 'album' then (
      select jsonb_build_object(
               'count', coalesce(sum(x.n), 0)::bigint,
               'minutes', coalesce(jsonb_agg(jsonb_build_array(x.at, x.n) order by x.at), '[]'::jsonb))
        from (
          select (extract(epoch from date_trunc('minute', m.created_at)) * 1000)::bigint as at,
                 count(*) as n
            from public.media m
            join public.events e on e.id = m.event_id
           where m.event_id = p_event_id
             and (m.status = 'pending'
                  or (m.status = 'approved'
                      and m.sealed_until > now() and e.host_id is distinct from (select auth.uid())))
           group by 1
        ) x) end,
    'changes', coalesce((
      select jsonb_agg(
               jsonb_build_array(
                 c.media_id, c.v, m.status, m.type, m.width, m.height, m.duration_seconds,
                 m.preview_key is not null, m.reel_eligible,
                 (extract(epoch from m.created_at) * 1000000)::bigint,
                 case when p_scope = 'host' then m.guest_id end)
               order by c.v, c.media_id)
        from (
          (select ch.media_id, ch.host_version as v
             from public.album_changes ch
            where p_scope = 'host'
              and ch.event_id = p_event_id
              and ch.host_version > p_after
            order by ch.host_version, ch.media_id
            limit case when p_limit is null then null else least(p_limit, 1000) end)
          union all
          (select ch.media_id, ch.album_version as v
             from public.album_changes ch
            where p_scope = 'album'
              and ch.event_id = p_event_id
              and ch.album_version > p_after
            order by ch.album_version, ch.media_id
            limit case when p_limit is null then null else least(p_limit, 1000) end)
        ) c
        left join public.media m on m.id = c.media_id
    ), '[]'::jsonb)
  )
  from (select 1) as one
  left join public.album_state s on s.event_id = p_event_id;
$$;

comment on function public.album_changes_since(uuid, text, bigint, integer) is
  'The paged album''s poll read, one jsonb in one snapshot: {version, album_max, attr_version, watermark, approved, hidden, pending, waiting, changes: [[media_id, version, status, type, width, height, duration_seconds, has_preview, reel_eligible, created_at_us, guest_id], ...]}. p_scope ''album'' (guest: changes across what a guest sees, the approved count leaving sealed rows out, what waits {count, minutes}: held and sealed rows together) or ''host'' (every status change, three counts, guest_id). Keyset on the scope''s version after p_after, clamped to 1,000. SECURITY INVOKER, service role only: the route decides who may see the album.';

-- =============================================================================================
-- 4. Develop, the host's saves, and the withdrawn shot's purge.
-- =============================================================================================

-- THE DEVELOP'S ONE PASS: BRING AN EVENT'S ROWS TO ITS ANSWER, idempotent. With no develop time ahead (none, Develop
-- now, or one reached) every sealed row opens. Under a time ahead, a sealed row moves to it unless its own time has
-- passed (then it opens: nothing a guest may have seen is ever sealed again), and a held row not yet sealed is sealed
-- with them (no guest has seen a held row, so sealing one hides nothing anyone saw, and its approval then waits for the
-- develop). The per-row pings are held for the pass; the caller rings once. Nothing here touches `status`, so
-- `let_in_at` is never stamped. Answers how many rows it moved.
--   p_skip_locked: a host's save of develops_at runs this inside her UPDATE, which holds the event row, so it takes
--   only the media rows it can lock at once and leaves the rest to the next read's heal (a row another writer holds is
--   being moderated, removed or purged that instant): waiting there closed deadlock cycles through the event row
--   (the header). The develop proper holds no event row, so it waits, in one plan's order.
create function public.develop_rows(p_event public.events, p_skip_locked boolean)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_n integer := 0;
  v_m integer := 0;
begin
  perform pg_catalog.set_config('partyreel.doorbell_hold', 'on', true);
  if p_event.develops_at is null or p_event.develops_at <= now() then
    if p_skip_locked then
      update public.media m
         set sealed_until = null
       where m.id in (select s.id from public.media s
                       where s.event_id = p_event.id and s.sealed_until is not null
                       for update skip locked);
    else
      update public.media m
         set sealed_until = null
       where m.event_id = p_event.id
         and m.sealed_until is not null;
    end if;
    get diagnostics v_n = row_count;
  else
    if p_skip_locked then
      update public.media m
         set sealed_until = case when m.sealed_until <= now() then null else p_event.develops_at end
       where m.id in (select s.id from public.media s
                       where s.event_id = p_event.id
                         and (s.sealed_until < p_event.develops_at or s.sealed_until > p_event.develops_at)
                       for update skip locked);
      get diagnostics v_n = row_count;
      update public.media m
         set sealed_until = p_event.develops_at
       where m.id in (select s.id from public.media s
                       where s.event_id = p_event.id and s.status = 'pending' and s.sealed_until is null
                       for update skip locked);
      get diagnostics v_m = row_count;
    else
      update public.media m
         set sealed_until = case when m.sealed_until <= now() then null else p_event.develops_at end
       where m.event_id = p_event.id
         and (m.sealed_until < p_event.develops_at or m.sealed_until > p_event.develops_at);
      get diagnostics v_n = row_count;
      update public.media m
         set sealed_until = p_event.develops_at
       where m.event_id = p_event.id
         and m.status = 'pending'
         and m.sealed_until is null;
      get diagnostics v_m = row_count;
    end if;
  end if;
  perform pg_catalog.set_config('partyreel.doorbell_hold', '', true);
  return v_n + v_m;
end;
$$;

comment on function public.develop_rows(public.events, boolean) is
  'The develop''s one pass: brings an event''s rows to its answer (no develop time ahead: every sealed row opens; a time ahead: sealed rows move to it, any already past opens, and held rows not yet sealed are sealed with them). Per-row pings held; the caller rings. p_skip_locked takes only the rows it can lock at once (the host''s save, which holds the event row). Answers how many rows moved. The owner''s alone: only definer bodies call it.';

-- DEVELOP: the time passed, or a straggler. The first guest read that finds `get_event_by_qr_token`'s develop_due runs
-- it, and so does the daily sweep: nothing to move answers 0 (two index probes, `seal_disagrees`); otherwise the one
-- pass (`develop_rows`) and one ring. ★ IT TAKES NO EVENT ROW: a lock there would sit between a restore's
-- profiles-then-event and a purge's media-then-profiles and close a cycle with them (measured on the stand-in; the
-- header). Two calls on one album update the same rows in one plan's order, the second re-reading each row it waited
-- on, so they never deadlock and never move a row twice.
create function public.develop_due(p_event_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event public.events;
  v_n integer;
begin
  select * into v_event from public.events e where e.id = p_event_id;
  if not found or not public.seal_disagrees(v_event) then
    return 0;
  end if;
  v_n := public.develop_rows(v_event, false);
  if v_n > 0 then
    perform public.album_doorbell(p_event_id);
  end if;
  return v_n;
end;
$$;

comment on function public.develop_due(uuid) is
  'Brings an album''s rows to its event''s answer when its seal disagrees (seal_disagrees): one pass (develop_rows), one ring after; no event row is locked. Answers how many rows moved; 0 when none disagrees. Run by the app on the first guest read that finds get_event_by_qr_token''s develop_due, and by develop_due_sweep. SECURITY DEFINER, service role only.';

-- THE DAILY SWEEP'S BATCH: the albums whose sealed rows disagree with their event's answer (a develop time passed
-- with nobody reading, a straggler nobody read after), in event-id order, each through develop_due (its own ring), at
-- most p_limit albums a call (clamped to 1 .. 500, a null asks for 50). Answers {events, developed, more}: `more`
-- means albums still disagree beyond this batch.
create function public.develop_due_sweep(p_limit integer default 50)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_limit constant integer := least(greatest(coalesce(p_limit, 50), 1), 500);
  v_event uuid;
  v_events integer := 0;
  v_developed bigint := 0;
begin
  for v_event in
    select e.id
      from public.events e
     where exists (select 1 from public.media m where m.event_id = e.id and m.sealed_until is not null)
       and public.seal_disagrees(e)
     order by e.id
     limit v_limit
  loop
    v_developed := v_developed + public.develop_due(v_event);
    v_events := v_events + 1;
  end loop;

  return jsonb_build_object(
    'events', v_events,
    'developed', v_developed,
    'more', exists (
      select 1 from public.events e
       where exists (select 1 from public.media m where m.event_id = e.id and m.sealed_until is not null)
         and public.seal_disagrees(e)
    )
  );
end;
$$;

comment on function public.develop_due_sweep(integer) is
  'The purge cron''s develop sweep, one batch: up to p_limit albums whose sealed rows disagree with their event (seal_disagrees), each through develop_due, in event-id order. Answers {events, developed, more}. SECURITY DEFINER, service role only.';

-- THE EVENT'S OWN STAMPS (BEFORE INSERT OR UPDATE of the three host-written columns), never a client's word:
--   * the roll follows the capture: the camera carries one (24 unless the host named fewer), free uploads none;
--   * a develop time at or before now, within a minute, is Develop now and is stored as now(), so "now" is the
--     database's clock and never the caller's;
--   * the period: `sealed_from` stamps now() when a develop time comes ahead (from none, or from one already reached)
--     and when the camera begins, and clears when neither a develop time nor the camera remains.
create function public.events_reveal_stamp()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.capture = 'camera' then
    new.roll_size := coalesce(new.roll_size, 24); -- mirrors ROLL_SHOTS
  else
    new.roll_size := null;
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

create trigger events_reveal_stamp
  before insert or update of capture, roll_size, develops_at on public.events
  for each row execute function public.events_reveal_stamp();

comment on function public.events_reveal_stamp() is
  'BEFORE INSERT OR UPDATE OF capture, roll_size, develops_at on events: roll_size follows the capture (24 unless named, NULL for free uploads); a develops_at within a minute of now (or before it) is stored as now(), Develop now in the database''s clock; sealed_from stamps now() when a develop time comes ahead or the camera begins, and clears when neither remains.';

-- A NEW DEVELOP TIME REWRITES THE EVENT'S ROWS IN THE SAME SAVE (AFTER UPDATE OF develops_at, only when it moved):
-- right away and Develop now open every sealed row, a new time ahead moves them and seals the held ones, through the
-- develop's own pass, skipping a row another writer holds (the next read heals it). One ring after, whatever moved: the
-- open pages learn the new time (the guest sync carries it, its validator hashes it). DEFINER: the host's session
-- writes the event, never `sealed_until`.
create function public.events_develops_rewrite()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.develop_rows(new, true);
  perform public.album_doorbell(new.id);
  return null;
end;
$$;

create trigger events_develops_rewrite
  after update of develops_at on public.events
  for each row
  when (old.develops_at is distinct from new.develops_at)
  execute function public.events_develops_rewrite();

comment on function public.events_develops_rewrite() is
  'AFTER UPDATE OF develops_at on events (when it moved): develop_rows(new, skip locked) in the host''s own save, then one doorbell ring. SECURITY DEFINER (the host''s session never writes sealed_until); a trigger''s alone.';

-- THE WITHDRAWN SHOT'S PURGE: 20260604012529's derivation, the single writer of purge_at, with one arm. A shot a guest
-- withdraws from a camera's period (her own removal, `removed_by_uploader`, of a row taken since its sealed_from)
-- purges at the next nightly sweep: `purge_at = removed_at`, not 30 days on, since a frame it frees invites a
-- reshoot. A legal hold, an open report and `kept_media_ids` keep it exactly as they keep any row (the sweep's own
-- guards, untouched); the host never saw a withdrawal in her bin. INVOKER, as it was: the events read happens only
-- for her own removal, which only definer bodies write (remove_my_upload, remove_my_upload_by_session,
-- disown_guest_rows_by_email), and nested so a host's own removal never reaches it.
create or replace function public.set_media_purge_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'removed' then
    new.purge_at := coalesce(new.removed_at, now()) + interval '30 days';
    if new.removed_by_uploader then
      if exists (select 1 from public.events e
                  where e.id = new.event_id
                    and e.capture = 'camera'
                    and new.created_at >= e.sealed_from) then
        new.purge_at := coalesce(new.removed_at, now());
      end if;
    end if;
  else
    new.purge_at := null;
  end if;
  return new;
end;
$$;

-- =============================================================================================
-- 5. The writers: the seal at insert, the camera's roll and its ledger, the camera video's ceiling.
-- =============================================================================================
create or replace function public.create_media(
  p_session_token text,
  p_media_id uuid,
  p_type public.media_type,
  p_original_key text,
  p_file_size_bytes bigint,
  p_preview_key text default null,
  p_duration_seconds double precision default null,
  p_width integer default null,
  p_height integer default null,
  p_reel_eligible boolean default true
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_guest public.guests;
  v_event public.events;
  v_profile public.profiles;
  v_limits record;
  v_status public.media_status;
  v_period text := to_char(now(), 'YYYY-MM');
  v_month_bytes bigint;
  v_cap bigint;
  v_ingress_cap bigint;
  v_sealed_until timestamptz;
  v_live integer;
  v_taken integer;
  c_max_upload_bytes constant bigint := 10::bigint * 1024 * 1024 * 1024; -- 10 GiB (mirrors MAX_UPLOAD_BYTES)
  -- ★ THE CAMERA (20261002200000): its video's two bounds and the ceiling's multiple, each mirroring its one home
  -- under a parity test (src/lib/media/limits.ts, src/lib/disposable/roll.ts). The roll's size is the event's.
  c_camera_video_bytes constant bigint := 128::bigint * 1024 * 1024; -- mirrors CAMERA_VIDEO_MAX_BYTES
  c_camera_video_seconds constant double precision := 10.5; -- mirrors CAMERA_VIDEO_SECONDS + its grace
  c_roll_retakes constant integer := 3; -- mirrors ROLL_RETAKES
begin
  select * into v_guest from public.guests where session_token = p_session_token;
  if not found then
    raise exception 'Invalid guest session.' using errcode = 'no_data_found';
  end if;

  select * into v_event from public.events where id = v_guest.event_id;
  if v_event.deleted_at is not null then
    raise exception 'This event no longer exists.' using errcode = 'check_violation';
  end if;
  -- ★ THE SNEAKY BLOCK (20260928120000), the belt under get_upload_context's mask: a presign issued
  -- before the block, completed after it, lands nothing. The private album's words, which
  -- mapCheckViolation (src/lib/db/mutations/guest.ts) reads ahead of every other refusal.
  if public.event_block_holds_row(v_guest) then
    raise exception 'This event is private.' using errcode = 'check_violation';
  end if;
  -- ★ THE DOOR (20260929120000), the same belt: a ticket waiting on the host adds nothing, and nor does
  -- anyone at an album that went Only me.
  if v_guest.admission = 'waiting' or (v_event.visibility = 'private' and v_event.gate is null) then
    raise exception 'This event is private.' using errcode = 'check_violation';
  end if;
  if not v_event.accepting_uploads then
    raise exception 'This event is not accepting uploads.' using errcode = 'check_violation';
  end if;

  -- THE IDENTITY GATE (2026-09-21): the switch gates every upload, so flipping it ON mid-party
  -- stops the next upload from a guest who never proved an email. ★ The wording carries two
  -- contracts: it opens with "not accepting uploads", so a caller that knows only that substring
  -- still refuses the upload, and it names "verified email", which mapCheckViolation
  -- (src/lib/db/mutations/guest.ts) tests ABOVE its general "not accepting" branch to map it to
  -- verification_required. A Vitest guard (src/lib/db/migration-guards.test.ts) pins both halves.
  if v_event.require_verified_email and v_guest.verified_at is null then
    raise exception 'This event is not accepting uploads without a verified email.' using errcode = 'check_violation';
  end if;

  if p_original_key not like 'events/' || v_event.id::text || '/%' then
    raise exception 'Object key does not belong to this event.' using errcode = 'check_violation';
  end if;
  -- QA #1: the preview key is a client-supplied R2 identifier stored verbatim and later fed to
  -- deleteR2Objects on permanent-delete. Bind it to the event exactly like original_key, or a
  -- host can plant a victim's key and destroy the victim's object from their own Trash.
  if p_preview_key is not null
     and p_preview_key not like 'events/' || v_event.id::text || '/%' then
    raise exception 'Preview key does not belong to this event.' using errcode = 'check_violation';
  end if;

  -- Universal per-upload ceiling (every tier, photo + video). Authoritative on the R2-HEAD size
  -- the complete route passes, never the client's claim (ADR-0014). The 'exceeds' wording routes
  -- to too_large in the mutation wrapper (and avoids 'limit'/'capacity', which mean cap_reached).
  if p_file_size_bytes > c_max_upload_bytes then
    raise exception 'File exceeds the 10 GB maximum.' using errcode = 'check_violation';
  end if;
  -- Host-configurable per-event cap — GUESTS ONLY (create_media_as_host is exempt). NULL = no
  -- cap. Read from the event row, never client-supplied, so a guest cannot spoof a higher cap.
  if v_event.max_upload_bytes is not null
     and p_file_size_bytes > v_event.max_upload_bytes then
    raise exception 'File exceeds the size the host allows for this event.' using errcode = 'check_violation';
  end if;

  -- QA #17: `for update` serializes concurrent cap decisions for THIS host (the profiles row is
  -- the per-host mutex). Every read below it then sees the previous writer's committed rows.
  select * into v_profile from public.profiles where id = v_event.host_id for update;
  select * into v_limits from public.tier_limits(v_profile.tier);
  v_cap := coalesce(v_profile.storage_cap_bytes, v_limits.default_storage_cap_bytes);

  -- Video is a PAID feature (Phase 2): a free host's event takes photos only, whether
  -- the guest OR the host uploads.
  if p_type = 'video' and v_profile.tier = 'free' then
    raise exception 'Video uploads are available on paid plans.' using errcode = 'check_violation';
  end if;
  -- ★ THE VIDEOS SWITCH (20260929120000): a paid host can keep an album to photos. Guests only, like
  -- the per-upload cap: create_media_as_host is the host's own write and is exempt. The advisory is
  -- get_upload_context's `video_blocked`, worded around the event by the routes.
  if p_type = 'video' and not v_event.allow_videos then
    raise exception 'Video uploads are available on paid plans.' using errcode = 'check_violation';
  end if;

  -- ★ THE CAMERA (20261002200000). A video is one shot of up to ten seconds: its length is the client's word, so its
  -- bytes are bounded too ("exceeds" and "longer than" route to too_large and too_long). Then the roll (guest_roll):
  -- her LIVE shots this period against its size, and every shot she has taken in it, removed or not, against three
  -- rolls' worth (the churn a freed frame opens). Counted AFTER the host's profiles lock above (every create_media of
  -- this album takes it first, so two completes of one guest are already serialized and each count reads the other's
  -- committed row, never both at 23) and under the roll's own advisory lock on her identity (the brief's, kept so the
  -- roll's serialization stays its own should the profiles lock ever move; taken after it, by nothing else, so it
  -- closes no cycle). Their own words (mapCheckViolation reads "roll"). The host's own uploads (create_media_as_host)
  -- are exempt from all four.
  if v_event.capture = 'camera' then
    if p_type = 'video' and p_file_size_bytes > c_camera_video_bytes then
      raise exception 'This video exceeds the 128 MB a camera shot can be.' using errcode = 'check_violation';
    end if;
    if p_type = 'video' and p_duration_seconds > c_camera_video_seconds then
      raise exception 'This video is longer than the 10 seconds a camera shot can be.' using errcode = 'check_violation';
    end if;
    perform pg_catalog.pg_advisory_xact_lock(
      pg_catalog.hashtextextended('roll:' || coalesce(v_guest.user_id, v_guest.id)::text, 0));
    select r.live, r.taken into v_live, v_taken from public.guest_roll(v_event, v_guest.id, v_guest.user_id) r;
    if v_live >= v_event.roll_size then
      raise exception 'You''ve taken all % shots on your roll.', v_event.roll_size using errcode = 'check_violation';
    end if;
    if v_taken >= v_event.roll_size * c_roll_retakes then
      raise exception 'You''ve used every retake this roll allows.' using errcode = 'check_violation';
    end if;
  end if;

  -- Monthly ingress: Free = the static 20 GB meter; paid = 3x the effective storage cap
  -- (ADR-0021). NULL = unmetered (a paid profile with no cap on record fails open).
  v_ingress_cap := public.monthly_ingress_cap(v_profile.tier, v_profile.storage_cap_bytes);
  if v_ingress_cap is not null then
    select coalesce(cumulative_bytes, 0) into v_month_bytes from public.storage_ledger
      where host_id = v_event.host_id and period = v_period;
    if coalesce(v_month_bytes, 0) + p_file_size_bytes > v_ingress_cap then
      raise exception 'Monthly upload limit reached for this plan.' using errcode = 'check_violation';
    end if;
  end if;

  if v_cap is not null then
    -- Recovery Phase 1: the cap reads ACTIVE bytes (host_active_bytes), NOT the physical
    -- storage_used_bytes — so removed/deleted media no longer counts and deleting frees room.
    if public.host_active_bytes(v_event.host_id) + p_file_size_bytes > v_cap + (v_cap / 10) then
      raise exception 'Storage capacity exceeded for this plan.' using errcode = 'check_violation';
    end if;
  end if;

  v_status := case
    when v_event.moderation_mode = 'live' then 'approved'::public.media_status
    else 'pending'::public.media_status
  end;

  -- ★ THE SEAL (20261002200000): a row added while the album's develop time is still ahead waits for it, whatever the
  -- capture and whatever the status (a held row approved later waits too). Read off the event row as this upload
  -- found it, unlocked: a host's save committing in the same instant can leave this one row on the old answer, and the
  -- album's next read heals it (develop_due).
  if v_event.develops_at > now() then
    v_sealed_until := v_event.develops_at;
  end if;

  -- THE LIVE REEL (20260924100000): reel_eligible is false only for a cut someone saves to the
  -- album, so the live reel never plays a reel. Write-once, like the dimensions.
  insert into public.media (
    id, event_id, guest_id, type, original_key, preview_key,
    file_size_bytes, duration_seconds, width, height, status, reel_eligible, sealed_until
  ) values (
    p_media_id, v_event.id, v_guest.id, p_type, p_original_key, p_preview_key,
    p_file_size_bytes, p_duration_seconds, p_width, p_height, v_status,
    coalesce(p_reel_eligible, true), v_sealed_until
  );

  -- ★ THE ROLL'S LEDGER (20261002200000): every shot taken in a camera's period, kept when the shot is removed or
  -- purged, so the ceiling above outlives the fast purge of a withdrawn shot. Her ticket's row, under the same locks.
  if v_event.capture = 'camera' then
    insert into public.camera_rolls as c (guest_id, sealed_from, taken)
    values (v_guest.id, v_event.sealed_from, 1)
    on conflict (guest_id, sealed_from) do update set taken = c.taken + 1;
  end if;

  insert into public.storage_ledger (host_id, period, cumulative_bytes, photo_count, video_count)
  values (
    v_event.host_id, v_period, p_file_size_bytes,
    case when p_type = 'photo' then 1 else 0 end,
    case when p_type = 'video' then 1 else 0 end
  )
  on conflict (host_id, period) do update set
    cumulative_bytes = public.storage_ledger.cumulative_bytes + excluded.cumulative_bytes,
    photo_count = public.storage_ledger.photo_count + excluded.photo_count,
    video_count = public.storage_ledger.video_count + excluded.video_count,
    updated_at = now();

  -- storage_used_bytes stays the PHYSICAL meter (decremented only in purge_media_rows).
  update public.profiles
    set storage_used_bytes = storage_used_bytes + p_file_size_bytes
    where id = v_event.host_id;

  return jsonb_build_object('media_id', p_media_id, 'status', v_status, 'sealed', v_sealed_until is not null);
end;
$$;

create or replace function public.create_media_as_host(
  p_host_id uuid,
  p_event_id uuid,
  p_media_id uuid,
  p_type public.media_type,
  p_original_key text,
  p_file_size_bytes bigint,
  p_preview_key text default null,
  p_duration_seconds double precision default null,
  p_width integer default null,
  p_height integer default null,
  p_reel_eligible boolean default true
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event public.events;
  v_profile public.profiles;
  v_limits record;
  v_status public.media_status := 'approved'::public.media_status; -- host = moderator
  v_period text := to_char(now(), 'YYYY-MM');
  v_month_bytes bigint;
  v_cap bigint;
  v_ingress_cap bigint;
  v_sealed_until timestamptz;
  c_max_upload_bytes constant bigint := 10::bigint * 1024 * 1024 * 1024; -- 10 GiB (mirrors MAX_UPLOAD_BYTES)
begin
  -- Ownership via the join: p_host_id is the route's getUser()-verified host id (the service-role caller
  -- has no auth.uid()). A host can only create media on an event they own; a wrong p_host_id -> not found.
  select * into v_event from public.events
    where id = p_event_id and host_id = p_host_id and deleted_at is null;
  if not found then
    raise exception 'Event not found or not owned by you.' using errcode = 'no_data_found';
  end if;

  if p_original_key not like 'events/' || v_event.id::text || '/%' then
    raise exception 'Object key does not belong to this event.' using errcode = 'check_violation';
  end if;
  -- QA #1 (host path): same client-supplied preview key, same event binding.
  if p_preview_key is not null
     and p_preview_key not like 'events/' || v_event.id::text || '/%' then
    raise exception 'Preview key does not belong to this event.' using errcode = 'check_violation';
  end if;

  -- Universal per-upload ceiling. NO per-event host cap here -- the host owns max_upload_bytes
  -- and is exempt (it bounds guest uploads only).
  if p_file_size_bytes > c_max_upload_bytes then
    raise exception 'File exceeds the 10 GB maximum.' using errcode = 'check_violation';
  end if;

  -- QA #17: the same per-host profiles-row lock as create_media (one mutex per host, one lock
  -- order everywhere).
  select * into v_profile from public.profiles where id = v_event.host_id for update;
  select * into v_limits from public.tier_limits(v_profile.tier);
  v_cap := coalesce(v_profile.storage_cap_bytes, v_limits.default_storage_cap_bytes);

  if p_type = 'video' and v_profile.tier = 'free' then
    raise exception 'Video uploads are available on paid plans.' using errcode = 'check_violation';
  end if;

  -- Monthly ingress: Free = the static 20 GB meter; paid = 3x the effective storage cap
  -- (ADR-0021). NULL = unmetered (a paid profile with no cap on record fails open).
  v_ingress_cap := public.monthly_ingress_cap(v_profile.tier, v_profile.storage_cap_bytes);
  if v_ingress_cap is not null then
    select coalesce(cumulative_bytes, 0) into v_month_bytes from public.storage_ledger
      where host_id = v_event.host_id and period = v_period;
    if coalesce(v_month_bytes, 0) + p_file_size_bytes > v_ingress_cap then
      raise exception 'Monthly upload limit reached for this plan.' using errcode = 'check_violation';
    end if;
  end if;

  if v_cap is not null then
    if public.host_active_bytes(v_event.host_id) + p_file_size_bytes > v_cap + (v_cap / 10) then
      raise exception 'Storage capacity exceeded for this plan.' using errcode = 'check_violation';
    end if;
  end if;

  -- ★ THE SEAL (20261002200000): the host's own upload waits with everyone's for the album's develop time, so the
  -- album develops whole. Exempt from the roll, its ceiling and the camera video's bounds: it is her album.
  if v_event.develops_at > now() then
    v_sealed_until := v_event.develops_at;
  end if;

  -- THE LIVE REEL (20260924100000): reel_eligible is false only for a cut the host saves to the
  -- album, so the live reel never plays a reel. Write-once, like the dimensions.
  insert into public.media (
    id, event_id, guest_id, type, original_key, preview_key,
    file_size_bytes, duration_seconds, width, height, status, reel_eligible, sealed_until
  ) values (
    p_media_id, v_event.id, null, p_type, p_original_key, p_preview_key,
    p_file_size_bytes, p_duration_seconds, p_width, p_height, v_status,
    coalesce(p_reel_eligible, true), v_sealed_until
  );

  insert into public.storage_ledger (host_id, period, cumulative_bytes, photo_count, video_count)
  values (
    v_event.host_id, v_period, p_file_size_bytes,
    case when p_type = 'photo' then 1 else 0 end,
    case when p_type = 'video' then 1 else 0 end
  )
  on conflict (host_id, period) do update set
    cumulative_bytes = public.storage_ledger.cumulative_bytes + excluded.cumulative_bytes,
    photo_count = public.storage_ledger.photo_count + excluded.photo_count,
    video_count = public.storage_ledger.video_count + excluded.video_count,
    updated_at = now();

  update public.profiles
    set storage_used_bytes = storage_used_bytes + p_file_size_bytes
    where id = v_event.host_id;

  return jsonb_build_object('media_id', p_media_id, 'status', v_status, 'sealed', v_sealed_until is not null);
end;
$$;

-- =============================================================================================
-- 6. The upload reads answer the capture and the roll.
-- =============================================================================================
create or replace function public.get_upload_context(p_session_token text, p_type public.media_type)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_guest public.guests;
  v_event public.events;
  v_profile public.profiles;
  v_limits record;
  v_period text := to_char(now(), 'YYYY-MM');
  v_month_bytes bigint;
  v_cap bigint;
  v_ingress_cap bigint;
  v_at_storage_cap boolean := false;
  v_at_monthly_cap boolean := false;
  v_live integer;
  v_taken integer;
  c_max_upload_bytes constant bigint := 10::bigint * 1024 * 1024 * 1024; -- 10 GiB (mirrors MAX_UPLOAD_BYTES)
  c_roll_retakes constant integer := 3; -- mirrors ROLL_RETAKES (src/lib/disposable/roll.ts)
begin
  select * into v_guest from public.guests where session_token = p_session_token;
  if not found then
    return null;
  end if;

  select * into v_event from public.events where id = v_guest.event_id;
  if v_event.deleted_at is not null then
    return jsonb_build_object(
      'event_id', v_event.id,
      'accepting_uploads', false,
      'event_deleted', true
    );
  end if;

  -- ★ THE DOOR (20260929120000), AS THIS TICKET SEES IT: waiting reads private; past a gate or the
  -- password reads open; Only me (private, no gate) stays private. Only this local copy moves.
  if v_guest.admission = 'waiting' then
    v_event.visibility := 'private';
  elsif v_event.gate is not null or v_event.visibility = 'password' then
    v_event.visibility := 'open';
  end if;

  -- ★ THE SNEAKY BLOCK (20260928120000): a ticket this event blocked (its row, the account holding it,
  -- or the address it proved) reads the event as PRIVATE, so presign and complete refuse it exactly as
  -- they refuse a private album, in the same words ("This event is private."). Only the local copy is
  -- masked, never the row. Asked after the door, so it wins over every door.
  if public.event_block_holds_row(v_guest) then
    v_event.visibility := 'private';
  end if;

  select * into v_profile from public.profiles where id = v_event.host_id;
  select * into v_limits from public.tier_limits(v_profile.tier);

  -- Already over the monthly ingress meter? (Free static / paid derived — ADR-0021.)
  v_ingress_cap := public.monthly_ingress_cap(v_profile.tier, v_profile.storage_cap_bytes);
  if v_ingress_cap is not null then
    select coalesce(cumulative_bytes, 0) into v_month_bytes from public.storage_ledger
      where host_id = v_event.host_id and period = v_period;
    v_at_monthly_cap := coalesce(v_month_bytes, 0) >= v_ingress_cap;
  end if;

  v_cap := coalesce(v_profile.storage_cap_bytes, v_limits.default_storage_cap_bytes);
  if v_cap is not null then
    -- Active bytes, not physical (recovery Phase 1) — mirrors create_media's authoritative check.
    v_at_storage_cap := public.host_active_bytes(v_event.host_id) >= v_cap + (v_cap / 10);
  end if;

  -- Advisory: a free event can't take video, nor one whose host switched videos off (authoritative
  -- gate is in create_media). The per-upload ceiling is the host cap clamped to the universal 10 GiB
  -- (never remaining bytes). QA #18: `visibility` lets the guest routes re-check the lock per request.
  -- The identity reshape: `require_verified_email` + `guest_verified` let them re-check the identity
  -- gate the same way (create_media stays authoritative for both).
  -- ★ THE CAMERA (20261002200000): `capture`, and this ticket's own `roll` ({used, cap, taken, ceiling}; NULL for free
  -- uploads), so the presign refuses the shot past either bound before its bytes move (create_media stays
  -- authoritative). Her own counts, to her own token.
  if v_event.capture = 'camera' then
    select r.live, r.taken into v_live, v_taken from public.guest_roll(v_event, v_guest.id, v_guest.user_id) r;
  end if;
  return jsonb_build_object(
    'event_id', v_event.id,
    'accepting_uploads', v_event.accepting_uploads,
    'event_deleted', false,
    'visibility', v_event.visibility,
    'require_verified_email', v_event.require_verified_email,
    'guest_verified', (v_guest.verified_at is not null),
    'at_storage_cap', v_at_storage_cap,
    'at_monthly_cap', v_at_monthly_cap,
    'video_blocked', (p_type = 'video' and (v_profile.tier = 'free' or not v_event.allow_videos)),
    'max_upload_bytes', least(c_max_upload_bytes, coalesce(v_event.max_upload_bytes, c_max_upload_bytes)),
    'capture', v_event.capture,
    'roll', case when v_event.capture = 'camera' then jsonb_build_object(
      'used', v_live, 'cap', v_event.roll_size,
      'taken', v_taken, 'ceiling', v_event.roll_size * c_roll_retakes) end
  );
end;
$$;

create or replace function public.get_upload_gate(
  p_event_id uuid,
  p_session_token text default null,
  p_user_id uuid default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_event public.events;
  v_profile public.profiles;
  v_limits record;
  v_period text := to_char(now(), 'YYYY-MM');
  v_month_bytes bigint;
  v_cap bigint;
  v_ingress_cap bigint;
  v_contributed boolean := false;
  v_at_storage_cap boolean := false;
  v_at_monthly_cap boolean := false;
  v_ticket uuid;
  v_live integer;
  v_taken integer;
  c_roll_retakes constant integer := 3; -- mirrors ROLL_RETAKES (src/lib/disposable/roll.ts)
begin
  select * into v_event from public.events where id = p_event_id and deleted_at is null;
  if not found then
    return jsonb_build_object('contributed', false, 'album_full', false, 'event_gone', true);
  end if;

  select exists (
    select 1
      from public.media m
      join public.guests g on g.id = m.guest_id
     where g.event_id = p_event_id
       and m.event_id = p_event_id
       and (
         (p_session_token is not null and length(p_session_token) >= 16
            and g.session_token = p_session_token and g.user_id is null)
         or (p_user_id is not null and g.user_id = p_user_id)
       )
       -- ★ OWN DELETES CLOSE IT (Will, 2026-09-22), the one change to this body. Pending, approved,
       -- hidden and a removal by anyone else all still count; only the guest's own removal does not.
       and not (m.status = 'removed' and m.removed_by_uploader)
  ) into v_contributed;

  if not v_contributed and v_event.accepting_uploads then
    select * into v_profile from public.profiles where id = v_event.host_id;
    select * into v_limits from public.tier_limits(v_profile.tier);

    v_ingress_cap := public.monthly_ingress_cap(v_profile.tier, v_profile.storage_cap_bytes);
    if v_ingress_cap is not null then
      select coalesce(cumulative_bytes, 0) into v_month_bytes from public.storage_ledger
        where host_id = v_event.host_id and period = v_period;
      v_at_monthly_cap := coalesce(v_month_bytes, 0) >= v_ingress_cap;
    end if;

    v_cap := coalesce(v_profile.storage_cap_bytes, v_limits.default_storage_cap_bytes);
    if v_cap is not null then
      v_at_storage_cap := public.host_active_bytes(v_event.host_id) >= v_cap + (v_cap / 10);
    end if;
  end if;

  -- ★ THE CAMERA (20261002200000): the viewer's roll, {used, cap, taken, ceiling}, by the same identities the
  -- contribution reads (the unclaimed ticket's row, the account's rows here). NULL for free uploads.
  if v_event.capture = 'camera' then
    if p_session_token is not null and length(p_session_token) >= 16 then
      select g.id into v_ticket
        from public.guests g
       where g.event_id = p_event_id and g.session_token = p_session_token and g.user_id is null;
    end if;
    select r.live, r.taken into v_live, v_taken from public.guest_roll(v_event, v_ticket, p_user_id) r;
  end if;

  return jsonb_build_object(
    'contributed', v_contributed,
    'album_full', (v_at_storage_cap or v_at_monthly_cap),
    'event_gone', false,
    'roll', case when v_event.capture = 'camera' then jsonb_build_object(
      'used', v_live, 'cap', v_event.roll_size,
      'taken', v_taken, 'ceiling', v_event.roll_size * c_roll_retakes) end
  );
end;
$$;

-- =============================================================================================
-- 7. The album's read: whether a develop is due, the develop time, the capture and the roll's size.
-- =============================================================================================
-- Carried from 20261001233000 verbatim but for four columns LAST: `develop_due` (`seal_disagrees`, two index probes:
-- true while a sealed row disagrees with the event, a develop time passed or a straggler, the app's cue to run
-- develop_due before it reads the album), then `develops_at`, `capture` and `roll_size` (presentation settings,
-- unredacted like the switches beside them: the waiting room says when it develops, and the camera its roll). A
-- RETURNS TABLE grows, so DROP + CREATE, and the whole ACL is restated (database-security.md).
drop function public.get_event_by_qr_token(text);
create function public.get_event_by_qr_token(p_qr_token text)
 returns table(
    id uuid, name text, description text, moderation_mode public.moderation_mode,
    visibility public.event_visibility, has_password boolean, accepting_uploads boolean,
    require_verified_email boolean, require_upload_to_view boolean,
    event_date date, qr_style text, qr_token text, custom_slug text, host_display_name text,
    show_reel boolean, reel_style_id text, reel_hold_sec numeric, accepts_video boolean,
    max_upload_bytes bigint, develop_due boolean, develops_at timestamptz, capture text, roll_size integer)
  language sql
  stable security definer
  set search_path to ''
as $function$
  select e.id,
         case when r.hide_name then null else e.name end,
         case when r.hide_meta then null else e.description end,
         e.moderation_mode, v.visibility,
         (e.event_password_hash is not null),
         e.accepting_uploads, e.require_verified_email, e.require_upload_to_view,
         case when r.hide_meta then null else e.event_date end,
         e.qr_style,
         e.qr_token,
         case when r.hide_meta then null else e.custom_slug end,
         case when r.hide_meta then null else p.display_name end,
         e.show_reel, e.reel_style_id, e.reel_hold_sec,
         (e.allow_videos and coalesce(p.tier <> 'free', false)),
         e.max_upload_bytes,
         public.seal_disagrees(e),
         e.develops_at,
         e.capture,
         e.roll_size
  from public.events e
  left join public.profiles p on p.id = e.host_id
  -- ★ THE SNEAKY BLOCK (20260928120000): the event AS THIS CALLER SEES IT. To an account (or the
  -- address it confirmed) this event blocked, it is private, and everything below reads that: the
  -- private album's redaction, and the private branch of every caller, in the same words and the same
  -- time as a private album, because it is one query whoever asks. The host is never blocked from
  -- their own event, and a signed-out caller has no account to hold.
  cross join lateral (
    select case
             when e.host_id is distinct from (select auth.uid())
              and public.event_block_holds_account(e.id, (select auth.uid()))
             then 'private'::public.event_visibility
             else e.visibility
           end as visibility
  ) v
  cross join lateral (
    select
      (v.visibility <> 'open'
        and e.host_id is distinct from (select auth.uid())) as hide_meta,
      (v.visibility  = 'private'
        and e.host_id is distinct from (select auth.uid())) as hide_name
  ) r
  where e.deleted_at is null
    and (e.qr_token = p_qr_token
         or (e.custom_slug is not null and lower(e.custom_slug) = lower(p_qr_token)))
  order by (e.qr_token = p_qr_token) desc
  limit 1;
$function$;


-- =============================================================================================
-- 8. Every other SQL home a guest's view can reach, with the one predicate.
-- =============================================================================================

-- The open album, read whole by the guest export (`loadGalleryRowsForAccess`): 20260924100000's body with the one
-- predicate beside its gates (the event still resolved first, so the index walks in display order; the host's
-- exemption asked of the row's own event). The guest export calls it with no session, so it reads as a guest whoever
-- holds the page. Dropped and created as its row cap's shape was, so the ACL is restated below.
drop function public.get_event_media_by_qr_token(text, timestamptz, uuid, integer);
create function public.get_event_media_by_qr_token(
  p_qr_token text,
  p_before_created_at timestamptz default null,
  p_before_id uuid default null,
  p_limit integer default null
)
returns table(
  id uuid,
  type public.media_type,
  original_key text,
  preview_key text,
  width integer,
  height integer,
  duration_seconds double precision,
  created_at timestamptz,
  reel_eligible boolean
)
language sql
stable
security definer
set search_path to ''
as $$
  select m.id, m.type, m.original_key, m.preview_key, m.width, m.height, m.duration_seconds, m.created_at,
         m.reel_eligible
  from public.media m
  where m.event_id = (
      select e.id
      from public.events e
      where e.qr_token = p_qr_token
        and e.visibility = 'open'
        and e.deleted_at is null
    )
    and m.status = 'approved'
    and (m.sealed_until is null or m.sealed_until <= now()
         or exists (select 1 from public.events e where e.id = m.event_id and e.host_id = (select auth.uid())))
    and (p_before_created_at is null
         or (m.created_at, m.id) < (p_before_created_at, p_before_id))
  order by m.created_at desc, m.id desc
  limit case when p_limit is null then null else least(p_limit, 1000) end;
$$;

-- The cards' covers: the host's own (her dashboard, exempt) and, through the service role, the profile and Guest
-- cards (no auth.uid(): a sealed shot never covers a card anyone else sees). The predicate asks the row's own event
-- for the host (an index lookup, made only for a sealed row), so each body keeps the shape it had. The host's own
-- session reads her media's seal through her column grant (above), as every INVOKER read here must.
create or replace function public.event_covers(p_event_ids uuid[])
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(
    jsonb_object_agg(
      c.event_id::text,
      jsonb_build_object('preview_key', c.preview_key, 'original_key', c.original_key)
    ),
    '{}'::jsonb
  )
  from (
    select distinct on (m.event_id) m.event_id, m.preview_key, m.original_key
    from public.media m
    where m.event_id = any(p_event_ids)
      and m.status = 'approved'
      and m.type = 'photo'
      and m.removed_at is null
      and (m.sealed_until is null or m.sealed_until <= now()
           or exists (select 1 from public.events e where e.id = m.event_id and e.host_id = (select auth.uid())))
    order by m.event_id, m.created_at desc, m.id desc
  ) c;
$$;

create or replace function public.event_stills(p_event_ids uuid[], p_per_event integer)
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
        and (m.sealed_until is null or m.sealed_until <= now() or e.host_id = (select auth.uid()))
      order by m.created_at desc, m.id desc
      limit least(greatest(p_per_event, 0), 12)
    ) newest
  ) s
  where e.id = any(p_event_ids)
    and s.preview_keys is not null;
$$;

create or replace function public.event_card_stats(p_event_ids uuid[])
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(
    jsonb_object_agg(
      ids.event_id::text,
      jsonb_build_object('approved', coalesce(c.approved, 0), 'pending', coalesce(c.pending, 0))
    ),
    '{}'::jsonb
  )
  from (
    select distinct u.event_id
    from unnest(p_event_ids) as u(event_id)
    where u.event_id is not null
  ) ids
  left join (
    select m.event_id,
           count(*) filter (where m.status = 'approved') as approved,
           count(*) filter (where m.status = 'pending') as pending
    from public.media m
    where m.event_id = any(p_event_ids)
      and m.removed_at is null
      and (m.sealed_until is null or m.sealed_until <= now()
           or exists (select 1 from public.events e where e.id = m.event_id and e.host_id = (select auth.uid())))
    group by m.event_id
  ) c on c.event_id = ids.event_id;
$$;

-- A like is only as visible as its media (database-security.md): a sealed shot is the not_found every other unseen
-- item answers, to everyone but its album's host.
create or replace function public.like_media(p_media_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'reason', 'unauthorized');
  end if;

  if not exists (
    select 1
    from public.media m
    join public.events e on e.id = m.event_id and e.deleted_at is null
    where m.id = p_media_id
      and m.status = 'approved'
      and m.removed_at is null
      and (m.sealed_until is null or m.sealed_until <= now() or e.host_id = (select auth.uid()))
      and (
        e.host_id = v_uid                 -- host of the event
        or (
          -- ★ THE SNEAKY BLOCK (20260928120000): a blocked account likes nothing here, the private
          -- album's own answer (not_found).
          not public.event_block_holds_account(e.id, v_uid)
          and (
            e.visibility = 'open'          -- any signed-in viewer of a public album
            -- ★ THE DOOR (20260929120000): a password or gated album's guest who is past its door.
            -- Only me (private, no gate) is neither, so it likes nothing but its host.
            or ((e.visibility = 'password' or e.gate is not null)
                and public.event_door_account_in(e.id, v_uid))
          )
        )
      )
  ) then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  insert into public.media_likes (media_id, user_id)
  values (p_media_id, v_uid)
  on conflict (media_id, user_id) do nothing;

  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.create_report(
  p_qr_token text,
  p_media_id uuid default null,
  p_reason text default null,
  p_kind public.report_kind default 'other',
  p_reporter_user_id uuid default null,
  p_reporter_email text default null,
  p_reporter_hash text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event public.events;
  v_media public.media;
  v_confirmed boolean := p_reporter_email is not null and p_reporter_hash is not null;
  v_hide boolean := false;
  v_report_id uuid;
begin
  select * into v_event
  from public.events
  where qr_token = p_qr_token and deleted_at is null;

  if not found then
    raise exception 'Event not found.' using errcode = 'no_data_found';
  end if;

  -- A reported item must belong to this event (no cross-event references). ★ And a sealed shot is no item a reporter
  -- has met (20261002200000): it answers as a foreign id does, so an id can never be probed through a report.
  if p_media_id is not null then
    select * into v_media from public.media m
     where m.id = p_media_id and m.event_id = v_event.id
       and (m.sealed_until is null or m.sealed_until <= now() or v_event.host_id = (select auth.uid()));
    if not found then
      raise exception 'Reported media does not belong to this event.' using errcode = 'check_violation';
    end if;
  end if;

  -- ★ THE INSTANT HIDE: a child-abuse report of an item, from a confirmed address. Its limits read this
  -- address's and this event's earlier hides, so the two are serialized first (a burst cannot all pass).
  if p_kind = 'child' and v_confirmed and p_media_id is not null then
    perform pg_catalog.pg_advisory_xact_lock(
      pg_catalog.hashtextextended('report_hide:address:' || p_reporter_hash, 0));
    perform pg_catalog.pg_advisory_xact_lock(
      pg_catalog.hashtextextended('report_hide:event:' || v_event.id::text, 0));
    v_hide :=
      -- someone still sees it: the album, or the host's own Deleted
      (v_media.status <> 'removed'
        or (not v_media.removed_by_admin and not v_media.removed_by_uploader and v_media.purge_asked_at is null))
      -- a host never triggers an operator's removal
      and p_reporter_user_id is distinct from v_event.host_id
      -- ★ an address holding three live strikes has lost the hide: the rule and both its numbers live once, in
      -- report_strikes, which the portal's queue reads too (a dismissal's Undo takes its strike back there)
      and not coalesce(
        (public.report_strikes(array[p_reporter_hash]) #>> array['addresses', p_reporter_hash, 'barred'])::boolean,
        false)
      -- at most 3 hides an address, and 5 an event, in any 24 hours
      and (select count(*) from public.reports r
            where r.reporter_hash = p_reporter_hash and r.hid_at > now() - interval '24 hours') < 3
      and (select count(*) from public.reports r
            where r.event_id = v_event.id and r.hid_at > now() - interval '24 hours') < 5;
  end if;

  insert into public.reports (
    event_id, media_id, reason, kind, reporter_signed_in, reporter_email, reporter_hash, hid_at
  )
  values (
    v_event.id,
    p_media_id,
    nullif(trim(coalesce(p_reason, '')), ''),
    p_kind,
    p_reporter_user_id is not null,
    case when v_confirmed then lower(trim(p_reporter_email)) end,
    case when v_confirmed and p_kind = 'child' then p_reporter_hash end,
    case when v_hide then now() end
  )
  returning id into v_report_id;

  if v_hide then
    -- As a takedown would (removalUpdate, adoptionUpdate): up, it leaves the album with this instant as its
    -- removed_at (= the report's hid_at); already in her Deleted, it becomes the operator's there.
    update public.media
       set status = 'removed', removed_at = now(), removed_by_admin = true
     where id = p_media_id and status <> 'removed';
    update public.media
       set removed_by_admin = true
     where id = p_media_id
       and status = 'removed'
       and not removed_by_admin
       and not removed_by_uploader
       and purge_asked_at is null;
  end if;

  return jsonb_build_object('report_id', v_report_id, 'hid', v_hide, 'event_id', v_event.id);
end;
$$;

-- The public profile's attended arm (and the private count that mirrors it word for word): an approved upload of the
-- owner's on a PROVED row, and now one a viewer may see, so a guest of a sealed album attends it publicly at develop.
create or replace function public.get_public_profile(p_slug text) returns jsonb
  language sql
  stable
  security definer
  set search_path = ''
as $$
  with page as (
    select p.id,
      jsonb_build_object(
        'id', p.id,
        'slug', p.slug,
        'display_name', p.display_name,
        'bio', p.bio,
        'avatar_updated_at', p.avatar_updated_at,
        'created_at', p.created_at,
        'hosted_events', coalesce((
          select jsonb_agg(jsonb_build_object(
                   'id', e.id,
                   'name', e.name,
                   'event_date', e.event_date,
                   -- ★ THE SNEAKY BLOCK (20260928120000): to a viewer this event blocked, the host's
                   -- own card reads private (no cover, the Private label), as the album does.
                   'visibility', case
                                   when e.host_id is distinct from (select auth.uid())
                                    and public.event_block_holds_account(e.id, (select auth.uid()))
                                   then 'private'::public.event_visibility
                                   else e.visibility
                                 end,
                   'qr_token', e.qr_token,
                   'custom_slug', e.custom_slug
                 ) order by e.event_date desc nulls last, e.created_at desc)
          from public.events e
          where e.host_id = p.id
            and e.display_in_profile
            and e.deleted_at is null
        ), '[]'::jsonb),
        'attended_events', coalesce((
          select jsonb_agg(jsonb_build_object(
                   'id', e.id,
                   'name', e.name,
                   'event_date', e.event_date
                 ) order by e.event_date desc nulls last, e.created_at desc)
          from public.events e
          where e.deleted_at is null
            -- ★ THE GUEST LIST IS ALWAYS ON (Will, event-safety `room=always`, 2026-09-28): the host's
            -- `show_guest_list` key is retired, so the line follows the album and the owner's choice.
            -- open-only: gated (password/private) events never leak name/date or
            -- attendance to anonymous profile viewers.
            and e.visibility = 'open'
            -- ★ THE ALBUM'S OWN GATE, which carries QA #36 (never disclose membership the album itself
            -- withholds from the same viewer). On a Require-verified-emails event the album admits only
            -- its host (owner -> full) or a viewer whose email is CONFIRMED; everyone else stands at the
            -- teaser, which never renders the Guests list, so they learn nothing of it here either. An
            -- anonymous viewer has no uid, so neither arm can pass for them: the gate implies the old
            -- "a signed-in viewer" clause, which left with the legacy flag it was written on (the
            -- identity contract, 2026-09-23).
            -- The EXISTS names no event column, so it is planned once per call, not once per event.
            and (
              not e.require_verified_email
              or e.host_id = (select auth.uid())
              or exists (
                select 1
                  from auth.users u
                 where u.id = (select auth.uid())
                   and u.email_confirmed_at is not null
              )
            )
            -- ★ AND THE ALBUM'S UPLOAD DOOR (guest by upload, 2026-09-23; Will's "Follow the album"). On
            -- a Require-an-upload-to-view event whose uploads are open, the album holds every viewer at
            -- the teaser until an upload of theirs counts, so this line shows only to the host and to a
            -- signed-in viewer whose own guest row at this event carries an upload they did not remove
            -- themselves (get_upload_gate's rule). Uploads closed means the album's gate fails open, and
            -- so does this clause. An anonymous viewer has no `auth.uid()`, so the EXISTS finds nothing
            -- and the line stays hidden.
            and (
              not e.require_upload_to_view
              or not e.accepting_uploads
              or e.host_id = (select auth.uid())
              or exists (
                select 1
                  from public.guests vg
                  join public.media vm on vm.guest_id = vg.id
                 where vg.event_id = e.id
                   and vm.event_id = e.id
                   and vg.user_id = (select auth.uid())
                   and not (vm.status = 'removed' and vm.removed_by_uploader)
              )
            )
            -- ★ THE SNEAKY BLOCK (20260928120000), both ways: a person the event blocked is on no list
            -- of it (their line goes, even with a photograph the host restored), and a viewer it blocked
            -- is withheld the album, so the reverse surface withholds its membership too (QA #36).
            and not public.event_block_holds_account(e.id, p.id)
            and (e.host_id = (select auth.uid())
                 or not public.event_block_holds_account(e.id, (select auth.uid())))
            and e.host_id <> p.id
            and exists (
              select 1
              from public.guests g
              join public.media m on m.guest_id = g.id and m.status = 'approved'
              where g.event_id = e.id and g.user_id = p.id
                -- THE BELT (2026-09-22): only a PROVED identity attends in public. A row at level 1
                -- (a typed name) or level 2 (a typed, unproved address) never appears here, so an
                -- impersonator's uploads can never be published under someone's profile.
                and g.verified_at is not null
                -- ★ A SEALED SHOT ATTENDS NOTHING YET (20261002200000): a guest of an album waiting on its develop
                -- joins its lists at develop, not before (the one predicate; the host of the event exempt).
                and (m.sealed_until is null or m.sealed_until <= now() or e.host_id = (select auth.uid()))
            )
            -- NOTHING UNTIL CHOSEN (2026-09-22): the line appears only once its owner has put the event
            -- in their opt-in set. A choice survives the guest's last removal: the approved upload
            -- above hides the line meanwhile, and a later upload shows it again unasked.
            and exists (
              select 1 from public.profile_shown_events s
              where s.user_id = p.id and s.event_id = e.id
            )
        ), '[]'::jsonb)
      ) as payload
    from public.profiles p
    where p.slug is not null
      and p.slug = lower(trim(p_slug))
  )
  select p.payload || jsonb_build_object(
    'private_event_count',
    case
      -- The page shows nothing: no hosted card and no attended line for this viewer.
      when (p.payload -> 'hosted_events') = '[]'::jsonb
       and (p.payload -> 'attended_events') = '[]'::jsonb
      then (
        -- The attended arm's predicate, word for word, with only the owner's choice inverted.
        select count(*)
          from public.events e
          where e.deleted_at is null
            and e.visibility = 'open'
            and (
              not e.require_verified_email
              or e.host_id = (select auth.uid())
              or exists (
                select 1
                  from auth.users u
                 where u.id = (select auth.uid())
                   and u.email_confirmed_at is not null
              )
            )
            and (
              not e.require_upload_to_view
              or not e.accepting_uploads
              or e.host_id = (select auth.uid())
              or exists (
                select 1
                  from public.guests vg
                  join public.media vm on vm.guest_id = vg.id
                 where vg.event_id = e.id
                   and vm.event_id = e.id
                   and vg.user_id = (select auth.uid())
                   and not (vm.status = 'removed' and vm.removed_by_uploader)
              )
            )
            and not public.event_block_holds_account(e.id, p.id)
            and (e.host_id = (select auth.uid())
                 or not public.event_block_holds_account(e.id, (select auth.uid())))
            and e.host_id <> p.id
            and exists (
              select 1
              from public.guests g
              join public.media m on m.guest_id = g.id and m.status = 'approved'
              where g.event_id = e.id and g.user_id = p.id
                and g.verified_at is not null
                -- ★ A SEALED SHOT ATTENDS NOTHING YET (20261002200000): a guest of an album waiting on its develop
                -- joins its lists at develop, not before (the one predicate; the host of the event exempt).
                and (m.sealed_until is null or m.sealed_until <= now() or e.host_id = (select auth.uid()))
            )
            and not exists (
              select 1 from public.profile_shown_events s
              where s.user_id = p.id and s.event_id = e.id
            )
      )
    end
  )
  from page p;
$$;

-- =============================================================================================
-- 9. Grants. The new functions: develop_due and its sweep the service role's alone; the five helpers the owner's
-- alone (only definer bodies call them, so no role PostgREST serves can, the service role included); the event's two
-- trigger functions, like every trigger function, revoked from the client roles (they still fire). The redefined
-- bodies keep their ACLs (CREATE OR REPLACE), restated here as each one's own file states them; get_event_by_qr_token
-- was dropped and created, so its whole ACL is restated: PUBLIC revoked by name, the three roles that call it.
-- =============================================================================================
revoke all on function public.album_bits(public.media_status, boolean, public.media_status, boolean)
  from public, anon, authenticated, service_role;
revoke all on function public.album_doorbell(uuid) from public, anon, authenticated, service_role;
revoke all on function public.guest_roll(public.events, uuid, uuid) from public, anon, authenticated, service_role;
revoke all on function public.seal_disagrees(public.events) from public, anon, authenticated, service_role;
revoke all on function public.develop_rows(public.events, boolean) from public, anon, authenticated, service_role;
revoke all on function public.events_reveal_stamp() from public, anon, authenticated;
revoke all on function public.events_develops_rewrite() from public, anon, authenticated;
revoke all on function public.develop_due(uuid) from public, anon, authenticated;
grant execute on function public.develop_due(uuid) to service_role;
revoke all on function public.develop_due_sweep(integer) from public, anon, authenticated;
grant execute on function public.develop_due_sweep(integer) to service_role;

revoke execute on function public.set_media_purge_at() from public, anon, authenticated;
revoke all on function public.album_note_media() from public, anon, authenticated;
revoke all on function public.album_stamp_media() from public, anon, authenticated;
revoke execute on function public.notify_gallery_change() from public, anon, authenticated;
revoke all on function public.album_changes_since(uuid, text, bigint, integer) from public, anon, authenticated;
grant execute on function public.album_changes_since(uuid, text, bigint, integer) to service_role;
revoke execute on function public.create_media(text, uuid, public.media_type, text, bigint, text, double precision, integer, integer, boolean) from public, anon, authenticated;
grant execute on function public.create_media(text, uuid, public.media_type, text, bigint, text, double precision, integer, integer, boolean) to service_role;
revoke execute on function public.create_media_as_host(uuid, uuid, uuid, public.media_type, text, bigint, text, double precision, integer, integer, boolean) from public, anon, authenticated;
grant execute on function public.create_media_as_host(uuid, uuid, uuid, public.media_type, text, bigint, text, double precision, integer, integer, boolean) to service_role;
grant execute on function public.get_upload_context(text, public.media_type) to anon, authenticated;
revoke all on function public.get_upload_gate(uuid, text, uuid) from public, anon, authenticated;
grant execute on function public.get_upload_gate(uuid, text, uuid) to service_role;
revoke all on function public.get_event_by_qr_token(text) from public;
grant execute on function public.get_event_by_qr_token(text) to anon, authenticated, service_role;
revoke all on function public.get_event_media_by_qr_token(text, timestamptz, uuid, integer) from public;
grant execute on function public.get_event_media_by_qr_token(text, timestamptz, uuid, integer) to anon, authenticated;
grant execute on function public.get_event_media_by_qr_token(text, timestamptz, uuid, integer) to service_role;
revoke all on function public.event_covers(uuid[]) from public, anon, authenticated;
grant execute on function public.event_covers(uuid[]) to authenticated, service_role;
revoke all on function public.event_stills(uuid[], integer) from public, anon, authenticated;
grant execute on function public.event_stills(uuid[], integer) to authenticated;
revoke all on function public.event_card_stats(uuid[]) from public, anon, authenticated;
grant execute on function public.event_card_stats(uuid[]) to authenticated;
revoke all on function public.like_media(uuid) from public, anon;
grant execute on function public.like_media(uuid) to authenticated;
revoke all on function public.create_report(text, uuid, text, public.report_kind, uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.create_report(text, uuid, text, public.report_kind, uuid, text, text)
  to service_role;
revoke execute on function public.get_public_profile(text) from public;
grant execute on function public.get_public_profile(text) to anon, authenticated;

-- =============================================================================================
-- THE ROLLED-BACK CHECK. Proved before applying, each run ONE execute_sql call of `begin;`, the block below and
-- `rollback;` (GREEN: this file's statements between `begin;` and the block), and on the local stand-in
-- (PostgreSQL 17, every migration replayed over a Supabase stub, the red one without this file). Fixtures: a Pro
-- host, an open event, two anonymous tickets and a confirmed guest's ticket; each step traps its own failure into
-- `proof`, and the last statement reads it.
--
-- -- THE FOUNDATION'S CHECK (the develop and the camera's roll): fresh fixtures (a Pro host, an open event, two anonymous
-- -- tickets and a confirmed guest's ticket), then every new or changed body exercised the way its real callers call it.
-- -- Each step traps its own failure into `proof`; the caller owns the transaction (locally and live alike it is rolled
-- -- back), and `set constraints all immediate` makes each statement one flush, so the album's versions are read
-- -- mid-transaction. `now()` is one instant for the whole transaction, so a shot is moved back in time by hand where a
-- -- later transaction would have taken it, a due shot is one whose sealed_until is set into the past by hand, and a
-- -- period's stamp is told from an older one by writing the older one first (as the owner, past the trigger).
-- set constraints all immediate;
-- create temp table proof (n serial, step text, ok boolean, detail text) on commit drop;
-- create temp table fx (k text primary key, id uuid, token text) on commit drop;
--
-- do $$
-- declare
--   v_host uuid := 'd15b0000-0000-4000-8000-000000000001';
--   v_g1 uuid := 'd15b0000-0000-4000-8000-000000000002';
--   v_event uuid := 'd15b0000-0000-4000-8000-0000000000e1';
-- begin
--   insert into auth.users (id, email, email_confirmed_at) values
--     (v_host, 'dispo-host@check.invalid', now()),
--     (v_g1, 'dispo-g1@check.invalid', now());
--   update public.profiles set tier = 'pro', display_name = 'Check Host' where id = v_host;
--   update public.profiles set display_name = 'Guest One', slug = 'dispo-check-g1' where id = v_g1;
--   insert into public.events (id, host_id, name, visibility, require_verified_email, accepting_uploads, moderation_mode)
--   values (v_event, v_host, 'Develop check', 'open', false, true, 'live');
--   insert into fx values ('host', v_host, null), ('g1', v_g1, null);
--   insert into fx select 'event', e.id, e.qr_token from public.events e where e.id = v_event;
--   insert into public.guests (id, event_id, session_token, display_name)
--   values ('d15b0000-0000-4000-8000-0000000000a1', v_event, repeat('a1', 32), 'Anon Guest');
--   insert into public.guests (id, event_id, session_token, user_id, display_name, verified_at, email)
--   values ('d15b0000-0000-4000-8000-0000000000a2', v_event, repeat('a2', 32), v_g1, 'Guest One', now(), 'dispo-g1@check.invalid');
--   insert into public.guests (id, event_id, session_token, display_name)
--   values ('d15b0000-0000-4000-8000-0000000000a3', v_event, repeat('a3', 32), 'Another Guest');
--   insert into fx values ('t1', 'd15b0000-0000-4000-8000-0000000000a1', repeat('a1', 32)),
--                         ('t2', 'd15b0000-0000-4000-8000-0000000000a2', repeat('a2', 32)),
--                         ('t3', 'd15b0000-0000-4000-8000-0000000000a3', repeat('a3', 32));
--   -- G1 chose to show the event on her page (the attended arm's own opt-in).
--   insert into public.profile_shown_events (user_id, event_id) values (v_g1, v_event);
-- end $$;
--
-- -- One guest upload through create_media, as the complete route calls it.
-- create function pg_temp.shot(p_token text, p_type public.media_type default 'photo',
--                              p_bytes bigint default 1000, p_dur double precision default null)
-- returns jsonb language plpgsql as $$
-- declare v_event uuid; v_id uuid := gen_random_uuid();
-- begin
--   select g.event_id into v_event from public.guests g where g.session_token = p_token;
--   return public.create_media(p_token, v_id, p_type,
--     'events/' || v_event || '/' || p_type || '/' || v_id || '/original.jpg', p_bytes,
--     null, p_dur, 100, 100, true);
-- end $$;
--
-- -- A refused upload's words, or NULL when it landed.
-- create function pg_temp.refusal(p_token text) returns text language plpgsql as $$
-- begin
--   perform pg_temp.shot(p_token);
--   return null;
-- exception when check_violation then
--   return sqlerrm;
-- end $$;
--
-- -- One host upload through create_media_as_host, as the host's complete route calls it.
-- create function pg_temp.host_shot() returns jsonb language plpgsql as $$
-- declare v_event uuid; v_host uuid; v_id uuid := gen_random_uuid();
-- begin
--   select id into v_event from fx where k = 'event';
--   select id into v_host from fx where k = 'host';
--   return public.create_media_as_host(v_host, v_event, v_id, 'photo',
--     'events/' || v_event || '/photo/' || v_id || '/original.jpg', 1000, null, null, 100, 100, true);
-- end $$;
--
-- -- The doorbell's pings for the check's event: the stand-in's log locally, Realtime's own messages live.
-- create function pg_temp.pings() returns bigint language plpgsql as $$
-- declare v_qr text; v_n bigint;
-- begin
--   select token into v_qr from fx where k = 'event';
--   begin
--     execute 'select count(*) from realtime.pings where topic = $1' into v_n using 'gallery:' || v_qr;
--   exception when undefined_table then
--     execute 'select count(*) from realtime.messages where topic = $1' into v_n using 'gallery:' || v_qr;
--   end;
--   return v_n;
-- end $$;
--
-- -- A new transaction, as far as the album's versions can tell: its notes are transaction-local settings, so clearing
-- -- them lets the next write bump each event again (as the next request's own transaction would).
-- create function pg_temp.new_tx() returns void language sql as $$
--   select pg_catalog.set_config(k, '', true)
--     from unnest(array['partyreel.album_h', 'partyreel.album_a', 'partyreel.album_t',
--                       'partyreel.album_fh', 'partyreel.album_fa', 'partyreel.album_ft']) k;
-- $$;
--
-- -- The guest album's read, as the sync route (service role) calls it.
-- create function pg_temp.album(p_after bigint default 0) returns jsonb language sql as $$
--   select public.album_changes_since((select id from fx where k = 'event'), 'album', p_after, null);
-- $$;
--
-- -- A ticket's roll, as the presign reads it.
-- create function pg_temp.roll(p_token text) returns jsonb language sql as $$
--   select public.get_upload_context(p_token, 'photo') -> 'roll';
-- $$;
--
-- -- ── 0. the schema: the columns, the CHECKs, the index, the ledger, the column grants ──
-- do $$
-- declare bad text := '';
-- begin
--   if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'events'
--                   and column_name = 'capture' and data_type = 'text' and is_nullable = 'NO' and column_default = '''upload''::text') then bad := bad || ' capture'; end if;
--   if exists (select 1 from pg_type where typname = 'event_mode') then bad := bad || ' an-enum'; end if;
--   if not has_column_privilege('authenticated', 'public.events', 'capture', 'update') or not has_column_privilege('authenticated', 'public.events', 'capture', 'insert')
--      or not has_column_privilege('authenticated', 'public.events', 'roll_size', 'update') or not has_column_privilege('authenticated', 'public.events', 'roll_size', 'insert')
--      or not has_column_privilege('authenticated', 'public.events', 'develops_at', 'update') or not has_column_privilege('authenticated', 'public.events', 'develops_at', 'insert') then bad := bad || ' event-writes'; end if;
--   if has_column_privilege('authenticated', 'public.events', 'sealed_from', 'update') or has_column_privilege('authenticated', 'public.events', 'sealed_from', 'insert') then bad := bad || ' sealed_from-writable'; end if;
--   if not has_column_privilege('authenticated', 'public.media', 'sealed_until', 'select') then bad := bad || ' sealed-unreadable'; end if;
--   if has_column_privilege('authenticated', 'public.media', 'sealed_until', 'update') or has_column_privilege('anon', 'public.media', 'sealed_until', 'select') then bad := bad || ' sealed-writable'; end if;
--   if (select count(*) from information_schema.columns c where c.table_schema = 'public' and c.table_name = 'events'
--         and has_column_privilege('authenticated', 'public.events', c.column_name, 'update')) <> 19 then bad := bad || ' update-count'; end if;
--   if (select count(*) from information_schema.columns c where c.table_schema = 'public' and c.table_name = 'events'
--         and has_column_privilege('authenticated', 'public.events', c.column_name, 'insert')) <> 19 then bad := bad || ' insert-count'; end if;
--   if not exists (select 1 from pg_indexes where indexname = 'media_sealed_idx' and indexdef like '%WHERE (sealed_until IS NOT NULL)%') then bad := bad || ' index'; end if;
--   if not (select relrowsecurity from pg_class where oid = 'public.camera_rolls'::regclass)
--      or exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'camera_rolls') then bad := bad || ' ledger-rls'; end if;
--   if has_table_privilege('anon', 'public.camera_rolls', 'select') or has_table_privilege('authenticated', 'public.camera_rolls', 'select')
--      or has_table_privilege('authenticated', 'public.camera_rolls', 'insert') or has_table_privilege('service_role', 'public.camera_rolls', 'insert')
--      or not has_table_privilege('service_role', 'public.camera_rolls', 'select') then bad := bad || ' ledger-grants'; end if;
--   if bad <> '' then raise exception 'schema:%', bad; end if;
--   insert into proof (step, ok, detail) values ('0 the schema and its grants', true, 'capture text under a CHECK, no enum; 19/19 event writes; sealed_from and sealed_until no client''s to write; the ledger deny-all');
-- exception when others then insert into proof (step, ok, detail) values ('0 the schema and its grants', false, sqlerrm);
-- end $$;
--
-- -- ── 1. free uploads with no develop seal nothing; a develop time starts a period and seals what comes after, free
-- --       uploads too ──
-- do $$
-- declare v_event uuid; tok text; r jsonb; v_from timestamptz; v_dev timestamptz; e record;
-- begin
--   select id into v_event from fx where k = 'event';
--   select token into tok from fx where k = 't1';
--   select * into e from public.events where id = v_event;
--   if e.capture <> 'upload' or e.roll_size is not null or e.develops_at is not null or e.sealed_from is not null then raise exception 'a new event %', e; end if;
--   r := pg_temp.shot(tok);
--   if (r ->> 'sealed')::boolean then raise exception 'an album without a develop sealed a shot: %', r; end if;
--   -- shot before the develop time was set (a real save is a later transaction than the shot)
--   update public.media set created_at = now() - interval '1 hour' where id = (r ->> 'media_id')::uuid;
--   insert into fx values ('open_shot', (r ->> 'media_id')::uuid, null);
--   update public.events set develops_at = now() + interval '1 day' where id = v_event;
--   select sealed_from, develops_at into v_from, v_dev from public.events where id = v_event;
--   if v_from is distinct from now() then raise exception 'sealed_from %', v_from; end if;
--   if (select sealed_until from public.media where id = (r ->> 'media_id')::uuid) is not null then raise exception 'the develop time sealed what came before'; end if;
--   r := pg_temp.shot(tok);
--   if not (r ->> 'sealed')::boolean or (select sealed_until from public.media where id = (r ->> 'media_id')::uuid) is distinct from v_dev then
--     raise exception 'a free upload was not sealed to the develop time: %', r;
--   end if;
--   insert into fx values ('sealed_shot', (r ->> 'media_id')::uuid, null);
--   insert into proof (step, ok, detail) values ('1 no develop seals nothing; a develop time seals what comes after, free uploads too', true, 'sealed_from = now(); sealed_until = develops_at; the earlier shot open');
-- exception when others then insert into proof (step, ok, detail) values ('1 no develop seals nothing; a develop time seals what comes after, free uploads too', false, sqlerrm);
-- end $$;
--
-- -- ── 2. the guest album: a sealed shot moves album_max and rings, never rides the log, never counts; it waits ──
-- do $$
-- declare tok text; v0 jsonb; v1 jsonb; host jsonb; p0 bigint; p1 bigint; r jsonb; sealed_id uuid; ids text;
-- begin
--   select token into tok from fx where k = 't1';
--   perform pg_temp.new_tx();
--   v0 := pg_temp.album(); p0 := pg_temp.pings();
--   r := pg_temp.shot(tok);
--   sealed_id := (r ->> 'media_id')::uuid;
--   v1 := pg_temp.album((v0 ->> 'album_max')::bigint); p1 := pg_temp.pings();
--   if (v1 ->> 'album_max')::bigint is distinct from (v0 ->> 'album_max')::bigint + 1 then raise exception 'album_max % -> %', v0 ->> 'album_max', v1 ->> 'album_max'; end if;
--   if p1 <> p0 + 1 then raise exception 'pings % -> %', p0, p1; end if;
--   if jsonb_array_length(v1 -> 'changes') <> 0 then raise exception 'a sealed id rode the guest log: %', v1 -> 'changes'; end if;
--   if (v1 ->> 'approved')::bigint is distinct from (v0 ->> 'approved')::bigint then raise exception 'the count moved with a sealed shot'; end if;
--   if (v1 -> 'waiting' ->> 'count')::bigint is distinct from (v0 -> 'waiting' ->> 'count')::bigint + 1 then raise exception 'waiting count %', v1 -> 'waiting'; end if;
--   if (select sum((x ->> 1)::bigint) from jsonb_array_elements(v1 -> 'waiting' -> 'minutes') x) is distinct from (v1 -> 'waiting' ->> 'count')::bigint then
--     raise exception 'minutes do not sum to the count: %', v1 -> 'waiting';
--   end if;
--   if not exists (select 1 from jsonb_array_elements(v1 -> 'waiting' -> 'minutes') x
--                   where (x ->> 0)::bigint = (extract(epoch from date_trunc('minute', now())) * 1000)::bigint) then raise exception 'minute %', v1 -> 'waiting'; end if;
--   if v1 ? 'sealed' then raise exception 'the old key rides: %', v1 -> 'sealed'; end if;
--   -- the whole guest log, from zero: the shot before the develop only, never a sealed one
--   select string_agg(x ->> 0, ',') into ids from jsonb_array_elements(pg_temp.album(0) -> 'changes') x;
--   if ids is distinct from (select id::text from fx where k = 'open_shot') then raise exception 'the guest log from zero reads %', ids; end if;
--   -- the host's log carries it (she is exempt), and her scope answers no waiting facts
--   host := public.album_changes_since((select id from fx where k = 'event'), 'host', 0, null);
--   if not exists (select 1 from jsonb_array_elements(host -> 'changes') x where (x ->> 0)::uuid = sealed_id) then raise exception 'the host log lost the sealed shot'; end if;
--   if host -> 'waiting' <> 'null'::jsonb then raise exception 'the host scope answered waiting facts'; end if;
--   insert into proof (step, ok, detail) values ('2 a sealed shot: album_max +1, one ping, no log row, no count, it waits', true, v1 -> 'waiting' ->> 'count' || ' waiting');
-- exception when others then insert into proof (step, ok, detail) values ('2 a sealed shot: album_max +1, one ping, no log row, no count, it waits', false, sqlerrm);
-- end $$;
--
-- -- ── 3. the event's read answers develop_due, the develop time, the capture and the roll's size, last ──
-- do $$
-- declare tok text; t record;
-- begin
--   select token into tok from fx where k = 'event';
--   select * into t from public.get_event_by_qr_token(tok);
--   if t.develops_at is distinct from now() + interval '1 day' or t.develop_due or t.capture is distinct from 'upload' or t.roll_size is not null then
--     raise exception 'read %, %, %, %', t.develop_due, t.develops_at, t.capture, t.roll_size;
--   end if;
--   if pg_get_function_result('public.get_event_by_qr_token(text)'::regprocedure) not like '%max_upload_bytes bigint, develop_due boolean, develops_at timestamp with time zone, capture text, roll_size integer)' then
--     raise exception 'result %', pg_get_function_result('public.get_event_by_qr_token(text)'::regprocedure);
--   end if;
--   insert into proof (step, ok, detail) values ('3 the event read: develop_due, develops_at, capture, roll_size last', true, 'not due, +1 day, upload, no roll');
-- exception when others then insert into proof (step, ok, detail) values ('3 the event read: develop_due, develops_at, capture, roll_size last', false, sqlerrm);
-- end $$;
--
-- -- ── 4. the leak matrix, SQL half: every home a guest's view reaches leaves the sealed shot out; the host's keep it ──
-- do $$
-- declare
--   v_event uuid; qr text; v_host uuid; v_g1 uuid; sid uuid; oid uuid; n bigint; n2 bigint; j jsonb; bad text := '';
-- begin
--   select id, token into v_event, qr from fx where k = 'event';
--   select id into v_host from fx where k = 'host';
--   select id into v_g1 from fx where k = 'g1';
--   select id into sid from fx where k = 'sealed_shot';
--   select id into oid from fx where k = 'open_shot';
--
--   -- anon: the open album's RPC (the guest export's open arm)
--   set local role anon;
--   perform set_config('request.jwt.claim.sub', '', true);
--   select count(*) filter (where m.id = sid), count(*) filter (where m.id = oid) into n, n2
--     from public.get_event_media_by_qr_token(qr) m;
--   reset role;
--   if n <> 0 or n2 <> 1 then bad := bad || ' anon-open-album'; end if;
--   if exists (select 1 from public.get_event_media_by_qr_token(qr) m
--               join public.media x on x.id = m.id where x.sealed_until is not null) then bad := bad || ' anon-any-sealed'; end if;
--
--   -- service role: covers for the profile and Guest cards
--   set local role service_role;
--   j := public.event_covers(array[v_event]);
--   if (j -> v_event::text ->> 'original_key') not like '%' || oid::text || '%' then bad := bad || ' covers-service'; end if;
--   reset role;
--
--   -- the host, through her own session: exempt everywhere she asks
--   set local role authenticated;
--   perform set_config('request.jwt.claim.sub', v_host::text, true);
--   select count(*) into n from public.get_event_media_by_qr_token(qr) m where m.id = sid;
--   if n <> 1 then bad := bad || ' host-open-album'; end if;
--   if public.event_covers(array[v_event]) -> v_event::text is null then bad := bad || ' host-covers'; end if;
--   if (public.event_card_stats(array[v_event]) -> v_event::text ->> 'approved')::bigint
--      is distinct from (select count(*) from public.media where event_id = v_event and status = 'approved' and removed_at is null) then bad := bad || ' host-card-stats'; end if;
--   select count(*) into n from public.media m where m.event_id = v_event and m.sealed_until is not null;
--   if n = 0 then bad := bad || ' host-select-sealed'; end if;
--   if (public.like_media(sid) ->> 'ok')::boolean is not true then bad := bad || ' host-like'; end if;
--   reset role;
--
--   -- a confirmed guest: the sealed shot is not_found, the open one likes
--   set local role authenticated;
--   perform set_config('request.jwt.claim.sub', v_g1::text, true);
--   if public.like_media(sid) ->> 'reason' is distinct from 'not_found' then bad := bad || ' guest-like-sealed'; end if;
--   if (public.like_media(oid) ->> 'ok')::boolean is not true then bad := bad || ' guest-like-open'; end if;
--   reset role;
--   perform set_config('request.jwt.claim.sub', '', true);
--
--   -- a report of a sealed id answers as a foreign id does (the route's service-role call)
--   begin
--     perform public.create_report(qr, sid, 'check', 'other', null, null, null);
--     bad := bad || ' report-sealed-accepted';
--   exception when check_violation then
--     if sqlerrm <> 'Reported media does not belong to this event.' then bad := bad || ' report-words'; end if;
--   end;
--   perform public.create_report(qr, oid, 'check', 'other', null, null, null);
--
--   if bad <> '' then raise exception 'leaks:%', bad; end if;
--   insert into proof (step, ok, detail) values ('4 the SQL homes: no sealed shot to a guest, all of them to the host', true,
--     'open album RPC, covers, card stats, like, report');
-- exception when others then
--   reset role;
--   insert into proof (step, ok, detail) values ('4 the SQL homes: no sealed shot to a guest, all of them to the host', false, sqlerrm);
-- end $$;
--
-- -- ── 5. a sealed upload attends nothing in public until it develops ──
-- do $$
-- declare v_event uuid; tok2 text; r jsonb; att jsonb;
-- begin
--   select id into v_event from fx where k = 'event';
--   select token into tok2 from fx where k = 't2';
--   r := pg_temp.shot(tok2);
--   if not (r ->> 'sealed')::boolean then raise exception 'G1''s shot was not sealed'; end if;
--   insert into fx values ('g1_shot', (r ->> 'media_id')::uuid, null);
--   att := public.get_public_profile('dispo-check-g1') -> 'attended_events';
--   if exists (select 1 from jsonb_array_elements(att) x where (x ->> 'id')::uuid = v_event) then raise exception 'attended before develop: %', att; end if;
--   insert into proof (step, ok, detail) values ('5 a sealed upload attends nothing yet', true, 'her page lists no line for the album');
-- exception when others then insert into proof (step, ok, detail) values ('5 a sealed upload attends nothing yet', false, sqlerrm);
-- end $$;
--
-- -- ── 6. the camera begins: its roll, a fresh period, and both upload reads answer it ──
-- do $$
-- declare v_event uuid; tok text; tok2 text; v_g1 uuid; c jsonb; g jsonb; e record;
-- begin
--   select id into v_event from fx where k = 'event';
--   select token into tok from fx where k = 't1';
--   select token into tok2 from fx where k = 't2';
--   select id into v_g1 from fx where k = 'g1';
--   -- everything so far was taken an hour ago, under a period that began then (as a later transaction's camera finds it)
--   update public.media set created_at = now() - interval '1 hour' where event_id = v_event;
--   update public.events set sealed_from = now() - interval '1 hour' where id = v_event;
--   if public.get_upload_context(tok, 'photo') ->> 'capture' is distinct from 'upload' or public.get_upload_context(tok, 'photo') -> 'roll' <> 'null'::jsonb then
--     raise exception 'free uploads answered a roll: %', public.get_upload_context(tok, 'photo');
--   end if;
--   update public.events set capture = 'camera' where id = v_event;
--   select * into e from public.events where id = v_event;
--   if e.roll_size is distinct from 24 or e.sealed_from is distinct from now() then raise exception 'the camera began with %, %', e.roll_size, e.sealed_from; end if;
--   c := public.get_upload_context(tok, 'photo');
--   if c ->> 'capture' is distinct from 'camera' or c -> 'roll' is distinct from '{"used": 0, "cap": 24, "taken": 0, "ceiling": 72}'::jsonb then raise exception 'context %', c; end if;
--   perform pg_temp.shot(tok2);
--   g := public.get_upload_gate(v_event, tok, null);
--   if (g -> 'roll' ->> 'used')::int is distinct from 0 then raise exception 'gate by ticket %', g; end if;
--   g := public.get_upload_gate(v_event, null, v_g1);
--   if g -> 'roll' is distinct from '{"used": 1, "cap": 24, "taken": 1, "ceiling": 72}'::jsonb then raise exception 'gate by account %', g; end if;
--   insert into proof (step, ok, detail) values ('6 the camera begins: 24, a fresh period, both upload reads', true, 'ticket 0 of 24, account 1 of 24 (1 of 72 taken)');
-- exception when others then insert into proof (step, ok, detail) values ('6 the camera begins: 24, a fresh period, both upload reads', false, sqlerrm);
-- end $$;
--
-- -- ── 7. the roll: 24 live, the 25th refused in its own words; her withdrawal frees its frame and purges tonight; a
-- --       host's hide keeps the frame, her removal frees it and keeps its 30 days; the host exempt ──
-- do $$
-- declare v_event uuid; v_host uuid; tok text; r jsonb; i int; refused text; v_last uuid; v_hide uuid; v_rem uuid; m record;
-- begin
--   select id into v_event from fx where k = 'event';
--   select id into v_host from fx where k = 'host';
--   select token into tok from fx where k = 't1';
--   for i in 1 .. 24 loop
--     r := pg_temp.shot(tok);
--     v_last := (r ->> 'media_id')::uuid;
--     if i = 1 then v_hide := v_last; elsif i = 2 then v_rem := v_last; end if;
--   end loop;
--   refused := pg_temp.refusal(tok);
--   if refused is distinct from 'You''ve taken all 24 shots on your roll.' then raise exception '25th: %', coalesce(refused, 'accepted'); end if;
--   -- her own withdrawal gives the frame back (Will's overrule), and its bytes go tonight, not in 30 days
--   if (public.remove_my_upload_by_session(tok, v_last) ->> 'ok')::boolean is not true then raise exception 'her withdrawal'; end if;
--   select * into m from public.media where id = v_last;
--   if m.status is distinct from 'removed' or m.purge_at is distinct from m.removed_at then raise exception 'withdrawn: %, purge_at %, removed_at %', m.status, m.purge_at, m.removed_at; end if;
--   if pg_temp.roll(tok) ->> 'used' is distinct from '23' or pg_temp.roll(tok) ->> 'taken' is distinct from '24' then raise exception 'after the withdrawal %', pg_temp.roll(tok); end if;
--   if pg_temp.refusal(tok) is not null then raise exception 'the freed frame refused'; end if;
--   if pg_temp.refusal(tok) is null then raise exception 'a 25th live shot landed'; end if;
--   -- the host's hide keeps the frame taken; her removal frees it, and keeps the bin's 30 days (it is no withdrawal)
--   set local role authenticated;
--   perform set_config('request.jwt.claim.sub', v_host::text, true);
--   update public.media set status = 'hidden' where id = v_hide;
--   reset role;
--   if pg_temp.roll(tok) ->> 'used' is distinct from '24' then raise exception 'a hide freed a frame: %', pg_temp.roll(tok); end if;
--   set local role authenticated;
--   perform set_config('request.jwt.claim.sub', v_host::text, true);
--   update public.media set status = 'removed', removed_at = now() where id = v_rem;
--   reset role;
--   perform set_config('request.jwt.claim.sub', '', true);
--   select * into m from public.media where id = v_rem;
--   if m.purge_at is distinct from m.removed_at + interval '30 days' then raise exception 'the host''s removal purges at %', m.purge_at; end if;
--   if pg_temp.roll(tok) ->> 'used' is distinct from '23' then raise exception 'the host''s removal kept the frame: %', pg_temp.roll(tok); end if;
--   -- the host's own uploads are no roll's, and seal with everyone's
--   r := pg_temp.host_shot();
--   if not (r ->> 'sealed')::boolean then raise exception 'the host''s shot was not sealed: %', r; end if;
--   insert into fx values ('host_shot', (r ->> 'media_id')::uuid, null);
--   insert into proof (step, ok, detail) values ('7 the roll: 24 live, the 25th refused, a withdrawal frees and purges tonight, a hide holds, the host exempt', true, refused);
-- exception when others then
--   reset role;
--   insert into proof (step, ok, detail) values ('7 the roll: 24 live, the 25th refused, a withdrawal frees and purges tonight, a hide holds, the host exempt', false, sqlerrm);
-- end $$;
--
-- -- ── 8. the ceiling: three rolls' worth a period, every shot counted, and the ledger outlives the purge ──
-- do $$
-- declare tok text; refused text; i int; v_victim uuid; gone uuid[]; t3 text;
-- begin
--   select token into tok from fx where k = 't1';
--   select token into t3 from fx where k = 't3';
--   for i in 1 .. 100 loop
--     select m.id into v_victim from public.media m
--       where m.guest_id = (select id from fx where k = 't1') and m.status = 'approved' and m.created_at >= now()
--       order by m.created_at desc, m.id limit 1;
--     perform public.remove_my_upload_by_session(tok, v_victim);
--     refused := pg_temp.refusal(tok);
--     exit when refused is not null;
--   end loop;
--   if refused is distinct from 'You''ve used every retake this roll allows.' then raise exception 'the ceiling: %', coalesce(refused, 'never'); end if;
--   if pg_temp.roll(tok) ->> 'taken' is distinct from '72' then raise exception 'taken %', pg_temp.roll(tok); end if;
--   -- the nightly purge deletes her withdrawn shots; the ledger still counts them
--   select array_agg(m.id) into gone from public.media m
--     where m.guest_id = (select id from fx where k = 't1') and m.status = 'removed' and m.removed_by_uploader;
--   perform public.purge_media_rows(gone);
--   if exists (select 1 from public.media where id = any (gone)) then raise exception 'the purge kept a withdrawn shot'; end if;
--   if pg_temp.roll(tok) ->> 'taken' is distinct from '72' or pg_temp.refusal(tok) is distinct from 'You''ve used every retake this roll allows.' then
--     raise exception 'after the purge %', pg_temp.roll(tok);
--   end if;
--   -- another guest's roll is her own
--   if pg_temp.roll(t3) is distinct from '{"used": 0, "cap": 24, "taken": 0, "ceiling": 72}'::jsonb then raise exception 'another ticket %', pg_temp.roll(t3); end if;
--   insert into proof (step, ok, detail) values ('8 the ceiling: 72 a period, refused in its own words, kept through the purge', true, refused);
-- exception when others then insert into proof (step, ok, detail) values ('8 the ceiling: 72 a period, refused in its own words, kept through the purge', false, sqlerrm);
-- end $$;
--
-- -- ── 9. a camera video: 10 seconds and 128 MB, each refused in words the app maps ──
-- do $$
-- declare tok2 text; a text; b text; r jsonb;
-- begin
--   select token into tok2 from fx where k = 't2';
--   begin perform pg_temp.shot(tok2, 'video', 129::bigint * 1024 * 1024, 5); exception when check_violation then a := sqlerrm; end;
--   begin perform pg_temp.shot(tok2, 'video', 10::bigint * 1024 * 1024, 12); exception when check_violation then b := sqlerrm; end;
--   if a is distinct from 'This video exceeds the 128 MB a camera shot can be.' then raise exception 'bytes: %', coalesce(a, 'accepted'); end if;
--   if b is distinct from 'This video is longer than the 10 seconds a camera shot can be.' then raise exception 'length: %', coalesce(b, 'accepted'); end if;
--   r := pg_temp.shot(tok2, 'video', 60::bigint * 1024 * 1024, 10.2);
--   if not (r ->> 'sealed')::boolean then raise exception 'a 10 s video: %', r; end if;
--   insert into proof (step, ok, detail) values ('9 a camera video: 128 MB and 10 s (half a second''s grace)', true, a || ' / ' || b);
-- exception when others then insert into proof (step, ok, detail) values ('9 a camera video: 128 MB and 10 s (half a second''s grace)', false, sqlerrm);
-- end $$;
--
-- -- ── 10. DEVELOP IS A WRITE: due shots develop once, move the guest album, ring once, stamp no let_in_at ──
-- do $$
-- declare v_event uuid; qr text; v0 jsonb; v1 jsonb; p0 bigint; p1 bigint; n int; t record; due int; ids uuid[];
-- begin
--   select id, token into v_event, qr from fx where k = 'event';
--   -- time passes: every sealed shot's develop time is now behind it
--   update public.media set sealed_until = now() - interval '1 second' where event_id = v_event and sealed_until is not null;
--   select array_agg(id) into ids from public.media where event_id = v_event and sealed_until is not null and status = 'approved';
--   due := cardinality(ids);
--   select * into t from public.get_event_by_qr_token(qr);
--   if not t.develop_due then raise exception 'develop_due is false with % due', due; end if;
--   perform pg_temp.new_tx();
--   v0 := pg_temp.album(); p0 := pg_temp.pings();
--   n := public.develop_due(v_event);
--   v1 := pg_temp.album((v0 ->> 'album_max')::bigint); p1 := pg_temp.pings();
--   if n < due then raise exception 'developed % of %', n, due; end if;
--   if p1 <> p0 + 1 then raise exception 'pings % -> % (one ring for the develop)', p0, p1; end if;
--   if (v1 ->> 'album_max')::bigint is distinct from (v0 ->> 'album_max')::bigint + 1 then raise exception 'album_max moved % -> %', v0 ->> 'album_max', v1 ->> 'album_max'; end if;
--   if (select count(*) from jsonb_array_elements(v1 -> 'changes') x where (x ->> 0)::uuid = any (ids) and x ->> 2 = 'approved') is distinct from due then
--     raise exception 'the delta carries % of %', jsonb_array_length(v1 -> 'changes'), due;
--   end if;
--   if (v1 -> 'waiting' ->> 'count')::bigint is distinct from 0 then raise exception 'waiting after develop %', v1 -> 'waiting'; end if;
--   if exists (select 1 from public.media where id = any (ids) and let_in_at is not null) then raise exception 'develop stamped let_in_at'; end if;
--   if public.develop_due(v_event) is distinct from 0 then raise exception 'a second develop found more'; end if;
--   select * into t from public.get_event_by_qr_token(qr);
--   if t.develop_due then raise exception 'still due'; end if;
--   insert into proof (step, ok, detail) values ('10 develop: once, the delta, one ring, no let_in_at', true, format('%s developed', n));
-- exception when others then insert into proof (step, ok, detail) values ('10 develop: once, the delta, one ring, no let_in_at', false, sqlerrm);
-- end $$;
--
-- -- ── 11. developed, the guest attends in public ──
-- do $$
-- declare v_event uuid; att jsonb;
-- begin
--   select id into v_event from fx where k = 'event';
--   att := public.get_public_profile('dispo-check-g1') -> 'attended_events';
--   if not exists (select 1 from jsonb_array_elements(att) x where (x ->> 'id')::uuid = v_event) then raise exception 'not attended after develop: %', att; end if;
--   insert into proof (step, ok, detail) values ('11 developed, she attends', true, 'her line is on her page');
-- exception when others then insert into proof (step, ok, detail) values ('11 developed, she attends', false, sqlerrm);
-- end $$;
--
-- -- ── 12. A NEW develops_at REWRITES THE ROWS IN THE SAME SAVE (no develop_due call): a time moved, a due row opened
-- --        not resealed, one ring; Develop now; a develop after one reached is a new period; right away; the camera off;
-- --        the CHECKs ──
-- do $$
-- declare v_event uuid; tok2 text; r jsonb; s1 uuid; s2 uuid; p0 bigint; bad text := ''; e record;
--   v_old constant timestamptz := now() - interval '5 hours';
-- begin
--   select id into v_event from fx where k = 'event';
--   select token into tok2 from fx where k = 't2';
--   update public.events set develops_at = now() + interval '1 day' where id = v_event;  -- reached -> ahead: a new period
--   if (select sealed_from from public.events where id = v_event) is distinct from now() then bad := bad || ' new-period'; end if;
--   update public.events set sealed_from = v_old where id = v_event;                     -- (marked, to tell a stamp)
--   r := pg_temp.shot(tok2); s1 := (r ->> 'media_id')::uuid;
--   r := pg_temp.shot(tok2); s2 := (r ->> 'media_id')::uuid;
--   update public.media set sealed_until = now() - interval '1 second' where id = s2;  -- s2's time has passed (due)
--   p0 := pg_temp.pings();
--   update public.events set develops_at = now() + interval '3 days' where id = v_event;
--   select * into e from public.events where id = v_event;
--   if (select sealed_until from public.media where id = s1) is distinct from e.develops_at then bad := bad || ' rewrite'; end if;
--   if (select sealed_until from public.media where id = s2) is not null then bad := bad || ' due-resealed'; end if;
--   if pg_temp.pings() <> p0 + 1 then bad := bad || ' rewrite-rings'; end if;
--   if e.sealed_from is distinct from v_old then bad := bad || ' ahead-to-ahead-restamped'; end if;
--   if (select develop_due from public.get_event_by_qr_token((select token from fx where k = 'event'))) then bad := bad || ' due-after-save'; end if;
--   -- Develop now: anything at or within a minute of now is now, and opens everything in the same save
--   p0 := pg_temp.pings();
--   update public.events set develops_at = now() + interval '30 seconds' where id = v_event;
--   if (select develops_at from public.events where id = v_event) is distinct from now() then bad := bad || ' develop-now-normalized'; end if;
--   if exists (select 1 from public.media where event_id = v_event and sealed_until is not null) then bad := bad || ' develop-now-left-sealed'; end if;
--   if pg_temp.pings() <> p0 + 1 then bad := bad || ' develop-now-rings'; end if;
--   -- a develop time after one reached: a new period, and only what comes after is sealed
--   update public.events set develops_at = now() + interval '1 day' where id = v_event;
--   if (select sealed_from from public.events where id = v_event) is distinct from now() then bad := bad || ' reached-to-ahead'; end if;
--   if (select sealed_until from public.media where id = s1) is not null then bad := bad || ' resealed-the-developed'; end if;
--   r := pg_temp.shot(tok2);
--   if not (r ->> 'sealed')::boolean then bad := bad || ' no-seal-after'; end if;
--   -- right away: everything at once in the same save; the camera keeps its period
--   update public.events set sealed_from = v_old where id = v_event;
--   p0 := pg_temp.pings();
--   update public.events set develops_at = null where id = v_event;
--   if exists (select 1 from public.media where event_id = v_event and sealed_until is not null) then bad := bad || ' right-away-left-sealed'; end if;
--   if pg_temp.pings() <> p0 + 1 then bad := bad || ' right-away-rings'; end if;
--   if (select sealed_from from public.events where id = v_event) is distinct from v_old then bad := bad || ' camera-lost-its-period'; end if;
--   r := pg_temp.shot(tok2);
--   if (r ->> 'sealed')::boolean then bad := bad || ' right-away-sealed'; end if;
--   -- the camera off with no develop: no roll, no period
--   update public.events set capture = 'upload' where id = v_event;
--   select * into e from public.events where id = v_event;
--   if e.roll_size is not null or e.sealed_from is not null then bad := bad || ' upload-kept ' || coalesce(e.roll_size::text, '-') || '/' || coalesce(e.sealed_from::text, '-'); end if;
--   if pg_temp.roll(tok2) <> 'null'::jsonb then bad := bad || ' upload-rolls'; end if;
--   -- a roll named on free uploads is cleared, a camera's named one kept; the CHECKs hold the rest
--   update public.events set roll_size = 12 where id = v_event;
--   if (select roll_size from public.events where id = v_event) is not null then bad := bad || ' upload-roll-size'; end if;
--   update public.events set capture = 'camera', roll_size = 12 where id = v_event;
--   if (select roll_size from public.events where id = v_event) is distinct from 12 then bad := bad || ' named-roll'; end if;
--   begin update public.events set roll_size = 25 where id = v_event; bad := bad || ' roll-25'; exception when check_violation then null; end;
--   begin update public.events set capture = 'film' where id = v_event; bad := bad || ' capture-film'; exception when check_violation then null; end;
--   begin update public.events set sealed_from = null where id = v_event; bad := bad || ' camera-no-period'; exception when check_violation then null; end;
--   begin update public.events set develops_at = 'infinity' where id = v_event; bad := bad || ' infinite'; exception when check_violation then null; end;
--   update public.events set capture = 'upload' where id = v_event;
--   if bad <> '' then raise exception 'saves:%', bad; end if;
--   insert into proof (step, ok, detail) values ('12 a save of develops_at rewrites its rows in the same save', true, 'moved, due opened, one ring; Develop now; a new period; right away; the camera off; the CHECKs');
-- exception when others then insert into proof (step, ok, detail) values ('12 a save of develops_at rewrites its rows in the same save', false, sqlerrm);
-- end $$;
--
-- -- ── 13. what waits is held and sealed together: a held upload moves album_max and rings; moving from approving each
-- --        to a develop time seals the held rows in the save, so their approval waits for the develop ──
-- do $$
-- declare v_event uuid; tok2 text; r jsonb; p0 bigint; v0 jsonb; v1 jsonb; h0 uuid; h1 uuid; e record;
-- begin
--   select id into v_event from fx where k = 'event';
--   select token into tok2 from fx where k = 't2';
--   update public.events set moderation_mode = 'hold_for_approval' where id = v_event;
--   perform pg_temp.new_tx();
--   v0 := pg_temp.album(); p0 := pg_temp.pings();
--   r := pg_temp.shot(tok2); h0 := (r ->> 'media_id')::uuid;
--   if r ->> 'status' is distinct from 'pending' or (r ->> 'sealed')::boolean then raise exception 'held shot %', r; end if;
--   v1 := pg_temp.album((v0 ->> 'album_max')::bigint);
--   if pg_temp.pings() <> p0 + 1 then raise exception 'a held upload did not ring'; end if;
--   if (v1 ->> 'album_max')::bigint is distinct from (v0 ->> 'album_max')::bigint + 1 or jsonb_array_length(v1 -> 'changes') <> 0 then raise exception 'a held upload: %', v1 - 'waiting'; end if;
--   if (v1 -> 'waiting' ->> 'count')::bigint is distinct from (v0 -> 'waiting' ->> 'count')::bigint + 1 then raise exception 'held not waiting: %', v1 -> 'waiting'; end if;
--   -- the host moves to a develop time (the app's save, then approveAllPending): the held row is sealed in the save
--   perform pg_temp.new_tx();
--   update public.events set moderation_mode = 'live', develops_at = now() + interval '1 day' where id = v_event;
--   select * into e from public.events where id = v_event;
--   if (select sealed_until from public.media where id = h0) is distinct from e.develops_at then raise exception 'the save left the held row unsealed'; end if;
--   perform pg_temp.new_tx();
--   v0 := pg_temp.album(); p0 := pg_temp.pings();
--   update public.media set status = 'approved' where event_id = v_event and status = 'pending';
--   v1 := pg_temp.album((v0 ->> 'album_max')::bigint);
--   if pg_temp.pings() <> p0 then raise exception 'an approval that stays waiting rang'; end if;
--   if (v1 ->> 'album_max') is distinct from (v0 ->> 'album_max') or (v1 ->> 'approved') is distinct from (v0 ->> 'approved') then raise exception 'an approval that stays waiting moved the album'; end if;
--   if (select let_in_at from public.media where id = h0) is null then raise exception 'the approval stamped no let_in_at'; end if;
--   -- approve plus develop, as the schema allows: held AND sealed at once, and shown only once both are past
--   update public.events set moderation_mode = 'hold_for_approval' where id = v_event;
--   r := pg_temp.shot(tok2); h1 := (r ->> 'media_id')::uuid;
--   if r ->> 'status' is distinct from 'pending' or not (r ->> 'sealed')::boolean then raise exception 'approve plus develop: %', r; end if;
--   update public.events set moderation_mode = 'live', develops_at = null where id = v_event;
--   if (select sealed_until from public.media where id = h1) is not null then raise exception 'right away left a held row sealed'; end if;
--   update public.media set status = 'approved' where id = h1;
--   insert into proof (step, ok, detail) values ('13 held and sealed wait together; a develop time seals the held in its save', true, 'a held upload rings; its approval under the develop stays waiting');
-- exception when others then insert into proof (step, ok, detail) values ('13 held and sealed wait together; a develop time seals the held in its save', false, sqlerrm);
-- end $$;
--
-- -- ── 14. the sweep: every album holding due shots, through develop_due ──
-- do $$
-- declare v_event uuid; tok2 text; j jsonb; n int;
-- begin
--   select id into v_event from fx where k = 'event';
--   select token into tok2 from fx where k = 't2';
--   update public.events set develops_at = now() + interval '1 day' where id = v_event;
--   perform pg_temp.shot(tok2); perform pg_temp.shot(tok2);
--   update public.media set sealed_until = now() - interval '1 second' where event_id = v_event and sealed_until is not null;
--   select count(*) into n from public.media where event_id = v_event and sealed_until is not null;
--   j := public.develop_due_sweep(500);
--   if n < 2 or (j ->> 'developed')::int < n or (j ->> 'more')::boolean then raise exception 'sweep % of %', j, n; end if;
--   if exists (select 1 from public.media where event_id = v_event and sealed_until is not null) then raise exception 'the sweep left a due shot'; end if;
--   insert into proof (step, ok, detail) values ('14 the sweep', true, j::text);
-- exception when others then insert into proof (step, ok, detail) values ('14 the sweep', false, sqlerrm);
-- end $$;
--
-- -- ── 15. who may call what: develop is the service role's, the helpers the owner's, the host writes three columns and
-- --        her save rewrites through the trigger ──
-- do $$
-- declare v_event uuid; v_host uuid; tok2 text; bad text := ''; fn text; sid uuid;
-- begin
--   select id into v_event from fx where k = 'event';
--   select id into v_host from fx where k = 'host';
--   select token into tok2 from fx where k = 't2';
--   foreach fn in array array['public.develop_due(uuid)', 'public.develop_due_sweep(integer)'] loop
--     if has_function_privilege('anon', fn, 'execute') or has_function_privilege('authenticated', fn, 'execute')
--        or not has_function_privilege('service_role', fn, 'execute') then bad := bad || ' ' || fn; end if;
--   end loop;
--   foreach fn in array array['public.album_bits(public.media_status, boolean, public.media_status, boolean)',
--                             'public.album_doorbell(uuid)', 'public.guest_roll(public.events, uuid, uuid)',
--                             'public.seal_disagrees(public.events)', 'public.develop_rows(public.events, boolean)'] loop
--     if has_function_privilege('anon', fn, 'execute') or has_function_privilege('authenticated', fn, 'execute')
--        or has_function_privilege('service_role', fn, 'execute') then bad := bad || ' ' || fn; end if;
--   end loop;
--   foreach fn in array array['public.events_reveal_stamp()', 'public.events_develops_rewrite()', 'public.set_media_purge_at()'] loop
--     if has_function_privilege('anon', fn, 'execute') or has_function_privilege('authenticated', fn, 'execute') then bad := bad || ' ' || fn; end if;
--   end loop;
--   if (select string_agg(coalesce(r.rolname, 'PUBLIC') || ':' || a.privilege_type, ',' order by coalesce(r.rolname, 'PUBLIC'))
--         from pg_proc p cross join lateral aclexplode(p.proacl) a left join pg_roles r on r.oid = a.grantee
--        where p.oid = 'public.get_event_by_qr_token(text)'::regprocedure)
--      is distinct from 'anon:EXECUTE,authenticated:EXECUTE,postgres:EXECUTE,service_role:EXECUTE' then bad := bad || ' event-read-acl'; end if;
--   sid := (pg_temp.shot(tok2) ->> 'media_id')::uuid;
--   -- the host, through PostgREST's role: her three columns write, and her save moves the sealed row through the trigger
--   set local role authenticated;
--   perform set_config('request.jwt.claim.sub', v_host::text, true);
--   update public.events set develops_at = now() + interval '5 days', capture = 'camera', roll_size = 24 where id = v_event;
--   begin
--     update public.events set sealed_from = now() where id = v_event;
--     bad := bad || ' sealed_from-written';
--   exception when insufficient_privilege then null;
--   end;
--   begin
--     update public.media set sealed_until = null where event_id = v_event;
--     bad := bad || ' sealed-written';
--   exception when insufficient_privilege then null;
--   end;
--   begin
--     perform public.develop_due(v_event);
--     bad := bad || ' develop-called';
--   exception when insufficient_privilege then null;
--   end;
--   begin
--     perform 1 from public.camera_rolls;
--     bad := bad || ' ledger-read';
--   exception when insufficient_privilege then null;
--   end;
--   reset role;
--   perform set_config('request.jwt.claim.sub', '', true);
--   if (select sealed_until from public.media where id = sid) is distinct from (select develops_at from public.events where id = v_event) then bad := bad || ' host-save-rewrite'; end if;
--   if bad <> '' then raise exception 'grants:%', bad; end if;
--   insert into proof (step, ok, detail) values ('15 who may call what', true, 'develop the service role''s; helpers the owner''s; the host writes capture, roll_size and develops_at alone, and her save rewrites');
-- exception when others then
--   reset role;
--   insert into proof (step, ok, detail) values ('15 who may call what', false, sqlerrm);
-- end $$;
--
-- -- ── 16. a straggler heals: a row on a stale answer is due, and develop_due brings it to the event's ──
-- do $$
-- declare v_event uuid; qr text; tok2 text; r jsonb; sid uuid; v_dev timestamptz; t record; bad text := '';
-- begin
--   select id, token into v_event, qr from fx where k = 'event';
--   select token into tok2 from fx where k = 't2';
--   update public.events set develops_at = now() + interval '1 day' where id = v_event;
--   select develops_at into v_dev from public.events where id = v_event;
--   r := pg_temp.shot(tok2); sid := (r ->> 'media_id')::uuid;
--   -- an upload that read the event before the host moved the time: sealed to the old one
--   update public.media set sealed_until = v_dev + interval '6 hours' where id = sid;
--   select * into t from public.get_event_by_qr_token(qr);
--   if not t.develop_due then bad := bad || ' stale-later-not-due'; end if;
--   -- (the develop and the read are two statements: one statement's subquery would read its own start's snapshot)
--   if public.develop_due(v_event) <> 1 then bad := bad || ' stale-later-count'; end if;
--   if (select sealed_until from public.media where id = sid) is distinct from v_dev then bad := bad || ' stale-later-heal'; end if;
--   update public.media set sealed_until = v_dev - interval '6 hours' where id = sid;
--   if not (select develop_due from public.get_event_by_qr_token(qr)) then bad := bad || ' stale-earlier-not-due'; end if;
--   perform public.develop_due(v_event);
--   if (select sealed_until from public.media where id = sid) is distinct from v_dev then bad := bad || ' stale-earlier-heal'; end if;
--   -- sealed with no develop time (an upload that read the event before right away): opened
--   update public.events set develops_at = null where id = v_event;
--   update public.media set sealed_until = v_dev where id = sid;
--   if not (select develop_due from public.get_event_by_qr_token(qr)) then bad := bad || ' right-away-straggler-not-due'; end if;
--   perform public.develop_due(v_event);
--   if (select sealed_until from public.media where id = sid) is not null then bad := bad || ' right-away-straggler-heal'; end if;
--   if (select develop_due from public.get_event_by_qr_token(qr)) then bad := bad || ' still-due'; end if;
--   if bad <> '' then raise exception 'straggler:%', bad; end if;
--   insert into proof (step, ok, detail) values ('16 a straggler heals on the next read', true, 'a later time, an earlier one, a row sealed under right away');
-- exception when others then insert into proof (step, ok, detail) values ('16 a straggler heals on the next read', false, sqlerrm);
-- end $$;
--
-- -- ── 17. her own held or sealed item is hers to withdraw, by ticket or by account, and no one else's ──
-- do $$
-- declare v_event uuid; v_g1 uuid; v_host uuid; t1 text; t3 text; tok2 text; s_anon uuid; s_acct uuid; h_anon uuid; bad text := ''; j jsonb;
-- begin
--   select id into v_event from fx where k = 'event';
--   select id into v_g1 from fx where k = 'g1';
--   select id into v_host from fx where k = 'host';
--   select token into t1 from fx where k = 't1';
--   select token into t3 from fx where k = 't3';
--   select token into tok2 from fx where k = 't2';
--   update public.events set capture = 'upload', develops_at = now() + interval '1 day' where id = v_event;
--   s_anon := (pg_temp.shot(t3) ->> 'media_id')::uuid;   -- sealed, a ticket's
--   s_acct := (pg_temp.shot(tok2) ->> 'media_id')::uuid; -- sealed, an account's
--   update public.events set moderation_mode = 'hold_for_approval' where id = v_event;
--   h_anon := (pg_temp.shot(t3) ->> 'media_id')::uuid;   -- held (and sealed), a ticket's
--   -- another ticket cannot withdraw them
--   if public.remove_my_upload_by_session(t1, s_anon) ->> 'reason' is distinct from 'not_found' then bad := bad || ' ticket-cross-sealed'; end if;
--   if public.remove_my_upload_by_session(t1, h_anon) ->> 'reason' is distinct from 'not_found' then bad := bad || ' ticket-cross-held'; end if;
--   -- a claimed row is the account's, never a stale token's
--   if public.remove_my_upload_by_session(tok2, s_acct) ->> 'reason' is distinct from 'not_found' then bad := bad || ' token-on-claimed'; end if;
--   -- another account (the host, whose arm is her own uploads) cannot
--   set local role authenticated;
--   perform set_config('request.jwt.claim.sub', v_host::text, true);
--   if public.remove_my_upload(s_acct) ->> 'reason' is distinct from 'not_found' then bad := bad || ' account-cross'; end if;
--   reset role;
--   -- hers, each
--   if (public.remove_my_upload_by_session(t3, s_anon) ->> 'ok')::boolean is not true then bad := bad || ' ticket-sealed'; end if;
--   if (public.remove_my_upload_by_session(t3, h_anon) ->> 'ok')::boolean is not true then bad := bad || ' ticket-held'; end if;
--   set local role authenticated;
--   perform set_config('request.jwt.claim.sub', v_g1::text, true);
--   j := public.remove_my_upload(s_acct);
--   reset role;
--   perform set_config('request.jwt.claim.sub', '', true);
--   if (j ->> 'ok')::boolean is not true then bad := bad || ' account-sealed ' || j::text; end if;
--   if (select count(*) from public.media where id in (s_anon, h_anon, s_acct) and status = 'removed' and removed_by_uploader) <> 3 then bad := bad || ' not-withdrawn'; end if;
--   -- a withdrawn held row never reaches Review (the host's pending count)
--   if (public.album_changes_since(v_event, 'host', 0, null) ->> 'pending')::int <> (select count(*) from public.media where event_id = v_event and status = 'pending') then bad := bad || ' review-count'; end if;
--   if exists (select 1 from public.media where id = h_anon and status = 'pending') then bad := bad || ' held-still-pending'; end if;
--   -- not a camera's shot: the bin's 30 days, as any withdrawal of a free upload
--   if (select purge_at from public.media where id = s_anon) is distinct from (select removed_at + interval '30 days' from public.media where id = s_anon) then bad := bad || ' upload-withdrawal-fast'; end if;
--   update public.events set moderation_mode = 'live' where id = v_event;
--   if bad <> '' then raise exception 'withdrawals:%', bad; end if;
--   insert into proof (step, ok, detail) values ('17 her held or sealed item: hers to withdraw by ticket or account, no one else''s', true, 'ticket and account arms; cross-ticket, stale-token and cross-account refused; out of Review');
-- exception when others then
--   reset role;
--   insert into proof (step, ok, detail) values ('17 her held or sealed item: hers to withdraw by ticket or account, no one else''s', false, sqlerrm);
-- end $$;
--
-- select n, step, ok, detail from proof order by n;
--
-- RESULT, 2026-10-02, nothing persisted by either run (afterwards no `capture`, `roll_size`, `develops_at`,
-- `sealed_from`, `sealed_until`, `camera_rolls`, new function or `develop_rolls_enabled` flag exists, no fixture row
-- stands, and create_media and set_media_purge_at still hash 70a83228 and e8e63970):
--   LIVE RED, without this file's statements: 18/18 fail, each on what it lacks (0 `column "capture" of relation
--     "events" does not exist`; 2 a sealed id rode the guest log; 5 attended before develop; 7 `25th: accepted`;
--     8 `the ceiling: never`; 9 `bytes: accepted`; 13 a held upload did not ring; 15 `function
--     "public.develop_due(uuid)" does not exist`; the rest a missing column).
--   LIVE GREEN, with them (the statements with the comments outside their bodies left out): 18/18, and a 19th row,
--     the 26 bodies this file writes fingerprinting 79b9b7ec8e395fa4ae75cfe33a8e3c7d (md5 over each body's md5, by
--     name), the stand-in's own from this file verbatim. 2: 2 waiting; 7: the 25th refused in its own words; 8: the
--     ceiling at 72, kept through the purge; 10: 29 developed in one pass and one ring; 14: {"more": false,
--     "events": 1, "developed": 2}.
--   STAND-IN: the same, 18/18 red without the file and 18/18 green with it.
-- =============================================================================================
