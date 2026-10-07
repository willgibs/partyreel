---
track: create-wizard-r5
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "6d216dd9"            # the launch-prep SHA the branch was cut from
board: create-wizard
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/create-wizard/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/create-wizard.json
  - docs/PRD.md
  - docs/systems/host-app.md
  - src/components/app/create-event-wizard.tsx
  - src/lib/events/readiness.ts
---

# lp/create-wizard-r5

**Goal.** Board create-wizard r5: Create finishes the event, its close the payoff of a made event, and the style step's previews rethought, from Will's round-4 notes.

## The brief

**The round's direction (Will, standing):** delight where it costs nothing in clarity; attention earned, never yelled (PRD.md); immediate, or a clear state and a way out; never dev-tool-ish; world-class tastemakers; production the working version.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app, and nothing deploys. Port 3133 is yours; 3000 is Will's desk.

**Round 5, from Will's round-4 answers (`docs/reviews/create-wizard.json`; all wired by create-wizard-wiring: the focused styles with Disposable's own screen, the one-line close, a failure held):** his notes are this round's brief, and their wording is the point:
- On close: "How we present this line can definitely be designed better. I do like the subtlety versus the steps, though. Rather than shouting about what's done and what's to come, we should simply continue naturally guiding them through. Anything required for an event to go live immediately should be cleanly handled in the event wizard with a focused view, with nothing being left to be handled in settings, only additional/optional configs or changing the selections made in the creation wizard. In my trial run, it felt weird to go through a create wizard, complete, then feel like you're only halfway done. Really reduces that reward moment at the end of the wizard... Nailing this seamless creation and entry would be a huge win. Really want hosts to feel excited that their event has been created, since that's the big payoff moment and there's a noticeable gap until the next payoff of guests uploading unless the host uploads earlier themselves." (PRD.md's core loop now says it: Create finishes the event.)
- On styles: "I'm still split on the timeline on the actual mode selection screen (kind of hard mental model to keep 9 screens in your head to compare, and feels overwhelming seeing 3 things happen at once each step), and curious if we think of better ways to enhance this selection instead. Good exploration to run. Maybe one can play the live visual demo of the active selection, while the others stay still until selected to preview themselves? That should be far from the exhaustive list of explorations. You're far more creative than I am."

**What the code says (for your drawings):** Create already does every essential readiness item but the code's share (the door and adds are done at Create; `code` is the one left; photos and the welcome are not essential: `readiness.ts`), so the halfway feeling is the beat's presentation, its "Get it ready" foot leading into Settings, and the hub's checklist meeting her next, not a missing setting.

**Asks you shape (each one decision, real contenders, drawn on production's own room and atoms):** (1) Create's close as the payoff: what the made event's last screen says and does (the excitement, the code's share as the one next step said naturally, where "Get it ready" goes, how she enters her hub), with the hub's first arrival and its checklist in the picture; (2) the style step's previews: how three styles are told apart without three stories playing at once (one playing, the others still until picked; and your own better ideas); (3) the gap audit's open question, folded in only if it earns an ask: a kind of event (a wedding, a birthday) that sets Create's defaults and stock covers, or none.

**Nearest standing asks (ask nothing they ask):** brand-marks r1 and signature r1 (the marks, the tokens, where the light lives in the app); account-moments r2 (follow, the invitation).

**The method:** a helper per option, one fresh-eyes pass, a board's light gate (PROGRAM's "Speed over proof in exploration").

**The board's shape.** The board is one folder, `src/app/(dev)/design/sandbox/create-wizard/`, and nothing else names it: the registry finds it, and retiring it is deleting it. `spec.ts` is `defineExploration` (`src/components/lab/exploration.ts`) and pure data: its id `create-wizard`, its title, `surface`, `desk: 60` (by leverage, lower first) and `lives` (the paths it redraws), its `opening` and `terms`, and every ask with its context layer (`where`, `when`, `matters` beside `lands`, each option's `gains` and `costs`, `because` in a line). `board.tsx` exports one component, `ExplorationBoard` with a preview per option (`PreviewsFor`). `registry.test.ts` holds all of it; `pnpm lab:smoke` and `pnpm lab:demo` run on the board your change reaches.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The board at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke --base http://localhost:<port>` (it crawls what your change reaches, the board and the desk; `--all` for the whole lab); `pnpm lab:demo --board <board> --base http://localhost:<port>` pressing every step.

## Questions (a recommended answer each; the Orchestrator relays them)

