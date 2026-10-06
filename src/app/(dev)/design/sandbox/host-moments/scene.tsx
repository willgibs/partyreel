"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { Fit, Frame, Measured } from "@/components/lab";

import { SCREENS, type ScreenId } from "./knobs";

/**
 * THE FRAMES EVERY MOMENT IS READ IN: her laptop at 1440 by 900 (the default)
 * or her phone at 375 by 812 (the Screen knob), 1:1 in the kit's `Frame`, a
 * same-origin iframe, so a breakpoint, a `vh` and a production popup all answer
 * the frame's own width and a fixed layer covers the frame's own screen.
 *
 * ★ NOTHING HERE REACHES A SESSION, A SERVER FUNCTION OR THE NETWORK beyond
 * the stand-in photographs: every write production's components are handed
 * answers after a round trip and changes nothing.
 *
 * ★ EVERY CAPTION IS READ OFF THE FRAME, NEVER TYPED: a drawing marks the
 * pieces a decision is about (`data-hm-read="<what>"`), and the caption prints
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
  const marked = [...doc.querySelectorAll<HTMLElement>("[data-hm-read]")];
  if (!marked.length) return null;
  return marked
    .map((el) => {
      const words = textOf(el);
      return `${el.dataset.hmRead}: ${words ? `"${clip(words)}"` : "nothing drawn"}`;
    })
    .join("; ");
}

export function Scene({
  id,
  screen,
  title,
  css,
  children,
}: {
  id: string;
  screen: ScreenId;
  title: string;
  /** A stylesheet for this frame alone (an option that hides one of production's lines, to draw its own). */
  css?: string;
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
        css={css}
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

/** Retries a find in the frame's document until production has drawn it (a popup portals a beat late). */
function useFound(
  selector: string,
  run: (el: HTMLElement, doc: Document) => (() => void) | void,
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
      const el = doc.querySelector<HTMLElement>(selector);
      if (!el) {
        if (tries++ < 60) timer = setTimeout(find, 50);
        return;
      }
      undo = runRef.current(el, doc);
    };
    find();
    return () => {
      clearTimeout(timer);
      undo?.();
    };
  }, [selector]);
  return probe;
}

/**
 * ONE PIECE DRAWN INTO PRODUCTION'S OWN PAGE (a candidate's line beside the
 * control it is about), so an option changes exactly what it proposes and the
 * rest of the frame stays production's, pixel for pixel.
 */
export function Graft({
  at,
  place = "after",
  children,
}: {
  /** The production element the piece stands beside, by selector. */
  at: string;
  place?: "after" | "before" | "start" | "end";
  children: ReactNode;
}) {
  const [host, setHost] = useState<HTMLElement | null>(null);
  const probe = useFound(at, (anchor, doc) => {
    const made = doc.createElement("div");
    made.dataset.hmGraft = "";
    if (place === "after") anchor.after(made);
    else if (place === "before") anchor.before(made);
    else if (place === "start") anchor.prepend(made);
    else anchor.append(made);
    setHost(made);
    return () => {
      made.remove();
      setHost(null);
    };
  });
  return (
    <>
      <span ref={probe} hidden />
      {host ? createPortal(children, host) : null}
    </>
  );
}

/**
 * A press production's own control takes once it is drawn: the frame opens
 * mid-moment. ★ PRESSED AGAIN UNTIL IT TOOK (`until`): a frame's first
 * document can be drawn before production's handlers answer (the stage's
 * first option paints while the page is still settling), so a single press
 * could land on a control that did nothing with it.
 */
export function Press({ at, until }: { at: string; until?: string }) {
  const probe = useFound(at, (el, doc) => {
    let tries = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const press = () => {
      if (until && doc.querySelector(until)) return;
      (doc.querySelector<HTMLElement>(at) ?? el).click();
      if (until && tries++ < 12) timer = setTimeout(press, 400);
    };
    press();
    return () => clearTimeout(timer);
  });
  return <span ref={probe} hidden />;
}

/** Marks one of production's own pieces for the caption (`data-hm-read`), once it is drawn. */
export function Mark({ at, as }: { at: string; as: string }) {
  const probe = useFound(at, (el) => {
    el.dataset.hmRead = as;
    return () => {
      delete el.dataset.hmRead;
    };
  });
  return <span ref={probe} hidden />;
}

/** Brings one of production's pieces into view in its own scroller, once drawn: the moment is below the panel's fold. */
export function Reveal({ at }: { at: string }) {
  const probe = useFound(at, (el) => {
    const timer = setTimeout(
      () => el.scrollIntoView({ block: "center", behavior: "instant" }),
      600,
    );
    return () => clearTimeout(timer);
  });
  return <span ref={probe} hidden />;
}
