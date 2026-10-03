---
track: crumbs-56
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "15259241"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/guest/gallery-empty-state-sheet
  - src/components/guest/gallery-empty-state-wait
  - src/lib/disposable/host-cover                  # the second MEDIUM, accepted by the Orchestrator mid-lane
  - src/components/app/event-feed/event-hub-head-cover
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/lib/guest/upload-tracker.ts
  - src/components/guest/upload-tracker.tsx
  - docs/systems/disposable-mode.md
---

# lp/crumbs-56

**Goal.** Fix red-team 46's two MEDIUMs: (1) the waiting contact sheet draws her own video as a broken image, a video draws its first frame; (2) the host's cover says "0 developing" and its head wears the sealed photos after held photos join the roll.

## The brief

**Why.** Red-team 46 (build 46, 2026-10-03), MEDIUM, in its ledger at `/Users/gibby/local/ai/partyreel-wt/_scratch/redteam-46/ledger.txt` (grep `MEDIUM:`): on a camera album with a develop ahead, a ticket guest at 375 takes 3 photos and a 3.2 s hold ("Video taken."). Back on the album, the contact sheet "4 / Developing / Yours · 4" shows 3 photographs and, in the 4th lit square, the browser's broken-image glyph. Every lit `[data-hers] .wait-cell` in `src/components/guest/gallery-empty-state-sheet.tsx` is an `<img src={cell.src}>`, and `HerShot.video` is ignored, so a `video/mp4` blob fed by `upload-tracker`'s `herShotsOf` (this device's own file) cannot draw.

**Build:** a video in the sheet draws its first frame: its poster where one exists (the camera keeps a video's first frame as its poster), else a muted, inline, paused `<video>` at its first frame, with no controls and nothing autoplaying. Mark it as a video the way the album's tiles do. Red first: a test with a video shot in the sheet, red on today's code. Read the rest of red-team 46's ledger for anything else on the sheet; the Orchestrator relays later findings.

**Second MEDIUM (relayed by the Orchestrator mid-lane; ledger line 22, `grep -n "MEDIUM:"`).** After the switch that puts held photos in the roll (Reviewed with photos held, to a develop time), the host's cover says "0 developing" and its head wears the sealed photos: the opposite of what her guests see. `host-cover.ts`'s `entryWaits` counts an approved row as waiting only if its manifest time (`created_at`) is on or after `events.sealed_from`; the joined rows were created BEFORE the switch that stamps `sealed_from`, so every one reads as seen, and `useHubCoverStills` dresses the head with them. Asked: a row waits by its seal (`sealed_until` ahead of now), so a held photo joining the roll counts as developing and never dresses the cover; red first (a switched album with held photos), then both fixes handed off together. Accepted outside the owns: `src/lib/disposable/host-cover.ts` and `src/components/app/event-feed/event-hub-head-cover.tsx`, with their tests.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate (CLAUDE.md's four steps, each on its own exit code); `pnpm lab:smoke --base http://localhost:3131`; a capture of the sheet with three photographs and a video at 375 in your Handoff (uploads stood in at the network, as the camera lane did).

## Questions (a recommended answer each; the Orchestrator relays them)

- The poster: the camera keeps a video's first frame as `QueueItem.poster`, but `HerShot` carries one `src` (this device's file, or the tile her rows' read presigned: for a video, that tile IS its poster, drawn as an `<img>`), so the sheet cannot see the Blob. Carrying it means `HerShot.poster`, `herShotsOf` and `gallery-live`'s object-URL ledger: three files outside this lane (two of them `reads`). Recommended: no; the sheet draws a video FILE as a muted, inline, paused `<video>` at its first frame (`videoPosterSrc`, as `PickPreview` and the album's tiles do), and a presigned poster as the still it is. Built so; the poster path is a Deferred line.
- Her video still in the air (a `sending` square) had no `video` flag on its cell, so a clip she was uploading drew the same broken image for as long as it sent (minutes for a big file). Recommended: carry `video` on the `sending` cell at its source. Built: two lines in `src/lib/disposable/contact-sheet.ts` (type and constructor), an exception listed in the Handoff.
- The sheet's picture rules (`.wait-cell > img`, sending's dim and breathing) widened to `video` in `src/components/guest/gallery-empty-state.css` (three selectors; the sheet's one stylesheet sits outside the owned prefix): an exception listed in the Handoff.
- Red-team 46's NIT (the sheet's screen-reader sentence said "4 photos developing, 4 of them yours" for three photographs and a video): once any of hers is a video it says "photos and videos" ("photo or video" for one), the dashboard claims' own words (`claims-card.tsx`); photographs alone read as before. His to overrule.
- Hers that cannot be drawn (a clip this browser cannot decode, an expired link) leave their lit square bare rather than the browser's broken glyph (`onError`, as `PickPreview` does); a video square keeps its mark either way.

## Where I am

- The sheet's video fix is built and green on its own tests (`gallery-empty-state-wait.test.tsx`, six new, red on today's code first: `_scratch/crumbs-56/red-before.log`); `pnpm typecheck` green. Not yet done: the live capture (three photographs and a video at 375), the second MEDIUM, the full gate, the Handoff.

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
