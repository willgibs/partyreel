---
track: album-host-wiring
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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
