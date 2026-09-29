---
track: schema-pass
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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
  `clip_end_seconds`, so dropping them now would 400 every host album read on milestone-30. **Recommended:** part 2
  is its own contract file, `20260929170000_schema_pass_contract.sql`, headed "apply only after milestone 31 ships",
  on the `live_reel_drop`/`identity_contract` precedent. The list edit, `MediaRow`'s Omit and the forensics parity
  guard's reshape (it pins the grant to `20260707150000`'s text, so it would replay the set instead) land in the
  same commit.
- **Q3. Close the MCP landmine at its source?** In `public`, the default privileges of role `postgres` hand anon and
  authenticated every privilege on each new table, sequence and function. That is how every new function inherits
  anon's EXECUTE: `pg_default_acl` holds `anon=X/postgres` and `anon=arwdDxtm/postgres`. Supabase's current "Securing
  your API" guide advises revoking these defaults, and the platform is moving that way. **Recommended: yes**, for
  anon and authenticated only, kept for the service role (its server reads depend on it). Postgres's own PUBLIC
  EXECUTE on new functions stays, because a per-schema default cannot lift it and the global form would also strip
  EXECUTE from functions of future extensions. So every grant block still revokes from public; a bare
  `revoke … from public` becomes enough to shut anon out. Both sibling files grant every function and table they
  create explicitly (checked), so neither changes under it.
- **Q4. The monthly meter becomes deny-all.** `storage_ledger_host_select` and authenticated's SELECT on
  `storage_ledger` are read by nothing: no `.from("storage_ledger")` in `src/` on either build, none by
  authenticated in pg_stat_statements since 2026-05-28, and every function that reads it is definer.
  **Recommended: drop both.** The accepted `rls_enabled_no_policy` set grows 17 → 18.
- **Q5. Should the database hold the app's bounds on what the host writes directly?** `events.name`, `description`
  and `qr_style` are host-writable over PostgREST with her own session, past `validation/event.ts`, and no CHECK
  bounds them today (a megabyte name is one PATCH). **Recommended:** `events_name_len` (1 to 80),
  `events_description_len` (at most 2,000) and `events_qr_style_len` (1 to 32, an envelope, never the preset list).
  Each is the app's own number, and a parity test against the zod schema would ship with it; the 16 live rows fit
  (longest name 37, longest description 34). `reel_style_id` has the same exposure, but its guard forbids any CHECK ("a new mood
  needs no migration"); an envelope for it is a Deferred line for the reel's owner.

## System-doc edits (in place, owned facts only)

- none (the lane wrote no migration, so no fact changed; on resume: `database-security.md` gets the deny-all list
  plus `storage_ledger`, the advisor counts, the anon and authenticated table posture and the landmine line refined;
  `profiles-social.md` loses its two "until a contract migration drops it" clauses, lines 19 and 120-121, with the
  file added to `owns`)

## Deferred (ROADMAP one-liners, bucket named)

- Database: once `settings-wiring` merges, revoke the PUBLIC EXECUTE that `get_event_by_qr_token` (its recreate
  restates it) and `get_upload_context` still hold; anon, authenticated and service_role each hold it by name (from
  `schema-pass`).
- Database: once `settings-wiring` merges, drop `storage_ledger.photo_count` and `video_count`. `create_media` and
  `create_media_as_host` increment them and nothing reads them (from `schema-pass`).
- Database: once both SQL lanes merge, retire `tier_type`'s dead `max` label (no row holds it; `toBillingTier` folds
  it into pro). This recreates the enum, and `tier_limits` and `monthly_ingress_cap` take the new type (from
  `schema-pass`).
- Database: once both SQL lanes merge, replace media's three removal flags (`removed_by_uploader`, `_system`,
  `_admin`: mutually exclusive in every live row, and true only on removed rows) with one removal actor, so an
  impossible pair cannot be stored (from `schema-pass`).
- Admin: nothing ever writes `job_applications.resume_url` (the careers form sends links), yet the applicants list
  draws a Résumé link from it. Drop both once `triage-r2-wiring`, which owns `src/components/admin/`, merges (from
  `schema-pass`).
