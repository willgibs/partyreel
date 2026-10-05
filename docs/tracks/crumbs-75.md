---
track: crumbs-75
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "94d66338"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/email/send.ts
  - src/lib/email/send.test.ts
  - src/lib/email/send-kinds
  - src/lib/lifecycle/sweeps/
  - src/lib/lifecycle/account-deletion
  - workers/backup/src/prune-run
  - src/lib/db/queries/jobs
  - src/app/admin/jobs/
  - src/lib/admin/palette
  - supabase/migrations/20261005060000_over_capacity_read.sql
  - docs/systems/lifecycle-recovery.md
  - docs/systems/admin-observability.md
  - docs/systems/durability-backups.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/lib/db/read-all.ts
  - docs/systems/database-security.md
---

# lp/crumbs-75

**Goal.** Six ROADMAP crumbs that make the background jobs fail loudly and scale: a one-time notice whose send failed is retried until it sends; the multi-event deletes run in event-id order; the backup prune's primary_missing becomes a durability alert with its restore path; an export whose Worker never reported reaches the bell; the over-capacity sweep reads every account over its cap exactly; the admin palette names the spend watch's two switches.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish (the viewfinder's corners survive only as a focus mark, never a style, and so does nothing of their loading state); a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline (undated, morning-only and multi-day events all read well); "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control); cost is designed like the architecture (every image and video action multiplies at scale). Production is the working version: a pick is the best of what was drawn, never a rule.

**★ Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app (Vercel's Hobby CPU is at its limit). Port 3131 is yours; 3000 is Will's desk and red-team 54's, never touched; 3130 is the Orchestrator's gate.

**Why this lane:** Partyreel runs with no AI managing it, so a job that can fail quietly is a bug even when nothing has failed yet. Every fix here ships its signal in `/admin/jobs` (or the bell) in the same change, never a hand-run SQL.

**The fixes**, each pinned by a test that fails on the old code:
1. **A one-time notice is lost for good when its send fails.** `STATE_NOTICES` in `src/lib/email/send-kinds.ts` (an idle event removed, a grace opened, a plan reduced) go through `sendOnce` (`src/lib/email/send.ts`), which releases the claim for a next run its sweep never makes. Retry a released notice until it sends, so a Resend outage cannot drop it, and let the operator see a notice that keeps failing.
2. **Deadlock-prone multi-event deletes.** `sweeps/expired-events.ts` and `lifecycle/account-deletion.ts` cascade into `album_state` and `album_changes` in row order, so overlapping purge runs can deadlock with the album-log prune (retried next night). Delete in event-id order.
3. **The backup prune's `primary_missing`** (rows alive, primary objects gone, the backup the only copy) closes its run `ok` with a note (`workers/backup/src/prune-run.ts`). Raise it as a durability alert with a restore path beside the dead letters in `/admin/jobs`. The Worker deploy is the Orchestrator's (`wrangler`): say in your Handoff exactly what to deploy and how to verify it.
4. **An export whose Worker report never arrived** stays a Started or Checked row on `/admin/exports` and never reaches the bell. The `export_delivery` signal (`src/lib/db/queries/jobs.ts`) counts mints left with no end after a few hours.
5. **The over-capacity sweep sees only some accounts at scale.** `sweeps/over-capacity.ts` checks every profile past Free's cap with one `host_storage_summary` call each, so past a few hundred paying hosts a night sees only some. One SQL read of the accounts over their effective cap makes it exact. If that needs a function, write the migration as a new file in `supabase/migrations/` (named exactly `20261005060000_over_capacity_read.sql`, the file your manifest owns) (definer rules, `revoke ... from public` before exact grants, per `docs/systems/database-security.md`; prove it with a rolled-back check through the Supabase MCP). The Orchestrator applies it, and nothing of yours may write to the database.
6. **The admin palette** (`src/lib/admin/palette.ts`) names the spend watch's two switches, jumping to `/admin/jobs#switch-uploads_enabled` and `#switch-lifecycle_mail_enabled`.

Wiring rigor: the whole gate. Record subtractively in the three system docs you own.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

1. **How long is a failing one-time notice retried?** Recommended, built: by its own sweep each night, given up 30
   days after its first failure with a last record (Sentry and the `email_delivery` row; `NOTICE_RETRY_DAYS`,
   `send-kinds.ts`): by then the removal or reduce it reports has purged for good, and a grace-start that late is
   covered by the grace's own reminder. The other way: retry until the account goes, with an operator's Drop on
   `/admin/jobs` (a control and its sheet).
2. **May a late notice go once its news is stale?** Recommended, built: no. It goes only while what it says is still
   so (her event still in Deleted; the announced grace still standing and she still past her line, by that run's
   candidate read), else it is let go quietly; the reduce's notice always goes, since it says what was done.
3. **Which downloads does `export_delivery` count as owed an end?** Recommended, built: a mint the Worker spoke of (its
   check, or its stream's start) with no end six hours on, for the day after, reading Needs a look. A Started row the
   Worker never spoke of is left out: a local build's mint has no report address and an older Worker never reports,
   and a Worker whose reports stopped reaching the app at all reads Missed on its own signed heartbeat. The other way:
   every mint with no end, which rings the bell after any local download test against the live database.
4. **Owed work's verdict.** Recommended, built: Needs a look (nothing threw; a person looks), under a failure in the
   window. The other way: Last run failed.
5. **The backup's lone copies: a written restore path, or a restore of their own?** Recommended, built for now: the
   card names the restore (copy each key from `partyreel-backup` into `partyreel`; the prune's log names every key),
   and nothing copies one back by itself, since the prune cannot tell a lost object from one its row no longer names
   (a blind copy would be deleted again as an orphan). An automatic restore is a Deferred line below; it is the
   operator fix CLAUDE.md asks to ship as a control, so it may want to come sooner.
6. **The event deletes: a request an event, or an ordered RPC?** Recommended, built: one statement an event, in id
   order, the deadline asked between two (no migration; a few tens of milliseconds each; a large account's events may
   take more than a night). The other way: one RPC deleting a batch in id order in one transaction (a migration, one
   request a batch).

## System-doc edits (in place, owned facts only)

- `lifecycle-recovery.md`: "The daily purge cron" gains the event-id-order line (`deleteEventsInIdOrder`); "Over the
  cap" gains the exact candidate read; "Sending email": the lost notice becomes a bullet of its own, kept and retried.
- `admin-observability.md`: "Backend jobs": a signal's owed work reads Needs a look; the two zero-tolerance readings;
  the lone copies ring from their card alone so far.
- `durability-backups.md`: the prune's lone copies, a bullet of their own (counted always, logged, the card and its
  restore, the 36-day gate and the per-range count).

## Deferred (ROADMAP one-liners, bucket named)

- Admin: `/api/internal/job-run` raises the prune's `primary_missing` at its source (a Sentry warning, the ops mail) as it does dead letters; today its card and the bell carry it alone.
- Durability: restore the backup's lone copies on their own: the prune's confirm route answers which keys a live row names, and the Worker copies those back from `partyreel-backup` (today a person copies each key from the run's log).
- Durability: the prune ledger carries `primary_missing` across a pass, so a pass that spans runs reports the whole backup's lone copies, not each run's range.

## Handoff (replaces the chat report)

- **Commits:** work `47f683adf`, `fc8adb3f2`, `c1ceb6a01`; sync `f64eb7160` (launch-prep at `9e775dca8`: `read-all.ts`,
  a read of this lane, and the row-cap guards' drop-aware migration reader landed with crumbs-77; compute-reads);
  pushed; the head is in the chat line.
- **Gates on the synced tree `f64eb7160`, each on its own exit code:** `pnpm typecheck` 0; `pnpm lint` 0; `pnpm test` 0
  (943 files, 11,773 tests); `zsh scripts/build-lock.sh pnpm build` 0; `pnpm lab:smoke --base http://localhost:3131`
  0 (154 checks, 0 failing; scope: the Library and the shell, no board). The Worker's own suite (`workers/backup`:
  vitest 98, `tsc --noEmit` clean) and `npx wrangler deploy --dry-run` (bundles, 32.02 KiB). Logs in
  `_scratch/crumbs-75/`.
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file; no exception.
- **1. A one-time notice is kept until it sends:** `sendOnce` keeps a notice whose claim or send fails in
  `notice_retries` (the rendered mail and whose it is, never the address) and still throws; its sweep retries it first
  thing each night through the same claim (`retryParkedNotices`), only while it is still so, giving it up recorded
  after 30 days; `/admin/jobs` counts what waits and since when (`email_delivery.owed`, Needs a look, the card's
  "Waiting" line). Tests: `send.test.ts` ("★ is kept, rendered…", the retry's nine), `inactivity.test.ts` and
  `over-capacity.test.ts` (the retry first, `stillTrue`, `graceNoticeStillTrue`), `jobs.test.ts` (kept notices
  counted), `page.test.tsx`; the keep tests fail with the keep removed (checked by mutation).
- **2. The multi-event deletes go one event a statement in id order** (`sweeps/delete-events.ts`, from
  `expired-events.ts` and `account-deletion.ts`). Tests: `delete-events.test.ts`, "★ deletes the event rows one a
  statement…" in `expired-events.test.ts` and `account-deletion.test.ts`; red on the old code (checked).
- **3. The prune's lone copies are an alert:** the Worker always reports `primary_missing` (zero included), says it
  second in the note and logs each item's keys; the catalog's `backup_primary_missing` card sits beside the dead
  letters, a failure at any count, with the restore path as its remedy. Tests: `prune-run.test.ts` ("what the backup
  alone holds", five), `catalog.test.ts` ("the backup's lone copies", four), `page.test.tsx`.
- **4. A download with no end reaches the bell:** `export_delivery.owed` counts a mint the Worker checked or began with
  no end past `EXPORT_END_GRACE_MS` (six hours), for the day after; Needs a look, the card's "No end" line. Test:
  "★ counts a download the Worker spoke of…" in `jobs.test.ts` (nine rows, three owed).
- **5. The over-capacity sweep reads exactly its accounts:** `over_capacity_candidates` (a grace standing, or kept past
  her own line, each with its summary; the meter decides who is summed) in pages of 100; no per-account call. Tests:
  "★ reads exactly the accounts…" (306 accounts, three candidates, one read, no summary call) and the 1,299-candidate
  paging in `over-capacity.test.ts`, red on the old code (checked); `over-capacity-sql.test.ts` pins the SQL.
- **6. The palette names the spend watch's two switches** (`action-guest-uploads`, `action-lifecycle-mail`). Tests:
  `palette.test.ts`, and `spend-watch-card.test.tsx` holds each jump to the row the card renders.
- **Assets requested from Will:** none.
- **Board ideas:** `/admin/jobs` could list the kept notices (kind, since when, tries) with a Drop under its sheet, if
  Will wants a hand on one before its 30 days.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:**
  - **The migration, `supabase/migrations/20261005060000_over_capacity_read.sql`** (md5 `bf001b5391be72dc2ead88f210302722`,
    the one file the manifest owns: the function and the table, each standing alone). ★ Apply before this build
    deploys (the sweep reads its candidates there alone; the console reads `notice_retries`). Proved rolled back on the
    live project, the file's statements at the head of one `execute_sql` call, ending `ROLLED BACK: every
    over_capacity_read check held {"kept": 764969990, "answered_of_two": 2, "candidates_today": 0}`; nothing persisted
    (`to_regclass('public.notice_retries')` and `to_regprocedure('public.over_capacity_candidates(uuid, integer)')`
    read null after, no profile in a grace, none of the check's values left). Pre-flighted on a throwaway Postgres 17
    whose `host_storage_summary`, `host_active_bytes` and `host_deleted_media` bodies hash equal to the live ones: on a
    20,000-profile stand-in a page of 100 summed 153 accounts and none of the 19,450 inside their plans (Limit, Nested
    Loop, Function Scan loops=153). Advisors (security): 19 / 4 / 36 to 20 / 4 / 36 (`rls_enabled_no_policy` gains
    `notice_retries`, by design). Then regenerate `src/lib/db/types.ts` and drop the three seams (`untyped` in
    `src/lib/email/send.ts` and `src/lib/lifecycle/sweeps/over-capacity.ts`, `noticeRetriesDb` in
    `src/lib/db/queries/jobs.ts`).
  - **`database-security.md`** (a read of this lane, so proposed, not edited): the advisor line's 19 becomes 20, and
    the deny-all list gains `notice_retries` (the one-time notices kept for a retry, service role only).
  - **The Worker, `partyreel-backup`:** deploy from `workers/backup` (`npm ci`, then `npx wrangler deploy`); only
    `src/prune-run.ts` changed (no binding, var, secret, Durable Object migration or cron). Order-free with the app.
    Verify: the next prune run (Mondays 06:00 UTC, or the `0 6 * * 1` cron triggered from the dashboard) closes with
    `primary_missing` in its counts (0 today), and `/admin/jobs`'s "Held by the backup alone" card reads "0 held by the
    backup alone", Healthy, where it reads "No reading" before; any count reads Last run failed and rings the bell, and
    Workers Logs show "prune: held by the backup alone" an item.
  - Vercel, Stripe, env: none.
- **Calls his to overrule:** Questions 1 to 6 above.
- **Look at first:** `src/lib/email/send.ts` (`keepNotice`, `retryParkedNotices`); the migration's function body and
  its check; `src/lib/lifecycle/sweeps/over-capacity.ts` (`readOverCapCandidates`, `graceNoticeStillTrue`).
