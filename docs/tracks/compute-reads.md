---
track: compute-reads
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "ddf8dd7e"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/api/album/host/[eventId]/sync/
  - src/lib/events/album-wire-carry
  - src/components/app/event-feed/host-album
  - src/components/guest/reel/live-reel
  - src/lib/guest/reel-tile
  - src/lib/db/queries/events
  - src/app/(app)/welcome/
  - src/components/guest/guest-header
  - scripts/compute-model/budget.json
  - docs/systems/host-app.md
  - docs/systems/reel.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/app/api/album/guest/sync/route.ts
  - src/components/marketing/chrome/chrome-link.tsx
  - scripts/compute-model/
---

# lp/compute-reads

**Goal.** Fewer calls and cheaper reads, five ROADMAP cost crumbs: the hub's delta carries its new items' links as the guest's does, the cover keeps the stills it is playing, the profile's cover previews presign stable, /welcome counts instead of building every card, and the guest header's links prefetch only on intent; each measured before and after.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish (the viewfinder's corners survive only as a focus mark, never a style, and so does nothing of their loading state); a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline (undated, morning-only and multi-day events all read well); "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control); cost is designed like the architecture (every image and video action multiplies at scale). Production is the working version: a pick is the best of what was drawn, never a rule.

**★ Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app (Vercel's Hobby CPU is at its limit). Port 3135 is yours; 3000 is Will's desk and red-team 54's, never touched; 3130 is the Orchestrator's gate.

**Why this lane:** every call multiplies by every lit phone at every party; the compute model (`../partyreel-wt/_scratch/compute-model/report.md`, `pnpm compute:model`) prices them. Behaviour stays exactly as it is: same pictures, same moments, fewer calls.

**The fixes**, each pinned by a test that fails on the old code:
1. **The hub's delta** (`/api/album/host/[eventId]/sync`) returns new items without their links, so a batch on the hub costs a links call after it; carry the new items' links as the guest's delta does (`album-wire-carry.ts`), so a batch is one call on the hub too (`event-feed/host-album.tsx`).
2. **The cover re-deals its six stills on every arrival** (`useCoverStills` in `live-reel.tsx`, `tileStills`' `planTake` over the whole album in `lib/guest/reel-tile.ts`), and a new still with no link costs a links call. A deal that keeps the stills still playing makes every batch one call.
3. **The profile's cover previews** (`readCoverUrls`, `db/queries/events.ts`) presign without `stable`, so every visit re-downloads each card's cover: a stable presign, as `getEventCardStills` uses, lets the browser serve them from cache.
4. **`/welcome`** (`(app)/welcome/page.tsx`) builds every Guest card, covers presigned, only to count them, and calls `getUser()` beside the cached `getRequestAuth`: a count read and the cached viewer.
5. **The guest header's logo** (`guest-header.tsx`) and its body links to `/features/album`, `/features` and `/features/curation` prefetch sheets their page never draws: give them `prefetchOnIntent` (`chrome-link.tsx`).

**Measure:** the calls a guest's ten-photo burst and a host's hub batch cost, before and after, from the network (your own headless Chrome on your port) or `pnpm compute:model --port 3135`; lower `scripts/compute-model/budget.json`'s lines your levers move, never raise one. Wiring rigor: the whole gate.

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
