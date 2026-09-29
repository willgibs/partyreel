---
track: album-motion-wiring
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "e2557874"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/shared/album-stream/
  - src/components/marketing/sections/features/album/arrivals-hero.tsx
  - src/components/marketing/sections/features/album/live-album-stage.tsx
  - src/components/marketing/sections/features/album/live-album.css
  - src/components/marketing/sections/features/album/live-album-stage.test.tsx
  - src/app/(dev)/design/sandbox/album-motion/
  - src/app/(dev)/design/(shell)/library/components/gallery-demos.tsx
  - docs/systems/marketing-content.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/album-motion.json
  - docs/systems/design-system.md
---

# lp/album-motion-wiring

**Goal.** Wire album-motion r1: the album page's hero keeps its two symmetrical streams, each photograph drawn in and dissolving at the album's edge and then pushed into the album from the left as a real upload arrives.

## The brief

**His r1 answer** (`docs/reviews/album-motion.json`, 2026-09-29): `fall=push`, with his note: keep the stream coming in from both sides so the hero stays symmetrical and balanced; new items still push in from the left, the album's entry point; both streams are drawn in and dissolved, and then their item is pushed in as an upload. His note overrules the board's carried `side` call (the head's side only): photographs fall from both sides of the words, each drawn in and dissolving at the album's edge, and each one's photograph then arrives in the album the way a real upload has since milestone 29 (its row opens from the left edge, clipped and never scaled, its neighbours gliding aside, only a glow fading). The carried `rows` call stands: the stage's album is the guest album's rows, laid plain.

**Where:** `/features/album`'s hero (`arrivals-hero.tsx` over `live-album-stage.tsx`), its stream from `src/components/shared/album-stream/` (`stream-engine.ts` already holds the push recipe and its arrival hook). The board drew the push in its own `push-engine.ts` and `push-stream.tsx`: lift what serves, never import from the board. Find every other user of the stream engine first (the Library's gallery demos draw it): each one's motion stays exactly as it is unless the pick is about it, and you say how you checked.

**The motion rule** (`docs/systems/marketing-content.md`): calm and fluid, never still long enough to miss a step, the home hero's pace kept; reduced motion gets a still, whole frame.

**Retire the board in-lane** once the pick is built: `src/app/(dev)/design/sandbox/album-motion/` is yours (`git rm -r` in a commit of its own); its ledger stays for the Orchestrator's record.

**Paths:** your owns are a start. A path you need beyond them: add it to `owns` in your manifest before editing, or name a one-line exception.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- **The two streams: in turn, or together?** Built: in turn. One photograph is handed over each beat, the sides alternating (each side launches every other beat), so every arrival is one push and one glow. Together (the shipped glide's pairs) lands two at every beat, a small batch each time. Recommend in turn.
- **How often does the album take a photograph?** Built: the push's own clock, every 1875 ms at a desk and 2025 at a phone, with 4 frames in the air at the busiest instant (2 a side; the board's push had 4 on its one side), each glow nearly out as the next row opens. The alternatives are the home hero's beat (every 1250 ms, 6 in the air, glows overlapping) or glide's density (12 in the air, the album taking about 1.6 photographs a second). Recommend the push's clock, the pace he picked; a retune is `RECIPE.beats` in `stream-engine.ts`, one number per breakpoint.
- **When does the row open?** Built: when the frame's dissolve is half through (`RECIPE.handover`, 0.9 of its path, opacity one half), so the frame going and the row opening overlap into one hand-over. The alternative opens the row once the frame is gone (his "then", read literally), with a beat of nothing between. Recommend half through.
- **What does a window 1024 to 1279 wide draw?** Built: the phone's composition (the strip under the words, the album 430 tall), because the side band entered the words' column there: by up to 33 px at 1024 with the new, larger frames, and the shipped glide drew under the header's wordmark at 1100 on the alias. Keeping the side band from 1024 crowds the column. Recommend the strip for now; a tablet geometry of its own is a board idea below.

## System-doc edits (in place, owned facts only)

- `docs/systems/marketing-content.md`: one ★ line after the album page's fill grid, "The album page's hero is the live album taking uploads": the handover, `LiveAlbum`'s ring of the twelve, the stage's clip as the album's own scroller (the page-scroll trap), and the one 1280 swap.

