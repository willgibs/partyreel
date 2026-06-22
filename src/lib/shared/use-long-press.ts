"use client";

import { useCallback, useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

// A small tap-and-hold gesture for entering the gallery album bulk-select (mobile-native; the host
// long-presses a tile to start selecting, seeded with that tile). Called ONCE at the grid level (only
// one press happens at a time), it returns:
//   • bind(id)      → the pointer handlers to spread onto each tile's tap target. No-op handlers when
//                     `onLongPress` is undefined, so the guest / recovery grids are untouched.
//   • consumeClick()→ call at the top of the tile's onClick; returns true if a long-press just fired,
//                     so the host suppresses the click that the browser synthesizes after the hold
//                     (otherwise the press-then-release would ALSO open the lightbox).
// A move beyond the tolerance (a scroll-drag) or an early release cancels the timer, so a normal tap
// and a scroll never trigger select mode.
export function useLongPress(
  onLongPress: ((id: string) => void) | undefined,
  { delayMs = 450, moveTolerance = 10 }: { delayMs?: number; moveTolerance?: number } = {},
) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fired = useRef(false);
  const start = useRef<{ x: number; y: number } | null>(null);

  const cancel = useCallback(() => {
    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    start.current = null;
  }, []);

  const bind = useCallback(
    (id: string) => {
      if (!onLongPress) return {};
      return {
        onPointerDown: (e: ReactPointerEvent) => {
          // Primary press only (ignore right / middle mouse); touch + pen have button 0.
          if (e.pointerType === "mouse" && e.button !== 0) return;
          fired.current = false;
          start.current = { x: e.clientX, y: e.clientY };
          timer.current = setTimeout(() => {
            fired.current = true;
            timer.current = null;
            onLongPress(id);
          }, delayMs);
        },
        onPointerMove: (e: ReactPointerEvent) => {
          if (!start.current) return;
          if (
            Math.abs(e.clientX - start.current.x) > moveTolerance ||
            Math.abs(e.clientY - start.current.y) > moveTolerance
          ) {
            cancel();
          }
        },
        onPointerUp: cancel,
        onPointerCancel: cancel,
        onPointerLeave: cancel,
      };
    },
    [onLongPress, delayMs, moveTolerance, cancel],
  );

  // True (and self-clearing) for exactly the one click that follows a fired long-press.
  const consumeClick = useCallback(() => {
    if (fired.current) {
      fired.current = false;
      return true;
    }
    return false;
  }, []);

  return { bind, consumeClick };
}
