# Host app: events, create wizard, QR, slug, welcome, moderation

> ROLE: the authenticated host's event-management surfaces.
> BELONGS HERE: the `events` model + create wizard, QR designer, custom slug, first-time welcome, event settings, host curation/moderation, the host-upload UI entry. · NOT HERE: the upload pipeline + R2 (→ [uploads-and-r2.md](uploads-and-r2.md)), the guest experience (→ [guest-flow.md](guest-flow.md)), caps/billing (→ [billing-caps.md](billing-caps.md)), operator-side moderation/reports (→ [admin-observability.md](admin-observability.md)).
> GROWS BY: integrate-in-place.

## Dashboard landing

[`/dashboard`](../../src/app/(app)/dashboard/page.tsx) is the host home and, since 2026-09-20
(`home=pulse`), a PULSE rather than an inbox: "what needs you, then what just arrived". The five-chip
filter bar is gone, and so are the personal feeds it mixed in - your uploads, your likes and the hosts
you follow moved to the profile's owner mode (→ [profiles-social.md](profiles-social.md)), because your
own likes were never a hosting job. Four bands, in this order (`busy=collapsed`'s note, app-shape round
two, 2026-09-20 — his words: "Notices & storage are more helpful above, more global and immediately
helpful[.] ... I like 'just arrived' underneath the events"):
- **What needs you** — one NEXT BEST STEP per event from a pure rule
  ([`next-step.ts`](../../src/lib/dashboard/next-step.ts)), first match wins: a queue waiting, uploads
  paused, a live album with items but no reel, an event dated tomorrow. Plus the storage step over 85%.
  ★ **It must never render as a void.** Will approved the pulse while warning that the old inbox existed
  so the app would not feel "limited and empty... until more things start to happen". A band wired
  straight to the review queue is blank for every host who is up to date, so the rule is what ships and
  an empty result renders a calm line, not nothing. Past three steps the band FOLDS
  (`foldNextSteps`, `next-step-band.tsx`): the top three by tone, the rest behind one "N more" chip that
  expands in place — a busy host hits six most weeks, and six chips wrapping three lines stops answering
  the question at a glance.
- **The storage line** — the ambient `StorageMeter`, UNCONDITIONAL (it used to need 1+ events). A host
  with no events still has a plan and a shelf. The over-cap grace banner stays its own top alert.
- **Your events** — hosted + saved, interleaved by recency, in either of two views (below).
- **Just arrived** — beneath your events, the newest photographs in a window that WIDENS until it holds
  twelve (the last hour, then today, then the newest across events) and a caption that says which it
  settled on ([`arrivals.ts`](../../src/lib/dashboard/arrivals.ts)). ★ These tiles are the ONE host
  surface that keeps the `[data-media-tile]` arrival fade (no `data-static`): they literally just
  arrived, so the animation is the only thing on the page reporting what changed. Reads + presigns live
  in [`pulse.ts`](../../src/lib/db/queries/pulse.ts), a separate file from `events.ts` on purpose - the
  event SETTINGS page shares `getEventCardStats`, and growing that module ties two surfaces together.

Two edge states, checked against app-shape round two (2026-09-20) and unchanged: a new host (zero
events) sees only the create teaser and the storage line, no band at all; a host's first live event holds
the pulse exactly as above (a calm "nothing needs you" line, one cover card) rather than growing a share
prompt of its own — sharing stays the event's own door (his note: "I don't like prompting a single event
share from the main dashboard separately rather than from the event itself").

## Events & the create flow

`events` (host_id, opaque `qr_token` = the single DB-generated link, `moderation_mode`,
`visibility` + `event_password_hash`, `accepting_uploads`, `require_verified_email` (the identity
reshape, 2026-09-21; the legacy `allow_anonymous_uploads` stays beside it, synced exactly opposite by
a DB trigger for old code paths), `max_upload_bytes` (host per-upload cap for GUEST uploads, 25 MiB–10 GB
or null; the host's own uploads are exempt), `qr_style`, `custom_slug`, `deleted_at`/`purge_at`). The **sole create path** is the **`/dashboard/new` wizard**
([`create-event-wizard.tsx`](../../src/components/app/create-event-wizard.tsx)), rebuilt on the
`first-event` board's ruling (Will, 2026-09-21): **Name → Style → the beat**. Step 1 is ONE borderless field
on a rule at the size the name will be (`asks=one`, his "bigger name edit field"); the note and the date
LEFT the wizard for the settings sheet that already holds both, so nothing is typed on a screen that does
not also show it. Step 2 is the style picker, kept because it is where a host learns the feature exists
(`style=step`, his "Hosts may not know they can adjust it later"). It creates **once at commit** via the
non-redirecting `createEventInWizard`
([`dashboard/actions.ts`](../../src/app/(app)/dashboard/actions.ts)), which RETURNS the event (id +
qr_token) so the beat can render the real QR + link. Settings are edited later in the event's settings
SHEET ([`event-settings-form.tsx`](../../src/components/app/event-settings-form.tsx),
an ORCHESTRATOR (the one form + Save) over `event-settings/*-section.tsx`; see "The event page" below). `enforce_event_limit`
guards `MAX_EVENTS`. **Events have no end date**: deletion is the only lifecycle exit (anti-abuse).

★ **THE BEAT** (`landing=beat`) is step 3 and happens exactly once in an event's life, **by construction**:
only pressing Create reaches it and the route has no other way in. It draws the real code in a plain mat
(`DemoFrame`'s composition borrowed, not its component — the event has no photograph yet), two doors out
(Print the table cards → the print route in a new tab; Share the link → `navigator.share` falling back to
the clipboard) and one primary door to the event. `EventSlugControl` is NOT here: it belongs to the share
sheet, where the readable link already lives.

★ **THE CAP IS A DOOR, NOT A DEAD BUTTON** (`limit=door`, his "Letting them do the work of creating a second
event, then finding out they can't create it on the free plan is bad user experience design"). The route
computes `atCap` with the dashboard's OWN math (`profile.event_slots ?? MAX_EVENTS[tier]`, the
webhook-derived pass count overriding the static limit exactly as `enforce_event_limit` does in SQL) and
passes it plus the events holding the slots; the wizard renders the refusal INSTEAD of the form, naming the
plan's real number and the event, with Delete (→ the settings sheet, where delete lives) and Pro beside it.
The dashboard's "New event" button is therefore a LIVE link at the cap — disabling it made the refusal
unreachable. Copy comes from the number ("holds one event" / "holds 3 events"), never a literal one.

**Invariants / gotchas:**
- **The wizard route must NOT guard at-cap with a `redirect`, and the wizard must SNAPSHOT `atCap` at
  mount.** A Server Action refreshes the route it was called from, so the post-create refresh re-renders
  `/dashboard/new` with `atCap` now true: an at-cap `redirect` fires there and bounces the host away before
  the beat renders (this shipped and live testing caught it), and an island reading the live prop swaps the
  beat for the refusal a half-second after a successful create. `useState(() => atCap)` answers both;
  `create-flow.test.tsx` re-renders with the flag flipped and asserts the beat survives. General rule: no
  eligibility redirect AND no eligibility prop read live on a route whose post-Server-Action refresh must
  show a success state.
- The design step previews with a **placeholder token** (`previewJoinUrl` in
  [`share-urls.ts`](../../src/lib/events/share-urls.ts), a 32-char stand-in the same length as a real token)
  because the real `qr_token` doesn't exist pre-insert.
- **Settings are NOT auto-save**: toggles (e.g. moderation mode) persist only on **Save changes**. When
  verifying a settings change, click Save and confirm the DB; don't assume the toggle wrote on change.
- **The "Require verified emails" toggle reads `events.require_verified_email` directly, NO INVERSION**
  (switch ON = `require_verified_email:true`; renamed from "Require accounts to upload" /
  `allow_anonymous_uploads` in the identity reshape, 2026-09-21 — anonymity left the product, so OFF no
  longer means anonymous: a guest types a display name at the door and uploads under it with a small
  unverified mark). **FREE for any tier + DEFAULT-ON:** a verified email captures a real address (the
  growth loop) and is safer, so it is not Pro-gated and new events default to it ON (the column default
  is `true`). Turning it OFF (skipping email verification) first opens a **consequence-confirm Dialog**
  via the shared [`ConfirmSwitch`](../../src/components/ui/confirm-switch.tsx) (`app-vocabulary` r1,
  `confirm-switch=primitive`: one primitive owns the glyph beside the label and the deferred-open dance — the
  open is deferred a tick so radix's dismissable-layer doesn't catch the switch's own click and auto-close it
  — for any consequential switch, not hand-rolled per field); turning it back ON is instant. ENFORCEMENT is
  the gated gallery (→
  [guest-flow.md](guest-flow.md)): `resolveGalleryAccess` teaser-gates an unverified
  guest + `create_guest` checks the email. A live "what your guests will experience" line under the access
  controls renders `guestExperienceSummary()`
  ([`guest-experience-summary.ts`](../../src/lib/events/guest-experience-summary.ts)).
- Only `name` is required; everything else is minimal + editable later (lowest-friction).
- **The events list draws two ways, and the choice is a COOKIE** (`density=cover`, Will 2026-09-20:
  "let's do both"). Cover cards by default; a row view (the cover behind at 12%, the counts in columns,
  the newest few beside the name) behind a toggle aligned right opposite "Your events", with a sort menu
  (Newest · Most waiting · Name) that rides with the rows. The bin and the saved events are FILTERS of
  this one list, never a chip row, and the filter shows in BOTH views - it is the only door to the bin,
  so hiding it in the row view would strand a default-view host. "Deleted" names one thing.
  ★ **The view is a cookie set by a Server Action, not localStorage, and that is load-bearing**: the
  server has to know the view before the first byte or every cold load paints cards and swaps to rows
  after hydration. Setting a cookie in a Server Function also re-renders the page server-side, so the
  toggle needs no `router.refresh()`. Cross-device persistence would want a `profiles.events_view`
  column; that is an open migration proposal, not shipped.

## QR designer

In-app QR styling so hosts never leave for an external stylizer. **`qr-code-styling`** MUST be
dynamic-imported INSIDE a `useEffect` ([`styled-qr.tsx`](../../src/components/app/styled-qr.tsx)), because it
touches `window`/`document` on construction, which crashes the client component's SSR pass. Presets are
single-sourced in [`qr-presets.ts`](../../src/lib/constants/qr-presets.ts) (`classic`/`bold`/`rounded`/`dots`),
persisted on `events.qr_style` (a plain **text** column, app-validated rather than a DB enum, so presets grow
without a migration; unknown/legacy → `classic`). Chain: `StyledQr` (renderer) → `QrPresetPicker`
([`qr-preset-picker.tsx`](../../src/components/app/qr-preset-picker.tsx), the wizard's step 2 and the
designer's body) → `EventQr` (the plate) + `QrDownloadMenu` (SVG/PNG off the plate's own instance) →
`QrDesignerDialog`, which rides in the event's SHARE SHEET. `StyledQr` also draws the hub's header code and
the mini-modal's, so one renderer serves every code a host sees on a SCREEN.
★ **A code's size is set in CSS, never by re-rendering it.** `StyledQr` draws a fixed-pixel SVG from `size`;
the picker's swatches, the share sheet's plate and the mini-modal all scale that drawing with one rule
(`w-full` + `height:auto` on a square viewBox) rather than measuring a container and drawing again. `size`
remains the RESOLUTION and the baked quiet zone, so scaling only ever goes down.
★ **Whether a code scans is decided by the MODULE, not the code**
([`lib/qr/module-floor.ts`](../../src/lib/qr/module-floor.ts), promoted out of the retired board's frame):
the count comes from the URL's length and the preset's error correction (M for classic/bold, Q for
rounded/dots), and the two renderers reserve their quiet zones differently — `StyledQr` takes
`round(size * 0.1)` per side INSIDE its box, `FooterQr` bakes 4 modules per side into the viewBox. Floors:
**3 px** per module on a screen, **0.5 mm** on paper. `module-floor.test.ts` runs every shipped size at the
longest link a real event can carry.
**Invariant:** every preset keeps DARK data modules on a WHITE background for scannability; brand color only
tints the corner finder patterns. Prove a new preset by SCANNING it (the host UI is auth-gated → verify on partyreel.com).

### The paper the app prints

`venue=sheet` (Will, 2026-09-21: "We should have a full gallery of printable QR designs ready to go...
rather than always requiring the host to design the rest of the assets"). One design, three pieces —
**nine table cards to a page, a welcome sign, a poster** — at
[`/dashboard/<id>/print`](../../src/app/(print)/dashboard/[eventId]/print/page.tsx), reached from the create
beat, the share sheet and the launch list. The gallery of DESIGNS his note asks for is a ROADMAP line.

- ★ **Its own route group, `(print)`, and that is structural rather than stylistic.** Every host route
  renders inside `(app)/layout.tsx`, which is `AppShell` — a STICKY header. A sticky element prints on every
  sheet, so the page would come out stamped with the app's chrome and one card short. The group renders no
  shell, so there is nothing to hide. The URL still begins `/dashboard`, so the surface rule keeps it off
  the admin host with every other host route. ★ **It does NOT inherit the `(app)` auth gate**, so
  [`(print)/layout.tsx`](../../src/app/(print)/layout.tsx) re-declares it with `getUser()` and the page
  re-reads the event through RLS (`notFound()` on null).
- ★ **Zero client JS on the sheet.** The codes are `FooterQr` (the marketing chrome's DOM-free server
  renderer, imported and never edited), because nine codes as nine client islands can lose the race with a
  print dialog the host has already opened — and a code that has not painted prints as a blank square, on
  paper nobody checks until the party. The cost: the printed code is always the classic SHAPE whatever the
  event's preset is (the styled presets are a `qr-code-styling` client feature). Same data, same scan; the
  page says so rather than hiding it. His to overrule.
- ★ **Every length is mm and every type size is pt** ([`lib/qr/stock.ts`](../../src/lib/qr/stock.ts)). A
  print sheet has no viewport, and CSS absolute units are physical on paper (96 px = 1 in), so the preview
  at 100% is what comes out of the printer. The sheet box is **186 × 252 mm**, which fits inside the
  browser's own default margin on BOTH Letter and A4 — because **no `@page` anywhere** (it cannot be scoped
  to a selector, so a margin set here would silently re-margin the help articles and the legal documents;
  `legal-print.test.ts` is the house tripwire). A card is 62 × 84 mm and is deliberately NOT called A7: nine
  A7 cards are 222 × 315 mm and have never fitted one sheet.
- The print rules live in `globals.css` under ONE opt-in hook, `data-print-stock`, with every selector
  scoped to it; the screen half of the page carries the shared `data-print-hide`. A PDF is the same
  dialog's destination, so there is one button.

## Custom event link (slug)

Pro / Event-Pass hosts can set an optional human-friendly **alias** `/e/<slug>` for the one event link;
the permanent `/e/<qr_token>` + the QR never change and the slug is NOT a second capability.
`events.custom_slug` (nullable, case-insensitively unique among non-deleted events via a partial index,
RPC-write-only) is set/cleared by `set_event_slug` / `clear_event_slug` (authenticated-only SECURITY
DEFINER, tier-gated on the `event_password_hash` pattern). `get_event_by_qr_token` resolves
`qr_token OR custom_slug` (token wins) and returns the canonical `qr_token`. Validation + a reserved-word
list: [`validation/event.ts`](../../src/lib/validation/event.ts) + [`reserved-slugs.ts`](../../src/lib/constants/reserved-slugs.ts);
the UI is [`event-slug-control.tsx`](../../src/components/app/event-slug-control.tsx) (set/change/remove), which
lives in the event's SHARE SHEET (its one home since `share=room`, 2026-09-20) AND is reused in the
wizard's Share step. It has **debounced live availability**
(via the authenticated `check_slug_available` RPC, browser-called + request-id race-guarded; the pure
classifier is `evaluateSlugInput` in [`slug.ts`](../../src/lib/slug.ts)), a change/remove warning dialog
(both break the live link), and a name-derived suggestion chip. Downgrade keeps the slug resolving +
removable but not changeable.

**Slugs are MUTABLE and there are deliberately NO redirects.** Changing or removing one frees the old
string for another event immediately, and the old link simply 404s: an alias that outlived its event would
be a worse promise than a dead one. Soft-deleting an event frees its slug too (the partial unique index
ignores deleted rows). A 32-hex slug is REFUSED so nothing can shadow the token namespace, and the
reserved-word list is a brand and clarity guard rather than a routing one. The URL shape is `/e/<slug>`
rather than a top-level `/<slug>` vanity path: it reuses the one route with its `noindex` and its OG, so
there is zero collision risk with present or future top-level pages. A top-level vanity URL stays possible
later, which is why the reserved list is written to be forward-compatible.

## First-time host welcome

A full-page **`/welcome`** intro (never a coachmark overlay: Will dislikes "click here" tours), five
screens as of app-door round two (`tour=film`, 2026-09-20): the required name step, then a FOUR-screen
tour → the create wizard ([`welcome-flow.tsx`](../../src/components/app/welcome-flow.tsx)). The tour is
three of the marketing site's own bespoke how-it-works pictures (`StepPicture` for `create`/`share`/`fill`,
QUOTED from [`sections/how-it-works/`](../../src/components/marketing/sections/how-it-works) rather than
redrawn, so a host's first minute looks like the site that just sold them on the product) breathing under a
copy plate that overlaps each picture's bottom edge, then a closing beat on `ReelPicture` into the same
primary-and-skippable pair as always ("Create my first event" / "I'll look around first"). The one thing
this round adds to a picture the marketing site already drew is motion: a slow 16s scale-only drift, its
own small stylesheet ([`welcome-flow.css`](../../src/components/app/welcome-flow.css)), reduced-motion-safe
by construction (the class's only declaration lives inside the `prefers-reduced-motion: no-preference`
block, bible 14) and LINEAR on purpose (the house's own ambient-drift rule, `marketing.css`'s
`mkt-kenburns`/`mkt-wall-drift`: "constant motion, the conveyor rule"), a deliberate bible-12 exception (an
ambient breath rather than a control's feedback, so the 300ms ceiling for what a person touches does not
bind it). Auto-shown **once** to new accounts via `profiles.welcomed_at` (null = unwelcomed; `/dashboard`
redirects there when null via [`welcome.ts`](../../src/lib/welcome.ts) `shouldShowWelcome`).
**Every exit calls `markWelcomed` BEFORE navigating** (an RLS self-update via the regular client, through
`markWelcomedAction` in [`(app)/actions.ts`](../../src/app/(app)/actions.ts)), or the `/dashboard` guard
bounces the host straight back. The `/welcome` route itself must NOT gate on `welcomed_at` (no loop).
`welcomed_at` is on the `profiles` host-writable allowlist. The "how it works" story, both the copy and now
the pictures, is single-sourced in [`how-it-works.ts`](../../src/lib/constants/how-it-works.ts) and
[`sections/how-it-works/`](../../src/components/marketing/sections/how-it-works) (shared with the marketing
page — edit either once).
A host arriving from the wizard lands on the pulse with no events yet, where the events band renders the
create-first hero (`events-empty-teaser.tsx`) rather than the four bands: the "what needs you" band is
suppressed at zero events, because a rule with nothing to rule on is the empty surface the pulse exists
to avoid. The storage line and the create door still render, so the page is never bare.

## The event page

[`/dashboard/[eventId]`](../../src/app/(app)/dashboard/[eventId]/page.tsx) is a **HUB** (Will's
`event=hub`, 2026-09-20): a live QR code at the left of the title + metadata + link stack, a row of CARDS
into the event's rooms, and the ALBUM beneath them in most-recent order, which is the page's subject. The
Share-primary command strip, the five filter pills and the stacked Review / Reel / Guests sections are
RETIRED; `event-feed.tsx` and `event-feed-action-bar.tsx` stay on disk for the lab alone.

★ **It is the ONE wide page in the host app** (Will's `host=same`, 2026-09-19: a host sees as many
photographs at once as a guest). The page marks its root `data-app-wide` and
[`AppShell`](../../src/components/shared/app-shell.tsx) answers in `:has()` — a page is the layout's
grandchild and cannot hand a prop back up to it — so BOTH containers drop the 1280 cap and keep the gutter.
The logo, the code, the cards row and the album's first column all start on ONE left line.

**The header is one object.** A real, scannable ~112px `StyledQr`
([`share/event-code-door.tsx`](../../src/components/app/share/event-code-door.tsx)) whose height is the
title + metadata + link stack, wrapped in a `<button aria-label="Show the code for {event}">` **beside** the
h1 and never inside it (an h1 containing a control stops being the page's accessible name). It is a code at
REST, not a glyph that opens one: that is what "get the QR and sharing more infusion to the album UI
visually" asked for. ★ **The header's two chips are gone:** "accepting uploads" is now the code's OWN state
(paused = the code dimmed, "Paused" over it, `title="Uploads paused"`), and visibility rides the **Settings
card's value line**. Under the metadata sits the third, subtler link
([`share/event-link-row.tsx`](../../src/components/app/share/event-link-row.tsx)): it SHOWS the pretty URL
(the slug when set, else the `/e/` link middle-truncated at 375) and always COPIES the permanent
`qr_token` one, confirmed IN PLACE with a 90ms pop and an `aria-live` line, never a toast.

**The cards row** ([`event-feed/event-cards-row.tsx`](../../src/components/app/event-feed/event-cards-row.tsx)):
Review · Reel · Guests · **Settings LAST** (the Album card it replaced is not a door any more). A
`role="group"` of **LINKS, never tabs** — three are rooms you navigate to and the fourth opens a sheet, so
nothing here switches a panel in place. Sticky at `top-14`, condensing **in place** on an
IntersectionObserver (a remount would drop the QR pill's `view-transition-name` mid-morph and restart the
ticking count, so the compact state is styling on the same DOM). The Review count ticks down on return
(tabular figures, 200ms, a rAF even under reduced motion so no setState lands in an effect body). Sideways
scrolling with **conditional** edge fades: each edge masks only while something is past it.
★ **Share's place in the sticky row** (his `nav` note asked for "a creative way to get share in there"): a
**QR pill at the row's end that exists ONLY while the header's code is off screen**, carrying the morph's
name while it is the code on screen, so nothing is duplicated at rest.

**Rooms, sheets, and the album.** Review, Reel and Guests are ROOMS (routes with a crumb); Settings and
Share are SHEETS; the album is the hub page itself.
- **The crumbs** ([`shared/crumbs.tsx`](../../src/components/shared/crumbs.tsx), `nav=crumbs`): "Partyreel /
  the event / the room" in the bar, `<nav aria-label="Breadcrumb">` with `aria-current` on the last step,
  cut at 375 to the parent step alone behind a back chevron. `CrumbsProvider` lives inside `AppShell` and
  each route declares `<SetCrumbs>`, so `(app)/layout.tsx` needs no edit. ★ The trail lands at HYDRATION
  (a page cannot hand a prop up to its layout and CSS cannot carry an event's name); the bar's fixed height
  means nothing shifts, and the h1 carries the name throughout.
- **The two sheets ride `?room=`**, owned by one client island
  ([`share/event-share-provider.tsx`](../../src/components/app/share/event-share-provider.tsx)). ★ `?room=`
  IS the state, read from `useSearchParams` with no mirrored `useState`, so a `router.refresh()` after a
  settings action cannot close the panel. Opening pushes a history entry whose marker is a **FIELD on the
  state Next merges** — Next's patched `pushState` copies `__NA` onto whatever object it is handed and its
  `popstate` handler does `if (!state.__NA) window.location.reload()`, so replacing the state wholesale
  turns Back into a full page reload. Closing calls `history.back()` only when that marker is ours (a
  bookmarked deep link has nothing of ours behind it and replaces the URL in place instead). Radix portals
  keep the album mounted and scrolled behind.
- **Share** ([`share/event-share-sheet.tsx`](../../src/components/app/share/event-share-sheet.tsx)) is the
  ONE sharing surface, redrawn at 375 on `hand=same` (Will, 2026-09-21: he kept this surface over two
  prettier ones because "it allows guests to also send out the code or link themselves more easily", then
  said the drawing "could be improved a lot"). Top to bottom: a one-line title, the CODE at the sheet's own
  width (full width in a hand, ~416 px at a desk, sized by `.pr-share-code` in
  [`share.css`](../../src/components/app/share/share.css)), then ONE row of the four verbs a host reaches
  for at a door — **Copy link · Share · Open · Print** (the native share only where the browser has one) —
  then the quiet doors (the SVG/PNG downloads and the designer) and the custom-link claim that used to live
  on the settings route. ★ **`event-share-dialog.tsx` is DELETED**: it was a second surface drawing the same
  code, the same copy row and a quieter designer, so a fix to either only half-landed. The dashboard card's
  QR chip ([`event-card-qr.tsx`](../../src/components/app/event-card-qr.tsx)) is a plain `<Link>` to
  `?room=share` now, which the hub resolves server-side into this sheet already open.
- **Settings** ([`event-settings/event-settings-sheet.tsx`](../../src/components/app/event-settings/event-settings-sheet.tsx))
  imports `EventSettingsForm` whole, so the sheet and the retired route cannot disagree about what a setting
  does. The unsaved guard grew a third door: a sheet has no back-link, so the scrim, Escape and the close
  button all land on one guarded close. **`/settings` survives as a `redirect` to `?room=settings`** —
  it is a URL we published for months.
- **The QR mini-modal** ([`share/event-code-modal.tsx`](../../src/components/app/share/event-code-modal.tsx))
  takes NO URL: a look at the code is a beat, not a destination. It grows out of the header's code on the
  **native View Transitions API** (the `morph-delegate.tsx` pattern, 240ms on `--ease-emphasis`, name-scoped
  in [`share/share.css`](../../src/components/app/share/share.css) because `::view-transition-*` are
  document-global and `theme.css`/`globals.css` belong to another lane). Exactly one of header / pill /
  modal carries the name at a time (a duplicate makes the browser skip the transition). On a phone it is the
  whole screen, white for scanner contrast, the code at 80vw with the event's name under it and
  `navigator.share` as its third action. ★ Its entrance is the one **sanctioned hole in bible 15**:
  `floatingTransitionEntrance` in [`floating-layer.ts`](../../src/components/ui/floating-layer.ts) declares
  no animation, because the transition IS the entrance, and falls back to the standard clock under reduced
  motion. It is listed by name in `floating-layer.test.ts`, whose family scan reads `ui/` only.
- **Before the first photograph the album's room is a LAUNCH LIST**
  ([`event-feed/launch-list.tsx`](../../src/components/app/event-feed/launch-list.tsx), `empty=list`, Will
  2026-09-21: "Three things the app already knows, as three things she can finish. The album takes the room
  back"). The items are derived from the event's own NULLS, so it is a list of what is LEFT rather than a
  checklist with things already ticked: Set the date (→ `?room=settings`) when `event_date` is null, Write a
  note for guests (→ `?room=settings`) when `description` is null, and Print the table cards (→ the print
  route), which is always last because it is the one act the app cannot observe as done. Share the code
  appears under it as a fourth door only while the list has fewer than three items — the code is already in
  the header and on the dashboard card. The section HEADER reads "Before the first photo" with the
  outstanding count, and both go back to "Album" the moment a photograph lands. A server component passed
  down as a slot, so `EventUploads` (a client island) never needs the event's fields. The pending variant
  ("Everything's in Review") stays its own thing: a held event is a full one whose host has not looked yet.
- ★ **THE HUB IS LIVE** (`first=live`, his "It lands while she is looking"). `EventLive` (exported from
  `event-gallery.tsx`, mounted once in the header's metadata row) spends a `router.refresh()` on EXACTLY two
  signals and never on a timer: the guest's own Realtime doorbell
  ([`use-gallery-doorbell.ts`](../../src/lib/guest/use-gallery-doorbell.ts), the public `gallery:<qr_token>`
  channel, ping bursts coalesced), or a changed validator from
  [`/api/events/<id>/live`](../../src/app/api/events/[eventId]/live/route.ts) — ONE RLS-scoped select, no
  presigns, a bodiless 304 when nothing moved, polled on the guest album's own hybrid cadence (60 s while
  the socket is up, 12 s when it is down, paused while the tab is hidden). ★ **The poll is not redundant
  with the socket**: the `media_gallery_doorbell` trigger fires only on the APPROVED-VISIBLE set, so on a
  moderated event a held upload wakes nobody — the host fingerprint
  ([`lib/events/host-fingerprint.ts`](../../src/lib/events/host-fingerprint.ts): event id, the visible ids
  and statuses, the PENDING count) is the only way the one person who can approve it hears that it arrived.
  A refresh is the page's whole RSC (eleven queries plus three presigns an item), which is exactly why
  nothing spends one on a clock. ★ The first 200 only SEEDS the validator, or every load would refresh
  itself. `HostMediaGrid` marks arrivals by diffing its own item IDS across that refresh (never the
  presigned urls, which roll about every 30 minutes) and passes them as `arrivedIds`; **`stagger` stays
  OFF** — the seeded first-render entrance is what the emil contract forbids on a host album, and the glow
  is an animation on the tile's own `::after` that runs regardless. The pip renders nothing until the
  channel is actually subscribed.
- **The album** ([`event-feed/event-gallery.tsx`](../../src/components/app/event-feed/event-gallery.tsx))
  carries Add photos (which left the deleted command strip), Download all, Select, and one **View menu**
  (`app-vocabulary` r2, `controls-home=view-menu`: his crowding note on the r1 cluster — "we may need to
  rethink where all of these actions live" — reopened round two, ruled "Tile size, Sort and Filter move
  behind one button; Download and Select stay the row's only two verbs"). The **Deleted filter** rides
  inside the menu now (the recovery bin joined the album as one of the View menu's Filter options, so
  "Deleted" still names exactly one thing), always rendered so a host reaches an empty bin from an empty
  album exactly as before. ★ The bin is fetched **on demand** through `listDeletedMediaAction` (a
  `getUser()`-gated Server Function), never with the page — each item needs its own presign, and the hub
  must not pay N of them for a drawer a host opens once. The bin's items are never in the album's count.
  ★ **The View menu** ([`ViewMenu`](../../src/components/shared/view-menu.tsx), one shared primitive taking
  arbitrary radio `groups`, on the shipped `ui/dropdown-menu.tsx`) holds three groups here: **Tile size**
  (three steps, 180/240/300, setting `--album-column` — `masonry.tsx`'s own knob — on the ancestor wrapping
  the album grid, persisted per device in the **`pr_tile_size` cookie**
  ([`tile-size-cookie.ts`](../../src/lib/shared/tile-size-cookie.ts), read + painted inline by the hub page,
  `events-view.ts`'s own pattern, rather than localStorage, which the r1 board itself had named — a local
  preference would repaint the whole album's column width after hydration on every load); **Sort**, shipped
  `disabled` with a "Coming soon" hint rather than wired, because this component holds its album as an
  opaque server-rendered slot (`EventUploads`, presigned in the RSC) and never the approved list itself, so
  a "sort" here could only reorder whatever happens to be mounted, not the album; and **Filter** (All /
  Deleted, the bin's lens). The r1 **tile-size cluster**
  ([`TileSizeControl`](../../src/components/shared/tile-size-control.tsx)) is retired from production —
  its own two reserved Sort/Filter pills are what this menu replaced — and stays on disk for the lab, which
  still imports it. The guest album mounts the same `ViewMenu` (`guest-chrome` round two: tile size and a
  Yours filter, his `theirs` note asking for exactly this "new parent dropdown").
- **The Reel room** holds the BUILDER before the reel's birth and the Studio after it, which DELETED the old
  `redirect('?section=reel')` rather than re-pointing it at a filter that no longer exists; the card reads
  "Create reel" until then. Legacy `?section=` / `?eventTab=` deep links redirect into the rooms
  (`legacySectionRoom` in [`lib/event/sections.ts`](../../src/lib/event/sections.ts)).

**ONE responsive Sheet for the product** ([`ui/sheet.tsx`](../../src/components/ui/sheet.tsx)): a side panel
at a desk, a bottom sheet in a hand, **opt-in by the `responsive` prop**. It emits `data-side="responsive"`
so none of the four fixed-side rules can race it, and its posture pair lives in `floating-layer.ts` rather
than in the sheet. The default `side` is untouched for `marketing/chrome/mobile-menu.tsx` and the design
shell, and `ui/drawer.tsx` is NOT retired (the lab's gallery demos draw it). This is the sheet
`guest-shape`'s dialogs, `profile-page`'s quick-look and `app-pricing`'s object inherit.

- **Hydration:** the SSR'd surfaces are native-`title` ONLY, with NO radix Tooltip on SSR'd elements (the
  silent prod-hydration regression cause, see [architecture.md](architecture.md)). Rich client UI (the
  sheets, the mini-modal, the QR designer) is safe inside client islands.
- **`loading.tsx`** draws the hub's own shape (code, title stack, cards row, album) so the retired strip
  never flashes before the cards arrive — the `"hub"` shape of the one shared
  [`RouteSkeleton`](../../src/components/shared/route-skeleton.tsx) (`app-vocabulary` r1, `loading=asneeded`:
  wired to exactly the dashboard, the hub and the Reel Studio, the three routes with a real pre-paint wait;
  the dashboard's is the `"pulse"` shape and the Studio's `"studio"` shape is its first skeleton, the room
  itself rather than the app's light chrome).

## Moderation & curation (host side)

`media.status` enum `pending | approved | hidden | removed`; `create_media` sets `pending`/`approved` from
the event's `moderation_mode`. The host grid ([`host-media-grid.tsx`](../../src/components/app/host-media-grid.tsx))
does per-item Approve/Hide/Unhide/Remove. Pending uploads (`hold_for_approval`) surface in the
**Review ROOM** ([`/review`](../../src/app/(app)/dashboard/[eventId]/review/page.tsx), one of the hub's
cards since `event=hub`, 2026-09-20; the inline urgency-ordered SECTION and the pop-up takeover before it are
both RETIRED). `ReviewSection` is unchanged and still draws it; the triage state machine
([`use-review-triage.ts`](../../src/components/app/event-feed/use-review-triage.ts)) is now owned by the thin
[`review-room.tsx`](../../src/components/app/event-feed/review-room.tsx) boundary rather than shared with a
floating bar, because a room has only one reader. The hub's Review card carries the count and ticks it down
on return. Four states: **pending** (the dense triage grid + an amber `Review · N waiting` eyebrow),
**caught-up** (a slim line, sorts last), **moderation-off** (a one-tap "Turn on review" discovery teaser →
`updateEventAction { moderation_mode: hold_for_approval }`, no confirm turning ON, sorts last), and the inline
**beat** (the all-caught-up pop that rides out THEN the FLIP relocates the section to the bottom). The grid
([`review-grid.tsx`](../../src/components/app/event-feed/review-grid.tsx)) is a media-forward natural-ratio
masonry (matches the album) with two modes: **browse** (a tap peeks the media full-bleed — a self-contained
overlay, so scrolling "All" never selects by accident) and **select** (a tap toggles selection + a
`[data-check-pop]` checkmark; a video ▶ peeks before you select). The bulk controls are DRY in
[`review-actions.tsx`](../../src/components/app/event-feed/review-actions.tsx), rendered inline in the room —
always, select mode included (`FeedSectionHeader`'s action slot never goes empty; it did until
`app-vocabulary` r1 wired the fix, which had left a host mid-selection with no visible Hide, Approve or
Cancel): **Approve all** is the FAST primary path (`approveAllPending`, no confirm — most
moderation is a quick scroll-then-approve); **Select** opens deliberate triage where the header becomes the
shared [`BulkBar`](../../src/components/app/event-feed/bulk-bar.tsx) (`bulk-toolbar=icon`: All/Clear · N ·
Hide · Approve · Cancel, icons with instant sliding tooltips — `GalleryBulkBar`'s sibling, one primitive
behind both). **Turning moderation OFF** (the uploads section inside the
SETTINGS SHEET) while a queue exists pops a consequence confirm via the shared `ConfirmSwitch` (names the
count; its own deferred-open dance, the same one the anon-uploads toggle reuses);
on save `updateEventAction` calls `approveAllPending` — the modal is the host's CONSENT, the server is
the INVARIANT (live mode never holds pending media; idempotent, `getUser` + RLS-scoped). Optimistic with
revert-on-failure: acted tiles fade+scale out (`[data-exiting]`) before the list reflows, and clearing the
LAST pending plays the "all caught up" beat (~2.5s hold). The just-approved
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

**The gallery-action model (cross-surface).** The host gallery is the shared `MasonryColumns`;
moderation rides in via a HOVER-REVEALED top-right action row (`HostTileOverlay`), colored per action on
direct hover (the emil "monochrome at rest → color on hover/state" rule; the palette is the
[design-system](design-system.md) action colors). **Desktop:** a FIXED left→right order
`like, download, hide/show`, and the row is **CLOSED at three** (Will, 2026-08-04). hide/show is
ONE slot (EyeOff approved / persistent amber Eye hidden) so toggling swaps the glyph in place.
**Add-to-reel and DELETE are deliberately NOT tile chips:** a five-chip hover fan on
a dense masonry grid is a misclick trap, and those two are the consequential ones. Neither lost a home:
delete lives in the **lightbox + Gallery bulk-Select** (and hide, still on the tile, covers the urgent
"get it off the album now" case reversibly), and add-to-reel lives in the **lightbox, bulk-Select, and the
Studio's Moments picker** (the primary door). Do not re-add either without re-opening the ruling.
(No per-tile Approve either: pending media lives in the **Review section**, never this album grid; the
bulk path is the Review section's Approve all.) Like gets a full-brightness colored STROKE on hover +
a SUBTLE fill (`/25`) when active (liked rose / hidden amber) so the outline stays legible.
**At rest the hover-reveal chips COLLAPSE** (the `[data-reveal-chip]` hook: width + margin → 0) so the
persistent chips (liked / hidden marker) pack neatly to the right edge, then SLIDE back to their
interleaved slots on tile hover (the row uses per-chip margin, not gap, so a collapsed chip leaves no gap).
The hook is **`!important`** (it lives in `@layer base` but the chips' own Tailwind transition + `ml-1` are
in the higher `utilities` layer, which silently kills the slide + the margin-collapse) and keys the expand
on `:hover` / `:focus-visible` / `:has(:focus-visible)`, NOT `:focus-within`, so a MOUSE click doesn't leave
a chip stuck-expanded (keyboard focus still reveals). Reduced-motion = opacity-only, no slide. **Mobile:** hide
is `hidden md:flex`, so a mobile tile is **Like + Download** (plus the persistent hidden marker) and **hide
moves to the lightbox**. **Hidden media renders at 30% opacity** (`dimItem`), the active-vs-hidden mark, both
kept in-gallery. The **shared lightbox** ([`media-lightbox.tsx`](../../src/components/shared/media-lightbox.tsx))
carries the host's full set as a grouped "enjoy | curate" pill (`[like · count · download · share] | [approve-or-hide-or-unhide · remove]`),
gated `viewerIsHost && onSetStatus` so the **guest pill is behavior-identical** (it just gains the same
action colors). Remove is modal-confirm; approve/hide/unhide are direct (revalidate the path). `setStatus`/
`remove` come from the ONE `useModeration(eventId)` hook (shared by the tile overlay + the lightbox; hide
toasts "Hidden from everyone" from both). The host can also **Like** (a normal like; the gallery wraps a
`LikesProvider`); the read-only per-event like COUNT badge is distinct from the toggle.

**Album bulk-select (the Gallery Select mode).** The Gallery section carries a multi-select mode
mirroring Review's: enter via the **Select** button in the section header, OR
**long-press a tile** ([`use-long-press.ts`](../../src/lib/shared/use-long-press.ts), ~450ms, seeds that tile;
threaded through `MasonryColumns` as an opt-in `onTileLongPress`, no-op on the guest / recovery grids). In
select mode the album swaps to the shared `SelectableMediaGrid` (extracted from the review grid; previews OFF
for the album, ON for Review) and the section header's own action slot (never a floating bar; that surface
retired with `event=hub`, and nothing replaced it there until `app-vocabulary` r1's fix) becomes the shared
[`BulkBar`](../../src/components/app/event-feed/bulk-bar.tsx)
([`gallery-actions.tsx`](../../src/components/app/event-feed/gallery-actions.tsx)'s `GalleryBulkBar`,
`ReviewActions`'s sibling): `All/Clear · N · Add to reel · Like · Hide|Show · Download · Delete · Cancel`,
icons with instant sliding tooltips (`bulk-toolbar=icon`), each in its state color, the Hide|Show label SMART
(shows "Show" iff every selected item is hidden), Delete behind a count-named confirm (its tooltip nests the
dialog trigger, as the lightbox does). The rich tooltip layer mounts behind a hydrated flag (`BulkBar`'s own
SSR-safe native-`title` fallback until one tick after mount — architecture.md's tile-tooltip hydration
regression is exactly the failure this dodges). The selection STATE lives in a thin
`HostSelectionProvider` (mirrors `HostAddProvider`); the gallery grid (`host-media-grid.tsx`, which owns the
`useOptimistic` items + the reel/likes Sets) REGISTERS its optimistic bulk handlers into it, so the bar calls
`selection.run(kind)` and it delegates to the grid's handler (the same seam the review bar uses for
`triage.run`). The multi-select primitive is the shared `useSelection(ids)`.
★ It PRUNES the selection to the
surviving ids when the album changes (a revalidate / poll), never resets, so an in-progress selection isn't
wiped. Add-to-reel + Like loop the existing idempotent `add_to_reel`/`like_media` RPCs (one SUMMARY toast, not
N: `ReelProvider.addMany` / `LikesProvider.likeMany`); Hide/Show + Delete are the GENERAL bulk mutations
`setMediaStatusBulk` / `removeMediaBulk` (plain RLS, `.in('id', …)`, NO `pending` predicate, so they act on the
live album, unlike the review queue's `approveBulk`/`hideBulk`).
★ The select grid MUST pass the same
`clampAspect` as the normal `MasonryColumns` (the album clamps extreme ratios; the review queue does not) or
toggling select reflows the tile heights.

**Host upload (two-way media).** The host adds media from the event page via the command bar's **Add**
(+ the feed's floating Gallery action on scroll; see "The event page" above) → a dropzone
([`host-upload.tsx`](../../src/components/app/host-upload.tsx)). The pipeline + the `create_media_as_host`
invariants live in [uploads-and-r2.md](uploads-and-r2.md).

## Reel curation, the live composer, and the .mp4 export

**THE PRODUCT SHAPE, and it governs every reel decision.** The reel is core-loop step 5 and the
product's North Star: the host curates their event's best moments and gets an auto-magical, shareable
highlight video. The positioning is the **"wow in between"**: not a pro video editor (a serious
editor exports to CapCut), not a toy, an *everyone* tool including low-savvy hosts and old devices, whose
value is the wow rather than pro control. Four rules follow, and they are the reason the surface looks
sparse:
- **Customization is curated randomness, never a timeline.** Style, orientation, cover and length are the
  whole knob set; there are no sliders, no track, no per-clip editing. A style is a KIT (a motion
  vocabulary, a transition set, a pacing rhythm, a grade) that the reel's own seed samples
  deterministically, so the same style at a different seed is a genuinely different take and a re-view is
  stable. Determinism is also what keeps the player and the encoder identical by construction.
- **NO MUSIC, ruled.** Music is too personal per event to guess and timing visuals to a track is a trap.
  The export is a clean silent motion-montage, which is exactly what Reels and TikTok want: people add
  trending audio on the platform when they post. Beat-sync belongs to the same ruling.
- **Generation is FREE on every tier, and the free export is FULL quality.** A janky free reel would read
  as a mediocre product and cost upgrades, so the free levers are the watermark and the shorter length,
  never the quality. The watermark pulls double duty: an upgrade nudge and free marketing on every shared
  reel. Paid hosts carry zero Partyreel branding on their event surface, and there is deliberately **NO
  end-card** on any reel, free or paid; do not revisit it as a growth extra.
- **Video in the reel is self-bounding.** Only paid tiers can upload video at all, so "video in the reel"
  is Pro-only with no special-casing anywhere. When it lands, a style applies motion to STILLS and
  transitions plus grade to CLIPS (a clip plays, it is never Ken-Burns'd); stills come from the small
  previews and clips from the ORIGINALS at export, so no new asset is created. Trim's home is the reserved
  `media.clip_*` columns.

The **style catalog is product data with ONE source**, the pure
[`engine/style-registry.ts`](../../src/lib/reel/engine/style-registry.ts): 14 entries in two families, 8
media-first **moods** whose `styleId` IS their themeId, and 6 stylized **treatments** that resolve to a
native theme. A new style is a catalog entry plus its draw path, never a doc edit.

**Reel CURATION:** the host marks approved media as "in the reel" and views the
curated set in the **Reel section** of the stacked feed (the event page is a pill-filtered feed, `Review ·
Gallery · Reel`, not tabs; see "The event page"). The reel layer MIRRORS likes: a
`reel_items(event_id, media_id, position, added_at)` join table (host-scoped SELECT+DELETE RLS, grant-locked,
insert ONLY via the access-checked SECURITY DEFINER `add_to_reel` RPC; un-reel is a host-RLS delete from the
browser), a HOST-ONLY `ReelProvider` ([`reel-provider.tsx`](../../src/components/reel/reel-provider.tsx);
optimistic, insertion-ordered Set, client-direct, NO signed-out branch; it wraps the whole feed so an add in
the Gallery reflects instantly in the Reel section), and a `ReelButton` (a `Clapperboard` in the `--reel`
VIOLET, distinct from Like) in the **lightbox** curate group. **The three curation doors:**
the **Studio's Moments picker** (the primary one), the **lightbox**, and **Gallery bulk-Select**. There is no
tile-row chip (see "the gallery-action model"), and selection is MODE-based on purpose: the room carries the
meaning, not an icon on every card. Likes are an INPUT SIGNAL to quick-add, **never** membership (the
favorites-vs-reel conflict, ruled). Curation is FREE for any tier; ONE reel per event; approved-only
eligibility (the TIMELINE predicate; MEMBERSHIP for host UI/counts/reorder additionally keeps `hidden`,
see [database-security.md](database-security.md)). **Guests see the reel only after the host SHARES it**:
`setReelGuestVisibleAction` → the `set_reel_guest_visible` RPC flips `highlight_reels.guest_visible`
(refuses `empty` at 0 approved items; mp4 NOT required, because the live player needs no artifact); the share
card, the reveal's settled "Share with guests", and the Studio header all call this ONE seam, and the
reel-published notification hooks HERE when it lands (ruled: no email before it). The guest surface itself
is [guest-flow.md](guest-flow.md)'s. `media.reel_eligible`/`highlight_score`/`clip_*`
remain DEAD scaffold (zero app code; `reel_eligible` is reserved for a FUTURE auto-scoring worker, NOT this
host signal). DEFERRED: multiple reels.

**Reel DRAG-REORDER + uniform Review grids.** The
**Review section renders as a UNIFORM grid** (a fixed `4/5` `object-cover` tile, `grid-cols-3 sm:grid-cols-4`)
while the **Gallery keeps the natural-ratio masonry "wow"** (incl. its album select), because uniformity
standardizes Review's selection hit-targets. It's a `layout: "masonry" | "uniform"` prop on the SHARED grids
(`MasonryColumns` + `SelectableMediaGrid`, default masonry; Gallery passes nothing).
**Reorder is STUDIO-ONLY**: there is no `Reorder`/`Done` header mode in the feed and no sortable-grid swap
there, because reordering beside
a reel that keeps PLAYING (the Studio's filmstrip dock) beats a mode that hides the reel to show a grid. Drag is
powered by our own dependency-free
[`useSortableGrid`](../../src/lib/shared/use-sortable-grid.ts) (pointer drag + a 2-axis FLIP for the sibling
slide; on a uniform grid the drop-index is a geometric computation, so hand-rolling beats dnd-kit, see
[design-system.md](design-system.md)); the dock feeds it an explicit `repeat(N, …)` so its 2-axis maths
collapses to a single-row shuffle. Reorder operates on the **FULL membership** (`reel.orderedIds`, hidden
in-reel items show dimmed) and persists via the **`reorder_reel(p_event_id, p_media_ids)`** SECURITY DEFINER RPC
(the SECOND reel write path after `add_to_reel`, since `reel_items` UPDATE is grant-revoked): host-owns + a
**set-equality membership guard** (rejects cross-event / partial / dup / stale lists with `reason:'stale'`), one
`UPDATE … FROM unnest(…) WITH ORDINALITY` (positions become 1-based; only relative order matters). `ReelProvider.reorder`
is optimistic and reverts on the `stale`/error path.
★ The optimistic path rebuilds a NEW `Set` from the reordered array: mutating the old Set keeps the old order.
(The Review uniform grid keeps its `[data-exiting]` beat + `[data-check-pop]`, both tile-local.)

**THE FEED / STUDIO SPLIT (the composition rule, Will).** The feed's
Reel section is over-controlled for a visual surface, so the two host reel surfaces have disjoint jobs and
that split is load-bearing:
- **The REEL ROOM holds both sides of the reel's birth** (`event=hub`, 2026-09-20). The hub's Reel card is
  the door and reads "Create reel" until a reel exists. PRE-Create the room renders the BUILDER (quick-add →
  Create → the ratified reveal); post-Create it is the Studio. ★ This is what deleted `/reel`'s old
  `redirect('?section=reel')`: the feed section it bounced to no longer exists, and a room that can create
  the thing it is named after never needs to bounce. `ReelPanel` is unchanged and still draws the pre-Create
  face = `reel-marquee.tsx` (status chip + door · the `PosterCard`, a live paused `CanvasReelPlayer`, the
  reel's face, IO-gated · `ReelShareCard`). **Nothing else may be added to it,** and the consequence worth
  keeping is that it mounts **zero thumbnail canvases** (the poster is its only player).
- **The STUDIO (`/dashboard/[eventId]/reel`, post-Create) is the EXCLUSIVE room for every control.** Five slide-up sheets
  (`[data-rxp-sheet]`): **Moments** (first) · Style · Cover · Length (incl. the free-tier `/pricing` upsell,
  which moved down WITH the control) · Layout, plus the filmstrip **dock** (order-only) and Download.
- **The Moments picker** ([`studio-moments-picker.tsx`](../../src/components/reel/studio-moments-picker.tsx))
  is the primary selection door: a bespoke dark-room grid (never `SelectableMediaGrid`, which hard-codes the
  light palette) over the route's full pool, in a `70dvh` sheet. **Membership IS the state** (provider
  `inReel`; no local selection, no Done): a tap writes, the dock reshuffles, the player re-cuts. Per tile: a
  violet **POSITION** badge + check when in-reel, a soft "suggested" hint from `pickQuickAdd` (+ one
  "Add suggested (N)" header chip), a read-only like count, a video badge. **Add routes through the SILENT
  `addMany([id])`, never `toggle`**, because toggle toasts on every add and adding several in a row is the normal
  gesture; remove IS `toggle` (silent on the remove half). A **hidden** item that is already a member stays
  removable but cannot be re-added (`add_to_reel` refuses non-approved); the rule is pure + pinned in
  [`lib/reel/moment-picker.ts`](../../src/lib/reel/moment-picker.ts). The dock's trailing "+" opens the same
  sheet and sits OUTSIDE the sortable container (inside it would be a phantom drop slot).

**THE BUILDER + CREATE-BIRTH (pre-Create, a feed moment).** [`reel-builder.tsx`](../../src/components/reel/reel-builder.tsx):
the reel is BORN by an explicit Create act in two beats, FILL then CREATE — never one
button (that would fire the ratified reveal off an empty reel). **Quick-add** is the honest fill:
[`pickQuickAdd`](../../src/lib/reel/quick-add.ts) is pure + DETERMINISTIC (mulberry32 off the reel's own
seed, no Math.random) blending rank-normalized likes + recency decay + per-uploader round-robin coverage +
a photo/video mix; its LABEL switches on whether likes actually shaped the pick. **Quick-add is offered at ONE
approved item**: `QUICK_ADD_MIN` (4) does not gate the button, because it is the only
in-card fill path and gating it strands small events. A small pool comes back whole and the copy stops
promising a guest-wide mix ("Everything added so far, in one first cut"). **Create** runs the
composite reveal IMMEDIATELY and persists CONCURRENTLY (`persistConfig`'s upsert IS the lazy create); on a
failed save the theater still finishes, then toasts and falls back.
★ **The panel swap waits for the
THEATER, not the save**: `markCreated()` (the builder→marquee switch, which unmounts the reveal's portal)
fires only from the settled card's exits. Calling it when the RPC resolves kills the 4.7s choreography
mid-act.

**The CONFIG BRAIN and the canvas engine.** There is no composer COMPONENT: its state/persist/export logic
lives in
[`use-reel-config.ts`](../../src/components/reel/use-reel-config.ts), the ONE controller the Marquee's
poster and the Studio's sheets both consume): the curated set **plays as a live `CanvasReelPlayer`**
([`engine/player.tsx`](../../src/lib/reel/engine/player.tsx), the same `drawReelFrame` the encoder
steps, so **the preview pixels ARE the export pixels**, WYSIWYG by construction), with the
**style · orientation · cover · length** controls all client-side + **$0** (nothing encodes until
Download). **Style** = the Studio's wall over the flat **14-style catalog** (8 media-first "moods" + 6 stylized "treatments", grouped); **orientation**
= a portrait 9:16 / landscape 16:9 toggle (every style adapts from one core). **There is no shuffle:** the seed is the
deterministic `defaultReelSeed(eventId)` (one stable take).
★ **The styleId dispatcher** keeps a PURE/rendering split, both
under `engine/`: [`engine/style-registry.ts`](../../src/lib/reel/engine/style-registry.ts) is PURE (catalog → `{kind, themeId}`,
server-safe) so `build-reel-props`/`render-service` resolve `styleId`→theme without pulling any browser runtime; the draw
registry is [`engine/registry.ts`](../../src/lib/reel/engine/registry.ts) (`drawReelFrame` stamps the **watermark in the
dispatch layer**, so no style can export unmarked). Videos draw their POSTER frame (`preview_key`); real
motion video in the reel is a later Pro slice.
[`build-reel-props.ts`](../../src/lib/reel/build-reel-props.ts) (pure, tested) turns the `reel_items` order + the
already-presigned `GridMedia` into props (NO 2nd presign/RPC), resolving `styleId`→theme and populating
`ReelClip.width/height` → **`fitClip` runs in prod** (designed mismatched-orientation framing). Config persists (debounced)
via **`upsert_reel_config(p_style_id, p_orientation, …)`** (SECURITY DEFINER, host-owns, authenticated-only, lazy-creates
the one-per-event `highlight_reels` row; `style_id`+`orientation` columns, `theme` kept synced = style_id as a legacy
column). The empty state offers a one-tap **"Fill from gallery"** auto-fill. `media.clip_*` stays scaffold (Pro video trim later).

**The .mp4 EXPORT (Download video)** is an on-device WebCodecs encode, the only export path. Support is
probed up front ([`engine/support.ts`](../../src/lib/reel/engine/support.ts) + the pure
gate [`engine/encode-gate.ts`](../../src/lib/reel/engine/encode-gate.ts)); a browser that can't encode gets an honest
inline notice instead of the Download button (the reel still plays).

- **CLIENT ENCODE ($0):** [`engine/encode.ts`](../../src/lib/reel/engine/encode.ts) steps the SAME
  `drawReelFrame` through WebCodecs h264 (mediabunny) **on the host's device** from the exact props the player shows,
  saves the file locally the moment the encode lands (the network can't take it away), then uploads it to the stable
  [`reelOutputKey`](../../src/lib/r2/keys.ts) `events/<id>/reel/reel.mp4` via **`POST /api/reel/upload`**
  (begin → mint → finalize; contract in [`upload-contract.ts`](../../src/lib/reel/upload-contract.ts), logic in
  [`render-service.ts`](../../src/lib/reel/render-service.ts)). **The mint is the abuse choke point:** host-authed
  (getUser + own-event via [`own-event.ts`](../../src/lib/reel/own-event.ts)), the ENTIRE config re-derived server-side
  (`resolveReelRenderContext`: tier → watermark + length clamp, membership, hash; the client's hash is an opaque echo
  recompared each phase, so a mid-encode config change 409s), a **content-length-bound `video/mp4` presign** whose
  ceiling = server length × a bitrate budget ([`client-encode-budget.ts`](../../src/lib/reel/client-encode-budget.ts),
  parity-tested against the encoder's max bitrate), the SAME `reel_render_enabled` kill-switch + `reel_render` limiter,
  and an idempotent finalize that only blesses an object that **landed after the mint stamp** (size within cap +
  `LastModified >= render_started_at`), then stamps `ready` + `rendered_hash` + `render_cost_usd 0` and logs
  **outcome `client_encoded`** (mint logs `client_minted`; `render_id` is `client:<uuid>`). The stitching modal
  ([`reel-stitching-dialog.tsx`](../../src/components/reel/reel-stitching-dialog.tsx)) is the encode surface (real
  frame-accurate progress; closing cancels).
- **NO WEBCODECS:** the composer shows an honest inline notice ("Video export needs a modern browser. Your reel still
  plays here, and any modern phone or desktop browser can download it.") instead of the Download button. `GET
  /api/reel/render` (`getReelRenderState` → R2-HEAD `finalizeIfLanded`) survives as a dormant client-encode poll
  resilience net; nothing polls it today (the client finalize is synchronous).

**Lazy + cached:** an unchanged reel (a stored `rendered_hash` over
media+style+orientation+config+watermark+`RENDER_VERSION`, currently **3**) re-serves the existing mp4 for $0; any
config change invalidates. **Free tier** stamps the `partyreel.com` watermark: `props.watermark` is **server-tier-derived**
(the render/mint paths NEVER trust the client flag; the engine stamps it in the dispatch layer `drawReelFrame`, so ALL
14 styles carry it). **ACCEPTED pre-launch caveat (do NOT build detection):** the client-encode server never sees the
encoded PIXELS, so a tampered self-encode can at worst upload a watermark-free reel; it defrauds a watermark, nothing
else (key, size, and config identity stay server-bound). Ops: the **`reel_render_enabled` kill-switch** + the deny-all
**`reel_render_log`** at [`/admin/reels`](../../src/app/admin/reels) (labels cover the `client_*` outcomes), the
**`reel_render`** abuse-limiter kind, the **`highlight_reels` render columns** (status/render_id/rendered_hash/
render_error/render_started_at/rendered_at/render_cost_usd, all service-role-write).
★ **`sweepExpiredEvents` must also delete `reelOutputKey` per purged event.** Event-purge deletes R2 by
ENUMERATED media keys and the orphan sweep IGNORES non-media keys, so the reel mp4, which has no media
row, otherwise leaks forever on deletion with nothing to say so.
**DEFERRED:** Pro video preview+trim + real video in the engine, the reveal-moment polish. (Guest surfacing +
download → [guest-flow.md](guest-flow.md). Canvas + on-device client-encode is the only render path; there
is no Remotion/AWS-Lambda path.)

## See also

[uploads-and-r2.md](uploads-and-r2.md) · [guest-flow.md](guest-flow.md) · [billing-caps.md](billing-caps.md).
