---
track: guest-moments-r1
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "462cea3f"            # the launch-prep SHA the branch was cut from
board: guest-moments
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/guest-moments/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/guest-flow.md
  - docs/systems/disposable-mode.md
  - docs/systems/reel.md
---

# lp/guest-moments-r1

**Goal.** A new board, guest-moments (desk 45): four moments in a guest's night, each made in text and built, now drawn as real contenders for Will's pick: a first photo's glow (C7), taking a shot back (D3), how a batch of other people's photos lands (Q3), and the reel opening (G6). No production byte.

## The brief

**The round's direction (Will, standing since round 13):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; delight where it costs nothing in clarity; nothing depends on a timeline; immediate, or a clear state and a way to stop it; no AI managing it; cost designed like the architecture; production is the working version, a pick the best of what was drawn, never a rule.

**The moments (the calls lab's round-15 lines, as built today):**
- **C7, a first photo's glow:** it glows for the host but not for the guest who took it; whether the guest sees her own first photo arrive, and how.
- **D3, taking a shot back:** one press, its frame free again; three rolls' worth at most, deleted that night (Settings now says the ceiling: "up to 3 shots in all", identity-r5-wiring); Will's flat 3 re-shoots at any roll is one option to draw.
- **Q3, how a batch of others' photos lands:** about every 15 s; at a phone a batch of six opens the album's top at once and reads empty for a moment (`components/guest/`, the album's window and its arrivals pill).
- **G6, the reel opening:** from the Reel card and from a shared reel link it opens on black, a blink with no progress mark (`event-experience.tsx`'s reel curtain).

**Drawn on production as it is now:** identity r5's house set is production's atoms since `94534554` (fields sunk as wells, keys flat, the chosen afloat, working keys that say what they do), so compose production's own components and their states, never redraw an atom; the brand is Afterglow (brand r1's pick; brand r2's take, Aperture recommended, is Will's open ask: draw on production's tokens and say in the About where a take would change a frame). A question about how something looks or moves is drawn, never argued: each option is a real contender, previewed whole on the real surface at 1440 and 375 on the grounds the moment lives on, with its states (and its motion, where the moment moves: `lab:demo` now takes a motion capture per option).

**These calls were made in text on 2026-10-04 and built that way;** each is now asked as a picture, its built answer drawn as one option (production's own), so Will's pick weighs it against real alternatives. Ask each in plain words; shape the asks yourself (`after` stages one behind another where an answer changes the next); merge two that would ask one decision.

**Open asks nearest yours** (ask nothing they ask): brand r2's `take` and its carried calls; event-header r6's `card` and `attention` (the hub's doors and the colour of what needs her). Check the desk with `node usher/kit/board-card.mjs --desk` once booted.

**Verify on.** The light gate (PROGRAM.md, "Speed over proof in exploration"): typecheck, lint, the board's own tests, `pnpm lab:smoke` and `pnpm lab:demo --board <id>` at 1440 and 375, reduced motion honoured. Measure every tile before it ships: a preview shows what its words claim, read on screen.

Model: Opus. Cut by the cloud-seated Orchestrator; you run in a cloud session of your own (the spawn prompt's boot).

**The board's shape.** The board is one folder, `src/app/(dev)/design/sandbox/guest-moments/`, and nothing else names it: the registry finds it, and retiring it is deleting it. `spec.ts` is `defineExploration` (`src/components/lab/exploration.ts`) and pure data: its id `guest-moments`, its title, `surface`, `desk: 45` (by leverage, lower first) and `lives` (the paths it redraws), its `opening` and `terms`, and every ask with its context layer (`where`, `when`, `matters` beside `lands`, each option's `gains` and `costs`, `because` in a line). `board.tsx` exports one component, `ExplorationBoard` with a preview per option (`PreviewsFor`). `registry.test.ts` holds all of it; `pnpm lab:smoke` and `pnpm lab:demo` run on the board your change reaches.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The board at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke --base http://localhost:<port>` (it crawls what your change reaches, the board and the desk; `--all` for the whole lab); `pnpm lab:demo --board <board> --base http://localhost:<port>` pressing every step.

## Questions (a recommended answer each; the Orchestrator relays them)

- The brief's "Settings now says the ceiling: up to 3 shots in all" does not match production: `cameraLine` says "up to
  72 shots in all" on a roll of 24 (`ROLL_RETAKES = 3` rolls' worth, `src/lib/disposable/roll.ts:63`), while
  customize r1's opening records Will's word as a flat 3 re-shoots at any roll. Recommended: ask it as the board's
  `limit` (built: today's three rolls' worth vs his flat 3 vs one roll's worth), recommending his flat 3; a wiring lane
  then changes `create_media`'s `c_roll_retakes` with `roll.ts` (a migration).
- Should `where`'s reel take-back confirm? Recommended and drawn: a two-key sheet (Take it back / Keep it), since a
  press on the reel today opens the list and a mis-press there must not delete; Your shots keeps its no-confirm X.

## System-doc edits (in place, owned facts only)

- none (an exploration ships no production byte)

## Deferred (ROADMAP one-liners, bucket named)

- none

## Handoff (replaces the chat report)

- Work commit `a0e2e342` (the board), pushed on `lp/guest-moments-r1`; no sync commit: launch-prep moved only by
  record commits (`e74f8e07..d88494cd`, status and pickup lines), none in this lane's reads.
- Gates on `a0e2e342`, each its own exit code, the light gate: `pnpm typecheck` 0; `eslint` on the board folder 0
  warnings; `vitest run src/app/(dev)/design/sandbox src/components/lab` 213 passed; `pnpm lab:smoke --base
  http://localhost:3131` 7 checks, 0 failing (522 words of 1200); `pnpm lab:demo --board guest-moments` 5 steps, 0
  failing, at the default phone screen and again with `--state screen=1440` (0 failing; one warning: at 1440
  `opening`'s black and mark held frames compare as the same picture by the threshold, the bar being small at a
  laptop's scale; they differ at 375).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = the nine files under
  `src/app/(dev)/design/sandbox/guest-moments/` + this file. No exceptions.
- The board, desk 45, five asks (each option a moving frame plus its held instants, titled with their time; reduced
  motion holds every loop at its end; every caption read off its frame):
  - `own` (C7): her own photo landing: sweep (today) / glow / first one says "Yours is in" (rec.) / quiet.
  - `batch` (Q3): six of others' photos at the top: push (today) / settle, whole from the first frame (rec.) / file,
    one after another / pill, wait behind "6 new".
  - `limit` (D3): three rolls' worth (today) / a flat 3 (rec., his word) / one roll's worth; Your shots' head counts
    what is left; the roll's end says when they are spent.
  - `where` (D3, after `limit`): Your shots' X (today) / the reel's newest frame opens a Take it back sheet (rec.).
  - `opening` (G6): black (today) / the first photograph at once, Close beside it (rec.) / black with the reel's bar
    and its running line.
- Drawn on production: `AlbumCover`, `HeadStills`, the camera's parts (`CameraReel`, `CameraShutter`,
  `RollDonePanel`, `YourShots`) and their words, `album-rows.ts`'s layout; the arrival lights are `arrival.css`'s
  values and `arrival.ts`'s lives redrawn in `guest-moments.css`; the reel's resting bar is retyped from
  `live-reel-view.tsx` (the view mounts only in its dialog and store). Stand-ins: the marketing stills.
- Assets requested from Will: none.
- Board ideas: the sweep at production's values (a 0.34-white band, 0.9 s) barely reads on a bright photo (measured:
  its held frame differs from quiet's only inside the tile, faintly); worth a light-strength pass whichever `own` wins.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none (a `limit` pick other than today's is a
  `create_media` constant change for its wiring lane).
- Calls his to overrule: the take-back sheet's two keys (Questions); the `first` word "Yours is in" (from
  `arrival.css`'s own name for the sweep); `settle` keeps the glow on others' photos.
- Look at first: `/design/lab/guest-moments?session=guest-moments.batch` (the empty half second, held at 0.15 s), then
  `limit` (production's 72 vs his 3).
