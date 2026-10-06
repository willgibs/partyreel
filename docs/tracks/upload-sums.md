---
track: upload-sums
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
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

- **Q1 · The nightly reconciliation's wiring is TypeScript outside this lane's paths.** The SQL is here
  (`storage_sums_drift(after, limit)`: a host batch a call, compared with the walk in one snapshot, writing nothing;
  `rebuild_storage_sums(host)`: the operator's fix, her profiles row first, answering before/after). What it still needs,
  and what I recommend as one small follow-up lane right after this merge (Will's to overrule): a sub-sweep
  `src/lib/lifecycle/sweeps/storage-sums.ts` (+ test) on the purge cron, paging `storage_sums_drift` under its deadline;
  a `storage_sums` entry in `src/app/admin/jobs/catalog.ts` whose run closes ERROR on any drifted host (the hosts and
  the two figures in `counts`), so the bell rings, and never mends; and a Rebuild control on its card (AAL2, the drifted
  host named) calling `rebuild_storage_sums`. Until it lands, drift is caught only by a hand call of
  `storage_sums_drift` (the proof's step 5 does it at apply, over every host).
- **Q2 · Every media write now carries a statement trigger** (~0.3 ms a statement on the stand-in; Empty Deleted's
  2,000-item batch 0.65 s → 1.5 s, inside the 8 s timeout). Recommended: keep `EMPTY_DELETED_BATCH` at 2,000 (built);
  lowering it buys headroom only if live hardware proves slower than the stand-in.
- **Q3 · A write that bypasses triggers would leave the sums behind** (`session_replication_role = replica`, a
  data-only restore of `media` with triggers disabled). A whole-database restore carries the sum tables in the same
  snapshot, so it stays exact; a partial row restore needs `rebuild_storage_sums` for the hosts it touched.
  Recommended: the landmine line below in database-security.md, nothing built.

## System-doc edits (in place, owned facts only)

None made: every doc this lane touches is a `reads:` single-source. Proposed for the Orchestrator, each one line in place:
- `billing-caps.md`, "The cap model", the ★ line on `host_storage_summary`: it reads `host_storage_sums` and her deleted
  events' `event_storage_sums` rows, less binned items past their 30 days (found by `binned_since`), kept by the
  `media_storage_sums` statement triggers; the walk is `host_storage_walk`, which `storage_sums_drift` holds the sums to.
- `database-security.md`, the lock order: every media write now takes her profiles row (FOR NO KEY UPDATE, hosts in id
  order) in its trigger before any sum row; and the ★ landmine of Q3.
- `uploads-and-r2.md` (or wherever the size list lives): its per-event totals are `event_storage_sums` rows under RLS
  (`live_*`, column-granted), never a walk.

## Deferred (ROADMAP one-liners, bucket named)

- Now: delete the line "Uploads: keep per-event byte sums in SQL …" (this lane), and add "Jobs: wire `storage_sums_drift`
  nightly as the `storage_sums` signal on /admin/jobs, with a Rebuild control (`rebuild_storage_sums`) on its card
  (upload-sums' Q1)."
- Now: `row-cap-sql.test.ts`'s `SINGLE_ROW` reason for `host_storage_summary` still says "host_active_bytes beside two
  SUMs over host_deleted_media"; it is now "her sums, her deleted events' rows and the aged removals summed, no GROUP BY"
  (a stale reason string; the test still passes, so it was left: not this lane's path).

## Handoff (replaces the chat report)

- **Commits** (pushed on `lp/upload-sums`): work `93d766cc9`; sync `906769ae9` (launch-prep `2ba181af2` merged, no
  conflict: its new `20261006130000_drive_marks.sql` touches none of these functions or `media`); this handoff on top.
- **Gates on the synced tree** (`906769ae9`), each on its own exit code: `pnpm typecheck` 0, `pnpm lint` 0,
  `pnpm test` 0 (1,057 files, 13,307 passed, 2 skipped), `zsh scripts/build-lock.sh pnpm build` 0,
  `pnpm lab:smoke --base http://localhost:3131` 0 (182 checks, 0 failing). (The work commit `93d766cc9` passed the same
  five before the sync: 13,286 tests, 165 checks.)
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` = the migration, `storage-list.ts`,
  `storage-list.test.ts`, `storage.ts`, `upload-sums.test.ts`, this file, and ONE EXCEPTION:
  `src/lib/billing/storage-summary.test.ts` (it pinned `host_storage_summary`'s body to the walk byte for byte, which
  the brief's change necessarily breaks; reshaped on purpose, scar kept: every rule unchanged, now read off
  `host_storage_walk`, the summary's old body moved verbatim, and its service-role pin still on the summary). The two
  owned meter files were not needed: `meter_upload` and the completes read `host_storage_summary` unchanged.
- **The migration** `supabase/migrations/20261006180000_upload_sums.sql` (NOT applied; I had no SQL access):
  - `event_storage_sums` (a row per event holding anything counted: live, binned, the reduce's, bytes and items,
    `binned_since`) and `host_storage_sums` (her total over every event, deleted ones included); kept by ONE trigger body
    `media_storage_sums()` behind three statement triggers on `media` (INSERT, UPDATE, DELETE: Postgres gives transition
    tables to a one-event trigger only), folding each statement per event, her profiles row first. No FK from the sums
    to `events` (the cascade's order would lose her total); an event gone takes its whole row off her total.
  - Deleted's 30-day edge is read, never stored: `host_storage_summary` (create or replace, same signature, columns and
    grants) = her total, less her deleted events' rows by their own window (`events_host_deleted_idx`), less binned
    items past their 30 days (only events whose `binned_since` passed the edge: `event_storage_sums_aged_idx`, then
    `media_binned_idx`). Its old body is `host_storage_walk` (owner-only), the one definition the sums answer to.
  - Backfill under `lock table media in share row exclusive mode` (writes wait, reads go on) — it needs the apply's
    transaction, as `apply_migration` gives.
  - `storage_sums_drift` (service role, STABLE, writes nothing) and `rebuild_storage_sums` (service role).
  - Drift hash (from the repo): `host_storage_summary` 30b70bbe84e35dfc0662eda92ab7fa5c; the six new names must not exist.
- **Proved on a Postgres 16 stand-in** (the touched tables' columns, constraints, RLS and indexes; the current bodies of
  `host_active_bytes`, `host_deleted_media`, `host_storage_summary`, `host_room_used`, `leave_deleted`, `empty_deleted`,
  `kept_media_ids`, `purge_media_rows`, `media_release_meter`, extracted from the repo): the proof embedded at the file's
  foot, uncommented verbatim, GREEN 22/22 true and RED 21 false (only the fixtures true); a backfill over data written
  before the apply at parity; a pgbench stress (8 clients, uploads under her lock, Removes, restores, evictions, the
  purge, event hard deletes, account deletions: ~26,000 transactions) with no deadlock, no orphan sum row, and
  `storage_sums_drift` empty after. Live: the Orchestrator's run of the proof (RED then GREEN; record step 5's host count).
- **The cost (PRICING.md lever 7's numbers),** stand-in 1,002 hosts / 25,050 events / 905,000 media, warm, from the
  migration's MEASURED block:
  - one summary read (an upload makes three): 50 events / 5,000 items: every item read twice (~9,800 index entries),
    1,429 buffers, 3.5 ms → her total row + her deleted events' rows, 21 buffers, 0.7 ms. 5,000 events / 500,000
    items: ~994,000 index entries, 54,143 buffers, 228 ms → 618 buffers, 1.8 ms (60 deleted events and 55 events
    holding an aged removal, each read by key; the night's purge leaves aged removals near none).
  - the size list's totals (PostgREST rows): 50 events: 50 event rows + every live item (~4,700, five 1,000-row pages
    or more) → 50 + ≤50 sum rows (two requests). 5,000 events: 5,000 + ~470,000 item rows (~475 requests) →
    5,000 + ≤5,000 (ten requests). willg97's account today: 24 + 2,855 → 24 + 21.
  - the price: ~0.3 ms a media statement; Empty Deleted 2,000 items 0.65 s → 1.5 s; the backfill 905,000 media 1.2 s.
- **TypeScript:** `readStorageEvents` reads her live events and `event_storage_sums` (`.eq("host_id")`, `.gt("live_count", 0)`,
  keyset on `event_id`, under RLS) and joins them; the typed seam `sumsDb` until the types regenerate (drop it then).
  `storage-list.test.ts` reshaped (scar kept) + three new cases (past 1,000 events, never another host's / deleted /
  gone / empty row, the read names her). `src/lib/db/upload-sums.test.ts`: 16 guards (the summary never walks; binned
  spelled one way, host_deleted_media's own; the window; three triggers; the lock before any sum write; the walk
  verbatim; grants and RLS), each mutation-checked.
- **The walk (upload, delete, the size list before and after): NOT DRIVEN** — the new size-list read needs the
  migration live (`event_storage_sums` answers PGRST205 today, read-only REST check), and an upload or delete on today's
  schema exercises nothing of this lane. The before-reading is taken (read-only, service key): willg97@gmail.com's
  summary active 533,430,169 / Deleted 1,359,067,754 / system 0; the size list 24 live events, 21 listed, 2,855 items,
  533,430,169 bytes, heaviest dc74eb95… 302,608,403 (111). After the apply: on a production build at 3000 as willg97
  (`usher/kit/redteam/signin.mjs`), open the storage list, read the same 21 totals; upload one photo, the event's total
  grows by its bytes; Remove it, the total drops and Deleted grows; Delete permanently, Deleted drops; then
  `storage_sums_drift(null, 1000)` drifted `[]`.
- Test data left: none (every proof and stand-in ran rolled back or on the throwaway stand-in).
- Assets requested from Will: none.
- Board ideas: none.
- Proposed migrations / Worker / Vercel / Stripe / env changes: the one migration above (apply BEFORE this build deploys:
  its size list reads `event_storage_sums`); then regenerate `src/lib/db/types.ts` (two tables, three functions) and
  drop `sumsDb`. No env, Worker, Vercel or Stripe change.
- Calls his to overrule: Q1 (the reconciliation's wiring as a follow-up lane, the signal ERROR on any drift, never a
  mend); Q2 (the batch stays 2,000); Q3 (a landmine line, nothing built); a trigger rather than the writing functions
  (one body, every writer, no forgotten path).
- **Look at first:** the trigger's lock (`perform 1 from public.profiles … for no key update` before any sum write) and
  the `not r.present` branch; the summary's three terms against `host_deleted_media`'s two arms; then the proof's
  step 5 count on the live run (every host at parity is the backfill's proof on real data).
