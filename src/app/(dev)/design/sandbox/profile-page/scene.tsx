"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

import { Frame, useLabPrefs } from "@/components/lab";
import type { Control } from "@/components/lab/board-spec";

/**
 * THE ONE FRAME EVERY DECISION DRAWS IN: a real viewport with the real profile
 * and album components portalled into it. Never a route: `/u/[slug]` is a
 * server component that awaits an RPC, `getUser()` and two presign rounds, so
 * mounting it here would put a live Supabase read behind every tile on the
 * stage. The parts are imported and re-composed instead (profile.tsx).
 *
 * ★ 375 FIRST, 1440 ON THE KNOB. A profile is met on a phone: the only thing
 * that links to one is a chip on an album somebody is looking at while standing
 * at a party. 1440 is still a knob on every page decision, because a host puts
 * their handle in a bio and the people who follow it are at a desk.
 */
export const SCREENS = {
  "375": { w: 375, h: 812, name: "a phone" },
  "1440": { w: 1440, h: 900, name: "a laptop" },
} as const;
export type ScreenId = keyof typeof SCREENS;
export const screenOf = (v: string | undefined): ScreenId =>
  v === "1440" ? "1440" : "375";

/** Declared in spec.ts as pure data too: a spec a server page reads may not
 *  import a client module, so the knob is written twice on purpose and this
 *  copy is the one the scene reads. */
export const SCREEN: Control = {
  id: "screen",
  label: "Screen",
  options: [
    { id: "375", label: "375, a phone" },
    { id: "1440", label: "1440, a laptop" },
  ],
  default: "375",
};

/** Zoom-fits a portalled frame to the lab's own Fit preference (a bare `Frame`
 *  has no opinion). Zooming is honest: `zoom` scales the picture and leaves the
 *  iframe's own viewport, and therefore every breakpoint, alone. */
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
 * ★ THE NUMBERS UNDER A FRAME ARE MEASURED, NEVER COMPUTED. A board once drew
 * an option with its formula's sign backwards and the tile Will judged showed
 * the opposite of the words he picked (docs/PROGRAM.md), so every claim this
 * board makes about how tall a list stands or how much of a page is a picture
 * is read out of the frame's OWN document after it settles. When the words
 * above a frame and the caption under it disagree, the caption is the truth.
 *
 * The observer is the FRAME'S: the subtree lives in the iframe's document, so
 * it is watched with that window's `ResizeObserver` (it fires when the copied
 * stylesheets land, and the first layout is unstyled). Three late passes cover
 * what an observer cannot see: photographs decoding at their natural heights in
 * columns that never changed width.
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
        // Not portalled in yet, or a selector that has not mounted this pass;
        // the next timer or resize catches it.
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
  const h = short ? Math.min(full, 620) : full;
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

/** The ground every guest-side page stands on: the app background, the page's
 *  own min-height column, and the foreground colour. */
export function Ground({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-background text-foreground">
      {children}
    </div>
  );
}

/* ── The probes ──────────────────────────────────────────────────────────── */

/** How much of the page a reader meets is a PICTURE, which is the whole of
 *  `made-of`: the argument is that Priya's page has none. */
export function measurePictures(root: HTMLElement, win: Window): string {
  const page = root.querySelector<HTMLElement>("[data-pp-page]");
  if (!page) return "measuring";
  const seen = page.getBoundingClientRect();
  const imgs = [...page.querySelectorAll<HTMLElement>("img")].filter(
    (el) => el.clientWidth > 40 && el.clientHeight > 40,
  );
  const area = imgs.reduce((n, el) => n + el.clientWidth * el.clientHeight, 0);
  const screen = win.innerWidth * win.innerHeight;
  const pct = Math.round((area / screen) * 100);
  return `${imgs.length} picture${imgs.length === 1 ? "" : "s"} over ${Math.round(
    seen.height,
  )}px of page: ${pct}% of the first screen`;
}

/** How much of the first screen is spent before the person, which is the whole
 *  of `head`: a header's cost is measured in the room it takes from them. */
export function measureHead(root: HTMLElement, win: Window): string {
  const page = root.querySelector<HTMLElement>("[data-pp-page]");
  const name = page?.querySelector<HTMLElement>("h1");
  if (!name) return "measuring";
  const head = page?.querySelector<HTMLElement>("header");
  const tall = head ? Math.round(head.getBoundingClientRect().height) : 0;
  const top = Math.round(name.getBoundingClientRect().top);
  return `${tall}px of chrome above them, and the name starts ${top}px down a ${win.innerHeight}px screen`;
}

/** How tall the guest list really stands, which is the whole of `list`. */
export function measureList(root: HTMLElement, win: Window): string {
  const list = root.querySelector<HTMLElement>("[data-pp-list]");
  if (!list) return "measuring";
  const r = list.getBoundingClientRect();
  const rows = [...list.querySelectorAll<HTMLElement>("li")].reduce(
    (tops: number[], el) => {
      const t = Math.round(el.getBoundingClientRect().top);
      return tops.some((p) => Math.abs(p - t) < 6) ? tops : [...tops, t];
    },
    [],
  );
  const n = Math.max(1, rows.length);
  return `the list stands ${Math.round(r.height)}px in ${n} row${
    n === 1 ? "" : "s"
  }, on a ${win.innerHeight}px screen`;
}

/** How much of the identity row the controls take, and how far down they sit:
 *  a claim about an affordance has to be a claim about the room it costs. */
export function measureReach(root: HTMLElement, win: Window): string {
  const act = root.querySelector<HTMLElement>("[data-pp-act]");
  if (!act) return `no control on this page, on a ${win.innerWidth}px screen`;
  const r = act.getBoundingClientRect();
  const row = act.parentElement?.getBoundingClientRect();
  const share = row?.width ? Math.round((r.width / row.width) * 100) : null;
  return `the controls take ${Math.round(r.width)}px${
    share ? ` of a ${Math.round(row!.width)}px row (${share}%)` : ""
  }, ${Math.round(r.top)}px down`;
}
