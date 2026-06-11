-- GALLERY DOORBELL (V1 program Phase 3, slice 3).
-- One contentless Realtime ping whenever an event's APPROVED-VISIBLE media set
-- may have changed: guest/host uploads (service-role inserts), moderation
-- status flips (host RLS updates), restore/remove RPCs, and purges (deletes).
-- Guests subscribe to the PUBLIC broadcast channel 'gallery:<qr_token>' and
-- refetch through the ETag-gated poll route on ping. Topic keyed on qr_token =
-- capability-consistent (ADR-0004: possession of the token IS the gallery
-- authorization), so no Realtime Authorization/RLS is needed on the channel,
-- and the payload is EMPTY by design (the ping carries no data; the refetch is
-- access-gated server-side).
--
-- Failure posture: realtime.send is wrapped so a Realtime outage can NEVER
-- fail the media write that fired the trigger (uploads/moderation must always
-- win; a missed ping is healed by the 60s slow poll).

create or replace function public.notify_gallery_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event_id uuid;
  v_was boolean;
  v_is boolean;
  v_qr text;
begin
  if tg_op = 'INSERT' then
    v_event_id := new.event_id;
    v_was := false;
    v_is := (new.status = 'approved');
  elsif tg_op = 'UPDATE' then
    v_event_id := new.event_id;
    v_was := (old.status = 'approved');
    v_is := (new.status = 'approved');
  else -- DELETE
    v_event_id := old.event_id;
    v_was := (old.status = 'approved');
    v_is := false;
  end if;

  -- Only ring when the approved-visible set actually changed (a pending upload
  -- or a hidden->removed flip is invisible to guests; don't wake their tabs).
  if v_was is not distinct from v_is then
    return null;
  end if;

  -- Deleted events have no live gallery; cascading media deletes stay silent.
  select e.qr_token into v_qr
  from public.events e
  where e.id = v_event_id and e.deleted_at is null;
  if v_qr is null then
    return null;
  end if;

  begin
    perform realtime.send('{}'::jsonb, 'ping', 'gallery:' || v_qr, false);
  exception when others then
    null; -- a realtime failure must never fail the media write
  end;
  return null;
end;
$$;

-- Trigger-only: nothing calls this directly (and the MCP default-grant gotcha
-- means an explicit revoke is required, not optional).
revoke execute on function public.notify_gallery_change() from public, anon, authenticated;

drop trigger if exists media_gallery_doorbell on public.media;
create trigger media_gallery_doorbell
after insert or update or delete on public.media
for each row execute function public.notify_gallery_change();
