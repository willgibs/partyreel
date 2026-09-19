---
track: album-wiring
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "97207988"         # the launch-prep SHA the branch was cut from
board: album-motion     # NEW, round one, drawn on the wired hero; album-hero and album-page RETIRE here
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/marketing/sections/features/album/
  - src/app/(marketing)/(cinema)/features/album/page.tsx
  - src/components/shared/album-stream/
  - src/app/(dev)/design/sandbox/album-hero/
  - src/app/(dev)/design/sandbox/album-page/
  - src/app/(dev)/design/sandbox/album-motion/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/design/rulings.md
  - docs/design/guidance.md
  - docs/systems/design-system.md
  - docs/reviews/album-hero.json
  - docs/reviews/album-page.json
  - src/components/marketing/system/page-hero.tsx
  - src/components/marketing/system/section-light.tsx
  - src/components/marketing/system/screen-lamp.tsx
  - src/components/marketing/sections/home/hero-stream.ts
  - src/components/marketing/sections/home/cinema-close.tsx
  - src/components/marketing/frames/browser-frame.tsx
  - src/components/shared/glow.tsx
  - src/components/shared/backdrop/photo-section.tsx
  - src/components/guest/guest-masonry.tsx
  - src/lib/shared/sampled-palette.ts
  - src/app/(dev)/design/sandbox/privacy-hero/field.ts
---

# lp/album-wiring

