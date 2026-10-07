---
track: guests-room-r1
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "2dd9fe79"            # the launch-prep SHA the branch was cut from
board: guests-room
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/guests-room/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/host-app.md
  - docs/systems/profiles-social.md
  - src/app/(app)/dashboard/[eventId]/guests/guests-room.tsx
  - src/components/social/guest-peek.tsx
  - src/components/app/event-blocks/blocked-section.tsx
---

# lp/guests-room-r1

**Goal.** Board guests-room r1: the hub's Guests room and a person's card, polished from Will's note: how each person stands (at the door, in, blocked, invited) and what can be done for them, beautiful and never crowded.

## The brief

**The round's direction (Will, standing):** attention earned, never yelled (PRD.md: the one thing that needs her may draw the eye, beautiful and inviting, while nothing crowds a screen); delight where it costs nothing in clarity; never dev-tool-ish; world-class tastemakers; production the working version.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app, and nothing deploys. Port 3132 is yours; 3000 is Will's desk. A signed-in look runs on your own port through `usher/kit/redteam/signin.mjs` (testing-verification.md).

**From Will's note on host-moments r1's Let in (2026-10-06):** "The UI design of how we present this (and guest card items in general) could definitely be polished." Production now wires his picks (host-moments-wiring): Let in is one press for a declined newcomer, the decline's toast keys Let in, Blocked keeps Let back in with its confirm for someone who was in; account-moments-wiring made names in Account's Connections open `GuestPeek`, the person's card, which the Guests room's names also open. Draw the Guests room whole on production as it is now: its head and At the door, the people in, Blocked, the invite list where it is the door, and a person's card from a name, at 375 and 1440, in the room and on paper.

**Asks you shape (each one decision, real contenders):** how a person stands in a row (what a row shows and how its one act reads, at the door, in and blocked), and the person's card (what it carries and how its acts are offered) are the likely two; ask what the drawing shows is open, never what is settled (Let in is one press; a decline is a block; Follow and Block rules are profiles-social.md's).

**Nearest standing asks (ask nothing they ask):** account-moments r2 (what a follow says when it lands, the invitation on her page); presence (the guest row of faces on the hub, not yet cut: never the Guests room's list); signature r1 (where the light lives).

**The method:** a helper per option, one fresh-eyes pass, a board's light gate (PROGRAM's "Speed over proof in exploration").

**The board's shape.** The board is one folder, `src/app/(dev)/design/sandbox/guests-room/`, and nothing else names it: the registry finds it, and retiring it is deleting it. `spec.ts` is `defineExploration` (`src/components/lab/exploration.ts`) and pure data: its id `guests-room`, its title, `surface`, `desk: 42` (by leverage, lower first) and `lives` (the paths it redraws), its `opening` and `terms`, and every ask with its context layer (`where`, `when`, `matters` beside `lands`, each option's `gains` and `costs`, `because` in a line). `board.tsx` exports one component, `ExplorationBoard` with a preview per option (`PreviewsFor`). `registry.test.ts` holds all of it; `pnpm lab:smoke` and `pnpm lab:demo` run on the board your change reaches.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The board at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke --base http://localhost:<port>` (it crawls what your change reaches, the board and the desk; `--all` for the whole lab); `pnpm lab:demo --board <board> --base http://localhost:<port>` pressing every step.

## Questions (a recommended answer each; the Orchestrator relays them)

- none yet

## System-doc edits (in place, owned facts only)

- none yet

## Deferred (ROADMAP one-liners, each naming its bucket and area)

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
