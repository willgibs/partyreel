# Notifications, analytics & growth

Open this before you:
- build a host surface that should reach the host's bell;
- touch the QR-scan counts;
- instrument the marketing site, or swap the analytics vendor;
- touch the newsletter opt-in or anywhere a guest's address is stored.

Elsewhere: the guest's offer card and confirm doors ([guest-flow.md](guest-flow.md)), the operator's announcement compose
([admin-observability.md](admin-observability.md)), the lifecycle nudges some alerts mirror ([lifecycle-recovery.md](lifecycle-recovery.md)).

## The host's bell

The bell is derived on read, with no feed table: `getNotificationData` gathers the signals on every host page load and
the pure `buildNotifications` turns them into the badge and the panel.
- **A new signal is one read in `getNotificationData` and one case in `buildNotifications`;** building any new host
  surface, it is worth asking whether it should feed the bell, and capturing the signal at its source.
- **Alerts are state:** they stay in the badge until their condition resolves, and viewing never dismisses one. The
  soonest `purge_at` within 7 days is bell-only, never emailed. Pass expiry reuses `RENEWAL_NUDGE_DAYS`, the single
  source the cron's nudge reads.
- ★ **A waiting queue reads one number everywhere** (the badge, the event card's "N to review", Review's own header):
  pending media outside the bin on the host's live events. The badge counts each waiting upload, and each event with a
  queue is its own row, naming the event and opening its Review room; the breakdown is read (`listEvents` plus
  `event_card_stats`) only when the head count finds a queue, and a failed breakdown falls back to one row rather than
  taking a host page down.
- **Announcements are operator broadcasts with per-host read state:** unread until the host opens the panel, which
  advances `profiles.announcements_seen_at`, one of the two columns a host may write. `announcements` has a SELECT
  policy for `authenticated` and no write policy, so a host insert is refused (a 42501 contract check proves it); the
  operator publishes from `/admin` through the service role.
- Nothing pushes in real time: the badge refreshes on navigation, and the cron's signals move daily.

## QR-scan counts

`link_stats` holds per-event, per-day aggregate counts and nothing about a visitor: no IP, user agent or identity is
ever stored. Only `qr_scan` is recorded; `album_view` stays in the enum because counts the admin metrics read are typed
by it, and a Postgres enum value cannot be dropped.
- **Bots are filtered at ingest** (`isLikelyBot`), because an aggregate counter cannot be cleaned afterwards.
- **`record_link_hit` is service-role only,** called best-effort from the guest page's `after()` on the admin client,
  never blocking the guest; hosts read their own events' counts through RLS.
- **A hit is recorded in the page body's success branch, never in `generateMetadata`,** which also runs for
  unfurls and prefetches and would double-count. "Scans" are visits to the join link, the host's own included, an
  honest label.

## Marketing web analytics

Vercel Web Analytics and Speed Insights, scoped to marketing by placement: the one client island mounts in
`(marketing)/layout.tsx`, so the app, guest and admin surfaces stay untracked until that becomes its own decision (the
root `not-found.tsx`, outside the group, is untracked too).
- **Two files are the seam:** `lib/analytics/events.ts` (pure: the event taxonomy, test-pinned and append-only,
  because a rename splits a dashboard's history, and `trackAttrs()`) and `lib/analytics/web.ts` (the client: a
  silent-safe `track()` and the `pr-no-track` localStorage opt-out, wired to both products). A vendor swap rewrites
  `web.ts` alone.
- **Server components instrument by attributes:** spread `trackAttrs(event, props)` on the clickable element and the
  island's delegated capture-phase listener does the rest (capture, because Radix chrome can swallow a bubbling click;
  a middle-click is a known gap). Attributes fire only where the island exists, which keeps app-surface checkouts
  silent by construction: the shared `CheckoutButton` carries no analytics import.
- **On the Hobby plan custom events do not collect,** so the taxonomy is wired and dormant; pageviews, referrers, UTM,
  paths and the Speed Insights vitals do. The vendor choice at the Pro cutover is on the ROADMAP.
- **Event properties are single lowercase words** (the listener round-trips them through the camel-cased DOM
  dataset), few and short (Pro keeps two per event).
- **Test traffic:** a red-team browser profile sets `localStorage["pr-no-track"]` first, which mutes both products on
  that device. Collection is verified by the network beacons (`/_vercel/insights/script.js` and the `view` posts),
  never by dashboard latency; dev never sends. The numbers read on the Vercel dashboard, through the Vercel MCP's
  pageview and event tools (the P3 team) or the REST API.
- **`/privacy`'s "what we collect" names cookieless, first-party counting,** so a new vendor means re-checking its "no
  cookies, never identifies you, no cross-site" sentences.

## The newsletter opt-in and a guest's address

The opt-in ("Send me occasional Partyreel updates") is a switch inside the confirm door of the post-upload offer card
(`SaveAccountPrompt`), its one place in the product, and it posts only after an in-page confirmation.
- **`/api/guests/capture-email` takes the address from a session whose email is CONFIRMED** (`email_confirmed_at`; an
  unconfirmed sign-up gets 401), never from the request body, which would let anyone subscribe a victim. It is
  abuse-limited per IP (failing open) and calls the service-role `capture_guest_email`, which fills `guests.email` only
  when empty and only on a row whose own account confirmed-owns the address, then upserts `newsletter_signups`
  (deny-all).
- **`newsletter_signups` stands alone,** not a `guests` column, so the list outlives an event or a guest
  (`event_id` is `on delete set null`); deleting an account removes its address.
- A typed, unproved address never reaches `guests.email`: it waits in `guests.pending_email` until a confirmed account
  claims it ([database-security.md](database-security.md), "two email columns"). No "email me the album link" send exists; one would go through
  `sendOnce`.
