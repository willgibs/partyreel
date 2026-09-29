---
track: crumbs-21
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "2d2240a2"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/db/migration-guards.test.ts
  - src/app/admin/albums/
  - supabase/migrations/20260929230000_door_password_ends_asks.sql
  - supabase/migrations/20260929231000_report_keeps_its_item.sql
  - supabase/migrations/20260929232000_like_counts_shown.sql
  - src/lib/guest/use-upload-queue.ts
  - src/lib/guest/use-upload-queue.test.tsx
  - src/components/app/event-settings/door-page.tsx
  - src/components/app/event-settings/door-page.test.tsx
  - src/lib/db/queries/reports.ts
  - src/lib/db/queries/reports.test.ts
  - src/lib/admin/reports.ts
  - src/lib/admin/reports.test.ts
  - src/components/app/report-review.tsx
  - src/components/app/report-review.test.tsx
  - src/components/admin/report-queue.tsx
  - src/components/admin/report-queue.test.tsx
  - src/components/admin/moderation-grid.tsx
  - src/components/admin/moderation-grid.test.tsx
  - src/lib/r2/grid-items.ts
  - src/lib/r2/grid-items.covered.test.ts
  - src/lib/moderation/operator-actions.ts
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/database-security.md
  - docs/systems/guest-flow.md
  - docs/systems/trust-safety-forensics.md
---

# lp/crumbs-21

**Goal.** Four data-integrity items from the ROADMAP: a waiting newcomer's ticket settled when her door moves, the admin album covering what a report of the worst kind names, what a report named outliving its photo's row, and the host's like counts limited to what she can see.

## The brief

Four items the ROADMAP holds, each fixed at its root with a test that fails on today's code:

- **A waiting newcomer keeps her ticket when her door moves.** A newcomer waiting at `approve` or the invite list whose door then becomes a password keeps her waiting ticket, so once she unlocks, `get_upload_context` and `create_media` still refuse it as a private album's, and the host's At the door still lists her. The door's move settles her rows (`crumbs-17`'s find; it fixed the listed newcomer's admit in `20260929220000_door_invite_admits.sql`, the shape to read first).
- **The admin album draws the worst kind uncovered.** `/admin/albums/[eventId]` draws every item uncovered, one a child-abuse or sexual-content report names included; the reports inbox covers that set (`crumbs-17`'s NIT-7 keeps a covered kind covered in every list), and the album grid covers the same set, from the same rule in one home.
- **What a report named outlives its photo's row.** `reports.media_id` is `on delete set null`, so once a reported photo is purged (a removal's window ending, an uploader's withdrawal) its report reads as an album report under All. What the report named (that it was a photo or a video, and which) outlives the row, without keeping the bytes or anything the purge exists to remove.
- **The host's like counts answer ids no surface shows her.** `get_event_like_counts` returns a count for every media id in her event, a takedown's and a withdrawal's included; it answers only what her surfaces show.

The SQL is migrations: write them (one file or several, each one decision), prove each rolled back on the live schema through the Supabase MCP (read-only otherwise), hold each shape in `migration-guards.test.ts`, and never apply one (the Orchestrator applies by protocol). New objects in `public` grant `anon` and `authenticated` nothing by default (CLAUDE.md's landmine): a function revokes from `public` and grants exactly.

**Verify:** the gate; each item's test red on today's code and green on yours; the rolled-back proofs; the admin album and the door walked where localhost reaches them (the admin portal and a signed-in host cannot run there: name their steps for the next build's red-team in your Handoff).

**Paths:** your owns are a start (add each migration file, and any query or page the fixes reach, to `owns` in your manifest before editing). A path you need beyond them: add it, or name a one-line exception.

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
