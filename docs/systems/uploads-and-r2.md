# Uploads, R2 & media rendering (the media system)

> ROLE: media bytes end to end — upload in (guest + host) → store in R2 → render out (grid / lightbox / download).
> BELONGS HERE: presign/complete routes, the shared uploader, the `create_media*` write path, R2 client config, keys, bulk delete, galleries, the lightbox, downloads, the video poster. · NOT HERE: cap/ingress *enforcement* (→ [billing-caps.md](billing-caps.md)), the purge/reclaim cron (→ [lifecycle-recovery.md](lifecycle-recovery.md)), durability/backup (→ [durability-backups.md](durability-backups.md)).
> GROWS BY: integrate-in-place.

## What it does

Browser → R2 **direct** upload (single PUT < 100 MB, else multipart) via presign + complete routes; a
SECURITY DEFINER RPC writes the `media` row + ledger and enforces caps; the same media renders in a shared
grid + lightbox, presigned server-side. Two upload identities share one pipeline: anonymous **guests**
(capability token) and authenticated **hosts** (a photographer's batch). The lightbox shows a subtle uploader
caption — display name, a **Host** badge, or **Anonymous** + an info popover — with the uploader's **email shown
on the HOST gallery only**.

**Tile previews (client-generated, 2026-06-22).** Galleries served full-res ORIGINALS on every tile (slow cold
loads, high bandwidth). Now the BROWSER generates a small ~640px **WebP** preview at upload — photos via
`createImageBitmap`-resize, videos via a canvas frame-grab (~0.1s in) of the local file — and uploads it as the
reserved `preview` R2 variant (a 2nd presigned PUT); `media.preview_key` is recorded at `create_media`.
**Generation is $0 + predictable** (the client does it, no Cloudflare transform fee — the fit for a
storage-billed model, Will's call). TILES serve `previewUrl ?? url` (an `onError`→original fallback self-heals
any gap); the **lightbox + Save keep the full-res original**. Live-measured: a 1920×1080 photo tile drops from
253 KB → a 16 KB 640×360 WebP (~94%); a video tile drops from an 788 KB `<video>` fetch → an 8.5 KB poster
`<img>` (~99%, no video fetch). Best-effort: an undecodable codec / huge image / old browser → null → the tile
falls back to the original (graceful); pre-feature rows (preview_key null) serve the original. The generator +
the pure sizing math: [`upload/preview.ts`](../../src/lib/upload/preview.ts) +
[`media/preview-size.ts`](../../src/lib/media/preview-size.ts). (A server-side BACKFILL of previews for existing
media is a deferred follow-on.)

**Metadata strip (client-side, 2026-07-02).** Phone originals carry GPS + device EXIF, and originals are served
byte-for-byte (lightbox, per-item Save, zip export) — a location leak. `uploadFile()` step 0 now strips
identifying metadata BEFORE any size is read (the presigned PUT binds Content-Length to the declared size, so
the stripped bytes must be what measure → validate → preview → presign → PUT all see), covering guest AND host
uploads at the one shared seam. The stripper ([`media/strip-metadata.ts`](../../src/lib/media/strip-metadata.ts))
is pure + dependency-free + runtime-agnostic and **lossless — byte-level excision, never a pixel re-encode**:
JPEG drops Exif/XMP/IPTC/COM but keeps JFIF + ICC + Adobe APP14 (color-load-bearing) and **rebuilds a minimal
one-tag Exif so Orientation survives** (sideways photos would otherwise render wrong everywhere); a kept MPF
index (iPhone HDR gain maps) has its **individual-image offsets/sizes rewritten** to match the shrunk file
(they are MPF-header-relative, so dropping any segment between the MPF and SOS goes stale; an unfixable index
fails the whole strip open rather than shipping a corrupt HDR); an embedded **motion-photo MP4 after the EOI**
gets its metadata boxes blanked in place (same machinery, zero bytes move). PNG drops eXIf/tEXt/zTXt/iTXt;
WebP drops EXIF/XMP chunks + clears the VP8X flag bits; MP4/MOV **never restructures** (chunk-offset tables) —
udta/meta/xml/XMP-uuid boxes are blanked in place (rename to `free` + zero payload) via lazy File slices, so
multi-GB videos never fully load. **Fail-open contract:** unparseable or exotic input (HEIC/HEIF/AVIF —
item-based, blanking meta would destroy the image — and WebM) uploads UNTOUCHED with `stripped:false`, and the
Exif INSIDE a JPEG's post-EOI MPF secondary images survives (excising it would shift the trailer the MPF index
points into); a corrupted upload is worse than the leak, so that leak window is a conscious trade-off —
`hasGpsMetadata` scans trailers too, so the backfill report flags the residual case as clean-but-GPS instead of
"clean".
Because the strip is client-side pre-upload, replicated backups get clean bytes too — but it also means **the
server never sees the EXIF**, so any future forensic EXIF capture must extract client-side before the strip.
Pre-strip objects are swept by the one-off [`scripts/backfill-strip-exif.mjs`](../../scripts/backfill-strip-exif.mjs)
(dry-run by default; `--live` PUTs stripped bytes under the same key and decrements `media.file_size_bytes` +
`profiles.storage_used_bytes` + the upload-month `storage_ledger` row to keep the cap meters honest).

