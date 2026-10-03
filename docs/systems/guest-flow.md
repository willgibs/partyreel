# Guest flow — the `/e/[token]` event page

> ROLE: what a guest (or a signed-in visitor) experiences on the one event link, and how joining/uploading is gated.
> BELONGS HERE: the `/e/[token]` page, WHO A GUEST IS (the definition every surface counts by), the door (six of them, `visibility` + `gate`, one decision a request: the shut, held and ask doors), capability tokens, the password gate + unlock cookie, the door's steps (the `require_verified_email` switch, An email first, with its name-only door; A photo first), silent join, the confirm doors and the return after one, the auth-aware header island, the live gallery (the one live source, doorbell + conditional poll), the link card, demo mode. · NOT HERE: the highlight reel and the clip (the tile, the view that is also the wall, the approval toast, the creator's seam → [reel.md](reel.md)), the upload pipeline + R2 + lightbox mechanics (→ [uploads-and-r2.md](uploads-and-r2.md)), the dashboard's Guest cards and the host's counts (→ [dashboard.md](dashboard.md)), host-side event config (→ [host-app.md](host-app.md)), why a rule was chosen and what shipped when (→ git).
> GROWS BY: integrate-in-place.

## What it does

`/e/[token]` ([`page.tsx`](../../src/app/(guest)/e/[token]/page.tsx)) is the scanned-QR landing page: ONE
unified event page ([`event-experience.tsx`](../../src/components/guest/event-experience.tsx)) whose state
the host's configs drive. The opaque `qr_token` IS the authorization, and there is ONE link per event.
`get_event_by_qr_token` resolves `qr_token` OR `custom_slug` (token wins) and returns the canonical
`qr_token`, which the page threads to every downstream qr-keyed RPC.

★ **THE GUEST'S WORD IS "ALBUM", THE CODE'S WORD IS "GALLERY", AND THAT SPLIT IS DELIBERATE.** Every string
a guest reads says album, the site's one noun, so a guest who becomes a host never meets two words. The
CODE noun stays: `/api/album/guest/{sync,media,manifest}`, `gallery-access*`, `getGalleryStats`, `LiveGallery`,
`GalleryPayload`, the RPCs and the columns keep their names, since renaming a live route buys a guest
nothing and risks the one flow with no account behind it. Do not "fix" the mismatch in either direction:
new guest copy says album, new code says whatever the neighbouring code says.

## Flow (top to bottom, contiguous)

★ **THE ALBUM OPENS ON ITS COVER** (`event-header` r1, `guest=cover`;
[`event-experience-head.tsx`](../../src/components/guest/event-experience-head.tsx), composed in
[`event-experience.tsx`](../../src/components/guest/event-experience.tsx)): the reel's own photographs dissolving edge
to edge under the event's name, on every event. Over them, in white: the `font-heading` name, one byline (the host's
face and name · the date; "Hosted by" went, the face says it; at a desk the counts ride it as glyphs,
`ui/glyph-count.tsx`, their words on hover and a tap, while at a phone the album's own label under the cover says the
count), the host's note (two lines at a phone, three at a desk), and the actions: **Add photos** white on the
photograph (`Button`'s `on-photo`), her tracker, the reel's round and **Invite** in glass (`glass`, `icon-cta`); at a
desk the words take the left and the actions the right. Every Add opens the ADD SHEET (`GuestUpload`'s `openAdd`,
below). `GuestShare` is the Invite trigger onto the event's code card (the code, Copy link, the phone's own Share,
Download). The cover is the room (`dark`, `data-surface="photo"`), so its words read the same on any photograph.
- ★ **A word over the name names the preset** (the-wait r1, Will's `name=disposable`; `coverEyebrow`,
  [`wait-words.ts`](../../src/lib/disposable/wait-words.ts)): "Disposable · develops at 9 am" on an album with its
  camera and a develop time ahead, "Disposable · developed at 9 am" the morning after, "Develops at 9 am" on free
  uploads with a develop time; nothing on any other album, and the time only in her own clock (the server's render
  names the preset alone). The page reads the develop time it last heard (`useLiveUploadsWait`'s `developsAt`).
- ★ **The ground is always lit.** Under every cover stands the house light (three pools of the house's coral): an
  empty album, one sealed until it develops (disposable mode: its stills never reach a guest's payload before then),
  and the beat before a still's link lands all stand on it, and the photographs dissolve in over it when there are
  any. Its stills follow one rule on both sides of the code (`pickCoverIds`): the reel's opening (its take's first
  pass, `tileStills`, so never the album's newest, which sit right under it) while the album has a reel, else the
  album's newest a guest may see (never a clip); previews only, as every reel surface draws; six slots of one CSS
  keyframe, so the dissolve runs from the first byte and off the main thread, and reduced motion stands it on its first.
- ★ **The cover reads the page's seed in a boundary of its own, then the live album.** The album's live source mounts
  behind the page's `<Suspense>`, and the head is the shell (it paints first and stands through the album's own
  failure), so `CoverGround` reads the streamed seed itself (read and never thrown, like the source's own
  `readSeed`) and the stills arrive in the very HTML the album's first rows do; once the album has mounted, its reel
  controller publishes the live stills and the reel's door through the head's bridge (`createHeadBridge`, the shape
  her tracker's store has), so an upload of hers leads the cover on her device. The reel's round stands from the first
  paint on the page's guess (the host's switch and two photographs), corrected by the album's word.
- ★ **The guest's header stands on the cover** (`guest-header.tsx`'s `over`, the carried call `header`): white, no
  rule, the cover reaching up under its fixed `h-14` (`-mt-14`); elsewhere it is today's paper bar. The page says so
  at render and the album moves it (`guest-header-cover.ts`, a module store, since the two are sibling islands): the
  door's stage takes the header to paper over a paper door (from the first byte where the door stands first,
  `arrival.face`) and gives it back to the cover as she lands, and the demo's pinned header takes the paper the
  moment the page moves (a see-through bar would slide the cover's own words under its own).
- ★ **The walk through the door lands on the head** (the ARRIVAL, below): the head is `[data-event-head]`, its
  photographs `[data-head-stills]`, each still `[data-head-still="<slot>"]` (slot 0 the one a reduced-motion reader
  sees), and its picture is one component (`CoverPicture`, `event-experience-head.tsx`: the house light and
  `CoverGround`) that the open doorway draws too, at the cover's own height (`--cover-h`).

★ **WHAT STAYS IS THE SHUTTER** (`stays=shutter`, [`guest-action-dock.tsx`](../../src/components/guest/guest-action-dock.tsx)):
the cover's row on landing, and once that row's `IntersectionObserver` sentinel
([`use-in-view-sentinel.ts`](../../src/lib/shared/use-in-view-sentinel.ts)) leaves the viewport, one round Add at the
foot's centre in the album's light (`ui/shutter.tsx`; the door's lamp hues, sampled only while it stands), Invite its
twin on the left and on the right the reel's round, or on an album with no reel the way back to the cover (the top,
and a keyboard's focus handed to the event's name). While her files go the ring is their progress
(`useRunProgress`, a derived selector over the queue that re-renders the shutter alone per tick), the count on its
shoulder and in its name; a run that lands with nothing refused stands whole with a check for a beat. ★ His two notes
are part of the pick: the page's ground rises from the foot under the controls while more album lies below (an
album's-end sentinel) and is gone at its end, and the twin balances Invite. It is `inert`, not unmounted, while the
row is on screen (so it travels in and out), the box takes no pointer between its controls, and the page root
reserves its height while it is MOUNTED, never only while visible, or the page would grow under a thumb. It carries
exactly what the row carries (no Add where the row has none) and never replaces the row as a guest's first sight of
Add: a shutter alone sits where the eye reaches last.

★ **THERE IS NO SAVE, ANYWHERE.** Uploading to an event is what keeps it (the definition under "Invariants"), so
nothing in this row, or on any other guest surface, saves an event. Keeping what a guest added is asked AFTER her
first file lands, as the door's LAST step (`keep`,
[`save-account-prompt.tsx`](../../src/components/guest/save-account-prompt.tsx)), never a button above an album a
stranger has not seen yet.

★ **THE KEEP IS THE CAPTURE FLOW** (confirm an email and the uploads, with the event they went into, stay in the
account; then follow the host; the copy says "in your account", never "on your profile", since a profile publishes
nothing until its owner chooses). It is due the instant a signed-out guest's first file lands this visit, from the
door's upload step or the album's Add, never in the demo or for the host, and held while the album's camera is open
(`keepDue` and `onCameraOpenChange`, `event-experience.tsx`: it rises the moment she closes the camera): the door
reopens on "Sent", beside a check blooming in the album's light, over what went ("Your photo joined Maya's album.",
or, where what she adds waits, how it develops, in the wait's one set of words (`keepWaitLine`, `wait-words.ts`):
"Your photo develops as Maya lets it in." where uploads are held, "Your 2 photos develop with everyone's at 9 am." on
an album with a develop time ahead, its time in her own clock; never "joined";
what went named as it is, a camera album's shots, elsewhere photos or videos and a mix as uploads: the page's
`keepSent`), the ask ("Keep this event": the event by name, what she sent counted inside it, `keepCopy`; her name
menu's card wears the same title, `KEEP_TITLE`), Confirm your email (the account door in the same held sheet, its
`keep` wear, a code or Google, carrying the product's one newsletter opt-in through `/api/guests/capture-email`) and
Maybe later (put down for that event on that device, `pr_save_prompt_<qr>`,
[`keep-ask.ts`](../../src/lib/guest/keep-ask.ts)).
`ClaimHandlePrompt` owns the album's post-upload slot, ONE card at a time, never in the demo: signed out → nothing
(the door asked, and her menu's card is the ask's standing home); **just confirmed** →
[`follow-moment-card.tsx`](../../src/components/guest/follow-moment-card.tsx) (what they now hold, the told name with
its Change, the other events said once in one line that never leads out (`otherEventsLine`: her uploads
elsewhere finish the keep's sentence; events waiting under her email stand as one row with the banner's envelope and
nothing to press), the host to follow, and "Claim a handle and your name becomes a page." with a
Claim to the profile setup, `PROFILE_SETUP_PATH`; with nothing uploaded this visit it speaks of the photos without a
number); signed in without a handle → the handle card (its Claim to the same setup); with one → nothing.

★ **THREE CONFIRM DOORS, ONE WEAR, AND THEY CLAIM ONLY.** The door's keep (inside the held sheet), the Unverified
mark on a guest's own credit and the header name menu (its Confirm your email and its Sign in; these two through
[`confirm-email-dialog.tsx`](../../src/components/auth/confirm-email-dialog.tsx)) all wear the account door's `keep`
wear, and on a verified code `claimAnonymousUploads`, AWAITED, before the opener's own follow-through (a refresh that
overtook the claim would redraw the credit the guest just paid an email to fix). The claim is the whole keep: it
brings the event with the photographs (a Guest card on the dashboard, → [host-app.md](host-app.md)).

