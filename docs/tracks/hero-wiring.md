---
track: hero-wiring
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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

- none yet

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none yet (the hero's line in `docs/systems/marketing-content.md` is the Orchestrator's to refresh at the merge; propose the sentence here)

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- Head <sha>, pushed; synced with launch-prep at <sha> (or: it had not moved)
- Gates on the synced tree: typecheck ok, lint ok, test ok (N), build ok (M pages); `pnpm lab:smoke` ok
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The items, one line each: `<id>: <the builder's verdict>; a kept one becomes <the Library entry it lands as>`
- Assets requested from Will: none, or one per line: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Look at first: ...

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
