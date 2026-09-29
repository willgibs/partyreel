---
track: loose-ends-wiring
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "818555b8"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/marketing/faq-accordion.tsx
  - src/components/marketing/faq-accordion.test.tsx
  - src/components/marketing/sections/home/faq-accordion.tsx
  - src/components/marketing/sections/features/album/review-switch.tsx
  - src/components/marketing/sections/features/album/everywhere-stage.tsx
  # added for the corner mark and its lightbox (the mark rides the newest tile, so the grid and the fill's
  # derivation carry it; the lightbox is a new file beside the stage)
  - src/components/marketing/sections/features/album/album-fill-grid.tsx
  - src/components/marketing/sections/features/album/use-album-fill.ts
  - src/components/marketing/sections/features/album/use-album-fill.test.ts
  - src/components/marketing/sections/features/album/everywhere-peek.tsx
  - src/components/marketing/sections/features/album/everywhere-peek.test.tsx
  # the board these picks came from retires in this lane (a board is one folder since lab-revamp's stage two;
  # its picks are what this lane built), a folder deletion in a commit of its own
  - src/app/(dev)/design/sandbox/loose-ends/
  # docs/systems/marketing-content.md is contact-wiring's claim: the one FAQ fact this lane falsifies (the FAQ is
  # no longer native <details>) is a one-line exception there, edited in place and listed in the Handoff
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/loose-ends.json
  - docs/systems/design-system.md
---

# lp/loose-ends-wiring

**Goal.** Wire loose-ends r1's picks: one FAQ look as a real heading, the rings in the Live | Review switch, and the Everywhere stage's corner mark with his easter-egg lightbox.

## The brief

**His r1 answers** (`docs/reviews/loose-ends.json`, 2026-09-29), wired now: `faq-look=heading` (every FAQ's question at 14/500 moves into a real heading, everywhere: `faq-accordion.tsx` and `home/faq-accordion.tsx` converge on one look; crumbs-12 has since made every heading `font-heading` at 700, so follow production's heading rule where it and the pick meet, and say how); `review-photo=rings` ("We'll end up switching this anyway pre-launch, with a brand new media kit, mostly generated in Higgsfield": the Live | Review switch's photograph becomes the rings, and your Handoff asks for an ASSETS row for that slot); `everywhere-pill=corner` with his easter egg ("a really neat easter egg delight if we included a subtle hint these images were clickable, with a fun little lightbox preview when clicked. However, it should clearly feel like a fun easter egg demo, not trap visitors in a demo they didn't ask for. This may fall on its face completely on next review"): the quiet corner mark on the newest tile, and a press opens a small lightbox that is clearly a demo and closes in one tap. `phone-cycle=today` keeps 3.2 s (no change). The two chart asks fold into a later admin exploration (leave the charts).

**Not yours:** the `loose-ends` board's folder belongs to `lab-revamp` (stage two, running): leave the board; the Orchestrator retires it at your merge. Marketing's motion rule is in `docs/systems/marketing-content.md` (calm and fluid, never still long enough to miss a step).

**Paths:** your owns are a start. A path you need beyond them: add it to `owns` in your manifest before editing, or name a one-line exception.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` whole when the lane changes anything under `src/` but tests (the Library renders the product's components); and the surfaces the Handoff is judged on, local and live.

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
