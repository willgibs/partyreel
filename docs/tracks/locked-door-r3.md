---
track: locked-door-r3
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "e4e04eb0"            # the launch-prep SHA the branch was cut from (build 40's 26743369 plus two record commits)
board: locked-door
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/locked-door/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/locked-door.json
  - src/components/guest/door/
  - src/components/guest/entry-modal.tsx
  - docs/systems/guest-flow.md
---

# lp/locked-door-r3

**Goal.** Round 3 of the door: the reveal through the opened door into the album, with the album behind polished so the door reads, and calm idle loops for the waiting and shut states, drawn from the doorway production now ships.

## The brief

**Why.** Will answered r2 on 2026-10-02: doorway, shared, pick and follows are wired in production tonight (door-wiring); they are your `opening.settled`. His note on `family`, verbatim, is this round's direction:

> This is absolutely gorgeous, big win for our design assets and really sets a good new standard on experiential design. Two additional notes. First, the album behind the door opening doesn't feel very polished, kind of makes the door hard to see. I love the door (and light leak in the other versions), just want to nail this state too. Second, even the wait/shut states should have some sort of minimal, calmer, looped animation to keep the page a little interesting. Maybe a slight glow to the light or something?

**Asks:**
- `reveal`: the moment the door opens and she walks through into the album. Draw the album behind it polished, so the door reads; the light leak he loved in the other versions is a resource.
- `idle`: a calm loop for the waiting and the shut door, such as a slow glow on the light. Grade the options against one he can feel, so they differ in kind and not only in strength.

Both are drawn at 1440 and 375, with reduced motion as its own still. The chooser's look is the wiring's: draw it as production has it.

**Lives:** keep `lives` inside `src/components/guest/door/` (and the CSS it uses), so tonight's guest crumbs lane can't drift your board.

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

**The board's shape.** The board is one folder, `src/app/(dev)/design/sandbox/locked-door/`, and nothing else names it: the registry finds it, and retiring it is deleting it. `spec.ts` is `defineExploration` (`src/components/lab/exploration.ts`) and pure data: its id `locked-door`, its title, `surface`, `desk: 30` (by leverage, lower first) and `lives` (the paths it redraws), its `opening` and `terms`, and every ask with its context layer (`where`, `when`, `matters` beside `lands`, each option's `gains` and `costs`, `because` in a line). `board.tsx` exports one component, `ExplorationBoard` with a preview per option (`PreviewsFor`). `registry.test.ts` holds all of it; `pnpm lab:smoke` and `pnpm lab:demo` run on the board your change reaches.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The board at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke --base http://localhost:<port>` (it crawls what your change reaches, the board and the desk; `--all` for the whole lab); `pnpm lab:demo --board <board> --base http://localhost:<port>` pressing every step.

## Questions (a recommended answer each; the Orchestrator relays them)

Each is built as recommended and listed for Will to overrule; none is a one-way door (a lab round ships no
production byte). The first two are the board's carried calls, drawn above its steps.

1. `dot`: does the wait's live dot keep its own quick ping beside the door's loop? **Recommended: no**, it breathes
   on the door's own clock in every `idle` option, so the page keeps one rhythm (`locked-door.css`, "the live dot").
2. `gate-light`: when Maya lets Lena in, what lights the opening before the album has loaded? **Recommended: the
   house light, then the album's own as it arrives**, so nothing of the album shows while she is outside (the
   board draws the loaded state; the wiring keeps production's privacy rule).
3. Is the open door and the walk into the album one decision? **Recommended: yes**, one ask (`reveal`), since the
   walk starts from what the opening holds (the light floods out of it, its photograph flies out of it, the camera
   passes through it).
4. Is the light leak asked? **Recommended: no**, every `reveal` option spends it (the opening's light blooming low past
   the frame, thrown across the floor as a trapezoid, the leaf's own edge lit, the jamb's depth), per the brief's
   "a resource".
5. One loop for both doors at rest? **Recommended: yes**, the wait and the shut door run the same loop on the same
   pieces, keeping r2's `shape=shared` (only the words and the light change).
6. `through`'s camera reach: **recommended capped at 4.6 times the door at a laptop** (the photographs behind it a
   fifth of their size rather than a tenth); at a phone it spans the page's width (3.2).

## System-doc edits (in place, owned facts only)

- none (a lab round ships no production byte; the door's system facts stay door-wiring's in `guest-flow.md`)

## Deferred (ROADMAP one-liners, bucket named)

- none

## Handoff (replaces the chat report)

