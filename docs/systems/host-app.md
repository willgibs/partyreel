# Host app — events, create wizard, QR, slug, welcome, moderation

> ROLE: the authenticated host's event-management surfaces.
> BELONGS HERE: the `events` model + create wizard, QR designer, custom slug, first-time welcome, event settings, host curation/moderation, the host-upload UI entry. · NOT HERE: the upload pipeline + R2 (→ [uploads-and-r2.md](uploads-and-r2.md)), the guest experience (→ [guest-flow.md](guest-flow.md)), caps/billing (→ [billing-caps.md](billing-caps.md)), operator-side moderation/reports (→ [admin-observability.md](admin-observability.md)).
> GROWS BY: integrate-in-place.

## Dashboard landing (Events · Uploads · Likes · Trash)

[`/dashboard`](../../src/app/(app)/dashboard/page.tsx) is the host home, consolidated into four tabs
(Phase 4; **Likes** added Phase 5), deep-linkable via `?tab=` ([`dashboard-tabs.tsx`](../../src/components/app/dashboard-tabs.tsx)
syncs the URL with `history.replaceState` so switching stays instant, no server round-trip):
- **Events** — hosted + saved events MERGED into one list, interleaved by recency (hosted by `created_at`,
  saved by `saved_at`, so a just-created OR just-saved event lands top) + icon-differentiated (a calendar
  glyph vs a bookmark) on the shared `EventCard`. Saved cards keep their visibility masking + unsave (→
  [notifications-analytics-growth.md](notifications-analytics-growth.md)).
- **Uploads** — the host's OWN media across ALL events (host uploads + guest uploads), via the authenticated
  `get_my_uploads` RPC (UNION of host-arm + guest-arm; `is_host_upload` + event/type/date make it filter-ready
  for a future cross-gallery filter; presigned server-side; ≤200 with a truncation footer). Reuses `MediaGrid`
  + the lightbox (view + per-item download + **delete-own** via a confirm-gated Trash control → the
  `remove_my_upload` RPC; optimistic removal) + a gated event-context caption per item →
  [uploads-and-r2.md](uploads-and-r2.md). A guest's self-deletion stays private to the host → [lifecycle-recovery.md](lifecycle-recovery.md).
- **Likes** (Phase 5) — every photo/video the viewer has LIKED across all events (newest-liked first), via the
  authenticated `get_my_likes` RPC (it re-applies the like access predicate, so a now-inaccessible like drops
  out + never leaks its key). Reuses `MediaGrid` + the lightbox; here the heart (tile or lightbox) UNLIKES and
  drops the item. "Like" = a favorite collected from ANY gallery (distinct from Save = an event bookmark);
  anonymous guests get the like button + the same create-account flow as Save. The per-event like COUNT is
  HOST-ONLY — a subtle "♥ N" badge on the event-detail management gallery (`get_event_like_counts`,
  host-gated), never on a guest surface; it also seeds the future sort/filter. → [database-security.md](database-security.md), [guest-flow.md](guest-flow.md).
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
qr_token) so the Share step can render the real QR + link. Settings are edited later on the event's
dedicated `/settings` route ([`event-settings-form.tsx`](../../src/components/app/event-settings-form.tsx) —
since S4·B an ORCHESTRATOR (the one form + Save) over `event-settings/*-section.tsx`; see "The event page" below). `enforce_event_limit`
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
- **The "Require guest accounts" toggle (gated-gallery P3, [ADR-0017](../adr/0017-gated-gallery-view-access.md))
  is `allow_anonymous_uploads` shown INVERTED** (switch ON = accounts required = `allow_anonymous_uploads:false`);
  the column/schema/server Pro-gate are unchanged. A live "what your guests will experience" line under the
  access controls + the dashboard event-detail access line both render the SAME `guestExperienceSummary()`
  ([`guest-experience-summary.ts`](../../src/lib/events/guest-experience-summary.ts)) - one source, no drift.
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

## The event page (gallery-first, P5 S3·3b)