**Goal.** Wire the album feature page's hero from two ruled boards, and draw the motion's variations on the
wired hero. Album-hero round three (`docs/reviews/album-hero.json`): `album-width=w880` (the site's 896 step, the
board's own context: no one-off width), `headline=lg`, `no-script=settled`, `copy=page`; its `composition` came
back none and is replaced by album-page's picks. Album-page round one (`docs/reviews/album-page.json`, 2026-09-18):
`visual=live` ("The real guest album under the host's own header: the masonry, three columns at 896 and two at
a phone, the Live now pill"), `motion=stream` ("Small photographs appear beside the words and glide down into
the album's top edge: a pair every 1250 ms at the home hero's speed"), `light=halo` ("The Glow halo, lighting
the frame from behind so its rim and chrome glow while the photographs stay clean"), `second=floor` ("The
quality section lit from its bottom edge, where the dark chapter turns to paper"). His words, verbatim in
`docs/design/rulings.md` ("the second batch"): on `light`, "This is gorgeous and a beautiful delight to make the
photos falling into the album feel more infused"; on `second`, "the paper chapter directly beneath and the
brightness from his white overwhelms the aurora here and makes it less noticeable. Would work much better with a
full image background section beneath so it feels like it's glowing from that, with a less harsh contrast at
the transition"; on `motion`, "I like the direction, but this animation can definitely be improved", and when
asked what improved means: "I love the images falling into the album. I was just curious to see maybe two to
three variations of this concept to get an idea of what the best version is. No specific direction on what
improvement means here yet." On `visual`: "We will replace the album media before launch, likely with Higgsfield
generations" (ASSETS row 22; the slot is named, never the pictures). Production bytes: the red-team lands on
the alias. Both old boards RETIRE here (`docs/PROGRAM.md`: a kept idea lands in the Library as a working version
and the board retires).

**What to build.**

1. The hero (`arrivals-hero.tsx`): a live-album stage in place of `ArrivalsStage`, built like the sandbox's
   `LiveAlbum` (`sandbox/album-page/visual.tsx`): `GuestMasonry` inside a `BrowserFrame` with the host header and
   the Live pill at 896, the column count driven from OUTSIDE (`--apg-cols`, the sandbox's own doctrine; you never
   edit `guest-masonry.tsx`, which `gallery-wiring` owns this round), the foot dissolved as the board drew it.
   `arrivals-stage.tsx` retires unless a reason to keep it is written down.
2. The stream, into `PageHero`'s existing `backdrop` slot: the arithmetic of `sandbox/album-page/margins.ts`
   promoted to `src/components/shared/album-stream/` with its contract, graded against `hero-stream.ts`'s `BEAT`
   and `FLIGHT` by IMPORT, never re-typed; what the stream borrows from `sandbox/privacy-hero/field.ts` and
   `field-layer.tsx` is promoted with it (that board is being replaced; nothing else will read it); the
   sandbox's `page.css` rules become a real stylesheet (no keyframes: `keyframe-uniqueness.test.ts`).
3. The halo: a small wrapper on `Glow shape="halo"` (`glow.tsx` already types it) behind the frame, the rim and
   chrome lit, the photographs clean; the colour from `useSampledPaletteFromDom`. `ScreenLamp` leaves THIS hero
   only (the placement test refuses a lamp inside an `overflow-hidden` ancestor: respect it in the wrapper).
4. The floor: `quality-section.tsx` wrapped in `SectionLight placement="bottom"` as `cinema-close.tsx` does; then,
   per his note and the chapter-transition ruling, a `PhotoSection` (`src/components/shared/backdrop/`) inserted
   as its OWN section in `page.tsx` between `QualitySection` and `PaperChapter`, its pool the room frames'
   stand-ins, so the aurora reads as glowing from the photograph and the cut to paper is not hard. If you find a
   better shape for the two together, write it under Questions with a recommendation and build it.
5. The board `album-motion`, round one, in `sandbox/album-motion/`: two or three variations of the falling-in
   drawn ON THE WIRED HERO (the production component with a variant parameter), each a real difference he can
   name (for instance: the arc and settle of the glide, the pair's spacing and the beat, the size at birth and
   at landing, whether a photograph lands or dissolves into the top edge), the shipped one among them, with a
   recommendation and every number stated from measurement; his pick lands as a parameter change.
6. Retire `album-hero` and `album-page`: the directories deleted, their lines removed from `registry.ts` and
   `boards.ts`, their RULINGS rows in `touchpoints.ts` rewritten as shipped (grep `shipped:` for the precedent),
   never deleted; the new board registered at the HEAD of the same lists. A Library entry for the live-album
   stage and the halo in `gallery-demos.tsx` (add your entry at the head of the file and touch nothing else
   there: two other lanes add theirs the same way this round, and the Orchestrator keeps both at the merge; the
   same rule for your `for` lines in `rules/component-notes.ts`).

**Binds.** Bible 1, 4, 13, 14, 22; `page-hero-contract.test.ts` and `marketing-h1-policy.test.ts` (the h1 never
moves, never reveal-gated); the glow contract and placement tests; `section-light.test.ts`;
`use-album-fill.test.ts`; the guidance's craft stack; no em-dashes; the copy is open and unchanged (`copy=page`).

## Verify, and the gate

- Each step its own exit code, pasted into Handoff: `pnpm design:rules`,
  `node "src/app/(dev)/design/gallery/collect-specimens.mjs"`, `pnpm typecheck`, `pnpm lint` (the 8 known
  warnings), `pnpm test`, `pnpm build`, `pnpm lab:smoke --base http://localhost:3131` (with `DESIGN_PREVIEW_KEY` in
  the environment, never on a command line), `pnpm lab:demo --board album-motion`.
- Measured on the real page at 1440 and 375: the stream's beat against the home hero's, the frame cost under a
  4x throttle, the decoded weight of the album's media and the photograph section's pool, reduced motion (the
  settled composition, no rAF), scripting off (the composition at rest, `no-script=settled`), nothing focusable in
  the stage's decoration, the halo's contrast against the frame, the h1 unmoved.
- The screenshot gate: the hero beside the home hero at 1440 and 375; the crossing from the floor to the
  photograph to paper.

## Questions (what the goal leaves open; a recommended answer each; the Orchestrator relays them and quotes the answer back)

- **Where the two compositions swap.** At 1440 the photographs are born in the empty room BESIDE the words;
  at a phone the words fill the column, so they are born in the strip UNDER them. The swap is at 1280, not
  the home hero's 1024, because the lockup holds one 768 px measure at every width and at 1024 that leaves
  128 px a side, narrower than one frame: every photograph would have to cross the words to exist. So a small
  laptop (1024 to 1279) gets the phone's composition, which reads modest there. **Recommended: keep 1280.**
  The alternative is narrowing `PageHero`'s lockup on small laptops, which is a change to every page that
  uses it. Built as recommended.
- **Whether the cut to paper is soft enough now.** His note asked for "a less harsh contrast at the
  transition"; a bare `PhotoSection` now stands between the quality section and the paper chapter, at three
  scroll steps so a thumb lands on the pool's brightest frame right before the white. The photograph → paper
  edge is still a hairline. **Recommended: as built** (the photograph is what carries the crossing; the
  ruling asks for that and nothing more). If it still reads hard, the next move is `PhotoSection` growing an
  optional foot that dissolves into the ground beneath it, which is a change to a shared component and
  another lane's file. Built as recommended.
- **The album's columns are now the PRODUCT'S, not the stage's.** An earlier draft drove the count from
  outside; `gallery-wiring` landed on the same tree and the guest album now asks for columns of about 220 px,
  which at 896 gives exactly the three columns of 287 his `visual=live` note describes. The override is
  gone, so the marketing stage cannot draw an album the product does not. **Recommended: keep it derived**;
  if the tile control (`gallery-controls`) ever moves `--album-column`, this stage moves with it, which is
  the point. Built as recommended.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- `docs/systems/design-system.md`: the chapter-rhythm fact gains the album page as the second instance of a
  full-image section at a chapter cut (one clause).

## Deferred (ROADMAP one-liners, bucket named)

- **Now**: The album stage's stand-in stills decode at about 2 MB each into a 287 px tile: `MediaTile`
  serves the source file straight (a real guest tile is a server-sized preview, and a marketing still has no
  derivative), so the hero's album is 16.8 MB decoded. The asset ask below is half the fix; a derivative for
  marketing stills is the other half.
- **Now**: `HERO_FIXTURES` / `HERO_FRAME_H` / `HERO_SEED_COUNT` (`album-fill-fixtures.ts`) lost their last
  production home with `arrivals-stage.tsx` and now serve only `use-album-fill.test.ts`; fold that test onto
  the EVERYWHERE set, or delete both, when `useAlbumFill` loses its last home too.
- **Now**: `glow-placement.test.ts` refuses `overflow-hidden` on a lamp's own wrapper, but globals.css's
  halo block REQUIRES a halo to be clipped to the object it backlights; the album's halo satisfies both with
  `clip-path: inset(0 round ...)`. Either except `shape="halo"` in the test or name `clip-path` as the halo's
  own mechanism, so the next halo does not have to rediscover it.

## Handoff (replaces the chat report)

**Head:** `af5dc983` on `lp/album-wiring` carries every line of the work; the branch tip is the one commit
after it that writes this SHA down. **Synced TWICE, never rebased.** The first sync took 15 commits at
`01c5ae23`; `origin/launch-prep` then moved 7 more while this lane was finishing (`gallery-wiring`,
`trail-wiring`) and the second took those at `af5dc983`, on top of `89548cbb`. Six registration files
conflicted across the two syncs and every one was resolved so BOTH intents survive:

| file | resolution |
| --- | --- |
| `sandbox/registry.ts` | `ALBUM_MOTION` stays at the head; `GALLERY_WIDTH`, `IMAGE_TRAIL`, `ALBUM_HERO` and `ALBUM_PAGE` all stay removed |
| `(shell)/lab/boards.ts` | the same, on the component map and its imports |
| `touchpoints.ts` | `SandboxId` keeps `album-motion` and loses all four retired ids; the three RULINGS rows are additive |
| `library/components/gallery-demos.tsx` | both lanes' entries at the head, `album-stream` then `trail` (git cut my entry's closing braces at the conflict boundary; they were put back by hand) |
| `rules/component-notes.ts` | both lanes' `for` lines at the head under the trail lane's comment, which explains the convention for all three |
| `docs/design/library.md`, `gallery/specimens.generated.json` | generated, so regenerated rather than hand-merged |

The trail lane's repoints of three `sandbox/privacy-hero/` files at `src/components/shared/trail/` came
through untouched, and the whole gate was re-run on the synced tree.

**The gate, each on its own exit code, on the synced tree**

| step | exit | note |
| --- | --- | --- |
| `pnpm design:rules` | 0 | 700 contracts on 53 components |
| `node "src/app/(dev)/design/gallery/collect-specimens.mjs"` | 0 | 128 specimens on 93 entries |
| `pnpm typecheck` | 0 | |
| `pnpm lint` | 0 | the 8 known warnings, none new |
| `pnpm test` | 0 | 2,509 passing |
| `pnpm build` | 0 | dev server killed by port first |
| `pnpm lab:smoke --base http://localhost:3131` | 0 | 265 checks, 0 failing; `album-motion` 237 words of 1200 |
| `pnpm lab:demo --board album-motion` | 0 | 1 step, 3 options, the stage moves by up to 7.49%, 3.6 screens |

After the second sync the page re-measured unchanged: the hero's foot to the album's top edge is still
750 px at 1440, the masonry still draws three columns of 287, both stream layers still put 24 frames in the
DOM, and the h1 still sits at 184 and does not move.

**The lane check** (`git diff --name-only origin/launch-prep...HEAD`), every line inside `owns`, the
manifest, the one listed system doc, or the registration exception:

```
docs/design/library.md                                          generated artifact (design:rules)
docs/systems/design-system.md                                   the one listed system-doc edit
docs/tracks/album-wiring.md                                     this manifest
src/app/(dev)/design/(shell)/lab/boards.ts                      registration: album-motion in, four out
src/app/(dev)/design/(shell)/library/components/gallery-demos.tsx  registration: my entry beside the trail lane's
src/app/(dev)/design/gallery/specimens.generated.json           generated artifact (collect-specimens)
src/app/(dev)/design/rules/component-notes.ts                   registration: my two `for` lines beside the trail lane's
src/app/(dev)/design/rules/rules.generated.json                 generated artifact (design:rules)
src/app/(dev)/design/sandbox/album-hero/**        (9 deleted)   owns
src/app/(dev)/design/sandbox/album-page/**        (8 deleted)   owns
src/app/(dev)/design/sandbox/album-motion/**      (3 added)     owns
src/app/(dev)/design/sandbox/registry.ts                        registration: album-motion in, four out
src/app/(dev)/design/touchpoints.ts                             registration: the unions and three RULINGS rows
src/app/(marketing)/(cinema)/features/album/page.tsx            owns
src/components/marketing/sections/features/album/**  (5)        owns
src/components/shared/album-stream/**             (5 added)     owns
```

**The items, one line each**

1. **The hero** (`arrivals-hero.tsx`) is the `PageHero` lockup at the `title` step over the LIVE guest album,
   with the stream in the `backdrop` slot; `arrivals-stage.tsx` is deleted.
2. **The stage** (`live-album-stage.tsx`) is `GuestMasonry` under the host's own header in a `BrowserFrame`
   at `max-w-4xl` (896), `inert` and `aria-hidden`, its foot dissolving under a mask.
3. **The stream** (`src/components/shared/album-stream/`) is a pure engine with its `@contract-for` test, a
   layer component with its own, and a sheet: the board's two fixed canvases are gone, a horizontal is
   AFFINE in the hero's half-width and a vertical is px from the album's own top edge.
4. **The halo** is a small `Glow shape="halo"` wrapper over the frame's own card background, clipped to the
   object's silhouette with `clip-path` rather than `overflow` (so `glow-placement.test.ts` is respected,
   not dodged); `ScreenLamp` leaves this hero.
