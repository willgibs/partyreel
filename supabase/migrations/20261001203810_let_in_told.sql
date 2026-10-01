-- =============================================================================================
-- TOLD ON HER RETURN: WHEN A DECISION LET AN UPLOAD IN, AND WHAT SHE HAS BEEN TOLD OF (lane `crumbs-38`; two ROADMAP
-- lines answered as one: "the approval toast's server half, so an upload approved after the visit that made it is
-- told on the next visit (the queue lives in memory)", and "the 'The host added your uploads' toast ends with the
-- visit ... the tracker's own-rows read (`/api/guests/mine` `{statuses: true}`) could carry it across a reload or a
-- return").
--
-- Why: the album's approval toast ("One of yours is in the album", with "Watch reel") reads this device's upload
-- queue, which lives in memory, so a held upload the host approves after she leaves is never told: not on a reload,
-- not on her return, not on her account's other device. Her tracker's own-rows read already says each upload is "In
-- the album"; what no row says is WHEN a decision let it in, or what she has been told of since.
--
-- WHAT CHANGES, two facts and the trigger that keeps one of them:
--   1. `media.let_in_at`: the moment a decision last let this upload INTO the album, stamped by
--      `media_stamp_let_in` on every update that moves `status` to 'approved' from anything else: a held upload
--      approved, a hidden one shown again, a removed one restored to approved (the provenance trigger lands a
--      restore on its remembered status first; this one reads the status it landed on). An upload approved as it
--      arrived (an album that does not hold uploads) never waited, and keeps null: it is never news. No backfill:
--      every row starts null, so nothing already decided becomes news when this lands.
--   2. `guests.let_in_told_at`: the newest `let_in_at` among that row's uploads that its guest has been told of,
--      written by the server alone (her tracker's own-rows read, `{statuses, tell}`, as it answers the news), so a
--      reload, a return and her account on another device are each told once. Per row because a person's rows at an
--      album are told together but read apart (her ticket's on one phone, her account's everywhere).
--
-- ★ NOTHING ELSE MOVES ON EITHER WRITE. The stamp rides the status update that already happens (a BEFORE trigger sets
-- the row's own column: no second write, no extra album version, no extra doorbell), and `let_in_told_at` is in no
-- album trigger's column list (`guests_album_note` watches display_name, verified_at, user_id and email), so telling
-- her moves no album's attribution version and wakes no viewer.
--
-- WHO MAY READ OR WRITE THEM: the service role alone. `media`'s client SELECT is column-scoped and this column joins
-- no grant (a host never reads it: `MEDIA_HOST_COLUMNS` is unchanged), `guests` is deny-all to every client role, and
-- the trigger function's EXECUTE is revoked from the client roles (it still fires: EXECUTE is checked when a trigger
-- is created, never when it fires; database-security.md). Advisors: no function joins 0028 or 0029.
--
-- SHAPE: two `add column`s (a second apply fails loudly rather than replacing), one new trigger function and its
-- trigger, BEFORE UPDATE OF status. BEFORE triggers fire in name order, and `media_stamp_let_in` sorts after every
-- one on media (`media_derive_removal_provenance`, `media_guard_privileged_transitions`, `media_set_purge_at`,
-- `media_set_updated_at`), so its WHEN reads the status the provenance trigger settled (a restore lands on its
-- remembered status), and a row the guard skips (a legal hold) never reaches it.
--
-- APPLY PROTOCOL (database-security.md -> Workflow):
--   (1) before: `select column_name from information_schema.columns where table_schema = 'public' and
--       ((table_name = 'media' and column_name = 'let_in_at') or (table_name = 'guests' and column_name =
--       'let_in_told_at'));` answers no rows, and media holds eight triggers (live 2026-10-01: media_album_note,
--       media_album_stamp, media_derive_removal_provenance, media_gallery_doorbell,
--       media_guard_privileged_transitions, media_release_meter, media_set_purge_at, media_set_updated_at);
--   (2) the rolled-back check at the foot, then apply verbatim; (3) the same read after (two rows), nine triggers
--       on media, and `pg_get_triggerdef` of media_stamp_let_in as step 5 of the check reads it;
--   (4) get_advisors, EXPECTED DELTA: NONE;
--   (5) regenerate src/lib/db/types.ts (media and guests each gain one column in Row, Insert and Update), then drop
--       the lane's typed seam named in its handoff (`untypedAdmin` in src/lib/db/mutations/guest-media.ts).
-- ★ EITHER ORDER IS SAFE: the build before this file never names either column; the build after it asks for them
-- only with `tell`, and reads a missing column as no news, captured (`let_in_schema_missing`), never as a failed
-- tracker.
-- =============================================================================================

-- ─── 1. When a decision let it in ─────────────────────────────────────────────────────────────
alter table public.media add column let_in_at timestamptz;

comment on column public.media.let_in_at is
  'The moment a decision last let this upload into the album (a held upload approved, a hidden one shown again, a removed one restored to approved), stamped by media_stamp_let_in; null for an upload approved as it arrived. The approval toast''s news (crumbs-38). Service role only.';

create function public.stamp_media_let_in()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- The trigger's WHEN already asked: this update moves the row INTO approved, from anything else, after the
  -- provenance trigger settled where a restore lands.
  new.let_in_at := now();
  return new;
end;
$$;

revoke execute on function public.stamp_media_let_in() from public, anon, authenticated;

comment on function public.stamp_media_let_in() is
  'Stamps media.let_in_at when an update moves a row into approved from another status (crumbs-38). A trigger function: no client role runs it.';

create trigger media_stamp_let_in
  before update of status on public.media
  for each row
  when (new.status = 'approved' and old.status is distinct from 'approved')
  execute function public.stamp_media_let_in();

-- ─── 2. What she has been told of ─────────────────────────────────────────────────────────────
alter table public.guests add column let_in_told_at timestamptz;

comment on column public.guests.let_in_told_at is
  'The newest media.let_in_at among this row''s uploads that its guest has been told of (her tracker''s own-rows read, {statuses, tell}, as it answers the news; crumbs-38). Null: told of nothing yet. Service role only.';

-- =============================================================================================
-- THE ROLLED-BACK CHECK. Proved on the live schema BEFORE applying: ONE execute_sql call of `begin;`, the block
-- below (uncommented) with this file's statements verbatim where it says so, and `select n, step, ok, detail from
-- proof order by n; rollback;`. Red first: the same block WITHOUT this file's statements, on today's schema, where
-- every step that names a column fails. It rides EXISTING rows: two approved guest uploads of the newest live event
-- that holds some, and their guest rows, moved through every transition inside the transaction (the album's own
-- deferred stamps never run: the transaction rolls back before its commit). Each step traps its own failure into
-- `proof`.
--
-- create temp table proof (n serial, step text, ok boolean, detail text) on commit drop;
-- create temp table fx (k text primary key, id uuid) on commit drop;
-- insert into fx
--   select 'event', e.id from public.events e
--    where e.deleted_at is null
--      and (select count(*) from public.media m where m.event_id = e.id and m.status = 'approved'
--             and m.guest_id is not null and m.legal_hold_at is null) >= 2
--    order by e.created_at desc limit 1;
-- insert into fx
--   select 'a', m.id from public.media m where m.event_id = (select id from fx where k = 'event')
--      and m.status = 'approved' and m.guest_id is not null and m.legal_hold_at is null
--    order by m.created_at desc limit 1;
-- insert into fx
--   select 'b', m.id from public.media m where m.event_id = (select id from fx where k = 'event')
--      and m.status = 'approved' and m.guest_id is not null and m.legal_hold_at is null
--      and m.id <> (select id from fx where k = 'a')
--    order by m.created_at desc limit 1;
-- insert into fx select 'guest', m.guest_id from public.media m where m.id = (select id from fx where k = 'a');
--
-- <this file's statements, verbatim>
--
-- -- ── 0. the columns stand (RED on today's schema) ──
-- do $$
-- declare n int;
-- begin
--   select count(*) into n from information_schema.columns
--    where table_schema = 'public'
--      and ((table_name = 'media' and column_name = 'let_in_at')
--        or (table_name = 'guests' and column_name = 'let_in_told_at'));
--   if n <> 2 then raise exception 'columns: % of 2', n; end if;
--   insert into proof (step, ok, detail) values ('0 the two columns', true, 'media.let_in_at, guests.let_in_told_at');
-- exception when others then
--   insert into proof (step, ok, detail) values ('0 the two columns', false, sqlerrm);
-- end $$;
--
-- -- ── 1. a held upload approved is stamped; an update that keeps it approved is not ──
-- do $$
-- declare a uuid; v timestamptz;
-- begin
--   select id into a from fx where k = 'a';
--   execute 'update public.media set status = ''pending'', let_in_at = null where id = $1' using a;
--   execute 'select let_in_at from public.media where id = $1' into v using a;
--   if v is not null then raise exception 'held: stamped %', v; end if;
--   update public.media set status = 'approved' where id = a;
--   execute 'select let_in_at from public.media where id = $1' into v using a;
--   if v is distinct from now() then raise exception 'approved: let_in_at %, expected now()', v; end if;
--   execute 'update public.media set let_in_at = null where id = $1' using a;
--   update public.media set status = 'approved' where id = a;
--   execute 'select let_in_at from public.media where id = $1' into v using a;
--   if v is not null then raise exception 'approved again from approved: stamped %', v; end if;
--   insert into proof (step, ok, detail) values ('1 pending to approved stamps', true, 'stamped now(); approved to approved untouched');
-- exception when others then
--   insert into proof (step, ok, detail) values ('1 pending to approved stamps', false, sqlerrm);
-- end $$;
--
-- -- ── 2. hidden to approved stamps; approved to hidden does not ──
-- do $$
-- declare b uuid; v timestamptz;
-- begin
--   select id into b from fx where k = 'b';
--   execute 'update public.media set let_in_at = null where id = $1' using b;
--   update public.media set status = 'hidden' where id = b;
--   execute 'select let_in_at from public.media where id = $1' into v using b;
--   if v is not null then raise exception 'hidden: stamped %', v; end if;
--   update public.media set status = 'approved' where id = b;
--   execute 'select let_in_at from public.media where id = $1' into v using b;
--   if v is null then raise exception 'shown again: not stamped'; end if;
--   insert into proof (step, ok, detail) values ('2 hidden to approved stamps', true, 'hiding untouched, showing again stamped');
-- exception when others then
--   insert into proof (step, ok, detail) values ('2 hidden to approved stamps', false, sqlerrm);
-- end $$;
--
-- -- ── 3. a restore stamps only where it lands in approved (the provenance trigger decides first) ──
-- do $$
-- declare a uuid; b uuid; v timestamptz; s text;
-- begin
--   select id into a from fx where k = 'a';
--   select id into b from fx where k = 'b';
--   -- a: approved -> removed -> asked back as approved, lands approved: stamped.
--   update public.media set status = 'removed', removed_at = now() where id = a;
--   execute 'update public.media set let_in_at = null where id = $1' using a;
--   update public.media set status = 'approved', removed_at = null where id = a;
--   execute 'select let_in_at, status::text from public.media where id = $1' into v, s using a;
--   if s <> 'approved' or v is null then raise exception 'restored approved: status %, let_in_at %', s, v; end if;
--   -- b: hidden -> removed -> asked back as approved, lands hidden (its remembered status): never stamped.
--   update public.media set status = 'hidden' where id = b;
--   update public.media set status = 'removed', removed_at = now() where id = b;
--   execute 'update public.media set let_in_at = null where id = $1' using b;
--   update public.media set status = 'approved', removed_at = null where id = b;
--   execute 'select let_in_at, status::text from public.media where id = $1' into v, s using b;
--   if s <> 'hidden' or v is not null then raise exception 'restored hidden: status %, let_in_at %', s, v; end if;
--   insert into proof (step, ok, detail) values ('3 a restore stamps where it lands', true, 'to approved stamped; to hidden not');
-- exception when others then
--   insert into proof (step, ok, detail) values ('3 a restore stamps where it lands', false, sqlerrm);
-- end $$;
--
-- -- ── 4. telling her moves no album: no attribution note, and the media rows untouched ──
-- do $$
-- declare g uuid; ev uuid; before_v text; after_v text; m_before timestamptz; m_after timestamptz;
-- begin
--   select id into g from fx where k = 'guest';
--   select id into ev from fx where k = 'event';
--   before_v := coalesce(current_setting('partyreel.album_t', true), '');
--   select max(updated_at) into m_before from public.media where guest_id = g;
--   execute 'update public.guests set let_in_told_at = now() where id = $1' using g;
--   after_v := coalesce(current_setting('partyreel.album_t', true), '');
--   select max(updated_at) into m_after from public.media where guest_id = g;
--   if after_v <> before_v and strpos(after_v, ev::text) > 0 and strpos(before_v, ev::text) = 0
--     then raise exception 'the told mark noted the album: %', after_v; end if;
--   if m_after is distinct from m_before then raise exception 'the told mark touched her uploads'; end if;
--   insert into proof (step, ok, detail) values ('4 telling moves no album', true, 'no attribution note, no media write');
-- exception when others then
--   insert into proof (step, ok, detail) values ('4 telling moves no album', false, sqlerrm);
-- end $$;
--
-- -- ── 5. who may read and run them ──
-- do $$
-- declare bad text := ''; t record; acl text;
-- begin
--   if has_column_privilege('authenticated', 'public.media', 'let_in_at', 'select')
--     or has_column_privilege('anon', 'public.media', 'let_in_at', 'select')
--     or has_column_privilege('authenticated', 'public.media', 'let_in_at', 'update')
--     then bad := bad || ' media-client'; end if;
--   if has_column_privilege('authenticated', 'public.guests', 'let_in_told_at', 'select')
--     or has_column_privilege('anon', 'public.guests', 'let_in_told_at', 'select')
--     or has_column_privilege('authenticated', 'public.guests', 'let_in_told_at', 'update')
--     then bad := bad || ' guests-client'; end if;
--   if not has_column_privilege('service_role', 'public.media', 'let_in_at', 'select')
--     or not has_column_privilege('service_role', 'public.guests', 'let_in_told_at', 'update')
--     then bad := bad || ' service-role-lost'; end if;
--   if has_function_privilege('authenticated', 'public.stamp_media_let_in()', 'execute')
--     or has_function_privilege('anon', 'public.stamp_media_let_in()', 'execute')
--     then bad := bad || ' trigger-fn-callable'; end if;
--   select pg_get_triggerdef(tg.oid) as def, tg.tgenabled into t from pg_trigger tg
--    where tg.tgrelid = 'public.media'::regclass and tg.tgname = 'media_stamp_let_in';
--   if t.def <> 'CREATE TRIGGER media_stamp_let_in BEFORE UPDATE OF status ON public.media FOR EACH ROW WHEN (((new.status = ''approved''::media_status) AND (old.status IS DISTINCT FROM ''approved''::media_status))) EXECUTE FUNCTION stamp_media_let_in()'
--     then bad := bad || ' trigger:' || t.def; end if;
--   if bad <> '' then raise exception 'grants:%', bad; end if;
--   insert into proof (step, ok, detail) values ('5 service role alone', true, t.def);
-- exception when others then
--   insert into proof (step, ok, detail) values ('5 service role alone', false, sqlerrm);
-- end $$;
--
-- RESULT, 2026-10-01, on the live schema, each run one execute_sql call, nothing persisted (afterwards neither
-- column, the trigger nor its function exists):
--   RED, without this file's statements: 0 to 5 fail (0 "columns: 0 of 2"; 1 to 3 and 5 "column "let_in_at" of
--     relation "media" does not exist"; 4 its guests twin).
--   GREEN, with them: 6/6. 0 both columns stand; 1 pending to approved stamps now(), approved to approved leaves it;
--     2 hiding leaves it, showing again stamps; 3 a restore that lands approved stamps, one that lands hidden (its
--     remembered status) does not; 4 the told mark notes no album and writes none of her uploads; 5 no client role
--     reads or writes either column or runs the function, the service role does, and the trigger reads back as
--     written: BEFORE UPDATE OF status, WHEN new.status = 'approved' AND old.status IS DISTINCT FROM 'approved'.
-- =============================================================================================
