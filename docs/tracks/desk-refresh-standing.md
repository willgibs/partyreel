---
track: desk-refresh-standing
status: handed-off            # open -> handed-off; deleted in the merge commit that integrates it
cut: "74794b60"            # the launch-prep SHA the branch was cut from
board: media-viewer
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/guest-capture/
  - src/app/(dev)/design/sandbox/host-curation/
  - src/app/(dev)/design/sandbox/export-flow/
  - src/app/(dev)/design/sandbox/identity-door/
  - src/app/(dev)/design/sandbox/voice-guest/
  - src/app/(dev)/design/sandbox/help-center/
  - src/app/(dev)/design/sandbox/media-viewer/
reads:                  # single-sources you depend on: never duplicate, never edit
  - CLAUDE.md
  - docs/PROGRAM.md
  - docs/reviews/media-viewer.json
  - docs/reviews/reel-front.json
  - src/components/shared/masonry.tsx
---

# lp/desk-refresh-standing

**Goal.** The standing boards Will's batch-1 answers reach, re-cut to them: the guest's upload tracker as a new question, the toast in place of the rejected badge, Save to Photos, the merged waiting count, the second-photo minimum, and media-viewer's second round on the own-item mark.

## The brief

**Will's answers on `media-viewer` round 1 (2026-09-24, verbatim, ask=option then his note):**
- `opening=grow`
- `holds=pills` "This is more of a selection on the floating UI versus tucking at the bottom. More visible in the lightbox. Additionally, it gives more room for longer guest names by stacking the actions. I'm still open to any redesign ideas, but of these, this is my favorite selection. Don't love our 'own photo' marker or placement."
- `who=face` "This is already a great step in the right direction of my previous note about redesigning the floating UI"
- `next=peek` "I almost selected the filmstrip, but I like this balance of a more focused lightbox with the quick ability to exit the lightbox and continue in the gallery. However, where we have more room on desktop lightboxes, a more subtle film strip may be cool to include."
- `closeup=pinch`
- `video=auto` "However, the sound icon will need to be moved based on a prior selection of moving the uploader credit chip. Video should also have at least a scrubber (right word for time control UI bar?) to control the video (to rewatch or skip to certain points)."
- `wayout=down` "Also clicking on any blank space around the media should close. At some point, I requested an agent to make the clickable sides larger (so it wasn't a small button for back/next) and now if I tap anywhere on the left or right side, it goes the neighboring media. Feels weird when I tap the empty space expecting a close."
- `link=file` "By default, share should send the picture itself, since it's the expected behavior. However, we could also include a 'copy link' share action that sends a link to the photograph, like in the option 2 demo. Multiple share options is good. Additionally, I noticed that when clicking download, there wasn't a clean flow to get media into my iPhone's native Photos library, just downloading to my Files app. Most users would likely prefer a priority option of native photo library (especially on mobile), with the rest as secondary options. We're not looking to reduce ways to download, just include the expected native way as the default."

