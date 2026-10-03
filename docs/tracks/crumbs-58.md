---
track: crumbs-58
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "ac73941e"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/utils.ts
  - src/lib/dashboard/when
  - src/app/(guest)/u/[slug]/party-cards
  - docs/systems/dashboard.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/design-system.md
  - docs/systems/guest-flow.md
---

# lp/crumbs-58

**Goal.** Date ranges read compact everywhere, "October 2–4, 2026" (Will's pick, 2026-10-03: "let's go 'X-Y', it presents cleaner than 'X to Y'. Less space, more compact."), in production's one formatter and the dashboard's range words.

## The brief

**Why.** event-dates (merged at `6f700751`) says a range with "to": `formatEventDate` in `src/lib/utils.ts` ("October 2 to 4, 2026") and the dashboard's own range words in `src/lib/dashboard/when.ts` ("Tue to Thu", "Sep 25 to 27", "Friday, October 2 to Sunday, October 4"). Will overruled it: "let's go 'X-Y', it presents cleaner than 'X to Y'. Less space, more compact."

**Build:** every range in production says it with an en dash, by the typographer's rule: closed up between single terms ("October 2–4, 2026", "Tue–Thu", "Sep 25–27") and spaced when either side holds a space ("September 30 – October 2, 2026", "Friday, October 2 – Sunday, October 4"). The one-day spelling is unchanged, and so is every other word ("Day 2 of 3", "Live today"). It happens in the formatters themselves, so every reader (the heads, the door, See it as a guest, Settings' sentence, `/u/` cards, the dashboard's week, stage and tiles) follows with no edit of its own: find each by `formatEventDate` and `when.ts`'s callers and confirm by capture, never by a guess. Tests are reshaped on purpose, each keeping its real scar. `dashboard.md`'s range lines are refined in place.

If a screen reader reads the dash as a pause or a glyph where "to" carried the meaning, say so in your Handoff with what you measured, and propose the smallest fix as a Question rather than building it.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree, each step on its own exit code; `pnpm lab:smoke --base http://localhost:3133`; captures at 375 of a range at the door, in the hub head, in Settings' sentence and on the dashboard's stage and week (fixtures through production's composition, as event-dates did).

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

## Where I am

- WIP at `f0794eba` (pushed): the formatters and their tests are done and green (full suite 849 files, typecheck and
  lint 0): `dashRange` in `lib/utils.ts` is the rule's one home; `formatEventDate`, `rangeWhen` and `longDays` say
  their range through it; `dashboard.md` refined. Left: the 375 captures through a scratch composition (door, hub head,
  Settings' sentence, the stage and the week), build and `lab:smoke`, the screen-reader finding and the Questions
  below, then the Handoff.

