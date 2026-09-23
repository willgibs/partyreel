# Host app: events, create wizard, QR, slug, welcome, moderation

> ROLE: the authenticated host's event-management surfaces.
> BELONGS HERE: the dashboard, the `events` model + create wizard, QR designer + print sheet, custom slug, first-time welcome, the event hub + its settings, host curation/moderation, the host-upload UI entry, the reel room + export. · NOT HERE: the upload pipeline + R2 (→ [uploads-and-r2.md](uploads-and-r2.md)), the guest experience (→ [guest-flow.md](guest-flow.md)), caps/billing (→ [billing-caps.md](billing-caps.md)), operator-side moderation/reports (→ [admin-observability.md](admin-observability.md)).
> GROWS BY: integrate-in-place.

## Dashboard landing

[`/dashboard`](../../src/app/(app)/dashboard/page.tsx) is the host home, a PULSE rather than an inbox: what needs you,
then what just arrived. It has no filter chips (`FilterChips` renders only in the lab) and no personal feeds: your
uploads, likes and followed hosts live in the profile's owner mode (→ [profiles-social.md](profiles-social.md)). Four
bands, in this order (notices and storage, the most global, sit above the events):
- **What needs you** — one NEXT BEST STEP per event from a pure rule
  ([`next-step.ts`](../../src/lib/dashboard/next-step.ts)), first match wins: a queue waiting, uploads paused, a live
  album with items but no reel, an event dated tomorrow; then the account's storage step over 85%. It renders once the
  host has an event.
  ★ **It must never render as a void.** A band wired to the review queue is blank for every up-to-date host, so the
  rule ships instead and an empty result renders a calm "Nothing needs you" line. Past three steps the band FOLDS
  (`foldNextSteps`, `next-step-band.tsx`): the top three by tone, the rest behind one "+N more" chip that expands in
  place; a band that fits is never re-ranked.
- **The storage line** — the ambient `StorageMeter`, UNCONDITIONAL: a host with no events still has a plan and a
  shelf. The over-cap grace banner is its own red top alert, never inside the meter.
- **Your events** — the events you host and the events you added photos to (Guest cards), by recency, in two views
  (the events-list bullet under "Events & the create flow").
- **Just arrived** — the newest approved uploads in a window that WIDENS until it holds twelve (the last hour, then
  today, then the newest across events), captioned with the window it settled on
  ([`arrivals.ts`](../../src/lib/dashboard/arrivals.ts)); with nothing approved it renders nothing. ★ These tiles are
  the ONE host surface that keeps the `[data-media-tile]` arrival fade (no `data-static`): they literally just arrived.
  Reads + presigns live in [`pulse.ts`](../../src/lib/db/queries/pulse.ts), apart from `events.ts` on purpose: every
  event room and the settings sheet share `events.ts`, and the home's reads there would tie them to the dashboard.

A host with nothing in the events list sees the create-first hero (`events-empty-teaser.tsx`), the storage line and the
create door, and no "what needs you" band: a rule with nothing to rule on is the empty surface the pulse exists to
avoid. A first live event holds the pulse as above and grows no share prompt: sharing stays the event's own door.

**The claim ticket** sits directly above Your events, rendered only when
[`getMyClaimableGuestRows()`](../../src/lib/db/queries/claims.ts) finds rows typed under the signed-in account's own
CONFIRMED email at some names-mode door before that email was proved. One row per event (`ClaimsCard`,
[`claims-card.tsx`](../../src/components/app/dashboard/claims-card.tsx)): `Claim` or `Not mine`, `Claim all` as a
no-confirmation shortcut, `Finish` to apply. Anything not claimed at Finish is removed under a named confirmation,
since that is the guest saying those uploads were not theirs
([`claims-actions.ts`](../../src/app/(app)/dashboard/claims-actions.ts) → `claim_guest_rows_by_email` /
`disown_guest_rows_by_email`). An unclaimed name leaves the guest list and the host's Guests room with its
uploads, since both list only guests with an approved upload (`getEventGuestList`); the guest row itself
survives, empty, for the device that minted it. A nameless profile never meets it: the `/dashboard` name gate (`requireNamedProfile()`
in `dashboard/layout.tsx`, → [auth-accounts.md](auth-accounts.md)) redirects to `/welcome` first, which prefills the
name from the most recent claimable row's typed name when there is no OAuth name.

## Events & the create flow

`events` (host_id, opaque `qr_token` = the single DB-generated link, `moderation_mode`, `visibility` +
`event_password_hash`, `accepting_uploads`, `require_verified_email` (a DB trigger keeps the legacy
`allow_anonymous_uploads` exactly opposite for code that still reads it), `require_upload_to_view`,
`max_upload_bytes` (the per-upload cap on GUEST uploads, 25 MiB–10 GiB or null; the host's own uploads are exempt),
`qr_style`, `custom_slug`, `deleted_at`/`purge_at`). The **sole create path** is the **`/dashboard/new` wizard**
([`create-event-wizard.tsx`](../../src/components/app/create-event-wizard.tsx)): **Name → Style → the beat**. Step 1
is ONE borderless field on a rule, at the size the name will be; the note and the date are edited only in the
settings sheet. Step 2 is the style picker, where a host learns the code's style exists. It
creates **once at commit** (an abandoned wizard leaves no row) via the non-redirecting `createEventInWizard`
([`dashboard/actions.ts`](../../src/app/(app)/dashboard/actions.ts)), which RETURNS the event (id + qr_token) so the
beat can draw the real QR + link. Settings are edited in the event's settings SHEET
([`event-settings-form.tsx`](../../src/components/app/event-settings-form.tsx): an ORCHESTRATOR, the one form + Save,
over `event-settings/*-section.tsx`). `enforce_event_limit` guards `MAX_EVENTS` in SQL. **Events have no end date**:
deletion is the only lifecycle exit (anti-abuse).

★ **THE BEAT** is step 3 and happens exactly once in an event's life, **by construction**: only pressing Create
reaches it. It draws the real code in a plain mat (`DemoFrame`'s composition borrowed, not its component: the event has
no photograph yet), two doors out (Print the table cards → the print route in a new tab; Share the link →
`navigator.share`, else the clipboard) and one primary door to the event. `EventSlugControl` is NOT here: it belongs to
the share sheet, where the readable link lives.

★ **THE CAP IS A DOOR, NOT A DEAD BUTTON.** A host must never do the work of creating an event and only then learn the
plan cannot hold it. The route computes `atCap` with the dashboard's OWN math (`profile.event_slots ?? MAX_EVENTS[tier]`,
exactly as `enforce_event_limit` does in SQL), and the wizard renders the refusal INSTEAD of the form: the plan's real
number, the event holding the slot, Delete (→ the settings sheet) and Pro. So the dashboard's "New event" button stays
a LIVE link at the cap. Copy comes from the number ("holds 3 events"), never a literal "one". `enforce_event_limit`
stays the guard behind the door (the wizard toasts on `limit_reached`).

