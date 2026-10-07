"use client";

import { useEffect, useRef } from "react";

import type { ScreenId } from "../knobs";
import { AS_DRAWN, type Drawing, type Wordmark } from "./candidates";

/**
 * THE WORD ITSELF, BEFORE THE SURFACES IT SIGNS: the drawing large on paper
 * and in the room (production's own grounds, their own inks), then at the
 * sizes production draws it, true size, and the bars' 22px enlarged pixel for
 * pixel, so what a small cut does is seen rather than claimed.
 */

/** A drawing as production draws it: one path, `currentColor`, sized by its height. */
export function Word({
  mark,
  height,
  read,
}: {
  mark: Drawing;
  height: number;
  read?: string;
}) {
  return (
    <svg
      viewBox={`0 0 ${mark.w} 64`}
      height={height}
      width={(height * mark.w) / 64}
      fill="currentColor"
      aria-hidden
      data-bm-read={read}
      style={{ display: "block", flexShrink: 0, overflow: "visible" }}
    >
      <path d={mark.d} />
    </svg>
  );
}

/**
 * THE BARS' SIZE, ENLARGED PIXEL FOR PIXEL: the drawing rasterised at 22px on
 * a device pixel grid of 2, then shown four times larger with no smoothing,
 * so a reader sees the pixels a laptop actually lights.
 */
function Pixels({
  mark,
  height,
  zoom,
  ink,
  ground,
  read,
}: {
  mark: Drawing;
  height: number;
  zoom: number;
  ink: string;
  ground: string;
  read?: string;
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const dpr = 2;
  const w = Math.ceil((height * mark.w) / 64) + 4;
  const h = height + 4;
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = ground;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const s = (height / 64) * dpr;
    ctx.setTransform(s, 0, 0, s, 2 * dpr, 2 * dpr);
    ctx.fillStyle = ink;
    ctx.fill(new Path2D(mark.d));
  }, [mark, height, ink, ground]);
  return (
    <canvas
      ref={ref}
      width={w * dpr}
      height={h * dpr}
      data-bm-read={read}
      data-bm-says={read ? `${height}px enlarged ${zoom}×` : undefined}
      style={{
        width: w * zoom,
        height: h * zoom,
        imageRendering: "pixelated",
        display: "block",
      }}
    />
  );
}

/** A caption on the sheet, in the readout's voice. */
function Cap({ children }: { children: string }) {
  return (
    <span className="text-label font-semibold text-muted-foreground uppercase tabular-nums">
      {children}
    </span>
  );
}

/** One ground's half of the sheet. */
function Half({
  mark,
  ground,
  screen,
  before,
}: {
  mark: Wordmark;
  ground: "paper" | "room";
  screen: ScreenId;
  before?: Drawing;
}) {
  const desk = screen === "1440";
  const big = desk ? 104 : 46;
  const pixel = {
    ink: ground === "paper" ? "#141416" : "#f5f5f7",
    ground: ground === "paper" ? "#f6f6f8" : "#09090b",
  };
  return (
    <div
      className={
        ground === "paper"
          ? "surface-paper flex flex-col bg-background text-foreground"
          : "dark flex flex-col bg-background text-foreground"
      }
      style={{
        padding: desk ? "56px 64px" : "32px 20px",
        gap: desk ? 40 : 26,
        flex: 1,
      }}
    >
      <Cap>{ground === "paper" ? "On paper" : "In the room"}</Cap>
      <Word
        mark={mark.display}
        height={big}
        read={`the wordmark large ${ground === "paper" ? "on paper" : "in the room"}`}
      />
      <div className="flex flex-wrap items-end" style={{ gap: desk ? 40 : 22 }}>
        <div className="flex flex-col gap-2">
          <Word mark={mark.small} height={22} />
          <Cap>22 px, the bars</Cap>
        </div>
        <div className="flex flex-col gap-2">
          <Word mark={mark.small} height={16} />
          <Cap>16 px, the admin</Cap>
        </div>
      </div>
      <div className="flex flex-wrap items-start" style={{ gap: 18 }}>
        {before ? (
          <div className="flex flex-col gap-2">
            <Pixels
              mark={before}
              height={22}
              zoom={desk ? 3 : 1.4}
              {...pixel}
            />
            <Cap>As drawn, 22 px enlarged</Cap>
          </div>
        ) : null}
        <div className="flex flex-col gap-2">
          <Pixels
            mark={mark.small}
            height={22}
            zoom={desk ? 3 : 1.4}
            read={ground === "paper" ? "the bars' size, enlarged" : undefined}
            {...pixel}
          />
          <Cap>{before ? "Finished, 22 px enlarged" : "22 px enlarged"}</Cap>
        </div>
      </div>
    </div>
  );
}

/** The sheet: paper beside the room at a desk, paper over the room on a phone. */
export function WordSheet({
  mark,
  screen,
}: {
  mark: Wordmark;
  screen: ScreenId;
}) {
  const before = mark.id === "finished" ? AS_DRAWN : undefined;
  return (
    <div
      className="flex min-h-screen"
      style={{ flexDirection: screen === "1440" ? "row" : "column" }}
    >
      <Half mark={mark} ground="paper" screen={screen} before={before} />
      <Half mark={mark} ground="room" screen={screen} before={before} />
    </div>
  );
}
