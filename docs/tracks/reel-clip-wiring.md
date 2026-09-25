---
track: reel-clip-wiring
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
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

Every one is built as recommended and is Will's to overrule; none is a one-way door.
- **What "the cap moves into the encoder as a constant" means.** Built: `MAX_ENCODE_SECONDS` in `engine/encode.ts`
  (the longest plan's cap plus a 20 s style tail, 80 s), refused before a byte is decoded
  (`encode-ceiling.test.ts`). `client-encode-budget.ts` keeps serving `render-service.ts` (reel-teardown's) and goes
  when its last reader does (Deferred).
- **A clip's Length is fitted on each look's own clock**, not `buildReelProps`'s mood-timeline cap: capped that way
  Layered parallax at a free 0:30 runs 0:37 and Scattered prints at 1:00 stops at 0:17 (`clip-selection.ts`).
- **The owner's Add to event goes through the host route whenever her plan takes video, uploads open or closed**
  (that route is exempt from `accepting_uploads`, as her Add photos is); a guest's rides the seam, null while
  uploads are closed.
- **Show on a hidden photograph un-hides it for everyone (the lightbox's own Show) and adds it to the clip**, with no
  confirm (reversible from the album); "It's back in the album" says so.
- **Make another starts from the reel's next take** (a fresh handful), keeping the look, length and layout; Back to
  editing keeps the picks.
- **Looks opens first; the tile's line opens the creator directly** (the Orchestrator's two calls, as briefed).
- **The glyph's disc is the house glass mark** (`GLASS_MARK`, the play badge's material), not the board's flat
  black at 55 percent: one material everywhere.
- **A guest's mark line is words only** (she cannot upgrade the host's event); the host's "Remove it with Pro" opens
  the in-app pricing sheet (the host app never links to /pricing).
- **In a hand the order strip lives in the Moments tab** (focused views: the order is chosen with the moments); the
  tray stays at the foot.
- **Share appears only where the sheet takes the very file**; elsewhere (desktop Firefox) Save leads in violet.
- **A guest's Added means handed to the album's upload queue** (its own progress and failure sheet carry the rest);
  the host's reads "Adding N%" until her upload lands.
- **Escape is one step back**: making cancels, the finish goes back to editing, the bench goes back to the reel.
- **A landscape clip's wall is three columns at a laptop, two in a hand** (portrait keeps five in three rows).

## System-doc edits (in place, owned facts only)

- none: this lane owns no system doc; the facts for `docs/systems/reel.md` are under the Handoff for `reel-sweep`.

## Deferred (ROADMAP one-liners, bucket named)

- Now: a guest's Add to event in the creator follows its queue item (uploading, held for review, refused) instead of
  reading Added on hand-off.
- Now: `buildReelProps` caps on the mood timeline, so a treatment runs past or short of its length; the lab's
  builders could share the clip's own-clock fit (`clip-selection.ts`).
- Now: `client-encode-budget.ts` and its test leave when reel-teardown deletes `render-service.ts`, its last reader.
- Now: the Studio's reveal leftovers outside this lane, unreferenced now: `globals.css`'s `--tune-rvl-*` and
  `--tune-rxp-*` block and its `[data-rvl-*]` rules, `src/lib/shared/use-reveal-acts.ts` with its test, and the
  comments naming `reveal-constants.ts` (`globals.css`, `motion-tuner-config.ts`, `design-system.md`).
- Now: `readEventMedia` takes a hidden slice, so the clip's hidden read stops reading the whole album.

## Handoff (replaces the chat report)

