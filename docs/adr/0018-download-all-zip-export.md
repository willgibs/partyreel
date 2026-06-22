# ADR-0018: "Download all" as a streaming Worker authorized by a signed manifest token

**Status:** Accepted (2026-06-22) · **Context:** ADR-0003 (browser↔R2 direct, heavy work off Vercel), ADR-0004
(capability tokens), ADR-0017 (gated-gallery access)

## Context

Per-item Save already streams ONE original from R2 to the browser. Hosts + guests want an off-Partyreel copy of
the **whole album** as a zip ("the link doubles as the shareable album"). Zipping N multi-MB objects is
heavy/streaming work that does not belong on a Vercel function (payload/time limits, billed egress). We need a
download that is secure (it streams PRIVATE media), cheap on a storage-billed model, and feels like a smooth,
frequent touchpoint.

## Decisions

1. **A separate streaming export Worker, store-method zip.** `workers/export/` (`partyreel-export`, native R2
   `PRIMARY` binding, deployed via `wrangler` — NOT the Vercel build), streaming a STORE-method zip with
   `client-zip` straight from R2 to the browser. Bytes never touch Vercel. We use the proven lib over a
   hand-rolled encoder despite the project's dependency-free leaning: streaming ZIP64 has silent
   correctness failure modes (central-directory offsets, data descriptors, CRC32) that only surface in
   specific extractors — a 2.6 kB lib in the isolated Worker package (the app never sees it) is the right call.
   Store method is correct (photos/videos are already compressed; compressing would burn CPU for ~0% gain).

2. **Authorization = a self-contained HMAC-signed MANIFEST TOKEN (no Worker→app callback).** The app authorizes
   ONCE at mint (host: `getUser` + own-event; guest: qr-resolve + `resolveGalleryAccess` + `loadGalleryRowsForAccess`,
   so a guest can never exceed `gallery.rows`), then signs the authorized `[{key,name}]` list + a 2-min expiry
   into an opaque token. The browser form-POSTs it; the Worker verifies the HMAC + expiry + per-key layout and
   streams. **The app is the single authz oracle; the Worker never authorizes** — a valid signature ⇒ the app
   authorized this exact set. We rejected the opaque-token + Worker→app callback (a second internal endpoint + a
   duplicated authz path that must never drift) because it buys nothing the sealed token doesn't: the keys ride
   sealed in the token, which is **equivalent exposure to the presigned gallery URLs we already ship** (the same
   keys, useless without a signature; other guests' mediaId-UUIDs are unguessable). The Worker ALSO re-validates
   each key's canonical `events/<uuid>/<kind>/<uuid>/<variant>.<ext>` layout (defense-in-depth), so even a
   signature-requiring forged manifest could never point a read at a non-event object.

3. **Synchronous streaming, not an async build-to-R2 job.** Sync keeps NO temp storage (preserves the
   storage-billed margins — the same reasoning that drove client-side previews in the slice before this), needs
   no job table, and the browser's native download dialog IS the progress UX. The async alternative (build the zip
   to a temp R2 bucket → email a link) buys resumability for very large albums — deferred behind a per-export cap
   (≤2000 items / ~20 GB) instead.

4. **Download via a TOP-LEVEL form POST.** The browser submits a same-frame form to the Worker; the
   `Content-Disposition: attachment` response downloads in place without navigating. A same-frame submit needs
   no user gesture (so it survives the awaited mint), and top-level navigations are never download-blocked — the
   canonical, restriction-proof "download via POST" pattern. (The first cut form-POSTed into a hidden iframe;
   that ALSO downloaded fine in testing, but cross-origin **iframe** downloads are a tightening browser
   restriction, so the top-level form is the more durable choice. The earlier "no file saved" reading was a
   false alarm — the test browser saves to a non-default download dir, so the files were landing all along; a
   reminder to confirm the real download location, not just `~/Downloads`.) The one tradeoff: a non-attachment
   Worker response would navigate the page, but the mint guarantees a valid, freshly-signed token + enabled
   export, so the happy path is always a 200 attachment and the page never unloads.

## Cost

Workers Paid is already paid (the backup Worker's Queues require it). Per a 200-item / 2 GB album: R2 Class-B
reads ~$0.00007, **R2 egress $0** (R2 has zero egress), Worker CPU (CRC32) ~$0.00005, **no temp storage** —
≈ $0.0001/download, under ~$1/mo at heavy use. Unlike a per-image transform fee, this does not dent margins. The
one real vector (scripted repeat downloads) is bounded by the `"export"` abuse-limiter kind, the 2-min token TTL,
the per-export cap, and the `export_enabled` kill-switch.

## Consequences

- Two service-role-only tables: `export_log` (the admin observability choke point — the Worker can't reach the
  DB) + `ops_flags` (the kill-switch). Surfaced at `/admin/exports` (P8).
- `EXPORT_SIGNING_SECRET` must be identical on the app + the Worker; `EXPORT_WORKER_URL` points at the Worker.
- v1 ships on the `*.workers.dev` URL; a custom `export.partyreel.com` subdomain is deferred.
- No single-use token enforcement in v1 (accepted — the short TTL + the fact that a replay only re-downloads
  already-authorized content).
