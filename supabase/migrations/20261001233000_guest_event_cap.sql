-- =============================================================================================
-- THE HOST'S OWN CAP REACHES THE GUEST'S UPLOAD SHEET (lane `crumbs-43`; ROADMAP: "`get_event_by_qr_token` does not
-- return `events.max_upload_bytes`, so the upload sheet's terms line states the product's limits rather than the
-- host's own cap; add the column (with the types and `queries/guest-events.ts`) and `uploadTermsLine`'s `capBytes`
-- seam takes it").
--
-- Why: a host may set a stricter per-file cap for guests (`events.max_upload_bytes`, 25 MiB to 10 GiB, the host's own
-- uploads exempt), and the presign refuses a bigger file in the host's number ("Files for this event are capped at
-- 100 MB."), but the Add sheet's one quiet line, the only place a guest reads a limit BEFORE the picker, said the
-- product's 10 GB ceiling, because the album's read never carried the host's. A guest learned the real cap only from
-- a refusal, after the bytes had started.
--
-- WHAT CHANGES, one column at the end of the album's read and nothing else:
--   `get_event_by_qr_token(p_qr_token)` returns `max_upload_bytes bigint` LAST: the event's own cap, null where the
--   host set none (the universal ceiling applies). Carried from 20260929120000 verbatim (the live body, md5-checked
--   2026-10-01: 7ddab5f2a4e84c7cf788a35e2c5a7f43 raw, 232148081976ff63b5100ca8b1f22858 whitespace-collapsed, both the
--   file's own), the one change the column: the sneaky block's lateral, the redaction, the slug lookup and
--   `limit 1` stand as they were. It says nothing a presign would not (the presign's refusal names the same number)
--   and comes back unredacted, a presentation setting like `accepting_uploads` and `accepts_video`
--   (database-security.md, "An anon read never discloses more than the page it backs").
--
-- WHO MAY CALL IT: unchanged. One of the accepted 0028 anon capability reads (the token is the authorization), so the
-- whole ACL is restated to the four holders live reads (2026-10-01: {postgres=X/postgres,anon=X/postgres,
-- authenticated=X/postgres,service_role=X/postgres}): PUBLIC revoked by name (a fresh CREATE re-inherits it), anon,
-- authenticated and service_role granted. The same four after, printed with the service role's default grant first
-- ({postgres=X/postgres,service_role=X/postgres,anon=X/postgres,authenticated=X/postgres}, as crumbs-38's drop and
-- create read), so the check compares the holders, never the print order.
--
-- SHAPE: a RETURNS TABLE grows, so this is DROP + CREATE (database-security.md: "changing one is DROP + CREATE,
-- which drops the grants"). The column is LAST, as `reel_hold_sec` and `accepts_video` were, so the deployed build,
-- which names its columns, reads every one of them where it reads them today and simply ignores the new one.
--
-- APPLY PROTOCOL (database-security.md -> Workflow):
--   (1) drift, read-only: `select p.oid::regprocedure, md5(p.prosrc), md5(regexp_replace(p.prosrc, '\s+', ' ',
--       'g')), p.proacl from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and
--       p.proname = 'get_event_by_qr_token';` answers one row, the hashes and ACL above;
--   (2) the rolled-back check at the foot, then apply verbatim; (3) the same read after: one row, the same four
--       holders, md5(prosrc) 024a2e476715c354436de3fa5708f30f raw, 27fa8ec22775185bc1b6dd1b750e12ff collapsed (this
--       file's body, hashed locally and read back inside the check);
--   (4) get_advisors, EXPECTED DELTA: NONE (0028 and 0029 keep get_event_by_qr_token, its grants exactly as before);
--   (5) regenerate src/lib/db/types.ts (`get_event_by_qr_token`'s Returns gains `max_upload_bytes: number`), then drop
--       the lane's typed seam named in its handoff (`hostCapOf` in src/lib/db/queries/guest-events.ts).
-- ★ EITHER ORDER IS SAFE: the build before this file never names the column; the build after it reads it through the
-- seam, which answers an absent column as no cap (the universal ceiling, today's line).
-- =============================================================================================

drop function public.get_event_by_qr_token(text);
create function public.get_event_by_qr_token(p_qr_token text)
 returns table(
    id uuid, name text, description text, moderation_mode public.moderation_mode,
    visibility public.event_visibility, has_password boolean, accepting_uploads boolean,
    require_verified_email boolean, require_upload_to_view boolean,
    event_date date, qr_style text, qr_token text, custom_slug text, host_display_name text,
    show_reel boolean, reel_style_id text, reel_hold_sec numeric, accepts_video boolean,
    max_upload_bytes bigint)
  language sql
  stable security definer
  set search_path to ''
as $function$
  select e.id,
         case when r.hide_name then null else e.name end,
         case when r.hide_meta then null else e.description end,
         e.moderation_mode, v.visibility,
         (e.event_password_hash is not null),
         e.accepting_uploads, e.require_verified_email, e.require_upload_to_view,
         case when r.hide_meta then null else e.event_date end,
         e.qr_style,
         e.qr_token,
         case when r.hide_meta then null else e.custom_slug end,
         case when r.hide_meta then null else p.display_name end,
         e.show_reel, e.reel_style_id, e.reel_hold_sec,
         (e.allow_videos and coalesce(p.tier <> 'free', false)),
         e.max_upload_bytes
  from public.events e
  left join public.profiles p on p.id = e.host_id
  -- ★ THE SNEAKY BLOCK (20260928120000): the event AS THIS CALLER SEES IT. To an account (or the
  -- address it confirmed) this event blocked, it is private, and everything below reads that: the
  -- private album's redaction, and the private branch of every caller, in the same words and the same
  -- time as a private album, because it is one query whoever asks. The host is never blocked from
  -- their own event, and a signed-out caller has no account to hold.
  cross join lateral (
    select case
             when e.host_id is distinct from (select auth.uid())
              and public.event_block_holds_account(e.id, (select auth.uid()))
             then 'private'::public.event_visibility
             else e.visibility
           end as visibility
  ) v
  cross join lateral (
    select
      (v.visibility <> 'open'
        and e.host_id is distinct from (select auth.uid())) as hide_meta,
      (v.visibility  = 'private'
        and e.host_id is distinct from (select auth.uid())) as hide_name
  ) r
  where e.deleted_at is null
    and (e.qr_token = p_qr_token
         or (e.custom_slug is not null and lower(e.custom_slug) = lower(p_qr_token)))
  order by (e.qr_token = p_qr_token) desc
  limit 1;
$function$;

-- The whole ACL, as live reads it (the header): exactly the three roles that call it, PUBLIC revoked by name.
revoke all on function public.get_event_by_qr_token(text) from public;
grant execute on function public.get_event_by_qr_token(text) to anon, authenticated, service_role;

-- =============================================================================================
-- THE ROLLED-BACK CHECK. Proved on the live schema BEFORE applying: ONE execute_sql call of `begin;`, the block
-- below (uncommented) with this file's statements verbatim where it says so, and `select n, step, ok, detail from
-- proof order by n; rollback;`. Red first: the same block WITHOUT this file's statements, on today's schema. It
-- rides EXISTING events: the read of each kind (an open one, a private one, a password one, and one by its custom
-- slug where any has one) is taken BEFORE the file's statements, as the deployed build reads it, so the read after
-- can be compared with it column for column; and one open event's cap is set, then cleared, inside the
-- transaction. Each step traps its own failure into `proof`.
--
-- create temp table proof (n serial, step text, ok boolean, detail text) on commit drop;
-- create temp table fx (k text primary key, id uuid, token text) on commit drop;
-- insert into fx select 'open', e.id, e.qr_token from public.events e
--   where e.deleted_at is null and e.visibility = 'open' order by e.created_at desc limit 1;
-- insert into fx select 'private', e.id, e.qr_token from public.events e
--   where e.deleted_at is null and e.visibility = 'private' order by e.created_at desc limit 1;
-- insert into fx select 'password', e.id, e.qr_token from public.events e
--   where e.deleted_at is null and e.visibility = 'password' order by e.created_at desc limit 1;
-- insert into fx select 'slug', e.id, upper(e.custom_slug) from public.events e
--   where e.deleted_at is null and e.custom_slug is not null order by e.created_at desc limit 1;
-- create temp table before_read (kind text primary key, was_read jsonb) on commit drop;
-- insert into before_read select f.k, to_jsonb(t) from fx f
--   cross join lateral public.get_event_by_qr_token(f.token) t;
--
-- <this file's statements, verbatim>
--
-- -- ── 0. the column is the read's last (RED on today's schema) ──
-- do $$
-- declare res text;
-- begin
--   select pg_get_function_result('public.get_event_by_qr_token(text)'::regprocedure) into res;
--   if res <> 'TABLE(id uuid, name text, description text, moderation_mode moderation_mode, visibility event_visibility, has_password boolean, accepting_uploads boolean, require_verified_email boolean, require_upload_to_view boolean, event_date date, qr_style text, qr_token text, custom_slug text, host_display_name text, show_reel boolean, reel_style_id text, reel_hold_sec numeric, accepts_video boolean, max_upload_bytes bigint)'
--     then raise exception 'result: %', res; end if;
--   insert into proof (step, ok, detail) values ('0 the column, last', true, res);
-- exception when others then
--   insert into proof (step, ok, detail) values ('0 the column, last', false, sqlerrm);
-- end $$;
--
-- -- ── 1. the event's own cap, and null where the host set none (RED today: no such column) ──
-- do $$
-- declare ev uuid; tok text; v bigint;
-- begin
--   select id, token into ev, tok from fx where k = 'open';
--   update public.events set max_upload_bytes = 104857600 where id = ev;
--   execute 'select max_upload_bytes from public.get_event_by_qr_token($1)' into v using tok;
--   if v is distinct from 104857600 then raise exception 'set: %', v; end if;
--   update public.events set max_upload_bytes = null where id = ev;
--   execute 'select max_upload_bytes from public.get_event_by_qr_token($1)' into v using tok;
--   if v is not null then raise exception 'cleared: %', v; end if;
--   insert into proof (step, ok, detail) values ('1 the host''s cap', true, '100 MiB read back, then null');
-- exception when others then
--   insert into proof (step, ok, detail) values ('1 the host''s cap', false, sqlerrm);
-- end $$;
--
-- -- ── 2. everything else reads as the deployed build reads it, every kind of door and the slug ──
-- do $$
-- declare bad text := ''; which text; was jsonb; read_now jsonb;
-- begin
--   for which, was in select b.kind, b.was_read from before_read b loop
--     select to_jsonb(t) - 'max_upload_bytes' into read_now from fx f
--       cross join lateral public.get_event_by_qr_token(f.token) t where f.k = which;
--     if read_now is distinct from was then bad := bad || ' ' || which; end if;
--   end loop;
--   if bad <> '' then raise exception 'changed:%', bad; end if;
--   insert into proof (step, ok, detail) values ('2 the rest unchanged', true,
--     (select string_agg(b.kind, ', ' order by b.kind) from before_read b));
-- exception when others then
--   insert into proof (step, ok, detail) values ('2 the rest unchanged', false, sqlerrm);
-- end $$;
--
-- -- ── 3. the same four holders as before, PUBLIC none of them ──
-- do $$
-- declare holders text;
-- begin
--   select string_agg(coalesce(r.rolname, 'PUBLIC') || ':' || a.privilege_type, ','
--                     order by coalesce(r.rolname, 'PUBLIC'), a.privilege_type) into holders
--     from pg_proc p cross join lateral aclexplode(p.proacl) a left join pg_roles r on r.oid = a.grantee
--    where p.oid = 'public.get_event_by_qr_token(text)'::regprocedure;
--   if holders <> 'anon:EXECUTE,authenticated:EXECUTE,postgres:EXECUTE,service_role:EXECUTE'
--     then raise exception 'holders: %', holders; end if;
--   insert into proof (step, ok, detail) values ('3 the grants', true, holders);
-- exception when others then
--   insert into proof (step, ok, detail) values ('3 the grants', false, sqlerrm);
-- end $$;
--
-- -- ── 4. the body is this file's ──
-- insert into proof (step, ok, detail)
--   select '4 the body''s hash', md5(p.prosrc) = '024a2e476715c354436de3fa5708f30f', md5(p.prosrc)
--     from pg_proc p where p.oid = 'public.get_event_by_qr_token(text)'::regprocedure;
--
-- RESULT, 2026-10-01, on the live schema, each run one execute_sql call, nothing persisted (afterwards the live body
-- still hashes 7ddab5f2a4e84c7cf788a35e2c5a7f43, its ACL as before, and its result names no max_upload_bytes):
--   RED, without this file's statements: 0, 1 and 4 fail (0 the result ends at `accepts_video boolean`; 1 "column
--     "max_upload_bytes" does not exist"; 4 the body reads 7ddab5f2a4e84c7cf788a35e2c5a7f43); 2 and 3 hold, as today.
--   GREEN, with them: 5/5. 0 `max_upload_bytes bigint` is the result's last column; 1 an open event's 100 MiB cap
--     reads back, then null once cleared; 2 every other column reads as the deployed build reads it, for an open
--     event, a password one and one found by its custom slug (no undeleted private event stood that day); 3 the four
--     holders anon, authenticated, postgres and service_role, PUBLIC none; 4 the body hashes
--     024a2e476715c354436de3fa5708f30f, this file's.
-- =============================================================================================
