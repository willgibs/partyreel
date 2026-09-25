---
track: crumbs
status: handed-off            # open -> handed-off; deleted in the merge commit that integrates it
cut: "e08cc3e0"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/globals.css
  - src/lib/shared/use-reveal-acts
  - src/components/dev/
  - src/components/ui/drawer
  - src/app/(dev)/design/(shell)/library/components/gallery-demos.tsx
  - src/app/(dev)/design/(shell)/library/foundations/radius-ladder.tsx
  - src/app/(dev)/design/(shell)/lab/tools/motion/
  - src/components/guest/report-dialog
  - src/components/guest/upload/intent-sheet
  - src/components/guest/guest-header
  - src/components/guest/password-gate
  - src/app/(dev)/design/sandbox/voice-guest/
  - src/lib/auth/code-length
  - src/components/auth/email-sign-in
  - src/components/app/account-delete-card
  - src/app/(app)/account/email-change
  - src/components/guest/entry-modal.test.tsx
  - docs/systems/design-system.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/ROADMAP.md
  - docs/systems/guest-flow.md
---

# lp/crumbs

**Goal.** Clear tonight's crumbs: the small, exactly named leftovers the night's lanes deferred to the ROADMAP, each one line there, each finished and its line retired, so nothing a lane noticed is left lying around.

## The brief

Each item is a line in `docs/ROADMAP.md` "Now". Finish each one and name the line in your Handoff, and the Orchestrator retires it.

