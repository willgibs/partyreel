"use client";

import { type RefObject, useEffect, useRef } from "react";

/**
 * A MOVING FRAME'S CLOCK: a loop of `period` seconds run on the frame's own
 * window, handing each tick the time into the loop. It is the frame's own
 * loop in script, so it keeps the lab's two promises itself:
 *
 *  - ★ REDUCED MOTION HOLDS THE REST: under `prefers-reduced-motion` (the
 *    frame's window answers it as the lab's does) the tick is called once at
 *    `rest` and never again, so the moving frame is a still of its rest;
 *  - ★ A HIDDEN OPTION HOLDS STILL: the lab writes `data-lab-paused` on the
 *    frame's root (`frame-pause.ts`), and a paused frame skips its ticks.
 *
 * `tick` writes what changes every frame (a custom property on an element)
 * itself, and asks React for a render only when a coarse state changes.
 */
export function useLoop(
  ref: RefObject<HTMLElement | null>,
  period: number,
  rest: number,
  tick: (t: number) => void,
  enabled = true,
) {
  useEffect(() => {
    const el = ref.current;
    const win = el?.ownerDocument.defaultView;
    if (!enabled || !el || !win) return;
    if (win.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      tick(rest);
      return;
    }
    const root = el.ownerDocument.documentElement;
    const start = win.performance.now();
    let raf = 0;
    const step = (now: number) => {
      if (!root.hasAttribute("data-lab-paused"))
        tick(((((now - start) / 1000) % period) + period) % period);
      raf = win.requestAnimationFrame(step);
    };
    raf = win.requestAnimationFrame(step);
    return () => win.cancelAnimationFrame(raf);
    // The tick is read fresh each frame through its closure's refs; the loop restarts only for a new element or period.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, period, rest, enabled]);
}

/** One answer of the envelope: quick to rise over `attack` seconds, then slow to settle (`settle`, an e-folding time). */
export function pulse(dt: number, settle = 1.1, attack = 0.09): number {
  if (dt < 0) return 0;
  if (dt < attack) return dt / attack;
  return Math.exp(-(dt - attack) / settle);
}

/** The envelope over a run of events: each answered as it comes, the brightest answer standing. */
export function envelope(
  t: number,
  events: readonly number[],
  settle?: number,
): number {
  let v = 0;
  for (const e of events) v = Math.max(v, pulse(t - e, settle));
  return Math.min(1, v);
}

/**
 * WHATEVER A SURFACE FOCUSES AS IT ARRIVES IS LET GO, in the frame's own
 * document: a step's `autoFocus` (Create's name) or a sheet that focuses its
 * own panel (the door) would take the lab's keys from a reader scrolling past
 * the frame. The ref goes on any element inside the frame.
 */
export function useNoFocus() {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const doc = ref.current?.ownerDocument;
    const win = doc?.defaultView;
    if (!doc || !win) return;
    const letGo = () => {
      // Inside the frame, then the frame itself in the lab's page, so the lab's keys come back to the lab.
      (doc.activeElement as HTMLElement | null)?.blur?.();
      (win.frameElement as HTMLElement | null)?.blur?.();
    };
    const t1 = win.setTimeout(letGo, 60);
    const t2 = win.setTimeout(letGo, 600);
    return () => {
      win.clearTimeout(t1);
      win.clearTimeout(t2);
    };
  }, []);
  return ref;
}
