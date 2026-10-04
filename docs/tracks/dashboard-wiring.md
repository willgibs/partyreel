---
track: dashboard-wiring
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "d1a3a758"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(app)/dashboard/page.tsx
  - src/app/(app)/dashboard/actions
  - src/components/app/dashboard/
  - src/lib/dashboard/
  - docs/systems/dashboard.md
  - supabase/migrations/20261004130000_
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/host-dashboard.json
---

# lp/dashboard-wiring

**Goal.** Wire Will's host-dashboard picks: events=menu (the Display popover, the Recent row, search from 9, her choices kept per the board's carried call) and stage=lit (the lamp-lit band, the code's plate, the rail of Settings' steps) for an event with no photos; the rule stays newest while r4 explores the corner.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish (the viewfinder's corners survive only as a focus mark, never a style, and so does nothing of their loading state); a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline (undated, morning-only and multi-day events all read well); "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control); cost is designed like the architecture (every image and video action multiplies at scale). Production is the working version: a pick is the best of what was drawn, never a rule.

**Will's picks on the host-dashboard board, round 3 (2026-10-04), to wire:** events=menu and stage=lit. Read the board (`src/app/(dev)/design/sandbox/host-dashboard/`: its spec, the drawings of `menu` and `lit`, and its `carried` calls `kept`, `default`, `recent`, `newest` and `light`, each taken as written) and `docs/reviews/host-dashboard.json`; production is the working version and the drawings are the target.
- **events=menu:** "Your events N" with a search field from 9 events and one Display button (its badge counts the settings she changed) opening the popover: Layout (Gallery, Table, List), Sort and its direction, Show (whose, when, year), Group (none or by year), Covers (S, M, L), Reset; a quiet line under the header saying what is set; the Recent row above (from 7 events, the 4 opened last, folding to small cover pills). Defaults: covers, newest first, nothing grouped. Where her choices are kept is the `kept` call: if it is a column on her profile, write the migration under your reserved prefix for the Orchestrator (the Advisor reads it, then it is applied by protocol: grants per `docs/systems/database-security.md`, a host writes only her own row's column).
- **stage=lit:** the dark band lit by the event's lamp (`--lamp-1..5`), brighter the week before; the white plate with the 176 px code (opening production's `CodeCard`) and "Opened N times"; beside it the phase word, the name, the date or "Add the date", the rail of Settings' five steps (Door, Uploads, First photos, Welcome, Code) and the act buttons. For an event with no photos yet.
- **The rule stays today's** (newest leads): host-dashboard r4 is exploring the corner's design again; wire none of its corner.
- **Ownership this round:** `src/app/(app)/dashboard/actions.ts` is yours; `styles-wiring` (Create) may propose a line in it to you through the Orchestrator. `src/components/ui/` belongs to `graphite-wiring`: propose anything you need there.
- The board retires only when its last ask is built (rule is still open): leave its folder.

`docs/systems/dashboard.md` takes the facts in place.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

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
