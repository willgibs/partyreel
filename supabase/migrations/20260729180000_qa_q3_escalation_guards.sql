-- QA Q3 — privilege escalation + over-disclosure (adversarial review 2026-07-29).
--
-- PENDING-APPLY. At apply time: (1) diff EVERY `create or replace function` body below against live
-- `pg_get_functiondef` and reconcile drift FIRST (the repo file can lag live); (2) apply_migration
-- verbatim; (3) get_advisors; (4) run the rolled-back contract check at the bottom; (5) regenerate
-- src/lib/db/types.ts and drop the two pre-apply typing seams named in the app diff.
--
-- EXPECTED ADVISOR DELTA: NONE. No new tables, no new RPCs, no grant that moves a function between
-- lint 0028 (anon) and 0029 (authenticated). Specifically: get_event_by_qr_token + get_public_profile
-- stay in 0028 (anon READ, by design); restore_media stays in 0029 (authenticated); the four trigger
-- functions must appear in NEITHER list (explicit revokes below, because MCP-applied SQL inherits an
-- anon EXECUTE default grant). The two new media columns are service-role-write-only and are NOT in
-- the authenticated SELECT grant, so they add no advisor surface.
--
-- Closes six findings. The through-line: a SECURITY DEFINER RPC's guards are only real if the direct
-- PostgREST write that skips the RPC is closed too, and an anon-executable READ must not disclose
-- more than the page it backs.
--
--   #7  media escalation  — a host held update(status, removed_at), so one PATCH to /rest/v1/media
--                           walked past restore_media's legal-hold refusal, its removed_by_uploader
--                           privacy guard and its capacity gate.
--   #10 events un-delete  — deleted_at is in the authenticated write allowlist and
--                           events_enforce_limit was BEFORE INSERT only, so a Free host could PATCH
--                           deleted_at back to null and hold unlimited live events.
--   #8  provenance        — an operator takedown was silently reversible by the reported host.
--   #24 honest restore    — restore ALWAYS republished as 'approved', un-hiding hidden content.
--   #23 profiles.email    — client-writable, and it is the recipient of every transactional email.
--   #41 session_token     — a host could read the guest's plaintext upload capability over PostgREST.
--   #36 get_public_profile— disclosed guest-list membership the album withholds from anon viewers.
--   #40 get_event_by_qr_token — no visibility gate: full metadata for private/password events.
--
-- ★ WHY GUARDS AND NOT A REVOKE. The review proposed revoking media(status, removed_at) and
-- events(deleted_at) from authenticated. That would break SIX legitimate host paths (approve, hide,
-- show, delete, both bulk moderation writes in src/lib/db/mutations/media.ts) plus softDeleteEvent.
-- Verified on live: inside a SECURITY DEFINER function `current_user` is the function OWNER
-- (postgres); a direct PostgREST write from a signed-in user runs as `current_user = 'authenticated'`.
-- So a BEFORE trigger can refuse EXACTLY the dangerous transitions while every legitimate path keeps
-- its grant. That is the shape used throughout this file.

-- ---------------------------------------------------------------------------------------------
-- #8 + #24 — removal provenance columns. Service-role/RPC-write-only, mirroring removed_by_uploader
-- and removed_by_system: NO grant to authenticated, so a host can neither clear the operator flag
-- nor forge the prior status. They are also outside the column-scoped SELECT grant (migration
-- 20260707150000), which is FAIL-CLOSED by construction: a column added later is invisible to hosts
-- until it is added to BOTH the grant and MEDIA_HOST_COLUMNS. Deliberately left invisible here —
-- removed_by_admin records OUR action (the same discretion posture as legal_hold_at: the host may BE
-- the reported party), and status_before_removed is machinery, not host-facing state.
-- ---------------------------------------------------------------------------------------------
alter table public.media
  add column if not exists removed_by_admin boolean not null default false,
  add column if not exists status_before_removed public.media_status;

comment on column public.media.removed_by_admin is
  'True when an OPERATOR soft-removed this row (admin reports "Action" or the Albums browser). '
  'Service-role write only (no authenticated grant). restore_media REFUSES a row with this set, so '
  'a host cannot silently reverse a takedown of their own reported content (QA #8).';

