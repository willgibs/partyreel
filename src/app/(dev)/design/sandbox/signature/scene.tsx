"use client";

import { type ReactNode, useState } from "react";

import { Fit, Frame, Measured } from "@/components/lab";
import { PortalContainerProvider } from "@/components/ui/portal-container";

import { type Ground, type Screen, SCREENS } from "./knobs";

/**
 * THE FRAMES EVERY PREVIEW DRAWS IN: a phone at 375 by 812 or a laptop at
 * 1440 by 900, 1:1 in the kit's `Frame` (a same-origin iframe), so a row lays
 * out at the frame's own width and a fixed layer (the dock, the door's sheet,
 * the camera) stands in the frame's own screen.
 *
 * ★ ON THE GROUND THE QUESTION ASKS FOR, whatever the lab wears: the frame
 * stands in a pane of that ground (`frame-theme.ts`: the nearest `.dark` or
 * `.surface-paper` above a frame is its ground), and its layers portal into
 * the scene's own ground rather than the frame's body, so a sheet opened on
 * paper is paper's.
 *
 * ★ A MOMENT IS DRAWN AS ITS BEATS: the moment playing first where it moves
 * (motion allowed), then the instants that decide it, each held still and
 * titled with its time. Under reduced motion a playing frame holds its rest.
 *
 * ★ EVERY CAPTION IS READ OFF THE FRAME, NEVER ASSERTED (`Measured`): which
 * light stands where, how far it reaches. If a caption and the words above a
 * frame disagree, the caption is the truth.
 */

export type Reader = (root: HTMLElement, win: Window) => string | null;

export function Scene({
  id,
  screen,
  ground = "room",
  title,
  measure,
  height,
  children,
}: {
  id: string;
  screen: Screen;
  ground?: Ground;
  title: string;
  measure: Reader;
  /** A frame shorter than the screen, for a beat that is only the screen's foot. */
  height?: number;
  children: ReactNode;
}) {
  const { w, h } = SCREENS[screen];
  const [measured, setMeasured] = useState("measuring");
  return (
    <div className={ground === "room" ? "dark" : "surface-paper"}>
      <Fit w={w}>
        <Frame
          id={`${id}-${screen}-${ground}`}
          w={w}
          h={height ?? h}
          title={title}
          caption={measured}
        >
          <Measured
            probe={measure}
            deps={[id, screen, ground]}
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
      data-sg-ground={ground}
      className={`${ground === "room" ? "dark" : "surface-paper"} relative min-h-screen bg-background text-foreground`}
    >
      <PortalContainerProvider value={el}>{children}</PortalContainerProvider>
    </div>
  );
}

/**
 * ONE OPTION'S FRAMES, left to right as the moment runs. Phones stand in a
 * row; laptops two to a row, since a 1440 frame alone is a stage's width.
 */
export function Story({
  screen,
  children,
}: {
  screen: Screen;
  children: ReactNode;
}) {
  return (
    <div
      className="flex flex-wrap items-start gap-6"
      style={screen === "1440" ? { maxWidth: 2 * 1440 + 24 } : undefined}
    >
      {children}
    </div>
  );
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
  return r.bottom > 0 && r.top < win.innerHeight && r.height > 0;
}

/** The lights a frame shows, read off their hooks: which form, where, how far it reaches. */
export function lightsIn(root: HTMLElement, win: Window): string {
  const seen: string[] = [];
  for (const s of findAll(root, "[data-sg-seam]")) {
    if (!inView(s, win)) continue;
    const r = s.getBoundingClientRect();
    const reach =
      s.dataset.sgSeam === "left" || s.dataset.sgSeam === "right"
        ? r.width
        : r.height;
    seen.push(`a Seam, ${Math.round(reach)}px`);
  }
  for (const s of findAll(root, "[data-sg-strip]"))
    if (inView(s, win)) seen.push("a strip of the room");
  for (const r of findAll(root, "[data-sg-ring]"))
    if (inView(r, win)) seen.push(`the Ring ${r.dataset.sgRing}`);
  for (const b of findAll(root, "[data-sg-bloom]"))
    if (inView(b, win)) seen.push("a Bloom");
  for (const p of findAll(root, "[data-sg-plate]"))
    if (inView(p, win)) seen.push("a plate");
  for (const l of findAll(root, "[data-door-lamp]"))
    if (inView(l, win) && win.getComputedStyle(l).display !== "none")
      seen.push("the door's lamps");
  for (const l of findAll(root, "[data-room-light]"))
    if (inView(l, win) && win.getComputedStyle(l).display !== "none")
      seen.push("the floor's field");
  return seen.length ? seen.join(", ") : "no light";
}
