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
 * THE FRAMES THE HUB IS READ IN, AND WHAT EACH ONE MEASURES.
 *
 * ★ A REAL VIEWPORT, NEVER A STYLED DIV (the kit's `vw-in-a-narrow-div`
 * trap): the hub is the app's wide page, a cover on the ladder's `vw` clamps
 * and a row that changes shape at `sm`, all of which read the frame's width
 * only inside a same-origin frame at its true size. 1440 is her laptop; 820
 * a tablet held upright (the hub's middle widths, 640 to 1088, every card
 * drawn there as a tile); 375 the phone in her hand at the party.
 *
 * ★ A FACTS FRAME IS THE FIRST SCREEN'S TOP ONLY (the bar, the cover and the
 * doors' row), since everything under it is the album as built in every
 * option, and six albums side by side are read whole at a size their covers
 * can be judged at. A DOORS FRAME IS THE WHOLE FIRST SCREEN.
 *
 * ★ A STILL FRAME IS INERT (a picture, never a control); TRY IT IS LIVE: the
 * doors' first frame is the hub running, so scrolling it folds the doors into
 * their band and a press opens the room over the hub as wired, because how
 * the doors slide into the band is half of what the decision chooses.
 *
 * ★ NOTHING HERE REACHES A SESSION, A SERVER FUNCTION OR THE NETWORK beyond
 * the stills and the code's renderer: the hub is composed from production's
 * presentational pieces in its own order, and its state is local.
 *
 * ★ EVERY CAPTION IS READ OFF THE FRAME, NEVER COMPUTED: how many words the
 * cover says, what the fact draws and how big, where the doors stand and how
 * big, where the album starts, found by the marks each drawing puts on its own
 * pieces (`data-eh-*`).
 */

export const SCREENS = {
  "375": { w: 375, h: 812, name: "a phone" },
  "820": { w: 820, h: 1180, name: "a tablet" },
  "1440": { w: 1440, h: 900, name: "a laptop" },
} as const;

export type ScreenId = keyof typeof SCREENS;

/** The page's two grounds (the cover is the room on both). */
export type Ground = "paper" | "room";

/** The Screen knob: her laptop first. */
export const screenOf = (s: BoardState): ScreenId =>
  s.screen === "375" ? "375" : s.screen === "820" ? "820" : "1440";

/** A phone's screen (under `sm`), where the hub draws its narrow head and rows. */
export const isPhone = (screen: ScreenId) => screen === "375";

/** The gap between two frames of a row, in the lab's own pixels. */
const GAP = 24;

export type Probe = (root: HTMLElement, win: Window) => string | null;

/**
 * SCROLLS THE FRAME'S OWN WINDOW, once its document is there, so a frame that
 * shows the page moved on is the page really scrolled: the sticky band sticks
 * and the fixed pieces stand where they do in production.
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

/** One frame; `bare` drops its own fit, for a frame in a row fitted as one canvas. */
export function Scene({
  id,
  screen,
  h,
  title,
  measure,
  live = false,
  bare = false,
  children,
}: {
  id: string;
  screen: ScreenId;
  /** The frame's height, where it is not the whole first screen. */
  h?: number;
  title: string;
  measure: Probe;
  /** A frame he works (Try it); every other frame is a picture. */
  live?: boolean;
  bare?: boolean;
  children: ReactNode;
}) {
  const { w, h: screenH, name } = SCREENS[screen];
  const [caption, setCaption] = useState("measuring");
  const frame = (
    <Frame
      id={`${id}-${screen}`}
      w={w}
      h={h ?? screenH}
      title={`${title}, ${name}`}
      caption={caption}
    >
      <Measured
        probe={measure}
        deps={[id, screen]}
        onMeasure={setCaption}
        timers={[300, 1000, 2200]}
        className="min-h-full"
      >
        {live ? (
          <div data-eh-live="">{children}</div>
        ) : (
          <div inert>{children}</div>
        )}
      </Measured>
    </Frame>
  );
  return bare ? frame : <Fit w={w}>{frame}</Fit>;
}

export type StripFrame = {
  id: string;
  title: string;
  node: ReactNode;
  measure: Probe;
  live?: boolean;
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
 * AN OPTION'S FRAMES: laptops wrapping (the step's stage lays them out as the
 * rows that draw them largest), phones and tablets side by side in one fitted
 * canvas (one scale, one baseline: both stand upright), and stacked when the
 * lab itself is read on a phone. `lede` is the one line above the frames
 * saying what they hold.
 */
