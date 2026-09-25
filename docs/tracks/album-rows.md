---
track: album-rows
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "242e0bf4"            # the launch-prep SHA the branch was cut from
board: album-columns
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/shared/masonry
  - src/components/shared/arrival.css
  - src/lib/shared/arrival
  - src/lib/shared/use-flip
  - src/lib/shared/album-rows
  - src/lib/media/tile-aspect
  - src/app/(dev)/design/sandbox/album-columns/
  - docs/systems/design-system.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/album-columns.json
  - src/components/guest/guest-masonry.tsx
  - src/components/guest/live-gallery.tsx
  - src/components/app/host-media-grid.tsx
  - src/lib/r2/grid-items.ts
  - src/app/(dev)/design/sandbox/gallery-fixtures.ts
  - src/app/(dev)/design/sandbox/host-curation/spec.ts
  - src/app/(dev)/design/sandbox/media-viewer/spec.ts
  - docs/systems/guest-flow.md
  - docs/systems/host-app.md
---

# lp/album-rows

**Goal.** Build the album's justified rows as an engine and an opt-in layout on the shared grid, then draw `album-columns` round 2 on it. Will picked justified rows over masonry (rows fill the way people expect, clean row lines, a better fit across portrait and landscape) and asked that no row ever leave a gap at the right edge. Production switches surface by surface in a later lane, once the reel lanes that own the album's pages have merged, so nothing here changes what a guest or host sees today.

## The brief

Will's picks (`docs/reviews/album-columns.json`, his notes beside each): `layout=justified`, `width=edge`, `scale=ceiling`, `phone=step-three`, `scope=shared`, `control=slider` with three to five fixed steps rather than a fine pixel slider.

