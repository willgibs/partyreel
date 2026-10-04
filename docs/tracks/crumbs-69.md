---
track: crumbs-69
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "6174f136"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(app)/dashboard/[eventId]/page.tsx
  - src/app/(app)/dashboard/[eventId]/reel/
  - src/components/app/event-feed/hub-opened
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/app/(app)/dashboard/actions.ts
  - src/lib/dashboard/opened.ts
---

# lp/crumbs-69

**Goal.** Two hub crumbs from round 15's ROADMAP: the hub counts as an open for Recent and Last opened, and the old reel route sends a live reel to her own hub's reel while a develop is ahead.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish (the viewfinder's corners survive only as a focus mark, never a style, and so does nothing of their loading state); a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline (undated, morning-only and multi-day events all read well); "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control); cost is designed like the architecture (every image and video action multiplies at scale). Production is the working version: a pick is the best of what was drawn, never a rule.

**★ Local only:** nothing of yours requests the alias, partyreel.com or any *.vercel.app (Hobby's Active CPU). Port 3000 is Will's desk; 3132 is another lane's; yours is 3131.

**The fixes**, each pinned by a test that fails on the old code:
1. **The hub counts as an open.** Today only a press from the dashboard stamps `events.host_opened_at` (`noteEventOpenedAction`, `src/app/(app)/dashboard/actions.ts`; `HomeShell`'s listener), so a deep link, the bell or an email never reaches Recent or Last opened.
   - Mount a small client component on the hub (`/dashboard/[eventId]`) that calls the same action once on mount, as `MarkWelcomedOnMount` does.
   - The action's own once-a-minute filter keeps a reload cheap.
   - It costs one Server Function call a hub visit: say so, and keep it at that (never a poll).
2. **The old reel route** (`/dashboard/<id>/reel`, a redirect) sends a live reel to the guests' page, which has no reel before the develop. While a develop time is ahead, send it to the hub's `?reel`, her own reel (hub-strip-wiring, merged); after the develop, as today.

Wiring rigor: the whole gate. Work economically, with no helper agents; push a WIP commit at each step (this account's weekly usage is near its end).

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
