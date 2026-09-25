---
track: album-window
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "e13a98d6"            # the launch-prep SHA the branch was cut from
board: album-columns
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/shared/masonry
  - src/components/shared/arrival.css
  - src/components/shared/album-window
  - src/components/shared/album-tile
  - src/components/shared/density-control
  - src/components/shared/view-menu
  - src/components/shared/tile-size-control
  - src/components/app/media-grid
  - src/components/likes/
  - src/lib/shared/album-rows
  - src/lib/shared/album-window
  - src/lib/shared/use-flip
  - src/lib/shared/use-long-press
  - src/lib/shared/tile-size-cookie
  - src/lib/shared/use-tile-size
  - src/lib/shared/arrival
  - src/lib/upload/uploader
  - src/app/(dev)/design/album-scale/
  - src/app/(dev)/design/sandbox/album-columns/
  - scripts/album-perf.mjs
  - docs/systems/design-system.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/album-columns.json
  - src/components/guest/live-gallery.tsx
  - src/components/guest/guest-masonry.tsx
  - src/components/app/host-media-grid.tsx
  - src/components/app/event-feed/selectable-media-grid.tsx
  - src/components/ui/skeleton.tsx
  - src/app/theme.css
  - docs/systems/guest-flow.md
  - docs/systems/host-app.md
---

# lp/album-window

**Goal.** Make the album fast at any size, and build the rendering half of the paged album: justified rows mounted only around the viewport, a memoized tile, no off-screen animation, and Will's `album-columns` round-2 picks (the push arrival, three density steps with a View-menu slider plus pinch and ctrl-wheel, the doubled feature row), all proven on a 1,145-photo tool page against measured budgets. Will: "We already need to add scrolling pagination to event pages rather than load the whole album upfront. Even our test event with 1000+ lightweight items gets laggy on my MBP fast."

## The brief

Will's picks and notes: `docs/reviews/album-columns.json` (both rounds, with the Orchestrator's note). The data half (a light manifest of the whole album, image links minted by id for what is on screen, a delta poll) is `album-pages`, running beside you; the surfaces switch in two later lanes (guest, host) once both of you and the reel stretch have merged. Production's grids stay on masonry until then, but everything you fix that masonry shares ships at your merge.

**Why it lags today** (mapped on the scale-probe event, 1,145 photos):
- About 1,100 off-screen skeleton shimmers animate `background-position` every frame (measured).
- There is no `React.memo`: every like, every upload progress event (unthrottled, `src/lib/upload/uploader.ts`), every poll and every arrival re-renders all 1,145 tiles.
- About 16k DOM nodes.
- A hidden 42px backdrop-filter action bar on every tile from 768px.
- Masonry's first measure remounts every tile, as do the Yours filter and host select mode.

**Build, in this order:**
1. **The perf harness first.** `scripts/album-perf.mjs` drives Chrome over the DevTools protocol, the way `scripts/lab-demo.mjs` does, in a foreground or new-headless tab so animation frames run. It reports:
   - DOM nodes, layout and style-recalc counts, and heap;
   - long animation frames;
   - a frame-delta histogram over a scripted fling top to bottom and back;
   - `document.getAnimations()`;
   - transfer sizes, first-row image timing, CLS and LCP.

   Add a tool page, `src/app/(dev)/design/album-scale/` (outside `(shell)`, so the lab shell's `:has()` restyle cannot skew it), rendering a synthetic 1,145-item album on the real grid. Record today's baseline on a production build (`zsh scripts/build-lock.sh pnpm build`, then `pnpm start`), never `next dev`.
2. **The fixes masonry shares**, shipping to production at your merge:
   - A memoized tile taking data props only, with one delegated click and one long-press handler on the grid, callbacks read from a latest-props ref (no React Compiler here), and tile actions compared by content.
   - `LikesProvider` becomes a per-id store read with `useSyncExternalStore`, so a heart re-renders one mark.
   - The shimmer runs only in view (a `data-inview` gate, with a short delay so a cached image never shimmers).
   - The action bar is `display:none` at rest, still sliding in via `@starting-style` and `transition-behavior: allow-discrete`.
   - Upload progress is throttled to one update a frame.
   - First-row images `loading=eager` with `fetchpriority=high`; every tile `decoding=async`.
   - A mounted tile keeps its `src` across a link rollover and swaps only on an error.
   - Masonry's first measure no longer remounts every tile.
3. **Three steps everywhere** (his phones 1/2/3, extended by the Orchestrator's call).
   - `ROW_CLASSES` becomes: under 480px 1/2/3; from 480 2/3/4; from 900 3/4/6; from 1280 3/5/8.
   - `RowStep` is 0 to 2, the middle the default.
   - One index in the shared `pr_tile_size` cookie; the legacy 300/240/180 map to 0/1/2. Keep the old sizes exported until the surface lanes switch.
   - The doubled feature row (`rhythm=double`) never runs at one photo a row.
4. **The windowed rows.**
   - Row tops are a prefix sum of the engine's whole-pixel heights, so the rows in view are a binary search per frame: a top spacer, the mounted rows, a bottom spacer.
   - Overscan: one viewport behind, two ahead. Tiles keep their keys.
   - `overflow-anchor: none`, with hand anchoring: record the first visible tile's top before any change above the viewport and correct in the same layout effect. This covers a head arrival while the reader is deep, a hide above, a mid-album insert, and a step or resize anchored on the tile at the top or the pinch point.
   - On touch, never scroll during momentum: hold the new layout until the scroll has idled about 150ms.
   - The window reports what it mounts (`onWindowChange(ids)`) so links and likes load per window.
   - `scrollToId` for a deep link and the viewer's way back.
   - `aria-setsize` and `aria-posinset` on tiles, and the window follows keyboard focus.
5. **The push arrival** moves from the board into production: the new photo wipes in from its left edge over 450ms while its neighbours slide aside. Reduced motion is instant.
6. **The density control.** A three-stop slider group in the View menu, at every width, plus pinch (pointer events) and ctrl-wheel (a non-passive listener on the grid), each anchored on its focal tile. Pinch takes over page zoom only over the album; the viewer keeps its own zoom.
7. **Selection props on the rows grid**, so the host's select mode can later run on the same grid instead of swapping to `SelectableMediaGrid` and remounting.

**Budgets, measured at 1,145 on a production build, 1440x900 and 375x812:**
- ≤2,000 album DOM nodes at any scroll position.
- 0 running animations after images load.
- p95 frame ≤16.7ms with no long animation frame over 50ms across a 10s fling.
- A like re-renders 1 tile; a progress tick or a quiet poll 0.
- A head arrival while deep moves nothing visibly, in ≤16ms of main-thread work.

Report before and after in the Handoff.

**Also:** `design-system.md`'s action colours still name add-to-reel violet (`--reel`), an action the host's bulk bar no longer has; say what `--reel` marks now. `album-columns` stays drawable on your engine (its row in `touchpoints.ts` is yours). The lightbox's sparse list and every page wiring belong to the surface lanes, not to you.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` whole; `pnpm lab:demo --board album-columns --base http://localhost:<port>` pressing every step; the window and anchoring maths and render counts in tests; `scripts/album-perf.mjs` before and after on a production build, every budget met or its miss named; every existing guest and host grid test green.

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
