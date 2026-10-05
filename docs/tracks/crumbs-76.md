---
track: crumbs-76
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "94d66338"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/guest/guest-upload
  - src/components/guest/upload-step
  - src/lib/guest/use-upload-queue
  - src/components/guest/camera/album-camera
  - src/components/guest/upload-tracker
  - src/lib/guest/upload-tracker
  - src/components/guest/upload/
  - src/components/guest/door/heading
  - src/components/guest/entry-modal
  - docs/systems/guest-flow.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/lib/upload/uploader.ts
---

# lp/crumbs-76

**Goal.** Five guest-upload crumbs from the ROADMAP: the failure heading counts the run's own files, a send that failed whole stops saying "Everything else", the camera hears uploads reopen, the host on her own guest page is told what waits, the failure sheet heads on the door's scale; and a camera album's door stops offering the photo library.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish (the viewfinder's corners survive only as a focus mark, never a style, and so does nothing of their loading state); a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline (undated, morning-only and multi-day events all read well); "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control); cost is designed like the architecture (every image and video action multiplies at scale). Production is the working version: a pick is the best of what was drawn, never a rule.

**★ Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app (Vercel's Hobby CPU is at its limit). Port 3132 is yours; 3000 is Will's desk and red-team 54's, never touched; 3130 is the Orchestrator's gate.

**The fixes**, each pinned by a test that fails on the old code:
1. **"1 of 0 didn't upload."** The failure heading counts a run by index (`runBaseline` in `guest-upload.tsx` and `upload-step.tsx`), so a Retry that fails again, or a slot mounted mid-run, reads "1 of 0 didn't upload". Count the run's own items (`inRun`, `src/lib/guest/use-upload-queue.ts`).
2. **"Everything else" when nothing else exists.** The failure sheet speaks of "Everything else" when a send failed whole ("1 of 1 didn't upload", `uploadFailureElsewhere` in `src/components/guest/upload/failure-sheet.tsx`).
3. **The camera never hears uploads reopen.** It keeps its closed-uploads banner and disabled shutter after the host reopens uploads, until she closes it (`album-camera.tsx`'s `blocked`).
4. **The host on her own guest page sees nothing of hers on a develop album,** in the air or landed (the tracker skips the owner, `upload-tracker.tsx`), while her hub shows every one. Say what waits for her there.
5. **One heading scale for one failure.** The album's upload-failure sheet heads with a Sheet's card title (`upload/failure-sheet.tsx`); the same failure in the door's upload step heads on the door's scale (`door/heading.tsx`). Bring the sheet onto that scale.
6. **A camera album's door offers the photo library.** Its first-photo step still offers Take a photo and Choose from your album (`UploadStep` in `entry-modal.tsx`), so a library photo reaches the roll. Recommended (yours to build, Will's to overrule, under your Questions): open the album's camera there.

Wiring rigor: the whole gate, and the guest walks at 375 touch and 1440 in your own headless Chrome on your port (a fake camera for 3 and 6; the line cut by CDP for 1 and 2).

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Where I am

**Parked for a laptop restart (2026-10-05).** All six fixes are built and pushed, each pinned by tests that fail on the old code
(proved by swapping the old file in); the whole gate was green at `f098b8d08`: typecheck 0, lint 0, test 0 (936 files, 11,617
tests), `zsh scripts/build-lock.sh pnpm build` 0, `pnpm lab:smoke --base http://localhost:3132` 0 (163 checks, 0 failing; scope:
create-wizard, event-header, host-dashboard, identity, the-wait, the Library). Logs and exit codes:
`../partyreel-wt/_scratch/crumbs-76/gate-*.log`, `gate-exits.txt`. Commits on `origin/lp/crumbs-76`: `ce56c474c` (fixes 1, 2, 5),
`f5482d086` (3, 4, 6 and guest-flow.md), `1d603a036` (the camera hears the album's yes at the file going up), `f098b8d08`
(a full album is asked again too). The tree was clean at the park.

**Walked live** in my own headless Chrome on 3132 against disposable events (scripts `s1.mjs` to `s5.mjs` and `lib.mjs`, shots in
`shots/`, in the scratch folder), at 375 touch and 1440: fixes 1, 2 and 5 (S1 the album's sheet, S2 the door's step), 3 (S3),
6 (S3 at an OFF door, S4 at A photo first), and the camera's failure path (S5). Fix 4 (the host on her own guest page) is
component-tested only: it needs her Google session; hand Will the smallest action (open a develop album's guest page as the host,
add one photo, look for the round "Your uploads" button beside Add).

**Measured:** the album's sheet on a whole failure reads "1 of 1 didn't upload" with no "Everything else" line, its Retry with the
line still cut reads "1 of 1" again (the old code read "1 of 0"), and three files with every R2 PUT after the first failed read "2
of 3 didn't upload / Everything else is in Will Gibson's album." The sheet's title and the door step's failure heading are the same
size: 24.017px at 375 and 28px at 1440. The camera over a closed album kept its banner, stopped shutter and caption steady for 30.6 s
across two asks (354 samples at 100 ms, no gap), and was free again 7.4 s (phone) and 16.4 s (desk) after the host's reopen (asks
at 10 s and 30 s). At A photo first on a camera album the step has one Take a photo and 0 file inputs; the door's camera stays
open after the first shot lands and the keep arrives only once she closes it ("Your 2 shots joined Will Gibson's album").

**Fresh-eyes review** (a read-only helper): no HIGH. To do, in order:
1. (MED) The door's camera is not wired to the page's own-removal bookkeeping: add `removedIds` and `onOwnRemoved` to `EntryModal`,
   pass `removedIds` and `handleOwnRemoved` from `event-experience.tsx` (two more one-line exceptions, listed in the lane check),
   hand both to the door's `<AlbumCamera>`; pin that removing her shot inside the door's camera reaches `onOwnRemoved`.
2. (MED/LOW) `EntryModal` ORs the door camera's open state into `onUploadStepActive`, which feeds `useLiveQueue(queue,
   uploadProgress, uploadStepActive)` in the shell, so progress ticks re-render `EventExperience` while the camera is open; and
   `onSend`/`onRetry` (the page's `addFiles`/`retry`) change identity per shell render, so the camera's `memo` does not hold (my test
   passes only because it hands stable functions). Report the camera's open state apart from the step's (a second callback to the
   page, one more line there, which also lets the page hold the keep), keep `uploadStepActive` for the step, give the camera
   ref-backed stable `onSend`/`onRetry`, and make the test hand fresh functions each render.
3. (LOW) Gate `cameraOpen` by `doorHasCamera` (move `doorHasCamera` above its first use): a host switching capture away mid-visit
   would strand the keep and the failure suppression.
4. (LOW, a11y) Pass `titleAs="h2"` in the failure sheet's `DoorHeading announce` (its title was an h2 `SheetTitle`).
5. (LOW) The camera's `visibilitychange` re-ask has no minimum gap: skip it if the last ask was under about 10 s ago.

**Remaining, in order:** the five fixes above with tests; re-run the gate (typecheck, lint, test, build, then the dev server on 3132
and lab:smoke) and re-walk S3 and S4 (`node s3.mjs phone`, `node s4.mjs phone`) if the camera or the door changed; fill the
Questions, System-doc edits, Deferred and Handoff below (drafts are in the transcript; guest-flow.md is already edited in place);
the lane check (`git diff --name-only origin/launch-prep...HEAD` is the owned paths, this file and `event-experience.tsx`'s one
line, three once finding 1 is done); **clean up the disposable test data**; set `status: handed-off`, commit the manifest alone,
push, "handed off at <sha>". launch-prep moved since the cut (crumbs-77 merged, tests only, no overlap with my files), so no
sync is owed unless a conflict appears.

**State:** no dev server (3132 closed), no Chrome of mine open, no migration, no Worker, Vercel or Stripe change.

**Disposable data to remove before the handoff** (mine, in the live Supabase and R2): four events on Will's profile, ids
`dc74eb95-fd0d-41b2-9139-c971a54ad4dd`, `f201f89d-a5f9-408a-9390-0b5493df8cb0`, `ffbb5ed3-5086-4606-9af1-6873d517f1c7`,
`5fc018ea-0894-4fcb-a184-7f1466b13b3b` (named "crumbs-76 ... (disposable)"; their tokens are in
`../partyreel-wt/_scratch/crumbs-76/events.json`), with about twenty guest uploads (the fixtures and the fake camera's shots) in R2
under `events/<id>/`. Delete the event rows (cascades the guests and media), then the R2 prefixes with `src/lib/r2/delete.ts`, then
confirm nothing is left. Their `accepting_uploads` is true.

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
