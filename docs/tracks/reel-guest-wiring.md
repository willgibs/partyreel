---
track: reel-guest-wiring
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "74794b60"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/guest/
  - src/app/(guest)/
  - src/lib/guest/
  - src/lib/events/gallery-
  - src/lib/reel/live/
  - src/lib/reel/engine/player-live
  - src/lib/r2/grid-items
  - src/lib/db/queries/guest-events
  - src/lib/upload/
  - src/app/api/r2/
  - src/app/api/guests/
  - docs/systems/guest-flow.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - CLAUDE.md
  - docs/reviews/reel-view.json
  - docs/reviews/reel-front.json
  - docs/reviews/reel-screen.json
  - src/app/(dev)/design/sandbox/reel-view/spec.ts
  - src/app/(dev)/design/sandbox/reel-front/spec.ts
  - src/app/(dev)/design/sandbox/reel-screen/spec.ts
  - src/lib/reel/engine/player.tsx
  - src/components/shared/river/qr-plate.tsx
  - docs/systems/uploads-and-r2.md
---

# lp/reel-guest-wiring

**Goal.** The live reel's guest side as Will ruled it: a Highlight reel tile that crossfades the reel's own take from the second item, a full-screen view that is also the wall (the thin bar that morphs into a weighted dock, the arrival feed, an adjustable hold, the event's code, a screen posture with Start, fullscreen and a wake lock), the one-time approval toast, one live source for album and reel, and the seam the creator plugs into.

## The brief

**The concept (Will, 2026-09-22, verbatim).**
- "The main reel is a dynamically created, faster-paced slideshow (designed as somewhat of a clickable showpiece in the album) that randomizes all the current/existing (not hidden) media in the event gallery for an immediately watchable reel anytime. This dynamic version is looped, includes most or all media, but not immediately downloadable. Guests can immediately scan the QR to watch the reel on arrival and add their own media to be included. Could play at an event in real-time on a screen or something."
- "Useful as soon as a few media items exists in the gallery"
- "Adapts to newly uploaded media on the fly"
- "A fun way to see everything in the album as a highlight, with the traditional gallery exploration also available"
- "Does not require any host action for main reel"
- A cut, which Will calls "your own clip", is made on the device by the creator lane later. This lane leaves the seam for it.

**Will's answers on `reel-view` round 1 (2026-09-24, verbatim):**
- `chrome=thin` "I do like the idea of having one subtle timeline bar to give users something to reach for when controls are hidden. The cursor movement from the reach will open controls. We should have a clean animation (libraries.dev gooey would be sick, else something morphy or at least fluid) for when the timeline opens to controls. The 'close' icon should also hide/show with controls. All controls should have clear tooltip labels on hover. We could also add a control to toggle whether the event's QR code is shown in the reel while playing (good for big screens to get everyone in). On mobile, rather than expecting a random click to open controls (which it could), we could also make a tap on the subtle timeline (more clear as clickable) open/close the reel controls."
- `controls=weighted` "I like this to give each action set its own space, but let's drop the text label from "Add Yours" and make that a single icon button in the top row. "Make Your Own" lives as the primary action beneath. By this point, it's likely the host or guest photos have already been added. Don't need to push quite as hard versus clean media presentation and letting users know they can make their own reels."
- `arrival=chip` "By placing in the top left, it can be further refined into a subtle feed with temporary stacking (limited depth) if high-frequency uploading leads to 2+ notifications at once before they disappear (feed could be not just names, but even 'X +12' or something better). It also doesn't become a centerpiece of the reel, like option 1 frames it as. Including the new item announcements is a really cool way to make the reel feel live/realtime versus just a slideshow of any album."
- `tap=lightbox`
- `posture=follow` "Reel media presentation should feel like a full-screen experience so that, if used on big screens at events, it fills them."
- `pacing=unhurried` "Let's make 3 seconds the default, but this should be adjustable in the reels lightbox controls. For something like this where there's a huge array of user preferences, makes more sense to make it customizable."
- `loop=continues`
- `reduced=paused`

**Will's answers on `reel-front` round 1 (2026-09-24, verbatim):**
- `tile=crossfade` "This allows us to control the design and ensure it stays less busy than a potentially super fast, distracting, overwhelming version. The different images differentiate the reel vs album media stills. However, I'd love to see other design ideas for this differentiation. This could be very polished/refined or taken in a better direction.."
- `verbs=watch-make` "However, since we have the event name in the header above, let's change the reel heading text to 'Highlight reel', and instead of having a 'Make your own' badge, replace the reel style and number of moments text beneath the new 'Highlight reel' heading with a 'Make your own clip to share' description. Guests don't need to see the reel style (likely don't even know what that is) or number of moments (the album beneath can have a subtle total items number label). 'The Reel' badge in top left could be replaced with something better."
- `states=nothing` "We don't necessarily need to fill that slot with a clear empty state UI or progression, especially to guests. It can simply be missing/nothing until minimum reached. However, in the host's event page, some sort of progression UI would be super helpful so they know how to unlock a reel for their event with it being such a core feature. Would be easy for a host to open an event with 1 image and think "where's my reel??". Could even drop the minimum to 2 so they bounce back and forth if that works with our engine."
- `yours=toast` "This toast is more clear than adjusting a reel label that may be scrolled past, but should likely be a more clear 'The host added your uploads' with a 'Watch reel' action if guests are deeper in the album but want to check it out immediately. The more generic 'The host added your uploads' intentionally avoids numbers in case all weren't, and to avoid having to update a live number in the toast so it simply appears once when at least 1+ guest media will be in the reel with moderation enabled. For moderated events, it'd likely also be nice to have some sort of UI (maybe a queue-esque modal or something opened by a floating icon button beside add photos or something) for guests to track either their upload batch's progress or approval status, so they aren't left wondering which images are in or where they are."
- `door=stills` "This feels a bit less busy and lets us potentially use a bit of motion in our welcome flow without clashing with a moving reel behind."
- `closed=plays`
- `hub=labelled` "However, let's add a more calm living thumbnail behind this card version as a full background with overlay to make the Reel card feel more alive than the rest."

**Will's answers on `reel-screen` round 1 (2026-09-24, verbatim):** `qr=corner`; `name=none`; `caption=?` "We addressed what happens when media is added while the reel is open in a previous question already answered."; `pacing=?` "This was also addressed in the previous question. Noticing some repeats; calling an end to the review here". And in chat: "I noticed the same 2 questions of "how long to hold an image in the reel slideshow" and "how to announce new media added in slideshow" were asked almost back-to-back in the 'reel's full-screen view' and 'the reel on the wall' boards. The 'reel fullscreen view' had much better UI for it so I answered those and marked the following repeats as not clear, but didn't want to keep going."

**His ruling in chat (2026-09-24): "The view is the wall."** One full-screen view serves phones, laptops and event screens; there is no separate wall mode. "Play on a screen" opens the same view with the event's code shown and a one-tap Start that takes fullscreen and keeps the screen awake; the viewer's hold setting applies.

**Where things stand.** Batch 1 of his desk review is transcribed (`docs/reviews/media-viewer.json`, `reel-view.json`, `reel-front.json`, `reel-screen.json`); the plan's head (the Orchestrator's) names five lanes: `media-viewer-wiring`, `reel-guest-wiring`, `reel-refresh-host`, `reel-refresh-cut`, `desk-refresh-standing`. The live reel's data model is applied on the live database and in `src/lib/db/types.ts`: `events.show_reel` (default true) and `events.reel_style_id` (null = the default mood), host-written by column grant; `media.reel_eligible` (true on every row, false only for a cut saved to the album; write-once at `create_media*`, which take `p_reel_eligible boolean default true`); `get_event_media_by_qr_token` returns `reel_eligible`; `get_event_by_qr_token` returns `show_reel` and `reel_style_id`; `ops_flags.live_reel_enabled` (true). The stored reel's tables and RPCs still exist until the drop migration after the round's red-team. The engine lanes' work is on the tree: the live composer (`src/lib/reel/live/`), `player-live.tsx`, the video window reader (`src/lib/reel/engine/video/`), harnesses at `/design/lab/tools/reel-live` and `/design/lab/tools/reel-video`.

