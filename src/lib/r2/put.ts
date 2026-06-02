/**
 * Server-side direct PUT to R2. For SMALL, server-validated objects that do NOT use the
 * browser→R2 presign flow — currently profile avatars (the re-encoded blob is tiny and we
 * want the server to validate the bytes before they land). Uses the shared getR2Client(), so
 * the checksum-gotcha config (requestChecksumCalculation: "WHEN_REQUIRED") applies here too.
 *
 * Do NOT route large media through this — those use presigned PUT / multipart so the bytes
 * never pass through a Vercel function (see lib/r2/presign.ts, ADR-0003).
 */
import "server-only";

import { PutObjectCommand } from "@aws-sdk/client-s3";

import { assertR2Env } from "@/lib/env";
import { getR2Client } from "@/lib/r2/client";

export async function putR2Object(params: {
  key: string;
  body: Uint8Array;
  contentType: string;
}): Promise<void> {
  const { key, body, contentType } = params;
  const { R2_BUCKET } = assertR2Env();

  await getR2Client().send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}
