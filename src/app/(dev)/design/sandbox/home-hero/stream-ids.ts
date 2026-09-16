/**
 * THE FOUR COMPOSITIONS' IDS, in a module with no imports at all.
 *
 * ★ A SERVER COMPONENT CANNOT READ A CONSTANT OUT OF A CLIENT MODULE. Next
 * replaces every export of a `"use client"` file with a client REFERENCE on the
 * server, so a constant reached through one is an object with none of its
 * properties: `streams.ts` takes `CANVAS` from `@/components/lab`, which is a
 * client barrel, and the scene route's `STREAM_IDS.includes(...)` therefore
 * crashed the whole route at module evaluation with "Cannot read properties of
 * undefined (reading 'w')", a runtime TypeError rather than a type error, and
 * pointing at a line nowhere near the import that caused it (found the first
 * time page.tsx rendered, 2026-09-16; the rounding board's `screen-ids.ts`
 * carries the same note from the first time it happened there).
 *
 * So the ids live here, reachable by anything: the scene route validates its
 * query string against them on the SERVER, `streams.ts` re-exports them, the
 * board builds its cost phases from them. One list, three readers, no boundary
 * crossed. Keep this file free of imports; that is the whole mechanism.
 */

export type StreamId = "band" | "orbit" | "stack-above" | "stack-below";

export const STREAM_IDS: readonly StreamId[] = [
  "band",
  "orbit",
  "stack-above",
  "stack-below",
];

export function isStreamId(value: string | undefined): value is StreamId {
  return !!value && (STREAM_IDS as readonly string[]).includes(value);
}
