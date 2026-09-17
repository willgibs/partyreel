---
track: light
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "4280a59c"
board: light
owns:
  - src/app/(dev)/design/sandbox/light/
  - docs/specs/light.md
reads:
  - docs/reviews/light.json
  - docs/design/rulings.md
  - src/components/shared/glow.tsx
  - src/lib/shared/use-ambient-pause.ts
  - src/components/lab/
  - src/app/(dev)/design/(shell)/lab/_desk/
  - src/components/app/event-card.tsx
  - src/components/ui/dropdown-menu.tsx
  - src/components/marketing/system/section-light.tsx
---

# lp/light

**Goal.** Round eight of the light board, and it is NOT a new exploration: the same proposals, asked
so they can be answered. This board has now stopped Will's sitting twice. Round five: "Some I can't
even tell what the 'treatment' is from the comparison." Round seven, today, after the walk was
rebuilt one card at a time (`docs/reviews/light.json`, read every note before anything else): he kept
the three lamps (the seam, the throw, the aurora; together "our Aurora", never on paper) and sent six
cards back, and every note says the card did not show him what it was asking about:

- the step: "I can't tell what's being asked because I can't tell what the step is here visually.
  Unless it's the gray surface behind the two guards in the 'with it' preview."
- the ring: "Would like to see more examples of this in use to judge"
- lift: "The drop shadows in this preview extend down, but since the top card in the stack is moved
  to a lower Y coordinate than the card below it, the shadows don't actually stack at all. Can't tell
  if they're helpful or not. Also, does this go with the previous ring or step, or are we choosing a
  single treatment? Seems like all three have been previewed in a similar function."
- float: "our step, ring, lift, and float: a set of four options to choose from, or are we trying to
  use everything, and if so, how?"
- the lit face: "Genuinely cannot see it in action here."
- the sweep: "I see the static gray edge ring, but can't get the animation to play, even by clicking
  replay. Stopping here."

The diagnosis, which is this round's brief. Three of the twelve were never decisions (the step, the
ring and the beam ship everywhere today and keeping them "lands nothing"; listing them so "the twelve
are the whole set" cost him three confusing screens). Four of them are ONE decision drawn as four
rival cards on a specimen whose geometry defeats the shadow. One cue is too fine to see at the size
it was drawn. And the marks do not run. What comes back is a walk of SIX steps he can see, under 1,200
words, and nothing else on the walk.

**The six steps.**
1. `landing` (an ask, four tiles on the one real chapter, as built): where the field sits on a
   chapter. It was staged behind `item: aurora keep`; the aurora is kept, so the `after` goes and it
   opens the walk. It is the one answer the home page's wiring is waiting on, so it goes FIRST.
2. `depth` (a new ask, ONE question for the step, the ring, lift and float): "Should dark mode get
   shadows?" in plain words. Today dark has none; cards and panels are separated by a surface one
   token lighter and a hairline edge, both already everywhere and neither a decision. Two situations
   that does not cover: two things of the same lightness overlapping, and a layer floating over a page
   that keeps living. Draw ONE real dark scene with all four heights in it at once: the page, a panel
   on it (the step and its ring), two overlapping media cards with the FRONT card above and over the
   back one so its shadow lands on the card behind (Will's note on lift is a bug report: today's pair
   puts the front card lower, so nothing falls on anything), and an open menu over living content
   (the real `DropdownMenu` content, not a portal: draw its surface in place). Tiles: `none` as today,
   `both` lift and float (the board's recommendation; bible 10 already allows exactly these two:
   "A shadow is allowed where stacked or overlapping objects need separating (media cards, a layer
   over content), never as a flat surface effect"), `float-only`. Beside the scene, a four-row legend,
   "how the four work together": the step (a surface on the page), the ring (its edge), lift (two
   things overlapping), float (a layer over the page). That legend IS the answer to "a set of four
   options to choose from, or are we trying to use everything": everything, one per height, never
   rivals. Two strip toggles (the ring off, the step off) let him see what each already does, which
   is his "more examples" for the ring, with no question attached. Paper keeps today's bytes and is
   not drawn.
