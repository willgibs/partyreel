---
track: album-fixes
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "4840c3c6"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/shared/album-window
  - src/components/shared/masonry
  - src/lib/shared/album-rows
  - src/components/shared/media-lightbox
  - src/components/app/recently-deleted-grid
  - src/components/app/host-media-grid
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/guest-flow.md
  - docs/systems/host-app.md
  - docs/systems/design-system.md
---

# lp/album-fixes

**Goal.** Two album fixes from build 10's red-team: a hide above a reader's view never moves what they are looking at, and a host on a phone can restore or delete what sits in the bin.

## The brief

1. **A hide above the view jumps it** (minor, build 10's red-team): a guest at 1440 sitting at scrollY 23,675; hide (by status) the photo at position 359; the double-height row above it collapsed into a normal row, the photographs before it moved up 522 px and everything below up 574 px, with no scroll compensation; a first trial at position 551 took 6 of 8 photographs in view off screen. An arrival already holds the view (the photograph at the view's top stays put, 0 px), and a restore of the same photograph was compensated (+487 px, nothing moved on screen); at 375 the same hide stays local. **Make a removal hold the view as an arrival does**: when rows above the view's top re-lay for any reason (a hide, a removal, a rhythm row that re-forms), the photograph at the view's top stays where it is, on the guest's album and the host's alike (they share `MasonryColumns` and `AlbumRows`). A hide INSIDE the view may re-justify the rows under it (whether that glide should hold still is a separate `album-columns` motion question; leave it). Pin it with the rows engine's tests and prove it at 1440 and 375 on a production build with `scripts/album-perf.mjs` or a CDP walk (a status flip by SQL on the scale probe is fine: every row is test data; restore it).

2. **The bin on a phone acts on nothing** (Will's question from `album-host-wiring`, its recommended answer, built): at phone width Deleted offers no Restore and no Delete permanently, because the tile's pane is desk-only and the bin's viewer is read-only. The bin's viewer takes the two verbs, as the album's viewer takes the album's: Restore acts at once with its toast, Delete permanently confirms first, both through the bin's existing actions (the restore and purge the desk's tile pane already calls), and a restored or purged item leaves the bin's list. Name it as his to overrule.

Put the `guest-flow.md`, `host-app.md` and `design-system.md` lines these change in your Handoff for the Orchestrator.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` whole when the lane changes anything under `src/` but tests (the Library renders the product's components); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- The bin's viewer after Restore or Delete permanently: built, it closes first (the album's viewer's grammar for a
  verb that shrinks the set, as Remove does), the item leaves the bin and its toast says so. The alternative not
  built: step to the next photograph in the bin, a triage walk through Deleted. His to overrule.
- Which rows are "in view": built, every row with a pixel on screen, the row at the view's top included even as a
  sliver (it is the row the anchor rides). So a hide IN a sliver-visible top row is a hide inside the view and
  re-justifies around it, as the brief allows. The alternative: count a row as in view only when about half of it
  shows, so such a hide re-lays above the reader instead. His to overrule.
- The mirror below the view: built, a change just below the view no longer re-lays the view's last row either (the
  same hold, the same promise that nothing a reader is looking at moves). The alternative: hold above only, the
  brief's letter. His to overrule.

## System-doc edits (in place, owned facts only)

- none: `guest-flow.md`, `host-app.md` and `design-system.md` are this lane's `reads`; their lines are in the Handoff,
  for the Orchestrator.

## Deferred (ROADMAP one-liners, bucket named)

- none

## Handoff (replaces the chat report)

- Artifacts named `scratch/…` are in `/Users/gibby/local/ai/partyreel-wt/_scratch/album-fixes/` (captures, logs and
  the walk scripts; never the repo).
- Work commits `c4107616` (the hold; the bin's viewer verbs), `54a75daf` (the bin's capsule carries nothing to enjoy)
  and `921b1c71` (the bin's confirm in a module of its own, so the grid never pulls the lazy capsule into the hub's
  first load); sync commits `4e6086a8` (`reel-and-copy`'s merge touched `guest-flow.md`, a read) and `096337be`
  (`owner-album`'s merge touched `guest-flow.md` and the guest page, the surface this lane verifies on), both merges
  of `origin/launch-prep`, the last at `0412f3e2`; all pushed on `lp/album-fixes`, and the head is this manifest's
  commit.
- Gates on the synced tree `096337be`, each on its own exit code (logs `scratch/gate-*.log`): `pnpm typecheck` 0;
  `pnpm lint` 0 (0 errors; its 6 warnings sit in 5 files this lane never touched); `pnpm test` 0, 5,461 passed in 484
  files; `zsh scripts/build-lock.sh pnpm build` 0; `pnpm lab:smoke --base http://localhost:3132` 0, 270 checks, 0
  failing. No board, so no `lab:demo`.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = 11 owned paths (`album-rows.ts`, `album-window.tsx`,
  `masonry.tsx`, `media-lightbox.tsx`, `media-lightbox-parts/actions.tsx`, `media-lightbox-parts/purge-confirm.tsx`,
  `recently-deleted-grid.tsx` and their tests) + this file; no exceptions. `host-media-grid.tsx` needed nothing: the
  host's album takes the hold through the shared engine and box.
