---
track: host-moments-r1
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "462cea3f"            # the launch-prep SHA the branch was cut from
board: host-moments
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/host-moments/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/host-app.md
  - docs/systems/disposable-mode.md
  - docs/systems/billing-caps.md
---

# lp/host-moments-r1

**Goal.** A new board, host-moments (desk 40): four moments in a host's run of her party, each made in text and built, now drawn as real contenders for Will's pick: adding a password to an album guests are already in (B1), a develop time added mid-party (Q6), declining or blocking someone at the door (B2), and being over her plan with a goal (L3). No production byte.

## The brief

**The round's direction (Will, standing since round 13):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; delight where it costs nothing in clarity; nothing depends on a timeline; immediate, or a clear state and a way to stop it; no AI managing it; cost designed like the architecture; production is the working version, a pick the best of what was drawn, never a rule.

**The moments (the calls lab's round-15 lines, as built today):**
- **B1, adding a password:** guests already in stay in on every device; anyone still waiting at the door meets the password like anyone new; she is warned first (Settings' door page, `components/app/event-settings/door-page.tsx`, and the warning before the save).
- **Q6, a develop time added mid-party:** every guest's roll refills (the Advisor thought a host would not expect it); what she is told before she saves, and what her guests see.
- **B2, declining and blocking:** the shut door with no second ask; Let back in tells her the outcome (the hub's Guests room, `components/app/event-feed/`).
- **L3, over her plan with a goal:** the banner opens the size list ("5.3 GB left to free to fit your plan"): what the banner says, where it leads, and how the goal reads as she frees space (`components/app/storage/`).

**Drawn on production as it is now:** identity r5's house set is production's atoms since `94534554` (fields sunk as wells, keys flat, the chosen afloat, working keys that say what they do), so compose production's own components and their states, never redraw an atom; the brand is Afterglow (brand r1's pick; brand r2's take, Aperture recommended, is Will's open ask: draw on production's tokens and say in the About where a take would change a frame). A question about how something looks or moves is drawn, never argued: each option is a real contender, previewed whole on the real surface at 1440 and 375 on the grounds the moment lives on, with its states (and its motion, where the moment moves: `lab:demo` now takes a motion capture per option).

**These calls were made in text on 2026-10-04 and built that way;** each is now asked as a picture, its built answer drawn as one option (production's own), so Will's pick weighs it against real alternatives. Ask each in plain words; shape the asks yourself (`after` stages one behind another where an answer changes the next); merge two that would ask one decision.

**Open asks nearest yours** (ask nothing they ask): brand r2's `take` and its carried calls; event-header r6's `card` and `attention` (the hub's doors and the colour of what needs her). Check the desk with `node usher/kit/board-card.mjs --desk` once booted.

**Verify on.** The light gate (PROGRAM.md, "Speed over proof in exploration"): typecheck, lint, the board's own tests, `pnpm lab:smoke` and `pnpm lab:demo --board <id>` at 1440 and 375, reduced motion honoured. Measure every tile before it ships: a preview shows what its words claim, read on screen.

Model: Opus. Cut by the cloud-seated Orchestrator; you run in a cloud session of your own (the spawn prompt's boot).

**The board's shape.** The board is one folder, `src/app/(dev)/design/sandbox/host-moments/`, and nothing else names it: the registry finds it, and retiring it is deleting it. `spec.ts` is `defineExploration` (`src/components/lab/exploration.ts`) and pure data: its id `host-moments`, its title, `surface`, `desk: 40` (by leverage, lower first) and `lives` (the paths it redraws), its `opening` and `terms`, and every ask with its context layer (`where`, `when`, `matters` beside `lands`, each option's `gains` and `costs`, `because` in a line). `board.tsx` exports one component, `ExplorationBoard` with a preview per option (`PreviewsFor`). `registry.test.ts` holds all of it; `pnpm lab:smoke` and `pnpm lab:demo` run on the board your change reaches.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The board at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke --base http://localhost:<port>` (it crawls what your change reaches, the board and the desk; `--all` for the whole lab); `pnpm lab:demo --board <board> --base http://localhost:<port>` pressing every step.

## Questions (a recommended answer each; the Orchestrator relays them)

- Two candidates need a database change if Will picks them (each ask says so in its costs): `tell=choose` (a guest's roll
  carries on through a develop time added mid-party: `create_media`'s roll would stop counting from `sealed_from`) and
  `let-back=straight` (lifting a decline lets the newcomer in: `let_back_in` would admit a waiting ask). Recommended:
  `straight` yes (the outcome the words promise), `choose` no (`line`, fresh rolls said first). Their wiring lane writes
  the migration.

## System-doc edits (in place, owned facts only)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- Lab: a `Graft`/`Press`/`Reveal` trio (draw a candidate's one piece into production's own page; press a production
  control until it took) lives in this board's `scene.tsx`; worth lifting into the kit if a second board wants it.

## Handoff (replaces the chat report)

- Work commit `b5a06e25` (the board, one folder), pushed. No sync: launch-prep moved only by a record commit
  (`699757a8`), and none of my `reads` changed since the cut (`git diff 462cea3f origin/launch-prep -- <reads>` empty).
- Light gate on `b5a06e25`, each on its own exit code: `pnpm typecheck` 0; `pnpm eslint <board folder>` 0 (no warnings);
  `vitest run sandbox/registry.test.ts src/components/lab` 18 files, 199 tests passed; `pnpm lab:smoke --base
  http://localhost:3131` 9 checks, 0 failing (board 562 words of 1200); `pnpm lab:demo --board host-moments` 7 steps,
  0 failing, and again with `--state screen=375`, 7 steps, 0 failing (every option renders, fits and differs).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = `src/app/(dev)/design/sandbox/host-moments/*` (11
  files) + this file. No exceptions.
- The items: seven asks, three options each, production's built answer drawn as `today` on every one but `decline`
  (where today IS the recommendation, `block`):
  - `password` (B1): today's waiting line + inside note / both groups said at the field (rec) / each group pictured.
  - `tell` (Q6): today saves silently / a consequence line, then save (rec) / fresh rolls or carry on.
  - `fresh-roll` (Q6, guests, `after: tell`, phone tiles): today the count jumps / one line under the shutter / a
    "A fresh roll" panel over the picture in the roll-done panel's shape (rec).
  - `decline` (B2): Decline is a block (today, rec) / a no for now (he can ask once more) / she chooses Not now or Block.
  - `let-back` (B2, `after: decline`): today's confirm says it / each row says where they land / Let back in lets a
    declined newcomer straight in (rec).
  - `banner` (L3): today's sentence with two links / the number and one key, Free 5.3 GB (rec) / what the deadline
    would take, named, the list opening with the sweep's 3 videos picked.
  - `goal` (L3): today's countdown strip / her plan's line drawn on what she stores (rec) / what the deadline would take.
- How it is drawn: every frame is production's own component over inert writes (`DoorPage` under `SettingsProvider`,
  `AddsPage`, `AtTheDoor`, `BlockedSection` with its real Let back in confirm pressed open, `GuestList`, `ShutDoor`,
  `HomeHead` + `StorageMeter` + `GraceBanner`, the real `StorageList` over an inert `StorageSourceProvider`, the camera
  sheet's own `CameraReel`/`CameraShutter`/words); a candidate hides production's one piece by CSS in its own frame
  and grafts its own in that place (`scene.tsx`). Toasts are quoted (sonner's store is page-global). Captions are read
  off each frame (`data-hm-read`).
- Assets requested from Will: none.
- Board ideas: the Guests room's At the door line "Decline blocks them" would need its words to follow whatever
  `decline` picks; and Blocked's address column truncates a short address to "r." at 1440 in the room panel (production,
  `blocked-section.tsx`'s `truncate` beside the since-line), a small fix for a crumbs lane.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none for the board; two picks would need one (Questions).
- Calls his to overrule: the recommendations above (`both`, `line`, `panel`, `block`, `straight`, `number`, `line`).
- Look at first: `let-back` (the one where today's outcome, back at the door, is not what the act's name promises),
  then `tell` + `fresh-roll` together.
- Test data left behind: none (nothing here writes; no live account touched).
