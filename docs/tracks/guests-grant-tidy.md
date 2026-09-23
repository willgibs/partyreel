---
track: guests-grant-tidy
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "da64829f"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - supabase/migrations/
  - src/lib/db/migration-guards.test.ts
  - docs/systems/database-security.md
  - src/app/api/guests/capture-email/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/ROADMAP.md
  - src/lib/db/types.ts
  - docs/systems/guest-flow.md
---

# lp/guests-grant-tidy

**Goal.** The guests table's last host-facing surface and one stray address write are closed in SQL: the host's now-unread guests SELECT and its policy go, and `capture_guest_email` writes only the row's own account's confirmed address. A migration, its guards and a rolled-back proof; the Orchestrator applies it.

## The brief

**Why now:** these are open ROADMAP "Now" lines that state a defect against a rule already on record (the bible, the identity model, the shipped product), not a product decision. Each line is quoted below with its file references; check every one against the code before you change anything (a line can be stale), fix it at its source, and list in the Handoff the exact ROADMAP line each fix closes so the Orchestrator retires it. Where a fix would need a product or copy decision the line does not make, take the recommended answer given here, build it, and list it as his to overrule; never invent a decision the brief does not give. Everything is unprotected (Rising Tides), but this lane fixes defects: it does not redesign.

**The lines (from `docs/ROADMAP.md`'s Now list, found by the `identity-sql-gaps` lane, whose migration `20260922200000_identity_sql_gaps.sql` is applied and is your newest ground):**
1. The host's remaining guests SELECT `(id, event_id, user_id, created_at)` and its `guests_host_select` policy have no reader on either codebase (every guests read is service-role; that lane audited launch-prep and `main` at `milestone-26`): re-verify the audit on both codebases (`git grep` on `origin/launch-prep` and `origin/main`), then revoke the SELECT and drop the policy, the QA #41 shape (revoke at table level; nothing re-granted). If anything reads it, keep it and say what.
2. `capture_guest_email` fills an EMPTY `guests.email` on whatever row the session token names, so on a shared device a confirmed account's address can land on another person's row (the host never sees it, but `upload_forensics.guest_email` records it): recommended, write only when the row's own `user_id` is the confirmed account whose address it is (else nothing), rather than dropping the write, so the newsletter capture keeps working for the account's own row. Start from the function's newest definition.
3. Housekeeping in your files: `api/guests/capture-email/route.ts:18-26` and its `route.test.ts:4-6` count the host's column-scoped SELECT grant among `guests.email`'s readers; the grant no longer carries the column.

**How:** one new migration file (a timestamp after every existing file); replacing a function starts from its NEWEST definition; a function dropped and re-created through the MCP inherits an `anon` EXECUTE grant (re-revoke). Prove it with ONE rolled-back `execute_sql` (`begin; ... rollback;`) on disposable fixtures only, and a contract check commented at the file's foot that ends in a deliberate raise, as `20260922200000_identity_sql_gaps.sql` does. Pin it in `migration-guards.test.ts`; refine `database-security.md` in place. **Never call `apply_migration`**: hand off the apply order (a drift check with normalised checksums, the apply, `get_advisors`, the contract check), as the last lane did.

**Binds.** The bible and the policies (`/design/library`), the contracts of every component under a path you own, and
CLAUDE.md's working loop. `DESIGN_PREVIEW_KEY` rides the environment, never a command line or a log you print. A record doc
(`docs/STATUS.md`, `docs/ROADMAP.md`, `docs/PROGRAM.md`, `CLAUDE.md`, `docs/ASSETS.md`, `docs/tracks/orchestrator.md`,
`docs/reviews/`) is edited only when your `owns` names it. Stage explicitly; never `--no-verify` or force-push; every commit ends
with the `Co-Authored-By` line naming the model you actually run on.

**Verify on.** The gate on the synced tree, each step on its own exit code; the rolled-back proof's statements and results pasted in the Handoff (no secret, no real address).

## Questions (a recommended answer each; the Orchestrator relays them)

No new one-way door. Every call below took the brief's recommended answer or the narrowest reading of it, and each is
listed again under the Handoff's calls his to overrule:

- Line 2, write or drop? Recommended and built: write only when the row's own `user_id` is the confirmed account whose
  address it is, else nothing (the newsletter capture keeps working for the account's own row).
- Clean existing rows? Recommended and built: no data statement. Measured live, 0 rows carry an address that is not
  their own account's (proof step B0d); the drift check re-proves it at the apply.
- The newsletter half? Recommended and built: unchanged. The opt-in records the calling session's own confirmed
  address whichever row the token names, because consent to the list is the person's and says nothing about the row.
- Should a capture stamp `verified_at`? Recommended and built: no, as before. A row minted before its account confirmed
  was minted by whoever held that session, who need not own the address; the mint and the claims stay the only stamps.

## System-doc edits (in place, owned facts only)

- `docs/systems/database-security.md` (owned): the guards line under "Where it lives" (a grant or a policy is replayed
  statement by statement, since a table-level revoke cascades); the deny-all list gains `guests`; the `guests` bullet
  says no client role reads the table (no SELECT on any column, no policy, RLS on) and drops the "stay OUT of the SELECT
  grant" clause; the TWO EMAIL COLUMNS clause says `capture_guest_email` writes only the row's own confirmed account's
  address.
- `docs/systems/notifications-analytics-growth.md:134` (the one-line exception, see the lane check): the capture sets
  `guests.email` "only if null and only on a row whose own account is the confirmed owner of that address".

## Deferred (ROADMAP one-liners, bucket named)

- **Billing follow-ons** (where the line sits today; "QA hardening" fits it better), refine the existing TRUNCATE line
  in place: "Revoke the latent table-level TRUNCATE, REFERENCES and TRIGGER grants `anon` and `authenticated` hold on all
  22 public tables (Supabase's default grant; PostgREST issues none of them, so none is reachable) in the next security
  pass." Measured live: all three privileges, both roles, 22 tables, `guests` and `profiles` among them.

## Handoff (replaces the chat report)

- **Commits:** work `23be806a` (the migration, its guards, the route comments, the two doc refinements); sync
  `090cfe9d` (merge of `origin/launch-prep` at `8f0ad1c3`, which moved only `docs/tracks/orchestrator.md`). Both
  pushed; the head is in the chat line.
- **Gates on the synced tree (`090cfe9d`), each on its own exit code:** `pnpm design:rules` 0 ·
  `node "src/app/(dev)/design/gallery/collect-specimens.mjs"` 0 · `pnpm typecheck` 0 · `pnpm lint` 0 (9 warnings, none
  in a touched file) · `pnpm test` 0 (349 files; 3852 passed, 1 skipped) · `pnpm build` 0 ·
  `pnpm lab:smoke --base http://localhost:3135` 0 (484 checks, 0 failing; run with a dummy key, and the real key has 0
  hits in the dev and smoke logs) · `lab:demo` n/a (board: none). Both generators left the tree clean. Logs:
  `/private/tmp/claude-501/-Users-gibby-local-ai-partyreel/401f4a77-be99-4a42-82f6-e5fac8e4a4c5/scratchpad/guests-grant-tidy/gate-synced/`.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD` before this manifest commit), plus this file:

  ```
  docs/systems/database-security.md
  docs/systems/notifications-analytics-growth.md
  src/app/api/guests/capture-email/route.test.ts
  src/app/api/guests/capture-email/route.ts
  src/lib/db/migration-guards.test.ts
  supabase/migrations/20260922213000_guests_grant_tidy.sql
  ```

  One exception: `docs/systems/notifications-analytics-growth.md`, a single line (134). That doc is
  `capture_guest_email`'s home (its BELONGS HERE names it), its line "it sets `guests.email` only if null" went stale with
  this migration, and no lane owns the file.
- **Items:**
  1. Closes the ROADMAP Now line "The host's remaining guests SELECT `(id, event_id, user_id, created_at)` and its
     `guests_host_select` policy have no reader on either codebase (every guests read is service-role): revoke the
     SELECT and drop the policy." Re-audited with `git grep` on launch-prep `8f0ad1c3` and main `df173c2e`: every read
     of `guests` is `createAdminClient()` (launch-prep: `db/mutations/guest-media.ts:99` and `:120`,
     `db/queries/social.ts:555` and `:676`, `forensics/capture.ts:51`, the media to guests embed at
     `db/queries/guest-events-admin.ts:211`; main: `social.ts:469` and `:559`, `forensics/capture.ts:49`,
     `guest-events-admin.ts:201`), and no `postgres_changes` subscription exists. Live catalog: no view, publication,
     other-table policy or SECURITY INVOKER function reads it; its 17 readers in SQL are SECURITY DEFINER, owned by
     `postgres`. Migration section 2: `revoke select on public.guests from public, anon, authenticated;` then
     `drop policy guests_host_select on public.guests;`, nothing re-granted.
  2. Closes the ROADMAP Now line "`capture_guest_email` fills an EMPTY `guests.email` on whatever row the session token
     names, so on a shared device a confirmed account's address can land on another person's row (the host never sees
     it, but `upload_forensics.guest_email` records it): write only the row's own account's confirmed address, or drop
     the write now that the claims carry the address." Built the first answer: migration section 1, one marked change
     to the body carried from `20260529210500` (the newest; the live body matches it, proof step B0a).
  3. Closes the ROADMAP Now line "Housekeeping: `api/guests/capture-email/route.ts:18-26` and its `route.test.ts:4-6`
     count the host's column-scoped SELECT grant among `guests.email`'s readers; the grant no longer carries the
     column." Both comments now name the readers that remain (the forensic row, and the uploader resolver whose
     verified case the host's credit prints) and the new SQL-side guard.
  4. Guards: `src/lib/db/migration-guards.test.ts` now REPLAYS grants, revokes and policies statement by statement
     (`hostGuestsSelect`, `guestsPolicies`, `guestsRowSecurity`): the old last-grant lookup would have kept reporting
     the dropped grant, because a table-level revoke cascades. A new describe pins the empty SELECT, no policy with RLS
     on, the capture's signature, its own-account predicate as the one write, the normalisation, the opt-in and the
     ACL. Seven mutations of the migration (no table revoke; a column revoke instead; the policy kept; the old update;
     no confirmed test; a schema-wide grant; RLS off) each failed their guard, and the file was restored byte for byte.
  5. Proof: the ONE rolled-back `execute_sql` on the live schema, 22 of 22 true (below); then a read-only check that
     nothing persisted (0 fixture users, profiles or newsletter rows; "Ghost check (disposable)" back to `true/open`
     with 0 guests; the policy and the four-column grant still live; the old body's md5; 34 guest rows). Also
     preflighted per database-security.md on a throwaway local Postgres 17 cluster: the file applies verbatim
     (`-1`, `ON_ERROR_STOP`), the before/after `pg_get_functiondef` diff is only the marked `update`, the contract check
     ends in its deliberate raise, the deployed build's paths through `service_role`, `authenticated` and `anon` behave
     as claimed, and seven mutations of the function or grants each tripped their FAIL line.
  6. Finding (worse than the line said): "the host never sees it" was not always true. On a VERIFIED row with no
     address (the legacy backfill shape; 1 such row live) the old capture put another account's address where
     `resolveUploaderIdentity` case 2 returns `guests.email`, so the host's lightbox
     (`src/components/shared/media-lightbox.tsx:214`, fed by `src/lib/event/gallery-items.ts:72`, the one surface
     that carries the email) would print it under the row owner's name. Reproduced as B3, closed as A4.
  7. Finding: main's capture route (milestone-26) tests `user.email` and not `email_confirmed_at`, so prod can write an
     unconfirmed sign-up's address today. The new function refuses that on its own (the contract check's step 2).
     Prod's newsletter half still takes an unconfirmed session's address until the next milestone merge brings
     launch-prep's route gate.
- **The apply order** (the Orchestrator's; I never called `apply_migration`):
  1. The drift check, read-only (the file's header, (1)a to d): the capture body's normalised md5 is
     `e0018d48fc2bf9ba2121b5e18fb3c8b6`; `guests_host_select` is guests' only policy; `authenticated`'s SELECT on
     guests is `created_at,event_id,id,user_id`; the residue count is 0. All four held in the proof (B0a to B0d).
  2. Apply `supabase/migrations/20260922213000_guests_grant_tidy.sql` verbatim.
  3. `get_advisors`: security `rls_enabled_no_policy` 14 to 15 (adds `public.guests`); 0028 stays 5 and 0029 stays 34,
     `capture_guest_email` in neither; performance unchanged. The body's normalised md5 is now
     `447130abeee65e0b20f464dc6765d34f`.
  4. The contract check at the file's foot (uncommented, one `execute_sql`): the last line reads
     `ROLLED BACK: every guests-grant-tidy contract held`.

  No types regen (no column, signature or return type moves) and no code depends on it, so the merge and the apply can
  land in either order.
- **Assets requested from Will:** none
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** one migration,
  `supabase/migrations/20260922213000_guests_grant_tidy.sql`, in the apply order above; nothing else.
- **Calls his to overrule:**
  - Line 2 as recommended: the write lands only on the row's own confirmed account's row, rather than being dropped.
  - No data statement: 0 rows carry an address that is not their own account's (B0d).
  - The newsletter half unchanged: the opt-in records the caller's own confirmed address whichever row the token names.
  - The capture stamps no `verified_at`, as before.
  - `anon` and `authenticated` keep the table-level REFERENCES, TRIGGER and TRUNCATE grants on `guests`, as on every
    public table: a project-wide pass (Deferred), not a guests-only revoke.
  - The one-line exception in `notifications-analytics-growth.md`.
- **Look at first:** the migration's section 1 marked change and section 2's audit
  (`supabase/migrations/20260922213000_guests_grant_tidy.sql`), then the replay helpers in
  `src/lib/db/migration-guards.test.ts`, then the proof results below.

### The rolled-back proof (one `execute_sql`, `begin; … rollback;`, on the live schema, 2026-09-22)

Fixtures: the disposable event "Ghost check (disposable)" and two disposable accounts made inside the transaction
(`granttidy-<hex>-a@example.com`, `-b@`); every row rolled back. B-steps run on the live function and grants, A-steps
after the migration's statements in the same transaction.

| step | ok | what | detail |
| --- | --- | --- | --- |
| F | true | fixtures on "Ghost check (disposable)" | 2 disposable confirmed accounts (A, B), an anonymous row, A's verified row with no address |
| B0a | true | drift: live capture body = 20260529210500 (normalised md5) | e0018d48fc2bf9ba2121b5e18fb3c8b6 |
| B0b | true | drift: guests_host_select is guests' only policy | guests_host_select |
| B0c | true | drift: authenticated SELECT on guests columns | created_at,event_id,id,user_id |
| B0d | true | drift: rows whose address is not their own account's | 0 |
| B1 | true | BEFORE: the host reads its event's guest rows over PostgREST (reproduced) | 2 row(s) |
| B2 | true | BEFORE: B's capture lands on an anonymous row (the shared phone, reproduced) | granttidy-259f82ae-b@example.com |
| B3 | true | BEFORE: B's capture lands on A's VERIFIED row (the credit's case 2 prints it; reproduced) | granttidy-259f82ae-b@example.com / verified=true |
| A1 | true | AFTER: the host's PostgREST read of guests | refused: permission denied for table guests |
| A2 | true | AFTER: anon's read of guests | refused: permission denied for table guests |
| A3 | true | AFTER: a capture on an anonymous row lands nothing | <null> / <null> |
| A3n | true | AFTER: the opt-in still records the caller's own address | newsletter row for B: true |
| A4 | true | AFTER: B's capture on A's verified row lands nothing | <null> |
| A4o | true | AFTER: A's own address (any case) lands on A's own row | granttidy-259f82ae-a@example.com |
| A5s | true | AFTER: the service-role reads (forensics, guest-media, guest list, the credit embed) | no error |
| A5d | true | AFTER: definer RPCs reading guests, as their callers (list_guest_rows_by_email, get_my_uploads, get_public_profile, get_upload_context) | no error |
| A6a | true | AFTER: client SELECT on any guests column | none |
| A6b | true | AFTER: policies on guests / RLS on | 0 / true |
| A6c | true | AFTER: service_role keeps its SELECT | service_role select |
| A6d | true | AFTER: capture ACL (service-role-only), definer + search_path pinned | {postgres=X/postgres,service_role=X/postgres} / true |
| A6e | true | AFTER: capture body = the file's (normalised md5) | 447130abeee65e0b20f464dc6765d34f |
| CC | true | the file's contract check, verbatim | ROLLED BACK: every guests-grant-tidy contract held |

<details><summary>The statements (the two parts that are the migration file verbatim are marked, not repeated)</summary>

```sql
begin;
create temp table proof (n serial, step text, what text, ok boolean, detail text);
create temp table fx (k text primary key, v text);

do $$
declare
  v_event public.events;
  v_tag text := 'granttidy-' || substr(md5(random()::text), 1, 8);
  v_a uuid := gen_random_uuid();
  v_b uuid := gen_random_uuid();
begin
  select * into v_event from public.events where name = 'Ghost check (disposable)' and deleted_at is null;
  insert into auth.users (id, aud, role, email, email_confirmed_at) values
    (v_a, 'authenticated', 'authenticated', v_tag || '-a@example.com', now()),
    (v_b, 'authenticated', 'authenticated', v_tag || '-b@example.com', now());
  update public.profiles set slug = v_tag where id = v_a;
  update public.events set require_verified_email = false, accepting_uploads = true, visibility = 'open'
   where id = v_event.id;
  insert into fx values ('event', v_event.id::text), ('host', v_event.host_id::text), ('qr', v_event.qr_token),
    ('tag', v_tag), ('a', v_a::text), ('b', v_b::text);
  insert into fx values ('anon_tok', public.create_guest(v_event.qr_token, null, false, 'Typed Name', null)->>'session_token');
  insert into fx values ('a_tok', public.create_guest(v_event.qr_token, v_a, false, null, null)->>'session_token');
  update public.guests set email = null where session_token = (select v from fx where k = 'a_tok');
  insert into proof (step, what, ok, detail) values ('F', 'fixtures on "Ghost check (disposable)"', true,
    '2 disposable confirmed accounts (A, B), an anonymous row, A''s verified row with no address');
exception when others then
  insert into proof (step, what, ok, detail) values ('F', 'fixtures', false, sqlerrm);
end $$;

do $$
declare v_md5 text; v_pol text; v_cols text; v_res integer;
begin
  select md5(btrim(regexp_replace(regexp_replace(prosrc, '--[^\n]*', '', 'g'), '\s+', ' ', 'g'))) into v_md5
    from pg_proc where oid = 'public.capture_guest_email(text, text, boolean)'::regprocedure;
  select string_agg(polname, ',') into v_pol from pg_policy where polrelid = 'public.guests'::regclass;
  select string_agg(attname, ',' order by attname) into v_cols from pg_attribute
   where attrelid = 'public.guests'::regclass and attnum > 0 and not attisdropped
     and has_column_privilege('authenticated', 'public.guests', attname, 'select');
  select count(*) into v_res from public.guests g
   where g.email is not null
     and not exists (select 1 from auth.users u
                      where u.id = g.user_id and u.email_confirmed_at is not null
                        and lower(btrim(u.email)) = lower(btrim(g.email)));
  insert into proof (step, what, ok, detail) values
    ('B0a', 'drift: live capture body = 20260529210500 (normalised md5)', v_md5 = 'e0018d48fc2bf9ba2121b5e18fb3c8b6', v_md5),
    ('B0b', 'drift: guests_host_select is guests'' only policy', v_pol = 'guests_host_select', v_pol),
    ('B0c', 'drift: authenticated SELECT on guests columns', v_cols = 'created_at,event_id,id,user_id', v_cols),
    ('B0d', 'drift: rows whose address is not their own account''s', v_res = 0, v_res::text);
exception when others then
  insert into proof (step, what, ok, detail) values ('B0', 'drift check', false, sqlerrm);
end $$;

do $$
declare
  v_event uuid := (select v from fx where k = 'event')::uuid;
  v_host text := (select v from fx where k = 'host');
  v_n integer;
begin
  perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into v_n from public.guests g where g.event_id = v_event;
  reset role;
  perform set_config('request.jwt.claims', '', true);
  insert into proof (step, what, ok, detail) values ('B1', 'BEFORE: the host reads its event''s guest rows over PostgREST (reproduced)', v_n >= 2, v_n || ' row(s)');
exception when others then
  insert into proof (step, what, ok, detail) values ('B1', 'BEFORE: host read', false, sqlerrm);
end $$;

do $$
declare
  v_anon text := (select v from fx where k = 'anon_tok');
  v_atok text := (select v from fx where k = 'a_tok');
  v_b text := (select v from fx where k = 'tag') || '-b@example.com';
  v_row public.guests;
begin
  perform public.capture_guest_email(v_anon, v_b, false);
  select * into v_row from public.guests where session_token = v_anon;
  insert into proof (step, what, ok, detail) values ('B2', 'BEFORE: B''s capture lands on an anonymous row (the shared phone, reproduced)',
    v_row.email is not distinct from v_b, coalesce(v_row.email, '<null>'));
  perform public.capture_guest_email(v_atok, v_b, false);
  select * into v_row from public.guests where session_token = v_atok;
  insert into proof (step, what, ok, detail) values ('B3', 'BEFORE: B''s capture lands on A''s VERIFIED row (the credit''s case 2 prints it; reproduced)',
    v_row.email is not distinct from v_b and v_row.verified_at is not null, coalesce(v_row.email, '<null>') || ' / verified=' || (v_row.verified_at is not null));
  update public.guests set email = null where session_token in (v_anon, v_atok);
exception when others then
  insert into proof (step, what, ok, detail) values ('B2', 'BEFORE: old capture', false, sqlerrm);
end $$;

-- ⟨the migration, sections 1 and 2, verbatim with comments stripped: create or replace capture_guest_email,
--   its revoke + grant, revoke select on public.guests, drop policy guests_host_select⟩

do $$
declare
  v_event uuid := (select v from fx where k = 'event')::uuid;
  v_host text := (select v from fx where k = 'host');
begin
  perform set_config('request.jwt.claims', json_build_object('sub', v_host, 'role', 'authenticated')::text, true);
  begin
    set local role authenticated;
    perform g.id, g.event_id, g.user_id, g.created_at from public.guests g where g.event_id = v_event;
    reset role;
    insert into proof (step, what, ok, detail) values ('A1', 'AFTER: the host''s PostgREST read of guests', false, 'READ ALLOWED');
  exception when insufficient_privilege then
    reset role;
    insert into proof (step, what, ok, detail) values ('A1', 'AFTER: the host''s PostgREST read of guests', true, 'refused: ' || sqlerrm);
  end;
  perform set_config('request.jwt.claims', '', true);
  begin
    set local role anon;
    perform g.id from public.guests g;
    reset role;
    insert into proof (step, what, ok, detail) values ('A2', 'AFTER: anon''s read of guests', false, 'READ ALLOWED');
  exception when insufficient_privilege then
    reset role;
    insert into proof (step, what, ok, detail) values ('A2', 'AFTER: anon''s read of guests', true, 'refused: ' || sqlerrm);
  end;
exception when others then
  insert into proof (step, what, ok, detail) values ('A1', 'AFTER: reads', false, sqlerrm);
end $$;

do $$
declare
  v_qr text := (select v from fx where k = 'qr');
  v_anon text := (select v from fx where k = 'anon_tok');
  v_atok text := (select v from fx where k = 'a_tok');
  v_a text := (select v from fx where k = 'tag') || '-a@example.com';
  v_b text := (select v from fx where k = 'tag') || '-b@example.com';
  v_fresh text;
  v_row public.guests;
  v_row2 public.guests;
begin
  perform public.capture_guest_email(v_anon, v_b, true);
  v_fresh := public.create_guest(v_qr, null, false, 'Another Name', null)->>'session_token';
  perform public.capture_guest_email(v_fresh, v_a, false);
  select * into v_row from public.guests where session_token = v_anon;
  select * into v_row2 from public.guests where session_token = v_fresh;
  insert into proof (step, what, ok, detail) values ('A3', 'AFTER: a capture on an anonymous row lands nothing',
    v_row.email is null and v_row2.email is null, coalesce(v_row.email, '<null>') || ' / ' || coalesce(v_row2.email, '<null>'));
  insert into proof (step, what, ok, detail) values ('A3n', 'AFTER: the opt-in still records the caller''s own address',
    exists (select 1 from public.newsletter_signups where email = v_b), 'newsletter row for B: ' || exists (select 1 from public.newsletter_signups where email = v_b));
  perform public.capture_guest_email(v_atok, v_b, false);
  select * into v_row from public.guests where session_token = v_atok;
  insert into proof (step, what, ok, detail) values ('A4', 'AFTER: B''s capture on A''s verified row lands nothing',
    v_row.email is null, coalesce(v_row.email, '<null>'));
  perform public.capture_guest_email(v_atok, '  ' || upper(v_a) || ' ', false);
  select * into v_row from public.guests where session_token = v_atok;
  insert into proof (step, what, ok, detail) values ('A4o', 'AFTER: A''s own address (any case) lands on A''s own row',
    v_row.email is not distinct from v_a, coalesce(v_row.email, '<null>'));
exception when others then
  insert into proof (step, what, ok, detail) values ('A3', 'AFTER: captures', false, sqlerrm);
end $$;

do $$
declare
  v_event uuid := (select v from fx where k = 'event')::uuid;
  v_atok text := (select v from fx where k = 'a_tok');
  v_a text := (select v from fx where k = 'a');
  v_tag text := (select v from fx where k = 'tag');
  v_n integer;
  v_j jsonb;
begin
  set local role service_role;
  perform id, user_id, email, display_name, pending_email from public.guests where session_token = v_atok;
  perform id from public.guests where event_id = v_event and user_id = v_a::uuid;
  perform id, user_id, display_name, verified_at from public.guests where event_id = v_event;
  select count(*) into v_n from public.media m left join public.guests g on g.id = m.guest_id where m.event_id = v_event;
  reset role;
  insert into proof (step, what, ok, detail) values ('A5s', 'AFTER: the service-role reads (forensics, guest-media, guest list, the credit embed)', true, 'no error');

  perform set_config('request.jwt.claims', json_build_object('sub', v_a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into v_n from public.list_guest_rows_by_email();
  select count(*) into v_n from public.get_my_uploads(10);
  reset role;
  perform set_config('request.jwt.claims', '', true);
  set local role anon;
  select public.get_public_profile(v_tag) into v_j;
  select public.get_upload_context(v_atok, 'photo') into v_j;
  reset role;
  insert into proof (step, what, ok, detail) values ('A5d', 'AFTER: definer RPCs reading guests, as their callers (list_guest_rows_by_email, get_my_uploads, get_public_profile, get_upload_context)', true, 'no error');
exception when others then
  reset role;
  insert into proof (step, what, ok, detail) values ('A5', 'AFTER: remaining readers', false, sqlerrm);
end $$;

do $$
declare v_cols text; v_pol integer; v_rls boolean; v_acl text; v_def boolean; v_md5 text;
begin
  select string_agg(attname || ':' || case when has_column_privilege('authenticated', 'public.guests', attname, 'select') then 'auth' else '' end
                               || case when has_column_privilege('anon', 'public.guests', attname, 'select') then 'anon' else '' end, ',')
    into v_cols from pg_attribute
   where attrelid = 'public.guests'::regclass and attnum > 0 and not attisdropped
     and (has_column_privilege('authenticated', 'public.guests', attname, 'select') or has_column_privilege('anon', 'public.guests', attname, 'select'));
  select count(*) into v_pol from pg_policy where polrelid = 'public.guests'::regclass;
  select relrowsecurity into v_rls from pg_class where oid = 'public.guests'::regclass;
  select proacl::text, prosecdef and proconfig @> array['search_path=""'],
         md5(btrim(regexp_replace(regexp_replace(prosrc, '--[^\n]*', '', 'g'), '\s+', ' ', 'g')))
    into v_acl, v_def, v_md5
    from pg_proc where oid = 'public.capture_guest_email(text, text, boolean)'::regprocedure;
  insert into proof (step, what, ok, detail) values
    ('A6a', 'AFTER: client SELECT on any guests column', v_cols is null, coalesce(v_cols, 'none')),
    ('A6b', 'AFTER: policies on guests / RLS on', v_pol = 0 and v_rls, v_pol || ' / ' || v_rls),
    ('A6c', 'AFTER: service_role keeps its SELECT', has_table_privilege('service_role', 'public.guests', 'select'), 'service_role select'),
    ('A6d', 'AFTER: capture ACL (service-role-only), definer + search_path pinned', v_acl = '{postgres=X/postgres,service_role=X/postgres}' and v_def, v_acl || ' / ' || v_def),
    ('A6e', 'AFTER: capture body = the file''s (normalised md5)', v_md5 = '447130abeee65e0b20f464dc6765d34f', v_md5);
exception when others then
  insert into proof (step, what, ok, detail) values ('A6', 'AFTER: end state', false, sqlerrm);
end $$;

create function pg_temp.contract_check() returns void language plpgsql as $cc$
  -- ⟨the file's section 3 contract check, uncommented, verbatim⟩
$cc$;
do $$
begin
  perform pg_temp.contract_check();
  insert into proof (step, what, ok, detail) values ('CC', 'the file''s contract check, verbatim', false, 'returned without its deliberate raise');
exception when others then
  insert into proof (step, what, ok, detail) values ('CC', 'the file''s contract check, verbatim', sqlerrm = 'ROLLED BACK: every guests-grant-tidy contract held', sqlerrm);
end $$;

select step, ok, what, detail from proof order by n;
rollback;
```

</details>
