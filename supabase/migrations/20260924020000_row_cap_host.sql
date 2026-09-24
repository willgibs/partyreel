-- The 1,000-row cap, part 2 of 3: the host's dashboard, the claim card and the operator's metrics
-- (Will, 2026-09-23: "Let's ensure we will not face any of those issues here").
--
-- WHY: PostgREST cuts every read at `max_rows` (1,000 here) silently. Five host and operator reads
-- fetch a row per item, so past 1,000 rows each one answers from an arbitrary subset: the dashboard
-- cards' "N items" and "N to review" (one row per media across ALL the host's events, unordered,
-- counted in TypeScript), the cards' covers (every approved photo of every event, newest first, so one
-- big album fills the page and the other cards lose their cover), an event's scan and view totals (a
-- row per event per day per kind, summed in TypeScript), the claim card (unpaged), and the operator's
-- metrics (every profile, every link_stats row, every newsletter row, unordered). This file answers
-- each with a shape the cap cannot cut: one jsonb, or a keyset page.
--   1. event_card_stats(uuid[])       one jsonb: approved and pending counts per event
--   2. event_covers(uuid[])           one jsonb: the newest approved photo's keys per event
--   3. event_link_totals(uuid)        one jsonb: an event's lifetime QR scans and album views
--   4. list_guest_rows_by_email(...)  the claim card, paged on its own order
--   5. admin_metrics_snapshot(...)    one jsonb: every figure the metrics reads derive from list reads
--
-- THE CONVENTION (docs/systems/database-security.md, "Set-returning functions and the row cap"): a
-- set-returning function pages on a keyset cursor and `p_limit` clamped in SQL to 1,000, or returns
-- one row. Prefer SECURITY INVOKER, so a host's own RLS and column grants do the scoping and nothing
-- joins the SECURITY DEFINER advisor lists; the one DEFINER here is the claim card, which reads
-- `auth.users` and was DEFINER already.
--
-- BACKWARD COMPATIBLE FOR THE BUILDS ALREADY SERVING (partyreel.com at milestone-27 and the alias):
--   * list_guest_rows_by_email is a DROP + CREATE of its one signature (PostgREST forbids overloads)
--     whose three new parameters all default to null, so the deployed call, which passes no argument
--     at all, reaches the new function and gets exactly today's rows (a null p_limit applies no
--     limit). Its order only gains a tiebreak.
--   * Everything else is additive: no deployed code calls it.
--
-- APPLY PROTOCOL (database-security.md -> Workflow):
--   (1) Drift, read-only: the live body's md5 equals its source file's (measured 2026-09-24):
--         list_guest_rows_by_email()   efba056af25969e1ec9f2caa0956d9db  (20260923120000)
--       select p.oid::regprocedure, md5(p.prosrc) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--        where n.nspname = 'public' and p.proname in ('list_guest_rows_by_email', 'event_card_stats',
--          'event_covers', 'event_link_totals', 'admin_metrics_snapshot');
--   (2) Apply verbatim. The same query then reads five functions, one signature each, each body's md5
--       as this file's (measured on the local pre-flight):
--         event_card_stats(uuid[])                                  43513872d8daae5b1de6094e305e6b51
--         event_covers(uuid[])                                      9785f6d097167cb264fd11e4a5dfcf6d
--         event_link_totals(uuid)                                   25337adb985a04834bf9069111958e39
--         list_guest_rows_by_email(timestamptz, uuid, integer)      a015e8252e27d0b23f45c93bcfaab810
--         admin_metrics_snapshot(integer, integer)                  28bf8f4a07bd8d2291377d9c12f3faea
--   (3) The grants: no anon EXECUTE anywhere in this file; admin_metrics_snapshot is service_role only.
--   (4) get_advisors. EXPECTED DELTA: NONE. list_guest_rows_by_email stays in 0029 under its new
--       signature; the other four are SECURITY INVOKER, so they sit in neither SECURITY DEFINER list.
--   (5) The rolled-back check at the foot.
--   (6) Regenerate src/lib/db/types.ts: four new functions and the claim card's parameters.

-- =============================================================================================
-- 1. event_card_stats: the dashboard cards' counts, one jsonb for any number of events.
-- =============================================================================================
-- Replaces getEventCardStats (src/lib/db/queries/events.ts), which read (event_id, status) for every
-- non-removed media of every card's event and counted in JavaScript over an unordered, capped read.
-- The shape it returns: { "<event id>": { "approved": n, "pending": n } }, EVERY non-null input id
-- present, zeros where nothing counts (the TypeScript seeded every id with zeros the same way).
--
-- SECURITY INVOKER, so the rows it can count are exactly the rows today's read could see: the host's
-- own media through `media_host_all`, and only the columns `authenticated` holds a grant on
-- (event_id, status, removed_at; 20260707150000). Another host's event, or an unknown id, counts
-- zero rather than erroring or revealing anything. `removed_at is null` is the same bin filter
-- today's read applies. Granted to authenticated only: the dashboard reads it on the user's client.
create function public.event_card_stats(p_event_ids uuid[])
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(
    jsonb_object_agg(
      ids.event_id::text,
      jsonb_build_object('approved', coalesce(c.approved, 0), 'pending', coalesce(c.pending, 0))
    ),
    '{}'::jsonb
  )
  from (
    select distinct u.event_id
    from unnest(p_event_ids) as u(event_id)
    where u.event_id is not null
  ) ids
  left join (
    select m.event_id,
           count(*) filter (where m.status = 'approved') as approved,
           count(*) filter (where m.status = 'pending') as pending
    from public.media m
    where m.event_id = any(p_event_ids)
      and m.removed_at is null
    group by m.event_id
  ) c on c.event_id = ids.event_id;
