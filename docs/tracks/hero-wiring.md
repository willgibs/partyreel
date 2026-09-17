---
track: hero-wiring
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "a6afec3b"
board: home-hero
owns:
  - src/components/marketing/sections/home/cinema-hero.tsx
  - src/components/marketing/sections/home/cinema-hero.css
  - src/components/marketing/sections/home/hero-stream.ts
  - src/components/marketing/sections/home/hero-stream.test.ts
  - src/components/marketing/sections/home/hero-stream-ids.ts
  - src/app/(dev)/design/sandbox/home-hero/
  - src/app/(dev)/design/gallery/
reads:
  - src/lib/demo.ts
  - src/lib/constants/marketing-voice.ts
  - src/lib/constants/marketing-nav.ts
  - src/lib/constants/marketing-media.ts
  - src/lib/shared/use-ambient-pause.ts
  - src/components/marketing/chrome/footer-qr.tsx
  - src/components/marketing/sections/home/section-ids.ts
  - src/app/(dev)/design/sandbox/registry.ts
  - docs/reviews/home-hero.json
  - docs/design/rulings.md
---

# lp/hero-wiring

**Goal.** The wiring round of the home hero: the composition Will picked ships as the production
hero and the board retires. His pick, verbatim (`docs/reviews/home-hero.json` round 7,
`stream=stack-above`): "We can drop the "Every photo here came from a guest who scanned it" label
underneath the QR code." So `cinema-hero.tsx` becomes the stack with the code above: the real demo
QR at 36 percent of the hero's height at desktop widths (32 at phone widths), the band of photographs
streaming out of it each way along one axis (the band's table in `sandbox/home-hero/streams.ts`:
`BAND_BEAT`, `BAND_KAPPA`, `BAND_TURN`, the exponential travel, the curl, the short perspective, the
edge mask), and under the band ONE block: the ruled headline, the ruled sentence and the two actions,
with no caption anywhere. The engine moves out of the sandbox into
`src/components/marketing/sections/home/hero-stream.ts` cut to what ships (one stream, the
`stack-above` lockup; the split, the orbit, the polar placement, `stack-below` and their tests
deleted, not carried), with its pure solvers, its rest state and its test beside it. The board retires
in the same round: everything under `src/app/(dev)/design/sandbox/home-hero/` goes EXCEPT
`shared.tsx`, which the album-hero and river-visual boards import (`FRAMES`, `CANVAS`, `GUTTER`,
`LADDER`, `Mode`, `Photo`); give it a head note saying it outlives its board and delete what in it
only the hero read (`RULED`, `DemoQr` if nothing else reads them). Not in this round: the 34 squares
and the 12 portraits (ASSETS rows 2 and 12 stay requested; the twelve stand-ins cycle until they land;
the pool is 9 a side), any new composition, any lamp on the hero (it stays unlit by ruling).

**What is settled, so build rather than ask.**
- The block is the headline (`SITE_THESIS`, static: the kinetic word and `SpliceWord` retire, the
  pre-agreed fallback in its own comment), the sentence (`SITE_SUBHEAD`) and two actions: the primary
  is `MARKETING_CTA` with its `trackAttrs`; the secondary stays "Watch a sample reel" opening
  `SampleReelOverlay` with its `track("reel_play")`, because the code beside it IS the demo
  affordance and the reel is product truth. The `DemoTicket` under the actions goes: the QR is the
  object now (`FooterQr` on `DEMO_EVENT_URL`, tappable, at scanning size, still).
- The wall, its scrims, the reel card in the wall, `WALL_ORDER`, `WALL_TILES`, `TALL_TILES` and
  `HERO_EYEBROW` leave with the old hero. No darkening layer over any photograph (bible 1).
