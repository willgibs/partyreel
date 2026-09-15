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
