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

- **Links in the complete's answer: not built (recommended).** Her album draws her photos from their own bytes the
  moment they land (`notifyUploaded`'s optimistic tiles), and the one sync that follows already carries their links in
  its delta (album-calm's carrying transport). Links in the complete would be minted twice and save no call: what cuts
  the self-syncs is the burst's files landing in one answer, which her album's store coalesces.
- **No file names at presign (recommended).** The answers return by position, so the server needs none and no file
  name leaves the phone.
- **When a landed file is recorded (Will's UX call; recommended 10 s).** A burst's landed files are recorded together
  when its last file has gone up, or 10 s after the first of them landed, or at once when the page is hidden (one
  complete, kept alive). Until then the file's bar stands full ("finishing"); her own tile already shows it. Shorter
  costs calls on a slow phone (one complete per few photos), longer delays the album for everyone else.
- **A burst: at most 20 files and 1 GiB declared (recommended).** Presigns live 2 h; preparing (strip, preview, phone
  copy) runs at most 64 MB ahead of the network, so a phone never holds a whole burst's bytes.
- **The roll and the meter count a burst's earlier files (recommended).** Each file of a burst meets every check it
  met alone, and the meter judges it with its earlier siblings' declared bytes added (capped at 10 GiB) and the roll
  with its earlier shots counted, exactly as one-at-a-time presigns saw the earlier files already landed.
- **Owns omitted the clients and the harness the brief names:** edited `src/lib/guest/use-upload-queue.ts` (the
  guest's queue, which the camera feeds), `src/components/app/host-upload.tsx`, and `scripts/compute-model/run.mjs`'s
  `landed()` (crumbs-66's file: a burst's ten files land in one complete, so the wait counts rows, not requests). The
  host routes are untouched: the engine takes the burst shape for every strategy.
- **A rollback past this deploy (accept, recommended):** a tab loaded from it sends bursts an older server refuses
  "Invalid upload request." until it reloads (no skew protection on Hobby). The one-file shape stays on the server for
  tabs from before it, until the next milestone.

## System-doc edits (in place, owned facts only)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

**Progress (for a successor; replaced by the Handoff proper at the end):**
- Booted at `805c52ed0`. Baseline `pnpm compute:model --port 3131 --scenarios guest-join-upload` = 61 calls, 2,938 ms
  (join 5; her upload 46: presign 10, complete 10, sync 16, links 10; the listener 10). Run in
  `../partyreel-wt/_scratch/compute-uploads/before/`, log `before.log`.
- Plan: `src/lib/upload/burst.ts` (shared limits, `takeBurst`, the wire's split); `server-pipeline.ts` takes a burst
  body (`{...identity, files: [...]}`) beside the one-file body for every strategy, a per-request `Burst` (memoized
  reads, earlier siblings' files and bytes for the roll and the meter), per-file answers, the guest's clip budget a
  strategy hook; `uploader.ts`'s `uploadBurst` (prep ahead under a byte budget, presign what is prepared when the
  network waits or when all is prepared, PUTs one at a time, completes batched by the 10 s rule), `uploadFile` a burst
  of one; the queue and the host panel send bursts; run.mjs's `landed()` counts rows.
- Built and pushed through `0e79abced` (server engine, client engine, queue, host panel, harness, system doc). After
  run 1 (`_scratch/compute-uploads/after1/`): guest-join-upload 22 calls, 1,007 ms (her upload 11: presign 2,
  complete 2, sync 5, links 2; the listener 6). Each batched complete took 11 to 17 s locally (files one after
  another), so a burst's files now land four at once and are recorded in order (`0e79abced`). Lint 0, full test 0
  (911 files, 11,187 tests) on `0e79abced`. Next: the full `compute:model` (`after-full/`), the wedding-level
  reprojection (swap `before/`'s guest-join-upload ledger into a copy of `after-full/`), the budget line, a local
  red-team of the burst wire on 3131, the build and `lab:smoke`, then the Handoff.

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
