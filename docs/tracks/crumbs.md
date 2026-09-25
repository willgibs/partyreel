---
track: crumbs
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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
