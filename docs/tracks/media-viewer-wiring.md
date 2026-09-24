---
track: media-viewer-wiring
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "74794b60"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/shared/media-lightbox
  - src/components/shared/masonry
  - src/components/shared/unverified-mark
  - src/lib/media/share-save
  - src/components/admin/moderation-grid
reads:                  # single-sources you depend on: never duplicate, never edit
  - CLAUDE.md
  - docs/reviews/media-viewer.json
  - src/app/(dev)/design/sandbox/media-viewer/spec.ts
  - docs/systems/guest-flow.md
  - docs/systems/design-system.md
  - src/components/guest/live-gallery.tsx
  - src/components/app/host-media-grid.tsx
---

# lp/media-viewer-wiring

**Goal.** The media viewer as Will ruled it: it grows from where it opened, a face-led credit, the floating action capsule, the neighbours peeking (a subtle filmstrip at desktop), pinch, videos that play with a scrubber, swipe-down and a blank tap to close, the photograph's own address, Share that sends the file, and Save that reaches the phone's Photos library first.

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

**Where things stand.** Batch 1 of his desk review is transcribed (`docs/reviews/media-viewer.json`, `reel-view.json`, `reel-front.json`, `reel-screen.json`); the plan's head (the Orchestrator's) names five lanes: `media-viewer-wiring`, `reel-guest-wiring`, `reel-refresh-host`, `reel-refresh-cut`, `desk-refresh-standing`. The live reel's data model is applied on the live database and in `src/lib/db/types.ts`: `events.show_reel` (default true) and `events.reel_style_id` (null = the default mood), host-written by column grant; `media.reel_eligible` (true on every row, false only for a cut saved to the album; write-once at `create_media*`, which take `p_reel_eligible boolean default true`); `get_event_media_by_qr_token` returns `reel_eligible`; `get_event_by_qr_token` returns `show_reel` and `reel_style_id`; `ops_flags.live_reel_enabled` (true). The stored reel's tables and RPCs still exist until the drop migration after the round's red-team. The engine lanes' work is on the tree: the live composer (`src/lib/reel/live/`), `player-live.tsx`, the video window reader (`src/lib/reel/engine/video/`), harnesses at `/design/lab/tools/reel-live` and `/design/lab/tools/reel-video`.

**The component today** (one shared file; every surface only passes props):
- **The files.** `src/components/shared/media-lightbox.tsx` (1,041 lines), with the lazy wrapper `media-lightbox.lazy.tsx:26-44` and the pins in `media-lightbox.test.tsx`.
- **Importers:** `src/components/shared/masonry.tsx:648-676` (it stores the open item by id) and `src/components/admin/moderation-grid.tsx:176-181` (it stores a plain index).
- **Surfaces through `MasonryColumns`:**
  - the guest album (`live-gallery.tsx:924-947` → `guest-masonry.tsx:137-148`: `shareUrl`, `onDeleteItem`, `canDelete`, `mineIds`);
  - the host feed (`host-media-grid.tsx:452-470`: `viewerIsHost`, `shareUrl`, `onSetStatus`, `onRemove`);
  - the host's Deleted bin (`recently-deleted-grid.tsx:196`, no download URL);
  - the profile's uploads and likes (`my-uploads-gallery.tsx:53`, `my-likes-gallery.tsx:57`);
  - admin.
- **Behaviour now:**
  - **Opening:** a 100 ms fade (`:686-695`).
  - **Credit:** `AttributionPill` (`:140-230`: name, Unverified mark, Host badge, "i of N", the host-only email) sits bottom-centre under the action capsule (`:1008-1032`).
  - **Actions:** one bottom-centre capsule (`:791-1006`): Like, the host's like count, Save (`<a download>`, `:815-826`), Share (`navigator.share({ url: shareUrl })` with a clipboard fallback, `:593-606`), Delete. The host's group adds Add to reel, Approve, Show/Hide and Remove.
  - **Next and previous:** chevrons inside 30%-wide side zones (`:727-741`, `:767-781`). A blank tap in the left or right 30% navigates and the centre third closes (`:572-590`, pinned at `:284-328`).
  - **Gestures:** a horizontal swipe with the neighbours peeking (`:439-566`); a vertical move goes back to the browser, so there is no swipe-down. There is no pinch: `touch-pan-y` at `:749` blocks it.
  - **Video:** native controls, no autoplay (`:347-361`).
