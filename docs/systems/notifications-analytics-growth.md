# Notifications, analytics & growth

> ROLE: the host notification bell, link analytics, the marketing web analytics, and guest email capture — the engagement + growth surfaces.
> BELONGS HERE: the derive-on-read bell, `link_stats`, the Vercel WA/Speed-Insights marketing layer (`analytics/events.ts` + `analytics/web.ts`), `capture_guest_email` and the newsletter opt-in. · NOT HERE: the guest page's confirm doors and the offer card that carries the opt-in (→ [guest-flow.md](guest-flow.md)), how a guest's events reach their dashboard (→ [host-app.md](host-app.md)), the operator announcement compose UI (→ [admin-observability.md](admin-observability.md)), the lifecycle nudges that some alerts mirror (→ [lifecycle-recovery.md](lifecycle-recovery.md)).
> GROWS BY: integrate-in-place.

## Notification center (derive-on-read)

An in-app bell ([`notification-bell.tsx`](../../src/components/app/notification-bell.tsx)) in the `(app)`
header, with **no feed table**. `getNotificationData` ([`queries/notifications.ts`](../../src/lib/db/queries/notifications.ts))
gathers signals on every host page load → the **pure** `buildNotifications`
([`notifications/build.ts`](../../src/lib/notifications/build.ts)) → badge + panel. The bell mounts in the
layout's `headerActions` before `UserMenu`.

- **Extension point (keep it this small):** add a signal = ONE read in `getNotificationData` + ONE case in
  `buildNotifications`. **When building ANY new host surface, ask whether it should feed the bell** (capture
  the signal at the source).
- **Two kinds, different semantics:** derived **alerts** are STATE: they persist in the badge until the
  condition resolves and are NOT dismissed by viewing (uploads-to-review = `media.status='pending'`;
  over-capacity = `storage_grace_until`; pass-expiry = `tier_expires_at` within `RENEWAL_NUDGE_DAYS`;
  recovery-clearing = the soonest `purge_at` within `RECOVERY_PURGE_NUDGE_DAYS`=7, bell-only, never emailed).
  **Announcements** are operator broadcasts with per-host read state (unread until the host opens the panel,
  which advances `profiles.announcements_seen_at`; the bell also optimistically drops their contribution).
  Badge = active alerts + unread announcements.
- Pass-expiry reuses `RENEWAL_NUDGE_DAYS` ([`lifecycle/renewal.ts`](../../src/lib/lifecycle/renewal.ts)),
  the single source shared with the cron's renewal nudge; never re-hardcode it.

**Invariants:** `announcements` is operator-write-only (RLS: a SELECT policy for `authenticated`, NO write
policy, so host inserts are RLS-denied, proven by a 42501 contract check; the operator publishes via the
`/admin` compose UI → [admin-observability.md](admin-observability.md)). `announcements_seen_at` is one of the
two host-writable columns on the `profiles` grant allowlist (with `welcomed_at`; the host self-bumps it via the RLS
`markAnnouncementsSeen`); `tier`/`storage_*`/`is_admin` stay off it. **No real-time push**: the badge
refreshes on navigation/page-load (cron signals are daily). There is no per-item feed and no per-item
announcement un-read.

## Link analytics

Per-event-per-day **aggregate counts, NO PII** (`link_stats`: `event_id, kind, day, count`; `kind` ∈
`qr_scan | album_view`). No IP / user-agent / visitor identity is EVER stored. Only `qr_scan` is recorded
(one link per event); `album_view` stays in the enum because existing counts the admin metrics read are
typed by it, and a Postgres enum value cannot be dropped.

- **Bots are filtered AT INGEST** ([`analytics/bots.ts`](../../src/lib/analytics/bots.ts) `isLikelyBot`)
  because aggregate counters can't be cleaned retroactively.
- **`record_link_hit` is service-role-only**: REVOKED from anon/authenticated, and it must NEVER appear in
  the anon advisor list (the same locked-down class as `purge_media_rows`). Recording happens server-side in
  the guest page's `after()` via the admin client ([`mutations/analytics.ts`](../../src/lib/db/mutations/analytics.ts)),
  best-effort, never blocking the guest. Hosts READ via the `link_stats_host_select` RLS policy (own events only).
- **Record ONLY in the page-body success branch, NEVER in `generateMetadata`** (which runs for
  unfurls/prefetch → double-count). "Scans" = join-link visits; the host's own "Open"/re-visits count too
  (an honest label).

## Web analytics (marketing site)

**Vercel Web Analytics + Speed Insights, MARKETING-SCOPED:** the one client island
[`marketing/system/web-analytics.tsx`](../../src/components/marketing/system/web-analytics.tsx) mounts in
`(marketing)/layout.tsx`, and that placement IS the scoping: app/guest/admin surfaces stay untracked until
that becomes its own deliberate decision (the root `not-found.tsx` sits outside the group, so it is
untracked too). Both products are ON project-side and installed (`@vercel/analytics` /
`@vercel/speed-insights` v2).

