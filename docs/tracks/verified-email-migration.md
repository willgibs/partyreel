---
track: verified-email-migration
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "9c90bc61"          # the launch-prep SHA the branch was cut from
board: none            # the identity reshape, wave 0: the schema alone; no board
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - supabase/migrations/
  - src/lib/db/migration-guards.test.ts
  - src/lib/social/public-profile-visibility.test.ts
  - src/lib/constants/tiers.test.ts
  - docs/systems/database-security.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/lib/validation/profile.ts
  - src/lib/db/mutations/guest.ts
  - src/lib/db/mutations/events.ts
  - src/app/api/guests/route.ts
  - src/lib/guest/claim-uploads.ts
  - src/lib/forensics/capture.ts
  - docs/systems/guest-flow.md
  - docs/design/rulings.md
---

# lp/verified-email-migration

**Goal.** WAVE 0 of the identity reshape, alone: Will's `address=none` on `guest-verify` round two and his note (2026-09-21, build `5e210ef`), verbatim in `docs/design/rulings.md` under "the identity reshape", with his four answers at approval: anonymity leaves the product; the host's switch becomes Require verified emails (on by default); off, a guest types a display name at the door and uploads under it with a small unverified mark; the capture flow after a name-only guest's first upload is wired as the working version. This lane writes the schema and nothing else (the migration, the rolled-back contract check, the tests that parse migration text); the Orchestrator applies it before any other lane is cut, so every function body is carried verbatim from its latest definition and changed only where the brief says. The brief below is the whole reading.

## The brief (from the Orchestrator's plan; the bracketed line numbers are the tree at `9c90bc61`)

- The migration in the schema section, whole, every function carried verbatim from its latest definition (the lane
  hands off the `pg_get_functiondef` diffs it started from) and changed only where the schema section says; every
  grant and revoke re-asserted (R1.8); the rolled-back contract check as a SQL file in its scratch folder and pasted
  whole into the Handoff; the text-parity tests: the latest-wins guards in `migration-guards.test.ts` (`create_guest`'s
  new raise, the nulled name, `verified_at`; `create_media`'s "not accepting" raise; `get_upload_context`'s two keys;
  `set_guest_display_name`'s revoke and grant; the trigger function's revoke; the claim's update never naming `email`;
  a new latest-wins guard for `get_event_by_qr_token`'s QA #40 clauses and anon grant; the existing pins carried:
  `'private'`, `p_unlock_proven`, `'password'`, `'visibility', v_event.visibility`, the exact `get_upload_context` grant
  string, `for update`), `public-profile-visibility.test.ts` repointed with its gated negative, the `between 1 and 60`
  parity with `DISPLAY_NAME_MAX_LENGTH`, `tiers.test.ts:201-203` extended. No TypeScript beyond the tests; no docs
  beyond `database-security.md`'s RPC inventory (the two new functions, the trigger, the forensics column, the
  profanity note).
- Owns: `supabase/migrations/`, `src/lib/db/migration-guards.test.ts`, `src/lib/social/public-profile-visibility.test.ts`,
  `src/lib/constants/tiers.test.ts`, `docs/systems/database-security.md`. Reads: `src/lib/validation/profile.ts`,
  `src/lib/db/mutations/guest.ts`, `src/lib/db/mutations/events.ts`, `src/app/api/guests/route.ts`,
  `src/lib/guest/claim-uploads.ts`, `src/lib/forensics/capture.ts`, `docs/systems/guest-flow.md`, `docs/design/rulings.md`.

## The verdict map (every answer of the batch; this lane wires only its own board's)

(no verdict map: one verdict and a note, verbatim in docs/design/rulings.md under "the identity reshape", and his four answers at approval; the brief above is the Orchestrator's whole reading)

## The ownership rules every lane follows this round

- One manifest owner per path; no two lanes' `owns` overlap, not even by a shared prefix. A second lane's single-line
  edit in another lane's file rides the lane-check exception line of its Handoff ("exceptions and why"), applied AFTER
  syncing past the owner's merge, never before. `merge-lane.sh` aborts only on real git conflicts (same or adjacent
  lines, a delete against a modify), so distinct hunks merge clean; the pre-handoff sync carries the first lane's hunks.
- `ladder-wiring` owns explicit FILES (its real footprint, about seventy: `git grep -lE
  'text-\[(7|8|9|11|13|15|17)px\]|text-\[0\.8rem\]|tracking-\[0\.14em\]' -- src ':!src/app/(dev)'`), never a prefix
  another lane sits under; a file whose only sizes are stock classes equal to a step needs no edit at all.
