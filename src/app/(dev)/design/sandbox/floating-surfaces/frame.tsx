"use client";

import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  CANVAS,
  useLabPrefs,
  type Ground,
  type Mode,
} from "@/components/dev/board";
import { withDesignKey } from "@/lib/design-gate/links";

import type { Dim, Ramp, Scene, Side } from "./constants";
import type { Direction } from "./directions";

/**
 * A VIEWPORT ON A GROUND: the board's stage for this family.
 *
 * The shell's `Stage` is a zoom-fitted div, which is right for a hero and wrong
 * for a floating layer: radix portals every panel to `globalThis.document.body`,
 * so inside a Stage the panel leaves the ground, leaves the zoom and leaves the
 * canvas (a "375" bottom sheet spans the real browser). This mounts the scene
 * route in an iframe laid out at the canvas's true pixels instead, so the panel
 * lands in a document whose body IS the stage. `transform: scale` fits it to the
 * lab column without touching the layout inside, which is the difference that
 * matters: the frame still LAYS OUT at 1440 or 375.
 *
 * Only the props that change the render ride the URL, so a ground, a ramp or a
 * candidate change never reloads: those are attributes the parent writes
 * straight into `contentDocument` (same origin).
 *
 * ROUND FOUR: THE FRAME NO LONGER SCALES. Will's review: "the iFrame previews
 * throw off anything related to size, making those reviews particularly
 * difficult. This needs to be fixed for pixel-perfect lab demos/previews." A
 * `transform: scale` kept the LAYOUT honest and made every judged size a lie,
 * which on a board about a 4px corner is the whole board. So a frame is now its
 * canvas's real pixels: 1440 is 1440, and a canvas wider than the lab column
 * scrolls sideways inside its own box rather than shrinking. The shell's
 * Fit/1:1 control (lab-prefs.ts, on the dock) still fits a frame to the column
 * for a glance at the whole, and 1:1 is the default everywhere.
 *
 * ROUND THREE: a frame mounts with its ROW, not on its own. Round two mounted
 * all nineteen at once and argued that a frame appearing when you reach it makes
 * a side-by-side comparison depend on how you scrolled to it. The argument is
 * right about a frame and wrong about a board: measured on the walk, nineteen
 * documents cost 1020 requests and took 5.7s to settle, which is the "slow first
 * paint" a stranger meets before the first row says anything. So the unit is the
 * ROW (useMountOnApproach below): every frame in a row mounts together, a
 * viewport and a half before the row arrives, and row one mounts immediately
 * because a reader meets it before they can scroll. A comparison is never
 * half-loaded, because the things being compared always arrive as one.
 */

/** Row-level mounting. `false` holds the box at its exact size and loads
 *  nothing; it flips to true once and never back, so a scroll up and down never
 *  reloads a document. */
const MountContext = createContext(true);

/** Mount everything under `ref` when the element comes within a viewport and a
 *  half of the fold. The observed element must be a REAL box: the first version
 *  of this wrapped the row in `display: contents`, which produces no box at all,
 *  so the observer never fired and every row that was not marked eager stayed
 *  empty. A row passes its own <section>. */
