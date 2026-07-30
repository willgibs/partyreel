"use client";

/**
 * Does this person prefer reduced motion? For JS-DRIVEN choreography only (act
 * machines, count-ups, timed handoffs) — CSS motion should gate itself with
 * `motion-reduce:` / a `@media (prefers-reduced-motion: …)` block instead.
 *
 * useSyncExternalStore keeps it setState-free (the media query IS an external
 * store, so there is no effect + no extra render on mount), and the SERVER
 * snapshot is `false` so SSR renders the full-motion markup and the client
 * corrects before anything plays.
 *
 * Transplanted verbatim out of the design lab (marketing-lab-shared.tsx) when
 * the reveal grammar was promoted to production (R3): the lab and the shipped
 * reveal must agree on reduced motion, so they share ONE implementation.
 * NOTE: CanvasReelPlayer has its OWN copy of this store with the opposite
 * server snapshot (`true` = paused), deliberately: a player that autoplays
 * through hydration and then stops is worse than one that starts paused.
 */
import { useSyncExternalStore } from "react";

const REDUCED_MQ = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const mq = window.matchMedia(REDUCED_MQ);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MQ).matches,
    () => false,
  );
}
