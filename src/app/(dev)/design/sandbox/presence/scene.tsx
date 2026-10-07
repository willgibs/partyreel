"use client";

import { type ReactNode, useEffect, useState } from "react";

import { Fit, Frame, Measured } from "@/components/lab";
import { PortalContainerProvider } from "@/components/ui/portal-container";

import type { Ground } from "./knobs";

/**
 * THE FRAMES EVERY PREVIEW DRAWS IN: a phone at 375 wide or a laptop at 1440,
 * 1:1 in the kit's `Frame` (a same-origin iframe), so a row lays out at the
 * frame's own width and a fixed layer (the dock) stands in the frame's own
 * screen. A frame may be shorter than its screen (`h`): a beat that is only
 * the cover's foot, or the album's end.
 *
 * ★ ON THE GROUND THE QUESTION ASKS FOR, whatever the lab wears: the frame
 * stands in a pane of that ground (`frame-theme.ts`: the nearest `.dark` or
 * `.surface-paper` above a frame is its ground), and its layers portal into
 * the scene's own ground rather than the frame's body.
 *
 * ★ EVERY CAPTION IS READ OFF THE FRAME, NEVER ASSERTED (`Measured`): which
 * face is ringed and in what, how far a face under the pointer has lifted,
 * where the row stands. If a caption and the words above a frame disagree,
 * the caption is the truth.
 */

export type Reader = (root: HTMLElement, win: Window) => string | null;

export function Scene({
  id,
  w,
  h,
  ground = "room",
  title,
  measure,
  zoom,
  children,
}: {
  id: string;
  w: number;
  h: number;
  ground?: Ground;
  title: string;
  measure: Reader;
  /** A loupe: the drawing at this many times its size, in a frame that is its window. */
  zoom?: number;
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
            <GroundRoot ground={ground} zoom={zoom}>
              {children}
            </GroundRoot>
          </Measured>
        </Frame>
      </Fit>
    </div>
  );
}

/** The scene's own ground, and the element its layers portal into. */
function GroundRoot({
  ground,
  zoom,
  children,
}: {
  ground: Ground;
  zoom?: number;
  children: ReactNode;
}) {
  const [el, setEl] = useState<HTMLDivElement | null>(null);
  return (
    <div
      ref={setEl}
      data-pr-ground={ground}
      className={`${ground === "room" ? "dark" : "surface-paper"} relative min-h-screen bg-background text-foreground`}
      style={zoom ? { zoom } : undefined}
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

/**
 * A LOUPE: the row at `k` times its size on the ground it stands on (the
 * cover's photograph under its scrim, or the page), in a frame that is only
 * its window. A magnified view, and its title says so: the ring's light and
 * the pointer's lift are a few pixels at their true size, and this is where
 * they can be judged. Every other frame on the board is 1:1.
 */
export function Loupe({
  id,
  w,
  h,
  k = 2,
  ground,
  photo,
  title,
  measure,
  children,
}: {
  id: string;
  w: number;
  h: number;
  k?: number;
  ground: Ground;
  /** The cover's photograph, where the row stands on it; the page's ground where absent. */
  photo?: { src: string; focus: string };
  title: string;
  measure: Reader;
  children: ReactNode;
}) {
  return (
    <Scene id={id} w={w} h={h} ground={ground} title={title} measure={measure}>
      <div
        data-pr-loupe={k}
        data-surface={photo ? "photo" : undefined}
        className={`${photo ? "dark" : ""}relative flex h-screen items-center overflow-hidden px-8`}
      >
        {photo ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- a stand-in photograph, the cover's own */}
            <img
              src={photo.src}
              alt=""
              className="absolute inset-0 size-full object-cover"
              style={{ objectPosition: photo.focus }}
            />
            <span
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/45 to-black/30"
            />
          </>
        ) : null}
        <div
          className="relative origin-left"
          style={{ transform: `scale(${k})` }}
        >
          {children}
        </div>
      </div>
    </Scene>
  );
}

/**
 * A CLOSER LOOK AT A REAL SURFACE: the surface laid out at its own width (so
 * every breakpoint is the screen's), then drawn `k` times its size and moved
 * so the element `focus` names stands at the frame's left, centred in its
 * height. Where `Loupe` magnifies a row on its ground, this magnifies a corner
 * of a whole page (the hub's line, its doors), and its title says it is
 * closer. ★ THE CORNER IS FOUND, NEVER TYPED: the element is measured once
 * the page has laid out (and again as the webfont settles), so a region never
 * drifts off what it frames when a layout moves.
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
      <div data-pr-zoom={k} className="h-screen overflow-hidden">
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
