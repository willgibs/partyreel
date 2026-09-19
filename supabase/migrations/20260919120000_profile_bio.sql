-- ═══════════════════════════════════════════════════════════════════════════
-- profiles.bio — one line of a person's own on /u/[slug]
-- ═══════════════════════════════════════════════════════════════════════════
-- Will, `profile-page` r1 `identity=line` (2026-09-19): "Profile picture (avatar)
-- should be center aligned to the name/meta group... Should also have a few rules
-- to prevent worst-case intent bios". The layout half is the page's; the RULES
-- half is two layers: this CHECK is the hard backstop (length only, the same
-- class as reports_reason_len), and src/lib/validation/profile.ts owns the
-- policy (trim, single line, no links, and profanity in the account action,
-- exactly where displayNameSchema's rules live).
--
-- WRITE PATH: service-role ONLY, like profiles.slug and profiles.display_name.
-- The authenticated UPDATE allowlist on public.profiles stays
-- (announcements_seen_at, welcomed_at) and this migration adds NOTHING to it: a
-- public, abusable free-text column must not be client-writable, or a direct
-- PostgREST PATCH would bypass the length / link / profanity checks the way
-- display_name's write was locked down in 20260608093939. SELECT needs no grant
-- (the table grant stands; profiles_select_own scopes it to the owner) and the
-- public read arrives through get_public_profile below, which is SECURITY DEFINER.
--
-- ─── ROLLED-BACK CONTRACT CHECK (run via the Supabase MCP, never committed as
-- data). Asserts the cap, the write lock and the RPC's new key in one tx:
--
--   begin;
--     -- 1. the cap is enforced by the DB, not only by zod
--     do $check$
--     declare v_id uuid;
--     begin
--       select id into v_id from public.profiles limit 1;
--       if v_id is null then raise exception 'no profile to test with'; end if;
--       begin
--         update public.profiles set bio = repeat('x', 161) where id = v_id;
--         raise exception 'bio cap did not fire';
--       exception when check_violation then null;
--       end;
--       update public.profiles set bio = 'Weddings, mostly.' where id = v_id;
--     end
--     $check$;
--     -- 2. authenticated cannot write it (the allowlist is unchanged)
--     select count(*) = 0 as bio_not_client_writable
--     from information_schema.column_privileges
--     where table_schema = 'public' and table_name = 'profiles'
--       and column_name = 'bio' and privilege_type = 'UPDATE'
--       and grantee in ('authenticated', 'anon');
--     -- 3. the RPC returns it, and the attended arm still hides a gated event
--     select public.get_public_profile((select slug from public.profiles
--            where slug is not null limit 1)) ? 'bio' as rpc_returns_bio;
--   rollback;
--
-- RESULT (2026-09-19, rolled back on the live project, both migrations in one
-- transaction): the 161st character raises check_violation, bio has zero
-- UPDATE grants to anon/authenticated, and get_public_profile returns the bio
-- key for a real handle.
--
-- ─── ADVISOR DELTA: none. No new function, no new table, no RLS change; the
-- SECURITY DEFINER count stays where 20260708120000 left it (get_public_profile
-- is replaced in place, so 0028 stays at 4 accepted anon-read RPCs).
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.profiles add column bio text;

-- 160 = the app-side cap (src/lib/validation/profile.ts BIO_MAX_LENGTH). Same
-- defense-in-depth shape as reports_reason_len: zod refuses first, the CHECK is
-- what holds if a write path ever forgets to parse.
alter table public.profiles
  add constraint profiles_bio_len check (bio is null or char_length(bio) <= 160);

-- ─── get_public_profile, replaced to carry the bio ──────────────────────────
-- ★ THE BODY BELOW IS 20260708120000's, UNCHANGED EXCEPT FOR ONE KEY. Every
-- gate is reproduced verbatim on purpose: this is the consent scope, and a
-- rewrite is exactly where a gate goes missing. The attended arm keeps all four
-- of its conditions (the host's show_guest_list key, visibility = 'open', the
-- guest's own profile_hidden_events, an approved upload) and still returns NO
-- qr_token / custom_slug, because attendance is not a capability grant. The
-- hosted arm stays deliberately UNgated on visibility: display_in_profile is
-- the host publishing their own link, and a gated event still hits its lock at
-- /e/. Don't "fix" that arm to match.
--
-- ★ AND THE STRING GUARD MOVES WITH IT. public-profile-visibility.test.ts parses
-- the 20260708120000 file's function text; that file is now a superseded body,
-- so src/lib/validation/profile.test.ts carries the same four assertions against
-- THIS file. Re-point the older guard when the two can be merged (a finding in
-- the profile-wiring handoff, not a silent edit of another lane's test).
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
    -- The one new key. Public by the same rule as display_name: a claimed
    -- handle is the consent act, and this column is only ever set by its owner
    -- through the service-role account action.
    'bio', p.bio,
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

-- `create or replace` preserves the existing ACL; restated so the executable set
-- is readable in one place and can never drift open (CLAUDE.md: an MCP-created
-- function inherits an anon EXECUTE grant, so the revoke is the load-bearing line).
revoke execute on function public.get_public_profile(text) from public;
grant execute on function public.get_public_profile(text) to anon, authenticated;
