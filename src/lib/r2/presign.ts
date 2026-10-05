/**
 * Presigned-URL helpers for browser → R2 direct uploads + gallery reads.
 * Server-only — these sign with the R2 secret.
 *
 * Upload strategy (uploads-and-r2.md): the browser uploads directly to R2 via presigned
 * URLs. Files under MULTIPART_THRESHOLD_BYTES use a single presigned PUT; larger
 * files use multipart (create → presign each part → browser PUTs parts →
 * complete). Bytes NEVER pass through a Vercel function.
 *
 * ⚠️ GOTCHAS (kept honored below):
 *   • Single PUT: sign `content-type` (a bound header) and the browser MUST send
 *     the exact same Content-Type, or R2 returns SignatureDoesNotMatch.
 *   • Multipart completion needs each part's ETag → bucket CORS must expose ETag
 *     (ExposeHeaders: ["ETag"]). Parts must be sorted ascending on complete.
 *   • Always presign over KEYS from lib/r2/keys.ts; the caller derives the key
 *     server-side from the capability token — never from client input.
 *   • Read URLs (gallery) presign STABLE (signing date pinned to 30-min buckets
 *     — see presign-bucket.ts + presignDownload's `stable` flag); a per-media
 *     proxy for very large galleries stays deferred (ROADMAP).
 *   • ★ The three presigns below are signed by hand (sigv4.ts, compute-presign
 *     2026-10-04), byte-identical to the SDK's getSignedUrl for the same inputs
 *     (presign.test.ts holds the corpus) at a fraction of its CPU; the SDK still
 *     SENDS the multipart, HEAD and COPY calls, and loads on the first of them
 *     (client.ts), never when this module is imported: a page that only presigns
 *     never pays for it.
 */
import "server-only";

import type { ListPartsCommandOutput } from "@aws-sdk/client-s3";

import { assertR2Env } from "@/lib/env";
import { getR2 } from "@/lib/r2/client";
import {
  STABLE_DOWNLOAD_TTL_SECONDS,
  presignBucketStart,
} from "@/lib/r2/presign-bucket";
import { type R2Presigner, createR2Presigner } from "@/lib/r2/sigv4";

// 2 h. A multipart upload presigns ALL its part URLs up front (in the presign route's
// Promise.all), so the whole transfer must finish before they expire. At the 10 GB ceiling
// that's ~640 parts; 2 h covers a 10 GB upload at ~12 Mbps (within median uplinks). SigV4
// caps presigned-URL lifetime at 7 days; this is a write-only PUT to a server-derived key,
// still gated by the authoritative complete-upload RPC, so a longer window is low-risk.
const DEFAULT_UPLOAD_TTL_SECONDS = 2 * 60 * 60;
const DEFAULT_DOWNLOAD_TTL_SECONDS = 60 * 60; // 1 h — gallery read URLs

// Memoized across requests in a warm lambda (as client.ts memoizes the S3 client), so its derived signing key is
// made once a day; built lazily so the app still boots without R2 creds.
let presigner: R2Presigner | null = null;

function getPresigner(): R2Presigner {
  if (presigner) return presigner;
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET } =
    assertR2Env();
  presigner = createR2Presigner({
    accountId: R2_ACCOUNT_ID,
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
    bucket: R2_BUCKET,
  });
  return presigner;
}

/** A bound Content-Length is a whole, non-negative byte count, written as plain digits. */
function assertByteCount(contentLength: number, where: string): void {
  if (!Number.isSafeInteger(contentLength) || contentLength < 0) {
    throw new Error(`${where}: ${contentLength} is not a byte count.`);
  }
}

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
  // The SDK silently left an empty type unbound (and signed any length it was handed); a PUT that binds no type, or
  // a length that is no byte count, is refused here instead. The pipeline never sends either (an allow-listed MIME,
  // a schema-capped size), so this only fails closed.
  if (!contentType) throw new Error("presignUpload: an empty content type.");
  assertByteCount(contentLength, "presignUpload");

  const url = getPresigner()({
    method: "PUT",
    key,
    query: { "x-id": "PutObject" },
    headers: {
      "content-length": String(contentLength),
      "content-type": contentType,
    },
    expiresInSeconds,
    signingDate: new Date(),
  });

  return { url, headers: { "Content-Type": contentType } };
}

