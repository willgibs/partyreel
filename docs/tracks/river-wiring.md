---
track: river-wiring
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "97207988"         # the launch-prep SHA the branch was cut from
board: river-card       # RETIRES here, with river-visual
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/marketing/sections/features/shared/feature-door.tsx
  - src/components/marketing/sections/features/shared/related-features.tsx
  - src/components/marketing/sections/home/event-type-card.tsx
  - src/components/shared/river/
  - src/app/demo/
  - src/app/(dev)/design/sandbox/river-card/
  - src/app/(dev)/design/sandbox/river-visual/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/design/rulings.md
  - docs/design/guidance.md
  - docs/systems/design-system.md
  - docs/reviews/river-card.json
  - docs/reviews/river-visual.json
  - src/components/guest/gallery-empty-state.tsx
  - src/components/guest/gallery-empty-state.test.tsx
  - src/lib/demo.ts
  - src/lib/constants/feature-pages.ts
---

# lp/river-wiring

**Goal.** Wire the river into the QR door and give every feature card its own copy gradient, from two ruled
boards. River-visual round two (`docs/reviews/river-visual.json`): `placement=card` ("It ships first in the
picture slot of one card in a three card row, a short box that shows the top of the fall"), `code=in` ("The
album pours out of the real scannable code, so the picture is also a way into the demo"), `guest-photos=ghost`
(shipped already on the guest empty state). River-card round one (`docs/reviews/river-card.json`, 2026-09-18):
`place=tenth` ("41 px from the top of the tall door at 1440, three times the air you saw, and the most door left
for the photographs to fall through"), `fall=behind` ("The whole door streams, like the photographs beside it;
the words read over moving pictures, under the shade the event cards were measured with"), `opens=short` ("A
short link that opens the live demo event, at the smallest code that scans: 99 px. The redirect ships with the
wiring"), `short=tall` ("Every row takes the tall 4:5 door"). His ruling on the cards, verbatim: "A subtle dark
gradient overlay from the bottom left to allow the text in the card to be slightly more visible would be nice.
This would stack on top of the existing gradient that fades the photo out, more custom the the cards themselves
for more distinction between the card copy and its visual. The river has a gradient overlay to fade it out for
its own visual, then the card would have its own from its text, being treated separately so the card's applies
to all features & visual pairings." And: "Not exclusive to the QR code card, nor part of the river visual design
itself, which keeps its own overlay fade as well." Production bytes: the red-team lands on the alias. Both
boards RETIRE here.

**What exists.** `feature-door.tsx` is the one card component (the `/features` hub grid and every page's
closing row through `related-features.tsx`, which hardcodes landscape); the `qr` door renders `QrPlateArt` on
`InkGround` with the value hard-coded to the apex; the door already carries two full-width bottom-weighted
scrims. The sandbox's `door.tsx` reaches in from outside and says so ("The wiring lane gives the door a real
picture slot; none of this survives it"); `sandbox/river-card/card-river.tsx` carries three things the shared
engine lacks (a movable plate-top, insertion between the door's two scrims, its own clock) and its header says
whichever of the two files the wiring promotes, the other goes. The production river (`src/components/shared/
river/`) is consumed by the guest empty state, whose contract (`gallery-empty-state.test.tsx`, pure atmosphere)
must keep holding. No `/demo` route exists; `DEMO_EVENT_URL` in `src/lib/demo.ts` reads a runtime env var, so a
static redirect in `next.config.ts` cannot carry it.

**What to build.**

1. The door's picture slot: the `qr` door takes real children, the river in it at `tenth` with the code `in` it
   (the album pours out of the scannable code), the whole door streaming (`behind`) under the shade the event
   cards were measured with; the card river promoted beside the shared engine, folded into it or shipped as a
   sibling with its own contract (say which, and why, in the Handoff), the sandbox copy deleted.
2. The card's own copy gradient: the copy scrim on EVERY door becomes a bottom-LEFT weighted gradient, stacked over
   each visual's own fade (the river keeps its own dissolve), and the same treatment reaches the home's
   `event-type-card.tsx` ("all features & visual pairings"); measured for the copy's contrast on every door's
   visual, not the darkest.
3. `/demo`: a route handler (`src/app/demo/route.ts`) redirecting to `DEMO_EVENT_URL` at request time; the door's
   code encodes `/demo` at the smallest module size that scans (99 px at 1440, the board's floor; the lane
   measures the module size at both aspects and both widths); the value never the apex again.
4. `related-features.tsx`: the closing rows take the tall 4:5 door (`short=tall`).
5. Retire `river-card` and `river-visual`: directories deleted, their lines removed from `registry.ts` and
   `boards.ts`, their RULINGS rows in `touchpoints.ts` rewritten as shipped (grep `shipped:` for the precedent),
   never deleted. A Library entry for the door with the river in `gallery-demos.tsx` (add your entry at the head
   of the file and touch nothing else there: two other lanes add theirs the same way this round, and the
   Orchestrator keeps both at the merge; the same rule for `for` lines in `rules/component-notes.ts`).

**Binds.** Bible 1, 4, 13, 14, 22; `river-engine.test.ts` and `gallery-empty-state.test.tsx` keep holding;
`keyframe-uniqueness.test.ts`; the guidance's craft stack; no em-dashes; the copy is open.

## Verify, and the gate

- Each step its own exit code, pasted into Handoff: `pnpm design:rules`,
  `node "src/app/(dev)/design/gallery/collect-specimens.mjs"`, `pnpm typecheck`, `pnpm lint` (the 8 known
  warnings), `pnpm test`, `pnpm build`, `pnpm lab:smoke --base http://localhost:3132` (with `DESIGN_PREVIEW_KEY` in
  the environment, never on a command line).
- Measured on the real hub and a closing row at 1440 and 375: every door's code module size against the 3 px
  floor, the copy's contrast over every door's visual with the new gradient, the frame cost of a row of doors
  under a 4x throttle, reduced motion (a still), scripting off, nothing focusable in the river, `/demo` answering
  a 307 to the live demo event locally and on the alias.
- The screenshot gate: the hub's row beside the home hero at 1440 and 375.

## Questions (what the goal leaves open; a recommended answer each; the Orchestrator relays them and quotes the answer back)

- **The QR door's title, at the moments a bright photograph passes right under it.** `fall=behind` puts the
  copy over twelve full-luminance frames in flight. Sampled across a whole 7.6 s cycle at 1440 with the copy
  hidden and the white composited per pixel, the title holds a median of 16.19 and a 1st percentile of 3.16,
  and the line a median of 9.63 and a 1st percentile of 4.96. The title is 20 px at weight 700, which is
  large text, so 3.16 clears AA-large; the old straight ramp read 1.00 at the fifth percentile on the same
  door, so this is a large improvement, not a regression. The other option is to start the river's OWN
  dissolve where the copy block begins (about 72 percent down) instead of at 80, so the flow thins behind the
  words while the top of the fall is untouched. **Recommended: keep it as ruled.** He saw this exact dissolve
  on the board and described it in his own words ("the words read over moving pictures, under the shade the
  event cards were measured with"); the card's gradient was the thing he asked for and it is now measurably
  darker where the copy sits and lighter everywhere else. Carried on with the recommendation.
- **The line on the closing row's doors, now that the row is tall.** `short=tall` gave the row a 4:5 door, so
  each one has far more picture and the same one-line panel copy it carried at 3:2; the hub's doors read the
  longer directory line in the same shape. **Recommended: keep the short line there.** A closing band is a
  pointer, not a directory, and two rows of copy would put the words into the part of the door the album is
  falling through. Carried on with the recommendation.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- `docs/systems/design-system.md`, a new `### The media-forward card` under the identity section (the doc had
  nowhere to refine: it described the light, the type and the elevation of a card but never this anatomy, and
  `#the-media-forward-card` is the anchor the RULINGS row now writes). It holds one fact: a media-forward card
  carries TWO overlays with different owners, the visual's own fade and the card's copy gradient
  (`CARD_COPY_SCRIM`), with his ruling quoted and the "re-measure per pixel" landmine.


## Deferred (ROADMAP one-liners, bucket named)

- **Design system:** the blog library's `post-card.tsx` is the one media-forward card left on a single scrim;
  his ruling says the card's gradient "applies to all features & visual pairings", so it wants `CARD_COPY_SCRIM`
  too (out of this lane's `owns`; the events teaser already gets it through `EventTypeCard`).
- **Design system:** `CARD_COPY_SCRIM` is exported from `feature-door.tsx` and imported by the home's
  event-type card, because a lane owning two files under `sections/` cannot add a third home for one string.
  It belongs beside the other card primitives (`src/components/shared/` or `marketing/system/`) the next time a
  lane owns that directory.
- **Marketing:** the QR door's twelve are the manifest's bootstrap stills, so they swap with the Higgsfield
  month like every other still (`qr-door-frames.ts` is the slot, no new ASSETS row needed).

## Handoff (replaces the chat report)

**Head:** `5048b1dc` (a merge of `origin/launch-prep` at `89548cbb`, taken because launch-prep moved 22
commits while this lane built; the gate below is the synced tree's).

**The gate, each step its own exit code, on the synced tree.** `pnpm design:rules` 0 ·
`node "src/app/(dev)/design/gallery/collect-specimens.mjs"` 0 · `pnpm typecheck` 0 · `pnpm lint` 0 (the 8
known warnings, none in this lane's files) · `pnpm test` 0 (241 files, 2,506 tests) · `pnpm build` 0
(`/demo` prints as `ƒ`, dynamic; `/features` stays `○`, so the flow's rest state is in the prerendered
HTML) · `pnpm lab:smoke --base http://localhost:3132` 0 (262 checks, 0 failing; the key was exported into
the environment, never typed on a command line).

**The lane check** (`git diff --name-only origin/launch-prep...HEAD`), 30 paths, every one inside `owns`,
the manifest, the listed system doc, or the registration exception:

```
docs/design/library.md                                     generated by pnpm design:rules
docs/systems/design-system.md                              the one listed system-doc edit
src/app/(dev)/design/(shell)/lab/boards.ts                 registration: my two board lines removed
src/app/(dev)/design/(shell)/library/components/gallery-demos.tsx   registration: my one entry, at the head
src/app/(dev)/design/gallery/specimens.generated.json      generated by collect-specimens.mjs
src/app/(dev)/design/rules/component-notes.ts              registration: my two `for` lines, at the head
src/app/(dev)/design/rules/rules.generated.json            generated by pnpm design:rules
src/app/(dev)/design/sandbox/registry.ts                   registration: my two board lines removed
src/app/(dev)/design/sandbox/river-card/*      (6 files)   owns: the board, deleted
src/app/(dev)/design/sandbox/river-visual/*    (5 files)   owns: the board, deleted
src/app/(dev)/design/touchpoints.ts            registration: SandboxId minus two; both RULINGS rows as shipped
src/app/demo/route.ts                                      owns
src/components/marketing/sections/features/shared/feature-door.tsx      owns
src/components/marketing/sections/features/shared/related-features.tsx  owns
src/components/marketing/sections/home/event-type-card.tsx              owns
src/components/shared/river/{qr-door-frames.ts,qr-plate.tsx,qr-plate.test.tsx,river-engine.ts,river.css,river.tsx}  owns
```

**The merge.** Five conflicts, all registrations. Both sides kept where the line is an addition
(`component-notes.ts`: trail-wiring's three `for` lines, then this lane's two, under their comment);
NEITHER side kept where both sides retire a board (`registry.ts`, `boards.ts`, `touchpoints.ts`'s
`SandboxId` each lost `gallery-width` to gallery-wiring and `river-card` / `river-visual` here).
`docs/design/library.md` and `specimens.generated.json` were regenerated rather than merged by hand.

**The items.**

1. **The door has a real picture slot, and the engine was FOLDED IN, not promoted beside.** The lab's
   `card-river.tsx` needed three things the shared engine lacked. Two of them turned out to be one line:
   `riverGeo(ratio, origin?)` now takes a birth point, and the QR door's is the code's own centre. The third
   (its own clock) was not needed; the bank's clock is what he ruled on. So there is ONE arithmetic, not two
   that drift, and `river-engine.test.ts` and `gallery-empty-state.test.tsx` both keep holding untouched. The
   sibling is the OBJECT, not the flow: `qr-plate.tsx` (server-rendered, so `qrcode-generator` never reaches
   the browser on /features and six feature pages) with its own contract, `qr-plate.test.tsx`.
2. **Nothing is measured, and the rest state is still in the server's HTML.** The lab took the door's box off
   a ResizeObserver; production cannot, because a blank card until hydration is what that buys. Every length
   is a fraction of the DOOR's width and the scan floor is a CSS `max()`, so the plate, the birth point and
   the flow agree at any width with no listener. The floor is enforced on the PLATE rather than the code: the
   plate is border-box and its padding is a share of the door, which makes the code's edge
   `max(1.2F, 0.36w) - 0.06w`, at least `F` at every width by construction, and the two branches meet exactly
   at the hub's own door, where the code is the 99 px he ruled.
3. **The card's own copy gradient** (`CARD_COPY_SCRIM`, one string, one home) replaced the straight bottom-up
   ramp on every feature door and on the home's event-type cards. Two layers, because "bottom left" is two
   facts: a band under the copy row and a bloom in the corner it starts from.
4. **`/demo`** is `src/app/demo/route.ts`, a 307 to `DEMO_EVENT_URL`, `force-dynamic` so no build folds it
   into a cached answer, falling back to the home page when no demo is configured. The comment about WHY it is
   a route handler was corrected mid-lane after measuring: `NEXT_PUBLIC_*` is inlined at build (verified in
   `.next/server`), so the real reason is the single source in `lib/demo.ts`, not a runtime read.
5. **The closing rows take the tall 4:5 door** (`short=tall`), so the hub and every page's last band are one
   shape.
6. **Both boards retired**, directories deleted, RULINGS rows rewritten as shipped with their new `lives`.
   A Library entry, `qr-plate` ("The QR door's picture"), at the head of `components/gallery-demos.tsx`.

**The measurements.** All on the real pages in headless Chrome over CDP, the copy hidden, the card
photographed and the white composited over each pixel at its own alpha.

- **The code.** At 1440 (`/features` and a closing row): door 330.7, plate 119.0, code 99.2, span 33,
  **3.007 px a module**, plate top 41.3 px = 10.0 percent of the door, which is his "41 px from the top of the
  tall door at 1440" exactly. At 375: door 343, plate 123.5, code 102.9, **3.118 px a module**, top 42.9 px =
  10.0 percent. The contract sweeps 240 to 1200 px and two values and proves the floor holds by arithmetic.
- **The copy, against the ramp it replaces** (worst 5 percent of the title's pixels, 1440): Conferences
  7.60 -> 10.89, Parties 9.17 -> 13.11, Trips 11.13 -> 15.05, Weddings 14.80 -> 18.68 (the first three are the
  cards the old note called a hair under AA). No door and no event card moved DOWN at either width. The five
  photographic feature doors sit at medians of 17.4 to 20.4 with fifth percentiles of 15.5 to 17.6.
- **The QR door, over the moving flow** (1440, sampled across a whole 7.6 s cycle, 263k pixels): the title
  median 16.19, p01 3.16, p05 3.89, worst 2.29; the line median 9.63, p01 4.96, p05 6.55, worst 3.47. It was
  a p05 of 1.00 under the old ramp. See the first Question.
- **The frame cost.** A row of doors on `/features` under a **4x CPU throttle**: 300 frames in 5 s, median
  16.7 ms, p95 16.8, worst 16.8, **59.9 fps**. One rAF loop writing transform and opacity, paused off screen.
- **Reduced motion:** a still. 12 cards, 0 inline writes, 0 moved over 1.2 s, every rest custom property
  present. **Scripting off:** the settled flow paints from the server's own HTML (shot, and identical to the
  reduced-motion still).
- **Reachability:** 0 focusable nodes inside the door, all 12 images `alt=""` and `draggable="false"`, the
  river `aria-hidden` with `pointer-events: none`, the plate inside the hidden subtree, and the hit test at
  the door's centre lands on the link. Read off the real accessibility tree, the link's name is
  "The QR code Print it or put it on a screen. One scan and they are in.", with the river's `<noscript>`
  excluded (`ignored: ariaHiddenElement`), which was the one thing that could have polluted it.
- **`/demo`:** 307 locally, `Location` byte-identical to the demo event's URL composed from `.env.local`
  (never printed). **Not yet testable on the alias**: the route does not exist on `launch-prep`, so
  `https://partyreel-git-launch-prep-partyreel.vercel.app/demo` answers 404 today (checked). The
  post-merge check is that same URL answering 307 to the demo event once this lands.

**The screenshot gate.** The hub's row at 1440 and 375 beside the home hero: the door's picture is the hero's
own language turned vertical, one white plate on ink with photographs leaving it, so the two read as one
system rather than two ideas. It holds up.

**Assets:** none asked. The door pours the manifest's bootstrap 12 and swaps with the Higgsfield month like
every other still.

**Departures:** none from the craft stack. One deliberate deviation from the lab: the plate's width and
padding are inline CUSTOM PROPERTIES consumed by `river.css`, because React writes inline styles through the
CSSOM and a parser that does not know `max()` drops the declaration rather than keeping its text: the
browsers take it, jsdom does not, and the one length the scan floor lives in would have been missing exactly
where a test looks for it.

**Look at first:** `/features` at 1440, the middle door of the first row, then the same row at 375.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged at `<sha>`. The QR feature door stopped being the one made object and became the one that moves: the
album now pours out of a real scannable code standing a tenth of the way down a tall 4:5 door, and the whole
card streams behind the copy. The lab's separate card engine was folded into the shared one as a single
`origin` argument rather than promoted beside it, so there is one arithmetic and the guest album's contract
never moved; the object it pours from ships as a server-rendered sibling with its own contract, and every
length is a fraction of the door, so the code (3.007 px a module at 1440, 3.118 at 375) and the settled flow
are both in the server's own HTML. The straight copy ramp became `CARD_COPY_SCRIM`, one ruled bottom-left
gradient worn by every media-forward card, measured per pixel: the three cards the old note called a hair
under AA rose from 7.60, 9.17 and 11.13 to 10.89, 13.11 and 15.05. `/demo` ships as the 307 the code encodes,
the closing rows took the tall door, and both boards retired.
