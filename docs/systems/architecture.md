# Architecture — the whole picture

> ROLE: the orienting mental model — how the pieces fit, end to end. Read this FIRST when you've "lost the thread."
> BELONGS HERE: stack shape, route groups, the two stores of truth, the media/DB data flows, the daily jobs. · NOT HERE: per-system depth (→ the sibling `docs/systems/*` docs), current state (→ `../STATUS.md`).
> GROWS BY: integrate-in-place (refine the model; never append dated blocks).

## What Partyreel is, in one breath

One **Next.js 16** app (App Router, `src/`, TS, Tailwind v4) on **one domain**. A host creates an event,
gets a QR, guests scan it and upload photos/videos from their phones (no app, no account), the host
curates, and a public album results, every QR seeding the next host. Data in **Supabase** (Postgres +
RLS + capability RPCs); media bytes in **Cloudflare R2**; payments **Stripe**; email **Resend**;
errors **Sentry**.

## Route groups (one app, one repository)

```
src/app/
  layout.tsx        # the ONLY root layout (html/body, fonts, Providers, Toaster)
  (marketing)/      # public site: /, /pricing, /features, /events, /help, /blog, legal
  (auth)/           # public: /login, /auth/callback  (NOT gated — see below)
  (app)/            # GATED host app: /dashboard …  layout runs getUser() → redirect /login
  (guest)/          # the token surface: /e/[token]  (the single event link, config-driven)
  admin/            # the ops portal: its OWN Vercel project, on admin.partyreel.com
  api/              # route handlers
```

- **Login lives in `(auth)`, not `(app)`, on purpose:** the `(app)` layout redirects anon → `/login`;
  if `/login` were under that gate it would redirect to itself forever.
- **The `(app)` layout's `getUser()` is convenience ROUTING, not the security boundary** (that is RLS plus
  the re-check in every Server Function and route handler → [database-security.md](database-security.md)).
  The split still has to be honored when a route is added: anything needing a signed-in host goes under
  `(app)`, and every unauthenticated entry point stays out of it.
- **One domain is the growth loop, not a deployment convenience:** a scanned QR, a shared album and the
  marketing site are the same recognizable origin, one cookie domain, one deploy. The price is that all
  four surfaces share the root layout and its bundle baseline, so the root layout stays minimal and each
  group carries its own chrome. The ops portal is the one deliberate exception, below: it faces nobody the
  loop needs and it is the surface a separate origin most protects.
- **One tree, two deployments (the admin split, 2026-09-18).** `admin/` is built from THIS repository by a
  SECOND Vercel project, `partyreel-admin`, which differs from `partyreel` by one variable:
  `NEXT_PUBLIC_SURFACE` (`admin` vs `app`; unset serves both, which is also the rollback). Its only reader
  is [`src/lib/surface`](../../src/lib/surface), and `src/proxy.ts` applies it before every other rule, so
  the admin host serves an allow-list (`/admin`, sign-in, MFA, the cron route, the design-gate probe) and
  the apex 404s `/admin` whatever the Host header says. Two projects, not two repositories, because Will's
  base requirement is one Orchestrator across every surface in a single chat: a shared token, component or
  schema change has to reach the portal in the same commit that makes it. The three daily jobs stay on the
  app surface, since `vercel.json` registers its cron on BOTH projects and the purge route answers and
  stops on the admin one. Full perimeter + the cutover facts:
  [admin-observability.md](admin-observability.md).
- The always-dark **`gallery`** surface is unused as a full page (the one-link view-only state shipped as
  a panel-removal on the themed event page); its `--gallery` tokens persist for the lightbox
  backdrop + `SaveEventButton`'s `tone="gallery"`. → see [uploads-and-r2.md](uploads-and-r2.md).

## Two stores of truth

The durability work added a **backup shadow for each**, all running OFF the app (Cloudflare +
GitHub Actions), so a backup failure is a durability risk, **never a user-facing outage**.

- **Postgres rows** (Supabase) — events, media _metadata_, profiles, guests, ledgers, …
- **Media bytes** (R2 bucket `partyreel`) — the photos/videos (`events/…`). Profile avatars live separately
  in Supabase Storage (public `avatars` bucket); derivable, so they ride Supabase infra durability, not this R2 WORM shadow.

## Data flows (the overview — mechanics live in [durability-backups.md](durability-backups.md))

- **Media write:** phone → app → presigned PUT → PRIMARY R2 (`events/…`) → R2 fires `object-created` →
  Cloudflare Queue → the backup Worker copies the object → BACKUP R2 (locked). The DB row + ledger are
  written by `create_media` (cap + ingress enforced). → [uploads-and-r2.md](uploads-and-r2.md).
- **Media read:** app reads the row → presigns a GET → the **browser pulls bytes straight from PRIMARY
  R2** (the backup is never in the read path; raw R2 keys never reach the browser).
- **Media delete / lifecycle:** soft-delete flag → 30-day recovery window → the purge cron reclaims the
  row + the PRIMARY R2 object (the BACKUP copy is kept + locked). → [lifecycle-recovery.md](lifecycle-recovery.md).
- **Database backup:** Supabase Pro daily backup (same-vendor) **plus** a nightly off-site `pg_dump` →
  `partyreel-backup/db/` (GitHub Action, longer retention, survives a whole-account loss).
- **Restore (DR):** rows ← Supabase backup OR the `db/` dump; bytes ← copy `partyreel-backup` →
  `partyreel`. A full restore needs **both** halves.

## Three staggered daily jobs (each independent, each try/caught)

