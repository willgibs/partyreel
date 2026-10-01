-- =============================================================================================
-- THE INSTANT HIDE'S STRIKES, ONE HOME THAT TWO READERS ASK (lane `crumbs-33`; ROADMAP, a board idea from
-- `hide-strikes`).
--
-- Why: "nothing in the portal shows a strike", so the operator cannot know when a Dismiss is an address's third
-- and takes its instant hide away (Will's call B, 2026-09-30: three strikes, each lapsing 180 days after its
-- dismissal). The queue's line must count the strikes by the SAME rule `create_report` bars the hide by, never a
-- copy that can drift; until now the rule lived inline in create_report's body (20260930120000: `c_strikes`,
-- `c_strike_lapse` and the count), where nothing else could read it.
--
-- WHAT CHANGES, one fact moved and nothing decided anew:
--   1. `report_strikes(text[])` is the rule's one home: what a strike is (a child-abuse report from the address,
--      dismissed, `kind = 'child' and status = 'dismissed'`), how long one counts (`c_strike_lapse` after its
--      dismissal, `resolved_at`, read as the reports stand, so a dismissal's Undo takes its strike back), and how
--      many bar the hide (`c_strikes`). For each address hash asked it answers its live strikes, whether they bar
--      it, and the lapse instants of its newest `c_strikes` (newest first: the bar lifts when the c_strikes-th
--      newest lapses); with the rule's own bar and the instant a strike made now would lapse, so the portal can
--      say what a Dismiss would make of an address without holding either number itself. One jsonb, so no row cap.
--   2. `create_report` asks it whether the address is barred instead of counting inline. Its body is
--      20260930120000's (live's, md5-checked 2026-09-30: ee5079e8ebf56b253c878a0ce34435e9, whitespace collapsed)
--      with only the two constants and the count replaced by that one call; every other limit, the locks (taken
--      before the call, as before the count), the insert and the answer are unchanged.
--
-- WHO MAY CALL IT: the service role alone (the portal's read, behind requireAdmin and AAL2); EXECUTE revoked from
-- public, anon and authenticated. SECURITY INVOKER (database-security.md: a new read is INVOKER): the service role
-- reads the deny-all `reports` by its own grant, and create_report (DEFINER, owned by postgres) calls it as its
-- owner, who owns this function too. The address itself never leaves: the queue sends hashes and gets counts.
--
-- SHAPE: report_strikes is new (`create function`, so a second apply fails loudly rather than replacing a body);
-- create_report is `create or replace` with the same signature, return type, language, volatility, security mode
-- and empty search_path, so its ACL is kept, and both restate their grants as they stand live (2026-09-30:
-- {postgres=X/postgres,service_role=X/postgres}).
--
-- APPLY PROTOCOL (database-security.md -> Workflow):
--   (1) the bodies before, for the diff:
--         select p.oid::regprocedure, md5(regexp_replace(p.prosrc, '\s+', ' ', 'g')), p.proacl from pg_proc p
--           join pg_namespace n on n.oid = p.pronamespace
--          where n.nspname = 'public' and p.proname in ('create_report', 'report_strikes') order by 1;
--       (create_report ee5079e8ebf56b253c878a0ce34435e9, report_strikes absent);
--   (2) the rolled-back check at the foot, then apply verbatim; (3) the same read after (two rows, both ACLs
--       {postgres=X/postgres,service_role=X/postgres}); (4) get_advisors, EXPECTED DELTA: NONE (an INVOKER read
--       callable by the service role alone, a DEFINER body with the same grant: in neither 0028 nor 0029); (5)
--       regenerate src/lib/db/types.ts (report_strikes appears), then drop the lane's typed seam named in its
--       handoff (`readStrikes` in src/lib/db/queries/reports.ts).
-- ★ EITHER ORDER IS SAFE: the build before this file never asks report_strikes, and create_report's signature and
-- answer do not move; the build after it reads no strike line until the function stands (the seam reads a missing
-- function as no reading, never as no strikes).
-- =============================================================================================

-- ─── 1. The rule's one home ──────────────────────────────────────────────────────────────────
create function public.report_strikes(p_reporter_hashes text[])
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  -- ★ THREE STRIKES THAT LAPSE, the one home of the rule and both its numbers (Will, 2026-09-30): "I don't want
  -- to prevent a well-meaning reporter from a second report if I simply disagree with the first." A strike is a
  -- child-abuse report from the address that the operator dismissed; it counts until c_strike_lapse after its
  -- dismissal (`resolved_at`), and c_strikes live ones bar the instant hide (create_report asks `barred`).
  c_strikes constant integer := 3;
  c_strike_lapse constant interval := interval '180 days';
begin
  return (
    with asked as (
      select distinct x.hash
        from unnest(p_reporter_hashes) as x(hash)
       where x.hash is not null
    ),
    strike as (
      -- Read as the reports stand: a dismissal's Undo (status back to open, `resolved_at` cleared) is no strike.
      select r.reporter_hash as hash,
             r.resolved_at + c_strike_lapse as lapses_at,
             row_number() over (partition by r.reporter_hash order by r.resolved_at desc, r.id desc) as nth
        from public.reports r
        join asked a on a.hash = r.reporter_hash
       where r.kind = 'child' and r.status = 'dismissed' and r.resolved_at > now() - c_strike_lapse
    )
    select jsonb_build_object(
      'strikes', c_strikes,
      'fresh_lapses_at', now() + c_strike_lapse,
      'addresses', coalesce((
        select jsonb_object_agg(a.hash, jsonb_build_object(
                 'live', t.live,
                 'barred', t.live >= c_strikes,
                 'lapses', t.lapses))
          from asked a
          cross join lateral (
            select count(*)::integer as live,
                   coalesce(jsonb_agg(s.lapses_at order by s.nth) filter (where s.nth <= c_strikes),
                            '[]'::jsonb) as lapses
              from strike s
             where s.hash = a.hash
          ) t
      ), '{}'::jsonb)
    )
  );
end;
$$;

revoke all on function public.report_strikes(text[]) from public, anon, authenticated;
grant execute on function public.report_strikes(text[]) to service_role;

comment on function public.report_strikes(text[]) is
  'The instant hide''s strikes, the rule''s one home: for each reporter address hash asked, its live strikes (child-abuse reports from it that the operator dismissed in the last 180 days, by the dismissal''s own time), whether three bar its instant hide, and the lapse instants of its newest three, newest first; with the bar and the instant a strike made now would lapse. create_report asks it; the portal''s queue reads it. Service-role only; SECURITY INVOKER.';

-- ─── 2. create_report asks it ────────────────────────────────────────────────────────────────
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
      -- ★ an address holding three live strikes has lost the hide: the rule and both its numbers live once, in
      -- report_strikes, which the portal's queue reads too (a dismissal's Undo takes its strike back there)
      and not coalesce(
        (public.report_strikes(array[p_reporter_hash]) #>> array['addresses', p_reporter_hash, 'barred'])::boolean,
        false)
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
  'Files an album or item report (the qr_token is the capability). A child-abuse report of an item from a confirmed address hides the item at once as an operator''s removal (hid_at), never for the event''s host, an address holding three strikes (report_strikes: its child-abuse reports dismissed in the last 180 days, each lapsing 180 days after its dismissal), or past 3 an address and 5 an event in 24 hours. Answers {report_id, hid, event_id}. Service-role only: the route derives every reporter fact from getUser().';

-- =============================================================================================
-- THE ROLLED-BACK CHECK. Proved on the live schema BEFORE applying: ONE execute_sql call of `begin;`, this file's
-- statements verbatim, the block below (uncommented) and `select n, step, ok, detail from proof order by n;
-- rollback;`. It rides EXISTING rows (the newest live event with five items someone still sees, none held or
-- taken down, and no report in it) and writes only inside the transaction. Each strike it plants is dismissed at a
-- time of its own while its row is created now, so a count that read `created_at` instead of the dismissal's time
-- fails. Each step traps its own failure into `proof`, so one call reports them all:
--   1. report_strikes answers the rule: the bar (3), a fresh strike's lapse 180 days on, an unknown address at
--      none, nulls and repeats asked once;
--   2. only a dismissed child-abuse report inside its window is a strike, by its dismissal's time, and the
--      newest three lapses come back newest first;
--   3. three live strikes bar, and an undone dismissal no longer counts;
--   4. create_report reads the same bar as before: two live strikes hide (A); a third bars, its report filed as
--      any other (B); a strike 181 days old lapses (C); an undone dismissal lapses (D); only a dismissed
--      child-abuse report strikes (E);
--   5. the other limits hold (on B): unconfirmed, the event's own host, an album report and another kind hide
--      nothing; a fourth from one address and a sixth in one event in 24 hours hide nothing; clear, B hides;
--   6. the shape: each function once, its signature, report_strikes INVOKER and create_report DEFINER, both with
--      an empty search_path, EXECUTE for the service role alone, create_report's two locks and its one call, no
--      number or dismissal of its own left in its body.
--
-- Held on 2026-09-30 against the live schema (event 55bcdbe0-e350-46a6-849b-eb109c90c65d), red first: the block
-- alone, on today's schema, failed 1, 2, 3 and 6 ("function public.report_strikes(text[]) does not exist") and
-- passed 4 and 5 (today's bar answers the same). With this file's statements, every step ok:
--   1 the rule                          | {"strikes": 3, "addresses": {"hash-nobody": {"live": 0, "barred": false, "lapses": []}}, ...}
--   2 what is a strike                  | {"live": 2, "barred": false, "lapses": [179 days on, 1 day on]}
--   3 three bar, an Undo lapses         | four live barred, three lapses back; two undone, {"live": 2, "barred": false}
--   4 create_report reads the same bar  | A B C D E
--   5 the other limits hold             | B hides once every limit is clear
--   6 shape and grants                  | create_report md5 298f624bf9e93bd0248216660f74a3da, both {postgres=X/postgres,service_role=X/postgres}
-- and afterwards nothing persisted (25 reports and no proof row, no report_strikes, create_report back at
-- ee5079e8ebf56b253c878a0ce34435e9). First on a throwaway Postgres 17 cluster holding a stand-in of events, media
-- and reports with live's create_report: the same red and green, and five mutations of this file each failed its
-- own step (the bar at `>` instead of `>=`, any status a strike, the window read off `created_at`, create_report
-- ignoring the bar, an anon grant).
-- =============================================================================================
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
-- -- ── 1. the rule, as report_strikes answers it ──
-- do $$
-- declare v jsonb; v_bad text := '';
-- begin
--   v := public.report_strikes(array['hash-nobody', null, 'hash-nobody']);
--   if (v->>'strikes')::int <> 3 then v_bad := v_bad || ' bar:' || (v->>'strikes'); end if;
--   if abs(extract(epoch from ((v->>'fresh_lapses_at')::timestamptz - (now() + interval '180 days')))) > 1
--     then v_bad := v_bad || ' fresh:' || (v->>'fresh_lapses_at'); end if;
--   if (select count(*) from jsonb_object_keys(v->'addresses')) <> 1 then v_bad := v_bad || ' keys:' || (v->'addresses'); end if;
--   if v->'addresses'->'hash-nobody' <> '{"live": 0, "barred": false, "lapses": []}'::jsonb
--     then v_bad := v_bad || ' nobody:' || (v->'addresses'->'hash-nobody'); end if;
--   if public.report_strikes(null) <> jsonb_build_object('strikes', 3, 'fresh_lapses_at', now() + interval '180 days', 'addresses', '{}'::jsonb)
--     then v_bad := v_bad || ' null:' || public.report_strikes(null); end if;
--   if v_bad <> '' then raise exception 'rule:%', v_bad; end if;
--   insert into proof (step, ok, detail) values ('1 the rule', true, v::text);
-- exception when others then
--   insert into proof (step, ok, detail) values ('1 the rule', false, sqlerrm);
-- end $$;
--
-- -- ── 2. what is a strike, by the dismissal's own time, newest three first ──
-- do $$
-- declare ev uuid; v jsonb; a jsonb; v_bad text := '';
-- begin
--   select id into ev from fx where k = 'event';
--   insert into public.reports (event_id, reason, kind, reporter_hash, status, resolved_at)
--   values (ev, 'strike proof', 'child', 'hash-what', 'dismissed', now() - interval '1 day'),
--          (ev, 'strike proof', 'child', 'hash-what', 'dismissed', now() - interval '179 days'),
--          (ev, 'strike proof', 'child', 'hash-what', 'dismissed', now() - interval '181 days'),
--          (ev, 'strike proof', 'child', 'hash-what', 'actioned', now() - interval '1 day'),
--          (ev, 'strike proof', 'child', 'hash-what', 'open', null),
--          (ev, 'strike proof', 'sexual', 'hash-what', 'dismissed', now() - interval '1 day'),
--          (ev, 'strike proof', 'child', 'hash-other', 'dismissed', now() - interval '1 day');
--   v := public.report_strikes(array['hash-what']);
--   a := v->'addresses'->'hash-what';
--   if (a->>'live')::int <> 2 then v_bad := v_bad || ' live:' || (a->>'live'); end if;
--   if (a->>'barred')::boolean then v_bad := v_bad || ' barred'; end if;
--   if jsonb_array_length(a->'lapses') <> 2 then v_bad := v_bad || ' lapses:' || (a->'lapses'); end if;
--   if abs(extract(epoch from ((a->'lapses'->>0)::timestamptz - (now() + interval '179 days')))) > 1
--     or abs(extract(epoch from ((a->'lapses'->>1)::timestamptz - (now() + interval '1 day')))) > 1
--     then v_bad := v_bad || ' order:' || (a->'lapses'); end if;
--   if v->'addresses' ? 'hash-other' then v_bad := v_bad || ' unasked'; end if;
--   if v_bad <> '' then raise exception 'strike:%', v_bad; end if;
--   insert into proof (step, ok, detail) values ('2 what is a strike', true, a::text);
-- exception when others then
--   insert into proof (step, ok, detail) values ('2 what is a strike', false, sqlerrm);
-- end $$;
--
-- -- ── 3. three bar, at most three lapses come back, and an undone dismissal no longer counts ──
-- do $$
-- declare ev uuid; a jsonb; r1 uuid; v_bad text := '';
-- begin
--   select id into ev from fx where k = 'event';
--   insert into public.reports (event_id, reason, kind, reporter_hash, status, resolved_at)
--   values (ev, 'strike proof', 'child', 'hash-four', 'dismissed', now() - interval '2 days'),
--          (ev, 'strike proof', 'child', 'hash-four', 'dismissed', now() - interval '90 days'),
--          (ev, 'strike proof', 'child', 'hash-four', 'dismissed', now() - interval '179 days');
--   insert into public.reports (event_id, reason, kind, reporter_hash, status, resolved_at)
--   values (ev, 'strike proof', 'child', 'hash-four', 'dismissed', now() - interval '1 day') returning id into r1;
--   a := public.report_strikes(array['hash-four'])->'addresses'->'hash-four';
--   if (a->>'live')::int <> 4 or not (a->>'barred')::boolean then v_bad := v_bad || ' four:' || a; end if;
--   if jsonb_array_length(a->'lapses') <> 3
--     or abs(extract(epoch from ((a->'lapses'->>2)::timestamptz - (now() + interval '90 days')))) > 1
--     then v_bad := v_bad || ' newest-three:' || (a->'lapses'); end if;
--   -- reopenReports' own write (the dismissal's Undo), then the 2-day one undone too: two left, unbarred
--   update public.reports set status = 'open', resolved_by = null, resolved_at = null, resolution_note = null
--    where id = r1 and status = 'dismissed';
--   update public.reports set status = 'open', resolved_by = null, resolved_at = null, resolution_note = null
--    where reporter_hash = 'hash-four' and resolved_at < now() - interval '1 day' and resolved_at > now() - interval '3 days';
--   a := public.report_strikes(array['hash-four'])->'addresses'->'hash-four';
--   if (a->>'live')::int <> 2 or (a->>'barred')::boolean then v_bad := v_bad || ' undone:' || a; end if;
--   if v_bad <> '' then raise exception 'bar:%', v_bad; end if;
--   insert into proof (step, ok, detail) values ('3 three bar, an Undo lapses', true, a::text);
-- exception when others then
--   insert into proof (step, ok, detail) values ('3 three bar, an Undo lapses', false, sqlerrm);
-- end $$;
--
-- -- ── 4. create_report reads the same bar (20260930120000's steps 1 to 5, on its new body) ──
-- do $$
-- declare ev uuid; v_qr text; a uuid; b uuid; c uuid; d uuid; e uuid; res jsonb; r3 uuid; r1 uuid; v_bad text := '';
-- begin
--   select id, qr into ev, v_qr from fx where k = 'event';
--   select id into a from fx where k = 'A'; select id into b from fx where k = 'B'; select id into c from fx where k = 'C';
--   select id into d from fx where k = 'D'; select id into e from fx where k = 'E';
--   -- A: two live strikes still hide
--   insert into public.reports (event_id, reason, kind, reporter_hash, status, resolved_at)
--   values (ev, 'strike proof', 'child', 'hash-two', 'dismissed', now() - interval '1 day'),
--          (ev, 'strike proof', 'child', 'hash-two', 'dismissed', now() - interval '179 days');
--   res := public.create_report(v_qr, a, 'proof', 'child', gen_random_uuid(), 'two@example.com', 'hash-two');
--   if not (res->>'hid')::boolean then v_bad := v_bad || ' A:' || res; end if;
--   -- B: a third bars; the report is filed as any other, open and kept, the item still up
--   insert into public.reports (event_id, reason, kind, reporter_hash, status, resolved_at)
--   values (ev, 'strike proof', 'child', 'hash-three', 'dismissed', now() - interval '1 day'),
--          (ev, 'strike proof', 'child', 'hash-three', 'dismissed', now() - interval '90 days'),
--          (ev, 'strike proof', 'child', 'hash-three', 'dismissed', now() - interval '179 days');
--   res := public.create_report(v_qr, b, 'proof', 'child', gen_random_uuid(), 'Three@Example.com', 'hash-three');
--   if (res->>'hid')::boolean then v_bad := v_bad || ' B-hid'; end if;
--   if (select count(*) from public.reports where id = (res->>'report_id')::uuid and status = 'open' and kind = 'child'
--         and hid_at is null and reporter_hash = 'hash-three' and reporter_email = 'three@example.com') <> 1
--     then v_bad := v_bad || ' B-filed'; end if;
--   if (select status::text from public.media where id = b) = 'removed' then v_bad := v_bad || ' B-down'; end if;
--   -- C: a strike 181 days old no longer counts
--   insert into public.reports (event_id, reason, kind, reporter_hash, status, resolved_at)
--   values (ev, 'strike proof', 'child', 'hash-lapse', 'dismissed', now() - interval '1 day'),
--          (ev, 'strike proof', 'child', 'hash-lapse', 'dismissed', now() - interval '90 days');
--   insert into public.reports (event_id, reason, kind, reporter_hash, status, resolved_at)
--   values (ev, 'strike proof', 'child', 'hash-lapse', 'dismissed', now() - interval '179 days') returning id into r3;
--   res := public.create_report(v_qr, c, 'proof', 'child', gen_random_uuid(), 'lapse@example.com', 'hash-lapse');
--   if (res->>'hid')::boolean then v_bad := v_bad || ' C-179'; end if;
--   update public.reports set resolved_at = now() - interval '181 days' where id = r3;
--   res := public.create_report(v_qr, c, 'proof', 'child', gen_random_uuid(), 'lapse@example.com', 'hash-lapse');
--   if not (res->>'hid')::boolean then v_bad := v_bad || ' C-181:' || res; end if;
--   -- D: an undone dismissal no longer counts
--   insert into public.reports (event_id, reason, kind, reporter_hash, status, resolved_at)
--   values (ev, 'strike proof', 'child', 'hash-undo', 'dismissed', now() - interval '2 days'),
--          (ev, 'strike proof', 'child', 'hash-undo', 'dismissed', now() - interval '3 days');
--   insert into public.reports (event_id, reason, kind, reporter_hash, status, resolved_at)
--   values (ev, 'strike proof', 'child', 'hash-undo', 'dismissed', now() - interval '1 day') returning id into r1;
--   res := public.create_report(v_qr, d, 'proof', 'child', gen_random_uuid(), 'undo@example.com', 'hash-undo');
--   if (res->>'hid')::boolean then v_bad := v_bad || ' D-three'; end if;
--   update public.reports set status = 'open', resolved_by = null, resolved_at = null, resolution_note = null
--    where id = r1 and status = 'dismissed';
--   res := public.create_report(v_qr, d, 'proof', 'child', gen_random_uuid(), 'undo@example.com', 'hash-undo');
--   if not (res->>'hid')::boolean then v_bad := v_bad || ' D-undone:' || res; end if;
--   -- E: only a dismissed child-abuse report is a strike
--   insert into public.reports (event_id, reason, kind, reporter_hash, status, resolved_at)
--   values (ev, 'strike proof', 'child', 'hash-kinds', 'dismissed', now() - interval '1 day'),
--          (ev, 'strike proof', 'child', 'hash-kinds', 'dismissed', now() - interval '2 days'),
--          (ev, 'strike proof', 'child', 'hash-kinds', 'actioned', now() - interval '1 day'),
--          (ev, 'strike proof', 'child', 'hash-kinds', 'open', null),
--          (ev, 'strike proof', 'sexual', 'hash-kinds', 'dismissed', now() - interval '1 day');
--   res := public.create_report(v_qr, e, 'proof', 'child', gen_random_uuid(), 'kinds@example.com', 'hash-kinds');
--   if not (res->>'hid')::boolean then v_bad := v_bad || ' E:' || res; end if;
--   if v_bad <> '' then raise exception 'bar:%', v_bad; end if;
--   insert into proof (step, ok, detail) values ('4 create_report reads the same bar', true, 'A B C D E');
-- exception when others then
--   insert into proof (step, ok, detail) values ('4 create_report reads the same bar', false, sqlerrm);
-- end $$;
--
-- -- ── 5. the other limits hold (on B, still up) ──
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
--   res := public.create_report(v_qr, b, null, 'child', gen_random_uuid(), 'clear@example.com', 'hash-clear');
--   if not (res->>'hid')::boolean then raise exception 'a clear address did not hide B: %', res; end if;
--   insert into proof (step, ok, detail) values ('5 the other limits hold', true, res::text);
-- exception when others then
--   insert into proof (step, ok, detail) values ('5 the other limits hold', false, sqlerrm);
-- end $$;
--
-- -- ── 6. the shape ──
-- do $$
-- declare
--   f_report text := 'public.create_report(text, uuid, text, public.report_kind, uuid, text, text)';
--   f_strikes text := 'public.report_strikes(text[])';
--   p record; s record; bad text := ''; n int;
-- begin
--   select count(*) into n from pg_proc pp join pg_namespace ns on ns.oid = pp.pronamespace
--    where ns.nspname = 'public' and pp.proname in ('create_report', 'report_strikes');
--   if n <> 2 then bad := bad || ' overloads:' || n; end if;
--   select pp.prosecdef, pp.proconfig, pp.proacl::text as acl, pp.prosrc, obj_description(pp.oid, 'pg_proc') as note
--     into p from pg_proc pp where pp.oid = f_report::regprocedure;
--   select pp.prosecdef, pp.proconfig, pp.proacl::text as acl, pp.provolatile, pp.prorettype::regtype::text as ret
--     into s from pg_proc pp where pp.oid = f_strikes::regprocedure;
--   if not p.prosecdef then bad := bad || ' report-invoker'; end if;
--   if s.prosecdef then bad := bad || ' strikes-definer'; end if;
--   if s.provolatile <> 's' or s.ret <> 'jsonb' then bad := bad || ' strikes-kind'; end if;
--   if p.proconfig is distinct from array['search_path=""'] or s.proconfig is distinct from array['search_path=""']
--     then bad := bad || ' search_path'; end if;
--   if p.acl <> '{postgres=X/postgres,service_role=X/postgres}' then bad := bad || ' report-acl:' || p.acl; end if;
--   if s.acl <> '{postgres=X/postgres,service_role=X/postgres}' then bad := bad || ' strikes-acl:' || s.acl; end if;
--   if has_function_privilege('anon', f_strikes, 'execute') or has_function_privilege('authenticated', f_strikes, 'execute')
--     or has_function_privilege('anon', f_report, 'execute') or has_function_privilege('authenticated', f_report, 'execute')
--     then bad := bad || ' client-callable'; end if;
--   if not has_function_privilege('service_role', f_strikes, 'execute') then bad := bad || ' strikes-lost-service_role'; end if;
--   if (select count(*) from regexp_matches(p.prosrc, 'pg_advisory_xact_lock', 'g')) <> 2 then bad := bad || ' locks'; end if;
--   if (select count(*) from regexp_matches(p.prosrc, 'public\.report_strikes\(', 'g')) <> 1 then bad := bad || ' call'; end if;
--   if p.prosrc ~ '180|dismissed|c_strike' then bad := bad || ' report-keeps-a-rule'; end if;
--   if p.note not like '%report_strikes%' then bad := bad || ' comment'; end if;
--   if bad <> '' then raise exception 'shape:%', bad; end if;
--   insert into proof (step, ok, detail) values ('6 shape and grants', true,
--     'create_report md5 ' || md5(regexp_replace(p.prosrc, '\s+', ' ', 'g')) || ', ' || p.acl || '; report_strikes ' || s.acl);
-- exception when others then
--   insert into proof (step, ok, detail) values ('6 shape and grants', false, sqlerrm);
-- end $$;
