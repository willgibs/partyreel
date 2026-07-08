-- ============================================================================
-- Profiles + social foundation (data layer) — the ADR-0019 ruled model (Will, T1).
--
-- THE RULED MODEL (read docs/adr/0019-social-privacy-host-controlled-guest-list.md
-- before changing semantics here; where any other doc disagrees, the ADR wins):
--   * Profiles are public BY EXISTENCE (creating one is the consent; NO discoverable flag).
--   * The event guest list is HOST-controlled: events.show_guest_list (default false);
--     when on, ALL signed-in uploaders render named. No per-guest opt-in, no per-event
--     unlist from the EVENT page.
--   * The guest-side control lives on the guest's OWN profile only:
--     profile_hidden_events hides an attended event from MY public profile while I stay
--     on the event's guest list.
--   * Follows are open any-to-any; follower/following LISTS AND COUNTS are private to
--     the owner (the VSCO shape). Blocking ships IN this slice: a block severs the
--     follow both ways and prevents re-follow, privately.
--   * notification_prefs ships SHAPED for R5 (tier table below); no sends yet.
--
-- ADDITIVE-ONLY: new tables, defaulted columns, new-name RPCs. Nothing main's deployed
-- code reads is narrowed or reshaped (get_event_by_qr_token et al are untouched).
--
-- ── EXPECTED get_advisors DELTA (verify after apply) ─────────────────────────
--   * lint 0028 (anon-executable SECURITY DEFINER) GROWS 3 → 4:
--       + get_public_profile  (READ-only, BY DESIGN: /u/[slug] is logged-out-visible.
--         It joins the accepted anon-read set alongside get_event_by_qr_token,
--         get_event_media_by_qr_token, get_upload_context. FLAGGING LOUDLY per the
--         house contract: any anon-read growth is deliberate and recorded — update
--         docs/systems/database-security.md "3 anon capability RPCs" → 4 at integration.)
--   * lint 0029 (authenticated-only SECURITY DEFINER) grows by 2:
--       + follow_user, block_user  (auth.uid()-authorized internally; must appear in
--         0029 and NEVER 0028 — if either shows in the anon list, the MCP anon-EXECUTE
--         default-privilege landmine slipped in despite the explicit revokes below).
--   * NO new rls_enabled_no_policy INFO rows: all four new tables ship WITH policies.
--   * NO function_search_path_mutable WARNs: every function sets search_path = ''.
--   * enforce_follow_not_blocked is trigger-only (service surface): must appear in
--     NEITHER list.
--
-- ── ROLLED-BACK CONTRACT CHECK (run via MCP execute_sql AFTER apply; the trailing
--    RAISE aborts the tx so nothing persists; rides EXISTING rows — creating events
--    would trip the free-tier enforce_event_limit trigger) ──────────────────────
--
--   do $$
--   declare
--     v_host uuid; v_event uuid; v_other uuid;
--     v_slug text := 'contract-check-' || substr(md5(random()::text), 1, 8);
--     v_profile jsonb;
--     v_att_user uuid; v_att_event uuid;
--   begin
--     select host_id, id into v_host, v_event
--       from public.events where deleted_at is null limit 1;
--     if v_event is null then raise exception 'need one existing event'; end if;
--     select id into v_other from public.profiles where id <> v_host limit 1;
--     if v_other is null then raise exception 'need a second profile'; end if;
--
--     -- 1. slug + host-side toggles + the public read RPC.
--     update public.profiles set slug = v_slug where id = v_host;
--     update public.events set display_in_profile = true, show_guest_list = true
--       where id = v_event;
--     v_profile := public.get_public_profile(v_slug);
--     if v_profile is null then raise exception 'get_public_profile: null'; end if;
--     if (v_profile->>'id')::uuid <> v_host then raise exception 'wrong profile'; end if;
--     if jsonb_array_length(v_profile->'hosted_events') < 1
--       then raise exception 'hosted_events empty'; end if;
--     -- format CHECK fires:
--     begin
--       update public.profiles set slug = 'Bad_Slug!' where id = v_host;
--       raise exception 'slug CHECK did not fire';
--     exception when check_violation then null; end;
--
--     -- 2. follow → block severs both ways → re-follow silently no-ops.
--     perform set_config('request.jwt.claims',
--       json_build_object('sub', v_other)::text, true);
--     perform public.follow_user(v_host);
--     if not exists (select 1 from public.user_follows
--       where follower_id = v_other and followee_id = v_host)
--       then raise exception 'follow row missing'; end if;
--     perform public.block_user(v_host);
--     if exists (select 1 from public.user_follows
--       where follower_id = v_other and followee_id = v_host)
--       then raise exception 'block did not sever the follow'; end if;
--     perform public.follow_user(v_host);  -- blocker re-follow: silent no-op
--     if exists (select 1 from public.user_follows
--       where follower_id = v_other and followee_id = v_host)
--       then raise exception 're-follow got through a block'; end if;
--     -- reverse direction (the blocked user probing): also no row, no error.
--     perform set_config('request.jwt.claims',
--       json_build_object('sub', v_host)::text, true);
--     perform public.follow_user(v_other);
--     if exists (select 1 from public.user_follows
--       where follower_id = v_host and followee_id = v_other)
--       then raise exception 'blocked user could follow back'; end if;
--     -- the trigger backstop rejects a raw insert outright:
--     begin
--       insert into public.user_follows (follower_id, followee_id)
--         values (v_host, v_other);
--       raise exception 'enforce_follow_not_blocked did not fire';
--     exception when check_violation then null; end;
--
--     -- 3. notification_prefs defaults mirror the ADR tier table.
--     insert into public.notification_prefs (user_id) values (v_other);
--     if not (select notify_reel_ready and notify_album_shared
--               and notify_new_uploads_digest and notify_new_follower
--               and not marketing_opt_in
--             from public.notification_prefs where user_id = v_other)
--       then raise exception 'notification_prefs defaults wrong'; end if;
--
--     -- 4. guest-side hide (conditional: needs an existing signed-in uploader).
--     select g.user_id, g.event_id into v_att_user, v_att_event
--       from public.guests g
--       join public.media m on m.guest_id = g.id and m.status = 'approved'
--       join public.events e on e.id = g.event_id and e.deleted_at is null
--       where g.user_id is not null and g.user_id <> e.host_id limit 1;
--     if v_att_event is not null then
--       update public.events set show_guest_list = true where id = v_att_event;
--       update public.profiles set slug = v_slug || '-a' where id = v_att_user;
--       v_profile := public.get_public_profile(v_slug || '-a');
--       if jsonb_array_length(v_profile->'attended_events') < 1
--         then raise exception 'attended_events empty'; end if;
--       insert into public.profile_hidden_events (user_id, event_id)
--         values (v_att_user, v_att_event);
--       v_profile := public.get_public_profile(v_slug || '-a');
--       if v_profile->'attended_events' @> jsonb_build_array(
--            jsonb_build_object('id', v_att_event))
--         then raise exception 'hidden event still listed'; end if;
--     else
--       raise notice 'no signed-in uploader found: attended-arm check skipped';
--     end if;
--
--     raise exception 'ROLLBACK_OK';
--   end $$;
--
-- ============================================================================

