---
track: schema-pass
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "932649e4"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - supabase/migrations/20260929160000_schema_pass.sql
  - supabase/migrations/20260929170000_schema_pass_contract.sql
  - src/lib/db/queries/media.ts
  - docs/systems/database-security.md
  - docs/systems/profiles-social.md
  - src/lib/db/migration-guards.test.ts
  - src/lib/forensics/migration-guards.test.ts
  - src/lib/social/notification-prefs.test.ts
  - src/lib/social/notification-prefs.ts
  - src/lib/db/queries/social.ts
  - src/lib/db/mutations/social.ts
  - src/components/admin/applicants-list.tsx
  - src/app/(dev)/design/sandbox/gallery-fixtures.ts
  - src/lib/db/queries/social.guest-identity.test.ts
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/reel.md
  - docs/systems/billing-caps.md
  - src/lib/validation/event.ts
---

# lp/schema-pass

**Goal.** Audit the whole data architecture and make it better under Will's standing permission: drop the dead (the four columns he yes'd, the reel's dormant columns, the latent grants, anything nothing reads), simplify the redundant, add what is missing, never touching what partyreel.com still reads or what the two SQL lanes beside it rewrite; hand off the audit as a list.

## The brief

**His standing permission** (Will, 2026-09-29): "you're in full control of our data architecture, and as you rearchitect or optimize, anything useless may be dropped as needed. Remember, we're still architecting the perfect app/backend with no real users or data to worry about. We should never feel stuck to a backend system that could be improved, especially pre-launch, with nothing but opportunity in front of us. Would be a shame to not optimize everywhere we can before we get bogged down by real user data post-launch."

**The job:** audit the whole data architecture in the shared Supabase (`ddafaemglzmuekbtjwzn`), read-only through the Supabase MCP: tables, columns, constraints, indexes, RLS policies, grants, functions, triggers, extensions and the storage bucket's policies, with `get_advisors` (security and performance) before and after. Then make it better: drop what is dead, simplify what is redundant, add what is missing (an index a hot query wants, a constraint the code assumes), each change with its reason. Everything is test data: no compatibility work to keep rows.

**Named for you:**
- `events.show_guest_list` and its host UPDATE grant, and the three `notification_prefs` columns for mail nothing sends (`notify_album_shared`, `notify_new_uploads_digest`, `notify_new_follower`): his yes on each (2026-09-29).
- The reel's dormant `media.highlight_score` and `clip_*` (ROADMAP's reel bucket): their names sit in the host's column-scoped select list (`src/lib/db/queries/media.ts`), so the drop edits that list in the same commit.
- The latent table-level TRUNCATE, REFERENCES and TRIGGER grants `anon` and `authenticated` hold on every public table (Supabase's default; PostgREST issues none of them), ROADMAP's billing follow-ons line.
- Any function, trigger, index or column no code and no function reads (prove each with a grep of `src/`, `workers/`, `scripts/` and every live function body).

**The two rules that bound every change:**
- **partyreel.com never reads a dropped thing.** Production is `main` at `milestone-30`; check every drop against `git grep` on `main` as well as `launch-prep`, and anything main still reads waits for milestone 31 (list it).
- **Two lanes rewrite SQL beside you.** `settings-wiring` owns every guest-path function this batch (the join, the album's reads, `get_event_by_qr_token`, the upload's gate and presign, likes, both claims) and adds the doors' tables and the Videos column; `triage-r2-wiring` owns the report path's functions, the media guard trigger and the purge's functions (its migration `20260929140000_triage_r2.sql`). Read their manifests (`docs/tracks/settings-wiring.md`, `docs/tracks/triage-r2-wiring.md`, and their branches' migrations on `origin/lp/<track>`) and touch none of those functions or the columns they change; put any improvement there in your Handoff as a follow-up for after their merges.

