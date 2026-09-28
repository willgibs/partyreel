"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

import { Fit, Frame, Measured } from "@/components/lab";

import { SCREENS, type ScreenId } from "./screens";

/**
 * THE ONE FRAME EVERY OPTION DRAWS IN, AND WHAT IT MEASURES (ported from
 * `event-safety/scene.tsx`, which retires in `safety-wiring`).
 *
 * ★ A REAL FRAME AT A REAL WIDTH. The settings kind is a panel at a desk and a
 * whole screen in a hand, decided by the product's one breakpoint, and only a
 * same-origin iframe claims a width of its own; a breakpoint class this board
 * wrote would lose to production's unprefixed one in the lab's layer order
 * (`design.css`), so every screen difference drawn here keys off the `screen`
 * prop, never a `sm:` it typed.
 *
 * ★ NOTHING HERE REACHES A SESSION, A SERVER FUNCTION OR THE NETWORK, AND
 * NOTHING MOUNTS A RADIX PORTAL: a Dialog, Sheet, Popover or menu opened in a
 * portalled frame renders on the lab page's document, not the screen being
 * judged, so every floating surface is QUOTED (`kinds.tsx`) in production's
 * own classes. `fixed`, never `absolute`, for anything pinned to the screen:
 * the frame IS the viewport.
 *
 * ★ EVERY CAPTION IS READ OFF THE FRAME, NEVER COMPUTED: how many screens a
 * panel runs is its scroller's own heights, and where a switch sits is the box
 * the browser drew.
 */

/** A number read off the frame's own document for its caption. */
export type Reader = (root: HTMLElement, win: Window) => string | null;

