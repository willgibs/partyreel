---
track: export-ends
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "0da72997"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/app/export/
  - src/app/api/export/
  - src/lib/export/
  - src/lib/db/queries/exports.ts
  - src/app/admin/exports/
  - workers/export/
  - src/app/admin/jobs/
  - src/lib/db/queries/jobs.ts
  - src/lib/db/queries/jobs.test.ts
  - src/lib/jobs/health-summary.ts
  - supabase/migrations/20261001235500_export_worker_reports.sql
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/uploads-and-r2.md
  - docs/systems/admin-observability.md
  - docs/systems/database-security.md
---

# lp/export-ends

**Goal.** Every album download ends, and says how: a mint that hangs times out or is cancelled, an emptied or short album is said and never sent as if whole, a part reads saved only once the Worker finished it, and the portal sees the Worker's checks, skips and heartbeat; all with the one Worker still answering production's app as today.

## The brief

"Download all" is a host's keepsake and a guest's copy of the night (`uploads-and-r2.md`, the export section; `workers/export/README.md`). Five ROADMAP lines say how it can end badly or unseen; each is its line there (find it by the words quoted), and each is fixed at its root with a test that fails on today's code, or retired with the evidence that it is already true:

- **A download always ends:** "the mint has no timeout and no cancel (a hung request leaves the toast spinning and Download disabled until a reload), the dialog prints raw integers (\"2440 items\"), and the album's bulk Download mints with hidden items in and no confirmation". Counts go through `formatCount`. Whether a host's bulk Download of a selection that holds hidden items asks first, leaves them out, or says so: recommend under Questions and build it.
- **An empty or short zip is said, never sent as if whole:** "the Worker skips an R2 object it cannot find in silence, so an album emptied between mint and stream downloads as a valid, empty zip; a failed-export state". The Worker's `/check` already refuses an empty answer before the file and counts a short one: find what that leaves open (the window between the check and the stream), and close it.
- **Saved means saved:** "a part's \"saved\" needs the Worker to report a finished stream (a signed call into `export_log`, or a status the walk polls); the walk says \"downloading\" meanwhile".
- **The portal sees what the Worker saw:** "`/admin/exports` counts mints only; a check that found objects gone and a stream's skips live in the Worker's logs (`export-check`, `export-stream`), and a report back into `export_log` would put them on the page", and "`/admin/exports` has no heartbeat (exports sit outside the jobs catalog)" (`admin-observability.md`: a backend job ships its management and health signal together; zero silent failures).

**The Worker is global state.** One deployment, `partyreel-export`, answers partyreel.com and every preview, so every path keeps answering production's app exactly as today: `src/compat.test.ts` replays an older app's requests against the vendored Worker and holds every answer equal, and the same discipline holds for milestone 31's and milestone 32's apps. A report back from the Worker rides a signed call into an app route (the app stays the one writer of `export_log`; the Worker never holds a database key), signed as the token is or with a secret of its own: a new secret is proposed in your Handoff (`.env.local`, the Vercel env and `src/lib/env.ts`, `.optional()` with a lazy assert), never set by you. You never deploy the Worker and never run `wrangler` against the P3 account: write it, test it (`npm run typecheck && npm test` in `workers/export`), and name the deploy and its order against the app in your Handoff.

**SQL:** a change `export_log` needs is a migration file in `supabase/migrations/` with its rolled-back proof at its foot, red first on today's schema (`database-security.md`, Workflow); the Orchestrator applies it.

**Verify:**
- the gate, and the Worker's own typecheck and tests;
- each item's test red on today's code;
- on localhost, a guest's Download all on the public demo album (signed out) and the export dialog's states, with the Worker reached through `EXPORT_WORKER_URL` as `.env.local` sets it; a stalled mint (a route that never answers, faked in a test or a local stub) ends with its words and a working Download.

The hub and the portal cannot run signed in on localhost, so name their steps for the next build's red-team in your Handoff.

**Will's desk is up:** `disposable-mode` describes the viewer's Save and Share (its `save` ask): leave the viewer's Save and Share as they are. If the lab crawl's PREMISE line names a board, say in your Handoff why its asks still hold.

