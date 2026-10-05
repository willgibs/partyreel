---
track: uploads-idempotent
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "21118e59"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/upload/uploader
  - src/lib/upload/server-pipeline.ts
  - src/lib/upload/server-pipeline.test.ts
  - src/lib/upload/server-pipeline-recorded
  - src/lib/upload/burst
  - src/lib/upload/stop-upload
  - src/app/api/r2/complete-upload/
  - src/app/api/r2/presign-upload/
  - src/app/api/host/r2/complete-upload/
  - src/app/api/host/r2/presign-upload/
  - docs/systems/uploads-and-r2.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/lib/upload/server-pipeline-meter.ts
  - src/lib/media/limits.ts
  - docs/systems/database-security.md
---

# lp/uploads-idempotent

**Goal.** Uploads that survive a bad line: a retried complete is idempotent on its media id, so presign and complete can carry client ceilings and end as "Your connection dropped." instead of hanging; the next file is prepared while the current one sends; the create_media args seams go.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish (the viewfinder's corners survive only as a focus mark, never a style, and so does nothing of their loading state); a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline (undated, morning-only and multi-day events all read well); "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control); cost is designed like the architecture (every image and video action multiplies at scale). Production is the working version: a pick is the best of what was drawn, never a rule.

**★ Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app (Vercel's Hobby CPU is at its limit). Port 3132 is yours; 3000 is Will's desk, never touched; 3130 is the Orchestrator's gate. Sign-in works only on the desk build at 3000, so a guest's flow is yours to walk (no sign-in); the host's is pinned by tests.

**Read first:** `docs/systems/uploads-and-r2.md` (the burst protocol of compute-uploads: one presign and as few completes as a landing allows, every per-file check and abuse breaker kept; the meter's line) and the merges of compute-uploads, upload-cancel and crumbs-76 (`git log --merges --format=%B`), which this lane builds on. `server-pipeline-meter.ts` is billing-locks' (a read here).

**The fixes**, each pinned by a test that fails on the old code:
1. **No client ceiling on presign and complete.** A retry re-runs the whole upload, so a timed-out complete that had recorded its row would duplicate it. Make the retry idempotent on `media_id` (`readRecordedUpload` in `server-pipeline-recorded.ts` already answers a replayed complete: prove it under a burst, a partial burst and a host's batch), then give presign and complete client ceilings in `uploader.ts`, so a hung request ends as the uploader's one sentence, "Your connection dropped. Check your signal, then try again.", with its Try again, never a spinner forever. No row is ever recorded twice, no byte counted twice by the meter (assert it through the meter's own read).
2. **Prepare the next file while one sends.** Each file is prepared only when its turn comes (`runUpload`: strip, measure, preview, phone copy; about 523 ms from pick to presign at 4x CPU on a 12 MP photo): prepare the next while the current one uploads, bounded so memory never holds more than one prepared file beyond the one sending, and a cancel or a refusal discards it.
3. **Typed seams:** the args objects beside `rpc("create_media*")` in the upload routes are typed seams the generated types no longer need: drop them.

Measure 2 (the gap from one file's end to the next's start, before and after) in your own headless Chrome on your port with CPU throttling. Wiring rigor: the whole gate, and a guest's burst walked at 375 and 1440 on your port with the line cut mid-complete (CDP) to prove 1.

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
