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