- The app-shape lanes build on stock classes that EQUAL a step (`text-sm` 14, `text-xs` 12, `text-base` 16,
  `text-[10px]`) and never on the announced step names: Tailwind v4 emits no utility for an undeclared `--text-working`,
  the element silently inherits, and nothing in the gate sees it. The names are a mechanical swap after a lane syncs
  past the ladder's merge, or a follow-up.
- A wiring lane never deletes, renames or breaks the props of a module the lab imports: every module
  `git grep -l "from \"@/" src/app/\(dev\)` resolves to (`filter-chips`, `trash-section`, `storage-meter`, `feed-section`,
  `empty-section-teaser`, `event-card`, `app-shell`, `feed-section-header`, `event-filter-pills`, `review-section`,
  `use-review-triage`, `recently-deleted-grid`, `event-settings/*`, `event-slug-control`, `my-uploads-gallery`,
  `lib/dashboard/filters.ts`, `media-grid`, `host-selection-provider`, `review-actions`, `gallery-actions`, `styled-qr`,
  `host-media-grid`, `export-dialog`, `download-all-button`, `selectable-media-grid`, `review-grid`, `feed-section-empty`,
  `qr-preset-picker`, `enter-event-prompt`, `gallery-empty-state`, `likes-provider`, `password-gate`, and more): a retired file stays on disk with a head comment
  naming the boards that draw it; `AppShell` and `EventCard` props stay backward compatible; `pnpm design:rules` when
  `component-notes.ts`'s AppShell contract changes.
- `docs/systems/host-app.md` is split by heading: `home-wiring` edits inside `## Dashboard landing`, `## Events & the
  create flow`, `## First-time host welcome`; `hub-wiring` inside `## QR designer`, `## Custom event link (slug)`, `## The
  event page`, `## Moderation & curation` and one Reel-card door line in `## Reel curation`; nobody touches the H1, the
  ROLE block or `## See also` (the Orchestrator rewrites the H1 at the record); edits stay inside a section body, never
  on a heading line or the blank line before the next heading; the second lane to land syncs first.
- `src/lib/single-source-policy.test.ts` refuses one UPPER_SNAKE export from two `src/lib` modules: `home-wiring`'s
  `lib/dashboard/*` and `hub-wiring`'s `lib/event/*` never both export a `SECTION_LABEL`; `voice-wiring` deletes the four
  sibling Pro lines rather than re-exporting one.
- `content/help/` and `content/blog/` belong to `voice-wiring` alone. The app-shape lanes change what several help
  articles describe (the dashboard, the event page, sharing, settings): each lists the articles it makes stale in its
  Handoff (help how-tos track shipped reality), and one `help-sync` follow-up (Sonnet) rewrites them after both land.
- Every new door a wiring lane adds (the QR and its mini-modal, the copy button, the list toggle, the menu rows, the
  cards) carries `trackAttrs` as the chrome's doors do; every new component gets its `for` line in
  `rules/component-notes.ts` and a `// @contract-for:` test, so it lands in the Library with its `new` badge
  (`pnpm design:rules`); the sheets, the mini-modal and the table read `ui/floating-layer.ts`.
- ONE responsive Sheet for the product (a side panel at a desk, a bottom sheet in a hand, on `ui/sheet.tsx` with
  `ui/drawer.tsx` retired or folded): `hub-wiring` builds it for settings and sharing, and it is the sheet
  `guest-shape`'s dialogs, `profile-page`'s quick-look and `app-pricing`'s object inherit ("apply this sheet concept
  everywhere"); its contract test is the one others reuse.

**Binds.** The bible (`/design/library`), the contracts of every component under a path you own, and the policies;
Will's notes in the ledger and rulings.md; the ownership rules above; CLAUDE.md's working loop (doc-check via Context7
first: Next 16, Tailwind v4, zod v4 and Supabase SSR drift). `DESIGN_PREVIEW_KEY` rides the environment, never a command
line. Never edit a record doc (`docs/CHANGELOG.md`, `STATUS.md`, `ROADMAP.md`, `ASSETS.md`, `docs/tracks/orchestrator.md`,
`docs/design/rulings.md`, `docs/reviews/`); a `docs/systems/` fact inside your lane is refined in place and listed below.
Stage explicitly; never `--no-verify` or force-push; the `Co-Authored-By` trailer on every commit.