**Download all (zip export, 2026-06-22).** Per-item Save streams ONE original (`presignDownload` attachment
URL); **"Download all"** zips a whole album. Heavy/streaming work runs OFF Vercel on a separate **streaming
export Worker** ([`workers/export/`](../../workers/export), `partyreel-export`, deployed via `wrangler`).
The flow: the browser hits a Next **mint route** (host [`/api/export/host`](../../src/app/api/export/host),
guest [`/api/export/guest`](../../src/app/api/export/guest)) which AUTHORIZES (host: `getUser` + own-event;
guest: qr-resolve + `resolveGalleryAccess` + `loadGalleryRowsForAccess` — a guest can NEVER exceed `gallery.rows`),
builds the manifest, and **HMAC-signs** `{v,jti,scope,eventId,zipName,items:[{key,name}],exp}` into an opaque
token (the app is the SINGLE authz oracle); the browser **top-level form-POSTs** the token to the Worker, which
verifies the signature + expiry + per-key layout and **streams a STORE-method zip** of the R2 objects straight to
the browser (`client-zip`, bytes never touch Vercel). The shared service (kill-switch → abuse-limiter →
manifest+cap → sign → log) is [`export/export-service.ts`](../../src/lib/export/export-service.ts); the pure
token + manifest cores are [`export/export-token.ts`](../../src/lib/export/export-token.ts) (signs node-side,
the Worker re-verifies in Web Crypto — ONE shared FORMAT) + [`export/build-manifest.ts`](../../src/lib/export/build-manifest.ts).
UI = the **Concept B config modal** ([`app/export/export-dialog.tsx`](../../src/components/app/export/export-dialog.tsx)):
type chips (Everything/Photos/Videos, live counts from a `step:"summary"` call) + a host-only "Include hidden"
toggle + the total size/count as the result; the host Gallery header button + bulk "Download selected" (direct,
no modal) + the guest album (hidden in demo). **Download via a TOP-LEVEL form POST** — a same-frame
submit needs no gesture (survives the awaited mint) and an attachment response downloads without navigating;
cross-origin **iframe** downloads are a tightening browser restriction, so top-level is the durable choice. Cost: ~$0 marginal (R2 egress is free; store-zip CPU is just CRC32). Caps: ≤2000
items / ~20 GB per export; per-export rows in `export_log` + the `export_enabled` kill-switch surface at
[`/admin/exports`](../../src/app/admin/exports). Deferred: an async build-to-R2 job for >cap albums; a custom
`export.partyreel.com` subdomain (v1 uses `*.workers.dev`).

