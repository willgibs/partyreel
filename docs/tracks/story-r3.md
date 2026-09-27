---
track: story-r3
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "0b2af407"            # the launch-prep SHA the branch was cut from
board: reel-story
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/reel-story/
  - src/app/(dev)/design/sandbox/home-hero/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/reel-story.json
  - src/components/marketing/
  - src/lib/constants/marketing-media.ts
  - docs/systems/marketing-content.md
  - src/app/(dev)/design/sandbox/site-chrome/spec.ts
---

# lp/story-r3

**Goal.** Draw `reel-story` round 3: the home hero's album + QR made polished, something new beside the demo link (or nothing), and a better line for the reel, every preview on media made for its slot.

## The brief

**From his r2 sitting** (`docs/reviews/reel-story.json`). Production is the working version and his notes are the direction. `reel-marketing` is wiring r2's picks in production now:
- the close's "Your next event starts here.";
- "Your event, playing as it happens.";
- the still twin card beside the river;
- the contained player;
- the footer's photo stack restored;
- the demo link standing alone in all 19 places.

**Three questions, one decision each:**
1. **The home hero's album + QR** (`DemoFrame` at `size="hero"` / `"heroCompact"`, mounted by `DemoQr` in `src/components/marketing/sections/home/cinema-hero.tsx:418-437`). His note: "The home hero version also needs a ton of work to feel more polished." Grade polished takes against today's as the reference; a new concept only if it clearly beats them. The hero's history is in git: the retired `home-hero` board's seven rounds (at `85aa65d9`, retired at `00624e3b`). Its orphaned `sandbox/home-hero/shared.tsx` has no importer; delete it.
2. **Beside the demo link** ("Try the live demo, no signup." wherever `DemoCtaLink` shows: 14 closing bands and 5 page heroes). His note: "Would like something totally new here (or nothing at all beside the link)." Nothing is one option (the working version once the wiring lands). The others are new, each drawn beside the real link in a real band and in a real hero.
3. **The reel's line** (the reel door at both sizes and the /reel hero). He picked "Your event, playing as it happens." and wrote: "Could use a few better options though. The 'everyone's photos... live' and 'every new photo joins' from the other options also added value beyond this version's 'Your event', which is less clear." Draw lines that carry what those two said, graded against as-it-happens.

**His principle, from `play`** (it applies to every preview here): "an exciting intro/feature/reel video made for its own purpose in a section will always beat using a generic reel from a fake demo that our site visitors aren't auditing." r2 drew every option on `DemoReel`, the demo album's live reel. r3 draws on media made for the slot, using the media registry's stand-ins (`src/lib/constants/marketing-media.ts`), and names any asset a pick would need.

**Housekeeping.** The board exists, so register nothing new: its `touchpoints.ts` rows are yours, and nothing else in that file. Ask nothing another open board asks (`node usher/kit/board-card.mjs --desk`); `site-chrome` asks about the footer.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The board at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke --base http://localhost:<port>` whole; `pnpm lab:demo --board <board> --base http://localhost:<port>` pressing every step.

## Questions (a recommended answer each; the Orchestrator relays them)

