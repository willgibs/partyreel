-- The claims review's cards (`identity-claims` r1, Will 2026-09-27: `pass=cards`, one event at a
-- time, "each with its own small preview"). The review shows each waiting event with a few of the
-- photographs added under her email there, so she can tell hers from someone else's before she
-- claims or deletes; the list she reviews had names and counts only.
--
-- WHAT CHANGES: the claim list's answer gains two columns, appended after the eight it had, and
-- nothing else moves.
--   * event_visibility: the event's door (open, password, private), so the card says why a gated
--     event shows no photographs rather than showing an empty row.
--   * preview_keys: up to four of the ROW'S OWN photographs' preview keys, newest first, and only
--     what its album shows anyone: an OPEN event's approved, live, previewed media. A password or
--     private event answers null (the album's own door, the guest album's `visibility = 'open'`
--     rule, as the date's QA #40 redaction already does for a password event), and an open event
--     with nothing previewable answers an empty array. The keys are presigned on the server
--     (src/lib/db/queries/claims.ts); a key never reaches a browser.
-- Everything else is the live body verbatim: the oracle gate (no address parameter, an unconfirmed
-- caller lists nothing), the keyset cursor and its clamp, the order, the live-upload filter, and
-- still no album link (the link comes only with a claim that proved she was there, from the claim's
-- own follow-up read, never on a list of events she has not claimed).
--
-- ★ A RETURNS TABLE CANNOT CHANGE IN PLACE, so this is a DROP + CREATE of the one signature
-- (PostgREST forbids overloads), with its grants restated in full: a recreated function re-inherits
-- the default EXECUTE, so `anon` is revoked by name (the MCP landmine, database-security.md).
--
-- BACKWARD COMPATIBLE FOR THE BUILDS ALREADY SERVING: the parameters are the row cap's three,
-- untouched, so every deployed call reaches the new function by the same argument names and gets
-- the same rows in the same order; the two new keys are extra fields its readers ignore.
--
-- APPLY PROTOCOL (database-security.md -> Workflow):
--   (1) Drift, read-only: the live body's md5 equals its source file's (measured 2026-09-27):
--         list_guest_rows_by_email(timestamptz, uuid, integer)   a015e8252e27d0b23f45c93bcfaab810  (20260924020000)
--       select p.oid::regprocedure, md5(p.prosrc), pg_get_function_result(p.oid) from pg_proc p
--         join pg_namespace n on n.oid = p.pronamespace
--        where n.nspname = 'public' and p.proname = 'list_guest_rows_by_email';
--   (2) The rolled-back check at the foot (held on the live schema 2026-09-27: 22 rows under one
--       confirmed address equal a hand tally with the event open, password and private; paged at 1
--       in the unpaged order; unconfirmed and signed out list nothing; one signature, authenticated
--       only), then apply verbatim. The query in (1) then reads one signature, the two new columns
--       last in its result, and the body's md5 2ab25b907b52401504a6a630f6ee0023.
--   (3) The grants: authenticated only, no anon EXECUTE.
--   (4) get_advisors. EXPECTED DELTA: NONE. The function stays in 0029 under the same signature.
--   (5) Regenerate src/lib/db/types.ts (the list's two new columns). The code reads them
--       defensively, so it is right on either side of this file.

-- =============================================================================================
-- list_guest_rows_by_email: the claims review's list, with each row's own previews.
-- =============================================================================================
drop function public.list_guest_rows_by_email(timestamptz, uuid, integer);
create function public.list_guest_rows_by_email(
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

-- Authenticated-only (lint 0029), restated after the drop; every client role named, because an
-- MCP-created function inherits an anon EXECUTE that a bare `revoke ... from public` leaves behind.
revoke all on function public.list_guest_rows_by_email(timestamptz, uuid, integer) from public, anon, authenticated;
grant execute on function public.list_guest_rows_by_email(timestamptz, uuid, integer) to authenticated;

comment on function public.list_guest_rows_by_email(timestamptz, uuid, integer) is
  'The claims review: the CONFIRMED caller''s own unclaimed guest rows that carry a live upload, ordered by last upload desc, guest id desc, each with its event''s visibility and up to four preview keys of its own approved media (null unless the album is open). Pages on the last row''s (last_upload_at, guest_id) with p_limit clamped to 1,000; a null p_limit reads everything.';


-- ── THE ROLLED-BACK CHECK. Proved on the live schema BEFORE applying (database-security.md, "An
-- unapplied migration is proved on the live schema"): ONE execute_sql call of `begin;`, this file's
-- statements verbatim, `create temp table claim_previews_proof (step text, ok boolean, detail text);`,
-- the block below, `select * from claim_previews_proof;` and `rollback;`. The block traps its own
-- failure into the proof table, so the rollback always runs, and the call answers the proof rows.
-- It rides EXISTING rows: every name-only guest row that carries a live upload takes a confirmed
-- account's address inside the transaction, one open event's newest approved upload gains a preview
-- key if it has none, and another event with such a row is made a password event, then private.
-- Every step reads against a hand tally computed as the table owner. ───────────────────────────────
-- do $$
-- declare
--   v_user uuid;
--   v_email text;
--   v_rows integer;
--   v_open uuid;
--   v_gated uuid;
--   v_got jsonb;
--   v_hand jsonb;
--   v_listed uuid[];
--   v_paged uuid[] := '{}';
--   v_page uuid[];
--   v_after_at timestamptz;
--   v_after_id uuid;
--   v_pages integer := 0;
-- begin
--   select u.id, lower(btrim(u.email)) into v_user, v_email
--     from auth.users u
--    where u.email_confirmed_at is not null and position('@' in coalesce(u.email, '')) > 1
--    order by u.created_at limit 1;
--   if v_user is null then raise exception 'SETUP: no confirmed account'; end if;
--   update public.guests g set pending_email = v_email, pending_email_at = now()
--    where g.user_id is null and g.verified_at is null
--      and exists (select 1 from public.events e where e.id = g.event_id and e.deleted_at is null)
--      and exists (select 1 from public.media x where x.guest_id = g.id and x.status <> 'removed');
--   get diagnostics v_rows = row_count;
--   if v_rows < 3 then raise exception 'SETUP: only % name-only rows carry a live upload', v_rows; end if;
--   select g.event_id into v_open from public.guests g join public.events e on e.id = g.event_id
--    where g.pending_email = v_email and e.visibility = 'open'
--      and exists (select 1 from public.media x where x.guest_id = g.id and x.status = 'approved' and x.removed_at is null)
--    order by g.created_at limit 1;
--   if v_open is null then raise exception 'SETUP: no open row with an approved upload'; end if;
--   update public.media x set preview_key = coalesce(x.preview_key, x.original_key)
--    where x.id = (select y.id from public.media y join public.guests g on g.id = y.guest_id
--                   where g.event_id = v_open and g.pending_email = v_email and y.status = 'approved' and y.removed_at is null
--                   order by y.created_at desc, y.id desc limit 1);
--   select g.event_id into v_gated from public.guests g
--    where g.pending_email = v_email and g.event_id <> v_open order by g.created_at limit 1;
--   if v_gated is null then raise exception 'SETUP: no second event with a row'; end if;
--   update public.events set event_password_hash = coalesce(event_password_hash, 'x'), visibility = 'password'
--    where id = v_gated;
--   insert into claim_previews_proof values ('setup', true,
--     format('%s rows under one confirmed address; open %s, gated %s', v_rows, v_open, v_gated));
--
--   -- 1. Each listed row's door, date and previews equal a hand tally: an open row its own newest
--   --    four approved, live, previewed media in order; a gated row null and a password date withheld.
--   for v_rows in 1..2 loop
--     perform set_config('request.jwt.claims', json_build_object('sub', v_user, 'role', 'authenticated')::text, true);
--     set local role authenticated;
--     select coalesce(jsonb_object_agg(r.guest_id, jsonb_build_object('v', r.event_visibility, 'd', r.event_date,
--              'k', r.preview_keys)), '{}') into v_got
--       from public.list_guest_rows_by_email() r;
--     reset role;
--     select coalesce(jsonb_object_agg(g.id, jsonb_build_object('v', e.visibility,
--              'd', case when e.visibility = 'password' then null else e.event_date end,
--              'k', case when e.visibility = 'open' then coalesce((
--                     select array_agg(s.preview_key order by s.created_at desc, s.id desc)
--                       from (select y.preview_key, y.created_at, y.id from public.media y
--                              where y.guest_id = g.id and y.status = 'approved' and y.removed_at is null
--                                and y.preview_key is not null
--                              order by y.created_at desc, y.id desc limit 4) s), '{}'::text[]) end)), '{}') into v_hand
--       from public.guests g join public.events e on e.id = g.event_id and e.deleted_at is null
--      where g.pending_email = v_email and g.user_id is null and g.verified_at is null
--        and exists (select 1 from public.media x where x.guest_id = g.id and x.status <> 'removed');
--     if v_got <> v_hand then raise exception 'FAIL (pass %): the list % differs from the hand tally %', v_rows, v_got, v_hand; end if;
--     if not exists (select 1 from jsonb_each(v_got) j where j.value ->> 'v' = 'open'
--                     and case when jsonb_typeof(j.value -> 'k') = 'array' then jsonb_array_length(j.value -> 'k') else 0 end > 0) then
--       raise exception 'SETUP: no open row listed a preview';
--     end if;
--     if not exists (select 1 from jsonb_each(v_got) j where j.value ->> 'v' in ('password', 'private')
--                     and j.value -> 'k' = 'null'::jsonb) then
--       raise exception 'FAIL (pass %): no gated row answered null', v_rows;
--     end if;
--     insert into claim_previews_proof values (format('hand tally, %s', (select e.visibility from public.events e where e.id = v_gated)),
--       true, format('%s rows equal', (select count(*) from jsonb_object_keys(v_got))));
--     update public.events set visibility = 'private' where id = v_gated;
--   end loop;
--
--   -- 2. The keyset survived: paged at 1, the same rows in the same order as the unpaged call.
--   perform set_config('request.jwt.claims', json_build_object('sub', v_user, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   select coalesce(array_agg(r.guest_id order by r.ord), '{}') into v_listed
--     from public.list_guest_rows_by_email() with ordinality as r(guest_id, event_id, event_name, event_date, display_name,
--          upload_count, last_upload_at, pending_email_at, event_visibility, preview_keys, ord);
--   loop
--     select coalesce(array_agg(r.guest_id order by r.ord), '{}'),
--            (array_agg(r.last_upload_at order by r.ord desc))[1],
--            (array_agg(r.guest_id order by r.ord desc))[1]
--       into v_page, v_after_at, v_after_id
--       from public.list_guest_rows_by_email(v_after_at, v_after_id, 1) with ordinality as r(guest_id, event_id, event_name,
--            event_date, display_name, upload_count, last_upload_at, pending_email_at, event_visibility, preview_keys, ord);
--     exit when cardinality(v_page) = 0;
--     if cardinality(v_page) > 1 then raise exception 'FAIL: a page of % rows at p_limit 1', cardinality(v_page); end if;
--     v_paged := v_paged || v_page;
--     v_pages := v_pages + 1;
--     if v_pages > 5000 then raise exception 'FAIL: the pages never ended'; end if;
--   end loop;
--   reset role;
--   if v_paged <> v_listed then raise exception 'FAIL: paged at 1 differs from the unpaged call'; end if;
--   insert into claim_previews_proof values ('keyset', true, format('%s rows in %s pages of 1', cardinality(v_listed), v_pages));
--
--   -- 3. The oracle gate: the same account unconfirmed, and no session at all, list nothing.
--   update auth.users set email_confirmed_at = null where id = v_user;
--   set local role authenticated;
--   select count(*) into v_rows from public.list_guest_rows_by_email();
--   perform set_config('request.jwt.claims', '', true);
--   select v_rows + count(*) into v_rows from public.list_guest_rows_by_email(null, null, 5000);
--   reset role;
--   if v_rows <> 0 then raise exception 'FAIL: an unconfirmed caller or no session listed % rows', v_rows; end if;
--   insert into claim_previews_proof values ('oracle gate', true, 'unconfirmed and signed out list nothing');
--
--   -- 4. The grants and the shape: one signature, DEFINER, the empty search_path, authenticated only.
--   if has_function_privilege('anon', 'public.list_guest_rows_by_email(timestamptz, uuid, integer)', 'execute')
--      or not has_function_privilege('authenticated', 'public.list_guest_rows_by_email(timestamptz, uuid, integer)', 'execute') then
--     raise exception 'FAIL: list_guest_rows_by_email is not authenticated-only';
--   end if;
--   if (select count(*) from pg_proc p where p.pronamespace = 'public'::regnamespace and p.proname = 'list_guest_rows_by_email') <> 1 then
--     raise exception 'FAIL: expected exactly one signature (PostgREST cannot choose between overloads)';
--   end if;
--   if not (select p.prosecdef and p.proconfig = array['search_path=""'] from pg_proc p
--            where p.oid = 'public.list_guest_rows_by_email(timestamptz, uuid, integer)'::regprocedure) then
--     raise exception 'FAIL: the security mode or the search_path moved';
--   end if;
--   insert into claim_previews_proof values ('grants and shape', true,
--     (select pg_get_function_result('public.list_guest_rows_by_email(timestamptz, uuid, integer)'::regprocedure)));
-- exception when others then
--   insert into claim_previews_proof values ('error', false, sqlerrm);
-- end $$;
