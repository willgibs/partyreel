import type { GridMedia } from "@/components/app/media-grid";

/**
 * Reconcile a gallery POLL response against what is already on screen.
 *
 * THE BUG THIS EXISTS TO PREVENT (the album that dies at ~90 minutes): a
 * reconcile of `items.map((m) => prevById.get(m.id) ?? m)` keeps the
 * already-rendered object for every known id and therefore DISCARDS the
 * refreshed presigned URLs on every single poll. The intent is right (a new
 * `url` would reload the <img>), but presigned URLs EXPIRE: after
 * STABLE_DOWNLOAD_TTL_SECONDS (90 min) every tile, lightbox and download in a
 * gallery left open on screen would answer 403, which is exactly the scenario
 * the product is built for (a host leaving the album up for the evening).
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
 * Removed items drop and order follows the server (newest-first).
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
 * THE IDS THAT ARE NEW SINCE THE LAST SNAPSHOT — the arrival, where a new
 * photograph grows into its column under a glow that fades.
 *
 * Pure, and deliberately the poll's OWN answer rather than a timestamp compare:
 * "new" on this page means "not on this screen a moment ago", which is the only
 * definition that works for every way a photograph can reach the album — another
 * guest's upload arriving through the doorbell, a host approving a held item
 * hours after it was sent, a hidden tab catching up on ten at once. A
 * `created_at` window would glow the first of those and miss the second, and a
 * tab that slept through the evening would come back to a screen full of light.
 *
 * ★ THE FIRST SNAPSHOT NEVER GLOWS. `prev` empty is the SEED render (or an
 * access flip's remount), where every id is new and none of it arrived: the
 * album's own entrance stagger is that moment's motion. Callers get an empty
 * set, so there is no "everything lights up on load" state to suppress
 * downstream.
 *
 * ★ IT IS NOT THE OPTIMISTIC TILE'S JOB EITHER. A guest's own upload already
 * has its landing beat (the ~2.5s green check), and the caller keeps these two
 * marks apart: this one is for a photograph somebody ELSE put in the album.
 */
export function newArrivalIds(
  prev: readonly GridMedia[],
  next: readonly GridMedia[],
): Set<string> {
  if (prev.length === 0) return new Set();
  const known = new Set(prev.map((m) => m.id));
  const arrived = new Set<string>();
  for (const m of next) if (!known.has(m.id)) arrived.add(m.id);
  return arrived;
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