**Security (non-negotiable):** RLS stays the boundary; `anon` gets no table access; every function created revokes EXECUTE from `public` AND `anon` explicitly; host table writes stay column-locked (a table-level revoke on a table with column grants cascades to them: `database-security.md`'s Gotchas); the service role stays server-only.

**The migration** (write it; the Orchestrator applies it and regenerates the types): `supabase/migrations/20260929160000_schema_pass.sql`, more files if the work splits (add each to `owns` before writing it). A rolled-back proof for every refusal the change must keep (`anon` and another host refused where they were), and `get_advisors` read before and after (the accepted set today: 0029 at 29, 0028 at 4, no-policy at 17).

**The report is the other half:** your Handoff lists every finding as done (with its migration line), proposed for after the two lanes' merges, or left (with why), so the next pass starts from it. Record the lasting facts in `docs/systems/database-security.md` in place.

**Legal:** none (the legal text is rewritten once, right before launch).

**Paths:** your owns are a start. A path you need beyond them: add it to `owns` in your manifest before editing, never one another lane owns, or name a one-line exception.

**Verify:** `pnpm typecheck` against types you regenerate locally from your migration's rolled-back shape is not possible (the Orchestrator regenerates after the apply), so keep TypeScript edits to what the drops remove, each proven by a grep; Vitest for every guard you touch; the rolled-back SQL proofs; `pnpm lab:smoke` whole.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` whole when the lane changes anything under `src/` but tests (the Library renders the product's components); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- **Q1, the blocker. May this lane write its migration files and run their rolled-back proofs on the live schema?**
  The permission system (the auto-mode classifier) refused the lane's write of
  `supabase/migrations/20260929160000_schema_pass.sql` on 2026-09-29, with no reason given. The file held every
  change under "The items" (drops, revokes, a default-privileges change, three CHECKs, one index). The lane did not
  retry the write in any form. It wrote nothing else to the repo but this manifest, and ran nothing against the
  database beyond read-only audit queries (plus one `explain` inside `begin; set local enable_seqscan = off; …
  rollback;`). **Recommended: yes.** Will allows the lane to write its two files and run their proofs, then the
  Orchestrator resumes `lp/schema-pass`. The files are applied only by the Orchestrator, one at a time, by protocol;
  every change is test data, and the proofs roll back.
  **Resolved (Will, 2026-09-29).** The Orchestrator asked him "May the lane write its two migration files and run
  those proofs?", and he answered "Yes, write and prove." The lane resumed on it.
- **Q2. The reel's three dormant columns wait for milestone 31.** partyreel.com still reads them: `main`'s
  `MEDIA_HOST_COLUMNS` (`src/lib/db/queries/media.ts:40`) selects `highlight_score`, `clip_start_seconds` and
  `clip_end_seconds`, so dropping them now would fail every host album read on milestone-30 (42703, proved).
  **Recommended:** part 2 is its own contract file, `20260929170000_schema_pass_contract.sql`, headed "apply only
  after milestone 31 ships", on the `live_reel_drop`/`identity_contract` precedent, with the list edit, `MediaRow`'s
  Omit and the forensics parity guard's reshape landing now. **Built as recommended** (the Orchestrator's call, under
  Will's standing word that the data architecture is its to optimize); his to overrule.
- **Q3. Close the MCP landmine at its source?** In `public`, the default privileges of role `postgres` hand anon and
  authenticated every privilege on each new table, sequence and function (`pg_default_acl`: `anon=arwdDxtm`,
  `anon=X`, `anon=rwU`). Supabase's "Securing your API" guide gives these revokes and the platform is moving its
  default there. **Recommended: yes**, for anon and authenticated only; the service role keeps its defaults (every
  server read of a new table uses them). Postgres's own PUBLIC EXECUTE on a new function stays: a per-schema default
  cannot lift a global one (the guide's fourth statement, a per-schema `revoke execute on functions from public`, is a
  no-op, proved rolled back), and the global form would reach every schema postgres writes. So every grant block
  still revokes from public, and a bare `revoke … from public` now leaves anon and authenticated nothing. **Built as
  recommended**; his to overrule.
- **Q4. The monthly meter becomes deny-all.** `storage_ledger_host_select` and authenticated's SELECT on
  `storage_ledger` are read by nothing: no `.from("storage_ledger")` in `src/` on either build (the one script is the
  service role), none by authenticated in pg_stat_statements since 2026-05-28, and every function that reads it is
  definer. **Recommended: drop both**, the accepted `rls_enabled_no_policy` set growing 17 to 18. **Built as
  recommended**; his to overrule.
