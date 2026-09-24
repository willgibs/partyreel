---
track: media-viewer-wiring
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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

- none yet

## System-doc edits (in place, owned facts only)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- The work commit and the sync commit, pushed (or: launch-prep had not moved); the head is in the chat line
- Every claim names its artifact (a commit, a log line, a path), so the Orchestrator checks rather than believes.
- Gates on the synced tree, each on its own exit code
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The items, one line each
- Assets requested from Will: none, or one per line: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Calls his to overrule, one line each
- Look at first: ...
