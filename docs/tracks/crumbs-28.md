---
track: crumbs-28
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "5f1e3f5a"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(app)/dashboard/[eventId]/page.tsx
  - src/app/(app)/dashboard/[eventId]/guests/page.tsx
  - src/app/(app)/dashboard/[eventId]/reel/page.tsx
  - src/app/(app)/dashboard/[eventId]/review/page.tsx
  - src/app/(app)/not-found.tsx
  - src/app/(app)/not-found.screen.tsx
  - src/components/app/event-feed/selectable-media-grid.tsx
  - src/components/guest/claim-handle-prompt.tsx
  - src/components/admin/moderation-grid.tsx
  - src/components/app/event-feed/use-review-triage.ts
  - src/components/app/host-media-grid.tsx
  - src/lib/utils.ts
  - src/components/guest/password-gate.test.tsx
  - src/lib/events/upload-lock.ts
  - src/lib/events/album-viewer.server.ts
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/host-app.md
  - docs/systems/guest-flow.md
---

# lp/crumbs-28

**Goal.** Nine small ROADMAP items, each fixed at its root: a host's and the portal's cold 404 drawn true, a guest album whose seed fails kept to the album, the review peek's focus held, the moment card's Follow true, the portal's Remove confirm true, the bulk toasts' counts, formatBytes' rounding, a flaky test widened, and one owner answer.

## The brief

Nine items the ROADMAP holds (each is its line there; find it by the words quoted), each fixed at its root with a test that fails on today's code:

- **A host's cold 404.** A `notFound()` thrown in the host app or the portal is Next's white error shell on a cold load: an empty body until the script runs. Two cases: a dashboard link to a deleted or not-yours event (`/dashboard/<id>` and its rooms), and a missing admin record. `stale-link` answered the guest link by having the page draw its own not-found, with the status set before the render (the proxy's read). Find the cheapest true answer here. Weigh a read on every hub load against a soft 404 (a private, noindex page), and write the choice under Questions.
- **A guest album whose seed genuinely fails.** A read error, as opposed to a refusal, takes the whole guest page to the error screen. An album-level boundary with a retry would keep the header, the door and the upload working, while only the album says it couldn't load.
- **The review peek's focus.** It is `aria-modal` with no focus trap, so Tab walks out behind it (`event-feed/selectable-media-grid.tsx`).
- **The moment card's Follow.** It starts on Follow even when she already follows the host, because `claim-handle-prompt.tsx` hands `FollowMomentCard` no follow state. Read it beside `getHostCard`.
- **Admin Albums' Remove confirm.** `moderation-grid.tsx` says "her uploads list already says Not in the album" as fixed text, which reads as already true on an approved or pending item.
- **The bulk toasts' "photo".** `host-media-grid.tsx`'s "Liked N photo(s)" and `use-review-triage.ts`'s "Approved N photo(s)" count a selection that can hold a video. `formatMediaCount` (`src/lib/format/count.ts`) is the guest side's answer.
- **formatBytes' "41.0 GB".** `src/lib/utils.ts` tests the value before rounding, where `formatBytesUp` tests after; the size list's chips and rows show it.
- **A flaky test.** `password-gate.test.tsx`'s stalled-hold Retry failed once under the full suite's load. Widen its budget so it holds under load, and run the suite twice.
- **One owner answer.**
  - `mayUploadPastLock` (`src/lib/events/upload-lock.ts`) and `resolveAlbumViewer` (`src/lib/events/album-viewer.server.ts`) ask the owner inline, through `getUser()` and `isEventOwner`. Move both onto `isRequestOwner` (`gallery-access-owner.server.ts`), with behaviour unchanged.
  - The retired claim ticket's names go too: `account/profile/invite.ts`'s note, and comments in `migration-guards.test.ts` and `validation/upload.test.ts`.

Each fix retires its ROADMAP line; name them in your Handoff.

**Verify:**
- the gate;
- each item's test red on today's code and green on yours (the retired names and the flaky test excepted);
- on localhost, drive what runs there (a dev server with a forced read error is fine).

The signed-in hub, the portal and a guest's real read error cannot all run on localhost: name their steps for the next build's red-team in your Handoff.

**Will's desk is up.** `locked-door`, `event-ready` and `disposable-mode` describe production he is reviewing now, so change no word or behaviour their asks describe. If the lab crawl's PREMISE line names a board your change reaches, say in your Handoff why its asks still hold.

**Paths:** your owns are a start. Add each file to `owns` in your manifest before editing, or name a one-line exception.

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
