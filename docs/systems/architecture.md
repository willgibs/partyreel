# Architecture: the whole picture

Open this when you:
- work across systems and need the map: the route groups, the two stores of truth, the data flows, the daily jobs;
- add a route group, a scheduled job, or a mutation that revalidates a path;
- chase a host page that renders but never hydrates.

The per-system depth is in the index, [`../SYSTEMS.md`](../SYSTEMS.md); the stack and the universal rules are [CLAUDE.md](../../CLAUDE.md)'s.

## One app, one domain

The route groups under `src/app/` split one Next app: `(marketing)` the public site, `(auth)` sign-in and the callback,
`(app)` the signed-in host app, `(print)` the print pages without the app shell, `(guest)` the event link `/e/[token]`
and the public profile `/u/[slug]`, `(dev)` the key-gated design lab, `admin/` the operations portal, `api/` the route
handlers.
- **One domain is the growth loop:** a scanned QR, a shared album and the marketing site are one recognizable origin,
  one cookie domain and one deploy. Every surface shares the root layout and its bundle baseline, so the root stays
  minimal and each group carries its own chrome. The portal is the one exception, on its own subdomain and Vercel
  project from this same tree: it faces nobody the loop needs, and a separate origin protects it best
  ([admin-observability.md](admin-observability.md)).
- **Sign-in lives in `(auth)`, outside `(app)`,** because the `(app)` layout sends a signed-out visitor to `/login`,
  and a `/login` under that gate would redirect to itself forever.
- **The `(app)` layout's `getUser()` is routing, not security** (the boundary is RLS and the re-check in every Server
  Function and route: [database-security.md](database-security.md)). Anything that needs a signed-in host lives under `(app)`, every
  signed-out entry point stays outside it, and a new group inherits no gate: `(print)` declares its own.

## Two stores of truth, and how data moves

Rows live in Postgres (Supabase); media bytes in the R2 bucket `partyreel` (`events/…`); profile photos in Supabase
Storage, derivable and so outside the R2 backup. Each store's backup runs off the app, on Cloudflare and GitHub Actions,
so a backup failure is a durability risk, never an outage (the mechanics: [durability-backups.md](durability-backups.md)).
- **Write:** the phone PUTs to a presigned URL on the primary bucket; its `object-created` event queues a copy into the
  locked backup bucket; `create_media` writes the row and the ledger and enforces the cap and ingress
  ([uploads-and-r2.md](uploads-and-r2.md)).
- **Read:** the app presigns a GET and the browser pulls the bytes straight from the primary. The backup is never in
  the read path, and raw keys never reach the browser.
- **Delete:** a soft delete opens the 30-day window; the purge cron then reclaims the row and the primary object, while
  the backup copy stays under its lock ([lifecycle-recovery.md](lifecycle-recovery.md)).
- **Back up and restore:** Supabase's daily backup plus a nightly off-site dump; a full restore needs BOTH the rows and
  a bucket-to-bucket copy of the bytes.

## The scheduled jobs

Three runners, staggered: the Vercel cron `/api/cron/purge` (04:00 UTC, the lifecycle sweeps and the orphan sweep's
breaker, on the app project only), the backup Worker's `scheduled()` (05:00 UTC reconcile; Mondays 06:00 UTC the
deletion-aware prune) and the GitHub Action `db-backup.yml` (06:00 UTC, the off-site dump). Each is independent and
reports through the one heartbeat table ([admin-observability.md](admin-observability.md) "Backend jobs").

## Caching and revalidation

Every signed-in and guest page is dynamic (it reads cookies), and the client router keeps dynamic segments fresh by
default, so a server action's `revalidatePath` is belt and braces: it names only the paths whose rendered data the
action changed. The guest gallery is outside this system: its client fetches through the poll and the doorbell
([guest-flow.md](guest-flow.md)).

The streaming contract: plain `<Suspense>` and `loading.tsx` (the guest gallery, the dashboard skeletons). Experimental
Next features stay off until the surfaces settle after launch; `cacheComponents` and `"use cache"` above all would
invert the dynamic-by-default contract app-wide, moving every dynamic read behind `"use cache"` or an explicit
Suspense across every surface at once.

## Host-page hydration

★ **Host-page hydration fails silently in production, and dev hides it.** A hydration MISMATCH in production React
bails out of the whole subtree, so no handler attaches and the UI is dead with no console error, while dev recovers
from the same mismatch by re-rendering: a regression can pass every local check and break only in production.
- **Tooltips live in the viewer only.** Radix `Tooltip`s on the SSR'd gallery tile actions left the host gallery
  unhydrated in production. The viewer is client-only (`ssr: false`), so rich client UI (tooltips, nested `asChild`)
  is safe there; SSR'd tiles keep the native `title`.
- **A soft refresh (`router.refresh()`) re-renders without remounting,** so a mount-only effect on a ref never attaches
  to a node that first appears through a refresh (a password unlock turning access on, say): a sentinel whose node can
  appear after mount takes a callback ref.
- **The gate cannot see RSC serialization errors:** a function, a class instance or a Set passed across the
  server-to-client boundary builds and typechecks, then fails at render. Moving code across the boundary, render the
  page.
- **Verifying hydration:** CDP and the Chrome MCP are unreliable on the heavy host page (a programmatic `.click()` may
  not fire React's delegated events, and fiber inspection reports a working page as unhydrated). The gated probe at
  `/design/library/compositions` renders the real `HostMediaGrid` inside `LikesProvider`, where those checks are
  reliable; a human's own browser on the real host page is the ground truth.
