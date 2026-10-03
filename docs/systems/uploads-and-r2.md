# Uploads, R2 & media rendering

Open this before you:
- touch the upload pipeline (presign, complete, the shared uploader) for guests or hosts;
- add an R2 key, a variant or a client, or anything that fetches a presigned URL;
- touch the EXIF strip;
- change how media renders (tiles, previews, video posters, the viewer) or how photos are taken home (Save, a
  guest's Select then Save, a host's two sets, the zips).

Elsewhere: cap and ingress enforcement ([billing-caps.md](billing-caps.md)), the purge and reclaim ([lifecycle-recovery.md](lifecycle-recovery.md)), the backups
([durability-backups.md](durability-backups.md)), the grants and the server-mediated RPCs ([database-security.md](database-security.md)), forensic capture
([trust-safety-forensics.md](trust-safety-forensics.md)).

## The upload pipeline

The browser uploads straight to R2 (one PUT under 100 MB, multipart above), so no media byte passes through a Vercel
function; a presign route mints the URLs and a complete route records the row through `create_media*`, which writes the
ledger and enforces the caps. Guests (the session-token capability) and hosts (a signed-in batch) share one engine,
`upload/server-pipeline.ts`, behind four thin strategy routes, and the response shapes are `uploadFile()`'s contract.
`uploadFile()` is shared by both (the caller passes its endpoints and an identity); `HostUpload` reuses it with
`FileDropzone` and refreshes the route once after the batch.
- **The guest/host asymmetries are deliberate,** so the consolidation stops where it did. The host's `getUser()`
  gates in the route before the engine (401 before the body is parsed); a guest's token is validated inside the RPCs,
  and a token whose row carries an account uploads only for that signed-in account, and a signed-in account only
  through a row of its own (`checkSessionOwner`, at presign AND complete: [guest-flow.md](guest-flow.md)). The per-event `max_upload_bytes` binds guests only. Refusals are framed per
  identity: a guest's video refusal names the EVENT so a guest never learns the host's plan, a host's names the tier,
  and a host's `not_owner` is a 404, so existence never leaks; the guest failure sheet prints each refusal verbatim,
  which makes its wording user-facing copy. No request rate limiter sits on the four routes but one: the capability, the caps,
  the per-part Content-Length binding and the multipart abort are the abuse control, and a guest's clip into the album
  (a `reelEligible: false` completion) also spends `reel_clip_add`, a daily budget per guest session ([reel.md](reel.md)).
- **`create_media*` is the only write into `media`.** A host's RLS insert would bypass the ledger,
  `storage_used_bytes` and the cap: unmetered storage. The RPC re-checks both keys' event prefix (`events/<event_id>/%`,
  else `bad_key`), so a valid session can never record a row in another event's namespace, nor plant a victim's preview
  key and destroy that object from its own bin.
