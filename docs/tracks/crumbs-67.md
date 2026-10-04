---
track: crumbs-67
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "04897812"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/app/dashboard/grace-banner.test.tsx
  - src/components/app/event-feed/review-room-hub.test.tsx
reads:                  # single-sources you depend on: never duplicate, never edit
  - CLAUDE.md
---

# lp/crumbs-67

**Goal.** Two jsdom tests that fail only on a loaded machine wait on what they mean, never on time, so the merge gate stops crying wolf.

## The brief

**Why:** two tests failed today only while other lanes built and measured on the same machine. Each passed alone and on a re-run:
- `src/components/app/dashboard/grace-banner.test.tsx`: "★ opens the size list counting down to her own plan's cap";
- `src/components/app/event-feed/review-room-hub.test.tsx`: "reads its panel as its page: an arrow from the panel itself puts the cursor on the first tile" (`expected null to be 'a'`).

A flaky gate costs a re-run and a judgement every merge.

**The work:** find why each depends on timing (a fixed timeout, a focus that lands a tick later, a timer the test doesn't control) and make it wait on the state it means. Use `findBy`/`waitFor` on the observable result, fake timers advanced by the test, or focus awaited the way the component sets it. Keep each test's assertion and its ★ scar; change only how it waits. If the component itself has a race a user could hit, write it as a Question (that is a product bug, not a test fix) and leave the component alone.

**Prove it:**
- each file passes 30 times in a row under load: `for i in $(seq 30); do npx vitest run <file> || break; done` while `pnpm build` runs through the build lock in another shell;
- then the whole gate.

Nothing of yours requests Vercel. Work economically, with no helper agents.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- **Is either flake a race a user could hit? Recommended: no, so nothing for either component.** The room's keys are a
  `document` listener `useReviewKeys` attaches in a passive effect, so on a loaded machine its tiles can stand one tick before
  anyone listens: no keypress lands in that tick, and every key after it is heard. The strip's 300 ms is React's Suspense
  throttle on a lazy body, the same for any lazy body. Both components are untouched.

## System-doc edits (in place, owned facts only)

- none (the lane owns no doc; each wait says its why in its test)

## Deferred (ROADMAP one-liners, bucket named)

- Now: Tests: `storage-list.test.tsx` opens the same lazy `storage-list-body` inside a `waitFor`'s default second, so it
  shares `grace-banner.test.tsx`'s old exposure (not flaked yet; not this lane's file): preload it in a `beforeAll` as
  `grace-banner.test.tsx` now does.

## Handoff (replaces the chat report)

Scratch (every log named below): `../partyreel-wt/_scratch/crumbs-67/`.

- **Commits**, on `origin/lp/crumbs-67`: `4cddcba0e` (the two fixes), `7b64d43e0` (a comment states the chunk's cold import as
  measured), then this manifest alone (the head is in the chat line). launch-prep moved since the base (`1bc23c157`:
  compute-uploads' merge, the crumbs-68 cut and their records: the upload routes, `use-upload-queue`, `host-upload` and their
  tests); none of it touches the two tests, the components they drive (`storage-list*`, `review-*`, `host-album`, `popup`,
  `layer-is-up`) or CLAUDE.md, so there is no sync commit (PROGRAM "Sync").
- **Gates**, each on its own exit code, on `7b64d43e0`: `zsh scripts/build-lock.sh pnpm typecheck` 0 (`gate-typecheck.log`),
  `pnpm lint` 0, no warnings (`gate-lint.log`), `zsh scripts/build-lock.sh pnpm test` 0, 909 files and 11,162 tests
  (`gate-test.log`), `zsh scripts/build-lock.sh pnpm build` 0 (`gate-build.log`). `lab:smoke` and `lab:demo` not run: nothing
  under `src/` but two tests changed, and the lane has no board.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): the two owned test files and this file, no exception.
