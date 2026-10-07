"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

import { Fit, Frame, Measured } from "@/components/lab";

import { SCREENS, type ScreenId } from "./knobs";

/**
 * THE FRAMES EVERY OPTION IS READ IN: her phone at 375 by 812 (the default)
 * or her laptop at 1440 by 900 (the Screen knob), 1:1 in the kit's `Frame`, a
 * same-origin iframe, so a breakpoint, a `vh` and a production popup all
 * answer the frame's own width and the room's panel covers the frame's own
 * screen.
 *
 * ★ NOTHING HERE REACHES A SESSION OR WRITES: every act production's parts are
 * handed answers after a round trip and changes nothing (`acts.ts`), and the
 * candidates' rows are drawings with no act behind them.
 *
 * ★ EVERY CAPTION IS READ OFF THE FRAME, NEVER TYPED: a drawing marks the
 * pieces a decision is about (`data-gr-read="<what>"`), and the caption prints
 * what the frame's own document says there. If a caption and the words above
 * a frame disagree, the caption is the truth.
 */

const textOf = (el: Element | null | undefined) =>
  ((el as HTMLElement | null)?.innerText ?? "").replace(/\s+/g, " ").trim();

const clip = (s: string, n = 96) =>
  s.length > n ? `${s.slice(0, n - 1)}…` : s;

/** The frame, read: every marked piece in document order (portalled ones too), its words. */
export function readMarks(root: HTMLElement): string | null {
  const doc = root.ownerDocument;
  const marked = [...doc.querySelectorAll<HTMLElement>("[data-gr-read]")];
  const read = marked.map((el) => {
    const words = textOf(el);
    return `${el.dataset.grRead}: ${words ? `"${clip(words)}"` : "nothing drawn"}`;
  });
  // A frame that presses a name for its card says so when the name opens none.
  if (
    doc.querySelector("[data-gr-expect-card]") &&
    !doc.querySelector('[data-slot="guest-peek"]')
  )
    read.push("the card: none opens from this name");
  return read.length ? read.join("; ") : null;
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
          timers={[500, 1400, 2800]}
          className="min-h-full"
        >
          {children}
        </Measured>
      </Frame>
    </Fit>
  );
}

/** One option's frames, left to right down the room: phones in a row, laptops two to a row. */
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
 * The first element matching a selector, and holding these words where some are
 * given: production's own controls carry no hook of the board's, so a press on
 * one is found by what it says ("31 guests added photos").
 */
function first(doc: Document, selector: string, text?: string) {
  if (!text) return doc.querySelector<HTMLElement>(selector);
  return (
    [...doc.querySelectorAll<HTMLElement>(selector)].find((el) =>
      (el.textContent ?? "").includes(text),
    ) ?? null
  );
}

/** Retries a find in the frame's document until production has drawn it (a popup portals a beat late). */
function useFound(
  selector: string,
  run: (el: HTMLElement, doc: Document) => (() => void) | void,
  text?: string,
) {
  const probe = useRef<HTMLSpanElement>(null);
  const runRef = useRef(run);
  useEffect(() => {
    runRef.current = run;
  });
  useEffect(() => {
    const doc = probe.current?.ownerDocument;
    if (!doc) return;
    let tries = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let undo: (() => void) | void;
    const find = () => {
      const el = first(doc, selector, text);
      if (!el) {
        if (tries++ < 160) timer = setTimeout(find, 50);
        return;
      }
      undo = runRef.current(el, doc);
    };
    find();
    return () => {
      clearTimeout(timer);
      undo?.();
    };
  }, [selector, text]);
  return probe;
}

/** Marks one of production's own pieces for the caption (`data-gr-read`), once it is drawn. */
export function Mark({ at, as }: { at: string; as: string }) {
  const probe = useFound(at, (el) => {
    el.dataset.grRead = as;
    return () => {
      delete el.dataset.grRead;
    };
  });
  return <span ref={probe} hidden />;
}

/**
 * A press production's own control takes once it is drawn: the frame opens
 * mid-moment (a name's card open). ★ PRESSED AGAIN UNTIL IT TOOK (`until`): a
 * frame's first document can be drawn before production's handlers answer,
 * so a single press could land on a control that did nothing with it.
 */
export function Press({
  at,
  until,
  text,
}: {
  at: string;
  until: string;
  /** Words the control holds, where it has no hook of the board's (production's own). */
  text?: string;
}) {
  const probe = useFound(
    at,
    (el, doc) => {
      let tries = 0;
      let timer: ReturnType<typeof setTimeout> | undefined;
      const press = () => {
        if (doc.querySelector(until)) return;
        (first(doc, at, text) ?? el).click();
        if (tries++ < 14) timer = setTimeout(press, 450);
      };
      timer = setTimeout(press, 350);
      return () => clearTimeout(timer);
    },
    text,
  );
  return <span ref={probe} hidden />;
}

/**
 * Scrolls the room's own scroller so one of its pieces stands at the top of
 * the screen, as she would have scrolled to it: the panel's body is the
 * scroller, never the page under it.
 */
export function Reveal({ at, offset = 12 }: { at: string; offset?: number }) {
  const probe = useFound(at, (el) => {
    const timer = setTimeout(() => {
      let box: HTMLElement | null = el.parentElement;
      while (box && box.scrollHeight <= box.clientHeight + 1)
        box = box.parentElement;
      if (!box) return;
      const top =
        el.getBoundingClientRect().top -
        box.getBoundingClientRect().top +
        box.scrollTop -
        offset;
      box.scrollTo({ top, behavior: "instant" });
    }, 600);
    return () => clearTimeout(timer);
  });
  return <span ref={probe} hidden />;
}
