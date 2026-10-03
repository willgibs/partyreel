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
- The second MEDIUM asked for "a row waits by its seal (`sealed_until`)", but the HOST'S manifest cannot say it: its entries are `[id, w, h, flags, t]` with a status flag and no seal, the host's scope never sees the seal (`album-sim.ts`), and the host's version never moves on a seal alone, so the cover (and the head, through the one `entryWaits`) had nothing to read it from. Two ways to bring it: (a) a host-only `ENTRY_SEALED` flag on the manifest, read with the manifest pages and decorated onto the delta in the host sync route (three sync files outside this lane), which a long-lived tab holds stale across a develop (rows flagged in one period read as waiting in the next until a reload); or (b) the hub page reads the rows' seals itself beside the develop facts and hands the ids down. Recommended and built: (b). `readJoinedIds` (`src/lib/disposable/host-cover.server.ts`, an owned new file) reads the approved rows sealed now that were created before `sealed_from`, whole (`readAllPages`), only while a develop time is ahead, a failed read answering none (captured); the page hands them with the develop facts as `joined`; `waitsOf` is the one test the cover's count and the head's photographs share. They are as fresh as the page (every save of the develop time reads it afresh; nothing can join the roll while a develop time is ahead), so no flag outlives its period. Exceptions listed in the Handoff: `src/app/(app)/dashboard/[eventId]/page.tsx`, `src/components/app/event-feed/event-hub-head.tsx` (the head's stills and the facts it publishes for the band), and two tests those touch.
- The same read also catches a camera's shots between a develop time and its restamped period (sealed, created before `sealed_from`), which the cover's old caveat called rare and under-read: that caveat is gone from the doc.
- Proved against the real rows, rolled back: a Reviewed event with 3 approved and 4 held photographs switched to a develop time in one save leaves 0 pending, 4 approved, sealed and created before `sealed_from` (`let_in_at = sealed_from`), the 3 earlier approved unsealed, and 0 rows the old rule (approved since `sealed_from`) would count: the "0 developing" of the ledger, and the read's predicate picking exactly the four.

## System-doc edits (in place, owned facts only)

- `docs/systems/disposable-mode.md`, "The host's cover": the rule refined in place (a row waits by its seal; the period is the floor; the roll the page reads; `waitsOf`), and the camera-restamp caveat deleted (the same read catches it).
- `docs/systems/guest-flow.md`, "The album's wait: the contact sheet": one clause (a video's file is no picture an `<img>` can draw: its first frame, its mark, a bare square for a picture that cannot be drawn).

## Deferred (ROADMAP one-liners, bucket named)

- Now: the waiting sheet could draw a camera video's own poster Blob (`QueueItem.poster`, the first frame the camera keeps) rather than decoding the file: `HerShot.poster`, `herShotsOf` and the object-URL ledger in `gallery-live.tsx` carry it (from `crumbs-56`).

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

## Where I am

- The first MEDIUM (the sheet's video) is committed and pushed at `5fd7ebf3`. The second (the host's cover after the switch) is built and green on its own tests, red first (`_scratch/crumbs-56/red2-before.log`), uncommitted until the next commit. Still to do, in order: the live capture at 375 for both (dev server on 3131, uploads stood in at the network), the full gate on a tree synced with `origin/launch-prep` (only records had landed at `e4d09269`), then this Handoff and `status: handed-off`.
