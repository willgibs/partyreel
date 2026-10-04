---
track: crumbs-68
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "0fdb73cb"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/guest/use-upload-queue
  - src/components/guest/upload-step
  - src/components/guest/gallery-live.tsx
  - src/components/guest/camera/
reads:                  # single-sources you depend on: never duplicate, never edit
  - CLAUDE.md
---

# lp/crumbs-68

**Goal.** Three upload crumbs: the door's upload bar fills as the bytes go, a guest's album asks once per landed burst, and the failure sheet tells a dropped connection from a refusal.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish (the viewfinder's corners survive only as a focus mark, never a style, and so does nothing of their loading state); a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline (undated, morning-only and multi-day events all read well); "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control); cost is designed like the architecture (every image and video action multiplies at scale). Production is the working version: a pick is the best of what was drawn, never a rule.

**★ Local only:** nothing of yours requests the alias, partyreel.com or any *.vercel.app (Hobby's Active CPU). Port 3000 is Will's desk; 3132 is another lane's.

**The fixes**, each pinned by a test that fails on the old code:
1. **The door's upload bar** (`upload-step.tsx`) reads a queue item's progress (0 to 100) as a fraction (`Math.max(it.progress, ...) * 100`), so a bar is full from its first percent. It must fill as the bytes go. Check every other reader of `QueueItem.progress` for the same scale.
2. **Her album asks once per landed burst.** `gallery-live.tsx`'s `notifyUploaded` asks the album's store once per landed file, so a recorded burst costs two syncs (a delta, then a 304). Since compute-uploads (merged), a burst's files are recorded together: ask once per burst. Keep her own tiles optimistic, as now.
3. **The failure sheet tells a dropped connection from a refusal.** Carry `UploadOutcome.cause` (`"dropped"`, `"cancelled"` and the refusals, from `src/lib/upload/uploader.ts`) into the queue's `QueueItem` (`use-upload-queue.ts`). The failure sheet and the camera then read the cause instead of matching the message (`UPLOAD_WORDS.dropped`, crumbs-65's stopgap).

Wiring rigor (these ship): the whole gate. Measure fix 2 with `pnpm compute:model --port 3131` (guest-join-upload's calls) and lower its budget line if it falls (`scripts/compute-model/budget.json`, an exception in your Handoff).

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- **How the failure list draws a dropped connection apart from a refusal.** Recommended and built: a small signal mark (`WifiOff`) before a dropped row's sentence, in the one list the album's sheet and the door's failure view share (`UploadFailureList`); its words, its Retry and its heading stay as they were (the words already told them apart; nothing else did). Not built: saying the drop once above the list when every row is one (the same three lines repeat per row at 375), and retrying by itself when `online` fires, as the camera does (Deferred).
- **Where the burst's one ask lives.** Recommended and built: in `gallery-live.tsx`'s `notifyUploaded`, by tick (the files a complete records together settle in one run), so the queue's per-file `onUploaded` and `event-experience.tsx`'s wiring stay as they are. Not built: a burst-level callback from the queue.

## System-doc edits (in place, owned facts only)

- `docs/systems/uploads-and-r2.md`: the E6 bullet: the cause rides the queue (`QueueItem.cause`), and the camera and the failure sheet read it where the camera matched `UPLOAD_WORDS.dropped`.
- `docs/systems/guest-flow.md`: the failure sheet's bullet (a dropped row's signal mark), the flip's line (every landing's `notifyUploaded`), and the live source's links paragraph (a burst asks the album once).

## Deferred (ROADMAP one-liners, bucket named)

- Guests: the failure list and the door's failure view retry a dropped connection by themselves when `online` fires, as the camera does (`album-camera.tsx`'s `online` listener); the signal mark already tells which rows are the line's.
- Guests: a join that never reached the network (`join.ts`'s `OFFLINE`, "Check your connection and try again.") fails the queued files in `failWaiting` with its own words and no `cause`, so the sheet draws it as a refusal and the line has a second wording for a drop; give `JoinRefusal` a transport flag and carry it into `cause`.
- Host: the host's upload rows (`host-upload.tsx`) keep only the outcome's message; carry `cause` there so a dropped connection wears the same signal mark.
- Guests: her own device answers the doorbell's ping for her own landing with a 304 at its next batch tick (the `guest-join-upload` ledger: her last sync is a 304 right after her own delta's); the ping carries no id, so skipping that call needs the ping to say what it covers (`refresh-coalescer.ts`).

## Handoff (replaces the chat report)

