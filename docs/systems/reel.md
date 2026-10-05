# The highlight reel and the clip

Open this before you:
- change the live reel: when it exists, what it plays, its take, the cover's play button, the view or the screen;
- change the event's reel defaults (the switch, the look, the hold) or the platform lever;
- change the clip creator, what a clip may do, or how a clip reaches the album;
- change a word the reel or a clip says anywhere.

Elsewhere: the event page whose cover is the reel's face ([guest-flow.md](guest-flow.md)), the host's hub around the
Reel card ([host-app.md](host-app.md)), the upload pipeline a clip rides into the album
([uploads-and-r2.md](uploads-and-r2.md)), what a clip costs ([billing-caps.md](billing-caps.md)), the admin portal's
switches ([admin-observability.md](admin-observability.md)), the marketing story
([marketing-content.md](marketing-content.md)).

## The model

- **The highlight reel belongs to the event.** It is alive from the album's second approved, reel-eligible item: a
  looping montage of what the album shows. Its face is the album's cover; its full screen is a view that is also the
  screen for a party wall. Uploads splice in and hides drop out; it needs no host action and leaves no file, so
  nothing downloads it. It obeys the album's gate, and it starts on the event's default mood and hold, which any viewer
  can change on their own device.
- **A clip is the viewer's own.** Anyone with full album access starts one from the reel with Make your own, picks
  moments, a look, a layout and a length, and their device renders it to save or share as a file that is never stored.
  On a paid event Add to event puts it in the album as an ordinary video, metered and moderated like any upload, which
  the reel never plays.
- **The levers are the clip's, never the reel's.** A free event's clips carry a small mark and paid events' none; all
  run up to `MAX_REEL_SECONDS` (60 s on every tier, kept per tier so the lever survives). The live reel and the screen carry no mark
  and no cap on any plan, and making a clip is free on every plan at full quality.
- **Curated randomness, never a timeline**: a look is a kit the seed samples deterministically, so the player and the
  encoder draw the same frames by construction. No music and no beat-sync (music is too personal to guess, and people
  add their own where they post), and nothing reel-made carries an end card.
- **The names are Will's**: "Highlight reel", "clip", "Make your own", "Add to event". A clip is never a "cut", and a
  video upload is never a "clip" in product copy. The reel and clips carry no telemetry in v1
  ([notifications-analytics-growth.md](notifications-analytics-growth.md)).

## The facts on the payload

The reel stores nothing, so the server says only WHETHER a viewer's album has one and what only it may decide.
- **`loadGalleryReel(event, access)`** ([`gallery-access.server.ts`](../../src/lib/events/gallery-access.server.ts))
  answers `null` short of `full` access (nothing is read), else `GalleryReel`
  ([`gallery-reel.ts`](../../src/lib/events/gallery-reel.ts)): the host's switch (`events.show_reel`), mood
  (`reel_style_id`) and hold (`reel_hold_sec`, NULL until a host sets it, read through `resolveHoldSec`), the platform
  lever (`ops_flags.live_reel_enabled`) and the creator's `ClipFacts` (`videoAllowed`, `watermark`, `maxSeconds`),
  tier-derived on the server and never on the client, `null` when the host's tier could not be read (the reel stays,
  the creator is not offered). `getLiveReelServerFacts` reads the lever and the tier on the admin client (`ops_flags` is
  deny-all), cached 30 s per event, each failed read reported. The page and every poll's 200 carry it, and the ETag
  hashes it.
