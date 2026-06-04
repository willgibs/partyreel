-- Recovery / Recently Deleted — Phase 2: media.purge_at (the recoverable-window deadline).
--
-- WHY a column + trigger (not compute-on-the-fly): mirrors events.purge_at so the Phase-4
-- "Recently deleted" UI + the purge cron read ONE field across both kinds; a restore nulls it
-- for free; and it's indexable. The trigger DERIVES it (the single writer) across EVERY removal
-- path — host removeMedia, admin removalUpdate, the reports inline copy, the over-cap auto-reduce
-- — so no mutation has to remember to stamp it.
--
-- purge_at stays UN-SPOOFABLE with NO grant change: a BEFORE trigger sets NEW.purge_at and the
-- column-UPDATE privilege check applies only to the columns named in the statement's SET list
-- (proof: set_updated_at still bumps updated_at though the host lost that grant in 20260604005917).
-- So the host's media UPDATE grant stays (status, removed_at) ONLY.
-- RETRACTION: migration 20260604005917's comment said "Phase 2 will extend this grant to
-- (status, removed_at, purge_at)". That is WRONG — do NOT grant update(purge_at); granting it
-- would re-open the spoof the lockdown just closed. The trigger is the sole writer of purge_at.

alter table public.media add column purge_at timestamptz;

-- Derive purge_at = removed_at + the recoverable window whenever status is 'removed', else null.
-- INVOKER + search_path='' like set_updated_at. 30 days = RECENTLY_DELETED_WINDOW_DAYS
-- (src/lib/lifecycle/recently-deleted.ts) — keep in lockstep.
create or replace function public.set_media_purge_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.purge_at := case
    when new.status = 'removed' then coalesce(new.removed_at, now()) + interval '30 days'
    else null
  end;
  return new;
end;
$$;

create trigger media_set_purge_at
  before insert or update on public.media
  for each row execute function public.set_media_purge_at();

-- Trigger-only plumbing — never callable as an RPC (mirrors the 20260529003631 lockdown).
revoke execute on function public.set_media_purge_at() from public, anon, authenticated;

-- Backfill existing removed rows (the trigger only fires on future writes; without this they'd
-- keep null purge_at and never match the cron's purge_at filter -> leak forever).
update public.media
  set purge_at = removed_at + interval '30 days'
  where status = 'removed' and removed_at is not null;

-- Supports sweepRemovedMedia's `purge_at <= now` filter + the removed half of the standby bin scan.
create index if not exists media_purge_at_idx on public.media (purge_at) where purge_at is not null;

-- NOTE: events.purge_at is intentionally NOT backfilled — legacy soft-deletes keep their stored
-- 60-day tail (sweepExpiredEvents coalesces nulls); shortening a promised window would be wrong.
