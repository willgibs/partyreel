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
  # added at the lane's plan (each file before its first edit)
  - src/app/(app)/dashboard/[eventId]/event-not-found.test.tsx
  - src/app/(app)/not-found.metadata.ts
  - src/app/admin/albums/[eventId]/page.tsx
  - src/app/admin/accounts/[id]/page.tsx
  - src/app/admin/not-found.tsx
  - src/app/admin/not-found.screen.tsx
  - src/app/admin/not-found.metadata.ts
  - src/app/admin/record-not-found.test.tsx
  - src/app/not-found.test.ts
  - src/components/guest/event-experience.tsx
  - src/components/guest/album-boundary.tsx
  - src/components/guest/album-boundary.test.tsx
  - src/lib/events/gallery-access.server.ts
  - src/components/app/event-feed/selectable-media-grid.test.tsx
  - src/app/(guest)/e/[token]/page.tsx
  - src/components/guest/follow-moment-card.tsx
  - src/components/guest/follow-moment-card.test.tsx
  - src/components/guest/claim-handle-prompt.test.tsx
  - src/app/(guest)/e/[token]/page.host-card.test.tsx
  - src/components/guest/event-experience.album.test.tsx
  - src/lib/format/count.ts
  - src/lib/format/count.test.ts
  - src/components/app/event-feed/review-queue.ts
  - src/components/app/storage/storage-list-rules.ts
  - src/components/likes/likes-provider.tsx
  - src/components/likes/likes-provider.test.tsx
  - src/components/app/host-media-grid.bulk-like.test.tsx
  - src/lib/utils.test.ts
  - src/lib/billing/storage-guard.ts
  - src/lib/events/gallery-access-owner.server.ts
  - src/lib/events/gallery-access-owner.server.test.ts
  - src/lib/events/album-viewer.server.test.ts
  - src/lib/events/upload-lock.test.ts
  - src/app/(app)/account/profile/invite.ts
  - src/lib/db/migration-guards.test.ts
  - src/lib/validation/upload.test.ts
  - src/components/app/event-settings/videos-switch.tsx
  - src/components/app/event-settings/videos-switch.test.tsx
  - content/help/event-settings-explained.mdx
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

- **What a dead dashboard link answers (item 1, with build 30's relay): a soft 404.** The hub and each room (Review,
  Guests, the reel's old room; Settings redirects to the hub) now draw the host app's not-found themselves, in the
  HTML, titled "Event not found · Partyreel" (`(app)/not-found.metadata.ts`, noindex), and answer **200**, as they did
  (the throw landed inside the hub's `loading.tsx` after the stream had committed to 200: the red-team's 200).
  **Recommended: keep the 200.** The dashboard is behind sign-in (a signed-out request is sent to /login before any
  page renders) and robots-disallowed, so no crawler, unfurler or link checker ever reads the status; its one reader
  is the host's own browser, which draws the same screen either way. A true 404 needs the proxy to validate the
  session and read the RLS-scoped event before every document load of the page a host opens most, for a status nobody
  reads. **Overrule** → a `lib/gone-link` twin for `/dashboard/<uuid>` and its rooms: the proxy asks `events` for the
  id under the host's session on a document load and sends the request on with a 404; the pages already draw the
  screen, so nothing else moves.
- **The portal's missing record now answers 200 where its thrown `notFound()` answered 404** (behind Next's white
  error shell until the script ran). The account and album pages draw the portal's not-found in the HTML, titled
  "Page not found · Partyreel Ops". **Recommended: accept**: behind the admin gate and MFA, disallowed and noindex,
  read by one operator, so the status has no reader. Its cost: the title reads the record, so its `generateMetadata`
  passes `requireAdmin()` first, a third gate read on these two pages (Deferred: cache the gate). **Overrule** → the
  portal keeps its throw (a true 404, white until its script runs).
- **The album's failure words** (item 2): "The album didn't load", "That's on us, not you. Try again in a moment.",
  and Try again (the route error screen's own voice, sized to the album's slot). **Recommended: these.** Overrule →
  the voice's words; they live once, in `album-boundary.tsx`.
- **A mixed bulk Like says "items"** ("Liked 3 items"; "Liked 1 video", "Liked 2 photos" otherwise), the album's own
  word for a mix (its error toasts' "those items", the storage list's "4 items"), where Review's verdicts say
  "uploads". **Recommended: "items".** Overrule → "uploads" for both host surfaces (one word in `formatKindCount`'s
  two callers), or "photos and videos".

## System-doc edits (in place, owned facts only)

- `docs/systems/host-app.md`: The event page (a gone or not-yours event draws the group's not-found on the hub and
  each room, a soft 404 titled from `not-found.metadata.ts`); Moderation (the peek holds Tab while it is up); Bulk
  Like (its toast names what it added by kind).
- `docs/systems/guest-flow.md`: the follow moment's host card (her follow state read beside it); the owner answer
  (the album's routes and the upload seams ask the page's own); the seed stream (a failed seed is the album's alone,
  `album-boundary.tsx`, and why a boundary of its own).
- `docs/systems/uploads-and-r2.md`: a locked event's write gate (the host by the page's own owner answer).
- `docs/systems/marketing-content.md`: The 404 pages (the host app's event pages and the portal's record pages draw
  theirs, a soft 404; what still throws).

## Deferred (ROADMAP one-liners, bucket named)

- Host (performance): the print sheet (`(print)/dashboard/[eventId]/print`) still throws `notFound()` for an event
  that is gone, with no nearer boundary: the root's error shell, white until its script runs; the page drawing the
  root's screen itself would answer it as the hub now is (from `crumbs-28`).
- Admin (performance): `requireAdmin()`'s gate read (a `getUser()` round trip and the profile's `is_admin`) is not
  request-cached, so every portal page pays it in the layout and again in the page, and a record page a third time
  for its title (crumbs-28); `cache()` it as `getRequestAuth` is (from `crumbs-28`).
- Guest: an album that could not load takes her tracker's list with it (the list rides the album's live source), so
  while it says it could not load her Add still sends but her uploads list will not open; a store that took its own
  first sync when the seed failed would keep the list and heal with no refresh (from `crumbs-28`).
- Errors: the route `error.tsx` screens' Try again calls `reset`, which re-renders without re-fetching, so an error a
  Server Component threw comes straight back; Next 16.2 hands `error.js` an `unstable_retry` (the router's refresh
  with the reset), or the screens could refresh as the album's boundary does (from `crumbs-28`).

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
