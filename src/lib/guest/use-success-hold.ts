"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * THE SUCCESS HOLD (Phase 4.5 S5). On unlock, the gate forms fire
 * router.refresh() and the derived-open machine would slam the sheet shut the
 * instant the RSC drops the gate - no success feedback, an abrupt swap (Will's
 * "zero feedback" note). This hook holds the sheet on a success BEAT (the
 * entry surface shows "You're in") that also MASKS the ~200-400ms refresh
 * roundtrip, then releases into the reveal.
 *
 * The contract:
 * - onUnlocked() records the step that succeeded and starts the hold.
 * - The refresh "landing" is detected with ZERO new plumbing: the RSC
 *   re-derives `current` (the gate drops -> null for the full path, or -> the
 *   next gate for a double-gated event). `current` changing FROM the held step
 *   means the server caught up.
 * - Release = the beat elapsed AND the refresh landed. On a full unlock
 *   (current -> null) the derived close then runs and the gallery reveals; on
 *   a lighter password->account hop the held view simply hands off forward (no
 *   celebration, no exit).
 * - It must never strand: `slow` (>1.5s) swaps the copy to "Opening the
 *   gallery"; the watchdog (8s with no landing = a hung/failed refresh) raises
 *   `stalled` so the surface can offer Retry. The unlock cookie is already
 *   set, so a retry (or reload) always recovers; the form never reappears.
 *
 * Timer-driven via setTimeout (fake-timer friendly); the release runs as a
 * render-time bail-out (the sanctioned adjust-state-during-render pattern), so
 * no ref is read during render and no setState fires synchronously in an effect.
 */
export function useSuccessHold({
  current,
  minBeatMs = 900,
  slowMs = 1500,
  watchdogMs = 8000,
}: {
  /** The entry machine's current step (null once all gates are satisfied). */
  current: string | null;
  minBeatMs?: number;
  slowMs?: number;
  watchdogMs?: number;
}): {
  holding: boolean;
  /** The step the success fired on (drives the held in-place morph view). */
  heldStep: string | null;
  /** Past the slow threshold but still holding: swap to "Opening the gallery". */
  slow: boolean;
  /** The refresh hung past the watchdog: offer Retry. */
  stalled: boolean;
  onUnlocked: () => void;
} {
  const [holding, setHolding] = useState(false);
  const [heldStep, setHeldStep] = useState<string | null>(null);
  const [beatDone, setBeatDone] = useState(false);
  const [slow, setSlow] = useState(false);
  const [stalled, setStalled] = useState(false);
  // Idempotence guard read inside the callback (state would be stale there).
  const holdingRef = useRef(false);

  const onUnlocked = useCallback(() => {
    // Idempotent: a second success signal mid-hold must not re-anchor
    // heldStep (it could record the LANDED step and brick the release).
    if (holdingRef.current) return;
    holdingRef.current = true;
    setHeldStep(current);
    setHolding(true);
    setBeatDone(false);
    setSlow(false);
    setStalled(false);
  }, [current]);

  useEffect(() => {
    if (!holding) return;
    const beat = setTimeout(() => setBeatDone(true), minBeatMs);
    const slowT = setTimeout(() => setSlow(true), slowMs);
    const dog = setTimeout(() => setStalled(true), watchdogMs);
    return () => {
      clearTimeout(beat);
      clearTimeout(slowT);
      clearTimeout(dog);
    };
  }, [holding, minBeatMs, slowMs, watchdogMs]);

  // The refresh landed when `current` moved off the step we held on.
  const landed = holding && current !== heldStep;

  // Release as a render-time bail-out once the beat is done AND the server
  // caught up. setState-during-render of THIS component is the sanctioned
  // pattern (it re-renders before committing; no effect, no ref read).
  if (holding && beatDone && landed) {
    setHolding(false);
  }

  // Keep the idempotence latch in sync post-commit (re-arms after a release,
  // e.g. for the account gate that follows a password unlock).
  useEffect(() => {
    holdingRef.current = holding;
  }, [holding]);

  return {
    holding,
    heldStep: holding ? heldStep : null,
    slow: holding && slow,
    // Only stalled while genuinely stuck (a landed refresh is releasing, not stalled).
    stalled: holding && stalled && !landed,
    onUnlocked,
  };
}
