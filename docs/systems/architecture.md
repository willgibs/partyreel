# Architecture: the whole picture

Open this when you:
- work across systems and need the map: the route groups, the two stores of truth, the data flows, the daily jobs;
- add a route group, a scheduled job, or a mutation that revalidates a path;
- add a poll, a prefetch, a client fetch or a proxy matcher change (each multiplies calls: the compute budget);
- chase a host page that renders but never hydrates.

The per-system depth is in the index, [`../SYSTEMS.md`](../SYSTEMS.md); the stack and the universal rules are
[CLAUDE.md](../../CLAUDE.md)'s.

## One app, one domain

The route groups under `src/app/` split one Next app: `(marketing)` the public site, `(auth)` sign-in and the callback,
`(app)` the signed-in host app, `(as-guest)` See it as a guest (`/dashboard/<id>/as-guest`: the guest's canvas, never
the host's shell), `(print)` the print pages without the app shell, `(guest)` the event link `/e/[token]` and the
public profile `/u/[slug]`, `(dev)` the key-gated design lab, `admin/` the operations portal, `api/` the route
handlers.
- **One domain is the growth loop:** a scanned QR, a shared album and the marketing site are one recognizable origin,
  one cookie domain and one deploy. Every surface shares the root layout and its bundle baseline, so the root stays
  minimal and each group carries its own chrome. The portal is the one exception, on its own subdomain and Vercel
  project from this same tree: it faces nobody the loop needs, and a separate origin protects it best
  ([admin-observability.md](admin-observability.md)).
- **The `(app)` layout's `getUser()` is routing, not security** (the boundary is RLS and the re-check in every Server
  Function and route: [database-security.md](database-security.md)). A new group inherits no gate: `(print)` and
  `(as-guest)` declare their own, and every signed-out entry point stays outside `(app)`, sign-in included (a `/login`
  under its redirect would redirect to itself).
