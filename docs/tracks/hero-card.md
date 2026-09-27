---
track: hero-card
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "8d202ed1"            # the launch-prep SHA the branch was cut from
board: hero-card
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/hero-card/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/reel-story.json
  - src/components/marketing/
  - src/lib/constants/marketing-media.ts
  - docs/systems/marketing-content.md
  - docs/systems/design-system.md
---

# lp/hero-card

**Goal.** Open the `hero-card` board: the home hero's object reimagined as a compact event card, several photographs in an album with the code baked in, so a visitor reads at once "I make a shareable event and everyone uploads to it".

## The brief

**Will's ask** (his `reel-story` r3 note on `hero`, 2026-09-27): "let's design the item [to] be a compact version of an event card, not text-heavy (if at all) but kind of showcasing multiple images in an album rather than 1 and a QR code, plus whatever other design touches you can think of. This hero sets the stage for the platform, and this item inherently is the core to that as the source of the photo stream. Want visitors to get an immediate impression of 'oh, I make a shareable event and everyone uploads to it, cool!'. The QR code alone feels limiting, like our product revolves around QRs-only rather than a 'one link' concept, for which QRs are a huge contributor and key feature, but not defining. Reduces the idea of how easily this is to send a link in a group chat/email blast or simply write your custom link for people to copy/type."
And in chat: "I didn't mean to imply anything about the code itself being bad, only that as the center visual item in our home hero, a simple QR code doesn't fully convey our platform as much as the QR being baked into more an album-concept for the media to stream from. The QR does not need to be scannable in this visual, just tie the idea of the QR to the compact album visual." (The scannable code lives in the demo modal `demo-doors` is building, opened from a new "Try our demo event" eyebrow over the H1.)

**The object today:** `DemoFrame` at `size="hero"`/`"heroCompact"` (`src/components/marketing/system/demo-ticket.tsx`), mounted by `DemoQr` in `sections/home/cinema-hero.tsx:418-437`, one photograph in a mat with the code in its corner, the album streaming out of it on `hero-stream.ts`'s tables and loop. Its history: the retired `home-hero` board's seven rounds (git `85aa65d9`, retired at `00624e3b`) and `reel-story` r3's hero ask (git: `sandbox/reel-story/hero.tsx` at `8d202ed1`), whose measurements stand: today's object ends 7px over the headline at 375 with 100px of air above it (25 and 131 at 1440).