- ★ **The complete seam pins the key to what presign minted: the key IS the issuance record.** Presign builds
  `events/<eventId>/<kind>/<mediaId>/<variant>.<ext>` from that request's `content_type`, so completion re-derives
  `<kind>` and `<ext>` from its echoed `content_type` and requires the `original` variant (`preview` for the preview,
  `phone` for the phone copy, a photograph's alone and a `.jpg`): zero stored state (`checkCompleteKeyConsistency`).
  Without the variant pin, completing with the preview as the key
  meters 2 MB while a 10 GB original goes uncounted; without the kind pin, video completes as a photo row past the
  Free tier's photos-only gate. Refuse, never repair.
- ★ **A complete for an upload already recorded is its row's to answer** (crumbs-62, red-team 49's LOW): after the
  request's own shape and before any gate, copy or withdrawal, the engine reads the row by its id
  (`readRecordedUpload`, the admin client) and answers `recorded`, whoever sends it, with no cookie and no forensic
  record (both the first landing's), and a key that is not its row's is refused; a refused or failed record takes its
  copies back out of `events/` only once the row is read and there is none (`withdrawUnlessRecorded`: a twin that
  recorded meanwhile makes it `recorded` too, and a read that fails takes nothing, left to the orphan sweep). A phone
  replays a complete whose answer it lost, and anyone who knows the key a tile's link shows can send one on any ticket:
  re-landed, it met each gate as it stood then (the roll its own shot filled, the album closed, a cap its own bytes
  reached, a dead ticket) and the refusal withdrew the files the row names. A recorded clip's replay neither meets nor
  spends `reel_clip_add`.
- **The size is the R2 HEAD's** at complete, never the client's claim ([database-security.md](database-security.md));
  `duration_seconds`, `width` and `height` stay client-supplied and non-authoritative, the byte cap being the cost
  boundary.
- ★ **No upload can exceed its declared size.** Presigned PUT and UploadPart URLs bind Content-Length (each part's
  exact size), so R2 rejects an over-stuffed body, AND complete sums the real parts (`ListParts`) and aborts rather than
  assembles over the ceiling. Without both, a small declaration and a few hundred over-stuffed parts complete into a
  multi-terabyte orphan the backup Worker would copy into the 35-day-locked bucket (`create_media`'s ceiling guards the
  row and the accounting, not the object's existence).
- ★ **The preview PUT is size-bound and capped too** (`MAX_PREVIEW_BYTES`, 2 MB; the preview presign is skipped over it
  and the original still uploads): the preview is not metered, so an unbounded one at its server-built key would be
  cap evasion. Its bytes go uncounted, an accepted under-count.
- ★ **Every new photograph has a phone-size copy, never metered, so capped twice** (take-home r1, 20261003110000): a
  2048 px JPEG made in the browser after the preview (`generatePhoneCopy`, `media/preview-size.ts`), PUT size-bound at
  `events/<event>/photo/<id>/phone.jpg` (`phoneKeyFor`), recorded as `media.phone_key` with its HEAD size
  (`phone_bytes`) in the same `create_media*` insert. It fits only within 4 MB AND half its original's bytes
  (`phoneCopyFits`), checked at presign on the declared sizes, at complete on the HEAD's (a multipart original can land
  shorter than declared), in the RPC and by the row's own CHECKs: an uncapped copy beside a tiny original would be
  storage nobody pays for. A copy past either cap at complete is dropped and its object deleted, a missing one dropped,
  and the photograph lands without one; the ledger, `storage_used_bytes` and every cap read `file_size_bytes` alone.
  Videos stay as taken, and no row is backfilled: a photograph without a copy serves its original everywhere. ★ The app
  names the two RPC arguments whenever a copy exists, so the migration is applied before the push.
- ★ **A locked event gates UPLOADS, not just viewing.** The three guest seams (the `/api/guests` mint, presign and
  complete) each re-check `mayUploadPastLock(eventId)`: `private` refuses every guest write (the owner uploads through
  the host routes), and `password` needs the signed unlock cookie OR the host, by the page's own owner answer
  (`isRequestOwner`: the owner never meets the password modal, so a bare unlock check would block the host on their
  own event). Gating only the mint is not enough:
  a token minted while the event was open would upload forever, and locking is what a host does when a link leaks. The
  lock is checked before `accepting_uploads`, so someone who cannot see the album learns nothing else about it, and
  `create_guest` re-refuses from its own `p_unlock_proven`.
- **One ceiling per upload, 10 GB, by size only** (no duration cap; `media/limits.ts`), enforced in `create_media*` on
  the HEAD size. A host may set a stricter per-event cap (`events.max_upload_bytes`, 25 MiB to 10 GB, or none) that
  binds guests only, read inside the RPC, never from a parameter. The guest page never learns that number
  (`get_event_by_qr_token` does not return it), so the add sheet's terms line states the universal ceiling, never
  over-promising. Upload presigns live 2 hours, because a multipart upload presigns every part up front.
- **A host upload is `guest_id is null`:** `create_media_as_host` authorizes by the route's `getUser()` id and event
  ownership, counts against the plan like any upload, lands `approved` (the host is the moderator) and ignores
  `accepting_uploads` (the guests' switch).
- ★ **The seal and the camera are decided at insert** (`20261002200000`, [disposable-mode.md](disposable-mode.md)):
  `create_media*` seal a row to the album's develop time while it is ahead, whatever the capture; with the album's
  camera on, a guest's shot also meets her roll (live shots against `roll_size`) and its ceiling (three rolls' worth a
  period, in the `camera_rolls` ledger), and a camera video 10 s and 128 MB. The presign refuses each first in the
  server's own words (`cameraShotRefusal`, from `get_upload_context`'s `roll`), and the complete answers the race it
  loses with 409 `roll_spent`; the host's own uploads meet none of them. ★ The complete answers `sealed: true` beside
  `approved` for a row sealed at insert (nothing else changes in its answer), and the guest queue tells that landing
  `sealed`, which no album surface draws (disposable-mode.md, "The guest's camera").

