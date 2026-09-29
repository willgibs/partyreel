-- =============================================================================================
-- THE DOORS (lane `settings-wiring`, event-settings r1): Public, Private with its gate, Only me.
--
-- Will's answers (docs/reviews/event-settings.json, 2026-09-29), as he approved the build in chat:
-- what the link opens is Public (anyone with the link), Private (a gate: a password, the host lets
-- each person in, an invite list, or only people already in) or Only me (today's `private`). ONE RULE
-- FOR EVERYONE ALREADY IN: a gate stops newcomers; only Only me and a block shut out someone already
-- in. A newcomer waiting on the host reads nothing of the album; a declined newcomer is a block (the
-- board drew it so: "Declining someone blocks them. You can let them back from Blocked"), so declined,
-- closed-out and blocked all meet the private album's own answers, in the same words and the same
-- work. Someone not on the invite list can ask to be let in (`unlisted=ask`). And Videos becomes a
-- switch a paid host can turn off, so an album can keep to photos.
--
-- WHAT THIS FILE DOES:
--   1. events.gate               the gate a Private album keeps beside the password (approve, invite,
--                                closed), meaningful only while visibility = 'private' (a CHECK), so
--                                'private' with no gate is Only me. RPC-written, never granted.
--      events.allow_videos       the host's Videos switch, default on, a bare additive column grant.
--      guests.admission          'in' (past the door: every row minted before this file) or
--                                'waiting' (asked, the host has not answered), and waiting_seen_at,
--                                the waiting door's check-in.
--   2. public.event_invites      the invite list: confirmed-address keys, the host's own events only
--                                through RLS, written only by the host's two RPCs.
--   3. The rule, once            event_door_account_in (the account holds a row past the door, and no
--                                block holds it) and event_door_lists_account (its confirmed address
--                                is on the list): what every path asks.
--   4. The server's reads        event_door_standing (who this request is at this door: the one read
--                                the page and every route decide from), event_door_check_in (the
--                                waiting door's ~30 s poll, which stamps waiting_seen_at),
--                                event_door_counts, event_door_queue, event_invite_list and
--                                host_door_waiting (the host's Guests room, hub, pulse and bell).
--                                Service role only.
--   5. The host's acts           set_event_door (the one writer of the door), let_in_at_door,
--                                add_event_invites and remove_event_invite, SECURITY DEFINER and
--                                authenticated-only, each re-checking that the caller hosts the event;
--                                set_event_password, carried with the gate cleared beside its flip.
--   6. The door opening          a trigger admits everyone waiting when an album turns Public.
--   7. The ask                   ask_to_join, service role only: an unlisted confirmed newcomer at an
--                                invite list asks, which mints her a waiting row.
--   8. Every guest path          each carried from its newest definition with the door added:
--        the album's read   get_event_by_qr_token (dropped and recreated: `accepts_video` appended,
--                           the guest picker's flag; a gated door is stored 'private', so the anon
--                           read already answers it as a private album to everyone but its host);
--        the upload         get_upload_context answers the door AS THIS TICKET SEES IT (a waiting
--                           ticket reads private, a ticket past a gate or the password reads open,
--                           the block last) and its video advisory reads the switch; create_media
--                           refuses a waiting ticket, Only me and a switched-off video as the belt;
--        the join           create_guest mints past each gate (closed: only someone already in;
--                           approve: 'waiting'; invite: the list comes straight in, anyone else is
--                           told to ask), and someone already in passes the password without it;
--        the door's rename  set_guest_display_name and set_guest_pending_email refuse a waiting
--                           ticket and Only me in the private album's words;
--        likes              like_media lets someone past a gate like there, as a password album's
--                           guest always could; Only me still likes nothing but its host;
--        both claims        claim_anonymous_uploads and the claims review's three move only a row
--                           past the door, so a claim never carries anyone through a gate.
--
-- ★ AN EXPAND: THE DEPLOYED CODE SURVIVES IT UNTOUCHED, AND FAILS CLOSED ON EVERY NEW DOOR. A gated
-- door is stored as visibility 'private' plus its gate, so partyreel.com's build (and the alias's until
-- this lane ships) reads every gated album as a private one: the locked screen, no join, no upload,
-- no like, which is the safe side. Every replaced function keeps its signature and its RETURNS, but
-- get_event_by_qr_token, whose RETURNS TABLE grows one column the deployed build simply ignores; its
-- whole ACL is restated. Nothing deployed can set a gate (the column is ungranted and set_event_door
-- is new), so until the new build ships every gate clause reads null and every admission reads 'in'.
-- The lane's code reads the new objects through a typed seam that answers "not provisioned" as
-- today's three doors, loudly, so apply and push go in either order.
--
-- APPLY PROTOCOL (database-security.md -> Workflow):
--   (1) Drift, read-only: each live body's md5 equals its source file's (measured 2026-09-29):
--         get_event_by_qr_token(text)                          88c98ced3318b420e9fd2bce367bebfe  (20260928120000)
--         get_upload_context(text, media_type)                 e0b1255aee87c53c91b91d867fe2d2f9  (20260928120000)
--         create_guest(text, uuid, boolean, text, text)        e114fa0ad87ab1bb3e1f621ccf6ae439  (20260928120000)
--         create_media(... 10 args)                            770fbeaf63263b5f9846fa16b37c1a05  (20260928120000)
--         set_guest_display_name(text, text)                   61bbf735fecd12771eada470021508a1  (20260928120000)
--         set_guest_pending_email(text, text)                  f4ce9c0b5bec364d4011180fafc8a83a  (20260928120000)
--         like_media(uuid)                                     3ec0ef855484b21d68b9bfcafc4ecf76  (20260929100000)
--         claim_anonymous_uploads(text[])                      2f8a4266de2458bc092c4a1ffbf82998  (20260928120000)
--         list_guest_rows_by_email(timestamptz, uuid, integer) 199f9898afc08c80dbe578f9656d969c  (20260928120000)
--         claim_guest_rows_by_email(uuid[])                    a3d13d6ec80bbaade1a8c81e1ae78065  (20260928120000)
--         disown_guest_rows_by_email(uuid[])                   f764812a87f291664f76cf766deb3d92  (20260928120000)
--         set_event_password(uuid, text)                       8786a9f7013abad817dcc0e8d2a1fc9a  (20260928130000)
--       and neither events.gate, guests.admission, public.event_invites nor any of the new functions
--       exists yet:
--       select p.oid::regprocedure, md5(p.prosrc) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--        where n.nspname = 'public' and p.proname in ('get_event_by_qr_token', 'get_upload_context',
--          'create_guest', 'create_media', 'set_guest_display_name', 'set_guest_pending_email',
--          'like_media', 'claim_anonymous_uploads', 'list_guest_rows_by_email',
--          'claim_guest_rows_by_email', 'disown_guest_rows_by_email', 'set_event_password')
--        order by 1;
--   (2) The rolled-back check at the foot, on the live schema BEFORE the apply (it held there on
--       2026-09-29 with this file's final text; its twelve proof rows are quoted with it), then apply
--       verbatim. The query in (1), widened to the new names, then reads (md5(prosrc), hashed from this
--       file's bodies locally, the method that reproduces the live hashes above):
--         get_event_by_qr_token(text)                          7ddab5f2a4e84c7cf788a35e2c5a7f43
--         get_upload_context(text, media_type)                 cc567b17749b39d6baf022f386925b38
--         create_guest(text, uuid, boolean, text, text)        6d0f60133ab55eca7952977ea11dd97b
--         create_media(... 10 args)                            f9eb36f026fb34491d4e2cf1e16b154d
--         set_guest_display_name(text, text)                   af90bdb710759079c8b54f51b66256fb
--         set_guest_pending_email(text, text)                  2431c1521d72920d51a2de2f06fdd6fd
--         like_media(uuid)                                     4a4ff51e55d63d31e2ded67ae5d5cd6b
--         claim_anonymous_uploads(text[])                      fc760d575b691bac9cf3e14b4f9aaf39
--         list_guest_rows_by_email(timestamptz, uuid, integer) 4ea0fa756fcb02faa71ffb40e8f86c2a
--         claim_guest_rows_by_email(uuid[])                    0b60930904165d832f27f1163a439d45
--         disown_guest_rows_by_email(uuid[])                   ffb5c2a4e74839fa5a76cc26eac8c3d0
--         set_event_password(uuid, text)                       560185c3883c8219d494a30fae29872f
--         event_door_account_in(uuid, uuid)                    798ed72ed01105a381aa8194b8f962ac
--         event_door_lists_account(uuid, uuid)                 66038e2cb54552cb58db96b2c84d2896
--         event_door_standing(uuid, uuid, text[])              791c895df0ff82b18b8b18000685d50d
--         event_door_check_in(uuid, uuid, text[])              e99552abc5a2fd370cb0af1e9d683639
--         event_door_counts(uuid)                              cf63de76a327667cc373c3767f4523e5
--         event_door_queue(uuid)                               3c6897d457b2adeab6ccfca972ef938e
--         event_invite_list(uuid)                              0e0c18fc873ca9e6ce270fa698e1029f
--         host_door_waiting(uuid)                              09651a235042db59aa6b31103d630809
--         set_event_door(uuid, text)                           40b5b77860f61b1cc1fdc47a191e3d2a
--         let_in_at_door(uuid, uuid)                           7c827e6240bdf66a8ec87f2c36b8ecd5
--         add_event_invites(uuid, text[])                      bd0a694036b2114f739f19ec42466f54
--         remove_event_invite(uuid, text)                      62a6463ff408182a911159d289e74388
--         events_door_opened()                                 f5a840313ef365e0ee4a44f84fb5c710
--         ask_to_join(text, uuid)                              259da9137fea1f6619713d747324a215
--   (3) The grants, as the file restates them: the new functions and the table below; every replaced
--       function exactly as today; get_event_by_qr_token's whole ACL.
--   (4) get_advisors (security). EXPECTED DELTA: 0029 grows by exactly four, set_event_door,
--       let_in_at_door, add_event_invites and remove_event_invite (authenticated SECURITY DEFINER host
--       acts, the block_from_event class); 0028 unchanged (get_event_by_qr_token stays its anon read);
--       rls_enabled_no_policy unchanged (event_invites carries a policy; every read and predicate here
--       is the service role's alone, so none enters either list).
--   (5) Regenerate src/lib/db/types.ts: the two enums, the three columns, the table and the new
--       functions, and get_event_by_qr_token's new column. The lane reads them through a typed seam
--       (src/lib/db/queries/event-doors.ts, src/lib/db/mutations/event-doors.ts), so it compiles on
--       either side of the regeneration.
-- =============================================================================================

-- =============================================================================================
-- 1. The door's columns.
-- =============================================================================================
-- ★ THE GATE LIVES BESIDE THE PASSWORD, AND A GATED ALBUM IS STORED PRIVATE. The password gate is the
-- one the schema already has (`visibility = 'password'`, its hash, its unlock cookie, and
-- set_event_password as the only way in); the three new gates are a private album that keeps a door.
-- So `visibility` still answers the coarse question every reader already asks ("may anyone with the
-- link just open this?"), and every reader that asks it of a gated album gets the safe answer until it
-- learns the gate: a private album, which is exactly what a newcomer at a gate is shown.
create type public.event_gate as enum ('approve', 'invite', 'closed');

comment on type public.event_gate is
  'The gate a Private album keeps beside the password (event-settings r1): approve (the host lets each person in), invite (the list comes straight in, anyone else asks), closed (only people already in). Set only while visibility = ''private''; private with no gate is Only me.';

alter table public.events
  add column gate public.event_gate,
  add column allow_videos boolean not null default true;

-- ★ TWO SHAPES THE DOOR CAN NEVER TAKE. A gate means nothing on an album anyone may open, and a
-- gate that keys on an address (letting people in, the list) needs every newcomer to confirm one,
-- which is the email step held on: the settings draw that switch on and still.
alter table public.events
  add constraint events_gate_is_private check (gate is null or visibility = 'private'),
  add constraint events_gate_needs_email check (gate is null or gate = 'closed' or require_verified_email);

comment on column public.events.gate is
  'The Private album''s gate (event_gate), written only by set_event_door and cleared by set_event_password; null on Public, a password album and Only me.';
comment on column public.events.allow_videos is
  'The host''s Videos switch: false keeps the album to photos. Only a paid tier can take a video at all (create_media); this lets a paid host keep an album to photos. Guests only: the host''s own uploads are exempt, as with max_upload_bytes.';

-- The Videos switch is a plain setting: a bare additive column grant, like show_reel. The gate is
-- deliberately NOT granted: its one writer is set_event_door, which moves the waiting and the email
-- step with it.
grant insert (allow_videos), update (allow_videos) on public.events to authenticated;

-- ★ WHO IS PAST THE DOOR, ON THE ROW THAT GOT THEM THERE. A `guests` row is the ticket the door mints,
-- so it carries whether the door let it through: 'in' (every row minted before this file passed the
-- door it met) or 'waiting' (a newcomer at a door the host answers). A decline is a block, so there is
-- no third state: the block's own rule holds a declined person out, and Let back in is the way back.
create type public.guest_admission as enum ('in', 'waiting');

alter table public.guests
  add column admission public.guest_admission not null default 'in',
  add column waiting_seen_at timestamptz;

comment on column public.guests.admission is
  'Whether this ticket is past the door (in) or waiting on the host (waiting: minted at a gate the host answers). Read by event_door_standing and every guest path; moved by let_in_at_door and the door opening to Public.';
comment on column public.guests.waiting_seen_at is
  'The waiting door''s last check-in (about every 30 s while it is open), so a later let-in mail can tell whether she is still at the door. Written by event_door_check_in only.';

-- The host's queue reads only the waiting rows of one event.
create index guests_waiting_idx on public.guests (event_id) where admission = 'waiting';

-- =============================================================================================
-- 2. public.event_invites: the invite list.
-- =============================================================================================
-- ★ A CONFIRMED ADDRESS IS THE ONLY KEY, stored normalised, so a match is an equality on the address
-- auth.users confirmed (event_door_lists_account). One foreign key, the event's: a second would be a
-- new PostgREST embed path (PGRST201).
create table public.event_invites (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now(),
  constraint event_invites_email_shape
    check (email = lower(btrim(email))
           and char_length(email) between 3 and 254
           and position('@' in email) > 1
           and email !~ '\s'),
  constraint event_invites_event_email_key unique (event_id, email)
);

comment on table public.event_invites is
  'The invite list (event-settings r1, editor=both): the addresses an invite-list album lets straight in once confirmed, capped per event. Written only by add_event_invites and remove_event_invite; read by the host through RLS and by the server.';

-- RLS on, the host's own events only; SELECT is the one client grant, every write the host's two RPCs.
-- A new table inherits ALL for the client roles from the project's default privileges, so each is
-- revoked by name before the one grant (the MCP landmine, database-security.md).
alter table public.event_invites enable row level security;
revoke all on table public.event_invites from public, anon, authenticated;
grant select on table public.event_invites to authenticated;
create policy event_invites_select_host on public.event_invites
  for select to authenticated
  using (exists (select 1 from public.events e
                  where e.id = event_invites.event_id
                    and e.host_id = (select auth.uid())));

-- =============================================================================================
-- 3. The rule, once.
-- =============================================================================================
-- ★ PAST THE DOOR MEANS A ROW OF THEIRS THE DOOR LET THROUGH, AND NO BLOCK. An account is past the door
-- when it holds an 'in' row at the event and no block holds it (by its id or the address it confirmed)
-- or that row; the ticket half of the same rule is the row's own `admission` beside
-- event_block_holds_row, asked where a ticket is in hand. SECURITY INVOKER, and no client role can run
-- either: every caller is a SECURITY DEFINER body (which runs them as the owner) or the service role.
create function public.event_door_account_in(p_event_id uuid, p_user_id uuid)
returns boolean
language sql
stable
set search_path = ''
as $$
  select p_user_id is not null
     and not public.event_block_holds_account(p_event_id, p_user_id)
     and exists (
       select 1
         from public.guests g
        where g.event_id = p_event_id
          and g.user_id = p_user_id
          and g.admission = 'in'
          and not public.event_block_holds_row(g)
     );
$$;

-- The invite list's match: the address auth.users confirmed for this account, never a typed one. It
-- reads auth.users, so only a SECURITY DEFINER body can ask it (as event_block_names_account is asked).
create function public.event_door_lists_account(p_event_id uuid, p_user_id uuid)
returns boolean
language sql
stable
set search_path = ''
as $$
  select p_user_id is not null and exists (
    select 1
      from public.event_invites i
      join auth.users u on u.id = p_user_id and u.email_confirmed_at is not null
     where i.event_id = p_event_id
       and i.email = lower(btrim(u.email))
  );
$$;

revoke all on function public.event_door_account_in(uuid, uuid) from public, anon, authenticated;
grant execute on function public.event_door_account_in(uuid, uuid) to service_role;
revoke all on function public.event_door_lists_account(uuid, uuid) from public, anon, authenticated;
grant execute on function public.event_door_lists_account(uuid, uuid) to service_role;

-- =============================================================================================
-- 4. The server's reads (service role only).
-- =============================================================================================
-- ★ WHO THIS REQUEST IS AT THIS DOOR: the one answer the page, its metadata and every guest route decide
-- from (src/lib/event/door/decide.ts turns it into shut, waiting, ask, a newcomer's door or the album).
-- Keyed on the account (every device) and the tickets this request holds (one browser each), never a
-- device id or an IP. It does the same reads whatever the door, so a private album, a closed one, a
-- decline and a block cost one call and answer in the same time.
--   door       the album's own door: open, password, approve, invite, closed or private (Only me)
--   host       the caller hosts it (the one person every door lets in)
--   blocked    a block holds the account, the address it confirmed, or a ticket's row
--   was_in     a row of theirs is past the door, blocked or not (the previous guest's line)
--   in         past the door and not blocked
--   waiting    asked and not answered (and not in, not blocked)
--   listed     an invite list names the confirmed address (and not blocked)
--   confirmed  the account's address is confirmed
-- SECURITY DEFINER: the address reads auth.users, which the service role holds no grant on.
create function public.event_door_standing(
  p_event_id uuid,
  p_user_id uuid default null,
  p_tickets text[] default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_event public.events;
  v_tickets text[];
  v_host boolean;
  v_confirmed text;
  v_blocked boolean;
  v_was_in boolean;
  v_waiting boolean;
  v_listed boolean;
begin
  select e.* into v_event from public.events e where e.id = p_event_id and e.deleted_at is null;
  if not found then
    return jsonb_build_object('found', false);
  end if;

  -- A request carries a ticket or two (the cookie, a body token); more is no browser.
  select coalesce(array_agg(distinct t), '{}'::text[]) into v_tickets
    from unnest(coalesce(p_tickets, '{}'::text[])) as t
   where t is not null and length(t) >= 16;
  if cardinality(v_tickets) > 8 then
    raise exception 'Too many tickets.' using errcode = 'program_limit_exceeded';
  end if;

  v_host := p_user_id is not null and v_event.host_id = p_user_id;

  select lower(btrim(u.email)) into v_confirmed
    from auth.users u
   where u.id = p_user_id and u.email_confirmed_at is not null;

  v_blocked := not v_host and (
    public.event_block_holds_account(v_event.id, p_user_id)
    or exists (
      select 1 from public.guests g
       where g.event_id = v_event.id
         and g.session_token = any (v_tickets)
         and public.event_block_holds_row(g)
    )
  );

  v_was_in := exists (
    select 1 from public.guests g
     where g.event_id = v_event.id
       and g.admission = 'in'
       and ((p_user_id is not null and g.user_id = p_user_id) or g.session_token = any (v_tickets))
  );

  v_waiting := exists (
    select 1 from public.guests g
     where g.event_id = v_event.id
       and g.admission = 'waiting'
       and ((p_user_id is not null and g.user_id = p_user_id) or g.session_token = any (v_tickets))
  );

  v_listed := v_confirmed is not null and exists (
    select 1 from public.event_invites i
     where i.event_id = v_event.id and i.email = v_confirmed
  );

  return jsonb_build_object(
    'found', true,
    'door', case when v_event.visibility = 'private' and v_event.gate is not null
                 then v_event.gate::text
                 else v_event.visibility::text end,
    'host', v_host,
    'blocked', v_blocked,
    'was_in', v_was_in,
    'in', v_was_in and not v_blocked,
    'waiting', v_waiting and not v_was_in and not v_blocked,
    'listed', v_listed and not v_blocked,
    'confirmed', v_confirmed is not null
  );
end;
$$;

-- ★ THE WAITING DOOR'S CHECK-IN, about every 30 s while it is open: the standing again, and a stamp on
-- this person's waiting rows, so the banked let-in mail can later tell a newcomer still at the door
-- from one who left. No mail sends from here. Volatile, since it writes the stamp.
create function public.event_door_check_in(
  p_event_id uuid,
  p_user_id uuid default null,
  p_tickets text[] default null
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_standing jsonb;
begin
  v_standing := public.event_door_standing(p_event_id, p_user_id, p_tickets);
  if coalesce((v_standing ->> 'waiting')::boolean, false) then
    update public.guests g
       set waiting_seen_at = now()
     where g.event_id = p_event_id
       and g.admission = 'waiting'
       and ((p_user_id is not null and g.user_id = p_user_id)
            or g.session_token = any (coalesce(p_tickets, '{}'::text[])));
  end if;
  return v_standing;
end;
$$;

-- ★ THE HOST'S NUMBERS FOR ONE EVENT, one jsonb (the row cap cannot cut it), read after the caller has
-- proved the host (the Guests room, the settings' consequence lines, the hub):
--   in            people past the door: an account once, a named ticket with no account once per row;
--                 never the host, never a nameless row, never someone a block holds
--   in_by_name    of those, the ones in on a typed name alone (the email step, turned on, asks them)
--   waiting       people waiting on the host, an account once
--   invited       addresses on the list
--   joined        listed addresses that are past the door on a row that confirmed them
create function public.event_door_counts(p_event_id uuid)
returns jsonb
language sql
stable
set search_path = ''
as $$
  with ev as (
    select e.id, e.host_id from public.events e where e.id = p_event_id
  ),
  rows as (
    select g.id, g.user_id, g.display_name, g.verified_at, g.email, g.admission
      from public.guests g
      join ev on ev.id = g.event_id
     where g.user_id is distinct from ev.host_id
       and not public.event_block_holds_row(g)
  )
  select jsonb_build_object(
    'in', (select count(distinct case when r.user_id is not null then 'u' || r.user_id::text
                                      else 'g' || r.id::text end)
             from rows r
            where r.admission = 'in' and (r.user_id is not null or r.display_name is not null)),
    'in_by_name', (select count(*) from rows r
                    where r.admission = 'in' and r.user_id is null and r.verified_at is null
                      and r.display_name is not null),
    'waiting', (select count(distinct coalesce(r.user_id::text, r.id::text))
                  from rows r where r.admission = 'waiting'),
    'invited', (select count(*) from public.event_invites i where i.event_id = p_event_id),
    'joined', (select count(*) from public.event_invites i
                where i.event_id = p_event_id
                  and exists (select 1 from rows r
                               where r.admission = 'in' and r.verified_at is not null
                                 and lower(btrim(r.email)) = i.email))
  );
$$;

-- ★ WHO WAITS AT THE DOOR, for the Guests room's At the door section: one entry an account, its oldest
-- ask first, with the confirmed address the host sees for every confirmed guest (guest-flow.md), the
-- profile's name, and the waiting row the host's Let in and Decline name. At most 500 (the list says
-- how many more), one jsonb, never a block's.
create function public.event_door_queue(p_event_id uuid)
returns jsonb
language sql
stable
set search_path = ''
as $$
  with waiting as (
    select coalesce(g.user_id::text, g.id::text) as person,
           g.id, g.user_id, g.email, g.created_at, g.waiting_seen_at
      from public.guests g
     where g.event_id = p_event_id
       and g.admission = 'waiting'
       and not public.event_block_holds_row(g)
  ),
  people as (
    select w.person,
           w.user_id,
           (array_agg(w.id order by w.created_at, w.id))[1] as guest_id,
           (array_agg(lower(btrim(w.email)) order by w.created_at desc)
              filter (where w.email is not null))[1] as email,
           min(w.created_at) as asked_at,
           max(w.waiting_seen_at) as seen_at
      from waiting w
     group by w.person, w.user_id
  )
  select jsonb_build_object(
    'total', (select count(*) from people),
    'people', coalesce((
      select jsonb_agg(jsonb_build_object(
               'guest_id', x.guest_id,
               'user_id', x.user_id,
               'name', x.name,
               'email', x.email,
               'asked_at', x.asked_at,
               'seen_at', x.seen_at
             ) order by x.asked_at, x.guest_id)
        from (
          select p.*, nullif(btrim(pr.display_name), '') as name
            from people p
            left join public.profiles pr on pr.id = p.user_id
           order by p.asked_at, p.guest_id
           limit 500
        ) x
    ), '[]'::jsonb)
  );
$$;

-- ★ THE LIST AS THE HOST SEES IT: each address, newest first, and whether it is in yet (a row past the
-- door that confirmed it). One jsonb; the list is capped at add_event_invites' 500.
create function public.event_invite_list(p_event_id uuid)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
           'email', i.email,
           'added_at', i.created_at,
           'joined', exists (
             select 1 from public.guests g
              where g.event_id = i.event_id
                and g.admission = 'in'
                and g.verified_at is not null
                and lower(btrim(g.email)) = i.email
                and not public.event_block_holds_row(g)
           )
         ) order by i.created_at desc, i.email), '[]'::jsonb)
    from public.event_invites i
   where i.event_id = p_event_id;
$$;

-- ★ WHO WAITS, ACROSS A HOST'S LIVE EVENTS: { event id: people waiting }, for the places the host is
-- already told about held uploads (the dashboard's pulse and the bell) and the hub's Guests card.
create function public.host_door_waiting(p_host_id uuid)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select coalesce(jsonb_object_agg(x.event_id::text, x.people), '{}'::jsonb)
    from (
      select g.event_id, count(distinct coalesce(g.user_id::text, g.id::text)) as people
        from public.guests g
        join public.events e on e.id = g.event_id
       where e.host_id = p_host_id
         and e.deleted_at is null
         and g.admission = 'waiting'
         and not public.event_block_holds_row(g)
       group by g.event_id
    ) x;
$$;

revoke all on function public.event_door_standing(uuid, uuid, text[]) from public, anon, authenticated;
grant execute on function public.event_door_standing(uuid, uuid, text[]) to service_role;
revoke all on function public.event_door_check_in(uuid, uuid, text[]) from public, anon, authenticated;
grant execute on function public.event_door_check_in(uuid, uuid, text[]) to service_role;
revoke all on function public.event_door_counts(uuid) from public, anon, authenticated;
grant execute on function public.event_door_counts(uuid) to service_role;
revoke all on function public.event_door_queue(uuid) from public, anon, authenticated;
grant execute on function public.event_door_queue(uuid) to service_role;
revoke all on function public.event_invite_list(uuid) from public, anon, authenticated;
grant execute on function public.event_invite_list(uuid) to service_role;
revoke all on function public.host_door_waiting(uuid) from public, anon, authenticated;
grant execute on function public.host_door_waiting(uuid) to service_role;

-- =============================================================================================
-- 5. The host's acts.
-- =============================================================================================
-- set_event_door: the one writer of the door. `p_door` is the door's own word (open, password,
-- approve, invite, closed, private), stored as visibility plus the gate.
--   * THE HOST, RE-CHECKED: the caller hosts the live event, else not_found.
--   * THE PASSWORD is the one door with a secret: it opens only onto a password already set
--     (set_event_password sets one and flips the door itself), so a bare switch to it is refused.
--   * A GATE THAT KEYS ON AN ADDRESS turns the email step on in the same statement (the CHECK above).
--   * TURNING PUBLIC lets everyone waiting in (the trigger below): the answer counts them first, so the
--     host's consequence line and the act agree.
create function public.set_event_door(p_event_id uuid, p_door text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_event public.events;
  v_visibility public.event_visibility;
  v_gate public.event_gate;
  v_email boolean;
  v_waiting integer := 0;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'reason', 'unauthorized');
  end if;
  if p_door is null or p_door not in ('open', 'password', 'approve', 'invite', 'closed', 'private') then
    return jsonb_build_object('ok', false, 'reason', 'bad_door');
  end if;

  select e.* into v_event from public.events e
   where e.id = p_event_id and e.host_id = v_uid and e.deleted_at is null
     for no key update;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  if p_door = 'password' and v_event.event_password_hash is null then
    return jsonb_build_object('ok', false, 'reason', 'no_password');
  end if;

  v_visibility := case p_door
                    when 'open' then 'open'::public.event_visibility
                    when 'password' then 'password'::public.event_visibility
                    else 'private'::public.event_visibility
                  end;
  v_gate := case when p_door in ('approve', 'invite', 'closed') then p_door::public.event_gate end;
  v_email := v_event.require_verified_email or p_door in ('approve', 'invite');

  if v_visibility = 'open' and v_event.visibility <> 'open' then
    select count(distinct coalesce(g.user_id::text, g.id::text))::integer into v_waiting
      from public.guests g
     where g.event_id = v_event.id
       and g.admission = 'waiting'
       and not public.event_block_holds_row(g);
  end if;

  update public.events
     set visibility = v_visibility,
         gate = v_gate,
         require_verified_email = v_email
   where id = v_event.id;

  return jsonb_build_object(
    'ok', true,
    'door', p_door,
    'email_held', v_email and not v_event.require_verified_email,
    'admitted', v_waiting
  );
end;
$$;

-- let_in_at_door: the host lets one newcomer in, named by a waiting row of theirs. Every waiting row
-- of the same account at the event goes in with it (she may have asked from two devices), and each
-- door she waits at opens by itself at its next check-in.
--   * THE HOST, RE-CHECKED: the row's event is the caller's and is live, else not_found.
--   * A BLOCKED ONE IS NOT LET IN HERE: lifting the block is Let back in's act (a decline is a block).
create function public.let_in_at_door(p_event_id uuid, p_guest_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_guest public.guests;
  v_admitted integer;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'reason', 'unauthorized');
  end if;

  select g.* into v_guest
    from public.guests g
    join public.events e on e.id = g.event_id
   where g.id = p_guest_id
     and g.event_id = p_event_id
     and e.host_id = v_uid
     and e.deleted_at is null;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  if public.event_block_holds_row(v_guest) then
    return jsonb_build_object('ok', false, 'reason', 'blocked');
  end if;
  if v_guest.admission <> 'waiting' then
    return jsonb_build_object('ok', true, 'admitted', 0, 'already', true);
  end if;

  update public.guests g
     set admission = 'in'
   where g.event_id = p_event_id
     and g.admission = 'waiting'
     and (g.id = v_guest.id or (v_guest.user_id is not null and g.user_id = v_guest.user_id));
  get diagnostics v_admitted = row_count;

  return jsonb_build_object('ok', true, 'admitted', v_admitted, 'already', false);
end;
$$;

-- add_event_invites: addresses onto the list, the one field that takes one typed or two hundred pasted.
--   * THE HOST, RE-CHECKED, as every act.
--   * EACH ADDRESS NORMALISED (lower, trimmed) and shaped by the table's own CHECK, so nothing reaches
--     it as a raw 23514: the unreadable are counted and left out, never refused whole.
--   * CAPPED AT 500 AN EVENT (mirrored by INVITE_LIST_CAP, src/lib/event/door/invite-list.ts): the
--     first that fit are added in the host's order, the rest counted as over_cap.
--   * AT MOST 2,000 IN ONE CALL, like every array parameter in this schema.
create function public.add_event_invites(p_event_id uuid, p_emails text[])
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_have integer;
  v_room integer;
  v_valid integer;
  v_new integer;
  v_added integer;
  v_invalid integer;
  c_cap constant integer := 500;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'reason', 'unauthorized');
  end if;
  if p_emails is not null and cardinality(p_emails) > 2000 then
    return jsonb_build_object('ok', false, 'reason', 'too_many');
  end if;

  -- The event row, locked for the call: two adds to one list run one at a time, so the cap holds.
  perform 1 from public.events e
   where e.id = p_event_id and e.host_id = v_uid and e.deleted_at is null
     for no key update;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  select count(*)::integer into v_have from public.event_invites i where i.event_id = p_event_id;
  v_room := greatest(c_cap - v_have, 0);

  -- One pass: each address normalised and counted once (its first place in what the host typed or
  -- pasted), the unreadable set aside, the new ones inserted in the host's order up to the room left.
  with raw as (
    select lower(btrim(t.raw)) as email, t.ord
      from unnest(coalesce(p_emails, '{}'::text[])) with ordinality as t(raw, ord)
     where t.raw is not null and btrim(t.raw) <> ''
  ),
  batch as (
    select r.email,
           min(r.ord) as ord,
           bool_and(char_length(r.email) between 3 and 254
                    and position('@' in r.email) > 1
                    and r.email !~ '\s') as valid
      from raw r
     group by r.email
  ),
  fresh as (
    select b.email, b.ord
      from batch b
     where b.valid
       and not exists (select 1 from public.event_invites i
                        where i.event_id = p_event_id and i.email = b.email)
  ),
  added as (
    insert into public.event_invites (event_id, email)
    select p_event_id, f.email
      from fresh f
     order by f.ord
     limit v_room
    on conflict (event_id, email) do nothing
    returning 1
  )
  select (select count(*) from batch where not valid)::integer,
         (select count(*) from batch where valid)::integer,
         (select count(*) from fresh)::integer,
         (select count(*) from added)::integer
    into v_invalid, v_valid, v_new, v_added;

  return jsonb_build_object(
    'ok', true,
    'added', v_added,
    'already', v_valid - v_new,
    'invalid', v_invalid,
    'over_cap', greatest(v_new - v_added, 0),
    'total', v_have + v_added
  );
end;
$$;

-- remove_event_invite: an address off the list. Someone it already let in stays in: a gate stops
-- newcomers, and the list was only how she came.
create function public.remove_event_invite(p_event_id uuid, p_email text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_removed integer;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'reason', 'unauthorized');
  end if;
  perform 1 from public.events e
   where e.id = p_event_id and e.host_id = v_uid and e.deleted_at is null;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  delete from public.event_invites i
   where i.event_id = p_event_id
     and i.email = lower(btrim(coalesce(p_email, '')));
  get diagnostics v_removed = row_count;

  return jsonb_build_object('ok', true, 'removed', v_removed);
end;
$$;

-- Authenticated-only, the block_from_event class (0029, never 0028): the host's own acts, authorized
-- inside on auth.uid() and ownership. anon is revoked by name (the MCP landmine).
revoke all on function public.set_event_door(uuid, text) from public, anon, authenticated;
grant execute on function public.set_event_door(uuid, text) to authenticated;
revoke all on function public.let_in_at_door(uuid, uuid) from public, anon, authenticated;
grant execute on function public.let_in_at_door(uuid, uuid) to authenticated;
revoke all on function public.add_event_invites(uuid, text[]) from public, anon, authenticated;
grant execute on function public.add_event_invites(uuid, text[]) to authenticated;
revoke all on function public.remove_event_invite(uuid, text) from public, anon, authenticated;
grant execute on function public.remove_event_invite(uuid, text) to authenticated;

comment on function public.set_event_door(uuid, text) is
  'The door''s one writer (event-settings r1): open, password (only onto a password already set), approve, invite, closed or private (Only me). The caller must host the live event (else not_found). A gate that keys on an address turns the email step on with it; turning Public lets everyone waiting in.';
comment on function public.let_in_at_door(uuid, uuid) is
  'The host lets one waiting newcomer in, named by a waiting row: every waiting row of that account at the event goes in. The caller must host the live event (else not_found); a blocked person is let back in by lifting the block.';
comment on function public.add_event_invites(uuid, text[]) is
  'Addresses onto an event''s invite list, normalised, the unreadable counted and left out, capped at 500 an event. The caller must host the live event.';
comment on function public.remove_event_invite(uuid, text) is
  'One address off an event''s invite list; anyone it already let in stays in. The caller must host the live event.';

-- set_event_password: carried from 20260928130000 verbatim but for the gate, cleared beside the flip,
-- since a password album keeps no other gate (events_gate_is_private). Still the only way into
-- `visibility = 'password'`, still no tier named (tiers-sql.test.ts). Authenticated only, as before.
create or replace function public.set_event_password(p_event_id uuid, p_password text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event public.events;
begin
  select * into v_event from public.events
    where id = p_event_id and host_id = (select auth.uid()) and deleted_at is null;
  if not found then
    raise exception 'Event not found.' using errcode = 'no_data_found';
  end if;

  if length(trim(coalesce(p_password, ''))) < 4 then
    raise exception 'Password must be at least 4 characters.' using errcode = 'check_violation';
  end if;

  update public.events
    set event_password_hash = extensions.crypt(p_password, extensions.gen_salt('bf')),
        visibility = 'password',
        gate = null
    where id = p_event_id and host_id = (select auth.uid());
end;
$$;

revoke execute on function public.set_event_password(uuid, text) from public, anon;
grant execute on function public.set_event_password(uuid, text) to authenticated;

-- =============================================================================================
-- 6. The door opening.
-- =============================================================================================
-- ★ AN ALBUM THAT TURNS PUBLIC LETS EVERYONE AT ITS DOOR IN. Anyone with the link comes in once it is
-- Public, so a newcomer still waiting is simply in; left waiting, she would be back at the door the
-- moment the host closed it again, having been inside. A trigger rather than set_event_door's own
-- statement, so every way an album reaches Public (clearing its password included) keeps the rule.
-- SECURITY DEFINER: the host's own update fires it, and no client role writes guests. A block still
-- holds a declined newcomer out whatever her row says (event_block_holds_row).
create function public.events_door_opened()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.visibility = 'open' and old.visibility is distinct from 'open' then
    update public.guests
       set admission = 'in'
     where event_id = new.id
       and admission = 'waiting';
  end if;
  return null;
end;
$$;

create trigger events_door_opened
  after update of visibility on public.events
  for each row execute function public.events_door_opened();

revoke all on function public.events_door_opened() from public, anon, authenticated;

-- =============================================================================================
-- 7. ask_to_join: someone not on the invite list asks to be let in (`unlisted=ask`).
-- =============================================================================================
-- The ask door's primary ("Ask Maya to let me in"). The caller is the route's getUser()-verified,
-- CONFIRMED account (an address is the only key a list or a host's answer can hold); the row it mints
-- is create_guest's confirmed mint (nameless, the proved address, verified), waiting. Someone the list
-- names, or who is already in, needs no ask, so they are minted in, exactly as their join would be. A
-- block, Only me and every door but an invite list answer as a private album does. Service role only.
create function public.ask_to_join(p_qr_token text, p_user_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_event public.events;
  v_email text;
  v_confirmed timestamptz;
  v_admission public.guest_admission;
  v_session_token text;
  v_guest_id uuid;
begin
  select * into v_event
  from public.events
  where qr_token = p_qr_token and deleted_at is null;
  if not found then
    raise exception 'Event not found.' using errcode = 'no_data_found';
  end if;

  if p_user_id is not null then
    select email, email_confirmed_at into v_email, v_confirmed
    from auth.users where id = p_user_id;
  end if;
  if v_confirmed is null then
    raise exception 'This event requires a verified email to upload.' using errcode = 'check_violation';
  end if;

  if v_event.host_id = p_user_id
     or v_event.visibility <> 'private'
     or v_event.gate is distinct from 'invite'
     or public.event_block_holds_account(v_event.id, p_user_id) then
    raise exception 'This event is private.' using errcode = 'check_violation';
  end if;

  v_admission := case
    when public.event_door_account_in(v_event.id, p_user_id)
      or public.event_door_lists_account(v_event.id, p_user_id)
    then 'in'::public.guest_admission
    else 'waiting'::public.guest_admission
  end;

  v_session_token := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');

  insert into public.guests (event_id, user_id, email, session_token, display_name, verified_at, admission)
  values (
    v_event.id,
    p_user_id,
    nullif(trim(coalesce(v_email, '')), ''),
    v_session_token,
    null,
    v_confirmed,
    v_admission
  )
  returning id into v_guest_id;

  return jsonb_build_object(
    'session_token', v_session_token,
    'guest_id', v_guest_id,
    'event_id', v_event.id,
    'display_name', null,
    'verified', true,
    'email_attached', false,
    'admission', v_admission
  );
end;
$$;

revoke all on function public.ask_to_join(text, uuid) from public, anon, authenticated;
grant execute on function public.ask_to_join(text, uuid) to service_role;

-- =============================================================================================
-- 8a. get_event_by_qr_token: the album's read, with the guest picker's flag.
-- =============================================================================================
-- Carried from 20260928120000 verbatim (QA #40's redaction, the block's lateral, the reel's settings and
-- `limit 1`), the one change `accepts_video` appended: whether this album takes a video from a guest
-- (a paid tier and the host's switch on), so the picker offers photos alone where the upload would be
-- refused. It says nothing a presign would not (a Free album and a switched-off one read the same).
-- ★ A GATED ALBUM NEEDS NO NEW CLAUSE HERE: it is stored 'private', so this read already answers it as a
-- private album to everyone but its host (no name, no metadata). The page learns the gate, and who is
-- asking, from event_door_standing.
-- The RETURNS TABLE grows, so this is DROP + CREATE, which drops the grants: the whole ACL is restated
-- (one of the accepted 0028 anon reads: never revoke).
drop function public.get_event_by_qr_token(text);
create function public.get_event_by_qr_token(p_qr_token text)
 returns table(
    id uuid, name text, description text, moderation_mode public.moderation_mode,
    visibility public.event_visibility, has_password boolean, accepting_uploads boolean,
    require_verified_email boolean, require_upload_to_view boolean,
    event_date date, qr_style text, qr_token text, custom_slug text, host_display_name text,
    show_reel boolean, reel_style_id text, reel_hold_sec numeric, accepts_video boolean)
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
         (e.allow_videos and coalesce(p.tier <> 'free', false))
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

grant execute on function public.get_event_by_qr_token(text) to anon, authenticated;
grant execute on function public.get_event_by_qr_token(text) to public, service_role;

-- =============================================================================================
-- 8b. get_upload_context: the door as this ticket sees it.
-- =============================================================================================
-- Carried from 20260928120000 verbatim but for the door and the switch. Still one of the anon capability
-- reads (the session token IS the authorization): the grant is re-asserted, never narrowed.
-- ★ `visibility` IS THIS TICKET'S DOOR, AND THE ROUTES NEED NO NEW BRANCH. Presign and complete refuse
-- 'private' and ask the unlock for 'password', exactly as before: a waiting ticket reads private (a
-- newcomer adds nothing until she is in); a ticket past a gate, or past the password, reads open (a
-- gate stops newcomers only, so someone already in adds without it); Only me stays private; and the
-- block reads private last, over every door.
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
  c_max_upload_bytes constant bigint := 10::bigint * 1024 * 1024 * 1024; -- 10 GiB (mirrors MAX_UPLOAD_BYTES)
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
  -- they refuse a private album, in the same words ("This event is private."). Only this local copy is
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
    'max_upload_bytes', least(c_max_upload_bytes, coalesce(v_event.max_upload_bytes, c_max_upload_bytes))
  );
end;
$$;

grant execute on function public.get_upload_context(text, public.media_type) to anon, authenticated;

-- =============================================================================================
-- 8c. create_guest: the join, past each door.
-- =============================================================================================
-- Carried from 20260928120000 verbatim but for the door. Service-role only, as before.
--   * ONLY ME never mints (a private album with no gate), and a block never does, as before.
--   * SOMEONE ALREADY IN (an 'in' row of this account, and no block) passes the password without it,
--     and every gate: the one rule for everyone already in.
--   * CLOSED mints only someone already in, and refuses everyone else as a private album does.
--   * APPROVE mints a newcomer WAITING: the door she confirmed in says the host will let her in.
--   * INVITE mints the list straight in, and tells anyone else to ask, in its own words (the route maps
--     them to the ask door); approve and invite need a confirmed email, which the CHECK holds on, so the
--     verified-email refusal above them has already turned a typed name away.
create or replace function public.create_guest(
  p_qr_token text,
  p_user_id uuid default null,
  p_unlock_proven boolean default false,
  p_display_name text default null,
  p_pending_email text default null
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_event public.events;
  v_session_token text;
  v_guest_id uuid;
  v_uid uuid := p_user_id; -- the /api/guests route's getUser()-verified id (admin client has no auth.uid())
  v_email text;
  v_confirmed timestamptz;
  v_name text;
  v_pending text;
  v_in boolean;
  v_admission public.guest_admission := 'in';
begin
  select * into v_event
  from public.events
  where qr_token = p_qr_token and deleted_at is null;

  if not found then
    raise exception 'Event not found.' using errcode = 'no_data_found';
  end if;

  -- QA #18 (ADR-0023 ruling 2): the write path inherits the read gate. Only me (`private` with no gate)
  -- NEVER mints — the /e/ page shuts the door on everyone but the host (owner uploads ride the host
  -- routes), so a guest session for it has no legitimate caller. `password` requires proof of unlock,
  -- or someone already in: the route derives p_unlock_proven server-side (the HttpOnly unlock cookie, or
  -- event ownership — the owner reads the album without unlocking, so they upload without it too). The
  -- DB cannot read cookies, so this param is a belt against a FUTURE second caller skipping the route
  -- gate, not a client-forgeable input (create_guest stays service-role-only).
  if v_event.visibility = 'private' and v_event.gate is null then
    raise exception 'This event is private.' using errcode = 'check_violation';
  end if;
  -- ★ THE SNEAKY BLOCK (20260928120000): an account (or the address it confirmed) this event blocked
  -- meets the private album's refusal word for word, which createGuest maps to the same 403. A
  -- names-only joiner has no account to hold; the route's closed door holds the ticket their browser
  -- keeps (event_door_standing) before it ever calls this.
  if public.event_block_holds_account(v_event.id, v_uid) then
    raise exception 'This event is private.' using errcode = 'check_violation';
  end if;
  -- ★ THE ONE RULE FOR EVERYONE ALREADY IN (20260929120000): an account past the door passes every gate.
  v_in := public.event_door_account_in(v_event.id, v_uid);
  if v_event.visibility = 'password' and not coalesce(p_unlock_proven, false) and not v_in then
    raise exception 'This event is locked. Enter the event password to upload.' using errcode = 'check_violation';
  end if;

  -- Verified email is SERVER-sourced: read auth.users for the trusted uid (definer privilege), never the
  -- client. (This is what closes the email-poisoning surface alongside capture_guest_email's new route.)
  if v_uid is not null then
    select email, email_confirmed_at into v_email, v_confirmed
    from auth.users where id = v_uid;
  end if;

  -- ONLY A CONFIRMED ADDRESS REACHES `guests.email` (the identity SQL gaps, 2026-09-22). `email`
  -- means "confirmed" to every reader (the uploader resolver, the forensic `guest_email`), and
  -- `verified_at` is stamped from the same `v_confirmed` below, so the two arrive together or not
  -- at all from this mint.
  if v_confirmed is null then
    v_email := null;
  end if;

  -- The host's switch is Require verified emails: ON, nothing but a CONFIRMED session gets
  -- through. check_violation, which createGuest (src/lib/db/mutations/guest.ts) maps to a 422.
  if v_event.require_verified_email and (v_uid is null or v_confirmed is null) then
    raise exception 'This event requires a verified email to upload.' using errcode = 'check_violation';
  end if;

  -- ★ THE GATE (20260929120000), for a newcomer: closed turns her away as a private album does, approve
  -- mints her waiting, and an invite list takes the addresses it names and asks everyone else to ask.
  if v_event.gate is not null and not v_in then
    if v_event.gate = 'closed' then
      raise exception 'This event is private.' using errcode = 'check_violation';
    elsif v_event.gate = 'approve' then
      v_admission := 'waiting';
    elsif not public.event_door_lists_account(v_event.id, v_uid) then
      raise exception 'Ask the host to let you in.' using errcode = 'check_violation';
    end if;
  end if;

  -- The typed name, on a name-only event. Blank is NULL here; the raise below decides what a
  -- missing name means.
  v_name := nullif(btrim(coalesce(p_display_name, '')), '');
  -- THE NULLED NAME: a confirmed account's identity is its profile display_name (the one
  -- precedence rule the app codes to), so a typed name is never stored beside it — one identity
  -- per row, never two that can disagree.
  if v_confirmed is not null then
    v_name := null;
  end if;
  -- ★ THE IDENTITY CONTRACT (2026-09-23), the one behaviour change to this body: EVERY UNCONFIRMED
  -- MINT CARRIES A NAME. A confirmed caller's row is nameless by design (its identity is the
  -- profile's name, nulled just above); anyone else is a typed name or nobody, and nobody is what
  -- this refuses. The /api/guests route already refuses a nameless join with its own 422 (and owns
  -- the profanity check, which SQL cannot); this is the belt under it for any other caller, and
  -- the reason a nameless unconfirmed row cannot be minted any more.
  if v_name is null and v_confirmed is null then
    raise exception 'Add your name to upload.' using errcode = 'check_violation';
  end if;
  -- The belt under guests_display_name_len, raised as a mapped refusal rather than a raw 23514.
  -- Only a caller that actually sends a name can reach it.
  if v_name is not null and char_length(v_name) > 60 then
    raise exception 'That name is too long.' using errcode = 'check_violation';
  end if;

  -- THE GUEST IDENTITY ROUND (2026-09-22) — the optional address on the name step. Normalised on
  -- the way in so the CHECK's `= lower(btrim(...))` arm holds by construction and the claim's
  -- equality lookup can never miss on case. Blank is NULL, exactly like the name: the field is
  -- optional and a guest who skips it is at level 1, not in error.
  v_pending := lower(nullif(btrim(coalesce(p_pending_email, '')), ''));
  -- NULLED IN TWO CASES, both "the row already has a better identity than this claim ticket":
  -- beside a CONFIRMED account (the proved address is in `email`; a second, unproved one could only
  -- disagree with it), and on a Require-verified-emails event (only a confirmed mint reaches this
  -- line at all, so this arm is a belt against a future caller that gets past the raise above).
  if v_confirmed is not null or v_event.require_verified_email then
    v_pending := null;
  end if;
  -- The belt under guests_pending_email_shape, raised as a mapped refusal rather than a raw 23514.
  -- ★ It must cover the WHOLE constraint, floor included: a two-character 'a@' passes
  -- `position('@') > 1` and would otherwise reach the CHECK as an unmappable 23514.
  if v_pending is not null
     and (char_length(v_pending) not between 3 and 254 or position('@' in v_pending) <= 1) then
    raise exception 'That email address does not look right.' using errcode = 'check_violation';
  end if;

  v_session_token := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');

  insert into public.guests (event_id, user_id, email, session_token, display_name, verified_at, pending_email, pending_email_at, admission)
  values (
    v_event.id,
    v_uid,
    nullif(trim(coalesce(v_email, '')), ''),
    v_session_token,
    v_name,
    v_confirmed,
    v_pending,
    case when v_pending is not null then now() end,
    v_admission
  )
  returning id into v_guest_id;

  return jsonb_build_object(
    'session_token', v_session_token,
    'guest_id', v_guest_id,
    'event_id', v_event.id,
    -- The door reads which identity it just got without a second read.
    'display_name', v_name,
    'verified', (v_confirmed is not null),
    -- ★ WHETHER, never WHAT. The caller already knows the address it sent; echoing it back would
    -- put an unproved stranger's address on a wire that the host's own /api/guests response rides.
    'email_attached', (v_pending is not null),
    -- ★ WHETHER THE DOOR LET THIS TICKET THROUGH (20260929120000): 'waiting' is the door that asks
    -- the host, and the page holds her there until the host lets her in.
    'admission', v_admission
  );
end;
$function$;

revoke execute on function public.create_guest(text, uuid, boolean, text, text) from public, anon, authenticated;
grant execute on function public.create_guest(text, uuid, boolean, text, text) to service_role;

-- =============================================================================================
-- 8d. create_media: the upload's authoritative write, past the door.
-- =============================================================================================
-- Carried from 20260928120000 verbatim but for the door's belt and the Videos switch. Service-role only.
-- The door's refusal sits beside the block's (the private album's words, which mapCheckViolation reads
-- ahead of every other refusal): a presign issued before the door changed, completed after it, lands
-- nothing for a ticket waiting on the host, or at an album that went Only me.
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
  c_max_upload_bytes constant bigint := 10::bigint * 1024 * 1024 * 1024; -- 10 GiB (mirrors MAX_UPLOAD_BYTES)
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

  -- THE LIVE REEL (20260924100000): reel_eligible is false only for a cut someone saves to the
  -- album, so the live reel never plays a reel. Write-once, like the dimensions.
  insert into public.media (
    id, event_id, guest_id, type, original_key, preview_key,
    file_size_bytes, duration_seconds, width, height, status, reel_eligible
  ) values (
    p_media_id, v_event.id, v_guest.id, p_type, p_original_key, p_preview_key,
    p_file_size_bytes, p_duration_seconds, p_width, p_height, v_status,
    coalesce(p_reel_eligible, true)
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

  -- storage_used_bytes stays the PHYSICAL meter (decremented only in purge_media_rows).
  update public.profiles
    set storage_used_bytes = storage_used_bytes + p_file_size_bytes
    where id = v_event.host_id;

  return jsonb_build_object('media_id', p_media_id, 'status', v_status);
end;
$$;

revoke execute on function public.create_media(text, uuid, public.media_type, text, bigint, text, double precision, integer, integer, boolean) from public, anon, authenticated;
grant execute on function public.create_media(text, uuid, public.media_type, text, bigint, text, double precision, integer, integer, boolean) to service_role;

-- =============================================================================================
-- 8e. set_guest_display_name and set_guest_pending_email: the door's rename-first join.
-- =============================================================================================
-- Each carried verbatim (20260928120000) but for the door. Service-role only.
create or replace function public.set_guest_display_name(
  p_session_token text,
  p_display_name text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_guest public.guests;
  v_name text;
begin
  select * into v_guest from public.guests where session_token = p_session_token;
  if not found then
    raise exception 'Invalid guest session.' using errcode = 'no_data_found';
  end if;

  -- ★ THE SNEAKY BLOCK (20260928120000): a blocked ticket renames nothing (the door's rename-first
  -- path is its join), in the private album's words, ahead of every other refusal.
  if public.event_block_holds_row(v_guest) then
    raise exception 'This event is private.' using errcode = 'check_violation';
  end if;
  -- ★ THE DOOR (20260929120000), in the same words: a ticket waiting on the host, or at an album that
  -- went Only me, renames nothing.
  if v_guest.admission = 'waiting' or exists (
    select 1 from public.events e
     where e.id = v_guest.event_id and e.visibility = 'private' and e.gate is null
  ) then
    raise exception 'This event is private.' using errcode = 'check_violation';
  end if;

  -- A verified guest's name is their profile's. Refusing beats storing a second name that can
  -- disagree with it (the one precedence rule, again).
  if v_guest.verified_at is not null then
    raise exception 'Your name comes from your account.' using errcode = 'check_violation';
  end if;

  v_name := nullif(btrim(coalesce(p_display_name, '')), '');
  if v_name is null then
    raise exception 'Enter a name.' using errcode = 'check_violation';
  end if;
  if char_length(v_name) > 60 then
    raise exception 'That name is too long.' using errcode = 'check_violation';
  end if;

  update public.guests set display_name = v_name where id = v_guest.id;

  return jsonb_build_object('guest_id', v_guest.id, 'display_name', v_name);
end;
$$;

revoke execute on function public.set_guest_display_name(text, text) from public, anon, authenticated;
grant execute on function public.set_guest_display_name(text, text) to service_role;

create or replace function public.set_guest_pending_email(
  p_session_token text,
  p_email text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_guest public.guests;
  v_pending text;
begin
  -- The shape gate before the lookup: a short token is never a real capability, and refusing it
  -- without touching the table keeps this off the list of things worth probing.
  if p_session_token is null or length(p_session_token) < 16 then
    raise exception 'Invalid guest session.' using errcode = 'no_data_found';
  end if;

  select * into v_guest from public.guests where session_token = p_session_token;
  if not found then
    raise exception 'Invalid guest session.' using errcode = 'no_data_found';
  end if;

  -- ★ THE SNEAKY BLOCK (20260928120000): a blocked ticket attaches no address, in the private
  -- album's words, ahead of every other refusal.
  if public.event_block_holds_row(v_guest) then
    raise exception 'This event is private.' using errcode = 'check_violation';
  end if;
  -- ★ THE DOOR (20260929120000), in the same words: a ticket waiting on the host, or at an album that
  -- went Only me, attaches nothing.
  if v_guest.admission = 'waiting' or exists (
    select 1 from public.events e
     where e.id = v_guest.event_id and e.visibility = 'private' and e.gate is null
  ) then
    raise exception 'This event is private.' using errcode = 'check_violation';
  end if;

  -- A verified guest's address is their account's. Refusing beats storing a second one that can
  -- disagree with it (the one precedence rule, as with the name).
  if v_guest.verified_at is not null then
    raise exception 'Your email comes from your account.' using errcode = 'check_violation';
  end if;

  v_pending := lower(nullif(btrim(coalesce(p_email, '')), ''));

  -- Blank DETACHES. Both columns go, so the row falls back to level 1 (a typed name, "Unverified")
  -- and no future claim can reach it. This is the guest's own door out, and it is deliberately not
  -- an error: "clear it" and "set it to nothing" are the same intent.
  if v_pending is null then
    update public.guests
       set pending_email = null,
           pending_email_at = null
     where id = v_guest.id;
    return jsonb_build_object('guest_id', v_guest.id, 'email_attached', false);
  end if;

  -- The same belt as create_guest, covering the whole CHECK so nothing reaches it as a raw 23514.
  if char_length(v_pending) not between 3 and 254 or position('@' in v_pending) <= 1 then
    raise exception 'That email address does not look right.' using errcode = 'check_violation';
  end if;

  update public.guests
     set pending_email = v_pending,
         pending_email_at = now()
   where id = v_guest.id;

  -- WHETHER, never WHAT (see create_guest's payload).
  return jsonb_build_object('guest_id', v_guest.id, 'email_attached', true);
end;
$$;

revoke execute on function public.set_guest_pending_email(text, text) from public, anon, authenticated;
grant execute on function public.set_guest_pending_email(text, text) to service_role;

-- =============================================================================================
-- 8f. like_media: someone past a gate likes there.
-- =============================================================================================
-- Carried from 20260929100000 but for the guest arm's door: an open album's signed-in viewers like as
-- before, and a password album's and now a gated album's guests like when they are past its door (an
-- 'in' row of theirs, no block). ★ ONLY ME STILL LIKES NOTHING BUT ITS HOST (like_private's rule): it
-- is stored private with no gate, which neither arm names, so its every guest gets the one not_found
-- a blocked account gets. like_many sends every id through here, so the bulk Like follows. Same
-- signature, same RETURNS, same grants.
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

revoke all on function public.like_media(uuid) from public, anon;
grant execute on function public.like_media(uuid) to authenticated;

-- =============================================================================================
-- 8g. The two kinds of claim: only a row past the door.
-- =============================================================================================
-- The four claims, each carried from 20260928120000 with one clause more: a row the door has not let
-- through ('waiting') is not the caller's to claim, list or release, so a claim can only ever carry an
-- admission the door already gave, never make one. (A waiting row is always a confirmed account's, so
-- no unclaimed one exists today: this is the belt, and the door's re-check on both claims.) Every
-- signature, RETURNS type and grant is today's.
create or replace function public.claim_anonymous_uploads(p_session_tokens text[])
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_email text;
  v_confirmed timestamptz;
  v_name text;
  v_count integer;
begin
  -- Defense-in-depth (the grant already excludes anon); a missing session claims nothing.
  if v_uid is null then return 0; end if;
  if p_session_tokens is null or cardinality(p_session_tokens) = 0 then return 0; end if;
  -- Sanity ceiling: ~1 token per event attended; no real browser holds 1000. Bounds the array probe.
  if cardinality(p_session_tokens) > 1000 then
    raise exception 'Too many tokens.' using errcode = 'program_limit_exceeded';
  end if;

  select u.email, u.email_confirmed_at into v_email, v_confirmed
  from auth.users u where u.id = v_uid;
  -- The stored form, exactly as create_guest writes guests.email at a confirmed mint.
  v_email := nullif(btrim(coalesce(v_email, '')), '');

  if v_confirmed is not null and v_email is not null then
    -- The naming rule, as in claim_guest_rows_by_email: a NAMELESS profile takes the name off the
    -- most recently created row being claimed, and a named profile is never overwritten.
    if exists (select 1 from public.profiles p where p.id = v_uid and p.display_name is null) then
      select g.display_name into v_name
      from public.guests g
      where g.session_token = any (p_session_tokens)
        and g.user_id is null
        and g.admission = 'in'
        and g.display_name is not null
        and not public.event_block_holds_row(g)
        and not public.event_block_holds_account(g.event_id, v_uid)
      order by g.created_at desc
      limit 1;

      if v_name is not null then
        update public.profiles
           set display_name = v_name
         where id = v_uid and display_name is null;
      end if;
    end if;

    -- ★ GUEST BY UPLOAD (2026-09-23): the stamp is unchanged; the count is of stamped rows that
    -- carry a live upload (the RETURNING ids, then one EXISTS each).
    -- ★ THE SNEAKY BLOCK (20260928120000): a ticket a block holds, and every ticket at an event that
    -- blocked this caller, stays unclaimed (the person cannot claim), and the name above comes only
    -- from a row this update will stamp.
    -- ★ THE DOOR (20260929120000): only a ticket past the door, so a claim carries no one through a gate.
    with claimed as (
      update public.guests g
         set user_id = v_uid,
             verified_at = now(),
             email = v_email,
             pending_email = null,
             pending_email_at = null,
             display_name = null
       where g.session_token = any (p_session_tokens)
         and g.user_id is null
         and g.admission = 'in'
         and not public.event_block_holds_row(g)
         and not public.event_block_holds_account(g.event_id, v_uid)
      returning id
    )
    select count(*)::integer into v_count
      from claimed c
     where exists (
       select 1 from public.media m where m.guest_id = c.id and m.status <> 'removed'
     );
  else
    -- Unchanged from 20260609120000: an unconfirmed session stamps ownership and nothing else.
    -- ★ Counted the same way as the arm above (GUEST BY UPLOAD, 2026-09-23).
    with claimed as (
      update public.guests g
         set user_id = v_uid
       where g.session_token = any (p_session_tokens)
         and g.user_id is null
         and g.admission = 'in'
         and not public.event_block_holds_row(g)
         and not public.event_block_holds_account(g.event_id, v_uid)
      returning id
    )
    select count(*)::integer into v_count
      from claimed c
     where exists (
       select 1 from public.media m where m.guest_id = c.id and m.status <> 'removed'
     );
  end if;

  return coalesce(v_count, 0);
end;
$$;

revoke all on function public.claim_anonymous_uploads(text[]) from public, anon;
grant execute on function public.claim_anonymous_uploads(text[]) to authenticated;

create or replace function public.list_guest_rows_by_email(
  p_after_at timestamptz default null,
  p_after_id uuid default null,
  p_limit integer default null
)
returns table (
  guest_id uuid,
  event_id uuid,
  event_name text,
  event_date date,
  display_name text,
  upload_count integer,
  last_upload_at timestamptz,
  pending_email_at timestamptz,
  event_visibility public.event_visibility,
  preview_keys text[]
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_email text;
  v_confirmed timestamptz;
begin
  -- Defense in depth (the grant already excludes anon); a missing session lists nothing.
  if v_uid is null then return; end if;

  select u.email, u.email_confirmed_at into v_email, v_confirmed
  from auth.users u where u.id = v_uid;
  -- ★ TWO FORMS OF ONE ADDRESS, deliberately. `v_email` stays in the form auth.users holds, which
  -- is the form guests.email is written in (create_guest trims and never case-folds it); the LOOKUP
  -- key is `lower(v_email)`, because pending_email is stored normalised. Case-folding the stored
  -- form instead would drift this schema's one confirmed-address column away from its readers.
  v_email := nullif(btrim(coalesce(v_email, '')), '');

  -- UNCONFIRMED CALLERS GET NOTHING. His level 2: "no way to see uploads across events from email
  -- prior to verification for anyone" — the address owner included, until they prove it.
  if v_confirmed is null or v_email is null then return; end if;

  return query
  select g.id,
         e.id,
         e.name,
         -- QA #40's rule, applied to this surface: a gated event's metadata stays gated.
         case when e.visibility = 'password' then null else e.event_date end,
         g.display_name,
         coalesce(m.n, 0)::integer,
         m.last_at,
         g.pending_email_at,
         e.visibility,
         -- ★ THE ROW'S OWN PHOTOGRAPHS, AND ONLY WHAT ITS ALBUM SHOWS ANYONE (the claims review's
         -- cards, 2026-09-27): a gated album answers null, whatever the lateral below found.
         case when e.visibility = 'open' then coalesce(p.keys, '{}'::text[]) end
  from public.guests g
  join public.events e on e.id = g.event_id and e.deleted_at is null
  -- The count is what the claim (or the disown) would actually move: a row the guest already
  -- withdrew is not part of the offer, so `removed` is out.
  left join lateral (
    select count(*)::integer as n, max(x.created_at) as last_at
    from public.media x
    where x.guest_id = g.id and x.status <> 'removed'
  ) m on true
  -- The previews: at most four, newest first, each an approved and live photograph (or a video's
  -- frame) with a preview, on an open album only. Approved rather than merely live: a held or hidden
  -- upload is one its album shows nobody yet, and an address is not proof she took it.
  left join lateral (
    select array_agg(s.preview_key order by s.created_at desc, s.id desc) as keys
    from (
      select y.preview_key, y.created_at, y.id
      from public.media y
      where y.guest_id = g.id
        and e.visibility = 'open'
        and y.status = 'approved'
        and y.removed_at is null
        and y.preview_key is not null
      order by y.created_at desc, y.id desc
      limit 4
    ) s
  ) p on true
  where g.pending_email = lower(v_email)
    and g.user_id is null
    -- ★ THE DOOR (20260929120000): only a row past it.
    and g.admission = 'in'
    -- ★ THE SNEAKY BLOCK (20260928120000): never a row a block holds, nor any at an event that blocked
    -- the caller.
    and not public.event_block_holds_row(g)
    and not public.event_block_holds_account(e.id, v_uid)
    -- ★ ROW CAP (2026-09-24): the keyset, on the order below.
    and (p_after_at is null
         or (coalesce(m.last_at, g.created_at), g.id) < (p_after_at, p_after_id))
    and g.verified_at is null
    -- ★ GUEST BY UPLOAD (2026-09-23): a row with no live upload is nobody's attendance, so the card
    -- never offers it (an aggregate over no rows counts 0, never null).
    and m.n > 0
  order by coalesce(m.last_at, g.created_at) desc, g.id desc
  limit case when p_limit is null then null else least(p_limit, 1000) end;
end;
$$;

revoke all on function public.list_guest_rows_by_email(timestamptz, uuid, integer) from public, anon, authenticated;
grant execute on function public.list_guest_rows_by_email(timestamptz, uuid, integer) to authenticated;

create or replace function public.claim_guest_rows_by_email(p_event_ids uuid[] default null)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_email text;
  v_confirmed timestamptz;
  v_name text;
  v_count integer;
begin
  if v_uid is null then return 0; end if;

  select u.email, u.email_confirmed_at into v_email, v_confirmed
  from auth.users u where u.id = v_uid;
  -- The stored form for guests.email; lower(v_email) is the pending_email lookup key (see
  -- list_guest_rows_by_email for why the two are kept apart).
  v_email := nullif(btrim(coalesce(v_email, '')), '');
  -- An unconfirmed caller claims nothing: the confirmation IS the proof of ownership.
  if v_confirmed is null or v_email is null then return 0; end if;

  -- NULL means "all of mine" (the Claim all shortcut). A named set is bounded, like every other
  -- array parameter in this schema.
  if p_event_ids is not null and cardinality(p_event_ids) > 200 then
    raise exception 'Too many events.' using errcode = 'program_limit_exceeded';
  end if;

  -- The naming rule, BEFORE the update — afterwards the typed names are gone.
  if exists (select 1 from public.profiles p where p.id = v_uid and p.display_name is null) then
    select g.display_name into v_name
    from public.guests g
    where g.pending_email = lower(v_email)
      and g.user_id is null
      and g.verified_at is null
      and g.admission = 'in'
      and g.display_name is not null
      and (p_event_ids is null or g.event_id = any(p_event_ids))
      -- ★ GUEST BY UPLOAD (2026-09-23): the name comes only from a row this call will claim.
      and (p_event_ids is not null or exists (
        select 1 from public.media x where x.guest_id = g.id and x.status <> 'removed'
      ))
      and not public.event_block_holds_row(g)
      and not public.event_block_holds_account(g.event_id, v_uid)
    order by g.created_at desc
    limit 1;

    if v_name is not null then
      update public.profiles
         set display_name = v_name
       where id = v_uid and display_name is null;
    end if;
  end if;

  update public.guests g
     set user_id = v_uid,
         verified_at = now(),
         email = v_email,
         pending_email = null,
         pending_email_at = null,
         display_name = null
   where g.pending_email = lower(v_email)
     and g.user_id is null
     and g.verified_at is null
     -- ★ THE DOOR (20260929120000): only a row past it, so a claim carries no one through a gate.
     and g.admission = 'in'
     and (p_event_ids is null or g.event_id = any(p_event_ids))
     -- ★ GUEST BY UPLOAD (2026-09-23), the one change to this body: Claim all takes only a row with
     -- a live upload, exactly the rows the card listed; an empty row keeps its address untouched.
     and (p_event_ids is not null or exists (
       select 1 from public.media x where x.guest_id = g.id and x.status <> 'removed'
     ))
     -- ★ THE SNEAKY BLOCK (20260928120000): never a row a block holds, nor any at an event that
     -- blocked the caller, and so never the name either (the select above reads the same rows).
     and not public.event_block_holds_row(g)
     and not public.event_block_holds_account(g.event_id, v_uid);

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.claim_guest_rows_by_email(uuid[]) from public, anon;
grant execute on function public.claim_guest_rows_by_email(uuid[]) to authenticated;

create or replace function public.disown_guest_rows_by_email(p_event_ids uuid[])
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_email text;
  v_confirmed timestamptz;
  v_count integer;
begin
  if v_uid is null then return 0; end if;

  select u.email, u.email_confirmed_at into v_email, v_confirmed
  from auth.users u where u.id = v_uid;
  v_email := nullif(btrim(coalesce(v_email, '')), '');
  if v_confirmed is null or v_email is null then return 0; end if;

  -- ★ NO IMPLICIT "ALL" ON A DESTRUCTIVE CALL. claim_ reads NULL as "every event of mine"; here the
  -- same shorthand would delete every upload the caller ever made from an unclaimed row, so an
  -- unnamed set is a loud refusal rather than a quiet no-op a caller could mistake for success.
  if p_event_ids is null or cardinality(p_event_ids) = 0 then
    raise exception 'Name the events to release.' using errcode = 'check_violation';
  end if;
  if cardinality(p_event_ids) > 200 then
    raise exception 'Too many events.' using errcode = 'program_limit_exceeded';
  end if;

  -- Soft-remove every still-live upload of those rows. `removed_at` is coalesced so a repeat call
  -- never extends how long the bytes linger, and `purge_at` is NOT set here: the media_set_purge_at
  -- BEFORE trigger derives it, and media_derive_removal_provenance stamps status_before_removed, on
  -- this very UPDATE. The `or removed_by_uploader = false` arm re-marks a row the HOST binned, so a
  -- disowned upload can never be restored out of the host's trash.
  update public.media m
     set status = 'removed',
         removed_at = coalesce(m.removed_at, now()),
         removed_by_uploader = true
    from public.guests g
   where g.id = m.guest_id
     and g.pending_email = lower(v_email)
     and g.user_id is null
     and g.admission = 'in'
     and g.event_id = any(p_event_ids)
     and (m.status <> 'removed' or m.removed_by_uploader = false)
     -- ★ THE SNEAKY BLOCK (20260928120000): what a block removed stays the host's to restore.
     and not public.event_block_holds_row(g)
     and not public.event_block_holds_account(g.event_id, v_uid);

  -- Then detach the address. The row, its typed name and its forensic trail stay.
  update public.guests g
     set pending_email = null,
         pending_email_at = null
   where g.pending_email = lower(v_email)
     and g.user_id is null
     and g.admission = 'in'
     and g.event_id = any(p_event_ids)
     and not public.event_block_holds_row(g)
     and not public.event_block_holds_account(g.event_id, v_uid);

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.disown_guest_rows_by_email(uuid[]) from public, anon;
grant execute on function public.disown_guest_rows_by_email(uuid[]) to authenticated;

-- =============================================================================================
-- THE ROLLED-BACK CHECK. Proved on the live schema BEFORE applying (database-security.md, "An
-- unapplied migration is proved on the live schema"): ONE execute_sql call of `begin;`, this file's
-- statements verbatim, then
--   create temp table doors_proof (step text, ok boolean, detail text);
--   create temp table ctx (event_id uuid, host_id uuid, other_id uuid);
--   insert into ctx values (<an existing test event>, <its host>, <another host>);
-- the block below, `select step, ok, detail from doors_proof;` and `rollback;`. The block traps its own
-- failure into the proof table, so the rollback always runs, and the call answers the rows. It rides an
-- EXISTING event (creating one trips enforce_event_limit), turned Public and names-only inside the
-- transaction, and makes its own people: accounts already in (A, B), a typed name already in (N, by its
-- ticket), newcomers who wait (W, V), a declined one (D), one on the list (L), one off it (U), one at the
-- closed door (C), one past the password (P) and one unconfirmed (Q). It proves, as each would call it:
-- the grants; the two shapes a door can never take; each door in turn (closed, a block, approve, the
-- invite list, the password, Only me), refusing every newcomer on every path in the private album's
-- words while someone already in passes; the host's four acts and their refusals to another host and
-- anon; the door opening; the Videos switch and the picker's flag; and a claim carrying no one through.
--
-- Held on 2026-09-29 against the live schema (event 14bb4318-80cd-4eed-b219-92c097ee16c7; afterwards no
-- new column, table or function existed, get_event_by_qr_token read 88c98ced3318b420e9fd2bce367bebfe,
-- and the event, its guests and auth.users read unchanged: nothing persisted):
--   setup           | t | event 14bb4318-80cd-4eed-b219-92c097ee16c7, host 6cb5fdb5-ac8a-4c82-83ce-59b5a2cfcd0b, other 3fcf6405-ce4d-46ea-a11c-9ed68194b630; baseline in 9
--   grants          | t | the list RLS and select-only; gate ungranted, allow_videos granted; the acts authenticated; the reads and the ask service role; the anon reads kept, the whole ACL restated
--   the refusals    | t | no gate on a Public album, no approve without the email step; another host not_found on all four acts; a bad door and a password with none refused; anon refused the acts, the standing and the list
--   closed          | t | stored private + closed; anon and a guest read it as a private album, the host as theirs; A (account) and N (ticket) in, C out; no newcomer minted, A's second device minted in; N adds and renames, A likes, C not_found
--   the block       | t | B, who was in: blocked, was_in, not in; no rejoin, no upload, no like, in the private album's words
--   approve         | t | the email step held on; W minted waiting, her account and her ticket read waiting, no upload, address or like; A passes; a typed name asked to confirm; D declined is a block, cannot ask again or be let in here; the counts, the queue and the host's tally; the check-in stamps hers alone; let in, once
--   invite          | t | a paste normalised and counted (2 added, 3 unreadable), the cap at 500 and 2,000 a call; RLS scopes the list; L listed comes in and reads joined; U told to ask, asks, waits, is let in; a listed ask is in; declined, unconfirmed and the host refused; unlisted, L stays in
--   password        | t | set_event_password clears the gate; A in passes without it, P needs it then comes in; A's ticket adds; the password verifies; P likes
--   only me         | t | stored private with no gate; A was in and reads it; no mint, upload, rename or like; the host likes
--   the door opens  | t | Public lets the one waiting in (counted); a declined newcomer stays held by her block
--   videos          | t | the host writes the switch through its grant; the flag, the advisory and the refusal follow it; photos still land
--   the claims      | t | a waiting row is out of both claims (token, list, claim, disown) and C stays out; the standing bounds its tickets and knows an unknown event
-- =============================================================================================
-- do $$
-- declare
--   v_event uuid; v_host uuid; v_other uuid; v_qr text;
--   u_a uuid := gen_random_uuid(); u_b uuid := gen_random_uuid(); u_w uuid := gen_random_uuid();
--   u_d uuid := gen_random_uuid(); u_l uuid := gen_random_uuid(); u_u uuid := gen_random_uuid();
--   u_c uuid := gen_random_uuid(); u_p uuid := gen_random_uuid(); u_v uuid := gen_random_uuid();
--   u_q uuid := gen_random_uuid();
--   e_a text := 'doors-a-' || substr(md5(random()::text), 1, 8) || '@example.test';
--   e_b text := 'doors-b-' || substr(md5(random()::text), 1, 8) || '@example.test';
--   e_w text := 'doors-w-' || substr(md5(random()::text), 1, 8) || '@example.test';
--   e_d text := 'doors-d-' || substr(md5(random()::text), 1, 8) || '@example.test';
--   e_l text := 'doors-l-' || substr(md5(random()::text), 1, 8) || '@example.test';
--   e_u text := 'doors-u-' || substr(md5(random()::text), 1, 8) || '@example.test';
--   e_c text := 'doors-c-' || substr(md5(random()::text), 1, 8) || '@example.test';
--   e_p text := 'doors-p-' || substr(md5(random()::text), 1, 8) || '@example.test';
--   e_v text := 'doors-v-' || substr(md5(random()::text), 1, 8) || '@example.test';
--   e_q text := 'doors-q-' || substr(md5(random()::text), 1, 8) || '@example.test';
--   t_n text := md5('n' || random()) || md5('n2' || random());
--   t_x text := md5('x' || random()) || md5('x2' || random());
--   t_a text; t_a2 text; t_b text; t_w text; t_d text; t_u text; t_l text; t_v text;
--   g_n uuid; g_a uuid; g_b uuid; g_w uuid; g_d uuid; g_u uuid; g_v uuid; g_x uuid;
--   m_host uuid; m_a uuid; m_b uuid; m_n uuid;
--   v jsonb; v_n integer; v_txt text; v_bool boolean;
--   base_in integer; base_by_name integer;
--   v_step text := 'setup';
-- begin
--   select event_id, host_id, other_id into v_event, v_host, v_other from ctx;
--   select qr_token into v_qr from public.events where id = v_event and deleted_at is null;
--   if v_qr is null then raise exception 'SETUP: no event'; end if;
--   -- Public, names-only, uploads open, no password: the door every row below walked through.
--   update public.events set visibility = 'open', gate = null, require_verified_email = false,
--          accepting_uploads = true, require_upload_to_view = false, event_password_hash = null,
--          allow_videos = true, moderation_mode = 'live'
--    where id = v_event;
--
--   insert into auth.users (id, email, email_confirmed_at) values
--     (u_a, e_a, now()), (u_b, e_b, now()), (u_w, e_w, now()), (u_d, e_d, now()), (u_l, e_l, now()),
--     (u_u, e_u, now()), (u_c, e_c, now()), (u_p, e_p, now()), (u_v, e_v, now()), (u_q, e_q, null);
--   insert into public.profiles (id, email, display_name) values
--     (u_a, e_a, 'Ada Already'), (u_b, e_b, 'Bo Blocked'), (u_w, e_w, 'Wren Waiting'),
--     (u_d, e_d, 'Dee Declined'), (u_l, e_l, 'Lou Listed'), (u_u, e_u, 'Una Unlisted'),
--     (u_c, e_c, 'Cy Closed'), (u_p, e_p, 'Pia Password'), (u_v, e_v, 'Vi Opened'), (u_q, e_q, 'Quin Unconfirmed')
--     on conflict (id) do update set display_name = excluded.display_name;
--
--   select (public.event_door_counts(v_event) ->> 'in')::int, (public.event_door_counts(v_event) ->> 'in_by_name')::int
--     into base_in, base_by_name;
--
--   -- Everyone already in joined at the Public door: a typed name (N, its ticket) and two accounts.
--   insert into public.guests (event_id, session_token, display_name)
--     values (v_event, t_n, 'Nell Name') returning id into g_n;
--   set local role service_role;
--   v := public.create_guest(v_qr, u_a);
--   if v ->> 'admission' <> 'in' or not (v ->> 'verified')::boolean then raise exception 'FAIL: A''s Public join %', v; end if;
--   t_a := v ->> 'session_token'; g_a := (v ->> 'guest_id')::uuid;
--   v := public.create_guest(v_qr, u_b);
--   t_b := v ->> 'session_token'; g_b := (v ->> 'guest_id')::uuid;
--   reset role;
--   if (select admission from public.guests where id = g_n) <> 'in' then raise exception 'FAIL: a row minted before the door read other than in'; end if;
--   insert into public.media (event_id, guest_id, type, original_key, file_size_bytes, status)
--     values (v_event, null, 'photo', 'events/' || v_event || '/doors-host', 100, 'approved') returning id into m_host;
--   insert into public.media (event_id, guest_id, type, original_key, file_size_bytes, status)
--     values (v_event, g_a, 'photo', 'events/' || v_event || '/doors-a', 100, 'approved') returning id into m_a;
--   insert into public.media (event_id, guest_id, type, original_key, file_size_bytes, status)
--     values (v_event, g_b, 'photo', 'events/' || v_event || '/doors-b', 100, 'approved') returning id into m_b;
--   insert into public.media (event_id, guest_id, type, original_key, file_size_bytes, status)
--     values (v_event, g_n, 'photo', 'events/' || v_event || '/doors-n', 100, 'approved') returning id into m_n;
--   insert into doors_proof values ('setup', true, format('event %s, host %s, other %s; baseline in %s', v_event, v_host, v_other, base_in));
--
--   -- ── 1. The grants. ──
--   v_step := 'grants';
--   if not (select relrowsecurity from pg_class where oid = 'public.event_invites'::regclass)
--      or has_table_privilege('anon', 'public.event_invites', 'select')
--      or not has_table_privilege('authenticated', 'public.event_invites', 'select')
--      or has_table_privilege('authenticated', 'public.event_invites', 'insert')
--      or has_table_privilege('authenticated', 'public.event_invites', 'update')
--      or has_table_privilege('authenticated', 'public.event_invites', 'delete') then
--     raise exception 'FAIL: event_invites grants';
--   end if;
--   if has_column_privilege('authenticated', 'public.events', 'gate', 'UPDATE')
--      or has_column_privilege('authenticated', 'public.events', 'gate', 'INSERT')
--      or not has_column_privilege('authenticated', 'public.events', 'allow_videos', 'UPDATE')
--      or not has_column_privilege('authenticated', 'public.events', 'allow_videos', 'INSERT')
--      or not has_column_privilege('authenticated', 'public.events', 'visibility', 'UPDATE')
--      or has_column_privilege('anon', 'public.events', 'allow_videos', 'UPDATE') then
--     raise exception 'FAIL: events column grants';
--   end if;
--   for v_txt in select unnest(array[
--       'public.set_event_door(uuid, text)', 'public.let_in_at_door(uuid, uuid)',
--       'public.add_event_invites(uuid, text[])', 'public.remove_event_invite(uuid, text)',
--       'public.set_event_password(uuid, text)', 'public.like_media(uuid)',
--       'public.claim_anonymous_uploads(text[])', 'public.list_guest_rows_by_email(timestamptz, uuid, integer)',
--       'public.claim_guest_rows_by_email(uuid[])', 'public.disown_guest_rows_by_email(uuid[])']) loop
--     if has_function_privilege('anon', v_txt, 'execute') or not has_function_privilege('authenticated', v_txt, 'execute') then
--       raise exception 'FAIL: % is not authenticated-only', v_txt;
--     end if;
--   end loop;
--   for v_txt in select unnest(array[
--       'public.event_door_standing(uuid, uuid, text[])', 'public.event_door_check_in(uuid, uuid, text[])',
--       'public.event_door_counts(uuid)', 'public.event_door_queue(uuid)', 'public.event_invite_list(uuid)',
--       'public.host_door_waiting(uuid)', 'public.event_door_account_in(uuid, uuid)',
--       'public.event_door_lists_account(uuid, uuid)', 'public.ask_to_join(text, uuid)',
--       'public.create_guest(text, uuid, boolean, text, text)',
--       'public.create_media(text, uuid, public.media_type, text, bigint, text, double precision, integer, integer, boolean)',
--       'public.set_guest_display_name(text, text)', 'public.set_guest_pending_email(text, text)']) loop
--     if has_function_privilege('anon', v_txt, 'execute') or has_function_privilege('authenticated', v_txt, 'execute')
--        or not has_function_privilege('service_role', v_txt, 'execute') then
--       raise exception 'FAIL: % is not service-role only', v_txt;
--     end if;
--   end loop;
--   if has_function_privilege('anon', 'public.events_door_opened()', 'execute')
--      or has_function_privilege('authenticated', 'public.events_door_opened()', 'execute') then
--     raise exception 'FAIL: a client role runs the door trigger';
--   end if;
--   for v_txt in select unnest(array['public.get_event_by_qr_token(text)', 'public.get_upload_context(text, public.media_type)']) loop
--     if not has_function_privilege('anon', v_txt, 'execute') or not has_function_privilege('authenticated', v_txt, 'execute') then
--       raise exception 'FAIL: % lost its anon read', v_txt;
--     end if;
--   end loop;
--   if not has_function_privilege('public', 'public.get_event_by_qr_token(text)', 'execute')
--      or not has_function_privilege('service_role', 'public.get_event_by_qr_token(text)', 'execute') then
--     raise exception 'FAIL: get_event_by_qr_token''s ACL was not restated whole';
--   end if;
--   insert into doors_proof values ('grants', true, 'the list RLS and select-only; gate ungranted, allow_videos granted; the acts authenticated; the reads and the ask service role; the anon reads kept, the whole ACL restated');
--
--   -- ── 2. The shapes a door can never take, and the setter's refusals. ──
--   v_step := 'the refusals';
--   begin
--     update public.events set gate = 'closed' where id = v_event;
--     raise exception 'FAIL: a Public album took a gate';
--   exception when check_violation then null;
--   end;
--   begin
--     update public.events set visibility = 'private', gate = 'approve', require_verified_email = false where id = v_event;
--     raise exception 'FAIL: approve took no email step';
--   exception when check_violation then null;
--   end;
--   perform set_config('request.jwt.claims', json_build_object('sub', v_other, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v := public.set_event_door(v_event, 'closed');
--   if v ->> 'reason' is distinct from 'not_found' then raise exception 'FAIL: another host set the door: %', v; end if;
--   v := public.let_in_at_door(v_event, g_a);
--   if v ->> 'reason' is distinct from 'not_found' then raise exception 'FAIL: another host let in: %', v; end if;
--   v := public.add_event_invites(v_event, array[e_c]);
--   if v ->> 'reason' is distinct from 'not_found' then raise exception 'FAIL: another host listed: %', v; end if;
--   v := public.remove_event_invite(v_event, e_c);
--   if v ->> 'reason' is distinct from 'not_found' then raise exception 'FAIL: another host unlisted: %', v; end if;
--   reset role;
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v := public.set_event_door(v_event, 'ajar');
--   if v ->> 'reason' is distinct from 'bad_door' then raise exception 'FAIL: a door that is not one: %', v; end if;
--   v := public.set_event_door(v_event, 'password');
--   if v ->> 'reason' is distinct from 'no_password' then raise exception 'FAIL: a password door with no password: %', v; end if;
--   reset role;
--   perform set_config('request.jwt.claims', '', true);
--   set local role anon;
--   begin
--     perform public.set_event_door(v_event, 'closed');
--     raise exception 'FAIL: anon ran set_event_door';
--   exception when insufficient_privilege then null;
--   end;
--   begin
--     perform public.let_in_at_door(v_event, g_a);
--     raise exception 'FAIL: anon ran let_in_at_door';
--   exception when insufficient_privilege then null;
--   end;
--   begin
--     perform public.event_door_standing(v_event, null, null);
--     raise exception 'FAIL: anon read the standing';
--   exception when insufficient_privilege then null;
--   end;
--   begin
--     perform count(*) from public.event_invites;
--     raise exception 'FAIL: anon read the list';
--   exception when insufficient_privilege then null;
--   end;
--   reset role;
--   insert into doors_proof values ('the refusals', true, 'no gate on a Public album, no approve without the email step; another host not_found on all four acts; a bad door and a password with none refused; anon refused the acts, the standing and the list');
--
--   -- ── 3. Closed to newcomers. ──
--   v_step := 'closed';
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v := public.set_event_door(v_event, 'closed');
--   reset role;
--   if not (v ->> 'ok')::boolean or v ->> 'door' <> 'closed' or (v ->> 'email_held')::boolean then raise exception 'FAIL: set closed %', v; end if;
--   if (select visibility::text || '/' || gate::text from public.events where id = v_event) <> 'private/closed' then
--     raise exception 'FAIL: closed is not stored as a private album with its gate';
--   end if;
--   -- The anon read answers a gated album as a private one to everyone but its host.
--   perform set_config('request.jwt.claims', '', true);
--   set local role anon;
--   select row_to_json(x)::jsonb into v from public.get_event_by_qr_token(v_qr) x;
--   reset role;
--   if v ->> 'visibility' <> 'private' or v ->> 'name' is not null or v ->> 'host_display_name' is not null then
--     raise exception 'FAIL: anon read the closed album as %', v;
--   end if;
--   perform set_config('request.jwt.claims', json_build_object('sub', u_a, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   select row_to_json(x)::jsonb into v from public.get_event_by_qr_token(v_qr) x;
--   reset role;
--   if v ->> 'visibility' <> 'private' or v ->> 'name' is not null then raise exception 'FAIL: a guest read the closed album as %', v; end if;
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   select row_to_json(x)::jsonb into v from public.get_event_by_qr_token(v_qr) x;
--   reset role;
--   if v ->> 'name' is null or not (v ->> 'accepts_video')::boolean then raise exception 'FAIL: the host read their own album as %', v; end if;
--   set local role service_role;
--   v := public.event_door_standing(v_event, u_a, null);
--   if v ->> 'door' <> 'closed' or not (v ->> 'in')::boolean or not (v ->> 'was_in')::boolean or (v ->> 'host')::boolean then
--     raise exception 'FAIL: A''s standing at closed %', v;
--   end if;
--   v := public.event_door_standing(v_event, null, array[t_n]);
--   if not (v ->> 'in')::boolean then raise exception 'FAIL: N''s ticket at closed %', v; end if;
--   v := public.event_door_standing(v_event, u_c, null);
--   if (v ->> 'in')::boolean or (v ->> 'waiting')::boolean or (v ->> 'was_in')::boolean or not (v ->> 'confirmed')::boolean then
--     raise exception 'FAIL: C''s standing at closed %', v;
--   end if;
--   v := public.event_door_standing(v_event, v_host, null);
--   if not (v ->> 'host')::boolean then raise exception 'FAIL: the host''s standing %', v; end if;
--   begin
--     perform public.create_guest(v_qr, u_c);
--     raise exception 'FAIL: closed minted a newcomer';
--   exception when check_violation then
--     if sqlerrm <> 'This event is private.' then raise; end if;
--   end;
--   begin
--     perform public.create_guest(v_qr, null, false, 'Pat Passerby');
--     raise exception 'FAIL: closed minted a typed name';
--   exception when check_violation then
--     if sqlerrm <> 'This event is private.' then raise; end if;
--   end;
--   v := public.create_guest(v_qr, u_a);
--   if v ->> 'admission' <> 'in' then raise exception 'FAIL: A''s second device at closed %', v; end if;
--   t_a2 := v ->> 'session_token';
--   if public.get_upload_context(t_a, 'photo') ->> 'visibility' <> 'open'
--      or public.get_upload_context(t_n, 'photo') ->> 'visibility' <> 'open' then
--     raise exception 'FAIL: a ticket already in reads the closed album as closed';
--   end if;
--   v := public.create_media(t_n, gen_random_uuid(), 'photo', 'events/' || v_event || '/doors-n2', 100);
--   if v ->> 'status' <> 'approved' then raise exception 'FAIL: N could not add at closed %', v; end if;
--   v := public.set_guest_display_name(t_n, 'Nell Renamed');
--   reset role;
--   perform set_config('request.jwt.claims', json_build_object('sub', u_a, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v := public.like_media(m_host);
--   if not (v ->> 'ok')::boolean then raise exception 'FAIL: A could not like at closed %', v; end if;
--   reset role;
--   perform set_config('request.jwt.claims', json_build_object('sub', u_c, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v := public.like_media(m_host);
--   if v ->> 'reason' is distinct from 'not_found' then raise exception 'FAIL: C liked at closed %', v; end if;
--   reset role;
--   insert into doors_proof values ('closed', true, 'stored private + closed; anon and a guest read it as a private album, the host as theirs; A (account) and N (ticket) in, C out; no newcomer minted, A''s second device minted in; N adds and renames, A likes, C not_found');
--
--   -- ── 4. A block shuts out someone already in, as Only me does. ──
--   v_step := 'the block';
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v := public.block_from_event(p_event_id := v_event, p_user_id := u_b);
--   reset role;
--   if not (v ->> 'ok')::boolean then raise exception 'FAIL: block B %', v; end if;
--   set local role service_role;
--   v := public.event_door_standing(v_event, u_b, array[t_b]);
--   if not (v ->> 'blocked')::boolean or (v ->> 'in')::boolean or not (v ->> 'was_in')::boolean then
--     raise exception 'FAIL: B''s standing %', v;
--   end if;
--   begin
--     perform public.create_guest(v_qr, u_b);
--     raise exception 'FAIL: a blocked account rejoined';
--   exception when check_violation then
--     if sqlerrm <> 'This event is private.' then raise; end if;
--   end;
--   if public.get_upload_context(t_b, 'photo') ->> 'visibility' <> 'private' then raise exception 'FAIL: B''s ticket adds'; end if;
--   reset role;
--   perform set_config('request.jwt.claims', json_build_object('sub', u_b, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v := public.like_media(m_host);
--   reset role;
--   if v ->> 'reason' is distinct from 'not_found' then raise exception 'FAIL: B liked %', v; end if;
--   insert into doors_proof values ('the block', true, 'B, who was in: blocked, was_in, not in; no rejoin, no upload, no like, in the private album''s words');
--
--   -- ── 5. The host lets each person in. ──
--   v_step := 'approve';
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v := public.set_event_door(v_event, 'approve');
--   reset role;
--   if not (v ->> 'email_held')::boolean or not (select require_verified_email from public.events where id = v_event) then
--     raise exception 'FAIL: approve did not hold the email step on %', v;
--   end if;
--   begin
--     update public.events set require_verified_email = false where id = v_event;
--     raise exception 'FAIL: the email step turned off under approve';
--   exception when check_violation then null;
--   end;
--   set local role service_role;
--   v := public.create_guest(v_qr, u_w);
--   if v ->> 'admission' <> 'waiting' then raise exception 'FAIL: W was not held %', v; end if;
--   t_w := v ->> 'session_token'; g_w := (v ->> 'guest_id')::uuid;
--   v := public.event_door_standing(v_event, u_w, null);
--   if not (v ->> 'waiting')::boolean or (v ->> 'in')::boolean or (v ->> 'was_in')::boolean or v ->> 'door' <> 'approve' then
--     raise exception 'FAIL: W''s standing %', v;
--   end if;
--   if not (public.event_door_standing(v_event, null, array[t_w]) ->> 'waiting')::boolean then
--     raise exception 'FAIL: W''s ticket alone did not read waiting';
--   end if;
--   if public.get_upload_context(t_w, 'photo') ->> 'visibility' <> 'private' then raise exception 'FAIL: a waiting ticket adds'; end if;
--   begin
--     perform public.create_media(t_w, gen_random_uuid(), 'photo', 'events/' || v_event || '/doors-w', 100);
--     raise exception 'FAIL: create_media took a waiting ticket';
--   exception when check_violation then
--     if sqlerrm <> 'This event is private.' then raise; end if;
--   end;
--   begin
--     perform public.set_guest_pending_email(t_w, 'w2@example.test');
--     raise exception 'FAIL: a waiting ticket attached an address';
--   exception when check_violation then
--     if sqlerrm <> 'This event is private.' then raise; end if;
--   end;
--   v := public.create_guest(v_qr, u_a);
--   if v ->> 'admission' <> 'in' then raise exception 'FAIL: A was held at approve %', v; end if;
--   -- The email step, held on, asks the typed name already in to confirm one (the existing flip).
--   begin
--     perform public.create_media(t_n, gen_random_uuid(), 'photo', 'events/' || v_event || '/doors-n3', 100);
--     raise exception 'FAIL: a typed name added past the email step';
--   exception when check_violation then
--     if sqlerrm <> 'This event is not accepting uploads without a verified email.' then raise; end if;
--   end;
--   -- D asks, and the host declines her: a decline is a block, so she cannot ask again.
--   v := public.create_guest(v_qr, u_d);
--   t_d := v ->> 'session_token'; g_d := (v ->> 'guest_id')::uuid;
--   v := public.event_door_check_in(v_event, u_w, null);
--   if not (v ->> 'waiting')::boolean or (select waiting_seen_at from public.guests where id = g_w) is null then
--     raise exception 'FAIL: the check-in %', v;
--   end if;
--   if (select waiting_seen_at from public.guests where id = g_d) is not null then raise exception 'FAIL: the check-in stamped someone else'; end if;
--   reset role;
--   perform set_config('request.jwt.claims', json_build_object('sub', u_w, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v := public.like_media(m_host);
--   reset role;
--   if v ->> 'reason' is distinct from 'not_found' then raise exception 'FAIL: W liked while waiting %', v; end if;
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v := public.block_from_event(p_guest_id := g_d);
--   if not (v ->> 'ok')::boolean or (v ->> 'removed')::int <> 0 then raise exception 'FAIL: decline D %', v; end if;
--   v := public.let_in_at_door(v_event, g_d);
--   if v ->> 'reason' is distinct from 'blocked' then raise exception 'FAIL: let in a declined newcomer %', v; end if;
--   reset role;
--   set local role service_role;
--   begin
--     perform public.create_guest(v_qr, u_d);
--     raise exception 'FAIL: a declined newcomer asked again';
--   exception when check_violation then
--     if sqlerrm <> 'This event is private.' then raise; end if;
--   end;
--   if not (public.event_door_standing(v_event, u_d, null) ->> 'blocked')::boolean then raise exception 'FAIL: D not blocked'; end if;
--   v := public.event_door_counts(v_event);
--   if (v ->> 'waiting')::int <> 1 or (v ->> 'in')::int <> base_in + 2 or (v ->> 'in_by_name')::int <> base_by_name + 1 then
--     raise exception 'FAIL: the counts %, baseline in %', v, base_in;
--   end if;
--   v := public.event_door_queue(v_event);
--   if (v ->> 'total')::int <> 1 or (v -> 'people' -> 0 ->> 'guest_id')::uuid <> g_w
--      or (v -> 'people' -> 0 ->> 'user_id')::uuid <> u_w or v -> 'people' -> 0 ->> 'email' <> lower(e_w)
--      or v -> 'people' -> 0 ->> 'name' <> 'Wren Waiting' or v -> 'people' -> 0 ->> 'seen_at' is null then
--     raise exception 'FAIL: the queue %', v;
--   end if;
--   if (public.host_door_waiting(v_host) ->> v_event::text)::int <> 1 then
--     raise exception 'FAIL: host_door_waiting %', public.host_door_waiting(v_host);
--   end if;
--   reset role;
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v := public.let_in_at_door(v_event, g_w);
--   if not (v ->> 'ok')::boolean or (v ->> 'admitted')::int <> 1 then raise exception 'FAIL: let W in %', v; end if;
--   v := public.let_in_at_door(v_event, g_w);
--   if not (v ->> 'already')::boolean then raise exception 'FAIL: a second let-in %', v; end if;
--   reset role;
--   set local role service_role;
--   v := public.event_door_standing(v_event, u_w, null);
--   if not (v ->> 'in')::boolean or (v ->> 'waiting')::boolean then raise exception 'FAIL: W after let-in %', v; end if;
--   if public.get_upload_context(t_w, 'photo') ->> 'visibility' <> 'open' then raise exception 'FAIL: W cannot add once in'; end if;
--   reset role;
--   insert into doors_proof values ('approve', true, 'the email step held on; W minted waiting, her account and her ticket read waiting, no upload, address or like; A passes; a typed name asked to confirm; D declined is a block, cannot ask again or be let in here; the counts, the queue and the host''s tally; the check-in stamps hers alone; let in, once');
--
--   -- ── 6. The invite list. ──
--   v_step := 'invite';
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v := public.set_event_door(v_event, 'invite');
--   if not (v ->> 'ok')::boolean then raise exception 'FAIL: set invite %', v; end if;
--   v := public.add_event_invites(v_event, array['  ' || upper(e_l) || ' ', e_l, 'not-an-address', 'a@', 'has space@example.test', e_c]);
--   if (v ->> 'added')::int <> 2 or (v ->> 'invalid')::int <> 3 or (v ->> 'already')::int <> 0 or (v ->> 'total')::int <> 2 then
--     raise exception 'FAIL: the first paste %', v;
--   end if;
--   v := public.add_event_invites(v_event, array[e_l]);
--   if (v ->> 'added')::int <> 0 or (v ->> 'already')::int <> 1 then raise exception 'FAIL: a second add %', v; end if;
--   v := public.add_event_invites(v_event, array(select 'cap-' || i || '@example.test' from generate_series(1, 600) i));
--   if (v ->> 'added')::int <> 498 or (v ->> 'over_cap')::int <> 102 or (v ->> 'total')::int <> 500 then
--     raise exception 'FAIL: the cap %', v;
--   end if;
--   v := public.add_event_invites(v_event, array(select 'big-' || i || '@example.test' from generate_series(1, 2001) i));
--   if v ->> 'reason' is distinct from 'too_many' then raise exception 'FAIL: 2,001 in one call %', v; end if;
--   select count(*) into v_n from public.event_invites where event_id = v_event;
--   if v_n <> 500 then raise exception 'FAIL: the host reads % addresses through RLS', v_n; end if;
--   reset role;
--   perform set_config('request.jwt.claims', json_build_object('sub', v_other, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   select count(*) into v_n from public.event_invites where event_id = v_event;
--   reset role;
--   if v_n <> 0 then raise exception 'FAIL: another host reads % addresses', v_n; end if;
--   set local role service_role;
--   v := public.event_door_standing(v_event, u_l, null);
--   if not (v ->> 'listed')::boolean or (v ->> 'in')::boolean then raise exception 'FAIL: L''s standing %', v; end if;
--   if (select (x ->> 'joined')::boolean from jsonb_array_elements(public.event_invite_list(v_event)) x where x ->> 'email' = lower(e_l)) then
--     raise exception 'FAIL: L joined before she came';
--   end if;
--   v := public.create_guest(v_qr, u_l);
--   if v ->> 'admission' <> 'in' then raise exception 'FAIL: the list did not let L in %', v; end if;
--   t_l := v ->> 'session_token';
--   if not (select (x ->> 'joined')::boolean from jsonb_array_elements(public.event_invite_list(v_event)) x where x ->> 'email' = lower(e_l)) then
--     raise exception 'FAIL: L never read joined';
--   end if;
--   begin
--     perform public.create_guest(v_qr, u_u);
--     raise exception 'FAIL: the list let U in';
--   exception when check_violation then
--     if sqlerrm <> 'Ask the host to let you in.' then raise; end if;
--   end;
--   v := public.ask_to_join(v_qr, u_u);
--   if v ->> 'admission' <> 'waiting' or not (v ->> 'verified')::boolean then raise exception 'FAIL: U''s ask %', v; end if;
--   t_u := v ->> 'session_token'; g_u := (v ->> 'guest_id')::uuid;
--   if not (public.event_door_standing(v_event, u_u, null) ->> 'waiting')::boolean then raise exception 'FAIL: U not waiting'; end if;
--   v := public.ask_to_join(v_qr, u_l);
--   if v ->> 'admission' <> 'in' then raise exception 'FAIL: a listed ask %', v; end if;
--   begin
--     perform public.ask_to_join(v_qr, u_d);
--     raise exception 'FAIL: a declined newcomer asked';
--   exception when check_violation then
--     if sqlerrm <> 'This event is private.' then raise; end if;
--   end;
--   begin
--     perform public.ask_to_join(v_qr, u_q);
--     raise exception 'FAIL: an unconfirmed account asked';
--   exception when check_violation then
--     if sqlerrm <> 'This event requires a verified email to upload.' then raise; end if;
--   end;
--   begin
--     perform public.ask_to_join(v_qr, v_host);
--     raise exception 'FAIL: the host asked';
--   exception when check_violation then
--     if sqlerrm <> 'This event is private.' then raise; end if;
--   end;
--   reset role;
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v := public.remove_event_invite(v_event, upper(e_l));
--   if (v ->> 'removed')::int <> 1 then raise exception 'FAIL: unlist L %', v; end if;
--   v := public.let_in_at_door(v_event, g_u);
--   if (v ->> 'admitted')::int <> 1 then raise exception 'FAIL: let U in %', v; end if;
--   reset role;
--   set local role service_role;
--   if not (public.event_door_standing(v_event, u_l, null) ->> 'in')::boolean then raise exception 'FAIL: L out once unlisted'; end if;
--   if not (public.event_door_standing(v_event, u_u, null) ->> 'in')::boolean then raise exception 'FAIL: U not in'; end if;
--   reset role;
--   insert into doors_proof values ('invite', true, 'a paste normalised and counted (2 added, 3 unreadable), the cap at 500 and 2,000 a call; RLS scopes the list; L listed comes in and reads joined; U told to ask, asks, waits, is let in; a listed ask is in; declined, unconfirmed and the host refused; unlisted, L stays in');
--
--   -- ── 7. The password, which someone already in passes without. ──
--   v_step := 'password';
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   perform public.set_event_password(v_event, 'correct horse');
--   reset role;
--   if (select visibility::text || '/' || coalesce(gate::text, '-') from public.events where id = v_event) <> 'password/-' then
--     raise exception 'FAIL: the password left a gate behind';
--   end if;
--   set local role service_role;
--   v := public.create_guest(v_qr, u_a);
--   if v ->> 'admission' <> 'in' then raise exception 'FAIL: A needed the password %', v; end if;
--   begin
--     perform public.create_guest(v_qr, u_p);
--     raise exception 'FAIL: a newcomer passed the password without it';
--   exception when check_violation then
--     if sqlerrm <> 'This event is locked. Enter the event password to upload.' then raise; end if;
--   end;
--   v := public.create_guest(v_qr, u_p, true);
--   if v ->> 'admission' <> 'in' then raise exception 'FAIL: P with the password %', v; end if;
--   if public.get_upload_context(t_a, 'photo') ->> 'visibility' <> 'open' then raise exception 'FAIL: A''s ticket asks the password'; end if;
--   if public.verify_event_password(v_qr, 'correct horse') is distinct from v_event then raise exception 'FAIL: the password itself'; end if;
--   reset role;
--   perform set_config('request.jwt.claims', json_build_object('sub', u_p, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v := public.like_media(m_host);
--   reset role;
--   if not (v ->> 'ok')::boolean then raise exception 'FAIL: P could not like past the password %', v; end if;
--   insert into doors_proof values ('password', true, 'set_event_password clears the gate; A in passes without it, P needs it then comes in; A''s ticket adds; the password verifies; P likes');
--
--   -- ── 8. Only me shuts everyone out, the host excepted. ──
--   v_step := 'only me';
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v := public.set_event_door(v_event, 'private');
--   reset role;
--   if (select visibility::text || '/' || coalesce(gate::text, '-') from public.events where id = v_event) <> 'private/-' then
--     raise exception 'FAIL: Only me stored as %', (select visibility::text || '/' || coalesce(gate::text, '-') from public.events where id = v_event);
--   end if;
--   set local role service_role;
--   v := public.event_door_standing(v_event, u_a, null);
--   if v ->> 'door' <> 'private' or not (v ->> 'was_in')::boolean then raise exception 'FAIL: A at Only me %', v; end if;
--   begin
--     perform public.create_guest(v_qr, u_a);
--     raise exception 'FAIL: Only me minted';
--   exception when check_violation then
--     if sqlerrm <> 'This event is private.' then raise; end if;
--   end;
--   if public.get_upload_context(t_a, 'photo') ->> 'visibility' <> 'private' then raise exception 'FAIL: A adds at Only me'; end if;
--   begin
--     perform public.create_media(t_a, gen_random_uuid(), 'photo', 'events/' || v_event || '/doors-a2', 100);
--     raise exception 'FAIL: create_media at Only me';
--   exception when check_violation then
--     if sqlerrm <> 'This event is private.' then raise; end if;
--   end;
--   begin
--     perform public.set_guest_display_name(t_n, 'Nell Only');
--     raise exception 'FAIL: a rename at Only me';
--   exception when check_violation then
--     if sqlerrm <> 'This event is private.' then raise; end if;
--   end;
--   reset role;
--   perform set_config('request.jwt.claims', json_build_object('sub', u_a, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v := public.like_media(m_host);
--   reset role;
--   if v ->> 'reason' is distinct from 'not_found' then raise exception 'FAIL: A liked at Only me %', v; end if;
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v := public.like_media(m_a);
--   reset role;
--   if not (v ->> 'ok')::boolean then raise exception 'FAIL: the host could not like at Only me %', v; end if;
--   insert into doors_proof values ('only me', true, 'stored private with no gate; A was in and reads it; no mint, upload, rename or like; the host likes');
--
--   -- ── 9. Turning Public lets everyone waiting in. ──
--   v_step := 'the door opens';
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   perform public.set_event_door(v_event, 'approve');
--   reset role;
--   set local role service_role;
--   v := public.create_guest(v_qr, u_v);
--   t_v := v ->> 'session_token'; g_v := (v ->> 'guest_id')::uuid;
--   reset role;
--   if v ->> 'admission' <> 'waiting' then raise exception 'FAIL: V not held %', v; end if;
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v := public.set_event_door(v_event, 'open');
--   reset role;
--   if (v ->> 'admitted')::int <> 1 or (select admission from public.guests where id = g_v) <> 'in' then
--     raise exception 'FAIL: the door opened on %', v;
--   end if;
--   if (select admission from public.guests where id = g_d) <> 'in' or not (select public.event_block_holds_row(g) from public.guests g where g.id = g_d) then
--     raise exception 'FAIL: the declined row''s block';
--   end if;
--   insert into doors_proof values ('the door opens', true, 'Public lets the one waiting in (counted); a declined newcomer stays held by her block');
--
--   -- ── 10. The Videos switch, and the picker's flag. ──
--   v_step := 'videos';
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   update public.events set allow_videos = false where id = v_event;
--   select row_to_json(x)::jsonb into v from public.get_event_by_qr_token(v_qr) x;
--   reset role;
--   if (v ->> 'accepts_video')::boolean then raise exception 'FAIL: the flag with videos off %', v; end if;
--   set local role service_role;
--   if not (public.get_upload_context(t_a, 'video') ->> 'video_blocked')::boolean
--      or (public.get_upload_context(t_a, 'photo') ->> 'video_blocked')::boolean then
--     raise exception 'FAIL: the video advisory';
--   end if;
--   begin
--     perform public.create_media(t_a, gen_random_uuid(), 'video', 'events/' || v_event || '/doors-v', 100);
--     raise exception 'FAIL: a video with videos off';
--   exception when check_violation then
--     if sqlerrm <> 'Video uploads are available on paid plans.' then raise; end if;
--   end;
--   v := public.create_media(t_a, gen_random_uuid(), 'photo', 'events/' || v_event || '/doors-p', 100);
--   reset role;
--   insert into doors_proof values ('videos', true, 'the host writes the switch through its grant; the flag, the advisory and the refusal follow it; photos still land');
--
--   -- ── 11. A claim carries no one through a gate. ──
--   v_step := 'the claims';
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   perform public.set_event_door(v_event, 'closed');
--   reset role;
--   insert into public.guests (event_id, session_token, display_name, admission, pending_email, pending_email_at)
--     values (v_event, t_x, 'Xan Waiting', 'waiting', lower(e_c), now()) returning id into g_x;
--   insert into public.media (event_id, guest_id, type, original_key, file_size_bytes, status)
--     values (v_event, g_x, 'photo', 'events/' || v_event || '/doors-x', 100, 'approved');
--   perform set_config('request.jwt.claims', json_build_object('sub', u_c, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v_n := public.claim_anonymous_uploads(array[t_x]);
--   select count(*) + v_n into v_n from public.list_guest_rows_by_email() r where r.guest_id = g_x;
--   v_n := v_n + public.claim_guest_rows_by_email(array[v_event]);
--   v_n := v_n + public.disown_guest_rows_by_email(array[v_event]);
--   reset role;
--   if v_n <> 0 or (select user_id from public.guests where id = g_x) is not null
--      or (select pending_email from public.guests where id = g_x) is distinct from lower(e_c) then
--     raise exception 'FAIL: a claim reached a waiting row (%)', v_n;
--   end if;
--   set local role service_role;
--   if (public.event_door_standing(v_event, u_c, null) ->> 'in')::boolean then raise exception 'FAIL: C came in through a claim'; end if;
--   begin
--     perform public.event_door_standing(v_event, null, array(select md5(i::text) || md5(i::text) from generate_series(1, 9) i));
--     raise exception 'FAIL: nine tickets';
--   exception when program_limit_exceeded then null;
--   end;
--   if (public.event_door_standing(gen_random_uuid(), null, null) ->> 'found')::boolean then raise exception 'FAIL: an unknown event was found'; end if;
--   reset role;
--   insert into doors_proof values ('the claims', true, 'a waiting row is out of both claims (token, list, claim, disown) and C stays out; the standing bounds its tickets and knows an unknown event');
-- exception when others then
--   insert into doors_proof values (v_step, false, sqlerrm);
-- end;
-- $$;
