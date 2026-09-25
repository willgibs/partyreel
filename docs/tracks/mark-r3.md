---
track: mark-r3
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
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

- Which mark does round 3 recommend? `run`, the brief's own, held after drawing all four: one outline says a burst is
  one moment, a single reads exactly as `inset` does, and an outline never takes in a tile that is not hers. Built as
  the step's recommendation, `baseline` its overrule for less ink.
- What is a mark drawn in? The page's ink, a line on a band of the ground, inside the tile: it reads over any
  photograph in both themes and is never the arrival's white rim (`shared/arrival.css`). Built; carried on the board as
  `call:mark-ink`.
- When a burst wraps, one outline per row or one joined shape? Per row (the brief's rule): joined, it is a staircase
  that reads as a selection. Built; carried as `call:run-rows`.
- The underline's weight: 2px of ink on 2px of ground where the rings are 1.5 on 1.5; at the rings' weight it vanished
  under a 300px desk photograph (a 1:1 capture). Built.
- Whose album: Priya's (the lab's guest in `guest-capture` and `identity-claims`), where round 2 marked Nina's; 28
  items newest first, her pick of five at the head (2, 1 and 2 a row at 375; 4 and 1 at 1440), singles at the 7th,
  15th and 22nd tiles, one of the five a 16:9 clip. Built.
- Round one's frames: retired, since `media-viewer-wiring` merged at 7eb190de and they were dead code typechecking
  against production; git has them. Done.

## System-doc edits (in place, owned facts only)

- none (no system doc is this lane's; the wiring facts ride the Handoff)

## Deferred (ROADMAP one-liners, bucket named)

- none (the records this lane made stale, and the wiring notes, are Handoff items)

## Handoff (replaces the chat report)

- Work: f3d23c08 (the board) and 8f5cd7b1 (a fixture tidy), pushed to `origin/lp/mark-r3`. No sync: launch-prep moved
  only by record commits (cb12c21f, 28801095, 86ee4aef, 03b2c454; `docs/tracks/` alone).
- Gates on 8f5cd7b1, each its own exit code: `pnpm typecheck` 0; `pnpm lint` 0 (6 warnings, none in a touched file);
  `pnpm test` 0 (449 files, 4886 tests); `zsh scripts/build-lock.sh pnpm build` 0 (257 pages);
  `pnpm lab:smoke --base http://localhost:3135` 0 (277 checks, media-viewer 341 of 1200 words);
  `pnpm lab:demo --board media-viewer --base http://localhost:3135` 0 (1 step, 4 options, the stage moves up to 19.03%).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = the nine `sandbox/media-viewer/` paths (album.tsx
  added; board-r1.tsx, page-parts.tsx, reel.tsx, viewer.tsx deleted; board.tsx, fixtures.ts, media-viewer.css,
  spec.ts), this manifest, and `src/app/(dev)/design/touchpoints.ts`: the exception, media-viewer's row alone, the one
  line the brief hands this lane.
- Items:
  - The board (`spec.ts`): `mine` round 3, four options (`inset`, `run`, `baseline`, `none`), `run` recommended, knobs
    Screen (375, 1440) and Ground (Light, Dark), two carried calls.
  - The album (`album.tsx`): the real `AlbumRows` at the middle step, in the guest album's bleed under its count row;
    the tile quoted from `MediaTile` and `CornerPlayBadge`, its photograph's clip moved one level in so a run's line can
    cross the gutter.
  - The marks (`media-viewer.css`): a line of ink on a band of ground, inside the tile; a run is two sibling selectors
    off the rows' own `[data-row-break]` DOM, no engine change and no measuring.
  - `none` draws View open from the shipped `buildGuestViewGroups` (`live-gallery.tsx`) on the floating panel's parts
    (radix portals out of a frame).
  - Captions read off the frame (`board.tsx`): marks by computed style, runs by row, bridges by both boxes, the gutter
    between two of hers (4px). All 16 option, screen and ground combinations captured at 1:1 under reduced motion, no
    console error on a fresh load; `?screen=bogus&ground=purple` falls back to 375, light.
  - Round one retired: `board-r1.tsx`, `viewer.tsx`, `reel.tsx`, `page-parts.tsx`.
  - `touchpoints.ts`: media-viewer's row describes round 3 (asks, why, lives, note, variants, `tracks: mark-r3`).
  - Records now stale (yours): ROADMAP's two lines on media-viewer's drawn chrome and `holds`' mid-flight opening, the
    `media-viewer/viewer.tsx:194,296` citation in the "A guest" line, and the media-viewer example in the `lab:demo`
    default-knobs line; ASSETS row 23 (the real vertical clip) and its stand-in `public/lab/media-viewer/clip.mp4` have
    no slot now.
  - For the wiring, whichever mark wins: `run` and `baseline` move the photograph's clip one level in from
    `tileOf`'s root (`masonry.tsx`); the sheet keys off production's own `data-mine` with the same two selectors;
    `MineMark`'s dot and its tap retire, so View's Showing and the "Showing yours" line are the filter's only doors; and
    the dot's `aria-label` was all a screen reader heard of "yours", so a passive mark, `none` included, puts it on the
    tile's button ("View your photo").
- Assets requested from Will: none.
- Board ideas: the album's count row could carry her share as a quiet phrase that is the filter ("28 photos & videos ·
  8 yours"), Yours in plain sight whichever mark wins (today it is two taps into View).
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Calls his to overrule:
  - `run` recommended (the brief's, held after drawing).
  - Marks in the page's ink on a band of the ground, not white light (`call:mark-ink`).
  - One outline per row when a burst wraps (`call:run-rows`).
  - The underline heavier than the rings (2 on 2 against 1.5 on 1.5).
  - Priya as the guest, and the burst's shapes tuned so it wraps at both widths.
  - Frames open on Light; Dark is one press.
- Look at first: the step at 375, Light: `inset` against `run` on the burst's first and third rows, then Dark, then
  1440 (the pick of five as 4 and 1).
