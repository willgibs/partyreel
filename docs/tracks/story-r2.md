---
track: story-r2
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
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

Each is built as recommended and drawn on the board (the first four as its carried calls, `spec.ts` `carried`); his to overrule.

- **The demo door's line, cut to two?** "A real album, open with no sign-up." Read off the frame: 1 line at 1440 (seven of twelve), 2 beside the screen (six of twelve) and 2 at 375. /how-it-works' `DemoDoor` subhead keeps its longer sentence.
- **The overlay's and the modal's button?** "Start free" (`MARKETING_CTA`), the site's one start label, rather than a new "Start your event".
- **The teaser's own words around the play mark?** Its heading as shipped (`SECTION_HEADERS.reel`), a stand-in subhead ("It plays from the second photo, and every guest can make a clip of their own.") where the retired style-picking line was, no style strip; the section's words are the wiring's.
- **One reel door line or two?** One, at both sizes (the hub's wide lead, which today shows the door's `long` line, and the related row), and the /reel hero heading takes it.
- **The reel door's chip?** The view's resting bar in miniature (a play glyph and a progress track, no number) where "0:08" was; the arrival beat ("Theo Calder +2") on the `joins` line, whose claim it is.
- **The reel side's words on the event pages?** "The reel plays live at the reception." over the type's angle; the angle drawn is a stand-in (reel-sweep retells `EVENT_TYPES.reelAngle` tonight) and the wiring writes one reel line per type.
- **The screen option's columns?** Even, six and six, so a landscape wall stands as tall as the door; pair and bleed keep his seven and five.
- **The route option's welcome?** Today the demo's welcome sheet and its Add step come before `?reel` opens (walked on localhost `/e/<demo>?reel`); if `route` is picked, the guest page lets `?reel` defer them until the reel closes.

## System-doc edits (in place, owned facts only)

- none (a lab round ships no production byte)

## Deferred (ROADMAP one-liners, bucket named)

- none (round 2's picks are `reel-marketing`'s, already next in `tracks/orchestrator.md`)

## Handoff (replaces the chat report)

- Work commit `3b42f474`, pushed to `origin/lp/story-r2`. No sync commit: launch-prep moved (the mark-r3 merge `ed3ed826` and records), but none of it touches a `reads` path, and its one shared file (`touchpoints.ts`, the media-viewer row) merges clean (`git merge-tree --write-tree HEAD origin/launch-prep`: exit 0).
- Gates on `3b42f474`, each on its own exit code: `pnpm typecheck` 0; `pnpm lint` 0 (6 warnings, all in files this lane never touched); `pnpm test` 0 (449 files, 4886 tests; a first run failed once in `src/lib/guest/use-upload-queue.test.tsx`, a timing test outside the lane that passed 3 of 3 alone and in the full rerun); `zsh scripts/build-lock.sh pnpm build` 0; `pnpm lab:smoke --base http://localhost:3134` 0 (280 checks; reel-story 547 of 1200 words); `pnpm lab:demo --board reel-story --base http://localhost:3134` 0 (4 steps, every one moves).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = `src/app/(dev)/design/sandbox/reel-story/` (10 files kept or new, `surfaces.tsx` and `reel-story.css` retired) + `src/app/(dev)/design/touchpoints.ts` (reel-story's row only, the brief's own allowance) + this file.
- `close`: four directions on the shipped `SectionLight` + `CtaBand` (starts, every-photo, big-screen with "Watch the demo reel" in the demo line's place, hosting); recommends starts.
- `card`: three lines, each drawn in its three places (the hub's lead door, the /reel hero heading, /features/sharing's related row beside the real album and privacy doors); recommends "Your event, playing as it happens."
- `wall`: the reel as the door's twin card, as the screen at the party (the real screen's code plate, scanning to /demo), or past the page's edge, beside the shipped door; recommends pair.
- `play`: overlay, route and modal drawn pressed over the home's reel section at a real 1440 by 900 and 375 by 812; Close returns to the teaser (overlay, modal) or lands in a replica of the demo album (route); recommends overlay.
- Every option is portalled into a real `Frame` at its own width (`scene.tsx`), so its breakpoints and type clamps answer the frame; every caption is read off the frame (line counts, sizes). The reel is the demo album's live reel on the shipped `LiveReelPlayer` at the view's own look (`parts.tsx`), paused under reduced motion and on a step's hidden options (`useOffStage`: measured, the shown option's canvas moves and the two hidden ones hold).
- Assets requested from Will: none (the teaser's loop is the creator's to make from the demo album; `hero-candidate-02` stands in).
- Board ideas:
  - Lab kit: a live canvas player DOES run in a portalled `Frame` in Chromium (the implicit-root IntersectionObserver sees same-origin frame targets; measured here, paused off screen and resumed), so the lab revamp can correct the claim in `media-viewer/reel.tsx`, `reel-front/reel-front.css` and `reel-screen/stills.tsx` and offer the engine in frames.
  - Lab kit: a step's hidden options are `visibility: hidden` and still intersect, so every JS loop in them runs; a kit hook like this board's `useOffStage` (the `data-paused` mark read through the frame element) would pause them on every frame-based board.
  - The demo door's promise: with the event door on the short line and /how-it-works on the long one, one constant holding both in `marketing-voice.ts` keeps them from drifting.
  - The real demo album's reel draws black on localhost (R2 answers no CORS to localhost), so a local check of the demo's reel needs the alias or a dev origin on the bucket.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Calls his to overrule: the eight Questions above, and each ask's recommendation (starts, as-it-happens, pair, overlay).
- Look at first: `wall` at 1440 (the three presentations beside the door), then `play` pressed and closed (overlay against route); `card` is the tallest step (2.7 screens: its line in three places).
