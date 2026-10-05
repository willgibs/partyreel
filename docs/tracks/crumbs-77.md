---
track: crumbs-77
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "94d66338"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/no-em-dash-policy.test.ts
  - src/lib/guest/reel-url-history.test.tsx
  - src/lib/content/help-ui-labels.test.ts
  - src/lib/db/row-cap-policy.test.ts
  - src/lib/db/row-cap-sql.test.ts
  - src/lib/db/migration-guards.test.ts
  - src/lib/db/testing/
  - src/lib/db/read-all.ts
  - scripts/album-perf.mjs
  - scripts/seed-demo-event.mjs
  - scripts/backfill-strip-exif.mjs
  - docs/systems/testing-verification.md
  - supabase/migrations/20260702213427_reel_style_catalog.sql
  - supabase/migrations/20260703002403_reel_style_catalog_drop_legacy_overload.sql
  - supabase/migrations/20260708022629_reel_caps_ingress_multiplier_parity_reapply.sql
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/lib/history-entry.test.tsx
---

# lp/crumbs-77

**Goal.** The gate's flakes and guards: two tests that time out or race under load wait on what they mean, one help test scans only the product's controls, the three SQL guard tests share one drop-aware migration reader, three applied migrations get their files back, two scripts share read-all, and testing-verification.md's two stale facts are corrected.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish (the viewfinder's corners survive only as a focus mark, never a style, and so does nothing of their loading state); a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline (undated, morning-only and multi-day events all read well); "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control); cost is designed like the architecture (every image and video action multiplies at scale). Production is the working version: a pick is the best of what was drawn, never a rule.

**★ Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app (Vercel's Hobby CPU is at its limit). Port 3133 is yours; 3000 is Will's desk and red-team 54's, never touched; 3130 is the Orchestrator's gate.

**Why this lane:** every flaky gate step costs a full re-run across every lane's integration, and a guard test that misreads the migrations guards nothing.

**The fixes:**
1. `no-em-dash-policy.test.ts` walks `src/` inside vitest's 5 s default and has timed out under load: give it a timeout of its own.
2. `reel-url-history.test.tsx` waits a fixed 40 ms after a Back and a Forward: wait for the popstate as `history-entry.test.tsx`'s `settle()` does.
3. `help-ui-labels.test.ts` reads `src/components/marketing/` and comments too, so a help label only a mock or a comment still carries passes: scan the product's own controls only.
4. One drop-aware migration reader for the SQL guard tests (`row-cap-policy.test.ts`, `row-cap-sql.test.ts`, `db/migration-guards.test.ts` each keep their own; `latestDefinition` scans creates only, so a dropped function still reads as defined), in `src/lib/db/testing/`.
5. Three applied migrations have no file in the repo (`reel_style_catalog`, `reel_style_catalog_drop_legacy_overload`, `reel_caps_ingress_multiplier_parity_reapply`): recover each from `supabase_migrations.schema_migrations` (read-only SQL through the Supabase MCP, project `ddafaemglzmuekbtjwzn`) as the file your manifest names (its recorded version and name), byte for byte (`md5` of the file equals `md5(statements[1])`). Nothing is applied; nothing writes to the database.
6. `scripts/album-perf.mjs --arrive` waits 15 s for the hide and the arrival (`watchSize`), which the album's 15 s batch beat can just exceed: wait 20 s.
7. `scripts/seed-demo-event.mjs` and `backfill-strip-exif.mjs` copy `readAllPages` and `inChunks`, since `read-all.ts` imports `must-query` through the `@/` alias plain Node cannot resolve: a relative import there lets them share it.
8. `docs/systems/testing-verification.md`: (a) it says the Browser pane's `resize_window` reports success and changes nothing, but the current tool emulates a viewport: re-check that trap against the tool (your own pane tab, `tabId` on every call, on your own port) and correct it; (b) its presign-roll soak covers the paged album, whose links re-mint by id; a teaser's nine links ride its poll and refresh only as the 30-minute bucket rolls (`guestAlbumEtag`'s `bucketId` in `api/album/guest/sync`): name that case there too.

Prove 1 and 2 under load: 20 runs in a row of each while a build runs through the lock. Wiring rigor: the whole gate.

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
