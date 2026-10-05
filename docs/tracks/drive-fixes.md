---
track: drive-fixes
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
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
9. **LOW (ROADMAP "Now", relayed by the Orchestrator): a `lanefail` word is the one internal word whose replay is not a no-op** (three inside five minutes pause the connection until an operator's Resume, so a replayed signed word inside its window counts again). Make it idempotent: bind it to the Queue message id (one count per message) or to the connection per minute (the Advisor's Q32; recommended: the message id), built and listed under Questions, pinned by a test that fails on the old code (the same word said twice counts once). The Orchestrator retires that ROADMAP line at the merge.

**Decided by Will (2026-10-05), relayed by the Orchestrator:**
- **KEEP ONE Google project for sign-in and Drive** (item 2): no new setup, one "Partyreel" entry in a person's Google account; the accepted cost: after a Disconnect, that Google account sees Google's consent screen once more at its next sign-in. `drive-export.md` states the truth and this decision; "whether Drive moves to a project of its own" is no longer open.
- **A Google entry never feels scary to a first-time user:** a Google sign-up asks only what sign-in needs; Drive's permission is asked only when a host first sends or presses Connect on Account, after our promise screen, never at sign-up. Written into `drive-export.md`'s connection section with its reason, and pinned by `google-urls.test.ts`'s scan (no file but the Drive connect names a Drive scope; sign-in's `signInWithOAuth` asks no extra scope), each check failing on a planted violation.

