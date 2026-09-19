---
track: gallery-wiring
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "97207988"         # the launch-prep SHA the branch was cut from
board: gallery-width    # RETIRES here
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/guest/guest-masonry.tsx
  - src/components/guest/event-experience.tsx
  - src/components/guest/live-gallery.tsx
  - src/components/guest/gallery-skeleton.tsx  # added mid-round by the Orchestrator: it hard-coded columns-2
  - src/components/shared/masonry.tsx
  - src/components/shared/container.tsx
  - src/components/shared/app-shell.tsx
  - src/app/(app)/dashboard/[eventId]/page.tsx
  - src/app/(dev)/design/sandbox/gallery-width/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/design/rulings.md
  - docs/design/guidance.md
  - docs/systems/design-system.md
  - docs/systems/guest-flow.md
  - docs/systems/host-app.md
  - docs/reviews/gallery-width.json
  - src/lib/media/tile-aspect.ts
  - src/app/globals.css
  - src/components/shared/lit-edge-contract.test.ts
  - src/components/shared/masonry.test.tsx
  - src/lib/type-ladder-policy.test.ts
---

# lp/gallery-wiring

**Goal.** Wire `gallery-width` round one (`docs/reviews/gallery-width.json`, 2026-09-18): `tile=240` ("About 240
px: 5, 6 and 8 columns... The size a phone's tile looks in the hand, seen from a laptop's distance"),
`width=full` ("The album runs to 20 px from each edge: every window gets every column it can hold"), `words=edge`
("The logo, the name, the buttons and the photographs share one left line, the way a photo app reads; the room
to the right of the words stays open"), `host=same` ("The host's album runs to the window's edges and the page
lines up the way the guest's does, so a host sees as many photographs at once as a guest"). His words, verbatim
in `docs/design/rulings.md` ("the second batch"): "This feels natural at every window size, so all you have to do
is adjust your browser window to adjust the gallery size, rather than us constrain it at any point"; "Left is
definitely best for this current positioning". His two asks for later boards (a tile-size control, and event
headers with a centred version) are NOT this lane's: the Orchestrator cuts them as boards on your wired pages.
Production bytes on the guest page and the host app: the red-team lands on the alias. The board RETIRES here.

**What exists.** The guest grid (`guest-masonry.tsx`) is hard-coded `columns-2` at every width inside
`event-experience.tsx`'s one `max-w-2xl` container (632 px of content), which also holds the header. The host
grids all sit on one primitive, `src/components/shared/masonry.tsx` (`columns-2 sm:columns-3`; the uniform
layout for Reel and Review), inside `Container` (`max-w-7xl`) through `AppShell`, which also wraps the header and
the section pills. The sandbox worked out the production diff (`sandbox/gallery-width/pages.tsx` and its CSS):
`column-width` with `column-count: auto` from `sm` up (phone keeps `columns-2`), the tile widths fed slightly under
the nominal size so the count comes out even (`TILES = { "180": 170, "240": 220, "300": 280 }`), the width rule
dropping the container's cap and keeping the gutter, the guest header rendered inside the wide box at its 632
measure so the first letter lines up with the gallery's edge, and the host page dropping `mx-auto` so the logo,
the heading, the pills and the grid share one left line. `--gap-gallery` stays pinned to the tile radius.

**What to build.**

1. The guest album: the grid at `tile=240` from `sm` up by `column-width` (the sandbox's under-size), the phone's
   two columns untouched, the album to 20 px from each edge, the header lined up with the gallery's left edge at
   its 632 measure, the Live pill and buttons on the same line.
2. The host: the same column math through the shared primitive (so every host grid follows); the event page's
   gallery to the window's edges with the logo, the heading, the pills and the grid on one left line; the other
   host pages follow only as far as the primitive carries them (say which pages changed shape and which did not).
3. Retire `gallery-width`: the directory deleted, its lines removed from `registry.ts` and `boards.ts`, its
   RULINGS row in `touchpoints.ts` rewritten as shipped (grep `shipped:` for the precedent), never deleted. No
   Library entry is owed unless a new component appears.

**Binds.** Bible 1, 3, 4, 13; `lit-edge-contract.test.ts` names `guest-masonry.tsx` and `masonry.tsx` by path (a
restructured owner of the radius joins its table); `masonry.test.tsx` (the overlay stays a sibling of the lightbox
button); `type-ladder-policy.test.ts` (the headings keep one class, no ramp); the guest pages are the host's event,
minimally branded; no em-dashes.

## Verify, and the gate

- Each step its own exit code, pasted into Handoff: `pnpm design:rules`,
  `node "src/app/(dev)/design/gallery/collect-specimens.mjs"`, `pnpm typecheck`, `pnpm lint` (the 8 known
  warnings), `pnpm test`, `pnpm build`, `pnpm lab:smoke --base http://localhost:3133` (with `DESIGN_PREVIEW_KEY` in
  the environment, never on a command line).
- Measured locally against the real database (disposable data only) at 1280, 1512, 1920 and 375: the column count
  and tile width on the guest album and the host event page, the header's left line against the gallery's, the
  lightbox and the selection overlays still working on every host grid, the scroll cost of a wide album under a 4x
  throttle, nothing regressed at a phone.
- The screenshot gate: the guest album at 1512 beside the home page; the host event page the same.

## Questions (what the goal leaves open; a recommended answer each; the Orchestrator relays them and quotes the answer back)

- **The select-mode grid is the one surface this lane could not reach, and it reflows the album.**
  `src/components/app/event-feed/selectable-media-grid.tsx` (outside `owns`; the Review queue and the host
  gallery's bulk-select both render it) still carries `columns-2 sm:columns-3` and `sm:grid-cols-4`, and its own
  doc says it "Must MATCH the surface's normal grid so toggling select never reflows tile heights". It now does
  not: at 1512 a host tapping Select watches six columns collapse to three. **Recommended:** apply the two-hunk
  patch below at the merge (it is mechanical, and the constants exist so the two can never drift again).
  ```
  -import { CornerPlayBadge } from "@/components/shared/masonry";
  +import {
  +  CornerPlayBadge,
  +  GALLERY_COLUMNS,
  +  GALLERY_UNIFORM_COLUMNS,
  +} from "@/components/shared/masonry";
  @@ the grid's className
  -        className={
  -          uniform
  -            ? "grid grid-cols-3 gap-[var(--gap-gallery)] sm:grid-cols-4"
  -            : "columns-2 gap-[var(--gap-gallery)] sm:columns-3"
  -        }
  +        className={uniform ? GALLERY_UNIFORM_COLUMNS : GALLERY_COLUMNS}
  ```
- **Column-major reading order gets materially worse with eight columns.** CSS columns fill column one top to
  bottom before column two, so "newest first" used to mean the newest five photographs were down the left of a
  two-column album; at 1920 it means the newest THIRTY are, and a guest reading left to right meets the oldest
  in the last column. `guest-masonry.tsx` has carried "flagged for live review" since Phase 4; the ruling is what
  makes it load-bearing. **Recommended:** leave it this round (a row-major masonry is a different layout engine,
  not a class change) and let Will judge it on the alias against a real album; if it reads wrong, it belongs on
  the `guest-shape` board rather than in a wiring lane. A ROADMAP line is filed below either way.
- **640 to 715 is the one band that shows FEWER photographs than today.** A column WIDTH means the browser fits
  what it can: at a 700px window the floor of 220 allows two columns (tiles grow to ~330) where today's counts
  gave three on the album and four on the Review queue. **Recommended:** keep it. It is the honest behaviour of
  the rule Will picked ("all you have to do is adjust your browser window to adjust the gallery size"), it is a
  75px band, and forcing a third column there would put tiles at 194px, under the floor his `tile=240` set.
- **The guest action block is what the screenshot gate flags, and it is his own ruling.** At 1512 the 632px-wide
  "Add photos" with an open window to its right is the one element that still reads like the old narrow column
  beside the full-bleed album. That IS `words=edge` ("the room to the right of the words stays open"), so this
  lane shipped it as ruled. **Recommended:** no change here; it is exactly the material his `event-header` board
  was asked for, and that board should draw the action block at this width, not only the header.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- `docs/systems/guest-flow.md`, the **Masonry gallery** bullet: `columns-2` replaced by the shared rule
  (`GALLERY_COLUMNS`, a WIDTH and never a count, two columns at a phone then `--album-column` from 640 up,
  5 / 6 / 8 at 1280 / 1512 / 1920), plus a ★ clause for the page's two boxes (`COLUMN` / `BLEED`: only the
  photographs leave the 632 measure, and why the empty state does not) and the skeleton's 12 extra tiles. The
  bullet's last line, "Guest-only; host/personal grids keep `MediaGrid`'s square grid", was DELETED: it went
  stale at Phase 5 S2a and is now flatly false, since both galleries read one rule.
- `docs/systems/host-app.md`, **The event page** section: a ★ paragraph for the one wide page in the host app -
  `data-app-wide`, why the shell answers in `:has()`, what lands on the one left line, and the separation this
  lane was asked to write down: the event page changed SHAPE, every other host page changed only its GRIDS.

## Deferred (ROADMAP one-liners, bucket named)

- **Now / app polish:** the guest album's column-major flow puts the newest photographs down the left column,
  which reads as out-of-order at 5 to 8 columns where it did not at 2; decide row-major against Will's eye on a
  real album before rebuilding the layout.
- **Next / app:** `--album-column` (220px, `shared/masonry.tsx`) is the single knob the `gallery-controls` board
  needs - a tile-size control sets that one property on an ancestor and every grid under it follows, with no
  component change.

## Handoff (replaces the chat report)

- **Head SHA:** the branch tip is the commit that carries this manifest; every gate step below ran on the
  identical tree at `0426e8aa` plus the second sync below. **Synced twice, merged and never rebased:** first
  `origin/launch-prep` at `236cc03f` (`tracks: app-shape cut on the fifth seat`, 3 commits), where the only
  conflict-adjacent file was `docs/systems/host-app.md` and both sides survive (the merge landed the
  Orchestrator's three refreshed facts above this lane's new paragraph); then `f47ce3ad` (`tracks: guest-shape
  cut on the sixth seat`), docs only. The gate was re-run whole after each.
- **The gate, on the synced tree, each on its own exit code:** `pnpm design:rules` 0 · `node
  "src/app/(dev)/design/gallery/collect-specimens.mjs"` 0 (123 specimens on 91 entries, unchanged output) ·
  `pnpm typecheck` 0 · `pnpm lint` 0 (the 8 known warnings, none of them new) · `pnpm test` 0 (2467 passed,
  241 files) · `pnpm build` 0 · `pnpm lab:smoke --base http://localhost:3133` 0 (261 checks, 0 failing; the key
  came from `.env.local` into the environment and never onto a command line). The dev server ran on :3133 only
  and was killed by port before the build and the handoff.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`):
  ```
  docs/design/library.md                                  generated by pnpm design:rules (one board fewer)
  docs/systems/guest-flow.md                              the listed edit
  docs/systems/host-app.md                                the listed edit
  docs/tracks/gallery-wiring.md                           this manifest
  docs/tracks/album-wiring.md                             \
  docs/tracks/river-wiring.md                              |
  docs/tracks/trail-wiring.md                              |  ONE dead `reads` line each, see below
  docs/tracks/app-shape.md                                 |
  docs/tracks/guest-shape.md                              /
  src/app/(app)/dashboard/[eventId]/page.tsx              owns
  src/app/(dev)/design/(shell)/lab/boards.ts              the registration exception (only this board's lines)
  src/app/(dev)/design/sandbox/registry.ts                the registration exception (only this board's lines)
  src/app/(dev)/design/touchpoints.ts                     the registration exception (SandboxId + its RULINGS row)
  src/app/(dev)/design/rules/rules.generated.json         the generator's artifact
  src/app/(dev)/design/sandbox/gallery-width/*            owns, DELETED (the board retires)
  src/components/guest/event-experience.tsx               owns
  src/components/guest/gallery-skeleton.tsx               owns (added mid-round by the Orchestrator)
  src/components/guest/guest-masonry.tsx                  owns
  src/components/guest/live-gallery.tsx                   owns
  src/components/shared/app-shell.tsx                     owns
  src/components/shared/masonry.tsx                       owns
  ```
  `src/components/shared/container.tsx` is claimed and UNTOUCHED: the shell answers `data-app-wide` on its own
  two containers, so the primitive itself never had to learn about width.
  **The five `docs/tracks/*.md` lines are the one thing outside `owns`, and they are forced.** Five live lanes
  (album-, river-, trail-wiring, and app-shape and guest-shape cut tonight) each named
  `src/app/(dev)/design/sandbox/gallery-width/spec.ts` under `reads` as the worked example, on the
  Orchestrator's instruction; `track-manifests.test.ts` asserts every read exists, so this lane's ruled deletion
  turns their manifests red. Exactly one line was removed from each, nothing else. Holding the spec back instead
  was tried and refused by `registry.test.ts` ("a spec.ts the registry does not import").
- **The items:**
  - The column rule is a WIDTH, in one place: `GALLERY_COLUMNS` / `GALLERY_UNIFORM_COLUMNS` in
    `shared/masonry.tsx`, read by the guest masonry, the shared primitive and the skeleton.
  - The guest page root stops being a column: `COLUMN` (632, pinned left) and `BLEED` (the 20px gutter), and
    only the album takes the second.
  - The host event page asks the shell for the same shape with `data-app-wide`; `AppShell` answers in `:has()`.
  - The empty state keeps the reading measure (its river is square and would otherwise be a 1472px box of
    nothing); the skeleton takes the album's box and 12 more tiles.
  - `gallery-width` retires: the directory, the registry, the component map, `SandboxId`, and the RULINGS row
    rewritten as shipped.
- **Measured** locally on :3133 against the real database, on a disposable event seeded through the real upload
  path (`scripts/seed-demo-event.mjs`, 30 items: 24 photos, 6 videos). Headless Chrome over CDP, reading the
  laid-out boxes, never a formula.

  *The guest album* (`/e/c7809249347d41e0aaf2c9ad27cd3c75`, "Gallery width (disposable)", willg97's):

  | window | columns | tile | album to each edge | h1 measure | logo / h1 / Add / first column |
  | --- | --- | --- | --- | --- | --- |
  | 375 | 2 | 166px | 20px | 335 | all at 20px |
  | 1280 | 5 | 245px | 20px | 632 | all at 20px |
  | 1512 | 6 | 242px | 20px | 632 | all at 20px |
  | 1920 | 8 | 232px | 20px | 632 | all at 20px |

  `scrollWidth === innerWidth` at all four (no horizontal overflow). The phone is untouched: two columns, the
  same 166px tile and the same 20px gutters as before the change. **Scroll cost**, 1512, CPU throttled 4x, 40
  wheel steps over a 6-column album: median frame 17ms, p95 17ms, one 83ms hitch on first paint - 60fps.

  *The host event page.* The `(app)` routes are behind `getUser()` and no host session exists locally (no
  password or OTP was typed, per the brief), so the page's markup was rebuilt from the shipped class strings
  inside a document that had already loaded the app's compiled sheet. What that measures is the CSS, on the
  exact classes the components ship:

  | window | shell container | masonry / uniform columns | tile | one left line at |
  | --- | --- | --- | --- | --- | --- |
  | 640 | none | 2 / 2 | 294px | 24px |
  | 716 | none | 3 / 3 | 220px | 24px |
  | 768 | none | 3 / 3 | 237px | 24px |
  | 1280 | none | 5 / 5 | 240px | 32px |
  | 1512 | none | 6 / 6 | 238px | 32px |
  | 1920 | none | 8 / 8 | 229px | 32px |

  "one left line" is the measured left of the logo, the h1, the active pill, the GALLERY section label and the
  first column - one number, not five. The Share button stops at 1183px (inside the words' 1280) instead of
  stretching across a 1920 window, and the sticky pill bar's backdrop bleeds 0 to `innerWidth`, as it did inside
  the container. With `data-app-wide` removed the same shell reports `max-width: 1280px` and centres again
  (everything at 148px at 1512, 352px at 1920), which is the proof that only this page changed shape.
- **Which host pages changed shape, and which did not.** SHAPE: `/dashboard/[eventId]` alone. GRIDS ONLY, inside
  the unchanged centred 1280 column: `/dashboard?filter=uploads` and `?filter=likes` (`my-uploads-gallery`,
  `my-likes-gallery`), the recovery bin (`recently-deleted-grid`), and on the event page itself the Reel and
  Review queues through `layout="uniform"` - each went from 3 or 4 fixed columns to 5 columns of 240px at a
  1280 container, so they show more photographs on the same page. NOTHING ELSE: the dashboard list, account,
  the settings forms, onboarding and the reel studio have no masonry and no `data-app-wide`, and measure
  identically. The lightbox, the moderation overlay row, the long-press into select and the like button all
  still work (`masonry.test.tsx`'s sibling-overlay contract is untouched and green) - except inside select
  mode, where the grid is the file this lane could not reach (first Question).
- **Assets:** none asked for.
- **Look at first:** the select-mode patch in the first Question - it is the only user-visible defect left, it
  is two hunks, and it stops a host's album reflowing when they tap Select. Then the guest album on the alias
  at a wide window: the disposable event above has 30 real items and is the one to open, never the public demo.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Galleries stopped declaring a column count and started declaring a column width (`<sha>`): one rule in
`shared/masonry.tsx`, read by the guest masonry, the host's grids and the streaming skeleton, so a wider window
means more photographs rather than bigger ones - measured at 2 / 5 / 6 / 8 columns of 166 to 245px at 375,
1280, 1512 and 1920. The guest page root stopped being a column: the words keep 632px pinned left on the
header logo's own 20px line and the album alone runs to 20px from each edge, with the empty state held back
because its river is square. The host event page asked the shell for the same shape through `data-app-wide`,
which `AppShell` answers in `:has()` since a page cannot hand a prop up to its layout; every other host page
kept its centred 1280 column and gained only the new grid. `gallery-width` retired.
