"use client";

/**
 * The ACT MACHINE behind every reveal choreography: a script of named acts with
 * hold times, advanced by timers, surfaced as one `act` string the caller stamps
 * onto a stage root as `data-act`. ALL motion then lives in CSS keyed off that
 * attribute (globals.css `[data-rvl-*]` / `[data-rxp-*]`), so the JS never
 * animates anything — it only says which beat we are on.
 *
 * Transplanted VERBATIM from the design lab (reel-reveal-shared.tsx) when the
 * composite reveal was ratified as-built (T2) and promoted to production (R3).
 * The lab still imports its own copy for the other three reference directions;
 * this is the shipped one, and the two must stay behaviourally identical.
 *
 * The script may be a FACTORY, resolved fresh on every run: the composite builds
 * its beats from the `--tune-rvl-*` vars via readCssMs (never a static
 * snapshot), so a motion-tuner drag retimes the very next play.
 *
 * Reduced motion jumps straight to the FINAL act (the honest fallback: arrival
 * without theater) UNLESS the caller hands in a dedicated `reducedScript`; that
 * one PLAYS (the reduce CSS renders every act as a plain fade), keeping the
 * narrative order without the movement.
 */
import { useCallback, useEffect, useRef, useState } from "react";

import { usePrefersReducedMotion } from "./use-prefers-reduced-motion";

export type ActScript<A extends string> = { act: A; holdMs: number }[];

/** The breather before a replay: the pre-state re-enters first, so the reveal
 *  is judged from its real starting point. */
const REPLAY_BREATHER_MS = 700;

export function useRevealActs<A extends string>(
  script: ActScript<A> | (() => ActScript<A>),
  reducedScript?: ActScript<A>,
) {
  const [act, setAct] = useState<A | "idle">("idle");
  const timers = useRef<number[]>([]);
  const reduced = usePrefersReducedMotion();

  const clear = useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  }, []);

  // Timers outlive the render that scheduled them, so an unmount mid-script
  // (the host navigates away while the reveal plays) must drop them or React
  // logs a setState-on-unmounted warning for every remaining beat.
  useEffect(() => clear, [clear]);

  const play = useCallback((steps: ActScript<A>) => {
    let at = 0;
    steps.forEach((step, i) => {
      if (i === 0) setAct(step.act);
      else timers.current.push(window.setTimeout(() => setAct(step.act), at));
      at += step.holdMs;
    });
  }, []);

  const run = useCallback(() => {
    clear();
    if (reduced) {
      if (reducedScript) play(reducedScript);
      else {
        const steps = typeof script === "function" ? script() : script;
        setAct(steps[steps.length - 1].act);
      }
      return;
    }
    play(typeof script === "function" ? script() : script);
  }, [clear, play, reduced, reducedScript, script]);

  const reset = useCallback(() => {
    clear();
    setAct("idle");
  }, [clear]);

  const replay = useCallback(() => {
    reset();
    timers.current.push(window.setTimeout(run, REPLAY_BREATHER_MS));
  }, [reset, run]);

  return { act, run, reset, replay, running: act !== "idle" };
}
