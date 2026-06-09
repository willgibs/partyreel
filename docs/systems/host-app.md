# Host app — events, create wizard, QR, slug, welcome, moderation

> ROLE: the authenticated host's event-management surfaces.
> BELONGS HERE: the `events` model + create wizard, QR designer, custom slug, first-time welcome, event settings, host curation/moderation, the host-upload UI entry. · NOT HERE: the upload pipeline + R2 (→ [uploads-and-r2.md](uploads-and-r2.md)), the guest experience (→ [guest-flow.md](guest-flow.md)), caps/billing (→ [billing-caps.md](billing-caps.md)), operator-side moderation/reports (→ [admin-observability.md](admin-observability.md)).
> GROWS BY: integrate-in-place.

## Dashboard landing (Events · Uploads · Trash)

[`/dashboard`](../../src/app/(app)/dashboard/page.tsx) is the host home, consolidated into three tabs
(Phase 4), deep-linkable via `?tab=` ([`dashboard-tabs.tsx`](../../src/components/app/dashboard-tabs.tsx)
syncs the URL with `history.replaceState` so switching stays instant, no server round-trip):
- **Events** — hosted + saved events MERGED into one list, interleaved by recency (hosted by `created_at`,
  saved by `saved_at`, so a just-created OR just-saved event lands top) + icon-differentiated (a calendar
  glyph vs a bookmark) on the shared `EventCard`. Saved cards keep their visibility masking + unsave (→
  [notifications-analytics-growth.md](notifications-analytics-growth.md)).
- **Uploads** — the host's OWN media across ALL events (host uploads + guest uploads), via the authenticated
  `get_my_uploads` RPC (UNION of host-arm + guest-arm; `is_host_upload` + event/type/date make it filter-ready
  for a future cross-gallery filter; presigned server-side; ≤200 with a truncation footer). Reuses `MediaGrid`
  + the lightbox (view + per-item download) + a gated event-context caption per item → [uploads-and-r2.md](uploads-and-r2.md).
- **Trash** — the soft-deleted EVENTS recovery bin (user-facing rename of "Recently deleted", Phase 4) →
  [lifecycle-recovery.md](lifecycle-recovery.md).

## Events & the create flow

