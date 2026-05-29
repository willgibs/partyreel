/**
 * R2 delete + list helpers for the Phase-3 purge cron. Server-only — they sign
 * with the R2 secret.
 *
 * These are the ONLY write/list paths into the bucket outside the upload flow.
 * The cron deletes R2 objects BEFORE deleting DB rows (R2-then-rows), so these
 * must be safe to retry: deleting an already-absent key is a SUCCESS in S3/R2, so
 * a re-run after a partial failure is idempotent.
 */
import "server-only";

import { DeleteObjectsCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";

import { assertR2Env } from "@/lib/env";
import { getR2Client } from "@/lib/r2/client";

/** S3/R2 hard cap: at most 1000 keys per DeleteObjects request. */
const MAX_DELETE_KEYS = 1000;

export type DeleteObjectsResult = {
  /** Keys S3/R2 considered handled (deleted OR already absent). */
  deleted: number;
  /** Per-key failures; non-empty means the caller should NOT yet delete the rows. */
  errored: { key: string; code?: string; message?: string }[];
};

/**
 * Delete many keys, chunked to the 1000-key cap. Quiet mode: the response carries
 * only failures, so anything NOT in Errors succeeded — including keys that were
 * already gone (that's the idempotency guarantee). `deleted` is therefore
 * chunk size minus the chunk's error count.
 */
export async function deleteR2Objects(
  keys: string[],
): Promise<DeleteObjectsResult> {
  const result: DeleteObjectsResult = { deleted: 0, errored: [] };
  if (keys.length === 0) return result;

  const { R2_BUCKET } = assertR2Env();
  const client = getR2Client();

  for (let i = 0; i < keys.length; i += MAX_DELETE_KEYS) {
    const chunk = keys.slice(i, i + MAX_DELETE_KEYS);
    const out = await client.send(
      new DeleteObjectsCommand({
        Bucket: R2_BUCKET,
        Delete: { Objects: chunk.map((Key) => ({ Key })), Quiet: true },
      }),
    );
    const errors = out.Errors ?? [];
    for (const e of errors) {
      result.errored.push({
        key: e.Key ?? "",
        code: e.Code,
        message: e.Message,
      });
    }
    result.deleted += chunk.length - errors.length;
  }

  return result;
}

export type R2Object = {
  key: string;
  size: number;
  lastModified: Date | null;
};

/**
 * One page of objects under a prefix. The caller drives pagination (feed
 * `nextToken` back as `continuationToken`) so the cron can cap pages per run —
 * see the orphan sweep. `nextToken` is null when the listing is exhausted.
 */
export async function listR2Objects(params: {
  prefix?: string;
  continuationToken?: string;
  maxKeys?: number;
}): Promise<{ objects: R2Object[]; nextToken: string | null }> {
  const { prefix, continuationToken, maxKeys } = params;
  const { R2_BUCKET } = assertR2Env();

  const out = await getR2Client().send(
    new ListObjectsV2Command({
      Bucket: R2_BUCKET,
      Prefix: prefix,
      ContinuationToken: continuationToken,
      MaxKeys: maxKeys,
    }),
  );

  const objects: R2Object[] = (out.Contents ?? []).map((o) => ({
    key: o.Key ?? "",
    size: o.Size ?? 0,
    lastModified: o.LastModified ?? null,
  }));

  return {
    objects,
    nextToken: out.IsTruncated ? (out.NextContinuationToken ?? null) : null,
  };
}
