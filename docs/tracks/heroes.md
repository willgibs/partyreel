---
track: heroes
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "d62dac22"         # the launch-prep SHA the branch was cut from
board: privacy-hero, album-page # two new question-first boards
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/privacy-hero/
  - src/app/(dev)/design/sandbox/album-page/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/album-hero.json
  - docs/design/rulings.md
  - src/components/marketing/sections/home/hero-stream.ts
  - src/app/(dev)/design/sandbox/album-hero/compositions.ts
  - src/components/marketing/system/page-hero.tsx
  - src/components/marketing/system/section-light.tsx
---

# lp/heroes

**Goal.** Two question-first boards, one lane, because both lift ONE copy of the field engine and
both are paced against ONE reference, the home hero:
- `privacy-hero`: "the field" as the /features/privacy hero, two opposite spirals, faster, with a
  smaller gap and a decaying trail;
- `album-page`: the album page's hero, round four, at the home hero's pace but subtle, in the empty
  space around the headline, with the live album beneath it and a new light.

Each is authored with `defineExploration` (`src/components/lab/exploration.ts`), never
`new-board.mjs`: a handful of decisions in plain words, every option drawn as the real surface.
**Not in this round:** any production byte (the wiring lanes ship the picks), the album page's other
sections, the `ScreenLamp` fix at its source (the album wiring's), the copy (the `voice` board's).

**Binds.** The bible, the component contracts, the policies. The newest section of
`docs/design/rulings.md` (2026-09-18, "the calm was the wrong instruction") is this lane's brief, and
`docs/PROGRAM.md` "A round returns DECISIONS" is its method, including its two newest sentences: a
relative note is answered with options graded against a reference, never a cap and a test; placeholder
copy is judged for its size and wrapping, not its words.

## What he said

On album-hero round three (`composition=none`): "Honestly, none of these landed as well as I was hoping.
I think my calm instruction messed us up - now it feels too boring. Let's speed up the pace again; home
hero currently feels perfect - fast but not overwhelming, so it's still easy to read text. Aside from the
'calm' problem effecting all explorations, none feel they would pair well with the album visual beneath.
However, I'd love to revamp 'the field' for the 'Privacy & trust' page hero. I love the images popping
in spiraling opposite two sides. Increasing the pace, reducing the gap between images and leaving a
decaying trail behind the 2 spirals should hopefully be perfect for that page hero."

On the album's width (`album-width=w880`, with two screenshots of today's lamp under the demo): "If this
width makes the dashboard visual too tall, we can fade out the bottom. May look better either way.
Current lamp usage is wrong anyways on album page beneath demo visual (will attach image in chat), so we
can find new ways to infuse the aurora here as well."

On the copy (`copy=page`): "The future voiceboard exploration will treat all copy as unprotected, so we
can design without getting too specific on copy right now as long as the active placeholder feels like
an accurate representation of the future copy. That way, we're judging things like size and wrapping
correctly." Also ruled: `headline=lg`, `no-script=settled`.

Asked what the album page's hero becomes: "Let's do a round 4, home hero pace. I know you recommended the
no composition, and I'd guess it's because the album below already serves as a visual for the hero and
pairing it with a loud animation, such as those from our last exploration, may feel overwhelming. I
agree, but feel the area above and to the sides of the H1 lockup will feel too empty with just the album
beneath. Maybe we can use a more subtle animation in some of the empty space to help the hero feel more
alive & full."

## What is settled, so build rather than ask

- **The reference pace is the home hero's, measured** (`hero-stream.ts:246-268`, `cinema-hero.tsx:187-251`;
  import it read-only). At 1440 a frame leaves the code at 40 px/s and reaches 212 px/s at the edge,
  about 103 px/s on average over 720px in about 7.0 s. A left and right pair launches every 1250 ms at
  `lg` (1350 below it), each frame flies 9600 ms, at most about 12 are on screen and about 10 lit. First
  paint fans out over `REVEAL_MS` 1750.
- **The calm caps do not come with you.** `CALM` (40 px/s, 16 lit) and the test that pins it
  (`album-hero/compositions.test.ts:82-94`) are exactly what went wrong. Keep the engine's arithmetic
  tests in your copy (the phase, the frame, the cost lines); grade options against the reference
  ("the home hero's pace", "a notch under it"), never against a cap.