**Verify on.** For a production lane: the gate on the synced tree (`pnpm design:rules`, the specimen collector
`node "src/app/(dev)/design/gallery/collect-specimens.mjs"`, `pnpm typecheck`, `pnpm lint` (10 known warnings on 2026-09-21; the number moves, the exit code is the gate, a warning in a file you touched is yours), `pnpm test`,
`pnpm build`), each on its own exit code; `pnpm lab:smoke --base http://localhost:<your port>` whole; the surfaces the Handoff is
judged on, local at 1440 and 375 (the Orchestrator red-teams them on the alias). For a lab lane: the board at 1440 and 375 with
reduced motion honoured, `pnpm lab:smoke` whole, `pnpm lab:demo --board <board> --base http://localhost:<your port>` pressing
every step (a backdrop-filter step reports UNPAINTED in headless Chrome: capture it by hand and say so). One process at a
time on this machine; your dev server on your own port, killed by port before a build, a test run and the handoff.

## Questions (what the goal leaves open; a recommended answer each; the Orchestrator relays them and quotes the answer back)

- None raised mid-lane (the brief said take the recommended answer and list the calls). Every judgement
  call is under "Calls his to overrule" in the Handoff, and the two that WAVE 1 must read before it codes
  are marked ★ there.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- `docs/systems/database-security.md`, the server-mediated write list: `set_guest_display_name` added, with
  why it is service-role even though it only writes a name (profanity cannot be checked in SQL).
- `docs/systems/database-security.md`, the trigger-only list: `sync_event_verified_email_flags` added, with
  what it protects (the expand, and `get_public_profile`'s QA #36 clause still written on the legacy flag).
- `docs/systems/database-security.md`, the deny-all tables line: `upload_forensics.guest_display_name` named
  as part of the denormalized-at-capture identity.
- `docs/systems/database-security.md`, the `events` column-lock list: `require_verified_email` added, with the
  contradiction rule.
- `docs/systems/database-security.md`, the `guests` column-lock bullet: the two new columns are deliberately
  NOT granted (fail-closed; the readers are service-role).
- `docs/systems/database-security.md`, Gotchas: ★ the mirror-image grant landmine (a TABLE-level revoke
  CASCADES to the column grants), measured, beside the one that already says a column revoke is a no-op.
- `docs/systems/database-security.md`, Workflow: ★ the local pre-flight cluster as a named step, with the two
  macOS traps (the socket path length, `LC_ALL`).

## Deferred (ROADMAP one-liners, bucket named)

- Later / cleanup: drop `events.allow_anonymous_uploads` and the `events_sync_verified_email_flags` trigger
  once nothing reads the legacy flag, re-pointing `get_public_profile`'s QA #36 clause in the SAME change
  (a test pins the two together so this cannot be done by halves).
- Now: decide whether `claim_anonymous_uploads` should stamp `verified_at` (and null `display_name`) when a
  name-only guest signs in. This lane left it untouched on purpose; wave 1's precedence rule is what makes
  the capture flow read right today, so the data tail is a product question, not a bug.
- Later: promote this lane's pre-flight harness (schema stand-in + current-bodies slice + the deployed-build
  probe) from a scratch folder to a checked-in script, so the next migration gets the same proof for free.

## Handoff (replaces the chat report)

- MIGRATION commit `bcd57361` (stable; the Orchestrator reads the head from the chat line). Synced with
  `origin/launch-prep` at `b38de10e` by merge (it had moved from the cut `9c90bc61`; the sync brought docs and
  `usher/` only, no `src/`, `supabase/` or dependency change).
- Gates on the SYNCED tree, each on its own exit code: `pnpm design:rules` 0 (no churn: `library.md` and
  `rules.generated.json` unchanged) · specimens 0 (140 specimens on 101 entries) · `pnpm typecheck` 0 ·
  `pnpm lint` 0 (10 known warnings, none in a file this lane touched) · `pnpm test` 0 (318 files, 3,303
  passed, 1 skipped; +8 from the cut) · `pnpm build` 0 (255 pages) · `pnpm lab:smoke --base
  http://localhost:3131` 0 (415 checks, 0 failing). No `lab:demo` (no board). Dev server killed by port
  before each build, test run and this handoff.
- Lane check, `git diff --name-only origin/launch-prep...HEAD` (before this manifest commit), pasted:

```
docs/systems/database-security.md
src/lib/constants/tiers.test.ts
src/lib/db/migration-guards.test.ts
src/lib/social/public-profile-visibility.test.ts
supabase/migrations/20260921150000_identity_require_verified_email.sql
```

  Owned paths only. No exception line: nothing outside `owns` was touched.

### The items, one line each