## The EXIF strip

Originals are served byte-for-byte (the viewer, Save, the zip), so a phone's GPS and device EXIF would leak a location.
`uploadFile()` strips identifying metadata at step 0, BEFORE any size is read, because the presigned PUT binds
Content-Length to the declared size and every later step must see the stripped bytes; guests and hosts pass the same
seam. The stripper (`media/strip-metadata.ts`, whose header carries the per-format rules) is pure and lossless, never
a pixel re-encode, and the browser and the Node backfill (`scripts/backfill-strip-exif.mjs`) share it rather than fork
it: one file, because the backfill loads it through Node's type stripping, which cannot follow an extensionless import.
- **Every accepted format is stripped; only JPEG, PNG and WebP shrink.** The rest are rewritten in place at their exact
  length, because something points at their bytes: a video's chunk-offset tables, an HEIF's iloc (its Exif and XMP
  are items, and blanking `meta` would destroy the image), a WebM's SeekHead and Cues (each Tags becomes a Void of its
  size), a JPEG's MPF index (an embedded image's Exif is overwritten at its segment's length). Rendering data stays:
  orientation, the color profile, an HDR gain map and the XMP that describes it.
- **It fails open:** input it cannot walk end to end, or cannot rewrite without touching a byte something else points
  at, uploads untouched with `stripped: false` (the header lists the cases). A corrupted upload is worse than the leak.
  `/privacy`'s metadata section and the help article on it describe this, so they change with it, and
  `hasGpsMetadata` reads every place the strip scrubs, so a backfill report's clean-but-GPS line is a file to look at.
- ★ **A Matroska walk meets unknown sizes.** MediaRecorder writes an unknown-size Segment of unknown-size Clusters,
  and one ends where an element that cannot be its child begins (RFC 8794 §6.2): the walk knows a Cluster's children,
  and anything else unknown-sized (a Tags) fails open.

## R2 and presigns

- **Configured outside the repo, and load-bearing:** the bucket's CORS allows PUT, POST, GET and HEAD with
  `content-type` and `range`, and exposes `ETag` (multipart completion), `Content-Range` (the reel's byte-range reads),
  `Accept-Ranges` and `Content-Length`; `wrangler r2 bucket cors set` sets it (the R2 MCP cannot). A lifecycle rule
  aborts incomplete multipart uploads.
- ★ **R2's S3 endpoint speaks HTTP/1.1 only** (`curl --http2` negotiates 1.1), so every R2 read a page makes (tiles,
  the viewer's originals, a clip's ranges, the light's samples, a Save) shares about six connections to one host, CORS
  and no-cors alike (iOS 26.5 WebKit carried an `<img>`, a clip and a CORS fetch on one connection). What loads first is
  a choice the viewer makes (below).
- **Any S3 client pointed at R2 sets `requestChecksumCalculation` and `responseChecksumValidation` to
  `WHEN_REQUIRED`:** the SDK's automatic CRC checksums make R2 write 0-byte objects or answer
  `SignatureDoesNotMatch`. An upload presign signs `content-type` and `content-length`; an UploadPart presign,
  `content-length`.
- **Raw keys never reach the browser:** every read is presigned server-side (`toGridItems`; the paged album's
  `album-guest-links.ts` and `album-host-links.ts`), and the render routes are dynamic. A guest's own items the album
  cannot show her (held, or sealed for the develop) are presigned for her alone by her tracker's read
  (`/api/guests/mine`, as far as the ticket is hers), never a refused one's.
- **Gallery read presigns are stable:** `presignDownload({ stable: true })` pins the signing date to the current
  30-minute bucket (`r2/presign-bucket.ts`), so two presigns of one key in a bucket are byte-identical: the image
  cache works across refetches and the gallery's ETag rolls with the bucket. They live 90 minutes (two buckets and
  slack), so a leaked gallery URL lives at most 90 minutes, an accepted trade. Upload presigns are never stable.
