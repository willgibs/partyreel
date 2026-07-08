# System reference docs (`docs/systems/`)

> ROLE: the on-demand depth layer — open the ONE doc for the system your task touches.
> BELONGS HERE: per-system "what it does · where it lives · invariants · gotchas". · NOT HERE: how-we-work (→ [`../../CLAUDE.md`](../../CLAUDE.md)), why-decisions (→ [`../adr/`](../adr)), current state (→ [`../STATUS.md`](../STATUS.md)), backlog (→ [`../ROADMAP.md`](../ROADMAP.md)), shipping history (→ `../CHANGELOG.md`).
> GROWS BY: integrate-in-place (refine the owning doc; never append dated blocks).

## The model (two rules)

1. **Every fact has ONE home** — the doc whose question it answers.
2. **Edit in place, don't append** — refine the existing line; stale → delete.

A new gotcha lands in the system doc below that owns it (not in CLAUDE.md). If a finding is truly universal
(true regardless of which system you touch), it's a one-line rule in CLAUDE.md instead.

## The docs

| Doc | What it owns |
| --- | --- |
| [architecture.md](architecture.md) | The whole-picture mental model: route groups, the two stores of truth, the media/DB data flows, the 3 daily jobs. **Read first when you've lost the thread.** |
| [auth-accounts.md](auth-accounts.md) | Host/operator auth, the `getUser` boundary, identity linking, email+password, avatars, display names, the `profiles` column-lock. |
| [guest-flow.md](guest-flow.md) | The `/e/[token]` event page: visibility states, capability tokens, password/unlock, the `allow_anonymous_uploads` account gate, silent join, the live gallery, demo mode. |
| [host-app.md](host-app.md) | The host's event surfaces: create wizard, QR designer, custom slug, welcome, settings, host-side moderation + the host-upload entry. |
| [uploads-and-r2.md](uploads-and-r2.md) | The media system: presign/complete, the `create_media*` write path, R2 config, keys/delete, galleries, the lightbox, downloads, the video poster. |
| [billing-caps.md](billing-caps.md) | The entitlement engine: the cap model (`host_active_bytes`, ingress), video gating, the Stripe checkout/portal/webhook + provisioning. |
| [lifecycle-recovery.md](lifecycle-recovery.md) | The daily purge cron's sweeps, the 30-day recovery window + restore/purge RPCs + bin UI, `sendOnce`/Resend lifecycle email. |
| [durability-backups.md](durability-backups.md) | ADR-0013: the orphan-sweep circuit-breaker, the media-backup Worker, the off-site DB backup, the restore (DR) procedure. |
| [admin-observability.md](admin-observability.md) | The `admin.partyreel.com` portal (the `requireAdmin` seam + MFA + every surface), the reports/safety queue, Sentry. |
| [marketing-content.md](marketing-content.md) | The `(marketing)` site + nav, the frame library, the MDX help/blog pipeline, SEO/OG, the 404 boundaries, the demo env wiring. |
| [notifications-analytics-growth.md](notifications-analytics-growth.md) | The derive-on-read bell, `link_stats`, saved events, guest email capture. |
| [profiles-social.md](profiles-social.md) | Public creator profiles (`/u/[slug]`), follows/blocks, the host-controlled guest list, `notification_prefs` storage (ADR-0019; migration pending integration). |
| [database-security.md](database-security.md) | The cross-cutting security model: RLS shapes, the capability-RPC inventory, the advisor 0028/0029 split, the column-grant lockdown lessons, the migrations workflow. |

## Where does a finding go? (quick router)

- A new gotcha about **uploading / R2 / the lightbox** → `uploads-and-r2.md`.
- About **caps / tiers / Stripe** → `billing-caps.md`.
- About **the cron / email / recovery bin** → `lifecycle-recovery.md`; about **backups / the orphan breaker** → `durability-backups.md`.
- About **the guest event page** → `guest-flow.md`; about **host event management** → `host-app.md`.
- About **auth / accounts** → `auth-accounts.md`; about **the admin portal / Sentry** → `admin-observability.md`.
- About **RLS / grants / advisors / a capability RPC's anon-vs-authenticated placement** → `database-security.md`.
- About **the bell / analytics / saved events / email capture** → `notifications-analytics-growth.md`.
- About **`/u/[slug]` / follows / blocks / the guest list / notification prefs** → `profiles-social.md`.
- About **the marketing site / SEO / 404 / MDX** → `marketing-content.md`.
- A cross-cutting picture (how it all fits) → `architecture.md`.
