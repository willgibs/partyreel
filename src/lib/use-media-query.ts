"use client";

import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
} from "react";

/**
 * THE WINDOW A SUBTREE IS DRAWN IN (lab-frame, from ROADMAP's line on the
 * lab's frame: "a frame at 375 draws a component's desk branch").
 *
 * Nothing in the product provides one, so every query below reads the page's
 * own `window`, exactly as it always has (`use-media-query.test.tsx` pins it).
 * The one provider is the design lab's portalled `Frame`: a production
 * component drawn there is the lab's React tree in the frame's document, so
 * its `window` is the LAB's, and a frame 375 wide answered `(min-width: 640px)`
 * with the lab's 1440 (Settings' popup stood as a desk's panel in a phone's
 * frame). The frame hands its own window here, as it hands its body to
 * `usePortalContainer`, and the component answers for the width it is drawn at.
 */
const MediaWindowContext = createContext<Window | null>(null);

export const MediaWindowProvider = MediaWindowContext.Provider;

/**
 * Live media-query state via useSyncExternalStore (the house hydration-safe
 * pattern, see `useHydrated`): the server snapshot is FALSE so
 * SSR never guesses the client's viewport; the real value lands at hydration
 * and tracks changes (resize across a breakpoint, OS reduced-motion flips).
 */
export function useMediaQuery(query: string): boolean {
  const drawnIn = useContext(MediaWindowContext);
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = (drawnIn ?? window).matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query, drawnIn],
  );
  return useSyncExternalStore(
    subscribe,
    () => (drawnIn ?? window).matchMedia(query).matches,
    () => false,
  );
}