**Will's answers on `reel-front` round 1 (2026-09-24, verbatim):**
- `tile=crossfade` "This allows us to control the design and ensure it stays less busy than a potentially super fast, distracting, overwhelming version. The different images differentiate the reel vs album media stills. However, I'd love to see other design ideas for this differentiation. This could be very polished/refined or taken in a better direction.."
- `verbs=watch-make` "However, since we have the event name in the header above, let's change the reel heading text to 'Highlight reel', and instead of having a 'Make your own' badge, replace the reel style and number of moments text beneath the new 'Highlight reel' heading with a 'Make your own clip to share' description. Guests don't need to see the reel style (likely don't even know what that is) or number of moments (the album beneath can have a subtle total items number label). 'The Reel' badge in top left could be replaced with something better."
- `states=nothing` "We don't necessarily need to fill that slot with a clear empty state UI or progression, especially to guests. It can simply be missing/nothing until minimum reached. However, in the host's event page, some sort of progression UI would be super helpful so they know how to unlock a reel for their event with it being such a core feature. Would be easy for a host to open an event with 1 image and think "where's my reel??". Could even drop the minimum to 2 so they bounce back and forth if that works with our engine."
- `yours=toast` "This toast is more clear than adjusting a reel label that may be scrolled past, but should likely be a more clear 'The host added your uploads' with a 'Watch reel' action if guests are deeper in the album but want to check it out immediately. The more generic 'The host added your uploads' intentionally avoids numbers in case all weren't, and to avoid having to update a live number in the toast so it simply appears once when at least 1+ guest media will be in the reel with moderation enabled. For moderated events, it'd likely also be nice to have some sort of UI (maybe a queue-esque modal or something opened by a floating icon button beside add photos or something) for guests to track either their upload batch's progress or approval status, so they aren't left wondering which images are in or where they are."
- `door=stills` "This feels a bit less busy and lets us potentially use a bit of motion in our welcome flow without clashing with a moving reel behind."
- `closed=plays`
- `hub=labelled` "However, let's add a more calm living thumbnail behind this card version as a full background with overlay to make the Reel card feel more alive than the rest."

**His rule for repeats (2026-09-24, verbatim):** "One contextual note from the repeats I encountered: one was substantially better than the other. If we do discover repeats, we should attempt to keep all options in play and, instead of removing one, merge options under the same question." And the program's own rule (`docs/PROGRAM.md` 6-7): stacked boards never overlap in what they ask; when a ruling reaches a question still open elsewhere, the question is adapted to the current context with every road that could still beat the current path kept open as an option, and only a question already solved at its best is removed.

**His answers are now givens on every drawing:**
- **The view** has a slim glass bar at rest that morphs into the dock; one top row of icons (play/pause, Include videos, Style, Hold, Show the code, Add yours as an icon) with "Make your own" as the single primary beneath; a top-left arrival chip that stacks into a short feed; full-bleed posture; a 3 s default hold adjustable in the dock; the event's code as a white plate bottom right ("Scan to add yours" plus the address); no event name on screen.
- **The view is the wall:** "Play on a screen" opens the same view with the code on and a one-tap Start.
- **The album's tile** is a slow crossfade headed "Highlight reel" and described "Make your own clip to share": no style name, no moment count, no corner badge. For guests it is absent below the minimum, which drops to TWO.
- **A moderated event's guest** gets a toast once: "The host added your uploads" with "Watch reel".
- **The media viewer** has a face-led credit top-left, the floating action capsule, the neighbours peeking, pinch, swipe-down, and Save to Photos first on a phone.

**How a board changes** (`docs/PROGRAM.md` "A round returns DECISIONS"; the Library's working rules):
- **The spec.** A board's questions live once, in its `spec.ts`. Every option is drawn, and a missing preview is a type error. Every frame of the reel is drawn by the real engine over the fixture album.
- **Rounds.** A board that already has his answers (a ledger in `docs/reviews/<id>.json`) opens its next round with the decided asks carried as givens. A board with none keeps round 1 and simply re-cuts its asks.
- **The stacking rule.** Before you finish, read every open ask on every standing board (`node usher/kit/board-card.mjs --desk`) and list in your Handoff each ask of yours beside the nearest open one elsewhere, with why they differ. No two open asks on the desk may repeat.
- **The gate** includes `pnpm lab:smoke` and `pnpm lab:demo --board <each board you touched>`. Capture every board at 1440 and 375 to your scratch directory.
- **Registration.** `registry.ts`, `boards.ts` and `touchpoints.ts`' `DESK_ORDER` are the Orchestrator's. A round bump lives in your board's own files; if a registry line truly must change, it is a single listed exception.

**What the standing boards become** (each round 1 unless noted; every option kept unless solved at its best; list every move under Questions as his to overrule):
- **`guest-capture`:**
  - **A new ask, the tracker he asked for:** "For moderated events, it'd likely also be nice to have some sort of UI (maybe a queue-esque modal or something opened by a floating icon button beside add photos or something) for guests to track either their upload batch's progress or approval status, so they aren't left wondering which images are in or where they are." Options: his floating button beside Add photos opening a queue sheet; the account menu's "Your photos" sheet (the road `identity-door.menu`'s `sheet` opens); inline states on the tiles themselves (the road `voice-guest.waiting` words). Draw each with uploads in flight, held, approved and refused, at 375.
  - **`moment`** is redrawn: his toast replaces the rejected "Yours is in it" badge, and every scene's tile wears his r1 tile, not reel-front's old recommendations.