## Where it lives

- R2 client + presign: [`r2/client.ts`](../../src/lib/r2/client.ts), [`r2/presign.ts`](../../src/lib/r2/presign.ts)
  (incl. `presignDownload`, `headObjectSize`). Keys: [`r2/keys.ts`](../../src/lib/r2/keys.ts) (`mediaObjectKey`,
  `parseMediaIdFromKey`, `parseExtFromKey` — single source). Bulk: [`r2/delete.ts`](../../src/lib/r2/delete.ts).
- Routes: guest [`/api/r2/presign-upload`](../../src/app/api/r2) + `/complete-upload`; host
  [`/api/host/r2/`](../../src/app/api/host/r2) `presign-upload` + `complete-upload` — all four are THIN
  strategy adapters over the ONE pipeline engine
  [`upload/server-pipeline.ts`](../../src/lib/upload/server-pipeline.ts) (Phase 3): the engine owns the
  shared spine (parse → zod → server-side classify/ext → `validateUpload` → key build →
  single/multipart presign; complete: multipart sum/abort guard → assemble → R2-HEAD → create RPC →
  forensic capture: one deny-all `upload_forensics` row per success, best-effort-but-loud —
  → [trust-safety-forensics.md](trust-safety-forensics.md)),
  the strategies own the per-identity gates + status mapping. Part-size math single-sourced in
  [`upload/part-plan.ts`](../../src/lib/upload/part-plan.ts). Response JSON shapes/key order are the
  `uploadFile()` contract — byte-for-byte frozen (curl-fixture verified at the refactor).
  The remaining guest/host asymmetries are DELIBERATE, not drift — don't "finish" the consolidation:
  auth placement (host `getUser()` gates in the route BEFORE the engine, the 401-before-body-parse
  ordering, duplicated verbatim in both host routes on purpose; guest capability tokens validate
  inside the RPCs), the per-event `max_upload_bytes` cap binds GUESTS ONLY (host exempt by design),
  refusal framing (guest video refusals are EVENT-framed so a guest never learns the host's plan;
  host refusals are tier-framed; host `not_owner` → 404, an existence non-leak), per-pair
  `errorStatus` maps, and NO request rate limiter on any of the four (abuse control = capability
  session + caps + per-part Content-Length binding + the multipart abort backstop).
- Shared uploader: [`upload/uploader.ts`](../../src/lib/upload/uploader.ts) (`uploadFile`). Metadata strip:
  [`media/strip-metadata.ts`](../../src/lib/media/strip-metadata.ts) (pure; browser seam + the Node backfill
  [`scripts/backfill-strip-exif.mjs`](../../scripts/backfill-strip-exif.mjs) share it — never fork the logic).
- Media constants: [`media/limits.ts`](../../src/lib/media/limits.ts) (10 GB per upload, size-only — single source; `MIN_UPLOAD_CAP_BYTES` + `UPLOAD_CAP_PRESETS` feed the host cap),
  [`media/poster.ts`](../../src/lib/media/poster.ts) (`videoPosterSrc`), [`media/download-filename.ts`](../../src/lib/media/download-filename.ts).
- Render: [`media-grid.tsx`](../../src/components/app/media-grid.tsx) + the shared
  [`media-lightbox.tsx`](../../src/components/shared/media-lightbox.tsx) (used by all 4 surfaces);
  host add-photos [`event-uploads.tsx`](../../src/components/app/event-uploads.tsx) → [`host-upload.tsx`](../../src/components/app/host-upload.tsx).
- Uploader attribution: the pure CASE helper [`media/uploader-identity.ts`](../../src/lib/media/uploader-identity.ts)
  (`resolveUploaderIdentity`) + the admin-read resolver `getUploaderIdentities(eventId)` in
  [`guest-events-admin.ts`](../../src/lib/db/queries/guest-events-admin.ts); the caption + tap-to-open explainer live in
  `media-lightbox.tsx` + [`anonymous-info.tsx`](../../src/components/shared/anonymous-info.tsx) / [`ui/popover.tsx`](../../src/components/ui/popover.tsx).
