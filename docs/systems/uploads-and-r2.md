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

## Where it lives

- R2 client + presign: [`r2/client.ts`](../../src/lib/r2/client.ts), [`r2/presign.ts`](../../src/lib/r2/presign.ts)
  (incl. `presignDownload`, `headObjectSize`). Keys: [`r2/keys.ts`](../../src/lib/r2/keys.ts) (`mediaObjectKey`,
  `parseMediaIdFromKey`, `parseExtFromKey` — single source). Bulk: [`r2/delete.ts`](../../src/lib/r2/delete.ts).
- Routes: guest [`/api/r2/presign-upload`](../../src/app/api/r2) + `/complete-upload`; host
  [`/api/host/r2/`](../../src/app/api/host/r2) `presign-upload` + `complete-upload`.
- Shared uploader: [`upload/uploader.ts`](../../src/lib/upload/uploader.ts) (`uploadFile`).
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

## Invariants (don't break)

- **The R2 client checksum config is load-bearing.** The AWS SDK auto-injects CRC checksums R2 rejects →
  silent **0-byte / `SignatureDoesNotMatch`**. The client sets `requestChecksumCalculation: "WHEN_REQUIRED"`
  + `responseChecksumValidation: "WHEN_REQUIRED"`; the single-PUT presign sets `signableHeaders: new
  Set(["content-type"])`. Bucket **CORS must allow PUT/POST/GET/HEAD + `content-type` and EXPOSE `ETag`**
  (multipart completion needs ETag); a lifecycle rule aborts incomplete multipart uploads. Don't remove
  any of it. *(Cross-cutting landmine — echoed in CLAUDE.md.)*
- **Never expose raw R2 keys/URLs to the browser** — presign server-side (1 h TTL, via the shared
  `toGridItems`); the render routes are `force-dynamic` (ADR-0003).
- ★ **Uploader email is HOST-gallery-only — guest surfaces NEVER carry it.** Attribution is resolved by ONE
  admin-read (`getUploaderIdentities`); the host dashboard spreads the `email`, but every guest-facing item is
  built by `toGridItems`, which copies ONLY name + `isHost`/`isAnonymous` and NEVER email. Email-safe by
  construction (not a runtime viewer flag), guarded by a standing source test (`grid-items.email-safety.test.ts`).
  Live-verified: the anonymous SSR + `/api/guests/gallery` payloads carry no email field (item keys are
  `id, type, url, downloadUrl, uploaderName, isHost, isAnonymous`).
- **`create_media*` is the ONLY write path into `media`.** A host CANNOT RLS-insert directly even though
  `media_host_all` would allow the row — that bypasses the ledger + `storage_used_bytes` accounting + the
  cap check (unmetered free storage). The RPC keeps the accounting honest.
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
  the real bucket: correct size → 200, oversized → 403; ADR-0003 + ADR-0014 posture.)*

## Gotchas (why it's like this — don't revert)

- **Upload size-spoof is closed by an R2 HEAD at complete (ADR-0014).** The complete routes re-derive the
  real `file_size_bytes` from `headObjectSize` and pass THAT to the RPC, never the client's claim (a
  PUT-big-claim-tiny upload used to beat the cap). `duration_seconds` / `width` / `height` stay
  client-supplied + NON-authoritative (the byte cap is the cost boundary).
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
  signature). Single-sourced because BOTH the grid `MediaTile` and the lightbox use it (same value → a
  video reused across lightbox slots doesn't reload).
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

[ADR-0003](../adr/0003-browser-r2-multipart-presigned.md) · [ADR-0014](../adr/0014-data-layer-security-posture.md) (size-spoof) · [billing-caps.md](billing-caps.md) (the cap the upload enforces) · [lifecycle-recovery.md](lifecycle-recovery.md) (reclaim) · [guest-flow.md](guest-flow.md) / [host-app.md](host-app.md) (the surfaces).
