---
track: compute-presign
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "f5d933cb"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/r2/presign.ts
  - src/lib/r2/presign.test.ts
  - src/lib/r2/sigv4
  - docs/systems/uploads-and-r2.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - scripts/compute-model/budget.json
  - src/lib/r2/client.ts
  - src/lib/r2/presign-bucket.ts
---

# lp/compute-presign

**Goal.** The guest page's next CPU lever: presign R2 links with a small hand-rolled SigV4 query signer instead of the AWS SDK's presigner, byte-identical to the SDK's URLs, measured by `pnpm compute:model`.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish (the viewfinder's corners survive only as a focus mark, never a style, and so does nothing of their loading state); a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline (undated, morning-only and multi-day events all read well); "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control); cost is designed like the architecture (every image and video action multiplies at scale). Production is the working version: a pick is the best of what was drawn, never a rule.

**Why:** the compute model (`../partyreel-wt/_scratch/compute-model/report.md`, "Beside the levers") profiled the guest page, the dearest call (a 1,000-photo album's first load presigns up to 257 links). The AWS SDK's presigning is about 13% of its main-thread time; PRICING.md calls this its lever 5. The proxy, polls and upload levers have shipped or merged; what CPU remains is mostly page renders.

**★ Local only:** nothing of yours requests the alias, partyreel.com or any *.vercel.app (Hobby's Active CPU). Port 3000 is Will's desk; 3131 is another lane's; yours is 3132.

**What to build:**
- **The signer:** a SigV4 query-string presign for R2's S3-compatible API in `src/lib/r2/sigv4` (Node's `crypto` only: HMAC-SHA256, the canonical request, the string to sign, the derived signing key cached per day, region and service), behind `src/lib/r2/presign.ts`'s existing functions so no caller changes.
- **★ Byte-identical:** a test corpus of keys (unicode, spaces, `+`, `/`, long keys), methods (GET, PUT with content type and length if signed today), expiries and response overrides (`response-content-disposition` for downloads) compares every URL with the SDK's for the same inputs and a frozen clock. The SDK stays a dev dependency for that test only if it can; if it must stay in dependencies, say why.
- **Every security property stays:** the same expiries, the same signed headers, no raw key or URL to the browser beyond the presigned one (CLAUDE.md), and secrets never logged.

**Prove it:**
- a micro-benchmark of 257 presigns, SDK against yours;
- `pnpm compute:model --port 3132` before and after: the guest page's CPU in guest-hour-live and guest-join-upload; lower the CPU lines in `budget.json` if they fall (the compute model's file, an exception in your Handoff);
- the whole gate (this code ships).

Work economically, with no helper agents.

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

**WIP (resumable):** the signer, the corpus and the doc lines are committed at `32b1e0c3e` (typecheck, lint and the
R2 tests green); the live R2 round trip passed (`_scratch/compute-presign/r2-live-check.mts`). Next: `pnpm
compute:model --port 3132 --scenarios guest-hour-live,guest-join-upload` before (the base, detached) and after, into
`_scratch/compute-presign/{before,after}`; budget.json if the CPU falls; the whole gate; the Handoff below.

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
