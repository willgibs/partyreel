-- =============================================================================================
-- THE PER-EVENT BLOCK, AND THE GUEST LIST ALWAYS ON (lane `safety-wiring`, event-safety r1).
--
-- Will's answers (docs/reviews/event-safety.json, 2026-09-28), on the terms he set when the board
-- opened: a block is "Out, uploads removed". Per event, the host's to make and undo, free on every
-- plan. The person cannot join, upload, open the album, like or claim, every refusal is re-checked per
-- request, their uploads leave for Deleted in the same step, and they meet the private album's closed
-- door (`door=private`, his "Sneaky block"), never the word blocked. It keys on the ACCOUNT, the
-- CONFIRMED ADDRESS or the GUEST ROW, never a device or an IP (device ids are capture-only; a venue
-- shares one IP), so on a names-only party it holds on one browser. Letting someone back in asks
-- whether their uploads come back too, off by default (`restore=ask`). And `room=always`: "make the
-- guest list always on ... Always on for everyone", so no SQL reads `events.show_guest_list` again.
--
-- WHAT THIS FILE DOES:
--   1. public.event_blocks        one row a blocked person an event: the keys, the name the host saw,
--                                 and the uploads the block moved to Deleted. RLS on, the host's own
--                                 events only, no client writes, nothing for anon.
--   2. Four predicates            event_block_names_row and event_block_names_account (do a block's
--                                 keys name this guest row, this account?), event_block_holds_row and
--                                 event_block_holds_account (does any block of the event?): the ONE
--                                 home of the rule every path asks.
--   3. The host's two acts        block_from_event (with a preview that counts, locks and writes
--                                 nothing) and let_back_in (with the restore), SECURITY DEFINER and
--                                 authenticated-only, each re-checking that the caller hosts the event.
--   4. The server's three reads   event_ticket_blocked (the one-browser hold: does a ticket this
--                                 browser holds name a blocked row?), event_blocked_guest_ids (the
--                                 guest list's and every count's exclusion) and blocked_events_for (a
--                                 person's own lists: her dashboard's Guest card and her profile
--                                 picker keep a blocked event, and read it as private), service-role
--                                 only (the last SECURITY DEFINER, because it reads auth.users, which
--                                 the service role cannot).
--   5. Every guest path re-checks the block, each body carried from its newest definition with only
--      the block (and, in get_public_profile, the retired switch) changed:
--        the album's read   get_event_by_qr_token reads the event as PRIVATE to a blocked account or
--                           address, so the page, its metadata and card, the album's routes, the export
--                           and every guest route meet the private album's own answers, in the same
--                           words and the same time (one query, whoever asks).
--        the join           create_guest refuses a blocked account or address ("This event is
--                           private."); set_guest_display_name and set_guest_pending_email, the door's
--                           rename-first path, refuse a blocked ticket the same way.
--        the upload         get_upload_context reads a blocked ticket's event as private, so presign
--                           and complete refuse it exactly as they refuse a private album; create_media
--                           refuses it as the belt.
--        likes              like_media refuses media at an event that blocked the caller (a private
--                           album's own answer: not_found); her own likes list reads as a private
--                           album's guest's does.
--        both claims        claim_anonymous_uploads skips a blocked ticket and every ticket at an
--                           event that blocked the caller; list_/claim_/disown_guest_rows_by_email
--                           leave those rows off the review entirely (a disown would otherwise make
--                           the block's removal final and take the host's way back with it).
--        her own feed       get_my_uploads keeps showing her the approved uploads a standing block
--                           removed, as a private album's stay, and remove_my_upload lets her delete
--                           one there (a withdrawal, as ever).
--        the profile        get_public_profile drops the retired `show_guest_list` from both of its
--                           attended predicates, hides a line when either the page's owner or the
--                           viewer is blocked at that event, and shows a blocked viewer a host's
--                           event as private.
--
-- ★ AN EXPAND: THE DEPLOYED CODE SURVIVES IT UNTOUCHED. Every replaced function keeps its signature
-- and its RETURNS type (create or replace, in place: the grants survive; they are restated anyway,
-- each in the form its guard reads), so partyreel.com and the launch-prep alias keep calling today's
-- shapes. Nothing deployed can create a block, so until the new build ships every new clause reads
-- false. The lane's code runs on either side of this file (its reads of the new objects answer "not
-- provisioned" as nothing blocked, loudly), so apply and push in either order; the feature is live
-- once both have landed.
-- `events.show_guest_list` stays, unread by any SQL after this file and by the lane's code: dropping
-- it is a destructive contract migration, not this lane's (named in its Handoff).
--
-- APPLY PROTOCOL (database-security.md -> Workflow):
--   (1) Drift, read-only: each live body's md5 equals its source file's (measured 2026-09-28):
--         get_event_by_qr_token(text)                          52a56b2144f5c0a302dae7027aefb0f3  (20260925100000)
--         get_upload_context(text, media_type)                 1ff8a853f54d87d11ff2ee57b0a468cb  (20260921150000)
--         create_guest(text, uuid, boolean, text, text)        e9287c94085a33f67d63498358436801  (20260923150000)
--         create_media(... 10 args)                            e4947c742f3d8be5fe2c93e11b1816a5  (20260924100000)
--         set_guest_display_name(text, text)                   6fb9c303be4b25a521c773b24e44c30d  (20260921150000)
--         set_guest_pending_email(text, text)                  5cf3cf2fbc6efe4ae027e81fe67e4ecd  (20260922120000)
--         like_media(uuid)                                     14c68f38efbdbd54aab20b1f72f82638  (20260609160000,
--                                                              its line comments stripped at that apply; the
--                                                              code is the file's word for word)
--         claim_anonymous_uploads(text[])                      46ffb1fc4b0cab2aebaa8fde8c356616  (20260923120000)
--         list_guest_rows_by_email(timestamptz, uuid, integer) 2ab25b907b52401504a6a630f6ee0023  (20260927200000)
--         claim_guest_rows_by_email(uuid[])                    51398d469cce4523c345a87ab53dd5b5  (20260923120000)
--         disown_guest_rows_by_email(uuid[])                   587676d9e0ffca75293ea58c682b442d  (20260922120000)
--         get_public_profile(text)                             d24d7d2ffe2c5bc6d52806909870aea6  (20260927100000)
--         get_my_uploads(integer)                              1752dcb6dc8e114c68654b42b05a49ad  (20260619120000)
--         remove_my_upload(uuid)                               32a29d2206267dad24d4b4c19aae0c18  (20260609150000)
--       and neither public.event_blocks nor any of the nine new functions exists yet:
--       select p.oid::regprocedure, md5(p.prosrc) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--        where n.nspname = 'public' and p.proname in ('get_event_by_qr_token', 'get_upload_context',
--          'create_guest', 'create_media', 'set_guest_display_name', 'set_guest_pending_email',
--          'like_media', 'claim_anonymous_uploads', 'list_guest_rows_by_email',
--          'claim_guest_rows_by_email', 'disown_guest_rows_by_email', 'get_public_profile',
--          'get_my_uploads', 'remove_my_upload')
--        order by 1;
--   (2) The rolled-back check at the foot, on the live schema BEFORE the apply (it held on
--       2026-09-28; the proof rows are quoted there), then apply verbatim. The query in (1) then
--       reads the fourteen bodies at the md5s their own blocks below carry (hashed from this file).
--   (3) The grants, as the file restates them: the nine new functions and the table below; every
--       replaced function exactly as today.
--   (4) get_advisors (security). EXPECTED DELTA: 0029 grows by exactly two, block_from_event and
--       let_back_in (authenticated SECURITY DEFINER host acts, the restore_media class); 0028 and
--       rls_enabled_no_policy unchanged (event_blocks carries a policy; the four predicates and two of
--       the server reads are SECURITY INVOKER, and blocked_events_for is DEFINER for the service role
--       alone, so no client role can run any of them and none enters either list).
--   (5) Regenerate src/lib/db/types.ts: the table and the nine functions. The lane reads them through
--       a typed seam (src/lib/db/queries/event-blocks.ts, src/lib/db/mutations/event-blocks.ts), so it
--       compiles on either side of the regeneration.
-- =============================================================================================

-- =============================================================================================
-- 1. public.event_blocks: who a host has put out of one event.
-- =============================================================================================
-- ★ THE KEYS, AND WHY NOTHING ELSE. A block holds on any one of them (event_block_names_row below):
--   user_id    the account (a confirmed guest's, or an unconfirmed sign-up's that claimed a typed row);
--   email      a CONFIRMED address, lower(btrim()), never a pending one: `guests.pending_email` is
--              inert (anyone can type anyone's), so a block on it would put a stranger out;
--   guest_id   the row itself, which is all a typed name has: it holds on the browser that keeps the
--              row's ticket, and a names-only party is exactly where the confirm offers Require
--              verified emails.
-- ★ NO FOREIGN KEY BUT THE EVENT'S. A second FK (to profiles, to guests) would give PostgREST a new
-- path between tables it already joins, and an unpinned embed between them would throw PGRST201 at
-- runtime (database-security.md); and a key that outlives its row is the point: the address still
-- holds after the account is deleted, and a guest row is never deleted but with its event, whose
-- cascade takes the block with it.
create table public.event_blocks (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid,
  email text,
  guest_id uuid,
  -- What the host's Blocked list says: the name the host saw when they blocked (the profile's for a
  -- confirmed guest, the typed one otherwise), kept because a deleted account leaves no profile.
  display_name text,
  -- The uploads THIS block moved to Deleted, which Let back in's "Also restore their uploads" brings
  -- back and nothing else does (the host's own earlier removals and the guest's withdrawals stay).
  removed_media_ids uuid[] not null default '{}'::uuid[],
  -- ★ WHAT HER OWN LISTS SAID BEFORE THE BLOCK, so they can keep saying it. A private album keeps its
  -- Guest card on her dashboard (its uploads are still live) and its tile in her profile picker; a
  -- block moves her uploads to Deleted, which would drop both and tell her what the door hides. So
  -- the block keeps the card's place (the newest upload it removed) and whether the picker offered
  -- the event (it removed an approved upload on a proved row), for as long as it stands, whatever
  -- the purge takes meanwhile (blocked_events_for).
  last_upload_at timestamptz,
  profile_eligible boolean not null default false,
  created_at timestamptz not null default now(),
  constraint event_blocks_has_a_key
    check (user_id is not null or email is not null or guest_id is not null),
  constraint event_blocks_email_shape
    check (email is null or (email = lower(btrim(email))
                             and char_length(email) between 3 and 254
                             and position('@' in email) > 1)),
  constraint event_blocks_display_name_len
    check (display_name is null or char_length(display_name) between 1 and 120)
);

create index event_blocks_event_id_idx on public.event_blocks (event_id);
-- One block a person an event, on whichever key names them (the act re-reads before it inserts; these
-- are the belt).
create unique index event_blocks_event_user_key on public.event_blocks (event_id, user_id)
  where user_id is not null;
create unique index event_blocks_event_email_key on public.event_blocks (event_id, email)
  where email is not null;
create unique index event_blocks_event_guest_key on public.event_blocks (event_id, guest_id)
  where guest_id is not null;

comment on table public.event_blocks is
  'The per-event block (event-safety r1): one row a person a host has put out of one event, keyed on the account, a CONFIRMED address or the guest row (never a device or an IP). Written only by block_from_event and let_back_in; read by the host through RLS and by the server. A blocked person meets the private album everywhere (get_event_by_qr_token), and their uploads the block removed are in removed_media_ids for the restore.';

-- RLS on, the host's own events only; SELECT is the one client grant (the Blocked list), every write is
-- the two RPCs'. A new table inherits ALL for anon and authenticated from the project's default
-- privileges, so both are revoked by name before the one grant (the MCP landmine, database-security.md).
alter table public.event_blocks enable row level security;
revoke all on table public.event_blocks from public, anon, authenticated;
grant select on table public.event_blocks to authenticated;
create policy event_blocks_select_host on public.event_blocks
  for select to authenticated
  using (exists (select 1 from public.events e
                  where e.id = event_blocks.event_id
                    and e.host_id = (select auth.uid())));

-- =============================================================================================
-- 2. The rule, once: which rows and which accounts a block holds.
-- =============================================================================================
-- ★ ONE RULE, TWO SHAPES. event_block_names_row is the whole rule for a guest row (a block's keys
-- against it) and event_block_names_account the whole rule for an account; event_block_holds_row and
-- event_block_holds_account ask them of every block of the event, and the act asks names_row of the
-- keys it is about to write (its preview's count and its removal are the same rows the block will
-- then hold, by construction). A row is named by its own id, by its account, or, only when the row is
-- PROVED (`verified_at`), by the address it proved.
-- SECURITY INVOKER, and no client role can run any of the four: every caller is a SECURITY DEFINER
-- body (which runs them as the owner) or the service role. A future INVOKER caller running as a client
-- role fails closed on the missing EXECUTE rather than reading around RLS.
create function public.event_block_names_row(
  p_user_id uuid,
  p_email text,
  p_guest_id uuid,
  p_guest public.guests
)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(
    p_guest.id = p_guest_id
    or (p_guest.user_id is not null and p_guest.user_id = p_user_id)
    or (p_guest.verified_at is not null and p_email is not null
        and lower(btrim(p_guest.email)) = p_email),
    false);
$$;

create function public.event_block_holds_row(p_guest public.guests)
returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (
    select 1
      from public.event_blocks b
     where b.event_id = p_guest.event_id
       and public.event_block_names_row(b.user_id, b.email, b.guest_id, p_guest)
  );
$$;

-- An account is named by its id, and by its address while auth.users says it is confirmed. A null id
-- (a signed-out caller) is named by nothing.
create function public.event_block_names_account(p_user_id uuid, p_email text, p_account uuid)
returns boolean
language sql
stable
set search_path = ''
as $$
  select p_account is not null and (
    coalesce(p_user_id = p_account, false)
    or coalesce(p_email = (select lower(btrim(u.email))
                             from auth.users u
                            where u.id = p_account
                              and u.email_confirmed_at is not null), false)
  );
$$;

create function public.event_block_holds_account(p_event_id uuid, p_user_id uuid)
returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (
    select 1
      from public.event_blocks b
     where b.event_id = p_event_id
       and public.event_block_names_account(b.user_id, b.email, p_user_id)
  );
$$;

revoke all on function public.event_block_names_row(uuid, text, uuid, public.guests) from public, anon, authenticated;
grant execute on function public.event_block_names_row(uuid, text, uuid, public.guests) to service_role;
revoke all on function public.event_block_holds_row(public.guests) from public, anon, authenticated;
grant execute on function public.event_block_holds_row(public.guests) to service_role;
revoke all on function public.event_block_names_account(uuid, text, uuid) from public, anon, authenticated;
grant execute on function public.event_block_names_account(uuid, text, uuid) to service_role;
revoke all on function public.event_block_holds_account(uuid, uuid) from public, anon, authenticated;
grant execute on function public.event_block_holds_account(uuid, uuid) to service_role;

-- =============================================================================================
-- 3. The host's two acts.
-- =============================================================================================
-- block_from_event: put one person out of one event, with their uploads.
--   * THE PERSON is named one way a call: an account (the Guests room's confirmed guest, once per
--     person, with p_event_id), a guest row (the room's typed name), or a photograph (the viewer's
--     credit and Review's peek know the photograph); a row and a photograph name their own event. Who
--     that is follows the guest
--     list's own rule (lib/events/event-guests.ts): a PROVED row is its person, every row of theirs, by
--     the account and the address they proved; a typed name is its row, with the account that claimed
--     it unconfirmed if one did.
--   * THE HOST, RE-CHECKED: the caller owns the live event or learns only not_found (another host, a
--     guest, a deleted event and an unknown id get one answer). The host is never their own guest.
--   * p_preview answers what the act would do (the name, the live uploads it would move, whether the
--     event is names-only, whether they are already blocked) and writes and locks nothing, so the
--     confirm says the number the act then moves.
--   * THE ACT: the block row, then every live upload of theirs (pending, approved or hidden) to
--     Deleted, stamped as the host's own removal (the purge window and status_before_removed come from
--     the triggers), their ids kept for the restore. A held row is skipped, never removed: a hold is
--     immutable to the host (trust-safety-forensics.md), and the preview counts without it too, so no
--     number can tell a hold exists. p_require_verified_email turns the switch on in the same step,
--     the names-only confirm's offer.
--   * LOCKS: the event row, for no key update (two blocks on one event run one at a time, and a
--     guest's upload referencing the event is never held), then the media rows. No capacity decision,
--     so no profiles lock.
create function public.block_from_event(
  p_event_id uuid default null,
  p_user_id uuid default null,
  p_guest_id uuid default null,
  p_media_id uuid default null,
  p_require_verified_email boolean default false,
  p_preview boolean default false
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_media public.media;
  v_event_id uuid := p_event_id;
  v_event public.events;
  v_guest public.guests;
  v_verified boolean;
  v_user uuid;
  v_email text;
  v_row uuid;
  v_label text;
  v_existing uuid;
  v_live integer;
  v_block uuid;
  v_removed uuid[];
  v_last_upload timestamptz;
  v_profile_eligible boolean;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'reason', 'unauthorized');
  end if;
  if num_nonnulls(p_user_id, p_guest_id, p_media_id) <> 1 then
    return jsonb_build_object('ok', false, 'reason', 'bad_target');
  end if;

  -- A photograph and a guest row each name their own event (an account needs p_event_id). A named event
  -- that disagrees, like an unknown id, is not_found.
  if p_media_id is not null then
    select m.* into v_media from public.media m where m.id = p_media_id;
    if not found or (p_event_id is not null and v_media.event_id <> p_event_id) then
      return jsonb_build_object('ok', false, 'reason', 'not_found');
    end if;
    v_event_id := v_media.event_id;
  elsif p_guest_id is not null then
    select g.event_id into v_event_id from public.guests g where g.id = p_guest_id;
    if not found or (p_event_id is not null and v_event_id <> p_event_id) then
      return jsonb_build_object('ok', false, 'reason', 'not_found');
    end if;
  end if;
  if v_event_id is null then
    return jsonb_build_object('ok', false, 'reason', 'bad_target');
  end if;

  if p_preview then
    select e.* into v_event from public.events e
     where e.id = v_event_id and e.host_id = v_uid and e.deleted_at is null;
  else
    select e.* into v_event from public.events e
     where e.id = v_event_id and e.host_id = v_uid and e.deleted_at is null
       for no key update;
  end if;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  if p_user_id is not null then
    select g.* into v_guest from public.guests g
     where g.event_id = v_event.id and g.user_id = p_user_id
     order by (g.verified_at is not null) desc, g.created_at desc
     limit 1;
  else
    select g.* into v_guest from public.guests g
     where g.id = coalesce(p_guest_id, v_media.guest_id) and g.event_id = v_event.id;
  end if;
  -- The host's own upload rides no guest row; a row of another event is not this event's guest.
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_a_guest');
  end if;

  v_verified := v_guest.verified_at is not null;
  if v_verified then
    v_user := v_guest.user_id;
    v_email := lower(nullif(btrim(coalesce(v_guest.email, '')), ''));
    if v_email is null and v_user is not null then
      select lower(btrim(u.email)) into v_email
        from auth.users u
       where u.id = v_user and u.email_confirmed_at is not null;
    end if;
    -- A proved row whose account was since deleted keeps its own key beside the address.
    v_row := case when v_user is null then v_guest.id end;
  else
    v_row := v_guest.id;
    v_user := v_guest.user_id;
    v_email := null;
  end if;
  -- An address the shape CHECK would refuse is no key at all (the account and the row still are).
  if v_email is not null
     and (char_length(v_email) not between 3 and 254 or position('@' in v_email) <= 1) then
    v_email := null;
  end if;
  if v_row is null and v_user is null and v_email is null then
    return jsonb_build_object('ok', false, 'reason', 'not_a_guest');
  end if;
  if v_user = v_event.host_id then
    return jsonb_build_object('ok', false, 'reason', 'not_a_guest');
  end if;

  if v_verified and v_user is not null then
    select nullif(btrim(p.display_name), '') into v_label
      from public.profiles p where p.id = v_user;
  end if;
  v_label := left(coalesce(v_label, nullif(btrim(v_guest.display_name), '')), 120);

  select b.id into v_existing
    from public.event_blocks b
   where b.event_id = v_event.id
     and (b.user_id = v_user or b.email = v_email or b.guest_id = v_row)
   limit 1;

  select count(*)::integer into v_live
    from public.media m
    join public.guests g on g.id = m.guest_id
   where m.event_id = v_event.id
     and g.event_id = v_event.id
     and m.status <> 'removed'
     and m.legal_hold_at is null
     and public.event_block_names_row(v_user, v_email, v_row, g);

  if p_preview then
    return jsonb_build_object(
      'ok', true,
      'preview', true,
      'event_id', v_event.id,
      'label', v_label,
      'verified', v_verified,
      'uploads', v_live,
      'names_only', not v_event.require_verified_email,
      'already', v_existing is not null
    );
  end if;

  if v_existing is not null then
    return jsonb_build_object('ok', true, 'event_id', v_event.id, 'block_id', v_existing,
      'already', true, 'removed', 0);
  end if;

  if coalesce(p_require_verified_email, false) and not v_event.require_verified_email then
    update public.events set require_verified_email = true where id = v_event.id;
  end if;

  insert into public.event_blocks (event_id, user_id, email, guest_id, display_name)
  values (v_event.id, v_user, v_email, v_row, v_label)
  returning id into v_block;

  -- ★ THEIR UPLOADS LEAVE FOR DELETED IN THE SAME STEP, as the host's own removal: removed_at is this
  -- transaction's now(), the block's created_at to the microsecond, which is how the restore tells the
  -- block's removal from any the host made before or after it.
  -- The removal's RETURNING carries each row's prior status (media_derive_removal_provenance stamps
  -- it as the row enters the bin), which is what her profile picker read.
  with gone as (
    update public.media m
       set status = 'removed',
           removed_at = now()
      from public.guests g
     where g.id = m.guest_id
       and g.event_id = v_event.id
       and m.event_id = v_event.id
       and m.status <> 'removed'
       and m.legal_hold_at is null
       and public.event_block_names_row(v_user, v_email, v_row, g)
    returning m.id, m.created_at, m.status_before_removed, (g.verified_at is not null) as proved
  )
  select coalesce(array_agg(gone.id order by gone.id), '{}'::uuid[]),
         max(gone.created_at),
         coalesce(bool_or(gone.proved and gone.status_before_removed = 'approved'), false)
    into v_removed, v_last_upload, v_profile_eligible
    from gone;

  update public.event_blocks
     set removed_media_ids = v_removed,
         last_upload_at = v_last_upload,
         profile_eligible = v_profile_eligible
   where id = v_block;

  return jsonb_build_object(
    'ok', true,
    'event_id', v_event.id,
    'block_id', v_block,
    'already', false,
    'removed', cardinality(v_removed)
  );
end;
$$;

-- let_back_in: the block goes, so they can join and add again; with p_restore, the uploads THIS block
-- removed come back too (Will: "the likely case here is giving someone a second chance, but keeping
-- their original media that led to the blocking as removed", so the app sends false unless the host
-- turns it on).
--   * THE HOST, RE-CHECKED: the block's event is the caller's and is live, else not_found.
--   * THE RESTORE IS restore_media'S RULE, item by item: only a row still in Deleted from this very
--     removal (removed_at = the block's created_at, not withdrawn by its guest, not an operator's
--     takedown, not held), back to the status it had (the trigger's and restore_media's rule), each one
--     admitted against the host's cap in the same order restore_media reads it. One that does not fit
--     stays in Deleted and is counted (`no_room`), so the host is told rather than half-surprised.
--   * LOCKS (QA #17): the host's profiles row FIRST, the one capacity lock, as restore_media takes it;
--     then the media rows. Without p_restore, no lock but the delete's.
create function public.let_back_in(p_block_id uuid, p_restore boolean default false)
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
  v_cap bigint;
  v_active bigint;
  v_media public.media;
  v_target public.media_status;
  v_restored integer := 0;
  v_no_room integer := 0;
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
    select * into v_profile from public.profiles where id = v_event.host_id for update;
    v_cap := coalesce(v_profile.storage_cap_bytes,
                      (select default_storage_cap_bytes from public.tier_limits(v_profile.tier)));
    v_active := public.host_active_bytes(v_event.host_id);
    for v_media in
      select m.*
        from public.media m
       where m.id = any (v_block.removed_media_ids)
         and m.event_id = v_block.event_id
         and m.status = 'removed'
         and m.removed_at = v_block.created_at
         and not m.removed_by_uploader
         and not m.removed_by_admin
         and m.legal_hold_at is null
       order by m.created_at desc, m.id desc
       for update
    loop
      if v_cap is not null and v_active + v_media.file_size_bytes > v_cap then
        v_no_room := v_no_room + 1;
        continue;
      end if;
      v_target := coalesce(v_media.status_before_removed, 'approved'::public.media_status);
      if v_target = 'removed' then
        v_target := 'approved'::public.media_status;
      end if;
      update public.media set status = v_target, removed_at = null
       where id = v_media.id and status = 'removed';
      v_active := v_active + v_media.file_size_bytes;
      v_restored := v_restored + 1;
    end loop;
  end if;

  delete from public.event_blocks where id = v_block.id;

  return jsonb_build_object('ok', true, 'event_id', v_block.event_id, 'restored', v_restored,
    'no_room', v_no_room);
end;
$$;

-- Authenticated-only, the restore_media class (0029, never 0028): the host's own act, authorized inside
-- on auth.uid() and ownership. anon is revoked by name (the MCP landmine).
revoke all on function public.block_from_event(uuid, uuid, uuid, uuid, boolean, boolean) from public, anon, authenticated;
grant execute on function public.block_from_event(uuid, uuid, uuid, uuid, boolean, boolean) to authenticated;
revoke all on function public.let_back_in(uuid, boolean) from public, anon, authenticated;
grant execute on function public.let_back_in(uuid, boolean) to authenticated;

comment on function public.block_from_event(uuid, uuid, uuid, uuid, boolean, boolean) is
  'The host puts one person out of one event (event-safety r1): named by an account, a guest row or a photograph; the caller must host the live event (else not_found). Inserts the block and moves every live, unheld upload of theirs to Deleted in the same step, keeping the ids for let_back_in. p_preview answers the name, the live count, names_only and already, writing nothing; p_require_verified_email turns the switch on with it.';
comment on function public.let_back_in(uuid, boolean) is
  'The host lifts a block (event-safety r1): the caller must host its live event (else not_found). With p_restore, the uploads the block itself removed and still in Deleted come back to their prior status, each admitted against the host''s cap like restore_media (no_room counts the rest).';

-- =============================================================================================
-- 4. The server's three reads (service role only).
-- =============================================================================================
-- ★ THE ONE-BROWSER HOLD. A typed name has no account to block, only the ticket its browser keeps
-- (the `pr_guest_<eventId>` cookie, and a write's body token), so the page and every guest route ask
-- this before the private branch, whether or not the album is private: a blocked ticket and a private
-- album cost the same work and answer the same door.
create function public.event_ticket_blocked(p_event_id uuid, p_session_tokens text[])
returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (
    select 1
      from public.guests g
     where g.event_id = p_event_id
       and g.session_token = any (p_session_tokens)
       and public.event_block_holds_row(g)
  );
$$;

-- The rows a block holds at one event, for the ONE count (getEventGuests): a blocked person drops off
-- the guest list and every number, even when the host restores one of their photographs while they
-- stay blocked. One uuid[] (not set-returning, so the row cap cannot cut it); an event with no block
-- answers without reading its rows.
create function public.event_blocked_guest_ids(p_event_id uuid)
returns uuid[]
language sql
stable
set search_path = ''
as $$
  select coalesce(array_agg(g.id order by g.id), '{}'::uuid[])
    from public.guests g
   where g.event_id = p_event_id
     and exists (select 1 from public.event_blocks b where b.event_id = p_event_id)
     and public.event_block_holds_row(g);
$$;

-- ★ HER OWN LISTS, AS A PRIVATE ALBUM'S WOULD READ. Every live event whose block holds this account
-- (by id or confirmed address), except one she hosts: her dashboard's Guest cards and her profile
-- picker mask each as private, so a card never shows her a cover from an album that shows her
-- nothing; and where the block is her own account's (`own`), the card keeps its place
-- (`last_upload_at`) and the picker its tile (`profile_eligible`), as they stay for a private album.
-- One jsonb, { event id: { own, last_upload_at, profile_eligible } }, so the row cap cannot cut it.
-- ★ SECURITY DEFINER, the one server read that is: the address arm reads auth.users, which the
-- service role holds no grant on (the other two read guests and event_blocks, which it does, so they
-- stay INVOKER). Service-role only, so it enters neither advisor list.
create function public.blocked_events_for(p_user_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(jsonb_object_agg(x.event_id::text, jsonb_build_object(
           'own', x.own,
           'last_upload_at', x.last_upload_at,
           'profile_eligible', x.profile_eligible)), '{}'::jsonb)
    from (
      select b.event_id,
             coalesce(bool_or(b.user_id = p_user_id), false) as own,
             max(b.last_upload_at) filter (where b.user_id = p_user_id) as last_upload_at,
             coalesce(bool_or(b.profile_eligible) filter (where b.user_id = p_user_id), false)
               as profile_eligible
        from public.event_blocks b
        join public.events e on e.id = b.event_id
       where e.deleted_at is null
         and e.host_id is distinct from p_user_id
         and public.event_block_names_account(b.user_id, b.email, p_user_id)
       group by b.event_id
    ) x;
$$;

revoke all on function public.event_ticket_blocked(uuid, text[]) from public, anon, authenticated;
grant execute on function public.event_ticket_blocked(uuid, text[]) to service_role;
revoke all on function public.event_blocked_guest_ids(uuid) from public, anon, authenticated;
grant execute on function public.event_blocked_guest_ids(uuid) to service_role;
revoke all on function public.blocked_events_for(uuid) from public, anon, authenticated;
grant execute on function public.blocked_events_for(uuid) to service_role;

-- =============================================================================================
-- 5a. get_event_by_qr_token: the album's read, as the caller sees the event.
-- =============================================================================================
-- Carried from 20260925100000 with the QA #40 redaction, the reel's three settings and the `limit 1`
-- verbatim, the one change the lateral that reads the event as this caller sees it. The signature and
-- the RETURNS TABLE are today's, so this replaces in place and keeps its ACL; the grants are restated
-- in the forms their guards read (one of the five accepted 0028 anon reads: never revoke).
create or replace function public.get_event_by_qr_token(p_qr_token text)
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
         e.moderation_mode, v.visibility,
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
-- 5b. get_upload_context: the upload's presign and complete, a blocked ticket reads private.
-- =============================================================================================
-- Carried from 20260921150000 verbatim but for the mask. Still one of the anon capability reads (the
-- session token IS the authorization): the grant is re-asserted, never narrowed.
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

  -- ★ THE SNEAKY BLOCK (20260928120000): a ticket this event blocked (its row, the account holding it,
  -- or the address it proved) reads the event as PRIVATE, so presign and complete refuse it exactly as
  -- they refuse a private album, in the same words ("This event is private."). Only this local copy is
  -- masked, never the row.
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

  -- Advisory: a free event can't take video (authoritative gate is in create_media). The
  -- per-upload ceiling is the host cap clamped to the universal 10 GiB (never remaining bytes).
  -- QA #18: `visibility` lets the guest routes re-check the password/private lock per request.
  -- The identity reshape: `require_verified_email` + `guest_verified` let them re-check the
  -- identity gate the same way (create_media stays authoritative for both).
  return jsonb_build_object(
    'event_id', v_event.id,
    'accepting_uploads', v_event.accepting_uploads,
    'event_deleted', false,
    'visibility', v_event.visibility,
    'require_verified_email', v_event.require_verified_email,
    'guest_verified', (v_guest.verified_at is not null),
    'at_storage_cap', v_at_storage_cap,
    'at_monthly_cap', v_at_monthly_cap,
    'video_blocked', (p_type = 'video' and v_profile.tier = 'free'),
    'max_upload_bytes', least(c_max_upload_bytes, coalesce(v_event.max_upload_bytes, c_max_upload_bytes))
  );
end;
$$;

grant execute on function public.get_upload_context(text, public.media_type) to anon, authenticated;

-- =============================================================================================
-- 5c. create_guest: the join refuses a blocked account or address.
-- =============================================================================================
-- Carried from 20260923150000 verbatim but for the refusal. Service-role only, as before.
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
begin
  select * into v_event
  from public.events
  where qr_token = p_qr_token and deleted_at is null;

  if not found then
    raise exception 'Event not found.' using errcode = 'no_data_found';
  end if;

  -- QA #18 (ADR-0023 ruling 2): the write path inherits the read gate. `private` NEVER mints — the
  -- /e/ page master-locks everyone including the owner (owner uploads ride the host routes), so a
  -- guest session for a private event has no legitimate caller. `password` requires proof of
  -- unlock: the route derives p_unlock_proven server-side (the HttpOnly unlock cookie, or event
  -- ownership — the owner reads the album without unlocking, so they upload without it too). The
  -- DB cannot read cookies, so this param is a belt against a FUTURE second caller skipping the
  -- route gate, not a client-forgeable input (create_guest stays service-role-only).
  if v_event.visibility = 'private' then
    raise exception 'This event is private.' using errcode = 'check_violation';
  end if;
  -- ★ THE SNEAKY BLOCK (20260928120000): an account (or the address it confirmed) this event blocked
  -- meets the private album's refusal word for word, which createGuest maps to the same 403. A
  -- names-only joiner has no account to hold; the route's closed door holds the ticket their browser
  -- keeps (event_ticket_blocked) before it ever calls this.
  if public.event_block_holds_account(v_event.id, v_uid) then
    raise exception 'This event is private.' using errcode = 'check_violation';
  end if;
  if v_event.visibility = 'password' and not coalesce(p_unlock_proven, false) then
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

  insert into public.guests (event_id, user_id, email, session_token, display_name, verified_at, pending_email, pending_email_at)
  values (
    v_event.id,
    v_uid,
    nullif(trim(coalesce(v_email, '')), ''),
    v_session_token,
    v_name,
    v_confirmed,
    v_pending,
    case when v_pending is not null then now() end
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
    'email_attached', (v_pending is not null)
  );
end;
$function$;

revoke execute on function public.create_guest(text, uuid, boolean, text, text) from public, anon, authenticated;
grant execute on function public.create_guest(text, uuid, boolean, text, text) to service_role;

-- =============================================================================================
-- 5d. create_media: the upload's authoritative write refuses a blocked ticket.
-- =============================================================================================
-- Carried from 20260924100000 verbatim but for the refusal, which sits under the deleted event (the
-- truer sentence then) and above every upload state, as the lock does in the routes. Service-role only.
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
-- 5e. set_guest_display_name and set_guest_pending_email: the door's rename-first join.
-- =============================================================================================
-- Each carried verbatim (20260921150000, 20260922120000) but for the refusal. Service-role only.
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
-- 5f. like_media: a blocked account likes nothing there.
-- =============================================================================================
-- Carried from 20260609160000 but for the block. Authenticated only, 0029, as before. ★ Her own likes
-- list (get_my_likes) is deliberately NOT replaced: a private album's guest keeps seeing the photographs
-- she liked there, so a blocked one does too, and nothing in her own profile tells the two apart (the
-- lane's Handoff carries it as Will's to overrule).
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
            or exists (select 1 from public.guests g
                       where g.event_id = e.id and g.user_id = v_uid)  -- a guest (joined / uploaded)
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
-- 5g. The two kinds of claim: this device's tickets, and the claims review's rows.
-- =============================================================================================
-- The four claims, each carried from its newest definition (claim_anonymous_uploads and
-- claim_guest_rows_by_email from 20260923120000, list_guest_rows_by_email from 20260927200000,
-- disown_guest_rows_by_email from 20260922120000) with one clause more: a row a block holds, and every
-- row at an event that blocked the caller, is not the caller's to claim, list or release. Leaving it off
-- the review entirely (never offering it and then refusing it) keeps the review honest, and keeps a
-- disown from making the block's removal final (a disowned upload can never be restored). Every
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
-- 5h. get_public_profile: the guest list always on, and the block on a profile's lines.
-- =============================================================================================
-- Carried from 20260927100000 with its three changes: the retired `show_guest_list` leaves both of the
-- attended predicates (the arm and its private count, still equal but for the owner's choice); both
-- gain the block, both ways, placed before the owner's choice so the count's inversion stays the only
-- difference; and the hosted arm reads a host's event as private to a viewer it blocked. The hosted arm
-- stays ungated on visibility otherwise (the host publishing their own link). One of the five accepted
-- 0028 anon reads: the grant is restated, never revoked.

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

revoke execute on function public.get_public_profile(text) from public;
grant execute on function public.get_public_profile(text) to anon, authenticated;

-- =============================================================================================
-- 5i. get_my_uploads and remove_my_upload: her own feed reads as a private album's uploader's.
-- =============================================================================================
-- A private album keeps its uploads live, so they stay in their uploader's own feed; a block moves them
-- to Deleted, which would empty that feed of the event and tell her what the door hides. So the feed
-- keeps what a standing block removed (her approved uploads, until the purge takes them), and her
-- delete of one withdraws it as any withdrawal does. get_my_uploads carried from 20260619120000 (its
-- caller-bounded `limit p_limit` kept: row-cap-sql.test.ts' CALLER_BOUNDED), remove_my_upload from
-- 20260609150000, each but for the block. Authenticated only, 0029, as before.

create or replace function public.get_my_uploads(p_limit integer default 200)
returns table (
  id               uuid,
  type             public.media_type,
  original_key     text,
  preview_key      text,
  created_at       timestamptz,
  event_id         uuid,
  event_name       text,
  event_date       date,
  event_qr_token   text,
  is_host_upload   boolean,
  width            integer,
  height           integer,
  duration_seconds double precision
)
language sql
stable
security definer
set search_path = ''
as $$
  -- HOST arm: media in MY events, host-added (no guest). I own the event, so name/date/token are mine.
  select
    m.id, m.type, m.original_key, m.preview_key, m.created_at,
    m.event_id, e.name, e.event_date, e.qr_token, true,
    m.width, m.height, m.duration_seconds
  from public.media m
  join public.events e on e.id = m.event_id and e.deleted_at is null
  where e.host_id = (select auth.uid())
    and m.guest_id is null
    and m.status = 'approved'
    and m.removed_at is null

  union all

  -- GUEST arm: media whose guest is ME (incl. retroactively-claimed anonymous uploads).
  select
    m.id, m.type, m.original_key, m.preview_key, m.created_at,
    m.event_id, e.name, e.event_date, e.qr_token, false,
    m.width, m.height, m.duration_seconds
  from public.media m
  join public.guests g on g.id = m.guest_id and g.user_id = (select auth.uid())
  join public.events e on e.id = m.event_id and e.deleted_at is null
  where e.host_id <> (select auth.uid())
    and (
      (m.status = 'approved'
       and m.removed_at is null)
      -- ★ THE SNEAKY BLOCK (20260928120000): an approved upload a standing block removed still shows its
      -- uploader here, as a private album's uploads do, until the purge takes it or she deletes it
      -- (remove_my_upload withdraws it). Never a held row, never an operator's takedown.
      or (m.status = 'removed'
          and m.status_before_removed = 'approved'
          and not m.removed_by_uploader
          and not m.removed_by_admin
          and m.legal_hold_at is null
          and exists (select 1 from public.event_blocks b
                       where b.event_id = m.event_id
                         and m.id = any (b.removed_media_ids)
                         and m.removed_at = b.created_at))
    )

  order by created_at desc
  limit p_limit;
$$;

revoke all on function public.get_my_uploads(integer) from public, anon;
grant execute on function public.get_my_uploads(integer) to authenticated;

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
      update public.media m
         set removed_by_uploader = true
       where m.id = p_media_id
         and m.status = 'removed'
         and not m.removed_by_uploader
         and m.legal_hold_at is null
         and exists (select 1 from public.event_blocks b
                      where b.event_id = m.event_id
                        and m.id = any (b.removed_media_ids)
                        and m.removed_at = b.created_at);
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