**The questions:** the object itself first (one decision: which compact event card), each option drawn in the real first screen (the site header, the band streaming out of the object on the band's own tables, the eyebrow over the H1, the headline and CTAs) at 1440 and 375, graded against today's object as the reference; the one-link idea visible (a link, a custom address, a QR as one of its faces, never the whole); several photographs, the stream's source; little or no text. A second question only if the object's own drawing raises one (e.g. whether it stands in a pool of its own light: ROADMAP's line from `story-r3`). Media made for its slot (the media registry's stand-ins; name any asset a pick would need: `docs/ASSETS.md` row 28 is parked on this board).

Register the board directly after `identity-claims` in `registry.ts`, `boards.ts` and `touchpoints.ts` (its lines are your named exceptions; the Orchestrator places it in `DESK_ORDER`). Author with `defineExploration`; the newest board is the worked example.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The board at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke --base http://localhost:<port>` whole; `pnpm lab:demo --board <board> --base http://localhost:<port>` pressing every step.

## Questions (a recommended answer each; the Orchestrator relays them)

- **Which compact event card?** The board's one ask (`card`), four options drawn in the real first screen at 1440 and
  375: `today` (the reference), `album`, `page`, `link`. Recommended: `album`, the album on a card (white paper, four
  photographs with the code as the fifth tile, the custom address and three guests' faces at the foot). Nothing ships;
  the pick is wired next round.
- **A second question (the card's own light)?** Recommended: no, carried on the board as `light`: white paper already
  stands clear of the room and the band, whose photographs carry the colour round it. Built: no light. His overrule
  draws a halo or a pool on the picked card next round.
- **The app's dashboard card as an option?** Drawn first (his words were "a compact version of an event card") and
  left off: photographs in front of the band of photographs read as one more frame of it, at rest and mid-loop.
  Recommended: leave it off; every card is paper, a different material from what leaves it (spec.ts's header).
- **The eyebrow**, **the card's place**, **the address**, **stillness**: the four other carried calls on the board
  (`eyebrow`, `place`, `address`, `still`), each drawn as taken and listed under Calls below.

## System-doc edits (in place, owned facts only)

- none (the lane owns only its board; no system fact moved)

## Deferred (ROADMAP one-liners, bucket named)

- none. ROADMAP's marketing line from `story-r3` (the hero's object in a pool of its own) is answered by the carried
  call `light`: drop the line if he keeps the call, draw it on the picked card if he overrules.

## Handoff (replaces the chat report)

- **Work** `cc8b0bfd` (the board and its three registrations), pushed; this manifest the handoff commit on top.
  launch-prep moved only by the record commit `964c4986` (docs: ASSETS, ROADMAP, STATUS, the pickup), so no sync.
- **Gates on `cc8b0bfd`**, each its own exit code 0: `pnpm typecheck`; `pnpm lint` (0 errors, 5 warnings, all in
  files this lane never touched: review-session.tsx, contact-form.tsx, album-fill-grid.tsx, review-switch.tsx);
  `pnpm test` (499 files, 5626 tests); `zsh scripts/build-lock.sh pnpm build`; `pnpm lab:smoke --base
  http://localhost:3134` (250 checks, 0 failing; hero-card reads 493 words of 1200); `pnpm lab:demo --board hero-card
  --base http://localhost:3134` (`hero-card.card ok`, 4 options, the stage moves by up to 6.84%). Logs in
  `../partyreel-wt/_scratch/hero-card/gate-*.log`.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): `src/app/(dev)/design/sandbox/hero-card/`
  (board.tsx, cards.tsx, fixtures.ts, hero.tsx, scene.tsx, screens.ts, spec.ts) and this manifest; the exceptions are
  the brief's named registrations, one line or row each directly after `identity-claims`: `sandbox/registry.ts`
  (import and list), `(shell)/lab/boards.ts` (import and entry), `touchpoints.ts` (the `SandboxId` member, the
  `RULINGS` row and `DESK_ORDER`, the last because `registry.test.ts` holds `DESK_ORDER` to the registered boards).
  ★ `demo-doors` retires `reel-story` from the line right under this board's `DESK_ORDER` entry, so that one hunk may
  meet at the merge: keep `hero-card` after `identity-claims` and drop `reel-story`.
- **The items**:
  - The board `hero-card` r1 at `/design/lab/hero-card`, one decision on `defineExploration`, the screen knob (1440,
    375), five carried calls; nothing imports from `reel-story` (it retires with `demo-doors`: the frame, the scene and
    the hero's loop are this board's own copies in `scene.tsx` and `hero.tsx`).
  - The real first screen per option (`hero.tsx`): `MarketingHeader`, the band on `hero-stream.ts`'s tables and
    production's closed-form loop (resting deployed under reduced motion, still when its option is off the stage),
    the eyebrow stand-in as the block's first line, the ruled block and both actions.
  - Every caption read off its frame (reduced motion emulated): today 232x272, 131 under the header and 25 over the
    eyebrow at 1440 (173x202, 100 and 7 at 375); `album` 288x290, 69 and 69 (200x208, 50 and 50), 4 photographs, one
    a video, the code 76px, the slug at 17px, 3 faces; `page` 288x286, 71 and 71 (200x202, 53 and 53), 6
    photographs, the code 44px, the slug at 17px; `link` 338x181, 122 and 125 (239x132, 87 and 89), 4 prints, the
    code 58px, the slug at 18px. Captures in `../partyreel-wt/_scratch/hero-card/shots-final/`, 2x crops in
    `shots-v5o/`; page console clean but for the lab shell's dev-only trail.css preload warning.
- **Assets requested from Will**:
  - The hero card's album · six photographs of one wedding, one grade, 4:5 masters at 960x1200 whose subject survives
    a square, a 4:3 and a 5:4 crop, legible at 70px, none of them one of the band's twelve stills; one of them a
    moment a guest films (the toast), which the card marks as a video · replaces `CARD_STILLS` in `fixtures.ts`
    (wedding-toast, wedding-petals, wedding-rings, reception-table, wedding-golden, wedding-arch) and supersedes
    ASSETS row 28 (one still for the old object).
  - Three guest portraits · square 256x256, one grade, a face centred and legible at 18px · replaces the seeded
    avatars in `CARD_FACES` (row 29's spec, withdrawn with `beside=live` and wanted again by every card here).
- **Board ideas**:
  - The event pages' table and tent cards print a code and "Scan to add your photos" but no address; printing the
    custom address under the code would carry the one-link idea onto the objects that stand in for the product there
    (`sections/events/event-object.tsx`).
  - `AvatarGroup` (`ui/avatar.tsx`) overlaps a fixed 8px at every size, which hides a third of a 24px face and its
    initial; an overlap that is a share of the face (this board's `Faces`) would fix it where every face row reads it.
- **Proposed migrations / Worker / Vercel / Stripe / env changes**: none.
- **Calls his to overrule**:
  - `eyebrow`: demo-doors' "Try our demo event" drawn as a stand-in (the eyebrow atom, the block's first line); the air
    is read again against what lands.
  - `place`: each card stands mid-air between the header and the eyebrow, the axis through its lower half, not
    centred on the axis as today's is. ★ For the wiring: production's calc needs a floor (`hero.tsx`, `Place`), or on
    a screen taller than about 1450px at `lg` (1150 for the link's shorter object) the card lifts clear of the axis.
  - `address`: partyreel.com/e/mia-and-theo, the slug in ink; the code encodes the short `/demo`, so a scan lands.
  - `still`: the card never moves; the band is the hero's one motion.
  - `light`: no light of its own this round.
  - The app's dashboard card, drawn and left off the board (Questions above).
- **Look at first**: `/design/lab/hero-card?key=…&session=hero-card.card` at 1440, `album` against `today`, then the
  screen knob to 375.
