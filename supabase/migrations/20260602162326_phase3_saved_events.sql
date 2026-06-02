-- Phase 3 (config/permissions rework): Accounts & Saved Events.
--
-- A signed-in visitor can SAVE an event to their dashboard. This AUGMENTS the anonymous
-- capability-token flow (ADR-0004) — the upload pipeline (create_media(session_token)) is
-- UNTOUCHED. "Save events" is FREE: it is the account-creation growth driver. See ADR-0009.

-- ---------------------------------------------------------------------------
-- Table
-- ---------------------------------------------------------------------------
-- Both FKs cascade: deleting the EVENT or the ACCOUNT auto-removes the save (no dangling
-- rows, no tail to sweep). PK(user_id, event_id) makes save idempotent and covers the
-- common (user_id, …) read; a separate index covers the event_id FK / reverse lookups.
create table public.saved_events (
  user_id  uuid not null references public.profiles(id) on delete cascade,
  event_id uuid not null references public.events(id)   on delete cascade,
  saved_at timestamptz not null default now(),
  primary key (user_id, event_id)
);

create index saved_events_event_id_idx on public.saved_events (event_id);

-- Per-user RLS: a user only ever sees/writes/deletes their OWN saves. This is the security
-- boundary for the browser-client status-check (select) + unsave (delete). The capability
-- SAVE does NOT go through a raw RLS insert — it goes through save_event() (below), so a
-- client can never bookmark an event it holds no token for.
alter table public.saved_events enable row level security;

create policy saved_events_owner_all on public.saved_events
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- save_event — the capability WRITE
-- ---------------------------------------------------------------------------
-- Resolves the event from the page's qr/share TOKEN (proving the caller has access), never
-- from a client-supplied event_id. Refuses private events (you only hold a link; nothing to
-- show) and your-own events (already under "Your events"). Idempotent. authenticated-only,
-- so it appears ONLY in the 0029 advisor list, NEVER 0028 (anon). auth.uid() is already
-- schema-qualified, so it resolves under `search_path = ''` (same as create_media_as_host).
create function public.save_event(
  p_qr_token text default null,
  p_share_token text default null
)
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
  -- Defense-in-depth (the grant already excludes anon); never trust a missing session.
  if v_uid is null then
    return null;
  end if;

  -- Resolve by whichever token was provided. Private events are never saveable.
  select e.id, e.host_id
    into v_event_id, v_host_id
  from public.events e
  where e.deleted_at is null
    and e.visibility <> 'private'
    and (
      (p_qr_token is not null and e.qr_token = p_qr_token)
      or (p_share_token is not null and e.share_token = p_share_token)
    )
  limit 1;

  if v_event_id is null then
    return null; -- not found / private / deleted → not saveable
  end if;

  -- You can't "save" your own event; it already lives under "Your events". No-op (idempotent).
  if v_host_id = v_uid then
    return v_event_id;
  end if;

  insert into public.saved_events (user_id, event_id)
  values (v_uid, v_event_id)
  on conflict (user_id, event_id) do nothing;

  return v_event_id;
end;
$$;

revoke all on function public.save_event(text, text) from public, anon;
grant execute on function public.save_event(text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- get_saved_events — the saver's "Saved" shelf READ
-- ---------------------------------------------------------------------------
-- SECURITY DEFINER because it reads the name/host/cover of events the saver does NOT own
-- (events RLS is host-only) — a plain select would return nothing. auth.uid()-based (NO
-- p_user_id arg → no enumeration footgun). Visibility-honoring:
--   open     → name + host + date + share_token + cover
--   password → name + host + date + share_token, but cover NULL (password media is gated
--              behind the unlock cookie — a thumbnail would leak it)
--   private  → everything NULL + accessible=false (don't leak a saved private event)
--   deleted  → excluded by the join
-- Returns ONLY share_token (the album capability), NEVER qr_token (handing a share-only saver
-- the upload token would escalate view→upload — the capability split must hold). The dashboard
-- RSC presigns cover_key server-side; raw R2 keys never reach the browser.
create function public.get_saved_events()
returns table (
  event_id uuid,
  saved_at timestamptz,
  name text,
  host_display_name text,
  event_date date,
  visibility public.event_visibility,
  has_password boolean,
  share_token text,
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
    case when e.visibility = 'private' then null else e.share_token end,
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
