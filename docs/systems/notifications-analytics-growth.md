# Notifications, analytics & growth

> ROLE: the host notification bell, link analytics, the marketing web analytics, saved events, and guest email capture — the engagement + growth surfaces.
> BELONGS HERE: the derive-on-read bell, `link_stats`, the Vercel WA/Speed-Insights marketing layer (`analytics/events.ts` + `analytics/web.ts`), `save_event`/`get_saved_events`, `capture_guest_email`. · NOT HERE: the guest page that mounts the Save button (→ [guest-flow.md](guest-flow.md)), the operator announcement compose UI (→ [admin-observability.md](admin-observability.md)), the lifecycle nudges that some alerts mirror (→ [lifecycle-recovery.md](lifecycle-recovery.md)).
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
`/admin` compose UI → [admin-observability.md](admin-observability.md)). `announcements_seen_at` is the ONE
host-writable addition to the `profiles` column-grant allowlist (the host self-bumps via the RLS
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

## Saved events (the accounts-from-guest growth loop)

A signed-in visitor can SAVE any event to their dashboard: the FREE account-creation growth payoff. It
AUGMENTS the anonymous capability flow; the upload pipeline is untouched. Saved events are rows of kind
`saved` in the dashboard's events list: interleaved with hosted events by recency under "All events" (the
recency key is `saved_at`, threaded through `SavedEventCardData`; a saved row carries "Hosted by X") and
alone under the "Saved" filter (→ [host-app.md](host-app.md)).

- **Save = `save_event(p_qr_token)`** (authenticated-only SECURITY DEFINER): resolves the event from the
  page's TOKEN (never a client `event_id`), refuses `private` + your-own events (owner → no-op), idempotent.
  Status-check + **unsave** are plain per-user RLS (`saved_events_owner_all`, `auth.uid() = user_id`) from
  the browser client, with no API route.
- **`get_saved_events()`** (authenticated-only SECURITY DEFINER, `auth.uid()`-based, NO `p_user_id`) reads
  the names/covers of events the saver does NOT own, so it MUST be DEFINER. It MASKS by visibility: `open` →
  cover; `password` → cover NULL (gated media must never leak as a thumbnail); `private` → all NULL +
  `accessible=false`; deleted → excluded. It returns the event's `qr_token` (masked null for private), so
  saved cards link `/e/[qr_token]`. Cover keys are presigned server-side.
- **Advisors:** both RPCs are in the authenticated (0029) list ONLY, never anon (0028); `saved_events` has a
  policy (no `rls_enabled_no_policy` INFO).
- **`saved_events(user_id, event_id, saved_at)`** is PK'd on the pair with BOTH FKs `on delete cascade`, so
  deleting the event or the account removes the save with no sweep to write. Saving stays FREE on every
  tier: it is the reason a visitor makes an account, so pricing it would cost more than it earns.
- **Gotcha:** `get_saved_events`'s generated return type understates nullability (a `RETURNS TABLE` fn types
  every column non-null); `SavedEventRow` in [`saved-events/card.ts`](../../src/lib/saved-events/card.ts)
  models the TRUE nullability and the query layer casts to it. Never trust the generated nullability for
  `RETURNS TABLE` fns.
- The **Save button** ([`save-event-button.tsx`](../../src/components/guest/save-event-button.tsx)) mounts
  inside the post-upload `<SaveAccountPrompt>` ("Confirm your email", with the newsletter opt-in); a
  signed-OUT visitor gets `<AccountDoor wear="save">` (the shared code-first OTP + Google). A
  `pr_pending_save_${eventId}` localStorage flag completes the save after a REDIRECT sign-in returns; the
  in-page code path saves directly in `onVerified`. The guest page's door and menu: → [guest-flow.md](guest-flow.md).

## Guest email capture

The newsletter opt-in is a switch in the account-first save flow of the post-upload `<SaveAccountPrompt>`
([`save-account-prompt.tsx`](../../src/components/guest/save-account-prompt.tsx), rendered by
[`guest-upload.tsx`](../../src/components/guest/guest-upload.tsx)). Opt-in POSTs to
[`/api/guests/capture-email`](../../src/app/api/guests/capture-email), which requires a session whose
email is CONFIRMED (`email_confirmed_at`; an unconfirmed sign-up gets 401), derives the address from that
session (never the request body: no victim-address poisoning), applies a per-IP abuse limit (fail-open),
and calls the service-role-only **`capture_guest_email`** RPC through the admin client: it sets
`guests.email` only if null, and upserts the durable **`newsletter_signups`** table (RLS deny-all).
`newsletter_signups` is standalone (NOT a `guests` column) so the marketing list survives event/guest
deletion (`event_id` is `on delete set null`). An UNPROVED address never reaches `guests.email`: it lives
in `guests.pending_email` (written only by the join's `create_guest` and by `set_guest_pending_email`
through `/api/guests/email`) until a confirmed account claims it
(→ [guest-flow.md](guest-flow.md)). No "email me the album link" send exists (it would reuse `sendOnce`).

## See also

[guest-flow.md](guest-flow.md) (mounts the Save button / capture) · [admin-observability.md](admin-observability.md) (announcement publishing) · [lifecycle-recovery.md](lifecycle-recovery.md) (the nudges some alerts mirror) · [database-security.md](database-security.md).
