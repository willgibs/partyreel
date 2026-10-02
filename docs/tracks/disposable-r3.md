---
track: disposable-r3
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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
