---
track: drive-crumbs
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "b5042226"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - supabase/migrations/20261006130000_drive_marks.sql
  - src/lib/drive/
  - workers/drive/
  - src/app/api/drive/
  - src/app/api/internal/drive/
  - src/components/app/drive/
  - src/app/admin/exports/
  - src/lib/admin/palette.ts
  - src/lib/admin/palette.test.ts
  - src/lib/admin/palette-actions.ts
  - src/lib/db/queries/drive.ts
  - src/lib/db/queries/drive-stops.ts
  - src/lib/export/drive-names.ts
  - src/lib/export/drive-names.test.ts
  - src/lib/db/drive-marks.test.ts
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/drive-export.md
  - docs/systems/database-security.md
---

# lp/drive-crumbs

**Goal.** Drive made whole before it goes live at milestone 38: a re-send after a reconnect adds only what is missing (album folders and files found by their marks, one migration), a closing check holds at the first file Google never answered for, Account's card names her folder on reconnect, and the palette reaches Drive's admin section.

## The brief

**The round's direction (Will, standing since round 13):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; delight where it costs nothing in clarity; nothing depends on a timeline; immediate, or a clear state and a way to stop it; Partyreel runs with no AI managing it (zero silent failures); cost designed like the architecture; production is the working version.

**Why now.** Send to Google Drive goes live at milestone 38, when its Worker deploys (production reads "not set up" until then). drive-fixes, the desk re-walk and drive-hardening made it correct for a first connect and send; they left three lines a real host can meet after that, and Drive should not go live with them. Read `docs/systems/drive-export.md` first (its ★ lines, and "The next versions"), then `workers/drive/README.md`; the newest definitions of its SQL are in `supabase/migrations/20261005120000_cloud_export.sql` and `20261005180000_cloud_export_fixes.sql`. The calls lab's BE3 is Will's own view of the first line.

**The work (each line retired from the ROADMAP in your Handoff):**
1. **A re-send after a reconnect adds only what is missing.** After a same-account Disconnect and Connect, sending an album again sends it whole into a second same-named album folder (the forget dropped its files' ids). Mark album folders (`pr_event`) as the Partyreel folder already is, and look files up by `pr_media` when the press found the folder rather than made it: a column on the send, a migration (`supabase/migrations/20261006130000_drive_marks.sql`, from the newest definitions, grants exact, with rolled-back proofs through the Supabase MCP in your Handoff; you never apply it, the Orchestrator does after the Advisor reads it).
2. **"Every one checked" means every one answered.** A slow down on a closing check's `files.get` answers `unknown`, which the check route drops while the cursor walks past it: pace the check's asks and hold the cursor at the first unknown (`check.ts`, `/api/internal/drive/check`, `cloud_export_check_page`).
3. **Account's Drive card names her Partyreel folder as soon as she reconnects** (found by its mark), not only after her next send.
4. **The command palette jumps to `/admin/exports#drive`** (`lib/admin/palette.ts`).

Out of scope: the account view's Drive controls on `/admin/accounts/[id]` (billing-orphans holds `/admin/accounts` this round; the line stays), Drive v2 (live sync, Dropbox), and any deploy: the Worker deploys at milestone 38 by the Orchestrator, never from a lane. Google's side needs a real consent (P3's, Will's hand), so a live send waits for the milestone's walk: prove the Worker's logic in its own tests and under `wrangler dev --local` where it can run without Google, and say in your Handoff exactly what the milestone's live walk must press.

**Starts from.** CLAUDE.md's working loop and security guardrails (tokens sealed server-side, never a raw R2 key to the browser), and production as it is; the tests say what has to keep working.

**Verify on.** The whole gate on the synced tree, each step on its own exit code (`workers/drive`'s own tests too), and `pnpm lab:smoke`; the SQL proofs; Account's Drive card at 375 and 1440 in the state a reconnect leaves.

Model: Opus. Cut 2026-10-06 by the cloud-seated Orchestrator; you run in a cloud session of your own (the spawn prompt's boot).

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
