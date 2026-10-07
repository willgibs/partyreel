# Uploads, R2 & media rendering

Open this before you:
- touch the upload pipeline (presign, complete, the shared uploader) for guests or hosts;
- add an R2 key, a variant or a client, or anything that fetches a presigned URL;
- touch the EXIF strip;
- change how media renders (tiles, previews, video posters, the viewer) or how photos are taken home (Save, a
  guest's Select then Save, a host's two sets, the zips, Send to Google Drive).

Elsewhere: the cap and the uploads allowance ([billing-caps.md](billing-caps.md)), the purge and reclaim ([lifecycle-recovery.md](lifecycle-recovery.md)), the backups
([durability-backups.md](durability-backups.md)), the grants and the server-mediated RPCs ([database-security.md](database-security.md)), forensic capture
([trust-safety-forensics.md](trust-safety-forensics.md)).

## The upload pipeline

The browser uploads straight to R2 (one PUT under 100 MB, multipart above), so no media byte passes through a Vercel
function; a presign route mints the URLs and a complete route records the row through `create_media*`, which writes the
ledger and enforces the caps (a single PUT lands at its key's `staging/` twin, which the complete copies into
`events/`: [billing-caps.md](billing-caps.md)). Guests (the session-token capability) and hosts (a signed-in batch)
share one engine, `upload/server-pipeline.ts`, behind four thin strategy routes, and one client, `uploadBurst()` (the
caller passes its endpoints and an identity; `uploadFile()` is a burst of one), whose contract is the routes' response
shapes.
- ★ **The files a phone sends together are a BURST: one presign, and as few completes as their landing allows**
  (compute-uploads, the compute model's lever 4; the wire and its limits are `upload/burst.ts`'s: `{ ...identity,
  files: [...] }`, at most 20 files a request, one answer a file in order). The engine runs each file through the very
  spine its own request ran, in order, for every strategy (the host's routes took bursts unchanged): every check and
  word a file met alone it meets, and a file refused never stops its siblings. A burst shares only what cannot differ
  between its files (`Burst.memo`: the switch, the ticket's context, its owner, the lock, read once) and tells each file
  what its earlier siblings took: the meter judges it with their declared bytes added (held to one upload's ceiling)
  and the roll counts their shots, as one-at-a-time presigns saw them already landed; each file is metered once. A
  presign refusal of WHO is sending (`scope: "burst"`: the ticket, the album's door and switches, and the hour's
  breaker, which counts the host's uploads across her albums) refuses the whole request in the words each file would
  have met, the breaker's with `Retry-After`, and the client gives it to every file not yet asked for; a complete
  names an upload once a request. The guest's clip budget is the strategy's `budget` hook, met one clip after another.
  A burst is the only body: one file is a burst of one, and a body with no `files` is malformed (400).
- ★ **In the browser a byte never waits for batching** (`uploadBurst`): preparing (the strip, the preview, the phone
  copy) runs ahead of the network, the network's next file always and the rest within 64 MB; presigning asks for every
  prepared file at once, the first file alone, then the rest once the file in the air hands off its last byte (the
  browser's progress runs about a second ahead of the line, so only that moment says a file is ending; one handed off
  quicker than a presign's round trip waits for need, so a small file never splits the batch), or at once when
  preparing is held by the budget or done, the bytes go one file at a time, and the landed files are recorded together
  when the last has gone up, 10 s after the first landed (`BURST_RECORD_WAIT_MS`), or at once when the page is hidden
  (that complete `keepalive`). Meanwhile a landed file stands full: the guest's queue keeps it `queued` at 100 (only
  the file in the air is `uploading`, which the album's stack follows) and the host's panel `uploading` at 100.
  Callers take a burst with `takeBurst` (20 files, 1 GiB declared: presigns live 2 h). A caller with a burst after it
  begins that one on this one's bytes (`onSendDone`) and holds its complete for this one's answer (`recordAfter`): the
  line never idles for a complete, and one sender's completes never overlap.
- **The guest/host asymmetries are deliberate, so the shared engine keeps them.** The host's `getUser()` gates in the
  route before the engine (401 before the body is parsed); a guest's token is validated inside the RPCs, and a token
  whose row carries an account uploads only for that signed-in account, and a signed-in account only through a row of
  its own (`checkSessionOwner`, at presign AND complete: [guest-flow.md](guest-flow.md)). Refusals are framed per
  identity: a guest's video refusal names the EVENT so a guest never learns the host's plan, a host's names the tier,
  a cap refusal names the line it met (her uploads line or storage) in the album's words or her plan's, the same at
  the complete as at the presign (`upload/cap-words.ts`: [billing-caps.md](billing-caps.md)), and a host's `not_owner`
  is a 404, so existence never leaks; the guest failure sheet prints each refusal verbatim, which makes its wording
  user-facing copy. The one request limiter on the four routes is a guest's clip into the
  album (a `reelEligible: false` completion), which spends `reel_clip_add`, a daily budget per guest session
  ([reel.md](reel.md)), asked before a byte of the clip lands; otherwise the capability, the caps and the meter
  ([billing-caps.md](billing-caps.md)), the per-part Content-Length binding and the multipart abort are the abuse
  control.
- **`create_media*` is the only write into `media`.** A host's RLS insert would bypass the ledger,
  `storage_used_bytes` and the cap: unmetered storage. The RPC re-checks both keys' event prefix (`events/<event_id>/%`,
  else `bad_key`), so a valid session can never record a row in another event's namespace, nor plant a victim's preview
  key and destroy that object from its own bin.
- ★ **The complete seam pins the key to what presign minted: the key IS the issuance record.** Presign builds
  `events/<eventId>/<kind>/<mediaId>/<variant>.<ext>` from that request's `content_type`, so completion re-derives
  `<kind>` and `<ext>` from its echoed `content_type` and requires the `original` variant (`preview` for the preview,
  `phone` for the phone copy, a photograph's alone and a `.jpg`): zero stored state (`checkCompleteKeyConsistency`).
  Without the variant pin, completing with the preview as the key meters 2 MB while a 10 GB original goes uncounted;
  without the kind pin, video completes as a photo row past the Free tier's photos-only gate. Refuse, never repair.
- ★ **A complete for an upload already recorded is its row's to answer:** after the request's own shape and before
  any gate, copy or withdrawal, the engine reads the row by its id (`readRecordedUpload`, on the admin client) and
  answers `recorded`, whoever sends it, and a key that is not its row's is refused; a refused or failed record takes
  its copies back out of `events/` only once the row is read and there is none (`withdrawUnlessRecorded`; a read that
  fails takes nothing, left to the orphan sweep). A phone replays a complete whose answer it lost, and anyone who knows
  the key a tile's link shows can send one on any ticket: re-landed, it would meet each gate as it stands now (the roll
  its own shot filled, the album closed, a cap its own bytes reached) and the refusal would withdraw the files the row
  names. A recorded clip's replay neither meets nor spends `reel_clip_add`. A multipart its first complete assembled
  and never recorded lands on the replay as assembled (only that complete can have put an object at its server-built
  key, after the parts' sum); with nothing at the key the failure stays `complete_failed`, which the phone keeps.
- ★ **A cancel and a dropped connection are told apart, and a dropped one is never hidden** (E6): the failure sheet and
  the host's rows print each message as it is, so a transport's words are the uploader's (`UPLOAD_WORDS`). A
  request that never reached the network (presign, complete or the byte PUT), a presign or complete past its ceiling,
  and a PUT whose bytes stop moving for `UPLOAD_STALL_MS` (45 s, restarting on every byte; 90 s for R2's answer after
  the last byte), all say "Your connection dropped. Check your signal, then try again." with `cause: "dropped"`; an
  error answer says it "didn't go through" (the status goes to the console, never the guest); an abort `signal` says
  cancelled (`cause: "cancelled"`). A cancel is one file's or the burst's:
  `BurstFile.signal` stops that file alone (the guest's tile and the host's row each stop the one file she means),
  settling it `cancelled` at once while its siblings go on and are recorded together, wherever it stands short of its
  complete (a PUT in the air is aborted, a presign in the air lets its entry go, a landed file waiting for its
  siblings is simply not recorded), and a burst's own `signal` ends everything not recorded. ★ Presign and complete
  each end past a ceiling (30 s and 60 s, `PRESIGN_CEILING_MS`, `COMPLETE_CEILING_MS`) as a dropped connection, never
  a spinner. ★ A page looked at again gets a grace on each of these clocks, never a new one (`RETURN_GRACE_MS`, 10 s
  where less is left: a hidden page's timers freeze, so what arrived meanwhile is read first, and a restart whole held
  a dead request a fresh minute at every glance back). A presign out past 8 s
  (`PRESIGN_REASK_MS`) with a prepared file waiting behind it is taken back and its files asked again as one request
  with the waiting ones, once a file (the second ask has the ceiling to itself, so a line that is truly down ends the
  burst a presign later; one nobody waits behind keeps the whole ceiling; a phantom presign stores nothing), so a hung
  first presign never holds its siblings for the ceiling. A complete whose answer never came (none, one
  the phone cannot read, or the server's own `complete_failed` or `unknown`) is kept by its File (`UNANSWERED`), and
  that file's next try sends that very complete again (its media id, key and parts), never a presign or a byte: a row
  the first wrote answers `recorded`, so no row or byte is counted twice; any other answer settles it, and a refused
  file's next try starts afresh. The guest's queue makes that try itself for a file that failed as a dropped connection
  (`use-upload-queue.heal.ts`, `hasKeptComplete`: 5, 20 and 60 s on, on the browser's `online` and when the page is
  looked at again, none while it says it is offline, three asks a File, through the queue's own runner so her Retry
  never races it, and her Retry re-queues only a file still failed, so a press on words the heal has overtaken sends
  nothing), so a row the server wrote is told as landed and the sheet that listed it lets it go; the host
  panel's rows (`host-upload.tsx`) read the same hook, and a row that said dropped reads "Added to the album".
  `complete` is never aborted by a cancel: a stop pressed once it is asked, or on a file going again on its kept
  complete, is ignored (the file lands as it would have). Nothing is counted for a
  cancelled file (the meter counts at complete); its R2 bytes, if any, are the orphan sweep's, a started multipart the
  bucket's abort rule's. ★ It is ONE SENTENCE everywhere: the downloads say it as a title and its detail
  (`WALK_COPY`), and the album's camera says this very string where it used to count ("2 shots didn’t send.") when a
  shot failed that way; `uploader.transport.test.ts` holds the three to one wording. ★ **The cause, never the words,
  says which it was:** the queue keeps the outcome's `cause` beside the message (`QueueItem.cause`: `dropped`, absent
  for a refusal, cleared by a Retry), and what draws a drop apart from a refusal reads it: the camera's line, and the
  failure sheet's row for a dropped connection (a signal mark before its sentence). A cancelled file is no failure and
  never stays in the guest queue (`stop`), so the sheet has nothing of it to draw.
- **The size is the R2 HEAD's** at complete, never the client's claim ([database-security.md](database-security.md));
  `duration_seconds`, `width` and `height` stay client-supplied and non-authoritative, the byte cap being the cost
  boundary, and so does `captured_at`, held to its bounds (the EXIF strip, below).
- ★ **No upload can exceed its declared size.** Presigned PUT and UploadPart URLs bind Content-Length (each part's
  exact size), so R2 rejects an over-stuffed body, AND complete sums the real parts (`ListParts`) and aborts rather than
  assembles over the ceiling. Without both, a small declaration and a few hundred over-stuffed parts complete into a
  multi-terabyte orphan the backup Worker would copy into the 35-day-locked bucket (`create_media`'s ceiling guards the
  row and the accounting, not the object's existence).
- ★ **The preview PUT is size-bound and capped too** (`previewRefusal`: at most `MAX_PREVIEW_BYTES`, 2 MB, and never
  heavier than its original; past either the preview alone is refused, in `preview_refused`, and the original still
  uploads): the preview is not metered, so an unbounded one at its server-built key would be cap evasion. Its bytes go
  uncounted, an accepted under-count.
- ★ **A photograph gets a phone-size copy, never metered, so capped twice:** a JPEG made in the browser after the
  preview (`generatePhoneCopy`, `media/preview-size.ts`), PUT size-bound at `events/<event>/photo/<id>/phone.jpg`
  (`phoneKeyFor`), recorded as `media.phone_key` with its HEAD size (`phone_bytes`) in the same `create_media*` insert.
  It fits only within 4 MB AND half its original's bytes (`phoneCopyFits`), checked at presign on the declared sizes,
  at complete on the HEAD's (a multipart original can land shorter than declared), in the RPC and by the row's own
  CHECKs: an uncapped copy beside a tiny original would be storage nobody pays for. A copy past either cap at complete
  is dropped and its object deleted, a missing one dropped, and the photograph lands without one; the ledger,
  `storage_used_bytes` and every cap read `file_size_bytes` alone. Videos have none, and a photograph may lack one: it
  then serves its original everywhere.
- ★ **A locked event gates UPLOADS, not just viewing.** The three guest seams (the `/api/guests` mint, presign and
  complete) each re-check `mayUploadPastLock(eventId)`: `private` refuses every guest write (the owner uploads through
  the host routes), and `password` needs the signed unlock cookie OR the host, by the page's own owner answer
  (`isRequestOwner`: the owner never meets the password modal, so a bare unlock check would block the host on their
  own event). Gating only the mint is not enough: a token minted while the event was open would upload forever, and
  locking is what a host does when a link leaks. The lock is checked before `accepting_uploads`, so someone who cannot
  see the album learns nothing else about it, and `create_guest` re-refuses from its own `p_unlock_proven`.
- **One ceiling per upload, 10 GB, by size only** (no duration cap; `media/limits.ts`), enforced in `create_media*` on
  the HEAD size. A host may set a stricter per-event cap (`events.max_upload_bytes`, 25 MiB to 10 GB, or none) that
  binds guests only, read inside the RPC, never from a parameter. The guest page never learns that number
  (`get_event_by_qr_token` does not return it), so the add sheet's terms line states the universal ceiling. Upload
  presigns live 2 hours, because a multipart upload presigns every part up front. ★ The browser refuses a file over the
  ceiling, and a type nobody takes, itself, before any request, and tags each with the code the server says for it
  (`too_large`, `unsupported_type`: `uploader.ts`'s `prepare`), so every reader of the outcome (the guest queue, the
  host's rows, the camera) meets the refusal ladder's "choose another", never a Retry that refuses the same file again.
- **A host upload is `guest_id is null`:** `create_media_as_host` authorizes by the route's `getUser()` id and event
  ownership, counts against the plan like any upload, lands `approved` (the host is the moderator) and ignores
  `accepting_uploads` (the guests' switch).
- **`create_media*` also seal a row and meet the guest camera's roll at insert** (the seal, the roll, its ceiling and
  the `sealed` answer are [disposable-mode.md](disposable-mode.md)'s): the presign refuses a shot first in the
  server's own words (`cameraShotRefusal`, from `get_upload_context`'s `roll`), the complete answers the race it loses
  with 409 `roll_spent`, and the host's own uploads meet no roll, though they seal with everyone's.

## The EXIF strip

Originals are served byte-for-byte (the viewer, Save, the zip), so a phone's GPS and device EXIF would leak a location.
The uploader strips identifying metadata at step 0, BEFORE any size is read, because the presigned PUT binds
Content-Length to the declared size and every later step must see the stripped bytes; guests and hosts pass the same
seam. The stripper (`media/strip-metadata.ts`, whose header carries the per-format rules) is pure and lossless, never
a pixel re-encode, and the browser and the Node backfill (`scripts/backfill-strip-exif.mjs`) share it rather than fork
it.
- **Every accepted format is stripped; only JPEG, PNG and WebP shrink.** The rest are blanked in place at their exact
  length, because offsets elsewhere in the file point at their bytes. Rendering data stays: orientation, the color
  profile, an HDR gain map and the XMP that describes it.
- ★ **The capture time stays, never the place or the device** (Will, 2026-10-05: "Yes, keep the capture time, never the
  place or device"). Each walk reads when the original says it was taken before it rewrites a byte (`captured`: a
  JPEG's or a HEIC's `DateTimeOriginal` with its `OffsetTimeOriginal`, a movie's QuickTime creation date else its
  header's, a WebM's `DateUTC`; a PNG's and a WebP's are never read), and the stored file keeps it, so a download and a
  Save into Photos land on the right day: the minimal Exif is the orientation, `ExifVersion` and `DateTimeOriginal`, its
  wall clock alone and only in the standard's shape (a free-text field never survives as a date; the zone is read for
  the instant and never kept, since some zones are one country's alone), and an MPF secondary keeps its orientation
  alone; every header clock of a movie (mvhd, tkhd, mdhd: creation and modification) is rewritten in place to the
  capture instant, or zero where it names none (`stampMovieClocks`; an iPhone's export stamps them with the moment it
  exported, measured on AVFoundation). The complete carries it
  as a claim (`captured_at`, never at presign), held on the server to 1990 and now plus a day (`media/capture-time.ts`,
  the bounds' one home: outside them, or malformed, it is none and the arrival stands, and it never refuses the file),
  into `media.captured_at` in `create_media*`'s own write. A wall clock with no zone rides the complete as
  `captured_wall` beside the browser's reading, and the GUEST complete reads it in the party's zone (`wallInPartyZone`:
  one primary-key read of `events.time_zone` a burst, only when such a clock is carried; the host's route keeps the
  browser's reading). The album's camera claims its shutter's time (`BurstFile.takenAt`, `FileExtra.takenAt`) where the
  file states none. The album's wire carries it (`entryCaptureTime`, a manifest entry's seventh element) and a Drive copy is named
  by it ([drive-export.md](drive-export.md)).
- **It fails open:** input it cannot walk end to end, or cannot rewrite without touching a byte something else points
  at, uploads untouched with `stripped: false` (the header lists the cases), because a corrupted upload is worse than
  the leak. `/privacy`'s metadata section and the help article on it describe this, so they change with it.

## R2 and presigns

- **Configured outside the repo, and load-bearing:** the bucket's CORS allows PUT, POST, GET and HEAD with
  `content-type` and `range`, and exposes `ETag` (multipart completion), `Content-Range` (the reel's byte-range reads),
  `Accept-Ranges` and `Content-Length`; `wrangler r2 bucket cors set` sets it (the R2 MCP cannot). A lifecycle rule
  aborts incomplete multipart uploads.
- ★ **R2's S3 endpoint speaks HTTP/1.1 only** (`curl --http2` negotiates 1.1), so every R2 read a page makes (tiles,
  the viewer's originals, a clip's ranges, the light's samples, a Save) shares about six connections to one host, CORS
  and no-cors alike. What loads first is a choice the viewer makes (below).
- **Any S3 client pointed at R2 sets `requestChecksumCalculation` and `responseChecksumValidation` to
  `WHEN_REQUIRED`:** the SDK's automatic CRC checksums make R2 write 0-byte objects or answer
  `SignatureDoesNotMatch`. The one client is `getR2()`'s (`r2/client.ts`).
- **Raw keys never reach the browser:** every read is presigned server-side (`toGridItems`; the paged album's
  `album-guest-links.ts` and `album-host-links.ts`), and the render routes are dynamic. A guest's own items the album
  cannot show her (held, or sealed for the develop) are presigned for her alone by her tracker's read
  (`/api/guests/mine`, as far as the ticket is hers), never a refused one's.
- ★ **Presigns are signed by hand, byte-identical to the SDK's** (`r2/sigv4.ts` behind `r2/presign.ts`): SigV4's
  query presign on Node's `crypto`, about a twelfth of `getSignedUrl`'s CPU (257 links in 2 ms, not 28), its derived
  key made once a day. `presign.test.ts` holds every URL equal to the SDK's over a corpus of keys, operations, types,
  lengths, expiries and clocks (the SDK's presigner is a dev dependency for it alone), so a change to what is signed
  is proved there first. It refuses what the SDK signed silently: an empty key (the SDK signs the bucket's root, a
  listing), an empty type, a length or part number that is no whole count, a bucket name R2 would not take.
- ★ **The S3 SDK loads on the first send, never on an import:** `@aws-sdk/client-s3` is about 50 ms of CPU a cold
  start, and a page that only reads (its links are signed by hand) never sends, so no file in `src/` imports it except
  as a type. Every send takes the client and the command classes from `const { client, sdk } = await getR2()`
  (`new sdk.HeadObjectCommand(...)`), so the guest page and every presign-only route load none of it, and the first
  send of an instance pays it once. `lazy-sdk.test.ts` holds that nothing imports it statically (a new
  `import { XCommand } from "@aws-sdk/client-s3"` puts it back on every cold start), that the guest page's module
  graph reaches none of it, and each send's command. A failed load throws from the send like any R2 error, and
  `headObject` keeps it outside its try so it never reads as an absent object.
- **Gallery read presigns are stable:** `presignDownload({ stable: true })` pins the signing date to the current
  30-minute bucket (`r2/presign-bucket.ts`), so two presigns of one key in a bucket are byte-identical: the image
  cache works across refetches and the gallery's ETag rolls with the bucket. They live 90 minutes (two buckets and
  slack), so a leaked gallery URL lives at most 90 minutes, an accepted trade. Upload presigns are never stable.
- **The paged album mints links by id, per window** (`/api/album/guest/media`, `/api/album/host/<id>/media`): at
  most 200 ids an ask, three links each (the tile, the inline original, the attachment), and an id that is not visible
  in that album comes back `missing`. Each answer carries its bucket (`b`, read before minting, so a roll mid-request
  only lengthens a link's life) and the server's clock (`now`), from which the client dates and re-mints each link on
  its own clock (`src/lib/album/links.ts`), so the album's validators never carry the bucket and an album left open
  stays on 304. The teaser's nine travel inline on the poll, so its validator is the one that still rolls with the
  bucket.
- ★ **A CORS read of a tile-shared presign bypasses the HTTP cache.** Plain `<img>` tiles fetch presigned URLs with no
  Origin, R2 answers without `Access-Control-Allow-Origin` (and without `Vary: Origin`), and the browser caches that
  under the SAME URL the stable scheme shares; a later `fetch(mode: "cors")` reads the poisoned entry and fails with a
  bare "Failed to fetch" and no console error. So every CORS reader of gallery presigns (the reel engine's loaders,
  the viewer's held originals, its Share and Save) fetches with `cache: "no-store"`, and so does any new one. R2's 403s
  carry no CORS headers either, so an EXPIRED presign read by a CORS fetch looks like a CORS failure.
- ★ **Every purge deletes all three stored copies** (`MEDIA_KEY_COLUMNS`, `mediaKeysOf`): the sweeps, account deletion,
  the bin's Delete permanently (the copies read on the admin client for the rows her own read proved hers: no client
  role holds `phone_key`) and the demo seed's held keys. `r2/stored-copies-policy.test.ts` refuses a purge that can
  forget one and a reader of `preview_key` that never names the third (display readers listed with why), in TS and
  SQL; a copy reads from its key alone (`isDerivedCopyKey`, `DERIVED_COPY_RE`), so a filter that keeps originals only
  needs no row.

## Rendering media

- ★ **An uploader's email reaches the host's gallery only.** Attribution resolves in one admin read
  (`getUploaderIdentities`: `profiles` RLS is own-row-only and the guest identity columns sit outside the host's
  grant). The host gallery's items carry the email; every guest-facing item is built by `toGridItems`, which names only
  the name, `isHost` and `isVerified`, never an email or `pending_email`, by construction rather than a viewer flag. The
  paged album attributes only the ids a window asks for (`readAlbumAttribution`), and its guest path never selects
  `guests.email`. `grid-items.email-safety.test.ts` guards both.
- **Credit follows the identity** (`resolveUploaderIdentity`): no `guest_id` is the Host (the host's name, no email);
  a verified guest shows their profile's name (and, to the host, `guests.email`); an unverified typed name shows with
  the unverified mark and never an address; a row with no name shows no credit rather than an invented stand-in.
  Attribution lives in the viewer.
- ★ **Its face goes through `uploader-faces.ts`** (`faceOwner`, drawn server-side), whose header holds the consent
  line ([profiles-social.md](profiles-social.md)): a face only where the album already shows one, a door only to a
  published page (`/u/<slug>`), and on a guest's view none for a person the event blocked. A typed name's face is her
  own guest row's colour alone (`faceOwner: { kind: "row" }`: no read, no photograph, no door). Faces fail open to the
  plain disc, ride the link's who tuple and re-mint with the link whenever the album's attribution version moves (a
  name, `avatar_updated_at` or `slug`, through the `profiles_album_note` trigger); the teaser and the personal feeds
  carry none, but for the owner's own uploads in her Uploads (`ownUploadCredit`).
- **Tile previews are made in the browser at upload** (a WebP: a resize for photos, a frame-grab for videos) and PUT
  as the reserved `preview` variant, beside a photograph's phone copy (above): $0 and predictable, with no transform
  fee to meter against a storage-billed plan. Tiles serve `previewUrl ?? url`; the viewer draws the original, and Save
  and Share send it (below); a row with no preview serves the original, which the viewer then draws from the tile's
  cached copy rather than holding it twice. A HEIC sent from a browser that cannot decode it (desktop Chrome) has no
  preview, and wherever its original cannot draw either, its tile names it (`MediaTile`'s stand-in, its format from
  the key: "Can't show here", HEIC), never a shimmer for ever.
- **`videoPosterSrc()` appends `#t=0.1`:** iOS Safari paints a paused `<video>` black unless the src asks it to seek
  and render a frame (a video tile draws its preview, and the poster `<video>` only without one). Grid video tiles
  carry no controls, since a `<video controls>` inside the tile's `<button>` is invalid HTML; playback is the viewer's.
- **The viewer (`media-lightbox.tsx`) is the one every gallery surface uses;** its gestures and their reasons live in
  its header, so a new surface reuses it rather than forks it.
- **Save is a signed download:** `presignDownload({ key, downloadFilename })` bakes `response-content-disposition`
  into the signature, because a `download` attribute is ignored across origins; a top-level `<a href>` needs no bucket
  CORS.
- ★ **The viewer holds the original it draws, and Save and Share send those bytes** (`lib/media/share-save-held.ts`):
  a photograph with a preview has its original read once (CORS, `no-store`) and drawn from an object URL, and a tap
  hands that file to `navigator.share` with no await before it, since WebKit opens a share sheet only within about
  5 s of the tap. The photograph on screen loads first and its neighbours after it, and a neighbouring clip asks for
  nothing until the centre is held, since iOS reads a neighbour's `metadata` as the whole clip. A clip, and anything
  it cannot hold (a large or stalled original, a refused read), is drawn and saved the plain way, and two refused
  reads before any success (an origin R2's CORS does not list, localhost among them) turn holding off for the page.
- ★ **No guest byte is billed by Vercel** (`media-cost-policy.test.ts`): no remote pattern, domain or loader for the
  image optimizer, no `next/image` fed a link or beside a presigner, and no `GetObjectCommand` in `src/`: a read is a
  URL signed in `r2/sigv4.ts`, which holds no client and sends nothing.

## Taking photos home

A guest takes photos home by Select, then Save. The selection is `live-gallery-select.ts`, the store the album and the
action dock share; the dock names her set as the album does (`setNoun`) through `guest-action-dock-kinds.ts`, a page
store the album writes from inside its live source, because the dock stands outside that source.
- **On a phone her Save asks one choice, each way with its size** (`live-gallery-save.tsx`): Save to Photos, at phone
  size through the phone's own sheet, or Save to Files, the originals as one zip (both sized by the server's `summary`
  of her `ids`), so Files reads as the full-quality path. A desk, or a phone whose sheet takes no file, gets the
  originals' zip and no question.
- **Photos goes through one engine** (`take-home-save.ts`, the host's Phone size on a phone too; its rules and words
  are `lib/export/take-home.ts`): the links are minted only when she saves (`step: "save"`), all or none, so past
  2,000 the originals' zip takes them all rather than a partial Save; the files arrive `no-store` into sheets of at
  most 100 MB, and a sheet the tap's activation has outlived waits, files in hand, for the next press.
- **A host's Download offers two sets** (`take-home-panel.tsx`): Originals, one zip, and Phone size, the photographs'
  phone copies (a zip at a desk, a Save into Photos on a phone that can); clips come as taken, with the originals.
  Every `summary` bucket says both sizes (`phone`), and a mint takes `size` (a phone-size zip of the copies, measured
  by their bytes).

### Download all

The zips go off Vercel, on the streaming export Worker (`partyreel-export`, on `*.workers.dev`).
- **The app is the one authorization oracle.** The mint route (`/api/export/host`: `getUser()` and ownership;
  `/api/export/guest`: the token, `resolveViewerDecision` and `loadGalleryRowsForAccess`, so a guest never exceeds
  what the gallery shows) builds the manifest and HMAC-signs it into an opaque token; the Worker authorizes nothing,
  checks the signature, expiry and key layout (`EXPORT_SIGNING_SECRET` equals the Worker's), and streams a zip of the
  R2 objects straight back, so no byte touches Vercel. The browser form-POSTs the token at the top level: no gesture
  needed after the awaited mint, and no navigation (a cross-origin iframe download is a tightening browser
  restriction).
- **The page goes blind at that POST, so the walk asks the Worker first** (`components/app/export/export-walk.ts`,
  whose header holds the walk): `POST /check` (the token as `text/plain`, CORS `*`, no credential) answers
  `{ items, found, missing }` by `head` or a folder's `list`, never a byte read, so an empty zip is never sent, a short
  one is counted with a Try again for exactly its missing ids (`ids`, intersected server-side), and a token the Worker
  would refuse is said rather than replacing the page. A check that ANSWERS an error (R2 down) never stops the zip,
  but one that never reached the Worker (the fetch rejected, or hung past its ceilings) is a dropped connection and
  never posts: the form goes to that same host, and a POST into a dead line is a failed main-frame navigation, which
  replaced the page with the browser's own error page (album, selection and toast gone, the drop never said). The
  last try decides, as the mint's does, and the walk never posts while the browser itself says it is offline (the
  question may have stood a while). The older Worker this once fell through for (no `/check`) cannot meet an app that
  names one: the Worker deploys before any app that relies on what is new.
- ★ **After the POST the Worker reports, and SAVED is its word, never the page's guess,** because a host who reads
  "saved" may delete the album. The mint signs the minting deployment's own `/api/export/report` into the token
  (`report`) wherever the Worker can reach it (`lib/export/report.ts`'s `reportAddressFor`: never a laptop behind the
  deployed Worker); the Worker reports the check's count, the stream's start and its end (saved, short, stopped,
  failed, empty, with the ids its zip lacks), each a POST signed with the export secret in a `report:` domain no token
  can share, fresh within five minutes. The app keeps each on the mint's `export_log` row by its nonce (`jti`,
  unique), filling only empty fields, and the walk polls `/api/export/status` only where the mint asked and the check
  promised (`reports: true`): a zip reads saved once its last byte left the Worker, the walk's last word waits for
  every part, and where the word cannot come the walk says what it knows and claims nothing.
- **The window between the check and the stream is closed in the Worker** (`workers/export/src/stream.ts`): for a
  token that asks for reports it finds the zip's first object before it answers, and none at all is a `204` (a
  top-level form POST stays on the page, no file) reported `empty`; an object gone mid-stream is skipped and named.
  The reported zip is pushed into a pass-through the response reads, because a client that leaves shows only as a
  failed write: workerd cancels no pulled response body and, under `wrangler dev`, aborts no `request.signal`.
- ★ **A cancel asks first and a dropped connection names itself** (E6; the words are `WALK_COPY`,
  `lib/export/walk.ts`). The toast's x, while a part is prepared or between parts, becomes one question ("Cancel this
  download?", "Stop after part 1 of 3?" with what it leaves) and nothing is posted while it stands; a confirmed cancel
  says so, neutral and never an error, with Try again (past part 1 it stops where she stood with Get part N, and is not
  offered again after a reload). A mint that never reached the app says "Your connection dropped." and what to do (an
  app that answered an error keeps "Couldn't start that download."). While the browser says it is offline the toast
  withholds its Try again (a refusal's or a short zip's) and says "Waiting for your connection…" in its detail's place,
  then shows it again when `online` fires or the tab is looked at again (`exportToasts`, so the walk's and the Save's
  alike): a press could only fail the same way. The Worker's `stopped` cannot tell her cancel in
  the browser's own list from a dead line, so the page reads its own: a zip streamed while its status polls failed (a
  rejected request, or two stalls) is a drop, one streamed with every poll answered is a cancel, and a walk from an
  older build that recorded neither says "didn't finish". Three polls in a row that fail are said under "Downloading…"
  and clear when one answers; a line still down keeps those words, and the walk keeps listening (its silence past the
  stream's start means the Worker's word cannot reach the app only while her own line is up), so a drop is never
  replaced by "starting". The take-home Save follows the same two rules (`take-home-save.ts`: `cancel()` asks and
  is the guest's foot control, `stop()` is the page leaving and says nothing). ★ **Uploads say it alike**
  (`lib/upload/stop-upload.ts`, the words and the question): "Stop this upload?" (Keep going first), then "Upload
  cancelled." with Try again for `DONE_MS.cancelled`, on the same toast port for the guest's tile and in the row for
  the host's; a stop too late to take says nothing.
- ★ **Past one zip's ceilings (2,000 items or 20 GB) an album comes home in parts**, oldest first: each mint
  (`part`, `after`) takes the next part from a position cursor, never a page index, so nothing is skipped or taken
  twice while the album moves, and each part is its own tap (a browser holds back a second download a page starts
  alone; a token lives two minutes). A request without `part` past the ceilings is a 413, so a stale tab never takes
  part 1 for the whole album. A walk between parts survives a reload (a phone's browser drops a tab it left for the
  Files app): its cursor and counts wait in the tab's sessionStorage (`pr-export-walks`, read back only if every field
  is one a server would take), and the next page that can start a download offers the same "Get part N" again;
  nothing is posted on a resume.
- ★ **Yours is the server's** (`lib/export/yours.server.ts`): a guest's own uploads by her account and this
  browser's ticket cookie as far as the ticket is hers ([guest-flow.md](guest-flow.md)'s owner rule), never an id list
  from the request, intersected with what she can see, plus her own shots still sealed for the develop
  (`readOwnSealedMedia`, of those ids alone, never the album's zip); the closed door is asked first on every path
  (Yours, a retry, a part).
- ★ **One Worker deployment serves every app's build** (the alias and partyreel.com, whatever each runs), so a request
  an older app sends gets the answer the Worker it was built against gave: everything new is opt-in by the token, the
  Worker deploys before an app that relies on what is new, `workers/export/src/compat.test.ts` replays older apps'
  requests at the Workers they shipped with (vendored beside it), and the entry module exports its handler alone
  (workerd refuses to start on any other named export).
- **A STORE-method zip, streamed, from a proven library (`client-zip`).** Media is already compressed, so deflate would
  burn Worker CPU for nothing; streaming ZIP64 fails silently in specific extractors (offsets, data descriptors, CRC),
  so a hand-rolled encoder is out; streaming keeps zero temp storage (the storage-billed margin) and needs no job table.
  A token is not single-use: a 2-minute TTL, where a replay only re-downloads what was already authorized, is the
  accepted bound.
- **Its health is on `/admin/exports`:** the per-export `export_log` (one row a part, its outcome the furthest anyone
  saw: the mint's refusal, or the Worker's word on its check and stream), the `export_enabled` kill switch, the
  Worker's daily heartbeat (the `export` job: the Worker reads the bucket and signs a ping to `HEARTBEAT_URLS`) and the
  downloads' signal (`export_delivery`). The Worker also logs what it saw (`export-check`, `export-stream`,
  `export-report`).

### Send to Google Drive

The Originals card's second way home (and Your events' and What's using space's): the same set as her Originals zip,
`chosenRows` over what she can read, sent into her own Google Drive. The system is [drive-export.md](drive-export.md);
what it means for R2:
- ★ **No presigned URL and no byte through Vercel.** The `partyreel-drive` Worker reads originals through its own
  read-only binding to the primary bucket, by the keys the app hands it in a signed lease; the app never reads media
  bytes (`media-cost-policy.test.ts` holds), and a key never reaches a browser.
- **One GET an original, a second only to check a clip:** each lands verified against R2's own MD5
  (`checksums.md5`), and an object R2 kept none for (a multipart clip) is hashed by a second, verification-only read.
  A send reads the phone copy and the preview never.
- An original gone from R2 mid-send is skipped and named on the send (never retried for ever), and an album item
  removed after the press is skipped at its lease.