- **Commits, pushed to `origin/lp/locked-door-r3`:** `ffadc293` (the round: spec, board, scenes, sheet; r2's losing
  directions and its words table deleted), `e71c0ac7` (the loop's stills hold under the global reduced-motion guard),
  and this manifest's commit (the head in the chat line). **No sync:** launch-prep moved (crumbs-47, demo-r3 and
  event-header merged, and records), but no code in this lane's reads changed (`git diff e4e04eb0 origin/launch-prep`
  touches `guest-flow.md` only in the upload slot's failure sheet and Back, not the door), and
  `git merge-tree --write-tree origin/launch-prep HEAD` merges clean; no `ld-` keyframe or `@property` name occurs
  in any other sheet on launch-prep.
- **Gates on `e71c0ac7`, each on its own exit code:** `zsh scripts/build-lock.sh pnpm typecheck` 0; `pnpm lint` 0;
  `zsh scripts/build-lock.sh pnpm test` 0 (745 files, 8,829 tests); `zsh scripts/build-lock.sh pnpm build` 0;
  `pnpm lab:smoke --base http://localhost:3131` 4 checks, 0 failing (the board reads 664 words of 1,200);
  `pnpm lab:demo --board locked-door --base http://localhost:3131` 2 steps, 0 failing (both steps 1.0 screens, the
  stage 0.30 down at 1440 and 0.38 at 375, 18px above the dock), and again wearing `--state screen=1440` 0 failing;
  on `ffadc293` also `--state screen=1440 --state moment=let-in` and `--width 375`, 0 failing. The built sheet keeps
  every modern rule the board needs (`@property --ld-turn` and `--ld-pass`, the passing shadow's `calc()` mask with
  its `-webkit-` twin, `rotateY(-90deg)` under `preserve-3d`). The board's console is clean (no warning or error on
  the board page, either step, or the 1440 let-in state).
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` = `src/app/(dev)/design/sandbox/locked-door/` (10
  files written, 8 of r2's deleted) + this file; no exception.
- **`reveal`** (step 1, recommended `one`): the open door three ways, each live and looping (the welcome's door at
  rest, her Continue, the swing, the walk, the album), then still at rest (reduced motion's still), half way, and in
  the album, at 375 and 1440; the Moment knob plays it for Maya letting Lena in (her three picks sending under
  "You're in", production's `StageBeat` and `SendingPicks`). `light`: the opening holds the album's light alone and
  floods out over the page, the album rising as it lifts. `one`: the album's newest photograph in the room's light,
  which flies to its place as the album's first (measured: "landed within 0px of its tile"). `through`: the
  album's own photographs behind the door at 31% (22% at a laptop), the camera passing through the doorway onto them
  as the room clears and the album's head rises. Every frame is production's door page (`DOOR_MAIN`, `DoorColumn`,
  `WelcomeWords`, `WaitingDoor`, `StageBeat`); the doorway is production's markup and classes with the round's
  additions as children (`way.tsx`), so the wiring ports exactly those rules.
- **`idle`** (step 2, recommended `glow`): one loop on production's own wait (`DoorStage` at a gate with
  `WaitingDoor`) and shut door (`ShutDoor` in `DOOR_MAIN`): `glow` (the sill and the floor breathe, 8 s), `pass` (a
  shadow crosses the light at a walker's pace, every 12 s, in the door's own coordinates so the sill, the floor and
  the ajar gap darken together), `turn` (the light turns through the party's colours in oklch, 36 s, its brightness
  held); each live, the shut door as reduced motion sees it, and one loop in four stills that hold under reduced
  motion too (the guard's `!important` is outranked on the element, `idle.tsx`).
- **Assets requested from Will:** none (the open door's photograph is the album's own newest).
- **Board ideas:** (a) the walk through could carry the door's headline (the album's name) into the album's own `h1`
  as one element once `event-header` settles the album's head; (b) the demo's door (`demo-framing`'s) is the
  welcome's door, so whichever `reveal` he picks lands there too, worth one look on the demo when it wires.
- **For the wiring of `one`, if picked:** the opening shows the album's newest, which changes all night, so its
  photograph should crossfade when a newer one lands rather than cut; and production's `DOOR_VIEW_SIZE` (4) becomes 1.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none.
- **Calls his to overrule:** `reveal` → `one`; `idle` → `glow`; the six Questions above (`dot`, `gate-light`, one
  decision for the open door and the walk, the light leak in every option, one loop for both doors, the camera's
  reach).
- **Look at first:** `/design/lab/locked-door?session=locked-door.reveal`, each option's first frame (the moment
  playing) beside its rest still; then `?session=locked-door.idle`, the loop's four stills, where the three kinds
  differ even with motion reduced.