- **The items**
  1. `grace-banner.test.tsx`, the cause: the door opens `StorageList`'s body, a `lazy(() => import(...))` chunk
     (`storage-list.tsx`), and its cold import (256 to 269 ms alone, measured) ran inside the `waitFor` for the strip, whose
     default budget is 1,000 ms, so a machine about four times slower fails it. Now
     `beforeAll(() => import("@/components/app/storage/storage-list-body"))` pays it under the hook's own 10 s; the
     assertions and the ★ are untouched. What is left in the strip's wait is React's own reveal of a lazy body 300 ms after
     its skeleton (the strip stands at about 300 ms with the chunk warm, measured), a floor that never scales with load.
  2. `review-room-hub.test.tsx`, the cause: `ReviewRoomFromHub` mounts the room once its queue is read, outside `render`'s act,
     and the room's keys are a `document` keydown listener `useReviewKeys` attaches in a passive effect, so the tiles can
     stand a tick before anyone listens; the test pressed the arrow the instant `waitFor` saw them, and `expected null to be
     'a'` is a press landing on nobody. Now `arrowFromPanel` presses the arrow from the panel until the room answers (each
     press targets the panel itself, so a repeat is the same press); the pin's own `toBe("a")` and `toBe("b")` stay outside
     the loop.
  3. Beyond the named test, same describe: "still leaves every key to a confirm standing over its panel" asserts silence, so
     it passed vacuously whenever the room was not yet listening; it now hears the room answer once first, so its silence is
     the confirm's.
  4. ROADMAP's Now line "Tests: two jsdom timing tests fail only on a loaded machine" is this lane's: the Orchestrator
     deletes it in the merge record.
- **Proof under load.** The brief's loop: each file 30 of 30 green, both at once, while `build-loop.sh` ran five production
  builds back to back through the build lock (all exit 0, `build-load.log`); every run logged `build-lock-held=yes` and a
  one-minute load of 11.5 to 18 on 14 cores (`loop-grace-2.log`, `loop-hub-2.log`). That loop cannot tell fixed from unfixed
  here: the unfixed originals also went 30 of 30 under the same load (`loop-grace-orig.log`, `loop-hub-orig.log`; the brief's
  flakes came while several lanes built and measured at once, a heavier load than one lane's builds). So the discriminating proof is each cause forced, in diagnostic copies kept
  in `diag/` and never committed: the hub test with a 4 ms stall queued right after its tiles land fails unfixed 3 of 3 with
  `expected null to be 'a'` and passes fixed 5 of 5 across its 7 tests (`zz-diag-hub-orig.test.tsx`,
  `zz-diag-hub-real.test.tsx`); the same copy with `layerIsUp` stubbed to false fails the hardened confirm test
  (`zz-diag-hub-guard.test.tsx`), so its scar still bites; the grace test with the chunk's factory delayed fails unfixed at
  1.5 s (`expected null to be truthy` after 1,127 ms) and passes fixed even at 4 s (`zz-diag-grace.test.tsx`,
  `zz-diag-grace3.test.tsx`). No artificial load was made (a busy-loop script was refused by the permission classifier,
  rightly: other lanes share the machine); the load is the brief's builds.
- Assets requested from Will: none
- Board ideas: none (when a third test of this class flakes, a lazy chunk under a `waitFor` or a late-mounted listener pressed
  at once, it earns a line in `testing-verification.md`; two have not yet)
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Calls his to overrule: the chunk is preloaded in a `beforeAll` rather than given a longer `waitFor` timeout (a longer one
  still races the machine; the preload removes the load-scaled cost); the press repeats inside a `waitFor` rather than
  `await act(async () => {})` after the tiles, which also passed the forced stall but leans on Node running React's pending
  `setImmediate` before act's own; the confirm test got the same wait though it was never red.
- Look at first: `git diff 1bc23c157 7b64d43e0 -- src/components/app/dashboard/grace-banner.test.tsx
  src/components/app/event-feed/review-room-hub.test.tsx` (about 35 lines): the two WHY comments say each cause.
