-- Phase 2c: "require email" becomes a VERIFIED email (Supabase OTP), and a verifying
-- guest becomes a free account (account-from-guest). create_guest now derives identity
-- (user_id + email) from auth.uid() -> auth.users, NEVER from the client. The contribution
-- pipeline is untouched: a verified guest still uploads via the capability session_token.
--
-- create_guest keeps its SAME 2-arg signature via create-or-replace (the p_email param is
-- now IGNORED) so there is NO re-grant and NO deploy-window breakage: the old build's
-- create_guest(qr, email?) keeps working during the deploy (the common, non-require-email
-- join is unaffected; only a require_email join would change behavior, and there are no
-- live require_email events). Advisors stay UNCHANGED.

-- 1. guests.user_id — the account a verified guest is signed in as (account-from-guest).
--    on delete set null so deleting the account doesn't delete their uploads; NO unique
--    (event_id,user_id) (would break anonymous multi-join — the session_token is the dedupe).
alter table public.guests
  add column user_id uuid references public.profiles(id) on delete set null;

create index guests_user_id_idx on public.guests (user_id);

comment on column public.guests.user_id is
  'The signed-in account (profiles.id) a verified guest joined as, derived from auth.uid() inside create_guest (account-from-guest). NULL for anonymous guests. Never set from the client.';

-- 2. create_guest — verified-identity version (same signature; p_email IGNORED).
create or replace function public.create_guest(p_qr_token text, p_email text default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event public.events;
  v_session_token text;
  v_guest_id uuid;
  v_uid uuid := auth.uid();
  v_email text;
  v_confirmed timestamptz;
begin
  select * into v_event
  from public.events
  where qr_token = p_qr_token and deleted_at is null;

  if not found then
    raise exception 'Event not found.' using errcode = 'no_data_found';
  end if;

  -- Identity is derived from the VERIFIED session, never the client. p_email is ignored
  -- (kept only to preserve the signature -> create-or-replace, no re-grant / deploy window).
  -- The SECURITY DEFINER owner can read auth.users; auth.uid() resolves under search_path=''.
  if v_uid is not null then
    select email, email_confirmed_at into v_email, v_confirmed
    from auth.users where id = v_uid;
  end if;

  -- require_email = require a VERIFIED email (a confirmed Supabase session), NOT a typed
  -- string. The /e/ RSC gate mirrors this for UX; this RPC is the trust boundary.
  if v_event.require_email and (v_uid is null or v_confirmed is null) then
    raise exception 'A verified email is required to upload to this event.' using errcode = 'check_violation';
  end if;

  -- Two UUIDs of entropy (256 bits), hex, no dashes -> clean URL-safe token.
  v_session_token := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');

  -- Stamp the account whenever the guest is signed in (account-from-guest), even on open
  -- events. Anonymous guests get user_id = null + email = null.
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
$$;
