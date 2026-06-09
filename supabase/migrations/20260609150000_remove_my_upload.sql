-- Delete-own uploads from the dashboard "Uploads" tab (the P4 read-only hub's deferred follow-up).
--
-- A signed-in user can soft-delete an upload they made -- a host upload in their OWN event, OR a guest
-- upload they made to SOMEONE ELSE's event (incl. retroactively-claimed anonymous uploads). Ownership is
-- re-checked against the SAME two arms as get_my_uploads (auth.uid()-based, no client-supplied trust), so
-- this RPC is authenticated-browser-callable (lint 0029) like claim_anonymous_uploads / restore_media.
--
-- "Soft, but private to the host" (the product decision): a removal reuses the 30-day recovery machinery
-- (status='removed' + removed_at; the media_set_purge_at trigger derives purge_at; the cron auto-purges),
-- BUT a guest's self-deletion is PRIVATE to the host -- it must NOT appear in that host's Recently-deleted
-- bin and must NOT be restorable by the host. We mark those rows with removed_by_uploader=true and teach
-- the host's restore path + bin query to skip them. A host removing their OWN event's upload here behaves
-- exactly like the event-gallery Remove (removed_by_uploader=false, host-restorable).

-- --- privacy marker --------------------------------------------------------------------------
-- Adding a NOT NULL column with a constant default is metadata-only (no table rewrite).
alter table public.media add column removed_by_uploader boolean not null default false;

comment on column public.media.removed_by_uploader is
  'TRUE when a non-host uploader self-deleted their own upload via remove_my_upload (the guest arm). Such '
  'removals are PRIVATE to the host: excluded from the host''s Recently-deleted bin (listRecentlyDeletedMedia) '
  'and refused by restore_media. Host moderation removal (removeMedia) and a host deleting their own event''s '
  'upload leave this false (host-restorable). Writable ONLY by the SECURITY DEFINER remove_my_upload (owner '
  'context) -- it is deliberately NOT in the authenticated (status, removed_at) column grant.';

-- --- remove_my_upload ------------------------------------------------------------------------
create function public.remove_my_upload(p_media_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_is_host_upload boolean;
  v_already_removed boolean;
begin
  -- Defense-in-depth (the grant already excludes anon); a missing session removes nothing.
  if v_uid is null then
    return jsonb_build_object('ok', false, 'reason', 'unauthorized');
  end if;

  -- Resolve ownership via the SAME two arms as get_my_uploads, capturing which arm matched. A row
  -- matches AT MOST one arm (a host upload has guest_id NULL; a guest upload has a non-null guest_id
  -- whose guests.user_id is the caller). The events join requires deleted_at IS NULL, matching
  -- get_my_uploads -- media in a Trashed event isn't reachable in the tab and isn't removable here.
  select
    (e.host_id = v_uid and m.guest_id is null),   -- TRUE => host arm; FALSE => guest arm
    (m.status = 'removed')
  into v_is_host_upload, v_already_removed
  from public.media m
  join public.events e on e.id = m.event_id and e.deleted_at is null
  left join public.guests g on g.id = m.guest_id
  where m.id = p_media_id
    and (
      (e.host_id = v_uid and m.guest_id is null)        -- host arm
      or (g.user_id = v_uid and e.host_id <> v_uid)     -- guest arm (incl. claimed-anonymous)
    );

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  -- Idempotent: a repeat remove must NOT reset removed_at (that would extend how long the bytes
  -- linger). Already-removed is success -- the end state is "removed" either way.
  if v_already_removed then
    return jsonb_build_object('ok', true, 'already_removed', true);
  end if;

  -- Soft-remove. The media_set_purge_at BEFORE trigger derives purge_at on this UPDATE (do NOT set it
  -- here, and purge_at is deliberately ungranted). removed_by_uploader = TRUE only for the guest arm,
  -- making that removal private to the host.
  update public.media
     set status = 'removed',
         removed_at = now(),
         removed_by_uploader = not v_is_host_upload
   where id = p_media_id and status <> 'removed';

  return jsonb_build_object('ok', true, 'is_host_upload', v_is_host_upload);
end;
$$;

-- Authenticated-only, browser-callable (auth.uid() is the unspoofable identity; ownership is
-- re-checked inside; no client-supplied trusted value). Expect lint 0029, never 0028.
revoke all on function public.remove_my_upload(uuid) from public, anon;
grant execute on function public.remove_my_upload(uuid) to authenticated;

-- --- restore_media: respect the uploader's private deletion -----------------------------------
-- create-or-replace the Phase-3 RPC, adding `and m.removed_by_uploader = false` to the ownership
-- SELECT so a guest's self-deleted upload is invisible to the host's restore path (returns not_found),
-- consistent with its exclusion from the host's Recently-deleted bin. Everything else is unchanged.
create or replace function public.restore_media(p_media_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_media public.media;
  v_event public.events;
  v_profile public.profiles;
  v_cap bigint;
  v_active bigint;
begin
  select m.* into v_media from public.media m
    join public.events e on e.id = m.event_id
    where m.id = p_media_id and e.host_id = (select auth.uid())
      and m.removed_by_uploader = false;   -- a guest's self-deletion is private to the host
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  select * into v_event from public.events where id = v_media.event_id;
  if v_event.deleted_at is not null then
    return jsonb_build_object('ok', false, 'reason', 'event_deleted'); -- restore the event first
  end if;
  if v_media.status <> 'removed' then
    return jsonb_build_object('ok', false, 'reason', 'not_removed');
  end if;

  select * into v_profile from public.profiles where id = v_event.host_id;
  v_cap := coalesce(v_profile.storage_cap_bytes,
                    (select default_storage_cap_bytes from public.tier_limits(v_profile.tier)));
  if v_cap is not null then
    v_active := public.host_active_bytes(v_event.host_id);
    if v_active + v_media.file_size_bytes > v_cap then
      return jsonb_build_object('ok', false, 'reason', 'insufficient_space',
        'needed_bytes', (v_active + v_media.file_size_bytes) - v_cap);
    end if;
  end if;

  -- Pure status flip; trigger nulls purge_at; storage_used_bytes unchanged (bytes never left).
  update public.media set status = 'approved', removed_at = null
    where id = p_media_id and status = 'removed';

  return jsonb_build_object('ok', true);
end;
$$;

revoke execute on function public.restore_media(uuid) from public, anon, authenticated;
grant execute on function public.restore_media(uuid) to authenticated;
