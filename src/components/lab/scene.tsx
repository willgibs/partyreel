"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

import { useLabPrefs } from "./lab-prefs";

/**
 * THE TWO PIECES UNDER EVERY BOARD'S OWN `Scene`, LIFTED HERE BECAUSE THEY
 * NEVER VARIED (the rulings round's ROADMAP line, widened by the Orchestrator's
 * maps): `Fit` was copied byte-for-byte into twelve board files (`guest-capture`,
 * `host-curation`, `host-storage`, `identity-claims`, `identity-door`,
 * `identity-profile`, `profile-page`, `reel-cut`, `reel-front`, `reel-host`,
 * `voice-guest`, `reel-screen/wall.tsx`), and `Measured` matched `guest-capture`'s
 * in most of the rest, with small variants elsewhere and `voice-guest` carrying a
 * strict superset (a re-measure once the webfont settles, folded into the one
 * copy below rather than kept as a thing only one board did).
 *
 * ★ `Scene` STAYS PER BOARD, ON PURPOSE — IT IS NOT LIFTED HERE. Its props
 * differ board to board (`screen`, `short`, `tall`, a `caption` that is
 * sometimes a string and sometimes a node, a `measure` that is sometimes
 * required and sometimes absent), and a board's directory is deleted whole at
 * its ruling, so the signature painted over this machinery is never the part
 * worth sharing. `site-chrome/stage.tsx` carries a wholly different `Scene`
 * with its own `Measured` TYPE (a three-number shape, not this component),
 * built for a different measuring job; it has no call on this file either.
 */

/** Zoom-fits a portalled frame to the lab's own Fit preference (a bare
 *  `Frame` has no opinion of its own). Zooming is honest: `zoom` on an
 *  ancestor scales the picture and leaves the iframe's own viewport, and
 *  therefore every breakpoint, alone. */
export function Fit({ w, children }: { w: number; children: ReactNode }) {
  const { fit } = useLabPrefs();
  const zoomed = fit === "zoom";
  const box = useRef<HTMLDivElement | null>(null);
  const [room, setRoom] = useState<number | null>(null);

  useEffect(() => {
    const el = box.current;
    if (!el || !zoomed) return;
    const sync = () => setRoom(el.getBoundingClientRect().width);
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, [zoomed]);

  const k = zoomed && room ? Math.min(1, room / w) : 1;
  return (
    <div
      ref={box}
      data-stage-fit={zoomed ? "zoom" : "true"}
      className={zoomed ? "min-w-0 overflow-hidden" : "min-w-0 overflow-x-auto"}
    >
      <div style={{ width: w, zoom: k }}>{children}</div>
    </div>
  );
}

/** The default read schedule: soon, then twice more as late layout (a
 *  webfont, a decoding photograph) settles. A board whose own pass lands
 *  later reaches for the `timers` prop instead of this default shrinking for
 *  everyone else (`reel-cut`'s engine draws in eighteen sequential passes and
 *  reads out to 6000ms; `reel-screen`'s wall reads out to 2200ms). */
const DEFAULT_TIMERS = [200, 900, 1800];

/**
 * A number read off the frame's own document, never computed: the discipline
 * every board on the desk holds its captions to (docs/PROGRAM.md: a board once
 * drew a formula with its sign backwards and the tile Will judged showed the
 * opposite of its words; if the words above a frame and the caption under it
 * disagree, the caption is the truth).
 *
 * The observer is the FRAME'S, not the lab page's: the subtree lives in the
 * iframe's document, so it is watched with that window's `ResizeObserver` (it
 * fires when the copied stylesheets land, and the first layout is unstyled).
 * The timers cover what an observer cannot see (a photograph decoding at its
 * natural height in a column that never changed width), and every board waits
 * on the webfont too (`voice-guest`'s own finding: it lands after the first
 * layout and takes every wrap with it), rather than trusting that the last
 * timer was always late enough.
 */
export function Measured({
  probe,
  deps,
  onMeasure,
  timers = DEFAULT_TIMERS,
  className,
  children,
}: {
  /** `null` means "not settled yet": the read is skipped rather than
   *  overwriting the caption with a lie. */
  probe: (root: HTMLElement, win: Window) => string | null;
  deps: unknown[];
  onMeasure: (text: string) => void;
  /** Read delays in ms after the immediate read; override when a board's own
   *  pass lands later than the default's last one. */
  timers?: number[];
  /** The measuring wrapper's own class. `reel-screen`'s wall passes
   *  `size-full`: its portalled body has no height of its own, so an unsized
   *  measuring div collapsed to zero under it. */
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const report = useRef(onMeasure);
  useEffect(() => {
    report.current = onMeasure;
  });
  useEffect(() => {
    const el = ref.current;
    const win = el?.ownerDocument.defaultView;
    if (!el || !win) return;
    const read = () => {
      try {
        const said = probe(el, win);
        if (said) report.current(said);
      } catch {
        // Not settled yet; the next timer or resize catches it.
      }
    };
    read();
    const timeouts = timers.map((ms) => win.setTimeout(read, ms));
    const ro = new win.ResizeObserver(read);
    ro.observe(el);
    win.document.fonts?.ready.then(read).catch(() => {});
    return () => {
      timeouts.forEach((t) => win.clearTimeout(t));
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
