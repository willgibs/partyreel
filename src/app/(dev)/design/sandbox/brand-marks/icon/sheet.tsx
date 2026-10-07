"use client";

import { type ReactNode, useEffect, useRef } from "react";

import type { ScreenId } from "../knobs";
import { type IconId, OnPaper, RingIcon } from "./ring";

/**
 * THE ICON ITSELF, BEFORE THE PLACES IT LIVES: in the room at its home-screen
 * sizes (a 1024 master drawn at 280, then 180, 60 and 29) and in its tinted
 * appearance; the favicon's two sizes true and enlarged pixel for pixel; and
 * its paper form, the dark tile on a print's lift, since on paper the tile is
 * the dark its light needs.
 */

function Cap({ children }: { children: string }) {
  return (
    <span className="text-label font-semibold text-muted-foreground uppercase tabular-nums">
      {children}
    </span>
  );
}

/**
 * A SIZE ENLARGED PIXEL FOR PIXEL: the icon drawn at its true size on a
 * device pixel grid of 2, copied into a canvas and shown larger with no
 * smoothing, so a reader sees the pixels a tab lights.
 */
function Pixels({
  id,
  size,
  zoom,
  ground,
  read,
}: {
  id: IconId;
  size: number;
  zoom: number;
  ground: string;
  read?: string;
}) {
  const source = useRef<HTMLSpanElement | null>(null);
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const dpr = 2;
  useEffect(() => {
    const svg = source.current?.querySelector("svg");
    const c = canvas.current;
    const ctx = c?.getContext("2d");
    if (!svg || !c || !ctx) return;
    const markup = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    let alive = true;
    img.onload = () => {
      if (!alive) return;
      ctx.fillStyle = ground;
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, size * dpr, size * dpr);
    };
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
    return () => {
      alive = false;
    };
  }, [id, size, ground]);
  return (
    <span className="flex flex-col items-start gap-2">
      <span ref={source} hidden>
        <RingIcon id={id} size={size * dpr} optics={size} />
      </span>
      <canvas
        ref={canvas}
        width={size * dpr}
        height={size * dpr}
        data-bm-read={read}
        data-bm-says={read ? `${size}px enlarged ${zoom}×` : undefined}
        style={{
          width: size * zoom,
          height: size * zoom,
          imageRendering: "pixelated",
          display: "block",
        }}
      />
    </span>
  );
}

function Sized({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-3">
      {children}
      <Cap>{label}</Cap>
    </div>
  );
}

export function IconSheet({ id, screen }: { id: IconId; screen: ScreenId }) {
  const desk = screen === "1440";
  const hero = desk ? 280 : 200;
  return (
    <div
      className="flex min-h-screen"
      style={{ flexDirection: desk ? "row" : "column" }}
    >
      <div
        className="dark flex flex-col bg-background text-foreground"
        style={{
          flex: desk ? 1.25 : undefined,
          padding: desk ? "48px 56px" : "28px 20px",
          gap: desk ? 36 : 24,
        }}
      >
        <Cap>In the room</Cap>
        <div
          className="flex flex-wrap items-end"
          style={{ gap: desk ? 34 : 18 }}
        >
          <Sized label="1024, drawn at 280">
            <RingIcon id={id} size={hero} read="the icon large in the room" />
          </Sized>
          <Sized label="180">
            <RingIcon id={id} size={desk ? 180 : 120} optics={180} />
          </Sized>
          <Sized label="60, a home screen">
            <RingIcon
              id={id}
              size={60}
              read="the icon at a home screen's size"
            />
          </Sized>
          <Sized label="29">
            <RingIcon id={id} size={29} />
          </Sized>
        </div>
        <div
          className="flex flex-wrap items-end"
          style={{ gap: desk ? 34 : 18 }}
        >
          <Sized label="Tinted, 180">
            <RingIcon
              id={id}
              size={desk ? 180 : 120}
              optics={180}
              appearance="tinted"
            />
          </Sized>
          <Sized label="32, the favicon">
            <Pixels id={id} size={32} zoom={desk ? 4 : 3} ground="#09090b" />
          </Sized>
          <Sized label="16, a tab">
            <Pixels
              id={id}
              size={16}
              zoom={desk ? 8 : 6}
              ground="#09090b"
              read="the favicon at a tab's size, enlarged"
            />
          </Sized>
        </div>
      </div>
      <div
        className="surface-paper flex flex-col bg-background text-foreground"
        style={{
          flex: 1,
          padding: desk ? "48px 56px" : "28px 20px",
          gap: desk ? 36 : 24,
        }}
      >
        <Cap>On paper</Cap>
        <Sized label="Its dark tile, on a print's lift">
          <OnPaper size={hero}>
            <RingIcon
              id={id}
              size={desk ? 220 : 160}
              optics={220}
              read="the icon on paper"
            />
          </OnPaper>
        </Sized>
        <div
          className="flex flex-wrap items-end"
          style={{ gap: desk ? 34 : 18 }}
        >
          <Sized label="60 on paper">
            <OnPaper size={60}>
              <RingIcon id={id} size={60} />
            </OnPaper>
          </Sized>
          <Sized label="16 on a light tab">
            <Pixels id={id} size={16} zoom={desk ? 8 : 6} ground="#ffffff" />
          </Sized>
        </div>
      </div>
    </div>
  );
}
