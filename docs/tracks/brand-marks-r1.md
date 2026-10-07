---
track: brand-marks-r1
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "2e094108"            # the launch-prep SHA the branch was cut from
board: brand-marks
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/brand-marks/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/brand.json
  - src/app/(dev)/design/sandbox/brand/spec.ts
  - src/app/globals.css
  - docs/systems/design-system.md
  - src/lib/brand/wordmark.ts
  - src/components/shared/logo.tsx
---

# lp/brand-marks-r1

**Goal.** Board brand-marks r1, desk 6's first: Aperture's marks made final, drawn on production's own surfaces: the wordmark and the icon, the palette's tokens and the status set.

## The brief

**The round's direction (Will, standing):** world-class tastemakers, never "a junior designer told to build a rainbow app"; light, never paint; restraint is the brand. Delight where it costs nothing in clarity; attention earned, never yelled; production the working version.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app, and nothing deploys. Port 3138 is yours; 3000 is Will's desk.

**From Will's batch (2026-10-06; `docs/reviews/brand.json` round 2):** take = aperture. Brand r2's board (`src/app/(dev)/design/sandbox/brand/`: its spec, the Aperture take's deck in `afterglow/`) is the vision you grow from: on paper the light never touches the page; it lives in pieces of the room the page holds (the shutter's puck, one lit plate a screen, the foot's slab), as bright as in the room; restraint is the craft (one lit plate a screen); its recommendation borrows Ink's printed rule where paper meets a photograph. Its carried calls stand, none overruled: the house ember where there is no photograph and no seed (the lamps lit as one glow from the top-left, amber to coral, never side by side); Aperture keeps production's gallery white; Contact Sheet and Everyone's Color retired; Will's v1 wordmark untouched in brand r2, "the brand-marks board redraws it, if at all, after this pick". Afterglow's settled frame (brand r1): colour from the photographs, then the event's seed, then the house; drawn only as a Ring, a Seam or a Bloom, one to a screen, still until something happens; a status is a point and its word (Standby half-lit with no hue, Ready, Fault).

**This board's question: the marks, final.** Asks you shape (each one decision, options real contenders, previews whole on production's surfaces at a desk and a phone, in the room and on paper): the wordmark (v1 kept and finished, or redrawn in Aperture's hand), the icon (the Ring as the shutter's puck, its home-screen and favicon forms, its paper form), the palette's tokens (the room's blacks and the plate, paper's white, the house ember, the hairlines and ink, each a token production can wear: `globals.css`'s names), and the status set (Standby, Ready, Fault, beside "needs you", which Will already picked at event-header r6 as tally, the camera's red the palette holds, solid and never a light: given, never asked again). Offer the fix at its source: a token-level answer beats a page's.

**Desk 6 after you, never asked here:** where the light lives across app and marketing (the signature board: the footer's lit top edge, the guest door's three lamps, a light that answers a real signal), each marketing page dark or light (page themes), the hero (demo-framing r6), the guest row and the hashvatar (presence r1). Ask nothing those ask. The standing boards' open asks nearest you: none (account-moments' follow, demo-framing's stage and drive-export's exit and naming are other surfaces).

**The method, the bar brand r1 and r2 ran:** a helper per option holding the whole brief, a creative director's fresh-eyes pass ("world-class tastemakers"), one refinement on everything it names; asset gaps become Higgsfield asks in the Handoff naming their slot and theme (docs/ASSETS.md's form), the stand-in shipped meanwhile. A board's light gate (PROGRAM's "Speed over proof in exploration").

**The board's shape.** The board is one folder, `src/app/(dev)/design/sandbox/brand-marks/`, and nothing else names it: the registry finds it, and retiring it is deleting it. `spec.ts` is `defineExploration` (`src/components/lab/exploration.ts`) and pure data: its id `brand-marks`, its title, `surface`, `desk: 6` (by leverage, lower first) and `lives` (the paths it redraws), its `opening` and `terms`, and every ask with its context layer (`where`, `when`, `matters` beside `lands`, each option's `gains` and `costs`, `because` in a line). `board.tsx` exports one component, `ExplorationBoard` with a preview per option (`PreviewsFor`). `registry.test.ts` holds all of it; `pnpm lab:smoke` and `pnpm lab:demo` run on the board your change reaches.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The board at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke --base http://localhost:<port>` (it crawls what your change reaches, the board and the desk; `--all` for the whole lab); `pnpm lab:demo --board <board> --base http://localhost:<port>` pressing every step.

