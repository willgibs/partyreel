# Architecture — the whole picture

> ROLE: the orienting mental model — how the pieces fit, end to end. Read this FIRST when you've "lost the thread."
> BELONGS HERE: stack shape, route groups, the two stores of truth, the media/DB data flows, the daily jobs. · NOT HERE: per-system depth (→ the sibling `docs/systems/*` docs), why-decisions (→ `../adr/`), current state (→ `../STATUS.md`).
> GROWS BY: integrate-in-place (refine the model; never append dated blocks).

## What Partyreel is, in one breath

One **Next.js 16** app (App Router, `src/`, TS, Tailwind v4) on **one domain**. A host creates an event,
gets a QR, guests scan it and upload photos/videos from their phones (no app, no account), the host
curates, and a public album results, every QR seeding the next host. Data in **Supabase** (Postgres +
RLS + capability RPCs); media bytes in **Cloudflare R2**; payments **Stripe**; email **Resend**;
errors **Sentry**.

## Route groups (one app, one domain — ADR-0002)

```
src/app/
  layout.tsx        # the ONLY root layout (html/body, fonts, Providers, Toaster)
  (marketing)/      # public site: /, /pricing, /features, /events, /help, /blog, legal
  (auth)/           # public: /login, /auth/callback  (NOT gated — see below)
  (app)/            # GATED host app: /dashboard …  layout runs getUser() → redirect /login
  (guest)/          # the token surface: /e/[token]  (the single event link, config-driven)
  admin/            # the ops portal, served on admin.partyreel.com (host-guarded)
  api/              # route handlers
```

- **Login lives in `(auth)`, not `(app)`, on purpose:** the `(app)` layout redirects anon → `/login`;
  if `/login` were under that gate it would redirect to itself forever.
- The always-dark **`gallery`** surface is unused as a full page (the one-link view-only state shipped as
  a panel-removal on the themed event page, ADR-0010); its `--gallery` tokens persist for the lightbox
  backdrop + `SaveEventButton`'s `tone="gallery"`. → see [uploads-and-r2.md](uploads-and-r2.md).

## Two stores of truth

The durability work (ADR-0013) added a **backup shadow for each**, all running OFF the app (Cloudflare +
GitHub Actions), so a backup failure is a durability risk, **never a user-facing outage**.

- **Postgres rows** (Supabase) — events, media _metadata_, profiles, guests, ledgers, …
- **Media bytes** (R2 bucket `partyreel`) — the photos/videos (`events/…`). Profile avatars live separately
  in Supabase Storage (public `avatars` bucket); derivable, so they ride Supabase infra durability, not this R2 WORM shadow.

## Data flows (the overview — mechanics live in [durability-backups.md](durability-backups.md))

- **Media write:** phone → app → presigned PUT → PRIMARY R2 (`events/…`) → R2 fires `object-created` →
  Cloudflare Queue → the backup Worker copies the object → BACKUP R2 (locked). The DB row + ledger are
  written by `create_media` (cap + ingress enforced). → [uploads-and-r2.md](uploads-and-r2.md).
- **Media read:** app reads the row → presigns a GET → the **browser pulls bytes straight from PRIMARY
  R2** (the backup is never in the read path; raw R2 keys never reach the browser — ADR-0003).
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
  the visibility ENUM, never the hash; cards never render the slug). Trimmed in Phase 3.
- **Moderation/media actions** (`[eventId]/actions.ts`) → `/dashboard/[eventId]` (+ `/dashboard`
  where the Uploads tab is affected). **Admin actions** → their own `/admin/*` paths.
- The guest gallery is NOT in this system: it's client-fetched via the conditional poll + doorbell
  (→ [guest-flow.md](guest-flow.md)); `router.refresh()` appears only in guest in-page auth flows.

**`cacheComponents` / `"use cache"` is consciously DEFERRED** (Phase 3 decision): enabling it
inverts the dynamic-by-default contract app-wide (every dynamic read must move behind `"use cache"`
or explicit Suspense), a forced refactor that would fight the Phase 4-6 surface decompositions.
Revisit post-launch when the surfaces are final. Streaming today = plain `<Suspense>`/`loading.tsx`
(the guest gallery + the dashboard skeletons, Phase 3).

## Where each concern lives

The full index is [`README.md`](README.md). The data layer is `src/lib/db/*` (queries/mutations, never
inline SQL in components); the boundary is RLS + SECURITY DEFINER capability RPCs →
[database-security.md](database-security.md). Clients are `src/lib/supabase/{client,server,middleware,admin}.ts`.

## See also

- [ADR-0002](../adr/0002-single-app-route-groups.md) — one app, route groups.
- [ADR-0013](../adr/0013-media-durability-orphan-sweep-safety-and-backup.md) — durability (the 3 pillars).
- [ADR-0003](../adr/0003-browser-r2-multipart-presigned.md) — presigned uploads / never expose keys.
- [`../SYSTEMS.md`](../SYSTEMS.md) — the per-system index; [`../PRD.md`](../PRD.md) — the product why.
