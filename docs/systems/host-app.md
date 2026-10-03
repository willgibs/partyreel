# Host app: events, QR and print, the event page, moderation

Open this before you:
- change how an event is created, an event setting or the door (who can get in, the Guests room's At the door and
  Invited);
- change the QR designer, a code's size or the print sheet;
- touch the custom event link;
- change the first-time welcome;
- change the event page: its header, cards row, its rooms over the hub (Review, Guests, Settings, See it as a guest),
  checklist, album or live refresh;
- change host moderation, a tile verb or bulk select;
- change the hub's door into the highlight reel (the reel itself, the Reel card and Settings' Highlight reel section are
  [reel.md](reel.md)'s).

The dashboard is [dashboard.md](dashboard.md)'s, the upload pipeline [uploads-and-r2.md](uploads-and-r2.md)'s, the guest side [guest-flow.md](guest-flow.md)'s,
caps and billing [billing-caps.md](billing-caps.md)'s, and operator moderation
[admin-observability.md](admin-observability.md)'s.

## Events and the create flow

An `events` row carries the one DB-generated link (`qr_token`) and the host's switches. The ones the schema does not
explain: `require_verified_email` is the one identity switch (An email first); `gate` refines a `private` album into
its gate (below); `allow_videos` is the Videos switch, binding guests only, as `max_upload_bytes` caps each GUEST upload
(the host's own are exempt); `qr_style` is plain text, app-validated, so presets grow without a migration.

- **The sole create path is `/dashboard/new`** (`create-event-wizard.tsx`, its screens in `create-event-wizard/`), a
  room of its own, dark in both themes, in Will's layout (the steppers, the question in one place, the answer in the
  centre, one button at the foot): the name, the code's look, then the beat. It creates once, at commit (an abandoned
  Create leaves no row), through the non-redirecting `createEventInWizard`, which returns the id and token so the beat
  can draw the real code. Only the name is required; everything else is edited in Settings (below).
  `enforce_event_limit` guards `MAX_EVENTS` in SQL. ★ So the look step's codes are samples and say so in one word on
  the pictured code: they encode the stand-in link (`previewJoinUrl`, as long as a real one, naming nobody's album),
  which a test-scan meets as a 404.
- ★ **The room is `fixed` over the (app) shell, and the shell's bar steps aside in CSS** (`data-app-room` on the room,
  `group-has-[[data-app-room]]/shell:hidden` on the header: the wide page's own way of asking), so nothing of the app
  stands around Create or waits in the tab order behind it. It stands on a phone's keyboard (`useKeyboardInset` lifts
  its foot), and the route waits in its own room (`RouteSkeleton`'s `room`), never the dashboard's paper skeleton.
- ★ **The carry (`carry.ts`) photographs the leaving screen and flies her name between the field and the head** on the
  Web Animations API, measured off both (the field's invisible mirror, `[data-room-name-text]`), the arriving screen
  live from its first frame; a new change finishes a running one (`settle`), and reduced motion (or no `animate`)
  cuts. Back exists on the look alone: never on the name, never once the event exists.
- ★ **The beat happens once in an event's life, by construction**: only Create event reaches it. It lands at once on
  the sample she styled while the event is made (nothing says live before it is; a refused or rejected Create returns
  to the look, her name and look kept), develops into the real code (what mounts with the event arrives on
  `@starting-style`, the code's bloom igniting with it), then Print and Share as rounds, Settings' five laid flat
  (`settingsSteps`) over the checklist's line, room beside them past the dashboard's threshold (`newEventFacts` with
  the route's `storageUsedPct`), and Get it ready into Settings' first step; the room's close leaves for the event.
  The custom link belongs to the share sheet.
- ★ **The cap is a door, not a dead button**: a host never does the work of an event and only then learns the plan cannot
  hold it. The route computes `atCap` with the dashboard's own math (`profile.event_slots ?? MAX_EVENTS[tier]`, as
  `enforce_event_limit` does), and the wizard renders the refusal (the plan's number, the event holding the slot, Delete,
  Pro) in the room, unlit, instead of its screens, so New event stays a live link; `enforce_event_limit` stays the guard behind the door.
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
  beat, the share sheet and the code's row on the checklist and in Settings.
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

`/dashboard/[eventId]` is a hub under the album's own head: the cover with the event's name, its facts and link and
the live code on its white mat, a row of cards into the event's rooms, and the album beneath, newest first. Every room
opens OVER the hub and closes back to it (event-header r2, `rooms=over`).

- ★ **An event that is gone, never this host's, or no id at all draws the group's not-found itself**, on the hub, the
  reel's old room and See it as a guest (Review, Guests and Settings only redirect into the hub, which draws it for them)
  and on the print sheet (in the shell's gutter, as `(print)` draws no shell; thrown, it was the root's error shell). `getEvent` answers a malformed id null
  before any read (`isUuidShape`: Postgres refusing the cast threw the page into its error screen, untitled, and filed
  an error each hit), as the portal's record pages do theirs. Never through `notFound()`: thrown under the
  hub's `loading.tsx` it landed after the skeleton had streamed, a 200 whose screen the client drew once it had run,
  under the page's own title ("Event", build 30's red-team). Drawn, it streams into the skeleton's place, titled from
  `(app)/not-found.metadata.ts` ("Event not found", noindex), and stays a 200: behind sign-in nothing reads the status
  (crumbs-28's Question: a read before every hub load would buy nothing).

- ★ **The hub and the dashboard home are the wide pages**: each marks its root `data-app-wide` and `AppShell` answers in
  `:has()` (a page cannot hand a prop up to its layout), dropping the 1280 cap and taking the album's gutter (12px, 20px
  from `sm`), so the logo, the name, the cards and the album share one left line. Their skeletons mark it too, or the
  page paints at 1280 and jumps; the head and the cards row's sticky band bleed by exactly that gutter.
- **The head is the guests' cover, hers** (`event-header` r1, `host=shared`: `event-feed/event-hub-head.tsx`'s
  `HubCover` in the album's own frame, `EventHead`, [guest-flow.md](guest-flow.md)): the album's photographs dissolving
  edge to edge under the name, the facts and the link on them, and the code on its white mat (`ui/code-mat.tsx`) in the
  cover's corner, scannable from across a table, so she sees her party as her guests do. It bleeds to the window's
  edges and reaches up to the app's bar (the main's 32px taken back), unless Checkout's receipt stands above it. ★ Its
  photographs are the guests' cover's rule (`event-hub-head-stills.ts`, pure, read on both sides): the reel's opening
  stills while it plays (`readHubReel`'s), else the newest a guest can see (approved, never hidden, held or a clip), from
  the links the first window already minted; live, a still she hides, removes or sends back leaves it the moment the
  album's store has it, and an empty cover fills from the newest as their links land. The house light stands under
  it, the week before. The facts under the title are today's words as glyphs (`ui/glyph-count.tsx`: the album's count
  live off the store, guests, views, the live mark as `Badge`'s `live`); `event-header` r2 redraws them and the rooms.
- **The code stands BESIDE the h1**, never inside it (an h1 holding a control stops being the page's accessible name).
  ★ It carries no status chips: the code wears the door on its corner
  (`share/event-code-door.tsx`, its words `codeMark` in `visibility-labels.ts`): a lock for a gate, a closed eye for
  Only me, a pause for paused uploads, the waiting count in the needs-action tone, nothing for Public taking uploads;
  paused and Only me dim the code, since a guest who scans either cannot add. The mark is its own button beside the
  code's (pressing the code opens the card, asking what a corner means must not), outside the mat so nothing lands on
  the modules. ★ Its words come on hover, a keyboard's focus and a tap: the tooltip primitive refuses a tap on purpose,
  so the mark controls the tooltip itself (a tap toggles it, a cursor's click keeps it), and the radix tooltip mounts
  only after hydration, the server's paint carrying the native `title`. The Settings card counts what a guest still
  needs while Settings' steps are not all ticked ("2 left", in the foreground, never the waiting amber), then names the
  door (`doorLabel`). The link row shows the readable URL and copies the permanent one, confirmed in place, never by a
  toast.
- **The cards row** (Highlight reel, Guests, Review, Settings, then See it as a guest, `AS_GUEST_DOOR`, the payoff at the
  row's end and never one of `EVENT_ROOMS`, so every drawing that maps the four rooms keeps drawing four) is a group of
  links, never tabs, since nothing switches a panel in place: each door is the room's real address (`roomHref`), its
  ordinary press opening the room in place and a modified click a tab of its own. ★ A room's code is a chunk of its
  own, asked for on intent (`share/room-chunks.ts`: a pointer over the door or a keyboard's focus), and what it shows
  as the press begins (Review's queue's links, the Guests room's read), so a panel opens on its room. ★ The Guests card and the header read THE ONE COUNT (`getEventGuests`, the album header's own
  function), so the hub, the Guests room and the album say one number. The row is sticky and condenses in place,
  because a remount would drop the code chip's `view-transition-name` mid-morph. ★ It condenses inside a footprint that
  holds the resting row's height (`useStuckBand`): a condense that moved the album let scroll anchoring carry a jump
  into the stick band (the viewer's close runs one) across the threshold and back for ever; and stuck is its top at
  the bar, the observer's root grown past the fold, so a short screen never reads the resting row as stuck. ★ Stuck,
  it carries the head it came from (his note: "Love how they're captured into a sticky menu on scroll for page-wide
  access"): the cover's first photograph and the name lead it, and the code closes it as a chip (`ui/code-chip.tsx`,
  the glyph on white, never a shrunken code), which exists only while the head's code is off screen and carries the
  morph's name while it is the code on screen. On a phone at rest the row is a 2x2 grid of two-line cards
  (`event-feed/room-card.ts`), so all four rooms show at 375 and See it as a guest takes the third row's first place.
- **Every room is a place over the hub, one way in and out** (Will, event-header r2 `rooms=over`: "This feels
  phenomenally more fluid, natural, and intuitive"): Review, Guests and Settings stand in ONE panel (`share/room-panel.tsx`
  for the first two: Settings' own kind and head, the room's name over the event's, the close in its corner, so the
  three are one panel to the pixel), the share kit where it always was, See it as a guest in a phone over the dimmed hub
  (below), and the Highlight reel is a door: the guests' own view at `?reel`, full screen with its black from the first
  frame (reel.md), its owner's close going Back to the hub. The old room routes (`/review`, `/guests`, `/settings`) only
  redirect to `roomHref`: they are in histories, mails and the sign-in's return (which carries a path, never a query).
  ★ A room's panel names its room on the dialog (`data-room-panel`), so the room's own keys read that panel as their
  page and never as another layer up (`review-keys.ts`). ★ The crumb trail is the hub's alone now, and lands at
  hydration (a page cannot hand a prop up, and CSS cannot carry an event's name); the bar's
  fixed height keeps it from shifting anything. ★ It is drawn only while its route's `SetCrumbs` is mounted, so a route
  that sets none, an error and a not-found page draw none; `RouteSkeleton` holds the last trail through a
  `loading.tsx`'s wait (`CrumbsHold`), because the new address commits with the skeleton on screen and the page lands
  later, so a bar that followed the address or let go with the old page blinked for the whole wait
  (`shared/crumbs.tsx`).
- ★ **Every place rides `?room=`, and it IS the state** (`share/event-share-provider.tsx`, read from `useSearchParams`
  with no mirrored `useState`, so the page a settings action re-renders cannot close the panel). ★ One room handing
  over to another (Settings' door page into Guests, the Guests room's "Change who can get in" into Settings' door page,
  a code card's Everything) REPLACES the entry, so a close always lands on the hub, never on the room before. ★ Every
  old way into a room that a press inside the hub still reaches opens the room in place (`useRoomLinks`: a capture
  listener reads the link as this event's room, a retired room route or `roomHref`, `roomOfHref` in `sections.ts`, and
  carries its Settings page and its section, `#invited`, which the room scrolls to once drawn), so a link never trips
  through a redirect and back; a modified click, a target and another event's room stay the browser's, and Next's
  `<Link>` stands down on the prevented press. ★ Nothing in a sheet
  refreshes the router: every Settings save re-renders the hub in its action's own answer, the reel switch's included
  (`setReelDefaults` revalidates the hub for the switch), which Next replays when a tap moves the address mid-save; a
  refresh in flight turned a tap on the page's back arrow or a row into a reload, or dropped the refresh
  (`refresh-then-write-policy.test.ts` keeps it out of the sheets; `lib/history-entry.ts` holds the matrix and the one
  two-tap residual). ★ So a Settings page move made while a save is on its way is drawn at once and its address
  written once the save has LANDED, its transition committed (`settings-state.tsx`'s `afterSaves`; the newest of
  several moves, none if it comes back to the address's page, dropped by a close): written at the save's answer, a
  second move 20ms later still reloaded the page, since Next's history entry holds the old tree until the commit
  (crumbs-42, measured under `next dev`). ★ Every native history call hands Next a FRESH object (the marker as a field) or `null`, never
  `window.history.state`: Next's patched `pushState` and `replaceState` apply the URL only to a state without `__NA`
  (`history-state-policy.test.ts` refuses the shape; a write from a mount effect waits a microtask, because it would
  meet the browser's own function before Next patches it: `lab/board-state.tsx` says why). ★ Whose entry a place stands
  on is `lib/history-entry.ts`'s, which the hub's sheets, a phone's screen-shaped popup, the reel and the photo viewer
  (`?photo=`, every album's) all use (its header holds what Next does to an entry). Opening pushes an entry carrying the marker (a sheet already open is left alone, so
  a double tap pushes one entry, never two); closing goes Back only when the entry is ours (the marker says so, or this
  page pushed it) and only once until that Back lands (two taps on the X used to leave the hub); a router commit that is
  not a traversal (a save's re-render) rewrites an entry without the marker and a reload forgets what the page pushed,
  so `keep` runs after each render with a sheet open (it adopts a marker it finds and gives an entry this page pushed
  that lost it its marker back); a place opened from a link or a bookmark never had one and closes in place. ★ A Back
  off an entry pushed at an address, after a router refresh while it stood, lands on a page whose head Next left empty
  (title, viewport, icons, until a reload; crumbs-26): the entry watches the head as the place goes and asks the
  router's refresh when the title is gone, and only then (the header says why). ★ The
  server's `initialSheet` paints the first frame alone (a hydration gate): once hydrated the URL is the only answer, so
  a place opened from a link (`/settings`, a sign-in's return, Checkout's `?room=`) closes like one opened from its
  card. A settings page is `&setting=<page>` on the same entry, moved with `replaceState`, so its back arrow and Back
  never stack entries.
- **The code card is every share's first surface** (`share/code-card.tsx`: the code on white filling a phone, a 384
  card at a desk, Copy link, the device's own Share where it has one, and Everything into the kit,
  `share/event-share-sheet.tsx`, which holds the downloads, the designer and the custom link). Every door to it reads
  Invite: the head's code, the sticky band's chip, the checklist's code row (`share/invite-button.tsx`), Settings'
  fifth step (which closes Settings first) and the dashboard card's QR chip, which opens the card in place. ★ Never draw the code in a second sharing surface, or a fix lands in only one
  of them.
- **Settings is five steps** (`event-settings/`): Who can get in, What guests can add, The highlight reel and The
  event, each row one sentence (`settingsSentence`, the one home) whose underlined words are live controls
  (`SettingWord`) and whose row opens its own page with a back arrow (`PopupHeader`'s `up`), then the code. The rows are
  numbered down one rail and ticked once ready, by the checklist's own function (`settingsReadiness`: the server's
  facts, the album's live counts over them, Settings' optimistic values over both, so a step ticks the moment its
  choice is made; room is the plan's and stays on the hub). Every page ends in Next (`nextSettingsPage`), a page move
  like a row's, and the fourth's, Next: The code, closes Settings onto the code card, as the code's own row does. Every control saves
  itself (no form, no Save): `SettingsProvider` lays an optimistic overlay over the server row, a key dropped once the
  row catches up, with a sequence per key so a late answer never undoes a newer choice; a text field saves when it is
  left. ★ A setting with no effect right now stays in view as one quiet line under the switch that governs it
  (`ui/dormant.tsx`, `inert` while asleep, no movement under reduced motion), and a change that affects people already
  in says so in its own place before it happens (`ui/consequence-line.tsx`). The Videos switch is locked on Free (a
  drawn switch inside one button: the plans), live on paid plans. `/settings` survives as a redirect: it is a published
  URL.
- **The QR mini-modal** (`share/event-code-modal.tsx`) takes no URL: a look at the code is a beat, not a destination. It
  grows out of the head's code on the native View Transitions API, name-scoped in `share/share.css`, and exactly one
  of the head's code, the band's chip and the modal carries the name at a time (a duplicate makes the browser skip the
  transition). ★ Its entrance is the one sanctioned hole in the floating-layer contract: `floatingTransitionEntrance`
  declares no animation, because the transition is the entrance, and falls back to the standard clock under reduced
  motion. ★ A hidden document never starts one (`withMorph`): it cannot snapshot, so the browser aborts the transition
  and every promise it hands back rejects (`InvalidStateError`); the change simply lands, and an abort mid-transition
  is let go while any other failure still surfaces.
- **The checklist stands at the head of the hub until the event is done** (`event-feed/checklist.tsx`, under the cards):
  the whole list while the album is empty, one line with a ring once it has photos (Show unfolds it), gone once
  everything is done. ★ Ready is one pure function (`lib/events/readiness.ts`) the checklist, Settings' steps, the
  Settings card and Create's hand-off all read, never stored and never shown to a guest; ready waits only on what a
  guest needs (a door she can pass, uploads open, the code opened once, room once the shelf is full), and the first
  photos and the welcome are worth doing, never a gate. ★ Every fact is already read: the code ticks at its first open,
  the header's own Views number (the host's test scan included), and the first photos ride the album store's live
  counts (`useLiveReadyFacts`), so they tick with nothing refreshed; the code's tick waits for the hub's next render.
  ★ It never leaves under her eyes (finished while she looks, it stays ticked for the visit), and from the day after
  the event's date it is not drawn (`checklistOver`, the viewer's day): an album paused after the party is finished,
  not unready. The album's empty place is its own ("No photos yet", `EventUploads`); a held-only event shows
  "Everything's in Review": it is full, not empty.
- ★ **The hub is live: an upload lands while the host looks, and nothing refreshes the page.** The album is the page's
  store (`event-feed/host-album.tsx`, its pure half `lib/event/hub-album.ts`), seeded with the host's first sync and
  its validator, and moved by `sync()` on the guest's Realtime doorbell, a fallback poll (12s with the socket down, 60s
  up, paused while hidden, asked again on return) and each write's catch-up. The host's version answers every question
  (`/api/album/host/<id>/sync`: a 304 that read one row, a delta by id, a manifest past 500 changes or below the
  log's watermark). ★ The poll is not
  redundant with the socket: the doorbell fires only on the approved-visible set, and the host's version, which every
  status change moves, is how a held upload reaches the one person who can approve it (the Review card counts it).
  `HostMediaGrid` marks arrivals by diffing ids, never links (they roll every half hour), and a host album never
  staggers. ★ An arrival lands complete, or not until it can: it is decided in the render the id first shows in, and
  the guest album's gate (`shared/use-arrival-gate.ts`, [guest-flow.md](guest-flow.md)) holds it out of the rows,
  asks for its link itself (`HubRows.onNeedLinks`, since a delta brings none and only a window asks) and lets it in
  once its photograph is decoded, with the glow lit then; the id list only grows, so a photograph put back from the
  bin is not an arrival twice in one visit.
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
- **SSR'd surfaces paint native `title` only**, never a radix Tooltip in the server's paint (the hydration regression
  in [architecture.md](architecture.md)): one mounts there only after hydration (`useHydrated`, the bulk bar, the
  code's mark and the head's glyph counts); rich client UI is safe inside its islands.

## See it as a guest

Her album exactly as a let-in guest meets it, opened from her hub (event-header r2's carried call `guest-door`: the
last door, the payoff at the row's end): a phone over the dimmed hub at a desk, the whole screen under a bar whose arrow
names the event in a hand (`share/as-guest-stage.tsx`, Radix's Dialog in a shape of its own, as the code card is), on
`?room=as-guest`, closing onto the hub as she left it (its way back, Escape, Back, a press on the dimmed hub).

- ★ **The phone holds a page of its own, never the guest page** (`/dashboard/<id>/as-guest`, framed with `?in=hub`, the
  hub's stage carrying the way back; "Open it in a new tab" opens it bare, where its header carries it). On the guest
  page her session is the owner: no door, her own uploads hers to delete, the reel's host extras. A real phone's
  viewport is the reason it is a page in a frame: the guest page's layout reads the viewport, which a narrow box in the
  hub's own page could never be. ★ It is a route group of its own, `(as-guest)`, for `(print)`'s reason: a guest's phone
  never wears the host's shell, so its layout re-declares the `getUser()` gate and the page proves the event through RLS.
  Its URL keeps `/dashboard`, the surface rule's; a signed-out visit signs in to the dashboard (the return carries
  allow-listed shapes alone).
- ★ **The read is a let-in guest's, never the owner's** (`as-guest.server.ts`, pinned end to end on the fake PostgREST
  in `as-guest.server.test.ts`): `getEvent` (RLS) first, then the door's own resolution (`pageDoor`, which lets her
  through as the host and issues its pass, the proof a gated album's reads ask for), then the guests' own seed loader
  (`streamGallerySeed`: the service role, approved and unsealed only, so no held, hidden or sealed shot reaches it
  whoever asks), decided for a guest past every step (`letInGuestDecision`, `isOwner` false). Nothing of hers rides it
  (no list of her own uploads, no follow card), the pass is stripped before the view, and it writes nothing: no visit
  counted (her Views would count her own look), no ticket read or minted, no claim. The one write anywhere under it is
  the develop a guest's first read runs when one is due.
- ★ **A look, never a door** (`share/as-guest-view.tsx`): the guest page's own pieces in its order (the guest's header
  as a signed-out guest sees it, the cover, the album through the guests' own live source asked as a guest, the Guests
  list, the shutter, the report line), the whole of it `inert`, so nothing pressed there writes as a guest; it mounts
  none of the guest page's hands (the door, the upload queue, the keep, the claims, the tracker, the reel's controller).
  Uploads closed shows the guest's closed line and no Add; the camera's album says Take photos. ★ Only me is the shut
  door, because that is what every guest meets there, and nothing is read for it.

## The door, the host's side

Who can get in is one door of six (`lib/event/door/door.ts`; what a guest meets is [guest-flow.md](guest-flow.md)'s),
set on its own settings page in the order a guest meets it: (1) Public, Private or Only me; (2) Private's gate: a
password, you let each person in, your invite list, only people already in, each with its line and a small (i) for
its purpose (`GATE_HELP`); (3) An email first; (4) A photo first. Every word lives in
`lib/events/visibility-labels.ts` (`doorLabel` for the hub). The host keeps the words "Only me", so the profile's
visitor-facing "Private" never collides.

- ★ **`set_event_door` is the one writer of the pair** (`setEventDoorAction` re-verifies with `getUser()`). Under a
  gate the page says how many are already in ("31 guests are already in"); choosing Only me with guests in, or Public,
  Only people already in or a password with newcomers waiting, says what happens first and waits for the confirm (a
  first password says it beside its field, since setting it opens that door). Opening an album to Public lets everyone
  waiting in but an ask a block holds (`events_door_opened`; every door act that lets asks in or counts them reads one
  set, `event_door_asks`), so a declined newcomer's ask waits through a Public trip for Let back in rather than walking
  her into an album its host never let her into; a password ends every ask
  (`events_door_to_password`: nobody waits on the host there), so they leave At the door, the dashboard and the bell,
  and meet the password like anyone new.
- ★ **The Guests room is read where it opens, over the hub** (`guests/room.server.ts`, one read, after `getEvent` has
  proved the host): by the hub's own render whenever its address names the room (a link, a reload, and every act in
  it, whose action revalidates the hub, the one page the rooms stand on), and by its own ask (`readGuestsRoomAction`,
  started as the card's press begins) when a card opens it in place, a press that writes the address without the
  server. The panel draws the newer of the two (each says when the server read it) and shows the last read at once on
  a reopen; a read that fails says so with Try again, never an empty room.
- **The Guests room's At the door** heads it (`queue=room`): Let in (`let_in_at_door`) opens her door on every device,
  and her held door opens by itself at its next check-in; ★ Decline is a block (the account where there is one, else
  the row), with Undo on its toast and Let back in under Blocked, so a declined newcomer meets the one shut screen and
  cannot keep re-asking. Either way back returns her to the door, where she still needs Let in unless the door as it
  stands lets her in (the invite list, being the door, naming her; or a Public album, which `let_back_in` then lets her
  into, its opening having waited only on the block), and Let back in's words say which (`BlockedPerson.lands`, from the door as it stands:
  someone with no row past the door is a newcomer whatever rows remain, so one whose ask a password ended hears she
  meets it like anyone new, and where nobody new gets in, that she stays out; someone who was in, while the album is
  Only me (which shuts even the people already in), hears the block is lifted and the album stays closed to her until
  the host opens it; and a newcomer whose ask stands at Only me, which keeps its asks, hears she is back at the door
  and that letting her in there meets that closed album, `door_only_me`). The door is read once for everyone in the Blocked list, since it decides every landing. A
  waiting newcomer counts on
  the hub's Guests card, the dashboard (the stage's or the week's step, opening the Guests room over the hub, else a
  mark on the event's tile) and the bell (a row per event), and sends no mail.
- **Invited** (`editor=both`): one field takes a typed address or a pasted list (`readAddresses`: the readable saved at
  once and counted by the database, the unreadable kept as flagged chips), capped at `INVITE_LIST_CAP`; each address
  reads Joined or Not yet, since it matches only once its guest confirms it, so removing one never puts out someone it
  let in. The list stays editable while it is not the door. ★ While it is the door, a waiting person it names is in
  (`event_door_admit_listed`, build 23's BUG-2): the listing, the door becoming the list and Let back in each let her
  in, on every device she asked from, counted once, so she leaves At the door and the ticket she asked with adds.
  ★ The menu and the steps page say it BEFORE the list is chosen ("Lets in the 1 person waiting at the door who is on
  your list.", `listedWouldComeInLine`), only where it would let someone in: the count is `DoorCounts.waitingListed`,
  `event_door_counts`' `waiting_listed` from `event_door_waiting_listed`, the admit's read-only twin, both reading the
  same asks (`event_door_asks`' listed ones). The six-door menu is `settings-rows.tsx`'s `doorConsequence`;
  `door-page.tsx` is the steps page.
  **Invite** is the room's main action while it is empty and a quiet one after: the event's code card, sending
  nothing.

## Moderation and curation (host side)

`media.status` is `pending | approved | hidden | removed`; `create_media` sets pending or approved from the event's
`moderation_mode`.

- **The Review room stands over the hub and reads its queue off the hub's own album** (`review-room.tsx`'s
  `ReviewRoomFromHub`): the uploads the manifest holds waiting, newest first, their tiles minted by the host's links
  route by id with each one's credit (never the whole album's attribution), so opening Review asks for the queue's
  links and nothing else; a deep link onto the room (the bell) finds them minted with the hub's first window
  (`page.tsx`). ★ The queue is seeded once, whole: the room ranks what it is first handed and holds anything a later
  render brings behind its line, so it mounts once the queue's links are in, its shimmer standing meanwhile, and a queue
  none of whose links came back says so with Try again, never "all caught up". Its states (pending, caught up,
  moderation off with a one-tap "Turn on review", the all-caught-up beat) live in `use-review-triage.ts`, its pure rules
  in `review-queue.ts`. ★ Its panel titles it, as Settings' does, so the room's own row keeps the queue's count in words
  and its actions (`review-section.tsx`'s `titled`, false over the hub; the room as a page drew its own title, and a page
  heading over the room's amber label once said Review twice); in a hand the actions take their own row, since the bulk
  bar is wider than the browse duo and beside the count it wrapped the row on Select. Its grid is the shared `SelectableMediaGrid` on the uniform layout, because uniform tiles
  standardize the selection targets and scan fast. Over the queue, while there is one, sits its one line of advice,
  "Anything you approve can still be hidden later." (`REVIEW_NOTE`, Will's host note: so a host is lenient toward
  approve-and-hide over reject), a sentence and never a hint row.
- **The refusing verb is Reject at the door, Hide in the album**: a rejected upload lands `hidden` (dimmed in the host's
  album, where Show approves it), the same row a Hide leaves; only the word differs. A tap opens the peek, which carries
  the verdict (Reject, Approve) under the photograph at every width and moves on to the next upload once one is
  decided. ★ **The keys** (`review-keys.ts`): arrows move a focused tile, Enter approves, Backspace or Delete rejects,
  Space peeks; no hint row, only the verdict buttons' tooltips (and a screen reader's line) say so. They act only on a
  tile, in the peek, or (the room's own place alone) with nothing focused, the panel itself counting as nothing, never
  on another control, and never give a verdict on a selection. In the peek a focused button keeps only its own Enter and Space, and a verdict pressed there hands
  focus back to the look (`review-section.tsx`), since a browser focuses the button a pointer presses. ★ The peek is
  `aria-modal`, so it holds Tab while it is up (Radix's FocusScope, trapped and looping; a layer opened over it, the
  credit's look, pauses it). The trap takes the opening focus itself (the look, or a verdictless look's close button),
  so it always has that focus to hand back (the grid's own focus, a commit before the trap had its container, let a
  first Shift+Tab walk out behind: build 33), and Shift+Tab from the look comes round to its last control; the grid
  puts focus back on the tile when it closes.
- **The bulk controls live once, in the room's header, in both modes** (`review-actions.tsx`), which never goes empty,
  or a host mid-selection loses Reject, Approve and Cancel. Approve all needs no confirm: it sends the queue's own ids
  through `approveBulkAction` in consecutive batches of 2,000, so a host approves exactly what they saw, at any size. A
  verdict never waits on another: only an upload whose own verdict is in the air refuses a second press.
- ★ **Every verdict's toast carries Undo** (`shared/undo-toast.ts`, the product's one Undo; one toast per surface, a later
  act's replacing it). Undo puts the uploads back in place, then `returnToReviewAction` returns them to `pending` from
  the state that verdict left (`returnToReview`, scoped to it), refused once the event stopped reviewing. Review's verbs
  revalidate nothing: a revalidating action refreshes the route that called it, which re-ran the room's page per key.
- ★ **The room is live, on the hub's own signal**: it stands inside the hub's own `HostAlbumProvider` (a room on a
  page of its own seeds one from the page, as the Library's does) and `review-live.ts` reads the queue off it, so an
  arrival reaches the room when it reaches the hub's Review card. It never joins the grid on its own: a glass pill floating over the grid's head counts it ("3 new"), taking no
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
  in different subtrees. ★ In a hand every control in a bulk bar is a 44px target, the peek's verdicts' (`HAND_TARGET`:
  44 wide, its `::before` reaching 8px past a 28px box, so the band never grows), a pointer's 28
  at a desk, and the destructive verb stands apart behind a hairline (`Apart`); the album's header gives the bar its
  row while selecting (`actionFills`: five verbs do not fit beside the label at 375), the label kept for a reader.
  Measured at 375: every control 44 tall or more, Download and Remove 61px apart where they were 32. ★ **The band
  keeps the height its tools had at rest** (`FeedSectionHeader` measures its row while the tools are there and holds
  that as its minimum while the bar fills it): in a hand the tools wrap to 62px (96 at 320) and the bar is one 28px
  line, so the album's top moved 34px on Select and back on Cancel until the band held; measured on
  `/design/album-scale?surface=host` at 320 to 1440, the first tile stays put through Select and Cancel.
- ★ **The selection prunes to the surviving ids when the album changes, never resets** (`useSelection`), so a poll never
  wipes a selection in progress.
- **Bulk Like is one `like_many` call a batch under ONE summary toast** (the refused ids reverted), naming what it
  added by kind (`formatKindCount`: "Liked 1 video", "Liked 3 items" for a mix, the album's word as the storage list's;
  Review's verdicts say "uploads"); a press that added nothing still says so, "Already liked 2 photos" (a plain toast)
  when the selection was liked already, the heart's own "Couldn't save that like." when the server refused it; Hide,
  Show and
  Delete are the general `setMediaStatusBulk` and `removeMediaBulk` (plain RLS, no pending predicate), each sent in
  batches of `MAX_BULK_ITEMS`.
- ★ **Every bulk write, and Delete forever's reads, send the selection through `inChunks`** (an unchunked
  `.in('id', …)` over a big selection outgrew the URL and failed whole), and every bulk action refuses more than
  `MAX_BULK_ITEMS` (`lib/event/bulk-selection.ts`).
- **Host upload**: the album header's Add photos toggles a dropzone panel (`host-upload.tsx`) under it, straight into
  the album, and the reel card's opens the same panel and brings it into view with the least movement
  (`HostAddProvider.openAdd` scrolls to the box `HostUpload` registers, clear of the app bar and the stuck cards band),
  never the top of the page; its pipeline is [uploads-and-r2.md](uploads-and-r2.md)'s. ★ A drained batch asks the
  album's store once (`onBatchLanded`), never refreshes the router: the store brings the batch as a delta (the doorbell
  already rings for it), where a refresh re-ran every read and presign on the hub.
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
nothing about review shows anywhere a room could watch. ★ The card's door is the guests' album at `?reel`, and the
owner arriving there meets the reel's black from the first byte, never her album flashing under a view still loading
(the guest page's server knows the owner asked: [guest-flow.md](guest-flow.md)'s curtain).
