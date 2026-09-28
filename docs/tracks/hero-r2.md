---
track: hero-r2
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "e199f43f"            # the launch-prep SHA the branch was cut from
board: hero-card
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/hero-card/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/hero-card.json
  - docs/systems/marketing-content.md
  - docs/systems/design-system.md
---

# lp/hero-r2

**Goal.** Draw `hero-card` round 2: a few more ideas branching from Will's `link` pick for the home hero's object, each drawn at 1440, 900 and 375, with the hero's tablet geometry (loose-ends' `hero-tablet`) folded in here as its one home.

## The brief

**His round 1 answer** (`docs/reviews/hero-card.json`): `card=link`, "the link, the album rising out of it" (the code beside the custom address on a white card, four prints standing up out of its top edge, the guests' faces at its end: `cards.tsx`'s `LinkObject`). His note: everything else felt too tall to be a visually scannable item and took too much of the centre stage; this one works much better with everything around it, while carrying lots of the product inside it (the QR, the custom link, guests, photos). "Would love to see a few more ideas branching from this."

**The question:** which version of the link card stands at the centre of the hero. `link` as round 1 drew it is the reference every option is graded against (production still ships the framed photograph, `DemoFrame` in `src/components/marketing/system/demo-ticket.tsx`, mounted by `DemoQr` in `sections/home/cinema-hero.tsx`; the wiring after this pick replaces it). Draw a few genuinely different branches, each keeping what he liked (compact and low, scannable at a glance, the one-link idea with the QR as one face of it, guests and photos inside it) and each pushing one idea further. Candidates to weigh, not a list to copy: how the prints rise (a fan, a stack, a strip, one of them a video); what the link reads as (a link as it lands in a group chat or an email, a custom address being typed, a live count of who is in); how the guests show; whether a photograph leaves the card into the band (round 1's carried `still`); whether it stands in a light of its own (round 1's carried `light`). The best ideas win; two options that land on one answer are a finding.