- **The own-item mark** is on the grid, not in the viewer: `MineMark` (`masonry.tsx:189-242`), a top-left dot toggling the Yours filter.

**Build (◇ marks a call the Orchestrator took inside his answers; list each under Questions as his to overrule):**
1. **Opening `grow`:** out of its tile, the tile expands to fill the screen; opened from the reel, the frame lets go of its crop. Closing puts it back in either. It takes a new optional `origin` prop: the source rect and its kind (`tile` or `reel`). Reduced motion keeps a fade.
2. **Chrome:**
   - The floating action capsule stays (his `pills`, as wired), stacked apart from the credit so a long name has room.
   - The credit is face-led at the top-left (`who=face`): the face or plain disc, the name, the Unverified mark, and a door to the person's page where one exists. The host still sees the proved email under the name, and a typed name gets no door.
   - ◇ The "i of N" counter goes; the neighbours say there is more.
   - ◇ On your own item the credit reads "You" (with your face), and no separate mark appears in the viewer.
   - Leave `MineMark` on the grid as it is: `media-viewer` round 2 asks about its shape and place.
3. **Next `peek`:**
   - A sliver of the one before and the one after: 28 px at 375, 96 px at 1440.
   - Tapping a sliver goes there, and the arrow keys step.
   - ◇ At desktop widths a subtle filmstrip (his "may be cool"), restrained and absent on touch and on narrow screens.
4. **Close-up `pinch`:**
   - Two fingers scale in place up to 3x, one finger pans, and letting go under fit settles back.
   - Zoomed in, one finger pans; only at fit size does a vertical drag start the swipe-down.
   - Replace `touch-pan-y` deliberately, with scroll behind the dialog locked.
5. **Video `auto`:**
   - Plays muted and looping the moment it is on screen. Opened from the reel with the new optional `startAt` (seconds), it carries on from the reel's moment.
   - One tap for sound; ◇ the sound toggle moves into the action capsule, out of the credit's corner.
   - A thin custom scrubber for seeking (his note) replaces the browser's bar.
   - A video still pauses when you navigate away.
6. **Way out `down`:**
   - The photograph follows the finger down and drops into its tile, or back into the reel's frame; the close circle stays for a mouse.
   - A tap on blank space around the media closes.
   - ◇ The 30% side zones that navigate on a blank tap go. Next and previous are the swipe, a tap on a peeking sliver, the arrow keys, and at desktop hover chevrons and the filmstrip.
   - Change the pins at `media-lightbox.test.tsx:284-328` deliberately and list each change.
7. **Share and save** (`link=file` plus his notes), in a new helper `src/lib/media/share-save.ts` with pure tests over mocked `navigator`s:
   - **The address.** Opening a photograph writes `?photo=<id>` beside the album link's other params with `history.replaceState` (Next 16 integrates it with the router; check the docs), so a refresh returns to it. `masonry.tsx` reads it on load and opens that item.
   - **Access stays exactly as it is.**
     - The address opens only an item already in the viewer's payload.
     - An unknown, held or hidden id opens the album plainly, with no error and no sign the item exists.
     - Behind a door, the door comes first (the page never renders the album before the gate lets it).
   - **Share** sends the file itself on its tap (`navigator.share({ files: [file] })` after `navigator.canShare({ files })` with the real file). It falls back to sharing the link, then to copying it.
   - **Copy link** is its own action beside Share. It shows only on approved items and always copies the PUBLIC album link with `?photo=` (never a dashboard URL).
   - **Save follows the platform.**
     - On iOS the system sheet with the file is the only web path into the Photos library (its "Save Image" or "Save Video"). Save there offers "Save to Photos" first and "Download file" second.
     - On Android a normal download already lands in the gallery.
     - Desktop downloads.
   - ◇ **Fetching.**
     - The file is fetched on the first tap of Share or Save, never prefetched on a swipe.
     - If the tap's user activation lapses while it loads (iOS refuses `share()` without one), the button becomes a one-tap "Ready" rather than failing.
     - A video over a size cap (state the cap) skips the file path and downloads.
   - Delete (own items), the host's actions and their confirms keep their behaviour. The "Add to reel" button stays until the reel teardown lane removes it.
