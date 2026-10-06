---
track: test-slim
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
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

- **`pool: "threads"` in `vitest.config.ts`** (one line under `test:`, the brief's named exception; NOT built, since
  the config is outside this lane's owns). Measured on the lane's tree: 63.3 / 62.6 s (CPU 733 / 735 s) against
  68.8 / 69.9 / 69.9 s (CPU 776 s on average) for the default forks, about 9% off the wall, every test green in each
  run; on the untouched tree 69.6 s against 82.7 to 87.5 s. Recommended: adopt it; the Orchestrator's merge gate is
  the first to gain, and a flake it brings shows in that gate first.
- **`isolate: false`** cut a run to 31.6 s (CPU 268 s against 865 s) but 51 files fail (19 unit, 32 component), each
  leaking a module mock or module state into the next file in its worker. Recommended: not now; isolation is itself
  a guarantee, so a lane makes those 51 hermetic first (a Deferred line).
- **`experimental.fsModuleCache`**: 79.9 s warm against 81.9 s cold (transform 60 s to 13 s). Recommended: leave it
  while it is experimental; the gain is the transform alone.
- **A coverage provider** (`@vitest/coverage-v8@4.1.7` as a devDependency, a `test:coverage` script carrying the
  flags of `_scratch/test-slim/tools/coverage.sh`): this lane's per-directory proof ran on a copy linked from
  scratch, `package.json` being a read here. Recommended: add it, so the next slim, or any lane that deletes a test,
  proves itself in one command.

## System-doc edits (in place, owned facts only)

- None made in the lane (scratch-synthesis holds the systems docs). Proposed for `docs/systems/testing-verification.md`,
  a section "What a test must earn", one paragraph:

  > **What a new test must earn, so the suite stays lean round over round.** A behaviour is pinned once, at the layer
  > that owns it: a validator's rule in its own unit test, not again in the route and the component that call it, and
  > a component test asserts what the component does (attributes, callbacks, payloads), never the output of a pure
  > function it could import and call. The inputs of one rule are one table (`it.each`), never copies of one `it`.
  > Copy is asserted against its home (import the constant or the copy function), so a voice round changes words
  > without touching tests; a string is typed out only where its exact wording is the guarantee. A test that reads
  > the repository as data lists through `@/testing/source-tree` (`walk-policy.test.ts` refuses its own
  > `readdirSync`) and parses only the files a token filter keeps. The cost is per file, not per test (a jsdom window
  > and the RTL setup for each `.test.tsx`, about a second of a core inside a full run, against 14 s for all 9,500
  > tests that run under 10 ms each), so a `.test.tsx` earns its file by rendering, and a Server Component's test is a
  > node `.test.ts`.

## Deferred (ROADMAP one-liners, bucket named)

- Testing: make the 51 files that leak under `--no-isolate` hermetic, then `isolate: false` for the unit project
  (31.6 s against 85 s measured; test-slim's Questions).
- Testing: a deterministic frame test for trail.tsx:300's empty slot (its arm rides the animation clock: 78, 468, 3
  and 0 hits in four full runs), so a per-directory coverage proof is exact run to run.
- Testing: the next slim's kinds, measured and left: 327 copy pins (a 24-character literal asserted in a test and held
  verbatim in exactly one production file, 141 files; `_scratch/test-slim/copypins.txt`), 88 same-file runs of
  `it`s that differ only in literals (`_scratch/test-slim/dupes.txt`), and the SQL guards' own "latest definition"
  parsers folded onto `liveFunction()`.

## Handoff (replaces the chat report)

