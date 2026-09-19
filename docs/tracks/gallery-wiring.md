---
track: gallery-wiring
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "97207988"         # the launch-prep SHA the branch was cut from
board: gallery-width    # RETIRES here
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/guest/guest-masonry.tsx
  - src/components/guest/event-experience.tsx
  - src/components/guest/live-gallery.tsx
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

- (fill)

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- `docs/systems/guest-flow.md` and `docs/systems/host-app.md`: the gallery's width rule, one clause each where
  the grid is described.

## Deferred (ROADMAP one-liners, bucket named)

- (fill)

## Handoff (replaces the chat report)

- (fill: the head SHA, the gates on the synced tree, the lane check pasted, the items one line each, the
  questions and their answers, the measurements, assets, system-doc lines, deferred lines, look at first)

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

(fill)