**The album page today** (`src/components/guest/event-experience.tsx`):
- **Page order:**
  - The stored reel's hero card while uploads are closed (`:830-845`), then the header (`:853-923`).
  - The action block (`:987-1021`), then the stored reel's inline card while uploads are open (`:1028-1043`, switch at `:479-480`).
  - `GuestUpload` (`:1052-1076`).
  - `aboveAlbum` (`:696-709`, rendered at `:1116`), demo-only (`pickAboveAlbumState`: the paired-device lines or the `TurnCard`).
  - `LiveGallery` (`:1126-1157`), the guest list, the dock (`:1170-1182`) and the report footer.
- **The stored reel's guest pieces:** `guest-reel-card.tsx` and `guest-reel-overlay.tsx`.
- **The upload queue** (`src/lib/guest/use-upload-queue.ts`, used at `event-experience.tsx:299-320`) lives in memory. On a hold-for-approval event a `WaitingTile` (`stack-tile.tsx:151-185`) shows until the poll returns the approved id (`live-gallery.tsx:772-792`). The old approval toast was retired (`guest-upload.tsx:49-51`), and the comment at `live-gallery.tsx:665` about it is stale.
- **Toasts** are sonner: one `<Toaster />` (top-centre) at `src/app/layout.tsx:89`.
- **The engine:**
  - It has no minimum item count in code, and it runs at 2 clips (alternating) and at 1.
  - `holdScale` is its one pacing knob (clamped 0.25 to 3; `pacing.ts:43-77`). It scales holds, transitions and the video window together, and the live player re-plans in place when it changes (`player-live.tsx:398-433`).
  - The default mood holds 2.7 s, times 0.7 in the hand.