- Env: R2 vars stay `.optional()` in [`env.ts`](../../src/lib/env.ts); `assertR2Env()` asserts them lazily at request time.
- Export ("Download all"): the Worker [`workers/export/`](../../workers/export) (separate `wrangler` deploy, native
  R2 `PRIMARY` binding, `EXPORT_MODE` kill-switch var, `client-zip`); the mint routes + service + token/manifest
  cores under [`src/lib/export/`](../../src/lib/export) + [`src/app/api/export/`](../../src/app/api/export); the UI
  [`src/components/app/export/`](../../src/components/app/export) (modal + `useExportDownload`); the admin readout
  [`src/app/admin/exports/`](../../src/app/admin/exports). Env: `EXPORT_SIGNING_SECRET` (must equal the Worker's
  secret) + `EXPORT_WORKER_URL`, both `.optional()` + `assertExportEnv()`.

## Invariants (don't break)

- **The R2 client checksum config is load-bearing.** The AWS SDK auto-injects CRC checksums R2 rejects →
  silent **0-byte / `SignatureDoesNotMatch`**. The client sets `requestChecksumCalculation: "WHEN_REQUIRED"`
  + `responseChecksumValidation: "WHEN_REQUIRED"`; the single-PUT presign sets `signableHeaders: new
  Set(["content-type"])`. Bucket **CORS must allow PUT/POST/GET/HEAD + `content-type` and EXPOSE `ETag`**
  (multipart completion needs ETag); a lifecycle rule aborts incomplete multipart uploads. Don't remove
  any of it. *(Cross-cutting landmine — echoed in CLAUDE.md.)*
- ★ **A CORS consumer of a tile-shared presign must bypass the HTTP cache.** Plain `<img>` tiles fetch
  presigned URLs with no Origin header, and R2 answers without `Access-Control-Allow-Origin` (and no
  `Vary: Origin`) — the browser caches that ACAO-less response under the SAME URL the stable-bucket
  scheme deliberately shares. A later `fetch(mode: "cors")` of that URL (the reel engine's asset
  loader) then reads the poisoned entry and fails with a bare "Failed to fetch", nulling every clip
  with zero console errors. The engine fetches with `cache: "no-store"`
  ([`engine/assets.ts`](../../src/lib/reel/engine/assets.ts)) — keep it, and give any NEW CORS consumer
  of gallery presigns the same treatment. (Found live 2026-07-21; note R2 403s also omit CORS headers,
  so an EXPIRED presign probed via CORS fetch masquerades as a CORS failure.)
- **Never expose raw R2 keys/URLs to the browser** — presign server-side via the shared `toGridItems`;
  the render routes are `force-dynamic`. **Gallery read presigns are STABLE (Phase 3):**
  `presignDownload({ stable: true })` pins the SigV4 signing date to the current 30-min bucket
  ([`r2/presign-bucket.ts`](../../src/lib/r2/presign-bucket.ts)), so two presigns of the same key in a
  bucket are byte-identical — the browser image cache works across refetches and the gallery ETag rolls
  with the bucket. TTL is 90 min (2× bucket + slack; a URL minted at minute 29 still outlives the next
  full bucket). Trade-off, accepted: a leaked read URL lives ≤90 min vs the old 60. Upload PUT/part
  presigns are NEVER stable (one-shot; freshness is the point).
