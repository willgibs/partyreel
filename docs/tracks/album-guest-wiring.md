---
track: album-guest-wiring
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "64fbd28c"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/guest/live-gallery
  - src/components/guest/guest-masonry
  - src/components/guest/event-experience
  - src/components/guest/gallery-
  - src/components/guest/yours-filter
  - src/components/guest/reel/
  - src/app/(guest)/e/
  - src/app/(guest)/u/
  - src/lib/guest/merge-
  - src/lib/guest/reconcile-
  - src/lib/guest/refresh-
  - src/lib/guest/reel-
  - src/lib/guest/use-upload-queue
  - src/lib/guest/yours
  - src/lib/events/gallery-
  - src/lib/r2/grid-items
  - src/lib/db/queries/guest-events
  - src/lib/reel/live/
  - src/lib/reel/engine/player-live
  - src/app/api/guests/gallery/
  - src/components/shared/media-lightbox
  - src/components/shared/masonry
  - src/components/shared/album-window
  - src/components/shared/album-tile
  - scripts/album-perf.mjs
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/album-columns.json
  - src/lib/events/album-wire.ts
  - src/lib/events/album-sync.ts
  - src/lib/events/album-guest-links.ts
  - src/lib/db/queries/album-guest.ts
  - src/lib/album/store.ts
  - src/lib/album/links.ts
  - src/lib/album/resolver.ts
  - src/lib/shared/album-window.ts
  - src/lib/shared/album-rows.ts
  - src/components/shared/density-control.tsx
  - scripts/album-perf.mjs
  - docs/systems/design-system.md
---

# lp/album-guest-wiring

**Goal.** Move the guest's album, and the reel and viewer that read it, onto the paged album: a manifest and a first window of links rendered on the server, justified rows mounted around the viewport with Will's `album-columns` round-2 picks, a delta poll on the album's version, links minted by id for what is on screen or about to play, and the reel's take made sub-quadratic on the manifest. Will: "We already need to add scrolling pagination to event pages rather than load the whole album upfront. Even our test event with 1000+ lightweight items gets laggy on my MBP fast."

## The brief

The two engines are merged:
- `album-window` (the rendering half: `AlbumWindow`, the memoized `AlbumTile`, three density steps, the push arrival, `DensityControl`, the perf harness `scripts/album-perf.mjs` and `/design/album-scale`).
- `album-pages` (the data half, merged at f1eda15d: the wire contract `album-wire.ts` a1, `album_state` and `album_changes` with `album_changes_since`, the self-guarded guest reads, links by id with attribution, `/api/album/guest/{sync,media,manifest}`, the client store in `src/lib/album/`, the reel's `{ get, ensure }` resolver).

You wire the guest's surfaces onto both. `album-host-wiring` does the host's beside you: it takes the lightbox as you leave it, so keep its new props additive and name them in your Handoff.

**The guest album** (`src/app/(guest)/e/[token]/page.tsx`, `event-experience.tsx`, `live-gallery.tsx`, `guest-masonry.tsx`, `gallery-live.tsx`):
- **The first paint.** The page embeds the manifest and the first window's links server-side (`readGuestAlbumMedia` then `toGuestAlbumLinks`, the links route's own two calls, recommended by `album-pages`). The rows are laid out for the width class a small functional cookie remembers (the user agent's guess cold) and the step `pr_tile_size` holds, so the first paint does not jump. Measure CLS.
- **The live provider.** `GalleryLiveProvider` moves onto the album store and `/api/album/guest/sync`: the validator, deltas applied by id, `resync`, the drift guard and the session-cookie heal kept, and the presign watchdog re-minting only the failing ids. The whole-album poll path (`/api/guests/gallery`) retires.
- **The grid.** `AlbumWindow` in rows with his picks: `arrival=push`, `steps=both` (the three steps in View's slider, plus pinch and ctrl-wheel), `rhythm=double` (off at one a row). The upload tiles at the head subscribe to the queue themselves. The Yours filter runs over the manifest (the own ids intersected with it, the count whole), with `src/components/guest/yours-filter.ts` moving into `src/lib/guest/`. Arrival marks come from delta upserts. Likes are seeded per window.
- **Masonry leaves the guest album.** Keep its shared exports for whatever still reads them.

**The viewer** (`src/components/shared/media-lightbox*`):
- It takes the manifest and a link source (the current item ±1 for `view`, ±7 for the filmstrip's `tile`), so next and previous cross the whole album and "Photo k of N" is the manifest's length.
- `?photo=<id>` opens an unloaded item from the manifest, with its way back through `scrollToId`.
- The pending Approve branch that can never render goes (the ROADMAP line).

**The reel** (`src/lib/reel/live/`, `player-live`, `src/components/guest/reel/`):
- `createClipSource` takes the manifest's eligible entries and the resolver, calling `ensure(ids)` as each slot is planned, about two windows ahead.
- `planTake` goes sub-quadratic: 48 ms at 1,200 items and about a second at 6,000 today (`pickQuickAdd` sorts on every pass of 12).
- The tile's stills need only the take's first pass.
- The creator's items prop reads links by id through the same resolver.
- The screen's watchdog re-mints only the failing ids.

**The profile feeds** (`src/app/(guest)/u/`) move onto rows; their 200 cap stays.

**Measure** with `scripts/album-perf.mjs` on a production build (`zsh scripts/build-lock.sh pnpm build`, then `pnpm start`) against `/e/<the scale probe>` at 1440x900 and 375x812:
- album DOM nodes under 2,000;
- no running animation at rest;
- the first load's HTML and RSC under 150 KB compressed;
- a quiet poll answered 304 in two queries or fewer;
- a head arrival while deep moving nothing visibly;
- CLS at or under 0.02 with a matching width cookie.

Report before and after.

**`guest-flow.md` belongs to `reel-sweep` until it merges**, so put its lines in your Handoff and the Orchestrator writes them: the album's paging, the live provider, the viewer's list and the reel's resolver, refined in place. Retire the ROADMAP lines the lane makes true in your Handoff: the paged album, the 304 that reads the whole album, the presign cache, switching each surface to rows, `yours-filter`'s move, and the pending Approve branch.

**From `album-window`'s Handoff (merged at eefe54d7):**
- Thread the step from `resolveRowStep` into the server's first paint.
- Add a View menu `kind: "density"` group (with `perRow` words).
- Hand `onWindowChange` ids to the link store and the likes seed.
- Open `?photo=` through `albumRef.scrollToId`.
- Run host select mode through `selection`.
- Retire `TILE_SIZES`, `resolveTileSize`, `useTileSize` and `TileSizeControl` with the last masonry surface.
- `album-columns` draws on the windowed rows; the board retires once both surfaces are wired. `scripts/album-perf.mjs` is yours: give it a `--page` mode for the real guest and host pages (the scale probe's token is disposable test data in `docs/systems/testing-verification.md`'s fixtures), which `album-host-wiring` also runs.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` whole; every guest album, viewer, reel and profile test green or reshaped with its reason; the budgets above measured and reported; the scale-probe album at 375 and 1440 on localhost, scrolled top to bottom and back, a second device's upload arriving while deep, a hide deep in the album, the viewer walked across the whole album, and the reel's tile and view playing from the manifest.

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