- **`host-curation`:**
  - **`told`** gains "in her tracker".
  - **`count` leaves:** its options merge into `reel-host`'s merged `review` question (the `reel-refresh-host` lane carries them); remove the ask and say so in the board's header.
  - **`peek`'s `viewer`** is redrawn on his viewer picks.
  - **`verb`'s `chip`** comes off the own-tile mark he dislikes.
- **`export-flow`:** `phone` is re-argued for Save to Photos. A zip cannot enter Photos, so the options are a batch through the share sheet (which saves many images at once on iOS), the zip to Files, or both. The recommendation is re-argued from his note.
- **`identity-door` and `voice-guest`:** their contexts carry the tracker and the toast. `voice-guest.landed`'s overrule stops citing the rejected badge.
- **`help-center`:** its reel copy says the second photo, not the third ("Live from the second photo").
- **`media-viewer` round 2** (carry all eight r1 answers as decided): one ask, `mine`, the own-item mark's shape and place on the grid. His words: "Don't love our 'own photo' marker or placement." Four options drawn on the guest album at 375 and 1440, today's top-left glass dot (`masonry.tsx:189-242`, which also toggles the Yours filter) among them. In the viewer itself the credit already reads "You" on your own item (the wiring's call); say so in the context.

**Boundaries.** Only the seven sandbox folders. The reel boards are the two reel-refresh lanes'.

**Binds.** The bible and the policies (`/design/library`), the contracts of every component under a path you own, and
CLAUDE.md's working loop. A record doc
(`docs/STATUS.md`, `docs/ROADMAP.md`, `docs/PROGRAM.md`, `CLAUDE.md`, `docs/ASSETS.md`, `docs/tracks/orchestrator.md`,
`docs/reviews/`) is edited only when your `owns` names it. Stage explicitly; never `--no-verify` or force-push; every commit ends
with the `Co-Authored-By` line naming the model you actually run on.

**Verify on.** The board at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke --base http://localhost:<port>` whole; `pnpm lab:demo --board <board> --base http://localhost:<port>` pressing every step.

## Questions (a recommended answer each; the Orchestrator relays them)

- none: every open call below is drawn as an option on its own board (his to pick), not a blocking one-way door.

## System-doc edits (in place, owned facts only)

- none: no `docs/systems/` doc names a fact this lane's `owns` touches.

## Deferred (ROADMAP one-liners, bucket named)

- The lab and the kit: `touchpoints.ts`'s `RULINGS` summary line (the "ruled:" text `board-card.mjs` prints) is stale for `host-curation` (still lists "the count") and `media-viewer` (still lists all eight round-1 asks); a hand-written text refresh at integration, no code change, since `touchpoints.ts` is the Orchestrator's.

## Handoff (replaces the chat report)

