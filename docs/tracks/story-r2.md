---
track: story-r2
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "e13a98d6"            # the launch-prep SHA the branch was cut from
board: reel-story
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/reel-story/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/reel-story.json
  - src/lib/constants/marketing-voice.ts
  - src/components/marketing/sections/home/cinema-close.tsx
  - src/components/marketing/sections/features/shared/feature-door.tsx
  - src/components/marketing/sections/how-it-works/demo-door.tsx
  - src/components/marketing/sections/reel/reel-hero.tsx
  - src/lib/demo.ts
---

# lp/story-r2

**Goal.** Draw `reel-story` round 2: the reel's marketing words and its two presentations, after Will turned down every thesis line and asked for a redesign of the reel beside the demo door. Everything he settled in round 1 is drawn as ground.

## The brief

Will's answers and notes: `docs/reviews/reel-story.json` (round 1, with the Orchestrator's note).

**Round 2 asks four things**, each in three or four directions drawn in the real section at 1440 and 375:
1. **`close`: the home page's closing section**, its heading, the line under it and its actions. Its own words, no longer tied to the hub's card: "the home screen and the feature hub's reel door don't have to be tied together ... they're for different purposes". Plain words a reader gets in one pass ("Roll credits on the group chat" made readers "think too much"). The close's job is the last invitation to start, so a direction that never mentions the reel is fair.
2. **`card`: the feature hub's reel door card** (title "The highlight reel", its chip, its line): what the reel is, in a card's few words. As ground, his to overrule: the /reel page's hero heading takes the card's line, so the door and the room it opens agree. Production feeds the close, the card and that hero from one constant (`GOLDEN_LINES.reelThesis`): draw them as separate strings.
3. **`wall`: the reel beside the demo door on the event pages.** He called round 1's left card "beautiful for production" and asked for "a ton of redesign work around the reel presentation" on the right (a 150px portrait engine beside two lines). Redesign that side; the reel is an equal partner to the door, never a thumbnail. As ground: the demo door exactly as shipped, with its copy cut to two lines at most at both 1440 and 375, measured with the real font (today 3 lines at 1440 and 5 at 375).
4. **`play`: where the home teaser's play mark leads.** The teaser is a short looped clip (muted, seamless, a few seconds, made by Partyreel's own creator from the demo album once it ships; a stand-in video until then) with a play mark that invites the click. The directions:
   - `overlay`, recommended: the demo's live reel plays over the page (the real view on the demo album), with one line of context, Start your event, and a door into the demo album; closing returns to the page.
   - `route`: straight into the demo album with its reel open (`/demo`, then `?reel`).
   - `modal`: a contained player with a caption and a call to action.

   He offered the second and third, "unless you have a better idea"; the first merges them.

**Drawn as ground** (settled):
- `arc=live-first`, with the screen second and clips third (the party, then the morning after).
- `pricing=renamed`, `steps=grow-clip`, `help=highlight-reel`.
- "Clip" as the noun.
- No two pages close on the same reel beat.
- No centred portrait video leaves blank space on a desktop.

The round-1 frames were plain boxes, so viewport-based classes followed the lab window rather than the frame; draw round 2 so each frame lays out as its own width does. Read the open asks on the desk (`node usher/kit/board-card.mjs --desk`) and ask nothing another board asks. `reel-story`'s row in `touchpoints.ts` is yours, nothing else in that file.

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
