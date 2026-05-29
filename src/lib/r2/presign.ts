/**
 * Presigned-URL helpers for browser → R2 direct uploads — STUBBED this round.
 *
 * Upload strategy (ADR-0003): the browser uploads directly to R2 using presigned
 * URLs. Small files use a single presigned PUT; large videos (up to 2 GB) use
 * multipart (create → presign each part → browser PUTs parts → complete). Bytes
 * NEVER pass through a Vercel function.
 *
 * ⚠️ GOTCHAS to honor when implementing (Phase 2):
 *   • Single PUT presign: pass `signableHeaders: new Set(["content-type"])` to
 *     getSignedUrl, and the browser MUST send the exact same Content-Type, or R2
 *     returns SignatureDoesNotMatch.
 *   • Multipart completion needs each part's ETag, so bucket CORS must expose
 *     ETag (ExposeHeaders: ["ETag"]).
 *   • Always presign over KEYS from lib/r2/keys.ts; never accept a client-supplied
 *     key (path-traversal / cross-event write). Validate the capability token and
 *     derive the key server-side.
 *   • Presigned read URLs (gallery) get a short TTL; strategy for large galleries
 *     is a deferred decision (per-request presign vs. proxy) — see docs/STATUS.md.
 */

const NOT_WIRED =
  "R2 presigning is not wired yet (Phase 2). See lib/r2/presign.ts.";

export type PresignedUpload = {
  url: string;
  /** Headers the browser must echo verbatim on the PUT (e.g. Content-Type). */
  headers: Record<string, string>;
};

/** Single presigned PUT for small files. */
export function presignUpload(_params: {
  key: string;
  contentType: string;
  expiresInSeconds?: number;
}): Promise<PresignedUpload> {
  throw new Error(NOT_WIRED);
}

/** Begin a multipart upload; returns the uploadId R2 assigns. */
export function createMultipartUpload(_params: {
  key: string;
  contentType: string;
}): Promise<{ uploadId: string }> {
  throw new Error(NOT_WIRED);
}

/** Presign a single part PUT within an in-progress multipart upload. */
export function presignUploadPart(_params: {
  key: string;
  uploadId: string;
  partNumber: number;
  expiresInSeconds?: number;
}): Promise<{ url: string }> {
  throw new Error(NOT_WIRED);
}

/** Finalize a multipart upload from the per-part ETags the browser collected. */
export function completeMultipartUpload(_params: {
  key: string;
  uploadId: string;
  parts: { partNumber: number; eTag: string }[];
}): Promise<void> {
  throw new Error(NOT_WIRED);
}
