-- THE FREE/PRO SHIFT (Will, 2026-09-28, his note on event-safety's `choose`): "shift a few more
-- pro features on free, so the free plan feels very close to the same pro experience, minus a few
-- core blockers that more clearly define what a pro upgrade includes (videos, more storage,
-- unlimited events, no reel watermarks) ... free should become much more restrictive on storage
-- (like 100mb)".
--
-- Every number mirrors src/lib/constants/tiers.ts (the human-authored source; Vitest guards each
-- pairing: tier-limits-parity.test.ts and tiers-sql.test.ts). Four functions,
-- no table, no column, no grant widened:
--
--   1. tier_limits(): Free's cap 2 GB -> 100 MB; its monthly ingress follows the paid rule
--      (3x the cap: 300 MB, from a flat 20 GB); its clips run 60 s, as paid ones do.
--   2. set_event_password: the Free refusal goes (a password is on every plan).
--   3. set_event_slug: the Free refusal goes (a custom link is on every plan), and the RESERVED
--      WORDS become a SQL refusal. A free account can now hold a slug, and an authenticated host
--      can call this RPC straight through PostgREST, past the server action's zod parse, so the
--      app-layer list alone would let a throwaway account wear /e/support.
--   4. restore_event: a custom link FREES WHEN ITS EVENT IS DELETED. The partial unique index
--      already hands the slug to any other live event the moment this one goes to Deleted; a
--      restore after someone took it used to fail outright on that index (23505), so the host
--      could never get the event back. It now comes back on its permanent link alone.
--
-- Never touched here: create_media, create_media_as_host, get_upload_context and every guest-path
-- function (safety-wiring replaces those this batch). They read tier_limits() and
-- monthly_ingress_cap() by column name, so the new numbers reach them unchanged.
--
-- Same signatures and return types throughout, so `create or replace` keeps every function's
-- grants; each block restates its grant set anyway, exactly as it stands live (2026-09-28,
-- has_function_privilege), because a restated grant is the one a reviewer can read.

-- --- 1. tier_limits(): Free at 100 MB, ingress derived on every tier, 60 s clips everywhere ------
-- The columns are unchanged (callers `select * into` and read BY NAME), so this is a plain
-- create-or-replace, never the drop + create a returns-table change needs. The all-null
-- monthly_ingress_bytes column stays: it is how a tier would take a static bound back.
create or replace function public.tier_limits(p_tier public.tier_type)
returns table (
  max_events integer,
  monthly_ingress_bytes bigint,
  default_storage_cap_bytes bigint,
  ingress_cap_multiplier integer,
  max_reel_seconds integer
)
language sql
immutable
set search_path = ''
as $$
  select
    case p_tier
      when 'free' then 1
      when 'event_pass' then 1
      else null -- pro + max(retired): unlimited events
    end::integer,
    case p_tier
      when 'free' then null -- Free follows the paid rule now (3x its cap, below)
      else null -- every tier DERIVES its bound: ingress_cap_multiplier x the effective storage cap
    end::bigint,
    case p_tier
      when 'free' then 100::bigint * 1024 * 1024 -- 100 MB
      when 'event_pass' then 75::bigint * 1024 * 1024 * 1024 -- 75 GB
      else null -- pro: governed by profiles.storage_cap_bytes; max(retired): unused
    end::bigint,
    case p_tier
      when 'free' then 3 -- 3 x 100 MB = 300 MB a month
      else 3 -- paid ingress = 3x the effective storage cap
    end::integer,
    case p_tier
      when 'free' then 60 -- a clip's length is no longer a paid line; its mark is
      else 60 -- ('max' retired -> treated as pro)
    end::integer;
$$;

-- tier_limits() is an immutable lookup of public constants that only definer bodies call; its
-- grants are the defaults it has always kept (public, anon, authenticated). Unchanged on purpose.

-- --- 2. set_event_password: on every plan ----------------------------------------------------------
-- Byte-for-byte its only definition (20260602043855) minus the tier read and its refusal.
-- Ownership, the length floor and the atomic hash + visibility flip are untouched: this is still
-- the ONLY path to visibility = 'password'.
create or replace function public.set_event_password(p_event_id uuid, p_password text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event public.events;
begin
  select * into v_event from public.events
    where id = p_event_id and host_id = (select auth.uid()) and deleted_at is null;
  if not found then
    raise exception 'Event not found.' using errcode = 'no_data_found';
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

revoke execute on function public.set_event_password(uuid, text) from public, anon;
grant execute on function public.set_event_password(uuid, text) to authenticated;

-- --- 3. set_event_slug: on every plan, and the reserved words refused in SQL ----------------------
-- Byte-for-byte its only definition (20260603050632) minus the tier read and its refusal, plus the
-- reserved-word refusal. The array IS RESERVED_SLUGS (src/lib/constants/reserved-slugs.ts);
-- tiers-sql.test.ts fails the gate when the two differ. Its wording is the zod schema's.
create or replace function public.set_event_slug(p_event_id uuid, p_slug text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event public.events;
  v_slug text;
begin
  select * into v_event from public.events
    where id = p_event_id and host_id = (select auth.uid()) and deleted_at is null;
  if not found then
    raise exception 'Event not found.' using errcode = 'no_data_found';
  end if;

  v_slug := lower(trim(coalesce(p_slug, '')));

  -- Format (defense in depth; the zod schema is the primary UX gate).
  if length(v_slug) < 3 or length(v_slug) > 50 then
    raise exception 'Custom links are 3 to 50 characters.' using errcode = 'check_violation';
  end if;
  if v_slug !~ '^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$' then
    raise exception 'Use lowercase letters, numbers, and hyphens only.' using errcode = 'check_violation';
  end if;
  -- A 32-hex slug could shadow the qr_token namespace — reject it (the resolver also prefers
  -- qr_token, but this removes any ambiguity and stops a host claiming a token-looking slug).
  if v_slug ~ '^[0-9a-f]{32}$' then
    raise exception 'That custom link is not allowed.' using errcode = 'check_violation';
  end if;
  -- ★ THE RESERVED WORDS, AUTHORITATIVE HERE (the free/pro shift): a free account can hold a
  -- slug now, and nothing stops a host calling this function past the server action.
  if v_slug = any (array[
    'about', 'abuse', 'account', 'admin', 'api', 'app', 'auth', 'billing', 'blog', 'careers',
    'contact', 'dashboard', 'demo', 'design', 'e', 'events', 'features', 'help', 'host',
    'how-it-works', 'legal', 'login', 'logout', 'new', 'official', 'partyreel', 'payment',
    'payments', 'press', 'pricing', 'privacy', 'reel', 'refund', 'refunds', 'safety', 'security',
    'settings', 'signup', 'staff', 'status', 'support', 'terms', 'verify', 'welcome', 'www'
  ]) then
    raise exception 'That word is reserved. Try another.' using errcode = 'check_violation';
  end if;

  -- Uniqueness among LIVE events (the partial unique index is the hard backstop; this
  -- pre-check gives a friendly message). A same-instant race loser surfaces as 23505.
  if exists (
    select 1 from public.events
    where lower(custom_slug) = v_slug and deleted_at is null and id <> p_event_id
  ) then
    raise exception 'That custom link is already taken.' using errcode = 'check_violation';
  end if;

  update public.events set custom_slug = v_slug
    where id = p_event_id and host_id = (select auth.uid());
end;
$$;

revoke execute on function public.set_event_slug(uuid, text) from public, anon;
grant execute on function public.set_event_slug(uuid, text) to authenticated;

-- --- 4. restore_event: a slug taken while its event sat in Deleted stays with its new holder ------
-- Byte-for-byte its newest definition (20260827210000) except the undelete, which now keeps the
-- custom link only while it is still free, and the result's `custom_slug_released`. The profiles
-- lock, the slot re-check and the capacity gate are untouched (migration-guards.test.ts pins the
-- lock).
create or replace function public.restore_event(p_event_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event public.events;
  v_profile public.profiles;
  v_limits record;
  v_max integer;
  v_cap bigint;
  v_active bigint;
  v_returning bigint;
  v_event_count integer;
  v_still_removed integer;
  v_slug_released boolean := false;
begin
  select * into v_event from public.events
    where id = p_event_id and host_id = (select auth.uid()) and deleted_at is not null;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  -- QA #17: `for update` on the host's own profiles row (host_id = auth.uid() here, proven by the
  -- select above) serializes the slot count + capacity gate against concurrent restores/creates.
  select * into v_profile from public.profiles where id = v_event.host_id for update;
  select * into v_limits from public.tier_limits(v_profile.tier);

  -- Slot re-check (enforce_event_limit is BEFORE INSERT only; it does NOT fire on this UPDATE).
  -- event_slots (the stacked-pass count) overrides the static tier limit when present.
  v_max := coalesce(v_profile.event_slots, v_limits.max_events);
  if v_max is not null then
    select count(*) into v_event_count from public.events
      where host_id = (select auth.uid()) and deleted_at is null;
    if v_event_count >= v_max then
      return jsonb_build_object('ok', false, 'reason', 'event_limit', 'max_events', v_max);
    end if;
  end if;

  -- Capacity gate on the media that RE-ACTIVE when deleted_at clears (non-removed in this event).
  v_cap := coalesce(v_profile.storage_cap_bytes, v_limits.default_storage_cap_bytes);
  if v_cap is not null then
    select coalesce(sum(file_size_bytes), 0)::bigint into v_returning
      from public.media where event_id = p_event_id and status <> 'removed';
    v_active := public.host_active_bytes(v_event.host_id);
    if v_active + v_returning > v_cap then
      return jsonb_build_object('ok', false, 'reason', 'insufficient_space',
        'needed_bytes', (v_active + v_returning) - v_cap);
    end if;
  end if;

  -- ★ THE SLUG FREED AT DELETION STAYS FREED. events_custom_slug_unique covers live events only,
  -- so another event may have claimed this one's custom link while it sat in Deleted; clearing
  -- deleted_at then trips that index, the one unique index an undelete can newly violate. Keep
  -- the link when it is still free; when it is taken, come back on the permanent link alone
  -- rather than refuse the restore.
  begin
    update public.events set deleted_at = null, purge_at = null
      where id = p_event_id and deleted_at is not null;
  exception when unique_violation then
    update public.events set deleted_at = null, purge_at = null, custom_slug = null
      where id = p_event_id and deleted_at is not null;
    v_slug_released := true;
  end;

  select count(*) into v_still_removed from public.media
    where event_id = p_event_id and status = 'removed';

  return jsonb_build_object('ok', true, 'media_still_removed', v_still_removed,
    'custom_slug_released', v_slug_released);
end;
$$;

revoke execute on function public.restore_event(uuid) from public, anon, authenticated;
grant execute on function public.restore_event(uuid) to authenticated;