-- ─── 1. profiles.slug — the /u/[slug] handle ────────────────────────────────
-- Nullable + partial-unique (no citext dependency: the CHECK forces lowercase
-- storage, so uniqueness is case-insensitive by construction). The CHECK is the
-- hard format backstop; profileSlugSchema (src/lib/validation/profile.ts) is the
-- UX gate and owns the reserved-word policy. Pro-gating is APP-side ONLY (the
-- pricing house pattern): the DB stores a slug for ANY tier, so a later
-- downgrade/grandfathering change never strands or strips a stored handle.
-- WRITE PATH: service-role only, like display_name — profiles writes are
-- table-revoked with a column re-grant allowlist (20260602's lockdown), so this
-- new column is NOT host-writable by construction; setProfileSlug goes through
-- the admin client after app-side checks. 3..30 chars keeps it well clear of the
-- 32-hex token shape.
alter table public.profiles add column slug text;

alter table public.profiles add constraint profiles_slug_format
  check (
    slug is null
    or (
      slug ~ '^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$'
      and length(slug) between 3 and 30
    )
  );

-- Plain (slug), NOT lower(slug): the CHECK already guarantees lowercase, and the
-- get_public_profile lookup predicate is `p.slug = lower(trim(input))` — a
-- lower(slug) expression index would never match that predicate, so the lookup
-- would seq-scan while the index only guarded uniqueness.
create unique index profiles_slug_unique
  on public.profiles (slug)
  where slug is not null;

comment on column public.profiles.slug is
  'Public profile handle for /u/[slug]. NULL = no public profile page. Lowercase 3-30 [a-z0-9-] (CHECK). Case-insensitive unique. Service-role write only (app-side Pro gate + reserved-word policy in setProfileSlug); stored for any tier so grandfathering never breaks.';

-- ─── 2. events: the two ADR-0019 toggles ────────────────────────────────────
-- display_in_profile: the HOST showing their OWN event on their OWN public
-- profile (decouples discovery from access — ROADMAP P1).
-- show_guest_list: the HOST key for the named "Guests (N)" section; when on,
-- ALL signed-in uploaders render named (ADR-0019 point 1).
-- Both default false (nothing changes for existing events until a host opts in).
-- The events write grant is COLUMN-scoped (20260604163011 lockdown), so the new
-- columns must be EXPLICITLY added to the authenticated allowlist — a column
-- grant is additive, no table-level re-revoke needed.
alter table public.events
  add column display_in_profile boolean not null default false;
alter table public.events
  add column show_guest_list boolean not null default false;

grant insert (display_in_profile, show_guest_list) on public.events to authenticated;
grant update (display_in_profile, show_guest_list) on public.events to authenticated;

comment on column public.events.display_in_profile is
  'Host toggle: list this event, with its album link, on the host''s own public /u/[slug] profile (ADR-0019). Displaying publishes the link (the host''s deliberate choice); password/private visibility still gates entry at the page.';
comment on column public.events.show_guest_list is
  'Host toggle: render the named "Guests (N)" list (ALL signed-in uploaders) on the event surfaces, and let attendees'' profiles list this event (ADR-0019: the host key).';

-- ─── 3. user_follows — open any-to-any; lists/counts owner-private ──────────
-- RLS: each side sees only its own perspective (I read who I follow; I read who
-- follows me) — that IS the "private lists and counts" ruling; there is no path
-- to anyone else's graph. INSERT is NOT granted: the ONLY write path is the
-- follow_user RPC (block-aware, silent under a block) + the trigger backstop —
-- the media_likes/saved_events lesson (write through the RPC, never a raw
-- insert). Unfollow is the owner-RLS DELETE straight from the server client.
create table public.user_follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  followee_id uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (follower_id, followee_id),
  constraint user_follows_no_self check (follower_id <> followee_id)
);

