"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Live media-query state via useSyncExternalStore (the house hydration-safe
 * pattern, see entry-modal's hydrated flag): the server snapshot is FALSE so
 * SSR never guesses the client's viewport; the real value lands at hydration
 * and tracks changes (resize across a breakpoint, OS reduced-motion flips).
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}
