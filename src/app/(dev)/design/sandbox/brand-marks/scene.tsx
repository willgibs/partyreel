"use client";

import { type ReactNode, useState, useSyncExternalStore } from "react";

import { Fit, Frame, Measured } from "@/components/lab";

import { SCREENS, type ScreenId } from "./knobs";

/**
 * THE FRAMES EVERY TAKE IS READ IN: a real viewport at a real width (the kit's
 * `Frame`, a same-origin iframe), so a breakpoint, a `vh` and production's own
 * layout (the wordmark beside the icon) all answer the frame's width; each
 * frame portals a composition (`node`).
 *
 * ★ NOTHING HERE REACHES A SESSION, A SERVER FUNCTION OR THE NETWORK beyond
 * the stills and the fonts.
 *
 * ★ EVERY CAPTION IS READ OFF THE FRAME, NEVER TYPED: a drawing marks what a
 * decision is about (`data-bm-read="<what>"`), production's wordmark is found
 * by its own name, and the caption prints what the frame's document measures
 * there. If a caption and the words above a frame disagree, the caption is the
 * truth.
 */

export type Probe = (root: HTMLElement, win: Window) => string | null;

const px = (n: number) => `${Math.round(n)}`;

/** The marked pieces of a frame, in document order, each with its drawn size. */
export const readMarks: Probe = (root) => {
  const doc = root.ownerDocument;
  const parts: string[] = [];
  const logos = [
    ...doc.querySelectorAll<SVGSVGElement>(
      'svg[role="img"][aria-label="Partyreel"]',
    ),
  ].filter((el) => el.getBoundingClientRect().width > 0);
  for (const el of logos.slice(0, 3)) {
    const r = el.getBoundingClientRect();
    const where =
      el.closest("[data-bm-where]")?.getAttribute("data-bm-where") ??
      "the wordmark";
    parts.push(`${where}: ${px(r.width)}×${px(r.height)}`);
  }
  for (const el of doc.querySelectorAll<HTMLElement>("[data-bm-read]")) {
    const r = el.getBoundingClientRect();
    if (r.width === 0) continue;
    const says = el.dataset.bmSays;
    parts.push(
      `${el.dataset.bmRead}: ${says ?? `${px(r.width)}×${px(r.height)}`}`,
    );
    if (parts.length > 7) break;
  }
  return parts.length ? parts.join("; ") : null;
};

/** One frame. `bare` drops its own fit, for a frame in a row fitted as one canvas. */
export function Scene({
  id,
  w,
  h,
  title,
  measure = readMarks,
  bare = false,
  children,
}: {
  id: string;
  w: number;
  h: number;
  title: string;
  measure?: Probe;
  bare?: boolean;
  children?: ReactNode;
}) {
  const [caption, setCaption] = useState("measuring");
  const frame = (
    <Frame id={id} w={w} h={h} title={title} caption={caption} onApproach>
      <Measured
        probe={measure}
        deps={[id]}
        onMeasure={setCaption}
        timers={[300, 1000, 2400]}
        className="min-h-full"
      >
        <div inert>{children}</div>
      </Measured>
    </Frame>
  );
  return bare ? frame : <Fit w={w}>{frame}</Fit>;
}

export type StoryFrame = {
  id: string;
  title: string;
  /** The frame's own size; a screen's by default. */
  w?: number;
  h?: number;
  node?: ReactNode;
  measure?: Probe;
};

/** The lab's own window at a phone's width: below `sm`, where its column is a phone's. */
const PHONE_WIDTH = "(width < 40rem)";

function onPhoneWidth(change: () => void) {
  const query = window.matchMedia(PHONE_WIDTH);
  query.addEventListener("change", change);
  return () => query.removeEventListener("change", change);
}

function useOnPhone(): boolean {
  return useSyncExternalStore(
    onPhoneWidth,
    () => window.matchMedia(PHONE_WIDTH).matches,
    () => false,
  );
}

const GAP = 24;

/**
 * AN OPTION'S FRAMES: at a desk the sheet first and whole, then the frames
 * wrapping in a row; at a phone every frame side by side in one fitted canvas
 * (one scale, one baseline), and stacked when the lab itself is read on a
 * phone.
 *
 * ★ NO LINE OF ITS OWN ABOVE THE FRAMES (round one's creative director's
 * pass): a step draws the whole option inside its zoom, so a lede there stood
 * at five pixels and only repeated the option's label; each frame's own title
 * says what it holds.
 */
export function Story({
  screen,
  sheet,
  frames,
}: {
  screen: ScreenId;
  /** The mark itself, drawn whole before the places it lives. */
  sheet?: StoryFrame;
  frames: readonly StoryFrame[];
}) {
  const onPhone = useOnPhone();
  const size = SCREENS[screen];
  const all = sheet ? [sheet, ...frames] : frames;
  const scene = (f: StoryFrame, bare = false) => (
    <Scene
      key={f.id}
      id={f.id}
      w={f.w ?? size.w}
      h={f.h ?? size.h}
      title={f.title}
      measure={f.measure}
      bare={bare}
    >
      {f.node}
    </Scene>
  );
  if (screen === "1440" || onPhone)
    return (
      <div data-bm-story className="flex flex-col gap-4">
        {sheet ? scene(sheet) : null}
        <div className="flex flex-wrap items-start gap-6">
          {frames.map((f) => scene(f))}
        </div>
      </div>
    );
  const w =
    all.reduce((s, f) => s + (f.w ?? size.w), 0) + (all.length - 1) * GAP;
  return (
    <div data-bm-story className="flex flex-col gap-4">
      <Fit w={w}>
        <div className="flex items-start" style={{ gap: GAP }}>
          {all.map((f) => scene(f, true))}
        </div>
      </Fit>
    </div>
  );
}
