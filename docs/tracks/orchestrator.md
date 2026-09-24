---
track: orchestrator
status: open
cut: "4c70fd4e"          # the launch-prep SHA this state was written at
owns:                    # the standing claims no lane touches; marketing.css, globals.css, theme.css released to mandate-sweep and return at its merge
  - src/app/(dev)/design/rules/bible.ts
  - src/app/(dev)/design/rules/bible.test.ts
  - src/app/(dev)/design/sandbox/registry.ts
  - src/app/(dev)/design/(shell)/lab/boards.ts
  - src/lib/design-gate/
  - src/app/api/design-gate/
  - scripts/vercel-ignore-build.mjs
  - .github/workflows/ci.yml
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

Up to eight lanes at once (Will, 2026-09-24); every production build, a lane's or the kit's gate, takes turns
through `scripts/build-lock.sh` (the kit's gate takes it itself).

| lane | what | state | model, port | at its handoff |
| --- | --- | --- | --- | --- |
| `refresh-reel-host` | `reel-screen` and `reel-host` refreshed under the new guidance (strong options kept and improved, bolder directions added, nothing fenced by a past pick) | running (agent `ae61fe3e9bbb13c94`), cut at `75631277` | Opus, :3131 | integrate as it lands; its boards into their leverage places; one `[preview]` when the wave is in |
| `refresh-pages` | `help-center`, `emails`, `contact-page` and `press-page` refreshed | running (agent `a265e63ffcfab973f`), cut at `011d1f52` | Sonnet, :3132 | integrate; then the wave's `[preview]` for Will's sitting |
| `mandate-sweep` | the comments and lab text outside the boards (172 files) state their reason, never a pick, a ruling or a law; the docs lanes' pointer repairs | running (agent `ac7728734ce8ddfb8`), cut at `011d1f52` | Sonnet, :3133 | integrate; return marketing.css, globals.css and theme.css to `owns` |
| `reel-guest-wiring` | the live reel's guest side: the seam fix, minimum 2, the provider lift, the Highlight reel tile, the view that is also the wall, the toast, the cut's seam, the photo link card | handed off at `0384a77b` (Will's morning rulings built: the welcome comes first everywhere, landscape fills; a portrait photo on a landscape screen sits whole on its own blur, his to overrule); handed off again at `f3aa612c`, synced past the lean round (directives stripped, comments synthesized, the entry-modal flake fixed); HELD unmerged (agent `a744f57e3c4cbd81f`) | Opus, :3137 | integrate with the cut and host lanes in one stretch; the reel picture, the Start's fullscreen and wake lock and the toast prove on that alias build (R2 answers CORS only for the alias and prod) |

## Next, in order

The lean round's rest (Will's words drive it; everything is guidance, one home, nothing treated as finished).
Scratch for this session: `/private/tmp/claude-501/-Users-gibby-local-ai-partyreel/401f4a77-be99-4a42-82f6-e5fac8e4a4c5/scratchpad/`.

1. **When the wave is in**: one `[preview]` for Will's sitting (`album-columns` first; build 6, `d3135de`, already
   serves the new Library and that board, and its Vercel log confirms the source-map upload).
2. **The lab revamp**, once the desk's open boards close and before new explorations open: a board as one
   self-registering folder, its metadata in its spec, lab checks scoped to the lane's own boards, the authoring API
   trimmed, a fresh agent proving it; with library-lean's board ideas (a `Surfaces` family of live frames per route
   with guest entries, the Library's sidebar open by default, a plain-text view of Library pages, and a
   retire-or-reuse call on `anonymous-info.tsx` and `floating-add-button.tsx`).
3. **The reel round**, after Will's desk review (the plan file's batch-1 and reel sections).

## Waiting on Will

- **His desk review**, on the refreshed boards once the refresh wave lands (build 5's boards are superseded), with
  `album-columns` at the head.
- **A 10-second iPhone check** on build 5: Save to Photos lands in Photos, and a shared photo arrives as a photograph.
