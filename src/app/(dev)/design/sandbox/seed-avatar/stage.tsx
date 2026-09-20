"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

import { Frame, useLabPrefs } from "@/components/lab";
import type { Control } from "@/components/lab/board-spec";

import { DRIFT_CSS } from "./orb";

/**
 * THE FRAME EVERY DECISION DRAWS IN: a true viewport with the real avatar
 * surfaces portalled into it, at 375 with 1440 on a knob.
 *
 * ★ 375 FIRST, AND HERE THAT IS THE ARGUMENT ITSELF. Will's case is about a
 * crowd: "Guest lists would feel rich and diverse, even without any custom avatars
 * uploaded." A crowd is only a crowd when it wraps, and twenty-four chips wrap into
 * six rows at a phone and two at a laptop. An orb judged one at a time on a desk is
 * an orb judged on the surface where the question does not exist.
 *
 * ★ THE DRIFT'S KEYFRAMES RIDE THE FRAME, not a stylesheet this lane does not own.
 * `Frame` copies the site's stylesheets into its iframe; a board's own animation is
 * not in them, so it is declared here and injected once per frame.
 */
export const SCREENS = {
  "375": { w: 375, h: 812, name: "a phone" },
  "1440": { w: 1440, h: 900, name: "a laptop" },
} as const;
export type ScreenId = keyof typeof SCREENS;
export const screenOf = (v: string | undefined): ScreenId =>
  v === "1440" ? "1440" : "375";

/** Declared as pure data too: a spec a server page reads may not import a client
 *  module, so the knob is written twice on purpose and this copy is the scene's. */
export const SCREEN: Control = {
  id: "screen",
  label: "Screen",
  options: [
    { id: "375", label: "375, a phone" },
    { id: "1440", label: "1440, a laptop" },
  ],
  default: "375",
};

/** Zoom-fits a portalled frame to the lab's own Fit preference. Zooming is honest:
 *  it scales the picture and leaves the iframe's viewport, and every breakpoint
 *  inside it, alone. */
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

/**
 * ★ THE NUMBERS UNDER A FRAME ARE MEASURED, NEVER COMPUTED (docs/PROGRAM.md: a
 * board once drew an option with its formula's sign backwards and the tile Will
 * judged showed the opposite of the words he picked). Every claim this board makes
 * about how many distinct colours a crowd really holds is read out of the frame's
 * own laid-out document with `getComputedStyle`, which is the colour the browser
 * actually painted rather than the one the generator asked for.
 */
function Measured({
  probe,
  deps,
  onMeasure,
  children,
}: {
  probe: (root: HTMLElement, win: Window) => string;
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
        report.current(probe(el, win));
      } catch {
        // Not portalled in yet, or a selector that has not mounted this pass.
      }
    };
    read();
    const timers = [200, 900, 1800].map((ms) => win.setTimeout(read, ms));
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

export function Scene({
  id,
  screen,
  title,
  caption,
  measure,
  short,
  children,
}: {
  id: string;
  screen: ScreenId;
  title: string;
  /** A static caption. Omit and pass `measure` for a number read off the frame. */
  caption?: string;
  measure?: (root: HTMLElement, win: Window) => string;
  /** Caps a short surface well under the full viewport. */
  short?: boolean;
  children: ReactNode;
}) {
  const { w, h: full } = SCREENS[screen];
  const h = short ? Math.min(full, 560) : full;
  const [measured, setMeasured] = useState("measuring");

  const body = (
    <>
      <style>{DRIFT_CSS}</style>
      <div className="flex min-h-full flex-1 flex-col bg-background text-foreground">
        {children}
      </div>
    </>
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
        {measure ? (
          <Measured probe={measure} deps={[screen, id]} onMeasure={setMeasured}>
            {body}
          </Measured>
        ) : (
          body
        )}
      </Frame>
    </Fit>
  );
}

/* ── The probes ──────────────────────────────────────────────────────────── */

/** Every disc the frame actually painted, as the browser resolved it. */
function paintedDiscs(root: HTMLElement, win: Window): string[] {
  return [...root.querySelectorAll<HTMLElement>("[data-slot=avatar-fallback]")]
    .filter((el) => el.clientWidth > 8)
    .map((el) => {
      const s = win.getComputedStyle(el);
      return s.backgroundImage === "none" ? s.backgroundColor : s.backgroundImage;
    });
}

/**
 * THE PROOF, AND IT IS ONE NUMBER: how many DIFFERENT colours a reader meets in one
 * guest list. Today's answer is one, whatever the crowd; the whole of Will's ask is
 * that it should not be.
 */
export function measureCrowd(root: HTMLElement, win: Window): string {
  const list = root.querySelector<HTMLElement>("[data-seed-list]");
  if (!list) return "measuring";
  const discs = paintedDiscs(root, win);
  const distinct = new Set(discs).size;
  const rows = [...list.querySelectorAll<HTMLElement>("li")].reduce(
    (tops: number[], el) => {
      const t = Math.round(el.getBoundingClientRect().top);
      return tops.some((p) => Math.abs(p - t) < 6) ? tops : [...tops, t];
    },
    [],
  );
  const tall = Math.round(list.getBoundingClientRect().height);
  // ★ DISCS, NOT PEOPLE. Five of the cast carry a photograph and six of the
  // twenty-four appear twice (the faces row and the opened list), so the honest
  // count is of the seeded discs the frame actually painted, which is what a
  // reader's eye meets. Calling them people would overstate the crowd by five.
  return `${distinct} distinct colour${distinct === 1 ? "" : "s"} across ${
    discs.length
  } seeded disc${discs.length === 1 ? "" : "s"}, the list ${rows.length} row${
    rows.length === 1 ? "" : "s"
  } standing ${tall}px on a ${win.innerWidth}px screen`;
}

/** What the letter really is at each size: the rendered pixel size of the initial,
 *  and whether anything is drawn there at all. */
export function measureLetters(root: HTMLElement, win: Window): string {
  const discs = [
    ...root.querySelectorAll<HTMLElement>("[data-slot=avatar-fallback]"),
  ].filter((el) => el.clientWidth > 8);
  if (discs.length === 0) return "measuring";
  const sizes = discs.reduce((seen: string[], el) => {
    const px = Math.round(el.getBoundingClientRect().width);
    const letters = (el.textContent ?? "").trim().length > 0;
    const type = Math.round(parseFloat(win.getComputedStyle(el).fontSize));
    const line = letters ? `${px}px disc, ${type}px initial` : `${px}px disc, no letter`;
    return seen.includes(line) ? seen : [...seen, line];
  }, []);
  return sizes.join(" · ");
}

/** How much of one avatar survives the photograph that replaced it. */
export function measurePhoto(root: HTMLElement, win: Window): string {
  const img = root.querySelector<HTMLElement>("img[alt='']");
  const disc =
    root.querySelector<HTMLElement>("[data-slot=avatar]") ??
    root.querySelector<HTMLElement>("[data-seed-big]");
  if (!img || !disc) return `no photograph in this frame, at ${win.innerWidth}px`;
  const a = img.getBoundingClientRect();
  const b = disc.getBoundingClientRect();
  const rim = Math.round(((b.width - a.width) / 2) * 10) / 10;
  return rim > 0.4
    ? `${Math.round(b.width)}px disc, ${Math.round(a.width)}px photograph: a ${rim}px rim of colour`
    : `${Math.round(b.width)}px disc, ${Math.round(a.width)}px photograph: no colour left showing`;
}
