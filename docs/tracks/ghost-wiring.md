---
track: ghost-wiring
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "74f98761"         # the launch-prep SHA the branch was cut from
board: none             # a wiring lane: river-visual's `guest-photos=ghost`, into production
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/guest/gallery-empty-state.tsx
  - src/components/guest/gallery-empty-state.test.tsx
  - src/components/shared/river/
  - src/app/(dev)/design/(shell)/library/components/gallery-demos.tsx
  # Claimed mid-lane, both (nobody else claims either; the peer sweep was clean).
  # The library's pages are server components, so the empty state's CTA specimen
  # cannot mint its handler in `gallery-demos.tsx`: `interactive-demos.tsx` is the
  # module that exists for exactly that, and one demo was added to it.
  - src/app/(dev)/design/(shell)/library/components/interactive-demos.tsx
  # And:
  # a @contract-for names a file, so the collector indexes it, so gallery.test.ts
  # demands its `for` line here. The contract the goal asks for cannot be written
  # without these three lines. Three keys added, nothing else touched.
  - src/app/(dev)/design/rules/component-notes.ts
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/river-visual.json
  - docs/design/rulings.md
  - src/app/(dev)/design/sandbox/river-visual/river.tsx
  - src/components/guest/live-gallery.tsx
---

# lp/ghost-wiring

