"use client";

import { type CSSProperties, useState } from "react";

import { GALLERY_ITEMS } from "@/app/(dev)/design/sandbox/gallery-fixtures";
import { MasonryColumns } from "@/components/shared/masonry";
import { cn } from "@/lib/utils";

import { Canvas, Ground } from "./canvas";

export type ControlOption = "three-step" | "slider" | "five-step" | "pinch";

const BTN =
  "rounded-full px-3 py-1 text-xs font-medium transition-colors active:scale-95 motion-reduce:active:scale-100";
const BTN_ON = "bg-foreground text-background";
const BTN_OFF = "bg-muted text-muted-foreground hover:text-foreground";

/** Today, reproduced by hand rather than the real `ViewMenu`: its radix
 *  dropdown portals to `document.body`, which inside a portalled frame is the
 *  BOARD's body and not the frame's (the media-viewer board's own landmine). */
function ThreeStep({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const steps: [number, string][] = [
    [180, "Small"],
    [240, "Medium"],
    [300, "Large"],
  ];
  return (
    <div role="group" aria-label="Tile size" className="flex gap-1.5">
      {steps.map(([px, label]) => (
        <button
          key={px}
          type="button"
          aria-pressed={value === px}
          onClick={() => onChange(px)}
          className={cn(BTN, value === px ? BTN_ON : BTN_OFF)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function FiveStep({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const steps: [number, string][] = [
    [160, "XS"],
    [200, "S"],
    [240, "M"],
    [280, "L"],
    [320, "XL"],
  ];
  return (
    <div role="group" aria-label="Tile size" className="flex gap-1.5">
      {steps.map(([px, label]) => (
        <button
          key={px}
          type="button"
          aria-pressed={value === px}
          onClick={() => onChange(px)}
          className={cn(BTN, value === px ? BTN_ON : BTN_OFF)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function Slider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="range"
        aria-label="Tile size"
        min={160}
        max={340}
        step={4}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-40 cursor-pointer accent-foreground"
      />
      <span className="w-12 text-xs tabular-nums text-muted-foreground">
        {value}px
      </span>
    </div>
  );
}

const PINCH_MIN = 160;
const PINCH_MAX = 340;

/**
 * PINCH TO RESIZE (the Photos app's own gesture, NOT WIRED): two fingers on a
 * touch album, or — the one a mouse-and-trackpad review can actually press —
 * a trackpad pinch, which Chrome and Safari both already synthesize as a
 * `wheel` event with `ctrlKey: true`. No library, no touch-event polyfill:
 * the real gesture a laptop trackpad sends is read directly.
 */
function Pinch({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  // A plain closure over `value`, never a ref: this re-creates on every
  // render, which is exactly what a render-time read of the current size
  // needs (writing to a ref during render is what React's own rules refuse).
  const onWheel = (e: React.WheelEvent) => {
    if (!e.ctrlKey) return; // a plain scroll, not a pinch
    e.preventDefault();
    const next = Math.min(PINCH_MAX, Math.max(PINCH_MIN, value - e.deltaY * 2));
    onChange(Math.round(next));
  };
  return (
    <div
      onWheel={onWheel}
      className="flex cursor-zoom-in items-center gap-2 rounded-full border border-dashed border-border px-3 py-1 text-xs text-muted-foreground select-none"
      title="Pinch on a trackpad or a touch album to resize"
    >
      <span aria-hidden>⤡⤢</span>
      Pinch to resize
      <span className="tabular-nums text-foreground">{value}px</span>
    </div>
  );
}

/** The one interactive piece of this board: dragging, pressing or pinching
 *  here really resizes the real `MasonryColumns` under it. */
export function ControlShowcase({ option }: { option: ControlOption }) {
  const [value, setValue] = useState(240);
  return (
    <Ground>
      <div className="mb-4 flex justify-end">
        {option === "three-step" && <ThreeStep value={value} onChange={setValue} />}
        {option === "slider" && <Slider value={value} onChange={setValue} />}
        {option === "five-step" && <FiveStep value={value} onChange={setValue} />}
        {option === "pinch" && <Pinch value={value} onChange={setValue} />}
      </div>
      <div style={{ "--album-column": `${value}px` } as CSSProperties}>
        <div className="pointer-events-none" data-lab-specimen>
          <MasonryColumns items={GALLERY_ITEMS} />
        </div>
      </div>
    </Ground>
  );
}

export function controlPreview(option: ControlOption) {
  return (
    <Canvas
      id={`control-${option}`}
      w={1440}
      h={760}
      title={`${option}, 1440px`}
      caption="Press, drag or pinch: the album under it really resizes."
    >
      <ControlShowcase option={option} />
    </Canvas>
  );
}
