---
track: demo-framing-r2
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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
