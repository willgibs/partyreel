---
track: crumbs-90
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "57cd8566"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/upload/
  - src/lib/guest/upload-refusal
  - src/lib/guest/use-upload-queue
  - src/lib/guest/name-door
  - src/components/guest/upload/
  - src/components/guest/guest-name-step
  - src/components/guest/entry-modal
  - src/components/shared/album-tile
  - src/components/app/media-grid
  - src/app/(guest)/e/[token]/page.tsx
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/ROADMAP.md
  - docs/systems/uploads-and-r2.md
  - docs/systems/guest-flow.md
---

# lp/crumbs-90

**Goal.** The guest's send and album made right where Immediate's lines say they are not: what a dropped line does to a complete, the heal beside a Retry, a HEIC with no preview, the failure sheet's words beside the toast and a roll's refusal, an album tile's focus, a photo link's image size, and two dead arms removed.

## The brief

**The round's direction (Will, standing; PRD.md's "Will's product principles" hold each with its reason):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; delight where it costs nothing in clarity, and attention earned (the one thing that needs her may draw the eye, beautiful and inviting, while nothing yells or crowds a screen); nothing depends on a timeline; immediate, or a clear state and a way out (a failure says what happened, that nothing was lost, and the one easy way to put it right); Partyreel runs with no AI managing it (every operator fix ships its `/admin` control, zero silent failures); cost is designed like the architecture. Production is the working version: a pick is the best of what was drawn, never a rule.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app (Vercel's Hobby CPU sits at 97% of its 30-day window), and nothing deploys. Port 3132 is yours; 3000 is Will's desk, 3130 the Orchestrator's gate. A signed-in walk runs on your own port in a headless Chrome of your own: `usher/kit/redteam/` (its `signin.mjs` mints a test host's session on a localhost base, willg97@gmail.com or hi@willgibs.com, never the operator; `docs/systems/testing-verification.md`), never Will's browser pane or his Chrome. Test data is disposable and named so ("<track> (disposable)"), deleted or listed for deletion in the Handoff.

**The items, in order (each an Immediate line in `docs/ROADMAP.md`, quoted by its opening words; the Orchestrator retires each at your record):**
1. **"Album: the failure sheet offers Retry on a roll refusal"** (no-signal r1): a refused shot classed as the file's own, no Retry, as the camera already says it.
2. **"Album: the send's toast"** fires beside the failure sheet at one run's end: a "joined" over "2 of 3 didn't upload"; one voice at a run's end (the sheet saying what joined, or the toast quiet while the sheet stands), your call with its reason.
3. **"Uploads: a complete sent the instant a dropped line came back hung about 2 minutes"** (red-team 56b): find the wait and end it.
4. **"Uploads: the heal re-asks a kept complete on the browser's `online` event at once"**: a Retry all pressed as the line comes back must not be a second complete beside the heal's.
5. **"Uploads: a HEIC from a browser that cannot decode it"**: a tile is never blank; the server-side preview if it is proportionate, else a named stand-in in `MediaTile`, said under Questions.
6. **"Guests: in a 45-photo send the in-flight recorder counted the album's direct tiles dipping"** (unsure): reproduce it on a local build with the kit's recorder (`usher/kit/redteam/`), fix it if real, or retire the line with what you measured.
7. **"Album: an album tile shows no keyboard focus"**: the halo on an overlay that holds the keyboard's focus, as the line says.
8. **"Share: a photo link's `og:image:width` and `og:image:height`"** declare what the card serves.
9. **"Guests: drop the one-file presign and complete bodies"** and **"Guest door: the name door's `account` mode has no caller"**: both removed with their tests' reasons.

