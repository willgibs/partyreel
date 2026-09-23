-- =============================================================================================
-- Require an upload to view (the door as three steps; Will, 2026-09-21, rulings.md "the door as
-- three steps"). Wave 0 of that round: the schema alone, applied by the Orchestrator before any
-- lane is cut, so every lane codes against real names (the identity reshape's pattern).
--
-- One host switch, `events.require_upload_to_view`, off by default and free on every tier:
--   ON:  a guest (never the host) sees the full album only once one upload of theirs has completed,
--        approved or held for review; the gate FAILS OPEN while the event is not accepting uploads
--        or the album is full, so nobody is ever held at a step they cannot pass.
--   OFF: the album opens after the name (or the confirmed email).
-- The server enforces it the way the verified-email gate is enforced: the gallery access resolver
-- (docs/systems/guest-flow.md "Gallery access") withholds the full set until the contribution is
-- proven, and a new SECURITY DEFINER read, `get_upload_gate`, answers "has this session or account
-- contributed, and is the album full" for server code on the admin client only.
--
-- Expand only. Nothing is renamed or dropped except `get_event_by_qr_token`, recreated with one
-- more column (a RETURNS TABLE cannot grow under create-or-replace) and re-granted. No trigger and
-- no tier parity: this is a genuinely new flag with no legacy twin, and `GATED_EVENT_SETTINGS`
-- stays ["password", "custom_slug"].
-- =============================================================================================

-- =============================================================================================
-- 1. events.require_upload_to_view — the host's switch, off by default.
-- =============================================================================================
alter table public.events
  add column require_upload_to_view boolean not null default false;

comment on column public.events.require_upload_to_view is
  'Require an upload to view (the door as three steps, 2026-09-21). ON: a guest (never the host) sees the full album only once one upload of theirs has completed, approved or held for review; the gate fails open while the event is not accepting uploads or the album is full. OFF (the default): the album opens after the name or the confirmed email. Free on every tier.';

-- The host writes it, so it joins the column-locked write grant (20260604163011 revoked the TABLE
-- grant and re-granted columns). ★ A bare ADDITIVE grant and nothing else: a table-level revoke here
-- CASCADES TO THE COLUMN GRANTS and wipes every one of them (the identity migration's pre-flight
-- measured it), which would take the whole host app down.
grant insert (require_upload_to_view), update (require_upload_to_view)
  on public.events to authenticated;

-- =============================================================================================
-- 2. get_event_by_qr_token — the door needs to know the third gate too. A RETURNS TABLE cannot grow
--    under create-or-replace: drop, recreate, and RE-GRANT (the drop takes the grant with it). The
--    new column sits beside require_verified_email, unredacted like its sibling (a switch, never a
--    secret); every other column and the redaction rule are carried verbatim from 20260921150000.
-- =============================================================================================
drop function public.get_event_by_qr_token(text);

create function public.get_event_by_qr_token(p_qr_token text)
 returns table(
   id uuid, name text, description text, moderation_mode public.moderation_mode,
   visibility public.event_visibility, has_password boolean, accepting_uploads boolean,
   allow_anonymous_uploads boolean, require_verified_email boolean, require_upload_to_view boolean,
   event_date date, qr_style text, qr_token text, custom_slug text, host_display_name text)
 language sql
 stable security definer
 set search_path to ''
as $function$
  select e.id,
         case when r.hide_name then null else e.name end,
         case when r.hide_meta then null else e.description end,
         e.moderation_mode, e.visibility,
         (e.event_password_hash is not null),
         e.accepting_uploads, e.allow_anonymous_uploads, e.require_verified_email, e.require_upload_to_view,
         case when r.hide_meta then null else e.event_date end,
         e.qr_style,
         e.qr_token,
         case when r.hide_meta then null else e.custom_slug end,
         case when r.hide_meta then null else p.display_name end
  from public.events e
  left join public.profiles p on p.id = e.host_id
  cross join lateral (
    select
      (e.visibility <> 'open'
        and e.host_id is distinct from (select auth.uid())) as hide_meta,
      (e.visibility  = 'private'
        and e.host_id is distinct from (select auth.uid())) as hide_name
  ) r
  where e.deleted_at is null
    and (e.qr_token = p_qr_token
         or (e.custom_slug is not null and lower(e.custom_slug) = lower(p_qr_token)))
  order by (e.qr_token = p_qr_token) desc
  limit 1;
$function$;

grant execute on function public.get_event_by_qr_token(text) to anon, authenticated;

-- =============================================================================================
-- 3. get_upload_gate — "has this viewer contributed, and is the album full", for the access resolver.
--    SERVICE ROLE ONLY: both callers (the guest page's render and the gallery poll) are server code
--    on the admin client, the remove_my_upload_by_session posture; an anon grant would make it a
--    token-validity oracle for no gain. Two identities, one call: the session token (a name-only
--    guest's row, user_id null, the delete RPC's guard) or the account id the server verified with
--    getUser() (a verified guest's row, or a name-only row that claim_anonymous_uploads has stamped).
--
--    ★ THE TICKET IS PUNCHED ONCE. `contributed` counts ANY media row that ever completed for that
--    guest, whatever its status since (Will: "any completed upload counts"): a gate that re-closed
--    when the host hid or removed a photo would leak the host's curation to the guest, and one that
--    re-closed on the guest's own delete would trap them at a step they already passed.
--
--    ★ THE FAIL-OPEN IS THE SERVER'S. `album_full` is exactly the pair the presign ladder refuses
--    `cap_reached` on (get_upload_context: the active-bytes storage cap with its ten percent grace,
--    and the monthly ingress cap), carried verbatim so the gate can never hold a guest the presign
--    would refuse; it is computed only for an uncontributed viewer of an event accepting uploads
--    (the only population the fail-open protects), and `profiles.storage_used_bytes` is deliberately
--    NOT used as a cheaper proxy (the physical meter can disagree with the presign's refusal, the
--    one disagreement that traps).
-- =============================================================================================
create function public.get_upload_gate(
  p_event_id uuid,
  p_session_token text default null,
  p_user_id uuid default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_event public.events;
  v_profile public.profiles;
  v_limits record;
  v_period text := to_char(now(), 'YYYY-MM');
  v_month_bytes bigint;
  v_cap bigint;
  v_ingress_cap bigint;
  v_contributed boolean := false;
  v_at_storage_cap boolean := false;
  v_at_monthly_cap boolean := false;
begin
  select * into v_event from public.events where id = p_event_id and deleted_at is null;
  if not found then
    return jsonb_build_object('contributed', false, 'album_full', false, 'event_gone', true);
  end if;

  select exists (
    select 1
      from public.media m
      join public.guests g on g.id = m.guest_id
     where g.event_id = p_event_id
       and m.event_id = p_event_id
       and (
         (p_session_token is not null and length(p_session_token) >= 16
            and g.session_token = p_session_token and g.user_id is null)
         or (p_user_id is not null and g.user_id = p_user_id)
       )
  ) into v_contributed;

  if not v_contributed and v_event.accepting_uploads then
    select * into v_profile from public.profiles where id = v_event.host_id;
    select * into v_limits from public.tier_limits(v_profile.tier);

    v_ingress_cap := public.monthly_ingress_cap(v_profile.tier, v_profile.storage_cap_bytes);
    if v_ingress_cap is not null then
      select coalesce(cumulative_bytes, 0) into v_month_bytes from public.storage_ledger
        where host_id = v_event.host_id and period = v_period;
      v_at_monthly_cap := coalesce(v_month_bytes, 0) >= v_ingress_cap;
    end if;

    v_cap := coalesce(v_profile.storage_cap_bytes, v_limits.default_storage_cap_bytes);
    if v_cap is not null then
      v_at_storage_cap := public.host_active_bytes(v_event.host_id) >= v_cap + (v_cap / 10);
    end if;
  end if;

  return jsonb_build_object(
    'contributed', v_contributed,
    'album_full', (v_at_storage_cap or v_at_monthly_cap),
    'event_gone', false
  );
end;
$$;

-- ★ An MCP-applied function inherits an anon EXECUTE default grant that a bare `revoke ... from
-- public` does NOT remove: revoke from every client role by name (database-security.md).
revoke all on function public.get_upload_gate(uuid, text, uuid) from public, anon, authenticated;
grant execute on function public.get_upload_gate(uuid, text, uuid) to service_role;

-- =============================================================================================
-- 4. ROLLED-BACK CONTRACT CHECK (run manually via execute_sql AFTER the apply; nothing persists,
--    the block ends in a deliberate RAISE). Rides EXISTING rows and picks them itself: an open,
--    live-moderation test event with uploads open and a confirmed account. Expect the last line to
--    be `ROLLED BACK — every upload-to-view contract held`.
-- =============================================================================================
-- do $$
-- declare
--   v_event public.events;
--   v_qr text;
--   v_uid uuid;
--   v_a jsonb;
--   v_b jsonb;
--   v_tok_a text;
--   v_tok_b text;
--   v_guest_a uuid;
--   v_gate jsonb;
--   v_media_id uuid := gen_random_uuid();
-- begin
--   select * into v_event from public.events
--    where visibility = 'open' and deleted_at is null and accepting_uploads
--      and moderation_mode = 'live' order by created_at limit 1;
--   if v_event.id is null then raise exception 'FAIL: no open live test event to ride'; end if;
--   v_qr := v_event.qr_token;
--
--   select p.id into v_uid from public.profiles p
--     join auth.users u on u.id = p.id
--    where u.email_confirmed_at is not null and p.id <> v_event.host_id limit 1;
--   if v_uid is null then raise exception 'FAIL: no confirmed non-host account to ride'; end if;
--
--   -- ── 1. the column and its default ─────────────────────────────────────────────────────
--   if (select require_upload_to_view from public.events where id = v_event.id) is not false then
--     raise exception 'FAIL: the switch is not off by default';
--   end if;
--   if not has_column_privilege('authenticated', 'public.events', 'require_upload_to_view', 'update')
--      or not has_column_privilege('authenticated', 'public.events', 'require_upload_to_view', 'insert') then
--     raise exception 'FAIL: the host cannot write the new switch';
--   end if;
--   if not has_column_privilege('authenticated', 'public.events', 'require_verified_email', 'update') then
--     raise exception 'FAIL: the sibling column grant was lost (a table-level revoke cascaded)';
--   end if;
--   raise notice 'OK: the switch defaults off, the host can write it, the sibling grant stands';
--
--   -- ── 2. the door RPC returns it and mirrors a flip ───────────────────────────────────────
--   if (select require_upload_to_view from public.get_event_by_qr_token(v_qr)) is not false then
--     raise exception 'FAIL: get_event_by_qr_token does not return the switch';
--   end if;
--   update public.events set require_upload_to_view = true where id = v_event.id;
--   if (select require_upload_to_view from public.get_event_by_qr_token(v_qr)) is not true then
--     raise exception 'FAIL: get_event_by_qr_token does not mirror the switch';
--   end if;
--   if not has_function_privilege('anon', 'public.get_event_by_qr_token(text)', 'execute')
--      or not has_function_privilege('authenticated', 'public.get_event_by_qr_token(text)', 'execute') then
--     raise exception 'FAIL: get_event_by_qr_token lost its client grant at the recreate';
--   end if;
--   raise notice 'OK: get_event_by_qr_token carries the switch and kept its grant';
--
--   -- ── 3. the gate: an unknown token, then a minted guest with no media ─────────────────────
--   v_gate := public.get_upload_gate(v_event.id, 'no-such-token-at-all', null);
--   if (v_gate->>'contributed')::boolean then raise exception 'FAIL: an unknown token reads as contributed'; end if;
--   v_a := public.create_guest(v_qr, null, false, 'Gate check A');
--   v_tok_a := v_a->>'session_token';
--   if v_tok_a is null then raise exception 'FAIL: create_guest returned no session_token (%)', v_a; end if;
--   select id into v_guest_a from public.guests where session_token = v_tok_a;
--   v_gate := public.get_upload_gate(v_event.id, v_tok_a, null);
--   if (v_gate->>'contributed')::boolean then raise exception 'FAIL: a guest with no media reads as contributed'; end if;
--   if (v_gate->>'album_full')::boolean then raise exception 'FAIL: an album under its cap reads as full'; end if;
--   raise notice 'OK: no contribution yet, the album not full';
--
--   -- ── 4. one completed upload punches the ticket, whatever its status after ─────────────────
--   perform public.create_media(v_tok_a, v_media_id, 'photo', 'events/' || v_event.id || '/photo/' || v_media_id || '/original.png', 10);
--   v_gate := public.get_upload_gate(v_event.id, v_tok_a, null);
--   if not (v_gate->>'contributed')::boolean then raise exception 'FAIL: a completed upload does not count'; end if;
--   update public.media set status = 'hidden' where id = v_media_id;
--   if not (public.get_upload_gate(v_event.id, v_tok_a, null)->>'contributed')::boolean then
--     raise exception 'FAIL: a hidden upload stopped counting';
--   end if;
--   update public.media set status = 'removed', removed_at = now(), removed_by_uploader = true where id = v_media_id;
--   if not (public.get_upload_gate(v_event.id, v_tok_a, null)->>'contributed')::boolean then
--     raise exception 'FAIL: a removed upload stopped counting (the ticket is punched once)';
--   end if;
--   update public.media set status = 'approved', removed_at = null, removed_by_uploader = false where id = v_media_id;
--   raise notice 'OK: the ticket is punched once';
--
--   -- ── 5. the claimed row counts through the account, not the token ─────────────────────────
--   update public.guests set user_id = v_uid where id = v_guest_a;
--   if (public.get_upload_gate(v_event.id, v_tok_a, null)->>'contributed')::boolean then
--     raise exception 'FAIL: a claimed row still answers to the bare token';
--   end if;
--   if not (public.get_upload_gate(v_event.id, null, v_uid)->>'contributed')::boolean then
--     raise exception 'FAIL: a claimed row does not count through the account';
--   end if;
--   raise notice 'OK: a claimed row counts through the account';
--
--   -- ── 6. the fail-open: a full album, then closed uploads, for an uncontributed viewer ─────
--   v_b := public.create_guest(v_qr, null, false, 'Gate check B');
--   v_tok_b := v_b->>'session_token';
--   update public.profiles set storage_cap_bytes = 1 where id = v_event.host_id;
--   v_gate := public.get_upload_gate(v_event.id, v_tok_b, null);
--   if (v_gate->>'contributed')::boolean then raise exception 'FAIL: guest B reads as contributed'; end if;
--   if not (v_gate->>'album_full')::boolean then raise exception 'FAIL: a one-byte cap does not read as full'; end if;
--   update public.events set accepting_uploads = false where id = v_event.id;
--   v_gate := public.get_upload_gate(v_event.id, v_tok_b, null);
--   if (v_gate->>'album_full')::boolean then raise exception 'FAIL: album_full computed while uploads are closed'; end if;
--   raise notice 'OK: the fail-open pair reads as the presign would';
--
--   -- ── 7. a gone event ──────────────────────────────────────────────────────────────────────
--   v_gate := public.get_upload_gate(gen_random_uuid(), v_tok_b, null);
--   if not (v_gate->>'event_gone')::boolean then raise exception 'FAIL: a missing event does not read as gone'; end if;
--   raise notice 'OK: a missing event reads as gone';
--
--   -- ── 8. the grants ────────────────────────────────────────────────────────────────────────
--   if has_function_privilege('anon', 'public.get_upload_gate(uuid, text, uuid)', 'execute')
--      or has_function_privilege('authenticated', 'public.get_upload_gate(uuid, text, uuid)', 'execute') then
--     raise exception 'FAIL: get_upload_gate is client-callable';
--   end if;
--   if not has_function_privilege('service_role', 'public.get_upload_gate(uuid, text, uuid)', 'execute') then
--     raise exception 'FAIL: get_upload_gate lost its service_role grant';
--   end if;
--   raise notice 'OK: get_upload_gate is service-role only';
--
--   raise exception 'ROLLED BACK — every upload-to-view contract held';
-- end $$;
