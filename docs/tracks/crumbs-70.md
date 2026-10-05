---
track: crumbs-70
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "698acd8f"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/api/stripe/change-plan/
  - src/components/app/dashboard/display-menu.tsx
  - src/components/social/profile-actions-menu.tsx
  - src/components/app/dashboard/stage-lit.tsx
  - src/components/app/create-event-wizard/
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/components/ui/floating-layer.ts
  - src/lib/billing/plan-facts.ts
---

# lp/crumbs-70

**Goal.** Three ROADMAP crumbs: a switch from /pricing's hop says the uploads sentence; two menus read the floating gutter's name; the lit stage's lamp ignites once as she lands from Create.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish (the viewfinder's corners survive only as a focus mark, never a style, and so does nothing of their loading state); a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline (undated, morning-only and multi-day events all read well); "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control); cost is designed like the architecture (every image and video action multiplies at scale). Production is the working version: a pick is the best of what was drawn, never a rule.

**★ Local only:** nothing of yours requests the alias, partyreel.com or any *.vercel.app (Hobby's Active CPU). Never a Stripe object or key: the change-plan route's tests mock Stripe as they do today.

**The fixes**, each pinned by a test that fails on the old code:
1. **A Pro host's switch from `/pricing`'s hop** (the checkout button's `already_subscribed` re-post to change-plan) carries no uploads sentence (`uploadsPauseNote`, crumbs-64). The change-plan route answers the notice, and the hop shows it before it redirects. The plan sheet's own switch keeps its words. Never block what the webhook allows; the webhook stays the sole writer of the tier.
2. **Two menus** (`dashboard/display-menu.tsx`, `src/components/social/profile-actions-menu.tsx`) type `collisionPadding={8}`, the number `floatingGutter` (`ui/floating-layer.ts`) now names: read it.
3. **The lit stage's lamp ignites once as she lands from Create.** host-dashboard r3's drawing lit it on arrival; production's wired `LampLight` has no ignition. Create tells the dashboard she just made the event (a flag on the landing: a query parameter Create sets, read once and removed from the address), and the stage plays the ignition once. Reduced motion lands lit at once.
   - Create's files are yours only for setting that flag. If another file must change, it is an exception named in your Handoff.

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
