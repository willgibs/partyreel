-- Phase 4 (dashboard consolidation): the signed-in user's cross-event "Uploads" feed.
--
-- UNIONs the user's HOST uploads (media to their own events, guest_id IS NULL) with their GUEST uploads
-- (media whose guest row is theirs, guests.user_id = auth.uid() -- populated by create_guest at join AND
-- retroactively by claim_anonymous_uploads, the P3 work). A media row is EXACTLY one or the other (a host
-- upload has guest_id NULL; a guest upload has a non-null guest_id), so the two arms are disjoint -> UNION
-- ALL is correct and avoids a needless dedup pass.
--
-- SECURITY DEFINER is REQUIRED for the GUEST arm: it reads events.name/event_date/qr_token for events the
-- user does NOT own (events RLS is host-only), exactly like get_saved_events. auth.uid()-based, no
-- client-supplied id (no enumeration footgun). Returns R2 KEYS (original_key/preview_key); the RSC presigns
-- server-side (ADR-0003) -- raw keys never reach the browser.
--
-- No visibility masking: this is the user's OWN upload history, so showing where they put it is not a leak
-- (unlike get_saved_events, where a saver only holds a link). BUT exclude soft-deleted events
-- (e.deleted_at IS NULL) so a Trashed event's media don't reappear, plus only live media
-- (status='approved' AND removed_at IS NULL). Newest-first, bounded; the caller flags truncation (no silent
-- cap). is_host_upload (= guest_id IS NULL) + event_id/name/date/type/created_at make it FILTER-READY for a
-- future cross-gallery sort/filter system with no new RPC.
create function public.get_my_uploads(p_limit integer default 200)
returns table (
  id              uuid,
  type            public.media_type,
  original_key    text,
  preview_key     text,
  created_at      timestamptz,
  event_id        uuid,
  event_name      text,
  event_date      date,
  event_qr_token  text,
  is_host_upload  boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  -- HOST arm: media in MY events, host-added (no guest). I own the event, so name/date/token are mine.
  select
    m.id, m.type, m.original_key, m.preview_key, m.created_at,
    m.event_id, e.name, e.event_date, e.qr_token, true
  from public.media m
  join public.events e on e.id = m.event_id and e.deleted_at is null
  where e.host_id = (select auth.uid())
    and m.guest_id is null
    and m.status = 'approved'
    and m.removed_at is null

  union all

  -- GUEST arm: media whose guest is ME (incl. retroactively-claimed anonymous uploads). host_id <> uid
  -- keeps the (pathological) self-guesting case out of both arms; in practice a host upload has guest_id
  -- NULL, so this is belt-and-braces against a row ever appearing twice.
  select
    m.id, m.type, m.original_key, m.preview_key, m.created_at,
    m.event_id, e.name, e.event_date, e.qr_token, false
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
