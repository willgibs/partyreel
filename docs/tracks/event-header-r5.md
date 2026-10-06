---
track: event-header-r5
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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

- The work commit and the sync commit, pushed (or: launch-prep had not moved); the head is in the chat line
- Every claim names its artifact (a commit, a log line, a path), so the Orchestrator checks rather than believes.
- Gates on the synced tree, each on its own exit code, and the sha they ran on
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The items, one line each
- Assets requested from Will: none, or one per line: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- Board ideas: an improvement you saw beyond your lane, one line each (the Orchestrator may open a board for it)
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Calls his to overrule, one line each
- Look at first: ...

## Where I am

- Done: the fresh-eyes pass applied (glass cut; the point beside its word and on the band's glyph; the band the bar's
  own material; the code a pill; the reel ink; the seam rebuilt across the cards; points' ink badges and crisp paper
  edges); light gate green on the revision. Next: the Handoff.
