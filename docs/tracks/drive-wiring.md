---
track: drive-wiring
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "46682654"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - supabase/migrations/20261005120000_cloud_export.sql
  - workers/drive/
  - src/lib/drive/
  - src/lib/export/drive-names
  - src/lib/db/queries/drive
  - src/app/api/drive/
  - src/app/api/internal/drive/
  - src/components/app/drive/
  - src/components/app/export/take-home-panel
  - src/app/(app)/account/page.tsx
  - src/components/app/storage/storage-list
  - src/components/app/dashboard/events-section
  - src/lib/env.ts
  - src/lib/email/templates
  - src/app/admin/exports/
  - src/lib/jobs/spend-watch.ts
  - docs/systems/drive-export.md
  - docs/SYSTEMS.md
  - docs/systems/database-security.md
  - docs/systems/uploads-and-r2.md
  - docs/systems/trust-safety-forensics.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/lib/export/
  - workers/export/
  - workers/backup/
  - src/lib/r2/presign.ts
  - src/lib/db/read-all.ts
---

# lp/drive-wiring

**Goal.** Send to Google Drive, wired as Will picked it on desk 2 (2026-10-05): from Take it home's Originals card beside Download, from Your events and from What's using space; connecting behind our own promise; progress on the album it sends; a stop said in place with its one act, its email, and an app-wide flag when it needs her; done as done, with nothing that suggests deleting what was sent; a Google Drive card in Account; files named when, then who. The design note `../partyreel-wt/_scratch/drive-export/design.md` (Advisor-reviewed, Q25 and Q27) is the build, minus its clean exit.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish (the viewfinder's corners survive only as a focus mark, never a style, and so does nothing of their loading state); a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline (undated, morning-only and multi-day events all read well); "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control); cost is designed like the architecture (every image and video action multiplies at scale). Production is the working version: a pick is the best of what was drawn, never a rule.

**★ Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app (Vercel's Hobby CPU is at its limit). Port 3136 is yours; 3000 is Will's desk and the red-teams', never touched; 3130 is the Orchestrator's gate. Sign-in works only on the desk build at 3000 (Supabase allows that callback alone), so your own walks of the signed-in surfaces run against fakes and tests; the live connect, send and disconnect walk is the Orchestrator's on the desk build after your merge, once Will's Google client exists.

**Read first, whole:** `../partyreel-wt/_scratch/drive-export/design.md` (sections 1 to 7 and 12 are the build; 8 is dropped, below; 9 and 10 are later versions; 11 is Will's step, being relayed now; 13's answers are below), `q25-advisor.md` and `q27-advisor.md` beside it, the board's own `spec.ts` and drawings (`src/app/(dev)/design/sandbox/drive-export/`, every option Will picked), and his ledger `docs/reviews/drive-export.json` with his notes.

**Will's picks (desk 2, his notes synthesized):**
- **way-in = originals:** Send to Drive is a second act on Take it home's Originals card, beside Download: original quality goes home by Download or by Drive; Phone size stays its own card. Not a third card.
- **doors = both:** Your events can send several albums at once, and What's using space offers Drive.
- **connect = promise:** our promise of how little drive.file reaches, then Google's screen, then a final press back on the album.
- **progress = album:** the send shows on the album it sends; she can close the tab.
- **hard = in-place, plus a flag she cannot miss.** Each stop turns the send's own place to its light, its words and its one act (Check again, Reconnect, Retry), and sends one email. His note: a warning tucked where she can navigate away is easily never seen. So a stop that needs her (Drive full, disconnected, files that won't go) also flags itself app-wide: the house's toast on her next page anywhere in the app, once per stop, carrying the act or the way to the album, and the app's bell where one exists. A pause that resumes by itself (Google's daily 750 GB) stays quiet in place, with its email.
- **done = done-only:** "Done, every one checked", Open in Drive. **Nothing in the export flow suggests deleting what it sent** (PRICING.md's new rule, "Export is an off-ramp, never a one-click exit"): storage tiers are what Partyreel is paid for, and an easy off-ramp is what makes a month of Pro an easy opt-in. Deleting stays where it already is (select and delete in an album, Delete event in Settings, What's using space).
- **exit: dropped.** Design section 8 (the clean exit, its fresh re-check, Free 7.4 GB) is not built: no exit act in `cloud_export_act`, no Free line anywhere, no exit email.
- **account = card:** a Google Drive card under Plan: connected as, the Partyreel folder, what's been sent, Disconnect.
- **naming = when, then who** (`Partyreel / Maya & Jay · 12 Sep 2026 / 2026-09-12 21.14.05 · Priya.jpg`). Will asked whether batches make arrival time group by guest; capture time would be truer, but the app keeps none today (the browser strips everything but orientation before upload; `media` holds only `created_at`). Build the names on arrival time through one naming function that takes a capture time when one is known (null today), and set each Drive file's `modifiedTime` to the same stamp so Drive's own sort agrees. Keeping a capture time at upload is a separate decision, Will's.
- **Which plans:** every plan (section 13's recommendation, built; his to overrule). Live sync and Dropbox are later versions.

**The wiring points owned by crumbs-75 until it merges** (`src/lib/email/send-kinds.ts`, `src/app/admin/jobs/catalog.ts`, `src/lib/lifecycle/account-deletion.ts`, `docs/systems/admin-observability.md`): each is a one-line exception you touch only after crumbs-75 merges (orchestrator.md announces it), syncing first by `git merge origin/launch-prep`; list each under your lane check.

**The migration** is exactly `supabase/migrations/20261005120000_cloud_export.sql` (section 12's tables, RPCs and `ops_flags` row, minus the exit), with its rolled-back contract check at its foot run through the Supabase MCP (begin; ... rollback;). The Orchestrator applies it after the Advisor reads it; nothing of yours writes to the database. **The Worker** (`workers/drive/`, its own tests with a fake Drive and a fake R2) and its queues and secrets are deployed by the Orchestrator: your Handoff lists every command and env value to set (names and how to make each, never a value). **The env** names in section 12, each `.optional()` with a lazy `assertDriveEnv()`.

**Operators in the same change** (section 7): `/admin` shows every send, a stuck lane, the dead letters and the switch; zero silent failures.

Build boldly and completely; every Question you would ask goes under Questions with its recommendation built. Wiring rigor: the whole gate, the Worker's own tests, and a written walk script for the Orchestrator's live walk on the desk build (section 12's red-team list, minus the exit).

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Where I am (parked 2026-10-05 for the laptop restart; resume from here)

**Done.** Booted (worktree `../partyreel-wt/drive-wiring`, `lp/drive-wiring` pushed, `.env.local` copied, install
clean). Read whole: the design note, q25/q27, research, the board's spec and drawings, Will's ledger, and the
production surfaces each pick lands on (take-home-panel, event-gallery's album head, events-section and its Display
menu, storage-list-body, account page, export-toast, admin/exports, spend-watch, env, email templates and send,
account-deletion, database-security, uploads-and-r2). **Drafted, NOT yet preflighted:**
`supabase/migrations/20261005120000_cloud_export.sql` (six tables, ~20 functions, the switch seed, spend_watch_readings
restated with `drive_bytes`). No dev server, no wrangler running.

**Next, in order.**
1. Fix the migration's `cloud_export_sweep` lock order before anything else: do the connection-locking parts first
   (grant-ending -> failing, failing past a day -> pause, the kick loop), THEN the job-only updates (preparing ->
   stopped, daily_limit resume, expiry, stuck, breakers) as `update ... where id in (select ... for update skip
   locked)`, so the sweep never holds a job row while waiting on a connection row a lane's report holds.
2. Preflight on a throwaway Homebrew postgresql@17 cluster (database-security.md's recipe): stand-ins for profiles,
   events, media, ops_flags, tier_limits, storage_ledger/album_state/sent_emails/export_log/job_runs (for
   spend_watch_readings), the Supabase roles, an auth.uid() stub; apply verbatim; write and run the rolled-back
   contract check (the section-12 list minus the exit) and append it commented at the file's foot.
3. App lib (`src/lib/drive/`): tokens.server.ts (AES-256-GCM, AAD `drive:v1:<user>:<provider>:<purpose>`, key id in
   the sealed string, DRIVE_TOKEN_KEY + _PREVIOUS), google.ts (auth URL with PKCE S256, exchange, refresh, revoke x3,
   ID-token decode, about.get, folders; one URL allowlist), protocol.ts (`${b64url(json)}.${hmacHex("drive:"+body)}`,
   5-minute freshness; the lease's token sealed with HKDF(DRIVE_WORKER_SECRET, "drive:token") + AES-GCM),
   oauth-cookie (`pr_drive_oauth`, HMAC under UNLOCK_COOKIE_SECRET in a `drive-oauth:` domain), moments.ts (a job ->
   the board's MOMENTS words), the status store; `src/lib/export/drive-names.ts`; `src/lib/db/queries/drive.ts`; env.
4. Routes: `api/drive/connect`, `callback`, `exports` (POST, one or many albums), `exports/[id]` (cancel, resume
   with a room check, retry, seen, refolder), `exports/[id]/items` (failed/skipped, keyset), `status` (GET);
   `api/internal/drive/lease|report|check|sweep`; Disconnect as a Server Action.
5. Worker `workers/drive/` (index, lane, google-drive adapter with handle-only undo, protocol twin pinned by a shared
   vector, queue-metrics), vitest with a fake Drive and a fake R2; wrangler.jsonc per section 3.
6. UI: the Originals card's Send to Drive + the promise and final-press steps; the album strip (a one-line exception
   in event-gallery.tsx); dashboard tile lights + a picker popup beside Display; the storage-list door (no "then free
   it"); Account's Google Drive card; the app-wide flag toast (a one-line exception in the (app) layout).
7. After crumbs-75 merges (sync first): send-kinds (a new never-held list for the Drive mails), the jobs catalog
   (drive_sweep, drive_transfer, drive_queue, drive_dead_letters), account-deletion's purge step, the spend-watch
   card's line, admin-observability facts; the request's revoke in `src/lib/db/mutations/account.ts` (an exception).
8. /admin/exports' Drive section; the emails; the docs (drive-export.md new, SYSTEMS.md, database-security,
   uploads-and-r2, trust-safety-forensics); the gate; the walk script; the Handoff.

**Decisions so far (each goes under Questions or Calls with its reason).** Disconnect and a different-account
reconnect revoke at Google; a SAME-account reconnect does NOT revoke the replaced token (Google's revoke removes the
whole grant the new token rides; its docs: "invalidating the permissions previously granted to the application"). A
send takes the whole album and each item carries `prior_file_id` from an earlier send on the connection, which the
Worker confirms and records as kept, so sending again never duplicates and a file she deleted in Drive goes again (Q27
N2 without the exit). A leases table and an hourly sent-bytes table (both deny-all: the advisor count goes 19 -> 24,
not 22). The app makes the folders at the press (`cloud_export_ready`), the root by compare-and-set. Names: the TS
stem and extension, the " (n)" ordinal assigned in SQL under the connection lock. The breaker is checked at the press
and by the sweep (not every lease); Google's day by the hourly table at every lease. The closing check confirms by
file id with bounded concurrency; duplicates counted from one folder listing. The spend watch's reading is per day
(`drive_bytes`, a last_day window) to fit the watch's machinery. Your events' door is a picker popup (it works over
gallery, table and list and scales to hundreds) rather than in-tile picking.

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
