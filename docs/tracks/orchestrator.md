---
track: orchestrator
status: open
cut: "4c70fd4e"          # the launch-prep SHA this state was written at
owns:                    # the standing claims no lane touches
  - src/app/(dev)/design/rules/bible.ts
  - src/app/(dev)/design/rules/bible.test.ts
  - src/app/(marketing)/marketing.css
  - src/app/(dev)/design/sandbox/registry.ts
  - src/app/(dev)/design/(shell)/lab/boards.ts
  - src/app/globals.css
  - src/app/theme.css
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
through `scripts/build-lock.sh` (run `integrate.sh` under it until `library-lean` wraps `gate-lane.sh`'s build step).

| lane | what | state | model, port | at its handoff |
| --- | --- | --- | --- | --- |
| `refresh-reel-host` | `reel-screen` and `reel-host` refreshed under the new guidance (strong options kept and improved, bolder directions added, nothing fenced by a past pick) | running (agent `ae61fe3e9bbb13c94`), cut at `75631277` | Opus, :3131 | integrate as it lands; its boards into their leverage places; one `[preview]` when the wave is in |
| `refresh-reel-cut` | `reel-front`, `reel-cut` and `reel-story` refreshed the same way | running (agent `a93a816e4ff303150`), cut at `75631277` | Sonnet, :3132 | integrate as it lands; its boards into their leverage places; one `[preview]` when the wave is in |
| `refresh-host` | `export-flow`, `admin-triage`, `host-curation`, `host-storage` and `event-safety` refreshed | running (agent `a8844c85921d92ea8`), cut at `75631277` | Sonnet, :3133 | integrate as it lands; its boards into their leverage places; one `[preview]` when the wave is in |
| `refresh-site` | `site-chrome`, `privacy-hero`, `profile-page`, `album-motion` and `loose-ends` refreshed | running (agent `a9d0a115ec18ff8cd`), cut at `75631277` | Sonnet, :3134 | integrate as it lands; its boards into their leverage places; one `[preview]` when the wave is in |
| `refresh-identity` | `identity-door`, `identity-claims` and `identity-profile` refreshed | running (agent `a527a1c8604e93f6c`), cut at `31120a14` | Sonnet, :3138 | integrate as it lands; its boards into their leverage places; one `[preview]` when the wave is in |
| `kit-streamline` | the kit does each check once: an integration gates only what the lane never gated, lab steps only when the lab could change | running (agent `afe6fdd1370fd5aaf`), cut at `75631277` | Opus, :3136 | integrate; the kit changes, so `negative.sh` once |
| `reel-guest-wiring` | the live reel's guest side: the seam fix, minimum 2, the provider lift, the Highlight reel tile, the view that is also the wall, the toast, the cut's seam, the photo link card | handed off at `0384a77b` (Will's morning rulings built: the welcome comes first everywhere, landscape fills; a portrait photo on a landscape screen sits whole on its own blur, his to overrule); HELD unmerged; syncing past the lean round (the directives, comments, the entry-modal flake) (agent `a744f57e3c4cbd81f`) | Opus, :3137 | integrate with the cut and host lanes in one stretch; the reel picture, the Start's fullscreen and wake lock and the toast prove on that alias build (R2 answers CORS only for the alias and prod) |

## Next, in order

The lean round's rest (Will's words drive it; everything is guidance, one home, nothing treated as finished).
Scratch for this session: `/private/tmp/claude-501/-Users-gibby-local-ai-partyreel/401f4a77-be99-4a42-82f6-e5fac8e4a4c5/scratchpad/`.

1. **The rest of the refresh wave** as seats free: `refresh-pages` (spec ready in `specs/`), then
   **the mandate sweep**: `python3 $S/make-sweep-spec.py` computes its owns at the cut (the files outside every live
   lane and the boards that frame a choice as authority), `sweep-brief.md` and `sweep-pointers.md` beside it.
2. **`reel-guest-wiring`, one message** (sent 2026-09-24 with the wave; it hands off again, still held): sync; strip `@contract-for`, `@policy` and `@refuses`
   from its 22 test headers; its comments keep their reason and drop authority ("bible N", "Will ruled", "law");
   `guest-flow.md`'s "bible 4 refuses" names the bible's seventh principle; `entry-modal.test.tsx`'s Radix focus-scope
   timer throws after teardown under load (four unhandled errors in gate 158, green on rerun); re-gate; hand off again.
3. **When the wave is in**: one `[preview]` for Will's sitting (`album-columns` first; build 6, `d3135de`, already
   serves the new Library and that board, and its Vercel log confirms the source-map upload).
4. **The lab revamp**, once the desk's open boards close and before new explorations open: a board as one
   self-registering folder, its metadata in its spec, lab checks scoped to the lane's own boards, the authoring API
   trimmed, a fresh agent proving it; with library-lean's board ideas (a `Surfaces` family of live frames per route
   with guest entries, the Library's sidebar open by default, a plain-text view of Library pages, and a
   retire-or-reuse call on `anonymous-info.tsx` and `floating-add-button.tsx`).
5. **The reel round**, after Will's desk review (the plan file's batch-1 and reel sections).

## Waiting on Will

- **His desk review**, on the refreshed boards once the refresh wave lands (build 5's boards are superseded), with
  `album-columns` at the head.
- **A 10-second iPhone check** on build 5: Save to Photos lands in Photos, and a shared photo arrives as a photograph.