**Build (◇ marks a call the Orchestrator took inside his answers; list each under Questions as his to overrule):**
1. **The small-album seam, first.**
   - At a loop boundary the carried clip is re-planned with the new loop's seed (`source.ts:210-215`, the comment at `window.ts:16-21`), which re-rolls its pan and zoom (a visible jump of about 5%, `motion.ts:24`).
   - For any album of six or fewer, every handover is a loop boundary, and at one clip the motion snaps back each hold.
   - Make the carried clip keep its plan across the boundary. Add pure tests at exactly 1, 2 and 6 clips (none tests 2 today; `source.test.ts:127-142` checks only that an id exists).
2. **Minimum two.** The live reel exists for a guest from the SECOND reel-eligible approved item (his "could even drop the minimum to 2"). Below that, or with `show_reel` off, `live_reel_enabled` off, or an access decision short of `full`, there is no tile, no view and no `?reel` (his `states=nothing`). A cut (`reel_eligible` false) never counts toward it and never plays.
3. **The data through.**
   - `reelEligible` through `toGridItems` (`src/lib/r2/grid-items.ts`), `getEventMediaByQrToken`'s row mapping, and the unlocked password album's table read (`getApprovedMediaForUnlock`, `guest-events-admin.ts`, whose select list needs `reel_eligible`).
   - A comment in the gallery fingerprint (`src/lib/events/gallery-*`) that `reel_eligible` is write-once and rides outside it, like `width` and `height`.
   - The gallery payload (`src/app/api/guests/gallery`) carries `showReel`, `reelStyleId` and `liveReelEnabled`. For the creator it adds `videoAllowed`, the watermark flag and the cut's length cap, all tier-derived on the server (`videosAllowedForTier`, `tier_limits().max_reel_seconds`) and never computed on the client.
4. **One source for the album and the reel.** Lift `LiveGallery`'s refreshed item list, its arrival ids and the device's own ids into a `GalleryLiveProvider` mounted above both. It owns `refresh`, the doorbell, `useLivePoll`, the ETag and the stricter-drift guard. The reel reads that context, never the seed promise, which is exactly why the shipped reel is static.
   - Presigned URLs are looked up by id at fetch time from the latest payload, never held.
   - A watchdog treats any image or reader rejection as possible expiry (an expired presign answers a CORS-shaped failure with no status): it clears the ETag and forces one full refetch, at most once a minute.
