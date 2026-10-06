"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

import { Fit, Frame, Measured } from "@/components/lab";

import { SCREENS, type ScreenId } from "./knobs";

/**
 * THE FRAMES EVERY MOMENT IS READ IN: her phone at 375 by 812 (the default)
 * or her laptop at 1440 by 900 (the Screen knob), 1:1 in the kit's `Frame`, a
 * same-origin iframe, so a breakpoint, a `vh` and a production popup all
 * answer the frame's own width.
 *
 * ★ NOTHING HERE REACHES A SESSION, A SERVER FUNCTION OR THE NETWORK beyond
 * the stand-in photographs: every relation control is handed an act that
 * answers after a round trip and writes nothing (`fixtures.ts`).
 *
 * ★ EVERY CAPTION IS READ OFF THE FRAME, NEVER TYPED: a drawing marks the
 * pieces a decision is about (`data-am-read="<what>"`), and the caption prints
 * what the frame's own document says there. If a caption and the words above
 * a frame disagree, the caption is the truth.
 */

const textOf = (el: Element | null | undefined) =>
  ((el as HTMLElement | null)?.innerText ?? "").replace(/\s+/g, " ").trim();

const clip = (s: string, n = 110) =>
  s.length > n ? `${s.slice(0, n - 1)}…` : s;

/** The frame, read: every marked piece in document order (portalled ones too), its words. */
export function readMarks(root: HTMLElement): string | null {
  const doc = root.ownerDocument;
  const marked = [...doc.querySelectorAll<HTMLElement>("[data-am-read]")];
  if (!marked.length) return null;
  return marked
    .map((el) => {
      const words = textOf(el);
      return `${el.dataset.amRead}: ${words ? `"${clip(words)}"` : "nothing drawn"}`;
    })
    .join("; ");
}

export function Scene({
  id,
  screen,
  title,
  children,
}: {
  id: string;
  screen: ScreenId;
  title: string;
  children: ReactNode;
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
      >
        <Measured
          probe={(root) => readMarks(root)}
          deps={[id, screen]}
          onMeasure={setCaption}
          timers={[400, 1200, 2400]}
          className="min-h-full"
        >
          {children}
        </Measured>
      </Frame>
    </Fit>
  );
}

/** One option's frames, left to right as the moment runs: phones in a row, laptops two to a row. */
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
 * Brings the piece it wraps to the top of the frame once drawn: the moment
 * sits below the page's fold (Account's Connections card), and the frame
 * opens where she is, as she would have scrolled.
 */
export function Reveal({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const timer = setTimeout(
      () =>
        ref.current?.scrollIntoView({ block: "start", behavior: "instant" }),
      500,
    );
    return () => clearTimeout(timer);
  }, []);
  return (
    <div ref={ref} className="scroll-mt-20">
      {children}
    </div>
  );
}

/**
 * Marks one of production's own pieces for the caption once it is drawn: a
 * popup portals to the frame's body a beat late, out of reach of a wrapper.
 */
export function Mark({ at, as }: { at: string; as: string }) {
  const probe = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const doc = probe.current?.ownerDocument;
    if (!doc) return;
    let tries = 0;
    let found: HTMLElement | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const find = () => {
      found = doc.querySelector<HTMLElement>(at);
      if (found) found.dataset.amRead = as;
      else if (tries++ < 60) timer = setTimeout(find, 50);
    };
    find();
    return () => {
      clearTimeout(timer);
      if (found) delete found.dataset.amRead;
    };
  }, [at, as]);
  return <span ref={probe} hidden />;
}