8. **Access and motion:**
   - Every control is labelled and every hover target has a tooltip.
   - Escape closes and focus returns to the tile.
   - Motion follows the Library and `emil-design-eng`: custom easing, under 300 ms, press feedback.

**Look at first (your Handoff):**
- The viewer at 375 and 1440 on the guest album of the scale probe. Localhost reads the real database, so `/e/d02631f1bfb3455188d224e41bf9510f` needs no sign-in; capture the credit, the peek, the filmstrip, a video and the save sheet.
- The gesture pins you changed, each with its reason.
- The address cases: refresh returns; a held id opens the album plainly.
- The share-save helper's tests.
- The host feed and admin can't be signed in locally, so prove them with component tests.

**Boundaries.**
- The guest album page and its components (`src/components/guest/`, `src/app/(guest)/`) are `reel-guest-wiring`'s. It also owns the unfurl card for `?photo=` (its `generateMetadata`).
- The host app (`src/app/(app)/`, `src/components/app/`) is untouched, apart from props you add as optional, which the old callers keep working without.
- `docs/systems/guest-flow.md` is `reel-guest-wiring`'s: put the Lightbox section's new text (it sits at `:189-203`) in your Handoff as the lines to change, and the Orchestrator applies it at your merge.
- Never `src/lib/db/types.ts`, a migration or a live write.
- You integrate first. Announce the `origin` and `startAt` props in your Handoff, because the reel's tap passes them.

**Binds.** The bible and the policies (`/design/library`), the contracts of every component under a path you own, and
CLAUDE.md's working loop. A record doc
(`docs/STATUS.md`, `docs/ROADMAP.md`, `docs/PROGRAM.md`, `CLAUDE.md`, `docs/ASSETS.md`, `docs/tracks/orchestrator.md`,
`docs/reviews/`) is edited only when your `owns` names it. Stage explicitly; never `--no-verify` or force-push; every commit ends
with the `Co-Authored-By` line naming the model you actually run on.

**Verify on.** The gate on the synced tree, each step on its own exit code: `pnpm design:rules`, `node "src/app/(dev)/design/gallery/collect-specimens.mjs"`, `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm lab:smoke --base http://localhost:<port>`; the surfaces the Handoff is judged on, local at 1440 and 375.

## Questions (a recommended answer each; the Orchestrator relays them)