export function Strip({
  screen,
  frames,
  lede,
  h,
}: {
  screen: ScreenId;
  frames: readonly StripFrame[];
  lede?: ReactNode;
  /** Every frame's height, where it is not the whole first screen. */
  h?: number;
}) {
  const onPhone = useOnPhone();
  const head = lede ? (
    <p className="max-w-3xl text-sm leading-snug text-muted-foreground">
      {lede}
    </p>
  ) : null;
  if (screen === "1440" || onPhone) {
    return (
      <div data-eh-row className="flex flex-col gap-3">
        {head}
        <div className="flex flex-wrap items-start gap-6">
          {frames.map((f) => (
            <Scene
              key={f.id}
              id={f.id}
              screen={screen}
              h={h}
              title={f.title}
              measure={f.measure}
              live={f.live}
            >
              {f.node}
            </Scene>
          ))}
        </div>
      </div>
    );
  }
  const w = frames.length * SCREENS[screen].w + (frames.length - 1) * GAP;
  return (
    <div data-eh-row className="flex flex-col gap-3">
      {head}
      <Fit w={w}>
        <div className="flex items-start" style={{ gap: GAP }}>
          {frames.map((f) => (
            <Scene
              key={f.id}
              id={f.id}
              screen={screen}
              h={h}
              title={f.title}
              measure={f.measure}
              live={f.live}
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

const px = (n: number) => `${Math.round(n)}px`;

/** Where the album's first photograph lands on the first screen, or that it is below it. */
function albumStart(root: HTMLElement, screenH: number): string | null {
  const tile = root.querySelector("[data-eh-tile]");
  if (tile) {
    const top = tile.getBoundingClientRect().top;
    if (top >= screenH) return "the album starts below the first screen";
    if (top < 0) return null;
    return `the album starts ${px(top)} down (${Math.round((top / screenH) * 100)}%)`;
  }
  const empty = root.querySelector("[data-eh-empty]");
  if (empty) {
    const top = empty.getBoundingClientRect().top;
    return top >= screenH
      ? "the empty album starts below the first screen"
      : `the empty album starts ${px(top)} down`;
  }
  return null;
}

/**
 * THE DOORS' CAPTION: how many, how big, whether they stand on the cover's
 * foot, over its seam, under it or in the stuck band, the Seam's form and
 * reach, where the album starts, and the band's height once it has stuck.
 */
export const measureDoors =
  (screenH: number): Probe =>
  (root) => {
    // The doors on the first screen: a cover scrolled away takes its own with it.
    const doors = [...root.querySelectorAll("[data-eh-door]")].filter((d) => {
      const r = d.getBoundingClientRect();
      return r.width > 0 && r.bottom > 56 && r.top < screenH;
    });
    if (doors.length === 0) return null;
    const parts: string[] = [];
    const first = doors[0].getBoundingClientRect();
    const head = root.querySelector("[data-eh-head]");
    const coverFoot = head?.getBoundingClientRect().bottom ?? 0;
    const where = doors[0].closest("[data-eh-band][data-stuck]")
      ? "in the stuck band"
      : first.bottom <= coverFoot
        ? `on the cover's foot, ${px(coverFoot - first.bottom)} of photograph under them`
        : first.top < coverFoot
          ? `over the seam, ${px(coverFoot - first.top)} up into the cover`
          : "under the cover";
    parts.push(
      `${doors.length} doors ${where}, the first ${px(first.width)} by ${px(first.height)}`,
    );
    // The Seam as drawn: its form and its reach, read off its own box.
    const light = root.querySelector<HTMLElement>("[data-eh-light]");
    const lit = light?.getBoundingClientRect();
    if (light && lit && lit.height > 0 && lit.bottom > 56)
      parts.push(
        light.dataset.ehLight === "room"
          ? `the Seam reaching ${px(lit.height)} under the cover's edge`
          : `the Seam on paper as ${light.dataset.ehLight}, ${px(lit.height)}`,
      );
    const band = root.querySelector("[data-eh-band][data-stuck]");
    if (band)
      parts.push(`the band ${px(band.getBoundingClientRect().height)} tall`);
    const start = albumStart(root, screenH);
    if (start) parts.push(start);
    return `Measured: ${parts.join("; ")}.`;
  };
