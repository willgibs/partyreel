import Image from "next/image";
import { type CSSProperties } from "react";

import { marketingImage } from "@/lib/constants/marketing-media";
import { cn } from "@/lib/utils";

/**
 * WHAT THE ALBUM-HERO BOARD READS (round two, 2026-09-14, as the home-hero
 * board's own atoms; shrunk onto the lab kit at the Library x Lab migration
 * wave, 2026-09-15; cut to its atoms at round six, 2026-09-16).
 *
 * ★ THIS FILE OUTLIVED ITS BOARD. The home-hero board retired at its wiring
 * round (2026-09-17) when Will picked the stack with the code above and the
 * composition shipped as `src/components/marketing/sections/home/cinema-hero.tsx`;
 * everything else under this directory went with it (git holds it at
 * `85aa65d9`). This file stayed because the ALBUM-HERO board imports it:
 * `FRAMES`, `CANVAS`, `GUTTER`, `LADDER`, `Mode` and `Photo` are a published
 * surface it reads (`docs/tracks/album-hero.md`), so shrink them in agreement
 * with that track, never alone. It should move into that board's own directory
 * the next time the two lanes are open together; today they are not, so it
 * stays where every import already points. What went with the hero was `RULED`
 * (the ruled lockup copy, read straight from `@/lib/constants/marketing-voice`
 * in production now) and `DemoQr` (the hero owns its own).
 *
 * What the compositions here hold fixed:
 *  - the media at 100% (bible 1): no darkening layer over a photograph;
 *  - the h1 at paint and never gated (bible 13): no data-mkt-cut, no
 *    data-mkt-reveal, no .mkt-line on an h1. marketing-h1-policy scans the
 *    marketing tree and not the lab, so on a board it is discipline rather
 *    than a test, and a hero that fails it here fails it at wiring;
 *  - the ladder (bible 5): LADDER below, resolved per canvas;
 *  - every animation inside `prefers-reduced-motion: no-preference` with a
 *    designed rest state (bible 14), and the loop paused on a hidden tab
 *    through the stage's data-paused.
 *
 * Board mechanics a composition here must respect:
 *  - `sizes` on next/image is CANVAS-relative ("1440px" / "375px"), never a
 *    vw value: the stage may be zoomed, so a vw picks the wrong candidate;
 *  - `eager` is production truth for anything in the first screen;
 *  - Replay is a REMOUNT (the stage key), so entrances are CSS with
 *    `animation-fill-mode: both` and state resets for free;
 *  - geometry for POSITION comes from CANVAS, never from getBoundingClientRect,
 *    which lies under zoom; a zoom-invariant RATIO off a rect is safe;
 *  - tailwind-merge drops a `leading-*` that precedes a `text-{size}` in the
 *    same cn() (a size utility may carry a line-height), and LADDER's classes
 *    are size classes: put the leading AFTER the ladder class, always;
 *  - the lab's pause source is the kit's useTabHidden (the stage sets
 *    data-paused from it; a JS loop reads the same attribute); production swaps
 *    in useAmbientPause, which also pauses off-screen;
 *  - keyframes live in a composition's OWN sheet with its prefix;
 *    keyframe-uniqueness.test.ts reads every sheet under the lab;
 *  - the media manifest is the only source of paths (bible 18).
 */

/** Mode, CANVAS and useTabHidden are the kit's; re-exported so a concept file
 *  keeps one import and the album-hero lane's imports keep resolving. */
export { CANVAS, useTabHidden, type Mode } from "@/components/lab";
import type { Mode } from "@/components/lab";

/** The ladder's two cinema steps, RESOLVED per canvas (bible 5): PageHero's
 *  ramps key off the real viewport, never the stage, so a board that shows a
 *  1440 canvas and a 375 canvas on one page resolves each end by hand.
 *  `xl` is text-5xl..text-8xl, `lg` is text-4xl..text-7xl. Retune PageHero's
 *  HERO_SCALE and retune these, or the board stops telling the truth. */
export const LADDER = {
  xl: { desktop: "text-8xl", phone: "text-5xl" },
  lg: { desktop: "text-7xl", phone: "text-4xl text-balance" },
} as const;

/** The site's own gutter at each canvas: Container is max-w-7xl centred with
 *  lg:px-8, so the page column starts at 112px at 1440 and at 16px at 375. */
export const GUTTER = {
  desktop: { left: "pl-28", x: "px-28", inset: 112 },
  phone: { left: "pl-4", x: "px-4", inset: 16 },
} as const;

/** The stand-in frames: the twelve manifest images, sequenced for contrast.
 *  Eleven are landscape and none is wider than 900px; Will's 34-square set
 *  (ASSETS row 2) replaces them by id. The board's stand-ins section renders
 *  this list at the size the corridor reads it, so the ask is visible. */
export const FRAMES = [
  "wedding-golden",
  "party-dj",
  "reception-table",
  "festival-lights",
  "wedding-petals",
  "concert-confetti",
  "wedding-toast",
  "festival-crowd",
  "wedding-rings",
  "reception-hall",
  "party-balloons",
  "wedding-arch",
] as const;

export function frame(i: number) {
  return marketingImage(
    FRAMES[((i % FRAMES.length) + FRAMES.length) % FRAMES.length],
  );
}

/** One photograph at FULL luminance. No scrim prop, and there never will be:
 *  a concept that needs one has not solved the composition. Eager by default,
 *  which is production truth for a hero; pass eager={false} only for a frame
 *  that is genuinely below the viewport. Spread data attributes for your own
 *  sheet's hooks through the rest props. */
export function Photo({
  index,
  className,
  sizes = "1440px",
  eager = true,
  style,
  ...rest
}: Omit<React.ComponentProps<"div">, "children"> & {
  index: number;
  sizes?: string;
  eager?: boolean;
  style?: CSSProperties;
}) {
  const img = frame(index);
  return (
    <div
      {...rest}
      className={cn("relative overflow-hidden bg-white/5", className)}
      style={style}
    >
      <Image
        src={img.src}
        alt=""
        fill
        sizes={sizes}
        loading={eager ? "eager" : "lazy"}
        className="object-cover"
      />
    </div>
  );
}