`events` (host_id, opaque `qr_token` = the single DB-generated link (ADR-0010), `moderation_mode`,
`visibility` + `event_password_hash`, `accepting_uploads`, `allow_anonymous_uploads`, `max_upload_bytes` (host
per-upload cap for GUEST uploads, 25 MiB–10 GB or null; the host's own uploads are exempt), `qr_style`,
`custom_slug`, `deleted_at`/`purge_at`). The **sole create path** is the **`/dashboard/new` wizard**
([`create-event-wizard.tsx`](../../src/components/app/create-event-wizard.tsx)): Details → QR design →
Share. It creates **once at commit** via the non-redirecting `createEventInWizard`
([`dashboard/actions.ts`](../../src/app/(app)/dashboard/actions.ts)), which RETURNS the event (id +
qr_token) so the Share step can render the real QR + link. Settings are edited later on the event page
([`event-settings-form.tsx`](../../src/components/app/event-settings-form.tsx)). `enforce_event_limit`
guards `MAX_EVENTS`. **Events have no end date** — deletion is the only lifecycle exit (anti-abuse).

**Invariants / gotchas:**
- **The wizard route must NOT guard at-cap with a `redirect`.** A Server Action refreshes the route it was
  called from, so an at-cap `redirect` on `/dashboard/new` fires on the POST-CREATE refresh (the host is
  now at cap) and bounces them away BEFORE the Share step renders (shipped + caught live). The cap is
  guarded instead by the disabled dashboard "New event" button + `createEvent`'s `limit_reached`. General
  rule: no eligibility `redirect` on a route whose post-Server-Action refresh must show a success state.
- The design step previews with a **placeholder token** (`previewJoinUrl` in
  [`share-urls.ts`](../../src/lib/events/share-urls.ts), a 32-char stand-in the same length as a real token)
  because the real `qr_token` doesn't exist pre-insert.
- **Settings are NOT auto-save** — toggles (e.g. moderation mode) persist only on **Save changes**. When
  verifying a settings change, click Save and confirm the DB; don't assume the toggle wrote on change.
- Only `name` is required; everything else is minimal + editable later (lowest-friction).

## QR designer

In-app QR styling so hosts never leave for an external stylizer. **`qr-code-styling`** MUST be
dynamic-imported INSIDE a `useEffect` ([`styled-qr.tsx`](../../src/components/app/styled-qr.tsx)) — it
touches `window`/`document` on construction, which crashes the client component's SSR pass. Presets are
single-sourced in [`qr-presets.ts`](../../src/lib/constants/qr-presets.ts) (`classic`/`bold`/`rounded`/`dots`),
persisted on `events.qr_style` (a plain **text** column, app-validated — not a DB enum, so presets grow
without a migration; unknown/legacy → `classic`). Chain: `StyledQr` (renderer) → `QrPresetPicker`
([`qr-preset-picker.tsx`](../../src/components/app/qr-preset-picker.tsx), reused by the wizard) → `EventQr`
(+ SVG/PNG download) → `QrDesignerDialog`.
**Invariant:** every preset keeps DARK data modules on a WHITE background for scannability; brand color only
tints the corner finder patterns. Prove a new preset by SCANNING it (the host UI is auth-gated → verify on partyreel.com).

## Custom event link (slug) — ADR-0012

Pro / Event-Pass hosts can set an optional human-friendly **alias** `/e/<slug>` for the one event link;
the permanent `/e/<qr_token>` + the QR never change and the slug is NOT a second capability.
`events.custom_slug` (nullable, case-insensitively unique among non-deleted events via a partial index,
RPC-write-only) is set/cleared by `set_event_slug` / `clear_event_slug` (authenticated-only SECURITY
DEFINER, tier-gated — the `event_password_hash` pattern). `get_event_by_qr_token` resolves
`qr_token OR custom_slug` (token wins) and returns the canonical `qr_token`. Validation + a reserved-word
list: [`validation/event.ts`](../../src/lib/validation/event.ts) + [`reserved-slugs.ts`](../../src/lib/constants/reserved-slugs.ts);
the UI is [`event-slug-control.tsx`](../../src/components/app/event-slug-control.tsx) (set/change/remove) in
the "Share with guests" card AND reused in the wizard's Share step. It has **debounced live availability**
(via the authenticated `check_slug_available` RPC, browser-called + request-id race-guarded; the pure
classifier is `evaluateSlugInput` in [`slug.ts`](../../src/lib/slug.ts)), a change/remove warning dialog
(both break the live link), and a name-derived suggestion chip. Downgrade keeps the slug resolving +
removable but not changeable.

## First-time host welcome

A full-page **`/welcome`** intro (NOT a coachmark overlay — Will dislikes "click here" tours): 3 steps →
the create wizard ([`welcome-flow.tsx`](../../src/components/app/welcome-flow.tsx)). Auto-shown **once** to
new accounts via `profiles.welcomed_at` (null = unwelcomed; `/dashboard` redirects there when null via
[`welcome.ts`](../../src/lib/welcome.ts) `shouldShowWelcome`; existing profiles were backfilled to `now()`).
**Every exit calls `markWelcomed` BEFORE navigating** (an RLS self-update via the regular client) — else
the `/dashboard` guard bounces the host straight back. The `/welcome` route itself must NOT gate on
`welcomed_at` (no loop). `welcomed_at` is on the `profiles` host-writable allowlist. The "how it works"
story is single-sourced in [`how-it-works.ts`](../../src/lib/constants/how-it-works.ts) (shared with the
marketing page — edit it once).

## Moderation & curation (host side)

`media.status` enum `pending | approved | hidden | removed`; `create_media` sets `pending`/`approved` from
the event's `moderation_mode`. The host grid ([`host-media-grid.tsx`](../../src/components/app/host-media-grid.tsx))
does per-item Approve/Hide/Unhide/Remove + a **Pending review** queue (Approve all) for `hold_for_approval`
events. Mutations: `setMediaStatus` / `removeMedia` / `approveAllPending`. **Remove is soft**
(`status='removed'` + `removed_at`) — frees the slot immediately; the cron reclaims after the 30-day
recovery window. → [lifecycle-recovery.md](lifecycle-recovery.md). (Operator/admin proactive moderation +
the reports queue live in [admin-observability.md](admin-observability.md).)

**Host upload (two-way media).** The host adds media from the event page via an "Add photos" toggle in the
Uploads card header ([`event-uploads.tsx`](../../src/components/app/event-uploads.tsx)) → a dropzone
([`host-upload.tsx`](../../src/components/app/host-upload.tsx)). The pipeline + the `create_media_as_host`
invariants live in [uploads-and-r2.md](uploads-and-r2.md).

## Highlight reel — SCAFFOLD ONLY (tabled)

A DB scaffold exists (`highlight_reels` table + status enum; `media.highlight_score`/`clip_*`/
`reel_eligible`/`preview_key`) but **no processing ships**. Hard constraint: transcode/stitch runs in an
**external worker, NOT Vercel functions** (ADR-0003). Tabled pending a product + architecture decision (the
worker platform) — see [`../ROADMAP.md`](../ROADMAP.md).

## See also

[ADR-0010](../adr/0010-one-link-per-event.md) · [ADR-0012](../adr/0012-custom-event-slug.md) · [ADR-0007](../adr/0007-event-visibility-password-protection.md) · [uploads-and-r2.md](uploads-and-r2.md) · [guest-flow.md](guest-flow.md) · [billing-caps.md](billing-caps.md).
