/**
 * Cloudflare R2 (S3-compatible) client. Server-only — it holds the R2 secret.
 *
 * ⚠️ THE CHECKSUM GOTCHA — do NOT remove the two `*ChecksumCalculation` /
 * `*ChecksumValidation` options below. Recent @aws-sdk/client-s3 versions
 * auto-inject CRC32 checksum headers that R2 REJECTS, producing silent 0-byte
 * objects or `SignatureDoesNotMatch`. `WHEN_REQUIRED` keeps the SDK from adding
 * them unless an operation truly needs one. (See uploads-and-r2.md and CLAUDE.md.)
 *
 * Bucket CORS must allow PUT/POST/GET/HEAD + the `content-type` and `range` headers AND expose
 * `ETag`, `Content-Range`, `Accept-Ranges` and `Content-Length` (ExposeHeaders) — multipart completion
 * needs the per-part ETags, and the reel's video window reader (2026-09-22) reads byte ranges by CORS fetch.
 */
import "server-only";

import { S3Client } from "@aws-sdk/client-s3";

import { assertR2Env } from "@/lib/env";

// Memoized across requests in a warm lambda; built lazily so the app still boots
// without R2 creds (assertR2Env throws only when an upload path actually runs).
let client: S3Client | null = null;

export function getR2Client(): S3Client {
  if (client) return client;

  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } =
    assertR2Env();

  client = new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
    // ↓↓↓ DO NOT REMOVE — without these, uploads silently corrupt against R2.
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });

  return client;
}
