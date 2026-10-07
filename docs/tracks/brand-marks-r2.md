---
track: brand-marks-r2
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "c04da309"            # the launch-prep SHA the branch was cut from
board: brand-marks
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/brand-marks/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/brand-marks.json
  - docs/systems/design-system.md
  - src/app/icon.svg
  - kit/logo/partyreel-mark-dark.svg
---

# lp/brand-marks-r2

**Goal.** Board brand-marks r2: the icon made bespoke on the ember Ring Will picked, which ships meanwhile as the working version.

## The brief

**The round's direction (Will, standing):** world-class tastemakers, never "a junior designer told to build a rainbow app"; light, never paint, and restraint is the brand; delight where it costs nothing in clarity; attention earned, never yelled (the one thing that needs her may draw the eye, beautiful and inviting, nothing crowds a screen, words in compact groups with room around them); simple on top, deep underneath (each visible piece the door to the features behind it); one product on both sides (host and guest one interface where they can); nothing depends on a timeline (no date reshapes an album by itself); immediate, or a clear state and a way out; never dev-tool-ish; production the working version. PRD.md's "Will's product principles" hold each with its reason.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app, and nothing deploys. Port 3137 is yours; 3000 is Will's desk, 3130 the Orchestrator's gate. A signed-in look runs on your own port in a headless Chrome of your own through `usher/kit/redteam/signin.mjs` (testing-verification.md), never Will's browser pane or his Chrome; never kill a process by its name, by port or pid only.

**A parts board, and why:** the icon stands alone (nothing on a page composes with it), so one focused ask serves it best.

**From his round one (`docs/reviews/brand-marks.json`):** `icon=ember`, the puck in its ring key-lit from the top-left by the house ember, with his note: "I'd be curious to explore additional designs on top of this, such as filling the ring with more design to feel more bespoke to our brand rather than identifying with a circle alone. However, we can carry this as the working version." brand-marks-wiring ships the ember Ring everywhere an icon lives this wave. His wordmark note is the family's philosophy: bold, one group that carries its weight at a small size, never thin or spread out. The carried calls stand: the icon is the house's (never an event's light), the word stands alone in the bars and the foot.

**The ask:** which Ring signs Partyreel on a home screen, among tabs and in a launcher's mask, each option a bespoke take on the ember Ring that is more of the brand than a circle (what the ring holds, what it is made of), pushed apart; today's ember Ring the reference. Each read at 16, 32, 180 and 1024 pixels, on a home screen by day and at night, in a round mask, and beside the wordmark where a press kit would set them.

**Desk:** this round keeps the board's `desk: 6`.

**The method:** a helper per option holding the whole brief, a creative director's fresh-eyes pass, one refinement on everything it names; asset gaps as Higgsfield asks in the Handoff (docs/ASSETS.md's form), the stand-in shipped meanwhile. A board's light gate (PROGRAM's "Speed over proof in exploration").

**The board's shape.** The board is one folder, `src/app/(dev)/design/sandbox/brand-marks/`, and nothing else names it: the registry finds it, and retiring it is deleting it. `spec.ts` is `defineExploration` (`src/components/lab/exploration.ts`) and pure data: its id `brand-marks`, its title, `surface`, the `desk` place this brief names (by leverage, lower first) and `lives` (the paths it redraws), its `opening` and `terms`, and every ask with its context layer (`where`, `when`, `matters` beside `lands`, each option's `gains` and `costs`, `because` in a line). `board.tsx` exports one component, `ExplorationBoard` with a preview per option (`PreviewsFor`). `registry.test.ts` holds all of it; `pnpm lab:smoke` and `pnpm lab:demo` run on the board your change reaches.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The board at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke --base http://localhost:<port>` (it crawls what your change reaches, the board and the desk; `--all` for the whole lab); `pnpm lab:demo --board <board> --base http://localhost:<port>` pressing every step.

## Questions (a recommended answer each; the Orchestrator relays them)

- **Which three takes?** Built: what the ring holds (a mirror ball: the party; a reel: the name) and what it is made of (one swing of a sparkler: the moment). Weighed and not drawn: a P on the puck (a P in a warm round mark sits beside Pinterest's), an iris (the retired stand-in's own glyph), rings of bokeh or confetti (a ring of dots reads as a loading spinner). Overrule: name a direction for round three.
- **The sparkler leaves the ring empty, against "filling the ring".** The creative director called it no contender for that; kept as the one answer on the brief's "what it is made of" axis, redrawn as a swing that crosses its own start so no size is today's ring. Overrule: drop it.
- **The recommendation:** the reel (the creative director concurs): it fills the ring with the name and alone holds as one bold group from a 16 tab to a poster. The pass's test for overruling it: if most of five outsiders, given five seconds, say video, film or Instagram before photos or a party, stay on today's Ring.
- **Today's reference is production's own Ring** (`src/lib/brand/ring.ts`, `icon/today.tsx`), never the board's copy, so it can never drift from what ships.