- The reel: give `events.reel_style_id` an envelope (a length bound), since the host writes it straight through
  PostgREST. Its guard becomes "no membership CHECK, no enum", which keeps the new-mood-needs-no-migration reason
  (from `schema-pass`).
- Media: a host's direct PostgREST write of `removed_at` (or an event's `deleted_at`) sets `purge_at`, so she can push
  her own item's purge date past the 30 days (the standby budget still bounds the bytes). A client write could take
  the database's clock instead. The media guard is `triage-r2-wiring`'s this batch (from `schema-pass`).
- The reel bucket: the uploader's video window (the trim) would add columns of its own, because the dormant `clip_*`
  leave at milestone 31 (refines the reel bucket's trim line; from `schema-pass`).
- Forensics: `/admin/forensics`' 24-hour coverage counts `upload_forensics` by `created_at` with no index behind it.
  Add a BRIN on `created_at` once the table outgrows a scan (from `schema-pass`).
- Ops: the Auth server's database connections are an absolute 10 (the performance advisor), so an instance resize
  would not raise them. A percentage strategy is a dashboard setting (from `schema-pass`).

## Handoff (replaces the chat report)

- **The work commit: none. The lane is blocked on Q1.** The permission classifier refused the migration's write
  before any file existed, and nothing depends on a write that did not happen. This manifest is the only commit, on
  `ec0125fe` (launch-prep at boot). No sync: launch-prep has since gained only two record commits (`4d49b5d4`,
  `f1bf741d`).
- Gates: `track-manifests.test.ts` on this manifest (the only change). The full gate waits for the work: this tree
  changes nothing it covers.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = `docs/tracks/schema-pass.md`.
- Advisors before (2026-09-29T11:18Z): security 17 `rls_enabled_no_policy`, 4 in 0028, 29 in 0029 (the accepted set,
  unchanged). Performance: 5 unindexed FKs (`contact_submissions`/`job_applications` `handled_by`,
  `newsletter_signups.event_id`, `reports.media_id`, `reports.resolved_by`), 2 tables with no primary key
  (`action_attempts`, `unlock_attempts`), 7 unused indexes, and 1 Auth connection-strategy notice.
- **The items: what part 1 (`20260929160000_schema_pass.sql`) was to do.** Each item was checked against `main`
  (milestone-30) and `launch-prep` by `git grep` of `src/`, `workers/` and `scripts/`, against every live function
  body, and against pg_stat_statements (reset 2026-05-28):
  - Drop `events.show_guest_list`. No reader on either build: comments, loose fixtures and `as` casts only, and the
    one body naming it (`get_public_profile`) names it in a comment. Its host insert and update grants go with it.
  - Drop `notification_prefs.notify_album_shared`, `notify_new_uploads_digest` and `notify_new_follower`, one
    statement each (the parity test reads each drop). Both builds select only `notify_pass_renewal, marketing_opt_in`.
    The pg_stat_statements selects naming the three came from builds before `20260928160000`.
  - Drop `newsletter_signups.opted_in_at`, `created_at`'s twin: nothing reads it, and its one writer,
    `capture_guest_email`, inserts once with `on conflict do nothing`.
  - Drop `events_host_active_idx`: 0 scans, and `events_host_id_idx` (13,574 scans) covers it.
  - Drop `media_event_id_reel_eligible_idx`: no read filters on `reel_eligible`, since it is an output of
    `album_changes_since` and `get_event_media_by_qr_token` only. Its scans are the stored reel's history, and
    today's plans pick `media_active_bytes_idx` and `media_event_created_id_idx`. That is one index fewer to write on
    every upload and status change.
  - Drop `storage_ledger_host_id_idx`: the unique `(host_id, period)` leads with `host_id`.
  - Drop `article_feedback_slug_idx`: 0 scans. The summary groups the whole table, and the planner prefers a
    sequential scan plus a hash even with the index there (cost 31.2 against 39.4 with seqscan off).
  - Drop `storage_ledger_host_select` and authenticated's SELECT on the ledger (Q4).
  - Revoke every table privilege from anon (`revoke all on all tables in schema public from anon`). Anon held
    SELECT, TRUNCATE, REFERENCES and TRIGGER on 15 tables and TRUNCATE, REFERENCES and TRIGGER on 4 more; RLS never
    limits a TRUNCATE. Since 2026-05-28 its only table statements are 1-call red-team probes. The anon client
    (`lib/supabase/anon.ts`) calls RPCs only, and every browser-client table read is gated on a session.
  - Revoke TRUNCATE, REFERENCES and TRIGGER from authenticated on every table. No column grant carries these, so the
    column-locked writes and media's column-scoped SELECT stand.
  - Revoke authenticated's SELECT on the 10 deny-all tables plus the ledger. Every reader is the admin client (each
    `.from()` checked), and `reports` is about to hold reporters' addresses (`triage-r2-wiring`).
  - Revoke `tier_limits(tier_type)` from PUBLIC, anon and authenticated, keeping service_role. Its callers are
    definer bodies and `monthly_ingress_cap`; no code calls it; anon's one call was a probe.
  - Revoke the default privileges from anon and authenticated in `public` (Q3).
  - Create `newsletter_signups_event_id_idx` (partial, `where event_id is not null`) for the event purge's
    `on delete set null`.
  - Add the three `events` CHECKs (Q5), each with a comment on its constraint.
  - The rolled-back proof (to run on resume): anon refused every table and TRUNCATE; the four capability RPCs still
    answer; the host reads and writes her own events, profile, prefs, likes, blocks and follows, and her media on
    both milestone-30's list and the new one; another host still gets 0 rows; authenticated is refused each deny-all
    table and the ledger, while `get_host_upload_context` still reads it; `tier_limits` is refused to the client
    roles and answers the service role; each CHECK refuses one over its bound and takes the bound; and a probe table
    and function created after the change give anon and authenticated nothing (one bare revoke from public clears
    the function).