- ★ **Uploader email is HOST-gallery-only — guest surfaces NEVER carry it.** Attribution is resolved by ONE
  admin-read (`getUploaderIdentities`); the host dashboard spreads the `email`, but every guest-facing item is
  built by `toGridItems`, which copies ONLY name + `isHost`/`isAnonymous` and NEVER email. Email-safe by
  construction (not a runtime viewer flag), guarded by a standing source test (`grid-items.email-safety.test.ts`).
  Live-verified: the anonymous SSR + `/api/guests/gallery` payloads carry no email field (item keys are
  `id, type, url, downloadUrl, uploaderName, isHost, isAnonymous`).
- ★ **A locked event gates UPLOADS, not just viewing.** The write path re-checks the
  event's lock at ALL THREE guest seams (the `/api/guests` mint, presign, complete) via the shared
  `mayUploadPastLock(eventId)` (`src/lib/events/upload-lock.ts`): `private` refuses every guest write
  (owner uploads ride the HOST routes), `password` requires the signed HttpOnly unlock cookie **or**
  verified event ownership. The owner exemption is load-bearing, not a convenience: the owner reads their
  own album without ever seeing the password modal, so a bare `isUnlocked()` check breaks the host
  uploading to their own locked event. Gating only the MINT is not enough either — a token minted while
  the event was open would keep uploading forever, which is precisely the remediation a host reaches for
  when a link leaks; the per-request presign/complete checks are what kill it. The lock is checked BEFORE
  `accepting_uploads` on purpose (someone who cannot see the album learns nothing else about it), and
  `create_guest` re-refuses both cases from its own `p_unlock_proven` param (the DB cannot read cookies,
  so the server derives the proof) as a belt against a future second caller.
- ★ **The complete seam pins the key to what presign minted — the key IS the issuance record.** Presign
  builds `events/<eventId>/<kind>/<mediaId>/<variant>.<ext>` server-side from THAT request's
  `content_type`, so requiring the completion's echoed `content_type` to re-derive the same `<kind>` and
  `<ext>`, plus `<variant>` = `original` (and the preview key's = `preview`), transitively pins
  complete-time `content_type` to presign-time `content_type` with **zero stored state** — no presign
  issuance table is needed (`checkCompleteKeyConsistency`, `src/lib/upload/complete-key-check.ts`).
  Without the variant pin, completing with the ~2 MB preview as `key` meters the preview as
  `file_size_bytes` while the up-to-10 GB original sits uncounted; without the kind pin, video bytes
  complete as a `photo` row and dodge the free-tier photos-only gate. Refuse, never repair.
- **`create_media*` is the ONLY write path into `media`.** A host CANNOT RLS-insert directly even though
  `media_host_all` would allow the row — that bypasses the ledger + `storage_used_bytes` accounting + the
  cap check (unmetered free storage). The RPC keeps the accounting honest. It also **re-checks the key's
  event prefix** (`events/<event_id>/%`, raising `bad_key` otherwise), so a valid session can never record
  a row against another event's namespace (the DB-side twin of the complete seam's key pin).
- **Host upload = `guest_id IS NULL`.** `create_media_as_host` is the authenticated twin of `create_media`:
  auth via `auth.uid()` + event ownership (not a token), same per-file limits + cap/ingress enforcement
  (host uploads **count against the plan**), `status='approved'` unconditionally (the host is the
  moderator). No `accepting_uploads` check for the host (that toggle is the GUEST gate). → [billing-caps.md](billing-caps.md).
- **One 10 GB per-upload ceiling, size-only** (photos + videos; no duration cap) enforced in `create_media*` on
  the authoritative R2-HEAD size. A host may set a STRICTER per-event cap (`events.max_upload_bytes`, 25 MiB to
  10 GB, or null = no cap) that bounds **guest** uploads only — the host's own `create_media_as_host` is exempt.
  The cap is read from the event row INSIDE the RPC (never a client/RPC param → un-spoofable); the guest presign
  route fast-fails over-cap claims but `create_media` is authoritative. Upload presign TTL is **2 h**: a
  multipart upload presigns all its parts up front, so the whole transfer must finish before they expire.
