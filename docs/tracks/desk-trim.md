---
track: desk-trim
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "7e99254c"            # the launch-prep SHA the branch was cut from
board: export-flow
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/export-flow/
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/components/app/export/export-dialog.tsx
  - src/components/ui/responsive-menu.tsx
---

# lp/desk-trim

**Goal.** Retire `export-flow`'s `object` ask ("Should Download open a sheet of bundles, or simply start?"), which Will's `popups` answer settled (`choices=menu`, a row is the act, now built), every other ask on the board kept.

## The brief

Will's `popups` r1 answer `choices=menu` ("A menu at the button, rows at the foot ... a row is the act"; the board retired with its wiring, merge `3e7952e3`, `git show 3e7952e3 --format=%B`) is built: Download is a responsive menu whose row starts its bundle at once (`src/components/app/export/export-dialog.tsx` on `src/components/ui/responsive-menu.tsx`). That is `export-flow`'s open `object` ask answered with its own `menu` option, so the ask leaves the board (docs/PROGRAM.md: "only a question already solved at its best is removed"; his answer on the general kind decided this instance). Remove it from `spec.ts` with the drawings and fixtures only it used; every other ask (`means`, `wait`, `stuck`, `hollow`, and the rest) stays exactly as it is, and any drawing that showed the old dialog as "today" now shows production's menu. Its `touchpoints.ts` row is yours (only its asks and lives; nothing else in that file). Verify: the board at 1440 and 375, `pnpm lab:smoke` whole, `pnpm lab:demo --board export-flow` pressing every remaining step.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The board at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke --base http://localhost:<port>` whole; `pnpm lab:demo --board <board> --base http://localhost:<port>` pressing every step.

## Questions (a recommended answer each; the Orchestrator relays them)

- none yet

## System-doc edits (in place, owned facts only)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- **Commits, pushed on `lp/desk-trim`** (base `ce0edd9f`, the `origin/launch-prep` tip at boot): `e05cecb3` the
  work (`object` retired from `spec.ts` with its own drawings and CSS, `phone` unstaged and re-grounded, `Ground`'s
  now-dead `door` prop dropped, `touchpoints.ts`'s `asks` line trimmed); `e9f3ae92` the sync (merge of
  `origin/launch-prep` at `075de093`, door-r3-wiring's retirement of `identity-door`, which also touched
  `touchpoints.ts`; auto-merged clean, no conflict markers). The head is in the chat line.
