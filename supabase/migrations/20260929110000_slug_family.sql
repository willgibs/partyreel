-- =============================================================================================
-- THE PARTYREEL SLUG FAMILY (lane `crumbs-11`, before launch opens signups).
--
-- set_event_slug refused the reserved words as WHOLE slugs only, so since the free/pro shift gave
-- every plan the custom link, any account could hold /e/partyreel-support, /e/official-partyreel
-- or, the day the demo moves off it, /e/partyreel-demo: a phishing page at a URL our own domain
-- seems to vouch for. It now refuses any slug that CONTAINS the name, read through the two
-- disguises a slug can wear: a hyphen anywhere (party-reel) and a digit for the letter it looks
-- like (p4rtyreel, partyr33l, partyree1, par7yreel). A dropped or doubled letter (partyrel,
-- partyreeel) is deliberately NOT folded: that would refuse ordinary words (party-relay), and a
-- typo is not a disguise. The bare word leaves the array, since the family refuses it.
--
-- WHAT THIS FILE DOES: one create or replace of set_event_slug, carried from its newest definition
-- (20260928130000_free_shift.sql, 3) word for word but for 'partyreel' out of the array and the one
-- family clause after it. The literals are src/lib/constants/reserved-slugs.ts's BRAND_STEM and
-- BRAND_FOLD, and its sentence BRAND_NAME_MESSAGE; tiers-sql.test.ts fails the gate when the two
-- halves differ. Same signature, same RETURNS, same grants (restated as the shift wrote them).
--
-- ★ A LINK ALREADY HELD KEEPS WORKING. Read live before writing this (2026-09-29): the one custom
-- slug the family refuses is the demo's own `partyreel-demo` (event 2485e1e6, "Partyreel Demo").
-- Nothing re-reads a stored slug against the rule (get_event_by_qr_token matches any stored slug),
-- so it stays and resolves; the rule refuses only the next SET, the demo's own re-set included.
-- Once it is released, no account can claim it. The app shows a held slug as current, not refused.
--
-- APPLY PROTOCOL (database-security.md -> Workflow):
--   (1) Drift, read-only: set_event_slug's live body is its newest definition's (measured
--       2026-09-29, 2370 characters):
--         set_event_slug(uuid,text)              89cb34de89b286388861d6a6f288766a  (20260928130000)
--       select p.oid::regprocedure, md5(p.prosrc) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--        where n.nspname = 'public' and p.proname = 'set_event_slug';
--   (2) The rolled-back check at the foot, on the live schema BEFORE the apply (it held there on
--       2026-09-29 with this file's final text; its rows are quoted with it), then apply verbatim. The
--       query in (1) then reads (md5(prosrc), read inside that check's transaction after this file ran,
--       and hashed from this file's body locally):
--         set_event_slug(uuid,text)              1b1e914e7682ac46c533ff78e37de11f
--   (3) The grants, as the file restates them and as they stand live: postgres, service_role and
--       authenticated execute; never anon, never PUBLIC.
--   (4) get_advisors (security). EXPECTED DELTA: NONE (set_event_slug stays in 0029, authenticated
--       only).
--   (5) No types to regenerate: the signature and the RETURNS are unchanged.
-- =============================================================================================

create or replace function public.set_event_slug(p_event_id uuid, p_slug text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event public.events;
  v_slug text;
begin
  select * into v_event from public.events
    where id = p_event_id and host_id = (select auth.uid()) and deleted_at is null;
  if not found then
    raise exception 'Event not found.' using errcode = 'no_data_found';
  end if;

  v_slug := lower(trim(coalesce(p_slug, '')));

  -- Format (defense in depth; the zod schema is the primary UX gate).
  if length(v_slug) < 3 or length(v_slug) > 50 then
    raise exception 'Custom links are 3 to 50 characters.' using errcode = 'check_violation';
  end if;
  if v_slug !~ '^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$' then
    raise exception 'Use lowercase letters, numbers, and hyphens only.' using errcode = 'check_violation';
  end if;
  -- A 32-hex slug could shadow the qr_token namespace — reject it (the resolver also prefers
  -- qr_token, but this removes any ambiguity and stops a host claiming a token-looking slug).
  if v_slug ~ '^[0-9a-f]{32}$' then
    raise exception 'That custom link is not allowed.' using errcode = 'check_violation';
  end if;
  -- ★ THE RESERVED WORDS, AUTHORITATIVE HERE (the free/pro shift): a free account can hold a
  -- slug now, and nothing stops a host calling this function past the server action.
  if v_slug = any (array[
    'about', 'abuse', 'account', 'admin', 'api', 'app', 'auth', 'billing', 'blog', 'careers',
    'contact', 'dashboard', 'demo', 'design', 'e', 'events', 'features', 'help', 'host',
    'how-it-works', 'legal', 'login', 'logout', 'new', 'official', 'payment',
    'payments', 'press', 'pricing', 'privacy', 'reel', 'refund', 'refunds', 'safety', 'security',
    'settings', 'signup', 'staff', 'status', 'support', 'terms', 'verify', 'welcome', 'www'
  ]) then
    raise exception 'That word is reserved. Try another.' using errcode = 'check_violation';
  end if;
  -- ★ THE BRAND'S FAMILY (20260929110000): a slug that CONTAINS the name is refused, the bare word
  -- included, read with its hyphens dropped and a look-alike digit as its letter (party-reel,
  -- p4rtyr33l), so no account wears /e/partyreel-support. Before the uniqueness check, so a
  -- refused slug never answers "taken".
  if position('partyreel' in translate(v_slug, '4317-', 'aelt')) > 0 then
    raise exception 'The Partyreel name is reserved. Try another.' using errcode = 'check_violation';
  end if;

  -- Uniqueness among LIVE events (the partial unique index is the hard backstop; this
  -- pre-check gives a friendly message). A same-instant race loser surfaces as 23505.
  if exists (
    select 1 from public.events
    where lower(custom_slug) = v_slug and deleted_at is null and id <> p_event_id
  ) then
    raise exception 'That custom link is already taken.' using errcode = 'check_violation';
  end if;

  update public.events set custom_slug = v_slug
    where id = p_event_id and host_id = (select auth.uid());
end;
$$;

revoke execute on function public.set_event_slug(uuid, text) from public, anon;
grant execute on function public.set_event_slug(uuid, text) to authenticated;

-- =============================================================================================
-- THE ROLLED-BACK CHECK. Proved on the live schema BEFORE applying (database-security.md, "An
-- unapplied migration is proved on the live schema"): ONE execute_sql call of `begin;`, this file's
-- statements verbatim, then
--   create temp table slug_family_proof (step text, ok boolean, detail text);
--   create temp table ctx (event_id uuid, demo_id uuid);
--   insert into ctx values (<an existing test event>, <the demo event>);
-- the block below, `select step, ok, detail from slug_family_proof;` and `rollback;`. The block
-- traps its own failure into the proof table, so the rollback always runs, and the call answers the
-- rows. It rides an EXISTING event as its own host (creating one trips enforce_event_limit) and
-- proves, as a host would call it past the server action: the grants and this file's body md5; the
-- family refused, each with the zod schema's sentence under check_violation (the code the app maps
-- to its message); the whole words still refused with theirs; the near misses the family leaves
-- alone accepted; and the demo's held `partyreel-demo` unchanged, still resolving through
-- get_event_by_qr_token as a signed-out visitor, while its own re-set is refused.
--
-- Held on 2026-09-29 against the live schema (event 14bb4318-80cd-4eed-b219-92c097ee16c7, the scale
-- probe; the demo 2485e1e6-12b1-4d02-aee3-1e2bb5d38d4f; set_event_slug read
-- 89cb34de89b286388861d6a6f288766a before and after, and both events' custom_slug read unchanged:
-- nothing persisted):
--   setup           | t | event 14bb4318-80cd-4eed-b219-92c097ee16c7 (host 6cb5fdb5-ac8a-4c82-83ce-59b5a2cfcd0b); the demo holds partyreel-demo
--   grants          | t | anon none, authenticated and service_role execute, PUBLIC none; md5 1b1e914e7682ac46c533ff78e37de11f
--   the family      | t | 13 of 13 refused, 23514 "The Partyreel name is reserved. Try another."
--   the whole words | t | 4 refused, "That word is reserved. Try another."
--   the near misses | t | 6 accepted and written: partyrel-night, party-relay, partyreal-2026, sams-party, reel-party-2026, party-at-the-reel
--   the held link   | t | partyreel-demo unchanged and resolving as anon; its re-set refused (The Partyreel name is reserved. Try another.)
-- The same family step against the live body (this file NOT run first) is the gap itself:
--   the family (control) | f | the live body (89cb34de) wrote partyreel-support official-partyreel party-reel p4rtyr33l
-- =============================================================================================
-- do $$
-- declare
--   v_event uuid := (select event_id from ctx);
--   v_demo uuid := (select demo_id from ctx);
--   v_host uuid;
--   v_demo_host uuid;
--   v_step text := 'setup';
--   v_slug text;
--   v_msg text;
--   v_state text;
--   v_miss text := '';
--   v_n int := 0;
--   v_held text;
--   v_token text;
--   -- The family: the bare word, the name as a part, a hyphen anywhere, each look-alike digit, a
--   -- plural, and mixed case (the setter lowercases before it reads).
--   v_family text[] := array['partyreel', 'partyreel-support', 'official-partyreel',
--     'sams-partyreel-2026', 'party-reel', 'p-a-r-t-y-r-e-e-l', 'my-party-reels', 'p4rtyreel',
--     'partyr33l', 'partyree1', 'par7yreel', 'p4r7yr331-help', 'PartyReel-Demo'];
--   -- What the family leaves alone: a typo, a near word, the halves apart or reversed.
--   v_near text[] := array['partyrel-night', 'party-relay', 'partyreal-2026', 'sams-party',
--     'reel-party-2026', 'party-at-the-reel'];
-- begin
--   select host_id into v_host from public.events where id = v_event and deleted_at is null;
--   select host_id, custom_slug into v_demo_host, v_held from public.events where id = v_demo;
--   if v_host is null or v_demo_host is null then
--     raise exception 'SETUP: an event is missing (% %)', v_event, v_demo;
--   end if;
--   insert into slug_family_proof values ('setup', true,
--     format('event %s (host %s); the demo holds %s', v_event, v_host, v_held));
--
--   -- ── 1. The grants, and the body this file wrote. ──
--   v_step := 'grants';
--   if has_function_privilege('anon', 'public.set_event_slug(uuid, text)', 'execute')
--      or not has_function_privilege('authenticated', 'public.set_event_slug(uuid, text)', 'execute')
--      or not has_function_privilege('service_role', 'public.set_event_slug(uuid, text)', 'execute')
--      or exists (select 1 from pg_proc p, aclexplode(p.proacl) a
--                  where p.oid = 'public.set_event_slug(uuid, text)'::regprocedure and a.grantee = 0) then
--     raise exception 'FAIL: set_event_slug grants';
--   end if;
--   insert into slug_family_proof
--     select 'grants', true, 'anon none, authenticated and service_role execute, PUBLIC none; md5 ' || md5(p.prosrc)
--       from pg_proc p where p.oid = 'public.set_event_slug(uuid, text)'::regprocedure;
--
--   -- ── 2. The family, refused with the brand's sentence, as the host calls it past the action. ──
--   v_step := 'the family';
--   foreach v_slug in array v_family loop
--     v_msg := null; v_state := null;
--     begin
--       perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--       set local role authenticated;
--       perform public.set_event_slug(v_event, v_slug);
--       reset role;
--     exception when others then
--       v_msg := sqlerrm; v_state := sqlstate;
--     end;
--     reset role;
--     if v_state is distinct from '23514' or v_msg is distinct from 'The Partyreel name is reserved. Try another.' then
--       v_miss := v_miss || format(' %s=[%s %s]', v_slug, v_state, v_msg);
--     end if;
--     v_n := v_n + 1;
--   end loop;
--   if v_miss <> '' then raise exception 'FAIL: the family let through:%', v_miss; end if;
--   insert into slug_family_proof values ('the family', true,
--     format('%s of %s refused, 23514 "The Partyreel name is reserved. Try another."', v_n, array_length(v_family, 1)));
--
--   -- ── 3. The whole words, still refused with theirs. ──
--   v_step := 'the whole words';
--   v_n := 0;
--   foreach v_slug in array array['support', 'demo', 'official', 'verify'] loop
--     v_msg := null; v_state := null;
--     begin
--       perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--       set local role authenticated;
--       perform public.set_event_slug(v_event, v_slug);
--       reset role;
--     exception when others then
--       v_msg := sqlerrm; v_state := sqlstate;
--     end;
--     reset role;
--     if v_state is distinct from '23514' or v_msg is distinct from 'That word is reserved. Try another.' then
--       raise exception 'FAIL: the whole word % read [% %]', v_slug, v_state, v_msg;
--     end if;
--     v_n := v_n + 1;
--   end loop;
--   insert into slug_family_proof values ('the whole words', true, format('%s refused, "That word is reserved. Try another."', v_n));
--
--   -- ── 4. The near misses, accepted and written. ──
--   v_step := 'the near misses';
--   v_n := 0;
--   foreach v_slug in array v_near loop
--     perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
--     set local role authenticated;
--     perform public.set_event_slug(v_event, v_slug);
--     reset role;
--     if (select custom_slug from public.events where id = v_event) is distinct from v_slug then
--       raise exception 'FAIL: % was not written', v_slug;
--     end if;
--     v_n := v_n + 1;
--   end loop;
--   insert into slug_family_proof values ('the near misses', true, format('%s accepted and written: %s', v_n, array_to_string(v_near, ', ')));
--
--   -- ── 5. The held link: unchanged, still resolving signed out, its own re-set refused. ──
--   v_step := 'the held link';
--   perform set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
--   set local role anon;
--   select g.qr_token into v_token from public.get_event_by_qr_token(v_held) g;
--   reset role;
--   if v_token is null or v_token is distinct from (select qr_token from public.events where id = v_demo) then
--     raise exception 'FAIL: % no longer resolves to the demo', v_held;
--   end if;
--   v_msg := null; v_state := null;
--   begin
--     perform set_config('request.jwt.claims', json_build_object('sub', v_demo_host, 'role', 'authenticated')::text, true);
--     set local role authenticated;
--     perform public.set_event_slug(v_demo, v_held);
--     reset role;
--   exception when others then
--     v_msg := sqlerrm; v_state := sqlstate;
--   end;
--   reset role;
--   if v_state is distinct from '23514' or (select custom_slug from public.events where id = v_demo) is distinct from v_held then
--     raise exception 'FAIL: the held link read [% %] and now holds %', v_state, v_msg,
--       (select custom_slug from public.events where id = v_demo);
--   end if;
--   insert into slug_family_proof values ('the held link', true,
--     format('%s unchanged and resolving as anon; its re-set refused (%s)', v_held, v_msg));
-- exception when others then
--   reset role;
--   insert into slug_family_proof values (v_step, false, sqlerrm);
-- end $$;
