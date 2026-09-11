"use client";

import { Check, Play } from "lucide-react";
import Image from "next/image";
import { useEffect, useState, type CSSProperties } from "react";

import { marketingImage } from "@/lib/constants/marketing-media";
import { useFlip } from "@/lib/shared/use-flip";
import { cn } from "@/lib/utils";

import type { AlbumFillView, AlbumTile } from "./use-album-fill";

/**
 * THE FILLING ALBUM'S GRID: explicit columns, newest at the top, older tiles
 * sliding DOWN as a new one lands. This is the real guest album's arrival
 * grammar (src/components/guest/guest-masonry.tsx), quoted: the green check on
 * the tile that just landed, the thin progress strip on an in-flight upload,
 * the small corner play badge on a video, the live count line above.
 *
 * ★ TWO ELEMENTS PER TILE, AND THE SPLIT IS LOAD-BEARING. The OUTER wrapper is
 * what useFlip registers and moves: it carries NO transform, transition or
 * scale class of its own, ever, because the FLIP writes an inline
 * `transition: transform ...` that would replace any other transition, and a
 * pre-state transform on the same element would corrupt every later rect the
 * hook measures. The INNER element carries the entrance ([data-mkt-fly], from
 * slightly above, the album's own small rise rather than the live demo's pop).
 * The two-beat set change in design-system.md states the same rule for exits.
 *
 * ★ Nothing inside a moving tile carries backdrop-blur: under an animating
 * transform it flickers in Safari and forces readbacks. The play badge quotes
 * the product's minus that one class.
 *
 * The frame is a fixed-height clip, so the page never reflows: tiles pushed
 * past the foot are clipped, not shrunk. `--fill-scale` lets a narrow viewport
 * scale every authored height at once.
 */

/** Flip to the visible state two frames after mount, so the entrance transition
 *  actually runs (the ClearedBeat precedent: state only inside rAF). */
function useEnteredFrame(instant: boolean): boolean {
  const [on, setOn] = useState(instant);
  useEffect(() => {
    if (instant) return;
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => setOn(true));
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, [instant]);
  return on || instant;
}

function CheckBadge() {
  const on = useEnteredFrame(false);
  return (
    <span
      aria-hidden
      data-mkt-toast
      data-on={on ? "true" : "false"}
      className="pointer-events-none absolute top-1.5 right-1.5 flex size-4.5 items-center justify-center rounded-full bg-success text-success-foreground"
    >
      <Check className="size-3" strokeWidth={3} />
    </span>
  );
}

/** The in-flight strip: fills over the half-beat it is on screen. */
function ProgressStrip({ ms }: { ms: number }) {
  const on = useEnteredFrame(false);
  return (
    <span className="absolute inset-x-0 bottom-0 bg-black/35 p-1.5">
      <span className="block h-1 w-full overflow-hidden rounded-full bg-white/30">
        <span
          className="block h-full rounded-full bg-white"
          style={{
            width: on ? "100%" : "12%",
            transition: `width ${ms}ms linear`,
          }}
        />
      </span>
    </span>
  );
}

function AlbumTileView({
  tile,
  register,
  reduced,
  sizes,
  stripMs,
}: {
  tile: AlbumTile;
  register: (key: string) => (el: HTMLElement | null) => void;
  reduced: boolean;
  sizes: string;
  stripMs: number;
}) {
  const m = marketingImage(tile.fixture.id);
  const instant = tile.status === "seed" || reduced;
  const on = useEnteredFrame(instant);
  return (
    <div
      ref={register(tile.key)}
      className="w-full shrink-0"
      style={{
        height: `calc(${tile.fixture.h}px * var(--fill-scale, 1))`,
      }}
    >
      <div
        data-mkt-fly
        data-on={on ? "true" : undefined}
        className="relative size-full overflow-hidden rounded-[3px] bg-black/10"
        style={
          {
            "--i": 0,
            "--fly-x": "0px",
            "--fly-y": "-18px",
            "--fly-scale": "0.96",
          } as CSSProperties
        }
      >
        <Image
          src={m.src}
          alt=""
          fill
          sizes={sizes}
          className={cn(
            "object-cover",
            tile.status === "uploading" && "opacity-70",
          )}
        />
        {tile.fixture.kind === "video" && tile.status !== "uploading" && (
          <span
            aria-hidden
            className="pointer-events-none absolute bottom-1.5 left-1.5 flex size-4.5 items-center justify-center rounded-full bg-black/45"
          >
            <Play className="ml-px size-2.5 fill-white text-white" />
          </span>
        )}
        {tile.status === "uploading" && <ProgressStrip ms={stripMs} />}
        {tile.check && <CheckBadge />}
      </div>
    </div>
  );
}

export function AlbumFillGrid({
  view,
  cols = 3,
  frameHeight,
  gap = 6,
  sizes,
  showCount = true,
  reduced,
  stripMs = 360,
  className,
}: {
  view: AlbumFillView;
  cols?: 2 | 3;
  /** The clip height at full scale (scaled by --fill-scale). */
  frameHeight: number;
  gap?: number;
  sizes: string;
  showCount?: boolean;
  reduced: boolean;
  stripMs?: number;
  className?: string;
}) {
  const register = useFlip(view.layoutKey);
  // A 2-column grid folds the third column in: the product's phone album is
  // `columns-2`, and the fixtures are authored on three.
  const columns =
    cols === 3
      ? view.columns
      : [
          [...view.columns[0], ...view.columns[2]],
          view.columns[1],
        ];

  return (
    <div className={className}>
      {showCount && (
        <p
          aria-hidden
          className="mb-2 px-1 text-xs text-muted-foreground tabular-nums"
        >
          {view.photos} {view.photos === 1 ? "photo" : "photos"}
          {" & videos"}
          {view.guests > 0 && (
            <>
              {" "}
              from {view.guests} {view.guests === 1 ? "guest" : "guests"}
            </>
          )}
        </p>
      )}
      <div
        className="overflow-hidden rounded-[4px]"
        style={{ height: `calc(${frameHeight}px * var(--fill-scale, 1))` }}
      >
        <div className="flex" style={{ gap }}>
          {columns.map((column, c) => (
            <div
              key={c}
              className="flex min-w-0 flex-1 flex-col"
              style={{ gap }}
            >
              {column.map((tile) => (
                <AlbumTileView
                  key={tile.key}
                  tile={tile}
                  register={register}
                  reduced={reduced}
                  sizes={sizes}
                  stripMs={stripMs}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