## System-doc edits (in place, owned facts only)

- none: a board ships no production byte, and no system fact moved.

## Deferred (ROADMAP one-liners, each naming its bucket and area)

- Upcoming, Design system and accessibility: Brand: the picked icon's tinted, dark and clear phone looks (iOS's tinted and dark, its clear glass), drawn from its own light when brand-marks r2's pick is wired (brand-marks-r2).

## Handoff (replaces the chat report)

- **Commits, pushed on `lp/brand-marks-r2`:** `d60eaf64a` (round two's frame: one ask, four takes as drafts), `f503cd376` (the takes drawn by a helper each and refined from the creative director's pass; the frames made honest), sync `12dd4b7ef` (merge `origin/launch-prep` at `9c426f75f`: brand-marks-wiring and crumbs-91; round one's `palette/grades.test.ts` and `palette/menu.tsx`, which both lanes touched, kept deleted), `40a888e19` (today's Ring read from production; the words rewritten against the final pictures). launch-prep has since moved to `a53466652` (crumbs-92, no-signal-wiring, records): none of it touches my reads and `git merge-tree` merges clean, so no second sync (PROGRAM's sync rule).
- **Gates on `40a888e19`, each on its own exit code** (logs in `/Users/gibby/local/ai/partyreel-wt/_scratch/brand-marks-r2/final-*.log`): `pnpm typecheck` 0; `pnpm lint` 0; `pnpm test:rules` 0 (86 files, 1,483 tests; the board's spec held by `registry.test.ts`, its own tests retired with round one's asks); `pnpm lab:smoke --base http://localhost:3137` 0 (3 checks, 577 words of 1,200); `pnpm lab:demo --board brand-marks --base http://localhost:3137` 0 (4 options of 5 frames, the stage moves up to 35.05%; 1440 starts 0.30 down, 220px to the dock; 375 starts 0.38 down, 18px to the dock); the same with `--state screen=375` 0. The light gate (PROGRAM's "Speed over proof in exploration").
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` = paths under `src/app/(dev)/design/sandbox/brand-marks/` + this file; no exceptions. Nothing outside the board imports its folder (`git grep sandbox/brand-marks origin/launch-prep -- src scripts usher kit` is empty).
- **Items:**
  - Round two asks one question, `icon`: today's Ring (`ember`, `today`), a mirror ball, a sparkler's swing and a reel (recommended), each read at 1024 true size, 180, 32 and 16 (16 at 1x and sharp, enlarged pixel for pixel) in the room and on paper with a dark and a light tab, on a home screen at night and by day, in a launcher cut at the maskable safe zone, beside production's wordmark as the press kit sets them, and in one colour over footage (`icon/story.tsx`).
  - Round one's answered asks (wordmark, plate, status) leave the board with their drawings and tests, as do its losing icon options; their picks stand in the opening as settled.
  - Each take is one file (`icon/takes/<id>.tsx`, the `Take` contract in `icon/parts.tsx`); today's draws `ringMarkup` itself (`icon/today.tsx`) on production's tile and corner; the ember's stops come from `src/lib/brand/ring.ts`.
  - The method: a helper per take, a creative director's fresh-eyes pass, one refinement landing every note (the ball's lit facets one crescent at the key, never a dotted spinner; the sparkler's loop a crossing swing, never today's ring; the reel's windows one light, never a palette; round tiles tried as photo windows and dropped as a flower).
  - The pass also corrected the frames: tabs at 1x beside sharp ones, the launcher at its harshest crop with no mirror ball on its wall, the day icon on its bright ground, every one-colour mark measured to one box.
- **Assets requested from Will:** none.
- **Board ideas:**
  - The album's Shutter wearing the picked icon's interior (the reel's windows, the ball's crescent) on its face, so the Add and the icon stay one object, as the Ring began.
  - Production's one-colour Ring (the ring and a solid puck, `ringMonoSvg`) reads as a record button at a watermark's 34px over footage (this board's press frame); should today's Ring stay, its mono could be the ring alone.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none.
- **Calls for Will:** none.
- **Look at first:** `/design/lab/brand-marks?session=brand-marks.icon` at 1440: the reel shown whole on the first screen; 1 to 4 blink between the takes, and `f` (1:1) reads each 1024 master and its 16 at 1x.
