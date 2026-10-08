-- =============================================================================================
-- A DISPOSABLE'S CARDS NEVER DRAW A SEALED SHOT, THE HOST'S EXEMPTION INCLUDED (lane `crumbs-93`, red-team 58's LOW).
-- The mechanism is docs/systems/disposable-mode.md's ("The seal: one predicate, per row"). The foundation migration
-- (20261002200000) exempted the host's own session at every SQL home, on the thought that her dashboard meets her sealed
-- album; the hub's head and the stage's wall then covered the sealed shots anyway (`useHubCoverStills`, `getStagePhotos`
-- with `unsealedFilter`), and red-team 58 found the one place left: the dashboard's THIS WEEK card wearing a sealed shot
-- of an album that develops tomorrow as its cover, spoiling the develop for the one person it is meant to surprise.
-- Will's rule is one rule for every reader of a Disposable's photographs before its develop, at the read itself, so:
--
--   1. `event_covers`: the newest approved photograph outside the bin that is NOT SEALED, for every caller. The host's
--      exemption (`or exists (select 1 from public.events e where e.id = m.event_id and e.host_id = (select auth.uid()))`)
--      goes. Callers: the dashboard's cards and their Deleted tab (the host's own session, now a guest's view of the seal)
--      and the profile and Guest cards on the service role (no `auth.uid()`: they never had the exemption, so nothing
--      changes for them).
--   2. `event_stills`: the same predicate on the stills a card dissolves through (`or e.host_id = (select auth.uid())`
--      goes).
--
--   NOT TOUCHED, ON PURPOSE: `event_card_stats` (the counts: "2 in the album" is a number, never a photograph, and the host
--   needs her album's size while it develops) and every body that carries the exemption for a read that is not a card
--   (`get_event_media_by_qr_token`, `like_media`, `create_report`, `get_public_profile`, `album_changes_since`'s host
--   scope). No signature, owner or search_path moves, and the grants are the foundation's restated word for word at the
--   file's foot (covers: authenticated and service_role; stills: authenticated; anon neither), so this file adds nothing
--   a client role can reach.
--
-- ★ WHAT THE DEPLOYED BUILDS MEET (partyreel.com's build and the alias share this database; Stripe is in TEST): both
-- functions answer the same jsonb shape for the same ids. The one difference is an album with a develop time ahead: for its
-- host the card has no cover (the no-cover surface, the seed light) or the newest photograph a guest could already see, in
-- place of a sealed one; nothing else changes. The build and this apply may land in either order, and until it lands the
-- cards behave as today. A Disposable's host loses nothing she can act on: her hub's gallery, Review and the develop are
-- not these reads.
--
-- THE PROTOCOL (database-security.md, "Workflow"): the drift read first: each body this file replaces, hashed live as
-- md5(btrim(regexp_replace(prosrc, '\s+', ' ', 'g'))), equalled its newest repo definition (20261002200000) on 2026-10-08:
--   event_covers  4539afa0a002e13cf80eadccba327088
--   event_stills  fa2b913dc23b828560516af3098aee8f
-- Both are SECURITY INVOKER with an empty search_path, so the host's own RLS and her media column grant still bound every
-- read: another host's event is simply absent. `src/lib/db/migration-guards.test.ts` and
-- `src/lib/disposable/migration-guards.test.ts` pin the new bodies (the predicate with NO auth.uid() in either).
--
-- Both statements are idempotent (`create or replace`). The proof below ran on the live schema inside begin; ... rollback;
-- in ONE execute_sql call, as the host (willg97) through `set local role authenticated`, on albums that already exist:
-- "crumbs-81 sealed (disposable)" (0732b206: two sealed, previewed photographs, develop time days ahead) and
-- "RT57 Disposable" (983b4db4: a deleted album whose newest approved photograph was sealed and 27 older ones were not).
--   RED (before this file's statements): the host's covers for 0732b206 answered a sealed photograph (its preview and its
--   original), and for 983b4db4 the sealed newest one, not the newest a guest could see; her stills for 0732b206 answered
--   both sealed previews.
--   GREEN (after): 0732b206 is absent from both answers, 983b4db4's cover is the newest UNSEALED photograph (and it has no
--   previews, so no stills), a stranger reads nothing of either album, the service role (its own claims, no sub) reads
--   exactly what it read before, null and empty inputs still answer {}, and the grants, the invoker and the empty
--   search_path are the foundation's.
-- =============================================================================================

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
      and (m.sealed_until is null or m.sealed_until <= now())
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
        and (m.sealed_until is null or m.sealed_until <= now())
      order by m.created_at desc, m.id desc
      limit least(greatest(p_per_event, 0), 12)
    ) newest
  ) s
  where e.id = any(p_event_ids)
    and s.preview_keys is not null;
$$;

-- The grants, restated verbatim from the foundation (the repo's convention: a body's grants are read in the file that holds
-- its last definition, and `create or replace` would keep them anyway): covers for the user's client and the service role,
-- stills for the user's client alone, neither for anon.
revoke all on function public.event_covers(uuid[]) from public, anon, authenticated;
grant execute on function public.event_covers(uuid[]) to authenticated, service_role;
revoke all on function public.event_stills(uuid[], integer) from public, anon, authenticated;
grant execute on function public.event_stills(uuid[], integer) to authenticated;
