"use client";

import { type ReactNode, useEffect, useState } from "react";

import { Fit, Frame, Measured } from "@/components/lab";
import { PortalContainerProvider } from "@/components/ui/portal-container";

import type { Ground } from "./knobs";

/**
 * THE FRAMES EVERY PREVIEW DRAWS IN: a phone at 375 wide or a laptop at 1440,
 * 1:1 in the kit's `Frame` (a same-origin iframe), so a page lays out at the
 * frame's own width and a fixed layer (the guest's dock) stands in the frame's
 * own screen. A frame may be shorter than its screen (`h`): a beat that is
 * only the cover, or the album's end.
 *
 * ★ ON THE GROUND THE QUESTION ASKS FOR, whatever the lab wears: the frame
 * stands in a pane of that ground (`frame-theme.ts`: the nearest `.dark` or
 * `.surface-paper` above a frame is its ground), and its layers portal into
 * the scene's own ground rather than the frame's body.
 *
 * ★ EVERY CAPTION IS READ OFF THE FRAME, NEVER ASSERTED (`Measured`): what the
 * cover leads with, where Add stands, what a card carries. If a caption and
 * the words above a frame disagree, the caption is the truth.
 */

export type Reader = (root: HTMLElement, win: Window) => string | null;

export function Scene({
  id,
  w,
  h,
  ground = "room",
  title,
  measure,
  children,
}: {
  id: string;
  w: number;
  h: number;
  ground?: Ground;
  title: string;
  measure: Reader;
  children: ReactNode;
}) {
  const [measured, setMeasured] = useState("measuring");
  return (
    <div className={ground === "room" ? "dark" : "surface-paper"}>
      <Fit w={w}>
        <Frame
          id={`${id}-${ground}`}
          w={w}
          h={h}
          title={title}
          caption={measured}
        >
          <Measured
            probe={measure}
            deps={[id, ground]}
            onMeasure={setMeasured}
            timers={[400, 1200, 2400, 4000]}
            className="min-h-full"
          >
            <GroundRoot ground={ground}>{children}</GroundRoot>
          </Measured>
        </Frame>
      </Fit>
    </div>
  );
}

/** The scene's own ground, and the element its layers portal into. */
function GroundRoot({
  ground,
  children,
}: {
  ground: Ground;
  children: ReactNode;
}) {
  const [el, setEl] = useState<HTMLDivElement | null>(null);
  return (
    <div
      ref={setEl}
      data-ap-ground={ground}
      className={`${ground === "room" ? "dark" : "surface-paper"} relative min-h-screen bg-background text-foreground`}
    >
      <PortalContainerProvider value={el}>{children}</PortalContainerProvider>
    </div>
  );
}

/**
 * ONE OPTION'S FRAMES, left to right as the moment runs; the stage wraps a
 * row of frames to the room it has, so they are as large as it allows.
 */
export function Story({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-start gap-6">{children}</div>;
}

/* ── what the frames read ──────────────────────────────────────────────── */

/** An element's own words, whitespace folded. */
export const textOf = (el: Element | null | undefined) =>
  ((el as HTMLElement | null)?.innerText ?? "").replace(/\s+/g, " ").trim();

/** A first element matching, in the frame's whole document. */
export const find = (root: HTMLElement, selector: string) =>
  root.ownerDocument.querySelector<HTMLElement>(selector);

export const findAll = (root: HTMLElement, selector: string) => [
  ...root.ownerDocument.querySelectorAll<HTMLElement>(selector),
];

/** Joins a caption's parts, or says it is not settled yet when one is missing. */
export const parts = (...bits: (string | null | undefined | false)[]) =>
  bits.some((b) => b === null) ? null : bits.filter(Boolean).join("; ");

/** Whether an element is in the frame's view, at least partly. */
export function inView(el: HTMLElement | null, win: Window): boolean {
  if (!el) return false;
  const r = el.getBoundingClientRect();
  return r.bottom > 0 && r.top < win.innerHeight && r.height > 0 && r.width > 0;
}

/** The words of every button and link in view, in order: what a frame offers her to press. */
export function actsIn(
  root: HTMLElement,
  win: Window,
  scope?: string,
): string[] {
  const within = scope ? find(root, scope) : root;
  if (!within) return [];
  return [
    ...within.querySelectorAll<HTMLElement>("button, a[href], [role='button']"),
  ]
    .filter((el) => inView(el, win))
    .map((el) => textOf(el) || el.getAttribute("aria-label") || "")
    .filter(Boolean);
}

/**
 * A CLOSER LOOK AT A REAL SURFACE: the surface laid out at its own width (so
 * every breakpoint is the screen's), then drawn `k` times its size and moved
 * so the element `focus` names stands at the frame's left, centred in its
 * height; its title says it is closer. ★ THE CORNER IS FOUND, NEVER TYPED:
 * the element is measured once the page has laid out (and again as the
 * webfont settles), so a region never drifts off what it frames.
 */
export function Zoom({
  id,
  w,
  h,
  k = 2,
  focus,
  ground = "room",
  title,
  measure,
  children,
}: {
  id: string;
  /** The surface's own width: the frame lays it out there. */
  w: number;
  h: number;
  k?: number;
  /** A selector for the element the closer look is on. */
  focus: string;
  ground?: Ground;
  title: string;
  measure: Reader;
  children: ReactNode;
}) {
  const [box, setBox] = useState<HTMLDivElement | null>(null);
  const [at, setAt] = useState<{ x: number; y: number } | null>(null);
  useEffect(() => {
    const win = box?.ownerDocument.defaultView;
    if (!box || !win) return;
    const place = () => {
      const el = box.querySelector<HTMLElement>(focus);
      if (!el) return;
      // The wrapper is scaled: a rect read in the screen's pixels is divided back by `k`.
      const outer = box.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      const x = (r.left - outer.left) / k;
      const y = (r.top - outer.top) / k;
      const pad = 16 / k;
      setAt({
        x: Math.max(0, x - pad),
        y: Math.max(0, y + r.height / k / 2 - h / k / 2),
      });
    };
    place();
    const t1 = win.setTimeout(place, 500);
    const t2 = win.setTimeout(place, 1500);
    return () => {
      win.clearTimeout(t1);
      win.clearTimeout(t2);
    };
  }, [box, focus, k, h]);
  return (
    <Scene id={id} w={w} h={h} ground={ground} title={title} measure={measure}>
      <div data-ap-zoom={k} className="h-screen overflow-hidden">
        <div
          ref={setBox}
          style={{
            width: w,
            transformOrigin: "0 0",
            transform: at
              ? `scale(${k}) translate(${-at.x}px, ${-at.y}px)`
              : `scale(${k})`,
          }}
        >
          {children}
        </div>
      </div>
    </Scene>
  );
}
