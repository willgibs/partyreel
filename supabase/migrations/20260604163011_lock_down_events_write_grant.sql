-- ============================================================================
-- events write-grant lockdown — close the column-level write bypass (security P1).
--
-- The DEFAULT Supabase grant gave `authenticated` (and `anon`) table-level
-- INSERT/UPDATE/DELETE on EVERY column of public.events. RLS (events_host_all)
-- gates the ROW by ownership (USING/WITH CHECK auth.uid()=host_id), NOT which
-- columns change. Prior migrations ran `revoke update(<col>)` for
-- event_password_hash/custom_slug, but those were SILENT NO-OPS: a table-level
-- grant overrides a column-level revoke (no column ACL entry was ever created).
-- Confirmed live 2026-06-04: authenticated could UPDATE every events column, so a
-- free host could PATCH event_password_hash / custom_slug / require_email to steal
-- Pro features, or rotate qr_token / pin purge_at. (host_id is safe — the WITH
-- CHECK rejects re-owning the row.)
--
-- Fix mirrors the airtight media + profiles column-lock: revoke the table grant,
-- re-grant ONLY the columns the app legitimately writes (createEvent insert /
-- updateEvent + softDeleteEvent update). SECURITY DEFINER RPCs
-- (set/clear_event_password, set/clear_event_slug, restore_event — owner context)
-- and the service-role purge cron bypass these grants and are unaffected. A bare
-- column grant can't gate a VALUE, so require_email's Pro gate + the
-- password-needs-a-hash invariant are enforced by triggers + a CHECK below.
-- ============================================================================

-- 1. TRUE lockdown.
revoke insert, update, delete on public.events from authenticated, anon;

grant insert (host_id, name, description, event_date, visibility, accepting_uploads,
              require_email, moderation_mode, qr_style) on public.events to authenticated;
grant update (name, description, event_date, visibility, accepting_uploads,
              require_email, moderation_mode, qr_style, deleted_at) on public.events to authenticated;
-- NOT granted: event_password_hash, custom_slug (set/cleared ONLY by their SECURITY DEFINER RPCs);
--   qr_token (system-generated, immutable); purge_at (trigger-derived below); host_id (immutable
--   post-create — omitted from UPDATE + guarded by the events_host_all WITH CHECK);
--   id/created_at/updated_at (system/trigger). DELETE is NOT re-granted (event hard-delete is the
--   service-role purge cron only; the host soft-deletes by stamping deleted_at).

-- 2. purge_at becomes trigger-derived (mirror set_media_purge_at) — un-spoofable, single-sourced.
--    A BEFORE trigger sets NEW.purge_at WITHOUT the caller holding the column grant (privilege is
--    checked only on the statement's SET-list), so purge_at stays out of the host grant above.
create or replace function public.set_event_purge_at() returns trigger
  language plpgsql
  set search_path = ''
as $$
begin
  -- 30 days = RECENTLY_DELETED_WINDOW_DAYS (src/lib/lifecycle/recently-deleted.ts); keep in lockstep.
  new.purge_at := case
    when new.deleted_at is not null then new.deleted_at + interval '30 days'
    else null
  end;
  return new;
end;
$$;

create or replace trigger events_set_purge_at
  before insert or update on public.events
  for each row execute function public.set_event_purge_at();

revoke execute on function public.set_event_purge_at() from public, anon, authenticated;

-- 3. require_email Pro-gate enforced at the DB (mirror enforce_event_limit). require_email is a
--    paid feature; this blocks a free host from enabling it via a direct PATCH/insert that bypasses
--    the app-layer check in updateEvent/createEvent. SECURITY DEFINER to read profiles under search_path=''.
create or replace function public.enforce_event_pro_gates() returns trigger
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  v_tier public.tier_type;
begin
  if new.require_email is true
     and (tg_op = 'INSERT' or coalesce(old.require_email, false) is distinct from true) then
    select tier into v_tier from public.profiles where id = new.host_id;
    if v_tier = 'free' then
      -- Distinct from enforce_event_limit's check_violation(23514) so createEvent's error mapping
      -- doesn't mislabel this as "event limit reached". insufficient_privilege fits a Pro gate.
      raise exception 'Requiring a verified email is a paid feature. Upgrade to enable it.'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

create or replace trigger events_enforce_pro_gates
  before insert or update on public.events
  for each row execute function public.enforce_event_pro_gates();

revoke execute on function public.enforce_event_pro_gates() from public, anon, authenticated;

-- 4. Same-row invariant: a 'password'-visibility event MUST carry a hash. set_event_password sets
--    both atomically; clear_event_password reverts visibility when it clears the hash; updateEvent
--    only moves to 'password' when a hash already exists. 0 rows violate this today (confirmed live).
alter table public.events
  add constraint events_password_requires_hash
  check (visibility <> 'password' or event_password_hash is not null);

-- 5. Defensive backfill: derive purge_at for any event soft-deleted in the deploy window between
--    the app change (which stopped writing purge_at) and this trigger. 0 rows expected (the only
--    host is the operator + no delete occurred in-window); the trigger reasserts the same value.
update public.events
  set purge_at = deleted_at + interval '30 days'
  where deleted_at is not null and purge_at is null;
