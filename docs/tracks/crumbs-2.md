---
track: crumbs-2
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "9166cbb4"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/r2/keys.ts
  - src/lib/r2/keys.test.ts
  - src/lib/lifecycle/account-deletion
  - src/lib/lifecycle/sweeps/expired-events
  - scripts/sweep-reel-files.mjs
  - scripts/seed-demo-event.mjs
  - src/lib/reel/engine/reel-types.ts
  - src/lib/reel/engine/style-registry.ts
  - src/lib/reel/engine/themes.ts
  - src/lib/db/queries/media.test.ts
  - src/lib/supabase/row-cap-tripwire.test.ts
  - src/app/(dev)/design/sandbox/voice-guest/
  - docs/systems/reel.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/ROADMAP.md
  - src/components/guest/door.css
  - supabase/migrations/20260924110000_live_reel_drop.sql
---

# lp/crumbs-2

**Goal.** Clear what the stored reel's drop and sweep left behind, and give the voice-guest board the door's stylesheet, so no code, comment or test names an object that no longer exists and the board's welcome frame stands at its real height.

## The brief

Two ROADMAP "Now" lines, each finished and named in your Handoff so the Orchestrator retires it.

1. **The stored reel's last code.** The drop migration (`supabase/migrations/20260924110000_live_reel_drop.sql`) is applied and the stored files are swept from both R2 buckets (dry runs read zero). What still names them goes:
   - `reelOutputKey` in `src/lib/r2/keys.ts` and its tests in `keys.test.ts` (keep any assertion that still guards a live key shape, such as the orphan parser refusing a non-media key, on another example);
   - the two appends that delete it: `src/lib/lifecycle/sweeps/expired-events.ts` (and its test's expectation) and `src/lib/lifecycle/account-deletion.ts`;
   - the one-shot `scripts/sweep-reel-files.mjs`, its work done;
   - the comments that still name a dropped object: `scripts/seed-demo-event.mjs` (about line 535), `src/lib/r2/keys.ts` (about line 47), and the reel engine's `reel-types.ts`, `style-registry.ts` and `themes.ts` (each names `highlight_reels` or `reel_items`): rewrite each for what is true now or cut it;
   - the test fixtures that model dropped tables: `src/lib/db/queries/media.test.ts` (a fake response keyed by `highlight_reels` and `reel_items`, about line 205; the migration-scan assertion near line 262 reads migration files and may stay if it still tests something live) and `src/lib/supabase/row-cap-tripwire.test.ts` (a sample `reel_items` path, about line 191): point them at live tables.
   - `docs/systems/reel.md`'s "The stored files are swept" bullet: the code named there is gone, so the bullet shrinks to what remains true.
   The check: `git grep -nE 'highlight_reels|reel_items|reel_render_log|reel_status|notify_reel_ready|reel_render_enabled|add_to_reel|reorder_reel|upsert_reel_config|set_reel_guest_visible|get_event_reel_by_qr_token|reelOutputKey' -- src scripts workers ':!src/lib/db/types.ts'` answers only the two guards that pin the drop file (`src/lib/db/migration-guards.test.ts`, `src/lib/db/row-cap-sql.test.ts`).

2. **The `voice-guest` board's welcome frame.** `crumbs` keyed its door quote to `data-entry-sheet`, but `door.css` loads only with `entry-shell.tsx`, which the board never renders, so no stylesheet on the board carries the 55svh rule (measured at 375: the welcome step's `min-height` is 0px). Import `@/components/guest/door.css` from the board so the frames get it, and make `scene.tsx`'s comment about door.css true. Prove it at 375: the welcome step inside the "As shipped" frame reads a non-zero `min-height` (55svh of the frame).

`album-guest-wiring` is running beside you and owns the album's and the live reel's files (`src/lib/reel/live/`, `src/lib/reel/engine/player-live`, `src/components/guest/reel/`): touch none of them. Check with `pnpm lab:smoke` and curl; the board check may use the built-in browser pane in your own tab only (never click Copy).

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` whole when the lane changes anything under `src/` but tests (the Library renders the product's components); and the surfaces the Handoff is judged on, local and live.

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