- ★ **It exists from the second item, and below it there is nothing** (`LIVE_REEL_MINIMUM`, `liveReelAvailable`, the
  one number the host's side reads too). It counts approved, `reelEligible` items with something to draw; a clip
  (`reel_eligible` false, written once by `create_media*`, outside the ETag like the dimensions) never counts and never
  plays. Below two, with the switch or the lever off, or behind a door, there is no play button (the cover's, the
  shutter's), no view and no `?reel`: the host reaches the reel by adding the album's first two photos, so the view has
  no empty state of its own (a `?reel` below the minimum is dropped quietly and a phone's view whose album drops under
  two returns to the album). The owner's reel on this page is exactly a guest's (the page is the guests' view, hers
  included, so before the develop it has no reel for her either: the host's side plays hers over her hub). It plays the
  SERVER's approved list: the manifest's
  drawable entries (`reelItems`, no links, never an optimistic blob), a clip's links read by id through the provider's
  resolver (`clips`) about two windows ahead (`createClipSource`); the demo plays its optimistic tiles too, since its
  uploads never reach a server.
- ★ **The welcome comes first, everywhere**: a visitor who still owes the door meets it with no reel under it or over
  it, for `?reel` and `?reel=screen` alike, and the moment they are through the reel their link asked for opens
  (EntryModal's `onPendingChange`, reported once hydrated; owed until that first report). The owner never owes it and
  gets the reel at once, which is why a venue screen signs in as the host. A `?reel` that cannot play is dropped only
  once the door is behind the visitor.

## The take

- **One seeded order of the whole album per loop** ([`live/take.ts`](../../src/lib/reel/live/take.ts)): the quick-add
  brain run pass after pass over what is not yet placed, each pass shuffled on the loop's seed and de-clumped, so no
  guest appears twice before every guest has once, a video lands early and the newest are in the first pass. A new take
  every loop, the same take for everyone on that loop; the MOTION seed is the session's, so a clip carried across a loop
  boundary keeps its pan and zoom. After a guest's first upload their own device leads with it.
- **Likes do not reach it**: the guest payload carries no counts, so the brain's likes term is zero on every guest
  surface.
- ★ **The take is O(n log n)**: the brain scores the album once a loop (`quickAddScores`) and the passes walk
  that order (6,000 items about 5 ms, down from about 610 ms when it re-scored on every pass). The hub's card
  still plans over a spread of the album (`TAKE_POOL`), and the cover's six stills, while the album has a reel, are
  the take's first pass, its head alone (`passes: 1`, `tileStills` in
  [`reel-tile.ts`](../../src/lib/guest/reel-tile.ts)), never the album's newest, which sit right beneath it.
  ★ **They are dealt once and kept while they play** (`keepStills`, `useCoverStills`): the first pass is a seeded
  shuffle of the whole album, so one arrival used to change nearly all six, swapping the cover under the viewer and
  sending for the new stills' links, a call behind every delta. An arrival now changes nothing; a still the album loses
  gives its place to the take's next, her own newest upload leads her cover, and a reload deals afresh. Below the
  reel's minimum (the newest-six rule) nothing is kept: each arrival is its own new still, and its link rides the
  delta. ★ **The six's links are asked for again whenever the album moves** (free while fresh, a re-mint once aged):
  the link store keeps lit only the ids it was recently asked for (600), so a kept cover that fell out of them would
  lose its pictures when their presigns died, which the old re-deal on every arrival had been healing by accident.

## The cover, the view and the screen (the guest's side)

- **The reel's face is the album's cover** ([guest-flow.md](guest-flow.md)'s album head; nothing stands above the
  album): `reel/live-reel.tsx`'s controller publishes the take's opening stills and the reel's door to the head, whose
  round play button opens it, as the shutter's right-hand round does deep in the album.
- **The view** ([`reel/live-reel-view.tsx`](../../src/components/guest/reel/live-reel-view.tsx), `React.lazy`, ONE
  import promise shared by the warm-up and the lazy boundary) is a full-bleed Radix dialog over the player in `fill`,
  following the viewport's orientation. ★ **HELD INSIDE THE OVERLAY, THE PAGE'S SCROLL LOCK**: Radix locks the page
  in the Overlay (its `RemoveScroll`, which also takes the desk's scrollbar away), never in Content, so a view with
  no Overlay would leave the album scrolling under it; the view sits inside it, which keeps its portaled Style and
  Hold menus inside the lock too, each still scrolling on its own. ★ **In a landscape composition every mood fills the frame edge to edge**
  (`fillLandscape`, `lib/reel/live/window.ts`): a laptop or a wall is where the reel must fill the room, so Cinematic's
  bars and Editorial's inset card are set aside and a mismatched photograph stays whole on its own darkened blur.
  ★ **`?reel` is its address** ([`reel-url.ts`](../../src/lib/guest/reel-url.ts)): opening PUSHES an entry marked in its
  own history state (`prReelPushed`), so a phone's back gesture closes it; closing a pushed entry goes back and closing a
  deep link REPLACES the address, so closing never leaves the page. Whose entry it is stands on `lib/history-entry.ts`
  (shared with the hub's sheets and a phone's popups): a `router.refresh()` takes the marker off, so the page keeps its
  own word and gives the entry its marker back, and a close after a refresh or a reload still goes Back, once, however
  many times the X is tapped. Only the `reel` segment is touched, never a re-serialised query. ★ A page that
  arrives by a soft navigation (the hub's Reel card is a `<Link>`) RENDERS against the address it is leaving, since Next
  writes the new one in that commit: `useReelParam().mode` is right a pass late there, so what is told to another
  component or acted on for good reads `reelOfAddress()` when it acts, never a render's copy (the album's word to the
  head, `viewAsked`, is the one that matters: the curtain stands on it, the owner's and a returning guest's).
  - **The chrome**: a slim glass bar at rest (play and progress) that pointer movement, or a press on the bar, grows
    into the dock (a `clip-path` morph, [`live-reel.css`](../../src/components/guest/reel/live-reel.css), instant under
    reduced motion); it settles back on its own (2.4 s after a pointer, 4.2 s after a touch), never while paused,
    under reduced motion, with a menu open or with a key's focus in it (`:focus-visible`: a press leaves its control
    focused, and that must not hold the dock up). Every control has a tooltip, and a menu key's open fill reads
    `aria-expanded`: the tooltip wrapping the menu's trigger on one button overrides its `data-state` ("closed").
    - ★ **A click or tap anywhere on the picture is the bar's own press, and the next one puts the dock away: the
      picture never opens the photo viewer** (a tap is a viewer reaching for the controls, and a viewer opened by it
      is a second layer between her and them). One toggle, `toggleChrome`, serves the bar, the timeline and the
      picture. The picture is a SIBLING of every control, never their ancestor, so a press on a control acts on that
      control and never reaches it (keep the handler on the picture, never up on the view); a press that begins over
      an open menu only dismisses it; while the screen's pill is up, a press anywhere is the pill's alone.
    - ★ **A pointer's click within 600 ms of the move that raised the dock keeps it up** (`AIMED_CLICK_MS`): a desk
      viewer moves to aim, the move wakes the dock, and the click that follows meant "show". A finger's tap and a
      key's press never moved anything, so they are never held.
    - ★ **Focus moves to the view when its half of the pane goes quiet**: the dock's controls at rest and the bar
      while the dock is up are `inert`, which drops their focus onto `body`, where Space and the arrows stop reaching
      the view, so the commit that quiets a half puts the focus on the view.
  - **The dock**: one row of icon buttons (play/pause, Include videos, Style, Hold, Show the code from 1024px, Add
    yours), then "Make your own" as the single primary, only with a creator. Space pauses, Escape closes, the arrows
    step a moment (the player's `step`; the clock never moves), and any other key brings the controls up.
  - **The owner's extras**: at 1024px and up Play on a screen opens `?reel=screen` in a new tab; the Style list's
    footer reads "Only on this device, for now" with Set for everyone (`setReelDefaults`, below), and "Everyone sees
    this look" once they match; Close goes back where the host came from when there is history, else to the album.
  - **The viewer's own knobs, on this device** ([`reel-prefs.ts`](../../src/lib/guest/reel-prefs.ts), `localStorage`,
    never on the wire): Hold (per event, defaulting to the host's, converted into the mood's `holdScale`), Style (per
    event, the eight moods), Include videos (across events, on unless `saveData` says otherwise). A look or hold this
    device never set follows the event's as a poll brings a new one, at the next hold with no reload, so Set for
    everyone reaches a screen already playing; the device's own pick always wins.
  - **The arrivals** ([`arrival-feed.ts`](../../src/lib/guest/arrival-feed.ts)): a fresh upload names its uploader top
    left for one hold; a burst stacks into a short feed of limited depth that collapses ("Theo +12").
  - **The code** (Show the code): a white plate bottom right, the event's QR in the host's preset, "Scan to add yours"
    and the readable address. No event name on screen.
  - Reduced motion holds the first frame with the dock up. The loop never announces its seam. Twelve failed frames or
    stills send ONE Sentry report per view ("live reel: frames failing"), and every failure feeds the provider's
    watchdog, which re-mints only the failing ids.
  - **Video** plays as motion, silent, decoded on the viewer's device from a byte-range window of the original
    ([`engine/video/window-reader.ts`](../../src/lib/reel/engine/video/window-reader.ts)); every failure is the poster.
    Nothing is transcoded or stored.
- ★ **The view is the wall: `?reel=screen`** is the same view in its screen posture: the reel plays at once with the
  code on, under a glass pill, "Press anywhere to fill the screen". The press (anywhere, the pill included) takes
  fullscreen where the platform allows and the wake lock ([`screen-posture.ts`](../../src/lib/guest/screen-posture.ts)),
  re-taken on every return to visible and released only when the view closes; leaving fullscreen never pauses the reel
  or lets go of the lock. With no fullscreen the pill asks to keep the screen awake. Under reduced motion the window holds
  its first frame until the press. A screen whose album drops under two shows the code and the address alone until the
  reel returns.
- ★ **Nothing about review ever shows on a reel or a screen**: a room watching never sees the host's queue.
- **The approval toast** (moderated events only): once per visit, when the first of her held uploads shows up
  approved while the reel is showing, "One of yours is in the album" with "Watch reel" — singular and true on that
  first approval alone, since another of the same pick can still be left out. No numbers; never for a clip; never
  over the door (it waits, unspent, while the welcome is owed). Two sources name her held uploads: this device's
  queue, and the server's news her tracker's read answers (what a decision let in since she was last told,
  [guest-flow.md](guest-flow.md)), so an upload approved after the visit that made it is told on the next, once.

## The host's side

A host has no reel to create, only a state to read and a few defaults to set.
- ★ **One state, three answers** ([`event/reel-progress.ts`](../../src/lib/event/reel-progress.ts)): `off` (the switch
  or the lever), `counting` (fewer than two items that can play), `live`. The Reel card, the dashboard's item and the
  old route's redirect all read it, and "can play" is the guest's own `isReelEligible`, so the card flips on the photo
  that makes the guest's play button appear. The dashboard asks the same in SQL (`getReelProgress`: one row per event,
  at most two media embedded).
- **The Reel card counts to two** ([`event-feed/reel-card.tsx`](../../src/components/app/event-feed/reel-card.tsx)):
  dashed at none ("Starts at 2 photos"), the one photo under an overlay at one, then the living card ("Live for guests",
  or "Guests get it later" while the album's develop time is ahead, since no guest sees a photograph before it; the page
  hands `developsAt`, and the card turns the moment it comes) dissolving through the reel's own take. The take is
  planned on her own scope, sealed shots included: the card is hers from the first photograph, while the head, its band
  and the album's cover still wear her guests' view. Before two a press opens guidance (what is left, Add photos, and on
  a moderated event that a guest's photo counts once approved); from two it opens `/e/<token>?reel`, where the owner
  passes every gate (a soft navigation, kept one: a plain press asks for the view's lazy chunk at once, so it lands
  inside the album's server render and the curtain's black is a beat, [guest-flow.md](guest-flow.md)), or, while the
  develop is ahead, plays her own reel over the hub (next); off, it opens Settings. The dashboard's item for an event
  on its day says "1 more photo starts the reel" while one short and is gone once it plays; `/dashboard/<id>/reel` is a
  redirect for old links (once the reel plays: into the view, or into her own reel over the hub while the develop is
  ahead, as the card does; else the hub).
- ★ **Before the develop she plays her own reel over her own hub** (`event-feed/hub-reel.tsx`, mounted by the hub's
  page inside the album's store): the guests' own view (`LiveReelView`) on `?reel` of the hub's address, fed her
  scope, the hub's manifest with sealed shots included (hidden and held left out), its links by id from the hub store's
  own link store, and the host's defaults, handed through the view's `standIn` (the hub has no guest source). The
  guests' page cannot play it for her, so it never tries: before the develop it shows her what her guests see, which is
  no reel, and stands no curtain for her on `?reel` (`reelAsked`); after it, the card goes on opening that page. There is
  no screen link on the hub's view (`screenLink`: a screen that is not hers cannot open her hub, so a wall plays the
  reel cast from her own device), no Make your own and no Add yours, and a `?reel` that cannot play (the switch or the
  lever off, under two photographs that can) is dropped quietly, as the guests' page drops one. Its dock carries the one
  line a guest's never does, "Guests get it at the develop." (`dockNote`, handed in by `hub-reel.tsx` while the develop
  time the Reel card reads is ahead, on the develop clock every reader shares, so it stops at the develop itself).
- **Settings' Highlight reel page** ([`event-settings/reel-page.tsx`](../../src/components/app/event-settings/reel-page.tsx))
  saves each choice the moment it changes: Show the reel, the look every guest starts on (each shown on the event's own
  photo under that mood's `grade`) and the hold; optimistic, put back with a sentence when refused, and a slow answer
  never undoes a newer pick.

## The defaults and the lever

- **The event keeps three columns, NULL meaning the product's own**: `show_reel` (on), `reel_style_id` (the default
  mood) and `reel_hold_sec` (`DEFAULT_HOLD_SEC`). [`reel/defaults.ts`](../../src/lib/reel/defaults.ts) is the one home of
  the hold's steps and the looks a host may set (`REEL_MOOD_IDS`: moods only, since a treatment would be a default nobody
  sees); the database holds only an envelope (0.5 to 30 s), so a new step needs no migration.
  ★ `resolveHoldSec(row.reel_hold_sec)` always: the generated type reads the column as `number`, and `Number(null)`
  would answer the 1 s step.
- **`setReelDefaults`** ([`reel/defaults-action.ts`](../../src/lib/reel/defaults-action.ts)) is the one write, shared by
  the view's Set for everyone and Settings: it re-verifies the owner and revalidates nothing for a look or a hold, so
  the reel keeps playing; the switch (Settings' alone) revalidates the hub, whose Reel card its answer carries, so
  nothing refreshes the router after it ([host-app.md](host-app.md)).
  A pick that is the platform's own default (`DEFAULT_HOLD_SEC`, `DEFAULT_STYLE_ID`) is stored as NULL, each column on
  its own, so the event keeps following the default if it ever moves.
- ★ **The platform lever, `ops_flags.live_reel_enabled`**: off means no play button, no view, no screen and no Make
  your own anywhere. The guest payload and the host's side read it through the one `getLiveReelServerFacts`, so they
  cannot disagree: `reelState` lets it outrank the host's own switch silently, and the Reel card, the dashboard's item
  and the old route's redirect read the same Off either way. It fails OPEN (a flaky read must not take the reel off
  every album), while an unreadable plan fails to `null` (the creator goes, the reel stays); both are reported. Its
  switch is the `live-reel` card beside Download all's in `/admin/exports` (the same guarded switch, destructive sheet
  and audit; the palette jumps there), and the card sends an operator to the view's "live reel: frames failing"
  reports, so a broken reel and a paused one are not confused.

