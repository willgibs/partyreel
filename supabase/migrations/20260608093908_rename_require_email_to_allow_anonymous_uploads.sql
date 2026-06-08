-- Phase 1 (uploader-attribution identity): reframe "require a verified email" as its inverse,
-- "allow anonymous uploads" (default TRUE; Pro toggles it OFF to require an account). An account
-- simply proves ownership now -- there is no separate "verified" concept. Same behavior, clearer
-- mental model, and it removes the negation footgun of a require_email column read as "allow anon".

-- 1. Rename + default. RENAME preserves the column-level INSERT/UPDATE grants (they follow the column).
alter table public.events rename column require_email to allow_anonymous_uploads;
alter table public.events alter column allow_anonymous_uploads set default true;

-- 2. Recreate the 3 functions that referenced the old name BEFORE any DML fires the trigger.
--    get_event_by_qr_token changes its row type (renamed OUT column), so it must be dropped +
--    recreated (create-or-replace can't change return type); re-grant execute to match prior ACL.
drop function if exists public.get_event_by_qr_token(text);
create function public.get_event_by_qr_token(p_qr_token text)
 returns table(
   id uuid, name text, description text, moderation_mode public.moderation_mode,
   visibility public.event_visibility, has_password boolean, accepting_uploads boolean,
   allow_anonymous_uploads boolean, event_date date, qr_style text, qr_token text,
   custom_slug text, host_display_name text)
 language sql
 stable security definer
 set search_path to ''
as $function$
  select e.id, e.name, e.description, e.moderation_mode, e.visibility,
         (e.event_password_hash is not null),
         e.accepting_uploads, e.allow_anonymous_uploads,
         e.event_date, e.qr_style,
         e.qr_token, e.custom_slug,
         p.display_name
  from public.events e
  left join public.profiles p on p.id = e.host_id
  where e.deleted_at is null
    and (e.qr_token = p_qr_token
         or (e.custom_slug is not null and lower(e.custom_slug) = lower(p_qr_token)))
  order by (e.qr_token = p_qr_token) desc
  limit 1;
$function$;
grant execute on function public.get_event_by_qr_token(text) to anon, authenticated;

create or replace function public.create_guest(p_qr_token text, p_email text default null)
 returns jsonb
 language plpgsql
 security definer
 set search_path to ''
as $function$
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

  if v_uid is not null then
    select email, email_confirmed_at into v_email, v_confirmed
    from auth.users where id = v_uid;
  end if;

  -- When the host disallows anonymous uploads, an account (a confirmed Supabase session) is
  -- required to upload. This RPC is the trust boundary; the /e/ RSC mirrors it for UX.
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

create or replace function public.enforce_event_pro_gates()
 returns trigger
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
  v_tier public.tier_type;
begin
  if new.allow_anonymous_uploads is false
     and (tg_op = 'INSERT' or coalesce(old.allow_anonymous_uploads, true) is distinct from false) then
    select tier into v_tier from public.profiles where id = new.host_id;
    if v_tier = 'free' then
      raise exception 'Requiring an account to upload is a paid feature. Upgrade to enable it.'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$function$;

-- 3. Flip existing values to preserve meaning (triggers OFF so the recreated Pro gate can't raise
--    on a true->false flip).
alter table public.events disable trigger user;
update public.events set allow_anonymous_uploads = not allow_anonymous_uploads;
alter table public.events enable trigger user;