**Invariants / gotchas:**
- **The wizard route must NOT guard at-cap with a `redirect`, and the wizard must SNAPSHOT `atCap` at
  mount.** A Server Action refreshes the route it was called from, so the post-create refresh re-renders
  `/dashboard/new` with `atCap` now true: a `redirect` there bounces the host away before the beat renders, and an
  island reading the live prop swaps the beat for the refusal. `useState(() => atCap)` answers both;
  `create-flow.test.tsx` re-renders with the flag flipped and asserts the beat survives. General rule: no eligibility
  redirect AND no eligibility prop read live on a route whose post-Server-Action refresh must show a success state.
- The style step previews with a **placeholder token** (`previewJoinUrl` in
  [`share-urls.ts`](../../src/lib/events/share-urls.ts), 32 chars like a real one, so the module density matches):
  the real `qr_token` doesn't exist pre-insert.
- **Settings are NOT auto-save**: toggles persist only on **Save changes**. When verifying a settings change, click
  Save and confirm the DB.
- **"Require verified emails" reads `events.require_verified_email` directly, NO INVERSION** (switch ON = true). OFF
  is not anonymity: a guest types a display name at the door and uploads under it with a small unverified mark. **FREE
  for any tier + DEFAULT-ON** (the column default is `true`): a verified email is safer and captures a real address
  (the growth loop). Turning it OFF first opens a **consequence-confirm Dialog** via the shared
  [`ConfirmSwitch`](../../src/components/ui/confirm-switch.tsx), the one primitive for every consequential switch
  (never hand-rolled per field): it owns the glyph beside the label and the deferred open, a tick late so radix's
  dismissable-layer doesn't catch the switch's own click and auto-close it. Turning it back ON is instant.
  ENFORCEMENT is the gated gallery (→ [guest-flow.md](guest-flow.md)): `resolveGalleryDecision` teaser-gates an
  unverified guest, `create_guest` refuses the join without a confirmed email, and `create_media` refuses each
  upload from a row with no `verified_at`. The live "what your guests will
  experience" line under the access controls is `guestExperienceSummary()`
  ([`guest-experience-summary.ts`](../../src/lib/events/guest-experience-summary.ts)).
- **"Require an upload to view" (`events.require_upload_to_view`, off by default) holds the full album from a guest
  until one of their own uploads has completed**, approved or held. `ConfirmSwitch` asks on the ON edge here
  (`confirmWhen: (next) => next`): asking a guest to contribute first is THIS switch's consequential direction, which
  the primitive's predicate allows per caller. **FREE for any tier**, no legacy twin (`GATED_EVENT_SETTINGS` stays
  password + custom_slug only). The gate FAILS OPEN while the event isn't accepting uploads or the album has hit its
  storage/ingress cap, so a guest is never held at a step they cannot pass. ★ An upload keeps the door open whatever
  the HOST does to it (hidden, removed), and stops keeping it open once the guest removes it themselves (Will,
  2026-09-22, "Own deletes close it"); a claimed row counts through the account. ENFORCEMENT is the same gated gallery
  (→ [guest-flow.md](guest-flow.md) "Gallery access") plus a SERVICE-ROLE-ONLY read,
  `get_upload_gate(event_id, session_token, user_id)` ("has this viewer contributed, and is the album full"), never
  client-callable. `guestExperienceSummary()` COMPOSES a fresh sentence for this branch rather than appending a clause.
- Only `name` is required; everything else is minimal + editable later (lowest-friction).
- **The events list draws two ways, and the choice is a COOKIE.** Cover cards by default; a row view (the cover behind
  at 12%, the counts in columns, the newest few beside the name) behind a toggle opposite "Your events", with a sort
  menu (Newest · Most waiting · Name) that rides with the rows. The bin and the events you added to are FILTERS of this
  one list (the Show menu: All events · Guest · Deleted; any other value resolves to All events), never a
  chip row, and the filter shows in BOTH views: it is the only door to the bin.
  ★ **The events you added to are Guest cards** (guest by upload, Will 2026-09-22: "uploading to an event is now
  effectively saving"): every event where the account holds a LIVE upload (pending, approved or hidden) and is not
  the host, read from the uploads themselves (`getMyGuestEventCards`, admin client, the account's own rows only), so
  a card leaves the moment its last live upload does, and nothing else puts another host's event on a dashboard.
  `EventCard`'s `guest` variant wears the profile's own Guest marker (`RoleMarker`, shared with `/u/[slug]`) and a
  "Hosted by" byline, with no per-row action. Masked by the album's rules
  ([`guest-events.ts`](../../src/lib/dashboard/guest-events.ts)): a private album blank and locked, a password album
  linked with no cover, a cover (the newest approved photograph, `adminCoverUrls`) only for an open one; newest first
  by the account's own latest upload there.
  ★ **The view is a cookie set by a Server Action, not localStorage, and that is load-bearing**: the
  server has to know the view before the first byte or every cold load paints cards and swaps to rows
  after hydration. Setting a cookie in a Server Function also re-renders the page, so the toggle needs no
  `router.refresh()`. The view is per device (`pr_events_view`); there is no `profiles.events_view` column.

## QR designer

In-app QR styling so hosts never leave for an external stylizer. **`qr-code-styling`** MUST be dynamic-imported INSIDE
a `useEffect` ([`styled-qr.tsx`](../../src/components/app/styled-qr.tsx)): it touches `window`/`document` on
construction, which crashes the SSR pass. Presets are single-sourced in
[`qr-presets.ts`](../../src/lib/constants/qr-presets.ts) (`classic`/`bold`/`rounded`/`dots`), persisted on
`events.qr_style` (a plain **text** column, app-validated, so presets grow without a migration; unknown/legacy →
`classic`). Chain: `StyledQr` (renderer) → `QrPresetPicker` ([`qr-preset-picker.tsx`](../../src/components/app/qr-preset-picker.tsx),
the wizard's step 2 and the designer's body) → `EventQr` (the plate) + `QrDownloadMenu` (SVG/PNG off the plate's own
instance) → `QrDesignerDialog`, in the event's SHARE SHEET. `StyledQr` draws every code a host sees on a SCREEN.
★ **A code's size is set in CSS, never by re-rendering it.** `StyledQr` draws a fixed-pixel SVG from `size`;
the picker's swatches, the share sheet's plate and the mini-modal scale that drawing with one rule
(`w-full` + `height:auto` on a square viewBox). `size` is the RESOLUTION and the baked quiet zone, so scaling only ever
goes down.
★ **Whether a code scans is decided by the MODULE, not the code**
([`lib/qr/module-floor.ts`](../../src/lib/qr/module-floor.ts)): the count comes from the URL's length and the preset's
error correction (M for classic/bold, Q for rounded/dots), and the renderers reserve quiet zones differently:
`StyledQr` takes `round(size * 0.1)` per side INSIDE its box, `FooterQr` bakes 4 modules per side into the viewBox.
Floors: **3 px** per module on a screen, **0.5 mm** on paper; `module-floor.test.ts` runs every shipped size at the
longest link a real event can carry.
**Invariant:** every preset keeps DARK data modules on a WHITE background; brand color only tints the corner finder
patterns. Prove a new preset by SCANNING it (the host UI is auth-gated → verify on the launch-prep alias).

### The paper the app prints

One design, three pieces: **nine table cards to a page, a welcome sign, a poster**, at
[`/dashboard/<id>/print`](../../src/app/(print)/dashboard/[eventId]/print/page.tsx), reached from the create beat, the
share sheet and the launch list.

- ★ **Its own route group, `(print)`, and that is structural rather than stylistic.** Every host route renders
  inside `(app)/layout.tsx`, which is `AppShell`, a STICKY header, and a sticky element prints on every sheet (the
  chrome stamped across the top, one card short). The group renders no shell, so there is nothing to hide. The URL
  still begins `/dashboard`, so the surface rule keeps it off the admin host. ★ **It does NOT inherit the `(app)`
  auth gate**, so [`(print)/layout.tsx`](../../src/app/(print)/layout.tsx) re-declares it with `getUser()` and the page
  re-reads the event through RLS (`notFound()` on null).
- ★ **Zero client JS on the sheet.** The codes are `FooterQr` (the marketing chrome's DOM-free server renderer,
  imported and never edited): nine client islands can lose the race with a print dialog already open, and a code that
  has not painted prints as a blank square nobody checks until the party. The cost: the printed code is always the
  classic SHAPE whatever the event's preset (the styled presets are a `qr-code-styling` client feature); same data,
  same scan.
- ★ **Every length is mm and every type size is pt** ([`lib/qr/stock.ts`](../../src/lib/qr/stock.ts)): CSS absolute
  units are physical on paper (96 px = 1 in), so the preview at 100% is what prints. The sheet box is **186 × 252 mm**,
  inside the browser's own default margin on BOTH Letter and A4, because there is **no `@page` anywhere** (it cannot
  be scoped to a selector, so a margin here would re-margin the help articles and legal documents;
  `legal-print.test.ts` is the house tripwire). A card is 62 × 84 mm and deliberately NOT called A7: nine A7 cards
  never fit one sheet.
- The print rules live in `globals.css` under ONE opt-in hook, `data-print-stock`, every selector scoped to it; the
  page's screen half carries the shared `data-print-hide`. A PDF is the same dialog's destination, so there is one
  button.

## Custom event link (slug)

Pro / Event-Pass hosts can set an optional human-friendly **alias** `/e/<slug>` for the one event link; the permanent
`/e/<qr_token>` + the QR never change and the slug is NOT a second capability. `events.custom_slug` (nullable,
case-insensitively unique among non-deleted events via a partial index, RPC-write-only) is set/cleared by
`set_event_slug` / `clear_event_slug` (authenticated-only SECURITY DEFINER, tier-gated on the `event_password_hash`
pattern). `get_event_by_qr_token` resolves `qr_token OR custom_slug` (token wins) and returns the canonical `qr_token`.
Validation + a reserved-word list: [`validation/event.ts`](../../src/lib/validation/event.ts) +
[`reserved-slugs.ts`](../../src/lib/constants/reserved-slugs.ts); the UI is
[`event-slug-control.tsx`](../../src/components/app/event-slug-control.tsx) (set/change/remove), whose one home is
the event's SHARE SHEET: **debounced live availability** (the authenticated `check_slug_available` RPC,
browser-called and request-id race-guarded; the pure classifier is `evaluateSlugInput` in
[`slug.ts`](../../src/lib/slug.ts)), a change/remove warning dialog (both break the live link), and a name-derived
suggestion chip. Downgrade keeps the slug resolving + removable but not changeable.

