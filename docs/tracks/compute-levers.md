---
track: compute-levers
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "6c075373"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/proxy.ts
  - src/lib/supabase/middleware.ts
  - src/lib/shared/use-live-poll
  - src/app/manifest.ts
  - docs/systems/architecture.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - scripts/compute-model/model.mjs
  - scripts/compute-model/budget.json
---

# lp/compute-levers

**Goal.** Build the compute model's first two levers: the proxy runs only where a session matters, and an album's polls rest. Prove both with `pnpm compute:model` and a rebased budget.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish (the viewfinder's corners survive only as a focus mark, never a style, and so does nothing of their loading state); a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline (undated, morning-only and multi-day events all read well); "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control); cost is designed like the architecture (every image and video action multiplies at scale). Production is the working version: a pick is the best of what was drawn, never a rule.

**Why:** Will's foundational fix for Vercel's compute (2026-10-04). The compute model (merged; report `../partyreel-wt/_scratch/compute-model/report.md`, read "The levers" whole) found that a 100-guest wedding is 56,000 to 85,000 function calls. The proxy is half of every call count, and a lit album's safety-net poll is 13% of them.

**★ Local only:** Nothing of yours requests the alias, partyreel.com or any *.vercel.app: the team is at Hobby's Active CPU limit. `pnpm compute:model --port <yours>` measures everything locally.

**Lever 1: the proxy only where a session matters.**
- **The matcher** keeps the pages that render a session: `/dashboard`, `/account`, `/me`, `/welcome`, `/login`, `/auth`, `/e`, `/u`, `/report`, `/admin`, and `/design` for its key gate.
- **The admin host:** add a `has: host` entry so the admin host still sends every path through the surface rule (`src/lib/surface`, `decideBySurface`).
- **API routes leave the matcher.** Each refreshes its own session where it reads one (`setAll` works in a route handler). Prove every API route that reads a session still does, and that an expired access token is refreshed on the next page load.
- **Prefetches and static paths leave it.** That includes `/manifest.webmanifest`, one proxy run on every desktop page load.
- **The guest page's footer links take `prefetch={false}`:** 6 to 14 prefetches a join, each a proxy run. If that file is outside your list, it is an exception named in your Handoff.
- **Security first** (CLAUDE.md, RLS is the boundary): the proxy was never the boundary, but every Server Function and route handler must still re-verify with `getUser()`. Check that no route relied on the proxy for a cookie it then trusted.
- **The admin surface:** a path outside its surface must still 404 on the admin host, and the design gate must still refuse a missing key.
- Each of these is pinned by tests.

**Lever 2: polls that rest** (`use-live-poll.ts`; Will's call X4 in the calls lab, built as recommended and his to overrule):
- The 60 s safety net slows to every 5 minutes after 10 lit minutes, and stops after 2 hours without a touch. A press, a scroll, a key or a return to the tab wakes it.
- The doorbell still rings at once.
- The 12 s fallback (doorbell down) slows to 60 s while nothing changes, and returns to 12 s on a change.
- The reel's screen mode (`?reel=screen`, a TV at a party) keeps its live answers: a screen nobody touches is its whole point. Find how it reads changes and say what it does.

**Prove it:**
- `pnpm compute:model --port <yours>` before and after. Report the scenarios' calls and CPU side by side against the model's what-ifs (lever 1 about -52% of a heavy wedding's calls, lever 2 about -31%).
- Then rebase `budget.json` with `--write-budget` from the after-run. That file is the compute model's, so it is an exception named in your Handoff; its commit is your last.
- `docs/systems/architecture.md`'s "Compute budget" section takes the new headline.

Build none of the other levers (the CDN version is Will's privacy call X5; batched uploads are the next lane).

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
