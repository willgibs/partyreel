"use client";

import { type ReactNode, useState } from "react";

import { Fit, Frame, Measured } from "@/components/lab";

import { SCREENS, type ScreenId } from "./knobs";

/**
 * THE FRAMES THE ARRIVAL DRAWS IN: a phone at 375 by 812 (the default) or a
 * laptop at 1440 by 900 (the Screen knob), 1:1 in the kit's `Frame`, a
 * same-origin iframe, so a line wraps where it will wrap, `svh` is the frame's
 * own, a `sm:` or `md:` class answers the frame's width and a fixed layer (the
 * darkroom, the premiere) covers the frame's own screen.
 *
 * ★ NOTHING HERE REACHES A SESSION, A SERVER FUNCTION OR THE NETWORK beyond the
 * stand-in photographs; every press is inert.
 *
 * ★ EVERY CAPTION IS READ OFF THE FRAME, NEVER ASSERTED: how many squares the
 * sheet draws and how many have come up, what the cover and the album say, how
 * long the take runs. If a caption and the words above a frame disagree, the
 * caption is the truth.
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
  screen: ScreenId;
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
          timers={[400, 1400, 2600, 4200]}
          className="min-h-full"
        >
          {children}
        </Measured>
      </Frame>
    </Fit>
  );
}

/**
 * THE FRAMES OF ONE OPTION, left to right as her week runs: her first open
 * playing, the same held at its turn, the reduced pass, her second open.
 * Phones stand in a row; laptops two to a row, since a 1440 frame alone in a
 * row is the stage's whole width.
 */
export function Story({
  screen,
  children,
}: {
  screen: ScreenId;
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

/** An element's opacity as drawn this instant (an animation's value included). */
export const opacityOf = (el: Element | null, win: Window) =>
  el ? Number.parseFloat(win.getComputedStyle(el).opacity) : 0;
