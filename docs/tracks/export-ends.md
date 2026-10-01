---
track: export-ends
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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

## Questions (a recommended answer each; the Orchestrator relays them)

- **Hidden items in a host's selection.** Built: a selection that MIXES hidden and shown items asks first, in the
  download's own toast ("3 of these 12 are hidden." with Include them and Leave them out, the x cancels); a
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
  a Try again for exactly what it lacks ("That download stopped before it finished."); the Worker cannot tell her
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
