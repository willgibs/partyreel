---
track: album-docs
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "0ac99010"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - docs/systems/guest-flow.md
  - docs/systems/reel.md
  - docs/systems/testing-verification.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - CLAUDE.md
---

# lp/album-docs

**Goal.** Write what `album-guest-wiring` made true into the three system docs it could not own, each fact refined in place in its one home, so the guest album, the viewer and the reel read as they now work.

## The brief

`album-guest-wiring` merged at `a474d130`: every guest album is the paged, windowed rows. Its Handoff wrote the lines the Orchestrator owes the docs; read them in full with `git show c1ace8fe:docs/tracks/album-guest-wiring.md` (the sections "`guest-flow.md`, for the Orchestrator to write in place", "`reel.md`, for the Orchestrator" and "`testing-verification.md`, one line for the Orchestrator").

Write each into its doc as CLAUDE.md's "Keeping the docs healthy" asks: find the line or passage it refines (the Handoff names each by its opening words) and rewrite it in place, synthesized in the doc's own voice; delete what is no longer true (the whole-album poll, `/api/guests/gallery`, `gallery-fingerprint.ts`, the masonry gallery, `merge-gallery-items.ts`, the quadratic take); never stack a new note beside an old one, and add no history. Check every fact you write against the code at your tip (the named files and exports exist and say what the line claims); a line the code contradicts goes in your Handoff instead of the doc.

The host's half (`album-host-wiring`, merged at `7130d26d`) is already written in `host-app.md`; keep the guest docs consistent with it where they meet (the store in `src/lib/album/`, the sync routes).

Verify with the doc tests (`src/lib/no-em-dash-policy.test.ts`, `record-depth-policy.test.ts`, `single-source-policy.test.ts`, `content-policy.test.ts`, `src/app/(dev)/design/_data/docs.test.ts`) and `pnpm test`. In your Handoff, list each passage you changed by its new opening words.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The doc tests named in the brief and `pnpm test`, each on its own exit code; every changed passage's facts checked against the code at the tip.

## Questions (a recommended answer each; the Orchestrator relays them)

- none: a doc-accuracy sweep against already-decided code, no product or UX call in it.

## System-doc edits (in place, owned facts only)

- `guest-flow.md`: the album's sync (`/api/album/guest/{sync,media,manifest}`) over the retired gallery poll and
  `/api/guests/gallery` throughout; "Masonry gallery" rewritten as "The album, in justified rows"
  (`gallery-rows.tsx`, `album-window.tsx`); the lightbox's whole-album list, `onNeedLinks` and the address's
  any-manifest-item + `scrollToId` + 300ms-rest behavior; the hearts seeded per window; the live-gallery
  Architecture, presign-read-by-id, conditional-poll, ETag-invariant (`guestAlbumEtag`), reconcile-by-id
  (`reconcile-album-items.ts`), optimistic-tile and head-slot bullets rewritten on the paged album; the ARRIVAL's
  push-and-scroll-anchor behavior over the retired masonry-columns one; the Yours filter's path
  (`src/lib/guest/yours-filter.ts`) and the View menu's Tile-size group rewritten as its Size/density group
  (`resolveRowStep`/`setRowStepAction`); Save's one-tap system-sheet line (save-sheet, merged `88c43fe7`).
- `reel.md`: the take's O(n log n) cost (`quickAddScores`) over "the brain is quadratic"; the reel's played list as
  the manifest's drawable entries plus the resolver's `clips`; the tile's first-paint stills and its
  `className`/card split; the view's Radix Overlay scroll lock and its watchdog's per-id re-mint; Save's one-tap
  platform-action line (save-sheet, merged `88c43fe7`).
- `testing-verification.md`: a new line on the reel's canvas needing the alias (R2's CORS excludes localhost); two
  dead-route fixes (`/api/guests/gallery` to `/api/album/guest/sync`, one in the alias bullet's context and one in
  the presign-roll soak).

## Deferred (ROADMAP one-liners, bucket named)

- Docs: `testing-verification.md`'s presign-roll soak still frames a refreshed link as "the 30-minute bucket
  rolls"; the guest album's own links now re-mint per id at `ALBUM_LINK_REMINT_MS` (an hour) instead (the teaser
  still uses the bucket, and the host album's own timing is unverified here) — the section's opening parenthetical
  wants its own pass rather than a guess folded into this lane's sweep (from `album-docs`).

