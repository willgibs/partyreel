# Partyreel — Systems index

> ROLE: the router — find the system your task touches, follow it to its deep doc. Skim this when a goal lands.
> BELONGS HERE: one short "what it is" line per system + its `systems/` doc. · NOT HERE: the depth/gotchas (→ the linked `systems/<x>.md`), how-we-work (→ [`../CLAUDE.md`](../CLAUDE.md)), current state (→ [`STATUS.md`](STATUS.md)), what's next (→ [`ROADMAP.md`](ROADMAP.md)).
> GROWS BY: integrate-in-place (one row per system; when a new system ships, add a row + its deep doc).

The deep docs live in [`systems/`](systems); each is one Read with what-it-does · where-it-lives ·
invariants · gotchas. (This table IS the router — there is no separate folder README.)

## Shape

One **Next.js 16** app (App Router, `src/`, TS, Tailwind v4) on **one domain**. Route groups:
`(marketing)` public site · `(auth)` login/callback · `(app)` the gated host app · `(guest)` the
`/e/[qr_token]` event link · `admin/` the ops portal (on `admin.partyreel.com`) · `api/` route handlers.
Data in **Supabase** (Postgres + RLS + capability RPCs); media bytes in **Cloudflare R2**; payments
**Stripe**; email **Resend**; errors **Sentry**. The whole-picture data flow (two stores of truth, the
media/DB write·read·delete·backup·restore pathways, the 3 staggered daily jobs) is in
[`systems/architecture.md`](systems/architecture.md).

## The systems

| System | What it is | Deep doc |
| --- | --- | --- |
| **Architecture** | The whole-picture mental model: route groups, the two stores of truth, data flows, the 3 daily jobs | [architecture.md](systems/architecture.md) |
| **Auth & accounts** | Host/operator auth (email+password · OTP/magic-link · Google), identity linking, avatars, display names, the `profiles` column-lock | [auth-accounts.md](systems/auth-accounts.md) |
| **Guest flow** | The `/e/[qr_token]` event page: 3-state visibility, capability tokens, password/unlock, the `allow_anonymous_uploads` account gate, silent join, the live gallery, demo mode | [guest-flow.md](systems/guest-flow.md) |
| **Host app** | The host's event surfaces: create wizard, QR designer, custom slug, first-time welcome, settings, host-side moderation/curation, the host-upload entry | [host-app.md](systems/host-app.md) |
| **Uploads & R2 (media)** | The media system: presign/complete (guest + host), the `create_media*` write path, R2 config, keys/delete, galleries, the lightbox, downloads, the video poster | [uploads-and-r2.md](systems/uploads-and-r2.md) |
| **Billing & caps** | The entitlement engine: the storage-cap model (`host_active_bytes`, monthly ingress), video gating, Stripe checkout/portal/webhook + provisioning, the Event Pass ledger (stacking + prorated Pro credit) | [billing-caps.md](systems/billing-caps.md) |
| **Lifecycle & recovery** | The daily purge cron (9 sweeps), the 30-day "Recently deleted" recovery (restore/purge RPCs + bins), `sendOnce`/Resend lifecycle email | [lifecycle-recovery.md](systems/lifecycle-recovery.md) |
| **Durability & backups** | The orphan-sweep circuit-breaker, the media-backup Worker (→ locked 2nd R2 bucket), the off-site DB backup, the restore (DR) procedure | [durability-backups.md](systems/durability-backups.md) |
| **Admin & observability** | The `admin.partyreel.com` portal (the `requireAdmin` seam + MFA + every surface), the reports/safety queue, Sentry | [admin-observability.md](systems/admin-observability.md) |
| **Marketing & content** | The `(marketing)` site + nav, the frame library, the MDX help/blog pipeline, SEO/OG, the 404 boundaries, the demo env wiring | [marketing-content.md](systems/marketing-content.md) |
| **Notifications · analytics · growth** | The derive-on-read host bell, `link_stats` (aggregate, no PII), saved events, guest email capture | [notifications-analytics-growth.md](systems/notifications-analytics-growth.md) |
| **Profiles & social** | Public creator profiles (`/u/[slug]`), the follow/block graph, the host-controlled guest list, notification-pref storage (P1-P3 live since milestone-2) | [profiles-social.md](systems/profiles-social.md) |
| **Database & security** | The cross-cutting security model: RLS shapes, the capability-RPC inventory, the advisor 0028/0029 split, the column-grant lockdown lessons, the migrations workflow | [database-security.md](systems/database-security.md) |
| **Trust & safety (forensics)** | Per-upload forensic capture (`upload_forensics`), legal hold + purge exclusions, the evidence-preservation store, `/admin/forensics`, the CSAM incident runbook + NCMEC prep | [trust-safety-forensics.md](systems/trust-safety-forensics.md) |
| **Design system** | The visual system: achromatic tokens (media is the colour), the heading face and the tiered scale, rounding/elevation/motion contracts, the error taxonomy + render boundaries, the craft guidance stack, the `/design` lab (the Library at `/design/library`, the Lab at `/design/lab`); the authority model of everything that binds design work is [design/README.md](design/README.md) | [design-system.md](systems/design-system.md) |
| **Testing & verification** | Cross-cutting: the live-testing tool blind-spots (Chrome-MCP `sonner`/isolated-world DOM, the Vercel dev Toolbar overlay) + the "hand the human the look" pattern. The local-first-then-live POLICY itself stays in [`../CLAUDE.md`](../CLAUDE.md). | [testing-verification.md](systems/testing-verification.md) |

## Highlight reel — SHIPPED (the North Star)

The reel is a full host + guest feature: curation (`reel_items` + add/reorder), the **canvas engine**
(`src/lib/reel/engine/` — ONE draw function powers the live `CanvasReelPlayer` AND the on-device
WebCodecs `.mp4` export; $0 at any scale), the 14-style catalog + orientation, the Studio room
(studio-first), guest surfacing + download (a host publish switch), and tier-capped length.
The original Remotion/Lambda render path was torn down 2026-07-08. Current truth:
[host-app.md](systems/host-app.md) "Reel" (which also holds the settled product shape) +
[guest-flow.md](systems/guest-flow.md). (`media.highlight_score`/`reel_eligible` stay dead
scaffold for a future auto-scoring worker.)
