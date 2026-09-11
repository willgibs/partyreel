"use client";

import { useEffect, useState } from "react";

/**
 * True two animation frames after mount (or at once when `instant`): the honest
 * "entered" flag for an element that must first PAINT at its rest state before
 * its entrance runs. A tile that mounts already carrying its landed classes
 * never transitions, and a single requestAnimationFrame can land in the same
 * frame as the first paint, so the flip waits one more. The album's arrivals
 * grid and its Live | Review photograph each wrote this hook locally; one home
 * since the library phase (2026-09-11), for every fly-recipe consumer to come.
 */
export function useEnteredFrame(instant = false): boolean {
  const [on, setOn] = useState(instant);
  useEffect(() => {
    if (instant) return;
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => setOn(true));
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, [instant]);
  return on || instant;
}