Every call taken is built; none blocks the merge. ◇ = the Orchestrator's call inside his answers, ● = mine.
- ◇ The "i of N" counter went; the neighbours say there is more (a screen reader still hears "Photo 2 of 3" as the dialog's name). Recommended: keep.
- ◇ On your own upload the credit reads "You", with no separate mark in the viewer (the Unverified mark stays beside "You": it is your way out). Recommended: keep.
- ◇ A subtle filmstrip at a desk: 15 small frames at the foot, below the capsule, the current one lifted; only for a fine pointer on a window of 1024+. Recommended: keep.
- ◇ The sound toggle lives in the capsule (first, behind a hairline). ● The alternative is the clip's transport row, where every player keeps it and where a photograph-to-clip swipe would not change the capsule's width. Recommended: keep the capsule (his note asked it out of the credit's corner; both do that).
- ◇ The 30% side zones went: next and previous are the swipe, a tap on a sliver, the arrows, and at a desk hover chevrons and the filmstrip. Recommended: keep.
- ◇ The file is fetched on the tap, never prefetched; a lapsed tap leaves a one-tap "Ready"; ● the cap is 100 MB (the product's own multipart line): over it, Share falls back to the link and Save to Photos to the plain download. Recommended: keep 100 MB.
- ● Double-tap (and double-click) zooms 2.5x at the point and back, and a trackpad's pinch (ctrl+wheel) zooms on a desk, beside the ruled two-finger pinch; a clip never zooms. Recommended: keep.
- ● A tap on a clip plays or pauses it; Space or K does too. Recommended: keep.
- ● The pull down leaves past 14% of the screen's height or on a flick (0.35 px/ms past 24 px); the photograph shrinks to 0.75 and the ground thins as it goes. Recommended: keep, tune on his phone.
- ● `?photo=` uses replaceState (his brief): the phone's Back leaves the album rather than closing the viewer. Recommended: keep for now; Back-closes-the-viewer (pushState) is a Deferred line.
- ● An open photograph wears `--radius-tile` (4 px, bible 8) instead of `rounded-md`, so the flight keeps one corner from tile to rest. Recommended: keep.
- ● A small old file is still never enlarged past its own pixels (the shipped rule), so the scale probe's 320 px stills sit small at 1440. Recommended: keep.
- ● The credit's face and door wait on data no payload carries (see Deferred): today every credit draws the plain disc, and no credit is a door yet. Recommended: a small data lane adds `uploaderFace` server-side.

## System-doc edits (in place, owned facts only)

- `docs/systems/design-system.md` "The album tile": a new bullet, a tap hands the viewer the tile's rect and a way back (`data-media-id`), and the open photograph rides `?photo=`.
- `docs/systems/design-system.md` craft rules: "Two" became "Three", the third being the tooltip-arrow tap loss and the chrome's touch-pointerdown guard.
- `docs/systems/design-system.md` behaviour pins: the jsdom note rewritten (play/pause spies and `animate` recorders pin the pause on moving on, the grow and the drop), plus the radix Portal one-commit-late landmine.
- `docs/systems/uploads-and-r2.md` no-store landmine: the viewer's Share and Save to Photos (`lib/media/share-save.ts`) named beside the reel engine's two CORS consumers.
- `docs/systems/guest-flow.md` is `reel-guest-wiring`'s: its Lightbox bullet (`:189-203`) is replaced by the text in the Handoff below, for the Orchestrator to apply at the merge.

## Deferred (ROADMAP one-liners, bucket named)

- Identity: the viewer's credit takes a face and a door from `uploaderFace` (`avatarUrl`, `seed` from `seedFor`, `href` `/u/<slug>`), which `getUploaderIdentities` and the item mappers do not yet resolve; `media-lightbox-parts/credit.tsx` is the seam (its `ViewerMedia` type folds into GridMedia then).
- Launch checks: Share the file and Save to Photos can only be proved on the alias or prod with a real iPhone: R2 answers CORS for `https://partyreel.com` and the alias, never localhost (measured with curl and an `Origin` header), so a local Share falls back to the link.
- Design system: `ui/tooltip`'s arrow at `sideOffset` 0 plus radix's open-on-focus loses a touch tap on any tooltip-wrapped control on Android Chrome; the viewer guards its own chrome, a shared fix (a `sideOffset`, or no focus-open after touch) belongs to `ui/tooltip` or `ActionTooltip`.
- Guest album: the phone's Back closes the open photograph (pushState and popstate) instead of leaving the album.

## Handoff (replaces the chat report)

- **Commits:** the work `e71c872a`, the sync merge `4c0f5c56` (origin/launch-prep at `5e4f461e`: desk-refresh-standing and reel-refresh-cut merged, lab boards and manifests only, no conflict), and `efe73976` (the rules artifact regenerated on the synced tree: the pins' line numbers after formatting). All pushed.
- **Gates on the synced tree** (logs in the scratch dir `/private/tmp/claude-501/-Users-gibby-local-ai-partyreel/401f4a77-be99-4a42-82f6-e5fac8e4a4c5/scratchpad/media-viewer-wiring/gate-*.log`): `pnpm design:rules` 0 · `collect-specimens.mjs` 0 · `pnpm typecheck` 0 · `pnpm lint` 0 (7 warnings, none in a file this lane touched) · `pnpm test` 0 (434 files, 4781 passed, 1 skipped) · `pnpm build` 0 · `pnpm lab:smoke --base http://localhost:3131` 0 (501 checks, 0 failing). No board, so no `lab:demo`.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`):
  ```
  docs/design/library.md
  docs/systems/design-system.md
  docs/systems/uploads-and-r2.md
  src/app/(dev)/design/rules/rules.generated.json
  src/components/admin/moderation-grid.test.tsx
  src/components/admin/moderation-grid.tsx
  src/components/shared/masonry.test.tsx
  src/components/shared/masonry.tsx
  src/components/shared/media-lightbox-parts/actions.tsx
  src/components/shared/media-lightbox-parts/credit.tsx
  src/components/shared/media-lightbox-parts/filmstrip.tsx
  src/components/shared/media-lightbox-parts/geometry.test.ts
  src/components/shared/media-lightbox-parts/geometry.ts
  src/components/shared/media-lightbox-parts/video.tsx
  src/components/shared/media-lightbox.css
  src/components/shared/media-lightbox.test.tsx
  src/components/shared/media-lightbox.tsx
  src/lib/media/share-save.test.ts
  src/lib/media/share-save.ts
  ```
  Exceptions: `docs/design/library.md` and `rules.generated.json` are generated by the gate's `pnpm design:rules` (the lightbox and masonry contract titles changed; the lightbox test now names `media-lightbox.tsx` as a second `@contract-for` target, so its pins list under the viewer as well as the mark); the two `docs/systems/` files are listed above. New files live in `media-lightbox-parts/`, a subdirectory, so the component index needs no new `for` lines.
- **Items:**
  - Grow: the photograph flies out of its tile (WAAPI, the tile's crop and corner to rest, 280 ms on `--ease-drawer`, the ground fading in step, the chrome after the landing) and drops back into the tile of whichever photograph shows at close (220 ms, from wherever it is seen: mid-pull, pinched, mid-flight), scrolling that tile into view first; focus returns to it. Reduced motion fades. New optional prop `origin`.
  - Credit: face-led, top left (`media-lightbox-parts/credit.tsx`): the disc and name, the mark, "You", the host's proved address, the Host badge, a door only where `uploaderFace.href` exists and never behind a typed name, the event line on the personal feed.
  - Capsule (`actions.tsx`): Like, the host's count, Save, Share, Copy link, Delete, the curate group with Add to reel; a clip's sound first; an empty capsule hides.
  - Peek: 28 px at 375, 96 at 1440, linear between (`geometry.ts`, proved in `geometry.test.ts`: the sliver, one-to-one follow, nothing moving at the swap, an even gap); unknown sizes keep today's full-width swipe (so the old physics pins hold untouched).
  - Desk: hover chevrons and the filmstrip (`filmstrip.tsx`, a 15-frame window keyed by id).
  - Close-up: two-finger pinch to 3x about the midpoint, pan with a rubber band, home under fit, double-tap and trackpad pinch; `touch-pan-y` replaced by `touch-none`.
  - Video (`video.tsx`): muted, looping autoplay (paused under reduced motion), the transport with a frame-by-frame scrubber (a slider with keys), sound in the capsule, pause on moving on, new optional prop `startAt`.
  - Way out: pull down at fit, a tap on blank space anywhere, the close circle, Escape.
  - Address: `?photo=<id>` written by masonry with replaceState beside the other params (kept as written), read once on mount, opened only if in the payload, claimed by one grid, waiting behind an open door.
  - Share and save (`lib/media/share-save.ts`, 25 unit tests over mocked navigators): the file, then the link, then a copy; Copy link's public link; Save to Photos first on iOS; Ready; the 100 MB cap; `cache: "no-store"`.
  - The chrome cancels a touch pointerdown (menu triggers excepted): a focus-opened tooltip's arrow was taking every Share tap (measured: the mouseup landed on the arrow's span).
  - Admin grid: the tile's rect and a way back (`moderation-grid.tsx`), with component tests.
- **Pins changed deliberately** (each commented in `media-lightbox.test.tsx`): "a vertical move releases the gesture to the browser" became "locks to the way out, and the track never moves" (`wayout=down`); "a clean CENTER-third tap closes" became "a tap on blank space closes, wherever it lands", and the LEFT-third, RIGHT-third and edge no-op pins became "blank space beside the first photograph closes too" and "a tap on a peeking neighbour steps to it" (his note on the side zones); "the position counter reflects the index" became "draws no counter; the dialog's name still says where it is" (◇); the two scrubber-strip pins became "the scrubber is its own control" and "a drag on the clip swipes, playing or paused" (the browser's bar is gone); "wears the ONE material on the pill, the capsule and the close" became "on the credit, the capsule and the close"; "names nobody... the counter alone" became "no credit at all". Every physics pin (the lock, the clamp, the damping, the thresholds, the settles, reduced motion, the keys, the trailing click) holds as it was. The file goes from 39 pins to 69: new ones cover the credit, share and save, the close-up, the pull down, the grow and drop, the peek and the video; `masonry.test.tsx` goes from 22 to 30 (the address), and `geometry.test.ts` (19), `share-save.test.ts` (25) and `moderation-grid.test.tsx` (3) are new.
- **Announce (the reel's tap passes them):** `MediaLightboxLazy` / `MediaLightbox` take `origin={{ kind: "reel", rect: <the frame's rect> }}` (omit `returnTo`: the way out lands back in the frame; `rect: null` fades in) and `startAt={<the clip's current seconds>}`. `ViewerOrigin` is exported from `@/components/shared/media-lightbox`. The unfurl's parameter name is `PHOTO_PARAM` in `@/lib/media/share-save` (with `readPhotoParam`).
- **guest-flow.md, the Lightbox bullet (`:189-203`), to apply at the merge:**
  > - **Lightbox** (the SHARED [`media-lightbox.tsx`](../../src/components/shared/media-lightbox.tsx), its parts in `media-lightbox-parts/`): the photograph GROWS out of the tile it was tapped on (`origin`: the tile's rect and a `returnTo` that finds the tile of whichever photograph shows at close; the live reel passes its frame's rect and a clip's `startAt`) and drops back into it; a face-led CREDIT top left (the face or plain disc, the name, the mark, "You" on your own upload, the host's proved address, a door to `/u/<slug>` only where the item carries one), the close top right, the floating ACTION CAPSULE at the foot (Like / Save / Share / Copy link / Delete, a clip's sound, the host's curate group behind a divider) and a clip's TRANSPORT (play, a scrubber, the time) above it. ★ **EVERY UPLOAD CARRIES A NAME**: a confirmed guest's profile name stands plain, a typed one wears [`unverified-mark.tsx`](../../src/components/shared/unverified-mark.tsx) (MineMark's material, tap to open, one extra sentence for the host, and on YOUR OWN credit a "Confirm your email" opening the one confirm door). A row with no name renders no credit at all, never an invented stand-in: a row minted before names were asked (`create_guest` refuses a new one) and a verified row whose account has no profile name (a deleted account's surviving upload). [`anonymous-info.tsx`](../../src/components/shared/anonymous-info.tsx) is residue only the Library gallery mounts. ★ The mark carries its OWN door rather than a prop, because the credit sits three modules deep under `shared/masonry.tsx`; "is this mine" is the existing `canDelete` seam, never a second one. The neighbours PEEK at the edges and a tap on one steps to it; a tap on BLANK space closes (no side zones); a pull DOWN at fit closes; pinch, pan and double-tap zoom a photograph; a clip plays muted and looping and pauses when the viewer moves on; a desk adds hover chevrons and a filmstrip. `media-lightbox.test.tsx` pins the physics, `geometry.test.ts` the arithmetic. ★ **THE ADDRESS**: the open photograph rides the page as `?photo=<id>` (`PHOTO_PARAM`, written by `shared/masonry.tsx` with replaceState, read once on mount), and it opens only an item already in the viewer's payload: an unknown, held or hidden id opens the album plainly, and a door already open comes first. ★ **SHARE SENDS THE FILE** (fetched on the tap with `cache: "no-store"`, never prefetched; over 100 MB it falls back), then the link, then a copy; Copy link copies the PUBLIC album link (`shareUrl`, the event JOIN url, never a presigned media URL or a dashboard URL) with `?photo=` on an approved item; Save offers Save to Photos first on iOS (the system sheet with the file is the one web path into Photos) and the plain download elsewhere; a tap whose activation lapses leaves a one-tap Ready. The guest album and the host gallery pass `shareUrl`; the personal Uploads and the recovery bin omit it.
- **Assets requested from Will:** none.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none. (R2 CORS stays as it is: the product's origins are allowed, localhost is not, which is why the file path is a live check.)
- **Calls his to overrule:** the ◇ and ● lines under Questions, one each.
- **Look at first** (captures in the scratch dir above, taken locally in headless Chrome, iPhone UA at 375):
  - The viewer on the scale probe (`/e/d02631f1bfb3455188d224e41bf9510f`): `final-375-open.png` (the credit with the mark, the slivers, the capsule), `final-1440-open.png` (the slivers at 96, the chevrons, the filmstrip); the grow `sheet-grow-375.png` and `sheet-grow-1440.png`, the drop `sheet-drop-1440.png`, the swipe and pull `sheet-pull-375.png` (slowed tenfold).
  - A clip on the demo album: `sheet-final-video-375.png` (autoplay, the transport's played line, sound in the capsule), `finalvideo-1440-seek.png`; the close-up `sheet-zoom-375.png`.
  - The save sheet: `sheet-final-look-375.png` (the iOS menu, Save to Photos first; "Ready"); the sheet itself was a stand-in with a stand-in file, because R2 refuses localhost's CORS (the real sheet is the live check).
  - The address, in Chrome: a refresh on `?photo=` reopens it ("Photo 17 of 1145"), closing clears it and focuses its tile (scrolled into view), `?photo=` of an id the album does not hold opens the album plainly with no console error; under reduced motion no flight runs and a clip waits for Play. Pinned in `masonry.test.tsx` ("the open photograph rides the address").
  - The share-save tests: `src/lib/media/share-save.test.ts`; the geometry: `media-lightbox-parts/geometry.test.ts`.
  - The host feed and admin, proved in components: the host's viewer in `media-lightbox.test.tsx` (the curate group pins, "copies the PUBLIC album link... never the page's own address" from a dashboard URL, "shows the host the proved address"); the admin grid in `src/components/admin/moderation-grid.test.tsx` (grows out of the tile, drops into the tile of the report showing at close and focuses it, no Share or curate group).
  - The live pass at the merge: Share and Save to Photos on Will's iPhone on the alias (the file reaches the sheet, "Save Image" lands in Photos), and a swipe, pinch and pull on a real phone.
