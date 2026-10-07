"use client";

import { X } from "lucide-react";

import { PickPreview } from "@/components/guest/upload/pick-preview";
import { READING_PANE } from "@/components/guest/upload/stack-tile";
import { GLASS, GLASS_MARK, GLASS_MARK_LIT } from "@/lib/glass";
import { STOP_COPY } from "@/lib/upload/stop-upload";
import { cn } from "@/lib/utils";

import { UNSENT } from "./fixtures";
import { namedFile } from "./scene";
import { NO_CONNECTION, waitingCount } from "./words";

/**
 * THE SEND STANDING BY (the `standby` option): production's stack and its
 * stand-in, recomposed from their own markup (`stack-tile.tsx`,
 * `sending-stand-in.tsx`: the tile's box, its ghost edges, the reading pane,
 * the glass pill, the x), because production's pane has no slot for a state
 * of its own.
 *
 * ★ THE BAR GIVES WAY TO THE POINT. A photograph goes up as one PUT
 * (`part-plan.ts`: a single PUT under 100 MB), so one dropped at 38% goes
 * again from the start: a bar held at 38% would promise progress the line's
 * return throws away, and read as stuck (the creative director's pass). The
 * pane says the state alone, the half-lit point (Standby, no hue, in the
 * pane's own white) and "No connection", and under it ONE line: the carry's
 * promise in a few words, or, where nothing goes by itself, what she will do
 * once the line is back (never a press while the phone is offline: it could
 * only fail, crumbs-71). The promise lives on the send because it stays
 * there: a toast at a party is gone before a phone leaves a pocket (the
 * failure sheet's own reason for having none). The x stays (a waiting file can
 * still be stopped, as a sending one can).
 *
 * ★ THE STAND-IN IS THE PANE'S FIRST ROW: the same photograph, point, word and
 * x, and no second count, since the Add's shoulder under it already says how
 * many, as it does for production's own run.
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

/** The point and the state's word, lit for the glass they stand on. */
function StateWord({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        GLASS_MARK_LIT,
        "flex shrink-0 items-center gap-1.5 text-reading font-medium text-white",
        className,
      )}
    >
      <WaitPoint />
      <span data-ns-state-word="">{NO_CONNECTION}</span>
    </span>
  );
}

/** The stack at the album's head, standing by: her photo, the rest under it, the pane saying the line is gone. */
export function WaitingStack({
  remaining,
  note,
}: {
  remaining: number;
  /** The carry's promise in a few words, under the state (`paneNote`). */
  note: string;
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
          role="status"
          style={READING_PANE}
          data-ns-pane=""
          className={cn(
            GLASS_MARK,
            "absolute inset-x-0 bottom-0 flex flex-col gap-0.5 px-2 py-1.5",
          )}
        >
          <StateWord />
          <span
            data-ns-pane-note=""
            className={cn(GLASS_MARK_LIT, "text-working text-white/90")}
          >
            {note}
          </span>
          {/* How many, for whoever cannot see the ghost edges and the Add's shoulder. */}
          <span className="sr-only">, {waitingCount(remaining)}</span>
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

/** The stand-in above the foot, standing by: her photo, the point and "No connection", the x. */
export function WaitingPill({ remaining }: { remaining: number }) {
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
      <StateWord className="flex-1" />
      {/* What the Add's shoulder shows, for whoever cannot see it (the Add's own name says it too). */}
      <span className="sr-only">, {waitingCount(remaining)}</span>
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
        <span className="sr-only">{STOP_COPY.stop}</span>
      </span>
    </div>
  );
}
