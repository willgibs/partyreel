-- A guest removes their OWN photograph from the album, anonymously (the sixth batch, Will, 2026-09-20:
-- "A guest can delete any photo they've personally uploaded, ever"; his answer at approval: final for
-- the host too).
--
-- The signed-in path is remove_my_upload (auth.uid()). An ANONYMOUS guest has no user: their identity
-- is the device-bound session token on their guest row (guests.session_token, minted at join). This RPC
-- is that path: the token is the capability, validated INSIDE the function against the media's own
-- guest row, never taken on trust from a claim. It is reachable ONLY through the server (service_role):
-- the browser posts the token to /api/guests/remove, which calls this on the admin client behind the
-- join limiter. EXECUTE is revoked from public, anon and authenticated explicitly (an MCP-created
-- function inherits an anon grant otherwise: docs/systems/database-security.md).
--
-- Guards, each a refusal rather than a fallthrough:
--   * the media's guest row must carry THIS token (guests.session_token = p_session_token);
--   * that guest row must be UNCLAIMED (guests.user_id IS NULL): a claimed row belongs to the account
--     path, so a shared device's stale token can never delete a signed-in person's photograph;
--   * the guest row and the media must be in the same event, and the event not deleted;
--   * a row with no guest (a host upload, guest_id NULL) is never reachable here.
-- Idempotent on already-removed (never resets removed_at). Marks removed_by_uploader so the host's bin
-- and restore_media never see it (a person's withdrawal is theirs).

create function public.remove_my_upload_by_session(p_session_token text, p_media_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_already_removed boolean;
begin
  if p_session_token is null or length(p_session_token) < 16 then
    return jsonb_build_object('ok', false, 'reason', 'unauthorized');
  end if;

  select (m.status = 'removed')
    into v_already_removed
  from public.media m
  join public.guests g on g.id = m.guest_id
  join public.events e on e.id = m.event_id and e.deleted_at is null
  where m.id = p_media_id
    and g.session_token = p_session_token
    and g.user_id is null
    and g.event_id = m.event_id;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  if v_already_removed then
    return jsonb_build_object('ok', true, 'already_removed', true);
  end if;

  update public.media
     set status = 'removed',
         removed_at = now(),
         removed_by_uploader = true
   where id = p_media_id and status <> 'removed';

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.remove_my_upload_by_session(text, uuid) from public, anon, authenticated;
grant execute on function public.remove_my_upload_by_session(text, uuid) to service_role;
