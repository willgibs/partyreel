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

- **Q1, the four takes after desk 4's Afterglow (relayed mid-round).** Every take speaks Afterglow: a waiting count is
  the half-lit Standby point and its word, no hue and no glow; colour is only the screen's one light. So the painted
  badge take became `points` (the badge's place, a point's form: the point on the glyph, its word the line) and a
  white-light "lit" take gave way to `seam` (Afterglow's Seam as the hub's one light, sampled from the cover).
  Recommended and built: `keys`, `glass`, `seam`, `points`.
- **Q2, both grounds in every frame.** His paper note ("very tough to nail on anything light") made paper a frame of
  its own beside the room in every take, both live; the Ground knob retired for a Scroll knob (first screen, or both
  scrolled into the album to compare bands). Recommended and built.
- **Q3, the standby point holds still on the hub.** Afterglow's breathes (2.4 s); a host keeps her hub open all night,
  the strip's own no-pulse rule. Recommended still: carried call `standby-still`, his to overrule.
- **Q4, the tablet.** Drawn at 820 by 1180; every take's tiles hold from 640 to 1088 (a desk card needs 200px, so the
  desk's cards start at a row of 1088, not Tailwind's `lg` 1024, where five are 187px). Read off the row's width
  (a container query), never the knob. Carried call `tablet-tiles`.
- **Q5, the band's ends.** The cover's face at the left end, the code at the right end where the cover's code stood,
  the doors centred (Review folds straight up). Carried call `band-ends`, every take.
- **Q6, reduced motion.** The fold dissolves in place (150 ms, opacity only) rather than snapping. Carried call
  `reduced-fold`, every take.
- **Q7, the seam's light values.** Copied from brand r1's Afterglow (`light.ts`: the cover stills' sampled hues and
  intensity, its registers and corrections), one hue at three depths (never a spectrum). Brand r2 may retune them; the
  wiring needs a per-photo sampler (Afterglow's own listed cost). Recommended as built.
- **Q8, glass on a phone.** The cover grows to 452px so every pane stands on the photograph (glass over paper's pale
  page greys its words). Recommended as built; a listed cost.
- **Q9, round four's door files.** `glass.tsx`, `windows.tsx`, r4's `cards.tsx` and their sheets deleted from the board
  folder (git keeps them); the four takes ride one row and fold (`card-kit.tsx`). Recommended as built.

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

- Done (WIP commit): the round-5 board in Afterglow's language: four takes (`keys`, `glass`, `seam`, `points`) on one
  row and fold (`card-kit.tsx`), both grounds side by side in every take, a tablet (820), the spec rewritten
  (recommended `seam`), registry tests, lint, types, `lab:smoke` and `lab:demo --board event-header` green.
- Mid-flight: the fresh-eyes pass returned (recommend Seam, borrow Points' phone; Glass not a contender as drawn;
  shared fixes: the count's point beside its word, the band's opaque ground from the fold's first frame, a lighter
  paper veil, the reel's violet to ink, the band's code a ground pill, a thinner halo on paper). Next: apply it, re-run
  the light gate, fill the Handoff.
