"use client";

/**
 * WHAT SHE IS SENDING, WHERE SHE IS (red-team 56's MEDIUM, crumbs-85): the stack stands where her photograph will
 * land (the head of a newest-first album, the END of one in order), so a guest who sends from the head of an album in
 * order, or from deep in a newest-first one, could not see her progress or reach its Stop until it landed. Will's
 * standing rule is "immediate, or a clear state and a way to stop it", so while the stack is out of her sight this
 * stands in for it in view: the same photograph, the same count, the same bar, the same x, in one glass pill above
 * the foot's shutter.
 *
 * ★ A STAND-IN, NEVER A SECOND STACK. The stack in the rows keeps its slot (her photograph lands there, and the rows'
 * anchoring is laid around it); this is drawn only while that slot is out of sight, and it goes the moment she
 * scrolls the stack into view, or the pick ends. The words, the bar and the x are the stack's own
 * (`stack-tile.tsx`'s reading pane, `STOP_COPY`), and the x asks the stack's one question (`gallery-rows.tsx`).
 *
 * ★ AND IT STANDS BY WITH THE STACK (no-signal r1, `drop=standby`): while the line is gone its words and bar give way to
 * Standby's half-lit point and "No connection", the same photograph and x beside them, and no second count (the Add's
 * shoulder under it already says how many). A press on the photograph and its word opens what waits, as the stack's does.
 *
 * ★ DRAWN INTO THE DOCUMENT'S BODY, as the rows' news pill is (`album-window-news.tsx`): a fixed box inside the album
 * would be placed by any transformed ancestor, and the develop raises the album's rows with a transform. It stands
 * above the shutter's band (the dock is the album's foot, and the pill keeps clear of its Add), and a layer over the
 * album (the viewer, a dialog) hides it until it goes.
 */
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import { PickPreview } from "@/components/guest/upload/pick-preview";
import { READING_PANE } from "@/components/guest/upload/stack-tile";
import { WaitPoint } from "@/components/guest/upload/wait-point";
import { formatCount } from "@/lib/format/count";
import { GLASS, GLASS_MARK, GLASS_MARK_LIT } from "@/lib/glass";
import {
  NO_CONNECTION,
  SEE_WHAT_WAITS,
  waitingCount,
} from "@/lib/guest/unsent/words";
import { STOP_COPY } from "@/lib/upload/stop-upload";
import { cn } from "@/lib/utils";

export function SendingStandIn({
  doc,
  file,
  url,
  progress,
  remaining,
  onStop,
  standby = false,
  onOpenWaits,
}: {
  doc: Document;
  /** The file actually in the air, as the stack leads with it. */
  file: File;
  url: string;
  /** That file's own progress, 0-100. */
  progress: number;
  /** How many of this pick are still to go, this one included. */
  remaining: number;
  /** The stack's own x: ask whether to stop the file. Absent where it can no longer be stopped. */
  onStop?: () => void;
  /** The line dropped and the stack stands by: the point and "No connection" in the words' and the bar's place. */
  standby?: boolean;
  /** Her press on a send that stands by: what waits (the stack's own sheet). */
  onOpenWaits?: () => void;
}) {
  const words = remaining > 1 ? `${formatCount(remaining)} to go` : "Sending";
  const lead = (
    <>
      <span className="relative size-8 shrink-0 overflow-hidden rounded-full bg-black/20">
        <PickPreview
          file={file}
          url={url}
          fit="cover"
          className="absolute inset-0"
        />
      </span>
      {standby ? (
        <span
          className={cn(
            GLASS_MARK_LIT,
            "flex min-w-0 flex-1 items-center gap-1.5 text-reading font-medium",
          )}
        >
          <WaitPoint />
          <span data-stand-in-state="" className="truncate">
            {NO_CONNECTION}
          </span>
          {/* What the Add's shoulder shows, for whoever cannot see it. */}
          {remaining > 1 && (
            <span className="sr-only">, {waitingCount(remaining)}</span>
          )}
        </span>
      ) : null}
    </>
  );
  return createPortal(
    <div
      data-sending-stand-in=""
      className={cn(
        "pointer-events-none fixed inset-x-0 z-40 flex justify-center px-4",
        // Above the shutter's band: the cluster's foot padding, the shutter itself, and air.
        "bottom-[calc(6.25rem+env(safe-area-inset-bottom))]",
      )}
    >
      <div
        role="status"
        style={READING_PANE}
        className={cn(
          GLASS,
          "pointer-events-auto flex h-11 w-full max-w-72 items-center gap-2.5 rounded-full pr-1.5 pl-1.5 text-white",
          "animate-in duration-200 fade-in-0 slide-in-from-bottom-1 motion-reduce:animate-none",
        )}
      >
        {standby && onOpenWaits ? (
          // The photograph and its word are her way into what waits; the x beside them stays the stop.
          <button
            type="button"
            data-open-waits=""
            onClick={onOpenWaits}
            aria-label={`${NO_CONNECTION}. ${SEE_WHAT_WAITS}`}
            className="flex min-w-0 flex-1 focus-halo items-center gap-2.5 rounded-full text-left outline-none"
          >
            {lead}
          </button>
        ) : (
          lead
        )}
        {standby ? null : (
          <>
            <span
              className={cn(
                GLASS_MARK_LIT,
                "shrink-0 text-reading font-medium tabular-nums",
              )}
            >
              {words}
            </span>
            <span className="h-1 min-w-8 flex-1 overflow-hidden rounded-full bg-white/30">
              <span
                data-stand-in-progress
                className="block h-full rounded-full bg-white transition-[width] duration-200 ease-emphasis"
                style={{ width: `${progress}%` }}
              />
            </span>
          </>
        )}
        {onStop ? (
          <button
            type="button"
            data-stop-upload
            data-surface="photo"
            onClick={onStop}
            className={cn(
              GLASS_MARK,
              "relative flex size-8 shrink-0 focus-halo items-center justify-center rounded-full text-white transition-transform duration-150 ease-emphasis outline-none before:absolute before:-inset-1.5 before:content-[''] active:scale-[0.88] motion-reduce:active:scale-100",
            )}
          >
            <X
              aria-hidden
              className={cn(GLASS_MARK_LIT, "size-3.5")}
              strokeWidth={2.5}
            />
            <span className="sr-only">{STOP_COPY.stop}</span>
          </button>
        ) : (
          // The x's room kept, so the bar does not stretch the moment the bytes are up.
          <span aria-hidden className="size-8 shrink-0" />
        )}
      </div>
    </div>,
    doc.body,
  );
}