comment on column public.media.status_before_removed is
  'The status this row held immediately before it was soft-removed, stamped by the '
  'media_derive_removal_provenance trigger on EVERY removal path. restore_media (and the operator '
  'restore) return the row to this status instead of always republishing as approved, so a hidden '
  'item comes back hidden and a pending item comes back pending (QA #24). NULL once restored.';

-- ---------------------------------------------------------------------------------------------
-- #24 — derive the provenance. A BEFORE trigger is the single writer across EVERY removal path
-- (host removeMedia/removeMediaBulk, the admin reports + albums actions, the cron auto-reduce,
-- remove_my_upload), exactly like set_media_purge_at: no mutation has to remember to stamp it, and
-- the column stays OUT of the host's write grant (a BEFORE trigger writes NEW.<col> without the
-- caller holding the column privilege — privilege is checked only on the statement's SET list).
--
-- It ALSO rewrites an un-remove's target status, which makes "restore to the prior status" an
-- invariant of the TABLE rather than a rule each restore path must re-implement. restore_media
-- computes the same target explicitly below (so its contract is readable and directly assertable);
-- the two agree by construction because both read status_before_removed.
-- ---------------------------------------------------------------------------------------------
create or replace function public.set_media_removal_provenance()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    if new.status = 'removed' and old.status is distinct from 'removed' then
      -- Entering the bin: remember where it came from.
      new.status_before_removed := old.status;
    elsif old.status = 'removed' and new.status is distinct from 'removed' then
      -- Leaving the bin: land on the remembered status, never a blanket 'approved'.
      -- (Defensive <> 'removed': a stamped 'removed' would be a restore-to-nowhere loop.)
      if old.status_before_removed is not null
         and old.status_before_removed <> 'removed' then
        new.status := old.status_before_removed;
      end if;
      new.status_before_removed := null;
    end if;
  end if;
  return new;
end;
$$;

-- Trigger-only plumbing — never callable as an RPC (mirrors the 20260529003631 lockdown).
revoke execute on function public.set_media_removal_provenance() from public, anon, authenticated;

-- Name sorts BEFORE media_guard_privileged_transitions and media_set_purge_at, so the derivation
-- lands first and the guard/purge triggers see the final NEW row. (BEFORE ROW triggers fire in
-- name order; a guard that raises or skips discards whatever this one derived, which is correct.)
create or replace trigger media_derive_removal_provenance
  before insert or update on public.media
  for each row execute function public.set_media_removal_provenance();

-- ---------------------------------------------------------------------------------------------
-- #7 — the media escalation guard. Refuses, for a DIRECT client write only:
--   (a) leaving status='removed'  → restore MUST go through restore_media, which holds the ADR-0020
--       legal-hold refusal, the removed_by_uploader privacy guard, the capacity gate and (new) the
--       operator-takedown refusal. No legitimate app path performs this transition: all six host
--       writes carry `.neq('status','removed')`, so RAISING here can never break a real flow.
--   (b) ANY update to a legally-held row → a held row must be IMMUTABLE to the host, not merely
--       invisible (ADR-0020). This branch SKIPS the row silently (return null) instead of raising,
--       for two reasons: raising would abort a whole BULK statement (one held row would break
--       "Approve all" for the entire event, which is itself a hold oracle), and the single-row
--       writes use `.select().single()`, so a skipped row surfaces as PGRST116 → the mutation
--       wrapper's existing "That item is no longer available." — the SAME wording a missing row
--       produces. A reporter/abuser must never learn a hold exists from the copy.
-- The hold branch is checked FIRST so a held row can never take the raising path.
--
-- service_role (the admin client + the cron) and every SECURITY DEFINER RPC run as a different
-- current_user and exit at the first line. anon is included for completeness (it has no media write
-- grant and no RLS write policy, so it cannot reach here today).
-- ---------------------------------------------------------------------------------------------
create or replace function public.guard_media_privileged_transitions()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user not in ('authenticated', 'anon') then
    return new; -- service_role, the cron, and every SECURITY DEFINER RPC (owner = postgres)
  end if;

  -- (b) Legal hold: silently immutable. NOT an error, by design (see the header).
  if old.legal_hold_at is not null then
    return null;
  end if;

  -- (a) Un-remove: the restore RPC is the only door.
  if old.status = 'removed' and new.status is distinct from 'removed' then
    raise exception 'That item is no longer available.'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

