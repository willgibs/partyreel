# Uploads, R2 & media rendering (the media system)

> ROLE: media bytes end to end — upload in (guest + host) → store in R2 → render out (grid / lightbox / download).
> BELONGS HERE: presign/complete routes, the shared uploader, the `create_media*` write path, R2 client config, keys, bulk delete, galleries, the lightbox, downloads, the video poster. · NOT HERE: cap/ingress *enforcement* (→ [billing-caps.md](billing-caps.md)), the purge/reclaim cron (→ [lifecycle-recovery.md](lifecycle-recovery.md)), durability/backup (→ [durability-backups.md](durability-backups.md)).
> GROWS BY: integrate-in-place.

## What it does

Browser → R2 **direct** upload (single PUT < 100 MB, else multipart) via presign + complete routes; a
SECURITY DEFINER RPC writes the `media` row + ledger and enforces caps; the same media renders in a shared
grid + lightbox, presigned server-side. Two upload identities share one pipeline: **guests** (the
session-token capability) and authenticated **hosts** (a photographer's batch). The lightbox carries a
subtle uploader caption; the uploader's **email shows on the HOST gallery only**.

**Tile previews (client-generated).** At upload the BROWSER makes a ~640px **WebP** preview (photos by a
`createImageBitmap` resize, videos by a canvas frame-grab ~0.1s into the local file) and PUTs it as the
reserved `preview` R2 variant (a 2nd presigned PUT); `create_media` records `media.preview_key`.
**Generation is $0 and predictable** (no Cloudflare transform fee: the fit for a storage-billed model).
TILES serve `previewUrl ?? url` (an `onError`→original fallback self-heals any gap); the **lightbox + Save
keep the full-res original**. Best-effort: an undecodable codec, a huge image or an old browser yields no
preview, and a row without one serves the original. The generator + the pure sizing math:
[`upload/preview.ts`](../../src/lib/upload/preview.ts) and [`media/preview-size.ts`](../../src/lib/media/preview-size.ts).

**Metadata strip (client-side).** Originals are served byte-for-byte (lightbox, Save, zip export), so a
phone's GPS + device EXIF would leak a location. `uploadFile()` step 0 strips identifying metadata BEFORE
any size is read (the presigned PUT binds Content-Length to the declared size, so every later step must
see the stripped bytes), for guest AND host uploads at the one shared seam. The stripper
([`media/strip-metadata.ts`](../../src/lib/media/strip-metadata.ts)) is pure, dependency-free,
runtime-agnostic and **lossless — byte-level excision, never a pixel re-encode**: JPEG drops
Exif/XMP/IPTC/COM, keeps JFIF + ICC + Adobe APP14 (color-load-bearing) and **rebuilds a minimal one-tag Exif
so Orientation survives**; a kept MPF index (iPhone HDR gain maps) gets its **individual-image
offsets/sizes rewritten** for the shrunk file (an unfixable one fails the strip open rather than ship a
corrupt HDR); PNG drops eXIf/tEXt/zTXt/iTXt; WebP drops EXIF/XMP chunks and clears the VP8X flag bits.
MP4/MOV, and a **motion-photo MP4 after a JPEG's EOI**, **never restructure** (chunk-offset tables):
udta/meta/xml/XMP-uuid boxes are renamed `free` and zeroed in place via lazy File slices, so multi-GB
videos never fully load. **Fail-open contract:** unparseable or exotic input (HEIC/HEIF/AVIF, where
blanking the item-based meta destroys the image, and WebM) uploads UNTOUCHED with `stripped:false`, and the
Exif INSIDE a JPEG's post-EOI MPF secondary images survives (excising it would shift the trailer the MPF
index points into): a corrupted upload is worse than the leak, so that window is a conscious trade-off,
and `hasGpsMetadata` scans trailers so the backfill report flags it as clean-but-GPS. The server never
sees the EXIF, so any forensic EXIF capture must extract client-side, before the strip. Pre-strip objects
are swept by the one-off [`scripts/backfill-strip-exif.mjs`](../../scripts/backfill-strip-exif.mjs)
(dry-run by default; `--live` re-PUTs stripped bytes under the same key and decrements
`media.file_size_bytes`, `profiles.storage_used_bytes` and the upload-month `storage_ledger` row to keep
the cap meters honest).

