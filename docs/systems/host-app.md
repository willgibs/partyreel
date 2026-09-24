# Host app: dashboard, events, QR and print, the event page, moderation, the reel

Open this before you:
- change the dashboard (its bands, the events list, the Guest cards, the claim ticket);
- change how an event is created or an event setting;
- change the QR designer, a code's size or the print sheet;
- touch the custom event link;
- change the first-time welcome;
- change the event page: its header, cards row, sheets, launch list, album or live refresh;
- change host moderation, a tile verb or bulk select;
- change the reel's curation, the Studio or the .mp4 export.

The upload pipeline is [uploads-and-r2.md](uploads-and-r2.md)'s, the guest side [guest-flow.md](guest-flow.md)'s,
caps and billing [billing-caps.md](billing-caps.md)'s, and operator moderation
[admin-observability.md](admin-observability.md)'s.

## Dashboard landing

`/dashboard` is a pulse, not an inbox, in four bands: what needs you, the storage line, your events, just arrived. It
has no filter chips and no personal feeds (those are the profile's owner mode, [profiles-social.md](profiles-social.md)).

- **What needs you** is one next best step per event from a pure rule, first match wins (`lib/dashboard/next-step.ts`),
  then the account's storage step. ★ It never renders as a void: a band wired to the review queue would be blank for
  every up-to-date host, so an empty result renders "Nothing needs you". Past three steps it folds behind a "+N more"
  chip, and a host with no events sees no band at all.
- **The storage line is unconditional** (a host with no events still has a plan); the over-cap grace banner is its own
  red alert, never inside the meter.
- **Your events** counts through `event_card_stats` and covers through `event_covers` (one jsonb each for any number of
  events); "X of N used" is `countActiveEvents()`, a head count.
- **Just arrived** is the newest approved uploads in a window that widens until it holds twelve (`arrivals.ts`); its
  number is a head count, never a read's length. ★ These are the one host tiles that keep the `[data-media-tile]`
  arrival fade (no `data-static`): they literally just arrived. Their reads live in `db/queries/pulse.ts`, apart from
  the `events.ts` that every event room shares.
- ★ **"Today" is the viewer's calendar day, never the server's**: Vercel runs on UTC, so from evening on west of UTC the
  server's today is already tomorrow. The page reads the viewer's zone from the `x-vercel-ip-timezone` header
  (validated by constructing an `Intl` formatter, falling back to the server's zone) and computes the day DST-safely
  (`viewer-day.ts`); "N today", "an event dated tomorrow", the Event Pass expiry and the grace deadline
  (`format/date-in-zone.ts`) all read it. The zone is used only to render and is never stored or logged, so no privacy
  text changes for it.
- **The claim ticket** appears when `getMyClaimableGuestRows()` finds rows typed under the account's own CONFIRMED email
  at a names-mode door before that email was proved: per event, Claim or Not mine, then Finish, which removes whatever
  is unclaimed under a named confirmation (`claims-actions.ts` → `claim_guest_rows_by_email`,
  `disown_guest_rows_by_email`), since that is the guest saying those uploads were not theirs. An unclaimed name leaves
  the guest list and the Guests room with its uploads, and the empty guest row survives for the device that minted it.
  A nameless profile meets the name gate first ([auth-accounts.md](auth-accounts.md)), prefilled from the newest
  claimable row's typed name.

## Events and the create flow

An `events` row carries the one DB-generated link (`qr_token`) and the host's switches. The ones the schema does not
explain: `require_verified_email` is the one identity switch; `max_upload_bytes` caps each GUEST upload (the host's own
are exempt); `qr_style` is plain text, app-validated, so presets grow without a migration.

- **The sole create path is the `/dashboard/new` wizard** (`create-event-wizard.tsx`): Name, Style, then the beat. It
  creates once, at commit (an abandoned wizard leaves no row), through the non-redirecting `createEventInWizard`, which
  returns the id and token so the beat can draw the real code. Only the name is required; everything else is edited in
  the settings sheet (`event-settings-form.tsx`, one form and one Save). `enforce_event_limit` guards `MAX_EVENTS` in SQL.
- ★ **The beat happens once in an event's life, by construction**: only pressing Create reaches it. It draws the real
  code in a plain mat, two doors out (print the table cards; share the link) and one into the event; the custom link
  belongs to the share sheet.
- ★ **The cap is a door, not a dead button**: a host never does the work of an event and only then learns the plan cannot
  hold it. The route computes `atCap` with the dashboard's own math (`profile.event_slots ?? MAX_EVENTS[tier]`, as
  `enforce_event_limit` does), and the wizard renders the refusal (the plan's number, the event holding the slot, Delete,
  Pro) instead of the form, so New event stays a live link; `enforce_event_limit` stays the guard behind the door.
- ★ **The wizard route never guards at-cap with a `redirect`, and the wizard snapshots `atCap` at mount**: a Server
  Action refreshes its route, so after Create `atCap` is true, and a redirect would bounce the host before the beat while
  a live prop would swap the beat for the refusal (`create-flow.test.tsx` flips the flag). The general rule: a route
  whose post-action refresh must show a success state reads no eligibility live.
- **Settings save only on Save changes**: verify a settings change by saving and checking the row.
- **"Require verified emails" reads the column directly, with no inversion**, free on every tier and on by default (a
  verified email is safer and captures a real address). Off is not anonymity: a guest types a display name and uploads
  under it with an unverified mark. Turning it off confirms the consequence through `ConfirmSwitch`
  (`ui/confirm-switch.tsx`), the one primitive for every consequential switch, which opens a tick late so radix's
  dismissable layer does not catch the switch's own click. Enforcement is the gated gallery
  ([guest-flow.md](guest-flow.md)); the live "what your guests will experience" line is `guestExperienceSummary()`.
- **"Require an upload to view"** (off by default, free on every tier) holds the full album until one of the guest's own
  uploads completes, approved or held, and confirms on its ON edge (`confirmWhen`), the direction that asks something of
  guests. It fails open while the event is not accepting uploads or the album is at its cap, so a guest is never held at
  a step they cannot pass. ★ An upload keeps the door open whatever the host does to it and stops once the guest removes
  it themselves; a claimed row counts through the account. Enforcement is the gated gallery plus the service-role-only
  `get_upload_gate(event_id, session_token, user_id)`, never client-callable.
- **The events list draws as cards or rows**, with the bin and the events you added to as filters of the one list (the
  Show menu: All events, Guest, Deleted), shown in both views, because it is the only door to the bin. ★ The view is a
  cookie set by a Server Action (`pr_events_view`, per device), never localStorage: the server must know the view before
  the first byte, or every cold load paints cards and swaps to rows; setting it re-renders the page with no
  `router.refresh()`.
- ★ **The events you added to are Guest cards**, since uploading to an event is effectively saving it: every event
  where the account holds a live upload (pending, approved or hidden) and is not the host, read from the uploads
  themselves (`getMyGuestEventCards`: the admin client, the account's own rows only), so a card leaves with its last
  live upload and nothing else puts another host's event on a dashboard. The album's rules mask it
  (`lib/dashboard/guest-events.ts`: a private album blank and locked, a password album with no cover).

## QR codes and print

- **`qr-code-styling` is imported dynamically inside a `useEffect`** (`app/styled-qr.tsx`): it touches `window` on
  construction and would crash the SSR pass. The presets live in `constants/qr-presets.ts` (unknown values resolve to
  `classic`); `StyledQr` draws every code a host sees on a screen, and the designer lives in the share sheet.
- **Every preset keeps dark data modules on white**; colour only tints the corner finder patterns, and those tints (the
  legacy coral among them) are deliberate exceptions to the token palette, because existing events keep their rendering
  and scanners find corners by shape. Prove a new preset by scanning it on the launch-prep alias.
- ★ **A code's size is set in CSS, never by re-rendering it**: `StyledQr` draws a fixed-pixel SVG from `size` (its
  resolution and baked quiet zone), and every display scales it down with one rule (`w-full`, `height: auto`).
- ★ **Whether a code scans is decided by the module, not the code** (`lib/qr/module-floor.ts`): the module count comes
  from the URL's length and the preset's error correction, and the renderers reserve quiet zones differently. The floors
  are 3px a module on a screen and 0.5mm on paper, and `module-floor.test.ts` runs every shipped size at the longest link
  an event can carry.
- **The print sheet** (`/dashboard/<id>/print`: nine table cards to a page, a welcome sign, a poster) is reached from the
  beat, the share sheet and the launch list.
- ★ **Print is its own route group, `(print)`**, because `AppShell`'s sticky header would print on every sheet; and
  ★ `(print)` does NOT inherit the `(app)` auth gate, so its layout re-declares `getUser()` and the page re-reads the
  event through RLS.
- ★ **Zero client JS on the sheet**: its codes are `FooterQr`, the DOM-free server renderer, because nine client islands
  can lose the race with an open print dialog and an unpainted code prints as a blank square. The cost is the classic
  shape whatever the preset: same data, same scan.
- ★ **Every length is mm and every type size is pt** (`lib/qr/stock.ts`), because CSS absolute units are physical on
  paper. The sheet fits inside the browser's default margin on both Letter and A4 because there is no `@page` anywhere
  (it cannot be scoped to a selector, so a margin here would re-margin the help and legal pages). The print rules sit in
  globals.css under the one hook `data-print-stock`.

## The custom event link

A Pro or Event Pass host may alias the one event link as `/e/<slug>`; the permanent `/e/<qr_token>` and the code never
change, and the slug is NOT a second capability.

- **`events.custom_slug`** is unique case-insensitively among non-deleted events (a partial index) and written only by
  `set_event_slug` and `clear_event_slug` (authenticated-only SECURITY DEFINER, tier-gated like the password).
  `get_event_by_qr_token` resolves a token or a slug (the token wins) and returns the canonical token. The control lives
  in the share sheet (`event-slug-control.tsx`: debounced, race-guarded availability through `check_slug_available`,
  a warning before a change or removal); a downgrade keeps the slug resolving and removable, not changeable.
- **Slugs are mutable, with deliberately no redirects**: a change frees the old string at once and the old link 404s,
  because an alias that outlived its event would be a worse promise than a dead one; a soft-deleted event frees its slug
  too. A 32-hex slug is refused, so nothing shadows the token namespace. The URL is `/e/<slug>`, never `/<slug>`,
  reusing the one route with its `noindex` and OG.
- **Surfaces show a claimed slug through `preferredEventUrl`** (`events/share-urls.ts`); what they copy and encode is
  still the permanent link.

## The first-time welcome

`/welcome` is a full page, never a coachmark overlay: the name step when the profile has none, then a four-screen tour
while `welcomed_at` is null, then the create wizard (`welcome-flow.tsx`). The tour quotes the marketing site's
how-it-works pictures (never redrawn, so a host's first minute looks like the site that sold them); its slow ambient
drift is linear and motion-gated, a breath rather than feedback, so the 300ms ceiling does not bind it.

- **Shown once, through `profiles.welcomed_at`**: `/dashboard` redirects there while it is null
  (`resolveDashboardEntry`), and a nameless profile is sent there too. ★ Every exit calls `markWelcomed` BEFORE
  navigating, or the guard bounces the host straight back; `/welcome` itself gates on neither, or it loops.
- ★ **A guest-made account never takes the tour** (`isGuestFirstVisit`): an account that hosts no live event and already
  holds a Guest card lands on its dashboard and is marked welcomed there by `MarkWelcomedOnMount` (a client effect,
  since `after()` in a server component cannot read cookies; a failed write retries next visit).

## The event page

`/dashboard/[eventId]` is a hub: a live code beside the title, a row of cards into the event's rooms, and the album
beneath, newest first. (`event-filter-pills.tsx` has no importer.)

- ★ **It is the ONE wide page in the host app**: it marks its root `data-app-wide` and `AppShell` answers in `:has()`
  (a page cannot hand a prop up to its layout), dropping the 1280 cap so the logo, the code, the cards and the album
  share one left line.
- **The header is one object**: a scannable `StyledQr` in a button BESIDE the h1, never inside it (an h1 holding a
  control stops being the page's accessible name). ★ It carries no status chips: a paused event dims the code, and
  visibility rides the Settings card. The link row shows the readable URL and copies the permanent one, confirmed in
  place, never by a toast.
- **The cards row** (Review, Reel, Guests, Settings last) is a group of links, never tabs, since nothing switches a
  panel in place. ★ The Guests card and the header read THE ONE COUNT (`getEventGuests`, the album header's own
  function), so the hub, the Guests room and the album say one number. The row is sticky and condenses in place, because
  a remount would drop the QR pill's `view-transition-name` mid-morph. ★ Share's place in the row is a QR pill that
  exists only while the header's code is off screen, carrying the morph's name while it is the code on screen.
- **Review, Reel and Guests are rooms (routes with a crumb); Settings and Share are sheets.** ★ The crumb trail lands at
  hydration (a page cannot hand a prop up, and CSS cannot carry an event's name); the bar's fixed height keeps it from
  shifting anything.
- ★ **The two sheets ride `?room=`, and it IS the state** (`share/event-share-provider.tsx`, read from
  `useSearchParams` with no mirrored `useState`, so a `router.refresh()` after a settings action cannot close the
  panel). Opening pushes a history entry whose marker is a FIELD on the state Next merges: Next's patched `pushState`
  copies `__NA` onto the object it is handed and its `popstate` handler reloads without it, so replacing the state
  wholesale turns Back into a full reload. Closing calls `history.back()` only when the marker is ours.
- **Share is the one sharing surface** (`share/event-share-sheet.tsx`: the code, Copy link, Share, Open and Print, the
  downloads, the designer, the custom link). ★ Never draw the code in a second sharing surface, or a fix lands in only
  one of them. The dashboard card's QR chip is a plain link to `?room=share`.
- **Settings** imports the settings form whole, with one unsaved-changes guard behind the scrim, Escape and the close
  button, and `beforeunload` for a reload. `/settings` survives as a redirect: it is a published URL.
- **The QR mini-modal** (`share/event-code-modal.tsx`) takes no URL: a look at the code is a beat, not a destination. It
  grows out of the header's code on the native View Transitions API, name-scoped in `share/share.css`, and exactly one
  of the header, the pill and the modal carries the name at a time (a duplicate makes the browser skip the transition).
  ★ Its entrance is the one sanctioned hole in the floating-layer contract: `floatingTransitionEntrance` declares no
  animation, because the transition is the entrance, and falls back to the standard clock under reduced motion.
- **Before the first photograph the album's place is a launch list** (`event-feed/launch-list.tsx`), derived from the
  event's own nulls so it lists only what is left (the date, the note, printing the table cards, always last because
  the app cannot observe it done). It is a server component passed as a slot, so the client `EventUploads` never needs
  the event's fields. A held-only event shows "Everything's in Review": it is full, not empty.
- ★ **The hub is live: an upload lands while the host looks.** `EventLive` (`event-gallery.tsx`) spends a
  `router.refresh()` on exactly two signals and never on a timer: the guest's Realtime doorbell, or a changed validator
  from `/api/events/<id>/live` (two RLS-scoped head counts and one row, no presigns, a bodiless 304 when nothing moved),
  polled on the guest album's hybrid cadence. ★ The poll is not redundant with the socket: the doorbell fires only on the
  approved-visible set, so a held upload on a moderated event wakes nobody, and the host fingerprint
  (`lib/events/host-fingerprint.ts`: the album and pending counts and the newest `updated_at`, which
  `media_set_updated_at` stamps on every write, so another tab's hide moves it) is how the one person who can approve
  it hears. It hashes numbers, never the item list, so it costs the same at any size and no row past the 1,000th
  changes unseen. ★ The first response only seeds the validator, or every load would refresh itself. `HostMediaGrid`
  marks arrivals by diffing item ids across a refresh, never the presigned URLs (they roll every half hour), and a
  host album never staggers.
- **The album** (`event-feed/event-gallery.tsx`) carries Add photos, Download all, Select and one View menu, which
  always renders so an empty album still reaches the bin. ★ The bin is fetched on demand (`listDeletedMediaAction`, a
  `getUser()`-gated Server Function), never with the page, because each item needs its own presign; it reads the whole
  bin, and bin items never count in the album.
- ★ **The hub's album is read whole and its numbers are counted**: it presigns the `album` slice of `listEventMedia`
  (approved and hidden) through `readAllPages`, and every number on the page is a head count (`countEventMedia`,
  `countReelItems`), never a list's length. The `live` slice is Download all's, whose manifest refuses past 2,000
  items with a 413.
- ★ **The View menu** (`shared/view-menu.tsx`) holds Tile size (the masonry's `--album-column`, in the per-device
  `pr_tile_size` cookie painted inline by the hub, never localStorage, which would repaint the columns after hydration),
  Sort (disabled: the album is a server-rendered slot, so a client sort could only reorder what is mounted) and Filter
  (All, Deleted).
- **SSR'd surfaces use native `title` only**, never a radix Tooltip (the hydration regression in
  [architecture.md](architecture.md)); rich client UI is safe inside its islands.

## Moderation and curation (host side)

`media.status` is `pending | approved | hidden | removed`; `create_media` sets pending or approved from the event's
`moderation_mode`.

- **The Review room** reads and presigns the `pending` slice alone, whole; its states (pending, caught up, moderation
  off with a one-tap "Turn on review", the all-caught-up beat) live in `use-review-triage.ts`. Its grid is the shared
  `SelectableMediaGrid` on the uniform layout, because uniform tiles standardize the selection targets.
- **The bulk controls live once, in the room's header, in both modes** (`review-actions.tsx`), which never goes empty,
  or a host mid-selection loses Hide, Approve and Cancel. Approve all needs no confirm: it sends the queue's own ids
  through `approveBulkAction` in consecutive batches of 2,000, so a host approves exactly what they saw, at any size.
- **Turning moderation off with a queue** confirms with the count, and on save `approveAllPending` runs: the modal is the
  host's consent, the server the invariant (live mode never holds pending media).
- **Clearing the last pending item plays the beat**, during which the just-approved photographs are preloaded: their
  stable presigned URLs recur byte-identical in the album, so it paints from cache.
- **Tiles render through the shared `MediaTile`, never `next/image`**, whose optimizer 400s on short-lived presigned R2
  URLs.
- **The review pair `approveBulk` and `hideBulk` are scoped to `status='pending'`**, so a crafted call cannot flip
  other media. **Remove is soft** (`status='removed'` and `removed_at`): it frees storage at once, and the cron reclaims
  after the recovery window ([lifecycle-recovery.md](lifecycle-recovery.md)).
- **The host's tile verbs are a fixed three: like, download, hide/show** (one slot whose glyph swaps in place; the pane
  is [design-system.md](design-system.md)'s album tile). Add-to-reel and Delete are deliberately not tile verbs: a fan of
  five on a dense grid is a misclick trap, and those two are the consequential ones. Delete lives in the viewer and bulk
  select, add-to-reel in the reel room, approval in Review.
- **The viewer's pill groups "enjoy | curate"**, the curate group gated on `viewerIsHost && onSetStatus`, so the guest's
  pill is behaviour-identical; Remove confirms, the rest act directly. The tile row and the viewer share ONE
  `useModeration` hook (`host-media-grid.tsx`) over one `useOptimistic` list.
- **Album bulk select** opens from Select or a long press (`use-long-press.ts`): the album swaps to
  `SelectableMediaGrid` and its header's action slot becomes the shared `BulkBar`, whose rich tooltips mount only after
  hydration. The selection lives in a thin `HostSelectionProvider`, into which the album grid (owner of the optimistic
  items) registers its handlers, so the bar calls `selection.run(kind)`: the seam whenever a control surface and its
  grid live in different subtrees.
- ★ **The selection prunes to the surviving ids when the album changes, never resets** (`useSelection`), so a poll never
  wipes a selection in progress.
- **Bulk Add to reel and Like loop their idempotent RPCs under ONE summary toast** (`addMany`, `likeMany`); Hide, Show and
  Delete are the general `setMediaStatusBulk` and `removeMediaBulk` (plain RLS, no pending predicate).
- ★ **Every bulk write, and Delete forever's reads, send the selection through `inChunks`** (an unchunked
  `.in('id', …)` over a big selection outgrew the URL and failed whole), and every bulk action refuses more than
  `MAX_BULK_ITEMS` (`lib/event/bulk-selection.ts`).
- ★ **The select grid passes the same `clampAspect` as the album's grid**, or toggling select reflows every tile.
- **Host upload**: Add photos opens a dropzone (`host-upload.tsx`) straight into the album; its pipeline is
  [uploads-and-r2.md](uploads-and-r2.md)'s.

## Reel curation, the live composer, and the .mp4 export

★ **This is the stored reel, and the reel round replaces it.** The live reel is the event's own: a looping montage of
what the album shows from its third reel-eligible item, spliced within seconds by the doorbell, in the host's mood by
default with a viewer's own style switch, with a first-class screen mode and a per-event switch, on by default. A cut is
anyone's, made on the device from the reel and never stored (on a paid event, Add to the album sends it through the
ordinary upload queue as the uploader's video, which the live reel skips). Video plays a range-fetched window of the
original, decoded on the viewer's device behind Include videos, the poster covering every failure. Every table, route
and job built only for the stored reel goes when one alias build replaces it, so build nothing new on it.

**The product shape.** The reel is the core loop's last step and the product's North Star: the host curates the best
moments and gets a shareable highlight video, the "wow in between" (not a pro editor, not a toy: an everyone tool, low
savvy hosts and old devices included).
- **Customization is curated randomness, never a timeline**: style, orientation, cover and length beside the moments;
  no sliders, no track, no per-clip editing. A style is a kit that the reel's seed samples deterministically, so another
  seed is a genuinely different take, a re-view is stable, and the player and the encoder match by construction.
- **No music and no beat-sync**: music is too personal to guess, and people add trending audio when they post.
- **Generation is free on every tier, and the free export is full quality**: the free levers are the watermark and the
  shorter length (`MAX_REEL_SECONDS`), never the quality, and the watermark doubles as a nudge and free marketing. A paid
  reel carries no Partyreel branding (the guest page's header keeps its logo and call to action on every tier), and no
  reel has an end card: it is not a growth lever to revisit.
- **Video in the reel is self-bounding**: only paid tiers upload video; a video item draws its poster still.
- **The style catalog is product data with one source**, the pure `lib/reel/engine/style-registry.ts` (moods that are
  their own theme, treatments that resolve to one); a new style is a catalog entry plus its draw path.

**Curation.**
- **Membership mirrors likes**: `reel_items`, with host-scoped SELECT and DELETE RLS, grant-locked, inserted ONLY by the
  access-checked SECURITY DEFINER `add_to_reel`; a host-only `ReelProvider` (optimistic, an insertion-ordered Set); a
  `ReelButton` in the viewer's curate group. `media.reel_eligible`, `highlight_score` and `clip_*` are dead scaffold
  that nothing reads.
- **The doors that write are the reel room's** (the Studio's Moments picker first, the builder's quick-add). Only the
  reel room mounts a `ReelProvider`, so the hub viewer's `ReelButton` renders nothing and the album's bulk Add to reel
  returns without writing.
- **Likes are an input to quick-add, never membership.** One reel per event; only approved items play (the timeline
  predicate), while membership for the host's UI, counts and reorder keeps hidden ones too
  ([database-security.md](database-security.md)).
- **Guests see the reel only after the host shares it**: `set_reel_guest_visible` flips
  `highlight_reels.guest_visible` (refusing an empty reel; guests watch the live player, so no mp4 is needed). Every
  share control calls this ONE seam (`publish-action.ts`); publishing sends no notification, and one would hook in here.
  The guest side is [guest-flow.md](guest-flow.md)'s.
- **Reorder is Studio-only**: the filmstrip dock reorders while the reel plays (`useSortableGrid`, the 450ms touch press
  keeping a scroll from lifting a tile), over the FULL membership, hidden members dimmed and read whole. It persists
  through `reorder_reel`, the second write path (`reel_items` UPDATE is revoked): host-owns plus a set-equality guard
  that rejects a cross-event, partial, duplicate or stale list with `reason: 'stale'`, and the provider reverts on it.
  ★ The optimistic path builds a NEW `Set` from the reordered array: re-adding into the old Set keeps the old order.

**The reel room** (`/dashboard/[eventId]/reel`). With no `highlight_reels` row it renders `ReelPanel`: the builder, and
after an in-session Create the marquee (a status chip, the Studio door, the `PosterCard`, `ReelShareCard`). Once the row
exists, every visit renders the Studio. ★ The room never redirects: it can create the thing it is named after.
- **Nothing else goes on the marquee**: every control lives in the Studio, and the marquee mounts no thumbnail canvas.
- **The Studio is the one room for every control**: five slide-up sheets, one mounted at a time (Moments first, then
  Style, Cover, Length with the free tier's upsell and Download, and Layout), plus the order-only dock.
- **The Moments picker** (`studio-moments-picker.tsx`) is a bespoke dark-room grid (never `SelectableMediaGrid`, which
  hard-codes the light palette) whose state IS membership, with no local selection and no Done: a tap writes, the dock
  reshuffles, the player re-cuts, and its "suggested" hints are `pickQuickAdd`'s own pick, so it agrees with the builder.
  Add goes through the silent `addMany([id])`, never `toggle`, which toasts on every add; a hidden member stays removable
  but cannot be re-added (`lib/reel/moment-picker.ts`). The dock's trailing "+" sits outside the sortable container,
  where it would be a phantom drop slot.
- **The reel is born by an explicit Create, in two beats** (`reel-builder.tsx`): fill, then create, never one button,
  which would fire the reveal off an empty reel. Quick-add (`lib/reel/quick-add.ts`) is pure and deterministic (seeded by
  the reel, never `Math.random`), offered from one approved item. Create runs the reveal at once and persists
  concurrently (the config upsert is the lazy create); a failed save still finishes the theater, then toasts and falls
  back. ★ The panel swap waits for the theater, not the save: `markCreated()` fires from the settled card's exits, since
  firing it when the RPC resolves kills the reveal mid-act.

**The config brain and the canvas engine.**
- **There is no composer component**: config, persist and export live in `use-reel-config.ts`, mounted once per surface
  (two over one event would run two debounce timers against one row). Config persists through `upsert_reel_config`
  (SECURITY DEFINER, host-owns) on a debounce skipped on the first run, so looking never writes.
- **The preview pixels ARE the export pixels**: the set plays as a live `CanvasReelPlayer` through the same
  `drawReelFrame` the encoder steps, and every control is client-side and $0 until Download. There is no shuffle: the
  seed is the stored `seed`, first `defaultReelSeed(eventId)`.
- ★ **The style dispatcher keeps a pure/rendering split**: `engine/style-registry.ts` is pure, so the server resolves a
  style without a browser runtime, while `drawReelFrame` in the draw registry stamps the watermark in the dispatch layer,
  so no style can export unmarked. `build-reel-props.ts` (pure) turns the order and the already-presigned media into
  props with no second presign, carrying each clip's size so `fitClip` frames a mismatched orientation.

**The .mp4 export** is an on-device WebCodecs encode, the only export path; nothing renders server-side.
- **Support is probed up front** (`engine/encode-gate.ts`): a browser that cannot encode gets an honest notice instead of
  Download, and the reel still plays.
- **The encode** (`engine/encode.ts`, mediabunny h264) flushes the config first (the server hashes the stored config, so
  a failed flush stops it), saves the file locally the moment it lands, then uploads to the stable `reelOutputKey`
  through `POST /api/reel/upload` (begin, mint, finalize: `render-service.ts`).
- **The mint is the abuse choke point**: host-authed (`getUser()`, `own-event.ts`), with the ENTIRE config re-derived
  server-side (`resolveReelRenderContext`: the tier's watermark and length clamp, the timeline filtered to approved
  BEFORE the 150-clip bound, the hash). The client's hash is an opaque echo compared at each phase, so a mid-encode
  change 409s. The presign is a content-length-bound `video/mp4` capped at the length times a bitrate budget
  (`client-encode-budget.ts`, parity-tested against the encoder), behind the `reel_render_enabled` kill switch and the
  `reel_render` limiter; the finalize blesses only an object that landed after the mint's stamp and within the cap.
- **An unchanged reel re-serves its mp4 for $0** (the stored `rendered_hash` covers media, style, orientation, config,
  watermark and `RENDER_VERSION`). The watermark is server-tier-derived, never the client's flag. **An accepted caveat,
  so build no detection**: the server never sees the encoded pixels, so a tampered self-encode can at worst upload a
  watermark-free reel, defrauding a watermark and nothing else. The ops surface is `/admin/reels` over the deny-all
  `reel_render_log`.
- ★ **`sweepExpiredEvents` must also delete `reelOutputKey` for each purged event**: an event purge deletes R2 by
  enumerated media keys and the orphan sweep ignores non-media keys, so the reel mp4, which has no media row, would leak
  forever with nothing to say so (account deletion appends it the same way). The guest download presigns the same key.
- **The motion-video engine** (`engine/video/`, `lib/reel/live/`, `player-live.tsx`) is on the tree, but only the lab
  harnesses drive it: the production reel never passes a video source.
