---
track: story-r3
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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

- none yet

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
