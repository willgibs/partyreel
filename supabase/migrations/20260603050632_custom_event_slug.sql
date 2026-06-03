-- Custom event slugs (Phase 1) — an OPTIONAL, host-chosen, human-friendly ALIAS for the
-- one event link. Pro + Event-Pass only. The permanent /e/<qr_token> link NEVER changes and
-- the QR always encodes it; the slug just resolves through the SAME /e/[token] route to the
-- same event (config-gated exactly as today). This EXTENDS ADR-0010 (one link per event):
-- the slug is an ALIAS, NOT a second capability token, and does NOT reintroduce the retired
-- share_token dual-capability model.
--
-- Invariants (mirror the event-password feature — do NOT "simplify" these):
--   * custom_slug is written ONLY through set_event_slug / clear_event_slug (SECURITY
--     DEFINER, tier-gated). The column is revoked from the host's UPDATE grant, so a direct
--     PostgREST patch can't touch it; the RPCs enforce tier + format + uniqueness atomically.
--   * Uniqueness is case-insensitive and ignores soft-deleted events (a partial unique index
--     `where deleted_at is null`) — so changing/removing a slug, or deleting an event, frees
--     that slug for OTHER events immediately. There is deliberately NO old->new redirect.
--   * set/clear are revoked from PUBLIC (anon can't reach them); authenticated only. They join
--     the authenticated (0029) advisor list, NEVER the anon (0028) one — same class as
--     set_event_password. If either ever shows up in the anon list, an over-broad grant slipped in.
--
-- ORDER IS LOAD-BEARING: add the column BEFORE the recreated resolver references e.custom_slug.

-- 1. The column — nullable, RPC-write-only (mirrors the event_password_hash revoke).
alter table public.events add column custom_slug text;
revoke update (custom_slug) on public.events from authenticated;

comment on column public.events.custom_slug is
  'Optional host-chosen alias resolved by /e/[token] (Pro/Event-Pass). NULL = no custom link. Written solely by set_event_slug / clear_event_slug (SECURITY DEFINER, tier-gated); revoked from the host UPDATE grant. Case-insensitive unique among non-deleted events.';

-- 2. Case-insensitive uniqueness, scoped to LIVE events. The `where deleted_at is null`
--    predicate is what frees a soft-deleted event's slug for reuse by another event.
create unique index events_custom_slug_unique
  on public.events (lower(custom_slug))
  where custom_slug is not null and deleted_at is null;

-- 3. get_event_by_qr_token — now resolves BY qr_token OR custom_slug (qr_token wins). The
--    return shape gains qr_token + custom_slug so the page can thread the CANONICAL qr_token
--    to every downstream qr_token-keyed RPC (the media poll, create_guest, save_event,
--    create_report, verify_event_password). Return-shape change => DROP + CREATE + re-grant.
--    The param name stays p_qr_token (it now accepts a slug too) to avoid churning callers.
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
  qr_token text,
  custom_slug text,
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
         e.qr_token, e.custom_slug,
         p.display_name
  from public.events e
  left join public.profiles p on p.id = e.host_id
  where e.deleted_at is null
    and (e.qr_token = p_qr_token
         or (e.custom_slug is not null and lower(e.custom_slug) = lower(p_qr_token)))
  order by (e.qr_token = p_qr_token) desc
  limit 1;
$$;

grant execute on function public.get_event_by_qr_token(text) to anon, authenticated;

-- 4. set_event_slug — host-authenticated (NOT anon). Verifies ownership + non-free tier +
--    format + uniqueness, then writes the normalized (lower/trim) slug. One of the only two
--    writers of custom_slug. Mirrors set_event_password's shape.
create or replace function public.set_event_slug(p_event_id uuid, p_slug text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event public.events;
  v_tier public.tier_type;
  v_slug text;
begin
  select * into v_event from public.events
    where id = p_event_id and host_id = (select auth.uid()) and deleted_at is null;
  if not found then
    raise exception 'Event not found.' using errcode = 'no_data_found';
  end if;

  -- `= 'free'` admits pro/event_pass AND the retired `max` (do NOT enumerate tiers).
  select tier into v_tier from public.profiles where id = (select auth.uid());
  if v_tier = 'free' then
    raise exception 'Custom links are available on paid plans.' using errcode = 'check_violation';
  end if;

  v_slug := lower(trim(coalesce(p_slug, '')));

  -- Format (defense in depth; the zod schema + reserved list are the primary UX gate).
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

revoke execute on function public.set_event_slug(uuid, text) from public;
grant execute on function public.set_event_slug(uuid, text) to authenticated;

-- 5. clear_event_slug — host-authenticated. Frees the slug (sets null) so it becomes
--    claimable by other events. No tier check: a downgraded host can still REMOVE (mirrors
--    clear_event_password — the dormant artifact stays removable on a lapsed plan).
create or replace function public.clear_event_slug(p_event_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.events set custom_slug = null
    where id = p_event_id and host_id = (select auth.uid()) and deleted_at is null;
  if not found then
    raise exception 'Event not found.' using errcode = 'no_data_found';
  end if;
end;
$$;

revoke execute on function public.clear_event_slug(uuid) from public;
grant execute on function public.clear_event_slug(uuid) to authenticated;