- **Q5. Should the database hold the app's bounds on what the host writes directly?** `events.name`, `description`
  and `qr_style` are host-writable over PostgREST with her own session, past `validation/event.ts`, and no CHECK
  bounded them (a megabyte name was one PATCH). **Recommended:** `events_name_len` (1 to 80),
  `events_description_len` (at most 2,000) and `events_qr_style_len` (1 to 32, an envelope, never the preset list),
  each the app's own number under a parity guard read off the zod schema; the 20 live rows fit (longest name 37,
  description 34, key 7). `reel_style_id` has the same exposure, but its guard forbids a CHECK ("a new mood needs no
  migration"): an envelope for it is a Deferred line. **Built as recommended**; his to overrule.

## System-doc edits (in place, owned facts only)

- `docs/systems/database-security.md`: the advisor set (18 / 4 / 33: `0029` read 33 since the doors' four host acts,
  now listed in the authenticated-only set); the RETURNS TABLE line (no function holds PUBLIC's EXECUTE);
  `tier_limits` in the service-role-only set; `storage_ledger` in the deny-all list; the grants intro (a table from
  before the pass took Supabase's default, one since starts with no client grant) and a new line on what each client
  role holds; the media parity guard replaying the drops; the three events CHECKs under the value gates; the landmine
  gotcha rewritten for the revoked defaults.
- `docs/systems/profiles-social.md`: its two "until a contract migration drops it" clauses (the guest-list switch and
  the three mail switches).

## Deferred (ROADMAP one-liners, bucket named)

- Database: drop `storage_ledger.photo_count` and `video_count` in the next change that replaces `create_media` and
  `create_media_as_host`, the only writers (they increment them); nothing reads them on either build or in any body
  (from `schema-pass`).
- Database: retire `tier_type`'s dead `max` label (no row holds it; `toBillingTier` folds it into pro). This recreates
  the enum, and `tier_limits` and `monthly_ingress_cap` take the new type (from `schema-pass`).
- Database: replace media's three removal flags (`removed_by_uploader`, `_system`, `_admin`: mutually exclusive in
  every live row, and true only on removed rows) with one removal actor, so an impossible pair cannot be stored
  (from `schema-pass`).
- The reel: give `events.reel_style_id` an envelope (a length bound), since the host writes it straight through
  PostgREST. Its guard becomes "no membership CHECK, no enum", which keeps the new-mood-needs-no-migration reason
  (from `schema-pass`).
- Media: a host's direct PostgREST write of `removed_at` (or an event's `deleted_at`) sets `purge_at` (`set_media_purge_at`
  takes `coalesce(new.removed_at, now()) + 30 days`), so she can push her own item's purge date past the 30 days (the
  standby budget still bounds the bytes). Take the database's clock for a client write; `triage-r2-wiring` has merged,
  so the media guard is free (from `schema-pass`).
- The reel bucket: the uploader's video window (the trim) adds columns of its own, because the dormant `clip_*` leave
  with part 2 (refines the reel bucket's trim line; from `schema-pass`).
- Forensics: `/admin/forensics`' 24-hour coverage counts `upload_forensics` by `created_at` with no index behind it.
  Add a BRIN on `created_at` once the table outgrows a scan (from `schema-pass`).
- Ops: the Auth server's database connections are an absolute 10 (the performance advisor), so an instance resize
  would not raise them. A percentage strategy is a dashboard setting (from `schema-pass`).

## Handoff (replaces the chat report)

- **The work commit: `fe593a35`**, on the sync `11df5f3b` (`git merge origin/launch-prep` at `2eb477a7`), pushed.
  launch-prep has since moved to `46fb7c86` with records, the contact and loose-ends wirings and a new lane's cut,
  none touching this lane's paths or reads (checked: `git diff --name-only 2eb477a7 origin/launch-prep` shares no
  file with the lane, and no dropped name appears in it); a trial merge of `46fb7c86` (aborted, never committed) ran
  the 23 migration-reading test files green (513 tests).
