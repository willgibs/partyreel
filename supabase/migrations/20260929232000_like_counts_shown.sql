-- =============================================================================================
-- THE HOST'S LIKE COUNTS ANSWER ONLY WHAT HER SURFACES SHOW (lane `crumbs-21`, triage-wiring's find).
--
-- The finding: get_event_like_counts answered a count for every liked item of her event, an
-- operator's takedown and a guest's withdrawal included. Her pages draw only the statuses they show,
-- so no surface ever printed one, but the function is hers to call straight through PostgREST
-- (authenticated, lint 0029), and there it named ids no surface shows her: a takedown her own policy
-- hides from her whole (media_host_all), and a withdrawal that is final for her too.
--
-- ★ THE RULE: A COUNT ONLY FOR A ROW SHE CAN MEET. Three conjuncts, each with its one home:
--   * never an operator's removal, `not (status = 'removed' and removed_by_admin)`, and
--   * never an asked row, `purge_asked_at is null`: media_host_all's own two conjuncts (20260929140000),
--     the rows that leave her every read and write; a guard holds this body to the policy's latest
--     USING, so a conjunct the policy gains fails the gate until the counts follow;
--   * never a withdrawal, `not (status = 'removed' and removed_by_uploader)`: the product rule her
--     policy leaves to the reads ("gone everywhere", Will 2026-09-23: readRecentlyDeletedMedia keeps it
--     out of her Deleted and restore_media refuses it).
-- Everything else counts exactly as before: her album (approved and hidden), Review (pending) and her
-- Deleted (her own removals).
--
-- media_like_counts (20260926300000), the per-window count, is left as it is: service role only, and
-- both its callers ask it only for ids her RLS read returned (readHostLinksBody keeps a count only for
-- a found row; the hub's reel asks only her manifest's playable ids).
--
-- WHAT THIS FILE DOES: get_event_like_counts carried from 20260924010000 verbatim but for the three
-- conjuncts. The signature, the RETURNS TABLE, the language, the volatility, SECURITY DEFINER and the
-- empty search_path are unchanged, so `create or replace` keeps the ACL; the grants are restated as
-- they stand.
--
-- APPLY PROTOCOL (database-security.md -> Workflow):
--   (1) Drift, read-only: the live body's md5 equals its source file's (measured 2026-09-29, the method
--       reproducing the live hash from 20260924010000's text between its dollar quotes):
--         get_event_like_counts(uuid, uuid, integer)   0d23890fb5184818ae8317b7c31fc738
--       select p.oid::regprocedure, md5(p.prosrc), p.proacl from pg_proc p
--         join pg_namespace n on n.oid = p.pronamespace
--        where n.nspname = 'public' and p.proname = 'get_event_like_counts';
--   (2) The rolled-back check at the foot, on the live schema BEFORE the apply, then apply verbatim.
--       The query in (1) then reads (md5 of the body as this file writes it):
--         get_event_like_counts(uuid, uuid, integer)   1c1753a473e24c84ce1be220e8dd3d55
--       and the ACL {postgres, service_role, authenticated}, as before.
--   (3) get_advisors (security). EXPECTED DELTA: none (it stays in 0029, where it was).
--   (4) Nothing to regenerate: the signature and the RETURNS TABLE are unchanged.
-- =============================================================================================

create or replace function public.get_event_like_counts(
  p_event_id uuid,
  p_after uuid default null,
  p_limit integer default null
)
returns table (media_id uuid, like_count integer)
language sql
stable
security definer
set search_path = ''
as $$
  select l.media_id, count(*)::integer
  from public.media_likes l
  join public.media m on m.id = l.media_id
  where m.event_id = p_event_id
    and exists (
      select 1 from public.events e
      where e.id = p_event_id
        and e.host_id = (select auth.uid())
        and e.deleted_at is null
    )
    -- ★ ONLY WHAT HER SURFACES SHOW (20260929232000): media_host_all's two conjuncts, then a withdrawal.
    and not (m.status = 'removed' and m.removed_by_admin)
    and m.purge_asked_at is null
    and not (m.status = 'removed' and m.removed_by_uploader)
    and (p_after is null or l.media_id > p_after)
  group by l.media_id
  order by l.media_id
  limit case when p_limit is null then null else least(p_limit, 1000) end;
$$;

-- Authenticated-only, as before (lint 0029): the host gate is inside.
revoke all on function public.get_event_like_counts(uuid, uuid, integer) from public, anon, authenticated;
grant execute on function public.get_event_like_counts(uuid, uuid, integer) to authenticated;

comment on function public.get_event_like_counts(uuid, uuid, integer) is
  'The host''s like counts for her event, one row per liked item she can meet (never an operator''s removal, an asked row or a withdrawal), paged on media_id; zero rows for anyone but the live event''s host.';

-- =============================================================================================
-- THE ROLLED-BACK CHECK. Proved on the live schema BEFORE applying (database-security.md, "An
-- unapplied migration is proved on the live schema"): ONE execute_sql call of `begin;`, this file's
-- statements, then
--   create temp table likes_proof (step text, ok boolean, detail text);
-- the block below, `select step, ok, detail from likes_proof;` and `rollback;`. The block traps its own
-- failure into the proof table, so the rollback always runs. It rides EXISTING rows: the newest live
-- event holding at least six approved photos, six of them turned into each state a count can meet,
-- each liked by the host and by another account.
--
-- Held on 2026-09-29 against the live schema, red first: the block alone, against today's body, failed
-- 'what she sees' ("a count for a row no surface shows her", all six ids counted 2). With this file's
-- statements ahead of it (afterwards the live body read 0d23890f.., the six photos approved and unliked:
-- nothing persisted):
--   setup          | t | event 340fcc7b-6c41-48f6-a143-6ef9f6724f4b, host 6cb5fdb5-ac8a-4c82-83ce-59b5a2cfcd0b, other 3fcf6405-ce4d-46ea-a11c-9ed68194b630
--   what she sees  | t | 2 each for the approved, the hidden and her own removal; nothing for the takedown, the asked row or the withdrawal
--   the gate       | t | a page of 1 reads 1; another account reads 0; anon refused; authenticated-only DEFINER with an empty search_path, as before
--   body           | t | 1c1753a473e24c84ce1be220e8dd3d55 {postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}
-- =============================================================================================
-- do $$
-- declare
--   v_event uuid; v_host uuid; v_other uuid;
--   m_up uuid; m_hidden uuid; m_mine uuid; m_admin uuid; m_asked uuid; m_withdrawn uuid;
--   v_ids uuid[];
--   v_counts jsonb;
--   v_rows integer;
--   v_step text := 'setup';
-- begin
--   select e.id, e.host_id into v_event, v_host from public.events e
--    where e.deleted_at is null
--      and (select count(*) from public.media m where m.event_id = e.id and m.status = 'approved'
--             and not m.removed_by_admin and m.legal_hold_at is null) >= 6
--    order by e.created_at desc limit 1;
--   if v_event is null then raise exception 'SETUP: no event fits'; end if;
--   select p.id into v_other from public.profiles p where p.id <> v_host order by p.created_at limit 1;
--   select array_agg(x.id order by x.created_at desc, x.id) into v_ids
--     from (select m.id, m.created_at from public.media m
--            where m.event_id = v_event and m.status = 'approved' and not m.removed_by_admin
--              and m.legal_hold_at is null
--            order by m.created_at desc, m.id limit 6) x;
--   m_up := v_ids[1]; m_hidden := v_ids[2]; m_mine := v_ids[3];
--   m_admin := v_ids[4]; m_asked := v_ids[5]; m_withdrawn := v_ids[6];
--   -- Each state, as its own writer leaves it (the provenance trigger derives the rest).
--   update public.media set status = 'hidden' where id = m_hidden;
--   update public.media set status = 'removed', removed_at = now() where id = m_mine;
--   update public.media set status = 'removed', removed_at = now(), removed_by_admin = true where id = m_admin;
--   update public.media set status = 'removed', removed_at = now(), purge_asked_at = now() where id = m_asked;
--   update public.media set status = 'removed', removed_at = now(), removed_by_uploader = true where id = m_withdrawn;
--   insert into public.media_likes (media_id, user_id, liked_at)
--   select m.id, u.id, now() from unnest(v_ids) as m(id) cross join (values (v_host), (v_other)) as u(id)
--   on conflict do nothing;
--   insert into likes_proof values ('setup', true, format('event %s, host %s, other %s; six photos: up %s, hidden %s, her removal %s, takedown %s, asked %s, withdrawn %s', v_event, v_host, v_other, m_up, m_hidden, m_mine, m_admin, m_asked, m_withdrawn));
--
--   -- ── 1. The host reads a count for exactly what her surfaces show. ──
--   v_step := 'what she sees';
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   select coalesce(jsonb_object_agg(c.media_id::text, c.like_count), '{}'::jsonb) into v_counts
--     from public.get_event_like_counts(v_event, null, null) c
--    where c.media_id = any (v_ids);
--   reset role;
--   if (v_counts ->> m_up::text)::int is distinct from 2
--      or (v_counts ->> m_hidden::text)::int is distinct from 2
--      or (v_counts ->> m_mine::text)::int is distinct from 2 then
--     raise exception 'FAIL: a row she sees lost its count %', v_counts;
--   end if;
--   if (v_counts -> m_admin::text) is not null or (v_counts -> m_asked::text) is not null
--      or (v_counts -> m_withdrawn::text) is not null then
--     raise exception 'FAIL: a count for a row no surface shows her %', v_counts;
--   end if;
--   insert into likes_proof values ('what she sees', true, format('the host reads 2 each for the approved, the hidden and her own removal; nothing for the takedown, the asked row or the withdrawal: %s', v_counts));
--
--   -- ── 2. The pages walk it whole, and anyone else reads nothing. ──
--   v_step := 'the gate';
--   perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   select count(*) into v_rows from public.get_event_like_counts(v_event, null, 1);
--   reset role;
--   if v_rows <> 1 then raise exception 'FAIL: a page of 1 read % rows', v_rows; end if;
--   perform set_config('request.jwt.claims', json_build_object('sub', v_other, 'role', 'authenticated')::text, true);
--   set local role authenticated;
--   select count(*) into v_rows from public.get_event_like_counts(v_event, null, null);
--   reset role;
--   if v_rows <> 0 then raise exception 'FAIL: another account read % rows', v_rows; end if;
--   set local role anon;
--   begin
--     perform public.get_event_like_counts(v_event, null, null);
--     raise exception 'FAIL: anon ran it';
--   exception when insufficient_privilege then null;
--   end;
--   reset role;
--   if has_function_privilege('public', 'public.get_event_like_counts(uuid, uuid, integer)', 'EXECUTE')
--      or not has_function_privilege('authenticated', 'public.get_event_like_counts(uuid, uuid, integer)', 'EXECUTE')
--      or not (select prosecdef from pg_proc where oid = 'public.get_event_like_counts(uuid, uuid, integer)'::regprocedure)
--      or (select proconfig from pg_proc where oid = 'public.get_event_like_counts(uuid, uuid, integer)'::regprocedure) <> array['search_path=""'] then
--     raise exception 'FAIL: the grants or the mode moved';
--   end if;
--   insert into likes_proof values ('the gate', true, 'a page of 1 reads 1; another account reads 0; anon refused; authenticated-only DEFINER with an empty search_path, as before');
-- exception when others then
--   insert into likes_proof values (v_step, false, sqlerrm);
-- end;
-- $$;
