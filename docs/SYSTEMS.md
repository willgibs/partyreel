# Partyreel — Systems & feature reference

> **The map of what Partyreel _is_.** One entry per system/feature: what it does, where it
> lives, and the invariants you must not break. This is the doc to skim when a goal lands —
> find the relevant system, follow it to the files. For _how to work in this repo_ (commands,
> stack, gotchas, DRY single-sources, security guardrails) read [`CLAUDE.md`](../CLAUDE.md);
> for the product _why_ read [`PRD.md`](PRD.md); binding decisions are in [`adr/`](adr/); the
> live "you-are-here" + human blockers are in [`STATUS.md`](STATUS.md); deferred work is in
> [`ROADMAP.md`](ROADMAP.md).

The **core loop**: host creates an event → gets a QR → guests scan & upload (no app, no
account) → host curates → public album → guests become future hosts. Phases 0–4 + 6 shipped
and are verified in production; Phase 5 (highlight reel) is scaffold-only.

## Shape

One **Next.js 16** app (App Router, `src/`, TS, Tailwind v4) on one domain. Route groups:
`(marketing)` public site · `(auth)` login/callback · `(app)` the gated host app · `(guest)`
the token surfaces · `api/` route handlers. Data in **Supabase** (Postgres + RLS + capability
RPCs); media in **Cloudflare R2**; payments **Stripe**; email **Resend**. Full routing map +
DRY single-sources table: [`CLAUDE.md`](../CLAUDE.md).

---

## Auth & host accounts

Supabase Auth — **email magic-link + Google OAuth** (`(auth)/login`, `/auth/callback`). The
`(app)` layout ([layout.tsx](../src/app/(app)/layout.tsx)) is the single gate: `getUser()`
(NOT `getSession()`) → redirect `/login` if anon. `handle_new_user` trigger creates a
`profiles` row on signup. Clients: `src/lib/supabase/{client,server,middleware,admin}.ts`.
**Invariant:** `profiles` is host-writable only on `display_name, email, announcements_seen_at,
welcomed_at` (the `grant update(...)` allowlist); `tier`/`storage_*`/`is_admin`/`stripe_*` are
service-role / webhook only.

## Events & the create flow

`events` (host_id, opaque `qr_token`/`share_token` (DB-generated), `moderation_mode`,
`is_public`, `accepting_uploads`, `require_display_name`/`require_email`, `qr_style`,
`deleted_at`/`purge_at`). The **sole create path** is the **`/dashboard/new` wizard**
([create-event-wizard.tsx](../src/components/app/create-event-wizard.tsx)) — Details → QR
design → Share — which creates **once at commit** via the non-redirecting `createEventInWizard`
([actions.ts](../src/app/(app)/dashboard/actions.ts)) so the Share step can show the real QR +
album link. Settings are edited later on the event page ([event-settings-form.tsx](../src/components/app/event-settings-form.tsx),
**not auto-save**). `enforce_event_limit` trigger guards `MAX_EVENTS`. **Events have no end
date** — deletion is the only lifecycle exit (anti-abuse).

## QR designer

In-app QR styling so hosts never leave for an external stylizer. **`qr-code-styling`** (must be
dynamic-imported inside `useEffect` — SSR `window` access). Preset set single-sourced in
[qr-presets.ts](../src/lib/constants/qr-presets.ts) (`classic`/`bold`/`rounded`/`dots`),
persisted on `events.qr_style` (plain text column, app-validated — not a DB enum, so presets
grow without a migration). Components: `StyledQr` (renderer) → `QrPresetPicker` (reused by the
wizard) → `EventQr` (+ SVG/PNG download) → `QrDesignerDialog` ("Customize" on the event page).
**Invariant:** presets keep DARK modules on WHITE for scannability; brand color only tints
corner finders.

## First-time host welcome

A streamlined full-page **`/welcome`** intro (NOT a coachmark overlay): 3 steps → the create
wizard ([welcome-flow.tsx](../src/components/app/welcome-flow.tsx)). Auto-shown **once** to new
accounts via `profiles.welcomed_at` (the `/dashboard` page redirects when null via
[welcome.ts](../src/lib/welcome.ts) `shouldShowWelcome`; existing hosts were backfilled). Every
exit calls `markWelcomed` **before** navigating (no redirect loop). "How it works" copy is
single-sourced with the marketing page ([how-it-works.ts](../src/lib/constants/how-it-works.ts)).

## Guest join + upload (the core loop)

