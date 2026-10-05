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
