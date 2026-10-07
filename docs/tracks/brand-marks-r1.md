---
track: brand-marks-r1
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "2e094108"            # the launch-prep SHA the branch was cut from
board: brand-marks
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/brand-marks/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/brand.json
  - src/app/(dev)/design/sandbox/brand/spec.ts
  - src/app/globals.css
  - docs/systems/design-system.md
  - src/lib/brand/wordmark.ts
  - src/components/shared/logo.tsx
---

# lp/brand-marks-r1

**Goal.** Board brand-marks r1, desk 6's first: Aperture's marks made final, drawn on production's own surfaces: the wordmark and the icon, the palette's tokens and the status set.

## The brief

**The round's direction (Will, standing):** world-class tastemakers, never "a junior designer told to build a rainbow app"; light, never paint; restraint is the brand. Delight where it costs nothing in clarity; attention earned, never yelled; production the working version.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app, and nothing deploys. Port 3138 is yours; 3000 is Will's desk.

**From Will's batch (2026-10-06; `docs/reviews/brand.json` round 2):** take = aperture. Brand r2's board (`src/app/(dev)/design/sandbox/brand/`: its spec, the Aperture take's deck in `afterglow/`) is the vision you grow from: on paper the light never touches the page; it lives in pieces of the room the page holds (the shutter's puck, one lit plate a screen, the foot's slab), as bright as in the room; restraint is the craft (one lit plate a screen); its recommendation borrows Ink's printed rule where paper meets a photograph. Its carried calls stand, none overruled: the house ember where there is no photograph and no seed (the lamps lit as one glow from the top-left, amber to coral, never side by side); Aperture keeps production's gallery white; Contact Sheet and Everyone's Color retired; Will's v1 wordmark untouched in brand r2, "the brand-marks board redraws it, if at all, after this pick". Afterglow's settled frame (brand r1): colour from the photographs, then the event's seed, then the house; drawn only as a Ring, a Seam or a Bloom, one to a screen, still until something happens; a status is a point and its word (Standby half-lit with no hue, Ready, Fault).

**This board's question: the marks, final.** Asks you shape (each one decision, options real contenders, previews whole on production's surfaces at a desk and a phone, in the room and on paper): the wordmark (v1 kept and finished, or redrawn in Aperture's hand), the icon (the Ring as the shutter's puck, its home-screen and favicon forms, its paper form), the palette's tokens (the room's blacks and the plate, paper's white, the house ember, the hairlines and ink, each a token production can wear: `globals.css`'s names), and the status set (Standby, Ready, Fault, beside "needs you", which Will already picked at event-header r6 as tally, the camera's red the palette holds, solid and never a light: given, never asked again). Offer the fix at its source: a token-level answer beats a page's.

**Desk 6 after you, never asked here:** where the light lives across app and marketing (the signature board: the footer's lit top edge, the guest door's three lamps, a light that answers a real signal), each marketing page dark or light (page themes), the hero (demo-framing r6), the guest row and the hashvatar (presence r1). Ask nothing those ask. The standing boards' open asks nearest you: none (account-moments' follow, demo-framing's stage and drive-export's exit and naming are other surfaces).

**The method, the bar brand r1 and r2 ran:** a helper per option holding the whole brief, a creative director's fresh-eyes pass ("world-class tastemakers"), one refinement on everything it names; asset gaps become Higgsfield asks in the Handoff naming their slot and theme (docs/ASSETS.md's form), the stand-in shipped meanwhile. A board's light gate (PROGRAM's "Speed over proof in exploration").

**The board's shape.** The board is one folder, `src/app/(dev)/design/sandbox/brand-marks/`, and nothing else names it: the registry finds it, and retiring it is deleting it. `spec.ts` is `defineExploration` (`src/components/lab/exploration.ts`) and pure data: its id `brand-marks`, its title, `surface`, `desk: 6` (by leverage, lower first) and `lives` (the paths it redraws), its `opening` and `terms`, and every ask with its context layer (`where`, `when`, `matters` beside `lands`, each option's `gains` and `costs`, `because` in a line). `board.tsx` exports one component, `ExplorationBoard` with a preview per option (`PreviewsFor`). `registry.test.ts` holds all of it; `pnpm lab:smoke` and `pnpm lab:demo` run on the board your change reaches.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The board at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke --base http://localhost:<port>` (it crawls what your change reaches, the board and the desk; `--all` for the whole lab); `pnpm lab:demo --board <board> --base http://localhost:<port>` pressing every step.

## Questions (a recommended answer each; the Orchestrator relays them)

- none yet

## System-doc edits (in place, owned facts only)

- none yet

## Deferred (ROADMAP one-liners, each naming its bucket and area)

- none yet

## Handoff (replaces the chat report)

**Paused 2026-10-07 for the usage window (the Orchestrator's ask) at `267002f6e`; resume from here.** Done: the four
asks drawn on production's surfaces (wordmark, icon, grade, status), each option refined by its own helper (the
method's helper per option; the grade and status helpers took their ask's three), then the lane's fixes (the wordmark
paste a transform, the sheet's large word fitted, the band's seams a pixel wide, the grade's room frame with its menu
open, the helpers' option words in the spec, the board's own tests `palette/grades.test.ts` and
`wordmark/wordmarks.test.ts`); typecheck, lint and the board's tests green on it. Next, in order: the creative
director's fresh-eyes pass over the 24 captures in `_scratch/brand-marks-r1/cd/` (every option at a desk and a phone),
one refinement on everything it names; a carried call for the display cut's three kisses (Pa, yr, ee at 72px and up);
this manifest's Questions, Deferred and Handoff; the light gate (`test:rules`, `lab:smoke`, `lab:demo --board
brand-marks`, all on :3138); hand off.

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
