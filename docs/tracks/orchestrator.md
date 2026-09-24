---
track: orchestrator
status: open
cut: "4c70fd4e"          # the launch-prep SHA this state was written at
owns:                    # the standing claims no lane touches (a new board adds only its own lines to the two board lists)
  - src/app/(dev)/design/rules/bible.ts
  - src/app/(dev)/design/rules/bible.test.ts
  - src/app/globals.css
  - src/app/theme.css
  - src/app/(marketing)/marketing.css
  - src/lib/design-gate/
  - src/app/api/design-gate/
  - scripts/vercel-ignore-build.mjs
  - .github/workflows/ci.yml
  - src/app/(dev)/design/sandbox/registry.ts
  - src/app/(dev)/design/(shell)/lab/boards.ts
reads:
  - CLAUDE.md
  - docs/PROGRAM.md
announces:
  - "media-viewer-wiring merged at 7eb190de (2026-09-24): `MediaLightbox`/`MediaLightboxLazy` take `origin={{ kind: \"reel\", rect }}` (rect null fades in; omit `returnTo` so the way out lands in the frame) and `startAt` (a clip's seconds); `ViewerOrigin` is exported from `@/components/shared/media-lightbox`; the photo parameter is `PHOTO_PARAM` with `readPhotoParam` in `@/lib/media/share-save`. The Orchestrator replaced guest-flow.md's Lightbox bullet. `reel-guest-wiring` syncs past it and passes both from the view's tap."
  - "lab-scene-kit merged at bff618d4 (2026-09-23): `Fit` and `Measured` live in `@/components/lab` (`scene.tsx`); `kit-discipline.test.ts` refuses a registered board that declares either. `event-safety` syncs past it and imports the two."
  - "The reshape (Will, 2026-09-22): the docs carry rules, never history. `docs/CHANGELOG.md` is gone (the merge commit carries a lane's summary), `usher/kit/cut-lane.py` cuts manifests from a spec, and four lanes run on disjoint files: `docs-rules` retires `docs/design/rulings.md` and the Library's rulings page, `systems-trim` trims `docs/systems/`, `roadmap-lean` rewrites `docs/ROADMAP.md` and `docs/ASSETS.md`, `pointer-sweep` rewrites code comments that point at the retired docs. None changes behavior."
---

# The Orchestrator's state

The pickup: read this first at every session start, compaction or restart, then `docs/STATUS.md`. It holds only what
is true now: what runs, what comes next, what waits on Will. How to cut, integrate, deploy and recover is the runbook,
[`usher/kit/README.md`](../../usher/kit/README.md). Rewritten in place, never a log. The Orchestrator is whichever
model Will seats (Fable or Opus); nothing here depends on which.

## In flight

| lane | what | state | model, port | at its handoff |
| --- | --- | --- | --- | --- |
| `reel-guest-wiring` | the live reel's guest side: the seam fix, minimum 2, the provider lift, the Highlight reel tile, the view that is also the wall, the toast, the cut's seam, the photo link card | handed off at `c3d2dfde` (every guest count through `formatCount`); HELD unmerged | Opus, :3132 | integrate with the cut and host lanes in one stretch; the reel picture, the Start's fullscreen and wake lock and the toast prove on that alias build (R2 answers CORS only for the alias and prod) |

## Next, in order

Milestone 28 is live (`1076d3d7`, 2026-09-24): the 1,000-row round (stage 1 `rowcap-kit`, `rowcap-sql` with three row-cap
migrations applied; stage 2 `rowcap-guest`, `rowcap-host`, `rowcap-cron`, `rowcap-album`; gates 140 to 146),
`upload-owner` and `delete-final`, alias build 4 red-teamed in Will's Chrome, the partyreel.com pass green. The plan file
(`~/.claude/plans/great-work-however-1-dapper-twilight.md`) keeps only the reel section live.
Since it: `reel-migration` merged at `de355bd1` (gate 146), its expand applied on Will's yes (2026-09-24) and the types
regenerated at `7f4b5b45`; `clocks-and-counts` merged at `4c70fd4e` (gate 147). The alias still serves build 4.

**Will's standing approvals:** pushes to `launch-prep` and anything around branching; he tests by click whenever asked. A
milestone and a destructive migration each still need his yes.

1. **The scale probe stays** as a standing large-album fixture (event "Scale probe" `14bb4318-80cd-4eed-b219-92c097ee16c7`,
   qr `d02631f1bfb3455188d224e41bf9510f`; 1,145 approved, 20 pending, 30 host-removed, 5 withdrawn; Review ON since the
   red-team). Its removed rows purge on 2026-10-23.
2. **Desk review batch 1** (2026-09-24; the plan file's head): the three lab lanes and `media-viewer-wiring` merged
   (gates 148 to 151); build 5 (`[preview]`) carries them for his next sitting.
   `reel-guest-wiring` waits handed off, unmerged, until the cut and host lanes are ready: one alias build replaces the
   stored reel. The drop (`20260924110000_live_reel_drop.sql`, on the tree, unapplied) follows that build's red-team,
   on his yes (destructive).
3. **The event-safety wiring**, after his review of that board (his three answers; ROADMAP's event-safety line).

## Waiting on Will

- **His desk review, resumed** on build 5 (`/design/lab?key=`, the value in `.env.local`): the re-cut reel boards first
  (`reel-screen`, `reel-host`, `reel-cut`, `reel-story`), then `reel-front` r2 and `media-viewer` r2.
- **A 10-second iPhone check** on build 5: Save to Photos lands in Photos, and a shared photo arrives as a photograph.
- **`reel-guest-wiring`'s two questions:** the welcome door over a signed-out `?reel=screen` (recommended: held back until
  the view closes) and the default mood's letterbox bars in landscape (recommended: keep). The viewer's calls to overrule
  ride merge commit `7eb190de`.
