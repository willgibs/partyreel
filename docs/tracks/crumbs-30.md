---
track: crumbs-30
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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
  - src/components/guest/album-boundary.test.tsx
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
  boundary keeps a crash); the arrival's seed rule reads an answer that was no album, so a real empty album's first
  photograph arrives.
- `docs/systems/host-app.md` "The door, the host's side": Let back in's landing for a newcomer whose ask stands at
  Only me (`door_only_me`).

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
