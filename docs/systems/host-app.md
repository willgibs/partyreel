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

The dashboard is [dashboard.md](dashboard.md)'s, the upload pipeline [uploads-and-r2.md](uploads-and-r2.md)'s, the
guest side [guest-flow.md](guest-flow.md)'s, caps and billing [billing-caps.md](billing-caps.md)'s, and operator
moderation [admin-observability.md](admin-observability.md)'s.

## Events and the create flow

An `events` row carries the one DB-generated link (`qr_token`) and the host's switches. The ones the schema does not
explain: `require_verified_email` is the one identity switch (An email first); `gate` refines a `private` album into
its gate (below); `allow_videos` is the Videos switch, binding guests only, as `max_upload_bytes` caps each GUEST upload
(the host's own are exempt); `qr_style` is plain text, app-validated, so presets grow without a migration.

- **The sole create path is `/dashboard/new`** (`create-event-wizard.tsx`, its screens in `create-event-wizard/`): the
  name, the album's style (three cards resting on the moment they differ, the picked one playing its story once,
  `style-story.ts`; a Disposable adds its own screen after it, the develop time and the roll, so the steppers count
  five), the code's look, then the beat. The room is unlit on every screen: its first light is the code's, in the
  event's seed (`seedLight`: `orbFor` of the event's id), lit once as the code turns real. It
  creates once, at commit (an abandoned Create leaves no row), through the non-redirecting `createEventInWizard`, which
  returns the id and token so the beat can draw the real code. ★ **However many times it is asked, a Create is one
  event:** the wizard keeps one key (a UUID minted at its first press, kept across Back and edits) and `createEvent`
  returns the event the host already made under it (`events.create_key`: unique per host, written at birth and never
  after, read by no RPC and no guest), so a Try again after a lost answer is never a second event spending a Free host's
  one. The match is read before the insert and again when the insert is refused; a deleted match (its key stays taken)
  makes a keyless event. Only the name is required; everything else is edited in Settings (below). The look step's
  codes are samples and say so on the code: they encode `previewJoinUrl`'s stand-in link, as long as a real one so the
  look is true, and it names nobody's album, so a test-scan meets a 404.
- ★ **The party keeps its own time zone, captured, never asked** (`events.time_zone`, `lib/event/zone.ts`): Create sends
  her browser's zone (`captured_zone`, every style), and the server stores it only where its runtime reads it (an
  unreadable one is stored as none and reported, never a refused Create); a Settings save of a time (the dates, the
  develop) carries hers to an event with none, written only under `time_zone is null`, so a date saved from anywhere
  never moves a party's zone. Only her chosen city moves it (`time_zone`, refused in words if unreadable). Its develop's
  9 am and a far party's times read it, never its album's order ([guest-flow.md](guest-flow.md),
  [disposable-mode.md](disposable-mode.md)); a host who never travels never sees it.
