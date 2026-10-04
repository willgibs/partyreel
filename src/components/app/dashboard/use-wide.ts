"use client";

/**
 * Is the window as wide as a tablet (Tailwind's `sm`, 640px)? For the one choice CSS cannot make: which SIZE of
 * tile a row draws (a tile's type is a prop, not a class), as the Recent row's four covers need at a desk and
 * its swipe strip needs in a hand. Everything else about the two shapes is CSS.
 *
 * useSyncExternalStore keeps it setState-free, and the SERVER snapshot is `true` (a desk), so a desk never sees
 * a restyle; a phone corrects its tiles' type on hydration, inside boxes whose size is fixed by their aspect
 * ratio, so nothing moves.
 */
import { useSyncExternalStore } from "react";

const WIDE_MQ = "(min-width: 640px)";

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(WIDE_MQ);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

export function useWide(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(WIDE_MQ).matches,
    () => true,
  );
}
