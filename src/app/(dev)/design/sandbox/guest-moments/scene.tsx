"use client";

import { type ReactNode, useState } from "react";

import { Fit, Frame, Measured } from "@/components/lab";

import { type Screen, SCREENS } from "./knobs";

/**
 * THE FRAMES EVERY PREVIEW DRAWS IN: a phone at 375 by 812 or a laptop at
 * 1440 by 900, 1:1 in the kit's `Frame` (a same-origin iframe), so a row
 * lays out at the frame's own width and a fixed layer (the camera, the reel)
 * covers the frame's own screen.
 *
 * ★ A MOMENT IS DRAWN AS ITS BEATS: each option is a short row of frames,
 * the moment as it plays (`Loop`, motion allowed) and then the instants that
 * decide it held still, each titled with its time. Under reduced motion the
 * loop holds its last beat, as production holds still there.
 *
 * ★ EVERY CAPTION IS READ OFF THE FRAME, NEVER ASSERTED: what each tile
 * wears, what a line says, what the screen shows. If a caption and the words
 * above a frame disagree, the caption is the truth.
 */

export type Reader = (root: HTMLElement, win: Window) => string | null;

export function Scene({
  id,
  screen,
  title,
  measure,
  children,
}: {
  id: string;
  screen: Screen;
  title: string;
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
        <Measured
          probe={measure}
          deps={[id, screen]}
          onMeasure={setMeasured}
          timers={[400, 1200, 2400, 4000]}
          className="min-h-full"
        >
          {children}
        </Measured>
      </Frame>
    </Fit>
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
