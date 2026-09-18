---
track: image-trail
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "ef044ee8"         # the launch-prep SHA the branch was cut from
board: image-trail      # round one; PLUS privacy-hero round two, on the same engine
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/image-trail/
  - src/app/(dev)/design/sandbox/privacy-hero/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/design/rulings.md
  - docs/design/guidance.md
  - src/app/(dev)/design/sandbox/gallery-width/spec.ts
  - src/components/lab/exploration.ts
  - src/components/marketing/sections/home/hero-stream.ts
  - src/lib/constants/marketing-media.ts
  - src/lib/shared/use-prefers-reduced-motion.ts
  - src/components/shared/river/river-engine.ts
  - src/components/shared/river/river.tsx
---

# lp/image-trail

**Goal.** Two boards on ONE engine. (a) `image-trail`, round one: our OWN cursor-tracking image trail,
written from scratch with the Codrops "Image Trail Effects" demo one as the reference
(https://tympanus.net/Development/ImageTrailEffects/index.html; source github.com/codrops/ImageTrailEffects,
`js/demo.js`), drawn on real marketing homes so Will can pick where it lives, or bank it. (b)
`privacy-hero`, round two: the board on the desk answered NONE; recut it tighter (the photographs
overlapping), faster, with the trailing photographs DECAYING behind the leader the way demo one's do (fade
and shrink), on the same engine. His words (`docs/design/rulings.md`, 2026-09-18 "the privacy hero: none"):
"Let's rework these explorations to be tighter with images effectively overlapping, a bit faster pace and a
polished image trail behind, like the attached screenshots" and "Let's create our own cursor tracking
version of this effect in the lab as well, to hopefully be used on the marketing site somewhere, else bank
for later. If the hero explorations don't pan out, maybe it can serve as one instead." The bind on
everything you draw: "I think this crisp media motion design is going to be the foundation of our visual
identity." Also his correction of round one's brief: "decaying trail" meant the trailing IMAGES decaying,
never a separate trail drawn behind the path.

**The reference, read once** (its numbers calibrate the first options; nothing is copied). Demo one: a
pool of photographs cycles; a new one is shown each time the cursor has travelled 100 px from where the
last was born; it appears at the LAGGED cursor (a lerp of 0.1 per frame toward the real cursor) at opacity
1 and scale 1 with a rising z-index, slides to the real cursor over 0.9 s (expo-out), and from 0.4 s fades
to 0 over 1 s (quad-out) while shrinking to 0.2 over 1 s (quint-out); the z-index resets when nothing is
active. That is the whole effect: density is the travel threshold, pace is the slide, the decay is the
fade-and-shrink. Will's two screenshots of it are the look: portraits about 180 to 260 px wide, tightly
overlapping along the path, the newest on top, the oldest small and gone.

**What the engine is.** One pure module in `sandbox/image-trail/` (`trail-engine.ts` with tests, the
river's shape: pure functions a layer renders): a pool, a birth rule, a lifecycle per card (born, sliding,
decaying, gone), fed by a SOURCE of positions. Two sources: the pointer (the trail) and a PATH walked on its
own at a pace, so the privacy hero is the same trail fed by a path instead of a cursor. No new dependency
(no GSAP): rAF and CSS; `prefers-reduced-motion` honoured with a still composition; nothing focusable;
paused off screen (IntersectionObserver); the pointer listener passive; no layout read per frame.
Photographs come from the site's own pool (`STREAM_FRAMES` through `marketingImage`); the Higgsfield month
replaces them later, so an ask names the slot, never the picture; nothing from Codrops enters the repo.

**Binds.** Bible 1 (media is the colour), 13, 14, 22; the guidance's boards section; `defineExploration`
with `gallery-width/spec.ts` as the worked example; the 1,200-word reading budget; `lab:demo` fails
CLIPPED, UNLABELLED and NO DOCK; `docs/PROGRAM.md` "A round returns DECISIONS": options are never forced
apart. Mobbin is encouraged, never required.

## What was built

**The engine** (`sandbox/image-trail/trail-engine.ts`, 24 tests). A card's whole life is decided at birth,
so its frame is a CLOSED FORM of its age: the server, a node test and the browser compute the same pixels,
and there is no per-frame integration to drift. The source is an interface, which is the whole reason two
boards share one engine: `advance` never asks where a sample came from, so the pointer feeds it a cursor
and `privacy-hero` feeds it a path. The still is a `replay` of a declared path, and the live loop is SEEDED
from it, so the rest state, reduced motion, scripting off, the headless capture and the loop's first frame
are one picture. The pool is a ring with a design ceiling of 24 nodes. One rAF loop writing inline
transforms, one stylesheet with no keyframe.

