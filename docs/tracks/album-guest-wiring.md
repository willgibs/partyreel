---
track: album-guest-wiring
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
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

- none: nothing here needed Will's word; the two calls built are under "Calls his to overrule".

## System-doc edits (in place, owned facts only)

- none by the lane (it owns no doc): `guest-flow.md`'s and `reel.md`'s lines are in the Handoff for the Orchestrator.

## Deferred (ROADMAP one-liners, bucket named)

- Now: the viewer asks the links route once per step (the link store batches per tick only, `src/lib/album/links.ts`), so a held arrow key walking the 1,145-photo probe made 1,092 asks and a photograph 100 steps on waited 1 to 6 s for its link on localhost's six connections (at 3 and 10 steps a second every photograph arrived drawn); coalesce a burst's asks (from `album-guest-wiring`).
- Now: the rows engine settles near-ties on the last bit of `Math.log` and `**`, which Node's V8 and a browser's round differently (5 to 10% of inputs, Node 22 against Chrome 153); the first paint now hydrates with the server's plan, but any second laying of the same rows in another engine can still break differently (the measured rows at the remembered width against the server's first paint): make `layoutRows`' cost comparisons tie-robust in `src/lib/shared/album-rows.ts` (from `album-guest-wiring`).
- Code hygiene: `TILE_SIZES`, `resolveTileSize`, `useTileSize` and `TileSizeControl` serve only the Library's gallery demos now that every album is rows (`album-window` asked them retired with the last masonry surface); retire them with the demos' control (from `album-guest-wiring`).
- Code hygiene: `src/components/ui/dialog.tsx`'s `fullScreen` comment says Radix's scroll lock lives on Content; it lives on the Overlay, which `fullScreen` omits, so a takeover built on it scrolls the page under it and keeps a desk's scrollbar (no product surface uses it today; the reel view's fix is the shape: the content inside a transparent Overlay) (from `album-guest-wiring`).

## Handoff (replaces the chat report)

- Commits, all pushed on `lp/album-guest-wiring`: work `47664b1b` (the predecessor's checkpoint), `4d59c838`, `425ee158`, `bf516eea`, `1b0b8278`; syncs `0254142e` (hardening, reel-sweep, door-flow, retire-reel-boards) and `899be20d` (album-host-wiring at `7130d26d`, crumbs, the stored reel's drop); launch-prep had not moved past `74928b7b` at handoff.
- Gates on `899be20d`, each on its own exit code: `pnpm typecheck` 0; `pnpm lint` 0 (6 warnings, none in the lane's files); `pnpm test` 0 (482 files, 5,401 tests); `zsh scripts/build-lock.sh pnpm build` 0; `pnpm lab:smoke --base http://localhost:3131` 0 on `pnpm dev` (272 checks) and `--production --key` 0 on `pnpm start` (278 checks). Logs: `/Users/gibby/local/ai/partyreel-wt/_scratch/album-guest-wiring/gate2-typecheck.log`, `gate2-lint.log`, `gate2-test.log`, `gate2-build.log`, `gate2-lab-smoke-dev.log`, `gate2-lab-smoke-prod.log`.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` is owned paths, plus four exceptions (this file joins with the handoff commit):
  - `src/app/(dev)/design/sandbox/media-viewer/album.tsx`: type-forced, `buildGuestViewGroups` takes the density step now (the board's drawn View menu).
  - `src/components/app/my-likes-gallery.tsx`, `my-uploads-gallery.tsx`: the profile feeds' grids, the brief's own "feeds onto rows" (`layout="rows"`, the step).
  - `src/components/guest/guest-upload.test.tsx`: its progress test reads the queue's progress store (progress left the queue snapshot so a tick stops re-rendering the page); the scar, progress reaching the tile at 50%, kept.
  - `src/lib/reel/quick-add.ts`: exports the brain's score (`quickAddScores`, `quickAddVideoCap`) so the take scores the album once a loop; one brain, never a copied formula.
- The items:
  - The guest album on the paged album: the page embeds the seed (the manifest by the sync route's own `planAlbumSync`, its validator, the first paint's links); `GalleryLiveProvider` on the album store and `/api/album/guest/sync` (deltas by id, 304, resync, the stricter-drift guard, the cookie heal); `/api/guests/gallery` retired with its fingerprint and reconcile helpers (`47664b1b`).
  - The rows with `album-columns` r2's picks (push, both steps, the double rhythm), links and hearts per window, the stack tile on its own progress store, Yours over the manifest (moved to `src/lib/guest/`), a rows skeleton, the first paint at the remembered width (`pr_album_w`) (`47664b1b`).
  - The viewer over the whole album (`onNeedLinks`: ±1, the filmstrip ±7; unlinked items are placeholders, never requests), `?photo=` of an unloaded item and its way back through `scrollToId`, the pending Approve branch gone (`47664b1b`).
  - The reel on the manifest and the resolver (links by id, about two windows ahead), `planTake` O(n log n) (6,000 items about 610 ms to about 5 ms), the tile on the take's first pass, the watchdog by id; the profile feeds on rows; `album-perf.mjs --page` (`47664b1b`).
  - The reel tile stands from the first paint, its stills' links riding the seed (1440's CLS 0.1292 to 0.0001); the page mode budgets the album's own animations (`4d59c838`).
  - Build 9's two findings: the reel view sits inside a Radix Overlay, the page's scroll lock (body locked, the 15px scrollbar gone, six wheel turns move nothing); the tile's watch layer and press live on the card, not the column's gutters (`425ee158`; each test fails on the old file).
  - A leaving tile cancels its unfinished download: R2 answers over HTTP/1.1 (six connections), and paging down 1,145 photos left 754 to 809 requests in flight at the bottom, drawn after 12.9 to 18.5 s; now 22 to 36 in flight, drawn in 0.5 to 1.0 s (`bf516eea`; `/Users/gibby/local/ai/partyreel-wt/_scratch/album-guest-wiring/walk-bottom-1440*.txt`, `walk-bottom-375-abort.txt`, `walk-final-bottom-1440.txt`).
  - A viewer walk writes `?photo=` when it rests (300 ms): Chrome drops history calls past 200 in 10 s, so a held arrow key left the address at the hundredth photo and the close's clear was dropped, leaving a stale `?photo=` behind a closed viewer (`bf516eea`).
  - The rows' first paint hydrates with the plan the server drew (`data-rows-plan`, about 700 bytes, keyed by an integer hash of the list and every parameter): the same plan laid in Node and Chrome differed for 6 of 62 seeds (`/Users/gibby/local/ai/partyreel-wt/_scratch/album-guest-wiring/fp-compare.txt`, `math-compare.txt`), a React hydration error on 3 of 40 loads before (`fp-run.txt`, `walk-hydrate-375-dev15.txt` with React's diff), 0 of 105 after (`walk-hydrate-*-fixed.txt`, `walk-final-hydrate-*.txt`); `firstPaintPlan` also stops at the first row it cannot finish (`1b0b8278`).
