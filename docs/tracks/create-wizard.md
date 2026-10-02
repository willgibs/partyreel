---
track: create-wizard
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "10705484"            # the launch-prep SHA the branch was cut from
board: create-wizard
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/create-wizard/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/disposable-mode.json
  - src/components/app/create-event-wizard.tsx
  - src/app/(app)/dashboard/new/page.tsx
  - src/components/app/qr-preset-picker.tsx
  - src/lib/constants/qr-presets.ts
  - src/app/(dev)/design/sandbox/disposable-mode/
---

# lp/create-wizard

**Goal.** Open the create wizard's redesign board: the whole wizard, minimal and image-led, including the disposable mode's choice step (a named redraw of create=cards with his deeper compare) and Create's hand-off into Settings.

## The brief

**Why.** Will, on `disposable-mode`'s `create` (answered `cards`, 2026-10-02), verbatim:

> The pictures help immediately visualize the distinct experiences, with light copy to clearly define. Should also have an option to compare more deeply somehow. However, the entire create wizard, including this screen, needs to be redesigned and polished. Lots going on. Many parts could be reshaped into more minimal yet high-info-conveyance UI, very text heavy right now.

**The wizard today** (`create-event-wizard.tsx`, 569 lines):
1. **Name:** one field, about 18 words of helper text.
2. **Style:** four QR swatches and a samples note, about 50 words.
3. **Ready:** since tonight's ready-wiring, the code, what's left, and "Get it ready" into Settings' step 1.

Its cap door (at the plan's limit) replaces it.

**Asks, yours to shape:**
- The wizard's shape.
- The mode step, choosing the album or the disposable camera. Disposable mode isn't built yet, so draw the step it will be. It is a named redraw of `disposable-mode`'s answered `create=cards`: say so in its `earlier`, and keep his deeper compare.
- The hand-off moment.

**The direction, one for every board this round** (Will's notes, 2026-10-02):
- **Bespoke and experiential,** with the disposable-mode boards' creativity as the bar. On those boards: "These are so much cooler than the current host dashboard, standard event pages for both host and guest, and other areas of our app. Really creates a bespoke, experiential feeling. Going off my previous notes about wanting to redesign most of our app and especially breaking away from the shadcn generic AI build feel, this is the kind of creativity I like to see."
- **Sleek and modern,** never vintage ("our far more modern app design, which is only getting sleeker as we iterate").
- **Sophisticated, never playful-messy:** "for grids, I'd prefer not to get messy and begin tilting anything, the slight rotation may make us feel too playful for more sophisticated events".
- **Minimal yet high-information,** with far less text ("Many parts could be reshaped into more minimal yet high-info-conveyance UI, very text heavy right now").
- **The bible's ten** (`/design/library`): media is the color, premium is the floor, elegant simplicity.
- **His role:** "I'm just the tastemaker at this point - let's act accordingly, drive your best ideas across our site/app/platform as the world's leading design engineer." Draw your boldest real contenders, as far apart as the real answers are.

**Who asks what tonight, so no two boards ask one decision:**
- `identity` owns the atoms: buttons, fields, chips, cards, sheets, menus, toasts, tooltips, avatars, and the controls' materials, type and motion.
- `host-dashboard` owns the dashboard page.
- `event-header` owns the hub's head and the guest album's head.
- `create-wizard` owns the create wizard.
- `locked-door` r3 owns the door's reveal and idle loops.
- `disposable-mode` r3 owns the disposable camera, its waiting room and its save.
- `demo-framing` r3 owns the home hero's stage and the demo's door.

A page board draws composition, layout, hierarchy and its page's own expression in production's atoms. It names any new atom an option needs, and spends no option on a button's style.

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