- **The items: what part 2 (`20260929170000_schema_pass_contract.sql`, after milestone 31) was to do.** Drop the three
  reel columns (Q2). Its proof: the new host list reads; milestone-30's list answers 42703, the reason it waits.
- **Left, with why:**
  - `sent_emails_sent_at_idx`: the admin's 24-hour and 30-day email counts range on `sent_at`.
  - `profiles_deletion_requested_at_idx`: the deletion sweep's partial.
  - `upload_forensics_device_idx` and `upload_forensics_event_idx`: cross-event correlation during an incident, their
    stated purpose.
  - `reports_profile_id_idx`: it covers its FK.
  - The unindexed `handled_by` and `resolved_by` FKs: only an operator's account deletion walks them, and an index
    would just trade the advisor's notice for an unused-index one.
  - `reports.media_id`: `triage-r2-wiring` adds its index.
  - No primary key on `action_attempts` and `unlock_attempts`: an append-only limiter log, where a surrogate key is
    one more index on every guest action.
  - `uuid-ossp`: nothing depends on it and it has no API surface, so dropping a platform default buys nothing.
  - The `avatars` bucket: live, used by `lib/supabase/avatar-storage.ts`, with no `storage.objects` policy, so only
    the service role writes and the public URL reads.
  - Every function has a caller (code, trigger or body), every policy uses `(select auth.uid())`, and every definer
    pins `search_path = ''`.
  - The gallery doorbell fires on every media update and returns early unless the approved set changes. Narrowing it
    to `update of status` would save microseconds, not worth touching media's triggers while `triage-r2-wiring`
    rewrites them.
- Assets requested from Will: none.
- Board ideas: none.
- Proposed migrations / Worker / Vercel / Stripe / env changes: the two files above, written on Q1's yes. The Auth
  connection strategy is a Supabase dashboard setting (Deferred).
- Calls his to overrule: Q2 to Q5, each built as recommended once Q1 is answered.
- Look at first: Q1.
