---
track: reel-clip-wiring
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "e13a98d6"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/reel/
  - src/components/guest/reel/
  - src/components/guest/guest-reel-
  - src/components/shared/media-lightbox-parts/actions
  - src/lib/reel/client-save
  - src/lib/reel/client-encode-budget
  - src/lib/reel/build-reel-props
  - src/lib/reel/clip-
  - src/lib/reel/engine/encode
  - src/lib/reel/engine/overlays
  - src/components/shared/route-skeleton
  - src/app/(dev)/design/(shell)/library/patterns/interactive-demos.tsx
  - src/app/(app)/dashboard/[eventId]/actions
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/reel-cut.json
  - docs/reviews/reel-front.json
  - src/app/(dev)/design/sandbox/reel-cut/spec.ts
  - src/app/(dev)/design/sandbox/reel-front/spec.ts
  - src/lib/events/gallery-reel.ts
  - src/lib/media/share-save.ts
  - src/lib/reel/defaults.ts
  - src/lib/reel/live/take.ts
  - docs/systems/guest-flow.md
  - docs/systems/host-app.md
---

# lp/reel-clip-wiring

**Goal.** Build the clip creator ("Make your own") as Will shaped it across two rounds of `reel-cut`, register it through the guest seam, restyle the reel's tile per `reel-front`, and end the Studio. A clip is the viewer's own: made on their device from the album, saved or shared as a file, and on a paid event optionally added to the album as an ordinary video that the live reel never plays.

## The brief

Will's picks and notes: `docs/reviews/reel-cut.json` (both rounds) and `docs/reviews/reel-front.json`; the boards' specs draw the settled answers as ground.

**The bench, as amended (round 2, `bench=column`).** At a laptop: the header across the top ("Maya & Jay", "Your clip", "0:30 · Cinematic · 8 moments", a violet Make it), the 9:16 clip at full height on the left, a panel on the right, the order strip and the tray below. **The panel holds two views as tabs, one open at a time**:
- **Looks**: the wall of looks as round 2's `strip` option drew it, each tile the engine's still of her own clip in that look, the worn one ringed with a check.
- **Moments**: the album pool as round 2's `dial` option drew it: the fill chips (the reel's picks, Only mine, Everything), tiles numbered in clip order, the rest dimmed, "Hidden · Show" on the host's hidden photos.

The tabs give each view room, and the order strip beneath gets the height they free (bigger tiles; hold to reorder while the clip plays; the dashed +). At 375, focused views: the clip on top, the tab switch, one view below, never everything at once. His words: tabs are "almost like a self-tour as you click into each and toggle around". A call, his to overrule: Looks opens first, since the reel's picks already fill the moments. The tray keeps Length (Auto, 15, 30, 60 under the tier cap), Layout and Opening.

**Settled in round 1, built now:**
- `entry=room`: the view's Make your own opens the creator as its own room.
- `blocked=caption`: a guest never sees hidden photos; the host sees them captioned "Hidden · Show".
- `wait=stack` while it draws: "3 of 8 moments left", "Drawing your clip on this device. Keep this tab open.", Cancel. A backgrounded tab pauses. A lost GPU context lands on the finish with Retry and the picks kept.
- `sound=silent`: no audio track.
- `mark=line`, quieter but findable: "Free events mark their clips. Pro events don't" (the host: "Your free event marks its clips. Remove it with Pro").
- `noencode=greyed`: without an encoder, Make your own stays visible, greyed, and a tap explains ("This browser can't make clips. Open the album on another device to make one."); no text lies over the reel.

**The finish, as he amended it.**
- Share leads. It is its own tap, never chained off the encode, because iOS spends the user activation. `canShare` is probed with the real file, and dismissing the sheet raises nothing.
- Save opens the platform's options: on iOS Save to Photos first, then Download file (`src/lib/media/share-save.ts`); Android and desktop download.
- Add to event sits behind a confirm: the host's clip lands approved and uses about N MB; a guest on a moderated event learns the host reviews it first.
- Every action keeps you on the finish and shows its done state ("Saved", "Added"). Make another.
- At a laptop the finish sits in the panel under "Back to editing, your picks kept".

**Moments are a local selection.** The default is the reel's current take capped to the length; the fills are Only mine and Everything; the pool is the reel-eligible album, so a clip is never cut from clips.

**Payload-derived, never the client's.** The mark, the length cap and whether video may be added come from the server's `ClipFacts` (`src/lib/events/gallery-reel.ts`). Add to event renders only when the seam passes `addClipToAlbum` (null means uploads are closed or the plan takes no video). The cap moves into the encoder as a constant.

**The seam.** Point `REEL_CREATOR` in `src/components/guest/reel/creator-seam.ts` at the creator; everything it needs arrives as props. The guest's add is the seam's `addClipToAlbum` (the ordinary upload queue with `reel_eligible = false`). The host's add goes through the host's complete route, which already takes `reel_eligible`; its client function is yours, under `src/lib/reel/clip-`.

**The tile (`reel-front`, closed).**
- `signature=plain`: the slow crossfade over the reel's own take, as built.
- `badge=glyph`: a 24px dark disc holding a 12px clapperboard, 10px in from the top-left corner.
- **No "Make your own" pill on the tile.** His round-1 note asked for the violet line "Make your own clip to share" under the Highlight reel heading instead (round 2 drew the pill as ground by mistake). The line renders only when a creator is registered. A call, his to overrule: the line opens the creator directly.

**The Studio's end.** Rehome or delete `src/components/reel/`'s Studio pieces. `PosterCard` stays: the tile and four lab boards import it (`guest-capture`, `voice-guest`, `reel-cut`, `reel-front`), and every lab board must keep compiling. The lightbox's `ReelButton` goes (`media-lightbox-parts/actions.tsx`). The stored reel's guest card and overlay (`src/components/guest/guest-reel-*`) are deleted, with `build-reel-props` if nothing else reads it. `/dashboard/[eventId]/reel` keeps redirecting to the view (`reel-teardown` makes it read the platform lever). The host lane left three crumbs for the Studio's end: `RouteSkeleton`'s studio shape and its Library demo (`library/patterns/interactive-demos.tsx`), and `setReelGuestVisibleAction` in `dashboard/[eventId]/actions.ts` (it calls `queries/reel.ts`, which `reel-teardown` deletes after you merge); all three go with the Studio's publish pieces (`components/reel/publish-action.ts`).

**Neighbours running tonight.** `reel-teardown` deletes the stored reel's server side (`/api/reel/*`, `/admin/reels`, the old libraries, the limiter kinds) and merges after you; `reel-sweep` writes the words everywhere else and births `docs/systems/reel.md` from the facts you put in your Handoff (you own no system doc); `album-window` owns `src/components/shared/masonry`, `src/lib/shared/` pieces and `src/components/likes/`. The words: "Highlight reel", "clip", "Make your own", "Add to event". No telemetry for clips in v1.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` whole; the creator at 1440 and 375 with reduced motion honoured (localhost's canvas cannot read R2 without the guest lane's relay: headless Chrome with web security off, captures only); a clip encoded, shared and saved; Add to event lands one row with `reel_eligible = false` on a disposable event, which the album shows and the reel skips; a free event's clip carries the mark at 30 s; the greyed Make your own through a stubbed support check.

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
