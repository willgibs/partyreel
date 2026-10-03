"use client";

import { useEffect } from "react";

/**
 * A SCREEN CAUGHT IN USE (Will: "including a couple in UI examples to get a
 * feel for both in use"): a few presses made the real way once the page has
 * settled, each at its moment, so a frame holds the moment a system is judged
 * in (a field being typed in, a menu open), and every option is caught in the
 * very same one.
 *
 * ★ THE FOCUS IS LET GO AFTER THE LAST STEP. A script's click leaves the
 * browser's focus on whatever it pressed, which draws a focus mark no person
 * saw; a mark the frame means to show is pinned (`data-demo="focus"`), the
 * sheet's own rule, so it is the same in every capture and never blinks.
 */
export function useInUse(steps: readonly (readonly [number, () => void])[]) {
  useEffect(() => {
    const last = Math.max(0, ...steps.map(([ms]) => ms));
    const timers = steps.map(([ms, run]) => window.setTimeout(run, ms));
    timers.push(
      window.setTimeout(
        () => (document.activeElement as HTMLElement | null)?.blur?.(),
        last + 250,
      ),
    );
    return () => timers.forEach((t) => window.clearTimeout(t));
    // The steps are the screen's script, written once: they never change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