**Two inventions beyond the reference**, both in the engine and both named on the board:

- **The keeper** (the creative delight, in `image-trail`'s context, one number in `advance`): while the
  source rests, the newest photograph does not decay. It holds, lit, under the cursor until you move again.
  A pure cursor trail leaves an EMPTY hero for every reader who has not moved yet, which is fine for a demo
  and fatal for a first screen; it also means the reader discovers they are carrying a photograph.
- **The shy fade**: where a photograph OVERLAPS the lockup it fades to a fifth and comes back over its own
  edge, so the trail reads as passing behind the words. The house answer to media under type (measure a
  clear lane, put the words outside it) is unavailable when the lane is wherever the cursor is, and a scrim
  over the photographs is what bible 1 refuses, so the photograph yields instead. Every home's box is
  measured on its rendered block. It is a departure worth naming and it is Will's to kill (question 3).

**`image-trail`, round one**: six decisions (`density`, `decay`, `entrance`, `size`, `home`, `phone`), each
drawn as a WHOLE SCREEN of the real site at 1440 and 375 in true `Frame` viewports, with the home as a
shared dock knob (the `gallery-width` pattern) so any number can be judged over cinema or over paper at any
point. The four homes are the privacy hero, the home page's last screen, the 404 (the one on paper, which
is how dark and light are chosen separately here) and banked. The pointer is scripted for every still and
every capture, and live on the desk.

**`privacy-hero`, round two**: the mechanism is REPLACED, not retuned. Round one emitted particles from a
turning nozzle and drew a wake beside them; "a decaying trail of the trailing images" is not something you
add behind that, it is what a trail is. Two points now sweep out of the lockup's rim on the same engine and
every photograph either leaves fades and shrinks where it lies. `pace`, `gap`, `trail` and `phone` keep
their ids so the ledger joins; `wake`, `echoes` and `none` left with the mechanism, and so did
`spirals.ts`. A fifth decision asks the figure (the two arms, or the wander). `field.ts`, `field-layer.tsx`
and `field.css` were left exactly as they were, because `album-page` reads them.

## Questions (what the goal leaves open; a recommended answer each; the Orchestrator relays them and quotes the answer back)

1. **`docs/reviews/privacy-hero.json` does not exist, and round two cannot be green without it.**
   `registry.test.ts` refuses a board past round 1 with no ledger entry, and privacy-hero's round-one
   verdict arrived as prose in chat rather than as a desk paste: it is verbatim in `rulings.md` and nowhere
   in the ledger. `docs/reviews/` is never owned by a track, so this lane may not write it.
   **Recommended:** the Orchestrator transcribes the verdict that really happened, before the merge:
   `pnpm lab:review 'review privacy-hero r1: note: "I just started my review with the new privacy and trust
   hero. None feel right. I think the density needs to increase as well as the speed. Also, when I said
   decaying trail, I meant of the trailing images, not an actual separate trail effect."'`
   That is the one red assertion in the gate below, and it goes green the moment the file exists.
2. **The keeper: ship it or kill it?** It is on in every option of `image-trail` and named in the board's
   context. **Recommended:** keep. It is the difference between an effect and a hero, it costs one number,
   and a first screen that is blank until a hand moves is not a first screen. Killed, the trail is the
   reference's exactly.
3. **The shy fade over the words: is a photograph that goes to a fifth over the headline acceptable?** It
   is a real departure (the trail is not whole everywhere) and the alternative is a hero whose eyebrow is
   unreadable, which is what the first capture showed. **Recommended:** keep, at a fifth. If it reads as a
   photograph being switched off, the floor rises and the type takes weight instead.
4. **Is the 404 a place to spend delight?** It is the only light-ground home and the most charming of the
   four captures, but it is a page nobody plans to see. **Recommended:** it is part of the `home` answer
   rather than a question of its own; if two homes win, the 404 is the cheap one to also do.
5. **`privacy-hero`'s pace recommendation moved to the faster option.** Round one recommended the home
   hero's own tempo and came back none, so recommending "a notch over" would have repeated the mistake at a
   smaller scale. **Recommended:** `rush` (two notches over): 14 photographs on screen against the home
   hero's 12, arriving three times as often as round one's, which is "the density needs to increase as well
   as the speed" answered in both halves.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- None. Lab-only, as expected: the engine's facts live in `trail-engine.ts`'s own header until a wiring
  lane moves it to `src/components/shared/`, beside the river.

## Deferred (ROADMAP one-liners, bucket named)

- **Design system:** `defineExploration` should dedupe its flattened `configs` by id. Three boards now
  (`gallery-width`, `body-type`, `image-trail`) carry the same six-line filter after the constructor.
