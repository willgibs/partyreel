-- One-link consolidation: collapse the two-token model to a SINGLE event link.
--
-- Every event had two opaque tokens — qr_token (the /e/ event page: view + upload, config-driven)
-- and share_token (the /a/ read-only album). Two links forced the host to choose which to send and
-- forced us to explain the difference to guests. We collapse to ONE link (the qr_token event page);
-- what a guest sees is driven entirely by the host's configs (visibility, accepting_uploads,
-- require_email). The ADR-0004 capability split (qr vs share) RETIRES — there is one token; upload is
-- config-gated, not token-gated. See ADR-00010.
--
-- Order matters: rework/drop every function that references share_token BEFORE dropping the column.
-- A pre-flight confirmed the ONLY share_token references are the unique constraint (drops with the
-- column) + these 5 functions.

-- ---------------------------------------------------------------------------
-- get_public_album — DROP (redundant)
-- ---------------------------------------------------------------------------
-- The album page is gone; the event page already serves its gallery via
-- get_event_media_by_qr_token (open) + the cookie-guarded admin-read (password). This REMOVES one
-- anon SECURITY-DEFINER RPC from the accepted advisor list.
drop function if exists public.get_public_album(text);

-- ---------------------------------------------------------------------------
-- create_report — re-key from share_token to qr_token
-- ---------------------------------------------------------------------------
-- The report capability now rides the single event link. Same (text,uuid,text) types but the param
-- NAME changes (create-or-replace can't rename a param) → DROP+CREATE+re-grant.
drop function if exists public.create_report(text, uuid, text);
create function public.create_report(
  p_qr_token text,
  p_media_id uuid default null,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event public.events;
  v_report_id uuid;
begin
  select * into v_event
  from public.events
  where qr_token = p_qr_token and deleted_at is null;

  if not found then
    raise exception 'Event not found.' using errcode = 'no_data_found';
  end if;

  -- A reported item must belong to this event (no cross-event references).
  if p_media_id is not null and not exists (
    select 1 from public.media m where m.id = p_media_id and m.event_id = v_event.id
  ) then
    raise exception 'Reported media does not belong to this event.' using errcode = 'check_violation';
  end if;

  insert into public.reports (event_id, media_id, reason)
  values (v_event.id, p_media_id, nullif(trim(coalesce(p_reason, '')), ''))
  returning id into v_report_id;

  return jsonb_build_object('report_id', v_report_id);
end;
$$;
grant execute on function public.create_report(text, uuid, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- verify_event_password — qr_token only (drop the share branch)
-- ---------------------------------------------------------------------------
-- Unlock now happens only on the event page. The unlock cookie stays per-event_id, so the cookie
-- mechanics are unchanged; only the resolution path narrows to qr_token.
drop function if exists public.verify_event_password(text, text, text);
create function public.verify_event_password(
  p_qr_token text,
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
  select * into v_event from public.events
    where qr_token = p_qr_token and deleted_at is null;

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
grant execute on function public.verify_event_password(text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- save_event — qr_token only
-- ---------------------------------------------------------------------------
-- One token now, so the capability split that justified accepting share_token here is gone. A saver
-- gets the single link; whether they can upload is config-gated (accepting_uploads), not token-gated.
drop function if exists public.save_event(text, text);
create function public.save_event(p_qr_token text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_event_id uuid;
  v_host_id uuid;
begin
  if v_uid is null then
    return null;
  end if;

  -- Private events are never saveable; resolve by the single token.
  select e.id, e.host_id
    into v_event_id, v_host_id
  from public.events e
  where e.deleted_at is null
    and e.visibility <> 'private'
    and e.qr_token = p_qr_token
  limit 1;

  if v_event_id is null then
    return null; -- not found / private / deleted → not saveable
  end if;

  -- You can't "save" your own event (already under "Your events"). No-op (idempotent).
  if v_host_id = v_uid then
    return v_event_id;
  end if;

  insert into public.saved_events (user_id, event_id)
  values (v_uid, v_event_id)
  on conflict (user_id, event_id) do nothing;

  return v_event_id;
end;
$$;
revoke all on function public.save_event(text) from public, anon;
grant execute on function public.save_event(text) to authenticated;

-- ---------------------------------------------------------------------------
-- get_saved_events — return qr_token (the single link), not share_token
-- ---------------------------------------------------------------------------
-- Return-shape change (column rename share_token → qr_token) → DROP+CREATE+re-grant. Visibility
-- masking is unchanged: private blanks name/host/date/TOKEN/cover; password keeps the link but NO
-- cover (gated media). Saved cards now deep-link to /e/[qr_token].
drop function if exists public.get_saved_events();
create function public.get_saved_events()
returns table (
  event_id uuid,
  saved_at timestamptz,
  name text,
  host_display_name text,
  event_date date,
  visibility public.event_visibility,
  has_password boolean,
  qr_token text,
  cover_key text,
  accessible boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    s.event_id,
    s.saved_at,
    case when e.visibility = 'private' then null else e.name end,
    case when e.visibility = 'private' then null else p.display_name end,
    case when e.visibility = 'private' then null else e.event_date end,
    e.visibility,
    (e.event_password_hash is not null),
    case when e.visibility = 'private' then null else e.qr_token end,
    case when e.visibility = 'open' then cover.original_key else null end,
    (e.visibility <> 'private')
  from public.saved_events s
  join public.events e on e.id = s.event_id and e.deleted_at is null
  left join public.profiles p on p.id = e.host_id
  left join lateral (
    select m.original_key
    from public.media m
    where m.event_id = e.id
      and m.status = 'approved'
      and m.removed_at is null
    order by m.created_at desc
    limit 1
  ) cover on true
  where s.user_id = (select auth.uid())
  order by s.saved_at desc;
$$;
revoke all on function public.get_saved_events() from public, anon;
grant execute on function public.get_saved_events() to authenticated;

-- ---------------------------------------------------------------------------
-- Drop the now-unreferenced share_token column (+ its unique constraint)
-- ---------------------------------------------------------------------------
alter table public.events drop column share_token;