5. **The floor** is `SectionLight placement="bottom" reach="58%"` inside `quality-section.tsx`, and a bare
   `PhotoSection` at three scroll steps stands between it and the paper chapter in `page.tsx`.
6. **The board** `album-motion` is one decision with three whole variations drawn on the WIRED hero at 1440
   and 375; `ArrivalsHero` takes a lab-only `variant` the way `PhotoSection` takes `source`.
7. **The retirement**: both directories deleted, both RULINGS rows rewritten as `shipped`, a Library entry
   for the stream and the album it falls into at the head of `gallery-demos.tsx`.

**The measurements** (headless Chrome over CDP against `pnpm dev -p 3131`; the engine's own numbers from its
contract test)

- **The beat, against the home hero's:** a pair every **1250 ms** at `lg` (the home hero: 1250) leaving at
  **40 px a second** (the home hero's own launch speed, read by import) and never exceeding **187** (glide),
  **205** (gather) or **174** (cascade) against the home curve's ~212 at the edge of its flight; **12 lit at
  the busiest instant** (the home hero: 12). At a phone a pair every **2700 ms**, which is TWO of the home
  hero's 1350 beats and the one place the reference is not followed exactly: a phone's fall is about 200 px
  against 500, so one beat would put frames half a frame apart the whole way down.
- **The frame cost under a 4x CPU throttle** at 1440: **16.7 ms median and 16.7 ms p95** over 149 frames, a
  full 60 fps with nothing to spare given away.
- **The decoded weight** at 1440: the stream **1.0 MB** (24 frames, both breakpoint layers in the DOM), the
  album's masonry **16.8 MB** (8 of 12 tiles decoded), the photograph section's pool **1.2 MB** at rest (one
  frame decoded; all six are in the DOM from the first paint), the whole page **19.9 MB**. The album is the
  cost, and it is the asset ask below.
- **Reduced motion:** not one `requestAnimationFrame` is asked for (pinned in `album-stream.test.tsx`); the
  settled composition is what stands.
- **Scripting off:** 24 stream frames and 12 album tiles are in the server HTML, each carrying its resting
  transform and opacity as custom properties the sheet paints (`no-script=settled`).
- **Nothing focusable in the decoration:** `.alb-stage` is `inert` and `aria-hidden`; calling `focus()` on a
  masonry tile leaves `document.activeElement` on `BODY`. The stream layer holds no focusable node.
- **The halo's contrast** (the same clip shot twice, with the lamp and with it hidden, under reduced motion
  so only the lamp differs): the frame's **rim +15.5** of 255 (34.3 → 49.8, +45%), its **chrome +6.8**
  (31.9 → 38.7, +21%), the **photographs +1.5** of 89.5 (**+1.6%**). Which is his ask in numbers: the rim and
  the chrome glow, the photographs stay clean.