**Paths:** your owns are a start. Add each file to `owns` in your manifest before editing, or name a one-line exception. Two lanes run beside you, so don't touch their files:
- `crumbs-43` owns the guest pages: `components/guest/` (a guest's Download button there among them: name what it needs in your Handoff), the photo viewer, `lib/history-entry.ts`, `lib/guest/`, `components/likes/`, `queries/guest-events.ts`, and `get_event_by_qr_token`, `create_guest` and `profiles_album_note`;
- `strip-gaps` owns the EXIF strip (`lib/media/strip-metadata.ts`, `lib/upload/uploader.ts`, the backfill script) and the privacy claims' copy.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Where I am

- The downloads of `export-wiring-probe-disposable.zip` in Will's Downloads were mine: 10 (nine of the album's 7 items, one retry of 1), 2026-10-01 21:01:57 to 21:08:02 UTC, one per minted `export_log` row of event 340fcc7b, each posted by this lane's local walk in the Browser pane to the deployed Worker. Changed: the pane's form submit is neutralized for every later step (nothing can be posted), and a download is proved only by reading the Worker's answer in a script of my own or in a headless Chrome saving to `_scratch/export-ends/`; nothing in his folders was touched.
- On Will's word (relayed): of the ten, three were still in `~/Downloads`, as the pane's hidden download files, each a 2,274,947-byte zip of the album's 7 files: `.Q6L2SF6YDW.com.anthropic.claudefordesktop.Teql51` (17:06:26 EDT), `.Q6L2SF6YDW.com.anthropic.claudefordesktop.mFiBU2` (17:06:51) and `.Q6L2SF6YDW.com.anthropic.claudefordesktop.WusTa5` (17:07:34), checked by `unzip -l`; exactly those three went to the Trash through Finder (Put Back restores them), nothing else moved. The other seven were no longer there. Real downloads from here on land only in `_scratch/export-ends/`, from a headless Chrome of this lane's own.

## Questions (a recommended answer each; the Orchestrator relays them)

- **Hidden items in a host's selection.** Built: a selection that MIXES hidden and shown items asks first, in the
  download's own toast ("3 of these 12 are hidden." with Include them and Leave them out under the line, the x
  cancels); a
  selection of only shown or only hidden items goes as picked, since picking only hidden tiles is its own answer. One
  root for the album's bulk bar and the storage list (the walk reads the selection's own summary from the server), and
  the bar is let go the moment the question shows. Overrule: always leave hidden out (Download all's default), or
  always take the selection and only say so.
- **"Saved" is the Worker's word.** A zip reads saved when the Worker sent its last byte (its stream finished), the
  closest the app can see; the phone writing it to Files is the browser's. Recommended: keep.
- **The toast stays while a zip downloads** ("Saving to your Files app…", "Downloading…" at a desk) and turns to
  "Saved to your Files app." / "Your download is saved." when the Worker reports; a walk's parts turn from
  "Part 1 of 3 is downloading." to "Part 1 of 3 is saved.", and its last word waits for every part ("All 3 parts are
  saved. That's everything."). With no word from the Worker (an older Worker, a laptop the Worker cannot reach) the
  walk says today's words and claims nothing. Overrule: let the toast go at "starting" as today.
- **A zip the Worker could not finish** (she cancelled it, the connection dropped, an object read failed) is said with
  a Try again for exactly what it lacks ("That download didn't finish."); the Worker cannot tell her
  cancel from a dropped line, so both are said. Overrule: stay quiet after a stop.
- **The window between the check and the stream is closed in the Worker:** a token that asks for reports gets a 204
  (the page stays, no file) when the album emptied after its check, and the toast says "Nothing left to download.";
  an object gone mid-stream is counted in the walk's last word with its Try again. A token without the ask (every app
  before this lane) keeps today's answers exactly. Recommended: keep.
- **Reports ride the export signing secret, domain-separated** (a report's MAC is over `report:` and its body, which no
  token body can equal), so the deploy needs no new secret. Overrule: a secret of its own (`EXPORT_REPORT_SECRET`:
  three app homes and a Worker secret).
- **The heartbeat is the Worker's own daily self-check** (05:30 UTC: it reads the bucket and signs a ping the app
  verifies, so a dead, mis-keyed or bucket-less Worker reads Missed or Failed): a `scheduled` job `export` whose switch
  is the existing `export_enabled`. Beside it a signal, `export_delivery`: zips the Worker finished in a day, and every
  failure (a check R2 refused, a stream an object read broke, a mint with nothing configured). Overrule: hourly.
- **The status is read by the export's own nonce** (its `jti`, 128 random bits, which only the token's holder has),
  polled about every second for 15 s, then backing off to every 10 s, for as long as the toast is open (6 h at most).
  Recommended: keep (long-polling would hold a function open instead).

