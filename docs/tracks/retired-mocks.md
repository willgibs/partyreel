---
track: retired-mocks
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "14a17e10"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/marketing/sections/reel/live-section.tsx
  - src/components/marketing/sections/reel/live-tile.tsx
  - src/components/reel/poster-card.tsx
  - src/components/marketing/sections/how-it-works/host-pictures.tsx
  - src/components/marketing/sections/features/album/take-home-section.tsx
  - src/components/marketing/sections/features/sharing/zip-modal-demo.tsx
  - src/components/app/export/export-dialog.tsx
  - src/components/app/export/export-dialog.test.ts
  - src/components/app/export/take-home-panel.tsx
  - src/components/app/export/take-home-panel.test.tsx
  - src/components/marketing/mock-parity.test.ts
reads:                  # single-sources you depend on: never duplicate, never edit
  - CLAUDE.md
  - docs/systems/testing-verification.md
  - docs/systems/marketing-content.md
---

# lp/retired-mocks

**Goal.** The marketing site's pictures that still draw retired product (the reel tile on /reel, the Download album dialog in How it works and the sharing mock, the export menu in the album page's take-home) redrawn from today's own pieces, and the dead files they kept alive deleted. A production lane: the whole gate, no board.

## The brief

**The round's direction (Will, standing since round 13):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; delight where it costs nothing in clarity; nothing depends on a timeline; immediate, or a clear state and a way to stop it; no AI managing it; cost designed like the architecture; production is the working version.

**Why now.** Three of the marketing site's pictures still draw product the app retired, so the site shows a guest something she will never meet, and two dead files live on only for their pins. Each is a ROADMAP Now line; read each in full (`docs/ROADMAP.md`) and `docs/systems/marketing-content.md` first:

1. **/reel's live section** (`sections/reel/live-section.tsx`) draws the retired reel tile (`live-tile.tsx`, `PosterCard`'s last caller) at the top of the album: show it as the cover's play button opens it (the guest album's cover and its reel door, drawn from production's own parts), then delete `live-tile.tsx` and `PosterCard` (`src/components/reel/poster-card.tsx`), keeping the format helpers `clip-creator.tsx` imports.
2. **`KeepPicture`** (`sections/how-it-works/host-pictures.tsx`, drawn by /how-it-works and the help center's `loop-keep` step) still draws the retired Download album dialog, and `zip-modal-demo.tsx`'s caption says guests get the same modal: redraw both on Take it home, from the panel's own pieces exported by `take-home-panel.tsx`, so the picture cannot drift from the product again.
3. **`export-dialog.tsx`** has no caller but its test, and `mock-parity.test.ts` reads it for five quotes of the retired Download album menu for two mocks that still draw that menu (`features/album/take-home-section.tsx`, `features/sharing/zip-modal-demo.tsx`): redraw both on today's take-home (Select, then Save), then delete the file, its test and those pins, re-pointing `mock-parity.test.ts` at today's words where it guards a mock.

One picture per purpose: where a mock and the product show the same thing, the mock composes the product's own pieces (exported, never copied). Retire the three ROADMAP lines in your Handoff's list.

Out of scope: the help center's `ReelCardPicture` (it waits on event-header r6's card pick, on Will's desk), the marketing site's words beyond the captions these pictures carry, and any production behaviour (a piece exported from `take-home-panel.tsx` renders exactly as it does today; its test proves it).

**Verify on.** The whole gate on the synced tree, each step on its own exit code, and `pnpm lab:smoke` (the Library draws marketing pieces); each changed page served by your own dev server (`/reel`, `/how-it-works`, `/features/album`, `/features/sharing`, the help center's `loop-keep` step) answering 200 with the new picture's words in its HTML and none of the retired ones (`curl`); `mock-parity.test.ts` and `take-home-panel.test.tsx` green with the new pins. Screenshots at 1440 and 375 where your session's browser runs; if it is refused, say so and leave the look for Will's desk (never work around a refused step).

Model: Opus. Cut by the cloud-seated Orchestrator; you run in a cloud session of your own (the spawn prompt's boot).

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

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
