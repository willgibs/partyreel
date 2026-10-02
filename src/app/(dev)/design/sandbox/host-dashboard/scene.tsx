"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

import { Fit, Frame, Measured } from "@/components/lab";

import { SCREENS, type ScreenId } from "./knobs";
import { WideProvider } from "./ui";

/**
 * THE FRAMES EVERY DECISION DRAWS IN: the dashboard at 1440 by 900 (a
 * laptop, the default) or 375 by 812 (a phone, on the Screen knob), 1:1 in
 * the kit's `Frame`, a same-origin iframe, so a line wraps where it will wrap.
 * Each option draws two of them side by side: Maya with one event and Jo with
 * forty, on the same day.
 *
 * ★ NOTHING HERE REACHES A SESSION, A SERVER FUNCTION OR THE NETWORK. The
 * shell is production's, fed the fixtures; every act is a button that goes
 * nowhere (`tabIndex={-1}`); every photograph is a bootstrap still at a crop.
 *
 * ★ EVERY CAPTION IS READ OFF THE FRAME, NEVER ASSERTED: what leads the first
 * screen, how many things on it ask for an act, how many events it draws, what
 * the bell holds. If a caption and the words above a frame disagree, the
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
          timers={[300, 1100, 2200]}
          className="min-h-full"
        >
          <WideProvider wide={screen === "1440"}>{children}</WideProvider>
        </Measured>
      </Frame>
    </Fit>
  );
}

/**
 * THE FRAMES OF ONE OPTION: one event beside forty. Laptops stand in a row
 * the stage scales whole (`whole.ts` finds the width that draws them
 * largest); phones stand in a row too.
 */
export function Story({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-start gap-6">{children}</div>;
}

/* ── what the frames read ──────────────────────────────────────────────── */

/** An element's own words, whitespace folded. */
export const textOf = (el: Element | null | undefined) =>
  ((el as HTMLElement | null)?.innerText ?? "").replace(/\s+/g, " ").trim();

/** The elements matching `sel` that stand on the frame's first screen. */
export function onFirstScreen(root: HTMLElement, win: Window, sel: string) {
  return [...root.querySelectorAll<HTMLElement>(sel)].filter((el) => {
    const r = el.getBoundingClientRect();
    return r.height > 0 && r.top < win.innerHeight && r.bottom > 0;
  });
}

/** Two readers, one caption: each part must have settled. */
export const both =
  (a: Reader, b: Reader): Reader =>
  (root, win) => {
    const x = a(root, win);
    const y = b(root, win);
    return x && y ? `${x}; ${y}` : null;
  };

/**
 * SCROLLS THE FRAME SO ITS OWN SPOT SITS AT THE TOP, once the frame has
 * settled (`disposable-mode`'s, retyped: a board's folder leaves whole when it
 * retires). A frame about the collection opens scrolled to it.
 */
export function ScrollHere({ offset = 72 }: { offset?: number }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    const win = el?.ownerDocument.defaultView;
    if (!el || !win) return;
    const go = () => {
      const top = el.getBoundingClientRect().top;
      win.scrollTo(0, win.scrollY + top - offset);
    };
    go();
    const timers = [150, 600, 1500].map((ms) => win.setTimeout(go, ms));
    win.document.fonts?.ready.then(go).catch(() => {});
    return () => timers.forEach((t) => win.clearTimeout(t));
  }, [offset]);
  return <span ref={ref} aria-hidden data-hd-scroll="" className="block h-0" />;
}
