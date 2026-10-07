---
track: signature-r1
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "e6fa3cc8"            # the launch-prep SHA the branch was cut from
board: signature
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/signature/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/brand.json
  - src/app/(dev)/design/sandbox/brand/spec.ts
  - docs/systems/design-system.md
  - docs/systems/host-app.md
  - docs/systems/guest-flow.md
---

# lp/signature-r1

**Goal.** Board signature r1, desk 6: where Aperture's light lives across the app and marketing, surface by surface: each Ring, Seam and Bloom placed, at rest and answering what happens.

## The brief

**The round's direction (Will, standing):** world-class tastemakers, never "a junior designer told to build a rainbow app"; light, never paint, and restraint is the brand; delight where it costs nothing in clarity; attention earned, never yelled (the one thing that needs her may draw the eye, beautiful and inviting, nothing crowds a screen); nothing depends on a timeline; never dev-tool-ish; production the working version.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app, and nothing deploys. Port 3139 is yours; 3000 is Will's desk.

**The vision you draw in (brand r2, `docs/reviews/brand.json` round 2: take = aperture; its board `src/app/(dev)/design/sandbox/brand/`, the Aperture take's deck in `afterglow/`):** Afterglow's light, never paint, colour from the photographs, then the event's seed, then the house; drawn only as a Ring (round the Add, and the icon), a Seam (where a photograph or a section ends) or a Bloom (behind a screen's one live subject), one to a screen, still until something happens; a status a point and its word. Aperture's answer to paper: the light never touches a light page; it lives in pieces of the room the page holds (the shutter's puck, one lit plate a screen, the foot's slab), as bright as in the room, with Ink's printed rule where paper meets a photograph; the house ember where there is no photograph and no seed; production's gallery white. brand-marks r1 is drawing the marks, tokens and status set beside you: draw on today's tokens and never ask what it asks.

**This board's question: the signature across app and marketing** (brand r2's `when`): one light to a screen, and which. The material waiting for it, each a ROADMAP line: production's footer (`.surface-ink`) already is Aperture's black foot, its top edge lit from the page's photographs the cheapest first wiring; the guest door's sheet wears three lamps (red, amber, green) where Afterglow draws one light sampled from the cover's photograph; the light that answers a real signal rather than looping (the Add's ring with a voice-glow envelope: quick to rise, slow to settle, an idle breath; a glow under the album camera's frame while a clip rolls; a gradient word as ink on paper, never on small badges); the privacy hero's two runners-up (the sweep, the aperture ring) as foundations. The hub's Seam is event-header-wiring-2's (wired this wave, draw it as production has it). Draw on production's own surfaces: the guest door and album, the Add, the camera, the hub, Create's room, the marketing home and footer, at a desk and a phone, in the room and on paper.

**Narrowed to the app (the Orchestrator, 2026-10-07, Will's order to launch: the app, then the admin, then marketing):** the app's light only (the door, the album, the Add, the camera, the hub's Seam as wired, Create's room); the marketing half (the footer's lit edge, the privacy hero's runners-up, a gradient word on marketing paper) waits for the marketing round.

**Never asked here:** the marks and tokens (brand-marks r1), each page's theme (page-themes r1), the home's hero object (demo-framing r6), faces (presence r1); the colour of a count that needs her is tally, settled.

**The method:** a helper per option holding the whole brief, a creative director's fresh-eyes pass, one refinement on everything it names; asset gaps as Higgsfield asks in the Handoff (docs/ASSETS.md's form), the stand-in shipped meanwhile. A board's light gate (PROGRAM's "Speed over proof in exploration").

**The board's shape.** The board is one folder, `src/app/(dev)/design/sandbox/signature/`, and nothing else names it: the registry finds it, and retiring it is deleting it. `spec.ts` is `defineExploration` (`src/components/lab/exploration.ts`) and pure data: its id `signature`, its title, `surface`, `desk: 8` (by leverage, lower first) and `lives` (the paths it redraws), its `opening` and `terms`, and every ask with its context layer (`where`, `when`, `matters` beside `lands`, each option's `gains` and `costs`, `because` in a line). `board.tsx` exports one component, `ExplorationBoard` with a preview per option (`PreviewsFor`). `registry.test.ts` holds all of it; `pnpm lab:smoke` and `pnpm lab:demo` run on the board your change reaches.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The board at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke --base http://localhost:<port>` (it crawls what your change reaches, the board and the desk; `--all` for the whole lab); `pnpm lab:demo --board <board> --base http://localhost:<port>` pressing every step.

## Questions (a recommended answer each; the Orchestrator relays them)

