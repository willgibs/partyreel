"use client";

import { useState } from "react";

import type { RowStep } from "@/lib/shared/album-rows";
import { type TileSize } from "@/lib/shared/tile-size-cookie";

/**
 * A device preference the server paints the first frame with: optimistic
 * locally, persisted through whatever `onPersist` the caller wires to its own
 * Server Action (the events list's `chooseView` is the house precedent — set
 * state at once, then `void` the write; an await here would make an instant
 * control wait on a round-trip for no visible benefit, since the cookie only
 * matters to the NEXT cold load).
 *
 * Decoupled from any one Server Action on purpose: this hook is `lib/shared`,
 * reusable by a future surface with its OWN cookie-writing action, not wired
 * to the event hub's.
 */
function useDevicePreference<T>(
  initial: T,
  onPersist: (value: T) => void | Promise<void>,
): [T, (next: T) => void] {
  const [value, setValue] = useState<T>(initial);
  function choose(next: T) {
    if (Object.is(next, value)) return;
    setValue(next);
    void onPersist(next);
  }
  return [value, choose];
}

/** The masonry's tile width (`--album-column`), until the last masonry surface switches. */
export function useTileSize(
  initialSize: TileSize,
  onPersist: (size: TileSize) => void | Promise<void>,
) {
  const [size, setTileSize] = useDevicePreference(initialSize, onPersist);
  return { size, setTileSize };
}

/**
 * The justified rows' density step (`album-columns` r2: three steps, one index
 * in the shared `pr_tile_size` cookie, read with `resolveRowStep`). The View
 * menu's slider, a pinch and a ctrl-wheel all set it through `setRowStep`.
 */
export function useRowStep(
  initialStep: RowStep,
  onPersist: (step: RowStep) => void | Promise<void>,
) {
  const [step, setRowStep] = useDevicePreference(initialStep, onPersist);
  return { step, setRowStep };
}