$$;

revoke all on function public.event_card_stats(uuid[]) from public, anon, authenticated;
grant execute on function public.event_card_stats(uuid[]) to authenticated;

-- =============================================================================================
-- 2. event_covers: one cover per event, one jsonb for any number of events.
-- =============================================================================================
-- Replaces the newest-first read of EVERY approved photo of the given events that both cover
-- readers do today (getEventCoverUrls in src/lib/db/queries/events.ts for the dashboard;
-- adminCoverUrls in src/lib/db/queries/social.ts for the /u/ profile cards), which kept the first
-- row seen per event: past 1,000 photos, one big album filled the page and the other events lost
-- their cover. The shape: { "<event id>": { "preview_key": ..., "original_key": ... } }, the newest
-- approved, non-removed PHOTO per event (photo only, as today: the card draws an <img>, which cannot
-- play a video), with `id desc` as the tiebreak; an event with no such photo is ABSENT. Both keys
-- ride so each reader keeps its own preference (the dashboard prefers the small preview; the profile
-- cards read the original). Both readers presign on the server, so a key never reaches a page.
--
-- SECURITY INVOKER: on the user's client, `media_host_all` scopes it to the host's own events (the
-- same rows the dashboard read sees today); on the service-role client (adminCoverUrls) it reads any
-- event, as that read does now. Granted to authenticated and service_role, never anon.
create function public.event_covers(p_event_ids uuid[])
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(
    jsonb_object_agg(
      c.event_id::text,
      jsonb_build_object('preview_key', c.preview_key, 'original_key', c.original_key)
    ),
    '{}'::jsonb
  )
  from (
    select distinct on (m.event_id) m.event_id, m.preview_key, m.original_key
    from public.media m
    where m.event_id = any(p_event_ids)
      and m.status = 'approved'
      and m.type = 'photo'
      and m.removed_at is null
    order by m.event_id, m.created_at desc, m.id desc
  ) c;
$$;

revoke all on function public.event_covers(uuid[]) from public, anon, authenticated;
grant execute on function public.event_covers(uuid[]) to authenticated, service_role;

-- =============================================================================================
-- 3. event_link_totals: an event's lifetime QR scans and album views, one jsonb.
-- =============================================================================================
-- Replaces getLinkStats (src/lib/db/queries/analytics.ts), which summed the per-day link_stats rows
-- (at most two a day, one per kind) in JavaScript: past about 500 days of traffic the read passes
-- 1,000 rows and the totals stop growing. The shape: { "qr_scans": n, "album_views": n }, zeros for
-- an event with no traffic.
--
-- SECURITY INVOKER over `link_stats_host_select`: the host of the event reads its totals, anyone else
-- reads zeros, exactly as the direct read behaves. Granted to authenticated only.
create function public.event_link_totals(p_event_id uuid)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select jsonb_build_object(
    'qr_scans', coalesce(sum(l.count) filter (where l.kind = 'qr_scan'), 0),
    'album_views', coalesce(sum(l.count) filter (where l.kind = 'album_view'), 0)
  )
  from public.link_stats l
  where l.event_id = p_event_id;
$$;

revoke all on function public.event_link_totals(uuid) from public, anon, authenticated;
grant execute on function public.event_link_totals(uuid) to authenticated;