- Work commit `08056d2f` ("desk re-cut: the standing boards batch 1 reaches, media-viewer round 2"), pushed to `origin/lp/desk-refresh-standing`. No sync commit: `origin/launch-prep` was at `0ab6b0fe` at boot and stayed there through hand-off (`git merge-base --is-ancestor origin/launch-prep HEAD` holds).
- Gates on the synced tree (== the work tree; nothing to sync), each its own exit code, all `0`: `pnpm design:rules` (unchanged output: no contract/policy under my `owns`); `node "src/app/(dev)/design/gallery/collect-specimens.mjs"` (unchanged); `pnpm typecheck`; `pnpm lint` (0 errors; the 6 pre-existing warnings are all outside my `owns`, none mine); `pnpm test` (431 files, 4700 passed, 1 skipped: the 1 originally-failing `no-em-dash-policy` catch on my own new `export-flow` copy is fixed, recast without the dash); `pnpm build` (clean, `rm -rf .next` first); `pnpm lab:smoke --base http://localhost:3135` (501 checks, 0 failing, every touched board's reading under its 1200-word budget: guest-capture 338, host-curation 415, export-flow 623, identity-door 310, voice-guest 615, help-center 403, media-viewer 127); `pnpm lab:demo --board <each> --base http://localhost:3135` for all seven, each "0 failing" and "Every step draws its options" (guest-capture 5 steps, host-curation 7, export-flow 7, identity-door 5, voice-guest 7, help-center 7, media-viewer 1).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` lists 24 files, all seven owned prefixes, no exceptions (`export-flow/{board.tsx,spec.ts,surfaces.tsx}`, `guest-capture/{board.tsx,fixtures.ts,parts.tsx,scene.tsx,spec.ts}`, `help-center/{fixtures.ts,spec.ts}`, `host-curation/{board.tsx,fixtures.ts,queue.tsx,signals.tsx,spec.ts}`, `identity-door/spec.ts`, `media-viewer/{board.tsx,board-r1.tsx (new),fixtures.ts,page-parts.tsx,spec.ts}`, `voice-guest/{board.tsx,scene.tsx,spec.ts}`).
- The items, one line each:
  - `guest-capture`: added the `tracker` ask (his own idea, verbatim, at a moderated event): three options (a floating button's queue sheet; identity-door.menu's sheet grown; the status inline on her tiles, voice-guest.waiting's words), each drawn with all four states (sending, held, approved, refused) in one 375 frame; `moment`'s context drops "Yours is in it"; every scene's `ReelTile` now wears reel-front r1 (headed "Highlight reel", described "Make your own clip to share", no meta line, no badge) and is absent below his dropped minimum of two.
  - `host-curation`: removed the `count` ask (merging to `reel-host`'s review question, per his merge rule) and its now-dead fixtures (`EVENTS`/`BELL`/`PENDING_TOTAL`); `told`'s `line` option now names "her tracker"; `peek`'s `viewer` option redrawn on media-viewer r1 (a face-led credit top-left, no "i of N", neighbours peeking at the edges, the actions split into two stacked pills, Save/Share/Remove above Hide/Approve); `verb`'s `chip` option grows the amber corner's own pill into a "Hidden" label instead of a second chip on the own-item mark's corner.
  - `export-flow`: `phone` re-argued from his Save-to-Photos note: `zip` (renamed from `files`), `batch` (every file to the share sheet at once, Photos first, no zip), `both` (recommended: the sheet's own button saves to Photos, a quiet line still offers the zip to Files); `ShareSheet` grew an optional `photos` count that leads its rows with "Save N Photos".
  - `identity-door`: `menu`'s context now names `guest-capture`'s tracker ask as the neighbour that may grow its `sheet` option.
  - `voice-guest`: `waiting`'s context names the tracker; `landed`'s context and overrule drop "Yours is in it" for the toast; `ReelTile` simplified to a zero-prop component wearing reel-front r1 (no count, no `yours` chip) and `AlbumGround` dropped its now-meaningless `reel` prop (four call sites in `board.tsx` updated).
  - `help-center`: the reel category's blurb now reads "Live from the second photo, on a screen, and yours to cut."
  - `media-viewer` round 2: `asks` reduced to one, `mine` (round 1's eight are answered, `docs/reviews/media-viewer.json`, and landing via `media-viewer-wiring`); four options: `dot` (today, shipped, kept for comparison), `label` (same corner, worded), `ring` (recommended: no corner glyph, a soft accent ring on the whole tile), `none` (nothing on the tile, the standing Yours control and the viewer's own "You" credit carry it), drawn on the real 26-item album at 375 with 1440 on the knob, three tiles marked (the same guest `MINE_AT` already named). Round one's own preview code (867 lines: `openingScreen` through `linkScreen`, every measure reader, `Probe`/`Screen`/`OriginPage`) moved verbatim, unimported, to the new `board-r1.tsx`, following `site-chrome`'s own precedent at its round two (`chrome.tsx`/`menu.tsx`, unimported since that board's round two); `board.tsx` is rewritten lean for `mine` alone; `page-parts.tsx`'s `LabMasonry`/`AlbumPage` grew optional `mineIds`/`mineStyle`/`scrolled` props, additive, every other caller unaffected.
- The stacking rule (`node usher/kit/board-card.mjs --desk`, then per-board cards for all seven mine plus the six reel boards): no open ask repeats. Nearest neighbours, and why they differ:
  - `guest-capture.tracker` vs `reel-host.review` (unedited by me; per `reel-refresh-host`'s manifest, a HOST surface for "does anything tell the host waiting uploads aren't in the reel"): mine is the GUEST's own batch status; different audience, not a repeat.
  - `export-flow.phone` vs `reel-cut.finish` (unedited by me; per `reel-refresh-cut`'s manifest, draws Save as "Save to Photos" for the on-device CUT): both answer his one Save-to-Photos note, but for different artifacts: a single rendered video (trivial `<a download>`/share) versus a bulk album (needing a zip or a many-file share-sheet batch); not a repeat.
  - `media-viewer.mine` vs `reel-cut.mark` ("the free mark", unedited by me, almost certainly the free tier's export watermark): a naming coincidence only, unrelated concepts.
  - `host-curation.told` vs `reel-front.yours` (already answered `toast`, not open): complementary and already cross-referenced in `told`'s own context (refusal-silence vs approval-toast).
- Assets requested from Will: none.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Calls his to overrule, one line each:
  - `guest-capture.tracker` is drawn on a SEPARATE moderated-event fixture (`TRACKER_ITEMS`, four rows) rather than switching Maya's whole open wedding to Review-on, since every other ask on this board depends on that wedding staying open; if he'd rather see the tracker live on the SAME open wedding turned moderated, that is a rebuild of the board's shared ground, not this ask alone.
  - `guest-capture.tracker` has no 1440 variant (phone only, mirroring `export-flow.phone`'s own precedent: a guest's own status check is a party-phone act); say so if a host-side or laptop guest case should see it too.
  - `media-viewer` round 2 drops round one's eight asks from `asks` entirely rather than carrying them forward inert; this follows `site-chrome`'s own precedent (its round two did the same to its other seven), but it is a structural call about how a multi-round board's spec stays typed, not a design one.
  - `media-viewer.mine`'s three marked tiles reuse the fixture's own pre-named "one this device added" guest (`MINE_AT`, index 5 → Nina) rather than Priya (who this board's `who` ask already used for a different purpose); no other guest was pre-wired for it.
  - `host-curation.verb`'s `chip` option now grows the SAME top-right amber pill into a wider "Hidden" label rather than inventing a fourth corner; the tile's only two free corners are already the play/like marks' and the own-item mark's, so a second glyph had nowhere else to stand without crowding a corner `media-viewer` round 2 is actively redrawing.
- Look at first: `guest-capture` → `tracker` (all three options, each drawn with all four states in one frame); `host-curation` → `peek.viewer` (the face-led credit, the peeking neighbours, the two stacked pills) and `verb.chip` (the grown amber pill); `export-flow` → `phone.both` (the sheet's own two-button foot) and `phone.batch` (the share sheet's "Save N Photos" leading its rows); `media-viewer` → `mine` (all four options, the `ring` recommendation especially, against the shipped `dot`).
