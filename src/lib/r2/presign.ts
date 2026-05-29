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
 *   • Read URLs (gallery) get a short TTL; per-request presign for now (large-
 *     gallery proxy strategy is deferred — see docs/STATUS.md).
 */
import "server-only";

import {
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  GetObjectCommand,
  PutObjectCommand,
  UploadPartCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { assertR2Env } from "@/lib/env";
import { getR2Client } from "@/lib/r2/client";

const DEFAULT_UPLOAD_TTL_SECONDS = 15 * 60; // 15 min — room for a 50 MB mobile PUT
const DEFAULT_DOWNLOAD_TTL_SECONDS = 60 * 60; // 1 h — gallery read URLs

export type PresignedUpload = {
  url: string;
  /** Headers the browser must echo verbatim on the PUT (e.g. Content-Type). */
  headers: Record<string, string>;
};

/** Single presigned PUT for small files. */
export async function presignUpload(params: {
  key: string;
  contentType: string;
  expiresInSeconds?: number;
}): Promise<PresignedUpload> {
  const {
    key,
    contentType,
    expiresInSeconds = DEFAULT_UPLOAD_TTL_SECONDS,
  } = params;
  const { R2_BUCKET } = assertR2Env();

  const url = await getSignedUrl(
    getR2Client(),
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn: expiresInSeconds, signableHeaders: new Set(["content-type"]) },
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

/** Presign a single part PUT within an in-progress multipart upload. */
export async function presignUploadPart(params: {
  key: string;
  uploadId: string;
  partNumber: number;
  expiresInSeconds?: number;
}): Promise<{ url: string }> {
  const {
    key,
    uploadId,
    partNumber,
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
    }),
    { expiresIn: expiresInSeconds },
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

/** Short-lived presigned GET URL for rendering media in a gallery. */
export async function presignDownload(params: {
  key: string;
  expiresInSeconds?: number;
}): Promise<string> {
  const { key, expiresInSeconds = DEFAULT_DOWNLOAD_TTL_SECONDS } = params;
  const { R2_BUCKET } = assertR2Env();

  return getSignedUrl(
    getR2Client(),
    new GetObjectCommand({ Bucket: R2_BUCKET, Key: key }),
    { expiresIn: expiresInSeconds },
  );
}
