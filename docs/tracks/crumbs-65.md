---
track: crumbs-65
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "b8e1c833"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/export/
  - src/components/app/export/
  - src/lib/upload/
  - src/components/guest/camera/
  - src/components/guest/reel/
  - src/components/guest/guest-header.tsx
  - src/components/app/event-feed/reel-card.tsx
  - src/components/app/dashboard/display-menu.tsx
  - docs/systems/uploads-and-r2.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - CLAUDE.md
---

# lp/crumbs-65

**Goal.** Red-team 53's findings before milestone 36, fixed and proven on a local production build: a download whose line drops after the mint, the drop line overwritten while offline, the Reel card's words at 375, and the NITs.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish (the viewfinder's corners survive only as a focus mark, never a style, and so does nothing of their loading state); a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline (undated, morning-only and multi-day events all read well); "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control); cost is designed like the architecture (every image and video action multiplies at scale). Production is the working version: a pick is the best of what was drawn, never a rule.

**★ Local only (Vercel's Hobby Active CPU, 2026-10-04: 3h 56m of 4h used; past it every function pauses).** Nothing of yours requests the launch-prep alias, partyreel.com or any *.vercel.app. Signed-in walks run on a local production build at port 3000, built with `NEXT_PUBLIC_SITE_URL=http://localhost:3000` (`docs/systems/testing-verification.md`), but port 3000 is Will's desk: build your own at your port only for anonymous checks, and for a signed-in walk ask nothing, write it as the Handoff's "Look at first" for the Orchestrator's local red-team. R2's CORS lists localhost 3000 and 3131 to 3139.

**Red-team 53** (build 53, stopped mid-walk for the CPU limit; ledger `../partyreel-wt/_scratch/redteam-53/ledger.txt`, read the MEDIUM, LOW and NIT lines whole):
- **MEDIUM, downloads (guest and host):** when the line drops after the mint, `check()` gives up and the walk posts its form anyway, so the page becomes Chrome's error page (`chrome-error://chromewebdata/`) and "Your connection dropped" is never shown. A walk whose check failed on the network never posts; it says the dropped connection and what to do, with Try again, in the toast (`src/lib/export/walk.ts`, `src/components/app/export/`).
- **LOW:** while still offline, the drop line turns into "Your download is starting." because `heard(null)` resets `lineLost`. A line that is still down keeps its words until it is truly back.
- **LOW:** at 375 the Reel card hides "Guests get it later" (`reel-card.tsx`; the card's `title` holds the sentence). Make it readable at a phone's width without widening the tile (the doors' redraw owns that), or say less where it fits.
- **NITs:**
  - the Display menu's Reset drops focus to the body (keep it on the menu);
  - the dock's Style key's open fill loses to hover (the open state wins);
  - a name-only guest's header disc flashes uncoloured before its seed lands (remember the seed per ticket so a later load paints at once; the first load fades in, never flashes);
  - the camera never says a dropped connection (its upload failure takes the uploader's dropped-connection words);
  - one wording for the drop everywhere: "Your connection dropped. Check your signal, then try again." (the uploader says "and try again").
- Each fix pinned by a test that fails on the old code.

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
