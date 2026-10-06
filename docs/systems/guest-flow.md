# Guest flow — the `/e/[token]` event page

> ROLE: what a guest (or a signed-in visitor) experiences on the one event link, and how joining/uploading is gated.
> BELONGS HERE: the `/e/[token]` page, WHO A GUEST IS (the definition every surface counts by), the door (six of them, `visibility` + `gate`, one decision a request: the shut, held and ask doors), capability tokens, the password gate + unlock cookie, the gated view (`none` / `teaser` / `full`), the door's steps (the `require_verified_email` switch, An email first, with its name-only door; A photo first), silent join, the confirm doors and the return after one, the auth-aware header island, the live gallery (the one live source, doorbell + conditional poll), the link card, demo mode. · NOT HERE: the highlight reel and the clip (the tile, the view that is also the wall, the approval toast, the creator's seam → [reel.md](reel.md)), the upload pipeline + R2 + lightbox mechanics (→ [uploads-and-r2.md](uploads-and-r2.md)), the dashboard and its claims review (→ [dashboard.md](dashboard.md)), host-side event config and the Guest cards (→ [host-app.md](host-app.md)), the album's camera (→ [disposable-mode.md](disposable-mode.md)), why a rule was chosen and what shipped when (→ git).
> GROWS BY: integrate-in-place.

## What it does

`/e/[token]` ([`page.tsx`](../../src/app/(guest)/e/[token]/page.tsx)) is the scanned-QR landing page: ONE
unified event page ([`event-experience.tsx`](../../src/components/guest/event-experience.tsx)) whose state
the host's configs drive. The opaque `qr_token` IS the authorization, and there is ONE link per event.
`get_event_by_qr_token` resolves `qr_token` OR `custom_slug` (token wins) and returns the canonical
`qr_token`, which the page threads to every downstream qr-keyed RPC.

★ **THE GUEST'S WORD IS "ALBUM", THE CODE'S WORD IS "GALLERY", AND THAT SPLIT IS DELIBERATE.** Every string
a guest reads says album, the site's one noun, so a guest who becomes a host never meets two words. The code keeps
its names (`gallery-access*`, `getGalleryStats`, `LiveGallery`, `GalleryPayload`, the routes, RPCs and columns),
since renaming a live route buys a guest nothing and risks the one flow with no account behind it. Do not "fix" the
mismatch in either direction: new guest copy says album, new code says whatever the neighbouring code says.

## Flow (top to bottom, contiguous)

**The album opens on its cover** ([`event-experience-head.tsx`](../../src/components/guest/event-experience-head.tsx),
composed in [`event-experience.tsx`](../../src/components/guest/event-experience.tsx)): the reel's photographs
dissolving under the event's name, the byline, the host's note and the actions (Add photos, her tracker, the reel's
round, Invite). Every Add opens the add sheet (`GuestUpload`'s `openAdd`, below). The cover is a dark room (`dark`,
`data-surface="photo"`) so its words read on any photograph.
- **The ground is always lit**: under every cover stands the house light (`HouseLight`), so a cover with no
  photograph to show still stands lit: an empty album, or one sealed until it develops (disposable mode: its stills
  never reach a guest's payload before then). Its stills follow one rule for the first paint and the live album
  (`pickCoverIds`), so the two never disagree: the reel's opening while the album has a reel ([reel.md](reel.md)), else
  the album's newest a guest may see, never a clip, previews only. Where the album develops, a word over the name says
  so (`coverEyebrow`, [`wait-words.ts`](../../src/lib/disposable/wait-words.ts)).
- **The head is the page's shell**: the album's live source mounts behind the page's `<Suspense>`, and the head paints
  first and stands through the album's own failure, so `CoverGround` reads the page's streamed seed itself, never
  thrown; once the album has mounted, its reel controller publishes the live stills and the reel's door to the head
  (`createHeadBridge`).
- **The guest's header stands on the cover** (`guest-header.tsx`'s `over`) and the album moves it between the cover
  and paper (`guest-header-cover.ts`, a module store, since the two are sibling islands): to paper over a paper door
  and once the demo's pinned header scrolls (a see-through bar would slide the cover's words under its own), back to
  the cover as she lands.
- **The walk through the door lands on the head** (the ARRIVAL, below), which it finds by `[data-event-head]`,
  `[data-head-stills]` and `[data-head-still="<slot>"]` (slot 0 the one a reduced-motion reader sees); the open doorway
  draws the cover's own picture (`CoverPicture`) at the cover's height (`--cover-h`).

**What stays is the shutter** ([`guest-action-dock.tsx`](../../src/components/guest/guest-action-dock.tsx)): once
the cover's row leaves the viewport (its sentinel, [`use-in-view-sentinel.ts`](../../src/lib/shared/use-in-view-sentinel.ts)),
a dock at the foot carries the row's actions: the Add at the centre (`ui/shutter.tsx`), Invite, and the reel's round
or, on an album with no reel, the way back to the cover. While her files go its ring is their progress
(`useRunProgress`, a derived selector, so a tick re-renders the shutter alone). It carries exactly what the row
carries (no Add where the row has none) and never replaces the row as a guest's first sight of Add, since a shutter
alone sits where the eye reaches last.

★ **THERE IS NO SAVE, ANYWHERE.** Uploading to an event is what keeps it (the definition under "Invariants"), so no
guest surface saves an event. Keeping what a guest added is asked after her first file lands, as the door's last step
(`keep`, [`save-account-prompt.tsx`](../../src/components/guest/save-account-prompt.tsx)), never a button above an
album a stranger has not seen yet.

**The keep is the capture flow**: confirm an email and the uploads, with the event they went into, stay in the
account; then follow the host. Its copy says "in your account", never "on your profile", since a profile publishes
nothing until its owner chooses. It is due the instant a signed-out guest's first file lands this visit (from the
door's upload step or the album's Add; never in the demo or for the host), and held while a camera is open
(`keepDue`, `onCameraOpenChange`, the door's own camera's too: [disposable-mode.md](disposable-mode.md)) and while any
of her files is still going: a burst records in groups, so the keep would rise at the first group over files in the air and count too few,
where it now comes once nothing is queued or going, with the whole count. The door reopens on Sent over what went, named as it is (`keepSent`; where what
she adds waits, how it develops, `keepWaitLine`, never "joined"), then the ask (`keepCopy`, `KEEP_TITLE`): Confirm
your email (the account door in the same held sheet, its `keep` wear, carrying the product's one newsletter opt-in
through `/api/guests/capture-email`) or Maybe later (put down for that event on that device, `pr_save_prompt_<qr>`,
[`keep-ask.ts`](../../src/lib/guest/keep-ask.ts)).
`ClaimHandlePrompt` owns the album's post-upload slot, one card at a time, never in the demo: signed out, nothing
(the door asked, and her name menu's card is the ask's standing home); just confirmed, the follow moment
([`follow-moment-card.tsx`](../../src/components/guest/follow-moment-card.tsx), below, with a Claim to the profile
setup); signed in without a handle, the handle card; with one, nothing.

**Three confirm doors, one wear, and they claim only.** The door's keep, the Unverified mark on a guest's own credit
([`unverified-mark.tsx`](../../src/components/shared/unverified-mark.tsx)) and the header name menu (the last two
through [`confirm-email-dialog.tsx`](../../src/components/auth/confirm-email-dialog.tsx)) wear the account door's
`keep` wear and, on a verified code, await `claimAnonymousUploads` before anything redraws (a refresh that overtook
the claim would redraw the credit the guest just paid an email to fix). The claim is the whole keep: it brings the
event with the photographs (a Guest card on the dashboard, [host-app.md](host-app.md)).

**The return: "just confirmed" is a marker and a claim, never a guess**
([`album-return.ts`](../../src/lib/guest/album-return.ts), whose header holds the whole of it,
[`use-confirm-return.ts`](../../src/lib/guest/use-confirm-return.ts),
[`claim-uploads.ts`](../../src/lib/guest/claim-uploads.ts)). Every confirm door writes `pr_pending_offer_<qr_token>`
the moment it opens, because after a magic-link or Google redirect no code of ours has run. `EventExperience`'s
`useConfirmReturn` claims at mount and hears every claim made on the page, and the follow moment plays only when the
marker was there (or the claim is her yes to the shared-phone ask) and the claim moved this album's own uploads,
counting a ticket a read on the page claimed first. The first claim that runs for an album's ticket spends its
marker, wherever it ran, so a door abandoned there never plays weeks later.

**A confirmation is one beat** ([`confirm-beat.ts`](../../src/lib/guest/confirm-beat.ts)): the follow moment's card
says what she now holds, her other events once in a line that never leads out (`otherEventsLine`) and the told name
with its Change; where no moment plays, the page says it once, after the door's hold, with the name's Change
([`confirm-beat-name.tsx`](../../src/lib/guest/confirm-beat-name.tsx)). The events waiting under her
email are the moment's alone, counted on the server from the dashboard banner's own list
([`confirm-beat-action.ts`](../../src/lib/guest/confirm-beat-action.ts)).

The follow moment offers the host alone, with the quieter Follow (`FollowButton`'s `quiet`): the other guests carry
their own Follow on each handled chip ([`guest-list.tsx`](../../src/components/social/guest-list.tsx)), and a second
copy would be one list twice on one screen. Its card is `getHostCard(eventId)` from the page RSC, with `isFollowing`
read beside it so its Follow starts on Following; no card means no host row, never a stub.

- **Stats**: `getGalleryStats(event)` ([`guest-events-admin.ts`](../../src/lib/db/queries/guest-events-admin.ts))
  → `{approvedTotal, guestCount, kinds}`: a head count of approved media (`countApprovedMedia`, request-scoped, so the
  stats and the gallery payload share one answer), the one count of guests (`getEventGuests`, the same
  function the host's hub reads, so the album and the hub never say two numbers for one party; never the host), and
  what N holds by kind (`kinds`, `{photos, videos}`: ONE more head count, of the videos, in the same round, and photos
  are the total less them, so the two always add up to the number beside them; the poll never asks). `kinds` is
  null where this request is not past the lock (`pastTheLock`: a locked page's tease is a name and a size, so its
  payload carries the count alone), where the read failed (reported, never the page's failure) and where the videos
  outrun the total (the two heads are no one snapshot).
  ★ **NUMBERS ONLY ever leave the server**, never a guest_id or an identity. N goes live through
  `GalleryLiveProvider`'s `onCountChange` ("One true count" below); M is seeded by the page RSC and kept current by the
  album's sync (`/api/album/guest/sync`), which carries `guestCount` on a 200 only (read after its 304 check, so the
  steady poll pays nothing, and never on a locked page) and hands it up through `onGuestCountChange`, since only the
  server can tell a guest's first upload from a returning contributor's. M stays outside the ETag: whatever moves it
  changes the payload the ETag already hashes. The album's own label and the cover's glyph say N in the source's words
  (`albumCountWords`), the cover's from the first byte out of `kinds`, so the page never counts one album two ways.
- **The album, in justified rows** ([`gallery-rows.tsx`](../../src/components/guest/gallery-rows.tsx) over the
  shared `MasonryColumns` `layout="rows"`, [design-system.md](design-system.md)'s `rows`, windowed by
  [`album-window.tsx`](../../src/components/shared/album-window.tsx)): only the rows around the view are mounted; a
  photograph's link and heart load when its row mounts, and a tile whose row leaves cancels its unfinished download,
  since every R2 read shares a few HTTP/1.1 connections ([uploads-and-r2.md](uploads-and-r2.md)). The first paint is
  the server's: rows per width class at the width the album last laid them (`pr_album_w`, path-scoped), in the order
  it opens in, links for exactly those photographs (`albumFirstPaintIds`), and the hydration draws the plan the server
  wrote (`data-rows-plan`), never its own. Her lens (Photos, Videos, Yours: `lensAlbum`) runs over the manifest (the
  device's own ids met with it; the counts stay the album's). A photograph with no link yet is a loading tile, never a
  request.
- **The album's order turns once the party is over** ([`album-order.ts`](../../src/lib/shared/album-order.ts),
  customize r1's `order=turns`): newest first while it is on, the night in order from 9 am the morning after its last
  day or from its develop; an undated album and the demo never turn, and a teaser's nine stay newest first. It is
  presentation over the one wire (the manifest and its delta stay `created_at desc`): the view turns the live source's
  list (`inOrder`) and the rows lay from the end it grows at, so an album in order grows at its end but for a late
  upload its capture time lands mid-album (the anchoring holds her place, the arrivals pill points there). In order
  reads `happenedAt`: when each was taken where the wire carries a capture time (`takenAtOf`, the capture-time lane's
  one switch), else when it arrived, and a capture time before the night's own run of times (neighbours within three
  days, `NIGHT_GAP_US`, ending at the newest) is seated at the night's END edge while it is the smaller part of the album
  (`nightKeys`, one key for the first paint, the live album and the hub; the wire keeps the true time); newest first is
  always by arrival, the live feed. ★ The turn is one moment for
  every reader, the party's (Will: "It feels unfair to unlock the album at different times for certain guests based
  on geographical location"): its 9 am is read in the event's own zone (`events.time_zone`,
  [`lib/event/zone.ts`](../../src/lib/event/zone.ts); a row with none, or one the runtime cannot read, turns in UTC,
  the one fallback), never the reader's. The page's server reads the zone on the service role beside the door's read
  (`zone.server.ts`; a failed read is the fallback, reported) and hands the browser the turn as an INSTANT, never a
  zone (`GuestAlbumOrder`'s `morningAfter`, beside the album's own order and her choice: event-zone's opening folded
  in), so no reader's clock, geography or browser's database of zones moves it; the zone reaches the browser for words
  alone (`partyZone`, never behind a lock), never for the turn. The seed links the first paint of that order and the
  hydration lays the same rows; the page then turns it at that instant on the device's clock (`useGuestAlbumOrder`: a
  timer, a return to the tab, a Develop now). A develop time wins over the morning after, and the one it turns at is
  the sync's word once heard, a develop taken away included, else the page's own (`turnDevelopsAt`).
  Behind a gate the order knows no days, as the shell does not. Her Newest or Oldest is remembered per album on the
  device only as a departure from the turn (`pr_album_sort`, which the page reads; choosing the album's own order
  forgets it), her lens for the visit. See it as a guest is handed the same opening (`readAsGuest`), so it lays the
  album as a guest who never chose meets it.
  The page root is two boxes ([`event-experience.tsx`](../../src/components/guest/event-experience.tsx)): `COLUMN`,
  the reading measure, and `BLEED`, the gutter alone. The album alone takes `BLEED` and the cover runs the window's
  width; everything else the page says keeps `COLUMN`.
