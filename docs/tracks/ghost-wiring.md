---
track: ghost-wiring
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "74f98761"         # the launch-prep SHA the branch was cut from
board: none             # a wiring lane: river-visual's `guest-photos=ghost`, into production
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/guest/gallery-empty-state.tsx
  - src/components/guest/gallery-empty-state.test.tsx
  - src/components/shared/river/
  - src/app/(dev)/design/(shell)/library/components/gallery-demos.tsx
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

- none yet

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- Head <sha>, pushed; synced with launch-prep at <sha> (or: it had not moved)
- Gates on the synced tree, each step's own exit code: design:rules, specimens, typecheck, lint, test (N), build (M pages), lab:smoke
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file + the generated files + any listed system doc
- The river's production home: what was copied, what was left in the lab, and its props
- Measured: weight, frame cost, the pause, reduced motion, JavaScript off, 375 and 1440, light and dark
- Captures (paths)
- Assets requested from Will: none (every image is the Higgsfield month's; an ask names the slot, never the picture)
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Look at first: ...

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
