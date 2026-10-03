"use client";

import { Check, Maximize2, Play } from "lucide-react";
import Image from "next/image";
import type { CSSProperties } from "react";

import { marketingImage } from "@/lib/constants/marketing-media";
import { useFlip } from "@/lib/shared/use-flip";
import { useEnteredFrame } from "@/lib/shared/use-entered-frame";
import { cn } from "@/lib/utils";

import type { AlbumFillView, AlbumTile } from "./use-album-fill";

/**
 * THE FILLING ALBUM'S GRID: explicit columns, newest at the top, older tiles
 * sliding DOWN as a new one lands. This quotes the guest album's arrival
 * grammar as a picture (the real marks are src/components/shared/album-tile.tsx
 * and arrival.css): the green check on the tile that just landed, the thin
 * progress strip on an in-flight upload, the small corner play badge on a
 * video, the live count line above.
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
 *
 * ★ `peek` MAKES THE TILES OPENABLE (the Everywhere stage passes it; a grid
 * without it stays plain): a press on any tile hands the caller what it needs to
 * show that photograph larger, and the newest landed tile wears a quiet corner
 * mark saying so (`loose-ends` r1, `everywhere-pill=corner`, with his easter
 * egg). Pointer-only on purpose: both grids sit in an `aria-hidden` stage, so a
 * tile is never a tab stop (a focusable inside aria-hidden is worse than none),
 * and the mark is drawn, not announced.
 */

/** What a press on a tile hands its caller. */
export type PeekRequest = {
  /** The marketing image id (marketingImage throws on a typo). */
  id: string;
  /** The uploader's display name. */
  by: string;
  /** The pressed tile's box on screen, for a layer that opens FROM it. */
  from: DOMRect;
  /** The tile's own loaded image URL (already in the browser's cache), so the
   *  larger picture has something sharp-ish under it while it loads. */
  poster: string | null;
};

function peekRequest(tile: AlbumTile, el: HTMLElement): PeekRequest {
  return {
    id: tile.fixture.id,
    by: tile.fixture.by,
    from: el.getBoundingClientRect(),
    poster: el.querySelector("img")?.currentSrc || null,
  };
}

/**
 * THE QUIET CORNER MARK: a small expand glyph on the newest tile, promising a
 * larger look. It is ALWAYS MOUNTED on an openable tile and only fades with
 * `data-on`, so a tile that stops being the newest lets its mark go over 300ms
 * while the column slides it down, rather than the glyph vanishing mid-slide.
 * A tile that mounts newest arrives WITH it (the tile's own entrance carries
 * it), so nothing here animates in. No backdrop blur: nothing inside a moving
 * tile may carry one (see the header). It steps down with the stage's own
 * scale (`sm`, where --fill-scale moves from 0.62 to 0.8), so on a phone's
 * 50px tiles it stays a hint rather than a badge.
 */
function PeekMark({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden
      data-on={on ? "true" : "false"}
      className="pointer-events-none absolute top-1.5 left-1.5 flex size-4 items-center justify-center rounded-full bg-black/55 text-white opacity-0 transition-opacity duration-300 ease-emphasis data-[on=true]:opacity-100 motion-reduce:transition-none sm:size-5"
    >
      <Maximize2 className="size-2 sm:size-2.5" strokeWidth={2.5} />
    </span>
  );
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
  peek,
  marked,
}: {
  tile: AlbumTile;
  register: (key: string) => (el: HTMLElement | null) => void;
  reduced: boolean;
  sizes: string;
  stripMs: number;
  peek?: (request: PeekRequest) => void;
  /** Wears the corner mark (only ever the newest tile, and only with `peek`). */
  marked: boolean;
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
        className={cn(
          "relative size-full overflow-hidden rounded-tile bg-black/10",
          peek && "cursor-pointer",
        )}
        style={
          {
            "--i": 0,
            "--fly-x": "0px",
            "--fly-y": "-18px",
            "--fly-scale": "0.96",
          } as CSSProperties
        }
        onClick={
          peek ? (e) => peek(peekRequest(tile, e.currentTarget)) : undefined
        }
      >
        <Image
          src={m.src}
          alt=""
          fill
          sizes={sizes}
          // A press that drifts a pixel would start the browser's own image
          // drag and swallow the click.
          draggable={peek ? false : undefined}
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
        {peek && <PeekMark on={marked} />}
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
  peek,
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
  /** Makes every tile openable and marks the newest one (see the header). */
  peek?: (request: PeekRequest) => void;
  className?: string;
}) {
  const register = useFlip(view.layoutKey);
  // A 2-column grid folds the third column in: the product's phone album lays
  // two a row at its default step, and the fixtures are authored on three.
  const columns =
    cols === 3
      ? view.columns
      : [[...view.columns[0], ...view.columns[2]], view.columns[1]];

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
        className="overflow-hidden rounded-tile"
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
                  peek={peek}
                  marked={tile.key === view.newest}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