★ **THE RETURN: "JUST CONFIRMED" IS A MARKER AND A CLAIM, NEVER A GUESS**
([`album-return.ts`](../../src/lib/guest/album-return.ts),
[`use-confirm-return.ts`](../../src/lib/guest/use-confirm-return.ts)). Every confirm door writes
`pr_pending_offer_<qr_token>` when it OPENS, because after a magic-link or Google redirect no code of ours is
running; the mark names no album of its own, so it writes the marker for the album on screen, which the page holds
(`holdAlbum`, a module singleton, the `name-door.ts` shape) for as long as it is mounted. `EventExperience` mounts
`useConfirmReturn`, which claims this browser's uploads at mount and hears EVERY claim made on the page, whoever
started it: on an album the claim is two calls, this album's own token first
([`claim-uploads.ts`](../../src/lib/guest/claim-uploads.ts)), and the RPC counts only claimed rows that carry a
live upload, so the result says HERE and ELSEWHERE apart. The follow moment plays when the marker was there (or the
claim is her yes to the shared-phone ask) AND the claim moved this album's own uploads, with no upload needed this
visit (a full-reload return included). ★ **A read on the page may have moved them first**: the album's door runs the
claim as it reads (`sortTickets`), so a Google or magic-link return's render claims her ticket before the album's
own claim runs; while the marker waits and that claim moved nothing here, it asks `/api/guests/mine` (`kept`, the
live uploads on that ticket's row, counted only when the row is the signed-in account's) and counts the ticket as
moved if it is hers (build 33's red-team). The first claim that actually runs for an album's ticket spends that
album's marker either way, wherever it runs (the one on screen is its listener's to take), so a door abandoned there
never plays weeks later off a sign-in made elsewhere; and a full-reload return whose claim moved nothing here still
reports its beat, so the page can say where photos typed under another address are.
★ **A CONFIRMATION IS ONE BEAT, NEVER STACKED TOASTS** ([`confirm-beat.ts`](../../src/lib/guest/confirm-beat.ts)): when the moment plays, its card says the other
events once and tells the name (the events waiting under her email are the moment's alone, counted on the server
from the dashboard banner's own list and never this album, [`confirm-beat-action.ts`](../../src/lib/guest/confirm-beat-action.ts),
so a confirmation before her first upload here, and every toast, says nothing of them); when it does not, the doors report and the page says it once, after the door's hold:
"You're on as Priya." with a Change (a small name form, [`confirm-beat-name.tsx`](../../src/lib/guest/confirm-beat-name.tsx), the account's own write) and the other events as its line, or "We added
your uploads to your account." alone when only other events moved. The (app) layout's own mount still says it
whenever uploads moved.

★ The follow moment
offers the HOST alone, with the quieter Follow (`FollowButton`'s `quiet`, a small ghost button: his "Follow doesn't
have to be pushed as hard"): the other guests already carry their own Follow on each handled chip
([`guest-list.tsx`](../../src/components/social/guest-list.tsx)), and a second copy would be one list twice
on one screen. Its card is `getHostCard(eventId)` from the page RSC, with whether she already follows the host read
beside it (`isFollowing`, one head count for a signed-in guest; the keep's code typed in place refreshes the page), so
its Follow starts on Following for her; no card means no host row, never a stub.

★ **THE GUEST'S POPUPS OPEN THROUGH THEIR KINDS** ([design-system.md](design-system.md), the floating layer): the
DOOR and its held sheets (the confirm door `ConfirmEmailDialog`, the header menu's Add your email,
[`add-email-dialog.tsx`](../../src/components/guest/add-email-dialog.tsx), and the like door, "Like this",
`likes-provider.tsx`) and the upload failure sheet wear the
responsive Sheet ([`ui/sheet.tsx`](../../src/components/ui/sheet.tsx)); every other guest popup opens through its kind:
Invite the code card ([`guest-share.tsx`](../../src/components/guest/guest-share.tsx)), Report a form
([`report-dialog.tsx`](../../src/components/guest/report-dialog.tsx)), her uploads a list, Add photos and Download a
choice. Every shape is keyboard-safe, so no popup carries its own keyboard fix. The door's family heads with the
door's one heading scale (`door/heading.tsx`: the page step, from the left) and pads as `DOOR_SHEET`
(`entry-shell.tsx`).

- **Stats**: `getGalleryStats(event)` ([`guest-events-admin.ts`](../../src/lib/db/queries/guest-events-admin.ts))
  → `{approvedTotal, guestCount}`: a head count of approved media (`countApprovedMedia`, request-scoped, so the
  stats and the gallery payload share one answer), and THE ONE COUNT of guests (`getEventGuests`, the same
  function the host's hub reads, so the album and the hub never say two numbers for one party; never the host).
  ★ **NUMBERS ONLY ever leave the server** (never a guest_id/identity). N goes live via `GalleryLiveProvider`'s
  `onCountChange` (the head count every gallery payload carries, "One true count" below); M is seeded by the page
  RSC and kept current by the album's sync (`/api/album/guest/sync`), which carries `guestCount` on a 200 only (read
  after its 304 check, so the steady poll pays nothing, and never on a locked page) and hands it up through
  `onGuestCountChange`: a guest's
  own first upload moves M without a reload, and only the server can tell a first upload from a returning
  contributor's. It stays outside the ETag: whatever moves M changes the payload the ETag already hashes.
  ★ The album carries N as its own quiet label, left of "Download all" and the View menu, worded like the
  cover's glyph and the teaser CTA, so the page never counts one album two ways.
- **The album, in justified rows** ([`gallery-rows.tsx`](../../src/components/guest/gallery-rows.tsx) over the
  SHARED `MasonryColumns` `layout="rows"` ([`shared/masonry.tsx`](../../src/components/shared/masonry.tsx)),
  windowed by [`album-window.tsx`](../../src/components/shared/album-window.tsx)): `album-columns` r2's picks (an
  arrival pushed in from its left edge while what it moved glides; three steps from View's slider, a pinch, or ctrl
  and the wheel, kept in `pr_tile_size`; now and then a landscape leads a row at twice the height, the visit's seed
  drawn on the server, never at one a row). Only the rows around the view are mounted; a photograph's link and heart
  load when its row mounts, and a tile whose row leaves cancels its unfinished download (R2 answers over HTTP/1.1,
  six connections). ★ The first paint is the server's: rows per width class at the width the album last laid them
  (`pr_album_w`, path-scoped; nominal cold), links for exactly those photographs (`firstPaintIds`), and the
  hydration draws the plan the server wrote on the grid (`data-rows-plan`), never its own (it spares the hydration a
  layout; the engine settles a tie the same in Node and a browser since crumbs-33, design-system.md "`rows`"). The
  Yours filter runs over the manifest (the device's own ids met
  with it; the count stays the album's). A photograph with no link yet is a loading tile, never a request. The
  skeleton lays rows on `ROW_CLASSES` at the step, as the first paint does.
  ★ **The page root is two boxes, not a column**:
  [`event-experience.tsx`](../../src/components/guest/event-experience.tsx) carries `COLUMN` (632px of
  reading measure pinned LEFT, on the header logo's 20px line) and `BLEED` (the gutter alone: 12px under 640,
  where a phone's two columns want every pixel, 20px above), and the
  ALBUM ALONE takes the second (the cover runs the window's width above both, its words on the same 20px line);
  everything else the page says (the upload panel, the guest list, the empty state) keeps the column, the empty
  state because its square river would otherwise draw a window-wide box of nothing.
- **The upload act.** The queue ([`use-upload-queue.ts`](../../src/lib/guest/use-upload-queue.ts): one at a
  time, JIT silent join, demo sim, retry) is created ONCE in `event-experience.tsx` and shared by the
  album's Add and the door's upload step, so a run started at the door outlives it. `GuestUpload`
  ([`guest-upload.tsx`](../../src/components/guest/guest-upload.tsx)) reads its snapshot and owns the album's
  two sheets and the post-upload slot behind a `{openAdd, retry}` handle; it draws no tile. ★ **The album's owner is
  never her own guest** (`ownerEventId`): her files ride the host's pair (`/api/host/r2/*`, `create_media_as_host`,
  as the hub's Add and the reel's Add to event do: approved, metered on her storage, credited as the host) with no
  ticket, no join and no door, since a guest ticket at her own door is held by every door that holds a newcomer
  (`create_guest` never counts the host in). Three surfaces and one session rule:
  - ★ **THE ADD CHOICE**: every Add (but where the host chose the album's camera, which opens in its place:
    [disposable-mode.md](disposable-mode.md)) opens
    [`upload/intent-sheet.tsx`](../../src/components/guest/upload/intent-sheet.tsx) on the responsive menu,
    *Take a photo* over *Choose from your album*, then the terms line
    ([`upload-terms.ts`](../../src/components/guest/upload/upload-terms.ts): the kinds, and the host's own per-file
    cap where she set one (`get_event_by_qr_token`'s `max_upload_bytes`, never handed to the host on her own album,
    whose uploads it exempts), else the universal ceiling from `media/limits.ts`; nothing about rights, ever). TWO hidden inputs in the page beside the menu, where they outlive it, because `capture` cannot be both: the camera row
    (`accept="image/*" capture="environment"`) takes ONE photograph (iOS ignores `multiple` under `capture`;
    Android adds a Camera/Camcorder chooser once video is accepted); the album row is
    `accept="image/*,video/*" multiple`. ★ **Each is `.click()`ed SYNCHRONOUSLY from its row's tap**: one
    `await` in between and Safari silently drops the picker.
  - ★ **THE REVIEW STEP** catches an accidental selection: it opens as a confirmation (a centred dialog) once the
    picker answers ([`upload/review-step.tsx`](../../src/components/guest/upload/review-step.tsx)), taking out the
    last pick asking the two rows again, as tiles with a one-tap
    remove and a `Send N` primary; only then does `addFiles(kept)` run. A file the browser cannot draw (an
    iPhone `.mov`, a HEIC outside Safari) is a NAMED stand-in with its size
    ([`upload/pick-preview.tsx`](../../src/components/guest/upload/pick-preview.tsx); `onError` is the only
    honest test). ★ ONE owner mints and revokes the object URLs in one effect
    ([`use-pick-urls.ts`](../../src/components/guest/upload/use-pick-urls.ts)): mint-in-render plus
    revoke-in-cleanup paints a revoked URL on StrictMode's remount and every preview falls to the stand-in.
  - ★ **THE FAILURE SHEET**: nothing interrupts while files go; when the RUN ENDS (nothing queued or
    uploading) with anything refused,
    [`upload/failure-sheet.tsx`](../../src/components/guest/upload/failure-sheet.tsx) opens once, a line per
    file (name, the SERVER's sentence, Retry) over one `Retry all`, under a line on the rest that is true where it
    is said (`uploadFailureElsewhere` over the page's `addsWaitFor`): in the host's album where what she adds shows
    at once, else how the rest develops (`restWaitLine`: with everyone's at the develop time, or as the host lets it
    in). A refused file draws no tile and nothing
    toasts, except the JOIN's own failure (nothing was queued). ★ **A dismissed failure LEAVES THE QUEUE,
    not just the screen**: "Not now" and every close call `useUploadQueue`'s `dismiss(ids)` for the listed
    ids, so a dismissed failure never resurrects on a later run's end; `dismiss` re-checks each id's LIVE
    status, so it never eats ids `Retry all` just re-queued in the same close. While the door's upload step
    shows, it owns the run's failures (`suppressFailures`).
  - ★ **THE FLIP, MID-RUN.** A host can turn An email first ON mid-run; the routes then answer 403
    `verification_required`, carried up as `UploadOutcome.code` (one of the TWO codes the queue reads by name,
    both the session's). It spends the SESSION, not one file: a CONFIRMED viewer re-joins silently ONCE (their
    uid mints a verified row and the run continues on it: the queue reads its ticket per FILE, never once per
    run); a name-only guest cannot, so everything still queued fails in place with the SERVER's sentence, opening
    the failure sheet once, and ★ her ticket STAYS (the switch refused the files, not her row): the switch turned off
    again sends her next Add on the same row, and a confirmation claims it, where a dropped ticket minted her a second
    row under the same name (one person twice in the guest list). ★ **THE PAGE'S REFRESH
    WAITS FOR THE SHEET TO CLOSE.** `useUploadQueue`'s `onVerificationRequired(message, hadQueuedFiles)`
    tells `EventExperience` whether a sheet is about to stand in the way: `hadQueuedFiles=true` holds the
    refresh until `GuestUpload`'s failure sheet closes (`onFailuresClosed`), because an immediate
    `router.refresh()` flips `access` to `teaser` and remounts the gallery-and-upload slot (`key={access}`)
    out from under it; `hadQueuedFiles=false` (`joinSilently`'s own refusal) and a run from the door's step
    (outside `key={access}`) refresh at once. ★ **THE SLOT REPORTS ONLY WHAT FAILED IN FRONT OF IT.** The re-gate takes
    the slot down while the page's queue stays, so a Retry's second refusal can land with no slot standing, and the
    slot that mounts when the gate falls away would list that file at the end of a run that went through (the OLD
    sheet, its Retry sending a file the switch refused). `GuestUpload` carries in whatever errors the queue holds when
    it mounts with nothing running and never lists them (`carriedFailures`, held by the item, so one sent again and
    refused again is the run's own); a slot that mounts mid-run (the door's run handed to the album) carries nothing.
    ★ A slot going away under its open sheet dismisses what it listed, as every close does (`closeFailures`), without
    calling `onFailuresClosed`: the page re-gated, which is why it is going.
  - ★ **SOMEBODY ELSE'S TICKET** (`session_other_account`, the Invariants' owner rule: an account's row the viewer
    is not, or a name-only row while she is signed in that the claim left as another guest's, a shared phone's). The
    file is NOT failed: the queue puts the ticket down (`dropGuestTicket`: the token, its name and address flag, the name prefill
    when it is that same name, then the cookie, AWAITED so it cannot land after the re-join's fresh one) and
    re-queues it. A CONFIRMED viewer joins silently (once per chain) and the same file goes up on their own row;
    anyone else is handed to the door (`onDoorNeeded`: the page refreshes, so a sign-out in another tab is seen,
    and the name or email step opens, or the page is the shut door) while the files wait `queued`, resuming the
    moment its join hands a ticket down through `sessionToken`. ★ **The door waits for the server to say who is
    here**: the page is told BEFORE the ticket goes down (`onDoorNeeded(ticketDown)`), since the ticket takes its
    name with it, and holds its door on the name it had until its refresh lands (`door-hold.ts`, the hold keyed to
    the render it was taken under), the refresh waiting for the ticket's cookie to go; so a phone the host blocked
    meets the shut door with no name step first. The same 422 on a first Add's own join (`name_required`: the page
    rendered across a sign-out still in flight and skipped the name) keeps her picks for the door the same way, and
    the page's own silent join refused so re-reads who is here. A join nobody at the door could fix fails the waiting
    files in place, and a Retry with no ticket joins first. ★ **A join that lands WAITING is the ask, never a ticket** (`admission:
    "waiting"`, where the host lets each guest in): a file sent on it is refused "This event is private.", so the
    queue adopts nothing (nor does the page's own silent join once the door is behind her: `passedTicket`,
    `join.ts`), sends nothing and fails nothing: the files wait `queued` (a first Add's picks and a clip
    included), `onDoorNeeded` refreshes onto the held door, which reads the cookie the join set, and the run
    resumes when the page's door opens (`doorOpen`, `access` not `none`) on a fresh chain of joins, which now mints
    her ticket `in`. The name step and the add-email dialog read the code the same way: the
    ticket goes down, then a fresh join (the dialog closes and the door asks).
  ★ **The blob re-key**: an in-flight tile's object URL is keyed by queue id and re-keyed to the media id at
  approved completion (`UploadedItem.queueId`): the SAME URL object, so the album's tile is a fresh `<img>` on a
  picture the browser already holds, which answers `complete` at mount, and `MediaTile` shows it at once with no
  fade (measured in a visible Chrome, 0 to 3 s between the stack tile leaving and the tile mounting, and in a
  hidden tab; WebKit unmeasured). Her link then lands in place (`media-grid.tsx`).
- **Empty state** ([`gallery-empty-state.tsx`](../../src/components/guest/gallery-empty-state.tsx)): the
  photographic promise, the RIVER (`shared/river`) in a square box the width of the reading column, the
  `public/guest-ghost` WebPs pouring under a centred `font-heading` title and CTA. The fade (85% grayscale,
  40% opacity) is a class on the WRAPPER, never a layer over the photographs, and NOTHING sits at the top of
  the flow (the guest surface belongs to the host's event, so no Partyreel demo code sits in a host's own
  album). ★ It draws no button of its own: the cover's Add is the one Add on every album, saying "Add the first
  photo" while the album is empty and nothing of hers is in flight or waiting (`galleryEmpty`), and "Add photos"
  otherwise, so there is always exactly one Add, in the first screen. ★ A landing the server sealed until a develop
  (`mediaStatus === "sealed"`) is hers waiting like a held one, so one she has shot or sent this visit ends "the first
  photo"; where the Add opens the album's camera it says "Take the first photo" / "Take photos" with the camera glyph,
  and the shutter's face the same (the dock's `camera`). ★ Anything waiting counts from the first paint: on an album
  empty to the eye where what is added waits (held for the host, or sealed for a develop ahead) the page's server
  render asks whether anything waits at all, hers or anyone's (`waitingOnArrival`,
  [`waiting.server.ts`](../../src/lib/disposable/waiting.server.ts)'s `albumWaits`: one indexed read, a yes or a no,
  the host's own view included), so the cover never says "the first photo" over an album others have added to. ★ **It
  yields to the wait** (`AlbumWaitYield`, [`gallery-empty-state-yield.tsx`](../../src/components/guest/gallery-empty-state-yield.tsx),
  a light module so the Library's server pages still draw it): wherever the album's contact sheet stands, the promise
  steps aside, and an album that waits with nothing in it yet keeps it. ★
  **That wrapper is `GhostRiver`, exported from this file and the ONE home of the depth**: the locked page draws the
  same picture, and two copies of a fade drift apart.
- ★ **The album's wait: the contact sheet** (the-wait r1, Will's `wait=sheet`;
  [`gallery-empty-state-wait.tsx`](../../src/components/guest/gallery-empty-state-wait.tsx), the drawing
  [`gallery-empty-state-sheet.tsx`](../../src/components/guest/gallery-empty-state-sheet.tsx), the layout
  [`contact-sheet.ts`](../../src/lib/disposable/contact-sheet.ts)): wherever what is added waits (the page's live
  reading, `waitClock`) and something does, or she is sending to it (`waitStands`), one square a photo stands over the
  album's rows in the order the night took them, the count and "Developing" over it, the clock under it ("As Maya lets
  them in", "All at once at 9 am · in 10 h 20 min", `wait-words.ts`). ★ Everyone's squares are the sync's numbers
  alone (`GuestFullSync.waiting`: the count and its minutes, never an id), carried by the album store's snapshot
  (`waiting`, absent where nothing waits) and the live source (`GalleryLive.waiting`, the seed's from the first paint,
  and a light context, `AlbumWaitingProvider`, for the wait); hers are lit with her own pictures at their minutes, as
  her tracker publishes them (`HerShots`: this visit's file, or the tile her rows' read presigned for her alone), what
  she is sending at the end, breathing, and her landing takes one pass of light. ★ Capped: a few rows of squares at
  its own columns (twelve at a phone to thirty at a desk, `columnsFor`), the oldest folding into one "+N" while the
  count climbs. "Yours · N" opens her uploads. "+1 just now" says the count climbing while she looks. ★ The album's
  one rule is the wait's line: before anything waits, where she can add, it stands in the sheet's place, in the words'
  column ("Uploads develop all at once at 9 am.", `waitRule`), and the sheet's clock says it from the moment the sheet
  stands (the Add slot said it beside the sheet, twice). The page mounts its source inside the album's live provider
  (`AlbumWaitSource`, one reading for the sheet, the rule and the yield).
- **Lightbox** (the SHARED [`media-lightbox.tsx`](../../src/components/shared/media-lightbox.tsx), its parts in
  `media-lightbox-parts/`): the photograph GROWS out of the tile it was tapped on (`origin`: the tile's rect and a
  `returnTo` that finds the tile of whichever photograph shows at close; the live reel passes its frame's rect and a
  clip's `startAt`) and drops back into it; a face-led CREDIT top left (the face or plain disc, the name, the mark,
  "You" on your own upload, the host's proved address, a door to `/u/<slug>` only where the item carries one), the
  close top right, the floating ACTION CAPSULE at the foot (Like / Save / Share / Copy link / Delete, a clip's sound,
  the host's curate group behind a divider; in the recovery bin, its Restore and Delete permanently alone) and a
  clip's TRANSPORT (play, a scrubber, the time) above it. ★ **EVERY
  UPLOAD CARRIES A NAME**: a confirmed guest's profile name stands plain, a typed one wears
  [`unverified-mark.tsx`](../../src/components/shared/unverified-mark.tsx) (the tiles' glass mark material, `GLASS_MARK`, tap to open, one
  extra sentence for the host, and on YOUR OWN credit a "Confirm your email" opening the one confirm door). A row with
  no name renders no credit at all, never an invented stand-in: a row minted before names were asked (`create_guest`
  refuses a new one) and a verified row whose account has no profile name (a deleted account's surviving upload).
  ★ The mark carries its OWN door rather than a prop, because the credit sits three modules deep under
  `shared/masonry.tsx`; "is this mine" is the existing `canDelete` seam, never a second one. The neighbours PEEK at
  the edges and a tap on one steps to it; a tap on BLANK space closes (no side zones); a pull DOWN at fit closes;
  pinch, pan and double-tap zoom a photograph; a clip plays muted and looping and pauses when the viewer moves on; a
  desk adds hover chevrons and a filmstrip. `media-lightbox.test.tsx` pins the physics, `geometry.test.ts` the
  arithmetic. ★ **ITS LIST IS THE WHOLE ALBUM**, the manifest, mostly unlinked: next and previous cross all of it and
  "Photo k of N" is read over the album; it asks `onNeedLinks` for the photograph ±1 and the filmstrip's ±7
  (`FILMSTRIP_REACH`), and an unlinked item is a placeholder at its own shape, never a request. ★ **WHILE THE
  ORIGINAL IS ON ITS WAY, THE PHOTOGRAPH SAYS SO**: the tile's own preview stands in and the original fades in over
  it, and after a beat a small ring sits on the photograph's corner until the original paints or fails (a clip
  waiting for its bytes wears it in its play button's place); it stands down while the photograph flies, is pulled
  down or is held close up, and a placeholder never wears it (a link that never lands must not read as loading).
  ★ **THE ADDRESS**: the open photograph rides the page as `?photo=<id>` (`PHOTO_PARAM`, `shared/masonry.tsx`), read
  once on mount, and it opens any item the manifest holds, loaded or not: an unknown, held or hidden id still opens
  the album plainly, and a door already open comes first. ★ It is a place the phone's Back closes, on
  `lib/history-entry.ts` with the hub's sheets, the popups and the reel: a tap PUSHES one entry (`prPhoto`), a walk
  moves inside it, every close goes Back over it, the phone's Back drops the photograph into its tile (at once where
  the browser drew its own swipe, `hasUAVisualTransition`), Forward opens it again, a popup over it that is a place (the
  host's credit look, a sheet in a hand) holds an entry of its own so a Back closes the look and the next the photograph,
  and a photograph opened from its address (a shared link, a reload) closes in place onto the album. A walk writes the
  address only once it rests
  (300ms: the browsers' history APIs cap how fast it can move, Chrome past 200 calls in 10s and Safari past 100), and
  waits out a popup the viewer opened; the way back mounts the closed item's tile (`scrollToId`). ★ **SHARE SENDS
  THE FILE** (a photograph's is the original the viewer already holds, so the sheet opens inside the tap; a clip's is
  read on the tap, its progress drawn and stoppable, over 100 MB falling back: [uploads-and-r2.md](uploads-and-r2.md)),
  then the link, then a copy; Copy link copies the PUBLIC album link (`shareUrl`, the event JOIN url, never a presigned media
  URL or a dashboard URL) with `?photo=` on an approved item; Save offers the system sheet in one tap on iOS (its
  Save Image or Save Video is the one web path into Photos, and the same sheet already carries Save to Files) and
  the plain download elsewhere; a file that lands after the tap's activation lapsed
  leaves a one-tap Ready. The guest album and the host gallery pass `shareUrl`; the personal Uploads and the recovery
  bin omit it.
- Each tile (desktop hover-reveal) + the lightbox carry a **like** button, except an item marked `likeable: false`:
  the profile's Uploads marks an upload to an album that reads private to her (read as she sees it,
  `getEventByQrToken`, so a block counts), where `like_media` refuses all but the host. A signed-out tap
  opens the create-account dialog (a `LikesProvider` wraps the gallery, replaying after sign-in). The hearts are
  seeded through `my_liked_media_ids` with the window's ids in the POST BODY (never a URL, which a whole album
  outgrows): the ids the rows mount and the viewer asks for, asking only the ones not yet answered as the window
  moves, two asks out at once and a burst's in one (`seed-queue.ts`, as the link store's); a failed seed is reported
  (Sentry, `media`) and the hearts simply start unfilled. ★ The hearts follow the session the device holds: every
  signed-in call (the seed, a like, a bulk like, a replay) reads it as it goes and calls nothing without one, a
  session that ends takes its hearts with it, and an account that arrives has them asked again (a provider that read
  the session once called `my_liked_media_ids` as nobody after a sign-out in another tab). Like COUNTS are
  host-only → [host-app.md](host-app.md),
  [database-security.md](database-security.md).
- **PWA (manifest only, no SW)**: [`manifest.ts`](../../src/app/manifest.ts) + the ink-aperture icon set
  make an event link installable to a home screen (standalone, paper/ink theme); static + global, leaks
  nothing event-specific.

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
  "This album is closed"; event-safety `newcomer=same`): Only me, a closed gate, a decline, a block. Someone who was
  in reads "This album is private" (locked-door `previous=private`). It is the doorway, shut, its light under it in the
  house five (the door family, below), one link home, under the real `GuestHeader`; it names nothing, neither the album
  nor its host, and `generateMetadata` hides the name. ★ **A person the host blocked meets it
  word for word** (Will's "Sneaky block"): an account or confirmed address a block holds reads the event as
  `private` from `get_event_by_qr_token` itself, and a ticket is asked by the one closed door whenever a request
  carries one, so a block, a closed door and an Only me album answer the same with the same work: the page and its
  metadata, the join, the unlock, the export, the album's read and every guest write, and the write RPCs refuse a
  held ticket in the private album's words. Her own dashboard and picker read the event as private too
  ([host-app.md](host-app.md)), so nothing she can reach says blocked.
- **`ask {invite}`**, an address the invite list does not name: the shut door with her own foot (`unlisted=ask`,
  placed there by locked-door r2): "Ask Maya to let me in" (`UnlistedAsk`, `POST /api/guests/ask`, then the held
  door) or "Use a different email" (`switch-email.ts`: every ticket on the device put down, then this device signed out,
  `local`: every sign-out names its scope, `sign-out-scope.test.ts`). A
  declined ask meets the shut door with no ask. **`ask {approve}`**, a confirmed newcomer: "Maya lets each guest in",
  Ask to join (`ask-step.tsx`, the same route), at the doorway, shut. The ask route re-reads `getUser()` (a
  confirmed address or 422), rides the join limiter, and answers a shut door 403 in the private album's words.
- ★ **THE DOOR SHOWS ONLY WHAT IT SHOWED** (Will, 2026-10-02, on the doorway: "Only what's shown today"). A door the
  host answers (letting each guest in, the invite list) names the album and the host who lets her in, never its
  date: its welcome's byline, the email step, the ask, the held door, and the unlisted reader's own foot; a password
  album's door names the album, never its host; the shut door names nothing, whoever reads it. The page hands every
  access `none` door a `shellEvent` with no date, description or slug, and the host only where the door holds her
  (`doorGalleryDecision`); [`page.redaction.test.tsx`](<../../src/app/(guest)/e/[token]/page.redaction.test.tsx>)
  pins every kind of door.
- **`waiting`**, the held door ([`waiting-step.tsx`](../../src/components/guest/door/waiting-step.tsx), `waiting=held`):
  the doorway ajar, the host will let her in, with nothing of the album behind it; it checks in every 30 s and on the
  tab's return (`POST /api/guests/door`: `waiting` | `in` | `moved`, `private, no-store`; a missing event answers
  `moved`), which stamps her rows for the banked let-in mail, and on `in` the door swings the rest of the way open and
  she walks through it onto the album's cover (the ARRIVAL, below). ★ **She can choose what she will add while she
  waits** (locked-door `wait=pick`, [`wait-picks.tsx`](../../src/components/guest/door/wait-picks.tsx)): the page's
  one queue holds her choice (`holdAtDoor`, a new choice replacing the last) and NOTHING goes up while a door holds
  her (the runner stops while `doorOpen` is false, so her waiting ticket is never sent on); the door's opening starts
  it, on the same row the host just let in. ★ **Her choice outlives the tab**
  ([`door/wait-picks-store.ts`](../../src/components/guest/door/wait-picks-store.ts)): a copy waits in this browser's
  IndexedDB, filed under the album and the account that made it (`doorOwner`, the device's own session; a choice that
  is not this account's is put down unread), for `KEEP_DAYS` (14). The held door that comes back after a reload puts
  it back in the queue; a page that opens on the album with one waiting for this account (the let-in mail's link, a
  tab closed while she waited) sends it into the queue with a word ("Sending your 3 photos from the door"), once (put
  down first, and never beside the copy a tab that waited still queues); it is put down the moment she is let in, the
  door reads `moved` or she switches address. "Keep this tab open." is said only where the copy could not be kept (no
  IndexedDB, a private window).
  ★ **Only a door the host answers holds an ask**: the moment an album takes a password, every ask at its door ends
  (`events_door_to_password`, every path to a password; never a row an upload names), because a password lets in
  whoever proves it and nobody waits on the host there, and a waiting ticket would only stand between her and it. Her
  held door reads `moved`, she meets the password like anyone new, and her phone, finding its ticket gone
  (`invalid_session`), puts it down and joins afresh at its next upload (`use-upload-queue.ts`, as it does a foreign
  ticket). Closed and Only me keep their asks: the host may still answer them. ★ Both mints of an ask (`create_guest`,
  `ask_to_join`) read the door under the event row's share lock, which every move of the door waits on
  (`20260930100000`): an ask minted in the instant the door takes a password, turns Public or becomes the list is
  ordered against the move, so the move's trigger meets it, or it meets the door the move left.
- **`newcomer {gate}`**, no confirmed email yet at approve or invite: the door's own steps (the welcome, the email)
  with no teaser; the welcome counts what is inside, as a password album's does. Confirming asks at approve and lets
  in an address the list names.
- ★ **The upload reads the door as its ticket sees it**: `get_upload_context` answers `visibility` `open` for a
  ticket past a gated album's door and `private` for a waiting, declined or blocked one, so the presign and complete
  routes' `private` refusal covers every shut ticket with no new branch. `accepts_video` (the host's Videos switch
  and the plan) is the album's own answer on `get_event_by_qr_token`: the picker's kinds, the terms line and the
  reel's clip Add follow it, and `video_blocked` refuses what gets past.
- **`password`** → access `none`: **the doorway at rest** (shut, the house light, the album's name and the real
  "N photos & videos inside" count tease: the name is link-shared, not the secret) under the door's password step,
  until a signed unlock cookie is present; then the rest of the door. ★ **The page passes a REDACTED `shellEvent` at access `none`**
  (`host_display_name` + `description` + `event_date` + `develops_at` blanked) so they never reach the RSC flight
  payload: a locked page leaks the event NAME + COUNT only, zero media URLs. The date is blanked too, because the
  welcome byline renders it, and the develop time with it (a date too: 9 am the day after the party).
- **`open`** → the full experience, UNLESS a gate applies (see "Gallery access"). ★ **The OG description is
  ONE invitation for every open event**: "Photos and videos from the day. Add yours." It never warns about
  the email step; that cost (more taps, and a share of guests bounce at the email step) was taken
  knowingly, and the gate stays honest where it happens, at the door. Do not hedge it back.
- **The link's image** is the event's card, drawn by the route
  [`card/route.tsx`](<../../src/app/(guest)/e/[token]/card/route.tsx>) at `/e/<token>/card` (the name on the
  branded dark surface; a private or unknown event draws the generic card) and named by `generateMetadata`
  from [`event-card.ts`](../../src/lib/guest/event-card.ts). ★ **One answer per address, whoever asks:** the card is
  public for an hour and the edge serves its copy to everyone, so it follows the EVENT's own visibility, read with no
  caller (`getEventCardName`, the anon client), never the request's session, cookie or ticket, and every closed door
  (a private album, a viewer a block masks) names the private album's card instead (`?private`, generic by its
  address alone), so the two pages carry the same image. ★ It is a route, not an `opengraph-image`
  file, because a file-based image outranks `generateMetadata` and the image depends on the query:
  `/e/<token>?photo=<id>` (the viewer's own address, read with its own `readPhotoParam`, so the card and
  the viewer answer the same links) unfurls as THAT photograph, titled "A photo from <event name>" (its preview, or a
  photo's original where it has none, presigned server-side; a video unfurls as its poster), but only on an
  album ANYONE may open (`resolveGalleryDecision` for an identity-less visitor is `full`) and only for an
  approved item of this event (`getOpenAlbumItemForCard`). A gated album, a malformed, unknown, held, hidden,
  removed or foreign id, a video with no poster and a failed presign all keep the event card, with no sign
  the id exists.
- **`accepting_uploads=false`** = the **view-only STATE** of the one page: the upload panel is removed
  entirely ("The host has closed uploads. You can still browse the album."), leaving the action row +
  gallery.

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
  ★ **READ WHOLE, IN ONE ORDER, BY EITHER ARM** (the 1,000-row rule, `read-all.ts`): PostgREST cuts a read at
  1,000 rows with no error, so both arms walk keyset pages on the display order (`created_at desc, id desc`) with
  the last row's RAW `(created_at, id)` as the cursor: the open album through `get_event_media_by_qr_token`'s
  `(p_before_created_at, p_before_id, p_limit)` ([`guest-events.ts`](../../src/lib/db/queries/guest-events.ts)),
  the unlocked password album through the same cursor as a table `.or()` (`olderThan`, `getApprovedMediaForUnlock`).
  The pages concatenate in order, which the grid, the reconcile and the ETag all keep.
- **`teaser`** — the newest `TEASER_LIMIT` (9) approved PHOTOS + the true total; the rest withheld. Shown to
  a viewer with no confirmed email on a `require_verified_email` event (gate `account`), and to a guest who
  owes a first upload on a `require_upload_to_view` event (gate `upload`). The confirmed email, or the
  photograph, buys the rest.
- **`none`** — nothing real. A password event BEFORE the unlock cookie (gate `password`). The privacy rule:
  real teaser photos appear ONLY once the password is proven (never before it).

★ **THE UPLOAD GATE FAILS OPEN, AND THE FAIL-OPEN IS THE SERVER'S.** `canContribute = accepting_uploads && !albumFull`,
where `albumFull` is exactly the pair the presign ladder refuses `cap_reached` on (the storage cap plus its 10%
write headroom, or the monthly ingress cap), carried verbatim by `get_upload_gate`, so the gate never holds a guest
the presign would refuse. An unreachable `get_upload_gate` resolves to `{contributed: false, albumFull: true}`
with a captured warning, which opens the album. ★ **OWN DELETES CLOSE IT**: an upload counts whatever the host
does to it (pending, approved, hidden, or removed by
the host, an admin or the system: a door that re-closed on the host's curation would leak it to the guest), and
stops counting once the guest removes it themselves (`removed_by_uploader`, a Not mine in the claims review included).
So a guest who uploads, looks and deletes has not contributed, and the door is theirs again. The EMPTY album still
holds the gate (no count condition), and the host never meets it. `require_upload_to_view` is OFF by default and
free on every tier.

★ **THE SERVER HAS TO KNOW WHICH GUEST IS ASKING**, which localStorage cannot tell an RSC. The
`pr_guest_<eventId>` cookie ([`session-cookie.ts`](../../src/lib/guest/session-cookie.ts)) carries the raw
64-hex session token: HttpOnly, Secure in production, SameSite=Lax, path `/`, 60 days, shape-guarded on
read, unsigned (the database verifies it against `guests.session_token`'s unique index). It is written only
when absent or different: by `POST /api/guests` (a mint), `POST /api/guests/name` and
`POST /api/guests/email` (success), `POST /api/r2/complete-upload` (a created row, via
`CreateRecordOutcome.setCookies`, applied to the 200 alone) and the album's sync's heal (a differing body
token), **only as a 200 with no ETag**, because Vercel's edge turns a validator-matching 200 into a 304
and drops `Set-Cookie`. `POST /api/guests/leave` expires it (`{ qr_token }` one event's, `{ all: true }` every
`pr_guest_*` the request carried); ★ **EVERY SIGN-OUT PUTS DOWN EVERY TICKET ON THE DEVICE**, the tokens, names,
address flags, the name prefill and the welcomes with the cookies: the guest page's account menu through
`leaveAllGuestSessions`, the app's account menu through `forgetGuestTickets` on its form's submit and
`signOutAction` expiring the cookies on its own response
([`session-cookie-family.ts`](../../src/lib/guest/session-cookie-family.ts)), so a shared phone never renders
the full album, or uploads, on the last person's ticket (the owner rule is the guarantee; this is the
courtesy). ★ The WRITE routes (name, email, mine, remove, presign, complete) read the token from the BODY only,
pinned by a source test in `session-cookie.test.ts`, so the CSRF surface does not move.

★ **The withheld set never reaches the browser**: the teaser is a capped server read (`getApprovedPhotoTeaser`,
self-guarded by visibility, photos-only, `count:'exact'` for the total), NOT a CSS blur over a loaded
gallery, so dev-tools or a direct poll call can't reveal it. ★ **The poll enforces the SAME decision**:
gating only the RSC would be a trivial bypass. The guest-facing gate is the door (below).

★ **ONE TRUE COUNT, EXACT AND LIVE, READ THE SAME WAY EVERYWHERE IT IS SAID.** A count is counted, never a
list's length: the loaded teaser is capped and photo-only, and neither its count nor the photo-only `teaserTotal`
is the album's size. Every gallery payload (the render's and each poll's 200) carries `approvedTotal`,
`countApprovedMedia`'s head count (photos and videos), and the ETag hashes it, since a video landing behind an
unchanged nine moves nothing else. `GalleryLiveProvider` reports that number plus what this device changed since it
arrived (an approved upload's optimistic tile in, the guest's own removal out: `albumCount`) through
`onCountChange`, at `teaser` AND `full`; the CTA says the same number, "See all N photos & videos" ("Confirm your
email to see everything" when nothing more is withheld), and so does the door (its `mediaTotal` is the header's
live count); one item reads "1 photo or video" (`formatMediaCount`), never a "photo" that may be a video. A payload without `approvedTotal` (an older server mid-deploy) falls back to the shell's
`stats.approvedTotal` at `teaser`, then the photo-only `teaserTotal`. At `none` no gallery mounts and no poll
runs: the lock line says the render's head count.

## The ARRIVAL (the door: the doorway, its held sheet, then the album)

The arrival is the PRIMARY first experience (a guest comes off a QR with zero context) and plays as four
acts on the "Calm + 700ms" choreography ([design-system.md](design-system.md)): **the stage** (the page as
it paints: the door she meets first, from the first byte, or her album where she owes nothing) → **the invitation**
(the welcome on the door's page) → **the threshold** (the steps, the sheet rising after the ARRIVAL BEAT) → **the
reveal** (the success beat, then the album: walked into through an open door, risen into as a gate's sheet goes).

★ **THE DOOR FAMILY: ONE DOORWAY, ITS LEAF THE STATE** (`locked-door` r2, Will's `family=doorway`,
`shape=shared`, `wait=pick`, `lost=follows`). [`door/doorway.tsx`](../../src/components/guest/door/doorway.tsx)
(`doorway.css`) draws a door standing on the page with the party's light behind it: OPEN on a welcome she may walk
through (the album's own cover through the opening, `view`: the page's `CoverPicture`, its stills in step with the
head's, and its own sampled light), AJAR while the host decides, SHUT with one line of light under it wherever the
door is not hers to open, and an EMPTY FRAME on a link that opens nothing. Its light is the album's only where she may
see the album (a Public album's welcome, the moment she is let in); everywhere else the house five, and a photograph
is only ever drawn through an open door. ★ **A door that is not open is never still** (`locked-door` r3, `idle=turn`):
the light of a shut or ajar door turns through the whole rainbow (`--door-turn`, a registered hue stepped round in
`--door-turn-ms`, 24s, so a visitor sees it move before she leaves) and breathes with it on a third of that (the sill
and the floor, opacity alone), from a phase the server draws per door (`doorPhase`, so the first byte and hydration
agree and no two visits start on one colour); an open door holds the album's own light; each lit hue is written near
its house twin (`nearestHue`), so a glide between the house light and the album's goes the short way round; reduced
motion stands it still. Every door screen stands it in one page
([`door-page.tsx`](../../src/components/guest/door/door-page.tsx): `DoorColumn`, `DoorWords` in the door's text
reveal, `DOOR_MAIN`, the door at one height on every screen, held below the header rather than centred, so a door
whose words change under her never moves): the shut door, the broken link's page (`e/[token]/not-found.screen.tsx`,
the doorway empty, in its own words, still behind the one lazy not-found boundary), and the album's STAGE
([`door/stage.tsx`](../../src/components/guest/door/stage.tsx)).
★ **THE STAGE IS THE DOOR AS THE ALBUM'S PAGE**: the steps a guest reads AT the door stand on it (the welcome, the
demo's role step, the ask, the wait, and the beat when the door she waited at swings open), a modal layer like the
sheet it replaced (`role="dialog"`, named by its headline, so `layer-is-up.ts`'s waiters see it) standing `absolute`
over `EventExperience`'s box, which is `inert` under it; the page holds to one screen while it is open
(`[data-guest-page]:has(...)` caps it, `doorway.css`: a cap, since the page is a flex item whose basis is its
content), and it fades where it stood when it leaves (at an open door she walks through it instead, below) and is
unmounted after (`STAGE_EXIT_MS`). The steps that ask something of her rise as the SHEET: over the album she has
walked into at a Public album (the open door led in), and at a gate over the door at rest (`STAGE_SCRIM`, a light dim
and no blur, so the door keeps its state above the sheet, moving beside the panel at a desk, and swinging open on the
step's own success).

★ **THE FIRST BYTE IS THE DOOR** (Will: "the album is never visible before any door/gate that should be encountered
first"). The page decides on the server what its first byte draws (`doorArrival`,
[`entry-steps.ts`](../../src/lib/guest/entry-steps.ts), `computeDoor` over what the request carries: the welcome's
cookie, the ticket cookie standing for a name and a return, a confirmed account's profile name): the stage on its face
(the welcome, the role step, the ask, the wait, a gate's door at rest), or the album behind the door's own scrim where
a sheet step comes first (the email step past the welcome, the name, the first photo), which the sheet rises into with
no fade of either (`arriving`); a returning guest who owes nothing lands on her album at once. `EntryModal` is in the
page's own bundle, its stage server-drawn and only its sheet after hydration; where the server's reading of this
browser turns out wrong, the door corrects after hydration (a scrim that owed nothing lifts; a sheet it could not
foresee rises over the album), never toward the album for a newcomer, who holds no ticket. Pinned on the server render
for every door: [`page.first-paint.test.tsx`](<../../src/app/(guest)/e/[token]/page.first-paint.test.tsx>) (the
decision per door, the header, the shut door) and
[`event-experience.first-paint.test.tsx`](../../src/components/guest/event-experience.first-paint.test.tsx) (what that
decision draws).

★ **THROUGH AN OPEN DOOR SHE WALKS** (`locked-door` r3, `reveal=through`;
[`door/stage-walk.ts`](../../src/components/guest/door/stage-walk.ts)): on a Public album's Continue and the moment
she is let in, the door's page is a camera pushing into the doorway: the frame passes her and leaves the screen while
the cover beyond it grows more slowly, and it lands on the album's own cover under the stage. ★ Seamless by
construction: every rect is read at the press (the opening, the picture in it, the head, a scrolled stage too), each
path is one similarity solved from them, sampled into compositor keyframes (transform and opacity only) started on one
clock, so the picture's last frame is the head's box to the subpixel; the picture's dissolve is put in step with the
head's (`syncCover`); the walk starts in her press and the page's own work waits for its first frame (`Walk.started`,
which can come after a tab put away mid-walk has already arrived, and the door asks). While she walks the stage holds
her (inert, no sheet), the album's words wait under the reveal curtain (the head's `[data-arrive]` lines and
everything below the cover, `[data-door-below]`, `door.css`); arrived, the stage goes in a breath (`walked`), the
head's name rises, then its byline and actions, then the album, and a step the door still owes rises after
`SETTLE_AFTER_WALK_MS` (420). Under reduced motion, or wherever the walk cannot land (no head laid out, nothing
measured), the stage fades where it stood, the party's light lifting off the album. ★ Reduced motion's 200ms fade sits
in `@layer base` and `!important` (`doorway.css`): the global guard clamps every transition there with an `!important`,
which outranks one in any later layer, so the fade declared in `components` cut out in a frame (red-team 44;
`doorway-reduced-motion.test.ts`). A password's door is shut, so its unlock keeps the sheet's own reveal.

★ **THE DOOR IS AN ITINERARY, AND IT HAS NO EXIT.** The doorway and one held sheet carry the welcome, the password
when the event has one, the NAME, the EMAIL (held until confirmed) when the album asks for an email first, and
the first UPLOAD asked, and then the album. The album is the reward the door's asks pay for (its cover seen through
the open door at the welcome, blurred behind the sheet after it, the capped teaser wherever a server gate holds), so
there is no "just browsing" way past it. `computeDoor` ([`entry-steps.ts`](../../src/lib/guest/entry-steps.ts), pure
and unit-tested) derives the ordered steps from the server's `{access, gate}` plus this browser's own facts (welcome
seen, a name, a contribution, "returning" snapshotted at hydration), because the server can see the password, the
email and the welcome's cookie and cannot see whether THIS browser typed a name. A server gate is TERMINAL for the
steps behind it: the resolver has no opinion past an unmet password or email, so the itinerary stops and re-derives on
that step's refresh. `autoOpen` is true whenever a step exists.

The itinerary is `welcome | password | chooser | name | identify | signin | upload | keep` (the keep last and only
when due, never ahead of a step she still owes), its rules in
[`entry-steps.ts`](../../src/lib/guest/entry-steps.ts). The cases: the owner `[]` (no sheet); password-only
`[welcome?, password]` then the rest; names mode `[welcome?, chooser → name | identify | signin, upload?]` (the
chooser's Continue as guest, Create account and Log in, each carrying its small line of what it gives; the chevron is
`doorBack()`, and a way in returns to the chooser
and clears the pick); verified mode `[welcome?, identify]` (the email alone) then `[name?, upload?]` (the name only
for an account with none, in `profile` mode); both, in that order; the demo `[welcome (its role step), upload]`, which
asks no name; a returning guest with a name and (when required) a contribution `[]`; the mid-visit flip `[email]`.
★ **THE NAME STEP CARRIES AN OPTIONAL ADDRESS in names mode**, a one-line ghost under the name that opens into the
labelled field: it adds no step, and `computeDoor` does not know it exists (see "Joining + identity").

One shell ([`entry-shell.tsx`](../../src/components/guest/entry-shell.tsx)) renders the ONE product Sheet
(`SheetContent responsive`) at both widths: a bottom sheet in a hand, keyboard-safe
([design-system.md](design-system.md), the floating layer), and from 640 up a full-height panel from the right edge;
the door's own CSS lives in `door.css`. ★ **THE DOOR IS LIT** ([`door/lit.tsx`](../../src/components/guest/door/lit.tsx),
`door/lit.css`): `DOOR_SCRIM` is the lightbox's ground at a gentler dim (30% black, a 28px blur, brightness .72), and
a lamp on the sheet's free edge (the top in a hand, the left at a desk) wears the hues of the album's newest
previews, within a bounded lookback past any that turn out colourless, sampled only while a lamp is lit
([`door-light.ts`](../../src/lib/guest/door-light.ts), `door/album-light.tsx`; the house five until the sample lands,
at a password event, and wherever nothing in the lookback carries colour; the open doorway registers as a lamp, so
its light is the same sample); stronger on the code screen, blooming on "You're in"; the change and confirm sheets,
her menu's card and the like door wear it too. Its light reaches the words: the small glyphs, the Lock beside "Almost
in", the envelope and the door's eyebrows, take it (`DoorGlyph`, `StageGlyph` in the house five at a gate); a control
keeps its monochrome glyph. Every beat blooms in it ("You're in"'s check, the unlock's button, the keep's Sent;
`DoorCheck`). In dark the resting lamp is spent inside the sheet's padding (a muted word inside the atmosphere
register reads 2:1, measured); light keeps the wash. ★ **NO CENTRED FLOAT AT A DESK**: an edge sheet leaves more of
the blurred album in view, and that preview is the incentive the door runs on. The phone half keeps
`max-h-[85svh]` at rest, so the album still shows above the door. The
CURRENT step is always the itinerary's first; SERVER steps advance through the RSC's refresh, CLIENT steps
through flags in the sheet. No step counter to desync.

- **The ARRIVAL BEAT** ([`use-arrival-beat.ts`](../../src/lib/guest/use-arrival-beat.ts): 700ms, a password
  re-visit 350ms, reduced motion 0): only the sheet's AUTO-open waits (the page settles first; the door's page
  stands from the first byte); a re-assert (`openToGate`) is instant.
- **welcome = THE INVITATION**, at the doorway ([`door/welcome.tsx`](../../src/components/guest/door/welcome.tsx)):
  open onto a Public album, shut at a gate; a "You're invited to" eyebrow over the event name, "Hosted by" and the
  date on one line (the date self-hiding at every gate, the host at a password, via the redacted shellEvent), the
  count as social proof, ticking as photographs land (`LiveCount`; the gate's title ticks too; reduced motion lands
  the number), two warm `text-base` lines, one primary that always reads "Continue" (something always follows it),
  and the legal consent line. Shown once per PERSON at an album: the `pr_welcome_<qrToken>` cookie (a year, not
  HttpOnly: [`use-welcome-seen.ts`](../../src/lib/guest/use-welcome-seen.ts) writes it and puts it down), which the
  page's server reads (`welcomeSeenIn`) so the welcome is the first byte and its hydration agrees; the demo's is
  never written. It goes with the ticket of whoever saw it (a ticket put down takes its album's, every
  sign-out every album's; the door's name step keeps it when it puts a foreign ticket down, its person having just
  passed it), because the door's identify and sign-in steps carry no consent line and lean on it, so the next person
  on a shared phone meets it once. The demo's welcome is its role step (`RoleWords`, see "Demo mode"), at the
  same open door.
- **THE AFFORDANCE TABLE IS ONE ROW**: every step of the door is HELD (no X, no drag handle, Escape and the
  backdrop inert), and so is a closed/exiting shell. The one FREE surface is the name door over the album, from the
  menu's "Change name" (`openToName("edit")`), the told name's Change opening its own small form instead (it writes
  the account's name); it stands over an album the guest already reached and posts nothing when it closes. The teaser's "See all N" re-asserts the sheet (`openToGate`, a no-op mid-hold),
  whose only remaining job is to undo the OFF-state soft skip.
- **The CONTINUOUS step container**
  ([`entry-step-transition.tsx`](../../src/components/guest/entry-step-transition.tsx)): a ResizeObserver
  feeds the content's px height into a 300ms height glide (step swaps AND same-step growth, e.g. the error
  line); steps slide directionally (`[data-entry-step][data-dir]`); the outgoing step leaves an inert
  attribute-stripped clone that fades opposite (`[data-entry-exit]`; `el.isConnected` discriminates real
  deletions from dev StrictMode cycles). ★ "You're in" arrives IN PLACE (`place`): its check and words are its
  entrance, and the step it replaces fades where it stood; a sliding layer carries `data-settled` once its move lands,
  and the box reaches 12px into the sheet's padding so its clip never shaves a focus ring. ★ THE TEXT REVEAL
  (`[data-door-line]`, `door.css`): a heading's lines rise out of a blur, 40ms apart, wherever words arrive in place
  (the first step as the sheet lands, "You're in", the unlock's words, "Check your email", the upload step's own
  views) and stand down on a step that arrives by the side-by-side move; the exit clone replays no entrance. The back
  chevron is a transient VIEW over the machine (never
  touches markSeen/steps): the password, the name and the email go back to the welcome, the upload to the
  name (the demo's to its role step). ★ THE REVISITED WELCOME'S OWN PRIMARY ALWAYS READS "CONTINUE", never
  "Back": back is not bidirectional, and only the CHEVRON's label says "Back to X".
- **The SUCCESS HOLD + REVEAL** ([`use-success-hold.ts`](../../src/lib/guest/use-success-hold.ts), min beat
  900ms) plays ONCE, on the step the album is directly behind; an earlier step's success hands forward with
  no beat. A password unlock blurs the field (the keyboard retracts during the beat, never mid-exit) and
  fires `onUnlocked` + `router.refresh()` together; the gate stays PLANTED and its button fills with the
  album's light, its check drawing ("You're in" + `data-unlock-success`, `data-unlock-lit`). The email
  confirmation's hold shows "You're in" in place, its check blooming in the album's light with the success-check
  motion (the code machinery has no single button to morph). Release = beat done AND the refresh landed (`current`
  moved off the held step). A full unlock exits the sheet (250ms via an `animation-duration` override:
  vaul's close is a KEYFRAME, not a transition) while the REVEAL CURTAIN lifts (`[data-reveal-curtain]` via
  `onHoldingChange`): the new header rises (`data-reveal`, 150ms + 50ms steps) and the masonry stagger
  cascades AS the sheet exits, never invisibly behind it. Never strands: past 1.5s the copy reads "Opening
  the album"; the 8s watchdog offers a Retry ("Open the album"; the unlock cookie is set, so the form never
  re-enables). The display latch keeps the last open-state view mounted through the exit.
- **THE UPLOAD STEP LIVES IN THIS SHEET** ([`upload-step.tsx`](../../src/components/guest/upload-step.tsx)):
  it renders the intent sheet's exported body (`UploadIntentBody`), so the hidden inputs sit INSIDE the
  open dialog and Safari's synchronous `.click()` still opens a picker (a sheet over a held sheet would be
  two things to dismiss, one impossible). It sends into the page's one queue; the first completed item
  (approved or held) flips the client's own `contributed`, the step drops out, and the run finishes behind
  the album's head. ★ **That client flag stands only until the server has answered since it**
  (`contributionAnswered`, [`entry-steps.ts`](../../src/lib/guest/entry-steps.ts)): on a require-upload event the
  server can take a contribution back (the guest's own delete), and from the first gate seen off `upload` the
  server's gate alone decides, so a later `upload` gate puts the door back WITH its upload step, never a teaser
  with no way through. The FAIL-OPEN is server-owned: when a run ends with nothing completed and every refusal
  is one the guest cannot fix (`classifyRun`), the step shows the server's sentence and "Continue without
  adding", which refreshes and trusts the decision that comes back, never a local skip (the server would
  still answer `upload`: a loop). The ON line reads "The host has asked everyone to add a photo before the
  album opens." (an empty album: "Nothing here yet. Add the first photo and the album opens.") and names no
  host, since a long name breaks it. ★ "The album opens" is the ON door's alone: OFF, the album is already
  open, so the step says "Add one now, or look around first." (empty: "Nothing here yet. Add the first
  photo."), and its failure line asks for another file without promising the album. The OFF-state ghost "Skip for now" ("Look around" in the demo) is once
  per pass and never on the failure view; ON there is none, and `computeDoor` ignores `skipped` and
  `returning` so a stale flag cannot open an album.
- **THE FLIP AND THE DRIFT.** The completion route writes the session cookie on its own response, every
  completion's `notifyUploaded` refetches the poll, and the poll's looser decision refreshes the page onto
  `full` (`key={access}` remounts the gallery); the upload step plays no success beat. `GalleryLiveProvider` raises
  `onAccessDrift` once per CHANGED `access`/`gate` from the poll. A LOOSER drift refreshes at once; a
  STRICTER one (a switch turned on while the guest is inside) never yanks an open album from under a thumb:
  the provider keeps its OWN items and count as mounted (the album and the reel alike), and the shell spends the drift on the guest's
  next Add. A session minted before the cookie existed has none, so `EventExperience` HEALS once at mount
  when the gate is `upload` and localStorage holds a token: one poll POST carrying it (no `If-None-Match`),
  the auto-open waiting on the answer, then a refresh if the gate came back other than `upload`.
- **No autofocus in the password gate** (the iOS keyboard ambushed the mid-transition sheet): its keyboard
  rises on an intentional tap. Gate inputs are h-11/16px (16px also stops the iOS focus auto-zoom). No
  door field autofocuses at either width (a source test pins it); the code field takes focus only from a field that
  held it when the code was sent.
- **Every code screen heads "Check your email"** (`code=mail`, `/login` included): `AccountDoor` draws it in the
  surface's heading's place (`head`), a gate keeping its "Almost in", then the address, six slots across the full
  width, "Or tap the link in the same email." and the resend; with no sticky primary the sheet keeps 16px above the
  keyboard (`DOOR_SHEET`).

## Invariants (don't break)

- ★ **A PERSON IS A GUEST OF AN EVENT ONLY THROUGH AN UPLOAD OF THEIRS**: a password entered or an account
  confirmed without an upload lists nobody, one photograph makes a guest, and deleting every upload of theirs
  removes them again. A LIVE upload is one whose `media.status` is not `removed` (pending, approved or hidden), whoever removed it. What OTHER
  people see needs an APPROVED one: the guest list, the Guests room, every guest count and a profile's "guest at"
  line, all read through ONE function (`getEventGuests`, [`event-guests.ts`](../../src/lib/events/event-guests.ts):
  a confirmed guest once per person, a named unconfirmed one once per row, never the host, never a nameless row,
  never a person the host blocked from the event).
  The account's OWN list of the events it added to takes any live one (→ [host-app.md](host-app.md), the Guest
  cards). A `guests` row stays what it is, the device's upload ticket minted at the door: nothing reads a row as
  attendance, and there is no save. A clip added to the album is an upload like any other. A host removing all of a
  guest's uploads takes them off every list; a restore puts them back.
- ★ **THE HOST SEES A CONFIRMED GUEST'S ADDRESS, under the name, in the host's viewer and in the Guests room**, and
  never an unconfirmed one: the viewer's uploader credit (`getUploaderIdentities`, the email line) and the room's
  list and names panel (`GuestList`'s host-only `emails`, read by `getConfirmedGuestAddresses` in
  [`guest-addresses.ts`](../../src/lib/db/queries/guest-addresses.ts), which proves the host itself and reads
  `guests.email` on `verified_at` rows only; the room is its one importer and the album never passes `emails`, both
  pinned). The address IS the safety feature An email first promises: anyone can confirm any inbox, so a
  bare "verified" badge would imply far more safety than it gives, and the host must see WHICH address was proved
  (a guest confirmed on `fakeemail@domain.com` looks exactly like that). A guest never sees another guest's
  address: exposing them would turn a safety feature into a privacy leak, and the host alone takes on vetting
  them.
- **The opaque token IS the authorization** — never give `anon` direct table access; the guest
  RPCs validate the token internally. → [database-security.md](database-security.md).
- **A link, and an event password, are BEARER credentials.** Possession is the authorization, which is the
  intended sharing model: whoever holds the link acts within whatever the configs allow, and a password
  handed round a party is as shared as the party. So a surface may never leak one (no token in an OG tag,
  a log line, a referrer or an analytics row), and the defenses that matter are the ones that survive a
  leaked link: the config gates (the door's password, gates and Only me, An email first, A photo first,
  uploads closed), the per-request re-checks, and the host's own switches, which shut a leaked link's door
  without moving it. The link itself never rotates: the `qr_token` is printed on every QR, so it is
  permanent by design (a custom slug is a mutable alias to it, never a replacement).
- **The anon media RPCs gate on `visibility = 'open'`, NOT `<> 'private'`.** A password or gated album's media must
  NEVER stream through `get_event_media_by_qr_token` / the anon path; it is served ONLY via the server
  admin-reads (`getApprovedMediaForUnlock` and the paged album's reads, `album-guest.ts`), each self-guarded by
  the unlock cookie, the door's pass or the host (`isRequestOwner`): after `/api/guests/unlock` verifies the
  password, for someone the door let through, or for the host, who never meets a door. The bcrypt hash never reaches a browser: guest RPCs expose `has_password` only, and the server reads it only to derive (`has_password`, the cookie's version).
- **The unlock cookie is a signed HMAC of `{eid, exp}` and the event's password version** (`UNLOCK_COOKIE_SECRET`, 12 h;
  the version is a sha256 of the stored bcrypt hash, read server-side once per request, never in the cookie), so any
  `set_event_password` (a fresh salt, even for the same word) or `clear_event_password` signs everyone out; the unlock
  route reads the state before the bcrypt check, so a change landing mid-unlock can only fail closed, and a failed read
  fails closed and is reported. The cookie *name* isn't the boundary, the **signed eid** is. It fails CLOSED when the secret is unset. Password is
  set/cleared ONLY by `set_event_password` / `clear_event_password` (host-auth SECURITY DEFINER; the column
  is revoked from the host UPDATE grant), and those two own the STATE as well as the hash:
  `set_event_password` is the only path INTO `visibility='password'` (it flips hash and state atomically,
  which is what keeps the `events_password_requires_hash` CHECK satisfiable), and `clear_event_password`
  reverts to `open` only FROM `password`, never turning a `private` event public.
- **The page calls `getUser()` for every non-private, non-demo event**, because the gates must know whether
  the viewer holds a confirmed session. With NO session it's a cheap LOCAL null (no network), so an
  anonymous crowd behind one venue-NAT IP doesn't each pay an auth round-trip; the owner check
  (`isRequestOwner`, then `isEventOwner`'s explicit `host_id = uid` match, `gallery-access-owner.server.ts`) runs
  ONLY when signed in, and the album's own reads, its routes (`requestOwnerAnswer`: the same answer with its user, one
  `getUser()` for both) and the upload seams ask the same answer, so no gate on the page can disagree about the host. The header island resolves its own auth with a LOCAL `getSession()`.
- **The upload slot is `full`-only** (a `teaser`/`none` viewer is still at the door, which owns every step
  in front of them). At `full`, the upload panel while `accepting_uploads`, else the view-only line. A
  confirmed account with no profile name is asked at the door (`needsName` → the name step's `profile`
  mode), never in the album. At `teaser` the slot is the gallery + the "See all N photos & videos" button,
  which re-asserts the door; at `none`, the door is the page (name and count only).
- **A guest's OWN-photograph removal is never a client claim, and never a client list.** The two RPCs decide
  ownership inside themselves (`auth.uid()`, or the session token matched against the media's own guest row,
  which must belong to the media's own event, on an event that is not deleted) and the "mine" list that decides whether the control APPEARS is a server read on both paths. Three things
  that must stay true: `anon` never gets EXECUTE on `remove_my_upload_by_session` (service-role only, reached
  through `/api/guests/remove` behind the join limiter); a session token never travels in a URL; and a guest
  row with `user_id` set is untouchable by the session path, so a shared phone's stale token can never delete
  a signed-in person's photograph. ★ **A withdrawal is final for the host** (`removed_by_uploader`: a guest who
  takes a photograph back wants it gone everywhere, the host's view included): no host surface shows or
  restores it (the album and its viewer, Review, Deleted and `restore_media`, the home's pulse and the events
  list's counts and covers, the exports, the live reel), `host_storage_summary`'s Deleted figure counts
  it in neither number, and the confirm says so with no window ("It's deleted from the event right away and
  can't be recovered."), because a number of days reads as a hold the host can still reach.
  [`media.test.ts`](../../src/lib/db/queries/media.test.ts) pins the host reads against a withdrawn row.
- ★ **UPLOADS ARE HELD TO THE SAME OWNER: a guest row with `user_id` set writes only for that signed-in
  account, and a signed-in account writes only through a row of its own.** Presign AND complete (a presign
  outlives a sign-out or a sign-in), rename and attach-address ask `checkSessionOwner`
  ([`session-owner.server.ts`](../../src/lib/guest/session-owner.server.ts): the row's `user_id`, service-role and
  never returned, against `getUser()`, which answers locally with no session, so the signed-out crowd pays no round
  trip) and refuse anyone else with 403 `session_other_account`, under the lock and closed uploads and ABOVE the
  identity gate (a confirmed row's own `verified_at` is what let a stale ticket upload past An email first). A
  confirmed row whose account was deleted (`user_id` nulled by the FK, `verified_at` kept) writes for nobody. A
  name-only row is the device's ticket while nobody is signed in; ★ for a signed-in account it is asked of the claim
  then and there (`claim_anonymous_uploads` on that one ticket, as her: `whose_ticket` takes it when it is hers) and
  refused when the claim leaves it, since a sign-in rightly leaves other people's tickets on a shared phone and her
  photos went up under the typed name of whoever held it before her (crumbs-26). The client's side is "The upload act".
  ★ **THE READS FOLLOW THE WRITES** (`sortTickets`, the same file; crumbs-27): every read that carries a ticket beside
  a signed-in account keeps only the tickets that may speak for her (her own rows, or one the claim takes; signed out,
  every ticket is the device's and nothing is read), because another guest's name-only ticket on a shared phone would
  otherwise stand for her: the door's standing would count her let in, waiting or held through it, A photo first its
  contribution, and her Yours (the export's own ids, her tracker's statuses, `/api/guests/mine`) its photographs. The
  album's own filter reads no ticket for her (`LiveGallery` asks `/api/guests/mine` only while signed out). A failed
  sort sets every ticket aside and is captured, never thrown; a block on a ticket set aside still holds the phone.

## Joining + identity

★ **EVERY UPLOAD CARRIES AN IDENTITY, AND THE HOST'S SWITCH DECIDES WHICH KIND.** It is
**`events.require_verified_email`**, ON by default: on, a guest confirms an email before the full album and
any upload; off, a guest types a display name at the door and uploads under it with the unverified mark.
It is the one identity switch: its legacy twin `allow_anonymous_uploads` is read and written by no code, and
the identity contract (`20260923150000_identity_contract.sql`, applied after milestone 27) drops it with its
trigger (→ [database-security.md](database-security.md)). A nameless row, one minted before names were
asked, credits nobody.

★ **THREE LEVELS OF TRUST, AND A ROW IS AT EXACTLY ONE.**

1. **A typed name.** The public mark, whose word is **"Unverified"**, never "name not verified": names are
   never verified for anybody, only emails are.
2. **A typed name and an address nobody has proved**, in its own `guests.pending_email` column and **inert**:
   never shown to the host or to another guest, never attributed to any account, never mailed on its own,
   never expiring. It is a name with an invisible claim number, so the PUBLIC mark is identical to level 1
   (a mark that changed would announce that an address exists). Only the guest's own menu says "Email not
   confirmed". A member's address is accepted like any other, so there is no enumeration oracle
   (→ [auth-accounts.md](auth-accounts.md)). Once confirmed, the address claims its rows from the
   dashboard's claims review, one event at a time; what she says was not hers is removed once she confirms it, and
   what she never reaches waits (→ [host-app.md](host-app.md)).
3. **A confirmed account**, the only identity that uploads as itself.

One gap is accepted. On a names-mode event anyone can type any name and any unproven address. An unconfirmed
address is inert (never shown to the host, never attributed, never mailed), so a false one borrows nobody's
identity; a host facing a risky crowd picks a gate, An email first or moderation, and an
address's owner disowns what was not theirs in the claims review.

The address is ONE optional field under the name, in `join` mode only: "Email (optional)", the benefit line
"Come back to this album anytime, with every photo you add.", unfocused and never prefilled (the name's
cross-event prefill is a kindness; a carried address would show the last guest's to the next). A fresh
join sends it in ONE post; a HELD session renames, then attaches on `/api/guests/email`. The client parses
through `checkGuestEmail` ([`join.ts`](../../src/lib/guest/join.ts)) so a typo is refused under its own
field, and both forms (the name step, the add-email dialog) carry `noValidate`: a native `type="email"`
field otherwise lets the BROWSER block the submit with its own bubble before `onSubmit` runs, and the name
never goes either.

★ **NOTHING EVER STORES THE ADDRESS ON THE DEVICE.** The routes answer `email_attached`, a boolean;
`pr_guest_email_attached_<qr>` holds `"1"`; the address itself lives in `EventExperience` state for the
visit, only to prefill the offer card's door, and `collectStoredSessionTokens` never scans the prefix.

★ **THE NAME IS ASKED BEFORE THE ALBUM, NEVER AT THE FIRST ADD**: a guest who reached the album first would
reap it anonymously and meet the friction only when contributing. Its lede names nobody ("so the host knows
who to thank"; a long host name breaks the line). `guest-name-step.tsx` has FOUR modes: `join` (names mode,
the ONLY mode with the address, a ghost line that opens into the field: rename a held row first, else mint under the
typed name), `edit` (the album menu's, the one dismissible door) and `profile` (a confirmed account with no profile
name writes the PROFILE's; the album has no inline name panel, and the shared `SetNameStep` serves the host's
`/welcome` and the Library's demo) and `account` (the account's display name through `updateDisplayNameAction`, dismissible like `edit`;
no caller since the told name's Change opens its own form). The line under the name reads "You can change it anytime." (the working step); the two doors that
change a name show none. No unique name is claimed at the door.

★ **THE CONFIRMATION'S FOUR WRITES, IN ORDER, ARE THE MODAL'S,** shared by `identify` (Create account's name and
email to a code; at a verification event the email alone, the name asked after it of an account with none) and
`signin` (Log in, the email alone), and `entry-modal.tsx` owns the
sequence, because the door holds a name never sent anywhere and the
order decides whether a guest lands named or with no name at all: claim this browser's anonymous uploads →
`joinEvent` (verified and NAMELESS, since `create_guest` nulls a typed name beside a confirmed account) →
one own-row read of `profiles.display_name` → when null and a name was typed, `updateDisplayNameAction` →
hold the beat → refresh. Then she is TOLD: the name she typed is the account's now (the account's own name wins,
and is the one told), said once, with a Change. **The account's own name wins** over a typed one, and the door says so above
the field before they confirm. The typed name also rides the code request as `DOOR_NAME_KEY`, so a magic link opened
elsewhere lands named (`adoptDoorName`, [auth-accounts.md](auth-accounts.md)). "Signed you into the account you already
had" holds only when this device holds a guest ticket a claim would move.

- **The join carries the identity:** `POST /api/guests {qr_token, display_name?, email?}` → `create_guest`
  issues a `session_token` (localStorage, returning-guest) and returns
  `{display_name, verified, email_attached}` as the row was minted, never an echo of the request, so the
  door believes `email_attached` over its own form (a verified-required event and a confirmed session both
  null the field). The ROUTE owns the refusals: 422 `verification_required` (the switch is on and nothing was
  proved), `name_required`, `name_invalid` (over 60, a reserved name, or profanity, checked server-side
  because the obscenity matcher must never ship to a browser), `email_invalid`. ★ **The name requirement
  is the route's first**, and `create_guest` is the belt under it: it refuses a nameless mint by an
  UNCONFIRMED caller ("Add your name to upload.", which `createGuest` maps to `name_required` ahead of its
  `verification_required` fallback) and mints a confirmed joiner nameless by design (the identity contract).
- **Attaching an address afterwards:** `POST /api/guests/email {qr_token, session_token, email | null}`
  over the service-role `set_guest_pending_email` (its own `attach_email` limiter) answers
  `{email_attached}`, never the address. Callers: the door's held-session path and the header menu's Add
  your email. A VERIFIED guest is refused (403: their address is their account's). An explicit `null` or a
  blank DETACHES; no guest surface calls that arm. The dashboard's "Not mine" is a different act:
  `disown_guest_rows_by_email` removes that row's uploads and detaches the address.
- ★ **VERIFIED MEANS `guests.verified_at`, NEVER A `user_id`.** An unconfirmed sign-up carries a real
  `user.id` and keeps its typed name, so `user !== null` is not the test: the route reads
  `user.email_confirmed_at`, and `create_guest` stamps `verified_at` from `auth.users` itself (a proved
  claim stamps it too). The ONE precedence rule ([`uploader-identity.ts`](../../src/lib/media/uploader-identity.ts))
  reads the same way: host → `verified_at` set means the PROFILE's name, verified → else the typed
  `guests.display_name`, unverified → else no name at all (a row minted before names were asked), which
  credits nobody.
- **Naming a row afterwards:** `POST /api/guests/name {qr_token, session_token, display_name}` over
  `set_guest_display_name`, for a nameless row or a new name; its own limiter kind (`rename`), tighter than
  `join` and still venue-sized. A VERIFIED guest is refused (403): one row never carries two names. ★ **A
  HELD SESSION TOKEN ALWAYS TRIES RENAME FIRST, WHICHEVER DOOR OPENED IT.** `guest-name-step.tsx` calls
  `renameGuest` whenever a session token is held, so a device with a session but no LOCAL name never mints a
  SECOND row and strands the first one's photographs with no name; it falls back to `joinEvent` only on
  `invalid_session` (a DEAD token, the route's own `NO_DATA_FOUND`), `unauthorized` (a verified row: the
  route, not the component, is the truth) or `session_other_account` (an account's row the viewer is not,
  whose ticket goes down first).
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
  a typed name the localStorage `session_token` is the dedupe, and `guests` still has NO unique
  `(event_id, user_id)`: an account is optional, two people may type one name, and a claim can take a typed name's
  rows onto an account beside its own.
- **Supabase anonymous sign-ins stay OFF.** Capability tokens already give a guest immediate, scoped use,
  so a per-scan `auth.users` row would be pure DB bloat, and an anonymous session carries no email to
  satisfy the gate. The account layer AUGMENTS the guest flow and never replaces it: the contribution
  pipeline runs identically whichever identity the uploader carries.
- **`require_verified_email = true` gates the VIEW as well as the upload**, free on every tier (see
  [host-app.md](host-app.md)); turning it OFF is the opt-in, behind a consequence-confirm, not a paid
  feature. The door's verification step is `identify`: the email alone over
  [`<EmailSignIn>`](../../src/components/auth/email-sign-in.tsx)'s emailed code (one path for a new or an existing
  guest), with the teaser behind, then the name only for an account with none (Will: "handle name after so we aren't
  handling two different versions for every new event on that account"); Google and the password link live under the
  chooser's Log in ([`<AccountDoor>`](../../src/components/auth/account-door.tsx)'s `signin` wear). `create_guest`
  derives identity (`user_id`, `email`, `verified_at`) from the trusted uid, NEVER the client.
- **The named unverified are LISTED, with the mark:** `getEventGuestList(id, {includeUnverified: true})`
  appends them after the profile cards, one entry per guest row (without an account there is nothing to
  de-duplicate by, so two people who both typed "Sam" are two entries), and the union splits before
  hydration because they have no avatar to resolve (the guest album with its own two filters, the Guests room
  through `splitGuestList` in [`social/cards.ts`](../../src/lib/social/cards.ts)).
  The host hub keeps the default and its narrow list.
- **Claiming anonymous uploads on sign-in:** an anonymous upload is a `guests` row with `user_id IS NULL`
  whose `session_token` the browser still holds (`pr_session_{qr_token}`). On sign-in,
  [`claim-uploads.ts`](../../src/lib/guest/claim-uploads.ts) enumerates those tokens (the shared
  `SESSION_PREFIX`, [`session-tokens.ts`](../../src/lib/guest/session-tokens.ts)) and calls the
  authenticated `claim_anonymous_uploads(text[])`, which touches only still-unclaimed matches
  (`user_id IS NULL` ⇒ never steals an owned row; ≤1000 bound) that are HERS. ★ **A PARTY'S PHONE IS PASSED
  AROUND, so whose a ticket is has one rule, `whose_ticket`** (`20260929234000`): a typed address settles it (hers
  only when it is her own confirmed one; any other waits for that address's owner, whose claims review lists it, and
  no answer on the phone can take it); with none, a ticket under no name or under hers is hers, and one under a
  name at odds with hers (a different first word, case and marks aside; hers is her profile's, else the name her
  sign-up carried, the door's `door_name` or Google's) is ASKED about, never taken. After every claim
  `claim_ticket_asks` answers those per name and [`claim-ask.tsx`](../../src/components/shared/claim-ask.tsx)
  (the `(app)` layout's and the album page's) asks once no door or sheet is up, "3 photos were added on this phone
  as Dana. Are they yours?": They're mine claims exactly those (`claim_asked_uploads`, never an address, naming no
  profile); Not mine is remembered for that account on those albums (`pr_not_mine_<qr>`, put down with its
  ticket); a question put away unanswered comes back on a later visit. ★ On the album whose own uploads a yes carried,
  it plays the follow moment (her answer is a confirmation of those very photos), never the toast. ★ The same read
  answers each held ticket typed under an address that is not hers (`kind` address, its live uploads, never the
  address: `20260930110000`), which nothing takes or asks about, so a confirmation that left this album's photos for
  the address typed with them says where they are instead of telling a name they do not carry: "Your 3 photos here
  were added with another email." / "They stay with the email you added with your name. Sign in with that email to
  keep them." (`claimLeftForAnotherAddress`, asked by the page before it speaks). A proved row whose account was
  deleted goes to nobody. An UNCONFIRMED caller matches no address and stamps `user_id` alone; a CONFIRMED caller's
  claim is proved (the device plus the address), so it also stamps `verified_at`, copies the account's email into
  `guests.email`, clears `pending_email` and the typed name, and names a nameless profile from the newest row it
  took. ★ The number it returns is the claimed rows that
  carry a LIVE upload (an empty row is stamped but not counted: claiming it carries nothing). It fires from the
  `(app)` layout's mount (a loud "We added your uploads to your account." whenever uploads moved), the album's
  `useConfirmReturn` (split this album / the rest, which decides the follow moment and the toast; see "THE
  RETURN" above) and the in-page sign-in handlers; module-level guards dedupe, and the `IS NULL` makes a
  reload's re-run a silent 0-op (no sessionStorage flag).

## Live gallery: the hybrid doorbell

- **Architecture: ONE live source for the album AND the reel.**
  [`gallery-live.tsx`](../../src/components/guest/gallery-live.tsx)'s `GalleryLiveProvider` owns all
  gallery state (the refreshed list, the arrival ids, this device's own ids and optimistic tiles, `refresh`,
  the doorbell, the poll, the ETag, the stricter-drift guard, the live reel's facts) over the paged album's
  client store ([`src/lib/album/store.ts`](../../src/lib/album/store.ts): the manifest, its version, and
  links by id), and hands it down through `useGalleryLive()`; the doorbell and the fallback poll both call
  its one `sync()`. [`live-gallery.tsx`](../../src/components/guest/live-gallery.tsx) is the
  album's VIEW over it (mounted with no provider above it, it brings its own), and the reel
  ([`reel/live-reel.tsx`](../../src/components/guest/reel/live-reel.tsx)) reads the same context, never the
  seed promise, so an upload that reaches the grid reaches the reel in the same breath.
  [`event-experience.tsx`](../../src/components/guest/event-experience.tsx) is the SHELL around both and
  streams the seed in via `<Suspense>` (the RSC passes `streamGallerySeed`
  ([`gallery-access.server.ts`](../../src/lib/events/gallery-access.server.ts)) down UN-awaited, `loadGallerySeed`
  with a handler attached the moment it exists: a seed that failed before React held it was an unhandled rejection,
  and Vercel exits the function on one; `use()` resolves it behind
  [`gallery-skeleton.tsx`](../../src/components/guest/gallery-skeleton.tsx) so the presign-heavy payload
  never blocks the shell's paint), and the store adopts it as its own first `sync()`, answered locally.
  `key={access}` remounts it on an access flip (teaser → full) — a clean re-seed, no resync effects.
  ★ A seed whose read fails (a refusal answers locked, never a throw) is the album's failure alone, and the live
  source stands through it: `readSeed` reads it rather than throwing it (Next's own throws still pass on; ★ adopted
  with `Promise.resolve` first, since the page's promise is React Flight's thenable, whose `then` chains nothing), reports it
  (`render:guest`, seam `album`), and the store's own first `sync()` asks the server for the whole album. The album
  draws its skeleton while that read is in flight, then the card "The album didn't load" if it failed too
  (`albumRead`), and heals in place with no refresh on the next answer: the poll, a doorbell, her own upload or Try
  again (the store's sync). Her uploads list, the reel and the door's light keep their source throughout, and the
  header keeps the page's count (an unread album is not an empty one).
  [`album-boundary.tsx`](../../src/components/guest/album-boundary.tsx), around the Suspense and the live source, keeps
  a crash where the album renders to the album: the header, the door and Add photos stand, and its Try again is the
  router's refresh and the boundary's reset in one transition. A boundary of its own: Next 16.2's
  `unstable_catchError` does the same and cost the album's chunk 2.1 KB gzipped on `next build`, this one 0.5 KB.
- ★ **A link is read by id at the moment it is needed and re-minted before it ages** (`ensureLinks` for a
  window, `onNeedLinks` for the viewer, `clips` for the reel), never held past its life. ★ At most two link requests
  are out at once (`lib/album/links.ts`): what a burst asks meanwhile goes as one request when a place frees, its
  newest ids first, and a request stalled past 8 s gives its place up, so a held arrow key's walk of the 1,145-photo
  probe asks about 300 times, not 1,091, and the photograph it stops on is linked within a round trip or two; the
  provider's
  watchdog (`reportPossibleExpiry`) treats any image or reader failure as a possible expired presign (a tab
  asleep past the 90-minute expiry answers a CORS-shaped failure with no status) and re-mints only the ids
  whose picture failed, at most once a minute each, never in the demo.
- **The doorbell:** the `media_gallery_doorbell` DB trigger sends a contentless `ping` on the PUBLIC
  Realtime broadcast channel `gallery:<qr_token>` whenever what a guest's album shows changes: the visible set
  (uploads, moderation flips, restores, purges) or what waits (a held upload, its approval or refusal, a row sealed
  for the develop: their count rides the sync, [disposable-mode.md](disposable-mode.md)); hidden-internal
  transitions stay silent. The token IS the channel capability; the ping carries no data, the refetch is
  access-gated server-side.
  Client: [`use-gallery-doorbell.ts`](../../src/lib/guest/use-gallery-doorbell.ts) + a leading-edge
  coalescer ([`refresh-coalescer.ts`](../../src/lib/guest/refresh-coalescer.ts): immediate refetch, ~2 s
  suppression + jitter, one trailing flush for bursts).
- **The conditional poll** (the shared [`use-live-poll.ts`](../../src/lib/shared/use-live-poll.ts)): the
  fallback cadence keys solely off the channel state — **60 s** while `SUBSCRIBED` (a safety net), **12 s**
  when the socket is down; it stops when the tab goes hidden and polls again when it is shown. Every poll sends
  `If-None-Match`; a quiet album answers a **bare 304** having read one row, its version; a change answers the
  DELTA since the version this device holds, merged by id and checked against the server's count read in the
  same snapshot (a mismatch heals at once with a fresh manifest, never drawn); see the ETag invariant below.
  ★ A version below the album's WATERMARK answers a fresh manifest too: the purge cron prunes a purged item's change
  row and raises the watermark to its version in one transaction ([lifecycle-recovery.md](lifecycle-recovery.md)),
  so a device parked below it may have missed the row, and is sent the album whole, never a delta with a gap.
- ★ **The gallery ETag must never validate across access levels, nor across the gate behind one** — the
  validator (`guestAlbumEtag`, [`album-validator.ts`](../../src/lib/events/album-validator.ts)) hashes
  `access` + `gate` + the album's and the attribution's VERSIONS (never the item list itself, so a quiet
  poll costs one row) + the live reel's facts (`reel`, so a host's switch reaches an open page); the
  teaser's validator ALSO carries the presign bucket, since its nine photographs travel inline with their
  links, but at full access there is none, since a link rides its own ask and re-mints itself before it
  ages. The not-found/private early return carries NO ETag. A teaser validator replayed with full-access
  cookies must 200, and a guest whose gate moved from `account` to `upload` never 304s onto the step they
  passed.
- **Reconcile by id — do NOT `setState` the raw sync result:**
  [`reconcile-album-items.ts`](../../src/lib/guest/reconcile-album-items.ts) rebuilds an item only when
  something it draws changed (its manifest entry, its link, its blob or its name), walking the manifest
  once and handing back the SAME object for everything else, so the memoized tile of a photograph that did
  not change skips its render and an ordinary sync touches no `<img>` it does not need to. A link is held
  until it dies, not until the store forgets it (`expiresAt`, on this device's clock, `ALBUM_LINK_REMINT_MS`
  an hour): a tile waiting on its re-mint keeps drawing the link it had rather than going blank.
- **Optimistic tiles only for LIVE-approved media:** a completed upload prepends a local `createObjectURL`
  tile at the file's own measured shape, or a square if nothing measured it within 400 ms
  (`MEASURE_TIMEOUT_MS`), so the row does not re-lay when the manifest brings the real entry — but ONLY
  when `create_media` returned `approved`. Its object URL is the blob re-key's ("The upload act" above,
  `UploadedItem.queueId` to the media id), read by
  [`reconcile-album-items.ts`](../../src/lib/guest/reconcile-album-items.ts)'s own ledger, by media id;
  `merge-gallery-items.ts` is gone. Completions reach the provider through a `LiveGalleryHandle` callback
  ref (with a pre-mount buffer, since the gallery streams in async). ★ **It lands once**: when its link lands (half a
  second later in a local walk), `MediaTile` takes the presigned preview IN PLACE over a tile already showing its
  object URL, the browser drawing her picture until the preview is ready, where it used to drop to the shimmer for
  the preview's load (344 ms there) and fade in a second time (crumbs-32's measured walk; `media-grid.test.tsx`).
- **What THIS DEVICE draws at the album's head**, in
  [`gallery-rows.tsx`](../../src/components/guest/gallery-rows.tsx)'s own head slots, a square each, and
  nowhere else:
  - ★ **ONE stack for a pick in flight**:
    [`upload/stack-tile.tsx`](../../src/components/guest/upload/stack-tile.tsx) draws the file actually in
    the air (the queue runs one at a time) with two ghost edges behind it and, at its foot, everything the
    tile SAYS — "N to go" and the progress bar on one pane. A single file is a stack of one and says no
    count. ★ Only where what she adds shows at once: where it waits (`addsWait`, the page's `addsWaitFor` over
    `uploadsWait`: a guest's wherever uploads wait, the host's own only for a develop time ahead, never the demo's)
    nothing of hers in the air draws at the head, since a held or sealed landing then vanished from it (red-team
    44: a video stood in the album for its whole upload); her tracker has it from the press, sending, then waiting.
  - ★ **Nothing for a held file** (`voice-guest` r2, Will's `held=uploads`): a completed upload on a
    `hold_for_approval` event shows only in her uploads, the tracker's badge beside Add counting it, until the host
    lets it in and the manifest brings it like any other photograph. Its object URL stays alive for her uploads'
    picture of it (nothing not in the album is presigned for a guest).
  - ★ **Her tracker says where each of hers stands**
    ([`upload-tracker.ts`](../../src/lib/guest/upload-tracker.ts), pure): this visit's queue plus her own rows through
    `/api/guests/mine` `{statuses: true, tell: true}`, read at mount, at each opening and when one of hers arrives in
    the album out of waiting (`newlyInAlbum`: a host decides a pick in one go, so the refusal beside it is learned
    with it), never on a timer; an approval arrives live through the album's sync, a refusal at the next read. ★ Each
    read also answers her NEWS ([`let-in-news.ts`](../../src/lib/guest/let-in-news.ts)): the uploads of hers a
    decision let in (`media.let_in_at`, stamped by a trigger) since each row's `guests.let_in_told_at`, the mark
    moved forward as the read answers, so the approval toast plays on a reload, a return or her account's other
    device, once ([reel.md](reel.md)); the store hands the ids on (`news`), never through the page's shell. Its words
    (`TRACKER_WORDS`) are "Developing" for anything of hers that waits (the-wait r1, Will's `model=time`: held for the
    host or sealed for a develop, one word, the clock telling them apart in the list's head, `waitRule`: "Uploads
    develop as Maya lets each one in." or "Uploads develop all at once at 9 am."), "In the album" and "Not approved"
    (`TRACKER_TELLS_REFUSAL`; a refusal keeps its plain word, so a photo turned down never reads as one developing),
    the one name each state has wherever it is said (the badge's spoken count, "N developing", the camera's list, the
    help, the album feature page's mock); what is in the album draws its album link, this visit's file its own picture,
    and an earlier visit's waiting one the picture her rows' read presigned for her alone (`picture`, read whole by
    `ownUploadOf`). ★ It publishes her waiting shots to the album's contact sheet (`herShotsOf`, the store's `hers`). ★ **It stands wherever what she adds waits** (red-team 43: `uploadsWait`, read by
    the page's server: the host's approval, or the album's develop time ahead through `developState`; read as approval
    alone, a develop album's shots said "joined" and vanished on a reload). ★ The page holds that reading LIVE
    (`useLiveUploadsWait`, red-team 44: read once, a page open across a develop kept its promise over the developed album):
    the develop time coming on the device's clock ends it, and every full sync's word on the develop moves it (the
    provider taps each answer, `developsAtOf`: a Develop now, a time set, moved or taken away), approve-each keeping hers
    waiting for as long as the page's event says so; the album's rule and the camera, the album's head, the tracker, the
    keep and the failure sheet all read it, with no reload. A shot approved and sealed for the develop (her rows' read
    says `sealed`, or this visit's file on an album that seals what is added, `sealing`) waits as a held one does,
    "Developing", counted and hers to take back. ★ What waits for the host is still hers to take back (Will's live walk: "Definitely
    need a way to delete pending uploads"): each of hers not yet in the album wears a Remove (`upload-tracker.tsx`),
    on the album Delete's own paths (`remove_my_upload` for an account, `/api/guests/remove` for a ticket, both taking
    any of her rows not already removed), so it never reaches the host's Review; no confirm, since nothing else in the
    list asks one. It says Removing while it works, leaves her list through the page's own record (`removedIds`, which
    also takes it out of what is in flight, so an emptied album asks for its first photo again and a require-an-upload
    album asks the server whether its door stands), and stays with Try again when refused.
  - ★ **Nothing at all for a file that did not go** (the failure sheet owns it), and nothing for one already
    in the album.
  ★ The stack wears the album tile's `data-lit` bright edge, bound by
  [`lit-edge-contract.test.ts`](../../src/components/shared/lit-edge-contract.test.ts)'s closed list, so a
  photograph never gains or loses an edge at the moment it finishes uploading. Its pane is the ONE glass
  material at the marks' blur with `--glass-tint` re-pointed to 0.34, MEASURED for white over a pure-white
  photograph at 4.78:1 (the floor is 4.5:1).
- **The ARRIVAL, one grammar for a guest and a host alike.** TWO marks, differing only in whose photograph
  it is: `data-arrived`, the glow of a photograph that appeared by ITSELF, and `data-landed`, the one pass
  of light a guest's OWN landing takes. The ONE grid ([`shared/masonry.tsx`](../../src/components/shared/masonry.tsx))
  writes both from two sets the surface hands down, [`shared/arrival.css`](../../src/components/shared/arrival.css)
  draws both, and both read their life from [`lib/shared/arrival.ts`](../../src/lib/shared/arrival.ts),
  written onto the album box as `--arrival-glow-ms` / `--arrival-sweep-ms` so attribute and keyframe never
  disagree. `newArrivalIds(prev, next)` ([`reconcile-album-items.ts`](../../src/lib/guest/reconcile-album-items.ts))
  reports the ids NOT on screen a moment ago (the only definition that catches every route in: a doorbell
  arrival, a held item approved an hour later, a burst after a hidden tab wakes), by the grammar's one diff
  (`newIds`, `lib/shared/arrival.ts`, which the host's grid reads too) plus the guest's own seed rule (a last answer
  that was no album names no arrival, `albumOnScreen`: a teaser's, a locked page's and an unread album's carry no
  entries by design; a real empty album's first photograph does arrive, as the host's does), and `arrivalMarks()`
  (pure, contract-tested) takes one's OWN landings out of the glow and gives the NEWEST the sweep. ★ The
  glow holds PER ID (two guests a beat apart each get a full life); the sweep is EXCLUSIVE, so a fast batch
  never stacks light up the gallery. ★ Three things never glow: the SEED render and an album opening under a mounted
  provider (the entrance stagger is that moment's motion), a rolled presign, and this guest's OWN upload (it sweeps). The GROWTH is
  the `[data-media-tile]` entrance in `globals.css`, deliberately not re-declared. The rows push an arrival
  in from its left edge and glide what it moved; a head arrival while the reader is deep scrolls by exactly
  how far the photograph at the view's top moved, so nothing they are looking at jumps. Reduced motion: a
  plain appearance, no mark.
  ★ **An arrival lands COMPLETE, or not until it can** (`shared/use-arrival-gate.ts`, in `GalleryRows`, which takes
  `arrivals` rather than the glow's set and writes the glow itself; the host's album runs the same gate,
  [host-app.md](host-app.md)). A delta brings the manifest's tuple with no
  link (`url: ""`; only a window asks for links), so an arrival pushed at once drew a shimmer and then faded its
  photograph in after the wipe was over. The gate holds each arrival the grammar names out of the rows, asks for its
  link (`onNeedLinks`, `ensureLinks`), fetches and decodes its photograph into the document at the tile's own address
  (`decodeTileImage`, `tileImageSrc`), and lets it in when that is done, so `MediaTile` finds it complete
  (`data-instant`) and the push reveals a photograph. It waits at most `ARRIVAL_DECODE_WAIT_MS` (2s; a failed decode
  is let in at once, and either mounts and fades as before), holds at most `ARRIVAL_HOLD_MAX` (12) at once, waits
  for a video with no preview's link alone, and never holds the seed, a filter's or step's toggle, an arrival the
  Yours filter hides, this device's own landing (a manifest that beats its `notifyUploaded` releases it the moment it
  is known) or anything under reduced motion. The glow is lit when it is let in: the provider's hold began at the
  delta and a second's wait would have cut its light mid-fade. The marketing stage (which pre-decodes its own) and
  the lab's harness push what they are handed.
- **A guest's own photographs, removable ever** (final for the host too): two identities, one control.
  SIGNED IN → `removeMyUploadGuestAction` ([`actions.ts`](<../../src/app/(guest)/e/[token]/actions.ts>)) on
  `remove_my_upload` (`auth.uid()`, any device, for ever); ANONYMOUS → `POST /api/guests/remove` → the
  service-role-only `remove_my_upload_by_session` (the Invariants above). ★ **"Mine" is ALWAYS a server read,
  never a client claim**: the signed-in list is one indexed read in the page RSC (`listAccountMediaIds`),
  the anonymous list is `POST /api/guests/mine` (`listSessionMediaIds`, the token in the BODY, fetched once
  per mount, and read only as far as the ticket is hers to the viewer); both live in [`mutations/guest-media.ts`](../../src/lib/db/mutations/guest-media.ts). It is
  deliberately NOT in the gallery payload or its ETag: that fingerprint is per ACCESS and shared between
  viewers, this list is per person. Between those reads `GalleryLiveProvider` adds what this visit completed and drops
  what this visit removed, on EITHER identity (the completion and the removal are themselves server answers), so
  a signed-in guest's new photograph has its Trash and mark at once and a removed one stops counting. The ids
  reach the grid as `canDelete`, gating the lightbox's Trash per item. A removal marks `removed_by_uploader`, so
  the host's bin never shows it and `restore_media` refuses it (the Invariants above); the purge cron reclaims the
  bytes after `RECENTLY_DELETED_WINDOW_DAYS`, which the guest's confirm deliberately never names. The personal
  Uploads on a profile share that confirm and hold one other kind: an upload to an event the viewer HOSTS is
  `remove_my_upload`'s host arm, restorable from that event's Deleted, so the owner mode marks it `isHost`
  ([`owner-sections.tsx`](<../../src/app/(guest)/u/[slug]/owner-sections.tsx>), an event the viewer hosts) and
  the lightbox gives it the host's words (Deleted, and the window). ★ **So is the album's owner on her own guest
  page** (she is never her own guest): hers are the rows with no guest, read through her own RLS-scoped client
  (`listOwnerMediaIds`; never a guest row's, which the RPC's guest arm refuses the event's host), so a reload keeps her
  Delete on every upload of hers, as the hub does; and the provider knows them as the host's from their first frame
  (`isOwner`, reconcile's `hostOwn`), so her Delete says the host's words before any link's attribution lands. The post-upload card counts this visit's
  uploads still in the album (the page keeps the removed ids) and leaves once none is left. ★ **On a
  Require-an-upload-to-view album with uploads open, removing your LAST live upload closes the album again** (Own
  deletes close it), unless the album is FULL (the gate fails open there, so the page reads `albumFull`, a second
  identity-less gate read for a guest who has contributed, and the line stays silent), and the confirm says so
  first: `LiveGallery` hands the lightbox the line through the `DeleteConsequence` context
  ([`delete-consequence.ts`](../../src/lib/guest/delete-consequence.ts); the lightbox sits under a grid other
  surfaces own, so a prop cannot reach it), counting the guest's own ids plus any held file still waiting. When
  that removal lands, the page refreshes onto the server's answer at once rather than holding the album until the
  guest's next act (the stricter-drift rule is for a host's switch, not the guest's own choice).
- **And WHICH tiles are a guest's own:** the same server-read set feeds the **Yours filter** alone
  ([`yours-filter.ts`](../../src/lib/guest/yours-filter.ts), pure), while the Download menu's Yours row is read by
  `/api/export/guest` itself, from the account and this browser's ticket cookie, as far as the ticket is hers
  ([uploads-and-r2.md](uploads-and-r2.md));
  a guest's own tiles wear no mark, so the ONE View
  menu ([`view-menu.tsx`](../../src/components/shared/view-menu.tsx), the host gallery's own object) beside "Download
  all" in [`live-gallery.tsx`](../../src/components/guest/live-gallery.tsx) is the filter's one door: a Showing group
  (Everyone's / Yours (n)) only while the guest owns something. Yours narrows the album under a "Showing yours · Show
  all" line, the filter's receipt and its way out; the count line keeps saying how big the WHOLE album is, and the
  filter cannot stay live once the guest owns nothing, so removing your last photograph never strands you in an empty
  view. The menu also carries a Size group (`kind:
  "density"`: `album-columns` r2's three steps, in their plain names before the album has measured its box
  and in photographs a row after). ★ **THE STEP ITSELF IS SERVER-RESOLVED, NEVER A CLIENT-ONLY READ**: the
  page reads the shared `pr_tile_size` cookie the host dashboard does
  ([`tile-size-cookie.ts`](../../src/lib/shared/tile-size-cookie.ts)'s `resolveRowStep`, which also reads a
  masonry surface's legacy width) and threads it as `initialRowStep` through `EventExperience` to
  `LiveGallery`, so the first paint is the step a returning guest picked; the write rides `setRowStepAction`
  ([`actions.ts`](<../../src/app/(guest)/e/[token]/actions.ts>)), the host action's mirror. The marks are
  omitted wherever Remove is (the demo, a locked gallery).

## Auth-aware header island

[`guest-header.tsx`](../../src/components/guest/guest-header.tsx): logged-out → a quiet "Start for free"
CTA (the SSR default → zero flash for the anonymous majority); logged-in → the visitor's account menu
([`guest-account-menu.tsx`](../../src/components/guest/guest-account-menu.tsx)), fetched via
`GET /api/me/menu?event=<id>` ONLY when a session exists (the avatar is the viewer's public Storage URL;
event-ownership is an RLS-scoped select → the owner-only "Manage event" deep link). ★ **It follows the device's
session, never reads it once** (a `router.refresh()` does not re-run a client island): a look at the cookie (local,
and free for the account already drawn) on the SDK's sign-in and sign-out, the Cookie Store API's `change` (it reaches
a tab nobody is looking at, where a response that cleared the cookie elsewhere is otherwise unheard), the tab being
looked at again, and the door settling on a guest (a stored name or ticket written while an account stands, which
also asks the server, since only its 401 knows a session revoked on another device); a server that stumbles never
drops an account, only a 401 does. The menu's **Sign out**
puts EVERY guest ticket on the device down, not only this album's (`leaveAllGuestSessions`: the localStorage
tokens, names and flags through the module-singleton `emit()`s in
[`use-stored-session.ts`](../../src/lib/guest/use-stored-session.ts), every `pr_guest_*` cookie through
`POST /api/guests/leave` `{ all: true }`, on `/u/[slug]` too), signs out, then `router.refresh()`s — so the
visitor STAYS on the event page, a verified-email event re-gates to the door's `identify` step, and the next person on a shared device inherits nothing.

★ **A THIRD STATE, for the commonest person at a name-only party**: signed out WITH a stored name, the
header wears [`guest-name-menu.tsx`](../../src/components/guest/guest-name-menu.tsx) instead of the
stranger's CTA — the name, its label (read from the mark, so the two cannot drift), then the email row,
Change name, and Log in (the `signin` wear, whose door reads "Log in" too). ★ **AND IT IS THE ONE SURFACE THAT KNOWS ABOUT AN UNCONFIRMED
ADDRESS**: it reads the device flag `pr_guest_email_attached_<qr>` (never an address; none is stored) and
draws two states above a card reading "Keep this event" (the keep's own title). Name only → "Unverified" under the name and
**Add your email**
([`add-email-dialog.tsx`](../../src/components/guest/add-email-dialog.tsx): one field, the door's own
promise line, Save over `attachGuestEmail`, and "Confirm it now instead" handing to the code door). Address
attached → "Email not confirmed" and **Confirm your email** (the one confirm door, its field EMPTY because
nothing kept the address, and its description saying so: "Enter the email you added and we will send a
code."), with a quiet "Change or remove it" that overwrites the pending address or detaches it (`email: null`,
behind `PENDING_EMAIL_REMOVABLE`, Will's to decide); a confirmed address changes only on the account page. An ACCOUNT always wins the slot: a signed-in visitor's menu is the
truer answer to "who am I here", and their credit is not marked at all. **No Sign out row**: there is no
session to end, and clearing this browser's token would orphan the photographs this device can still
remove. ★ Change name cannot reach the entry modal's handle (this header is a SIBLING island of
`EventExperience`), so it goes through [`name-door.ts`](../../src/lib/guest/name-door.ts), the same
module-singleton shape, for the same reason, as the stored session's own `emit()`.

## Demo mode

Env-gated (`NEXT_PUBLIC_DEMO_QR_TOKEN`; [`demo.ts`](../../src/lib/demo.ts)): `isDemo` is threaded from the
page through `event-experience.tsx`; the page resolves the demo straight to `full` without the resolver,
the doorbell and the poll are off, the silent join skips `POST /api/guests`, and the queue skips the real
upload — `simulateUpload` returns a synthetic `approved` outcome so the optimistic tile appears but is
**never persisted**. The marketing side of the demo → [marketing-content.md](marketing-content.md).

★ **EVERY DEMO VISIT IS FRESH, EVEN A RETURNING ONE**, so every demo runs end to end.
[`use-welcome-seen.ts`](../../src/lib/guest/use-welcome-seen.ts) takes `isDemo` and, while true, keeps
"seen" in per-mount state: unseen on every mount, advanced by Continue for this visit only, never written
to localStorage (a `markSeen()` that persisted would hand a returning visitor the upload step with no role
welcome). `hasContributed`/`returning`/`skipped` need no equivalent: the demo never reaches the name step
(`computeDoor` excludes it whenever `isDemo`), never mints a real session (`simulateUpload` performs no
network call), and `skipped` is plain component state a fresh mount resets.

**The demo's own arrival, framing and turn** (`entry-modal.tsx`, `guest-header.tsx`, `event-experience.tsx`).
The demo takes the SAME welcome step a public event does, at the same open doorway, and `entry-modal.tsx` reads its
own `isDemo` prop to swap that step's words for `RoleWords` (`door/welcome.tsx`: a role, not an invitation: whose
party this is, that the visitor stands exactly where a guest stands, the one thing to try; Continue, with a ghost
"Start your own"; its chevron's review shows the same role step). Its itinerary is `[welcome, upload]` with no name, and the upload step's skip reads "Look around".
`guest-header.tsx`'s `isDemo` prop pins the header to the top of the screen with a Demo mark beside the
wordmark, so the admission survives every scroll (on the cover in white at the page's top, on the page's paper the
moment it moves). A completed (simulated) upload surfaces `TurnCard`
(`guest-upload.tsx`) directly above the album's first tile (the photograph just added, since the album is
newest-first); the cover's row carries "Start your own" in glass (a line of its own at a phone), and a closing card
repeats the offer below the whole album, in the report footer's place (hidden for the demo).

**The phone pair: one broadcast channel, no stored bytes, no new table** (`lib/demo.ts`, `event-experience.tsx`).
A demo tab that did NOT arrive via a scanned link mints its own id (`crypto.randomUUID()`) and folds it into
its own Invite sheet's link (`?pair=<id>`); a tab that loads WITH that param is the phone side. Both open a
Supabase Realtime BROADCAST channel keyed by the id (`demo-pair:<id>`, never the shared `gallery:<qr_token>`
channel every stranger on the public demo shares) — the doorbell's MECHANISM, never its channel. The phone
sends its upload's downscaled thumbnail (`fileToPairThumbnail`, a canvas-encoded JPEG, `httpSend` over REST,
so no subscribe/teardown dance for an occasional message) the moment its own (simulated) upload lands; the
laptop decodes it back to a `File` (`pairThumbnailToFile`) and feeds it through the SAME optimistic-tile
path a real upload uses (`GalleryLiveProvider`'s `notifyUploaded`). A video carries no thumbnail (no cheap
client-side poster frame): the laptop's line says it arrived without a tile. Nothing is persisted; the
channel forgets everything the moment either tab closes.

**The reel in the demo.** The cover and the view run as on any album (the demo resolves to `full` and its
facts are read the same way), and its reel plays the optimistic tiles too, so a visitor's own simulated
photograph joins the loop. The view's Add yours is the page's own simulated Add ("Add yours (a demo
upload)"); there is no creator and no approval toast.

## The live reel

The view that is also the wall, the approval toast and the creator's seam are [reel.md](reel.md)'s. What this page
owes the reel: the gallery payload carries its facts (the one live source, above), the reel lives in the head (the
cover's stills and its round, and the shutter's twin, told through the head's bridge: no tile stands above the
album, and the creator's door is the view's Make your own), and the welcome comes before any reel, `?reel=screen`
included. ★ **A viewer who owes no door arriving on `?reel` meets the reel, never her album** (the owner from her hub's
Reel card, a `<Link>` to `/e/<token>?reel`, a soft navigation kept one; a returning guest on a shared reel link,
red-team 44): the view is a lazy chunk that opens after the page mounts, so the album painted first and flashed under
it. The page's server knows who asked (`reelAsked`: the door's first byte, `doorArrival`, drew no stage and no scrim, at
full access; a newcomer's welcome, or a step a guest still owes, comes first and the reel after it), so the view's own
black stands from the first byte of a hard load and the first commit of a soft one (`data-reel-curtain`) and the view
opens over it; the curtain goes the moment the address stops asking (the view closed, or the reel turned out not to
play) and never comes back for that visit. It stands on the album's word to the head, which is the address as it
stands when told ([reel.md](reel.md)'s address: a soft navigation's first render reads the address it left, and a
copied "absent" took the black away in the task it was drawn in); `event-experience.curtain.test.tsx` pins both
orders.

## See also

[database-security.md](database-security.md) (the capability-RPC inventory) · [auth-accounts.md](auth-accounts.md) (the sign-in the account gate uses) · [uploads-and-r2.md](uploads-and-r2.md) · [notifications-analytics-growth.md](notifications-analytics-growth.md).
