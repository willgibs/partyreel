-- =============================================================================================
-- THE EMPTY PAGE'S COUNT (lane `profile-setup`; Will's `identity-profile` r1, `page=count`, with his
-- note: "simplified into a more '2 private events' tone ... it helps differentiate an active private
-- user from a no-events private user with no public events").
--
-- get_public_profile gains one key, `private_event_count`: how many events the page's owner added
-- photos to that THIS VIEWER could see on the page if the owner chose to show them, and has not.
-- `/u/[slug]` says it in one quiet line ("2 private events") where it said "No events here yet".
--
-- ★ THE COUNT'S RULE IS THE ATTENDED ARM'S OWN, WORD FOR WORD. Only what this viewer could ever
-- confirm counts, so the count reads every gate the arm reads (the host's guest-list key, open-only,
-- the album's confirmed-email gate and its upload door for THIS viewer, never the owner's own event,
-- an approved upload on a PROVED row) and only the owner's choice is inverted: a Require-an-upload-
-- to-view album this viewer has not passed stays out of the number exactly as its line would stay
-- off the page. `profile-private-count.test.ts` holds the two predicates to each other, so a gate
-- added to one and not the other fails the gate.
--
-- ★ AND IT IS DISCLOSED ONLY WHILE THE PAGE SHOWS NOTHING (database-security.md: an anon read never
-- discloses more than the page it backs). The page reads the count only when both arms are empty,
-- so the payload carries a number only then and `null` otherwise: a caller reading the RPC directly
-- learns nothing the page would not say. The CASE evaluates its subquery only when the page is
-- empty, so a full page pays nothing for it.
--
-- WHY A CTE: the payload is built first and whole, its code carried VERBATIM from 20260923150000
-- (re-indented; two comments drop pointers to that file's own sections), so every guard that reads
-- an arm from its `'<name>'` key to its `'[]'::jsonb` default still reads the same arm; the count is
-- appended after it, from the page row the final select names `p`, so the count's predicate says
-- `p.id` exactly as the arm does.
--
-- APPLY ORDER: ANY TIME. The payload gains a key and loses none; every build ignores a key it does
-- not read, and the lane's build reads a missing key as no count (the page says "No events here
-- yet", as before). `create or replace`, same signature and return, so the ACL survives; the two
-- grant lines below restate it (the MCP anon default-grant landmine cuts both ways).
--
-- APPLY PROTOCOL (database-security.md, Workflow): (1) the drift check, read-only: the live
-- `prosrc` against 20260923150000's body (checked 2026-09-27: md5 4d0686c3... on both, whitespace
-- collapsed); (2) apply verbatim; (3) get_advisors; (4) regenerate the types (the function's
-- signature and `Json` return are unchanged, so the diff should be empty); (5) run the rolled-back
-- contract check commented at the foot.
--
-- EXPECTED ADVISOR DELTA: NONE. The same function, the same signature, the same grants: it stays
-- one of the accepted 0028 anon reads (and in 0029), `search_path = ''` pinned, every name fully
-- qualified. No table, column, policy or grant is created.
-- =============================================================================================

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
                   'visibility', e.visibility,
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
            and e.show_guest_list
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
            and e.show_guest_list
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

-- Re-stated, not changed: `create or replace` preserves the ACL, and these two lines are what a
-- future drop-and-recreate would otherwise lose. get_public_profile is one of the accepted 0028 anon
-- reads: /u/[slug] is logged-out visible, so an anonymous viewer must be able to call it.
revoke execute on function public.get_public_profile(text) from public;
grant execute on function public.get_public_profile(text) to anon, authenticated;

-- =============================================================================================
-- THE ROLLED-BACK CONTRACT CHECK. Run AFTER the apply, in one `execute_sql` call; it ends in a
-- deliberate raise, so nothing it touches persists (database-security.md, Workflow). It borrows a
-- confirmed test account with no handle (hi@willgibs.com's) and gives it one inside the block; its
-- one listed event ("Gallery width (disposable)") is willg97's, open, with the guest list on and
-- Require an upload to view on. Expect the raise's text to be
-- `ROLLED BACK: every private-count fact held`.
-- =============================================================================================
-- do $$
-- declare
--   v_owner uuid := '3fcf6405-ce4d-46ea-a11c-9ed68194b630';  -- hi@willgibs.com, no handle
--   v_host  uuid := '6cb5fdb5-ac8a-4c82-83ce-59b5a2cfcd0b';  -- willg97, the listed event's host
--   v_other uuid := '88d50fe4-6603-4a56-a96e-605bc32c960b';  -- partyr33l, no upload there
--   v_gated uuid := '0fd56a19-ad5c-4599-8ed9-319520fd1f7a';  -- upload-to-view, guest list on
--   v_quiet uuid := 'd147f214-add8-41d2-883e-dca000356fec';  -- guest list off
--   v_json jsonb;
-- begin
--   update public.profiles set slug = 'private-count-proof' where id = v_owner;
--
--   -- 1. An anonymous viewer cannot pass the upload door, so the gated event stays out: 0.
--   perform set_config('request.jwt.claim.sub', '', true);
--   perform set_config('request.jwt.claims', '', true);
--   v_json := public.get_public_profile('private-count-proof');
--   if (v_json ->> 'private_event_count')::int <> 0 then
--     raise exception 'anon counted a gated event: %', v_json -> 'private_event_count';
--   end if;
--
--   -- 2. The event's host passes the door: 1. And the owner herself (her own upload): 1.
--   perform set_config('request.jwt.claim.sub', v_host::text, true);
--   if (public.get_public_profile('private-count-proof') ->> 'private_event_count')::int <> 1 then
--     raise exception 'the host was not counted';
--   end if;
--   perform set_config('request.jwt.claim.sub', v_owner::text, true);
--   if (public.get_public_profile('private-count-proof') ->> 'private_event_count')::int <> 1 then
--     raise exception 'the owner was not counted';
--   end if;
--
--   -- 3. A signed-in viewer with no upload there stays at the door: 0.
--   perform set_config('request.jwt.claim.sub', v_other::text, true);
--   if (public.get_public_profile('private-count-proof') ->> 'private_event_count')::int <> 0 then
--     raise exception 'a viewer who never passed the door was counted';
--   end if;
--
--   -- 4. Open the door and turn the second event's guest list on: anon counts both.
--   perform set_config('request.jwt.claim.sub', '', true);
--   update public.events set require_upload_to_view = false where id = v_gated;
--   update public.events set show_guest_list = true where id = v_quiet;
--   if (public.get_public_profile('private-count-proof') ->> 'private_event_count')::int <> 2 then
--     raise exception 'the open events were not both counted';
--   end if;
--
--   -- 5. The owner shows one: the page is no longer empty, so the count is withheld (null).
--   insert into public.profile_shown_events (user_id, event_id) values (v_owner, v_gated);
--   v_json := public.get_public_profile('private-count-proof');
--   if jsonb_array_length(v_json -> 'attended_events') <> 1
--      or (v_json -> 'private_event_count') <> 'null'::jsonb then
--     raise exception 'a page with a line still disclosed a count: %', v_json;
--   end if;
--
--   raise exception 'ROLLED BACK: every private-count fact held';
-- end;
-- $$;
