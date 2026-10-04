---
track: compute-uploads
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "0b83614f"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/upload/
  - src/app/api/r2/presign-upload/
  - src/app/api/r2/complete-upload/
  - docs/systems/uploads-and-r2.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - scripts/compute-model/model.mjs
  - scripts/compute-model/budget.json
---

# lp/compute-uploads

**Goal.** The compute model's lever 4: one presign and one complete per burst of uploads instead of one each a file, with every per-file check and abuse breaker kept; proven by `pnpm compute:model`.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish (the viewfinder's corners survive only as a focus mark, never a style, and so does nothing of their loading state); a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline (undated, morning-only and multi-day events all read well); "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control); cost is designed like the architecture (every image and video action multiplies at scale). Production is the working version: a pick is the best of what was drawn, never a rule.

**Why:** Will's foundational fix for Vercel's compute. Read the report `../partyreel-wt/_scratch/compute-model/report.md`, "The levers". A burst of ten photos is 92 calls today: a presign and a complete per file, each a function call. Batching takes it to about 16. Levers 1 and 2 already shipped in milestone 36, -66% of a heavy wedding's calls.

**★ Local only:** nothing of yours requests the alias, partyreel.com or any *.vercel.app (Hobby's Active CPU). Sign-in works only on port 3000 (Will's desk); measure with `pnpm compute:model --port <yours>`.

**What to build:**
- **Presign:** one request carries a burst (its files' sizes, types and names) and answers each file's presigned PUT, or that file's own refusal.
- **Complete:** one request records the burst's landed files and answers the new rows' links, so the album's own sync need not mint them again.
- **Server side, per file:**
  - every check that runs today still runs for each file: the per-file size and type limits (`src/lib/media/limits.ts`), the host's cap and uploads allowance, the upload meter, the hourly uploads breaker, the disposable roll's count and the camera clip's bounds;
  - a file refused never stops its siblings;
  - the meter counts each file once, as today (`docs/systems/uploads-and-r2.md`, `billing-caps.md`).
- **No migration if it can be helped:** a batch loops the existing RPCs server-side, one call a file inside one request. If one is needed, it is a Question, and the Orchestrator applies it by protocol.
- **Clients:** the guest's queue, the camera and the host's upload batch their bursts. A single file is a burst of one, and an older client's single-file requests keep working until the next milestone.

**Prove it:**
- tests that a refused file in a burst leaves its siblings landed and counted once;
- `pnpm compute:model` before and after: guest-join-upload's calls against the model's -9% of a wedding;
- rebase `budget.json` (the compute model's file, an exception in your Handoff);
- a local signed-in check is the Orchestrator's on the desk.

**Lane rules:** wiring rigor applies, since this code ships: the whole gate.

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