- `require_verified_email`: lands on `events`, `not null default true`, backfilled from the legacy flag; host-writable by an ADDITIVE column grant.
- the twin-keeper: `events_sync_verified_email_flags`, BEFORE insert or update, holds the pair opposite in both directions; a contradictory write resolves in the NEW column's favour.
- `guests.display_name`: back (dropped 20260602071249), with `guests_display_name_len` mirroring `DISPLAY_NAME_MAX_LENGTH`; NOT in the host's SELECT grant.
- `guests.verified_at`: new, stamped from `auth.users.email_confirmed_at` at join, and BACKFILLED for every guest whose account is confirmed.
- `upload_forensics.guest_display_name`: new, capture-only, denormalized like the rest of the uploader identity.
- `create_guest`: drop + create at four arguments (PostgREST has no overloads); the verified-email refusal replaces the account one, the typed name is nulled when a confirmed account carries the identity, `verified_at` is stamped, and the payload gains `display_name` + `verified`.
- `set_guest_display_name`: new, service-role-only, names or renames a name-only guest and refuses a verified one.
- `create_media`: one new refusal, so a mid-party flip stops the next upload; worded to keep the SHIPPED `mapCheckViolation` correct.
- `get_upload_context`: `require_verified_email` + `guest_verified`, anon grant re-asserted verbatim.
- `get_event_by_qr_token`: drop + create returning BOTH flags, neither redacted, anon grant re-asserted.
- the guards: 8 new describes in `migration-guards.test.ts` (all latest-wins), `public-profile-visibility.test.ts` repointed off its pinned file with the trigger link pinned, `tiers.test.ts` extended to both identity flags.

### ★ Calls his to overrule, one line each (the two marked ★ are what WAVE 1 must read first)

- ★ The identity precedence rule should key on `verified_at`, NOT on `user_id` alone. An UNCONFIRMED session still carries a uid (`create_guest` stamps it, and always has), so "user_id set: the profile's name, verified" would mark an unconfirmed account as verified. This lane keeps the typed name for exactly that row, so the rule reads: `verified_at` set means the profile's name and verified; else a typed `display_name`, unverified; else "A guest".
- ★ `create_guest` does NOT require a name. An expand migration production survives, and the deployed `/api/guests` sends no name at all, so a DB-level requirement would 422 every anonymous upload for a day. The 422 `name_required` is wave 1's route; the DB accepts a nameless mint and `set_guest_display_name` names it afterwards.
- `create_guest`'s payload gained `display_name` and `verified` (additive keys the old build ignores) so the door knows the identity it just got without a second read.
- `guests.display_name` and `verified_at` are NOT in the `authenticated` SELECT grant: a new column on that table is fail-closed by QA #41, all three readers are service-role, and the narrower the host's PostgREST view the better. Wave 1 reads them on the admin client.
- `get_public_profile` is NOT replaced. Its QA #36 clause still reads `allow_anonymous_uploads`, which the twin-keeper keeps truthful; replacing it would have put a second function in the expand for no gain. A test now pins the clause to the trigger.
- `claim_anonymous_uploads` is NOT replaced (the brief asked only that its update never name `email`, which is now pinned).
- The DB-level refusal wordings are mine: "This event requires a verified email to upload.", "This event is not accepting uploads without a verified email.", "Your name comes from your account.", "Enter a name.", "That name is too long." The first two can reach a client through the shipped mapping during the window; wave 1 replaces the user-facing copy with its own codes.
- The comment above `get_upload_context`'s grant now says FIVE anon read RPCs, not the carried FOUR (the set grew with the reel RPC in `20260730120000`). A comment outside the body, so the `pg_get_functiondef` diff is unaffected.
- The twin-keeper resolves a write that moves BOTH columns inconsistently in the new column's favour, and re-asserts the invariant on any other update.

### Help articles this lane makes stale

- None. Schema only; no user-facing copy, route or component changed. The help sweep belongs to `verified-email-host-copy` in wave 1.

### Assets requested from Will

- None.

### Proposed migrations / Worker / Vercel / Stripe / env changes

