"use client";

import { type ReactNode, useEffect, useRef } from "react";

import type { ScreenId } from "../knobs";
import { MiniTabs } from "./browser";
import { type IconId, OnPaper, RingIcon } from "./ring";

/**
 * THE ICON AT ITS SIZES: the 1024 master at its true size (a press kit's
 * file, an app store's tile), then 180 (a phone's home screen file), 32 (the
 * favicon file) and 16 (a tab), each true and the two small ones enlarged
 * pixel for pixel, in the room and on paper, with a tab of each tone at its
 * true size. At a phone the master is drawn at the column's width.
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
    <div className="flex flex-col items-start gap-2.5">
      {children}
      <Cap>{label}</Cap>
    </div>
  );
}

/** The sizes beside the master: the room above, paper below. */
function Sizes({ id, phone }: { id: IconId; phone: boolean }) {
  const gap = phone ? 18 : 26;
  const pad = phone ? "24px 20px" : "40px 44px";
  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div
        className="dark flex flex-1 flex-col bg-background text-foreground"
        style={{ padding: pad, gap }}
      >
        <Cap>In the room</Cap>
        <div className="flex flex-wrap items-end" style={{ gap }}>
          <Sized label="180">
            <RingIcon id={id} size={180} read="the icon at 180 in the room" />
          </Sized>
          <Sized label="32">
            <RingIcon id={id} size={32} />
          </Sized>
          <Sized label="16">
            <RingIcon id={id} size={16} />
          </Sized>
        </div>
        <div className="flex flex-wrap items-end" style={{ gap }}>
          <Sized label="32, enlarged 4×">
            <Pixels id={id} size={32} zoom={4} ground="#09090b" />
          </Sized>
          <Sized label="16, enlarged 8×">
            <Pixels
              id={id}
              size={16}
              zoom={8}
              ground="#09090b"
              read="the favicon at a tab's size, enlarged"
            />
          </Sized>
        </div>
        <MiniTabs icon={id} tone="dark" />
      </div>
      <div
        className="surface-paper flex flex-col bg-background text-foreground"
        style={{ padding: pad, gap }}
      >
        <Cap>On paper</Cap>
        <div className="flex flex-wrap items-end" style={{ gap }}>
          <Sized label="180, on a print's lift">
            <OnPaper size={180}>
              <RingIcon id={id} size={180} read="the icon on paper" />
            </OnPaper>
          </Sized>
          <Sized label="16 on a light tab, 8×">
            <Pixels id={id} size={16} zoom={8} ground="#ffffff" />
          </Sized>
        </div>
        <MiniTabs icon={id} tone="light" />
      </div>
    </div>
  );
}

/** The master and its sizes: 1600 by 1024 at a desk, one column at a phone. */
export function IconSheet({ id, screen }: { id: IconId; screen: ScreenId }) {
  const phone = screen === "375";
  return (
    <div
      className="flex min-h-screen"
      style={{ flexDirection: phone ? "column" : "row" }}
    >
      <div
        className="dark flex shrink-0 items-center justify-center bg-background"
        style={{ width: phone ? "100%" : 1024, padding: phone ? 16 : 0 }}
      >
        <RingIcon
          id={id}
          size={phone ? 343 : 1024}
          read={phone ? "the master, drawn at a phone's width" : "the master at 1024"}
        />
      </div>
      <Sizes id={id} phone={phone} />
    </div>
  );
}
