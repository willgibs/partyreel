---
track: demo-framing-r2
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "09c1b56f"            # the launch-prep SHA the branch was cut from
board: demo-framing
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/demo-framing/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/demo-framing.json
  - docs/systems/marketing-content.md
  - src/lib/demo.ts
---

# lp/demo-framing-r2

**Goal.** Round two of the demo's framing: the demo's slug in the host's voice or a typewriter of slugs, how the typewriter and the stream share the home hero (or the stream moves to the QR page), and the subtle touch that makes the hero feel clickable in place of its eyebrow.

## The brief

**His r1 answers** (`docs/reviews/demo-framing.json`, 2026-09-29) open this board's round two (you own its folder; the board keeps its id):
- `story`: no pick, a direction. The whole media kit is replaced before launch, so which pictures does not matter; what matters is the best slug for the idea, in the host's voice (like `our-wedding` or `my-party`), which lets the demo's album hold good content for a host of any kind of event. Or a typewriter on the slug that now and then types another, to show a host can make it theirs. He wants that explored, with variants that either make the stream and the typewriter work together (both at full force is too much: the eye goes everywhere) or let the typewriter take the stage with subtler motion around it, the centred QR and its stream moving to the QR code page's hero.
- `demo=one`, with a note: drop the "Try our demo event" eyebrow and give the hero's visual a subtle touch that makes it feel clickable; a couple of explorations of the best way.
- `names`, still open behind `story`: reshape it for the slug in the host's voice, or retire it if the slug answers it (an open ask whose road no longer beats the current path goes).

**Settled by the same notes** (state them in the board's opening): the demo's album spans every kind of party, so any host sees their event in it; every slug the demo prints is reserved to it (the brand family refuses it to anyone else, as `partyreel-demo` is since `crumbs-11`), so a printed address always opens the demo.

**The round:** draw every option on the real surface, the home hero at 1440 and at 375 (and the QR code page's hero wherever an option moves the stream there), from production's components fed fixtures. The typewriter obeys marketing's motion rule (`docs/systems/marketing-content.md`: calm and fluid, never still long enough to miss a step), and reduced motion gets one still slug. One decision per ask, each with its context layer; the recommendation says why in a line. The demo event itself (its slug claimed, `lib/demo.ts`, the seed) is built after his picks, not in this round.

**The board's shape.** The board is one folder, `src/app/(dev)/design/sandbox/demo-framing/`, and nothing else names it: the registry finds it, and retiring it is deleting it. `spec.ts` is `defineExploration` (`src/components/lab/exploration.ts`) and pure data: its id `demo-framing`, its title, `surface`, the `desk` place this brief names (by leverage, lower first) and `lives` (the paths it redraws), its `opening` and `terms`, and every ask with its context layer (`where`, `when`, `matters` beside `lands`, each option's `gains` and `costs`, `because` in a line). `board.tsx` exports one component, `ExplorationBoard` with a preview per option (`PreviewsFor`). `registry.test.ts` holds all of it; `pnpm lab:smoke` and `pnpm lab:demo` run on the board your change reaches.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The board at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke --base http://localhost:<port>` (it crawls what your change reaches, the board and the desk; `--all` for the whole lab); `pnpm lab:demo --board <board> --base http://localhost:<port>` pressing every step.

## Questions (a recommended answer each; the Orchestrator relays them)

- **The round's shape.** Recommended, and built: three asks. `slug` (which address in a host's own words, drawn
  still, as reduced motion and the demo's real address both are), `stage` (how the address and the stream share the
  first screen: still as today, taking turns, the stream pouring the party typed, or the address taking the stage with
  the stream moved to `/features/qr`), and `touch` (the clickable touch). Still-or-typewriter and the typewriter's
  variants are one decision, because he compares the still hero with each variant side by side and a variant cannot
  be drawn without its stage. Overrule: a still-or-typewriter ask with the variants staged behind it.
- **`names` retires into `slug`.** Recommended, and built: the album is titled in the address's own words (`our-party`
  is "Our party"), so the card, the album's head and the welcome say one name, and every `slug` option is drawn at the
  album's head and in the welcome. A carried call on the board. Overrule: a name of its own at the album's head.
- **The typed addresses.** Recommended, and built: round one's five parties in a host's words, `our-wedding`,
  `my-30th`, `lake-weekend`, `our-reunion`, `team-party`, then back to the demo's own; each reserved to the demo (the
  settled line). A carried call. Overrule: fewer, or others (one list).
- **The card's four prints at rest.** Recommended, and built: four kinds of party from the one album (a wedding's exit,
  a 30th's balloons, a lake-house fire, a team's toast filmed), so the card says "any party" before a word is read. A
  carried call. Overrule: four from one party.
- **The demo's host.** Round one's call carried: a persona on a demo account of its own (Sam Okafor), never Will's.
- **The block without its eyebrow.** Recommended, and built: re-solved as production solves it, `GEO.blockH` less the
  eyebrow's measured line (28 px from the tablet up, 36 at a phone), so the headline takes the block's first line and
  the card and the axis stay (the axis moves 4 px at 1440 by 900). A carried call. Overrule: re-balance the air.
- **The QR code page, if the stream moves there.** Recommended, and built: the home's composition moved whole (the
  card and its stream centred, the page's own words at the measured clear line, the card's lamp standing for the
  plate's). A carried call. Overrule: the page's own lit plate as the object the stream pours from.
