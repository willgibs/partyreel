---
track: demo-r4
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "7a875407"            # the launch-prep SHA the branch was cut from
board: demo-framing
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/demo-framing/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/demo-framing.json
  - src/components/marketing/sections/home/
  - src/lib/demo.ts
  - src/lib/constants/reserved-slugs.ts
  - scripts/seed-demo-event.mjs
  - docs/systems/marketing-content.md
  - src/components/guest/door/welcome.tsx
---

# lp/demo-r4

**Goal.** The home hero's stage, round four: the two directions he saw potential in, each nailed (one premium centre object the stream leaves, and a well-designed mini-event card over a minimal link, streaming out), beside two or three brand-new heroes.

## The brief

**Why.** Will answered `demo-framing` r3 on 2026-10-02 (`docs/reviews/demo-framing.json`): `stage` open, `door=brand`. His notes, verbatim:
- on `stage`: "None of these are perfect, but I think two directions have potential. First, for options 1 and 2, the link and QR don't feel like a beautiful, cohesive item for the photos to stream from. The code rising out doesn't feel very premium, and the code opening on its invite leaves a very bland big card in the center when fully open, doesn't feel polished at all. If we could nail this switching center item, both of these directions could lead to something nice. Second, for option 3, I do like keeping the link more minimal under a more prominent QR that adjusts. However, the QR itself looks pretty bad, and a far more well designed mini-event card that updates off the slug typing would feel much more beautiful. I also don't like the streaming *into* the QR; I get the concept of they get uploaded to it, but the animations feels unnatural compared to the more common 'lightspeed tunnel' the stream out version creates. However, if you have any brand new home hero ideas, I'd also love to see those so we aren't knocking our head against a wall on one idea in a world of infinite."
- on `door=brand`: "With the new door screen being built from this desk's review batch, I'd like to see how the demo feels going through the regular experience first. Then we can open up another exploration to customize the demo door if needed."

**The ask, `stage`:** (a) the centre object nailed: one premium thing (the link and its code as one cohesive object) that switches per typed address, the stream leaving it as a lightspeed tunnel: never a bland card when open, never a code rising cheaply; (b) the link minimal under a well-designed mini-event card that updates with each typed slug, the photographs streaming out; (c) two or three brand-new heroes of your own. Each whole, live at 1440 and 375 and at a tablet (768 to 1023, never drawn yet), reduced motion standing it still; say for each whether a phone's code stays a picture (it draws at 2.6 px a module today, under the 3 px a phone reads off a screen; a phone visitor taps).

**Settled, drawn in every option:** the address `our-party`; the arrow after it and its hover (the object lifts, the arrow nudges); no eyebrow; the typing and the stream taking turns; a credit (face and first name) inside each photograph's corner; the address a size down from round two's stage; the demo's door as today (`door=brand`). The demo's data (`our-party`, the typed addresses reserved) is wired with the hero's pick, so leave `src/lib/demo.ts`, the reserved slugs and the seed as they are.

**The direction, one for every board and wiring this round** (Will's notes, 2026-10-02):
- **Bespoke and experiential**, sleek and modern (never vintage), sophisticated (never playful-messy: "for grids, I'd prefer not to get messy and begin tilting anything"), minimal yet high-information with far less text, and the bible's ten (`/design/library`: media is the color, premium is the floor).
- **Who it is for**, his words with this desk: "Want to ensure we feel bespoke without getting too dev-tool-ish, remaining a modern consumer app usable for anyone at any event (it's okay if grandma and grandad slip through, would rather frame this as cool to a younger expected host/guest crowd, probably 18 [parties] to 50ish [event guests, conference attendees). Don't want to build a boring app just for the least tech-friendly guests. Seems like our core entry -> upload -> view path is pretty clear for anyone."
- **His role**: "I'm just the tastemaker at this point - let's act accordingly, drive your best ideas across our site/app/platform as the world's leading design engineer." Build and draw your boldest real answer; he picks and steers.

**The board's shape.** The board is one folder, `src/app/(dev)/design/sandbox/demo-framing/`, and nothing else names it: the registry finds it, and retiring it is deleting it. `spec.ts` is `defineExploration` (`src/components/lab/exploration.ts`) and pure data: its id `demo-framing`, its title, `surface`, `desk: 90` (by leverage, lower first) and `lives` (the paths it redraws), its `opening` and `terms`, and every ask with its context layer (`where`, `when`, `matters` beside `lands`, each option's `gains` and `costs`, `because` in a line). `board.tsx` exports one component, `ExplorationBoard` with a preview per option (`PreviewsFor`). `registry.test.ts` holds all of it; `pnpm lab:smoke` and `pnpm lab:demo` run on the board your change reaches.

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
