"use client";

import { type ReactNode, useState } from "react";

import { Fit, Frame, Measured } from "@/components/lab";
import { columnsFor } from "@/components/shared/masonry";

/**
 * THE ONE CANVAS EVERY DECISION DRAWS IN: a real viewport at a real width, the
 * real fixture album inside it, portalled rather than routed (nothing here
 * reaches a session, a Server Function or the network). The width knobs
 * themselves live in `screens.ts`, kept free of React so `spec.ts` can declare
 * them as `configs`.
 *
 * ★ A REAL FRAME, NEVER A STYLED DIV. `columnsFor` reads the box's measured
 * `clientWidth`, so a div would get the column MATH right; what it gets wrong
 * is the pre-hydration CSS-columns paint, whose `sm:` step is a media query on
 * the real browser viewport, not on a div's own width (`Frame`'s own doc). A
 * board arguing about exactly where a column count turns cannot afford that
 * flash, so every option here is a real iframe at the width it claims.
 *
 * ★ EVERY COLUMN COUNT IS MEASURED, NEVER CLAIMED (the album-motion precedent):
 * `Measured` reads `[data-album-grid]` inside the frame's OWN document with
 * the production `columnsFor`, the exact function `MasonryColumns` calls on
 * itself, so the caption is the browser's own answer.
 */
export function measureColumns(root: HTMLElement): string | null {
  const grid = root.querySelector<HTMLElement>("[data-album-grid]");
  if (!grid) return null;
  const cols = columnsFor(grid);
  if (cols <= 0) return null;
  return `${cols} column${cols === 1 ? "" : "s"}, measured`;
}

export function Canvas({
  id,
  w,
  h = 760,
  title,
  caption,
  children,
}: {
  id: string;
  w: number;
  h?: number;
  title: string;
  /** A static caption; omit for the measured column count. */
  caption?: string;
  children: ReactNode;
}) {
  const [measured, setMeasured] = useState("measuring");
  return (
    <Fit w={w}>
      <Frame
        id={id}
        w={w}
        h={h}
        title={title}
        caption={caption ?? measured}
        onApproach
      >
        {caption ? (
          children
        ) : (
          <Measured
            probe={(root) => measureColumns(root)}
            deps={[id, w]}
            onMeasure={setMeasured}
          >
            {children}
          </Measured>
        )}
      </Frame>
    </Fit>
  );
}

/** The app's own ground under every canvas: plain background/foreground, no
 *  marketing skin (a guest album and a host feed carry neither). */
export function Ground({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-full bg-background px-5 py-5 text-foreground">
      {children}
    </div>
  );
}
