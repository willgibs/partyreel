---
track: crumbs-56
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "15259241"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/guest/gallery-empty-state-sheet
  - src/components/guest/gallery-empty-state-wait
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/lib/guest/upload-tracker.ts
  - src/components/guest/upload-tracker.tsx
  - docs/systems/disposable-mode.md
---

# lp/crumbs-56

**Goal.** Fix red-team 46's MEDIUM: the waiting contact sheet draws her own video as a broken image; a video draws its first frame.

## The brief

**Why.** Red-team 46 (build 46, 2026-10-03), MEDIUM, in its ledger at `/Users/gibby/local/ai/partyreel-wt/_scratch/redteam-46/ledger.txt` (grep `MEDIUM:`): on a camera album with a develop ahead, a ticket guest at 375 takes 3 photos and a 3.2 s hold ("Video taken."). Back on the album, the contact sheet "4 / Developing / Yours · 4" shows 3 photographs and, in the 4th lit square, the browser's broken-image glyph. Every lit `[data-hers] .wait-cell` in `src/components/guest/gallery-empty-state-sheet.tsx` is an `<img src={cell.src}>`, and `HerShot.video` is ignored, so a `video/mp4` blob fed by `upload-tracker`'s `herShotsOf` (this device's own file) cannot draw.

**Build:** a video in the sheet draws its first frame: its poster where one exists (the camera keeps a video's first frame as its poster), else a muted, inline, paused `<video>` at its first frame, with no controls and nothing autoplaying. Mark it as a video the way the album's tiles do. Red first: a test with a video shot in the sheet, red on today's code. Read the rest of red-team 46's ledger for anything else on the sheet; the Orchestrator relays later findings.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate (CLAUDE.md's four steps, each on its own exit code); `pnpm lab:smoke --base http://localhost:3131`; a capture of the sheet with three photographs and a video at 375 in your Handoff (uploads stood in at the network, as the camera lane did).

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