[`/dashboard/[eventId]`](../../src/app/(app)/dashboard/[eventId]/page.tsx) mirrors the guest experience: the
gallery IS the page under a minimal editorial header. Composition (top → bottom): an **editorial status-row
header** (event name + a stat line of date / items / contributors / views — `contributorCount` computed
LOCALLY from the media rows, distinct `guest_id` + host, so it stays host-accurate even for password/private
events where `getGalleryStats` would zero it — + config-status chips: visibility Open/Password/Private + an
Accepting-uploads dot) → a **command bar** → the **review teaser** (only when pending exists) → the
**Uploads** gallery ([`event-uploads.tsx`](../../src/components/app/event-uploads.tsx), now gallery-only).

- **Command bar** ([`host-command-strip.tsx`](../../src/components/app/host-command-strip.tsx)): Share PRIMARY
  + Add + Settings, responsive (Share full-width with Add+Settings beneath on a phone, one row when wide —
  viewport breakpoints are correct here, it's page-width). **Share** opens
  [`EventShareDialog`](../../src/components/app/event-share-dialog.tsx) (QR + copy link), which surfaces the
  **QR designer** ("Customize" — a fun, core, growth-loop feature, kept in the share flow NOT tucked into
  settings) + a quiet link to Settings.
- **Add** (the ratified upload combo, host edition): the command Add toggles the inline upload panel; a
  **floating Add** appears once the bar scrolls out of view (never both, via a sentinel — `FloatingAddButton`
  + `useInViewSentinel` reused from guest), with a live "N uploading" chip (`HostUpload` reports its in-flight
  count up).
- **Settings = a dedicated ROUTE** ([`/settings`](../../src/app/(app)/dashboard/[eventId]/settings/page.tsx)):
  the settings form (decomposed S4·B — an orchestrator over `event-settings/{details,visibility,uploads,
  danger-zone}-section.tsx`, sections reading the one form via `useFormContext`) + the link/slug (URL) config
  + the **Deleted** recovery bin (intentionally behind settings — the retrieval path is where a host looks). A
  lean CSS route crossfade (`[data-route-fade]` in globals.css, `@starting-style`) gives the "view-transition
  feel" without the experimental View Transitions API; the sections settle in a light `--arrive-i` stagger
  atop it. **Leaving with unsaved edits warns** (S4·C): a client wrapper
  ([`settings-with-guard.tsx`](../../src/components/app/event-settings/settings-with-guard.tsx)) owns the
  form's `dirty` (the form reports via `onDirtyChange`) and guards a HARD nav
  ([`use-unsaved-changes-guard.ts`](../../src/lib/use-unsaved-changes-guard.ts) → `beforeunload`) + the
  back-link (Next 16 `Link.onNavigate` → preventDefault → a confirm Dialog → Discard `router.push` / Keep
  editing). Scope: the back-link + beforeunload ONLY (not every app-shell link, not popstate).
- **Hydration:** the SSR'd surfaces (header, command-bar row, teaser) are native-`title` ONLY — NO radix
  Tooltip on SSR'd elements (the silent prod-hydration regression cause, see [architecture.md](architecture.md)).
  Rich client UI (the share dialog, QR designer, the focused review takeover) is safe inside client islands.
- **Motion (S4·A):** the focused-review takeover is a full-screen radix `Dialog` with an OPEN CASCADE
  (`[data-review-tile]`), a bulk-action REMOVAL EXIT (`[data-exiting]`), and an ALL-CAUGHT-UP success beat
  (`[data-unlock-success]`); plus checkmark pops (`[data-check-pop]`), a QR-preset stagger
  (`[data-preset-arrive]`), and panel + rare-state fades. All the felt timings are var-tunable LIVE via the
  dev-only, design-key-gated **motion tuner** ([`motion-tuner.tsx`](../../src/components/dev/motion-tuner.tsx);
  opened with `?key=` on the event page, `isDesignGateOpen`; the `--tune-*` hooks live in
  [design-system.md](design-system.md)). The takeover's optimistic logic (the `itemsKey` resync +
  revert-on-failure) is unchanged; the parent ALWAYS renders `HostReview` so the beat + the close-exit survive
  the revalidation that empties the queue.