- Production mechanics, from the board's own wiring notes: `useAmbientPause` holds the loop's clock
  off screen and on a hidden tab (the lab read the stage's `data-paused`; production reads the hook);
  the rest state as custom properties and the branch-out's first frame inside
  `prefers-reduced-motion: no-preference` exactly as `hero.css` draws them, with the `<noscript>`
  rule for scripting off; the h1 in the markup at paint, at full opacity, gated by nothing
  (`marketing-h1-policy` scans this tree); the hero's own sheet declares NO keyframe
  (`keyframe-uniqueness.test.ts`); the frames lit at rest load eager and the rest lazy; the LCP is
  the headline text. `sizes` on the frames is per breakpoint now, not per canvas.
- Geometry: `GEO` per canvas becomes per breakpoint (a 1440 canvas and a 375 one map to `lg` and
  the base), the lockup anchored off the axis as the sandbox hero does it, and a `min-h` on the section
  that keeps the block on screen: measure at 1440x720 and 375x667 as well as the two canvases. The
  hero's height stays `100svh` at the ruled minimum of 560 only if the block fits there; if not, the
  minimum rises and the manifest says to what.
- `streams.test.ts`'s conditions travel with the engine: the type's measured lane clears the site
  header, the block fits its viewport, no frame is rasterized above its own pixels, the rest state is a
  composed still, nothing is dealt.
- The Library: the hero's entry appears with the `new` badge (the promote rule, `docs/PROGRAM.md`
  "The round" step 6): a marketing entry under `src/app/(dev)/design/gallery/` with a live preview
  of the section; follow the family's convention there. A `// @contract-for:` line on the new test
  changes the rules artifact: leave `pnpm design:rules` to the merge.
- `src/app/(dev)/design/sandbox/registry.ts`: remove the hero board's registration lines only, and
  list the file under the lane check's exceptions (the migration wave's precedent). `touchpoints.ts`,
  `docs/reviews/home-hero.json` and the CHANGELOG are the Orchestrator's at the merge.

**Binds.** The bible (`/design/library/rules`; 1, 10, 13, 14, 18 are the ones this hero leans on),
the contracts of every component under a path you own, and the policies (`no-em-dash`,
`two-faces`, `marketing-h1`, `keyframe-uniqueness`); everything else is precedent. Will's rulings
on this hero, in order: the source direction, the lockup centred, the site's one line, no live count
(round 5); the four scatterings answered none, the symmetric approach by name (round 6); the stack
with the code above, the caption dropped (round 7). All in `docs/design/rulings.md`.

**Verify on.** The home page (`/`) at 1440 and 375, at 1440x720 and 375x667, with reduced motion
on (the composed still, no loop) and off (the branch-out, then the band running); the tab hidden and
shown (the clock holds); scripting off (the rest state through the noscript rule); the QR scans from
a phone at the rendered size; the gate (typecheck, lint, test, build), `pnpm lab:smoke` (the album-
hero and river-visual boards still render off `shared.tsx`); after the merge the Orchestrator checks
the alias live.

## Questions (what the goal leaves open; a recommended answer each; the Orchestrator relays them and quotes the answer back)

All five were put to the Orchestrator mid-round and answered; each is recorded with the answer taken.

- **The board could not retire through `registry.ts` alone.** `BOARD_COMPONENTS` is typed
  `Record<SandboxId, BoardEntry>` and `SandboxId` is declared in `touchpoints.ts`, so deleting the
  board without that file is a typecheck failure. ANSWERED: `touchpoints.ts` released to this lane
  for the hero's own entry; the retirement is atomic across the three registration lines. Done that
  way, with no `Partial` widening; `touchpoints.test.ts`'s pinned SANDBOX list is the fourth file the
  same act requires.
- **The Library entry cannot live under `src/app/(dev)/design/gallery/`**, which is what the goal
  said: `entry.ts` and `gallery.test.ts` require a family's entries to sit in that family's own
  `*-demos.tsx`, because the collector derives a specimen's route from which page imports it.
  ANSWERED: the family's module is right. The entry's id is `cinema-hero`, in
  `(shell)/library/marketing/gallery-demos.tsx` under Heroes, badged `new`.
- **`hero-stream-ids.ts` is not created.** The file existed so a SERVER route could validate
  `?stream=` without reading a constant through a client barrel; both the route and the four ids
  retired with the board, and the engine is a plain module any caller can read. ANSWERED: agreed.
- **`component-notes.ts` needs one `for` line**, because the contract pulls `hero-stream.ts` into
  `COMPONENTS` and `gallery.test.ts` fails a component without one. ANSWERED with the regenerated
  artifacts: both listed under the lane check.
- **`home-sections.test.ts` guarded a retired mechanic.** Its case pinned
  `SITE_THESIS.split("event")` for the kinetic slot, which left with the wall; it stayed green while
  its comment lied. ANSWERED: retune, never leave lying. It now pins that the thesis is one line
  short enough to hold the ladder's top step without a bespoke ramp.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- None made. One PROPOSED for the Orchestrator at the merge, `docs/systems/marketing-content.md`
  line 227, where the careers page's aside still names the retired wall. Replace
  "home owns the drifting wall, pricing the stacked photos," with
  "home owns the band streaming out of the demo code, pricing the stacked photos,".
  Line 219's "home's cinema-hero move" is still true: the hero is still the section pulled up under
  the overlay chrome, and it is now pulled up onto the viewport's own top edge.

