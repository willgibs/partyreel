---
track: crumbs-84
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "9a8d9540"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/event/zone
  - src/app/(app)/dashboard/[eventId]/as-guest.server
  - src/app/(app)/dashboard/[eventId]/actions
  - src/components/app/event-settings/settings-state
  - src/components/app/event-settings/testing/
  - src/lib/db/mutations/events
  - src/app/(dev)/design/sandbox/host-dashboard/
  - src/lib/dashboard/
  - src/components/app/event-feed/reel-card
  - src/components/app/event-feed/room-card
  - src/components/marketing/mock-parity.test.ts
  - src/components/marketing/help/step-screens/
  - src/app/(dev)/design/sandbox/event-header/
  - src/app/(dev)/design/(shell)/library/compositions/gallery-demos
  - docs/systems/dashboard.md
  - docs/systems/host-app.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/lib/db/types.ts
---

# lp/crumbs-84

**Goal.** Cleanup whose time has come: event-zone's typed seams retired, the host-dashboard board retired with what only its drawings used, a dead public Server Action deleted, the Reel card's words in one server-safe home, and the Library's sticky-band specimen true to its hint.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline; "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control, zero silent failures); cost is designed like the architecture. Production is the working version: a pick is the best of what was drawn, never a rule.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app, and nothing deploys. Port 3133 is yours; 3000 is Will's desk.

**Five ROADMAP lines of cleanup whose time has come, each quoted whole (read the code each names first; each line retires at the Orchestrator's record):**
- Engineering: retire event-zone's typed seams now the types carry `events.time_zone`: `zoneOfRow` and `withZone` (`src/lib/event/zone.ts`; callers in `as-guest.server.ts`, `settings-state.tsx`, `mutations/events.ts`, `zone.server.ts` and the settings test fixture `host-event.ts`) become the row's own `time_zone` (event-zone).
- Dashboard: retire the host-dashboard board (its picks are built: chooser = words, details = built), deleting `sandbox/host-dashboard/` and its `docs/reviews/` ledger, then `seasonsOf`, `HomeView.events.seasons` and `src/lib/dashboard/seasons.ts`, which only its drawings composed (crumbs-82).
- Host: delete `refreshHubReelAction` (`dashboard/[eventId]/actions.ts`) and its tests in `actions.test.ts`: the reel card no longer asks for the reel's own take, so nothing calls it, and a Server Action is a public endpoint (event-header-wiring).
- Design: the Reel card's words are one pure function now (`reelCardFace`, `reel-card.tsx`) but sit in a client module, and the two pins that quote "Live for guests" read that file; move it to `room-card.ts` (server-safe) and repoint both pins, so `desk-screens.tsx` and the board's `facesOf` import it instead of re-typing it (what is left of the ROADMAP's line on the Reel card's words) (event-header-wiring).
- Design: the Library's hub-cover "Scrolled into the album" specimen (`library/compositions/gallery-demos.tsx`) stands in an `overflow-hidden` frame, so the band it shows never sticks, though its hint says it does; it needs a frame that does not clip, or a page of its own (event-header-wiring).

Notes: the first is a refactor with no change a person can see: `pnpm typecheck` and the existing tests are its proof, with no seam left (`grep -rn "zoneOfRow\|withZone" src` empty). The second deletes a board folder: the registry finds boards by folder, so run `sandbox/registry.test.ts` and `(shell)/lab/_desk/queue.test.ts`, and leave `docs/reviews/host-dashboard.json` for the Orchestrator (that directory is its). The third removes a public endpoint: prove nothing calls it (`grep`) and that the hub's reel card still plays. The fourth moves the Reel card's words to a server-safe home: repoint `mock-parity.test.ts`, `step-screens.test.ts` and the event-header board's `facesOf` to it, with nothing re-typed. The fifth is the Library specimen's frame: walk it at 1440 and 375 on your port, the band sticking as its hint says. The help's `ReelCardPicture` waits for event-header r5's pick (not yours). The whole gate, `lab:smoke` included.

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
