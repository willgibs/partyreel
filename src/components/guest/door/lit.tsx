"use client";

import "./lit.css";

import { useState, type CSSProperties, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { formatCount } from "@/lib/format/count";
import { useDoorHues, useLampLit } from "@/lib/guest/door-light";
import { cn } from "@/lib/utils";

/**
 * THE DOOR, LIT: its own pieces (`identity-door` r2, Will's `look=lit`, overruling `peek`; r3's
 * `icons=lit` and `beat=lit`). The scrim behind every sheet of the door's family, the lamp on the
 * sheet's free edge coloured from the album's newest photographs, the live count, and the album's
 * light carried off the edge into the words: a pool of it behind each promise, the small glyphs in
 * it, and the beat's check blooming in it. The welcome's hero (the event's name large beside the
 * host's face) is drawn in the welcome step itself (`entry-modal.tsx`), the only screen with one.
 *
 * ★ ONE LIGHT, ONE COLOUR: every lit piece reads the same three hues (`useDoorHues`, the album's
 * sample or the house five), so a pool can never disagree with the lamp above it.
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
 * The album's three hues as the custom properties every lit rule reads (`lit.css`'s
 * `--lit-h1..3`), for a lit surface that is not one of the pieces below (the unlock button's fill).
 */
export function useDoorLitVars(): CSSProperties {
  const { hues } = useDoorHues();
  return {
    "--lit-h1": hues[0],
    "--lit-h2": hues[1],
    "--lit-h3": hues[2],
  } as CSSProperties;
}

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
  const vars = useDoorLitVars();
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
      style={vars}
    >
      <span className="door-lamp-blob door-lamp-b1" />
      <span className="door-lamp-blob door-lamp-b2" />
      <span className="door-lamp-blob door-lamp-b3" />
      <span className="door-lamp-edge" />
    </div>
  );
}

/** Which of the lamp's three hues lights a piece (a row of pools takes them in turn). */
export type LitHue = 1 | 2 | 3;

/**
 * A POOL OF THE ALBUM'S LIGHT behind a promise's glyph (`identity-door` r3, Will's `icons=lit`):
 * a round lit by one of the lamp's three hues, the glyph on it in ink. The pool is light, not
 * paint: the lamp's own colour at the lamp's own register (`lit.css`), so a row of them reads as
 * the edge's light falling on the words below it, and the glyph's contrast is the ink's, never the
 * hue's. For DECORATIVE glyphs only (the welcome's promises): a control keeps its monochrome glyph
 * (the carried call `controls-stay`: the chevron, the X, the eye, Google, the upload's buttons, her
 * menu's rows).
 */
export function DoorPool({
  hue,
  children,
}: {
  hue: LitHue;
  children: ReactNode;
}) {
  const { hues } = useDoorHues();
  return (
    <span
      data-door-pool={hue}
      aria-hidden
      className="door-pool relative flex size-9 shrink-0 items-center justify-center rounded-full text-foreground [&>svg]:size-4.5"
      style={{ "--pool-h": hues[hue - 1] } as CSSProperties}
    >
      {children}
    </span>
  );
}

/**
 * A SMALL GLYPH INSIDE A LINE, IN THE LAMP'S COLOUR (`icons=lit`: "the small glyphs take the same
 * light"): the Lock beside "Almost in", the email row's envelope. Dark enough on paper and light
 * enough in the dark room to hold a graphic's 3:1 (`lit.css`).
 */
export function DoorGlyph({
  icon: Icon,
  hue,
  className,
}: {
  icon: LucideIcon;
  hue: LitHue;
  className?: string;
}) {
  const { hues } = useDoorHues();
  return (
    <Icon
      data-door-glyph={hue}
      aria-hidden
      className={cn("door-glyph shrink-0", className)}
      style={{ "--glyph-h": hues[hue - 1] } as CSSProperties}
    />
  );
}

/**
 * The check the beats draw: the success-check recipe's own path (transitions.dev
 * `success-check`), cropped to its middle by each mark's viewBox so it fills a mark at any size.
 */
const CHECK_PATH = "M17.2803 24.9602L21.7603 29.7602L30.7203 20.1602";

/**
 * THE BEAT'S CHECK, IN THE ALBUM'S LIGHT (`identity-door` r3, Will's `beat=lit`: "the check
 * blooms in the album's colour"). The success green swapped for the lamp's three hues in one
 * round, the check drawn in ink on paper and white in the dark room. `mark` is "You're in"'s;
 * `sent` sits beside "Sent" at the head of the keep.
 *
 * ★ IT ARRIVES AS A SUCCESS CHECK (his note, transitions.dev's `success-check` the reference): it
 * fades in, turns upright, sharpens out of a blur and settles with a bob while its stroke draws
 * (`lit.css`). The motion is the element's own animation, so it plays wherever the mark appears,
 * and its resting style is the still frame reduced motion shows.
 */
export function DoorCheck({ size }: { size: "mark" | "sent" }) {
  const vars = useDoorLitVars();
  return (
    <span
      data-door-check={size}
      aria-hidden
      className={cn(
        "door-check door-bloom relative flex shrink-0 items-center justify-center rounded-full",
        size === "mark" ? "size-14" : "size-9",
      )}
      style={vars}
    >
      <svg
        viewBox="12 12 24 24"
        fill="none"
        className={cn("relative", size === "mark" ? "size-7" : "size-5")}
      >
        <path
          d={CHECK_PATH}
          stroke="currentColor"
          strokeWidth={size === "mark" ? 2.6 : 3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

/**
 * The check alone, drawing itself, for inside the unlock button (the password's beat: the button
 * fills with the album's light and says "You're in"). No disc: the button is the light.
 */
export function DoorCheckStroke({ className }: { className?: string }) {
  return (
    <svg
      data-door-check="stroke"
      viewBox="12 12 24 24"
      fill="none"
      aria-hidden
      className={cn("door-check-stroke shrink-0", className)}
    >
      <path
        d={CHECK_PATH}
        stroke="currentColor"
        strokeWidth={3.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
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
