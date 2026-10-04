---
track: hub-strip-wiring
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "fdbe1cab"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/app/event-feed/
  - src/app/(app)/dashboard/[eventId]/page.tsx
  - docs/systems/host-app.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/event-header.json
---

# lp/hub-strip-wiring

**Goal.** Wire Will's facts=strip on the hub's head (one mark a photo along the cover's foot, the newest glowing, true for every kind of event), and his Q5: the host's Reel card ready to play before the develop while the guest page, hers included, shows no reel until it.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish (the viewfinder's corners survive only as a focus mark, never a style, and so does nothing of their loading state); a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline (undated, morning-only and multi-day events all read well); "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control); cost is designed like the architecture (every image and video action multiplies at scale). Production is the working version: a pick is the best of what was drawn, never a rule.

**Will's pick on event-header r3 (2026-10-04), to wire:** facts=strip. Read the board (`src/app/(dev)/design/sandbox/event-header/`: `facts.tsx`'s `FactsStrip`, `event-header.css`) and `docs/reviews/event-header.json`. The strip: white 3 px marks along the cover's foot, one mark a photo (54 to 160 slots at a desk, 19 to 52 on a phone), each mark's height how many photos landed within 10 minutes of it (smoothed), empty slots dim dots, the newest glowing while photos land, ending in a dot and the count; read true for every kind of event (undated, a morning, a weekend's third day, a trickle). Production's doors stay as they are (event-header r4 is redrawing them): the strip fits today's head and keeps fitting whichever door he picks. The board's `faces` option (the guest row he loved) is NOT this pick: it goes to its own board after the brand round.

**And Will's Q5 (2026-10-04), in substance:** the live reel is the host's to play from her own event page as soon as she opens it, even while the album develops; guests don't have it until the develop. So:
- **Her Reel card** (`reel-card.tsx`; today it draws no photograph and says "Live at the develop" while a develop time is ahead) shows the reel as ready to play now (her own scope, sealed shots included, as her hub already reads them), saying guests get it at the develop. Press plays it.
- **The guest page shows no reel until the develop, hers included:** today the owner passes every gate on `/e/<token>` (`isRequestOwner`, `src/app/(guest)/e/[token]/page.tsx`), so she would see it there. Opened as the owner before the develop, the guest page shows what guests see (no reel), so the two pages teach the difference. "See it as a guest" already renders the guest view.
- No screen link: a screen that isn't hers plays the reel cast from her own device.

**Ownership this round:** `src/components/app/event-feed/`, the hub page and `docs/systems/host-app.md` are yours (`styles-wiring` proposes its host-app.md lines to you through the Orchestrator). The guest page's reel gate is an exception you list (the one file and why); `src/components/ui/` belongs to `graphite-wiring`.

`host-app.md` and `reel.md` (an exception for the gate's line) take the facts in place.

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
