---
track: demo-r3
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "243e7cd0"            # the launch-prep SHA the branch was cut from
board: demo-framing
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/demo-framing/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/demo-framing.json
  - src/components/marketing/sections/home/
  - src/lib/demo.ts
  - src/components/marketing/sections/features/qr/
  - docs/systems/marketing-content.md
---

# lp/demo-r3

**Goal.** Round 3 of the home hero: Will's stage hybrid (turns and centre: the link smaller, a QR bouncing in above it at each address, the stream emanating from the QR and link as one group, credits inside each card) in two or three takes, and the demo's door identity.

## The brief

**Why.** Will answered r2 on 2026-10-02:
- **Settled:** `slug=our-party`, and `touch=arrow` with his note "There should be a slight hover state so a user feels it is clickable when their cursor reaches the item." Draw the arrow and its hover as settled.
- **On `slug`:** "the demo's welcome door specifically should likely avoid this event title, can keep slug but maybe clearer name like 'Partyreel Demo' or 'Example Party' or just a custom demo door in general. I know we want to simulate the guest experience on scan, but it also seems there'd be friction if the demo is unclear overall and they land on a generic 'Our party' name."
- **On `stage`** (answered `centre`, meaning both 2 and 4), verbatim: "This is going to be a dual selection of both options 2 and 4. I absolutely love the typing and streaming taking turns so each work off of the other (new slug, new event stream, repeat). However, the address taking the stage cleans up that visual design of the item a lot, making the full screen present more polished overall, but I hate losing the stream and QR visuals. Other page heroes could definitely take some leftovers or extra ideas from our work here. But for this home hero, I was curious if we could knock the partyreel link typing font size down a little so it doesn't fight with the H1, then maybe bounce in a new QR above the input each time it's updated, and stream images off of that QR + link with the turn taking each time it updates. I'd like the QR to be vertically centered so it doesn't shift the visual balance/weight to either side, but if the QR + input could stack/overlap/somehow present as one group for the stream to emanate from, I think that would help with clarity. \"Oh, I make this event with a link/custom slug/QR, and all of our photos go in to make an album\". If the emanating photos each had a guest credit in their corner (likely within card, not on corner so it doesn't go off image). Please take this idea with a grain of salt and build your best version of the overall idea."

**Asks:**
- `stage`: his hybrid in two or three takes, your best versions.
- `door`: the demo's door identity: "Partyreel Demo", "Example Party", or a custom demo door.

His "other page heroes could take leftovers" goes in your Board ideas.

**The direction, one for every board this round** (Will's notes, 2026-10-02):
- **Bespoke and experiential,** with the disposable-mode boards' creativity as the bar. On those boards: "These are so much cooler than the current host dashboard, standard event pages for both host and guest, and other areas of our app. Really creates a bespoke, experiential feeling. Going off my previous notes about wanting to redesign most of our app and especially breaking away from the shadcn generic AI build feel, this is the kind of creativity I like to see."
- **Sleek and modern,** never vintage ("our far more modern app design, which is only getting sleeker as we iterate").
- **Sophisticated, never playful-messy:** "for grids, I'd prefer not to get messy and begin tilting anything, the slight rotation may make us feel too playful for more sophisticated events".
- **Minimal yet high-information,** with far less text ("Many parts could be reshaped into more minimal yet high-info-conveyance UI, very text heavy right now").
- **The bible's ten** (`/design/library`): media is the color, premium is the floor, elegant simplicity.
- **His role:** "I'm just the tastemaker at this point - let's act accordingly, drive your best ideas across our site/app/platform as the world's leading design engineer." Draw your boldest real contenders, as far apart as the real answers are.

**Who asks what tonight, so no two boards ask one decision:**
- `identity` owns the atoms: buttons, fields, chips, cards, sheets, menus, toasts, tooltips, avatars, and the controls' materials, type and motion.
- `host-dashboard` owns the dashboard page.
- `event-header` owns the hub's head and the guest album's head.
- `create-wizard` owns the create wizard.
- `locked-door` r3 owns the door's reveal and idle loops.
- `disposable-mode` r3 owns the disposable camera, its waiting room and its save.
- `demo-framing` r3 owns the home hero's stage and the demo's door.

A page board draws composition, layout, hierarchy and its page's own expression in production's atoms. It names any new atom an option needs, and spends no option on a button's style.

**The board's shape.** The board is one folder, `src/app/(dev)/design/sandbox/demo-framing/`, and nothing else names it: the registry finds it, and retiring it is deleting it. `spec.ts` is `defineExploration` (`src/components/lab/exploration.ts`) and pure data: its id `demo-framing`, its title, `surface`, `desk: 90` (by leverage, lower first) and `lives` (the paths it redraws), its `opening` and `terms`, and every ask with its context layer (`where`, `when`, `matters` beside `lands`, each option's `gains` and `costs`, `because` in a line). `board.tsx` exports one component, `ExplorationBoard` with a preview per option (`PreviewsFor`). `registry.test.ts` holds all of it; `pnpm lab:smoke` and `pnpm lab:demo` run on the board your change reaches.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The board at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke --base http://localhost:<port>` (it crawls what your change reaches, the board and the desk; `--all` for the whole lab); `pnpm lab:demo --board <board> --base http://localhost:<port>` pressing every step.

