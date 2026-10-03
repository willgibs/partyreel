---
track: demo-framing-r5
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "518956ad"            # the launch-prep SHA the branch was cut from
board: demo-framing
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/demo-framing/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/demo-framing.json
  - src/components/marketing/sections/home/cinema-hero.tsx
  - docs/ASSETS.md
---

# lp/demo-framing-r5

**Goal.** demo-framing round 5: the home's first screen, its stage drawn as a more polished set from r4's five, every settled line kept.

## The brief

**The round's direction (Will, round 13, carried by every lane):** never dev-tool-ish (the viewfinder's corners survive only as a focus mark, never a style, and so does nothing of their loading state); a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline (undated, morning-only and multi-day events all read well); "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control); cost is designed like the architecture (every image and video action multiplies at scale). Production is the working version: a pick is the best of what was drawn, never a rule.

**Will's answer (demo-framing r4, his desk on build 45, 2026-10-03):** stage=? "I'm jokingly mad at you for making this decision so hard. Let's run another round on these so we can pick from an even more polished group of options. I truly cannot wait to see them." r4 drew five: `plate` (one glass pane: the code and its link), `card` (a mini event card over a minimal link; recommended), `field` (the link as a field the visitor types), `wall` (two photo rows filling round the code) and `door` (every link a door to its party).

**Settled, kept in every option:**
- the demo's address is partyreel.com/e/our-party, and every address the hero types is reserved to the demo;
- an arrow after the address, and under a pointer the object lifts and the arrow nudges;
- no eyebrow over the headline;
- the typing and the stream take turns;
- every photograph carries its guest's credit inside its corner;
- the address a size down from round two's;
- the demo's door stays as today.

His round-4 words that still steer it:
- "The link and QR don't feel like a beautiful, cohesive item for the photos to stream from."
- "A far more well designed mini-event card that updates off the slug typing would feel much more beautiful."
- He liked "the lightspeed tunnel the stream out version creates" and not "the streaming into the QR".

**The ask (`stage`):** a more polished group of three or four.
- Each of r4's strongest directions taken further, its weakest parts fixed, and at most one new idea if it earns its place.
- Each drawn live at 1440, a tablet (768 to 1023) and 375, with reduced motion honoured.
- Recommend one, and say what each gives up.
- Its photographs are still asked (ASSETS 39 to 41): draw with the stand-ins and name what a real photograph changes.

**The board's shape.** The board is one folder, `src/app/(dev)/design/sandbox/demo-framing/`, and nothing else names it: the registry finds it, and retiring it is deleting it. `spec.ts` is `defineExploration` (`src/components/lab/exploration.ts`) and pure data: its id `demo-framing`, its title, `surface`, `desk: 90` (by leverage, lower first) and `lives` (the paths it redraws), its `opening` and `terms`, and every ask with its context layer (`where`, `when`, `matters` beside `lands`, each option's `gains` and `costs`, `because` in a line). `board.tsx` exports one component, `ExplorationBoard` with a preview per option (`PreviewsFor`). `registry.test.ts` holds all of it; `pnpm lab:smoke` and `pnpm lab:demo` run on the board your change reaches.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate (CLAUDE.md's four steps, each on its own exit code); `pnpm lab:smoke --base http://localhost:3136`; `pnpm lab:demo --board demo-framing --base http://localhost:3136` at 1440 and with `--width 375`, pressing every step; `registry.test.ts` and `queue.test.ts`.

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

## Where I am

- WIP 1 (pushed): the board restructured for round five. `stage` asks between three heroes, each taken further:
  `card` (recommended; the product's event card, photograph-forward, its name typed on the photograph's foot, its
  light while the next name types, the photograph developing in on landing), `plate` (the pane lit by its party's
  photograph, the code always whole and rewritten in a ripple from its heart, the address one line under it), `door`
  (ajar in the arriving party's light while its address types, open on its cover). The field and the wall are retired
  (`tiles.tsx` deleted; `waveAt`, `TYPED_MAX`, `typedSlugOf` gone). Typecheck, lint and the board's tests green.
- Next: verify the typing states (the card's light, the door ajar) and each hero at the tablet and 375; tune the
  card's height against the header, the pane's light; the close frames; then the gate and the Handoff.
- Captures and the capture harness: `_scratch/demo-framing-r5/` (`tour.mjs <prefix> <opts> <frames> <times>`).
