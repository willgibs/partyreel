---
track: disposable-r3
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "04afe52d"            # the launch-prep SHA the branch was cut from
board: disposable-mode
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/disposable-mode/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/disposable-mode.json
  - src/components/guest/event-experience.tsx
  - src/lib/guest/use-upload-queue.ts
  - docs/systems/guest-flow.md
  - docs/systems/billing-caps.md
  - src/lib/constants/tiers.ts
---

# lp/disposable-r3

**Goal.** Round 3 of the disposable camera: four new cameras branched from the album's own camera and the reel, modern; a new waiting room with no tilt; save with the roll's looks judged on real guest photos beside none; video and cost kept staged after the camera.

## The brief

**Why.** Will answered r2 on 2026-10-02. Settled:
- `wall=slideshow`.
- `peek=covered`: refined in its wiring, not re-asked. His note: "Could probably polish this design more."
- `create=cards`: redrawn on tonight's `create-wizard` board.

His notes on the open three, verbatim:
- **`camera`:** "I'd like to carry over the album's own camera and the camera that shoots on a reel (options 1 and 3). Let's also branch 2 new design ideas from each. I love the more minimalist camera design of the first, where everything is immediately understandable, UI is amazingly clear, and subtle design touches like the tick count around the shot button are a nice touch. However, the reel idea really ties into the product as well, and makes it a little more fun/novel as you take pictures. My main pushback on this one may be the reel having a more vintage feel within our far more modern app design, which is only getting sleeker as we iterate."
- **`waiting`:** "I'd like to see another round of these to get the best option - by one note is that for grids, I'd prefer not to get messy and begin tilting anything, the slight rotation may make us feel too playful for more sophisticated events."
- **`save`:** "Can we revisit the roll looks/styles idea, whether with a live preview in Chrome through Orchestrator or with some examples of how it's being used in the lab or something? I'm not sure I want to include - feels like filters are going to make the majority of guest photos worse that don't match the palette well."

**Asks:**
- **`camera`:** viewfinder and reel stay, plus two new branches from each, modern and never vintage.
- **`waiting`:** a new round, with no tilted grids.
- **`save`:** the looks applied to a set of real guest photos in mixed light (`reference_test_media`: the fixtures folder), with "no looks" as its own option, so he can judge whether looks belong at all.
- **`video` and `cost`:** keep them staged `after: camera`.

**Lives:** its `lives` names files tonight's door-wiring changed, so draw from that production.

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

**The board's shape.** The board is one folder, `src/app/(dev)/design/sandbox/disposable-mode/`, and nothing else names it: the registry finds it, and retiring it is deleting it. `spec.ts` is `defineExploration` (`src/components/lab/exploration.ts`) and pure data: its id `disposable-mode`, its title, `surface`, `desk: 80` (by leverage, lower first) and `lives` (the paths it redraws), its `opening` and `terms`, and every ask with its context layer (`where`, `when`, `matters` beside `lands`, each option's `gains` and `costs`, `because` in a line). `board.tsx` exports one component, `ExplorationBoard` with a preview per option (`PreviewsFor`). `registry.test.ts` holds all of it; `pnpm lab:smoke` and `pnpm lab:demo` run on the board your change reaches.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The board at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke --base http://localhost:<port>` (it crawls what your change reaches, the board and the desk; `--all` for the whole lab); `pnpm lab:demo --board <board> --base http://localhost:<port>` pressing every step.

## Questions (a recommended answer each; the Orchestrator relays them)

- **The two cameras he kept: redrawn modern, or as round two drew them?** Recommended and built: as drawn, the
  references his notes compare against (`viewfinder`, `reel`); the four branches carry the modern push, and the reel's
  own de-vintaged version is its branch `timeline`.
- **The look's photographs.** The fixtures folder holds six landscapes (mountains, a pier, an aurora from orbit) and
  stays out of the repo by design (`.gitignore`). Recommended and built: the default set is the twelve party
  photographs every board reuses, each named by its light (`fixtures.ts` `LOOK_SET`); the fixtures, or his own camera
  roll, ride the dock's new Try your photos, which redraws every frame of the look in them on the device (driven with
  all six fixtures in a headless Chrome: the dock read "Your 6 photos" and every frame redrew).