- **Work head `ead51dee3`, pushed (`origin/lp/crumbs-68`). No sync:** launch-prep moved after the cut (crumbs-67's merge of two test files, records, compute-presign's cut) with nothing under this lane's paths, and `git merge-tree origin/launch-prep HEAD` is clean. The chat line's sha is this manifest's own commit on top of it (docs alone).
- **Gates on `ead51dee3`, each on its own exit code** (`_scratch/crumbs-68/gate.log` and the logs beside it): `pnpm typecheck` 0, `pnpm lint` 0, `pnpm test` 0 (912 files, 11,233 tests), `zsh scripts/build-lock.sh pnpm build` 0 (with `NEXT_PUBLIC_SITE_URL=http://localhost:3131`, so the compute model reuses it). `pnpm lab:smoke --base http://localhost:3131` 0, 143 checks, 0 failing (`smoke.log`; it ran on `75ce1f048`, and the later commits changed a comment, a doc and `budget.json`); its PREMISE line says drive-export's nine open asks describe `uploads-and-r2.md`, which this lane touched in the E6 bullet alone (the cause rides the queue; nothing of downloads moved). No `lab:demo` (no board).
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): the owned paths (`use-upload-queue.ts` and its test, `upload-step.tsx` and its test, `gallery-live.tsx`, `camera/album-camera.tsx` and its test) and this file, plus the exceptions below, none claimed by a live lane (the live manifests own sandbox boards and crumbs-67's two tests):
  - `src/components/guest/gallery-live.test.tsx`: the owned file's own test (the prefix `gallery-live.tsx` does not reach `gallery-live.test.tsx`).
  - `src/components/guest/upload/failure-sheet.tsx` and its test: the goal names the failure sheet; it takes `UploadFailure.cause` and draws the mark (about 12 lines).
  - `src/components/guest/guest-upload.tsx` and `guest-upload.test.tsx`: one line passing `cause` to the album's sheet, and the test that pins it (it fails without it).
  - `src/lib/guest/camera/shots.ts` and `shots.test.ts`: `ShotState.cause` (two lines), so the camera reads the cause beside `error` and `code`.
  - `scripts/compute-model/budget.json`: guest-join-upload's line, as the brief says.
  - `docs/systems/guest-flow.md` and `docs/systems/uploads-and-r2.md`: the System-doc edits above.
- **The door's bar fills as the bytes go.** `uploadBarPercent` in `upload-step.tsx` reads the queue's 0 to 100 as a percent (a 4% sliver while it waits, whole when done, capped at 100). Every other reader already read a percent: the album's stack tile (`upload/stack-tile.tsx`, `width: ${progress}%`), the held door's picks (`door/wait-picks.tsx`, `--sent: ${pick.progress}%`), `runProgressOf` (`/ 100`), `useLiveQueue`; the host's rows own their item type (`host-upload.tsx`, `Progress value`). `QueueItem.progress` now says it is a percent in its own doc. Pinned by `upload-step.test.tsx` (two tests fail on the old code: widths `4000%` and `10000%` against `4%`, `40%`, `100%`). Live, local: `_scratch/crumbs-68/door-bar.mjs` on a production build at 3131 with the uplink held to 80 KB/s: three bars fill one after another from 4% to 100%, 26 intermediate widths seen (`door-bar/3-sending-7707ms.png`).
- **Her album asks once per landed burst.** `gallery-live.tsx`'s `notifyUploaded` keeps each file's optimistic tile and owed link and asks the store once, a microtask after the last landing of a tick (`landings`); the links asked for meanwhile go in one `ensure` once the answer is in. Pinned by two tests in `gallery-live.test.tsx` (both fail on the old code: 2 syncs where 1 is asked). Measured, `pnpm compute:model --port 3131 --no-build --scenarios guest-join-upload` (`_scratch/crumbs-68/compute/results.json`, `requests.jsonl`, `compute.log`): 16 calls, 1,185 ms (join 5, upload 9, listener 2), against 17 and 18 calls on the burst tree; her album's syncs 3 where the burst tree's ledger had 4 (the one left after her own delta is the doorbell's batch tick, a 304: Deferred). Budget line 20 to 18 calls (`84cb7a6a5`, the file's own rule on 16 measured); the CPU line stays 2,620 ms, because 1,185 ms is inside the band the earlier runs gave (1,110 and 1,310 ms).
- **The cause rides the queue.** `QueueItem.cause` (`use-upload-queue.ts`: set from the outcome where a file fails, cleared by `retry`); the camera reads `ShotState.cause` in `album-camera.tsx`'s `droppedUnsent` and no longer matches `UPLOAD_WORDS.dropped`; the failure list (`UploadFailure.cause`) draws a dropped row with the signal mark and `data-cause="dropped"`, for the album's sheet and for the door's failure view. Pinned by `use-upload-queue.test.tsx` (the cause for a drop and a cancel, none for a refusal, cleared by a Retry), `shots.test.ts`, `album-camera.test.tsx` (the words differ from the uploader's, the cause alone says drop), `failure-sheet.test.tsx` (a refusal carrying a drop's very words gets no mark) and `guest-upload.test.tsx` (the album's sheet): each fails on the old code. Live, local: `_scratch/crumbs-68/door-drop.mjs` cuts the line mid-upload at the door: the failed view shows three rows, three marks and "Retry all 3" (`door-bar/drop-1-failed-view.png`); with the line back, Retry all finishes the step with no failed row left.
- Not run: the alias or any live pass (this lane may not request it); the album's own failure sheet in a real browser (the door's failure view draws the same `UploadFailureList`, and `guest-upload.test.tsx` holds the sheet's pass-through).
- Assets requested from Will: none.
- Board ideas: an all-dropped list says the same sentence on every row (three lines each at 375; `door-bar/drop-1-failed-view.png`): say it once above the list and let the rows be the files, or retry by itself when the line returns.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Calls his to overrule: the signal mark as how the list draws a drop (nothing else changed); the one ask in `notifyUploaded` by tick, not a burst callback from the queue; guest-join-upload's CPU line left at 2,620 ms.
- ROADMAP entries this retires (the Orchestrator's records): the four "Guests:" lines on `notifyUploaded`'s per-file ask, the door's bar scale, the camera's `UPLOAD_WORDS.dropped` and carrying `UploadOutcome.cause` into the queue.
- Look at first: `door-bar/3-sending-7707ms.png` (the door's bars mid-send) and `door-bar/drop-1-failed-view.png` (the mark), then `gallery-live.tsx`'s `notifyUploaded`.
