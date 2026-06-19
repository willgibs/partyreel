-- Phase 5 (S2a, host masonry): add media dimensions to the cross-event personal feeds so the
-- dashboard Uploads/Likes galleries can lay out as MASONRY at natural aspect ratios (no more 1:1
-- squares). The event-page galleries already carry dims via select("*"); only these two SECURITY
-- DEFINER feed RPCs lacked them. Additive OUT columns (width/height/duration_seconds). The RETURNS
-- TABLE shape changes, so each function is DROP+CREATEd (CREATE OR REPLACE cannot change a return
-- type) with its EXACT body + grants preserved (auth.uid()-based, authenticated-only; the advisor
-- 0029 set is unchanged). media.width/height are integer; duration_seconds is double precision.

-- 1. get_my_uploads — the cross-event Uploads feed (HOST arm UNION ALL GUEST arm; see the original
--    migration for the disjoint-arms reasoning). Body unchanged except the three appended columns.
drop function if exists public.get_my_uploads(integer);

create function public.get_my_uploads(p_limit integer default 200)
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
    and m.status = 'approved'
    and m.removed_at is null

  order by created_at desc
  limit p_limit;
$$;

revoke all on function public.get_my_uploads(integer) from public, anon;
grant execute on function public.get_my_uploads(integer) to authenticated;

-- 2. get_my_likes — the cross-event Likes feed. RE-APPLIES the like access predicate (a liked media
--    that has since gone private / removed / had its event deleted drops out and never leaks its
--    key). Body unchanged except the three appended columns.
drop function if exists public.get_my_likes(integer);

create function public.get_my_likes(p_limit integer default 200)
returns table (
  id               uuid,
  type             public.media_type,
  original_key     text,
  liked_at         timestamptz,
  event_id         uuid,
  event_name       text,
  event_date       date,
  event_qr_token   text,
  width            integer,
  height           integer,
  duration_seconds double precision
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    m.id, m.type, m.original_key, l.liked_at,
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

revoke all on function public.get_my_likes(integer) from public, anon, authenticated;
grant execute on function public.get_my_likes(integer) to authenticated;
