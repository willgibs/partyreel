---
track: clip-bench
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "242e0bf4"            # the launch-prep SHA the branch was cut from
board: reel-cut
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/reel-cut/
  - src/app/(dev)/design/sandbox/reel-story/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/reel-cut.json
  - src/components/reel/reel-studio.tsx
  - src/lib/media/share-save.ts
  - src/app/(dev)/design/sandbox/guest-capture/spec.ts
  - src/app/(dev)/design/sandbox/reel-front/spec.ts
---

# lp/clip-bench

**Goal.** Draw `reel-cut` round 2: the clip creator's workbench with its moments and looks living inside it. Will picked the bench (the clip at full height, a panel beside it, the filmstrip and tray below) and asked that the media selection and the look selector be redesigned into that workbench rather than feel like detached config screens for the same clip. The word is "clip" from now on.

## The brief

Will's picks and notes: `docs/reviews/reel-cut.json`.

**Round 2 asks one thing, `bench`**: how moments and looks live inside the workbench. Three or four directions, each drawn at 1440 and 375 by the real engine over the lab's fixture album, each a whole creator rather than a panel swap: the phone form is part of each direction, since his note holds there too.

**Drawn as ground, never asked** (settled in r1, built later by the clip lane as he amended them):
- `entry=room` and the bench's frame.
- `blocked=caption`: hidden photos dimmed, with "Hidden · Show".
- `wait=stack`.
- The finish: Share primary; "Save" opening the platform's options (Save to Photos first on iOS, then Download file; `src/lib/media/share-save.ts`); "Add to event" behind a confirm; every action keeping you on the finish screen with its done state.
- `mark=line`, quieter but still findable.
- `noencode=greyed`: the disabled button stays and a tap explains why.
- `sound=silent`.

**The noun**: "clip" in every question, option and line on this board. On `reel-story` (unreviewed, round 1), options that offer "cut" become "clip"; nothing else there changes and it stays round 1.

The nearest open asks are `guest-capture.follow` and `reel-front`'s round 2 (`signature`, `badge`); ask nothing they ask. The rows of `touchpoints.ts` for `reel-cut` and `reel-story` are yours, nothing else in that file.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** Both boards at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke --base http://localhost:<port>` whole; `pnpm lab:demo --board reel-cut --base http://localhost:<port>` and `pnpm lab:demo --board reel-story --base http://localhost:<port>` pressing every step.

## Questions (a recommended answer each; the Orchestrator relays them)

All built as recommended; the first is the board's own ask, the next four ride the board as carried calls.

- Which direction for `bench`? Recommended `strip` (moments on the filmstrip, looks beside): at 1440 all 14 looks and
  all 23 moments stand in view with nothing to scroll; in a hand the whole creator is one screen. `column` keeps the
  wall and the grid at every size; `dial` makes the clip the look control.
- What does the tray hold now? Three value chips (Length, Layout, Opening), each opening a small menu, the same in
  every direction (carried call `tray`).
- Where does the finish sit at a laptop? In the panel beside the full-height clip, under "Back to editing, your picks
  kept"; in a hand its own screen (carried call `finish-laptop`).
- How quiet is the free mark's line? One micro line under the mark's corner: a guest's "Free events mark their clips.
  Pro events don't", the host's "Your free event marks its clips. Remove it with Pro" (carried call `mark-line`).
- What does a tap on the greyed Make your own say? A bubble for a few seconds: "This browser can't make clips. Open
  the album on another device to make one." (carried call `noencode-tap`).
- On `reel-story`, what happens to the pairs that drew clip beside cut? Each folds into one option: `pricing.renamed`
  (still the recommendation) now draws Clip length and Clip watermark and `clip-renamed` is gone; `steps.grow-clip`
  takes `grow-cut`'s place as the recommendation. Ids that named cut are renamed (`arc.clip-first`, `events.clip`,
  `help.reels-clips`) since no answer was on the record; the teaser's subhead, the arc's third chapter, the help
  pane's line and the steps' other options draw clip too, because each is drawn inside an option.

