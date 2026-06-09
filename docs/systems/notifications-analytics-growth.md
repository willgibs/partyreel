# Notifications, analytics & growth

> ROLE: the host notification bell, link analytics, saved events, and guest email capture — the engagement + growth surfaces.
> BELONGS HERE: the derive-on-read bell, `link_stats`, `save_event`/`get_saved_events`, `capture_guest_email`. · NOT HERE: the guest page that mounts the Save button (→ [guest-flow.md](guest-flow.md)), the operator announcement compose UI (→ [admin-observability.md](admin-observability.md)), the lifecycle nudges that some alerts mirror (→ [lifecycle-recovery.md](lifecycle-recovery.md)).
> GROWS BY: integrate-in-place.

## Notification center (derive-on-read)

An in-app bell ([`notification-bell.tsx`](../../src/components/app/notification-bell.tsx)) in the `(app)`
header — **no feed table**. `getNotificationData` ([`queries/notifications.ts`](../../src/lib/db/queries/notifications.ts))
gathers signals on every host page load → the **pure** `buildNotifications`
([`notifications/build.ts`](../../src/lib/notifications/build.ts)) → badge + panel. The bell mounts in the
layout `headerActions` before `UserMenu`.

- **Extension point (keep it this small):** add a signal = ONE read in `getNotificationData` + ONE case in
  `buildNotifications`. **When building ANY new host surface, ask whether it should feed the bell** (capture
  the signal at the source — e.g. co-host invites when co-hosting ships).
- **Two kinds, different semantics:** derived **alerts** are STATE — they persist in the badge until the
  condition resolves and are NOT dismissed by viewing (uploads-to-review = `media.status='pending'`;
  over-capacity = `storage_grace_until`; pass-expiry = `tier_expires_at` within `RENEWAL_NUDGE_DAYS`;
  recovery-clearing = the soonest `purge_at` within `RECOVERY_PURGE_NUDGE_DAYS`=7, bell-only, never emailed).
  **Announcements** are operator broadcasts with per-host read state (unread until the host opens the panel,
  which advances `profiles.announcements_seen_at`; the bell also optimistically drops their contribution).
  Badge = active alerts + unread announcements.
- Pass-expiry reuses `RENEWAL_NUDGE_DAYS` ([`lifecycle/renewal.ts`](../../src/lib/lifecycle/renewal.ts)) —
  the single source shared with the cron's renewal nudge; don't re-hardcode it.

**Invariants:** `announcements` is operator-write-only (RLS: a SELECT policy for `authenticated`, NO write
policy → host inserts are RLS-denied, proven by a 42501 contract check; the operator publishes via the
`/admin` compose UI → [admin-observability.md](admin-observability.md)). `announcements_seen_at` is the ONE
host-writable addition to the `profiles` column-grant allowlist (host self-bumps via the RLS
`markAnnouncementsSeen`); `tier`/`storage_*`/`is_admin` stay off it. **No real-time push** — the badge
refreshes on navigation/page-load (acceptable; cron signals are daily). Deferred to v2: link-activity +
billing alerts, a durable per-item feed + push, per-item announcement un-read toggling.

## Link analytics

Per-event-per-day **aggregate counts, NO PII** (`link_stats`: `event_id, kind, day, count`; `kind` ∈
`qr_scan | album_view`). No IP / user-agent / visitor identity is EVER stored.

- **Bots are filtered AT INGEST** ([`analytics/bots.ts`](../../src/lib/analytics/bots.ts) `isLikelyBot`)
  because aggregate counters can't be cleaned retroactively.
- **`record_link_hit` is service-role-only** — REVOKED from anon/authenticated; it must NEVER appear in the
  anon advisor list (same locked-down class as `purge_media_rows`). Recording always happens server-side in
  the guest pages' `after()` via the admin client ([`mutations/analytics.ts`](../../src/lib/db/mutations/analytics.ts))
  — best-effort, never blocks the guest. Hosts READ via the `link_stats_host_select` RLS policy (own events only).
