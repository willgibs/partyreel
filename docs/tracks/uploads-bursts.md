---
track: uploads-bursts
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "e74f8e07"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/guest/use-upload-queue.ts
  - src/lib/guest/use-upload-queue.test.tsx
  - src/lib/guest/use-upload-queue.stop.test.tsx
  - src/lib/guest/use-upload-queue.heal.ts
  - src/lib/guest/use-upload-queue.heal.test.tsx
  - src/lib/upload/
  - src/components/guest/upload/failure-sheet.tsx
  - src/components/guest/upload/failure-sheet.test.tsx
reads:                  # single-sources you depend on: never duplicate, never edit
  - CLAUDE.md
  - docs/systems/guest-flow.md
  - docs/systems/uploads-and-r2.md
  - docs/systems/testing-verification.md
---

# lp/uploads-bursts

**Goal.** The upload queue's two throughput lines: a dropped burst's Retry all re-queued as one burst, and the next burst started once the last one's bytes are up rather than after its complete. A production lane: the whole gate, no board.

## The brief

**The round's direction (Will, standing since round 13):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; delight where it costs nothing in clarity; nothing depends on a timeline; immediate, or a clear state and a way to stop it; no AI managing it; cost designed like the architecture; production is the working version.

**Why now.** Two of ROADMAP Now's upload lines cost a guest time and the platform calls on exactly the night that matters (a big pick at the party, a dropped connection), and both sit inside the queue alone. Read `docs/systems/guest-flow.md`'s "The upload act" and `docs/systems/uploads-and-r2.md` first (the bursts, the presign and the complete, what a complete records and meters), then the queue's head (`src/lib/guest/use-upload-queue.ts`) and `src/lib/upload/burst.ts`.

1. **Retry all re-queues once.** The failure sheet's Retry all re-queues its files one at a time and each call runs the queue (`use-upload-queue.ts`'s `retry`), so the first run takes a burst of one: a dropped burst's Try again is two completes where one would do (walked on uploads-idempotent). Re-queue the whole list, then run the queue once, so a dropped burst comes back as one burst. A single file's Retry stays as it is; the queue's status gate (`retryAll` re-queues each listed id only while it still stands refused) holds.
2. **The next burst starts on the last one's bytes.** A burst boundary (past 20 files, 1 GiB, or a pick made while a burst goes) waits for the last burst's complete before the next burst's first file prepares and presigns (the queue awaits `uploadBurst` whole). Start the next burst once the last one's bytes are up, its complete still in flight, so a 60-photo pick never idles the connection for a complete's round trip; the completes stay ordered as the server needs them (a burst's complete is its recording and metering: read what `create_media*` and the meter assume about two completes of one guest in flight, and say in your Handoff why the overlap is safe, or keep a narrower overlap where it is not). The stop (the stack's x), the failure sheet, the shutter's ring and her tracker read the same standings they read today.

Both are the queue's, so the progress a guest sees must not change shape: the same stack, the same counts, the same failure sheet. Retire both ROADMAP lines in your Handoff's list.

Out of scope: the one-file presign and complete bodies (their own ROADMAP line, a milestone after bursts), the waiting sheet's camera poster (its sheet is another lane's this round), per-event byte sums (a migration), and the Review-to-develop races (a nightly heal with its own job and signal).

**Verify on.** The whole gate on the synced tree, each step on its own exit code; the queue's tests for both changes (a dropped burst's Retry all is one burst and one complete; the next burst's first presign starts before the last complete answers, and a refused complete still surfaces on the failure sheet with its files); and a real walk through a guest's join (`usher/kit/redteam/join.mjs`, an album of willg97's named '(disposable)' with Settings > Who can get in > Type a name first, deleted after) on your own production build at :3000: a pick of 45 generated photos (`node usher/kit/media-gen.mjs`) sent at 375 on a throttled network with `send.mjs`'s in-flight recorder, the second and third bursts' presigns timed against the previous completes (before and after, both in your Handoff), every file landed once (rows counted through the REST API, read-only), and a dropped connection mid-burst (CDP offline) then Retry all, counted as one complete.

Model: Opus. Cut by the cloud-seated Orchestrator; you run in a cloud session of your own (the spawn prompt's boot).

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
