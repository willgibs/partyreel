---
track: light
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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

- none yet

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- Head <sha>, pushed; synced with launch-prep at <sha> (or: it had not moved)
- Gates on the synced tree: typecheck ok, lint ok, test ok (N), build ok (M pages); `pnpm lab:smoke` ok
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The six steps, one line each: what it asks, what it is drawn on, the board's recommendation
- The marks' proof: two samples 500 ms apart for each, and what fixed the sweep
- Assets requested from Will: none, or one per line
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Look at first: ...

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
