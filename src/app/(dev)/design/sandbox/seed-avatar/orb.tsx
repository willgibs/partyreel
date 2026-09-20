import type { CSSProperties } from "react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

import { background, css, type Look, orbFor, type PaletteMode } from "./gradient";

/**
 * THE ORB, DRAWN ON THE REAL `Avatar`.
 *
 * ★ NOT ONE HOOK IN THIS FILE, AND NO `"use client"`. That is the whole point of
 * the generator: `background()` is a pure function of a string, so the orb is a
 * `style` attribute a SERVER component can write. The guest list, the user menu and
 * the profile's identity row are all server-rendered today, and an avatar that
 * needed a client island would cost every one of them a hydration boundary and a
 * frame of grey. (`Avatar` itself carries the directive because radix needs it; a
 * server parent rendering a client child is free, a server parent becoming one is
 * not.) The one option that moves, `motion`, moves in CSS keyframes rather than in
 * JavaScript, and the drift is declared beside the board.
 *
 * ★ WHAT THE WIRING LANE PROMOTES. Not these components: `AvatarFallback` in
 * `src/components/ui/avatar.tsx` grows a `seed` prop and this becomes its body.
 * Every surface then gets the orb without knowing anything changed, which is why
 * every option below is drawn on the REAL `Avatar` rather than a lookalike.
 */

/** The three sizes the `Avatar` contract names: 24, 32 and 40px. */
export type OrbSize = "sm" | "default" | "lg";

/** Whether the initial stays over the orb. The `letter` decision. */
export type LetterMode = "always" | "never" | "large";

/** What the orb does once a real photograph exists. The `after-upload` decision. */
export type AfterUpload = "replace" | "rim" | "under";

/** How much of a crowd is coloured. The `the-crowd` decision. */
export type CrowdMode = "full" | "quiet" | "soft";

export type OrbOptions = {
  look?: Look;
  palette?: PaletteMode;
  letter?: LetterMode;
  after?: AfterUpload;
  /** A slow drift, when the `motion` decision asks for one. */
  drift?: "none" | "always" | "hover";
  /** Chroma held back, for the `soft` crowd: the same hue, a quieter voice. */
  muted?: boolean;
};

/** The initial, exactly as `user-menu.tsx`'s exported `initial()` computes it. */
export const initialOf = (name: string | null): string =>
  name?.trim() ? name.trim().charAt(0).toUpperCase() : "?";

/**
 * The paint for one seed: a background and the ink its letter is drawn in.
 *
 * `muted` is the one modifier a surface may apply, and it touches CHROMA only. The
 * lightness was fitted against three contrast floors (gradient.ts, `fitBody`), so
 * anything that moved it would move a legibility guarantee with it.
 */
export function paintFor(
  seed: string,
  { look = "orb", palette = "wheel", muted = false }: OrbOptions = {},
): { style: CSSProperties; ink: string } {
  const orb = orbFor(seed, palette);
  const quiet = muted
    ? {
        ...orb,
        body: { ...orb.body, c: orb.body.c * 0.42 },
        lit: { ...orb.lit, c: orb.lit.c * 0.42 },
        deep: { ...orb.deep, c: orb.deep.c * 0.42 },
      }
    : orb;
  const value = background(quiet, look);
  return {
    style: value.startsWith("oklch(")
      ? { background: value }
      : { backgroundImage: value },
    ink: css(orb.ink),
  };
}

/** Does the initial show at this size, under this option? */
const lettered = (mode: LetterMode, size: OrbSize): boolean =>
  mode === "always" || (mode === "large" && size === "lg");

/** The drift class, defined by `DRIFT_CSS` below and honoured by reduced motion. */
const driftClass = (drift: OrbOptions["drift"]): string => {
  if (drift === "always") return "seed-drift";
  if (drift === "hover") return "seed-drift-hover";
  return "";
};

/**
 * One avatar: a photograph if there is one, an orb if there is not.
 *
 * The three `after` options differ only in WHERE the orb is painted, which is the
 * whole of that decision:
 *  - `replace`: on the fallback, which radix unmounts the moment the photo decodes.
 *  - `rim`: on the root, with the photograph inset by two pixels, so the colour
 *    survives as a rim around a face.
 *  - `under`: on the root, with the photograph over it at full size, so the orb is
 *    what a reader sees while a presigned URL is still in flight.
 */
