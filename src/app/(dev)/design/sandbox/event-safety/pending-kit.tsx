"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

import { useLabPrefs } from "@/components/lab";

/**
 * ★ A STOPGAP WITH A DATE ON IT. `lab-scene-kit` is lifting `Fit` and
 * `Measured` into the kit (`@/components/lab`) this round, and this board
 * imports them from there the moment that lane lands (its manifest; the
 * Orchestrator announces it in `docs/tracks/orchestrator.md`). Until then the
 * two live here under names the kit will never own, so `kit-discipline.test.ts`
 * can add `Fit` and `Measured` to its list without this board tripping it, and
 * the swap is one import line in `scene.tsx` plus deleting this file.
 *
 * Both are `voice-guest`'s versions verbatim (the superset the kit is taking:
 * the reads keep coming until the webfont has landed), so nothing this board
 * draws changes when the kit's arrive.
 */

/** Zoom-fits a portalled frame to the lab's own Fit preference. */
export function PendingFit({ w, children }: { w: number; children: ReactNode }) {
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

/** A number read off the frame's own document, never computed. */
export function PendingMeasured({
  probe,
  deps,
  onMeasure,
  children,
}: {
  /** `null` means "not settled yet": the read is skipped rather than
   *  overwriting the caption with a lie. */
  probe: (root: HTMLElement, win: Window) => string | null;
  deps: unknown[];
  onMeasure: (text: string) => void;
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
    // The webfont lands after the first layout and takes every wrap with it,
    // so the reads keep coming until it has.
    const timers = [200, 900, 1800].map((ms) => win.setTimeout(read, ms));
    const ro = new win.ResizeObserver(read);
    ro.observe(el);
    win.document.fonts?.ready.then(read).catch(() => {});
    return () => {
      timers.forEach((t) => win.clearTimeout(t));
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return <div ref={ref}>{children}</div>;
}
