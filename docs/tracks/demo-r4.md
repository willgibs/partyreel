---
track: demo-r4
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "7a875407"            # the launch-prep SHA the branch was cut from
board: demo-framing
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/demo-framing/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/demo-framing.json
  - src/components/marketing/sections/home/
  - src/lib/demo.ts
  - src/lib/constants/reserved-slugs.ts
  - scripts/seed-demo-event.mjs
  - docs/systems/marketing-content.md
  - src/components/guest/door/welcome.tsx
---

# lp/demo-r4

**Goal.** The home hero's stage, round four: the two directions he saw potential in, each nailed (one premium centre object the stream leaves, and a well-designed mini-event card over a minimal link, streaming out), beside two or three brand-new heroes.

## The brief

**Why.** Will answered `demo-framing` r3 on 2026-10-02 (`docs/reviews/demo-framing.json`): `stage` open, `door=brand`. His notes, verbatim:
- on `stage`: "None of these are perfect, but I think two directions have potential. First, for options 1 and 2, the link and QR don't feel like a beautiful, cohesive item for the photos to stream from. The code rising out doesn't feel very premium, and the code opening on its invite leaves a very bland big card in the center when fully open, doesn't feel polished at all. If we could nail this switching center item, both of these directions could lead to something nice. Second, for option 3, I do like keeping the link more minimal under a more prominent QR that adjusts. However, the QR itself looks pretty bad, and a far more well designed mini-event card that updates off the slug typing would feel much more beautiful. I also don't like the streaming *into* the QR; I get the concept of they get uploaded to it, but the animations feels unnatural compared to the more common 'lightspeed tunnel' the stream out version creates. However, if you have any brand new home hero ideas, I'd also love to see those so we aren't knocking our head against a wall on one idea in a world of infinite."
- on `door=brand`: "With the new door screen being built from this desk's review batch, I'd like to see how the demo feels going through the regular experience first. Then we can open up another exploration to customize the demo door if needed."

**The ask, `stage`:** (a) the centre object nailed: one premium thing (the link and its code as one cohesive object) that switches per typed address, the stream leaving it as a lightspeed tunnel: never a bland card when open, never a code rising cheaply; (b) the link minimal under a well-designed mini-event card that updates with each typed slug, the photographs streaming out; (c) two or three brand-new heroes of your own. Each whole, live at 1440 and 375 and at a tablet (768 to 1023, never drawn yet), reduced motion standing it still; say for each whether a phone's code stays a picture (it draws at 2.6 px a module today, under the 3 px a phone reads off a screen; a phone visitor taps).

**Settled, drawn in every option:** the address `our-party`; the arrow after it and its hover (the object lifts, the arrow nudges); no eyebrow; the typing and the stream taking turns; a credit (face and first name) inside each photograph's corner; the address a size down from round two's stage; the demo's door as today (`door=brand`). The demo's data (`our-party`, the typed addresses reserved) is wired with the hero's pick, so leave `src/lib/demo.ts`, the reserved slugs and the seed as they are.

**The direction, one for every board and wiring this round** (Will's notes, 2026-10-02):
- **Bespoke and experiential**, sleek and modern (never vintage), sophisticated (never playful-messy: "for grids, I'd prefer not to get messy and begin tilting anything"), minimal yet high-information with far less text, and the bible's ten (`/design/library`: media is the color, premium is the floor).
- **Who it is for**, his words with this desk: "Want to ensure we feel bespoke without getting too dev-tool-ish, remaining a modern consumer app usable for anyone at any event (it's okay if grandma and grandad slip through, would rather frame this as cool to a younger expected host/guest crowd, probably 18 [parties] to 50ish [event guests, conference attendees). Don't want to build a boring app just for the least tech-friendly guests. Seems like our core entry -> upload -> view path is pretty clear for anyone."
- **His role**: "I'm just the tastemaker at this point - let's act accordingly, drive your best ideas across our site/app/platform as the world's leading design engineer." Build and draw your boldest real answer; he picks and steers.

**The board's shape.** The board is one folder, `src/app/(dev)/design/sandbox/demo-framing/`, and nothing else names it: the registry finds it, and retiring it is deleting it. `spec.ts` is `defineExploration` (`src/components/lab/exploration.ts`) and pure data: its id `demo-framing`, its title, `surface`, `desk: 90` (by leverage, lower first) and `lives` (the paths it redraws), its `opening` and `terms`, and every ask with its context layer (`where`, `when`, `matters` beside `lands`, each option's `gains` and `costs`, `because` in a line). `board.tsx` exports one component, `ExplorationBoard` with a preview per option (`PreviewsFor`). `registry.test.ts` holds all of it; `pnpm lab:smoke` and `pnpm lab:demo` run on the board your change reaches.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The board at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke --base http://localhost:<port>` (it crawls what your change reaches, the board and the desk; `--all` for the whole lab); `pnpm lab:demo --board <board> --base http://localhost:<port>` pressing every step.

