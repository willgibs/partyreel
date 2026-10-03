---
track: disposable-camera
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
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

- **The board's retirement waits on `the-wait`.** `the-wait`'s manifest reads `src/app/(dev)/design/sandbox/disposable-mode/`
  and `track-manifests.test.ts` holds a live track's reads to exist, so deleting the folder turned the gate red
  (`the-wait.md is well-formed`); the folder is left whole. Recommended: at this merge drop that read from
  `the-wait.md` (its board imports nothing from the folder: `git grep` on `lp/the-wait` at `3b638f88`) and
  `git rm -r src/app/(dev)/design/sandbox/disposable-mode/`; or delete it at `the-wait`'s merge. Its ledger stays the
  record's, as ever.
- **The door's keep rises over the camera.** A signed-out guest's first landed shot makes the keep due
  (`event-experience.tsx`'s `keepDue`), and the door's sheet opens over the camera mid-shoot (driven:
  `_scratch/disposable-camera/shots/keep-375-keep-over-camera.png`; after Maybe later the camera works again).
  Recommended: hold the keep while she shoots: `GuestUpload` now says when (`onCameraOpenChange`), the page's line is
  `keepDue && !cameraOpen` (`crumbs-52` owns the file now: two lines). Built: the prop, unused until then.
- **Three more lines of the page's half, in `event-experience.tsx`** (`crumbs-52`'s): `inFlightUploads` keeps a
  `sealed` landing as it keeps a held one (`|| it.mediaStatus === "sealed"`), so her tracker draws this visit's picture
  of it (a placeholder today: `shots/tracker-375-tracker.png`) and the cover says "Add photos" once she has shot (it
  says "Add the first photo": `shots/tracker-375-album-after.png`); and `GuestUpload` takes `isOwner={isOwner && !isDemo}`
  and `onOwnRemoved={handleOwnRemoved}`, so the host's own camera keeps no roll and a shot taken back inside the camera
  is the page's removal too (a require-an-upload album re-asks its door). Recommended: placed at this merge or by
  `crumbs-52`. Built: the props and the camera's behaviour for each (pinned in `album-camera.test.tsx`).
- **The Add's words on a camera album.** The cover's white Add and the shutter say "Add photos" / "Add the first photo"
  with the upload glyph where they open the camera. Recommended: "Take photos" with the camera glyph, the shutter named
  the same (`event-experience.tsx` and `ui/shutter.tsx`'s face); `the-wait`'s words ask or a crumbs.
- **The door's first-photo step on a camera album** (`entry-modal`'s upload step) still offers Take a photo and Choose
  from your album, so a library photo can reach the roll there (the server counts it either way). Recommended: on a
  camera album the step opens the camera, or is skipped.

## System-doc edits (in place, owned facts only)

- `docs/systems/disposable-mode.md`: "The guest's camera", a new section (where it lives, the shots through the one
  queue and a sealed landing told `sealed`, the count's reads and their ★ rules, full size, the video and the
  microphone, the release), and its "Open this before you" line.
- `docs/systems/uploads-and-r2.md`: the complete answers `sealed: true` beside `approved` for a row sealed at insert.
- For the record (not this lane's file): `guest-flow.md`'s "THE ADD CHOICE" says every Add opens the add sheet; a camera
  album's opens the camera (disposable-mode.md, "The guest's camera").
- For the record: ROADMAP's two lab lines that name the disposable-mode board's quotes (its floating surfaces, its
  Review room) go with the board when it retires.

## Deferred (ROADMAP one-liners, bucket named)

- Now: Android's `takePhoto` still, where it arrives on its side against the frame (the sensor's orientation), falls
  back to the frame; turning it by the track's angle would keep the larger picture (measure on a device) (from
  `disposable-camera`).
- Now: the camera's Back is one place: from her shots the phone's Back closes the camera, not the list; a second entry
  for the list would peel one layer a press, as the viewer and a popup do (from `disposable-camera`).
- Now: the develop time is said a third way, the camera's from now ("at 9 am", `lib/guest/camera/words.ts`'s
  `developsWhen`), beside the host's and the tracker's date; the one formatter in `lib/disposable/` the hygiene line asks
  for would hold it too (from `disposable-camera`).

## Handoff (replaces the chat report)

