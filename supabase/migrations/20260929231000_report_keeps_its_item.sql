-- =============================================================================================
-- WHAT A REPORT NAMED OUTLIVES ITS ITEM'S ROW (lane `crumbs-21`, triage-r2's find).
--
-- The finding: `reports.media_id` was `on delete set null`, so once a reported photo was purged (a
-- removal's window ending, an uploader's withdrawal, a host's Delete permanently, each after its report
-- closed) the report forgot which item it named and read as an ALBUM report: the operator's All read it
-- as one, and a dismissal reopened by its Undo came back as one, where kept_media_ids reads an open
-- album report as keeping every item of its album from every permanent delete (and a verdict on it would
-- act on the album). What a report said it was about is the report's own record, the reason beside it.
--
-- ★ THE RULE: A REPORT KEEPS WHICH ITEM IT NAMED, AND THAT IT WAS A PHOTO OR A VIDEO, FOR AS LONG AS THE
-- REPORT ITSELF LIVES, and nothing more: an id and a kind, never the keys, the bytes, the forensic row or
-- anything the purge exists to remove (they go with the row, as before). So:
--   * `media_id` stops being a foreign key: the purge leaves it as it was written. What the key did at
--     insert (refuse an item that does not exist) moves to the trigger below, and create_report already
--     refuses an item of another album.
--   * `media_type` (public.media_type) records the kind, written from the item itself as the report is
--     filed (the trigger reads it; a caller never passes it), backfilled for every report whose item
--     still stands, and paired with `media_id` by a CHECK: an item report always says what it named.
--   * An album report is still `media_id is null`, and every reader that tells the two apart already
--     reads that column (subjectOf, entryKeyOf, readEntry, kept_media_ids), so each now tells a report
--     about a deleted item from one about its album with no change. kept_media_ids keeps nothing for a
--     gone id (there is no row to keep), which is what a purged item's open report should keep.
--   * The index on `media_id` stays: every "is this item under an open report" question reads it.
--   * A report still leaves with its album (`event_id` stays ON DELETE CASCADE).
--
-- ★ AN EXPAND: nothing deployed reads `media_type`, and a report the deployed build files gets it from
-- the trigger. The deployed build meets a report whose item is gone as it met an unknown item before (no
-- media row: the closed line's plain square); this lane's build reads it as an item since deleted, its
-- kind read through a seam that answers "unknown" until this file is applied.
--
-- APPLY PROTOCOL (database-security.md -> Workflow):
--   (1) Drift, read-only: the constraint and the trigger stand as below, and neither new object exists:
--         select conname, pg_get_constraintdef(oid) from pg_constraint
--          where conrelid = 'public.reports'::regclass and conname in ('reports_media_id_fkey', 'reports_media_type_named');
--           -- reports_media_id_fkey  FOREIGN KEY (media_id) REFERENCES media(id) ON DELETE SET NULL (2026-09-29)
--         select tgname from pg_trigger where tgrelid = 'public.reports'::regclass and not tgisinternal;
--           -- reports_forget_reporter, reports_set_updated_at (2026-09-29)
--   (2) The rolled-back check at the foot, on the live schema BEFORE the apply, then apply verbatim.
--       The first query then reads only reports_media_type_named, CHECK (((media_id IS NULL) = (media_type
--       IS NULL))); the second adds reports_name_item; and
--         select md5(prosrc), proacl from pg_proc where oid = 'public.reports_name_item()'::regprocedure;
--       reads 59033191dea8ef71faa934e40727475e with {postgres, service_role}.
--   (3) get_advisors (security). EXPECTED DELTA: none (a trigger's function no client role runs; reports
--       stays deny-all, its RLS and grants untouched).
--   (4) Regenerate src/lib/db/types.ts: reports gains `media_type` and loses its `media` relationship.
--       The lane reads the column through a seam (src/lib/db/queries/reports.ts, `readNamedKinds`), so it
--       compiles on either side of the regeneration.
-- =============================================================================================

-- =============================================================================================
-- 1. The kind, backfilled from every item that still stands.
-- =============================================================================================
alter table public.reports add column media_type public.media_type;

comment on column public.reports.media_type is
  'Whether the item this report names was a photo or a video, written from the item as the report is filed (reports_name_item) and kept after the item''s row is purged, beside media_id. Null for an album or a person report.';

-- ★ A backfill fires no trigger that writes another column (database-security.md): reports_set_updated_at
-- would stamp every row's updated_at, so it is off for the one statement and on again after it.
-- reports_forget_reporter writes only a closed row's address and answer link, which its CHECK already
-- holds empty, so it writes nothing here.
alter table public.reports disable trigger reports_set_updated_at;
update public.reports r
   set media_type = m.type
  from public.media m
 where m.id = r.media_id
   and r.media_type is null;
alter table public.reports enable trigger reports_set_updated_at;

-- An item report always says what it named; an album or person report names no kind.
alter table public.reports
  add constraint reports_media_type_named check ((media_id is null) = (media_type is null));

-- =============================================================================================
-- 2. The item's id outlives its row.
-- =============================================================================================
alter table public.reports drop constraint reports_media_id_fkey;

comment on column public.reports.media_id is
  'The item this report names, or null for an album or person report. Not a foreign key since 20260929231000: a purge leaves it, so the report keeps saying which item it was about (with media_type) after the row is gone; reports_name_item refuses an id that names no item when the report is filed.';

-- =============================================================================================
-- 3. What the key checked at insert, and the kind beside it.
-- =============================================================================================
-- The kind is read from the item itself, never a caller's word, and it moves only with the item named: an
-- update that leaves media_id as it was keeps the kind as it was (so a report whose item is gone can still
-- be closed, reopened and noted, and nothing can re-kind it). An id that names no item is refused as the
-- key refused it (23503).
create function public.reports_name_item()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and new.media_id is not distinct from old.media_id then
    new.media_type := old.media_type;
    return new;
  end if;
  if new.media_id is null then
    new.media_type := null;
    return new;
  end if;
  select m.type into new.media_type from public.media m where m.id = new.media_id;
  if not found then
    raise exception 'A report names an item that does not exist.' using errcode = 'foreign_key_violation';
  end if;
  return new;
end;
$$;

revoke execute on function public.reports_name_item() from public, anon, authenticated;

comment on function public.reports_name_item() is
  'Writes reports.media_type from the item a report names as it is filed (or re-pointed), keeps it as it was on any other update, and refuses an id that names no item, the insert-time half of the foreign key it replaced. No client role runs it.';

create trigger reports_name_item
  before insert or update of media_id, media_type on public.reports
  for each row execute function public.reports_name_item();

-- =============================================================================================
-- THE ROLLED-BACK CHECK. Proved on the live schema BEFORE applying (database-security.md, "An
-- unapplied migration is proved on the live schema"): ONE execute_sql call of `begin;`, then the
-- fingerprint of what the backfill must not touch,
--   create temp table named_proof (step text, ok boolean, detail text);
--   create temp table before_fp as
--     select md5(coalesce(string_agg(id::text || updated_at::text || status::text || coalesce(media_id::text, '')
--                  || coalesce(reporter_email, '') || coalesce(proof_token_hash, ''), ',' order by id), '')) as fp,
--            count(*) filter (where media_id is not null) as items
--       from public.reports;
-- then this file's statements, the block below, `select step, ok, detail from named_proof;` and
-- `rollback;`. The block traps its own failure into the proof table, so the rollback always runs. It
-- rides EXISTING rows: the newest live event holding an approved photo and an approved video.
--
-- Held on 2026-09-29 against the live schema, red first: the same filing, purge and reopen against today's
-- schema answered "after the purge the photo report names nothing: it reads as an album report" and, once
-- reopened, "the album's other item read kept {} before the reopen and {180d4048-..} after it" (the
-- whole album frozen out of every permanent delete). With this file's statements (afterwards reports had
-- no media_type, its foreign key stood, no reports_name_item existed, 17 reports and none of the proof's,
-- and both purged items were back: nothing persisted):
--   setup         | t | event 340fcc7b-6c41-48f6-a143-6ef9f6724f4b: photo a1b371cb-bc1e-4721-b505-528e7f5eabed, video 56fe4b1d-9242-4284-a4fb-c24ad84828b3, another item 180d4048-e261-4029-abf2-ef67999eb0e0
--   the backfill  | t | 12 item reports each carry their item's kind; ids, stamps, statuses and the open reports' addresses read as before
--   filing        | t | create_report's photo report reads photo, its video report video, its album report no kind
--   the purge     | t | purge_media_rows took both rows once their reports closed; each report still names its item and its kind
--   the reopen    | t | reopened, the two reports keep nothing of their album: the album's other item reads kept {} before and after
--   the refusals  | t | an id naming no item is refused 23503; a kind written with no item is stored with none; a kind written alone stays its item's
--   grants        | t | the function: search_path pinned, no client role runs it; the foreign key gone, the CHECK standing
--   body          | t | 59033191dea8ef71faa934e40727475e {postgres=X/postgres,service_role=X/postgres}
-- =============================================================================================
-- do $$
-- declare
--   v_event uuid; v_qr text; v_photo uuid; v_video uuid; v_other uuid;
--   r_photo uuid; r_video uuid; r_album uuid;
--   v jsonb; v_err text; v_kept uuid[];
--   v_step text := 'setup';
-- begin
--   select e.id, e.qr_token into v_event, v_qr from public.events e
--    where e.deleted_at is null
--      and exists (select 1 from public.media m where m.event_id = e.id and m.type = 'photo' and m.status = 'approved' and m.legal_hold_at is null)
--      and exists (select 1 from public.media m where m.event_id = e.id and m.type = 'video' and m.status = 'approved' and m.legal_hold_at is null)
--    order by e.created_at desc limit 1;
--   if v_event is null then raise exception 'SETUP: no event fits'; end if;
--   select m.id into v_photo from public.media m where m.event_id = v_event and m.type = 'photo' and m.status = 'approved' and m.legal_hold_at is null order by m.created_at desc, m.id limit 1;
--   select m.id into v_video from public.media m where m.event_id = v_event and m.type = 'video' and m.status = 'approved' and m.legal_hold_at is null order by m.created_at desc, m.id limit 1;
--   select m.id into v_other from public.media m where m.event_id = v_event and m.id not in (v_photo, v_video) and m.legal_hold_at is null order by m.created_at desc, m.id limit 1;
--   insert into named_proof values ('setup', true, format('event %s: photo %s, video %s, another item %s', v_event, v_photo, v_video, v_other));
--
--   -- ── 1. The backfill: every standing item report says its kind; nothing else moved. ──
--   v_step := 'the backfill';
--   if exists (select 1 from public.reports where media_id is not null and media_type is null) then
--     raise exception 'FAIL: an item report without its kind';
--   end if;
--   if exists (select 1 from public.reports r join public.media m on m.id = r.media_id where r.media_type <> m.type) then
--     raise exception 'FAIL: a kind that is not its item''s';
--   end if;
--   if (select fp from before_fp) <> (select md5(coalesce(string_agg(id::text || updated_at::text || status::text || coalesce(media_id::text, '')
--                  || coalesce(reporter_email, '') || coalesce(proof_token_hash, ''), ',' order by id), '')) from public.reports) then
--     raise exception 'FAIL: the backfill touched another column';
--   end if;
--   insert into named_proof values ('the backfill', true, format('%s item reports each carry their item''s kind; ids, stamps, statuses and the open reports'' addresses read as before', (select items from before_fp)));
--
--   -- ── 2. Filing writes the kind from the item itself; an album report names none. ──
--   v_step := 'filing';
--   set local role service_role;
--   v := public.create_report(v_qr, v_photo, 'named proof: photo', 'violence');
--   r_photo := (v ->> 'report_id')::uuid;
--   v := public.create_report(v_qr, v_video, 'named proof: video', 'sexual');
--   r_video := (v ->> 'report_id')::uuid;
--   v := public.create_report(v_qr, null, 'named proof: album', 'other');
--   r_album := (v ->> 'report_id')::uuid;
--   reset role;
--   if (select media_type from public.reports where id = r_photo) is distinct from 'photo'
--      or (select media_type from public.reports where id = r_video) is distinct from 'video'
--      or (select media_type from public.reports where id = r_album) is not null then
--     raise exception 'FAIL: the kinds as filed';
--   end if;
--   -- An open album report keeps its whole album from every purge: it has said its piece.
--   delete from public.reports where id = r_album;
--   insert into named_proof values ('filing', true, 'create_report''s photo report reads photo, its video report video, its album report no kind');
--
--   -- ── 3. The purge leaves what the report named: its id and its kind, and it still reads as an item's. ──
--   v_step := 'the purge';
--   update public.reports set status = 'dismissed', resolved_at = now() where id in (r_photo, r_video);
--   set local role service_role;
--   perform public.purge_media_rows(array[v_photo, v_video]);
--   reset role;
--   if exists (select 1 from public.media where id in (v_photo, v_video)) then raise exception 'SETUP: the purge kept a row'; end if;
--   if (select media_id from public.reports where id = r_photo) is distinct from v_photo
--      or (select media_type from public.reports where id = r_photo) is distinct from 'photo'
--      or (select media_id from public.reports where id = r_video) is distinct from v_video
--      or (select media_type from public.reports where id = r_video) is distinct from 'video' then
--     raise exception 'FAIL: the report forgot what it named';
--   end if;
--   insert into named_proof values ('the purge', true, 'purge_media_rows took both rows once their reports closed; each report still names its item and its kind');
--
--   -- ── 4. Reopened, it keeps only its own gone item: never its album. ──
--   v_step := 'the reopen';
--   set local role service_role;
--   v_kept := public.kept_media_ids(array[v_other]);
--   reset role;
--   update public.reports set status = 'open', resolved_at = null where id in (r_photo, r_video);
--   set local role service_role;
--   if public.kept_media_ids(array[v_other]) is distinct from v_kept then
--     raise exception 'FAIL: a reopened report on a gone item kept its album (% before, % after)', v_kept, public.kept_media_ids(array[v_other]);
--   end if;
--   reset role;
--   insert into named_proof values ('the reopen', true, format('reopened, the two reports keep nothing of their album: the album''s other item reads kept %s before and after', v_kept));
--
--   -- ── 5. What the key checked at insert: an id that names nothing is refused; the kind is only ever the item's. ──
--   v_step := 'the refusals';
--   begin
--     insert into public.reports (event_id, media_id, reason, kind) values (v_event, gen_random_uuid(), 'named proof: nothing', 'other');
--     v_err := 'inserted';
--   exception when foreign_key_violation then v_err := '23503';
--   end;
--   if v_err <> '23503' then raise exception 'FAIL: an id that names no item %', v_err; end if;
--   insert into public.reports (event_id, media_id, media_type, reason, kind)
--   values (v_event, null, 'photo', 'named proof: a kind alone', 'other') returning id into r_album;
--   if (select media_type from public.reports where id = r_album) is not null then
--     raise exception 'FAIL: a kind with no item';
--   end if;
--   update public.reports set media_type = 'video' where id = r_photo;
--   if (select media_type from public.reports where id = r_photo) is distinct from 'photo' then
--     raise exception 'FAIL: the kind moved without its item';
--   end if;
--   insert into named_proof values ('the refusals', true, 'an id naming no item is refused 23503; a kind written with no item is stored with none; a kind written alone stays its item''s');
--
--   -- ── 6. The grants: a trigger's function no client role runs; the FK is gone and the CHECK stands. ──
--   v_step := 'grants';
--   if has_function_privilege('public', 'public.reports_name_item()', 'EXECUTE')
--      or has_function_privilege('anon', 'public.reports_name_item()', 'EXECUTE')
--      or has_function_privilege('authenticated', 'public.reports_name_item()', 'EXECUTE')
--      or (select proconfig from pg_proc where oid = 'public.reports_name_item()'::regprocedure) <> array['search_path=""'] then
--     raise exception 'FAIL: the function''s grants or path';
--   end if;
--   if exists (select 1 from pg_constraint where conrelid = 'public.reports'::regclass and conname = 'reports_media_id_fkey')
--      or not exists (select 1 from pg_constraint where conrelid = 'public.reports'::regclass and conname = 'reports_media_type_named') then
--     raise exception 'FAIL: the constraints';
--   end if;
--   insert into named_proof values ('grants', true, 'the function: search_path pinned, no client role runs it; the foreign key gone, the CHECK standing');
-- exception when others then
--   insert into named_proof values (v_step, false, sqlerrm);
-- end;
-- $$;
