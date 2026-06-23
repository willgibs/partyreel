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
- **The "Require accounts to upload" toggle is `allow_anonymous_uploads` shown INVERTED** (switch ON =
  accounts required = `allow_anonymous_uploads:false`). **FREE for any tier + DEFAULT-ON** (S5 P2, 2026-06-21):
  requiring accounts captures guest emails (the growth loop) and is safer, so it's no longer Pro-gated and new
  events default to it ON (the `enforce_event_pro_gates` trigger is DROPPED + the column default flipped to
  `false`). Turning it OFF (allowing anonymous uploads) first opens a **consequence-confirm Dialog** (the
  delete-confirm pattern; the open is deferred a tick so radix's dismissable-layer doesn't catch the switch's
  own click and auto-close it); turning it back ON is instant. ENFORCEMENT is unchanged (gated-gallery P3,
  [ADR-0017](../adr/0017-gated-gallery-view-access.md)): `resolveGalleryAccess` teaser-gates an unverified
  guest + `create_guest` checks the email. A live "what your guests will experience" line under the access
  controls + the dashboard event-detail access line both render the SAME `guestExperienceSummary()`
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

## The event page (media-forward stacked feed)

[`/dashboard/[eventId]`](../../src/app/(app)/dashboard/[eventId]/page.tsx) mirrors the guest experience: the
gallery IS the page under a minimal editorial header. Composition (top → bottom): an **editorial status-row
header** (event name + a stat line of date / items / contributors / views — `contributorCount` computed
LOCALLY from the media rows, distinct `guest_id` + host, so it stays host-accurate even for password/private
events where `getGalleryStats` would zero it — + config-status chips: visibility Open/Password/Private + an
Accepting-uploads dot) → a **command bar** → a **stacked, pill-filtered feed** (the tabs are RETIRED).

**The feed** ([`event-feed/`](../../src/components/app/event-feed/), the DashboardFeed analog): the RSC page
resolves every section + presigns server-side and hands the **Gallery + Reel** sections to the client
[`EventFeed`](../../src/components/app/event-feed/event-feed.tsx) as opaque pre-rendered SLOTS; the **Review**
queue crosses as DATA (its inline triage is interactive). `EventFeed` owns the active filter (URL-synced via
`replaceState` on `?section=`; legacy `?eventTab=` still resolves) and the urgency order, and decides what
shows. **"All" stacks** the three sections; the [`EventFilterPills`](../../src/components/app/event-feed/event-filter-pills.tsx)
(`All · Review · Gallery · Reel`, aria-pressed buttons in a group — NOT radix Tabs) narrow to one. The
section model is pure + node-safe in [`lib/event/sections.ts`](../../src/lib/event/sections.ts)
(`resolveInitialEventSection`, `orderedSections`; mirrors `lib/dashboard/filters.ts`, replaces the retired
`tabs.ts`), unit-tested. **Urgency order:** Review leads the stack (and the pills) ONLY while moderation is on
AND a queue waits; otherwise the album leads and Review sinks LAST (the caught-up line, or the moderation-off
discovery teaser). The Review pill count is **LIVE + AMBER** (a needs-action signal, driving the order);
Gallery/Reel counts are the server snapshot.

**Section headers + empty states (consistent, no-bounce).** Every section leads with ONE shared
[`FeedSectionHeader`](../../src/components/app/event-feed/feed-section-header.tsx) — a subtle 11px uppercase
eyebrow + the pill-identical count badge (amber on a live Review queue), locked to **`min-h-7`** on the row.
That fixed band height (== the tallest right-slot control, a `size="sm"` h-7 button) is the **no-bounce
guarantee**: a label-only Gallery/Reel header and the Review-pending header (which carries the Select/Approve
all cluster in its action slot) resolve to the same 28px band, so toggling pills never shifts the header's top
(★ keep anything in the action slot ≤ h-7). The empty/teaser bodies share ONE
[`FeedSectionEmpty`](../../src/components/app/event-feed/feed-section-empty.tsx) — centered, card-less, the
size-12 icon circle (the ratified "Reel" treatment, Will 2026-06-22) — used by Reel-empty, Gallery-empty, and
Review caught-up + moderation-off; it renders UNDER the header, never replacing it.