## The clip

- **The creator** ([`components/reel/clip-creator.tsx`](../../src/components/reel/clip-creator.tsx), "Make your own")
  plugs in through the guest seam ([`creator-seam.ts`](../../src/components/guest/reel/creator-seam.ts)): every "Make
  your own" renders only when a creator is registered AND the host's plan was read, so no build shows a dead end, and
  never in the demo (its photographs are simulated). It is lazy twice: the album carries none of it, the engine
  arrives when someone opens it (a pointer over the door warms it), and the encoder (mediabunny) with the first Make it
  or an idle warm-up. The view's Make your own opens it as a room of its own. Everything it needs arrives as props.
- **The bench**: at a laptop the head (the event, "Your clip", the clip's line, a violet Make it), the clip at full
  height, a panel of two tabs, one open at a time (Looks first: every look drawn on her own clip; Moments: the pool with
  the fills, the numbers and "Hidden · Show"), and the order strip and the tray (Length, Layout, Opening) beneath. In a
  hand, focused views: the clip, the tab switch, one view, the tray, with the order strip inside Moments. Escape is one
  step back (making cancels, the finish returns to editing, the bench returns to the reel).
- **Moments are a local selection** ([`reel/clip-selection.ts`](../../src/lib/reel/clip-selection.ts)): the fills are
  the reel's picks (loop 0's take capped to the length), Only mine (a guest's own ids, the owner's own uploads) and
  Everything, and the pool is the reel's (`isReelEligible`), so a clip is never cut from clips. Length is Auto (the
  clip's own length up to the plan's cap) or 15, 30 or 60 under it, fitted on each look's own clock. A guest never sees
  a hidden photograph; the owner's come through
  [`clip-hidden-action.ts`](../../src/lib/reel/clip-hidden-action.ts) (`getUser()`, then RLS), captioned "Hidden ·
  Show", and Show un-hides it for everyone as the viewer's Show does and puts it in the clip.
