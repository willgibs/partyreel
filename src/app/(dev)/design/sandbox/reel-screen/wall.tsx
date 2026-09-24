"use client";

import { type ReactNode, useState } from "react";

import { Fit, Frame, Measured } from "@/components/lab";

/**
 * THE STAGE IS A TELEVISION: 1920 BY 1080, WHICH THE KIT DOES NOT DRAW.
 *
 * ★ `Stage`'s canvases stop at 1440, which is right for every board judged at
 * the widths people browse at. A venue screen is not browsed at, it is LOOKED
 * AT from across a room, and its only real size is the television's. So this
 * board draws its own canvas, in a `Frame` rather than a div: a Tailwind
 * breakpoint inside a div reads the BROWSER's width, and a same-origin iframe
 * is the only 1:1 surface the lab has. A 1920 iframe is a real 1920 viewport,
 * which is also why the site's fluid type ladder resolves here at the size a
 * room really reads it.
 *
 * The default is 1440 by 810, the same 16:9 composition at the size a
 * reviewer's laptop shows whole at 1:1; the knob is a real television's 1920,
 * where the pixels are the room's own.
 */

export const SCREENS = {
  "1440": { w: 1440, h: 810, name: "a 1440 screen" },
  "1920": { w: 1920, h: 1080, name: "a 1920 screen" },
} as const;
export type ScreenId = keyof typeof SCREENS;
export const screenOf = (v: string | undefined): ScreenId =>
  v === "1920" ? "1920" : "1440";

/** `Measured` is the kit's. ★ 2200 at the tail, not the kit's 1800: the
 *  engine's two stills and the code's dynamic import land late. */
const SCREEN_TIMERS = [200, 900, 2200];

export function Wall({
  id,
  screen,
  title,
  measure,
  children,
}: {
  id: string;
  screen: ScreenId;
  title: string;
  measure: (root: HTMLElement) => string | null;
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
        title={`${title}, ${SCREENS[screen].name}`}
        caption={measured}
      >
        {/* ★ THE TELEVISION TAKES THE FRAME'S OWN VIEWPORT, NOT `100%`. A
            portalled frame's <body> has no height of its own, so a `size-full`
            television collapsed to zero and every absolutely placed corner
            landed above the top of the screen. Inside the iframe `100vw` and
            `100vh` ARE the declared w and h. */}
        <div
          className="relative overflow-hidden bg-black text-white"
          style={{ width: "100vw", height: "100vh" }}
        >
          <Measured
            probe={measure}
            deps={[screen, id]}
            onMeasure={setMeasured}
            timers={SCREEN_TIMERS}
            className="size-full"
          >
            {children}
          </Measured>
        </div>
      </Frame>
    </Fit>
  );
}