**Walk your own items antagonistically,** on a local build at 375 and 1440: a send cut mid-run (the network throttled, then offline, then back), a Retry all pressed as the line returns, a Disposable roll spent, a HEIC from desktop Chrome, Tab through an album; the abuse path of anything that reaches the pipeline (a complete for another guest's upload, a refused shot retried by hand). Test data disposable and named "crumbs-90 (disposable)".

**Nearby lanes (never edit their paths):** crumbs-88 (handed off, merging after milestone 39: the reel's controls, the guest door's confirm beat and adopted name, Create, the hub, the dashboard's stage), crumbs-89 (running: Settings' door, its state and the email gate), the board after-party r1 (its sandbox folder). Your merge follows milestone 39 and crumbs-88, so sync with `launch-prep` before your handoff if it moved.

**Wiring rigor:** the whole gate (CLAUDE.md), each step on its own exit code, through `scripts/build-lock.sh`. Verify what your change adds antagonistically (its error cases, malformed input, and the cross-tenant and abuse paths of anything that reaches data), walking your own new paths once at 375 and 1440 and reading the page's text and state before a screenshot; the wide walk across surfaces, themes and assistive settings is the milestone red-team's. WHY-comments where a choice is not obvious; a test reshaped on purpose keeps its real scar and says which reason expired. A Handoff states what the Orchestrator needs to integrate and record, never an essay.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- **1 · A spent roll's refusal is its own class, not the file's** (`upload-refusal.ts`'s `roll`). No Retry, Done, and
  none of the line's "Take another to add one.", which under "You've taken all 24 shots on your roll." sends her to a
  shutter that refuses the next shot alike (the camera already says the roll's end). Recommended: as built. Overrule:
  the ROADMAP's literal answer (the file's own class, with "Take another to add one.").
- **2 · One voice at a run's end: the sheet.** The toast is quiet when its run ends with a file of its own refused, or
  under a failure sheet still standing (a row's Retry, a heal of one of its rows: `failureSheetStands`); the sheet
  already says what joined ("Everything else is in Maya's album."). Recommended: as built (an error belongs on the
  surface that waits). Overrule: the toast speaks and the sheet drops its line.
- **3 · The two-minute complete was not reproduced.** Four local walks cut the line mid-run (CDP throttle, offline at
  a complete for 8 s and for 70 s, and with Retry all pressed 150 ms after the return): every complete sent after the
  return answered in 1.5 to 5.1 s, and the heal asked within 2 ms of `online` (logs: `_scratch/crumbs-90/exp/drop1` to
  `drop4.log`). Two CDP artifacts read as a hang: an aborted request stays pending in the CDP log, and CDP's offline
  lets a request already in the air finish. The one wait found by reading is ended: every return to the page restarted
  a request's clock whole (one look near a complete's end made it two minutes); now it stands a 10 s grace where less
  is left (`RETURN_GRACE_MS`). Recommended: retire the ROADMAP line; walk a real phone's line if it is seen again.
- **4 · The heal's race is closed by a status gate, not by `runSoon`.** `retry` re-queues only a file still failed, so a
  press on the sheet's latched words, or a camera's handler from the render before, never re-sends a file the heal took
  (in the air its bar fell to nothing; landed, it went up again as a second row). Riding `runSoon` would merge no
  complete: a kept complete is asked at once whatever burst it rides, and each `online` listener runs its own
  microtasks. Recommended: as built.
- **5 · A HEIC with no preview: the named stand-in, not a server-side preview.** No decoder on the stack is proportionate
  (sharp's prebuilt libvips reads no HEIC; a WASM decode in a function spends Hobby CPU at 97%; Cloudflare's transforms
  are a service). `MediaTile` says "Can't show here" and the format from the key (HEIC), the mark alone in a 44 px
  thumbnail; its link card keeps the event's own. Recommended: as built, and decode in the uploading browser later
  (Deferred). Overrule the words: Will's.
- **6 · The 45-photo tile dip is the window, not a blink: retire the line.** A 46-photo and a 20-photo send at 375 on
  this build: the mounted count moved 26, 23, 25, 22, 25, 21, 18 as the reported 21, 18, 21 did, because the album
  mounts only the rows one viewport behind and two ahead and an arrival at the head re-breaks them; a per-frame blink
  detector found no photograph in view leave the page (0 blinks, scroll held at 92; `rt/burst45.out`, `exp/blink.js`).
- **7 · The hour's breaker refuses a burst whole** (`server-pipeline.ts`): with the one-file body gone, its 429 and
  `Retry-After` would have gone too, since a burst's file refusal rides a 200. The breaker counts the host's uploads
  across her albums, so every file meets the hour its first did: it is now `scope: "burst"`, and no later file is
  metered. Recommended: as built. Overrule: per file, with no `Retry-After` and every file metered.

## System-doc edits (in place, owned facts only)

- `uploads-and-r2.md`: the burst as the only body and the hour's breaker as who is sending; the return grace on every
  clock; a Retry only for a file still failed; a HEIC's tile stand-in.
- `guest-flow.md`: the spent roll on the failure sheet; the toast silent under the sheet; the photo card's size and its
  HEIC rule; `openToName()`.
- `design-system.md`: an inset halo is painted under a control's own picture (`TileHalo`); the tile's one handler of
  its own.

## Deferred (ROADMAP one-liners, each naming its bucket and area)

- Upcoming · Uploads, media and exports: a HEIC the uploading browser cannot decode gets no preview, phone copy or
  measures; decode it there with a WASM decoder fetched only then ($0, in-house; libheif and libde265 are LGPL, a call
  for Will) (crumbs-90).
- Upcoming · The guest's album: the viewer draws nothing for a photograph its browser cannot decode (a HEIC with no
  preview in Chrome); say it as the tile's stand-in does, beside Save (crumbs-90).
- Upcoming · The guest's album: at a roll of 1 the refusal says "You've taken all 1 shots on your roll." (`roll.ts`'s
  `rollSpentMessage` and `create_media`'s mirror, a migration) (crumbs-90's roll walk).