5. **The tile** (his `crossfade` and `verbs` notes):
   - **Its slot.** Its own slot directly above `aboveAlbum`, never a fourth arm of `pickAboveAlbumState` (the demo's turn card and paired lines stay adjacent to the first photograph).
   - **The look.** A slow crossfade of stills (`preview_key`, never `original_key`), no engine on the album, and nothing blocking the album's first paint.
   - ◇ **Its stills** come from the reel's own take (`planTake`), not the album's newest, so it never mirrors the tiles right beneath it.
   - **The copy.** Headed "Highlight reel". The description "Make your own clip to share" renders only once a creator is passed in (below). No style name, no moment count, no corner badge; ◇ no chip either, until `reel-front` round 2's winner replaces "The reel" chip.
   - **The tap.** Tapping the tile opens the view.
   - **The album label.** The album gains a subtle total-items label (the payload's `approvedTotal`).
   - With uploads closed the tile stays (`closed=plays`), and the door keeps its stills (`door=stills`).
6. **The view** (`?reel` in the URL opens it; deep-linkable), his `reel-view` picks as amended:
   - **Chrome `thin`:**
     - At rest, a slim glass bar at the foot: play and progress.
     - Pointer movement on desktop, or a tap on the bar on touch, morphs it into the full dock. Prototype the morph (his "libraries.dev gooey would be sick, else something morphy or at least fluid") with the motion tokens and `emil-design-eng`; keep it GPU-cheap on a phone and instant under reduced motion.
     - Close shows and hides with the dock, every control has a hover tooltip, and a resting pointer fades the dock back to the bar.
   - **Controls `weighted`, amended:**
     - One top row of icon buttons: play/pause, Include videos, Style, Hold, Show the code, and Add yours as an icon.
     - Beneath it, "Make your own" as the single primary, rendered only once a creator is passed in.
     - Keyboard: Space pauses, Escape closes, the arrows step a clip, and every control is labelled.
   - **Arrival `chip`:**
     - The uploader's name in a top-left chip for one hold, driven by the provider's arrival ids.
     - Bursts stack into a short feed of limited depth that collapses ("Theo +12").
     - Close stays top-right.
   - **Tap `lightbox`:** pauses and opens the item in the shared media viewer. When `media-viewer-wiring` lands (announced in `docs/tracks/orchestrator.md`), sync and pass its `origin` (the frame's rect, kind `reel`) and `startAt` (a video's current time). Until then, use its current API.
   - **Posture `follow`:** full-bleed, the composition following the viewport (portrait on a phone, landscape at a laptop), filling a big screen.
   - **Hold `unhurried`, amended:** 3 s default, adjustable in the dock. ◇ The steps merge both boards' options: 1, 1.5, 2.2, 3, 3.6, 5 and 7 s. Convert the chosen seconds into the mood's `holdScale`, and keep the choice per device in `localStorage` (never on the wire).
   - **Style:** the eight moods, device-local in `localStorage`, defaulting to the event's `reel_style_id` or else the default mood.
   - **Include videos:** default on; `navigator.connection?.saveData` starts it off.
   - **Loop `continues`:** no seam announced.
   - **Reduced motion `paused`:** the first frame holds with the dock up.
   - **Show the code** (`qr=corner`, `name=none`): a white plate bottom right with the event's QR, "Scan to add yours" and the readable address, drawn by the existing QR renderer (`src/components/shared/river/qr-plate.tsx`, `src/lib/qr/`). No event name on screen.
   - A loop whose failure count crosses a threshold reports once to Sentry from the client.
7. **The view on a screen** (the view is the wall):
   - A screen posture on the same view (◇ `?reel=screen`): the code on, and a one-tap Start plate. ◇ The plate is the board's recommended `frame`: the first frame behind a dimmed play mark.
   - Start takes fullscreen where the platform allows it and a wake lock (`navigator.wakeLock`), re-taken on every return to visible and released on unmount. Leaving fullscreen brings the plate back rather than a half-dressed view.
   - The host's explicit act overrides reduced motion.
   - Before the minimum, ◇ the idle state is the board's `code` option: the code and the address alone.
   - The host's hub entry is the host lane's. His verdicts on the re-cut `reel-screen` board may restyle the plate and the idle state later.
8. **The toast** (`yours=toast`):
   - Once per visit, on a moderated event, when the first of this device's held uploads is approved while the reel is showing: "The host added your uploads" with a "Watch reel" action that opens the view.
   - No numbers. ◇ It does not show while no reel is showing.
   - The queue lives in memory, so it fires only within the visit that made the upload; the ROADMAP holds the server half.
9. **The cut's seam:**
   - `addCutToAlbum(file: File, poster: Blob)` puts a cut through the ordinary upload queue with `reelEligible: false` (a new optional field). The complete route (`src/app/api/r2/complete-upload/route.ts`) passes it through `src/lib/upload/server-pipeline.ts` into `create_media(..., p_reel_eligible => false)`; the pipeline carries it for the host strategy too.
   - The creator itself (`src/components/reel/`) is the cut lane's: the view and the tile take an optional `creator` prop and render "Make your own" and the tile's description only when it is present, so no build shows a dead end.
10. **The link card:** `generateMetadata` for `/e/[token]?photo=<id>` on an OPEN album gives the unfurl this photograph as its image, titled "A photo from <event name>", presigned server-side. A gated album keeps the event card; an unknown, held or hidden id keeps the event card.
11. **Demo mode:** the tile and the view in `/demo`; "Add yours" is the demo's simulated add, and there is no creator.
12. **The old reel's guest pieces:** stop rendering the stored reel's card and overlay. Leave the files: `touchpoints.ts` lists them, and the teardown lane deletes them.

**Look at first (your Handoff):**
- The seam tests at 1, 2 and 6 clips.
- The tile at 2 approved items and absent at 1 (build a disposable event through real uploads on localhost if you need one, or use the scale probe `d02631f1bfb3455188d224e41bf9510f` for many).
- The view at 1440 and 375 with reduced motion on and off, the morph captured as a short sequence, the code plate, the hold steps, and an arrival stacking into "Name +N" (a second device or a simulated arrival).
- The screen posture's Start plate, fullscreen and wake lock.
- The toast on a moderated disposable event.

**Boundaries.**
- **Not yours:**
  - the media viewer (`src/components/shared/media-lightbox*`, `masonry*`);
  - the host app (`src/app/(app)/`, `src/components/app/`);
  - the creator (`src/components/reel/`);
  - the stored reel's services and routes (the teardown's);
  - `src/lib/db/types.ts`, migrations, and live writes beyond real uploads to a disposable event.
- `docs/systems/guest-flow.md` is yours (the reel's guest half and the Lightbox section; `media-viewer-wiring` hands the Orchestrator its lines).
- **You hand off and WAIT.** The Orchestrator integrates this lane together with the cut and host lanes, so that one alias build replaces the stored reel. Until it tells you to, sync only when told.

**Binds.** The bible and the policies (`/design/library`), the contracts of every component under a path you own, and
CLAUDE.md's working loop. A record doc
(`docs/STATUS.md`, `docs/ROADMAP.md`, `docs/PROGRAM.md`, `CLAUDE.md`, `docs/ASSETS.md`, `docs/tracks/orchestrator.md`,
`docs/reviews/`) is edited only when your `owns` names it. Stage explicitly; never `--no-verify` or force-push; every commit ends
with the `Co-Authored-By` line naming the model you actually run on.

**Verify on.** The gate on the synced tree, each step on its own exit code: `pnpm design:rules`, `node "src/app/(dev)/design/gallery/collect-specimens.mjs"`, `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm lab:smoke --base http://localhost:<port>`; the surfaces the Handoff is judged on, local at 1440 and 375.

## Questions (a recommended answer each; the Orchestrator relays them)

The ◇ calls, taken exactly as the brief wrote them (his to overrule):
- ◇ The tile's stills are the reel's own take (`planTake`): six previews on a slow crossfade (3.2 s a still), never the album's newest. Recommended: keep.
- ◇ No chip on the tile until `reel-front` round 2's winner replaces "The reel" chip. Recommended: keep until that winner lands.
- ◇ Hold steps 1, 1.5, 2.2, 3, 3.6, 5 and 7 s, 3 by default. Recommended: keep.
- ◇ `?reel=screen` is the screen posture. Recommended: keep (one view, one parameter).
- ◇ The Start plate is `frame` (the first frame behind a dimmed play mark). Recommended: keep until his re-cut `reel-screen` verdicts restyle it.
- ◇ Below the minimum the screen's idle state is `code` (the code and the address alone). Recommended: keep. The host's Start there is a quiet button under the address: the plate's scrim over the code dimmed the one thing a guest must scan (found in this lane's captures, fixed in 4800b595).
- ◇ The toast never plays while no reel is showing. Recommended: keep.

Calls this lane took (his to overrule):
- The album's count label reads "N photos & videos" (the stats line's and the teaser CTA's always-both-nouns wording), left of Download all and View, the demo included. Recommended: keep; the alternative is a bare number.
- The reel plays the SERVER's approved list, so a photograph joins the loop when the album confirms it (a completion refetches at once), never as an optimistic full-size blob; the demo plays its optimistic tiles too, since its uploads never reach a server. Recommended: keep.
- Style is remembered per event on the device; Hold and Include videos per device, across events. Recommended: keep.
- The toast counts reel-eligible items only (a cut the host approves never toasts), once per visit. Recommended: keep.
- One Sentry report per view at twelve failed frames or stills (the brief's "a loop whose failure count crosses a threshold reports once", read the quieter way); every failure also asks the presign watchdog. Recommended: keep.
- The bar-to-dock morph is a `clip-path` inset morph with the icons arriving on a short stagger (GPU-cheap on a phone, instant under reduced motion), not an SVG gooey filter. Recommended: keep; a gooey pass is a lab exploration if he wants the goo.
- The dock settles back after 2.4 s of a resting pointer (4.2 s after a touch), never while paused, focused or a menu is open. Recommended: keep.
- The viewer opened from the reel holds the album's whole approved list in album order (its counter reads the album, "Photo 5 of 14"), not the reel's take. Recommended: keep.
- The event's link card moved from the file-based `opengraph-image.tsx` to the route `/e/<token>/card`, because a file-based image outranks `generateMetadata` and the `?photo=` card depends on the query; the pixels are unchanged. Recommended: keep.
- NEW, not built: a signed-out device that opens `?reel` or `?reel=screen` meets the welcome door first, over the reel (the owner never meets the door, so the host's own "Play on a screen" is unaffected; a guest's shared `?reel` link is an arrival). Recommended: keep the door for `?reel`; for `?reel=screen` on a signed-out wall device, hold the door until the view closes. Left for his ruling: the door's auto-open is the page's most-tested logic.
- NEW, a look: the default mood (Cinematic, id `classic`) draws its letterbox bars in landscape, so a laptop or an event screen shows bars inside a full-bleed picture (`posture=follow` fills the screen; the mood then frames it). Recommended: keep (the mood's signature, and the host picks the mood); the alternative is the live view dropping the letterbox on the wall surface.

## System-doc edits (in place, owned facts only)

- `docs/systems/guest-flow.md`: the BELONGS HERE line; "Stats" (the album's own count label, the provider's `onCountChange`); the column list; `open` plus "The link's image" (the card route; `?photo=` read with `readPhotoParam`); "Live gallery" (the one live source, the presign watchdog, the reel facts in the ETag, `reelEligible` outside it, the provider's handle); "One true count" and "The flip and the drift" (the provider); "Demo mode" (the reel in the demo); "The guest reel" replaced by "The live reel (the guest half)". The Lightbox bullet is untouched (the Orchestrator's, from `media-viewer-wiring`).
- For the Orchestrator, outside this lane's owns: `docs/systems/host-app.md`'s sentence "The motion-video engine (`engine/video/`, `lib/reel/live/`, `player-live.tsx`) is on the tree, but only the lab harnesses ... drive it: the production reel never passes a video source" goes stale at this merge, since the guest album's live reel drives all three in production (video windows under Include videos). Proposed: "... drive the guest album's live reel ([guest-flow.md](guest-flow.md), "The live reel"), with the lab harnesses (`/design/lab/tools/reel-video`, `/design/lab/tools/reel-live`) beside it."
- For the Orchestrator: `docs/systems/uploads-and-r2.md` (the complete route) gains one fact: the guest complete body takes an optional `reel_eligible` (false for a cut), carried by the pipeline for both strategies into `create_media*`'s `p_reel_eligible` (database-security.md already states the column's write-once rule).

## Deferred (ROADMAP one-liners, bucket named)

- Now: the host strategy of the complete route sends `reel_eligible` once the creator lets a host save a cut (the pipeline carries it for both strategies; only the guest queue's `addCut` sends it today).
- Now: the Library entries for the new components: `for` lines in `component-notes.ts` and `@contract-for` headers for `reel/live-reel.tsx`, `reel/live-reel-view.tsx`, `gallery-live.tsx` and `player-live.tsx` (their tests are plain component tests today, since a contract needs a `for` line outside this lane), and `live-gallery.tsx`'s `for` line refreshed now that its state lives in the provider.
- Now: `/admin` toggles `ops_flags.live_reel_enabled` and shows the "live reel: frames failing" reports (this lane reads the lever; nothing writes it yet).
- Now: the approval toast's server half, so a held upload approved after the visit that made it is told on the next visit (the queue lives in memory).
- Now: the door on `?reel=screen` for a signed-out wall device, once he rules (Questions).

## Handoff (replaces the chat report)

- **Commits, all pushed to `origin/lp/reel-guest-wiring`.** Work: `66a09fba` (the seam), `edac46b8` (the data through), `d88742fc` (the cut's seam), `e8ffbe21` (the guest side), `f2f91f1b` (the album's count label; guest-flow.md), `b6dc9f28` (the viewer's origin and moment, the card's reader, the address rule), and the last work commit `4800b595` (the idle wall's Start). Sync merges: `96442f54` (desk-refresh-standing, reel-refresh-cut), `60ea19a4` (media-viewer-wiring), `59d89808` (reel-refresh-host).
- **Gates on the synced tree (`59d89808`), each on its own exit code** (logs `/private/tmp/claude-501/-Users-gibby-local-ai-partyreel/401f4a77-be99-4a42-82f6-e5fac8e4a4c5/scratchpad/reel-guest-wiring/g4-*.log`): `pnpm design:rules` 0 (no artifact drift) · `collect-specimens.mjs` 0 (no drift) · `pnpm typecheck` 0 · `pnpm lint` 0 (7 warnings, none in a touched file) · `pnpm test` 0 (443 files, 4890 passed, 1 skipped) · `pnpm build` 0 · `pnpm lab:smoke --base http://localhost:3132` 0 (498 checks, 0 failing).
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` is 54 paths plus this file, every one under `owns` but `src/lib/db/mutations/guest.ts`: two lines (`createMedia` takes `reelEligible` and passes `p_reel_eligible`), because it is the only door to `create_media` and the cut's seam must reach it. The rename `src/app/(guest)/e/[token]/opengraph-image.tsx` to `card/route.tsx` stays inside `owns`; nothing in the lab imports it.
- **Items:**
  1. The seam: one motion stream per session (`motionSeed`); the carried clip keeps its plan and ordinal across a loop boundary; one clip holds without snapping; the handover resumes on the leaving window's frame. Pinned at 1, 2 and 6 clips (`source.test.ts`, "the small-album seam"), in `window.test.ts`, and by `player-live.test.tsx`'s handover continuity across warm and punchy, which fails on the old code.
  2. Minimum two: `LIVE_REEL_MINIMUM` and `liveReelAvailable` (`gallery-reel.ts`): approved, reel-eligible and drawable; below it, with the switch or the lever off, or short of full access, no tile, no view, no `?reel`.
  3. The data: `reelEligible` on every album item (grid items, the RPC mapping, the unlock and teaser reads); `GalleryReel` on the page and every poll's 200, tier facts derived on the server, hashed in the ETag (`g6-`).
  4. One live source: `GalleryLiveProvider` above the album and the reel; the presign watchdog (one forced refetch a minute at most).
  5. The tile: "Highlight reel", six previews of the reel's own take, its own slot above `aboveAlbum`, "Make your own clip to share" only with a creator; the album's own count label.
  6. The view (`?reel`): full-bleed, the bar that grows into the dock, tooltips, Space, Escape and the arrows, Style, Hold and Include videos kept on the device, the code plate, the arrival feed ("Theo +3", depth 3), a tap into the shared viewer grown out of the frame with a video's `startAt`, reduced motion paused with the dock up, one Sentry report.
  7. The screen (`?reel=screen`): the Start plate, fullscreen and the wake lock (re-taken on return, released on close), the plate back when fullscreen is left, the idle wall (the code, the address, a quiet Start).
  8. The toast: "The host added your uploads" with "Watch reel", once per visit, moderated events only, never a cut.
  9. The cut's seam: `addCutToAlbum(file, poster)` into the queue's `addCut` (`reelEligible: false`, the poster as its preview), through the complete route and the pipeline to `create_media(p_reel_eligible => false)`; `creator-seam.ts`'s `REEL_CREATOR` is the creator's one plug.
  10. The link card: `?photo=<id>` (read with `readPhotoParam`) on an album anyone may open unfurls as that photograph; everything else keeps the event card at `/e/<token>/card`.
  11. The demo: the tile and the view; Add yours is the demo's simulated add; no creator, no toast.
  12. The stored reel's guest card and overlay no longer render, and the page reads no stored reel (`getGuestReelContext` is not called); the files stay for the teardown.
- **Assets requested from Will:** none.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none.
- **Calls his to overrule:** the Questions above, one line each.
- **Look at first:**
  - The seam: `src/lib/reel/live/source.test.ts` ("the small-album seam", 1, 2 and 6 clips) and `src/lib/reel/engine/player-live.test.tsx` ("★ a handover keeps the SAME clip at the SAME frame").
  - The tile at two and absent at one: the disposable events "Reel lane probe (disposable)" (`aefb1f5d-1a6b-461a-949f-aabe44ea79a0`, 14 approved, built through real uploads) and "Reel lane probe one (disposable)" (`7a6eb647-312e-4254-ab30-4d256cf63a32`, 1 approved).
  - Captures at 1440 and 375, `/private/tmp/claude-501/-Users-gibby-local-ai-partyreel/401f4a77-be99-4a42-82f6-e5fac8e4a4c5/scratchpad/reel-guest-wiring/captures/` (local headless Chrome, web security off only so the canvas can read R2): `*-01-album` (the tile and the count label), `*-02-view-open`, `*-03-view-rest`, the morph as nine close-ups of the dock (`*-04-morph-0..8`), `*-05-dock-paused`, `*-06-hold-menu`, `*-07-code`, reduced motion (`*-rm-*`), and the screen (`1440-screen-01-plate`, `-02-playing`, `-03-rest`, `-04-idle`).
  - On the alias, the first place the reel draws for real (R2's CORS allows partyreel.com and the alias only, so localhost's canvas is black without a relay): the view at 1440 and 375, the Start's fullscreen and wake lock on a real screen, and the toast on a moderated disposable event (a host approval), which only `live-reel.test.tsx` ("the approval toast") covers so far.
  - The card on the alias: `/e/<token>?photo=<approved id>` unfurls as that photograph; a gated album keeps `/e/<token>/card`.
