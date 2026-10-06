---
track: upload-sums
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "567e8710"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - supabase/migrations/20261006180000_upload_sums.sql
  - src/lib/db/queries/storage-list.ts
  - src/lib/db/queries/storage-list.test.ts
  - src/lib/db/queries/storage.ts
  - src/lib/db/upload-sums.test.ts
  - src/lib/upload/server-pipeline-meter.ts
  - src/lib/upload/server-pipeline-meter.test.ts
  - src/lib/upload/server-pipeline-meter-migration.test.ts
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/uploads-and-r2.md
  - docs/systems/billing-caps.md
  - docs/systems/lifecycle-recovery.md
  - docs/systems/database-security.md
  - docs/PRICING.md
---

# lp/upload-sums

**Goal.** Per-event byte sums kept in SQL (PRICING.md's lever 7, "The dashboard and the storage list page"), so an upload's three reads of the host's bytes and the size list's per-event totals stop walking every item: a 5,000-event account costs what a 50-event one does. One migration, written here and applied by the Orchestrator through the Advisor.

## The brief

**The round's direction (Will, standing since round 13):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; delight where it costs nothing in clarity; nothing depends on a timeline; immediate, or a clear state and a way to stop it; no AI managing it (every operator fix ships its `/admin` control and its health signal, zero silent failures); cost designed like the architecture; production is the working version.

**Why now.** The ROADMAP's line: an upload's three reads of the host's bytes through `host_storage_summary` (the context, `meter_upload`, then `create_media*` under her lock) and the size list's per-event totals (`readStorageEvents`, `src/lib/db/queries/storage-list.ts`) each walk every item she owns. Read `docs/systems/uploads-and-r2.md`, `billing-caps.md` (the cap meter and its ★ lines), `lifecycle-recovery.md` (Deleted, the purge, restore) and `database-security.md` (lock order, grants) first; the newest definitions are `host_storage_summary` in `20261003220000_deleted_counts.sql`, `meter_upload` in `20261005181000_billing_integrity.sql`, `create_media` and `create_media_as_host` in `20261005200000_capture_time.sql`, `host_active_bytes` in `20260604002059_active_bytes_cap_meter.sql` and `purge_media_rows` in `20260929140000_triage_r2.sql`.

**The work:**
1. A per-event sum (bytes and counts by the states `host_storage_summary` reports) kept exact by the database itself at every write that moves bytes: an upload landing, a status change (removed, restored, permanent delete asked), the purge, an event deleted or restored. A trigger on `media` or the writing functions, your design, with its reason; every writer keeps the one lock order (her profiles row first). A backfill in the same migration, and a reconciliation the nightly sweep can run, raising a health signal on `/admin/jobs` when a sum drifts from the walk, never fixing it silently.
2. `host_storage_summary` (and the three upload reads through it) and `readStorageEvents` read the sums, with the same answers they give today: a parity proof in the migration's rolled-back proofs (the walk and the sums agree on a fixture account with every state).
3. The cost written down: PRICING.md's lever 7 line updated by the Orchestrator from your Handoff's numbers (rows read before and after for a 50-event and a 5,000-event account).

A migration: `supabase/migrations/20261006180000_upload_sums.sql`, starting from each function's newest definition, its grants exact (CLAUDE.md's ★ lines: revoke from `public` first, then grant exactly; a table a client must reach takes its column grants in its own migration), with rolled-back proofs (`begin; ... rollback;`) at the file's foot: RED without the file's statements, GREEN with them, each step trapping its own failure into a temp `proof` table. ★ Proofs that read state print booleans as `::text` ('true'/'false'), never `format('%s', bool)` (which prints t/f), and each step's exception handler wraps only that step. ★ Postgres 17 has no `min()`/`max()` over a uuid: order by the column and take one. You never apply it: the Orchestrator runs the proofs, the Advisor reads it, then it applies. Integration lands after milestone 38's merge, so build against launch-prep as it is.

Out of scope: the dashboard's first page of events (lever 7's other half), and any change to what a host or guest sees.

**Verify on.** The whole gate on the synced tree, each step on its own exit code, and `pnpm lab:smoke`; the SQL proofs written ready to run with the result each must show; an upload and a delete walked on a local production build at 3000 as a test host (`usher/kit/redteam/signin.mjs`), the size list's totals read before and after.

Model: Opus. Cut 2026-10-06 by the cloud-seated Orchestrator; you run in a cloud session of your own (the spawn prompt's boot).

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- none yet

## System-doc edits (in place, owned facts only)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- The work commit and the sync commit, pushed (or: launch-prep had not moved); the head is in the chat line
- Every claim names its artifact (a commit, a log line, a path), so the Orchestrator checks rather than believes.
- Gates on the synced tree, each on its own exit code, and the sha they ran on
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The items, one line each
- Assets requested from Will: none, or one per line: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- Board ideas: an improvement you saw beyond your lane, one line each (the Orchestrator may open a board for it)
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Calls his to overrule, one line each
- Look at first: ...
