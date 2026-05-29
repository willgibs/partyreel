-- Partyreel — initial schema (Phase 0 foundation).
--
-- THE SECURITY BOUNDARY IS RLS + SECURITY-DEFINER RPCs. Read this before editing:
--   • Hosts are authenticated Supabase users (auth.uid() is set). They get direct,
--     RLS-scoped CRUD on their OWN rows.
--   • Guests are ANONYMOUS — no auth row, no JWT (auth.uid() is null). They never
--     touch tables directly. Every guest read/write goes through a security-definer
--     RPC (bottom of this file) that validates an opaque capability token. ADR-0004.
--   • NEVER hand R2 object keys to a browser. RPCs that return keys are meant to be
--     called SERVER-SIDE; the server presigns before sending media to a client.
--
-- ANTI-ABUSE MODEL (the WHY behind the caps — mirrors lib/constants/tiers.ts):
--   Events have NO end date; they persist until the host deletes them. Tier caps are
--   on the TOTAL number of events that EXIST (deleted_at is null), enforced by the
--   events_enforce_limit trigger. Per-event + monthly upload caps live in
--   create_media. Monthly counters NEVER decrement (deletes don't refund) to stop
--   delete-and-re-upload churn. Max tier swaps per-event/event-count caps for a total
--   storage cap (profiles.storage_cap_bytes vs storage_used_bytes).
--
-- The tier→limit numbers necessarily live in TWO places: lib/constants/tiers.ts
-- (app/UX) and public.tier_limits() below (DB enforcement). KEEP THEM IN SYNC.

-- ===========================================================================
-- Enums
-- ===========================================================================
create type public.tier_type as enum ('free', 'event_pass', 'pro', 'max');
create type public.moderation_mode as enum ('live', 'hold_for_approval');
create type public.media_type as enum ('photo', 'video');
create type public.media_status as enum ('pending', 'approved', 'hidden', 'removed');
create type public.reel_status as enum ('pending', 'processing', 'ready');

-- ===========================================================================
-- Tables
-- ===========================================================================

-- profiles: 1:1 with auth.users. Rows are created by the on_auth_user_created
-- trigger, never by the client.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  tier public.tier_type not null default 'free',
  stripe_customer_id text,
  stripe_subscription_id text,
  -- Max tier only: total storage allowance + running usage. storage_used_bytes is
  -- maintained by create_media / purge. tier, stripe_*, and storage_* are NOT
  -- client-writable (see the column grants under RLS).
  storage_cap_bytes bigint,
  storage_used_bytes bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- events: persist until the host deletes them (soft delete -> scheduled purge).
create table public.events (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  description text,
  moderation_mode public.moderation_mode not null default 'live',
  -- is_public: public album (/a/[share_token]) visibility. accepting_uploads: the
  -- album-lock toggle. Both are independent of EXISTENCE — see anti-abuse note.
  is_public boolean not null default true,
  accepting_uploads boolean not null default true,
  require_email boolean not null default false,
  require_display_name boolean not null default true,
  -- Opaque capability tokens. qr_token -> /e/[token] (join+upload); share_token ->
  -- /a/[token] (public album). Unguessable + non-sequential (see ADR-0004).
  qr_token text not null unique default replace(gen_random_uuid()::text, '-', ''),
  share_token text not null unique default replace(gen_random_uuid()::text, '-', ''),
  event_date date, -- informational ONLY (display); NOT a lifecycle/end date.
  deleted_at timestamptz, -- soft delete; frees an event slot, schedules purge.
  purge_at timestamptz, -- scheduled hard purge (set by tier / cancel logic later).
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- guests: anonymous uploaders. No auth row. Created ONLY via create_guest().
create table public.guests (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  display_name text,
  email text,
  session_token text not null unique, -- capability token kept in the guest's browser.
  created_at timestamptz not null default now()
);

-- media: one row per uploaded photo/video. *_key columns are R2 object keys, never URLs.
create table public.media (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  -- null when uploaded by the host, or after the uploading guest is deleted.
  guest_id uuid references public.guests (id) on delete set null,
  type public.media_type not null,
  original_key text not null,
  preview_key text,
  file_size_bytes bigint not null,
  duration_seconds double precision,
  width integer,
  height integer,
  status public.media_status not null default 'pending',
  -- Highlight-reel scaffold (no processing in v1).
  reel_eligible boolean not null default false,
  highlight_score double precision,
  clip_start_seconds double precision,
  clip_end_seconds double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- highlight_reels: scaffold only. Populated by an external worker in a later phase.
create table public.highlight_reels (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  status public.reel_status not null default 'pending',
  output_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- storage_ledger: per host, per calendar month. Source of truth for MONTHLY upload
-- caps + churn prevention. Counters only ever INCREMENT (deletes never refund).
create table public.storage_ledger (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.profiles (id) on delete cascade,
  period text not null, -- 'YYYY-MM'
  cumulative_bytes bigint not null default 0,
  photo_count integer not null default 0,
  video_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (host_id, period),
  constraint storage_ledger_period_format check (period ~ '^\d{4}-\d{2}$')
);

-- ===========================================================================
-- Indexes (foreign keys + the hot query paths)
-- ===========================================================================
create index events_host_id_idx on public.events (host_id);
create index guests_event_id_idx on public.guests (event_id);
create index media_event_id_status_idx on public.media (event_id, status);
create index media_event_id_reel_eligible_idx on public.media (event_id, reel_eligible);
create index media_guest_id_idx on public.media (guest_id);
create index highlight_reels_event_id_idx on public.highlight_reels (event_id);
create index storage_ledger_host_id_idx on public.storage_ledger (host_id);

-- ===========================================================================
-- Shared helpers
--   SECURITY: every function pins `search_path = ''` so nothing on the caller's
--   search_path can shadow an object reference. All names are fully qualified.
-- ===========================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger events_set_updated_at before update on public.events
  for each row execute function public.set_updated_at();
create trigger media_set_updated_at before update on public.media
  for each row execute function public.set_updated_at();
create trigger highlight_reels_set_updated_at before update on public.highlight_reels
  for each row execute function public.set_updated_at();
create trigger storage_ledger_set_updated_at before update on public.storage_ledger
  for each row execute function public.set_updated_at();

-- Create a profile whenever an auth user is created. SECURITY DEFINER so it can
-- insert past RLS (owned by the migration role, which bypasses RLS).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'display_name', ''),
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', ''),
      split_part(coalesce(new.email, ''), '@', 1)
    )
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- THE tier->limits matrix, in SQL. MUST mirror lib/constants/tiers.ts. null = no cap.
create or replace function public.tier_limits(p_tier public.tier_type)
returns table (
  max_events integer,
  per_event_photos integer,
  per_event_videos integer,
  monthly_photos integer,
  monthly_videos integer,
  has_storage_cap boolean
)
language sql
immutable
set search_path = ''
as $$
  select
    case p_tier
      when 'free' then 1
      when 'event_pass' then 1
      when 'pro' then 10
      else null -- max: unlimited events
    end::integer,
    case p_tier
      when 'free' then 75
      when 'event_pass' then 400
      when 'pro' then 400
      else null -- max: unlimited
    end::integer,
    case p_tier
      when 'free' then 15
      when 'event_pass' then 75
      when 'pro' then 75
      else null
    end::integer,
    case p_tier
      when 'free' then 750
      when 'pro' then 8000
      else null -- event_pass + max: no monthly cap
    end::integer,
    case p_tier
      when 'free' then 150
      when 'pro' then 1500
      else null
    end::integer,
    (p_tier = 'max');
$$;

-- Enforce the per-tier cap on the number of events that EXIST. Defense-in-depth so
-- the anti-abuse ceiling holds even if app code forgets. SECURITY DEFINER to read tier.
create or replace function public.enforce_event_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tier public.tier_type;
  v_max integer;
  v_count integer;
begin
  select tier into v_tier from public.profiles where id = new.host_id;
  select max_events into v_max from public.tier_limits(v_tier);

  if v_max is not null then
    select count(*) into v_count
    from public.events
    where host_id = new.host_id and deleted_at is null;

    if v_count >= v_max then
      raise exception 'Event limit reached for the % plan (max % event(s)). Delete an event or upgrade.', v_tier, v_max
        using errcode = 'check_violation';
    end if;
  end if;

  return new;
end;
$$;

create trigger events_enforce_limit
  before insert on public.events
  for each row execute function public.enforce_event_limit();

-- ===========================================================================
-- Row-level security
-- ===========================================================================
alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.guests enable row level security;
alter table public.media enable row level security;
alter table public.highlight_reels enable row level security;
alter table public.storage_ledger enable row level security;

-- profiles: owner reads own; owner may edit ONLY display_name + email. tier,
-- stripe_*, and storage_* are set by the signup trigger, the Stripe webhook (service
-- role), and create_media — never by the client. `(select auth.uid())` is the
-- Supabase-recommended form (the uid is evaluated once per statement, not per row).
create policy profiles_select_own on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy profiles_update_own on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

revoke update on public.profiles from anon, authenticated;
grant update (display_name, email) on public.profiles to authenticated;

-- events: host has full CRUD on their own rows. Anon reaches events only via RPCs.
create policy events_host_all on public.events
  for all to authenticated
  using ((select auth.uid()) = host_id)
  with check ((select auth.uid()) = host_id);

-- guests: host may read the guest list for their own events. Inserts are RPC-only.
create policy guests_host_select on public.guests
  for select to authenticated
  using (exists (
    select 1 from public.events e
    where e.id = guests.event_id and e.host_id = (select auth.uid())
  ));

-- media: host has full control over media in their own events (moderation, delete,
-- host uploads). Guest insert + public reads go through RPCs.
create policy media_host_all on public.media
  for all to authenticated
  using (exists (
    select 1 from public.events e
    where e.id = media.event_id and e.host_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.events e
    where e.id = media.event_id and e.host_id = (select auth.uid())
  ));

-- highlight_reels: host-only, via event ownership.
create policy highlight_reels_host_all on public.highlight_reels
  for all to authenticated
  using (exists (
    select 1 from public.events e
    where e.id = highlight_reels.event_id and e.host_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.events e
    where e.id = highlight_reels.event_id and e.host_id = (select auth.uid())
  ));

-- storage_ledger: host reads own usage. All writes via create_media / service role.
create policy storage_ledger_host_select on public.storage_ledger
  for select to authenticated using (host_id = (select auth.uid()));

-- ===========================================================================
-- Capability-token RPCs — the ONLY interface for anonymous guests.
-- All SECURITY DEFINER with search_path pinned; they validate an opaque token and
-- act on the caller's behalf, bypassing RLS by design. See ADR-0004.
-- ===========================================================================

-- Resolve the event behind a QR token, for the guest join/upload screen. Returns
-- only guest-relevant fields (never host_id or the share_token).
create or replace function public.get_event_by_qr_token(p_qr_token text)
returns table (
  id uuid,
  name text,
  description text,
  moderation_mode public.moderation_mode,
  is_public boolean,
  accepting_uploads boolean,
  require_email boolean,
  require_display_name boolean,
  event_date date
)
language sql
stable
security definer
set search_path = ''
as $$
  select e.id, e.name, e.description, e.moderation_mode, e.is_public,
         e.accepting_uploads, e.require_email, e.require_display_name, e.event_date
  from public.events e
  where e.qr_token = p_qr_token and e.deleted_at is null;
$$;

-- Public album by share token: approved media only, and only when the album is
-- public. ⚠️ Returns R2 KEYS — call SERVER-SIDE only; the server MUST presign before
-- sending media to the browser. Never forward raw keys to a client.
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
  where share_token = p_share_token and is_public = true and deleted_at is null;

  if not found then
    return null;
  end if;

  select jsonb_build_object(
    'event', jsonb_build_object(
      'id', v_event.id,
      'name', v_event.name,
      'description', v_event.description,
      'event_date', v_event.event_date
    ),
    'media', coalesce((
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
    ), '[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$$;

-- Create a guest session for an event. Validates the QR token + required fields,
-- issues an opaque session_token the browser keeps as its capability key.
create or replace function public.create_guest(
  p_qr_token text,
  p_display_name text default null,
  p_email text default null
)
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

  if v_event.require_display_name and nullif(trim(coalesce(p_display_name, '')), '') is null then
    raise exception 'A display name is required to join this event.' using errcode = 'check_violation';
  end if;

  if v_event.require_email and nullif(trim(coalesce(p_email, '')), '') is null then
    raise exception 'An email is required to join this event.' using errcode = 'check_violation';
  end if;

  -- Two UUIDs of entropy (256 bits), hex, no dashes -> clean URL-safe token.
  v_session_token := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');

  insert into public.guests (event_id, display_name, email, session_token)
  values (
    v_event.id,
    nullif(trim(coalesce(p_display_name, '')), ''),
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

-- Finalize a guest upload: validate the session, re-check universal media limits AND
-- the host's tier caps (clients can lie), set status from the event's moderation
-- mode, then atomically insert the row + bump the monthly ledger + storage usage.
--
-- Phase 2 flow: the upload endpoint generates p_media_id, derives the R2 keys from it
-- (lib/r2/keys.ts), presigns, the browser uploads, then calls this to finalize. The
-- event is resolved from the token (not the client); we also defensively require the
-- key to live under this event's prefix, so a guest can't write into another event.
create or replace function public.create_media(
  p_session_token text,
  p_media_id uuid,
  p_type public.media_type,
  p_original_key text,
  p_file_size_bytes bigint,
  p_preview_key text default null,
  p_duration_seconds double precision default null,
  p_width integer default null,
  p_height integer default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_guest public.guests;
  v_event public.events;
  v_profile public.profiles;
  v_limits record;
  v_status public.media_status;
  v_period text := to_char(now(), 'YYYY-MM');
  v_count integer;
  -- Universal media limits — mirror lib/media/limits.ts.
  c_max_photo_bytes constant bigint := 50 * 1024 * 1024; -- 50 MB
  c_max_video_bytes constant bigint := 2 * 1024 * 1024 * 1024; -- 2 GB
  c_max_video_seconds constant integer := 300; -- 5 min
begin
  -- 1. Validate the capability token + event state.
  select * into v_guest from public.guests where session_token = p_session_token;
  if not found then
    raise exception 'Invalid guest session.' using errcode = 'no_data_found';
  end if;

  select * into v_event from public.events where id = v_guest.event_id;
  if v_event.deleted_at is not null then
    raise exception 'This event no longer exists.' using errcode = 'check_violation';
  end if;
  if not v_event.accepting_uploads then
    raise exception 'This event is not accepting uploads.' using errcode = 'check_violation';
  end if;

  -- 2. Defense-in-depth: the key MUST belong to this event (no cross-event writes).
  if p_original_key not like 'events/' || v_event.id::text || '/%' then
    raise exception 'Object key does not belong to this event.' using errcode = 'check_violation';
  end if;

  -- 3. Universal limits (the client already checked these; we don't trust it).
  if p_type = 'photo' and p_file_size_bytes > c_max_photo_bytes then
    raise exception 'Photo exceeds the 50 MB limit.' using errcode = 'check_violation';
  end if;
  if p_type = 'video' then
    if p_file_size_bytes > c_max_video_bytes then
      raise exception 'Video exceeds the 2 GB limit.' using errcode = 'check_violation';
    end if;
    if p_duration_seconds is not null and p_duration_seconds > c_max_video_seconds then
      raise exception 'Video is longer than 5 minutes.' using errcode = 'check_violation';
    end if;
  end if;

  -- 4. Tier caps. Load host profile + limits.
  select * into v_profile from public.profiles where id = v_event.host_id;
  select * into v_limits from public.tier_limits(v_profile.tier);

  -- 4a. Per-event caps (count everything not 'removed').
  if p_type = 'photo' and v_limits.per_event_photos is not null then
    select count(*) into v_count from public.media
      where event_id = v_event.id and type = 'photo' and status <> 'removed';
    if v_count >= v_limits.per_event_photos then
      raise exception 'This event has reached its photo limit (%).', v_limits.per_event_photos using errcode = 'check_violation';
    end if;
  elsif p_type = 'video' and v_limits.per_event_videos is not null then
    select count(*) into v_count from public.media
      where event_id = v_event.id and type = 'video' and status <> 'removed';
    if v_count >= v_limits.per_event_videos then
      raise exception 'This event has reached its video limit (%).', v_limits.per_event_videos using errcode = 'check_violation';
    end if;
  end if;

  -- 4b. Monthly caps (per host; counters never decrement -> churn-proof).
  if p_type = 'photo' and v_limits.monthly_photos is not null then
    select coalesce(photo_count, 0) into v_count from public.storage_ledger
      where host_id = v_event.host_id and period = v_period;
    if coalesce(v_count, 0) >= v_limits.monthly_photos then
      raise exception 'Monthly photo upload limit reached (%).', v_limits.monthly_photos using errcode = 'check_violation';
    end if;
  elsif p_type = 'video' and v_limits.monthly_videos is not null then
    select coalesce(video_count, 0) into v_count from public.storage_ledger
      where host_id = v_event.host_id and period = v_period;
    if coalesce(v_count, 0) >= v_limits.monthly_videos then
      raise exception 'Monthly video upload limit reached (%).', v_limits.monthly_videos using errcode = 'check_violation';
    end if;
  end if;

  -- 4c. Max-tier total storage cap.
  if v_limits.has_storage_cap and v_profile.storage_cap_bytes is not null then
    if v_profile.storage_used_bytes + p_file_size_bytes > v_profile.storage_cap_bytes then
      raise exception 'Storage capacity exceeded for this plan.' using errcode = 'check_violation';
    end if;
  end if;

  -- 5. Status follows the event's moderation mode.
  v_status := case
    when v_event.moderation_mode = 'live' then 'approved'::public.media_status
    else 'pending'::public.media_status
  end;

  -- 6. Insert media + bump the ledger + usage atomically (one function = one tx).
  insert into public.media (
    id, event_id, guest_id, type, original_key, preview_key,
    file_size_bytes, duration_seconds, width, height, status
  ) values (
    p_media_id, v_event.id, v_guest.id, p_type, p_original_key, p_preview_key,
    p_file_size_bytes, p_duration_seconds, p_width, p_height, v_status
  );

  insert into public.storage_ledger (host_id, period, cumulative_bytes, photo_count, video_count)
  values (
    v_event.host_id, v_period, p_file_size_bytes,
    case when p_type = 'photo' then 1 else 0 end,
    case when p_type = 'video' then 1 else 0 end
  )
  on conflict (host_id, period) do update set
    cumulative_bytes = public.storage_ledger.cumulative_bytes + excluded.cumulative_bytes,
    photo_count = public.storage_ledger.photo_count + excluded.photo_count,
    video_count = public.storage_ledger.video_count + excluded.video_count,
    updated_at = now();

  update public.profiles
    set storage_used_bytes = storage_used_bytes + p_file_size_bytes
    where id = v_event.host_id;

  return jsonb_build_object('media_id', p_media_id, 'status', v_status);
end;
$$;

-- Anon (guests) + authenticated (a logged-in host acting as a guest) may call these.
grant execute on function public.get_event_by_qr_token(text) to anon, authenticated;
grant execute on function public.get_public_album(text) to anon, authenticated;
grant execute on function public.create_guest(text, text, text) to anon, authenticated;
grant execute on function public.create_media(text, uuid, public.media_type, text, bigint, text, double precision, integer, integer) to anon, authenticated;