- **The spirals he named are round THREE's "field, calmed"**, not round two's (`field.tsx` at `24c24f19`
  was a sunflower fan, not two arms). `album-hero/compositions.ts:338-440`: rays at
  `-90 + ((i*7)%15)*24°`, births alternating sides 168° apart, each arm turning -24° every two beats;
  15 nodes, a launch every 1200 ms, a 16.8 s flight, dark for the first 14% of it, growing 0.58 to 1,
  fading from 0.86; at a phone, two vertical cones of 12 rays. The comment at `:371-372` is stale.
  COPY the field half of `compositions.ts` and `hero.tsx`'s rAF driver (`:125-173`, it pauses on a
  `[data-paused="true"]` ancestor) into your board directories: `album-hero` stands until its wiring.
- **The lockup is ONE block and the text stays readable**: nothing crosses the lockup's box at either
  width (round three's rule).
- **`headline=lg` is the size the page ships today**: `PageHero` scale `lg`, `text-title`, 34 at 375 and
  80 at 1440. The album-hero board's own `lg` (72px, `home-hero/shared.tsx:65-68`) is stale; draw with
  the live `PageHero`.
- **First paint at rest** (`no-script=settled`): the composition's resting frame is what paints first,
  with or without JavaScript, and motion begins after it.
- **`copy=page`**: each page's own words (`featurePage("privacy")`, `featurePage("album")`) as the
  placeholder, judged for size and wrapping.
- **Where a hero's picture sits**: `PageHero` (`page-hero.tsx:150-186`) has a `backdrop` slot behind the
  lockup (the caller makes the section `relative`; the one call site is `careers/page.tsx:103-120`) and
  `children` as a stage below the lockup.
- **The album page today**: `ArrivalsHero` over `ArrivalsStage` (`arrivals-stage.tsx:34-83`): `max-w-3xl`
  (768), a `ScreenLamp limit={6}` around a `BrowserFrame` holding `useAlbumFill` and a three-column
  `AlbumFillGrid` 372 tall. Then `GettingInSection`, `EverywhereSection`, `QualitySection` (the dark
  chapter's last section), `PaperChapter`. There is no `SectionLight` on the page.
- **The wrong lamp**: `ScreenLamp` (`screen-lamp.tsx:76`) is a full-bleed 220px band, while
  `design-system.md:379-381` says a screen's light is a POOL no wider than the screen (the reel ships
  one: `reel-screen-lamp.tsx:48-71`). Today's band is never an option.
- **896, not 880**: the album sits at `max-w-4xl` (896), the container scale's step nearest his 880, so
  the page takes no one-off width. Say so on the step.

## `privacy-hero`: the decisions (each drawn at 1440 AND 375)

Givens on every option: both arms, the lockup as one block, readable text, `headline=lg`, first paint at
rest, the page's own copy, no calm cap.

1. **The pace** ("How fast should the spirals travel?"): the home hero's speed and clock [recommended] /
   a notch under it / a notch over it. Say each one's numbers against the reference.
2. **The gap** (after the pace): half a photograph apart [recommended] / edge to edge / overlapping.
3. **The trail** (after the gap): a fading wake behind each arm [recommended] / echoes / none.
4. **At a phone** (after the trail): the two spirals as on desktop, sized to the column / two falling
   cones as today. Recommend after you have drawn both at 375.

## `album-page`: the decisions (each drawn at 1440 AND 375)

Givens on every option: the home hero's pace but SUBTLE (the album beneath is the main visual and
nothing is loud), the lockup as one block, readable text, `headline=lg`, first paint at rest, the page's
own copy.

1. **The visual under the hero**, at 896 with its bottom faded: the live album product, the real
   `GuestMasonry` with the host's header as `album-hero/album.tsx` draws it [recommended: his round-one
   "the actual live album product"] / today's filling demo (`useAlbumFill` and `AlbumFillGrid` in a
   `BrowserFrame`) widened to 896.
2. **The motion around the headline** (after the visual): three genuinely different ideas for the empty
   space above and beside the lockup, each drawn with the chosen visual beneath it and graded against the
   home hero's pace. Different in kind, not in degree; each says in one line what moves and how fast.
3. **Its light** (after the visual): a pool under the frame [recommended: the doc's rule] / none / a halo
   behind the frame (the `Glow` halo, `shared/glow.tsx`, unused in production; the Library's example is
   `gallery-demos.tsx:189`).
4. **A second light**: none / rising from the dark chapter's floor (`SectionLight placement="bottom"` on
   `QualitySection`) [recommended] / the Everywhere section lit from its open side
   (`SectionLight placement="room"`).

## The lab you are building for

