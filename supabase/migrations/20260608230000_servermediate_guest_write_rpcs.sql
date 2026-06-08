-- Server-mediate the remaining guest write RPCs (H3: spam / guest-row bloat / victim-email poisoning).
-- Part B/H3a (the server-mediation; per-IP rate limits land in H3b).
--
-- ROOT CAUSE: create_guest, create_report, capture_guest_email were anon/authenticated EXECUTE-granted ->
-- directly PostgREST-callable. capture_guest_email additionally trusted a CLIENT p_email (victim newsletter
-- poisoning). FIX: make all three SERVICE-ROLE-ONLY; the Next routes call them via the admin client.
--
-- create_report + capture_guest_email are session/qr-token keyed (no auth.uid()) -> no signature change.
-- create_guest read auth.uid() for identity; the admin client has no auth.uid(), so it now takes a TRUSTED
-- p_user_id the /api/guests route derives from getUser(). The verified EMAIL is still server-sourced: the
-- RPC (SECURITY DEFINER) reads auth.users for p_user_id -- never a client-supplied address. The client
-- p_email param is DROPPED (it was the only injection surface).

-- 1. Recreate create_guest: auth.uid() -> trusted p_user_id; drop the client p_email. Body otherwise as-is.
drop function if exists public.create_guest(text, text);

create function public.create_guest(p_qr_token text, p_user_id uuid default null)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_event public.events;
  v_session_token text;
  v_guest_id uuid;
  v_uid uuid := p_user_id; -- the /api/guests route's getUser()-verified id (admin client has no auth.uid())
  v_email text;
  v_confirmed timestamptz;
begin
  select * into v_event
  from public.events
  where qr_token = p_qr_token and deleted_at is null;

  if not found then
    raise exception 'Event not found.' using errcode = 'no_data_found';
  end if;

  -- Verified email is SERVER-sourced: read auth.users for the trusted uid (definer privilege), never the
  -- client. (This is what closes the email-poisoning surface alongside capture_guest_email's new route.)
  if v_uid is not null then
    select email, email_confirmed_at into v_email, v_confirmed
    from auth.users where id = v_uid;
  end if;

  -- When the host disallows anonymous uploads, an account (a confirmed session) is required to upload.
  if not v_event.allow_anonymous_uploads and (v_uid is null or v_confirmed is null) then
    raise exception 'This event requires an account to upload.' using errcode = 'check_violation';
  end if;

  v_session_token := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');

  insert into public.guests (event_id, user_id, email, session_token)
  values (
    v_event.id,
    v_uid,
    nullif(trim(coalesce(v_email, '')), ''),
    v_session_token
  )
  returning id into v_guest_id;

  return jsonb_build_object(
    'session_token', v_session_token,
    'guest_id', v_guest_id,
    'event_id', v_event.id
  );
end;
$function$;

-- 2. Lock all three to service-role-only (the routes call them via the admin client).
revoke execute on function public.create_guest(text, uuid) from public, anon, authenticated;
grant execute on function public.create_guest(text, uuid) to service_role;
revoke execute on function public.create_report(text, uuid, text) from public, anon, authenticated;
revoke execute on function public.capture_guest_email(text, text, boolean) from public, anon, authenticated;
