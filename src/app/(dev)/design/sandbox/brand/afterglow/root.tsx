"use client";

import type { CSSProperties, ReactNode } from "react";

import type { ScreenId } from "../knobs";
import type { Ground } from "./system";
import { groundOf, inkOf, useTake } from "./take";

/**
 * A SLIDE'S ROOT: the whole 1440 by 900 (or 375 wide) box on its ground (the
 * room, or the take's own paper), painted in hex so the deck's contrast reader
 * finds it, with the running head's band (`HEAD`) left clear of words by each
 * slide's own layout.
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
  const take = useTake();
  return (
    <div
      className={["ag-slide", className].filter(Boolean).join(" ")}
      data-screen={screen}
      data-ground={ground}
      data-take={take.id}
      style={{
        background: groundOf(take, ground).hex,
        color: inkOf(take, ground).fg,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