1. **The Studio's reveal leftovers**, unreferenced now: `globals.css`'s `--tune-rvl-*` and `--tune-rxp-*` block and its `[data-rvl-*]` rules, `src/lib/shared/use-reveal-acts.ts` with its test, and the comments naming `reveal-constants.ts` (in `globals.css`, `src/components/dev/motion-tuner-config.ts` and `design-system.md`). Keep whatever the dev motion tuner still reads for another surface.
2. **Retire vaul:** `src/components/ui/drawer.tsx` is drawn only by the Library's gallery demos since the door moved onto the responsive Sheet. Remove the demo's entry, the file and the dependency (`pnpm remove vaul`), and let the lockfile follow.
3. **Stale comments:** `report-dialog.tsx` and `upload/intent-sheet.tsx` still call the responsive Sheet unproven under a keyboard (it is keyboard-safe now: `design-system.md`, the floating layer), and `guest-header.tsx:147` names the retired `<EnterEventPrompt>`.
4. **The `voice-guest` board quotes the door with `data-entry-drawer`**, so its welcome frame lost the 55svh presence (`door.css` keys on `data-entry-sheet`). Fix the board's quote only.
5. **`password-gate.tsx`'s Unlock** wears `floatingKeyboardFoot` with `data-sheet-primary`, as the door's other steps do, so its primary sticks while typing.
6. **The six-digit code length** lives in three files (`email-sign-in.tsx`, `account-delete-card.tsx`, `email-change.ts`'s `EMAIL_CODE_LENGTH`), each in lockstep with the Supabase dashboard. Make it one export, `src/lib/auth/code-length.ts`.
7. **Tests:** the Radix FocusScope teardown flush that `entry-modal.test.tsx` runs in its own `afterEach` moves into `vitest.setup.ts`, for every component test that unmounts a Radix dialog.

`album-guest-wiring` and `album-host-wiring` are running beside you and own the album's files; touch none of them. `design-system.md` is yours for item 1's comment only.

**Three root files are exceptions decided in advance**: a manifest cannot own a one-segment path. For items 2 and 7, edit `package.json`, `pnpm-lock.yaml` (through `pnpm remove vaul` only) and `vitest.setup.ts` (the flush only), and list them in your Handoff's lane check.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` whole; `git grep` finds no `vaul`, `use-reveal-acts`, `--tune-rvl-` or `EnterEventPrompt` left; the Library's gallery and the `voice-guest` board render.

## Questions (a recommended answer each; the Orchestrator relays them)

- none yet

## System-doc edits (in place, owned facts only)

- `docs/systems/design-system.md` (item 1): the "three places" comment for a baked motion value no longer names
  `reel/reveal-constants.ts` (deleted before this lane, in `1352aba3`); it names the JS fallback that actually
  exists today, `use-review-triage.ts`'s `readCssMs`.

## Deferred (ROADMAP one-liners, bucket named)

- none

## Handoff (replaces the chat report)

- This is a resume: the first agent died mid-work at 09:09 ET (2026-09-25, the Orchestrator's usage limit); I picked
  up the worktree as it stood on `lp/crumbs` at `bf2bc846` and finished from there. No reset, no rebase.
- 8 work commits, no sync commit needed: `origin/launch-prep` moved only by one Orchestrator record commit
  (`d0393bfd`, `[skip ci]`) since this lane's cut (`e08cc3e0`) — PROGRAM.md's Sync rule: "Record commits ... never
  need one." Pushed to `origin/lp/crumbs`; head is in the chat line.
- Commits (all `crumbs: ...`, each one item): `564f061e` item 1, `7396f936` item 2, `774ba5e2` item 3, `8260e6b6`
  item 4, `62f14c49` item 5, `85517fa7` item 6, `63aa49b6` item 7, `334ef994` an item-2 follow-up (see below).
- Gates, all green on `334ef994`: `pnpm typecheck` (exit 0), `pnpm lint` (exit 0, 6 pre-existing warnings in files
  this lane never touched — `review-session.tsx`, `home-hero/shared.tsx`, `contact-form.tsx`, `album-fill-grid.tsx`,
  `review-switch.tsx` — none mine), `pnpm test` (exit 0, 479 files / 5308 tests), `zsh scripts/build-lock.sh pnpm
  build` (exit 0, "Compiled successfully"), `pnpm lab:smoke --base http://localhost:3135` (273 checks, 0 failing;
  the one 500 is `/design/lab/tools/boom`, the script's own allow-listed boundary probe).
  - `pnpm test` first failed on `63aa49b6`: `specimens.test.ts` pinned `specimens.generated.json`
    (`src/app/(dev)/design/gallery/`) against the drawer demo item 2 removed. It is derived output of
    `gallery-demos.tsx` (`node .../collect-specimens.mjs`, named in the test's own failure message), not a manual
    edit; regenerated in `334ef994`, diff is exactly the drawer entry leaving. Outside owns by literal prefix
    (`gallery/`, not `library/components/`); listed here as the lane check's fifth exception.
  - `board: none`, so `pnpm lab:demo` was never a gate requirement here; item 4's fix is verified by a full static
    trace (door.css's `[data-entry-sheet] [data-welcome-step]` selector, `data-welcome-step` already on the right
    element in `parts.tsx`, both `scene.tsx` and `board.tsx`'s selector now matching) plus the green gate above, not
    by a live hydrated-DOM check — this session's tools are `pnpm lab:smoke` and `curl` only (no browser), and a
    curl of the rendered page shows nothing board-specific either way (the stage mounts client-side; the Library
    gallery's own specimens, e.g. "popover" x52, DO show in the same kind of fetch, so this isn't a broken method,
    just a page this method can't see into). No test covers this board at all (`find .../voice-guest -iname
    "*.test.*"` is empty) — worth a real browser's ten seconds before anyone trusts it further.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` is this lane's 18 owned paths plus 5 exceptions:
  `package.json`, `pnpm-lock.yaml` (item 2, `pnpm remove vaul`, pre-approved), `vitest.setup.ts` (item 7, the flush
  only, pre-approved), `src/app/(dev)/design/gallery/specimens.generated.json` (item 2's derived-artifact
  follow-up, above), `src/components/ui/floating-layer.ts` (predecessor's fix, kept rather than reverted: its
  comment claimed "`drawer.tsx` is NOT retired," which item 2 made false; the resume brief listed keep-or-revert as
  my call).
- The items — name these ROADMAP "Now" lines so they can retire:
  1. The Studio's reveal leftovers (globals.css's `--tune-rvl-*`/`--tune-rxp-*` bake, `[data-rvl-*]`,
     `use-reveal-acts.ts` + test, the `reveal-constants.ts` comments) — done, `564f061e`.
  2. Retire vaul (`drawer.tsx`, its gallery demo, `pnpm remove vaul`) — done, `7396f936` (+ `334ef994` follow-up).
  3. Stale comments (`report-dialog.tsx`, `upload/intent-sheet.tsx`, `guest-header.tsx:147`'s `<EnterEventPrompt>`)
     — done, `774ba5e2`.
  4. The `voice-guest` board's `data-entry-drawer` quote (door.css keys on `data-entry-sheet`) — done, `8260e6b6`.
  5. `password-gate.tsx`'s Unlock wears `floatingKeyboardFoot` + `data-sheet-primary` — done, `62f14c49`.
  6. The six-digit code length, one export (`src/lib/auth/code-length.ts`) — done, `85517fa7`.
  7. The Radix FocusScope teardown flush moved into `vitest.setup.ts`, global for every component test — done,
     `63aa49b6`.
- Assets requested from Will: none
- Board ideas: none
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Calls his to overrule, one line each:
  - Kept `floating-layer.ts`'s corrected comment (drawer.tsx's retirement made the old line false) rather than
    reverting it outside this lane's owns; the fix is one clause, in the reason above.
  - `EMAIL_CODE_LENGTH` (email-change.ts) now re-exports the shared `CODE_LENGTH` under its old name rather than
    every importer switching to the new one, so `email-actions.ts` and `email-section.tsx` (outside this lane's
    owns) needed no edit. A future lane touching either is free to import `CODE_LENGTH` directly and drop the alias.
- Look at first: item 4 (the `voice-guest` board) — the only piece this session's tools could not see rendered;
  everything else is either behavior-pinned by the green test suite or a comment/derived-artifact correction.
