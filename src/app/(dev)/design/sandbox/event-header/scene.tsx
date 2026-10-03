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
 * only inside a same-origin frame at its true size. 1440 by 900 is her
 * laptop; 375 by 812 the phone in her hand at the party.
 *
 * ★ A STILL FRAME IS INERT (a picture, never a control); TRY IT IS LIVE. A
 * rooms option's first frame is the hub running in that option, its doors
 * pressable and its rooms closable, because what that decision chooses is
 * how a press feels, and a still can only show where it lands.
 *
 * ★ NOTHING HERE REACHES A SESSION, A SERVER FUNCTION OR THE NETWORK beyond
 * the stills and the code's renderer: the hub reads a session and the album's
 * live store, so it is composed from production's presentational pieces in
 * its own order, and its state is local.
 *
 * ★ EVERY CAPTION IS READ OFF THE FRAME, NEVER COMPUTED: where the album
 * starts, how many words the cover says, how big the night's instrument and
 * the doors are, what shape a room opened in, found by the marks each drawing
 * puts on its own pieces (`data-eh-*`).
 */

export const SCREENS = {
  "375": { w: 375, h: 812, name: "a phone" },
  "1440": { w: 1440, h: 900, name: "a laptop" },
} as const;

export type ScreenId = keyof typeof SCREENS;

/** The Screen knob: her laptop first. */
export const screenOf = (s: BoardState): ScreenId =>
  s.screen === "375" ? "375" : "1440";

/** The gap between two phones of a row, in the lab's own pixels. */
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
  title,
  measure,
  live = false,
  bare = false,
  children,
}: {
  id: string;
  screen: ScreenId;
  title: string;
  measure: Probe;
  /** A frame he presses (Try it); every other frame is a picture. */
  live?: boolean;
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
 * AN OPTION'S FRAMES: phones side by side in one fitted canvas (one scale,
 * one baseline), laptops stacked (the step's stage lays a stack out as the
 * row that draws it largest), and phones stacked too when the lab itself is
 * read on a phone. `lede` is the one line above the frames saying what they
 * hold.
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
            measure={f.measure}
            live={f.live}
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

/**
 * The words a reader meets in an element: every text node outside a screen
 * reader's own line (`.sr-only`, laid out but never seen), split on
 * whitespace, a token counted when it holds a letter or a digit. A glyph
 * count's number is a word here: it is read.
 */
export function wordsIn(el: Element | null): number {
  if (!el) return 0;
  const doc = el.ownerDocument;
  const walk = doc.createTreeWalker(el, 4 /* NodeFilter.SHOW_TEXT */);
  let n = 0;
  for (let t = walk.nextNode(); t; t = walk.nextNode()) {
    if (t.parentElement?.closest(".sr-only, svg")) continue;
    for (const token of (t.textContent ?? "").split(/\s+/))
      if (/[\p{L}\p{N}]/u.test(token)) n++;
  }
  return n;
}

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
 * THE COVER'S CAPTION: the words it says (the code's own glyphs aside), how big
 * the night's instrument is where it carries one, and where the album starts.
 */
export const measureFacts =
  (screenH: number): Probe =>
  (root) => {
    const head = root.querySelector("[data-eh-head]");
    if (!head) return null;
    const parts: string[] = [`the cover says ${wordsIn(head)} words`];
    const dial = root.querySelector("[data-eh-dial]");
    if (dial) {
      const r = dial.getBoundingClientRect();
      parts.push(
        `the dial ${px(r.width)} across, ${dial.getAttribute("data-eh-dial")}`,
      );
    }
    const strip = root.querySelector("[data-eh-strip]");
    if (strip) {
      const r = strip.getBoundingClientRect();
      parts.push(
        `the strip ${px(r.width)} by ${px(r.height)}, ${strip.getAttribute("data-eh-strip")}`,
      );
    }
    const code = root.querySelector("[data-code-door]");
    if (code) parts.push(`the code ${px(code.getBoundingClientRect().width)}`);
    const start = albumStart(root, screenH);
    if (start) parts.push(start);
    return `Measured: ${parts.join("; ")}.`;
  };

/**
 * THE DOORS' CAPTION: how many, how big, whether they stand on the cover or
 * under it, where the album starts, and the band's height once it has stuck.
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
    const where = doors[0].closest("[data-eh-head]")
      ? "on the cover"
      : doors[0].closest("[data-eh-band][data-stuck]")
        ? "in the stuck band"
        : "under the cover";
    parts.push(
      `${doors.length} doors ${where}, the first ${px(first.width)} by ${px(first.height)}`,
    );
    const band = root.querySelector("[data-eh-band][data-stuck]");
    if (band)
      parts.push(`the band ${px(band.getBoundingClientRect().height)} tall`);
    const start = albumStart(root, screenH);
    if (start) parts.push(start);
    return `Measured: ${parts.join("; ")}.`;
  };

/**
 * A ROOM'S CAPTION: what shape it opened in and how much of the screen it
 * takes, and whether the hub still stands behind it.
 */
export const measureRoom =
  (screenW: number): Probe =>
  (root) => {
    const room = root.querySelector("[data-eh-room]");
    if (!room) {
      const doors = root.querySelectorAll("[data-eh-door]").length;
      return doors
        ? `Measured: the hub at rest, ${doors} doors to press.`
        : null;
    }
    const r = room.getBoundingClientRect();
    if (r.width === 0) return null;
    const shape = room.getAttribute("data-eh-shape") ?? "room";
    const parts = [
      `${room.getAttribute("data-eh-room")} opens as ${shape}, ${px(r.width)} wide (${Math.round((r.width / screenW) * 100)}% of the screen)`,
    ];
    if (root.querySelector("[data-eh-behind]"))
      parts.push("the hub stands behind it");
    return `Measured: ${parts.join("; ")}.`;
  };
