---
track: drive-hardening
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "b4e4c064"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - workers/drive/
  - src/lib/drive/
  - docs/systems/drive-export.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/database-security.md
---

# lp/drive-hardening

**Goal.** Drive's last correctness before it goes live: a throttled upload retries with a body it can still send, and one Partyreel folder per Google account however often she reconnects.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline; "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control, zero silent failures); cost is designed like the architecture. Production is the working version: a pick is the best of what was drawn, never a rule.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app, and nothing deploys (the Drive Worker included: it deploys with milestone 38). Port 3131 is yours; 3000 is Will's desk.

**Why now:** Drive goes live at milestone 38, when its Worker deploys. Its desk re-walk passed with no HIGH or MEDIUM, and these two ROADMAP lines are the correctness left on its road (each quoted whole; read the code they name first):
- Drive Worker: a 'slow down' on an upload PUT retries with the R2 stream it already spent (`transfer.ts`'s `withRate` around `putWhole` and `putChunk`), so each throttled PUT fails as a runtime error and spends one of the file's five attempts; re-read the range and ask the session where it stands before the retry; and cancel the Google answers it never reads (`getFile`'s 404, `startSession`, `undo`), or a check's eight lanes meet workerd's six-connection stall warning (drive-fixes).
- Drive: after a same-account reconnect `ensureRoot` makes a second "Partyreel" folder (the root id left with the row), so a re-send's Open in Drive points at a new, maybe empty album folder while the kept files sit in the first; mark the root with an `appProperties` and look it up at connect (the Advisor's Q35).

Each change pinned by a test that fails on the old code:
1. **A throttled PUT retries with a body it can still send:** a retry reopens what it sends (a fresh R2 read, from the right offset for a chunk), so a throttled item resumes, or fails with its own reason, and never as a runtime error. Then audit the Worker's other retry paths for the same spent-body pattern (a session's resume, a chunk boundary, a refreshed token), and the lease's attempts accounting under throttling (a 'slow down' is Google's pacing, never the item's failure).
2. **One Partyreel folder per Google account:** after a same-account Disconnect and Connect, a send finds the root folder the app made before rather than making another, and a re-send's Open in Drive opens the folder that holds its files. `drive.file` sees what the app itself created, so find it by a mark the app sets on it (`appProperties`), never by name alone (a host's own folder may share the name); a folder she deleted or trashed is made again. Recommended: Disconnect keeps forgetting every id (the re-walk proved it), and the mark is what finds the folder again; write it under Questions if you see a better answer.

Constraints: no live Drive walk (Google's consent screen on the test project is Will's to press): unit tests with fakes, the Worker's own tests, and the live check joins milestone 38's walk, written in your Handoff as the smallest walk for the Orchestrator. `src/lib/db/queries/drive.ts` is edited by crumbs-82 too: if you must touch it, the fewest lines, named in the lane check. A migration only if the design truly needs one (named in your Handoff; the Advisor reads it first). The docs say the new truth in `docs/systems/drive-export.md`.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- **Where is the Partyreel folder looked up: at the press or at connect?** The ROADMAP line said at connect.
  Recommended and built: at the press (`ensureRoot`), only when the connection knows no live folder: one `files.list`
  on the first press after a connect, the callback untouched, and a folder she binned covered by the same path.
  Overrule: a lookup in the callback, one Google call on every connect.
- **Do two Partyreel accounts on one Google account share one "Partyreel" folder?** Recommended and built: yes. The
  mark names Partyreel, not the account (`pr_root=1`), as the goal reads "one Partyreel folder per Google account",
  and the album folders keep the albums apart by name. Overrule: put the account's id in the mark, so each account
  gets its own folder (two same-named folders in that Drive).
- **What does sending an album again do after a same-account Disconnect and Connect?** Recommended and built, as the
  brief said: Disconnect still forgets every id and the mark finds only the Partyreel folder, so the album goes again
  whole, into a second same-named album folder inside it, and Open in Drive opens the folder that holds its files.
  The better answer (the album folder found by a `pr_event` mark, its files found by `pr_media` when the press found
  the folder rather than made it) needs a column on the send, which is a migration, so it is a Deferred line.
  Overrule: open that lane now.