**Slugs are MUTABLE and there are deliberately NO redirects.** Changing or removing one frees the old string for
another event immediately and the old link simply 404s: an alias that outlived its event would be a worse promise
than a dead one. Soft-deleting an event frees its slug too (the partial unique index ignores deleted rows). A 32-hex
slug is REFUSED so nothing can shadow the token namespace; the reserved-word list is a brand and clarity guard, not a
routing one. The URL is `/e/<slug>`, never a top-level `/<slug>`: it reuses the one route with its `noindex` and OG,
with zero collision risk against top-level pages (the reserved list stays valid if a top-level path is ever added).
The hub's link row, the code mini-modal and the print sheet show a claimed slug as `<site>/e/<slug>` through
`preferredEventUrl` (`share-urls.ts`); what they copy and encode is still the permanent link.

## First-time host welcome

A full-page **`/welcome`** intro (never a coachmark overlay or a "click here" tour): the required name step (when the
profile has none), then a FOUR-screen tour (when `welcomed_at` is null) → the create wizard
([`welcome-flow.tsx`](../../src/components/app/welcome-flow.tsx)). The tour QUOTES three of the marketing site's
how-it-works pictures (`StepPicture` for `create`/`share`/`fill`, from
[`sections/how-it-works/`](../../src/components/marketing/sections/how-it-works), never redrawn, so a host's first
minute looks like the site that sold them) under a copy plate, then closes on `ReelPicture` with "Create my first
event" / "I'll look around first". Its one addition is motion: a slow 16s scale-only drift
([`welcome-flow.css`](../../src/components/app/welcome-flow.css)) whose only declaration lives inside the
`prefers-reduced-motion: no-preference` block (bible 14), LINEAR on purpose (the house's ambient-drift rule, as
`marketing.css`'s `mkt-kenburns`/`mkt-wall-drift`), a deliberate bible-12 exception: an ambient breath, not a
control's feedback, so the 300ms ceiling does not bind it. Shown **once** via `profiles.welcomed_at` (null =
unwelcomed): `/dashboard` redirects there while it is null ([`welcome.ts`](../../src/lib/welcome.ts)
`shouldShowWelcome`), and `/dashboard` and `/dashboard/new` redirect a nameless profile there too.
**Every exit calls `markWelcomed` BEFORE navigating** (an RLS self-update through `markWelcomedAction` in
[`(app)/actions.ts`](../../src/app/(app)/actions.ts)), or the `/dashboard` guard bounces the host straight back. The
`/welcome` route itself must NOT gate on `welcomed_at` or the name (no loop). `welcomed_at` is on the `profiles`
host-writable allowlist. The "how it works" copy and pictures are single-sourced in
[`how-it-works.ts`](../../src/lib/constants/how-it-works.ts) and
[`sections/how-it-works/`](../../src/components/marketing/sections/how-it-works), shared with the marketing page.

## The event page

[`/dashboard/[eventId]`](../../src/app/(app)/dashboard/[eventId]/page.tsx) is a **HUB**: a live QR code left of the
title + metadata + link stack, a row of CARDS into the event's rooms, and the ALBUM beneath them in most-recent order,
the page's subject. `event-feed.tsx` (the stacked feed the hub replaced, with the `event-feed-action-bar.tsx` and
`event-filter-pills.tsx` only it imports) has no importer, not even the lab: dead code, whatever its neighbours'
comments say.