- ★ **No upload can exceed its declared (≤10 GB) size — protects the pipeline + WORM backup from a megafile.**
  Presigned PUT/UploadPart URLs **bind Content-Length** (`presignUpload`/`presignUploadPart` sign each part's
  EXACT size), so R2 rejects (403) any over-stuffed body; AND the complete routes **sum the real part sizes
  (`sumMultipartParts` → `ListParts`) and `abortMultipartUpload` instead of assembling** when the total exceeds
  the ceiling. Without BOTH, an attacker could declare small, get ~640 part URLs, over-stuff each, and complete
  into a multi-TB **orphan** the backup Worker would replicate into the 35-day-locked bucket (`create_media`'s
  ceiling guards the DB/accounting, NOT the R2 object's existence). Don't drop either guard. *(Verified against
  the real bucket: correct size → 200, oversized → 403.)*
- ★ **The preview PUT is size-bound + capped too** (same class of guard). The preview is NOT counted toward
  `file_size_bytes` (it's a small derivative), so an unbounded preview PUT to its server-built key would be a
  cap-EVASION / cost-abuse vector. The client declares the generated preview's size at presign; the engine binds
  Content-Length (reusing `presignUpload`) and SKIPS the preview presign over `MAX_PREVIEW_BYTES` (2 MB) — so the
  original still uploads + a preview can never store an arbitrary-large object. The preview's bytes go uncounted
  (accepted under-count; the purge + backup still handle the object since it's under `events/`).

## Gotchas (why it's like this — don't revert)

- **Upload size-spoof is closed by an R2 HEAD at complete + a server-only RPC.** The
  complete routes re-derive the real `file_size_bytes` from `headObjectSize` and pass THAT to the RPC, never
  the client's claim (a PUT-big-claim-tiny upload used to beat the cap). The R2-HEAD size is now TRULY
  authoritative because `create_media` / `create_media_as_host` are **service-role-only**: the
  complete-upload route is the ONLY caller, so the prior anon-PostgREST bypass — which let a client call the
  RPC directly with a spoofed size, dodging the HEAD — is closed (the `media.file_size_bytes`
  `[0, 10 GiB]` CHECK is the belt-and-braces floor). `duration_seconds` / `width` / `height` stay client-supplied + NON-authoritative (the byte cap is
  the cost boundary).
- **The export zip is STORE-method, streamed synchronously, from a proven lib.** Photos and videos are
  already compressed, so deflate would burn Worker CPU for ~0% gain. Streaming ZIP64 has silent
  correctness failure modes (central-directory offsets, data descriptors, CRC32) that surface only in
  specific extractors, so `client-zip` earns its place despite the project's dependency-free leaning: it
  is 2.6 kB inside the isolated Worker package and the app never sees it. Streaming rather than building
  a zip into R2 keeps **zero temp storage** (the storage-billed margin) and needs no job table; the
  browser's own download dialog is the progress UX. Tokens are not single-use: a 2-minute TTL plus the
  fact that a replay only re-downloads already-authorized content is the accepted v1 bound.
- **`uploadFile()` is shared, don't fork it.** The caller passes the endpoint pair + an `identity` object
  (`{ session_token }` guest / `{ event_id }` host) merged into both request bodies; presign/complete
  response shapes are identical. `HostUpload` is a SEPARATE component (no join/demo/email/`sessionRef`
  baggage) that reuses `FileDropzone` + `uploadFile`, and calls `router.refresh()` ONCE after the batch
  drains (route handlers don't `revalidatePath` like the moderation server actions do).
- **Cross-origin download needs a SIGNED `ResponseContentDisposition`, not `<a download>`.** The `download`
  attribute is IGNORED for cross-origin URLs (R2 is a different origin), so `presignDownload({ key,
  downloadFilename })` bakes `response-content-disposition=attachment; filename="…"` INTO the signature.
  Save is a plain top-level `<a href>` navigation, so **no bucket-CORS change is needed**. Two presigns per
  item up front (inline render + attachment download) — accepted for v1 (presign is local HMAC, no network).
  The filename is slugged to ASCII by `download-filename.ts` (header-safe, no RFC-5987 encoding).
- **`videoPosterSrc()` appends `#t=0.1` — load-bearing, don't drop it.** iOS Safari paints a `<video>`
  BLACK instead of its first frame unless the src tells it to seek+render one (`preload="metadata"` paints
  on desktop but NOT iOS). The fragment is client-only (never sent to R2, so it doesn't touch the
  signature). This is now the FALLBACK path: a video TILE with a `previewUrl` renders a tiny poster `<img>`
  (the client-generated preview frame) — no `<video>` fetch — and only falls back to `<video src=videoPosterSrc>`
  when there's no preview. The lightbox still plays the full `<video>`.
- **Grid video tiles are controls-less thumbnails on purpose.** A `<video controls>` is interactive content
  → an illegal `<button>` descendant, so the open-the-lightbox tile would be invalid HTML. Playback (with
  controls) happens in the lightbox. On the host grid the moderation buttons are SIBLINGS of the tile
  button (no `stopPropagation` needed).
- **The lightbox composes the radix Dialog PRIMITIVES, not the wrapped `<DialogContent>`** — it needs a
  dark, edge-to-edge `bg-black/90` backdrop + object-contain media, whereas `ui/dialog.tsx` hard-codes a
  light overlay + `max-w-sm`. Composing still gives the focus-trap / Esc / scroll-lock. Don't "fix" it.
- **Attribution resolves via an ADMIN read, because `profiles` RLS is own-row-only.** A host's normal query
  CANNOT read a guest's `display_name` (the `profiles_select_own` policy), so `getUploaderIdentities` uses the
  service-role client (mirrors `getHostAvatarUrl`). The pure `resolveUploaderIdentity` CASE: `guest_id` null →
  Host (name = host's display name, no email); `guests.user_id` null → Anonymous; else → the guest's
  `display_name` + (host-only) `guests.email`. A set `user_id` with a null name renders NOTHING (not
  "Anonymous"). Attribution is **lightbox-only** — `MediaTile` reads just `type` + `url`, so dense grid tiles
  stay clean by construction. The caption **fades out while a center video plays** (the ~64px control zone is
  fuzzy across platforms) and respects `prefers-reduced-motion`. Demo tokens skip the resolver (no attribution
  on simulated tiles). The nested info popover closes on the first Esc, the lightbox on the second.
- **Mobile swipe = a peek-the-neighbor 3-slot track, vanilla Pointer Events (no carousel lib).** The
  load-bearing, non-obvious bits: finger-follow is gated to `pointerType === "touch"` (mouse/pen keep
  chevrons + keyboard); slots are **keyed by item id** so the slid-to neighbor's already-loaded `<img>` is
  REUSED when it becomes current; the commit does an animate-then-swap recenter that holds `data-dragging`
  (`transition:none`) through the index swap, and **`dragging` is NOT re-enabled on the next frame/rAF**
  (React can flush the transition-off recenter and the re-enable in the same frame → a visible second-slide
  "reanimate" glitch); videos are CLICK-TO-PLAY, not autoplay; `handleClose` is the single close funnel and
  **cancels the in-flight settle timer** (else a late timer reopens via `onIndexChange`); a `suppressClick`
  ref stops the post-drag synthetic click from closing via the backdrop. CSS lives under
  `[data-lightbox-track]` in `globals.css` (reduced-motion-guarded). All four surfaces inherit this from the
  one component — don't fork it.

## See also

[database-security.md](database-security.md) (the grant + RPC model) · [billing-caps.md](billing-caps.md) (the cap the upload enforces) · [lifecycle-recovery.md](lifecycle-recovery.md) (reclaim) · [guest-flow.md](guest-flow.md) / [host-app.md](host-app.md) (the surfaces).
