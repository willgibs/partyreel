---
track: privacy-hero-r4
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "cdc979a6"            # the launch-prep SHA the branch was cut from
board: privacy-hero
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/privacy-hero/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/privacy-hero.json
  - docs/systems/marketing-content.md
---

# lp/privacy-hero-r4

**Goal.** Round four of the privacy page's hero: the veil as drawn and three real variations of it, to nail it; the sealed cards gone, the sweep and the aperture banked.

## The brief

**His r3 answer** (`docs/reviews/privacy-hero.json`, 2026-09-29) opens round four (you own the board's folder; it keeps its id): `concept` = `veil`. He finds it bespoke to privacy, a photograph that only reveals what it wants to, and wants the original kept with three variations to nail it. The sealed cards are out (he doesn't like them at all). The sweep and the aperture are banked for other surfaces (ROADMAP's line on the privacy hero's two runners-up); if you retire their code from the board, give that line a `git show <sha>:<path>` pointer so they can be found.

**The round:** one ask, which veil. Draw the original as it stands and three variations as far apart as the real answers are (PROGRAM.md's round rules), each one decision's contender rather than a tuning of one number. Among the directions worth drawing: what the clearing is (a soft circle, a lens, a band), how it travels and whether it ever rests, whether one photograph or a slow succession sits under the veil, and what the veil is made of (blur, the product's own frost, grain). Draw them on the real surface: the privacy page's first screen with PageHero's words over it, at 1440 and at 375, from production's components fed fixtures. Marketing's motion rule holds (`docs/systems/marketing-content.md`: calm and fluid), reduced motion gets one still frame, and the words stay readable over every frame at both widths. The recommendation says why in a line.

**At this touch:** ROADMAP's line on `field.ts`, `field.css` and `field-layer.tsx` (alive only for `photoOf`, read by `concepts-layer.tsx`) is done here: move `photoOf` and cut the rest, since `album-page` no longer needs them (check before cutting). The ROADMAP is mine: name in your Handoff that line's retirement, the feature-pages line's "round three is on the desk" as round four, and any pointer the runners-up line gains.

**The board's shape.** The board is one folder, `src/app/(dev)/design/sandbox/privacy-hero/`, and nothing else names it: the registry finds it, and retiring it is deleting it. `spec.ts` is `defineExploration` (`src/components/lab/exploration.ts`) and pure data: its id `privacy-hero`, its title, `surface`, `desk: 40` (by leverage, lower first) and `lives` (the paths it redraws), its `opening` and `terms`, and every ask with its context layer (`where`, `when`, `matters` beside `lands`, each option's `gains` and `costs`, `because` in a line). `board.tsx` exports one component, `ExplorationBoard` with a preview per option (`PreviewsFor`). `registry.test.ts` holds all of it; `pnpm lab:smoke` and `pnpm lab:demo` run on the board your change reaches.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The board at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke --base http://localhost:<port>` (it crawls what your change reaches, the board and the desk; `--all` for the whole lab); `pnpm lab:demo --board <board> --base http://localhost:<port>` pressing every step.

## Questions (a recommended answer each; the Orchestrator relays them)

Each recommended answer is BUILT and his to overrule; none is a one-way door. The first two ride on the board as its
carried calls (`photograph`, `as-drawn`), so he meets them where he reads.

- **Which photograph sits under the four veils?** Built: one still under all four, a toast under string lights
  (`wedding-toast`), and the board's knob "Under the veil" puts round three's crowd (`festival-crowd`) under all four.
  Round three's crowd is soft smoke wherever a clearing lands (drawn first on it, the lens opened on grey smoke at both
  top rests), so a variation would lose to the photograph rather than to the original; with the knob on the crowd the
  original is exactly as he picked it. The overrule: the crowd as the default.
- **Does the original stay exactly as drawn?** Built: yes, byte for byte (`veils.test.ts` pins DRIFT to round three's
  numbers; `veils.css` carries its rules untouched). Two findings ride with it, both named on the board: its window
  draws as a **square** (an unsized `radial-gradient(circle, ...)` in a `230px 230px` mask tile reaches the tile's
  corners, so the tile's edge cuts it square with softened corners; round three's words called it a clearing), and it
  drifts **behind the words** (the subhead at 1.73:1 at its worst, 1.0:1 at 375; the table below). The overrule: round
  it and route it clear of the words, which makes it a fifth veil rather than the one he picked.
