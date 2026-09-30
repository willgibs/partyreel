---
track: crumbs-30
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "8c0678cc"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/auth/admin-context.ts
  - src/lib/auth/admin-context.test.ts
  - src/app/(app)/error.tsx
  - src/app/(auth)/error.tsx
  - src/app/(guest)/error.tsx
  - src/app/(marketing)/error.tsx
  - src/app/admin/error.tsx
  # The root boundary shares RouteError's screen, and global-error has the same Try again.
  - src/app/error.tsx
  - src/app/global-error.tsx
  - src/app/global-error.test.tsx
  - src/components/shared/route-error.tsx
  - src/components/shared/route-error.test.tsx
  - src/components/marketing/marketing-route-error.tsx
  - src/app/(print)/dashboard/[eventId]/print/
  # The print page joins the host app's `drawnBy` (the screen's one importer list), and its source pin read notFound().
  - src/app/not-found.test.ts
  - src/app/(app)/dashboard/new/create-flow.test.tsx
  - src/lib/guest/reconcile-album-items.ts
  - src/lib/guest/reconcile-album-items.test.ts
  - src/components/guest/gallery-live.tsx
  - src/components/guest/gallery-live.test.tsx
  - src/components/guest/live-gallery.tsx
  - src/components/guest/live-gallery.test.tsx
  - src/components/guest/album-boundary.tsx
  - src/components/guest/event-experience.tsx
  - src/components/guest/event-experience.album.test.tsx
  # Its GalleryLive fixture takes the two new fields.
  - src/components/guest/reel/live-reel-view.test.tsx
  - src/lib/events/event-blocks.ts
  - src/lib/events/event-blocks.test.ts
  # Its Only me pin read a newcomer's standing ask as "door", the case this lane fixes.
  - src/lib/db/queries/event-blocks.test.ts
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/host-app.md
  - docs/systems/guest-flow.md
  - docs/systems/admin-observability.md
---

# lp/crumbs-30

**Goal.** Six ROADMAP items: the portal's gate read cached per request, Try again that re-fetches, the print sheet's dead link drawn, a failed album keeping her tracker, an empty album's first photograph glowing for a guest, and Let back in's words at Only me for a declined newcomer.

## The brief

Six items the ROADMAP holds (each is its line there; find it by the words quoted), each fixed at its root with a test that fails on today's code:

- **The portal's gate read, cached per request** (from `crumbs-28`): `requireAdmin()` (`src/lib/auth/admin-context.ts`) is not request-cached. Its gate read is a `getUser()` round trip plus the profile's `is_admin`, so every portal page pays it in the layout and again in the page, and a record page a third time for its title. `cache()` it, as `getRequestAuth` is. It must still re-verify with `getUser()`, never `getSession()`.
- **Try again that tries again** (from `crumbs-28`): each route's `error.tsx` screen (`(app)`, `(auth)`, `(guest)`, `(marketing)`, `admin`) calls `reset` for Try again. `reset` re-renders without re-fetching, so an error a Server Component threw comes straight back. Next 16.2 hands `error.js` an `unstable_retry` (the router's refresh with the reset); doc-check it in `node_modules/next/dist/docs/`. Or the screens could refresh as `album-boundary.tsx` does. One way for all five.
- **The print sheet's dead link** (from `crumbs-28`): `(print)/dashboard/[eventId]/print` still throws `notFound()` for an event that is gone, with no nearer boundary: the root's error shell, white until its script runs. Draw the not-found itself, as the hub now does (a soft 404, titled, noindex).
- **An album that could not load keeps her tracker** (from `crumbs-28`): the tracker's list rides the album's live source, so while the album says it could not load, her Add still sends but her uploads list will not open. A store that took its own first sync when the seed failed would keep the list, and heal with no refresh.
- **A real empty album's first photograph glows for a guest too** (from `crumbs-27`): `newArrivalIds` answers nothing for an empty last snapshot. That seed rule exists for a teaser's and a locked page's empty answers. The store's `status` is `ready` for a real album, which would let the guest glow it as the host does.
- **Let back in's landing at Only me for a declined newcomer** (from `crumbs-29`): it reads "back at the door, and you can let them in from there". But Only me shuts everyone until the host opens it, so letting her in there leaves her at a closed album. `blockedLanding` (`src/lib/events/event-blocks.ts`) should say so there, in the product's voice beside its other landings.

**Verify:**
- the gate;
- each item's test red on today's code;
- on localhost, drive what runs there.

The portal and the signed-in hub cannot run on localhost, so name their steps for the next build's red-team in your Handoff.

**Will's desk is up:** `disposable-mode`, `event-ready` and `locked-door` describe the guest page, the hub and the door. Change no word or behaviour their asks describe, beyond these fixes. If the lab crawl's PREMISE line names a board your change reaches, say in your Handoff why its asks still hold.

