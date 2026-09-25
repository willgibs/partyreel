---
track: album-host-wiring
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "64fbd28c"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(app)/dashboard/[eventId]/
  - src/components/app/event-feed/
  - src/components/app/host-media-grid
  - src/components/app/event-uploads
  - src/components/app/host-selection-provider
  - src/components/app/recently-deleted-grid
  - src/components/app/media-grid
  - src/lib/event/
  - src/app/api/events/
  - src/lib/db/queries/media
  - src/lib/db/mutations/media
  - src/lib/db/queries/likes
  - src/lib/db/mutations/likes
  - src/components/likes/
  - supabase/migrations/20260926300000_like_many
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/album-columns.json
  - src/lib/events/album-wire.ts
  - src/lib/events/album-host-links.ts
  - src/lib/db/queries/album-host.ts
  - src/lib/album/store.ts
  - src/lib/album/links.ts
  - src/lib/shared/album-window.ts
  - src/components/shared/album-window.tsx
  - src/components/shared/album-tile.tsx
  - src/components/shared/density-control.tsx
  - scripts/album-perf.mjs
---

# lp/album-host-wiring

**Goal.** Move the host's event page onto the paged album: the hub's album on a manifest and a first window of links, the justified rows mounted around the viewport with Will's `album-columns` round-2 picks, a delta poll on the album's version instead of re-rendering the whole page, select mode on the same grid, the bin on a manifest, and Sort live. The same lag Will felt on the guest album lives on the host's page, which re-reads and re-presigns everything on each refresh.

## The brief