**The engine, `src/lib/shared/album-rows.ts`** (pure, tested hard):
- A full layout picks optimal row breaks, the way a typesetter justifies a paragraph: every row fills the box exactly, heights sit in a soft band around the target, and the oldest row justifies too, up to a height cap. Only an album too small to fill one row at the cap sits centered, balanced rather than ragged.
- Arrivals and hides are local. Re-running the full optimum on each arrival can move dozens of rows (paths from a new head need not merge with the old ones; uniform 3:4 albums shift almost every row), so an arrival re-solves only a window (the new photos plus the top three rows, pinned to the old boundary below them) and a hide re-solves its row and neighbours; at most about four rows ever move. The full layout runs on load, resize, a step change and a filter. The anchor end is a parameter (newest-first albums anchor the oldest end; the host's Sort already reserves "Oldest first").
- Density steps are photos per row, never pixels, so every step stays distinct on any screen: about 2 a row under 480px, about 3 from 480 through tablets (his step-three), desktop by step with the densest about 8 a row (his ceiling: wider screens grow rows rather than add photos). Five steps is the working count; their exact targets are yours.
- Extreme aspect ratios clamp (the tile crops); a photo or video with no dimensions takes a fallback ratio.
- O(n·k): 1,145 items lay out in a few milliseconds.

**The layout on the shared grid** (`masonry.tsx`):
- `layout="rows"` beside the existing layouts: one flex row per engine row with no subpixel seams; a head slot for the guest's upload tiles (a nominal aspect, child margins zeroed); `MineMark`, the marks, `data-media-tile` and the viewer's origin rects all preserved.
- The arrival: the new tile rises in with today's rise and glow, and the reflowed top rows glide through the one FLIP helper (`use-flip`, extended if it only translates); rows below the window never move; reduced motion is instant.
- Masonry stays the default and every export stays (`GALLERY_COLUMNS`, `GALLERY_UNIFORM_COLUMNS`, `columnsFor`, `distributeColumns`, `layout="uniform"`, `clampAspect`, `prefix`): guest and host code and about ten boards import them. The held `lp/reel-guest-wiring` branch changed `guest-masonry.tsx` (`git show lp/reel-guest-wiring:src/components/guest/guest-masonry.tsx`); keep its props working too.
- The hidden-photo dim never renders (`opacity-30` glued to `active:scale-[0.98]` with no space; the ROADMAP's Host line): fix it here.

**No page file changes.** Each surface's switch to rows (the guest album, the host feed, bulk select, the bin, the profile, the skeletons, the tile-size threading a jump-free first paint needs, the five steps in the cookie and the View menu) belongs to a later lane, after the reel lanes that own those pages merge. Your Handoff lists what each surface will need (props, the head slot, the select grid) and the lines your change makes stale in `guest-flow.md` (the column rule) and `host-app.md` (the tile size), for their owners.

**The board, `album-columns` round 2**, once the engine works:
- Bump the round and carry his r1 notes, synthesized, into the context. The r1 frames retire: their gutter maths padded twice (full rows overran by 40px, the ceiling drew seven at 2560).
- Draw every option on the real `rows` layout over the lab's fixture album at 1440 and 375 (768 where it matters), with simulated uploads arriving.
  - `arrival`: how a new photo enters the rows, three or four directions, today's rise-and-glide among them.
  - `steps`: the face of three to five fixed steps (a stepped slider in the View menu, a segmented control, pinch on touch with ctrl-wheel on a trackpad), and whether phones get it (the guest control is off under 640px today).
  - `rhythm`: plain rows, or a feature row now and then (a landscape photo alone in its row, taller), picked at random per visit and never reshuffled mid-visit. That is his mosaic note (random, never most-liked; a guest's payload carries no like counts).
- The nearest open asks are `host-curation.queue` (how a waiting photo shows in Review) and `media-viewer.mine` (the own-item mark); ask nothing they ask.
- One row of `touchpoints.ts` is yours: `album-columns`' own row. Nothing else in that file.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each on its own exit code; the engine's property tests (every justified row sums to the box within 0.5px, heights in the band, an arrival moves at most four rows and a hide only its window, the anchor parameter, tiny albums centered, missing dimensions fall back) and a timing test at 1,145 items; every existing grid, guest and host test green with masonry the default; `pnpm lab:smoke --base http://localhost:<port>` whole; `pnpm lab:demo --board album-columns --base http://localhost:<port>` pressing every step; the board at 1440 and 375 with reduced motion honoured.

## Questions (a recommended answer each; the Orchestrator relays them)

- **The five steps' counts** (photos per row, by the album box's width). Built: phone 1, 1.5, 2, 3, 4 (under 480); tablet 2, 2.5, 3, 4, 5 (480 to 899); small laptop 2.5, 3, 4, 5, 6.5 (900 to 1279); desk 3, 4, 5, 6, 8 (1280 up), the middle step the default. One table, `ROW_CLASSES`. Carried on the board.
- **A photo with no dimensions, and what crops.** Built: a square (masonry's own fallback); 1:2 to 2.4:1 lays whole, past either edge crops (`rowRatio`); the host's `clampAspect` keeps its moderation band. Carried on the board.
- **Where an album's leftovers go.** Built: the oldest row fills the width like every row and alone may run past the soft band, up to a hard cap 30% above the band's top (`capFor`); an album too small to fill one row at the cap sits centred at the cap. Carried on the board.
- **The arrival** (asked on the board): recommended push, the row visibly opening for the photo, his reason for rows; rise keeps today's entrance plus the glide.
- **The steps' face and phones** (asked): recommended the slider in View on every screen plus pinch; phones get real steps now that a step is a count, not a pixel floor two columns ignored.
- **The rhythm** (asked): recommended the taller feature row about one row in eight, led by a landscape; plain is the calm answer. Features switch themselves off where every photo is already alone (a phone at 1 or 1.5 a row).
- **The host feed glides too.** Built: the glide is reflow motion, not entrance theatre, so the host album's tiles stay `data-static` (no rise) but its rows glide like the guest's. Overrule: host rows land at once (`--arrival-glide-ms: 0` on the host's box).
- **The head slots.** Built: each tile-shaped node in `prefix` becomes a square slot of its own at the growing end, its bottom margin zeroed and its box filled; the upload tiles' previews will want `fit="cover"` in a slot (the surface lane's).
- **The first paint.** Built: CSS greedy rows on the same target (container queries), replaced by the engine's rows without remounting a tile; a jump-free first paint (a width the server can know) is the surface lane's.
- **The scrollbar loop.** Built: rows that summon and dismiss their own scrollbar (a width flipping back within 24px and 300ms) lay at the narrower width and hold.

## System-doc edits (in place, owned facts only)

- `docs/systems/design-system.md` "The album tile": the layouts line (masonry default, uniform, `rows`), and four rows facts (the typesetter's breaks and steps as a count; ★ the full re-solve moves the whole album, so only local windows on arrival and hide; ★ one flex container broken by hand, never a wrapper per row; ★ the glide's `getSnapshotBeforeUpdate` snapshot).
- `docs/systems/design-system.md` "Motion": the FLIP line refined (reads before writes, one reflow a pass; `scale`, `duration`, `visibleOnly`).

## Deferred (ROADMAP one-liners, bucket named)

- Now: Album: switch each surface to `layout="rows"` once the reel lanes owning the pages merge (the guest album, the host feed, bulk select through `AlbumRows`, the bin, the profile feeds, the skeletons, the five steps in `pr_tile_size` and the View menu, a jump-free first paint); the needs list is lp/album-rows' Handoff.
- Now: Album: pause the tile shimmer off screen: a thousand-photo album keeps about 1,100 skeleton animations restyling every frame until each tile nears the viewport (measured in Chrome at 1,145 photos; masonry would pay the same with real, unique photo URLs).
- Now: Lab: the lab shell's `:has()` rule invalidates the whole page subtree on any DOM insertion (about 7,800 elements restyled per album arrival inside a board, masonry and rows alike); scope it.

## Handoff (replaces the chat report)

- **Commits**: the work `2ea055e0`; the sync `441a2f16` (merge of `origin/launch-prep` at `87d7b96a`: clip-bench and reel-defaults-migration had landed, and `touchpoints.ts` was reformatted upstream, so the album-columns row conflicted and is resolved to its round-2 text). Both pushed; the head is in the chat line.
- **Gates on the synced tree `441a2f16`**, each its own exit code (logs in the lane's scratch): `pnpm typecheck` 0; `pnpm lint` 0 (6 warnings in 5 files, all pre-existing and outside the lane: `lab/_desk/review-session.tsx`, `sandbox/home-hero/shared.tsx`, `contact/contact-form.tsx`, `album-fill-grid.tsx`, `review-switch.tsx`); `pnpm test` 0 (430 files, 4,664 tests); `zsh scripts/build-lock.sh pnpm build` 0; `pnpm lab:smoke --base http://localhost:3131` 0 (292 checks, album-columns at 458 words); `pnpm lab:demo --board album-columns --base http://localhost:3131` 0 (3 steps; two same-picture pairs, both honest: rise = push under the demo's reduced motion, where both arrivals are instant, and menu = both at 1440, where the only picture difference is the pinch hint's faint pill).
- **Lane check**: `git diff --name-only origin/launch-prep...HEAD` = the owned paths plus `src/app/(dev)/design/touchpoints.ts` (the album-columns row, the brief's own exception) and this file.
- **The engine**, `src/lib/shared/album-rows.ts` (pure): `layoutRows` (optimal breaks, the oldest row justified up to the cap, a tiny album centred), `reflowRows` (a pinned window per arrival, hide or mid-album insert, never more than four old rows; full on a resize, a step, a reorder or a bulk change), `perRowFor`/`ROW_CLASSES`, `pickFeatures` (a per-visit coin, landscapes only, nested across steps). `album-rows.test.ts`: every justified row sums to the box within 0.5px at fractional widths too, heights in the band with only the anchor row past it, an arrival at most four rows with every other row byte for byte, a hide only its window, the anchor both ways, tiny albums centred, garbage dimensions to the fallback, feature rows at least 1.3x, 1,145 items under 10ms (measured about 0.5ms).
- **The layout**, `masonry.tsx`: `layout="rows"` through `AlbumRows` (exported for the select grid: `renderTile(item, box)`), props `rowStep`, `rowAnchor`, `rowRhythm`, `rhythmSeed`; masonry stays the default and every export stays. Pinned in `masonry.test.tsx`: rows fill the box, every mark and viewer hook kept, the step counts photos, head slots, an arrival keeps every tile's DOM node, the glide asked on an arrival and a step and never on the first layout, tiny albums centred, the first paint, `ROWS_FIRST_PAINT` on `ROW_CLASSES`' breakpoints, `steadyWidth`. `lib/media/tile-aspect.ts` gains `rowRatio`; `lib/shared/arrival.ts` gains `ARRIVAL_GLIDE_MS` (450, `--arrival-glide-ms` overrides).
- **The FLIP**, `use-flip.ts`: `runFlip` reads every rect before writing any style (one forced reflow a pass, not one per node) and gains `scale`, `duration`, `easing`, `visibleOnly`; the existing output is identical (its five pins unchanged, five new).
- **Two production fixes**: the hidden-photo dim renders (`opacity-30` was glued onto `active:scale-[0.98]`; `cn` now; pinned by "dimItem dims the media"), which closes ROADMAP's Host line on it; and the seed stagger's `--tile-i` holds each tile's seed index (globals.css already said seed-only), so an arrival no longer rewrites a custom property on every tile.
- **The board**, `/design/lab/album-columns`, round 2 on the real rows engine: arrival (rise, push, beats, snap; live uploads every 3.2s), steps (menu, segments, pinch, both; each really re-lays the album, pinch through ctrl-wheel and two pointers), rhythm (plain, double, solo; "Another visit" re-deals); the knob 1440, 768, 375; every caption read off the frame; his r1 notes synthesized into the context; r1's frames retired.
- **Measured in Chrome**: every row's layout box from 0 to the grid's width to the pixel at 1440 (1385), 768 (713) and 375 (320), whole-pixel tiles, 4px gaps; an arrival re-broke 2 or 3 rows ("kept every photo" for the rest); the densest step measured 8.0 a row; ctrl-wheel stepped 8, 6, 5 with page zoom prevented and a plain scroll untouched; under reduced motion an arrival showed no transform and no animation. At 1,145 tiles (a temporary route, deleted) an arrival or a hide costs what masonry's does; the lab shell's `:has()` restyle dominates both (Deferred).
- **What each surface will need** (the switch lane): the guest album passes `layout="rows"`, `rowStep` from the cookie and the rhythm's `rowRhythm`/`rhythmSeed` (a seed per visit, held), keeps `prefix` (each head node a square slot; `UploadStackTile`/`WaitingTile` want `PickPreview fit="cover"` there), and drops `buildGuestViewGroups`' under-640 gate if phones get the steps; the host feed passes `layout="rows"` (its `clampAspect` maps to the moderation band), and `SelectableMediaGrid` renders through `AlbumRows` so entering select keeps the same rows; the bin and the profile feeds pass `layout="rows"`; `pr_tile_size` becomes a step 0 to 4 (`DEFAULT_ROW_STEP` 2; `TILE_SIZES` retires, old values reset); the skeletons lay rows; a jump-free first paint needs a width the server can know.
- **Lines this change will make stale** (their owners'): `guest-flow.md` 105-112 (the column rule: `GALLERY_COLUMNS`, `PHONE_MAX`, `--album-column`), 715-716 (an arrival kept local by columns), 754-756 (the Tile size group disabled under 640 because of `PHONE_MAX`); `host-app.md` 209-210 (Tile size as `--album-column` in `pr_tile_size`). They go stale when each surface switches, not now. ROADMAP's Host line on the hidden-media dim is done now.
- **Assets requested from Will**: none.
- **Board ideas**: a photo that wraps from the end of one row to the start of the next glides diagonally across the album; a crossfade at both ends may read calmer (one more arrival option, or a refinement of his pick). His r1 width note stands unasked: an 8-12px phone gutter, and the host dashboard running wide like the album.
- **Proposed migrations / Worker / Vercel / Stripe / env changes**: none.
- **Calls his to overrule**: the three carried calls (step counts, the square fallback and the 1:2 to 2.4:1 crop, the oldest row's slack); push, both and double as the recommendations; the host feed gliding too.
- **Look at first**: `/design/lab/album-columns?key=` at 1440, then 375 (watch a few arrivals per option). On the alias after the build: hide a photo on a test event and see it dim in the host album; the Reel's drag reorder and the admin feed's reorder still slide (`runFlip`'s batching).
