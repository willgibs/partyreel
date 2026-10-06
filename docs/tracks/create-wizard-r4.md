---
track: create-wizard-r4
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "6ccc5b4e"            # the launch-prep SHA the branch was cut from
board: create-wizard
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/create-wizard/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/host-app.md
  - docs/systems/disposable-mode.md
  - docs/reviews/create-wizard.json
---

# lp/create-wizard-r4

**Goal.** Round 4 of the create-wizard board (desk 60): Will's round-3 pick polished (the album styles' step), and two moments of Create made in text and built, now drawn as real contenders: what is left as Settings' steps (F1) and the develop playing while the event is made (F2). No production byte.

## The brief

**The round's direction (Will, standing since round 13):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; delight where it costs nothing in clarity; nothing depends on a timeline; immediate, or a clear state and a way to stop it; no AI managing it; cost designed like the architecture; production is the working version, a pick the best of what was drawn, never a rule.

**Round 3's answer (the ledger, `docs/reviews/create-wizard.json`):** `add` → `styles`, wired since. His note, synthesized: it won on the clear distinction across the three (subtle, conceptual visuals that each carry their mode's experience with its description, rather than full-screen experiences thrown at a new host), and it "could continue to be polished"; he likes Reviewed as a top-level mode and asks whether the plainer "Review" reads better; and when Disposable is picked, its develop time stands directly below the option or on a focused next screen, never tucked under the timeline where it may not be noticed. Start from production's add step as wired (`components/app/create-event-wizard/`), not from round 3's drawings.

**This round's asks:**
- **The styles' polish:** the add step's three styles taken further, his note's points answered in the drawings (the mode's name, where Disposable's time stands, each visual's restraint).
- **F1, what is left as Settings' steps (as built):** at Create's end, what remains flat under the code with ticks, and one line on what guests still need. Is that the right close to Create, and how much of Settings should it carry?
- **F2, the develop playing while the event is made (as built):** "Creating your event…" as the room dims for the code, the sample developing into her code; a failure returns to the look with her work kept. Draw the wait and the failure as real contenders.

F1 and F2 were made in text on 2026-10-04 and built that way; each is now asked as a picture, its built answer drawn as one option (production's own), so Will's pick weighs it against real alternatives. Shape the asks yourself (`after` stages one behind another where an answer changes the next); merge two that would ask one decision. The calls lab's F3 (a sample code until Create) and F4 (a phone's Back leaves Create) stay as built: ask nothing they settle.

**Drawn on production as it is now:** identity r5's house set is production's atoms, so compose production's own components and their states, never redraw an atom; the brand is Afterglow (brand r2's take is Will's open ask: draw on production's tokens and say in the About where a take would change a frame). Every option previewed whole at 1440 and 375, with its states and its motion where the moment moves.

**Open asks nearest yours** (ask nothing they ask): host-moments r1's seven (a host's party: a password added, a develop time added mid-party, the door's decline and block, over her plan with a goal), brand r2's `take`, event-header r6's `card` and `attention`. Check the desk with `node usher/kit/board-card.mjs --desk` once booted.

**Verify on.** The light gate (PROGRAM.md, "Speed over proof in exploration"): typecheck, lint, the board's own tests, `pnpm lab:smoke` and `pnpm lab:demo --board create-wizard` at 1440 and 375, reduced motion honoured. Measure every tile before it ships.

Model: Opus. Cut 2026-10-06 by the cloud-seated Orchestrator; you run in a cloud session of your own (the spawn prompt's boot).

**The board's shape.** The board is one folder, `src/app/(dev)/design/sandbox/create-wizard/`, and nothing else names it: the registry finds it, and retiring it is deleting it. `spec.ts` is `defineExploration` (`src/components/lab/exploration.ts`) and pure data: its id `create-wizard`, its title, `surface`, `desk: 60` (by leverage, lower first) and `lives` (the paths it redraws), its `opening` and `terms`, and every ask with its context layer (`where`, `when`, `matters` beside `lands`, each option's `gains` and `costs`, `because` in a line). `board.tsx` exports one component, `ExplorationBoard` with a preview per option (`PreviewsFor`). `registry.test.ts` holds all of it; `pnpm lab:smoke` and `pnpm lab:demo` run on the board your change reaches.

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
