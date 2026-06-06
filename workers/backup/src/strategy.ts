// Pure copy-strategy helpers for the media-backup Worker (ADR-0013, Pillar B).
// NO Worker globals here on purpose — this module is unit-tested in plain Node (strategy.test.ts).

// Objects at or below this size are copied with a single streaming put; larger objects use the R2
// multipart binding API (ranged reads -> uploadPart). Mirrors the app's own 100 MB multipart
// threshold (src/lib/media/limits.ts MULTIPART_THRESHOLD_BYTES). A single streaming put of the
// whole body works up to R2's ~5 GiB single-upload limit, but for multi-GB videos we prefer
// multipart: bounded memory + each part is an independent, retryable subrequest.
export const SINGLE_PUT_MAX_BYTES = 100 * 1024 * 1024; // 100 MiB

// Part size for multipart copies. R2 requires every part EXCEPT the last to be the same size and
// >= 5 MiB. 32 MiB keeps the part/subrequest count low for big files (a 5 GB object = ~160 parts =
// ~320 subrequests, well under the 1000-subrequest Worker limit) while one buffered part stays far
// under the 128 MB Worker memory limit. Built for R2's ~5 GB single-object ceiling, not just today's
// 2 GB cap, so the proposed unified 5 GB upload limit needs no Worker change.
export const COPY_PART_BYTES = 32 * 1024 * 1024; // 32 MiB

/** True when an object should be copied via the multipart API rather than a single streaming put. */
export function needsMultipart(sizeBytes: number): boolean {
  return sizeBytes > SINGLE_PUT_MAX_BYTES;
}

export type PartRange = { partNumber: number; offset: number; length: number };

/**
 * Split [0, sizeBytes) into equal `partBytes` ranges (the last is shorter). 1-indexed partNumber,
 * matching R2/S3 multipart semantics. Returns [] for a non-positive size.
 */
export function partRanges(
  sizeBytes: number,
  partBytes: number = COPY_PART_BYTES,
): PartRange[] {
  if (sizeBytes <= 0) return [];
  const ranges: PartRange[] = [];
  let partNumber = 1;
  for (let offset = 0; offset < sizeBytes; offset += partBytes) {
    ranges.push({
      partNumber,
      offset,
      length: Math.min(partBytes, sizeBytes - offset),
    });
    partNumber++;
  }
  return ranges;
}
