"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

import { Frame, useLabPrefs } from "@/components/lab";
import type { Control } from "@/components/lab/board-spec";

/**
 * THE ONE FRAME EVERY DECISION DRAWS IN: a real viewport, at 1440 or 375, a
 * real component portalled into it (never a route — nothing here reaches a
 * session or the network on mount, so there is no gate and no `src`).
 *
 * ★ WHY A SHARED WIDTH KNOB, NOT TWO TILES PER OPTION. Guidance's "page-wide
 * switches stay on screen": a control that changes every preview belongs in
 * the dock once, not doubled into every option (body-type found the same
 * shape). `WIDTH` is declared once by the board and put on every decision's
 * `configs`, so the dock draws it a single time (`defineExploration` dedupes a
 * repeated control id) and every option's frame redraws at whichever width he
 * is on.
 */
export const WIDTHS = {
  "1440": { w: 1440, h: 900, name: "a desktop" },
  "375": { w: 375, h: 812, name: "a phone" },
} as const;
export type WidthId = keyof typeof WIDTHS;
export const widthOf = (v: string | undefined): WidthId =>
  v === "375" ? "375" : "1440";

export const WIDTH: Control = {
  id: "width",
  label: "Width",
  options: [
    { id: "1440", label: "1440, a desktop" },
    { id: "375", label: "375, a phone" },
  ],
  default: "1440",
};

/**
 * Zoom-fits the frame to the lab's own Fit preference (a bare `Frame` has no
 * opinion of its own — a `Stage` answers it, a portalled one does not). Lifted
 * from body-type/surfaces.tsx: zooming is honest because `zoom` on an
 * ancestor scales the picture and leaves the iframe's own viewport alone.
 */
function Fit({ w, children }: { w: number; children: ReactNode }) {
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

/**
 * Reads one live number off the frame's own document — "every number measured"
 * (the manifest): a tile step's claimed pixel width, or whether a control row
 * wrapped to a second line, is read from `getBoundingClientRect`/
 * `getComputedStyle` inside the iframe's realm, never typed by hand. Re-reads
 * on a timer + a ResizeObserver, the same shape `body-type`'s `Measured` uses.
 */
function Measured({
  probe,
  deps,
  onMeasure,
  children,
}: {
  probe: (root: HTMLElement, win: Window) => string;
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
        report.current(probe(el, win));
      } catch {
        // The subtree not yet portalled in, or a selector that has not
        // mounted this pass; the next timer or resize catches it.
      }
    };
    read();
    const timers = [160, 700, 1500].map((ms) => win.setTimeout(read, ms));
    const ro = new win.ResizeObserver(read);
    ro.observe(el);
    return () => {
      timers.forEach((t) => win.clearTimeout(t));
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return <div ref={ref}>{children}</div>;
}

export function Scene({
  id,
  width,
  title,
  caption,
  measure,
  short,
  tall,
  children,
}: {
  id: string;
  width: WidthId;
  title: string;
  /** A static caption. Omit and pass `measure` for a number read off the frame. */
  caption?: string;
  measure?: (root: HTMLElement, win: Window) => string;
  /** Caps the tile's height well under the full viewport (a composed surface,
   *  not a page, so 900 or 812px of window would leave a third of it empty). */
  short?: boolean;
  /** The one decision drawn on two stacked surfaces needs the extra room. */
  tall?: boolean;
  children: ReactNode;
}) {
  const { w, h: full } = WIDTHS[width];
  const h = short
    ? Math.min(full, 560)
    : tall && width === "1440"
      ? 1080
      : full;
  const [measured, setMeasured] = useState("measuring");

  const body = measure ? (
    <Measured probe={measure} deps={[width, id]} onMeasure={setMeasured}>
      {children}
    </Measured>
  ) : (
    children
  );

  return (
    <Fit w={w}>
      <Frame
        id={`${id}-${width}`}
        w={w}
        h={h}
        title={`${title}, ${WIDTHS[width].name}`}
        caption={measure ? measured : caption}
      >
        {body}
      </Frame>
    </Fit>
  );
}
