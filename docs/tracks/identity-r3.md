---
track: identity-r3
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "5dc4dee8"            # the launch-prep SHA the branch was cut from
board: identity
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/identity/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/identity.json
  - src/components/ui/
  - src/app/globals.css
---

# lp/identity-r3

**Goal.** identity round 3: actions and fields as one system in three directions (keys plus wells, all rings, a new third idea), each shown inside real screens; plus two layer extras (white pop-outs over the dark room, the light edge beyond media cards).

## The brief

**The round's direction (Will, round 13, carried by every lane):** never dev-tool-ish (the viewfinder's corners survive only as a focus mark, never a style, and so does nothing of their loading state); a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline (undated, morning-only and multi-day events all read well); "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control); cost is designed like the architecture (every image and video action multiplies at scale). Production is the working version: a pick is the best of what was drawn, never a rule. Milestone 34 (round 12) ships to `main` while you read: build nothing heavy (no `pnpm build`, no lab crawl) before the Orchestrator's message that its gate has ended; read, plan and write tests meanwhile.

**Will's answers (identity r2, his desk on build 45, 2026-10-03), in full:**
- voice=camera; layers=display; status=lights. These are settled and wired by `identity-wiring` at the source. Your drawings wear them: production's atoms once it merges, the board's own sheets before.
- actions=? "Please see next question's note for both answers. However, the 'corners' options here is what inspired my 'not devtool ish' comment in the last review batch, particularly the corners and loading state, so exclude that moving forward. Will mention options 1 and 2 next."
- fields=? "I'm split on last question and this one. Rings for both feels like the easiest for 'modern consumer', but also puts us back closer to the generic shadcn look we wanted to break away from. Rings for last but wells as you recommend here leaves some focuses rings, some corners, which is bad. I like wells (especially recessed inputs for subtle difference against page color) and don't mind using the viewfinder corners for focus only, including last answer. Let's launch another exploration, exploring the keys (last) plus wells (this) direction together versus all rings, plus a new third idea of anything you can think of, and including a couple in UI examples to get a feel for both in use. Like the corners last question, we can drop the corners here too, too close in the devtool direction."
- layers=display: "I like the slightly cleaner design of this one (and black surfaces getting attention on white body when popped in), but curious if doing the same for those opposite (white surface popouts to get attention on black body) would also look good, worth an exploration and curious to hear your thoughts. I also really did like the light edge and wouldn't mind an exploration around potentially keeping that infused beyond media cards. It makes the media card themselves look much more rich."

**The asks:**
1. **`system`**: actions and fields together, one decision, in three directions.
   - Keys and wells: bevelled keys sinking on press; recessed wells, a subtle difference against the page; the viewfinder's corners as the focus mark on both, and nowhere else.
   - All rings: pills and soft outlines, with ring focus.
   - A new third idea of your own.
   - No corners as a style anywhere, and no autofocus "hunting" loading state.
   - Each shown on its atoms in every state, and inside two or three real screens no round-13 lane rewires: Account, billing, the profile setup, the guest's Add sheet, the door's steps. That's "a couple in UI examples to get a feel for both in use".
2. **`room`**: display's inverse in the room (white pop-outs over the dark body), drawn beside a one-step lift (graphite on black). The Orchestrator's view, given to Will: a white sheet over a dark party room is striking but flashes at night. Draw both honestly, so he can see.
3. **`edge`**: the light edge he liked (matte's 1 px top highlight, keys' bevel) carried onto display's surfaces and beyond media cards (cards, sheets, the cover's glass), against none.

Retire r2's answered asks into the board's settled lines: voice, layers and status are wired. Drawings at 1440 and 375, paper and room. Start your headless captures only after the Orchestrator's message that the milestone's gate has ended.

**The board's shape.** The board is one folder, `src/app/(dev)/design/sandbox/identity/`, and nothing else names it: the registry finds it, and retiring it is deleting it. `spec.ts` is `defineExploration` (`src/components/lab/exploration.ts`) and pure data: its id `identity`, its title, `surface`, `desk: 10` (by leverage, lower first) and `lives` (the paths it redraws), its `opening` and `terms`, and every ask with its context layer (`where`, `when`, `matters` beside `lands`, each option's `gains` and `costs`, `because` in a line). `board.tsx` exports one component, `ExplorationBoard` with a preview per option (`PreviewsFor`). `registry.test.ts` holds all of it; `pnpm lab:smoke` and `pnpm lab:demo` run on the board your change reaches.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate (CLAUDE.md's four steps, each on its own exit code); `pnpm lab:smoke --base http://localhost:3136`; `pnpm lab:demo --board identity` at 1440 and 375 with its knobs, pressing every step; `registry.test.ts` and `queue.test.ts`; your Handoff names the screens each direction is shown in.

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
