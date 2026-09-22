"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

import { Frame, useLabPrefs } from "@/components/lab";

import { SCREENS, type ScreenId } from "./room";

/**
 * THE FRAME EVERY DECISION DRAWS IN (the machinery `guest-capture` and
 * `identity-door` share, carried here verbatim so nothing about the stage
 * differs between boards over this album).
 *
 * ★ PHONE FIRST, 1440 ON THE KNOB. A cut is made on the device it will be
 * posted from, so 375 is the primary read; 1440 exists because the same guest
 * opens the album on a laptop later, and because `room` is a question about a
 * laptop and draws both at once.
 *
 * ★ NOTHING HERE REACHES A SESSION, A SERVER FUNCTION OR THE NETWORK ON
 * MOUNT, and nothing mounts a Radix portal: a portal opened inside a portalled
 * lab frame renders on the LAB PAGE's document, not the phone being judged.
 */

function Fit({ w, children }: { w: number; children: ReactNode }) {
  const { fit } = useLabPrefs();
  const zoomed = fit === "zoom";
  const box = useRef<HTMLDivElement | null>(null);
  const [room, setRoom] = useState<number | null>(null);

  useEffect(() => {
    const el = box.current;
    if (!el || !zoomed) return;
    const sync = () => setRoom(el.getBoundingClientRect().width);
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, [zoomed]);

  const k = zoomed && room ? Math.min(1, room / w) : 1;
  return (
    <div
      ref={box}
      data-stage-fit={zoomed ? "zoom" : "true"}
      className={zoomed ? "min-w-0 overflow-hidden" : "min-w-0 overflow-x-auto"}
    >
      <div style={{ width: w, zoom: k }}>{children}</div>
    </div>
  );
}

/** A number read off the frame's own document, never computed by the author. */
function Measured({
  probe,
  deps,
  onMeasure,
  children,
}: {
  /** `null` means "not settled yet": the read is skipped rather than
   *  overwriting the caption with a lie. */
  probe: (root: HTMLElement, win: Window) => string | null;
  deps: unknown[];
  onMeasure: (text: string) => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const report = useRef(onMeasure);
  useEffect(() => {
    report.current = onMeasure;
  });
  useEffect(() => {
    const el = ref.current;
    const win = el?.ownerDocument.defaultView;
    if (!el || !win) return;
    const read = () => {
      try {
        const said = probe(el, win);
        if (said) report.current(said);
      } catch {
        // Not settled yet; the next timer or resize catches it.
      }
    };
    read();
    // The engine's own pass lands late (eighteen sequential draws), so the
    // last read is deliberately far out: a caption taken before the stills
    // arrive would measure an empty box and report it as the truth.
    const timers = [200, 900, 1800, 3600, 6000].map((ms) =>
      win.setTimeout(read, ms),
    );
    const ro = new win.ResizeObserver(read);
    ro.observe(el);
    return () => {
      timers.forEach((t) => win.clearTimeout(t));
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return <div ref={ref}>{children}</div>;
}

export type Reader = (root: HTMLElement, win: Window) => string | null;

export function Scene({
  id,
  screen,
  title,
  caption,
  measure,
  children,
}: {
  id: string;
  screen: ScreenId;
  title: string;
  /** A static caption. Omit and pass `measure` for a number read off the frame. */
  caption?: string;
  measure?: Reader;
  children: ReactNode;
}) {
  const { w, h } = SCREENS[screen];
  const [measured, setMeasured] = useState("measuring");
  const body = measure ? (
    <Measured probe={measure} deps={[screen, id]} onMeasure={setMeasured}>
      {children}
    </Measured>
  ) : (
    children
  );
  return (
    <Fit w={w}>
      <Frame
        id={`${id}-${screen}`}
        w={w}
        h={h}
        title={`${title}, ${SCREENS[screen].name}`}
        caption={measure ? measured : caption}
      >
        {body}
      </Frame>
    </Fit>
  );
}

/**
 * BOTH SCREENS AT ONCE, for the one decision whose question is literally "at a
 * laptop and in a hand". The laptop leads, because that is where the question
 * bites, and it carries the measurement; the phone stands under it.
 *
 * ★ STACKED, NEVER SIDE BY SIDE, and a capture found the reason. Set beside
 * each other the row is 1,839 px, which the board's own column clips: the
 * bench's whole point, a panel standing BESIDE the cut, fell off the right of
 * every screenshot, and zooming the pair to fit shrank the laptop to 57
 * percent. Stacked, the widest thing on the stage is one 1440 frame, so Fit
 * reads it at about three quarters and 1:1 needs no horizontal scroll at all.
 */
export function TwoScreens({
  id,
  title,
  measure,
  phone,
  laptop,
}: {
  id: string;
  title: string;
  measure?: Reader;
  phone: ReactNode;
  laptop: ReactNode;
}) {
  const [measured, setMeasured] = useState("measuring");
  const top = measure ? (
    <Measured probe={measure} deps={[id]} onMeasure={setMeasured}>
      {laptop}
    </Measured>
  ) : (
    laptop
  );
  return (
    <Fit w={SCREENS["1440"].w}>
      <div className="flex flex-col gap-6">
        <Frame
          id={`${id}-1440`}
          w={SCREENS["1440"].w}
          h={SCREENS["1440"].h}
          title={`${title}, a laptop`}
          caption={measure ? measured : undefined}
        >
          {top}
        </Frame>
        <Frame
          id={`${id}-375`}
          w={SCREENS["375"].w}
          h={SCREENS["375"].h}
          title={`${title}, a phone`}
        >
          {phone}
        </Frame>
      </div>
    </Fit>
  );
}
