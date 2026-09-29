"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

import { Fit, Frame, Measured } from "@/components/lab";

import { SCREENS, type ScreenId } from "./knobs";

/**
 * THE ONE FRAME EVERY DECISION DRAWS IN.
 *
 * ★ A PHONE FIRST: 375 BY 812. A disposable is shot standing up at a party,
 * in the album a guest holds in one hand, so every guest frame is that phone
 * at 1:1 (the kit's `Frame`, a same-origin iframe, so a line wraps where it
 * will wrap and a `sm:` class answers the phone's width, not the lab's). The
 * host's hub and Create are drawn at 1440 too, on the Screen knob, and the
 * room's screen is a 16:9 wall.
 *
 * ★ NOTHING HERE REACHES A SESSION, A SERVER FUNCTION, THE CAMERA OR THE
 * NETWORK, AND NOTHING MOUNTS A RADIX PORTAL. A Dialog, Sheet or Popover
 * opened inside a portalled frame renders on the LAB PAGE's document, not the
 * phone being judged, so every floating surface here is QUOTED: the shipped
 * classes and postures, never the primitive. `fixed`, never `absolute`, for
 * anything pinned to the screen: the frame IS the viewport. Every camera's
 * live picture is a photograph standing in for the stream (a frame asking for
 * the reader's camera would be a permission prompt on a design review; the
 * dock's Measure is the one place the board asks, and only when pressed).
 *
 * ★ EVERY CAPTION IS READ OFF THE FRAME, NEVER ASSERTED: where the shutter
 * sits for a thumb, what the count says, how many steps Create takes, what an
 * estimate reads. If a caption and the words above a frame disagree, the
 * caption is the truth.
 */

export type Reader = (root: HTMLElement, win: Window) => string | null;

export function Scene({
  id,
  screen = "375",
  title,
  measure,
  caption,
  children,
}: {
  id: string;
  screen?: ScreenId;
  title: string;
  /** A number read off the frame for its caption. */
  measure?: Reader;
  /** A static caption where nothing on the frame is worth measuring. */
  caption?: string;
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
        caption={measure ? measured : caption}
      >
        {measure ? (
          <Measured
            probe={measure}
            deps={[id, screen]}
            onMeasure={setMeasured}
            className="min-h-full"
          >
            {children}
          </Measured>
        ) : (
          children
        )}
      </Frame>
    </Fit>
  );
}

/**
 * THE FRAMES OF ONE OPTION, read left to right as time runs. Phones stand in
 * a row (it wraps where the stage is narrower); laptops and the room's screen
 * stack, since two 1440 frames side by side would each be a thumbnail.
 */
export function Story({
  screen = "375",
  children,
}: {
  screen?: ScreenId;
  children: ReactNode;
}) {
  if (screen !== "375")
    return <div className="flex flex-col gap-6">{children}</div>;
  return <div className="flex flex-wrap items-start gap-6">{children}</div>;
}

/* ── what the frames read ──────────────────────────────────────────────── */

/** An element's own words, whitespace folded. */
export const textOf = (el: Element | null | undefined) =>
  ((el as HTMLElement | null)?.innerText ?? "").replace(/\s+/g, " ").trim();

/**
 * WHERE AN ACT SITS FOR A THUMB: the element marked `data-dm-reach`, its size
 * and how far down the screen its middle is. A shutter a guest has to stretch
 * for is read here rather than asserted in a sentence.
 */
export const reach =
  (what: string): Reader =>
  (root, win) => {
    const el = root.querySelector<HTMLElement>("[data-dm-reach]");
    if (!el) return null;
    const r = el.getBoundingClientRect();
    if (r.height < 1) return null;
    const down = Math.round(((r.top + r.height / 2) / win.innerHeight) * 100);
    return `${what}: ${Math.round(r.width)} by ${Math.round(r.height)} px, ${down}% of the way down`;
  };

/** What the element marked `data-dm-say` says, in a sentence of the caller's. */
export const says =
  (frame: (words: string) => string): Reader =>
  (root) => {
    const words = textOf(root.querySelector("[data-dm-say]"));
    return words ? frame(words) : null;
  };

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
 * settled (`voice-guest`'s `ScrollHere`, retyped: a board's folder leaves
 * when the board retires). The album's rows sit below a phone's first screen, so a
 * frame about what stands there opens scrolled to them. Re-runs as the
 * webfont lands; a second run is a no-op.
 */
export function ScrollHere({ offset = 12 }: { offset?: number }) {
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
  return <span ref={ref} aria-hidden className="block h-0" />;
}