- **Every response carries one set of security headers** (`src/lib/security-headers.ts` through `next.config.ts`'s
  `headers()`, on both Vercel projects and the proxy's 404 rewrites; `security-headers.test.ts` holds the set). ★ No
  other site may frame the app (`frame-ancestors 'self'`, `X-Frame-Options: SAMEORIGIN`); the app frames its own pages,
  so such a frame's `src` stays root-relative, since an absolute one is another origin on a preview alias and is
  refused. The file's header says why `'self'`, and what a full CSP must carry.

## Two stores of truth, and how data moves

Rows live in Postgres (Supabase); media bytes in the R2 bucket `partyreel` (`events/…`); profile photos in Supabase
Storage, derivable and so outside the R2 backup. Each store's backup runs off the app, on Cloudflare and GitHub Actions,
so a backup failure is a durability risk, never an outage (the mechanics: [durability-backups.md](durability-backups.md)).
- **Write:** the phone PUTs to a presigned URL on the primary bucket (a `staging/` key the complete copies into
  `events/`, or a multipart assembled there); an object landing under `events/` queues a copy into the locked backup
  bucket; `create_media` writes the row and the ledger and enforces the cap and the uploads allowance
  ([uploads-and-r2.md](uploads-and-r2.md)).
- **Read:** the app presigns a GET and the browser pulls the bytes straight from the primary. The backup is never in
  the read path, and raw keys never reach the browser.
- **Delete:** a soft delete opens the 30-day window; the purge cron then reclaims the row and the primary object, while
  the backup copy stays under its lock ([lifecycle-recovery.md](lifecycle-recovery.md)).
- **Back up and restore:** Supabase's daily backup plus a nightly off-site dump; a full restore needs BOTH the rows and
  a bucket-to-bucket copy of the bytes.

## The scheduled jobs

Four runners, staggered after the purge: the Vercel crons in `vercel.json` (`/api/cron/purge` at 04:00 UTC, the
lifecycle sweeps and the orphan sweep's breaker; `/api/cron/spend-watch` at 05:00 UTC, the spend guard; both on the app
project only), the backup Worker's `scheduled()` (05:00 UTC reconcile; Mondays 06:00 UTC the deletion-aware prune), the
export Worker's heartbeat (05:30 UTC) and the GitHub Action `db-backup.yml` (06:00 UTC, the off-site dump). Each is
independent and reports through the one heartbeat table; `app/admin/jobs/catalog.ts` is the one list of jobs and their
cadences ([admin-observability.md](admin-observability.md) "Backend jobs").

## Caching and revalidation

Every signed-in and guest page is dynamic (it reads cookies), so a server action's `revalidatePath` names only the
paths whose rendered data the action changed. The guest gallery is outside this system: its client fetches through
the poll and the doorbell ([guest-flow.md](guest-flow.md)).

The streaming contract: plain `<Suspense>` and `loading.tsx` (the guest gallery, the dashboard skeletons). Experimental
Next features are off until the surfaces settle after launch, because `cacheComponents` and `"use cache"` above all
invert the dynamic-by-default contract app-wide, moving every dynamic read behind `"use cache"` or an explicit
Suspense on every surface at once.

## Compute budget

Vercel bills every call (an invocation) and its Active CPU, and Hobby stops every function past 4 CPU-hours or 1M
invocations in a rolling 30 days. ★ We scale by the event, not the user: every poll, prefetch and proxy run is
multiplied by every lit phone in the room.
- **What counts as a call:** the proxy, on every request its matcher takes and before the CDN (a static page it
  matches still costs one), which is only a page that renders a session, its RSC and prefetches included, and every
  path on the admin host (`src/proxy.ts` says why); then a dynamic page or its RSC, a route handler or a Server
  Function, one more. Static files, `/_next/image` and prerendered pages are the CDN's. ★ An API route meets an
  expired token itself and refreshes it through `lib/supabase/server.ts`, whose cookie writes land on its response;
  a page that renders a session must keep the proxy before it, since a render cannot write the refreshed cookie.
- **The rule:** a change that adds a call per poll, per page load or per photo is a regression even when every page
  looks right. `pnpm compute:model --port <yours>` (`scripts/compute-model/`, usage in `run.mjs`'s head) plays each
  guest's, visitor's and crawler's actions on a local production build, counts their calls and CPU, and fails past
  `budget.json`. Run it at milestones and with any change to the matcher, a poll, a prefetch or a client fetch; a
  lever that lands lowers its lines.
- **The headline (2026-10-04, with the proxy only where a session matters and polls that rest; `model.mjs` holds the
  assumptions):** a 100-guest wedding is ≈24,000 calls (≈27,500 with tabs left lit for hours), a month of 100 events
  ≈2.4M. Three fifths are lit albums answering other guests' uploads (a burst of ten costs every lit album ≈10 calls,
  one a sync), a fifth uploads (≈4.6 calls a photo); a guest's join is ≈5 calls and a returning load 3. A lit album's
  net is one call a poll, ≈19 in its first lit hour and none after two untouched ones. The guest page is the dearest
  call (≈250 to 420 ms of local CPU over a 1,000-photo album); a quiet poll is ≈17 to 26 ms (more when it opens a
  fresh connection after a rest).

## Host-page hydration

★ **Host-page hydration fails silently in production, and dev hides it.** A hydration MISMATCH in production React
bails out of the whole subtree, so no handler attaches and the UI is dead with no console error, while dev recovers
from the same mismatch by re-rendering: a regression can pass every local check and break only in production.
- **A Radix `Tooltip` never renders in a server-rendered first paint:** Radix Tooltips on the SSR'd gallery tile
  actions left the host gallery unhydrated in production. Rich client UI lives where the server draws nothing (the
  viewer is `ssr: false`) or mounts after hydration behind `useHydrated` (`lib/shared/use-hydrated.ts`), the server's
  paint carrying the browser's own `title`.
- ★ **A press before hydration is the browser's own submit:** a client `<form onSubmit>` with no method or action
  submits as a GET to the current address until React attaches, carrying every named field into the URL, the history
  and a server log. Every such form is a `ClientForm` (`ui/client-form.tsx`), and `client-form-policy.test.ts`
  refuses a `<form>` that names no native answer.
- **Text typed before hydration is adopted, never overwritten** (`lib/adopt-typed-value.ts`, in `Input`, `Textarea`
  and a bare controlled `<input>` through `useAdoptTypedValue`): the first render after hydration would write the
  state's `""` over it. `adopt-typed-value-policy.test.ts` refuses a raw controlled text field that skips the hook.
- **A tap before hydration is lost unless its control asks to have it kept:** React replays no press made before its
  own script runs, so a JS-only control drawn open on the server is an `EarlyPressButton` (`lib/early-press.ts`), and
  its group's layout carries the recorder's inline script, as `(auth)/layout.tsx` does.
- **Walking a press, a field or a tap before hydration:** hold the page's script requests at the network (CDP `Fetch`
  on `Script`), act, then read the page before releasing them.
- **The gate cannot see RSC serialization errors:** a function, a class instance or a Set passed across the
  server-to-client boundary builds and typechecks, then fails at render. Moving code across the boundary, render the
  page.
- **Verifying hydration:** CDP and the Chrome MCP are unreliable on the heavy host page (a programmatic `.click()` may
  not fire React's delegated events, and fiber inspection reports a working page as unhydrated). The gated probe at
  `/design/library/compositions` renders the real `HostMediaGrid` inside `LikesProvider`, where those checks are
  reliable; a human's own browser on the real host page is the ground truth.
