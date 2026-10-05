---
track: compute-lazy-sdk
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "c68029ed"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/r2/client.ts
  - src/lib/r2/objects.ts
  - src/lib/r2/presign.ts
  - src/lib/r2/delete.ts
  - docs/systems/uploads-and-r2.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - scripts/compute-model/budget.json
---

# lp/compute-lazy-sdk

**Goal.** Load the AWS S3 SDK only when a send needs it, so a page that only reads (its presigns are hand-signed now) never pays the SDK's cold-start CPU (about 52 ms an instance).

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish (the viewfinder's corners survive only as a focus mark, never a style, and so does nothing of their loading state); a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline (undated, morning-only and multi-day events all read well); "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control); cost is designed like the architecture (every image and video action multiplies at scale). Production is the working version: a pick is the best of what was drawn, never a rule.

**Why:** compute-presign (merged) signs R2 links by hand, but the guest page's cold start still loads `@aws-sdk/client-s3`. That is about 52 ms of CPU locally, once an instance, for sends it rarely makes: a guest's own delete (`my-uploads`, `lifecycle/reclaim.ts`, `r2/delete.ts`) and `r2/presign.ts`'s multipart, HEAD and COPY. On Vercel every cold start pays it, at Will's events' spikes most of all.

**The work:** import the SDK lazily (`await import("@aws-sdk/client-s3")`) inside the four `src/lib/r2/` modules that use it, behind their existing functions so no caller changes. The module graph of a page that only presigns must no longer reach the SDK.
- Prove the graph with a test or a build-output check: the guest page's server chunk, or a static import trace, no longer pulls `@aws-sdk/client-s3`.
- Prove the time: a cold `require` or `import` of the guest page's module before and after.
- Every existing test stays green. Error paths keep their words, and an import failure is captured like any send failure (never silent).

**★ Local only:** nothing of yours requests the alias, partyreel.com or any *.vercel.app. Port 3132 is yours.

Wiring rigor: the whole gate. If `pnpm compute:model --port 3132` shows the guest page's CPU line falling, lower it (`budget.json`, an exception in your Handoff). Work economically, with no helper agents; push a WIP commit at each step (this account's weekly usage is near its end).

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
