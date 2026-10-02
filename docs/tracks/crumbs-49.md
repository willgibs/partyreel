---
track: crumbs-49
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "16f85a7f"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - content/help/messages-guests-might-see.mdx
  - content/help/require-verified-emails-explained.mdx
  - content/help/what-guests-can-and-cant-see.mdx
  - src/components/shared/route-error.tsx
  - src/app/(dev)/design/gallery/gallery-ui.tsx
  - src/app/(dev)/design/(shell)/_shell/prefetch-policy.test.ts
  - src/lib/history-entry.test.tsx
  - src/lib/utils.test.ts
  - src/lib/test-utils/german-runtime
  - src/lib/content/help-ui-labels.test.ts
  - src/app/(guest)/u/[slug]/owner-mode.test.ts
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/guest-flow.md
  - src/components/guest/door/
  - src/components/shared/not-found-screen.tsx
  - src/app/(dev)/design/(shell)/library/
  - src/lib/history-entry.ts
  - src/app/(guest)/u/[slug]/owner-sections.tsx
---

# lp/crumbs-49

**Goal.** Seven more off-board crumbs from the ROADMAP's Now list: three help articles brought to the doorway, a stale comment, the Library held by the prefetch policy (and the gallery's title link), a load-flaky history test, one German-runtime helper instead of two, the help-label test's source scan, and the owner-mode reader list.

## The brief

Each item is a ROADMAP Now line; read it there whole and name each in your Handoff for the record. Seven boards wait on Will's desk: touch nothing they draw (every file below is checked clear of every board's `lives`).

1. **Help** (ROADMAP: "`messages-guests-might-see.mdx` (\"The sheet says the host will let you in\")…"): the three articles still draw the door as it was before `door-wiring`. Read `guest-flow.md` and `src/components/guest/door/`, and say what a guest meets now: the doorway's page, the ask, the held door and its chooser. Keep the privacy exactly as built: the doors the host answers name her, a password door names the album, a shut door names nothing.
2. **Code hygiene** (ROADMAP: "`shared/route-error.tsx`'s comment counts `NotFoundScreen`'s 404s as six…"): say it as `not-found-screen.tsx`'s head now does, with no number.
3. **The lab** (ROADMAP: "`_shell/prefetch-policy.test.ts` scans the shell, the lab's pages and the kit but not the Library…"): the policy scans the Library too. Fix `gallery/gallery-ui.tsx`'s `EntryBlock` title link, and anything else the widened scan finds, to `prefetch={false}`.
4. **Tests** (ROADMAP: "`history-entry.test.tsx`'s \"lets go of the flag when the Back has landed\" failed once…"): steady it with its assertion kept. Prove it 20 times under a concurrent build, all green.
5. **Code hygiene** (ROADMAP: "`utils.test.ts`'s inline German-runtime helper … are one simulation twice"): one helper, both tests on it.
6. **Tests** (ROADMAP: "`help-ui-labels.test.ts` reads `src/app/(dev)/` as shipped source…"): the label check reads shipped source only, so a lab board quoting a retired string can no longer mask a stale help label. Name what it caught, if anything.
7. **Tests** (ROADMAP: "`owner-mode.test.ts`'s allowed-reader list could name `listEvents`"): name it, so the regexes hold the owner-RLS read `owner-sections.tsx` makes.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:3133` (the Library and the gallery); the history test 20 times under a concurrent build, all green; the three help pages read at 1440 and 375 in a headless Chrome of your own.

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
