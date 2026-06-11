/**
 * Presigned-URL helpers for browser → R2 direct uploads + gallery reads.
 * Server-only — these sign with the R2 secret.
 *
 * Upload strategy (ADR-0003): the browser uploads directly to R2 via presigned
 * URLs. Files under MULTIPART_THRESHOLD_BYTES use a single presigned PUT; larger
 * files use multipart (create → presign each part → browser PUTs parts →
 * complete). Bytes NEVER pass through a Vercel function.
 *
 * ⚠️ GOTCHAS (kept honored below):
 *   • Single PUT: sign `content-type` (signableHeaders) and the browser MUST send
 *     the exact same Content-Type, or R2 returns SignatureDoesNotMatch.
 *   • Multipart completion needs each part's ETag → bucket CORS must expose ETag
 *     (ExposeHeaders: ["ETag"]). Parts must be sorted ascending on complete.
 *   • Always presign over KEYS from lib/r2/keys.ts; the caller derives the key
 *     server-side from the capability token — never from client input.
 *   • Read URLs (gallery) presign STABLE (signing date pinned to 30-min buckets
 *     — see presign-bucket.ts + presignDownload's `stable` flag); a per-media
 *     proxy for very large galleries stays deferred (ROADMAP).
 */
import "server-only";

import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListPartsCommand,
  type ListPartsCommandOutput,
  PutObjectCommand,
  UploadPartCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { assertR2Env } from "@/lib/env";
import { getR2Client } from "@/lib/r2/client";
import {
  STABLE_DOWNLOAD_TTL_SECONDS,
  presignBucketStart,
} from "@/lib/r2/presign-bucket";

// 2 h. A multipart upload presigns ALL its part URLs up front (in the presign route's
// Promise.all), so the whole transfer must finish before they expire. At the 10 GB ceiling
// that's ~640 parts; 2 h covers a 10 GB upload at ~12 Mbps (within median uplinks). SigV4
// caps presigned-URL lifetime at 7 days; this is a write-only PUT to a server-derived key,
// still gated by the authoritative complete-upload RPC, so a longer window is low-risk.
const DEFAULT_UPLOAD_TTL_SECONDS = 2 * 60 * 60;
const DEFAULT_DOWNLOAD_TTL_SECONDS = 60 * 60; // 1 h — gallery read URLs

export type PresignedUpload = {
  url: string;
  /** Headers the browser must echo verbatim on the PUT (e.g. Content-Type). */
  headers: Record<string, string>;
};

/**
 * Single presigned PUT for small files. Binds BOTH content-type and content-length into the
 * signature: the browser auto-sends Content-Length = the body's byte length, so R2 rejects
 * (403) any body whose size differs from `contentLength`. That caps the stored object at the
 * presign-validated size — a client CANNOT PUT a bigger body than it declared (the cost/abuse
 * guard against size-spoof-then-overstuff). `contentLength` is the declared (schema-capped)
 * size_bytes.
 */
export async function presignUpload(params: {
  key: string;
  contentType: string;
  contentLength: number;
  expiresInSeconds?: number;
}): Promise<PresignedUpload> {
  const {
    key,
    contentType,
    contentLength,
    expiresInSeconds = DEFAULT_UPLOAD_TTL_SECONDS,
  } = params;
  const { R2_BUCKET } = assertR2Env();

  const url = await getSignedUrl(
    getR2Client(),
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      ContentType: contentType,
      ContentLength: contentLength,
    }),
    {
      expiresIn: expiresInSeconds,
      signableHeaders: new Set(["content-type", "content-length"]),
    },
  );

  return { url, headers: { "Content-Type": contentType } };
}

/** Begin a multipart upload; returns the uploadId R2 assigns. */
export async function createMultipartUpload(params: {
  key: string;
  contentType: string;
}): Promise<{ uploadId: string }> {
  const { key, contentType } = params;
  const { R2_BUCKET } = assertR2Env();

  const out = await getR2Client().send(
    new CreateMultipartUploadCommand({
      Bucket: R2_BUCKET,
      Key: key,
      ContentType: contentType,
    }),
  );
  if (!out.UploadId) throw new Error("R2 did not return an UploadId.");
  return { uploadId: out.UploadId };
}

/**
 * Presign a single part PUT within an in-progress multipart upload. Binds content-length into
 * the signature (same rationale as presignUpload): R2 rejects (403) any part body whose size
 * differs from `contentLength`, so a client can't over-stuff parts to assemble a >ceiling
 * megafile. The caller passes each part's EXACT size (the fixed part size for parts 1..N-1, the
 * remainder for the last part) so the browser's auto Content-Length matches the signature.
 */
export async function presignUploadPart(params: {
  key: string;
  uploadId: string;
  partNumber: number;
  contentLength: number;
  expiresInSeconds?: number;
}): Promise<{ url: string }> {
  const {
    key,
    uploadId,
    partNumber,
    contentLength,
    expiresInSeconds = DEFAULT_UPLOAD_TTL_SECONDS,
  } = params;
  const { R2_BUCKET } = assertR2Env();

  const url = await getSignedUrl(
    getR2Client(),
    new UploadPartCommand({
      Bucket: R2_BUCKET,
      Key: key,
      UploadId: uploadId,
      PartNumber: partNumber,
      ContentLength: contentLength,
    }),
    {
      expiresIn: expiresInSeconds,
      signableHeaders: new Set(["content-length"]),
    },
  );

  return { url };
}