- **The upload act.** The queue ([`use-upload-queue.ts`](../../src/lib/guest/use-upload-queue.ts): one at a time,
  the silent join, demo sim, retry) is created once in `event-experience.tsx` and shared by the album's Add and the
  door's upload step, so a run started at the door outlives it. `GuestUpload`
  ([`guest-upload.tsx`](../../src/components/guest/guest-upload.tsx)) reads its snapshot and owns the album's two
  sheets and the post-upload slot behind a `{openAdd, retry}` handle; it draws no tile. The album's owner is never her
  own guest (`ownerEventId`, the queue's header): her files ride the host's pair (`/api/host/r2/*`,
  `create_media_as_host`), approved, metered on her storage and credited as the host, with no ticket, no join and no
  door. Three surfaces and the session's refusals:
  - **The add choice**: every Add opens [`upload/intent-sheet.tsx`](../../src/components/guest/upload/intent-sheet.tsx)
    (where the host chose the album's camera, the camera opens in its place: [disposable-mode.md](disposable-mode.md)),
    *Take a photo* over *Choose from your album*, then the terms line
    ([`upload-terms.ts`](../../src/components/guest/upload/upload-terms.ts): the kinds, and the per-file cap she
    meets, the host's own `max_upload_bytes` where she set one, else `media/limits.ts`'s ceiling). Two hidden inputs,
    because `capture` cannot be both: the camera's takes one photograph, the album's many, video included. ★ **Each is
    `.click()`ed SYNCHRONOUSLY from its row's tap**: one `await` in between and Safari silently drops the picker.
  - **The review step** ([`upload/review-step.tsx`](../../src/components/guest/upload/review-step.tsx)) catches an
    accidental selection: the picks as tiles with a one-tap remove and a `Send N`, and only then does `addFiles(kept)`
    run. A file the browser cannot draw (an iPhone `.mov`, a HEIC outside Safari) is a named stand-in with its size
    ([`upload/pick-preview.tsx`](../../src/components/guest/upload/pick-preview.tsx): `onError` is the only honest
    test); the picks' object URLs have one owner ([`use-pick-urls.ts`](../../src/components/guest/upload/use-pick-urls.ts)).
  - **The stack's x** (`upload/stack-tile.tsx`, asked through `gallery-rows.tsx`): ★ the stack keeps the slot her
    photograph lands in (the album's head, or its end in an album in order), and while that slot is out of her sight a
    stand-in carries its thumb, its count, its bar and its x in view above the shutter's band
    ([`upload/sending-stand-in.tsx`](../../src/components/guest/upload/sending-stand-in.tsx), `useStandIn`); either x
    stops the file in the air, one at a time (E6). It asks first on the product's toast ("Stop this upload?", Keep going
    first), then the queue's `stop` aborts that file alone (each file of a burst carries its own signal: its siblings
    go on and are recorded together) and the toast says "Upload cancelled." with Try again, which puts the same file
    back. A stopped file is no failure: it leaves the queue (the failure sheet, the shutter's ring and her uploads never
    count it) and nothing is recorded or metered. The x is drawn only while the file can still be stopped (going up, or
    not yet begun; gone once its bytes are up and its complete is coming), a question whose file left the stack, or whose
    x went, is withdrawn (a Stop it offered could only answer too late; the question is the pick's, never a tile's,
    `StackQuestion`, so the window unmounting the stack's row withdraws nothing still meant), and a stop too late to take says nothing (the file lands) and says it at once: with every file of its burst
    up (so its complete is asked and an abort would be ignored) the queue answers too late on the press, aborting
    nothing, where an answer that waited for the landing left the question on screen, unchanged, for as long as the
    complete took (seconds, longer for a burst) and read as an unheard press; a file up while a sibling still goes only
    waits for it, so its stop still takes it back. The stop reaches the stack on the progress
    store it already reads (`QueueProgress.stop`), so no prop runs through the page, the provider and the gallery.
  - **The failure sheet** ([`upload/failure-sheet.tsx`](../../src/components/guest/upload/failure-sheet.tsx)): nothing
    interrupts while files go; when the run ends with anything refused it opens once, a line per file (its name, the
    server's sentence, Retry; a dropped connection's line wears a signal mark, told by the queue's `cause`, never its
    words; a file she stopped is never listed, it left the queue) over one `Retry all`. It heads on the door's own scale
    (`DoorHeading` in its `announce` mode, so the heading IS the dialog's title: the door's upload step says this very
    failure on it too) with "N of SENT didn't upload", where SENT is the run's own files (`useRunSent`,
    [`use-upload-queue.ts`](../../src/lib/guest/use-upload-queue.ts)): the queue's own `inRun` (every file not settled
    when the run began, a Retry included) plus any failure the heading lists that an earlier try left, read off the
    items by id and never off how many the queue holds (a Retry adds no item). A run that begins with failures still
    listed (one of three Retried while the sheet stands over the other two) is their go continuing, so the whole keeps
    its meaning; one that begins with none (Retry all, the next pick) is a go of its own, and a slot mounted mid-run
    counts everything it holds. Under it is a line on the rest that is true where it is said
    (`uploadFailureElsewhere`), said only where the run sent more than failed and every file the sheet does not list has
    landed (`useRunCounts`, one baseline for both numbers): a run that failed whole has no "Everything else", and a
    row's Retry, which takes its file out of the list while it goes, says nothing of the rest until that file lands. A
    file that failed as a dropped connection with its complete kept (`hasKeptComplete`: the row may stand, and the album
    may already show it) is asked again for her by the queue (`use-upload-queue.heal.ts`: 5, 20 and 60 s on, the moment
    the browser says the line is back and when the page is looked at again, none while it says it is offline and none
    spent on it; three asks a File, never a loop; a Retry's own runner, so the two never race), so the sheet lets its row go when the server answers instead of saying "didn't
    upload" over a photograph in the album. A refusal of the file itself (`retryCanPass`: a type nobody takes, a file over the ceiling, a video where the
    album takes none) lists with no Retry, and where every line is one the sheet says the way on
    (`uploadFailureChooseAgain`, which the door's step says too, and whose failure view lists each file and its reason
    whatever the verdict, with no Retry on a refusal and "Choose other photos" the way on). The uploader refuses a wrong type or a file over its
    ceiling itself, before any request, so those carry no server code: the queue gives them one from the file
    (`localRefusalCode`) and they meet the same rule. A refused file draws no tile and nothing toasts, except the join's own failure
    (nothing was queued). Every close drops what it listed from the queue (`dismiss`), not just from the screen, so a
    dismissed failure never comes back at a later run's end. While the door's upload step shows, it owns the run's
    failures (`suppressFailures`).
  - **The flip, mid-run**: a host turning An email first on answers 403 `verification_required`, one of the refusals
    the queue reads as the session's, never one file's (its header names them). A confirmed viewer re-joins silently
    once (the queue reads its ticket per file); a name-only guest's queued files fail in place with the server's
    sentence, and her ticket stays (the switch refused the files, not her row), so the switch turned off sends her
    next Add on the same row and a confirmation claims it, where a dropped ticket would mint her a second row under
    the same name. The page's refresh waits for the failure sheet to close (`onVerificationRequired`'s
    `hadQueuedFiles`, `onFailuresClosed`), because the refresh flips `access` and remounts the slot (`key={access}`)
    out from under it, and the slot that mounts after lists only what failed in front of it (`carriedFailures`).
  - **Somebody else's ticket** (`session_other_account`, the Invariants' owner rule; a shared phone): the file is not
    failed. The ticket goes down (`dropGuestTicket`, its cookie awaited so it cannot land after the re-join's fresh
    one) and the file waits: a confirmed viewer joins silently and it goes up on their own row, anyone else is handed
    to the door (`onDoorNeeded`). The page holds its door on the name it had until its refresh lands
    ([`door-hold.ts`](../../src/lib/guest/door-hold.ts)), so a phone the host blocked meets the shut door with no name
    step first. A join that lands `waiting` (where the host lets each guest in) is the ask, never a ticket: the queue
    sends nothing and fails nothing (nor does the page's own silent join adopt it, `passedTicket`, `join.ts`), and
    the files wait on the held door and go when the page's door opens (`doorOpen`), on a fresh join that mints her
    ticket `in`.
  **The blob re-key**: an in-flight tile's object URL is keyed by queue id and re-keyed to the media id at approved
  completion (`UploadedItem.queueId`), the same URL object, so the album's tile is a fresh `<img>` on a picture the
  browser already holds and `MediaTile` shows it at once, with no fade; her link then lands in place
  (`media-grid.tsx`).
- **Empty state** ([`gallery-empty-state.tsx`](../../src/components/guest/gallery-empty-state.tsx)): the photographic
  promise, the river of `public/guest-ghost` photographs behind its fade (`GhostRiver`, exported from this file and the
  one home of the fade, which the locked page draws too), with nothing of Partyreel's own above it, since the guest
  surface belongs to the host's event. It draws no button of its own: the cover's Add is the one Add on every album, so
  there is always exactly one, in the first screen. Its words are `addWords`'
  ([`camera/words.ts`](../../src/lib/guest/camera/words.ts), the one home See it as a guest shares): "the first photo"
  only while the album is empty and nothing of hers is in flight or waiting (`galleryEmpty`; a landing sealed for a
  develop waits like a held one), and never over an album others have added to: the page's server render asks
  whether anything waits at all (`waitingOnArrival`, [`waiting.server.ts`](../../src/lib/disposable/waiting.server.ts)'s
  `albumWaits`, a yes or a no), and the live source tells the page each flip of it after that (`onWaitingChange`). The
  promise yields to the wait (`AlbumWaitYield`,
  [`gallery-empty-state-yield.tsx`](../../src/components/guest/gallery-empty-state-yield.tsx), a light module so the
  Library's server pages still draw it): wherever the album's contact sheet stands, it steps aside.
- **The album's wait: the contact sheet**
  ([`gallery-empty-state-wait.tsx`](../../src/components/guest/gallery-empty-state-wait.tsx), the drawing
  [`gallery-empty-state-sheet.tsx`](../../src/components/guest/gallery-empty-state-sheet.tsx), the layout
  [`contact-sheet.ts`](../../src/lib/disposable/contact-sheet.ts)): wherever what is added waits (`waitClock`) and
  something does, or she is sending to it (`waitStands`), one square a photo stands over the album's rows in the order
  the night took them, under its count and over the wait's clock (`wait-words.ts`). ★ **Everyone's squares are the
  sync's numbers alone, never an id** (the server's half: [disposable-mode.md](disposable-mode.md), "No waiting id
  leaves the server"), carried by the album store's snapshot (`waiting`, absent where nothing waits) and the live
  source (`GalleryLive.waiting`, the seed's from the first paint); hers are lit with her own pictures as her tracker
  publishes them (`HerShots`), what she is sending at the end. The sheet is capped (`columnsFor`), the oldest folding
  into one "+N". Before anything waits, where she can add, the wait's line stands in the sheet's place (`waitRule`),
  said once. The page mounts one source for the sheet, the line and the yield (`AlbumWaitSource`, inside the album's
  live provider).
- **The develop: the sheet opening into the album** (`AlbumDevelop` in
  [`gallery-empty-state-wait.tsx`](../../src/components/guest/gallery-empty-state-wait.tsx), its drawing `DevelopSheet`,
  the data and tokens [`contact-sheet-develop.ts`](../../src/lib/disposable/contact-sheet-develop.ts)): her first open
  after a develop, on this device however late, and live in place on a page open across it (the clock, or Develop
  now), the sheet develops where it stood: its squares flash and come up in the night's order, "Developing" turns to
  "Developed", the cover comes up out of its house light, and the first screen's tiles grow out of their squares while
  the rest sink and the well dissolves; reduced motion fades alone. Any press, scroll or key ends it on its last frame.
  ★ **Once per device is a mark** (`pr_develop:<eventId>` in localStorage, the develop time seen, epoch ms): written
  when it ends or she ends it, and on a first open the door or `?reel` took (spent unplayed); never mid-play, so a
  return mid-play plays it whole, and a tab put away mid-play stands it still and plays it again on her return.
  ★ **The server cannot read the mark, so its gate goes before the cover** (`DevelopGate`, `developGateScript`, drawn
  on the server's render and the hydration's only, where a develop may be owed and no door or reel comes first): it
  sets `html[data-develop="held"]` before the first paint (the cover's stills held on the house light, the album's rows
  hidden), and lets go by itself after 6 s if the page never takes it up. The whole develop is one switch on the
  document (`held`, `play`), its tokens written beside it for the play (`developVars`), so the stylesheet names no
  number of its own. ★ **The roll is derived, never an id that waited**: the seed's manifest entries created at or
  before the develop (after the one this device last saw), or, live, the photographs that land after the sheet stood,
  laid in the night's order so hers stay where they stood. The stage reads the album's own DOM: its rows are the
  `[data-develop-rows]` section `LiveGallery` draws beside it (which is why the develop mounts there, where a page test
  that mocks the album never meets it), a growing tile's own tile is hidden under it by a per-play style keyed on
  `data-media-id`, and it loads only the pictures of the squares in the first screen and of the tiles that grow.
- **The viewer** is the shared [`media-lightbox.tsx`](../../src/components/shared/media-lightbox.tsx), whose header
  holds its gestures and its paged list (the whole album, mostly unlinked; an unlinked item is a placeholder, never a
  request). The open photograph's `?photo=` address and the phone's Back over it are `shared/masonry.tsx`'s (an
  unknown, held or hidden id opens the album plainly, with no sign the item exists); its credit, Save and Share are
  [uploads-and-r2.md](uploads-and-r2.md)'s. Copy link copies the public album link (`shareUrl`, the event's join link,
  with `?photo=` on an approved item), never a presigned media URL or a dashboard URL; the guest album and the host
  gallery pass it, the personal Uploads and the recovery bin omit it.
- Each tile and the viewer carry a **like**, except an item marked `likeable: false`: the profile's Uploads marks an
  upload to an album that reads private to her (read as she sees it, `getEventByQrToken`, so a block counts), where
  `like_media` refuses all but the host. A signed-out tap opens the create-account dialog (`LikesProvider` replays it
  after sign-in). The hearts are seeded through `my_liked_media_ids` with the window's ids in the POST body, never a
  URL, which a whole album outgrows, asking only the ids not yet answered as the window moves (`seed-queue.ts`); a
  failed seed is reported (Sentry, `media`) and the hearts start unfilled. Every signed-in call reads the session as
  it goes ([`likes-provider.tsx`](../../src/components/likes/likes-provider.tsx)), so the hearts follow whoever the
  device holds. Like counts are host-only ([host-app.md](host-app.md), [database-security.md](database-security.md)).
- **PWA (manifest only, no SW)**: [`manifest.ts`](../../src/app/manifest.ts) and the ink-aperture icon set make an
  event link installable to a home screen; static and global, so it leaks nothing event-specific.

## State follows the door: `visibility` + `gate`, one decision a request

An album keeps one of six doors ([`door.ts`](../../src/lib/event/door/door.ts)): `open` (Public), `password`,
`approve` (the host lets each person in), `invite` (the invite list), `closed` (only people already in) and `private`
(Only me). ★ **A gated album is stored `private` with its `gate`**, so a reader that has not learned the gate answers it
as Only me, the safe side; `doorOf` is the one reading of the pair and fails closed. Per request the server asks
`event_door_standing` (the account, every device; the tickets this request holds, one browser each; never a device id
or an IP) and `decideDoor` ([`decide.ts`](../../src/lib/event/door/decide.ts)) answers one decision, which the page,
its metadata and every guest route act on through
[`closed-door.server.ts`](../../src/lib/events/closed-door.server.ts) (`pageDoor`, `resolveGuestDoor`,
`doorCallerFor`; the write routes pass `cookie: false` and ask with their body ticket alone). ★ A signed-in account's
caller carries only the tickets that are hers (her own rows, or one the claim takes: the Invariants' owner rule, read
side), so another guest's ticket on a shared phone can neither let her in, hold her at the door nor stand for her
there; a block on it still holds the phone (`event_ticket_blocked`), which is what the upload's own context says of it:

- ★ **One rule for everyone already in: a gate stops newcomers; only Only me and a block shut out someone already
  in.** `through {admitted}` passes the password without it and reads a gated album, through the door's PASS
  (`pass.server.ts`, a WeakSet-issued object, only when `through && admitted`, never a shape a caller builds), which
  the self-guarded admin reads ask beside the unlock cookie and the host. A password newcomer gets no pass.
- **`shut`** = the one closed screen for every newcomer turned away ([`shut-door.tsx`](../../src/components/guest/door/shut-door.tsx),
  "This album is closed"): Only me, a closed gate, a decline, a block. Someone who was in reads "This album is
  private". It is the doorway, shut, one link home, under the real `GuestHeader`; it names nothing, neither the album
  nor its host, and `generateMetadata` hides the name. ★ **The sneaky block: a person the host blocked meets it word
  for word.** An account or confirmed address a block holds reads the event as `private` from `get_event_by_qr_token`
  itself, and a ticket is asked by the one closed door whenever a request carries one, so a block, a closed door and
  an Only me album answer the same with the same work: the page and its metadata, the join, the unlock, the export,
  the album's read and every guest write, and the write RPCs refuse a held ticket in the private album's words. Her
  own dashboard and picker read the event as private too ([host-app.md](host-app.md)), so nothing she can reach says
  blocked.
- **`ask {invite}`**, an address the invite list does not name: the shut door with her own foot: "Ask Maya to let me
  in" (`UnlistedAsk`, `POST /api/guests/ask`, then the held door) or "Use a different email" (`switch-email.ts`: every
  ticket on the device put down, then this device signed out, `local`; every sign-out names its scope,
  `sign-out-scope.test.ts`). A declined ask meets the shut door with no ask. **`ask {approve}`**, a confirmed
  newcomer: "Maya lets each guest in", Ask to join (`ask-step.tsx`, the same route), at the doorway, shut. The ask
  route re-reads `getUser()` (a confirmed address or 422), rides the join limiter, and answers a shut door 403 in the
  private album's words.