revoke execute on function public.guard_media_privileged_transitions() from public, anon, authenticated;

create or replace trigger media_guard_privileged_transitions
  before update on public.media
  for each row execute function public.guard_media_privileged_transitions();

-- ---------------------------------------------------------------------------------------------
-- #10 — the events un-delete guard. Same shape, no discretion concern (an event's deletion state is
-- the host's own), so this one always raises. restore_event stays the only client-reachable door and
-- it compensates the per-tier event ceiling in-RPC.
-- ---------------------------------------------------------------------------------------------
create or replace function public.guard_event_privileged_transitions()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;

  if old.deleted_at is not null and new.deleted_at is null then
    raise exception 'Restore this event from Trash to bring it back.'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

revoke execute on function public.guard_event_privileged_transitions() from public, anon, authenticated;

create or replace trigger events_guard_privileged_transitions
  before update on public.events
  for each row execute function public.guard_event_privileged_transitions();

-- #10 (belt) — the per-tier ceiling on events that EXIST must also hold on the UN-DELETE update, not
-- just on INSERT. restore_event checks the slot in-RPC, but ANY path that bypasses the RPC (the
-- service-role admin client, a future mutation, a psql session) skipped the ceiling entirely.
-- Scope note: this closes the BYPASS, not the RACE. Both the RPC check and this trigger are
-- check-then-act, so two concurrent restores can still each see N-1; the row lock that fixes that
-- class is QA #17 (pattern D) and is deliberately not in this migration.
--
-- A SECOND trigger on the same function rather than widening the existing one: a WHEN clause on a
-- `before insert or update` trigger cannot reference OLD (Postgres rejects OLD in an INSERT
-- trigger's WHEN), so the QA's single-trigger sketch would not create. enforce_event_limit itself
-- needs NO change: it counts `deleted_at is null` rows for new.host_id, and at BEFORE UPDATE time
-- the row being restored still has deleted_at set, so it is excluded exactly as on INSERT. That is
-- also why restore_event's in-RPC compensation does NOT double-count: both evaluate the same
-- "currently-active events" predicate before the row becomes active.
create or replace trigger events_enforce_limit_on_undelete
  before update on public.events
  for each row
  when (old.deleted_at is not null and new.deleted_at is null)
  execute function public.enforce_event_limit();

-- ---------------------------------------------------------------------------------------------
-- #8 + #24 — restore_media honors the provenance. Body reproduced from the currently-applied
-- version (20260707150000: the removed_by_uploader privacy guard from 20260609150000 + the ADR-0020
-- legal-hold refusal — BOTH KEPT, a Vitest file-guard pins them) plus two deltas:
--   * refuse a row an OPERATOR removed (only an operator may undo an operator takedown);
--   * restore to status_before_removed instead of a blanket 'approved'.
-- The new refusal returns a DISTINCT reason ('admin_removed') that the wrapper maps to the same
-- discreet "That item is no longer available." copy as legal_hold and not_found: debuggable
-- server-side, non-disclosing client-side.
-- ---------------------------------------------------------------------------------------------
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
  v_target public.media_status;
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
  if v_media.legal_hold_at is not null then
    return jsonb_build_object('ok', false, 'reason', 'legal_hold'); -- ADR-0020: stays off live
  end if;
  if v_media.removed_by_admin then
    return jsonb_build_object('ok', false, 'reason', 'admin_removed'); -- QA #8: operators only
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

  -- QA #24: back to where it was, not a blanket 'approved' (a hidden item stays hidden, a pending
  -- item stays pending). Pre-Q3 rows carry no stamp -> 'approved', the historical behavior.
  v_target := coalesce(v_media.status_before_removed, 'approved'::public.media_status);
  if v_target = 'removed' then
    v_target := 'approved'::public.media_status;
  end if;

  -- Pure status flip; trigger nulls purge_at; storage_used_bytes unchanged (bytes never left).
  update public.media set status = v_target, removed_at = null
    where id = p_media_id and status = 'removed';

  return jsonb_build_object('ok', true, 'status', v_target);