## Handoff (replaces the chat report)

- Work commits `1da21c82` (the doc rewrite) and `1c2a1cc4` (a rewrap of one line the first commit split mid-mark),
  pushed; no sync commit (launch-prep had not moved past this lane's base, `cb4a5de2`, for any of the three owned
  files: `git diff --name-only cb4a5de2..origin/launch-prep -- docs/systems/guest-flow.md docs/systems/reel.md
  docs/systems/testing-verification.md` was empty even after `retire-album-columns` and `save-sheet` landed).
- Gates on `1da21c82`, each on its own exit code: the five doc tests (`no-em-dash-policy.test.ts`,
  `record-depth-policy.test.ts`, `single-source-policy.test.ts`, `content-policy.test.ts`, `docs.test.ts`) 0, 22
  tests; `pnpm test` 0, 482 files, 5,397 tests; `pnpm typecheck` 0; `pnpm lint` 0 (6 pre-existing warnings, none in
  the lane's files). The five doc tests re-ran 0, 22 tests, on `1c2a1cc4` (whitespace only, so not the whole
  suite again). `pnpm build` and `lab:smoke` not run: a docs-only lane per the spawn brief, and no code path
  reads `docs/systems/*.md` (`docs.test.ts`'s `renderedDocs()` traces only `docs/tracks/` and `docs/specs/`).
  Logs: `/Users/gibby/local/ai/partyreel-wt/_scratch/album-docs/gate-typecheck.log`, `gate-lint.log`,
  `gate-test.log`.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` is the three owned paths plus this file, no
  exceptions.
- The items, each by its new opening words (fact-checked against the code at `1da21c82`'s base, `cb4a5de2`, since
  none of it moved under owned files before this lane's tip):
  - `guest-flow.md` "CODE noun stays: `/api/album/guest/{sync,media,manifest}`, ...": the retired route named.
  - `guest-flow.md` "...kept current by the album's sync (`/api/album/guest/sync`), ...": the M/`guestCount` line.
  - `guest-flow.md` "...and the album's sync's heal (a differing body token), ...": the session-cookie write list.
  - `guest-flow.md` "**The album, in justified rows**" (was "Masonry gallery"): the whole bullet, verified against
    `gallery-rows.tsx`, `album-window-plan.ts` and `gallery-skeleton.tsx`; the page-root COLUMN/BLEED paragraph kept
    (still true, unrelated to the grid engine) with its now-redundant skeleton-count sentence dropped.
  - `guest-flow.md` "**ITS LIST IS THE WHOLE ALBUM**, the manifest, mostly unlinked: ...": new, verified against
    `media-lightbox.tsx`'s `onNeedLinks`/`FILMSTRIP_REACH` (7) and default reach (1).
  - `guest-flow.md` "**THE ADDRESS**: ... it opens any item the manifest holds, loaded or not ...": verified
    against `masonry.tsx`'s `items.some(...)` gate (now true for any manifest entry, since `items` is the whole
    manifest) and its own `ADDRESS_STEP_QUIET_MS` / browser-history-cap comment.
  - `guest-flow.md` "Save offers the system sheet in one tap on iOS ...": the Orchestrator's mid-lane line,
    verified against `share-save.ts`'s `saveChoices` (merged in `save-sheet` at `88c43fe7`).
  - `guest-flow.md` "...seeded through `my_liked_media_ids` with the window's ids ...": the hearts bullet, verified
    against `live-gallery.tsx`'s `likeIds` (window ids ∪ viewer ids) and `likes-provider.tsx`'s still-live
    not-yet-answered dedupe.
  - `guest-flow.md` "**Architecture: ONE live source ...**": the store, `sync()`, and `loadGallerySeed` added,
    verified against `store.ts`, `gallery-live.tsx` and `gallery-access.server.ts`.
  - `guest-flow.md` "**A link is read by id at the moment it is needed and re-minted before it ages**" (was "A
    presigned URL is read by id ..."): the per-id re-mint, not a whole-album refetch.
  - `guest-flow.md` "...a quiet album answers a **bare 304** having read one row, its version; ...": the
    conditional-poll bullet, verified against the sync route's own "A QUIET POLL IS ONE ROW" comment.
  - `guest-flow.md` "**The gallery ETag must never validate ...**": rewritten on `guestAlbumEtag`
    (`album-validator.ts`), verified the function exists and the teaser-only bucket claim against its own
    "NEVER THE PRESIGN BUCKET, AT FULL ACCESS" comment.
  - `guest-flow.md` "**Reconcile by id — do NOT `setState` the raw sync result:**": `reconcile-album-items.ts`,
    verified against its own doc comment and `ALBUM_LINK_REMINT_MS` (an hour, `album-wire.ts`).
  - `guest-flow.md` "**Optimistic tiles only for LIVE-approved media:**": the 400ms/square fallback
    (`MEASURE_TIMEOUT_MS`) added, `merge-gallery-items.ts` marked gone, cross-referencing the existing blob-re-key
    bullet rather than restating it.
  - `guest-flow.md` "**What THIS DEVICE draws at the album's head**, in `gallery-rows.tsx`'s own head slots, ...":
    verified against `gallery-rows.tsx`'s `prefix` slot and `HEAD_RATIO` (square) in `album-window-plan.ts`.
  - `guest-flow.md` "**The ARRIVAL, ...**": `reconcile-album-items.ts` path fixed; the retired masonry-columns
    sentence replaced with the rows' push-and-glide and the scroll-anchor sentence, verified word-for-word against
    `album-window.tsx`'s "NOTHING A READER IS LOOKING AT MOVES" comment.
  - `guest-flow.md` "... **Yours filter** (`yours-filter.ts`" path fixed to `src/lib/guest/`.
  - `guest-flow.md` "... a Size group (`kind: "density"`: ...)" (was "a Tile size group ... disabled below 640"):
    verified against `live-gallery.tsx`'s `buildGuestViewGroups` (no 640/PHONE_MAX gate found there or in
    `view-menu.tsx`) and `tile-size-cookie.ts`'s `resolveRowStep`/`setRowStepAction`.
  - `reel.md` "It plays the SERVER's approved list: the manifest's drawable entries ...": `reelItems`, `clips`,
    `createClipSource` added, verified against `gallery-live.tsx` and `live/source.ts`.
  - `reel.md` "**The take is O(n log n)**" (was "The brain is quadratic"): verified against `live/take.ts`'s own
    "SCORED ONCE, WALKED WITH A HEAP" comment; `TAKE_POOL` confirmed still present (`reel-progress.ts`), so that
    clause needed no change.
  - `reel.md` "**IT STANDS FROM THE FIRST PAINT**, ..." / "**`className` IS THE CALLER'S BOX, NEVER THE CARD'S**":
    both quoted near-verbatim from `live-reel.tsx`'s own comments (the tile bullet).
  - `reel.md` "**HELD INSIDE THE OVERLAY, THE PAGE'S SCROLL LOCK**: ...": quoted near-verbatim from
    `live-reel-view.tsx`'s own comment (the view bullet).
  - `reel.md` "...every failure feeds the provider's watchdog, which re-mints only the failing ids.": tightened
    from `gallery-live.tsx`'s `reportPossibleExpiry`.
  - `reel.md` "Save is one tap into the platform's own action ...": the Orchestrator's mid-lane line.
  - `testing-verification.md` "**The reel's canvas cannot draw on localhost**: ...": new line, the fact carried
    from `album-guest-wiring`'s own Handoff (its live-reel walk hit R2's CORS refusal on localhost).
  - `testing-verification.md` "...filtered to `/api/album/guest/sync`: ...": the presign-roll soak's dead-route
    fix; its "30-minute bucket" framing is left for the Deferred line above rather than guessed at here.
- Assets requested from Will: none.
- Board ideas: none beyond this lane.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Calls his to overrule: none (no product or UX call; every rewrite is a fact already settled by shipped code).
- Look at first: `guest-flow.md`'s "The album, in justified rows" bullet and the View menu's Size-group paragraph
  (the two heaviest rewrites); `reel.md`'s tile and view bullets (quoted close to source comments, worth a second
  read for tone against the rest of the doc).
