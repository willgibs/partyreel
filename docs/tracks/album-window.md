---
track: album-window
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
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

None is a one-way door; each is built as recommended and is one small change to take back.

- **Does the density slider close the View menu on a pick?** Recommended: no, it stays open, so the album re-lays
  behind it while you try the next step (the radio groups beside it still close on a pick).
- **Is the album one placeholder in a session replay?** Sentry's replay buffers every session to send with an error;
  in the windowed album it serialized every row mount and measured every photograph (one forced layout each, the
  largest single cost of a 4x-throttled phone's fling: 1.4s of 10s). Recommended: yes, `data-sentry-block` on the
  album grid; the photographs are blocked from replays already (`blockAllMedia`), and the album keeps its place and
  size in the recording. Observability is yours to overrule.
- **Which tiles take the album's opening entrance?** Recommended: only the first paint's (the screens at load); a row
  the window mounts later lands still, and a new photograph pushes in.
- **Masonry's keyboard order**: the measured masonry keeps every tile in the album's own newest-first order in the
  DOM (the columns are an `order`, not a wrapper each), so Tab walks the album in order rather than column by column.
  Recommended: keep.
- **The host album's columns rebalance**: the balance read a clamped host tile as a square, so host columns balanced
  on the wrong shapes; fixed, a host album re-arranges into evener columns. Recommended: keep.

## System-doc edits (in place, owned facts only)

- `docs/systems/design-system.md`, "One colour per action": what `--reel` marks now (the reel itself, never a verb on
  a photograph).
- `docs/systems/design-system.md`, "The album tile": refined in place: the memoized tile and the grid's one click and
  long-press, the desk row `display:none` at rest, the measured masonry as one box flowing in columns by `order`,
  three steps and the one cookie index, the window (prefix sums, overscan, the first paint laid per width class,
  arithmetic scroll reads), hand anchoring and the touch hold, the push, density, the shimmer gate and the kept
  skeleton, the kept src, the session-replay block, the entrance decided once.

## Deferred (ROADMAP one-liners, bucket named)

- Now (refines the line "Album: switch each surface to `layout="rows"`..."): the surfaces thread the step from
  `resolveRowStep` into the server's first paint and a View menu `kind: "density"` group (with `perRow` words), hand
  `onWindowChange` ids to the link store and the likes seed, open `?photo=` through `albumRef.scrollToId`, run host
  select mode through `selection`, and retire `TILE_SIZES`/`resolveTileSize`/`useTileSize`/`TileSizeControl` with the
  last masonry surface (three steps now, not five).
- Now: the lab and the kit: `album-columns` draws on the windowed rows, so its captions read the mounted rows only;
  retire the board at the surfaces' wiring.
- Now: the perf harness gains a `--page` mode for the real guest and host pages (the scale probe's link is a
  capability a lane cannot read), for the surface lanes to run before and after on the alias.
- Done here, to drop: "Album: pause the tile shimmer off screen", and the "virtualised grid" of "Albums: ... a paged
  album replaces the whole read".

## Handoff (replaces the chat report)

- **Commits** (pushed to `lp/album-window`): `55546374` the harness, the scale page and the render probe (baseline
  measured on it); `69282ea0` the window, the memoized tile, the likes store, three steps, the push, the density
  control; `86c7aa96` the first paint as the engine's rows, masonry flowing in columns, the board, the doc;
  `034a48f2` the rows' box contract kept for `mark-r3`'s board; `e4126e42` **the sync** (merge of `origin/launch-prep`
  at `bdba680e`: `album-pages`, `mark-r3`, `story-r2`, `door-r2`; clean); `d27750fb` the tile as a layout boundary and
  the kept skeleton. The head is this manifest's commit.
- **Gates on `d27750fb`, the synced tree, each on its own exit code**: `pnpm typecheck` 0; `pnpm lint` 0 (0 errors;
  6 warnings, all pre-existing in other lanes' files); `pnpm test` 0 (470 files, 5,117 tests); `zsh
  scripts/build-lock.sh pnpm build` 0; `pnpm lab:smoke --base http://localhost:3136` 0 (282 checks); `pnpm lab:demo
  --board album-columns --base http://localhost:3136` 0 but vacuous (round two is answered, so no open step): every
  option of the three asks pressed by hand at 1440, 768 and 375 draws its album, no console error. Logs:
  `/private/tmp/claude-501/-Users-gibby-local-ai-partyreel/401f4a77-be99-4a42-82f6-e5fac8e4a4c5/scratchpad/album-window/gate2-*.log`.
- **Lane check**: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file + one exception,
  `src/app/(dev)/design/touchpoints.ts` (the `album-columns` row, granted by the brief).
- **Before and after**, `scripts/album-perf.mjs` on a production build, 1,145 photographs (JSON:
  `/private/tmp/claude-501/-Users-gibby-local-ai-partyreel/401f4a77-be99-4a42-82f6-e5fac8e4a4c5/scratchpad/album-window/perf-baseline*.json` and `/private/tmp/claude-501/-Users-gibby-local-ai-partyreel/401f4a77-be99-4a42-82f6-e5fac8e4a4c5/scratchpad/album-window/perf-after*.json`):

  | | rows 1440 | rows 375 | masonry 1440 | masonry 375 | rows 375, 4x CPU |
  | --- | --- | --- | --- | --- | --- |
  | album nodes, load / fling max | 16,441 → 635 / 1,010 | 16,770 → 395 / 640 | 16,162 → 16,255 | 16,224 → 16,251 | 16,770 → 395 / 657 |
  | running animations at rest | 1,110 → 0 | 1,122 → 0 | 1,051 → 0 | 1,117 → 0 | 1,122 → 0 |
  | fling p95 / long frames | 33.4 / 0 → 16.8 / 0 | 33.3 / 0 → 16.8 / 0 | 33.3 / 0 → 16.7 / 0 | 16.8 / 0 → 16.7 / 0 | 100 / 47 → 33.4 / 0 |
  | renders: like · tick · quiet poll | 1,145+1,145 · 1,260 · 1,145 → 0+2 marks · 0 · 0 | same → same | same → same | same → same | same → same |
  | head arrival while deep: cost / moved | 26.6ms / 0 → 2.4ms / 0 | 27.8 / 0 → 2.3 / 0 | 23.3 / 345px → 8.1 / 345px | 22.9 / 265px → 6.9 / 265px | 133.5 / 0 → 11.5 / 0 |
  | LCP / CLS | 2,016 / 0.43 → 256 / 0 | 1,572 / 0.81 → 216 / 0 | 3,016 / 0 → 968 / 0 | 1,780 / 0 → 1,036 / 0 | 260 (a text span) / 0.81 → 892 (a photograph) / 0 |
  | heap, load style time | 27.2MB, 1,547ms → 8.4MB, 24ms | 27.6MB, 1,104ms → 8.1MB, 18ms | 27.4MB → 25.1MB, 1,492 → 447ms | 27.1 → 25.1MB, 899 → 474ms | 3,391 → 129ms |

  **Budgets**: every one met by the windowed rows at 1440x900 and 375x812. Masonry, which the surfaces leave for the
  rows, gets every shared fix and misses two budgets by construction: it mounts every tile (16k nodes) and a head
  arrival grows its column (masonry at 4x CPU: fling long frames 42 → 0 to 12, p95 83 → 67 to 83, run to run).
  Transfer is the same page's (3.9MB rows at 1440: the fixture stills are 90KB JPEGs, not the product's previews).
- **The items**:
  - The perf harness `scripts/album-perf.mjs` (nodes, layout and style counts and time, heap, running animations, a
    fling's frame histogram and long animation frames, transfer, first-row image timing, CLS, LCP, renders off the
    grid's probe, a head arrival while deep; `--budgets`, `--cpu`, `--profile` naming a native call by its caller)
    and the tool page `/design/album-scale` (outside the shell; `?layout`, `?n`, `?step`, `?uploading=1`).
  - `AlbumTile` (`album-tile.tsx`): memoized on data props compared by content, no handler (one delegated click and
    one long-press on the grid, latest props from a ref), the like glyph and mark read per id, entering once, select
    mode on the one grid, `contain: strict`.
  - `LikesProvider` is a per-id store (`useIsLiked`, `useSyncExternalStore`; a stable context value);
    `LocalLikesProvider` for the lab. Its pins were passing on a substring (`"liked"` matched `"unliked"`); exact now.
  - The shimmer runs only in view, after a beat, and a landed photograph hides its skeleton rather than removing it;
    the desk row is `display:none` at rest; upload progress reports once a frame (`perFrame`); the first row loads
    eager and first, every tile decodes async; a mounted tile keeps its src across a link rollover (same object path).
  - Masonry: the first measure and every filter restyle the same box (one flex box flowing in columns, each tile's
    column its `order` counted from the column's oldest end), so nothing remounts and an arrival restyles no tile
    already there; a clamped host album balances on its real shapes.
  - Three steps everywhere (1/2/3, 2/3/4, 3/4/6, 3/5/8, the middle the default), one index in `pr_tile_size`
    (`resolveRowStep`, the legacy widths mapped across and both readers reading both), `useRowStep`, no feature row
    at one a row.
  - The windowed rows (`album-window.tsx`, maths in `lib/shared/album-window.ts`): one viewport behind and two ahead,
    spacers from the prefix sum, hand anchoring (`overflow-anchor: none`), the touch hold, `onWindowChange`,
    `scrollToId`, the keyboard's row pinned, `aria-setsize`/`aria-posinset`, and a first paint that is already the
    engine's rows per width class (CLS 0 on a throttled phone and desk, from 0.81 and 0.43).
  - The push arrival (`data-entering`, written by the rows in the render that lands the photograph); the density
    slider (`kind: "density"` in the View menu) and pinch and ctrl-wheel on the grid, anchored on the focal tile.
  - Selection props on the one grid (`selection`); the album grid blocked from session replay.
  - `album-columns` stays drawable (its arrival options outrank the production push; its steps on three), its
    touchpoints row updated; `design-system.md` edited in place.
- **Assets requested from Will**: none.
- **Board ideas**: the album's opening entrance at scale (a stagger capped at 540ms reads the same on a 48-photo first
  paint as on a 1,145 one; a first-screen-only cascade may read calmer); a pinch count while pinching (the board drew
  one; production shows none).
- **Proposed migrations / Worker / Vercel / Stripe / env changes**: none.
- **Calls his to overrule**: the five Questions above; the slider's stops speak in "N a row" where the album's width is
  known and "Large / Medium / Small" where it is not; the first paint lays each width class at a nominal album width
  (351, 728, 984, 1,400); `contain: strict` on every album tile.
- **Not verified live**: the alias builds from `launch-prep` only, and the scale probe's guest link is a capability I
  may not read, so the shared masonry fixes were proven on the scale page, the Library's real `HostMediaGrid` under
  the real `LikesProvider` (the row on hover, Hide reaching the host's handler and reverting on its refusal, Like
  opening the account door, the viewer opening; no console error) and the suite. At the merge's `[preview]`, walk
  the scale probe's guest album (scroll, a like signed in, an upload landing with its glow and sweep, the View menu)
  and a host album (the hover row's verbs, long-press select, hide and show).
- **Look at first**: `src/components/shared/album-window.tsx` (the window and the anchor), then
  `src/components/shared/masonry.tsx` (`placeColumns`), then `/private/tmp/claude-501/-Users-gibby-local-ai-partyreel/401f4a77-be99-4a42-82f6-e5fac8e4a4c5/scratchpad/album-window/perf-after.txt`.
