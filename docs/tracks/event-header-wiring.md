---
track: event-header-wiring
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "e123a6a9"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(app)/dashboard/[eventId]/page.tsx
  - src/components/app/event-feed/event-hub-head
  - src/components/app/event-feed/event-cards-row
  - src/components/app/event-feed/room-card
  - src/components/app/event-feed/reel-card
  - src/components/app/event-feed/edge-fade-scroller
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/event-header.json
  - src/app/(dev)/design/sandbox/event-header/spec.ts
  - docs/systems/host-app.md
---

# lp/event-header-wiring

**Goal.** The hub's doors as Will picked them: the cover dissolving into the page and five cards across the seam, folding into pills under the bar when stuck.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline; "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control, zero silent failures); cost is designed like the architecture. Production is the working version: a pick is the best of what was drawn, never a rule.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app, and nothing deploys. Port 3136 is yours; 3000 is Will's desk.

**From Will's desk 3 answer:** event-header r4's doors = cards ("Cards over the seam: the cover dissolves into the page and five cards stand across the seam, every one in sight on a phone; stuck, they fold into pills under the bar"; lands: the hub's doors at rest and in their sticky form, at a desk and in a hand). His note: "This feels a bit more pronounced than the glass capsule, without shouting like the quiet windows with their more media-forward visuals do. Let's carry this version forward, but run another exploration to see what some of your ideas of polish look like." Wire r4's cards (the board's drawing: `src/app/(dev)/design/sandbox/event-header/`, `cards.tsx` through `door-kit.tsx`) into the production hub head, with its carried calls G1, G2 and G4 as the board drew them on production's panel; the waiting colour stays the brand's (today's token). A polish round (event-header r5) runs in parallel on the board, so build the cards cleanly and leave polish to his next pick. The hub's Guests card while a sealed roll waits: say its shots are developing, as the Guests room now does (crumbs-81's idea; the ROADMAP line this retires).

`docs/systems/host-app.md` is settings-wiring's: write your doc lines as a proposal in the Handoff. Wiring rigor: the whole gate; the hub is a host page, which only port 3000 signs into: walk what your port reaches (the doors' component at 375, 640, 1024 and 1440, sticky and at rest) and list the signed-in walk for the Orchestrator's desk.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

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