- **What is the lens's veil made of?** Built: `glass-behind`, the ground the lightbox lays over the album behind an open
  photograph (the utility itself), with Crystal's double edge (`--glass-lip`, `--glass-hairline`) on the pane's rim.
  Crystal's body (`glass`, drawn full-bleed first) turned the still into a saturated orange glow and the clear pane
  into a grey hole in it: a chip's material (saturate 2) read wrong at a hero's size. The overrule: Crystal's body, if
  "the product's own frost" should mean the chip glass.

## System-doc edits (in place, owned facts only)

- none: an exploration ships no production byte; what the round learned lives in the board's own files until a wiring
  lands it.

## Deferred (ROADMAP one-liners, bucket named)

- The lab and the kit: a legibility pass for boards that put words over motion, the one this round ran by hand
  (`_scratch/privacy-hero-r4/cap2.mjs`: every animation under the words seeked through the Web Animations API, the
  words hidden, the 95th-percentile ground under each line box against the line's own colour across the whole loop),
  would let a board prove its words readable on screen rather than by eye; `lab:demo` is its natural home (from
  `privacy-hero-r4`).
- Marketing: if the privacy hero's lens wins, its veil is a full-viewport backdrop filter (`glass-behind`) under a
  moving pane; measure a phone on the alias at its wiring, with a pre-blurred still (drawn once, as the beam's dimmed
  shots are) as the fallback (from `privacy-hero-r4`).

## Handoff (replaces the chat report)

- **Commits, pushed to `lp/privacy-hero-r4`:** `2e2e3fbe` the round (the board's folder whole) · `2ac90bbe` the board's
  legibility line says what was measured · and this manifest. **No sync:** launch-prep moved (menu-depth's dropdown,
  crumbs-19, about-press, demo-framing-r2 and records, now `70a5b2e5`), none of it in this lane's reads or in anything
  the board imports (`git diff --name-only HEAD...origin/launch-prep`), and `git merge-tree` merges clean.
- **Gates on `2ac90bbe`, each on its own exit code** (logs `../partyreel-wt/_scratch/privacy-hero-r4/gate-*.log`):
  `zsh scripts/build-lock.sh pnpm typecheck` 0 · `pnpm lint` 0, no warnings · `zsh scripts/build-lock.sh pnpm test` 0
  (617 files, 7,236 tests) · `zsh scripts/build-lock.sh pnpm build` 0, no warnings · `pnpm lab:smoke --base
  http://localhost:3133` 0 (3 checks; 480 words of the 1,200 budget) · `pnpm lab:demo --board privacy-hero --base
  http://localhost:3133` 0 (1 step, 4 options of 2 frames each, the stage moving by up to 93.07%). Dev server killed by
  port; no capture Chrome left running.
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` = `src/app/(dev)/design/sandbox/privacy-hero/` and
  this file; no exceptions.
- **Items:**
  - One ask, `veil` ("Which veil should sit behind the privacy page's words?"), with the whole context layer (the
    opening's about, four settled lines, three earlier ones; where, when, matters, lands; each option's gains and costs;
    `because` in a line; the terms veil, lightbox, grain; round history 1 to 3) and the two carried calls; recommended:
    **the lens** ("keeps what you liked, a photograph showing only what it chooses, and it chooses: things, never faces
    or the words, in the app's own veil").
  - **drift**, round three's veil byte for byte: the 860px disc (480 at 375), blurred 44px at 55%, a 230px window
    drifting every 9s behind the words.
  - **lens**, one clear 240px pane (124 at 375) in the lightbox's ground, Crystal's edge on its rim, resting 2.4s on
    four things at each width (the window light and the strings of bulbs above the words, the table and the flowers
    below; at 375 the rests sit at the screen's edges so the climbs pass beside the eyebrow), gliding at one speed
    (a 15.8s loop at 1440, 17.7s at 375); the pane and the photograph inside it counter-move on one clock, transforms
    only, written from `veils.ts` (`lensKeyframes`).
  - **beam**, a 380px band of clarity (168 at 375, its middle 42% sharp, faded out under the header and at the foot)
    crossing a darkened photograph (20% brightness, 14px soft, grain at 34%) in 9s, then a 1.4s beat while the next
    of three dissolves in unseen (the knob's still, then the crowd or the toast, then `wedding-golden`; 31.2s whole).
  - **glimpses**, the original's own blurred veil full-bleed, with soft spots (220 to 260px, 132 to 140 at 375) opening
    in place one every 2.4s, each open 4.5s, never more than two at once, alternating across the words.
  - **Nothing a variation settles on sits on the words:** every lens rest and glimpse is held at least 8px clear of the
    lockup's ink box, whole on the canvas and under the header (`veils.test.ts`, which also holds every number the
    options state, the lens's counter-move, the beam's one-photograph-per-crossing and the knob's stills); the frames
    measure the nearest at 10px (lens) and 27px (glimpses) at 1440, 34px and 22px at 375, to the words' own line boxes.
  - **The words' contrast, measured on the frames** (`final-toast.log`, `final-crowd.log`: the minimum over 72 moments
    of each loop, the 95th-percentile ground under each line against its own colour). The variations: every lockup
    line at 7.0:1 or better at both widths on both stills (lens 7.01 to 16.37, beam 7.01 to 15.61, glimpses 7.60 to
    17.78), the header's nav at 5.54:1 or better (the beam, which fades out under the nav: before that fade the nav
    fell to 2.05:1 over the bulbs). The drift, as drawn: subhead 1.73 (1440) and 1.00 (375) on the toast, 1.55 and
    1.59 on the crowd; eyebrow down to 1.01; the headline down to 1.83.
  - Reduced motion: every veil a still (0 animations under `reduce`; `r4-still/*.png`): the drift's window at its first
    waypoint, the lens on its first rest, the beam a fifth of the way across, the first glimpse open.
  - Every caption is read off its frame (`measure.ts` through the kit's `Measured`): the size as drawn, the veil's
    filter as resolved, the loop and rests from the running animations, the nearest settled clearing's distance from
    the words; under reduced motion it says so.
  - The frame's header is pinned as the top of the page draws it (hero-card's scoped rule, `hero.tsx`'s `PIN`), and the
    actions are at `cta` as the privacy page ships them (round three drew `lg` with a hand-sized class).
  - Retired from the folder: `concepts.ts`, `concepts-layer.tsx`, `concepts.css`, `concepts.test.ts` (the sweep, the
    aperture and the sealed cards) and `field.ts`, `field.css`, `field-layer.tsx`, `field.test.ts`: `photoOf` read the
    home hero's twelve by index, and every veil now names its still by id through the media manifest
    (`veil-layers.tsx`'s `Photo`), so nothing is left to move; nothing outside the folder imported them (a repo grep
    for `field-layer`, `FieldLayer`, `photoOf` and `privacy-hero/field` finds only album-stream's own local `photoOf`).
  - Motion cost: the three variations move only transforms and opacity (compositor-eligible); the drift animates
    `mask-position` (a paint), as round three did. Frame pacing on a GPU was not measured: the shared Browser pane was
    hidden, where rAF does not run (the lens's Deferred line).
- **ROADMAP (yours):** retire the line on `privacy-hero`'s `field.ts`, `field.css` and `field-layer.tsx` (done here, as
  above); the feature pages line's "the privacy hero's round three is on the desk" is round four; the runners-up line
  gains its pointer, `git show cdc979a6:"src/app/(dev)/design/sandbox/privacy-hero/concepts-layer.tsx"` (`SweepConcept`
  and `ApertureConcept`; `concepts.ts` and `concepts.css` beside it at the same sha); and the kit's header line
  ("privacy-hero and demo-framing draw the same header") now reads demo-framing alone, privacy-hero pinning its own.
- **Assets requested from Will** (only the winner's):
  - The privacy hero's photograph (if the lens, the glimpses or the drift win) · one wide party still composed for a
    veil, 2880x1860 JPEG, warm and low-key like the toast, its people toward the middle where the words sit and small
    bright things (bulbs, glasses, flowers, sparklers) in the top and bottom thirds and at the sides where a clearing
    settles, and its story holding in the centre third for a 375 crop · replaces `wedding-toast` (the knob's default).
  - The beam's night (if the beam wins) · three stills from one party in its order (the room, a toast, the dance),
    2880x1860 JPEG each, the same grade, each with a vertical strip worth stopping on at any point across · replaces
    the beam's succession (`wedding-toast`, `festival-crowd`, `wedding-golden`).
- **Board ideas:** the lens is the album's own privacy gesture (one photograph's worth of clarity in the lightbox's
  ground), and the door family's wait or a private album's gate could wear it rather than a still card.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none.
- **Calls his to overrule:** one still under all four veils, the toast, the knob for round three's crowd · the original
  byte for byte, its square window and its path behind the words included · the lens in the lightbox's ground, not
  Crystal's body · "the beam" for the brief's "band" (at a party, the band is the musicians) · the sweep's, the
  aperture's and the sealed cards' code off the board (the pointer above) · the recommendation, the lens.
- **Look at first:** the step, `/design/lab/privacy-hero?session=privacy-hero.veil`: the lens at 375 (it settles at the
  screen's edges), then the knob on round three's crowd with the drift beside the other three.
