---
track: mine-none
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "0b2af407"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/shared/album-tile
  - src/components/shared/masonry
  - src/components/shared/unverified-mark
  - src/components/guest/gallery-rows
  - src/components/guest/guest-masonry
  - src/components/guest/live-gallery
  - src/app/(dev)/design/sandbox/media-viewer/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/media-viewer.json
  - src/lib/guest/yours-filter.ts
  - docs/systems/design-system.md
  - docs/systems/guest-flow.md
---

# lp/mine-none

**Goal.** A guest's own photos wear no mark on the album's tiles (`media-viewer` r3 `mine=none`, overruling `run`): the glass dot comes off, View's Showing (Everyone's or Yours) is how she finds them, and the viewer still credits hers as You; then the media-viewer board retires.

## The brief

**The answer** (`docs/reviews/media-viewer.json`, r3's only question, `mine`): "Nothing on the tiles. No mark at all: View's Showing (Everyone's or Yours) finds them, drawn open here. Once open, the viewer still credits yours as You."

**What production still draws:** round 1's glass dot, `MineMark` (`src/components/shared/album-tile.tsx:103-174`, rendered at `:584-586`, `data-mine` at `:495`). It is a button that toggles the Yours filter, wired through:
- `masonry.tsx:443-452` and `:889-893`;
- `src/components/guest/gallery-rows.tsx:180-182`;
- `guest-masonry.tsx:104-106`;
- `live-gallery.tsx:436-438`.

It is pinned by `masonry.test.tsx:222-229` and `live-gallery.test.tsx`.

**Build.** Remove the mark and every prop and branch that exists only for it. The host's grid keeps its own marks, so read each consumer of the shared tile before removing a prop. Keep what others lean on:
- `unverified-mark.tsx` wears the mark's material (its comment says so), so the material stays wherever it lives;
- the "Showing yours · Show all" line (`live-gallery.tsx:398-411`) stays as the filter's way out; its comment no longer names the mark as the other exit;
- the View menu's Showing group appears only when she owns a photo (`live-gallery.tsx:111`);
- the viewer's "You" (`media-lightbox-parts/credit.tsx:82`) is untouched.

A reshaped test keeps its real scar and says what it now pins: no mark, and the filter reachable from View.

**Then retire `media-viewer`** in your branch, in one commit: its folder, and its lines in `registry.ts`, `boards.ts` and `touchpoints.ts` (SandboxId, RULINGS, DESK_ORDER). These are your named exceptions; the album-columns retirement `95c8aa56` is the template. The Orchestrator deletes its ledger.

**Doc lines** go in the Handoff for the Orchestrator: `design-system.md:320` and `guest-flow.md:202` describe the mark.

**Neighbours.** `guest-door` owns `event-experience.tsx` (which mounts the album) and `src/lib/guest/`; `yours-filter.ts` is your read. If removing a prop needs one line in one of them, name it as an exception with the reason.

**Verify** on the scale probe:
- a guest who owns photos sees no dot on any tile, at 375 and 1440;
- View → Showing → Yours filters, and "Show all" returns;
- the viewer says You;
- the host's hub is unchanged;
- `pnpm lab:smoke` passes whole (the Library renders the tile).

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` whole when the lane changes anything under `src/` but tests (the Library renders the product's components); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- none: r3's ruling ("Nothing on the tiles... View's Showing... finds them... the viewer still credits yours as
  You") left nothing to interpret; built as written.

## System-doc edits (in place, owned facts only)

- none: `design-system.md` and `guest-flow.md` are this lane's `reads`; their lines are in the Handoff, for the
  Orchestrator.

## Deferred (ROADMAP one-liners, bucket named)

- none

## Handoff (replaces the chat report)

- Scratch artifacts (gate logs) are in `/Users/gibby/local/ai/partyreel-wt/_scratch/mine-none/`; never the repo.
- Work commits `784d7500` (the mark's removal; View's Showing is the one door) and `24e302e6` (media-viewer
  retires). No sync commit: `origin/launch-prep` moved once since the cut (`1a455e5f` → `1de4fd42`), a record-only
  "pickup" touching `docs/STATUS.md` and `docs/tracks/orchestrator.md` alone (PROGRAM.md: a sync that only brings
  records costs a full gate for nothing). Both commits pushed on `lp/mine-none`; the head is this manifest's own
  commit.
- Gates on the synced tree (`24e302e6`, unsynced per above — record-only upstream), each on its own exit code
  (logs in `_scratch/mine-none/gate-*.log`): `pnpm typecheck` 0; `pnpm lint` 0 (0 errors; its 6 warnings sit in 5
  files this lane never touched); `pnpm test` 0, 5,472 passed across 484 files; `zsh scripts/build-lock.sh pnpm
  build` 0; `pnpm lab:smoke --base http://localhost:3132` 0, 255 checks, 0 failing (the one 500 is
  `/design/lab/tools/boom`, its own permanent intentional boundary probe, unrelated).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = 13 owned paths (`album-tile.tsx`; `masonry.tsx`
  and its test; `unverified-mark.tsx`; `gallery-rows.tsx`; `guest-masonry.tsx`; `live-gallery.tsx` and its test; all
  five files of `sandbox/media-viewer/`, deleted) + 3 named exceptions (`(shell)/lab/boards.ts`,
  `sandbox/registry.ts`, `touchpoints.ts` — the manifest's own retirement lines) + this file.
- The items:
  - **No mark rides a guest's own tile, ever.** `MineMark` (`album-tile.tsx`), the `mine`/`mineSelected` tile
    props, `data-mine`, and `MasonryColumns`' `mineIds`/`onSelectMine`/`mineSelected` props and the
    `data-tile-mark="mine"` branch of its one click handler (`masonry.tsx`) are deleted outright, not hidden
    behind a flag: no prop is left that could reintroduce the mark. `GalleryRows` and `GuestMasonry` lost the same
    three pass-through props (`GuestMasonry`'s were already dead — no real caller ever passed them, checked
    repo-wide: the marketing stage and every lab board that mount it pass only `items`).
    - Pins: `masonry.test.tsx`, "a tile carries MARKS, and a phone carries nothing else" gains "never wears a
      mine mark: no id set, no tap, nothing to render it with", replacing the five-test "yours mark" describe
      block (it pinned a mechanism with no code path left to exercise); the rows-layout "keeps everything a tile
      carries" test drops its `mineIds` line and assertion.
  - **View's Showing is the one door**, unchanged: the "Showing" group already existed only once
    `ownedCount > 0` and its Yours option already filtered the album (`buildGuestViewGroups`, `yoursView`,
    neither touched) — the mark was a second, redundant door onto the same state, now closed.
    `live-gallery.tsx` still keeps `showMine`/`setShowMine` for the View menu and the "Showing yours · Show all"
    line, whose own comment no longer credits the mark as the other exit.
    - Pin: `live-gallery.test.tsx`, "a signed-in guest's new photograph is theirs the moment it lands (Trash and
      the Yours filter)" — reshaped from "(Trash and mark)": drops the `mineIds` assertion (the prop is gone) for
      a real one, opening View and picking "Yours (1)" to prove the same upload is found by the filter now that a
      tap on the tile can't do it.
  - **The viewer's "You" is untouched** (`media-lightbox-parts/credit.tsx:82`): outside this lane's `owns` and
    outside its diff.
  - **`media-viewer` retires**, its three rounds all built: `SandboxId`, its `RULINGS` row and its `DESK_ORDER`
    line out of `touchpoints.ts`, its spec out of `sandbox/registry.ts`, its component out of `(shell)/lab/boards.ts`,
    `sandbox/media-viewer/` off the tree — the album-columns retirement (`95c8aa56`) is the template, followed
    exactly (no disagreement to log this time). Only `registry.ts` and `boards.ts` imported the folder (checked
    repo-wide); `masonry.tsx`'s re-export of `AlbumRows`/`RowTileBox` existed only for media-viewer's own album
    (its sole importer) and is trimmed to the `AlbumHandle` type other surfaces still use. Every other
    "media-viewer" hit left in the tree (`masonry.tsx`'s and its test's own `?photo=` WHY-comments,
    `media-lightbox.tsx`, `media-lightbox-parts/*`, `share-save.ts`, `moderation-grid.test.tsx`, `host-curation`'s
    own board) is a round-1 prose citation — the precedent's own carve-out for exactly this.
  - **Not driven from this lane: a live click-through as a guest who owns an upload.** Reproducing "she sees no
    dot, View finds her upload, the viewer says You" needs a session (join, then upload) this worktree cannot
    mint: both are allow-list-gated and refuse off localhost (CLAUDE.md). Verified instead by the DOM-level pins
    above (real renders of `MasonryColumns` → `AlbumTile`, and of `LiveGallery` wired to the real
    `yoursView`/`buildGuestViewGroups`, only the leaf `GalleryRows` mocked), a repo-wide audit finding zero
    remaining path that could draw the mark, and a real-browser look at `/design/library/masonry` and
    `/design/library/host-media-grid` (both render clean; the host grid was never wired to `mineIds` to begin
    with). The live pass belongs to the alias red-team.
- Doc lines for the Orchestrator (this lane's `reads`, never edited here):
  - `design-system.md:320`, "A tile shows state, not controls": "at most an active like, a play mark, a like
    count and the guest's `MineMark`" becomes "at most an active like, a play mark and a like count" (three
    states now, the fourth is gone).
  - `guest-flow.md:202`, the credit paragraph: "a typed one wears [`unverified-mark.tsx`](...) (MineMark's
    material, tap to open, ..." — `MineMark` no longer exists; repoint at the material itself, e.g. "(the album
    tile's own mark material, tap to open, ...".
  - `guest-flow.md:802-810`, "And WHICH tiles are a guest's own": the whole paragraph describes `mineIds`,
    `data-mine` and "a FOURTH mark" reaching the grid, none of which exist any more; needs rewriting to say the
    grid derives ownership only for the Yours filter (`yoursView`), with no id-set prop and no mark, and that
    View's Showing is the filter's only door (the "besides a mark" clause drops).
- Assets requested from Will: none.
- Board ideas: none beyond this lane.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Calls his to overrule: none — r3's ruling was unambiguous and left no built-vs-not-built alternative.
- Look at first: `masonry.tsx`'s `onGridClick` (the deleted `data-tile-mark="mine"` branch, to confirm nothing
  else answers that attribute) and `live-gallery.tsx`'s `GalleryRows` call (to confirm the three props are gone
  and nothing quietly re-adds them); then the live pass this lane could not drive (above).