export function useMountOnApproach(
  ref: React.RefObject<HTMLElement | null>,
  eager: boolean,
): boolean {
  const [on, setOn] = useState(eager);
  useEffect(() => {
    if (on) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setOn(true);
      },
      // A viewport and a half of lead time: at a reading scroll the documents
      // are painted before the row is on screen, and a reader who jumps to the
      // bottom waits for one row rather than for nineteen.
      { rootMargin: "1400px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [on, ref]);
  return on;
}

export const MountProvider = MountContext.Provider;

export type FrameProps = {
  scene: Scene;
  ground: Ground;
  /** Which of the palette board's dark ramps the panel floats over. */
  ramp?: Ramp;
  /** Round four: which floating layer this frame renders. */
  direction?: Direction;
  mode: Mode;
  /** Override the canvas height; a ladder rarely needs a full viewport. */
  height?: number;
  /** Override the canvas WIDTH. A ladder is a detail instrument: judging a 6px
   *  corner against a 12px one at 0.5 scale judges the scale, so a ladder asks
   *  for exactly the width its rungs need and renders 1:1 in the lab column.
   *  Kept above 768 on the desktop canvas so `sm:` still resolves desktop-side
   *  (the sheet, the dialog and the guest entry shell all branch on it). */
  width?: number;
  dim?: Dim;
  variant?: "sheet" | "drawer";
  /** Which edge an edge-attached panel enters from. Defaults to the real one
   *  for the width (a guest on a phone gets the bottom, a host at 1440 the
   *  right); named explicitly where the product's own call site differs. */
  side?: Side;
  /** A short scene body, so a tall surface's top edge fits a short canvas. */
  compact?: boolean;
  /** A single rung's candidate class, when the whole frame is one rung. */
  rung?: string;
  radius?: string;
  entrance?: string;
  light?: string;
  /** Bumping this re-runs every entrance inside the frame. */
  replay?: number;
  /** `undefined` while the board has not read the lab key yet: the frame holds
   *  its box and loads nothing, so the gated scene route is never hit keyless. */
  designKey: string | null | undefined;
  label: string;
};

export function Frame({
  scene,
  ground,
  ramp = "today",
  direction = "today",
  mode,
  height,
  width,
  dim = "radius",
  variant = "sheet",
  side,
  compact = false,
  rung,
  radius = "off",
  entrance = "off",
  light = "off",
  replay = 0,
  designKey,
  label,
}: FrameProps) {
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);
  const [ready, setReady] = useState(0);
  const trueScale = useLabPrefs().fit === "true";
  const w = width ?? CANVAS[mode].w;
  const h = height ?? CANVAS[mode].h;

  // Only the render-changing props are in the URL; a change to one of them is a
  // deliberate reload of the frame.
  const src = useMemo(() => {
    const q = new URLSearchParams({
      scene,
      w: mode === "phone" ? "375" : "1440",
      dim,
      variant,
      ground,
      ramp,
      direction,
      radius,
      entrance,
      light,
    });
    if (side) q.set("side", side);
    if (rung) q.set("rung", rung);
    if (compact) q.set("compact", "1");
    if (designKey === undefined) return undefined;
    return withDesignKey(
      `/design/sandbox/floating-surfaces?${q.toString()}`,
      designKey,
    );
    // ground/ramp/direction/radius/entrance/light are seeded here for the first
    // paint and then owned by the attribute effect below, so they must NOT
    // retrigger the memo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene, mode, dim, variant, side, compact, rung, designKey]);

  // Only measured when the reader has asked for Fit; at 1:1 the box is the
  // canvas and nothing is measured at all.
  useLayoutEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    if (trueScale) return;
    const sync = () =>
      setScale(Math.min(1, box.getBoundingClientRect().width / w));
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(box);
    return () => ro.disconnect();
  }, [w, trueScale]);

  // The ground, the ramp, the direction and the three knobs, asked for rather
  // than written: the frame is their resident owner (frame-page.tsx says why
  // next-themes makes that necessary). Same origin, so this is a direct
  // dispatch, no postMessage. `ready` is in the deps so a frame that has just
  // reloaded is told again.
  useEffect(() => {
    const win = frameRef.current?.contentWindow;
    if (!win) return;
    const Ctor = (win as Window & typeof globalThis).CustomEvent ?? CustomEvent;
    win.dispatchEvent(
      new Ctor("flt:set", {
        detail: { ground, ramp, direction, radius, entrance, light },
      }),
    );
  }, [ground, ramp, direction, radius, entrance, light, ready]);

  // Replay runs the frames you can SEE, and REMEMBERS the ones you cannot.
  // Measured on the walk: one press with fourteen frames mounted closed and
  // re-opened about thirty panels across fourteen documents at once and cost a
  // 150ms hitch, all of it spent on entrances nobody was looking at. A row is
  // always visible as a row, so the comparisons that matter still replay
  // together.
  //
  // ROUND THREE, SECOND PASS: dropping the press for an off-screen frame made
  // the button dead at 375, where the control bar is static at the top of the
  // document and nothing is on screen from up there, and no amount of scrolling
  // afterwards brought the entrance back (the effect had already run). A frame
  // that was off screen when the press landed now waits for its own arrival and
  // replays then, so a press is never swallowed. The observer lives one press.
  useEffect(() => {
    if (!replay) return;
    const el = frameRef.current;
    if (!el) return;
    const run = () => el.contentWindow?.dispatchEvent(new Event("flt:replay"));
    const r = el.getBoundingClientRect();
    if (r.bottom > -200 && r.top < window.innerHeight + 200) {
      run();
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        run();
      },
      { rootMargin: "200px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [replay]);

  const mounted = useContext(MountContext);
  const drawn = trueScale ? 1 : scale;
  // A canvas that is not a real viewport says so. At 1:1 nothing is shrunk, so
  // round three's "canvas at 69%" badge is gone with the shrinking; what is
  // still worth saying is that a 340-wide detail frame is not a phone.
  const detail = w !== 1440 && w !== 375;

  return (
    // At 1:1 the measured box IS the canvas, and the wrapper scrolls sideways
    // when the lab column is narrower. Width has to flow top-down: a wrapper
    // that takes its width from its content makes the box and the scale chase
    // each other down (it settled at 200px of a 1440 canvas once).
    <div
      ref={boxRef}
      className={
        trueScale
          ? "w-full min-w-0 flex-1 overflow-x-auto"
          : "w-full min-w-0 flex-1"
      }
    >
      <div
        className="relative overflow-hidden rounded-lg border border-border bg-muted/30"
        style={{ width: w * drawn, height: h * drawn }}
      >
        {src && mounted ? (
          <iframe
            ref={frameRef}
            title={label}
            src={src}
            onLoad={() => setReady((n) => n + 1)}
            className="absolute top-0 left-0 border-0"
            style={{
              width: w,
              height: h,
              transform: trueScale ? undefined : `scale(${drawn})`,
              transformOrigin: "top left",
            }}
          />
        ) : null}
        {detail || !trueScale ? (
          <span className="pointer-events-none absolute right-1 bottom-1 rounded-md bg-background/75 px-1.5 py-0.5 text-[10px] text-muted-foreground tabular-nums">
            {trueScale
              ? `${w} canvas, 1:1`
              : `${w} canvas at ${Math.round(drawn * 100)}%`}
          </span>
        ) : null}
      </div>
    </div>
  );
}
