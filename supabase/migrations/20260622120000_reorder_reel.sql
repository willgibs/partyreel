-- reorder_reel — re-stamp the host's reel `position` to the given media_id order.
--
-- SECURITY DEFINER because reel_items INSERT/UPDATE are REVOKED at the table grant (20260621180000):
-- add_to_reel was the only write path; this is the second (and only other) one. Mirrors add_to_reel:
-- a host-owns-the-event check, a jsonb {ok, reason?} return, and the locked-down grant.
--
-- The given id set must EXACTLY equal the event's CURRENT reel membership (same count AND every id
-- present) so a crafted / partial / cross-event / duplicated list can never touch another event's rows
-- or leave the reel half-ordered — it returns reason 'stale' instead, which the client treats as
-- "the reel changed underneath, revert + re-seed". The re-stamp is a single set-from-unnest-with-
-- ordinality (one statement, atomic in the function body); `added_at` is left untouched.
create function public.reorder_reel(p_event_id uuid, p_media_ids uuid[])
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid     uuid := (select auth.uid());
  v_owns    boolean;
  v_current int;
  v_given   int := coalesce(array_length(p_media_ids, 1), 0);
  v_matched int;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'reason', 'unauthorized');
  end if;

  -- The caller must HOST the event (and it must not be deleted). Mirrors add_to_reel's event check.
  select exists (
    select 1 from public.events e
    where e.id = p_event_id
      and e.host_id = v_uid
      and e.deleted_at is null
  ) into v_owns;
  if not v_owns then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  -- Set-equality guard: count match + every given id present == the exact current reel set (the PK
  -- (event_id, media_id) keeps the reel side dup-free; the count check rejects a dup in the INPUT).
  select count(*) into v_current
  from public.reel_items where event_id = p_event_id;

  select count(*) into v_matched
  from public.reel_items r
  where r.event_id = p_event_id
    and r.media_id = any(p_media_ids);

  if v_given <> v_current or v_matched <> v_current then
    return jsonb_build_object('ok', false, 'reason', 'stale');
  end if;

  -- One-statement re-stamp: position := the id's index in the array (1-based via ordinality; only the
  -- RELATIVE order matters — listReelItems orders by position ascending).
  update public.reel_items r
  set position = ord.idx
  from unnest(p_media_ids) with ordinality as ord(mid, idx)
  where r.event_id = p_event_id
    and r.media_id = ord.mid;

  return jsonb_build_object('ok', true);
end;
$$;

-- Lockdown identical to add_to_reel: revoke the implicit grants (incl. the anon EXECUTE a Supabase-MCP
-- create would add), then grant ONLY to authenticated.
revoke all on function public.reorder_reel(uuid, uuid[]) from public, anon, authenticated;
grant execute on function public.reorder_reel(uuid, uuid[]) to authenticated;
