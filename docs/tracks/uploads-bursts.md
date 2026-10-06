---
track: uploads-bursts
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
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

- **The overlap's presign is judged without the last burst's files (built, his to overrule).** The next burst's
  presign goes while the last complete is out, so the meter's month and room and the camera's roll judge it without
  those files, which are not recorded yet. The completes never overlap (`recordAfter`), and the complete re-judges each
  file on what is recorded, in the same words (`cap-words.ts`; `roll_spent`). So the one cost is that a file the boundary
  let through at an album's exact cap or roll end sends its bytes before it is refused onto the failure sheet. It is
  never counted (staging is swept). Recommended: keep it. Alternative: hold the overlap when the album has a roll, a
  camera fact the queue does not read today.
- **A Retry all whose files span more than `BURST_RECORD_WAIT_MS` (10 s) is still recorded in two completes.** It is one
  burst, but the uploader's own record wait applies (walked: six 4 MB photos at a throttled 4 MB/s gave completes of 4
  and 2). Recommended: leave it. The wait is the burst's own rule (the manifest Question in `burst.ts`), and it is not
  this queue line.

## System-doc edits (in place, owned facts only)

- none in this lane's paths (no `docs/systems/` file is owned). Proposed for the Orchestrator, one line each:
  - `uploads-and-r2.md`, "In the browser a byte never waits for batching": append "A caller with a burst after it
    begins that one on this one's bytes (`onSendDone`) and holds its complete for this one's answer (`recordAfter`):
    the line never idles for a complete, and one sender's completes never overlap."
  - `guest-flow.md`, "The upload act": after "one at a time,", add "the next burst begun on the last one's bytes,
    and a Retry all sent back as one burst,".

## Deferred (ROADMAP one-liners, bucket named)

- none

## Handoff (replaces the chat report)

- **Commits.** Work: `93ea4468` (the queue, the uploader, their tests). Sync: `f8bee397` (launch-prep `d88494cd`,
  docs only: STATUS and orchestrator). Then this manifest commit. All pushed to `lp/uploads-bursts`.
