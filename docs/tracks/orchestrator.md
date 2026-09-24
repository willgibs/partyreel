---
track: orchestrator
status: open
cut: "4c70fd4e"          # the launch-prep SHA this state was written at
owns:                    # the standing claims no lane touches; bible.ts, bible.test.ts, globals.css, theme.css, marketing.css, registry.ts and boards.ts are released to bible-ten and return at its merge
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

| lane | what | state | model, port | at its handoff |
| --- | --- | --- | --- | --- |
| `brand-kit` | the root `kit/` folder for outside agents (Will, 2026-09-24) | running | Sonnet, :3133 | review the README and the logo exports; merge |
| `bible-ten` | the bible consolidated to Will's ten (2026-09-24) and every citation made to agree | running | Sonnet, :3132 | apply its CLAUDE.md and PROGRAM.md citation lines; send the guest lane its eight; return the released claims to `owns` |
| `reel-guest-wiring` | the live reel's guest side: the seam fix, minimum 2, the provider lift, the Highlight reel tile, the view that is also the wall, the toast, the cut's seam, the photo link card | handed off at `0384a77b` (Will's morning rulings built: the welcome comes first everywhere, landscape fills; a portrait photo on a landscape screen sits whole on its own blur, his to overrule); HELD unmerged | Opus, :3132 | integrate with the cut and host lanes in one stretch; the reel picture, the Start's fullscreen and wake lock and the toast prove on that alias build (R2 answers CORS only for the alias and prod) |

## Next, in order

The morning of 2026-09-24 (Will's words drive all of it; the plan file's head, "The lean Library", is approved):
the docs lean, the bible to ten principles (his Rising Tides writeup inside it), the Library to three parts.
Scratch for this session: `/private/tmp/claude-501/-Users-gibby-local-ai-partyreel/401f4a77-be99-4a42-82f6-e5fac8e4a4c5/scratchpad/`
(`specs/`, `docs-sharpen/`, `bible-ten/`).

1. **Integrate `bible-ten`**: apply its listed citation lines in CLAUDE.md and PROGRAM.md; return `globals.css` and
   `theme.css` to this file's `owns` (bible.ts, bible.test.ts, registry.ts, boards.ts and marketing.css stay released:
   `library-lean` owns `src/app/(dev)/` and `src/app/(marketing)/`, and they return at its merge). The guest lane's eight
   bible lines wait for `library-lean`, so that lane syncs once and takes both (below).
2. **Cut `library-lean`** (Opus) from the ready spec `specs/library-lean.json` (brief in `specs/library-lean-brief.md`;
   44 owns covering the directive strip, all outside the held guest lane): the Library as brand kit, catalog and the
   ten; the rules machinery retired; the look tests deleted (Will's answer); the recipe proved by a fresh agent. Hand-merge
   it in the order its handoff gives (the merge, then its `package.json`, `.prettierignore`, CLAUDE.md, PROGRAM.md and
   `docs/reviews/README.md` lines, then its new gate), since the old merge script calls `design:rules`. Then a
   `[preview]` for Will, and one message to `reel-guest-wiring`: sync, apply its eight bible lines, strip the
   `@contract-for`, `@policy` and `@refuses` headers in its owns, re-gate, hand off again.
3. **A root `kit/` folder** (Will, 2026-09-24): a hand-off brand kit for outside agents, kept current by the
   Orchestrator, which Will copies for outside work (an intro video agent went off brand and asked for: logo files as SVG
   and transparent PNG incl. a dark-background version; the font families and weights for headlines, body and buttons;
   hex values for background, text, accent and button fill; desktop captures of the hero, the live album demo and the
   pricing section). A short README that points to partyreel.com and gives the essentials, broad enough for any
   Partyreel task. No duplicate media in git (marketing photos stay where they are; placeholders today; a CDN later).
   A small lane (Sonnet); a root folder's owns are its paths (`kit/README.md`, `kit/logo/`, `kit/screens/`).
4. **The systems-docs pass** under the same guideline (`design-system.md`, `marketing-content.md` first).
5. **The reel round**, after Will's desk review on build 5 (the plan file's batch-1 and reel sections).

## Waiting on Will

- **His desk review, resumed** on build 5 (`/design/lab?key=`, the value in `.env.local`): the re-cut reel boards first
  (`reel-screen`, `reel-host`, `reel-cut`, `reel-story`), then `reel-front` r2 and `media-viewer` r2.
- **A 10-second iPhone check** on build 5: Save to Photos lands in Photos, and a shared photo arrives as a photograph.
