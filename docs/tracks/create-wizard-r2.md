---
track: create-wizard-r2
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "7a875407"            # the launch-prep SHA the branch was cut from
board: create-wizard
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/create-wizard/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/create-wizard.json
  - docs/reviews/disposable-mode.json
  - src/components/app/create-event-wizard.tsx
  - src/app/(app)/dashboard/new/
  - src/components/app/qr-preset-picker.tsx
  - src/lib/events/readiness.ts
  - docs/systems/host-app.md
---

# lp/create-wizard-r2

**Goal.** Create round two: the room's experience designed whole, screen by screen, in his layout (steppers at the top, the question just under them, the answer's space in the centre, one button at the foot), with the night compare, the code's look and the lit beat each redrawn for the room.

## The brief

**Why.** Will answered `create-wizard` r1 on 2026-10-02 (`docs/reviews/create-wizard.json`): `shape=screen` (a room of its own), `mode=night` (the cards playing the night on a slider), `hand=lit` (the code alone, lit). His notes, verbatim:
- on `shape=screen`: "Much better direction, though some of these screens (how guests add, code's look, the beat) could all be improved. May be better design to always keep the question up top so users aren't searching for the spot of the new one in a centered group each time, keeping the button at the bottom, and using the center space as needed. The name screen, for example, would be "Name your event" up top, input center, continue bottom. Then on the next screen for how guests add, the "How will guests add photos" will also be at the top and give more space in the center for clearer UI. Knowing we're giving it a room of its own, think we could use a second-layer exploration to design that room experience flow perfectly. Love the subtle steppers up top now, question would be a bit below that, lower at the top."
- on `hand=lit`: "I like this direction more because once they've created their event, we'd rather continue funneling them into the event rather than stop here and ask them to simply explore the guest experience. This screen presents more cleanly with less going on (first win), but also keeps hosts in the event flow where they can explore the event as a guest from their (ideally) completed host event page rather than mid-setup. That should feel like a final payoff, not mid-point distraction."

**Settled, drawn in every option:** the room; his layout (subtle steppers at the top, the question just under them and always in one place, the answer's space in the centre, one button at the foot); night; lit, its beat funnelling into Get it ready and Settings' first step (the hub's "See it as a guest" is the payoff, `event-header` r2's, never mid-setup); and round one's settled lines (one field, the code's look a step on samples, the beat once, the camera's step after the name, the door at the cap).

**Round two's asks** (yours to shape; each a decision drawn whole): `add`, the night compare built for the room's centre; `look`, the code's look on samples; `beat`, the lit code's arrival, its acts and what is left; `flow`, how one screen becomes the next, Back, and the steppers; and `name` only if its centre holds a real decision. The camera's step mounts the disposable foundation's control (`camera-settings`, being built now) when the wizard is wired, so draw it as that control's place. Folded in as a drawn detail: Create's hand-off lists what is left without the account's storage (`/dashboard/new` reads none; the ROADMAP's Host line).

**Who asks what this round:** identity owns the atoms (draw in production's); the dashboard, the hub's head and the hero are their own boards.

**The direction, one for every board and wiring this round** (Will's notes, 2026-10-02):
- **Bespoke and experiential**, sleek and modern (never vintage), sophisticated (never playful-messy: "for grids, I'd prefer not to get messy and begin tilting anything"), minimal yet high-information with far less text, and the bible's ten (`/design/library`: media is the color, premium is the floor).
- **Who it is for**, his words with this desk: "Want to ensure we feel bespoke without getting too dev-tool-ish, remaining a modern consumer app usable for anyone at any event (it's okay if grandma and grandad slip through, would rather frame this as cool to a younger expected host/guest crowd, probably 18 [parties] to 50ish [event guests, conference attendees). Don't want to build a boring app just for the least tech-friendly guests. Seems like our core entry -> upload -> view path is pretty clear for anyone."
- **His role**: "I'm just the tastemaker at this point - let's act accordingly, drive your best ideas across our site/app/platform as the world's leading design engineer." Build and draw your boldest real answer; he picks and steers.

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
