"use client";

/**
 * THE REEL AS A TIMELINE (disposable-mode r3, Will's `camera=timeline`, polished in its wiring as his note asked:
 * "Think we could still polish slightly, especially around the timeline design within the reel here").
 *
 * Her whole roll under the picture, in order: the frames she has spent are sealed glass with the minute she took each
 * (a video wears its length), the frame she is on holds the live picture in miniature, the fresh frames after it are a
 * hairline. A shot freezes the frame she was on on the moment she pressed, the reel glides on one frame, and the frozen
 * picture seals into glass as it goes: she watches her shot go onto the roll.
 *
 * ★ THE POLISH, AGAINST THE DRAWING: the minute stands at the type floor (10 px, the drawing's 7.5 was under it), the
 * live frame's ring is the frame itself, never a glow, a frame still on its way to the album wears a quiet dot, and the
 * live frame turns red with its own fill while a video rolls (its length, the shutter's ring at the thumb's own scale).
 *
 * ★ THE LIVE MINIATURE NEVER MOVES. It is the reel's centre, where the frame she is on always stands; the track glides
 * under it, so a shot never re-mounts the picture (one stream, two elements: the picture and this).
 *
 * ★ THE REEL IS HER SHOTS' DOOR, AND ITS NEWEST FRAME HER TAKE-BACK'S (guest-moments r1's `where=reel`): a press
 * anywhere on it opens her shots (the end's "See your shots" opens the same list), and a press on the newest frame,
 * where her eye goes the second after a shot, opens that shot with Take it back and Keep it, where the camera offers it
 * (`newest`). Two buttons over one film: nested buttons are no HTML, so the reel's box holds the door, the film over it
 * (a picture, hidden from a screen reader, which hears the doors' names) and the newest frame's own button standing
 * where that frame always stands, one pitch left of the reel's centre, or at it once the roll is spent.
 */
import { Play } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, type CSSProperties } from "react";

import { newestCell, reelCentre, type ReelCell } from "@/lib/guest/camera/reel";
import { cn } from "@/lib/utils";

/**
 * A frozen frame in its cell: the picture the shutter's own handler drew, copied onto the cell's canvas before the
 * cell paints (a layout effect), so the frame she pressed on is there in the very first frame of the glide.
 */
function FrozenFrame({ source }: { source: HTMLCanvasElement | undefined }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext("2d");
    if (!el || !ctx || !source) return;
    el.width = source.width;
    el.height = source.height;
    ctx.drawImage(source, 0, 0);
  }, [source]);
  return (
    <span aria-hidden className="cam-cell-pic">
      <canvas ref={canvas} className="cam-cell-frozen" />
    </span>
  );
}

export function CameraReel({
  cells,
  stream,
  mirror,
  frozen,
  just,
  progress,
  label,
  onOpen,
  newest,
  className,
}: {
  cells: readonly ReelCell[];
  /** The live picture, for the frame she is on. */
  stream: MediaStream | null;
  /** The front camera's picture, shown as a mirror. */
  mirror: boolean;
  /** The frozen frames, by shot. */
  frozen: ReadonlyMap<string, HTMLCanvasElement>;
  /** The shots just taken: each one's frame shows its frozen picture as it seals. */
  just: ReadonlySet<string>;
  /** A video's share of its length, while one rolls. */
  progress: number | null;
  /** The button's name: "Your shots, 6 on the roll". */
  label: string;
  onOpen: () => void;
  /**
   * The newest frame's own door, where the camera offers a take-back: the shot it must hold (the newest exposed frame's
   * own, or no door), its name, and what a press opens.
   */
  newest?: {
    shotKey: string;
    label: string;
    onOpen: () => void;
    disabled?: boolean;
  } | null;
  className?: string;
}) {
  const live = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = live.current;
    if (!video) return;
    if (video.srcObject !== stream) video.srcObject = stream;
    if (stream) void video.play().catch(() => {});
  }, [stream]);

  const liveCell = cells.find(
    (c) => c.state === "current" || c.state === "rolling",
  );
  const centre = reelCentre(cells);
  const last = newestCell(cells);
  const door = newest && last?.shotKey === newest.shotKey ? newest : null;

  return (
    <div className={cn("cam-reel-box", className)} data-cam-reel-box="">
      <button
        type="button"
        onClick={onOpen}
        aria-label={label}
        data-cam-reel=""
        // The house's focus mark (identity r4, `focus-halo`), round the reel's own box: the film's fade is on the
        // film over it (`cam-reel-film`), since a mask on the button would fade its halo away with the frames.
        className="cam-reel focus-halo"
      />
      <span aria-hidden className="cam-reel-film">
        <span
          aria-hidden
          className="cam-reel-track"
          // The frame she is on, the track's centre (`camera.css` lays the frames out by their shape).
          style={{ "--c": reelCentre(cells) } as CSSProperties}
        >
          {cells.map((cell) => (
            <span
              key={cell.n}
              className="cam-cell"
              data-state={cell.state}
              data-sending={cell.sending ? "" : undefined}
              style={{ "--n": cell.n } as CSSProperties}
            >
              {cell.shotKey && just.has(cell.shotKey) && (
                <FrozenFrame source={frozen.get(cell.shotKey)} />
              )}
              {cell.state === "exposed" && cell.minute && (
                <span className="cam-cell-time">
                  {cell.video ? (
                    <>
                      <Play className="size-2 fill-current" aria-hidden />
                      {`${cell.video}s`}
                    </>
                  ) : (
                    cell.minute
                  )}
                </span>
              )}
            </span>
          ))}
        </span>
        {/* The frame she is on: the live picture, standing still at the reel's centre. */}
        <span
          aria-hidden
          className="cam-reel-live"
          data-on={liveCell ? "" : undefined}
          data-rolling={liveCell?.state === "rolling" ? "" : undefined}
        >
          <video
            ref={live}
            muted
            playsInline
            autoPlay
            disablePictureInPicture
            className={cn("size-full object-cover", mirror && "-scale-x-100")}
          />
          {progress !== null && (
            <span
              className="cam-reel-fill"
              style={{
                transform: `scaleX(${Math.min(1, Math.max(0, progress))})`,
              }}
            />
          )}
        </span>
      </span>
      {door && last && (
        <button
          type="button"
          onClick={door.onOpen}
          disabled={door.disabled}
          aria-label={door.label}
          data-cam-newest={door.shotKey}
          // Where the newest frame stands against the reel's centre: one pitch left, or at it once the roll is spent.
          style={{ "--d": last.n - centre } as CSSProperties}
          className="cam-reel-newest focus-halo"
        />
      )}
    </div>
  );
}