- **The make**: encoded on the device from the same draw the player runs, silent (no audio track). ★ The encoder
  carries its own ceiling (`MAX_ENCODE_SECONDS` in `engine/encode.ts`: the longest plan plus a style tail), refused
  before a byte is decoded, since no server caps a clip. A backgrounded tab pauses the encode and says so; a clip that
  does not finish lands on Retry with the picks kept and reports once to Sentry. Without WebCodecs
  ([`clip-support.ts`](../../src/lib/reel/clip-support.ts)) Make your own stays visible, greyed, and explains on a tap.
- **The finish**: Share leads on its own tap (iOS spends the user activation on the tap that started the encode, so it
  is never chained) and appears only where the sheet takes the very file (`canShare`), Save leading in violet
  elsewhere; a dismissed sheet raises nothing. Save is one tap into the platform's own action
  ([`share-save.ts`](../../src/lib/media/share-save.ts): the system sheet on iOS, the download elsewhere), naming
  the file after the event (`-clip.mp4`). Add to event waits behind
  a confirm. Every action keeps the viewer on the finish with its done state; Make another starts from the reel's next
  take, keeping the look, length and layout, while Back to editing keeps the picks.
- ★ **Payload-derived, never the client's**: the mark, the length cap and whether video may go back come from the
  server's `ClipFacts`. Add to event exists only when the plan takes video AND this viewer may add: a guest through the
  seam's `addClipToAlbum` (`null` while uploads are closed), the owner through her own route whenever her plan takes
  video, uploads open or closed.