**Download all (the zip export).** Per-item Save streams ONE original (a `presignDownload` attachment
URL); **"Download all"** zips a whole album OFF Vercel, on the **streaming export Worker**
(`partyreel-export`, served from `*.workers.dev`). The browser hits a Next **mint route** (host
[`/api/export/host`](../../src/app/api/export/host), guest [`/api/export/guest`](../../src/app/api/export/guest))
that AUTHORIZES (host: `getUser` + own-event; guest: qr-resolve + `resolveViewerDecision` +
`loadGalleryRowsForAccess`, so a guest can NEVER exceed `gallery.rows`), builds the manifest and
**HMAC-signs** `{v,jti,scope,eventId,zipName,items:[{key,name}],exp}` into an opaque token (the app is the
SINGLE authz oracle; the service runs kill-switch → abuse-limiter → manifest+cap → sign → log). The
browser **top-level form-POSTs** it to the Worker, which verifies signature + expiry + per-key layout (ONE
shared token FORMAT, re-verified in Web Crypto) and **streams a STORE-method zip** of the R2 objects
straight back (`client-zip`; bytes never touch Vercel). A top-level POST needs no gesture (it survives the
awaited mint) and downloads without navigating; cross-origin **iframe** downloads are a tightening browser
restriction. The config modal offers type chips (Everything/Photos/Videos, live counts from a
`step:"summary"` call), a host-only "Include hidden" toggle and the total size/count as the result; it
opens from the host Gallery header and the guest album (hidden in demo and on a locked gallery), while the
bulk "Download selected" goes direct, with no modal. Cost: ~$0 marginal (R2 egress is free; store-zip CPU
is just CRC32). Caps: ≤2000
items / ~20 GB per export; per-export rows in `export_log` and the `export_enabled` kill-switch surface at
[`/admin/exports`](../../src/app/admin/exports).

## Where it lives

- R2 client + presign: [`r2/client.ts`](../../src/lib/r2/client.ts), [`r2/presign.ts`](../../src/lib/r2/presign.ts)
  (incl. `presignDownload`, `headObjectSize`). Keys: [`r2/keys.ts`](../../src/lib/r2/keys.ts) (`mediaObjectKey`,
  `parseMediaIdFromKey`, `parseExtFromKey` — single source). Bulk: [`r2/delete.ts`](../../src/lib/r2/delete.ts).
