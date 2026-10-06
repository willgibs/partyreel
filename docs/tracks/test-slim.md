---
track: test-slim
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "2634388a8"           # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/admin/
  - src/lib/adopt-typed-value-policy.test.ts
  - src/lib/adopt-typed-value.test.tsx
  - src/lib/adopt-typed-value.ts
  - src/lib/album/
  - src/lib/analytics/
  - src/lib/auth/
  - src/lib/avatar/
  - src/lib/bare-login-policy.test.ts
  - src/lib/billing/
  - src/lib/brand/
  - src/lib/client-form-policy.test.ts
  - src/lib/compute-model-phones.test.ts
  - src/lib/constants/
  - src/lib/content/
  - src/lib/content-policy.test.ts
  - src/lib/crypto/
  - src/lib/dashboard/
  - src/lib/demo.test.ts
  - src/lib/demo.ts
  - src/lib/design-gate/
  - src/lib/disposable/
  - src/lib/drive/
  - src/lib/early-press.test.tsx
  - src/lib/early-press.ts
  - src/lib/email/
  - src/lib/env-example-parity.test.ts
  - src/lib/env.ts
  - src/lib/errors/
  - src/lib/event/
  - src/lib/events/
  - src/lib/export/
  - src/lib/forensics/
  - src/lib/format/
  - src/lib/gate-dev-cache-policy.test.ts
  - src/lib/glass.test.ts
  - src/lib/glass.ts
  - src/lib/guest/
  - src/lib/history-entry.test.tsx
  - src/lib/history-entry.ts
  - src/lib/history-state-policy.test.ts
  - src/lib/jobs/
  - src/lib/jsx-text-escape-policy.test.ts
  - src/lib/jsx-text-space-policy.test.ts
  - src/lib/lifecycle/
  - src/lib/media/
  - src/lib/media-cost-policy.test.ts
  - src/lib/metrics/
  - src/lib/moderation/
  - src/lib/next-image-optimizer.test.ts
  - src/lib/no-em-dash-policy.test.ts
  - src/lib/notifications/
  - src/lib/observability/
  - src/lib/og/
  - src/lib/package-manager-pin.test.ts
  - src/lib/qr/
  - src/lib/r2/
  - src/lib/record-depth-policy.test.ts
  - src/lib/reel/
  - src/lib/refresh-then-write-policy.test.ts
  - src/lib/reports/
  - src/lib/security/
  - src/lib/security-headers.test.ts
  - src/lib/security-headers.ts
  - src/lib/shared/
  - src/lib/single-source-policy.test.ts
  - src/lib/site-url.ts
  - src/lib/slug.test.ts
  - src/lib/slug.ts
  - src/lib/social/
  - src/lib/stripe/
  - src/lib/supabase/
  - src/lib/surface/
  - src/lib/test-utils/
  - src/lib/track-manifests.test.ts
  - src/lib/type-ladder-policy.test.ts
  - src/lib/upload/
  - src/lib/use-keyboard-inset.test.ts
  - src/lib/use-keyboard-inset.ts
  - src/lib/use-media-query.test.tsx
  - src/lib/use-media-query.ts
  - src/lib/utils.test.ts
  - src/lib/utils.ts
  - src/lib/validation/
  - src/lib/welcome.test.ts
  - src/lib/welcome.ts
  - src/lib/db/album-version.test.ts
  - src/lib/db/guest-cap-and-faces-guards.test.ts
  - src/lib/db/migration-guards.test.ts
  - src/lib/db/migration-versions.test.ts
  - src/lib/db/must-query.test.ts
  - src/lib/db/must-query.ts
  - src/lib/db/mutations/
  - src/lib/db/my-record-guards.test.ts
  - src/lib/db/queries/
  - src/lib/db/read-all.test.ts
  - src/lib/db/read-all.ts
  - src/lib/db/row-cap-policy.test.ts
  - src/lib/db/row-cap-sql.test.ts
  - src/lib/db/testing/
  - src/lib/db/upkeep-migrations.test.ts
  - src/components/
  - src/app/
  - src/testing/
reads:                  # single-sources you depend on: never duplicate, never edit
  - package.json
---

# lp/test-slim

**Goal.** A leaner, faster suite with no weaker guarantees: duplicates folded into tables, whole-tree scans shared, copy pins pointed at their homes, coverage held, and a rule that keeps it lean.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline; "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control, zero silent failures); cost is designed like the architecture. Production is the working version: a pick is the best of what was drawn, never a rule.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app, and nothing deploys. Port 3132 is yours; 3000 is Will's desk.

**Will's ask (2026-10-06):** "I noticed you said we have over 13,000 tests. Before cloud begins running those, do we have any potential to slim those down? I've noticed agents add tests for everything, but I'd imagine there's an elegant way to reduce those somewhat significantly without reducing the strength of our systems round over round." (CI now runs only on `main` and on opt-in pushes, `.github/workflows/ci.yml`, so the suite's size now costs mostly the local and cloud gate's time; a faster, leaner suite is the goal.)

Today: about 1,054 files and 13,190 tests, `pnpm test` 65 to 150 s on this Mac; many whole-tree scan policy tests (`src/lib/*-policy.test.ts`) each re-read the source tree; regression pins ("fails on the old code") are the scars of real bugs.