- **Add to event**, a guest's: the page's own upload queue (`addClip`, `reelEligible: false`, the drawn poster as its
  preview) → `/api/r2/complete-upload` → the pipeline → `create_media(..., p_reel_eligible => false)`, moderated like
  any upload and refused on Free by the video gate; her Added means handed to the queue, which carries its own progress
  and failure sheet. ★ It is the one upload the guest routes rate-limit: `reel_clip_add`, ten a day per guest SESSION
  (not per event, so one enthusiast never drains a venue's envelope for everyone else at the party), checked before the
  pipeline spends a write, recorded only after one lands, failing open, and refused with the route's shape ("You've
  added a lot of clips today. Try again tomorrow."). The owner's add is
  [`clip-add.ts`](../../src/lib/reel/clip-add.ts) over `/api/host/r2/*` with `reel_eligible: false` into
  `create_media_as_host`: approved, metered on her storage, reading "Adding N%" until it lands, never the budget.
- **The mark is stamped in the draw's dispatch layer**, so no look exports unmarked, and one quiet line under a free
  event's clip says whose it is (a guest: which events mark; the owner: the way past it, her upgrade). An accepted
  caveat, so build no detection: the server never sees a clip's pixels, so a tampered device can make an unmarked clip,
  defrauding a watermark and nothing else.

## The looks and the engine

- **The style catalog is product data with one source**, the pure
  [`engine/style-registry.ts`](../../src/lib/reel/engine/style-registry.ts): eight moods that are their own theme and six
  treatments that resolve to one. The live reel plays moods only (a treatment id falls back to the default mood on
  every device); a clip may wear all fourteen. A new look is a catalog entry plus its draw path.
- ★ **The style dispatcher keeps a pure/rendering split**: the registry is pure, so the server resolves a look without
  a browser runtime, while the draw registry renders.
- The engine stays out of first-load marketing chunks: the registry is the one engine module there, and /reel reaches
  the canvas only behind a lazy boundary ([marketing-content.md](marketing-content.md)).

## The stored reel's end

The host-made, stored, published reel is gone: its routes, its admin page and switch, its libraries, queries and
limiter kinds, the Studio, the guest's stored-reel card and its schema (`20260924110000_live_reel_drop.sql`: the five
reel RPCs, `reel_items`, `reel_render_log`, `highlight_reels`, the `reel_status` enum,
`notification_prefs.notify_reel_ready`, the `reel_render_enabled` flag). Its stored files are swept from both R2
buckets too (the one-shot sweep read zero on both dry runs before it ran), and the code that named any of it —
`reelOutputKey`, the purge cron's append, `account-deletion.ts`'s append, the sweep script itself — is gone with it.
