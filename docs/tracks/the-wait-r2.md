---
track: the-wait-r2
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "9af92e54"            # the launch-prep SHA the branch was cut from
board: the-wait
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/the-wait/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/the-wait.json
  - src/components/guest/gallery-empty-state.tsx
  - src/components/guest/event-experience.tsx
  - src/lib/disposable/
  - docs/systems/disposable-mode.md
---

# lp/the-wait-r2

**Goal.** the-wait round 2: the arrival, a develop as a first-load animation that turns into the album (his first choice), with the premiere first and into place as the drawn fallbacks.

## The brief

**The round's direction (Will, round 13, carried by every lane):** never dev-tool-ish (the viewfinder's corners survive only as a focus mark, never a style, and so does nothing of their loading state); a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline (undated, morning-only and multi-day events all read well); "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control); cost is designed like the architecture (every image and video action multiplies at scale). Production is the working version: a pick is the best of what was drawn, never a rule.

**Will's answers (the-wait r1, his desk on build 45, 2026-10-03).** Every pick is now wired by `wait-wiring` (merged): model=time on the guest screens with option 2's Settings design, wait=sheet, cover=guests, name=disposable, both=never. arrival=? in full: "It's hard to judge this isolated. Option 2 feels like the potential best, but ideally more of a 'develop' first load animation that transitions into the album view somehow. If we can't nail that, I'm split between the option 3 premiere first to open with the reel idea clearly (nice call on easy skip button), or option 1 into place where anytime after it has developed, it just opens as an album with a cool animation, likely similar/same as a regular open live album would."

r1's three were `place` (into place, newest first, Premiere on the cover), `develops` (the contact sheet's squares fill with photos in night order) and `premiere` (the reel full screen before the album, with Skip).

**The ask (`arrival`):** draw his first choice properly before the fallbacks: the develop as the album's first load, the waiting contact sheet (as wired) developing into the album itself in one continuous transition, every guest's first open after the develop. Draw two or three takes on it. Draw the premiere first and into place refined beside them as the fallbacks. Each:
- drawn on production as wired, from the waiting state to the album;
- at 375 and 1440;
- with reduced motion as its own pass;
- including what a guest sees who opens it a day later (the second open is plain).

Recommend one. Retire r1's answered asks into the board's settled lines.

**The board's shape.** The board is one folder, `src/app/(dev)/design/sandbox/the-wait/`, and nothing else names it: the registry finds it, and retiring it is deleting it. `spec.ts` is `defineExploration` (`src/components/lab/exploration.ts`) and pure data: its id `the-wait`, its title, `surface`, `desk: 35` (by leverage, lower first) and `lives` (the paths it redraws), its `opening` and `terms`, and every ask with its context layer (`where`, `when`, `matters` beside `lands`, each option's `gains` and `costs`, `because` in a line). `board.tsx` exports one component, `ExplorationBoard` with a preview per option (`PreviewsFor`). `registry.test.ts` holds all of it; `pnpm lab:smoke` and `pnpm lab:demo` run on the board your change reaches.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate (CLAUDE.md's four steps, each on its own exit code); `pnpm lab:smoke --base http://localhost:3133`; `pnpm lab:demo --board the-wait --base http://localhost:3133` at 1440 and with `--width 375`, pressing every step; `registry.test.ts` and `queue.test.ts`.

## Questions (a recommended answer each; the Orchestrator relays them)

The board's one ask is `arrival`, five options: three takes on his develop (`in-place`, it develops where it stood;
`darkroom`, the whole roll full screen first; `light`, the album rises out of the sheet's light, as Maya's Look lifts
her cover) and the two fallbacks refined (`premiere`, `place`). Recommended: `in-place`. The calls below are drawn as
answered (the board's `carried`), each his to overrule:

- **When does the develop play?** Built: on each guest's first open after the develop time, on that device (a mark
  this browser keeps, keyed by the album and its develop time: no server write, no account), however late that open
  is; live and in place for a guest on the page as the time comes; every later open is the album's regular open.
  Overrule: once per guest across her devices (a mark on her ticket), or only within a day of the develop.
- **Can she stop it?** Built: any press, scroll or key ends it on its last frame at once, so the album is never held
  behind it; in place there is nothing to find, and the full-screen takes carry a Skip ("The album"). Overrule: it
  always plays through.
- **What does it load?** Built: its order and shapes come from the album's own first read (the manifest); the squares
  that fill with photographs load those photos' small previews, at most the sheet's cap (the album's newest 93 at a
  phone, 177 at a desk, which the album would load as she scrolls); `light` and `place` load nothing early. A tiny
  rendition made at upload would make the photo takes cost a few hundred KB: a board idea below, not built. Overrule:
  only the first screen's squares fill with photographs, the rest with light.
- **Does Maya's hub develop too?** Built (as a call, drawn with the wiring): her cover is the guests' sheet
  (`cover=guests`), so her first open after the develop develops it the same way. Overrule: her hub simply shows the
  album.
- **Does a Reviewed album's batch develop?** Built: no, Maya's approvals arrive as production's arrivals (the push and
  the glow) as she lets each in; the develop is a roll's. Overrule: a batch she lets in develops on the sheet the same
  way.

## System-doc edits (in place, owned facts only)

- none: an exploration ships no production byte (`disposable-mode.md` keeps "build the reveal (the-wait r2)" for the
  wiring of his pick)

## Deferred (ROADMAP one-liners, bucket named)

- none

