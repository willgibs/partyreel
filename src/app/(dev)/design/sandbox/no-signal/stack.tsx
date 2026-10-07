"use client";

import { X } from "lucide-react";

import { PickPreview } from "@/components/guest/upload/pick-preview";
import { READING_PANE } from "@/components/guest/upload/stack-tile";
import { GLASS, GLASS_MARK, GLASS_MARK_LIT } from "@/lib/glass";
import { STOP_COPY } from "@/lib/upload/stop-upload";
import { cn } from "@/lib/utils";

import { UNSENT } from "./fixtures";
import { namedFile } from "./scene";
import { NO_SIGNAL, waitingCount } from "./words";

/**
 * THE SEND STANDING BY (the `standby` option): production's stack and its
 * stand-in, recomposed from their own markup (`stack-tile.tsx`,
 * `sending-stand-in.tsx`: the tile's box, its ghost edges, the reading pane,
 * the glass pill, the x), because production's pane has no slot for a state
 * of its own. ★ ONLY THE PANE'S WORDS AND ITS BAR CHANGE: the point half-lit
 * in the pane's own white (Standby, no hue), "No signal" where the count
 * stood, the bar held where it stopped at the run's white dimmed, and the x
 * still there (a waiting file can still be stopped, as a sending one can).
 */

/** The point, half-lit (`ns.css`): Standby's mark, in whatever ink stands around it. */
export function WaitPoint({
  className,
  lit,
  unlit,
}: {
  className?: string;
  lit?: boolean;
  unlit?: boolean;
}) {
  return (
    <span
      aria-hidden
      data-ns-point={lit ? "lit" : unlit ? "unlit" : "half"}
      data-lit={lit ? "" : undefined}
      data-unlit={unlit ? "" : undefined}
      className={cn("ns-point", className)}
    />
  );
}

const TILE_BOX =
  "relative mb-[var(--gap-gallery)] w-full overflow-hidden bg-black/10";

/** The stack at the album's head, standing by: her photo, the rest under it, the pane saying the line is gone. */
export function WaitingStack({
  progress,
  remaining,
  press,
}: {
  progress: number;
  remaining: number;
  /** Where nothing goes by itself, the pane carries her one press (`Try again`). */
  press?: string;
}) {
  const first = UNSENT[0]!;
  return (
    <div
      data-upload-stack
      data-ns-stack="standby"
      className="relative mb-[var(--gap-gallery)] h-full w-full pt-1.5 pr-1.5"
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
      <div
        data-media-tile
        data-lit=""
        className={cn(TILE_BOX, "h-full rounded-tile")}
      >
        <PickPreview
          file={namedFile(first.name)}
          url={first.still.src}
          fit="cover"
          className="absolute inset-0"
        />
        <div
          style={READING_PANE}
          data-ns-pane=""
          className={cn(
            GLASS_MARK,
            "absolute inset-x-0 bottom-0 flex flex-col gap-1.5 px-2 py-1.5",
          )}
        >
          <span
            className={cn(
              GLASS_MARK_LIT,
              "flex items-center gap-1.5 text-reading font-medium text-white",
            )}
          >
            <WaitPoint />
            <span data-ns-pane-words="">{NO_SIGNAL}</span>
          </span>
          <span className="h-1 w-full overflow-hidden rounded-full bg-white/30">
            <span
              data-pending-progress
              className="block h-full rounded-full bg-white/45"
              style={{ width: `${progress}%` }}
            />
          </span>
          {press ? (
            <span
              data-ns-pane-press=""
              className={cn(
                GLASS_MARK_LIT,
                "text-reading font-semibold text-white underline decoration-white/50 underline-offset-4",
              )}
            >
              {press}
            </span>
          ) : null}
        </div>
      </div>
      <button
        type="button"
        data-stop-upload
        data-surface="photo"
        tabIndex={-1}
        style={READING_PANE}
        className={cn(
          GLASS_MARK,
          "absolute top-0 right-0 flex size-6 items-center justify-center rounded-full text-white",
        )}
      >
        <X
          aria-hidden
          className={cn(GLASS_MARK_LIT, "size-3.5")}
          strokeWidth={2.5}
        />
        <span className="sr-only">{STOP_COPY.stop}</span>
      </button>
    </div>
  );
}

/** The stand-in above the foot, standing by: her photo, "No signal · 2 waiting", the held bar, the x. */
export function WaitingPill({
  progress,
  remaining,
}: {
  progress: number;
  remaining: number;
}) {
  const first = UNSENT[0]!;
  return (
    <div
      role="status"
      data-ns-pill="standby"
      style={READING_PANE}
      className={cn(
        GLASS,
        "pointer-events-auto flex h-11 w-full max-w-72 items-center gap-2.5 rounded-full pr-1.5 pl-1.5 text-white",
      )}
    >
      <span className="relative size-8 shrink-0 overflow-hidden rounded-full bg-black/20">
        <PickPreview
          file={namedFile(first.name)}
          url={first.still.src}
          fit="cover"
          className="absolute inset-0"
        />
      </span>
      <span
        className={cn(
          GLASS_MARK_LIT,
          "flex shrink-0 items-center gap-1.5 text-reading font-medium tabular-nums",
        )}
      >
        <WaitPoint />
        {NO_SIGNAL} · {waitingCount(remaining)}
      </span>
      <span className="h-1 min-w-6 flex-1 overflow-hidden rounded-full bg-white/30">
        <span
          className="block h-full rounded-full bg-white/45"
          style={{ width: `${progress}%` }}
        />
      </span>
      <span
        className={cn(
          GLASS_MARK,
          "relative flex size-8 shrink-0 items-center justify-center rounded-full text-white",
        )}
      >
        <X
          aria-hidden
          className={cn(GLASS_MARK_LIT, "size-3.5")}
          strokeWidth={2.5}
        />
      </span>
    </div>
  );
}