- **What the hero's code encodes.** Recommended, and built in every polished take: `/demo`, the QR door's short value (his `opens=short`), 25 modules against the event link's 33, so the print's 104px code scans at 3.2px a module and the plate's 144px at 4.4; `today` keeps the event link. On the board as carried call `hero-code`.
- **Round two's drawings.** Recommended, and done: `close`, `card`, `wall` and `play` left the board with their demo-reel fixtures (git holds them at `1a455e5f`); `reel-marketing` wires them from its own cut.
- **Where `beside` is drawn.** Recommended, and built: in the two layouts the 19 places use, the home's close (centred under the buttons, as 14 bands and three heroes are) and the /reel hero (inline beside the button, as /reel and /features/qr are).
- **The peek on a phone.** Recommended, and built: nothing, the link alone (carried call `peek-phone`).
- **The reel line's length.** Recommended, and built: new lines at the working line's length, two lines on the /reel heading at 1440, with one longer line (the two beats, three lines) kept for its content. Two drafts, "Everyone's photos, playing as they land." and "Every photo your guests add, playing live.", measured three lines and were cut (`line.tsx`'s note).
- **The board's title.** Recommended, and kept: "The marketing story of the reel". Two of the three asks are about the demo's objects, but the board's id, desk place and ledger stay the same.

## System-doc edits (in place, owned facts only)

- none (a board round ships no production byte)

## Deferred (ROADMAP one-liners, bucket named)

- none

## Handoff (replaces the chat report)

- Work commit `80d29a70`, pushed to `origin/lp/story-r3`, cut from `1a455e5f`. launch-prep has since moved to `33d728ff` (profile-setup, claims-r2, mine-none), but none of that touches this lane's reads. It changes other boards' rows in `registry.ts` and `touchpoints.ts`, and `git merge-tree --write-tree HEAD origin/launch-prep` is clean, so there is no sync commit (PROGRAM's sync rule).
- Gates on `80d29a70`, each on its own exit code; logs in `partyreel-wt/_scratch/story-r3/gate-*.log`:
  - `pnpm typecheck`: 0.
  - `pnpm lint`: 0, with 5 warnings, all in files this lane never touched.
  - `pnpm test`: 0 (484 files, 5478 tests).
  - `zsh scripts/build-lock.sh pnpm build`: 0.
  - `pnpm lab:smoke --base http://localhost:3135`: 0 (259 checks, 0 failing; reel-story reads 525 of 1200 words).
  - `pnpm lab:demo --board reel-story --base http://localhost:3135`: 0 (3 steps, 0 failing; the stage moves 5.64% on hero, 100% on beside, 3.23% on line).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = `sandbox/reel-story/` (spec, board, hero, beside, line from card, reel-hero, parts; close, wall, play and fixtures deleted), `sandbox/home-hero/shared.tsx` (deleted), and this file. One exception: `src/app/(dev)/design/touchpoints.ts`, the `reel-story` row only (its asks, why, lives, note and variants), which the brief names as the board's own.
- Items:
  - `hero`, the object the album streams out of, is drawn in the real first screen: the site header, the band on `hero-stream.ts`'s own tables and loop, and the ruled block. Four options:
    - Today's `DemoFrame` (the reference).
    - The same pair on paper.
    - One print with its code on the band's axis (recommended).
    - The code alone at the QR door's finish.
    - Each caption measures the object, its air under the header and over the headline, and its code's px a module (`hero.tsx`).
  - The finding the hero ask rests on, measured on the shipped hero: today's object ends 7px over the headline at 375 with 100px of air above it (25 and 131 at 1440), and its 92px code is 2.2px a module, under the 3px scan floor.
  - `beside` is drawn inside the one link, in the home's close as the wiring lands it and in the /reel hero (`beside.tsx`). Four options:
    - Nothing (the reference).
    - A live dot on the house pulse, its ring tinted to the dot (recommended).
    - The guests' faces in the guest list's own `AvatarGroup`.
    - A peek of the album on hover, drawn open at 1440.
  - `line` is drawn in the hub's lead door, the /reel heading and the related row's door, each line count read off the frame (`line.tsx`). Its options are graded against "Your event, playing as it happens.":
    - "Everyone's photos, live as they land." (recommended).
    - "Every new photo plays as it lands."
    - "Everyone's photos, live. Every new one joins."
  - Four carried calls are on the board: `hero-code`, `hero-ground`, `peek-phone` and `line-sizes`.
  - `sandbox/home-hero/shared.tsx` is deleted (it had no importer), so ROADMAP.md:129's line is done.
- Assets requested from Will:
  - The hero object's own photograph · one still, 4:5 at 960x1200, one grade, subject centred so a square crop holds it, not one of the band's twelve · replaces `wedding-arch` in the hero object (`print` or `refined` only)
  - Three guest portraits · square, 256x256, one grade, a face centred and legible at 20px · replaces the seeded avatars beside the demo link (`faces` only)
  - Three demo-album stills for the peek · 4:5 at 480x600, one grade, legible at 80px · replace `wedding-toast`, `party-dj` and `wedding-petals` in the peek (`peek` only; row 5's folder can supply them)
- Board ideas:
  - The home hero stands in no light, while every event page stands its object in the house light (`SectionLight placement="room"`). A board could ask whether the hero's object gets a pool of its own.
  - A trap for `src/components/lab/traps.ts`: the lab's utilities compile into a sublayer (`utilities.lab`) that loses to production's own layer, so a lab-only variant paired with a production class on one property silently loses. `hidden lg:contents` stayed hidden at 1440 (`hero.tsx`'s `ByBp` note).
  - The hero's object carries one of the band's own twelve stills (`wedding-arch`, in production today too), so it shows twice on the first screen; the first asset above ends it.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Calls his to overrule:
  - the four carried calls;
  - `hero=print`;
  - `beside=live`;
  - `line=as-they-land`.
- Look at first: `/design/lab/reel-story?session=reel-story.hero` at 1440, today against the print, then 375.