- **Command bar** ([`host-command-strip.tsx`](../../src/components/app/host-command-strip.tsx)): Share PRIMARY
  + Add + Settings, responsive (Share full-width with Add+Settings beneath on a phone, one row when wide —
  viewport breakpoints are correct here, it's page-width). **Share** opens
  [`EventShareDialog`](../../src/components/app/event-share-dialog.tsx) (QR + copy link), which surfaces the
  **QR designer** ("Customize" — a fun, core, growth-loop feature, kept in the share flow NOT tucked into
  settings) + a quiet link to Settings.
- **Add** (the ratified upload combo, host edition): the command Add toggles the inline upload panel (the
  command strip stays the panel HOST). The floating Add is now part of the feed's **contextual action bar**
  (below) — the strip + the bar share one [`HostAddProvider`](../../src/components/app/host-add-provider.tsx),
  so the floating Gallery action opens the SAME panel + scrolls to it, with the live "N uploading" chip
  (`HostUpload` reports its in-flight count to the provider).
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
- **The contextual floating action bar** ([`event-feed-action-bar.tsx`](../../src/components/app/event-feed/event-feed-action-bar.tsx),
  the headline of the redesign): one fixed-bottom surface that generalizes the old floating Add — it appears
  once the feed scrolls past its top sentinel (or whenever review select mode needs its bulk controls) and
  **MORPHS its action to the section the host is looking at** via a scroll-spy
  ([`use-active-section.ts`](../../src/lib/shared/use-active-section.ts), one `IntersectionObserver` with a
  center band): **Review** → `Select` / `Approve all` (then the select-mode bulk bar); **Gallery** → `Add
  photos` (opens the shared panel); **Reel** → a DISABLED `Create reel` placeholder. A section with nothing to
  act on yields no bar. Content crossfades on section change (`[data-section-swap]`). In "All" the active
  section is the scroll-spy's; when filtered, it's the pinned pill.
- **Hydration:** the SSR'd surfaces (header, command-bar row, pills, gallery/reel tiles) are native-`title`
  ONLY — NO radix Tooltip on SSR'd elements (the silent prod-hydration regression cause, see
  [architecture.md](architecture.md)). The feed/sections/bar are client islands fed by RSC-resolved props;
  the section model is pure so the server-resolved initial filter matches the client's first render. Rich
  client UI (the share dialog, QR designer, the review peek overlay) is safe inside client islands.
- **Motion (ratified in the [`/design/event-feed`](../../src/app/(dev)/design/event-feed) lab, Will
  2026-06-22):** **A=Condense** (the sticky pill bar shrinks on scroll, `data-stuck`), **B=Fade** (the filter
  swap re-keys the feed → `[data-section-swap]`), **C=FLIP** (the urgency reorder slides the sections via a
  hand-rolled CSS FLIP, [`use-flip.ts`](../../src/lib/shared/use-flip.ts) — `motion`/framer was trialed +
  REJECTED, the package dropped). The inline Review keeps the takeover's choreography: the bulk REMOVAL EXIT
  (`[data-exiting]`), the checkmark pop (`[data-check-pop]`), and the ALL-CAUGHT-UP beat
  (`[data-unlock-success]`) that plays in place THEN the FLIP relocates the section. All timings are
  var-tunable LIVE via the dev-only, design-key-gated **motion tuner**
  ([`motion-tuner.tsx`](../../src/components/dev/motion-tuner.tsx); the ratified `--tune-*` values are baked
  in globals.css; hooks in [design-system.md](design-system.md)).

## Moderation & curation (host side)

