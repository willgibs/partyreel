---
track: album-wiring
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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

- (fill)

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- `docs/systems/design-system.md`: the chapter-rhythm fact gains the album page as the second instance of a
  full-image section at a chapter cut (one clause).

## Deferred (ROADMAP one-liners, bucket named)

- (fill)

## Handoff (replaces the chat report)

- (fill: the head SHA, the gates on the synced tree, the lane check pasted, the items one line each, the
  questions and their answers, the measurements, assets, system-doc lines, deferred lines, look at first)

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

(fill)
