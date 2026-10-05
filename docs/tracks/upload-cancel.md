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

Each is built as its recommended answer and is Will's to overrule.

- **Where does the guest's question live?** On the product's toast, drawn through `exportToasts` (the downloads' and the take-home Save's port): "Stop this upload?" with Keep going first, then "Upload cancelled." with Try again for 8 s (`DONE_MS.cancelled`). Recommended: the toast, because the stack tile is about 110 to 180 px wide at a phone and has no room to ask on; the other way is a scrim with two buttons on the tile.
- **And the host's?** In the row, with the same words (`STOP_COPY`), because a row has the room and the question stays beside its file; the cancelled row is neutral (a Ban mark, muted words, "Try again", never the failure's red or its Retry). Recommended: in the row; the other way is one toast for both surfaces.
- **When does the x go?** Once a file's bytes are up (the guest's `queued` at 100, the host's `onSent`): it then waits up to 10 s to be recorded with its siblings, and its complete may start any moment, which no stop can take back. Recommended: gone from then, so a press never says "stopped" over a file that lands; the other way keeps the x through the 10 s wait and says nothing when the stop comes too late (the file lands).
- **What becomes of a stopped guest file?** It leaves the queue entirely: no failure sheet row, no count in the shutter's ring or her uploads, and Try again lives in the 8 s toast (the toast holds the file). Recommended: as built (an intentional stop is not a failure); the other way keeps a "cancelled" item in her uploads with a Try again that outlasts the toast.
- **Which file does the stack's x stop?** The file in the air (the stack's face), one at a time; a file waiting its turn comes to the face when the one before it lands or is stopped. Recommended: as built; the other way is a per-file list on the stack.
- **A stop too late to take says nothing.** The complete is never aborted (a row may exist), so a stop pressed in that instant is ignored, the question goes and the file lands.

## System-doc edits (in place, owned facts only)

- `docs/systems/uploads-and-r2.md`: the E6 bullet (a cancel is one file's or the burst's, `complete` never aborted, nothing counted, `QueueItem.cause` no longer carries `cancelled`) and the downloads' E6 bullet (uploads say it alike).
- `docs/systems/guest-flow.md`: the upload act gains "The stack's x"; the failure sheet bullet says a stopped file is never listed.
- `docs/systems/host-app.md`: the Host upload line says the row's x, its question and its cancelled state.

## Deferred (ROADMAP one-liners, bucket named)

- Guest: the door's upload step (her picks' bars at the door) and the camera's shots have no stop; E6's cancel for uploads covers the album's stack and the host's row.
- Uploads: stopping a multipart upload leaves its uploaded parts to the bucket's lifecycle abort rule (billed until then); a presigned AbortMultipartUpload from the stop would free them at once.

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