- **The paged album mints links by id, per window** (`/api/album/guest/media`, `/api/album/host/<id>/media`): at
  most 200 ids an ask, three links each (the tile: the preview, or the original when there is none; the inline
  original, sent null when it is the tile; the attachment), and an id that is not visible in that album comes back
  `missing`. ★ **Each answer carries its bucket (`b`, read BEFORE minting, so a roll mid-request only lengthens a
  link's life) and the server's clock (`now`)**: the client dates each link on its own clock from those offsets and
  re-mints an hour after the bucket opened, half an hour before the link dies (`src/lib/album/links.ts`), so the
  album's validators never carry the bucket and an album left open stays on 304. The teaser's nine travel inline on
  the poll, so its validator is the one that still rolls with the bucket.
- ★ **A CORS read of a tile-shared presign bypasses the HTTP cache.** Plain `<img>` tiles fetch presigned URLs with no
  Origin, R2 answers without `Access-Control-Allow-Origin` (and without `Vary: Origin`), and the browser caches that
  under the SAME URL the stable scheme shares; a later `fetch(mode: "cors")` reads the poisoned entry and fails with a
  bare "Failed to fetch" and no console error. The reel engine's asset loader and video window reader, and the viewer's
  held originals and its tap reads (Share, Save), fetch with `cache: "no-store"`, and so does any new CORS reader of
  gallery presigns. R2's
  403s carry no CORS headers either, so an EXPIRED presign read by a CORS fetch looks like a CORS failure.

## Rendering media

- ★ **An uploader's email reaches the host's gallery only.** Attribution resolves in one admin read
  (`getUploaderIdentities`: `profiles` RLS is own-row-only and the guest identity columns sit outside the host's
  grant). The host gallery's items carry the email; every guest-facing item is built by `toGridItems`, which names only
  the name, `isHost` and `isVerified`, never an email or `pending_email`, by construction rather than a viewer flag, and
  `grid-items.email-safety.test.ts` guards it. The paged album attributes only the ids a window asks for
  (`readAlbumAttribution`), and its guest path never even selects `guests.email`; its guest tuple is a name, two
  flags and, where one may show, a face, guarded by the same test.
- **Credit follows the identity** (`resolveUploaderIdentity`): no `guest_id` is the Host (the host's name, no email);
  a verified guest shows their profile's name (and, to the host, `guests.email`); an unverified typed name shows with
  the unverified mark and never an address; a row with no name shows no credit, never an invented stand-in.
  Attribution lives in the viewer; `MediaTile` reads only `type`, `url` and `previewUrl`.
- ★ **And its face follows the same cases** (`faceOwner`, hydrated server-side by `uploader-faces.ts`): a confirmed
  sender whose account stands wears the face the album's Guests list paints (the avatar's public URL, `seedFor`'s
  colour) and a door only to a published page (`/u/<slug>`), the host the byline's; a typed name keeps the plain disc
  and no door. On a guest's view a person the event blocked keeps the plain disc (on no list, so no face the album
  shows); the host's album and Review take every confirmed sender's face for the host's look. Faces are read by
  account after the attribution read, fail open to the plain disc, ride the link's who tuple, and move with the
  link's re-mint, which an open album asks at once whenever the attribution version moves: on a name, a face
  (`avatar_updated_at`) or a handle (`slug`; `profiles_album_note`, 20261001233110); the teaser and the personal
  feeds carry none, but for the owner's own events' uploads in her Uploads, which wear her own name and face with no
  door, credited "You" (`ownUploadCredit`). A host with no name wears no disc, never a "?" standing in for one.