## Deferred (ROADMAP one-liners, bucket named)

- The album: `MediaTile` runs its 300 ms load fade even on a photograph that is complete at mount (`loaded` lands a render late), so a pushed arrival whose bytes are already there still wipes in over a photograph fading in, against `arrival=push`'s "nothing fades" (from `album-motion-wiring`).

## Handoff (replaces the chat report)

- **Commits, pushed to `lp/album-motion-wiring`**: `4692e611` retires the board (its own commit), `c9e31a9c` is the work, and the manifest commit is the head in the chat line. No sync commit: `launch-prep` moved (event-ready r1, window-notes, records, the crumbs-17, demo-framing-r2 and unfence cuts) but nothing in my owns or reads, and a trial merge is clean (`git merge-tree --write-tree HEAD origin/launch-prep`), so PROGRAM.md's "Sync" asks for none.
- **Gates**, each on its own exit code. On `4692e611`'s tree alone (the wiring stashed): typecheck 0, lint 0, test 0 (608 files, 7051 tests). On `c9e31a9c`: typecheck 0, lint 0, test 0 (609 files, 7073 tests), `zsh scripts/build-lock.sh pnpm build` 0 (`/features/album` prerendered static), `pnpm lab:smoke --base http://localhost:3131` 0 (131 checks, 0 failing; scope: the Library and the shell, no board). There is no board of mine to `lab:demo`: it retired. Logs: `../partyreel-wt/_scratch/album-motion-wiring/{b-typecheck,b-lint,b-test,build,lab-smoke,a-typecheck,a-lint,a-test}.log`.
- **Lane check**: `git diff --name-only origin/launch-prep...HEAD` is the owned paths plus this file, with one exception: `src/app/(dev)/design/gallery/specimens.generated.json`, regenerated by `collect-specimens.mjs` for the AlbumStream entry's code panel (`specimens.test.ts` refuses a stale artifact). It is left unclaimed because every Library lane regenerates it (unfence edits two other families' demos); on a conflict at merge, re-run the collector.
- **The PREMISE line** lab:smoke raised (demo-framing's `names` lives in `marketing-content.md`): my line there is the album page's hero only, and the demo's names on the card and at its album's head are untouched.
- **Other users of the stream, and how I checked**: `grep` over `src`, `docs` and `scripts` for `album-stream`, `stream-engine`, `ArrivalsHero`, `LiveAlbumStage` and `live-album` finds the album page, the Library's AlbumStream entry and the board, nothing else. The home hero's stream is its own engine, read for pace only and untouched. The Library's first specimen (the stage alone) is still, as it was. Its second ("and the fall into it") is the pick's subject, so it now takes the arrivals inside `LiveAlbum` and its lede says rows, not masonry (measured: 6 arrivals in 10 s, `shots/samples-1440-library.json`).
- **Items**:
  - The engine is one composition (`stream-engine.ts`): the board's `gather` fall (born at 1.08 and landing at 0.74, pulled toward the album's middle, dissolving over the last fifth of its path) on the push's clock, the sides in turn, each photograph handed over as its dissolve is half through. The arrivals keep one exact beat (the quicker lane leaves later). The rest state is a chosen whole frame: nothing mid-fade and the sides balanced (2+2 at a desk, 2+1 at a phone). glide, gather, cascade, bloom, `SHIPPED`, `variant`, `AlbumStreamPause` and bloom's sheet left with the board.
  - The layer (`album-stream.tsx`) announces each handover through `AlbumStreamTarget`, from the shown composition only, and dresses each launch as the still the album will take (its tail first). A layer coming back after the other one drove the album re-dresses from it: over two mid-visit swaps across 1280 every arrival was the album's tail and no still showed twice (`switch.mjs`).
  - The stage (`live-album-stage.tsx`) is the guest album's rows, laid plain, inside `LiveAlbum`: a ring of the twelve where each arrival leaves the hidden tail and is pushed in at the head, with the rows' own push and `useArrivalMarks`' glow (`--arrival-glow-ms` on the box). The next stills are fetched and decoded before their rows open, so the push reveals a photograph (production: every arrival `complete` at the push, `shots/samples-1440-prod.json`), and in dev StrictMode's second ref pass no longer aborts them blank.
  - A trap the board could not show, fixed: the rows anchor whatever scrolls them, so with the page as their scroller every arrival scrolled the PAGE under a reader a little past the album's first row. The clip is now the album's own scroller (`live-album.css`). A/B at scrollY 1000 over 30 s: 1000, 1007, 1043, 1054 with the clip only clipping, and 1000 throughout as the scroller (`shots/samples-1440-s1000-hidden.json` against `-fixed.json`); production build: 1000 throughout over 25 s and 14 arrivals. `inert` keeps the page's own scroll: a wheel over the stage moved the page 0 to 480 and the clip stayed at 0, and Tab never entered the stage (`wheel.mjs`, at 1440 and 375).
  - The stream, the stage and the hero's floor swap together at 1280 (`album-stream.css`, `live-album.css`, `xl:pb-[150px]`), held by `stream-engine.test.ts`. No frame crossed the words' ink over a full cycle at 1024, 1100, 1279, 1280 or 1920 (`shots/samples-{w}.json`).
  - Tests: `stream-engine.test.ts` is reshaped to the one composition (the two board-only checks retired) and adds the push's promises: one beat, the sides in turn, the handover at the edge as it dissolves, the dressing, the whole rest frame, the 1280 parity. `album-stream.test.tsx` gains the handover promises: the shown layer only, each the album's tail, nothing while held or under reduced motion. `live-album-stage.test.tsx` is new: the ring, the glow's two seconds, the stills readied ahead, and a turn of the ring as a local reflow at 320, 600 and 870.
  - Reduced motion is a still, whole frame (4 photographs fully drawn, no arrivals: `shots/samples-1440-reduced-prod.json`), and a hidden tab takes nothing (`switch.mjs`).
