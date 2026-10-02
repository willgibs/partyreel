"use client";

import {
  type ReactNode,
  type RefObject,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";

import { type BoardState, Fit, Frame, Measured } from "@/components/lab";

/**
 * THE FRAMES THE DOOR IS READ IN, AND WHAT EACH ONE MEASURES.
 *
 * ★ A REAL VIEWPORT, NEVER A STYLED DIV: the door stands at the Sheet's
 * breakpoint's size on either side of 40rem (`doorway.css`), and its page is
 * held below the header by a clamp of the screen's height (`DOOR_MAIN`), so
 * only a same-origin frame at the true width and height shows the door a
 * guest gets (the kit's `vw-in-a-narrow-div` trap). 375 by 812 is the phone
 * off a printed code; 1440 by 900 the laptop.
 *
 * ★ A MOMENT IS READ LIVE AND IN STILLS. Every option is drawn first as it
 * plays (looping, so it can be watched again without a press), then as stills
 * of the same scene frozen at its beats, the first of which is the still
 * reduced motion paints (`still`: no transition and no animation runs in it,
 * the rest state standing whole, as `prefers-reduced-motion` gets it). Four
 * phones stand side by side in ONE zoom-fitted canvas (one scale, one
 * baseline); laptops stack, and so do phones when the lab itself is read on a
 * phone, since a row of four is drawn there at a fifth of its size.
 *
 * ★ NOTHING HERE REACHES A SESSION, A SERVER FUNCTION OR THE NETWORK: what
 * would (the guest header, the album's live gallery) is QUOTED, and what does
 * not is production's own piece. Every frame is INERT, a picture and never a
 * control; the frame swallows a link or a form pressed in it anyway.
 *
 * ★ EVERY CAPTION IS READ OFF THE FRAME, NEVER COMPUTED: what the opening
 * shows (found by its marks), the leaf's angle (its computed transform), whose
 * light it wears (its own `data-door-hues`), and what moves and on what clock
 * (the frame's own running animations).
 */

export const SCREENS = {
  "375": { w: 375, h: 812, name: "a phone" },
  "1440": { w: 1440, h: 900, name: "a laptop" },
} as const;

export type ScreenId = keyof typeof SCREENS;

export const screenOf = (s: BoardState): ScreenId =>
  s.screen === "1440" ? "1440" : "375";

export type Probe = (root: HTMLElement, win: Window) => string | null;

/** The gap between two frames of a row, in the lab's own pixels. */
const GAP = 24;

/**
 * ONE FRAME. `bare` drops its own zoom-fit, for a frame standing in a row that
 * is fitted as one canvas; `still` stands everything in it still, as reduced
 * motion does.
 */
export function Scene({
  id,
  screen,
  title,
  measure,
  again,
  still = false,
  bare = false,
  children,
}: {
  id: string;
  screen: ScreenId;
  title: string;
  measure: Probe;
  /** Anything that changes the drawing without moving its layout (sampled
   *  hues landing), so the caption is read again when it does. */
  again?: string;
  still?: boolean;
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
        deps={[id, screen, again, still]}
        onMeasure={setCaption}
        // The live loops change what they show for as long as they run, so
        // the caption is read once more when a loop has gone round.
        timers={[200, 900, 1800, 4000]}
        className="min-h-full"
      >
        <div inert data-ld-still={still ? "" : undefined}>
          {children}
        </div>
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
  still?: boolean;
  /** A frame whose drawing changes after layout (sampled hues landing). */
  again?: string;
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
 * A STRIP OF FRAMES: phones side by side in one fitted canvas, laptops
 * stacked, and phones stacked too when the lab itself is read on a phone.
 * `lede` is the one line above the row saying what it holds.
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
      <div data-ld-row className="flex flex-col gap-6">
        {head}
        {frames.map((f) => (
          <Scene
            key={f.id}
            id={f.id}
            screen={screen}
            title={f.title}
            measure={f.measure}
            still={f.still}
            again={f.again}
          >
            {f.node}
          </Scene>
        ))}
      </div>
    );
  }
  const w = frames.length * SCREENS["375"].w + (frames.length - 1) * GAP;
  return (
    <div data-ld-row className="flex flex-col gap-3">
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
              still={f.still}
              again={f.again}
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

/**
 * WHETHER THIS DRAWING IS OFF THE STAGE. A step draws every option at once
 * and hides all but one, marking each hidden one's view `data-paused`; a
 * drawing lives in a frame's document, so it finds the mark through the
 * frame's own element. A hidden option's loop holds still rather than running
 * for nobody.
 */
export function useOffStage(ref: RefObject<HTMLElement | null>): boolean {
  const [off, setOff] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const frame = el.ownerDocument.defaultView?.frameElement ?? null;
    const view = (frame ?? el).closest("[data-lab-view]");
    if (!view) return;
    const sync = () => setOff(view.hasAttribute("data-paused"));
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(view, { attributes: true, attributeFilter: ["data-paused"] });
    return () => mo.disconnect();
  }, [ref]);
  return off;
}