**Paths:** your owns are a start. Add each file to `owns` in your manifest before editing, or name a one-line exception. No SQL.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- **Which 404 does the print sheet draw for an event that is gone?** Recommended, and built: the host app's own
  ("We couldn't find that event", Back to dashboard, Create an event, the help line), titled "Event not found",
  noindex, a soft 404 at 200, the same answer the hub, Review, Guests and the reel's old room give for the same event:
  the sheet is one of the event's pages (its URL sits under the event's, and its one door is the hub's). It stands on
  the print group's paper, in the app's gutter, with no header (the group draws no shell). The other answer is the
  root's site 404 (the marketing header, the trail, the footer) the ROADMAP line named: what a thrown `notFound()`
  shows there today once the script has run, but it is the lost visitor's page, not a host's.
- **Try again, everywhere: the framework's retry, and a word while it tries?** Recommended, and built: every crash
  screen's Try again is Next 16.2's `unstable_retry` (the router's refresh and the reset in one transition, the doc's
  own recommendation over `reset`), the five groups' plus the root boundary's (it shares the screen) and
  `global-error`'s (its own button, the same bug). While the refresh is in flight the button reads "Trying again…" and
  waits, the album card's own words and behaviour, so a retry that fails again is seen to have been tried.
- **The album that could not load: what stands, and what heals it?** Recommended, and built: a failed seed no longer
  throws. The live source reports it (as the album's boundary did), stands with nothing embedded, and takes its own
  first sync: the album draws its skeleton while that read is in flight, then the album, or "The album didn't load"
  with Try again if it failed too, and the next poll, a doorbell, her own upload or Try again (the store's own sync,
  no page refresh) heals it. Her uploads list, the reel and the door's light keep their source throughout, and the
  header keeps the page's count until an answer lands. The album's boundary stays, for a crash while drawing it.
- **Let back in, a declined newcomer, Only me: the words?** Recommended, and built: "They'll be back at the door.
  You can let them in from there, but Maya's 30th is Only me right now, so they'll meet a closed album until you open
  it." (the door's sentence, then the Only me landing's own clause); the toast stays "Wren is back at the door."

## System-doc edits (in place, owned facts only)

- `docs/systems/admin-observability.md` "The seam": the gate read is `cache()`d once a request; an action reads it
  afresh.
- `docs/systems/host-app.md` "An event that is gone": the print sheet draws the host app's not-found too.
- `docs/systems/design-system.md` "Errors": Try again is `unstable_retry` on every crash screen, with its pending words.
- `docs/systems/guest-flow.md` "Live gallery": a failed seed leaves the source standing and healing itself (the album
  boundary keeps a crash), read through `Promise.resolve` since the page's promise is React Flight's thenable; the
  arrival's seed rule reads an answer that was no album, so a real empty album's first photograph arrives.
- `docs/systems/host-app.md` "The door, the host's side": Let back in's landing for a newcomer whose ask stands at
  Only me (`door_only_me`).

## Deferred (ROADMAP one-liners, bucket named)

- none

## Handoff (replaces the chat report)

Logs and walk records are in `/Users/gibby/local/ai/partyreel-wt/_scratch/crumbs-30/` (named below by file).

- **Commits, pushed:** `5cf77c73` (this manifest's owns and Questions), `e652b339` (the work), `e05cdafe` (the seed read
  through `Promise.resolve`, found on the local walk, below), `c6303602` (its guest-flow line); the head is in the chat
  line. **No sync:** launch-prep moved by `a39b0129` (crumbs-29's migrations, `src/lib/db/types.ts` regenerated) and
  records (`c2e42a6f` cutting crumbs-31, `2cc62130`); none touches a file of this lane or one of its reads, nothing
  conflicts, and crumbs-31's owns do not overlap these.
- **Gates on `e05cdafe`** (`c6303602` and this commit are doc lines), each on its own exit code: `pnpm typecheck` 0
  (`typecheck-2.log`), `pnpm lint` 0 with no warning (`lint-2.log`), `pnpm test` 0, 669 files and 7,973 tests
  (`test-3.log`), `zsh scripts/build-lock.sh pnpm build` 0 (`build-2.log`), `pnpm lab:smoke --base
  http://localhost:3132` 0, 174 checks and 0 failing (`lab-smoke-1.log`).
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` is 35 paths, every one under `owns`, this file or a
  doc under System-doc edits (a script checked each against the lists). The claims beyond the brief's are listed in
  `owns` with their reason; `album-boundary.test.tsx` was released, unused.
- **The portal's gate read:** `readGate` is `cache()`d and rides `getRequestAuth`'s one `getUser()`
  (`admin-context.ts`): the layout, the page and a title share one `getUser()` and one `is_admin` a request, another
  request and every Server Function read afresh, and nothing reads `getSession()` (`admin-context.test.ts`; red on the
  old code, 3 reads: `red-1-admin-context.log`).
- **Try again:** `TryAgain` (`route-error.tsx`) calls Next 16.2's `unstable_retry` on the five groups', the root's and
  (inline) `global-error`'s screens, reading "Trying again…" while it asks (`route-error.test.tsx`, driving Next's own
  `ErrorBoundary`: a crash in one payload drawn from the next; `global-error.test.tsx`; red: `red-2-route-error.log`,
  `red-2-global-error.log`). On `next start`, the boom probe's Try again read "Trying again… [disabled]", sent the
  router's `_rsc` refresh and left the screen standing as the probe crashed again (`local-2-boom-retry.json`).
- **The print sheet's 404:** drawn, never thrown: `if (!event) return <PrintNotFound />;`, the host app's screen in the
  shell's gutter, and `generateMetadata` answers `appNotFoundMetadata` ("Event not found", noindex) (`page.test.tsx`
  beside it; red: `red-3-print.log`; `not-found.test.ts` names it in the host app's `drawnBy`).
- **The album that could not load:** `readSeed` reads a failed seed and never throws it (Next's own throws pass on);
  the source reports it (`render:guest`, seam `album`), stands, and reads the album with its own first sync; the view
  draws the skeleton while that read is in flight, then `AlbumFailedCard` with Try again (the store's sync), and any
  later answer heals it; the header keeps the page's count (`gallery-live.tsx`, `live-gallery.tsx`;
  `gallery-live.test.tsx`, `live-gallery.test.tsx`; red: `red-45-view-and-provider.log`). ★ **The local walk found
  every album load failing on `e652b339`**: the page's promise is React Flight's thenable, whose `then` chains nothing,
  so `use()` got `undefined`; `e05cdafe` adopts it with `Promise.resolve` and mounts the provider on a Flight-shaped
  thenable in the tests (red before it: `red-4-flight-thenable.log`). With faults injected in a flag-file patch (never
  committed): a failed seed healed at once by the source's own `/sync`, and with the sync failing too the album's own
  card stood in the album's column with the page's count, Add photos and Invite, and its Try again read "Trying
  again…" and healed it with `/sync` and `/media` alone, no page refresh (`local-4-unread-album.json`). On `next start`
  the seeded album still draws from the page with no album request (`prod-album.html`, one tile in the HTML).
- **An empty album's first photograph:** `albumOnScreen` names an answer that was no album (teaser, locked, unread),
  and `newArrivalIds` diffs a real empty album like any other (`reconcile-album-items.ts`; its test and
  `gallery-live.test.tsx`; red: `red-5-reconcile.log`, `red-45-gallery-live.log`). Live on localhost: the only
  photograph of "Reel lane probe one (disposable)" set pending (the album empty), then approved: its tile came in
  through the real doorbell carrying `data-arrived` 1.7 s later (`local-5-empty-album-arrival.json`); the row ends
  approved, as it began.
- **Let back in at Only me:** a newcomer whose ask stands there lands at `door_only_me`, whose line is the fourth
  Question's and whose toast is the door's (`event-blocks.ts`; `event-blocks.test.ts`, and `db/queries/event-blocks.test.ts`
  reshaped with its scar; red: `red-6-event-blocks.log`).
- **For the next build's red-team** (none runs on localhost): (1) the portal as partyr33l through the chooser: an
  account and an album record render and title as before, and Supabase's auth log shows one `GET /auth/v1/user` a
  portal page load (a record page made three); signed out, `/admin/reports` still lands on `/login?next=%2Fadmin%2Freports`,
  and willg97 still meets the 404. (2) As willg97, `/dashboard/<a deleted or foreign event>/print` serves "We couldn't
  find that event" in its HTML, tab "Event not found · Partyreel", noindex, a 200; a live event's sheet is unchanged.
  (3) `/design/lab/tools/boom?key=` on the alias: Try again reads "Trying again…", an `_rsc` request goes out, the
  screen stands. (4) Decline a waiting newcomer at an approve album, switch it to Only me, then Blocked, Let back in:
  the confirm reads the new line, the toast "<name> is back at the door." (5) A guest on a real empty album while
  another phone adds its first photograph: it arrives glowing; at a moderated album a guest's uploads list opens as
  before.
- **Will's desk (PREMISE, `lab-smoke-1.log` lines 6 to 8):** disposable-mode, event-ready and locked-door were named
  because `guest-flow.md`, `host-app.md` and a comment in `event-experience.tsx` changed. Their asks hold: the edits are
  the album's failure state and an empty album's first arrival (guest-flow), the print sheet's 404 and Let back in's
  Only me words (host-app); none is a thing an ask describes (the camera, the undeveloped album, the wall, the peek,
  create, video, cost, save; the checklist, the settings guide, Create's hand-off, the dashboard's needs, the hub
  code's look per door; the guest's door screens and the 404's look), and no word or behaviour of theirs moved.
- **Assets requested from Will:** none. **Proposed migrations / Worker / Vercel / Stripe / env changes:** none.
- **Board ideas:** disposable-mode's develop moment under the arrival grammar: a roll appearing whole at 9 am in an
  album that was empty would now light every photograph at once, so the reveal's motion is a question of its own.
- **Calls his to overrule:** the print sheet's 404 is the host app's, not the root's site 404; "Trying again…" on
  every crash screen while it asks; an unread album's skeleton then card, its Try again the album's own read; the Only
  me newcomer's words; a failed seed is still reported as `render:guest`, seam `album`, though nothing crashes now,
  so the issue stream keeps one home for it.
- **Look at first:** `readSeed` and `albumRead` in `gallery-live.tsx` (the Flight thenable, `Promise.resolve` first),
  then `local-4-unread-album.json`.
