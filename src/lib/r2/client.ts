/**
 * Cloudflare R2 (S3-compatible) client — STUBBED this round, wired in Phase 2.
 *
 * ⚠️ THE CHECKSUM GOTCHA (this is why this file exists as a documented stub):
 * Recent @aws-sdk/client-s3 versions auto-inject CRC32 checksum headers that R2
 * REJECTS, producing silent 0-byte objects or `SignatureDoesNotMatch`. When you
 * wire this up you MUST construct the client like so:
 *
 *   import { S3Client } from "@aws-sdk/client-s3";
 *
 *   new S3Client({
 *     region: "auto",
 *     endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
 *     credentials: {
 *       accessKeyId: env.R2_ACCESS_KEY_ID,
 *       secretAccessKey: env.R2_SECRET_ACCESS_KEY,
 *     },
 *     // ↓↓↓ DO NOT REMOVE — without these, uploads silently corrupt against R2.
 *     requestChecksumCalculation: "WHEN_REQUIRED",
 *     responseChecksumValidation: "WHEN_REQUIRED",
 *   });
 *
 * Bucket CORS must allow PUT/POST/GET/HEAD + the `content-type` header AND expose
 * `ETag` (ExposeHeaders) — multipart completion needs the per-part ETags. See
 * ADR-0003 and CLAUDE.md.
 *
 * Phase 2: add deps `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`,
 * move the R2_* vars in lib/env.ts from optional to required, and implement
 * getR2Client() + the functions in ./presign.ts.
 */

const NOT_WIRED =
  "R2 is not wired yet (Phase 2). See lib/r2/client.ts for the required " +
  "S3Client config — note the checksum WHEN_REQUIRED gotcha.";

// Phase 2 will return an S3Client here. Typed as `unknown` so callers can't
// accidentally depend on a shape before it exists.
export function getR2Client(): unknown {
  throw new Error(NOT_WIRED);
}
