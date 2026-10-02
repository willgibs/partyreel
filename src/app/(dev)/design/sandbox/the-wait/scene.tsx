"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

import { Fit, Frame, Measured } from "@/components/lab";

import { SCREENS, type ScreenId } from "./knobs";

/**
 * THE FRAMES EVERY DECISION DRAWS IN: a phone at 375 by 812 (the default) or a
 * laptop at 1440 by 900 (the Screen knob), 1:1 in the kit's `Frame`, a
 * same-origin iframe, so a line wraps where it will wrap, `svh` is the frame's
 * own and a `sm:` or `md:` class answers the frame's width, not the lab's.
 *
 * ★ NOTHING HERE REACHES A SESSION, A SERVER FUNCTION OR THE NETWORK beyond the
 * stills. Production's pieces are drawn with fixtures (the cover, the shutter,
 * her uploads' round, Settings' control), every press inert; `fixed` is the
 * frame's own viewport, so the shutter stands at the frame's foot.
 *
 * ★ EVERY CAPTION IS READ OFF THE FRAME, NEVER ASSERTED: what the wait counts,
 * how many of hers are lit, what the album calls the wait. If a caption and
 * the words above a frame disagree, the caption is the truth.
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
          timers={[400, 1400, 2600]}
          className="min-h-full"
        >
          {children}
        </Measured>
      </Frame>
    </Fit>
  );
}

/**
 * THE FRAMES OF ONE OPTION, left to right as the night runs. Phones stand in a
 * row (the stage wraps them where it is narrower); laptops stack two to a row,
 * since a 1440 frame alone in a row is the stage's whole width.
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

/**
 * A FRAME SCROLLED, AS A GUEST WOULD HAVE IT: scrolls the frame's own document
 * (never the lab's) once it has laid out, so the cover has gone and the shutter
 * stands at the foot, exactly as production's page does past its sentinel.
 */
export function ScrolledTo({ y }: { y: number }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  useEffect(() => {
    const view = ref.current?.ownerDocument.defaultView;
    if (!view) return;
    const go = () => view.scrollTo({ top: y, behavior: "instant" });
    go();
    const timers = [120, 600, 1400].map((t) => view.setTimeout(go, t));
    return () => timers.forEach((t) => view.clearTimeout(t));
  }, [y]);
  return <span ref={ref} aria-hidden hidden />;
}

/* ── what the frames read ──────────────────────────────────────────────── */

/** An element's own words, whitespace folded. */
export const textOf = (el: Element | null | undefined) =>
  ((el as HTMLElement | null)?.innerText ?? "").replace(/\s+/g, " ").trim();

/** What one marked element says, framed in a sentence. */
export const said =
  (selector: string, frame: (words: string) => string): Reader =>
  (root) => {
    const words = textOf(root.querySelector(selector));
    return words ? frame(words) : null;
  };

/** Readers joined into one caption: each part must have settled. */
export const all =
  (...readers: Reader[]): Reader =>
  (root, win) => {
    const parts = readers.map((r) => r(root, win));
    return parts.every(Boolean) ? parts.join("; ") : null;
  };

/** Whether an element is on the frame's first screen (its middle inside the viewport). */
export function onScreen(el: Element, win: Window): boolean {
  const r = el.getBoundingClientRect();
  const mid = r.top + r.height / 2;
  return r.width > 0 && mid > 0 && mid < win.innerHeight;
}