- **Stand-ins.** The band's twelve stills stand in for every photograph (his note: the kit is replaced before launch).
- **Desk place** stays 90; the title stays "The demo's story".

## System-doc edits (in place, owned facts only)

- none (an exploration ships no production byte; `marketing-content.md` changes with the wiring of his picks)

## Deferred (ROADMAP one-liners, bucket named)

- none

## Handoff (replaces the chat report)

- **Commits, pushed:** the work `5f5a1d52` (the board, round two); the sync `e2c8bf79` (merged `origin/launch-prep` at
  `85a2935f`: `marketing-content.md`, a read, moved with album-motion-wiring's line, and unfence reshaped the registry
  test and the kit that gate the board; a clean merge). The head is the manifest commit in the chat line.
- **Gates on `e2c8bf79`**, each its own exit code: `pnpm typecheck` 0, `pnpm lint` 0, `pnpm test` 0 (616 files, 7233
  tests), `zsh scripts/build-lock.sh pnpm build` 0, `pnpm lab:smoke --base http://localhost:3133` 0 (19 checks; the
  board reads 1048 words of 1200), `pnpm lab:demo --board demo-framing --base http://localhost:3133` 0 (3 of 3 steps:
  `slug` 3.5 screens, `stage` 4.3, `touch` 3.6). Before the sync, one full `pnpm test` failed once in
  `src/components/guest/password-gate.test.tsx` (the stalled hold's Retry), outside the lane: it passed alone 3 of 3
  and on the full re-run.
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` = the 12 files under
  `src/app/(dev)/design/sandbox/demo-framing/` + this file; no exceptions.
- **The items** (`sandbox/demo-framing/spec.ts`, round 2; `names` retired into `slug`, `story` and `demo` answered):
  - `slug`: four addresses in a host's words (`our-party` recommended, `my-party`, `our-big-night`, `our-wedding`), each
    drawn still at 1440 and 375, at the album's head and in its welcome ("You're a guest at Our party"); every caption
    measures the address in its column (at 375 the longest, `our-big-night`, sets 89 px of 99).
  - `stage`: still as today; `turns` (recommended: the stream eases to 10% of its pace while the address types, full
    for 46% of a 33.5 s loop); `together` (the stream at 62%, the card's prints and the photographs born after a
    landing turn to the party typed); `centre` (the address large on the card's paper, the party's prints dealt round
    it, and the card and its stream on `/features/qr`'s hero under "One scan and they're in."). A loop score under
    each is drawn from `typing.ts`, the one table the frames run (`typing.test.ts`, 9 tests).
  - `touch`: the lift under a pointer; an arrow after the address (recommended); the live dot before the address; the
    lamp swelling every 6.5 s. Each is drawn close at a desk's size, at rest and lifted (6 px, the fan opening), then
    the home at 375 (no pointer) and at 1440 (hover the card to lift it); drawn on the address plate once `centre` is
    picked.
  - Verified in headless Chrome against :3133 (`_scratch/demo-framing-r2/shoot.mjs`): reduced motion holds every frame
    on the demo's own address, no caret, the band at its rest state, over 9 s; hidden options hold still; motion
    allowed types our-party, our-wedding, my-30th on the shown option; pressing every option of every step logs no
    console error or warning.
- **Assets requested from Will:** none now. After his picks:
  - the card's four at rest, four kinds of party (a wedding's exit, a 30th's balloons, a lake-house fire, a team's
    toast filmed) · ASSETS row 33's spec (4:5 masters at 960x1200, one grade) · replaces `DEMO_PRINTS`' stand-ins,
    and row 5's folder becomes the every-kind-of-party album titled in the picked address's words;
  - if `together` or `centre`: four prints and four guest portraits per typed address (twenty of each) · rows 33 and
    34's specs · replaces `HOSTS[].prints`' stand-ins (`fixtures.ts`);
  - if `together`: five stream squares per typed address (twenty-five) · row 2's spec · replaces `HOSTS[].pours`.
- **Board ideas:**
  - `/features/qr`'s hero could take the card and its stream whatever the home picks: "One scan and they're in." over
    the album pouring out of the code is drawn on `stage=centre`'s second screen and stands on its own.
  - A loop's score (a timeline read off the engine the frames run) as a kit piece for motion boards: `score.tsx` here
    is one; a motion option is otherwise judged only by watching it.
  - At `pnpm lab:demo --width 375` every open step with the context layer starts its stage past the reach limit (this
    board 0.98 to 1.20 of a screen, `locked-door` 0.98 to 1.33): the step could fold its context at a phone's width.
  - `password-gate.test.tsx`'s stalled-hold test flaked once under the full suite's load: a timing budget to widen.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none (after his picks, the wiring reserves the
  printed addresses in `reserved-slugs.ts` and re-seeds the demo; no new env).
- **Calls his to overrule** (each carried on the board): three asks, still-or-typewriter and its variants one
  decision; `names` retired, the album titled in the address's words; the typed list (round one's five parties); the
  card's four at rest four kinds of party; the host a persona, Sam Okafor; the block re-solved without the eyebrow's
  line; the QR code page taking the home's composition whole if the stream moves.
- **Look at first:** the `stage` step with motion allowed, `turns` then `centre` (its second screen is the QR code
  page); then `touch`'s close-up of the arrow.
