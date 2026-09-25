"use client";

import { type ReactNode, useState } from "react";

import { Fit, Frame, Measured } from "@/components/lab";

import { SCREENS, type ScreenId } from "./screens";

/**
 * THE ONE FRAME EVERY DECISION DRAWS IN: a real viewport at a real width, the
 * real marketing pieces portalled into it (nothing here reaches a session, a
 * Server Function or the network).
 *
 * ★ A REAL FRAME, NEVER A STYLED DIV (round 1's defect, the brief's first
 * correction). Every `sm:`/`lg:` in a marketing section and every step of the
 * type ladder (a `vw` clamp) answers the width it lays out in, and only an
 * iframe claims a width of its own (`Frame`'s doc, the `vw-in-a-narrow-div`
 * trap).
 *
 * ★ THE ENGINE AND THE RIVER RUN INSIDE IT, MEASURED (2026-09-25). Earlier
 * boards drew the reel as stills on the belief that a portalled frame starves a
 * canvas player: the JSX runs in the lab page's realm, so its
 * IntersectionObserver and `document` are the lab page's. Measured on this
 * board before building on it: the observer is created in the lab's realm with
 * the implicit root, which is the top-level viewport, so it DOES see a target
 * inside a same-origin frame, and the live player and the river both stop when
 * the frame scrolls out of the window and resume when it comes back (the
 * canvas's pixels sampled a second apart). What still cannot cross is a radix
 * portal (it lands in the lab page's body), so nothing drawn here opens one.
 *
 * ★ AS TALL AS WHAT IT DRAWS, EXCEPT A SCREEN. A section is judged whole, so a
 * `content` frame grows to its drawing (read off the frame's own document, the
 * kit's `Measured`), and nothing inside one uses a `vh` unit, which would chase
 * the height it sets. A `screen` frame is the device's own screen (1440 by
 * 900, 375 by 812), because a layer over the page covers exactly one.
 *
 * ★ EVERY CAPTION IS READ OFF THE FRAME, NEVER COMPUTED: a line count is the
 * box's height over its line-height after the webfont settles, a size is the
 * box the browser drew.
 */
export function Scene({
  id,
  screen,
  title,
  viewport = "content",
  measure,
  children,
}: {
  id: string;
  screen: ScreenId;
  title: string;
  viewport?: "content" | "screen";
  measure: (root: HTMLElement, win: Window) => string | null;
  children: ReactNode;
}) {
  const { w, h: screenH, name } = SCREENS[screen];
  const [caption, setCaption] = useState("measuring");
  const [drawn, setDrawn] = useState<number | null>(null);
  const h = viewport === "screen" ? screenH : Math.max(240, drawn ?? screenH);
  return (
    <Fit w={w}>
      <Frame
        id={`${id}-${screen}`}
        w={w}
        h={h}
        title={`${title}, ${w} wide, ${name}`}
        caption={caption}
        onApproach
      >
        <Measured
          probe={(root, win) => {
            if (viewport === "content") {
              const tall = Math.ceil(root.getBoundingClientRect().height);
              if (tall > 0) setDrawn((prev) => (prev === tall ? prev : tall));
            }
            return measure(root, win);
          }}
          deps={[screen, id]}
          onMeasure={setCaption}
          timers={[200, 900, 1800, 3200]}
          className={viewport === "screen" ? "size-full" : undefined}
        >
          {children}
        </Measured>
      </Frame>
    </Fit>
  );
}

/**
 * THE CINEMA ROOM, as `(cinema)/layout.tsx` wraps every dark marketing page:
 * the descendant-scoped `dark` flip, `data-mkt` (the marketing tokens and
 * grammar are scoped to it) and the cinema skin, which deepens the ground to
 * the ruled room. `text-foreground` resolves ink at the wrapper, exactly as the
 * layout's own comment says it must.
 */
export function CinemaRoom({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={
        "dark overflow-x-clip bg-background text-foreground" +
        (className ? ` ${className}` : "")
      }
      data-mkt
      data-mkt-skin="cinema"
    >
      {children}
    </div>
  );
}

/** How many lines a block of copy took, read off the rendered box (the kit's
 *  `useLineCount` arithmetic, run in the frame's own window). */
export function linesOf(el: Element | null, win: Window): number | null {
  if (!el) return null;
  const lh = Number.parseFloat(win.getComputedStyle(el).lineHeight);
  if (!Number.isFinite(lh) || lh <= 0) return null;
  return Math.max(1, Math.round(el.getBoundingClientRect().height / lh));
}

/** "1 line" / "2 lines". */
export function linesLabel(n: number | null): string {
  if (n === null) return "?";
  return `${n} ${n === 1 ? "line" : "lines"}`;
}

/**
 * ★ A REAL <Link> IN A BOARD IS A TRAP THE BOARD DISARMS ITSELF (the
 * loose-ends / privacy-hero precedent). The step swallows a click on a link
 * on its own stage, but a frame is a document of its own, so every drawing
 * roots in this, which keeps the frame on the page it is judged on.
 */
export function stopLinks(e: React.MouseEvent) {
  if ((e.target as HTMLElement).closest?.("a[href]")) e.preventDefault();
}
