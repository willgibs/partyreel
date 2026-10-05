---
track: uploads-idempotent
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "21118e59"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/upload/uploader
  - src/lib/upload/server-pipeline.ts
  - src/lib/upload/server-pipeline.test.ts
  - src/lib/upload/server-pipeline-recorded
  - src/lib/upload/burst
  - src/lib/upload/stop-upload
  - src/app/api/r2/complete-upload/
  - src/app/api/r2/presign-upload/
  - src/app/api/host/r2/complete-upload/
  - src/app/api/host/r2/presign-upload/
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/lib/upload/server-pipeline-meter.ts
  - src/lib/media/limits.ts
  - docs/systems/database-security.md
---

# lp/uploads-idempotent

**Goal.** Uploads that survive a bad line: a retried complete is idempotent on its media id, so presign and complete can carry client ceilings and end as "Your connection dropped." instead of hanging; the next file is prepared while the current one sends; the create_media args seams go.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish (the viewfinder's corners survive only as a focus mark, never a style, and so does nothing of their loading state); a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline (undated, morning-only and multi-day events all read well); "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control); cost is designed like the architecture (every image and video action multiplies at scale). Production is the working version: a pick is the best of what was drawn, never a rule.

**★ Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app (Vercel's Hobby CPU is at its limit). Port 3132 is yours; 3000 is Will's desk, never touched; 3130 is the Orchestrator's gate. Sign-in works only on the desk build at 3000, so a guest's flow is yours to walk (no sign-in); the host's is pinned by tests.

**Read first:** `docs/systems/uploads-and-r2.md` (the burst protocol of compute-uploads: one presign and as few completes as a landing allows, every per-file check and abuse breaker kept; the meter's line) and the merges of compute-uploads, upload-cancel and crumbs-76 (`git log --merges --format=%B`), which this lane builds on. `server-pipeline-meter.ts` is billing-locks' (a read here).

**The fixes**, each pinned by a test that fails on the old code:
1. **No client ceiling on presign and complete.** A retry re-runs the whole upload, so a timed-out complete that had recorded its row would duplicate it. Make the retry idempotent on `media_id` (`readRecordedUpload` in `server-pipeline-recorded.ts` already answers a replayed complete: prove it under a burst, a partial burst and a host's batch), then give presign and complete client ceilings in `uploader.ts`, so a hung request ends as the uploader's one sentence, "Your connection dropped. Check your signal, then try again.", with its Try again, never a spinner forever. No row is ever recorded twice, no byte counted twice by the meter (assert it through the meter's own read).
2. **Prepare the next file while one sends.** Each file is prepared only when its turn comes (`runUpload`: strip, measure, preview, phone copy; about 523 ms from pick to presign at 4x CPU on a 12 MP photo): prepare the next while the current one uploads, bounded so memory never holds more than one prepared file beyond the one sending, and a cancel or a refusal discards it.
3. **Typed seams:** the args objects beside `rpc("create_media*")` in the upload routes are typed seams the generated types no longer need: drop them.

Measure 2 (the gap from one file's end to the next's start, before and after) in your own headless Chrome on your port with CPU throttling. `docs/systems/uploads-and-r2.md` is drive-wiring's until it merges: put your fact lines for it in your Handoff under System-doc edits (proposed), and the Orchestrator writes them at your merge. Wiring rigor: the whole gate, and a guest's burst walked at 375 and 1440 on your port with the line cut mid-complete (CDP) to prove 1.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- **Q1. Fix 2's premise predates compute-uploads, and closing the gap that is left costs a presign on a quick line.**
  `runUpload` is gone: preparing already ran ahead of the network, held to 64 MB of prepared files not yet up
  (`PREP_AHEAD_BYTES`), the budget that lets one presign carry a burst (the brief's one-file bound would cost a presign
  a file, so it is kept). What was left: a file over the budget (a video) held its successor's preparing until its
  bytes were up, and the next presign was asked only once the network needed it. Built: the network's next file is
  always prepared (the brief's "one beyond the one sending"), a presign is asked at once when the budget holds preparing,
  and the next presign is asked the moment the file in the air hands off its last byte (the browser's progress runs
  0.5 to 0.85 s ahead of the line, measured, so a pace estimate missed: gaps of 154 and 1,148 ms). Measured, 8 photos of
  12 MP at 4x CPU on 3132: on a quick line the idle gap after the first file fell from 875 ms to 2, 2 and 137 ms (three
  runs; the burst lands in about 30 s rather than 32), at one presign more a burst (3, not 2) when preparing is still
  running as the first file hands off; on a 6 Mbps line nothing changed (no gap, 2 presigns, before and after); small
  photos never ask ahead (the compute model's 10-photo scenario: 14 calls before, 13 after, 2 presigns each).
  Recommended: keep it (snappy for a cost of one presign on a quick line). Overrule: drop the handoff ask in
  `endsSoon` (the next-file preparing and the held ask stay, costing nothing), keeping 2 presigns and the 0.9 s idle.
- **Q2. The ceilings.** Built: a presign may take 30 s and a complete 60 s, each clock restarting when the page comes
  back to the screen (a phone freezes a hidden page's timers, as the byte PUT's stall clock already allows for); past
  it the request is a dropped connection, said in the one sentence with Try again. Measured on the local build (the
  slow case: a laptop to the remote database and R2): presigns 0.3 to 1.5 s, completes of 2 to 4 files 3.7 to 6.9 s.
  Recommended: these.
- **Q3. A Try again after a lost complete sends that complete again, never the upload.** The phone keeps a file's
  complete while its answer is unknown (no answer, an answer it cannot read, or the server's own "couldn't finish":
  `complete_failed`, `unknown`) and a Try again sends it again with the same media id: the row answers `recorded` if it
  was written, else the file lands now, in one round trip, its bytes never sent twice. Kept by the File itself, so a
  Retry (which hands the same file back: the guest's queue, the host's panel, the reel's Add) replays and a second pick
  of the same photograph is a new upload. Any other refusal is final, and its Try again uploads afresh. Recommended,
  built.
- **Q4. A replayed file cannot be stopped.** Its row may already exist, so it is the record's from its first moment
  (the x on a guest's tile answers "too late" at once, a host's row shows none), as a file whose complete is asked
  already is. Recommended, built.
- **Q5. A replay answered `recorded` is drawn by the album's sync, not at once.** The server says only "recorded" of a
  row (crumbs-62: nothing of a row leaves the server to whoever holds a key), so the phone does not know its status
  (approved, held, sealed) and the album's sync, asked at once, brings it. Recommended: keep (no status for a key).
- **Q6. A multipart R2 will not assemble stays "Couldn't finalize the upload. Please retry."** on every Try again (the
  failure sheet's Not now clears it) rather than start the upload over and risk a second row. Practically unreachable
  (a part list R2 refuses, or an upload its abort rule took days later); one whose first complete assembled it and
  then ended before its row now lands on the replay. Recommended, built.

## System-doc edits (in place, owned facts only)

`docs/systems/uploads-and-r2.md` is drive-wiring's until it merges, so these are proposed for the Orchestrator to write
at this lane's merge (each replaces the words it names):

- "In the browser a byte never waits for batching" bullet, from "preparing (the strip, the preview, the phone copy)"
  to "(the first file goes alone)": "preparing (the strip, the preview, the phone copy) runs ahead of the network, the
  network's next file always and the rest within 64 MB; presigning asks for every prepared file at once, the first
  file alone, then the rest once the file in the air hands off its last byte (the browser's progress runs about a
  second ahead of the line, so only that moment says a file is ending; one handed off quicker than a presign's round
  trip waits for need, so a small file never splits the batch), or at once when preparing is held by the budget or
  done".
- E6 bullet, its sentence "`complete` is never aborted by either and has no client timeout: a retry re-runs the whole
  upload, so a timed-out complete that had recorded its row would duplicate it, and a stop pressed once the complete
  is asked is ignored (the file lands as it would have)" becomes: "★ Presign and complete each end past a ceiling (30
  s and 60 s, `PRESIGN_CEILING_MS`, `COMPLETE_CEILING_MS`, their clocks restarting when the page is looked at again) as
  a dropped connection, never a spinner. A complete whose answer never came (none, one the phone cannot read, or the
  server's own `complete_failed` or `unknown`) is kept by its File (`UNANSWERED`), and that file's next try sends that
  very complete again (its media id, key and parts), never a presign or a byte: a row the first wrote answers
  `recorded`, so no row or byte is counted twice; any other answer settles it, and a refused file's next try starts
  afresh. `complete` is never aborted by a cancel: a stop pressed once it is asked, or on a file going again on its
  kept complete, is ignored (the file lands as it would have)."
- E6 bullet, its list of drops: "A request that never reached the network (presign, complete or the byte PUT)," gains
  "a presign or complete past its ceiling,".
- The "complete for an upload already recorded" bullet gains, at its end: "A multipart its first complete assembled
  and never recorded lands on the replay as assembled (only that complete can have put an object at its server-built
  key, after the parts' sum); with nothing at the key the failure stays `complete_failed`, which the phone keeps."

## Deferred (ROADMAP one-liners, bucket named)

- Now: "Guests: the failure sheet's Retry all re-queues its files one at a time and each call runs the queue
  (`use-upload-queue.ts`'s `retry`), so the first run takes a burst of one: a dropped burst's Try again is two
  completes where one would do (walked, uploads-idempotent); re-queue the list, then run the queue once."
- Now: "Uploads: a burst boundary (past 20 files, 1 GiB, or a pick made while a burst goes) waits for the last burst's
  complete before the next burst's first file prepares and presigns (the queue awaits `uploadBurst` whole); start the
  next burst once the last one's bytes are up."

## Handoff (replaces the chat report)

- **Commits.** The work commit `7103600dc` (WIP steps before it: `b677c4c30`, `c91f88435`, `c5726bd15`, `be2fb9416`,
  `4f4c477e1`), pushed on `lp/uploads-idempotent`. No sync: launch-prep moved only by record commits since the cut
  (`git diff --name-only 124f8b0d3 origin/launch-prep`: `docs/tracks/crumbs-79.md`, `docs/tracks/orchestrator.md`).
- **Gates on `7103600dc`**, each on its own exit code (logs in
  `/Users/gibby/local/ai/partyreel-wt/_scratch/uploads-idempotent/gate2-*.log`): `pnpm typecheck` 0; `pnpm lint` 0;
  `pnpm test` 0 (952 files, 11,924 tests); `zsh scripts/build-lock.sh pnpm build` 0; `pnpm lab:smoke --base
  http://localhost:3132` 0 (153 checks, 0 failing). The manifest commit after it is docs only.
- **Lane check.** `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file, and two exceptions:
  `src/lib/db/mutations/guest.ts` and `src/lib/db/mutations/host-media.ts`, where fix 3's seams live (the brief's "in
  the upload routes" is the routes' RPC wrappers; no open lane owns either; each change is the `args` object folded into
  its `rpc(...)` call).
- **Fix 1, the server.** The replay is proved one landing under a burst, a partial burst (its database gone after the
  first file), a write committed whose answer was lost, and a host's batch, against one fake database the two RPCs
  write and `uploads_used` reads: no row twice, the month once (`src/app/api/r2/complete-upload/route.replay.test.ts`).
  New: a multipart its first try assembled and never recorded lands on the replay as assembled (`assembledAt` in
  `src/lib/upload/server-pipeline.ts`; its test fails on the old engine with `complete_failed`).
- **Fix 1, the phone.** Presign 30 s and complete 60 s ceilings, restarting on the page's return; a complete with no
  answer kept by its File and sent again by its next try, at once and alone, its file full from the first moment and
  unstoppable (`src/lib/upload/uploader.ts`: `PRESIGN_CEILING_MS`, `COMPLETE_CEILING_MS`, `UNANSWERED`,
  `UNSETTLED_REFUSALS`). `src/lib/upload/uploader.replay.test.ts`: 11 of its 15 fail on the old uploader (the 4 that
  pass on both are its boundaries: a cancel stays a cancel, a settled refusal starts afresh, a landed file and a second
  pick are new uploads).
- **Fix 1, walked live** on 3132 (a production build), a guest's burst on "crumbs-76 free (disposable)", the complete's
  answer cut at the response stage (CDP `Fetch.failRequest`, `ConnectionReset`) at 375 and 1440, and held past the 60 s
  ceiling at 375 (said at 66 s): the sheet read "3 of 3 didn't upload", each row "Your connection dropped. Check your
  signal, then try again.", with Retry all 3; the server had recorded the rows before the cut; after Retry, the same
  3 rows (2 in the hang) and `uploads_used` moved once by exactly their bytes (10,607,533; 7,076,701), "Your 3 photos
  joined Will Gibson's album." (`_scratch/uploads-idempotent/walk-{375-cut,1440-cut,375-hang}.json` and `walk-*.png`).
- **Fix 1, the database** (rolled back, Supabase MCP, on the export wiring probe): a twin `create_media` and a twin
  `create_media_as_host` of one media id each answer 23505 and move `uploads_used` by 0, one row each.
- **Fix 2.** Measured with `_scratch/uploads-idempotent/measure-gap.mjs` (the real door and uploader, Chrome's network
  events): before, a quick line's gaps after each file 875, 2, 2, 2, 2, 8, 1 ms (presigns 1+7), a 6 Mbps line's all
  1 to 2 ms (1+7); after, the quick line's 2, 2 and 137 ms after the first file and 1 to 3 ms after the rest (3
  presigns), the 6 Mbps line's unchanged (`gap-*.json`); the compute model's guest-join-upload 14 calls before, 13
  after (`cm-before/`, `cm-after/`). The video case (a file over the budget) is pinned by
  `uploader.burst.test.ts` ("the file after one over the budget is prepared while it goes"), not walked. Both of its
  tests fail on the old uploader.
- **Fix 3.** The `args` objects are folded into their `rpc("create_media*", {...})` calls, so the literal is checked
  name by name against the generated Args (an object beside the call was not); typecheck pins it, and no runtime test
  can tell the two apart.
- **ROADMAP lines this closes:** "Code hygiene: the args objects beside `rpc("create_media*")`...", "Guests: presign
  and complete have no client ceiling...", "Uploads: each file is prepared only when its turn comes..." (stale since
  compute-uploads; its remaining gap is Q1).
- **Assets requested from Will:** none.
- **Board ideas:** a file's copies (preview and phone copy) go up before the next file's original starts, about 0.75 s
  a photograph on a quick line (measured from the original's end to the next start); overlapping them with the next
  original would trade the one-at-a-time line for that time.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none.
- **Calls his to overrule:** Q1 (the handoff ask's one presign on a quick line), Q2 (30 s and 60 s), Q3 (a lost
  complete replayed by its File), Q4 (a replay unstoppable), Q5 (`recorded` drawn by the sync), Q6 (an unassemblable
  multipart keeps failing rather than risk a second row).
- **Test data left:** 84 photos (297 MB) from 13 guests named "Gap ..." and "Walk ..." on "crumbs-76 free (disposable)"
  (`dc74eb95`, willg97's), and 20 on "Compute model (test)" (its harness adds 10 a run); the first goes with the event
  through Settings.
- **Look at first:** on the desk, a guest's burst of three, DevTools set Offline the moment the last tile fills: the
  sheet says the drop on each row; back online, Retry all 3 lands each photograph once (no presign or byte again in the
  network panel, one complete); then the walk JSONs above for the cut that the server had already recorded.
