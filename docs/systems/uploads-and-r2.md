# Uploads, R2 & media rendering

Open this before you:
- touch the upload pipeline (presign, complete, the shared uploader) for guests or hosts;
- add an R2 key, a variant or a client, or anything that fetches a presigned URL;
- touch the EXIF strip;
- change how media renders (tiles, previews, video posters, the viewer) or downloads (Save, Download all).

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
  `<kind>` and `<ext>` from its echoed `content_type` and requires the `original` variant (`preview` for the preview):
  zero stored state (`checkCompleteKeyConsistency`). Without the variant pin, completing with the preview as the key
  meters 2 MB while a 10 GB original goes uncounted; without the kind pin, video completes as a photo row past the
  Free tier's photos-only gate. Refuse, never repair.
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

## The EXIF strip

Originals are served byte-for-byte (the viewer, Save, the zip), so a phone's GPS and device EXIF would leak a location.
`uploadFile()` strips identifying metadata at step 0, BEFORE any size is read, because the presigned PUT binds
Content-Length to the declared size and every later step must see the stripped bytes; guests and hosts pass the same
seam. The stripper (`media/strip-metadata.ts`, whose header carries the per-format rules) is pure and lossless, byte
excision and never a pixel re-encode, and the browser and the Node backfill (`scripts/backfill-strip-exif.mjs`) share
it rather than fork it.
- **It fails open:** unparseable or exotic input (HEIC/HEIF/AVIF, where blanking the item-based metadata destroys
  the image, and WebM) uploads untouched with `stripped: false`, and the EXIF inside a JPEG's post-EOI MPF secondary
  images survives (excising it would shift the trailer the MPF index points into). A corrupted upload is worse than
  the leak. `/privacy` discloses the exception, so the two change together, and `hasGpsMetadata` scans the trailers
  so a backfill report flags clean-but-GPS.

## R2 and presigns

- **Configured outside the repo, and load-bearing:** the bucket's CORS allows PUT, POST, GET and HEAD with
  `content-type` and `range`, and exposes `ETag` (multipart completion), `Content-Range` (the reel's byte-range reads),
  `Accept-Ranges` and `Content-Length`; `wrangler r2 bucket cors set` sets it (the R2 MCP cannot). A lifecycle rule
  aborts incomplete multipart uploads.
- **Any S3 client pointed at R2 sets `requestChecksumCalculation` and `responseChecksumValidation` to
  `WHEN_REQUIRED`:** the SDK's automatic CRC checksums make R2 write 0-byte objects or answer
  `SignatureDoesNotMatch`. An upload presign signs `content-type` and `content-length`; an UploadPart presign,
  `content-length`.
- **Raw keys never reach the browser:** every read is presigned server-side (`toGridItems`; the paged album's
  `album-guest-links.ts` and `album-host-links.ts`), and the render routes are dynamic.
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
  Share and Save, fetch with `cache: "no-store"`, and so does any new CORS reader of gallery presigns. R2's
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
  link's re-mint (the attribution version moves on a name, not a face); the teaser and the personal feeds carry none.
- **Tile previews are made in the browser at upload** (a ~640px WebP: a resize for photos, a frame-grab for videos)
  and PUT as the reserved `preview` variant: $0 and predictable, with no transform fee to meter against a
  storage-billed plan. Tiles serve `previewUrl ?? url` (an `onError` falls back to the original); the viewer and Save
  keep the original; a row with no preview serves the original.
- **`videoPosterSrc()` appends `#t=0.1`:** iOS Safari paints a paused `<video>` black unless the src asks it to seek
  and render a frame. A video tile with a preview draws the preview `<img>` and falls back to the poster `<video>`
  only without one. Grid video tiles carry no controls, since a `<video controls>` inside the tile's `<button>` is
  invalid HTML; playback is the viewer's.
- **The viewer (`media-lightbox.tsx`) is the one every gallery surface uses;** its gestures and their reasons live in
  its header, so a new surface reuses it rather than forks it.
- **Save is a signed download:** `presignDownload({ key, downloadFilename })` bakes `response-content-disposition`
  into the signature, because a `download` attribute is ignored across origins; a top-level `<a href>` needs no bucket
  CORS.

## Download all

"Download all" zips an album off Vercel, on the streaming export Worker (`partyreel-export`, on `*.workers.dev`).
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
  request, intersected with what she can see; the summary carries its counts, and the closed door is asked first on
  every path (Yours, a retry, a part).
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
