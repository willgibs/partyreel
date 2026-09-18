---
track: image-trail
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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
own at a pace (the privacy hero: its two spirals, or a better path you propose), so the privacy hero is the
same trail fed by a path instead of a cursor. No new dependency (no GSAP): the Web Animations API or rAF
and CSS; `prefers-reduced-motion` honoured with a still composition; nothing focusable; paused off screen
(IntersectionObserver); the pointer listener passive; no layout read per frame. Photographs come from the
site's own pool (`STREAM_FRAMES` in `hero-stream.ts` through `marketingImage`, the ones `privacy-hero`
already draws); the Higgsfield month replaces them later, so an ask names the slot, never the picture;
nothing from Codrops enters the repo (their license forbids as-is reuse, and their photographs are not
ours).

**Binds.** Bible 1 (media is the colour), 13, 14, 22; the guidance's boards section (answer first, previews
1:1, dark and light chosen separately, the specimen carries the option's name, a question carries its own
context); `defineExploration` with `gallery-width/spec.ts` as the worked example; the 1,200-word reading
budget; `lab:demo` fails CLIPPED, UNLABELLED and NO DOCK; `docs/PROGRAM.md` "A round returns DECISIONS":
options are never forced apart. Mobbin is encouraged, never required (`guidance.md`), for the homes.

## What to build

### `image-trail`, round one (five to seven decisions, each on the real thing)

Suggested, yours to recut: **density** (the travel between births, about 60, 100 and 140 px; he asked for
more density than round one had); **the decay** (how long a photograph lives and how it goes: quick, about
0.9 s with the shrink; lingering, about 1.4 s; long, 2 s with a slower shrink; each measured in the frame);
**the entrance** (born at the lagged cursor and sliding to it, as demo one; born under the cursor and
drifting on; born with a slight rotation off the direction of travel); **the size** (portrait 3:4 at about
180, 240 and 300 px at 1440, and what each means at 375); **the home** (real pages as the stage, two or
three: the privacy page's hero, which is his "serve as one instead"; the home page's closing chapter,
`cinema-close.tsx`; the /features/qr hero; the 404; and "bank it" as an honest fourth); **at a phone** (no
cursor: the trail follows a touch drag; the path source walks on its own; a still field; the answer decides
whether the effect exists on phones at all). Dark and light are asked SEPARATELY where the ground changes
the answer (the photographs over a dark ground and over the paper). Every option is previewed at true size
in the frame with the pointer SIMULATED for the capture and for `lab:demo` (a scripted pointer path, since a
headless capture has no cursor); the desk gets the live pointer.

### `privacy-hero`, round two

Bump `round` to `{ n: 2, date: "2026-09-18", changed: <his note, quoted> }`; keep the decision ids whose
question survives (`pace`, `gap`, `trail`, `phone`) so the ledger joins, and recut their options: the gap
starts at overlapping and goes tighter; the pace a notch and two OVER the home hero; the trail is the
DECAY of the trailing photographs (fade and shrink behind the leader, three timings), never a wake or an
echo; add a decision for the PATH if you propose one beside the two spirals (a wander, the trail's own lerp
fed by a slow random walk, is the natural candidate). Round one's field, spirals and layer are yours to trim
or replace with the tests kept green; the hero is still the privacy page's real lockup with the field
behind it. Remove what round one made obsolete rather than stacking options.

## Verify, and the gate

- Each step its own exit code, pasted into Handoff: `pnpm design:rules`,
  `node "src/app/(dev)/design/gallery/collect-specimens.mjs"`, `pnpm typecheck`, `pnpm lint` (the 8 known
  warnings), `pnpm test`, `pnpm build`, `pnpm lab:smoke --base http://localhost:3135`,
  `pnpm lab:demo --board image-trail --key <key>` and `--board privacy-hero` (0 failing).
- Measured: both boards at 1440 and 375, dark and light; reduced motion (still); JavaScript off (the page
  stands); the frame cost (a 4x CPU throttle, dropped frames counted); the decoded weight of the pool on
  the page; nothing focusable; paused when scrolled away.
- A capture of every option beside its words at 1440 and 375, the picture checked against the words (the
  tile-sign bug reached Will once). The desk in a real browser, never only the headless capture (headless
  fires before the animation).

## Questions (what the goal leaves open; a recommended answer each; the Orchestrator relays them and quotes the answer back)

- (fill)

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- None expected (lab-only). A fact about the engine lives in the board's context until a wiring lane moves
  the engine to `src/components/shared/`, beside the river.

## Deferred (ROADMAP one-liners, bucket named)

- (fill)

## Handoff (replaces the chat report)

- (fill: the head SHA, the gates on the synced tree, the lane check pasted, the items one line each, the
  questions and their answers, assets, system-doc lines, deferred lines, look at first)

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

(fill)
