---
track: brand-r2
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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
- The house light where there is no photograph and no seed? **One dusk sky in every take** (built, a carried call on
  the board): the five lamps lit as the icon lights them, amber to violet from the top-left, never chips side by side.
- May a take change its paper stock? **Yes** (built, carried): Aperture keeps production's gallery white, Ink a warm
  uncoated stock, Cast a neutral daylight white.
- Do Contact Sheet and Everyone's Color stay on the board? **No** (built, carried): retired with round one; their
  touches live inside the takes (the rebate's film edge, the warm stock, the seed's orb).
- Does a take redraw the wordmark? **No** (carried): Will's v1 stands; the brand-marks board owns it after this pick.

## System-doc edits (in place, owned facts only)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

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

- Done: the shared Afterglow r2 system (`afterglow/`: values, the take contract, the kit, marks), three takes wired as
  the board's one ask (`aperture/`, `ink/`, `cast/`), slides 01 cover and 05 signature (mine); helpers drew 02 to 04
  (finished), 06 to 08, 09 to 11, 12 to 14 and the Ink and Cast light (each nearly done when the usage limit cut them).
- Next: re-run each helper's last step, capture all fourteen slides of all three takes at 1440 and 375, the creative
  director's fresh-eyes pass (`_scratch/brand-r2/cd-brief.md`), one refinement on everything it names, the spec's
  recommendation from the drawn decks, the light gate, the handoff.
- Mid-flight: nothing uncommitted beyond this WIP; the dev server listens on 3137.