- ★ **A door shows a stranger only what it needs.** A door the host answers (letting each guest in, the invite list)
  names the album and the host who lets her in, never its date: its welcome's byline, the email step, the ask, the
  held door, and the unlisted reader's own foot; a password album's door names the album, never its host; the shut
  door names nothing, whoever reads it. The page hands every access `none` door a redacted `shellEvent`, since props
  reach the RSC flight payload whether or not the UI draws them: no date, develop time (a date too), description or
  slug, and the host only where the door holds her (`doorGalleryDecision`);
  [`page.redaction.test.tsx`](<../../src/app/(guest)/e/[token]/page.redaction.test.tsx>) pins every kind of door.
- **`waiting`**, the held door ([`waiting-step.tsx`](../../src/components/guest/door/waiting-step.tsx)): the doorway
  ajar, with nothing of the album behind it; it checks in every 30 s and on the tab's return (`POST /api/guests/door`:
  `waiting` | `in` | `moved`, `private, no-store`; a missing event answers `moved`), which stamps her rows for the
  banked let-in mail, and on `in` she walks through onto the album's cover (the ARRIVAL, below). She can choose what
  she will add while she waits ([`wait-picks.tsx`](../../src/components/guest/door/wait-picks.tsx)): the page's one
  queue holds her choice (`holdAtDoor`) and nothing goes up while a door holds her (the runner stops while `doorOpen`
  is false, so her waiting ticket is never sent on); the door's opening starts it, on the same row the host just let
  in. ★ **Her choice outlives the tab, as this account's alone**
  ([`door/wait-picks-store.ts`](../../src/components/guest/door/wait-picks-store.ts)): a copy waits in this browser's
  IndexedDB for `KEEP_DAYS` (14), filed under the album and the account that made it (`doorOwner`), so a choice that
  is not this account's is put down unread, never sent under someone else's name on a shared device. A held door
  that comes back after a reload puts it back in the queue, and a page that opens on the album with one waiting for
  this account (the let-in mail's link) sends it, once; it is put down the moment she is let in, the door reads
  `moved` or she switches address.
  ★ **Only a door the host answers holds an ask**: the moment an album takes a password, every ask at its door ends
  (`events_door_to_password`, on every path to a password; never a row an upload names), because a password lets in
  whoever proves it and nobody waits on the host there. Her held door reads `moved`, she meets the password like
  anyone new, and her phone, finding its ticket gone (`invalid_session`), puts it down and joins afresh at its next
  upload. Closed and Only me keep their asks: the host may still answer them. Both mints of an ask (`create_guest`,
  `ask_to_join`) read the door under the event row's share lock, which every move of the door waits on, so an ask
  minted in the instant the door takes a password, turns Public or becomes the list is ordered against the move:
  the move's trigger meets it, or it meets the door the move left.
- **`newcomer {gate}`**, no confirmed email yet at approve or invite: the door's own steps (the welcome, the email)
  with no teaser; the welcome counts what is inside, as a password album's does. Confirming asks at approve and lets
  in an address the list names.
- ★ **The upload reads the door as its ticket sees it**: `get_upload_context` answers `visibility` `open` for a
  ticket past a gated album's door and `private` for a waiting, declined or blocked one, so the presign and complete
  routes' `private` refusal covers every shut ticket with no new branch. `accepts_video` (the host's Videos switch
  and the plan) is the album's own answer on `get_event_by_qr_token`: the picker's kinds, the terms line and the
  reel's clip Add follow it, and `video_blocked` refuses what gets past.
- **`password`** → access `none`: the doorway at rest under the door's password step, showing the album's name and
  its real "N photos & videos inside" count (the name is link-shared, not the secret) and nothing more, no media URL
  at all, until a signed unlock cookie is present; then the rest of the door.
- **`open`** → the full experience, unless a gate applies (see "Gallery access"). The OG description is one invitation
  for every open event, "Photos and videos from the day. Add yours.", and never warns about the email step: the gate
  stays honest where it happens, at the door, at the known cost of some guests bouncing there.
- **The link's image** is the event's card, drawn by [`card/route.tsx`](<../../src/app/(guest)/e/[token]/card/route.tsx>)
  at `/e/<token>/card` (a private or unknown event draws the generic card) and named by `generateMetadata` from
  [`event-card.ts`](../../src/lib/guest/event-card.ts). ★ **One answer per address, whoever asks:** the card is public
  for an hour and the edge serves its copy to everyone, so it follows the event's own visibility, read with no caller
  (`getEventCardName`, the anon client), never the request's session, cookie or ticket, and every closed door (a
  private album, a viewer a block masks) names the private album's card instead (`?private`, generic by its address
  alone), so the two pages carry the same image. `/e/<token>?photo=<id>` (read with the viewer's own
  `readPhotoParam`) unfurls as that photograph (a preview or the original, presigned server-side; a video as its
  poster), but only on an album anyone may open (`resolveGalleryDecision` for an identity-less visitor is `full`) and
  only for an approved item of this event (`getOpenAlbumItemForCard`): a gated album, any other id, a video with no
  poster and a failed presign all keep the event card, with no sign the id exists. It is a route, not an
  `opengraph-image` file, because a file-based image outranks `generateMetadata` and the image depends on the query.
