"use client";

import { useEffect, useState } from "react";

import { useMediaQuery } from "@/lib/use-media-query";

/**
 * THE ARRIVAL BEAT (700ms). An entry sheet that opens the instant it hydrates
 * reads as a load artifact rather than a designed entrance. This hook holds
 * the auto-open for a deliberate beat AFTER hydration, so the page settles
 * (Act 1) and THEN the invitation arrives (Act 2) as its own act.
 *
 * Scope is exact: only the AUTO-open waits. A `proceeded` / `openToGate` open
 * (the teaser "See all", the welcome's Continue) is an explicit user action
 * and must stay instant - the caller ORs `ready` with those paths.
 *
 * Durations: first-visit invitation 700ms; a password re-visit 350ms (they
 * already know the page); reduced motion 0 (no delays).
 */
export function useArrivalBeat({
  enabled,
  ms,
}: {
  enabled: boolean;
  ms: number;
}): boolean {
  const reduce = useMediaQuery("(prefers-reduced-motion: reduce)");
  // The "no wait" cases resolve during render (a disabled beat never gates a
  // non-auto-open path; reduced motion / 0ms have no delay) - so the effect
  // only ever sets state ASYNCHRONOUSLY via the timeout (the react-hooks lint
  // forbids a sync setState in an effect).
  const instant = !enabled || reduce || ms <= 0;
  const [timedReady, setTimedReady] = useState(false);

  useEffect(() => {
    if (instant) return;
    const id = setTimeout(() => setTimedReady(true), ms);
    return () => clearTimeout(id);
  }, [instant, ms]);

  return instant || timedReady;
}

/** The beat per current step (first-visit welcome vs password re-visit). */
export const ARRIVAL_BEAT_MS = { welcome: 700, password: 350 } as const;
