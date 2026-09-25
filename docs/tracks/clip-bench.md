---
track: clip-bench
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "242e0bf4"            # the launch-prep SHA the branch was cut from
board: reel-cut
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/reel-cut/
  - src/app/(dev)/design/sandbox/reel-story/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/reel-cut.json
  - src/components/reel/reel-studio.tsx
  - src/lib/media/share-save.ts
  - src/app/(dev)/design/sandbox/guest-capture/spec.ts
  - src/app/(dev)/design/sandbox/reel-front/spec.ts
---

# lp/clip-bench

**Goal.** Draw `reel-cut` round 2: the clip creator's workbench with its moments and looks living inside it. Will picked the bench (the clip at full height, a panel beside it, the filmstrip and tray below) and asked that the media selection and the look selector be redesigned into that workbench rather than feel like detached config screens for the same clip. The word is "clip" from now on.

## The brief

Will's picks and notes: `docs/reviews/reel-cut.json`.

**Round 2 asks one thing, `bench`**: how moments and looks live inside the workbench. Three or four directions, each drawn at 1440 and 375 by the real engine over the lab's fixture album, each a whole creator rather than a panel swap: the phone form is part of each direction, since his note holds there too.

**Drawn as ground, never asked** (settled in r1, built later by the clip lane as he amended them):
- `entry=room` and the bench's frame.
- `blocked=caption`: hidden photos dimmed, with "Hidden · Show".
- `wait=stack`.
- The finish: Share primary; "Save" opening the platform's options (Save to Photos first on iOS, then Download file; `src/lib/media/share-save.ts`); "Add to event" behind a confirm; every action keeping you on the finish screen with its done state.
- `mark=line`, quieter but still findable.
- `noencode=greyed`: the disabled button stays and a tap explains why.
- `sound=silent`.

**The noun**: "clip" in every question, option and line on this board. On `reel-story` (unreviewed, round 1), options that offer "cut" become "clip"; nothing else there changes and it stays round 1.

The nearest open asks are `guest-capture.follow` and `reel-front`'s round 2 (`signature`, `badge`); ask nothing they ask. The rows of `touchpoints.ts` for `reel-cut` and `reel-story` are yours, nothing else in that file.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** Both boards at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke --base http://localhost:<port>` whole; `pnpm lab:demo --board reel-cut --base http://localhost:<port>` and `pnpm lab:demo --board reel-story --base http://localhost:<port>` pressing every step.

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
