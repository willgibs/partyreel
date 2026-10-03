---
track: crumbs-60
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "2315adad"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/app/event-settings/camera-settings
  - docs/systems/disposable-mode.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/host-app.md
  - docs/systems/database-security.md
  - src/components/app/event-settings/event-page.tsx
---

# lp/crumbs-60

**Goal.** Settings' develop time can never develop an album by accident: a year half typed and left, or any time in the past, never saves as a develop; a past time asks Develop now's own question first, as the hub's button does.

## The brief

**Why.** crumbs-59, fixing Settings' date field (red-team 47's MEDIUM: it saved every keystroke), found its twin, which is worse because a develop cannot be undone. Settings' develop time (`camera-settings.tsx`'s `DevelopTimeControl`) saves on leaving the field, but accepts any time in the past. The database stores a past time as now (`events_reveal_stamp`), and that save opens every sealed row (`events_develops_rewrite`): Develop now with no question asked. A year left half typed (0002, 0202) would develop the album for every guest.

**Build:**
1. **A time that is not plainly meant never saves:** a year outside a sane window (the date field's own rule, `isSaneDay` in `src/lib/events/dates.ts`: read it, never fork it).
2. **A past time saves only through Develop now's own question,** the hub's words: "Every photo added so far shows now, to every guest." Kept is Keep it as it is.
3. **The field saves a finished time,** never mid-typing, by crumbs-59's rule for the date (`event-page.tsx`'s `EventDatesField`: reuse its approach, never copy its code: lift what both need into one home if it is shared).
4. **Red first:** tests that type a year keystroke by keystroke and leave the field, set a past time, and clear it, each finding today's code saving a develop.
5. **The facts in `disposable-mode.md`,** refined in place.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree, each step on its own exit code; `pnpm lab:smoke --base http://localhost:3131`; red first, logged; a capture at 375 of a past time asking the question, and of a half-typed year refused.

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
