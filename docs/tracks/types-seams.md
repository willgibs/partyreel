---
track: types-seams
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "9fd2bccb"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/db/mutations/event-passes
  - src/lib/db/queries/accounts
  - src/lib/db/queries/drive
  - src/lib/db/queries/jobs
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/lib/db/types.ts
---

# lp/types-seams

**Goal.** Drop the five typed seams billing-locks and drive-wiring left for the types to catch up, now that src/lib/db/types.ts knows their tables and functions: passCreditDb, uploadsWindowsDb, untyped in queries/drive.ts, the cast in queries/drive-stops.ts, untypedDb in queries/jobs.ts.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish (the viewfinder's corners survive only as a focus mark, never a style, and so does nothing of their loading state); a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline (undated, morning-only and multi-day events all read well); "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control); cost is designed like the architecture (every image and video action multiplies at scale). Production is the working version: a pick is the best of what was drawn, never a rule.

**★ Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app. Port 3131 is yours; 3000 is Will's desk.

`src/lib/db/types.ts` was regenerated on launch-prep after migrations `billing_locks` and `cloud_export` (it is never hand-edited). Each lane left a seam casting the admin client to an untyped `SupabaseClient` until then: `passCreditDb` (`src/lib/db/mutations/event-passes.ts`), `uploadsWindowsDb` (`src/lib/db/queries/accounts.ts`), `untyped` (`src/lib/db/queries/drive.ts`), the cast in `src/lib/db/queries/drive-stops.ts`, and `untypedDb` (`src/lib/db/queries/jobs.ts`). Remove each and its comment, use the typed client, and fix what the real types surface (a nullable column, an RPC's Args taking no null: omit the key, as `over-capacity.ts` does) without changing behaviour; a test that pins a wire shape keeps its meaning. Drop any `SupabaseClient` import left unused.

Wiring rigor: typecheck, lint, the whole `pnpm test`, the build, each through the build lock; no lab run is needed (no rendered path changes).

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
