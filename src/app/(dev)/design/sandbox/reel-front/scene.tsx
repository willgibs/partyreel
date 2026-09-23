"use client";

import { type ReactNode, useState } from "react";

import { Fit, Frame, Measured } from "@/components/lab";
import type { Control } from "@/components/lab/board-spec";

/**
 * THE ONE FRAME EVERY DECISION DRAWS IN (the `guest-capture`/`media-viewer`
 * precedent: `Fit` and `Measured` are the kit's; `Scene` keeps the same shape
 * anyway, because a board's furniture is not a place to invent a second one).
 *
 * ★ PHONE FIRST, 1440 ON THE KNOB: except the `tile` ask, which draws TWO
 * `Scene`s side by side, unconditionally, rather than one behind the `screen`
 * knob (the brief's own word: "the `/demo` order against the turn card is
 * drawn inside `tile` at 375 and 1440, both present at once"). Each stays its
 * own real iframe on purpose: a `sm:` utility inside a merely narrow DIV, in a
 * wider frame, reads the FRAME's viewport, not the div's (design.css's own
 * landmine on this exact mistake), so two genuine widths need two genuine
 * frames, never one wide canvas with two boxes drawn inside it.
 */

export const SCREENS = {
  "375": { w: 375, h: 812, name: "a phone" },
  "1440": { w: 1440, h: 900, name: "a laptop" },
} as const;
export type ScreenId = keyof typeof SCREENS;
export const screenOf = (v: string | undefined): ScreenId =>
  v === "1440" ? "1440" : "375";

export const SCREEN: Control = {
  id: "screen",
  label: "Screen",
  options: [
    { id: "375", label: "375, a phone" },
    { id: "1440", label: "1440, a laptop" },
  ],
  default: "375",
};

export function Scene({
  id,
  screen,
  title,
  caption,
  measure,
  children,
}: {
  id: string;
  screen: ScreenId;
  title: string;
  caption?: string;
  measure?: (root: HTMLElement, win: Window) => string | null;
  children: ReactNode;
}) {
  const { w, h } = SCREENS[screen];
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
