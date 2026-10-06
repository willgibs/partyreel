---
track: drive-hardening
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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
