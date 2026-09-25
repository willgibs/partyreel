# The highlight reel and the clip

Open this before you:
- change the live reel: when it exists, what it plays, its take, the tile, the view or the screen;
- change the event's reel defaults (the switch, the look, the hold) or the platform lever;
- change the clip creator, what a clip may do, or how a clip reaches the album;
- change a word the reel or a clip says anywhere.

Elsewhere: the event page that holds the tile ([guest-flow.md](guest-flow.md)), the host's hub around the Reel card
([host-app.md](host-app.md)), the upload pipeline a clip rides into the album ([uploads-and-r2.md](uploads-and-r2.md)),
what a clip costs ([billing-caps.md](billing-caps.md)), the admin portal's switches
([admin-observability.md](admin-observability.md)), the marketing story ([marketing-content.md](marketing-content.md)).

## The model

- **The highlight reel belongs to the event.** It is alive from the album's second approved, reel-eligible item: a
  looping montage of what the album shows, playing in a tile at the album's head and full screen in a view that is also
  the screen for a party wall. Uploads splice in and hides drop out; it needs no host action and leaves no file, so
  nothing downloads it. It obeys the album's gate, and it starts on the event's default mood and hold, which any viewer
  can change on their own device.
- **A clip is the viewer's own.** Anyone with full album access starts one from the reel with Make your own, picks
  moments, a look, a layout and a length, and their device renders it to save or share as a file that is never stored.
  On a paid event Add to event puts it in the album as an ordinary video, metered and moderated like any upload, which
  the reel never plays.
- **The levers are the clip's, never the reel's.** A free event's clips carry a small mark and run up to
  `MAX_REEL_SECONDS.free`; paid events' run to the paid cap with no mark. The live reel and the screen carry no mark
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
  plays. Below two, with the switch or the lever off, or behind a door, there is no tile, no view and no `?reel`: the
  host reaches the reel by adding the album's first two photos, so the view has no empty state of its own (a `?reel`
  below the minimum is dropped quietly and a phone's view whose album drops under two returns to the album). The
  owner's reel is exactly a guest's. It plays the SERVER's approved list, never an optimistic blob; the demo plays its
  optimistic tiles too, since its uploads never reach a server.
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
- ★ **The brain is quadratic** (about a second at 6,000 items), so the hub's card plans over a spread of the album
  (`TAKE_POOL`), and the tile's six stills come from the take ([`reel-tile.ts`](../../src/lib/guest/reel-tile.ts)),
  never the album's newest, which sit right beneath it.

## The tile, the view and the screen (the guest's side)

- **The Highlight reel tile** (`LiveReelTile`, [`reel/live-reel.tsx`](../../src/components/guest/reel/live-reel.tsx))
  sits in its own slot directly above `aboveAlbum`, on the words' column, never a fourth arm of `pickAboveAlbumState`:
  a slow crossfade of six stills from the take, previews only, the app's `PosterCard` headed "Highlight reel", with no
  engine on the album and nothing blocking its first paint. Its corner is a glyph (a 24px glass-mark disc holding a 12px
  clapperboard), and the violet "Make your own clip to share" under the heading renders only once a creator is
  registered AND the host's plan was read: a control of its own, lifted above the tile's watch layer (a button cannot
  hold a button), that opens the creator directly. A tap anywhere else opens the view (a pointer over it warms the
  view's chunk); it stays after uploads close.
- **The view** ([`reel/live-reel-view.tsx`](../../src/components/guest/reel/live-reel-view.tsx), `React.lazy`, ONE
  import promise shared by the warm-up and the lazy boundary) is a full-bleed Radix dialog over the player in `fill`,
  following the viewport's orientation. ★ **In a landscape composition every mood fills the frame edge to edge**
  (`fillLandscape`, `lib/reel/live/window.ts`): a laptop or a wall is where the reel must fill the room, so Cinematic's
  bars and Editorial's inset card are set aside and a mismatched photograph stays whole on its own darkened blur.
  ★ **`?reel` is its address** ([`reel-url.ts`](../../src/lib/guest/reel-url.ts)): opening PUSHES an entry marked in its
  own history state (`prReelPushed`), so a phone's back gesture closes it; closing a pushed entry goes back and closing a
  deep link REPLACES the address, so closing never leaves the page. Only the `reel` segment is touched, never a
  re-serialised query.
  - **The chrome**: a slim glass bar at rest (play and progress) that pointer movement, or a tap on touch, grows into
    the dock (a `clip-path` morph, [`live-reel.css`](../../src/components/guest/reel/live-reel.css), instant under
    reduced motion); a resting pointer settles it back (2.4 s; 4.2 s after a touch). Every control has a tooltip.
  - **The dock**: one row of icon buttons (play/pause, Include videos, Style, Hold, Show the code from 1024px, Add
    yours), then "Make your own" as the single primary, only with a creator. Space pauses, Escape closes, the arrows
    step a moment (the player's `step`; the clock never moves).
  - **The owner's extras**: at 1024px and up Play on a screen opens `?reel=screen` in a new tab; the Style list's
    footer reads "Only on this device, for now" with Set for everyone (`setReelDefaults`, below), and "Everyone sees
    this look" once they match; Close goes back where the host came from when there is history, else to the album.
  - **The viewer's own knobs, on this device** ([`reel-prefs.ts`](../../src/lib/guest/reel-prefs.ts), `localStorage`,
    never on the wire): Hold (per event, defaulting to the host's, converted into the mood's `holdScale`), Style (per
    event, the eight moods), Include videos (across events, on unless `saveData` says otherwise).
  - **The arrivals** ([`arrival-feed.ts`](../../src/lib/guest/arrival-feed.ts)): a fresh upload names its uploader top
    left for one hold; a burst stacks into a short feed of limited depth that collapses ("Theo +12").
  - **The code** (Show the code): a white plate bottom right, the event's QR in the host's preset, "Scan to add yours"
    and the readable address. No event name on screen.
  - A tap on the picture pauses and opens the item in the shared media viewer, grown out of the frame (`origin` of kind
    `reel` with its rect and no `returnTo`), a playing video carrying on from the reel's moment (`startAt`). Reduced
    motion holds the first frame with the dock up. The loop never announces its seam. Twelve failed frames or stills
    send ONE Sentry report per view ("live reel: frames failing"), and every failure feeds the provider's watchdog.
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
- **The approval toast** (moderated events only): once per visit, when the first of this device's held uploads shows up
  approved while the reel is showing, "The host added your uploads" with "Watch reel". No numbers; never for a clip. The
  queue lives in memory, so it plays only within the visit that made the upload.

## The host's side

A host has no reel to create, only a state to read and a few defaults to set.
- ★ **One state, three answers** ([`event/reel-progress.ts`](../../src/lib/event/reel-progress.ts)): `off` (the switch
  or the lever), `counting` (fewer than two items that can play), `live`. The Reel card, the band's step and the old
  route's redirect all read it, and "can play" is the guest's own `isReelEligible`, so the card flips on the photo that
  makes the guest's tile appear. The dashboard asks the same in SQL (`getReelProgress`: one row per event, at most two
  media embedded).