## Questions (a recommended answer each; the Orchestrator relays them)

- **Which hero?** Recommended and marked: `card`. An address reads as an event (its cover, its name in the host's
  own words, its first faces and its code) and the album leaves it at lightspeed; it is his own second direction,
  nailed. Overrule: the pane if the hero should show the scan itself, the wall for the album over its link, the field
  for the visitor's own first step.
- **What the card calls the demo's own address.** The card reads its party's name off the address as it is typed
  (our-wedding is "Our wedding", so our-party is "Our party"), while the demo's door says Partyreel Demo
  (`door=brand`). Built: the address read as words, every address alike (carried `card-name`). Overrule: the
  event's own name, set once its address lands.
- **A picture at the code's heart.** Every code carries its party's picture at its heart, the in-app designer's
  `dots` preset round it at error correction Q; the designer prints no picture today. Built: drawn (it is what makes
  the code the party's, and Chrome's own reader reads every one with it in place); the share studio would print it so
  (carried `heart`). Overrule: the dots alone.
- **The lamp's colour.** Built: the standing party's hues, crossfading per address (carried `lamp`). Overrule: the
  house lamp for every address, as the shipped card has it.
- **What a code encodes off a preview.** Built: the link exactly as the hero prints it, `https://partyreel.com/e/<slug>`,
  whatever origin serves the page, so a code is always the address beside it (round three encoded `SITE_URL`).
