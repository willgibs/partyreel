---
track: brand-r2
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "87b0bbc7"            # the launch-prep SHA the branch was cut from
board: brand
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/brand/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/brand.json
  - src/app/globals.css
  - docs/systems/design-system.md
---

# lp/brand-r2

**Goal.** Brand round 2: Afterglow polished to world-class, above all on light surfaces, as three or four complete takes to choose one from.

## The brief

**Round 2 of brand, from Will's desk 4 answer:** vision = Afterglow. His note, verbatim, which is this round's brief: "This feels so much more like a brand identity than just throwing Aurora everywhere. However, an additional exploration to polish would be huge. I can tell some creativity was distilled across so many ideas on how to infuse the vision. The other options were also pretty cool (Contact Sheet and Everyone's Color) and could be checked to see if those explorations offered any additional ideas for Afterglow enhancement. No worries if Afterglow wants to take its totally own creative direction. As a final note, remember this should feel polished, not like a junior designer was told to build a rainbow app. We are world-class tastemakers." And his extra note, the round's hardest problem: "While afterglow looks effortlessly beautiful on dark UI, it is very tough to nail on anything light. It's washed out easily."

**What stays:** Afterglow's idea (r1's `afterglow/` deck): light is the brand, never paint; every colour is light sampled from the photographs, then the event's seed, then the house five; drawn only as a Ring (round the Add, and the icon), a Seam (where media ends) or a Bloom (behind the one live subject), one per screen, resting still and answering events; status a point and its word (Standby half-lit with no hue, Ready, Fault); the room where photographs play, paper where people read and decide. Restraint is the brand: one light a screen, colour only from the pictures.

**The one ask, "Which Afterglow?"** Three or four complete takes on the whole system, each a deck in r1's order (cover, the idea, wordmark and icon, colour and status, the signature, without media, type, imagery and motion, dark and light, then the touchpoints: the home hero, a dark page, a LIGHT page, the hub empty, the QR card, the icon on a home screen), each simply your most polished Afterglow. They share the idea and differ in a few load-bearing constructions, overlap welcome, never a caricature to stand apart (Will's standing warning: options that try too hard to differ all feel too themed; the best answer may be one take with a few magic touches from another). Above all, each take answers paper: how the light lives on a light page without washing out (where it may and may not appear on paper, what it becomes there, what carries it), shown on paper as convincingly as in the room, on every touchpoint that has a paper form. Mine Contact Sheet and Everyone's Color (r1's `contact-sheet/` and `everyone/`) for what would make Afterglow better, and take it, or take Afterglow its own way. Recommend one and name, per take, the touch worth borrowing from a neighbour.

**The method r1 ran is the bar:** the team helpers per take, the creative director's fresh-eyes pass against "world-class tastemakers, never a rainbow app", and one refinement on everything it names. The brand-applied boards (brand-marks, the signature across app and marketing, marketing-themes, demo-framing r6, presence) wait for this pick. identity r5 draws its atom sets inside Afterglow's world in parallel (form, never hue): its sets are what your light lands on.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app. Port 3137 is yours; 3000 is Will's desk.

**The board's shape.** The board is one folder, `src/app/(dev)/design/sandbox/brand/`, and nothing else names it: the registry finds it, and retiring it is deleting it. `spec.ts` is `defineExploration` (`src/components/lab/exploration.ts`) and pure data: its id `brand`, its title, `surface`, `desk: 5` (by leverage, lower first) and `lives` (the paths it redraws), its `opening` and `terms`, and every ask with its context layer (`where`, `when`, `matters` beside `lands`, each option's `gains` and `costs`, `because` in a line). `board.tsx` exports one component, `ExplorationBoard` with a preview per option (`PreviewsFor`). `registry.test.ts` holds all of it; `pnpm lab:smoke` and `pnpm lab:demo` run on the board your change reaches.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The board at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke --base http://localhost:<port>` (it crawls what your change reaches, the board and the desk; `--all` for the whole lab); `pnpm lab:demo --board <board> --base http://localhost:<port>` pressing every step.

