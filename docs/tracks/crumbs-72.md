---
track: crumbs-72
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "ac0a001d"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/app/event-settings/camera-settings
  - src/app/api/host/r2/presign-upload/
  - src/components/guest/upload-step.tsx
  - src/components/shared/media-lightbox.tsx
  - src/lib/reel/engine/player-live.tsx
  - src/components/app/event-settings/event-page.tsx
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/app/(guest)/e/[token]/page.tsx
---

# lp/crumbs-72

**Goal.** Four ROADMAP crumbs: Settings' develop time never loses a typed time; the host's early storage refusal carries the meter's numbers; a newcomer behind A photo first hears what waits; the reel's dead viewer path goes.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish (the viewfinder's corners survive only as a focus mark, never a style, and so does nothing of their loading state); a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline (undated, morning-only and multi-day events all read well); "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control); cost is designed like the architecture (every image and video action multiplies at scale). Production is the working version: a pick is the best of what was drawn, never a rule.

**★ Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app. Port 3131 is yours; 3000 and 3132 are not.

**The fixes**, each pinned by a test that fails on the old code:
1. **Settings' develop time** (`camera-settings.tsx`) saves only on blur or Return, so Escape or Back drops a typed time, and a phone's picker may never blur it. Lift the date field's beat and close-save (`event-page.tsx`) into one hook both use. Its real-iPhone check is the Orchestrator's to stage; say what to press.
2. **The host's early storage refusal** (`get_host_upload_context`'s `at_storage_cap`, `src/app/api/host/r2/presign-upload/route.ts`) says a bare "Storage is full for your plan". Carry the meter's numbers there too (`roomRefusalWords`, as the guest path does).
3. **Behind "A photo first",** a newcomer (`teaser`) over an album whose photos wait reads "Nothing here yet. Add the first photo and the album opens." (`upload-step.tsx`), because `waitingOnArrival` needs `access === "full"` (`src/app/(guest)/e/[token]/page.tsx`, a read). Say what waits there too.
4. **Code hygiene:** the reel no longer opens the photo viewer, so `src/components/shared/media-lightbox.tsx`'s `ViewerOrigin` kind "reel" with its `startAt` prop, and `src/lib/reel/engine/player-live.tsx`'s `moment()` with `LiveReelMoment`, have no caller outside their tests. Remove them with their tests.

Wiring rigor: the whole gate. Work economically, with no helper agents; push a WIP commit at each step (this account's weekly usage is near its end).

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