- **The field's longest address.** A visitor may type 22 characters into the field: every code is one grid
  (version 4 at Q, so a new address blooms in the old one's place), which holds the link to that length. The product
  takes 50 and applies its rule once the field carries their link into the real flow. Built: the cap, silently.

## System-doc edits (in place, owned facts only)

- none (the round is lab only; `marketing-content.md`'s hero lines change with the wiring)

## Deferred (ROADMAP one-liners, bucket named)

- Marketing: the picked hero's wiring keeps two lamps (the standing party's and the last, crossfading) where the board
  draws one per party for its own ease, and loads only the next party's cover and photographs ahead of its landing
  (from `demo-r4`).
- Marketing: the hero's code on its white mat is header-wiring's `CodeMat`; the board's pane tile and wall block draw
  the mat by hand, the atom having landed after this lane's base (from `demo-r4`).

## Handoff (replaces the chat report)

- Work commits `d9bc06a9` (round four drawn), `a9564ce9` (the card recommended, the wall live, the pane's tile
  concentric, the options' words), `5b73c2fd` (a caption's scan floor read from `module-floor.ts`), `3150646f` (the
  wall's caption counts its tiles), `a234b15e` (each hero balanced on a tablet), all pushed. launch-prep moved
  (header-wiring merged at `e771e80b`, records and pickups) but nothing in this lane's reads or folder
  (`git diff --name-only 26596e48 origin/launch-prep` holds none of them), so no sync; the head is this manifest's
  commit.
- Gates on `a234b15e`, each on its own exit code (logs `_scratch/demo-r4/g3-*.log`): `pnpm typecheck` 0; `pnpm lint` 0;
  `pnpm test` 0 (748 files, 8,905 tests); `zsh scripts/build-lock.sh pnpm build` 0;
  `pnpm lab:smoke --base http://localhost:3136` 0 (3 checks, 0 failing; the board reads 871 words of 1,200);
  `pnpm lab:demo --board demo-framing --base http://localhost:3136` 0 (1 step, 5 options of 4 frames each, the stage
  moving up to 57.40 percent between options; at 1440 it starts 0.26 down and ends 21 px over the dock, at 375 0.32
  and 18 px).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = 17 paths, all under
  `src/app/(dev)/design/sandbox/demo-framing/` (round three's `album.tsx` and `door.tsx` deleted with the answered door
  ask; `demo-framing.css`, `qr.ts`, `qr.test.ts` and `tiles.tsx` new), and this file; no exceptions.
- `stage`, one decision and five heroes, each the home's real first screen live at 1440, on a tablet held upright
  (820 by 1180, the first tablet any round drew) and at 375, its loop's score under the laptop and its object close
  at a desk, at rest and under the pointer; reduced motion stands each still and whole (the demo's own address and
  code, every photograph credited). The door ask is answered (`brand`) and no longer drawn; `lives` drops
  `welcome.tsx` and takes `qr-presets.ts`.
  - `plate` (his first direction): the code over its link in one pane of the product's glass (`.glass`), the code on
    its white tile (the dots preset, round eyes, the party's picture at its heart), the address in two lines with the
    arrow in its own well; the band runs through the address, born behind the glass. As an address is erased the
    code folds into its heart and the tile goes dark to glass; as the next lands the tile lights, the code blooms out
    of the new party's picture ring by ring, a sheen crosses the pane and the album leaves at lightspeed. One
    silhouette for every address: never a card that opens, never a code that rises.
  - `card` (his second direction, recommended): a mini event card (the party's cover inset like a print, its name in
    the loud face, its day and guest count, its first faces, its code in the corner) over the link set minimal in
    white. While an address types, the card's name types with it and the rest goes out of focus; as it lands the new
    party's cover sharpens in, its lines arrive, and the album leaves at lightspeed.
  - `field` (new): the link as a field on paper that types the demo's addresses until a visitor presses it; then it
    is a real input (the product's `Input`, keys through the product's `slugify`), their pause (650 ms) or Enter is
    their landing (their code blooms, the album leaves), and the arrow's well grows into Start, carrying their link to
    sign-up (`/login?link=`); a pointer finds "Press to type your own party" under it. Pressable in the 1440 frame.
  - `wall` (new): two level rows of the party's photographs, full bleed and dissolving at the edges as the band does,
    its code four tiles big at their heart and the link under them; as an address lands the wall fills outward from
    the code, and while it stands a guest's next photograph lands in one tile at a time (touching tiles never the
    same still). The calm one: no lightspeed.
  - `door` (new): production's doorway (`Doorway`) at a hero's size as the object, its room in the party's light,
    its album through the open leaf, the link on its threshold; it swings shut while an address types (a line of
    light under it) and opens on the next party as it lands, the album leaving past it.
- Every stream drifts at 10 percent while an address types, then leaves the landing at lightspeed: 6 times its pace
  in 180 ms, settling over 1.8 s (`typing.ts` `warpAt`, `typing.test.ts`), never folding the album back in (round
  three's `open` did, before each address); the lamp behind each object crossfades to its party's hues.
- A phone's code, read off each frame against `module-floor.ts`'s 3 px screen floor (the captions, `g3-demo.log`):
  `plate` 4.0 px a module at 375 (a scan; 4.5 at the tablet, 5.1 at 1440), `wall` 3.9 (a scan; 5.5, 7.1), `card` 0.8
  and `field` 1.0 (pictures to tap; a desk scans in the demo's modal), `door` none. Every drawn code is read back by
  Chrome's own `BarcodeDetector` in its caption: it reads `partyreel.com/e/our-party` off the plate and the wall at
  every screen.
- Clearances over a whole loop (`_scratch/demo-r4/clearance.log`, `clear.js`): the card's white link stays 163 px
  clear of every photograph at 1440, 136 at the tablet and 95 at 375, and 64, 52 and 40 px over the headline; the
  door's 79, 59 and 25. On the tablet each hero's axis is solved for its own object (production's 38 percent was the
  shipped card's): the air over the object and under the block within 5 px of each other on all five.
- Tests: `qr.test.ts` (every value the board can draw fits the one grid, each address its own code, no dot in an eye
  or the heart, the heart about a twentieth of the code, the card's name and the field's slug), `typing.test.ts`
  (the warp and the wall's wave).
- Assets requested from Will:
  - The hero's five typed parties' photographs · nine each (a wedding, a 30th, a lake weekend, a family reunion, a team
    party), the stream's own generated set and grade (rows 2 and 12: 512 squares and 720x900 portraits, legible at
    110 px) · replaces each host's `pours` in `sandbox/demo-framing/fixtures.ts` (round three's line, standing)
  - Each party's cover · six (the demo's own and the five), 960x720, the stream's grade, its subject legible at the
    card's 218x160 and at the code's heart (about 35 px round at a desk) · replaces each party's `cover` in `fixtures.ts`
  - Twenty guest portraits · square, 256x256, one grade, a face centred and legible at 14 px (a credit) and 26 (the
    card's faces) · replaces the seeded initials on every credit and face (round three's line, standing)
- Board ideas:
  - The share studio (the in-app QR designer, `qr-presets.ts`): the party's picture at the code's heart as a preset;
    every code on this board scans with it in place at Q.
  - `/features/qr`'s hero (ROADMAP's line from `demo-framing-r2`): the pane, a code that switches on per address, is
    that page's own argument, one link and its code yours to name.
  - ROADMAP's demo-framing lines on its quoted welcome sheet and its own `stopLinks` are spent: round three removed
    both, and this round draws no door.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Calls his to overrule:
  - The card recommended over the pane, the field, the wall and the door.
  - Each address's code is its own real code, every typed address reserved to the demo at the wiring.
  - A code carries its party's picture at its heart.
  - The card names the demo's own address "Our party", while its door says Partyreel Demo.
  - The lamp takes each party's hues.
  - Every stream leaves each landing at lightspeed, and never folds the album back in.
  - The field takes a visitor's address to 22 characters.
  - A credit is a face and a first name, nothing else (standing).
- Look at first: the step opens on the card at 1440; watch one turn (an address erased and typed with the card's name
  while its event goes out of focus, then the new cover sharpening in as the album leaves at lightspeed); then the
  pane through one turn (its tile dark to glass, then lit as the code blooms out of the new party's picture); then
  press the field in its 1440 frame and type a party of your own.