- **Design system:** `field.ts`'s `TrailSpec`, `field-layer.tsx`'s trail rendering and `field.css`'s
  `.fld-smear` / `.fld-ghost` are dead now that `spirals.ts` has gone; only `album-page` still reads that
  module, and it draws no trail. A lane that owns `album-page` should cut them.
- **Marketing:** the trail wants the Higgsfield set. Twelve stand-in photographs fill 24 ring slots, so at
  the densest option a photograph is on screen twice at once; 24 distinct frames would end that.

## Handoff (replaces the chat report)

**Head:** `6802e081` on `origin/lp/image-trail`, a merge of `origin/launch-prep` at `df173c2e`
(milestone-26). `launch-prep` had moved 21 commits, so everything below is the SYNCED tree.

**The gate, each step on its own exit code, on the synced tree:**

| step | exit |
| --- | --- |
| `pnpm design:rules` | 0 |
| `node "src/app/(dev)/design/gallery/collect-specimens.mjs"` | 0 |
| `pnpm typecheck` | 0 |
| `pnpm lint` | 0 (the 8 known warnings, none of them in this lane) |
| `pnpm test` | **1: ONE assertion, and it is question 1.** 2,407 of 2,408 pass; the failure is `registry.test.ts` "has a review on the record before a board opens a second round" for `privacy-hero`, because `docs/reviews/privacy-hero.json` does not exist and a track may not write it. Both boards are green (67 tests across five files). |
| `pnpm build` | 0 |
| `pnpm lab:smoke --base http://localhost:3135` | 0 (277 checks, 0 failing; `image-trail` 751 words, `privacy-hero` 764, of the 1,200 budget) |
| `pnpm lab:demo --board image-trail` | 0 (6 steps, 0 failing) |
| `pnpm lab:demo --board privacy-hero` | 0 (5 steps, 0 failing) |

**The lane check** (`git diff --name-only origin/launch-prep...HEAD`), every line inside `owns` or the
registration exception:

```
docs/design/library.md                                generated by pnpm design:rules
src/app/(dev)/design/(shell)/lab/boards.ts            registration: one import, one line
src/app/(dev)/design/sandbox/registry.ts              registration: one import, one line
src/app/(dev)/design/touchpoints.ts                   registration: SandboxId, RulingId, one RULINGS row
src/app/(dev)/design/sandbox/image-trail/board.tsx        owns (new)
src/app/(dev)/design/sandbox/image-trail/homes.tsx        owns (new)
src/app/(dev)/design/sandbox/image-trail/looks.ts         owns (new)
src/app/(dev)/design/sandbox/image-trail/looks.test.ts    owns (new)
src/app/(dev)/design/sandbox/image-trail/spec.ts          owns (new)
src/app/(dev)/design/sandbox/image-trail/trail-engine.ts       owns (new)
src/app/(dev)/design/sandbox/image-trail/trail-engine.test.ts  owns (new)
src/app/(dev)/design/sandbox/image-trail/trail-layer.tsx       owns (new)
src/app/(dev)/design/sandbox/image-trail/trail-still.test.tsx  owns (new)
src/app/(dev)/design/sandbox/image-trail/trail.css        owns (new)
src/app/(dev)/design/sandbox/privacy-hero/board.tsx       owns (rewritten)
src/app/(dev)/design/sandbox/privacy-hero/hero.tsx        owns (rewritten)
src/app/(dev)/design/sandbox/privacy-hero/spec.ts         owns (round two)
src/app/(dev)/design/sandbox/privacy-hero/paths.ts        owns (new)
src/app/(dev)/design/sandbox/privacy-hero/paths.test.ts   owns (new)
src/app/(dev)/design/sandbox/privacy-hero/spirals.ts      owns (DELETED)
src/app/(dev)/design/sandbox/privacy-hero/spirals.test.ts owns (DELETED)
```

`specimens.generated.json` and `rules.generated.json` regenerate unchanged by this lane, so they do not
appear. The merge conflicted on exactly the three registration lines, because `admin` was cut the same
evening and its lines go at the head of the same three lists: both sides kept everywhere, never a choice.

**The items, one line each:**

- `trail-engine.ts`: the engine, pure, no new dependency, a closed form per card, a ring pool, a source
  interface, the replay, `factsOf` (the busiest AND the quietest instant), the keeper and the shy fade.
- `trail-layer.tsx`: one rAF loop; seeded from the still; a passive pointer; the box read lazily and never
  in the loop; IntersectionObserver, `document.hidden` and the lab's own pause all hold the CLOCK.
- `homes.tsx`: the privacy hero, the home page's last screen, the 404 on paper and banked, each a whole
  canvas-tall screen of the real site.
