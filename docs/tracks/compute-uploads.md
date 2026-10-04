---
track: compute-uploads
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
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

- `docs/systems/uploads-and-r2.md`, "The upload pipeline": the client is `uploadBurst()` (`uploadFile()` a burst of
  one); two new ★ bullets (the burst on the server: the wire, each file through its own spine, `Burst.memo` and
  `admitted`, the meter's and the roll's earlier siblings, the burst-scoped refusal, the clip budget hook, the one-file
  body kept; the burst in the browser: preparing ahead, presigning on need, the record's three moments, the statuses
  a landed file wears); the clip limiter is asked before a byte of the clip lands; two mentions of `uploadFile` made
  the uploader's.

## Deferred (ROADMAP one-liners, bucket named)

- Now · Guests: drop the one-file presign and complete bodies (`server-pipeline.ts`'s `splitBurst(...) === null`
  arms, kept for a tab loaded before bursts) a milestone after compute-uploads ships.
- Now · Guests: her album asks its store once per landed file (`gallery-live.tsx`'s `notifyUploaded`), so a recorded
  burst costs two syncs (a delta, then a 304); ask once per burst.
- Now · Guests: the door's upload step reads a queue item's progress (0 to 100) as a fraction (`upload-step.tsx`'s
  bar: `Math.max(it.progress, ...) * 100`), so a bar is full from its first percent.

## Handoff (replaces the chat report)

Scratch (every run, log and script named below): `../partyreel-wt/_scratch/compute-uploads/`.

- **The work:** `6dbe47efd..3b028e6ba` on `lp/compute-uploads` (13 commits, WIP-named as the session ran, each message
  saying what it did), then this manifest alone; pushed. `launch-prep` had not moved since the branch's base
  (`805c52ed0`, the pickup after the cut): no sync.
- **Gates on `3b028e6ba`**, each its own exit code (`gate.log`): `pnpm typecheck` 0, `pnpm lint` 0, `pnpm test` 0
  (911 files, 11,187 tests: `gate-test.log`), `zsh scripts/build-lock.sh pnpm build` 0 (`gate-build.log`);
  `pnpm lab:smoke --base http://localhost:3131` 0, 143 checks, none failing (`lab-smoke.log`, `pnpm dev` on the same
  source).
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` = the owned `src/lib/upload/` (`burst.ts`,
  `server-pipeline.ts` and its test, `uploader.ts` and three tests), `src/app/api/r2/presign-upload/` and
  `src/app/api/r2/complete-upload/` (the routes and their burst tests), `docs/systems/uploads-and-r2.md`, this file,
  and the exceptions the brief names but `owns` left out (its Questions bullet):
  - `src/lib/guest/use-upload-queue.ts` and its test: the guest's queue ("Clients: the guest's queue, the camera"; the
    camera's shots go through it);
  - `src/components/app/host-upload.tsx` and its test: the host's upload;
  - `src/components/guest/guest-upload.test.tsx`: its stand-in for the uploader gains `uploadBurst`;
  - `scripts/compute-model/run.mjs` (crumbs-66's file, two hunks: `mediaRows` and `landed`, and guest-join-upload's
    wait): a burst's ten files land in one or two completes, so the scenario waits for the event's rows, never ten
    complete requests;
  - `scripts/compute-model/budget.json`: the brief's rebase, guest-join-upload's line alone (its commit says why).
  The host's routes are untouched: the engine takes a burst for every strategy.
- **The items:**
  - The engine (`server-pipeline.ts`): a burst body (`{ ...identity, files }`, at most 20: `burst.ts`) beside the
    one-file body, for every strategy; each file through its own spine, in order; `Burst.memo` (who is sending, read
    once) and `Burst.admitted` (the meter adds the earlier files' declared bytes, held to 10 GiB; the roll counts the
    earlier shots); a presign refusal of who is sending (`scope: "burst"`) answers the whole request in the one-file
    words; one answer a file, with its status; a complete's files land four at a time (`COMPLETE_LANES`) and are
    recorded in the burst's order; an upload named twice is completed once; a throw is its own file's.
  - The guest's routes: the presign's reads memoized and its who-is-sending gates scoped; the clip limiter is the
    strategy's `budget` hook (asked before a byte of a clip lands, spent once it answers ok, a burst's clips in order).
  - The browser (`uploader.ts`): `uploadBurst` prepares ahead (at most 64 MB with the copies), presigns every prepared
    file when the network needs one or all is prepared (the first file alone, so its bytes start as they did), sends
    the bytes one at a time, and records the landed files together (the burst's end, 10 s after the first landed, or at
    once on a hidden page, kept alive); `uploadFile` is a burst of one.
  - The guest's queue (the camera's shots with it): a run sends what waits as bursts (`takeBurst`: 20 files, 1 GiB); a
    file is `uploading` only while its bytes go, `queued` at 100 once they are up until it is recorded; the session's
    three refusals are read after the burst, for every file of it they reached; the run's ring counts a landed file
    whole. The host's panel sends bursts the same way.
  - The harness's wait and the budget line (above); the system doc (System-doc edits).
- **Measured (`pnpm compute:model`). The runs I trust are the quiet pair** (the event untouched by anyone else, after
  crumbs-66 finished at 22:30Z): guest-join-upload on the base tree `805c52ed0` 59 calls, 2,810 ms
  (`before-quiet-1`, 22:46Z); on the burst tree 17 calls, 1,110 ms and 18 calls, 1,310 ms (`after-quiet-1` 22:42Z,
  `after-quiet-3` 22:44Z, the tree at `249d4deee`, its code `15e9ebe04`'s). Her burst 45 calls to 10 (presign 10 to
  2, complete 10 to 2, her album's syncs 15 to 4, its link mints 10 to 2); what the listening album paid to hear it,
  9 calls to 2 or 3.
  - The wedding (`--reproject` of `before-final/` and `after-final/`, which differ in guest-join-upload alone; their
    other scenarios are `after-full`'s, its guest-hour-down `after-hourdown`'s): a 100-guest wedding 21,105 calls to
    7,455 (-65%), heavy tabs 25,482 to 11,832 (-54%), a month at 100 events 2.15M to 0.78M calls and 38.5 to 17.6
    calibrated CPU-h (-54%). The model's what-if was -9% (-13% on this ledger): recording a burst in one or two
    completes also collapses what every lit album pays to hear it, which the what-if held fixed.
  - Not trusted: `after1` (22:12Z, 22 calls) and `after-full` (22:19Z, 18) shared the event with crumbs-66's checks;
    `after-full`'s guest-hour-down (121 calls, over its 74) heard another lane's two bursts, and alone on the quiet
    event (`after-hourdown`, 22:34Z) it reads 67. Every other scenario of `after-full` is within its budget. Two runs
    (`after-quiet-2`, `before-quiet-2`) met the door-step timeout crumbs-66 hardens.
  - CPU: a direct probe of the same build (`cpu-probe.mjs`): an older tab's one-file presign 9 to 13 ms, a burst of one
    9 to 11, a burst of nine 40 (about 4.5 ms a file); the ~110 ms first presign in each after run is process-wide
    work inside that request's window (the measuring server reads `process.cpuUsage()` for the whole process).
  - Locally a burst of ten is recorded in two completes (this machine's ten PUTs take about 15 s, past the 10 s rule),
    each 3.4 to 5.6 s of wall time with the lanes (11 to 17 s without them).
- **Red-team, local (`redteam.mjs` on 3131, the real Supabase and R2; `redteam.log`): 19 of 19 held.** One presign
  for a burst of three real photographs; the bytes of the first and the third only; one complete for the three, a
  duplicate and a foreign key: the never-sent file refused alone ("Couldn't verify the uploaded file"), its siblings
  recorded, the database holding exactly those two, each once, on their real sizes; replays (an older tab's one-file
  body and a burst) answered `recorded`; 21 files refused whole (400); a dead ticket refused whole (401) and an entry
  unable to name a ticket of its own; a non-media file refused alone while its sibling presigns; the one-file presign
  answering as ever; a malformed complete refused whole. Disposable data: the guests "Burst Red Team" and "Burst CPU
  Probe" and two photographs on "Compute model (test)".
- **The tests** (the held rules; mutations checked for the roll's and the meter's earlier files, the 10 s and the
  hidden-page record and the prep budget, each failing its test):
  `route.burst.test.ts` (presign: each file its own answer, the meter once a file with its earlier siblings' bytes, the
  roll's earlier shots, refusals alone, who-is-sending refused whole; complete: a refused file's siblings landed and
  counted once, its copies alone taken back out, four landing at once and the rows written in order, an upload named
  twice, a replay, a throw, the clips' budget one after another), `server-pipeline.test.ts` (the host's routes take
  bursts unchanged), `uploader.burst.test.ts` (two presigns and one complete for ten, a refused or dropped file alone,
  who-is-sending refused once, the 10 s rule, the hidden page's kept-alive record, the prep budget, her cancel), the
  queue's (one burst for what waits, the statuses, a pick mid-burst rides the next, the ring).
- Assets requested from Will: none.
- **Board ideas:**
  - Every album sync with new rows is followed by a links call on both phones in every run, though the delta carries
    its links (album-calm's carrying transport): worth a look (the watchdog re-minting reads localhost cannot make?).
  - `docs/PRICING.md`'s per-request constants still price an upload as "Two calls a file, one file at a time": it is a
    presign and a complete a burst now (the measured units above).
  - The compute model's lever 4 (`model.mjs`'s `batch`) holds the heard burst fixed; a re-measure takes the real units.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none (no migration: a burst loops the existing RPCs).
- **Calls his to overrule:** the Questions (the 10 s record rule, no links in the complete, no file names, the burst's
  limits, the roll and the meter counting earlier files, the rollback), and a file landed but not yet recorded wears
  `queued` at 100 in the guest's queue (the album's stack follows the file in the air) and `uploading` at 100 in the
  host's panel.
- **Look at first:** `server-pipeline.ts`'s `runCompletePipeline` (the lanes and the ordered records) and
  `presignFile`'s metered bytes; `uploader.ts`'s `runBurst`; on the desk, a signed-in burst through the host's panel and
  the owner's own Add (the host's path is held by tests only: sign-in works on 3000 alone), and a guest's ten photos
  watching the album's stack and the door's bars; at merge, `run.mjs`'s two hunks beside crumbs-66's.
