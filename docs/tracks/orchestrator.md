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

Up to eight lanes at once (Will, 2026-09-24); every production build, a lane's or the kit's gate, takes turns
through `scripts/build-lock.sh` (run `integrate.sh` under it until `library-lean` wraps `gate-lane.sh`'s build step).

| lane | what | state | model, port | at its handoff |
| --- | --- | --- | --- | --- |
| `library-lean` | the Library as the brand kit, the catalog and the ten; the rules machinery retired; the look tests deleted (Will, 2026-09-24); the recipe proved by a fresh agent | running (agent `a1d746afe297ea42a`), cut at `d1f59826` from `specs/library-lean.json` | Opus, :3131 | hand-merge in the order its handoff gives (the merge, then its `package.json`, `.prettierignore`, CLAUDE.md, PROGRAM.md and `docs/reviews/README.md` lines, then its new gate: the old merge script calls `design:rules`); return bible.ts, bible.test.ts, registry.ts, boards.ts and marketing.css to `owns`; a `[preview]` for Will; the bible's ten go in synthesized (`bible-synth/bible.ts`, sent; check the /rules page reads them); then one message to `reel-guest-wiring`: sync, apply bible-ten's eight guest lines (listed in the scratch `bible-ten/manifest-final.md`, its Handoff), strip the `@contract-for`, `@policy` and `@refuses` headers in its owns, reword any comment there that cites a pick as a rule (Will's working-versions note, CLAUDE.md "Rising tides"), re-gate, hand off again |
| `album-columns` | the album's column rule explored afresh (Will, 2026-09-24): how the album fills the width on a phone, a laptop and a big screen, on real albums | running (agent `ad3f6c08997d48725`), cut at `453315b7` | Sonnet, :3133 | integrate; `DESK_ORDER` at the head (its answer reaches every board that draws the album); a `[preview]` for his sitting; whichever of it and `library-lean` lands second syncs past the other (it registers in their shared registry files) |
| `design-docs-lean` | `design-system.md`, `marketing-content.md` and `host-app.md` keep how the systems work, their invariants and gotchas; design as guidance; the Library machinery's lines cut | running (agent `a79fc918ffd7eecdb`), cut at `7966dcba` | Opus, :3134 | review the before-and-after table and the invariants kept; apply its pointer list |
| `reel-guest-wiring` | the live reel's guest side: the seam fix, minimum 2, the provider lift, the Highlight reel tile, the view that is also the wall, the toast, the cut's seam, the photo link card | handed off at `0384a77b` (Will's morning rulings built: the welcome comes first everywhere, landscape fills; a portrait photo on a landscape screen sits whole on its own blur, his to overrule); HELD unmerged (agent `a744f57e3c4cbd81f`) | Opus, :3132 | integrate with the cut and host lanes in one stretch; the reel picture, the Start's fullscreen and wake lock and the toast prove on that alias build (R2 answers CORS only for the alias and prod) |

## Next, in order

The morning of 2026-09-24 (Will's words drive all of it; the plan file's head, "The lean Library", is approved):
the docs lean, the bible to ten principles (his Rising Tides writeup inside it), the Library to three parts.
Scratch for this session: `/private/tmp/claude-501/-Users-gibby-local-ai-partyreel/401f4a77-be99-4a42-82f6-e5fac8e4a4c5/scratchpad/`
(`specs/`, `bible-ten/`, `library-lean/`).

1. **The board refresh** after `library-lean` merges (Will, 2026-09-24): every open board re-cut under the new
   guidance (the Library's recipe, the ten, production as a working version) for more open, bolder options, since
   many were narrowed by old rules and past picks. Seven specs are ready (scratch `specs/refresh-*.json`, each with
   its boards' audit lines from `board-audit.md`); cut in this order as seats free: `refresh-reel-host` (Opus),
   `refresh-reel-cut`, `refresh-host`, `refresh-site`, then `refresh-guest`, `refresh-identity`, `refresh-pages`
   (Sonnet). Each owns its boards' folders and rewrites their comments. A refresh improves on what the board has: the strong options stay and get better, bolder ones join, his
   notes on record travel as direction. He runs through the refreshed boards once, the picks are wired so the lab is
   current with the Library, and later rounds may revisit any covered surface with fresh ideas.
2. **The mandate sweep** (Sonnet) after `library-lean` merges, outside the boards (the refresh lanes take theirs): Will's overhaul (2026-09-24), whose one home is
   CLAUDE.md "Keeping the docs healthy" (guidance with its reason, never a mandate; synthesized, never quoted; one
   home). About 250 comment and lab lines in `src/` cite a pick as authority or frame a design choice as law ("Will
   ruled", "law", "binds", "worn here rather than re-judged", "interim law", "precedent", dated provenance; re-grep at
   the cut): each keeps its WHY and drops the authority, and a line that is only authority goes; firm words stay where
   something breaks. The desk's "ruling" vocabulary and `docs/reviews/README.md`'s grammar words change together.
   Owns: the prefixes the grep finds, outside the held guest lane (its own lines ride its sync message), with
   `globals.css` and `theme.css` released from this file.
3. **The brand kit stays current** (`kit/`, merged at `0cbc5bd6`, Will copies it for outside agents): at
   `library-lean`'s merge, add one clause to the runbook's record step: a change to the brand (tokens, logo, type,
   or the hero, demo and pricing pages) refreshes `kit/` from its README's Sources; the screens come from
   partyreel.com by the scratch `kit-capture.mjs` (it wheels to the demo so its reveal fires), which moves into
   `usher/kit/` at the same merge.
4. **At the next `[preview]`**, confirm on Sentry that the Vercel build uploaded its source maps (`894501ad` gated
   the upload on `VERCEL`; local builds verified silent).
5. **The reel round**, after Will's desk review on build 5 (the plan file's batch-1 and reel sections).

## Waiting on Will

- **His desk review**, on the refreshed boards once the refresh wave lands (build 5's boards are superseded), with
  `album-columns` at the head.
- **A 10-second iPhone check** on build 5: Save to Photos lands in Photos, and a shared photo arrives as a photograph.