**Goal.** A wiring lane: the answered `guest-photos=ghost` into production. The guest album's empty state
("This is where it all lands") trades its faint 3 by 3 grid of other events' photographs for the river, the
flow of photographs pouring down, faded the same way, so an empty album reads as something arriving rather
than a wall standing still. What comes back: the empty state on the real guest page, the river engine's
production home (`src/components/shared/river/`), a contract for the empty state, and a Library entry.
**Not in this round:** the river in the QR door (the `river-card` board is deciding it), the marketing
placements, retiring `river-visual` (its wiring does that once the card is answered), any other animation
(if Will wants one after seeing this in the app, the parked "pour" is the alternative, not this lane's).

**Binds.** The bible (4 above all: a guest page is the host's event, with minimal branding), the component
contracts, the policies, `docs/design/rulings.md` 2026-09-18, and `docs/systems/guest-flow.md`.

## What he said

On `guest-photos=ghost`: "This is an immediate upgrade to the 'this is where it all lands' empty state.
However, I'd like to see it within the full app to see if a different animation would work better here."
So the lane's job is to put it in the full app, faithfully and well, so he can judge it there.

## What is settled, so build rather than ask

- **Nothing at the top.** The river on a host's album pours from no object: no QR code, no plate, no
  label, no link (`origin: "none"`, as the option was drawn). A demo code on someone's own event would put
  Partyreel's demo inside the host's album, which bible 4 refuses.
- **Faded as today's grid is**: grayscale and turned down (today `opacity-25 grayscale`), as a filter on
  the river's WRAPPER, never a layer over the photographs, `aria-hidden`. At full colour an empty album
  would promise pictures that do not exist.
- **The overlay is kept**: the title on the `subsection` step and the "Be the first to add a photo" CTA
  (only when the viewer can upload; `onAddFirst` drives it), centred over the river as today.
- **The photographs are the guest-ghost pack** (`public/guest-ghost/g01..g09.webp`, 9 grayscale WebPs, 60KB
  in all), not the marketing stills the lab board drew: a guest is on a phone on event Wi-Fi.
- **Sized to the guest column**, 375 first: the real page gives the gallery 343px at a phone and 632px from
  672 up (`event-experience.tsx:165`; `gallery-width` may widen it later, so take the width from the
  container, never a constant). Theme-aware: the guest page's light and dark both hold.
- **The engine is COPIED into `src/components/shared/river/`**, not moved: `river-card` imports
  `sandbox/river-visual/river.tsx` in place while it builds, and `river-visual` retires at its own wiring,
  which then points the card at your copy. Take only what production needs (the flow, the clock, the rest
  state, the pause), drop the lab's origins, captions and QR paths, and keep the engine's own arithmetic
  honest (its header's curve comment at `:63` is stale: the fall is `0.38p²+0.62p`, `:363`).
- **Motion that costs nothing when nobody is looking**: one rAF loop paused off screen and on a hidden tab
  (`useAmbientPause`, the home hero's precedent), the rest state under reduced motion and with JavaScript
  off (the river-visual board's `pre-pour-frame` idea: the first frame lives in CSS), no layout work per
  frame (transform and opacity only).
- **A contract** (`gallery-empty-state.test.tsx`, `// @contract-for:`): decorative and hidden from
  assistive tech, no link and no code in it, the CTA only with `onAddFirst`, still under reduced motion.
  Function, never look.
- **A Library entry** for the river, badged `new`, with its specimen at a phone and at the guest column's
  desktop width (`gallery-demos.tsx` holds the component demos; `pnpm design:rules` indexes a component
  with a contract).

## Verify, and the gate

The empty state at 375 and 1440, light and dark, reduced motion honoured and JavaScript off. Localhost
cannot create an event (sign-in is allow-list gated), so verify on the Library entry and a lab specimen
that renders `GalleryEmptyState` exactly as `live-gallery.tsx:336` does; the Orchestrator shows it on a
disposable event on the alias after the merge. Measure: the photographs' decoded weight and the frame cost
(no long tasks, paused off screen), and that nothing in it is focusable. Dev server on port 3132, stopped
by port (`lsof -ti tcp:3132 | xargs -I{} kill {}`). The gate, each step on its own exit code:
`pnpm design:rules`, `node "src/app/(dev)/design/gallery/collect-specimens.mjs"`, `pnpm typecheck`,
`pnpm lint`, `pnpm test`, `pnpm build`, `pnpm lab:smoke --base http://localhost:3132` (0 failing; it is a
real gate now).

## Questions (what the goal leaves open; a recommended answer each; the Orchestrator relays them and quotes the answer back)

- **The ghost's two numbers.** The brief said "faded as today's grid is (today `opacity-25 grayscale`)";
  what shipped is `grayscale(0.85)` at 40 percent. **Recommended, and built:** the board's, because that
  is the picture Will answered `ghost` on (`river-visual/board.css`, with its reason: the flow moves and
  dissolves at three edges, so it has less to say per pixel than nine static tiles, and a colourless
  stream reads as broken where a colourless grid read as faint). Shipping the mosaic's 25 and full
  desaturation would have shown him something he has not seen. One line in `gallery-empty-state.tsx`
  either way; say the word and it moves.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- `docs/systems/guest-flow.md`, the **Empty state** bullet: the "faint grayscale ghost mosaic" is now the
  river in a square box, with the two facts a later agent needs (the fade is on the WRAPPER; nothing sits
  at the top of the flow, per bible 4).

## Deferred (ROADMAP one-liners, bucket named)

- **Lab.** `river-visual`'s empty-state comparison draws `GalleryEmptyState` as its "today's grid" half,
  so both halves are now the river; the board is answered and retires at river-visual's own wiring, which
  also points `river-card` at `shared/river` and deletes `sandbox/river-visual/`. (bucket: the lab)
- **Guest / app.** The guest-ghost pack's file list is rebuilt by hand in three components
  (`gallery-empty-state.tsx`, `app/dashboard/events-empty-teaser.tsx`, `app/dashboard/empty-section-teaser.tsx`);
  one exported list would be the single source. (bucket: polish)

## Handoff (replaces the chat report)

- **Head** = this commit, pushed. **Synced** with `origin/launch-prep` at `fe55dee8` (merge `7a917819`;
  it had moved: the gallery-width merge and five docs commits). One conflict, `docs/design/library.md`,
  which is generated: regenerated with `pnpm design:rules` rather than resolved by hand. Nothing the
  merge brought in touches a production byte (its own diff outside `docs/` and the lab is `CLAUDE.md`),
  so the guest column is still `max-w-2xl` inside `px-5`.
- **Gates on the synced tree**, each step's own exit code: `design:rules` 0 · specimens 0 (120 specimens
  on 90 entries) · `typecheck` 0 · `lint` 0 (0 errors, the 8 known warnings) · `test` 0 (**2164 tests in
  230 files**, all green; 29 of them are this lane's two contracts) · `build` 0 (**124 routes**, 254
  static pages) · `lab:smoke` 0 (**205 checks, 0 failing**).
- **Lane check**, `git diff --name-only origin/launch-prep...HEAD`, pasted:

  ```
  docs/design/library.md
  docs/systems/guest-flow.md
  docs/tracks/ghost-wiring.md
  src/app/(dev)/design/(shell)/library/components/gallery-demos.tsx
  src/app/(dev)/design/(shell)/library/components/interactive-demos.tsx
  src/app/(dev)/design/gallery/specimens.generated.json
  src/app/(dev)/design/rules/component-notes.ts
  src/app/(dev)/design/rules/rules.generated.json
  src/components/guest/gallery-empty-state.test.tsx
  src/components/guest/gallery-empty-state.tsx
  src/components/shared/river/river-engine.test.ts
  src/components/shared/river/river-engine.ts
  src/components/shared/river/river.css
  src/components/shared/river/river.tsx
  ```

  Owned paths, this file, the one listed system-doc line, and the three generated artifacts
  (`rules.generated.json`, `specimens.generated.json`, `docs/design/library.md`). The two mid-lane claims
  are in the front matter with their reasons; neither file is claimed by another live track.
- **The river's production home**, `src/components/shared/river/`. The previous agent's begun copy was
  KEPT (reviewed line by line against the lab, its arithmetic re-derived by hand and then pinned by the
  new contract): it is a better copy than a fresh one, because it had already done the one thing the move
  needs. Three files: `river-engine.ts` (the arithmetic alone, no React, no DOM), `river.tsx`
  (`<River frames ratio? className? />`, one rAF loop), `river.css` (the masks, the rest state and the
  pour's first frame; 2.1KB in the shipped chunk).
  **Copied**: the flow, the clock, the pour's reveal, gravity, the fan, the tumble, the top-edge recycle,
  the rest state and the two nested masks. **Left in the lab**: the three origins (the demo code, the
  plain plate, and the `Link`, the scan floor and `qrcode-generator` that came with them), the caption,
  the `tone` pairs (production reads the ruled `--shadow-lift`, which is already per ground), the
  manifest stills and their crop table, `RIVER_SIZES` / `RIVER_FACTS`, and the `still` knob (the reader's
  own preference is the only switch in production).
  **Two things genuinely changed**, both of them the move from a lab stage to a container. (1) Every
  length is now a FRACTION of the box, handed to CSS as a percentage of each card's OWN box, so the river
  takes its width from its parent, survives a resize with no listener and paints its rest state on a
  server that cannot know the width; `width`/`height` props are gone. (2) The fall's length is SOLVED
  from the progress by which every card must be gone, instead of the lab's typed 1.26 heights: that
  number was tuned on a 1.32 box pouring from a code, and in the empty album's SQUARE box it cut two of
  nine cards at 0.967 and 0.969, after their progress had already wrapped. The header's stale curve
  comment (the lab's `:63`, still the hero's 0.6p²+0.4p) is corrected in the copy to the real 0.38p²+0.62p.
- **Measured** (headless Chrome over CDP against `:3132`, on the synced tree; the script and the numbers
  are in the captures folder as `measurements.txt`):
  - **Width, from the container**: 335 and 632 CSS px, square at both (the real guest column is
    `max-w-2xl` inside `px-5`, so **335 at a phone**, not the brief's 343, and 632 from 672 up). One
    geometry, no second tuning: the card is 40 percent of the box at both.
  - **The ghost**: computed `filter: grayscale(0.85)`, `opacity: 0.4`, on the WRAPPER; the river's own
    filter is `none`. `pointer-events: none`, `overflow: clip`, `aria-hidden="true"` on all four mounts.
  - **The pause**: 120 rAF calls a second with two rivers on screen, **0 with every river off screen**
    (nearest 8477px away), **0 on a hidden tab**, and it resumes on the frame it stopped on (the clock is
    a ref outside the effect).
  - **Reduced motion**: **0 rAF calls**, 0 inline styles, 36 of 36 cards placed at their rest transform
    (not one collapsed), 32 visible. The settled flow, not an empty box.
  - **JavaScript off** (`Emulation.setScriptExecutionDisabled`): the flow **stands**, at rest, with the
    promise and the CTA over it. That is the `<noscript>` companion rule doing its one job.
  - **Nothing focusable**: 0 focusable nodes, 0 `<a>`, 0 `<svg>` inside any river.
  - **Weight**: the nine guest-ghost WebPs, **43.9KB** in all, 9 requests, none doubled; 240x160 each,
    drawn at 134px on a phone and 253px at 632 (a slight upscale at the desktop width, invisible under
    grayscale at 40 percent). ~1.4MB decoded per river.
  - **Frame cost**: 242 frames in 4s with **four** rivers running at once, median gap 16.7ms, p95 16.7,
    worst 16.8, **zero long tasks**. The real page runs one.
  - **375 and 1440, light and dark**: both hold. The guest page's ground is `:root` (light), which is what
    `river-light-running.png` and `river-no-js.png` show; dark is the lab's own default in the others.
- **Captures** (`/private/tmp/partyreel-captures/ghost-wiring/`, not committed):
  `river-light-running.png` (the guest ground, flowing) · `river-no-js.png` (scripting off, the rest
  frame) · `river-reduced-motion.png` · `river-375-light.png` · `river-375-dark.png` ·
  `river-1440-light.png` · `river-1440-dark.png` · `measurements.txt`.
- Assets requested from Will: none (every image is the Higgsfield month's; an ask names the slot, never the picture)
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- **Look at first**: `/design/library/river` at a phone width, then the real thing on a disposable event
  on the alias, which is the whole point of the lane: Will asked to see it "within the full app to see if
  a different animation would work better here". Two things to look at while he does. The river leaves
  the box's CORNERS empty where the 3 by 3 mosaic filled them, which is the candidate as drawn and reads
  as a column of photographs rather than a wall. And a river that has NEVER been on screen is invisible
  (the CSS pre-pour frame) until it scrolls into view and pours: correct on the guest page, where the
  empty state is above the fold, and worth knowing before anyone places the river low on a long page.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-18). The guest album's empty state traded its faint 3 by 3
grid for the river, Will's `guest-photos=ghost` put into the full app so he could judge it there. The
engine was copied out of the lab into `src/components/shared/river/` and rewritten in fractions of its
box, so it takes its width from the guest column rather than a constant, and the fall's length is now
solved from the cut instead of typed, which fixed two cards that recycled in plain sight in a square box.
The picture is ghosted by a filter on the placement's wrapper at the values the board was answered on,
nothing sits at the top of the flow (bible 4), and one rAF loop stops off screen, on a hidden tab and
under reduced motion, with the settled flow in the server's own HTML for everyone else. Two contracts and
a Library entry came with it.
