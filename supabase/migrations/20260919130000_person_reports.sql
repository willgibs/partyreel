-- ═══════════════════════════════════════════════════════════════════════════
-- reports.profile_id — a person can be reported, not only a photograph
-- ═══════════════════════════════════════════════════════════════════════════
-- Will, `profile-page` r1 `block=report` (2026-09-19): "This establishes a more
-- scalable pattern/menu for other usage as well." The menu on /u/[slug] now
-- offers Report this person beside Block, and a report with nowhere to land is
-- a lie told to the person who pressed it: the operator's inbox IS the feature.
-- So the existing reports table grows one nullable subject column rather than
-- gaining a table of its own — one queue, one status machine, one /admin page.
--
-- WHAT CHANGES
--   * event_id becomes NULLABLE (a person report names no event), with a CHECK
--     that one of the two subjects is always set. Additive: every existing row
--     has an event_id, so the CHECK is satisfied on creation.
--   * profile_id (nullable) references profiles, ON DELETE CASCADE. Cascade,
--     not SET NULL: SET NULL would strand a row that satisfies neither half of
--     the CHECK and would make the delete itself fail, and account deletion is
--     a right the product already honours (20260902130000). A deleted account
--     takes its open reports with it, exactly as a deleted event does.
--   * NO new grants and NO new policy: reports stays RLS deny-all and
--     operator-internal. The person report is written by the service-role admin
--     client from a route handler that has already re-verified getUser(), so
--     there is no anon capability path to add (unlike create_report, whose
--     qr_token is the capability). A reported person must never be able to read
--     the report, and a host must never see reports on their own events.
--   * NO reporter column. The table has never carried one, storing who
--     reported whom is a privacy decision of its own, and the rate limit +
--     signed-in gate already bound the abuse. If an operator ever needs it, it
--     is an additive column then, with its own reasoning.
--
-- ─── ROLLED-BACK CONTRACT CHECK (Supabase MCP, rolled back; never committed):
--
--   begin;
--     -- 1. a person report inserts with no event
--     insert into public.reports (profile_id, reason)
--     select id, 'contract check' from public.profiles limit 1;
--     -- 2. a report naming NEITHER subject is refused
--     do $check$
--     begin
--       insert into public.reports (reason) values ('neither');
--       raise exception 'reports_subject_present did not fire';
--     exception when check_violation then null;
--     end
--     $check$;
--     -- 3. the media path is untouched (event_id still resolves, RPC still works)
--     select public.create_report((select qr_token from public.events
--            where deleted_at is null limit 1), null, 'contract check');
--     -- 4. still deny-all to the client
--     select count(*) = 0 as reports_not_client_readable
--     from information_schema.table_privileges
--     where table_schema = 'public' and table_name = 'reports'
--       and grantee in ('anon', 'authenticated') and privilege_type = 'SELECT';
--   rollback;
--
-- ─── ADVISOR DELTA: none. No new function, no new RLS policy, no new table;
-- reports keeps RLS enabled with zero policies (deny-all), which the accepted
-- set already carries.
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.reports alter column event_id drop not null;

alter table public.reports
  add column profile_id uuid references public.profiles (id) on delete cascade;

-- Exactly one subject is not required: a future report could name a person IN
-- an event (both set) and this still holds. What is required is that a report
-- is ABOUT something, so a row can never arrive that the operator cannot read.
alter table public.reports
  add constraint reports_subject_present
  check (event_id is not null or profile_id is not null);

-- Partial: person reports are the rare arm, and the operator queue reads them
-- by subject. The existing reports_status_created_at_idx still serves the queue.
create index reports_profile_id_idx on public.reports (profile_id)
  where profile_id is not null;