- **Tile previews are made in the browser at upload** (a ~640px WebP: a resize for photos, a frame-grab for videos)
  and PUT as the reserved `preview` variant, and a photograph's phone copy beside it (above): $0 and predictable, with
  no transform fee to meter against a storage-billed plan (measured at 375 with 4x CPU on a 12 MP photograph: the copy
  601,592 B of 3,671,488 B in about 290 ms, the preview 46 KB in about 100 ms). Tiles serve `previewUrl ?? url` (an `onError` falls back to the original); the viewer draws the
  original and Save and Share send it (below); a row with no preview serves the original, which the viewer then draws
  from the tile's cached copy rather than holding it twice.
- **`videoPosterSrc()` appends `#t=0.1`:** iOS Safari paints a paused `<video>` black unless the src asks it to seek
  and render a frame. A video tile with a preview draws the preview `<img>` and falls back to the poster `<video>`
  only without one. Grid video tiles carry no controls, since a `<video controls>` inside the tile's `<button>` is
  invalid HTML; playback is the viewer's.
- **The viewer (`media-lightbox.tsx`) is the one every gallery surface uses;** its gestures and their reasons live in
  its header, so a new surface reuses it rather than forks it.
- **Save is a signed download:** `presignDownload({ key, downloadFilename })` bakes `response-content-disposition`
  into the signature, because a `download` attribute is ignored across origins; a top-level `<a href>` needs no bucket
  CORS.
