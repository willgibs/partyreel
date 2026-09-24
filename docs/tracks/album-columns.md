---
track: album-columns
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "6afa7831"            # the launch-prep SHA the branch was cut from
board: album-columns
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/album-columns/
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/components/shared/masonry.tsx
  - src/app/(dev)/design/sandbox/gallery-fixtures.ts
---

# lp/album-columns

**Goal.** The album's column rule explored afresh: how the album fills the width on a phone, a laptop and a big screen, drawn as decisions on real albums.

## The brief

**The ask.** Will wants the album's column rule explored from the ground up, now. It is the grid every album is: the guest's album, the host's feed, the skeleton and the marketing album stage.

**Production today, a working version.** The shared masonry (`src/components/shared/masonry.tsx`) runs two columns under 640 px. Above that, it lays columns of a target width, `--album-column`, with a 220 px floor, and the guest's three-step tile-size control sets that width. The gap is `--gap-gallery`. The host's feed (`src/components/app/event-feed/event-gallery.tsx`) and the guest album (`src/components/guest/live-gallery.tsx`) share the rule. Other boards drew this rule as settled, which is exactly why nobody improved it. Treat nothing about it as decided. Look at real albums at 375, 1440, 1920 and wider, and find the best rule you can.

**Room to explore** (you find the real questions; these are only the territory):
- how wide the album runs: a contained column, a wide container, or full bleed;
- how the columns are chosen: a target width, a count per breakpoint, a density the viewer sets, or something new;
- the gaps and the tile corners at that density;
- the phone, and the largest screens;
- whether the host's feed and the guest album share one rule;
- whether the tile-size control stays, and in what form.

**Drawing.** Draw every option on a real fixture album (`src/app/(dev)/design/sandbox/gallery-fixtures.ts`) with mixed aspects, at the widths where the difference shows. Add a width control wherever it helps him judge.

**Registration.** Your board's lines in `sandbox/registry.ts`, `(shell)/lab/boards.ts` and `touchpoints.ts` are the one listed exception to your owns. `library-lean` owns those files and is reshaping `touchpoints.ts`, so register after `album-motion`, the nearest standing board, and ask nothing it asks. Whichever lane lands second syncs past the other.

**Binds.** The bible and the policies (`/design/library`), the contracts of every component under a path you own, and
CLAUDE.md's working loop. A record doc
(`docs/STATUS.md`, `docs/ROADMAP.md`, `docs/PROGRAM.md`, `CLAUDE.md`, `docs/ASSETS.md`, `docs/tracks/orchestrator.md`,
`docs/reviews/`) is edited only when your `owns` names it. Stage explicitly; never `--no-verify` or force-push; every commit ends
with the `Co-Authored-By` line naming the model you actually run on.

**Verify on.** The board at 375, 1440 and 1920 with reduced motion honoured; `pnpm lab:smoke` whole; `pnpm lab:demo --board album-columns` pressing every step.

## Questions (a recommended answer each; the Orchestrator relays them)

- none yet

## System-doc edits (in place, owned facts only)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- The work commit and the sync commit, pushed (or: launch-prep had not moved); the head is in the chat line
- Every claim names its artifact (a commit, a log line, a path), so the Orchestrator checks rather than believes.
- Gates on the synced tree, each on its own exit code
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The items, one line each
- Assets requested from Will: none, or one per line: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Calls his to overrule, one line each
- Look at first: ...
