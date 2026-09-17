---
track: album-hero
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "78a54014"
board: album-hero
owns:
  - src/app/(dev)/design/sandbox/album-hero/
reads:
  - src/app/(dev)/design/sandbox/home-hero/shared.tsx
  - src/app/(dev)/design/sandbox/registry.ts
  - src/components/marketing/system/page-hero.tsx
  - src/components/marketing/sections/features/album/arrivals-hero.tsx
  - src/components/marketing/sections/features/album/arrivals-stage.tsx
  - src/components/guest/guest-masonry.tsx
  - src/components/marketing/frames/browser-frame.tsx
  - src/lib/constants/feature-pages.ts
  - docs/design/rulings.md
---

# lp/album-hero

**Goal.** Round three of the album page's hero, asked for by name. Will scrolled the board ahead of
his sitting (2026-09-17): "It looks like the album page's hero is copying the exact H1 content
component from the home hero but dropping the QR code, leaving a ridiculous looking center gap." "When
I asked for this to be repurposed to the live album page, I didn't want it used literally as is. It
needs to be redesigned to feel custom." "Let's make the next round of album hero visuals feel a bit
more calm. These are all moving too fast and feel distracting from the actual page content. Many
frames are also jittery/buggy." "The album dashboard visual beneath the hero should be centered and
width constrained. The attached screenshot of the Cosmos hero is a good idea, but a bit wider." "I'd
love to see a version of that [the Cosmos hero, cosmos.so: photographs scattered in a ring around a
centred lockup, tilted a little, fainter toward the edges] as well in our new album hero exploration
versions." What comes back: a pick-one catalog of FOUR calm compositions of the album page's hero on
one engine, each the real hero at 1:1 on the cinema ground with its own Replay, the page's own lockup
as ONE block with no hole in it, and under every card the live album centred and width-constrained;
the winner ask with "None of these"; the whole feature page as the page reading. Not in this round:
any production byte (the wiring follows his pick), new photographs (ASSETS rows 2 and 9 and the two
clips stay requested; the twelve stand-ins cycle), a lamp on the hero.

**The four cards.**
1. *The orbit* (the Cosmos shape): the photographs standing in a ring around the lockup, each tilted
   a few degrees, fainter toward the edges, drifting a few pixels; every few seconds one card fades
   out and another fades in at an empty place, so the ring turns slowly and reads as an album filling,
   never as traffic. The home hero's round-seven orbit is the precedent for stations as an angle and a
   radius, the block-box test and the radial fade: `git show ccf93732:"src/app/(dev)/design/sandbox/home-hero/streams.ts"`
   (the board itself is being retired by the hero-wiring lane; read it from git, never import it).
2. *The field, calmed*: today's emanation (`field.tsx`) at a third of the speed and a third of the
   frames (12 to 16 lit at once), the origin behind the lockup's centre with the quiet zone kept, and
   the jitter gone: size each card's DOM box to its largest visible moment so it only ever scales
   DOWN (the home hero engine's `fitOf` rule; a photograph that grows re-rasterises and stutters),
   write z-index on change only, no filter, no blur.
3. *The shelf*: one band of photographs along the top edge and one along the foot, each drifting
   sideways very slowly in opposite directions, the lockup in the clear middle; the album as a contact
   sheet, the calmest continuous motion on the board.
4. *The arrival*: a still scatter around the lockup where every few seconds one photograph lands at
   an empty place with a soft settle and the oldest fades; the truest to the product (a new tile
   landing as a guest uploads) and the calmest of the four.

**What is settled, so build rather than ask.**
- The lockup is the album page's own and one block: the eyebrow (the feature's nav label), the
  page's headline, its sentence and its two actions as `PageHero` sets them (`arrivals-hero.tsx`
  is what ships; `feature-pages.ts` the words), composed for this hero rather than borrowed from the
  home hero. Nothing is born inside the lockup, so there is no vent and no gap; the words sit in one
  clear zone measured to their ink as round one measured it, and no photograph ever crosses it.
- The calm rule, measured and pinned by the board's own test: nothing on screen moves faster than
  about 40 px a second at 1440 (the arrival's settle excepted, and it is short), at most sixteen
  photographs lit at once, every card at its raster size, reduced motion the designed still, the loop
  held on a hidden tab through the stage's `data-paused`, no keyframe in the board's sheets
  (`keyframe-uniqueness`), the media at 100 percent with no darkening layer (bible 1).
- The live album under every card, centred and width-constrained: Cosmos's centred block a bit wider,
  about 880 px at 1440, as a config strip 720 / 880 / 1040 on the album step so he picks by eye; the
  frame keeps the host's own chrome and the Live now dot (bible 4); two columns as the product ships,
  three at the widest; the round-two `width` ask is withdrawn into that strip and the album section's
  wiring note (the two declarations) stays. At 375 the frame is the canvas less the gutter.
- The asks: the winner (the four plus none, `mode: "pick-one"`, `winner`, the real page as the
  `stage`); the album's width as a tile step on the frame; `headline` (lg / xl) and `no-script`
  kept as tile steps on the chosen card; `copy` kept means-only; `life` withdrawn (the arrival card
  is that question drawn). Every card says what winning lands as (the hero component on
  `/features/album`, in files) and carries four facts read off the tables (grammar, cost, frames, at
  rest). The round is 3; his notes above go into `history` as round two's verdict.
- The page reading stays: the whole feature page with the new hero and the centred album under it,
  every shipped section in order, so the cut to paper is judged under a calm hero.
- `sandbox/home-hero/shared.tsx` stays importable (`FRAMES`, `CANVAS`, `GUTTER`, `LADDER`,
  `Mode`, `Photo`); nothing else under `sandbox/home-hero/` will exist by the merge, so import
  nothing else from there. `registry.ts` and `touchpoints.ts` are the Orchestrator's; the board's
  registration lines do not change (same id, same files).
- The board under 1,200 words with no declaration; the argument folded; the specimens are the
  argument.

**Binds.** The bible (`/design/library/rules`; 1, 4, 10, 13, 14, 18 lean on this board), the
contracts of every component under a path you own, and the policies; everything else is precedent.
Will's rulings in `docs/design/rulings.md` (the wind-down; a question carries its context; the
review as an onboarding form) and his six notes quoted above, which are this round's brief.

**Verify on.** The walk from the desk end to end at 1440 and 375 with reduced motion on and off (the
four cards, the width tiles, the headline and no-script tiles, the page reading), the jitter gone at
1:1 judged by eye on a slow scroll and, if you can, a short screen recording; `pnpm lab:smoke` (the
board under budget, every route green); the gate (typecheck, lint, test, build).

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
- The items, one line each: `<id>: <the builder's verdict>; a kept one becomes <the Library entry it lands as>`
- Assets requested from Will: none, or one per line: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Look at first: ...

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
