import type { GridMedia } from "@/components/app/media-grid";

/**
 * Reconcile a gallery POLL response against what is already on screen.
 *
 * THE BUG THIS EXISTS TO PREVENT (the album that dies at ~90 minutes):
 * the old reconcile was `items.map((m) => prevById.get(m.id) ?? m)` — it kept
 * the already-rendered object for every known id and therefore DISCARDED the
 * refreshed presigned URLs on every single poll. The intent was right (a new
 * `url` would reload the <img>), but presigned URLs EXPIRE: after
 * STABLE_DOWNLOAD_TTL_SECONDS (90 min) every tile, lightbox and download in a
 * gallery left open on screen answers 403, which is exactly the scenario the
 * product is built for (a host leaving the album up for the evening).
 *
 * WHY A PLAIN "ALWAYS ADOPT" IS SAFE HERE, AND WHY WE STILL DON'T:
 * presigns are STABLE INSIDE A 30-MIN BUCKET (lib/r2/presign-bucket.ts) — the
 * signing timestamp is pinned to the bucket start, so re-presigning the same
 * key inside one bucket yields a BYTE-IDENTICAL URL. A URL therefore only
 * changes when the bucket ROLLS, roughly twice an hour, comfortably before the
 * 90-min TTL. So adopting whenever the payload differs costs at most one
 * refresh per 30 min, and keeping identity the rest of the time means the
 * common poll produces the exact same object references it did before: React
 * sees no changed props and no <img> is touched.
 *
 * The rule: keep the EXISTING object when the incoming row is field-for-field
 * equal, adopt the incoming one whenever anything differs. Equality (not a
 * url-only check) so a late-resolving field — attribution, dimensions, a status
 * flip — is picked up too rather than being pinned to whatever the first render
 * happened to see.
 *
 * Removed items drop and order follows the server (newest-first), same as before.
 */
export function reconcileGalleryItems(
  prev: GridMedia[],
  next: GridMedia[],
): GridMedia[] {
  const prevById = new Map(prev.map((m) => [m.id, m]));
  return next.map((incoming) => {
    const seen = prevById.get(incoming.id);
    return seen && sameMedia(seen, incoming) ? seen : incoming;
  });
}

/**
 * Shallow field-for-field equality. Both sides come from the same server
 * payload shape, so a shallow compare is total; `undefined` and an absent key
 * are treated alike because JSON round-trips drop absent optional fields.
 */
function sameMedia(a: GridMedia, b: GridMedia): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]) as Set<
    keyof GridMedia
  >;
  for (const k of keys) if (a[k] !== b[k]) return false;
  return true;
}
