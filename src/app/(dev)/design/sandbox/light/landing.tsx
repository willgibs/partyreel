"use client";

import { type Mode } from "@/components/lab";
import { CinemaClose } from "@/components/marketing/sections/home/cinema-close";
import {
  SectionLight,
  type SectionLightPlacement,
} from "@/components/marketing/system/section-light";
import { cn } from "@/lib/utils";

import { StageOnly, TileOnly } from "./fit";
import { SectionCrop } from "./shared";

/**
 * WHERE THE AURORA SITS (step one of round eight).
 *
 * ★ IT OPENS THE WALK BECAUSE THE HOME PAGE IS WAITING ON IT. Will kept the
 * field at round seven ("Approved on the Aurora"), so the question that was
 * staged behind that card is simply the next thing the wiring needs: the
 * `aurora-wiring` lane shipped `SectionLight` with all four placements as prop
 * values and added no call site, because which one the home page's two
 * sections take is this answer.
 *
 * ★ IT IS DRAWN WITH THE COMPONENT THAT SHIPS, NOT WITH THE BOARD'S OWN. Until
 * round eight this step assembled the field from the board's composer (two
 * seams, a register table, a clock of its own). `SectionLight` landed in
 * production mid-round from those same numbers, so the composer is deleted and
 * what Will judges here is exactly what a call site will mount: the accent
 * register, 42 percent bands, the transform drive, the 24 second clock, and no
 * grain (docs/ASSETS.md row 15 still asks for the tile; the board's stand-in
 * left with the composer, because a dither only the lab wears is a lie about
 * what ships).
 *
 * ★ THE FOOTER IS NOT IN QUESTION UNDER ANY OF THESE, which is the confusion
 * this step was first written to end (round five: "am I being asked what aurora
 * placement within the footer? Or what aurora replacement looks better in
 * general?"). The footer keeps its own glow under every option; what moves is
 * where a section with no photographs in it carries its light.
 *
 * ★ THE SECTION IS DRAWN WHOLE, AT ITS OWN HEIGHT. The field's bands are 42
 * percent of the SECTION's height at each end, so a crop shorter than the
 * section would clip the lower band and a taller one would float it over
 * nothing; either draws a placement nobody proposed.
 */

export type Placement = SectionLightPlacement;

/** Roughly the closer's height, held until it mounts (shared.tsx). */
const RESERVE = { desktop: 470, phone: 600 } as const;

function Section({
  mode,
  landing,
  fill,
}: {
  mode: Mode;
  landing: Placement;
  fill?: boolean;
}) {
  return (
    <SectionCrop
      ground="cinema"
      mode={mode}
      reserve={RESERVE[mode]}
      fill={fill}
    >
      <SectionLight placement={landing}>
        <CinemaClose />
      </SectionLight>
    </SectionCrop>
  );
}

/**
 * THE PLACEMENT AS A DIAGRAM, IN THE TILE ONLY.
 *
 * ★ THE REAL LIGHT IS QUIET ON PURPOSE AND A TILE IS A THUMBNAIL. The field
 * rests at 30 percent with a 13 percent band (the register Will ruled), which
 * is right on a 1440 section and close to nothing once that section is fitted
 * into a tile: measured at true size, the four tiles of round seven's build
 * could not be told apart. So the tile carries a small drawing of the section
 * with its lit edge marked, above the real picture, and the real picture stays
 * honest. The drawing is neutral light, never the five hues: bible 3 keeps
 * those for light itself, and a diagram is interface.
 */
function PlacementGlyph({ landing }: { landing: Placement }) {
  const band =
    "absolute inset-x-0 h-[46%] from-foreground/85 via-foreground/25 to-transparent";
  return (
    <div
      aria-hidden
      className="relative h-[112px] w-[176px] overflow-hidden rounded-[12px] border-[3px] border-foreground/45"
    >
      {landing === "room" ? (
        <div className="absolute inset-0 bg-foreground/40" />
      ) : null}
      {landing === "both" || landing === "top" ? (
        <div className={cn(band, "top-0 bg-gradient-to-b")} />
      ) : null}
      {landing === "both" || landing === "bottom" ? (
        <div className={cn(band, "bottom-0 bg-gradient-to-t")} />
      ) : null}
      <div className="absolute inset-x-[22%] top-1/2 flex -translate-y-1/2 flex-col items-center gap-[8px]">
        <span className="h-[8px] w-full rounded-full bg-foreground/60" />
        <span className="h-[6px] w-3/5 rounded-full bg-foreground/35" />
      </div>
    </div>
  );
}

export function LandingStage({
  mode,
  landing,
}: {
  mode: Mode;
  landing: Placement;
}) {
  return (
    <div data-lgt-step="landing">
      {/* The tile is always the 1440 section: the canvas switch belongs to the
          stage, and a 375 crop inside a tile's 1440 canvas is a postage stamp. */}
      <TileOnly>
        <div className="flex items-center px-1 pb-6">
          <PlacementGlyph landing={landing} />
        </div>
        <Section mode="desktop" landing={landing} fill />
      </TileOnly>
      <StageOnly>
        <Section mode={mode} landing={landing} />
      </StageOnly>
    </div>
  );
}