## System-doc edits (in place, owned facts only)

- none (a lab board: no system's facts moved)

## Deferred (ROADMAP one-liners, bucket named)

- none

## Handoff (replaces the chat report)

- Commits: the work at `e630b909` (pushed), then this manifest alone; the head is in the chat line. launch-prep moved
  since the cut (`reel-defaults-migration` merged at `71cfea65`, and records), none of it in this lane's reads or paths,
  and `git merge-tree --write-tree HEAD origin/launch-prep` merges clean, so no sync.
- Gates on `e630b909`, each its own exit code: `pnpm typecheck` 0; `pnpm lint` 0 (7 warnings, every one in a file this
  lane never touched); `pnpm test` 0 (427 files, 4585 tests); `zsh scripts/build-lock.sh pnpm build` 0;
  `pnpm lab:smoke --base http://localhost:3138` 0 (291 checks, 0 failing); `pnpm lab:demo --board reel-cut` 0 (1
  step, the stage moves by up to 51.84%); `pnpm lab:demo --board reel-story` 0 (7 steps, 0 failing).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = `sandbox/reel-cut/` (bench, board, directions,
  fixtures, ground, parts, scene, spec, stills; `room.tsx` deleted), `sandbox/reel-story/` (board, spec, surfaces),
  this file, and `src/app/(dev)/design/touchpoints.ts`, the exception the brief grants: only the `reel-cut` and
  `reel-story` rows.
- `reel-cut` round 2 (`reel-cut/spec.ts`): one ask, `bench`, three directions, each a whole creator: a 1440 bench over
  two 375 moments (`scene.tsx` `Scenes`), every clip frame the real engine keyed by what the knobs say it wears
  (`stills.tsx`, a lazy sequential queue), every caption read off its own frame (`board.tsx` readers, clipped by every
  scroll box).
- Measured on the committed tree: `strip` 1440 clip 396x705, 14/14 looks, 23/23 moments, 375 clip 230x409, 5/14 looks,
  8/23 moments on one screen; `column` 1440 clip 400x711, 14/14 looks, 14/23 moments (the panel scrolls), 375 clip
  168x299, 8/14 looks before a scroll; `dial` 1440 clip 385x685, 23/23 moments, the look named on a dial, 375 clip
  325x578 with the moments behind the +, the album risen at 12/23.
- Ground on the `stage` knob (`ground.tsx`): the export's minute (the clip's own frame stacks, the bench dims), the
  finish (Share leads; Save and Add to event a pair; Make another quiet; the iOS Save menu, Save to Photos first; Add
  to event's confirm; done states that keep her on the finish), a free event (no Add to event, the engine's own mark,
  the quieter line), the host's pool (`maker`: two hidden tiles with "Hidden · Show"), no encoder (the greyed button's
  bubble), and no sound anywhere. `look` and `fill` knobs move the engine's picture.
- `reel-story`: the noun is clip in every option; the pricing and steps pairs folded; it stays round 1
  (`reel-story/spec.ts`'s `round.changed` says so).
- `touchpoints.ts`: `reel-cut` (title "From the reel to a clip", asks, why, note, variants) and `reel-story` (why,
  note) rows.
- Assets requested from Will: none.
- Board ideas: `lab:demo --save-shots` keeps only a stage's largest frame, so a board that draws a laptop and phones
  per option reaches the review sheet without its phones (save every frame, named by its title) · production's
  `StyleWall` groups the looks as "Looks" and "Layouts" while the tray's orientation chip is also "Layout"; a copy
  round could name the treatments apart (this board says moods and treatments).
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Calls his to overrule: the recommendation `strip` · `tray` · `finish-laptop` · `mark-line` · `noencode-tap` · the
  reel-story folds and renamed ids · the confirm's words ("Add your clip to Maya & Jay?", placeholder).
- Look at first: `/design/lab/reel-cut?key=…&session=reel-cut.bench`, the three options at the default knobs, then
  `stage` on Finished and on Add to event to see his amended finish drawn, then `plan` on Free with `maker` on Maya.
