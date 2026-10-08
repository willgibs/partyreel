"use client";

import { type ReactNode, useState } from "react";

import { Fit, Frame, Measured } from "@/components/lab";
import { PortalContainerProvider } from "@/components/ui/portal-container";

import type { Ground } from "./knobs";

/**
 * THE FRAMES EVERY PREVIEW DRAWS IN (carried from after-party's `scene.tsx`):
 * a phone at 375 wide or a laptop at 1440, 1:1 in the kit's `Frame` (a
 * same-origin iframe), so a page lays out at the frame's own width and a fixed
 * layer (the guest's dock, the door's sheet) stands in the frame's own screen.
 * A frame may be shorter than its screen (`h`): a card in a chat, a crop of
 * the dashboard.
 *
 * ★ ON THE GROUND THE KNOB ASKS FOR, whatever the lab wears: the frame stands
 * in a pane of that ground (`frame-theme.ts`: the nearest `.dark` or
 * `.surface-paper` above a frame is its ground), and its layers portal into
 * the scene's own ground rather than the frame's body.
 *
 * ★ EVERY CAPTION IS READ OFF THE FRAME, NEVER ASSERTED (`Measured`): what a
 * head leads with, what is pressable on the first screen, how far down the
 * album starts. If a caption and the words above a frame disagree, the
 * caption is the truth.
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
      data-ep-ground={ground}
      className={`${ground === "room" ? "dark" : "surface-paper"} relative min-h-screen bg-background text-foreground`}
    >
      <PortalContainerProvider value={el}>{children}</PortalContainerProvider>
    </div>
  );
}

/**
 * ONE VIEW'S FRAMES, left to right as the moment runs; the stage wraps a row
 * of frames to the room it has, so they are as large as it allows.
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
export function actsIn(root: HTMLElement, win: Window): string[] {
  return [
    ...root.ownerDocument.querySelectorAll<HTMLElement>(
      "button, a[href], [role='button']",
    ),
  ]
    .filter((el) => inView(el, win))
    .map((el) => textOf(el) || el.getAttribute("aria-label") || "")
    .filter(Boolean);
}

/**
 * THE FIRST SCREEN, READ: what the head leads with (its h1), how many things
 * it offers to press in view, and how far down the album's first photograph
 * starts (the tease), in the frame's own pixels.
 */
export const readFirstScreen: Reader = (root, win) => {
  const name = find(root, "h1");
  if (!name) return null;
  const tile = find(root, "[data-ep-tile]");
  const top = tile ? Math.round(tile.getBoundingClientRect().top) : null;
  const acts = actsIn(root, win).length;
  return parts(
    `"${textOf(name)}"`,
    `${acts} to press in view`,
    tile
      ? top !== null && top < win.innerHeight
        ? `the album's first photo at ${top}px`
        : "the album below the first screen"
      : "no photo yet",
  );
};
