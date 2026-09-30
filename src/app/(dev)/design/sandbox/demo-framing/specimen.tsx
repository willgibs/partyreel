"use client";

import { type CSSProperties, type ReactNode, useRef } from "react";

import { GlowFilter } from "@/components/shared/glow-filter";
import { usePrefersReducedMotion } from "@/lib/shared/use-prefers-reduced-motion";

import type { TouchId } from "./card";
import { ObjectLamp, useSwell } from "./hero";
import { CinemaRoom, stopLinks, useOffStage } from "./scene";

/**
 * THE TOUCH, CLOSE: the object at a desk's size on the cinema ground, at rest
 * and under the pointer, side by side (or one over the other, for the wide
 * address plate). No real screen can show both at once, which is why this is
 * the one frame on the board that is not a screen: the home frames beside it
 * are, and hovering the 1440 one lifts the card for real.
 *
 * `--hhs-k: 1` is the desk's drawing of every length (the hero's sheet sets it
 * from the frame's width, and this frame is not a hero).
 */
export function Specimen({
  touch,
  lamp,
  stacked,
  object,
}: {
  touch: TouchId;
  lamp: { w: string; h: number };
  /** One over the other, for an object too wide to stand two abreast. */
  stacked?: boolean;
  object: (lifted: boolean) => ReactNode;
}) {
  const root = useRef<HTMLDivElement | null>(null);
  const swell = useRef<HTMLDivElement | null>(null);
  const off = useOffStage(root);
  const reduced = usePrefersReducedMotion();
  useSwell(swell, touch === "lamp" && !reduced && !off);

  const cell = (label: string, lifted: boolean, lit: boolean) => (
    <div
      data-df-cell
      className="relative flex flex-1 items-center justify-center overflow-hidden"
    >
      <div className="absolute top-1/2 left-1/2">
        <ObjectLamp w={lamp.w} h={lamp.h} swell={lit ? swell : null} />
      </div>
      <div className="relative z-10">{object(lifted)}</div>
      <p className="absolute bottom-4 left-5 text-label font-medium text-muted-foreground uppercase">
        {label}
      </p>
    </div>
  );

  return (
    <CinemaRoom>
      <GlowFilter />
      {/* One screen tall, the frame's own: the frame's document gives its
          portal no height for a percentage to resolve against. */}
      <div
        ref={root}
        data-df-specimen
        onClickCapture={stopLinks}
        className={`flex h-screen w-full ${stacked ? "flex-col" : "flex-row"}`}
        style={{ "--hhs-k": 1 } as CSSProperties}
      >
        {cell("At rest", false, touch === "lamp")}
        {cell("Under the pointer", true, false)}
      </div>
    </CinemaRoom>
  );
}
