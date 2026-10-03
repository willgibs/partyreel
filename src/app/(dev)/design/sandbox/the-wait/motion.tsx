"use client";

import {
  type CSSProperties,
  createContext,
  Fragment,
  type ReactNode,
  type RefObject,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { usePrefersReducedMotion } from "@/lib/shared/use-prefers-reduced-motion";

/**
 * ONE CLOCK FOR A DRAWING THAT MOVES (`the-wait.css` is its other half).
 *
 * Every moving part of a frame is a CSS animation whose delay is its moment on
 * the take's timeline (`--tw-d`), less the clock's reading (`--tw-at`). So one
 * drawing serves three frames:
 *  - LIVE: the clock reads 0 and runs; after the take and a hold the drawing is
 *    mounted again (`cycle`), so it plays from the sheet once more, as the next
 *    guest's first open would;
 *  - HELD at a moment: the clock reads that moment and every animation is
 *    paused there, so a frame shows the develop half way, exactly as the live
 *    one passes through it (a paused animation with a negative delay stands
 *    that far into itself);
 *  - REDUCED MOTION: the same timeline with no movement, drawn as its own pass
 *    whatever the reader's own setting (and the live frame honours hers).
 *
 * ★ A HIDDEN OPTION DRAWS NOTHING UNTIL IT IS SHOWN, AND HOLDS STILL WHILE
 * HIDDEN. The step mounts every option at once and marks all but the shown one
 * `data-paused` (`step.tsx`); five options of four frames each, every one a
 * page of photographs, would otherwise all load and loop at once.
 */

export type Clock = { mode: "live" } | { mode: "held"; at: number };

export const LIVE: Clock = { mode: "live" };
export const held = (at: number): Clock => ({ mode: "held", at });

type PlayState = { reduced: boolean; held: boolean; at: number };

const PlayContext = createContext<PlayState>({
  reduced: false,
  held: false,
  at: 0,
});

/** How the drawing around this part is clocked. */
export const usePlay = () => useContext(PlayContext);

/** The sheet sits still this long before a live take begins, so its first frame is read before it moves. */
const LEAD_MS = 700;

/**
 * WHETHER THIS DRAWING IS OFF THE STAGE: the step marks a hidden option
 * `data-paused` on its view, outside the frame, so a drawing finds it through
 * its frame's own element.
 */
export function useOffStage(ref: RefObject<HTMLElement | null>): boolean {
  const [off, setOff] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const frame = el.ownerDocument.defaultView?.frameElement ?? null;
    const view = (frame ?? el).closest("[data-lab-view]");
    if (!view) return;
    const sync = () => setOff(view.hasAttribute("data-paused"));
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(view, { attributes: true, attributeFilter: ["data-paused"] });
    return () => mo.disconnect();
  }, [ref]);
  return off;
}

/**
 * THE ROOT OF A DRAWING THAT MOVES. `length` is the take's own run (from its
 * first movement to its last) and `rest` how long the album stands after it
 * before a live frame plays again.
 */
export function Play({
  clock,
  forceReduced = false,
  length,
  rest = 2800,
  take,
  children,
}: {
  clock: Clock;
  /** Draw the reduced-motion pass whatever the reader's own setting. */
  forceReduced?: boolean;
  length: number;
  rest?: number;
  /** What the frame's caption calls the take. */
  take: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const off = useOffStage(ref);
  const prefersReduced = usePrefersReducedMotion();
  const reduced = forceReduced || prefersReduced;
  const isHeld = clock.mode === "held";
  const at = clock.mode === "held" ? clock.at : 0;
  const lead = isHeld ? 0 : LEAD_MS;

  // Drawn once it has been shown, and kept: a frame that unloaded on a tab press would load its page again.
  const [seen, setSeen] = useState(false);
  if (!off && !seen) setSeen(true);

  // The live loop: mount the drawing again once the take and its rest have run, while it is on the stage.
  const [cycle, setCycle] = useState(0);
  useEffect(() => {
    if (isHeld || off || !seen) return;
    const win = ref.current?.ownerDocument.defaultView ?? window;
    const timer = win.setTimeout(
      () => setCycle((c) => c + 1),
      lead + length + rest,
    );
    return () => win.clearTimeout(timer);
  }, [isHeld, off, seen, cycle, lead, length, rest]);

  return (
    <div
      ref={ref}
      className="tw-play min-h-full"
      data-tw-take={take}
      data-tw-ms={length}
      data-tw-motion={reduced ? "reduced" : "full"}
      data-tw-held={isHeld ? at : undefined}
      data-tw-paused={off ? "" : undefined}
      style={
        {
          "--tw-at": `${at}ms`,
          "--tw-lead": `${lead}ms`,
        } as CSSProperties
      }
    >
      {seen && (
        <PlayContext.Provider value={{ reduced, held: isHeld, at }}>
          <Fragment key={cycle}>{children}</Fragment>
        </PlayContext.Provider>
      )}
    </div>
  );
}

/** A part's moment on the take's timeline, as the style its animation reads. */
export const at = (ms: number, more?: CSSProperties): CSSProperties =>
  ({ "--tw-d": `${Math.round(ms)}ms`, ...more }) as CSSProperties;

/** An element's place inside `root`, by layout alone (a transform, mid-animation, never moves it). */
export function offsetIn(
  el: HTMLElement,
  root: HTMLElement,
): { x: number; y: number; w: number; h: number } {
  let x = 0;
  let y = 0;
  let node: HTMLElement | null = el;
  while (node && node !== root) {
    x += node.offsetLeft;
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return { x, y, w: el.offsetWidth, h: el.offsetHeight };
}