- Every claim below names its artifact (a commit, a log line, a path), so the Orchestrator checks rather than believes.
- **Gates on the synced tree at `e9f3ae92`**, each its own exit code, logs in `../partyreel-wt/_scratch/desk-trim/`:
  `pnpm typecheck` 0 (`typecheck.log`); `pnpm lint` 0 (`lint.log`: 0 errors, the 5 standing warnings, none in a
  touched file); `pnpm test` (`test.log`, `test-rerun1.log`, `test-rerun2.log`): 506 files, 5664 tests, every run —
  the first and third runs each logged 2 and 1 "unhandled errors" from an `input-otp` timer firing after
  `email-section.test.tsx`'s jsdom window tears down (`ReferenceError: window is not defined` inside
  `react-dom-client.development.js`'s `resolveUpdatePriority`), the same hygiene flake door-r3-wiring's merge hit
  (`075de093`'s own message); `email-section.test.tsx` alone, 5 runs, 7/7 tests clean every time, so it is unrelated
  to this change and logged as a hygiene line, not a red; `zsh scripts/build-lock.sh pnpm build` 0 (`build.log`);
  `pnpm lab:smoke --base http://localhost:3133` 0 (`lab-smoke.log`: 245 checks, 0 failing — 247 pre-sync, minus
  identity-door's retired routes); `pnpm lab:demo --board export-flow --base http://localhost:3133` 0
  (`lab-demo.log`: 6 steps — means, wait, stuck, hollow, cap, phone — 0 failing, `phone`'s three options still move
  the stage by up to 24.19% with the `object` dependency gone).
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): owned paths
  (`export-flow/spec.ts`, `board.tsx`, `export-flow.css`) plus one exception the manifest itself grants,
  `src/app/(dev)/design/touchpoints.ts` ("Its `touchpoints.ts` row is yours: only its `asks` and `lives`"; only
  `asks` needed a change), plus this file.
- **The items:**
  - `export-flow`'s `object` ask ("Should Download open a sheet of bundles, or simply start?") is deleted from
    `spec.ts`'s `asks`, with the drawings and CSS only it used: `ObjectScreen`, `MenuDoor`, the `objectRead`
    reader, the `ObjectShape`/`objectOf`/`OBJECT_CAPTION` types in `board.tsx`, and the `.xf-menu` rule (with its
    comment) in `export-flow.css`. Every other ask (`means`, `wait`, `stuck`, `hollow`, `cap`, `phone`) keeps its
    own question, options, recommendation and drawing untouched.
  - `phone` read `object`'s answer to decide whether its `both` option jumped straight to the OS share sheet
    (only when `object=straight` left no dialog for its second button, "or the zip, to Files"). `object` is
    retired and settled on `menu` (built: `export-dialog.tsx` on `ui/responsive-menu.tsx`, which is always a
    surface), so that branch can never fire again: `phone` no longer stages `after: { ask: "object" }`, and
    `toShareSheet` in `board.tsx`'s `PhoneScreen` drops to `shape === "batch"` alone. Verified this changes no
    default-rendered pixel (the cross-ask state it depended on was reachable only by hand-setting a dock control
    that no longer exists): `lab-demo.log` shows `phone`'s three options still visibly differ.
  - `Ground` (`board.tsx`)'s `door` prop existed only for `object=menu`'s own anchored popover (its own comment
    said so) and nothing else ever passed it; removed along with the pass-through to `GuestAlbum`'s `row` and
    `HostGallery`'s `action`, which fall back to their real default triggers exactly as before.
  - `spec.ts`'s round-history comment block gains one dated paragraph recording the retirement (mirroring how the
    `chips` ask's removal was recorded in the identity/reel recheck, `3d5e01c8`) and the "seven of decisions"
    count corrected to six; `board.tsx`'s "staged decisions" comment drops `phone` from the list it no longer
    belongs to.
  - `touchpoints.ts`'s `export-flow` row: `asks` drops "keeping the album,"; `lives`, `why`, `board.note` and
    `board.variants` untouched (out of the manifest's grant, and already independently stale — see Board ideas).
- **Assets requested from Will:** none.
- **Board ideas:** `board.tsx`'s and `export-flow.css`'s own framing ("The shipped export dialog is still a
  centred `Dialog`... the swap is the wiring lane's") is now stale — production's real surface is the menu
  `popups-wiring` built, not a centred `Dialog` — but it grounds `means`/`wait`/`stuck`/`hollow`/`cap`, which this
  lane's brief kept exactly as they are, so I left it rather than rewrite the shared framing under a narrow
  brief. A future round on this board could reconcile those five asks' own hand-drawn "one responsive sheet" with
  what actually shipped (a menu, not a sheet), or judge them content-only regardless of chrome. Separately,
  `touchpoints.ts`'s `export-flow.board.note` and `.variants` are already stale independent of this change (the
  note still says "Eight decisions" and names "what a teaser's third chip does", from before `chips` was removed
  in `3d5e01c8`; `variants` lists 5 of the board's 6 remaining asks, missing "A zip with nothing in it") — outside
  this manifest's grant (`asks` and `lives` only), so left alone.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none.
- **Calls his to overrule:** leaving `board.tsx`'s and `export-flow.css`'s stale "still a centred `Dialog`"
  framing in place rather than correcting it to "menu" (see Board ideas above) — overrule if it should read
  accurately now regardless of the brief's narrow scope.
- **Look at first:** `src/app/(dev)/design/sandbox/export-flow/spec.ts`'s new "`object` RETIRES" paragraph, then
  `board.tsx`'s `PhoneScreen` (the one drawing that read the retired ask's answer).