The Orchestrator is rebuilding the step while you build, and it lands on launch-prep before your
handoff: **the preview is the page and the answer is a dock.** Every option of a decision is drawn ONCE,
on the stage, at its true size (flipped one at a time, or side by side when they fit), and a staged
decision is drawn wearing the answers it waits on. So draw each option as the real surface at its real
size (a `Frame` at the real width, or a `Stage`), never a thumbnail. A preview may be a FUNCTION of the
board's state (`Preview` in `exploration.ts`): a gap option can read `s.pace` and draw at that pace.
`src/app/(dev)/design/sandbox/type-phone` is the worked example of the authoring shape; it retires when
`ladders-wiring`'s phase 1 merges, so read it at your cut.

**Register your boards under the exception** (the only lines you add outside your `owns`):
- `sandbox/registry.ts`: the imports, and the members at the HEAD of `BOARDS`;
- `(shell)/lab/boards.ts`: the imports, and the entries at the HEAD of `BOARD_COMPONENTS`;
- `touchpoints.ts`: the ids at the HEAD of the `SandboxId` union, into `RulingId` directly after
  `"river-visual"`, and one RULINGS row each at the END of `RULINGS` (after river-visual's; copy its
  shape, `board` block included);
- `touchpoints.test.ts`: the ids in "marks exactly the standing sandbox boards".
Two other lanes add theirs at the same places, so the Orchestrator merges those lines keep-both. Never
reorder, re-sort or reformat the lists; if `pnpm format` touches a hunk outside your lines, revert it.
`pnpm design:rules` regenerates `docs/design/library.md` and `rules.generated.json` (generated;
allowances in the lane check).

**Names `ladders-wiring` changes, which you build against**: `rounded-3xl` and `rounded-4xl` become no-ops
and `shadow-float` and `--radius-action-lg` retire, so use none of them; `text-subhead` and `size="cta"`
arrive with its merges, so do not depend on either before your sync; `prose` is 24px at a phone.

## Verify, and the gate