**The tablet width is asked here now.** `loose-ends`' `hero-tablet` asked the hero's geometry at 900px, sized around an object that is changing, so it leaves that board (`marketing-refresh` removes it; its drawing and question are at `git show e199f43f:"src/app/(dev)/design/sandbox/loose-ends/hero-tablet.tsx"` and that board's `spec.ts`). Draw every option at 1440, 900 and 375 (the Screen knob), and if the 900 geometry is a decision of its own once the card is chosen, it is a second question here, staged behind the first with `after`.

**The ground** is the real first screen as production has it: the header, demo-doors' "Try our demo event" eyebrow over the H1, the headline and CTAs, and the band streaming out of the object on `hero-stream.ts`'s own tables. Round 1's carried calls (`place`, `address`, `still`, `light`, `eyebrow`) carry unless an option explores one.

The board moves to `round.n: 2` with round 1 in `history` and his note as the direction (`registry.test.ts` checks that a board past round 1 carries it). Its lines in `registry.ts`, `boards.ts` and `touchpoints.ts` are yours for this round (named exceptions; nothing else in those files). Media from the registry's stand-ins; name any asset a pick would need (`docs/ASSETS.md` rows 33 and 34 are parked on this board).

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The board at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke --base http://localhost:<port>` whole; `pnpm lab:demo --board <board> --base http://localhost:<port>` pressing every step.

## Questions (a recommended answer each; the Orchestrator relays them)

Each is built as recommended; the first four are the board's carried calls, so he can overrule them in place.

- Where does a card stand? In the middle of its air as round one carried, now with a floor: at the larger of the
  midpoint and `axis - (half the card - inset)` (20px on the phone's band, 34 on the desktop's), so a tall screen never
  leaves the band born in the open under it. It never moves his link at 1440x900 or 375x812 (`place`, rewritten).
- What does the link say? Round one's custom address, partyreel.com/e/mia-and-theo, unchanged (`address`).
- Does the card move? No, in any branch; a print lifting into the band, or the address typing itself once as the band
  opens, is the overrule (`still`, on his reel-story note that two motions cancel each other out).
- Which tablet does 900 stand for? One held upright, 900 by 1200, since every tablet held upright is 768 to 1023 wide
  (`tablet-screen`); the overrule is a narrow desk window, about 900 by 700.
- Which branches? Four, each one idea of his round-one list pushed further: `guests` (the faces on the photographs they
  added, the toast a video, the other 30 counted), `chat` (the link as it lands in the group chat, in the real unfurl's
  words), `spread` (eight prints fanned lower along the card), `typed` (the whole address on one line, the code its
  badge). His link is drawn unmodified as the reference; round one's other three cards and today's frame retired with
  the round (git keeps them at `e199f43f`).
- Where does the light live? A question of its own behind the card, drawn in the card he picks: a light suits any card,
  and "your link, lit" as a branch would ask two things at once. The lamp stands behind the band, never over a
  photograph (the hero's own rule), with its turbulence host mounted in the frame's document.
- How is the tablet's composed geometry solved? Every length lerped between the phone's and the desktop's as
  `loose-ends` composed it, except the axis, solved at 38% for an upright tablet: the lerp's 34 left a quarter of 900 by
  1200 empty under the block, 38 stands the card's top and the block's foot about 270px from the header and the fold.
- What ground do the frames stand on? Production's: demo-doors' eyebrow with its live dot (round one's stand-in
  retired), and the header pinned as the top of the page draws it; in a frame it read the lab page's scroll, so round
  one drew every first screen with it hidden, and it glazed once scrolled.

## System-doc edits (in place, owned facts only)

- none (the board ships no production byte; no fact in `marketing-content.md` or `design-system.md` changed)

## Deferred (ROADMAP one-liners, bucket named)

- Lab: a real `MarketingHeader` drawn in a board's frame reads the lab page's scroll, so it hides
  (`use-scroll-direction.ts`) and glazes (`header-shell.tsx`'s sentinel) once the reader scrolls down to the frame;
  hero-card pins it with a scoped style, and contact-page, privacy-hero and album-motion draw the same header, so one
  pin in the kit's frame would fix them all (from `hero-r2`).

## Handoff (replaces the chat report)

- Work commit `74732c60` on `origin/lp/hero-r2`, branched from `1708b049` (the cut commit). No sync: launch-prep moved
  by voice-r2 (`0abfdeac`) and storage-r2 (`1413b3e6`) with their records, touching none of this lane's reads nor the
  hero's production files, and `git merge-tree --write-tree HEAD origin/launch-prep` merges clean (their
  `touchpoints.ts` rows are other boards').
- Gates on `74732c60`, each its own exit code, logs in `_scratch/hero-r2/`: typecheck 0 (`typecheck.log`); lint 0 (0
  errors, 5 warnings, none in a touched file; `lint.log`); test 0 (510 files, 5,738 tests; `test.log`);
  `build-lock.sh pnpm build` 0 (`build.log`); `lab:smoke --base http://localhost:3131` 0 (234 checks, hero-card at 528
  of 1,200 words; `smoke.log`); `lab:demo --board hero-card` 0 (3 steps: card 5 options, the stage moving up to 3.70%;
  light 3, up to 6.40%; tablet 3, up to 18.93%; `demo.log`). Typecheck and test through the lock, every heavy step one
  at a time, the dev server killed before the test run and the build and after the lab steps; nothing was killed or
  lost, and no gate step was re-run.
- Lane check: the 7 owned paths under `sandbox/hero-card/` (one new, `tablet.ts`) plus
  `src/app/(dev)/design/touchpoints.ts`, the named exception (the board's row rewritten for round 2: asks, why, note,
  and its variants as the three asks' labels), plus this file. `registry.ts` and `boards.ts` unchanged (same id, same
  component).
- `spec.ts`: round 2; `card` with his link as the reference and four branches (`typed` recommended); `light` (none,
  pool, bloom recommended) and `tablet` (today, tablet recommended, early), both staged behind `card`; round 1 in
  `history`, his note as the direction, four carried calls.
- `cards.tsx`: his link verbatim; the four branches, each drawn at `base` and `lg` as a CSS pair and at a `tablet` size
  composed from the two; `CARDS` carries each card's box height for the floor.
- `hero.tsx`: the first screen as production draws it (demo-doors' eyebrow and live dot, the header pinned); the card's
  floor; the lamp behind the band with a `GlowFilter` in the frame's own document; a geometry forced at 900 through the
  sheet's plain names, its loop running that geometry's table.
- `tablet.ts`: the three tables, `today` and `early` production's own, `tablet` composed (ported from loose-ends'
  `hero-tablet-engine.ts` at `e199f43f`) with its axis solved for an upright tablet. `screens.ts`: 900 by 1200 on the
  knob. `fixtures.ts`: eight stills, a fourth guest, the unfurl's title quoted from `generateMetadata`.
- Measured, each frame's own caption at 1440 / 375: link 338x181 / 239x132; guests 338x181 / 239x132; chat 343x198 /
  249x146; spread 355x137 / 256x102; typed 396x165 / 296x117. At 900 by 1200: today sets the headline in 3 lines and
  ends the block 280px above the fold; tablet 2 lines at 627, 272px; early 2 lines at 836, 266px.
- Assets requested from Will: none new. Rows 33 and 34 stay parked on his pick: `spread` would make row 33 eight
  photographs (it fans eight), `guests` would make row 34 four portraits (one per print); `link`, `chat` and `typed`
  keep both as logged.
- Board idea: ROADMAP's line on the hero's light (from `story-r3`) is asked here now as `light`, so it can close.
- Board idea: the lab kit's frame could pin a drawn marketing header (the Deferred line above).
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Calls his to overrule: `typed` as the card (his link if the code should stay the address's equal, `guests` if
  everyone adding photos should lead); `bloom` as the light (none if white on the dark room should stay the hero's
  whole palette, the pool if the room should be lit rather than the card); `tablet` as the geometry (`early` if a third
  table is not worth its upkeep before launch); the eight Questions above.
- Look at first: the step `hero-card.card` at 1440, pressing `link`, then `typed`, then `guests`; the 900 and 375 knobs;
  then `light` and `tablet`, which open once the card is answered.
