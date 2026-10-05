---
track: crumbs-75
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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
