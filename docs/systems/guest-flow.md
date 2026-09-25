# Guest flow — the `/e/[token]` event page

> ROLE: what a guest (or a signed-in visitor) experiences on the one event link, and how joining/uploading is gated.
> BELONGS HERE: the `/e/[token]` page, WHO A GUEST IS (the definition every surface counts by), the 3-state visibility machine, capability tokens, the password gate + unlock cookie, the door (its steps, the `require_verified_email` switch with its name-only door, Require an upload to view), silent join, the confirm doors and the return after one, the auth-aware header island, the live gallery (the one live source, doorbell + conditional poll), the live reel's guest half (the Highlight reel tile, the view that is also the wall, the approval toast, the creator's seam), the link card, demo mode. · NOT HERE: the upload pipeline + R2 + lightbox mechanics (→ [uploads-and-r2.md](uploads-and-r2.md)), the dashboard's Guest cards and the host's counts (→ [host-app.md](host-app.md)), host-side event config + reel curation/Studio (→ [host-app.md](host-app.md)), why a rule was chosen and what shipped when (→ git).
> GROWS BY: integrate-in-place.

## What it does

`/e/[token]` ([`page.tsx`](../../src/app/(guest)/e/[token]/page.tsx)) is the scanned-QR landing page: ONE
unified event page ([`event-experience.tsx`](../../src/components/guest/event-experience.tsx)) whose state
the host's configs drive. The opaque `qr_token` IS the authorization, and there is ONE link per event.
`get_event_by_qr_token` resolves `qr_token` OR `custom_slug` (token wins) and returns the canonical
`qr_token`, which the page threads to every downstream qr-keyed RPC.

★ **THE GUEST'S WORD IS "ALBUM", THE CODE'S WORD IS "GALLERY", AND THAT SPLIT IS DELIBERATE.** Every string
a guest reads says album, the site's one noun, so a guest who becomes a host never meets two words. The
CODE noun stays: `/api/guests/gallery`, `gallery-access*`, `getGalleryStats`, `LiveGallery`,
`GalleryPayload`, the RPCs and the columns keep their names, since renaming a live route buys a guest
nothing and risks the one flow with no account behind it. Do not "fix" the mismatch in either direction:
new guest copy says album, new code says whatever the neighbouring code says.

## Flow (top to bottom, contiguous)

