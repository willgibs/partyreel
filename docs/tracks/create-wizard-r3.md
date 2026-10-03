---
track: create-wizard-r3
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "c5f341f4"            # the launch-prep SHA the branch was cut from
board: create-wizard
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/create-wizard/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/create-wizard.json
  - docs/reviews/the-wait.json
  - src/app/(dev)/design/sandbox/the-wait/spec.ts
  - src/components/app/create-event-wizard/
  - src/components/app/event-settings/camera-settings.tsx
---

# lp/create-wizard-r3

**Goal.** create-wizard round 3: the add step (how guests add, an album or a disposable), a more polished set drawn in the room as wired, the distinction clean and beautiful with no decision paralysis.

## The brief

**The round's direction (Will, round 13, carried by every lane):** never dev-tool-ish (the viewfinder's corners survive only as a focus mark, never a style, and so does nothing of their loading state); a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline (undated, morning-only and multi-day events all read well); "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control); cost is designed like the architecture (every image and video action multiplies at scale). Production is the working version: a pick is the best of what was drawn, never a rule.

**Will's answer (create-wizard r2, his desk on build 45, 2026-10-03):** add=? "These are all presented well already. This is really tough for me to decide, so let's run a second exploration so I can pick from an even more polished option set. Really important we can cleanly (yet beautifully) nail the distinction for hosts here, without overcomplicating or decision paralysis." r2's three were `pair` (two phones side by side, one night slider under both), `switch` (one phone, a switch over it) and `stack` (the pick in front, the other behind). His other picks are wired now (`wizard-wiring`, merged): the room, flow=carry, look=places, beat=develop.