★ **It is the ONE wide page in the host app**: a host sees as many photographs at once as a guest. The page marks its
root `data-app-wide` and [`AppShell`](../../src/components/shared/app-shell.tsx) answers in `:has()` (a page is the
layout's grandchild and cannot hand a prop up), so BOTH containers drop the 1280 cap; the logo, the code, the cards row
and the album's first column share ONE left line.

**The header is one object.** A real, scannable ~112px `StyledQr`
([`share/event-code-door.tsx`](../../src/components/app/share/event-code-door.tsx)) as tall as the title stack, in a
`<button aria-label="Show the code for {event}">` **beside** the h1, never inside it (an h1 containing a control stops
being the page's accessible name). ★ **The header carries no status chips:** a paused event dims the code under
"Paused" (`title="Uploads paused"`), and visibility rides the **Settings card's value line**. Under the metadata, the
link row ([`share/event-link-row.tsx`](../../src/components/app/share/event-link-row.tsx)) SHOWS the readable URL
(middle-truncated at 375) and always COPIES the permanent `qr_token` one, confirmed IN PLACE (a 90ms pop and an
`aria-live` line), never a toast.

**The cards row** ([`event-feed/event-cards-row.tsx`](../../src/components/app/event-feed/event-cards-row.tsx)):
Review · Reel · Guests · **Settings LAST**. ★ The Guests card ("N guests" while the host's list is on, "Turn on the
list" while it is off) and the header's people count read THE ONE COUNT (`getEventGuests`, the album header's own
function: a confirmed guest once per person, a named unconfirmed one once per row, never the host), so the hub, the
Guests room and the album say one number for one party, in one word. A `role="group"` of **LINKS, never tabs**: three rooms and a sheet, and
nothing switches a panel in place. Sticky at `top-14`, condensing **in place** on an IntersectionObserver (a remount
would drop the QR pill's `view-transition-name` mid-morph and restart the ticking count). The Review count ticks down on
return (a rAF even under reduced motion, so no setState lands in an effect body); the edge fades show only while
something is past the edge.
★ **Share's place in the sticky row** is a **QR pill that exists ONLY while the header's code is off screen**,
carrying the morph's name while it is the code on screen, so nothing is duplicated at rest.

**Rooms, sheets, and the album.** Review, Reel and Guests are ROOMS (routes with a crumb); Settings and Share are
SHEETS; the album is the hub page itself.
- **The crumbs** ([`shared/crumbs.tsx`](../../src/components/shared/crumbs.tsx)): "Partyreel / the event / the room"
  in the bar, `<nav aria-label="Breadcrumb">` with `aria-current` on the last step, cut at 375 to the parent step
  behind a back chevron. `CrumbsProvider` lives inside `AppShell` and each route declares `<SetCrumbs>`. ★ The trail
  lands at HYDRATION (a page cannot hand a prop up to its layout and CSS cannot carry an event's name); the bar's fixed
  height means nothing shifts, and the h1 carries the name throughout.
- **The two sheets ride `?room=`**, owned by one client island
  ([`share/event-share-provider.tsx`](../../src/components/app/share/event-share-provider.tsx)). ★ `?room=` IS the
  state, read from `useSearchParams` with no mirrored `useState`, so a `router.refresh()` after a settings action
  cannot close the panel. Opening pushes a history entry whose marker is a **FIELD on the state Next merges**: Next's
  patched `pushState` copies `__NA` onto the object it is handed and its `popstate` handler does
  `if (!state.__NA) window.location.reload()`, so replacing the state wholesale turns Back into a full reload. Closing
  calls `history.back()` only when the marker is ours (a bookmarked deep link replaces the URL in place instead).
  Radix portals keep the album mounted and scrolled behind.
- **Share** ([`share/event-share-sheet.tsx`](../../src/components/app/share/event-share-sheet.tsx)) is the ONE sharing
  surface: a one-line title, the CODE at the sheet's width (full width in a hand, capped at 360 px, sized by
  `.pr-share-code` in [`share.css`](../../src/components/app/share/share.css)), ONE row of **Copy link · Share · Open ·
  Print** (the native share only where the browser has one), then the quiet doors (SVG/PNG downloads, the designer)
  and the custom-link claim. ★ **Never draw the code in a second sharing surface**: two surfaces mean a fix to either
  only half-lands (`create-flow.test.tsx` pins `event-share-dialog.tsx` gone). The dashboard card's QR chip
  ([`event-card-qr.tsx`](../../src/components/app/event-card-qr.tsx)) is a plain `<Link>` to `?room=share`, which the
  hub resolves server-side into this sheet already open.
- **Settings** ([`event-settings/event-settings-sheet.tsx`](../../src/components/app/event-settings/event-settings-sheet.tsx))
  imports `EventSettingsForm` whole. The scrim, Escape and the close button all land on one unsaved-changes guard, and
  `beforeunload` covers a reload. **`/settings` survives as a `redirect` to `?room=settings`**: it is a published URL.
- **The QR mini-modal** ([`share/event-code-modal.tsx`](../../src/components/app/share/event-code-modal.tsx)) takes
  NO URL: a look at the code is a beat, not a destination. It grows out of the header's code on the **native View
  Transitions API** (the `morph-delegate.tsx` pattern, 240ms on `--ease-emphasis`, name-scoped in
  [`share/share.css`](../../src/components/app/share/share.css) because `::view-transition-*` are document-global).
  Exactly one of header / pill / modal carries the name at a time (a duplicate makes the browser skip the transition).
  On a phone it is the whole screen, white for scanner contrast, the code at `min(80vw, 260px)`, with Copy link, the
  native Share where the browser has one, and Everything (the share sheet). ★ Its entrance is the one **sanctioned
  hole in bible 15**: `floatingTransitionEntrance` in [`floating-layer.ts`](../../src/components/ui/floating-layer.ts)
  declares no animation, because the transition IS the entrance, and falls back to the standard clock under reduced
  motion. `floating-layer.test.ts` lists it by name, since its family scan reads `ui/` only.
- **Before the first photograph the album's room is a LAUNCH LIST**
  ([`event-feed/launch-list.tsx`](../../src/components/app/event-feed/launch-list.tsx)), derived from the event's own
  NULLS, so it lists only what is LEFT: Set the date (when `event_date` is null) and Write a note for guests (when
  `description` is null), both → `?room=settings`, and Print the table cards (→ the print route), always last because
  the app cannot observe it as done. Share the code joins as a fourth door only while the list has fewer than three
  items. The section header reads "Before the first photo" with the outstanding count, and goes back to "Album" when a
  photograph lands. It is a server component passed down as a slot, so `EventUploads` (a client island) never needs the
  event's fields. A held-only event shows "Everything's in Review" instead: it is full, not empty.
- ★ **THE HUB IS LIVE: an upload lands while the host is looking.** `EventLive` (exported from
  `event-gallery.tsx`, mounted once in the header's metadata row) spends a `router.refresh()` on EXACTLY two
  signals and never on a timer: the guest's own Realtime doorbell
  ([`use-gallery-doorbell.ts`](../../src/lib/guest/use-gallery-doorbell.ts), the public `gallery:<qr_token>` channel,
  bursts coalesced), or a changed validator from
  [`/api/events/<id>/live`](../../src/app/api/events/[eventId]/live/route.ts) (RLS-scoped reads, no presigns, a
  bodiless 304 when nothing moved), polled on the guest album's hybrid cadence (60 s while the socket is up, 12 s when
  it is down, stopping when the tab goes hidden). ★ **The poll is not redundant with the socket**: the
  `media_gallery_doorbell` trigger fires only on the APPROVED-VISIBLE set, so on a moderated event a held upload wakes
  nobody; the host fingerprint ([`lib/events/host-fingerprint.ts`](../../src/lib/events/host-fingerprint.ts): event
  id, the visible ids and statuses, the PENDING count) is how the one person who can approve it hears of it. A refresh
  is the page's whole RSC (eleven queries plus three presigns an item), which is why nothing spends one on a
  clock. ★ The first 200 only SEEDS the validator, or every load would refresh itself. `HostMediaGrid` marks arrivals by
  diffing its own item IDS across the refresh (never the presigned urls, which roll about every 30 minutes) and passes
  them as `arrivedIds`; **`stagger` stays OFF** (a seeded first-render entrance is what the emil contract forbids on a
  host album), and the glow runs regardless, on the tile's own `::after`. The pip renders nothing until the channel is
  subscribed.
- **The album** ([`event-feed/event-gallery.tsx`](../../src/components/app/event-feed/event-gallery.tsx)) carries Add
  photos, Download all and Select (those two only while it has photos) and one View menu, so Download and Select stay
  the row's only other verbs. The bin is the menu's Deleted filter, and the menu always renders, so a host reaches an
  empty bin from an empty album. ★ The bin is fetched **on demand**
  through `listDeletedMediaAction` (a `getUser()`-gated Server Function), never with the page: each item needs its own
  presign, and the hub must not pay N of them for a drawer a host opens once. Bin items are never in the album's count.
  ★ **The View menu** ([`ViewMenu`](../../src/components/shared/view-menu.tsx), one shared primitive taking arbitrary
  radio `groups`, on the shipped `ui/dropdown-menu.tsx`) holds three groups here: **Tile size** (180/240/300, setting
  `--album-column`, `masonry.tsx`'s own knob, on the ancestor wrapping the album grid, persisted per device in the
  **`pr_tile_size` cookie** ([`tile-size-cookie.ts`](../../src/lib/shared/tile-size-cookie.ts)), read and painted
  inline by the hub page (`events-view.ts`'s pattern), never localStorage, which would repaint the album's column
  width after hydration on every load); **Sort**, shipped `disabled` with a "Coming soon" hint, because the album is an
  opaque server-rendered slot (`EventUploads`, presigned in the RSC) and a client "sort" could only reorder what is
  mounted; and **Filter** (All / Deleted). [`TileSizeControl`](../../src/components/shared/tile-size-control.tsx), the
  standalone tile-size cluster, renders only in the lab. The guest album mounts the same `ViewMenu` (tile size and a
  Yours filter).
- **The Reel room** holds the builder before the reel's birth and the Studio after it (see "Reel curation" below); its
  card reads "Create reel" until then. Legacy `?section=` / `?eventTab=` deep links redirect into the rooms
  (`legacySectionRoom` in [`lib/event/sections.ts`](../../src/lib/event/sections.ts)).

**ONE responsive Sheet for the product** ([`ui/sheet.tsx`](../../src/components/ui/sheet.tsx)): a side panel at a desk,
a bottom sheet in a hand, **opt-in by the `responsive` prop**. It emits `data-side="responsive"` so none of the four
fixed-side rules can race it, and its posture pair lives in `floating-layer.ts`. The default `side` stays for
`marketing/chrome/mobile-menu.tsx` and the design shell, and `ui/drawer.tsx` stays (the lab's gallery demos draw it).
The share, settings, pricing, guest-flow and admin destructive sheets all use it.

- **Hydration:** the SSR'd surfaces are native-`title` ONLY, with NO radix Tooltip on SSR'd elements (the silent
  prod-hydration regression, see [architecture.md](architecture.md)). Rich client UI (the sheets, the mini-modal, the
  QR designer) is safe inside client islands.
- **`loading.tsx`** draws the hub's own shape as the `"hub"` variant of the one shared
  [`RouteSkeleton`](../../src/components/shared/route-skeleton.tsx), wired to exactly the three routes with a real
  pre-paint wait: the dashboard (`"pulse"`), the hub, and the reel room (`"studio"`, the dark room itself).

## Moderation & curation (host side)

`media.status` enum `pending | approved | hidden | removed`; `create_media` sets `pending`/`approved` from the event's
`moderation_mode`. The album grid ([`host-media-grid.tsx`](../../src/components/app/host-media-grid.tsx)) moderates per
item (the gallery-action model below). Pending uploads (`hold_for_approval`) surface in the **Review ROOM** ([`/review`](../../src/app/(app)/dashboard/[eventId]/review/page.tsx)): `ReviewSection` draws
it and the thin [`review-room.tsx`](../../src/components/app/event-feed/review-room.tsx) boundary owns the triage state
machine ([`use-review-triage.ts`](../../src/components/app/event-feed/use-review-triage.ts)). Four states: **pending**
(the triage grid under an amber header with the count), **caught-up**, **moderation-off** (a one-tap "Turn on review"
teaser → `updateEventAction { moderation_mode: hold_for_approval }`, no confirm turning ON), and the **beat** (the "All
caught up" pop).
- The grid ([`review-grid.tsx`](../../src/components/app/event-feed/review-grid.tsx)) is the shared
  `SelectableMediaGrid` on the UNIFORM layout (a fixed `4 / 5` `object-cover` tile, `UNIFORM_TILE_ASPECT`, three
  across in a hand, auto-fill on the `--album-column` floor from `sm` up) because uniformity standardizes selection
  hit-targets; the album keeps the natural-ratio masonry. It is a `layout: "masonry" | "uniform"` prop on the SHARED
  grids (`MasonryColumns` + `SelectableMediaGrid`, default masonry). **Browse** mode peeks a tapped item full-bleed
  (so scrolling never selects by accident); **select** mode toggles with a `[data-check-pop]` checkmark (a video ▶
  still peeks).
- The bulk controls live once in [`review-actions.tsx`](../../src/components/app/event-feed/review-actions.tsx), in the
  room's header in BOTH modes: `FeedSectionHeader`'s action slot must never go empty, or a host mid-selection has no
  visible Hide, Approve or Cancel. **Approve all** is the FAST primary path (`approveAllPending`, no confirm: most
  moderation is scroll-then-approve); **Select** turns the header into the shared
  [`BulkBar`](../../src/components/app/event-feed/bulk-bar.tsx) (All/Clear · N · Hide · Approve · Cancel,
  `GalleryBulkBar`'s sibling).
- **Turning moderation OFF** in the settings sheet while a queue exists pops a `ConfirmSwitch` confirm that names the
  count; on save `updateEventAction` calls `approveAllPending`: the modal is the host's CONSENT, the server is the
  INVARIANT (live mode never holds pending media; idempotent, `getUser` + RLS-scoped).
- Optimistic with revert-on-failure: acted tiles fade+scale out (`[data-exiting]`) before the list reflows, and
  clearing the LAST pending plays the beat (~2.5s, `--tune-review-beat-ms`), during which the just-approved photos are
  **preloaded** (their stable presigned URLs recur byte-identical in the album, so it paints from cache).
- **Tiles render via the shared `MediaTile`** (a plain `<img>` / `<video>` poster), NEVER `next/image`: its optimizer
  400s on the short-lived presigned R2 URLs.
- Mutations: `setMediaStatus` / `removeMedia` / `approveAllPending` + the bulk pair `approveBulk`/`hideBulk` (scoped
  to `status='pending'`, so a crafted call can't flip approved/hidden/removed media). **Remove is soft**
  (`status='removed'` + `removed_at`): it frees storage at once, and the cron reclaims after the 30-day recovery window
  → [lifecycle-recovery.md](lifecycle-recovery.md). Operator moderation + the reports queue live in
  [admin-observability.md](admin-observability.md).

**The gallery-action model (cross-surface).** Every album grid is the shared `MasonryColumns`; each surface declares
its tile verbs as `tileActions`, drawn as ONE glass pane at the tile's top-right **at a desk only** (`hidden md:flex`):
a phone tile carries marks only (an active like, a play mark, a subtle count) and every action lives in the lightbox.
Monochrome at rest, each verb colored on direct hover, an active one keeping its color with a SUBTLE `/25` fill (the
[design-system](design-system.md) action colors). The host's row is a FIXED `like, download, hide/show`, **CLOSED at
three**; hide/show is ONE slot (EyeOff / persistent amber Eye) so toggling swaps the glyph in place. **Add-to-reel and
DELETE are deliberately NOT tile verbs:** a hover fan of five on a dense masonry grid is a misclick trap, and those two
are the consequential ones. Delete lives in the lightbox + album bulk-Select (hide on the tile covers the urgent case
reversibly); add-to-reel belongs to the reel room (see "Reel curation"). No per-tile Approve:
pending media lives in the Review room. The pane rides the `[data-reveal-chip]` hook, collapsed at rest and opened on
tile hover or keyboard focus; the hook is **`!important`** (it sits in `@layer base`, which the utilities layer
outranks, silently killing the slide and the collapse) and keys on `:hover` / `:focus-visible` / `:has(:focus-visible)`,
NOT `:focus-within`, so a MOUSE click doesn't leave it stuck open. Reduced motion = opacity only. **Hidden media
renders at 30% opacity** (`dimItem`). The **shared lightbox**
([`media-lightbox.tsx`](../../src/components/shared/media-lightbox.tsx)) carries the host's full set as a grouped
"enjoy | curate" pill (`[like · count · download · share] | [add-to-reel · approve-or-hide-or-unhide · remove]`), the
curate group gated `viewerIsHost && onSetStatus`, so the **guest pill is behavior-identical**. Remove is modal-confirm;
approve/hide/unhide are direct. `setStatus`/`remove` come from the ONE `useModeration` hook in `host-media-grid.tsx`,
shared by the tile row and the lightbox over one `useOptimistic` list (hide toasts "Hidden from everyone" from both).
The host can **Like** too (the album wraps a `LikesProvider`); the read-only like COUNT badge is distinct from the
toggle.

**Album bulk-select.** Enter via **Select** in the album header, OR **long-press a tile**
([`use-long-press.ts`](../../src/lib/shared/use-long-press.ts), ~450ms, seeds that tile; an opt-in `onTileLongPress`
on `MasonryColumns`, no-op on the guest / recovery grids). The album swaps to the shared `SelectableMediaGrid`
(previews OFF; ON for Review) and its header's action slot (never a floating bar) becomes the shared
[`BulkBar`](../../src/components/app/event-feed/bulk-bar.tsx)
([`gallery-actions.tsx`](../../src/components/app/event-feed/gallery-actions.tsx)'s `GalleryBulkBar`, `ReviewActions`'s
sibling): `All/Clear · N · Add to reel · Like · Hide|Show · Download · Delete · Cancel`, each in its state color, the
Hide|Show label SMART ("Show" iff every selected item is hidden), Delete behind a count-named confirm. Its rich
tooltips mount behind a hydrated flag (native `title` until one tick after mount), dodging architecture.md's
tile-tooltip hydration regression. The selection STATE lives in a thin `HostSelectionProvider` (mirrors
`HostAddProvider`); the album grid, which owns the `useOptimistic` items, REGISTERS its bulk handlers into it, so the
bar calls `selection.run(kind)` (the seam the review bar uses for `triage.run`). The multi-select primitive is the
shared `useSelection(ids)`.
★ **The album's selection PRUNES to the surviving ids when the album changes, never resets**, so a revalidate or a poll
never wipes an in-progress selection. Add-to-reel + Like loop the idempotent `add_to_reel`/`like_media` RPCs with one
SUMMARY toast, not N (`ReelProvider.addMany` / `LikesProvider.likeMany`); Add-to-reel returns without writing where no
`ReelProvider` wraps the album. Hide/Show + Delete are the GENERAL bulk mutations `setMediaStatusBulk` /
`removeMediaBulk` (plain RLS, `.in('id', …)`, NO `pending` predicate, so they act on the live album, unlike the review
queue's `approveBulk`/`hideBulk`).
★ **The select grid MUST pass the same `clampAspect` as the normal `MasonryColumns`**, or toggling select reflows the
tile heights (the album clamps extreme ratios; the review queue does not).

**Host upload (two-way media).** The album header's **Add photos** opens a dropzone
([`host-upload.tsx`](../../src/components/app/host-upload.tsx)) that posts straight to the album. The pipeline + the
`create_media_as_host` invariants live in [uploads-and-r2.md](uploads-and-r2.md).

## Reel curation, the live composer, and the .mp4 export

★ **The stored reel is ruled out; the reel round replaces it at its wiring.** The reel becomes the event's own: a
live, looping montage of what the album shows from its third reel-eligible item, spliced within seconds by the
doorbell, the host's mood by default with a viewer's own style switch, a first-class screen mode, and a per-event
switch, on by default. A cut is anyone's, made on the device from the reel and never stored (on a paid event, Add to
the album sends it through the ordinary upload queue as the uploader's video, which the live reel skips). Video plays
a range-fetched window of the original decoded on the viewer's device behind Include videos, the poster covering every
failure. Every table, route and job built for a stored reel is dropped once one alias build replaces the old reel, so
build nothing new on the stored reel below; what follows is the reel that ships until then.

**THE PRODUCT SHAPE governs every reel decision.** The reel is core-loop step 5 and the product's North Star: the host
curates the best moments and gets an auto-magical, shareable highlight video. The positioning is the **"wow in
between"**: not a pro editor (a serious editor exports to CapCut), not a toy, an *everyone* tool including low-savvy
hosts and old devices. Four rules follow, and they are why the surface is sparse:
- **Customization is curated randomness, never a timeline.** Style, orientation, cover and length are the whole knob
  set beside the moments; no sliders, no track, no per-clip editing. A style is a KIT (a motion vocabulary, a
  transition set, a pacing rhythm, a grade) that the reel's own seed samples deterministically, so the same style at a
  different seed is a genuinely different take, a re-view is stable, and the player and the encoder match by
  construction.
- **NO MUSIC, and no beat-sync** (a product ruling): music is too personal per event to guess. The export is a clean
  silent montage, which is what Reels and TikTok want: people add trending audio when they post.
- **Generation is FREE on every tier, and the free export is FULL quality.** The free levers are the watermark and the
  shorter length (30 s free, 60 s paid, `MAX_REEL_SECONDS`), never the quality; the watermark doubles as an upgrade
  nudge and free marketing on every shared reel. A paid host's reel carries zero Partyreel branding (the guest
  page's header keeps the Partyreel logo and its CTA on every tier), and there is deliberately **NO end-card** on
  any reel; do not revisit it as a growth extra.
- **Video in the reel is self-bounding.** Only paid tiers (Pro and Event Pass) can upload video, so video in the reel is paid-only with no
  special-casing anywhere. A video item draws its POSTER still.

The **style catalog is product data with ONE source**, the pure
[`engine/style-registry.ts`](../../src/lib/reel/engine/style-registry.ts): 14 entries, 8 media-first **moods** whose
`styleId` IS their themeId and 6 stylized **treatments** that resolve to a native theme. A new style is a catalog entry
plus its draw path.

**Reel CURATION.** The reel layer MIRRORS likes: a `reel_items(event_id, media_id, position, added_at)` join table
(host-scoped SELECT+DELETE RLS, grant-locked, insert ONLY via the access-checked SECURITY DEFINER `add_to_reel` RPC;
un-reel is a host-RLS delete from the browser), a HOST-ONLY `ReelProvider`
([`reel-provider.tsx`](../../src/components/reel/reel-provider.tsx); optimistic, insertion-ordered Set, client-direct,
NO signed-out branch), and a `ReelButton` (a `Clapperboard` in the `--reel` VIOLET, distinct from Like) in the
**lightbox** curate group. **The curation doors that write** are the reel room's own: the **Studio's Moments picker**
(the primary one) and the builder's quick-add. Only the reel room mounts a `ReelProvider`, and it renders no lightbox
and no album grid, so the hub's lightbox `ReelButton` renders nothing and the album's bulk "Add to reel" button still
shows but returns without writing (`host-media-grid.tsx`, `if (!reel) return`), while the builder's empty state still
points hosts at Select in the gallery. No tile chip (see "the gallery-action model"): selection is MODE-based, the room carries the meaning.
Likes are an INPUT SIGNAL to quick-add, **never** membership. Curation is FREE for any tier; ONE reel per event;
approved-only eligibility (the TIMELINE predicate; MEMBERSHIP for host UI/counts/reorder also keeps `hidden`, see
[database-security.md](database-security.md)). **Guests see the reel only after the host SHARES it**:
`setReelGuestVisibleAction` → the `set_reel_guest_visible` RPC flips `highlight_reels.guest_visible` (refuses `empty`
at 0 approved items; no mp4 needed, guests watch the live player). The reveal's "Share with guests", the marquee's
share card and the Studio header all call this ONE seam (`publish-action.ts`); publishing sends no notification, and
one would hook in here. The guest surface is [guest-flow.md](guest-flow.md)'s.
`media.reel_eligible`/`highlight_score`/`clip_*` are DEAD scaffold (`listEventMedia` selects them, nothing reads them):
reel membership is `reel_items`, never `reel_eligible`.

**Reel DRAG-REORDER.** **Reorder is STUDIO-ONLY**: the filmstrip dock reorders while the reel keeps PLAYING above it,
and no other surface has a reorder mode. Drag is our own dependency-free
[`useSortableGrid`](../../src/lib/shared/use-sortable-grid.ts) (pointer drag + a 2-axis FLIP; on a uniform grid the
drop-index is geometric, so hand-rolling beats dnd-kit, see [design-system.md](design-system.md)); the dock feeds it an
explicit `repeat(N, …)` so the maths collapses to a single-row shuffle, and touch keeps the hook's 450ms press-to-grab
so scrolling the dock never lifts a tile. Reorder covers the **FULL membership** (`orderedIds`; hidden members show
dimmed) and persists via the **`reorder_reel(p_event_id, p_media_ids)`** SECURITY DEFINER RPC (the SECOND reel write
path, since `reel_items` UPDATE is grant-revoked): host-owns + a **set-equality membership guard** (rejects
cross-event / partial / dup / stale lists with `reason:'stale'`), one `UPDATE … FROM unnest(…) WITH ORDINALITY`
(1-based positions; only relative order matters). `ReelProvider.reorder` is optimistic and reverts on `stale`/error.
★ **Reorder's optimistic path must build a NEW `Set` from the reordered array**: re-adding into the old Set keeps the
old insertion order.
(The Review uniform grid keeps its `[data-exiting]` beat + `[data-check-pop]`, both tile-local.)

**THE REEL ROOM** (`/dashboard/[eventId]/reel`) holds both sides of the reel's birth. With no `highlight_reels` row it
renders `ReelPanel` inside `ReelStageProvider`: the BUILDER (quick-add → Create → the reveal), and after an in-session
Create the MARQUEE ([`reel-marquee.tsx`](../../src/components/reel/reel-marquee.tsx): status chip + the Studio door ·
the `PosterCard`, a live paused `CanvasReelPlayer`, IO-gated · `ReelShareCard`). Once the row exists, every visit
renders the Studio. ★ The room never redirects: it can create the thing it is named after.
- **Nothing else may be added to the marquee**: every control lives in the Studio, and the marquee mounts **zero
  thumbnail canvases** (the poster is its only player).
- **The STUDIO is the EXCLUSIVE room for every control.** Five slide-up sheets (`[data-rxp-sheet]`, one mounted at a
  time): **Moments** (first) · Style · Cover · Length (with the free-tier `/pricing` upsell and Download) · Layout, plus
  the filmstrip **dock** (order-only).
- **The Moments picker** ([`studio-moments-picker.tsx`](../../src/components/reel/studio-moments-picker.tsx)) is the
  primary selection door: a bespoke dark-room grid (never `SelectableMediaGrid`, which hard-codes the light palette)
  over the full pool, in a `70dvh` sheet. **Membership IS the state** (provider `inReel`; no local selection, no Done):
  a tap writes, the dock reshuffles, the player re-cuts. A member tile wears its reel **POSITION**, and the
  "suggested" hints are `pickQuickAdd`'s own pick, so the picker and the builder agree on a first cut. **Add routes
  through the SILENT `addMany([id])`, never `toggle`** (toggle toasts on every add, and adding several is the normal
  gesture); remove IS `toggle`. A **hidden** member stays removable but cannot be re-added (`add_to_reel`
  refuses non-approved); the rule is pure + pinned in [`lib/reel/moment-picker.ts`](../../src/lib/reel/moment-picker.ts).
  The dock's trailing "+" opens the same sheet and sits OUTSIDE the sortable container (inside, it would be a phantom
  drop slot).

**THE BUILDER + CREATE-BIRTH (pre-Create).** [`reel-builder.tsx`](../../src/components/reel/reel-builder.tsx): the reel
is BORN by an explicit Create in two beats, FILL then CREATE, never one button (that would fire the reveal off an empty
reel). **Quick-add** is the honest fill: [`pickQuickAdd`](../../src/lib/reel/quick-add.ts) is pure + DETERMINISTIC
(mulberry32 off the reel's own seed, no Math.random), blending rank-normalized likes + recency decay + per-uploader
round-robin coverage + a photo/video mix, and its LABEL switches on whether likes actually shaped the pick. It is
offered at ONE approved item: `QUICK_ADD_MIN` (4) does not gate the button (the builder's only in-card fill path), and
a small pool comes back whole with copy that stops promising a guest-wide mix. **Create** runs the reveal IMMEDIATELY
and persists CONCURRENTLY (`persistConfig`'s upsert IS the lazy create); on a failed save the theater still finishes,
then toasts and falls back to the builder.
★ **The panel swap waits for the THEATER, not the save**: `markCreated()` (the builder→marquee switch, which unmounts
the reveal's portal) fires only from the settled card's exits; calling it when the RPC resolves kills the reveal
mid-act.

**The CONFIG BRAIN and the canvas engine.** There is no composer COMPONENT: config, persist and export live in
[`use-reel-config.ts`](../../src/components/reel/use-reel-config.ts), mounted once per surface (`ReelPanel`, and the
Studio; two instances over one event would run two debounce timers against one row). The curated set **plays as a live
`CanvasReelPlayer`** ([`engine/player.tsx`](../../src/lib/reel/engine/player.tsx)) through the same `drawReelFrame` the
encoder steps, so **the preview pixels ARE the export pixels**; the **style · orientation · cover · length** controls
are all client-side and **$0** (nothing encodes until Download). **Style** is the Studio's wall over the 14-style
catalog, grouped as Looks (moods) and Layouts (treatments); **orientation** is portrait 9:16 or landscape 16:9. **There
is no shuffle:** the seed is the stored `seed`, first set from `defaultReelSeed(eventId)`.
★ **The styleId dispatcher** keeps a PURE/rendering split, both under `engine/`:
[`engine/style-registry.ts`](../../src/lib/reel/engine/style-registry.ts) is PURE (catalog → `{kind, themeId}`,
server-safe) so `build-reel-props`/`render-service` resolve `styleId`→theme without a browser runtime; the draw registry
is [`engine/registry.ts`](../../src/lib/reel/engine/registry.ts) (`drawReelFrame` stamps the **watermark in the dispatch
layer**, so no style can export unmarked). Videos draw their POSTER still (`preview_key`).
[`build-reel-props.ts`](../../src/lib/reel/build-reel-props.ts) (pure, tested) turns the `reel_items` order + the
already-presigned `GridMedia` into props (NO 2nd presign/RPC), populating `ReelClip.width/height` so **`fitClip` runs
in prod** (designed mismatched-orientation framing). Config persists (a 600ms debounce, skipped on the first run so
looking never writes) via **`upsert_reel_config(p_event_id, p_style_id, p_orientation, …)`** (SECURITY DEFINER,
host-owns, authenticated-only, lazy-creates the one-per-event `highlight_reels` row; `style_id` + `orientation`
columns, `theme` kept synced = style_id as a legacy column). `media.clip_*` stays unread.

**The .mp4 EXPORT (Download video)** is an on-device WebCodecs encode, the only export path. Support is probed up front
([`engine/support.ts`](../../src/lib/reel/engine/support.ts) + the pure gate
[`engine/encode-gate.ts`](../../src/lib/reel/engine/encode-gate.ts)); a browser that can't encode gets an honest notice
(`NO_EXPORT_NOTICE`) instead of Download, and the reel still plays.
- **CLIENT ENCODE ($0):** [`engine/encode.ts`](../../src/lib/reel/engine/encode.ts) steps the SAME `drawReelFrame`
  through WebCodecs h264 (mediabunny) **on the host's device** from the props the player shows. The export flushes the
  config FIRST (a failed flush stops it: the server hashes the stored config), saves the file locally the moment the
  encode lands, then uploads it to the stable [`reelOutputKey`](../../src/lib/r2/keys.ts) `events/<id>/reel/reel.mp4`
  via **`POST /api/reel/upload`** (begin → mint → finalize; contract in
  [`upload-contract.ts`](../../src/lib/reel/upload-contract.ts), logic in
  [`render-service.ts`](../../src/lib/reel/render-service.ts)).
- **The mint is the abuse choke point:** host-authed (getUser + own-event via
  [`own-event.ts`](../../src/lib/reel/own-event.ts)), the ENTIRE config re-derived server-side
  (`resolveReelRenderContext`: tier → watermark + length clamp, membership, hash; the client's hash is an opaque echo
  recompared each phase, so a mid-encode config change 409s), a **content-length-bound `video/mp4` presign** capped at
  server length × a bitrate budget ([`client-encode-budget.ts`](../../src/lib/reel/client-encode-budget.ts),
  parity-tested against the encoder's max bitrate), the `reel_render_enabled` kill-switch + `reel_render` limiter.
  The idempotent finalize blesses only an object that **landed after the mint stamp** (size within cap +
  `LastModified >= render_started_at`), then stamps `ready` + `rendered_hash` + `render_cost_usd 0` and logs outcome
  `client_encoded` (the mint logs `client_minted`; `render_id` is `client:<uuid>`). The stitching modal
  ([`reel-stitching-dialog.tsx`](../../src/components/reel/reel-stitching-dialog.tsx)) is the encode surface (real
  frame-accurate progress; closing cancels).

**Lazy + cached:** an unchanged reel (a stored `rendered_hash` over media + style + orientation + config + watermark +
`RENDER_VERSION`, currently **3**) re-serves the existing mp4 for $0; any config change invalidates. **Free tier**
stamps the `partyreel.com` watermark: `props.watermark` is **server-tier-derived** (the mint NEVER trusts the client
flag) and stamped in the dispatch layer `drawReelFrame`, so ALL 14 styles carry it. **ACCEPTED caveat (do NOT build
detection):** the server never sees the encoded PIXELS, so a tampered self-encode can at worst upload a watermark-free
reel; it defrauds a watermark, nothing else (key, size and config identity stay server-bound). Ops: the
**`reel_render_enabled` kill-switch** + the deny-all **`reel_render_log`** at [`/admin/reels`](../../src/app/admin/reels)
(labels cover the `client_*` outcomes), the **`reel_render`** abuse-limiter kind, and the **`highlight_reels` render
columns** (status/render_id/rendered_hash/render_error/render_started_at/rendered_at/render_cost_usd, all
service-role-write).
★ **`sweepExpiredEvents` must also delete `reelOutputKey` per purged event.** Event-purge deletes R2 by ENUMERATED
media keys and the orphan sweep IGNORES non-media keys, so the reel mp4, which has no media row, otherwise leaks forever
on deletion with nothing to say so (account deletion appends it the same way). The guest download
(`/api/reel/download`, → [guest-flow.md](guest-flow.md)) presigns this same key.

Canvas + on-device encode is the only render path; nothing renders server-side. The motion-video engine
(`engine/video/`, `lib/reel/live/`, `player-live.tsx`) is on the tree, but only the lab harnesses
(`/design/lab/tools/reel-video`, `/design/lab/tools/reel-live`) drive it: the production reel never passes a video
source.

## See also

[uploads-and-r2.md](uploads-and-r2.md) · [guest-flow.md](guest-flow.md) · [billing-caps.md](billing-caps.md).