- **What happens when Google answers a chunk with a 308 that keeps none of it?** Recommended and built: it counts as
  a server failure, with the session kept and the file retried a minute later; before, it looped until the slice
  ended. It is Google's fault and rare. Overrule: wait it out like a slow down (about two minutes, then the file goes
  back uncounted).

## System-doc edits (in place, owned facts only)

- `docs/systems/drive-export.md`, "A send", the press: one Partyreel folder per Google account, found by its private
  mark (`findRootFolder`); the race rules: the loser undoes only a folder it made, never the winner's, and never takes
  back the folder it just saw binned.
- The same doc, "Sending again": an earlier connection's files are forgotten with it, so after a Disconnect the
  album goes again whole, into a new album folder.
- The same doc, a new bullet: Google's slow down is never a file's failure, and every PUT sends a read of its own
  (`sendBytes`). It covers the pace (slow downs in a row), a session that resumes or starts over, a small file's stop,
  the file given back uncounted, and a session that never closes.
- The same doc, "The Worker": every Google answer is read or canceled. Cloudflare's six-connection limit has counted
  only connections still waiting for headers since 2026-04-09.
- crumbs-82's facts (the coordinator's ask): "What her page reads", with the poll's beat (this also gives the section
  that two code headers cite a home); Account's Sent counts this connection only, earlier sends are one Earlier line,
  and the status store drops an earlier connection's sends.

## Deferred (ROADMAP one-liners, bucket named)

- Now: Drive: after a same-account Disconnect and Connect, sending an album again sends it whole into a second
  same-named album folder (the forget dropped its files' ids); mark album folders (`pr_event`) and look files up by
  `pr_media` when the press found the folder rather than made it (a column on the send, a migration)
  (drive-hardening).
- Now: Drive: a slow down on a closing check's `files.get` answers `unknown`, which the check route drops while the
  cursor walks past it, so "every one checked" can follow a file Google never answered for; pace the check's asks
  (a few short steps) and hold the cursor at the first unknown (`check.ts`, `/api/internal/drive/check`,
  `cloud_export_check_page`) (drive-hardening).

## Handoff (replaces the chat report)

- **Commits, all pushed:** `a6d646f11` is the lane's work; `83563b6f9` fixes what the fresh-eyes review found; the
  Handoff is this file's own commit. The sync: launch-prep was fast-forwarded to `e7ac98fee` (crumbs-82 and
  credit-watch, as the coordinator asked) before any lane commit, so there is no merge commit. launch-prep has since
  moved to `438a57f3e` (event-zone, event-header-r5, records), which touches none of this lane's paths; its
  `database-security.md` lines are records, so there was no second sync.
