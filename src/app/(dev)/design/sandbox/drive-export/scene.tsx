"use client";

import { type ReactNode, useState } from "react";

import { Fit, Frame, Measured } from "@/components/lab";

import { SCREENS, type ScreenId } from "./knobs";

/**
 * THE FRAMES EVERY MOMENT IS READ IN: her laptop at 1440 by 900 (the default)
 * or her phone at 375 by 812 (the Screen knob), 1:1 in the kit's `Frame`, a
 * same-origin iframe, so a breakpoint, a `vh` and a production popup all answer
 * the frame's own width and a fixed layer covers the frame's own screen.
 *
 * ★ NOTHING HERE REACHES A SESSION, A SERVER FUNCTION, GOOGLE OR THE NETWORK
 * beyond the stand-in photographs; every press is inert.
 *
 * ★ EVERY CAPTION IS READ OFF THE FRAME, NEVER TYPED: a drawing marks the
 * pieces a decision is about (`data-dx-read="<what>"`, and `data-dx-w` where a
 * width matters), and the caption prints what the frame's own document says
 * there and how wide it is. If a caption and the words above a frame disagree,
 * the caption is the truth.
 */

/** An element's own words, whitespace folded. */
const textOf = (el: Element | null | undefined) =>
  ((el as HTMLElement | null)?.innerText ?? "").replace(/\s+/g, " ").trim();

/** Clipped for a caption: a long line keeps its head. */
const clip = (s: string, n = 90) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

/**
 * THE FRAME, READ: every marked piece in document order, its words and, where
 * marked, its drawn width; a piece that is drawn but empty says so rather than
 * vanishing from the caption.
 */
export function readMarks(root: HTMLElement): string | null {
  const marked = [...root.querySelectorAll<HTMLElement>("[data-dx-read]")];
  // Pieces portalled into the frame's body (a popup, a toast) are read from the document too.
  const doc = root.ownerDocument;
  for (const el of doc.querySelectorAll<HTMLElement>("[data-dx-read]"))
    if (!marked.includes(el)) marked.push(el);
  if (!marked.length) return null;
  const parts = marked.map((el) => {
    const what = el.dataset.dxRead ?? "";
    const words = textOf(el);
    const width =
      el.dataset.dxW !== undefined
        ? `, ${Math.round(el.getBoundingClientRect().width)} px wide`
        : "";
    return `${what}${width}: ${words ? `"${clip(words)}"` : "nothing drawn"}`;
  });
  return parts.join("; ");
}

export function Scene({
  id,
  screen,
  title,
  h,
  children,
}: {
  id: string;
  screen: ScreenId;
  title: string;
  /** A frame shorter than the screen, where only its top is the question. */
  h?: number;
  children: ReactNode;
}) {
  const { w, h: screenH, name } = SCREENS[screen];
  const [caption, setCaption] = useState("measuring");
  return (
    <Fit w={w}>
      <Frame
        id={`${id}-${screen}`}
        w={w}
        h={h ?? screenH}
        title={`${title}, ${name}`}
        caption={caption}
      >
        <Measured
          probe={(root) => readMarks(root)}
          deps={[id, screen]}
          onMeasure={setCaption}
          timers={[300, 1000, 2200]}
          className="min-h-full"
        >
          {children}
        </Measured>
      </Frame>
    </Fit>
  );
}

/**
 * ONE OPTION'S FRAMES, left to right as her morning runs. Phones stand in a
 * row; laptops two to a row, since a 1440 frame alone is the stage's width.
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
