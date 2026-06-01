-- Add host_display_name to get_event_by_qr_token so the guest page can show
-- "Hosted by {name}" beneath the event title. Return type change → DROP + CREATE
-- (create-or-replace can't change a function's return columns); drop removes the
-- EXECUTE grant, so re-apply it below.
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
  qr_style text,
  host_display_name text
)
language sql
stable
security definer
set search_path = ''
as $$
  select e.id, e.name, e.description, e.moderation_mode, e.is_public,
         e.accepting_uploads, e.require_email, e.require_display_name,
         e.event_date, e.qr_style,
         p.display_name
  from public.events e
  left join public.profiles p on p.id = e.host_id
  where e.qr_token = p_qr_token and e.deleted_at is null;
$$;

grant execute on function public.get_event_by_qr_token(text) to anon, authenticated;
