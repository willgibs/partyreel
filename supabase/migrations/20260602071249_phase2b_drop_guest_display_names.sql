-- Phase 2b: remove GUEST display names. They were collected at the just-in-time join,
-- stored in guests.display_name, and NEVER shown anywhere (no grid/lightbox/album) — pure
-- friction + DB bloat. The HOST's account name ("Hosted by {name}") is a SEPARATE thing
-- (profiles.display_name -> get_event_by_qr_token.host_display_name) and is UNTOUCHED.
--
-- Two columns go: guests.display_name + events.require_display_name. Only TWO functions
-- reference them (verified: no policies/constraints/views; handle_new_user touches
-- profiles.display_name, not these). So: rebuild both fns WITHOUT the columns, THEN drop the
-- columns (a function can't be redefined while still referencing a column being dropped).
-- require_email stays UNVERIFIED this cut (create_guest keeps its email check + p_email);
-- cut 2c reworks it to a verified OTP.
--
-- create_guest's signature shrinks (drop p_display_name) and get_event_by_qr_token's return
-- shape shrinks (drop require_display_name) -> both are DROP + CREATE + RE-GRANT (a
-- create-or-replace can't change a signature/return-shape, and DROP drops the grant). The
-- advisor lists are UNCHANGED: both stay anon + authenticated SECURITY DEFINER.

-- 1. get_event_by_qr_token — same arg, return shape MINUS require_display_name. Keep
--    visibility/has_password/require_email/host_display_name + all else.
drop function if exists public.get_event_by_qr_token(text);

create function public.get_event_by_qr_token(p_qr_token text)
returns table (
  id uuid,
  name text,
  description text,
  moderation_mode public.moderation_mode,
  visibility public.event_visibility,
  has_password boolean,
  accepting_uploads boolean,
  require_email boolean,
  event_date date,
  qr_style text,
  host_display_name text
)
language sql
stable
security definer
set search_path = ''
as $$
  select e.id, e.name, e.description, e.moderation_mode, e.visibility,
         (e.event_password_hash is not null),
         e.accepting_uploads, e.require_email,
         e.event_date, e.qr_style,
         p.display_name
  from public.events e
  left join public.profiles p on p.id = e.host_id
  where e.qr_token = p_qr_token and e.deleted_at is null;
$$;

grant execute on function public.get_event_by_qr_token(text) to anon, authenticated;

-- 2. create_guest — drop p_display_name (new 2-arg signature). Remove the
--    require_display_name check + the display_name insert column. KEEP the require_email
--    check + the email insert (still unverified until 2c).
drop function if exists public.create_guest(text, text, text);

create function public.create_guest(p_qr_token text, p_email text default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event public.events;
  v_session_token text;
  v_guest_id uuid;
begin
  select * into v_event
  from public.events
  where qr_token = p_qr_token and deleted_at is null;

  if not found then
    raise exception 'Event not found.' using errcode = 'no_data_found';
  end if;

  if v_event.require_email and nullif(trim(coalesce(p_email, '')), '') is null then
    raise exception 'An email is required to join this event.' using errcode = 'check_violation';
  end if;

  -- Two UUIDs of entropy (256 bits), hex, no dashes -> clean URL-safe token.
  v_session_token := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');

  insert into public.guests (event_id, email, session_token)
  values (
    v_event.id,
    nullif(trim(coalesce(p_email, '')), ''),
    v_session_token
  )
  returning id into v_guest_id;

  return jsonb_build_object(
    'session_token', v_session_token,
    'guest_id', v_guest_id,
    'event_id', v_event.id
  );
end;
$$;

grant execute on function public.create_guest(text, text) to anon, authenticated;

-- 3. Now that no function references them, drop the columns.
alter table public.guests drop column display_name;
alter table public.events drop column require_display_name;
