---
track: album-rows
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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
