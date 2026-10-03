---
track: the-wait-r2
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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
  rendition made at upload would make the photo takes cost a few hundred KB: a Proposed line, not built. Overrule:
  only the first screen's squares fill with photographs, the rest with light.
- **Does Maya's hub develop too?** Built (as a call, drawn with the wiring): her cover is the guests' sheet
  (`cover=guests`), so her first open after the develop develops it the same way. Overrule: her hub simply shows the
  album.
- **Does a Reviewed album's batch develop?** Built: no, Maya's approvals arrive as production's arrivals (the push and
  the glow) as she lets each in; the develop is a roll's. Overrule: a batch she lets in develops on the sheet the same
  way.

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

## Where I am

- First pass drawn and committed: `spec.ts` (round 2, one ask, five options, r1's picks settled), `board.tsx`, the
  drawings (`album.tsx` the page, `develop.tsx` the three develops, `premiere.tsx`, `place.tsx`, `motion.tsx` the
  clock, `geometry.ts` production's sheet and rows arithmetic). Typecheck, lint and the registry tests green on it.
  Next: refine each take at 375 and 1440 from captures (`_scratch/the-wait-r2/cap.mjs`), then the gate and handoff.