/** Finalize a multipart upload from the per-part ETags the browser collected. */
export async function completeMultipartUpload(params: {
  key: string;
  uploadId: string;
  parts: { partNumber: number; eTag: string }[];
}): Promise<void> {
  const { key, uploadId, parts } = params;
  const { R2_BUCKET } = assertR2Env();

  // S3/R2 require parts in ascending PartNumber order; ETags pass through verbatim.
  const ordered = [...parts].sort((a, b) => a.partNumber - b.partNumber);

  await getR2Client().send(
    new CompleteMultipartUploadCommand({
      Bucket: R2_BUCKET,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: ordered.map((p) => ({ ETag: p.eTag, PartNumber: p.partNumber })),
      },
    }),
  );
}

/**
 * Sum the REAL byte sizes of every uploaded part of an in-progress multipart upload (paginated
 * ListParts). The complete routes call this BEFORE assembling, so an over-stuffed multipart is
 * ABORTED rather than completed into a >ceiling megafile orphan (which the real-time backup
 * Worker would then replicate to the WORM bucket). Defense-in-depth behind the per-part
 * content-length binding, which already bounds each part at the R2 edge.
 */
export async function sumMultipartParts(params: {
  key: string;
  uploadId: string;
}): Promise<number> {
  const { key, uploadId } = params;
  const { R2_BUCKET } = assertR2Env();
  const client = getR2Client();
  let total = 0;
  let partNumberMarker: string | undefined = undefined;
  // Bounded: at the 10 GB ceiling that's 640 parts (1 page); the cap is a runaway backstop.
  for (let page = 0; page < 50; page++) {
    const out: ListPartsCommandOutput = await client.send(
      new ListPartsCommand({
        Bucket: R2_BUCKET,
        Key: key,
        UploadId: uploadId,
        PartNumberMarker: partNumberMarker,
      }),
    );
    for (const p of out.Parts ?? []) total += p.Size ?? 0;
    if (!out.IsTruncated) break;
    partNumberMarker = out.NextPartNumberMarker;
  }
  return total;
}

/** Abort an in-progress multipart upload, deleting its parts (the over-size guard's hammer). */
export async function abortMultipartUpload(params: {
  key: string;
  uploadId: string;
}): Promise<void> {
  const { key, uploadId } = params;
  const { R2_BUCKET } = assertR2Env();
  await getR2Client().send(
    new AbortMultipartUploadCommand({
      Bucket: R2_BUCKET,
      Key: key,
      UploadId: uploadId,
    }),
  );
}

/**
 * AUTHORITATIVE stored-object size (bytes) via a server-side HEAD — the source of truth for an
 * upload's file_size_bytes at completion. NEVER trust the client's declared size: the storage-cap
 * meter is SUM(media.file_size_bytes), so a spoofed-low size would evade the cap (the insert-side
 * twin of the media PATCH cap-evasion). HEAD is bodyless (no R2 checksum concern) and server-side
 * (not browser-CORS-bound); R2 is strongly read-after-write consistent, so the object is present
 * immediately after the single PUT / multipart complete. Throws if the object is missing or has no
 * positive size, so the caller fails closed.
 */
export async function headObjectSize(params: { key: string }): Promise<number> {
  const { key } = params;
  const { R2_BUCKET } = assertR2Env();

  const out = await getR2Client().send(
    new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }),
  );
  const size = out.ContentLength;
  if (typeof size !== "number" || size <= 0) {
    throw new Error(`HEAD returned no positive ContentLength for ${key}`);
  }
  return size;
}

/**
 * Short-lived presigned GET URL for media.
 *
 * Two modes from the SAME key:
 *   • omit `downloadFilename` → an INLINE URL the browser renders in <img>/<video>
 *     (the gallery default).
 *   • pass `downloadFilename`  → a SAVE URL: `response-content-disposition=attachment`
 *     is baked into the signature so a plain <a href> downloads the original under
 *     that name. The browser `download` attribute does NOT force a save for a
 *     cross-origin R2 URL — the disposition must be signed in. Because it's a top-
 *     level navigation (not fetch), no bucket-CORS change is needed.
 *
 * `downloadFilename` must be header-safe ASCII (no quotes/controls) — callers use
 * buildDownloadFilename(), which slugs to `[a-z0-9-.]`, so `filename="…"` alone is
 * safe and no RFC-5987 `filename*` encoding is required.
 *
 * `stable: true` (the gallery mode, Phase 3): pins SigV4's signingDate to the
 * current 30-min bucket start (presign-bucket.ts), making the URL DETERMINISTIC
 * within the bucket — identical across polls and viewers, so the browser image
 * cache actually works. TTL becomes 90 min (2x bucket + slack) so a URL minted
 * late in a bucket still outlives the next full bucket; the gallery ETag folds
 * the bucket id in, so clients re-pull fresh URLs on the roll. Upload presigns
 * never use this (each upload is one-shot; freshness is the point there).
 */
export async function presignDownload(params: {
  key: string;
  expiresInSeconds?: number;
  downloadFilename?: string;
  stable?: boolean;
}): Promise<string> {
  const {
    key,
    expiresInSeconds = DEFAULT_DOWNLOAD_TTL_SECONDS,
    downloadFilename,
    stable = false,
  } = params;
  const { R2_BUCKET } = assertR2Env();

  return getSignedUrl(
    getR2Client(),
    new GetObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      ...(downloadFilename && {
        ResponseContentDisposition: `attachment; filename="${downloadFilename}"`,
      }),
    }),
    stable
      ? {
          expiresIn: STABLE_DOWNLOAD_TTL_SECONDS,
          signingDate: new Date(presignBucketStart(Date.now())),
        }
      : { expiresIn: expiresInSeconds },
  );
}
