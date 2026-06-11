/**
 * STABLE-PRESIGN time buckets (Phase 3). SigV4 presigned URLs embed the signing
 * timestamp, so two presigns of the same key normally differ and the browser's
 * image cache misses on every gallery refetch. Pinning `signingDate` to the
 * START of a fixed window makes presigns DETERMINISTIC within that window:
 * identical URLs across polls/viewers, so the browser cache works and the
 * gallery ETag can roll with the bucket (clients re-pull fresh URLs at most
 * once per window, always before the old ones expire).
 *
 * Pure module (no "server-only") so the bucket math is Vitest-loadable; the
 * signing itself stays in presign.ts.
 */

/** Window width. 30 min balances cache stability against URL lifetime. */
export const PRESIGN_BUCKET_MS = 30 * 60_000;

/**
 * TTL for stable gallery read URLs: 2x the bucket + 30 min slack. A URL minted
 * at the END of a bucket (minute 29) still lives 61+ min, >= the previous 60
 * min default, while one minted at the start lives 90 min. Trade-off recorded
 * in docs/systems/uploads-and-r2.md: a leaked gallery URL lives <= 90 min
 * (vs 60 before); these are read-only GETs of single objects.
 */
export const STABLE_DOWNLOAD_TTL_SECONDS = 90 * 60;

/** The bucket's start time (ms epoch) for a given moment — the pinned signingDate. */
export function presignBucketStart(nowMs: number): number {
  return Math.floor(nowMs / PRESIGN_BUCKET_MS) * PRESIGN_BUCKET_MS;
}

/**
 * Opaque bucket identifier for the same moment — folded into the gallery ETag
 * so a bucket roll invalidates conditional requests (clients refetch full
 * payloads with fresh URLs before the old ones expire).
 */
export function presignBucketId(nowMs: number): string {
  return String(presignBucketStart(nowMs) / PRESIGN_BUCKET_MS);
}