- **ROADMAP lines this resolves** (for the record's delete): Marketing's "`album-stream.css` shows the stream's desk composition from 1024…"; the lab and the kit's "`album-motion`'s `gather`, `cascade` and `bloom` live in the shared `AlbumStream` engine…"; and `album-motion` leaves the list of boards drawing a `MarketingHeader` in a frame (hero-r2's line).
- **The relay on light at arrivals** (design-system's "light never goes … on gallery arrivals", read as guidance with its reason): the push wears only the grammar's own glow (`arrival.css`'s `data-arrived`, which the pick names: "only its glow fades"), and I drew no further light. The stage's halo already lights the album from behind, and a second light at the head every 1.9 s would make the album's top a pulse, the busy top that line's reason is about. The one place a light could serve is board idea 2.
- **Live**: the alias carries `launch-prep`, not this branch, so the live pass is after the merge deploys. Local proof stands in for it on a production build (`pnpm start -p 3131`, all of the above). To re-check on the alias: `node ../partyreel-wt/_scratch/album-motion-wiring/probe.mjs --url https://partyreel-git-launch-prep-partyreel.vercel.app/features/album --w 1440 --secs 25 --scroll 1000` (scrollY must hold, arrivals `complete`), then `--w 375 --h 812 --mobile --scroll 300`.
- **Assets requested from Will**: none (the twelve stills stay ASSETS row 22's stand-ins).
- **Board ideas**:
  - The album page's hero from 768 to 1279 draws the phone's strip stretched across a laptop (small frames in a wide strip, the album 430 tall); a tablet geometry of its own, as the home hero has (`hero-stream.ts`'s `tablet`), could fill it.
  - The handover's two places: a right-hand frame dissolves over the album's right half while its row opens at the head on the left (his note accepts it). A board could ask whether a light along the album's top edge, or the right arm landing further in, should join them.
- **Proposed migrations / Worker / Vercel / Stripe / env changes**: none.
- **Calls his to overrule**: the streams in turn, not in pairs; the push's clock (4 in the air); the row opening half through the dissolve; the strip composition from 1024 to 1279. Each is a Question above with its alternative.
- **Look at first**: `/features/album` at 1440, where a left frame dissolves above the head as its row opens and a right frame dissolves over the album's right half while its row opens on the left; at 375, scrolled to the album's head; at 1100, the strip composition now drawn between 1024 and 1279; then `/design/library/album-stream`, the fall specimen.
