"use client";

import "@/components/app/event-settings/camera-settings-style-picture.css";

import { useEffect, useState } from "react";
import { Camera, Clock, Play } from "lucide-react";

import { STYLE_PICTURE_SRCS } from "@/components/app/event-settings/camera-settings-style-picture";
import { MOMENT_WORDS } from "@/components/app/create-event-wizard/night";
import type { AlbumStyle } from "@/lib/disposable/album-style";
import { cn } from "@/lib/utils";

/**
 * A STYLE'S PICTURE, AS ROUND FIVE DRAWS IT (`previews=one`, `open` and `still`): production's six-frame album
 * (`camera-settings-style-picture.tsx`, its classes and tones, the ghost pack's own frames), with the two things the
 * rounds' helpers found it needs once nothing moves all three at once:
 *
 *  - ★ A REST THAT READS STILL. Today's party moment is a frame of a moving picture: Review's two frames "fading in" at
 *    40% read as disabled, and the Disposable's camera and its count stand only in the arriving moment, which no longer
 *    plays on every card. So the rest is: Live, all six in; Review, all but the newest two, which wait under her clock;
 *    the Disposable, dark but her one shot, its camera and count in the first frame. Full, most, one: the three read
 *    apart in one look.
 *  - ★ A STORY THAT PLAYS ONCE, frame by frame (`usePlay`): arriving, the party (frames landing one at a time, never
 *    left to right), next morning (Review's waiting frames let in; the Disposable's dark frames developing together, in
 *    one slower fade), then back to the rest, where it stays. Under reduced motion nothing plays: the rest stands.
 *
 * The wiring of a pick that keeps it moves these cells into `pictureCells` (Settings' cards share the picture).
 */

export type Moment = "arrive" | "party" | "morning";
export type Cell = "empty" | "dark" | "lit" | "held" | "hers" | "camera";

const N = 6;

/** The rest: the one moment the three differ, drawn to read still. */
export function restCells(style: AlbumStyle): Cell[] {
  if (style === "live") return Array<Cell>(N).fill("lit");
  if (style === "approval")
    return ["lit", "lit", "lit", "lit", "held", "held"];
  return ["camera", "dark", "dark", "dark", "hers", "dark"];
}

/** Each moment's frames: arriving (empty, the Disposable dark), the rest, the morning (every album whole). */
export function cellsAt(style: AlbumStyle, moment: Moment): Cell[] {
  if (moment === "party") return restCells(style);
  if (moment === "morning") return Array<Cell>(N).fill("lit");
  return Array<Cell>(N).fill(style === "disposable" ? "dark" : "empty");
}

/** The order frames land in: never left to right (the `one` helper's 2, 6, 4, 1, 5, 3). */
const LANDING = [1, 5, 3, 0, 4, 2] as const;

export type Pace = {
  /** When the party starts landing, the morning comes, and the picture returns to its rest (ms from the start). */
  party: number;
  morning: number;
  rest: number;
  /** Between one frame landing and the next. */
  step: number;
};

/** `one`'s pace: about five seconds, the party held longest. */
export const ONE_PACE: Pace = { party: 900, morning: 2900, rest: 4700, step: 140 };
/** `open`'s: a little quicker, the album large enough that each frame reads as it lands. */
export const OPEN_PACE: Pace = {
  party: 900,
  morning: 2500,
  rest: 4000,
  step: 110,
};

export type Shown = {
  cells: Cell[];
  /** The moment the picture stands in, while a story plays or a frame is pinned; null at rest. */
  moment: Moment | null;
  /** Arriving: the Disposable's camera holding its whole roll, over every frame. */
  roll: boolean;
  /** Next morning: the reel's mark. */
  play: boolean;
  /** The Disposable's frames developing together: the slower fade. */
  developing: boolean;
};

const REST = (style: AlbumStyle): Shown => ({
  cells: restCells(style),
  moment: null,
  roll: false,
  play: false,
  developing: false,
});

/** A moment drawn whole and still: a frame of the story pinned for a reader (the board's stills). */
export function pinned(style: AlbumStyle, moment: Moment): Shown {
  return {
    cells: cellsAt(style, moment),
    moment,
    roll: moment === "arrive" && style === "disposable",
    play: moment === "morning",
    developing: false,
  };
}

