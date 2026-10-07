---
track: presence-r1
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "3569b33b"            # the launch-prep SHA the branch was cut from
board: presence
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/presence/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/brand.json
  - src/app/(dev)/design/sandbox/brand/spec.ts
  - docs/systems/profiles-social.md
  - docs/systems/guest-flow.md
  - src/lib/avatar/gradient.ts
---

# lp/presence-r1

**Goal.** Board presence r1, desk 6: the guest row (her party's faces, the newest ringed in light) and the hashvatar wherever they earn a place, in Aperture, inside the guest rules for who sees whose face.

## The brief

**The round's direction (Will, standing):** world-class tastemakers, never "a junior designer told to build a rainbow app"; light, never paint, and restraint is the brand; delight where it costs nothing in clarity; attention earned, never yelled (the one thing that needs her may draw the eye, beautiful and inviting, nothing crowds a screen); nothing depends on a timeline; never dev-tool-ish; production the working version.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app, and nothing deploys. Port 3134 is yours; 3000 is Will's desk.

**The vision you draw in (brand r2, `docs/reviews/brand.json` round 2: take = aperture; its board `src/app/(dev)/design/sandbox/brand/`, the Aperture take's deck in `afterglow/`):** Afterglow's light, never paint, colour from the photographs, then the event's seed, then the house; drawn only as a Ring (round the Add, and the icon), a Seam (where a photograph or a section ends) or a Bloom (behind a screen's one live subject), one to a screen, still until something happens; a status a point and its word. Aperture's answer to paper: the light never touches a light page; it lives in pieces of the room the page holds (the shutter's puck, one lit plate a screen, the foot's slab), as bright as in the room, with Ink's printed rule where paper meets a photograph; the house ember where there is no photograph and no seed; production's gallery white. brand-marks r1 and signature r1 are on the desk (the marks, tokens and status set; where the light lives in the app): draw on today's tokens and never ask what they ask.

**This board's question (the round-15 plan's presence r1):** Will loved event-header's old `faces` option, the avatar row with the newest ringed in light ("love it… explore ways to include it anywhere"), with transitions.dev's avatar-group hover (`.agents/skills/transitions-dev/11-avatar-group-hover.md`). Draw the guest row wherever it earns a place, and the hashvatar (`src/lib/avatar/gradient.ts`) as the atmosphere of screens without media, in Aperture's palette. Privacy is the frame: who sees whose face follows the guest rules in the app (`docs/systems/profiles-social.md`, `guest-flow.md`); on the marketing site fixtures only, never a real face or name; draw from what the product holds; "who's here now" is a Question in your Handoff with its Realtime cost, never assumed.

**Never asked here:** the Guests room's person rows and the person's card (a guests-room board after host-moments-wiring), the marks and tokens (brand-marks r1), where the light lives (signature r1).

**The method:** a helper per option holding the whole brief, a creative director's fresh-eyes pass, one refinement on everything it names; asset gaps as Higgsfield asks in the Handoff (docs/ASSETS.md's form), the stand-in shipped meanwhile. A board's light gate (PROGRAM's "Speed over proof in exploration").

**The board's shape.** The board is one folder, `src/app/(dev)/design/sandbox/presence/`, and nothing else names it: the registry finds it, and retiring it is deleting it. `spec.ts` is `defineExploration` (`src/components/lab/exploration.ts`) and pure data: its id `presence`, its title, `surface`, `desk: 10` (by leverage, lower first) and `lives` (the paths it redraws), its `opening` and `terms`, and every ask with its context layer (`where`, `when`, `matters` beside `lands`, each option's `gains` and `costs`, `because` in a line). `board.tsx` exports one component, `ExplorationBoard` with a preview per option (`PreviewsFor`). `registry.test.ts` holds all of it; `pnpm lab:smoke` and `pnpm lab:demo` run on the board your change reaches.

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