1. **Measure first:** per-file duration (`vitest --reporter=json`), the test count per file, and coverage (`@vitest/coverage-v8`, line, branch and function, per directory) on the current tree. Write the baseline to your scratch.
2. **Find the slack, by kind,** and slim each with the elegant tool, never by deleting what guards behaviour: duplicate assertions of one behaviour across files or layers (keep the one at the right layer); many `it`s that are one table (`it.each`); copy pins that re-type a string the code already holds in one home (assert against the home); whole-tree scans that each walk the tree (one shared scan feeding every policy); heavy component renders that assert a pure function's output (test the function); fixtures rebuilt per test that could be built once; tests of tests. Regression pins stay (a pin may be merged into a table, its scar comment kept).
3. **Prove the strength:** coverage after is not lower (line, branch and function, per directory: any drop is explained line by line and only in dead code you also delete, or it is restored), every regression pin still fails on the code it guards where you touched it, and the gate is green. Report before and after: files, tests, wall time (three runs each), coverage.
4. **Leave the rule behind:** one short paragraph for `docs/systems/testing-verification.md` (scratch-synthesis holds the systems docs: write it under your Handoff's proposed doc lines) on what a new test must earn (a behaviour at its right layer, a table over copies, the shared scan), so the suite stays lean round over round; and a guard if a cheap one exists (a policy test may not walk the tree itself).

Your owns are `src/` by folder (every path but the generated `src/lib/db/types.ts`), but you touch only test files and test helpers (`*.test.ts`, `*.test.tsx`, `src/testing/`; a change to `vitest.config.ts` goes under Questions as a one-line exception), never production code: if a production change would make a test simpler, write it under Questions. No migration, no board. The whole gate, each step on its own exit code; `lab:smoke` only if a lab test moved.

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

## Where I am

Scratch: `../partyreel-wt/_scratch/test-slim/` (BASELINE.md, the JSON reports, `tools/analyze.mjs` per-file times,
`tools/covdiff.mjs` per-directory and per-line coverage diff, `coverage-base/`). Coverage needs the provider linked
in: `node_modules/@vitest/coverage-v8` -> `_scratch/test-slim/cov/node_modules/@vitest/coverage-v8` (package.json
untouched); run it as `pnpm exec vitest run --testTimeout=60000 --coverage.enabled --coverage.reportOnFailure
--coverage.provider=v8 "--coverage.include=src/**/*.{ts,tsx}" "--coverage.exclude=src/**/*.test.{ts,tsx}"
"--coverage.exclude=src/lib/db/types.ts" "--coverage.exclude=src/**/testing/**" "--coverage.exclude=src/**/test-utils/**"
--coverage.reporter=json-summary --coverage.reporter=json --coverage.reportsDirectory=<dir>`. Two baseline runs are
identical line for line, so any drop is real.

**Baseline (2634388a8):** 1,052 files, 13,161 tests (unit 672/8,781, component 380/4,380), 258,477 test lines; wall
82.7 / 87.5 / 86.4 s, CPU 853 / 874 / 869 s (load ~20 from other lanes); summed: environment (jsdom) 284 s, import
249 s, tests 321 s, setup 78 s, transform 60 s. Coverage: lines 70.68% (40,705/57,588), branches 66.16%
(32,684/49,399), functions 65.78% (10,472/15,918). The time is per-file setup (jsdom ~0.75 s a component file) and
~800 tests over 100 ms; 9,500 tests run under 10 ms each (14 s in all), so the count is not the cost.

**Config, measured, no test change (each one run):** `--pool=threads` 69.6 s, all green; `--experimental.fsModuleCache`
warm 79.9 s; `--no-isolate` 31.6 s but 51 files fail (leaking mocks). Proposed under Questions, not built.

**Step 1, the shared scan (in progress):** `src/testing/source-tree.ts` (filesUnder / entries / sources / read /
syntax) pushed at 68ca2209b with three worked examples and the migration reader on it. The whole-tree AST policies
move onto it with a token filter (only a file that spells the shape is parsed): done in the tree, not yet committed:
sign-out-scope, bare-login, client-form, adopt-typed-value, refresh-then-write, history-state (4.1 s -> 0.1 s),
use-hydrated-one-home, layer-is-up, media-cost, no-em-dash, jsx-text-escape, jsx-text-space, type-ladder,
single-source. Left of mine: stored-copies, row-cap, lazy-sdk, help-ui-labels, send-kinds, gallery, not-found,
dynamic-params, the two prefetch policies. The other 86 walker files (`_scratch/test-slim/b1..b4.txt`) are with four
helpers (reports land in `_scratch/test-slim/helpers/report-b*.md`). Then the guard
(`_scratch/test-slim/walk-policy.test.ts.pending` -> `src/testing/walk-policy.test.ts`), the gate, coverage diff, commit.

**Left after step 1:** tables (88 same-file groups that differ only in literals, `_scratch/test-slim/dupes.txt`), copy
pins pointed at their homes, DOM-free component files moved to node, the rule paragraph for testing-verification.md
under the Handoff, three timed runs and the final coverage diff.

