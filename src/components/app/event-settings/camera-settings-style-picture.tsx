import { Camera, Clock, Play } from "lucide-react";

import { GUEST_GHOST_FRAMES } from "@/components/guest/gallery-empty-state";
import type { AlbumStyle } from "@/lib/disposable/album-style";
import { ROLL_SHOTS } from "@/lib/disposable/roll";
import { cn } from "@/lib/utils";

import "./camera-settings-style-picture.css";

/**
 * A STYLE'S PICTURE, ONE ALBUM IN ITS OWN LIGHT, SETTINGS' CARD AND CREATE'S ALIKE (the-wait r1's mini-albums, and
 * create-wizard r3's add=styles). It is drawn from the guest ghost pack every empty album already ships (no new asset),
 * six small frames.
 *
 * ★ AT REST IT STANDS ON THE ONE MOMENT THE THREE DIFFER, DRAWN TO READ STILL (create-wizard r5's `previews=one`, Will
 * 2026-10-07: the three moving together asked her to hold "9 screens in your head"): Live, all six in; Review, all but
 * the newest two, which wait under her clock; the Disposable, dark but her one shot, its camera and its roll in the
 * first frame. Full, most, one: the three read apart in one look, here and on Settings' cards. (The party moment that
 * stood here was a frame of a moving picture: Review's two frames "fading in" read as disabled, and the Disposable's
 * camera stood only as guests arrived.)
 *
 * `moment` is the story a still picture stands in: guests arriving (every album empty, the Disposable's camera holding
 * its roll), the party (the rest above; Settings' own, so the default), the next morning (every album whole, the reel's
 * mark on it). Create's style step plays the picked card's story once through the three (`style-story.ts`), drawing it
 * frame by frame through `StylePictureFrame`.
 *
 * ★ A PICTURE IS SIZED BY ITS BOX, NEVER BY THE VIEWPORT: its marks (the clock, the camera, the reel's mark) are in
 * `cqw`, a hundredth of the picture's own width with a floor a thumb can read, so the same drawing reads at Settings'
 * 88 px, a phone's card in Create and a desk's. Its tones are tokens (`camera-settings-style-picture.css`), so the
 * brand round re-tints the three albums in one place.
 *
 * Decorative: the card's name and line say what the picture shows, so a reader never meets it.
 */

/** The story a style's picture stands in. */
export const STYLE_MOMENTS = ["arrive", "party", "morning"] as const;
export type StyleMoment = (typeof STYLE_MOMENTS)[number];

/** Each moment, named by what happens and never by a clock (nothing depends on a timeline). */
export const MOMENT_WORDS: Record<StyleMoment, string> = {
  arrive: "Arriving",
  party: "The party",
  morning: "Next morning",
};

/** What one frame of the picture shows. */
export type CellState =
  /** An empty album's place, dashed. */
  | "empty"
  /** A frame not yet developed. */
  | "dark"
  /** A photograph in the album. */
  | "lit"
  /** A photograph waiting for the host, under a clock. */
  | "held"
  /** The one shot she holds on a roll, the only picture she has before the develop. */
  | "hers"
  /** The Disposable's camera, a frame not yet developed with the roll's count standing in it. */
  | "camera";

const FRAMES = GUEST_GHOST_FRAMES.slice(0, 6);
const N = FRAMES.length;

/** The rest: the one moment the three differ, drawn to read still. */
function restCells(style: AlbumStyle): CellState[] {
  if (style === "live") return Array<CellState>(N).fill("lit");
  if (style === "approval") return ["lit", "lit", "lit", "lit", "held", "held"];
  return ["camera", "dark", "dark", "dark", "hers", "dark"];
}

/** The six frames of a style's picture at a moment, in reading order. Pure: the picture is this and nothing more. */
export function pictureCells(
  style: AlbumStyle,
  moment: StyleMoment,
): CellState[] {
  if (moment === "party") return restCells(style);
  if (moment === "morning") return Array<CellState>(N).fill("lit");
  return Array<CellState>(N).fill(style === "disposable" ? "dark" : "empty");
}