end;
$$;

revoke execute on function public.restore_media(uuid) from public, anon, authenticated;
grant execute on function public.restore_media(uuid) to authenticated;

-- ---------------------------------------------------------------------------------------------
-- #23 — profiles.email is client-writable and is the recipient of EVERY transactional email
-- (over-limit warnings, the recoverable-until notice, export links). A client-writable recipient is
-- a redirect primitive: PATCH the column, then trigger a mail. AUDITED ON BOTH DEPLOYED CODEBASES
-- (main + launch-prep): nothing writes profiles.email from a client path. The three real writers are
-- handle_new_user (SECURITY DEFINER trigger, owner context), last_active_at / welcomed_at /
-- announcements_seen_at (their own grants), and display_name (admin client). Revoking is safe.
--
-- The TABLE-level UPDATE grant was already revoked in 20260608093939, so a bare column revoke would
-- work here; re-stating revoke-then-regrant anyway keeps the allowlist readable in ONE place and is
-- immune to the "column revoke is a silent no-op while a table grant stands" landmine.
-- ---------------------------------------------------------------------------------------------
revoke update on public.profiles from authenticated, anon;
grant update (announcements_seen_at, welcomed_at) on public.profiles to authenticated;

-- ---------------------------------------------------------------------------------------------
-- #41 — guests.session_token is the PLAINTEXT guest upload capability (ADR-0004). The
-- guests_host_select RLS policy lets a host read their own events' guest rows over PostgREST, which
-- handed them every guest's capability: enough to upload AS that guest, and (with #7 open) to steer
-- attribution. A host has no legitimate use for it.
--
-- AUDITED ON BOTH DEPLOYED CODEBASES: the only three readers of `guests`
-- (src/lib/forensics/capture.ts:49, src/lib/db/queries/social.ts:469 and :559) all use the
-- SERVICE-ROLE admin client, which keeps its own grant, and only the forensics one references the
-- token at all (as an `.eq()` filter, never a selected column). No authenticated-client read exists,
-- and none does `select("*")` on guests. Revoking is safe.
--
-- Same landmine as media/events: revoke the TABLE grant FIRST, then re-grant every column except the
-- token. Consequence to know: a future `alter table guests add column` is FAIL-CLOSED (invisible to
-- the host) until it is added to this list.
-- ---------------------------------------------------------------------------------------------
revoke select on public.guests from public, anon, authenticated;
grant select (id, event_id, user_id, email, created_at) on public.guests to authenticated;