## Questions (a recommended answer each; the Orchestrator relays them)

Each is built as recommended and drawn as one of the board's carried calls (`spec.ts` `carried`), Will's to overrule:

- **A lockup?** Does the Ring ever stand beside the wordmark? Recommended: no, as his Sep 17 note had it for the nav and
  the foot, and nowhere else yet. Overrule: the Ring then the word where both are wanted (a press kit, a mail's head).
- **His v1 icon?** Is the Ring his v1 icon, or a stand-in until his own file lands (ASSETS row 19, "I'll upload new v1
  icon separately later")? Recommended: the Ring picked on the icon ask answers that row unless he still means to draw
  it. Overrule: a stand-in until his file lands.
- **The icon's light?** Does the icon ever wear an event's own light? Recommended: no, it is the house's, lit by the
  house ember everywhere. Overrule: an event's saved icon (its bookmark, its share card) in its photographs' light.
- **The five lamps?** Recommended: relit as the ember at their source (`--lamp-1..5` take the ember's stops), so the
  foot's seam, the confetti and a photo-less event's lamp on the dashboard (`lampOf`) glow as one warm family.
  Overrule: keep the five beside the ember, so photo-less events still differ in hue.
- **Live's breath?** Recommended: live is the tally's red and the one point that breathes (a point dimming, never a
  ring of light). Overrule: live stands still.
- **The grade?** Recommended: production's grade value for value (`palette/grades.test.ts` holds it to globals.css),
  the ember's four stops joining it as `--ember-1..4`. Overrule: camera black (every dark neutral and a step deeper,
  paper a hair whiter, its cards white). Drawn first as three grades (graphite, camera black, warm dark); the creative
  director measured production's room the same in all three (#020202, #010101, #030202), so the grade became this call
  and the one visible decision, the plate, the ask.
- **v1's display cut?** Do his three near-touching pairs (P|a 0.77, y|r 0.10, e|e 0.47 units apart) part a hair from
  48px up? Recommended: yes, in the finished option (0.9, 1 and 1 units; the bars' small cut a step more). Overrule:
  as drawn from 48px up, parted only in the bars.

## System-doc edits (in place, owned facts only)

- none: a board ships no production byte; the facts the picks change land with their wiring.

## Deferred (ROADMAP one-liners, each naming its bucket and area)

- none (the dashboard's waiting amber is event-header-wiring-2's Deferred line already; the status set's wiring items
  are in the Handoff for the board's wiring brief).

## Handoff (replaces the chat report)

- **Commits, pushed on `lp/brand-marks-r1`:** work `70cb3d19c` (the first draw), `267002f6e` (each option refined by
  its own helper), `887bbc024` (the pause note), sync `7268e7cf7` (`origin/launch-prep` merged for
  event-header-wiring-2's `--needs-you` in globals.css), work `4324795ee` (the creative director's pass, one
  refinement on each item), and this manifest at the head. launch-prep moved after the sync (storage-sums-signal,
  album-moments-wiring's arrival line in design-system.md, records): nothing the board reads or draws, no conflict, so
  no second sync.
- **Gates on `4324795ee` (the synced tree), each its own exit code 0:** `pnpm typecheck`; `pnpm lint`
  (`_scratch/brand-marks-r1/gate-lint.log`); the board's own tests with the registry's (`vitest run
  src/app/(dev)/design/sandbox/brand-marks/ .../registry.test.ts`: 41 passed); `pnpm test:rules` (85 files, 1461 tests,
  `gate-rules.log`); `pnpm lab:smoke --base http://localhost:3138` (21 checks, 0 failing; the board reads 985 of its
  1200 words; `gate-smoke.log`); `pnpm lab:demo --board brand-marks --base http://localhost:3138` (4 steps, 0
  failing, every option drawn at 1440 and 375; `gate-demo.log`). The light gate (PROGRAM, "Speed over proof"): no full
  test run, no build.
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` = 33 files under
  `src/app/(dev)/design/sandbox/brand-marks/` and this manifest; no exceptions.
- **The board, four asks, each option worn by production's own components as one paste in real frames, at 1440 and
  375, the room and paper side by side:**
  - `wordmark`: v1 finished (his ten shapes byte for byte, moved whole: a small cut for the bars' 22 and the admin's 16
    parting P|a, y|r, e|e and evening a|r, e|l; a hair at the display cut), a nameplate (PARTYREEL as an extended
    grotesque spaced by area, 394 units), a lowercase (partyreel on one ring at Urbanist's weight, 316 units); swapped
    into production's `Logo` by `pasteFor` (the svg widened by `aspect-ratio`, the path by `d: path()` and a
    transform) on the site's first screen, sign-in, the foot, and drawn on the social card (`wordmark/card.tsx`).
    Recommended: v1 finished.
  - `icon`: the Ring key-lit by the house ember (brand r2's, a ring at every size), the whole ring lit top to bottom,
    the shutter with its plus (a step under the light; its tab is the ring alone); at 1024, 180, 60, 29, the favicon's
    32 and 16 enlarged pixel for pixel, its paper form, on a home screen at night and by day, a launcher's circle mask,
    tabs on a dark and a light window and a search result (a phone's favourites at 375). Recommended: key-lit.
  - `plate`: a piece of the room on paper lifted (today's slab, 0.165) or the room's own black (0.085), on the foot and
    a menu open on the host's app on paper, with the tokens sheet (production's grade, the plate, the ember's stops,
    the relit lamps). Recommended: lifted.
  - `status`: green and red, ink until it needs you, a fault in amber; production's Badge folded into each set (an 8px
    point, no glow, Standby half-lit on `info`, `warning` folded into Fault, live breathing as a point), Ready as
    `--success`, the tally read from production's `--needs-you`; beside the hub's real doors (`DoorParts`) and the album
    going to Drive, its meters filled by state. Recommended: ink until it needs you.
- **The method:** a helper per option (eight: the three wordmarks, the three icons, the grades and the status sets each
  one helper championing every option), the creative director's fresh-eyes pass (twelve items, all refined in
  `4324795ee`: the palette made one ask and two calls on its measurement, v1's display cut, meters by state, the status
  words true of live's red, the icon asked on a home screen, no unreadable ledes, the plus under the light, the lamps'
  reach named, the opening's one home per fact, the social card and the launcher, the tab cuts, the sheet's grounds).
- **For the status set's wiring, whichever set he picks** (what a paste cannot reach): Drive's `paused` tone holds both
  a send that waits on her (Drive full, disconnected) and one that waits on Google (the daily limit), so its moments
  split before a light can say which; `toast.warning` carries the hide act beside Drive's refusals (the hide a success,
  the refusals errors); production's Drive meter fills in `--success` whatever its row's state (it takes its row's
  tone); in the ink set, approve's action hue is `--success` and goes with Ready (an `--approve` token keeps its green).
- **For the wordmark's wiring:** a picked redraw is wider than v1's 308 (the nameplate 394, the lowercase 316), so
  `src/lib/brand/wordmark.ts` takes its width as its viewBox and aspect; v1 finished is two paths (a display and a
  small cut, `logo.tsx` choosing by size; `logo.test.tsx` asserts one today); the social card draws the display cut.
- **Assets requested from Will:** none.
- **Board ideas:**
  - A photo-less event's lamp on the dashboard is one of the house lamps by id (`lampOf`); by the brand's order
    (photographs, then the event's seed, then the house) it is the event's seed light (the signature board's).
  - `docs/systems/design-system.md` says `--faint` is under 4.5:1 on every ground; globals.css (and the board's floors:
    4.98 on paper, 5.04 in the room) show it clears 4.5 everywhere but the room display's held row: a stale line.
  - The lab: pressing the tab of the option already shown records a pick, so a script that presses every tab answers
    the step (helpers met it in their own browsers; nothing reached a ledger): a press on the shown tab could only show
    it.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none.
- **Calls his to overrule:** the seven under Questions, drawn on the board as its carried calls.
- **Look at first:** the wordmark step at 1:1, the sheet's 22px enlarged as drawn beside finished, then the three words
  in the site's bar; and the plate step flipped between its options on the foot's slab (#0e0e11 against #020202).