## Questions (a recommended answer each; the Orchestrator relays them)

- Three takes or four? **Three** (built): Aperture (light kept in dark pieces of the room on paper), Ink (one colour,
  glowing in the room, printed on paper) and Cast (the photograph's own light, a glow in the room, a coloured shadow on
  paper) are the three honest exits from the pale middle where round one washed out; a fourth drew as a weaker copy of
  one of them (toned paper with white-hot light; glass objects), so it would have been a caricature.
- Do the takes share one composition per slide? **Yes** (built): every slide is one drawing each take fills with its
  constructions (`afterglow/take.tsx`), so pressing between takes compares like with like and they differ only where
  their answers do. Overrule: each take art-directs its own deck.
- The house light where there is no photograph and no seed? **The icon's ember in every take** (built, a carried call on
  the board): the lamps lit as one glow from the top-left, amber to coral, never chips side by side (a first draft's
  dusk sky to violet read as the Instagram gradient to the creative director).
- May a take change its paper stock? **Yes** (built, carried): Aperture keeps production's gallery white, Ink a warm
  uncoated stock, Cast a neutral daylight white.
- Do Contact Sheet and Everyone's Color stay on the board? **No** (built, carried): retired with round one; their
  touches live inside the takes (the rebate's film edge, the warm stock, the seed's orb).
- Does a take redraw the wordmark? **No** (carried): Will's v1 stands; the brand-marks board owns it after this pick.

## System-doc edits (in place, owned facts only)

- none: a board ships no production byte; the pick's wiring lane writes `design-system.md`'s light section.

## Deferred (ROADMAP one-liners, bucket named)

- none

## Handoff (replaces the chat report)

- Commits on `lp/brand-r2`, pushed: work b325e22ae, 867c67b98, 61b2c2f24, 90a0a3d87; the sync 787544589 (`git merge
  origin/launch-prep`: globals.css, design-system.md and the lab kit had moved since the cut; no conflicts); this
  manifest's commit is the head in the chat line.
- Gates on the synced tree 787544589, each on its own exit code (logs in `../partyreel-wt/_scratch/brand-r2/gate2-*`):
  `pnpm typecheck` 0; `pnpm lint "src/app/(dev)/design/sandbox/brand"` 0; the board's tests (`registry.test.ts`,
  `kit-discipline`, `terms`, `boundary`, `dead-components`) 0, 5 files, 47 tests; `pnpm lab:smoke --base
  http://localhost:3137` 0, 18 checks, brand 641 words of 1200; `pnpm lab:demo --board brand --base
  http://localhost:3137` 0, `brand.take ok`, 3 options of 14 frames, the stage moves up to 90.85%, 1440 starts 0.30
  down with 18 px to the dock, 375 starts 0.35 down with 81 px to the dock. The light gate (a board lane): no full
  test run, no production build.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = 95 paths under `src/app/(dev)/design/sandbox/brand/`
  + this file; no exceptions.
- The one ask, `take`: "Which Afterglow should every brand board after this one grow from?", three takes, each a
  14-slide deck in round one's order at 1440 and 375: Aperture (recommended), Ink, Cast.
- One composition per slide, every take: `afterglow/slides/` (14 shared drawings) filled through the take contract
  `afterglow/take.tsx` (each take's light primitives handed a source and a ground, its paper stock, where its one
  subject, footer and printed card stand on paper, its type ink `inkFor`, its words); `afterglow/system.tsx` the
  shared values and room primitives, `afterglow/kit.tsx` the pages' parts, `afterglow/marks.tsx` the v1 wordmark
  (untouched) and the ring icon.
- Aperture (`aperture/`): on paper the light never touches the page; it lives inside dark pieces of the room (a flat
  disc round the Add, a black mount hot at the subject's edge, a black strip with the event's credits under a print,
  the black footer), as bright as in the room; production's gallery white.