export function SeedAvatar({
  seed,
  name,
  photo,
  size = "default",
  className,
  options = {},
}: {
  seed: string;
  name: string | null;
  photo?: string | null;
  size?: OrbSize;
  className?: string;
  options?: OrbOptions;
}) {
  const { letter = "always", after = "replace", drift } = options;
  const { style, ink } = paintFor(seed, options);
  const onRoot = Boolean(photo) && after !== "replace";
  const text = size === "sm" ? "text-[10px]" : size === "lg" ? "text-base" : "text-sm";

  return (
    <Avatar
      size={size}
      className={cn(onRoot && driftClass(drift), after === "rim" && photo && "p-[2px]", className)}
      style={onRoot ? style : undefined}
    >
      {photo ? <AvatarImage src={photo} alt="" /> : null}
      <AvatarFallback
        className={cn(
          "font-medium",
          text,
          !onRoot && driftClass(drift),
          // The orb replaces `bg-muted`; the letter replaces `text-muted-foreground`.
          onRoot ? "bg-transparent" : "",
        )}
        style={onRoot ? { color: ink } : { ...style, color: ink }}
      >
        {lettered(letter, size) ? initialOf(name) : null}
      </AvatarFallback>
    </Avatar>
  );
}

/**
 * The orb at a size the `Avatar` contract does not name: the account page's 64px
 * control and the profile's own 80px identity row, both of which draw their own
 * disc today rather than an `Avatar`.
 */
export function BigOrb({
  seed,
  name,
  photo,
  px,
  options = {},
  className,
}: {
  seed: string;
  name: string | null;
  photo?: string | null;
  px: 64 | 80;
  options?: OrbOptions;
  className?: string;
}) {
  const { letter = "always", after = "replace", drift } = options;
  const { style, ink } = paintFor(seed, options);
  const show = letter !== "never";
  if (photo && after === "replace") {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- a fixture still, cropped exactly as the shipped surfaces crop a real avatar
      <img
        src={photo}
        alt=""
        style={{ width: px, height: px }}
        className={cn("rounded-full border border-border object-cover", className)}
      />
    );
  }
  return (
    <div
      style={{ ...style, width: px, height: px, color: ink }}
      className={cn(
        "relative box-border flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-border font-medium select-none",
        px === 80 ? "text-2xl" : "text-lg",
        driftClass(drift),
        className,
      )}
    >
      {photo ? (
        // ★ THE BUG (rulings.md, the sixth batch), part one: a bare
        // width/height equal to `px` measured the BORDER-BOX, so the
        // photograph (padding-box sized) overran it by the border's own
        // width on every side — an 80px photograph inside a border-box-80,
        // 1px-bordered parent left a 78px padding box for it to sit in.
        // ★ PART TWO, measured live rather than assumed: `inset-0` ALONE
        // does not stretch an absolutely positioned `<img>` (a replaced
        // element) to fill it — Chromium sizes it from its own intrinsic
        // ratio instead, same as it would with no inset at all. `size-full`
        // is what actually forces the fill; every other `absolute inset-0`
        // image in this codebase already pairs the two (event-card.tsx,
        // media-grid.tsx, and more, `git grep "absolute inset-0 size-full"`).
        // The rim's explicit `calc` mirrors what `inset-[2px]` implies on
        // all four sides, so the two never disagree over the same box.
        // eslint-disable-next-line @next/next/no-img-element -- as above
        <img
          src={photo}
          alt=""
          className={cn(
            "absolute rounded-full object-cover",
            after === "rim"
              ? "inset-[2px] size-[calc(100%-4px)]"
              : "inset-0 size-full",
          )}
        />
      ) : (
        show && initialOf(name)
      )}
    </div>
  );
}

/**
 * THE DRIFT, IN CSS AND NOTHING ELSE.
 *
 * hashvatar's `animated` runs a `requestAnimationFrame` loop that rotates six
 * polygon layers at 0.45 to 0.65 rad/s, drifts each by up to 18% of the avatar and
 * pulses their scale by 15%, forever. Ours moves the light source and nothing else,
 * at a pace slow enough to be noticed only if you are looking at one avatar (which
 * is exactly what the `motion` decision is asking about), and it is a compositor
 * animation on `background-position` rather than a repaint.
 *
 * ★ REDUCED MOTION STOPS IT DEAD, not slows it: the media query is inside the
 * declaration, so nothing about the board's own replay can switch it back on.
 */
export const DRIFT_CSS = `
@keyframes seed-drift {
  0%, 100% { background-position: 0% 0%; }
  50% { background-position: 60% 40%; }
}
.seed-drift, .seed-drift-hover { background-size: 148% 148%; }
.seed-drift { animation: seed-drift 14s ease-in-out infinite; }
.seed-drift-hover { transition: background-position 420ms var(--ease-emphasis, ease-out); }
.group\\/face:hover .seed-drift-hover, .seed-drift-hover:hover { background-position: 60% 40%; }
@media (prefers-reduced-motion: reduce) {
  .seed-drift { animation: none; }
  .seed-drift-hover { transition: none; }
}
`;
