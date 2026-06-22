-- Add preview_key to the two gallery RPCs whose fixed RETURNS TABLE excluded it, so the guest
-- open-event gallery (get_event_media_by_qr_token) and the personal Likes feed (get_my_likes) can serve
-- the small client-generated preview variant on tiles. (get_public_album + get_my_uploads already return
-- preview_key.) Changing a RETURNS TABLE means DROP + CREATE (CREATE OR REPLACE can't change the return
-- type), which drops the grants — so each is re-granted to EXACTLY its prior audience. The bodies + gates
-- + SECURITY DEFINER + search_path='' are copied VERBATIM; only `preview_key text` (signature) and
-- `m.preview_key` (select, right after original_key) are added.

drop function if exists public.get_event_media_by_qr_token(text);
create function public.get_event_media_by_qr_token(p_qr_token text)
returns table(
  id uuid,
  type public.media_type,
  original_key text,
  preview_key text,
  width integer,
  height integer,
  duration_seconds double precision,
  created_at timestamptz
)
language sql
stable
security definer
set search_path to ''
as $$
  select m.id, m.type, m.original_key, m.preview_key, m.width, m.height, m.duration_seconds, m.created_at
  from public.media m
  join public.events e on e.id = m.event_id
  where e.qr_token = p_qr_token
    and e.visibility = 'open'
    and e.deleted_at is null
    and m.status = 'approved'
  order by m.created_at desc;
$$;
-- Public open-album read (by design anon-accessible — the visibility='open' gate IS the boundary).
revoke all on function public.get_event_media_by_qr_token(text) from public;
grant execute on function public.get_event_media_by_qr_token(text) to anon, authenticated;

drop function if exists public.get_my_likes(integer);
create function public.get_my_likes(p_limit integer default 200)
returns table(
  id uuid,
  type public.media_type,
  original_key text,
  preview_key text,
  liked_at timestamptz,
  event_id uuid,
  event_name text,
  event_date date,
  event_qr_token text,
  width integer,
  height integer,
  duration_seconds double precision
)
language sql
stable
security definer
set search_path to ''
as $$
  select
    m.id, m.type, m.original_key, m.preview_key, l.liked_at,
    m.event_id, e.name, e.event_date, e.qr_token,
    m.width, m.height, m.duration_seconds
  from public.media_likes l
  join public.media  m on m.id = l.media_id
  join public.events e on e.id = m.event_id and e.deleted_at is null
  where l.user_id = (select auth.uid())
    and m.status = 'approved'
    and m.removed_at is null
    and (
      e.host_id = (select auth.uid())
      or e.visibility = 'open'
      or exists (select 1 from public.guests g
                 where g.event_id = e.id and g.user_id = (select auth.uid()))
    )
  order by l.liked_at desc
  limit p_limit;
$$;
-- Authenticated-only (owner-scoped via auth.uid()) — revoke the implicit MCP anon grant.
revoke all on function public.get_my_likes(integer) from public, anon;
grant execute on function public.get_my_likes(integer) to authenticated;
