---
track: demo-framing-r5
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "518956ad"            # the launch-prep SHA the branch was cut from
board: demo-framing
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/demo-framing/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/demo-framing.json
  - src/components/marketing/sections/home/cinema-hero.tsx
  - docs/ASSETS.md
---

# lp/demo-framing-r5

**Goal.** demo-framing round 5: the home's first screen, its stage drawn as a more polished set from r4's five, every settled line kept.

## The brief

**The round's direction (Will, round 13, carried by every lane):** never dev-tool-ish (the viewfinder's corners survive only as a focus mark, never a style, and so does nothing of their loading state); a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline (undated, morning-only and multi-day events all read well); "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control); cost is designed like the architecture (every image and video action multiplies at scale). Production is the working version: a pick is the best of what was drawn, never a rule.

**Will's answer (demo-framing r4, his desk on build 45, 2026-10-03):** stage=? "I'm jokingly mad at you for making this decision so hard. Let's run another round on these so we can pick from an even more polished group of options. I truly cannot wait to see them." r4 drew five: `plate` (one glass pane: the code and its link), `card` (a mini event card over a minimal link; recommended), `field` (the link as a field the visitor types), `wall` (two photo rows filling round the code) and `door` (every link a door to its party).

**Settled, kept in every option:**
- the demo's address is partyreel.com/e/our-party, and every address the hero types is reserved to the demo;
- an arrow after the address, and under a pointer the object lifts and the arrow nudges;
- no eyebrow over the headline;
- the typing and the stream take turns;
- every photograph carries its guest's credit inside its corner;
- the address a size down from round two's;
- the demo's door stays as today.

His round-4 words that still steer it:
- "The link and QR don't feel like a beautiful, cohesive item for the photos to stream from."
- "A far more well designed mini-event card that updates off the slug typing would feel much more beautiful."
- He liked "the lightspeed tunnel the stream out version creates" and not "the streaming into the QR".

**The ask (`stage`):** a more polished group of three or four.
- Each of r4's strongest directions taken further, its weakest parts fixed, and at most one new idea if it earns its place.
- Each drawn live at 1440, a tablet (768 to 1023) and 375, with reduced motion honoured.
- Recommend one, and say what each gives up.
- Its photographs are still asked (ASSETS 39 to 41): draw with the stand-ins and name what a real photograph changes.

**The board's shape.** The board is one folder, `src/app/(dev)/design/sandbox/demo-framing/`, and nothing else names it: the registry finds it, and retiring it is deleting it. `spec.ts` is `defineExploration` (`src/components/lab/exploration.ts`) and pure data: its id `demo-framing`, its title, `surface`, `desk: 90` (by leverage, lower first) and `lives` (the paths it redraws), its `opening` and `terms`, and every ask with its context layer (`where`, `when`, `matters` beside `lands`, each option's `gains` and `costs`, `because` in a line). `board.tsx` exports one component, `ExplorationBoard` with a preview per option (`PreviewsFor`). `registry.test.ts` holds all of it; `pnpm lab:smoke` and `pnpm lab:demo` run on the board your change reaches.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate (CLAUDE.md's four steps, each on its own exit code); `pnpm lab:smoke --base http://localhost:3136`; `pnpm lab:demo --board demo-framing --base http://localhost:3136` at 1440 and with `--width 375`, pressing every step; `registry.test.ts` and `queue.test.ts`.

## Questions (a recommended answer each; the Orchestrator relays them)

- **Which hero?** Recommended and marked: `card`. An address reads as an event in the card the host will get (its
  photograph, its name in the host's own words, its faces), the album leaving it at lightspeed. Overrule: the pane if
  the hero should show the scan itself, the door if it should show the guest's way in.
- **How many heroes?** Built: three, round four's strongest taken further; the field (it read as a browser's address
  bar, and a press typed rather than opened the demo) and the wall (it gave up the lightspeed tunnel he named) retired,
  and no new idea drawn, since none earned a place beside these. Overrule: bring either back taken further.
- **What the card says under its name.** Built: its first three faces, the rest of its guests counted in and its
  photographs (`+83 · 412 photos`), never a date (round thirteen: nothing depends on a timeline). Overrule: its day as
  a host prints it (carried `card-line`).
- **What a code does while the next address types.** Built: it stands whole, the party standing, and is rewritten in a
  ripple from its heart as the address lands (carried `whole`); round four folded it empty. Overrule: round four's fold.
- **The door's resting angle in the hero.** Built: ajar at 42 degrees (production's doorway rests at 15, a guest's
  door waiting on its host) so the arriving party's light, never the dark leaf, is what shows while an address types;
  84 under a pointer. A board override of the doorway's own variable, nothing in production.

## System-doc edits (in place, owned facts only)