- The items:
  - **A change outside the rows in view never re-lays them** (`reflowRows(prev, list, params, held)`, `HeldRows`,
    `src/lib/shared/album-rows.ts`; `rowsInView` in `src/components/shared/album-window.tsx` hands the engine the laid
    rows a reader can see). The cause: a hide's window takes its row and both neighbours, so a hide in the row just
    above the view re-laid the view's top row too, and the anchor's scroll kept that row's top edge while its
    photographs re-broke under the reader (a feature row re-forming in it). Now a change wholly above or below the
    rows in view keeps to its own side: a window re-lays and stretches only away from them, keeping its size by
    reaching further off; a run landing on their edge joins the row outside them; a change too big to be local
    re-solves the side it touched whole instead of the album; a side that cannot be laid under its cap lets the view
    go before the album. A change IN a row the reader sees re-justifies exactly as before (pinned equal). The guest's
    album and the host's alike, by construction.
    - Pins: `album-rows.test.ts` "a change outside the rows in view never re-lays them" (8 tests over party-shape and
      scale-probe albums, the rhythm on, 351 to 2,520 px; 5 fail with the hold switched off, and the first asserts
      that without it over a fifth of its hides reached the view); `album-window.test.tsx` "a hide just above the view
      re-lays none of the rows in it" (the box pays exactly the rows above and every tile in view keeps its box; with
      the hold off it fails, scrolling 116 px against 103) and the `rowsInView` arithmetic.
    - Proven on production builds against the scale probe, a guest at scrollY 23,676, with a CDP walk
      (`scratch/hide-walk.mjs`: the status flipped through PostgREST and restored in every path; the probe reads 1,145
      approved, 20 pending and 35 removed afterwards, as before). Before, on `1586c0d5`'s tree: at 1440 a feature
      row's lead hidden above the view moved 13 of 13 tiles in view (max 232 px) and its restore 12 of 14 (695 px)
      (`scratch/baseline-1440.json`); at 375 a hide in the row just above moved 7 of 7 (119 px), its restore 7 of 8
      (`scratch/baseline-375.json`). After, on `096337be`: 14 hides and restores at 1440 and 375 (a feature row above,
      the row just above, four rows above, the row just below) moved nothing in view, 0 px, the scroll paying exactly
      the change (a feature row collapsing above: -574, the red-team's number) (`scratch/final-walk.log`,
      `scratch/final-walk.json`). `scripts/album-perf.mjs --guest --arrive --budgets` on the probe at 1440 and 375:
      every budget PASS, a head arrival while deep 0 px (0/12, 0/11), CLS 0.0001 and 0 (`scratch/perf-guest.log`). The
      host's album on the lab's host surface (`scratch/host-walk.mjs`, a bulk delete of a photograph in the row just
      above the view): at 1440 0 px on screen; at 375 the rows in view move as one in album coordinates (-326, exactly
      the scroll paid) and none reshapes, while the page's own 34 px header change around select mode showed on screen
      in 3 of 6 walks at 375 (the Board idea below) (`scratch/final-host-walk.log`, `scratch/synced-host-walk.log`).
  - **The bin's viewer restores and deletes for good, at every width**: the capsule takes `onRestore` (at once) and
    `onPurge` (behind `PurgeConfirmContent`, the pane's own confirm, its window read off
    `RECENTLY_DELETED_WINDOW_DAYS`) (`media-lightbox-parts/actions.tsx`, `media-lightbox-parts/purge-confirm.tsx`,
    `media-lightbox.tsx`); `MasonryColumns` closes the viewer first, as for Remove (`masonry.tsx`); `useBinActions`
    (`recently-deleted-grid.tsx`) is the one home of the two writes and their words for the pane and the viewer: a
    restored or purged item leaves the list, an at-cap restore offers the room sheet, and a write that never answers
    now toasts rather than failing silently. The bin's viewer also asks for the links it is about to show (it drew
    placeholders past the window), holds no place for a Save it never offers, and carries no Like.
    - Pins: `media-lightbox.test.tsx` "the recovery bin's Restore and Delete permanently" (5) and
      `recently-deleted-grid.test.tsx` "the bin's viewer carries its two verbs" (6).
    - Walked on the synced production build, the lab's host surface (`scratch/bin-walk.mjs`): at 375 the tiles' panes
      are `display: none` (the gap), the viewer's capsule is Restore and Delete permanently, Restore closes the viewer
      and the item leaves the bin (3 to 2) with "Restored. It's back in the album.", Delete permanently confirms and
      then purges (2 to 1) with "Permanently deleted."; the same at 1440 (`scratch/final-bin-walk.log`; captures
      `scratch/bin-viewer-375x812.png`, `scratch/bin-confirm-375x812.png`).
  - Live: not driven from this lane (no Chrome here, and the alias carries `launch-prep`, not this branch). Build 11's
    red-team takes it: the guest walk replays against the alias with `hide-walk.mjs --base <alias>`; the phone bin
    wants a signed-in host.