| Time (UTC) | Runner | Job |
| --- | --- | --- |
| `04:00` | Vercel Cron → [`/api/cron/purge`](../../src/app/api/cron/purge/route.ts) | the 9-sweep lifecycle + the orphan-sweep circuit-breaker |
| `05:00` | Cloudflare Worker `scheduled()` ([`workers/backup/`](../../workers/backup)) | media-backup reconciliation (re-copies anything the live path missed) |
| `06:00` | GitHub Actions ([`db-backup.yml`](../../.github/workflows/db-backup.yml)) | the off-site DB dump → `partyreel-backup/db/` |

**Cost reality:** the durability roadmap added **one recurring charge, ~$5/mo Cloudflare Workers Paid**
(Queues need it). R2 is ~$0 at this scale. Full cost notes + the R2 billing-donut gotcha →
[durability-backups.md](durability-backups.md).

## Cache & revalidation (the map)

Every authed/guest page is dynamic (cookies), and Next 15+'s client-router staleTime for dynamic
segments defaults to 0 — so the `revalidatePath` calls in server actions are belt-and-braces
freshness, kept HONEST (only the paths whose rendered data the action changed), not maximal:

- **Event mutations** (`updateEventAction`, create, delete, restore, `removeMyUploadAction`) →
  `/dashboard/[eventId]` + `/dashboard` (cards render name/date/visibility; the Uploads/Trash tabs
  live on `/dashboard`).
- **Password + slug actions** → `/dashboard/[eventId]` ONLY (the dashboard card badge derives from
  the visibility ENUM, never the hash; cards never render the slug).
- **Moderation/media actions** (`[eventId]/actions.ts`) → `/dashboard/[eventId]` (+ `/dashboard`
  where the Uploads tab is affected). **Admin actions** → their own `/admin/*` paths.
- The guest gallery is NOT in this system: it's client-fetched via the conditional poll + doorbell
  (→ [guest-flow.md](guest-flow.md)); `router.refresh()` appears only in guest in-page auth flows.

**`cacheComponents` / `"use cache"` is consciously DEFERRED:** enabling it
inverts the dynamic-by-default contract app-wide (every dynamic read must move behind `"use cache"`
or explicit Suspense), a forced refactor that would fight the surface decompositions still in flight.
Revisit post-launch when the surfaces are final. Streaming today = plain `<Suspense>`/`loading.tsx`
(the guest gallery + the dashboard skeletons).

**★ Host-page hydration is fragile + fails SILENTLY in prod (dev masks it).** The `(app)` pages have a
"rendered-but-never-client-hydrated, zero console errors" failure mode (first seen in the S1 dashboard
streaming deferral). A **hydration MISMATCH in prod React bails the whole subtree** (no event handlers
attach → dead UI), while DEV recovers from the same mismatch by re-rendering — so a regression can pass
every local check and break only in production.
- **Confirmed gotcha (3c.2 polish):** wrapping SSR'd **gallery TILE** actions in radix `Tooltip`s (~50
  instances + a nested `Tooltip`/`Dialog` on Remove) caused exactly this — the host gallery subtree never
  hydrated on prod. Fix: tooltips are **LIGHTBOX-ONLY**. The lightbox (`MediaLightboxLazy`) is
  `dynamic(..., { ssr:false })` = client-only = NO SSR = it **cannot** cause a hydration mismatch, so rich
  client UI (radix tooltips, nested asChild) is safe there; SSR'd tiles must stay simple (native `title`).
- **A soft RSC refresh (`router.refresh()`) re-renders WITHOUT remounting** — so a sentinel/observer
  hook with a mount-only `[]`-effect (early-return on a null ref) never attaches when its node first
  appears via such a refresh (e.g. a password unlock flipping access none→full). Use a CALLBACK ref
  for any sentinel whose node can appear post-mount.
- **The gate has a blind spot here: `pnpm build` + `typecheck` do NOT catch RSC serialization errors**
  (passing a non-serializable prop — a function, a class instance, a Set — across the server→client
  boundary). The break surfaces only at RUNTIME render, same silent-in-prod family as the mismatch
  above. When you move code across the boundary, render the page (local or preview), don't trust a
  green gate.
- **Verifying host-page hydration:** the **CDP / Chrome-MCP is UNRELIABLE on the heavy `(app)` host page** —
  a programmatic `.click()` doesn't reliably fire React 19's delegated events there, and react-fiber
  inspection FALSE-NEGATIVES (both wrongly read "not hydrated" on a working page). Use the two reliable
  instruments instead: (1) the **gated, auth-free hydration probe** `/design/library/compositions` (it wraps the
  real `HostMediaGrid` in `LikesProvider` = a faithful host-gallery render with no auth/heavy-layout noise;
  light enough that the CDP + react-fiber checks ARE reliable on it), and (2) **a human's real browser** on
  the actual host page (the ground truth). Don't trust a CDP "not hydrated" verdict on the host page.

## Where each concern lives

The full index is [`README.md`](README.md). The data layer is `src/lib/db/*` (queries/mutations, never
inline SQL in components); the boundary is RLS + SECURITY DEFINER capability RPCs →
[database-security.md](database-security.md). Clients are `src/lib/supabase/{client,server,middleware,admin}.ts`.

## See also

- [durability-backups.md](durability-backups.md): the three durability pillars.
- [uploads-and-r2.md](uploads-and-r2.md): presigned uploads, and why raw keys never reach the browser.
- [`../SYSTEMS.md`](../SYSTEMS.md) — the per-system index; [`../PRD.md`](../PRD.md) — the product why.