- **`accepting_uploads=false`** = the view-only state of the one page: the upload panel is removed ("The host has
  closed uploads. You can still browse the album."), leaving the action row and the gallery.

## Gallery access: `none` / `teaser` / `full` (the gated VIEW)

The server answers a DECISION, not just a level:
`resolveGalleryDecision(event, {isOwner, isAuthed, isUnlocked, hasContributed, canContribute}) → {access, gate}`
([`gallery-access.ts`](../../src/lib/events/gallery-access.ts)), pure and unit-tested. `teaser` has TWO
causes, so the gate (`"password" | "account" | "upload" | null`) says which door the step machine shows.
The order is the door's: owner → `full`; an unproven password → `none`/`password`; verified emails
required and none confirmed → `teaser`/`account`; an upload required that this viewer could make and has
not → `teaser`/`upload`; else `full`. `hasContributed` and `canContribute` have NO defaults, so no caller
can forget the gate: one caller (`/api/export/guest`) hands out real bytes, and a defaulted context would let a
held guest zip every original.

ONE server entry, `resolveViewerDecision(event, {isOwner, isAuthed, isUnlocked, userId, sessionToken})`
([`gallery-access.server.ts`](../../src/lib/events/gallery-access.server.ts)), answers the page, the poll and
`/api/export/guest`. It resolves ONCE assuming a contribution (short-circuiting
the upload clause), and only when that lands on `full` with `require_upload_to_view` on and uploads open
does it call `getUploadGate` ([`guest-gate.ts`](../../src/lib/db/queries/guest-gate.ts), the service-role
`get_upload_gate`) and resolve again, so a locked event and an unconfirmed viewer cost no extra read.
`isAuthed` means a CONFIRMED email (`user.email_confirmed_at`), never a bare `user.id`.

★ **THE ALBUM'S READS KEEP A SECOND GATE, AND ITS REFUSAL IS LOCKED, NEVER A THROW.** `album-guest.ts` lets a
password album through for the unlock cookie or the host (the page's own owner answer), so a null after a
`teaser` or `full` decision is the two gates disagreeing: the seed and the sync, links and manifest routes answer it
locked behind the password (`ALBUM_REFUSED`) and report it (`reportAlbumRefused`, Sentry `security`); an empty
manifest page never says `full`; a read that fails is still a failure.

- **`full`** — the whole gallery: the owner (host), the demo, and any viewer past every gate that applies.
  ★ **READ WHOLE, IN ONE ORDER, BY EITHER ARM** (the silent 1,000-row cut, `read-all.ts`): both arms walk keyset
  pages on the display order (`created_at desc, id desc`) with the last row's RAW `(created_at, id)` as the cursor:
  the open album through `get_event_media_by_qr_token`'s `(p_before_created_at, p_before_id, p_limit)`
  ([`guest-events.ts`](../../src/lib/db/queries/guest-events.ts)), the unlocked password album through the same cursor
  as a table `.or()` (`olderThan`, `getApprovedMediaForUnlock`). The pages concatenate in order, which the grid, the
  reconcile and the ETag all keep.
- **`teaser`** — the newest `TEASER_LIMIT` (9) approved PHOTOS + the true total; the rest withheld. Shown to
  a viewer with no confirmed email on a `require_verified_email` event (gate `account`), and to a guest who
  owes a first upload on a `require_upload_to_view` event (gate `upload`). The confirmed email, or the
  photograph, buys the rest.
- **`none`** — nothing real. A password event BEFORE the unlock cookie (gate `password`). The privacy rule:
  real teaser photos appear ONLY once the password is proven (never before it).

★ **THE UPLOAD GATE FAILS OPEN, AND THE FAIL-OPEN IS THE SERVER'S.** `canContribute = accepting_uploads && !albumFull`,
where `albumFull` is exactly the pair the presign ladder refuses `cap_reached` on (the storage cap plus its 10%
write headroom, or the uploads allowance), carried verbatim by `get_upload_gate`, so the gate never holds a guest
the presign would refuse. An unreachable `get_upload_gate` resolves to `{contributed: false, albumFull: true}`
with a captured warning, which opens the album. ★ **OWN DELETES CLOSE IT**: an upload counts whatever the host
does to it (pending, approved, hidden, or removed by
the host, an admin or the system: a door that re-closed on the host's curation would leak it to the guest), and
stops counting once the guest removes it themselves (`removed_by_uploader`, a Not mine in the claims review included).
So a guest who uploads, looks and deletes has not contributed, and the door is theirs again. The EMPTY album still
holds the gate (no count condition), and the host never meets it. `require_upload_to_view` is OFF by default and
free on every tier.

★ **THE SERVER HAS TO KNOW WHICH GUEST IS ASKING**, which localStorage cannot tell an RSC. The
`pr_guest_<eventId>` cookie ([`session-cookie.ts`](../../src/lib/guest/session-cookie.ts), whose header gives its
attributes and why) carries the raw session token, unsigned: the database verifies it against
`guests.session_token`'s unique index. It is written only when absent or different, by `POST /api/guests` (a mint),
`POST /api/guests/name` and `/email`, `POST /api/r2/complete-upload` (a created row, `CreateRecordOutcome.setCookies`,
on the 200 alone) and the album's sync's heal, **only as a 200 with no ETag**, because Vercel's edge turns a
validator-matching 200 into a 304 and drops `Set-Cookie`. `POST /api/guests/leave` expires it (`{ qr_token }` one
event's, `{ all: true }` every `pr_guest_*` the request carried). ★ **EVERY SIGN-OUT PUTS DOWN EVERY TICKET ON THE
DEVICE**, the tokens, names, address flags, the name prefill and the welcomes with the cookies (the guest page's menu
through `leaveAllGuestSessions`, the app's through `forgetGuestTickets` and `signOutAction`,
[`session-cookie-family.ts`](../../src/lib/guest/session-cookie-family.ts)), so a shared phone never renders the full
album, or uploads, on the last person's ticket (the owner rule is the guarantee; this is the courtesy). ★ The write
routes (name, email, mine, remove, presign, complete) read the token from the body only, pinned by
`session-cookie.test.ts`, so the CSRF surface does not move.

★ **The withheld set never reaches the browser**: the teaser is a capped server read (`getApprovedPhotoTeaser`,
self-guarded by visibility, photos-only, `count:'exact'` for the total), not a CSS blur over a loaded gallery, so
dev-tools or a direct poll call can't reveal it, and the poll enforces the same decision, since gating only the RSC
would be a trivial bypass. The guest-facing gate is the door (below).

★ **ONE TRUE COUNT, EXACT AND LIVE, READ THE SAME WAY EVERYWHERE IT IS SAID.** A count is counted, never a
list's length: the loaded teaser is capped and photo-only, and neither its count nor the photo-only `teaserTotal`
is the album's size. Every gallery payload (the render's and each poll's 200) carries `approvedTotal`,
`countApprovedMedia`'s head count (photos and videos), and the ETag hashes it, since a video landing behind an
unchanged nine moves nothing else. `GalleryLiveProvider` reports that number plus what this device changed since it
arrived (`albumCount`) through `onCountChange`, at `teaser` and `full`, and the CTA ("See all N photos & videos") and
the door (its `mediaTotal`) say the same number. The count names what the album holds where the source sees all of it
(a full answer: `albumCountWords`, in `lib/export/take-home.ts` over `setNoun`, the one home every set shares, "12
photos", "58 photos & videos"), and the page's first paint names it the same way at `full` from the server's own count
of the kinds (`stats.kinds` into the cover's `mediaKinds`, through that one function), so the cover never says both
nouns for the beat before the live album tells; where it cannot see in (a teaser, a lock, an unread album) it says
both, the first paint included, and one such item reads "1 photo or video"
(`formatMediaCount`), never a "photo" that may be a video. A payload without `approvedTotal` (an older server
mid-deploy) falls back to the shell's `stats.approvedTotal` at `teaser`, then the photo-only `teaserTotal`. At `none`
no gallery mounts and no poll runs: the lock line says the render's head count.

## The ARRIVAL (the door: the doorway, its held sheet, then the album)

The arrival is the guest's first experience (she comes off a QR with no context), on the "Calm + 700ms" choreography
([design-system.md](design-system.md)): the door she meets from the first byte (the stage), or her album where she
owes nothing; the welcome; the steps, in a sheet; then the album, walked into through an open door or risen into as a
gate's sheet goes.

**The door family: one doorway, its leaf the state.** [`door/doorway.tsx`](../../src/components/guest/door/doorway.tsx)
(`doorway.css`) draws a door standing on the page: OPEN on a welcome she may walk through (the album's own cover
through the opening, the page's `CoverPicture`), AJAR while the host decides, SHUT wherever the door is not hers to
open, and an EMPTY FRAME on a link that opens nothing. Its light is the album's only where she may see the album (a
Public album's welcome, the moment she is let in); everywhere else it is the house five, and a photograph is only ever
drawn through an open door. A door that is not open turns slowly through the hues from a phase the server draws per
door (`doorPhase`), so the first byte and hydration agree; reduced motion stands it still. Every door screen stands it
in one page ([`door-page.tsx`](../../src/components/guest/door/door-page.tsx), the door at one height, so a door whose
words change under her never moves): the shut door, the broken link's page (`e/[token]/not-found.screen.tsx`, the
doorway empty) and the album's stage ([`door/stage.tsx`](../../src/components/guest/door/stage.tsx)).

**The stage is the door as the album's page**: the steps a guest reads AT the door stand on it (the welcome, the
demo's role step, the ask, the wait, and the beat when the door she waited at swings open). It is a modal layer
(`role="dialog"`, named by its headline, so `layer-is-up.ts`'s waiters see it) over `EventExperience`'s box, which is
`inert` under it; the page holds to one screen while it is open (`doorway.css`), and the stage is unmounted after it
leaves (`STAGE_EXIT_MS`). The steps that ask something of her rise as the SHEET: over the album she walked into at a
Public album, and at a gate over the door at rest (`STAGE_SCRIM`, a light dim, so the door keeps its state above the
sheet).

★ **THE FIRST BYTE IS THE DOOR**: the album is never visible before a door or gate she must meet first, a trap every
client-side decision falls into. The page decides on the server what its first byte draws (`doorArrival`,
[`entry-steps.ts`](../../src/lib/guest/entry-steps.ts), `computeDoor` over what the request carries: the welcome's
cookie, the ticket cookie standing for a name and a return, a confirmed account's profile name): the stage on its face
(the welcome, the role step, the ask, the wait, a gate's door at rest), or the album behind the door's own scrim where
a sheet step comes first (the email step past the welcome, the name, the first photo), which the sheet rises into with
no fade of either (`arriving`); a returning guest who owes nothing lands on her album at once. `EntryModal` is in the
page's own bundle, its stage server-drawn and only its sheet after hydration; where the server's reading of this
browser turns out wrong, the door corrects after hydration (a scrim that owed nothing lifts; a sheet it could not
foresee rises over the album), never toward the album for a newcomer, who holds no ticket. Pinned on the server render
for every door: [`page.first-paint.test.tsx`](<../../src/app/(guest)/e/[token]/page.first-paint.test.tsx>) (the
decision per door) and
[`event-experience.first-paint.test.tsx`](../../src/components/guest/event-experience.first-paint.test.tsx) (what that
decision draws).

**Through an open door she walks** ([`door/stage-walk.ts`](../../src/components/guest/door/stage-walk.ts)): on a
Public album's Continue and the moment she is let in, the door's page is a camera pushing into the doorway, landing on
the album's own cover (the head's box, measured at the press). The page's own work waits for the walk's first frame
(`Walk.started`, which in a tab put away mid-walk can come after the page has already arrived); while she walks, the
album's words wait under the reveal curtain (`[data-arrive]`, `[data-door-below]`, `door.css`), and a step the door
still owes rises after she lands. Under reduced motion, or wherever the walk cannot land (no head laid out, nothing
measured), the stage fades where it stood. A password's door is shut, so its unlock keeps the sheet's own reveal.

**The door is an itinerary, and it has no exit.** The doorway and one held sheet carry the welcome, the password when
the event has one, the name, the email (held until confirmed) when the album asks for an email first, and the first
upload asked, and then the album. The album is the reward the door's asks pay for (its cover through the open door at
the welcome, blurred behind the sheet after it, the capped teaser wherever a server gate holds), so there is no "just
browsing" way past it: every step is HELD (no X, no drag handle, Escape and the backdrop inert). `computeDoor`
([`entry-steps.ts`](../../src/lib/guest/entry-steps.ts), pure and unit-tested) derives the ordered steps from the
server's `{access, gate}` plus this browser's own facts (welcome seen, a name, a contribution, "returning" snapshotted
at hydration), because the server can see the password, the email and the welcome's cookie and cannot see whether THIS
browser typed a name. A server gate is TERMINAL for the steps behind it: the resolver has no opinion past an unmet
password or email, so the itinerary stops there and re-derives on that step's refresh. The current step is always the
itinerary's first; server steps advance through the RSC's refresh and client steps through flags in the sheet, so
there is no step counter to desync.

The steps are `welcome | password | chooser | name | identify | signin | upload | keep`, the keep last and only when
due; names mode opens on the chooser (Continue as guest → `name`, Create account → `identify`, Log in → `signin`),
verified mode on the email alone (`identify`, "Joining + identity"), and the demo asks no name.
The order per mode is `entry-steps.ts`'s, pinned by its tests. The one FREE surface is the name door over the album,
from the menu's "Change name" (`openToName("edit")`): it stands over an album the guest already reached and posts
nothing when it closes. The teaser's "See all N" re-asserts the sheet (`openToGate`, a no-op mid-hold).

One shell ([`entry-shell.tsx`](../../src/components/guest/entry-shell.tsx)) renders the one product Sheet
(`SheetContent responsive`) at both widths: a bottom sheet in a hand, keyboard-safe
([design-system.md](design-system.md), the floating layer), and from 640 up a full-height panel from the right edge
rather than a centred float, so more of the blurred album stays in view: that preview is the incentive the door runs
on. **The door is lit** ([`door/lit.tsx`](../../src/components/guest/door/lit.tsx)): `DOOR_SCRIM` is the lightbox's
ground at a gentler dim, and a lamp on the sheet's free edge wears the hues of the album's newest previews
([`door-light.ts`](../../src/lib/guest/door-light.ts), `door/album-light.tsx`), sampled inside the page's live
provider (so nowhere the album does not reach her, a password door included) and only while a lamp is lit, since a
light nobody is looking at is not worth a dozen previews an arrival; until a sample lands, and wherever none carries
colour, it is the house five. The open doorway registers as a lamp, so its light is the same sample.

- **The arrival beat** ([`use-arrival-beat.ts`](../../src/lib/guest/use-arrival-beat.ts)) delays only the sheet's
  auto-open, so the page settles first (the door's page stands from the first byte); a re-assert (`openToGate`) is
  instant.
- **welcome, the invitation**, at the doorway ([`door/welcome.tsx`](../../src/components/guest/door/welcome.tsx)):
  open onto a Public album, shut at a gate; the byline as the door may show it (the redacted `shellEvent`), the live
  count (`LiveCount`), one primary that always reads "Continue" (something always follows it) and the legal consent
  line. Shown once per PERSON at an album: the `pr_welcome_<qrToken>` cookie (a year, not HttpOnly:
  [`use-welcome-seen.ts`](../../src/lib/guest/use-welcome-seen.ts) writes it and puts it down), which the page's server
  reads (`welcomeSeenIn`) so the welcome is the first byte and its hydration agrees; the demo's is never written. It
  goes with the ticket of whoever saw it (a ticket put down takes its album's, every sign-out every album's; the door's
  name step keeps it when it puts a foreign ticket down, its person having just passed it), because the door's identify
  and sign-in steps carry no consent line and lean on it, so the next person on a shared phone meets it once.
- **The continuous step container**
  ([`entry-step-transition.tsx`](../../src/components/guest/entry-step-transition.tsx)) carries every step change; its
  exit clone tells a real deletion from a dev StrictMode cycle by `el.isConnected`. The back chevron is a transient
  view over the machine (it never touches `markSeen` or the steps): the password, the name and the email go back to
  the welcome, the upload to the name (the demo's to its role step). The revisited welcome's primary still reads
  "Continue", since back is not bidirectional; only the chevron's label says "Back to X".
- **The success hold and reveal** ([`use-success-hold.ts`](../../src/lib/guest/use-success-hold.ts)) plays once, on
  the step the album is directly behind; an earlier step's success hands forward with no beat. A password unlock blurs
  the field (the keyboard retracts during the beat, never mid-exit) and fires `onUnlocked` and `router.refresh()`
  together. Release is the beat done AND the refresh landed (`current` moved off the held step). A full unlock exits
  the sheet through an `animation-duration` override (vaul's close is a keyframe, not a transition) while the reveal
  curtain lifts (`[data-reveal-curtain]`, `onHoldingChange`), so the album cascades in as the sheet exits, never
  invisibly behind it. It never strands: a slow refresh says "Opening the album", and a watchdog offers a Retry (the
  unlock cookie is set, so the form never re-enables).
- **The upload step lives in this sheet** ([`upload-step.tsx`](../../src/components/guest/upload-step.tsx)): it
  renders the add sheet's own body (`UploadIntentBody`), so the hidden inputs sit inside the open dialog and Safari's
  synchronous `.click()` still opens a picker (a sheet over a held sheet would be two things to dismiss, one
  impossible). It sends into the page's one queue; the first completed item (approved or held) flips the client's own
  `contributed`, and the run finishes behind the album's head (the step is not held for the rest of the run, by
  choice, Will's to overrule: she is let into the album at the first landing, where the stack carries the rest with its
  count and its x, the one place a file can be stopped, and the keep waits for the whole count). That client flag stands only until the server has
  answered since it (`contributionAnswered`, [`entry-steps.ts`](../../src/lib/guest/entry-steps.ts)): the server can
  take a contribution back (the guest's own delete), and from the first gate seen off `upload` the server's gate alone
  decides, so a later `upload` gate puts the door back with its upload step, never a teaser with no way through. The
  fail-open is the server's: when a run ends with nothing completed and every refusal is one the guest cannot fix
  (`classifyRun`), the step shows the server's sentence and "Continue without adding", which refreshes and trusts the
  decision that comes back, never a local skip (the server would still answer `upload`: a loop). Its words promise the
  album only where the upload opens it (A photo first); over an album that shows nothing and waits they say the wait's
  own rule (`waitRule`, the host unnamed) in place of "the first photo", since a teaser never reads whether photos wait
  (`waitingOnArrival` is a full-access read) and how uploads wait is true over either. Elsewhere the album is already
  open, and a ghost skip shows once per pass, never on the failure view. With A photo first on there is no skip, and `computeDoor` ignores `skipped`
  and `returning`, so a stale flag cannot open an album. On a camera album the step is the camera's
  ([disposable-mode.md](disposable-mode.md)).
- **The flip and the drift.** The completion route writes the session cookie on its own response, every landing's
  `notifyUploaded` refetches the poll, and the poll's looser decision refreshes the page onto `full` (`key={access}`
  remounts the gallery). `GalleryLiveProvider` raises `onAccessDrift` once per changed `access`/`gate` from the poll: a
  looser drift refreshes at once; a stricter one (a switch turned on while the guest is inside) never yanks an open
  album from under a thumb: the provider keeps its own items and count as mounted (the album and the reel alike), and
  the shell spends the drift on the guest's next Add. A browser holding a localStorage session token but no cookie
  heals once at mount when the gate is `upload`: one poll POST carrying the token (no `If-None-Match`), the auto-open
  waiting on the answer, then a refresh if the gate came back other than `upload`.
- **No door field autofocuses**, at either width (a source test pins it): the iOS keyboard ambushes a sheet still
  moving, so a keyboard rises on an intentional tap, and the code field takes focus only from a field that held it when
  the code was sent. Door inputs are 16px, below which iOS zooms on focus.

## Invariants (don't break)

- ★ **A PERSON IS A GUEST OF AN EVENT ONLY THROUGH AN UPLOAD OF THEIRS**: a password entered or an account
  confirmed without an upload lists nobody, one photograph makes a guest, and deleting every upload of theirs
  removes them again. A LIVE upload is one whose `media.status` is not `removed` (pending, approved or hidden),
  whoever removed it. What OTHER people see needs an APPROVED one: the guest list, the Guests room, every guest count
  and a profile's "guest at" line, all read through ONE function (`getEventGuests`,
  [`event-guests.ts`](../../src/lib/events/event-guests.ts): a confirmed guest once per person, a named unconfirmed one
  once per row, never the host, never a nameless row, never a person the host blocked from the event). The account's
  OWN list of the events it added to takes any live one ([host-app.md](host-app.md), the Guest cards). A `guests` row
  stays what it is, the device's upload ticket minted at the door: nothing reads a row as attendance, and there is no
  save. A clip added to the album is an upload like any other.
- ★ **THE HOST SEES A CONFIRMED GUEST'S ADDRESS, under the name, in the host's viewer and in the Guests room**, and
  never an unconfirmed one: the viewer's uploader credit (`getUploaderIdentities`, the email line) and the room's
  list and names panel (`GuestList`'s host-only `emails`, read by `getConfirmedGuestAddresses` in
  [`guest-addresses.ts`](../../src/lib/db/queries/guest-addresses.ts), which proves the host itself and reads
  `guests.email` on `verified_at` rows only; the room is its one importer and the album never passes `emails`, both
  pinned). The address IS the safety An email first promises: anyone can confirm any inbox, so a bare "verified"
  badge would imply far more safety than it gives, and the host must see WHICH address was proved. A guest never sees
  another guest's address: that would turn a safety feature into a privacy leak, and the host alone takes on vetting
  them.
- **A link, and an event password, are BEARER credentials.** Possession is the authorization, which is the
  intended sharing model: whoever holds the link acts within whatever the configs allow, and a password
  handed round a party is as shared as the party. So a surface may never leak one (no token in an OG tag,
  a log line, a referrer or an analytics row), and the defenses that matter are the ones that survive a
  leaked link: the config gates (the door's password, gates and Only me, An email first, A photo first,
  uploads closed), the per-request re-checks, and the host's own switches, which shut a leaked link's door
  without moving it. The link itself never rotates: the `qr_token` is printed on every QR, so it is
  permanent by design (a custom slug is a mutable alias to it, never a replacement).
- **The anon media RPCs gate on `visibility = 'open'`, NOT `<> 'private'`.** A password or gated album's media must
  never stream through `get_event_media_by_qr_token` / the anon path; it is served only via the server admin-reads
  (`getApprovedMediaForUnlock` and the paged album's reads, `album-guest.ts`), each self-guarded by the unlock cookie,
  the door's pass or the host (`isRequestOwner`). The bcrypt hash never reaches a browser: guest RPCs expose
  `has_password` only, and the server reads the hash only to derive `has_password` and the cookie's version.
- **The unlock cookie is a signed HMAC of `{eid, exp}` and the event's password version** (`UNLOCK_COOKIE_SECRET`,
  12 h; the version is a sha256 of the stored bcrypt hash, read server-side once per request, never in the cookie), so
  any `set_event_password` (a fresh salt, even for the same word) or `clear_event_password` signs everyone out; the
  unlock route reads the state before the bcrypt check, so a change landing mid-unlock can only fail closed, and a
  failed read fails closed and is reported. The signed eid, not the cookie's name, is the boundary, and it fails CLOSED
  when the secret is unset. The password is set or cleared ONLY by `set_event_password` / `clear_event_password`
  (host-auth SECURITY DEFINER; the column is revoked from the host UPDATE grant), which own the state as well as the
  hash: `set_event_password` is the only path INTO `visibility='password'` (it flips hash and state atomically, which
  keeps the `events_password_requires_hash` CHECK satisfiable), and `clear_event_password` reverts to `open` only FROM
  `password`, never turning a `private` event public.
- **The page calls `getUser()` for every non-private, non-demo event**, because the gates must know whether the viewer
  holds a confirmed session. With no session it is a cheap LOCAL null (no network), so an anonymous crowd behind one
  venue-NAT IP does not each pay an auth round-trip. The owner check (`isRequestOwner`, then `isEventOwner`'s explicit
  `host_id = uid` match, `gallery-access-owner.server.ts`) runs only when signed in, and the album's reads, its routes
  (`requestOwnerAnswer`: the same answer with its user, one `getUser()` for both) and the upload seams ask the same
  answer, so no gate on the page can disagree about the host.
- **The upload slot is `full`-only**: a `teaser` or `none` viewer is still at the door, which owns every step in front
  of them, and a confirmed account with no profile name is asked there (`needsName`, the name step's `profile` mode),
  never in the album.
- **A guest's own-photograph removal is never a client claim, and never a client list.** The two RPCs decide
  ownership inside themselves (`auth.uid()`, or the session token matched against the media's own guest row, which
  must belong to the media's own event, on an event that is not deleted), and the "mine" list that decides whether the
  control appears is a server read on both paths ("A guest's own photographs", below). Three things must stay true:
  `anon` never gets EXECUTE on `remove_my_upload_by_session` (service-role only, reached through `/api/guests/remove`
  behind the join limiter); a session token never travels in a URL; and a guest row with `user_id` set is untouchable
  by the session path, so a shared phone's stale token can never delete a signed-in person's photograph. A withdrawal
  is final for the host too ([lifecycle-recovery.md](lifecycle-recovery.md); `media.test.ts` pins the host reads
  against a withdrawn row), so the guest's confirm names no window ("It's deleted from the event right away and can't
  be recovered."): a number of days would read as a hold the host can still reach.
- ★ **UPLOADS ARE HELD TO THE SAME OWNER: a guest row with `user_id` set writes only for that signed-in
  account, and a signed-in account writes only through a row of its own.** Presign AND complete (a presign
  outlives a sign-out or a sign-in), rename and attach-address ask `checkSessionOwner`
  ([`session-owner.server.ts`](../../src/lib/guest/session-owner.server.ts): the row's `user_id`, service-role and
  never returned, against `getUser()`, which answers locally with no session, so the signed-out crowd pays no round
  trip) and refuse anyone else with 403 `session_other_account`, under the lock and closed uploads and ABOVE the
  identity gate, since a confirmed row's own `verified_at` would otherwise let a stale ticket upload past An email
  first. A confirmed row whose account was deleted (`user_id` nulled by the FK, `verified_at` kept) writes for nobody.
  A name-only row is the device's ticket while nobody is signed in; for a signed-in account it is asked of the claim
  then and there (`claim_anonymous_uploads` on that one ticket, as her: `whose_ticket` takes it when it is hers) and
  refused when the claim leaves it, since a sign-in rightly leaves other people's tickets on a shared phone, and her
  photos would otherwise go up under the typed name of whoever held it before her. The client's side is the upload
  act (above).
  ★ **THE READS FOLLOW THE WRITES** (`sortTickets`, the same file): every read that carries a ticket beside
  a signed-in account keeps only the tickets that may speak for her (her own rows, or one the claim takes; signed out,
  every ticket is the device's and nothing is read), because another guest's name-only ticket on a shared phone would
  otherwise stand for her: the door's standing would count her let in, waiting or held through it, A photo first its
  contribution, and her Yours (the export's own ids, her tracker's statuses, `/api/guests/mine`) its photographs. The
  album's own filter reads no ticket for her (`LiveGallery` asks `/api/guests/mine` only while signed out). A failed
  sort sets every ticket aside and is captured, never thrown; a block on a ticket set aside still holds the phone.

## Joining + identity

**Every upload carries an identity, and the host's switch decides which kind.** It is
**`events.require_verified_email`** (An email first), ON by default: on, a guest confirms an email before the full
album and any upload; off, a guest types a display name at the door and uploads under it with the unverified mark. It
is the one identity switch.

★ **THREE LEVELS OF TRUST, AND A ROW IS AT EXACTLY ONE.**

1. **A typed name.** The public mark's word is **"Unverified"**, never "name not verified": names are never verified
   for anybody, only emails are.
2. **A typed name and an address nobody has proved**, in its own `guests.pending_email` column and **inert**:
   never shown to the host or to another guest, never attributed to any account, never mailed on its own,
   never expiring. It is a name with an invisible claim number, so the PUBLIC mark is identical to level 1
   (a mark that changed would announce that an address exists); only the guest's own menu says "Email not
   confirmed". A member's address is accepted like any other, so there is no enumeration oracle
   ([auth-accounts.md](auth-accounts.md)). Once confirmed, the address claims its rows from the dashboard's claims
   review, one event at a time ([dashboard.md](dashboard.md)).
3. **A confirmed account**, the only identity that uploads as itself.

One gap is accepted: on a names-mode event anyone can type any name and any unproven address. An unconfirmed address
is inert, so a false one borrows nobody's identity; a host facing a risky crowd picks a gate (An email first) or
moderation, and an address's owner disowns what was not theirs in the claims review.

The address is one optional field under the name, in `join` mode only: it adds no step (`computeDoor` does not know it
exists), and it is never prefilled, since a carried address would show the last guest's to the next on a shared phone
(the name's cross-event prefill is a kindness). A fresh join sends it in one post; a held session renames, then
attaches on `/api/guests/email`. The client parses through `checkGuestEmail` ([`join.ts`](../../src/lib/guest/join.ts))
so a typo is refused under its own field, and both forms (the name step, the add-email dialog) carry `noValidate`: a
native `type="email"` field otherwise lets the browser block the submit with its own bubble before `onSubmit` runs, and
the name never goes either.

★ **NOTHING EVER STORES THE ADDRESS ON THE DEVICE.** The routes answer `email_attached`, a boolean;
`pr_guest_email_attached_<qr>` holds `"1"`; the address itself lives in `EventExperience` state for the
visit, only to prefill the offer card's door, and `collectStoredSessionTokens` never scans the prefix.

**The name is asked before the album, never at the first Add**, since a guest who reached the album first would reap
it anonymously and meet the friction only when contributing. `guest-name-step.tsx`'s modes: `join` (names mode, the
only one with the address: rename a held row first, else mint under the typed name), `edit` (the album menu's, the one
dismissible door) and `profile` (a confirmed account with no profile name writes the PROFILE's; the shared
`SetNameStep` serves the host's `/welcome` and the Library's demo).

★ **THE CONFIRMATION'S FOUR WRITES, IN ORDER, ARE THE MODAL'S**, shared by `identify` (Create account's name and
email to a code; at a verification event the email alone) and `signin` (Log in, the email alone). `entry-modal.tsx`
owns the sequence because the door holds a name never sent anywhere, and the order decides whether a guest lands named
or with no name at all: claim this browser's anonymous uploads → `joinEvent` (verified and NAMELESS, since
`create_guest` nulls a typed name beside a confirmed account) → one own-row read of `profiles.display_name` → when null
and a name was typed, `updateDisplayNameAction` → hold the beat → refresh. The account's own name wins over a typed
one, and the door says so above the field before she confirms; the name the account then carries is told once, with
a Change. The typed name also rides the code request as `DOOR_NAME_KEY`, so a magic link opened elsewhere lands named
(`adoptDoorName`, [auth-accounts.md](auth-accounts.md)).

- **The join carries the identity:** `POST /api/guests {qr_token, display_name?, email?}` → `create_guest`
  issues a `session_token` (localStorage, returning-guest) and returns
  `{display_name, verified, email_attached}` as the row was minted, never an echo of the request, so the
  door believes `email_attached` over its own form (a verified-required event and a confirmed session both
  null the field). The route owns the refusals: 422 `verification_required` (the switch is on and nothing was
  proved), `name_required`, `name_invalid` (over 60, a reserved name, or profanity, checked server-side
  because the obscenity matcher must never ship to a browser), `email_invalid`. `create_guest` is the belt under the
  route's name check: it refuses a nameless mint by an UNCONFIRMED caller and mints a confirmed joiner nameless by
  design, deriving identity (`user_id`, `email`, `verified_at`) from the trusted uid, never the client.
- **Attaching an address afterwards:** `POST /api/guests/email {qr_token, session_token, email | null}`
  over the service-role `set_guest_pending_email` (its own `attach_email` limiter) answers
  `{email_attached}`, never the address. Callers: the door's held-session path and the header menu's Add
  your email. A verified guest is refused (403: their address is their account's). An explicit `null` or a blank
  detaches (the add-email dialog's removal, behind `PENDING_EMAIL_REMOVABLE`). The dashboard's "Not mine" is a
  different act: `disown_guest_rows_by_email` removes that row's uploads and detaches the address.
- ★ **VERIFIED MEANS `guests.verified_at`, NEVER A `user_id`.** An unconfirmed sign-up carries a real
  `user.id` and keeps its typed name, so `user !== null` is not the test: the route reads
  `user.email_confirmed_at`, and `create_guest` stamps `verified_at` from `auth.users` itself (a proved
  claim stamps it too; the two address columns: [database-security.md](database-security.md)). The one precedence
  rule ([`uploader-identity.ts`](../../src/lib/media/uploader-identity.ts)) reads the same way: the host first; then a
  row with `verified_at` set shows the PROFILE's name, verified; else the typed `guests.display_name`, unverified; else
  no name at all (a row minted before names were asked), which credits nobody.
- **Naming a row afterwards:** `POST /api/guests/name {qr_token, session_token, display_name}` over
  `set_guest_display_name`, for a nameless row or a new name; its own limiter kind (`rename`), tighter than
  `join` and still venue-sized. A verified guest is refused (403): one row never carries two names. ★ **A
  HELD SESSION TOKEN ALWAYS TRIES RENAME FIRST, WHICHEVER DOOR OPENED IT.** `guest-name-step.tsx` calls
  `renameGuest` whenever a session token is held, so a device with a session but no local name never mints a
  second row and strands the first one's photographs with no name; it falls back to `joinEvent` only on
  `invalid_session` (a dead token), `unauthorized` (a verified row: the route, not the component, is the truth) or
  `session_other_account` (an account's row the viewer is not, whose ticket goes down first).
- ★ **THE GATE IS RE-CHECKED ON EVERY UPLOAD, NOT ONLY AT THE JOIN.** `get_upload_context` carries
  `require_verified_email` + `guest_verified`, so presign and complete both answer 403
  `verification_required` (with a `captureWarning`, so a flip mid-party is visible) rather than letting a
  session minted before the switch moved upload forever; `create_media` stays authoritative and its refusal
  maps to the same code.
- ★ **ONE ACCOUNT, ONE TICKET AT AN ALBUM; a typed name, one ticket a join.** A confirmed account's join
  (`create_guest`, and `ask_to_join` at a list) answers the ticket it already holds there at the admission the door
  gives it (its newest proved row no block holds, `event_account_ticket`), read under a lock on the album and the
  account, so two joins of hers that race (a shared phone's queue and the page's own) answer one row, and her second
  device holds the same ticket as her first; the client also asks a nameless join once at a time (`joinEvent`). For
  a typed name the localStorage `session_token` is the dedupe, and `guests` has NO unique `(event_id, user_id)`: an
  account is optional, two people may type one name, and a claim can take a typed name's rows onto an account beside
  its own.
- **Supabase anonymous sign-ins stay OFF.** Capability tokens already give a guest immediate, scoped use,
  so a per-scan `auth.users` row would be pure DB bloat, and an anonymous session carries no email to
  satisfy the gate. The account layer augments the guest flow and never replaces it: the contribution
  pipeline runs identically whichever identity the uploader carries.
- **The door's verification step is `identify`**: the email alone over
  [`<EmailSignIn>`](../../src/components/auth/email-sign-in.tsx)'s emailed code (one path for a new or an existing
  guest), with the teaser behind, then a name only for an account with none, so an account keeps one name rather than
  a typed one per event; Google and the password link live under the chooser's Log in
  ([`<AccountDoor>`](../../src/components/auth/account-door.tsx)'s `signin` wear).
- **Claiming anonymous uploads on sign-in:** an anonymous upload is a `guests` row with `user_id IS NULL`
  whose `session_token` the browser still holds (`pr_session_{qr_token}`). On sign-in,
  [`claim-uploads.ts`](../../src/lib/guest/claim-uploads.ts) enumerates those tokens (the shared
  `SESSION_PREFIX`, [`session-tokens.ts`](../../src/lib/guest/session-tokens.ts)) and calls the
  authenticated `claim_anonymous_uploads(text[])`, which touches only still-unclaimed matches (`user_id IS NULL`, so it
  never steals an owned row; at most 1,000) that are hers. ★ **A PARTY'S PHONE IS PASSED AROUND, so whose a ticket is
  has one rule, `whose_ticket`**: a typed address settles it (hers only when it is her own confirmed one; any other
  waits for that address's owner, whose claims review lists it, and no answer on the phone can take it); with none, a
  ticket under no name or under hers is hers, and one under a name at odds with hers (a different first word, case and
  marks aside; hers is her profile's, else the name her sign-up carried, the door's `door_name` or Google's) is ASKED
  about, never taken. After every claim `claim_ticket_asks` answers those per name, and
  [`claim-ask.tsx`](../../src/components/shared/claim-ask.tsx) (the `(app)` layout's and the album page's) asks once no
  door or sheet is up whether the photos added on this phone under that name are hers: They're mine claims exactly
  those (`claim_asked_uploads`, never an address, naming no profile); Not mine is remembered for that account on those
  albums (`pr_not_mine_<qr>`, put down with its ticket); a question put away unanswered comes back on a later visit.
  The same read answers each held ticket typed under an address that is not hers (`kind` address: its live uploads,
  never the address), which nothing takes or asks about, so a confirmation that left this album's photos with the
  address typed beside them says where they are rather than telling a name they do not carry
  (`claimLeftForAnotherAddress`). A proved row whose account was deleted goes to nobody. An unconfirmed caller matches
  no address and stamps `user_id` alone; a confirmed caller's claim is proved (the device plus the address), so it also
  stamps `verified_at`, copies the account's email into `guests.email`, clears `pending_email` and the typed name, and
  names a nameless profile from the newest row it took ([auth-accounts.md](auth-accounts.md)). It fires from the
  `(app)` layout's mount, the album's `useConfirmReturn` (the return, above) and the in-page sign-in handlers;
  module-level guards dedupe, and `user_id IS NULL` makes a reload's re-run a silent no-op.

## Live gallery: the hybrid doorbell

- **Architecture: one live source for the album AND the reel.**
  [`gallery-live.tsx`](../../src/components/guest/gallery-live.tsx)'s `GalleryLiveProvider` owns all
  gallery state (the list, the arrival ids, this device's own ids and optimistic tiles, `refresh`,
  the doorbell, the poll, the ETag, the stricter-drift guard, the live reel's facts) over the paged album's
  client store ([`src/lib/album/store.ts`](../../src/lib/album/store.ts): the manifest, its version, and
  links by id), and hands it down through `useGalleryLive()`; the doorbell and the fallback poll both call
  its one `sync()`. [`live-gallery.tsx`](../../src/components/guest/live-gallery.tsx) is the album's view over it
  (mounted with no provider above it, it brings its own), and the reel
  ([`reel/live-reel.tsx`](../../src/components/guest/reel/live-reel.tsx)) reads the same context, never the
  seed promise, so an upload that reaches the grid reaches the reel in the same breath.
  [`event-experience.tsx`](../../src/components/guest/event-experience.tsx) is the shell around both and streams the
  seed in via `<Suspense>`: the RSC passes `streamGallerySeed`
  ([`gallery-access.server.ts`](../../src/lib/events/gallery-access.server.ts)) down un-awaited with a handler
  attached the moment it exists (a seed that failed before React held it would be an unhandled rejection, and Vercel
  exits the function on one), and `use()` resolves it behind
  [`gallery-skeleton.tsx`](../../src/components/guest/gallery-skeleton.tsx), so the presign-heavy payload never
  blocks the shell's paint; the store adopts it as its own first `sync()`, answered locally. ★ Its link store starts
  at the seed's attribution (`setAttr(seed.sync.attr)` where the store is built): the page mints the first window's
  links after it reads that version, and the asks made as the album mounts (the reel's cover stills) go out before the
  seed is adopted, so a store left at 0 would re-ask every embedded link on the first poll of an album whose
  attribution ever moved. `key={access}` remounts it on an access flip (teaser → full): a clean re-seed, no resync
  effects.
  A seed whose read fails (a refusal answers locked, never a throw) is the album's failure alone, and the live source
  stands through it: `readSeed` reads it rather than throwing it (Next's own throws still pass on; it adopts the
  promise with `Promise.resolve` first, since the page's promise is React Flight's thenable, whose `then` chains
  nothing), reports it (`render:guest`, seam `album`), and the store's own first `sync()` asks the server for the whole
  album: the skeleton while that read is in flight, "The album didn't load" if it fails too (`albumRead`), healed in
  place on the next answer (the poll, a doorbell, her own upload or Try again). Her uploads list, the reel and the
  door's light keep their source throughout, and the header keeps the page's count (an unread album is not an empty
  one). [`album-boundary.tsx`](../../src/components/guest/album-boundary.tsx), around the Suspense and the live
  source, keeps a crash where the album renders to the album: the header, the door and Add photos stand, and its Try
  again is the router's refresh and the boundary's reset in one transition. It is a boundary of its own because Next's
  `unstable_catchError` costs the album's chunk several times as much.
- ★ **A link is read by id at the moment it is needed and re-minted before it ages** (`ensureLinks` for a
  window, `onNeedLinks` for the viewer, `clips` for the reel), never held past its life. At most two link requests
  are out at once (`lib/album/links.ts`): what a burst asks meanwhile goes as one request when a place frees, its
  newest ids first, and a request stalled past 8 s gives its place up, so a burst (a held arrow key's walk) costs a
  few requests, not one a photograph. The provider's watchdog (`reportPossibleExpiry`) treats any image or reader
  failure as a possible expired presign (a tab asleep past the 90-minute expiry answers a CORS-shaped failure with no
  status) and re-mints only the ids whose picture failed, at most once a minute each, never in the demo.
  ★ **A batch is one call**: a delta carries its newest upserts' links (at most `ALBUM_DELTA_LINKS_MAX`, the first
  paint's screenful), minted by the links route's own `mintGuestAlbumLinks` (`events/album-wire-links.server.ts`: the
  reads' gate, so a held, sealed or removed id gets none), and the provider's transport answers the link store's ask
  for them itself (`events/album-wire-carry.ts`: dated as the server dated them, never past their re-mint time, once
  each). The links route stays for windows, the reel tile's stills and re-mints; a failed carry is reported and costs
  the delta nothing. Her own upload's link rides the delta of the sync it triggered: an id is owed from
  `notifyUploaded` until that sync has answered (`owedLinks`), and an ask for it meanwhile waits for the answer, so her
  upload costs no links call of its own. ★ **A burst asks the album once:** the files a complete records together
  settle in one tick, each landing keeps its own optimistic tile and its own owed link, and the one sync is asked a
  microtask after the last of them (a sync asked while one is in the air runs again when it lands: an ask a file would
  make every burst a delta and then a 304); the links they were asked for meanwhile go together once it has answered.
- **The doorbell:** the `media_gallery_doorbell` DB trigger sends a contentless `ping` on the PUBLIC
  Realtime broadcast channel `gallery:<qr_token>` whenever what a guest's album shows changes: the visible set
  (uploads, moderation flips, restores, purges) or what waits (a held upload, its approval or refusal, a row sealed
  for the develop: their count rides the sync, [disposable-mode.md](disposable-mode.md)); hidden-internal
  transitions stay silent. The token IS the channel capability; the ping carries no data, the refetch is
  access-gated server-side.
  Client: [`use-gallery-doorbell.ts`](../../src/lib/guest/use-gallery-doorbell.ts), the one doorbell of the guest's
  album, the host's and the dashboard's stage. ★ **Pings land in calm batches**: every ping waits for the device's
  next tick of the batch clock ([`refresh-coalescer.ts`](../../src/lib/guest/refresh-coalescer.ts), `ALBUM_BATCH_MS`,
  15 s), one sync a tick and none for a quiet album, each device's ticks at a phase it draws, so a venue never asks in
  one stampede; her own upload, a host's own write, a return and Try again never wait. A moment rings at once: the
  ring for a write that moved many rows (`album_doorbell`: a Develop now, a develop time reached, a hold released)
  says `{"moment": true}` and still nothing of the album, and the device asks at once (`isMoment`, the coalescer's
  `moment()`), spending the batch that was waiting.
  ★ **A hidden tab is no listener**: it leaves the channel the moment it hides (a broadcast is billed a message a
  listener), syncs nothing on a ping, and joins again on its return once any leave of its topic has landed
  (supabase-js hands back a channel still leaving by its topic, which never subscribes again, so a blink of the tab or
  a `key={access}` remount would sit deaf); its Live word holds through the rejoin (`REJOIN_GRACE_MS`), so the host's
  pip never blinks on a return. Two sockets and two joins on the wire after a rejoin are supabase-js's own, and
  harmless.
- **The conditional poll** (the shared [`use-live-poll.ts`](../../src/lib/shared/use-live-poll.ts)): its cadence
  keys off the channel state and whether anyone is at the page. While `SUBSCRIBED` it is a safety net at **60 s**,
  resting at **5 minutes** after ten untouched minutes and **stopping** after two untouched hours (a press, a scroll, a
  key or a return wakes it, asking at once; the reel's `?reel=screen` rests but never stops); with the socket down it
  is **12 s**, slowing to 60 s after a minute with nothing new and back on a change. It stops while the tab is hidden
  (and never starts in a tab that opens hidden) and polls once, at once, when it is shown, the hidden tab's one
  catch-up. ★ A stopped net leaves the links on screen to age (`refreshAged` rides each sync): the next ring's sync,
  or a touch's, re-mints them. Every poll sends `If-None-Match`; a quiet album answers a **bare 304** having
  read one row, its version; a change answers the DELTA since the version this device holds, merged by id and checked
  against the server's count read in the same snapshot (a mismatch heals at once with a fresh manifest, never drawn).
  ★ A version below the album's WATERMARK answers a fresh manifest too: the purge cron prunes a purged item's change
  row and raises the watermark to its version in one transaction ([lifecycle-recovery.md](lifecycle-recovery.md)),
  so a device parked below it may have missed the row, and is sent the album whole, never a delta with a gap.
- ★ **The gallery ETag never validates across access levels, nor across the gate behind one**: the validator
  (`guestAlbumEtag`, [`album-validator.ts`](../../src/lib/events/album-validator.ts)) hashes `access` + `gate` + the
  album's and the attribution's versions (never the item list itself, so a quiet poll costs one row) + the live reel's
  facts (so a host's switch reaches an open page) + whether the album takes uploads, only while it is off (each full
  answer carries the switch as `accepting`, from the route's one read of the event, and the page's seed hashes it too:
  a close or a reopen moves no media row); the teaser's validator also carries the presign bucket, since its
  nine photographs travel inline with their links, while at full access a link rides its own ask. The
  not-found/private early return carries no ETag. A teaser validator replayed with full-access cookies must 200, and a
  guest whose gate moved from `account` to `upload` never 304s onto the step they passed.
- **Reconcile by id; never `setState` the raw sync result:**
  [`reconcile-album-items.ts`](../../src/lib/guest/reconcile-album-items.ts) rebuilds an item only when something it
  draws changed (its manifest entry, its link, its blob or its name) and hands back the same object for everything
  else, so a memoized tile that did not change skips its render. A link is held until it dies, not until the store
  forgets it (`expiresAt`, `ALBUM_LINK_REMINT_MS`): a tile waiting on its re-mint keeps drawing the link it had rather
  than going blank.
- **Optimistic tiles only for live-approved media:** a completed upload prepends a local `createObjectURL` tile at
  the file's own measured shape (a square if nothing measured it in time, `MEASURE_TIMEOUT_MS`), so the row does not
  re-lay when the manifest brings the real entry, but only when `create_media` returned `approved`. Its object URL is
  the blob re-key's (the upload act, above), held in
  [`reconcile-album-items.ts`](../../src/lib/guest/reconcile-album-items.ts)'s ledger by media id. Completions reach
  the provider through a `LiveGalleryHandle` callback ref with a pre-mount buffer, since the gallery streams in async.
- **What this device draws at the album's head**, in
  [`gallery-rows.tsx`](../../src/components/guest/gallery-rows.tsx)'s own head slots, and nowhere else:
  - **One stack for a pick in flight** ([`upload/stack-tile.tsx`](../../src/components/guest/upload/stack-tile.tsx)):
    the file actually in the air (the queue runs one at a time) with its progress, only where what she adds shows at
    once. Where it waits (`addsWait`, the page's `addsWaitFor` over `uploadsWait`), nothing of hers draws at the head,
    in the air or landed, since a held or sealed upload is not in the album: her tracker carries it from the press,
    sending, then waiting, and the manifest brings it like any other photograph once it is let in. Nothing draws for a
    file that did not go (the failure sheet owns it).
  - **Her tracker says where each of hers stands** ([`upload-tracker.ts`](../../src/lib/guest/upload-tracker.ts),
    pure): this visit's queue plus her own rows through `/api/guests/mine` `{statuses: true, tell: true}`, read at
    mount, at each opening and when one of hers arrives in the album out of waiting (`newlyInAlbum`), never on a timer;
    an approval arrives live through the album's sync, a refusal at the next read. Each read also answers her NEWS
    ([`let-in-news.ts`](../../src/lib/guest/let-in-news.ts)): the uploads of hers a decision let in
    (`media.let_in_at`, stamped by a trigger) since each row's `guests.let_in_told_at`, the mark moved forward as the
    read answers, so the approval toast plays once, on a reload, a return or her account's other device
    ([reel.md](reel.md)). Its words (`TRACKER_WORDS`) are the one name each state has wherever it is said: "Developing"
    for anything of hers that waits (held for the host or sealed for a develop), "In the album", and "Not approved" (a
    refusal keeps its plain word, so a photo turned down never reads as developing). What is in the album draws its
    album link, this visit's file its own picture, and an earlier visit's waiting one the picture her rows' read
    presigns for her alone (`ownUploadOf`); it publishes her waiting shots to the album's contact sheet (`herShotsOf`).
    It stands wherever what she adds waits, which is the host's approval OR the album's develop time ahead
    (`uploadsWait`, read by the page's server through `developState`; read as approval alone, a develop album's shots
    would say "joined" and vanish on a reload), as it falls on the viewer (`addsWaitFor`): the host's own ride her pair,
    approved, so only a develop ahead keeps hers back, and then her tracker stands on her own guest page too (the album
    draws nothing of what waits, in the air or landed, and her hub is the only other place hers show), listing this
    visit's alone (hers are no guest's rows, so nothing is read for her), "Sending…" then "Developing", lit on the
    contact sheet as a guest's are, and with no Remove (her hub takes hers back). The page holds that reading live (`useLiveUploadsWait`): the develop
    time arriving on the device's clock ends it, and every full sync's word on the develop moves it (`developsAtOf`: a
    Develop now, a time set, moved or taken away), so the album's rule, the camera, the head, the tracker, the keep and
    the failure sheet all follow it with no reload. A shot approved and sealed for the develop (her rows' read says
    `sealed`; this visit's file, `sealing`) waits as a held one does: "Developing", counted and hers to take back.
    ★ **What waits for the host is still hers to take back**: each of hers not yet in the album wears a Remove
    (`upload-tracker.tsx`) on the album Delete's own paths (`remove_my_upload` for an account, `/api/guests/remove` for
    a ticket, both taking any of her rows not already removed), so a file she sent by mistake never reaches the host's
    Review; no confirm, since nothing else in the list asks one. It leaves her list through the page's own record
    (`removedIds`, which also takes it out of what is in flight, so an emptied album asks for its first photo again and
    a require-an-upload album asks the server whether its door stands), and stays with Try again when refused.
- **The arrival, one grammar for a guest and a host alike**: `data-arrived`, the glow of a photograph that appeared by
  itself, and `data-landed`, the one pass of light a guest's own landing takes. The one grid
  ([`shared/masonry.tsx`](../../src/components/shared/masonry.tsx)) writes both from two sets the surface hands down,
  [`shared/arrival.css`](../../src/components/shared/arrival.css) draws both, and their timing has one home,
  [`lib/shared/arrival.ts`](../../src/lib/shared/arrival.ts). `newArrivalIds(prev, next)`
  ([`reconcile-album-items.ts`](../../src/lib/guest/reconcile-album-items.ts)) reports the ids not on screen a moment
  ago, the one definition that catches every route in (a doorbell arrival, a held item approved an hour later, a burst
  after a hidden tab wakes), through the grammar's one diff (`newIds`, which the host's grid reads too) plus the guest's
  seed rule (a last answer that was no album, a teaser's, a lock's or an unread album's, names no arrival:
  `albumOnScreen`), and `arrivalMarks()` (pure, pinned by its tests) takes her own landings out of the glow and gives
  the newest the sweep. The diff is by id, so a rolled presign never glows; nor does the seed render, an album opening
  under a mounted provider, or her own upload (it sweeps).
  **An arrival lands complete, or not until it can** (`shared/use-arrival-gate.ts`, in `GalleryRows`, which takes
  `arrivals` rather than the glow's set and writes the glow itself; the host's album runs the same gate,
  [host-app.md](host-app.md)). A delta brings an arrival before anything has fetched or decoded its photograph, so an
  arrival pushed at once would draw a shimmer and fade its photograph in after the wipe was over. The gate holds each
  arrival out of the rows, asks for its link (`onNeedLinks`, `ensureLinks`), fetches and decodes its photograph at the
  tile's own address (`decodeTileImage`, `tileImageSrc`), and lets it in when that is done, so `MediaTile` finds it
  complete (`data-instant`). It waits at most `ARRIVAL_DECODE_WAIT_MS` and holds at most `ARRIVAL_HOLD_MAX` at once (a
  failed decode is let in at once), waits for a video with no preview's link alone, and never holds the seed, a
  filter's or step's toggle, an arrival the Yours filter hides, this device's own landing or anything under reduced
  motion. The glow is lit when it is let in.
  **One she cannot see is said, never shown by moving her** (album-order,
  [`album-window-news.tsx`](../../src/components/shared/album-window-news.tsx); the hub's album too, its arrivals off
  the hub's store, `event-gallery-news.ts`). The rows already hold her place (the anchoring); the surface also hands
  them its arrivals (`AlbumNews`: the glow's list, so never her own), each judged once as it first stands in the rows
  against what she can see once the change's scroll is paid (one held at the door when it is let in; a lens's change
  brings none), and what landed out of sight wears one glass pill, "N new" and the arrow to the nearest landing (a run
  of rows that each hold one), under whatever chrome is stuck to the screen (`barBottom` finds it by hit-testing) and
  only once she is past the album's first row, so never over its head or the cover. A landing clears whole the moment
  any row of it is in view, by her scroll or the pill's press (to its top under the bar; smooth, at once under reduced
  motion, a keyboard's landing on its first photograph), and a dialog over the album stands the pill down.
- **A guest's own photographs, removable ever**: two identities, one control (its rules are the Invariants above;
  the delete itself is [lifecycle-recovery.md](lifecycle-recovery.md)'s). Signed in → `removeMyUploadGuestAction`
  ([`actions.ts`](<../../src/app/(guest)/e/[token]/actions.ts>)) on `remove_my_upload` (`auth.uid()`, any device, for
  ever); anonymous → `POST /api/guests/remove` → the service-role-only `remove_my_upload_by_session`. "Mine" is a
  server read on both: the signed-in list is one indexed read in the page RSC (`listAccountMediaIds`), the anonymous
  list is `POST /api/guests/mine` (`listSessionMediaIds`, the token in the body, fetched once per mount, read only as
  far as the ticket is hers to the viewer); both live in
  [`mutations/guest-media.ts`](../../src/lib/db/mutations/guest-media.ts). ★ It is deliberately NOT in the gallery
  payload or its ETag: that fingerprint is per access and shared between viewers, while this list is per person.
  Between those reads `GalleryLiveProvider` adds what this visit completed and drops what this visit removed, on either
  identity (both are themselves server answers); the ids reach the grid as `canDelete`, gating the lightbox's Trash
  per item.
  The personal Uploads on a profile share that confirm and hold one other kind: an upload to an event the viewer HOSTS
  is `remove_my_upload`'s host arm, restorable from that event's Deleted, so the owner mode marks it `isHost`
  ([`owner-sections.tsx`](<../../src/app/(guest)/u/[slug]/owner-sections.tsx>)) and the lightbox gives it the host's
  words. The album's owner on her own guest page is never her own guest: hers are the rows with no guest, read through
  her own RLS-scoped client (`listOwnerMediaIds`; never a guest row's, which the RPC's guest arm refuses the event's
  host), and the provider knows them as the host's from their first frame (`isOwner`, reconcile's `hostOwn`), so her
  Delete keeps the host's words.
  On a Require-an-upload-to-view album with uploads open, removing her last live upload closes the album again (own
  deletes close it: "Gallery access", above), unless the album is full (the gate fails open there, so the page reads
  `albumFull` and the line stays silent), and the confirm says so first: `LiveGallery` hands the lightbox the line
  through the `DeleteConsequence` context ([`delete-consequence.ts`](../../src/lib/guest/delete-consequence.ts); the
  lightbox sits under a grid other surfaces own, so a prop cannot reach it), counting her own ids plus any held file
  still waiting. When that removal lands, the page refreshes onto the server's answer at once (the stricter-drift
  hold is for a host's switch, not her own choice).
- **And which tiles are a guest's own:** the same server-read set feeds the **Yours filter** alone
  ([`yours-filter.ts`](../../src/lib/guest/yours-filter.ts), pure), while the Download menu's Yours row is read by
  `/api/export/guest` itself, from the account and this browser's ticket cookie, as far as the ticket is hers
  ([uploads-and-r2.md](uploads-and-r2.md)). A guest's own tiles wear no mark, so the one View menu
  ([`view-menu.tsx`](../../src/components/shared/view-menu.tsx), the host gallery's own object; its groups are
  [`gallery-view.ts`](../../src/components/guest/gallery-view.ts)'s: Size, Sort and Filter) is the filter's one door,
  its Yours (n) only while the guest owns something, Photos and Videos only where the album holds both, and no Filter
  at all where All would stand alone; the count line keeps the whole album's size, and a lens cannot stay live with
  nothing to show (`lensAlbum`), so removing her last photograph, or the album's last video, never strands her in an
  empty view. Sort is the host's own control (`sortViewGroup`). The menu's Size step is server-resolved: the page reads
  the shared `pr_tile_size` cookie the host dashboard does
  ([`tile-size-cookie.ts`](../../src/lib/shared/tile-size-cookie.ts)'s `resolveRowStep`) and threads it as
  `initialRowStep` to `LiveGallery`, so the first paint is the step a returning guest picked; the write rides
  `setRowStepAction` ([`actions.ts`](<../../src/app/(guest)/e/[token]/actions.ts>)), the host action's mirror.

## Auth-aware header island

[`guest-header.tsx`](../../src/components/guest/guest-header.tsx): logged out → a quiet "Start for free" CTA (the
SSR default, so the anonymous majority sees no flash); logged in → the visitor's account menu
([`guest-account-menu.tsx`](../../src/components/guest/guest-account-menu.tsx)), fetched via
`GET /api/me/menu?event=<id>` only when a session exists (event ownership is an RLS-scoped select, behind the
owner-only "Manage event" link; her handle rides the same answer, so Your profile is `/u/<handle>`, and `/me`, which
sends her on the day she has one, until it lands or while she has none). The island reads its session locally (`getSession()`: it gates no data, and every
route still asks `getUser()`). ★ **It follows the device's session, never reads it once** (a `router.refresh()` does
not re-run a client island): a look at the cookie on the SDK's sign-in and sign-out, the Cookie Store API's `change`
(it reaches a tab nobody is looking at, where a response that cleared the cookie elsewhere is otherwise unheard), the
tab being looked at again, and the door settling on a guest (a stored name or ticket written while an account
stands, which also asks the server, since only its 401 knows a session revoked on another device); a server that
stumbles never drops an account, only a 401 does. The menu's **Sign out** puts every guest ticket on the device down,
as every sign-out does (`leaveAllGuestSessions`, "Gallery access" above), signs out, then `router.refresh()`es, so
the visitor stays on the event page and a verified-email event re-gates to the door's `identify` step.

**A third state, for the commonest person at a name-only party**: signed out WITH a stored name, the header wears
[`guest-name-menu.tsx`](../../src/components/guest/guest-name-menu.tsx) instead of the stranger's CTA: the name, its
label (read from the mark, so the two cannot drift), the email row, Change name and Log in, and a disc in her own row's
colour (the header asks `/api/guests/mine` `{seed: true}` once a ticket: [profiles-social.md](profiles-social.md)). It is
the one surface that knows about an unconfirmed address, and it reads only the device flag `pr_guest_email_attached_<qr>` (never an
address; none is stored): name only → "Unverified" and **Add your email**
([`add-email-dialog.tsx`](../../src/components/guest/add-email-dialog.tsx): Save over `attachGuestEmail`, or "Confirm
it now instead" handing to the code door); address attached → "Email not confirmed" and **Confirm your email** (the
one confirm door, its field empty because nothing kept the address), with a quiet "Change or remove it" behind
`PENDING_EMAIL_REMOVABLE`; a confirmed address changes only on the account page. An account always wins the slot: a
signed-in visitor's menu is the truer answer to "who am I here". **No Sign out row**: there is no session to end, and
clearing this browser's token would orphan the photographs this device can still remove. Change name cannot reach
the entry modal's handle (this header is a sibling island of `EventExperience`), so it goes through
[`name-door.ts`](../../src/lib/guest/name-door.ts), the same module-singleton shape as the stored session's own
`emit()`.

## Demo mode

Env-gated (`NEXT_PUBLIC_DEMO_QR_TOKEN`; [`demo.ts`](../../src/lib/demo.ts)): `isDemo` is threaded from the
page through `event-experience.tsx`; the page resolves the demo straight to `full` without the resolver,
the doorbell and the poll are off, the silent join skips `POST /api/guests`, and the queue skips the real
upload: `simulateUpload` returns a synthetic `approved` outcome, so the optimistic tile appears but is
**never persisted**. The marketing side of the demo → [marketing-content.md](marketing-content.md).

**Every demo visit is fresh, a returning one too**, so every demo runs end to end:
[`use-welcome-seen.ts`](../../src/lib/guest/use-welcome-seen.ts) keeps "seen" in per-mount state while `isDemo` and
never writes the cookie (a persisted "seen" would hand a returning visitor the upload step with no role welcome), the
demo never reaches the name step (`computeDoor` excludes it) and never mints a real session.

**The demo's own arrival** (`entry-modal.tsx`, `guest-header.tsx`, `event-experience.tsx`): the same welcome step a
public event shows, at the same open doorway, its words swapped for `RoleWords` (`door/welcome.tsx`: whose party this
is, that the visitor stands where a guest stands, the one thing to try); its itinerary is `[welcome, upload]` with no
name. `guest-header.tsx`'s `isDemo` pins the header with a Demo mark, so the admission survives every scroll, and a
completed (simulated) upload surfaces `TurnCard` (`guest-upload.tsx`) above the album's first tile.

**The phone pair: one broadcast channel, no stored bytes, no new table** (`lib/demo.ts`, `event-experience.tsx`).
A demo tab that did not arrive via a scanned link mints its own id (`crypto.randomUUID()`) and folds it into its own
Invite sheet's link (`?pair=<id>`); a tab that loads with that param is the phone side. Both open a Supabase Realtime
broadcast channel keyed by the id (`demo-pair:<id>`), never the shared `gallery:<qr_token>` channel every stranger on
the public demo shares: the doorbell's mechanism, never its channel. The phone sends its upload's downscaled thumbnail
(`fileToPairThumbnail`, `httpSend` over REST, so an occasional message needs no subscription) the moment its own
(simulated) upload lands; the laptop decodes it (`pairThumbnailToFile`) and feeds it through the same optimistic-tile
path a real upload uses (`notifyUploaded`). A video carries no thumbnail. Nothing is persisted; the channel forgets
everything the moment either tab closes.

**The reel in the demo**: the cover and the view run as on any album, and the reel plays the optimistic tiles too, so
a visitor's own simulated photograph joins the loop; the view's Add is the page's own simulated Add, with no creator
and no approval toast.

## The live reel

The view that is also the wall, the approval toast and the creator's seam are [reel.md](reel.md)'s. What this page
owes the reel: the gallery payload carries its facts (the one live source, above), the reel lives in the head (the
cover's stills and its round, and the shutter's twin, told through the head's bridge; the creator's door is the
view's Make your own), and the welcome, like any step a guest still owes, comes before any reel, `?reel=screen`
included. **A viewer who owes no door arriving on `?reel` meets the reel, never her album** (the owner from her hub's
Reel card, by a soft navigation; a returning guest on a shared reel link): the view is a lazy chunk that opens after
the page mounts, so the album would paint first and flash under it. The page's server knows who asked (`reelAsked`:
the door's first byte, `doorArrival`, drew no stage and no scrim, at full access), so the view's own black stands from
the first byte of a hard load and the first commit of a soft one (`data-reel-curtain`) and the view opens over it; the
curtain goes the moment the address stops asking (the view closed, or the reel turned out not to play) and never
comes back for that visit. It stands on the album's word to the head, which is the address as it stands when told
([reel.md](reel.md)'s address: a soft navigation's first render reads the address it left);
`event-experience.curtain.test.tsx` pins both orders.

## See also

[database-security.md](database-security.md) (the capability-RPC inventory) · [auth-accounts.md](auth-accounts.md) (the sign-in the account gate uses) · [uploads-and-r2.md](uploads-and-r2.md) · [notifications-analytics-growth.md](notifications-analytics-growth.md).
