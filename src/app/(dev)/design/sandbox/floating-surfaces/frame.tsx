"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { CANVAS, type Ground, type Mode } from "@/components/dev/board";
import { withDesignKey } from "@/lib/design-gate/links";
import { cn } from "@/lib/utils";

import {
  GROUND_CLASSES,
  GROUND_SET,
  type Dim,
  type Scene,
} from "./constants";

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
 * Only the props that change the render ride the URL, so a ground or candidate
 * change never reloads: those are attributes the parent writes straight into
 * `contentDocument` (same origin). Frames mount lazily, one viewport ahead, so a
 * board of six does not open six app documents at once.
 */

export type FrameProps = {
  scene: Scene;
  ground: Ground;
  mode: Mode;
  /** Override the canvas height; a ladder rarely needs a full viewport. */
  height?: number;
  /** Override the canvas WIDTH. A ladder is a detail instrument: judging a 6px
   *  corner against a 12px one at 0.5 scale judges the scale, so a ladder asks
   *  for exactly the width its rungs need and renders 1:1 in the lab column.
   *  Kept above 768 on the desktop canvas so `sm:` still resolves desktop-side
   *  (both sheet and dialog branch on it). */
  width?: number;
  /** Cap the fitted width, so small frames can sit several to a row at 1:1. */
  fit?: number;
  dim?: Dim;
  variant?: "sheet" | "drawer";
  /** A single rung's candidate class, when the whole frame is one rung. */
  rung?: string;
  radius?: string;
  entrance?: string;
  light?: string;
  /** Bumping this re-runs every entrance inside the frame. */
  replay?: number;
  designKey: string | null;
  label: string;
};

export function Frame({
  scene,
  ground,
  mode,
  height,
  width,
  fit,
  dim = "radius",
  variant = "sheet",
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
  const [near, setNear] = useState(false);
  const [ready, setReady] = useState(0);
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
      radius,
      entrance,
      light,
    });
    if (rung) q.set("rung", rung);
    return withDesignKey(
      `/design/sandbox/floating-surfaces?${q.toString()}`,
      designKey,
    );
    // ground/radius/entrance/light are seeded here for the first paint and then
    // owned by the attribute effect below, so they must NOT retrigger the memo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene, mode, dim, variant, rung, designKey]);

  // Mount one viewport ahead of the scroll, so a board of six frames does not
  // open six app documents on load.
  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const io = new IntersectionObserver(
      (entries) => entries.some((e) => e.isIntersecting) && setNear(true),
      { rootMargin: "600px" },
    );
    io.observe(box);
    return () => io.disconnect();
  }, []);

  useLayoutEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const sync = () => {
      const avail = Math.min(box.getBoundingClientRect().width, fit ?? Infinity);
      setScale(Math.min(1, avail / w));
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(box);
    return () => ro.disconnect();
  }, [w, fit]);

  // The ground and the three knobs, written into the frame's own <html>. Same
  // origin, so this is a direct attribute write rather than a postMessage.
  useEffect(() => {
    const doc = frameRef.current?.contentDocument;
    if (!doc?.documentElement) return;
    const root = doc.documentElement;
    const g = GROUND_SET[ground];
    root.classList.remove(...GROUND_CLASSES);
    root.classList.add(...g.className.split(" "));
    if (g.mkt) root.setAttribute("data-mkt", "");
    else root.removeAttribute("data-mkt");
    root.style.removeProperty("--background");
    if (g.bg) root.style.setProperty("--background", g.bg);
    root.style.colorScheme = g.className.includes("dark") ? "dark" : "light";
    root.setAttribute("data-flt-radius", radius);
    root.setAttribute("data-flt-entrance", entrance);
    root.setAttribute("data-flt-light", light);
  }, [ground, radius, entrance, light, ready]);

  useEffect(() => {
    if (!replay) return;
    frameRef.current?.contentWindow?.dispatchEvent(new Event("flt:replay"));
  }, [replay]);

  return (
    <div ref={boxRef} className="min-w-0 flex-1">
      <div
        className={cn(
          "relative overflow-hidden rounded-lg border border-border bg-muted/30",
        )}
        style={{ width: w * scale, height: h * scale }}
      >
        {near ? (
          <iframe
            ref={frameRef}
            title={label}
            src={src}
            onLoad={() => setReady((n) => n + 1)}
            className="absolute top-0 left-0 border-0"
            style={{
              width: w,
              height: h,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
          />
        ) : null}
      </div>
    </div>
  );
}
