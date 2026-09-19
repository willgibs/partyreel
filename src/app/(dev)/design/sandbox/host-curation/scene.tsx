"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

import { Frame, useLabPrefs } from "@/components/lab";
import type { Control } from "@/components/lab/board-spec";

/**
 * THE ONE FRAME EVERY DECISION DRAWS IN: a real viewport at 1440 or 375, with
 * the real host components portalled into it. Never a route: nothing here may
 * reach a session, a Server Function or the network on mount.
 *
 * ★ 1440 FIRST, 375 ON THE KNOB, and that is the opposite of `guest-upload`.
 * A guest is standing at a party holding a phone; a host clearing forty
 * photographs is at a laptop with a cup of tea, which is why every option is
 * judged there first. The phone is still a knob on every decision and not an
 * afterthought: the tile row collapses to two chips at 375 and the queue's
 * columns halve, so an answer that only works at 1440 is a finding.
 */
export const SCREENS = {
  "1440": { w: 1440, h: 900, name: "a laptop" },
  "375": { w: 375, h: 812, name: "a phone" },
} as const;
export type ScreenId = keyof typeof SCREENS;
export const screenOf = (v: string | undefined): ScreenId =>
  v === "375" ? "375" : "1440";

export const SCREEN: Control = {
  id: "screen",
  label: "Screen",
  options: [
    { id: "1440", label: "1440, a laptop" },
    { id: "375", label: "375, a phone" },
  ],
  default: "1440",
};

/** Zoom-fits a portalled frame to the lab's own Fit preference (a bare `Frame`
 *  has no opinion of its own). Zooming is honest: `zoom` on an ancestor scales
 *  the picture and leaves the iframe's own viewport alone. */
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
 * ★ THE NUMBERS UNDER A FRAME ARE MEASURED, NEVER COMPUTED. A board once drew
 * an option with its formula's sign backwards and the tile Will judged showed
 * the opposite of its words (docs/PROGRAM.md), so every claim this board makes
 * about a crop, a reach or a row's fit is read out of the frame's OWN document
 * after it settles. If the words above a frame and the caption under it
 * disagree, the caption is the truth.
 *
 * The observer is the FRAME'S, not the lab page's: the subtree lives in the
 * iframe's document, so it is watched with that window's `ResizeObserver` (it
 * fires when the copied stylesheets land, and the first layout is unstyled).
 * Two late passes cover what an observer cannot see: photographs decoding at
 * their natural heights in columns that never changed width.
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
        // Not portalled in yet, or a selector that has not mounted this pass;
        // the next timer or resize catches it.
      }
    };
    read();
    const timers = [200, 900, 1800].map((ms) => win.setTimeout(read, ms));
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
  screen,
  title,
  caption,
  measure,
  short,
  children,
}: {
  id: string;
  screen: ScreenId;
  title: string;
  /** A static caption. Omit and pass `measure` for a number read off the frame. */
  caption?: string;
  measure?: (root: HTMLElement, win: Window) => string;
  /** Caps a composed surface well under the full viewport. */
  short?: boolean;
  children: ReactNode;
}) {
  const { w, h: full } = SCREENS[screen];
  const h = short ? Math.min(full, 600) : full;
  const [measured, setMeasured] = useState("measuring");

  const body = measure ? (
    <Measured probe={measure} deps={[screen, id]} onMeasure={setMeasured}>
      {children}
    </Measured>
  ) : (
    children
  );

  return (
    <Fit w={w}>
      <Frame
        id={`${id}-${screen}`}
        w={w}
        h={h}
        title={`${title}, ${SCREENS[screen].name}`}
        caption={measure ? measured : caption}
      >
        {body}
      </Frame>
    </Fit>
  );
}

/** The host page's own ground under every scene: the app background, the page
 *  padding the event page really uses, and the foreground colour. */
export function HostGround({
  screen,
  children,
}: {
  screen: ScreenId;
  children: ReactNode;
}) {
  return (
    <div
      className={
        screen === "375"
          ? "min-h-full space-y-5 bg-background px-4 py-5 text-foreground"
          : "min-h-full space-y-6 bg-background px-8 py-7 text-foreground"
      }
    >
      {children}
    </div>
  );
}