Both boards at 1440 and 375, reduced motion honoured (the resting frame, still). **Measure every
tile**: screenshot every option beside its option's words and check the picture shows what the words
claim (PROGRAM.md; a tile drawn with its sign backwards reached Will once). Dev server on port 3133,
stopped by port (`lsof -ti tcp:3133 | xargs -I{} kill {}`), never an unscoped kill. The gate, each step on
its own exit code: `pnpm design:rules`, `node "src/app/(dev)/design/gallery/collect-specimens.mjs"`,
`pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm lab:smoke --base http://localhost:3133`
(0 routes failing; both boards under the reading budget), `pnpm lab:demo --board privacy-hero --base
http://localhost:3133` and the same for `album-page` (0 failing; after your sync it also judges the new
step's CLIPPED, UNLABELLED and NO DOCK).

## Questions (what the goal leaves open; a recommended answer each; the Orchestrator relays them and quotes the answer back)

- none yet

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- Head: the handoff commit (this manifest alone) on top of `2c3cc12a`, pushed. Synced once, a merge:
  `2c3cc12a` (`origin/launch-prep` had moved: the gallery-width merge `3a519e0d`, the ghost-wiring
  manifest, and the Orchestrator-seat-in docs `3bb7370d`/`cffd16d3`); resolved keep-both in
  `registry.ts`, `boards.ts` and `touchpoints.ts` (this lane's two boards at the head, `gallery-width`'s
  lines kept, unreordered), then `pnpm design:rules` regenerated `docs/design/library.md` on the merged
  tree rather than hand-merging it.
- Gates on the synced tree, each step's own exit code (all 0): `design:rules` (no drift), `collect-specimens.mjs`
  (116 specimens/89 entries, no drift), `typecheck`, `lint` (8 known warnings, 0 errors), `test` (2162 passed,
  231 files), `build` (254 pages), `lab:smoke` (214 checks, 0 failing; privacy-hero 449 words, album-page 483
  words, both under the 1200 budget), `lab:demo --board privacy-hero` (4 steps, 0 failing) and
  `--board album-page` (4 steps, 0 failing).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = `docs/design/library.md` (generated),
  `src/app/(dev)/design/(shell)/lab/boards.ts`, `src/app/(dev)/design/sandbox/registry.ts`,
  `src/app/(dev)/design/touchpoints.ts` (the three registration files, keep-both resolved), every file under
  `src/app/(dev)/design/sandbox/privacy-hero/` and `src/app/(dev)/design/sandbox/album-page/`, and this manifest.
  Nothing outside owned paths, the registration lines or the generated files.
- Each decision, one line, numbers off the engine (`spirals.ts` / `margins.ts`), measured against the home
  hero's 40 px/s and 1250 ms (desktop) / 1350 ms (phone):
  - **privacy-hero pace** (home / under / over, home recommended): home is the home hero's own clock, 857 ms
    between pairs at the half gap; under is 30 px/s and 1143 ms; over is 53 px/s and 643 ms. Pairwise pixel
    difference 14-19% at 1440, 19-25% at 375 (all three visibly distinct).
  - **privacy-hero gap** (half / edge / overlap, half recommended): 857 ms / ~10 lit, 547 ms / ~16 lit, 408 ms
    / ~21 lit at pace=home. 15-18% pairwise at 1440, 25-28% at 375.
  - **privacy-hero trail** (wake / echoes / none, wake recommended): the launch clock is identical across all
    three (trail never touches it, confirmed off `spirals.ts`); the difference is only the rendering behind
    each frame (wake's smear, echoes' two fading copies, none's plain frames). 7-14% pairwise at 1440, 18-24%
    at 375, matching what the words claim.
  - **privacy-hero at a phone** (spirals / cones, cones recommended): 375-only by design (the desktop
    composition does not vary on this decision). 15.8% pixel difference; cones keeps both strips full where
    spirals empties out mid-turn, confirmed visually at 375.
  - **album-page visual** (live / filling, live recommended): 28.4% pixel difference at 1440, 30.5% at 375.
  - **album-page motion** (stream / arrivals / arch, stream recommended): stream matches the home hero's own
    clock exactly (40 px/s, 1250/1350 ms); arrivals lands one photo every 1250 ms with nothing travelling;
    arch is a slower procession (a frame every 3598 ms) and needs a taller frame (1450 vs 1380 px desktop,
    1169 vs 1161 px phone) since its photographs arc above the headline. All three visibly and structurally
    distinct.
  - **album-page light** (pool / none / halo, pool recommended): 4.6-13.9% pairwise pixel difference; pool is
    the reel's pooled-light recipe under the fade, halo lights the frame's rim instead, both confirmed visually
    distinct from no light.
  - **album-page a second light** (none / floor / room, floor recommended): 7.4-16.7% pairwise pixel
    difference; floor's warm glow at the dark-chapter-to-paper seam is visible in the capture.
- Reduced motion, the resting frame: privacy-hero is genuinely still (byte-identical across repeated captures)
  once its documented `REVEAL_MS` 1750 first-paint fan-in settles (2-6 s in this run). album-page's own
  field/light engine is equally gated (a direct DOM audit under `prefers-reduced-motion: reduce` found zero
  elements anywhere in the frame carrying a live CSS animation, at every sampled instant), but the **visual=live**
  option does not reach a fixed byte image for several seconds in local dev, because `GuestMasonry` is loading
  real photographs and `useSampledPaletteFromDom` samples their true colours once, after they paint; the
  **visual=filling** alternative is pixel-perfect stable (0.000% diff) under the same conditions across a 13 s
  window, isolating the cause to real-image load timing rather than to any animation this lane declares. Both
  are shared code outside this lane's `owns` (`src/components/guest/guest-masonry.tsx`,
  `src/lib/shared/sampled-palette.ts`), so left unfixed here; noting it rather than guessing further.
- Captures (paths, never committed): every option of every decision at 1440 and 375, beside its option's words,
  under `/private/tmp/partyreel-captures/heroes/privacy-hero/` and `/private/tmp/partyreel-captures/heroes/album-page/`
  (42 PNGs plus `manifest.json` listing each file against its option, label and caption). Filenames:
  `<board>.<decision>.<option>.<1440|375>.png`.
- Assets requested from Will: none (every image is the Higgsfield month's; an ask names the slot, never the picture).
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Look at first: `privacy-hero.pace` (it stages every other privacy-hero decision) and `album-page.motion`
  (the three kinds are genuinely different in kind, per his ask, and the least "obviously right" of the eight).

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). Two question-first boards on one field engine, paced against the
home hero: `privacy-hero` recut "the field" as two opposite spirals (pace, gap, trail, a phone answer, four
decisions) and `album-page` answered its fourth round (the live album at 896 with its foot faded, three kinds
of subtle motion around the headline, its own pooled light, and a second light rising from the dark chapter's
floor). Both boards drawn at 1440 and 375 with `defineExploration`, every option a real `Frame` at its true
size; the gate green (2162 tests, 254 pages, `lab:smoke` and `lab:demo` both 0 failing) and every tile measured
against its words. Left open: the "live" album visual's real photographs take several seconds to settle their
colour sample in local dev (shared `GuestMasonry`/palette code, not this lane's engine); noted for whoever
next touches that path.
