"use client";

import { Clapperboard, RotateCcw, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

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

// The dormant poll interval (see the JSDoc): if a reel is ever left in 'processing', poll the render
// status route until the .mp4 lands. 3s keeps it responsive without hammering.
const POLL_MS = 3000;

/**
 * The composer's export-progress state when the CLIENT encodes (WebCodecs): the parent drives the
 * stages; this dialog only renders them. `null`/absent = the dormant poll mode below.
 */
export type ReelEncodeState =
  | { stage: "encoding"; progress: number } // 0..1 from encodeReel's onProgress
  | { stage: "uploading" }
  | { stage: "error" };

/**
 * The reel export progress modal. The composer always opens it in CLIENT-ENCODE mode (`encode` set):
 * the on-device WebCodecs export surface, where the composer drives the stages (encoding with real
 * progress, then the R2 upload) and closing the dialog cancels via onOpenChange (the composer aborts).
 * No polling; the work is local, and the composer's finalize call flips the reel to ready synchronously.
 *
 * The `encode`-absent branch is a DORMANT resilience path: it polls the render status route
 * (/api/reel/render GET) until a 'processing' reel lands, then auto-downloads + closes. Nothing enters
 * it today (the client encode finalizes synchronously); it's kept as a safety net wired to that route.
 */
export function ReelStitchingDialog({
  eventId,
  open,
  onOpenChange,
  onReady,
  onRetry,
  encode,
}: {
  eventId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Hand the finished reel's presigned download URL to the trigger (the composer downloads it). */
  onReady: (downloadUrl: string) => void;
  /** Re-kick the export (the composer's Download handler) after a failure. */
  onRetry: () => void;
  /** Client-encode mode: the parent-driven stage. Omit/null for the dormant poll mode. */
  encode?: ReelEncodeState | null;
}) {
  const clientMode = encode != null;
  const [phase, setPhase] = useState<"stitching" | "error">("stitching");
  // Reset to "stitching" whenever the modal (re)opens — the React-idiomatic "adjust state when a prop
  // changes" pattern (a setState during render, which React resolves without an extra commit), so we
  // don't reset inside the effect. onReady/onOpenChange are stable (useCallback / setState), so the
  // poll loop below never re-arms spuriously.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setPhase("stitching");
  }

  useEffect(() => {
    // Client-encode mode does no polling: the composer owns the pipeline end to end.
    if (!open || clientMode) return;
    let cancelled = false;

    const tick = async () => {
      try {
        const res = await fetch(
          `/api/reel/render?eventId=${encodeURIComponent(eventId)}`,
          { cache: "no-store" },
        );
        const data = await res.json();
        if (cancelled) return;
        if (data?.status === "ready" && data.downloadUrl) {
          onReady(data.downloadUrl);
          toast.success("Your reel is ready.");
          onOpenChange(false);
        } else if (data?.status === "error") {
          setPhase("error");
        }
        // 'processing' | 'idle' → keep waiting (idle can briefly precede the row flip).
      } catch {
        /* transient network blip — keep polling */
      }
    };

    void tick();
    const id = setInterval(tick, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [open, clientMode, eventId, onReady, onOpenChange]);

  const errored = clientMode ? encode.stage === "error" : phase === "error";
  const title = errored
    ? clientMode
      ? "Couldn't create your video"
      : "Couldn't render your reel"
    : clientMode
      ? encode.stage === "uploading"
        ? "Finishing up"
        : "Creating your video"
      : "Stitching your reel";
  const description = errored
    ? "Something went wrong on our side. Please try again."
    : clientMode
      ? encode.stage === "uploading"
        ? "Your video is ready. We're storing a copy so your next download is instant."
        : "Your reel is encoding right here in your browser. This usually takes a few seconds."
      : "This takes about a minute. You can close this and come back, your reel keeps rendering.";

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
          {clientMode && encode.stage === "encoding" && (
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
            <Button
              onClick={() => {
                setPhase("stitching");
                onRetry();
              }}
            >
              <RotateCcw />
              Try again
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