- `looks.ts` / `looks.test.ts`: the option tables, the measured lockup boxes, and every figure the board
  states held to what the engine measures.
- `image-trail/spec.ts` and `board.tsx`: six decisions, each drawn at 1440 and 375, the home on every strip.
- `privacy-hero/paths.ts` and `paths.test.ts`: the two arms and the wander as paths, the pace and the gap
  held apart by deriving the source's speed, the lockup keep-out walked over every option.
- `privacy-hero/spec.ts`, `board.tsx`, `hero.tsx`: round two, five decisions, on the real `PageHero`.
- Deleted: `privacy-hero/spirals.ts` and `spirals.test.ts`, with the mechanism they served.

**The measurements** (headless Chrome over CDP, the mechanism `lab-demo.mjs` uses, on `:3135`):

| | image-trail | privacy-hero |
| --- | --- | --- |
| nodes / images / distinct files | 24 / 24 / 12 | 24 / 24 / 12 |
| decoded weight of the pool | about 3.9 MB | about 2.7 MB |
| frames, 1x CPU | 60.3 fps | 60.3 fps |
| frames, **4x CPU throttle** | 60.1 fps, **0 dropped a second** | 59.4 fps, **1 dropped a second** |
| reduced motion | 0 of 24 cards move; 24 drawn, 10 lit | 0 of 24 move; 24 drawn, 12 lit |
| scrolled out of the 930 px viewport | 0 of 24 move (the IntersectionObserver) | 0 of 22 move |
| focusable in the layer | 0, and `aria-hidden="true"` | 0, and `aria-hidden="true"` |

**JavaScript off:** the composition is written during RENDER, never in an effect, so a server render
carries it. `trail-still.test.tsx` server-renders the layer and holds the whole pool, the placed transforms,
the lit opacities and the `sizes` in the markup. The lab cannot show this: a gated `Frame` is deliberately
browser-only (`frame.tsx`: a server-rendered gated iframe would paint a 404 and then reload), so a board
page with scripting off draws nothing whatever the layer does. That is why the claim is a test.

**Captured and checked against the words** at 1440 and 375, every section of both boards, plus the 404 and
the closing chapter pressed by hand. Two bugs were found by eye and both are now pinned:

1. A bright photograph sat on the words PRIVACY AND TRUST and the eyebrow was gone. Fixed by the shy fade,
   and the first fix was wrong in an instructive way: a rule written on the card's CENTRE left exactly the
   card that broke the capture at full strength, because a 240 by 320 photograph whose centre is 255 px
   above the headline still has its bottom third over the eyebrow. Measuring the OVERLAP is correct, and
   softer.
2. The privacy hero's arms climbed to 1,150 px on a 1440 canvas, so each sweep spent half its life off
   screen and the hero went BARE for seconds at a time while the busiest-instant count still read healthy.
   Fixed by holding `rMax` inside the frame, raising the turn to match and putting the two arms half a
   sweep apart; `factsOf` reports the quietest instant now and a test holds a floor under it. The scripted
   hand was too timid as well: at 375 it drew the whole trail behind the words, so the capture showed a
   phone with no trail on it.

**Assets:** none asked for. The stand-in pool is the home hero's twelve through the manifest, so the
Higgsfield month replaces them by id and nothing here changes.

**Mobbin:** not used. The homes are our own pages and the reference was already named by Will; a search
would have been a detour rather than a door.

**Two `lab:demo` warnings, both honest, neither a failure:** on `image-trail.phone`, "it draws itself" and
"a still composition" are the same picture under the reduced motion `lab:demo` emulates, which is precisely
what those two options differ in. On the desk, with motion, one moves and one does not.

**Look at first:** `/design/lab/image-trail` on the desk with a real cursor, at the `home` step, pressing
the four homes with your hand moving over the frame. That is the one thing no capture in this handoff can
show, because a headless browser has no hand. Then `/design/lab/privacy-hero`, which needs no hand at all.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Our own image trail landed as one pure engine and two boards on it (`<sha>`): a photograph born every time
the source has travelled far enough, sliding to it and decaying behind it, written from scratch against
Codrops demo one with no new dependency and the site's own photographs. Because the SOURCE is an interface,
`privacy-hero` round two is the same trail with a path where the cursor would be, which replaced round
one's nozzle and wake with the thing Will actually asked for. Two inventions were added and named: the
keeper, which holds the newest photograph while the hand rests so a hero is never blank, and the shy fade,
which lets a photograph yield to the words it crosses. Two bugs were caught by eye in the captures and both
left tests behind: a card measured by its centre had to be measured by its overlap, and the privacy hero's
arms outran their own tails until `factsOf` learned to report the quietest instant.
