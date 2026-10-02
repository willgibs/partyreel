---
track: identity
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "04afe52d"            # the launch-prep SHA the branch was cut from
board: identity
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/identity/
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/components/ui/
  - src/app/globals.css
  - src/app/theme.css
  - src/lib/glass.ts
  - docs/systems/design-system.md
  - src/app/(dev)/design/(shell)/library/
  - src/app/(dev)/design/rules/bible.ts
---

# lp/identity

**Goal.** Open Partyreel's identity board: three or four complete atomic families, each one identity across every primitive, judged on a specimen and on three real screens, so the product stops reading as a shadcn library at the atomic level.

## The brief

**Why.** Will's library prompt, 2026-10-02, verbatim:

> Our component library still substantially resembles the original shadcn foundation without diverging enough to create an identity of our own. It makes our experience feel generically AI-designed, because even with more custom layouts and features, we still present as a Shadcn library at the atomic level. Please run as many explorations as needed to make Partyreel feel distinctly bespoke.
>
> I recognize there's only so many ways to design some smaller components, such as an achromatic button. However, the goal is to feel distinct as a sum total of all of our parts, not to simply make each of our borrowed components drastically different individually.
>
> The library components simply represent the progress we've made so far, not a locked vault. That's the importance of Rising Tides - absolutely everything is unprotected and may be re-litigated in search of better, and ultimately best, experiences and systems. Cautious steps only slow us down.

**The first ask, `family`.** Three or four complete atomic families, each one identity across every primitive:
- actions: buttons, icon buttons, links and chips;
- fields and selection: inputs, selects, switches, toggles and segmented controls;
- surfaces and overlays: cards, sheets, dialogs, popovers, menus, toasts and tooltips;
- status: badges, progress, skeletons, avatars and empty states;
- the materials, type and light the family stands on, and its interaction motion (rest, hover, press, focus, disabled, error).

A family is a sum, not a set of restyled parts. Name each by its idea, and keep them as far apart as real answers are.

**How each is drawn:**
- **A specimen sheet** of the atoms in their states.
- **Three real screens, redressed:** the host hub's head (with tonight's checklist and corner mark), a Settings step page, and the guest's Add sheet.
- **How the screens are made:** mount production's own components inside the frame under a scope that applies the family's tokens and atom variants. This is the fix at its source, and it keeps the comparison honest.
- **Widths:** every frame at 1440 and 375.

**Fixed points:**
- The bible's ten are Will's. If a family's idea bends one (for instance "media is the color", achromatic chrome), draw it so and name the principle in that option's costs.
- Every family keeps one token set.

**More asks.** Stage them behind `family` (`after`) only where a family's own details are a real second decision, such as its type pairing or its density. Later rounds narrow by atom group inside the picked family, as many as it takes, so don't ask everything now.

**Lives:** `src/components/ui/`, `src/app/globals.css`, `src/app/theme.css`, `src/lib/glass.ts` and the Library's component catalog. Its pick is wired at the source, so every screen changes at once.

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

**The board's shape.** The board is one folder, `src/app/(dev)/design/sandbox/identity/`, and nothing else names it: the registry finds it, and retiring it is deleting it. `spec.ts` is `defineExploration` (`src/components/lab/exploration.ts`) and pure data: its id `identity`, its title, `surface`, `desk: 10` (by leverage, lower first) and `lives` (the paths it redraws), its `opening` and `terms`, and every ask with its context layer (`where`, `when`, `matters` beside `lands`, each option's `gains` and `costs`, `because` in a line). `board.tsx` exports one component, `ExplorationBoard` with a preview per option (`PreviewsFor`). `registry.test.ts` holds all of it; `pnpm lab:smoke` and `pnpm lab:demo` run on the board your change reaches.

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
