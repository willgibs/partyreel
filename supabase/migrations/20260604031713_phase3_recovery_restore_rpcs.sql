-- Recovery / Recently Deleted — Phase 3: host-facing restore + permanent-delete-now RPCs.
--
-- Three authenticated, ownership-gated SECURITY DEFINER RPCs. They RETURN jsonb {ok,reason,...}
-- for expected refusals (the wrapper maps data.reason) instead of raising, so the capacity case
-- can carry needed_bytes. Capacity gate uses the BASE cap (no +10% upload buffer) — a restore is
-- a deliberate re-add and must fit the strict cap. restore_media is a pure status flip (no
-- storage_used_bytes change — physical bytes never left; the set_media_purge_at trigger nulls
-- purge_at). restore_event clears deleted_at (active membership is DERIVED: deleted_at is null
-- AND status<>'removed', so this re-actives the whole non-removed set in one write —
-- necessarily all-or-nothing; independently-removed media stay in the bin). purge_media_now
-- validates own+removed (the DB boundary) then calls the service-role-only purge_media_rows
-- internally (owner context). GRANTS: explicit revoke-from-anon (MCP default-grants anon).

-- --- restore_media -------------------------------------------------------------------------
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
    where m.id = p_media_id and e.host_id = (select auth.uid());
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

-- --- restore_event -------------------------------------------------------------------------
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
  v_cap bigint;
  v_active bigint;
  v_returning bigint;
  v_event_count integer;
  v_still_removed integer;
begin
  select * into v_event from public.events
    where id = p_event_id and host_id = (select auth.uid()) and deleted_at is not null;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  select * into v_profile from public.profiles where id = v_event.host_id;
  select * into v_limits from public.tier_limits(v_profile.tier);

  -- Slot re-check (enforce_event_limit is BEFORE INSERT only; it does NOT fire on this UPDATE).
  if v_limits.max_events is not null then
    select count(*) into v_event_count from public.events
      where host_id = (select auth.uid()) and deleted_at is null;
    if v_event_count >= v_limits.max_events then
      return jsonb_build_object('ok', false, 'reason', 'event_limit', 'max_events', v_limits.max_events);
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

  update public.events set deleted_at = null, purge_at = null
    where id = p_event_id and deleted_at is not null;

  select count(*) into v_still_removed from public.media
    where event_id = p_event_id and status = 'removed';

  return jsonb_build_object('ok', true, 'media_still_removed', v_still_removed);
end;
$$;

revoke execute on function public.restore_event(uuid) from public, anon, authenticated;
grant execute on function public.restore_event(uuid) to authenticated;

-- --- purge_media_now -----------------------------------------------------------------------
create or replace function public.purge_media_now(p_media_ids uuid[])
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ids uuid[];
  v_freed bigint;
begin
  -- Validated subset: only the caller's OWN, status='removed' media (the DB boundary).
  select coalesce(array_agg(m.id), '{}'::uuid[]) into v_ids
    from public.media m
    join public.events e on e.id = m.event_id
    where m.id = any(p_media_ids)
      and e.host_id = (select auth.uid())
      and m.status = 'removed';

  if array_length(v_ids, 1) is null then
    return jsonb_build_object('ok', true, 'purged', 0, 'freed_bytes', 0);
  end if;

  -- Internal call into the service-role-only purge_media_rows (owner context).
  select coalesce(sum(freed_bytes), 0)::bigint into v_freed
    from public.purge_media_rows(v_ids);

  return jsonb_build_object('ok', true, 'purged', array_length(v_ids, 1), 'freed_bytes', v_freed);
end;
$$;

revoke execute on function public.purge_media_now(uuid[]) from public, anon, authenticated;
grant execute on function public.purge_media_now(uuid[]) to authenticated;
