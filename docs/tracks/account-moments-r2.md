---
track: account-moments-r2
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "3dde5801"            # the launch-prep SHA the branch was cut from
board: account-moments
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/account-moments/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/account-moments.json
  - docs/systems/profiles-social.md
  - src/app/(app)/me/page.tsx
  - src/components/social/relation-toggle.tsx
  - src/components/app/dashboard/page-invite-card.tsx
---

# lp/account-moments-r2

**Goal.** Board account-moments r2: what a follow says when it lands, asked again and polished from Will's split note, and the invitation on her page redrawn beautiful and inviting, never loud.

## The brief

**The round's direction (Will, standing):** delight where it costs nothing in clarity; attention earned, never yelled (PRD.md: the one thing that needs her may draw the eye, beautiful and inviting, while nothing yells or crowds a screen); never dev-tool-ish; world-class tastemakers; production the working version.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app, and nothing deploys. Port 3135 is yours; 3000 is Will's desk. A signed-in look runs on your own port through `usher/kit/redteam/signin.mjs` (testing-verification.md).

**Round 2, from Will's batch (2026-10-06; `docs/reviews/account-moments.json` round 1):** block = line, tidy = stays and me-page = private are built (account-moments-wiring merged: the blocked well, Connections' rows that stay with names opening `GuestPeek`, `/me` wearing her page's head marked private): they leave the asks and join the opening as settled. Two asks remain, each drawn on production as it now is:

- **follow, unclear to him, asked again.** His note, whose wording is the point: "I'm split here. I'd like to know what you think, and you're welcome to run another round of exploration if helpful. On the first or first few follow actions, the additional context may be helpful to understand what that entails. However, as follow becomes a common action for some users, it might get annoying to have that hint bubble up every time. Imagine following 1000+ users on Instagram and being told 1000 times what a follow does. You'd think "alright, I get it". Our solutions also need to be a bit more polished." The Orchestrator's view, told him in chat: a first follow says once that only she sees whom she follows, and every later follow is the button alone, so the thousandth is quiet; beside it, a Following state that carries the privacy itself, so nothing ever needs saying. Draw real contenders on Maya's page, polished, each with its steady state as well as its first time: say it once (the first follow per account; whether that memory lives on the server or the device is a Question with its cost), the button carries it (a quiet private mark on Following that explains itself only when asked), said where follows live (Connections) and never at the press, and today's button alone as the control. Reword the ask so its question is plain.
- **invite, picked as today's visible card, redrawn.** His note: "We can do much better than the design itself, but I think the more visible presentation wins here. The whole goal of this page is to be activated and become public, so it doesn't make a ton of sense to minimize the main flow that opens that up. Making it more minimal may lead users to think it's already active if they don't notice the set up blurb. This design should feel very beautiful and inviting, but not yelling or in your face." Two or three takes on the visible invitation on the wired `/me` (her own head above it, marked private), each beautiful and inviting, never loud, in Afterglow's Aperture (brand r2's pick: `docs/reviews/brand.json`); the consent model never drawn away (a page is public only by her choice; claiming a handle is the consent act).

**Nearest standing asks (ask nothing they ask):** brand-marks r1 and signature r1 (the marks, the tokens, where the light lives); a guests-room board will polish the Guests room's person rows and `GuestPeek` later, so the card's own look is not this board's.

**The method:** a helper per option on the invitation's takes; one fresh-eyes pass; a board's light gate (PROGRAM's "Speed over proof in exploration").

**The board's shape.** The board is one folder, `src/app/(dev)/design/sandbox/account-moments/`, and nothing else names it: the registry finds it, and retiring it is deleting it. `spec.ts` is `defineExploration` (`src/components/lab/exploration.ts`) and pure data: its id `account-moments`, its title, `surface`, `desk: 50` (by leverage, lower first) and `lives` (the paths it redraws), its `opening` and `terms`, and every ask with its context layer (`where`, `when`, `matters` beside `lands`, each option's `gains` and `costs`, `because` in a line). `board.tsx` exports one component, `ExplorationBoard` with a preview per option (`PreviewsFor`). `registry.test.ts` holds all of it; `pnpm lab:smoke` and `pnpm lab:demo` run on the board your change reaches.

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