- ONE migration: `supabase/migrations/20260921150000_identity_require_verified_email.sql`. Nothing else.
- APPLY ORDER (the brief's, restated): diff every replaced body against live `pg_get_functiondef` first,
  apply verbatim, `get_advisors`, run the check below, regenerate `src/lib/db/types.ts` — all BEFORE wave 1
  is cut. Expected advisor delta: the 0028 anon set stays FIVE with the same members (`get_event_by_qr_token`
  is dropped and recreated, which drops its grant; the re-grant is in the file), 0029 untouched, and TWO new
  functions in NEITHER list (`set_guest_display_name`, `sync_event_verified_email_flags`).

### Pre-flight (what was actually run, not claimed)

Homebrew `postgresql@17` (17.10) is on this machine, so this lane did the same pre-flight
`20260729190000` describes rather than reasoning about the SQL: a throwaway cluster carrying a faithful
stand-in (real column types, defaults and constraints for `profiles`/`events`/`guests`/`media`/
`storage_ledger`/`upload_forensics`, the Supabase roles, an `auth.uid()`/`auth.users` stub, `tier_limits`/
`monthly_ingress_cap`/`host_active_bytes`, the events trigger set, the touched grant state) plus the CURRENT
bodies of the four replaced functions sliced verbatim out of `20260729190000` and `20260729180000`. Results:

- The migration applies VERBATIM, clean, first time.
- The contract check below passes VERBATIM, 18 assertions, and rolls back (2 seeded guests, 1 event, 0 media after).
- A second probe drove the DEPLOYED build's paths through `set local role authenticated` / `anon`: the
  shipped `updateEvent` and `createEvent` writes still hold their grants and mirror, the new switch mirrors
  back, anon still executes both read RPCs after the drop + create, anon and authenticated are refused
  EXECUTE on the two server-mediated writes, and the backfill reached the pre-reshape confirmed row while
  leaving the anonymous one alone.
- ★ That probe caught a REAL defect in the first draft: a "belt" `revoke insert, update, delete on
  public.events from authenticated, anon` before the new column grant CASCADED to the column grants and wiped
  every one of them (`pg_attribute.attacl` held exactly ONE entry afterwards, and an `authenticated` UPDATE
  naming `allow_anonymous_uploads` failed with "permission denied for table events") — the host app, down,
  from a line that reads like a safety belt. Removed; the landmine is recorded in `database-security.md`
  beside its mirror. This is the whole reason the pre-flight is worth its time.

It does NOT validate against live DRIFT, so step 1 of the apply protocol stands.

### The `pg_get_functiondef` diffs this lane started from

Machine-produced on the pre-flight cluster: the CURRENT body loaded, then the migration applied, then
`pg_get_functiondef` diffed. Everything outside these hunks is carried verbatim.

```diff
===== create_media =====
@@ -29,6 +29,17 @@
     raise exception 'This event is not accepting uploads.' using errcode = 'check_violation';
   end if;
 
+  -- THE IDENTITY RESHAPE (2026-09-21): the switch gates every upload, so flipping it ON mid-party
+  -- stops the next upload from a guest who never proved an email. * The wording opens with "not
+  -- accepting uploads" DELIBERATELY: the shipped mapCheckViolation
+  -- (src/lib/db/mutations/guest.ts) tests `not accepting` FIRST and maps it to `uploads_closed`,
+  -- so the build on main refuses correctly through the whole deploy window. Wave 1 splits it into
+  -- its own verification_required code; do not reword this string before that lands, and a Vitest
+  -- guard pins the pair.
+  if v_event.require_verified_email and v_guest.verified_at is null then
+    raise exception 'This event is not accepting uploads without a verified email.' using errcode = 'check_violation';
+  end if;
+
   if p_original_key not like 'events/' || v_event.id::text || '/%' then

===== create_guest =====
-CREATE OR REPLACE FUNCTION public.create_guest(p_qr_token text, p_user_id uuid DEFAULT NULL::uuid, p_unlock_proven boolean DEFAULT false)
+CREATE OR REPLACE FUNCTION public.create_guest(p_qr_token text, p_user_id uuid DEFAULT NULL::uuid, p_unlock_proven boolean DEFAULT false, p_display_name text DEFAULT NULL::text)
@@ -11,6 +11,7 @@
   v_confirmed timestamptz;
+  v_name text;
@@ -41,26 +42,53 @@
-  -- When the host disallows anonymous uploads, an account (a confirmed session) is required to upload.
-  if not v_event.allow_anonymous_uploads and (v_uid is null or v_confirmed is null) then
-    raise exception 'This event requires an account to upload.' using errcode = 'check_violation';
+  -- THE IDENTITY RESHAPE (2026-09-21) -- this raise replaces the old "requires an account" one.
+  -- [comment carried in full in the migration file]
+  if v_event.require_verified_email and (v_uid is null or v_confirmed is null) then
+    raise exception 'This event requires a verified email to upload.' using errcode = 'check_violation';
   end if;
+  v_name := nullif(btrim(coalesce(p_display_name, '')), '');
+  if v_confirmed is not null then
+    v_name := null;
+  end if;
+  if v_name is not null and char_length(v_name) > 60 then
+    raise exception 'That name is too long.' using errcode = 'check_violation';
+  end if;
-  insert into public.guests (event_id, user_id, email, session_token)
+  insert into public.guests (event_id, user_id, email, session_token, display_name, verified_at)
   values (
     v_event.id, v_uid, nullif(trim(coalesce(v_email, '')), ''),
-    v_session_token
+    v_session_token, v_name, v_confirmed
   )
   return jsonb_build_object(
     'session_token', v_session_token, 'guest_id', v_guest_id,
-    'event_id', v_event.id
+    'event_id', v_event.id, 'display_name', v_name, 'verified', (v_confirmed is not null)
   );

===== get_upload_context =====
@@ -51,11 +51,15 @@
     'visibility', v_event.visibility,
+    'require_verified_email', v_event.require_verified_email,
+    'guest_verified', (v_guest.verified_at is not null),
     'at_storage_cap', v_at_storage_cap,

===== get_event_by_qr_token =====
- RETURNS TABLE(..., accepting_uploads boolean, allow_anonymous_uploads boolean, event_date date, ...)
+ RETURNS TABLE(..., accepting_uploads boolean, allow_anonymous_uploads boolean, require_verified_email boolean, event_date date, ...)
@@ -9,7 +9,7 @@
-         e.accepting_uploads, e.allow_anonymous_uploads,
+         e.accepting_uploads, e.allow_anonymous_uploads, e.require_verified_email,
```

(`set_guest_display_name` and `sync_event_verified_email_flags` are NEW: no before-body exists.)

### The rolled-back contract check, whole

Run once via `execute_sql` after the apply. It picks its own rows, so there is no placeholder to fill.
Expect eighteen `OK:` notices and then `ERROR: ROLLED BACK — every identity-reshape contract held`.
The same text is committed as the commented section 9 at the bottom of the migration file.

```sql
-- ROLLED-BACK CONTRACT CHECK for 20260921150000_identity_require_verified_email.sql.
-- Run ONCE via the Supabase MCP `execute_sql` AFTER the apply. Nothing persists: the block ends in
-- a deliberate RAISE EXCEPTION, so every write above it rolls back. It rides EXISTING rows (never
-- INSERT an event in a check — enforce_event_limit trips, the Q1 lesson) and needs NO placeholder:
-- it picks an open test event and a confirmed account itself. Expect the final line to be
-- `ROLLED BACK — every identity-reshape contract held`.
do $$
declare
  v_event public.events;
  v_qr text;
  v_uid uuid;
  v_mint jsonb;
  v_token text;
  v_ctx jsonb;
  v_guest public.guests;
  v_res jsonb;
  v_orphans bigint;
begin
  select * into v_event from public.events
   where visibility = 'open' and deleted_at is null order by created_at limit 1;
  if v_event.id is null then raise exception 'FAIL: no open test event to ride'; end if;
  v_qr := v_event.qr_token;

  select p.id into v_uid from public.profiles p
    join auth.users u on u.id = p.id
   where u.email_confirmed_at is not null limit 1;
  if v_uid is null then raise exception 'FAIL: no confirmed account to ride'; end if;

  -- ── 1. the twin-keeper trigger, both directions ────────────────────────────────────────────
  update public.events set allow_anonymous_uploads = true where id = v_event.id;
  if (select require_verified_email from public.events where id = v_event.id) is not false then
    raise exception 'FAIL: legacy write did not mirror into require_verified_email';
  end if;
  raise notice 'OK: allow_anonymous_uploads = true mirrored to require_verified_email = false';

  update public.events set require_verified_email = true where id = v_event.id;
  if (select allow_anonymous_uploads from public.events where id = v_event.id) is not false then
    raise exception 'FAIL: new write did not mirror into allow_anonymous_uploads';
  end if;
  raise notice 'OK: require_verified_email = true mirrored to allow_anonymous_uploads = false';

  -- Both moved in one statement, inconsistently: the NEW column wins.
  update public.events set require_verified_email = false, allow_anonymous_uploads = false
   where id = v_event.id;
  if (select allow_anonymous_uploads from public.events where id = v_event.id) is not true then
    raise exception 'FAIL: the new column did not win a contradictory write';
  end if;
  raise notice 'OK: a contradictory write resolves to the new column';

  -- ── 2. create_guest on a Require-verified-emails event ─────────────────────────────────────
  update public.events
     set require_verified_email = true, accepting_uploads = true
   where id = v_event.id;
  begin
    perform public.create_guest(v_qr, null, false, 'Anon Annie');
    raise exception 'FAIL: unverified mint accepted on a require-verified event';
  exception when check_violation then
    raise notice 'OK: unverified mint refused on a require-verified event';
  end;

  -- A confirmed account mints, is stamped verified, and its typed name is NULLED.
  v_mint := public.create_guest(v_qr, v_uid, false, 'Typed Over Profile');
  select * into v_guest from public.guests where session_token = v_mint->>'session_token';
  if v_guest.verified_at is null then raise exception 'FAIL: verified_at not stamped'; end if;
  if v_guest.display_name is not null then raise exception 'FAIL: the typed name was not nulled'; end if;
  if (v_mint->>'verified')::boolean is not true then raise exception 'FAIL: mint payload not verified'; end if;
  raise notice 'OK: a confirmed mint stamps verified_at and nulls the typed name';

  -- ── 3. create_guest on a name-only event ───────────────────────────────────────────────────
  update public.events set require_verified_email = false where id = v_event.id;

  -- The OLD build's calling convention (three named args, no name): production survives.
  v_mint := public.create_guest(p_qr_token := v_qr, p_user_id := null, p_unlock_proven := false);
  select * into v_guest from public.guests where session_token = v_mint->>'session_token';
  if v_guest.display_name is not null or v_guest.verified_at is not null then
    raise exception 'FAIL: the old 3-arg convention did not mint a plain anonymous row';
  end if;
  raise notice 'OK: the deployed 3-arg create_guest call still mints';
  v_token := v_mint->>'session_token';

  -- The new door: a typed name is stored, unverified.
  v_mint := public.create_guest(v_qr, null, false, '  Maya J.  ');
  select * into v_guest from public.guests where session_token = v_mint->>'session_token';
  if v_guest.display_name is distinct from 'Maya J.' then
    raise exception 'FAIL: the typed name was not trimmed and stored (%)', v_guest.display_name;
  end if;
  if v_guest.verified_at is not null then raise exception 'FAIL: a typed name was marked verified'; end if;
  raise notice 'OK: a typed name is trimmed, stored and left unverified';

  begin
    perform public.create_guest(v_qr, null, false, repeat('x', 61));
    raise exception 'FAIL: a 61-character name was accepted';
  exception when check_violation then
    raise notice 'OK: a 61-character name is refused (the DISPLAY_NAME_MAX_LENGTH belt)';
  end;

  -- ── 4. set_guest_display_name ──────────────────────────────────────────────────────────────
  v_res := public.set_guest_display_name(v_token, '  Sam  ');
  if v_res->>'display_name' is distinct from 'Sam' then raise exception 'FAIL: rename did not store Sam'; end if;
  raise notice 'OK: an unnamed row can be named afterwards';

  begin
    perform public.set_guest_display_name(v_token, '   ');
    raise exception 'FAIL: a blank name was accepted';
  exception when check_violation then
    raise notice 'OK: a blank name is refused';
  end;

  begin
    perform public.set_guest_display_name('not-a-real-session-token', 'Ghost');
    raise exception 'FAIL: an unknown session was accepted';
  exception when no_data_found then
    raise notice 'OK: an unknown session is refused';
  end;

  -- A verified guest cannot carry a second name.
  update public.guests set verified_at = now() where session_token = v_token;
  begin
    perform public.set_guest_display_name(v_token, 'Second Identity');
    raise exception 'FAIL: a verified guest was renamed';
  exception when check_violation then
    raise notice 'OK: a verified guest keeps the profile name';
  end;
  update public.guests set verified_at = null where session_token = v_token;

  -- ── 5. create_media refuses an unverified guest after a flip ───────────────────────────────
  update public.events set require_verified_email = true where id = v_event.id;
  begin
    perform public.create_media(
      v_token, gen_random_uuid(), 'photo',
      'events/' || v_event.id::text || '/original/contract-check.jpg', 1024);
    raise exception 'FAIL: an unverified guest uploaded to a require-verified event';
  exception when check_violation then
    if position('not accepting' in lower(sqlerrm)) = 0 then
      raise exception 'FAIL: the refusal no longer maps to uploads_closed (%)', sqlerrm;
    end if;
    raise notice 'OK: the post-flip upload is refused, wording maps to uploads_closed';
  end;

  -- ── 6. get_upload_context's two new keys ───────────────────────────────────────────────────
  v_ctx := public.get_upload_context(v_token, 'photo');
  if (v_ctx->>'require_verified_email')::boolean is not true then
    raise exception 'FAIL: get_upload_context lost require_verified_email';
  end if;
  if (v_ctx->>'guest_verified')::boolean is not false then
    raise exception 'FAIL: get_upload_context reports the wrong guest standing';
  end if;
  if v_ctx->>'visibility' is distinct from 'open' then
    raise exception 'FAIL: get_upload_context lost visibility (QA #18)';
  end if;
  raise notice 'OK: get_upload_context carries visibility + both identity keys';

  -- ── 7. get_event_by_qr_token returns BOTH flags ────────────────────────────────────────────
  if not exists (
    select 1 from public.get_event_by_qr_token(v_qr)
     where require_verified_email is true and allow_anonymous_uploads is false
  ) then
    raise exception 'FAIL: get_event_by_qr_token does not return both flags';
  end if;
  raise notice 'OK: get_event_by_qr_token returns both flags';

  -- ── 8. the grants ──────────────────────────────────────────────────────────────────────────
  if not has_function_privilege('anon', 'public.get_upload_context(text, public.media_type)', 'execute')
     or not has_function_privilege('anon', 'public.get_event_by_qr_token(text)', 'execute')
     or not has_function_privilege('authenticated', 'public.get_event_by_qr_token(text)', 'execute') then
    raise exception 'FAIL: an anon READ RPC lost its EXECUTE grant (0028)';
  end if;
  if has_function_privilege('anon', 'public.create_guest(text, uuid, boolean, text)', 'execute')
     or has_function_privilege('authenticated', 'public.create_guest(text, uuid, boolean, text)', 'execute')
     or has_function_privilege('anon', 'public.set_guest_display_name(text, text)', 'execute')
     or has_function_privilege('authenticated', 'public.set_guest_display_name(text, text)', 'execute')
     or has_function_privilege('anon', 'public.sync_event_verified_email_flags()', 'execute')
     or has_function_privilege('authenticated', 'public.sync_event_verified_email_flags()', 'execute') then
    raise exception 'FAIL: a service-role-only or trigger-only function is client-callable';
  end if;
  if not has_function_privilege('service_role', 'public.set_guest_display_name(text, text)', 'execute')
     or not has_function_privilege('service_role', 'public.create_guest(text, uuid, boolean, text)', 'execute') then
    raise exception 'FAIL: the server-mediated writes lost their service_role grant';
  end if;
  raise notice 'OK: every EXECUTE grant sits where database-security.md says';

  -- ── 9. the column grants ───────────────────────────────────────────────────────────────────
  if not has_column_privilege('authenticated', 'public.events', 'require_verified_email', 'update')
     or not has_column_privilege('authenticated', 'public.events', 'require_verified_email', 'insert') then
    raise exception 'FAIL: the host cannot write the new switch';
  end if;
  if has_column_privilege('authenticated', 'public.guests', 'display_name', 'select')
     or has_column_privilege('authenticated', 'public.guests', 'verified_at', 'select')
     or has_column_privilege('authenticated', 'public.guests', 'session_token', 'select') then
    raise exception 'FAIL: a guests column leaked into the host PostgREST view (QA #41)';
  end if;
  raise notice 'OK: the switch is host-writable, the guest columns stay fail-closed';

  -- ── 10. the backfill left nobody behind ────────────────────────────────────────────────────
  select count(*) into v_orphans
    from public.guests g join auth.users u on u.id = g.user_id
   where u.email_confirmed_at is not null and g.verified_at is null;
  if v_orphans > 0 then
    raise exception 'FAIL: % confirmed guests would be refused their next upload', v_orphans;
  end if;
  raise notice 'OK: every confirmed guest carries verified_at (% orphans)', v_orphans;

  raise exception 'ROLLED BACK — every identity-reshape contract held';
end $$;
```

### Look at first

1. Section 1 of the migration, the twin-keeper trigger. It is what makes the whole reshape an expand that
   production survives, and it is the one piece with no equivalent anywhere else in the schema.
2. The new Gotcha in `database-security.md` (a TABLE-level revoke cascades to the column grants). It is a
   measured landmine, not a theory, and it nearly shipped inside this very migration.
3. The two ★ calls above, before wave 1 is cut: the precedence rule keys on `verified_at`, and the DB does
   not require a name.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-21). Wave 0 of the identity reshape landed the schema alone as
an EXPAND migration production survives: `events.require_verified_email` beside the legacy
`allow_anonymous_uploads` under a BEFORE trigger holding the two opposite in both directions,
`guests.display_name` back with a CHECK mirroring `DISPLAY_NAME_MAX_LENGTH`, `guests.verified_at` stamped at
join and backfilled for every confirmed account, `upload_forensics.guest_display_name`, and six functions:
`create_guest` at four arguments with the verified-email refusal and the nulled name, the new
`set_guest_display_name`, `create_media`'s post-flip refusal worded to keep the shipped error mapping
correct, `get_upload_context`'s two keys, `get_event_by_qr_token` returning both flags, and the twin-keeper.
Pre-flighted on a throwaway PostgreSQL 17.10 cluster, which caught a table-revoke cascade that would have
wiped every `events` column grant; eleven latest-wins guards replaced the file-pinned ones.