## System-doc edits (in place, owned facts only)

- `docs/systems/uploads-and-r2.md`, its Download all section (this lane's system): the hidden-items question; ★ the
  Worker's reports and "saved" as its word (the report address the mint signs, the `report:` MAC domain, export_log by
  the nonce, the status poll, silence after 15 s claims nothing, a listening walk survives a reload); ★ the window
  closed with the 204, and the push model's landmine; every app's requests replayed at the Worker it was built
  against (milestone 29's and 31's); the heartbeat and the downloads' signal on `/admin/exports`.
- `docs/systems/admin-observability.md`, Backend jobs: the export Worker's heartbeat rides its own signed report as one
  closed row, not the internal-jobs bearer.

## Deferred (ROADMAP one-liners, bucket named)

- Exports: the runtime logs "Uncaught Error: Network connection lost." twice whenever a client leaves a zip mid-stream,
  reported or not (client-zip's object read left pending); noise in the Worker's log, not a fault (from `export-ends`).
- Exports: a walk listens by polling `/api/export/status` (about 360 asks over an hour's download, each through the
  proxy's `getUser()` for a signed-in viewer); a pushed word (SSE) if it ever costs (from `export-ends`).
- Exports: a walk asks a stopped part again by its ids, so a walk lacking more than 2,000 starts over whole; a re-take
  by the part's own cursor would be exact (from `export-ends`).
- Admin: an export whose stream's word never came (the reports lost while the heartbeat beats) shows only as a row
  reading Started or Checked on `/admin/exports`, never on the bell (from `export-ends`).

## Handoff (replaces the chat report)

Artifacts are in `../partyreel-wt/_scratch/export-ends/` (`S/` below).

- **Commits on `lp/export-ends`, pushed:** owns and Questions `f9a97995`; the work `91a1f062`; the push model, the
  question's layout, the one-line stop `c7d689da`; the hung-mint evidence `b71caf94`; where-I-am records `3ffd492c`
  and `bdd0cdea`; **the sync** `e6062747` (`git merge origin/launch-prep` at `7c51d429`: records, three manifests and
  `migration-versions.test.ts`; taken because the base's STATUS failed `record-depth-policy` at 83 lines and the new
  version test should see this lane's migration). This handoff on top.
- **Gates on `e6062747`, each on its own exit code:** `pnpm typecheck` 0 (`S/gate-typecheck.log`); `pnpm lint` 0, no
  warning (`S/gate-lint.log`); `pnpm test` 0, 700 files / 8,417 tests (`S/gate-test.log`); `zsh scripts/build-lock.sh
  pnpm build` 0, `/api/export/report` and `/api/export/status` built (`S/gate-build.log`); `pnpm lab:smoke --base
  http://localhost:3132` 0, 142 checks (`S/gate-smoke.log`). No board, so no `lab:demo`. The Worker
  (`workers/export`): `tsc --noEmit` 0, `vitest` 6 files / 76 tests, `wrangler deploy --dry-run` 0, 24.46 KiB
  (`S/worker-typecheck.log`, `S/worker-test.log`, `S/worker-dryrun.log`).
- **Red on today's code:** this lane's app tests over `5090991c`'s source fail 24 in 10 files, every item
  (`S/red-on-base.log`); the Worker's report, stream and heartbeat suites over the base Worker fail 10 and two files at
  import, while its compat replay passes there as it must (`S/red-on-base-worker.log`).
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` is 45 paths, every one under `owns`, this file, or
  a System-doc edit above (`S/lane-check.txt`, checked by script against the frontmatter); no exceptions.
- **PREMISE (lab:smoke):** disposable-mode's eight asks still hold: its `save` options draw Download all handing over
  the originals, which the zip still is (this lane changed only how its ending is said), and the viewer's Save and
  Share are untouched. The scoped boards (event-ready via `export-toast.tsx`, locked-door via `catalog.ts`) rendered.
- **The items** (ROADMAP's five lines answered, to delete by their words):
  - "the mint has no timeout and no cancel ... raw integers ... bulk Download mints with hidden items in": the first
    two halves were already true (the walk's ceilings and x: `export-walk.test.ts` "every try hanging still ends",
    green on base by design, and "cancels a mint in flight"; live, a stub-hung mint ended at its ceilings in about 47 s
    with Try again, and Try again downloaded; `export-dialog.test.tsx` pins "2,440"); the third is built: a host
    selection that mixes hidden and shown items asks first in the toast and lets the bar go (`export-walk.test.ts`, "a
    host's selection with hidden items in it"; seen at 375 on the real toaster through a temporary, uncommitted hook).
  - "the Worker skips an R2 object ... in silence ... empty zip; a failed-export state": a reporting token's stream
    finds its first object before answering, none is a 204 reported `empty`, a gone one is named `short`, a broken
    read `failed`, a client that left `stopped` (`stream.test.ts`; `wrangler dev`, `S/e2e.log`; a headless Chrome of
    the lane's own stayed on its page at the 204 and saved the reported zip into scratch only, `S/chrome-dl.log`).
  - "a part's saved needs the Worker to report a finished stream": signed reports into `/api/export/report`, kept on
    the row by nonce; the walk polls `/api/export/status` and turns downloading to saved per part, its last word
    waiting for every part (`report/route.test.ts`, `status/route.test.ts`, `export-walk.test.ts` "saved means
    saved"; through the real app and local Worker, `S/walk-e2e.log`: the report and status answer 503 until the
    migration stands, never 403).
  - "/admin/exports counts mints only": each row says the furthest anyone saw (`outcome-word.test.ts`), beside the
    heartbeat and the signal.
  - "/admin/exports has no heartbeat": the `export` job (daily self-check, its switch `export_enabled`) and the
    `export_delivery` signal (`catalog.test.ts`, `jobs.test.ts`, `heartbeat.test.ts`; `S/e2e.log` scenario 6).
- **Every older app keeps its answers:** `compat.test.ts` replays milestone 29's requests at its vendored Worker and
  milestones 30 to 32's (the check, its refusals, a pause, a bucket down) at the vendored `milestone-31/`, byte for
  byte and object read for object read, with no outbound call; today's tokens still stream at both.
- **A guest's Download button** (crumbs-43's `live-gallery.tsx`) needs nothing: it mounts `ExportDialog` unchanged.
- **Assets requested from Will:** none.
- **Board ideas:** Download all's toast could count a part as it goes ("Saving 812 of 2,000"), from a progress report
  the Worker could send a minute.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:**
  - `20261001235500_export_worker_reports.sql`: apply BEFORE or WITH the deploy of this lane's app. Until it stands,
    `/admin/exports` fails to load (it reads the new columns), the admin band and bell read the health console
    unreadable (`getJobSignals` reads `stream_outcome`), the report route answers 503 and the walk claims nothing.
    Protocol and rolled-back check in its header; proof red then green on the live schema, nothing persisted
    (`S/proof-result.txt`). Then regenerate the types and drop the two typed seams (`untypedAdmin` in
    `queries/exports.ts`, the cast in `queries/jobs.ts`'s downloads count).
  - The Worker: `npm run deploy` in `workers/export`, no new secret (reports ride `EXPORT_SIGNING_SECRET`);
    `wrangler.jsonc` adds the `30 5 * * *` cron and the `HEARTBEAT_URLS` var. Either order against the app is safe:
    the deployed Worker ignores `report` and never promises reports, so the new walk says today's words; the new
    Worker answers every older app's requests unchanged. Until milestone 33 puts the report route on partyreel.com,
    the heartbeat lands through the alias (its second address); the alias may leave the var after that.
  - Vercel, Stripe, env: none.
- **For the next build's red-team** (the hub and the portal cannot sign in locally; downloads only in a headless Chrome
  saving to its scratch): after the migration, a guest Download all on "Export wiring probe (disposable)" reads
  "Downloading…" then today's "starting" against the deployed Worker, and "Your download is saved." once the new
  Worker is deployed, its export_log row filled; willg97's Select all over a hidden item, Download, asks "N of these M
  are hidden." and Leave them out zips only the shown (`unzip -l`); `/admin/exports` (partyr33l) shows the outcome
  words and the two chips, and `/admin/jobs` the two cards; after the Worker deploy, a zip left mid-way (close the tab)
  reads Stopped, the production proof of the push model, and the next 05:30 UTC heartbeat lands as an `export` run.
- **Calls his to overrule:** a mixed selection asks first (only a mix); saved is the Worker's last byte; the toast
  stays while a zip downloads, and a walk's last word waits for every part; a stopped zip is said with Try again; a
  204 for an album emptied after its check; reports on the export secret in their own MAC domain; a daily heartbeat on
  `export_enabled`; the status polled by the nonce, 1 s backing off to 10 s, 6 h at most.
- **Look at first:** the hidden-items question in the toast (its words, its two answers under the line), then the
  migration's apply order.