- **Gates on the synced tree `f8bee397`, each on its own exit code:** `pnpm typecheck` 0; `pnpm lint` 0 (0 warnings);
  `pnpm test` 0 (1053 files, 13214 passed, 2 skipped).
  - `zsh scripts/build-lock.sh pnpm build` 0 on `93ea4468`. Its `src/` is identical to `f8bee397`
    (`git diff 93ea4468 f8bee397 -- src` is empty); the sync brought docs alone.
  - `pnpm lab:smoke --base http://localhost:3131` 0: 138 checks, 0 failing (scope: the Library, no boards). The first
    run's one red was `/design/library`'s 20 s timeout on a cold dev compile, then green warm.
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` lists `src/lib/guest/use-upload-queue.ts`,
  `use-upload-queue.test.tsx`, `src/lib/upload/uploader.ts`, `uploader.burst.test.ts` and this file. All are owned.
  `failure-sheet.tsx` is untouched: Retry all is fixed inside the queue, so neither the sheet nor its callers changed.
- **Items:**
  1. Retry all is one burst. `retry` queues its file and asks for the run once a tick (`runSoon`, a microtask), so the
     sheet's per-file loop sends the list back as one burst. A single Retry is unchanged, and `dismiss`'s status gate
     still holds (pinned).
  2. The next burst goes on the last one's bytes. `runQueue` now flies bursts as `Flight`s: the next is taken and begun
     on `uploadBurst`'s new `onSendDone`, with at most two in play.
     - Its complete waits for the last one's answer (the new `recordAfter`), so the completes stay one after another.
     - A pick made while the last complete is out wakes the runner (`wakeRef`) and goes at once.
     - Files in flight are never taken twice: `waiting` excludes ids holding a stop.
     - A session refusal already told in the last burst begins nothing more on its ticket. One its complete brings late
       takes the flight begun on that ticket with it: both are read as one in `afterSessionRefusal`, the old branches
       unchanged.
     - `stop` judges "too late" within its own burst: `stopsRef` now carries each file's burst.
     - The host panel's `uploadBurst` calls are unchanged (both new args are optional).
- **Why the overlap is safe:** only the presign and the bytes overlap the last complete. `create_media*` still meets
  this queue's completes one at a time, in order, each recording on what the one before recorded: the meter's month,
  the caps, the roll, the uploads line and a clip's `reel_clip_add` (spent per file at the complete, after the one
  before). The presign's meter and roll fail open by design, and the complete stays the authority, refusing in the same
  words onto the failure sheet (Questions, first line). The hourly breaker is tallied per presign as before.
- **Tests:** in `use-upload-queue.test.tsx`, "★ bursts back to back (uploads-bursts)":
  - Retry all is one burst of 5, and a single Retry is a burst of one.
  - With 21 picks, the second burst begins before the first complete answers, and its `recordAfter` stays pending until
    then.
  - A file up and `queued` at 100 is never re-taken, and a pick goes at once once bytes are up.
  - A refused complete (`cap_reached`) lands on the failure sheet with its 20 files.
  - A late `session_other_account` re-sends all 21 on the fresh ticket after one join.
  - A stop is per burst.

  In `uploader.burst.test.ts`, "★ bursts back to back":
  - `onSendDone` fires once, before the complete answers.
  - `recordAfter` holds the complete past the 10 s wait and off the screen.
  - The next burst's presign and PUT happen before the last complete answers, and the completes stay in order.

  I removed each change in turn and the tests failed: 3 red without the record gate or the run-once retry.
- **The walk** was on my own production builds at :3000: after, `93ea4468`; before, launch-prep `8c999cb3` in a scratch
  worktree.
  - Setup: an album of willg97's, "uploads-bursts walk (disposable)" (`c7c236f5-96ef-4b82-af9b-ec6f3f6ff024`), set to
    Type a name. Guests joined through `join.mjs` at 375 wide.
  - 45 generated 4 MB photos each (`media-gen.mjs`), sent with `send.mjs`'s recorder. The network was throttled with
    CDP to 4 MB/s up and 60 ms latency.
  - Timings were read from the driver's network log by a scratch reader (offsets from the first presign).
  - **Before:** the 2nd burst's first presign went at +49.34 s, after the last complete (asked +44.56) answered at
    +48.49; the line was idle 5.82 s. The 3rd went at +98.71, after the complete answered at +97.76; idle 6.24 s.
    0 of 12 presigns went before a complete answered.
  - **After:** the 2nd burst's first presign went at +56.59 s, while the last complete (asked +55.99) was out until
    +60.59; idle 2.01 s. The 3rd went at +111.96, while the complete (asked +111.33) was out until +116.16; idle 2.05 s.
    7 of 11 presigns went before the previous complete answered.
  - That is about 4 s saved per boundary on this line (a complete's round trip). Completes stayed serial in both.
  - **Dropped connection mid-burst, then Retry all:** six fresh photos at 1 MB/s, CDP offline 1.5 s into the first
    PUT. The stall clock ended it, and the sheet read "6 of 6 didn't upload". Back online at 20 MB/s, then Retry all 6:
    - Before: two bursts. The burst of 1 (presign, then complete at +1.83 s), the line idle 4.27 s, then five more
      presigns and a complete of 5. **Two completes.**
    - After: three presigns (1, 3, 2: the burst's own batching), and **one complete of 6**.
    - An earlier after-run at 4 MB/s was one burst too, but its six files spanned more than 10 s, so the burst's own
      record wait made two completes, of 4 and 2 (Questions, second line).
  - **Every file landed once:** read-only REST over `media` for the album gives 108 rows, all approved. The after guest
    has 57 (45 + 6 + 6) and the before guest 51 (45 + 6). No guest has two rows of one size.
- **Test data left:** the album above, deleted through its Settings > Delete event: it is in Deleted (`deleted_at`
  2026-10-06T12:00:40Z) with its 108 rows and two guests ("RT Burst After", "RT Burst Before"). The Orchestrator may
  purge it for good.
- **Retire both ROADMAP Now lines:** "Guests: the failure sheet's Retry all re-queues its files one at a time…" and
  "Uploads: a burst boundary (past 20 files, 1 GiB…) waits for the last burst's complete…" (ROADMAP lines 81 and 82).
- Assets requested from Will: none
- Board ideas:
  - The heal re-asks a kept complete on the browser's `online` event at once. A Retry all pressed right after the line
    comes back is then a second complete beside the heal's. `healLost` could ride the same `runSoon`, or wait a tick
    for a press.
  - The 45-photo walk's in-flight recorder counted the album's direct tiles dipping (21, then 18, then 21) mid-run on
    both builds: a red-team look.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Calls his to overrule:
  - The overlap stands even where a camera roll or a cap could be reached at the boundary (Questions, first line).
  - Retry all is coalesced inside the queue (a microtask) rather than as a new `retryAll` prop on the sheet.
- Look at first: `use-upload-queue.ts`'s `runQueue` loop and `afterSessionRefusal`; then `uploader.ts`'s
  `afterRecorded` gate in `maybeRecord`.