`/e/[token]` ([page](../src/app/(guest)/e/[token]/page.tsx)) — a scanned QR lands here; the
opaque `qr_token` IS the authorization (ADR-0004), validated inside SECURITY DEFINER RPCs.
`create_guest` issues a `session_token` (localStorage, returning-guest). Upload goes **browser
→ R2 direct** (single PUT < 100 MB else multipart) via `/api/r2/presign-upload` (builds the R2
key server-side) + `/api/r2/complete-upload`; `create_media` RPC writes the row + ledger +
enforces caps; `get_upload_context` is the presign-time pre-check. R2 client/presign:
[src/lib/r2/](../src/lib/r2/) (checksum-safe config — see CLAUDE gotcha).

## Galleries

Host live gallery on the event page + public album **`/a/[token]`** (approved-only). Both
**presign R2 keys server-side** (`presignDownload`, 1 h TTL) and are `force-dynamic`; raw R2
keys/URLs are NEVER exposed to the browser (ADR-0003). The album uses the always-dark `gallery`
surface so media is the hero. Tiles open a shared **lightbox**
([media-lightbox.tsx](../src/components/shared/media-lightbox.tsx)) — full-screen view, ←/→ +
keyboard nav, video playback, and a **Save** that downloads the original. **Download = a SECOND
presign of the same key with `ResponseContentDisposition: attachment`** (`presignDownload`'s
`downloadFilename`, named by [download-filename.ts](../src/lib/media/download-filename.ts)); the
browser `download` attr can't force a cross-origin R2 save — the signed disposition does (so no
bucket-CORS change). Both grids (public `MediaGrid` + `HostMediaGrid`) wrap each tile in a button
that opens the lightbox; **video tiles render controls-less thumbnails** (a controls-less `<video>`
is non-interactive → button-legal; it plays with controls inside the lightbox). **No new security
surface** — same approved media, same capability boundary (share_token / host RLS). Host **bulk-zip
download is deferred** (ROADMAP).

## Moderation & curation

`media.status` enum `pending | approved | hidden | removed`; `create_media` sets
`pending`/`approved` from the event's `moderation_mode`. Host grid
([host-media-grid.tsx](../src/components/app/host-media-grid.tsx)) does per-item
Approve/Hide/Unhide/Remove + a **Pending review** queue (Approve all) for `hold_for_approval`
events. Mutations: `setMediaStatus`/`removeMedia`/`approveAllPending`. **Remove is soft**
(`status='removed'` + `removed_at`) — frees the slot immediately; the cron reclaims after a
7-day grace.

## Lifecycle & the purge cron

[`/api/cron/purge`](../src/app/api/cron/purge/route.ts) — daily (`0 4 * * *`), timing-safe
`Bearer $CRON_SECRET` (Vercel auto-sends it). **7 sweeps**: expired_events, removed_media,
orphans, expired_passes, over_capacity, renewal_nudges, inactive_free_events (each
independently try/caught). `purge_media_rows` RPC does the atomic R2-then-row reclaim +
`storage_used_bytes` decrement (**service-role-only**, must stay REVOKED from anon). Soft-delete
stamps `purge_at = deleted_at + 60d` (recoverable tail). **Three counters are deliberately
different — don't reconcile:** per-event slot counts non-removed; the monthly `storage_ledger`
NEVER decrements (churn defense); `storage_used_bytes` drops only on hard-delete. R2 helpers:
[delete.ts](../src/lib/r2/delete.ts) (`parseMediaIdFromKey`).

## Storage caps, tiers & payments

**Storage-cap model** (not item counts): a tier = a total stored-bytes cap. **Single source**
[tiers.ts](../src/lib/constants/tiers.ts) (Free 2 GB; Pro 100/500/2048 GB; Event Pass 75 GB)
must mirror the SQL `tier_limits()` (a Vitest parity test guards it). `create_media` enforces
`cap + 10% overflow buffer` + a **monthly ingress meter** (`storage_ledger.cumulative_bytes`,
never refunds — the real anti-abuse guard). **Stripe** (`/api/stripe/{checkout,portal,webhook}`):
the **raw-body webhook is the SOLE writer** of `tier`/`storage_cap_bytes`/`stripe_subscription_id`
(via the admin client; idempotent, pure `resolveSubscriptionUpdate`). Price↔plan map +
env-driven Price IDs in [src/lib/stripe/](../src/lib/stripe/) (NOT in the client-safe `tiers.ts`).
**Event Pass** = one-time `mode:payment` → `tier_expires_at`. Over-capacity retention = 45-day
grace → largest-first auto-reduce into the removed tail. Detail: [PRICING.md](PRICING.md).

## Transactional email & lifecycle nudges

