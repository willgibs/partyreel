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
 * THE FRAMES A HEAD IS READ IN, AND WHAT EACH ONE MEASURES.
 *
 * ★ A REAL VIEWPORT, NEVER A STYLED DIV (the kit's `vw-in-a-narrow-div`
 * trap): a head is mostly type on the ladder's `vw` clamps, and the guest's
 * column, the hub's wide page and every breakpoint in them read the frame's
 * width only inside a same-origin frame at its true size. 375 by 812 is the
 * phone off a printed code; 1440 by 900 the laptop.
 *
 * ★ A HEAD IS JUDGED ON ARRIVAL AND ONCE THE PAGE HAS MOVED ON, so an option is
 * two frames: the first screen as it lands, and the same page scrolled into
 * the album, where what stays (the dock, a stuck row, a bar) is the head's
 * second half. The scroll is the frame's own (`ScrollTo`), so a sticky piece
 * sticks and a fixed one stands where it really does.
 *
 * ★ NOTHING HERE REACHES A SESSION, A SERVER FUNCTION OR THE NETWORK: the
 * hub's head needs a session and the album's a live provider, so each is
 * composed here from production's presentational pieces in its own order and
 * words, and every frame is INERT, a picture and never a control.
 *
 * ★ EVERY CAPTION IS READ OFF THE FRAME, NEVER COMPUTED: where the album's
 * first photograph lands, how many words stand above it, where the primary
 * action sits and how big the code is, found by the marks each drawing puts on
 * its own pieces (`data-eh-*`).
 */

export const SCREENS = {
  "375": { w: 375, h: 812, name: "a phone" },
  "1440": { w: 1440, h: 900, name: "a laptop" },
} as const;

export type ScreenId = keyof typeof SCREENS;

/** The guest's screen knob: a phone off the printed code first. */
export const guestScreenOf = (s: BoardState): ScreenId =>
  s["guest-screen"] === "1440" ? "1440" : "375";

/** The host's screen knob: her laptop first. */
export const hostScreenOf = (s: BoardState): ScreenId =>
  s["host-screen"] === "375" ? "375" : "1440";

/** The gap between two frames of a row, in the lab's own pixels. */
const GAP = 24;

export type Probe = (root: HTMLElement, win: Window) => string | null;

/**
 * SCROLLS THE FRAME'S OWN WINDOW, once its document is there, so a frame that
 * shows the page moved on is the page really scrolled: the sticky pieces
 * stick and the fixed ones stand where they do in production.
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

/**
 * ONE FRAME. `bare` drops its own zoom-fit, for a frame standing in a row
 * that is fitted as one canvas.
 */
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

export type StripFrame = {
  id: string;
  title: string;
  node: ReactNode;
  /** What the caption reads; the head's own probe by default. */
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
 * A STRIP OF FRAMES: phones side by side in one fitted canvas (one scale, one
 * baseline), laptops stacked, and phones stacked too when the lab itself is
 * read on a phone. `lede` is the one line above the row saying what it holds.
 */
export function Strip({
  screen,
  frames,
  lede,
}: {
  screen: ScreenId;
  frames: readonly StripFrame[];
  lede?: ReactNode;
}) {
  const onPhone = useOnPhone();
  const head = lede ? (
    <p className="max-w-3xl text-sm leading-snug text-muted-foreground">
      {lede}
    </p>
  ) : null;
  if (screen === "1440" || onPhone) {
    return (
      <div data-eh-row className="flex flex-col gap-6">
        {head}
        {frames.map((f) => (
          <Scene
            key={f.id}
            id={f.id}
            screen={screen}
            title={f.title}
            measure={f.measure ?? measureHead(SCREENS[screen].h)}
          >
            {f.node}
          </Scene>
        ))}
      </div>
    );
  }
  const w = frames.length * SCREENS["375"].w + (frames.length - 1) * GAP;
  return (
    <div data-eh-row className="flex flex-col gap-3">
      {head}
      <Fit w={w}>
        <div className="flex items-start" style={{ gap: GAP }}>
          {frames.map((f) => (
            <Scene
              key={f.id}
              id={f.id}
              screen="375"
              title={f.title}
              measure={f.measure ?? measureHead(SCREENS["375"].h)}
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

const wordsIn = (el: Element | null) =>
  clean((el as HTMLElement | null)?.innerText)
    .split(/\s+/)
    .filter((w) => /[A-Za-z0-9]/.test(w)).length;

const px = (n: number) => `${Math.round(n)}px`;

/**
 * THE CAPTION UNDER A HEAD, read off the frame: where the album's first
 * photograph lands on the first screen (or that it is below it), the words the
 * head says, where the primary action sits and how tall it is, how big the
 * code is where the head carries one, and what stays at an edge once the page
 * has moved on. `null` until the album and the head are both laid out.
 */
export const measureHead =
  (screenH: number): Probe =>
  (root) => {
    const head = root.querySelector("[data-eh-head]");
    if (!head) return null;
    const parts: string[] = [];
    const tile = root.querySelector("[data-eh-tile]");
    if (tile) {
      const top = tile.getBoundingClientRect().top;
      parts.push(
        top >= screenH
          ? "the album starts below the first screen"
          : top < 0
            ? "the album fills the screen"
            : `the album starts ${px(top)} down (${Math.round((top / screenH) * 100)}% of the screen)`,
      );
    } else {
      const empty = root.querySelector("[data-eh-empty]");
      if (empty)
        parts.push(
          `the empty album starts ${px(empty.getBoundingClientRect().top)} down`,
        );
    }
    const headBox = head.getBoundingClientRect();
    if (headBox.bottom > 0) parts.push(`the head says ${wordsIn(head)} words`);
    const primary = root.querySelector("[data-eh-primary]");
    if (primary) {
      const r = primary.getBoundingClientRect();
      if (r.height > 0 && r.bottom > 0 && r.top < screenH)
        parts.push(
          `${clean((primary as HTMLElement).innerText) || "the primary"} at ${px(r.top)}, ${px(r.height)} tall`,
        );
    }
    const code = root.querySelector("[data-eh-code]");
    if (code) {
      const r = code.getBoundingClientRect();
      if (r.width > 0 && r.bottom > 0) parts.push(`the code ${px(r.width)}`);
    }
    const stays = root.querySelector("[data-eh-stays]");
    if (stays) {
      // Production's dock is fixed inside its own wrapper, so the wrapper has
      // no box: what is measured is the bar itself.
      const bar =
        stays.getBoundingClientRect().height > 0
          ? stays
          : (stays.querySelector('[role="group"]') ?? stays);
      const r = bar.getBoundingClientRect();
      if (r.height > 0)
        parts.push(
          `what stays: ${stays.getAttribute("data-eh-stays")}, ${px(r.height)} tall`,
        );
    }
    if (parts.length === 0) return null;
    return `Measured: ${parts.join("; ")}.`;
  };
