---
track: create-wizard-r5
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "6d216dd9"            # the launch-prep SHA the branch was cut from
board: create-wizard
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/create-wizard/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/create-wizard.json
  - docs/PRD.md
  - docs/systems/host-app.md
  - src/components/app/create-event-wizard.tsx
  - src/lib/events/readiness.ts
---

# lp/create-wizard-r5

**Goal.** Board create-wizard r5: Create finishes the event, its close the payoff of a made event, and the style step's previews rethought, from Will's round-4 notes.

## The brief

**The round's direction (Will, standing):** delight where it costs nothing in clarity; attention earned, never yelled (PRD.md); immediate, or a clear state and a way out; never dev-tool-ish; world-class tastemakers; production the working version.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app, and nothing deploys. Port 3133 is yours; 3000 is Will's desk.

**Round 5, from Will's round-4 answers (`docs/reviews/create-wizard.json`; all wired by create-wizard-wiring: the focused styles with Disposable's own screen, the one-line close, a failure held):** his notes are this round's brief, and their wording is the point:
- On close: "How we present this line can definitely be designed better. I do like the subtlety versus the steps, though. Rather than shouting about what's done and what's to come, we should simply continue naturally guiding them through. Anything required for an event to go live immediately should be cleanly handled in the event wizard with a focused view, with nothing being left to be handled in settings, only additional/optional configs or changing the selections made in the creation wizard. In my trial run, it felt weird to go through a create wizard, complete, then feel like you're only halfway done. Really reduces that reward moment at the end of the wizard... Nailing this seamless creation and entry would be a huge win. Really want hosts to feel excited that their event has been created, since that's the big payoff moment and there's a noticeable gap until the next payoff of guests uploading unless the host uploads earlier themselves." (PRD.md's core loop now says it: Create finishes the event.)
- On styles: "I'm still split on the timeline on the actual mode selection screen (kind of hard mental model to keep 9 screens in your head to compare, and feels overwhelming seeing 3 things happen at once each step), and curious if we think of better ways to enhance this selection instead. Good exploration to run. Maybe one can play the live visual demo of the active selection, while the others stay still until selected to preview themselves? That should be far from the exhaustive list of explorations. You're far more creative than I am."

**What the code says (for your drawings):** Create already does every essential readiness item but the code's share (the door and adds are done at Create; `code` is the one left; photos and the welcome are not essential: `readiness.ts`), so the halfway feeling is the beat's presentation, its "Get it ready" foot leading into Settings, and the hub's checklist meeting her next, not a missing setting.

**Asks you shape (each one decision, real contenders, drawn on production's own room and atoms):** (1) Create's close as the payoff: what the made event's last screen says and does (the excitement, the code's share as the one next step said naturally, where "Get it ready" goes, how she enters her hub), with the hub's first arrival and its checklist in the picture; (2) the style step's previews: how three styles are told apart without three stories playing at once (one playing, the others still until picked; and your own better ideas); (3) the gap audit's open question, folded in only if it earns an ask: a kind of event (a wedding, a birthday) that sets Create's defaults and stock covers, or none.

**Nearest standing asks (ask nothing they ask):** brand-marks r1 and signature r1 (the marks, the tokens, where the light lives in the app); account-moments r2 (follow, the invitation).

**The method:** a helper per option, one fresh-eyes pass, a board's light gate (PROGRAM's "Speed over proof in exploration").

**The board's shape.** The board is one folder, `src/app/(dev)/design/sandbox/create-wizard/`, and nothing else names it: the registry finds it, and retiring it is deleting it. `spec.ts` is `defineExploration` (`src/components/lab/exploration.ts`) and pure data: its id `create-wizard`, its title, `surface`, `desk: 60` (by leverage, lower first) and `lives` (the paths it redraws), its `opening` and `terms`, and every ask with its context layer (`where`, `when`, `matters` beside `lands`, each option's `gains` and `costs`, `because` in a line). `board.tsx` exports one component, `ExplorationBoard` with a preview per option (`PreviewsFor`). `registry.test.ts` holds all of it; `pnpm lab:smoke` and `pnpm lab:demo` run on the board your change reaches.

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