- **Commits, pushed** (`lp/disposable-camera`): work `9e569a79` (the camera, and red-team 43's upload half), `8464534c`
  (the camera's pins, a dismissed shot leaving her roll, the guest's help, the facts recorded), `44bd0dba` (an earlier
  video's first frame); sync `fc346418` (`origin/launch-prep` at `219cec81`: door-reveal's page half reached the
  tracker; resolved to its model, "Waiting to develop" with the row's `sealed` flag, this lane's own status dropped).
  The head is in the chat line.
- **Gates on the synced tree, `44bd0dba`**, each on its own exit code (logs in `_scratch/disposable-camera/gate-*.log`):
  typecheck 0; lint 0; test 0 (797 files, 9,422 tests); `zsh scripts/build-lock.sh pnpm build` 0 (the camera its own
  38 KB chunk and 9 KB sheet, `0y.o.u.k__vxo.js`, `023e_87r280qm.css`); `pnpm lab:smoke --base http://localhost:3135`
  0 (187 checks, 0 failing).
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): owned paths (`src/components/guest/camera/`,
  `src/lib/guest/camera/`, `guest-upload*`, `use-upload-queue*`, `the-disposable-camera.mdx`) and the record's two
  system docs, plus these exceptions, each the Orchestrator's addendum or the feature's own necessity:
  `src/lib/upload/server-pipeline.ts` and `uploader.ts` and `src/app/api/r2/complete-upload/route.test.ts` (the
  addendum: the server's `sealed` honoured where the create's answer is read; three lines each side);
  `src/lib/guest/upload-tracker.ts` and its test (the addendum: a landing the queue told `sealed` waits in her tracker
  from the moment it lands); `next.config.ts` (Permissions-Policy `microphone=(self)`: `microphone=()` refused even the
  site, so hold to film could never have sound; its comment refreshed); `content/help/AUTHORING.md` (one line: the
  library map names every article, `help-reading-order.test.ts`).
