"use client";

/**
 * WHAT THIS DEVICE IS SENDING — the one tile that stands at the album's head
 * and nowhere else. It is not a photograph in the album: it is this browser's
 * own knowledge, drawn on this browser only.
 *
 * ★ A HELD PHOTOGRAPH DRAWS NOTHING HERE (`voice-guest` r2, Will's
 * `held=uploads`): once its bytes are in, a photograph the host is still
 * deciding on shows only in her uploads (`upload-tracker.tsx`), the badge
 * beside Add counting it, and the album shows only what is in it.
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
 * ★ THE x STOPS THE FILE IN THE AIR (upload-cancel, E6 for uploads). Round glass on the photograph's own corner, the
 * material every control on a photograph wears and the reading pane's own tint, overhanging the tile's edge as the
 * review step's remove does, with a 44px target around its 24px. It only asks: the question and what follows are
 * `stop-upload.ts`'s, drawn on the toast, because a tile this small has no room to ask on. Absent once the file
 * can no longer be stopped (its bytes are up and its complete is coming).
 *
 * ★ THE TILE CARRIES `data-lit`, AND THAT IS THE WHOLE POINT OF BINDING IT TO
 * THE ALBUM'S RULE. A photograph must not gain or lose an edge at the moment it
 * finishes uploading, so this box wears the bright edge the landed tile wears
 * (`lit-edge-contract.test.ts` holds the closed list).
 */
import type { CSSProperties, Ref } from "react";
import { X } from "lucide-react";

import { PickPreview } from "@/components/guest/upload/pick-preview";
import { formatCount } from "@/lib/format/count";
import { GLASS_MARK, GLASS_MARK_LIT } from "@/lib/glass";
import { STOP_COPY } from "@/lib/upload/stop-upload";
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
export const READING_PANE = { "--glass-tint": "0.34" } as CSSProperties;

/** The album tile's box, worn by what stands at the album's head. */
const TILE_BOX =
  "relative mb-[var(--gap-gallery)] w-full overflow-hidden bg-black/10";

export function UploadStackTile({
  file,
  url,
  progress,
  remaining,
  onStop,
  ref,
}: {
  /** The file actually in the air (the queue runs one at a time). */
  file: File;
  /** Its object URL, owned by the album's in-flight ledger. */
  url: string;
  /** That file's own progress, 0-100. */
  progress: number;
  /** How many of this pick are still to go, this one included. */
  remaining: number;
  /** Her x on this file: ask whether to stop it. Absent where it can no longer be stopped, and then no x is drawn. */
  onStop?: () => void;
  /** The stack's own box, for whoever watches whether she can see it (`gallery-rows.tsx`'s stand-in). */
  ref?: Ref<HTMLDivElement>;
}) {
  return (
    <div
      ref={ref}
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
        {/* ROADMAP's landscape head-slot line (`voice-r2`): this slot is a NOMINAL square
            (`album-window-plan.ts`'s `HEAD_RATIO`, "the one that crops either orientation
            least" — cropping is the plan, not a bug here), so the photograph covers it rather
            than sitting at its own natural height and leaving a grey band under a landscape
            file. `absolute inset-0` (not a plain child): the row layout forces this tile's own
            height onto `data-media-tile` from the OUTSIDE (`album-window.tsx`'s
            `[&_[data-media-tile]]:h-full`), and a plain block child does not inherit a
            percentage height through this parent otherwise. */}
        <PickPreview
          file={file}
          url={url}
          fit="cover"
          className="absolute inset-0"
        />
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
      {onStop && (
        <button
          type="button"
          data-stop-upload
          onClick={onStop}
          style={READING_PANE}
          className={cn(
            GLASS_MARK,
            "absolute top-0 right-0 flex size-6 items-center justify-center rounded-full text-white transition-transform duration-150 ease-emphasis outline-none before:absolute before:-inset-2.5 before:content-[''] focus-visible:ring-2 focus-visible:ring-white/70 active:scale-[0.88] motion-reduce:active:scale-100",
          )}
        >
          <X
            aria-hidden
            className={cn(GLASS_MARK_LIT, "size-3.5")}
            strokeWidth={2.5}
          />
          <span className="sr-only">{STOP_COPY.stop}</span>
        </button>
      )}
    </div>
  );
}
