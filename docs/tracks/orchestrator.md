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
2. **`kit-streamline`** (Opus) after `library-lean` (Will: cut every needless bottleneck; keep what protects):
   `specs/kit-streamline.json` is ready. It makes an integration gate only what the lane never gated (light for
   docs-only), run the lab steps only when the lab could change, keep one typecheck, and run `negative.sh` only
   after a kit change.
3. **The mandate sweep** (Sonnet) after `library-lean` merges, outside the boards (the refresh lanes take theirs): Will's overhaul (2026-09-24), whose one home is
   CLAUDE.md "Keeping the docs healthy" (guidance with its reason, never a mandate; synthesized, never quoted; one
   home). About 250 comment and lab lines in `src/` cite a pick as authority or frame a design choice as law ("Will
   ruled", "law", "binds", "worn here rather than re-judged", "interim law", "precedent", dated provenance; re-grep at
   the cut): each keeps its WHY and drops the authority, and a line that is only authority goes; firm words stay where
   something breaks. The desk's "ruling" vocabulary and `docs/reviews/README.md`'s grammar words change together.
   Owns: the prefixes the grep finds, outside the held guest lane (its own lines ride its sync message), with
   `globals.css` and `theme.css` released from this file.
4. **The brand kit stays current** (`kit/`, merged at `0cbc5bd6`, Will copies it for outside agents): at
   `library-lean`'s merge, add one clause to the runbook's record step: a change to the brand (tokens, logo, type,
   or the hero, demo and pricing pages) refreshes `kit/` from its README's Sources; the screens come from
   partyreel.com by the scratch `kit-capture.mjs` (it wheels to the demo so its reveal fires), which moves into
   `usher/kit/` at the same merge.
5. **At the next `[preview]`**, confirm on Sentry that the Vercel build uploaded its source maps (`894501ad` gated
   the upload on `VERCEL`; local builds verified silent).
6. **The lab revamp**, once the desk's open boards close and before new explorations open (Will: lanes should spend
   their context building for the lab, not learning it): a board as one self-registering folder (no shared
   registries, so no merge repairs), its metadata in its spec, lab checks scoped to the lane's own boards, the
   authoring API trimmed to what a board needs, and a fresh agent proving it can build a board from the recipe alone.
7. **The reel round**, after Will's desk review on build 5 (the plan file's batch-1 and reel sections).

## Waiting on Will

- **His desk review**, on the refreshed boards once the refresh wave lands (build 5's boards are superseded), with
  `album-columns` at the head.
- **A 10-second iPhone check** on build 5: Save to Photos lands in Photos, and a shared photo arrives as a photograph.