- **A kind of event (the gap audit's #14): does it earn an ask?** Recommended: no, and it is not asked. The name
  already says it ("Maya & Jay's Wedding"); a kind would set little she does not pick a screen later (the style), its
  stock covers would put a stranger's wedding on her guests' cover, and a step before the payoff is the opposite of
  this round's note. Built as the board's carried call `kind` (overrule: a kind chip on the name screen picking the
  style and the look's photograph).
- **How does she step from Create into her event?** Recommended: the room opens into it, the dark rising into her
  cover's box and her code flying to its mat (`entry.ts`, the carried `entry`); production would run it as a view
  transition across the route change (the hub's code already wears a view-transition name), a plain cut under reduced
  motion or without the API. Overrule: a plain change of page.
- **What does the hub's empty album say?** Recommended: the house's empty voice, Will's own pick ("The album starts
  with you", Add the first photos its one door), under every greeting, so `arrival`'s options differ by the checklist
  alone (the carried `album`; production says "No photos yet" today).
- **On the beat, what becomes of the head's close once the event exists?** Recommended: where the foot goes into her
  event (`enter`'s beat, the invite screen) it goes; where the foot does something else it stays, and on `photos` it
  reads Your event (the carried `close-x`).
- **If `arrival=done` is picked, what else moves?** Recommended, for the wiring: readiness drops the code from what a
  guest needs into the head of what is worth doing (still ticking at its first open), so Settings' card says the door
  (never "1 left"), `readyHead`'s line drops its "still", the dashboard's lit stage shows the essentials' ticks rather
  than the five-step rail beside "Ready", and `attention.ts` keeps "Code never opened · Invite" before the event's day.
- **If `close=photos` is picked:** the host's upload queue must outlive the room (`HostAddProvider` belongs to the hub
  page today), and on a Disposable her first photos seal with everyone's until the develop; the board draws Live.

## System-doc edits (in place, owned facts only)

- none (an exploration ships no production byte; host-app.md's create facts change with the wiring of the picks)

## Deferred (ROADMAP one-liners, each naming its bucket and area)

- Immediate · The host app: Create's beat shares "Add your photos and videos to <name>" (`beat.tsx`'s `BeatActs`) on
  a Free event, which takes photos only; say what the plan takes (create-wizard r5's helpers).
- Upcoming · The lab and the kit: a portalled frame's `IntersectionObserver` (the hub's cards row) watches the lab's
  viewport rather than the frame's, so the row reads stuck whenever its frame's footprint leaves the lab's screen (and
  a beyond-viewport capture flips it); a `FrameWindow` observer shim, or a line in `traps.ts` (create-wizard r5).

## Handoff (replaces the chat report)

- Work commit `930608d17` (the board, round five), then this manifest's commit, both pushed to `lp/create-wizard-r5`.
  No sync: launch-prep moved (crumbs-87, account-moments-r2 and records) but nothing landed in this lane's `reads`
  and the merge cannot conflict (only this folder and this file change).
- Gates on `930608d17`, each its own exit code (logs in `../partyreel-wt/_scratch/create-wizard-r5/gate-*.log`):
  `pnpm typecheck` 0; `pnpm lint` 0 (no warnings); the board's and the kit's own tests (`vitest run
  src/app/(dev)/design/sandbox/ src/components/lab/`) 0, 20 files, 205 tests; `pnpm test:rules` 0, 85 files, 1458
  tests; `pnpm lab:smoke --base http://localhost:3133` 0 (5 checks, 0 failing, the board 667 words of 1200);
  `pnpm lab:demo --board create-wizard --base http://localhost:3133` 0 (3 steps, 0 failing, every option drawn and
  differing, at a desk and a phone).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = `src/app/(dev)/design/sandbox/create-wizard/`
  (arrival.tsx, board.tsx, close.tsx, create-wizard.css, create.tsx, entry.ts, fixtures.ts, hub.tsx, pictures.tsx,
  previews.tsx, scene.tsx, spec.ts, styles.tsx deleted) + this file; no exceptions.
- `close` (Create's last screen, recommended `enter`): `enter` (the beat's line moved into the room's sub, "Share it,
  and guests can start adding photos", Print and Share under her code, Go to your event, the room opening into her
  event with her code carried to its mat); `invite` (her code alone, Invite guests, one screen of the message guests
  get, Share, Copy link and Print, then in); `photos` (Add your first photos, each tile developing as it goes up, her
  event opening with them on its cover and in the album).
- `arrival` (her event's first greeting, recommended `done`): `list` (production's checklist, 2 of 3); `share` (one
  line in the beat's words with Invite and Print, "on its way" once she shared in Create); `done` (readiness fixed at
  its source: "Ready for guests · Your code is all they need" with Invite, Show opening the rest).
- `previews` (the styles told apart, recommended `one`, today `built`): `built`; `one` (three cards resting where they
  differ, a sharper rest for Review and the Disposable, only the picked card playing its story once, its moment named
  on a picture wide enough); `open` (three rows, the picked one opening on its album large, its three moments stops);
  `still` (the rest, nothing playing).
- The method: a helper per option (eight specs, each built), one fresh-eyes pass (`a7e3bcaf5d1e59ac1`), every MUST it
  named applied but one: the cards row "landing stuck" reproduced only under the lane's beyond-viewport captures, never
  in the browser pane, so production's row stands (Deferred, the lab line).
- Assets requested from Will: none.
- Board ideas: Settings' rail still reads as steps (five numbered, two ticked, Next leading to the code), so the
  optional reads as owed once Create is the payoff; a Settings board could draw its groups as places, not steps.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none (`done` is pure readiness; `photos` needs none).
- Calls his to overrule: `kind` (no kind of event), `entry` (the room opens into her event), `album` (the empty
  album's voice), `close-x` (the head's close), each drawn above the board's sections.
- Look at first: `close`'s Try it frame under `enter` (Create event, then Go to your event: the room opening into her
  event), then `arrival=done`'s frame beside `list`.
