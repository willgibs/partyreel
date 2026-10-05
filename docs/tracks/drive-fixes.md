---
track: drive-fixes
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "d753fde5"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - workers/drive/
  - src/components/app/drive/
  - src/lib/drive/
  - src/app/api/drive/
  - src/app/api/internal/drive/
  - src/lib/db/queries/drive
  - src/app/admin/exports/drive-
  - supabase/migrations/20261005180000_cloud_export_fixes.sql
  - docs/systems/drive-export.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - supabase/migrations/20261005120000_cloud_export.sql
  - docs/systems/database-security.md
  - usher/kit/vercel-usage.mjs
---

# lp/drive-fixes

**Goal.** The Drive walk's findings before Drive's Worker deploys: a send closes only after its check really ran, the doc says what Google's revoke truly touches, the sent bytes and the canceled counts tell what landed, Disconnect forgets every Drive id, the local Worker's internal errors explained or fixed, the promise picture fixed, and the sweep's cadence set by its measured cost.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline; "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control, zero silent failures); cost is designed like the architecture. Production is the working version: a pick is the best of what was drawn, never a rule.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app, and nothing deploys (no `wrangler deploy`, no secret or queue change). Port 3131 is yours; 3000 is Will's desk and 8787 the walk's Worker, both left alone. A `wrangler dev` of your own runs on 8788 against your port only.

**What happened.** Send to Google Drive (milestone 37, built; `docs/systems/drive-export.md` is its system doc) had its first live walk on Will's desk build with a real Google account and the local Worker (`wrangler dev -c wrangler.walk.jsonc`). Every step passed, with these findings; the walker's ledger (`../partyreel-wt/_scratch/drive-walk/ledger.txt`) holds each one's exact steps and readings, the Worker's log is `../partyreel-wt/_scratch/drive-wiring/wrangler-dev.log`. Each fix pinned by a test that fails on the old code:

1. **MEDIUM: a send said "every one checked" with no check run** (no check lease, 0 of 5 confirmed). Cause: in `runBatch` (`workers/drive/src/lane.ts`), the timed flush after the last item reports it sent, so `cloud_export_settle` moves the send to `checking`; the batch's closing `flush(true)` then reaches `cloud_export_settle` again, which closes a `checking` send as done. Only the check path (`check_page`) may close a `checking` send: guard it in SQL (the state machine lives in the database; a new migration, `supabase/migrations/20261005180000_cloud_export_fixes.sql`, per `database-security.md`: `create or replace` keeping the owner-only grants, verified as a rolled-back Supabase MCP check of the transitions; the Orchestrator applies it), and prove with the Worker's tests that the check really runs after a batch ends (the next lease hands out the check page, every file is confirmed, then done), and that the strip's "every one checked" words only ever follow a check that ran.
2. **MEDIUM, words only: the doc's Google line is false.** Drive's client "Partyreel Drive" lives in the SAME Google Cloud project as sign-in's client (partyreel-498522, number 401819547646), so Google's revoke (Disconnect, a different-account reconnect, the operator's Revoke every connection) removes that Google account's whole grant to the project, sign-in's approval included: the walker's Disconnect of P3's Drive removed P3's Partyreel entry from her Google connections. Nothing locks out (a Supabase session is its own), but that Google account's next Continue with Google asks for consent once more, whichever Partyreel account it signs into; and removing Partyreel at Google ends Drive too (already handled: `invalid_grant` reads revoked and mails her). Correct `drive-export.md`'s client line and every word in the product or the admin that promises otherwise; no code change. Whether Drive moves to a Google project of its own is Will's call, which the Orchestrator asks him; do not build it.
3. **LOW: the account card's "Sent 5.9 MB" counts files a re-send kept** (4.3 MB is actually in Drive): count only what reached her Drive, once per file.
4. **LOW: Disconnect leaves Drive file ids on 93 items, where the doc says finished sends "lose every Google id".** Recommended: the code meets the doc (clear them in the disconnect path, in the same migration), since a later connection to another Google account must never read another Drive's ids as kept. If you find a reason the ids must stay, say it under Questions and correct the doc instead.
5. **LOW: the local Worker logged 477 `Error: internal error; reference = ...` lines and 5 `Network connection lost`, with nothing failing.** They follow queue deliveries (the walk config's R2 binding is `remote: true`; its queue is wrangler's local one). Find the cause by reproducing on your own `wrangler dev` (8788, your port as its app): ours (a promise left unawaited, a message acked twice, a retry after an ack, an R2 body left unread) is fixed with a test; wrangler's local runtime is said in one line of `drive-export.md`'s local walk, with what the deployed Worker's logs must show instead (the Orchestrator reads them at deploy).
6. **NIT: the canceled strip said 10 of 60 when 14 landed** (files in flight at the cancel landed and a later Send again kept 14): the strip and the counts tell what landed, never a number frozen at the press.
7. **NIT: the promise picture repeats a photo, and at 375 it is cropped thin:** distinct photos, and a shape that reads at a phone's width.
8. **Cost (a check, not a finding):** the Worker's sweep (`*/5 * * * *`, `workers/drive/src/sweep.ts`) calls the app's `/api/internal/drive/sweep` 8,640 times a month, every call a Vercel function, while Vercel Hobby's 4 Active CPU-hours are nearly spent (`node usher/kit/vercel-usage.mjs`, read-only). Measure the route's CPU on a local production build (a few hundred signed calls, the median and p95 in ms), write the month's projection into `drive-export.md`, and set the cadence by it: keep five minutes if it is a sliver of the budget; otherwise the slowest cadence the sends' recovery and `/admin/jobs`' Overdue line tolerate (the Overdue threshold moves with it). Recommended answer built, listed under Questions.

Wiring rigor: the whole gate (light lab steps: `lab:smoke` on your port); the SQL's transitions as a rolled-back check (settle on a `checking` send leaves it checking; `check_page` closes it; disconnect clears the ids; the sent bytes counted once); the Worker's own tests (`cd workers/drive && npx vitest run`, and its typecheck). A live re-walk needs Drive's callback, which only port 3000 has: the Orchestrator re-walks on the desk after your merge, so list in your Handoff exactly what that walk must watch.

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
