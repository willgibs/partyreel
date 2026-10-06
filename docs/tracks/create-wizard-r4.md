---
track: create-wizard-r4
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "6ccc5b4e"            # the launch-prep SHA the branch was cut from
board: create-wizard
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/create-wizard/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/host-app.md
  - docs/systems/disposable-mode.md
  - docs/reviews/create-wizard.json
---

# lp/create-wizard-r4

**Goal.** Round 4 of the create-wizard board (desk 60): Will's round-3 pick polished (the album styles' step), and two moments of Create made in text and built, now drawn as real contenders: what is left as Settings' steps (F1) and the develop playing while the event is made (F2). No production byte.

## The brief

**The round's direction (Will, standing since round 13):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; delight where it costs nothing in clarity; nothing depends on a timeline; immediate, or a clear state and a way to stop it; no AI managing it; cost designed like the architecture; production is the working version, a pick the best of what was drawn, never a rule.

**Round 3's answer (the ledger, `docs/reviews/create-wizard.json`):** `add` → `styles`, wired since. His note, synthesized: it won on the clear distinction across the three (subtle, conceptual visuals that each carry their mode's experience with its description, rather than full-screen experiences thrown at a new host), and it "could continue to be polished"; he likes Reviewed as a top-level mode and asks whether the plainer "Review" reads better; and when Disposable is picked, its develop time stands directly below the option or on a focused next screen, never tucked under the timeline where it may not be noticed. Start from production's add step as wired (`components/app/create-event-wizard/`), not from round 3's drawings.

**This round's asks:**
- **The styles' polish:** the add step's three styles taken further, his note's points answered in the drawings (the mode's name, where Disposable's time stands, each visual's restraint).
- **F1, what is left as Settings' steps (as built):** at Create's end, what remains flat under the code with ticks, and one line on what guests still need. Is that the right close to Create, and how much of Settings should it carry?
- **F2, the develop playing while the event is made (as built):** "Creating your event…" as the room dims for the code, the sample developing into her code; a failure returns to the look with her work kept. Draw the wait and the failure as real contenders.

F1 and F2 were made in text on 2026-10-04 and built that way; each is now asked as a picture, its built answer drawn as one option (production's own), so Will's pick weighs it against real alternatives. Shape the asks yourself (`after` stages one behind another where an answer changes the next); merge two that would ask one decision. The calls lab's F3 (a sample code until Create) and F4 (a phone's Back leaves Create) stay as built: ask nothing they settle.

**Drawn on production as it is now:** identity r5's house set is production's atoms, so compose production's own components and their states, never redraw an atom; the brand is Afterglow (brand r2's take is Will's open ask: draw on production's tokens and say in the About where a take would change a frame). Every option previewed whole at 1440 and 375, with its states and its motion where the moment moves.

**Open asks nearest yours** (ask nothing they ask): host-moments r1's seven (a host's party: a password added, a develop time added mid-party, the door's decline and block, over her plan with a goal), brand r2's `take`, event-header r6's `card` and `attention`. Check the desk with `node usher/kit/board-card.mjs --desk` once booted.

**Verify on.** The light gate (PROGRAM.md, "Speed over proof in exploration"): typecheck, lint, the board's own tests, `pnpm lab:smoke` and `pnpm lab:demo --board create-wizard` at 1440 and 375, reduced motion honoured. Measure every tile before it ships.

Model: Opus. Cut 2026-10-06 by the cloud-seated Orchestrator; you run in a cloud session of your own (the spawn prompt's boot).

**The board's shape.** The board is one folder, `src/app/(dev)/design/sandbox/create-wizard/`, and nothing else names it: the registry finds it, and retiring it is deleting it. `spec.ts` is `defineExploration` (`src/components/lab/exploration.ts`) and pure data: its id `create-wizard`, its title, `surface`, `desk: 60` (by leverage, lower first) and `lives` (the paths it redraws), its `opening` and `terms`, and every ask with its context layer (`where`, `when`, `matters` beside `lands`, each option's `gains` and `costs`, `because` in a line). `board.tsx` exports one component, `ExplorationBoard` with a preview per option (`PreviewsFor`). `registry.test.ts` holds all of it; `pnpm lab:smoke` and `pnpm lab:demo` run on the board your change reaches.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The board at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke --base http://localhost:<port>` (it crawls what your change reaches, the board and the desk; `--all` for the whole lab); `pnpm lab:demo --board <board> --base http://localhost:<port>` pressing every step.

## Questions (a recommended answer each; the Orchestrator relays them)