**Resend** (`resend` dep). **Always send via `sendOnce({ kind, dedupeKey, … })`**
([send.ts](../src/lib/email/send.ts)) — it CLAIMS a `sent_emails` row (unique `(kind,
dedupe_key)`) before sending, so the daily cron can call it every run and Resend is hit at most
once per state (free-tier frugality). Templates: [templates.ts](../src/lib/email/templates.ts).
Lifecycle emails: over-cap grace/reduced, renewal nudge (14 d pre-expiry, shared
`RENEWAL_NUDGE_DAYS`), free-tier inactivity warn/remove. **Needs `RESEND_API_KEY` + `EMAIL_FROM`
+ a verified sending domain** (human task — see STATUS).

## Safety (reports / operator review)

`create_report` RPC (anon capability-token, **insert-only, never auto-hides**) + a discreet
report dialog on the public album. Operator review at **`/admin`** (gated by
`profiles.is_admin`) — dismiss/action. `reports` is RLS **deny-all** (operator-internal). v1 is
reports/review only — **no scanner/NSFW filter** (v2+).

## Growth loop

Branded share pages + a `MakeYourOwn` "make your own Partyreel" CTA on the album + post-upload
state. **SEO/OG**: `metadataBase` + `next/og` code-generated images (site-wide + per-event album
card), `sitemap.ts`/`robots.ts` (marketing only); `/a/` + `/e/` emit OG so links unfurl but stay
**`robots noindex`** (opaque tokens must never be indexed). **Guest email capture**: a soft,
one-time post-upload prompt → `capture_guest_email` RPC sets `guests.email` + upserts the durable
`newsletter_signups` list (survives event/guest deletion).

## Link analytics

Per-event-per-day **aggregate counts, NO PII** ([link_stats](../supabase/migrations/) `event_id,
kind, day, count`; `kind` = `qr_scan`/`album_view`). Recorded server-side in each guest page's
`after()` via `recordLinkHit` → the **service-role-only** `record_link_hit` RPC (REVOKED from
anon — must stay absent from the anon advisor list), bot-filtered at ingest
([bots.ts](../src/lib/analytics/bots.ts) `isLikelyBot`). Hosts read via an RLS policy; counts
show on the event's Share card. Code: `src/lib/db/{queries,mutations}/analytics.ts`.

## Notification center

**Derive-on-read** in-app bell ([notification-bell.tsx](../src/components/app/notification-bell.tsx))
in the `(app)` header — no feed table. `getNotificationData` gathers signals each host page load
→ the **pure** `buildNotifications` ([build.ts](../src/lib/notifications/build.ts)) → badge +
panel. **v1 alerts** (STATE — persist until resolved): uploads-to-review (`media.status='pending'`),
over-capacity (`storage_grace_until`), Event-Pass-expiring (`tier_expires_at` within
`RENEWAL_NUDGE_DAYS`). **PLUS broadcast announcements**: a global `announcements` table
(operator-write-only via RLS — host inserts are RLS-blocked; authored via SQL/MCP) with per-host
read state via `profiles.announcements_seen_at`. **Extension point:** add a signal = one read in
`getNotificationData` + one case in `buildNotifications`. **When building any new host surface,
ask whether it should feed the bell** (e.g. co-host invites — see ROADMAP).

## Highlight reel — SCAFFOLD ONLY (tabled)

DB scaffold exists (`highlight_reels` table + `status` enum; `media.highlight_score`/`clip_*`/
`reel_eligible`/`preview_key`) but **no processing ships**. Hard constraint: transcode/stitch
runs in an **external worker, NOT Vercel functions** (ADR-0003). Deliberately tabled pending a
product + architecture decision (worker platform) — see ROADMAP.

---

## Security & data model (invariants)

- **RLS is the boundary** — the proxy ([src/proxy.ts](../src/proxy.ts)) only refreshes cookies.
  Re-verify authz with `getUser()` in every Server Function/route AND rely on RLS / SECURITY
  DEFINER RPCs at the DB.
- **Anonymous guests use capability tokens** (ADR-0004) validated inside SECURITY DEFINER RPCs;
  `anon` never gets direct table access. The **7 anon capability-token RPCs**
  (`get_event_by_qr_token`, `get_public_album`, `create_guest`, `create_media`,
  `get_upload_context`, `create_report`, `capture_guest_email`) show as advisor WARNs **by
  design — do NOT revoke** (see CLAUDE.md "get_advisors").
- **Service-role-locked RPCs** (`purge_media_rows`, `record_link_hit`) must stay REVOKED from
  anon/authenticated — they must NEVER appear in the anon advisor list.
- **Table RLS shapes:** deny-all (operator/service-role-only) = `reports`, `sent_emails`,
  `newsletter_signups` (the accepted `rls_enabled_no_policy` INFO); host-read-via-policy =
  `link_stats`, `announcements`; host-all = `events`, `media`, etc.
- **The Stripe webhook is the SOLE writer of tier/cap;** never trust the client for entitlements.
- **Never expose raw R2 keys/URLs;** presign server-side. **Events have no end date** (anti-abuse).