- **The room is `fixed` over the (app) shell, whose bar steps aside in CSS** (`data-app-room` on the room, read by the
  header's `group-has-[[data-app-room]]/shell:hidden`, since a page cannot hand its layout a prop), so nothing of the
  app waits in the tab order behind Create.
- **The beat happens once in an event's life**: only Create event reaches it, and nothing leads Back once the event
  exists. Nothing on it says live before the event is: a failed Create is held on it, never a toast (`held.ts`: the
  sample stands, the words say nothing was lost and the way to put it right, the foot is Try again or, at the plan's
  limit, Upgrade, and Back leads to the screen before it). Once the event exists it is the payoff of a made event: the
  line under the question says share it, her link stands under the code as guests will receive it (the album's own
  `/e/<token>/card`, its title, one press copying the permanent link), Print and Share under that (Share only where
  the device has its own sheet; its message names videos only where the plan's album takes them), and the foot is Go to
  your event, a link that prefetches the hub in full. ★ **The room opens into her event on the code's own morph
  name** (`entry.ts`): the plate takes `CODE_MORPH_NAME`, which the hub's code wears while it is the code on screen, and a
  native view transition carries the one into the other across the change of page (never React's `<ViewTransition>`,
  whose flag swaps the app's React build); the screen freezes until her cover's code stands, under a 1.2 s ceiling, and
  reduced motion, a hidden tab or no API is a plain navigation. The head's close steps aside once the event exists.
- **Make one like this opens Create in an album's style** (`create-event-wizard/like.ts`, after-party r1's `bridge=end`):
  the guest header's corner, her name menu and her account menu lead through `/dashboard/new/like/<token>`, a route
  that keeps the token half an hour in a cookie sent to Create's page alone (`pr_create_like`, path `/dashboard/new`)
  and sends a signed-out visitor to sign-up with Create as the return (a sign-in return carries a path, never a query,
  and a new account names itself at `/welcome` first, so the token rides the cookie through both). Create's page
  (or `?like=<token>` on its address) reads the album through its own read and its door as the visitor she is
  (`pageDoor`): a door that shuts her lends nothing, and what crosses is the style alone (`likeOf`: its capture and
  review as a style, its code's look, a Disposable's roll), never its name, date, guests, photos or develop time. Create
  then asks only her name (a Disposable keeps its own screen: the time is hers), a chip under the question says what was
  carried, and Change puts the two style screens back with the album's answers picked. The island puts the cookie down
  as it opens; a read that fails is no like, filed.
- **The cap is a door, not a dead button**, so a host never does the work of an event and only then learns the plan
  cannot hold it: the route computes `atCap` with `enforce_event_limit`'s own math (`profile.event_slots ??
  MAX_EVENTS[tier]`), and the wizard draws the refusal in the room instead of its screens, so New event stays a live
  link. `enforce_event_limit` is the guard behind the door ([billing-caps.md](billing-caps.md)).
- ★ **A route whose post-action refresh must show a success state reads no eligibility live.** A Server Action
  refreshes the route that called it, so after Create `atCap` is true: the wizard route never guards the cap with a
  `redirect` (it would bounce the host before the beat), and the wizard snapshots `atCap` at mount, or the refusal
  would replace the beat (`create-flow.test.tsx` flips the flag).
- **"An email first" is `require_verified_email`**, on by default and free on every tier (a verified email is safer and
  captures a real address); turning it off confirms the consequence through `ConfirmSwitch` (`ui/confirm-switch.tsx`),
  the one primitive for a consequential switch. ★ Letting each person in and the invite list hold it on
  (`events_gate_needs_email`), because both key on a confirmed address, and the switch says why. ★ **A gate that lets
  go gives her names-only back, on every path:** the event remembers a hold (`events.email_held`, written only by the
  `events_email_held` trigger on a write of `gate` or of the step: an address gate that turns the step on from off
  sets it, any other gate gives names-only back and clears it, and her own write of the step clears it, so her word
  from a page loaded before the hold stands when the gate goes), so every door move, the password's first set and
  every device give it back, said from the save's own answer (`set_event_door`'s `email_restored`), never from a later
  read of the hub; a move from one address gate to the other keeps the first hold's memory, and her own step on before
  any gate is never touched. The door page says what an address gate asks of the guests in by name before the move.
  What each side means for a guest, and its enforcement, is [guest-flow.md](guest-flow.md)'s.
- **"A photo first"** (`require_upload_to_view`, off by default, free on every tier) holds the full album until one of
  the guest's own uploads completes, and confirms on its ON edge (`confirmWhen`), the direction that asks something of
  guests. What counts and why it fails open are [guest-flow.md](guest-flow.md)'s; its one read is the service-role-only
  `get_upload_gate` (`lib/db/queries/guest-gate.ts`).
- **The events an account added to are its Guest cards** on the dashboard: every event where it holds a live upload
  (pending, approved or hidden) and is not the host, read from the uploads themselves (`getMyGuestEventCards`, the
  admin client scoped to the account's own rows), so a card leaves with its last live upload and nothing else puts
  another host's event on a dashboard. Each is masked by the album's own door (`lib/dashboard/guest-events.ts`). ★ An
  event that blocked her keeps its card, masked as a private album's, while the block stands (`blocked_events_for`): a
  block moves her uploads to Deleted, and a card that vanished would tell her what the door hides.

## QR codes and print

- **`qr-code-styling` is imported dynamically inside a `useEffect`** (`app/styled-qr.tsx`): it touches `window` on
  construction and would crash the SSR pass. The presets live in `constants/qr-presets.ts` (unknown values resolve to
  `classic`); `StyledQr` draws every code a host sees on a screen, and the designer is the share kit's Customize
  (`qr-designer-dialog.tsx`).
- **Every preset keeps dark data modules on white**; colour only tints the corner finder patterns, because scanners find
  corners by shape, and those tints are deliberate exceptions to the token palette, since existing events keep their
  rendering. Prove a new preset by scanning it on the launch-prep alias.
- **A code's size is set in CSS, never by re-rendering it**: `StyledQr` draws a fixed-pixel SVG from `size` (its
  resolution and baked quiet zone), and every display scales it with one rule (`w-full`, `height: auto`), so a code is
  the same drawing at every width.
- ★ **Whether a code scans is decided by the module, not the code** (`lib/qr/module-floor.ts`): the module count comes
  from the URL's length and the preset's error correction, and the two renderers reserve quiet zones differently. The
  floors are 3px a module on a screen and 0.5mm on paper, and `module-floor.test.ts` runs every shipped size at the
  longest link an event can carry.
- **The print sheet** is `/dashboard/<id>/print`: table cards, a welcome sign, a poster.
- ★ **`(print)` is its own route group, so `AppShell`'s header never prints, and it does NOT inherit the `(app)` auth
  gate**: its layout re-declares `getUser()` and the page re-reads the event through RLS.
- ★ **Zero client JS on the sheet**: its codes are `FooterQr`, the DOM-free server renderer, because client islands
  can lose the race with an open print dialog and an unpainted code prints as a blank square. The cost is the classic
  shape whatever the preset: same data, same scan.
- **Every length is mm and every type size is pt, and there is no `@page` anywhere** (`lib/qr/stock.ts` says why: CSS
  absolute units are physical on paper, and a `@page` cannot be scoped, so a margin for the sheet would re-margin the
  help and legal pages). The print rules sit in globals.css under the one hook `data-print-stock`.

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
  handle refuses it too. A dropped or doubled letter is left alone (folding it would refuse `party-relay`). A link held
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

`/welcome` is a page of its own: the name step when the profile has none, then a short tour while `welcomed_at` is
null, then the create wizard (`welcome-flow.tsx`). The tour quotes the marketing site's how-it-works pictures rather
than redrawing them, so a host's first minute looks like the site that sold them.

- **Shown once, through `profiles.welcomed_at`**: `/dashboard` redirects there while it is null
  (`resolveDashboardEntry`), and a nameless profile is sent there too. Every exit calls `markWelcomed` before
  navigating, or the guard bounces the host straight back; `/welcome` itself gates on neither, or it loops.
- **A guest-made account never takes the tour** (`isGuestFirstVisit`, `lib/welcome.ts`): an account that hosts no live
  event and already holds a Guest card lands on its dashboard, marked welcomed there by `MarkWelcomedOnMount` (a client
  effect, since `after()` in a server component cannot read cookies). ★ **The page counts the cards, never builds
  them** (`countMyGuestEventCards`: the cards' own candidates, `myGuestEventLatest`, counted in the database, so a
  guest-made account's first visit makes no cover request, presign or host read), and reads the viewer from the
  request's cached `getRequestAuth`, never a `getUser()` of its own.

## The event page

`/dashboard/[eventId]` is a hub under the album's own head: the cover with the event's name, its facts, its link and
the live code, a row of cards into the event's rooms, and the album beneath, newest first. Every room opens over the
hub and closes back to it.

- ★ **An event that is gone, never this host's, or not an id at all is the group's not-found, drawn by the page
  itself**, so a foreign event reads exactly as a missing one: on the hub, the reel's old room, See it as a guest and
  the print sheet (Review, Guests and Settings only redirect into the hub, which draws it for them). `getEvent` answers
  a malformed id null before any read (`isUuidShape`), since Postgres refusing the cast throws the page into its error
  screen. Never through `notFound()`: thrown under the hub's `loading.tsx` it lands after the skeleton has streamed
  (the page's comment says why); drawn, it streams into the skeleton's place, titled from
  `(app)/not-found.metadata.ts`, and stays a 200, which nothing behind sign-in reads.
- **The hub and the dashboard home are the wide pages**: each marks its root `data-app-wide` and `AppShell` answers in
  `:has()` (a page cannot hand a prop up to its layout), trading the shell's width cap for the album's gutter so the
  logo, the name, the cards and the album share one left line. Their skeletons mark it too, or the page paints narrow
  and jumps.
- **The head is the guests' cover, hers** (`event-feed/event-hub-head.tsx`'s `HubCover` in the album's own frame,
  `EventHead`, [guest-flow.md](guest-flow.md)): the album's photographs under the name, the date, her guests and views
  and the Live mark, the link, and the code on its mat (`ui/code-mat.tsx`) in the cover's corner, so she sees her party
  as her guests do. Its photographs are the guests' cover's rule (`event-hub-head-stills.ts`, pure, read on both sides):
  the reel's opening stills while it plays (`readHubReel`'s), else the newest a guest can see (approved, never hidden,
  held or a clip), so a still she hides, removes or sends back leaves it the moment the album's store has it. ★ **Its
  foot is where the hub's one light is born** (event-header r6, the Seam made Afterglow's): the cards stand on the
  cover's foot, the photograph runs on under them to its own edge (never dissolving into the page), and the Seam
  (`event-hub-head-light.tsx`, drawn by the row after its footprint) falls from that edge into the page, its reach the
  brand's (120px at a desk, 104 at a tablet, 72 in a hand) in the room, and on paper Aperture's strip of the room (36 or
  30px, wearing `dark`) with the light inside it; the album starts 8px past it. The cover, the row and the light read
  one set of numbers (`event-hub-head-seam.css`: `--hub-rise`, the cards' height and the photograph under them, which
  the foot's padding clears; `--hub-reach`, `--hub-strip`) at the widths the doors change at (640px, 1088px), since
  they are siblings in the hub's `space-y-6` (whose 24px the row and the light take back as `--hub-space`) and cannot
  read each other's box. The hub's cover lifts its own scrim at its foot (overriding the album's `.head-scrim` there)
  so the edge the light is born at is seen, and grows (`min-h`) rather than clips a long name.
- ★ **The Seam's colours are read at runtime, off the crop the eye sees** (`event-hub-head-edge.ts`, pure): each cover
  photograph's preview is read once a page through `decodeImage` (CORS, `no-store`: a tile's plain read poisons the
  cache for a CORS one, [uploads-and-r2.md](uploads-and-r2.md)), drawn 192px wide, and its edge read again from that
  copy at every cover size (the visible crop's last rows, sixth by sixth, at most three hues; a grey sixth borrows a
  neighbour, then the photograph's key), its chroma its own midtones' 95th percentile, inside the room's range. Only
  previews are read (a photograph without one shows its original, megabytes for six rows); the first at once, the rest
  at idle: at most six GETs of about 16KB a hub view, no Vercel, no database. A still not yet read borrows a read
  one's light, the Seam is unlit until the first is read, and a cover with no photograph or none readable wears the
  house's dusk (`HOUSE_LIGHT`); a cover none of whose previews could be read warns once a page (`hub_light_unread`).
  Each light slot is keyed and delayed as `HeadStills`' own, rendered with the cover from the server, so the two
  crossfade on one clock (`head-crossfade`, `HOLD_SEC` held to the cover's by its test).
- **The album's facts are the strip along the cover's foot** (`event-hub-head-strip.tsx`, its maths in
  `event-hub-head-strip-marks.ts`): a mark a photograph in the album's own order, so no shape of event leans on a
  timeline. It reads the page's store: its marks are what the hub's album holds (approved and hidden, never Review's) on
  her own scope, so a photograph waiting for the develop has its mark, and the number it ends in is the counted
  `counts.album`. ★ **Each width of marks (a hand, a tablet, a desk) is in the DOM and a container query on the strip's
  own box picks one**: a count chosen from a measured width would paint a desk's 160 marks into a phone and correct
  itself after hydration. ★ **Lit is photographs landing now**, the newest within a quarter of an hour on the reader's
  clock: one timeout for the moment it turns, never a poll, and never lit in the server's paint or the hydrating
  render (they have no clock of hers). With no store and no `arrivals` it draws a flat quiet line, never a shape it does
  not know.
- **The code stands beside the h1**, never inside it (an h1 holding a control stops being the page's accessible name).
  It wears the door on its corner (`share/event-code-door.tsx`, its words `codeMark` in `visibility-labels.ts`), its
  count of who waits at the door in the needs-you status the cards' badges wear (one token, so the two never disagree),
  and dims where a guest who scans cannot add (paused, Only me). The mark is its own button beside the code's, since
  pressing the code opens the card and asking what a corner means must not, and it sits outside the mat, so nothing
  lands on the modules; the tooltip primitive refuses a tap on purpose, so the mark opens its own words on a tap.
- **The cards row** (Highlight reel, Guests, Review, Settings, then See it as a guest, `AS_GUEST_DOOR`, which is never
  one of `EVENT_ROOMS`, so every drawing that maps the four rooms keeps drawing four) is cards on the cover's foot
  (event-header r4's cards, as r6 drew them): one door element (`room-card-door.tsx`) that is a card at rest and a pill
  under the bar, the same DOM in both. It is a group of links, never tabs, since nothing switches a panel in place: each
  door is the room's real address (`roomHref`), its ordinary press opening the room in place and a modified click a tab
  of its own; a room's code is a chunk of its own, asked for on intent with what the room shows first
  (`share/room-chunks.ts`). ★ **A count that needs her rides its glyph's shoulder** (r6's `card=shoulder`): Review's
  waiting uploads and the people at her door wear a badge in the needs-you status (`--needs-you`, r6's
  `attention=tally`, the code's corner wearing the same token) and the line keeps the word it counts; every other glyph
  is bare and in the ink, the reel's too. Settings' steps left and paused uploads are hers, never a status: a quiet
  badge only where a door has no line (a hand's tile, a pill), `data-hers`. The badge caps at 99+ (`badgeCount`), the
  door's name keeping the whole number ("Review: 140 waiting"), and ticks down on return. ★ Every door is in sight at
  every width, so the row never scrolls sideways: a hand's one row of five tiles (76px), a tablet's five tiles from
  640px (108px, the long names from 740px), a desk's five cards from 1088px (72px); stuck, a hand's five slots sharing
  the band (44px tall), a glyph and its badge to 800px, its word beside them from 800 (124px each), all CSS
  (`room-card.css`) so the server's paint is right at every width. Each door's words are `room-card.ts`'s
  (`reelCardFace`, `guestsCardFace`, `reviewCardFace`, `settingsCardFace`), the page's first paint and the row's live
  counts alike. ★ The row condenses in place (a remount would drop the code chip's `view-transition-name` mid-morph),
  written as one `data-stuck` by the fold (`event-cards-row-fold.ts`: FLIP between two reads taken before the flights
  in the air are cancelled, so a fold reversed mid-flight starts from where each piece is; Review first, its neighbours
  12ms after, the ends last; reduced motion dissolves what stands on the band over 150ms and moves nothing; a first
  report below the bar flips at once), and inside the resting row's footprint (`useStuckBand`), because a band that
  moved the album let scroll anchoring flip it across the threshold and back for ever. Stuck, the band is the bar's own
  material and puts everything back where the cover had it: the cover's face at its left end (and from 1088px its name,
  truncating to its column), the doors in the middle, and, while the head's code is off screen, the code at its right
  end as a pill of the band's material (`ui/code-chip.tsx`, restyled by the row's sheet). The hub's loading skeleton
  draws the row and the light's box in their own classes, so it cannot drift from them.
- **Every room is a place over the hub, one way in and out**: Review, Guests and Settings stand in one panel
  (`share/room-panel.tsx` for the first two, Settings' own kind and head), the share kit, See it as a guest in a phone
  over the dimmed hub (below), and the Highlight reel is a door: the guests' own view at `?reel` ([reel.md](reel.md)),
  its owner's close going Back to the hub, or, while the album's develop time is ahead, her own reel over the hub on the
  hub's own `?reel` (below). The old room routes (`/review`, `/guests`, `/settings`) only redirect to
  `roomHref`, because they are in histories, mails and the sign-in's return (which carries a path, never a query). A
  room's panel names its room on the dialog (`data-room-panel`), so the room's own keys read that panel as their page
  (`review-keys.ts`). The crumb trail is the hub's alone, a context each route sets with `SetCrumbs` (so it lands at
  hydration) and `RouteSkeleton` holds through a `loading.tsx`'s wait (`CrumbsHold`), since the new address commits
  before the page lands (`shared/crumbs.tsx`).
- **Every place rides `?room=`, and it IS the state** (`share/event-share-provider.tsx`, read from `useSearchParams`
  with no mirrored `useState`, so the page a settings action re-renders cannot close the panel). One room handing over
  to another (Settings' door page into Guests and back, a code card's Everything) replaces the entry, so a close always
  lands on the hub; a press on an old way into a room opens it in place (`useRoomLinks`), never through a redirect and
  back. A settings page is `&setting=<page>` on the same entry, moved with `replaceState`, so its back arrow and Back
  never stack entries. The server's `initialSheet` paints the first frame alone; once hydrated the URL is the only
  answer, so a place opened from a link closes like one opened from its card.
- **Nothing in a sheet refreshes the router**: every Settings save re-renders the hub in its action's own answer, the
  reel switch's included (`setReelDefaults` revalidates the hub), because a refresh in flight turns the next tap that
  moves the address into a reload, or drops the refresh (`refresh-then-write-policy.test.ts` keeps it out of the
  sheets). So a Settings page move made while a save is on its way is drawn at once and its address written once the
  save has landed (`settings-state.tsx`'s `afterSaves`).
- **Whose entry a place stands on is `lib/history-entry.ts`'s**, shared by the hub's sheets, a phone's popups, the reel
  and the photo viewer (`?photo=`): opening pushes one marked entry, closing goes Back only over an entry that is ours
  and one Back at a time, and a place opened from a link closes in place. Its header holds what Next does to an entry,
  among it why every native history call hands Next a fresh state object or `null`, never `window.history.state`
  (`history-state-policy.test.ts` refuses the shape).
- **The code card is every share's first surface** (`share/code-card.tsx`: the code, Copy link, the device's own Share
  where it has one, and Everything into the kit, `share/event-share-sheet.tsx`, which holds the downloads, the designer
  and the custom link). Every door to it reads Invite (`share/invite-button.tsx`): the head's code, the sticky band's
  chip, the checklist's code row, Settings' last step and the dashboard card's QR chip. The code is drawn in this one
  sharing surface, so a fix to it lands everywhere.
- **Settings is five steps** (`event-settings/`): Who can get in, What guests can add, The highlight reel and The event,
  each row one sentence (`settingsSentence`, the one home) whose underlined words are live controls (`SettingWord`) and
  whose row opens its own page, then the code. The sentence is the overview and each page the whole control (customize
  r1's `home=words`): a word swaps a choice in place, and an answer only its page can take (a password to set, a roll's
  Another number) opens that page, the roll's at its stepper in focus (`SettingsState.opening`). The rows tick once
  ready, by the checklist's own function (`settingsReadiness`: the server's facts, the album's live counts over them,
  Settings' optimistic values over both, so a step ticks the moment its choice is made). Every control saves itself (no
  form, no Save): `SettingsProvider` lays an optimistic overlay over the server row, a key dropped once the row catches
  up, with a sequence per key so a late answer never undoes a newer choice (a save that throws, a dropped connection,
  settles as a refusal does: put back, freed, said, and `run` never rejects); a text field saves when it is left.
  `/settings` survives as a redirect, because it is a published URL.
- ★ **A date field saves once she has finished it, never on its change**: Chrome's date input fires a complete date on
  every keystroke that makes one (a year typed digit by digit passes 0002, 0020 and 0202 on its way to 2027), so a
  keyboard's edit waits to be left or Entered, a picker's choice saves a beat after the last, the panel's close saves a
  finished one (it leaves the field too), a cleared field only on leaving, and a day outside 1900 to 2100 (`isSaneDay`)
  or a half-filled date never saves, said under the field in words (`event-page.tsx`'s `EventDatesField`; its tests type
  keystroke by keystroke in Chrome's own order). The develop time is finished the same way, by the one hook the two
  share (`useFinishedFields`, `camera-settings-finish.ts`; [disposable-mode.md](disposable-mode.md) for what it writes).
- **A party far from home is one quiet choice under the dates** (`event-settings/party-zone.tsx`, never in Create):
  where the party's zone is hers the row asks "Party in another time zone?" and names none; elsewhere it says whose
  clock ("On Mexico City time · 4:12 PM there now", Change). The choice is a form popup that opens on her own zone and a
  search finding a city, a country or a destination (`zone-places.ts`: each zone said as its city, the other names
  matched by the zone they resolve to, since a browser lists ICU's legacy spellings), each row its city, its clock
  there and the name it answered by; a pick is the one save of the zone. Her browser's answers, so drawn once
  hydrated.
- **A setting with no effect right now stays in view** as one quiet line under the switch that governs it
  (`ui/dormant.tsx`, `inert` while asleep, and its folded side inert too, so the hidden line never takes a tap meant
  for the label above it; the box that folds it clips, so it is padded a halo's reach and pulled back by the same, or
  a control touching it would lose the side of its focus halo that does), and a change that affects people already in
  says so in its own place before it happens (`ui/consequence-line.tsx`). ★ **A save answers for itself:** React's
  canary bundled with Next 16.2.6 can park a revalidating Server Action's commit after a hard load until another
  update, so Settings and the invite list say a save from its own answer and nudge React while its commit has not
  landed (`settings-state-unpark.ts`; the Code hygiene line names its retirement).
- **The QR mini-modal** (`share/event-code-modal.tsx`) takes no URL: a look at the code is a beat, not a destination. It
  grows out of the head's code on the native View Transitions API, name-scoped in `share/share.css`, and exactly one
  of the head's code, the band's chip and the modal carries the name at a time (a duplicate makes the browser skip the
  transition). Its entrance is the one sanctioned hole in the floating-layer contract
  ([design-system.md](design-system.md)): `floatingTransitionEntrance` declares no animation, because the transition
  is the entrance, and falls back to the standard clock under reduced motion. A hidden document never starts one
  (`withMorph`), because it cannot snapshot and every promise the transition hands back would reject.
- **The checklist is one line at the head of the hub** (`event-feed/checklist.tsx`): Ready for guests from the minute
  Create makes the event, with the next thing worth doing said as what it brings and its door beside it (`readyNext`:
  the code's share first, its Invite, then the first photos, then the welcome), Show opening the rest; while a guest
  still needs something the line says that first, ringed. It never leaves under her eyes; it leaves on a later visit
  once nothing is left, from the day after the event's last day (`checklistOver`, on the viewer's day, as
  [dashboard.md](dashboard.md) reads it: an album paused after the party is finished, not unready), or when she
  dismisses it: ★ a dismissal is kept for that event alone, in her browser (`pr_checklist_off` on the event's own
  pages, so the hub's first paint never draws it), and never comes back, since anything that truly needs her says so in
  its own place (the door's corner, Review's count, a paused code). Ready is one pure function
  (`lib/events/readiness.ts`) the checklist, Settings' steps, the Settings card and the dashboard's stage all read,
  never stored and never shown to a guest; ready answers whether a guest who scanned now could get in and add (a door
  she can pass, uploads open, room once the shelf is full), and the code's first open, the first photos and the welcome
  are worth doing, never a gate. Every fact is one the hub already reads (the code's first open is the header's Views
  number; the first photos ride the album store's live counts, `useLiveReadyFacts`; the door's line at a Public or
  password door is Settings' own sentence, `doorGuestLine`, from the identity step and the photo first the page hands
  over, so the list never says a guest walks in where Settings says she confirms an email). Under it an empty album
  says "The album starts with you", Add the first photos its one door (her own uploader, `event-uploads.tsx`), and a
  held-only album says "Everything's in Review", since it is full, not empty.
- **The hub is live: an upload lands while the host looks, and nothing refreshes the page.** The album is the page's
  store (`event-feed/host-album.tsx`, its pure half `lib/event/hub-album.ts`), seeded with the host's first sync and
  its validator, and moved by `sync()` on the album's doorbell, a fallback poll and each write's catch-up; the host's
  version answers every question (`/api/album/host/<id>/sync`: a 304 that read one row, a delta by id, a manifest past
  500 changes or below the log's watermark). The poll stays beside the socket: the doorbell (`notify_gallery_change`)
  rings only when what a guest sees or what waits moved, so a host-only move (a hidden row removed or restored), and
  any move while the socket is down, reaches the store by the poll alone. The album's writes never revalidate the hub:
  each asks the store to catch up. `HostMediaGrid` marks arrivals by diffing ids, never links (they roll every half hour), and the guest
  album's own gate lets an arrival into the rows (`shared/use-arrival-gate.ts`, [guest-flow.md](guest-flow.md)), asking
  for its link itself (`HubRows.onNeedLinks`), which the delta's own carry answers (next).
- ★ **A batch is one call on the hub, as on the guest's album** ([guest-flow.md](guest-flow.md)'s carry): the delta
  carries its APPROVED arrivals' links and their like counts (`hostCarriedIds`, newest first, at most
  `ALBUM_DELTA_LINKS_MAX`, minted by `readHostLinksBody`, the links route's own builder), and the hub's transport
  answers the link store's ask for them itself (`events/album-wire-carry.ts`; it sits UNDER `seedingTransport`, so a
  carried link's count reaches `likeCounts` like any links answer's). A held upload carries none (Review asks its
  queue's links by id when it opens) and neither does a hidden one (the host's own Hide is an upsert whose tile already
  holds its link), so a moderated party's arrivals and every Hide cost only the delta; a failed carry is reported and
  the arrival asks the links route, as it always did. An approval or a Show of an item the hub already holds carries a
  link it will not use: bounded by the screenful, and the price of the server not knowing what the hub holds.
- **The hub's album is the paged album, and its numbers are counted**: the page plans the host's first sync (every
  item but the bin, each status in its flags) and mints links for the newest window (`FIRST_WINDOW`,
  `readHostLinksBody`, which also carries each item's like count, a host-only figure); the windowed rows ask for the
  rest by id, and its link store starts at the seed's attribution (`createHubAlbum`), so the first poll of an album
  whose attribution moved never re-asks the first window's links. Every number is counted in the version's snapshot
  (approved plus hidden, and pending), never a list's length, since no list holds the whole album. The `live` slice is
  Download all's ([uploads-and-r2.md](uploads-and-r2.md)).
- **The album** (`event-feed/event-gallery.tsx`) carries Add photos, Download all, Select and one View menu, which
  always renders so an empty album still reaches the bin. The bin is the paged album's shape (`lib/event/bin.ts`):
  choosing Deleted reads its list again (`/api/events/<id>/bin`: ids, shapes and countdowns, no links) so what was
  just deleted is there, its rows mint links per window (`bin/media`) and re-mint them while it is open, and bin items
  never count in the album. Restore (at once) and Delete permanently (behind a confirm) are one `useBinActions` for the
  tile's pane and the viewer. An arrival out of her sight wears the album's pill under the stuck band
  (`event-gallery-news.ts`; [guest-flow.md](guest-flow.md)'s arrival grammar).
- **The View menu** (`shared/view-menu.tsx`) holds Tile size (the rows' density steps, also a pinch, ctrl and the
  wheel, kept in the per-device `pr_tile_size` cookie the hub paints with, since localStorage would repaint after
  hydration), Sort (Newest or Oldest first, reset each visit) and Filter (All, Deleted).
- **SSR'd surfaces paint native `title` only**, never a radix Tooltip in the server's paint (the hydration trap in
  [architecture.md](architecture.md)): a rich tooltip mounts there only after hydration (`useHydrated`: the bulk bar,
  the code's mark, the head's glyph counts).

## See it as a guest

Her album exactly as a let-in guest meets it, opened from her hub on `?room=as-guest` (`share/as-guest-stage.tsx`): a
phone over the dimmed hub at a desk, the whole screen in a hand, closing onto the hub as she left it.

- **The phone holds a page of its own, never the guest page** (`/dashboard/<id>/as-guest`, framed with `?in=hub`;
  "Open it in a new tab" opens it bare). On the guest page her session is the owner (no door, her own uploads hers to
  delete, the reel's host extras), and the guest page's layout reads a real phone's viewport, which a narrow box in the
  hub's own page could never be. ★ It is a route group of its own, `(as-guest)`, so a guest's phone never wears the
  host's shell, and like `(print)` it inherits no gate: its layout re-declares `getUser()` and the page proves the
  event through RLS. A signed-out visit signs in to the dashboard (the return carries allow-listed shapes alone).
- ★ **The read is a let-in guest's, never the owner's** (`as-guest.server.ts`, pinned end to end in
  `as-guest.server.test.ts`): `getEvent` (RLS) first, then the door's own resolution (`pageDoor`, which lets her
  through as the host and issues its pass, the proof a gated album's reads ask for), then the guests' own seed loader
  (`streamGallerySeed`: the service role, approved and unsealed only, so no held, hidden or sealed shot reaches it
  whoever asks), decided for a guest past every step (`letInGuestDecision`, `isOwner` false). Nothing of hers rides
  it (no list of her own uploads, no follow card), the pass is stripped before the view, and it writes nothing: no
  visit counted (her Views would count her own look), no ticket read or minted, no claim. The one write under it is
  the develop a guest's first read runs when one is due. At Only me it is the shut door, as every guest meets it, and
  reads nothing.
- ★ **A look, never a door** (`share/as-guest-view.tsx`): the guest page's own pieces in its order, the whole of it
  `inert`, so nothing pressed there writes as a guest, and none of the guest page's hands mounted (the door, the
  upload queue, the keep, the claims, the tracker, the reel's controller). Its album opens in the order every guest
  meets (`readAsGuest`'s `albumOrder`, the turn read in the party's zone and handed on as an instant), and Sort answers
  nothing there, since a choice would write a guest's remembered order on her own device. Its cover counts as the
  guest's does: named by kind from the first byte (`stats.kinds`, the guest page's own), then in the live album's own words.

## The door, the host's side

Who can get in is one door of six (`lib/event/door/door.ts`; what a guest meets is [guest-flow.md](guest-flow.md)'s),
set on its own settings page in the order a guest meets it: (1) Public, Private or Only me; (2) Private's gate: a
password, you let each person in, your invite list, only people already in; (3) An email first; (4) A photo first.
Every word lives in `lib/events/visibility-labels.ts` (`doorLabel` for the hub). The host keeps the words "Only me",
so the profile's visitor-facing "Private" never collides. The six-door menu is `settings-rows.tsx`'s
`doorConsequence`; `door-page.tsx` is the steps page.

- ★ **`set_event_door` is the one writer of the pair** (`setEventDoorAction` re-verifies with `getUser()`). A move
  that changes things for people already in or waiting (Only me with guests in; Public, only people already in or a
  password with newcomers waiting) says what happens first and waits for the confirm; a first password says it at its
  field, before she types, a line a group (`passwordGroups`: the guests in stay in on every phone, the people at the
  door stop waiting on her and get in with it), in place of the gates' inside note. Opening an album to Public lets
  everyone waiting in but an ask a block holds (`events_door_opened`, reading the one set `event_door_asks`), so a
  declined newcomer waits through a Public trip for the host's Let in rather than walking into an album its host never
  let her into; a password ends every ask (`events_door_to_password`, [guest-flow.md](guest-flow.md)), so those asks
  leave At the door, the dashboard and the bell.
- ★ **The Guests room is one read, after `getEvent` has proved the host** (`guests/room.server.ts`: the door's lists are
  the service role's, and a confirmed guest's address and what each person added re-prove the host inside their own
  reads, `guest-addresses.ts` and `guest-look.ts`). The hub's render reads it whenever
  the address names the room, and the room's own ask (`readGuestsRoomAction`) when a card opens it in place; the panel
  draws the newer of the two, and a read that fails says so with Try again, never an empty room. ★ A sealed album's list
  is empty while its roll is shot (a guest joins it at the develop), so the read carries `waiting`, the shots the seal
  holds, and the room says "N shots are developing" in the list's place, never "Nobody has added photos yet" (a room
  holding a roll is not empty: Invite stays its quiet action). The hub's Guests card says the same (`guestsCardFace`:
  who waits at the door first, then "N shots developing" while the list is empty only for the seal, else the guests),
  from `countWaitingGuestShots`, which the hub reads only while a develop time is ahead (`hubCovered`), after
  `getEvent`, and never worth the page (a failed read leaves the guests' count, captured).
- **Every person in the room is one calm row** (guests-room r1, `rows=list`: a face, the name, one line of how they
  stand, at most one act at its end; `guests/room-rows.tsx`), and every name opens the person's card (`card=standing`,
  [profiles-social.md](profiles-social.md)), which for the host adds how they stand tonight and its act. The guests who
  added lead with what they added as a column, who added most first (the one count heads them, GUESTS), eight then a
  page of 24; the read's `added` is each listed person's approved, visible uploads by kind and since when, counted on
  her own RLS read with the tickets grouped as the one count groups them. ★ Someone past the door with nothing the
  album shows (let in at the door, or joined and added nothing) is no guest by the one count, so the head leaves them
  out, but the room holds them in a quiet fold at the guests' foot (`quiet`) until a photograph of theirs lands. The
  room reads the host's own relations among the people it lists (`readHostRelations`) for the card's Follow.
- **The Guests room's At the door** heads it, its count in the tally (`--needs-you`, the hub's Guests card's light):
  each row's one act is Let in (`let_in_at_door`), which opens her door on every device, and her held door opens by
  itself at its next check-in (at Only me the toast says she meets the album closed instead). ★ Decline lives in her
  card (the name opens it, Decline beside Let in and what a decline is), so each row keeps one act; Decline is a block
  (the account where there is one, else the row), so a declined newcomer meets the one shut screen and cannot keep
  re-asking. Her ask stands under the block, so the way back answers it: Let in, on the decline's own
  toast and on her Blocked row, lifts the block and lets her in on every device she asked from in one call
  (`let_back_in`'s `p_let_in`, 20261007020000; one press on the row unless a restore can be chosen or the album is Only
  me, whose confirm says so first). A newcomer whose ask ended (a password) gets Let back in, and its words say where she
  lands; every landing is `BlockedPerson.lands`, read from the door as it stands, once for the whole Blocked list, and
  every Let in says what its answer says (`admitted`: one let in by nobody promises nothing past the lifted block). A
  waiting newcomer counts on the hub's Guests card, the dashboard and the bell, and sends no mail.
- **Invited**: one field takes a typed address or a pasted list (`readAddresses`: the readable saved at once and
  counted by the database, the unreadable kept as flagged chips), capped at `INVITE_LIST_CAP`; each address reads
  Joined or Not yet, since it matches only once its guest confirms it, so removing one never puts out someone it let
  in. While the list is the door, a waiting person it names is in (`event_door_admit_listed`): the listing, the door
  becoming the list and Let back in each let her in, on every device she asked from, counted once. The menu and the
  steps page say so before the list is chosen, only where it would let someone in (`listedWouldComeInLine`, counted by
  `event_door_waiting_listed`, the admit's read-only twin: [database-security.md](database-security.md)). Invite is the
  room's main action while it is empty: the event's code card, sending nothing. ★ A list nobody is on, under a door
  that is not the list, sleeps: one quiet line says what the list does and what wakes it (`ui/dormant.tsx`, no field,
  the door's page one link away), and a list that holds addresses stays awake under any door, since they are hers to
  see and to remove. Its rows lead with who has not joined, each beside an empty seat, and the joined fold into one
  row that opens them with the face the room holds for each.

## Moderation and curation (host side)

`media.status` is `pending | approved | hidden | removed`; `create_media` sets pending or approved from the event's
`moderation_mode`.

- **The Review room stands over the hub and reads its queue off the hub's own album** (`review-room.tsx`'s
  `ReviewRoomFromHub`): the uploads the manifest holds waiting, newest first, their tiles minted by the host's links
  route by id with each one's credit (never the whole album's attribution), so opening Review asks for the queue's
  links and nothing else. The queue is seeded once, whole: the room ranks what it is first handed and holds anything a
  later render brings behind its line, so it mounts once the queue's links are in, and a queue none of whose links
  came back says so with Try again, never "all caught up". Its states live in `use-review-triage.ts`, its pure rules in
  `review-queue.ts`, its grid is the shared `SelectableMediaGrid`. Over the queue sits one line of advice, "Anything
  you approve can still be hidden later." (`REVIEW_NOTE`), so a host leans toward approve-and-hide over reject.
- **The refusing verb is Reject at the door, Hide in the album**: a rejected upload lands `hidden` (dimmed in the host's
  album, where Show approves it), the same row a Hide leaves; only the word differs. A tap opens the peek, which carries
  the verdict (Reject, Approve) and moves on to the next upload once one is decided. The keys are `review-keys.ts`'s
  (arrows, Enter approves, Backspace or Delete rejects, Space peeks): they act only on a tile, in the peek, or with
  nothing focused in the room's own place, never on another control and never as a verdict on a selection.
- **The bulk controls live once, in the room's header, in both modes** (`review-actions.tsx`), which never goes empty,
  or a host mid-selection loses Reject, Approve and Cancel. Approve all needs no confirm: it sends the queue's own ids
  through `approveBulkAction` in consecutive batches of `MAX_BULK_ITEMS`, so a host approves exactly what they saw, at
  any size. A verdict never waits on another: only an upload whose own verdict is in the air refuses a second press.
- **Every verdict's toast carries Undo** (`shared/undo-toast.ts`, the product's one Undo). Undo puts the uploads back
  in place, then `returnToReviewAction` returns them to `pending` from the state that verdict left (`returnToReview`,
  scoped to it), refused once the event stopped reviewing. Review's verbs revalidate nothing, because a revalidating
  action refreshes the route that called it, which re-ran the room's page per key.
- **The room is live, on the hub's own signal**: it stands inside the hub's `HostAlbumProvider` and `review-live.ts`
  reads the queue off it, so an arrival reaches the room when it reaches the hub's Review card. An arrival never joins
  the grid on its own: a pill over the grid's head counts it and a tap folds it in, so no tile moves under the host's
  hand. An upload decided elsewhere or taken back leaves the grid; one the room acted on keeps its own write as its
  truth only until the album has answered the catch-up the room asks for once the write lands (`OwnWrites`,
  `review-queue.ts`), and from then on the album speaks for it again.
- **Turning moderation off with a queue** says the count first, and on save `approveAllPending` runs: the host's consent is
  Settings' note under "Straight into the album" ("The 3 photos under review appear at once"), the server the invariant
  (live mode never holds pending media). ★ The note's count is the album's LIVE one, the number the hub's Review door
  shows beside the open sheet (`SettingsProvider` reads `useHubCounts`, the prop being the first paint's and the fallback
  where no album store stands), never the page load's: photographs that reached Review after the sheet opened used to be
  published under "Everyone sees it the moment it lands" (red-team 58's LOW).
- **Clearing the last pending item plays the beat**, which preloads the just-approved photographs: their stable
  presigned URLs recur byte-identical in the album ([uploads-and-r2.md](uploads-and-r2.md)), so it paints from cache.
- **The review pair `approveBulk` and `hideBulk` are scoped to `status='pending'`**, so a crafted call cannot flip
  other media; Undo's `returnToReview` is scoped to the state its verdict left.
- **Remove is soft** (`status='removed'` and `removed_at`): it moves to Deleted, which still counts in her storage until
  it leaves for good ([lifecycle-recovery.md](lifecycle-recovery.md)).
- **The host's tile verbs are three: like, download, hide/show** (one slot whose glyph swaps in place; the pane is
  [design-system.md](design-system.md)'s album tile). Delete is not a tile verb, because a verb revealed over a dense
  grid is a misclick trap and Delete is the consequential one: it lives in the viewer and bulk select, approval in
  Review.
- **The viewer's pill groups "enjoy | curate"**, the curate group gated on `viewerIsHost && onSetStatus`, so the
  guest's pill is behaviour-identical; Remove confirms, the rest act directly. The tile row and the viewer share one
  `useModeration` hook (`host-media-grid.tsx`) over one `useOptimistic` list.
- **Album bulk select** opens from Select or a long press (`use-long-press.ts`) and runs on the one grid through
  `selection` (no second grid, no remount: a toggle re-renders one tile); the header's action slot becomes the shared
  `BulkBar`, and select-all takes every manifest id, mounted or not. The selection lives in a thin
  `HostSelectionProvider`, into which the album grid (owner of the optimistic items) registers its handlers, so the bar
  calls `selection.run(kind)`: the seam whenever a control surface and its grid live in different subtrees. The
  selection prunes to the surviving ids when the album changes, never resets (`useSelection`), so a poll never wipes a
  selection in progress.
- **Bulk Like is one `like_many` call a batch under one summary toast** (the refused ids reverted, what it added
  named by kind through `formatKindCount`); Hide, Show and Delete are the general `setMediaStatusBulk` and
  `removeMediaBulk` (plain RLS, no pending predicate).
- ★ **Every bulk action refuses more than `MAX_BULK_ITEMS`** (`lib/event/bulk-selection.ts`: a Server Function is a
  public endpoint, and one that loops over any list it is handed is a work amplifier), and every bulk write, and
  Delete forever's reads, send the selection through `inChunks`, since an `.in('id', …)` over a big selection outgrows
  the URL and fails whole. A bigger selection goes in consecutive batches at the cap (`inBulkBatches`, and
  `likeManyInBatches` for Like): Review's verdicts and their Undo, and the album's Hide, Show, Delete and Like.
- **Host upload**: the album header's Add photos toggles a dropzone panel (`host-upload.tsx`) straight into the album,
  and the reel card's opens the same panel and scrolls it into view (`HostAddProvider.openAdd`); its pipeline is
  [uploads-and-r2.md](uploads-and-r2.md)'s. A drained batch asks the album's store once (`onBatchLanded`), never
  refreshes the router: the store brings the batch as a delta, where a refresh re-ran every read and presign on the
  hub. A row going up (or waiting its turn) has an x that asks in the row ("Stop this upload?", Keep going first) and
  stops that file alone through its own signal; its siblings land and are recorded together, and the stopped row reads
  "Upload cancelled." with Try again (a Ban mark, muted, never the failure's red or its Retry) and counts nothing. A row
  whose bytes are up has no x (its complete is coming; its way out is the album's Remove).
- ★ **Block puts one person out of one event, with their uploads** (`block_from_event` on the host's own client, free
  on every plan). It is the quiet last line of every person's look (a name in the Guests room, the uploader's credit in
  the host's viewer and on Review's peek, `event-blocks/`), opening one confirm whose count is the act's own preview
  and which offers An email first, off, on a names-only album. It keys on the account, the confirmed address or the
  guest row, never a device or an IP, so a typed name is held on the phone that used it. Their live uploads move to
  Deleted in the same step as the host's own removal (a held one stays, as every host write leaves it). The Guests
  room's foot lists the blocks with their way back (`let_back_in`: Let in for a newcomer whose ask stands, above, Let
  back in for anyone else), whose restore is off unless the host turns it on and brings back only what this block
  removed and still waits in Deleted, to the status each had, newest first within the cap. What the person meets is
  [guest-flow.md](guest-flow.md)'s.

## The highlight reel, the host's side

The Reel card, the band's reel step, the old route's redirect, Settings' Highlight reel section and the card's door into
the guests' album at `?reel` are [reel.md](reel.md)'s, with the rest of the reel and the clip. What the hub owes it: the
card rides the cards row (the Highlight reel is a door, never a room), its threshold reads the album's manifest
(`isPlayableEntry`), and it is a plain card among the doors: its state and count follow the album live and Settings'
switch wins (it holds no face of its own), and it draws no stills (the reel's take, planned on the server by
`readHubReel` on her own scope, is the cover's and Settings' alone). ★ **The card is hers before the develop** (Will's
Q5): it says guests get it later, and a press plays her own reel over the hub (`event-feed/hub-reel.tsx`, mounted inside
the album's store: a reel outside it never finds its manifest), while the head, its band and the album's cover stay her
guests' view; after the develop a press opens the guests' view.
