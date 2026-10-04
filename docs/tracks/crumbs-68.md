---
track: crumbs-68
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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
