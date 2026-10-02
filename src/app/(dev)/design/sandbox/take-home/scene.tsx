"use client";

import {
  type ReactNode,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { type BoardState, Fit, Frame, Measured } from "@/components/lab";

/**
 * THE FRAMES A WAY HOME IS READ IN, AND WHAT EACH ONE MEASURES.
 *
 * ★ A REAL VIEWPORT, NEVER A STYLED DIV (the kit's `vw-in-a-narrow-div`
 * trap): the album's cover, its rows and every breakpoint in them read the
 * frame's own width only inside a same-origin frame at its true size. 375 by
 * 812 is the phone a guest scanned the code with; 1440 by 900 the laptop.
 *
 * ★ A ROW MAY MIX THE TWO. A host's question is her desk and her phone at
 * once (the archive at one, the posting at the other), so a row lays a laptop
 * and a phone side by side on one baseline, fitted as one canvas.
 *
 * ★ NOTHING HERE REACHES A SESSION, A SERVER FUNCTION OR THE NETWORK: every
 * frame is composed from production's presentational pieces and quotes, and is
 * INERT, a picture and never a control.
 *
 * ★ EVERY CAPTION IS READ OFF THE FRAME, NEVER COMPUTED (the kit's
 * `captions-as-literals`): where the way home sits, how big the act's control
 * is and how far from the foot, how many photographs are picked on screen, and
 * the words the act's own surface prints, found by the marks each drawing puts
 * on its pieces (`data-th-*`).
 */

export const SCREENS = {
  "375": { w: 375, h: 812, name: "a phone" },
  "1440": { w: 1440, h: 900, name: "a laptop" },
} as const;

export type ScreenId = keyof typeof SCREENS;

/** The guest's screen knob: the phone she scanned the code with first. */
export const guestScreenOf = (s: BoardState): ScreenId =>
  s["guest-screen"] === "1440" ? "1440" : "375";

/** The gap between two frames of a row, in the lab's own pixels. */
const GAP = 24;

export type Probe = (root: HTMLElement, win: Window) => string | null;

/**
 * SCROLLS THE FRAME'S OWN WINDOW once its document is there, so a frame that
 * shows the page moved on is the page really scrolled: the sticky pieces stick
 * and the fixed ones stand where they do in production.
 */
export function ScrollTo({ y }: { y: number }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  useEffect(() => {
    const win = ref.current?.ownerDocument.defaultView;
    if (!win) return;
    const go = () => win.scrollTo({ top: y, behavior: "instant" });
    go();
    // The webfont and the photographs move the page's height after the first
    // layout; the scroll is set again as they settle.
    const timers = [120, 600, 1400].map((ms) => win.setTimeout(go, ms));
    return () => timers.forEach((t) => win.clearTimeout(t));
  }, [y]);
  return <span ref={ref} aria-hidden hidden />;
}

/** One frame. `bare` drops its own zoom-fit, for a frame standing in a row fitted as one canvas. */
export function Scene({
  id,
  screen,
  title,
  measure,
  bare = false,
  children,
}: {
  id: string;
  screen: ScreenId;
  title: string;
  measure: Probe;
  bare?: boolean;
  children: ReactNode;
}) {
  const { w, h, name } = SCREENS[screen];
  const [caption, setCaption] = useState("measuring");
  const frame = (
    <Frame
      id={`${id}-${screen}`}
      w={w}
      h={h}
      title={`${title}, ${name}`}
      caption={caption}
    >
      <Measured
        probe={measure}
        deps={[id, screen]}
        onMeasure={setCaption}
        timers={[300, 1000, 2000]}
        className="min-h-full"
      >
        <div inert>{children}</div>
      </Measured>
    </Frame>
  );
  return bare ? frame : <Fit w={w}>{frame}</Fit>;
}

export type RowFrame = {
  id: string;
  title: string;
  node: ReactNode;
  /** The screen this frame is (a row may mix a laptop and a phone). */
  screen: ScreenId;
  /** What the caption reads; the act's own probe by default. */
  measure?: Probe;
};

/** The lab's own window at a phone's width: below `sm`, where its column is a phone's. */
const PHONE_WIDTH = "(width < 40rem)";

function onPhoneWidth(change: () => void) {
  const query = window.matchMedia(PHONE_WIDTH);
  query.addEventListener("change", change);
  return () => query.removeEventListener("change", change);
}

/** Whether the lab is being read on a phone (never on the server: a row until it knows). */
function useOnPhone(): boolean {
  return useSyncExternalStore(
    onPhoneWidth,
    () => window.matchMedia(PHONE_WIDTH).matches,
    () => false,
  );
}

/**
 * A ROW OF FRAMES: side by side in one fitted canvas (one scale, one
 * baseline), stacked when the lab itself is read on a phone. `lede` is the one
 * line above the row saying what it holds.
 */
export function Row({
  frames,
  lede,
}: {
  frames: readonly RowFrame[];
  lede?: ReactNode;
}) {
  const onPhone = useOnPhone();
  const head = lede ? (
    <p className="max-w-3xl text-sm leading-snug text-muted-foreground">
      {lede}
    </p>
  ) : null;
  if (onPhone) {
    return (
      <div data-th-row className="flex flex-col gap-6">
        {head}
        {frames.map((f) => (
          <Scene
            key={f.id}
            id={f.id}
            screen={f.screen}
            title={f.title}
            measure={f.measure ?? measureAct(SCREENS[f.screen].h)}
          >
            {f.node}
          </Scene>
        ))}
      </div>
    );
  }
  const w =
    frames.reduce((sum, f) => sum + SCREENS[f.screen].w, 0) +
    (frames.length - 1) * GAP;
  return (
    <div data-th-row className="flex flex-col gap-3">
      {head}
      <Fit w={w}>
        <div className="flex items-end" style={{ gap: GAP }}>
          {frames.map((f) => (
            <Scene
              key={f.id}
              id={f.id}
              screen={f.screen}
              title={f.title}
              measure={f.measure ?? measureAct(SCREENS[f.screen].h)}
              bare
            >
              {f.node}
            </Scene>
          ))}
        </div>
      </Fit>
    </div>
  );
}

/* ── what the frames measure ───────────────────────────────────────────────── */

const clean = (s: string | null | undefined) =>
  (s ?? "").replace(/\s+/g, " ").trim();

const px = (n: number) => `${Math.round(n)}px`;

/** A control's name: its accessible name where it carries one (a round's glyph and badge are not its
 *  name), else its own words. */
const nameOf = (el: Element) =>
  clean(el.getAttribute("aria-label")) ||
  clean((el as HTMLElement).innerText) ||
  "it";

/**
 * THE CAPTION UNDER A FRAME, read off the frame: where the way home sits on the
 * first screen (or that it is not on it), the act's control (its name, its size,
 * how far it stands from the foot, the thumb's end), how many photographs are
 * picked on screen, and any figure the act's own surface prints
 * (`data-th-read`). `null` until something is laid out.
 */
export const measureAct =
  (screenH: number): Probe =>
  (root) => {
    const parts: string[] = [];
    const way = root.querySelector("[data-th-way]");
    if (way) {
      const r = way.getBoundingClientRect();
      if (r.height > 0)
        parts.push(
          r.top >= screenH || r.bottom <= 0
            ? `${nameOf(way)} is off the first screen`
            : `${nameOf(way)} at ${px(r.top)} down, ${px(r.height)} tall`,
        );
    }
    const act = root.querySelector("[data-th-act]");
    if (act) {
      const r = act.getBoundingClientRect();
      if (r.height > 0 && r.top < screenH && r.bottom > 0)
        parts.push(
          `${nameOf(act)}: ${px(r.width)} by ${px(r.height)}, ${px(screenH - r.bottom)} above the foot`,
        );
    }
    const picked = [...root.querySelectorAll("[data-th-picked]")].filter(
      (el) => {
        const r = el.getBoundingClientRect();
        return r.height > 0 && r.top < screenH && r.bottom > 0;
      },
    ).length;
    if (picked > 0) parts.push(`${picked} picked on screen`);
    for (const el of root.querySelectorAll("[data-th-read]")) {
      const r = el.getBoundingClientRect();
      if (r.height > 0 && r.top < screenH && r.bottom > 0)
        parts.push(`reads "${clean((el as HTMLElement).innerText)}"`);
    }
    // A frame with no way in and no act (an album that offers neither) says where its album starts.
    if (parts.length === 0) {
      const tile = root.querySelector("[data-th-tile]");
      const r = tile?.getBoundingClientRect();
      if (!r || r.height === 0) return null;
      parts.push(
        `no way to take many; the album's first photo at ${px(r.top)} down`,
      );
    }
    return `Measured: ${parts.join("; ")}.`;
  };
