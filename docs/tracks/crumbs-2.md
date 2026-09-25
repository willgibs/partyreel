---
track: crumbs-2
status: handed-off            # open -> handed-off; deleted in the merge commit that integrates it
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

- none: both items were fully specified by the manifest's own check command and by existing test
  assertions elsewhere (row-cap-sql.test.ts's `LIVE.has("get_event_reel_by_qr_token")` already pinned
  the function as dropped), so nothing here was a one-way door needing a product/UX call.

## System-doc edits (in place, owned facts only)

- `docs/systems/reel.md`, "The stored reel's end": the "stored files are swept" bullet shrunk to what
  remains true now that the sweep AND the code naming it are both done (past tense); the "what remains
  is on a clock" framing dropped since nothing remains.

## Deferred (ROADMAP one-liners, bucket named)

- none: both Now lines below are fully retired, nothing pushed out.

## Handoff (replaces the chat report)

- Work commit `d9ef58e2` (no sync commit: `origin/launch-prep` moved by one commit, `74928b7b`, but it
  only touched `docs/STATUS.md` and `docs/tracks/orchestrator.md` — a record commit, not code, and not
  in this lane's `reads`, so per "Agent boot"'s Sync rule none was needed). Pushed to `lp/crumbs-2`.
  Manifest commit is this one, head is in the chat line.
- Gates, all on `d9ef58e2`'s tree:
  - `pnpm typecheck`: exit 0 ("Types generated successfully").
  - `pnpm lint`: exit 0, 0 errors; 6 pre-existing warnings, all in files this lane never touched
    (`_desk/review-session.tsx`, `sandbox/home-hero/shared.tsx`, `(paper)/contact/contact-form.tsx`,
    `marketing/sections/features/album/{album-fill-grid,review-switch}.tsx`).
  - `pnpm test`: 482 test files / 5335 tests, all passed. Flaky note: two of several full runs also
    reported 1 and 4 "Unhandled Error" counts from an `input-otp` internal timer firing after teardown
    inside `email-section.test.tsx` (never a file this lane touched, unrelated to reel or voice-guest);
    the assertion count was 5335/5335 on every run including the flaky ones, and a clean rerun (exit 0,
    0 errors) is the one this Handoff stands on.
  - `zsh scripts/build-lock.sh pnpm build`: exit 0, no errors, re-run after `pnpm format`.
  - `pnpm lab:smoke --base http://localhost:3135`: 272 checks, 0 failing (whole suite, run because this
    lane changes non-test files under `src/`). `/design/boom` shows a 500 in the smoke log by design (a
    permanent boundary probe that throws on purpose, `tools/boom/page.tsx`'s own comment) — confirmed
    pre-existing and unrelated, not a regression.
  - `pnpm lab:demo` not run: this manifest's `board: none` (not an exploration-round lane).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = exactly the 13 `owns` entries (16
  files, one deleted) + this manifest. No exceptions.
- The items:
  - ROADMAP.md:25 ("The reel: the stored files are swept ... remove `reelOutputKey` ... the comments
    still naming the dropped tables"), done at `d9ef58e2`: `reelOutputKey` and both its delete-batch
    appends (`expired-events.ts`, `account-deletion.ts`) are gone, with their tests' ordering/count
    expectations; `scripts/sweep-reel-files.mjs` deleted (its one-shot work already done, per
    `9166cbb4`'s record: Will ran the sweep, dry runs read zero); every stale comment naming
    `highlight_reels`/`reel_items` in `seed-demo-event.mjs`, `keys.ts`, `reel-types.ts`,
    `style-registry.ts` and `themes.ts` rewritten. Two fixtures the brief flagged as modeling dropped
    tables turned out unread by anything under test (`media.test.ts`'s `highlight_reels`/`reel_items`
    rows, and its `get_event_reel_by_qr_token` migration-scan, now fully dropped from the live schema
    per `row-cap-sql.test.ts`) — deleted rather than repointed, since nothing queries them regardless of
    key name; `row-cap-tripwire.test.ts`'s sample path is repointed to a live table (`guests`), since
    that one IS read (the tripwire's own path-reporting test). Verified: the manifest's own check —
    `git grep -nE 'highlight_reels|reel_items|reel_render_log|reel_status|notify_reel_ready|reel_render_enabled|add_to_reel|reorder_reel|upsert_reel_config|set_reel_guest_visible|get_event_reel_by_qr_token|reelOutputKey' -- src scripts workers ':!src/lib/db/types.ts'`
    — now answers only `src/lib/db/migration-guards.test.ts` and `src/lib/db/row-cap-sql.test.ts`, the
    two guards, exactly as specified.
  - ROADMAP.md:21 ("The lab: the `voice-guest` board's welcome frame still lacks the 55svh presence
    ... the board imports `@/components/guest/door.css`, and `scene.tsx`'s comment ... becomes true"),
    done at `d9ef58e2`: `board.tsx` now imports `@/components/guest/door.css` (mirrors
    `identity-door/board.tsx`'s own `import "./identity-door.css"`); `scene.tsx`'s `DoorGround` comment
    now says door.css doesn't ride along with a quoted primitive and names `board.tsx` as why it applies
    here anyway. Verified in the browser pane at 375 (`pnpm dev -p 3135`,
    `/design/lab/voice-guest?key=fiesta`): before the fix `door.css` was reachable only from
    `entry-shell.tsx` (never rendered by this board); after, the "As shipped" welcome frame's
    `[data-welcome-step]` computes `getComputedStyle(...).minHeight === "446.6px"`, exactly 55% of the
    812px frame — was 0px.
- Assets requested from Will: none.
- Board ideas: none.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Calls his to overrule: none (no Questions were asked).
- Look at first: `/design/lab/voice-guest?key=fiesta` at 375 (Fit or 1:1), the welcome step inside "As
  shipped" — confirm the sheet now reads as the tall, centred "Calm arrival" `door.css` intends rather
  than hugging the bottom edge. Everything else in this lane is dead-code/dead-doc removal with no
  visible surface to review.
