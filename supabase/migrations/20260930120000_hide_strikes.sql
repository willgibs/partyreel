-- THE INSTANT HIDE'S BAR, THREE STRIKES THAT LAPSE (hide-strikes, Will 2026-09-30).
--
-- His call B, overruled in chat: "I think we should shift into something like a three-strike policy that lapses
-- after 180 days. I don't want to prevent a well-meaning reporter from a second report if I simply disagree with
-- the first." Until now ONE dismissed child-abuse report barred its address from the instant hide for good
-- (20260929140000_triage_r2.sql: create_report's `not exists (… r.status = 'dismissed')`).
--
-- WHAT CHANGES, one fact: a STRIKE is a child-abuse report from an address (its `reporter_hash`) that the
-- operator dismissed, and it lapses 180 days after its dismissal. An address holding three live strikes has lost
-- the instant hide; its report is still filed the same and heads the queue. The dismissal's time is
-- `reports.resolved_at`: the portal's one close writes it with the status and its one reopen clears both
-- (closeReports and reopenReports, app/admin/reports/actions.ts; live on 2026-09-30, 20 dismissed reports and
-- none without it). So the count reads the reports as they stand: a dismissal's Undo takes its strike back, and a
-- strike dismissed before this file counts from its own dismissal (live: seven, from two addresses, all dismissed
-- 2026-09-29, which lapse on 2027-03-28).
--
-- WHAT DOES NOT CHANGE: everything else about the hide (a child-abuse report of an item someone still sees, from
-- a confirmed address; never the event's own host; at most 3 an address and 5 an event in any 24 hours, both
-- advisory-locked first), the insert, the answer, the signature and the one grant (the service role's).
--
-- SHAPE: `create or replace` with the same signature, return type, language, volatility, security mode and empty
-- search_path, so the ACL is kept, and the grants are restated as they stand live (2026-09-30:
-- {postgres=X/postgres,service_role=X/postgres}). The body is 20260929140000's (live's, md5-checked 2026-09-30:
-- a34941458f04cf6678bddeb3d2dac842, whitespace collapsed) with only the bar replaced and its two numbers named
-- once, in its declare; its comment says the new bar.
--
-- APPLY PROTOCOL (database-security.md -> Workflow): (1) the body before, for the diff:
--   select p.oid::regprocedure, md5(regexp_replace(p.prosrc, '\s+', ' ', 'g')), p.proacl from pg_proc p
--     join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'create_report';
-- (2) apply verbatim; (3) the same read after (the one signature and the same ACL, a new md5); (4) get_advisors,
-- EXPECTED DELTA: NONE (the same function, the same grants); (5) the rolled-back check at the foot; (6) no types
-- regeneration (no signature or column moves). The deployed build calls the same seven named arguments on either
-- side of the apply, so it needs no deploy.

create or replace function public.create_report(
  p_qr_token text,
  p_media_id uuid default null,
  p_reason text default null,
  p_kind public.report_kind default 'other',
  p_reporter_user_id uuid default null,
  p_reporter_email text default null,
  p_reporter_hash text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  -- ★ THREE STRIKES THAT LAPSE, the one home of both numbers (Will, 2026-09-30): "I don't want to prevent a
  -- well-meaning reporter from a second report if I simply disagree with the first." A strike is a child-abuse
  -- report from this address that the operator dismissed; it counts until c_strike_lapse after its dismissal
  -- (`resolved_at`), and c_strikes live ones bar the hide.
  c_strikes constant integer := 3;
  c_strike_lapse constant interval := interval '180 days';
  v_event public.events;
  v_media public.media;
  v_confirmed boolean := p_reporter_email is not null and p_reporter_hash is not null;
  v_hide boolean := false;
  v_report_id uuid;
begin
  select * into v_event
  from public.events
  where qr_token = p_qr_token and deleted_at is null;

  if not found then
    raise exception 'Event not found.' using errcode = 'no_data_found';
  end if;

  -- A reported item must belong to this event (no cross-event references).
  if p_media_id is not null then
    select * into v_media from public.media m
     where m.id = p_media_id and m.event_id = v_event.id;
    if not found then
      raise exception 'Reported media does not belong to this event.' using errcode = 'check_violation';
    end if;
  end if;

  -- ★ THE INSTANT HIDE: a child-abuse report of an item, from a confirmed address. Its limits read this
  -- address's and this event's earlier hides, so the two are serialized first (a burst cannot all pass).
  if p_kind = 'child' and v_confirmed and p_media_id is not null then
    perform pg_catalog.pg_advisory_xact_lock(
      pg_catalog.hashtextextended('report_hide:address:' || p_reporter_hash, 0));
    perform pg_catalog.pg_advisory_xact_lock(
      pg_catalog.hashtextextended('report_hide:event:' || v_event.id::text, 0));
    v_hide :=
      -- someone still sees it: the album, or the host's own Deleted
      (v_media.status <> 'removed'
        or (not v_media.removed_by_admin and not v_media.removed_by_uploader and v_media.purge_asked_at is null))
      -- a host never triggers an operator's removal
      and p_reporter_user_id is distinct from v_event.host_id
      -- an address holding three live strikes has lost the hide; read as the reports stand, so a dismissal's
      -- Undo (the status back to open, `resolved_at` cleared) takes its strike back
      and (select count(*) from public.reports r
            where r.reporter_hash = p_reporter_hash and r.kind = 'child' and r.status = 'dismissed'
              and r.resolved_at > now() - c_strike_lapse) < c_strikes
      -- at most 3 hides an address, and 5 an event, in any 24 hours
      and (select count(*) from public.reports r
            where r.reporter_hash = p_reporter_hash and r.hid_at > now() - interval '24 hours') < 3
      and (select count(*) from public.reports r
            where r.event_id = v_event.id and r.hid_at > now() - interval '24 hours') < 5;
  end if;

  insert into public.reports (
    event_id, media_id, reason, kind, reporter_signed_in, reporter_email, reporter_hash, hid_at
  )
  values (
    v_event.id,
    p_media_id,
    nullif(trim(coalesce(p_reason, '')), ''),
    p_kind,
    p_reporter_user_id is not null,
    case when v_confirmed then lower(trim(p_reporter_email)) end,
    case when v_confirmed and p_kind = 'child' then p_reporter_hash end,
    case when v_hide then now() end
  )
  returning id into v_report_id;

  if v_hide then
    -- As a takedown would (removalUpdate, adoptionUpdate): up, it leaves the album with this instant as its
    -- removed_at (= the report's hid_at); already in her Deleted, it becomes the operator's there.
    update public.media
       set status = 'removed', removed_at = now(), removed_by_admin = true
     where id = p_media_id and status <> 'removed';
    update public.media
       set removed_by_admin = true
     where id = p_media_id
       and status = 'removed'
       and not removed_by_admin
       and not removed_by_uploader
       and purge_asked_at is null;
  end if;

  return jsonb_build_object('report_id', v_report_id, 'hid', v_hide, 'event_id', v_event.id);
end;
$$;

revoke all on function public.create_report(text, uuid, text, public.report_kind, uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.create_report(text, uuid, text, public.report_kind, uuid, text, text)
  to service_role;

comment on function public.create_report(text, uuid, text, public.report_kind, uuid, text, text) is
  'Files an album or item report (the qr_token is the capability). A child-abuse report of an item from a confirmed address hides the item at once as an operator''s removal (hid_at), never for the event''s host, an address holding three strikes (its child-abuse reports dismissed in the last 180 days, each lapsing 180 days after its dismissal), or past 3 an address and 5 an event in 24 hours. Answers {report_id, hid, event_id}. Service-role only: the route derives every reporter fact from getUser().';

-- ── THE ROLLED-BACK CHECK. Proved on the live schema 2026-09-30, before the apply, as ONE execute_sql call:
-- `begin;` + this file + the block below (uncommented) + `select n, step, ok, detail from proof order by n;
-- rollback;`, every step ok (setup, 1 through 7; step 7's md5 ee5079e8ebf56b253c878a0ce34435e9 is this file's
-- body) and nothing left behind (create_report's md5 back to a34941458f04cf6678bddeb3d2dac842). The same block
-- alone on the body before it is red at 1, 3, 4, 5 and 7, where the rule moved. After the apply, the same block
-- runs alone the same way, all ok. It rides EXISTING rows (the newest live event with five items
-- someone still sees, none held or taken down, and no report in it) and writes only inside the transaction. Each
-- strike it plants is dismissed at a time of its own while its row is created now, so a count that read
-- `created_at` or `updated_at` instead of the dismissal's time fails steps 3 and 4. Each step traps its own
-- failure into `proof`, so one call reports them all:
--   1. two live strikes still hide (A);
--   2. a third bars the address: its report is still filed as any other, open and kept, the item still up;
--   3. a strike 181 days old no longer counts: the same third strike at 179 days bars, moved to 181 it hides (C);
--   4. an undone dismissal no longer counts: three live strikes bar, the reopen's own write hides (D);
--   5. only a dismissed child-abuse report is a strike: an actioned one, an open one and another kind dismissed,
--      beside two live strikes, still hide (E);
--   6. the other limits hold on B: unconfirmed, the event's own host, an album report and another kind hide
--      nothing; a fourth from one address and a sixth in one event in 24 hours hide nothing; with all of them
--      clear, B hides;
--   7. the shape: one create_report, the seven-argument signature, DEFINER with an empty search_path, both
--      advisory locks, EXECUTE for the service role alone, the comment saying the new bar.
--
-- create temp table proof (n serial, step text, ok boolean, detail text) on commit drop;
-- create temp table fx (k text primary key, id uuid, qr text) on commit drop;
--
-- -- ── setup: the newest live event with five items someone still sees, none held or taken down, no report ──
-- do $$
-- declare v_event uuid; v_host uuid; v_qr text; i int := 0; rec record;
-- begin
--   select e.id, e.host_id, e.qr_token into v_event, v_host, v_qr
--     from public.events e
--    where e.deleted_at is null
--      and (select count(*) from public.media m
--            where m.event_id = e.id and m.status <> 'removed' and m.legal_hold_at is null
--              and not m.removed_by_admin) >= 5
--      and not exists (select 1 from public.reports r where r.event_id = e.id)
--    order by e.created_at desc limit 1;
--   if v_event is null then raise exception 'SETUP: no event fits'; end if;
--   insert into fx values ('event', v_event, v_qr), ('host', v_host, null);
--   for rec in select m.id from public.media m
--               where m.event_id = v_event and m.status <> 'removed' and m.legal_hold_at is null
--                 and not m.removed_by_admin
--               order by m.created_at desc, m.id desc limit 5 loop
--     i := i + 1;
--     insert into fx values (chr(64 + i), rec.id, null);
--   end loop;
--   insert into proof (step, ok, detail) values ('setup', true, 'event ' || v_event || ', items A-E');
-- end $$;
--
-- -- ── 1. two live strikes still hide ──
-- do $$
-- declare ev uuid; v_qr text; a uuid; res jsonb; v_status text; v_admin boolean;
-- begin
--   select id, qr into ev, v_qr from fx where k = 'event'; select id into a from fx where k = 'A';
--   insert into public.reports (event_id, reason, kind, reporter_hash, status, resolved_at)
--   values (ev, 'strike proof', 'child', 'hash-two', 'dismissed', now() - interval '1 day'),
--          (ev, 'strike proof', 'child', 'hash-two', 'dismissed', now() - interval '179 days');
--   res := public.create_report(v_qr, a, 'proof', 'child', gen_random_uuid(), 'two@example.com', 'hash-two');
--   if not (res->>'hid')::boolean then raise exception 'two live strikes barred the hide: %', res; end if;
--   select status::text, removed_by_admin into v_status, v_admin from public.media where id = a;
--   if v_status <> 'removed' or not v_admin then raise exception 'A reads % %', v_status, v_admin; end if;
--   insert into proof (step, ok, detail) values ('1 two live strikes hide', true, res::text);
-- exception when others then
--   insert into proof (step, ok, detail) values ('1 two live strikes hide', false, sqlerrm);
-- end $$;
--
-- -- ── 2. a third strike bars the address; its report is filed as any other ──
-- do $$
-- declare ev uuid; v_qr text; b uuid; res jsonb; v_status text; seen int;
-- begin
--   select id, qr into ev, v_qr from fx where k = 'event'; select id into b from fx where k = 'B';
--   insert into public.reports (event_id, reason, kind, reporter_hash, status, resolved_at)
--   values (ev, 'strike proof', 'child', 'hash-three', 'dismissed', now() - interval '1 day'),
--          (ev, 'strike proof', 'child', 'hash-three', 'dismissed', now() - interval '90 days'),
--          (ev, 'strike proof', 'child', 'hash-three', 'dismissed', now() - interval '179 days');
--   res := public.create_report(v_qr, b, 'proof', 'child', gen_random_uuid(), 'Three@Example.com', 'hash-three');
--   if (res->>'hid')::boolean then raise exception 'three live strikes hid: %', res; end if;
--   select count(*) into seen from public.reports
--    where id = (res->>'report_id')::uuid and status = 'open' and kind = 'child' and hid_at is null
--      and reporter_hash = 'hash-three' and reporter_email = 'three@example.com' and reporter_signed_in;
--   if seen <> 1 then raise exception 'the barred report was not filed as any other'; end if;
--   select status::text into v_status from public.media where id = b;
--   if v_status = 'removed' then raise exception 'B came down'; end if;
--   insert into proof (step, ok, detail) values ('2 a third strike bars', true, res::text);
-- exception when others then
--   insert into proof (step, ok, detail) values ('2 a third strike bars', false, sqlerrm);
-- end $$;
--
-- -- ── 3. a strike 181 days old no longer counts ──
-- do $$
-- declare ev uuid; v_qr text; c uuid; res jsonb; r3 uuid;
-- begin
--   select id, qr into ev, v_qr from fx where k = 'event'; select id into c from fx where k = 'C';
--   insert into public.reports (event_id, reason, kind, reporter_hash, status, resolved_at)
--   values (ev, 'strike proof', 'child', 'hash-lapse', 'dismissed', now() - interval '1 day'),
--          (ev, 'strike proof', 'child', 'hash-lapse', 'dismissed', now() - interval '90 days');
--   insert into public.reports (event_id, reason, kind, reporter_hash, status, resolved_at)
--   values (ev, 'strike proof', 'child', 'hash-lapse', 'dismissed', now() - interval '179 days')
--   returning id into r3;
--   res := public.create_report(v_qr, c, 'proof', 'child', gen_random_uuid(), 'lapse@example.com', 'hash-lapse');
--   if (res->>'hid')::boolean then raise exception 'a strike 179 days old did not count: %', res; end if;
--   update public.reports set resolved_at = now() - interval '181 days' where id = r3;
--   res := public.create_report(v_qr, c, 'proof', 'child', gen_random_uuid(), 'lapse@example.com', 'hash-lapse');
--   if not (res->>'hid')::boolean then raise exception 'a strike 181 days old still counted: %', res; end if;
--   insert into proof (step, ok, detail) values ('3 a strike 181 days old lapses', true, res::text);
-- exception when others then
--   insert into proof (step, ok, detail) values ('3 a strike 181 days old lapses', false, sqlerrm);
-- end $$;
--
-- -- ── 4. an undone dismissal no longer counts ──
-- do $$
-- declare ev uuid; v_qr text; d uuid; res jsonb; r1 uuid;
-- begin
--   select id, qr into ev, v_qr from fx where k = 'event'; select id into d from fx where k = 'D';
--   insert into public.reports (event_id, reason, kind, reporter_hash, status, resolved_at)
--   values (ev, 'strike proof', 'child', 'hash-undo', 'dismissed', now() - interval '2 days'),
--          (ev, 'strike proof', 'child', 'hash-undo', 'dismissed', now() - interval '3 days');
--   insert into public.reports (event_id, reason, kind, reporter_hash, status, resolved_at)
--   values (ev, 'strike proof', 'child', 'hash-undo', 'dismissed', now() - interval '1 day')
--   returning id into r1;
--   res := public.create_report(v_qr, d, 'proof', 'child', gen_random_uuid(), 'undo@example.com', 'hash-undo');
--   if (res->>'hid')::boolean then raise exception 'three live strikes hid: %', res; end if;
--   -- reopenReports' own write (the dismissal's Undo)
--   update public.reports set status = 'open', resolved_by = null, resolved_at = null, resolution_note = null
--    where id = r1 and status = 'dismissed';
--   res := public.create_report(v_qr, d, 'proof', 'child', gen_random_uuid(), 'undo@example.com', 'hash-undo');
--   if not (res->>'hid')::boolean then raise exception 'an undone dismissal still counted: %', res; end if;
--   insert into proof (step, ok, detail) values ('4 an undone dismissal lapses', true, res::text);
-- exception when others then
--   insert into proof (step, ok, detail) values ('4 an undone dismissal lapses', false, sqlerrm);
-- end $$;
--
-- -- ── 5. only a dismissed child-abuse report is a strike ──
-- do $$
-- declare ev uuid; v_qr text; e uuid; res jsonb;
-- begin
--   select id, qr into ev, v_qr from fx where k = 'event'; select id into e from fx where k = 'E';
--   insert into public.reports (event_id, reason, kind, reporter_hash, status, resolved_at)
--   values (ev, 'strike proof', 'child', 'hash-kinds', 'dismissed', now() - interval '1 day'),
--          (ev, 'strike proof', 'child', 'hash-kinds', 'dismissed', now() - interval '2 days'),
--          (ev, 'strike proof', 'child', 'hash-kinds', 'actioned', now() - interval '1 day'),
--          (ev, 'strike proof', 'child', 'hash-kinds', 'open', null),
--          (ev, 'strike proof', 'sexual', 'hash-kinds', 'dismissed', now() - interval '1 day');
--   res := public.create_report(v_qr, e, 'proof', 'child', gen_random_uuid(), 'kinds@example.com', 'hash-kinds');
--   if not (res->>'hid')::boolean then raise exception 'a report that is no strike counted: %', res; end if;
--   insert into proof (step, ok, detail) values ('5 only a dismissed child report strikes', true, res::text);
-- exception when others then
--   insert into proof (step, ok, detail) values ('5 only a dismissed child report strikes', false, sqlerrm);
-- end $$;
--
-- -- ── 6. the other limits hold (on B, still up): unconfirmed, the host, an album, a kind, and the two a day ──
-- do $$
-- declare ev uuid; v_qr text; host uuid; b uuid; res jsonb; i int;
-- begin
--   select id, qr into ev, v_qr from fx where k = 'event'; select id into host from fx where k = 'host';
--   select id into b from fx where k = 'B';
--   res := public.create_report(v_qr, b, null, 'child');
--   if (res->>'hid')::boolean then raise exception 'an unconfirmed report hid'; end if;
--   res := public.create_report(v_qr, b, null, 'child', host, 'host@example.com', 'hash-host');
--   if (res->>'hid')::boolean then raise exception 'the host triggered an operator''s removal'; end if;
--   res := public.create_report(v_qr, null, null, 'child', gen_random_uuid(), 'album@example.com', 'hash-album');
--   if (res->>'hid')::boolean then raise exception 'an album report hid'; end if;
--   res := public.create_report(v_qr, b, null, 'sexual', gen_random_uuid(), 'kind@example.com', 'hash-kind');
--   if (res->>'hid')::boolean then raise exception 'another kind hid'; end if;
--   -- the two a day, each alone: the proof's own four hides leave the event's window first
--   update public.reports set hid_at = null where event_id = ev and hid_at is not null;
--   for i in 1..3 loop
--     insert into public.reports (event_id, reason, kind, reporter_hash, hid_at)
--     values (ev, 'proof limit', 'child', 'hash-busy', now() - interval '1 hour');
--   end loop;
--   res := public.create_report(v_qr, b, null, 'child', gen_random_uuid(), 'busy@example.com', 'hash-busy');
--   if (res->>'hid')::boolean then raise exception 'a fourth hide from one address passed'; end if;
--   delete from public.reports where reason = 'proof limit';
--   for i in 1..5 loop
--     insert into public.reports (event_id, reason, kind, reporter_hash, hid_at)
--     values (ev, 'proof limit', 'child', 'hash-other-' || i, now() - interval '1 hour');
--   end loop;
--   res := public.create_report(v_qr, b, null, 'child', gen_random_uuid(), 'fresh@example.com', 'hash-fresh');
--   if (res->>'hid')::boolean then raise exception 'a sixth hide in one event passed'; end if;
--   delete from public.reports where reason = 'proof limit';
--   -- ...and with every limit clear, B does hide.
--   res := public.create_report(v_qr, b, null, 'child', gen_random_uuid(), 'clear@example.com', 'hash-clear');
--   if not (res->>'hid')::boolean then raise exception 'a clear address did not hide B: %', res; end if;
--   insert into proof (step, ok, detail) values ('6 the other limits hold', true, res::text);
-- exception when others then
--   insert into proof (step, ok, detail) values ('6 the other limits hold', false, sqlerrm);
-- end $$;
--
-- -- ── 7. the shape: one function, its signature, DEFINER, empty search_path, two locks, the one grant ──
-- do $$
-- declare f text := 'public.create_report(text, uuid, text, public.report_kind, uuid, text, text)';
--   p record; bad text := ''; n int;
-- begin
--   select count(*) into n from pg_proc pp join pg_namespace ns on ns.oid = pp.pronamespace
--    where ns.nspname = 'public' and pp.proname = 'create_report';
--   if n <> 1 then bad := bad || ' overloads:' || n; end if;
--   select pp.prosecdef, pp.proconfig, pp.proacl::text as acl, pp.prosrc, obj_description(pp.oid, 'pg_proc') as note
--     into p from pg_proc pp where pp.oid = f::regprocedure;
--   if not p.prosecdef then bad := bad || ' invoker'; end if;
--   if p.proconfig is distinct from array['search_path=""'] then bad := bad || ' search_path'; end if;
--   if p.acl <> '{postgres=X/postgres,service_role=X/postgres}' then bad := bad || ' acl:' || p.acl; end if;
--   if has_function_privilege('anon', f, 'execute') then bad := bad || ' anon'; end if;
--   if has_function_privilege('authenticated', f, 'execute') then bad := bad || ' authenticated'; end if;
--   if not has_function_privilege('service_role', f, 'execute') then bad := bad || ' lost-service_role'; end if;
--   if (select count(*) from regexp_matches(p.prosrc, 'pg_advisory_xact_lock', 'g')) <> 2 then bad := bad || ' locks'; end if;
--   if p.prosrc not like '%c_strike_lapse constant interval := interval ''180 days'';%' then bad := bad || ' lapse'; end if;
--   if p.note not like '%three strikes%' then bad := bad || ' comment'; end if;
--   if bad <> '' then raise exception 'shape:%', bad; end if;
--   insert into proof (step, ok, detail) values ('7 shape and grants', true,
--     'md5 ' || md5(regexp_replace(p.prosrc, '\s+', ' ', 'g')) || ', ' || p.acl);
-- exception when others then
--   insert into proof (step, ok, detail) values ('7 shape and grants', false, sqlerrm);
-- end $$;