function motionWelcome(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * THE STORY, ONCE: while `run` is a number (a press's count), the picture plays from arriving to its rest; a new number
 * plays it again from the start; null stands it at rest. Every frame's change is a state the picture's own transitions
 * carry (production's 320ms fade), so a story stopped half way leaves nothing behind.
 */
export function usePlay(
  style: AlbumStyle,
  run: number | null,
  pace: Pace,
): Shown {
  // The run this picture plays: its style and its count, so a new count (or another card's) starts it afresh.
  const key = run === null ? null : `${style}:${run}`;
  const [frame, setFrame] = useState<{ key: string; shown: Shown } | null>(
    null,
  );

  useEffect(() => {
    if (key === null || !motionWelcome()) return;
    const timers: number[] = [];
    // Each change is a function of the frame before it, the arriving album the first.
    const at = (ms: number, next: (s: Shown) => Shown) =>
      timers.push(
        window.setTimeout(
          () =>
            setFrame((f) => ({
              key,
              shown: next(
                f && f.key === key ? f.shown : pinned(style, "arrive"),
              ),
            })),
          ms,
        ),
      );
    const rest = restCells(style);
    // The party: each frame that changes lands on its own turn.
    const partyOrder = LANDING.filter(
      (i) => cellsAt(style, "arrive")[i] !== rest[i],
    );
    at(pace.party, (s) => ({ ...s, moment: "party", roll: false }));
    partyOrder.forEach((i, k) =>
      at(pace.party + k * pace.step, (s) => {
        const cells = [...s.cells];
        cells[i] = rest[i]!;
        return { ...s, cells };
      }),
    );
    // Next morning: what waited comes in (Review's, one by one); the Disposable's dark frames develop together.
    at(pace.morning, (s) => ({ ...s, moment: "morning" }));
    if (style === "disposable") {
      at(pace.morning, (s) => ({
        ...s,
        developing: true,
        cells: Array<Cell>(N).fill("lit"),
      }));
      at(pace.morning + 600, (s) => ({ ...s, play: true }));
    } else {
      const waiting = LANDING.filter((i) => rest[i] !== "lit");
      waiting.forEach((i, k) =>
        at(pace.morning + k * pace.step, (s) => {
          const cells = [...s.cells];
          cells[i] = "lit";
          return { ...s, cells };
        }),
      );
      at(pace.morning + waiting.length * pace.step + 240, (s) => ({
        ...s,
        play: true,
      }));
    }
    // Back to the rest, where it stays: every frame at once, the mark and the word gone.
    at(pace.rest, () => REST(style));
    return () => {
      for (const t of timers) window.clearTimeout(t);
    };
  }, [key, style, pace]);

  if (key === null || !motionWelcome()) return REST(style);
  // Arriving, until the story's first change: the album empty (the Disposable dark, its camera holding the roll).
  return frame && frame.key === key ? frame.shown : pinned(style, "arrive");
}

/**
 * THE PICTURE ITSELF: production's markup and classes (`style-pic`, `style-pic-cell[data-cell]`, its image, clock,
 * roll and play mark), with the camera frame and the moment's word the board adds. Decorative, as production's is: the
 * card's name and line say what it shows.
 */
export function BoardPicture({
  style,
  shown,
  roll,
  word = false,
  className,
}: {
  style: AlbumStyle;
  shown: Shown;
  roll: number;
  /** Name the moment on the picture (`one`): a pill at its top-right, while it plays or is pinned. */
  word?: boolean;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      data-style-picture={style}
      data-moment={shown.moment ?? "rest"}
      data-developing={shown.developing ? "" : undefined}
      className={cn(
        "style-pic cw-pic @container relative grid shrink-0 grid-cols-3 gap-[2px] overflow-hidden rounded-[10px] p-[3px]",
        className,
      )}
    >
      {STYLE_PICTURE_SRCS.slice(0, N).map((src, i) => {
        const state = shown.cells[i]!;
        return (
          <span
            key={src}
            data-cell={state === "camera" ? "dark" : state}
            data-cw-camera={state === "camera" ? "" : undefined}
            className="style-pic-cell relative overflow-hidden rounded-[2px]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- a ghost-pack still, the style's picture */}
            <img
              src={src}
              alt=""
              draggable={false}
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
              <span className="cw-cam absolute inset-0 flex flex-col items-center justify-center tabular-nums">
                <Camera aria-hidden strokeWidth={2} />
                {roll}
              </span>
            ) : null}
          </span>
        );
      })}
      <span
        data-on={shown.roll ? "" : undefined}
        className="style-pic-roll cw-roll absolute inset-0 flex items-center justify-center font-medium tabular-nums"
      >
        <Camera aria-hidden strokeWidth={2} />
        {roll}
      </span>
      <span
        data-on={shown.play ? "" : undefined}
        className="style-pic-play cw-play absolute flex items-center justify-center rounded-full"
      >
        <Play aria-hidden className="fill-current" />
      </span>
      {word ? (
        <span
          data-on={shown.moment ? "" : undefined}
          data-cw-moment={shown.moment ?? undefined}
          className="cw-moment absolute"
        >
          {shown.moment ? MOMENT_WORDS[shown.moment] : null}
        </span>
      ) : null}
    </span>
  );
}