export function Scene({
  id,
  screen,
  title,
  caption,
  measure,
  short = false,
  children,
}: {
  id: string;
  screen: ScreenId;
  title: string;
  /** A static caption. Omit and pass `measure` for a number read off the frame. */
  caption?: string;
  measure?: Reader;
  /**
   * A laptop frame that stands in a stack with others (`Several`), cut to 600
   * px so two of them sit within reach. A phone is never cut: phones stand
   * side by side.
   */
  short?: boolean;
  children: ReactNode;
}) {
  const { w, h: full } = SCREENS[screen];
  const h = short && screen === "1440" ? 600 : full;
  const [measured, setMeasured] = useState("measuring");
  const body = measure ? (
    <Measured
      probe={measure}
      deps={[screen, id]}
      onMeasure={setMeasured}
      timers={[200, 900, 1800, 3200]}
    >
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
 * SEVERAL SCREENS, ONE OPTION: an option drawn as it opens and as a change is
 * made, or a newcomer and the host. Phones stand side by side on a grid of
 * equal columns, each fitted to its own column rather than to its content
 * (`stage-in-a-flex-row`'s trap); laptops stack, because two 1440 frames side
 * by side would each be a thumbnail.
 */
export function Several({
  screen,
  children,
}: {
  screen: ScreenId;
  children: ReactNode;
}) {
  if (screen === "1440")
    return <div className="flex flex-col gap-6">{children}</div>;
  return (
    <div data-lab-bleed className="set-several">
      {children}
    </div>
  );
}

/* ── what the frames measure ──────────────────────────────────────────────── */

/** The settings' own scroller: the popup's body, whatever shape it stands in. */
const scrollerOf = (root: HTMLElement) =>
  root.querySelector<HTMLElement>("[data-slot='popup-body']");

const fmtScreens = (n: number) => {
  const r = Math.round(n * 10) / 10;
  return `${r === Math.round(r) ? r.toFixed(0) : r.toFixed(1)} ${r === 1 ? "screen" : "screens"}`;
};

/**
 * HOW LONG THE SETTINGS RUN, AND HOW MUCH OF THEM A HOST SEES FIRST: the
 * scroller's content height over its own height (a screen is what the panel
 * shows at once), and the settings a host can reach without scrolling out of
 * every one the page holds, each marked `data-set-setting` where it is drawn.
 * A page that holds none (the summary's four rows) says how many rows it
 * opens instead.
 */
export const screens: Reader = (root) => {
  const box = scrollerOf(root);
  if (!box || box.clientHeight < 1) return null;
  const runs = box.scrollHeight / box.clientHeight;
  const edge = box.getBoundingClientRect().bottom;
  const all = Array.from(
    box.querySelectorAll<HTMLElement>("[data-set-setting]"),
  ).filter((el) => el.getBoundingClientRect().height > 0);
  const lead = `Runs ${fmtScreens(runs)}`;
  if (all.length === 0) {
    const rows = box.querySelectorAll("[data-set-row]").length;
    return rows ? `${lead}, ${rows} rows to open` : lead;
  }
  const seen = all.filter((el) => el.getBoundingClientRect().top < edge).length;
  return `${lead}, ${seen} of ${all.length} settings in the first`;
};

/**
 * WHERE THE ACT SITS, for a thumb: the element marked `data-set-reach`, its
 * height and how far down the screen its middle is (event-safety's measure,
 * carried). A switch a host has to scroll for, or a Save far below the switch
 * it commits, is read here rather than asserted in a sentence.
 */
export const reach =
  (what: string): Reader =>
  (root, win) => {
    const el = root.querySelector<HTMLElement>("[data-set-reach]");
    if (!el) return null;
    const r = el.getBoundingClientRect();
    if (r.height < 1) return null;
    const down = Math.round(((r.top + r.height / 2) / win.innerHeight) * 100);
    return down > 100
      ? `${what}: below the screen, a scroll away`
      : `${what}: ${Math.round(r.height)} px tall, ${down}% of the way down`;
  };

/**
 * WHAT A GROUP HOLDS, AND HOW MUCH OF IT IS IDLE: the settings drawn in the
 * group marked `data-set-group`, and of those the ones marked idle. The idle
 * ask's three answers differ exactly here, so its caption counts it.
 */
export const holds =
  (group: string, what: string): Reader =>
  (root) => {
    const g = root.querySelector<HTMLElement>(`[data-set-group="${group}"]`);
    if (!g) return null;
    const all = g.querySelectorAll("[data-set-setting]").length;
    const idle = g.querySelectorAll("[data-set-setting][data-set-idle]").length;
    const n = `${all} ${all === 1 ? "setting" : "settings"}`;
    return idle ? `${what}: ${n}, ${idle} doing nothing yet` : `${what}: ${n}`;
  };

/**
 * How many lines a block of text runs, read off its own line boxes (the rects
 * a Range draws over each text node, clustered by top), never a height divided
 * by a line height (`voice-guest`'s measure, carried).
 */
function lineCount(el: Element): number {
  const doc = el.ownerDocument;
  const walker = doc.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const tops: number[] = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!n.textContent?.trim()) continue;
    const range = doc.createRange();
    range.selectNodeContents(n);
    for (const r of Array.from(range.getClientRects())) {
      if (r.width < 1 || r.height < 1) continue;
      tops.push(r.top);
    }
  }
  tops.sort((a, b) => a - b);
  let count = 0;
  let last = -Infinity;
  for (const t of tops) {
    if (t - last > 6) count++;
    last = t;
  }
  return count;
}

/** The plain line a door says, in lines: the size its placeholder words take. */
export const doorLines: Reader = (root) => {
  const el = root.querySelector("[data-set-line]");
  if (!el) return null;
  const n = lineCount(el);
  if (n === 0) return null;
  return `The door says it in ${n} line${n === 1 ? "" : "s"}`;
};

/**
 * HOW MUCH OF THE COUNTING CARD IS ON SCREEN (event-safety's, carried): the
 * hub's row is a 2x2 grid on a phone (`room-card.ts`), and this keeps saying
 * so, read off the frame.
 */
export const cardShown =
  (id: "guests" | "review"): Reader =>
  (root, win) => {
    const el = root.querySelector<HTMLElement>(`[data-set-card="${id}"]`);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    if (r.width < 1) return null;
    const shown = Math.max(
      0,
      Math.min(r.right, win.innerWidth) - Math.max(r.left, 0),
    );
    const label = id === "guests" ? "The Guests card" : "The Review card";
    return shown >= r.width - 1
      ? `${label} is whole on screen`
      : `${label}: ${Math.round(shown)} of its ${Math.round(r.width)} px on screen`;
  };

/**
 * SCROLLS ITS OWN CONTAINER TO ITSELF, ONCE THE FRAME HAS SETTLED
 * (event-safety's, carried). The group a frame is about can sit below the fold
 * of the settings' own scroller, and a picture that starts on the first card
 * shows the wrong question. It scrolls the nearest scrolling ancestor (the
 * panel's or the screen's body), else the frame's own window, and re-runs as
 * the webfont lands; a second run is a no-op.
 */
export function ScrollHere({ offset = 12 }: { offset?: number }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    const win = el?.ownerDocument.defaultView;
    if (!el || !win) return;
    const go = () => {
      let box: HTMLElement | null = el.parentElement;
      while (box) {
        const oy = win.getComputedStyle(box).overflowY;
        if (
          (oy === "auto" || oy === "scroll") &&
          box.scrollHeight > box.clientHeight
        )
          break;
        box = box.parentElement;
      }
      const top = el.getBoundingClientRect().top;
      if (box) box.scrollTop += top - box.getBoundingClientRect().top - offset;
      else win.scrollTo(0, win.scrollY + top - offset);
    };
    go();
    const timers = [150, 600, 1500].map((ms) => win.setTimeout(go, ms));
    win.document.fonts?.ready.then(go).catch(() => {});
    return () => timers.forEach((t) => win.clearTimeout(t));
  }, [offset]);
  return <span ref={ref} aria-hidden className="block h-0" />;
}
