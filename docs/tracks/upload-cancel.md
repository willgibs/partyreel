---
track: upload-cancel
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
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

- **Commits, all pushed to `origin/lp/upload-cancel`:** `7ca8d43fe` (the uploader stops one file alone), `1d999fec6` (the guest queue's `stop` and `lib/upload/stop-upload.ts`), `6f979b6c1` (the stack's x), `b6a06659a` (the host's row), `6afef61d5` (the three system docs and this manifest's Questions, doc edits and Deferred), then this manifest alone. **No sync:** launch-prep moved after my base `2bf3c3407` (the uploads-meter-ui merge `c00b1f5b0`, the crumbs-72 cut and pickup) with nothing in my owns or my one read (`export-toast.tsx`); crumbs-72's claims (`presign-upload/` host route, `upload-step.tsx`, `media-lightbox.tsx`, ...) overlap none of mine.
- **Gates, each on its own exit code, on `6afef61d5` (this manifest is the only later change):** `pnpm typecheck` 0; `pnpm lint` 0 (no warnings); `pnpm test` 0 (925 files, 11,407 tests); `zsh scripts/build-lock.sh pnpm build` 0; `pnpm lab:smoke --base http://localhost:3132` 0 (145 checks, 0 failing). Dev server on 3132 only, killed by port after each use.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): every path is under an `owns` prefix, this manifest, or a `docs/systems/` file listed above, except three, each with its why: `src/components/guest/upload/stack-tile.tsx` (+ its test) is the guest's pending tile's body, which the brief called "gallery-rows.tsx's pending tile": the album's grid cell sizes only its direct child (`[&>*]:h-full !mb-0`), so an x cannot be drawn on the tile from `gallery-rows.tsx` without a wrapper that breaks the head slot, and the change is one prop (`onStop`) and one button; `src/components/guest/gallery-rows.test.tsx` and `src/components/app/host-upload.test.tsx` are the tests of two owned components (the owns name the `.tsx` exactly). No pass-through edit in `event-experience.tsx`, `gallery-live.tsx` or `live-gallery.tsx`: the stop rides the progress store the stack already reads (`QueueProgress.stop`).
- **The items:**
  - The uploader stops one file alone: `BurstFile.signal` settles that file `cause: "cancelled"` at once wherever it stands short of its complete, its siblings go on and are recorded together without it, a complete already asked is never aborted (`uploader.ts`; pinned by `uploader.burst.test.ts` "one file's own cancel: a burst of three, the middle one", 9 cases, 6 of which fail on the old uploader).
  - The guest queue's `stop(id)` (`use-upload-queue.ts`; `use-upload-queue.stop.test.tsx`, 9 cases): only that file's signal aborts, the file leaves the queue (no `error` item, nothing for the failure sheet, the ring or `onUploaded`), Try again puts the same file back, a file still waiting for a burst leaves at once, a stop too late resolves null, the demo rehearses it. The old pin of a cancel as an `error` item is reshaped, its scar (the cause rides the queue for a drop, none for a refusal) kept (`use-upload-queue.test.tsx`).
  - The words and the question, once (`lib/upload/stop-upload.ts`, `stop-upload.test.ts` 11 cases): "Stop this upload?" with Keep going first, "Stop upload", "Upload cancelled." with Try again for `DONE_MS.cancelled`, the downloads' own `WALK_COPY` words where they are the same, drawn on `exportToasts`.
  - The guest's x (`stack-tile.tsx`, `gallery-rows.tsx`; `gallery-rows.test.tsx` "the stack's x" 6 cases, `stack-tile.test.tsx` 3): round glass on the stack's corner, drawn only while the lead file can still be stopped, stops the lead file's id alone, a question about a file that left the stack is withdrawn.
  - The host's row (`host-upload.tsx`; `host-upload.test.tsx` "stopping a row" 6 cases): the x asks in the row (Keep going first), stops that file alone, the row reads "Upload cancelled." with Try again (a Ban mark, muted, never red, never Retry), a waiting row cancels where it stands, a row whose bytes are up has no x, the page is told once for the batch.
  - Seen in a browser on my 3132 dev server, local only: the guest stack's x, the toast question, Upload cancelled. with Try again, the stack moving on to the next file, the album count unchanged by the stopped file and Try again putting it back and landing it (the local demo event with its simulated ramp slowed in the page; also at 375 px); the host's rows on a throwaway scratch page with the network stubbed (the scratch page was deleted and never committed). **Not run:** the live red-team on the alias, which this spawn forbade (Hobby's Active CPU); a real R2 PUT aborted at the network (the engine's half is under a fake XHR in `uploader.burst.test.ts`).
- **An unintended request to disclose:** I opened `http://localhost:3132/demo` to reach the demo event, and that route redirects to `DEMO_EVENT_URL`, which is built on `SITE_URL` (`src/lib/demo.ts`), so the Browser pane loaded one page of `https://partyreel.com/e/<demo token>` before I navigated away at once; nothing was clicked, uploaded or sent there. Every later request went to localhost (the pane's network list for `partyreel.com` and `vercel` was empty after).
- Assets requested from Will: none
- Board ideas: a local `/demo` that redirects to the production site is a trap for any lane under the Active-CPU rule (and for Will's own local checks); a dev-only relative redirect, or a line in `testing-verification.md`, would close it (local demo: go straight to `/e/<NEXT_PUBLIC_DEMO_QR_TOKEN>`). The door's upload step and the camera's shots could take the same x (Deferred above).
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Calls his to overrule (the Questions above, each built as its recommended answer): the guest asks and says it on the toast, the host in the row; the x goes once a file's bytes are up; a stopped guest file leaves the queue and its Try again lives in the 8 s toast; the stack's x stops the file in the air; a stop too late says nothing.
- Look at first: on a local dev server, `/e/<NEXT_PUBLIC_DEMO_QR_TOKEN>` (not `/demo`): the first Add goes through the door's "Sending your photos" sheet, so Add a second pick of three or more photos, then press the x on the stack at the album's head (the demo's ramp is half a second a file: slow its 120 ms steps in the page to have time); and the host hub's Add photos panel with four files (the real R2 PUT needs the alias, so the host's row is best looked at on a scratch page with stubbed network or in the tests).
