"use client";

import type { CSSProperties, ReactNode } from "react";

import type { ScreenId } from "../knobs";
import { GROUND, type Ground, INK } from "./system";

/**
 * A SLIDE'S ROOT: the whole 1440 by 900 (or 375 wide) box on its ground,
 * painted in hex so the deck's contrast reader finds it, with the running
 * head's band (`HEAD`) left clear of words by each slide's own layout.
 */
export function SlideRoot({
  screen,
  ground,
  children,
  className,
  style,
}: {
  screen: ScreenId;
  ground: Ground;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={["ag-slide", className].filter(Boolean).join(" ")}
      data-screen={screen}
      data-ground={ground}
      style={{
        background: GROUND[ground].hex,
        color: INK[ground].fg.hex,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** The ground's three text steps, as hex, for a slide's words. */
export const ink = (g: Ground) => ({
  fg: INK[g].fg.hex,
  muted: INK[g].muted.hex,
  faint: INK[g].faint.hex,
});
