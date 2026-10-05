---
track: library-specimens
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "00714317"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/(shell)/library/components/
  - src/app/(dev)/design/(shell)/library/compositions/
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/components/app/export/export-toast.tsx
  - src/components/app/export/export-walk.ts
  - src/lib/export/walk.ts
  - src/app/admin/jobs/limits-card.tsx
  - src/lib/jobs/limits-watch.ts
  - src/lib/jobs/limits-watch-limits.ts
  - src/components/ui/tooltip.tsx
---

# lp/library-specimens

**Goal.** Three Library specimens the round's lanes asked for, so lab:smoke renders their states: the download toast's states, the Plan limits card, and TapTooltip beside the Tooltip entry.

## The brief

**Why:** three lanes deferred a specimen so `pnpm lab:smoke` renders a component's states and a regression is caught:
- **small-fixes and crumbs-65:** the download toast (`src/components/app/export/export-toast.tsx`) in its states: the cancel question, "Download cancelled.", a dropped connection, a line lost mid-stream, the done state;
- **limits-watch:** the "Plan limits" card (`src/app/admin/jobs/limits-card.tsx`, presentation-only) healthy, critical, with a failed read and with gaps ("Not wired");
- **graphite-wiring:** the Library's Tooltip entry ("useless on touch", `library/components/gallery-demos.tsx`) gains a `TapTooltip` specimen beside it (`src/components/ui/tooltip.tsx`).

**How:** follow the Library's own pattern for an entry (the existing demos in `library/components/` and `library/compositions/`). Fixtures only: no Server Function, no network, never a real account. Each specimen states its component's file. A light gate is enough for Library work (dev-only, `docs/PROGRAM.md`, "Speed over proof in exploration"): typecheck, lint, the Library's tests, `pnpm lab:smoke --base http://localhost:3131`.

Nothing of yours requests Vercel (Hobby's Active CPU). Port 3131 is yours; 3000 and 3132 are not. Work economically, with no helper agents; push a WIP commit at each step (this account's weekly usage is near its end).

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

All three are built as recommended; each is Will's to overrule.

- **Where does each specimen live?** The download toast is a Compositions entry in a new "Downloads" section
  (`export-toast.tsx` sits in `src/components/app`, which that family exists for); the Plan limits card is a
  Compositions entry in "The operations portal", beside its sibling admin entries; TapTooltip is a second specimen
  on the Tooltip entry (Components, Overlays), whose `for` line stops saying "useless on touch" and now names its
  test. Recommended: as built.
- **The toast's states are fired, not drawn.** Sonner holds a toast only after a call, so no server render can carry
  one and a drawing would copy markup the component does not export. The entry is a panel of buttons firing the real
  `exportToasts` on the page's own toaster, one toast updated in place by its id as in production; the toast's own
  controls (the x, the question's answers, Try again) walk a fixture between states with no request. All nine tones,
  the five the lanes named first; a test with the real Toaster presses each and reads its words, so a regression
  fails the gate and not only a look. Recommended: as built.
- **Plan limits' states stand as whole cards** (healthy, critical, a failed read, gaps) built from the real
  `METERS`, so a new meter appears by itself, plus the two short "nothing to show" cards (never read, unreadable).
  Four cards on one page repeat the card's DOM ids (`#plan-limits`, `#limit-<meter>`): harmless here (the labels they
  point at read the same) and never in the portal, which draws one. The alternative, one card and a switch, would
  leave three of the four states outside the server render `lab:smoke` crawls. Recommended: as built.

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
