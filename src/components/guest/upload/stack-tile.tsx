"use client";

/**
 * WHAT THIS DEVICE HAS SENT THAT IS NOT IN THE ALBUM YET — the two tiles that
 * stand at the album's head and nowhere else. Neither is a photograph in the
 * album: both are this browser's own knowledge, drawn on this browser only.
 *
 * ★ ONE PICK IS ONE OBJECT. The queue runs ONE file at a time, so twelve tiles
 * at the head of the album for twelve files would put eleven bars at zero across
 * half a phone's screen, showing a state nobody is in. The batch is a stack: the
 * file actually in the air on top, two ghost edges for the rest, and each
 * photograph leaving the stack for the album as its bytes land, so the count
 * falls to zero and the tile goes with it. A single file is a stack of one and
 * says no count at all.
 *
 * ★ THE PROBLEM IS READING IT, AND THE ANSWER IS THE STRIP, NOT A WASH. Text
 * over a photograph is hard to read without enough contrast. Rather than the
 * count centred under a wash over the whole photograph, everything the tile
 * SAYS lives in one strip at its foot — the count and the bar on the pane, the
 * photograph left alone above it — and the pane is dark enough to be read
 * (below).
 *
 * ★ THE EDGE IS TWO BOXES, NOT A SHADOW. Lift is kept for one object really
 * sitting on another, and this IS eleven photographs sitting under one.
 *
 * ★ BOTH TILES CARRY `data-lit`, AND THAT IS THE WHOLE POINT OF BINDING THEM TO
 * THE ALBUM'S RULE. A photograph must not gain or lose an edge at the moment it
 * finishes uploading, so these boxes wear the bright edge the landed tile wears
 * (`lit-edge-contract.test.ts` holds the closed list).
 */
import type { CSSProperties } from "react";
import { Clock } from "lucide-react";

import { PickPreview } from "@/components/guest/upload/pick-preview";
import { formatCount } from "@/lib/format/count";
import { GLASS_MARK, GLASS_MARK_LIT } from "@/lib/glass";
import { cn } from "@/lib/utils";

/**
 * THE PANE EVERYTHING AN IN-FLIGHT TILE SAYS IS READ ON.
 *
 * It is the ONE material at the marks' blur (`glass-mark`), re-pointing the one
 * knob the material exposes for exactly this: `--glass-tint`. A pane cannot make
 * white legible over a white sky by blurring it — a blur does not change the
 * mean luminance under a pill, which is globals.css's own note — so the tint is
 * what does the work and it is MEASURED rather than chosen: Crystal's
 * brightness(0.68) under a black tint at 0.34, over the brightest possible
 * photograph (a pure white frame), puts white at 4.78:1, clear of the 4.5:1
 * floor. At 0.04 (the material's own tint, for chrome you look THROUGH) the same
 * white reads 2.42:1, and a plain black/45 wash reads 3.35:1 — which is why text
 * on one is hard to read.
 *
 * This is not a second treatment: it re-points one token exactly as the
 * `glass-mark` utility itself re-points `--glass-blur`, so the tint, the edges
 * and the backdrop are still the material's. The glyphs also carry the lane's
 * own halo (`glass-mark-lit`), which costs nothing over a dark photograph and is
 * the belt over a bright one.
 */
const READING_PANE = { "--glass-tint": "0.34" } as CSSProperties;

/** The album tile's box, worn by anything standing at the album's head. */
const TILE_BOX =
  "relative mb-[var(--gap-gallery)] w-full overflow-hidden bg-black/10";

export function UploadStackTile({
  file,
  url,
  progress,
  remaining,
}: {
  /** The file actually in the air (the queue runs one at a time). */
  file: File;
  /** Its object URL, owned by the album's in-flight ledger. */
  url: string;
  /** That file's own progress, 0-100. */
  progress: number;
  /** How many of this pick are still to go, this one included. */
  remaining: number;
}) {
  return (
    <div
      data-upload-stack
      className="relative mb-[var(--gap-gallery)] w-full pt-1.5 pr-1.5"
    >
      {remaining > 1 && (
        <>
          <div
            aria-hidden
            className="absolute top-0 right-0 h-full w-[calc(100%-6px)] rounded-tile bg-muted-foreground/25"
          />
          <div
            aria-hidden
            className="absolute top-[3px] right-[3px] h-full w-[calc(100%-6px)] rounded-tile bg-muted-foreground/40"
          />
        </>
      )}
      <div data-media-tile data-lit="" className={cn(TILE_BOX, "rounded-tile")}>
        <PickPreview file={file} url={url} fit="natural" />
        <div
          style={READING_PANE}
          className={cn(
            GLASS_MARK,
            "absolute inset-x-0 bottom-0 flex items-center gap-2 px-2 py-1.5",
          )}
        >
          {remaining > 1 && (
            <span
              data-stack-count
              className={cn(
                GLASS_MARK_LIT,
                "shrink-0 text-reading font-medium text-white tabular-nums",
              )}
            >
              {formatCount(remaining)} to go
            </span>
          )}
          <span className="h-1 flex-1 overflow-hidden rounded-full bg-white/30">
            <span
              data-pending-progress
              className="block h-full rounded-full bg-white transition-[width] duration-200 ease-emphasis"
              style={{ width: `${progress}%` }}
            />
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * A HELD PHOTOGRAPH THAT WAITS IN PLACE, as clear and clean as it can be.
 *
 * A finished upload on a hold-for-approval event sits at the album's head until
 * the host lets it in. Without the tile, one toast and the photograph is gone,
 * which reads as a failure, and the standing banner says the same sentence
 * whether or not anything of theirs is waiting.
 *
 * ★ ONLY THIS DEVICE EVER SEES IT. It is the guest's own pending row, which the
 * album's poll returns to nobody: the host's approval is what puts it in the
 * album for real, and the tile is replaced by the real one the moment the poll
 * carries it. Nothing here asserts anything to the server.
 *
 * ★ CLEANER IS: THE PHOTOGRAPH, LIGHTLY DIMMED, AND ONE LINE, rather than a wash
 * with a clock centred on top. The picture stays a picture, the clock is a mark
 * like every other mark a tile carries, and the sentence is on the same reading
 * pane the stack uses — one grammar for everything a tile in flight says. No
 * button: there is nothing for a guest to do about it.
 */
export function WaitingTile({ file, url }: { file: File; url: string }) {
  return (
    <div
      data-waiting-tile
      data-media-tile
      data-lit=""
      className={cn(TILE_BOX, "rounded-tile")}
    >
      <div className="opacity-65">
        <PickPreview file={file} url={url} fit="natural" />
      </div>
      <span
        aria-hidden
        style={READING_PANE}
        className={cn(
          GLASS_MARK,
          "absolute top-1.5 left-1.5 flex size-6 items-center justify-center rounded-full",
        )}
      >
        <Clock className={cn(GLASS_MARK_LIT, "size-3.5 text-white")} />
      </span>
      <p
        style={READING_PANE}
        className={cn(
          GLASS_MARK,
          "absolute inset-x-0 bottom-0 px-2 py-1.5 text-center text-reading",
        )}
      >
        <span className={cn(GLASS_MARK_LIT, "text-white")}>
          Waiting for the host
        </span>
      </p>
    </div>
  );
}
