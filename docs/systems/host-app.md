# Host app: dashboard, events, QR and print, the event page, moderation

Open this before you:
- change the dashboard (its bands, the events list, the Guest cards, the claims review);
- change how an event is created, an event setting or the door (who can get in, the Guests room's At the door and
  Invited);
- change the QR designer, a code's size or the print sheet;
- touch the custom event link;
- change the first-time welcome;
- change the event page: its header, cards row, sheets, launch list, album or live refresh;
- change host moderation, a tile verb or bulk select;
- change the hub's door into the highlight reel (the reel itself, the Reel card and Settings' Highlight reel section are
  [reel.md](reel.md)'s).

The upload pipeline is [uploads-and-r2.md](uploads-and-r2.md)'s, the guest side [guest-flow.md](guest-flow.md)'s,
caps and billing [billing-caps.md](billing-caps.md)'s, and operator moderation
[admin-observability.md](admin-observability.md)'s.

## Dashboard landing

`/dashboard` is a pulse, not an inbox, in four bands: what needs you, the storage line, your events, just arrived. It
has no filter chips and no personal feeds (those are the profile's owner mode, [profiles-social.md](profiles-social.md)).

- **What needs you** is one next best step per event from a pure rule, first match wins (`lib/dashboard/next-step.ts`:
  a queue, paused uploads, a reel one photo short, an event dated tomorrow), then the account's storage step. ★ It
  never renders as a void: a band wired to the review queue would be blank for every up-to-date host, so an empty
  result renders "Nothing needs you". Past three steps it folds behind a "+N more" chip, and a host with no events sees
  no band at all. ★ The reel step appears only at exactly one playable item with the switch and the lever on, and leaves at two
  (`getReelProgress`, the guest's `isReelEligible` spelled in SQL); at none the event's launch list speaks, and a step
  there would push "Print the code" out the evening before.
- **The storage line is unconditional** (a host with no events still has a plan); the over-cap grace banner is its own
  red alert, never inside the meter.
- **Your events** counts through `event_card_stats`, and each hosted card's cover and stills come from
  `getEventCardStills` (`event_covers` and `event_stills` in one pass: the cover first, no photograph twice, four at
  most); "X of N used" is `countActiveEvents()`, a head count. ★ The cards take turns (`dashboard/cover-cycle.tsx`):
  every 3.5 s exactly one card dissolves to its next still, in reading order, wrapping; a card with one still or off
  screen sits out, and nothing moves in a hidden tab or under reduced motion. The grid's columns live once
  (`event-card-grid.ts`), shared with the loading skeleton.
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
- **The claims review** appears when `getMyClaimableGuestRows()` finds rows typed under the account's own CONFIRMED
  email at a names-mode door before that email was proved: one banner line above the events with Review, which opens
  the list kind (`claims-review.tsx`: a side panel at a desk, its own screen in a hand) and goes through them one event
  at a time (`claims-card.tsx`), each with up to four of its own approved photographs from an open album, presigned on
  the server (a password or private album shows a lock and the count). Every decision is written as it is made, one
  event a call (`claims-actions.ts`): Claim through `claim_guest_rows_by_email`, Not mine through
  `disown_guest_rows_by_email` once its confirm dialog at the card says Delete, since that is the guest saying those
  uploads were not theirs; an event she never reaches waits, and the banner counts it. ★ An answer names its card, a
  card waits for its write, and an arriving card holds its answers 250 ms, so a double tap never claims the next event
  (`claims-batch.ts`). ★ The album link never rides the list (a Not mine is an event she was never at): a claimed row's
  Open album and quieter Follow come from the claim's own follow-up read (`getClaimedEventNext`), for an event she is
  now a guest of. The writes never revalidate; the review refreshes the page behind itself as each lands and keeps its
  own account of her decisions. A disowned name leaves the guest list and the Guests room with its uploads, and the
  empty guest row survives for the device that minted it. A nameless profile meets the name gate first
  ([auth-accounts.md](auth-accounts.md)), prefilled from the newest claimable row's typed name. One toast as the review
  closes counts what that opening added, its second line pointing at the page unless the page setup's invitation is
  about to take the banner's place ([profiles-social.md](profiles-social.md)): one pointer a beat.

## Events and the create flow

An `events` row carries the one DB-generated link (`qr_token`) and the host's switches. The ones the schema does not
explain: `require_verified_email` is the one identity switch (An email first); `gate` refines a `private` album into
its gate (below); `allow_videos` is the Videos switch, binding guests only, as `max_upload_bytes` caps each GUEST upload
(the host's own are exempt); `qr_style` is plain text, app-validated, so presets grow without a migration.

- **The sole create path is the `/dashboard/new` wizard** (`create-event-wizard.tsx`): Name, Style, then the beat. It
  creates once, at commit (an abandoned wizard leaves no row), through the non-redirecting `createEventInWizard`, which
  returns the id and token so the beat can draw the real code. Only the name is required; everything else is edited in
  Settings (below). `enforce_event_limit` guards `MAX_EVENTS` in SQL.
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
- **"An email first" reads `require_verified_email` directly, with no inversion**, free on every tier and on by default
  (a verified email is safer and captures a real address). Off is not anonymity: a guest types a display name and
  uploads under it with an unverified mark. Turning it off confirms the consequence through `ConfirmSwitch`
  (`ui/confirm-switch.tsx`), the one primitive for every consequential switch, which opens a tick late so radix's
  dismissable layer does not catch the switch's own click. ★ Letting each person in and the invite list hold it on
  (they match a confirmed address; `events_gate_needs_email`), and the switch says why. Enforcement is the gated
  gallery ([guest-flow.md](guest-flow.md)).
- **"A photo first"** (`require_upload_to_view`, off by default, free on every tier) holds the full album until one of the guest's own
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
  (`lib/dashboard/guest-events.ts`: Only me blank and locked; behind a password or a gate, named and linked with no
  cover). ★ A gate never locks a card: a card is for someone past the door (a waiting guest cannot upload), so every
  reader holding only the stored `visibility` asks the gate (`readEventGates`),
  the picker's tiles and a claim's Open album too. ★ An event that
  blocked her keeps its card, masked as a private album's, while the block stands (`blocked_events_for`, placed at the
  newest upload the block removed): a block moves her uploads to Deleted, and a card that vanished would say what the
  door hides.

## QR codes and print

- **`qr-code-styling` is imported dynamically inside a `useEffect`** (`app/styled-qr.tsx`): it touches `window` on
  construction and would crash the SSR pass. The presets live in `constants/qr-presets.ts` (unknown values resolve to
  `classic`); `StyledQr` draws every code a host sees on a screen, and the designer is the kit's Customize, a menu whose style is the act (`qr-designer-dialog.tsx`).
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

Any host, on any plan, may alias the one event link as `/e/<slug>`; the permanent `/e/<qr_token>` and the code never
change, and the slug is NOT a second capability.

- **`events.custom_slug`** is unique case-insensitively among non-deleted events (a partial index) and written only by
  `set_event_slug` and `clear_event_slug` (authenticated-only SECURITY DEFINER; `set_event_slug` refuses the reserved
  words itself, since a free account can hold a slug and the RPC is callable past the action).
  `get_event_by_qr_token` resolves a token or a slug (the token wins) and returns the canonical token. The control lives
  in the share sheet (`event-slug-control.tsx`: debounced, race-guarded availability through `check_slug_available`,
  a warning before a change or removal).
- ★ **The brand is refused as a part, not only as a word:** any slug containing `partyreel`, read with its hyphens
  dropped and a look-alike digit as its letter (`party-reel`, `p4rtyr33l`), in `eventSlugSchema` and in
  `set_event_slug` by one fold (`reserved-slugs.ts`; `tiers-sql.test.ts` holds the two halves together); the `/u/`
  handle refuses it too. A dropped or doubled letter is left alone (folding it refuses `party-relay`). A link held
  before a rule grew keeps working (no resolver re-validates; the demo's `partyreel-demo` is one), and the controls
  read a held value as current, never as refused.
- **Slugs are mutable, with deliberately no redirects**: a change frees the old string at once and the old link 404s,
  because an alias that outlived its event would be a worse promise than a dead one; a soft-deleted event frees its slug
  too, for good: `restore_event` brings it back only while it is still free, else restores on the permanent link
  (`custom_slug_released`) rather than failing on the unique index. A 32-hex slug is refused, so nothing shadows the
  token namespace. The URL is `/e/<slug>`, never `/<slug>`, reusing the one route with its `noindex` and OG.
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
beneath, newest first.

- ★ **The hub and the dashboard home are the wide pages**: each marks its root `data-app-wide` and `AppShell` answers in
  `:has()` (a page cannot hand a prop up to its layout), dropping the 1280 cap and taking the album's gutter (12px, 20px
  from `sm`), so the logo, the code, the cards and the album share one left line. Their skeletons mark it too, or the
  page paints at 1280 and jumps; the cards row's sticky band bleeds by exactly that gutter.
- **The header is one object**: a scannable `StyledQr` in a button BESIDE the h1, never inside it (an h1 holding a
  control stops being the page's accessible name). ★ It carries no status chips: a paused event dims the code, and
  the door rides the Settings card (`doorLabel`). The link row shows the readable URL and copies the permanent one, confirmed in
  place, never by a toast.
- **The cards row** (Highlight reel, Guests, Review, Settings) is a group of links, never tabs, since nothing switches
  a panel in place. ★ The Guests card and the header read THE ONE COUNT (`getEventGuests`, the album header's own
  function), so the hub, the Guests room and the album say one number. The row is sticky and condenses in place,
  because a remount would drop the QR pill's `view-transition-name` mid-morph. ★ It condenses inside a footprint that
  holds the resting row's height (`useStuckBand`): a condense that moved the album let scroll anchoring carry a jump
  into the stick band (the viewer's close runs one) across the threshold and back for ever; and stuck is its top at
  the bar, the observer's root grown past the fold, so a short screen never reads the resting row as stuck. ★ Share's
  place in the row is a QR pill that exists only while the header's code is off screen, carrying the morph's name
  while it is the code on screen. On a phone at rest the row is a 2x2 grid of two-line cards
  (`event-feed/room-card.ts`), so all four doors show at 375.
- **Review and Guests are rooms (routes with a crumb); Settings and the share kit are places in the settings kind (a panel at a desk, the whole screen in a hand); the Highlight reel is a door.**
  ★ The crumb trail lands at hydration (a page cannot hand a prop up, and CSS cannot carry an event's name); the bar's
  fixed height keeps it from shifting anything.
- ★ **The two places ride `?room=`, and it IS the state** (`share/event-share-provider.tsx`, read from
  `useSearchParams` with no mirrored `useState`, so a `router.refresh()` after a settings action cannot close the
  panel). ★ Every native history call hands Next a FRESH object (the marker as a field) or `null`, never
  `window.history.state`: Next's patched `pushState` and `replaceState` copy their own `__NA` and tree onto a fresh
  object and apply the URL, but take one that already carries `__NA` for their own bookkeeping and apply nothing, so
  `useSearchParams` never moves and the next router commit writes the stale address back over the bar
  (`history-state-policy.test.ts` refuses the shape; a write from a mount effect waits a microtask, because it would
  meet the browser's own function before Next patches it: `lab/board-state.tsx` says why). Opening pushes an entry
  carrying the marker; closing calls `history.back()` only when the marker is ours, or this page pushed the entry
  (`router.refresh()` rewrites an entry without the marker, and a reload does too: a panel reloaded onto closes like
  a bookmark's, in place). ★ The server's `initialSheet` paints the first frame
  alone (a hydration gate): once hydrated the URL is the only answer, so a place opened from a link (`/settings`, a
  sign-in's return, Checkout's `?room=`) closes like one opened from its card. A settings page is `&setting=<page>` on
  the same entry, moved with `replaceState`, so its back arrow and Back never stack entries.
- **The code card is every share's first surface** (`share/code-card.tsx`: the code on white filling a phone, a 384
  card at a desk, Copy link, the device's own Share where it has one, and Everything into the kit,
  `share/event-share-sheet.tsx`, which holds the downloads, the designer and the custom link). Every door to it reads
  Invite: the header's code, the sticky row's pill, the launch list (`share/invite-button.tsx`) and the dashboard card's
  QR chip, which opens the card in place. ★ Never draw the code in a second sharing surface, or a fix lands in only one
  of them.
- **Settings is four sentences** (`event-settings/`): Who can get in, What guests can add, The highlight reel and The
  event, each row one sentence (`settingsSentence`, the one home) whose underlined words are live controls
  (`SettingWord`) and whose row opens its own page with a back arrow (`PopupHeader`'s `up`). Every control saves
  itself (no form, no Save): `SettingsProvider` lays an optimistic overlay over the server row, a key dropped once the
  row catches up, with a sequence per key so a late answer never undoes a newer choice; a text field saves when it is
  left. ★ A setting with no effect right now stays in view as one quiet line under the switch that governs it
  (`ui/dormant.tsx`, `inert` while asleep, no movement under reduced motion), and a change that affects people already
  in says so in its own place before it happens (`ui/consequence-line.tsx`). The Videos switch is locked on Free (a
  drawn switch inside one button: the plans), live on paid plans. `/settings` survives as a redirect: it is a published
  URL.
- **The QR mini-modal** (`share/event-code-modal.tsx`) takes no URL: a look at the code is a beat, not a destination. It
  grows out of the header's code on the native View Transitions API, name-scoped in `share/share.css`, and exactly one
  of the header, the pill and the modal carries the name at a time (a duplicate makes the browser skip the transition).
  ★ Its entrance is the one sanctioned hole in the floating-layer contract: `floatingTransitionEntrance` declares no
  animation, because the transition is the entrance, and falls back to the standard clock under reduced motion.
- **Before the first photograph the album's place is a launch list** (`event-feed/launch-list.tsx`), derived from the
  event's own nulls so it lists only what is left (the date, the note, printing the table cards, always last because
  the app cannot observe it done). It is a server component passed as a slot, so the client `EventUploads` never needs
  the event's fields. A held-only event shows "Everything's in Review": it is full, not empty.
- ★ **The hub is live: an upload lands while the host looks, and nothing refreshes the page.** The album is the page's
  store (`event-feed/host-album.tsx`, its pure half `lib/event/hub-album.ts`), seeded with the host's first sync and
  its validator, and moved by `sync()` on the guest's Realtime doorbell, a fallback poll (12s with the socket down, 60s
  up, paused while hidden, asked again on return) and each write's catch-up. The host's version answers every question
  (`/api/album/host/<id>/sync`: a 304 that read one row, a delta by id, a manifest past 500 changes). ★ The poll is not
  redundant with the socket: the doorbell fires only on the approved-visible set, and the host's version, which every
  status change moves, is how a held upload reaches the one person who can approve it (the Review card counts it).
  `HostMediaGrid` marks arrivals by diffing ids, never links (they roll every half hour), and a host album never
  staggers.
- **The album** (`event-feed/event-gallery.tsx`) carries Add photos, Download all, Select and one View menu, which
  always renders so an empty album still reaches the bin. ★ The bin is the paged album's shape (`lib/event/bin.ts`):
  choosing Deleted reads its list (`/api/events/<id>/bin`: ids, shapes and countdowns, no links), again on every
  choice so what was just deleted is there; its rows mint links per window (`bin/media`) and re-mint them every five
  minutes while it is open; bin items never count in the album. Its two verbs, Restore (at once) and Delete
  permanently (behind a confirm), ride the tile's pane at a desk and the viewer at every width, one `useBinActions`
  for both: the viewer closes first, the item leaves the list, and the bin's viewer carries nothing else.
- ★ **The hub's album is the paged album and its numbers are counted**: the page plans the host's first sync (every
  item but the bin, light, each status in its flags) and mints links for the 96 newest (`FIRST_WINDOW`,
  `readHostLinksBody`, with each item's like count); the windowed rows ask for the rest by id. Every number is counted
  in the version's snapshot (approved plus hidden, and pending), never a list's length. The album's writes never
  revalidate the hub: each asks the store to catch up. The `live` slice is Download all's, which takes an album past
  one zip's 2,000 items in parts ([uploads-and-r2.md](uploads-and-r2.md)).
- ★ **The View menu** (`shared/view-menu.tsx`) holds Tile size (the rows' three density steps: the slider, a pinch,
  ctrl and the wheel, in the per-device `pr_tile_size` cookie painted by the hub, never localStorage, which would
  repaint after hydration), Sort (Newest or Oldest first: the manifest reversed and laid from its start, so an arrival
  lands at the end; it resets each visit) and Filter (All, Deleted).
- **SSR'd surfaces use native `title` only**, never a radix Tooltip (the hydration regression in
  [architecture.md](architecture.md)); rich client UI is safe inside its islands.

## The door, the host's side

Who can get in is one door of six (`lib/event/door/door.ts`; what a guest meets is [guest-flow.md](guest-flow.md)'s),
set on its own settings page in the order a guest meets it: (1) Public, Private or Only me; (2) Private's gate: a
password, you let each person in, your invite list, only people already in, each with its line and a small (i) for
its purpose (`GATE_HELP`); (3) An email first; (4) A photo first. Every word lives in
`lib/events/visibility-labels.ts` (`doorLabel` for the hub). The host keeps the words "Only me", so the profile's
visitor-facing "Private" never collides.

- ★ **`set_event_door` is the one writer of the pair** (`setEventDoorAction` re-verifies with `getUser()`). Under a
  gate the page says how many are already in ("31 guests are already in"); choosing Only me with guests in, or Public
  or Only people already in with newcomers waiting, says what happens first and waits for the confirm. Opening an album
  to Public lets everyone waiting in (`events_door_opened`).
- **The Guests room's At the door** heads it (`queue=room`): Let in (`let_in_at_door`) opens her door on every device,
  and her held door opens by itself at its next check-in; ★ Decline is a block (the account where there is one, else
  the row), with Undo on its toast and Let back in under Blocked, so a declined newcomer meets the one shut screen and
  cannot keep re-asking. A waiting newcomer counts on the hub's Guests card, the pulse (its first step, opening
  `#at-the-door`) and the bell (a row per event), and sends no mail.
- **Invited** (`editor=both`): one field takes a typed address or a pasted list (`readAddresses`: the readable saved at
  once and counted by the database, the unreadable kept as flagged chips), capped at `INVITE_LIST_CAP`; each address
  reads Joined or Not yet, since it matches only once its guest confirms it, so removing one never puts out someone it
  let in. The list stays editable while it is not the door. **Invite** is the room's main action while it is empty and
  a quiet one after: the event's code card, sending nothing.

## Moderation and curation (host side)

`media.status` is `pending | approved | hidden | removed`; `create_media` sets pending or approved from the event's
`moderation_mode`.

- **The Review room** reads and presigns the `pending` slice alone, whole; its states (pending, caught up, moderation
  off with a one-tap "Turn on review", the all-caught-up beat) live in `use-review-triage.ts`, its pure rules in
  `review-queue.ts`. Its grid is the shared `SelectableMediaGrid` on the uniform layout, because uniform tiles
  standardize the selection targets and scan fast. Over the queue, while there is one, sits its one line of advice,
  "Anything you approve can still be hidden later." (`REVIEW_NOTE`, Will's host note: so a host is lenient toward
  approve-and-hide over reject), a sentence and never a hint row.
- **The refusing verb is Reject at the door, Hide in the album**: a rejected upload lands `hidden` (dimmed in the host's
  album, where Show approves it), the same row a Hide leaves; only the word differs. A tap opens the peek, which carries
  the verdict (Reject, Approve) under the photograph at every width and moves on to the next upload once one is
  decided. ★ **The keys** (`review-keys.ts`): arrows move a focused tile, Enter approves, Backspace or Delete rejects,
  Space peeks; no hint row, only the verdict buttons' tooltips (and a screen reader's line) say so. They act only on a
  tile, in the peek, or (the room's page alone) with nothing focused, never on another control, and never give a verdict
  on a selection. In the peek a focused button keeps only its own Enter and Space, and a verdict pressed there hands
  focus back to the look (`review-section.tsx`), since a browser focuses the button a pointer presses.
- **The bulk controls live once, in the room's header, in both modes** (`review-actions.tsx`), which never goes empty,
  or a host mid-selection loses Reject, Approve and Cancel. Approve all needs no confirm: it sends the queue's own ids
  through `approveBulkAction` in consecutive batches of 2,000, so a host approves exactly what they saw, at any size. A
  verdict never waits on another: only an upload whose own verdict is in the air refuses a second press.
- ★ **Every verdict's toast carries Undo** (`shared/undo-toast.ts`, the product's one Undo; one toast per surface, a later
  act's replacing it). Undo puts the uploads back in place, then `returnToReviewAction` returns them to `pending` from
  the state that verdict left (`returnToReview`, scoped to it), refused once the event stopped reviewing. Review's verbs
  revalidate nothing: a revalidating action refreshes the route that called it, which re-ran the room's page per key.
- ★ **The room is live, on the hub's own signal**: the page seeds `HostAlbumProvider` as the hub does (the manifest, no
  links) and `review-live.ts` reads the queue off it, so an arrival reaches the room when it reaches the hub's Review
  card. It never joins the grid on its own: a glass pill floating over the grid's head counts it ("3 new"), taking no
  room so no tile moves as it appears, and a tap folds it in at the head.
  An upload decided elsewhere or taken back leaves the grid; one the room acted on does not while that write (or its
  Undo) is unread, its own write being its truth against a poll read before it landed. ★ **Only until the album has
  answered the catch-up the room asks for once the write lands** (`OwnWrites`, `review-queue.ts`; a refused write at
  once): from then on the album speaks for it again, so an upload decided here that returns to waiting from elsewhere
  (a second tab's Undo) is an arrival the line counts, and one put back here that is decided elsewhere leaves.
- **Turning moderation off with a queue** confirms with the count, and on save `approveAllPending` runs: the modal is the
  host's consent, the server the invariant (live mode never holds pending media).
- **Clearing the last pending item plays the beat** (unless uploads wait behind the line), during which the
  just-approved photographs are preloaded: their stable presigned URLs recur byte-identical in the album, so it paints
  from cache.
- **Tiles render through the shared `MediaTile`, never `next/image`**, whose optimizer 400s on short-lived presigned R2
  URLs.
- **The review pair `approveBulk` and `hideBulk` are scoped to `status='pending'`**, so a crafted call cannot flip
  other media; Undo's `returnToReview` is scoped to the state its verdict left. **Remove is soft** (`status='removed'` and `removed_at`): it frees storage at once, and the cron reclaims
  after the recovery window ([lifecycle-recovery.md](lifecycle-recovery.md)).
- **The host's tile verbs are a fixed three: like, download, hide/show** (one slot whose glyph swaps in place; the pane
  is [design-system.md](design-system.md)'s album tile). Delete is deliberately not a tile verb: a fan on a dense grid is
  a misclick trap, and it is the consequential one. Delete lives in the viewer and bulk select, approval in Review.
- **The viewer's pill groups "enjoy | curate"**, the curate group gated on `viewerIsHost && onSetStatus`, so the guest's
  pill is behaviour-identical; Remove confirms, the rest act directly. The tile row and the viewer share ONE
  `useModeration` hook (`host-media-grid.tsx`) over one `useOptimistic` list.
- **Album bulk select** opens from Select or a long press (`use-long-press.ts`) and runs on the one grid through
  `selection` (no second grid, no remount: a toggle re-renders one tile); the header's action slot becomes the shared
  `BulkBar`, whose rich tooltips mount only after hydration, and select-all takes every manifest id, mounted or not.
  The selection lives in a thin `HostSelectionProvider`, into which the album grid (owner of the optimistic items)
  registers its handlers, so the bar calls `selection.run(kind)`: the seam whenever a control surface and its grid live
  in different subtrees.
- ★ **The selection prunes to the surviving ids when the album changes, never resets** (`useSelection`), so a poll never
  wipes a selection in progress.
- **Bulk Like is one `like_many` call a batch under ONE summary toast** (the refused ids reverted); Hide, Show and
  Delete are the general `setMediaStatusBulk` and `removeMediaBulk` (plain RLS, no pending predicate), each sent in
  batches of `MAX_BULK_ITEMS`.
- ★ **Every bulk write, and Delete forever's reads, send the selection through `inChunks`** (an unchunked
  `.in('id', …)` over a big selection outgrew the URL and failed whole), and every bulk action refuses more than
  `MAX_BULK_ITEMS` (`lib/event/bulk-selection.ts`).
- **Host upload**: Add photos opens a dropzone (`host-upload.tsx`) straight into the album; its pipeline is
  [uploads-and-r2.md](uploads-and-r2.md)'s.
- ★ **Block puts one person out of one event, with their uploads** (`block_from_event` on the host's own client, free
  on every plan). It is the quiet last line of every person's look (a name in the Guests room, the uploader's credit in
  the host's viewer and on Review's peek, `event-blocks/`), opening one confirm whose count is the act's own preview
  and which offers An email first, off, on a names-only album. It keys on the account, the confirmed address
  or the guest row, never a device or an IP, so a typed name is held on the phone that used it. Their live uploads move
  to Deleted in the same step as the host's own removal (a held one stays, as every host write leaves it). The Guests
  room's foot lists the blocks (who, since when) with Let back in (`let_back_in`), whose restore is off unless the
  host turns it on and brings back only what this block removed and still waits in Deleted, to the status each had,
  newest first within the cap. What the person meets is [guest-flow.md](guest-flow.md)'s.

## The highlight reel, the host's side

The Reel card, the band's reel step, the old route's redirect and Settings' Highlight reel section are
[reel.md](reel.md)'s, with the rest of the reel and the clip. What the hub owes it: the card rides the cards row
(the Highlight reel is a door, never a room), the card's threshold reads the album's manifest (`isPlayableEntry`) and
its stills are the reel's take, planned on the server (`readHubReel`) and asked again when its state moves, and
nothing about review shows anywhere a room could watch.
