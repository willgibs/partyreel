-- =============================================================================================
-- THE NEWSLETTER ROW FOLLOWS THE ACCOUNT'S ADDRESS (lane `crumbs-33`; ROADMAP, from `identity-email`).
--
-- Why: "an email change leaves `newsletter_signups` on the old address, so the `/account` marketing switch reads
-- the new one and turning it off cannot remove the old row". The switch reads and removes by the account's
-- address (`isOnNewsletterList`, `removeMyNewsletterSignup`: `profiles.email`, which this trigger already keeps
-- in step), so a row left on the address the account moved away from is one the person can no longer see or take
-- off, and the first newsletter sender would mail an address its owner left. It must be fixed before any sender
-- ships.
--
-- THE CALL (crumbs-33, Will's to overrule): MOVE THE ROW WITH THE CHANGE, here, inside GoTrue's commit, rather
-- than key the switch on the account. The opt-in is the person's consent, not a mailbox's, so it follows them as
-- `guests.email` already does; a row keyed on the account would still hold the old address for a sender to mail,
-- and the only path that sees EVERY change (the two codes, a tapped link opened in another browser, an operator's
-- admin update) is this trigger: the app learns of a link's change only if the same browser lands back on it.
--
-- WHAT CHANGES, one statement pair at the end of `handle_user_email_change`, nothing else:
--   * the list row of the old address (stored `lower(btrim(...))`, capture_guest_email's form) takes the new
--     address, keeping its id, source, event and time;
--   * when the new address is already on the list (an earlier opt-in under it), that row stands and the old one
--     goes: one opt-in for the person, never two, and never a unique violation (which would fail the change);
--   * an account with no row writes nothing (moving never subscribes anyone).
-- The body is 20260926200000's (live's, md5-checked 2026-09-30: eb7330b92650db88984625ec2c2c7825, whitespace
-- collapsed) with only that pair appended; the deletion guard still returns first (a deletion request already took
-- the address off the list), and the WHEN on the trigger still keeps an unchanged address from running the body.
--
-- ★ IT RUNS INSIDE GOTRUE'S OWN TRANSACTION, so it stays trivial: no raise, no dynamic SQL, every name qualified.
-- The move cannot collide by construction (the new address is no other account's, which GoTrue enforces, and
-- capture_guest_email writes only a session's own confirmed address), and the update still sits in its own
-- block that swallows a unique violation, because a failure here would stop every address change.
--
-- SHAPE: `create or replace` with the same signature, return type, language and security mode, so the trigger
-- binding and the ACL stay; the revoke is restated as it stands live (2026-09-30:
-- {postgres=X/postgres,service_role=X/postgres}).
--
-- APPLY PROTOCOL (database-security.md -> Workflow):
--   (1) the body before, for the diff:
--         select p.oid::regprocedure, md5(regexp_replace(p.prosrc, '\s+', ' ', 'g')), p.proacl from pg_proc p
--           join pg_namespace n on n.oid = p.pronamespace
--          where n.nspname = 'public' and p.proname = 'handle_user_email_change';
--       (eb7330b92650db88984625ec2c2c7825);
--   (2) the rolled-back check at the foot, then apply verbatim; (3) the same read after (a new md5, the same
--       ACL); (4) get_advisors, EXPECTED DELTA: NONE (a trigger function, EXECUTE revoked from the client roles,
--       as before); (5) nothing to regenerate (no column or signature moves).
-- ★ NO DEPLOY NEEDED, EITHER ORDER: no code reads anything new; the switch's reads and deletes key on the address
-- the account holds, which is now where its row is.
-- =============================================================================================

create or replace function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  -- The list's own stored form (capture_guest_email: lower and trimmed).
  v_old text := lower(btrim(coalesce(old.email, '')));
  v_new text := lower(btrim(coalesce(new.email, '')));
begin
  -- An account on its way out keeps the nulls its deletion wrote, on the profile and on its rows.
  if exists (
    select 1 from public.profiles p
     where p.id = new.id and p.deletion_requested_at is not null
  ) then
    return null;
  end if;

  update public.profiles p
     set email = new.email
   where p.id = new.id
     and p.email is distinct from new.email;

  update public.guests g
     set email = nullif(btrim(coalesce(new.email, '')), '')
   where g.user_id = new.id
     and g.verified_at is not null
     and g.email is distinct from nullif(btrim(coalesce(new.email, '')), '');

  -- ★ THE NEWSLETTER ROW FOLLOWS THE ADDRESS (crumbs-33): the account's opt-in moves with it, so the /account
  -- switch, which reads and removes by the address the account holds, always finds it. An address already on the
  -- list keeps its own row and the old one goes; an account with no row writes nothing.
  if v_old <> '' and v_new <> '' and v_old <> v_new then
    begin
      update public.newsletter_signups n
         set email = v_new
       where n.email = v_old
         and not exists (select 1 from public.newsletter_signups m where m.email = v_new);
    exception when unique_violation then
      -- The new address joined the list in this instant: its row stands, and the old one goes below.
      null;
    end;
    delete from public.newsletter_signups n where n.email = v_old;
  end if;

  return null;
end;
$$;

revoke execute on function public.handle_user_email_change() from public, anon, authenticated;

comment on function public.handle_user_email_change() is
  'AFTER UPDATE OF email ON auth.users (only when the address changed): the new address reaches profiles.email and guests.email on the account''s verified rows, and the account''s newsletter row moves to it (an address already on the list keeps its own row); never for an account whose deletion is requested. Runs inside GoTrue''s transaction, so it stays trivial.';

-- =============================================================================================
-- THE ROLLED-BACK CHECK. Proved on the live schema BEFORE applying: ONE execute_sql call of `begin;`, this file's
-- statements verbatim, the block below (uncommented) and `select n, step, ok, detail from proof order by n;
-- rollback;`. It makes its own accounts (an auth.users insert fires handle_new_user, as the identity check did)
-- and its own list rows, all under a fresh tag, and changes their addresses the way GoTrue's commit does (one
-- UPDATE of auth.users, with the album's deferred triggers run per statement). Each step traps its own failure:
--   1. a change moves the row: the new address holds it with its id, source, event and time, the old one none;
--      a bystander's row and an unrelated row stay;
--   2. a change to an address already on the list keeps that row and drops the old one, with no error;
--   3. the address in any case or spacing (the list's form is lower and trimmed) still moves its row;
--   4. an account with no row subscribes nobody, and an unchanged address moves nothing;
--   5. an account whose deletion is requested moves nothing (its own nulls stand);
--   6. the shape: one function, DEFINER with an empty search_path, EXECUTE for no client role, its trigger and
--      WHEN unchanged, and the profile and verified-row copies still made.
--
-- Held on 2026-10-01 against the live schema, red first: the block alone, on today's body, failed 1 ("move:
-- not-moved-whole old-stayed") and 3 (the row did not move) and passed 2, 4, 5 and 6 (md5
-- eb7330b92650db88984625ec2c2c7825). With this file's statements, every step ok, 6 reading md5
-- b16d6321c834846c49b424a0029d5967 and {postgres=X/postgres,service_role=X/postgres}; afterwards no `nl-` account,
-- profile or list row stood and the body read eb7330b92650db88984625ec2c2c7825 again. (The live list held no rows
-- that day, so no row an earlier change left behind needs moving.) First on a throwaway Postgres 17 cluster with a
-- stand-in of auth.users, profiles, guests and the list and live's two auth triggers: the same red and green, and
-- three mutations each failed their own step (no merge guard: a unique violation that would stop the change; the
-- raw address, not the list's form; the move before the deletion guard).
-- =============================================================================================
-- create temp table proof (n serial, step text, ok boolean, detail text) on commit drop;
-- create temp table nl (k text primary key, id uuid, email text) on commit drop;
--
-- -- ── setup: three accounts and their rows, under one tag ──
-- do $$
-- declare v_tag text := replace(gen_random_uuid()::text, '-', ''); v_event uuid; v_k text;
-- begin
--   set constraints all immediate;
--   select id into v_event from public.events where deleted_at is null order by created_at desc limit 1;
--   foreach v_k in array array['a', 'b', 'c', 'd', 'e'] loop
--     insert into nl values (v_k, gen_random_uuid(), 'nl-' || v_k || '-' || v_tag || '@example.invalid');
--   end loop;
--   insert into nl values ('a-new', null, 'nl-a-new-' || v_tag || '@example.invalid'),
--                         ('a-taken', null, 'nl-a-taken-' || v_tag || '@example.invalid'),
--                         ('c-new', null, 'NL-C-New-' || v_tag || '@Example.Invalid  '),
--                         ('d-new', null, 'nl-d-new-' || v_tag || '@example.invalid'),
--                         ('e-new', null, 'nl-e-new-' || v_tag || '@example.invalid'),
--                         ('other', null, 'nl-other-' || v_tag || '@example.invalid'),
--                         ('event', v_event, null);
--   -- a: has a row and moves; b: a bystander with a row; c: moves in another case; d: no row; e: being deleted.
--   insert into auth.users (id, email, email_confirmed_at)
--     select id, email, now() from nl where k in ('a', 'b', 'c', 'd', 'e');
--   insert into public.newsletter_signups (email, source, event_id, created_at)
--     select email, 'guest_upload', v_event, now() - interval '9 days' from nl where k in ('a', 'b', 'c', 'e', 'other');
--   insert into proof (step, ok, detail) values ('setup', true, 'tag ' || v_tag);
-- exception when others then
--   insert into proof (step, ok, detail) values ('setup', false, sqlerrm);
-- end $$;
--
-- -- ── 1. a change moves the row, whole ──
-- do $$
-- declare v_a uuid; v_old text; v_new text; before public.newsletter_signups; after public.newsletter_signups; bad text := '';
-- begin
--   select id, email into v_a, v_old from nl where k = 'a'; select email into v_new from nl where k = 'a-new';
--   select * into before from public.newsletter_signups where email = v_old;
--   update auth.users set email = v_new where id = v_a;
--   select * into after from public.newsletter_signups where email = v_new;
--   if after.id is distinct from before.id or after.source is distinct from before.source
--      or after.event_id is distinct from before.event_id or after.created_at is distinct from before.created_at
--     then bad := bad || ' not-moved-whole'; end if;
--   if exists (select 1 from public.newsletter_signups where email = v_old) then bad := bad || ' old-stayed'; end if;
--   if (select email from public.profiles where id = v_a) is distinct from v_new then bad := bad || ' profile'; end if;
--   if not exists (select 1 from public.newsletter_signups where email = (select email from nl where k = 'b'))
--      or not exists (select 1 from public.newsletter_signups where email = (select email from nl where k = 'other'))
--     then bad := bad || ' bystander-moved'; end if;
--   if bad <> '' then raise exception 'move:%', bad; end if;
--   insert into proof (step, ok, detail) values ('1 a change moves the row', true, 'row ' || after.id || ' now on the new address');
-- exception when others then
--   insert into proof (step, ok, detail) values ('1 a change moves the row', false, sqlerrm);
-- end $$;
--
-- -- ── 2. onto an address already on the list: one row, the one that was there ──
-- do $$
-- declare v_a uuid; v_cur text; v_taken text; v_kept uuid; n int;
-- begin
--   select id into v_a from nl where k = 'a'; select email into v_cur from nl where k = 'a-new';
--   select email into v_taken from nl where k = 'a-taken';
--   insert into public.newsletter_signups (email, source) values (v_taken, 'earlier') returning id into v_kept;
--   update auth.users set email = v_taken where id = v_a;
--   select count(*) into n from public.newsletter_signups where email in (v_cur, v_taken);
--   if n <> 1 then raise exception 'merge: % rows', n; end if;
--   if not exists (select 1 from public.newsletter_signups where id = v_kept and email = v_taken and source = 'earlier')
--     then raise exception 'merge: the standing row did not stand'; end if;
--   insert into proof (step, ok, detail) values ('2 onto a listed address, one row', true, 'kept ' || v_kept);
-- exception when others then
--   insert into proof (step, ok, detail) values ('2 onto a listed address, one row', false, sqlerrm);
-- end $$;
--
-- -- ── 3. any case or spacing ──
-- do $$
-- declare v_c uuid; v_old text; v_new text;
-- begin
--   select id, email into v_c, v_old from nl where k = 'c'; select email into v_new from nl where k = 'c-new';
--   update auth.users set email = v_new where id = v_c;
--   if not exists (select 1 from public.newsletter_signups where email = lower(btrim(v_new)))
--      or exists (select 1 from public.newsletter_signups where email = v_old)
--     then raise exception 'case: the row did not move to %', lower(btrim(v_new)); end if;
--   insert into proof (step, ok, detail) values ('3 any case or spacing', true, lower(btrim(v_new)));
-- exception when others then
--   insert into proof (step, ok, detail) values ('3 any case or spacing', false, sqlerrm);
-- end $$;
--
-- -- ── 4. no row subscribes nobody; an unchanged address moves nothing ──
-- do $$
-- declare v_d uuid; v_new text; v_b uuid; v_b_email text; n int;
-- begin
--   select id into v_d from nl where k = 'd'; select email into v_new from nl where k = 'd-new';
--   update auth.users set email = v_new where id = v_d;
--   if exists (select 1 from public.newsletter_signups where email = v_new) then raise exception 'subscribed someone'; end if;
--   select id, email into v_b, v_b_email from nl where k = 'b';
--   update auth.users set email = email, last_sign_in_at = now() where id = v_b;
--   select count(*) into n from public.newsletter_signups where email = v_b_email;
--   if n <> 1 then raise exception 'an unchanged address moved its row'; end if;
--   insert into proof (step, ok, detail) values ('4 no row, no change: nothing', true, 'ok');
-- exception when others then
--   insert into proof (step, ok, detail) values ('4 no row, no change: nothing', false, sqlerrm);
-- end $$;
--
-- -- ── 5. an account whose deletion is requested moves nothing ──
-- do $$
-- declare v_e uuid; v_old text; v_new text;
-- begin
--   select id, email into v_e, v_old from nl where k = 'e'; select email into v_new from nl where k = 'e-new';
--   update public.profiles set deletion_requested_at = now(), email = null where id = v_e;
--   update auth.users set email = v_new where id = v_e;
--   if exists (select 1 from public.newsletter_signups where email = v_new)
--      or not exists (select 1 from public.newsletter_signups where email = v_old)
--      or (select email from public.profiles where id = v_e) is not null
--     then raise exception 'a deleted account''s row or profile moved'; end if;
--   insert into proof (step, ok, detail) values ('5 a deletion moves nothing', true, 'ok');
-- exception when others then
--   insert into proof (step, ok, detail) values ('5 a deletion moves nothing', false, sqlerrm);
-- end $$;
--
-- -- ── 6. the shape ──
-- do $$
-- declare f text := 'public.handle_user_email_change()'; p record; bad text := ''; n int;
-- begin
--   select count(*) into n from pg_proc pp join pg_namespace ns on ns.oid = pp.pronamespace
--    where ns.nspname = 'public' and pp.proname = 'handle_user_email_change';
--   if n <> 1 then bad := bad || ' overloads:' || n; end if;
--   select pp.prosecdef, pp.proconfig, pp.proacl::text as acl, pp.prosrc into p from pg_proc pp where pp.oid = f::regprocedure;
--   if not p.prosecdef then bad := bad || ' invoker'; end if;
--   if p.proconfig is distinct from array['search_path=""'] then bad := bad || ' search_path'; end if;
--   if p.acl <> '{postgres=X/postgres,service_role=X/postgres}' then bad := bad || ' acl:' || p.acl; end if;
--   if has_function_privilege('anon', f, 'execute') or has_function_privilege('authenticated', f, 'execute')
--     then bad := bad || ' client-callable'; end if;
--   if (select pg_get_triggerdef(t.oid) from pg_trigger t where t.tgname = 'on_auth_user_email_changed' and t.tgrelid = 'auth.users'::regclass)
--      <> 'CREATE TRIGGER on_auth_user_email_changed AFTER UPDATE OF email ON auth.users FOR EACH ROW WHEN (((old.email)::text IS DISTINCT FROM (new.email)::text)) EXECUTE FUNCTION handle_user_email_change()'
--     then bad := bad || ' trigger'; end if;
--   if p.prosrc ~ 'raise|execute ' then bad := bad || ' not-trivial'; end if;
--   if bad <> '' then raise exception 'shape:%', bad; end if;
--   insert into proof (step, ok, detail) values ('6 shape and grants', true,
--     'md5 ' || md5(regexp_replace(p.prosrc, '\s+', ' ', 'g')) || ', ' || p.acl);
-- exception when others then
--   insert into proof (step, ok, detail) values ('6 shape and grants', false, sqlerrm);
-- end $$;
