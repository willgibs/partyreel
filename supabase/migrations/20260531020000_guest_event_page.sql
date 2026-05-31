-- Unified guest event page: /e/<qr_token> becomes header + upload + a LIVE gallery + share.
--
-- 1. get_event_by_qr_token gains qr_style (for the in-page QR). Changing a function's RETURN TABLE
--    requires DROP + CREATE (create-or-replace can't change the return type), and DROP drops the
--    grant, so the EXECUTE grant is re-applied below. share_token is deliberately NOT exposed — the
--    guest page shares the JOIN link, and the gallery is keyed by qr_token (capability split intact).
drop function if exists public.get_event_by_qr_token(text);

create function public.get_event_by_qr_token(p_qr_token text)
returns table (
  id uuid,
  name text,
  description text,
  moderation_mode public.moderation_mode,
  is_public boolean,
  accepting_uploads boolean,
  require_email boolean,
  require_display_name boolean,
  event_date date,
  qr_style text
)
language sql
stable
security definer
set search_path = ''
as $$
  select e.id, e.name, e.description, e.moderation_mode, e.is_public,
         e.accepting_uploads, e.require_email, e.require_display_name, e.event_date, e.qr_style
  from public.events e
  where e.qr_token = p_qr_token and e.deleted_at is null;
$$;

grant execute on function public.get_event_by_qr_token(text) to anon, authenticated;

-- 2. New capability-token RPC: approved media for the qr_token's event, newest-first, returned ONLY
--    when the event is public (is_public is the master visibility lock) and not deleted — else empty.
--    The qr_token IS the capability (ADR-0004); this mirrors get_public_album but is qr-keyed +
--    media-only. Powers BOTH the SSR gallery batch and the client poll (/api/guests/gallery).
--    EXPECTED to show in get_advisors as an anon SECURITY DEFINER fn — accepted by design (8th).
create function public.get_event_media_by_qr_token(p_qr_token text)
returns table (
  id uuid,
  type public.media_type,
  original_key text,
  width integer,
  height integer,
  duration_seconds double precision,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select m.id, m.type, m.original_key, m.width, m.height, m.duration_seconds, m.created_at
  from public.media m
  join public.events e on e.id = m.event_id
  where e.qr_token = p_qr_token
    and e.is_public = true
    and e.deleted_at is null
    and m.status = 'approved'
  order by m.created_at desc;
$$;

grant execute on function public.get_event_media_by_qr_token(text) to anon, authenticated;
