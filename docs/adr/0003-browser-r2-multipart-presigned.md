# ADR-0003 — Browser → R2 direct multipart uploads via presigned URLs

- **Status:** Accepted (2026-05-28); implemented in Phase 2
- **Phase:** 0 (decision + stubs), 2 (implementation)

## Context

Guests upload videos up to **2 GB**. Routing a 2 GB body through a Vercel
serverless function is impossible (payload/time limits) and wasteful. We also
must never leak storage internals: object URLs/keys should not be guessable or
durable handles.

Storage is **Cloudflare R2** (S3-compatible, no egress fees). The AWS S3 SDK has
a well-known incompatibility with R2: newer versions **auto-inject CRC
checksums** that R2 rejects, producing silent **0-byte uploads** or
`SignatureDoesNotMatch`.

## Decision

- Uploads go **browser → R2 directly** using **presigned URLs**; large files use
  **multipart**. Bytes never pass through our functions — the function only mints
  presigned URLs and records metadata.
- All reads are **short-lived presigned GET URLs**. The browser never receives a
  raw object key or a public URL. `get_public_album` returns keys for
  **server-side presigning only**.
- R2 client is configured with `requestChecksumCalculation: "WHEN_REQUIRED"` and
  `responseChecksumValidation: "WHEN_REQUIRED"`; presign uses
  `signableHeaders: new Set(["content-type"])`.
- Bucket **CORS** must allow `PUT/POST/GET/HEAD` + the `content-type` header and
  **expose `ETag`** (multipart completion needs per-part ETags).
- Object keys are namespaced `events/<event_id>/…` and minted in one place
  (`src/lib/r2/keys.ts`); `create_media` defensively rejects keys that don't match
  the guest's event.

## Consequences

- **+** Arbitrarily large uploads without function limits; no egress cost; no raw
  URLs exposed.
- **+** The checksum + CORS gotchas are encoded once in `src/lib/r2/*` so they're
  not rediscovered painfully.
- **−** More moving parts client-side (multipart orchestration: presign each
  part, collect ETags, call complete).
- **−** Presigned-read expiry must be tuned for large galleries (per-request
  presign with TTL vs. a proxy) — open question for Phase 2.
- **−** Storage accounting can't rely on the function seeing the bytes; size is
  recorded via `create_media` and the storage ledger.