The **left-editorial** layout ([`event-experience.tsx`](../../src/components/guest/event-experience.tsx) is
the shell): `font-heading` event name → byline ("Hosted by" name+avatar · date) → the **stats line** ("N
photos & videos from M guests") → the description → the **action block**: a full-width primary **Add
photos** over a full-width **`[Invite]`** row. Every Add opens the ADD SHEET (`GuestUpload`'s `openAdd`,
below). `GuestShare` is the Invite trigger + sheet (QR + Copy + native Share + Download).

★ **THE ROW ON LANDING, A DOCK ONCE IT LEAVES.** [`guest-action-dock.tsx`](../../src/components/guest/guest-action-dock.tsx)
takes the row's place at the foot once the row's `IntersectionObserver` sentinel
([`use-in-view-sentinel.ts`](../../src/lib/shared/use-in-view-sentinel.ts)) leaves the viewport, carrying
BOTH actions over a gradient scrim inside the safe area. It is `inert`, not unmounted, while the row is on
screen (so it travels in and out), and the page root reserves its height while it is MOUNTED, never only
while visible, or the page would grow under a thumb. It carries exactly what the row carries and never
replaces the row as a guest's first sight of Add: a dock alone sits where the eye reaches last.
[`floating-add-button.tsx`](../../src/components/shared/floating-add-button.tsx) is residue only the
Library's demo mounts.

★ **THERE IS NO SAVE, ANYWHERE.** Uploading to an event is what keeps it (the definition under "Invariants"), so
nothing in this row, or on any other guest surface, saves an event. Keeping what a guest added is a one-tap offer
AFTER their first photograph lands ([`guest-upload.tsx`](../../src/components/guest/guest-upload.tsx) →
`ClaimHandlePrompt` → `SaveAccountPrompt`), never a button above an album a stranger has not seen yet.

★ **THE OFFER IS THE CAPTURE FLOW** (confirm an email and the uploads, with the event they went into, stay in the
account; then follow the host; the copy says "in your account", never "on your profile", since a profile publishes
nothing until its owner chooses). `ClaimHandlePrompt` owns the post-upload slot, ONE card at a time, never in the
demo, once a guest has contributed this visit or a confirmation from this album has just claimed their uploads:
signed out → the offer card, counting what just landed; **just confirmed** →
[`follow-moment-card.tsx`](../../src/components/guest/follow-moment-card.tsx) (what they now hold, the host
to follow, "Claim a handle and your name becomes a page." with a Claim button as its second line; a nameless profile
takes the name typed here; with nothing uploaded this visit it speaks of the photos without a number); signed in
without a handle → the handle card; with one → nothing. The offer card's door carries the product's one newsletter
opt-in ("Send me occasional Partyreel updates"), written through `/api/guests/capture-email` on an in-page
confirmation only.

★ **THREE CONFIRM DOORS, ONE OBJECT, AND THEY CLAIM ONLY.** The offer card, the Unverified mark on a guest's own
credit and the header name menu (its Confirm your email and its Sign in) all open
[`confirm-email-dialog.tsx`](../../src/components/auth/confirm-email-dialog.tsx): the account door in its `keep`
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
live upload, so the result says HERE and ELSEWHERE apart. The follow moment plays when the marker was there AND the
claim moved this album's own uploads, with no upload needed this visit (a full-reload return included); the first
claim that actually runs spends the marker either way. "We added your uploads to your account." plays on the album
only when the claim reached other events too; the (app) layout's own mount says it whenever uploads moved.

★ The follow moment
offers the HOST alone: the other guests already carry their own Follow on each handled chip
([`guest-list.tsx`](../../src/components/social/guest-list.tsx)), and a second copy would be one list twice
on one screen. Its card is `getHostCard(eventId)` from the page RSC; no card means no host row, never a
stub.

★ **THE GUEST'S OVERLAYS WEAR THE ONE RESPONSIVE SHEET**: `SheetContent responsive`
([`ui/sheet.tsx`](../../src/components/ui/sheet.tsx)), a side panel at a desk and a bottom sheet in a hand:
Invite ([`guest-share.tsx`](../../src/components/guest/guest-share.tsx)), Report
([`report-dialog.tsx`](../../src/components/guest/report-dialog.tsx)), the add and failure sheets, and the
DOOR from 640 up (its phone half stays vaul-backed). "Download all" (`ExportDialog`, shared with host surfaces), the
confirm door (`ConfirmEmailDialog`) and the header menu's Add your email
([`add-email-dialog.tsx`](../../src/components/guest/add-email-dialog.tsx)) are still centred Dialogs. ⚠ Report
and Add your email hold the guest's only overlay FIELDS outside the door, unproven with a focused input on a real
iPhone: if the keyboard covers the textarea, the fix is the Sheet's
phone half becoming vaul-backed for every consumer, never a per-dialog exception.

- **Stats**: `getGalleryStats(event)` ([`guest-events-admin.ts`](../../src/lib/db/queries/guest-events-admin.ts))
  → `{approvedTotal, guestCount}`: a head count of approved media (`countApprovedMedia`, request-scoped, so the
  stats and the gallery payload share one answer), and THE ONE COUNT of guests (`getEventGuests`, the same
  function the host's hub reads, so the album and the hub never say two numbers for one party; never the host).
  ★ **NUMBERS ONLY ever leave the server** (never a guest_id/identity). N goes live via `GalleryLiveProvider`'s
  `onCountChange` (the head count every gallery payload carries, "One true count" below); M is seeded by the page
  RSC and kept current by the gallery poll, which carries `guestCount` on a 200 only (read after its 304 check, so
  the steady poll pays nothing, and never on a locked page) and hands it up through `onGuestCountChange`: a guest's
  own first upload moves M without a reload, and only the server can tell a first upload from a returning
  contributor's. It stays outside the ETag: whatever moves M changes the payload the ETag already hashes.
  ★ The album carries the same N again as its own quiet label, left of "Download all" and the View menu
  (the Highlight reel tile shows no count), worded like the stats line and the teaser CTA, so the page never
  counts one album two ways.
- **Masonry gallery** ([`guest-masonry.tsx`](../../src/components/guest/guest-masonry.tsx)): the SHARED
  column rule `GALLERY_COLUMNS` ([`shared/masonry.tsx`](../../src/components/shared/masonry.tsx)), read and
  never re-typed: a column WIDTH, never a count, so a wider window means MORE photographs, not bigger ones.
  Two columns below 640 (`PHONE_MAX`), then as many as fit at `--album-column` (the album's tile size, see
  "Live gallery"; 220px where no ancestor sets it; the skeleton lays out on the album's own tile size, `GallerySkeleton`'s
  `tileSize`). `--gap-gallery` is pinned to `--radius-tile` (4px, 3px floor), the vertical gap being each tile's bottom
  margin. ★ The JS column count reads the box's RESOLVED `column-gap`, never the `--gap-gallery` token: a custom property
  computes to its `max()` text, which parses as no gap and lays one column too many. Tiles keep their
  NATURAL aspect ratio (the plumbed `width`/`height`, 1:1 without dims; dims ride OUTSIDE the ETag hash,
  write-once per id). A 45ms entrance stagger (capped at 540ms) plays on the SEED render only (`--tile-i`;
  arrivals get 0). Videos wear a small CORNER play badge (`MediaTile`'s `playBadge="none"`; the centred
  `PlayBadge` is for other surfaces).
  ★ **The page root is two boxes, not a column**:
  [`event-experience.tsx`](../../src/components/guest/event-experience.tsx) carries `COLUMN` (632px of
  reading measure pinned LEFT, on the header logo's 20px line) and `BLEED` (the gutter alone: 12px under 640,
  where a phone's two columns want every pixel, 20px above), and the
  ALBUM ALONE takes the second; everything the page says (action block, upload panel, Highlight reel tile,
  guest list, locked river, empty state) keeps the column, the empty state because its square river would otherwise
  draw a window-wide box of nothing. The streaming skeleton
  ([`gallery-skeleton.tsx`](../../src/components/guest/gallery-skeleton.tsx)) reads the same rule and adds
  12 tiles from 640 up, so a wide album never loads as one thin row.
- **The upload act.** The queue ([`use-upload-queue.ts`](../../src/lib/guest/use-upload-queue.ts): one at a
  time, JIT silent join, demo sim, retry) is created ONCE in `event-experience.tsx` and shared by the
  album's Add and the door's upload step, so a run started at the door outlives it. `GuestUpload`
  ([`guest-upload.tsx`](../../src/components/guest/guest-upload.tsx)) reads its snapshot and owns the album's
  two sheets and the post-upload slot behind a `{openAdd, retry}` handle; it draws no tile. Three surfaces
  and one session rule:
  - ★ **THE ADD SHEET**: every Add opens
    [`upload/intent-sheet.tsx`](../../src/components/guest/upload/intent-sheet.tsx) on the responsive Sheet,
    *Take a photo* over *Choose from your album*, then the terms line
    ([`upload-terms.ts`](../../src/components/guest/upload/upload-terms.ts): kinds and the universal ceiling
    from `media/limits.ts`, since the guest page never receives the host's own cap; nothing about rights,
    ever). TWO hidden inputs INSIDE `SheetContent`, because `capture` cannot be both: the camera row
    (`accept="image/*" capture="environment"`) takes ONE photograph (iOS ignores `multiple` under `capture`;
    Android adds a Camera/Camcorder chooser once video is accepted); the album row is
    `accept="image/*,video/*" multiple`. ★ **Each is `.click()`ed SYNCHRONOUSLY from its row's tap**: one
    `await` in between and Safari silently drops the picker.
  - ★ **THE REVIEW STEP** catches an accidental selection: the picker returns INTO the same sheet
    ([`upload/review-step.tsx`](../../src/components/guest/upload/review-step.tsx)) as tiles with a one-tap
    remove and a `Send N` primary; only then does `addFiles(kept)` run. A file the browser cannot draw (an
    iPhone `.mov`, a HEIC outside Safari) is a NAMED stand-in with its size
    ([`upload/pick-preview.tsx`](../../src/components/guest/upload/pick-preview.tsx); `onError` is the only
    honest test). ★ ONE owner mints and revokes the object URLs in one effect
    ([`use-pick-urls.ts`](../../src/components/guest/upload/use-pick-urls.ts)): mint-in-render plus
    revoke-in-cleanup paints a revoked URL on StrictMode's remount and every preview falls to the stand-in.
  - ★ **THE FAILURE SHEET**: nothing interrupts while files go; when the RUN ENDS (nothing queued or
    uploading) with anything refused,
    [`upload/failure-sheet.tsx`](../../src/components/guest/upload/failure-sheet.tsx) opens once, a line per
    file (name, the SERVER's sentence, Retry) over one `Retry all`. A refused file draws no tile and nothing
    toasts, except the JOIN's own failure (nothing was queued). ★ **A dismissed failure LEAVES THE QUEUE,
    not just the screen**: "Not now" and every close call `useUploadQueue`'s `dismiss(ids)` for the listed
    ids, so a dismissed failure never resurrects on a later run's end; `dismiss` re-checks each id's LIVE
    status, so it never eats ids `Retry all` just re-queued in the same close. While the door's upload step
    shows, it owns the run's failures (`suppressFailures`).
  - ★ **THE FLIP, MID-RUN.** A host can turn Require verified emails ON mid-run; the routes then answer 403
    `verification_required`, carried up as `UploadOutcome.code` (one of the TWO codes the queue reads by name,
    both the session's). It spends the SESSION, not one file: a CONFIRMED viewer re-joins silently ONCE (their
    uid mints a verified row and the run continues on it: the queue reads its ticket per FILE, never once per
    run); a name-only guest cannot, so the session is dropped and everything still
    queued fails in place with the SERVER's sentence, opening the failure sheet once. ★ **THE PAGE'S REFRESH
    WAITS FOR THE SHEET TO CLOSE.** `useUploadQueue`'s `onVerificationRequired(message, hadQueuedFiles)`
    tells `EventExperience` whether a sheet is about to stand in the way: `hadQueuedFiles=true` holds the
    refresh until `GuestUpload`'s failure sheet closes (`onFailuresClosed`), because an immediate
    `router.refresh()` flips `access` to `teaser` and remounts the gallery-and-upload slot (`key={access}`)
    out from under it; `hadQueuedFiles=false` (`joinSilently`'s own refusal) and a run from the door's step
    (outside `key={access}`) refresh at once.
  - ★ **SOMEBODY ELSE'S TICKET** (`session_other_account`, the Invariants' owner rule). The file is NOT failed:
    the queue puts the ticket down (`dropGuestTicket`: the token, its name and address flag, the name prefill
    when it is that same name, then the cookie, AWAITED so it cannot land after the re-join's fresh one) and
    re-queues it. A CONFIRMED viewer joins silently (once per chain) and the same file goes up on their own row;
    anyone else is handed to the door (`onDoorNeeded`: the page refreshes, so a sign-out in another tab is seen,
    and the name or email step opens) while the files wait `queued`, resuming the moment its join hands a ticket
    down through `sessionToken`. A join nobody at the door could fix fails the waiting files in place, and a
    Retry with no ticket joins first. The name step and the add-email dialog read the code the same way: the
    ticket goes down, then a fresh join (the dialog closes and the door asks).
  ★ **The blob re-key**: an in-flight tile's object URL is keyed by queue id and re-keyed to the media id at
  approved completion (`UploadedItem.queueId`): the SAME URL object, so the `<img src>` never changes and
  the tile turns optimistic with zero flicker.
- **Empty state** ([`gallery-empty-state.tsx`](../../src/components/guest/gallery-empty-state.tsx)): the
  photographic promise, the RIVER (`shared/river`) in a square box the width of the reading column, the
  `public/guest-ghost` WebPs pouring under a centred `font-heading` title and CTA. The fade (85% grayscale,
  40% opacity) is a class on the WRAPPER, never a layer over the photographs, and NOTHING sits at the top of
  the flow (the guest surface belongs to the host's event, so no Partyreel demo code sits in a host's own
  album). At 0 items the header and dock drop
  their Add; the CTA owns it. ★ **That wrapper is `GhostRiver`, exported from this file and the ONE home of
  the depth**: the locked page draws the same picture, and two copies of a fade drift apart.
- **Lightbox** (the SHARED [`media-lightbox.tsx`](../../src/components/shared/media-lightbox.tsx), its parts in
  `media-lightbox-parts/`): the photograph GROWS out of the tile it was tapped on (`origin`: the tile's rect and a
  `returnTo` that finds the tile of whichever photograph shows at close; the live reel passes its frame's rect and a
  clip's `startAt`) and drops back into it; a face-led CREDIT top left (the face or plain disc, the name, the mark,
  "You" on your own upload, the host's proved address, a door to `/u/<slug>` only where the item carries one), the
  close top right, the floating ACTION CAPSULE at the foot (Like / Save / Share / Copy link / Delete, a clip's sound,
  the host's curate group behind a divider) and a clip's TRANSPORT (play, a scrubber, the time) above it. ★ **EVERY
  UPLOAD CARRIES A NAME**: a confirmed guest's profile name stands plain, a typed one wears
  [`unverified-mark.tsx`](../../src/components/shared/unverified-mark.tsx) (MineMark's material, tap to open, one
  extra sentence for the host, and on YOUR OWN credit a "Confirm your email" opening the one confirm door). A row with
  no name renders no credit at all, never an invented stand-in: a row minted before names were asked (`create_guest`
  refuses a new one) and a verified row whose account has no profile name (a deleted account's surviving upload).
  [`anonymous-info.tsx`](../../src/components/shared/anonymous-info.tsx) is residue only the Library gallery mounts. ★
  The mark carries its OWN door rather than a prop, because the credit sits three modules deep under
  `shared/masonry.tsx`; "is this mine" is the existing `canDelete` seam, never a second one. The neighbours PEEK at
  the edges and a tap on one steps to it; a tap on BLANK space closes (no side zones); a pull DOWN at fit closes;
  pinch, pan and double-tap zoom a photograph; a clip plays muted and looping and pauses when the viewer moves on; a
  desk adds hover chevrons and a filmstrip. `media-lightbox.test.tsx` pins the physics, `geometry.test.ts` the
  arithmetic. ★ **THE ADDRESS**: the open photograph rides the page as `?photo=<id>` (`PHOTO_PARAM`, written by
  `shared/masonry.tsx` with replaceState, read once on mount), and it opens only an item already in the viewer's
  payload: an unknown, held or hidden id opens the album plainly, and a door already open comes first. ★ **SHARE SENDS
  THE FILE** (fetched on the tap with `cache: "no-store"`, never prefetched; over 100 MB it falls back), then the
  link, then a copy; Copy link copies the PUBLIC album link (`shareUrl`, the event JOIN url, never a presigned media
  URL or a dashboard URL) with `?photo=` on an approved item; Save offers Save to Photos first on iOS (the system
  sheet with the file is the one web path into Photos) and the plain download elsewhere; a tap whose activation lapses
  leaves a one-tap Ready. The guest album and the host gallery pass `shareUrl`; the personal Uploads and the recovery
  bin omit it.
- Each tile (desktop hover-reveal) + the lightbox carry a **like** button; a signed-out tap
  opens the create-account dialog (a `LikesProvider` wraps the gallery, replaying after sign-in). The hearts are
  seeded through `my_liked_media_ids` with the grid's ids in the POST BODY (never a URL, which a whole album
  outgrows), asking only the ids not yet answered as the grid grows; a failed seed is reported (Sentry, `media`)
  and the hearts simply start unfilled. Like COUNTS are host-only → [host-app.md](host-app.md),
  [database-security.md](database-security.md).
- **PWA (manifest only, no SW)**: [`manifest.ts`](../../src/app/manifest.ts) + the ink-aperture icon set
  make an event link installable to a home screen (standalone, paper/ink theme); static + global, leaks
  nothing event-specific.

## State follows `visibility`: a 3-state enum, NOT a boolean

- **`private`** = the master lock → a locked screen (no name / gallery / upload): the not-found family
  wearing a lock, one link home, under the real `GuestHeader`; `generateMetadata` hides the name.
- **`password`** → access `none`: the **ghosted RIVER backdrop** (`GhostRiver`, the empty album's own
  picture at its own depth: one absence, one picture) + the real "N photos & videos inside" count tease
  (name shown: it's link-shared, not the secret) under the door's password step, until a signed unlock
  cookie is present; then the rest of the door. The river's frames are the local `guest-ghost` pack, never
  this event's media. ★ **The page passes a REDACTED `shellEvent` at access `none`**
  (`host_display_name` + `description` + `event_date` blanked) so they never reach the RSC flight payload:
  a locked page leaks the event NAME + COUNT only, zero media URLs. The date is blanked too, because the
  welcome byline renders it.
- **`open`** → the full experience, UNLESS a gate applies (see "Gallery access"). ★ **The OG description is
  ONE invitation for every open event**: "Photos and videos from the day. Add yours." It never warns about
  the email step; that cost (more taps, and a share of guests bounce at the email step) was taken
  knowingly, and the gate stays honest where it happens, at the door. Do not hedge it back.
- **The link's image** is the event's card, drawn by the route
  [`card/route.tsx`](<../../src/app/(guest)/e/[token]/card/route.tsx>) at `/e/<token>/card` (the name on the
  branded dark surface; a private or unknown event draws the generic card) and named by `generateMetadata`
  from [`event-card.ts`](../../src/lib/guest/event-card.ts). ★ It is a route, not an `opengraph-image`
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
can forget the gate: two callers hand out real bytes, and a defaulted context would let a held guest zip
every original.

ONE server entry, `resolveViewerDecision(event, {isOwner, isAuthed, isUnlocked, userId, sessionToken})`
([`gallery-access.server.ts`](../../src/lib/events/gallery-access.server.ts)), answers the page, the poll,
`/api/export/guest` and `/api/reel/download`. It resolves ONCE assuming a contribution (short-circuiting
the upload clause), and only when that lands on `full` with `require_upload_to_view` on and uploads open
does it call `getUploadGate` ([`guest-gate.ts`](../../src/lib/db/queries/guest-gate.ts), the service-role
`get_upload_gate`) and resolve again, so a locked event and an unconfirmed viewer cost no extra read.
`isAuthed` means a CONFIRMED email (`user.email_confirmed_at`), never a bare `user.id`.

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
stops counting once the guest removes it themselves (`removed_by_uploader`, a disown at the claim ticket included).
So a guest who uploads, looks and deletes has not contributed, and the door is theirs again. The EMPTY album still
holds the gate (no count condition), and the host never meets it. `require_upload_to_view` is OFF by default and
free on every tier.

★ **THE SERVER HAS TO KNOW WHICH GUEST IS ASKING**, which localStorage cannot tell an RSC. The
`pr_guest_<eventId>` cookie ([`session-cookie.ts`](../../src/lib/guest/session-cookie.ts)) carries the raw
64-hex session token: HttpOnly, Secure in production, SameSite=Lax, path `/`, 60 days, shape-guarded on
read, unsigned (the database verifies it against `guests.session_token`'s unique index). It is written only
when absent or different: by `POST /api/guests` (a mint), `POST /api/guests/name` and
`POST /api/guests/email` (success), `POST /api/r2/complete-upload` (a created row, via
`CreateRecordOutcome.setCookies`, applied to the 200 alone) and the gallery poll's heal (a differing body
token), **only as a 200 with no ETag**, because Vercel's edge turns a validator-matching 200 into a 304
and drops `Set-Cookie`. `POST /api/guests/leave` expires it (`{ qr_token }` one event's, `{ all: true }` every
`pr_guest_*` the request carried); ★ **EVERY SIGN-OUT PUTS DOWN EVERY TICKET ON THE DEVICE**, the tokens, names,
address flags and the name prefill with the cookies: the guest page's account menu through
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
live count). A payload without `approvedTotal` (an older server mid-deploy) falls back to the shell's
`stats.approvedTotal` at `teaser`, then the photo-only `teaserTotal`. At `none` no gallery mounts and no poll
runs: the lock line says the render's head count.

## The ARRIVAL (the door: one held sheet, then the album)

The arrival is the PRIMARY first experience (a guest comes off a QR with zero context) and plays as four
acts on the "Calm + 700ms" choreography ([design-system.md](design-system.md)): **the stage** (the name,
the lock line and the river rise via `data-arrive` + `--arrive-i`) → **the invitation** (after the ARRIVAL
BEAT the sheet rises) → **the threshold** (the steps) → **the reveal** (the success beat, then the gallery
rises as the sheet exits).

★ **THE DOOR IS AN ITINERARY, AND IT HAS NO EXIT.** One held sheet carries the welcome, the password when
the event has one, the NAME, the EMAIL (held until confirmed) when the host requires verified emails, and
the first UPLOAD asked, and then the album. The album sits blurred behind it the whole way (the capped
teaser wherever a server gate holds): it is the reward the door's asks pay for, so there is no "just
browsing" way past it. `computeDoor` ([`entry-steps.ts`](../../src/lib/guest/entry-steps.ts), pure and
unit-tested) derives the ordered steps from the server's `{access, gate}` plus this browser's own facts
(welcome seen, a name, a contribution, "returning" snapshotted at hydration), because the server can see
the password and the email and cannot see whether THIS browser typed a name. A server gate is TERMINAL for
the steps behind it: the resolver has no opinion past an unmet password or email, so the itinerary stops
and re-derives on that step's refresh. `autoOpen` is true whenever a step exists.

The cases: the owner `[]` (no sheet); password-only `[welcome?, password]` then `[name?, upload?]`; names
mode `[welcome?, name, upload?]`; verified mode `[welcome?, name, email]` then `[upload?]`; both, in that
order; the demo `[welcome (its role step), upload]`, which asks no name; a returning guest with a name and
(when required) a contribution `[]`; the mid-visit flip `[email]`. ★ **THE NAME STEP CARRIES A SECOND,
OPTIONAL FIELD in names mode**, "Email (optional)": it adds no step, and `computeDoor` does not know it
exists (see "Joining + identity").

One shell ([`entry-shell.tsx`](../../src/components/guest/entry-shell.tsx)) renders a REAL Vaul drawer on
phones (drag physics, `repositionInputs` lifts a focused field above the iOS keyboard,
`dismissible={false}` rubber-bands) and, from 640 up, the ONE product Sheet (`SheetContent responsive`) as
a full-height panel from the right edge. ★ **NO CENTRED FLOAT AT A DESK**: an edge sheet leaves more of the
blurred album in view, and that preview is the incentive the door runs on. The phone half keeps vaul
because the gates TYPE into it and `repositionInputs` is the only thing keeping a focused field off the
keyboard; it takes the Sheet's posture, `max-h-[85svh]`, so the album still shows above the door. The
CURRENT step is always the itinerary's first; SERVER steps advance through the RSC's refresh, CLIENT steps
through flags in the sheet. No step counter to desync.

- **The ARRIVAL BEAT** ([`use-arrival-beat.ts`](../../src/lib/guest/use-arrival-beat.ts): 700ms, a password
  re-visit 350ms, reduced motion 0): only the AUTO-open waits (the page settles first); a re-assert
  (`openToGate`) is instant.
- **welcome = THE INVITATION**: a "You're invited to" eyebrow over the event name as the `font-heading`
  hero, the host byline (avatar + name + date; self-hiding on locked pages via the redacted shellEvent),
  the count as social proof, two warm `text-base` rows, one primary that always reads "Continue"
  (something always follows it), and the legal consent line. Shown on the FIRST visit per device
  (`pr_welcome_<qrToken>` via [`use-welcome-seen.ts`](../../src/lib/guest/use-welcome-seen.ts); server
  snapshot "seen" = no flash). The demo's welcome is its `RoleStep` (see "Demo mode"). Inside the drawer it
  stands `min-height: 55svh` (`[data-entry-drawer] [data-welcome-step]`); the desk panel is full height
  already, so the rule stays drawer-scoped.
- **THE AFFORDANCE TABLE IS ONE ROW**: every step of the door is HELD (no X, no drag handle, Escape and the
  backdrop inert), and so is a closed/exiting shell. The one FREE surface is the album menu's "Change name"
  (`EntryModalHandle.openToName("edit")`), which stands over an album the guest already reached and posts
  nothing when it closes. The teaser's "See all N" re-asserts the sheet (`openToGate`, a no-op mid-hold),
  whose only remaining job is to undo the OFF-state soft skip.
- **The CONTINUOUS step container**
  ([`entry-step-transition.tsx`](../../src/components/guest/entry-step-transition.tsx)): a ResizeObserver
  feeds the content's px height into a 300ms height glide (step swaps AND same-step growth, e.g. the error
  line); steps slide directionally (`[data-entry-step][data-dir]`); the outgoing step leaves an inert
  attribute-stripped clone that fades opposite (`[data-entry-exit]`; `el.isConnected` discriminates real
  deletions from dev StrictMode cycles). The back chevron is a transient VIEW over the machine (never
  touches markSeen/steps): the password, the name and the email go back to the welcome, the upload to the
  name (the demo's to its role step). ★ THE REVISITED WELCOME'S OWN PRIMARY ALWAYS READS "CONTINUE", never
  "Back": back is not bidirectional, and only the CHEVRON's label says "Back to X".
- **The SUCCESS HOLD + REVEAL** ([`use-success-hold.ts`](../../src/lib/guest/use-success-hold.ts), min beat
  900ms) plays ONCE, on the step the album is directly behind; an earlier step's success hands forward with
  no beat. A password unlock blurs the field (the keyboard retracts during the beat, never mid-exit) and
  fires `onUnlocked` + `router.refresh()` together; the gate stays PLANTED and its button morphs `--success`
  green ("You're in" + `data-unlock-success`). The email confirmation's hold shows the centred SuccessStep
  (the code machinery has no single button to morph). Release = beat done AND the refresh landed (`current`
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
  rises on an intentional tap. Gate inputs are h-11/16px (16px also stops the iOS focus auto-zoom). The
  name step's field does carry `autoFocus`, and the email step's code field focuses once a code is sent.

## Invariants (don't break)

- ★ **A PERSON IS A GUEST OF AN EVENT ONLY THROUGH AN UPLOAD OF THEIRS**: a password entered or an account
  confirmed without an upload lists nobody, one photograph makes a guest, and deleting every upload of theirs
  removes them again. A LIVE upload is one whose `media.status` is not `removed` (pending, approved or hidden), whoever removed it. What OTHER
  people see needs an APPROVED one: the guest list, the Guests room, every guest count and a profile's "guest at"
  line, all read through ONE function (`getEventGuests`, [`event-guests.ts`](../../src/lib/events/event-guests.ts):
  a confirmed guest once per person, a named unconfirmed one once per row, never the host, never a nameless row).
  The account's OWN list of the events it added to takes any live one (→ [host-app.md](host-app.md), the Guest
  cards). A `guests` row stays what it is, the device's upload ticket minted at the door: nothing reads a row as
  attendance, and there is no save. A clip added to the album is an upload like any other. A host removing all of a
  guest's uploads takes them off every list; a restore puts them back.
- ★ **THE HOST SEES A CONFIRMED GUEST'S ADDRESS, under the name, in the host's viewer and in the Guests room**, and
  never an unconfirmed one: the viewer's uploader credit (`getUploaderIdentities`, the email line) and the room's
  list and names panel (`GuestList`'s host-only `emails`, read by `getConfirmedGuestAddresses` in
  [`guest-addresses.ts`](../../src/lib/db/queries/guest-addresses.ts), which proves the host itself and reads
  `guests.email` on `verified_at` rows only; the room is its one importer and the album never passes `emails`, both
  pinned). The address IS the safety feature Require verified emails promises: anyone can confirm any inbox, so a
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
  leaked link: the config gates (a password, Require verified emails, Require an upload to view, private,
  uploads closed), the per-request re-checks, and the host's own switches, which shut a leaked link's door
  without moving it. The link itself never rotates: the `qr_token` is printed on every QR, so it is
  permanent by design (a custom slug is a mutable alias to it, never a replacement).
- **The anon media RPCs gate on `visibility = 'open'`, NOT `<> 'private'`.** A password event's media must
  NEVER stream through `get_event_media_by_qr_token` / the anon path; it is served ONLY via the server
  admin-read (`getApprovedMediaForUnlock`, self-guarded by the unlock cookie) after `/api/guests/unlock`
  verifies the password. The bcrypt hash never leaves the DB (RPCs expose `has_password` only).
- **The unlock cookie is a signed HMAC of `{eid,exp}`** (`UNLOCK_COOKIE_SECRET`, 12 h) — the cookie *name*
  isn't the boundary, the **signed eid** is. It fails CLOSED when the secret is unset. Password is
  set/cleared ONLY by `set_event_password` / `clear_event_password` (host-auth SECURITY DEFINER; the column
  is revoked from the host UPDATE grant), and those two own the STATE as well as the hash:
  `set_event_password` is the only path INTO `visibility='password'` (it flips hash and state atomically,
  which is what keeps the `events_password_requires_hash` CHECK satisfiable), and `clear_event_password`
  reverts to `open` only FROM `password`, never turning a `private` event public.
- **The page calls `getUser()` for every non-private, non-demo event**, because the gates must know whether
  the viewer holds a confirmed session. With NO session it's a cheap LOCAL null (no network), so an
  anonymous crowd behind one venue-NAT IP doesn't each pay an auth round-trip; the owner check
  (`isEventOwner`, an explicit `host_id = uid` match) runs ONLY when
  signed in. The header island resolves its own auth with a LOCAL `getSession()`.
- **The upload slot is `full`-only** (a `teaser`/`none` viewer is still at the door, which owns every step
  in front of them). At `full`, the upload panel while `accepting_uploads`, else the view-only line. A
  confirmed account with no profile name is asked at the door (`needsName` → the name step's `profile`
  mode), never in the album. At `teaser` the slot is the gallery + the "See all N photos & videos" button,
  which re-asserts the door; at `none`, the locked river (name and count only).
- **A guest's OWN-photograph removal is never a client claim, and never a client list.** The two RPCs decide
  ownership inside themselves (`auth.uid()`, or the session token matched against the media's own guest row,
  which must belong to the media's own event, on an event that is not deleted) and the "mine" list that decides whether the control APPEARS is a server read on both paths. Three things
  that must stay true: `anon` never gets EXECUTE on `remove_my_upload_by_session` (service-role only, reached
  through `/api/guests/remove` behind the join limiter); a session token never travels in a URL; and a guest
  row with `user_id` set is untouchable by the session path, so a shared phone's stale token can never delete
  a signed-in person's photograph. ★ **A withdrawal is final for the host** (`removed_by_uploader`: a guest who
  takes a photograph back wants it gone everywhere, the host's view included): no host surface shows or
  restores it (the album and its viewer, Review, Deleted and `restore_media`, the home's pulse and the events
  list's counts and covers, the exports, the reel's timeline), `host_storage_summary`'s Deleted figure counts
  it in neither number, and the confirm says so with no window ("It's deleted from the event right away and
  can't be recovered."), because a number of days reads as a hold the host can still reach.
  [`media.test.ts`](../../src/lib/db/queries/media.test.ts) pins the host reads against a withdrawn row.
- ★ **UPLOADS ARE HELD TO THE SAME OWNER: a guest row with `user_id` set writes only for that signed-in
  account.** Presign AND complete (a presign outlives a sign-out), rename and attach-address ask
  `checkSessionOwner` ([`session-owner.server.ts`](../../src/lib/guest/session-owner.server.ts): the row's
  `user_id`, service-role and never returned, against `getUser()`, which only a claimed row pays) and refuse
  anyone else with 403 `session_other_account`, under the lock and closed uploads and ABOVE the identity gate (a
  confirmed row's own `verified_at` is what let a stale ticket upload past Require verified emails). A confirmed
  row whose account was deleted (`user_id` nulled by the FK, `verified_at` kept) writes for nobody. A name-only
  row stays the device's ticket. The client's side is "The upload act".

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
   dashboard's claim ticket; what it leaves unclaimed is removed (→ [host-app.md](host-app.md)).
3. **A confirmed account**, the only identity that uploads as itself.

One gap is accepted. On a names-mode event anyone can type any name and any unproven address. An unconfirmed
address is inert (never shown to the host, never attributed, never mailed), so a false one borrows nobody's
identity; a host facing a risky crowd turns on a password, Require verified emails or moderation, and an
address's owner disowns what was not theirs at Finish.

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
the ONLY mode with the address field: rename a held row first, else mint under the typed name), `edit`
(the album menu's, the one dismissible door), `hold` (verified mode BEFORE the confirmation: the join would
answer 422, so nothing is sent; the name is validated locally, kept in the sheet's state and written only
to `pr_guest_name_last`, never the per-event key, which would claim a row that does not exist; no address
field, since the next step asks for one and PROVES it) and `profile` (a confirmed account with no profile
name writes the PROFILE's; the album has no inline name panel, and the shared `SetNameStep` serves the host's
`/welcome` and the Library's demo). No unique name is claimed at the door.

★ **THE CONFIRMATION'S FOUR WRITES, IN ORDER, ARE THE MODAL'S.** `EnterEventPrompt.onVerified` is a plain
callback and `entry-modal.tsx` owns the sequence, because the door holds a name never sent anywhere and the
order decides whether a guest lands named or with no name at all: claim this browser's anonymous uploads →
`joinEvent` (verified and NAMELESS, since `create_guest` nulls a typed name beside a confirmed account) →
one own-row read of `profiles.display_name` → when null and a name was typed, `updateDisplayNameAction` →
hold the beat → refresh. **The account's own name wins** over a typed one, and the email step says so above
the field before they confirm.

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
- **The localStorage `session_token` is the dedupe, and `guests` deliberately has NO unique
  `(event_id, user_id)`.** One person may join the same event more than once (a second device, a cleared
  browser), and an account is optional, so a uniqueness constraint there would break multi-join rather
  than tidy anything.
- **Supabase anonymous sign-ins stay OFF.** Capability tokens already give a guest immediate, scoped use,
  so a per-scan `auth.users` row would be pure DB bloat, and an anonymous session carries no email to
  satisfy the gate. The account layer AUGMENTS the guest flow and never replaces it: the contribution
  pipeline runs identically whichever identity the uploader carries.
- **`require_verified_email = true` gates the VIEW as well as the upload**, free on every tier (see
  [host-app.md](host-app.md)); turning it OFF is the opt-in, behind a consequence-confirm, not a paid
  feature. The door's email step is `<EnterEventPrompt>` over the shared
  [`<AccountDoor>`](../../src/components/auth/account-door.tsx) in its `gate` wear: the emailed code through
  [`<EmailSignIn>`](../../src/components/auth/email-sign-in.tsx) first (one tap = create account OR log
  in), Google beside it and a quiet password link, with the teaser behind. `create_guest` derives identity
  (`user_id`, `email`, `verified_at`) from the trusted uid, NEVER the client.
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
  (`user_id IS NULL` ⇒ never steals an owned row; ≤1000 bound). An UNCONFIRMED caller stamps `user_id`
  alone; a CONFIRMED caller's claim is proved (the device plus the address), so it also stamps
  `verified_at`, copies the account's email into `guests.email`, clears `pending_email` and the typed name,
  and names a nameless profile from the newest claimed row. ★ The number it returns is the claimed rows that
  carry a LIVE upload (an empty row is stamped but not counted: claiming it carries nothing). It fires from the
  `(app)` layout's mount (a loud "We added your uploads to your account." whenever uploads moved), the album's
  `useConfirmReturn` (split this album / the rest, which decides the follow moment and the toast; see "THE
  RETURN" above) and the in-page sign-in handlers; module-level guards dedupe, and the `IS NULL` makes a
  reload's re-run a silent 0-op (no sessionStorage flag).

## Live gallery: the hybrid doorbell

- **Architecture: ONE live source for the album AND the reel.**
  [`gallery-live.tsx`](../../src/components/guest/gallery-live.tsx)'s `GalleryLiveProvider` owns all
  gallery state (the refreshed list, the arrival ids, this device's own ids and optimistic tiles, `refresh`,
  the doorbell, the poll, the ETag, the stricter-drift guard, the live reel's facts) and hands it down
  through `useGalleryLive()`. [`live-gallery.tsx`](../../src/components/guest/live-gallery.tsx) is the
  album's VIEW over it (mounted with no provider above it, it brings its own), and the reel
  ([`reel/live-reel.tsx`](../../src/components/guest/reel/live-reel.tsx)) reads the same context, never the
  seed promise, so an upload that reaches the grid reaches the reel in the same breath.
  [`event-experience.tsx`](../../src/components/guest/event-experience.tsx) is the SHELL around both and
  streams the provider in via `<Suspense>` (the RSC passes `loadGalleryForAccess` down UN-awaited; `use()`
  resolves it behind [`gallery-skeleton.tsx`](../../src/components/guest/gallery-skeleton.tsx) so the
  presign-heavy payload never blocks the shell's paint). `key={access}` remounts it on an access flip
  (teaser → full) — a clean re-seed, no resync effects.
- ★ **A presigned URL is read by id from the latest payload at the moment it is needed, never held**, and
  the provider's watchdog (`reportPossibleExpiry`) treats any image or reader failure as a possible expired
  presign (a tab asleep past the 90-minute expiry answers a CORS-shaped failure with no status): it drops
  the validator and forces ONE full refetch, at most once a minute, never in the demo.
- **The doorbell:** the `media_gallery_doorbell` DB trigger sends a contentless `ping` on the PUBLIC
  Realtime broadcast channel `gallery:<qr_token>` whenever the approved-visible set changes (uploads,
  moderation flips, restores, purges — pending/hidden-internal transitions stay silent). The token IS the
  channel capability; the ping carries no data, the refetch is access-gated server-side.
  Client: [`use-gallery-doorbell.ts`](../../src/lib/guest/use-gallery-doorbell.ts) + a leading-edge
  coalescer ([`refresh-coalescer.ts`](../../src/lib/guest/refresh-coalescer.ts): immediate refetch, ~2 s
  suppression + jitter, one trailing flush for bursts).
- **The conditional poll** (the shared [`use-live-poll.ts`](../../src/lib/shared/use-live-poll.ts)): the
  fallback cadence keys solely off the channel state — **60 s** while `SUBSCRIBED` (a safety net), **12 s**
  when the socket is down; it stops when the tab goes hidden and polls again when it is shown. Every poll sends
  `If-None-Match`; the route answers an unchanged gallery with a **bare 304** (zero payload, zero presigns, but
  the reads that build the fingerprint still run: the whole album, its identity sweep and its head count); see
  the ETag invariant below.
- ★ **The gallery ETag must never validate across access levels, nor across the gate behind one** — the
  fingerprint ([`gallery-fingerprint.ts`](../../src/lib/events/gallery-fingerprint.ts)) hashes `access` +
  `gate` + `teaserTotal` + `approvedTotal` (the album's head count, the header's live number) + the item
  ids/attribution (the verified mark included) + the presign bucket id + the live reel's facts (`reel`, so a
  host's switch reaches an open page), and the not-found/private early return carries NO ETag. A teaser
  validator replayed with full-access cookies must 200, and a guest whose gate moved from `account` to
  `upload` never 304s onto the step they passed. The bucket id rolls the ETag every 30 min so clients re-pull
  fresh URLs before old ones expire. An item's `reelEligible` rides OUTSIDE the hash like its dims: it is
  write-once at `create_media*`.
- **Reconcile by id — do NOT `setState` the raw poll result:** `reconcileGalleryItems`
  ([`reconcile-gallery-items.ts`](../../src/lib/guest/reconcile-gallery-items.ts)) keeps an already-rendered
  object whenever the incoming row is field-for-field equal (so the ordinary poll touches no `<img>`) and
  adopts the incoming one whenever anything differs. Presigns are stable inside a 30-min bucket, so a URL
  changes only when the bucket rolls, and adopting it then keeps a gallery left open all evening from
  answering 403 at the 90-min URL expiry.
- **Optimistic tiles only for LIVE-approved media:** a completed upload prepends a local `createObjectURL`
  tile (deduped by media id against the next refetch in [`merge-gallery-items.ts`](../../src/lib/guest/merge-gallery-items.ts),
  then the blob is revoked) — but ONLY when `create_media` returned `approved`. Completions reach
  the provider through a `LiveGalleryHandle` callback ref (with a pre-mount buffer, since the gallery streams
  in async).
- **What THIS DEVICE draws at the album's head**, in the grid's `prefix` slot
  ([`guest-masonry.tsx`](../../src/components/guest/guest-masonry.tsx)), and nowhere else:
  - ★ **ONE stack for a pick in flight**:
    [`upload/stack-tile.tsx`](../../src/components/guest/upload/stack-tile.tsx) draws the file actually in
    the air (the queue runs one at a time) with two ghost edges behind it and, at its foot, everything the
    tile SAYS — "N to go" and the progress bar on one pane. A single file is a stack of one and says no
    count.
  - ★ **A WAITING tile per held file**: a completed upload on a `hold_for_approval` event sits dimmed under
    a clock mark with "Waiting for the host" until the poll shows it approved (its `mediaId` rides on the
    queue item for exactly that comparison) or the session ends, because drawing nothing reads as a
    failure. Only this device ever sees it; nothing here asserts anything to the server.
  - ★ **Nothing at all for a file that did not go** (the failure sheet owns it), and nothing for one already
    in the album.
  ★ Both tiles wear the album tile's `data-lit` bright edge, bound by
  [`lit-edge-contract.test.ts`](../../src/components/shared/lit-edge-contract.test.ts)'s closed list, so a
  photograph never gains or loses an edge at the moment it finishes uploading. Their pane is the ONE glass
  material at the marks' blur with `--glass-tint` re-pointed to 0.34, MEASURED for white over a pure-white
  photograph at 4.78:1 (the floor is 4.5:1).
- **The ARRIVAL, one grammar for a guest and a host alike.** TWO marks, differing only in whose photograph
  it is: `data-arrived`, the glow of a photograph that appeared by ITSELF, and `data-landed`, the one pass
  of light a guest's OWN landing takes. The ONE grid ([`shared/masonry.tsx`](../../src/components/shared/masonry.tsx))
  writes both from two sets the surface hands down, [`shared/arrival.css`](../../src/components/shared/arrival.css)
  draws both, and both read their life from [`lib/shared/arrival.ts`](../../src/lib/shared/arrival.ts),
  written onto the album box as `--arrival-glow-ms` / `--arrival-sweep-ms` so attribute and keyframe never
  disagree. `newArrivalIds(prev, next)` ([`reconcile-gallery-items.ts`](../../src/lib/guest/reconcile-gallery-items.ts))
  reports the ids NOT on screen a moment ago (the only definition that catches every route in: a doorbell
  arrival, a held item approved an hour later, a burst after a hidden tab wakes), and `arrivalMarks()`
  (pure, contract-tested) takes one's OWN landings out of the glow and gives the NEWEST the sweep. ★ The
  glow holds PER ID (two guests a beat apart each get a full life); the sweep is EXCLUSIVE, so a fast batch
  never stacks light up the gallery. ★ Three things never glow: the SEED render (`prev` empty; the entrance
  stagger is that moment's motion), a rolled presign, and this guest's OWN upload (it sweeps). The GROWTH is
  the `[data-media-tile]` entrance in `globals.css`, deliberately not re-declared, and the grid's explicit
  columns (oldest first into the shortest column) keep an arrival local: every tile on screen keeps its
  column. Reduced motion: a plain appearance, no mark.
- **A guest's own photographs, removable ever** (final for the host too): two identities, one control.
  SIGNED IN → `removeMyUploadGuestAction` ([`actions.ts`](<../../src/app/(guest)/e/[token]/actions.ts>)) on
  `remove_my_upload` (`auth.uid()`, any device, for ever); ANONYMOUS → `POST /api/guests/remove` → the
  service-role-only `remove_my_upload_by_session` (the Invariants above). ★ **"Mine" is ALWAYS a server read,
  never a client claim**: the signed-in list is one indexed read in the page RSC (`listAccountMediaIds`),
  the anonymous list is `POST /api/guests/mine` (`listSessionMediaIds`, the token in the BODY, fetched once
  per mount); both live in [`mutations/guest-media.ts`](../../src/lib/db/mutations/guest-media.ts). It is
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
  the lightbox gives it the host's words (Deleted, and the window). The post-upload card counts this visit's
  uploads still in the album (the page keeps the removed ids) and leaves once none is left. ★ **On a
  Require-an-upload-to-view album with uploads open, removing your LAST live upload closes the album again** (Own
  deletes close it), unless the album is FULL (the gate fails open there, so the page reads `albumFull`, a second
  identity-less gate read for a guest who has contributed, and the line stays silent), and the confirm says so
  first: `LiveGallery` hands the lightbox the line through the `DeleteConsequence` context
  ([`delete-consequence.ts`](../../src/lib/guest/delete-consequence.ts); the lightbox sits under a grid other
  surfaces own, so a prop cannot reach it), counting the guest's own ids plus any held file still waiting. When
  that removal lands, the page refreshes onto the server's answer at once rather than holding the album until the
  guest's next act (the stricter-drift rule is for a host's switch, not the guest's own choice).
- **And WHICH tiles are a guest's own:** the same server-read set reaches the grid again as `mineIds`; the
  ONE grid ([`shared/masonry.tsx`](../../src/components/shared/masonry.tsx)) writes `data-mine` and gives
  each a FOURTH mark in the marks' material (`GLASS_MARK` + the `glass-mark-lit` halo) in the TOP-LEFT
  corner, the only one free at every width (play and like own the bottom corners, the desk's hover row the
  top right). A tap toggles the **Yours filter** ([`yours-filter.ts`](../../src/components/guest/yours-filter.ts),
  pure): the album narrows under a "Showing yours · Show all" line, the count line keeps saying how big the
  WHOLE album is, and the filter cannot stay live once the guest owns nothing, so removing your last
  photograph never strands you in an empty view. The line is the filter's receipt and its only exit
  besides a mark; Yours also sits in the ONE View menu ([`view-menu.tsx`](../../src/components/shared/view-menu.tsx),
  the host gallery's own object) beside "Download all" in [`live-gallery.tsx`](../../src/components/guest/live-gallery.tsx):
  a Showing group (Everyone's / Yours (n)) only while the guest owns something, and a Tile size group
  (Small / Medium / Large, 180 / 240 / 300 px) disabled below 640 with the hint "Wider screens"
  (`masonry.tsx`'s `PHONE_MAX` forces two columns there regardless of `--album-column`). ★ **THE SIZE ITSELF
  IS SERVER-RESOLVED, NEVER A CLIENT-ONLY READ**: the page reads the shared `pr_tile_size` cookie the host
  dashboard does ([`tile-size-cookie.ts`](../../src/lib/shared/tile-size-cookie.ts)'s `resolveTileSize`)
  and threads it as `initialTileSize` through `EventExperience` to `LiveGallery`, so the first paint is the
  size a returning guest picked; the write rides `setTileSizeAction`
  ([`actions.ts`](<../../src/app/(guest)/e/[token]/actions.ts>)), the host action's mirror. The marks are
  omitted wherever Remove is (the demo, a locked gallery).

## Auth-aware header island

[`guest-header.tsx`](../../src/components/guest/guest-header.tsx): logged-out → a quiet "Start for free"
CTA (the SSR default → zero flash for the anonymous majority); logged-in → the visitor's account menu
([`guest-account-menu.tsx`](../../src/components/guest/guest-account-menu.tsx)), fetched via
`GET /api/me/menu?event=<id>` ONLY when a session exists (the avatar is the viewer's public Storage URL;
event-ownership is an RLS-scoped select → the owner-only "Manage event" deep link). The menu's **Sign out**
puts EVERY guest ticket on the device down, not only this album's (`leaveAllGuestSessions`: the localStorage
tokens, names and flags through the module-singleton `emit()`s in
[`use-stored-session.ts`](../../src/lib/guest/use-stored-session.ts), every `pr_guest_*` cookie through
`POST /api/guests/leave` `{ all: true }`, on `/u/[slug]` too), signs out, then `router.refresh()`s — so the
visitor STAYS on the event page, a verified-email event re-gates to the door's email step
(`<EnterEventPrompt>`), and the next person on a shared device inherits nothing.

★ **A THIRD STATE, for the commonest person at a name-only party**: signed out WITH a stored name, the
header wears [`guest-name-menu.tsx`](../../src/components/guest/guest-name-menu.tsx) instead of the
stranger's CTA — the name, its label (read from the mark, so the two cannot drift), then the email row,
Change name, and Sign in (the `signin` wear). ★ **AND IT IS THE ONE SURFACE THAT KNOWS ABOUT AN UNCONFIRMED
ADDRESS**: it reads the device flag `pr_guest_email_attached_<qr>` (never an address; none is stored) and
draws two states. Name only → "Unverified" under the name and **Add your email**
([`add-email-dialog.tsx`](../../src/components/guest/add-email-dialog.tsx): one field, the door's own
promise line, Save over `attachGuestEmail`, and "Confirm it now instead" handing to the code door). Address
attached → "Email not confirmed" and **Confirm your email** (the one confirm door, its field EMPTY because
nothing kept the address, and its description saying so: "Enter the email you added and we will send a
code."). No row removes the address. An ACCOUNT always wins the slot: a signed-in visitor's menu is the
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
The demo takes the SAME welcome step a public event does, and `entry-modal.tsx` reads its own `isDemo` prop
to swap that step's content for `RoleStep` (a role, not an invitation: whose party this is, that the
visitor stands exactly where a guest stands, the one thing to try; Continue, with a ghost "Start your
own"). Its itinerary is `[welcome, upload]` with no name, and the upload step's skip reads "Look around".
`guest-header.tsx`'s `isDemo` prop pins the header to the top of the screen with a Demo mark beside the
wordmark, so the admission survives every scroll. A completed (simulated) upload surfaces `TurnCard`
(`guest-upload.tsx`) directly above the album's first tile (the photograph just added, since the album is
newest-first); the action row puts "Start your own" beside Invite, and a closing card repeats the offer
below the whole album, in the report footer's place (hidden for the demo).

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

**The reel in the demo.** The tile and the view run as on any album (the demo resolves to `full` and its
facts are read the same way), and its reel plays the optimistic tiles too, so a visitor's own simulated
photograph joins the loop. The view's Add yours is the page's own simulated Add ("Add yours (a demo
upload)"); there is no creator and no approval toast.

## The live reel (the guest half)

A dynamically composed, looped slideshow of the album's current approved media, watchable at once, taking
new uploads as they land and needing no host action. Nothing is stored and nothing is
downloadable: the reel is the album's own live payload, composed on the device by the live composer
(`lib/reel/live/`, `player-live.tsx`; the engine → [host-app.md](host-app.md)). A guest's own clip is the
creator's (below).

- **The facts ride the gallery payload.** `loadGalleryReel(event, access)`
  ([`gallery-access.server.ts`](../../src/lib/events/gallery-access.server.ts)) answers `null` short of
  `full` access (nothing is read), else `GalleryReel` ([`gallery-reel.ts`](../../src/lib/events/gallery-reel.ts)):
  the host's switch (`events.show_reel`) and mood (`reel_style_id`) off the event row, the platform lever
  (`ops_flags.live_reel_enabled`) and the host's plan for the creator (`clip`: `videoAllowed`, `watermark`,
  `maxSeconds`, tier-derived on the server and never on the client; `null` when the host's tier could not be
  read). `getLiveReelServerFacts` reads the lever and the tier on the admin client (`ops_flags` is deny-all),
  cached 30 s per event, each failed read reported. The page and every poll's 200 carry it, and the ETag
  hashes it.
- ★ **IT EXISTS FROM THE SECOND ITEM, AND BELOW IT THERE IS NOTHING** (`LIVE_REEL_MINIMUM`,
  `liveReelAvailable`). It counts approved, `reelEligible` items with something to draw; a clip
  (`reel_eligible` false) never counts and never plays. Below two, with the switch or the lever off, or
  behind a door, there is no tile, no view and no `?reel`: the host reaches the reel by adding the album's
  first two photos, so the view has no empty state of its own (a `?reel` below the minimum is dropped
  quietly and a phone's view whose album drops under two returns to the album; one behind a door waits for
  the door). The owner's reel is exactly a guest's: approved, visible, reel-eligible items only. The reel plays the SERVER's approved list, never an optimistic blob; the
  demo plays its optimistic tiles too, since its uploads never reach a server.
- ★ **THE WELCOME COMES FIRST, EVERYWHERE**: the door is how a guest reaches the event page, and a host who
  plays the reel on a venue laptop or screen goes through it on that device like any guest. A visitor who
  still owes the door meets it with no reel under it or over it, for `?reel` and `?reel=screen` alike (the
  screen posture is no exception); the moment they are through, the reel their link asked for opens. The door says so itself (EntryModal's `onPendingChange`: a step pending or
  the "You're in" beat holding, reported once hydrated), and the page treats it as owed until that first
  report. The owner never owes it and gets the reel at once. A `?reel` that cannot play is dropped only once
  the door is behind the visitor.
- **The Highlight reel tile** (`LiveReelTile`, [`reel/live-reel.tsx`](../../src/components/guest/reel/live-reel.tsx))
  sits in its own slot directly above `aboveAlbum`, on the words' column, never a fourth arm of
  `pickAboveAlbumState`. A slow crossfade of six stills from the reel's own take (`planTake`, via
  [`reel-tile.ts`](../../src/lib/guest/reel-tile.ts)), previews only, so it never mirrors the tiles beneath
  it; no engine on the album and nothing blocking its first paint. Headed "Highlight reel"; "Make your own
  clip to share" only once a creator is registered AND the host's plan was read; no style name, no count, no
  corner badge. A tap opens the view (a pointer over it warms the view's chunk). It stays with uploads
  closed.
- **The view** ([`reel/live-reel-view.tsx`](../../src/components/guest/reel/live-reel-view.tsx), `React.lazy`,
  ONE import promise shared by the warm-up and the lazy boundary) is a full-bleed Radix dialog over the
  player in `fill` (cover), following the viewport's orientation. ★ **In a landscape composition every mood
  fills the frame edge to edge** (`fillLandscape`, `lib/reel/live/window.ts`), because a laptop or an event
  screen is where the reel must fill the room: Cinematic's letterbox bars and Editorial's inset card are set aside, and a mismatched photograph (a
  portrait shot on a laptop or a screen) stays whole on its own darkened blur rather than a flat colour.
  Portrait keeps every mood as designed. ★ **`?reel` is its address**
  ([`reel-url.ts`](../../src/lib/guest/reel-url.ts)): opening PUSHES an entry marked in its own history state
  (`prReelPushed`), so a phone's back gesture closes the view; closing an entry the page pushed goes back,
  and closing a deep link's view REPLACES the address, so closing never leaves the page. Every other
  parameter survives AS WRITTEN (only the `reel` segment is touched, never a re-serialised query; the
  viewer's `withPhotoParam` is the mirror).
  - **The chrome**: at rest a slim glass bar at the foot (play and progress); pointer movement, or a tap on
    the bar on touch, grows it into the dock (a `clip-path` morph, [`live-reel.css`](../../src/components/guest/reel/live-reel.css),
    instant under reduced motion); a resting pointer settles it back (2.4 s; 4.2 s after a touch). Close shows
    and hides with the dock, and every control has a tooltip.
  - **The dock**: one row of icon buttons (play/pause, Include videos, Style, Hold, Show the code, Add yours),
    then "Make your own" as the single primary, only with a creator. Show the code exists from 1024px up
    only (a phone has no wall to show it to). Space pauses, Escape closes, the arrows step a clip (the
    player's `step`; the clock never moves).
  - **The owner's extras** (the event's owner, who meets no gate on the page; the host's hub links its Reel
    card here): at 1024px and up a seventh icon, Play on a screen, opens `?reel=screen` in a new tab; and Close
    goes back where the host came from whenever there is history (`useReelParam().close({ returnBack })`),
    else to the album, where a guest's deep link always closes onto the album.
  - **The viewer's own knobs, on this device** ([`reel-prefs.ts`](../../src/lib/guest/reel-prefs.ts),
    `localStorage`, never on the wire): Hold (1, 1.5, 2.2, 3, 3.6, 5 or 7 s a photo, 3 by default, converted
    into the mood's `holdScale`); Style (the eight moods, per event, defaulting to the event's
    `reel_style_id`, else the default mood); Include videos (on, unless `navigator.connection.saveData` says
    otherwise).
  - **The arrivals** ([`arrival-feed.ts`](../../src/lib/guest/arrival-feed.ts)): the provider's arrival ids
    name their uploader top left for one hold; a burst stacks into a short feed of limited depth that
    collapses ("Theo +12").
  - **The code** (`Show the code`): a white plate bottom right, the event's QR in the host's preset,
    "Scan to add yours" and the readable address (the custom slug's, when there is one). No event name on
    screen.
  - A tap on the picture pauses and opens the item in the shared media viewer, grown out of the FRAME
    (`origin` of kind `reel` with the picture's rect and no `returnTo`, so the way out lands back in the
    frame), a playing video carrying on from the reel's moment (`startAt`, from the player's `moment()`;
    a video drawn as its poster starts at the top). Reduced motion holds the
    first frame with the dock up. The loop never announces its seam. Twelve failed frames or stills send ONE
    Sentry report per view, and every failure also feeds the provider's watchdog.
- ★ **THE VIEW IS THE WALL: `?reel=screen`** is the same view in its screen posture: the reel plays in the
  window at once with the code on, under a glass pill at the top, "Press anywhere to fill the screen". The
  press (anywhere, the pill included) takes fullscreen where the platform allows it and the wake lock
  ([`screen-posture.ts`](../../src/lib/guest/screen-posture.ts)), re-taken on every return to visible and
  released only when the view closes; leaving fullscreen never pauses the reel or lets go of the lock, the
  pill simply comes back. Where the platform has no fullscreen the pill asks to keep the screen awake and
  goes once pressed. Under reduced motion the window holds its first frame until the press (the host's
  explicit act). A screen whose album drops under two (or reloads there) shows the code and the address
  alone until the reel returns.
- **The approval toast** (moderated events only): once per visit, when the first of this device's held
  uploads shows up approved while the reel is showing, "The host added your uploads" with "Watch reel",
  which opens the view. No numbers; never for a clip. The queue lives in memory, so it plays only within the
  visit that made the upload.
- **The creator's seam** ([`creator-seam.ts`](../../src/components/guest/reel/creator-seam.ts)): `REEL_CREATOR`
  is `null` until the creator registers there, and every "Make your own" renders only when it is present, so
  no build shows a dead end. A finished clip goes through `addClipToAlbum(file, poster)`: the ordinary upload
  queue (`addClip`, `reelEligible: false`, the poster as its preview) → the complete route → the pipeline →
  `create_media(..., p_reel_eligible => false)`.
- The stored reel's guest files (`guest-reel-card.tsx`, `guest-reel-overlay.tsx`, `lib/reel/guest-reel.ts`)
  are not rendered or read by the page; they are residue until the stored reel's teardown.

## See also

[database-security.md](database-security.md) (the capability-RPC inventory) · [auth-accounts.md](auth-accounts.md) (the sign-in the account gate uses) · [uploads-and-r2.md](uploads-and-r2.md) · [notifications-analytics-growth.md](notifications-analytics-growth.md).
