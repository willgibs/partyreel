---
track: crumbs-30
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "8c0678cc"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/auth/admin-context.ts
  - src/app/(app)/error.tsx
  - src/app/(auth)/error.tsx
  - src/app/(guest)/error.tsx
  - src/app/(marketing)/error.tsx
  - src/app/admin/error.tsx
  - src/app/(print)/dashboard/[eventId]/print/page.tsx
  - src/lib/guest/reconcile-album-items.ts
  - src/lib/events/event-blocks.ts
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
