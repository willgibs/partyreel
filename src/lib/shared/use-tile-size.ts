"use client";

import { useState } from "react";

import { type TileSize } from "@/lib/shared/tile-size-cookie";

/**
 * The gallery's tile-size state: optimistic locally, persisted through
 * whatever `onPersist` the caller wires to its own Server Action (the events
 * list's `chooseView` is the house precedent — set state at once, then
 * `void` the write; an await here would make an instant control wait on a
 * round-trip for no visible benefit, since the cookie only matters to the
 * NEXT cold load).
 *
 * Decoupled from any one Server Action on purpose: this hook is `lib/shared`,
 * reusable by a future surface with its OWN cookie-writing action, not wired
 * to the event hub's.
 */
export function useTileSize(
  initialSize: TileSize,
  onPersist: (size: TileSize) => void | Promise<void>,
) {
  const [size, setSize] = useState<TileSize>(initialSize);

  function setTileSize(next: TileSize) {
    if (next === size) return;
    setSize(next);
    void onPersist(next);
  }

  return { size, setTileSize };
}
