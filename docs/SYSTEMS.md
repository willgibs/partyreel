# Partyreel — Systems index

> ROLE: the router — find the system your task touches, follow it to its deep doc. Skim this when a goal lands.
> BELONGS HERE: one short "what it is" line per system + its `systems/` doc. · NOT HERE: the depth/gotchas (→ the linked `systems/<x>.md`), how-we-work (→ [`../CLAUDE.md`](../CLAUDE.md)), current state (→ [`STATUS.md`](STATUS.md)), what's next (→ [`ROADMAP.md`](ROADMAP.md)).
> GROWS BY: integrate-in-place (one row per system; when a new system ships, add a row + its deep doc).

The deep docs live in [`systems/`](systems); each is one Read with what-it-does · where-it-lives ·
invariants · gotchas. (This table IS the router — there is no separate folder README.)

## Shape

One **Next.js 16** app (App Router, `src/`, TS, Tailwind v4) on **one domain**. Route groups:
`(marketing)` public site · `(auth)` login/callback · `(app)` the gated host app · `(print)` the host's
print pages · `(guest)` the `/e/[token]` event link and the `/u/[slug]` profile · `(dev)` the design lab ·
`admin/` the ops portal (on `admin.partyreel.com`) · `api/` route handlers. Data in **Supabase** (Postgres +
RLS + capability RPCs); media bytes in **Cloudflare R2**; payments **Stripe**; email **Resend**; errors
**Sentry**. The whole-picture data flow (two stores of truth, the media/DB write·read·delete·backup·restore
pathways, the 3 staggered daily jobs) is in [`systems/architecture.md`](systems/architecture.md).

## The systems

| System | What it is | Deep doc |
| --- | --- | --- |
| **Architecture** | The whole-picture mental model: route groups, the two stores of truth, data flows, the 3 daily jobs | [architecture.md](systems/architecture.md) |
| **Auth & accounts** | Host/operator auth (email+password · OTP/magic-link · Google), identity linking, the name gate, avatars, display names, the `profiles` column-lock | [auth-accounts.md](systems/auth-accounts.md) |
| **Guest flow** | The `/e/[token]` event page: who a guest is (an upload of theirs, and only that), 3-state visibility, capability tokens, password/unlock, the door (a name, an optional email, the host's gates), the confirm doors and the return after one, the live gallery, demo mode, the guest reel | [guest-flow.md](systems/guest-flow.md) |
| **Host app** | The host's surfaces: the dashboard (with the Guest cards for the events an account added to), the create flow, the QR designer and print, custom slug, first-time welcome, the event page and settings (the one guest count), host-side moderation/curation, the host-upload entry | [host-app.md](systems/host-app.md) |
| **Highlight reel** | The shipped reel: host curation, the canvas engine (`src/lib/reel/engine/`: one draw function for the live `CanvasReelPlayer` and the on-device WebCodecs `.mp4` export; $0 at any scale), the 14-style catalog + orientation, the Studio, guest surfacing + download behind a host publish switch, tier-capped length | [host-app.md](systems/host-app.md) "Reel curation, the live composer, and the .mp4 export" + [guest-flow.md](systems/guest-flow.md) "The guest reel" |
| **Uploads & R2 (media)** | The media system: presign/complete (guest + host), the `create_media*` write path, R2 config, keys/delete, galleries, the lightbox, downloads, the video poster | [uploads-and-r2.md](systems/uploads-and-r2.md) |
| **Billing & caps** | The entitlement engine: the storage-cap model (`host_active_bytes`, monthly ingress), video gating, Stripe checkout/portal/webhook + provisioning, the Event Pass ledger (stacking + prorated Pro credit) | [billing-caps.md](systems/billing-caps.md) |
| **Lifecycle & recovery** | The daily purge cron (12 sweeps), the 30-day recovery window (restore/purge RPCs, the Deleted filters), `sendOnce`/Resend lifecycle email | [lifecycle-recovery.md](systems/lifecycle-recovery.md) |
| **Durability & backups** | The orphan-sweep circuit-breaker, the media-backup Worker (→ locked 2nd R2 bucket), the off-site DB backup, the restore (DR) procedure, the deletion-aware backup prune | [durability-backups.md](systems/durability-backups.md) |
| **Admin & observability** | The `admin.partyreel.com` portal (the `requireAdmin` seam + MFA + every surface), the reports/safety queue, backend jobs, Sentry | [admin-observability.md](systems/admin-observability.md) |
| **Marketing & content** | The `(marketing)` site + nav, the frame library, the MDX help/blog pipeline, SEO/OG, the 404 boundaries, the demo env wiring | [marketing-content.md](systems/marketing-content.md) |
| **Notifications · analytics · growth** | The derive-on-read host bell, `link_stats` (aggregate, no PII), the marketing web analytics, guest email capture and the newsletter opt-in | [notifications-analytics-growth.md](systems/notifications-analytics-growth.md) |
| **Profiles & social** | Public creator profiles (`/u/[slug]`) and their owner mode, the follow/block graph, the host-controlled guest list, notification-pref storage | [profiles-social.md](systems/profiles-social.md) |
| **Database & security** | The cross-cutting security model: RLS shapes, the capability-RPC inventory, the advisor 0028/0029 split, the column-grant lockdown rules, the migrations workflow | [database-security.md](systems/database-security.md) |
| **Trust & safety (forensics)** | Per-upload forensic capture (`upload_forensics`), legal hold + purge exclusions, the evidence-preservation store, `/admin/forensics`, the CSAM incident runbook + NCMEC prep | [trust-safety-forensics.md](systems/trust-safety-forensics.md) |
| **Design system** | The visual system: cool-grey tokens (media is the colour), the heading face and the tiered scale, rounding/elevation/motion contracts, the error taxonomy + render boundaries, the craft guidance stack, the `/design` lab (the Library at `/design/library`, the Lab at `/design/lab`); the authority model of everything that binds design work is [design/README.md](design/README.md) | [design-system.md](systems/design-system.md) |
| **Testing & verification** | Cross-cutting: the gate, the test accounts + fixtures, the live-testing tool blind spots (Chrome-MCP `sonner`/isolated-world DOM, the Vercel dev Toolbar overlay) + the "hand the human the look" pattern. The local-first-then-live POLICY itself stays in [`../CLAUDE.md`](../CLAUDE.md). | [testing-verification.md](systems/testing-verification.md) |