- **Record ONLY in the page-body success branch, NEVER in `generateMetadata`** (which runs for
  unfurls/prefetch → double-count). "Scans" = join-link visits — the host's own "Open"/re-visits count too
  (an honest label, accepted for v1).

## Saved events (accounts-from-guest growth — ADR-0009)

A signed-in visitor can SAVE any event to their dashboard — the FREE account-creation growth payoff. It
AUGMENTS the anonymous capability flow; the upload pipeline is untouched. (Phase 4: saved events now live in
the unified **"Events"** tab, interleaved with hosted events by recency + icon-differentiated; the recency
key is `saved_at`, threaded through `SavedEventCardData` → [host-app.md](host-app.md).)

- **Save = `save_event(p_qr_token)`** (authenticated-only SECURITY DEFINER): resolves the event from the
  page's TOKEN (never a client `event_id`), refuses `private` + your-own events (owner → no-op), idempotent.
  Status-check + **unsave** are plain per-user RLS (`saved_events_owner_all`, `auth.uid() = user_id`) from
  the browser client — no API route.
- **`get_saved_events()`** (authenticated-only SECURITY DEFINER, `auth.uid()`-based, NO `p_user_id`) reads
  the names/covers of events the saver does NOT own → it MUST be DEFINER. It MASKS by visibility: `open` →
  cover; `password` → cover NULL (gated media must never leak as a thumbnail); `private` → all NULL +
  `accessible=false`; deleted → excluded. It returns the event's `qr_token` (masked null for private), so
  saved cards link `/e/[qr_token]`. Cover keys are presigned server-side.
- **Advisors:** both RPCs are in the authenticated (0029) list ONLY, never anon (0028); `saved_events` has a
  policy (no `rls_enabled_no_policy` INFO).
- **Gotcha:** `get_saved_events`'s generated return type understates nullability (a `RETURNS TABLE` fn types
  every column non-null); `SavedEventRow` in [`saved-events/card.ts`](../../src/lib/saved-events/card.ts)
  models the TRUE nullability and the query layer casts to it. Don't trust the generated nullability for
  `RETURNS TABLE` fns.
- The **Save button** ([`save-event-button.tsx`](../../src/components/guest/save-event-button.tsx)) is the
  always-visible lever — shown to signed-OUT visitors too → a "create a free account to save" dialog
  (shared `<EmailSignIn>` code-first OTP + Google). A `pr_pending_save_${eventId}` localStorage flag
  completes the save after a REDIRECT sign-in returns; the in-page code path saves directly in `onVerified`.
  It mounts in the `/e/` action row (→ [guest-flow.md](guest-flow.md)) + inside the post-upload `<SaveAccountPrompt>`.

## Guest email capture

The post-upload `<SaveAccountPrompt>` ([`save-account-prompt.tsx`](../../src/components/guest/save-account-prompt.tsx),
rendered by [`guest-upload.tsx`](../../src/components/guest/guest-upload.tsx)) REPLACED the old newsletter
`EmailCapturePrompt` — account-first, with the newsletter opt-in folded into the
save dialog as a checkbox. Opt-in writes via the **`capture_guest_email`** RPC (anon capability-token, the
`session_token` is the auth): it sets `guests.email` only if null, and upserts the durable
**`newsletter_signups`** table (RLS deny-all). `newsletter_signups` is standalone (NOT a `guests` column) so
the marketing list survives event/guest deletion (`event_id` is `on delete set null`). The old
`/api/guests/email` route + its wrapper were removed as dead code (the RPC is reached ONLY via the in-page
browser path now). **Deferred:** the automatic "email me the album link" send (would reuse `sendOnce`).

## See also

[ADR-0009](../adr/0009-saved-events.md) · [guest-flow.md](guest-flow.md) (mounts the Save button / capture) · [admin-observability.md](admin-observability.md) (announcement publishing) · [lifecycle-recovery.md](lifecycle-recovery.md) (the nudges some alerts mirror) · [database-security.md](database-security.md).