/** What a picture shows at one instant: its frames, and the marks standing over them. */
export type PictureShown = {
  cells: readonly CellState[];
  /** The moment the picture stands in (the rest is the party's). */
  at: StyleMoment;
  /** The moment a story stands in, named on the picture where it has room (`word`); null at rest. */
  moment: StyleMoment | null;
  /** Arriving: the Disposable's camera holding its whole roll, over every frame. */
  roll: boolean;
  /** Next morning: the reel's mark. */
  play: boolean;
  /** The Disposable's frames developing together: the slower fade. */
  developing: boolean;
};

/**
 * A picture standing still at a moment: the rest (the party, no word), or a moment of the story drawn whole, named.
 */
export function shownAt(
  style: AlbumStyle,
  moment: StyleMoment,
  named = false,
): PictureShown {
  return {
    cells: pictureCells(style, moment),
    at: moment,
    moment: named ? moment : null,
    roll: moment === "arrive" && style === "disposable",
    play: moment === "morning",
    developing: false,
  };
}

/** The six frames a picture draws, for a caller that asks for them ahead of the picture (Create's step). */
export const STYLE_PICTURE_SRCS: readonly string[] = FRAMES.map((f) => f.src);

/**
 * THE PICTURE ITSELF, AT ONE INSTANT: its frames by their state, the camera standing in its first frame at rest, the
 * roll over every frame as guests arrive, the reel's mark the morning after, and (with `word`) the moment named at its
 * top-right while a story plays.
 */
export function StylePictureFrame({
  style,
  shown,
  roll = ROLL_SHOTS,
  word = false,
  className,
}: {
  style: AlbumStyle;
  shown: PictureShown;
  /** The roll the Disposable's camera holds: hers once she has picked one (Create's step). */
  roll?: number;
  /** Name the moment on the picture, while a story stands in one (Create's playing card). */
  word?: boolean;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      data-style-picture={style}
      data-moment={shown.at}
      data-playing={shown.moment ? "" : undefined}
      data-developing={shown.developing ? "" : undefined}
      className={cn(
        "style-pic @container relative grid shrink-0 grid-cols-3 gap-[2px] overflow-hidden rounded-[10px] p-[3px]",
        className,
      )}
    >
      {FRAMES.map((frame, i) => {
        const state = shown.cells[i] ?? "dark";
        return (
          <span
            key={frame.src}
            data-cell={state}
            className="style-pic-cell relative overflow-hidden rounded-[2px]"
          >
            {/* Always drawn and shown by its state, so a frame fades in and out with the story rather than
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
            {state === "camera" ? (
              // The camera in its first frame, the count it holds under it: the Disposable at rest.
              <span className="style-pic-cam absolute inset-0 flex flex-col items-center justify-center tabular-nums">
                <Camera aria-hidden strokeWidth={2} />
                {roll}
              </span>
            ) : null}
          </span>
        );
      })}
      {/* The camera holds its roll as guests arrive: nothing shot yet, every frame of hers to take. */}
      <span
        data-on={shown.roll ? "" : undefined}
        className="style-pic-roll absolute inset-0 flex items-center justify-center font-medium tabular-nums"
      >
        <Camera aria-hidden strokeWidth={2} />
        {roll}
      </span>
      {/* The morning after, every album whole and the reel's mark on it. */}
      <span
        data-on={shown.play ? "" : undefined}
        className="style-pic-play absolute flex items-center justify-center rounded-full"
      >
        <Play aria-hidden className="fill-current" />
      </span>
      {word ? (
        <span
          data-on={shown.moment ? "" : undefined}
          data-picture-moment={shown.moment ?? undefined}
          className="style-pic-moment absolute"
        >
          {shown.moment ? MOMENT_WORDS[shown.moment] : null}
        </span>
      ) : null}
    </span>
  );
}

/** A style's picture standing still: Settings' cards (the rest), and Create's Disposable screen (its morning). */
export function StylePicture({
  style,
  moment = "party",
  roll = ROLL_SHOTS,
  className,
}: {
  style: AlbumStyle;
  moment?: StyleMoment;
  /** The roll the disposable's camera holds as guests arrive: hers once she has picked one (Create's step). */
  roll?: number;
  className?: string;
}) {
  return (
    <StylePictureFrame
      style={style}
      shown={shownAt(style, moment)}
      roll={roll}
      className={className}
    />
  );
}
