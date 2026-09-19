---
track: river-wiring
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "97207988"         # the launch-prep SHA the branch was cut from
board: river-card       # RETIRES here, with river-visual
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/marketing/sections/features/shared/feature-door.tsx
  - src/components/marketing/sections/features/shared/related-features.tsx
  - src/components/marketing/sections/home/event-type-card.tsx
  - src/components/shared/river/
  - src/app/demo/
  - src/app/(dev)/design/sandbox/river-card/
  - src/app/(dev)/design/sandbox/river-visual/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/design/rulings.md
  - docs/design/guidance.md
  - docs/systems/design-system.md
  - docs/reviews/river-card.json
  - docs/reviews/river-visual.json
  - src/components/guest/gallery-empty-state.tsx
  - src/components/guest/gallery-empty-state.test.tsx
  - src/lib/demo.ts
  - src/lib/constants/feature-pages.ts
  - src/app/(dev)/design/sandbox/gallery-width/spec.ts
---

# lp/river-wiring

**Goal.** Wire the river into the QR door and give every feature card its own copy gradient, from two ruled
boards. River-visual round two (`docs/reviews/river-visual.json`): `placement=card` ("It ships first in the
picture slot of one card in a three card row, a short box that shows the top of the fall"), `code=in` ("The
album pours out of the real scannable code, so the picture is also a way into the demo"), `guest-photos=ghost`
(shipped already on the guest empty state). River-card round one (`docs/reviews/river-card.json`, 2026-09-18):
`place=tenth` ("41 px from the top of the tall door at 1440, three times the air you saw, and the most door left
for the photographs to fall through"), `fall=behind` ("The whole door streams, like the photographs beside it;
the words read over moving pictures, under the shade the event cards were measured with"), `opens=short` ("A
short link that opens the live demo event, at the smallest code that scans: 99 px. The redirect ships with the
wiring"), `short=tall` ("Every row takes the tall 4:5 door"). His ruling on the cards, verbatim: "A subtle dark
gradient overlay from the bottom left to allow the text in the card to be slightly more visible would be nice.
This would stack on top of the existing gradient that fades the photo out, more custom the the cards themselves
for more distinction between the card copy and its visual. The river has a gradient overlay to fade it out for
its own visual, then the card would have its own from its text, being treated separately so the card's applies
to all features & visual pairings." And: "Not exclusive to the QR code card, nor part of the river visual design
itself, which keeps its own overlay fade as well." Production bytes: the red-team lands on the alias. Both
boards RETIRE here.

**What exists.** `feature-door.tsx` is the one card component (the `/features` hub grid and every page's
closing row through `related-features.tsx`, which hardcodes landscape); the `qr` door renders `QrPlateArt` on
`InkGround` with the value hard-coded to the apex; the door already carries two full-width bottom-weighted
scrims. The sandbox's `door.tsx` reaches in from outside and says so ("The wiring lane gives the door a real
picture slot; none of this survives it"); `sandbox/river-card/card-river.tsx` carries three things the shared
engine lacks (a movable plate-top, insertion between the door's two scrims, its own clock) and its header says
whichever of the two files the wiring promotes, the other goes. The production river (`src/components/shared/
river/`) is consumed by the guest empty state, whose contract (`gallery-empty-state.test.tsx`, pure atmosphere)
must keep holding. No `/demo` route exists; `DEMO_EVENT_URL` in `src/lib/demo.ts` reads a runtime env var, so a
static redirect in `next.config.ts` cannot carry it.

**What to build.**

1. The door's picture slot: the `qr` door takes real children, the river in it at `tenth` with the code `in` it
   (the album pours out of the scannable code), the whole door streaming (`behind`) under the shade the event
   cards were measured with; the card river promoted beside the shared engine, folded into it or shipped as a
   sibling with its own contract (say which, and why, in the Handoff), the sandbox copy deleted.
2. The card's own copy gradient: the copy scrim on EVERY door becomes a bottom-LEFT weighted gradient, stacked over
   each visual's own fade (the river keeps its own dissolve), and the same treatment reaches the home's
   `event-type-card.tsx` ("all features & visual pairings"); measured for the copy's contrast on every door's
   visual, not the darkest.
3. `/demo`: a route handler (`src/app/demo/route.ts`) redirecting to `DEMO_EVENT_URL` at request time; the door's
   code encodes `/demo` at the smallest module size that scans (99 px at 1440, the board's floor; the lane
   measures the module size at both aspects and both widths); the value never the apex again.
4. `related-features.tsx`: the closing rows take the tall 4:5 door (`short=tall`).
5. Retire `river-card` and `river-visual`: directories deleted, their lines removed from `registry.ts` and
   `boards.ts`, their RULINGS rows in `touchpoints.ts` rewritten as shipped (grep `shipped:` for the precedent),
   never deleted. A Library entry for the door with the river in `gallery-demos.tsx` (add your entry at the head
   of the file and touch nothing else there: two other lanes add theirs the same way this round, and the
   Orchestrator keeps both at the merge; the same rule for `for` lines in `rules/component-notes.ts`).

**Binds.** Bible 1, 4, 13, 14, 22; `river-engine.test.ts` and `gallery-empty-state.test.tsx` keep holding;
`keyframe-uniqueness.test.ts`; the guidance's craft stack; no em-dashes; the copy is open.

## Verify, and the gate

- Each step its own exit code, pasted into Handoff: `pnpm design:rules`,
  `node "src/app/(dev)/design/gallery/collect-specimens.mjs"`, `pnpm typecheck`, `pnpm lint` (the 8 known
  warnings), `pnpm test`, `pnpm build`, `pnpm lab:smoke --base http://localhost:3132` (with `DESIGN_PREVIEW_KEY` in
  the environment, never on a command line).
- Measured on the real hub and a closing row at 1440 and 375: every door's code module size against the 3 px
  floor, the copy's contrast over every door's visual with the new gradient, the frame cost of a row of doors
  under a 4x throttle, reduced motion (a still), scripting off, nothing focusable in the river, `/demo` answering
  a 307 to the live demo event locally and on the alias.
- The screenshot gate: the hub's row beside the home hero at 1440 and 375.

## Questions (what the goal leaves open; a recommended answer each; the Orchestrator relays them and quotes the answer back)

- (fill)

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- `docs/systems/design-system.md`: the cards' copy gradient as a rule of the media-forward card (one clause,
  where the door is described).

## Deferred (ROADMAP one-liners, bucket named)

- (fill)

## Handoff (replaces the chat report)

- (fill: the head SHA, the gates on the synced tree, the lane check pasted, the items one line each, the
  questions and their answers, the measurements, assets, system-doc lines, deferred lines, look at first)

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

(fill)
