"use client";

import { type ReactNode, useState } from "react";

import { Fit, Frame } from "@/components/lab";

import { SCREENS, type ScreenId } from "./screens";

/**
 * THE ONE CANVAS EVERY DECISION DRAWS IN: a real viewport at a real width, the
 * real `rows` album inside it, portalled rather than routed (nothing here
 * reaches a session, a Server Function or the network).
 *
 * ★ A REAL FRAME, NEVER A STYLED DIV. The rows measure their own box, but the
 * first paint's width classes are container queries and every tile's hover
 * row is an `md:` breakpoint, which a div would answer from the BROWSER's
 * width; a frame answers them from the width it claims (`Frame`'s own doc).
 *
 * ★ EVERY CAPTION IS READ OFF THE FRAME, NEVER COMPUTED (the album-motion
 * precedent). Each showcase reads its own album in the frame's document, the
 * rows as the browser drew them (tiles grouped by where each really sits),
 * and hands the words up through `report`; so the caption under a picture is
 * the browser's answer, not the engine's claim about itself.
 */
export function Canvas({
  id,
  screen,
  title,
  children,
}: {
  id: string;
  screen: ScreenId;
  title: string;
  children: (report: (text: string) => void) => ReactNode;
}) {
  const { w, h, name } = SCREENS[screen];
  const [caption, setCaption] = useState("measuring");
  return (
    <Fit w={w}>
      <Frame
        id={`${id}-${screen}`}
        w={w}
        h={h}
        title={`${title}, ${name}`}
        caption={caption}
        onApproach
      >
        {children(setCaption)}
      </Frame>
    </Fit>
  );
}

/** The app's own ground: the guest album's 20px gutter, no marketing skin. */
export function Ground({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-full bg-background px-5 py-5 text-foreground">
      {children}
    </div>
  );
}

/**
 * THE ROWS AS THE BROWSER DREW THEM: every tile in the frame's album, grouped
 * into rows by where it really sits (its layout top, to the pixel), each row's
 * ids in order and its height. Read, never derived from the engine.
 */
export function readRows(
  root: ParentNode,
): { ids: string[]; height: number }[] {
  const grid = root.querySelector("[data-album-grid]");
  if (!grid) return [];
  const rows = new Map<number, { ids: string[]; height: number }>();
  grid
    .querySelectorAll<HTMLElement>(":scope > [data-rows-key]")
    .forEach((el) => {
      // The layout box, not the painted one: a gliding tile is mid-transform.
      const top = el.offsetTop;
      const row = rows.get(top) ?? { ids: [], height: el.offsetHeight };
      row.ids.push(el.dataset.rowsKey!);
      rows.set(top, row);
    });
  return [...rows.entries()].sort((a, b) => a[0] - b[0]).map(([, r]) => r);
}