3. `face` (an ask, two tiles): the lit edge where it can be seen. A large media frame (the gallery
   canvas or a real media tile at 480px or wider), as today and with it, with a 4x inset of one top
   corner on BOTH halves. Judge it yourself at 1:1 first: if it cannot be seen at true size on the
   three surfaces it lands on, the board recommends `skip` and says why in one line.
4. to 6. The marks that are still proposals, keep-any, one at a time: the sweep, the bloom, the halo.
   Each must VISIBLY run on arrival and on Replay, at 1440 and at 375.

**The sweep is two bugs; find both before you redraw anything.**
- Replay is a no-op: `Glow` (`src/components/shared/glow.tsx`, read, never edited here) re-keys its
  field on `runId` only when `shape === "bloom"`, and `previews.tsx` passes `runId` to a `sweep`. The
  card has to remount the specimen itself (key the wrapper on `runId`), for every mark, not only the
  bloom.
- The comet never showed at all, only `[data-glw-edge-rest]`. The engine's sweep is a LOOP on
  `--glw-dur` that `useAmbientPause` holds paused off screen, on a hidden tab and under reduced
  motion, and it rests off-layer. Diagnose live: `data-paused` on the `[data-glw]` node inside the
  one-at-a-time walk, whether the observer ever trips inside the walk's scroll container, the board's
  own Motion control, and whether the card's "It ends" story (an arrival) is being told by a loop at
  all. If the honest drawing of "an object arriving" is a one-shot, draw it as one on the board (the
  board may wrap, time and remount; it may not edit the engine) and say in Handoff what the engine
  would need for the wiring.
- Proof, not eyesight: sample the computed `mask-position` (or transform) of the band and of
  `[data-glw-edge]` twice, 500 ms apart, through the pane's JavaScript tool, for each mark, and paste
  the four numbers in Handoff. Then look at it.

**What leaves the walk, and where it goes.**
- The seam, the throw and the aurora are KEPT: they leave `candidates` (a kept card in a new round
  would queue again as unruled). The `aurora-wiring` lane is landing them in the Library this round;
  do not touch production and do not import from it what is not merged.
