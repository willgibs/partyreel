---
track: event-header-r5
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "e123a6a9"            # the launch-prep SHA the branch was cut from
board: event-header
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/event-header/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/event-header.json
  - src/components/app/event-feed/event-hub-head.tsx
---

# lp/event-header-r5

**Goal.** Event-header round 5: three or four polished takes on the picked cards doors.

## The brief

**Round 5 of event-header, from Will's desk 3 answer:** doors = cards. His note: "This feels a bit more pronounced than the glass capsule, without shouting like the quiet windows with their more media-forward visuals do. Let's carry this version forward, but run another exploration to see what some of your ideas of polish look like." The cards (the cover dissolves into the page and five cards stand across the seam, every one in sight on a phone; stuck, they fold into pills under the bar) are being wired into production in parallel (event-header-wiring); draw from r4's own cards (`cards.tsx` through `door-kit.tsx`) meanwhile.

**One ask: polish.** Three or four takes on the cards, each a real contender a strong product team would ship and simply your best polish idea, overlap welcome, never a caricature to stand apart (Will's standing warning in the lab: options that try too hard to differ all feel too themed; the best answer may be one option with a few magic touches from another). Across: what a card holds and how its count reads; light and depth at rest and when something waits (the waiting colour stays the brand's); the fold into pills under the bar and back; the press and the focus (settled in identity: shrink and the halo); a phone's reach; a tablet (640 to 1024, where five cards at about 190px cut "Highlight reel": the ROADMAP line); reduced motion. Recommend one and name the touch worth borrowing from another. G1, G2 and G4 as carried. Form, never hue: brand r1 (Will's desk 4) owns colour.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app, and nothing deploys. Port 3135 is yours; 3000 is Will's desk.

**The board's shape.** The board is one folder, `src/app/(dev)/design/sandbox/event-header/`, and nothing else names it: the registry finds it, and retiring it is deleting it. `spec.ts` is `defineExploration` (`src/components/lab/exploration.ts`) and pure data: its id `event-header`, its title, `surface`, `desk: 20` (by leverage, lower first) and `lives` (the paths it redraws), its `opening` and `terms`, and every ask with its context layer (`where`, `when`, `matters` beside `lands`, each option's `gains` and `costs`, `because` in a line). `board.tsx` exports one component, `ExplorationBoard` with a preview per option (`PreviewsFor`). `registry.test.ts` holds all of it; `pnpm lab:smoke` and `pnpm lab:demo` run on the board your change reaches.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The board at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke --base http://localhost:<port>` (it crawls what your change reaches, the board and the desk; `--all` for the whole lab); `pnpm lab:demo --board <board> --base http://localhost:<port>` pressing every step.

## Questions (a recommended answer each; the Orchestrator relays them)

- **Q1, three takes in Afterglow's language (desk 4 relayed mid-round).** A waiting count is the half-lit Standby point
  and its word, no hue and no glow; colour is only the screen's one light. Built: `keys` (the house's keys,
  achromatic), `seam` (Afterglow's Seam as the hub's one light, sampled from the cover, the cards across it) and
  `points` (the count an ink badge on the glyph, a phone's one row and foot tab bar). Recommended: `seam`, borrowing
  `points`' phone.
- **Q2, glass cut at the fresh-eyes pass.** Drawn whole (Crystal panes on the photograph, one capsule stuck) and cut:
  over the cover's scrim its frost cannot show, so in the room it landed on keys' answer, and on paper it read as a
  dark slab (two takes on one answer are a finding). Recommended: three takes, the brief's lower bound.
- **Q3, both grounds in every frame.** His paper note ("very tough to nail on anything light") made paper a frame of
  its own beside the room in every take, both live; the Ground knob retired for a Scroll knob (first screen, or both
  scrolled into the album to compare bands). Recommended and built.
- **Q4, the standby point holds still on the hub.** Afterglow's breathes (2.4 s); a host keeps her hub open all night,
  the strip's own no-pulse rule. Carried call `standby-still`.
- **Q5, the reel's glyph goes ink.** Afterglow paints no hue on a control; production's violet was the hub's one
  painted colour. Carried call `reel-ink`.
- **Q6, the band.** Its ends: the cover's face left, the code (now a pill of the band's material, not the white chip)
  right where the cover's code stood, the doors centred so Review folds straight up (`band-ends`). Its ground: the
  app bar's own material, ground over a blur with a hairline, there from the fold's first frame (`band-ground`; the
  veil let the album's words print through mid-fold and fogged paper's first row).
- **Q7, the tablet.** Drawn at 820 by 1180; every take's tiles hold from 640 to 1088 (a desk card needs 200px, so the
  desk's cards start at a row of 1088, not Tailwind's `lg` 1024, where five are 187px), read off the row's width (a
  container query). Carried call `tablet-tiles`.