- Upcoming · Design system and accessibility: `halo-inset`'s forced-colours outline stands 2px outside its control,
  where a clipping box hides it; draw it inside, as the album tile's halo now does (crumbs-90).

## Handoff (replaces the chat report)

- **Commits, pushed:** work `b8415a49f` (items 1, 2, 4, 5, 7, 8, 9) and `a1088de40` (item 3's grace, the system
  docs); sync `6e8aee8ee` (launch-prep `86fd09017`); launch-prep moved since by records alone (`3ec66b8fe`).
- **Gates on `6e8aee8ee`, each its own exit code:** `pnpm typecheck` 0; `pnpm lint` 0 (0 warnings); `pnpm test` 0
  (1083 files, 13719 tests); `zsh scripts/build-lock.sh pnpm build` 0; `pnpm lab:smoke --base http://localhost:3132` 0
  (206 checks, 0 failing); `pnpm lab:demo --board no-signal --base http://localhost:3132` 0 (its roll's today frame
  now draws production's corrected sheet; its comments still name the old Retry).
- **Lane check:** owned paths and this file, with these exceptions: `docs/systems/{uploads-and-r2,guest-flow,
  design-system}.md` (the facts above); `src/app/(guest)/e/[token]/card/card.test.tsx` (the photo card's own tests);
  the five route tests `src/app/api/{r2,host/r2}/{presign,complete}-upload/route.test.ts` and `src/app/api/r2/
  phone-copy.test.ts` (their one-file request builders, which item 9 removes, now send a burst of one through
  `upload/testing/burst-of-one.ts`; one reshaped with its reason: a record that throws answers `complete_failed`);
  `src/components/guest/event-experience.tsx` and `guest-name-menu.tsx` (one line each: the channel is modeless).
- **Items:**
  1. A shot the spent roll refused lists with no Retry and closes on Done (walked at 375: a roll of 1, two shots
     offline, "1 of 2 didn't upload" over "You've taken all 1 shots on your roll.", `rt/roll-sheet.png`).
  2. The toast is quiet over a run's own refusal and a standing sheet (walked: a photo and a `.txt` gave the sheet
     alone; a clean photo still toasts "Your photo joined Will Gibson's album.").
  3. Not reproduced; the return grace ends the one wait found (Questions 3; `uploader.replay` and `.transport` tests).
  4. `retry`'s status gate (`use-upload-queue.test.tsx`: in the air and landed, one upload; walked: Retry all at the
     return, no row twice by size across 84 rows).
  5. `MediaTile`'s stand-in (walked: a HEIC sent from 1440 Chrome reads "Can't show here / HEIC" at 1440 and 375,
     `rt/heic-desk.png`, `rt/heic-phone.png`).
  6. Retired with the measurement (Questions 6).
  7. `TileHalo` over the photograph (walked: Tab to the tiles at 1440 and 375, one halo pinned at a time,
     `rt/halo-desk.png`, `rt/halo-phone.png`).
  8. The card declares the size served (curl'd: 640x480 and 480x640 previews, measured by `sips`; 4032x3024 for an
     original with no preview; the HEIC link keeps the event card).
  9. The one-file bodies are malformed (curl'd: 400 `bad_request`); a refused shot presigned by hand is `roll_spent`
     again; a complete for another guest's recorded upload answers `recorded` and a foreign key `bad_key`, as before.
     The name door's `account` mode is gone with its last caller (`requestNameDoor()`, `openToName()`).
- **Assets requested from Will:** none.
- **Board ideas:** none beyond Deferred.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none.
- **Test data:** "crumbs-90 walk (disposable)" (`4030b461-9671-4ed7-87ac-081ae1605954`, 85 media, 3 guests) and
  "crumbs-90 roll walk (disposable)" (`6b1b44fd-f482-40a1-9e0c-8540f925163b`, 1 media, 1 guest), willg97's, both in
  Deleted since 15:18Z; the Orchestrator may purge them.
- **Calls his to overrule:** Questions 1, 2, 5's words, 7; and the card keeping the event's own for HEIC, HEIF or AVIF.
- **Look at first:** `use-upload-queue.ts`'s `retry` gate; `uploader.ts`'s `RETURN_GRACE_MS`; `server-pipeline.ts`'s
  hourly scope; `album-tile.tsx`'s `TileHalo`.
