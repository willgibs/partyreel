"use client";

import "./lit.css";

import { useState, type CSSProperties } from "react";

import { formatCount } from "@/lib/format/count";
import { useDoorHues, useLampLit } from "@/lib/guest/door-light";
import { cn } from "@/lib/utils";

/**
 * THE DOOR, LIT: its own pieces (`identity-door` r2, Will's `look=lit`, overruling `peek`). What
 * the board drew in `sandbox/identity-door/lit.tsx` (`LitProvider`, `Lamp`, `Ticker`) and its
 * stylesheet, carried into production: the scrim behind every sheet of the door's family, the lamp
 * on the sheet's free edge coloured from the album's three newest photographs, and the live count.
 * The welcome's hero (the event's name large beside the host's face) is drawn in the welcome step
 * itself (`entry-modal.tsx`), which is the only screen that has one.
 */

/**
 * THE SCRIM BEHIND THE DOOR AND ITS SHEETS: the lightbox's own ground (`glass-behind`, his
 * `behind=album`) at a gentler dim, a heavy blur, the album's colour lifted a touch, and the room
 * darkened enough for the lamp to be seen and no further (at a full half brightness the album
 * vanished in dark mode, and the album is the reward). The panel stays opaque, so the blur and the
 * overlay live here and nowhere else (`floating-layer.ts`). Where the browser cannot blur behind,
 * the 30% black alone.
 */
export const DOOR_SCRIM =
  "bg-black/30 supports-backdrop-filter:backdrop-blur-[28px] supports-backdrop-filter:backdrop-brightness-72 supports-backdrop-filter:backdrop-saturate-120";

export type LampStrength = "base" | "bloom";

/**
 * THE LAMP: three of the album's hues as soft light on a surface's free edge, a bright line where
 * the edge catches them, and a mask that spends the light before it reaches the words. `free` is a
 * sheet's (its top on a phone, its left at a desk, switched in CSS at the Sheet's own breakpoint),
 * `card` is her menu's card. It drifts on the lamps' own clock and holds still under reduced
 * motion; the code screen strengthens it and "You're in" blooms it (`lit.css`).
 *
 * Mounting one registers it (`useLampLit`), which is what lets the album spend a sample on it.
 */
export function DoorLamp({
  edge,
  strength = "base",
}: {
  edge: "free" | "card";
  strength?: LampStrength;
}) {
  useLampLit();
  const { hues, sampled } = useDoorHues();
  return (
    <div
      data-door-lamp={strength}
      data-door-hues={hues.slice(0, 3).map(Math.round).join(",")}
      data-door-sampled={sampled ? "" : undefined}
      aria-hidden
      className={cn(
        "door-lamp",
        edge === "free" ? "door-lamp-free" : "door-lamp-card",
        strength === "bloom" && "door-lamp-bloom",
      )}
      style={
        {
          "--lit-h1": hues[0],
          "--lit-h2": hues[1],
          "--lit-h3": hues[2],
        } as CSSProperties
      }
    >
      <span className="door-lamp-blob door-lamp-b1" />
      <span className="door-lamp-blob door-lamp-b2" />
      <span className="door-lamp-blob door-lamp-b3" />
      <span className="door-lamp-edge" />
    </div>
  );
}

/**
 * THE COUNT, LIVE: the album's own number, ticking once per change as photographs land behind the
 * door (the page's live count feeds it, so the door says exactly what the header says). The first
 * paint never ticks (there is nothing to travel from), and reduced motion lands on the new number
 * without the travel. The number leaving is hidden from assistive tech; the one arriving is the
 * sentence's.
 */
export function LiveCount({
  value,
  format = formatCount,
}: {
  value: number;
  format?: (n: number) => string;
}) {
  // The sanctioned adjust-state-during-render pattern: the previous number is remembered at the
  // render that changed it, so the tick needs no effect and no ref read in render.
  const [shown, setShown] = useState<{
    value: number;
    previous: number | null;
  }>({ value, previous: null });
  if (shown.value !== value) setShown({ value, previous: shown.value });
  const previous = shown.value === value ? shown.previous : null;
  return (
    <span data-door-count className="door-count tabular-nums">
      {previous !== null && (
        <span
          key={`out-${previous}-${value}`}
          aria-hidden
          className="door-count-out"
        >
          {format(previous)}
        </span>
      )}
      <span
        key={`in-${value}`}
        data-door-count-settled
        className={previous !== null ? "door-count-in" : undefined}
      >
        {format(value)}
      </span>
    </span>
  );
}
