-- =============================================================================================
-- THE SCHEMA PASS, PART 1 OF 2 (lane `schema-pass`, 2026-09-29): what nothing reads leaves, every client role
-- keeps only what its callers use, and `events` holds the bounds the app already assumes.
--
-- Will's standing permission (2026-09-29): "you're in full control of our data architecture, and as you
-- rearchitect or optimize, anything useless may be dropped as needed." His answer to this file's question
-- (2026-09-29): "Yes, write and prove." Every drop was checked against BOTH builds on this database,
-- partyreel.com (`main` at milestone-30) and the launch-prep alias: `git grep` of src/, workers/ and scripts/
-- on each, every live function body, and pg_stat_statements since 2026-05-28. What milestone-30 still reads,
-- the reel's three dormant media columns in its host select list, waits in part 2
-- (20260929170000_schema_pass_contract.sql, after milestone 31). This file adds and replaces no function.
--
-- WHAT THIS FILE DOES, each with its reason:
--  1. WILL'S DROPS (his yes, 2026-09-29), read and written by neither build:
--       events.show_guest_list               the guest list is always on (`room=always`); its host insert
--                                            and update grants go with the column
--       notification_prefs.notify_album_shared, .notify_new_uploads_digest, .notify_new_follower
--                                            switches with no mail behind them; both builds read and
--                                            write only notify_pass_renewal and marketing_opt_in
--  2. DEAD WEIGHT, read by nothing:
--       newsletter_signups.opted_in_at       created_at's twin: its one writer, capture_guest_email,
--                                            names neither and inserts once (on conflict do nothing)
--       job_applications.resume_url          never written (the careers form sends links); the
--                                            applicants inbox's Resume link leaves in the same commit,
--                                            and milestone-30's inbox reads select("*") and draws that
--                                            link only when the value is there
--       events_host_active_idx               0 scans; events_host_id_idx answers every host_id read
--       media_event_id_reel_eligible_idx     no read filters on reel_eligible but the dashboard's reel
--                                            progress, which plans media_active_bytes_idx; the seven
--                                            hottest media reads plan identically without it (a
--                                            rolled-back explain on the 1,165-item album); one index
--                                            fewer to write on every upload and status change
--       storage_ledger_host_id_idx           the unique (host_id, period) leads with host_id
--       article_feedback_slug_idx            0 scans: the summary groups the whole table, which the
--                                            planner answers with a scan and a hash
--       storage_ledger_host_select, and      no client reads the monthly meter: its readers are the
--         authenticated's SELECT on it       upload gates (definer) and the service role, so the ledger
--                                            joins the deny-all set
--  3. GRANTS, down to what each role's callers use:
--       every table privilege from anon      anon reads through the four capability RPCs, all definer.
--                                            Every policy is `to authenticated`, so it read no row of
--                                            any table anyway, and since 2026-05-28 its only table
--                                            statements are one-call red-team probes. Supabase's default
--                                            had also handed it TRUNCATE, which no RLS limits.
--       TRUNCATE, REFERENCES, TRIGGER and    Supabase's default on every table (MAINTAIN since Postgres
--         MAINTAIN from authenticated        17); PostgREST issues none of them
--       authenticated's SELECT on the        RLS answered nothing there, and now the grant says so too:
--         deny-all tables                    reports (a reporter's confirmed address while it is open),
--                                            the limiter logs, the two inboxes, the job log, the kill
--                                            switches, the mail log, the newsletter, the ledger
--       tier_limits(tier_type) from PUBLIC,  every caller is a definer body (the owner) or the service
--         anon and authenticated             role; no code calls it
--       get_upload_context's PUBLIC EXECUTE  anon, authenticated and the service role hold it by name,
--                                            the posture 20260929120000 gave get_event_by_qr_token, so
--                                            no function in public is executable through PUBLIC
--       the default privileges in public,    a table, sequence or function created by postgres no longer
--         for anon and authenticated         grants anon or authenticated anything: the MCP landmine
--                                            (database-security.md) closed at its source, with the
--                                            statements Supabase's "Securing your API" guide gives (the
--                                            platform's coming default). The service role keeps its
--                                            defaults, which every server read of a new table uses.
--                                            Postgres's own PUBLIC EXECUTE on a new function stays: a
--                                            per-schema default cannot revoke a global one (the guide's
--                                            `revoke execute on functions from public` in schema public
--                                            changes nothing; the check below proves it), so every grant
--                                            block still revokes from public, and a bare `revoke … from
--                                            public` now leaves anon and authenticated nothing.
--  4. WHAT WAS MISSING:
--       newsletter_signups_event_id_idx      an event's hard delete sets its signups' event_id null (the
--                                            FK's own action), a scan of the whole list per event
--                                            without it, and the list grows with every opted-in guest
--       events_name_len, events_description_len, events_qr_style_len
--                                            the host writes these columns straight through PostgREST
--                                            with her own session, past the app's schema, so the table
--                                            holds the app's bounds itself: a name of 1 to 80
--                                            characters and a description of at most 2,000
--                                            (validation/event.ts, pinned by migration-guards.test.ts),
--                                            and a QR preset key of 1 to 32 (an envelope, never the list:
--                                            a new preset needs no migration). Every live row fits (20
--                                            events: the longest name 37, description 34, key 7).
--
-- ★ WHAT partyreel.com (milestone-30) LOSES: nothing. It names none of the dropped columns (its event and
-- applicant reads select("*"), its preference select is `notify_pass_renewal, marketing_opt_in`), reads no
-- table as anon, reads the deny-all tables and the ledger only through the service role, calls tier_limits
-- nowhere, and writes names, descriptions and QR keys only through the schema these CHECKs mirror.
--
-- APPLY PROTOCOL (database-security.md, Workflow):
--  (1) Drift, read-only: everything this file removes still stands.
--        select table_name, column_name from information_schema.columns where table_schema = 'public'
--           and (table_name, column_name) in (('events', 'show_guest_list'),
--           ('notification_prefs', 'notify_album_shared'), ('notification_prefs', 'notify_new_uploads_digest'),
--           ('notification_prefs', 'notify_new_follower'), ('newsletter_signups', 'opted_in_at'),
--           ('job_applications', 'resume_url'));                                                       -- 6 rows
--        select indexname from pg_indexes where schemaname = 'public' and indexname in
--          ('events_host_active_idx', 'media_event_id_reel_eligible_idx', 'storage_ledger_host_id_idx',
--           'article_feedback_slug_idx');                                                              -- 4 rows
--        select policyname from pg_policies where policyname = 'storage_ledger_host_select';           -- 1 row
--  (2) The rolled-back check at the foot, on the live schema, then apply verbatim.
--  (3) get_advisors. EXPECTED DELTA: security rls_enabled_no_policy 17 -> 18 (storage_ledger), 0028 and 0029
--      unchanged at 4 and 33 (tier_limits is invoker, in neither). Performance: unindexed_foreign_keys 4 -> 3
--      (newsletter_signups leaves); unused_index loses events_host_active_idx and article_feedback_slug_idx and
--      gains newsletter_signups_event_id_idx until an event's purge walks it.
--  (4) Regenerate src/lib/db/types.ts: events loses show_guest_list, notification_prefs its three switches,
--      newsletter_signups opted_in_at, job_applications resume_url. No code names any of them outside a
--      comment or a loose fixture.
--  (5) A live smoke of the anonymous surfaces on partyreel.com and the alias (a guest page by token, a public
--      profile, help feedback, the newsletter capture), since both builds read this database.
-- =============================================================================================

-- =============================================================================================
-- 1. Will's drops.
-- =============================================================================================
alter table public.events drop column show_guest_list;

-- One statement a column: notification-prefs.test.ts replays each drop off the migrations.
alter table public.notification_prefs drop column notify_album_shared;
alter table public.notification_prefs drop column notify_new_uploads_digest;
alter table public.notification_prefs drop column notify_new_follower;

-- =============================================================================================
-- 2. Dead weight.
-- =============================================================================================
alter table public.newsletter_signups drop column opted_in_at;
alter table public.job_applications drop column resume_url;

drop index public.events_host_active_idx;
drop index public.media_event_id_reel_eligible_idx;
drop index public.storage_ledger_host_id_idx;
drop index public.article_feedback_slug_idx;

-- The ledger's readers are definer bodies and the service role (authenticated's SELECT leaves in 3c).
drop policy storage_ledger_host_select on public.storage_ledger;

-- =============================================================================================
-- 3. Grants.
-- =============================================================================================
-- 3a. anon holds nothing on any table. It holds no column grant anywhere, so this empties nothing else; its
-- four capability RPCs are definer and read as the owner.
revoke all on all tables in schema public from anon;

-- 3b. ★ A table-level revoke cascades to the column grants of the same privilege: columns here carry only
-- SELECT, INSERT and UPDATE (never REFERENCES), so the host's column-locked writes and media's column-scoped
-- SELECT stand.
revoke truncate, references, trigger, maintain on all tables in schema public from authenticated;

-- 3c. The deny-all tables' SELECT (RLS on, no policy: it answered nothing), the ledger's with them. None of
-- them carries a column grant.
revoke select on table
  public.action_attempts,
  public.contact_submissions,
  public.export_log,
  public.job_applications,
  public.job_runs,
  public.newsletter_signups,
  public.ops_flags,
  public.reports,
  public.sent_emails,
  public.storage_ledger,
  public.unlock_attempts
  from authenticated;

-- 3d. tier_limits: every caller is a definer body (it runs as the owner) or the service role.
revoke all on function public.tier_limits(public.tier_type) from public, anon, authenticated;
grant execute on function public.tier_limits(public.tier_type) to service_role;

-- 3e. get_upload_context: anon, authenticated and the service role hold EXECUTE by name, so PUBLIC's goes.
revoke execute on function public.get_upload_context(text, public.media_type) from public;

-- 3f. The MCP landmine at its source: the migrating role's defaults in public handed anon and authenticated
-- every privilege on each new table, sequence and function. The service role keeps its defaults.
alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on functions from anon, authenticated;

-- =============================================================================================
-- 4. What was missing.
-- =============================================================================================
-- The FK's own action (on delete set null) looks its rows up by event_id; most signups carry none.
create index newsletter_signups_event_id_idx on public.newsletter_signups (event_id)
  where event_id is not null;

-- The app's own bounds, held where the host's direct write lands. char_length counts characters where the
-- app counts UTF-16 units, so everything the app accepts fits.
alter table public.events
  add constraint events_name_len check (char_length(name) between 1 and 80),
  add constraint events_description_len check (description is null or char_length(description) <= 2000),
  add constraint events_qr_style_len check (char_length(qr_style) between 1 and 32);

comment on constraint events_name_len on public.events is
  'The app''s bound (validation/event.ts: 1 to 80 after its trim), held here because the host writes name straight through PostgREST with her own session.';
comment on constraint events_description_len on public.events is
  'The app''s bound (validation/event.ts: at most 2,000), held here because the host writes description straight through PostgREST with her own session.';
comment on constraint events_qr_style_len on public.events is
  'An envelope for the QR preset key, never the list (QR_STYLE_KEYS is the app''s): a new preset needs no migration.';

-- =============================================================================================
-- THE ROLLED-BACK CHECK. Proved on the live schema 2026-09-29, before the apply, as ONE execute_sql call:
-- `begin;` + the snapshot below + this file verbatim + the blocks below (uncommented) + `select n, step, ok,
-- detail from proof order by n; rollback;`. It rides EXISTING rows (the newest open, ungated album with
-- approved media, a ticket already in and a host with a handle, and another host), writes only inside the
-- transaction, and each block traps its own failure into `proof`, so one call reports them all. Held, every
-- step ok, and afterwards the live schema read exactly as before (the six columns, the four indexes and the
-- policy standing, anon holding SELECT on reports, the defaults naming anon, no probe, no signup, the event's
-- row unchanged, get_upload_context's PUBLIC EXECUTE in place):
--   setup                | t | event 37ab40b1-f508-483d-be79-7b00baf17104, host 88d50fe4-6603-4a56-a96e-605bc32c960b,
--                        |   | other host 6cb5fdb5-ac8a-4c82-83ce-59b5a2cfcd0b
--   1 the file, exactly  | t | gone: 6 columns, 4 indexes, 1 policy; new: 3 checks, 1 index; bodies changed 0; ACLs
--                        |   | changed: get_upload_context(text,media_type), tier_limits(tier_type); deny-all 18;
--                        |   | PUBLIC-executable 0; defaults S={postgres=rwU/postgres,service_role=rwU/postgres}
--                        |   | f={postgres=X/postgres,service_role=X/postgres}
--                        |   | r={postgres=arwdDxtm/postgres,service_role=arwdDxtm/postgres}
--   2 anon               | t | refused all 30 tables (select), TRUNCATE reports and tier_limits; no table or column
--                        |   | privilege left; get_event_by_qr_token 1 row, get_event_media_by_qr_token 2,
--                        |   | get_public_profile and get_upload_context answer
--   3 the host           | t | her event, profile, prefs, likes, blocks, follows, shown events, event blocks, invites,
--                        |   | link stats and announcements read; her media reads 2 rows on the new list and on
--                        |   | milestone-30's; her event, profile and prefs writes land; get_host_upload_context
--                        |   | answers; refused all 18 deny-all tables and tier_limits; no TRUNCATE, REFERENCES,
--                        |   | TRIGGER or MAINTAIN on any table; reports holds nothing for anon or authenticated
--   4 another host       | t | her event and its media read 0 rows, her event write lands on 0
--   5 the service role   | t | tier_limits answers one row; the ledger, reports and the applications (select *)
--                        |   | read; capture_guest_email's opt-in lands one signup
--   6 the checks         | t | refused a name of 81 and of 0, a description of 2,001, a key of 33 and of 0, each by
--                        |   | its own constraint; took a name of 80, a name of 40 emoji (80 UTF-16 units, the app's
--                        |   | longest), a description of 2,000 and of null, a key of 32
--   7 new objects        | t | a new table: nothing for anon or authenticated, the service role's four; a new
--                        |   | function: PUBLIC's EXECUTE only, no client role named, and one bare revoke from public
--                        |   | leaves anon false, authenticated false, the service role true; the guide's per-schema
--                        |   | revoke from public leaves the next function executable through PUBLIC (a no-op)
--   8 the index          | t | the FK action's lookup plans newsletter_signups_event_id_idx
-- =============================================================================================
--
-- ── the snapshot, before this file ──
-- create temp table proof (n serial, step text, ok boolean, detail text) on commit drop;
-- create temp table fx (k text primary key, id uuid, txt text) on commit drop;
-- create temp table snap_fn on commit drop as
--   select p.oid::regprocedure::text as fn, md5(p.prosrc) as body, coalesce(p.proacl::text, '') as acl
--     from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public';
-- create temp view now_obj as
--   select 'column' as kind, c.relname || '.' || a.attname as name
--     from pg_attribute a join pg_class c on c.oid = a.attrelid join pg_namespace n on n.oid = c.relnamespace
--    where n.nspname = 'public' and c.relkind = 'r' and a.attnum > 0 and not a.attisdropped
--   union all select 'index', indexname from pg_indexes where schemaname = 'public'
--   union all select 'policy', tablename || '.' || policyname from pg_policies where schemaname = 'public'
--   union all select 'constraint', c.relname || '.' || k.conname
--     from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace
--    where n.nspname = 'public'
--   union all select 'trigger', c.relname || '.' || t.tgname
--     from pg_trigger t join pg_class c on c.oid = t.tgrelid join pg_namespace n on n.oid = c.relnamespace
--    where n.nspname = 'public' and not t.tgisinternal;
-- create temp table snap_obj on commit drop as select * from now_obj;
--
-- ── then this file, verbatim; then the blocks ──
--
-- -- ── setup: the newest open, ungated album with approved media, a ticket already in and a host with a handle ──
-- do $$
-- declare v_event uuid; v_host uuid; v_qr text; v_ticket text; v_slug text; v_other uuid;
-- begin
--   select e.id, e.host_id, e.qr_token into v_event, v_host, v_qr
--     from public.events e
--    where e.deleted_at is null and e.visibility = 'open' and e.gate is null and not e.require_upload_to_view
--      and exists (select 1 from public.media m where m.event_id = e.id and m.status = 'approved')
--      and exists (select 1 from public.guests g where g.event_id = e.id and g.admission = 'in')
--      and exists (select 1 from public.profiles p where p.id = e.host_id and p.slug is not null)
--    order by e.created_at desc limit 1;
--   if v_event is null then raise exception 'SETUP: no event fits'; end if;
--   select g.session_token into v_ticket from public.guests g
--    where g.event_id = v_event and g.admission = 'in' order by g.created_at desc limit 1;
--   select p.slug into v_slug from public.profiles p where p.id = v_host;
--   select e.host_id into v_other from public.events e
--    where e.deleted_at is null and e.host_id <> v_host order by e.created_at desc limit 1;
--   if v_other is null then raise exception 'SETUP: no other host'; end if;
--   insert into fx values ('event', v_event, v_qr), ('host', v_host, v_slug), ('ticket', null, v_ticket), ('other', v_other, null);
--   insert into proof (step, ok, detail) values ('setup', true, format('event %s, host %s, other host %s', v_event, v_host, v_other));
-- exception when others then
--   insert into proof (step, ok, detail) values ('setup', false, sqlerrm);
-- end $$;
--
-- -- ── 1. exactly what the file names moved: the drops, the adds, two function ACLs and no body ──
-- do $$
-- declare v_gone text; v_new text; v_bodies int; v_acls text; v_denyall int; v_public int; v_defaults text;
-- begin
--   select string_agg(kind || ' ' || name, ', ' order by kind collate "C", name collate "C") into v_gone
--     from (select * from snap_obj except select * from now_obj) x;
--   select string_agg(kind || ' ' || name, ', ' order by kind collate "C", name collate "C") into v_new
--     from (select * from now_obj except select * from snap_obj) x;
--   select count(*) into v_bodies from snap_fn s
--     join pg_proc p on p.oid::regprocedure::text = s.fn
--     join pg_namespace n on n.oid = p.pronamespace and n.nspname = 'public'
--    where md5(p.prosrc) <> s.body;
--   select string_agg(s.fn, ', ' order by s.fn collate "C") into v_acls from snap_fn s
--     join pg_proc p on p.oid::regprocedure::text = s.fn
--     join pg_namespace n on n.oid = p.pronamespace and n.nspname = 'public'
--    where coalesce(p.proacl::text, '') <> s.acl;
--   select count(*) into v_denyall from pg_class c join pg_namespace n on n.oid = c.relnamespace
--    where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity
--      and not exists (select 1 from pg_policies p where p.schemaname = 'public' and p.tablename = c.relname);
--   select count(*) into v_public from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--    where n.nspname = 'public' and (p.proacl is null or exists (select 1 from aclexplode(p.proacl) a where a.grantee = 0));
--   select string_agg(d.defaclobjtype::text || '=' || d.defaclacl::text, ' ' order by d.defaclobjtype::text collate "C") into v_defaults
--     from pg_default_acl d where d.defaclrole = 'postgres'::regrole and d.defaclnamespace = 'public'::regnamespace;
--   if v_gone is distinct from 'column events.show_guest_list, column job_applications.resume_url, column newsletter_signups.opted_in_at, column notification_prefs.notify_album_shared, column notification_prefs.notify_new_follower, column notification_prefs.notify_new_uploads_digest, index article_feedback_slug_idx, index events_host_active_idx, index media_event_id_reel_eligible_idx, index storage_ledger_host_id_idx, policy storage_ledger.storage_ledger_host_select'
--     then raise exception 'gone: %', v_gone; end if;
--   if v_new is distinct from 'constraint events.events_description_len, constraint events.events_name_len, constraint events.events_qr_style_len, index newsletter_signups_event_id_idx'
--     then raise exception 'new: %', v_new; end if;
--   if v_bodies <> 0 then raise exception '% function bodies changed', v_bodies; end if;
--   if v_acls is distinct from 'get_upload_context(text,media_type), tier_limits(tier_type)' then raise exception 'acls: %', v_acls; end if;
--   if v_denyall <> 18 then raise exception 'deny-all tables: %', v_denyall; end if;
--   if v_public <> 0 then raise exception '% functions executable through PUBLIC', v_public; end if;
--   if v_defaults ~ '(anon|authenticated)=' or v_defaults !~ 'r=\{[^}]*service_role=arwdDxtm' then
--     raise exception 'defaults: %', v_defaults; end if;
--   insert into proof (step, ok, detail) values ('1 the file, exactly', true,
--     format('gone: 6 columns, 4 indexes, 1 policy; new: 3 checks, 1 index; bodies changed 0; ACLs changed: %s; deny-all %s; PUBLIC-executable 0; defaults %s', v_acls, v_denyall, v_defaults));
-- exception when others then
--   insert into proof (step, ok, detail) values ('1 the file, exactly', false, sqlerrm);
-- end $$;
--
-- -- ── 2. anon: no table, no TRUNCATE, no tier_limits; the four capability reads still answer ──
-- do $$
-- declare
--   v_qr text; v_slug text; v_ticket text; t text; v_refused int := 0; v_tables int; v_leak text[] := '{}';
--   v_priv int; v_cols int; v_ev int; v_media int; v_profile jsonb; v_upload jsonb; v_tier boolean := false; v_trunc boolean := false;
-- begin
--   select txt into v_qr from fx where k = 'event';
--   select txt into v_slug from fx where k = 'host';
--   select txt into v_ticket from fx where k = 'ticket';
--   select count(*) into v_priv from pg_class c join pg_namespace n on n.oid = c.relnamespace
--    where n.nspname = 'public' and c.relkind in ('r', 'v', 'm', 'p', 'f')
--      and has_table_privilege('anon', c.oid, 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER,MAINTAIN');
--   select count(*) into v_cols from pg_class c join pg_namespace n on n.oid = c.relnamespace
--    where n.nspname = 'public' and c.relkind = 'r' and has_any_column_privilege('anon', c.oid, 'SELECT,INSERT,UPDATE,REFERENCES');
--   perform set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
--   set local role anon;
--   for t in select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
--             where n.nspname = 'public' and c.relkind = 'r' order by 1 loop
--     begin
--       execute format('select 1 from public.%I limit 1', t);
--       v_leak := v_leak || t;
--     exception when insufficient_privilege then
--       v_refused := v_refused + 1;
--     end;
--   end loop;
--   select count(*) into v_tables from pg_class c join pg_namespace n on n.oid = c.relnamespace
--    where n.nspname = 'public' and c.relkind = 'r';
--   begin
--     truncate public.reports;
--     v_trunc := true;
--   exception when insufficient_privilege then null;
--   end;
--   begin
--     perform 1 from public.tier_limits('free');
--     v_tier := true;
--   exception when insufficient_privilege then null;
--   end;
--   select count(*) into v_ev from public.get_event_by_qr_token(v_qr);
--   select count(*) into v_media from public.get_event_media_by_qr_token(v_qr, null, null, 5);
--   v_profile := public.get_public_profile(v_slug);
--   v_upload := public.get_upload_context(v_ticket, 'photo');
--   reset role;
--   if v_priv <> 0 or v_cols <> 0 then raise exception 'anon still holds a privilege on % tables, a column grant on %', v_priv, v_cols; end if;
--   if cardinality(v_leak) > 0 or v_refused <> v_tables then raise exception 'anon read %', v_leak; end if;
--   if v_trunc then raise exception 'anon truncated reports'; end if;
--   if v_tier then raise exception 'anon ran tier_limits'; end if;
--   if v_ev <> 1 or v_media < 1 or v_profile is null or v_upload is null then
--     raise exception 'a capability read went quiet: event %, media %, profile %, upload %', v_ev, v_media, v_profile is not null, v_upload is not null;
--   end if;
--   insert into proof (step, ok, detail) values ('2 anon', true,
--     format('refused all %s tables (select), TRUNCATE reports and tier_limits; no table or column privilege left; get_event_by_qr_token 1 row, get_event_media_by_qr_token %s, get_public_profile and get_upload_context answer', v_tables, v_media));
-- exception when others then
--   insert into proof (step, ok, detail) values ('2 anon', false, sqlerrm);
-- end $$;
--
-- -- ── 3. the host: her own reads and writes, both media lists, the ledger through its definer read; every deny-all table refused ──
-- do $$
-- declare
--   v_event uuid; v_host uuid; t text; v_n int; v_u int; v_refused int := 0; v_leak text[] := '{}'; v_denyall int;
--   v_list text := 'id, event_id, guest_id, type, original_key, preview_key, file_size_bytes, duration_seconds, width, height, status, created_at, updated_at, removed_at, purge_at, removed_by_uploader, reel_eligible';
--   v_new int; v_old int; v_ctx jsonb; v_tier boolean := false; v_latent int; v_reports int; v_detail text;
-- begin
--   select id into v_event from fx where k = 'event';
--   select id into v_host from fx where k = 'host';
--   select count(*) into v_latent from pg_class c join pg_namespace n on n.oid = c.relnamespace
--    where n.nspname = 'public' and c.relkind = 'r' and has_table_privilege('authenticated', c.oid, 'TRUNCATE,REFERENCES,TRIGGER,MAINTAIN');
--   select count(*) into v_reports from (values ('anon'), ('authenticated')) r(role)
--    where has_table_privilege(r.role, 'public.reports', 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER,MAINTAIN')
--       or has_any_column_privilege(r.role, 'public.reports', 'SELECT,INSERT,UPDATE,REFERENCES');
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   select count(*) into v_n from public.events where id = v_event;
--   if v_n <> 1 then raise exception 'her event: % rows', v_n; end if;
--   select count(*) into v_n from public.profiles where id = v_host;
--   if v_n <> 1 then raise exception 'her profile: % rows', v_n; end if;
--   perform notify_pass_renewal, marketing_opt_in from public.notification_prefs where user_id = v_host;
--   perform 1 from public.media_likes limit 1;
--   perform 1 from public.user_blocks limit 1;
--   perform 1 from public.user_follows limit 1;
--   perform 1 from public.profile_shown_events limit 1;
--   perform 1 from public.event_blocks limit 1;
--   perform 1 from public.event_invites limit 1;
--   perform 1 from public.link_stats limit 1;
--   perform 1 from public.announcements limit 1;
--   execute format('select count(*) from (select %s from public.media where event_id = %L and status <> %L) x', v_list, v_event, 'removed') into v_new;
--   execute format('select count(*) from (select %s, highlight_score, clip_start_seconds, clip_end_seconds from public.media where event_id = %L and status <> %L) x', v_list, v_event, 'removed') into v_old;
--   if v_new < 1 or v_new <> v_old then raise exception 'her media: % on the new list, % on milestone-30''s', v_new, v_old; end if;
--   update public.events set description = description where id = v_event;
--   get diagnostics v_u = row_count;
--   if v_u <> 1 then raise exception 'her event write: % rows', v_u; end if;
--   update public.profiles set welcomed_at = welcomed_at where id = v_host;
--   get diagnostics v_u = row_count;
--   if v_u <> 1 then raise exception 'her profile write: % rows', v_u; end if;
--   update public.notification_prefs set marketing_opt_in = marketing_opt_in where user_id = v_host;
--   v_ctx := public.get_host_upload_context(v_event, 'photo');
--   if v_ctx is null then raise exception 'get_host_upload_context went quiet'; end if;
--   for t in select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
--             where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity
--               and not exists (select 1 from pg_policies p where p.schemaname = 'public' and p.tablename = c.relname)
--             order by 1 loop
--     begin
--       execute format('select 1 from public.%I limit 1', t);
--       v_leak := v_leak || t;
--     exception when insufficient_privilege then
--       v_refused := v_refused + 1;
--     end;
--   end loop;
--   begin
--     perform 1 from public.tier_limits('free');
--     v_tier := true;
--   exception when insufficient_privilege then null;
--   end;
--   reset role;
--   if cardinality(v_leak) > 0 then raise exception 'authenticated read %', v_leak; end if;
--   if v_tier then raise exception 'authenticated ran tier_limits'; end if;
--   if v_latent <> 0 then raise exception 'authenticated keeps TRUNCATE, REFERENCES, TRIGGER or MAINTAIN on % tables', v_latent; end if;
--   if v_reports <> 0 then raise exception 'a client role keeps a privilege on reports'; end if;
--   insert into proof (step, ok, detail) values ('3 the host', true,
--     format('her event, profile, prefs, likes, blocks, follows, shown events, event blocks, invites, link stats and announcements read; her media reads %s rows on the new list and on milestone-30''s; her event, profile and prefs writes land; get_host_upload_context answers; refused all %s deny-all tables and tier_limits; no TRUNCATE, REFERENCES, TRIGGER or MAINTAIN on any table; reports holds nothing for anon or authenticated', v_new, v_refused));
-- exception when others then
--   insert into proof (step, ok, detail) values ('3 the host', false, sqlerrm);
-- end $$;
--
-- -- ── 4. another host reaches none of it ──
-- do $$
-- declare v_event uuid; v_other uuid; v_ev int; v_media int; v_u int;
-- begin
--   select id into v_event from fx where k = 'event';
--   select id into v_other from fx where k = 'other';
--   perform set_config('request.jwt.claims', json_build_object('sub', v_other, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   select count(*) into v_ev from public.events where id = v_event;
--   select count(*) into v_media from public.media where event_id = v_event;
--   update public.events set name = name where id = v_event;
--   get diagnostics v_u = row_count;
--   reset role;
--   if v_ev <> 0 or v_media <> 0 or v_u <> 0 then raise exception 'another host: event %, media %, write %', v_ev, v_media, v_u; end if;
--   insert into proof (step, ok, detail) values ('4 another host', true, 'her event and its media read 0 rows, her event write lands on 0');
-- exception when others then
--   insert into proof (step, ok, detail) values ('4 another host', false, sqlerrm);
-- end $$;
--
-- -- ── 5. the service role: tier_limits, the ledger, reports, the inbox, and the newsletter capture without opted_in_at ──
-- do $$
-- declare v_ticket text; v_email text := 'schema-pass-' || substr(md5(random()::text), 1, 8) || '@example.test'; v_tier int; v_n int;
-- begin
--   select txt into v_ticket from fx where k = 'ticket';
--   set local role service_role;
--   select count(*) into v_tier from public.tier_limits('free');
--   perform count(*) from public.storage_ledger;
--   perform count(*) from public.reports;
--   perform * from public.job_applications limit 1;
--   perform public.capture_guest_email(v_ticket, v_email, true);
--   select count(*) into v_n from public.newsletter_signups where email = v_email and created_at is not null;
--   reset role;
--   if v_tier <> 1 or v_n <> 1 then raise exception 'service role: tier_limits %, capture %', v_tier, v_n; end if;
--   insert into proof (step, ok, detail) values ('5 the service role', true, 'tier_limits answers one row; the ledger, reports and the applications (select *) read; capture_guest_email''s opt-in lands one signup');
-- exception when others then
--   insert into proof (step, ok, detail) values ('5 the service role', false, sqlerrm);
-- end $$;
--
-- -- ── 6. the CHECKs refuse one over each bound and take the bound, through the host's own column grant ──
-- do $$
-- declare v_event uuid; v_host uuid; v_refused text[] := '{}'; v_con text; v_u int; v_taken int := 0; v_try text;
-- begin
--   select id into v_event from fx where k = 'event';
--   select id into v_host from fx where k = 'host';
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   foreach v_try in array array[
--     format('update public.events set name = %L where id = %L', repeat('x', 81), v_event),
--     format('update public.events set name = %L where id = %L', '', v_event),
--     format('update public.events set description = %L where id = %L', repeat('x', 2001), v_event),
--     format('update public.events set qr_style = %L where id = %L', repeat('x', 33), v_event),
--     format('update public.events set qr_style = %L where id = %L', '', v_event)
--   ] loop
--     begin
--       execute v_try;
--       raise exception 'taken: %', left(v_try, 60);
--     exception when check_violation then
--       get stacked diagnostics v_con = constraint_name;
--       v_refused := v_refused || v_con;
--     end;
--   end loop;
--   foreach v_try in array array[
--     format('update public.events set name = %L where id = %L', repeat('x', 80), v_event),
--     format('update public.events set name = %L where id = %L', repeat(chr(127881), 40), v_event),
--     format('update public.events set description = %L where id = %L', repeat('x', 2000), v_event),
--     format('update public.events set description = null where id = %L', v_event),
--     format('update public.events set qr_style = %L where id = %L', repeat('x', 32), v_event)
--   ] loop
--     execute v_try;
--     get diagnostics v_u = row_count;
--     v_taken := v_taken + v_u;
--   end loop;
--   reset role;
--   if v_refused <> array['events_name_len', 'events_name_len', 'events_description_len', 'events_qr_style_len', 'events_qr_style_len']
--     then raise exception 'refused by %', v_refused; end if;
--   if v_taken <> 5 then raise exception 'took % of 5 at the bound', v_taken; end if;
--   insert into proof (step, ok, detail) values ('6 the checks', true,
--     'refused a name of 81 and of 0, a description of 2,001, a key of 33 and of 0, each by its own constraint; took a name of 80, a name of 40 emoji (80 UTF-16 units, the app''s longest), a description of 2,000 and of null, a key of 32');
-- exception when others then
--   insert into proof (step, ok, detail) values ('6 the checks', false, sqlerrm);
-- end $$;
--
-- -- ── 7. a table and a function created after the file: anon and authenticated get nothing, the service role keeps its defaults ──
-- do $$
-- declare v_t_anon boolean; v_t_auth boolean; v_t_svc boolean; v_f_pub boolean; v_f_named int; v_f_after text; v_f_two boolean;
-- begin
--   execute format('create table public.%I (id integer)', 'schema_pass_probe');
--   execute format('create function public.%I() returns integer language sql as %L', 'schema_pass_probe', 'select 1');
--   v_t_anon := has_table_privilege('anon', 'public.schema_pass_probe', 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER,MAINTAIN');
--   v_t_auth := has_table_privilege('authenticated', 'public.schema_pass_probe', 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER,MAINTAIN');
--   v_t_svc := has_table_privilege('service_role', 'public.schema_pass_probe', 'SELECT,INSERT,UPDATE,DELETE');
--   -- Postgres's own default: PUBLIC holds EXECUTE on a new function; no client role is named.
--   v_f_pub := has_function_privilege('anon', 'public.schema_pass_probe()', 'EXECUTE');
--   select count(*) into v_f_named from pg_proc p, aclexplode(p.proacl) a
--    where p.oid = 'public.schema_pass_probe()'::regprocedure and a.grantee in ('anon'::regrole, 'authenticated'::regrole);
--   execute 'revoke all on function public.schema_pass_probe() from public';
--   v_f_after := format('%s/%s/%s',
--     has_function_privilege('anon', 'public.schema_pass_probe()', 'EXECUTE'),
--     has_function_privilege('authenticated', 'public.schema_pass_probe()', 'EXECUTE'),
--     has_function_privilege('service_role', 'public.schema_pass_probe()', 'EXECUTE'));
--   -- Supabase's guide adds `revoke execute on functions from public` per schema: a per-schema default
--   -- cannot revoke a global one, so the next function still carries PUBLIC's EXECUTE.
--   alter default privileges for role postgres in schema public revoke execute on functions from public;
--   execute format('create function public.%I() returns integer language sql as %L', 'schema_pass_probe_two', 'select 2');
--   v_f_two := has_function_privilege('anon', 'public.schema_pass_probe_two()', 'EXECUTE');
--   if v_t_anon or v_t_auth or not v_t_svc then raise exception 'table: anon %, authenticated %, service role %', v_t_anon, v_t_auth, v_t_svc; end if;
--   if not v_f_pub or v_f_named <> 0 then raise exception 'function: PUBLIC %, named client roles %', v_f_pub, v_f_named; end if;
--   if v_f_after <> 'f/f/t' then raise exception 'after a bare revoke from public: %', v_f_after; end if;
--   if not v_f_two then raise exception 'the per-schema revoke from public lifted PUBLIC''s EXECUTE'; end if;
--   insert into proof (step, ok, detail) values ('7 new objects', true,
--     'a new table: nothing for anon or authenticated, the service role''s four; a new function: PUBLIC''s EXECUTE only, no client role named, and one bare revoke from public leaves anon false, authenticated false, the service role true; the guide''s per-schema revoke from public leaves the next function executable through PUBLIC (a no-op)');
-- exception when others then
--   insert into proof (step, ok, detail) values ('7 new objects', false, sqlerrm);
-- end $$;
--
-- -- ── 8. the new index serves the event purge's set-null ──
-- do $$
-- declare r record; v_plan text := '';
-- begin
--   perform set_config('enable_seqscan', 'off', true);
--   for r in execute format('explain (costs off) update only public.newsletter_signups set event_id = null where %L::uuid operator(pg_catalog.=) event_id', gen_random_uuid()) loop
--     v_plan := v_plan || ' ' || btrim(r."QUERY PLAN");
--   end loop;
--   perform set_config('enable_seqscan', 'on', true);
--   if v_plan !~ 'newsletter_signups_event_id_idx' then raise exception 'plan: %', v_plan; end if;
--   insert into proof (step, ok, detail) values ('8 the index', true, 'the FK action''s lookup plans newsletter_signups_event_id_idx');
-- exception when others then
--   insert into proof (step, ok, detail) values ('8 the index', false, sqlerrm);
-- end $$;