- **The wrapper pair is the DRY seam.** [`lib/analytics/events.ts`](../../src/lib/analytics/events.ts)
  (pure, dependency-free): the 7-event taxonomy (`cta_click · demo_open · reel_play · checkout_start ·
  contact_submit · careers_apply · assistant_click`, Vitest-pinned, append-only: a rename splits its
  dashboard history) plus `trackAttrs()`. [`lib/analytics/web.ts`](../../src/lib/analytics/web.ts)
  (client): silent-safe `track()` + the `pr-no-track` localStorage opt-out (`beforeSendDrop`, wired to
  BOTH products). Swapping vendors means rewriting `web.ts` alone; the taxonomy + attributes carry over.
- **Server components instrument by ATTRIBUTES, not islands**: spread `trackAttrs(event, props)` on
  the clickable element; the island's delegated capture-phase click listener does the rest (capture
  because Radix chrome can swallow bubble-phase clicks; known gap: middle-click/auxclick). That is why
  `footer-qr.tsx` stays server-rendered and why the shared `CheckoutButton` passes rest props through
  but carries NO analytics import: attributes only fire where the island exists, which keeps
  app-surface checkouts silent by construction.
- **Hobby-plan reality: custom events are Pro-only.** The taxonomy is wired but dormant; what collects is
  pageviews/referrers/UTM/paths + Speed Insights vitals. Quotas: WA 50k events/mo, 1-month data window,
  hard-pauses at cap (NO overage billing on Hobby); SI is free for one project, 10k data points/mo, 7-day
  window. The vendor decision at the Hobby → Pro cutover waits for observed volume (a launch-checkpoint item).
- **Props discipline**: single lowercase words only (the listener round-trips them through the
  camelCased DOM dataset), few and short (Pro caps custom events at 2 props, 255 chars each; 8 with
  the paid add-on).
- **Test traffic**: red-team browser profiles set `localStorage["pr-no-track"]` FIRST; it mutes both
  products on that device. Verify collection by the NETWORK beacons (the script at
  `/_vercel/insights/script.js` + the `view` beacons; v2 also posts to a per-deployment unique path),
  not by dashboard latency. Dev never sends (the package no-ops off Vercel).
- **Reading the numbers**: the Vercel dashboard (vercel.com/partyreel/partyreel/analytics), the Vercel MCP's
  pageview and event tools (`count_pageviews`, `aggregate_pageviews`, `count_events`; on the P3 team) or
  the REST `$VERCEL_TOKEN` path. The proxy skips `/_vercel/*`, so
  beacons never cost a Supabase `getUser` round-trip.
- **Privacy-claim coupling**: `/privacy` "what we collect" discloses the cookieless, first-party
  counting; if the vendor ever changes, re-verify its "no cookies / never identifies you / no
  cross-site" sentences still hold.

## Guest email capture

The newsletter opt-in ("Send me occasional Partyreel updates") is a switch inside the confirm door of the
post-upload offer card, `<SaveAccountPrompt>` ([`save-account-prompt.tsx`](../../src/components/guest/save-account-prompt.tsx),
rendered by [`guest-upload.tsx`](../../src/components/guest/guest-upload.tsx)), its one place in the product, and it
posts only on an in-page confirmation. Opt-in POSTs to
[`/api/guests/capture-email`](../../src/app/api/guests/capture-email), which requires a session whose
email is CONFIRMED (`email_confirmed_at`; an unconfirmed sign-up gets 401), derives the address from that
session (never the request body: no victim-address poisoning), applies a per-IP abuse limit (fail-open),
and calls the service-role-only **`capture_guest_email`** RPC through the admin client: it sets
`guests.email` only if null and only on a row whose own account is the confirmed owner of that address, and upserts the durable **`newsletter_signups`** table (RLS deny-all).
`newsletter_signups` is standalone (NOT a `guests` column) so the marketing list survives event/guest
deletion (`event_id` is `on delete set null`). A TYPED address never reaches `guests.email`: it lives
in `guests.pending_email` (written only by the join's `create_guest` and by `set_guest_pending_email`
through `/api/guests/email`) until a confirmed account claims it
(→ [guest-flow.md](guest-flow.md)). No "email me the album link" send exists (it would reuse `sendOnce`).

## See also

[guest-flow.md](guest-flow.md) (the offer card and its confirm door) · [admin-observability.md](admin-observability.md) (announcement publishing) · [lifecycle-recovery.md](lifecycle-recovery.md) (the nudges some alerts mirror) · [database-security.md](database-security.md).
