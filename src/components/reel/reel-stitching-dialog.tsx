"use client";

import { Clapperboard, RotateCcw, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

/**
 * The composer's export-progress state when the CLIENT encodes (WebCodecs): the parent drives the
 * stages; this dialog only renders them.
 */
export type ReelEncodeState =
  | { stage: "encoding"; progress: number } // 0..1 from encodeReel's onProgress
  | { stage: "uploading" }
  | { stage: "error" };

/**
 * The reel export progress modal. The reel is encoded ON-DEVICE (WebCodecs): the composer drives the
 * stages (encoding with real progress, then the R2 upload) and closing the dialog cancels via
 * onOpenChange (the composer aborts). No polling and no async render service — the work is local, and
 * the composer's finalize call flips the reel to ready synchronously. (The old dormant poll mode +
 * its /api/reel/render GET route were pruned 2026-07-08 with the Lambda/Remotion teardown.)
 */
export function ReelStitchingDialog({
  open,
  onOpenChange,
  onRetry,
  encode,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Re-kick the export (the composer's Download handler) after a failure. */
  onRetry: () => void;
  /** The parent-driven encode stage (the composer always supplies it). */
  encode: ReelEncodeState;
}) {
  const errored = encode.stage === "error";
  const title = errored
    ? "Couldn't create your video"
    : encode.stage === "uploading"
      ? "Finishing up"
      : "Creating your video";
  const description = errored
    ? "Something went wrong on our side. Please try again."
    : encode.stage === "uploading"
      ? "Your video is ready. We're storing a copy so your next download is instant."
      : "Your reel is encoding right here in your browser. This usually takes a few seconds.";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-3 py-4">
          {errored ? (
            <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
              <TriangleAlert className="size-7 text-destructive" />
            </div>
          ) : (
            // A reel-violet clapperboard inside a spinning ring (on-brand, beats a generic spinner).
            <div className="relative flex size-16 items-center justify-center">
              <span
                aria-hidden
                className="absolute inset-0 animate-spin rounded-full border-2 border-reel/20 border-t-reel"
                style={{ animationDuration: "0.9s" }}
              />
              <Clapperboard className="size-7 text-reel" />
            </div>
          )}

          {/* The client encode has REAL progress (frame-accurate from the encoder) — show it. */}
          {encode.stage === "encoding" && (
            <div className="flex w-full items-center gap-2">
              <Progress
                value={Math.round(encode.progress * 100)}
                aria-label="Encoding progress"
                className="[&_[data-slot=progress-indicator]]:bg-reel"
              />
              <span className="w-9 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
                {Math.round(encode.progress * 100)}%
              </span>
            </div>
          )}
        </div>

        {errored && (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button onClick={onRetry}>
              <RotateCcw />
              Try again
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