- **The Reel card counts to two** ([`event-feed/reel-card.tsx`](../../src/components/app/event-feed/reel-card.tsx)):
  dashed at none ("Starts at 2 photos"), the one photo under an overlay at one, then the living card ("Live for guests")
  dissolving through the reel's own take. Before two a press opens guidance (what is left, Add photos, and on a
  moderated event that a guest's photo counts once approved); from two it opens `/e/<token>?reel`, where the owner
  passes every gate; off, it opens Settings. The band's step says "1 more photo starts the reel" while one short and is
  gone once it plays; `/dashboard/<id>/reel` is a redirect for old links (into the view once it plays, else the hub).
- **Settings' Highlight reel section** ([`event-settings/highlight-reel-card.tsx`](../../src/components/app/event-settings/highlight-reel-card.tsx))
  is an instant-save card: Show the reel, the look every guest starts on (each shown on the event's own photo under that
  mood's `grade`) and the hold, each saved the moment it changes; optimistic, put back with a sentence when refused, and
  a slow answer never undoes a newer pick.

## The defaults and the lever

- **The event keeps three columns, NULL meaning the product's own**: `show_reel` (on), `reel_style_id` (the default
  mood) and `reel_hold_sec` (`DEFAULT_HOLD_SEC`). [`reel/defaults.ts`](../../src/lib/reel/defaults.ts) is the one home of
  the hold's steps and the looks a host may set (`REEL_MOOD_IDS`: moods only, since a treatment would be a default nobody
  sees); the database holds only an envelope (0.5 to 30 s), so a new step needs no migration.
  ★ `resolveHoldSec(row.reel_hold_sec)` always: the generated type reads the column as `number`, and `Number(null)`
  would answer the 1 s step.
- **`setReelDefaults`** ([`reel/defaults-action.ts`](../../src/lib/reel/defaults-action.ts)) is the one write, shared by
  the view's Set for everyone and Settings: it re-verifies the owner and revalidates nothing, so the reel keeps playing.
- ★ **The platform lever, `ops_flags.live_reel_enabled`**: off means no tile, no view, no screen and no Make your own
  anywhere. The guest payload and the host's side read it through the one `getLiveReelServerFacts`, so they cannot
  disagree: `reelState` lets it outrank the host's own switch silently, and the Reel card, the band's step and the old
  route's redirect show the same Off either way. It fails OPEN (a flaky read must not take the reel off every album),
  while an unreadable plan fails to `null` (the creator goes, the reel stays); both are reported. Its switch is the
  `live-reel` card beside Download all's in `/admin/exports` (the same guarded switch, destructive sheet and audit;
  the palette jumps there), and the card sends an operator to the view's "live reel: frames failing" reports, so a
  broken reel and a paused one are not confused.

## The clip

- **The creator** ([`components/reel/clip-creator.tsx`](../../src/components/reel/clip-creator.tsx), "Make your own")
  plugs in through the guest seam ([`creator-seam.ts`](../../src/components/guest/reel/creator-seam.ts)): every "Make
  your own" renders only when a creator is registered AND the host's plan was read, so no build shows a dead end, and
  never in the demo (its photographs are simulated). It is lazy twice: the album carries none of it, the engine
  arrives when someone opens it (a pointer over the door warms it), and the encoder (mediabunny) with the first Make it
  or an idle warm-up. The view's Make your own opens it as a room of its own; the tile's line opens the view with the
  creator already asked for. Everything it needs arrives as props.
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
  elsewhere; a dismissed sheet raises nothing. Save follows the platform ([`share-save.ts`](../../src/lib/media/share-save.ts):
  on iOS Save to Photos, then Download file), naming the file after the event (`-clip.mp4`). Add to event waits behind
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
`notification_prefs.notify_reel_ready`, the `reel_render_enabled` flag). What remains is on a clock:
- **The stored files are swept** from both buckets ([`scripts/sweep-reel-files.mjs`](../../scripts/sweep-reel-files.mjs),
  the one-shot sweep for every `events/<id>/reel/reel.mp4`, run once per bucket with `R2_BUCKET` naming the backup;
  dry runs of both read zero). `reelOutputKey`, the purge cron's append and `account-deletion.ts`'s append are the
  last of its code and leave in a later change.
