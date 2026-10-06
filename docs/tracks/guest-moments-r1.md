---
track: guest-moments-r1
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "462cea3f"            # the launch-prep SHA the branch was cut from
board: guest-moments
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/guest-moments/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/guest-flow.md
  - docs/systems/disposable-mode.md
  - docs/systems/reel.md
---

# lp/guest-moments-r1

**Goal.** A new board, guest-moments (desk 45): four moments in a guest's night, each made in text and built, now drawn as real contenders for Will's pick: a first photo's glow (C7), taking a shot back (D3), how a batch of other people's photos lands (Q3), and the reel opening (G6). No production byte.

## The brief

**The round's direction (Will, standing since round 13):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; delight where it costs nothing in clarity; nothing depends on a timeline; immediate, or a clear state and a way to stop it; no AI managing it; cost designed like the architecture; production is the working version, a pick the best of what was drawn, never a rule.

**The moments (the calls lab's round-15 lines, as built today):**
- **C7, a first photo's glow:** it glows for the host but not for the guest who took it; whether the guest sees her own first photo arrive, and how.
- **D3, taking a shot back:** one press, its frame free again; three rolls' worth at most, deleted that night (Settings now says the ceiling: "up to 3 shots in all", identity-r5-wiring); Will's flat 3 re-shoots at any roll is one option to draw.
- **Q3, how a batch of others' photos lands:** about every 15 s; at a phone a batch of six opens the album's top at once and reads empty for a moment (`components/guest/`, the album's window and its arrivals pill).
- **G6, the reel opening:** from the Reel card and from a shared reel link it opens on black, a blink with no progress mark (`event-experience.tsx`'s reel curtain).

**Drawn on production as it is now:** identity r5's house set is production's atoms since `94534554` (fields sunk as wells, keys flat, the chosen afloat, working keys that say what they do), so compose production's own components and their states, never redraw an atom; the brand is Afterglow (brand r1's pick; brand r2's take, Aperture recommended, is Will's open ask: draw on production's tokens and say in the About where a take would change a frame). A question about how something looks or moves is drawn, never argued: each option is a real contender, previewed whole on the real surface at 1440 and 375 on the grounds the moment lives on, with its states (and its motion, where the moment moves: `lab:demo` now takes a motion capture per option).

**These calls were made in text on 2026-10-04 and built that way;** each is now asked as a picture, its built answer drawn as one option (production's own), so Will's pick weighs it against real alternatives. Ask each in plain words; shape the asks yourself (`after` stages one behind another where an answer changes the next); merge two that would ask one decision.

**Open asks nearest yours** (ask nothing they ask): brand r2's `take` and its carried calls; event-header r6's `card` and `attention` (the hub's doors and the colour of what needs her). Check the desk with `node usher/kit/board-card.mjs --desk` once booted.

**Verify on.** The light gate (PROGRAM.md, "Speed over proof in exploration"): typecheck, lint, the board's own tests, `pnpm lab:smoke` and `pnpm lab:demo --board <id>` at 1440 and 375, reduced motion honoured. Measure every tile before it ships: a preview shows what its words claim, read on screen.

Model: Opus. Cut by the cloud-seated Orchestrator; you run in a cloud session of your own (the spawn prompt's boot).

**The board's shape.** The board is one folder, `src/app/(dev)/design/sandbox/guest-moments/`, and nothing else names it: the registry finds it, and retiring it is deleting it. `spec.ts` is `defineExploration` (`src/components/lab/exploration.ts`) and pure data: its id `guest-moments`, its title, `surface`, `desk: 45` (by leverage, lower first) and `lives` (the paths it redraws), its `opening` and `terms`, and every ask with its context layer (`where`, `when`, `matters` beside `lands`, each option's `gains` and `costs`, `because` in a line). `board.tsx` exports one component, `ExplorationBoard` with a preview per option (`PreviewsFor`). `registry.test.ts` holds all of it; `pnpm lab:smoke` and `pnpm lab:demo` run on the board your change reaches.

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