`media.status` enum `pending | approved | hidden | removed`; `create_media` sets `pending`/`approved` from
the event's `moderation_mode`. The host grid ([`host-media-grid.tsx`](../../src/components/app/host-media-grid.tsx))
does per-item Approve/Hide/Unhide/Remove. Pending uploads (`hold_for_approval`) surface in the inline
**Review section** ([`review-section.tsx`](../../src/components/app/event-feed/review-section.tsx)) —
urgency-ordered to the TOP of the feed while a queue waits (the pop-up takeover is RETIRED). The triage state
machine ([`use-review-triage.ts`](../../src/components/app/event-feed/use-review-triage.ts), lifted out of
the old takeover) is OWNED by `EventFeed` and shared by the Review grid AND the floating action bar, so both
read + drive it. Four states: **pending** (the dense triage grid + an amber `Review · N waiting` eyebrow),
**caught-up** (a slim line, sorts last), **moderation-off** (a one-tap "Turn on review" discovery teaser →
`updateEventAction { moderation_mode: hold_for_approval }`, no confirm turning ON, sorts last), and the inline
**beat** (the all-caught-up pop that rides out THEN the FLIP relocates the section to the bottom). The grid
([`review-grid.tsx`](../../src/components/app/event-feed/review-grid.tsx)) is a media-forward natural-ratio
masonry (matches the album) with two modes: **browse** (a tap peeks the media full-bleed — a self-contained
overlay, so scrolling "All" never selects by accident) and **select** (a tap toggles selection + a
`[data-check-pop]` checkmark; a video ▶ peeks before you select). The bulk controls live in the floating bar
(DRY [`review-actions.tsx`](../../src/components/app/event-feed/review-actions.tsx), rendered inline in browse
+ in the bar on scroll): **Approve all** is the FAST primary path (`approveAllPending`, no confirm — most
moderation is a quick scroll-then-approve); **Select** opens deliberate triage where the bar becomes `Select
all · N · Hide · Approve · Cancel`. **Turning moderation OFF** (the `/settings` uploads section) while a queue
exists pops a consequence confirm (names the count; reuses the anon opt-in confirm's `setTimeout`-deferred
open); on save `updateEventAction` calls `approveAllPending` — the modal is the host's CONSENT, the server is
the INVARIANT (live mode never holds pending media; idempotent, `getUser` + RLS-scoped). Optimistic with
revert-on-failure: acted tiles fade+scale out (`[data-exiting]`) before the list reflows, and clearing the
LAST pending plays the "all caught up" beat (~2.5s hold) before the FLIP sinks the section. The just-approved
photos are **preloaded during that beat** (the triage holds their stable presigned URLs, which recur
byte-identical in the album → the reveal paints from cache, not a cold full-res fetch). **Tiles render via the
shared `MediaTile`** (a plain `<img>` / `<video>` poster) — NEVER `next/image`: its optimizer 400s on the
short-lived presigned R2 URLs (the [testing-verification](testing-verification.md) trap). Mutations:
`setMediaStatus` / `removeMedia` /
`approveAllPending` + the bulk pair `approveBulk`/`hideBulk` (scoped to `status='pending'` — the review queue,
so a crafted call can't flip approved/hidden/removed media). **Remove is soft**
(`status='removed'` + `removed_at`) — frees the slot immediately; the cron reclaims after the 30-day
recovery window. → [lifecycle-recovery.md](lifecycle-recovery.md). (Operator/admin proactive moderation +
the reports queue live in [admin-observability.md](admin-observability.md).)

**The gallery-action model (P5 S3·3c, cross-surface).** The host gallery is the shared `MasonryColumns`;
moderation rides in via a HOVER-REVEALED top-right action row (`HostTileOverlay`), colored per action on
direct hover (the emil "monochrome at rest → color on hover/state" rule; the palette is the
[design-system](design-system.md) action colors). **Desktop:** a FIXED left→right order
`reel, like, download, hide/show, delete` (beneficial curation first, danger last). reel (approved-only) rides
the FAR LEFT so hiding an item, which drops it from the reel, collapses the LEADING chip without shuffling the
rest; and hide/show is ONE slot (EyeOff approved / persistent amber Eye hidden) so toggling swaps the glyph in
place. (No per-tile Approve: pending media lives in the **Review section**, never this album/reel grid; the
bulk path is the Review section's Approve all.) Like/Reel get a full-brightness colored STROKE on hover +
a SUBTLE fill (`/25`) when active (liked rose / in-reel violet / hidden amber) so the outline stays legible.
**At rest the hover-reveal chips COLLAPSE** (the `[data-reveal-chip]` hook: width + margin → 0) so the
persistent chips (liked / in-reel / hidden marker) pack neatly to the right edge, then SLIDE back to their
interleaved slots on tile hover (the row uses per-chip margin, not gap, so a collapsed chip leaves no gap).
The hook is **`!important`** (it lives in `@layer base` but the chips' own Tailwind transition + `ml-1` are
in the higher `utilities` layer, which silently killed the slide + the margin-collapse) and keys the expand
on `:hover` / `:focus-visible` / `:has(:focus-visible)` — NOT `:focus-within`, so a MOUSE click doesn't leave
a chip stuck-expanded (keyboard focus still reveals). Reduced-motion = opacity-only, no slide. **Mobile:** the
row is `hidden
md:flex` — only reel + Like + Download (and the persistent hidden marker) stay; **hide/remove move to the lightbox**. **Hidden media renders at 30% opacity** (`dimItem`) — the active-vs-hidden mark, both
kept in-gallery. The **shared lightbox** ([`media-lightbox.tsx`](../../src/components/shared/media-lightbox.tsx))
carries the host's full set as a grouped "enjoy | curate" pill (`[like · count · download · share] | [approve-or-hide-or-unhide · remove]`),
gated `viewerIsHost && onSetStatus` so the **guest pill is behavior-identical** (it just gains the same
action colors). Remove is modal-confirm; approve/hide/unhide are direct (revalidate the path). `setStatus`/
`remove` come from the ONE `useModeration(eventId)` hook (shared by the tile overlay + the lightbox; hide
toasts "Hidden from everyone" from both). The host can also **Like** (a normal like; the gallery wraps a
`LikesProvider`); the read-only per-event like COUNT badge is distinct from the toggle.

**Album bulk-select (the Gallery Select mode).** The Gallery section gains a multi-select mode (shipped
2026-06-22) that mirrors Review's: enter via the **Select** button in the section header / floating bar, OR
**long-press a tile** ([`use-long-press.ts`](../../src/lib/shared/use-long-press.ts), ~450ms, seeds that tile;
threaded through `MasonryColumns` as an opt-in `onTileLongPress`, no-op on the guest / recovery grids). In
select mode the album swaps to the shared `SelectableMediaGrid` (extracted from the review grid; previews OFF
for the album, ON for Review) and the floating bar morphs to a bulk cluster
([`gallery-actions.tsx`](../../src/components/app/event-feed/gallery-actions.tsx)): `All/Clear · N · Add to
reel · Like · Hide|Show · Delete · Cancel`, each in its state color, the Hide|Show label SMART (shows "Show"
iff every selected item is hidden), Delete behind a count-named confirm. The selection STATE lives in a thin
`HostSelectionProvider` (mirrors `HostAddProvider`); the gallery grid (`host-media-grid.tsx`, which owns the
`useOptimistic` items + the reel/likes Sets) REGISTERS its optimistic bulk handlers into it, so the bar calls
`selection.run(kind)` and it delegates to the grid's handler (the same seam the review bar uses for
`triage.run`). The multi-select primitive is the shared `useSelection(ids)` — ★ it PRUNES the selection to the
surviving ids when the album changes (a revalidate / poll), never resets, so an in-progress selection isn't
wiped. Add-to-reel + Like loop the existing idempotent `add_to_reel`/`like_media` RPCs (one SUMMARY toast, not
N — `ReelProvider.addMany` / `LikesProvider.likeMany`); Hide/Show + Delete are the new GENERAL bulk mutations
`setMediaStatusBulk` / `removeMediaBulk` (plain RLS, `.in('id', …)`, NO `pending` predicate — they act on the
live album, unlike the review queue's `approveBulk`/`hideBulk`). ★ The select grid MUST pass the same
`clampAspect` as the normal `MasonryColumns` (the album clamps extreme ratios; the review queue does not) or
toggling select reflows the tile heights.

**Host upload (two-way media).** The host adds media from the event page via the command bar's **Add**
(+ the feed's floating Gallery action on scroll; see "The event page" above) → a dropzone
([`host-upload.tsx`](../../src/components/app/host-upload.tsx)). The pipeline + the `create_media_as_host`
invariants live in [uploads-and-r2.md](uploads-and-r2.md).

## Reel curation (R1 SHIPPED) + the live composer (SHIPPED) + the .mp4 export (SHIPPED)

**Reel CURATION (R1) SHIPPED** (2026-06-21): the host marks approved media as "in the reel" and views the
curated set in the **Reel section** of the stacked feed (the event page is a pill-filtered feed — `Review ·
Gallery · Reel` — not tabs; see "The event page"). The reel layer MIRRORS likes: a
`reel_items(event_id, media_id, position, added_at)` join table (host-scoped SELECT+DELETE RLS, grant-locked,
insert ONLY via the access-checked SECURITY DEFINER `add_to_reel` RPC; un-reel is a host-RLS delete from the
browser), a HOST-ONLY `ReelProvider` ([`reel-provider.tsx`](../../src/components/reel/reel-provider.tsx);
optimistic, insertion-ordered Set, client-direct, NO signed-out branch — wraps the whole feed so an add in
the Gallery reflects instantly in the Reel section), and a `ReelButton` (a `Clapperboard` in the `--reel`
VIOLET, distinct from Like) in the tile overlay (before Like, approved-only) + the lightbox curate group.
Curation is FREE for any tier; ONE reel per event; host-only + host-private (no
Reel on `/e/`); approved-only eligibility. `media.reel_eligible`/`highlight_score`/`clip_*`/`preview_key`
remain DEAD scaffold (zero app code; `reel_eligible` is reserved for a FUTURE auto-scoring worker, NOT this
host signal). The album **bulk-select** (Select mode → Add to reel / Like / Hide-Show / Delete) SHIPPED
2026-06-22 (see "the gallery-action model"). DEFERRED: guest-facing surfacing, multiple reels. (The Review
queue + the moderation-disable auto-approve confirm shipped 2026-06-21 as the Reviews TAB; the
2026-06-22 feed redesign inlined that queue as the urgency-ordered Review section — see "The event page".)

**Reel DRAG-REORDER + uniform Reel/Review grids SHIPPED** (2026-06-22). The **Reel + Review sections render as
UNIFORM grids** (a fixed `4/5` `object-cover` tile, `grid-cols-3 sm:grid-cols-4`) while the **Gallery keeps the
natural-ratio masonry "wow"** (incl. its album select) — uniformity gives the reel a legible sequence to drag
and standardizes Review's selection hit-targets. It's a `layout: "masonry" | "uniform"` prop on the SHARED grids
(`MasonryColumns` + `SelectableMediaGrid`, default masonry; Gallery passes nothing). A `Reorder` button in the
Reel section header (shown when `> 1` item; toggles to `Done`) enters a mode (`ReelReorderProvider`) where the
section swaps to [`reel-sortable-grid.tsx`](../../src/components/app/reel-sortable-grid.tsx): numbered drag tiles,
no per-tile actions/lightbox. Drag is powered by our own dependency-free
[`useSortableGrid`](../../src/lib/shared/use-sortable-grid.ts) (pointer drag + a 2-axis FLIP for the sibling
slide; on a uniform grid the drop-index is a geometric computation, so hand-rolling beats dnd-kit — see
[design-system.md](design-system.md)). Reorder operates on the **FULL membership** (`reel.orderedIds`, hidden
in-reel items show dimmed) and persists via the **`reorder_reel(p_event_id, p_media_ids)`** SECURITY DEFINER RPC
(the SECOND reel write path after `add_to_reel`, since `reel_items` UPDATE is grant-revoked): host-owns + a
**set-equality membership guard** (rejects cross-event / partial / dup / stale lists with `reason:'stale'`), one
`UPDATE … FROM unnest(…) WITH ORDINALITY` (positions become 1-based — only relative order matters). `ReelProvider.reorder`
is optimistic (★ rebuild a NEW `Set` from the reordered array — mutating the old Set keeps the old order) + reverts
on the `stale`/error path. (The Review uniform grid keeps its `[data-exiting]` beat + `[data-check-pop]` — tile-local.)

**The COMPOSER (the live in-app reel) SHIPPED** (2026-06-22, Reel V1 slice 2, commit `4806e71`): the curated set now
**plays as a live in-browser `@remotion/player` reel** in the Reel section (player hero on top, the editable curated
grid below), with auto-magic controls — **theme · shuffle · cover · length** ([`reel-composer.tsx`](../../src/components/reel/reel-composer.tsx)
+ [`reel-player.tsx`](../../src/components/reel/reel-player.tsx)) — all client-side + **$0** (shuffle re-seeds; nothing
encodes). ★ **WYSIWYG single-source**: ONE Remotion composition ([`src/lib/reel/composition/`](../../src/lib/reel/composition))
drives BOTH the in-app Player AND the Lambda render (`workers/reel-render` bundles its Root *from the app* — the app's
`tsconfig` excludes `workers/`, so the canonical composition lives in the app and the worker imports back into it;
`remotion`/`@remotion/player`/`@remotion/media` are exact-pinned `4.0.482` in BOTH, lockstep). The Player shows video
clips by their POSTER still (the `posterMode` flag — the in-browser player can't decode R2 video over CORS; the export
keeps real `<Video>`, byte-identical). [`build-reel-props.ts`](../../src/lib/reel/build-reel-props.ts) (pure, tested)
turns the `reel_items` order + the already-presigned `GridMedia` into the Player's inputProps (NO 2nd presign/RPC).
Config persists (debounced) via **`upsert_reel_config`** (SECURITY DEFINER, host-owns, lazy-creates the one-per-event
`highlight_reels` row on the first edit; `status`/`output_key` stay render-only — host table writes are revoked). The
empty state offers a one-tap **"Fill from gallery"** auto-fill (random batch → `addMany`). `media.clip_*` stays
scaffold (Pro video trim is a later slice).

**The .mp4 EXPORT (Download video) SHIPPED** (2026-06-22, Reel V1 slice 3, commit `f460456`): a **Download video**
button under the composer renders the curated reel to a real `.mp4` on **Remotion Lambda** (AWS) and downloads it.
NOT the sync zip-export shape (a Remotion render is a ~60-90s async job → ONE file): the template is the async
**trigger → webhook** pattern. `POST /api/reel/render` (getUser + own-event) calls the server-only
[`render-service.ts`](../../src/lib/reel/render-service.ts) → `renderMediaOnLambda` (via the
[`lambda-client.ts`](../../src/lib/reel/lambda-client.ts) server-only boundary — `@remotion/lambda/client`, the AWS
SDK never leaks toward a client bundle) writing the mp4 **directly to R2** (`s3OutputProvider`, no copy step) at the
stable [`reelOutputKey`](../../src/lib/r2/keys.ts) `events/<id>/reel/reel.mp4`. The export renders from **full-res
ORIGINALS** (the shareable "wow"; the live player stays on the fast previews) via the same `buildReelProps`
(`posterMode:false`) + a server presign. Completion has TWO idempotent paths: the **signed webhook**
(`/api/internal/reel-complete`, `validateWebhookSignature` over the parsed body) AND the **`GET /api/reel/render`
poll's R2-HEAD finalize** (`LastModified >= render_started_at` disambiguates the stable-key overwrite; the poll is the
local-dev path since Lambda can't reach localhost). The host sees a **"Stitching your reel…" modal**
([`reel-stitching-dialog.tsx`](../../src/components/reel/reel-stitching-dialog.tsx)) that polls + auto-downloads;
**lazy + cached** — an unchanged reel (a stored `rendered_hash` over media+config+watermark+version) re-serves the
existing mp4 for **$0**. **Free tier** stamps a small `partyreel.com` wordmark (server-derived from `profiles.tier`,
mirrored in the live player for WYSIWYG; the render route NEVER trusts the client flag); Pro has none. Ops: the
**`reel_render_enabled` kill-switch** + the deny-all **`reel_render_log`** at [`/admin/reels`](../../src/app/admin/reels),
the **`reel_render`** abuse-limiter kind, the **`highlight_reels` render columns** (status/render_id/rendered_hash/
render_error/render_started_at/rendered_at/render_cost_usd, all service-role-write). ★ **Cleanup landmine fixed:**
event-purge deletes R2 by ENUMERATED media keys + the orphan sweep IGNORES non-media keys, so the reel mp4 (no media
row) would leak forever on deletion — `sweepExpiredEvents` now also deletes `reelOutputKey` per purged event. Live:
~$0.006/render, ~72s on the new account's 10-concurrency cap (the cap is the slow lever, not the architecture).
**DEFERRED:** guest-facing reel surfacing + download (its own next slice), Pro video preview+trim + real-video-in-player
+ R2 CORS, the full theme palette + the reveal moment, eager pre-encode (the lazy-vs-eager re-measure stays gated on the
AWS quota; v1 ships lazy). See [`../specs/reel-v1.md`](../specs/reel-v1.md).

## See also

[ADR-0010](../adr/0010-one-link-per-event.md) · [ADR-0012](../adr/0012-custom-event-slug.md) · [ADR-0007](../adr/0007-event-visibility-password-protection.md) · [uploads-and-r2.md](uploads-and-r2.md) · [guest-flow.md](guest-flow.md) · [billing-caps.md](billing-caps.md).