- **Gates on `fe593a35`**, each on its own exit code: `pnpm typecheck` 0; `pnpm lint` 0 (no warning); `pnpm test` 0
  (602 files, 7,008 tests); `zsh scripts/build-lock.sh pnpm build` 0; `pnpm lab:smoke --base http://localhost:3132` 0
  (132 checks, 0 failing; its scope: the Library and the lab's shell). Logs in `../partyreel-wt/_scratch/schema-pass/`.
- **Beyond the gate:** `tsc --noEmit` against a hand-simulated regeneration of `types.ts` after part 1 (the six
  columns off) and after both parts (the reel's three off too) exits 0; before `gallery-fixtures.ts` let go of
  `show_guest_list` it failed TS2352 after part 1's regeneration, which is why the fixture changed. After part 2's
  regeneration the forensics guard fails by design, naming each reel column to take off `MediaRow`'s Omit (the
  contract's step 4). Five mutations, each restored and md5-checked: a name bound of 81, `maintain` dropped from the
  revoke, the contract keeping `highlight_score`, an Omit name the type lacks and an Omit missing a skipped column;
  each is caught by the guard written for it (the contract's by two: the replayed parity and its own drop list).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = the two migrations, `src/lib/db/queries/media.ts`,
  `src/lib/db/migration-guards.test.ts`, `src/lib/forensics/migration-guards.test.ts`,
  `src/lib/social/notification-prefs.test.ts`, `src/lib/social/notification-prefs.ts`, `src/lib/db/queries/social.ts`,
  `src/lib/db/mutations/social.ts`, `src/components/admin/applicants-list.tsx`,
  `src/app/(dev)/design/sandbox/gallery-fixtures.ts`, `src/lib/db/queries/social.guest-identity.test.ts`,
  `docs/systems/database-security.md`, `docs/systems/profiles-social.md` and this file, every one under `owns`.
  `gallery-fixtures.ts` and `social.guest-identity.test.ts` joined `owns` after their edit, when the simulated
  regeneration showed the need; the formatter also rewrapped two drifted lines of the fixture.
- **Advisors before (2026-09-29T18:15Z):** security 17 `rls_enabled_no_policy`, 4 in 0028, 33 in 0029. Performance: 4
  unindexed FKs (`contact_submissions`/`job_applications` `handled_by`, `newsletter_signups.event_id`,
  `reports.resolved_by`), 2 tables with no primary key, 9 unused indexes, the Auth connection notice. **Expected
  after part 1** (the file's step 3): 18 / 4 / 33; unindexed FKs 3; unused loses `events_host_active_idx` and
  `article_feedback_slug_idx` and gains `newsletter_signups_event_id_idx`. Part 2: no delta.
- **Part 1, `20260929160000_schema_pass.sql`, proved whole on the live schema** (one `execute_sql`: `begin;` + a
  snapshot + the file verbatim + eight blocks + `rollback;`; the blocks and these rows sit at the file's foot), every
  step ok: the file moved exactly 6 columns, 4 indexes and 1 policy out and 3 CHECKs and 1 index in, changed no
  function body and exactly two ACLs (`get_upload_context`, `tier_limits`), left 18 deny-all tables, no function
  executable through PUBLIC and defaults naming only postgres and the service role; **anon** refused all 30 tables,
  TRUNCATE on `reports` and `tier_limits`, holds no table or column privilege, and still gets
  `get_event_by_qr_token`, `get_event_media_by_qr_token` (2 rows), `get_public_profile` and `get_upload_context`;
  **the host** reads her event, profile, prefs, likes, blocks, follows, shown events, event blocks, invites, link
  stats and announcements, reads her media on the new list and on milestone-30's (2 rows each), writes her event,
  profile and prefs, gets `get_host_upload_context` (the ledger through its definer read), and is refused all 18
  deny-all tables and `tier_limits`; no table grants authenticated TRUNCATE, REFERENCES, TRIGGER or MAINTAIN, and
  `reports` holds nothing for either client role (build 23's red-team note, closed: it also held MAINTAIN);
  **another host** reads 0 of the event and its media and writes 0; **the service role** runs `tier_limits`, reads
  the ledger, reports and the applications (`select *`), and `capture_guest_email`'s opt-in lands a signup; **the
  CHECKs** refuse a name of 81 and 0, a description of 2,001, a key of 33 and 0, each by its own constraint, and take
  a name of 80, 40 emoji (80 UTF-16 units, the app's longest), a description of 2,000 and null, a key of 32; **new
  objects**: a table gives anon and authenticated nothing and the service role its four, a function carries only
  PUBLIC's EXECUTE and one bare revoke from public leaves anon and authenticated false, the service role true, and
  the guide's per-schema revoke from public is a no-op; **the index** plans the FK's set-null. Run first with two
  harness bugs (a `"char"` concatenation, `format` printing booleans as `f/t`), fixed, then held whole. After each
  run a read-only check found the six columns, four indexes and policy standing, anon holding SELECT on `reports`,
  the defaults naming anon, no probe and no signup: nothing persisted.
- **Part 2, `20260929170000_schema_pass_contract.sql`, proved the same way:** the new host list reads 2 rows,
  milestone-30's answers 42703 (the reason it waits), and the host's column-scoped SELECT is exactly the new list;
  afterwards the three columns stood with their grants.
- **The items, done in part 1** (each checked against `main` at milestone-30 and launch-prep by `git grep` of
  `src/`, `workers/` and `scripts/`, every live function body, and pg_stat_statements since 2026-05-28):
  - `alter table public.events drop column show_guest_list;` (his yes; comments, loose fixtures and a cast only;
    `get_public_profile` names it in a comment), and the three `notification_prefs` switches, one statement each.
  - `newsletter_signups.opted_in_at` (`capture_guest_email` names neither twin).
  - **New since the audit:** `job_applications.resume_url` (never written; the inbox's Resume link leaves with it;
    milestone-30's inbox reads `select("*")` and draws the link only when the value is there), the Deferred line
    whose condition, `triage-r2-wiring`'s merge, has come.
  - The four indexes. **Corrected since the audit:** `media_event_id_reel_eligible_idx` was last scanned today, not
    only in the stored reel's history, yet the seven hottest media reads plan identically without it (a rolled-back
    explain on the 1,165-item album), so it goes.
  - `storage_ledger_host_select` and authenticated's SELECT on the ledger (Q4).
  - `revoke all on all tables in schema public from anon` (15 tables with SELECT, 4 more without, all with TRUNCATE,
    REFERENCES, TRIGGER and MAINTAIN).
  - **Corrected since the audit:** `revoke truncate, references, trigger, maintain … from authenticated`. Postgres 17's
    MAINTAIN rode Supabase's default on every table (`rDxtm`), which information_schema never lists.
  - SELECT from authenticated on the 10 deny-all tables and the ledger (each `.from()` of them is the admin client on
    both builds).
  - `tier_limits` to the service role alone. **New since the audit:** `get_upload_context`'s PUBLIC EXECUTE (the
    Deferred line; the doors had already done `get_event_by_qr_token`'s), so no function in public keeps PUBLIC's.
  - The default privileges (Q3), `newsletter_signups_event_id_idx`, and the three events CHECKs (Q5).
- **Part 2** drops `media.highlight_score`, `clip_start_seconds` and `clip_end_seconds` after milestone 31 (Q2); its
  code landed now: `MEDIA_HOST_COLUMNS` without them, `MediaRow`'s Omit with them until the regeneration, and the
  forensics guard replaying the grant across the set (drops included) with a two-way MediaRow check against the
  generated row.
- **Left, with why:** `sent_emails_sent_at_idx` (the admin's email counts range on `sent_at`);
  `profiles_deletion_requested_at_idx` (the deletion sweep's partial); `upload_forensics_device_idx` and
  `_event_idx` (cross-event correlation in an incident); `reports_profile_id_idx` (its FK), and the triage lane's
  `reports_media_id_idx` and `reports_reporter_hash_idx` (unused only until reports use them); the unindexed
  `handled_by` and `resolved_by` FKs (only an operator's account deletion walks them); no primary key on the two
  limiter logs (append-only; a surrogate key is one more index on every guest action); `uuid-ossp` (no dependency, no
  API surface); the `avatars` bucket (live, no `storage.objects` policy: the service role writes, the public URL
  reads); all 65 definers pin `search_path = ''`, no policy calls a bare `auth.uid()`, no definer runs dynamic SQL;
  the gallery doorbell's early return on every media update (microseconds, not worth a trigger change alone).
- Assets requested from Will: none.
- Board ideas: none.
- Proposed migrations / Worker / Vercel / Stripe / env changes: `20260929160000_schema_pass.sql` now, by its
  protocol (drift, the rolled-back check, apply verbatim, advisors, types, then a live smoke of the anonymous
  surfaces on partyreel.com and the alias); `20260929170000_schema_pass_contract.sql` only after milestone 31 ships.
- **Records for the Orchestrator:** CLAUDE.md's ★ line on the MCP anon EXECUTE is outdated once part 1 applies (a
  new function no longer names anon; a bare `revoke … from public` shuts it out, and an explicit anon revoke stays
  harmless). ROADMAP lines that retire with part 1: "drop `events.show_guest_list`" and the billing follow-ons'
  latent TRUNCATE, REFERENCES and TRIGGER line; the reel bucket's "drop the dormant `highlight_score` and `clip_*`"
  retires with part 2, and its trim line takes the Deferred refinement above.
- Calls his to overrule: Q2 to Q5 as built; the three additions to the audit (`resume_url`, `get_upload_context`'s
  PUBLIC EXECUTE, MAINTAIN); keeping the service role's default privileges.
- Look at first: part 1's apply (it changes what anon and authenticated can reach on the database partyreel.com
  shares), then the live smoke.
