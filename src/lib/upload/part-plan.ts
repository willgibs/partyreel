/**
 * Multipart part-size planning — the ONE source for the per-part content
 * lengths both presign routes use, so neither duplicates them inline. Each
 * part's EXACT size is bound into its presign signature, so R2 rejects (403)
 * any over-stuffed body at the edge: parts 1..N-1 carry the fixed part size,
 * the last part carries the remainder.
 *
 * Pure module so the boundary math is Vitest-pinnable.
 */
import {
  MULTIPART_PART_SIZE_BYTES,
  MULTIPART_THRESHOLD_BYTES,
} from "@/lib/media/limits";

/** Single presigned PUT below the threshold; multipart at/above it. */
export function uploadStrategyFor(sizeBytes: number): "single" | "multipart" {
  return sizeBytes < MULTIPART_THRESHOLD_BYTES ? "single" : "multipart";
}

/** The exact content length of every part, in part-number order (1-based). */
export function planParts(sizeBytes: number): number[] {
  const partCount = Math.ceil(sizeBytes / MULTIPART_PART_SIZE_BYTES);
  return Array.from({ length: partCount }, (_, i) =>
    i + 1 < partCount
      ? MULTIPART_PART_SIZE_BYTES
      : sizeBytes - (partCount - 1) * MULTIPART_PART_SIZE_BYTES,
  );
}
