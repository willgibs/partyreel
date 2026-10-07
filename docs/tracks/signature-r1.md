---
track: signature-r1
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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

## Where I stopped (paused 2026-10-07 for the account's usage window; deleted at the handoff)

- Built: the whole board, five asks on production's surfaces (album, add, door, clip, create), every option drawn at
  375 and 1440, in the room and on paper; typecheck, lint and `test:rules` green at the WIP commit.
- Next, in order: (1) sync once event-header-wiring-2 is on launch-prep and draw the hub's Seam as
  `event-feed/event-hub-head-light.tsx` and `event-hub-head-edge.ts` have it (its proposal: the guest cover ends on
  that same Seam past its actions, which is this board's `seam`/`follow`); (2) the creative director's ten
  refinements (its report: the clip's Seam clipped to the picture, the Add's rest still with each landing lifting it,
  the door's paper Seam raised into the dimmed album rather than a strip on the sheet, the Seam spent before every
  word, the Seam as emitted light (a cream core, a fast fall), 48/64 px reaches, a lighter puck, a softer seed Bloom,
  one-hue Rings, `party` capped, and `chosen` drawn so it differs); (3) the light gate (`lab:smoke`, `lab:demo`) and
  the handoff.

## Questions (a recommended answer each; the Orchestrator relays them)

- Scope: five asks, the app's alone (the Orchestrator's narrowing); the gradient word waits with marketing. Recommended
  and built.
- The hub is drawn, never asked: beside the guest's album at a laptop, its Seam as wired, so the album question is
  read against the light the host already has. Recommended and built.
- The Add's face stays production's (white in the room, ink on paper, in a dark puck on paper); the icon is
  brand-marks'. Recommended and built.

## System-doc edits (in place, owned facts only)

- none yet

## Deferred (ROADMAP one-liners, each naming its bucket and area)

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