- none (the round is lab only; `marketing-content.md`'s hero lines change with the wiring)

## Deferred (ROADMAP one-liners, bucket named)

- none (round four's two lines, the wiring's two lamps and next-party loading and `CodeMat`, still stand as filed)

## Handoff (replaces the chat report)

- Sync: a fast-forward to `8c2dce39` (identity-wiring's record) at the Orchestrator's word, before any work. Work
  commits `66af013a` (round five drawn: the three heroes taken further, the field and the wall retired), `6fe02293`
  (the card a size down at a desk, its faces then the rest counted in; the door ajar wide; the pane's light), `dd162a87`
  (each close caption says what its object does under the pointer; the lamp's call), `3b269655` (the close caption's
  matrix typed off the frame's window), all pushed. launch-prep moved since (take-home-wiring, wait-wiring and
  records), touching none of this lane's reads or folder (`git diff --name-only 8c2dce39 origin/launch-prep`), so no
  second sync; the head is this manifest's commit.
- Gates on `3b269655`, each on its own exit code (logs `_scratch/demo-framing-r5/g-*.log`): `pnpm typecheck` 0;
  `pnpm lint` 0; `pnpm test` 0 (825 files, 9,730 tests); `zsh scripts/build-lock.sh pnpm build` 0;
  `pnpm lab:smoke --base http://localhost:3136` 0 (18 checks, 0 failing; the board reads 953 words of 1,200);
  `pnpm lab:demo --board demo-framing --base http://localhost:3136` 0 (1 step, 3 options of 4 frames each, the stage
  moving up to 50.87 percent; 1440 starts 0.26 down, 21 px to the dock; 375 starts 0.32 down, 18 px) and with
  `--width 375` 0 (51.55 percent). The board's own tests (`registry.test.ts`, `queue.test.ts`, `qr.test.ts`,
  `typing.test.ts`) inside the suite.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = 13 paths under
  `src/app/(dev)/design/sandbox/demo-framing/` (`tiles.tsx` deleted with the wall) and this file; no exceptions.
- `stage`, one decision, round four's three strongest heroes each taken further, live at 1440, a tablet held upright
  (820 by 1180) and 375, the loop's score under the laptop and the object close at rest and under the pointer. Round
  four's weakest parts were each a picture of something loading (the card's cover blurred out of focus while an
  address typed, the pane's tile gone dark to an empty code, the door shut to a dark slab); nothing stands empty or
  soft now (`objects.tsx`'s header):
  - `card` (recommended): the product's own event card at a hero's size, portrait (232 by 290 at a desk, 192 by 240
    at a phone): the party's photograph fills it, its name in the loud face on the photograph's own dark foot (the
    dashboard card's grammar), its faces then `+83 · 412 photos`, its code on a white mat in the corner; the link
    minimal under it. While the next address types the card holds the arriving party's light (its hues pooled where
    the photograph will stand) with its name typing on it in white; as it lands the photograph develops in (bright and
    pale to itself), its faces and code arrive, the album leaving at lightspeed. Under a pointer it lifts and its
    photograph leans in 3.5 percent.
  - `plate`: the code over its link in one pane of the product's glass (`.glass`), lit from inside by the party's
    photograph far out of focus, so the pane is the colour of the party standing and never a dark box; the address one
    line under the code with its arrow after it. The code stays whole while the next address types and is rewritten
    as it lands, only the dots that differ turning in a ripple from its heart as the heart's picture beats; the glass
    relights and one sheen crosses it.
  - `door`: production's doorway at a hero's size, open on its party's cover with the link lit on its threshold; ajar
    (42 degrees) in the arriving party's light while its address types, swinging open as it lands; 84 degrees under a
    pointer.
- Measured off the frames (the captions; `_scratch/demo-framing-r5/captions.mjs`): the pane's code is a scan at every
  screen (4.8 px a module at 1440, 4.3 on the tablet, 3.8 at 375; Chrome's `BarcodeDetector` reads
  `partyreel.com/e/our-party` off each), the card's a picture to tap (1.2, 1.1, 1.0), the door none; the address
  21, 18 and 15 px, the object's foot 64 to 65 px over the headline at 1440, 52 to 53 on the tablet, 40 to 41 at 375;
  18 of 18 photographs credited in every frame; reduced motion stands each whole on the demo's own address
  (`shots/rm-*`). One turn of each at 1440 is captured by the typed text (`turn.mjs`, `shots/t5-*`, `t5b-*`).
- Tests: `typing.test.ts` holds `comingAt` (the object wears the arriving party's light from the beat on the bare
  domain, the standing one's until then); the wall's wave and the field's slug helpers retired with their tests.
- What a real photograph changes (ASSETS 39 to 41, standing): the card most (its name stands on the cover's own
  foot, so the cover's subject must sit high and its foot run dark), then the pane (its glass is lit by the cover's
  colour) and the door (the cover is what shows through it).
- Assets requested from Will:
  - The hero's party covers, row 40 respecified for the card's portrait · six (the demo's own and the five), 4:5 at
    960x1200, the stream's grade; the subject in the top 60 percent, the foot dark enough for a white name in the
    loud face (the card draws 232x290 at a desk and 192x240 at a phone), still legible far out of focus as the pane's
    light and small at the code's heart (about 33 px round on the pane) · replaces each party's `cover` in
    `sandbox/demo-framing/fixtures.ts` (row 40's 960x720 landscape spec, which served round four's inset cover)
- Board ideas:
  - The create wizard's naming step: the card being written (its name typing on the party's own light, its photograph
    developing in once one is chosen) is the moment the wizard draws, one card from create to the home.
  - `/features/qr`'s hero (round four's line, standing): the pane, a code rewritten in a ripple from its heart per
    address and never emptied, is that page's own argument.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Calls his to overrule:
  - The card recommended over the pane and the door.
  - Three heroes: the field and the wall retired, no new idea drawn.
  - The card's line: faces, the rest counted in and its photographs, never a date.
  - A code stays whole while the next address types and is rewritten in a ripple from its heart as it lands.
  - The card and the door wear the arriving party's light (and the lamp turns with them) while its name types; the
    pane keeps the standing party's until the landing.
  - The door rests ajar at 42 degrees in the hero and opens to 84 under a pointer.
  - Standing from round four: each address its own real code, reserved to the demo; a picture at its heart; the card
    names the demo's own "Our party"; a credit is a face and a first name.
- Look at first: the step opens on the card at 1440; watch one turn (the name erasing, the arriving party's light with
  its name typing on it, then the photograph developing in as the album leaves at lightspeed); then the pane's landing
  (the code's ripple from its heart, the glass relit); then the door ajar in the next party's light and swinging open;
  each close frame under the pointer.