- Commits on `lp/test-slim`: `68ca2209b` (the one walk, three worked examples), `859a3b532` (every reader of the
  repository on it, the token-filtered policies, the guard), `145740a9a` (seven DOM-free tests to node), `f28ab8f0f`
  (the carry's clock arm pinned), and this manifest. launch-prep moved only by two record commits since the cut
  (`2634388a8`), so no sync.
- Gates on `f28ab8f0f`, each on its own exit code: typecheck 0, lint 0, test 0 (1,053 files, 13,164
  tests). No build and no lab:smoke: no production file changed, and no lab file but tests.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = test files and test helpers under `src/` (owned) + this
  file; no production file, no config, no exception.
- Before -> after, three interleaved full runs each on this machine (the baseline tree in a detached worktree at
  `2634388a8`, same load, `_scratch/test-slim/ab-forks.txt`): wall 71.3 / 71.3 / 71.7 s (71.4 on average) ->
  68.8 / 69.9 / 69.9 s (69.5, -2.7%); CPU (user+sys) 805 / 805 / 811 s (807) -> 771 / 767 / 790 s (776, -3.8%).
  Files 1,052 -> 1,053 (unit 672 -> 680, component 380 -> 373: the guard added, seven moved); tests 13,161 -> 13,164;
  test code 258,477 -> 257,924 lines (plus the 153-line walk). Per file, every count and title equals the baseline's
  (`tools/counts.mjs`), but for the guard's two tests and the carry's one.
- Coverage (lines / branches / functions): 70.68 / 66.16 / 65.78% before and after (`_scratch/test-slim/covdiff-final.txt`):
  40,705 lines and 10,472 functions as before; branches 32,683 against 32,684, every directory's as before but one
  branch that rides a clock. Two did:
  album-wire-carry.ts:225 (the route's arm of a clock comparison, reached only by another file's timing; no test the
  lane touched executes the module), now pinned by a test of its own (`f28ab8f0f`); and trail.tsx:300 (an animation
  frame's empty slot, hit 78, 468, 3 and 0 times in four full runs, the first two on the baseline tree), left as the
  noise it is, with a Deferred line.
- The items:
  - `src/testing/source-tree.ts`: one walk of the repository (filesUnder / entries / sources / read / syntax), read
    once per test file, throwing on an empty repository folder, never entering node_modules / .next / .git.
  - 113 test files and the migration reader moved onto it; four helpers' per-file before/after titles and
    old-walker vs new-walker set comparisons are in `_scratch/test-slim/helpers/` (every set identical).
  - The whole-tree policies parse only files that spell their shape (history-state 4.14 -> 0.27 s, layer-is-up 2.84 ->
    0.54, sign-out 2.07 -> 0.31, media-cost 1.87 -> 0.43, bare-login 1.78 -> 0.31, use-hydrated 1.75 -> 0.30 s); each
    fails on its shape planted in a file that spelled none of its words (`_scratch/test-slim/tools/mutate.sh`: 14 of 14).
  - `src/testing/walk-policy.test.ts`: the guard that keeps it so.
  - Seven tests that render nothing moved from jsdom to node.
- Honestly sized: the suite's cost is per file (jsdom, imports), not per test, so this slim is about 4% of CPU; the
  levers that move it further are the Questions (threads now, isolation after a hermetic lane).
- Assets requested from Will: none.
- Board ideas: none.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none (`package.json`: the coverage devDependency, under
  Questions).
- Calls his to overrule: the four Questions.
- Look at first: `src/testing/source-tree.ts`, `src/testing/walk-policy.test.ts`, then one filtered policy
  (`src/lib/history-state-policy.test.ts`).

## Where I am

Handed off: nothing of the lane is left undone in the tree. To reproduce from scratch
(`../partyreel-wt/_scratch/test-slim/`): `BASELINE.md` (every number above, with the runs it came from),
`tools/ab.sh` (interleaved timing against a detached worktree of the baseline), `tools/coverage.sh` + `tools/covdiff.mjs`
(the coverage run and its per-directory, per-line diff; the provider is linked into `node_modules/@vitest/coverage-v8`
from `cov/`, `package.json` untouched), `tools/counts.mjs` (per-file counts and titles against the baseline),
`tools/mutate.sh` (each filtered policy against its planted shape), `tools/copypins.mjs` and `tools/dupes.mjs` (the
next slim's two censuses).

