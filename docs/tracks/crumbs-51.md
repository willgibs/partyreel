---
track: crumbs-51
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "f85e3b9d"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - content/help/the-highlight-reel.mdx
  - content/help/make-your-own-clip.mdx
  - content/help/browse-the-album.mdx
  - content/help/play-the-reel-on-a-screen.mdx
  - src/app/admin/exports/live-reel-kill-switch
  - src/lib/constants/careers
  - src/components/marketing/sections/features/album/album-fill-grid
  - src/components/marketing/sections/features/album/everywhere-stage
  - docs/systems/host-app.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/ROADMAP.md
  - docs/systems/guest-flow.md
  - docs/systems/reel.md
  - docs/systems/dashboard.md
  - content/help/AUTHORING.md
---

# lp/crumbs-51

**Goal.** Make the words true of today's product where round 12's merges moved it: the help articles and the admin switch that still describe the retired reel tile and the welcome as a screen, the careers line, two stale hero comments, and host-app.md's "pulse".

## The brief

**Why.** Round 12's merges moved the product under these words (ROADMAP's lines, quoted there; retire each you finish by naming it in your Handoff, never by editing the ROADMAP, which is the Orchestrator's):
1. **Help:** `the-highlight-reel.mdx` (lines 22 and 52), `make-your-own-clip.mdx` (line 23) and `browse-the-album.mdx` describe the Highlight reel tile above the album; since `header-wiring` the reel lives in the album's cover (its stills dissolving under the name, and its round beside Add and Invite; deep in the album the shutter's right-hand round plays it). And `browse-the-album.mdx` (:22, "behind a blurred welcome screen") and `play-the-reel-on-a-screen.mdx` (:24) still draw the welcome as a screen in front of the album; it is the doorway's page, and the steps rise over it as sheets. Quote the controls as the source names them (`help-ui-labels.test.ts` holds them).
2. **Admin:** the live-reel kill switch's sheet says every event "loses its reel tile" (`src/app/admin/exports/live-reel-kill-switch.tsx`); it now takes the cover's reel round and the shutter's.
3. **Careers:** `careers.ts`'s "the tile at the top of the album" is the cover now.
4. **Code hygiene:** `album-fill-grid.tsx`'s and `everywhere-stage.tsx`'s comments still say "the hero's grid" and "the hero's three" columns, a table the hero kept until the live stream replaced it.
5. **Docs:** `host-app.md` (:319, :333) still names "the pulse" where a waiting newcomer or a restore shows; it is the dashboard's stage, its week and its tiles' marks now (`docs/systems/dashboard.md`). `guest-flow.md`'s line (:721) is `door-reveal`'s doc while it runs: name the line as it should read in your Handoff.

Read `docs/systems/guest-flow.md`'s album head and `reel.md` for the facts. Words only where a test can hold them; no product behaviour changes. Will's standard for every word: far less text, never a tool's voice.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:3133`; each changed help article read on your dev server at 375.

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