- **Q8, reduced motion.** The fold dissolves in place (150 ms, opacity only) rather than snapping (`reduced-fold`).
- **Q9, the seam's light.** Brand r1's values carried (`light.ts`: the cover stills' sampled hues and intensity, its
  registers and corrections), tightened for a row: in the room a near-white core, two pixels of the lamp and a
  twelve-pixel fall under a quarter strength; on paper an opaque source line nudged toward yellow and a four-pixel fall;
  a line's chroma capped at 0.12 to 0.15; no photograph, no colour (the edge waits unlit). Brand r2 may retune them;
  the wiring needs a per-photo sampler (Afterglow's own listed cost).
- **Q10, round four's door files.** `glass.tsx`, `windows.tsx`, r4's `cards.tsx` and their sheets deleted from the
  board folder (git keeps them); the takes ride one row and fold (`card-kit.tsx`).

## System-doc edits (in place, owned facts only)

- none (a board ships no production byte)

## Deferred (ROADMAP one-liners, bucket named)

- Now: the hub code's corner count (`EventCodeDoor`) still wears the retired waiting amber; Afterglow's standby point
  and its word would replace it (brand r2 or its wiring).

## Handoff (replaces the chat report)

- **Commits, pushed on `lp/event-header-r5`:** WIP `c6e1aabbd` (four takes), `c68b505b6` (the fresh-eyes pass
  applied, three takes), `730437f42` (the reduced fold's ground), the sync `2df95ffc1` (merge of launch-prep at
  `e10377e49`: event-header-wiring into my read `event-hub-head.tsx`, identity-wiring's halo and shrink), `0644b7153`
  (the band's code chip composes with production's halo), then this manifest. launch-prep moved after the sync
  (`94dd62e41`: records, crumbs-82, credit-watch); none touches my folder or reads, and it merges cleanly, so no second
  sync.
- **Gates on the synced tree, sha `0644b7153`, each its own exit code** (a board's light gate, PROGRAM's "speed over
  proof"; logs in `../partyreel-wt/_scratch/event-header-r5/g2-*.log`): `pnpm typecheck` 0; `pnpm lint` 0;
  `vitest run src/app/(dev)/design/ src/components/lab/ src/app/keyframe-uniqueness.test.ts
  src/lib/track-manifests.test.ts` 0 (757 passed); `pnpm lab:smoke --base http://localhost:3135` 0 (20 checks, the
  board's reading 881 of 1200 words); `pnpm lab:demo --board event-header --base http://localhost:3135` 0 (1 step,
  3 options of 2 frames, the stage moving up to 5.89%; at 1440 it starts 0.30 down, at 375 0.35). No full test run and
  no production build (a board ships no production byte).
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` = 25 paths under
  `src/app/(dev)/design/sandbox/event-header/` (round four's `cards.*`, `glass.*`, `windows.*` deleted) + this file.
  No exceptions.
- **Items:**
  - The board at round five (`spec.ts`): one ask, `cards`, three takes: `keys` (`cards-keys.*`), `seam`
    (`cards-seam.*`, recommended, borrowing `points`' phone), `points` (`cards-points.*`); round four in history; six
    carried calls.
  - One row and fold for every take (`card-kit.tsx`, `card-kit.css`): the footprint, the band (the face left, the code a
    pill right, the doors centred, the bar's own material from the fold's first frame), the FLIP fold with a cascade
    from Review out, reduced motion's dissolve, the identity halo and shrink drawn on the doors, and every shape read off
    the row's width (a container query: a phone's grid under 640, tiles to 1088, the desk's cards past it).
  - Afterglow's grammar on every take: a waiting door's standby point beside its word, its number alone in the
    readout's figures, the point on the glyph's shoulder in the band; every glyph ink (the reel's too).
  - `light.ts`: the cover's light in Afterglow's registers, brand r1's sampled values carried (one lamp, three depths,
    capped for a line; no photograph, no colour).
  - Frames: both grounds side by side in every take, both live; a tablet screen (820 by 1180) on the Screen knob; the
    Ground knob retired for Scroll (first screen, or both scrolled into the album). `scene.tsx`, `head.tsx`, `hub.tsx`
    and `album.tsx` take the tablet.
  - Glass drawn whole (Crystal panes on the photograph, one capsule stuck) and cut at the fresh-eyes pass: Q2.
- **Captures for the desk** (kept, the lane's scratch): `../partyreel-wt/_scratch/event-header-r5/shots/pack/`
  (`r-*` the final takes: bands, phones, tablets, moments) and `shots/q-zoom.png` (the seam's light at 2x).
- **Assets requested from Will:** none.
- **Board ideas:**
  - The voice: "Guests" beside "As a guest" invites a mis-tap ("Preview"?), "Guests · 34 guests" says its noun twice,
    and "1 left" and "You let in" read unclear out of context (the fresh-eyes pass).
  - Seam needs a real per-photo light sampler in production (Afterglow's own listed cost), the brand round's or the
    seam's wiring's; the cover's stills dissolve, and the light reads them as one lamp.
  - Points' foot tab bar wants a walk in iOS Safari against its collapsing bottom toolbar before any wiring.
  - For Keys to read as the house's material, the album's own toolbar chips beside the doors need the same key face.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none.
- **Calls his to overrule** (each a carried call on the board): `band-ends` (the code a pill at the right end, the
  doors centred), `band-ground` (the bar's own material), `standby-still` (the point holds still on the hub),
  `reel-ink` (every glyph ink), `tablet-tiles` (tiles from 640 to 1088), `reduced-fold` (a dissolve, never a snap),
  `settings-paused` (G4: Paused, plain); and three takes rather than four (Q2).
- **Look at first:** `seam` tonight at 1440, the room beside paper (the light between the doors); then press
  `points` at 375 and scroll (one row, then the foot bar); then `keys`, press Guests in Try it (an open room's key stays
  down).
