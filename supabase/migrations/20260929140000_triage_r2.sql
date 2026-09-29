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
--      still refuses a held row (in the discreet words it always used).
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
-- create_report 20260602183720 (live's body is that one less its one comment line; md5-checked 2026-09-29).
--
-- APPLY PROTOCOL (database-security.md -> Workflow): (1) the bodies before, for the diff:
--   select p.oid::regprocedure, md5(regexp_replace(p.prosrc, '\s+', ' ', 'g')), p.proacl from pg_proc p
--     join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname in
--     ('create_report', 'purge_media_rows', 'purge_media_now', 'restore_media', 'held_event_ids', 'standby_hosts',
--      'host_storage_summary', 'restore_event', 'guard_media_privileged_transitions') order by 1;
-- (2) apply verbatim; (3) the same read after (the ACLs as restated below; create_report's new signature
-- service-role only); (4) get_advisors, EXPECTED DELTA: NONE (every new function is INVOKER or a trigger's,
-- EXECUTE revoked from every client role; no table, no policy added); (5) the rolled-back check at the foot;
-- (6) regenerate src/lib/db/types.ts (reports gains ten columns and `report_kind`, media gains `purge_asked_at`,
-- create_report its parameters, and the four new functions appear), then drop the lane's typed seams named in
-- its handoff. ★ DEPLOY RIGHT AFTER THE APPLY: the build before this lane never asks `kept_media_ids`, so its
-- purge would delete an open-reported item's OBJECT while this SQL keeps its row. The build after it is safe on
-- either side (its report route falls back to the three-argument call while the new one is missing).

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
-- 12. create_report: the kind, the reporter, and the instant hide.
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
-- 13. report_queue_facts: the grid's facts, one jsonb.
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
-- 14. The proof mail's switch, OFF until his yes.
-- =============================================================================================
insert into public.ops_flags (key, enabled) values ('report_proof_mail_enabled', false)
on conflict (key) do nothing;

-- ── THE ROLLED-BACK CHECK (proved on the live schema 2026-09-29 inside `begin; <this file>; … rollback;`
-- in one execute_sql call, and re-run through the Supabase MCP after the apply: the steps below, each DO block
-- trapping its own failure into the `proof` table, then `select * from proof; rollback;`). It rides EXISTING
-- rows (the newest event with three live, unheld items and no report, hold or takedown in it) and writes only
-- inside the transaction: an item report and its close, an album report, a hold with and without Take it down
-- too, the host's Remove and Delete permanently of each, every storage figure at each step, the instant hide's
-- limits and its bar, and another host and anon refused. The full script is the lane's
-- (_scratch/triage-r2-wiring/proof.sql, carried in the handoff); its asserts, one line each:
--   1. kept_media_ids names an item under an open item report and every item under an open album report, and
--      lets them go when the reports close; a held item stays kept.
--   2. held_event_ids answers an event with an open report (item or album) and forgets it at the close.
--   3. purge_media_rows deletes none of the kept, and decrements the meter only for an unreleased row.
--   4. The host's Delete permanently on a reported removal: purged 1 (her whole selection), the row still
--      there and asked, gone from her RLS read, from her Deleted figure and from her meter; her restore_media
--      answers not_found; after the close, the sweep's candidate (asked) is due and purge_media_rows takes it
--      without a second decrement.
--   5. A hold with Take it down too (the operator's removal + the hold): off her meter at once, out of every
--      read; the operator's restore puts the bytes back.
--   6. The quiet hold: the host's Remove lands (her Deleted takes it), restore_media refuses it (legal_hold),
--      her Delete permanently asks it (gone for her), and defer_kept_due_media marks a held removal past its
--      window.
--   7. The instant hide: a confirmed child report hides an up item (status removed, removed_by_admin,
--      removed_at = hid_at), releases its bytes, and answers hid; an unconfirmed one, the host's own, a fourth
--      from one address and a sixth in one event answer hid false and hide nothing; a dismissed child report
--      bars its address; the close forgets the address and the proof token.
--   8. Another host's purge_media_now and restore_media reach nothing, anon executes none of the new functions,
--      and authenticated none but the two it held (purge_media_now, restore_media, restore_event).
