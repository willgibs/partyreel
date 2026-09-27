"use client";

import {
  createContext,
  type CSSProperties,
  type ReactNode,
  useContext,
} from "react";

import { useSampledPalette } from "@/lib/shared/sampled-palette";
import { cn } from "@/lib/utils";

import type { ScrimSpec } from "./door";
import { EVENT, HOST, NEWEST } from "./fixtures";
import { HostAvatar } from "./ground";

/**
 * LIT, HIS ROUND-TWO PICK (`look=lit`), AS THE GROUND EVERY SCREEN STANDS ON.
 *
 * The album's own sampled colour lights the sheet's free edge (the top in a
 * hand, the left at a desk), the event's name runs large beside the host's
 * face, and the count ticks as photographs land. `guest-door` is wiring these
 * pieces into production now; this round draws the rest of the door (its
 * icons, its words, its beats) inside them, so nothing here is asked.
 *
 * ★ THE REGISTER IS THE STYLESHEET'S, THE HUE IS THE ALBUM'S (bible 6: colour
 * comes from the photographs and from light). Every lit thing on this board,
 * the lamp, the pools behind the icons and the beat's bloom, reads the same
 * three hues through `--lit-h1..3`, so a pool can never disagree with the
 * lamp above it.
 */

/** The lightbox's own ground at a gentler dim (round two's measured scrim). */
export const LIT_SCRIM: ScrimSpec = {
  blur: 28,
  dim: 0.3,
  brightness: 0.72,
  saturate: 1.2,
};

/** The house five, law 3's no-media branch, until the sample lands. */
const HOUSE_HUES = [25, 85, 155, 255, 305];

const HueContext = createContext<readonly number[] | null>(null);

const hueOf = (color: string): number => {
  const m = /oklch\([^)]*\s([\d.]+)\)$/.exec(color.trim());
  return m ? Number(m[1]) : 0;
};

/**
 * THE SAMPLE, ONCE PER PREVIEW: the album's newest three read into one strip
 * (`useSampledPalette`, the sampler the site's lamps use), kept as hues so the
 * register (paper in light, dark in dark) is the stylesheet's to pick.
 */
export function LitProvider({ children }: { children: ReactNode }) {
  const colors = useSampledPalette(NEWEST, "dark");
  const hues = colors ? colors.map(hueOf) : null;
  return <HueContext.Provider value={hues}>{children}</HueContext.Provider>;
}

/**
 * A PASSWORD EVENT'S LIGHT: the house five, because nothing of the album can
 * be sampled before the unlock (the locked page leaks the name and the count,
 * never a pixel of its media), which is how production lights that door.
 */
export function HouseLight({ children }: { children: ReactNode }) {
  return <HueContext.Provider value={null}>{children}</HueContext.Provider>;
}

export function useHues(): { hues: readonly number[]; sampled: boolean } {
  const hues = useContext(HueContext);
  return { hues: hues ?? HOUSE_HUES, sampled: hues !== null };
}

/** The three hues as the custom properties every lit rule reads. */
export function useHueVars(): CSSProperties {
  const { hues } = useHues();
  return {
    "--lit-h1": hues[0],
    "--lit-h2": hues[1],
    "--lit-h3": hues[2],
  } as CSSProperties;
}

export type Strength = "base" | "bright" | "bloom";

/**
 * THE LIGHT ON THE SHEET'S FREE EDGE: three of the sampled hues as soft blobs,
 * a bright line where the edge catches them, and a mask that spends the light
 * before it reaches the words. It drifts on the lamps' own clock and rests
 * still under reduced motion.
 */
export function Lamp({
  edge,
  strength = "base",
}: {
  edge: "top" | "left" | "card";
  strength?: Strength;
}) {
  const { hues, sampled } = useHues();
  const vars = useHueVars();
  return (
    <div
      data-door-lamp={strength}
      data-door-hues={hues.slice(0, 3).map(Math.round).join(",")}
      data-door-sampled={sampled ? "" : undefined}
      aria-hidden
      className={cn("door-lamp", `door-lamp-${edge}`, `door-lamp-${strength}`)}
      style={vars}
    >
      <span className="door-lamp-blob door-lamp-b1" />
      <span className="door-lamp-blob door-lamp-b2" />
      <span className="door-lamp-blob door-lamp-b3" />
      <span className="door-lamp-edge" />
    </div>
  );
}

/**
 * THE COUNT, LIVE: the album's number ticks from the 48 the page loaded with
 * to the 50 now inside, one per photograph that landed behind the door. Still,
 * it reads the settled 50.
 */
export function Ticker() {
  const from = EVENT.approvedTotal;
  return (
    <span data-door-ticker className="door-ticker tabular-nums">
      <span className="door-tick door-tick-0">{from}</span>
      <span className="door-tick door-tick-1">{from + 1}</span>
      <span className="door-tick door-tick-2" data-door-tick-settled>
        {from + 2}
      </span>
    </span>
  );
}

/** The welcome's hero: the event's name large beside the host's face. */
export function LitHero({
  desk,
  eyebrow = "You’re invited to",
  title = EVENT.name,
  byline = true,
}: {
  desk: boolean;
  eyebrow?: string;
  title?: string;
  byline?: boolean;
}) {
  return (
    <div className="flex flex-col">
      <p className="text-label font-medium text-muted-foreground uppercase">
        {eyebrow}
      </p>
      <p
        data-door-lit-name
        className={cn(
          "mt-1.5 font-heading text-balance",
          desk ? "text-section" : "text-hero",
        )}
      >
        {title}
      </p>
      {byline && (
        <div className="mt-3 flex items-center gap-2.5">
          <HostAvatar size="lg" />
          <p className="text-working leading-snug text-muted-foreground">
            Hosted by{" "}
            <span className="font-medium text-foreground">{HOST.name}</span>
            <br />
            {EVENT.date}
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * A POOL OF THE ALBUM'S LIGHT behind an icon (`icons=lit`): a round lit by one
 * of the three sampled hues, the glyph on it in ink. The pool is light, not
 * paint: it is the lamp's own colour at the lamp's own register, so a row of
 * them reads as the edge's light falling on the words below it.
 */
export function Pool({
  hue,
  size = "row",
  children,
}: {
  /** Which of the three sampled hues lights it. */
  hue: 1 | 2 | 3;
  size?: "row" | "mark";
  children: ReactNode;
}) {
  const vars = useHueVars();
  return (
    <span
      data-door-pool={hue}
      aria-hidden
      className={cn(
        "door-pool relative flex shrink-0 items-center justify-center rounded-full text-foreground",
        size === "row" ? "size-9 [&>svg]:size-4.5" : "size-14 [&>svg]:size-7",
      )}
      style={{ ...vars, "--pool-h": `var(--lit-h${hue})` } as CSSProperties}
    >
      {children}
    </span>
  );
}
