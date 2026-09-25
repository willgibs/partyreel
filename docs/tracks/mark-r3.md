---
track: mark-r3
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "e13a98d6"            # the launch-prep SHA the branch was cut from
board: media-viewer
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/media-viewer/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/media-viewer.json
  - src/lib/shared/album-rows.ts
  - src/components/shared/masonry.tsx
  - src/components/guest/live-gallery.tsx
  - src/app/(dev)/design/sandbox/album-columns/spec.ts
---

# lp/mark-r3

**Goal.** Draw `media-viewer` round 3: the album's own-item mark, on the real justified rows, with a guest's own photos side by side as they really land. Will preferred round 2's ring for how little it intrudes, but foresaw neighbouring rings running together; find the better answer, or show that none is best.

## The brief

Will's answers and notes: `docs/reviews/media-viewer.json` (rounds 1 and 2, with the Orchestrator's note). His words on the ring: "neighboring uploads from the same user would have overlapping rings, but this is far less intrusive than the glass dot or worded corner. Curious if you could solve it even better, maybe in this direction, maybe new idea. If not, we'll scratch and go nothing at all. Simply use a filter to find yours."

**Measured.** Round 2's ring was `ring-2 ring-brand ring-offset-2 ring-offset-background`: an outset box-shadow (a 2px background band, then 2px of ink, 4px out in all), exactly the 4px gutter. The board put her photos every ninth item, so no two ever touched.

**Round 3 asks `mine` again**, drawn on the real rows engine (`AlbumRows`, `layout="rows"`, the album's middle step) at 375 and 1440, light and dark, over bright and dark photographs. The album holds her photos as they really arrive: a burst of three to five landing together at the head (side by side, wrapping onto the next row), plus a few singles further down. Directions, each a real candidate (replace any with a better idea):
- `inset`: the ring drawn inside the tile's edge, so two neighbours read as two with the gutter between.
- `run`: one outline around each run of hers within a row (the engine knows every row), so a burst reads as one group; recommended, since uploads arrive in bursts.
- `baseline`: a short bar along the inside of each of her tiles' bottom edge, lining up across a run like an underline.
- `none`: nothing on the tiles; the shipped "Showing: Everyone's / Yours (N)" filter in View finds them (draw the filter open).

**Rules.** Only the viewer ever sees her own mark (the host's grid carries its own marks). Tiles, gutters and radii come from production's album. Reduced motion is honoured. `media-viewer`'s row in `touchpoints.ts` is yours (its desk line still describes round 1), nothing else in that file.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The board at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke --base http://localhost:<port>` whole; `pnpm lab:demo --board <board> --base http://localhost:<port>` pressing every step.

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
