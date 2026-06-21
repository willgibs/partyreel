-- Reel curation (Round 1): the host-curated highlight set for an event. The host marks approved
-- media as "in the reel"; a later (deferred) external worker stitches the ordered set into a video.
-- Mirrors media_likes EXACTLY (table + RLS + grant-lockdown + an access-checked SECURITY DEFINER
-- insert RPC), but HOST-scoped via event ownership rather than owner-self (a host curates ALL media
-- in their own event). Curation is FREE for any tier (generation is the future paid moment).
--
-- WRITE PATHS:
--   * add    -> add_to_reel(media_id): SECURITY DEFINER, access-checked (you must be the HOST of the
--              media's event AND the media must be approved + not removed), idempotent, appends position.
--   * remove -> a plain host-RLS delete from the browser (mirrors the media_likes unlike). Safe: the
--              owner-DELETE policy self-scopes to the host's own event.
--   * INSERT/UPDATE are REVOKED at the table level, so the ONLY insert path is the access-checked RPC.
--
-- One reel per event (no parent table). `media.reel_eligible` is UNRELATED dead scaffold (reserved
-- for a future auto-scoring worker) - this curated set is the host's explicit human signal.

create table public.reel_items (
  event_id uuid not null references public.events(id) on delete cascade,
  media_id uuid not null references public.media(id)  on delete cascade,
  -- Host sequence (add-order today; a future reorder re-stamps it). Ties broken by added_at.
  position int not null default 0,
  added_at timestamptz not null default now(),
  -- Idempotent: one membership per media per event. Leading event_id serves the per-event read.
  primary key (event_id, media_id)
);

-- The ordered read for the Reel panel (+ the future generation worker).
create index reel_items_event_position_idx on public.reel_items (event_id, position, added_at);

alter table public.reel_items enable row level security;

-- HOST select + delete, scoped via event ownership (mirrors highlight_reels_host_all). NO insert/update
-- policy: inserts go ONLY through add_to_reel (SECURITY DEFINER bypasses RLS). (select auth.uid()) is
-- the perf-advisor form (evaluated once).
create policy reel_items_host_select on public.reel_items
  for select to authenticated using (
    exists (
      select 1 from public.events e
      where e.id = reel_items.event_id
        and e.host_id = (select auth.uid())
        and e.deleted_at is null
    )
  );
create policy reel_items_host_delete on public.reel_items
  for delete to authenticated using (
    exists (
      select 1 from public.events e
      where e.id = reel_items.event_id
        and e.host_id = (select auth.uid())
        and e.deleted_at is null
    )
  );

-- Table-grant lockdown (a column/row revoke is a SILENT no-op while a blanket table grant stands):
-- revoke EVERYTHING, then re-grant ONLY select + delete to authenticated. INSERT/UPDATE withheld.
revoke all on table public.reel_items from public, anon, authenticated;
grant select, delete on table public.reel_items to authenticated;

-- add_to_reel — access-checked, idempotent, appends position. Returns jsonb {ok, reason?} (matches
-- like_media). The host must own the media's event AND the media must be approved + not removed (an
-- un-approved or removed item has no business in a highlight reel).
create function public.add_to_reel(p_media_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid   uuid := (select auth.uid());
  v_event uuid;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'reason', 'unauthorized');
  end if;

  select e.id into v_event
  from public.media m
  join public.events e on e.id = m.event_id and e.host_id = v_uid and e.deleted_at is null
  where m.id = p_media_id
    and m.status = 'approved'
    and m.removed_at is null;

  if v_event is null then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  insert into public.reel_items (event_id, media_id, position)
  values (
    v_event,
    p_media_id,
    coalesce((select max(position) + 1 from public.reel_items where event_id = v_event), 0)
  )
  on conflict (event_id, media_id) do nothing;

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.add_to_reel(uuid) from public, anon, authenticated;
grant execute on function public.add_to_reel(uuid) to authenticated;
