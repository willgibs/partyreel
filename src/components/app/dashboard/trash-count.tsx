import type { DeletedHostEvent } from "@/lib/db/queries/events";

/**
 * The Trash tab label's "(n)" as a tiny streamed boundary (Phase 5 S1): it
 * awaits the SAME promise as <TrashTab> (one query, two consumers) behind a
 * Suspense whose fallback is the plain "Trash" label, so the count appears
 * when the data lands without blocking the tab row.
 */
export async function TrashCount({
  deletedPromise,
}: {
  deletedPromise: Promise<DeletedHostEvent[]>;
}) {
  const deleted = await deletedPromise;
  return <>Trash{deleted.length > 0 ? ` (${deleted.length})` : ""}</>;
}