## Questions (a recommended answer each; the Orchestrator relays them)

- `stage` (the board's first ask): which take of his hybrid runs the home's first screen? Recommended `open`, the link
  opening into its invite: one object that breathes with the turns, each address opening its own code and bursting its
  own album, the typing always alone on the stage. All three takes are drawn; the recommendation is marked on the board.
- `door` (the board's second ask): what the demo's door says a visitor has walked into? Recommended `own`, a door of
  its own ("A live demo · Your guests start here", the link they came by, Step in), the album behind it keeping its
  party's name. `brand` is marked as today: Partyreel Demo is the demo event's name now (`seed-demo-event.mjs`'s
  default), in today's demo words (`RoleWords`).
- The lane's own calls, each built as taken and carried on the board as a row he can overrule: `codes` (each address
  its own real code, encoding `https://partyreel.com/e/<slug>`, every typed address reserved to the demo and routed to
  it at the wiring; until then nothing live prints them), `credit-words` (a face and a first name, nothing else),
  `pours` (each address pours its own party's photographs, credited to its own guests), `typed` (round two's five,
  standing), `album-name` (behind a door of its own, the album keeps Our party).

## System-doc edits (in place, owned facts only)

- none: the round is lab only and ships no production byte.

## Deferred (ROADMAP one-liners, bucket named)

- Now, Marketing: the home hero's round-three object at a tablet (768 to 1023) is composed between the phone's and
  the desk's drawings and was never drawn; the wiring measures it at 768, 900 and 1023 (from `demo-r3`).
- Now, Marketing: a phone's hero code draws at 2.6 px a module, under the 3 px a phone reads off a screen; a phone
  visitor taps rather than scans, so the wiring decides whether a phone's code stays a picture (from `demo-r3`).

## Handoff (replaces the chat report)

- Work commits `bd296f6b` (round three drawn), `fb4922e0` (the credit's fade, the code's claim), `40e5c493` (the door
  in production's doorway), `3ebe5b74` (the board's own link stopper dropped); sync `bc75b5e9` (origin/launch-prep at
  `a799127c`: door-wiring's doorway, which the door ask now draws in, marketing-content.md a read, and the
  create-wizard and host-dashboard boards); since then launch-prep moved only by the record commit `7ee54758`. All
  pushed; the head is this manifest's commit.
- Gates on `3ebe5b74`, the synced tree, each on its own exit code (logs in `_scratch/demo-r3/gate3-*.log`):
  `pnpm typecheck` 0; `pnpm lint` 0; `pnpm test` 0 (746 files, 8,853 tests); `pnpm build` 0 (through the lock);
  `pnpm lab:smoke --base http://localhost:3133` 0 (4 checks, 0 failing; the board reads 863 words of 1,200);
  `pnpm lab:demo --board demo-framing --base http://localhost:3133` 0 (2 steps, 0 failing: the stage moves up to 49.67
  percent between takes, the door 14.39; every frame above the dock at 1440 and 375). The whole lab,
  `pnpm lab:smoke --all`, 0 on `40e5c493` (174 checks, 0 failing, `gate2-smoke-all.log`); the head after it only
  removes the board's own link stopper.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = 15 paths under
  `src/app/(dev)/design/sandbox/demo-framing/` (round two's `card.tsx` and `plate.tsx` deleted; `code.tsx`,
  `objects.tsx` and `door.tsx` new) and this file; no exceptions.
- `stage`, his hybrid in three takes, each the home's real first screen live at 1440 and 375 with its loop's score
  under the laptop and its object close at a desk, at rest and under the pointer (`board.tsx`, `hero.tsx`,
  `objects.tsx`, `typing.ts`):
  - `rise`: the code stands up out of a slimmer address bar, one paper with concave fillets at the joint; it sinks
    into the bar as an address is erased and a new one rises on a spring as the next lands; the stream drifts at 10
    percent while it types (round two's turns), and each photograph born after a landing is the new party's.
  - `open` (recommended): one white object, a pill while the address types and an invite with its code at its head
    once it lands; the album folds back into the link before each address goes (`foldAt`, 0.76 s) and bursts out of
    it as the next lands (the page's own branch-out): new slug, new event stream, repeat.
  - `words`: the code alone on paper, its address in white type under it, the photographs coming in from both edges
    and slipping behind the code ("collects", the subhead's own word), easing while an address types.
- Settled and drawn in every take: the address at 21 px at a desk (round two's stage set 32; the headline is 100 at
  1440) and 15 at a phone, centred on a line as wide as the widest address so the object never changes shape under a
  key; the arrow after it and its hover (the object rises 6 px at a desk, its shadow deepens, the arrow nudges toward
  where it goes); the eyebrow gone; each address its own real code (version 3, 29 modules, 3.5 px a module at a
  desk); a credit inside every photograph's corner (a face and a first name on the glass's tint and edges, without
  its blur: eighteen moving backdrop filters would spend a phone's frame), fading in once the photograph passes about
  a third of its size so the link is never ringed by specks. All read off the frames' captions.
- Measured over a whole loop (622 samples a screen, `_scratch/demo-r3/clear.js`): the white words under the code
  stay clear of every photograph, the closest 15 px at 375 and 41 at 1440, and stand 40 px and 64 px over the
  headline; the paper takes stand 90 px (375) and 138 px (1440) over it.
- `door`, three identities drawn in production's doorway as door-wiring landed it (`Doorway`, `DoorColumn`,
  `DoorWords`, `RoleWords`) at 375, each with the album's head behind it: `brand` (Partyreel Demo, as today), `example`
  (Example Party), `own` (recommended); the host is the persona Sam Okafor in all three (round one's carried `host`;
  Will's own account hosts the demo today). The quoted welcome sheet and the quoted doorway are gone, which answers
  ROADMAP's line on boards quoting a Radix layer for demo-framing; lab-sitting's line on the board's own `stopLinks`
  is done (`3ebe5b74`).
- Assets requested from Will:
  - The hero's five typed parties' photographs · nine each (a wedding, a 30th, a lake weekend, a family reunion, a
    team party), from the stream's own generated set and grade (rows 2 and 12: 512 squares and 720x900 portraits,
    legible at 110 px), each unmistakably its kind · replaces each host's `pours` in
    `sandbox/demo-framing/fixtures.ts`, then the stream's per-address sets at the wiring
  - Twenty guest portraits for the credits · square, 256x256, one grade, a face centred and legible at 14 px (a
    phone's credit) and 22 (a desk's) · replaces the seeded initials on every credit; supersedes row 34's four
  - Row 33 (the hero card's four prints) withdrawn once any take is picked: no take carries prints
- Board ideas:
  - `/features/qr`'s hero: the code that re-forms as its address is typed (any take's object) is the QR page's own
    argument, one link and one code yours to name; ROADMAP's line on that hero taking the demo card can take this
    object instead (his "other page heroes could definitely take some leftovers").
  - The demo modal at a desk could show the very object the visitor pressed (the picked take's code over its
    address) in place of its own code card, so the press opens what they clicked.
  - `/features/guests` or the album page's arrivals hero: the credit (a face and a first name inside the
    photograph's corner) as the proof that every photograph knows its guest.
  - The create wizard's address step: the code growing out of the link as the host types it (`open`'s object), the
    atom its own board would name.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none. The wiring reserves the hero's six addresses to
  the demo and routes them to it (`reserved-slugs.ts`, the demo's seed), and renames the seed's event if `example`.
- Calls his to overrule: `codes` (a real code per address); `credit-words` (a face and a first name only); `pours`
  (each address its own party's photographs); `typed` (round two's five); `album-name` (Our party behind a door of
  its own).
- Look at first: `/design/lab/demo-framing?session=demo-framing.stage`, option 2 (the link opens into its invite),
  at 1:1 for one whole loop, about 41 s: the pill typing, the code opening, the wedding album bursting out credited.