- **The items:**
  - On an album whose `capture` is `camera`, the one Add (`GuestUpload.openAdd`, so the cover's and the shutter's) opens
    the camera full screen (`components/guest/camera/album-camera.tsx`, a lazy chunk fetched as such an album mounts);
    a free-upload album is unchanged and never loads it.
  - The picture contained (3:4 upright, 4:3 on its side and at a desk), the reel as a timeline polished (the minute at
    the type floor, the live frame ringed without a glow, a sending dot, the live frame red and filling while a video
    rolls, frames shaped like the picture), the frozen frame sealing into glass as the reel glides (reduced motion: the
    sealed frame at once).
  - Her count is the server's roll (`/api/guests/mine` `statuses`, never `tell`), read at the opening, after a removal
    and after a roll refusal, only while nothing of hers is in the air; the shots since the read are added at once.
  - A tap is a photo at full size (the stream's frame cropped to what she framed, JPEG 0.92; `ImageCapture` where it
    offers half again the pixels the same way up), a hold a video (1080 short side, MP4 or WebM, ends itself at 10 s,
    its first frame its poster); the microphone asked only on a hold, a slow one filming without sound; a hold under a
    second takes the photo meant; Free or Videos off is photos only.
  - Every shot into the page's one queue as it is taken; refusals in the server's words (the roll's end, the album
    stopping the shutter in a banner, one shot's file said once, a lost connection's "1 shot didn't send" with Retry and
    a retry on the connection's return); the failure sheet waits while the camera is open.
  - The roll's end ("That's your roll", when it comes back, See your shots, Back to the album, "Remove a shot to free its
    frame" short of the ceiling); her shots open from the reel too, removable where the album cannot show them, a removal
    freeing its frame by the server's count.
  - Flash where the camera has a torch, the screen for the front camera; turn the camera round where it has two; the
    camera let go when the page hides or it closes; Back, Escape and its close close it.
  - Red-team 43's upload half (the addendum): an upload to an album with a develop time ahead (any capture, any surface)
    lands `sealed` by the server's word (`landedAs`), so no tile stands in the album for her alone; her tracker keeps
    it as "Waiting to develop" from the moment it lands; the album's slot says "Uploads appear in the album when it
    develops, <date>." (her tracker's own sentence). Red on the old code: `use-upload-queue.test.tsx` "lands
    `sealed`", `guest-upload.test.tsx` "an album that develops later", `upload-tracker.test.ts` "a landing the queue
    told sealed", `route.test.ts` "a sealed landing".
  - The guest's help, `content/help/the-disposable-camera.mdx` ("Shoot with the album's camera").
  - Pins: `album-camera.test.tsx` (9), `use-shutter-press.test.tsx` (7), `lib/guest/camera/*.test.ts` (53), the queue's
    and GuestUpload's camera cases.
  - Driven in my own headless Chrome with a fake camera stream (a party photograph) at 375 and 1440, reduced motion, the
    uploads stood in at the network (localhost is in no R2 allow-list): `_scratch/disposable-camera/shots/` (framing,
    a shot at 120 ms, landed, filming, a video, the roll's end, her shots, a refusal, an unsent shot and its retry, Back,
    the page hidden and back, her tracker on the album after); the drive is `_scratch/disposable-camera/cam-drive.mjs`.
- **Will's phone** (iOS 26), once build 44 is on the alias:
  1. As the host at a desk: a test album's Settings › What guests add: the album's camera; When everyone sees: at a
     develop time (tomorrow, 9 am); Videos on.
  2. On the iPhone, signed out: open its link, pass the door with a name, tap the cover's Add. The camera opens; Allow.
  3. The picture fills its 3:4 box unstretched; "24 left", "Frame 1 of 24", "Develops at 9 am"; the reel's live frame
     moves with the picture.
  4. Tap: the flash, the reel glides, "Shot 1 is on the roll.", 23 left, the frame wears its minute.
  5. Hold: the microphone's prompt (Allow), then hold again about 4 s: the shutter red with a filling ring, "0:04 of
     0:10"; let go: "Your video is on the roll."
  6. Turn the camera round and take one: it is kept mirrored, as seen.
  7. Lock the phone 5 s and come back: the camera light was off, the picture returns.
  8. Tap the reel: three shots, "Waiting to develop", each with ×; remove one: the count steps up.
  9. Back to the album: none of them in it, her tracker's badge counts them, the line says when it develops.
  10. As the host, Develop now; reload the guest's page: her shots are in the album. Save one: about 12 MP and 2.6 MB;
      the video MP4 at 1080 by 1440.
- **Build 44's red-team** (the alias): roll size 3 (Settings): shoot 3, the end; a 4th from a second tab, refused in the
  server's words, the failure sheet listing it on close; take one back in her shots, shoot again; take and remove until
  the ceiling (9): "You've used every retake this roll allows."; a Free album: a hold takes a photo, "Tap for a photo.";
  close uploads mid-shoot: the banner, the shutter off, the failure sheet on close; a develop album through the add
  sheet (capture upload): no tile, her tracker "Waiting to develop"; the header `Permissions-Policy: camera=(self),
  microphone=(self)`; Android's Back closes the camera; Escape at a desk.
- **Assets requested from Will:** none.
- **Board ideas:** the album's shutter on a camera album wears her roll, the 24 ticks Will loved round option 1's
  shutter, so her count is on the page between shots (the dock's `Shutter` atom); the camera's own first-run moment
  (its first opening says the roll in one line, once) if the first press proves unsure on his phone.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none (the header is `next.config.ts`, above).
- **Calls his to overrule:**
  - The host's own camera keeps no roll (her uploads are exempt), once the page hands `isOwner` (Questions).
  - A front-camera shot is kept mirrored, as she saw it (the iPhone camera's default).
  - The shot's shape follows the phone's: 3:4 upright, 4:3 on its side and at a desk, the reel's frames with it.
  - A hold under a second takes the photo meant; a microphone not answering in 1.5 s, or refused, films without sound.
  - Spent frames are sealed glass with their minute on every album, whichever reveal: the camera shoots, the album shows.
  - The whole reel opens her shots; there only a shot the album cannot show (sealed or held) is removable, one in the
    album removed from the album, as her tracker's rule.
  - The flash only where the camera has a torch (Android's rear), the front camera's the screen lit white.
  - The camera says the develop time from now ("at 9 am", the board's drawing); the page and her tracker say the date.
  - A lost connection's shots go again by themselves when it returns, besides Retry.
- **Test data:** "Camera lane test" (`341b486a-a12c-48d3-b6ad-563864047350`, willg97, link `/e/8b2a90e9979f4716b9b57392a6928a2b`,
  open, names, the camera, a develop time 2026-10-03 09:54Z): a ready camera album for the steps above, its guests the
  drive's "Cam Tester" joins and no media (the uploads were stood in); delete it when done.
- **Look at first:** the camera on his iPhone (steps 2 to 5: the picture's size, the first hold's microphone prompt),
  then the keep over the camera (Questions), then `next.config.ts`'s one header line.
