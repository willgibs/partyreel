---
track: upload-cancel
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "c31c30ed"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/guest/gallery-rows.tsx
  - src/components/app/host-upload.tsx
  - src/lib/guest/use-upload-queue
  - src/lib/upload/
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/components/app/export/export-toast.tsx
---

# lp/upload-cancel

**Goal.** Will's E6 for uploads: an in-flight upload gets a cancel on its tile (the guest's pending tile, the host's batch row) that asks first and then offers Try again, through the uploader's abort signal.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish (the viewfinder's corners survive only as a focus mark, never a style, and so does nothing of their loading state); a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline (undated, morning-only and multi-day events all read well); "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control); cost is designed like the architecture (every image and video action multiplies at scale). Production is the working version: a pick is the best of what was drawn, never a rule.

**Will's E6 answer (2026-10-04):** tell a cancel and a dropped connection apart. A cancel is intentional: it asks to confirm, then offers Try again. A network failure is never hidden. The same for uploads.

Downloads did this (small-fixes, crumbs-65, crumbs-71). Uploads say a dropped connection, and the uploader takes an abort `signal` and answers `cause: "cancelled"` (small-fixes; compute-uploads made uploads land in bursts). But no control passes a signal today: a guest cannot stop one upload of a burst.

**The work:**
- **The guest's pending tile** (`gallery-rows.tsx`'s pending tile) and **the host's batch row** (`host-upload.tsx`) gain an x while a file is in flight.
- **It asks first:** "Stop this upload?", with Keep going first.
- **Then it aborts that file alone through its signal.** Its siblings in the burst carry on and are recorded together as compute-uploads does.
- **A cancelled file reads "Upload cancelled."** with Try again, never an error. It counts nothing (the meter counts at complete).
- **A file already recorded has no x;** its way out is the existing remove.
- **Read the download toast's words** (`export-toast.tsx`) so the two say it alike.
- **Each behaviour is pinned by a test,** with a burst of three, the middle one cancelled.

Wiring rigor: the whole gate. Nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app. Port 3132 is yours. Work economically, with no helper agents; push a WIP commit at each step (this account's weekly usage is near its end).

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