## Moderation & curation (host side)

`media.status` enum `pending | approved | hidden | removed`; `create_media` sets `pending`/`approved` from
the event's `moderation_mode`. The host grid ([`host-media-grid.tsx`](../../src/components/app/host-media-grid.tsx))
does per-item Approve/Hide/Unhide/Remove. Pending uploads (`hold_for_approval`) get the **review surface**
([`host-review.tsx`](../../src/components/app/host-review.tsx), P5 S3·3b·D, polished S4·A2/A3): a faded-edge
teaser opens a **full-screen radix `Dialog`** with tap-to-select + a sticky bulk bar (Approve / Hide the
selection, or Approve all), optimistic with revert-on-failure — the grid cascades in, acted tiles fade+scale
out before the list reflows, and clearing the LAST pending plays an "all caught up" beat before it closes
(see "The event page" → Motion). Mutations: `setMediaStatus` / `removeMedia` /
`approveAllPending` + the bulk pair `approveBulk`/`hideBulk` (scoped to `status='pending'` — the review queue,
so a crafted call can't flip approved/hidden/removed media). **Remove is soft**
(`status='removed'` + `removed_at`) — frees the slot immediately; the cron reclaims after the 30-day
recovery window. → [lifecycle-recovery.md](lifecycle-recovery.md). (Operator/admin proactive moderation +
the reports queue live in [admin-observability.md](admin-observability.md).)

**The gallery-action model (P5 S3·3c, cross-surface).** The host gallery is the shared `MasonryColumns`;
moderation rides in via a HOVER-REVEALED top-right action row (`HostTileOverlay`), colored per action on
direct hover (the emil "monochrome at rest → color on hover/state" rule; the palette is the
[design-system](design-system.md) action colors). **Desktop:** the full suite (approve/hide/unhide/remove
+ download + like). **Mobile:** the row is `hidden md:flex` — only Like + Download stay; **hide/remove move
to the lightbox**. **Hidden media renders at 30% opacity** (`dimItem`) — the active-vs-hidden mark, both
kept in-gallery. The **shared lightbox** ([`media-lightbox.tsx`](../../src/components/shared/media-lightbox.tsx))
carries the host's full set as a grouped "enjoy | curate" pill (`[like · count · download · share] | [approve-or-hide-or-unhide · remove]`),
gated `viewerIsHost && onSetStatus` so the **guest pill is behavior-identical** (it just gains the same
action colors). Remove is modal-confirm; approve/hide/unhide are direct (revalidate the path). `setStatus`/
`remove` come from the ONE `useModeration(eventId)` hook (shared by the tile overlay + the lightbox; hide
toasts "Hidden from everyone" from both). The host can also **Like** (a normal like; the gallery wraps a
`LikesProvider`); the read-only per-event like COUNT badge is distinct from the toggle.

**Host upload (two-way media).** The host adds media from the event page via the command bar's **Add**
(+ the floating Add on scroll; see "The event page" above) → a dropzone
([`host-upload.tsx`](../../src/components/app/host-upload.tsx)). The pipeline + the `create_media_as_host`
invariants live in [uploads-and-r2.md](uploads-and-r2.md).

## Highlight reel — SCAFFOLD ONLY (tabled)

A DB scaffold exists (`highlight_reels` table + status enum; `media.highlight_score`/`clip_*`/
`reel_eligible`/`preview_key`) but **no processing ships**. Hard constraint: transcode/stitch runs in an
**external worker, NOT Vercel functions** (ADR-0003). Tabled pending a product + architecture decision (the
worker platform) — see [`../ROADMAP.md`](../ROADMAP.md).

## See also

[ADR-0010](../adr/0010-one-link-per-event.md) · [ADR-0012](../adr/0012-custom-event-slug.md) · [ADR-0007](../adr/0007-event-visibility-password-protection.md) · [uploads-and-r2.md](uploads-and-r2.md) · [guest-flow.md](guest-flow.md) · [billing-caps.md](billing-caps.md).
