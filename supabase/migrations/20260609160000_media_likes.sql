-- Likes: a signed-in user can favorite a photo/video. Two user-facing payoffs: a per-tile like
-- COUNT (a curation signal, also makes the data ready for a future sort/filter system) and a
-- cross-event "Likes" dashboard tab (manage / unlike from one place), mirroring the Uploads tab.
--
-- HOST-ONLY COUNTS (a product decision, enforced at the DATA layer, not just the UI): only the
-- host of an event can read like counts, and only for their own event (get_event_like_counts,
-- host-gated). NO anon/guest-callable path ever returns a count. Guests get only the like BUTTON
-- + their own heart state (a plain owner-RLS select), never a number. => there are NO new anon
-- RPCs here; the advisor 0028 set is unchanged. like_media / get_event_like_counts / get_my_likes
-- are all authenticated-only (lint 0029).
--
-- WRITE PATHS:
--   * like   -> like_media(media_id): SECURITY DEFINER, access-checked (you must be able to SEE the
--              media: host of its event, OR a guest of it, OR the album is 'open'), idempotent.
--   * unlike -> a plain owner-RLS delete from the browser (mirrors saved_events unsave). Safe:
--              self-scoped to auth.uid() by the owner-DELETE policy.
--   * INSERT is REVOKED from authenticated at the table level, so the ONLY insert path is the
--     access-checked RPC. A raw browser insert can't bypass the SEE-it check (the saved_events
--     lesson: save goes through save_event, never a raw insert).

create table public.media_likes (
  media_id uuid not null references public.media(id)    on delete cascade,
  user_id  uuid not null references public.profiles(id) on delete cascade,
  liked_at timestamptz not null default now(),
  -- PK is idempotent (one like per user per media) AND its leading media_id serves count(*) fan-in
  -- (get_event_like_counts), so no separate (media_id) index is needed.
  primary key (media_id, user_id)
);

-- Powers the "Likes" tab feed: this user's likes, newest-liked first.
create index media_likes_user_liked_at_idx on public.media_likes (user_id, liked_at desc);

alter table public.media_likes enable row level security;

-- Owner SELECT (heart state on the galleries) + owner DELETE (unlike). NO insert/update policy:
-- inserts go ONLY through like_media (SECURITY DEFINER bypasses RLS). Owner select/delete are
-- intrinsically safe because they self-scope to the caller's own rows. (select auth.uid()) is the
-- perf-advisor form (evaluated once, not per row).
create policy media_likes_owner_select on public.media_likes
  for select to authenticated using ((select auth.uid()) = user_id);
create policy media_likes_owner_delete on public.media_likes
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Table-grant lockdown (the column/row revoke is a SILENT no-op while a blanket table grant
-- stands): revoke EVERYTHING from public/anon/authenticated first, then re-grant ONLY select +
-- delete to authenticated. INSERT/UPDATE intentionally withheld (see header).
revoke all on table public.media_likes from public, anon, authenticated;
grant select, delete on table public.media_likes to authenticated;

-- 1. like_media — access-checked, idempotent insert. Returns jsonb {ok, reason?} (matches
--    remove_my_upload/restore_media), NEVER a count (host-only privacy). The access predicate
--    mirrors get_my_uploads' liveness filters (status='approved' AND removed_at IS NULL, event not
--    deleted) plus the open-album arm; the guest arm is an EXISTS (a left join to guests can
--    duplicate the row when a user has >1 guest row in an event).
create function public.like_media(p_media_id uuid)
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
        or e.visibility = 'open'          -- any signed-in viewer of a public album
        or exists (select 1 from public.guests g
                   where g.event_id = e.id and g.user_id = v_uid)  -- a guest (joined / uploaded)
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

revoke all on function public.like_media(uuid) from public, anon, authenticated;
grant execute on function public.like_media(uuid) to authenticated;

-- 2. get_event_like_counts — the ONLY count path, host-gated. Returns per-media counts for an event
--    ONLY when the caller is that event's host (the EXISTS gate yields zero rows otherwise), so a
--    count can never reach a guest. Used by the host management gallery (/dashboard/[eventId]).
create function public.get_event_like_counts(p_event_id uuid)
returns table (media_id uuid, like_count integer)
language sql
stable
security definer
set search_path = ''
as $$
  select m.id, count(l.user_id)::integer
  from public.media m
  left join public.media_likes l on l.media_id = m.id
  where m.event_id = p_event_id
    and exists (
      select 1 from public.events e
      where e.id = p_event_id
        and e.host_id = (select auth.uid())
        and e.deleted_at is null
    )
  group by m.id;
$$;

revoke all on function public.get_event_like_counts(uuid) from public, anon, authenticated;
grant execute on function public.get_event_like_counts(uuid) to authenticated;

-- 3. get_my_likes — the cross-event "Likes" tab feed. Mirrors get_my_uploads (SECURITY DEFINER,
--    auth.uid()-based, returns R2 KEYS + event context for the lightbox caption; the RSC presigns,
--    ADR-0003). RE-APPLIES the like_media access predicate so a liked media that has since gone
--    private / removed / had its event deleted DROPS OUT and never leaks its presigned key.
--    event_qr_token is the live token column (share_token does not exist post one-link, ADR-0010).
create function public.get_my_likes(p_limit integer default 200)
returns table (
  id              uuid,
  type            public.media_type,
  original_key    text,
  liked_at        timestamptz,
  event_id        uuid,
  event_name      text,
  event_date      date,
  event_qr_token  text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    m.id, m.type, m.original_key, l.liked_at,
    m.event_id, e.name, e.event_date, e.qr_token
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