-- =============================================================================================
-- 4. list_guest_rows_by_email: the claim card, paged on its own order.
-- =============================================================================================
-- Carried from 20260923120000_guest_by_upload.sql, whose body is the live one (md5 above): plpgsql,
-- stable, SECURITY DEFINER (it reads auth.users for the caller's own confirmed address), an empty
-- search_path, the same RETURNS TABLE, and every gate verbatim. ★ The address is still never a
-- parameter, which is the whole oracle gate: the three new parameters are a cursor and a page size.
-- Caller: getMyClaimableGuestRows (src/lib/db/queries/claims.ts), which groups the rows by event.
--
-- ★ THE CHANGES, and nothing else:
--   * The order gains `g.id desc` after `coalesce(m.last_at, g.created_at) desc`, so it is total.
--   * The cursor is the last row's (last_upload_at, guest_id): a page returns the rows strictly after
--     it in that order. Every listed row carries a live upload (`m.n > 0`), so its last_upload_at is
--     never null and the coalesce always takes it: the returned columns ARE the cursor.
--   * `limit least(p_limit, 1000)` applies only when p_limit is given; null keeps today's unlimited
--     read for the deployed call, which passes nothing.
drop function public.list_guest_rows_by_email();
create function public.list_guest_rows_by_email(
  p_after_at timestamptz default null,
  p_after_id uuid default null,
  p_limit integer default null
)
returns table (
  guest_id uuid,
  event_id uuid,
  event_name text,
  event_date date,
  display_name text,
  upload_count integer,
  last_upload_at timestamptz,
  pending_email_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_email text;
  v_confirmed timestamptz;
begin
  -- Defense in depth (the grant already excludes anon); a missing session lists nothing.
  if v_uid is null then return; end if;

  select u.email, u.email_confirmed_at into v_email, v_confirmed
  from auth.users u where u.id = v_uid;
  -- ★ TWO FORMS OF ONE ADDRESS, deliberately. `v_email` stays in the form auth.users holds, which
  -- is the form guests.email is written in (create_guest trims and never case-folds it); the LOOKUP
  -- key is `lower(v_email)`, because pending_email is stored normalised. Case-folding the stored
  -- form instead would drift this schema's one confirmed-address column away from its readers.
  v_email := nullif(btrim(coalesce(v_email, '')), '');

  -- UNCONFIRMED CALLERS GET NOTHING. His level 2: "no way to see uploads across events from email
  -- prior to verification for anyone" — the address owner included, until they prove it.
  if v_confirmed is null or v_email is null then return; end if;

  return query
  select g.id,
         e.id,
         e.name,
         -- QA #40's rule, applied to this surface: a gated event's metadata stays gated.
         case when e.visibility = 'password' then null else e.event_date end,
         g.display_name,
         coalesce(m.n, 0)::integer,
         m.last_at,
         g.pending_email_at
  from public.guests g
  join public.events e on e.id = g.event_id and e.deleted_at is null
  -- The count is what the claim (or the disown) would actually move: a row the guest already
  -- withdrew is not part of the offer, so `removed` is out.
  left join lateral (
    select count(*)::integer as n, max(x.created_at) as last_at
    from public.media x
    where x.guest_id = g.id and x.status <> 'removed'
  ) m on true
  where g.pending_email = lower(v_email)
    and g.user_id is null
    -- ★ ROW CAP (2026-09-24): the keyset, on the order below.
    and (p_after_at is null
         or (coalesce(m.last_at, g.created_at), g.id) < (p_after_at, p_after_id))
    and g.verified_at is null
    -- ★ GUEST BY UPLOAD (2026-09-23): a row with no live upload is nobody's attendance, so the card
    -- never offers it (an aggregate over no rows counts 0, never null).
    and m.n > 0
  order by coalesce(m.last_at, g.created_at) desc, g.id desc
  limit case when p_limit is null then null else least(p_limit, 1000) end;
end;
$$;

-- Authenticated-only (lint 0029), restated after the drop; every client role named, because an
-- MCP-created function inherits an anon EXECUTE that a bare `revoke ... from public` leaves behind.
revoke all on function public.list_guest_rows_by_email(timestamptz, uuid, integer) from public, anon, authenticated;
grant execute on function public.list_guest_rows_by_email(timestamptz, uuid, integer) to authenticated;

-- =============================================================================================
-- 5. admin_metrics_snapshot: every figure the operator's metrics derive from list reads, one jsonb.
-- =============================================================================================
-- getPlatformDbMetrics (src/lib/db/queries/metrics.ts) fetches three whole tables (every profile,
-- every link_stats row, every newsletter_signups source) and reduces them in lib/metrics/aggregate.ts
-- and lib/admin/kpi.ts; each read is capped at 1,000 rows with no order, so every figure below goes
-- quietly wrong at the 1,001st account or stats row. Its head counts (events, media, uploads by
-- fortnight, newsletter totals, emails sent) are exact already and stay where they are.
--
-- THE KEYS, named for what /admin and /admin/metrics render (the operator is never a customer:
-- every accounts figure leaves out `is_admin`, as summarizeProfiles and buildAdminKpis do):
--   as_of                                 now(), so a reader can build its day buckets on this clock
--   window_days, fortnight_days           the two windows it was asked for (defaults 30 and 14, the
--                                         WINDOW_DAYS and FORTNIGHT_DAYS the pages use today)
--   accounts.total                        accounts (summarizeProfiles.total; the home's Accounts)
--   accounts.new_in_window                created in the window (newLast30)
--   accounts.active_in_window             last seen in the window (activeLast30)
--   accounts.new_in_fortnight             created in the last fortnight (the home's delta, this side)
--   accounts.new_in_prior_fortnight       created in the fortnight before it (the other side)
--   accounts.active_in_fortnight          last seen in the last fortnight (Active hosts)
--   accounts.active_in_prior_fortnight    last seen in the fortnight before it
--   accounts.paid                         a non-empty stripe_subscription_id (paidSubscribers)
--   accounts.storage_used_bytes           the storage counter summed (totalStorageBytes)
--   accounts.by_tier                      { "<profiles.tier>": n }, the RAW tier values: the reader
--                                         folds them with toBillingTier (max reads as pro), so the
--                                         mapping keeps its one home in lib/constants/tiers.ts
--   accounts.signups_by_day               { "YYYY-MM-DD": n } for the window's UTC days that had one;
--                                         the reader zero-fills its own buckets (buildSignupTrend)
--   engagement.qr_scans, .album_views     lifetime sums (summarizeLinkStats)
--   engagement.by_day                     { "YYYY-MM-DD": { "qr_scans": n, "album_views": n } } for
--                                         the window's days that had traffic (buildEngagementTrend)
--   newsletter.by_source                  [{ "source": raw value or null, "count": n }], largest first;
--                                         the reader applies countBySource's rule (trimmed, blank or
--                                         null reads "direct") and merges
-- Windows are 24-hour days counted back from now(), as the JavaScript's `days * 86_400_000` is; day
-- keys are UTC dates, as link_stats.day and the reducers' buckets are.
--
-- SECURITY INVOKER, and service_role alone may execute it: the metrics pages call it on the admin
-- client after requireAdmin(). Were a client role ever granted it by mistake, INVOKER would still
-- confine it to that role's own rows (its own profile, its own events' stats, no newsletter row),
-- where a DEFINER body would hand out the platform's figures. plpgsql only to refuse a bad window
-- loudly rather than answer zeros.
create function public.admin_metrics_snapshot(
  p_window_days integer default 30,
  p_fortnight_days integer default 14
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_now timestamptz := now();
  v_today date := (now() at time zone 'UTC')::date;
  v_window_start timestamptz;
  v_fortnight_start timestamptz;
  v_prior_start timestamptz;
  v_accounts jsonb;
  v_engagement jsonb;
  v_by_source jsonb;
begin
  if p_window_days is null or p_window_days < 1 or p_fortnight_days is null or p_fortnight_days < 1 then
    raise exception 'admin_metrics_snapshot: each window is a whole number of days, at least 1 (got % and %)',
      p_window_days, p_fortnight_days
      using errcode = 'invalid_parameter_value';
  end if;
  v_window_start := v_now - make_interval(hours => 24 * p_window_days);
  v_fortnight_start := v_now - make_interval(hours => 24 * p_fortnight_days);
  v_prior_start := v_now - make_interval(hours => 48 * p_fortnight_days);

  select jsonb_build_object(
           'total', count(*),
           'new_in_window', count(*) filter (where p.created_at >= v_window_start),
           'active_in_window', count(*) filter (where p.last_active_at >= v_window_start),
           'new_in_fortnight', count(*) filter (where p.created_at >= v_fortnight_start),
           'new_in_prior_fortnight', count(*) filter (
             where p.created_at >= v_prior_start and p.created_at < v_fortnight_start),
           'active_in_fortnight', count(*) filter (where p.last_active_at >= v_fortnight_start),
           'active_in_prior_fortnight', count(*) filter (
             where p.last_active_at >= v_prior_start and p.last_active_at < v_fortnight_start),
           -- JavaScript truthiness, as `if (r.stripe_subscription_id)`: an empty string is not paid.
           'paid', count(*) filter (where coalesce(p.stripe_subscription_id, '') <> ''),
           'storage_used_bytes', coalesce(sum(p.storage_used_bytes), 0)::bigint
         )
    into v_accounts
    from public.profiles p
   where not p.is_admin;

  v_accounts := v_accounts || jsonb_build_object(
    'by_tier', coalesce((
      select jsonb_object_agg(t.tier, t.n)
      from (
        select p.tier::text as tier, count(*) as n
        from public.profiles p
        where not p.is_admin
        group by p.tier
      ) t
    ), '{}'::jsonb),
    'signups_by_day', coalesce((
      select jsonb_object_agg(to_char(d.day, 'YYYY-MM-DD'), d.n)
      from (
        select (p.created_at at time zone 'UTC')::date as day, count(*) as n
        from public.profiles p
        where not p.is_admin
          and (p.created_at at time zone 'UTC')::date > v_today - p_window_days
        group by 1
      ) d
    ), '{}'::jsonb)
  );

  select jsonb_build_object(
           'qr_scans', coalesce(sum(l.count) filter (where l.kind = 'qr_scan'), 0),
           'album_views', coalesce(sum(l.count) filter (where l.kind = 'album_view'), 0),
           'by_day', coalesce((
             select jsonb_object_agg(
                      to_char(d.day, 'YYYY-MM-DD'),
                      jsonb_build_object('qr_scans', d.qr_scans, 'album_views', d.album_views))
             from (
               select l2.day,
                      coalesce(sum(l2.count) filter (where l2.kind = 'qr_scan'), 0) as qr_scans,
                      coalesce(sum(l2.count) filter (where l2.kind = 'album_view'), 0) as album_views
               from public.link_stats l2
               where l2.day > v_today - p_window_days
               group by l2.day
             ) d
           ), '{}'::jsonb)
         )
    into v_engagement
    from public.link_stats l;

  select coalesce(
           jsonb_agg(jsonb_build_object('source', s.source, 'count', s.n) order by s.n desc, s.source nulls first),
           '[]'::jsonb
         )
    into v_by_source
    from (
      select n.source, count(*) as n
      from public.newsletter_signups n
      group by n.source
    ) s;

  return jsonb_build_object(
    'as_of', v_now,
    'window_days', p_window_days,
    'fortnight_days', p_fortnight_days,
    'accounts', v_accounts,
    'engagement', v_engagement,
    'newsletter', jsonb_build_object('by_source', v_by_source)
  );
end;
$$;

revoke all on function public.admin_metrics_snapshot(integer, integer) from public, anon, authenticated;
grant execute on function public.admin_metrics_snapshot(integer, integer) to service_role;

comment on function public.event_card_stats(uuid[]) is
  'Dashboard card counts: { event id: { approved, pending } } over non-removed media, every input id present (zeros when nothing counts). SECURITY INVOKER: the host''s own RLS scopes it.';
comment on function public.event_covers(uuid[]) is
  'One cover per event: { event id: { preview_key, original_key } }, the newest approved non-removed photo (created_at desc, id desc); an event with none is absent. SECURITY INVOKER: RLS scopes a host, the service role reads any.';
comment on function public.event_link_totals(uuid) is
  'An event''s lifetime { qr_scans, album_views }. SECURITY INVOKER over link_stats_host_select: anyone but the host reads zeros.';
comment on function public.list_guest_rows_by_email(timestamptz, uuid, integer) is
  'The claim card: the CONFIRMED caller''s own unclaimed guest rows that carry a live upload, ordered by last upload desc, guest id desc. Pages on the last row''s (last_upload_at, guest_id) with p_limit clamped to 1,000; a null p_limit reads everything.';
comment on function public.admin_metrics_snapshot(integer, integer) is
  'Every operator metric that was derived from whole-table reads (accounts, link stats, newsletter sources), as one jsonb. Service-role only; SECURITY INVOKER.';

-- ── THE ROLLED-BACK CHECK (run through the Supabase MCP after applying; it ends in a deliberate
-- raise, so nothing persists). It rides EXISTING rows: the scale probe's host and events (more than
-- 1,000 approved photos in one event), another host's event, and, for the claim card, every
-- name-only guest row that carries a live upload, given a confirmed account's address inside the
-- block and undone by the final raise. ────────────────────────────────────────────────────────────
-- do $$
-- declare
--   c_qr constant text := 'd02631f1bfb3455188d224e41bf9510f';
--   v_probe uuid;
--   v_host uuid;
--   v_foreign uuid;
--   v_ids uuid[];
--   v_input uuid[];
--   v_all_events uuid[];
--   v_got jsonb;
--   v_hand jsonb;
--   v_user uuid;
--   v_email text;
--   v_rows integer;
--   v_pages integer;
--   v_listed uuid[];
--   v_paged uuid[];
--   v_page uuid[];
--   v_after_at timestamptz;
--   v_after_id uuid;
--   v_tied uuid[];
--   v_snap jsonb;
--   v_default jsonb;
--   v_today date := (now() at time zone 'UTC')::date;
--   v_raised boolean := false;
--   v_event uuid;
-- begin
--   select e.id, e.host_id into v_probe, v_host from public.events e where e.qr_token = c_qr and e.deleted_at is null;
--   if v_probe is null then raise exception 'SETUP: the scale probe (qr %) is missing', c_qr; end if;
--   select e.id into v_foreign from public.events e where e.host_id <> v_host order by e.created_at limit 1;
--   select array_agg(e.id order by e.created_at) into v_ids from public.events e where e.host_id = v_host;
--   select array_agg(e.id) into v_all_events from public.events e;
--   v_input := v_ids || array[v_foreign, gen_random_uuid(), null::uuid];
--
--   -- 1. event_card_stats, as the host: every non-null id present, only the host's media counted.
--   select jsonb_object_agg(x.id, jsonb_build_object(
--            'approved', (select count(*) from public.media m join public.events e on e.id = m.event_id
--                          where m.event_id = x.id and e.host_id = v_host and m.removed_at is null and m.status = 'approved'),
--            'pending', (select count(*) from public.media m join public.events e on e.id = m.event_id
--                         where m.event_id = x.id and e.host_id = v_host and m.removed_at is null and m.status = 'pending')))
--     into v_hand
--     from (select distinct u.id from unnest(v_input) as u(id) where u.id is not null) x;
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   v_got := public.event_card_stats(v_input);
--   if public.event_card_stats(null) <> '{}'::jsonb or public.event_card_stats('{}') <> '{}'::jsonb then
--     raise exception 'FAIL: event_card_stats of nothing is not {}';
--   end if;
--   reset role;
--   if v_got <> v_hand then raise exception 'FAIL: event_card_stats % differs from the hand tally %', v_got, v_hand; end if;
--   if (v_got -> v_probe::text ->> 'approved')::integer <= 1000 then
--     raise exception 'SETUP: the probe counts % approved; the check needs more than 1,000', v_got -> v_probe::text ->> 'approved';
--   end if;
--   raise notice 'OK: event_card_stats equals a hand tally over % ids (the probe: %)', (select count(*) from jsonb_object_keys(v_got)), v_got -> v_probe::text;
--
--   -- 2. event_covers: as the host (their events only), then on the service role (any event).
--   select coalesce(jsonb_object_agg(e.id, jsonb_build_object('preview_key', c.preview_key, 'original_key', c.original_key)), '{}')
--     into v_hand
--     from public.events e
--     cross join lateral (
--       select m.preview_key, m.original_key from public.media m
--        where m.event_id = e.id and m.status = 'approved' and m.type = 'photo' and m.removed_at is null
--        order by m.created_at desc, m.id desc limit 1) c
--    where e.host_id = v_host;
--   set local role authenticated;
--   v_got := public.event_covers(v_input);
--   reset role;
--   if v_got <> v_hand then raise exception 'FAIL: the host''s covers % differ from the hand tally %', v_got, v_hand; end if;
--   select coalesce(jsonb_object_agg(e.id, jsonb_build_object('preview_key', c.preview_key, 'original_key', c.original_key)), '{}')
--     into v_hand
--     from public.events e
--     cross join lateral (
--       select m.preview_key, m.original_key from public.media m
--        where m.event_id = e.id and m.status = 'approved' and m.type = 'photo' and m.removed_at is null
--        order by m.created_at desc, m.id desc limit 1) c;
--   set local role service_role;
--   v_got := public.event_covers(v_all_events);
--   reset role;
--   if v_got <> v_hand then raise exception 'FAIL: the service role''s covers differ from the hand tally'; end if;
--   raise notice 'OK: event_covers equals a hand tally for the host and for the service role (% covers)', (select count(*) from jsonb_object_keys(v_got));
--
--   -- 3. event_link_totals: each of the host's events against a hand sum; another host's event reads zeros.
--   foreach v_event in array v_ids loop
--     select jsonb_build_object('qr_scans', coalesce(sum(l.count) filter (where l.kind = 'qr_scan'), 0),
--                               'album_views', coalesce(sum(l.count) filter (where l.kind = 'album_view'), 0))
--       into v_hand from public.link_stats l where l.event_id = v_event;
--     set local role authenticated;
--     v_got := public.event_link_totals(v_event);
--     reset role;
--     if v_got <> v_hand then raise exception 'FAIL: event_link_totals % differs from %', v_got, v_hand; end if;
--   end loop;
--   if v_foreign is not null then
--     set local role authenticated;
--     v_got := public.event_link_totals(v_foreign);
--     reset role;
--     if v_got <> '{"qr_scans": 0, "album_views": 0}'::jsonb then
--       raise exception 'FAIL: another host''s event totals reached this host: %', v_got;
--     end if;
--   end if;
--   raise notice 'OK: event_link_totals equals a hand sum for % events, zeros for another host''s', cardinality(v_ids);
--
--   -- 4. list_guest_rows_by_email: every name-only row with a live upload takes a confirmed account's
--   --    address, and the two newest rows' last uploads are made to tie, so the id tiebreak decides
--   --    them; then paged at 1 (every row is a page boundary) against the unpaged list and a hand order.
--   select u.id, lower(btrim(u.email)) into v_user, v_email
--     from auth.users u
--    where u.email_confirmed_at is not null and position('@' in coalesce(u.email, '')) > 1
--    order by u.created_at limit 1;
--   if v_user is null then raise exception 'SETUP: no confirmed account'; end if;
--   update public.guests g set pending_email = v_email, pending_email_at = now()
--    where g.user_id is null and g.verified_at is null
--      and exists (select 1 from public.events e where e.id = g.event_id and e.deleted_at is null)
--      and exists (select 1 from public.media x where x.guest_id = g.id and x.status <> 'removed');
--   get diagnostics v_rows = row_count;
--   if v_rows < 3 then raise exception 'SETUP: only % name-only rows carry a live upload', v_rows; end if;
--   select array_agg(q.id order by q.last_at desc, q.id desc) into v_tied
--     from (select g.id, (select max(x.created_at) from public.media x where x.guest_id = g.id and x.status <> 'removed') as last_at
--             from public.guests g where g.pending_email = v_email) q;
--   update public.media x set created_at = (select max(y.created_at) from public.media y where y.guest_id = v_tied[1] and y.status <> 'removed')
--    where x.id = (select y.id from public.media y where y.guest_id = v_tied[2] and y.status <> 'removed' order by y.created_at desc, y.id desc limit 1);
--   select array_agg(q.id order by q.last_at desc, q.id desc) into v_tied
--     from (select g.id, (select max(x.created_at) from public.media x where x.guest_id = g.id and x.status <> 'removed') as last_at
--             from public.guests g
--             join public.events e on e.id = g.event_id and e.deleted_at is null
--            where g.pending_email = v_email and g.user_id is null and g.verified_at is null) q
--    where q.last_at is not null;
--   perform set_config('request.jwt.claims', json_build_object('sub', v_user, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   select coalesce(array_agg(r.guest_id order by r.ord), '{}') into v_listed
--     from public.list_guest_rows_by_email() with ordinality as r(guest_id, event_id, event_name, event_date, display_name,
--          upload_count, last_upload_at, pending_email_at, ord);
--   v_paged := '{}'; v_after_at := null; v_after_id := null; v_pages := 0;
--   loop
--     select coalesce(array_agg(r.guest_id order by r.ord), '{}'),
--            (array_agg(r.last_upload_at order by r.ord desc))[1],
--            (array_agg(r.guest_id order by r.ord desc))[1]
--       into v_page, v_after_at, v_after_id
--       from public.list_guest_rows_by_email(v_after_at, v_after_id, 1) with ordinality as r(guest_id, event_id, event_name,
--            event_date, display_name, upload_count, last_upload_at, pending_email_at, ord);
--     exit when cardinality(v_page) = 0;
--     if cardinality(v_page) > 1 then raise exception 'FAIL: a claim-card page of % rows at p_limit 1', cardinality(v_page); end if;
--     v_paged := v_paged || v_page;
--     v_pages := v_pages + 1;
--     if v_pages > 5000 then raise exception 'FAIL: the claim-card pages never ended'; end if;
--   end loop;
--   select count(*) into v_rows from public.list_guest_rows_by_email(null, null, 5000);
--   reset role;
--   if v_listed <> v_tied then raise exception 'FAIL: the deployed call''s rows % differ from the hand order %', v_listed, v_tied; end if;
--   if v_paged <> v_listed then raise exception 'FAIL: the claim card paged at 1 differs from the unpaged call'; end if;
--   if v_rows <> cardinality(v_listed) then raise exception 'FAIL: p_limit 5000 returned % of %', v_rows, cardinality(v_listed); end if;
--   -- The oracle gate survived the rewrite: the same account UNCONFIRMED, and no session at all, list nothing.
--   update auth.users set email_confirmed_at = null where id = v_user;
--   set local role authenticated;
--   select count(*) into v_rows from public.list_guest_rows_by_email();
--   perform set_config('request.jwt.claims', '', true);
--   select v_rows + count(*) into v_rows from public.list_guest_rows_by_email(null, null, 5000);
--   reset role;
--   if v_rows <> 0 then raise exception 'FAIL: an unconfirmed caller or no session listed % rows', v_rows; end if;
--   raise notice 'OK: the claim card lists % rows for a confirmed account, paged at 1 in the same order (a tie decided by id); unconfirmed, none', cardinality(v_listed);
--
--   -- 5. admin_metrics_snapshot, on the service role, against figures counted another way.
--   set local role service_role;
--   v_snap := public.admin_metrics_snapshot();
--   v_default := public.admin_metrics_snapshot(30, 14);
--   begin
--     perform public.admin_metrics_snapshot(0, 14);
--   exception when invalid_parameter_value then
--     v_raised := true;
--   end;
--   reset role;
--   if v_snap <> v_default then raise exception 'FAIL: the defaults are not 30 and 14'; end if;
--   if not v_raised then raise exception 'FAIL: a zero-day window did not raise'; end if;
--   v_hand := jsonb_build_object(
--     'total', (select count(*) from public.profiles p where not p.is_admin),
--     'new_in_window', (select count(*) from public.profiles p where not p.is_admin and p.created_at >= now() - interval '720 hours'),
--     'active_in_window', (select count(*) from public.profiles p where not p.is_admin and p.last_active_at >= now() - interval '720 hours'),
--     'new_in_fortnight', (select count(*) from public.profiles p where not p.is_admin and p.created_at >= now() - interval '336 hours'),
--     'new_in_prior_fortnight', (select count(*) from public.profiles p where not p.is_admin
--                                  and p.created_at >= now() - interval '672 hours' and p.created_at < now() - interval '336 hours'),
--     'active_in_fortnight', (select count(*) from public.profiles p where not p.is_admin and p.last_active_at >= now() - interval '336 hours'),
--     'active_in_prior_fortnight', (select count(*) from public.profiles p where not p.is_admin
--                                     and p.last_active_at >= now() - interval '672 hours' and p.last_active_at < now() - interval '336 hours'),
--     'paid', (select count(*) from public.profiles p where not p.is_admin and p.stripe_subscription_id is not null and p.stripe_subscription_id <> ''),
--     'storage_used_bytes', (select coalesce(sum(p.storage_used_bytes), 0) from public.profiles p where not p.is_admin),
--     'by_tier', (select coalesce(jsonb_object_agg(t.tier, t.n), '{}') from (select p.tier::text as tier, count(*) as n
--                  from public.profiles p where not p.is_admin group by 1) t),
--     'signups_by_day', (select coalesce(jsonb_object_agg(to_char(b.day, 'YYYY-MM-DD'), b.n), '{}') from (
--                          select v_today - k.n as day, (select count(*) from public.profiles p where not p.is_admin
--                                                        and (p.created_at at time zone 'UTC')::date = v_today - k.n) as n
--                            from generate_series(0, 29) as k(n)) b where b.n > 0));
--   if v_snap -> 'accounts' <> v_hand then
--     raise exception 'FAIL: accounts % differ from the hand tally %', v_snap -> 'accounts', v_hand;
--   end if;
--   v_hand := jsonb_build_object(
--     'qr_scans', (select coalesce(sum(l.count), 0) from public.link_stats l where l.kind = 'qr_scan'),
--     'album_views', (select coalesce(sum(l.count), 0) from public.link_stats l where l.kind = 'album_view'),
--     'by_day', (select coalesce(jsonb_object_agg(to_char(b.day, 'YYYY-MM-DD'), jsonb_build_object('qr_scans', b.qr, 'album_views', b.av)), '{}') from (
--                  select v_today - k.n as day,
--                         (select coalesce(sum(l.count), 0) from public.link_stats l where l.day = v_today - k.n and l.kind = 'qr_scan') as qr,
--                         (select coalesce(sum(l.count), 0) from public.link_stats l where l.day = v_today - k.n and l.kind = 'album_view') as av,
--                         (select count(*) from public.link_stats l where l.day = v_today - k.n) as n
--                    from generate_series(0, 29) as k(n)) b where b.n > 0));
--   if v_snap -> 'engagement' <> v_hand then
--     raise exception 'FAIL: engagement % differs from the hand tally %', v_snap -> 'engagement', v_hand;
--   end if;
--   if v_snap -> 'newsletter' -> 'by_source' <> (select coalesce(jsonb_agg(jsonb_build_object('source', s.source, 'count', s.n)
--                                                 order by s.n desc, s.source nulls first), '[]')
--                                                from (select n.source, count(*) as n from public.newsletter_signups n group by 1) s)
--      or (select coalesce(sum((x ->> 'count')::integer), 0) from jsonb_array_elements(v_snap -> 'newsletter' -> 'by_source') x)
--         <> (select count(*) from public.newsletter_signups) then
--     raise exception 'FAIL: newsletter by source % differs from the table', v_snap -> 'newsletter';
--   end if;
--   raise notice 'OK: admin_metrics_snapshot equals figures counted another way: %', v_snap -> 'accounts';
--
--   -- 6. The grants and the shapes: no anon EXECUTE in this file; the metrics are service_role's alone.
--   if has_function_privilege('anon', 'public.event_card_stats(uuid[])', 'execute')
--      or not has_function_privilege('authenticated', 'public.event_card_stats(uuid[])', 'execute') then
--     raise exception 'FAIL: event_card_stats is not authenticated-only';
--   end if;
--   if has_function_privilege('anon', 'public.event_covers(uuid[])', 'execute')
--      or not has_function_privilege('authenticated', 'public.event_covers(uuid[])', 'execute')
--      or not has_function_privilege('service_role', 'public.event_covers(uuid[])', 'execute') then
--     raise exception 'FAIL: event_covers is not authenticated and service_role';
--   end if;
--   if has_function_privilege('anon', 'public.event_link_totals(uuid)', 'execute')
--      or not has_function_privilege('authenticated', 'public.event_link_totals(uuid)', 'execute') then
--     raise exception 'FAIL: event_link_totals is not authenticated-only';
--   end if;
--   if has_function_privilege('anon', 'public.list_guest_rows_by_email(timestamptz, uuid, integer)', 'execute')
--      or not has_function_privilege('authenticated', 'public.list_guest_rows_by_email(timestamptz, uuid, integer)', 'execute') then
--     raise exception 'FAIL: list_guest_rows_by_email is not authenticated-only';
--   end if;
--   if has_function_privilege('anon', 'public.admin_metrics_snapshot(integer, integer)', 'execute')
--      or has_function_privilege('authenticated', 'public.admin_metrics_snapshot(integer, integer)', 'execute')
--      or not has_function_privilege('service_role', 'public.admin_metrics_snapshot(integer, integer)', 'execute') then
--     raise exception 'FAIL: admin_metrics_snapshot is not service_role only';
--   end if;
--   if to_regprocedure('public.list_guest_rows_by_email()') is not null then
--     raise exception 'FAIL: the old claim-card signature survived (PostgREST cannot choose between overloads)';
--   end if;
--   if (select count(*) from pg_proc p where p.pronamespace = 'public'::regnamespace and p.proname in
--        ('event_card_stats', 'event_covers', 'event_link_totals', 'list_guest_rows_by_email', 'admin_metrics_snapshot')) <> 5 then
--     raise exception 'FAIL: expected exactly one signature per function';
--   end if;
--   if not (select p.prosecdef from pg_proc p where p.oid = 'public.list_guest_rows_by_email(timestamptz, uuid, integer)'::regprocedure)
--      or exists (select 1 from pg_proc p where p.pronamespace = 'public'::regnamespace and p.prosecdef
--                  and p.proname in ('event_card_stats', 'event_covers', 'event_link_totals', 'admin_metrics_snapshot')) then
--     raise exception 'FAIL: a security mode moved (the claim card DEFINER, the other four INVOKER)';
--   end if;
--   if exists (select 1 from pg_proc p where p.pronamespace = 'public'::regnamespace
--        and p.proname in ('event_card_stats', 'event_covers', 'event_link_totals', 'list_guest_rows_by_email', 'admin_metrics_snapshot')
--        and p.proconfig is distinct from array['search_path=""']) then
--     raise exception 'FAIL: a search_path is not pinned to empty';
--   end if;
--   raise notice 'OK: the grants, one signature each, the security modes and the search_path';
--
--   raise exception 'ROLLED BACK: every row_cap_host check held';
-- end $$;
