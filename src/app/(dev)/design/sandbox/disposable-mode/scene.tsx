"use client";

import { type ReactNode, useState } from "react";

import { Fit, Frame, Measured } from "@/components/lab";

import { LookDefs } from "./film";
import { SCREENS, type ScreenId } from "./knobs";

/**
 * THE ONE FRAME EVERY DECISION DRAWS IN.
 *
 * ★ A PHONE FIRST: 375 BY 812. A disposable is shot standing up at a party,
 * in the album a guest holds in one hand, so every guest frame is that phone
 * at 1:1 (the kit's `Frame`, a same-origin iframe, so a line wraps where it
 * will wrap and a `sm:` class answers the phone's width, not the lab's). The
 * waiting room and the developed album are drawn at 1440 too, on the Screen
 * knob.
 *
 * ★ NOTHING HERE REACHES A SESSION, A SERVER FUNCTION, THE CAMERA OR THE
 * NETWORK, AND EVERY FLOATING SURFACE IS QUOTED, NOT MOUNTED. `fixed`, never
 * `absolute`, for anything pinned to the screen: the frame IS the viewport.
 * Every camera's live picture is a photograph standing in for the stream (a
 * frame asking for the reader's camera would be a permission prompt on a
 * design review; the dock's Measure is the one place the board asks, and only
 * when pressed).
 *
 * ★ EVERY CAPTION IS READ OFF THE FRAME, NEVER ASSERTED: where the shutter
 * sits for a thumb, what the count says, how many frames the roll shows lit.
 * If a caption and the words above a frame disagree, the caption is the
 * truth.
 *
 * ★ EVERY FRAME MOUNTS THE LOOKS' COLOUR PASSES (`LookDefs`), so any
 * photograph in it can wear one by id.
 */

export type Reader = (root: HTMLElement, win: Window) => string | null;

export function Scene({
  id,
  screen = "375",
  title,
  measure,
  children,
}: {
  id: string;
  screen?: ScreenId;
  title: string;
  /** What the frame says, read off it for its caption. */
  measure: Reader;
  children: ReactNode;
}) {
  const { w, h } = SCREENS[screen];
  const [measured, setMeasured] = useState("measuring");
  return (
    <Fit w={w}>
      <Frame
        id={`${id}-${screen}`}
        w={w}
        h={h}
        title={title}
        caption={measured}
      >
        <LookDefs />
        <Measured
          probe={measure}
          deps={[id, screen]}
          onMeasure={setMeasured}
          className="min-h-full"
        >
          {children}
        </Measured>
      </Frame>
    </Fit>
  );
}

/**
 * THE FRAMES OF ONE OPTION, read left to right as time runs. Phones stand in
 * a row (it wraps where the stage is narrower); laptops stack, since two 1440
 * frames side by side would each be a thumbnail.
 */
export function Story({
  screen = "375",
  children,
}: {
  screen?: ScreenId;
  children: ReactNode;
}) {
  if (screen !== "375")
    return <div className="flex flex-col gap-6">{children}</div>;
  return <div className="flex flex-wrap items-start gap-6">{children}</div>;
}

/* ── what the frames read ──────────────────────────────────────────────── */

/** An element's own words, whitespace folded. */
export const textOf = (el: Element | null | undefined) =>
  ((el as HTMLElement | null)?.innerText ?? "").replace(/\s+/g, " ").trim();

/**
 * WHERE AN ACT SITS FOR A THUMB: the element marked `data-dm-reach`, its size
 * and how far down the screen its middle is. A shutter a guest has to stretch
 * for is read here rather than asserted in a sentence.
 */
export const reach =
  (what: string): Reader =>
  (root, win) => {
    const el = root.querySelector<HTMLElement>("[data-dm-reach]");
    if (!el) return null;
    const r = el.getBoundingClientRect();
    if (r.height < 1) return null;
    const down = Math.round(((r.top + r.height / 2) / win.innerHeight) * 100);
    return `${what}: ${Math.round(r.width)} by ${Math.round(r.height)} px, ${down}% of the way down`;
  };

/** What one marked element says, framed in a sentence. */
export const said =
  (selector: string, frame: (words: string) => string): Reader =>
  (root) => {
    const words = textOf(root.querySelector(selector));
    return words ? frame(words) : null;
  };

/** Readers joined into one caption: each part must have settled. */
export const all =
  (...readers: Reader[]): Reader =>
  (root, win) => {
    const parts = readers.map((r) => r(root, win));
    return parts.every(Boolean) ? parts.join("; ") : null;
  };