- Measured with `scripts/album-perf.mjs --page` on production builds against the scale probe, 1440x900 and 375x812 (before: the predecessor's build of the cut `055baee9`, its output quoted in `/Users/gibby/local/ai/partyreel-wt/_scratch/album-guest-wiring/pred-tail.txt` lines 80 to 120; after: `899be20d`, `/Users/gibby/local/ai/partyreel-wt/_scratch/album-guest-wiring/perf-after-final.txt`, `after-final.json`):
  - album nodes: 16,035 and 16,032 before; after 414 at load, 1,224 at the fling's peak at 1440, and 221 and 583 at 375 (budget 2,000).
  - running animations at rest: 6 before (the tile's crossfade) and 13 and 15 after the fling; after, 0 in the album at both rests (the page's 6 are the reel tile's crossfade, reported beside).
  - the document: 353 KB and 352 KB on the wire before; 110 KB after (budget 150).
  - the quiet poll: before, the old POST answered 304 but re-read the whole album; after, 200 1.0 KB, 200 0.8 KB, then 304 0.5 KB. Its server reads are `album-pages`' (the version row read first, the route's own head comment); not counted here.
  - a head arrival while deep: 0 px moved at both sizes (0 of 19 and 0 of 7 tiles in view).
  - CLS: 0.0001 and 0 cold; with a matching `pr_album_w`, 0 to 0.0004 at 1512x900 and 390x844, at 4x CPU too (the predecessor's runs, `pred-tail.txt` lines 320 to 342); fling p95 16.7 and 16.8 ms.
- The Verify walk, in headless Chrome over CDP (`/Users/gibby/local/ai/partyreel-wt/_scratch/album-guest-wiring/walk.mjs`; Will's Chrome extension was not reachable this session):
  - top to bottom and back: 1440, 94 screens each way, at most 1,139 album nodes, every tile in view linked and drawn (p95 515 ms), 0 errors; 375, 157 screens, at most 655 nodes, p95 313 ms (`walk-scroll-1440-abort.txt`, `walk-scroll-375-abort.txt`).
  - a second device's upload arriving while deep: the harness's hide and re-approve of the album's newest moved 0 px at both sizes; a real upload cannot run on localhost, so the alias's red-team walks it.
  - a hide deep in the album: the tile mid-screen goes 748 to 898 ms after its write and the count drops; the rows re-justify with the glide (1440: 11 of 12 tiles moved, up to 556 px; 375: 7 of 12, up to 178 px, the rows above it still); re-approved it returns to its exact place; hidden under an open viewer, the viewer closes and the address clears (`walk-hide-1440.txt`, `walk-hide-375.txt`).
  - the viewer across the whole album: 1 to 1,145 by the arrow key in 41 to 43 s with no press lost, no wrap past the end, back 100, and Escape mounts, shows and focuses tile 1,045; `?photo=` of the oldest opens "Photo 1145 of 1145" cold and closes onto the last tile (`walk-viewer-1440b.txt`, `walk-final-viewer-375.txt`, `walk-deeplink-*.txt`, `walk-pace-*.txt`).
  - the reel: the tile's six stills drawn from the seed; a tap in the gutter stays shut; the view opens from 3,000 px deep, asks links ahead by id (six asks), a tap on the picture opens the viewer over it (two locks), each Escape closes one, back at 3,000 px; the Style menu scrolls inside the lock at 812x375 (`walk-final-reel-1440.txt`, `walk-reel-375.txt`, `walk-menu-812x375.txt`). R2's CORS answers localhost with no Allow-Origin (68 to 72 refusals a run), so the canvas's drawing is proven on build 10's alias by the Orchestrator's red-team.
- `guest-flow.md`, for the Orchestrator to write in place:
  - "CODE noun stays: `/api/guests/gallery`, ...": the route is `/api/album/guest/{sync,media,manifest}`; `/api/guests/gallery` and `gallery-fingerprint.ts` are gone.
  - "M is seeded by the page RSC and kept current by the gallery poll": by the album's sync (`/api/album/guest/sync`), `guestCount` still on a 200 only.
  - "**Masonry gallery**" becomes "**The album, in justified rows**" (`gallery-rows.tsx` over `MasonryColumns layout="rows"`, windowed by `album-window.tsx`): `album-columns` r2's picks (an arrival pushed in from its left edge while what it moved glides; three steps from View's slider, a pinch, or ctrl and the wheel, kept in `pr_tile_size`; now and then a landscape leads a row at twice the height, the visit's seed drawn on the server, never at one a row). Only the rows around the view are mounted; a photograph's link and heart load when its row mounts; a tile whose row leaves cancels its unfinished download (R2 answers over HTTP/1.1, six connections). ★ The first paint is the server's: rows per width class at the width the album last laid them (`pr_album_w`, path-scoped; nominal cold), links for exactly those photographs (`firstPaintIds`), and the hydration draws the plan the server wrote on the grid (`data-rows-plan`), never its own (the engine's logs and powers round differently in Node and a browser). The Yours filter runs over the manifest (the device's own ids met with it; the count stays the album's). A photograph with no link yet is a loading tile, never a request. The skeleton lays rows on `ROW_CLASSES` at the step, as the first paint does.
  - The lightbox: ★ its list is the whole album (the manifest, mostly unlinked), so next and previous cross all of it and its name reads "Photo k of N" over the album; it asks `onNeedLinks` for the photograph ±1 and the filmstrip's ±7, and an unlinked item is a placeholder at its own shape. The ADDRESS: `?photo=` opens any item the manifest holds, loaded or not, and the way back mounts its tile (`scrollToId`); a walk writes the address when it rests (300 ms, the browsers' history caps), an open and a close at once.
  - The hearts: seeded per window, the ids the rows mount and the viewer asks for.
  - Live gallery, "Architecture": `GalleryLiveProvider` runs on the paged album's store (`src/lib/album/store.ts`: the manifest, its version, links by id); the doorbell and the fallback poll both call its one `sync()`; the page streams the seed in (`loadGallerySeed`) and the store adopts it as its first sync, answered locally.
  - "A presigned URL is read by id ...": a link is read by id when needed and re-minted before it ages (`ensureLinks` for a window, `onNeedLinks` for the viewer, `clips` for the reel); the watchdog re-mints only the ids whose picture failed, at most once a minute each, never in the demo.
  - "The conditional poll": a quiet album answers a bare 304 having read its version row; a change answers the delta since the version held, merged by id and checked against the server's count (a mismatch heals with a fresh manifest).
  - The ETag invariant: the validator is `guestAlbumEtag` (`album-validator.ts`: access, gate, the album and attribution versions, the reel's facts; the teaser's adds its bucket); at full no bucket, since links ride their own asks.
  - "Reconcile by id": `reconcile-album-items.ts` rebuilds only an item whose entry, link, blob or name changed, so a sync touches no tile it does not change.
  - "Optimistic tiles": an approved completion goes in at the file's measured shape (square after 400 ms), its object URL re-keyed from the queue id to the media id so the picture never reloads; `merge-gallery-items.ts` is gone.
  - "What THIS DEVICE draws at the album's head": the rows' head slots (`gallery-rows.tsx`), a square each; the stack subscribes to the queue's progress store (`useQueueProgress`), so a tick re-renders its bar, never the album.
  - "The ARRIVAL": `newArrivalIds` lives in `reconcile-album-items.ts`; the rows push an arrival and glide what it moved, and a head arrival while the reader is deep scrolls by exactly how far the photograph at the view's top moved (the columns sentence goes).
- `reel.md`, for the Orchestrator:
  - "The brain is quadratic ...": the take is O(n log n): the brain scores the album once a loop (`quickAddScores`) and the passes walk that order (6,000 items about 5 ms, from about 610 ms); the tile's six stills are the first pass's head (`passes: 1`); the hub's `TAKE_POOL` is `album-host-wiring`'s to keep or drop.
  - "It plays the SERVER's approved list": the manifest's drawable entries (`reelItems`, no links), a clip's links read by id through the provider's resolver (`clips`) about two windows ahead (`createClipSource`).
  - The tile: it stands from the first paint (its stills' links ride the seed; a still in flight shows the tile's ground), and its tap is the card's: the page hands it its column and margins as `className`, the watch layer and the press live on the card.
  - The view: held inside a Radix Overlay, the page's scroll lock (RemoveScroll lives on the Overlay, never Content), which also keeps its portaled Style and Hold menus inside the lock and scrollable; "every failure feeds the provider's watchdog", which re-mints only the failing ids.
- `testing-verification.md`, one line for the Orchestrator: the reel's canvas cannot draw on localhost (R2's CORS answers `http://localhost:*` with no Allow-Origin; the alias and partyreel.com get theirs), so its drawing is proven on the alias.
- ROADMAP lines this lane made true, to retire: "Host: the lightbox's pending Approve branch can never render ..."; "Guest: `src/components/guest/yours-filter.ts` moves into `src/lib/guest/` ..."; "Album: switch each surface to `layout="rows"` ..." (the guest album, feeds and skeleton here; the host's feed, select and bin in `album-host-wiring`); "Albums: the host's and the guest's album, and the guest poll, read every row on each load ..."; "Guest: the gallery poll's 304 still reads the whole album ..."; "Performance: a presign cache keyed on (key, disposition, 30-minute bucket) ..." (no poll carries a link now; a roll re-mints only what a device recently asked for); and "Guest: `get_event_media_by_qr_token` and `getApprovedMediaForUnlock` read an album unpaged ..." (already stale: both read keyset pages, and only Download all reads them now). Refine "Host: dead curation code: ..." to `ApproveAllPendingButton` alone.
- The props `album-host-wiring` takes from the shared grid and viewer, all additive and optional: `MasonryColumns` `firstPaintWidth`, `onBoxWidth`, `onViewerNeedLinks`; `AlbumRows` `firstPaintWidth`, `onBoxWidth`; `MediaLightbox` `onNeedLinks` (an item with `url: ""` is a placeholder); `AlbumTile` draws an unlinked item as its skeleton; new exports `album-window-plan.ts` (`firstPaintIds`, `classWidths`, `ALBUM_WIDTH_COOKIE`, `parseAlbumWidth`, `rememberAlbumWidth`, `firstPaintKey`, `encodeFirstPaint`, `decodeFirstPaint`) and `masonry.tsx`'s `abortUnfinishedImages`. The download abort, the address's rest and the served plan need no prop: the host's album has them already.
- Assets requested from Will: none.
- Board ideas: a hide inside the view re-justifies the rows under it (at 1440 the tiles below the hidden one glided up to 556 px); anchoring a hide on its own row, so the rows below hold still, is an `album-columns` motion question.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Calls his to overrule: a tile leaving the album cancels its unfinished download, so scrolling back re-fetches what was cancelled mid-flight; a viewer walk's address follows 300 ms after it rests.
- Look at first: the reel view on build 10 at a desk with scrollbars always shown (no strip, the page still under it, its Style menu at a phone on its side); a fast fling to the album's end on a phone (the bottom's photographs in about a second); a few cold loads of the scale probe with the console open (no hydration error).