-- Reverse lookups ("who follows me"); the PK already covers the forward direction.
create index user_follows_followee_id_idx on public.user_follows (followee_id);

alter table public.user_follows enable row level security;

revoke all on public.user_follows from anon, authenticated;
grant select, delete on public.user_follows to authenticated;

create policy user_follows_select_own on public.user_follows
  for select to authenticated
  using ((select auth.uid()) = follower_id or (select auth.uid()) = followee_id);

create policy user_follows_delete_own on public.user_follows
  for delete to authenticated
  using ((select auth.uid()) = follower_id);

comment on table public.user_follows is
  'Open any-to-any follows (ADR-0019). Lists + counts private to each owner (VSCO shape). Writes only via follow_user (block-aware); backstopped by enforce_follow_not_blocked.';

-- ─── 4. user_blocks — private, mutual severance ──────────────────────────────
-- Owner(blocker)-only RLS: the blocked user can NEVER read (or infer via a
-- surface) that a block exists. INSERT is NOT granted: block_user is the only
-- writer because blocking must sever follows both ways ATOMICALLY. Unblock is
-- the blocker's owner-RLS DELETE (no side effects, so no RPC needed).
create table public.user_blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint user_blocks_no_self check (blocker_id <> blocked_id)
);

-- Either-direction block checks (follow_user + the trigger) probe by blocked_id too.
create index user_blocks_blocked_id_idx on public.user_blocks (blocked_id);

alter table public.user_blocks enable row level security;

revoke all on public.user_blocks from anon, authenticated;
grant select, delete on public.user_blocks to authenticated;

create policy user_blocks_select_own on public.user_blocks
  for select to authenticated
  using ((select auth.uid()) = blocker_id);

create policy user_blocks_delete_own on public.user_blocks
  for delete to authenticated
  using ((select auth.uid()) = blocker_id);

comment on table public.user_blocks is
  'Private blocks (ADR-0019 point 5): severs follows both ways (block_user), prevents re-follow (trigger), no notification. Blocker-only RLS; write only via block_user.';

-- ─── 5. the follow/block invariant: trigger backstop ────────────────────────
-- WHY a trigger AND the RPC check: the RPC gives the ruled UX (a blocked user's
-- follow attempt silently no-ops — an ERROR would CONFIRM the block, which is
-- private); the trigger is the hard invariant for EVERY insert path, present and
-- future (service-role scripts, a future import, a forgotten new RPC), so "a
-- block prevents re-follow" can never regress to convention. SECURITY DEFINER is
-- REQUIRED: user_blocks RLS shows a caller only their OWN blocks, so an invoker-
-- rights check could not see the "they blocked me" direction.
create function public.enforce_follow_not_blocked() returns trigger
  language plpgsql
  security definer
  set search_path = ''
