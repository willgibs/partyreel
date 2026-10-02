"use client";

import type { CSSProperties } from "react";

import { Glow } from "@/components/shared/glow";
import { GlowFilter } from "@/components/shared/glow-filter";

import { HeroObject, type TakeId } from "./objects";
import { CinemaRoom } from "./scene";

/**
 * THE SETTLED TOUCH, CLOSE: the object at a desk's size on the cinema ground,
 * at rest and under the pointer, side by side. No real screen can show both
 * at once, which is why this is the one frame on the board that is not a
 * screen: the home frames are, and pointing at the 1440 one lifts the object
 * for real.
 *
 * `--hhs-k: 1` is the desk's drawing of every length (the hero's sheet sets it
 * from the frame's width, and this frame is not a hero).
 */
export function Specimen({
  take,
  slug,
  addresses,
}: {
  take: TakeId;
  slug: string;
  addresses: readonly string[];
}) {
  const cell = (label: string, lifted: boolean) => (
    <div
      data-df-cell
      className="relative flex flex-1 items-center justify-center overflow-hidden"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 h-[520px] w-[680px] -translate-x-1/2 -translate-y-1/2"
      >
        <Glow
          shape="bloom"
          drive="mask"
          vars={{
            "--glw-from-x": "50%",
            "--glw-from-y": "50%",
            "--glw-reach": "56%",
            "--glw-strength": "0.95",
            "--glw-base": "0.34",
            "--glw-blur": "26px",
          }}
        />
      </div>
      <div className="relative z-10">
        <HeroObject
          take={take}
          live={{ slug, addresses, up: true, lifted, still: true }}
        />
      </div>
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
        data-df-specimen
        className="flex h-screen w-full flex-row"
        style={{ "--hhs-k": 1 } as CSSProperties}
      >
        {cell("At rest", false)}
        {cell("Under the pointer", true)}
      </div>
    </CinemaRoom>
  );
}