## Handoff (replaces the chat report)

- **Commits**, pushed on `lp/the-wait-r2`: the work `793c54f9` (the plan), `502a9738` (round two drawn), `18963411`
  (the sheet first, then the prints; the Skips placed; held frames), `e5b832f9` (the darkroom's sheet before its dark,
  the luminous wash, reduced motion fade-only); the syncs `31d57713` (launch-prep at `9aa2928c`: event-header-r3,
  host-dashboard-r3 and records) and `adf082c1` (launch-prep at `14a0caa7`: door-settles' own clock), no conflicts,
  nothing in the-wait's reads moved. This manifest's commit is the head.
- **Gates on `adf082c1`**, the synced tree, each on its own exit code (logs: `_scratch/the-wait-r2/gate-*.log`):
  through `zsh scripts/build-lock.sh`, `pnpm typecheck` 0, `pnpm lint` 0 (no warnings), `pnpm test` 0 (846 files,
  9,984 tests), `pnpm build` 0; then `pnpm lab:smoke --base http://localhost:3133` 0 (16 checks; the board 755 of
  1,200 words) and `pnpm lab:demo --board the-wait --base http://localhost:3133` 0 at 1440, at `--width 375` and
  wearing `--state screen=1440` (1 step, 5 options of 4 frames, the stage moving by up to 96 to 99%, starting 0.30
  down at 1440 and 0.38 at 375, 18 px clear of the dock).
- **Lane check**: `git diff --name-only origin/launch-prep...HEAD` = `src/app/(dev)/design/sandbox/the-wait/` (19
  paths, 8 of them round one's drawings deleted: `arrival`, `guest`, `host`, `model`, `settings`, `wait`, `words`)
  and this file; no exceptions.
- **The items**:
  - `spec.ts`: round 2, one ask (`arrival`, five options, `in-place` recommended); round one's five answered asks
    retired into `opening.settled`, his arrival note in `opening.earlier`, round one in `history`, eight terms, the
    five calls above as `carried`.
  - `board.tsx`: each option is four frames at the Screen knob's size (375 by 812 or 1440 by 900): her first open
    after 9 am playing, the same held at its turn, reduced motion as its own pass, Monday's second open (plain);
    every caption read off the frame (`frameSays`: the squares, the folded, hers, what has come up, the album's words,
    the cover's word).
  - `album.tsx`: production's page the morning after: the real `AlbumCover` with `coverEyebrow`'s words ("Disposable
    · developed at 9 am", then "developed Sunday") and the real `HeadStills`; the album's head row and tiles quoted.
  - `geometry.ts`: the sheet by production's `layoutSheet`, `columnsFor` and `sheetCapFor` (93 squares and +121 folded
    at a phone, 177 and +37 at a desk), the rows by `layoutRows`, `perRowFor` and `pickFeatures`, both over one night
    (`fixtures.ts`'s `ROLL`: 214 shots from 14 guests, Priya's nine), so a square and its tile are one photograph.
  - `develop.tsx`: the three develops; a growing tile starts on its square, measured where the square is drawn, and
    grows by its box with its picture covering it, so the square's crop opens into the tile's without a jump.
  - `premiere.tsx`: the reel's chrome as `live-reel-view.tsx` draws it (its 132 by 34 bar, no event name), the beat,
    The album, the drop into the newest tile; reduced, it waits paused with its dock up. `place.tsx`: production's
    regular open, its numbers mirrored as keyframes: every option's second open.
  - `motion.tsx` and `the-wait.css`: one clock (`--tw-d` less `--tw-at`), so one drawing plays live, holds at a moment
    or runs its reduced pass; a hidden option draws nothing until shown and stands still while hidden; every keyframe
    `tw-`.
  - For the wiring, whichever he picks: the album stands complete under the develop (bible 5: a crawler, a throttled
    tab, reduced motion and a scroll all get the album at once), the first open's mark is the device's, the sheet is
    re-laid from the developed rows' minutes and hers, and the develop waits for the first screen's pictures to move.
- **Assets requested from Will**: none (the twelve marketing stills and the ghost pack's nine stand in; the Higgsfield
  month's party sets swap by id).
- **Board ideas**:
  - A tiny rendition (a 64 px WebP made at upload beside the 640 preview) would let any sheet of squares draw
    photographs for a few hundred KB: the wait's, the develop's, the host's cover, a filmstrip.
  - The develop mail (ROADMAP's launch line) lands on the first open: its link could open the develop on any device,
    whatever this device's mark says.
- **Proposed migrations / Worker / Vercel / Stripe / env changes**: none.
- **Calls his to overrule**:
  - The recommendation, `in-place`: the darkroom for a ceremony, out of the light to load nothing early.
  - When: each device's first open after the develop, however late; live in place at 9 am; every later open plain.
  - Stop: any press, scroll or key ends it on its last frame; the full-screen takes carry The album.
  - Load: the sheet's squares load their small previews, at most 93 at a phone and 177 at a desk.
  - Hub: Maya's hub develops the same way (her cover is the guests' sheet), drawn with the wiring.
  - Batch: a Reviewed album's approvals arrive as production's arrivals; only a roll develops.
- **Look at first**: `/design/lab/the-wait?session=the-wait.arrival`, option 1's first frame (her first open,
  playing) at 375, then the Screen knob's 1440; then the darkroom's held frame (the whole roll developing full
  screen).

## Where I am

- Handed off: the Handoff above is the state; nothing is in flight.