Wiring rigor: the whole gate (light lab steps: `lab:smoke` on your port); the SQL's transitions as a rolled-back check (settle on a `checking` send leaves it checking; `check_page` closes it; disconnect clears the ids; the sent bytes counted once); the Worker's own tests (`cd workers/drive && npx vitest run`, and its typecheck). A live re-walk needs Drive's callback, which only port 3000 has: the Orchestrator re-walks on the desk after your merge, so list in your Handoff exactly what that walk must watch.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- **The sweep's clock (item 8): fifteen minutes, built.** Measured on a local production build (300 signed calls,
  `_scratch/drive-fixes/cost/`): a warm call 6.2 ms of CPU (median; p95 19, mean 8.9), the route's first call 164 ms,
  a fresh server's boot with it 1.1 s. A month at five minutes is 77 s warm, 24 min route-cold, 2.6 h if every call
  boots (0.5% to 65% of Hobby's 4 h, already at 3.91); at fifteen 26 s, 8 min, 52 min (0.2% to 22%), with a stalled
  send kicked within about twenty minutes, the done mail within fifteen, the hourly heartbeat inside the Overdue line
  unmoved. Overrule to five (faster mails and recovery, the worst case eats the budget) or thirty (the Overdue threshold
  to two hours). Vercel's Usage page after a week of sweeps on partyreel.com says which bound is real.
- **Disconnect forgets every Drive id (item 4): the code meets the doc, built.** No reason to keep them was found: the
  only reader (`prior_file_id`) keys on the connection, whose id leaves with its row. It needed `forgotten_at` on
  `cloud_export_items` and the `sent_with_file` CHECK restated (a sent item holds no file id only once forgotten), and
  another account's connect forgets the same way. Overrule: keep the ids and correct the doc.
- **Account's "Sent" (item 3): an album's largest ended send, canceled and stopped ones included, built.** Exact for
  every re-send (each takes the whole album and counts its kept files); an album that lost originals between sends
  reads its largest send, not its every file (exact per file needs an items read on the service role, not worth it
  now). Overrule: done sends only.
- **What landed (item 6): while a lane still holds a stopped send's files, the strip's light says Stopping, its facts
  "N of M reached your Drive so far", and it offers no Send again, built** (a Send again pressed then would send them
  twice); a big file hears the stop at its next chunk. Overrule: Send again at once.
- **A dying lane (item 9): bound to its Queue message id, built** (the last twenty ride the connection; the
  two-argument word dropped). Overrule: once per connection per minute (no Worker change, but three lanes dying in one
  minute would count as one).
- **A done send that sent nothing (item 1's words): "Nothing of {album} was left to send", never "every one checked",
  and no tile light, built.** Overrule: other words.

## System-doc edits (in place, owned facts only)

- `docs/systems/drive-export.md`, The connection: the first-time-user rule (Will) and its pin; the one-project client,
  its reason and its accepted cost (Will), replacing the false "never touches a sign-in grant"; another account's
  connect forgets the old Drive; Disconnect's forgetting (`cloud_connection_forget`, `forgotten_at`).
- A send: Lanes (a batch's last file in its closing word; a stop ends a big file at its next chunk); The closing check
  (only the check closes a checking send; `checkedAll`); What landed is said as it lands (`landing`; Account's Sent each
  file once).
- The Worker: the cron at fifteen minutes; the protocol's replay note and the poison lane's message binding; the
  sweep's measured cost and the month's bounds; the local walk's wrangler noise and what the deployed logs must show.

## Deferred (ROADMAP one-liners, bucket named)

- Now: "Drive Worker: a 'slow down' on an upload PUT retries with the R2 stream it already spent (`transfer.ts`'s
  `withRate` around `putWhole` and `putChunk`), so each throttled PUT fails as a runtime error and spends one of the
  file's five attempts; re-read the range and ask the session where it stands before the retry. And cancel the Google
  answers it never reads (`getFile`'s 404, `startSession`, `undo`), or a check's eight lanes meet workerd's
  six-connection stall warning in the deployed logs."

## Handoff (replaces the chat report)

- **Commits:** the work `b26e234dd`, then this manifest alone (the head in the chat line), both on `origin/lp/drive-fixes`.
  launch-prep moved 11 commits since the cut (`4c11a0ad3..246f5ea5d`): none touches an owned path, one touches a read
  (`usher/kit/vercel-usage.mjs`, a label), `git merge-tree` clean: no sync.
- **Gates on `b26e234dd`, each its own exit code:** `pnpm typecheck` 0; `pnpm lint` 0 (no warning); `pnpm test` 0
  (993 files, 12,263 tests); `zsh scripts/build-lock.sh pnpm build` 0; `pnpm lab:smoke --base http://localhost:3131`
  0 (170 checks; a first run timed out on the Library's cold compile, the rerun clean); the Worker's `npx vitest run`
  0 (9 files, 59 tests) and `npx tsc --noEmit` 0.
- **The SQL, proved on the live schema BEFORE the apply** (one `execute_sql` each: `begin;` the file's statements, the
  check as a trapped temp function, `rollback;`; `_scratch/drive-fixes/proof/results.txt`): the file's own check held
  (`ROLLED BACK: every cloud_export_fixes check held {"in_drive": 12078, "lane_failures": 3}`), 20261005120000's 24
  sections held after it (its lane words given message ids), and against the live OLD settle the walk's finding
  reproduced (`the closing report: done, confirmed 0 of 5, check leases 0`), so FAIL 2 fires on the old code. After
  each run nothing persisted (no new column, the two-argument word standing, the 93 ids still there).
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` = owned paths and this file, but three lines of
  `src/app/admin/jobs/catalog.ts`'s `drive_export` entry (its cron, cadence and description, so the missed-run rule
  judges the sweep's real clock; `sweep-cadence.test.ts` pins it to `wrangler.jsonc`) and one line of
  `src/app/admin/jobs/owed-words.ts` (the Stuck line's "every fifteen minutes").
- **Items:**
  1. ★ `cloud_export_settle` closes a checking send only once its walk is through (`20261005180000`, pinned by
     `drive-fixes-migration.test.ts` and the rolled-back check); the Worker says a batch's last file in its closing
     word (`lane.ts`; `lane.test.ts`'s closing-word test fails on the old code); a model of the app's transitions
     (`testing/fake-app.ts`) proves the next lease is the check's first page, every file confirmed, then done;
     "every one checked" only of a send that sent something (`checkedAll`, in the strip, What's using space and the
     done toast).
  2. The doc's Google line is true and records Will's one-project decision and cost; no product or admin word promised
     otherwise (grep of the Drive surfaces and the admin); the first-time-user rule written and pinned
     (`google-urls.test.ts`, planted violations included).
  3. Account's Sent: `sent-totals.ts` (the walk's rows give 4,488,290 B, the old sum 6,167,537 B: `sent-totals.test.ts`).
  4. Disconnect and another account's connect forget every Google id (`cloud_connection_forget`); the walk's 93 items
     forgotten by the migration itself.
  5. The local Worker's 477 lines are wrangler's remote-binding proxy, not ours: reproduced on my own `wrangler dev`
     (8788, sink on 3131) with bare R2 `head()`s, about two lines a remote call, in the fetch context too, nothing
     failing (`_scratch/drive-fixes/repro/findings.txt`); said in `drive-export.md` with what the deployed logs must
     show (neither line).
  6. A stopped send tells what landed (`landing` in the status route, `use-drive-status.ts` keeps polling;
     `use-drive-status.test.tsx` fails on the old code); a stop ends a big file at its next chunk (`transfer.ts`;
     `lane.test.ts`'s chunk test fails on the old code).
  7. The promise's folder: three different photographs, 16:9 in a hand (`drive-parts.tsx`, `drive-parts.test.tsx`);
     before and after rendered with the built CSS and real photos: `_scratch/drive-fixes/picture/{before,after}.png`.
  8. The sweep every fifteen minutes (above; `drive-export.md`, "The sweep").
  9. ★ A dying lane counts once a Queue message (`lanefail` route, both protocol twins with a pinned vector, the queue
     handler's `index.test.ts`, `route.test.ts`: the same word said twice counts once). Done: retire ROADMAP's
     `lanefail` line.
- **Assets requested from Will:** none.
- **Board ideas:** the closing check of a big album sits at "Checking every file in your Drive" with the meter at 99%
  for its whole walk; its cursor could say "Checking 1,200 of 5,000" (a progress column for the walk).
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** ★ apply `20261005180000_cloud_export_fixes.sql`
  BEFORE this merge's code reaches a build (the lanefail route sends `p_message`; nothing deployed calls the dropped
  two-argument word: only the undeployed Worker's dying lane), then regenerate `src/lib/db/types.ts` and drop the
  typed seam in `recordLaneFailed` (`queries/drive.ts`, the cast); advisors expect no delta (25 / 4 / 36). The Worker's
  cron becomes `*/15 * * * *` at its deploy. No Vercel, Stripe or env change.
- **Calls his to overrule:** the sweep at fifteen minutes; Send again held while files land; Sent as each album's
  largest ended send; forgetting the ids at Disconnect; the words for a done send that sent nothing.
- **The desk re-walk must watch (after the apply and the merge):** (1) a small send's strip goes Sending, Checking,
  In your Drive, and the DB holds a `check` lease for it and every item `confirmed_at`, closed after that lease;
  (2) a re-send where all are kept: `items_kept` = `items_sent`, Account's Sent counts the album once; (3) Cancel
  mid-send: Stopping with "N of M reached your Drive so far", then the landed count with Send again, equal to
  `items_sent`; (4) Disconnect: no `drive_file_id`, `drive_md5` or `session_uri` left on her sends, `forgotten_at`
  set, counts unchanged, and P3 meets Google's consent at her next sign-in (accepted); (5) the promise at 375: three
  different photographs; (6) the local Worker still prints wrangler's lines with nothing failing; (7) /admin/jobs'
  Drive card says "Every 15 minutes". This lane's own trace in the live data: one `drive_export` heartbeat from the
  cost run (`job_runs` 18:50:44Z, the real sweep with nothing to do: no connection, no send unfinished, no done mail
  owed); its counts carry the cost driver's depth names (`drive_queue`, `drive_dead_letters`), not the Worker's
  (`queue_backlog`, `dead_letter_backlog`), so the Drive queue cards read nothing from it until the deployed Worker's
  first sweep writes the next.
- **Look at first:** `supabase/migrations/20261005180000_cloud_export_fixes.sql` (the settle's guard, the forget
  helper, the lane word), then `workers/drive/src/lane.ts`'s closing word and the cadence Question.
