-- Phase 1: 3-state access model (open|password|private) + Pro password protection.
--
-- Replaces events.is_public (boolean) with an event_visibility enum and adds an optional
-- bcrypt password hash. The three read RPCs that gated on is_public now gate on the enum.
--
-- SECURITY-CRITICAL invariants (do NOT "simplify" these):
--   * The anon media RPCs gate on visibility = 'open' (NOT <> 'private'). A PASSWORD
--     event's media must NEVER stream through an anon RPC; it is served only via the
--     server's admin-read path AFTER the signed unlock cookie is verified.
--   * The bcrypt hash NEVER leaves the DB. RPCs expose only has_password = (hash IS NOT NULL).
--   * The host writes the password ONLY through set_event_password / clear_event_password
--     (SECURITY DEFINER, tier-gated). event_password_hash is revoked from the host's column
--     UPDATE grant, so a direct PostgREST patch can't touch it. set/clear are revoked from
--     PUBLIC (so anon can't reach them); only authenticated may call them.

-- pgcrypto lives in the `extensions` schema; with search_path='' every call must be fully
-- qualified (extensions.crypt / extensions.gen_salt). Idempotent for a fresh local stack.
create extension if not exists pgcrypto with schema extensions;

-- 1. The enum + the column swap. Disposable test data: translate is_public, then drop it.
create type public.event_visibility as enum ('open', 'password', 'private');

alter table public.events
  add column visibility public.event_visibility not null default 'open';

update public.events
  set visibility = case when is_public then 'open' else 'private' end::public.event_visibility;

alter table public.events drop column is_public;

-- 2. The password hash. Pro-only middle ground; never returned to a browser.
alter table public.events add column event_password_hash text;
revoke update (event_password_hash) on public.events from authenticated;

comment on column public.events.event_password_hash is
  'bcrypt hash of the album password (visibility=password). NEVER select to a client; RPCs expose only has_password. Written solely by set_event_password / clear_event_password (SECURITY DEFINER, tier-gated).';

-- 3. get_event_by_qr_token — return shape changes (is_public -> visibility + has_password),
--    so DROP + CREATE + re-grant. No visibility gate: returns open/password/private rows; the
--    page branches (private -> locked; password -> gate, or content once unlocked).
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
  select e.id, e.name, e.description, e.moderation_mode, e.visibility,
         (e.event_password_hash is not null),
         e.accepting_uploads, e.require_email, e.require_display_name,
         e.event_date, e.qr_style,
         p.display_name
  from public.events e
  left join public.profiles p on p.id = e.host_id
  where e.qr_token = p_qr_token and e.deleted_at is null;
$$;

grant execute on function public.get_event_by_qr_token(text) to anon, authenticated;

-- 4. get_event_media_by_qr_token — gate is_public=true -> visibility='open'. SECURITY:
--    NOT `<> 'private'`, or a password event's media would leak to anyone with the qr_token.
create or replace function public.get_event_media_by_qr_token(p_qr_token text)
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
    and e.visibility = 'open'
    and e.deleted_at is null
    and m.status = 'approved'
  order by m.created_at desc;
$$;

grant execute on function public.get_event_media_by_qr_token(text) to anon, authenticated;

-- 5. get_public_album — resolve the envelope for open+password (so /a/ can show the name +
--    gate), null for private/missing/deleted (the page 404s). Media is included ONLY when
--    visibility='open'; a password album returns media:[] until the server admin-read unlocks
--    it. Envelope gains visibility + has_password.
create or replace function public.get_public_album(p_share_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_event public.events;
  v_result jsonb;
begin
  select * into v_event
  from public.events
  where share_token = p_share_token and visibility <> 'private' and deleted_at is null;

  if not found then
    return null;
  end if;

  select jsonb_build_object(
    'event', jsonb_build_object(
      'id', v_event.id,
      'name', v_event.name,
      'description', v_event.description,
      'event_date', v_event.event_date,
      'visibility', v_event.visibility,
      'has_password', (v_event.event_password_hash is not null)
    ),
    'media', case when v_event.visibility = 'open' then coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', m.id,
        'type', m.type,
        'original_key', m.original_key,
        'preview_key', m.preview_key,
        'width', m.width,
        'height', m.height,
        'duration_seconds', m.duration_seconds,
        'created_at', m.created_at
      ) order by m.created_at desc)
      from public.media m
      where m.event_id = v_event.id and m.status = 'approved'
    ), '[]'::jsonb) else '[]'::jsonb end
  ) into v_result;

  return v_result;