`album-window` (the windowed rows, `AlbumTile`, the three steps, `DensityControl`, selection props on the one grid) and `album-pages` (the host's reads and links, `/api/album/host/[eventId]/{sync,media,manifest}`, the store) are merged. `album-guest-wiring` wires the guest's surfaces beside you and owns the shared grid and viewer files. When you need a change there, make it additive in your Handoff's exceptions, or take its props as that lane leaves them: sync past its merge before you hand off.

**The hub's album** (`/dashboard/[eventId]`, `EventUploads` → `HostMediaGrid`):
- **Today** the page awaits `listEventMedia` whole and presigns every item before it renders, and `EventLive` calls `router.refresh()` on every doorbell ping, re-reading everything.
- **Instead:**
  - The page embeds the host manifest and the first window's links.
  - The album renders `AlbumWindow` in rows with his picks: `arrival=push`, `steps=both` (View's slider, pinch, ctrl-wheel), `rhythm=double`.
  - `EventLive` moves onto the host `sync`, and the album never again refreshes the page.
  - The host fingerprint route (`/api/events/[eventId]/live`) retires wherever the version answers it, with the review queue's count kept correct.
- **The host's links** carry each item's like count per window, and the host manifest carries the quick-add key (`guest_id` already rides the host-scope delta), per `album-pages`' deferral.
- **The hidden slice:** `readEventMedia` takes a hidden slice, so the creator's hidden read stops reading the whole album (the clip lane's deferral).

**Select mode** runs on the same grid through the selection props: no swap to `SelectableMediaGrid` and no remount, and a selection toggle re-renders one tile. Select-all takes every manifest id and is sent in batches of `MAX_BULK_ITEMS`. Bulk Like over a big selection becomes one call: a `like_many(uuid[])` migration (`20260926300000_like_many.sql`, the house's grants and the anon revoke, the row cap respected) replaces `likeMany`'s one `like_media` per id. Hand its SQL over and end your turn with one line, "migration ready at <sha>"; the Orchestrator applies it and messages you.

**The bin** loads a manifest of removed items and presigns per window, instead of reading and presigning the whole 30-day bin.

**Sort** goes live: the host's disabled "Oldest first" reverses the manifest with the engine's start anchor.

**Measure** with `scripts/album-perf.mjs` on a production build against the scale probe's hub (1,145 approved, signed in through the Google account chooser as willg97, never a password) at 1440x900 and 375x812:
- album DOM nodes under 2,000;
- no running animation at rest;
- a toggle re-rendering one tile;
- no page refresh on an arrival;
- the first load's transfer.

Report before and after.

**`host-app.md` belongs to `reel-sweep` until it merges**, so put its lines in your Handoff and the Orchestrator writes them, refined in place (the hub's album, select mode, the bin, Sort). In your Handoff, retire the ROADMAP lines you make true: `likeMany`'s fan-out, the hub's `(event_id, updated_at)` index idea if the fingerprint retires, and the host half of the paged album.

**From `album-window`'s Handoff (merged at eefe54d7):**
- Thread the step from `resolveRowStep` into the server's first paint.
- Add a View menu `kind: "density"` group (with `perRow` words).
- Hand `onWindowChange` ids to the link store and the likes seed.
- Open `?photo=` through `albumRef.scrollToId`.
- Run host select mode through `selection`.
- Retire `TILE_SIZES`, `resolveTileSize`, `useTileSize` and `TileSizeControl` with the last masonry surface.
- `album-columns` draws on the windowed rows; the board retires once both surfaces are wired. `album-guest-wiring` gives `scripts/album-perf.mjs` a `--page` mode for the real pages; use it once that lane merges, or measure the hub with the harness as it stands.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` whole; every host grid, selection, bin and likes test green or reshaped with its reason; `like_many`'s rolled-back check with the Orchestrator; the budgets above measured and reported; the scale probe's hub at 375 and 1440, scrolled, selected all and bulk-hidden in batches, the bin opened, Sort flipped, and a guest's upload arriving without a page refresh.

## Questions (a recommended answer each; the Orchestrator relays them)

- **The bin on a phone.** At phone width Deleted offers no Restore and no Delete permanently: the tile's pane is
  desk-only (a phone tile carries marks, every action lives in the viewer) and the bin's viewer is read-only, so a host
  on her phone opens the bin and can act on nothing in it. It predates this lane (the tile rule met a read-only bin
  viewer); the walk at 375 found it (`walk-375.json`: 0 Restore controls). Recommended: the bin's viewer takes the two
  verbs, as the album's viewer takes the album's. Not built: it is a bin mode on `media-lightbox`'s curate group,
  `album-guest-wiring`'s file, and that lane is rewriting it; one ROADMAP line below.

## System-doc edits (in place, owned facts only)

- none (`host-app.md`, `database-security.md` and `design-system.md` lines are in the Handoff for the Orchestrator)

## Deferred (ROADMAP one-liners, bucket named)

- Host: at phone width Deleted offers no Restore or Delete permanently (the tile's pane is desk-only and the bin's
  viewer is read-only), so a host on her phone can open the bin and act on nothing in it; the bin's viewer takes the
  two verbs, as the album's viewer takes the album's (from `album-host-wiring`).

## Handoff (replaces the chat report)

- **A resume.** The first agent died mid-work at 09:09 ET (the Orchestrator's usage limit); I took the worktree as it
  stood (`03db94e5` pushed, `loading.tsx` uncommitted) and finished from there. No reset, no rebase.
- **Commits, pushed** (the head is the chat line): `f6a5fe12` the `like_many` migration (applied; types at
  `14359c94`), `c91a9573` the first sync, `03db94e5` the hub's album on the paged album, `7f97a93e` the skeleton's
  comment, `5ac16b22` the sync (merged `origin/launch-prep` at `d0393bfd`: door-flow, retire-reel-boards), `362f5ce0`
  the Reel card's Off, the bin's list read again, the album's writes through the album and the lab's fake server,
  `89dae834` the bin's re-mint timer. launch-prep has moved since (crumbs at `4cdfd902`, the reel drop's types at
  `d6337a94`): neither touches a file of this lane, and no line here names a dropped object, so no sync (PROGRAM.md).
- **Gates on `89dae834`**, each on its own exit code: `pnpm typecheck` 0, `pnpm lint` 0 (the six warnings are in five
  files this lane never touched), `pnpm test` 0 (483 files, 5,352 tests), `zsh scripts/build-lock.sh pnpm build` 0,
  `pnpm lab:smoke --base http://localhost:3134` 0 (274 checks, 0 failing). No board, so no `lab:demo`. The first
  full run after the sync failed one test outside this lane, `password-gate.test.tsx`'s "a stalled hold turns the
  button into Retry"; it passed alone three times and in the full runs at `362f5ce0` and `89dae834`: a timing flake
  under load, worth a look if it recurs.
- **Integration with `album-guest-wiring`, tried in scratch:** `git merge-tree` of this head and its `425ee158` is
  clean (tree `b12c4e66`); that tree typechecks, its album, host, likes and shared tests pass (82 files, 1,036), and
  its production build walks the hub below at both widths. Either lane can land first.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): the owned paths and this file, plus:
  - `src/app/(dev)/design/album-scale/host-surface.tsx` (new) and `page.tsx` (a `?surface=host` branch): the hub
    sits behind a sign-in a local server cannot complete, so its album is measured and walked there (the brief's
    "measure the hub with the harness as it stands");
  - `src/app/api/album/host/[eventId]/media/route.ts` and its test: the host's links route calls the one builder
    `readHostLinksBody`, which adds each item's like count (the brief's like counts per window);
  - `src/app/api/album/host/[eventId]/sync/route.ts`: one comment named the retired fingerprint route;
  - `src/lib/events/album-wire.ts` (a read): the additive `HostAlbumLinksBody` (the links answer plus `likes`), in
    the wire contract's one home;
  - `src/lib/events/host-fingerprint.ts` and its test: deleted with the route they served (`/api/events/[eventId]/
    live`, owned), the brief's "the host fingerprint route retires";
  - `src/lib/reel/clip-hidden-action.ts` and its test: the creator reads the new `hidden` slice (the brief's hidden
    slice, the clip lane's deferral).
- **The items:**
  - The page embeds the host's first sync (`planHubManifest`, the sync route's own planner and validator) and the 96
    newest items' links (`readHostLinksBody`, the links route's one builder); `HostAlbumProvider` replays them into
    the store (`seedingTransport`), so the first poll is a 304 when nothing moved.
  - The album is `MasonryColumns` in the windowed rows with his picks (`rowRhythm="double"`, the push arrival, the
    density step from `pr_tile_size` on the first paint, View's slider, a pinch, ctrl and the wheel).
  - `EventLive` reads the store; the doorbell, a fallback poll (12s with the socket down, 60s up, paused while
    hidden) and each write's catch-up call `sync()`; nothing refreshes the page. The fingerprint route and
    `countEventMedia`, `readAlbumCounts` and `readNewestAlbumUpdate` are gone; the Review and Reel cards follow the
    store's counts and flags.
  - Select mode on the one grid (`selection`, no second grid); select-all takes every manifest id; Hide, Show and
    Delete go in batches of `MAX_BULK_ITEMS`; bulk Like is `like_many`, one call a batch.
  - The bin (`lib/event/bin.ts`, `/api/events/<id>/bin` and `bin/media`): a list with no links, read on each choice
    of Deleted, links minted per window and re-minted every five minutes while it is open.
  - Sort is live: Oldest first is the manifest reversed and laid from its start.
  - The host's links carry each item's like count (`media_like_counts`); `readEventMedia` takes a `hidden` slice.
  - Fixed in this resume: the Reel card kept "live" after Settings switched the reel off, until a reload
    (`reel-card.test.tsx` pins it); a Deleted list kept for the island's life hid what the host had just deleted
    (`recently-deleted-grid.test.tsx`; `event-hub.test.tsx`'s "and only once" pin reshaped with its reason).
- **Measured** (scratch: `/Users/gibby/local/ai/partyreel-wt/_scratch/album-host-wiring/`, `perf-host-before.*`,
  `perf-host-after.*`, `select-*.json`, `walk-*.json`). `scripts/album-perf.mjs` on production builds of
  `/design/album-scale?surface=host` over the same 1,145 photographs: before is launch-prep `761c5390`'s hub album,
  rebuilt in scratch as the page rendered it (the whole list presigned into `HostMediaGrid`'s masonry, an arrival the
  whole list again as `router.refresh()` handed it); after is `89dae834`.

  | 1,145 photographs | before 1440x900 | after 1440x900 | before 375x812 | after 375x812 |
  | --- | --- | --- | --- | --- |
  | album DOM nodes at rest (the most in a fling) | 23,124 (23,124) | 775 (1,407) | 23,121 (23,121) | 516 (904) |
  | tiles mounted, heap | 1,145, 30 MB | 38, 10 MB | 1,145, 30 MB | 25, 9.5 MB |
  | load: style recalc, long frames | 283 ms; 65, 56, 91, 207, 87 | 16 ms; 69, 62 | 246 ms; 55, 74, 199, 85 | 14 ms; 60 |
  | first load's transfer (images) | 11,175 KB (10,303) | 3,830 KB (3,003) | 5,173 KB (4,300) | 2,873 KB (2,045) |
  | running animations at rest | 0 | 0 | 0 | 0 |
  | fling p95 | 16.8 ms | 16.8 ms | 16.7 ms | 16.7 ms |
  | a like; a quiet poll | 0 tiles + 2 marks; 0 | 0 tiles + 2 marks; 0 | the same | the same |
  | an arrival | a page refresh: 20.4 ms, 3 tiles, 414.7 px moved | none: 12.3 ms, 0 tiles, 0 px | 26.4 ms, 3 tiles, 264.3 px | 12.0 ms, 0 tiles, 0 px |
  | entering select mode | 53.4 ms: all 1,145 tiles torn down, 1,145 toggles mounted | 7.9 ms: the 38 re-render once, none remount | 62.8 ms | 10.5 ms, the 25 |
  | a toggle | 12.3 ms, every tile | 3.3 ms, one tile | 10.9 ms | 4.4 ms, one tile |

  Select-all reads 1,145 of 1,145, and deep in the album the mounted tiles stay selected (69 at 1440, 35 at 375). The
  real hub before, on the alias (build 9, willg97, the first agent's measure in Will's Chrome at about 1412x840): 22,917
  album nodes over 1,145 tiles, an HTML of 303,608 B transferred and 7,497,741 B decoded, three presigns an item
  (3,435) on every render, and every doorbell ping or changed fingerprint re-ran it; its 30 running animations were
  counted in a hidden tab, where images never finish loading and a tile's shimmer runs until one does (the foreground
  harness counts 0 before and after). After, per render: the seed from the same
  reads on the scale probe, 190,921 B raw (44,424 gzip, 35,397 brotli), and 288 presigns (96 × 3) plus the card's
  four stills; an arrival is one conditional poll (a 304 reading one row, or a delta by id) and the new tiles' links
  once mounted.
- **The walk** (`cdp/walk.mjs`, the hub's real components over the lab's fake server; `walk-1440.json`,
  `walk-375.json`, `walk-*-2500.json`, and on the merged tree `walk-merged-*.json`), at 1440x900 and 375x812, all
  passing: scrolled to the end (84,396 px at 1440; every tile in view at the bottom drawn); Select, All (the bar reads
  1,145), Hide in one batch (2,000 + 500 at 2,500 photographs), caught up in 24 to 56 ms with every mounted tile
  dimmed, then Show the same way; three deleted, Deleted listing exactly those three with three link ids asked,
  Restore at 1440 (none at 375: the Question), Deleted chosen again reading the list again; Sort to Oldest first
  (the oldest leads) and back; an arrival with no document or `?_rsc=` request. The signed-in walk on the scale
  probe itself waits for build 10: a local server cannot sign in (the chooser returns to partyreel.com), and the
  Chrome extension never connected to this session.
- Assets requested from Will: none
- Board ideas: none
- Proposed migrations / Worker / Vercel / Stripe / env changes: none (`like_many` is applied)
- **Lines for the Orchestrator to write, refined in place:**
  - `host-app.md`, "The hub is live": the album is the page's store (`event-feed/host-album.tsx`, the pure half
    `lib/event/hub-album.ts`), seeded with the host's first sync and its validator and moved by `sync()` on the
    doorbell, a fallback poll (12s with the socket down, 60s up, paused while hidden, asked again on return) and each
    write's catch-up; the host's version answers every question (`/api/album/host/<id>/sync`: a 304 that read one
    row, a delta by id, a manifest past 500 changes), so nothing refreshes the page. ★ The poll is not redundant with
    the socket: the doorbell fires only on the approved-visible set, and the host's version, which every status change
    moves, is how a held upload reaches the one person who can approve it (the Review card counts it). `HostMediaGrid`
    marks arrivals by diffing ids, never links, and a host album never staggers.
  - `host-app.md`, "The album": the bin is the paged album's shape (`lib/event/bin.ts`): choosing Deleted reads its
    list (`/api/events/<id>/bin`: ids, shapes and countdowns, no links), again on every choice so what was just
    deleted is there, its rows mint links per window (`bin/media`) and re-mint them every five minutes while it is
    open, and bin items never count in the album.
  - `host-app.md`, "The hub's album is read whole" becomes "the paged album's": the page plans the host's first sync
    (every item but the bin, light, each status in its flags) and mints links for the 96 newest (`FIRST_WINDOW`,
    `readHostLinksBody`, with each item's like count); the windowed rows ask for the rest by id. Every number is
    counted in the version's snapshot (approved + hidden, and pending), never a list's length. The Reel card's
    threshold reads the manifest's flags (`isPlayableEntry`), its stills are the reel's take planned on the server
    (`readHubReel`), asked again when its state moves (`refreshHubReelAction`), and the page's face wins when it
    changes. The album's writes never revalidate the hub; each asks the store to catch up. The `live` slice stays
    Download all's.
  - `host-app.md`, "The View menu": Tile size is the rows' three density steps (the slider, a pinch, ctrl and the
    wheel) in `pr_tile_size`, painted by the hub; Sort is Newest first or Oldest first (the manifest reversed, laid
    from its start, so an arrival lands at the end).
  - `host-app.md`, "Album bulk select": select mode runs on the one grid through `selection` (no second grid, no
    remount; a toggle re-renders one tile); select-all takes every manifest id, mounted or not, and Hide, Show and
    Delete send it in batches of `MAX_BULK_ITEMS`. "Bulk Like loops its idempotent RPC" becomes one `like_many` call
    a batch under one summary toast, the refused ids reverted. The line on "the select grid passes the same
    `clampAspect`" goes: there is no second grid.
  - `host-app.md`, the highlight reel: "the hub reads the album whole so the card's threshold and stills sit on it"
    becomes "the card's threshold reads the album's manifest, and its stills are the reel's take".
  - `database-security.md`: the likes bullet names `like_many` (authenticated-only, SECURITY INVOKER, each id
    through `like_media`, so `like_media` stays the only insert; at most 2,000 ids a call) and says the counts are
    host-only through two paths, `get_event_like_counts` and `media_like_counts`; the service-role list gains
    `media_like_counts` (an INVOKER read the host's links route and the hub page call after their `getEvent` check).
  - `design-system.md`, the album tile's `/design/album-scale` line: `?surface=host` is the hub's album (its store,
    select mode, bin and View menu) over one fake server answering the poll, the writes and the bin's routes as the
    real ones do.
- **ROADMAP lines this lane makes true:** retire "Performance: the hub's live poll reads the newest `updated_at`…"
  (the fingerprint is gone) and "Likes: the album's bulk Like (`likeMany`…) fires one `like_media` per selected id…"
  (`like_many`). Refine "Album: switch each surface to `layout="rows"`…" (the host feed, its bulk select and the bin
  are on the rows; the guest album, the profile feeds and the skeletons remain), "Albums: the host's and the guest's
  album, and the guest poll, read every row…" (the host's half is paged), "Host: the gallery doorbell rings only
  when…" (the hub's store bridges it by polling the host's version on the same cadence; a host channel would make it
  instant, and the fingerprint route is gone) and "Host: the View menu's Sort ships disabled…" (Sort is live; a size
  sort remains, and needs a size the manifest does not carry). Add the Deferred line above.