- **Gates on `83563b6f9`**, each on its own exit code, logs in `../partyreel-wt/_scratch/drive-hardening/`:
  - `zsh scripts/build-lock.sh pnpm typecheck`: 0 (`typecheck2.log`).
  - `pnpm lint`: 0, no warnings (`lint2.log`).
  - `zsh scripts/build-lock.sh pnpm test`: 0, 1,037 files and 13,017 tests (`test2.log`).
  - `zsh scripts/build-lock.sh pnpm build`: 0 (`build2.log`).
  - `pnpm lab:smoke --base http://localhost:3131`: 0, 167 checks and 0 failing (`lab-smoke2.log`).
  - The Worker's own (`workers/drive`): `npx vitest run`, 71 passed; `npx tsc --noEmit`, 0.
  - No board, so no `lab:demo`.
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` = the owned paths, this file, and two one-line
  comment exceptions:
  - `src/app/api/drive/status/route.ts`: its header's poll beat went stale with crumbs-82; it now points at
    `use-drive-status.ts` (the coordinator's ask).
  - `src/components/app/drive/this-connection.ts`: one parenthetical this lane made untrue (a connection after a
    Disconnect no longer makes its own Partyreel folder).
- **A throttled PUT sends a read of its own** (`transfer.ts` `sendBytes`):
  - After a slow down it waits its step, asks the session where it stands, and sends from Google's byte on a fresh
    R2 read. If Google let the session go, it starts over in a new one, written ahead.
  - Past the pacing, the file goes back `released` with the lane's `throttled`, its attempt not counted.
  - Pinned in `transfer.test.ts`, each pin failing on the old code with the runtime's symptom (`TypeError: FixedLengthStream: 0 of 3000 bytes`).
  - In workerd itself (Miniflare, a local R2, a local stand-in for Google; `_scratch/drive-hardening/workerd-check/run.log`): every slow down on the old code is `TypeError: This ReadableStream is currently locked to a reader.` or `Network connection lost.`. The new code sends all of them with R2's MD5: a 429 before the body, a session let go, nine scattered slow downs, and a 0-byte file.
- **The other retry paths, audited:**
  - A session's resume, a chunk boundary, a refreshed token (401, then `auth`, then released and re-leased), the
    MD5 second read, the app client's posts and a queue retry: each one sends a fresh read or a string body. Only the
    byte PUTs had the spent body, and they are fixed.
  - A 308 that keeps nothing, and a session that holds every byte but never closes, can no longer loop.
- **The attempts accounting under throttling:**
  - The SQL was already right: `released` and a closing word's leftovers take back the lease's +1.
  - The Worker never reports a throttle as `failed` now.
  - The lane pin (FakeApp counts attempts as `cloud_export_report` does) fails on the old code. A second pin shows a
    big file slowed for good resumes its own session on the next slice.
- **Every Google answer is read or canceled:** the Worker's `getFile` 404, `startSession` and `undo`; the app's
  `driveFileState` 404 and `undoFolder`. The fake Drive watches each answer (`unread()`), and the pins in
  `check.test.ts` and `transfer.test.ts` fail on the old code.
- **One Partyreel folder per Google account:**
  - `createFolder({ root })` is the only way to make one, and it adds the colour and the mark together.
  - `findRootFolder` returns the oldest marked folder out of the bin, searched by mark, never by name.
  - `ensureRoot` finds it before making one.
  - `src/lib/drive/root-folder.test.ts` has 13 pins: 8 fail on the old code and 3 more on `a6d646f11`.
- **crumbs-82's three facts:**
  - The `drive-export.md` lines and the route header.
  - `moments.ts`: the titles for a cancel by Disconnect and by another account's connect are dropped (no place can
    reach them). Any reason with no words of its own now says "This send stopped", never that she canceled
    (`moments.test.ts`).
- **The fresh-eyes review** (a read-only helper):
  - Fixed in `83563b6f9`, each fix pinned and failing on `a6d646f11`: 1 MEDIUM (a press that lost the race undid the
    folder the winner had taken) and 5 LOWs (the folder found and gone in the same moment, a 0-byte original, small
    files ignoring the slice's end and her Cancel once slowed, scattered slow downs adding up to the lane's finding, a
    session that never closes).
  - Kept as a call: a 308 that keeps nothing counts as a failure.
  - Noted below: folders from before this lane carry no mark, and whether a re-grant still lists them is unproven.
- **Milestone 38's smallest walk** (live, P3's consent), steps:
  - (1) Connect, send a small album, and count the "Partyreel" folders in My Drive. The walk-era folders carry no mark, so expect one marked folder, made once.
  - (2) Disconnect, Connect the same account, and send the album again. Expect: no new "Partyreel"; a second album folder with the same name inside the marked one; Open in Drive shows the files.
  - If a new "Partyreel" appears at (2), a re-granted `drive.file` does not list what the app made under the revoked grant. Google's docs do not say whether it does, and the mark cannot help in that case: the line goes back to the Advisor.
  - (3) `wrangler tail partyreel-drive` shows no `drive-error` and no `Network connection lost.` on a send. A slow down cannot be forced live; the workerd check stands in.
- **ROADMAP:** this lane closes the two Drive lines it quoted (now lines 46 and 47 of `docs/ROADMAP.md`); delete
  them at the merge.
- **Assets requested from Will:** none.
- **Board ideas:** Account's Drive card could name her Partyreel folder as soon as she reconnects (found by its mark),
  instead of only after her next send.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none. The Worker's code ships with its
  milestone 38 deploy, with no new binding, secret or setting.
- **Calls his to overrule:**
  - The four Questions' answers.
  - The mark's literal `pr_root=1`, pinned by `root-folder.test.ts`. Renaming it would orphan every folder already
    made, unless the lookup also searches for the old mark.
- **Look at first:** `workers/drive/src/transfer.ts` `sendBytes`, then `src/lib/drive/service.server.ts` `ensureRoot`.