- **Does Save keep its own question?** Recommended and built: no. It matters only if a look stays, so it is the
  carried call `save` (round two's recommendation), and the look is asked whole under round one's id `look` (so the
  ledger's `look` thread continues: r1 `stocks`, r3 open).
- **The permission frames (first press, refusal, asking again).** Recommended and built: out of this round. Round two
  drew them and they read the same in every camera, so each camera gets three larger frames that judge the camera
  itself: framing, the moment after, the roll done.

## System-doc edits (in place, owned facts only)

- none (lab only)

## Deferred (ROADMAP one-liners, bucket named)

- none

## Handoff (replaces the chat report)

- **Commits, pushed:** `707de650` (round three drawn), `68dc13a1` (polish). No sync: launch-prep moved only by other
  boards' folders and records (event-header `461717f0`, locked-door-r3 `52f3e61e`), none in my `reads`; a trial
  `git merge --no-commit origin/launch-prep` merged clean and the lab, registry and manifest tests passed on it (17
  files, 189 tests), then aborted.
- **Gates on `68dc13a1`'s tree, each its own exit 0** (logs in `../partyreel-wt/_scratch/disposable-r3/gate-*.log`):
  `pnpm typecheck`; `pnpm lint`; `pnpm test` (746 files, 8,873 tests); `zsh scripts/build-lock.sh pnpm build`;
  `pnpm lab:smoke --base http://localhost:3134` (7 checks, 0 failing, 859 of 1,200 words); `pnpm lab:demo --board
  disposable-mode --base http://localhost:3134` (5 steps, 0 failing at 1440 and 375 under reduced motion). No console
  error or warning on the board or any of its steps.
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` is `src/app/(dev)/design/sandbox/disposable-mode/`
  only, plus this file.
- **`camera`, six options, three frames each** (framing her seventh, the moment after, the roll done): the album's own
  camera and the camera on a reel as round two drew them; `shutter`, the count inside the shutter (full screen under
  the product's glass, a numeral in the ring of ticks, her sealed shots one glass button away); `rim`, the roll round
  the picture (24 segments on the live picture's edge, a video's ten seconds tracing it in red); `timeline`, the reel
  as a timeline (recommended: 24 rounded frames, the live picture in the one she is on, gliding on a frame a shot);
  `scroll`, the screen scrolls like a reel (a column of frames, the last sealed above, the next under her thumb).
  The moment after replays with motion allowed (the flash, the count stepping down, the reel moving on); a still under
  reduced motion.
- **`video` and `cost`,** round two's options, staged `after: camera` and `after: video`, drawn in the camera picked
  (every camera draws hold, a switch and a button, filming and a video's three costs); cost's second frame is her
  shots in the waiting room picked.
- **`waiting`, four new rooms, nothing tilted, each a room, her shots opened and a delete, 1440 on the knob:**
  `sheet`, the party's contact sheet (recommended: every shot a square as it lands, the newest warm, hers lit with her
  photographs); `stack`, the stack squared (a deck that thickens, hers as index tabs, her prints dealt in a row);
  `glow`, the party's colours (the room lit by the party's own photographs blurred past any picture); `dial`, the
  night on a dial (shots as bars at their minute from 7 pm round to 9 am, hers as dots).
- **`look`, three options on twelve real party photographs in twelve lights** (the album at 9:02 am and two up close;
  1440 on the knob): `none`; `grain`, the grain and the date with every photo's own colour (recommended); `stocks`,
  Warm, Cool or B&W on the knob. Each look is an SVG colour pass, a tone table and grain drawn as well as it could
  ship, so a look loses on its idea and never on a crude stand-in.
- **Retired with their files:** `wall`, `peek` and `create` (settled), the drawn and wrapper cameras, the host's quoted
  hub and Create, the old viewer and thumbnails. The board's surface moves from shared to guest: every round-three
  ask is a guest's.
- **New atoms the cameras and rooms would need** (no production piece yet, nothing asked of `identity`): the camera
  screen and its glass controls, the count-holding shutter, the rim, the timeline strip, the reel column; the contact
  sheet's square, the deck, the glow, the dial.
- **Assets requested from Will:** none (real phone photographs arrive through Try your photos).
- **Board ideas:** the contact sheet as the host's live view of the night (`host-dashboard`'s arrivals: every shot a
  square as it lands); the dial as the morning-after recap of when the party peaked; Try your photos as a kit piece
  for any board judging a treatment on photographs (the reel's styles, a look).
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none. If `glow` wins, its wiring adds a few
  colours read off each shot on the uploading phone (said in the option's cost).
- **Calls his to overrule:** `camera=timeline` (overrule: `shutter`); `waiting=sheet` (overrule: `stack`);
  `look=grain` (overrule: `none`); `video=hold` and `cost=one` stand from round two; the carried calls `live` (the
  camera's picture wears no look), `save` and `end` (the roll's end says when it comes back, her shots a tap away, the
  shutter gone); the four Questions above.
- **Look at first:** the camera step (`/design/lab/disposable-mode?session=disposable-mode.camera`), every option's
  moment after with motion on; then the look step on his phone with Try your photos and his own camera roll.
