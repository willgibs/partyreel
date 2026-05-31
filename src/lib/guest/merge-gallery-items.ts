import type { GridMedia } from "@/components/app/media-grid";

/**
 * Render order for the live guest gallery: the guest's own just-uploaded
 * OPTIMISTIC tiles (local blobs) that the server poll hasn't reflected yet,
 * newest-first, THEN the server's approved items (also newest-first).
 *
 * Dedupe by id so an optimistic tile is dropped the instant its real (presigned)
 * server version arrives in the poll — no flicker, no duplicate. Pure so it's
 * unit-tested; the coordinator revokes the blob URL once an optimistic id appears
 * server-side.
 */
export function mergeGalleryItems(
  optimistic: GridMedia[],
  server: GridMedia[],
): GridMedia[] {
  const serverIds = new Set(server.map((m) => m.id));
  const stillPending = optimistic.filter((m) => !serverIds.has(m.id));
  return [...stillPending, ...server];
}