- Ink (`ink/`): one colour per album, its strongest light; a glow in the room, printed solid on paper (a rule with the
  credits in the same ink, a band round the Add, a mat behind the one subject, a solid seed disc), names and the Pro
  price in that ink; a warm uncoated stock.
- Cast (`cast/`): the light is the photograph itself (an SVG filter: blurred, merged, held at one strength, unOlived);
  a glow round it in the room, on paper a coloured shadow falling down and right, dense, short and hard-edged, darker
  than the page; a daylight white.
- Round two's polish in every take: no spectrum (the house light is the icon's ember), three hues a light at most,
  fewer and larger lights, one to a screen, Will's v1 wordmark.
- The method: six helpers (four slide teams, an Ink team, a Cast team), the creative director's fresh-eyes pass on all
  84 captures (its pick: Aperture), one refinement on everything it named (five fixes per take and the cross-cutting
  notes: jargon cut from every slide, hard-edged album crops, the dusk sky narrowed to the ember, Ink's halftone
  replaced by solid ink, Cast's lemon seam made short and dense, the share card's QR removed).
- Mined from round one: Contact Sheet's film edge (Aperture's credits on its black strip, Ink's credits under its
  rule), its warm stock (Ink's paper), Everyone's Color's seeded orb (the seed covers); both decks retired.
- Each take names the touch worth borrowing from a neighbour on its idea slide (02): Aperture from Ink, the printed
  rule and credits where paper meets a photograph outside a plate; Ink from Aperture, one lit plate for the reel on
  paper; Cast from Ink, crisp print wherever a cast would smear.
- Assets requested from Will:
  - event photographs for the brand decks · 12 to 16 stills, 2400 px on the long edge, a wedding, a birthday and a
    festival, night and day, shot on guests' phones, JPG · replaces the bootstrap twelve (`MARKETING_IMAGES`, 900 px,
    soft at deck sizes)
  - a reception table for the QR card · one still, 2400 px, low angle, shallow focus, warm evening light, JPG ·
    replaces `reception-table` behind the A6 card on slide 13
- Board ideas:
  - The lab kit's whole stage wears a width a fraction short of the row it measured: on this board with the 375 knob
    at a desk, 14 slides of 374.95 px plus 13 gaps of 32 px need 5665.29 px and `fitStage` (`whole.ts`) wears 5665 px,
    so the last slide wraps and the stage draws 1018 px into a 567 px room (`pnpm lab:demo --board brand --state
    screen=375`: CUT and CLIPPED on every option); round the worn width up, or give it a pixel of slack.
  - A motion capture in the lab (a short loop per option): a light that answers events (the reel's Bloom changing on
    each cut, a ring filling as files send) is judged still today; every helper asked for it.
  - Production's footer (`.surface-ink`) already is Aperture's black footer: whichever take wins, lighting the
    footer's top edge from the page's photographs is the cheapest first wiring.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Calls his to overrule:
  - The recommendation: Aperture (the creative director picked it too); Ink if paper should feel printed, Cast if the
    light should land on the page itself.
  - The house light: the icon's ember, amber to coral, in every take (not round one's five lamps, not a dusk sky).
  - A paper stock per take: Aperture production's gallery white, Ink a warm uncoated stock, Cast a daylight white.
  - Ink's halftone dropped for a solid mat at a fourteenth of the subject (the creative director called the dots a
    gimmick; a tenth read as a frame).
  - The share card (13) has no code (the card is the link) and stands on each take's subject ground: the room in
    Aperture, paper in Ink and Cast.
  - Slide 08 compares round one with each take as a lit card rather than a Seam (in Cast a fall under a cover reads
    like round one's band at a glance).
  - Round one's other two decks retired from the board; the v1 wordmark untouched in every take.
- Look at first: the cover (01), the light page (11) and the signature (05) in each take: the cover is each take's
  whole argument in one photograph across the cut, and 11 is "light on anything light".