**What the add step must now agree with** (the-wait's picks, wired by `wait-wiring` beside you):
- **model=time** on the guest screens: one question of time, with a small distinction between disposable and reviewed.
- **Settings' "Album style"** of picture cards (Live, Reviewed, Disposable).
- **name=disposable.**
- **both=never:** approval stays a live album's, and a disposable keeps only its develop time.

The add step is where a host meets that choice first, so its words and its pictures follow the same model. Round 12's settled pieces stay available to you: the night slider (how each choice plays through the night) and the camera step right after the name.

**The ask (`add`):** three to four options, more polished than r2's, each drawn whole in the room at 1440 and 375, paper and room where it matters.
- A refined r2 option is welcome beside new ones.
- At least one option mirrors Settings' album styles, so Create and Settings speak one language.
- Each option says what a host gives up by choosing.
- None makes her read more than a line to choose; the night shows the difference rather than words.

Recommend one. Retire r2's answered asks into the board's settled lines.

**The board's shape.** The board is one folder, `src/app/(dev)/design/sandbox/create-wizard/`, and nothing else names it: the registry finds it, and retiring it is deleting it. `spec.ts` is `defineExploration` (`src/components/lab/exploration.ts`) and pure data: its id `create-wizard`, its title, `surface`, `desk: 60` (by leverage, lower first) and `lives` (the paths it redraws), its `opening` and `terms`, and every ask with its context layer (`where`, `when`, `matters` beside `lands`, each option's `gains` and `costs`, `because` in a line). `board.tsx` exports one component, `ExplorationBoard` with a preview per option (`PreviewsFor`). `registry.test.ts` holds all of it; `pnpm lab:smoke` and `pnpm lab:demo` run on the board your change reaches.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate (CLAUDE.md's four steps, each on its own exit code); `pnpm lab:smoke --base http://localhost:3135`; `pnpm lab:demo --board create-wizard --base http://localhost:3135` at 1440 and with `--width 375`, pressing every step; `registry.test.ts` and `queue.test.ts`.

## Questions (a recommended answer each; the Orchestrator relays them)

Each is built as recommended and stands on the board as a carried call (`spec.ts` `carried`), his to overrule there.

- **What does the add step ask, now its answer is an album style?** Recommended and built: "Pick your album's style"
  (Settings' own word) over "Change it any time in Settings"; r2's "How will guests add photos?" no longer fits,
  since Reviewed is not a way to add. Overrule: r2's question back.
- **Does the night name clock times?** Recommended and built: no; its moments are Arriving, The party and Next
  morning (the round's "nothing depends on a timeline"), the disposable's develop time still 9 am the morning after.
  Overrule: 8 pm, 10:40 pm and 9 am, as r2 drew it.
- **Which style stands picked as the step opens?** Recommended and built: Live (the schema's own default; Continue
  alone keeps it). Overrule: none picked, Continue waiting for her.
- **What does Continue carry into the head off the add step?** Recommended and built: the pick's own picture,
  dropping into its hairline as the look arrives (`carry.ts` left it to this round). Overrule: the hairline fills
  alone.
- **Does Create offer Reviewed?** Answered by his pick: `styles` and `one` offer Settings' three, `pair` and `strip`
  the two experiences with Reviewed left to Settings. Recommended: `styles` (three, Settings' own cards).

## System-doc edits (in place, owned facts only)

- none (an exploration ships no production byte; `host-app.md`'s add-step lines are the wiring's)

## Deferred (ROADMAP one-liners, bucket named)

- none

## Handoff (replaces the chat report)

- **Commits**, pushed on `lp/create-wizard-r3`: the work `67669aae` (the board r3, the pick's light inside its box
  and Settings' cards larger at a desk included), `708ec79d` (the three moments each drawn once: Disposable picked as
  guests arrive; its message also names two changes `67669aae` already held), `f5dd84a1` (a moment comes up like a
  print); the sync `7e4f6b2e` (`origin/launch-prep` at `e459ca50`: identity-wiring and rooms-wiring in). Since then
  launch-prep moved only by records (`ed7b480d`, `3e19e858`: `docs/tracks/orchestrator.md`), so no second sync.
- **Gates on `f5dd84a1`**, each its own exit code 0: `pnpm typecheck`; `pnpm lint`; `pnpm test` (825 files, 9,733
  tests); `zsh scripts/build-lock.sh pnpm build`; `pnpm lab:smoke --base http://localhost:3135` (19 checks, 0
  failing; create-wizard 660 words of 1,200); `pnpm lab:demo --board create-wizard --base http://localhost:3135` at
  1440 and `--width 375` (1 step, 0 failing; the stage 0.30 down at a desk, 0.38 at a phone, 18 px to the dock), and
  wearing `--state screen=1440` on `708ec79d` (0 failing). Logs: `../partyreel-wt/_scratch/create-wizard-r3/gate-*.log`.
- **Lane check**: `git diff --name-only origin/launch-prep...HEAD` = `src/app/(dev)/design/sandbox/create-wizard/`
  (add, board, create-wizard.css, fixtures, paper (new), pictures, room, scene, spec; beat, look, name, wizard
  deleted) + this file. No exceptions.
- **The board, round 3** (`spec.ts`): one ask, `add`, "How should the add step show Live, Reviewed and Disposable, so
  a host tells them apart at a glance and picks one?"; r2's answered asks (flow, look, beat) retired into the
  opening's settled lines, r1 and r2 in `history`, his r2 add note and his the-wait Settings note in `earlier`.
- **Drawn in the room as wired** (`room.tsx`): production's `RoomGround`, `RoomHead`, `RoomPage`, `RoomFoot`, `useCarry`,
  `NameStep`, `LookStep` and the beat's `BeatCode`/`BeatActs`/`BeatSteps`, four hairlines, the add step between the
  name and the look; the room's light is the Aurora's own field (the frame's filter host). Every link in a frame is
  held, so no press leaves the board.
- **Four options** (`add.tsx`), each Try it (Create running from the add step: the night plays once, pick, drag,
  Continue with the pick dropping into its hairline, Back to the name, Create event into the beat over a stand-in
  event, Get it ready again), then Disposable picked as guests arrive (its camera and its develop time), then slid to
  the morning:
  - `pair`: Live and Disposable as two phones, a line each at that moment ("Only their own until 9 am");
  - `styles` (recommended): Settings' three cards, `wait-wiring`'s picture and lines, the night moving every picture,
    plus Settings on paper (production's settings popup and furniture) with the same cards;
  - `one`: one phone, Live / Reviewed / Disposable a switch over it; at a desk the phone stands tall beside the rest;
  - `strip`: the night laid out, a row of three moments for each of the two, nothing to drag.
- **The-wait's words throughout** (`pictures.tsx`, `fixtures.ts`): the guests' screens say Developing with its clock
  ("As Maya lets them in", "All at once at 9 am") and "Disposable · develops 9 am"; the style names and lines are
  `wait-wiring`'s `lib/disposable/album-style.ts`, retyped until it merges (the file says so).
- **Verified**: Try it driven end to end in a headless Chrome (pick, the night, Continue with the pick's flight seen,
  Back twice to the name, forward, Create event developing then arrived, Get it ready back to Live); every option at
  375 and 1440 captured and read; reduced motion stands whole. Captures:
  `../partyreel-wt/_scratch/create-wizard-r3/` (`r3b-*`, `step-*`, `demo-1440/`).
- **Assets requested from Will**: none (the marketing stills and the guest ghost pack stand in, as every board's).
- **Board ideas**: if `styles` wins, the wiring mounts Settings' own `StyleCard`/`StylePicture` (exported from
  `camera-settings.tsx`, room-dressed) so Create and Settings stay one component, not two drawings of one; the
  lab's breakpoint split (`design.css`: a board's `md:` loses to production's base class) cost this lane a capture
  round, and a `/design/lab/kit` line pointing at it where boards start would save the next.
- **Proposed migrations / Worker / Vercel / Stripe / env changes**: none (the wiring sends the style's three columns
  through `createEventInWizard`; the schema already holds them).
- **Calls his to overrule**: the step's words; moments without clocks; Live preselected; the pick's drop into its
  hairline; the recommendation (`styles` over `pair`).
- **Look at first**: `/design/lab/create-wizard?key=…&session=create-wizard.add`, `styles` at 375: press Disposable,
  slide the night, then Continue to watch the pick drop into its hairline; then `pair` against it.
