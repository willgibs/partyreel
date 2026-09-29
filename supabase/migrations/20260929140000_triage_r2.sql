-- ADMIN-TRIAGE R2, WIRED, AND THE HOLD REBUILT ON WILL'S WORD (2026-09-29).
--
-- His r2 answers (docs/reviews/admin-triage.json, build 19's sitting): `look=grid`, `harm=kinds` ("The form
-- asks one of five kinds or Something else. Harm arrives in front, worst first, the worst covered"),
-- `proof=confirm` ("The form offers Confirm your email with the door's own code, so a signed-out guest can be
-- asked too, on the address kept until it closes"), and `phone=stop` with his note asking for both acts on a
-- phone. And his word in chat on the hold: "a hold is for what police should see", so nothing held stays
-- visible by default; an operator's removal stops counting against the host's storage at once; an open report
-- protects its item from every permanent delete; and a child-abuse report from a confirmed address hides the
-- item at once pending review ("implemented poorly this becomes a gate to someone attempting to report real
-- abuse, but the flip side would allow anyone to effectively takedown other photos knowing CA reports are
-- immediate takedown").
--
-- WHAT CHANGES, one fact each:
--   1. A report says what it is (`reports.kind`, the form's five kinds or Something else), whether its reporter
--      was signed in, and, from a CONFIRMED address only, that address until the report closes
--      (`reporter_email`: a BEFORE trigger forgets it the moment the status leaves open, and a CHECK refuses a
--      closed row that still holds one). A confirmed child-abuse report also keeps `reporter_hash` (an HMAC of
--      the address the route computes with the rate-limit secret, never the address), which is what its limits
--      and its bar read after the address is gone.
--   2. THE INSTANT HIDE (create_report): a report of kind `child` naming an item, from a confirmed address,
--      makes that item an operator's removal at once (as a takedown would: out of the album and the host's
--      Deleted, restorable by an operator), and stamps `hid_at` with the same instant as the item's removed_at.
--      Never for the event's own host (a host cannot trigger an operator's removal), never for an address a
--      dismissed child-abuse report stands against, and at most 3 an address and 5 an event in any 24 hours;
--      past those, or unconfirmed, the report is filed exactly the same and heads the queue without hiding.
--      The report itself is never gated.
--   3. Ask for proof has its record on the report (`proof_*`): the operator's question, a hashed one-use token
--      for the answer link (forgotten at close, like the address), and the reporter's answer. The mail behind
--      it waits on a switch seeded OFF (`ops_flags.report_proof_mail_enabled`), his yes flips it.
--   4. WHAT AN OPEN REPORT KEEPS: `kept_media_ids(uuid[])` is the one home of "the purge must keep this row":
--      held, or named by an open report (its item, or for an album report every item of its album).
--      purge_media_rows refuses such a row, purge_media_now defers it, and the app's R2-first callers ask the
--      same function before they delete a single object (reclaim.ts, purgeMediaNow). held_event_ids answers an
--      event with any open report as held, so expired events and account deletion keep it whole.
--   5. A PERMANENT DELETE THE ROW'S KEEPER DEFERS (`media.purge_asked_at`): the host's Delete permanently on a
--      kept row, and the removed_media sweep reaching a kept row past its window, mark it asked. It leaves every
--      host read at once (media_host_all), leaves her Deleted figure, the standby budget and her restore, and
--      the sweep takes it the night its keeper lets go. The item leaves view as the deleter expects; its bytes
--      wait for the review.
--   6. THE HOST'S METER (`profiles.storage_used_bytes`) CARRIES ONLY WHAT IS HERS: the `media_release_meter`
--      trigger takes a row's bytes off the moment it becomes an operator's removal or an asked row, and puts
--      them back if an operator restores it; purge_media_rows decrements only a row not yet released. So a
--      takedown and a hold read the same in every number she can read, and a quietly held item she deletes
--      leaves her meter the night any other deletion would. The one backfill below takes the existing
--      operator's removals off their hosts' meters. The monthly ingress ledger is untouched (it never refunds).
--   7. A QUIETLY HELD ROW TAKES THE HOST'S OWN ACTS (guard_media_privileged_transitions): the hold branch that
--      skipped every client write to a held row goes, so her Remove, Hide and Show on an item she has no way to
--      know is held land like on any other. Leaving Deleted stays the restore RPC's alone, and restore_media
--      still refuses a held row (in the discreet words it always used). Her block takes one too
--      (block_from_event removes it and counts it; let_back_in leaves it in Deleted, as a restore would), and
--      its uploader's own feed and delete read it as any other blocked upload (get_my_uploads, remove_my_upload).
--   8. `report_queue_facts` answers the grid's facts in one jsonb: the same uploader's other items in the
--      event, the reports on them and how many are held, and each album's uploads and guests.
--
-- WHAT DOES NOT CHANGE: no grant to a client role; reports stays deny-all; the hold columns, the provenance,
-- `purge_asked_at` and `reporter_*` stay unreadable by `authenticated`; the four anon reads and the
-- authenticated-only set are untouched; the capacity decisions keep their one profiles lock first
-- (the meter trigger fires only on the two release columns, which none of them writes).
--
-- SHAPE: every replaced function keeps its signature, return type, language, volatility, security mode and
-- empty search_path, so `create or replace` keeps its ACL, and each restates its grants as they stand live
-- (2026-09-29). create_report alone changes signature (four defaulted parameters after the old three), so it is
-- DROP + CREATE with its service-role grant restated; the old deployed build's three named arguments still
-- resolve to it. Each body is its newest definition with only the named change: purge_media_rows
-- 20260729150000, restore_media 20260729190000, guard_media_privileged_transitions 20260729180000,
-- purge_media_now, held_event_ids, standby_hosts, host_storage_summary and restore_event 20260928140000,
-- block_from_event, get_my_uploads and remove_my_upload 20260928120000,
-- create_report 20260602183720 (live's body is that one less its one comment line; md5-checked 2026-09-29).
--
-- APPLY PROTOCOL (database-security.md -> Workflow): (1) the bodies before, for the diff:
--   select p.oid::regprocedure, md5(regexp_replace(p.prosrc, '\s+', ' ', 'g')), p.proacl from pg_proc p
--     join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname in
--     ('create_report', 'purge_media_rows', 'purge_media_now', 'restore_media', 'held_event_ids', 'standby_hosts',
--      'host_storage_summary', 'restore_event', 'guard_media_privileged_transitions', 'block_from_event',
--      'get_my_uploads', 'remove_my_upload') order by 1;
-- (2) apply verbatim; (3) the same read after (the ACLs as restated below; create_report's new signature
-- service-role only); (4) get_advisors, EXPECTED DELTA: NONE (every new function is INVOKER or a trigger's,
-- EXECUTE revoked from every client role; no table, no policy added); (5) the rolled-back check at the foot;
-- (6) regenerate src/lib/db/types.ts (reports gains ten columns and `report_kind`, media gains `purge_asked_at`,
-- create_report its parameters, and the four new functions appear), then drop the lane's typed seams named in
-- its handoff. ★ DEPLOY RIGHT AFTER THE APPLY: the build before this lane never asks `kept_media_ids`, so its
-- purge would delete an open-reported item's OBJECT while this SQL keeps its row. The build after it is safe on
-- either side for guests and hosts (while the new signature and columns are missing, the report route falls back
-- to the three-argument call, her Delete permanently to the held rows, and an answer link reads as spent); the
-- purge cron deletes nothing until the apply (a batch that cannot ask what to keep stops, loudly), and the
-- portal's Reports reads the new columns, so both wait on it.

-- =============================================================================================
-- 1. What a report is, and who sent it (only as long as it is open).
-- =============================================================================================
-- The form's five kinds and Something else, worst first as the queue reads them (lib/reports/kinds.ts
-- carries the words; reports-kinds parity is pinned there). `child` is the one the instant hide reads.
create type public.report_kind as enum ('child', 'sexual', 'violence', 'private', 'consent', 'other');

alter table public.reports
  add column kind public.report_kind not null default 'other',
  add column reporter_signed_in boolean not null default false,
  add column reporter_email text,
  add column reporter_hash text,
  add column hid_at timestamptz,
  add column proof_asked_at timestamptz,
  add column proof_question text,
  add column proof_token_hash text,
  add column proof_answered_at timestamptz,
  add column proof_answer text;

alter table public.reports
  add constraint reports_reporter_email_len
    check (reporter_email is null or char_length(reporter_email) <= 320),
  add constraint reports_proof_question_len
    check (proof_question is null or char_length(proof_question) <= 2000),
  add constraint reports_proof_answer_len
    check (proof_answer is null or char_length(proof_answer) <= 2000),
  -- ★ The address and the answer link live exactly as long as the report is open.
  add constraint reports_reporter_only_while_open
    check (status = 'open' or (reporter_email is null and proof_token_hash is null));

-- The FK's own lookup (media_id is ON DELETE SET NULL) and every "is this item under an open report" question.
create index reports_media_id_idx on public.reports (media_id) where media_id is not null;
-- The instant hide's limits and its bar read an address's child-abuse reports by their hash.
create index reports_reporter_hash_idx on public.reports (reporter_hash, created_at)
  where reporter_hash is not null;
-- The answer link finds its report by the token's hash, and one hash names one report.
create unique index reports_proof_token_idx on public.reports (proof_token_hash)
  where proof_token_hash is not null;

-- The report closes, the reporter is forgotten: the address and the answer link, in the same write.
create function public.reports_forget_reporter()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status <> 'open' then
    new.reporter_email := null;
    new.proof_token_hash := null;
  end if;
  return new;
end;
$$;

revoke execute on function public.reports_forget_reporter() from public, anon, authenticated;

create trigger reports_forget_reporter
  before insert or update on public.reports
  for each row execute function public.reports_forget_reporter();

-- =============================================================================================
-- 2. A permanent delete the row's keeper defers.
-- =============================================================================================
alter table public.media add column purge_asked_at timestamptz;

-- An asked row is gone from every view: it can never be up again (an operator's restore is refused too).
alter table public.media
  add constraint media_purge_asked_only_removed
  check (purge_asked_at is null or status = 'removed');

comment on column public.media.purge_asked_at is
  'When a permanent delete was asked of this row while something kept it (a hold, an open report): the host''s Delete permanently, or the removed_media sweep past its window. The row leaves every host read and her storage figures at once; the sweep deletes it once kept_media_ids no longer names it. Service role and definer functions only; never granted to a client role.';

-- The host's rows leave out an asked row too (it is gone, as she asked). Byte-for-byte 20260928140000's USING
-- plus the one conjunct.
alter policy media_host_all on public.media
  using (
    exists (
      select 1 from public.events e
      where e.id = media.event_id and e.host_id = (select auth.uid())
    )
    and not (media.status = 'removed' and media.removed_by_admin)
    and media.purge_asked_at is null
  );

comment on policy media_host_all on public.media is
  'A host reads and writes the media of her own events, never an operator''s removal (status removed and removed_by_admin) nor a row whose permanent delete she asked while something keeps it (purge_asked_at): each leaves her album, her Deleted and every count at once, and neither flag is granted. Guest reads and writes go through SECURITY DEFINER RPCs.';

-- =============================================================================================
-- 3. The host's meter carries only what is hers.
-- =============================================================================================
-- Released = an operator's removal or an asked row. Fires only when that changes, so no capacity decision
-- (each of which writes neither column) ever takes a second profiles lock here. Lock order media -> profiles,
-- purge_media_rows' own.
create function public.media_release_meter()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_was boolean;
  v_is boolean;
begin
  v_was := old.removed_by_admin or old.purge_asked_at is not null;
  v_is := new.removed_by_admin or new.purge_asked_at is not null;
  if v_was = v_is then
    return null;
  end if;
  update public.profiles p
     set storage_used_bytes = case
           when v_is then greatest(0, p.storage_used_bytes - new.file_size_bytes)
           else p.storage_used_bytes + new.file_size_bytes
         end
    from public.events e
   where e.id = new.event_id
     and p.id = e.host_id;
  return null;
end;
$$;

revoke execute on function public.media_release_meter() from public, anon, authenticated;

create trigger media_release_meter
  after update of removed_by_admin, purge_asked_at on public.media
  for each row
  when (old.removed_by_admin is distinct from new.removed_by_admin
        or old.purge_asked_at is distinct from new.purge_asked_at)
  execute function public.media_release_meter();

-- THE ONE BACKFILL: the operator's removals that already stand leave their hosts' meters, as every one from
-- here on will at its removal (purge_media_rows no longer takes them off at the purge). Only the meter moves:
-- profiles_set_updated_at is paused around the one statement so no host's updated_at does.
alter table public.profiles disable trigger profiles_set_updated_at;

update public.profiles p
   set storage_used_bytes = greatest(0, p.storage_used_bytes - r.bytes)
  from (
    select e.host_id, sum(m.file_size_bytes)::bigint as bytes
      from public.media m
      join public.events e on e.id = m.event_id
     where m.removed_by_admin
     group by e.host_id
  ) r
 where p.id = r.host_id;

alter table public.profiles enable trigger profiles_set_updated_at;

-- =============================================================================================
-- 4. What the purge must keep: ONE answer.
-- =============================================================================================
-- Held, or named by an open report: its item, or, for an album report, every item of its album. A uuid[], so
-- neither the input nor the answer can be cut at 1,000 rows (the R2-first callers pass at most MAX_ROWS ids).
create function public.kept_media_ids(p_media_ids uuid[])
returns uuid[]
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(array_agg(m.id order by m.id), '{}'::uuid[])
  from public.media m
  where m.id = any(p_media_ids)
    and (
      m.legal_hold_at is not null
      or exists (
        select 1
        from public.reports r
        where r.status = 'open'
          and (r.media_id = m.id or (r.media_id is null and r.event_id = m.event_id))
      )
    );
$$;

revoke all on function public.kept_media_ids(uuid[]) from public, anon, authenticated;
grant execute on function public.kept_media_ids(uuid[]) to service_role;

comment on function public.kept_media_ids(uuid[]) is
  'The ids among the input that no permanent delete may take: under legal hold, or named by an open report (the item itself, or any item of an album an open album report names). The one home of that rule: purge_media_rows and purge_media_now read it in SQL, and every R2-first caller asks it before deleting an object. Service-role only; SECURITY INVOKER.';

-- =============================================================================================
-- 5. purge_media_rows: never a kept row, and the meter only for bytes still counted.
-- =============================================================================================
-- Byte-for-byte 20260729150000 except the kept set and the released rows' zero.
create or replace function public.purge_media_rows(p_media_ids uuid[])
returns table (host_id uuid, freed_bytes bigint)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_kept uuid[];
begin
  -- Read once: what the purge must keep among the input (a hold, an open report).
  v_kept := public.kept_media_ids(p_media_ids);

  return query
  with target as (
    select m.id
    from public.media m
    where m.id = any (p_media_ids)
      and m.legal_hold_at is null -- legal hold: never hard-delete a held row (ADR-0020)
      and not (m.id = any (v_kept)) -- nor one an open report keeps
  ),
  del as (
    delete from public.media m
    where m.id in (select id from target)
    returning m.event_id, m.file_size_bytes,
      (m.removed_by_admin or m.purge_asked_at is not null) as released
  ),
  by_host as (
    -- A released row's bytes left the meter at its release (media_release_meter): never twice.
    select e.host_id as h,
           sum(case when d.released then 0 else d.file_size_bytes end)::bigint as bytes
    from del d
    join public.events e on e.id = d.event_id
    group by e.host_id
  ),
  upd as (
    update public.profiles p
    set storage_used_bytes = greatest(0, p.storage_used_bytes - bh.bytes)
    from by_host bh
    where p.id = bh.h
    returning p.id as pid, bh.bytes as freed
  )
  select upd.pid, upd.freed from upd;
end;
$$;

revoke execute on function public.purge_media_rows(uuid[]) from public, anon, authenticated;
grant execute on function public.purge_media_rows(uuid[]) to service_role;

-- =============================================================================================
-- 6. purge_media_now: her Delete permanently always leaves her view; a kept row's bytes wait.
-- =============================================================================================
-- Byte-for-byte 20260928140000 except the kept arm. Her selection is her own removals, never an operator's and
-- never one already asked; the kept among them are ASKED (gone from every read she has, off her meter), the
-- rest purged. The answer counts her whole selection either way, so it tells a kept row from any other nothing.
create or replace function public.purge_media_now(p_media_ids uuid[])
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ids uuid[];
  v_kept uuid[];
  v_gone uuid[];
  v_freed bigint := 0;
  v_released bigint := 0;
begin
  -- Validated subset: only the caller's OWN, status='removed' media that is NOT an operator's removal (the DB
  -- boundary: an operator's removal waits out its window for the runbook) and not already asked.
  select coalesce(array_agg(m.id), '{}'::uuid[]) into v_ids
    from public.media m
    join public.events e on e.id = m.event_id
    where m.id = any(p_media_ids)
      and e.host_id = (select auth.uid())
      and m.status = 'removed'
      and not m.removed_by_admin
      and m.purge_asked_at is null;

  if array_length(v_ids, 1) is null then
    return jsonb_build_object('ok', true, 'purged', 0, 'freed_bytes', 0);
  end if;

  -- ★ A HOLD OR AN OPEN REPORT DEFERS THE DELETE, NEVER REFUSES IT: the row is asked (media_host_all drops it,
  -- media_release_meter takes its bytes off her meter) and the removed_media sweep takes it once nothing keeps it.
  v_kept := public.kept_media_ids(v_ids);
  if array_length(v_kept, 1) is not null then
    select coalesce(sum(m.file_size_bytes), 0)::bigint into v_released
      from public.media m where m.id = any(v_kept);
    update public.media set purge_asked_at = now()
     where id = any(v_kept) and purge_asked_at is null;
  end if;

  select coalesce(array_agg(x), '{}'::uuid[]) into v_gone
    from unnest(v_ids) as x
   where not (x = any(v_kept));

  -- Internal call into the service-role-only purge_media_rows (owner context).
  if array_length(v_gone, 1) is not null then
    select coalesce(sum(freed_bytes), 0)::bigint into v_freed
      from public.purge_media_rows(v_gone);
  end if;

  return jsonb_build_object('ok', true, 'purged', array_length(v_ids, 1),
    'freed_bytes', v_freed + v_released);
end;
$$;

revoke execute on function public.purge_media_now(uuid[]) from public, anon, authenticated;
grant execute on function public.purge_media_now(uuid[]) to authenticated;

-- =============================================================================================
-- 7. restore_media: an asked row is gone, as a missing row is.
-- =============================================================================================
-- Byte-for-byte 20260729190000 except the ownership read's last predicate.
create or replace function public.restore_media(p_media_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_media public.media;
  v_event public.events;
  v_profile public.profiles;
  v_cap bigint;
  v_active bigint;
  v_target public.media_status;
begin
  select m.* into v_media from public.media m
    join public.events e on e.id = m.event_id
    where m.id = p_media_id and e.host_id = (select auth.uid())
      and m.removed_by_uploader = false   -- a guest's self-deletion is private to the host
      and m.purge_asked_at is null;       -- her own Delete permanently: gone, even while it is kept
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  select * into v_event from public.events where id = v_media.event_id;
  if v_event.deleted_at is not null then
    return jsonb_build_object('ok', false, 'reason', 'event_deleted'); -- restore the event first
  end if;
  if v_media.status <> 'removed' then
    return jsonb_build_object('ok', false, 'reason', 'not_removed');
  end if;
  if v_media.legal_hold_at is not null then
    return jsonb_build_object('ok', false, 'reason', 'legal_hold'); -- ADR-0020: stays off live
  end if;
  if v_media.removed_by_admin then
    return jsonb_build_object('ok', false, 'reason', 'admin_removed'); -- QA #8: operators only
  end if;

  -- QA #17: lock the host's profiles row so a restore racing an upload (or another restore)
  -- cannot both read the same active-bytes figure and both admit.
  select * into v_profile from public.profiles where id = v_event.host_id for update;
  v_cap := coalesce(v_profile.storage_cap_bytes,
                    (select default_storage_cap_bytes from public.tier_limits(v_profile.tier)));
  if v_cap is not null then
    v_active := public.host_active_bytes(v_event.host_id);
    if v_active + v_media.file_size_bytes > v_cap then
      return jsonb_build_object('ok', false, 'reason', 'insufficient_space',
        'needed_bytes', (v_active + v_media.file_size_bytes) - v_cap);
    end if;
  end if;

  -- QA #24: back to where it was, not a blanket 'approved' (a hidden item stays hidden, a pending
  -- item stays pending). Pre-Q3 rows carry no stamp -> 'approved', the historical behavior.
  v_target := coalesce(v_media.status_before_removed, 'approved'::public.media_status);
  if v_target = 'removed' then
    v_target := 'approved'::public.media_status;
  end if;

  -- Pure status flip; trigger nulls purge_at; storage_used_bytes unchanged (bytes never left).
  update public.media set status = v_target, removed_at = null
    where id = p_media_id and status = 'removed';

  return jsonb_build_object('ok', true, 'status', v_target);
end;
$$;

revoke execute on function public.restore_media(uuid) from public, anon, authenticated;
grant execute on function public.restore_media(uuid) to authenticated;

-- =============================================================================================
-- 8. Her Deleted figure, the standby budget and her restored event's count leave an asked row out.
-- =============================================================================================
-- host_storage_summary: byte-for-byte 20260928140000 except the media bin's one conjunct.
create or replace function public.host_storage_summary(p_host_id uuid)
returns table (active_bytes bigint, standby_bytes bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select
    coalesce(sum(m.file_size_bytes) filter (
      where m.status <> 'removed' and e.deleted_at is null
    ), 0)::bigint as active_bytes,
    coalesce(sum(m.file_size_bytes) filter (
      where (m.status = 'removed' and not m.removed_by_uploader and not m.removed_by_admin and m.purge_asked_at is null and m.removed_at >= now() - interval '30 days')
         or (m.status <> 'removed' and e.deleted_at >= now() - interval '30 days')
    ), 0)::bigint as standby_bytes
  from public.media m
  join public.events e on e.id = m.event_id
  where e.host_id = p_host_id;
$$;

revoke all on function public.host_storage_summary(uuid) from public, anon, authenticated;
grant execute on function public.host_storage_summary(uuid) to service_role;

comment on function public.host_storage_summary(uuid) is
  'A host''s active and Deleted bytes in one aggregate (the storage meter and the storage guard). Active matches host_active_bytes(uuid). Deleted is exactly what her two Deleted lists show: a removal that is neither a guest''s own withdrawal, nor an operator''s, nor one she asked to delete permanently, and a deleted event''s live media, each inside the 30-day window. Service-role only: the app proves the host with getUser() first.';

-- standby_hosts: byte-for-byte 20260928140000 except the removed arm's asked conjunct.
create or replace function public.standby_hosts(p_after uuid default null, p_limit integer default null)
returns table (host_id uuid, standby_bytes bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select e.host_id, sum(m.file_size_bytes)::bigint
  from public.media m
  join public.events e on e.id = m.event_id
  where m.legal_hold_at is null
    and (
      (m.status = 'removed' and not m.removed_by_system and not m.removed_by_uploader and not m.removed_by_admin and m.purge_asked_at is null)
      or (m.status <> 'removed' and e.deleted_at is not null)
    )
    and (p_after is null or e.host_id > p_after)
  group by e.host_id
  having sum(m.file_size_bytes) > 0
  order by e.host_id
  limit case when p_limit is null then null else least(p_limit, 1000) end;
$$;

revoke all on function public.standby_hosts(uuid, integer) from public, anon, authenticated;
grant execute on function public.standby_hosts(uuid, integer) to service_role;

comment on function public.standby_hosts(uuid, integer) is
  'Hosts with standby bytes as the purge cron''s budget counts them (removed media not removed by the system, withdrawn by its guest, taken down by an operator or asked to be deleted permanently, plus the live media of a soft-deleted event; never a held item), keyset on host id with p_limit clamped to 1,000; a null p_limit reads everything. Service-role only; SECURITY INVOKER.';

-- restore_event: byte-for-byte 20260928140000 except the closing count's asked conjunct.
create or replace function public.restore_event(p_event_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event public.events;
  v_profile public.profiles;
  v_limits record;
  v_max integer;
  v_cap bigint;
  v_active bigint;
  v_returning bigint;
  v_event_count integer;
  v_still_removed integer;
  v_slug_released boolean := false;
begin
  select * into v_event from public.events
    where id = p_event_id and host_id = (select auth.uid()) and deleted_at is not null;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  -- QA #17: `for update` on the host's own profiles row (host_id = auth.uid() here, proven by the
  -- select above) serializes the slot count + capacity gate against concurrent restores/creates.
  select * into v_profile from public.profiles where id = v_event.host_id for update;
  select * into v_limits from public.tier_limits(v_profile.tier);

  -- Slot re-check (enforce_event_limit is BEFORE INSERT only; it does NOT fire on this UPDATE).
  -- event_slots (the stacked-pass count) overrides the static tier limit when present.
  v_max := coalesce(v_profile.event_slots, v_limits.max_events);
  if v_max is not null then
    select count(*) into v_event_count from public.events
      where host_id = (select auth.uid()) and deleted_at is null;
    if v_event_count >= v_max then
      return jsonb_build_object('ok', false, 'reason', 'event_limit', 'max_events', v_max);
    end if;
  end if;

  -- Capacity gate on the media that RE-ACTIVE when deleted_at clears (non-removed in this event).
  v_cap := coalesce(v_profile.storage_cap_bytes, v_limits.default_storage_cap_bytes);
  if v_cap is not null then
    select coalesce(sum(file_size_bytes), 0)::bigint into v_returning
      from public.media where event_id = p_event_id and status <> 'removed';
    v_active := public.host_active_bytes(v_event.host_id);
    if v_active + v_returning > v_cap then
      return jsonb_build_object('ok', false, 'reason', 'insufficient_space',
        'needed_bytes', (v_active + v_returning) - v_cap);
    end if;
  end if;

  -- ★ THE SLUG FREED AT DELETION STAYS FREED. events_custom_slug_unique covers live events only,
  -- so another event may have claimed this one's custom link while it sat in Deleted; clearing
  -- deleted_at then trips that index, the one unique index an undelete can newly violate. Keep
  -- the link when it is still free; when it is taken, come back on the permanent link alone
  -- rather than refuse the restore.
  begin
    update public.events set deleted_at = null, purge_at = null
      where id = p_event_id and deleted_at is not null;
  exception when unique_violation then
    update public.events set deleted_at = null, purge_at = null, custom_slug = null
      where id = p_event_id and deleted_at is not null;
    v_slug_released := true;
  end;

  -- What stays behind in her Deleted, as her Deleted lists it: never a guest's own withdrawal, never an
  -- operator's removal, never one she asked to delete permanently, never a row past the window (a held one
  -- outlives it and must not be counted).
  select count(*) into v_still_removed from public.media
    where event_id = p_event_id
      and status = 'removed'
      and not removed_by_uploader
      and not removed_by_admin
      and purge_asked_at is null
      and removed_at >= now() - interval '30 days';

  return jsonb_build_object('ok', true, 'media_still_removed', v_still_removed,
    'custom_slug_released', v_slug_released);
end;
$$;

revoke execute on function public.restore_event(uuid) from public, anon, authenticated;
grant execute on function public.restore_event(uuid) to authenticated;

-- =============================================================================================
-- 9. held_event_ids: an event under any open report is kept whole, as a hold keeps it.
-- =============================================================================================
-- Byte-for-byte 20260928140000 plus the reports arm. An open report cascades away with its event row
-- (reports.event_id is ON DELETE CASCADE), so keeping the event is also what keeps the report.
create or replace function public.held_event_ids(p_event_ids uuid[])
returns uuid[]
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(array_agg(h.event_id order by h.event_id), '{}'::uuid[])
  from (
    select m.event_id
    from public.media m
    where m.event_id = any(p_event_ids)
      and (
        m.legal_hold_at is not null
        or (m.status = 'removed' and m.removed_by_admin and m.purge_at > now())
      )
    union
    select r.event_id
    from public.reports r
    where r.event_id = any(p_event_ids)
      and r.status = 'open'
  ) h;
$$;

revoke all on function public.held_event_ids(uuid[]) from public, anon, authenticated;
grant execute on function public.held_event_ids(uuid[]) to service_role;

comment on function public.held_event_ids(uuid[]) is
  'The ids among the input the purge must keep whole, as one sorted uuid[] ({} when none): an event holding media under legal hold, an operator''s removal still inside its window (purge_at in the future: the runbook''s time to hold and preserve), or any open report (an item''s or the album''s). The purge sweeps skip those events whole. Service-role only; SECURITY INVOKER.';

-- =============================================================================================
-- 10. The removed_media sweep defers what it may not take.
-- =============================================================================================
-- A removal past its window that something keeps (kept_media_ids) is asked, so it leaves the host's meter the
-- night any other removal would, and the sweep takes it the night its keeper lets go. An operator's removal
-- is already off her meter and waits on its own window, so it is left alone.
create function public.defer_kept_due_media()
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_due uuid[];
  v_kept uuid[];
  v_count integer;
begin
  select coalesce(array_agg(m.id), '{}'::uuid[]) into v_due
    from public.media m
   where m.status = 'removed'
     and m.purge_asked_at is null
     and not m.removed_by_admin
     and m.purge_at is not null
     and m.purge_at <= now();
  if array_length(v_due, 1) is null then
    return 0;
  end if;
  v_kept := public.kept_media_ids(v_due);
  update public.media set purge_asked_at = now()
   where id = any(v_kept) and purge_asked_at is null;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.defer_kept_due_media() from public, anon, authenticated;
grant execute on function public.defer_kept_due_media() to service_role;

comment on function public.defer_kept_due_media() is
  'Marks asked (purge_asked_at) every removal past its window that kept_media_ids names, so its bytes leave the host''s meter the night any other removal''s would; the removed_media sweep deletes it once nothing keeps it. Returns how many it marked. Service-role only; SECURITY INVOKER.';

-- =============================================================================================
-- 11. A quietly held row takes the host's own acts like any other.
-- =============================================================================================
-- Byte-for-byte 20260729180000 less the hold branch. What that branch guarded is guarded where it matters now:
-- leaving 'removed' is refused below for every client write, restore_media refuses a held row, and no purge
-- takes one (kept_media_ids). The per-event block's bodies keep their own `legal_hold_at is null` (unchanged).
create or replace function public.guard_media_privileged_transitions()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user not in ('authenticated', 'anon') then
    return new; -- service_role, the cron, and every SECURITY DEFINER RPC (owner = postgres)
  end if;

  -- Un-remove: the restore RPC is the only door (a held row's included: restore_media refuses it).
  if old.status = 'removed' and new.status is distinct from 'removed' then
    raise exception 'That item is no longer available.'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

revoke execute on function public.guard_media_privileged_transitions() from public, anon, authenticated;

-- =============================================================================================
-- 12. The host's block takes a quietly held row like any other, and so does its uploader's feed.
-- =============================================================================================
-- The block's removal and its preview's count skipped a held row (20260928120000: "a hold is immutable to the
-- host"), so under a quiet hold the photograph stayed in the album the block emptied and the confirm counted
-- one fewer than she could see: the tell the quiet hold forbids. Now the block moves it to Deleted as any
-- other and counts it; let_back_in still leaves it there (restore refused, as restore_media refuses it), and
-- its uploader's own feed and delete read it as any other blocked upload. Each body is 20260928120000's less
-- its hold line (block_from_event's two); signatures, security modes and grants as they stand.
create or replace function public.block_from_event(
  p_event_id uuid default null,
  p_user_id uuid default null,
  p_guest_id uuid default null,
  p_media_id uuid default null,
  p_require_verified_email boolean default false,
  p_preview boolean default false
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_media public.media;
  v_event_id uuid := p_event_id;
  v_event public.events;
  v_guest public.guests;
  v_verified boolean;
  v_user uuid;
  v_email text;
  v_row uuid;
  v_label text;
  v_existing uuid;
  v_live integer;
  v_block uuid;
  v_removed uuid[];
  v_last_upload timestamptz;
  v_profile_eligible boolean;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'reason', 'unauthorized');
  end if;
  if num_nonnulls(p_user_id, p_guest_id, p_media_id) <> 1 then
    return jsonb_build_object('ok', false, 'reason', 'bad_target');
  end if;

  -- A photograph and a guest row each name their own event (an account needs p_event_id). A named event
  -- that disagrees, like an unknown id, is not_found.
  if p_media_id is not null then
    select m.* into v_media from public.media m where m.id = p_media_id;
    if not found or (p_event_id is not null and v_media.event_id <> p_event_id) then
      return jsonb_build_object('ok', false, 'reason', 'not_found');
    end if;
    v_event_id := v_media.event_id;
  elsif p_guest_id is not null then
    select g.event_id into v_event_id from public.guests g where g.id = p_guest_id;
    if not found or (p_event_id is not null and v_event_id <> p_event_id) then
      return jsonb_build_object('ok', false, 'reason', 'not_found');
    end if;
  end if;
  if v_event_id is null then
    return jsonb_build_object('ok', false, 'reason', 'bad_target');
  end if;

  if p_preview then
    select e.* into v_event from public.events e
     where e.id = v_event_id and e.host_id = v_uid and e.deleted_at is null;
  else
    select e.* into v_event from public.events e
     where e.id = v_event_id and e.host_id = v_uid and e.deleted_at is null
       for no key update;
  end if;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  if p_user_id is not null then
    select g.* into v_guest from public.guests g
     where g.event_id = v_event.id and g.user_id = p_user_id
     order by (g.verified_at is not null) desc, g.created_at desc
     limit 1;
  else
    select g.* into v_guest from public.guests g
     where g.id = coalesce(p_guest_id, v_media.guest_id) and g.event_id = v_event.id;
  end if;
  -- The host's own upload rides no guest row; a row of another event is not this event's guest.
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_a_guest');
  end if;

  v_verified := v_guest.verified_at is not null;
  if v_verified then
    v_user := v_guest.user_id;
    v_email := lower(nullif(btrim(coalesce(v_guest.email, '')), ''));
    if v_email is null and v_user is not null then
      select lower(btrim(u.email)) into v_email
        from auth.users u
       where u.id = v_user and u.email_confirmed_at is not null;
    end if;
    -- A proved row whose account was since deleted keeps its own key beside the address.
    v_row := case when v_user is null then v_guest.id end;
  else
    v_row := v_guest.id;
    v_user := v_guest.user_id;
    v_email := null;
  end if;
  -- An address the shape CHECK would refuse is no key at all (the account and the row still are).
  if v_email is not null
     and (char_length(v_email) not between 3 and 254 or position('@' in v_email) <= 1) then
    v_email := null;
  end if;
  if v_row is null and v_user is null and v_email is null then
    return jsonb_build_object('ok', false, 'reason', 'not_a_guest');
  end if;
  if v_user = v_event.host_id then
    return jsonb_build_object('ok', false, 'reason', 'not_a_guest');
  end if;

  if v_verified and v_user is not null then
    select nullif(btrim(p.display_name), '') into v_label
      from public.profiles p where p.id = v_user;
  end if;
  v_label := left(coalesce(v_label, nullif(btrim(v_guest.display_name), '')), 120);

  select b.id into v_existing
    from public.event_blocks b
   where b.event_id = v_event.id
     and (b.user_id = v_user or b.email = v_email or b.guest_id = v_row)
   limit 1;

  select count(*)::integer into v_live
    from public.media m
    join public.guests g on g.id = m.guest_id
   where m.event_id = v_event.id
     and g.event_id = v_event.id
     and m.status <> 'removed'
     and public.event_block_names_row(v_user, v_email, v_row, g);

  if p_preview then
    return jsonb_build_object(
      'ok', true,
      'preview', true,
      'event_id', v_event.id,
      'label', v_label,
      'verified', v_verified,
      'uploads', v_live,
      'names_only', not v_event.require_verified_email,
      'already', v_existing is not null
    );
  end if;

  if v_existing is not null then
    return jsonb_build_object('ok', true, 'event_id', v_event.id, 'block_id', v_existing,
      'already', true, 'removed', 0);
  end if;

  if coalesce(p_require_verified_email, false) and not v_event.require_verified_email then
    update public.events set require_verified_email = true where id = v_event.id;
  end if;

  insert into public.event_blocks (event_id, user_id, email, guest_id, display_name)
  values (v_event.id, v_user, v_email, v_row, v_label)
  returning id into v_block;

  -- ★ THEIR UPLOADS LEAVE FOR DELETED IN THE SAME STEP, as the host's own removal: removed_at is this
  -- transaction's now(), the block's created_at to the microsecond, which is how the restore tells the
  -- block's removal from any the host made before or after it.
  -- The removal's RETURNING carries each row's prior status (media_derive_removal_provenance stamps
  -- it as the row enters the bin), which is what her profile picker read.
  with gone as (
    update public.media m
       set status = 'removed',
           removed_at = now()
      from public.guests g
     where g.id = m.guest_id
       and g.event_id = v_event.id
       and m.event_id = v_event.id
       and m.status <> 'removed'
       and public.event_block_names_row(v_user, v_email, v_row, g)
    returning m.id, m.created_at, m.status_before_removed, (g.verified_at is not null) as proved
  )
  select coalesce(array_agg(gone.id order by gone.id), '{}'::uuid[]),
         max(gone.created_at),
         coalesce(bool_or(gone.proved and gone.status_before_removed = 'approved'), false)
    into v_removed, v_last_upload, v_profile_eligible
    from gone;

  update public.event_blocks
     set removed_media_ids = v_removed,
         last_upload_at = v_last_upload,
         profile_eligible = v_profile_eligible
   where id = v_block;

  return jsonb_build_object(
    'ok', true,
    'event_id', v_event.id,
    'block_id', v_block,
    'already', false,
    'removed', cardinality(v_removed)
  );
end;
$$;

revoke all on function public.block_from_event(uuid, uuid, uuid, uuid, boolean, boolean) from public, anon, authenticated;
grant execute on function public.block_from_event(uuid, uuid, uuid, uuid, boolean, boolean) to authenticated;

comment on function public.block_from_event(uuid, uuid, uuid, uuid, boolean, boolean) is
  'The host puts one person out of one event (event-safety r1): named by an account, a guest row or a photograph; the caller must host the live event (else not_found). Inserts the block and moves every live upload of theirs to Deleted in the same step (a quietly held one too, as her own delete takes it), keeping the ids for let_back_in. p_preview answers the name, the live count, names_only and already, writing nothing; p_require_verified_email turns the switch on with it.';

create or replace function public.get_my_uploads(p_limit integer default 200)
returns table (
  id               uuid,
  type             public.media_type,
  original_key     text,
  preview_key      text,
  created_at       timestamptz,
  event_id         uuid,
  event_name       text,
  event_date       date,
  event_qr_token   text,
  is_host_upload   boolean,
  width            integer,
  height           integer,
  duration_seconds double precision
)
language sql
stable
security definer
set search_path = ''
as $$
  -- HOST arm: media in MY events, host-added (no guest). I own the event, so name/date/token are mine.
  select
    m.id, m.type, m.original_key, m.preview_key, m.created_at,
    m.event_id, e.name, e.event_date, e.qr_token, true,
    m.width, m.height, m.duration_seconds
  from public.media m
  join public.events e on e.id = m.event_id and e.deleted_at is null
  where e.host_id = (select auth.uid())
    and m.guest_id is null
    and m.status = 'approved'
    and m.removed_at is null

  union all

  -- GUEST arm: media whose guest is ME (incl. retroactively-claimed anonymous uploads).
  select
    m.id, m.type, m.original_key, m.preview_key, m.created_at,
    m.event_id, e.name, e.event_date, e.qr_token, false,
    m.width, m.height, m.duration_seconds
  from public.media m
  join public.guests g on g.id = m.guest_id and g.user_id = (select auth.uid())
  join public.events e on e.id = m.event_id and e.deleted_at is null
  where e.host_id <> (select auth.uid())
    and (
      (m.status = 'approved'
       and m.removed_at is null)
      -- ★ THE SNEAKY BLOCK (20260928120000): an approved upload a standing block removed still shows its
      -- uploader here, as a private album's uploads do, until the purge takes it or she deletes it
      -- (remove_my_upload withdraws it). Never an operator's takedown; a quietly held one like any other.
      or (m.status = 'removed'
          and m.status_before_removed = 'approved'
          and not m.removed_by_uploader
          and not m.removed_by_admin
          and exists (select 1 from public.event_blocks b
                       where b.event_id = m.event_id
                         and m.id = any (b.removed_media_ids)
                         and m.removed_at = b.created_at))
    )

  order by created_at desc
  limit p_limit;
$$;

revoke all on function public.get_my_uploads(integer) from public, anon;
grant execute on function public.get_my_uploads(integer) to authenticated;

create or replace function public.remove_my_upload(p_media_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_is_host_upload boolean;
  v_already_removed boolean;
begin
  -- Defense-in-depth (the grant already excludes anon); a missing session removes nothing.
  if v_uid is null then
    return jsonb_build_object('ok', false, 'reason', 'unauthorized');
  end if;

  -- Resolve ownership via the SAME two arms as get_my_uploads, capturing which arm matched. A row
  -- matches AT MOST one arm (a host upload has guest_id NULL; a guest upload has a non-null guest_id
  -- whose guests.user_id is the caller). The events join requires deleted_at IS NULL, matching
  -- get_my_uploads -- media in a Trashed event isn't reachable in the tab and isn't removable here.
  select
    (e.host_id = v_uid and m.guest_id is null),   -- TRUE => host arm; FALSE => guest arm
    (m.status = 'removed')
  into v_is_host_upload, v_already_removed
  from public.media m
  join public.events e on e.id = m.event_id and e.deleted_at is null
  left join public.guests g on g.id = m.guest_id
  where m.id = p_media_id
    and (
      (e.host_id = v_uid and m.guest_id is null)        -- host arm
      or (g.user_id = v_uid and e.host_id <> v_uid)     -- guest arm (incl. claimed-anonymous)
    );

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  -- Idempotent: a repeat remove must NOT reset removed_at (that would extend how long the bytes
  -- linger). Already-removed is success -- the end state is "removed" either way.
  if v_already_removed then
    -- ★ THE SNEAKY BLOCK (20260928120000): an approved upload a standing block removed still shows in
    -- its uploader's own feed (get_my_uploads), so her delete there takes: it is withdrawn, final for
    -- the host too, as every withdrawal is (removed_at stays the block's, so no window grows). Any
    -- other removed row stays exactly as it was: a repeat remove is idempotent.
    if not v_is_host_upload then
      update public.media m
         set removed_by_uploader = true
       where m.id = p_media_id
         and m.status = 'removed'
         and not m.removed_by_uploader
         and exists (select 1 from public.event_blocks b
                      where b.event_id = m.event_id
                        and m.id = any (b.removed_media_ids)
                        and m.removed_at = b.created_at);
    end if;
    return jsonb_build_object('ok', true, 'already_removed', true);
  end if;

  -- Soft-remove. The media_set_purge_at BEFORE trigger derives purge_at on this UPDATE (do NOT set it
  -- here, and purge_at is deliberately ungranted). removed_by_uploader = TRUE only for the guest arm,
  -- making that removal private to the host.
  update public.media
     set status = 'removed',
         removed_at = now(),
         removed_by_uploader = not v_is_host_upload
   where id = p_media_id and status <> 'removed';

  return jsonb_build_object('ok', true, 'is_host_upload', v_is_host_upload);
end;
$$;

revoke all on function public.remove_my_upload(uuid) from public, anon;
grant execute on function public.remove_my_upload(uuid) to authenticated;

-- =============================================================================================
-- 13. create_report: the kind, the reporter, and the instant hide.
-- =============================================================================================
-- DROP + CREATE (four defaulted parameters after the old three, so the old build's call still resolves).
-- Every reporter fact is server-derived by the route (getUser(): the id, the confirmed address, its HMAC), and
-- the function stays service-role only, so none of them can be supplied by anyone else.
drop function if exists public.create_report(text, uuid, text);

create function public.create_report(
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
      -- an address a dismissed child-abuse report stands against has lost the hide
      and not exists (
        select 1 from public.reports r
         where r.reporter_hash = p_reporter_hash and r.kind = 'child' and r.status = 'dismissed')
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
  'Files an album or item report (the qr_token is the capability). A child-abuse report of an item from a confirmed address hides the item at once as an operator''s removal (hid_at), never for the event''s host, an address a dismissed child-abuse report bars, or past 3 an address and 5 an event in 24 hours. Answers {report_id, hid, event_id}. Service-role only: the route derives every reporter fact from getUser().';

-- =============================================================================================
-- 14. report_queue_facts: the grid's facts, one jsonb.
-- =============================================================================================
-- The same uploader, as the hold reaches them (admin/reports/actions.ts' readHoldScope): the item's guest row,
-- every row the same account holds in the event, or, for the host's own upload, her other uploads there.
create function public.report_queue_facts(p_media_ids uuid[], p_event_ids uuid[])
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with item as (
    select m.id, m.event_id, m.guest_id, g.user_id
      from public.media m
      left join public.guests g on g.id = m.guest_id
     where m.id = any(p_media_ids)
  ),
  peer as (
    select i.id as item_id, o.id as other_id, (o.legal_hold_at is not null) as held
      from item i
      join public.media o on o.event_id = i.event_id and o.id <> i.id
      left join public.guests og on og.id = o.guest_id
     where (i.guest_id is null and o.guest_id is null)
        or o.guest_id = i.guest_id
        or (i.user_id is not null and og.user_id = i.user_id)
  )
  select jsonb_build_object(
    'items', coalesce((
      select jsonb_object_agg(i.id, jsonb_build_object(
        'more', (select count(*) from peer p where p.item_id = i.id),
        'held', (select count(*) from peer p where p.item_id = i.id and p.held),
        'reports', (select count(*) from public.reports r
                      join peer p on p.other_id = r.media_id
                     where p.item_id = i.id)
      ))
      from item i
    ), '{}'::jsonb),
    'events', coalesce((
      select jsonb_object_agg(e.id, jsonb_build_object(
        'uploads', (select count(*) from public.media m
                     where m.event_id = e.id and m.status <> 'removed'),
        'guests', (select count(*) from public.guests g where g.event_id = e.id)
      ))
      from public.events e
      where e.id = any(p_event_ids)
    ), '{}'::jsonb)
  );
$$;

revoke all on function public.report_queue_facts(uuid[], uuid[]) from public, anon, authenticated;
grant execute on function public.report_queue_facts(uuid[], uuid[]) to service_role;

comment on function public.report_queue_facts(uuid[], uuid[]) is
  'The reports grid''s counts in one jsonb: for each item, the same uploader''s other items in its event (more), how many of those are held (held) and the reports on them (reports); for each event, its uploads not removed and its guest rows. Service-role only; SECURITY INVOKER.';

-- =============================================================================================
-- 15. The proof mail's switch, OFF until his yes.
-- =============================================================================================
insert into public.ops_flags (key, enabled) values ('report_proof_mail_enabled', false)
on conflict (key) do nothing;

-- ── THE ROLLED-BACK CHECK. Proved on the live schema 2026-09-29, before the apply, as ONE execute_sql call:
-- `begin;` + this file + the block below (uncommented) + `select n, step, ok, detail from proof order by n;
-- rollback;`, every step ok (setup, 1 through 10) and nothing left behind (no report_kind, no purge_asked_at,
-- the old create_report, no switch row, profiles_set_updated_at enabled). After the apply, the same block runs
-- alone the same way: `begin;` + the block + that select + `rollback;`. It rides EXISTING rows (the newest event
-- with five live, unheld guest items and no report, hold or takedown in it) and writes only inside the
-- transaction; each step traps its own failure into the `proof` table, so one call reports them all:
--   1. kept_media_ids names an item under an open item report and every item under an open album report, lets
--      them go when the reports close, and keeps a held item.
--   2. held_event_ids answers an event with an open report (item or album) and forgets it at the close.
--   3+4. purge_media_rows deletes none of the kept and leaves the meter; the host's Delete permanently on a
--      reported removal answers purged 1 (her whole selection), the row asked, gone from her RLS read, her
--      Deleted figure and her meter, her restore not_found; after the close the purge takes it with no second
--      decrement.
--   5. A hold with Take it down too: off her meter and every read at once; the operator's restore puts it back.
--   6. The quiet hold: her Hide and Remove land, restore_media refuses it (legal_hold, the discreet words), her
--      Delete permanently asks it (gone for her, off her meter), defer_kept_due_media marks a held removal past
--      its window, and no purge takes it.
--   7. The instant hide: a confirmed child report hides an up item as an operator's removal at hid_at, releases
--      its bytes and answers hid and the event; unconfirmed, the host's own, a fourth from one address and a
--      sixth in one event hide nothing; a dismissed child report bars its address; the close forgets the
--      address and the answer link and keeps the hash; a closed insert never keeps an address.
--   8. Another host's purge_media_now and restore_media reach nothing; anon executes none of this file's
--      functions and authenticated none but purge_media_now, restore_media and restore_event; purge_asked_at is
--      ungranted; the policy carries it; the switch is off; the updated_at trigger is back on.
--   9. report_queue_facts answers its shape.
--   10. Her block counts a quietly held upload as any other and takes it to Deleted; its uploader's own feed
--      keeps it and her delete withdraws it; let_back_in leaves it in Deleted (restore refused).
--
-- create temp table proof (n serial, step text, ok boolean, detail text) on commit drop;
-- create temp table fx (k text primary key, id uuid, bytes bigint, qr text) on commit drop;
--
-- -- ── setup: the newest event with five live, unheld guest items and no report, hold or takedown in it ──
-- do $$
-- declare
--   v_event uuid; v_host uuid; v_qr text; v_other uuid; i int := 0; rec record;
-- begin
--   select e.id, e.host_id, e.qr_token into v_event, v_host, v_qr
--     from public.events e
--    where e.deleted_at is null
--      and (select count(*) from public.media m
--            where m.event_id = e.id and m.status <> 'removed' and m.legal_hold_at is null and m.guest_id is not null) >= 5
--      and not exists (select 1 from public.media m where m.event_id = e.id and (m.legal_hold_at is not null or m.removed_by_admin))
--      and not exists (select 1 from public.reports r where r.event_id = e.id)
--    order by e.created_at desc limit 1;
--   if v_event is null then raise exception 'SETUP: no event fits'; end if;
--   insert into fx values ('event', v_event, null, v_qr), ('host', v_host, null, null);
--   for rec in select m.id, m.file_size_bytes from public.media m
--             where m.event_id = v_event and m.status <> 'removed' and m.legal_hold_at is null and m.guest_id is not null
--             order by m.created_at desc, m.id desc limit 5 loop
--     i := i + 1;
--     insert into fx values (chr(64 + i), rec.id, rec.file_size_bytes, null);
--   end loop;
--   select p.id into v_other from public.profiles p where p.id <> v_host order by p.created_at limit 1;
--   insert into fx values ('other', v_other, null, null);
--   insert into proof (step, ok, detail) values ('setup', true, 'event ' || v_event || ', items A-E');
-- end $$;
--
-- -- ── 1. kept_media_ids: an open item report keeps its item, an open album report its album, a hold its row ──
-- do $$
-- declare a uuid; b uuid; c uuid; d uuid; ev uuid; kept uuid[]; r1 uuid; r2 uuid;
-- begin
--   select id into a from fx where k = 'A'; select id into b from fx where k = 'B';
--   select id into c from fx where k = 'C'; select id into d from fx where k = 'D';
--   select id into ev from fx where k = 'event';
--   insert into public.reports (event_id, media_id, reason) values (ev, a, 'proof: item') returning id into r1;
--   kept := public.kept_media_ids(array[a, b, c, d]);
--   if kept <> array[a] then raise exception 'item report keeps %', kept; end if;
--   insert into public.reports (event_id, media_id, reason) values (ev, null, 'proof: album') returning id into r2;
--   kept := public.kept_media_ids(array[a, b, c, d]);
--   if cardinality(kept) <> 4 then raise exception 'album report keeps % of 4', cardinality(kept); end if;
--   update public.reports set status = 'dismissed' where id in (r1, r2);
--   kept := public.kept_media_ids(array[a, b, c, d]);
--   if cardinality(kept) <> 0 then raise exception 'closed reports still keep %', kept; end if;
--   update public.media set legal_hold_at = now(), legal_hold_reason = 'proof' where id = c;
--   kept := public.kept_media_ids(array[a, b, c, d]);
--   if kept <> array[c] then raise exception 'a hold keeps %', kept; end if;
--   update public.media set legal_hold_at = null, legal_hold_reason = null where id = c;
--   delete from public.reports where id in (r1, r2);
--   insert into proof (step, ok, detail) values ('1 kept_media_ids', true, 'item, album, close, hold');
-- exception when others then
--   insert into proof (step, ok, detail) values ('1 kept_media_ids', false, sqlerrm);
-- end $$;
--
-- -- ── 2. held_event_ids: an open report keeps its event whole, until it closes ──
-- do $$
-- declare ev uuid; a uuid; r1 uuid; ids uuid[];
-- begin
--   select id into ev from fx where k = 'event'; select id into a from fx where k = 'A';
--   ids := public.held_event_ids(array[ev]);
--   if ev = any(ids) then raise exception 'a clean event reads held'; end if;
--   insert into public.reports (event_id, media_id, reason) values (ev, a, 'proof') returning id into r1;
--   ids := public.held_event_ids(array[ev]);
--   if not (ev = any(ids)) then raise exception 'an event with an open item report reads purgeable'; end if;
--   update public.reports set media_id = null where id = r1;
--   ids := public.held_event_ids(array[ev]);
--   if not (ev = any(ids)) then raise exception 'an event with an open album report reads purgeable'; end if;
--   update public.reports set status = 'actioned' where id = r1;
--   ids := public.held_event_ids(array[ev]);
--   if ev = any(ids) then raise exception 'a closed report still keeps its event'; end if;
--   delete from public.reports where id = r1;
--   insert into proof (step, ok, detail) values ('2 held_event_ids', true, 'item, album, close');
-- exception when others then
--   insert into proof (step, ok, detail) values ('2 held_event_ids', false, sqlerrm);
-- end $$;
--
-- -- ── 3 + 4. The host's Delete permanently on a reported removal; purge_media_rows keeps it; after the close ──
-- do $$
-- declare ev uuid; host uuid; other uuid; a uuid; a_bytes bigint; r1 uuid; m0 bigint; m1 bigint; m2 bigint;
--   s0 bigint; s1 bigint; s2 bigint; res jsonb; seen int; freed bigint;
-- begin
--   select id into ev from fx where k = 'event'; select id into host from fx where k = 'host';
--   select id, bytes into a, a_bytes from fx where k = 'A';
--   insert into public.reports (event_id, media_id, reason, kind) values (ev, a, 'proof', 'other') returning id into r1;
--   -- The host removes A herself (a direct PATCH, as the curate group's Remove).
--   perform set_config('request.jwt.claims', json_build_object('sub', host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   update public.media set status = 'removed', removed_at = now() where id = a and status <> 'removed';
--   select count(*) into seen from public.media where id = a and status = 'removed';
--   if seen <> 1 then raise exception 'her Remove did not land'; end if;
--   reset role;
--   select storage_used_bytes into m0 from public.profiles where id = host;
--   select s.standby_bytes into s0 from public.host_storage_summary(host) s;
--   -- 3. purge_media_rows (the sweep's) refuses the reported row, and the meter holds.
--   perform * from public.purge_media_rows(array[a]);
--   select count(*) into seen from public.media where id = a;
--   if seen <> 1 then raise exception 'purge_media_rows deleted a reported row'; end if;
--   select storage_used_bytes into m1 from public.profiles where id = host;
--   if m1 <> m0 then raise exception 'the meter moved on a refused purge: % -> %', m0, m1; end if;
--   -- 4. Her Delete permanently: her whole selection answers purged, the row waits, asked.
--   set local role authenticated;
--   res := public.purge_media_now(array[a]);
--   if (res->>'purged')::int <> 1 then raise exception 'purge_media_now answered %', res; end if;
--   select count(*) into seen from public.media where id = a;
--   if seen <> 0 then raise exception 'she still reads an asked row'; end if;
--   res := public.restore_media(a);
--   if res->>'reason' <> 'not_found' then raise exception 'her restore of an asked row answered %', res; end if;
--   reset role;
--   select count(*) into seen from public.media where id = a and purge_asked_at is not null and status = 'removed';
--   if seen <> 1 then raise exception 'the reported row did not wait, asked'; end if;
--   select storage_used_bytes into m2 from public.profiles where id = host;
--   if m2 <> greatest(0, m0 - a_bytes) then raise exception 'meter % -> %, expected - %', m0, m2, a_bytes; end if;
--   select s.standby_bytes into s1 from public.host_storage_summary(host) s;
--   if s1 <> s0 - a_bytes then raise exception 'her Deleted figure % -> %, expected - %', s0, s1, a_bytes; end if;
--   -- The report closes; the sweep's purge takes it, with no second decrement.
--   update public.reports set status = 'dismissed' where id = r1;
--   select coalesce(sum(p.freed_bytes), 0) into freed from public.purge_media_rows(array[a]) p;
--   select count(*) into seen from public.media where id = a;
--   if seen <> 0 then raise exception 'the closed report''s asked row was not purged'; end if;
--   select storage_used_bytes into m1 from public.profiles where id = host;
--   if m1 <> m2 or freed <> 0 then raise exception 'second decrement: meter % -> %, freed %', m2, m1, freed; end if;
--   insert into proof (step, ok, detail) values ('3+4 reported removal', true,
--     format('meter %s -> %s (A %s bytes); Deleted %s -> %s', m0, m2, a_bytes, s0, s1));
-- exception when others then
--   insert into proof (step, ok, detail) values ('3+4 reported removal', false, sqlerrm);
-- end $$;
-- reset role;
--
-- -- ── 5. Hold with Take it down too: off her meter at once, out of every read; the operator's restore puts it back ──
-- do $$
-- declare host uuid; b uuid; b_bytes bigint; m0 bigint; m1 bigint; m2 bigint; seen int; a0 bigint; a1 bigint;
-- begin
--   select id into host from fx where k = 'host'; select id, bytes into b, b_bytes from fx where k = 'B';
--   select storage_used_bytes into m0 from public.profiles where id = host;
--   select s.active_bytes into a0 from public.host_storage_summary(host) s;
--   -- removalUpdate() then the hold, as holdFromReportAction writes them.
--   update public.media set status = 'removed', removed_at = now(), removed_by_admin = true where id = b;
--   update public.media set legal_hold_at = now(), legal_hold_reason = 'proof' where id = b;
--   select storage_used_bytes into m1 from public.profiles where id = host;
--   if m1 <> greatest(0, m0 - b_bytes) then raise exception 'takedown meter % -> %', m0, m1; end if;
--   select s.active_bytes into a1 from public.host_storage_summary(host) s;
--   if a1 <> a0 - b_bytes then raise exception 'active % -> %', a0, a1; end if;
--   perform set_config('request.jwt.claims', json_build_object('sub', host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   select count(*) into seen from public.media where id = b;
--   if seen <> 0 then raise exception 'she reads a held takedown'; end if;
--   reset role;
--   -- restoreUpdate(): the operator brings it back after review, the hold standing.
--   update public.media set status = 'approved', removed_at = null, removed_by_admin = false where id = b;
--   select storage_used_bytes into m2 from public.profiles where id = host;
--   if m2 <> m0 then raise exception 'restore meter % -> % (expected %)', m1, m2, m0; end if;
--   update public.media set legal_hold_at = null, legal_hold_reason = null where id = b;
--   insert into proof (step, ok, detail) values ('5 hold + take down', true, format('meter %s -> %s -> %s', m0, m1, m2));
-- exception when others then
--   insert into proof (step, ok, detail) values ('5 hold + take down', false, sqlerrm);
-- end $$;
-- reset role;
--
-- -- ── 6. The quiet hold: her Remove lands, her restore is refused, her Delete permanently asks, the sweep defers ──
-- do $$
-- declare host uuid; c uuid; c_bytes bigint; res jsonb; seen int; m0 bigint; m1 bigint; n int;
-- begin
--   select id into host from fx where k = 'host'; select id, bytes into c, c_bytes from fx where k = 'C';
--   update public.media set legal_hold_at = now(), legal_hold_reason = 'proof: quiet' where id = c;
--   perform set_config('request.jwt.claims', json_build_object('sub', host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   update public.media set status = 'hidden' where id = c and status <> 'removed';
--   select count(*) into seen from public.media where id = c and status = 'hidden';
--   if seen <> 1 then raise exception 'her Hide on a quietly held item did not land'; end if;
--   update public.media set status = 'removed', removed_at = now() where id = c and status <> 'removed';
--   select count(*) into seen from public.media where id = c and status = 'removed';
--   if seen <> 1 then raise exception 'her Remove on a quietly held item did not land'; end if;
--   res := public.restore_media(c);
--   if res->>'reason' <> 'legal_hold' then raise exception 'restore of a held removal answered %', res; end if;
--   reset role;
--   select storage_used_bytes into m0 from public.profiles where id = host;
--   set local role authenticated;
--   res := public.purge_media_now(array[c]);
--   if (res->>'purged')::int <> 1 then raise exception 'purge_media_now on a held removal answered %', res; end if;
--   select count(*) into seen from public.media where id = c;
--   if seen <> 0 then raise exception 'she still reads a held row she deleted permanently'; end if;
--   reset role;
--   select storage_used_bytes into m1 from public.profiles where id = host;
--   if m1 <> greatest(0, m0 - c_bytes) then raise exception 'meter % -> %', m0, m1; end if;
--   -- Undo the ask (the meter comes back), age the removal past its window, and let the sweep's deferral find it.
--   update public.media set purge_asked_at = null, removed_at = now() - interval '31 days' where id = c;
--   n := public.defer_kept_due_media();
--   select count(*) into seen from public.media where id = c and purge_asked_at is not null;
--   if n < 1 or seen <> 1 then raise exception 'defer marked % (C asked: %)', n, seen; end if;
--   perform * from public.purge_media_rows(array[c]);
--   select count(*) into seen from public.media where id = c;
--   if seen <> 1 then raise exception 'a held row was purged'; end if;
--   insert into proof (step, ok, detail) values ('6 quiet hold', true, format('meter %s -> %s; deferred %s', m0, m1, n));
-- exception when others then
--   insert into proof (step, ok, detail) values ('6 quiet hold', false, sqlerrm);
-- end $$;
-- reset role;
--
-- -- ── 7. The instant hide, its limits, its bar, and the close that forgets ──
-- do $$
-- declare ev uuid; v_qr text; host uuid; b uuid; b_bytes bigint; d uuid; res jsonb; m0 bigint; m1 bigint;
--   v_status text; v_admin boolean; v_removed timestamptz; v_hid timestamptz; rid uuid; stranger uuid := gen_random_uuid();
--   i int; seen int;
-- begin
--   select fx.id, fx.qr into ev, v_qr from fx where fx.k = 'event'; select id into host from fx where k = 'host';
--   select id, bytes into b, b_bytes from fx where k = 'B'; select id into d from fx where k = 'D';
--   select storage_used_bytes into m0 from public.profiles where id = host;
--   -- a. confirmed, child, an up item: hidden at once, as an operator's removal.
--   res := public.create_report(v_qr, b, 'proof', 'child', stranger, 'Proof@Example.com', 'hash-a');
--   if not (res->>'hid')::boolean then raise exception 'a confirmed child report did not hide: %', res; end if;
--   if (res->>'event_id')::uuid is distinct from ev then raise exception 'the answer names event %', res->>'event_id'; end if;
--   rid := (res->>'report_id')::uuid;
--   select status::text, removed_by_admin, removed_at into v_status, v_admin, v_removed from public.media where id = b;
--   select hid_at into v_hid from public.reports where id = rid;
--   if v_status <> 'removed' or not v_admin or v_removed <> v_hid then
--     raise exception 'the hide is not an operator''s removal at hid_at: % % % %', v_status, v_admin, v_removed, v_hid;
--   end if;
--   select storage_used_bytes into m1 from public.profiles where id = host;
--   if m1 <> greatest(0, m0 - b_bytes) then raise exception 'hide meter % -> %', m0, m1; end if;
--   select count(*) into seen from public.reports where id = rid and reporter_email = 'proof@example.com'
--      and reporter_hash = 'hash-a' and reporter_signed_in and kind = 'child';
--   if seen <> 1 then raise exception 'the reporter was not kept as filed'; end if;
--   -- b. unconfirmed: filed, heads the queue, hides nothing.
--   res := public.create_report(v_qr, d, null, 'child');
--   if (res->>'hid')::boolean then raise exception 'an unconfirmed report hid'; end if;
--   -- c. the event's own host: never.
--   res := public.create_report(v_qr, d, null, 'child', host, 'host@example.com', 'hash-host');
--   if (res->>'hid')::boolean then raise exception 'the host triggered an operator''s removal'; end if;
--   -- d. a fourth from one address in 24 hours.
--   for i in 1..3 loop
--     insert into public.reports (event_id, reason, kind, reporter_hash, hid_at)
--     values (ev, 'proof limit', 'child', 'hash-busy', now() - interval '1 hour');
--   end loop;
--   res := public.create_report(v_qr, d, null, 'child', stranger, 'busy@example.com', 'hash-busy');
--   if (res->>'hid')::boolean then raise exception 'a fourth hide from one address passed'; end if;
--   -- e. a sixth in one event in 24 hours (b's hide and d's three make four; one more makes five).
--   insert into public.reports (event_id, reason, kind, reporter_hash, hid_at)
--   values (ev, 'proof limit', 'child', 'hash-other', now() - interval '1 hour');
--   res := public.create_report(v_qr, d, null, 'child', stranger, 'fresh@example.com', 'hash-fresh');
--   if (res->>'hid')::boolean then raise exception 'a sixth hide in one event passed'; end if;
--   delete from public.reports where reason = 'proof limit';
--   -- f. the bar: an address a dismissed child-abuse report stands against.
--   insert into public.reports (event_id, reason, kind, reporter_hash, status)
--   values (ev, 'proof bar', 'child', 'hash-barred', 'dismissed');
--   res := public.create_report(v_qr, d, null, 'child', stranger, 'barred@example.com', 'hash-barred');
--   if (res->>'hid')::boolean then raise exception 'a barred address hid'; end if;
--   -- ...and with the limits and the bar clear, d does hide.
--   res := public.create_report(v_qr, d, null, 'child', stranger, 'clear@example.com', 'hash-clear');
--   if not (res->>'hid')::boolean then raise exception 'a clear address did not hide d: %', res; end if;
--   -- g. the close forgets the address and the answer link, and keeps the hash.
--   update public.reports set proof_token_hash = 'token-proof' where id = rid;
--   update public.reports set status = 'dismissed' where id = rid;
--   select count(*) into seen from public.reports where id = rid and reporter_email is null
--      and proof_token_hash is null and reporter_hash = 'hash-a';
--   if seen <> 1 then raise exception 'the close did not forget the reporter'; end if;
--   -- h. a closed insert never keeps one either.
--   insert into public.reports (event_id, reason, status, reporter_email) values (ev, 'proof', 'actioned', 'x@example.com')
--   returning id into rid;
--   select count(*) into seen from public.reports where id = rid and reporter_email is null;
--   if seen <> 1 then raise exception 'a closed insert kept an address'; end if;
--   insert into proof (step, ok, detail) values ('7 instant hide', true, format('meter %s -> %s', m0, m1));
-- exception when others then
--   insert into proof (step, ok, detail) values ('7 instant hide', false, sqlerrm);
-- end $$;
--
-- -- ── 8. Another host and the client roles reach nothing new ──
-- do $$
-- declare other uuid; c uuid; res jsonb; fns text[] := array[
--   'public.kept_media_ids(uuid[])', 'public.defer_kept_due_media()', 'public.report_queue_facts(uuid[], uuid[])',
--   'public.media_release_meter()', 'public.reports_forget_reporter()',
--   'public.create_report(text, uuid, text, public.report_kind, uuid, text, text)',
--   'public.purge_media_rows(uuid[])', 'public.held_event_ids(uuid[])', 'public.standby_hosts(uuid, integer)',
--   'public.host_storage_summary(uuid)', 'public.guard_media_privileged_transitions()'];
--   f text; bad text := '';
-- begin
--   select id into other from fx where k = 'other'; select id into c from fx where k = 'C';
--   perform set_config('request.jwt.claims', json_build_object('sub', other, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   res := public.purge_media_now(array[c]);
--   if (res->>'purged')::int <> 0 then raise exception 'another host purged: %', res; end if;
--   res := public.restore_media(c);
--   if res->>'reason' <> 'not_found' then raise exception 'another host restored: %', res; end if;
--   reset role;
--   foreach f in array fns loop
--     if has_function_privilege('anon', f, 'execute') then bad := bad || ' anon:' || f; end if;
--     if has_function_privilege('authenticated', f, 'execute') then bad := bad || ' auth:' || f; end if;
--   end loop;
--   foreach f in array array['public.purge_media_now(uuid[])', 'public.restore_media(uuid)', 'public.restore_event(uuid)'] loop
--     if has_function_privilege('anon', f, 'execute') then bad := bad || ' anon:' || f; end if;
--     if not has_function_privilege('authenticated', f, 'execute') then bad := bad || ' lost-auth:' || f; end if;
--   end loop;
--   if has_column_privilege('authenticated', 'public.media', 'purge_asked_at', 'select') then bad := bad || ' select:purge_asked_at'; end if;
--   if has_column_privilege('authenticated', 'public.media', 'purge_asked_at', 'update') then bad := bad || ' update:purge_asked_at'; end if;
--   if (select qual from pg_policies where schemaname = 'public' and tablename = 'media' and policyname = 'media_host_all')
--      not like '%purge_asked_at IS NULL%' then bad := bad || ' policy'; end if;
--   if (select enabled from public.ops_flags where key = 'report_proof_mail_enabled') then bad := bad || ' switch-on'; end if;
--   if (select count(*) from pg_trigger where tgname = 'profiles_set_updated_at' and tgenabled = 'O') <> 1 then
--     bad := bad || ' updated_at-trigger-left-off'; end if;
--   if bad <> '' then raise exception 'grants: %', bad; end if;
--   insert into proof (step, ok, detail) values ('8 another host, grants, policy, switch', true, 'none reached');
-- exception when others then
--   insert into proof (step, ok, detail) values ('8 another host, grants, policy, switch', false, sqlerrm);
-- end $$;
-- reset role;
--
-- -- ── 9. report_queue_facts answers its shape ──
-- do $$
-- declare ev uuid; d uuid; j jsonb;
-- begin
--   select id into ev from fx where k = 'event'; select id into d from fx where k = 'D';
--   j := public.report_queue_facts(array[d], array[ev]);
--   if (j->'items'->(d::text)->>'more') is null or (j->'events'->(ev::text)->>'uploads') is null then
--     raise exception 'facts shape: %', j;
--   end if;
--   insert into proof (step, ok, detail) values ('9 report_queue_facts', true, j::text);
-- exception when others then
--   insert into proof (step, ok, detail) values ('9 report_queue_facts', false, sqlerrm);
-- end $$;
--
-- -- ── 10. Her block takes a quietly held upload like any other; its uploader's feed keeps it; a restore refuses it ──
-- do $$
-- declare ev uuid; host uuid; e uuid; g uuid; uid uuid; prior text; res jsonb; n0 int; n1 int; seen int; v_block uuid;
-- begin
--   -- The subject: the newest approved upload a signed-in guest (never the host) sent to a live event with no
--   -- block, hold or takedown in it, so her own feed and delete are checked too; else E, those two unchecked.
--   select m.id, m.event_id, m.guest_id, gu.user_id, ev0.host_id into e, ev, g, uid, host
--     from public.media m
--     join public.events ev0 on ev0.id = m.event_id and ev0.deleted_at is null
--     join public.guests gu on gu.id = m.guest_id
--    where m.status = 'approved' and m.legal_hold_at is null and not m.removed_by_admin
--      and gu.user_id is not null and gu.user_id <> ev0.host_id
--      and not exists (select 1 from public.event_blocks b where b.event_id = ev0.id)
--      and not exists (select 1 from public.media o
--                       where o.event_id = ev0.id and (o.legal_hold_at is not null or o.removed_by_admin))
--    order by m.created_at desc limit 1;
--   if e is null then
--     select id into ev from fx where k = 'event'; select id into host from fx where k = 'host';
--     select id into e from fx where k = 'E';
--     select m.guest_id into g from public.media m where m.id = e;
--     select gu.user_id into uid from public.guests gu where gu.id = g;
--   end if;
--   select m.status::text into prior from public.media m where m.id = e;
--   perform set_config('request.jwt.claims', json_build_object('sub', host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   res := public.block_from_event(p_guest_id := g, p_preview := true);
--   if res->>'reason' = 'not_a_guest' then raise exception 'SETUP 10: E''s uploader cannot be blocked (%)', res; end if;
--   n0 := (res->>'uploads')::int;
--   reset role;
--   update public.media set legal_hold_at = now(), legal_hold_reason = 'proof: quiet block' where id = e;
--   set local role authenticated;
--   res := public.block_from_event(p_guest_id := g, p_preview := true);
--   n1 := (res->>'uploads')::int;
--   if n1 is distinct from n0 then raise exception 'the preview counts % with the hold, % without', n1, n0; end if;
--   res := public.block_from_event(p_guest_id := g);
--   v_block := (res->>'block_id')::uuid;
--   if v_block is null then raise exception 'the block failed: %', res; end if;
--   reset role;
--   select count(*) into seen from public.media
--    where id = e and status = 'removed' and not removed_by_admin and not removed_by_uploader;
--   if seen <> 1 then raise exception 'the block skipped the quietly held upload'; end if;
--   if uid is not null and prior = 'approved' then
--     perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
--     set local role authenticated;
--     select count(*) into seen from public.get_my_uploads(1000) u where u.id = e;
--     if seen <> 1 then raise exception 'her feed dropped the held blocked upload'; end if;
--     reset role;
--   end if;
--   perform set_config('request.jwt.claims', json_build_object('sub', host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   res := public.let_back_in(v_block, true);
--   reset role;
--   select count(*) into seen from public.media where id = e and status = 'removed' and legal_hold_at is not null;
--   if seen <> 1 then raise exception 'let_back_in restored a held upload: %', res; end if;
--   -- ...and, blocked again, her own delete withdraws it like any other blocked upload.
--   if uid is not null and prior = 'approved' then
--     update public.media set status = 'approved', removed_at = null where id = e;
--     perform set_config('request.jwt.claims', json_build_object('sub', host, 'role', 'authenticated')::text, true);
--     set local role authenticated;
--     res := public.block_from_event(p_guest_id := g);
--     reset role;
--     perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
--     set local role authenticated;
--     res := public.remove_my_upload(e);
--     reset role;
--     select count(*) into seen from public.media where id = e and removed_by_uploader;
--     if seen <> 1 then raise exception 'her delete did not withdraw the held blocked upload: %', res; end if;
--   end if;
--   insert into proof (step, ok, detail) values ('10 quiet hold and the block', true,
--     format('preview %s = %s; her feed and delete checked: %s', n0, n1, uid is not null and prior = 'approved'));
-- exception when others then
--   insert into proof (step, ok, detail) values ('10 quiet hold and the block', false, sqlerrm);
-- end $$;
-- reset role;
