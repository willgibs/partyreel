---
track: disposable-camera
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "d57d4486"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/guest/camera/
  - src/lib/guest/camera/
  - src/components/guest/guest-action-dock
  - src/components/guest/upload/intent-sheet
  - src/lib/guest/use-upload-queue
  - src/app/(dev)/design/sandbox/disposable-mode/
  - content/help/the-disposable-camera.mdx
  - src/components/guest/guest-upload
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/disposable-mode.md
  - docs/reviews/disposable-mode.json
  - docs/systems/uploads-and-r2.md
  - docs/systems/guest-flow.md
  - src/lib/disposable/
  - src/lib/media/limits.ts
---

# lp/disposable-camera

**Goal.** Wire the disposable camera Will picked (the reel as a timeline, hold to film, a video one shot, the roll's end) as the album's own in-page camera at full size, on the foundation's server roll; Add opens it on a camera album; retire the disposable-mode board.

## The brief

**Why.** Will answered `disposable-mode` r3 on 2026-10-02 (`docs/reviews/disposable-mode.json`): `camera=timeline`, `video=hold`, `cost=one`, `waiting=sheet`, `look=none`. On the camera, verbatim: "I think this is the winning direction. I like having the camera preview contained, as that's the native and expected experience on iPhones, so it's more natural for guests to frame shots. The more modern reel also feels more bespoke to the product, while staying pretty subtle and not overwhelming the screen. Makes you want to keep capturing. I loved the count tickers around the shutter button in option 1, but this is far more clear for the average user, and actually feels like Partyreel. Think we could still polish slightly, especially around the timeline design within the reel here." The drawings are `src/app/(dev)/design/sandbox/disposable-mode/` (`cam-timeline.tsx`, `cam-shared.tsx`, `camera.tsx`): yours to port, then retire the board by deleting its folder (its waiting room's drawings go to the `the-wait` board, which reads them: delete the folder only as your last commit, after `the-wait` is cut, or keep `waiting.tsx` if the Orchestrator says it is still read).

**The server is built** (`disposable-foundation`, merged; `docs/systems/disposable-mode.md`): `events.capture = 'camera'` with `roll_size`; the roll counts her LIVE shots since `sealed_from` (a withdrawn shot frees its frame, Will's overrule), refused early at presign (`get_upload_context`'s `roll: {used, cap, taken, ceiling}`; the 25th's sentence) and enforced in `create_media`; a ceiling of three rolls a period; a camera video up to 10 s and 128 MB; her own shots in her tracker, removable.

**His phone line** (2026-10-02, iOS 26, Chrome 154 on WebKit): the stream 4032x3024 at 30 fps; a frame drawn whole 3024x4032 (12.2 MP, 2.6 MB at JPEG 0.92); `takePhoto` 12.2 MP, 7.6 MB; the camera app 12.2 MP, 2.9 MB. Full size holds on iPhone: shoot at the stream's full frame (Android's `takePhoto` where it is better).

**What to build.** On an album whose `capture` is `camera`, Add (the shutter) opens the album's own camera full screen: the live picture contained as drawn, the reel as a timeline (24 rounded frames under the picture, the live one holding the picture, gliding on a frame a shot; polish its design within the reel, his note), the count from the server's roll, hold the shutter to film (up to 10 s, the microphone asked only then; Free or Videos off means photos only), a video one shot, the roll's end (says the roll is done and when it comes back, her shots one tap away), each shot uploading through the queue as she keeps shooting, a refusal in the server's words. Her shots stay hers in her tracker (sealed until develop), removable, a removal freeing its frame live. Reduced motion honoured; the camera released whenever the page hides. On a free-upload album nothing changes. The waiting room, the arrival and the host's cover are `the-wait` board's, not yours.

**Boundaries.** Both Adds (the cover's white Add and the shutter) should reach the camera through the one Add entry (`guest-upload.tsx`, yours); the cover itself (`event-experience-head.tsx`) is `door-reveal`'s while it runs, so if it needs a line, write it under Questions. The queue (`use-upload-queue.ts`) gains what the camera needs additively (twelve files import it). The intent sheet stays the free-upload path. Help: a `the-disposable-camera.mdx` article for guests, house style (`content/help/AUTHORING.md`).

**The direction** (Will, 2026-10-02): "Everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility." Sleek and modern, never vintage; a modern consumer app, cool to 18 to 50.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:3132`; the camera driven in a headless Chrome of your own with a fake camera stream (`--use-fake-device-for-media-stream`) at 375 and 1440, reduced motion honoured; a real phone's shooting and the server's roll cannot run on localhost: write the exact steps for Will's phone and for build 44's red-team in your Handoff.

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