- Routes: guest [`/api/r2/presign-upload`](../../src/app/api/r2) + `/complete-upload`; host
  [`/api/host/r2/`](../../src/app/api/host/r2) `presign-upload` + `complete-upload`: all four are THIN strategy
  adapters over the ONE pipeline engine [`upload/server-pipeline.ts`](../../src/lib/upload/server-pipeline.ts),
  which owns the shared spine (parse → zod → server-side classify/ext → `validateUpload` → key build →
  single/multipart presign; complete: multipart sum/abort guard → assemble → R2-HEAD → create RPC →
  forensic capture, one deny-all `upload_forensics` row per success, best-effort-but-loud →
  [trust-safety-forensics.md](trust-safety-forensics.md)) while the strategies own the per-identity gates +
  status mapping. Part-size math is single-sourced in [`upload/part-plan.ts`](../../src/lib/upload/part-plan.ts). The response
  JSON shapes/key order are the `uploadFile()` contract, byte-for-byte frozen. The guest/host asymmetries
  are DELIBERATE (don't "finish" the consolidation): auth placement (host `getUser()` gates in the route
  BEFORE the engine, the 401-before-body-parse ordering duplicated verbatim in both host routes; guest
  tokens validate inside the RPCs, and a token whose row carries an account uploads only for that signed-in
  account, the strategies' `checkSessionOwner` at presign AND complete → [guest-flow.md](guest-flow.md));
  the per-event `max_upload_bytes` cap binds GUESTS ONLY; refusal framing
  (the guest failure sheet prints each refused file's sentence VERBATIM, so its precision is user-facing
  copy; guest video refusals are EVENT-framed so a guest never learns the host's plan; host refusals are
  tier-framed; host `not_owner` → 404, an existence non-leak); per-pair `errorStatus` maps; NO request rate
  limiter on any of the four (abuse control = capability session + caps + per-part Content-Length binding +
  the multipart abort backstop).
- Shared uploader: [`upload/uploader.ts`](../../src/lib/upload/uploader.ts) (`uploadFile`). Metadata strip:
  [`media/strip-metadata.ts`](../../src/lib/media/strip-metadata.ts) (pure; browser seam + the Node backfill
  [`scripts/backfill-strip-exif.mjs`](../../scripts/backfill-strip-exif.mjs) share it — never fork the logic).
- Media constants: [`media/limits.ts`](../../src/lib/media/limits.ts) (10 GB per upload, size-only — single source; `MIN_UPLOAD_CAP_BYTES` + `UPLOAD_CAP_PRESETS` feed the host cap),
  [`media/poster.ts`](../../src/lib/media/poster.ts) (`videoPosterSrc`), [`media/download-filename.ts`](../../src/lib/media/download-filename.ts).
- Render: [`media-grid.tsx`](../../src/components/app/media-grid.tsx) (`MediaTile`, `GridMedia`) laid out by
  the shared [`masonry.tsx`](../../src/components/shared/masonry.tsx), and the shared
  [`media-lightbox.tsx`](../../src/components/shared/media-lightbox.tsx); every gallery surface uses them.
  Host add-photos: [`event-gallery.tsx`](../../src/components/app/event-feed/event-gallery.tsx) → [`host-upload.tsx`](../../src/components/app/host-upload.tsx).
- Uploader attribution: the pure CASE helper [`media/uploader-identity.ts`](../../src/lib/media/uploader-identity.ts)
  (`resolveUploaderIdentity`) + the admin-read resolver `getUploaderIdentities(eventId)` in
  [`guest-events-admin.ts`](../../src/lib/db/queries/guest-events-admin.ts); the caption is `media-lightbox.tsx`'s
  `AttributionPill`, with [`unverified-mark.tsx`](../../src/components/shared/unverified-mark.tsx) (a tap-to-open
  popover on [`ui/popover.tsx`](../../src/components/ui/popover.tsx)) beside a typed name;
  [`anonymous-info.tsx`](../../src/components/shared/anonymous-info.tsx) is residue only the Library mounts.
- Env: R2 vars stay `.optional()` in [`env.ts`](../../src/lib/env.ts); `assertR2Env()` asserts them lazily at request time.
- Export ("Download all"): the Worker [`workers/export/`](../../workers/export) (separate `wrangler` deploy,
  native R2 `PRIMARY` binding, `EXPORT_MODE` kill-switch var, `client-zip`); the shared service
  [`export/export-service.ts`](../../src/lib/export/export-service.ts), the pure token + manifest cores
  [`export/export-token.ts`](../../src/lib/export/export-token.ts) + [`export/build-manifest.ts`](../../src/lib/export/build-manifest.ts)
  under [`src/lib/export/`](../../src/lib/export), the mint routes under [`src/app/api/export/`](../../src/app/api/export);
  the UI [`src/components/app/export/`](../../src/components/app/export) (the modal
  [`app/export/export-dialog.tsx`](../../src/components/app/export/export-dialog.tsx) + `useExportDownload`); the
  admin readout [`src/app/admin/exports/`](../../src/app/admin/exports). Env: `EXPORT_SIGNING_SECRET` (must
  equal the Worker's secret) + `EXPORT_WORKER_URL`, both `.optional()` + `assertExportEnv()`.

## Invariants (don't break)

- **The R2 client checksum config is load-bearing.** The AWS SDK auto-injects CRC checksums R2 rejects →
  silent **0-byte / `SignatureDoesNotMatch`**. The client sets `requestChecksumCalculation: "WHEN_REQUIRED"`
  and `responseChecksumValidation: "WHEN_REQUIRED"`; the single-PUT presign signs
  `signableHeaders: new Set(["content-type", "content-length"])`, an UploadPart presign
  `new Set(["content-length"])`. Bucket **CORS must allow PUT/POST/GET/HEAD + `content-type` and `range`,
  and EXPOSE `ETag`, `Content-Range`, `Accept-Ranges` and `Content-Length`** (multipart completion needs
  `ETag`; a byte-range read by CORS fetch, the reel engine's video window reader, needs `Content-Range`,
  which a CORS response otherwise hides); it is set with `wrangler r2 bucket cors set` (the R2 API's
  `rules` shape; the R2 MCP cannot set CORS). A lifecycle rule aborts incomplete multipart uploads. Don't
  remove any of it.
- ★ **A CORS consumer of a tile-shared presign must bypass the HTTP cache.** Plain `<img>` tiles fetch
  presigned URLs with no Origin header, and R2 answers without `Access-Control-Allow-Origin` (and no
  `Vary: Origin`), so the browser caches that ACAO-less response under the SAME URL the stable-bucket
  scheme deliberately shares. A later `fetch(mode: "cors")` of that URL reads the poisoned entry and fails
  with a bare "Failed to fetch", nulling every clip with zero console errors. The reel engine's asset loader
  ([`engine/assets.ts`](../../src/lib/reel/engine/assets.ts)) and its video
  [`window-reader.ts`](../../src/lib/reel/engine/video/window-reader.ts) fetch with `cache: "no-store"`: keep
  it, and give any NEW CORS consumer of gallery presigns the same treatment. R2 403s omit CORS headers too,
  so an EXPIRED presign probed via CORS fetch masquerades as a CORS failure.
- **Never expose raw R2 keys/URLs to the browser** — presign server-side via the shared `toGridItems`; the
  render routes are `force-dynamic`. **Gallery read presigns are STABLE:** `presignDownload({ stable: true })`
  pins the SigV4 signing date to the current 30-min bucket ([`r2/presign-bucket.ts`](../../src/lib/r2/presign-bucket.ts)),
  so two presigns of one key in a bucket are byte-identical: the browser image cache works across refetches
  and the gallery ETag rolls with the bucket. TTL is 90 min (2× bucket + slack; a URL minted at minute 29
  still outlives the next full bucket). Trade-off, accepted: a leaked gallery read URL lives ≤90 min (a
  non-stable read presign, 60). Upload PUT/part presigns are NEVER stable (one-shot; freshness is the point).
- ★ **Uploader email is HOST-gallery-only — guest surfaces NEVER carry it.** Attribution is resolved by ONE
  admin-read (`getUploaderIdentities`); the host gallery's items carry the `email`, but every guest-facing
  item is built by `toGridItems`, which names ONLY the name and `isHost`/`isVerified` and NEVER the email
  (nor `pending_email`). Email-safe by construction (not a runtime viewer flag), guarded
  by a standing source test (`grid-items.email-safety.test.ts`), so the guest SSR and
  `/api/guests/gallery` payloads carry no email field.
- ★ **A locked event gates UPLOADS, not just viewing.** All THREE guest seams (the `/api/guests` mint,
  presign, complete) re-check the lock via the shared `mayUploadPastLock(eventId)`
  (`src/lib/events/upload-lock.ts`): `private` refuses every guest write (owner uploads ride the HOST
  routes); `password` requires the signed HttpOnly unlock cookie **or** verified event ownership. The owner
  exemption is load-bearing: the owner reads their own album without ever seeing the password modal, so a
  bare `isUnlocked()` check would block the host uploading to their own locked event. Gating only the MINT
  is not enough: a token minted while the event was open would upload forever, and locking is exactly what
  a host does when a link leaks, so the per-request presign/complete checks are what kill it. The lock is
  checked BEFORE `accepting_uploads` (someone who cannot see the album learns nothing else about it), and
  `create_guest` re-refuses both cases from its own `p_unlock_proven` param (the DB cannot read cookies, so
  the server derives the proof) as a belt against a future second caller.
- ★ **The complete seam pins the key to what presign minted — the key IS the issuance record.** Presign
  builds `events/<eventId>/<kind>/<mediaId>/<variant>.<ext>` server-side from THAT request's
  `content_type`, so requiring the completion's echoed `content_type` to re-derive the same `<kind>` and
  `<ext>`, plus `<variant>` = `original` (and the preview key's = `preview`), transitively pins
  complete-time `content_type` to presign-time `content_type` with **zero stored state**: no presign
  issuance table is needed (`checkCompleteKeyConsistency`, `src/lib/upload/complete-key-check.ts`).
  Without the variant pin, completing with the ~2 MB preview as `key` meters the preview as
  `file_size_bytes` while the up-to-10 GB original sits uncounted; without the kind pin, video bytes
  complete as a `photo` row and dodge the free-tier photos-only gate. Refuse, never repair.
- **`create_media*` is the ONLY write path into `media`.** A host CANNOT RLS-insert directly even though
  `media_host_all` would allow the row: that bypasses the ledger + `storage_used_bytes` accounting + the
  cap check (unmetered free storage). The RPC also **re-checks the event prefix of both keys**
  (`events/<event_id>/%`, refused as `bad_key` otherwise), so a valid session can never record a row
  against another event's namespace (the DB-side twin of the complete seam's key pin), nor a host plant a
  victim's preview key and destroy that object from their own bin.
- **Host upload = `guest_id IS NULL`.** `create_media_as_host` is the host twin of `create_media`: auth via
  the route's `getUser()` id (`p_host_id`, server-derived, never a token) + event ownership, the same
  per-file limits + cap/ingress enforcement (host uploads **count against the plan**), `status='approved'`
  unconditionally (the host is the moderator). No `accepting_uploads` check for the host (that toggle is
  the GUEST gate). → [billing-caps.md](billing-caps.md).
- **One 10 GB per-upload ceiling, size-only** (photos + videos; no duration cap), enforced in `create_media*`
  on the authoritative R2-HEAD size. A host may set a STRICTER per-event cap (`events.max_upload_bytes`,
  25 MiB to 10 GB, or null = no cap) that bounds **guest** uploads only; `create_media_as_host` is exempt.
  The cap is read from the event row INSIDE the RPC (never a client/RPC param, so un-spoofable); the guest
  presign route fast-fails over-cap claims, but `create_media` is authoritative. ⚠ **The guest page never
  LEARNS that number** (`get_event_by_qr_token` does not return `max_upload_bytes`), so the add sheet's
  terms line ([`upload-terms.ts`](../../src/components/guest/upload/upload-terms.ts)) states the UNIVERSAL
  10 GB ceiling, true for every event and never over-promising; its `capBytes` argument is the wired,
  contract-tested seam for the host's own number. Upload presign TTL is **2 h**: a multipart upload
  presigns all its parts up front, so the whole transfer must finish before they expire.
- ★ **No upload can exceed its declared (≤10 GB) size — protects the pipeline + WORM backup from a megafile.**
  Presigned PUT/UploadPart URLs **bind Content-Length** (`presignUpload`/`presignUploadPart` sign each part's
  EXACT size), so R2 rejects (403) any over-stuffed body; AND the complete routes **sum the real part sizes
  (`sumMultipartParts` → `ListParts`) and `abortMultipartUpload` instead of assembling** when the total exceeds
  the ceiling. Without BOTH, an attacker could declare small, get ~640 part URLs, over-stuff each, and complete
  into a multi-TB **orphan** the backup Worker would replicate into the 35-day-locked bucket (`create_media`'s
  ceiling guards the DB/accounting, NOT the R2 object's existence). Don't drop either guard.
- ★ **The preview PUT is size-bound + capped too** (same class of guard). The preview is NOT counted toward
  `file_size_bytes` (it's a small derivative), so an unbounded preview PUT to its server-built key would be a
  cap-EVASION / cost-abuse vector. The client declares the generated preview's size at presign; the engine
  binds Content-Length (reusing `presignUpload`) and SKIPS the preview presign over `MAX_PREVIEW_BYTES`
  (2 MB), so the original still uploads and a preview can never store an arbitrary-large object. The
  preview's bytes go uncounted (an accepted under-count; the purge + backup still handle the object since
  it's under `events/`).

## Gotchas (why it's like this — don't revert)

- **Upload size-spoof is closed by an R2 HEAD at complete + a server-only RPC.** The complete routes
  re-derive the real `file_size_bytes` from `headObjectSize` and pass THAT to the RPC, never the client's
  claim (a PUT-big-claim-tiny upload would beat the cap). The HEAD size is authoritative because
  `create_media` / `create_media_as_host` are **service-role-only**, so the complete-upload route is their
  ONLY caller and nobody can call them directly with a spoofed size (the `media.file_size_bytes`
  `[0, 10 GiB]` CHECK is the floor). `duration_seconds` / `width` / `height` stay client-supplied +
  NON-authoritative (the byte cap is the cost boundary).
- **The export zip is STORE-method, streamed synchronously, from a proven lib.** Photos and videos are
  already compressed, so deflate would burn Worker CPU for ~0% gain. Streaming ZIP64 has silent
  correctness failure modes (central-directory offsets, data descriptors, CRC32) that surface only in
  specific extractors, so never hand-roll a zip encoder: `client-zip` earns its place despite the
  project's dependency-free leaning (2.6 kB, isolated in the Worker package; the app never sees it).
  Streaming rather than building a zip into R2 keeps **zero temp storage** (the storage-billed margin) and
  needs no job table; the browser's own download dialog is the progress UX. Tokens are not single-use: a
  2-minute TTL, plus a replay only re-downloading already-authorized content, is the accepted bound.
- **`uploadFile()` is shared, don't fork it.** The caller passes the endpoint pair + an `identity` object
  (`{ session_token }` guest / `{ event_id }` host) merged into both request bodies; presign/complete
  response shapes are identical. `HostUpload` is a SEPARATE component (no join/demo/email/`sessionRef`
  baggage) that reuses `FileDropzone` + `uploadFile`, and calls `router.refresh()` ONCE after the batch
  drains (route handlers don't `revalidatePath` like the moderation server actions do).
- **Cross-origin download needs a SIGNED `ResponseContentDisposition`, not `<a download>`.** The `download`
  attribute is IGNORED for cross-origin URLs (R2 is a different origin), so `presignDownload({ key,
  downloadFilename })` bakes `response-content-disposition=attachment; filename="…"` INTO the signature.
  Save is a plain top-level `<a href>` navigation, so **no bucket-CORS change is needed**. Every item's
  attachment presign is minted up front beside its inline (and preview) presigns, accepted: presign is
  local HMAC, no network. `download-filename.ts` slugs the filename to ASCII (header-safe, no RFC-5987
  encoding).
- **`videoPosterSrc()` appends `#t=0.1` — load-bearing, don't drop it.** iOS Safari paints a `<video>`
  BLACK instead of its first frame unless the src tells it to seek+render one (`preload="metadata"` paints
  on desktop but NOT iOS). The fragment is client-only (never sent to R2, so it doesn't touch the
  signature). It is the FALLBACK path: a video TILE with a `previewUrl` renders a tiny poster `<img>` (the
  preview frame, no `<video>` fetch) and falls back to `<video src=videoPosterSrc>` only without one. The
  lightbox plays the full `<video>`.
- **Grid video tiles are controls-less thumbnails on purpose.** A `<video controls>` is interactive content
  → an illegal `<button>` descendant, so the open-the-lightbox tile would be invalid HTML. Playback (with
  controls) happens in the lightbox. On the host grid the moderation buttons are SIBLINGS of the tile
  button (no `stopPropagation` needed).
- **The lightbox composes the radix Dialog PRIMITIVES, not the wrapped `<DialogContent>`**: it needs its
  own ground (the album blurred at half brightness, `GLASS_BEHIND` on a separate `DialogPrimitive.Overlay`,
  never on an ancestor of the media, which that backdrop filter would blur) and object-contain media,
  whereas `ui/dialog.tsx` hard-codes a light `bg-black/10` overlay and `max-w-sm`. Composing still gives
  the focus-trap / Esc / scroll-lock. Don't "fix" it.
- **Attribution resolves via an ADMIN read, because `profiles` RLS is own-row-only.** A host's normal
  query CANNOT read a guest's `display_name` (`profiles_select_own`), and the guest identity columns sit
  outside the host's grant, so `getUploaderIdentities` uses the service-role client (like
  `getHostAvatarSeed`). The pure `resolveUploaderIdentity` CASE: `guest_id` null → **Host** (the host's
  display name, no email); a verified guest (`verified_at` set) → the PROFILE's name + (host-only)
  `guests.email`; an unverified typed name → that name with the unverified mark and NO address, ever; a
  nameless row (minted before names were asked; `create_guest` refuses a new one) → no name at all. A row
  with no name renders NO credit, only the counter, never an invented stand-in, and a verified guest with no
  profile name renders the same. Attribution is **lightbox-only**: `MediaTile` reads just `type`, `url`
  and `previewUrl`, so grid tiles stay clean by construction. The caption **fades out while a center video
  plays** (never fighting the native scrubber) and respects `prefers-reduced-motion`; demo tokens skip the
  resolver (simulated tiles carry no attribution); the mark's nested popover closes on the first Esc, the
  lightbox on the second.
- **Mobile swipe = a peek-the-neighbor 3-slot track, vanilla Pointer Events (no carousel lib).** The
  load-bearing bits: finger-follow is gated to `pointerType === "touch"` (mouse/pen keep chevrons +
  keyboard); slots are **keyed by item id**, so the slid-to neighbor's already-loaded `<img>` is REUSED when
  it becomes current; the commit's animate-then-swap recenter holds `data-dragging` (`transition:none`)
  through the index swap, and **`dragging` is NOT re-enabled on the next frame/rAF** (React can flush the
  recenter and the re-enable in one frame → a visible second-slide "reanimate" glitch); videos are
  CLICK-TO-PLAY, not autoplay; `handleClose`, the single close funnel, **cancels the in-flight settle
  timer** (else a late timer reopens via `onIndexChange`); a `suppressClick` ref stops the post-drag
  synthetic click from closing via the backdrop. The CSS lives under `[data-lightbox-track]` in
  `globals.css` (reduced-motion-guarded). Every gallery surface inherits this from the one component —
  don't fork it.

## See also

[database-security.md](database-security.md) (the grant + RPC model) · [billing-caps.md](billing-caps.md) (the cap the upload enforces) · [lifecycle-recovery.md](lifecycle-recovery.md) (reclaim) · [guest-flow.md](guest-flow.md) / [host-app.md](host-app.md) (the surfaces).