- Doc lines for the Orchestrator (this lane's `reads`, never edited here):
  - `design-system.md`, "The album tile", the bullet "★ **A full re-solve moves the whole album**": after "never more
    than four old rows move" add "; and a change outside the rows in view never re-lays them: the box hands the engine
    those rows (`rowsInView`), a window keeps to its own side of them (a run on their edge joins the row outside them,
    a bulk change re-solves that side whole), and a side that cannot be laid under its cap lets the view go before the
    album".
  - `design-system.md`, the bullet "★ **Nothing a reader is looking at moves**": after "so a view read a frame late
    cannot throw it off." add "The scroll holds only what the change did not re-lay, which is why the rows in view
    stay whole (above)."
  - `host-app.md`, the album bullet ending "bin items never count in the album.": add "Its two verbs, Restore (at
    once) and Delete permanently (behind a confirm), ride the tile's pane at a desk and the viewer at every width, one
    `useBinActions` for both: the viewer closes first, the item leaves the list, and the bin's viewer carries nothing
    else (no Like, no Save)."
  - `guest-flow.md`, the viewer paragraph: "(Like / Save / Share / Copy link / Delete, a clip's sound, the host's
    curate group behind a divider)" becomes "(Like / Save / Share / Copy link / Delete, a clip's sound, the host's
    curate group behind a divider; in the recovery bin, its Restore and Delete permanently alone)".
- Assets requested from Will: none.
- Board ideas: the hub's select mode changes the header's height on a phone (the album's top moves 34 px on the lab's
  host surface at 375), and leaving it after a bulk delete jumped the album those 34 px in 3 of 6 walks, when the
  browser's own scroll anchoring missed the header growing back (`scratch/final-host-walk.log`); the album's anchor
  could own a change above the album too.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Calls his to overrule: the three Questions (the viewer closes on the bin's verbs; a sliver of a row counts as in
  view; the hold below the view too); the bin's capsule carries no Like and holds no Save place; a bulk change beside
  the view re-solves that side of the album whole rather than the whole album.
- Look at first: `reflowRows`' hold in `src/lib/shared/album-rows.ts` (the `around` decision, the clamped ranges and
  the side windows), the one piece of new logic and the one place a mistake would move a reader; then `useBinActions`
  in `src/components/app/recently-deleted-grid.tsx`.
