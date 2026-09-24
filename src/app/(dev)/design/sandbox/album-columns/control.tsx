"use client";

import { type CSSProperties, useState } from "react";

import { GALLERY_ITEMS } from "@/app/(dev)/design/sandbox/gallery-fixtures";
import { MasonryColumns } from "@/components/shared/masonry";
import { cn } from "@/lib/utils";

import { Canvas, Ground } from "./canvas";

export type ControlOption = "three-step" | "slider" | "five-step";

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

/** The one interactive piece of this board: dragging or pressing here really
 *  resizes the real `MasonryColumns` under it. */
export function ControlShowcase({ option }: { option: ControlOption }) {
  const [value, setValue] = useState(240);
  return (
    <Ground>
      <div className="mb-4 flex justify-end">
        {option === "three-step" && <ThreeStep value={value} onChange={setValue} />}
        {option === "slider" && <Slider value={value} onChange={setValue} />}
        {option === "five-step" && <FiveStep value={value} onChange={setValue} />}
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
      caption="Press or drag: the album under it really resizes."
    >
      <ControlShowcase option={option} />
    </Canvas>
  );
}