- How the round shapes F2: one ask or two? **Two, built:** `wait` (what stands while the event is made) and `failed` (where a failure lands), the failure staged `after: wait` and drawn in his picked wait, since a failure held in place looks like the wait it holds. Overrule: one ask, each option a wait and a failure together.
- `styles`' recommendation: **`focused`** (three cards, then the develop time's own screen), his second placement, over production's `built`, which already answers his note (the time directly under its card; Review as the name) and measures in view at 375 (512 px down) with the room scrolling 35 px once the roll opens. Overrule: `built`, if one more screen for a Disposable host costs more.
- New words this round drew, each the board's until a pick wires it: the focused screen's "When do the photos develop?" / "Everyone's open at once"; the close's "Guests still need your code: print it, or share it."; the held failure's "Couldn't create it yet" / "Nothing was lost: your name, style and look are kept. Check your connection and try again."; the in-room line "Couldn't create the event. Nothing was lost." Recommended: keep them as drawn; the voice (`marketing-voice.ts`) may tune them at wiring.

## System-doc edits (in place, owned facts only)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- **Work commit** `d71ba2435` on `lp/create-wizard-r4`, pushed. No sync: launch-prep moved since the cut only by `docs/STATUS.md`, `docs/tracks/orchestrator.md` and `src/lib/db/types.ts` (none of this lane's reads, nothing the board imports changed); the head is in the chat line.
- **Gates on `d71ba2435`** (the light gate, each on its own exit code): `pnpm typecheck` 0; `pnpm lint` on the board 0; vitest over `sandbox/`, `components/lab` and `components/app/create-event-wizard` 0 (26 files, 301 tests); `pnpm lab:smoke --base http://localhost:3131` 0 (6 checks, the board's reading 613 of 1200 words); `pnpm lab:demo --board create-wizard --base http://localhost:3131` 0 (4 steps, every option drawn and differing, at 1440 and 375), and again with `--state screen=1440` 0. Reduced motion: frames shot under `prefers-reduced-motion: reduce` read whole (the run's waits are timers, never motion; the tray's warmth and slow develop are declared only under `no-preference`).
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` = `src/app/(dev)/design/sandbox/create-wizard/` (12 paths: `add.tsx`, `pictures.tsx`, `paper.tsx`, `room.tsx` deleted, round three's drawings; `close.tsx`, `create.tsx`, `styles.tsx` new) + this file. No exceptions; no production byte.
- **The items:**
  - `styles` (the styles polished; today `built`, recommended `focused`): `built` is production's `AddStep` untouched; `focused` is the same cards with the develop slot shut (board CSS) and a screen of its own after them while Disposable is picked (the steppers go 4 to 5); `quiet` is one `StylePicture` of the style picked, the night under it, Settings' three as plain rows, production's `DevelopRow` and `RollControl` opening in Disposable's row. Measured at 375, Disposable picked: built, time in view 512 px down, the room scrolls 35 px; focused, no time on the step, the time 481 px down on its own screen, nothing scrolls; quiet, one picture 335 by 176 (Live) shrinking to 92 when the time opens, time in view 543 px down, nothing scrolls.
  - `close` (F1; today `marks`, recommended `next`): production's `BeatSteps` (20 words on the beat at 375), one line of what guests still need (24), Settings' five steps as named chips (28, two lines at a phone), nothing (14). All read off production's `readiness()` of the new event.
  - `wait` (F2; today and recommended `breath`): production's `BeatCode` breathing; `tray`, the same plate shown as blank paper with a warm pass, her code developing up out of it slower (1.3 s) once made; `inplace`, Create event working on the look, the beat landing with her code.
  - `failed` (F2, `after: wait`; today `back`, recommended `held`): production's return to the look with its toast (a frame-scoped `Toaster`, sonner's `toasterId`); `held`, the beat stays ("Couldn't create it yet", the plate still, Try again at the foot, Back to the look), or on the look under `inplace`; `line`, back to the look with the words under the question.
  - Every frame is `create.tsx`'s `CreateRun`: production's room, head, carry, name, add step, look and beat composed, with the four axes threaded; Try it opens each, the at-rest frames press Create event as they open. Captions are read off the frame (`scene.tsx`'s `readRoom`: the screen, the steppers, the pictures' sizes, where the develop time stands against the fold, the code's state, where a failure is said, the words, the question, the action, a scroll).
- **Assets requested from Will:** none.
- **Board ideas:** production's Settings `Mark` (the round tick) is local to `add-step.tsx` and retyped in `styles.tsx`; a pick of `quiet` exports it. The readiness `code` item's line ("Nobody has opened it yet. Send it or print it, then scan it once yourself.") is long for anywhere a line is all there is; `next` would want a short form beside it.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none.
- **Calls his to overrule:** the recommendations above (`styles=focused`, `close=next`, `wait=breath`, `failed=held`); Try it's slow line at 2.6 s and a retry that succeeds (the board's carried `slow` and `retry`); F2 split into two asks.
- **Test data left:** none (nothing reaches a server; the run makes no event).
- **Look at first:** `failed` at 375 wearing `wait=tray` (the held failure on blank paper), then `styles.focused`'s third frame (the develop time's own screen), then `close.next` against `close.marks`.
