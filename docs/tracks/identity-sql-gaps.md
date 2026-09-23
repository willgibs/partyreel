---
track: identity-sql-gaps
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "ceaee403"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - supabase/migrations/
  - src/lib/db/migration-guards.test.ts
  - docs/systems/database-security.md
  - docs/systems/profiles-social.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/lib/db/types.ts
  - docs/systems/guest-flow.md
  - src/app/(guest)/e/[token]/page.tsx
  - src/lib/events/gallery-access.ts
---

# lp/identity-sql-gaps

**Goal.** Two identity leaks against Will's guest-identity ruling closed in SQL: an unconfirmed sign-up's address never reaches the host through `guests.email`, and `get_public_profile`'s attended arm applies the album's own confirmed-email gate. A migration file, its guards, a rolled-back proof and the two system docs; the Orchestrator applies it.

## The brief

**The rule (Will's guest-identity ruling, now in `docs/systems/guest-flow.md` and `database-security.md`):** a guest is a typed name ("Unverified"), a typed name with an address nobody proved (`guests.pending_email`: never shown to the host, never attributed, never mailed on its own), or a confirmed account. The host sees a badge, never an unproven address. `database-security.md`'s landmine "TWO EMAIL COLUMNS, AND ONLY `verified_at` IS PROOF" states it, and names the first gap below.

**Gap 1: an unconfirmed address in `guests.email`.** `create_guest` (newest definition: `supabase/migrations/20260922120000_guest_pending_email.sql`) reads `auth.users.email` for the session and inserts it into `guests.email` even when `email_confirmed_at` is null, and `guests.email` is inside the host's column-scoped SELECT grant (`grant select (id, event_id, user_id, email, created_at) on public.guests to authenticated`, `20260729180000_qa_q3_escalation_guards.sql:328`), so a host can read it through PostgREST. Close it: (a) `create_guest` writes `email` only for a confirmed session (start from the newest definition; keep the signature, so no caller changes and `types.ts` stays as generated); (b) existing rows: find out how `verified_at` was populated for rows older than the identity round before touching data; null `email` only on rows whose address was never proved, and say in the Handoff exactly which rows (a count on the live database, read-only) and why; (c) the grant: grep every authenticated, non-service-role read of `guests` (`git grep -n 'from("guests")'` and the RPCs that return guest columns); if nothing host-facing selects `email`, revoke `email` from the host's grant (the narrower the host's view the better: the guest list and the credit already run on the admin client) and say so; if something does, keep the column, narrow what it returns, and explain.

**Gap 2: `get_public_profile`'s attended arm** (`20260922122000_profile_shown_events.sql:129`) admits any signed-in viewer to an attended event's photos where the album itself asks for a confirmed email (`src/app/(guest)/e/[token]/page.tsx:232`, `src/lib/events/gallery-access.ts`). Make the arm apply the album's own gate: on a `require_verified_email` event, only a confirmed viewer (and the host) passes. Start from the newest definition of the function.

**How:** one new migration file in `supabase/migrations/` (a timestamp after every existing file). Replacing a function starts from its NEWEST definition in the folder, never an older one. A function dropped and re-created through the MCP inherits an `anon` EXECUTE grant (`database-security.md`): revoke it again where the old one had none. Prove both fixes with a ROLLED-BACK check through the Supabase MCP (`execute_sql` wrapping `begin; ... rollback;`) on disposable test data only: an unconfirmed session's mint leaves `email` null, a confirmed one keeps it; the host's PostgREST read of `guests.email` is refused (if revoked) or null for an unconfirmed row; the attended arm refuses a signed-in unconfirmed viewer on a verified-required event and admits a confirmed one and the host. Pin both in `src/lib/db/migration-guards.test.ts`. Refine the two system docs in place (the landmine's "a gap ... on the ROADMAP" clause goes; `profiles-social.md`'s attended arm states the gate). **Never apply the migration yourself** (`apply_migration` is the Orchestrator's): write the file, prove it rolled back, hand off, and name in the Handoff the exact order the Orchestrator applies it in, plus whether `get_advisors` should change.

**Binds.** The bible and the policies (`/design/library`), the contracts of every component under a path you own, and
CLAUDE.md's working loop. `DESIGN_PREVIEW_KEY` rides the environment, never a command line or a log you print. A record doc
(`docs/STATUS.md`, `docs/ROADMAP.md`, `docs/PROGRAM.md`, `CLAUDE.md`, `docs/ASSETS.md`, `docs/tracks/orchestrator.md`,
`docs/reviews/`) is edited only when your `owns` names it. Stage explicitly; never `--no-verify` or force-push; every commit ends
with the `Co-Authored-By` line naming the model you actually run on.

**Verify on.** The gate on the synced tree, each step on its own exit code (`pnpm design:rules`, the specimen collector, `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm lab:smoke`); the rolled-back proof's statements and results pasted in the Handoff (no secret, no real address).

## Questions (a recommended answer each; the Orchestrator relays them)

- **Q1 (built, his to overrule): which rows lose `guests.email`.** Recommended and taken: an UNVERIFIED row whose
  address no account has confirmed (`not exists (auth.users … email_confirmed_at is not null)`), never a verified row.
  The stricter reading, every unverified row, would also clear a confirmed address the newsletter capture writes onto
  an unverified row, which its owner did prove. Both readings move 0 live rows today.
- **Q2 (built, his to overrule): the QA #36 clause stays verbatim beside the new gate.** Recommended and taken: keep it.
  Under the twin trigger the gate implies it, and `src/lib/social/public-profile-visibility.test.ts` (outside this lane)
  pins its text, so the legacy column's drop deletes it (Deferred) rather than this lane rewording another lane's guard.
- **Q3 (new, NOT built): should the attended arm also mirror Require an upload to view?** The album holds a viewer who
  has not contributed at the teaser (no Guests list) while uploads are open, yet the attended arm shows that viewer the
  line. Recommended: yes, in its own small lane: on a `require_upload_to_view` event with `accepting_uploads`, admit
  only the host or a signed-in viewer whose own guest row on the event has a completed upload (an anonymous viewer is
  refused there, since SQL cannot see a session token: the conservative direction). Not built here: it changes what a
  guest's CHOSEN line shows strangers, a product call the brief did not make.

## System-doc edits (in place, owned facts only)

- `docs/systems/database-security.md`: the `guests` grant line names the host's `(id, event_id, user_id, created_at)`;
  the TWO EMAIL COLUMNS landmine states the rule and its writers (the gap clause and its ROADMAP pointer gone); the 0028
  paragraph states the attended arm's gate; the twin-trigger note says the gate implies the QA #36 clause, so the
  column's drop deletes it; two workflow lessons (people made inside a rolled-back check; an unapplied migration proved
  inside `begin; … rollback;`).
- `docs/systems/profiles-social.md`: the attended-arm invariant states the album's viewer gate; the covers bullet names
  the viewer gate as the RPC's alone; "Where it lives" points at the newest `get_public_profile`.

## Deferred (ROADMAP one-liners, bucket named)

- Now: `capture_guest_email` fills an EMPTY `guests.email` on whatever row the session token names, so on a shared device a confirmed account's address can land on another person's row (an unconfirmed account's row carries none since `identity-sql-gaps`); the host never sees it (outside the grant, the resolver's case 3), but `upload_forensics.guest_email` records it: write only the row's own account's confirmed address, or drop the write now that the claims carry the address.
- Now: the host's remaining guests SELECT `(id, event_id, user_id, created_at)` and its `guests_host_select` policy have no reader on either codebase (every guests read is service-role): revoke the SELECT and drop the policy.
- Now, on the contract migration's line: it also deletes `get_public_profile`'s QA #36 clause (the confirmed-viewer gate beside it implies it) and moves `public-profile-visibility.test.ts`'s pin to the gate.
- Now, Housekeeping (comments stating a retired fact): `api/guests/capture-email/route.ts:18-26` and its `route.test.ts:4-6` count "the host's column-scoped SELECT grant" among `guests.email`'s readers; the grant no longer carries the column.

## Handoff (replaces the chat report)

- **Commits**, both pushed to `origin/lp/identity-sql-gaps`: the work `ef7caacd`; the sync merge `bea03ff3` (launch-prep
  had moved `92421d85` → `ec4bca80`; the merge touched no owned path and no read). The head is in the chat line.
- **Gates on the synced tree `bea03ff3`**, each on its own exit code (logs in the scratchpad's `identity-sql-gaps/sync-*.log`):
  `pnpm design:rules` 0 · `node "src/app/(dev)/design/gallery/collect-specimens.mjs"` 0 · `pnpm typecheck` 0 ·
  `pnpm lint` 0 (9 warnings, none in a touched file) · `pnpm test` 0 (349 files, 3841 passed, 1 skipped) · `pnpm build` 0 ·
  `pnpm lab:smoke --base http://localhost:3132` 0 (482 checks, 0 failing; a dummy key, the real one in no log). No board,
  so no `lab:demo`. The same gate ran green before the sync at `ef7caacd` (350 files, 3869 tests; 484 smoke checks).
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`, before this commit, which adds this file):

  ```
  docs/systems/database-security.md
  docs/systems/profiles-social.md
  src/lib/db/migration-guards.test.ts
  supabase/migrations/20260922200000_identity_sql_gaps.sql
  ```
- **The items:**
  - `supabase/migrations/20260922200000_identity_sql_gaps.sql` §1: `create_guest` (create or replace, the 5-arg signature and jsonb keys unchanged, grants re-stated) sets `v_email := null` unless `email_confirmed_at` is set: an unconfirmed session's names-mode mint keeps its `user_id`, typed name and pending address, and carries no `email`.
  - §2, the existing rows: `email` nulled on an unverified row whose address no account ever confirmed. Live, read-only, before any fixture: 34 guest rows; 4 carry an address, each verified and each its own confirmed account's; 30 carry none; 0 unverified rows carry one; 3 auth users, all confirmed. So the statement moves **0 rows** today and stands for any row minted before the apply. On rows older than the identity round, `verified_at` came from 20260921150000's backfill (`created_at`, for rows whose `user_id` account was confirmed at the backfill), re-run once by 20260922120000 §0, so a null there means the account was unconfirmed or absent.
  - §3: the host's guests SELECT narrows to `(id, event_id, user_id, created_at)` (the table-level revoke, then the whole list: the QA #41 shape). The audit: every guests read on launch-prep (`mutations/guest-media.ts:99`, `:120`; `queries/social.ts:555`, `:676`; `forensics/capture.ts:51`; the `guests!media_guest_id_fkey` embed at `queries/guest-events-admin.ts:211`) and on main at `milestone-26` (`social.ts:469`, `:559`; `capture.ts:49`; the embed at `guest-events-admin.ts:201`) runs on the service-role admin client; on live, no policy, view, publication or SECURITY INVOKER function reads the column and no RPC returns it.
  - §4: `get_public_profile`'s attended arm (create or replace, payload unchanged, grants re-stated) adds `not e.require_verified_email or e.host_id = auth.uid() or <the viewer's auth.users.email_confirmed_at is set>`; the EXISTS plans as an InitPlan, once per call (EXPLAIN on live).
  - §5: the rolled-back contract check for after the apply, at the file's foot (green today inside the proof, row 30).
  - `src/lib/db/migration-guards.test.ts`: a latest-wins guests-grant resolver and six pins (the `create_guest` drop before the insert; the grant list and its revoke-first shape; no table-wide client SELECT on guests; the data rule; the attended-arm gate; its parity with `gallery-access.ts` and the `/e/` page's `isAuthed`); the QA #41 fail-closed test reads the latest grant. With the migration moved aside, the four migration-dependent pins fail (checked).
  - The two system docs (System-doc edits above).
  - The local pre-flight: a throwaway PostgreSQL 17.10 cluster with the live-identical bodies (normalised md5 `49d084a3…`, `344576c0…`) and the live guests ACL; the file applied verbatim (`psql -1 -f`); both leaks reproduced before it, the file's check green after.
- **The rolled-back proof on live** (one `execute_sql`, `begin; … rollback;`; disposable fixtures only: the event "Ghost
  check (disposable)" and three `example.com` users made inside the transaction). The statements, in order:
  `create temp table proof (step, ok, detail)` and `fx`; a `DO $pre$` block that inserts the three `auth.users` rows
  (one with `email_confirmed_at` null), slugs the attendee, then in names mode mints plant (a)
  `create_guest(qr, <unconfirmed>, false, 'Pre Fix', null)`, plant (b) an anonymous mint plus
  `capture_guest_email(<token>, <the viewer's confirmed address>, false)`, plant (c) an anonymous mint plus a capture of
  an address no account holds, plant (d) `create_guest(qr, <viewer>, …)`; reads plant (a)'s email as the host
  (`set_config('request.jwt.claims', {sub: host})`, `set local role authenticated`); then in verified mode with
  `show_guest_list`, the attendee's verified mint, one approved media row, a `profile_shown_events` row, and
  `get_public_profile(<slug>)` as the unconfirmed viewer; every statement of the migration (both bodies md5-identical to
  the file, rows 10-11); a `DO $post$` block re-reading the plants, minting afresh, repeating the host's read (expecting
  `insufficient_privilege`) and the profile read; a `DO $wrap$` that EXECUTEs the file's own check verbatim and records
  its final message; `select step, ok, detail from proof order by step; rollback;`. The result, every row `ok = true`:

  ```
  00 disposable event found                                         7e543492-d2c5-4d59-b548-68b6b1ff924e
  01 live rows the data rule nulls (real data)                      0
  02 PRE: an unconfirmed mint stores its unproved address (the leak)
  03 PRE: the host reads that address over PostgREST (the leak)
  04 PRE: a signed-in UNCONFIRMED viewer sees the attended event (the leak)
  05 PRE: rows the data rule would null (plants a + c only)         2
  10 POST: create_guest body is the file's (normalised md5)         de887e18…
  11 POST: get_public_profile body is the file's (normalised md5)   379a5038…
  12 POST: the data rule nulled plant (a), keeping its user_id and typed name
  13 POST: plant (b), a CONFIRMED address on an unverified row, is kept
  14 POST: plant (c), an address no account holds, is nulled
  15 POST: plant (d), a verified row, is untouched
  16 POST: every verified row kept its address                      6 (4 real + 2 plants)
  17 POST: an unconfirmed session's NEW mint stores no address
  18 POST: the host's PostgREST read of guests.email is refused (42501)
  19 POST: the host's narrowed read still serves                    6 rows on the event
  20 POST: the same UNCONFIRMED viewer no longer sees the attended event
  30 the migration file's own contract check, run verbatim after it ROLLED BACK — every identity-sql-gaps contract held
  ```

  Re-read after the rollback: the live bodies are still `49d084a3…` / `344576c0…`, `email` still in the host grant, 34
  guest rows, 3 users, no `sqlgaps-` profile or media, the Ghost event as it was, 0 `profile_shown_events` rows.
- **Apply order for the Orchestrator:** (1) drift check: normalised md5 (`md5(regexp_replace(prosrc, '\s+', ' ', 'g'))`)
  of live `create_guest(text, uuid, boolean, text, text)` = `49d084a3f2eda5d4520c04011ed0517f` and
  `get_public_profile(text)` = `344576c0103278f559a331dcb38ca8f6` (both matched today); (2) `apply_migration` name
  `20260922200000_identity_sql_gaps`, the file verbatim, at the merge or any time: no signature, return shape or read
  moves on either build, so no code has to precede or follow it; (3) `get_advisors` security: **no delta** (0008 the
  same 14, 0028 the same 5 with `get_public_profile`, 0029 the same 34; `create_guest` in neither); (4) `execute_sql`
  the contract check at the file's foot, uncommented: expect the error
  `ROLLED BACK — every identity-sql-gaps contract held`; (5) confirm the new normalised md5s `de887e180a7ea42634d4ad168141454e`
  and `379a5038bfec10b225de5c4ba485d076` and `has_column_privilege('authenticated','public.guests','email','select')`
  false; (6) `types.ts`: no regeneration needed (no column, signature or return type moved).
- **Assets requested from Will:** none.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** the one migration above, applied by the
  Orchestrator; nothing else.
- **Calls his to overrule:**
  - The data rule reads the address, not the row's flag (Q1); 0 rows either way today.
  - The QA #36 clause stays verbatim beside the gate it is implied by (Q2).
  - `capture_guest_email` untouched: its route on this tree requires `email_confirmed_at`; main's does not, but no product flow yields an unconfirmed session, the project has 0 unconfirmed accounts, and the host's PostgREST path is closed either way (the shared-device edge is Deferred).
  - Only `email` left the host's grant, per the brief; the other four columns stay though nothing reads them (Deferred).
  - The host arm admits the event's host whether or not their own email is confirmed, like the album's owner check.
  - The new parity pin reads `gallery-access.ts` and the `/e/` page's `isAuthed` line, coupling the SQL mirror to the album code (the `mapCheckViolation` precedent in the same file).
- **Look at first:** the migration's §2 (the data rule and its comment), then the proof's rows 02-05 against 12-20.
