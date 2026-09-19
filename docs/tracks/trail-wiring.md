---
track: trail-wiring
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "97207988"         # the launch-prep SHA the branch was cut from
board: image-trail      # RETIRES here
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/shared/trail/
  - src/app/not-found.tsx
  - src/components/marketing/marketing-not-found.tsx
  - src/app/(dev)/design/sandbox/image-trail/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/design/rulings.md
  - docs/design/guidance.md
  - docs/systems/design-system.md
  - docs/reviews/image-trail.json
  - src/components/shared/river/river-engine.ts
  - src/components/shared/river/river.tsx
  - src/components/shared/backdrop/photo-section.tsx
  - src/lib/shared/use-prefers-reduced-motion.ts
  - src/lib/constants/marketing-media.ts
  - src/app/(dev)/design/sandbox/privacy-hero/paths.ts
  - src/app/(dev)/design/sandbox/gallery-width/spec.ts
---

# lp/trail-wiring

**Goal.** Wire `image-trail` round one (`docs/reviews/image-trail.json`, 2026-09-18) and bank the trail in the
Library. `density=d140` ("140 px: loosely overlapping... the trail reads as a line of separate photographs"),
`decay=long` ("Long: 2 seconds, a slower shrink... keeping a third of its size") with his number: "I'd maybe even
suggest 3 seconds to calm it down just a bit" (three seconds is the build), `entrance=flick` ("Behind it, turned
the way you threw it": "Following the way it was thrown rather than the cursor feels a lot more natural and
fluid. Keeping the image trail behind the cursor also allows better cursor visibility/tracking than keeping the
image directly beneath it"), `size=s180` ("180 px, and 100 on a phone"), `home=notfound` ("The 404... the light
answer: paper ground, dark hairlines"), `phone=walks` ("It draws itself... walking its own path at the same pace,
so the screen is alive the moment it is opened and a finger is never asked for") with "Different path than
current, if that's not a future question I'll encounter". Will called the trail "a takeaway win"; the privacy
hero takes a different concept in another lane, so this lane touches nothing under `sandbox/privacy-hero/`.
Production bytes on the 404: the red-team lands on the alias. The board RETIRES here.

**What exists.** The board's engine (`sandbox/image-trail/trail-engine.ts`, pure, with `looks.ts` holding every
stated number to what the engine measures; the keeper holds the newest photograph while the hand rests, the shy
fade yields to the words it crosses); `homes.tsx`'s `NotFoundHome` is a one-to-one composition of the real
`src/app/not-found.tsx` (paper by ruling, `MarketingHeader`, `MarketingNotFound`, `MarketingFooter`).
`MarketingNotFound` renders `NotFoundScreen` with the compass, the 404 eyebrow, "We lost this page", the two
actions and `MissingFrameStrip`. Today `walks` on a phone replays the capture's scripted sine sweep, the same
path every desktop capture uses: that is the "current" path he wants different. `wanderPath` in the engine (a
deterministic non-repeating random walk, proven at a phone column on the privacy-hero board) is the ready
candidate; a path of your own is fine if it is better, with the reason in the Handoff.

**What to build.**

1. `src/components/shared/trail/`: the engine trimmed to the ruled look (d140, a 3 s decay with the slower
   shrink, flick, 180 px and 100 at a phone), the keeper and the shy fade kept and named, a source interface with
   two sources (the pointer, and a path walked on its own for a phone or a hand that never arrives), two
   contracts (`// @contract-for:` tests that guard function, never look: the pool, the birth rule, the lifecycle,
   the clock stopping at rest, zero layout reads per frame), no new dependency, the pointer listener passive,
   IntersectionObserver and `document.hidden` holding the clock, reduced motion a still composition, scripting
   off the page standing.
2. The 404: the trail behind the page's own words on the paper ground, the words the loudest thing on the
   screen (the shy fade), the photographs from the site's pool through `marketingImage` (ASSETS row 21 replaces
   them later; the slot named). `MissingFrameStrip` stays or yields to the trail: your call, with the reason.
3. The phone's path: a walk of its own (`wanderPath` or better), the same pace, alive the moment the page opens,
   never asking for a finger.
4. The Library entry in `gallery-demos.tsx` with the pointer and the walk demonstrable (add your entry at the
   head of the file and touch nothing else there: two other lanes add theirs the same way this round, and the
   Orchestrator keeps both at the merge; the same rule for `for` lines in `rules/component-notes.ts`).
5. Retire `image-trail`: the directory deleted, its lines removed from `registry.ts` and `boards.ts`, its RULINGS
   row in `touchpoints.ts` rewritten as shipped (grep `shipped:` for the precedent), never deleted.

**Binds.** Bible 1, 4, 13, 14, 22; the 404's paper ruling (2026-08-26); `keyframe-uniqueness.test.ts`; the
guidance's craft stack (a rare moment may carry real delight; exits at most as long as enters); no em-dashes; the
404's copy is open and unchanged.

## Verify, and the gate

- Each step its own exit code, pasted into Handoff: `pnpm design:rules`,
  `node "src/app/(dev)/design/gallery/collect-specimens.mjs"`, `pnpm typecheck`, `pnpm lint` (the 8 known
  warnings), `pnpm test`, `pnpm build`, `pnpm lab:smoke --base http://localhost:3134` (with `DESIGN_PREVIEW_KEY` in
  the environment, never on a command line).
- Measured on the real 404 at 1440 and 375: the busiest and the quietest instant's lit count, the decoded weight
  of the pool, the frame cost under a 4x throttle, zero animation frames at rest with the keeper standing, reduced
  motion (a still), scripting off, nothing focusable, the words' contrast over the trail at its worst.
- The screenshot gate: the 404 beside the home hero at 1440 and 375.

## Questions (what the goal leaves open; a recommended answer each; the Orchestrator relays them and quotes the answer back)

- (fill)

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- `docs/systems/design-system.md`: one clause where the marketing 404 is described.

## Deferred (ROADMAP one-liners, bucket named)

- (fill)

## Handoff (replaces the chat report)

- (fill: the head SHA, the gates on the synced tree, the lane check pasted, the items one line each, the
  questions and their answers, the measurements, assets, system-doc lines, deferred lines, look at first)

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

(fill)