as $$
begin
  if exists (
    select 1 from public.user_blocks b
    where (b.blocker_id = new.follower_id and b.blocked_id = new.followee_id)
       or (b.blocker_id = new.followee_id and b.blocked_id = new.follower_id)
  ) then
    -- Deliberately generic: never confirms who blocked whom.
    raise exception 'You cannot follow this profile.' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger user_follows_enforce_not_blocked
  before insert on public.user_follows
  for each row execute function public.enforce_follow_not_blocked();

revoke execute on function public.enforce_follow_not_blocked() from public, anon, authenticated;

-- ─── 6. notification_prefs — SHAPED for R5, no sends yet ────────────────────
-- The ADR-0019 point-6 tier table (from the T1 options-doc, uncontested):
--   Tier 1 (transactional/security: OTP, billing, deletion warnings) is ALWAYS
--     sent — deliberately NO column, so it can never be toggled off.
--   Tier 2 (relationship/service) is default-ON with PER-CATEGORY opt-out for
--     ACCOUNT guests only → the four notify_* columns below.
--   Tier 3 (marketing) is explicit OPT-IN → marketing_opt_in default false (the
--     existing newsletter checkbox stays the one door; this mirrors it per-user).
-- Anonymous-email guests NEVER get a row here (no account): they receive nothing
-- beyond explicitly requested one-shots (the sendOnce pattern). Rows are LAZY —
-- an absent row means "all defaults" (resolveNotificationPrefs in
-- src/lib/social/notification-prefs.ts mirrors these defaults; a Vitest parity
-- test pins the two together — change one, change both).
create table public.notification_prefs (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  notify_reel_ready         boolean not null default true,
  notify_album_shared       boolean not null default true,
  notify_new_uploads_digest boolean not null default true,
  notify_new_follower       boolean not null default true,
  marketing_opt_in          boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger notification_prefs_set_updated_at
  before update on public.notification_prefs
  for each row execute function public.set_updated_at();

alter table public.notification_prefs enable row level security;

revoke all on public.notification_prefs from anon, authenticated;
grant select on public.notification_prefs to authenticated;
-- Column-scoped writes (the house lockdown pattern): the owner manages their own
-- toggles; user_id is insertable (the lazy row create) but NOT updatable, and the
-- timestamps stay trigger/default-only.
grant insert (user_id, notify_reel_ready, notify_album_shared,
              notify_new_uploads_digest, notify_new_follower, marketing_opt_in)
  on public.notification_prefs to authenticated;
grant update (notify_reel_ready, notify_album_shared,
              notify_new_uploads_digest, notify_new_follower, marketing_opt_in)
  on public.notification_prefs to authenticated;

create policy notification_prefs_select_own on public.notification_prefs
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy notification_prefs_insert_own on public.notification_prefs
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy notification_prefs_update_own on public.notification_prefs
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

comment on table public.notification_prefs is
  'R5-shaped per-user notification consent (ADR-0019 point 6). Absent row = defaults. Tier 1 transactional has NO column (always sent); tier 2 service columns default ON; tier 3 marketing defaults OFF. Accounts only; anon-email guests never get a row.';

-- ─── 7. profile_hidden_events — the guest-side control (ADR-0019 point 2) ────
-- Hides ONE attended event from MY public profile while I remain on the event's
-- guest list (that list is the HOST's key, not mine). Owner-only RLS, direct
-- writes: unlike media_likes/user_follows there is NO cross-tenant read-back or
-- side effect to protect (hiding an event you never attended is a harmless
-- no-op row that get_public_profile's attended-arm EXISTS test never reaches),
-- so a raw owner insert is safe and an RPC would be ceremony.
create table public.profile_hidden_events (
  user_id  uuid not null references public.profiles(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, event_id)
);

-- The event-deletion cascade + admin "who hid this event" reads.
create index profile_hidden_events_event_id_idx on public.profile_hidden_events (event_id);

alter table public.profile_hidden_events enable row level security;

revoke all on public.profile_hidden_events from anon, authenticated;
grant select, delete on public.profile_hidden_events to authenticated;
grant insert (user_id, event_id) on public.profile_hidden_events to authenticated;

create policy profile_hidden_events_select_own on public.profile_hidden_events
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy profile_hidden_events_insert_own on public.profile_hidden_events
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy profile_hidden_events_delete_own on public.profile_hidden_events
  for delete to authenticated
  using ((select auth.uid()) = user_id);

comment on table public.profile_hidden_events is
  'Guest-side profile privacy (ADR-0019 point 2): hide an attended event from MY public profile while staying on the event''s host-controlled guest list. Owner-only RLS.';

-- NOTE (PGRST201 landmine, database-security.md): profile_hidden_events is another
-- profiles<->events junction (saved_events already created that many-to-many), and
-- user_follows/user_blocks are profiles<->profiles junctions. All existing embeds
-- between these tables are already FK-PINNED (e.g. profiles!events_host_id_fkey in
-- the purge cron; profiles!guests_user_id_fkey in attribution) and the new
-- data-layer reads join in app code via explicit id lists, so no bare embed is
-- exposed to the new ambiguity. Keep pinning any future events<->profiles embed.

-- ─── 8. follow_user — the only follow write path ────────────────────────────
create function public.follow_user(p_followee uuid) returns void
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then
    raise exception 'Sign in to follow.' using errcode = '42501';
  end if;
  if p_followee = v_uid then
    raise exception 'You cannot follow yourself.' using errcode = 'check_violation';
  end if;
  if not exists (select 1 from public.profiles where id = p_followee) then
    raise exception 'Profile not found.' using errcode = 'no_data_found';
  end if;

  -- A block in EITHER direction makes this a SILENT no-op (not an error): blocks
  -- are private (ADR-0019 point 5) and an error here would let a blocked user
  -- confirm the block by probing. Lists/counts are owner-private, so the missing
  -- row contradicts nothing the caller can observe. The insert trigger backstops
  -- this check against races and any other write path.
  if exists (
    select 1 from public.user_blocks b
    where (b.blocker_id = v_uid and b.blocked_id = p_followee)
       or (b.blocker_id = p_followee and b.blocked_id = v_uid)
  ) then
    return;
  end if;

  insert into public.user_follows (follower_id, followee_id)
  values (v_uid, p_followee)
  on conflict do nothing;  -- idempotent re-follow
end;
$$;

-- MCP anon-EXECUTE landmine: revoke anon EXPLICITLY, not just public.
revoke execute on function public.follow_user(uuid) from public, anon;
grant execute on function public.follow_user(uuid) to authenticated;

-- ─── 9. block_user — block + mutual follow severance, atomically ────────────
create function public.block_user(p_blocked uuid) returns void
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then
    raise exception 'Sign in to block.' using errcode = '42501';
  end if;
  if p_blocked = v_uid then
    raise exception 'You cannot block yourself.' using errcode = 'check_violation';
  end if;
  if not exists (select 1 from public.profiles where id = p_blocked) then
    raise exception 'Profile not found.' using errcode = 'no_data_found';
  end if;

  insert into public.user_blocks (blocker_id, blocked_id)
  values (v_uid, p_blocked)
  on conflict do nothing;  -- idempotent re-block

  -- Mutual severance in the SAME transaction as the block (ADR-0019 point 5):
  -- both directions, so neither side retains the other in any private list.
  delete from public.user_follows
  where (follower_id = v_uid and followee_id = p_blocked)
     or (follower_id = p_blocked and followee_id = v_uid);
end;
$$;

revoke execute on function public.block_user(uuid) from public, anon;
grant execute on function public.block_user(uuid) to authenticated;

-- ─── 10. get_public_profile — the anon public-profile read (grows 0028 to 4) ─
-- The /u/[slug] page is logged-out-visible, so this is DELIBERATELY anon-
-- executable and READ-ONLY (the same class as get_event_by_qr_token). It returns:
--   * the profile card fields (id/slug/display_name/avatar marker/created_at) —
--     all already-public-by-existence per ADR-0019 point 3 (no discoverable flag);
--   * hosted_events: events the host chose to display (display_in_profile), WITH
--     qr_token + custom_slug — the host consented to public linking (link-in-bio;
--     discovery decoupled from access: a password event still hits its lock);
--   * attended_events: events where this user is a signed-in uploader (guests →
--     approved media), gated on the HOST key (show_guest_list — the profile entry
--     is the guest-list membership rendered on the reverse surface) and on the
--     guest's own profile_hidden_events. NO qr_token here: attendance is not a
--     capability grant, so an attended entry never hands out the album link.
-- No block filtering: the viewer may be anonymous (no identity to filter by), and
-- profiles are public by existence; blocks shape the follow graph, not this read.
-- No raw R2 keys in the payload (covers can come later via a server presign).
create function public.get_public_profile(p_slug text) returns jsonb
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
