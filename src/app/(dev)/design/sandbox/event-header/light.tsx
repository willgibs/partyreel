"use client";

import {
  createContext,
  type CSSProperties,
  type ReactNode,
  useContext,
  useMemo,
} from "react";

import { HOUSE_HUES, hueOfOklch } from "@/lib/guest/door-light";
import { useSampledPalette } from "@/lib/shared/sampled-palette";
import { cn } from "@/lib/utils";

import { NEWEST } from "./fixtures";

/**
 * THE ALBUM'S OWN LIGHT, as the door already wears it (`door-light.ts`): the
 * hues of the album's newest previews, sampled once for the whole board by the
 * sampler the site's lamps use (`useSampledPalette`, the URL form), kept as
 * HUES so the register (paper in light, the atmosphere register in dark) stays
 * the stylesheet's. The house five until the sample lands, and wherever the
 * album has nothing to sample (the first guest of the night), as production's
 * lamp does.
 */
export type Hues = readonly number[];

const HuesCtx = createContext<Hues>(HOUSE_HUES);

export function AlbumHuesProvider({ children }: { children: ReactNode }) {
  const colors = useSampledPalette(NEWEST, "dark");
  const hues = useMemo(() => {
    const list = (colors ?? [])
      .map(hueOfOklch)
      .filter((h): h is number => h !== null);
    return list.length >= 3 ? list : HOUSE_HUES;
  }, [colors]);
  return <HuesCtx.Provider value={hues}>{children}</HuesCtx.Provider>;
}

/** The album's sampled hues, or the house five where it has none to give. */
export function useAlbumHues(empty = false): Hues {
  const hues = useContext(HuesCtx);
  return empty ? HOUSE_HUES : hues;
}

/** The three custom properties every lit rule reads, as the door's own lamp names them. */
export const litVars = (hues: Hues) =>
  ({
    "--lit-h1": hues[0],
    "--lit-h2": hues[1],
    "--lit-h3": hues[2],
  }) as CSSProperties;

/**
 * A FIELD OF THE ALBUM'S LIGHT behind a head: three soft pools in its hues, in
 * the ground's register (`event-header.css`, `.eh-light`), drifting only where
 * motion is welcome. Decorative: the words over it say everything.
 */
export function AlbumLight({
  hues,
  source,
  className,
}: {
  hues: Hues;
  /** Where the light comes from (an emblem's centre), as percentages of the head: it is spent from there. */
  source?: { x: string; y: string };
  className?: string;
}) {
  return (
    <div
      aria-hidden
      data-eh-hues={hues.slice(0, 3).map(Math.round).join(",")}
      className={cn("eh-light", source && "eh-light-source", className)}
      style={{
        ...litVars(hues),
        ...(source
          ? ({ "--eh-sx": source.x, "--eh-sy": source.y } as CSSProperties)
          : {}),
      }}
    >
      <span className="eh-light-pool eh-light-p1" />
      <span className="eh-light-pool eh-light-p2" />
      <span className="eh-light-pool eh-light-p3" />
    </div>
  );
}
