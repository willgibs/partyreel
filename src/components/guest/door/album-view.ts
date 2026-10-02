"use client";

import { useSyncExternalStore } from "react";

/**
 * THE ALBUM SEEN THROUGH THE OPEN DOOR (`locked-door` r2's doorway): the newest previews the doorway
 * shows in its opening, where she may see the album (a Public album's welcome, the moment she is let
 * in). The album that knows its photographs sits under the page's live provider and the door is a
 * sibling island of it, so this is the same module-store shape the door's light keeps for the same
 * reason (`lib/guest/door-light.ts`); `AlbumLightSampler` publishes both.
 *
 * ★ ONLY WHAT THE ALBUM ALREADY SHOWS HER: the provider holds exactly what her access reads (the teaser,
 * or the album), so the doorway can never show more than the page would. Nothing is published at a gate
 * (no provider mounts there), and the doorway draws a photograph only through an OPEN door.
 */

/** How many photographs the opening holds. */
export const DOOR_VIEW_SIZE = 4;

const EMPTY: readonly string[] = [];
let view: readonly string[] = EMPTY;
const listeners = new Set<() => void>();

/** The album's newest previews, newest first (up to `DOOR_VIEW_SIZE`). */
export function publishDoorView(srcs: readonly string[]) {
  const next = srcs.slice(0, DOOR_VIEW_SIZE);
  if (next.join("\n") === view.join("\n")) return;
  view = next.length > 0 ? next : EMPTY;
  for (const listener of listeners) listener();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/** What the open door shows: the album's newest previews, or nothing until the album has said. */
export function useDoorView(): readonly string[] {
  return useSyncExternalStore(
    subscribe,
    () => view,
    () => EMPTY,
  );
}

/** Test seam: forget the view (a module store outlives one test's render). */
export function resetDoorViewForTests() {
  view = EMPTY;
  for (const listener of listeners) listener();
}