## Deferred (ROADMAP one-liners, bucket named)

- Now: the home hero is solved at two breakpoints, so between 768 and 1023 it wears the phone's card
  size and the phone's 343px measure on a tablet-width screen. It is correct and it fits; it is not
  composed. A third breakpoint is the answer if anyone judges it there, and `Geo` takes one without
  a structural change.

## Handoff (replaces the chat report)

- Head: the tip of `lp/hero-wiring` (`e098f530` carried the work; this line is the fill on top,
  since a pushed commit is never amended). Synced with `launch-prep` at `5b4c2063` (merged mid-round at `62850026`,
  taking the palette's wiring: the three registration lines conflicted only in their comments, and
  both retirements are named there now; `touchpoints.test.ts`'s pinned list was the one real
  conflict and both ids are out of it).
- Gates on the synced tree: typecheck ok, lint ok, test ok (2,111), build ok (257 pages);
  `pnpm lab:smoke` 245 checks, 0 route failures (the two failures are the glow boards over the
  reading budget, which STATUS records as deliberate). `album-hero` and `river-visual` still render
  off `shared.tsx`.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = the owned paths and this file, plus
  six named exceptions:
  - `src/app/(dev)/design/touchpoints.ts` and `touchpoints.test.ts` and
    `src/app/(dev)/design/(shell)/lab/boards.ts` and `sandbox/registry.ts`: the four registration
    lines a board retirement has to move together, released to this lane (the migration wave's
    precedent). The hero's entry keeps its RULINGS row and loses its `board` field.
  - `src/app/(dev)/design/(shell)/library/marketing/gallery-demos.tsx`: the Library entry, which
    must live in its family's own module.
  - `src/app/(dev)/design/rules/component-notes.ts`: one `for` line for the engine.
  - `rules.generated.json` and `docs/design/library.md`: regenerated by `pnpm design:rules`, and
    `gallery/specimens.generated.json` by the specimen collector. The merge regenerates all three.
  - `src/components/marketing/sections/home/home-sections.test.ts`: the retuned kinetic-word pin.
  - NOT created: `hero-stream-ids.ts`, listed in `owns`. See the Questions.
- The items, one line each:
  - `stack-above`: KEPT, Will's pick, and the whole round. It lands as the Library's `cinema-hero`
    entry, badged `new`, with the engine carrying its own contract.
  - `band`, `orbit`, `stack-below`: retired with the board, tables and all. Git holds them at
    `a6afec3b` under `sandbox/home-hero/streams.ts`.
- **The ruled 560px hero minimum does not survive the composition.** It is 683 at `lg` and 642 at
  `base`, derived (the code's clearance under the sticky header, plus the measured clear line, the
  block and its foot air) rather than chosen, and the contract pins both. Checked on the shortest
  window each serves: 1440x720 and 1024x720 at `lg`, 375x667 at `base`. Past the floor the hero
  grows and its last pixels scroll, which is the honest failure.
- Assets requested from Will: **the 34 squares (ASSETS row 2) are still the ask, unchanged**. The
  band needs 18 for no photograph to be on screen twice (nine a side at either breakpoint, read out
  of the code by the contract, not retyped); the twelve manifest stand-ins cycle until the set
  lands, and the swap is by id with nothing else changing.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Browser pane: left on **tab-7**, my own tab, at `http://localhost:3131/design/library/cinema-hero`,
  viewport emulation reset. The Orchestrator's tab-1 on :3000 was not disturbed once I noticed it
  had taken the pane. My dev server on :3131 is stopped, so that tab will not answer until someone
  runs one.
- Look at first: the hero at 1440x720 and at 375x667, where the axis clamp is doing the work. That
  clamp is the one thing the board never had to solve, and it is what decides whether the
  composition Will picked survives a real window.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-17). Will's round-seven pick shipped: the home hero is
the band of photographs streaming out of the real demo QR on one axis, with the ruled headline, the
ruled sentence and the two actions in one block at the band's measured clear line, and no caption.
The living album wall left with its three scrims, its reel card and the kinetic word. The board's
engine came out of the lab as `hero-stream.ts`, cut to the one composition, with its horizontal
turned into a fraction of the hero's half-width (so the band is fluid) and its geometry turned from
two canvases into two breakpoints, each solved at the canvas Will judged and re-checked at the
narrowest viewport it serves. Four numbers were measured on the rendered page rather than reasoned
about, one of which was a phone QR too small to scan. The board retired in the same act.