/** Begin a multipart upload; returns the uploadId R2 assigns. */
export async function createMultipartUpload(params: {
  key: string;
  contentType: string;
}): Promise<{ uploadId: string }> {
  const { key, contentType } = params;
  const { R2_BUCKET } = assertR2Env();
  const { client, sdk } = await getR2();

  const out = await client.send(
    new sdk.CreateMultipartUploadCommand({
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
  // S3 numbers parts 1 to 10,000; the SDK signed whatever it was handed, this refuses anything else.
  if (!Number.isInteger(partNumber) || partNumber < 1 || partNumber > 10_000) {
    throw new Error(`presignUploadPart: no part ${partNumber}.`);
  }
  if (!uploadId) throw new Error("presignUploadPart: an empty upload id.");
  assertByteCount(contentLength, "presignUploadPart");

  const url = getPresigner()({
    method: "PUT",
    key,
    query: {
      "x-id": "UploadPart",
      partNumber: String(partNumber),
      uploadId,
    },
    headers: { "content-length": String(contentLength) },
    expiresInSeconds,
    signingDate: new Date(),
  });

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
  const { client, sdk } = await getR2();

  // S3/R2 require parts in ascending PartNumber order; ETags pass through verbatim.
  const ordered = [...parts].sort((a, b) => a.partNumber - b.partNumber);

  await client.send(
    new sdk.CompleteMultipartUploadCommand({
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
  const { client, sdk } = await getR2();
  let total = 0;
  let partNumberMarker: string | undefined = undefined;
  // Bounded: at the 10 GB ceiling that's 640 parts (1 page); the cap is a runaway backstop.
  for (let page = 0; page < 50; page++) {
    const out: ListPartsCommandOutput = await client.send(
      new sdk.ListPartsCommand({
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
  const { client, sdk } = await getR2();
  await client.send(
    new sdk.AbortMultipartUploadCommand({
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
  const { client, sdk } = await getR2();

  const out = await client.send(
    new sdk.HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }),
  );
  const size = out.ContentLength;
  if (typeof size !== "number" || size <= 0) {
    throw new Error(`HEAD returned no positive ContentLength for ${key}`);
  }
  return size;
}

/**
 * ★ A SERVER-SIDE COPY WITHIN THE BUCKET (upload-meter's staging): the complete copies a staged single PUT into its
 * `events/` key before the row is written. One Class A operation and no byte through a function; a staged object is a
 * single PUT, so at most the multipart threshold, far under CopyObject's 5 GiB. Content-Type travels with the object
 * (the default COPY directive). Throws on any R2 error, a source gone included (`NoSuchKey`), so the caller decides.
 */
export async function copyObject(params: {
  sourceKey: string;
  destinationKey: string;
}): Promise<void> {
  const { sourceKey, destinationKey } = params;
  // Our keys are uuids, kinds, variants and extensions: nothing a CopySource must escape. Anything else is refused
  // rather than escaped, since no caller has a reason to copy it.
  if (!/^[A-Za-z0-9._/-]+$/.test(sourceKey)) {
    throw new Error(
      `copyObject: refusing an unescaped source key: ${sourceKey}`,
    );
  }
  const { R2_BUCKET } = assertR2Env();
  const { client, sdk } = await getR2();
  await client.send(
    new sdk.CopyObjectCommand({
      Bucket: R2_BUCKET,
      Key: destinationKey,
      CopySource: `${R2_BUCKET}/${sourceKey}`,
    }),
  );
}

/**
 * Non-throwing HEAD: returns the object's size + LastModified, or null when it's absent. Used by the
 * reel-render completion check — a present object whose LastModified is AT/AFTER the render's start is
 * THIS render's output (the .mp4 lands ~60-90s after start; a stale prior render at the same stable key
 * is minutes/hours older, so the timestamp disambiguates the overwrite). A NotFound/403 → null (still
 * rendering / not there). Server-side HEAD, R2 is strongly read-after-write consistent.
 */
export async function headObject(params: {
  key: string;
}): Promise<{ size: number; lastModified: Date | null } | null> {
  const { key } = params;
  const { R2_BUCKET } = assertR2Env();
  // Outside the try: only R2's answer reads as "absent". A client that cannot be made (no credentials, an SDK that
  // would not load) throws, like every other send, rather than telling the render check its object is not there.
  const { client, sdk } = await getR2();
  try {
    const out = await client.send(
      new sdk.HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }),
    );
    return {
      size: out.ContentLength ?? 0,
      lastModified: out.LastModified ?? null,
    };
  } catch {
    return null;
  }
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

  return getPresigner()({
    method: "GET",
    key,
    query: {
      "x-id": "GetObject",
      ...(downloadFilename && {
        "response-content-disposition": `attachment; filename="${downloadFilename}"`,
      }),
    },
    expiresInSeconds: stable ? STABLE_DOWNLOAD_TTL_SECONDS : expiresInSeconds,
    signingDate: stable ? new Date(presignBucketStart(Date.now())) : new Date(),
  });
}
