---
track: host-moments-r1
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "462cea3f"            # the launch-prep SHA the branch was cut from
board: host-moments
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/host-moments/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/host-app.md
  - docs/systems/disposable-mode.md
  - docs/systems/billing-caps.md
---

# lp/host-moments-r1

**Goal.** A new board, host-moments (desk 40): four moments in a host's run of her party, each made in text and built, now drawn as real contenders for Will's pick: adding a password to an album guests are already in (B1), a develop time added mid-party (Q6), declining or blocking someone at the door (B2), and being over her plan with a goal (L3). No production byte.

## The brief

**The round's direction (Will, standing since round 13):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; delight where it costs nothing in clarity; nothing depends on a timeline; immediate, or a clear state and a way to stop it; no AI managing it; cost designed like the architecture; production is the working version, a pick the best of what was drawn, never a rule.

**The moments (the calls lab's round-15 lines, as built today):**
- **B1, adding a password:** guests already in stay in on every device; anyone still waiting at the door meets the password like anyone new; she is warned first (Settings' door page, `components/app/event-settings/door-page.tsx`, and the warning before the save).
- **Q6, a develop time added mid-party:** every guest's roll refills (the Advisor thought a host would not expect it); what she is told before she saves, and what her guests see.
- **B2, declining and blocking:** the shut door with no second ask; Let back in tells her the outcome (the hub's Guests room, `components/app/event-feed/`).
- **L3, over her plan with a goal:** the banner opens the size list ("5.3 GB left to free to fit your plan"): what the banner says, where it leads, and how the goal reads as she frees space (`components/app/storage/`).

**Drawn on production as it is now:** identity r5's house set is production's atoms since `94534554` (fields sunk as wells, keys flat, the chosen afloat, working keys that say what they do), so compose production's own components and their states, never redraw an atom; the brand is Afterglow (brand r1's pick; brand r2's take, Aperture recommended, is Will's open ask: draw on production's tokens and say in the About where a take would change a frame). A question about how something looks or moves is drawn, never argued: each option is a real contender, previewed whole on the real surface at 1440 and 375 on the grounds the moment lives on, with its states (and its motion, where the moment moves: `lab:demo` now takes a motion capture per option).

**These calls were made in text on 2026-10-04 and built that way;** each is now asked as a picture, its built answer drawn as one option (production's own), so Will's pick weighs it against real alternatives. Ask each in plain words; shape the asks yourself (`after` stages one behind another where an answer changes the next); merge two that would ask one decision.

**Open asks nearest yours** (ask nothing they ask): brand r2's `take` and its carried calls; event-header r6's `card` and `attention` (the hub's doors and the colour of what needs her). Check the desk with `node usher/kit/board-card.mjs --desk` once booted.

**Verify on.** The light gate (PROGRAM.md, "Speed over proof in exploration"): typecheck, lint, the board's own tests, `pnpm lab:smoke` and `pnpm lab:demo --board <id>` at 1440 and 375, reduced motion honoured. Measure every tile before it ships: a preview shows what its words claim, read on screen.

Model: Opus. Cut by the cloud-seated Orchestrator; you run in a cloud session of your own (the spawn prompt's boot).

**The board's shape.** The board is one folder, `src/app/(dev)/design/sandbox/host-moments/`, and nothing else names it: the registry finds it, and retiring it is deleting it. `spec.ts` is `defineExploration` (`src/components/lab/exploration.ts`) and pure data: its id `host-moments`, its title, `surface`, `desk: 40` (by leverage, lower first) and `lives` (the paths it redraws), its `opening` and `terms`, and every ask with its context layer (`where`, `when`, `matters` beside `lands`, each option's `gains` and `costs`, `because` in a line). `board.tsx` exports one component, `ExplorationBoard` with a preview per option (`PreviewsFor`). `registry.test.ts` holds all of it; `pnpm lab:smoke` and `pnpm lab:demo` run on the board your change reaches.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The board at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke --base http://localhost:<port>` (it crawls what your change reaches, the board and the desk; `--all` for the whole lab); `pnpm lab:demo --board <board> --base http://localhost:<port>` pressing every step.

## Questions (a recommended answer each; the Orchestrator relays them)

- none yet

## System-doc edits (in place, owned facts only)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

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