- ★ **The viewer holds the original it draws, and Save and Share send those bytes** (`lib/media/share-save-held.ts`):
  a photograph with a preview has its original read once (CORS, `no-store`) and drawn from an object URL, and a tap
  hands that file to `navigator.share` with no await before it, since WebKit opens a sheet only within 5 s of the tap
  (measured 5,023 ms); the old read on the tap, a second copy of the original the viewer had just drawn queued behind
  the viewer's own loads, was the whole of a 30 s wait. The photograph on screen loads first, its neighbours after it,
  two at once, and a neighbouring clip asks for nothing until the centre is held, since iOS reads a neighbour's
  `metadata` as the whole clip; a slot that lets go aborts after a short grace; held files nobody draws stay inside
  64 MB, oldest out first. A clip is never held: its Save reads on the tap, drawn as a ring with a stop. Anything it
  cannot hold (over 32 MB, a body quiet for 15 s, a refused read) is drawn and saved the plain way, and two refused
  reads before any success (an origin R2's CORS does not list, localhost among them) turn holding off for the page.

## Taking photos home

A guest takes photos home by Select, then Save (take-home r1, `guest=select`): Select stands where Download all did,
the album's row turns into a bar stuck to the screen's top (Cancel, her picks, Yours and All) and every tile into a
check, and the foot's shutter turns to Save (`live-gallery-select.ts`, the store the album and the dock share), naming
her set as the album names it (`setNoun`: the dock stands outside the album's live source, so the album's kinds reach it
through a page store said from inside that source while she selects, `guest-action-dock-kinds.ts`).
- ★ **On a phone her Save asks one quick choice, each way with its size** (`save=light`, `live-gallery-save.tsx`): Save to
  Photos, at phone size through the phone's own sheet, beside Save to Files, the originals as one zip ("24 photos ·
  13.8 MB" beside "Originals · 84 MB", the server's `summary` of her `ids`), so Files reads as the full-quality path. A
  desk, or a phone whose sheet takes no file, gets the originals' zip and no question.
- ★ **Photos goes through one engine** (`take-home-save.ts`, the host's Phone size in a hand too): the links are minted
  only when she saves (`step: "save"`: phone copy, else original, a clip as taken; at most 2,000 and all or none, so
  past it Photos waits and the originals' zip takes them all, never a partial Save), the files fetched
  three at a time (`fetchMediaFile`, `no-store`) into sheets of at most 100 MB (`packSheets`; a clip heavier than a
  sheet downloads plainly), the shutter's ring and the toast counting the bytes. The sheet opens inside the tap while
  its activation holds; past it (WebKit's five seconds) the toast and the shutter say Ready and the next press opens it
  with the files in hand, never fetched twice; a dismissed sheet keeps them the same way; a part past the first is a
  tap ("Get part 2"); the x stops every read.
- **A host's Download opens her two sets** (`host=two`, `take-home-panel.tsx`, the plan popup): Originals, to keep for
  good (one zip), and Phone size, to post tonight (the photographs at 2048 px: a zip at a desk, a Save into Photos on a
  phone that can), each pictured by the album's newest tiles (`summary`'s `pictures`) with its size; clips come as
  taken, with the originals; Include hidden items when anything is hidden. Every summary bucket says both sizes
  (`phone`), and a mint takes `size` (a phone-size zip of the copies, measured by their bytes).
- ★ **Every purge deletes all three stored copies** (`MEDIA_KEY_COLUMNS`, `mediaKeysOf`): the sweeps, account deletion,
  the bin's Delete permanently (the copies read on the admin client for the rows her own read proved hers: no client
  role holds `phone_key`) and the demo seed's held keys. `r2/stored-copies-policy.test.ts` refuses a purge that can
  forget one and a reader of `preview_key` that never names the third (display readers listed with why), in TS and
  SQL; a copy reads from its key alone (`isDerivedCopyKey`, `DERIVED_COPY_RE`), so a filter that keeps originals only
  needs no row.
- ★ **No guest byte is billed by Vercel** (`media-cost-policy.test.ts`): no remote pattern, domain or loader for the image
  optimizer, no `next/image` fed a link or beside a presigner, and `GetObjectCommand` only signed, in `r2/presign.ts`.

The zips go off Vercel, on the streaming export Worker (`partyreel-export`, on `*.workers.dev`), which accepts the
`phone` key (and so deploys before an app that signs one: `compat.test.ts`).
- **The app is the one authorization oracle.** The mint route (`/api/export/host`: `getUser()` and ownership;
  `/api/export/guest`: the token, `resolveViewerDecision` and `loadGalleryRowsForAccess`, so a guest never exceeds
  what the gallery shows) builds the manifest and HMAC-signs it into an opaque token; the Worker authorizes nothing,
  checks the signature, expiry and key layout (`EXPORT_SIGNING_SECRET` equals the Worker's), and streams a zip of the
  R2 objects straight back, so no byte touches Vercel. The browser form-POSTs the token at the top level: no gesture
  needed after the awaited mint, and no navigation (a cross-origin iframe download is a tightening browser
  restriction).
- ★ **The page goes blind at that POST, so the walk asks the Worker first** (`components/app/export/export-walk.ts`):
  `POST /check` (the token as `text/plain`, CORS `*`, no credential) answers `{ items, found, missing }` by `head` or
  a folder's `list`, never a byte read. An empty zip is refused in one line and never sent, a short one is counted
  with a Try again narrowed to exactly its missing ids (`ids`, intersected server-side), and a token the Worker would
  refuse is said in the toast instead of replacing the page. A check that cannot answer (an older Worker, R2 down)
  never stops the zip. One toast carries it all, with the x that aborts whatever is in flight; a mint gets two quiet
  re-attempts first. A host's selection that mixes hidden and shown items asks first in that toast (Include them,
  Leave them out), read from the selection's own summary; one of only shown or only hidden goes as picked.
- ★ **After the POST the Worker reports, and SAVED is its word, never the page's guess.** The mint signs the
  minting deployment's own `/api/export/report` into the token (`report`, additive: the token stays v1) wherever the
  Worker can reach it (`lib/export/report.ts`'s `reportAddressFor`: never a laptop behind the deployed Worker); the
  Worker then reports the check's count, the stream's start and its end (saved, short, stopped, failed, empty, with
  the ids its zip lacks), each a POST signed with the export secret in a `report:` domain no token can share, fresh
  within five minutes. The app keeps each on the mint's `export_log` row by its nonce (`jti`, unique), filling only
  empty fields; the walk polls `/api/export/status` by that nonce (every second, backing off to ten, six hours at
  most) only where the mint asked and the Worker's check promised (`reports: true`), so a zip reads saved once its
  last byte left the Worker, a walk's last word waits for every part, and silence past a stream's start (15 s) means
  the word cannot come: the walk then says what it knows and claims nothing. A walk still listening survives a
  reload the way a walk between parts does (`next: null`).
- ★ **The window between the check and the stream is closed in the Worker** (`workers/export/src/stream.ts`): for a
  token that asks for reports it finds the zip's first object before it answers, and none at all is a `204` (a
  top-level form POST stays on the page, no file) reported `empty`; an object gone mid-stream is skipped and named.
  A token without the ask is streamed exactly as before, empty zip and all. ★ The reported zip is PUSHED into a
  pass-through the response reads, because a client that leaves shows only as a failed write: the runtime cancels
  no pulled response body and, under `wrangler dev`, aborts no `request.signal` (a pulled body stalled until the
  runtime killed the request as hung, its end never reported).
- ★ **Past one zip's ceilings (2,000 items or 20 GB) an album comes home in parts**, oldest first: each mint
  (`part`, `after`) takes the next part from a position cursor, never a page index, so nothing is skipped or taken
  twice while the album moves, and each part is its own tap (a browser holds back a second download a page starts
  alone; a token lives two minutes). A request without `part` keeps the old 413, so a stale tab never takes part 1 for
  the album. ★ A walk between parts survives a reload (a phone's browser drops a tab it left for the Files app): its
  cursor and counts are kept in the tab's sessionStorage (`pr-export-walks`, read back only if every field is one a
  server would take), and the next page that can start a download offers the same "Get part N" again, a tick after
  mount so the toaster is listening; its last part and its x let it go. Nothing is posted on a resume.
- ★ **Yours is the server's** (`lib/export/yours.server.ts`): a guest's own uploads by her account and this
  browser's ticket cookie (the route's read identity) as far as the ticket is hers to a signed-in viewer (her own row,
  or one the claim takes: `sortTickets`, [guest-flow.md](guest-flow.md)'s owner rule), never an id list from the
  request, intersected with what she can see, plus her own shots still sealed for the develop (`readOwnSealedMedia`,
  of those ids alone: hers to see, never the album's zip); the summary carries its counts, and the closed door is
  asked first on every path (Yours, a retry, a part).
- ★ **One Worker deployment serves every app's build**, so a request an older app sends is answered exactly as the
  Worker it was built against answered it (`workers/export/src/compat.test.ts` replays milestone 29's requests at the
  vendored `milestone-29/` Worker, and milestones 30 to 32's, the check included, at `milestone-31/`); everything new
  is opt-in by the token, today's tokens still stream at both older Workers, and the entry module exports its handler
  alone (workerd refuses to start on any other named export).
- **A STORE-method zip, streamed, from a proven library (`client-zip`).** Media is already compressed, so deflate would
  burn Worker CPU for nothing; streaming ZIP64 fails silently in specific extractors (offsets, data descriptors, CRC),
  so a hand-rolled encoder is out; streaming keeps zero temp storage (the storage-billed margin) and needs no job table.
  A token is not single-use: a 2-minute TTL, where a replay only re-downloads what was already authorized, is the
  accepted bound.
- The per-export `export_log` (one row a part, its outcome the furthest anyone saw: the mint's refusal, or the
  Worker's word on its check and stream) and the `export_enabled` kill switch show on `/admin/exports`, beside the
  Worker's daily heartbeat (the `export` job, whose switch is `export_enabled`: the Worker reads the bucket and signs a
  ping to `HEARTBEAT_URLS`, partyreel.com first) and the downloads' signal (`export_delivery`: zips the Worker
  finished; failures are a check R2 refused, a stream an object read broke, a mint with nothing configured). The
  Worker still logs what it saw (`export-check`, `export-stream`, `export-report`).