/* ── what the frames read ──────────────────────────────────────────────── */

const clean = (s: string | null | undefined) =>
  (s ?? "").replace(/\s+/g, " ").trim();

/** An element's own words, whitespace folded. */
export const textOf = (el: Element | null | undefined) =>
  clean((el as HTMLElement | null)?.innerText);

/** A whole number of milliseconds, said in seconds where it is long. */
export const timeOf = (ms: number) =>
  ms >= 1000
    ? `${(Math.round(ms / 100) / 10).toString().replace(/\.0$/, "")} s`
    : `${Math.round(ms)} ms`;

/**
 * THE ANGLE A LEAF STANDS AT, off its computed transform (a `matrix3d` for a
 * `rotateY`): its first column's x and z components are cos and sin of the
 * turn. Null where the leaf is not turned at all.
 */
export function leafAngle(leaf: Element | null, win: Window): number | null {
  if (!leaf) return null;
  const t = win.getComputedStyle(leaf).transform;
  if (!t || t === "none") return 0;
  const m = /matrix3d\(([^)]+)\)/.exec(t);
  if (!m) return 0;
  const v = m[1].split(",").map(Number);
  // A rotateY(a): m11 = cos a, m13 = -sin a.
  return Math.round((Math.atan2(-v[2], v[0]) * 180) / Math.PI);
}

/** The hues a lit piece names (`data-door-hues`), as a reader says them. */
export function lightOf(root: HTMLElement, house: readonly number[]): string {
  const lit = root.querySelector("[data-door-hues]");
  const hues = lit?.getAttribute("data-door-hues");
  if (!hues) return "no light";
  const houseKey = house.slice(0, 3).map(Math.round).join(",");
  return hues === houseKey
    ? "lit by the house five"
    : `lit by the album's own hues (${hues.split(",").join(", ")})`;
}

/**
 * WHAT MOVES IN A FRAME, AND ON WHAT CLOCK: its running CSS animations, by
 * name, their duration and the properties their keyframes move. A reduced
 * motion still, and a live frame under an emulated reduced motion, read
 * "nothing moves".
 */
export function motionOf(root: HTMLElement): string {
  const running = root
    .getAnimations({ subtree: true })
    .filter(
      (a): a is CSSAnimation =>
        "animationName" in a && a.playState === "running",
    );
  if (!running.length) return "nothing moves";
  const byName = new Map<string, { ms: number; props: Set<string> }>();
  for (const a of running) {
    const name = a.animationName;
    // The house's own drifts and pings say nothing about this round's loop.
    if (!name.startsWith("ld-")) continue;
    const timing = a.effect?.getTiming();
    const ms = typeof timing?.duration === "number" ? timing.duration : 0;
    const entry = byName.get(name) ?? { ms, props: new Set<string>() };
    const frames = (a.effect as KeyframeEffect | null)?.getKeyframes() ?? [];
    for (const k of frames)
      for (const p of Object.keys(k))
        if (!["offset", "easing", "composite", "computedOffset"].includes(p))
          entry.props.add(p);
    byName.set(name, entry);
  }
  if (!byName.size) return "only the room's own drift moves";
  return [...byName.entries()]
    .map(
      ([name, e]) =>
        `${name.replace(/^ld-/, "")} every ${timeOf(e.ms)} (${[...e.props].join(", ")})`,
    )
    .join("; ");
}