- **Commits, pushed**: `1352aba3` (the work), `6220f92e` (the help exception, droppable), then this manifest (the
  head in the chat line). launch-prep moved (mark-r3, story-r2, album-pages, door-r2 merged); none touches a read or
  a file of this lane and `git merge-tree` against `origin/launch-prep` is clean, so no sync (PROGRAM's rule).
- **Gates on `6220f92e`, each on its own exit code**: `pnpm typecheck` 0; `pnpm lint` 0 (6 warnings, none in a touched
  file); `pnpm test` 0 (452 files, 4,925 tests); `zsh scripts/build-lock.sh pnpm build` 0; `pnpm lab:smoke --base
  http://localhost:3131` 0 (276 checks, 0 failing). No board, so no `lab:demo`.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`, 63 paths): all under `owns` but three
  exceptions. `src/components/guest/event-experience.tsx`, one line (`eventName={event.name}` on `LiveReel`: the room
  leads with the event's name and the confirm names it). `src/app/(dev)/design/touchpoints.ts`, the `lives` of the
  reel-front, reel-view and reel-cut rows (`links.test.ts` requires every `lives` file on disk; they named Studio
  files). `content/help/` six stored-reel articles, 20 `<UiLabel>` pins unwrapped, words kept (`help-ui-labels.test`
  pins labels to shipped strings, and the Studio's end removes them): reel-sweep retires these articles, wins any
  conflict, and `6220f92e` drops cleanly if sweep lands first.
- **The creator** (`src/components/reel/clip-*.tsx`, `ClipCreator`), as reel-cut r1 and r2 settled, captured at 1440
  and 375 in headless Chrome with web security off (captures only), every file below in
  `/private/tmp/claude-501/-Users-gibby-local-ai-partyreel/401f4a77-be99-4a42-82f6-e5fac8e4a4c5/scratchpad/reel-clip-wiring/shots/`:
  `creator-1440-looks.png`, `creator-1440-moments.png`, `creator-1440-making.png`, `creator-1440-finish.png`,
  `creator-1440-confirm.png`, `creator-1440-landscape.png`, `creator-375-looks.png`, `creator-375b-moments.png`,
  `makingcheck.png` (375 making), `creator-375-finish.png`. Reduced motion: the clip rests on its still with Play
  (`creator-1440-reduced.png`); the finished file shows controls, no autoplay.
- **The engine and the file**: a 30.1 s 1080x1920 mp4 (22.4 MB) encoded in 3.1 s in headless Chrome; Share handed the
  sheet the real file (name, `video/mp4`, 22,440,731 bytes; the sheet recorded, since headless Chrome draws none) and
  read Shared; Save downloaded
  `reel-lane-probe-disposable-clip.mp4` (22,440,731 bytes on disk) and read Saved, both on the finish
  (`sharesave-done.png`). A backgrounded tab pauses the encode and says so; Cancel returns with the picks kept; any
  failure lands on Retry and reports `clip: encode failed` (area `reel`) once (`clip-encode.test.tsx`,
  `clip-creator.test.tsx`).
- **Add to event, live on a disposable event**: a guest's clip on "Reel lane probe (disposable)" went presign 200, R2
  PUT (original and the drawn poster) 200, complete 200; row `6b80f7c8-25bb-4c66-a916-2d5de4e17dca` is `video`,
  `approved`, `reel_eligible = false`, 22,440,731 bytes, by a guest, with a preview. The album counted 15 and drew
  it; the tile's stills and the creator's pool (14) skip it (`addflow-album.png`).
- **A free event's clip carries the mark at 30 s**: no free event with photos exists (hi@willgibs.com's one event is
  empty and the free plan's event cap refused a second), so the gallery poll's facts were rewritten in the test
  browser only to `clipFactsForTier("free")`: the mark line showed, Add to event left, Everything under Layered
  parallax fitted 10 moments in 0:28 ("4 moments don't fit in 0:30"), and the 28.3 s file carries the partyreel.com
  lockup (`free-1440-bench.png`, `free-frame-corner.png`).
- **No encoder** (`VideoEncoder` deleted before load): the view keeps Make your own greyed, the tile's line opens the
  view with the reason bubbled over the dock (`noencode-1440.png`, `noencode-375.png`).
- **The tile** (`reel-front`): the 24px glyph at 10px, the violet line under Highlight reel, only with a creator
  (`album-1440-tile-zoom.png`).
- **The Studio's end**: 19 files under `src/components/reel/`, `guest-reel-card.tsx`, `guest-reel-overlay.tsx`, the
  lightbox's `ReelButton`, RouteSkeleton's studio shape and its Library demo, `setReelGuestVisibleAction` (its RPC is
  in the drop migration). `build-reel-props.ts` stays (six lab boards, the parity tool, the marketing switcher
  and the clip itself read it); `PosterCard` stays, `PosterCardChip` gone (its only reader left).
- **Facts for `docs/systems/reel.md`** (reel-sweep): the creator is `components/reel/clip-creator.tsx`, registered
  lazily through `guest/reel/creator-seam.ts` (the album carries none of it; mediabunny arrives with the first Make
  it or an idle warm-up). Its pool is the reel's (`isReelEligible`), so a clip is never cut from clips; the fills are
  the reel's picks (loop 0's take capped to the length), Only mine (a guest's `ownIds`, the owner's `isHost`) and
  Everything. Length is Auto (the plan's cap) or 15, 30, 60 under it, fitted on the look's own clock; the encoder
  refuses anything past 80 s. The mark, the cap and whether video may go back are `ClipFacts`. A guest's Add to event
  is the page's queue (`create_media`, `p_reel_eligible => false`, moderated, the paid-only video gate); the host's
  is `lib/reel/clip-add.ts` over `/api/host/r2/*` (approved, metered on her storage). The owner's hidden photographs
  come from `lib/reel/clip-hidden-action.ts` (owner-only, `getUser()` then RLS; Show is `setMediaStatus` to approved,
  no revalidation). Without WebCodecs the door stays greyed and explains on a tap (`lib/reel/clip-support.ts`).
  Clips carry no sound and no telemetry; an encode failure reports once to Sentry.
- **Test data left** (disposable, for the reset): guest rows named Clip Tester (several runs), Clip Adder, Skip Checker, Free
  Maker, Share Saver and Making Checker, and the clip row above, all on "Reel lane probe (disposable)".
- Assets requested from Will: none.
- **Board ideas**: in a hand the clip could dock small beside the order strip while the Moments view scrolls (the
  column direction's own second moment); the fills could carry their counts ("Only mine · 3") so an empty one says
  why before a tap.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- **Calls his to overrule**: the thirteen under Questions.
- **Look at first, on the alias** (what localhost could not drive): an iPhone's Save to Photos and Share for a clip
  (the sheet's Save Video); the host's own Add to event and Hidden · Show, signed in as willg97 through the chooser
  ("Personal Testing Throwaway" holds one hidden photo); a real free event's clip, if Will gives hi@willgibs.com's
  event a few photos.
