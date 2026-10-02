---
track: crumbs-48
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "f4b045b3"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/(shell)/library/page.tsx
  - src/app/(dev)/design/(shell)/library/index-list
  - src/components/social/relation-toggle.test.tsx
  - src/components/guest/password-gate.test.tsx
  - src/components/shared/not-found-screen.tsx
  - content/help/how-guests-join-and-upload.mdx
  - content/help/create-your-first-event.mdx
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/guest-flow.md
  - src/components/guest/door/
  - src/components/app/create-event-wizard.tsx
  - src/components/guest/password-gate.tsx
  - src/components/social/relation-toggle.tsx
  - src/components/lab/step.tsx
---

# lp/crumbs-48

**Goal.** Five ROADMAP crumbs from the night's lanes, none on a surface a waiting board draws: the Library's own links stop prefetching, two load-flaky tests steadied with their intent kept, two help articles brought up to the doorway and the wizard as built, and a stale comment.

## The brief

Each item is a ROADMAP Now line; read it there whole and name each in your Handoff for the record. Seven boards wait on Will's desk: touch nothing they draw (the files below are checked clear of every board's `lives`).

1. **The Library's links** (ROADMAP: "The lab: the Library's own links prefetch by default"): `library/page.tsx` (twice) and `library/index-list.tsx` take `prefetch={false}`, as `LabLink` and the step page's links have since `lab-prefetch`, so a Library index visit stops sending about 226 keyed prefetches.
2. **Two tests that flake under load:**
   - `src/components/social/relation-toggle.test.tsx`'s "every other flip acts at once" (no call to the follow spy at 1,048 ms in a loaded full run);
   - `src/components/guest/password-gate.test.tsx`'s "a stalled hold turns the button into Retry" (no "Open the album" button found in a loaded run).

   Both pass alone. Steady each with fake timers or a wait that matches what it waits for, keeping exactly what each asserts. Prove it by running each 20 times under load, with a build running beside it through `zsh scripts/build-lock.sh`, all green.
3. **Help: `how-guests-join-and-upload.mdx`** (ROADMAP: "still says one sheet over the blurred album"). Since door-wiring, the welcome, the ask and the wait are the doorway's page, and the waiting door has a photo chooser. Read `guest-flow.md` and `src/components/guest/door/`, and say what a guest sees now, in the help's voice.
4. **Help: `create-your-first-event.mdx`** (ROADMAP: "still names the wizard's steps Details, Design and Share"). They are Name, Style and the beat with Get it ready since ready-wiring; its Step 3 paragraph is current.
5. **`shared/not-found-screen.tsx`'s head comment** (ROADMAP: "counts the guest's bad-link 404 and its private lock among its call sites"). Both wear the doorway now. Change the comment only.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:3131` (the Library); the two tests 20 times each under a concurrent build, all green; the two help pages read at 1440 and 375 in a headless Chrome of your own.

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