- Scope: five asks, the app's alone (the Orchestrator's narrowing); the gradient word, the footer's lit edge and the
  privacy hero's runners-up wait with marketing on their ROADMAP lines. Recommended and built.
- The hub is drawn, never asked: production's own `HubCover`, resting cards and `HubLight` beside the guest's album at
  a laptop, so the album question is read against the light the host already has. Recommended and built.
- The guest cover's Seam (album `seam`, `follow`) is the hub's own, composed from production's maths and classes
  (event-header-wiring-2's proposal: a guest's first screen wears the hub's one light). Recommended and built.
- The Ring in every new option wears the album's one key light lit from the top-left, today's three hues only on the
  options that are today (the creative director's pass: two hues sweeping round it read as the spectrum creeping
  back); the board's carried call `ring`. Recommended and built.
- The Add's face stays production's (white in the room, ink on paper, in a dark puck on paper); the icon is
  brand-marks'. Recommended and built.

## System-doc edits (in place, owned facts only)

- `docs/systems/design-system.md`, the /design lab's frame line: "Still the lab's" gains an `IntersectionObserver` with
  no root (its root is the lab's viewport, so the hub's cards row folds in a frame; a board draws the resting row from
  its parts), met drawing the hub here (`hub.tsx`'s header).

## Deferred (ROADMAP one-liners, each naming its bucket and area)

- none new: the marketing half stays on its ROADMAP lines (the footer's lit edge, the aurora that answers and its
  gradient word, the privacy hero's runners-up).

## Handoff (replaces the chat report)

- Commits on `lp/signature-r1`, pushed: `c5dc814ae` (the board, WIP at the pause), `e18f5f581` (sync: launch-prep
  with event-header-wiring-2), `ce94d16a6` (the hub's Seam as production draws it, the creative director's
  refinements, the lab's frame fact), `c4fc1524a` (sync: launch-prep with brand-marks-r1 and album-moments-wiring,
  clean); this manifest's commit is the head.
- Gates on `c4fc1524a` (the synced tree), each on its own exit code (logs in the lane's scratch):
  `pnpm typecheck` 0, `pnpm lint` 0, `pnpm test:rules` 0 (85 files, 1467 tests), `pnpm lab:smoke --base
  http://localhost:3139` 0 (23 checks, 0 failing; the board 800 words of 1200), `pnpm lab:demo --board signature
  --base http://localhost:3139` 0 (5 steps, 0 failing, every option drawn at 1440 by 900 and 375 by 812); and on
  `ce94d16a6`, `lab:demo --state screen=1440 --state ground=paper` 0. A board's light gate (no full test run, no build).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = `src/app/(dev)/design/sandbox/signature/` (15 files)
  + this file + `docs/systems/design-system.md` (the one in-place fact above, CLAUDE.md's "Record subtractively").
- album: where a guest album's one light lives: the Add's Ring (today's placement), the cover's Seam (the hub's own,
  the Add unlit), or the Seam then the Ring (recommended); three frames at a phone (its first screen, as the Add docks,
  scrolled in), and the host's hub as built beside them at a laptop.
- add (staged after album): how the Ring rests and answers: today's breath, still with one flare, the envelope on
  each of her photos (recommended: a halo, quick to rise, about two seconds to settle), or the envelope on everyone's;
  a playing frame, four held beats and a trace of the glow over the night's clock.
- door: the sheet's light: today's three lamps, one Seam at the album's edge (recommended: the cover's key light rising
  into the album's dark, never on the sheet, the same in both themes), the Seam growing with her steps, or none.
- clip: the camera while a clip rolls: today's red alone, a Seam under the picture answering the sound (recommended;
  flat when the microphone is refused), or the picture blooming, lit once whatever the sound.
- create: Create's room: today's floor field, dark until her code (recommended: the code lit once in the event's seed),
  or her chosen style's card lit by its photographs.
- Assets requested from Will: none (the bootstrap stills stand in).
- Board ideas: the Seam drawn as emitted light (the creative director's pass on the wired Seam: a cream core, a faster
  fall spending half its light in the first quarter, the edge's hues pulled toward the photograph's key; at a desk it
  read as brown fog with an olive stain at the left) · the kit lending a portalled frame an observer root, so a
  production component that folds on scroll (the hub's cards row) draws itself in a frame.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Calls his to overrule (the board's carried calls): `ring` (the new options' Ring in the album's one key light), `face`
  (the Add's face stays production's), `colour` (every colour production's own read), `hub` (drawn as built, never
  asked).
- Look at first: the album step at a phone (`?session=signature.album`: the Seam at the top, the Add unlit as it docks,
  lit once the Seam has gone), then the door on paper (`?session=signature.door&ground=paper`: the light at the album's
  edge, the sheet clean).