-- ---------------------------------------------------------------------------------------------
-- #36 — get_public_profile's attended arm disclosed more than the album it mirrors.
--
-- The album renders its "Guests (N)" section ONLY at gallery access `full`
-- (src/app/(guest)/e/[token]/page.tsx). For an OPEN event that REQUIRES AN ACCOUNT
-- (allow_anonymous_uploads = false, which is the DEFAULT since S5), an anonymous viewer resolves to
-- `teaser` and never sees the list. This RPC is anon-executable and disclosed exactly that
-- membership (plus the event's name + date) to a logged-out viewer of /u/[slug].
--
-- The added predicate mirrors resolveGalleryAccess rather than flooring everything to the anonymous
-- case: an account-required event's attendance is disclosed only to a SIGNED-IN viewer, who can
-- genuinely open that album and read the same list there. Flooring to anon-only would have gutted
-- the feature (account-required is the default), which is a product regression, not a fix.
-- Everything else in the body is the currently-applied version, reproduced verbatim.
-- ---------------------------------------------------------------------------------------------
create or replace function public.get_public_profile(p_slug text) returns jsonb
  language sql
  stable
  security definer
  set search_path = ''
as $$
  select jsonb_build_object(
    'id', p.id,
    'slug', p.slug,
    'display_name', p.display_name,
    'avatar_updated_at', p.avatar_updated_at,
    'created_at', p.created_at,
    'hosted_events', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', e.id,
               'name', e.name,
               'event_date', e.event_date,
               'visibility', e.visibility,
               'qr_token', e.qr_token,
               'custom_slug', e.custom_slug
             ) order by e.event_date desc nulls last, e.created_at desc)
      from public.events e
      where e.host_id = p.id
        and e.display_in_profile
        and e.deleted_at is null
    ), '[]'::jsonb),
    'attended_events', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', e.id,
               'name', e.name,
               'event_date', e.event_date
             ) order by e.event_date desc nulls last, e.created_at desc)
      from public.events e
      where e.deleted_at is null
        and e.show_guest_list
        -- open-only: gated (password/private) events never leak name/date or
        -- attendance to anonymous profile viewers (see the header rationale).
        and e.visibility = 'open'
        -- QA #36: open BUT account-required resolves to `teaser` for an anonymous viewer, and the
        -- album hides its Guests section below `full`. Mirror that here so this reverse surface
        -- never discloses membership the album itself withholds from the same viewer.
        and (e.allow_anonymous_uploads or (select auth.uid()) is not null)
        and e.host_id <> p.id
        and exists (
          select 1
          from public.guests g
          join public.media m on m.guest_id = g.id and m.status = 'approved'
          where g.event_id = e.id and g.user_id = p.id
        )
        and not exists (
          select 1 from public.profile_hidden_events h
          where h.user_id = p.id and h.event_id = e.id
        )
    ), '[]'::jsonb)
  )
  from public.profiles p
  where p.slug is not null
    and p.slug = lower(trim(p_slug));
$$;

revoke execute on function public.get_public_profile(text) from public;
grant execute on function public.get_public_profile(text) to anon, authenticated;

-- ---------------------------------------------------------------------------------------------
-- #40 — get_event_by_qr_token had no visibility gate. Holding a qr_token (or GUESSING a custom slug,
-- which is short and human-chosen) returned a private event's name, description, date and host name
-- over a direct PostgREST call: strictly more than the page the RPC backs ever renders.
--
-- The page IS the reference, and it already states the policy (see the generateMetadata header in
-- src/app/(guest)/e/[token]/page.tsx): "a PRIVATE event reveals nothing (generic title); a PASSWORD
-- event shows its NAME (it's link-shared, the name isn't the secret) but no description". The locked
-- payload (access `none`) blanks host_display_name, description and event_date; the private branch
-- renders the lock and nothing else. This mirrors that at the data layer:
--
--   * caller OWNS the event (auth.uid() = host_id) → full payload, unchanged.
--   * visibility = 'open'                          → full payload, unchanged.
--   * visibility = 'password', non-owner           → name kept; description, event_date,
--                                                    host_display_name, custom_slug redacted.
--   * visibility = 'private', non-owner            → the above, plus the NAME.
--
-- KEPT on purpose:
--   * qr_token. The locked page itself hands it to the client (GuestHeader + EventExperience +
--     joinUrl), and every downstream RPC keys on it, so withholding it would break the lock screen
--     it is meant to protect. The caller already supplied a token or slug that resolves here.
--   * has_password / accepting_uploads / allow_anonymous_uploads / moderation_mode / qr_style /
--     visibility — operational flags the lock screen, the entry sheet and the two gated API routes
--     (/api/guests/gallery, /api/export/guest) need to render the refusal correctly.
--   * custom_slug is redacted for free: no TS consumer reads it (GuestEvent omits it), and handing a
--     token-holder the vanity alias of a locked album buys them nothing but discovery.
--
-- The UNLOCKED password viewer keeps the full experience: getEventByQrToken re-hydrates the three
-- redacted fields through a self-guarded service-role read once isUnlocked() proves the password
-- (src/lib/db/queries/guest-events.ts) — the same admin-from-guest-page pattern as
-- getApprovedMediaForUnlock. The RPC cannot see the unlock cookie, so the split is necessary.
--
-- `create or replace` (not drop+create): the return type is UNCHANGED, so the existing ACL survives;
-- the grant is re-asserted below anyway (MCP anon default-grant).
-- ---------------------------------------------------------------------------------------------
create or replace function public.get_event_by_qr_token(p_qr_token text)
 returns table(
   id uuid, name text, description text, moderation_mode public.moderation_mode,
   visibility public.event_visibility, has_password boolean, accepting_uploads boolean,
   allow_anonymous_uploads boolean, event_date date, qr_style text, qr_token text,
   custom_slug text, host_display_name text)
 language sql
 stable security definer
 set search_path to ''