- `cadence` (8s), `publish` (the house five) and `second` (the home page's two ends) are answered and
  leave `asks`; their sections and controls go with them unless a remaining step reads them.
- The step, the ring and the beam leave `candidates` with one honest line each in the legend or the
  context ("ships everywhere today; nothing to decide").
- `hues` and everything that only served the withdrawn `paper` ask goes (Will, 2026-09-17: "No light
  ground usage is a decision for now").
- The spec's round becomes 8 (`history` gains 7); the header comment says why in his words. The
  transcriber reads `spec.ts` as TEXT and resolves `candidates: ITEMS` one hop in the same file: keep
  that shape. Registry string limits bite (`askLands` 160, `candidateLands` 120, a candidate's `one`
  120, `rationale` 300): measure before you commit. A pick that mirrors a control needs the control
  declared. `registry.test.ts` rules on all of it.

**Binds.** The bible (3, 10, 11), the lab kit's contracts (`src/components/lab`, read; build from
`Catalog`, `BeforeAfter`, `Loupe`, `GroundBox`, `ReplayButton`, `useReplay`, the step's tiles), the
policies (no em-dashes in copy, no mono face, keyframe names unique across every sheet, every
animation inside `prefers-reduced-motion: no-preference` with a designed rest state). Will's steer
for every board: fast rounds, the review is an onboarding form (the question in plain words, preview
tiles on ONE specimen, none-of-these where it is a pick, a live stage); HTML and CSS here is shaping,
not QA. Agents never edit CHANGELOG, STATUS, ROADMAP, PROGRAM, CLAUDE, AGENTS, `docs/ASSETS.md`,
`docs/design/rulings.md`, `docs/reviews/`, `touchpoints.ts` or `rules/bible.ts`.

**Verify on.** Your own dev server on port 3132 (`pnpm dev --port 3132` from the worktree, in the
background; stop it by port at the end: `lsof -ti tcp:3132 | xargs -I{} kill {}`; never an unscoped
pkill; :3000 is the Orchestrator's). The browser pane is SHARED with two other lanes: open your own
tab, touch no other. Walk `/design/lab/light` from the desk end to end at 1440 and at 375 (the
pane's mobile emulation), reduced motion on and off, every step answered once and the composed line
read back and passed through `node scripts/lab-review.mjs --dry` (it must name round 8 and refuse
nothing). `pnpm lab:smoke --base http://localhost:3132` with the board under 1,200 words.

## Questions (what the goal leaves open; a recommended answer each; the Orchestrator relays them and quotes the answer back)

- **The three marks are asks, not cards, and the walk's order is why.** The brief wants `landing`
  FIRST and the marks as a keep-any catalog, and the kit cannot do both: `toSteps`
  (`_desk/session-step.ts`) always walks a board's catalog before its asks, so three cards would open
  the walk with the sweep (the card that ended his last sitting) and push `landing` to fourth.
  Recommended, and BUILT: the sweep, the bloom and the halo are asks (`keep` or `skip`, two tiles on
  one specimen, a live stage with Replay), so the walk is the brief's one to six. Each is still its own
  decision, and a refine is the note field every step has. `candidates: ITEMS` keeps its shape (the six
  ideas still open, as the meta list) and the spec declares no `catalog`, so nothing queues as a card
  and an `item:` clause is refused for this board. Cards instead cost the order, until the kit can put
  asks before a catalog (Deferred, first line).
- **The bloom asks the half the wiring is waiting on.** `publish=house-five` ruled the colour, so both
  tiles are the house five and the ONE variable is `--glw-base`: the swell rests at a soft light (the
  QR card's shipped 0.34) or returns to nothing. Recommended, and built. It is the question
  `aurora-wiring` named as open ("whether a one-shot rests on a base or on nothing is the same unruled
  bloom card"), and the shipped violet is not drawn, so he is not asked the colour twice.
- **`landing` is drawn with the shipped `SectionLight`** (the Orchestrator's mid-round note). Built: it
  was cheap, and it deleted the board's composer. What he judges is what a call site mounts: the
  transform drive, the 24 second clock, 42 percent bands, and no dither. The board's grain stand-in
  left with the composer, because a dither only the lab wears is a lie about what ships.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none

## Deferred (ROADMAP one-liners, bucket named)

All for "Now", under "The lab and the kit" unless it says Design:

- The lab: a board cannot ask anything before its catalog (`toSteps` in `_desk/session-step.ts` walks
  the items step first), so the light board asks its three marks as asks to keep `landing` first; a
  declared step order on the spec would let a keep-any catalog follow the asks (light round eight).
- The lab: `evidence(section, state)` is not told whether it is drawing a tile or the stage, and the
  two want different pictures (a tight crop, the whole scene), so the light board renders both and
  hides one on `.lab-tile-view`; an `at: "tile" | "stage"` argument retires the double render.
- The lab: a fourth copy of the true-size box (`sandbox/light/fit.tsx`, `TrueFit`: brand-voice's
  settle, plus a fit-down only when the tile is narrower than the specimen); it joins the existing line.
- The lab: `Loupe` is a hover lens and a step's tile is `inert`, so a hairline can never be inspected in
  a tile; a fixed corner inset (`CornerInset`, same file) is what a one pixel difference needs.
- The lab: a one-shot on a step's stage has to arm on visibility (the stage sits under the tiles); the
  light board's `useArmed` (the whole specimen on screen, or Replay) is board-local and general.
- Design: what a mark over media needs from the engine (`glow.tsx`, `globals.css`): a play-once mode
  for the sweep (today `infinite`, held by `useAmbientPause`), a re-key on `runId` for every shape (only
  a bloom today), an additive blend when the lamp is drawn OVER a photograph (normal blending reads as
  haze), and `[data-glw-edge-rest]` moved under its travelling ring (it sits 20 pixels times
  `--glw-scale` INSIDE the host; measured at scale 2 on a 400 by 300 host, 40 pixels in).
- Design: `SectionLight` ships without a dither; the grain tile (ASSETS rows 10 and 15) now lands on the
  component itself, since the board's stand-in is gone.

## Handoff (replaces the chat report)

- Code head `3713c47f`, the sync merge `26c7984b`, and this manifest's commit is the tip; pushed. Synced
  with launch-prep three times: two fast-forwards on the Orchestrator's notes with nothing of mine
  committed yet (`0e6a2058` after aurora-wiring, `b985d571` after type-wiring), then the pre-handoff
  merge at `d29a883b` (STATUS only), which is where it stands.
- Gates on the synced tree (`26c7984b`), each on its own exit code: typecheck 0, lint 0 (warnings only,
  none in the lane), test 0 (2,111 in 229 files), build 0 (256 pages); `pnpm design:rules` changed
  nothing; `pnpm lab:smoke --base http://localhost:3132`: light 700 words of 1,200, all six step routes
  200 (the smoke's own exit 1 is the two glow boards, over budget on purpose).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = `docs/specs/light.md`, this file, and
  15 paths under `src/app/(dev)/design/sandbox/light/` (five added, five deleted, five modified). No
  exceptions.
- The six steps, in walk order (the desk lists them first, in this order):
  1. `landing`: where the Aurora sits on a section with no photos. Four tiles (two by two, so the quiet
     field is drawn at half size, each with a small drawing of which edge is lit) on the real closer
     through the shipped `SectionLight`; the stage is the section at 1:1 with the Canvas switch. The
     board says `both`.
  2. `depth`: should dark mode get shadows. Three true-pixel tiles of ONE scene (a panel, the front
     card ABOVE and over the back one, the real menu surface in place) where both shadows fall side by
     side in the bright band of the same photograph; the stage is the scene at dashboard size with
     four numbered markers and the legend "How the four work together" (each row says ships or asked,
     and on or off in this picture); two strip switches take the outlines and the lighter panels away.
     The board says `both`.
  3. `face`: the thin bright edge. One 480 pixel photograph as today and with it, each with a FIXED 4x
     inset of its top left corner; the stage is the three surfaces, each with its inset. Judged at 1:1:
     a faint line you have to hunt for on a dark photo, nothing on a bright one, a no-op on the QR card
     and the framed screen (both already outlined), and a clear edge only on the player's black canvas,
     which the thin outline that already ships can give it. The board says `skip`.
  4. `sweep`: a streak of light over a photo as it lands. A real `[data-media-tile]` (so "as today" is
     production's own arrival fade), the engine's comet and ring drawn OVER it, once. The board says
     `skip`: Will turned down both halves on 2026-08-31 (light on an upload "feels very forced"; a ring
     appearing around a photo read as chrome).
  5. `bloom`: after a publish, does the frame stay softly lit. The reel's frame, the QR card's shipped
     numbers, base 0.34 against base 0. The board says `keep`.
  6. `halo`: a glow circling one button from behind. The end of a flow with its two buttons, drawn the
     recipe's way (the wash ON the pill, under the label); the stage adds the white button wearing it,
     where it turns pastel rather than lit. The board says `skip`.
- The sweep was THREE bugs, all found live before anything was redrawn. (a) Hidden: its host was
  `absolute inset-0` on the reel frame and BEFORE it in the markup, so the opaque frame covered all of
  it; measured, host rect = frame rect (69, 214, 360, 214), `elementFromPoint` at its centre was the
  frame's play icon, and the band was travelling the whole time underneath (`mask-position` 116.7% to
  99.4% in 500 ms, `data-paused="false"`). The engine's observer trips fine inside the one-at-a-time
  walk (measured there on the halo, the loop still in it: not paused, its orbit advancing), and the
  board's Motion control was on Live. The "static gray edge ring" he saw was the frame's own border. (b) Replay: `Glow` re-keys only a bloom, so every mark
  remounts its own specimen now. (c) The story: an arrival told by a 6 second loop; the board plays the
  engine's own two keyframes ONCE (`board.css` section 5, four attributes deep so it outranks the
  engine's drive and pause rules), armed when the whole specimen is on screen. The same first fault hid
  the halo's two button usages (an opaque `Button` over the wash) and the lit face (an inset shadow
  paints UNDER a tile's image: round seven's "with it" was its "as today" to the pixel).
- The marks' proof, two samples 500 ms apart through the pane's JavaScript tool, then looked at (the
  sweep scrubbed mid-pass through its own Animation objects, since a pass is faster than a screenshot):
  - sweep, band `mask-position` x / edge `mask-position` x. 1440 by 900: the tile on arrival 103.3% /
    76.7% then 53.3% / 51.7%; the stage is NOT mounted at load, on scroll into view 133.4% / 91.7% then
    81.7% / 65.8%, at rest -50% / 0%, on Replay 131.7% / 90.8% then 81.7% / 65.8%. 375 by 812: tile
    101.7% / 75.8% then 51.7% / 50.8%; scroll 131.7% / 90.8% then 81.7% / 65.8%; Replay 130.0% / 90.0%
    then 80.0% / 65.0%.
  - bloom, band opacity. 1440: tile 0.948 then 0.384; scroll 0.895 then 0.438; rest 0.340 (the base);
    Replay 0.895 then 0.427. 375: tile 0.948 then 0.389; scroll 0.867 then 0.438; Replay 0.895 then 0.437.
  - halo, the first wash's `background-position`. 1440: tile 100% 73.0% then 99.4% 100%; stage 10.6%
    100% then 0 93.9%. 375: tile 100% 91.8% then 91.8% 100%; stage 1.2% 100% then 0 78.6%.
- Reduced motion: the pane cannot emulate the media query, so it was verified two ways. Read out of
  `document.styleSheets`, the board's only two animation declarations sit inside `(prefers-reduced-motion:
  no-preference)` and the rest rule sits outside it; and Motion: Rest, which lands on the same computed
  styles, shows the sweep's band at 150% with no animation (the photo, arrived, unlit), the bloom's band
  at opacity 0 over its base, the halo still. The tiles' own replay reads the preference and stays off.
- The walk, from the desk's Start the review at 1440 and again at 375 (one column of tiles, no sideways
  scroll on any step): show, choose, a note, the two strip switches, Next through all six. The store
  held `light.r8.*` for all six; composed with the desk's own `composeSoFar` in a scratch test (no Copy
  button was pressed), the line was `review light r8: landing=both; depth=both "Both read well. The
  small one could be a touch stronger."; face=skip; sweep=keep; bloom=keep; halo=skip`, and it and one
  line for every other option of every step (11 lines, a quoted note with quotes and a semicolon, a
  `?`) passed `node scripts/lab-review.mjs --dry`, naming round 8. It refused `r7` and `item:sweep=keep`,
  as it should.
- For the Orchestrator's files (none of them mine): `touchpoints.ts`, the light entry's `board.note`
  and `variants` still describe twelve cards and four questions; suggested note: "Six steps in the order
  the wiring needs them: where the Aurora sits, shadows in dark mode on one scene with a legend, the thin
  bright edge enlarged, and three moments of light that play", variants: Landing, Depth, Face, Sweep,
  Bloom, Halo. `docs/ASSETS.md` rows 11 and 16 name the old pair; it is `wedding-rings` over
  `reception-table` in `sandbox/light/depth.tsx` now. Rows 10 and 15: see Deferred, last line.
- Assets requested from Will: none new (rows 15 and 16 stand).
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Look at first: `/design/lab/light?session=light.depth` at 1440. Compare the first two tiles at the top
  of the lower photograph (under the front card's edge on its left, under the menu's on its right), then
  switch Thin outlines off above the stage. Then `?session=light.sweep`: the right tile plays by itself.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). The light board's round eight asked the same proposals as
six steps Will could see, in the order the wiring needed: where the Aurora sits (on the shipped
`SectionLight`), shadows in dark mode (one scene, four heights, a legend, the front card above the back
one), the thin bright edge (a fixed 4x corner), and three moments of light as asks, so `landing` stayed
first. It found why round seven showed nothing: the sweep ran behind an opaque frame the size of its own
box, Replay re-keyed only a bloom, the bright edge was an inset shadow under the photo, and the halo's
wash sat under an opaque button. Tiles drew at true pixels and replayed themselves; the composer, the
kit and the twelve previews were deleted; the board read 700 words of its 1,200.
