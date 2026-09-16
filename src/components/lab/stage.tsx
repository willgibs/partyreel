"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import { type LabFit, useLabPrefs } from "./lab-prefs";

/**
 * THE BOARD SHELL'S STAGE (extracted from the home-hero board at the review
 * wave, 2026-09-14, so every exploration board judges on the same canvas).
 *
 * A stage is a real viewport's pixels laid out at 1440 or at 375, so a
 * candidate reads against the real tokens on a real ground rather than a
 * hand-picked literal. Since round four (2026-09-15) it renders at 1:1 by
 * default (the lab preference `fit`, lab-prefs.ts, switched from any board's
 * dock): a 1440 canvas is 1440 CSS pixels wide and scrolls sideways when the
 * column is narrower, because a zoom-fitted stage shrank every size Will was
 * asked to judge to about 0.7x. "Fit" keeps the old `zoom` fitting for a
 * glance at the whole; a board may pin either with the `fit` prop.
 *
 * The ground is the token set the stage paints under its children:
 *  - cinema: the dark room every dark marketing chapter sits on (`.dark` with
 *    `--background` deepened to 0.11, exactly what the (cinema) group's skin
 *    does), WITHOUT the group's `data-mkt-skin`, because marketing.css flips
 *    the whole BODY on `body:has([data-mkt-skin])` and a board that shows
 *    cinema and paper side by side must not; pass `bodySkin` on a board that
 *    is cinema-only and wants the page to match (the home hero does);
 *  - paper: the light body (`.surface-paper`);
 *  - ink: the footer's leaf set (`.surface-ink`);
 *  - app-dark / app-light: the app's own two themes, no marketing token block.
 *
 * Loops pause on a hidden TAB only, through `data-paused` (the lab never
 * pauses on scroll: side-by-side comparison wants everything running);
 * production wiring is useAmbientPause.
 *
 * ★ A Tailwind breakpoint prefix inside a stage reads the REAL browser
 * viewport, not the canvas (`zoom` scales layout, never media queries), so
 * `sm:` fires inside the 375 stage on a desktop. A board's own markup keys off
 * the `mode` prop; the real components rendered inside carry their own
 * prefixes and are judged as they ship (found by the brand-voice board).
 */
export type Mode = "desktop" | "phone";
export type Ground = "cinema" | "paper" | "ink" | "app-dark" | "app-light";

/** The canvases the boards judge on: a hero is a viewport-shaped thing, so a
 *  board lays out at a real viewport's pixels; a section board passes its own
 *  height. */
export const CANVAS = {
  desktop: { w: 1440, h: 930 },
  phone: { w: 375, h: 760 },
} as const;

const GROUND: Record<
  Ground,
  {
    className: string;
    mkt: boolean;
    skin?: "cinema" | "paper";
    style?: React.CSSProperties;
  }
> = {
  cinema: {
    className: "dark",
    mkt: true,
    skin: "cinema",
    style: {
      "--background": "oklch(0.11 0 0)",
      colorScheme: "dark",
    } as React.CSSProperties,
  },
  paper: { className: "surface-paper", mkt: true, skin: "paper" },
  ink: { className: "surface-ink", mkt: true },
  "app-dark": { className: "dark", mkt: false },
  "app-light": { className: "surface-paper", mkt: false },
};

/** The lab's pause source: the stage sets `data-paused` from it and a JS loop
 *  reads the same attribute. */
export function useTabHidden(): boolean {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const sync = () => setHidden(document.hidden);
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);
  return hidden;
}

export function Stage({
  mode,
  ground = "cinema",
  height,
  bodySkin = false,
  fit,
  className,
  children,
}: {
  mode: Mode;
  ground?: Ground;
  /** Override the canvas height (a section board is rarely a full viewport). */
  height?: number;
  /** Pin the scale ("true" is 1:1, "zoom" fits the column); default: the lab preference. */
  fit?: LabFit;
  /** Also set `data-mkt-skin`, which flips the lab page's body to this ground. */
  bodySkin?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const hidden = useTabHidden();
  const boxRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);
  const { w, h } = CANVAS[mode];
  const g = GROUND[ground];
  const pref = useLabPrefs().fit;
  const trueScale = (fit ?? pref) === "true";

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

  return (
    <div
      ref={boxRef}
      data-stage-fit={trueScale ? "true" : "zoom"}
      // At 1:1 on a wide page design.css gives this box the page's gutter back
      // (data-lab-bleed), so a 1440 canvas uses the whole window before it
      // scrolls sideways (Will, 2026-09-16).
      data-lab-bleed={trueScale ? "" : undefined}
      className={
        trueScale
          ? "min-w-0 overflow-x-auto overflow-y-hidden"
          : "flex min-w-0 justify-center overflow-hidden"
      }
    >
      <div
        className={cn(
          g.className,
          "relative overflow-hidden rounded-lg border border-border bg-background text-foreground",
          trueScale && "mx-auto shrink-0",
          className,
        )}
        {...(g.mkt ? { "data-mkt": "" } : {})}
        {...(bodySkin && g.skin ? { "data-mkt-skin": g.skin } : {})}
        data-ground={ground}
        data-paused={hidden ? "true" : undefined}
        style={{
          ...g.style,
          zoom: trueScale ? 1 : scale,
          width: w,
          height: height ?? h,
        }}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * A STAGE THAT TAKES ITS HEIGHT FROM ITS CONTENT (lifted from the brand-voice
 * board at the kit round, 2026-09-15).
 *
 * `Stage` draws a viewport: a fixed canvas a hero is judged inside. A section
 * board is not a viewport, it is a block of arbitrary height on a real ground,
 * and pinning it to 930 either clips it or floats it in dead space. FitStage
 * measures what it was handed and hands that height to the Stage, so the ground
 * ends where the block does.
 *
 * ★ THE MEASURED NODE IS NOT THE KEYED ONE. `swapKey` remounts the child a
 * level below the measured box, because a key change on the measured node swaps
 * the element out from under the observer and the height freezes at the last
 * one. And the slack is not a fudge for the copy: the Stage is border-box, so
 * its 1px border comes OUT of the height it is handed, and a zoom-fitted stage
 * rounds at the device pixel. Both read as a constant few-pixel clip on every
 * stage at once, which is how you tell them from a line that really does not
 * fit.
 */
const FIT_SLACK = 3;

export function FitStage({
  mode,
  ground,
  swapKey,
  bodySkin,
  fit,
  className,
  children,
}: {
  mode: Mode;
  ground?: Ground;
  /** Remounts the inner block (a candidate swap that must re-animate). */
  swapKey?: string;
  bodySkin?: boolean;
  fit?: LabFit;
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [height, setHeight] = useState<number | undefined>(undefined);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const sync = () =>
      setHeight(
        Math.ceil(Math.max(el.offsetHeight, el.scrollHeight)) + FIT_SLACK,
      );
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    window.addEventListener("resize", sync);
    // The webfont lands after the first layout and takes every wrap with it.
    document.fonts?.ready.then(sync).catch(() => {});
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", sync);
    };
  }, [mode, swapKey]);

  return (
    <Stage
      mode={mode}
      ground={ground}
      height={height}
      bodySkin={bodySkin}
      fit={fit}
    >
      {/* flow-root, so a child's margin cannot collapse out of the measured box
          and hand back a height shorter than what is drawn. */}
      <div ref={ref} className="flow-root">
        <div key={swapKey} className={className}>
          {children}
        </div>
      </div>
    </Stage>
  );
}