as $function$
  select e.id,
         case when r.hide_name then null else e.name end,
         case when r.hide_meta then null else e.description end,
         e.moderation_mode, e.visibility,
         (e.event_password_hash is not null),
         e.accepting_uploads, e.allow_anonymous_uploads,
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

-- ---------------------------------------------------------------------------------------------
-- ROLLED-BACK CONTRACT CHECK (run manually via execute_sql AFTER apply; nothing persists — it ends
-- in a deliberate RAISE). Rides EXISTING rows: creating an event would trip the free-tier
-- enforce_event_limit trigger, and creating media would move the storage meters.
--
-- It impersonates the host the way PostgREST does (set the request JWT claims, then
-- `set local role authenticated`) so `current_user` is 'authenticated' and the guards actually
-- engage — running it as postgres would prove nothing.
-- ---------------------------------------------------------------------------------------------
-- do $$
-- declare
--   v_id     uuid;
--   v_event  uuid;
--   v_host   uuid;
--   v_status public.media_status;
--   v_res    jsonb;
--   v_n      integer;
-- begin
--   select m.id, m.event_id, e.host_id into v_id, v_event, v_host
--     from public.media m
--     join public.events e on e.id = m.event_id
--     where m.status <> 'removed'
--       and m.legal_hold_at is null
--       and m.removed_by_uploader = false
--       and e.deleted_at is null
--     limit 1;
--   if v_id is null then raise exception 'no live media row to test with'; end if;
--
--   -- Seed a HIDDEN item (as postgres: the guard exits for a non-client role).
--   update public.media set status = 'hidden', removed_at = null where id = v_id;
--
--   perform set_config('request.jwt.claims',
--                      json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--
--   -- 1. The legitimate host removal still works (the grant is intact).
--   update public.media set status = 'removed', removed_at = now()
--     where id = v_id and status <> 'removed';
--   get diagnostics v_n = row_count;
--   if v_n <> 1 then raise exception 'FAIL: host soft-remove was blocked'; end if;
--   raise notice 'OK: host soft-remove still works';
--
--   -- 2. A DIRECT authenticated un-remove is REFUSED (#7).
--   begin
--     update public.media set status = 'approved', removed_at = null where id = v_id;
--     raise exception 'FAIL: direct un-remove was accepted';
--   exception when check_violation then
--     raise notice 'OK: direct un-remove refused';
--   end;
--
--   -- 3. The RPC restore still WORKS and returns the PRIOR status (#24).
--   v_res := public.restore_media(v_id);
--   if not (v_res->>'ok')::boolean then
--     raise exception 'FAIL: restore_media refused a legitimate restore (%)', v_res->>'reason';
--   end if;
--   if v_res->>'status' <> 'hidden' then
--     raise exception 'FAIL: restore republished as % (expected hidden)', v_res->>'status';
--   end if;
--   select status into v_status from public.media where id = v_id;
--   if v_status <> 'hidden' then raise exception 'FAIL: row landed as %', v_status; end if;
--   raise notice 'OK: RPC restore works and honors the prior status';
--
--   -- 4. An ADMIN-removed row refuses host restore (#8).
--   reset role;
--   update public.media set status = 'removed', removed_at = now(), removed_by_admin = true
--     where id = v_id;
--   set local role authenticated;
--   v_res := public.restore_media(v_id);
--   if (v_res->>'ok')::boolean then raise exception 'FAIL: host reversed an operator takedown'; end if;
--   if v_res->>'reason' <> 'admin_removed' then
--     raise exception 'FAIL: unexpected reason %', v_res->>'reason';
--   end if;
--   raise notice 'OK: operator takedown is not host-reversible';
--
--   -- 5. A HELD row is immutable to authenticated, silently (#7b) — 0 rows, no error, no oracle.
--   --    The un-remove below runs as postgres and the derive trigger lands it back on 'hidden'
--   --    (its pre-removal status), which is #24 holding on the SERVICE-ROLE path too — assert that
--   --    on the way past.
--   reset role;
--   update public.media set status = 'approved', removed_at = null, removed_by_admin = false,
--                           legal_hold_at = now(), legal_hold_reason = 'contract check'
--     where id = v_id;
--   select status into v_status from public.media where id = v_id;
--   if v_status <> 'hidden' then
--     raise exception 'FAIL: service-role un-remove ignored status_before_removed (got %)', v_status;
--   end if;
--   set local role authenticated;
--   update public.media set status = 'approved' where id = v_id;
--   get diagnostics v_n = row_count;
--   if v_n <> 0 then raise exception 'FAIL: a held row was writable by the host'; end if;
--   reset role;
--   select status into v_status from public.media where id = v_id;
--   if v_status <> 'hidden' then raise exception 'FAIL: held row changed to %', v_status; end if;
--   raise notice 'OK: held row is silently immutable to the host';
--
--   -- 6. A DIRECT authenticated event un-delete is REFUSED (#10). Either guard may speak first
--   --    (events_enforce_limit_on_undelete sorts before events_guard_privileged_transitions and
--   --    also raises check_violation when the host is at their ceiling); both are correct refusals.
--   update public.events set deleted_at = now() where id = v_event;
--   set local role authenticated;
--   begin
--     update public.events set deleted_at = null where id = v_event;
--     raise exception 'FAIL: direct event un-delete was accepted';
--   exception when check_violation then
--     raise notice 'OK: direct event un-delete refused';
--   end;
--   reset role;
--
--   -- 7. Every newly locked column is out of reach of `authenticated`.
--   if has_column_privilege('authenticated', 'public.media', 'removed_by_admin', 'UPDATE')
--      or has_column_privilege('authenticated', 'public.media', 'removed_by_admin', 'SELECT')
--      or has_column_privilege('authenticated', 'public.media', 'status_before_removed', 'UPDATE')
--      or has_column_privilege('authenticated', 'public.media', 'status_before_removed', 'SELECT')
--      or has_column_privilege('authenticated', 'public.profiles', 'email', 'UPDATE')
--      or has_column_privilege('authenticated', 'public.guests', 'session_token', 'SELECT') then
--     raise exception 'FAIL: a newly locked column is still reachable by authenticated';
--   end if;
--   -- ...and the columns that must STAY reachable still are.
--   if not has_column_privilege('authenticated', 'public.media', 'status', 'UPDATE')
--      or not has_column_privilege('authenticated', 'public.guests', 'email', 'SELECT')
--      or not has_column_privilege('authenticated', 'public.profiles', 'welcomed_at', 'UPDATE') then
--     raise exception 'FAIL: a legitimate grant was collateral damage';
--   end if;
--   raise notice 'OK: grant surface is exactly as intended';
--
--   raise exception 'ROLLBACK_OK';
-- exception when others then
--   if sqlerrm = 'ROLLBACK_OK' then raise notice 'contract check passed, rolled back';
--   else raise; end if;
-- end $$;

-- ---------------------------------------------------------------------------------------------
-- PROD AUDIT (run after apply — both should return zero rows):
--   -- Rows that were restored before Q3 and may be sitting 'approved' though they were hidden:
--   select id, event_id, status from public.media
--   where status_before_removed is not null and status <> 'removed';
--   -- Events a host may have un-deleted past their ceiling while #10 was open:
--   select p.id, p.tier, count(*) as live_events
--   from public.profiles p join public.events e on e.host_id = p.id and e.deleted_at is null
--   group by p.id, p.tier
--   having (p.tier = 'free' and count(*) > 1);
-- ---------------------------------------------------------------------------------------------
</content>
</invoke>