end;
$$;

grant execute on function public.get_public_album(text) to anon, authenticated;

-- 6. verify_event_password — anon capability RPC (the 9th). Resolve the event by whichever
--    token is provided (exactly one of qr/share), require visibility='password' + a hash,
--    return the event_id on a bcrypt match else null. The route uses the id only to mint the
--    signed unlock cookie; nothing sensitive leaves (never the hash).
create or replace function public.verify_event_password(
  p_qr_token text default null,
  p_share_token text default null,
  p_password text default null
)
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_event public.events;
begin
  if (p_qr_token is null) = (p_share_token is null) then
    raise exception 'Provide exactly one of qr_token or share_token.' using errcode = 'check_violation';
  end if;

  if p_qr_token is not null then
    select * into v_event from public.events
      where qr_token = p_qr_token and deleted_at is null;
  else
    select * into v_event from public.events
      where share_token = p_share_token and deleted_at is null;
  end if;

  -- Generic: do not distinguish "no event" / "not password-protected" / "wrong password".
  if not found or v_event.visibility <> 'password' or v_event.event_password_hash is null then
    return null;
  end if;

  if extensions.crypt(coalesce(p_password, ''), v_event.event_password_hash) = v_event.event_password_hash then
    return v_event.id;
  end if;
  return null;
end;
$$;

grant execute on function public.verify_event_password(text, text, text) to anon, authenticated;

-- 7. set_event_password — host-authenticated (NOT anon). Verifies ownership + non-free tier +
--    a non-trivial password, then sets the bcrypt hash AND flips visibility='password'
--    atomically. This is the ONLY path to visibility='password'. Revoked from PUBLIC so anon
--    can't reach it (the auth.uid() check fails closed anyway, but keep it off the anon API).
create or replace function public.set_event_password(p_event_id uuid, p_password text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event public.events;
  v_tier public.tier_type;
begin
  select * into v_event from public.events
    where id = p_event_id and host_id = (select auth.uid()) and deleted_at is null;
  if not found then
    raise exception 'Event not found.' using errcode = 'no_data_found';
  end if;

  select tier into v_tier from public.profiles where id = (select auth.uid());
  if v_tier = 'free' then
    raise exception 'Password protection is available on paid plans.' using errcode = 'check_violation';
  end if;

  if length(trim(coalesce(p_password, ''))) < 4 then
    raise exception 'Password must be at least 4 characters.' using errcode = 'check_violation';
  end if;

  update public.events
    set event_password_hash = extensions.crypt(p_password, extensions.gen_salt('bf')),
        visibility = 'password'
    where id = p_event_id and host_id = (select auth.uid());
end;
$$;

revoke execute on function public.set_event_password(uuid, text) from public;
grant execute on function public.set_event_password(uuid, text) to authenticated;

-- 8. clear_event_password — host-authenticated. Clears the hash. Reverts visibility to 'open'
--    ONLY when currently 'password' (NEVER private -> open: that would expose a private album).
create or replace function public.clear_event_password(p_event_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.events
    set event_password_hash = null,
        visibility = case when visibility = 'password' then 'open'::public.event_visibility else visibility end
    where id = p_event_id and host_id = (select auth.uid()) and deleted_at is null;
  if not found then
    raise exception 'Event not found.' using errcode = 'no_data_found';
  end if;
end;
$$;

revoke execute on function public.clear_event_password(uuid) from public;
grant execute on function public.clear_event_password(uuid) to authenticated;
