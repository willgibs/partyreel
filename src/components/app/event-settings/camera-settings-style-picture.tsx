import { Camera, Clock, Play } from "lucide-react";

import { GUEST_GHOST_FRAMES } from "@/components/guest/gallery-empty-state";
import type { AlbumStyle } from "@/lib/disposable/album-style";
import { ROLL_SHOTS } from "@/lib/disposable/roll";
import { cn } from "@/lib/utils";

import "./camera-settings-style-picture.css";

/**
 * A STYLE'S PICTURE, ONE ALBUM IN ITS OWN LIGHT, SETTINGS' CARD AND CREATE'S ALIKE (the-wait r1's mini-albums, and
 * create-wizard r3's add=styles, where each picture moves through the night). It is drawn from the guest ghost pack
 * every empty album already ships (no new asset), six small frames:
 *  - Live: every frame lit, each shown the moment it is added;
 *  - Review: lit but for one held under a clock and one fading in, as the host lets each in;
 *  - Disposable: dark but for one, hers, until the album develops.
 * `moment` is the night the picture stands in: guests arriving (every album empty, the disposable's camera holding its
 * roll), the party (the pictures above; Settings' own, so the default), the next morning (every album whole, the
 * reel's mark on it).
 *
 * ★ A PICTURE IS SIZED BY ITS BOX, NEVER BY THE VIEWPORT: its marks (the clock, the camera, the reel's mark) are in
 * `cqw`, a hundredth of the picture's own width with a floor a thumb can read, so the same drawing reads at Settings'
 * 88 px, a phone's card in Create and a desk's. Its tones are tokens (`camera-settings-style-picture.css`), so the
 * brand round re-tints the three albums in one place.
 *
 * Decorative: the card's name and line say what the picture shows, so a reader never meets it.
 */

/** The night a style's picture stands in. */
export const STYLE_MOMENTS = ["arrive", "party", "morning"] as const;
export type StyleMoment = (typeof STYLE_MOMENTS)[number];

/** What one frame of the picture shows. */
export type CellState =
  /** An empty album's place, dashed. */
  | "empty"
  /** A frame not yet developed. */
  | "dark"
  /** A photograph in the album. */
  | "lit"
  /** A photograph coming in, as the host lets it in. */
  | "fading"
  /** A photograph waiting for the host, under a clock. */
  | "held"
  /** The one shot she holds on a roll, the only picture she has before the develop. */
  | "hers";

const FRAMES = GUEST_GHOST_FRAMES.slice(0, 6);

/** The six frames of a style's picture at a moment, in reading order. Pure: the picture is this and nothing more. */
export function pictureCells(
  style: AlbumStyle,
  moment: StyleMoment,
): CellState[] {
  return FRAMES.map((_, i): CellState => {
    if (moment === "morning") return "lit";
    if (moment === "arrive") return style === "disposable" ? "dark" : "empty";
    if (style === "live") return "lit";
    if (style === "approval")
      return i % 3 === 2 ? "held" : i % 3 === 1 ? "fading" : "lit";
    return i === 4 ? "hers" : "dark";
  });
}

/** The six frames a picture draws, for a caller that asks for them ahead of the picture (Create's step). */
export const STYLE_PICTURE_SRCS: readonly string[] = FRAMES.map((f) => f.src);

export function StylePicture({
  style,
  moment = "party",
  className,
}: {
  style: AlbumStyle;
  moment?: StyleMoment;
  className?: string;
}) {
  const cells = pictureCells(style, moment);
  return (
    <span
      aria-hidden
      data-style-picture={style}
      data-moment={moment}
      className={cn(
        "style-pic @container relative grid shrink-0 grid-cols-3 gap-[2px] overflow-hidden rounded-[10px] p-[3px]",
        className,
      )}
    >
      {FRAMES.map((frame, i) => {
        const state = cells[i]!;
        return (
          <span
            key={frame.src}
            data-cell={state}
            className="style-pic-cell relative overflow-hidden rounded-[2px]"
          >
            {/* Always drawn and shown by its state, so a frame fades in and out with the night rather than
                popping, and the file is already there when its moment comes. */}
            {/* eslint-disable-next-line @next/next/no-img-element -- a ghost-pack still, the style's picture */}
            <img
              src={frame.src}
              alt=""
              draggable={false}
              loading="lazy"
              decoding="async"
              className="style-pic-img absolute inset-0 size-full object-cover"
            />
            {state === "held" ? (
              <Clock
                aria-hidden
                className="style-pic-clock absolute inset-0 m-auto"
              />
            ) : null}
          </span>
        );
      })}
      {moment === "arrive" && style === "disposable" ? (
        // The camera holds its roll: nothing shot yet, 24 frames to take.
        <span className="style-pic-roll absolute inset-0 flex items-center justify-center font-medium tabular-nums">
          <Camera aria-hidden strokeWidth={2} />
          {ROLL_SHOTS}
        </span>
      ) : null}
      {moment === "morning" ? (
        // The morning after, every album whole and the reel's mark on it.
        <span className="style-pic-play absolute flex items-center justify-center rounded-full">
          <Play aria-hidden className="fill-current" />
        </span>
      ) : null}
    </span>
  );
}
