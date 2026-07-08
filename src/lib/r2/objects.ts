/**
 * Server-side R2 object operations for evidence preservation (ADR-0020). No presigning here —
 * these run entirely server-side with the R2 credentials; no URL (and no key) ever reaches a
 * browser from this module.
 */
import "server-only";

import {
  CompleteMultipartUploadCommand,
  CopyObjectCommand,
  CreateMultipartUploadCommand,
  HeadObjectCommand,
  PutObjectCommand,
  UploadPartCopyCommand,
} from "@aws-sdk/client-s3";

import { assertR2Env } from "@/lib/env";
import { getR2Client } from "@/lib/r2/client";

// S3/R2 cap a single CopyObject at 5 GB; our per-upload ceiling is 10 GB, so big videos must be
// copied as ranged UploadPartCopy parts. Stay comfortably under the cap.
const SINGLE_COPY_LIMIT_BYTES = 4 * 1024 ** 3;
const COPY_PART_BYTES = 1024 ** 3; // 1 GiB ranges → ≤10 parts at the ceiling

/**
 * Server-side copy of one stored object to another key IN the bucket (the preserve action's
 * original → preservation-prefix copy). Handles the CopyObject 5 GB limit transparently via a
 * multipart ranged copy; bytes never leave Cloudflare. Throws on any failure (the caller audits
 * the outcome — a silent partial preserve would be worse than a loud one).
 */
export async function copyObject(params: {
  sourceKey: string;
  destKey: string;
}): Promise<void> {
  const { sourceKey, destKey } = params;
  const { R2_BUCKET } = assertR2Env();
  const client = getR2Client();

  const head = await client.send(
    new HeadObjectCommand({ Bucket: R2_BUCKET, Key: sourceKey }),
  );
  const size = head.ContentLength ?? 0;
  if (size <= 0)
    throw new Error(`source object missing or empty: ${sourceKey}`);
  // CopySource is <bucket>/<key>, URI-encoded per segment (keys here are UUID-safe, but encode anyway).
  const copySource = `${R2_BUCKET}/${encodeURIComponent(sourceKey).replaceAll("%2F", "/")}`;

  if (size <= SINGLE_COPY_LIMIT_BYTES) {
    await client.send(
      new CopyObjectCommand({
        Bucket: R2_BUCKET,
        Key: destKey,
        CopySource: copySource,
      }),
    );
    return;
  }

  const { UploadId: uploadId } = await client.send(
    new CreateMultipartUploadCommand({
      Bucket: R2_BUCKET,
      Key: destKey,
      ContentType: head.ContentType,
    }),
  );
  if (!uploadId) throw new Error("R2 did not return an UploadId for the copy.");

  const parts: { ETag: string; PartNumber: number }[] = [];
  for (
    let start = 0, partNumber = 1;
    start < size;
    start += COPY_PART_BYTES, partNumber++
  ) {
    const end = Math.min(start + COPY_PART_BYTES, size) - 1; // byte range is INCLUSIVE
    const out = await client.send(
      new UploadPartCopyCommand({
        Bucket: R2_BUCKET,
        Key: destKey,
        UploadId: uploadId,
        PartNumber: partNumber,
        CopySource: copySource,
        CopySourceRange: `bytes=${start}-${end}`,
      }),
    );
    const eTag = out.CopyPartResult?.ETag;
    if (!eTag) throw new Error(`part ${partNumber} copy returned no ETag`);
    parts.push({ ETag: eTag, PartNumber: partNumber });
  }

  await client.send(
    new CompleteMultipartUploadCommand({
      Bucket: R2_BUCKET,
      Key: destKey,
      UploadId: uploadId,
      MultipartUpload: { Parts: parts },
    }),
  );
}

/** PUT a small JSON document (the forensics evidence snapshot) at a server-derived key. */
export async function putJsonObject(params: {
  key: string;
  body: unknown;
}): Promise<void> {
  const { key, body } = params;
  const { R2_BUCKET } = assertR2Env();
  await getR2Client().send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: JSON.stringify(body, null, 2),
      ContentType: "application/json",
    }),
  );
}
