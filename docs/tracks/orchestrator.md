---
track: orchestrator
status: open
cut: "4c70fd4e"          # the launch-prep SHA this state was written at
owns:                    # the standing claims no lane touches; bible.ts, bible.test.ts, marketing.css, registry.ts and boards.ts are released to library-lean and return at its merge
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

| lane | what | state | model, port | at its handoff |
| --- | --- | --- | --- | --- |
| `library-lean` | the Library as the brand kit, the catalog and the ten; the rules machinery retired; the look tests deleted (Will, 2026-09-24); the recipe proved by a fresh agent | running (agent `a1d746afe297ea42a`), cut at `d1f59826` from `specs/library-lean.json` | Opus, :3131 | hand-merge in the order its handoff gives (the merge, then its `package.json`, `.prettierignore`, CLAUDE.md, PROGRAM.md and `docs/reviews/README.md` lines, then its new gate: the old merge script calls `design:rules`); return bible.ts, bible.test.ts, registry.ts, boards.ts and marketing.css to `owns`; a `[preview]` for Will; the bible's ten go in synthesized (`bible-synth/bible.ts`, sent; check the /rules page reads them); then one message to `reel-guest-wiring`: sync, apply bible-ten's eight guest lines (listed in the scratch `bible-ten/manifest-final.md`, its Handoff), strip the `@contract-for`, `@policy` and `@refuses` headers in its owns, reword any comment there that cites a pick as a rule (Will's working-versions note, CLAUDE.md "Rising tides"), re-gate, hand off again |
| `systems-lean` | the twelve system docs outside design and the guest surfaces, plus SYSTEMS.md, keep only what a strong model cannot find (invariants, ★ landmines, project facts, Will's rulings), organized for retrieval | running (agent `a59d7d88e9985c0bb`), cut at `f267086c` | Opus, :3132 | review the before-and-after table and the invariants kept; apply its pointer list; retire ROADMAP's "three headings still carry a date" line |
| `reel-guest-wiring` | the live reel's guest side: the seam fix, minimum 2, the provider lift, the Highlight reel tile, the view that is also the wall, the toast, the cut's seam, the photo link card | handed off at `0384a77b` (Will's morning rulings built: the welcome comes first everywhere, landscape fills; a portrait photo on a landscape screen sits whole on its own blur, his to overrule); HELD unmerged (agent `a744f57e3c4cbd81f`) | Opus, :3132 | integrate with the cut and host lanes in one stretch; the reel picture, the Start's fullscreen and wake lock and the toast prove on that alias build (R2 answers CORS only for the alias and prod) |

## Next, in order

The morning of 2026-09-24 (Will's words drive all of it; the plan file's head, "The lean Library", is approved):
the docs lean, the bible to ten principles (his Rising Tides writeup inside it), the Library to three parts.
Scratch for this session: `/private/tmp/claude-501/-Users-gibby-local-ai-partyreel/401f4a77-be99-4a42-82f6-e5fac8e4a4c5/scratchpad/`
(`specs/`, `bible-ten/`, `library-lean/`).

1. **The mandate sweep** (Sonnet) after `library-lean` merges: Will's overhaul (2026-09-24), whose one home is
   CLAUDE.md "Keeping the docs healthy" (guidance with its reason, never a mandate; synthesized, never quoted; one
   home). About 250 comment and lab lines in `src/` cite a pick as authority or frame a design choice as law ("Will
   ruled", "law", "binds", "worn here rather than re-judged", "interim law", "precedent", dated provenance; re-grep at
   the cut): each keeps its WHY and drops the authority, and a line that is only authority goes; firm words stay where
   something breaks. The desk's "ruling" vocabulary and `docs/reviews/README.md`'s grammar words change together.
   Owns: the prefixes the grep finds, outside the held guest lane (its own lines ride its sync message), with
   `globals.css` and `theme.css` released from this file.
2. **The brand kit stays current** (`kit/`, merged at `0cbc5bd6`, Will copies it for outside agents): at
   `library-lean`'s merge, add one clause to the runbook's record step: a change to the brand (tokens, logo, type,
   or the hero, demo and pricing pages) refreshes `kit/` from its README's Sources; the screens come from
   partyreel.com by the scratch `kit-capture.mjs` (it wheels to the demo so its reveal fires), which moves into
   `usher/kit/` at the same merge.
3. **The design docs' pass** after `library-lean` merges (`design-system.md`, `marketing-content.md`, `host-app.md`), the brief shape of `systems-lean` (`specs/systems-lean.json`) under the overhaul's rule (CLAUDE.md "Keeping the docs healthy").
4. **The reel round**, after Will's desk review on build 5 (the plan file's batch-1 and reel sections).

## Waiting on Will

- **His desk review, resumed** on build 5 (`/design/lab?key=`, the value in `.env.local`): the re-cut reel boards first
  (`reel-screen`, `reel-host`, `reel-cut`, `reel-story`), then `reel-front` r2 and `media-viewer` r2.
- **A 10-second iPhone check** on build 5: Save to Photos lands in Photos, and a shared photo arrives as a photograph.