- **Calls his to overrule:**
  - The quick-add key stays on the server: the host manifest carries no `guest_id`; the Reel card's take is planned
    over the pool's rows (`readHubReel`) and asked again when the card's state moves, so the client never plans a
    take (`album-pages`' deferral, closed that way).
  - The first paint links the 96 newest items; a denser step asks for its tail through the window's first request.
  - The album's own writes no longer revalidate the hub (each asks the store to catch up, and the optimistic
    overlay holds until it has); the Review room's two bulk verbs still revalidate, since it renders its queue on the
    server.
  - Sort resets to Newest first on each visit (it is not remembered, unlike the density step).
  - The Reel card flips on the photograph that makes the guest's reel appear and draws plain until the server's take
    lands; the Review card's count moves with the poll (within 12s with the socket down, 60s up).
  - Deleted reads its list on every choice (one light request, the last list on screen meanwhile).
- **Look at first:** build 10's red-team on the scale probe's hub at 1440 and 375 (willg97 through Chrome's account
  chooser): scroll to the end; Select, All (1,145), Hide, then Show; delete three, find them in Deleted, restore one
  at 1440; Sort both ways; a guest's upload landing with no page refresh (the network shows the host's `sync`, never
  `?_rsc=`); and the page's HTML against the before's 303,608 B. Then the phone-bin Question.