- **The anchor holds:** the distance from the hero's foot to the album's top edge measures **750 px at 1280,
  1440 and 1920**, exactly `STAGE.lg.h + STAGE.lg.floor`, so the photographs land on the edge that is drawn.
- **The keep-out is conservative:** the lockup's real painted ink is **291 px** half-width at 1440 and 1920
  and **365 px** at 1280, against the 384 px column the engine keeps clear, so a rewrite of the copy (bible
  21) cannot invalidate it.
- **The h1 has not moved:** top 184 at 1440, static, never reveal-gated; `page-hero-contract.test.ts` and
  `marketing-h1-policy.test.ts` green.

**The screenshot gate.** The album hero beside the home hero at 1440 and at 375: one family (a black ground,
photographs in motion, a centred lockup), two sentences, and they are not the same one: the home's file leaves the code, the album's falls
INTO an album. The album page is the quieter of the two, which is right for a feature page under the home.
The crossing from the floor light through the photograph to paper reads as one move rather than a cut.

**Assets asked for**

- **ASSETS row 22** (the album page's media, already open): please deliver the album's photographs at about
  **600 px on the long edge** as well as full size. The stage draws each one at 287 px, and `MediaTile`
  serves a source file straight, so a 900 px still costs about 2 MB decoded for a quarter of the pixels.

**System-doc edits:** one, listed below.

**Look at first:** `/features/album` at 1440 (the words clear, the photographs falling behind the album's
edge), then at 375 (the strip under the words), then the crossing from the quality section's floor light
through the photograph to the paper chapter, then `/design/lab/album-motion`.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

The album page's hero was wired from two ruled boards (`<sha>`): the live guest album under the host's own
header at the scale's 896 step, its foot dissolving, lit from behind by the Glow halo so the rim and chrome
gained 45 and 21 per cent while the photographs gained 1.6, and photographs falling out of the room around
the words into its top edge at the home hero's own pace. The stream left the lab as
`src/components/shared/album-stream/`, a pure engine with its contract: the board's two fixed canvases were
replaced by a horizontal affine in the hero's half-width and a vertical in px from the album's own edge, so
one table is right at every window and nothing is measured at runtime. The quality section took the Aurora at
its floor and a bare photograph section was stood between it and the paper chapter; `album-motion` opened
with three whole variations of the fall drawn on the wired hero, and `album-hero` and `album-page` retired.
